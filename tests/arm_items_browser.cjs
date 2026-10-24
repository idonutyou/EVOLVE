const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const dist=path.resolve(__dirname,'../dist'),out=path.resolve(__dirname,'../test-results');fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html','.js':'application/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost'),p=path.resolve(dist,'.'+(u.pathname==='/'?'/index.html':u.pathname));if(!p.startsWith(dist+path.sep)||!fs.existsSync(p)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');fs.createReadStream(p).pipe(res);});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']}),context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true}),page=await context.newPage(),report={checks:[],errors:[],failedRequests:[],physical_Galaxy_S23_plus_tested:false};
 page.on('pageerror',e=>report.errors.push(e.message));page.on('requestfailed',r=>{if(!r.url().startsWith('data:'))report.failedRequests.push({url:r.url(),error:r.failure()?.errorText})});
 const ready=()=>page.waitForFunction(()=>window.__EVOLVE_ARM_ITEMS_V589__?.read().ready&&window.__EVOLVE_TEST_MODULE_V575__?.read().ready&&!document.getElementById('start').disabled&&!document.getElementById('webLoader'),null,{timeout:180000});
 const start=async()=>{await page.locator('#start').click();await page.locator('[data-weapon="arm"]').click();await page.waitForFunction(()=>window.__EVOLVE_TEST_MODULE_V575__.read().running);};
 const home=async()=>{await page.evaluate(()=>window.__EVOLVE_TEST_MODULE_V575__.test.context().home('battle'));await ready();};
 try{
  await page.addInitScript(()=>{const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>cb.name==='loop'?0:raf(cb);});
  await page.goto('http://127.0.0.1:'+server.address().port+'/?evolveQA=1',{waitUntil:'domcontentloaded',timeout:180000});await ready();
  assert.equal(await page.evaluate(()=>window.__EVOLVE_ARM_ITEMS_V589__.read().mode),'bare');
  await page.locator('#homeLabTab').click();await page.locator('#partsGridV523 [data-part-id="arm_cannon"]').click();assert.match(await page.locator('#partsDetailHintV523').innerText(),/탄막/);await page.locator('#partsDetailEquipV523').click();
  assert.equal(await page.evaluate(()=>window.__EVOLVE_ARM_ITEMS_V589__.read().mode),'cannon');assert.equal(await page.evaluate(()=>window.__EVOLVE_PLAYER_COMBAT_V587__.read().unarmed),false);
  report.icons=await page.evaluate(()=>{const api=window.__EVOLVE_ARM_ITEMS_V589__,art=api.test.art();return {pixelPreserved:art.source_pixels_preserved,redrawn:art.generative_redraw,cannon:document.querySelector('#partsGridV523 [data-part-id="arm_cannon"] img').getAttribute('src'),blades:document.querySelector('#partsGridV523 [data-part-id="arm_blades"] img').getAttribute('src'),expected:[art.items.cannon.icon.path,art.items.blades.icon.path]};});
  assert.equal(report.icons.pixelPreserved,true);assert.equal(report.icons.redrawn,false);assert.deepEqual([report.icons.cannon,report.icons.blades],report.icons.expected);
  await page.screenshot({path:path.join(out,'arm-items-cannon-inventory.png')});
  const previews=await page.evaluate(()=>window.__EVOLVE_ARM_ITEMS_V589__.test.previews());for(const [kind,data] of Object.entries(previews))fs.writeFileSync(path.join(out,'arm-items-'+kind+'-home-art.png'),Buffer.from(data.split(',')[1],'base64'));
  await page.locator('#homeBattleTabV522').click();await page.screenshot({path:path.join(out,'arm-items-cannon-home.png')});await start();
  report.cannon=await page.evaluate(()=>{
   const c=window.__EVOLVE_MAPS_V567__.test.context(),p=window.__EVOLVE_PLAYER_COMBAT_V587__,api=window.__EVOLVE_ARM_ITEMS_V589__;
   c.player.inv=999;for(let i=0;i<20;i++)c.step(.05);const source=c.enemies.find(e=>!e.dead&&!e.finalBoss);if(!source)throw Error('No natural enemy fixture');
   let a,spot;for(let i=0;i<32;i++){a=i*Math.PI/16;const x=c.player.x+Math.cos(a)*130,y=c.player.y+Math.sin(a)*130;if(c.clear({x,y},14)&&!c.hit(c.player.x,c.player.y,x,y,1)){spot={x,y};break;}}if(!spot)throw Error('No clear projectile corridor');
   const fixture=(x,y)=>({...source,x,y,hp:10000,maxHp:10000,dead:false,arrivalInvuln:false,arrivalTime:0,barrier:0,r:12,spd:0,kx:0,ky:0,hit:0,stagger:0,staggerLock:0});
   window.__ARM_ITEM_FIXTURE__={fixture,a,origin:{x:c.player.x,y:c.player.y}};
   for(const e of c.enemies)e.dead=true;const target=fixture(spot.x,spot.y);c.enemies.splice(0,c.enemies.length,target);c.step(.001);
   for(const k of ['mouth','tail','wing','leg'])c.state[k]=0;c.state.arm=1;p.test.reset();p.test.motion().cooldown=0;c.player.shoot=0;p.test.bullets().length=0;
   p.test.step(.001);const shots=p.test.bullets().map(b=>({kind:b.kind,dmg:b.dmg,x:b.x,y:b.y,vx:b.vx,vy:b.vy,pierce:b.pierce})),noStab=p.read().attack===null;
   for(let i=0;i<50;i++)c.step(.01);c.draw();const damage=10000-target.hp,lowShots=shots.length;
   c.state.arm=5;c.player.shoot=0;c.player.precisionVolley=0;c.player.overboreCycle=0;p.test.bullets().length=0;p.test.step(.001);const high=p.test.bullets().map(b=>({kind:b.kind,dmg:b.dmg,pierce:b.pierce}));
   return {shots,noStab,damage,lowShots,high,read:api.read(),lightning:window.__EVOLVE_LIGHTNING_V576__.read().casts};
  });
  assert.ok(report.cannon.noStab&&report.cannon.damage>0);assert.equal(report.cannon.lowShots,1);assert.ok(report.cannon.shots.every(b=>b.kind==='arm'));assert.ok(report.cannon.high.length>report.cannon.lowShots);assert.ok(report.cannon.high[0].pierce>report.cannon.shots[0].pierce);assert.equal(report.cannon.lightning,0);report.checks.push('cannon UI equips the marked-end artwork; an actual original ARM projectile travels and damages a campaign enemy; higher stars add the original projectile count and piercing; no bare stab or lightning is emitted');
  await page.screenshot({path:path.join(out,'arm-items-cannon-battle.png')});await home();
  await page.reload({waitUntil:'domcontentloaded',timeout:180000});await ready();assert.equal(await page.evaluate(()=>window.__EVOLVE_ARM_ITEMS_V589__.read().mode),'cannon');
  await page.locator('#homeLabTab').click();await page.locator('#partsGridV523 [data-part-id="arm_blades"]').click();assert.match(await page.locator('#partsDetailHintV523').innerText(),/베기/);await page.locator('#partsDetailEquipV523').click();assert.equal(await page.evaluate(()=>window.__EVOLVE_PARTS_V523__.snapshot().worn.arm),'arm_blades');
  await page.screenshot({path:path.join(out,'arm-items-blades-inventory.png')});await page.locator('#homeBattleTabV522').click();await start();
  report.blades=await page.evaluate(()=>{
   const c=window.__EVOLVE_MAPS_V567__.test.context(),p=window.__EVOLVE_PLAYER_COMBAT_V587__,api=window.__EVOLVE_ARM_ITEMS_V589__;
   c.player.inv=999;for(let i=0;i<20;i++)c.step(.05);const source=c.enemies.find(e=>!e.dead&&!e.finalBoss);if(!source)throw Error('No sword enemy fixture');
   const fixture=(x,y)=>({...source,x,y,hp:10000,maxHp:10000,dead:false,arrivalInvuln:false,arrivalTime:0,barrier:0,r:10,spd:0,kx:0,ky:0,hit:0,stagger:0,staggerLock:0});
   let a=0,found=false;for(let i=0;i<32;i++){const angle=i*Math.PI/16;if([0,.52,-.60].every(d=>!c.hit(c.player.x,c.player.y,c.player.x+Math.cos(angle+d)*64,c.player.y+Math.sin(angle+d)*64,1))){a=angle;found=true;break;}}if(!found)throw Error('No clear melee arc');
   const at=(distance,angle)=>fixture(c.player.x+Math.cos(angle)*distance,c.player.y+Math.sin(angle)*distance);
   for(const e of c.enemies)e.dead=true;const front=[at(54,a),at(62,a+.52),at(64,a-.60)],behind=at(55,a+Math.PI),far=at(180,a);c.enemies.splice(0,c.enemies.length,...front,behind,far);
   for(const k of ['mouth','tail','wing','leg'])c.state[k]=0;c.state.arm=1;c.step(.001);p.test.reset();p.test.motion().cooldown=0;p.test.bullets().length=0;
   if(!p.test.stab())throw Error('Blade swing failed to start');const firstSide=p.read().attack.side;p.test.step(.089);const noEarly=front.every(e=>e.hp===10000);for(let i=0;i<12;i++)p.test.step(.02);c.draw();
   const damage=front.map(e=>10000-e.hp),behindHP=behind.hp,farHP=far.hp;p.test.step(.10);const oneHit=front.every((e,i)=>10000-e.hp===damage[i]);
   window.__ARM_ITEM_FIXTURE__={fixture,a,origin:{x:c.player.x,y:c.player.y}};
   const firstRead=api.read();p.test.step(.3);const nextSide=p.read().attack?.side;
   return {noEarly,damage,behindHP,farHP,oneHit,firstSide,nextSide,bullets:p.test.bullets().length,read:firstRead,lightning:window.__EVOLVE_LIGHTNING_V576__.read().casts};
  });
  assert.ok(report.blades.noEarly&&report.blades.oneHit);assert.ok(report.blades.damage.every(d=>d>0),JSON.stringify(report.blades));assert.equal(report.blades.behindHP,10000);assert.equal(report.blades.farHP,10000);assert.equal(report.blades.bullets,0);assert.equal(report.blades.firstSide,0);assert.equal(report.blades.nextSide,1);assert.equal(report.blades.lightning,0);report.checks.push('swords have a real windup and swept melee arc, hit multiple enemies inside the swing once each, alternate upper limbs and leave rear/distant enemies untouched without emitting bullets');
  await page.screenshot({path:path.join(out,'arm-items-blades-battle.png')});
  report.misses=await page.evaluate(()=>{
   const c=window.__EVOLVE_MAPS_V567__.test.context(),p=window.__EVOLVE_PLAYER_COMBAT_V587__,f=window.__ARM_ITEM_FIXTURE__;
   const target=f.fixture(c.player.x+Math.cos(f.a)*54,c.player.y+Math.sin(f.a)*54);for(const e of c.enemies)e.dead=true;c.enemies.splice(0,c.enemies.length,target);c.step(.001);p.test.reset();p.test.motion().cooldown=0;p.test.stab();target.x=c.player.x+Math.cos(f.a)*220;target.y=c.player.y+Math.sin(f.a)*220;p.test.step(.31);const escaped=target.hp===10000;
   let wall=null;for(let radius=24;radius<=300&&!wall;radius+=8)for(let i=0;i<64;i++){const angle=i*Math.PI/32,x=f.origin.x+Math.cos(angle)*radius,y=f.origin.y+Math.sin(angle)*radius;if(!c.clear({x,y},12))continue;for(let j=0;j<32;j++){const a=j*Math.PI/16,tx=x+Math.cos(a)*55,ty=y+Math.sin(a)*55;if(c.hit(x,y,tx,ty,1)){wall={x,y,a,tx,ty};break;}}if(wall)break;}
   if(!wall)throw Error('No real map wall found near the player');c.player.x=wall.x;c.player.y=wall.y;c.player.look=wall.a;const blocked=f.fixture(wall.tx,wall.ty);c.enemies.splice(0,c.enemies.length,blocked);c.step(.001);
   // The world update resolves bodies out of walls. Restore the occluded
   // contact fixture after indexing, then advance only the attack clock.
   Object.assign(c.player,{x:wall.x,y:wall.y,look:wall.a});Object.assign(blocked,{x:wall.tx,y:wall.ty,hp:10000});
   if(!c.hit(c.player.x,c.player.y,blocked.x,blocked.y,1))throw Error('Wall fixture lost its occlusion');
   p.test.reset();p.test.motion().cooldown=0;p.test.stab();p.test.step(.31);const blockedHP=blocked.hp;c.player.x=f.origin.x;c.player.y=f.origin.y;
   const builds=window.__EVOLVE_ARM_ITEMS_V589__.read().frameBuilds;for(let i=0;i<20;i++){c.player.look=i*Math.PI/10;c.draw();}
   return {escaped,wall,blockedHP,builds,buildsAfter:window.__EVOLVE_ARM_ITEMS_V589__.read().frameBuilds,originalBuilds:p.read().frameBuilds};
  });
  assert.ok(report.misses.escaped);assert.equal(report.misses.blockedHP,10000);assert.equal(report.misses.builds,20);assert.equal(report.misses.buildsAfter,20);assert.equal(report.misses.originalBuilds,20);report.checks.push('escaped targets are missed; an actual map obstruction blocks blade damage; aiming and drawing preserve both pose caches without rebuilding meshes');
  await page.setViewportSize({width:852,height:393});await page.evaluate(()=>window.__EVOLVE_TEST_MODULE_V575__.test.context().draw());await page.screenshot({path:path.join(out,'arm-items-blades-landscape.png')});await home();await page.setViewportSize({width:393,height:852});
  await page.reload({waitUntil:'domcontentloaded',timeout:180000});await ready();assert.equal(await page.evaluate(()=>window.__EVOLVE_ARM_ITEMS_V589__.read().mode),'blades');
  await page.locator('#homeLabTab').click();await page.locator('#partsSlot_arm_V523').click();await page.locator('#partsDetailEquipV523').click();assert.equal(await page.evaluate(()=>window.__EVOLVE_ARM_ITEMS_V589__.read().mode),'bare');assert.equal(await page.evaluate(()=>window.__EVOLVE_PLAYER_COMBAT_V587__.read().unarmed),true);
  await page.reload({waitUntil:'domcontentloaded',timeout:180000});await ready();assert.equal(await page.evaluate(()=>window.__EVOLVE_PARTS_V523__.snapshot().worn.arm),null);assert.equal(await page.evaluate(()=>window.__EVOLVE_ADMIN_MODE_V585__.read().enabled),false);assert.equal(await page.locator('#ability').isDisabled(),true);report.checks.push('switching the existing single ARM slot replaces the weapon, both choices persist after reload, removal persists and restores bare stabs, and lightning/admin remain locked');
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedRequests,[]);report.success=true;
 }catch(error){report.success=false;report.failure=error.stack||String(error);await page.screenshot({path:path.join(out,'arm-items-failure.png')}).catch(()=>{});throw error;}
 finally{fs.writeFileSync(path.join(out,'arm-items-browser.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));await context.close();await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
