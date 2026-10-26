const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const dist=path.resolve(__dirname,'../dist'),out=path.resolve(__dirname,'../test-results');fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost'),p=path.resolve(dist,'.'+(u.pathname==='/'?'/index.html':u.pathname));if(!p.startsWith(dist+path.sep)||!fs.existsSync(p)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');fs.createReadStream(p).pipe(res);});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const live=process.env.EVOLVE_TEST_BASE_URL,base=live||'http://127.0.0.1:'+server.address().port+'/';
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']}),context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true}),page=await context.newPage();
 const name=live?'organ-hits-live':'organ-hits-local',report={live:!!live,checks:[],errors:[],failedRequests:[],physical_Galaxy_S23_plus_tested:false};
 page.on('pageerror',e=>report.errors.push(e.message));page.on('requestfailed',r=>{if(!r.url().startsWith('data:'))report.failedRequests.push(r.url());});
 const ready=()=>page.waitForFunction(()=>window.__EVOLVE_ORGAN_HITS_V613__?.read().imageReady.spike&&window.__EVOLVE_ORGAN_HITS_V613__?.read().imageReady.tail&&!document.getElementById('start').disabled&&!document.getElementById('webLoader'),null,{timeout:180000});
 try{
  await page.addInitScript(()=>{const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>cb.name==='loop'?0:raf(cb);});
  const url=new URL(base);url.searchParams.set('evolveQA','1');await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:180000});await ready();
  report.version=await page.evaluate(()=>window.EVOLVE_WEB_CONFIG);const expected=JSON.parse(fs.readFileSync(path.join(dist,'version.json'),'utf8'));assert.equal(report.version.version,expected.version);assert.equal(report.version.build,expected.build);
  await page.locator('#homeLabTab').click();await page.locator('#partsGridV523 [data-part-id="arm_cannon"]').click();await page.locator('#partsDetailEquipV523').click();await page.locator('#homeBattleTabV522').click();
  await page.locator('#start').click();await require('./choose_opening_skill.cjs')(page);await page.waitForFunction(()=>window.__EVOLVE_TEST_MODULE_V575__.read().running);
  await page.evaluate(()=>{
   const a=window.__EVOLVE_ORGAN_SKILLS_V598__.test,c=a.context(),native=window.__EVOLVE_TEST_MODULE_V575__.test.context(),api=window.__EVOLVE_ORGAN_HITS_V613__,roster=window.__EVOLVE_MONSTER_CATALOG_V593__.list();
   const template=window.__EVOLVE_STARTUP_V595__.test.spawn(roster.find(e=>e.id==='crawler'));if(!template)throw Error('No real enemy fixture');
   let angle=null;for(let i=0;i<72;i++){const q=i*Math.PI/36,points=[26,65,115].map(d=>({x:c.player.x+Math.cos(q)*d,y:c.player.y+Math.sin(q)*d}));if(points.every(p=>native.clear(p,12)&&a.context().lineClear(c.player,p,4))){angle=q;break;}}if(angle===null)throw Error('No clear organ corridor');
   window.__ORGAN_HIT_FIXTURE_V613__={angle,fresh:(organ,distance)=>{
    a.clear();api.test.reset();window.__EVOLVE_WEAPON_HITS_V612__.test.reset();const ctx=a.context();for(const k of ['arm','shell','mouth','tail','wing','leg'])ctx.state[k]=0;ctx.player.inv=999;ctx.player.hp=ctx.player.maxHp=10000;
    const e={...template,x:ctx.player.x+Math.cos(angle)*distance,y:ctx.player.y+Math.sin(angle)*distance,hp:100000,maxHp:100000,dead:false,type:'crawler',r:10,spd:0,arrivalTime:0,arrivalInvuln:false,_mapBirthLockedV562:false,barrier:0,prism:0,elite:false,eliteArmor:0,nemesis:false,zoneElite:false,midBoss:false,finalBoss:false,stagger:0,staggerLock:999,kx:0,ky:0};ctx.enemies.splice(0,ctx.enemies.length,e);ctx.grid();
    if(organ)window.__EVOLVE_UPGRADE_CARDS_V593__.test.apply(organ+'_learn',0);for(const k of ['shell','tail','mouth'])a.context().cooldowns[k]=999;return {a,ctx:a.context(),e,api};
   }};
  });
  report.spike=await page.evaluate(()=>{
   const {a,ctx,e,api}=window.__ORGAN_HIT_FIXTURE_V613__.fresh('shell',80);if(!a.cast('shell'))throw Error('Spike did not cast');
   for(let i=0;i<90&&e.hp===100000;i++)a.step(.01);
   window.__EVOLVE_MAPS_V567__.test.context().step(.016);ctx.draw();window.__LAST_ORGAN_HIT_V613__=e;
   return {damage:100000-e.hp,pose:api.test.pose(e),feedback:api.read(),events:window.EVOLVE_HIT_EVENTS.read()};
  });
  assert.ok(report.spike.damage>0&&report.spike.feedback.spike>0&&report.spike.feedback.drawn>0);assert.equal(report.spike.feedback.connected,true);assert.equal(report.spike.pose.kind,'spike');assert.ok(report.spike.pose.sx<1);report.checks.push('Actual homing spike contact produces its own brief textured compression');
  await page.screenshot({path:path.join(out,name+'-spike.png')});
  report.dot=await page.evaluate(()=>{const api=window.__EVOLVE_ORGAN_HITS_V613__,c=api.test.context(),e=window.__LAST_ORGAN_HIT_V613__;for(const k of ['shell','tail','mouth'])c.run.cooldowns[k]=999;const before=api.read().spike,hp=e.hp;c.run.dots.set(e,{left:.3,clock:0,dps:20,organ:'shell'});c.step(.25);return {damage:hp-e.hp,before,after:api.read().spike,source:api.test.source()};});
  assert.ok(report.dot.damage>0);assert.equal(report.dot.before,report.dot.after);assert.equal(report.dot.source,null);report.checks.push('Real periodic organ damage does not masquerade as another direct impact');
  report.tail=await page.evaluate(()=>{
   const {a,ctx,e,api}=window.__ORGAN_HIT_FIXTURE_V613__.fresh('tail',26);if(!a.cast('tail'))throw Error('Whip did not cast');
   for(let i=0;i<45&&e.hp===100000;i++)a.step(.01);window.__EVOLVE_MAPS_V567__.test.context().step(.016);ctx.draw();window.__LAST_ORGAN_HIT_V613__=e;
   return {damage:100000-e.hp,push:Math.hypot(e.kx,e.ky),pose:api.test.pose(e),feedback:api.read()};
  });
  assert.ok(report.tail.damage>0&&report.tail.push>0&&report.tail.feedback.tail>0&&report.tail.feedback.drawn>0);assert.equal(report.tail.pose.kind,'tail');assert.ok(Math.abs(report.tail.pose.rot)>Math.abs(report.spike.pose.rot));report.checks.push('Actual swept whip contact produces directional twist while preserving its existing push');
  await page.screenshot({path:path.join(out,name+'-tail.png')});
  report.arc=await page.evaluate(()=>{
   const {ctx,e,api}=window.__ORGAN_HIT_FIXTURE_V613__.fresh(null,90),c=api.test.context();ctx.state.arm=1;ctx.grid();c.lightning.reset();
   const castAvailable=c.lightning.castChain(true),lightningLocked=document.getElementById('ability').disabled;
   if(castAvailable)throw Error('Unexpected lightning unlock: preserve the current equipment gate');
   // Lightning equipment is currently locked. Exercise only its retained rendering compatibility.
   e.arcShockV576={age:0,hold:.058,life:.32,a:window.__ORGAN_HIT_FIXTURE_V613__.angle,strong:true,mass:1,hp:1,wait:.13,vx:0,vy:0};
   api.test.damage(e,80,'arc',window.__ORGAN_HIT_FIXTURE_V613__.angle);ctx.draw();window.__LAST_ORGAN_HIT_V613__=e;
   return {fixture:true,castAvailable,lightningLocked,damage:100000-e.hp,lightningPose:c.lightning.pose(e),hold:c.lightning.holdEnemy(e),organPose:api.test.pose(e),feedback:api.read(),lightning:c.lightning.read()};
  });
  assert.ok(report.arc.damage>0&&report.arc.feedback.arc>0&&report.arc.lightningPose);assert.equal(report.arc.castAvailable,false);assert.equal(report.arc.lightningLocked,true);assert.equal(report.arc.organPose,null);assert.equal(report.arc.feedback.active,0);report.checks.push('Lightning stays locked; an arc-damage QA fixture uses its retained pose without duplicate organ deformation');
  await page.screenshot({path:path.join(out,name+'-arc.png')});
  report.reduced=await page.evaluate(()=>{const api=window.__EVOLVE_ORGAN_HITS_V613__,c=api.test.context(),e=window.__LAST_ORGAN_HIT_V613__,meta=window.__EVOLVE_COMBAT_V596__.test.context().meta;const hold=c.lightning.holdEnemy(e);meta.feedback.reducedMotion=true;const pose=c.lightning.pose(e),sameHold=c.lightning.holdEnemy(e)===hold;api.test.damage(e,15,'spike',0);const organPose=api.test.pose(e);meta.feedback.reducedMotion=false;return {pose,organPose,sameHold};});
  assert.equal(report.reduced.pose,null);assert.equal(report.reduced.organPose,null);assert.equal(report.reduced.sameHold,true);
  await page.setViewportSize({width:852,height:393});await page.evaluate(()=>window.__EVOLVE_MAPS_V567__.test.context().draw());await page.screenshot({path:path.join(out,name+'-landscape.png')});
  await page.evaluate(()=>window.__EVOLVE_TEST_MODULE_V575__.test.context().home('battle'));await ready();assert.equal(await page.evaluate(()=>window.__EVOLVE_ORGAN_HITS_V613__.read().active),0);
  await page.setViewportSize({width:393,height:852});await page.reload({waitUntil:'domcontentloaded',timeout:180000});await ready();assert.equal(await page.evaluate(()=>window.__EVOLVE_ARM_ITEMS_V589__.read().mode),'cannon');assert.equal(await page.evaluate(()=>window.__EVOLVE_ORGAN_HITS_V613__.read().active),0);
  report.checks.push('Portrait, landscape, reduced motion, unchanged lightning hold, home reset and equipment persistence passed');assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedRequests,[]);report.success=true;
 }catch(error){report.success=false;report.failure=error.stack||String(error);await page.screenshot({path:path.join(out,name+'-failure.png')}).catch(()=>{});throw error;}
 finally{fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));await context.close();await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
