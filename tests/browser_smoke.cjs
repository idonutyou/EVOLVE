const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const dist=path.resolve(__dirname,'../dist'),out=path.resolve(__dirname,'../test-results');fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html','.js':'application/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost'),p=path.resolve(dist,'.'+(u.pathname==='/'?'/index.html':u.pathname));if(!p.startsWith(dist+path.sep)||!fs.existsSync(p)||!fs.statSync(p).isFile()){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');if(u.pathname.startsWith('/assets/'))res.setHeader('Cache-Control','public,max-age=31536000,immutable');fs.createReadStream(p).pipe(res);});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:393,height:852},deviceScaleFactor:1,isMobile:true,hasTouch:true}),page=await context.newPage();
 const report={checks:[],maps:[],errors:[],failed:[]};page.on('pageerror',e=>report.errors.push(e.stack||e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))report.failed.push({url:r.url(),status:r.status()});});
 try{
  await page.addInitScript(()=>{if(!localStorage.getItem('EVOLVE_V574_TEST_META_V1'))localStorage.setItem('EVOLVE_V574_TEST_META_V1',JSON.stringify({dna:1234,stage:26,unlockedStageV522:31,homeStageV522:26,clears:30,origin:'acid',feedback:{graphics:'eco',sound:false,haptic:false}}));});
  await page.goto(`http://127.0.0.1:${server.address().port}/?evolveQA=1`,{waitUntil:'domcontentloaded',timeout:180000});
  await page.waitForFunction(()=>window.__EVOLVE_TEST_MODULE_V575__?.read().ready&&!document.getElementById('start').disabled&&!document.getElementById('webLoader'),null,{timeout:180000});
  assert.equal(await page.evaluate(()=>window.__EVOLVE_ASSET_ERROR__||null),null);
  // The V575 floor-visibility source intentionally grants access to all 99 stages.
  const initial=await page.evaluate(()=>JSON.parse(localStorage.getItem('EVOLVE_V575_TEST_META_V1')));assert.equal(initial.dna,1234);assert.equal(initial.unlockedStageV522,99);assert.equal(initial.origin,'acid');report.checks.push('boot and prior-version save migration');
  assert.deepEqual(report.errors,[],'Game startup raised a JavaScript exception');
  await page.screenshot({path:path.join(out,'mobile-home.png')});
  await page.locator('#start').click();await page.locator('[data-contract="exterminate"]').click();await page.locator('[data-weapon="arm"]').click();
  await page.waitForFunction(()=>window.__EVOLVE_TEST_MODULE_V575__.read().running,null,{timeout:30000});
  const before=await page.evaluate(()=>{const p=window.__EVOLVE_TEST_MODULE_V575__.test.context().player;return{x:p.x,y:p.y};});
  await page.mouse.move(180,660);await page.mouse.down();await page.mouse.move(250,620,{steps:8});await page.waitForTimeout(650);await page.mouse.up();
  const after=await page.evaluate(()=>{const p=window.__EVOLVE_TEST_MODULE_V575__.test.context().player;return{x:p.x,y:p.y};});assert.ok(Math.hypot(after.x-before.x,after.y-before.y)>1,'Joystick movement failed');
  await page.locator('#pauseBtn').click();assert.equal(await page.evaluate(()=>window.__EVOLVE_TEST_MODULE_V575__.read().paused),true);await page.locator('#resume').click();report.checks.push('mobile movement, pause and resume');
  await page.waitForFunction(()=>window.__EVOLVE_LIGHTNING_V576__?.read().atlasReady,null,{timeout:30000});
  await page.evaluate(async()=>{await window.__EVOLVE_TEST_MODULE_V575__.add(50);});
  await page.waitForFunction(()=>window.__EVOLVE_TEST_MODULE_V575__.test.context().enemies.filter(e=>!e.dead&&!e.finalBoss).length>=3,null,{timeout:30000});
  const lightning=await page.evaluate(()=>{
   const api=window.__EVOLVE_LIGHTNING_V576__,c=window.__EVOLVE_TEST_MODULE_V575__.test.context(),targets=c.enemies.filter(e=>!e.dead&&!e.finalBoss).slice(0,3);api.test.reset();c.player.inv=10;
   const spots=[];for(let radius=40;radius<=110&&spots.length<3;radius+=20)for(let i=0;i<16&&spots.length<3;i++){const angle=i*Math.PI/8,x=c.player.x+Math.cos(angle)*radius,y=c.player.y+Math.sin(angle)*radius;if(c.clear({x,y},14))spots.push({x,y});}if(spots.length<3)throw Error('No walkable lightning fixture positions');
   targets.forEach((e,i)=>Object.assign(e,{...spots[i],hp:10000,maxHp:10000,arrivalInvuln:false,spawnFx:0,stunned:2}));
   if(!api.test.cast(false))throw Error('Campaign lightning could not reach nearby targets');
   api.test.step(.08);const early=targets.every(e=>e.hp===10000);api.test.step(.006);const target=targets.find(e=>e.hp<10000);if(!target)throw Error('Lightning contact did not reach campaign hurtEnemy');
   const hold=api.test.hold(target),pose=api.test.pose(target),hp=target.hp;api.test.damage(target,999,'tail');const blocked=target.hp===hp;
   c.keys.d=true;c.joy.active=false;const x=c.player.x,y=c.player.y;c.step(.016);delete c.keys.d;const moved=Math.hypot(c.player.x-x,c.player.y-y)>.05;
   const result={early,hold,pose:!!pose,blocked,moved,stop:api.read().globalHitStop,contacts:api.read().contacts,atlas:api.read().atlasReady,weapon:api.read().weapon};
   api.test.reset();return result;
  });
  assert.ok(lightning.early&&lightning.hold&&lightning.pose&&lightning.blocked&&lightning.moved&&lightning.atlas);assert.equal(lightning.stop,0);assert.equal(lightning.weapon,'lightning');assert.ok(lightning.contacts>0);report.lightning=lightning;report.checks.push('campaign lightning atlas, anticipation, real damage pipeline, local reaction with player movement and disabled other attacks');
  assert.equal(await page.locator('#abilityName').textContent(),'강화전격');
  await page.screenshot({path:path.join(out,'lightning-campaign.png')});

  await page.waitForFunction(()=>window.__EVOLVE_MONSTER_MOTION_V577__?.read().atlasReady&&window.__EVOLVE_MONSTER_MOTION_V577__.read().cachedFrames===40,null,{timeout:30000});
  const monsterMotion=await page.evaluate(()=>{
   const api=window.__EVOLVE_MONSTER_MOTION_V577__,c=window.__EVOLVE_TEST_MODULE_V575__.test.context(),e=c.enemies.find(e=>!e.dead&&!e.finalBoss);if(!e)throw Error('Motion fixture enemy missing');
   const surfaces={};for(const type of api.read().referenceTypes){const a=api.test.surface(type,0),b=api.test.surface(type,1),attack=api.test.surface(type,3);surfaces[type]=a!==b&&a.toDataURL()!==b.toDataURL()&&a.toDataURL()!==attack.toDataURL()&&a.width===b.width&&a.height===b.height}
   const builds=api.read().gpuAtlasBuilds,originalType=e.type;e.type='brute';e.visualSetV516='base';
   api.test.forceWalk(e,0);const key0=api.test.gpuKey(e);c.draw();const gpu0=document.getElementById('game').toDataURL();
   api.test.forceWalk(e,1);const key1=api.test.gpuKey(e);c.draw();const gpu1=document.getElementById('game').toDataURL();
   const gpuEnabled=api.read().gpuEnabled,gpuWas=api.test.gpu(false);
   api.test.forceWalk(e,0);c.draw();const cpu0=document.getElementById('game').toDataURL();api.test.forceWalk(e,1);c.draw();const cpu1=document.getElementById('game').toDataURL();api.test.gpu(gpuWas);
   e.telegraphing='bruteSlam';const windup=api.test.frame(e);e.telegraphing=null;e.arcShockV576={age:0,life:.32};const hurt=api.test.frame(e);delete e.arcShockV576;e.type=originalType;
   const originals={};for(const appearance of api.read().paintedOriginalTypes){e.type=appearance.replace('legacy_','');e.visualSetV516=appearance.startsWith('legacy_')?'legacy':'base';api.test.forceWalk(e,0);c.draw();const a=document.getElementById('game').toDataURL();api.test.forceWalk(e,1);c.draw();const b=document.getElementById('game').toDataURL();api.test.gpu(false);api.test.forceWalk(e,0);c.draw();const ca=document.getElementById('game').toDataURL();api.test.forceWalk(e,1);c.draw();const cb=document.getElementById('game').toDataURL();api.test.gpu(gpuWas);originals[appearance]={gpu:a!==b,canvas:ca!==cb};}e.type=originalType;e.visualSetV516='base';
   const result={surfaces,originals,gpuEnabled,gpuFramesDiffer:gpu0!==gpu1,canvasFramesDiffer:cpu0!==cpu1,key0,key1,windup,hurt,cachedFrames:api.read().cachedFrames,noTextureRebuildDuringDraw:api.read().gpuAtlasBuilds===builds};c.draw();return result;
  });
  assert.equal(Object.keys(monsterMotion.surfaces).length,10);assert.ok(Object.values(monsterMotion.surfaces).every(Boolean));assert.equal(Object.keys(monsterMotion.originals).length,6);assert.ok(Object.values(monsterMotion.originals).every(x=>x.gpu&&x.canvas));assert.ok(monsterMotion.gpuEnabled&&monsterMotion.gpuFramesDiffer&&monsterMotion.canvasFramesDiffer&&monsterMotion.noTextureRebuildDuringDraw);assert.notEqual(monsterMotion.key0,monsterMotion.key1);assert.equal(monsterMotion.windup,3);assert.equal(monsterMotion.hurt,3);assert.equal(monsterMotion.cachedFrames,40);report.monsterMotion=monsterMotion;report.checks.push('all 10 appearances use distinct painted walk/action frames; all six original appearances render changing GPU and Canvas frames; no per-frame texture rebuild');
  await page.screenshot({path:path.join(out,'monster-motion-campaign.png')});
  const poseGallery=await page.evaluate(()=>{const api=window.__EVOLVE_MONSTER_MOTION_V578__,names=api.read().paintedOriginalTypes,c=document.createElement('canvas');c.width=840;c.height=names.length*190;const g=c.getContext('2d');g.fillStyle='#10151b';g.fillRect(0,0,c.width,c.height);for(let row=0;row<names.length;row++){g.fillStyle='#dbe5e9';g.font='bold 14px sans-serif';g.fillText(names[row],12,row*190+20);for(let frame=0;frame<4;frame++){const s=api.test.surface(names[row],frame),scale=155/Math.max(s.width,s.height);g.drawImage(s,frame*210+(210-s.width*scale)/2,row*190+30+(155-s.height*scale),s.width*scale,s.height*scale);}}return c.toDataURL('image/png').split(',')[1];});fs.writeFileSync(path.join(out,'legacy-monster-poses.png'),Buffer.from(poseGallery,'base64'));
  console.log(JSON.stringify({checkpoint:'monster-motion',originals:monsterMotion.originals,cachedFrames:monsterMotion.cachedFrames,noTextureRebuildDuringDraw:monsterMotion.noTextureRebuildDuringDraw}));

  await page.route('**/version.json?check=*',r=>r.fulfill({status:200,contentType:'application/json',body:'{"build":"synthetic-next-version"}'}));await page.evaluate(()=>window.dispatchEvent(new Event('online')));await page.waitForTimeout(250);assert.equal(await page.locator('#webUpdate').isVisible(),false);assert.equal(await page.evaluate(()=>window.__EVOLVE_TEST_MODULE_V575__.read().running),true);
  await page.evaluate(()=>window.__EVOLVE_TEST_MODULE_V575__.test.context().home('battle'));await page.waitForFunction(()=>!document.getElementById('webUpdate').hidden,null,{timeout:10000});await page.unroute('**/version.json?check=*');report.checks.push('update waits for home without interrupting combat');
  const maps=await page.evaluate(()=>window.__EVOLVE_TEST_MODULE_V575__.test.definitions().map(m=>({id:m.id,stages:m.stages})));
  for(const m of maps){
   const approvedCount={facility1:345,hub:63,biolab:72}[m.id];
   if(approvedCount)await page.evaluate(id=>{localStorage.removeItem('EVOLVE_V575_TEST_'+id+'_COLLISION_EDITS_V1');localStorage.removeItem('EVOLVE_V575_TEST_'+id+'_COLLISION_DRAFT_V1');},m.id);
   await page.evaluate(async m=>window.__EVOLVE_TEST_MODULE_V575__.go(m.stages[0],m.id,false),m);
   await page.waitForFunction(()=>window.__EVOLVE_TEST_MODULE_V575__.read().ready,null,{timeout:60000});
   const s=await page.evaluate(()=>window.__EVOLVE_TEST_MODULE_V575__.read());assert.equal(s.map,m.id);report.maps.push(m.id);
   if(approvedCount){
    const fieldBefore=await page.evaluate(async()=>{const e=window.__EVOLVE_MAP_TEST_V562__.test.editor,f=e.field(),b=e.baseField();let differences=0;for(let i=0;i<f.length;i+=7)if(f[i]!==b[i])differences++;return {operations:window.__EVOLVE_MAP_TEST_V562__.read().editor.activeOperations,differences,hash:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',f.buffer))).map(x=>x.toString(16).padStart(2,'0')).join('')};});
    assert.equal(fieldBefore.operations,approvedCount);assert.ok(fieldBefore.differences>0,'Approved collision field was not applied');
    await page.evaluate(id=>{const d={...window.__EVOLVE_WEB_DATA__.APPROVED_MAP_EDITS_V575[id],operations:[]};localStorage.setItem('EVOLVE_V575_TEST_'+id+'_COLLISION_EDITS_V1',JSON.stringify(d));localStorage.setItem('EVOLVE_V575_TEST_'+id+'_COLLISION_DRAFT_V1',JSON.stringify(d));},m.id);
    await page.evaluate(async m=>window.__EVOLVE_TEST_MODULE_V575__.go(m.stages[0],m.id,false),m);
    await page.waitForFunction(()=>window.__EVOLVE_TEST_MODULE_V575__.read().ready,null,{timeout:60000});
    assert.equal(await page.evaluate(()=>window.__EVOLVE_MAP_TEST_V562__.read().editor.activeOperations),approvedCount);
    await page.locator('#homeMapEditV562').click();
    await page.waitForFunction(()=>!window.__EVOLVE_MAP_TEST_V562__.test.editor.read().busy,null,{timeout:60000});
    assert.equal(await page.evaluate(()=>window.__EVOLVE_MAP_TEST_V562__.test.editor.read().work.operations.length),approvedCount,'Old empty draft hid the approved default');
    if(!await page.locator('#meFilesV562').evaluate(el=>el.open))await page.locator('#meFilesV562 > summary').click();
    await page.locator('#meResetV562').click();
    await page.waitForFunction(()=>!window.__EVOLVE_MAP_TEST_V562__.test.editor.read().busy,null,{timeout:60000});
    const resetDoc=await page.evaluate(()=>window.__EVOLVE_MAP_TEST_V562__.test.editor.read().work);
    const expectedDoc=await page.evaluate(id=>window.__EVOLVE_WEB_DATA__.APPROVED_MAP_EDITS_V575[id],m.id);
    assert.deepEqual(resetDoc.operations,expectedDoc.operations);assert.deepEqual(resetDoc.entrances,expectedDoc.entrances);
    await page.locator('#meApplyV562').click();
    await page.waitForFunction(()=>document.getElementById('mapEditorV562').hidden&&!window.__EVOLVE_MAP_TEST_V562__.test.editor.read().busy,null,{timeout:60000});
    const fieldAfter=await page.evaluate(async()=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',window.__EVOLVE_MAP_TEST_V562__.test.editor.field().buffer))).map(x=>x.toString(16).padStart(2,'0')).join(''));
    assert.equal(fieldAfter,fieldBefore.hash,'Default-map reset changed the approved collision field');
    if(m.id==='biolab'){
     await page.locator('#homeMapEditV562').click();await page.waitForFunction(()=>!window.__EVOLVE_MAP_TEST_V562__.test.editor.read().busy,null,{timeout:60000});
     await page.locator('#meUnderV575').click();
     const stroke=await page.evaluate(()=>{const e=window.__EVOLVE_MAP_TEST_V562__.test.editor;let x=432,y=768;const f=e.baseField();outer:for(let yy=80;yy<1456;yy+=8)for(let xx=60;xx<804;xx+=8)if(f[yy*2*1728+xx*2]<-320){x=xx;y=yy;break outer;}if(e.underpass().tool!=='under')throw Error('Underpass tool did not select');const stroke={mode:'under',radius:28,points:[[x,y],[x+2,y]]};e.paint(stroke);return stroke;});
     await page.locator('#meUndoV562').click();await page.waitForFunction(()=>!window.__EVOLVE_MAP_TEST_V562__.test.editor.read().busy);assert.equal(await page.evaluate(()=>window.__EVOLVE_MAP_TEST_V562__.test.editor.read().work.operations.at(-1).mode==='under'),false);
     await page.locator('#meRedoV562').click();await page.waitForFunction(()=>!window.__EVOLVE_MAP_TEST_V562__.test.editor.read().busy);assert.equal(await page.evaluate(()=>window.__EVOLVE_MAP_TEST_V562__.test.editor.read().work.operations.at(-1).mode),'under');
     await page.evaluate(async()=>{const e=window.__EVOLVE_MAP_TEST_V562__.test.editor;const exported=e.exportText();await e.importText(exported);if(e.read().work.operations.at(-1).mode!=='under')throw Error('Underpass export/import lost data');});
     await page.locator('#meApplyV562').click();await page.waitForFunction(()=>document.getElementById('mapEditorV562').hidden&&!window.__EVOLVE_MAP_TEST_V562__.test.editor.read().busy,null,{timeout:60000});
     const under=await page.evaluate(stroke=>{const e=window.__EVOLVE_MAP_TEST_V562__.test.editor,q=e.underpass(),x=stroke.points[0][0],y=stroke.points[0][1],l=q.layer;if(!l)throw Error('Overhead layer missing');const px=Math.floor((x*1.25-l.l)/l.w*l.canvas.width),py=Math.floor((y*1.25-l.t)/l.h*l.canvas.height);const alpha=l.canvas.getContext('2d').getImageData(px,py,1,1).data[3];const context=window.__EVOLVE_TEST_MODULE_V575__.test.context();context.player.x=x*1.25;context.player.y=y*1.25;const canvas=document.createElement('canvas');canvas.width=canvas.height=10;const g=canvas.getContext('2d');g.fillStyle='#ff00ff';g.fillRect(0,0,10,10);g.translate(5-x*1.25,5-y*1.25);q.draw(g);const color=Array.from(g.getImageData(5,5,1,1).data);return {alpha,color,field:e.field()[y*2*1728+x*2],before:q.builds,after:e.underpass().builds,stored:JSON.parse(localStorage.getItem(e.keys.active)).operations.at(-1).mode};},stroke);
     assert.ok(under.alpha>0);assert.ok(under.field>0,'Underpass collision was not opened');assert.notDeepEqual(under.color,[255,0,255,255],'Foreground did not cover the actor color');assert.equal(under.before,under.after,'Underpass rebuilt during draw');assert.equal(under.stored,'under');report.checks.push('underpass actual tool, undo/redo, JSON roundtrip, saved walkable field, foreground occlusion and cached drawing');
    }
    report.checks.push(m.id+': approved default without storage, old empty saves/drafts, actual reset button and identical applied collision field');
   }
  }report.checks.push('all five maps load');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('EVOLVE_V575_TEST_META_V1')));await page.reload({waitUntil:'domcontentloaded',timeout:180000});await page.waitForFunction(()=>window.__EVOLVE_TEST_MODULE_V575__?.read().ready&&!document.getElementById('start').disabled,null,{timeout:180000});const next=await page.evaluate(()=>JSON.parse(localStorage.getItem('EVOLVE_V575_TEST_META_V1')));assert.equal(next.dna,saved.dna);assert.equal(next.unlockedStageV522,saved.unlockedStageV522);assert.equal(next.origin,saved.origin);report.checks.push('reload preserves save');
  await page.setViewportSize({width:915,height:412});const bounds=await page.locator('#game').boundingBox();assert.ok(bounds.width>0&&bounds.height>0&&bounds.height<=413);await page.screenshot({path:path.join(out,'landscape.png')});report.checks.push('landscape layout');assert.deepEqual(report.errors,[]);assert.deepEqual(report.failed,[]);report.success=true;
 }catch(e){report.success=false;report.failure=e.stack;await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});throw e;}
 finally{fs.writeFileSync(path.join(out,'browser-smoke.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();server.close();}
})().catch(e=>{console.error(e.stack);server.close();process.exitCode=1;});


