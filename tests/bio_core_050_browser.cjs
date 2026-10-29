'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const dist=path.resolve(__dirname,'../dist'),out=path.resolve(__dirname,'../test-results');fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html','.css':'text/css','.js':'application/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff':'font/woff','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost'),p=path.resolve(dist,'.'+(u.pathname==='/'?'/index.html':u.pathname));if(!p.startsWith(dist+path.sep)||!fs.existsSync(p)||!fs.statSync(p).isFile()){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');fs.createReadStream(p).pipe(res);});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser,context,page;
 const report={checks:[],errors:[],failedRequests:[],physical_Galaxy_S23_plus_tested:false};
 try{
  browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
  context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:1,serviceWorkers:'block'});
  await context.addInitScript(()=>{
   const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>cb.name==='loop'?0:raf(cb);
   if(!localStorage.getItem('EVOLVE_V575_TEST_META_V1'))localStorage.setItem('EVOLVE_V575_TEST_META_V1',JSON.stringify({dna:417,hp:2,dmg:1,stage:4,unlockedStageV522:4,homeStageV522:3}));
   if(!localStorage.getItem('EVOLVE_V575_TEST_NORMAL_PROGRESS_V585'))localStorage.setItem('EVOLVE_V575_TEST_NORMAL_PROGRESS_V585',JSON.stringify({version:1,unlocked:4,stage:3}));
   if(!localStorage.getItem('EVOLVE_SHOP_EXPERIENCE_V621_V1'))localStorage.setItem('EVOLVE_SHOP_EXPERIENCE_V621_V1',JSON.stringify({schema:'evolve.shop.experience.v621.v1',revision:8,crystals:275,firstPurchase:true,owned:{resonance:true},orders:{},passMonths:{},dailyClaims:{},rewardClaims:{},missionClaims:{}}));
   localStorage.setItem('EVOLVE_V575_TEST_V413_HD_APPLIED','1');localStorage.setItem('EVOLVE_V575_TEST_V200_SAVE_PRESERVE_DONE','1');
  });
  page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('requestfailed',r=>{if(!r.url().startsWith('data:'))report.failedRequests.push({url:r.url(),error:r.failure()?.errorText});});
  await page.goto('http://127.0.0.1:'+server.address().port+'/?evolveQA=1',{waitUntil:'domcontentloaded',timeout:180000});
  // Stop immediately on a known asset/bootstrap failure rather than timing out for 180s.
  await page.waitForFunction(()=>{
   const bio=window.__EVOLVE_BIOCORE_V625__?.read();
   const loader=window.EVOLVE_WEB_CLIENT?.read?.();
   const retry=document.getElementById('webRetry');
   if(bio?.loadError||loader?.failed||retry&&!retry.hidden)return true;
   return bio?.ready&&window.__EVOLVE_TEST_MODULE_V575__?.read()?.ready&&!document.getElementById('start')?.disabled&&!document.getElementById('webLoader');
  },null,{timeout:180000});
  const bootFault=await page.evaluate(()=>({character:window.__EVOLVE_BIOCORE_V625__?.read().loadError||null,loaderFailed:window.EVOLVE_WEB_CLIENT?.read?.().failed||false,status:document.getElementById('webStatus')?.textContent||''}));
  assert.ok(!bootFault.character&&!bootFault.loaderFailed,'Character bootstrap failed: '+JSON.stringify(bootFault));
  if(process.env.AUTO_MAP_ONLY==='1'){
   report.maps=[];
   for(const stage of [20,25,20,4])report.maps.push(await page.evaluate(async stage=>{
    const ok=await window.__EVOLVE_MAPS_V567__.test.select(stage),a=window.__EVOLVE_AUTO_AMBIENT_V627__.read();
    return {stage,ok,map:a.map,luma:a.luma,filter:a.filter,samples:a.samples,failures:a.failures};
   },stage));
   assert.deepEqual(report.maps.map(x=>x.map),['facility1','facility2','facility1','infected']);
   assert.ok(report.maps.every(x=>x.ok&&x.failures===0));
   assert.equal(report.maps[2].samples,report.maps[1].samples,'returning to an earlier map should reuse its sample');
   assert.notEqual(report.maps[0].filter,report.maps[1].filter,'different maps should have distinct light');
   assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedRequests,[]);
   report.checks.push('Focused rerun: real map changes, cache reuse and original-map fallback');report.success=true;return;
  }
  report.boot=await page.evaluate(()=>({bio:window.__EVOLVE_BIOCORE_V625__.read(),save:JSON.parse(localStorage.getItem('EVOLVE_V575_TEST_META_V1')),progress:JSON.parse(localStorage.getItem('EVOLVE_V575_TEST_NORMAL_PROGRESS_V585')),shop:JSON.parse(localStorage.getItem('EVOLVE_SHOP_EXPERIENCE_V621_V1')),mode:window.__EVOLVE_ARM_ITEMS_V589__.read().mode}));
  assert.equal(report.boot.bio.character,'red-flesh-core');assert.equal(report.boot.bio.legs,4);assert.equal(report.boot.bio.reference,'07c980cb3b4476f241deb1a40bc07a1cd6be070d5cc0d3ba0c529244c26bc42d');
  assert.equal(report.boot.save.dna,417);assert.equal(report.boot.progress.unlocked,4);assert.equal(report.boot.shop.crystals,275);assert.equal(report.boot.shop.owned.resonance,true);assert.equal(report.boot.mode,'bare');
  report.checks.push('Latest game boots with red core; existing progress, currency and cosmetic ownership retained');
  await page.screenshot({path:path.join(out,'biocore-home-050.png')});
  report.equip=await page.evaluate(()=>{
   const a=window.__EVOLVE_BIOCORE_V625__,arms=window.__EVOLVE_ARM_ITEMS_V589__,parts=window.__EVOLVE_PARTS_V523__;
   const plain=a.test.preview('bare',384).toDataURL();parts.equip('arm_cannon');const gun=a.test.preview('cannon',384).toDataURL();
   return {mode:arms.read().mode,worn:parts.snapshot().worn.arm,distinct:plain!==gun,source:arms.test.art().items.cannon.left.path,body:plain,gun};
  });
  assert.equal(report.equip.mode,'cannon');assert.equal(report.equip.worn,'arm_cannon');assert.ok(report.equip.distinct);assert.equal(report.equip.source,require('../web/bio-core-art-v625.json').gun.path);
  fs.writeFileSync(path.join(out,'biocore-bare-050.png'),Buffer.from(report.equip.body.split(',')[1],'base64'));fs.writeFileSync(path.join(out,'biocore-cannon-050.png'),Buffer.from(report.equip.gun.split(',')[1],'base64'));delete report.equip.body;delete report.equip.gun;
  report.checks.push('Existing single equipment slot produces paired compact weapons on the new core');
  const mutantArt=require('../web/player-mutant-art-v599.json');
  report.weaponPose=await page.evaluate(({sourceScale,displaySize,surface})=>{
   const bio=window.__EVOLVE_BIOCORE_V625__,arms=window.__EVOLVE_ARM_ITEMS_V589__,size=384;
   const a=bio.test.art(),unit=sourceScale*displaySize/surface;
   const fit=Math.min(size*.75/(a.width*unit),size*.75/(a.height*unit));
   const result={};
   for(const mode of ['cannon','blades']){
    const spec=arms.test.art().items[mode],images=arms.test.images()[mode],draws=[];
    const original=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
     if(this.canvas.width===size&&(image===images.left||image===images.right)){
      const side=draws.length===0?'right':'left',part=spec[side],t=this.getTransform();
      const reflection=mode==='blades'&&side==='right'?-1:1;
      const raw=Math.atan2(t.b,t.a)+reflection*part.native_angle;
      draws.push({side,scale:args[2]/(part.width*spec.world_scale*fit),angle:Math.atan2(Math.sin(raw),Math.cos(raw))});
     }
     return original.call(this,image,...args);
    };
    let canvas;try{canvas=bio.test.preview(mode,size);}finally{CanvasRenderingContext2D.prototype.drawImage=original;}
    const px=canvas.getContext('2d').getImageData(0,0,size,size).data;let edgePixels=0;
    for(let i=0;i<size;i++)for(const [x,y] of [[i,0],[i,size-1],[0,i],[size-1,i]])if(px[(y*size+x)*4+3])edgePixels++;
    result[mode]={draws,edgePixels,png:canvas.toDataURL()};
   }
   return result;
  },mutantArt);
  for(const mode of ['cannon','blades']){
   const pose=report.weaponPose[mode];
   fs.writeFileSync(path.join(out,`weapon-pose-${mode}.png`),Buffer.from(pose.png.split(',')[1],'base64'));delete pose.png;
   assert.equal(pose.draws.length,2,`${mode} should draw a pair`);
   for(const draw of pose.draws){assert.ok(Math.abs(draw.scale-1.5)<1e-6,`${mode} scale must be 1.5`);assert.ok(Math.abs(draw.angle+.08)<1e-6,`${mode} should tilt slightly upward`);}
   assert.equal(pose.edgePixels,0,`${mode} preview must not be clipped`);
  }
  report.checks.push('Cannon and blade pairs render at 1.5 scale, raised, without preview clipping');
  await page.locator('#start').click();await require('./choose_opening_skill.cjs')(page);await page.waitForFunction(()=>window.__EVOLVE_TEST_MODULE_V575__.read().running);
  report.tail=await page.evaluate(()=>{
   const c=window.__EVOLVE_ORGAN_SKILLS_V598__.test.context(),bio=window.__EVOLVE_BIOCORE_V625__,actor=window.__EVOLVE_TEST_MODULE_V575__.test.context();
   c.player.inv=999;c.state.tail=0;actor.draw();const none=bio.read().tailVisible;c.state.tail=1;actor.draw();const acquired=bio.read().tailVisible;c.state.tail=0;actor.draw();const removed=bio.read().tailVisible;
   return {none,acquired,removed,mode:bio.read().mode,renders:bio.read().renders};
  });
  assert.equal(report.tail.none,false);assert.equal(report.tail.acquired,true);assert.equal(report.tail.removed,false);assert.equal(report.tail.mode,'cannon');assert.ok(report.tail.renders>=3);
  report.checks.push('Tail appears only when the existing tail skill is active');
  report.ambient=await page.evaluate(()=>{
   const ambient=window.__EVOLVE_AUTO_AMBIENT_V627__,scene=window.__EVOLVE_TEST_MODULE_V575__.test.context();
   const profile=ambient.read();scene.draw();scene.draw();const again=ambient.read();
   const warm=ambient.test.profileFromPixels(new Uint8ClampedArray([170,95,60,255,170,95,60,255]));
   const cool=ambient.test.profileFromPixels(new Uint8ClampedArray([60,95,170,255,60,95,170,255]));
   return {profile,again,warm,cool};
  });
  assert.ok(report.ambient.profile.filter.startsWith('brightness('));
  assert.equal(report.ambient.profile.samples,report.ambient.again.samples,'same map should use cached sample');
  assert.ok(report.ambient.again.shadowBuilds>0,'character silhouette shadow must be built');
  assert.notEqual(report.ambient.warm.hue,report.ambient.cool.hue,'warm and cool maps produce distinct light');
  assert.ok(report.ambient.warm.brightness>=.85&&report.ambient.warm.brightness<=.96);
  report.checks.push('Automatic ambient sample is bounded and cached; silhouette shadow is generated');
  report.coreLighting=await page.evaluate(()=>{
   const api=window.__EVOLVE_DEV_MOCK_STORE_V615__,bridge=window.__EVOLVE_DEV_CORE_BRIDGE_V617__;
   if(!api||!bridge)return {available:false};
   const store=api.createStore({enabled:true,storage:localStorage}),id='dev_local_profile_01';
   store.simulatePurchase('appearance_unlock_01',id,'auto_core_test_001');
   store.simulatePurchase('mutation_crystal_mid',id,'auto_core_test_002');
   store.redeemCosmetic(id,'dev_core_theme_02','auto_core_test_003');
   const results=[];
   for(const theme of ['dev_core_theme_01','dev_core_theme_02']){
    store.equip(id,'core',theme);bridge.sync();const filters=[];
    const old=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
     if(image instanceof HTMLCanvasElement&&image.width===192&&image.height===192&&this.globalCompositeOperation==='screen')filters.push(this.filter);
     return old.call(this,image,...args);
    };
    try{window.__EVOLVE_TEST_MODULE_V575__.test.context().draw();}finally{CanvasRenderingContext2D.prototype.drawImage=old;}
    results.push({theme,selected:bridge.read().theme,filters,expected:window.__EVOLVE_AUTO_AMBIENT_V627__.read().filter});
   }
   return {available:true,results};
  });
  assert.equal(report.coreLighting.available,true,'existing core renderer should be available');
  for(const item of report.coreLighting.results){assert.equal(item.selected,item.theme);assert.ok(item.filters.includes(item.expected),`${item.theme} must inherit map light`);}
  report.checks.push('Both equipped core themes inherit the same automatic map light');
  report.maps=[];
  for(const stage of [20,25,20,4]){
   report.maps.push(await page.evaluate(async stage=>{
    const ok=await window.__EVOLVE_MAPS_V567__.test.select(stage);
    const a=window.__EVOLVE_AUTO_AMBIENT_V627__.read();
    return {stage,ok,map:a.map,luma:a.luma,filter:a.filter,samples:a.samples,failures:a.failures};
   },stage));
  }
  assert.deepEqual(report.maps.map(x=>x.map),['facility1','facility2','facility1','infected']);
  assert.ok(report.maps.every(x=>x.ok&&x.failures===0));
  assert.equal(report.maps[2].samples,report.maps[1].samples,'returning to an earlier map should reuse its sample');
  assert.notEqual(report.maps[0].filter,report.maps[1].filter,'different maps should have distinct light');
  report.checks.push('Two real maps and the original map select and reuse the appropriate ambient sample');
  await page.screenshot({path:path.join(out,'biocore-battle-050.png')});
  await page.setViewportSize({width:852,height:393});await page.evaluate(()=>window.__EVOLVE_TEST_MODULE_V575__.test.context().draw());await page.screenshot({path:path.join(out,'biocore-battle-landscape-050.png')});
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedRequests,[]);report.success=true;
 }catch(error){report.success=false;report.failure=error.stack||String(error);if(page)await page.screenshot({path:path.join(out,'biocore-failure-050.png')}).catch(()=>{});process.exitCode=1;}
 finally{fs.writeFileSync(path.join(out,'biocore-050-browser.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));await context?.close();await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
