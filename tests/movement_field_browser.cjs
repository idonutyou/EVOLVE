const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const dist=path.resolve(__dirname,'../dist'),out=path.resolve(__dirname,'../test-results');fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html','.js':'application/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost'),p=path.resolve(dist,'.'+(u.pathname==='/'?'/index.html':u.pathname));if(!p.startsWith(dist+path.sep)||!fs.existsSync(p)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');fs.createReadStream(p).pipe(res);});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']}),context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true}),page=await context.newPage(),report={checks:[],errors:[],failedRequests:[],maps:[],physical_Galaxy_S23_plus_tested:false};
 page.on('pageerror',e=>report.errors.push(e.message));page.on('requestfailed',r=>{if(!r.url().startsWith('data:'))report.failedRequests.push({url:r.url(),error:r.failure()?.errorText})});
 const ready=()=>page.waitForFunction(()=>window.__EVOLVE_MOVEMENT_FIELD_V590__&&window.__EVOLVE_ARM_ITEMS_V589__?.read().ready&&window.__EVOLVE_TEST_MODULE_V575__?.read().ready&&!document.getElementById('start').disabled&&!document.getElementById('webLoader'),null,{timeout:180000});
 const start=async()=>{await page.locator('#start').click();await require('./choose_opening_skill.cjs')(page);await page.waitForFunction(()=>window.__EVOLVE_TEST_MODULE_V575__.read().running);};
 try{
  await page.addInitScript(()=>{const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>cb.name==='loop'?0:raf(cb);});
  await page.goto('http://127.0.0.1:'+server.address().port+'/?evolveQA=1',{waitUntil:'domcontentloaded',timeout:180000});await ready();await require('./admin_unlock.cjs')(page);
  await page.evaluate(()=>window.__EVOLVE_PARTS_V523__.equip('arm_cannon'));await start();
  report.cannon=await page.evaluate(()=>{
   const c=window.__EVOLVE_MAPS_V567__.test.context(),p=window.__EVOLVE_PLAYER_COMBAT_V587__,f=window.__EVOLVE_MOVEMENT_FIELD_V590__;
   c.player.inv=999;for(let i=0;i<20;i++)c.step(.05);const source=c.enemies.find(e=>!e.dead&&!e.finalBoss);if(!source)throw Error('No natural enemy');
   const free=(x,y)=>[[-45,0],[135,0],[0,-55],[0,55],[0,0]].every(([dx,dy])=>f.test.safeFoot(x+dx,y+dy))&&!c.hit(x,y,x+135,y,1);
   let origin=free(c.player.x,c.player.y)?{x:c.player.x,y:c.player.y}:null;
   for(const k of c.nav?.members[c.nav.main]||[]){if(origin)break;const x=(k%c.nav.cols+.5)*c.nav.cell,y=(((k/c.nav.cols)|0)+.5)*c.nav.cell-9;if(free(x,y))origin={x,y};}
   if(!origin)throw Error('No open movement and firing corridor');c.player.x=origin.x;c.player.y=origin.y;
   const fixture=(x,y)=>({...source,x,y,hp:100000,maxHp:100000,dead:false,arrivalInvuln:false,arrivalTime:0,barrier:0,r:10,spd:0,kx:0,ky:0,hit:0,stagger:0,staggerLock:0});window.__MOVE_FIELD_FIXTURE__={origin,fixture};
   for(const e of c.enemies)e.dead=true;c.enemies.splice(0,c.enemies.length,fixture(origin.x+115,origin.y));for(const k of ['mouth','tail','wing','leg'])c.state[k]=0;c.state.arm=1;c.player.shoot=99;c.step(.001);p.test.reset();f.test.reset();c.player.shoot=0;
   c.keys.a=true;for(let i=0;i<6;i++)c.step(.02);delete c.keys.a;c.draw();const firingLeft=f.read();
   for(const e of c.enemies)e.dead=true;c.enemies.length=0;const last=firingLeft.lastAttackAngle;c.keys.w=true;for(let i=0;i<6;i++)c.step(.05);delete c.keys.w;c.draw();const movingUp=f.read();
   c.pause(true);const before=JSON.stringify(f.read());c.step(3);const pauseSafe=JSON.stringify(f.read())===before;c.pause(false);
   p.test.step(f.read().holdRemaining-.01);const beforeExpiry=f.read();p.test.step(.02);c.draw();const expired=f.read(),weapon=f.test.weaponAngle(0);
   return {firingLeft,movingUp,last,pauseSafe,beforeExpiry,expired,weapon,shots:window.__EVOLVE_ARM_ITEMS_V589__.read().shots};
  });
  assert.ok(report.cannon.shots>0);assert.ok(Math.cos(report.cannon.firingLeft.bodyAngle)<-.95);assert.ok(Math.cos(report.cannon.firingLeft.weaponAngle)>.8);assert.ok(Math.sin(report.cannon.movingUp.bodyAngle)<-.95);assert.equal(report.cannon.movingUp.weaponAngle,report.cannon.last);assert.ok(report.cannon.pauseSafe);assert.equal(report.cannon.beforeExpiry.weaponAngle,report.cannon.last);assert.equal(report.cannon.expired.holdRemaining,0);assert.equal(report.cannon.expired.bodyAngle,report.cannon.expired.weaponAngle);assert.equal(report.cannon.weapon,report.cannon.expired.bodyAngle);report.checks.push('real cannon fire to the right does not turn a body walking left; turning upward preserves aim for two gameplay seconds; pause freezes the hold and expiry returns guns to actual movement');
  await page.screenshot({path:path.join(out,'movement-field-cannon-expired.png')});
  await page.evaluate(()=>{const c=window.__EVOLVE_MAPS_V567__.test.context(),f=window.__EVOLVE_MOVEMENT_FIELD_V590__,p=window.__MOVE_FIELD_FIXTURE__.origin;c.player.x=p.x;c.player.y=p.y;c.keys.a=true;f.test.reset();f.test.recordAttack(0);window.__DASH_BEFORE_V590__={x:c.player.x,y:c.player.y};});
  await page.keyboard.press('Space');
  report.dash=await page.evaluate(()=>{const c=window.__EVOLVE_MAPS_V567__.test.context(),f=window.__EVOLVE_MOVEMENT_FIELD_V590__;delete c.keys.a;return {...f.read(),dx:c.player.x-window.__DASH_BEFORE_V590__.x,dy:c.player.y-window.__DASH_BEFORE_V590__.y};});
  assert.ok(report.dash.dx<-20);assert.ok(Math.cos(report.dash.bodyAngle)<-.95);assert.ok(Math.cos(report.dash.weaponAngle)>.95);assert.equal(report.dash.holdRemaining,2);report.checks.push('a real instantaneous left dash immediately turns the body left while preserving the last rightward attack and its full hold timer');
  await page.evaluate(()=>window.__EVOLVE_TEST_MODULE_V575__.test.context().home('battle'));await ready();await page.evaluate(()=>window.__EVOLVE_PARTS_V523__.equip('arm_blades'));await start();
  report.blades=await page.evaluate(()=>{
   const c=window.__EVOLVE_MAPS_V567__.test.context(),p=window.__EVOLVE_PLAYER_COMBAT_V587__,f=window.__EVOLVE_MOVEMENT_FIELD_V590__,saved=window.__MOVE_FIELD_FIXTURE__;
   c.player.inv=999;c.player.x=saved.origin.x;c.player.y=saved.origin.y;for(const e of c.enemies)e.dead=true;c.enemies.splice(0,c.enemies.length,saved.fixture(c.player.x+38,c.player.y));for(const k of ['mouth','tail','wing','leg'])c.state[k]=0;c.state.arm=1;c.step(.001);p.test.reset();f.test.reset();p.test.motion().cooldown=0;
   c.keys.a=true;for(let i=0;i<6;i++)c.step(.02);delete c.keys.a;c.draw();const swinging=f.read(),attack=p.read().attack;
   for(const e of c.enemies)e.dead=true;c.enemies.length=0;p.test.step(.45);const held=f.read(),restAngle=f.test.weaponAngle(0);p.test.step(2.01);c.draw();return {swinging,attack,held,restAngle,expired:f.read(),expiredRest:f.test.weaponAngle(0)};
  });
  assert.ok(report.blades.attack);assert.ok(Math.cos(report.blades.swinging.bodyAngle)<-.95);assert.ok(Math.cos(report.blades.swinging.lastAttackAngle)>.95);assert.equal(report.blades.held.weaponAngle,report.blades.swinging.lastAttackAngle);assert.ok(Math.abs(report.blades.restAngle-(report.blades.held.bodyAngle-.2))<1e-8);assert.equal(report.blades.expired.weaponAngle,report.blades.expired.bodyAngle);assert.ok(Math.abs(report.blades.expiredRest-(report.blades.expired.bodyAngle-.2))<1e-8);report.checks.push('blade attacks keep their attack direction while the body walks away; blades return to the movement pose immediately after their swing while cannons retain the two-second aim hold');
  await page.screenshot({path:path.join(out,'movement-field-blades-expired.png')});
  const maps=await page.evaluate(()=>window.__EVOLVE_TEST_MODULE_V575__.test.definitions().map(m=>m.id));
  for(const id of maps){
   await page.evaluate(async id=>{await window.__EVOLVE_TEST_MODULE_V575__.go(1,id,false);window.__EVOLVE_TEST_MODULE_V575__.test.context().reset();},id);await require('./choose_opening_skill.cjs')(page);await page.waitForFunction(()=>window.__EVOLVE_TEST_MODULE_V575__.read().ready,null,{timeout:60000});
   const result=await page.evaluate(()=>{
    const c=window.__EVOLVE_MAPS_V567__.test.context(),f=window.__EVOLVE_MOVEMENT_FIELD_V590__,api=window.__EVOLVE_RED_PULSE_V579__,v=api.test.view(),extent=Math.max(c.nav.cols,c.nav.rows)*c.nav.cell;let valid=true,reachable=true,far=0,outside=0;const points=[];const originalRandom=Math.random;let seed=123456789;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    for(let i=0;i<48;i++){
     let s=api.test.device();if(s)s.claimed=true;api.test.ensure();s=api.test.device();if(!s&&api.read().cooldown>0){api.test.step(api.read().cooldown+.001);s=api.test.device();}if(!s)throw Error('No reachable random field device '+JSON.stringify({i,device:api.read(),facing:f.read(),player:{x:c.player.x,y:c.player.y},navMain:c.nav.main,navSizes:c.nav.members.map(x=>x.length)}));
     valid&&=f.test.safeFoot(s.x,s.y)&&c.circleClear(s.x,s.y,28);
     const n=c.nav,k=Math.floor((s.y+9)/n.cell)*n.cols+Math.floor(s.x/n.cell);reachable&&=n.component[k]===n.main;
     if(Math.hypot(s.x-c.player.x,s.y-c.player.y)>300)far++;if(s.x<v.l||s.x>v.r||s.y<v.t||s.y>v.b)outside++;points.push([Math.round(s.x),Math.round(s.y)]);
    }
    Math.random=originalRandom;const before=api.read().spawned;for(let i=0;i<20;i++)api.test.ensure();const oneDevice=api.read().sites.filter(s=>s.type==='redPulse').length===1&&api.read().spawned===before;
    return {valid,reachable,far,outside,oneDevice,points,respawn:api.read().respawnSeconds,sampler:f.read().fieldSpawns};
   });
   assert.ok(result.valid&&result.reachable&&result.oneDevice,JSON.stringify({id,...result}));assert.ok(result.far>6&&result.outside>0,JSON.stringify({id,...result}));assert.equal(result.respawn,60);report.maps.push({id,...result});
  }
  report.checks.push('48 real spawns per campaign map stay on reachable floor with full device clearance, cover distant offscreen map areas, never duplicate an active device, and advertise a 60-second respawn');
  report.wave=await page.evaluate(()=>{
   const c=window.__EVOLVE_MAPS_V567__.test.context(),api=window.__EVOLVE_RED_PULSE_V579__,f=window.__EVOLVE_MOVEMENT_FIELD_V590__,s=api.test.device();c.player.x=s.x;c.player.y=s.y;c.player.inv=999;api.test.step(3);api.test.step(.24);c.draw();const w=api.test.wave();if(!w)throw Error('Wave did not detonate');
   const canvas=document.createElement('canvas');canvas.width=canvas.height=900;const g=canvas.getContext('2d');g.fillStyle='#11151f';g.fillRect(0,0,900,900);g.translate(450-w.x,450-w.y);const widths=[];
   const proxy=new Proxy(g,{get(t,k){const v=Reflect.get(t,k,t);return typeof v==='function'?v.bind(t):v;},set(t,k,v){if(k==='lineWidth')widths.push(v);return Reflect.set(t,k,v,t);}});api.test.drawGround(proxy);api.test.drawTop(proxy);
   const builds=f.read().fieldSpawns.builds;for(let i=0;i<20;i++)c.draw();return {spread:w.spread,life:w.life,radius:w.radius,max:w.maxRadius,slowerThanOld:w.radius<w.maxRadius*(1-(1-.24/.52)**3),widths,builds,buildsAfter:f.read().fieldSpawns.builds,png:canvas.toDataURL().split(',')[1]};
  });
  assert.equal(report.wave.spread,1.56);assert.equal(report.wave.life,2.36);assert.ok(report.wave.slowerThanOld&&report.wave.widths.includes(12)&&report.wave.widths.includes(3.8));assert.equal(report.wave.builds,report.wave.buildsAfter);fs.writeFileSync(path.join(out,'movement-field-electric-wave.png'),Buffer.from(report.wave.png,'base64'));delete report.wave.png;report.checks.push('the actual effect expands over 1.56 seconds, draws a thick electrical band and bright filaments, and rendering never rebuilds the reachability grid');
  await page.screenshot({path:path.join(out,'movement-field-wave-portrait.png')});await page.setViewportSize({width:852,height:393});await page.evaluate(()=>window.__EVOLVE_TEST_MODULE_V575__.test.context().draw());await page.screenshot({path:path.join(out,'movement-field-wave-landscape.png')});
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedRequests,[]);report.success=true;
 }catch(error){report.success=false;report.failure=error.stack||String(error);await page.screenshot({path:path.join(out,'movement-field-failure.png')}).catch(()=>{});throw error;}
 finally{fs.writeFileSync(path.join(out,'movement-field-browser.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));await context.close();await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
