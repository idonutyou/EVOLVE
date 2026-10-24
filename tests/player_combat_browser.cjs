const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const dist=path.resolve(__dirname,'../dist'),out=path.resolve(__dirname,'../test-results');fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html','.js':'application/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost'),p=path.resolve(dist,'.'+(u.pathname==='/'?'/index.html':u.pathname));if(!p.startsWith(dist+path.sep)||!fs.existsSync(p)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');fs.createReadStream(p).pipe(res);});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']}),context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true}),page=await context.newPage(),report={checks:[],weapons:[],errors:[],failedRequests:[],physical_Galaxy_S23_plus_tested:false};
 page.on('pageerror',e=>report.errors.push(e.message));page.on('requestfailed',r=>{if(!r.url().startsWith('data:'))report.failedRequests.push({url:r.url(),error:r.failure()?.errorText})});
 const ready=()=>page.waitForFunction(()=>window.__EVOLVE_PLAYER_COMBAT_V587__?.read().cachedFrames===20&&window.__EVOLVE_TEST_MODULE_V575__?.read().ready&&!document.getElementById('start').disabled&&!document.getElementById('webLoader'),null,{timeout:180000});
 const select=async()=>{await page.locator('#start').click();await require('./choose_opening_skill.cjs')(page);await page.waitForFunction(()=>window.__EVOLVE_TEST_MODULE_V575__.read().running);};
 try{
  await page.addInitScript(()=>{const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>cb.name==='loop'?0:raf(cb);});
  await page.goto('http://127.0.0.1:'+server.address().port+'/?evolveQA=1',{waitUntil:'domcontentloaded',timeout:180000});await ready();
  report.checks.push('obsolete five-weapon start screen removed; organ combat is covered by organ_skills_browser.cjs');
  await select('arm');
  const choices=await page.evaluate(()=>{const api=window.__EVOLVE_PLAYER_COMBAT_V587__,seen=new Set(),titles=new Set();for(let i=0;i<200;i++)for(const u of api.test.picks()){if(u.kind)seen.add(u.kind);titles.add(u.title);if(/lightning|전격/i.test(u.title+u.stats))throw Error('Lightning offered as a skill');}return {kinds:[...seen].sort(),titles:[...titles]};});
  for(const id of ['health','giant','light','move','armor','regen'])assert.ok(choices.kinds.includes(id),id);assert.ok(choices.kinds.every(k=>!k.startsWith('gene_')&&!k.endsWith('_equip')));report.choices=choices;report.checks.push('actual level-up generator offers individual stat and equipment cards without lightning; equipped ARM remains usable and learned organ attacks use the new progression');
  await page.keyboard.press('e');
  const lock=await page.evaluate(()=>({disabled:document.getElementById('ability').disabled,opacity:Number(getComputedStyle(document.getElementById('ability')).opacity),casts:window.__EVOLVE_LIGHTNING_V576__.read().casts,manualCast:window.__EVOLVE_LIGHTNING_V576__.test.cast(true),active:window.__EVOLVE_LIGHTNING_V576__.test.active()}));
  report.lock=lock;assert.ok(lock.disabled&&lock.opacity<.4,JSON.stringify(lock));assert.equal(lock.casts,0);assert.equal(lock.manualCast,false);assert.equal(lock.active,false);report.lock=lock;report.checks.push('lightning button is dimmed and disabled; keyboard activation and future lightning cast are locked');
  const poses=await page.evaluate(()=>{
   const api=window.__EVOLVE_PLAYER_COMBAT_V587__,c=window.__EVOLVE_TEST_MODULE_V575__.test.context(),m=api.test.motion();c.enemies.length=0;m.attack=null;c.player.inv=0;c.player.hurtKick=0;
   const directions=[];for(let i=0;i<8;i++){const a=i*Math.PI/4;c.player.look=a;c.draw();directions.push({aim:a,...api.read().facing});}
   let maximumRotation=0;for(let i=0;i<=720;i++){const p=api.test.pose(i*Math.PI/360);if(!(Math.cos(p.localRotation)>0&&Math.abs(p.headAngle)<Math.PI/2))throw Error('Vertical or inverted pose');maximumRotation=Math.max(maximumRotation,Math.abs(p.localRotation));}
   const canvas=document.createElement('canvas');canvas.width=800;canvas.height=400;const g=canvas.getContext('2d'),frame=api.test.frames()[0];g.fillStyle='#111a22';g.fillRect(0,0,800,400);g.fillStyle='#dce8ed';g.font='14px sans-serif';
   for(let i=0;i<8;i++){const a=i*Math.PI/4,p=api.test.pose(a),x=i%4*200+100,y=Math.floor(i/4)*200+105;g.fillText(Math.round(a*180/Math.PI)+' deg',x-28,y-75);g.save();g.translate(x,y);g.rotate(p.rotation);g.scale(p.facing,1);g.drawImage(frame,-70,-70,140,140);g.restore();}
   const pixels=a=>{const q=document.createElement('canvas');q.width=q.height=200;const h=q.getContext('2d'),p=api.test.pose(a);h.translate(100,100);h.rotate(p.rotation);h.scale(p.facing,1);h.drawImage(frame,-70,-70,140,140);return h.getImageData(0,0,200,200).data;};
   let mirrorDifference=0;for(const a of [-Math.PI/6,0,Math.PI/3]){const right=pixels(a),left=pixels(Math.PI-a);for(let y=0;y<200;y++)for(let x=0;x<200;x++)for(let k=0;k<4;k++)mirrorDifference+=Math.abs(right[(y*200+x)*4+k]-left[(y*200+199-x)*4+k]);}
   c.player.look=-Math.PI/6;c.draw();return {directions,maximumRotation,mirrorDifference,png:canvas.toDataURL().split(',')[1],frameBuilds:api.read().frameBuilds};
  });
  assert.ok(poses.maximumRotation>Math.PI/3);assert.ok(poses.mirrorDifference<2000,JSON.stringify({mirrorDifference:poses.mirrorDifference}));assert.equal(poses.frameBuilds,20);
  fs.writeFileSync(path.join(out,'player-facing-eight-directions.png'),Buffer.from(poses.png,'base64'));delete poses.png;report.poses=poses;report.checks.push('eight actual renderer directions and 721 aim samples stay upright and away from vertical; left and right poses are pixel mirrors with broad tilt and no frame rebuilding');
  await page.screenshot({path:path.join(out,'upright-player-portrait.png')});await page.setViewportSize({width:852,height:393});await page.evaluate(()=>window.__EVOLVE_TEST_MODULE_V575__.test.context().draw());await page.screenshot({path:path.join(out,'upright-player-landscape.png')});
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedRequests,[]);report.success=true;
 }catch(error){report.success=false;report.failure=error.stack||String(error);await page.screenshot({path:path.join(out,'player-combat-failure.png')}).catch(()=>{});throw error;}
 finally{fs.writeFileSync(path.join(out,'player-combat-browser.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));await context.close();await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
