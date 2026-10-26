const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const dist=path.resolve(__dirname,'../dist'),out=path.resolve(__dirname,'../test-results');fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html','.css':'text/css','.js':'application/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost'),p=path.resolve(dist,'.'+(u.pathname==='/'?'/index.html':u.pathname));if(!p.startsWith(dist+path.sep)||!fs.existsSync(p)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');fs.createReadStream(p).pipe(res);});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']}),context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true}),page=await context.newPage(),report={checks:[],errors:[],failedRequests:[],physical_Galaxy_S23_plus_tested:false};
 page.on('pageerror',e=>report.errors.push(e.message));page.on('requestfailed',r=>{if(!r.url().startsWith('data:'))report.failedRequests.push({url:r.url(),error:r.failure()?.errorText})});
 try{
  await page.addInitScript(()=>{const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>cb.name==='loop'?0:raf(cb);});
  await page.goto('http://127.0.0.1:'+server.address().port+'/?evolveQA=1',{waitUntil:'domcontentloaded',timeout:180000});
  await page.waitForFunction(()=>window.__EVOLVE_ORIGINAL_PLAYER_V588__?.read().frameBuilds===20&&window.__EVOLVE_TEST_MODULE_V575__?.read().ready&&!document.getElementById('start').disabled&&!document.getElementById('webLoader'),null,{timeout:180000});
  report.art=await page.evaluate(async()=>{const api=window.__EVOLVE_ORIGINAL_PLAYER_V588__,r=api.read(),data=await (await fetch(r.source)).arrayBuffer();return {...r,downloadedBytes:data.byteLength,downloadedHash:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data))).map(x=>x.toString(16).padStart(2,'0')).join(''),previewWidth:document.getElementById('partsSpecimenImgV523').naturalWidth};});
  assert.equal(report.art.sha256,'40df7f6cb18401d39c83fd51360ab080516e10cf3c27bc966756299817f1c6d9');assert.equal(report.art.downloadedHash,report.art.sha256);assert.equal(report.art.downloadedBytes,343244);assert.equal(report.art.redrawn,false);assert.equal(report.art.previewWidth,1536);assert.equal(report.art.frameCacheBytes,20*384*384*4);assert.ok(report.art.minimumTriangleAreaRatio>.1);
  report.checks.push('the actual supplied 1536px original PNG is used byte-for-byte; no generative redraw; detailed 1536px parts preview and the existing 20-frame game cache allocation');
  const identity=await page.evaluate(()=>{
   const api=window.__EVOLVE_ORIGINAL_PLAYER_V588__,art=api.test.art(),native=api.test.native(),c=document.createElement('canvas');c.width=c.height=1536;const g=c.getContext('2d');g.drawImage(api.test.source(),0,0);const n=native.getContext('2d'),result={};
   for(const name of ['near_arm','far_arm','core','fixed']){
    const ids=new Set(art.groups[name]),offset=name==='fixed'?[0,0]:art.anatomy_offsets[name],samples=[];
    for(const tri of art.triangles){if(!tri.every(i=>ids.has(i)))continue;const x=Math.round(tri.reduce((s,i)=>s+art.points[i][0],0)/3),y=Math.round(tri.reduce((s,i)=>s+art.points[i][1],0)/3);if(x<10||y<10||x>1520||y>1520)continue;
     const a=g.getImageData(x-3,y-3,7,7).data,b=n.getImageData(x+offset[0]-3,y+offset[1]-3,7,7).data;let error=0,count=0,lit=0;
     for(let i=0;i<a.length;i+=4){if(Math.max(a[i],a[i+1],a[i+2])<35)continue;lit++;if(b[i+3]<250)continue;for(let j=0;j<3;j++)error+=Math.abs(a[i+j]-b[i+j]);count+=3;}
     if(lit>35&&count>100)samples.push({x,y,error:error/count});
    }
    result[name]={offset,samples:samples.filter(s=>s.error<3).slice(0,6),bestError:Math.min(...samples.map(s=>s.error))};
   }
   const frames=window.__EVOLVE_PLAYER_SCORPION_V586__.test.frames(),unique=new Set(frames.map(f=>f.toDataURL())).size,preview=native.toDataURL().split(',')[1];
   const gallery=document.createElement('canvas');gallery.width=800;gallery.height=1000;const h=gallery.getContext('2d');h.fillStyle='#111a22';h.fillRect(0,0,800,1000);frames.forEach((f,i)=>h.drawImage(f,i%4*200,Math.floor(i/4)*200,200,200));
   return {parts:result,unique,preview,gallery:gallery.toDataURL().split(',')[1]};
  });
  for(const [name,v] of Object.entries(identity.parts))assert.ok(v.samples.length>=1,JSON.stringify({name,v}));assert.equal(identity.unique,20);assert.deepEqual(identity.parts.near_arm.offset,[60,40]);assert.deepEqual(identity.parts.far_arm.offset,[60,40]);assert.deepEqual(identity.parts.core.offset,[-24,-18]);
  fs.writeFileSync(path.join(out,'original-player-anatomy.png'),Buffer.from(identity.preview,'base64'));fs.writeFileSync(path.join(out,'original-player-motion-gallery.png'),Buffer.from(identity.gallery,'base64'));delete identity.preview;delete identity.gallery;report.identity=identity;report.checks.push('actual pixel patches of both forelimbs translate forward 60/40 source pixels and the core moves back 24/18; unchanged body texture matches the supplied image; all twenty native poses are distinct');
  await page.screenshot({path:path.join(out,'original-player-home-portrait.png')});await page.locator('#homeLabTab').click();assert.equal(await page.locator('#partsSpecimenImgV523').evaluate(e=>e.naturalWidth),1536);await page.locator('#homeBattleTabV522').click();
  await page.locator('#start').click();await require('./choose_opening_skill.cjs')(page);await page.waitForFunction(()=>window.__EVOLVE_TEST_MODULE_V575__.read().running);
  const play=await page.evaluate(()=>{const c=window.__EVOLVE_TEST_MODULE_V575__.test.context(),api=window.__EVOLVE_PLAYER_SCORPION_V586__;c.player.inv=999;c.keys.d=true;for(let i=0;i<30;i++)c.step(.05);delete c.keys.d;c.player.look=-.35;c.draw();const before=api.read().frameBuilds;for(let i=0;i<12;i++)c.draw();return {level:c.player.level,moving:api.read().moving,before,after:api.read().frameBuilds,lightning:window.__EVOLVE_LIGHTNING_V576__.read().casts,admin:window.__EVOLVE_ADMIN_MODE_V585__.read().enabled};});
  assert.equal(play.level,1);assert.ok(play.moving);assert.equal(play.before,20);assert.equal(play.after,20);assert.equal(play.lightning,0);assert.equal(play.admin,false);assert.equal(await page.locator('#ability').isDisabled(),true);report.play=play;report.checks.push('normal level-one play uses the same original creature, movement poses remain cached during real rendering, administrator UI stays hidden and future lightning stays disabled');
  await page.screenshot({path:path.join(out,'original-player-battle-portrait.png')});await page.setViewportSize({width:852,height:393});await page.evaluate(()=>window.__EVOLVE_TEST_MODULE_V575__.test.context().draw());await page.screenshot({path:path.join(out,'original-player-battle-landscape.png')});
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedRequests,[]);report.success=true;
 }catch(error){report.success=false;report.failure=error.stack||String(error);await page.screenshot({path:path.join(out,'original-player-failure.png')}).catch(()=>{});throw error;}
 finally{fs.writeFileSync(path.join(out,'original-player-browser.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));await context.close();await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
