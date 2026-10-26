const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const dist=path.resolve(__dirname,'../dist'),out=path.resolve(__dirname,'../test-results');fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'application/javascript','.json':'application/json','.png':'image/png','.css':'text/css','.woff':'font/woff','.webp':'image/webp','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost'),p=path.resolve(dist,'.'+(u.pathname==='/'?'/index.html':u.pathname));if(!p.startsWith(dist+path.sep)||!fs.existsSync(p)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',mime[path.extname(p)]||'application/octet-stream');if(u.pathname.startsWith('/assets/'))res.setHeader('Cache-Control','public,max-age=31536000,immutable');fs.createReadStream(p).pipe(res);});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']}),context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true}),page=await context.newPage(),report={checks:[],errors:[],physical_Galaxy_S23_plus_tested:false};
 page.on('pageerror',e=>{report.errors.push(e.message);console.error(e.message);});
 const ready=()=>page.waitForFunction(()=>window.__EVOLVE_STARTUP_V595__?.read().ready&&!document.getElementById('start').disabled&&!document.getElementById('webLoader'),null,{timeout:180000});
 const start=async()=>{await page.locator('#start').click();await require('./choose_opening_skill.cjs')(page);await page.waitForFunction(()=>window.__EVOLVE_TEST_MODULE_V575__.read().running);};
 try{
  await page.addInitScript(()=>{const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>cb.name==='loop'?0:raf(cb);});
  await page.goto('http://127.0.0.1:'+server.address().port+'/?evolveQA=1',{waitUntil:'domcontentloaded',timeout:180000});
  await page.waitForFunction(()=>{const p=window.EVOLVE_WEB_CLIENT?.read();return p&&p.loaded>0&&p.loaded<p.total;});
  report.downloading=await page.evaluate(()=>({state:window.EVOLVE_WEB_CLIENT.read(),status:document.getElementById('webStatus').textContent,detail:document.getElementById('webDetail').textContent}));
  assert.match(report.downloading.status,/리소스를 다운로드 중/);assert.match(report.downloading.detail,/남은 시간/);
  await page.screenshot({path:path.join(out,'web28-download-progress.png')});await ready();console.log('BOOT READY');
  report.firstBoot=await page.evaluate(()=>window.EVOLVE_WEB_CLIENT.read());assert.equal(report.firstBoot.done,true);assert.equal(report.firstBoot.loaded,report.firstBoot.total);report.checks.push('actual streamed asset bytes, percentage and remaining time are visible before game startup; all downloads finish before loader removal');
  await require('./admin_unlock.cjs')(page);
  await page.evaluate(()=>window.__EVOLVE_TEST_MODULE_V575__.go(3,'facility1',false));await ready();await start();console.log('BATTLE READY');
  await page.evaluate(()=>{window.__EVOLVE_TEST_MODULE_V575__.setNatural(false);const c=window.__EVOLVE_UPGRADE_CARDS_V593__.test.context();c.player.inv=999;for(const k of ['mouth','arm','leg','tail','wing'])c.state[k]=0;});
  report.mapReuse=await page.evaluate(async()=>{const a=window.__EVOLVE_STARTUP_V595__,before=a.read(),time=performance.now();for(let i=0;i<4;i++)await a.test.prepare(3);return {before,after:a.read(),ms:performance.now()-time};});
  assert.equal(report.mapReuse.after.mapPrepares,report.mapReuse.before.mapPrepares);assert.equal(report.mapReuse.after.mapReuses-report.mapReuse.before.mapReuses,4);assert.ok(report.mapReuse.ms<100);
  report.checks.push('four repeated preparations of the active map reuse the existing collision field without any new preparation');
  console.log('MAP REUSE READY');report.catalog=await page.evaluate(()=>{
   const a=window.__EVOLVE_MONSTER_CATALOG_V593__,q=window.__EVOLVE_STARTUP_V595__.test,c=window.__EVOLVE_UPGRADE_CARDS_V593__.test.context(),roster=a.list(),result=[];
   for(const spec of roster){
    c.enemies.length=0;const e=q.spawn(spec);if(!e){result.push({id:spec.id,spawned:false});continue;}
    e.hp=e.maxHp=1e7;e.shot=999;const x=e.x,y=e.y,descriptor=Object.getOwnPropertyDescriptor(e,'x');
    for(let i=0;i<40;i++)c.step(.05);
    result.push({id:spec.id,spawned:true,writable:descriptor.writable===true,locked:!!e._mapBirthLockedV562,route:!!e.mapEntranceRouteV562,distance:Math.hypot(e.x-x,e.y-y),alive:!e.dead,x:e.x,y:e.y});
   }
   c.enemies.length=0;return {roster:roster.map(x=>({id:x.id,boss:!!x.boss})),result,options:[...document.querySelectorAll('#monsterSelectV593 option')].map(x=>x.value)};
  });
  assert.equal(report.catalog.roster.length,19);assert.ok(report.catalog.roster.every(x=>!x.boss));assert.equal(report.catalog.options.length,19);
  assert.ok(report.catalog.result.every(x=>x.spawned&&x.writable&&!x.locked&&!x.route&&x.alive),JSON.stringify(report.catalog.result));
  for(const id of ['crawler','alpha'])assert.ok(report.catalog.result.find(x=>x.id===id).distance>5,JSON.stringify(report.catalog.result.find(x=>x.id===id)));
  assert.ok(await page.locator('#tmSummonBossV573').count());report.checks.push('all 19 ordinary/new/variant/elite specimens spawn with writable coordinates and no stale entry route; crawler and alpha move; phase-specific boss controls remain separate');
  console.log('CATALOG READY');await page.evaluate(()=>{const q=window.__EVOLVE_UPGRADE_CARDS_V593__.test,c=q.context();q.equip('cannon');c.draw();q.offer([['gun_count',1],['light',4],['giant',3]]);});
  await page.evaluate(()=>document.fonts.ready);
  report.selector=await page.evaluate(()=>{const p=document.getElementById('levelPanel'),r=p.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,viewport:innerHeight,background:getComputedStyle(document.getElementById('levelOverlay')).backgroundColor,head:getComputedStyle(p.querySelector('h2')).clipPath,sceneryReady:window.__EVOLVE_UPGRADE_SCENERY_V608__?.read().ready,backgrounds:[...p.querySelectorAll('.upgradeReferenceBgV594')].map(c=>getComputedStyle(c).display)};});
  assert.ok(report.selector.h<report.selector.viewport*.84,JSON.stringify(report.selector));assert.equal(report.selector.sceneryReady,true);assert.ok(report.selector.backgrounds.every(x=>x==='none'));
  await page.screenshot({path:path.join(out,'web28-compact-upgrades.png')});
  await page.setViewportSize({width:852,height:393});await page.screenshot({path:path.join(out,'web28-compact-upgrades-landscape.png')});
  const landscape=await page.locator('#levelPanel').boundingBox();assert.ok(landscape.y>=0&&landscape.y+landscape.height<=393.1,JSON.stringify(landscape));
  await page.setViewportSize({width:393,height:852});await page.waitForTimeout(300);await page.locator('#cards .card').first().click();report.checks.push('the decorated portrait and landscape selectors leave the battlefield visible while real card selection still works');
  report.ground=await page.evaluate(()=>{
   const q=window.__EVOLVE_STARTUP_V595__.test,c=window.__EVOLVE_UPGRADE_CARDS_V593__.test.context(),h=window.__EVOLVE_ATTACK_WARNINGS_V582__.test.context();
   c.enemies.length=0;h.biomeHazards.length=0;h.purges.length=0;c.player.hp=c.player.maxHp=1000;c.player.inv=0;
   const z={x:c.player.x,y:c.player.y,r:46,warn:1.15,active:1.8,tick:0,tier:1};h.purges.push(z);q.ground();const radius=z.r,hp=c.player.hp;c.step(.05);const duringWarning=c.player.hp;
   for(let i=0;i<27;i++)c.step(.05);c.draw();
   return {radius,original:z.originalRadiusV595,hp,duringWarning,after:c.player.hp,stamps:window.__EVOLVE_STARTUP_V595__.read().groundStamps,warn:z.warn};
  });
  assert.ok(report.ground.radius>report.ground.original*1.6);assert.equal(report.ground.hp,report.ground.duringWarning);assert.ok(report.ground.after<report.ground.hp,JSON.stringify(report.ground));assert.ok(report.ground.stamps>0);
  await page.screenshot({path:path.join(out,'web28-visible-ground-attack.png')});report.checks.push('purge radius grows 65%; warning is harmless and subsequent visible rendered field damages inside the same radius');
  await page.reload({waitUntil:'domcontentloaded',timeout:180000});await ready();
  report.cachedBoot=await page.evaluate(()=>window.EVOLVE_WEB_CLIENT.read());assert.equal(report.cachedBoot.cached,report.cachedBoot.total);assert.equal(report.cachedBoot.network,0);
  assert.equal(await page.evaluate(()=>window.__EVOLVE_ADMIN_MODE_V585__.read().enabled),false);report.checks.push('second startup reuses every cached asset with zero asset network bytes and administrator mode remains nonpersistent');
  assert.deepEqual(report.errors,[]);
  fs.writeFileSync(path.join(out,'playfield-v595-browser.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
