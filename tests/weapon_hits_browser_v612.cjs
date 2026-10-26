const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const dist=path.resolve(__dirname,'../dist'),out=path.resolve(__dirname,'../test-results');fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost'),p=path.resolve(dist,'.'+(u.pathname==='/'?'/index.html':u.pathname));if(!p.startsWith(dist+path.sep)||!fs.existsSync(p)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');fs.createReadStream(p).pipe(res);});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const live=process.env.EVOLVE_TEST_BASE_URL,base=live||'http://127.0.0.1:'+server.address().port+'/';
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']}),context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true}),page=await context.newPage();
 const report={live:!!live,checks:[],errors:[],failedRequests:[],physical_Galaxy_S23_plus_tested:false},name=live?'weapon-hits-live':'weapon-hits-local';
 page.on('pageerror',e=>report.errors.push(e.message));page.on('requestfailed',r=>{if(!r.url().startsWith('data:'))report.failedRequests.push(r.url());});
 const ready=()=>page.waitForFunction(()=>window.__EVOLVE_ARM_ITEMS_V589__?.read().ready&&window.__EVOLVE_WEAPON_HITS_V612__?.read().imageReady.gun&&window.__EVOLVE_WEAPON_HITS_V612__?.read().imageReady.blade&&!document.getElementById('start').disabled&&!document.getElementById('webLoader'),null,{timeout:180000});
 const equip=async(id)=>{await page.locator('#homeLabTab').click();await page.locator('#partsGridV523 [data-part-id="'+id+'"]').click();await page.locator('#partsDetailEquipV523').click();await page.locator('#homeBattleTabV522').click();};
 const start=async()=>{await page.locator('#start').click();await require('./choose_opening_skill.cjs')(page);await page.waitForFunction(()=>window.__EVOLVE_TEST_MODULE_V575__.read().running);};
 try{
  await page.addInitScript(()=>{const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>cb.name==='loop'?0:raf(cb);});
  const u=new URL(base);u.searchParams.set('evolveQA','1');await page.goto(u.href,{waitUntil:'domcontentloaded',timeout:180000});await ready();
  report.version=await page.evaluate(()=>window.EVOLVE_WEB_CONFIG);assert.match(report.version.version,/STEP05/);
  await equip('arm_cannon');await start();
  report.gun=await page.evaluate(()=>{
   window.__EVOLVE_UPGRADE_CARDS_V593__.test.reset();const c=window.__EVOLVE_MAPS_V567__.test.context(),p=window.__EVOLVE_PLAYER_COMBAT_V587__,api=window.__EVOLVE_WEAPON_HITS_V612__;
   c.player.inv=999;for(let i=0;i<20;i++)c.step(.05);const source=c.enemies.find(e=>!e.dead&&!e.finalBoss);if(!source)throw Error('No natural enemy fixture');
   let a=0,spot;for(let i=0;i<32;i++){a=i*Math.PI/16;const x=c.player.x+Math.cos(a)*130,y=c.player.y+Math.sin(a)*130;if(c.clear({x,y},14)&&!c.hit(c.player.x,c.player.y,x,y,1)){spot={x,y};break;}}if(!spot)throw Error('No clear gun corridor');
   const e={...source,...spot,type:'crawler',hp:10000,maxHp:10000,dead:false,finalBoss:false,elite:false,arrivalInvuln:false,arrivalTime:0,barrier:0,prism:0,eliteArmor:0,nemesis:false,r:12,spd:0,kx:0,ky:0,stagger:0,staggerLock:999};
   for(const old of c.enemies)old.dead=true;c.enemies.splice(0,c.enemies.length,e);c.step(.001);for(const k of ['mouth','tail','wing','leg'])c.state[k]=0;c.state.arm=1;p.test.reset();p.test.motion().cooldown=0;c.player.shoot=0;p.test.bullets().length=0;api.test.reset();p.test.step(.001);
   for(let i=0;i<80&&e.hp===10000;i++)c.step(.01);c.step(.02);c.draw();window.__WEAPON_HIT_FIXTURE__={e,a};
   return {damage:10000-e.hp,pose:api.test.pose(e),feedback:api.read(),events:window.EVOLVE_HIT_EVENTS.read()};
  });
  assert.ok(report.gun.damage>0);assert.ok(report.gun.feedback.gun>0&&report.gun.feedback.normal>0&&report.gun.feedback.drawn>0);assert.equal(report.gun.feedback.connected,true);assert.ok(report.gun.pose&&report.gun.pose.sx!==1);
  report.checks.push('A real fired projectile activates the shared hit event, textured atlas and brief body reaction');await page.screenshot({path:path.join(out,name+'-gun.png')});
  report.heavy=await page.evaluate(()=>{const c=window.__EVOLVE_MAPS_V567__.test.context(),api=window.__EVOLVE_WEAPON_HITS_V612__,f=window.__WEAPON_HIT_FIXTURE__;api.test.damage(f.e,90,'gun',f.a);c.step(.015);c.draw();return api.read();});assert.ok(report.heavy.heavy>0);await page.screenshot({path:path.join(out,name+'-heavy.png')});
  await page.evaluate(()=>window.__EVOLVE_TEST_MODULE_V575__.test.context().home('battle'));await ready();await equip('arm_blades');await start();
  report.blade=await page.evaluate(()=>{
   window.__EVOLVE_UPGRADE_CARDS_V593__.test.reset();const c=window.__EVOLVE_MAPS_V567__.test.context(),p=window.__EVOLVE_PLAYER_COMBAT_V587__,api=window.__EVOLVE_WEAPON_HITS_V612__;
   c.player.inv=999;for(let i=0;i<20;i++)c.step(.05);const source=c.enemies.find(e=>!e.dead&&!e.finalBoss);let a=0,found=false;
   for(let i=0;i<32;i++){const q=i*Math.PI/16;if([0,.52,-.6].every(d=>!c.hit(c.player.x,c.player.y,c.player.x+Math.cos(q+d)*64,c.player.y+Math.sin(q+d)*64,1))){a=q;found=true;break;}}if(!source||!found)throw Error('No clear blade corridor');
   const e={...source,x:c.player.x+Math.cos(a)*54,y:c.player.y+Math.sin(a)*54,type:'crawler',hp:10000,maxHp:10000,dead:false,finalBoss:false,elite:false,arrivalInvuln:false,arrivalTime:0,barrier:0,r:10,spd:0,kx:0,ky:0,stagger:0,staggerLock:999};
   for(const old of c.enemies)old.dead=true;c.enemies.splice(0,c.enemies.length,e);for(const k of ['mouth','tail','wing','leg'])c.state[k]=0;c.state.arm=1;c.step(.001);p.test.reset();p.test.motion().cooldown=0;api.test.reset();p.test.bullets().length=0;
   if(!p.test.stab())throw Error('Blade swing failed');for(let i=0;i<50&&e.hp===10000;i++)c.step(.01);c.step(.02);c.draw();window.__WEAPON_HIT_FIXTURE__={e,a};
   return {damage:10000-e.hp,pose:api.test.pose(e),feedback:api.read(),bullets:p.test.bullets().length};
  });
  assert.ok(report.blade.damage>0&&report.blade.feedback.blade>0&&report.blade.feedback.drawn>0);assert.ok(report.blade.pose);assert.equal(report.blade.bullets,0);report.checks.push('A real blade swing produces its own cut atlas and pose, with no gun projectile');await page.screenshot({path:path.join(out,name+'-blade.png')});
  await page.setViewportSize({width:852,height:393});await page.evaluate(()=>window.__EVOLVE_MAPS_V567__.test.context().draw());await page.screenshot({path:path.join(out,name+'-landscape.png')});
  report.reduced=await page.evaluate(()=>{const c=window.__EVOLVE_MAPS_V567__.test.context(),api=window.__EVOLVE_WEAPON_HITS_V612__,meta=window.__EVOLVE_COMBAT_V596__.test.context().meta,f=window.__WEAPON_HIT_FIXTURE__;meta.feedback.reducedMotion=true;api.test.damage(f.e,30,'blade',f.a);c.step(.015);const pose=api.test.pose(f.e);meta.feedback.reducedMotion=false;for(let i=0;i<30;i++)c.step(.01);c.draw();return {pose,feedback:api.read()};});assert.equal(report.reduced.pose,null);
  await page.evaluate(()=>window.__EVOLVE_TEST_MODULE_V575__.test.context().home('battle'));await page.setViewportSize({width:393,height:852});await page.reload({waitUntil:'domcontentloaded',timeout:180000});await ready();assert.equal(await page.evaluate(()=>window.__EVOLVE_ARM_ITEMS_V589__.read().mode),'blades');assert.equal(await page.evaluate(()=>window.__EVOLVE_WEAPON_HITS_V612__.read().active),0);
  report.checks.push('Portrait, landscape, reduced motion, home reset and equipment persistence passed');assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedRequests,[]);report.success=true;
 }catch(error){report.success=false;report.failure=error.stack||String(error);await page.screenshot({path:path.join(out,name+'-failure.png')}).catch(()=>{});throw error;}
 finally{fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));await context.close();await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
