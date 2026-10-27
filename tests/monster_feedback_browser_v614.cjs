const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const dist=path.resolve(__dirname,'../dist'),out=path.resolve(__dirname,'../test-results');
fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');
 const p=path.resolve(dist,'.'+(url.pathname==='/'?'/index.html':url.pathname));
 if(!p.startsWith(dist+path.sep)||!fs.existsSync(p)){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',mime[path.extname(p)]||'application/octet-stream');fs.createReadStream(p).pipe(res);
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const live=process.env.EVOLVE_TEST_BASE_URL,base=live||'http://127.0.0.1:'+server.address().port+'/';
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
 const page=await context.newPage(),label=live?'monster-feedback-live':'monster-feedback-local';
 const report={live:!!live,checks:[],errors:[],failedRequests:[],physical_Galaxy_S23_plus_tested:false};
 page.on('pageerror',e=>report.errors.push(e.message));
 page.on('requestfailed',r=>{if(!r.url().startsWith('data:'))report.failedRequests.push(r.url());});
 const ready=()=>page.waitForFunction(()=>window.__EVOLVE_MONSTER_FEEDBACK_V614__?.read().version==='STEP07-V614' &&
  window.__EVOLVE_ORGAN_HITS_V613__?.read().imageReady.spike && !document.getElementById('start').disabled &&
  !document.getElementById('webLoader'),null,{timeout:30000});
 try{
  await page.addInitScript(()=>{const raf=requestAnimationFrame.bind(window);
   window.requestAnimationFrame=cb=>cb.name==='loop'?0:raf(cb);});
  const url=new URL(base);url.searchParams.set('evolveQA','1');
  await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:180000});
  try{await ready();}catch(error){
   report.bootDiagnostic=await page.evaluate(()=>({
    loader:!!document.getElementById('webLoader'),start:!!document.getElementById('start'),startDisabled:document.getElementById('start')?.disabled,
    organ:window.__EVOLVE_ORGAN_HITS_V613__?.read(),monster:window.__EVOLVE_MONSTER_FEEDBACK_V614__?.read(),
    version:window.EVOLVE_WEB_CONFIG,loading:document.readyState,
    scripts:Array.from(document.scripts).map(s=>({src:s.src||'',loaded:s.readyState||'',type:s.type||''})).slice(-8)
   }));
   throw new Error('V614 initial readiness failed: '+JSON.stringify(report.bootDiagnostic)+'; '+error.message);
  }
  report.version=await page.evaluate(()=>window.EVOLVE_WEB_CONFIG);
  const expected=JSON.parse(fs.readFileSync(path.join(dist,'version.json'),'utf8'));
  assert.equal(report.version.version,expected.version);
  assert.equal(report.version.build,expected.build);
  assert.equal(report.version.version,'V575-STEP07-MONSTER-FEEDBACK-V614');
  await page.locator('#homeLabTab').click();
  await page.locator('#partsGridV523 [data-part-id="arm_cannon"]').click();
  await page.locator('#partsDetailEquipV523').click();
  await page.locator('#homeBattleTabV522').click();
  await page.locator('#start').click();await require('./choose_opening_skill.cjs')(page);
  await page.waitForFunction(()=>window.__EVOLVE_TEST_MODULE_V575__.read().running);
  const make=await page.evaluate(()=>{
   const a=window.__EVOLVE_ORGAN_SKILLS_V598__.test,
      ctx=a.context(),test=window.__EVOLVE_MONSTER_FEEDBACK_V614__.test,
      roster=window.__EVOLVE_MONSTER_CATALOG_V593__.list();
   const template=window.__EVOLVE_STARTUP_V595__.test.spawn(roster.find(q=>q.id==='crawler'));
   if(!template)throw Error('No actual enemy fixture');
   window.__MONSTER_V614_FIXTURE__={fresh:(hp=1000)=>{
    a.clear();test.reset();window.__EVOLVE_WEAPON_HITS_V612__.test.reset();
    const c=a.context();for(const k of ['arm','shell','mouth','tail','wing','leg'])c.state[k]=0;
    c.player.inv=999;c.player.hp=c.player.maxHp=10000;
    const e={...template,x:c.player.x+55,y:c.player.y,hp,maxHp:hp,dead:false,type:'crawler',r:10,spd:0,
     arrivalTime:0,arrivalInvuln:false,_mapBirthLockedV562:false,barrier:0,prism:0,elite:false,
     eliteArmor:0,nemesis:false,zoneElite:false,midBoss:false,finalBoss:false,stagger:0,staggerLock:999,kx:0,ky:0};
    c.enemies.splice(0,c.enemies.length,e);c.grid();return {e,c};
   }};
   return {ready:window.__EVOLVE_MONSTER_FEEDBACK_V614__.read().version==='STEP07-V614',template:template.type};
  });
  assert.equal(make.ready,true);report.checks.push('V614 boots, original enemy fixture exists and event subscriber connects');
  report.fallback=await page.evaluate(()=>{
   const {e,c}=window.__MONSTER_V614_FIXTURE__.fresh(),m=window.__EVOLVE_MONSTER_FEEDBACK_V614__;
   const hp=e.hp;
   window.__EVOLVE_ORGAN_HITS_V613__.test.damage(e,15,'arm',0);
   window.__EVOLVE_MAPS_V567__.test.context().step(.016);c.draw();return {damage:hp-e.hp,pose:m.test.pose(e),read:m.read(),source:window.EVOLVE_HIT_EVENTS.read()};
  });
  assert.ok(report.fallback.damage>0);assert.ok(report.fallback.read.fallback>0);
  assert.ok(report.fallback.pose?.sx<1);assert.equal(report.fallback.read.connected,true);report.checks.push('Actual game hurtEnemy produces a bounded generic visual recoil without modifying damage path');
  await page.screenshot({path:path.join(out,label+'-hurt.png')});
  report.weapon=await page.evaluate(()=>{
   const {e,c}=window.__MONSTER_V614_FIXTURE__.fresh(),m=window.__EVOLVE_MONSTER_FEEDBACK_V614__;
   window.__EVOLVE_WEAPON_HITS_V612__.test.damage(e,18,'gun',0);c.draw();
   return {fallback:m.read().fallback,ownerSkipped:m.read().ownerSkipped,weapon:window.__EVOLVE_WEAPON_HITS_V612__.read().gun};
  });
  assert.equal(report.weapon.fallback,0);assert.ok(report.weapon.ownerSkipped>0);
  assert.ok(report.weapon.weapon>0);report.checks.push('Gun retains STEP05 exclusive response ownership and no duplicated V614 transform');
  report.death=await page.evaluate(()=>{
   const {e,c}=window.__MONSTER_V614_FIXTURE__.fresh(35),m=window.__EVOLVE_MONSTER_FEEDBACK_V614__;
   const prev=c.deathEchoes.length;window.__EVOLVE_ORGAN_HITS_V613__.test.damage(e,800,'arm',0);c.draw();
   const added=c.deathEchoes.slice(prev);
   return {dead:e.dead,echoCount:added.length,decorated:added.filter(d=>d._monsterFeedbackDoneV614).length,stats:m.read(),hp:e.hp};
  });
  assert.equal(report.death.dead,true);assert.equal(report.death.echoCount,1);
  assert.equal(report.death.decorated,1);report.checks.push('Actual lethal hit creates only one existing death echo, decorated once by V614');
  await page.screenshot({path:path.join(out,label+'-death.png')});
  report.crowd=await page.evaluate(()=>{
   const m=window.__EVOLVE_MONSTER_FEEDBACK_V614__.test;m.reset();
   const c=window.__EVOLVE_ORGAN_HITS_V613__.test.context(),origin=c.enemies.length;
   for(let i=0;i<250;i++){const e={type:'crawler',hp:100,maxHp:100,x:i,y:1,dead:false};
    m.receive({type:'hit',kind:'arm',damage:10,knockback:{x:1,y:0},target:{hpBefore:100}},e);}
   const info=window.__EVOLVE_MONSTER_FEEDBACK_V614__.read();m.reset();return {info,enemyCount:c.enemies.length,origin};
  });
  assert.ok(report.crowd.info.active<=24);assert.equal(report.crowd.origin,report.crowd.enemyCount);
  await page.setViewportSize({width:852,height:393});
  await page.evaluate(()=>window.__EVOLVE_ORGAN_HITS_V613__.test.context().draw());
  await page.screenshot({path:path.join(out,label+'-landscape.png')});
  await page.evaluate(()=>window.__EVOLVE_TEST_MODULE_V575__.test.context().home('battle'));
  await ready();assert.equal(await page.evaluate(()=>window.__EVOLVE_MONSTER_FEEDBACK_V614__.read().active),0);
  await page.setViewportSize({width:393,height:852});
  await page.reload({waitUntil:'domcontentloaded',timeout:180000});await ready();
  assert.equal(await page.evaluate(()=>window.__EVOLVE_ARM_ITEMS_V589__.read().mode),'cannon');
  assert.equal(await page.evaluate(()=>window.__EVOLVE_MONSTER_FEEDBACK_V614__.read().active),0);
  report.checks.push('Crowd cap, portrait/landscape, home reset and persisted equipped gun passed');
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedRequests,[]);report.success=true;
 }catch(error){report.success=false;report.failure=error.stack||String(error);
  await page.screenshot({path:path.join(out,label+'-failure.png')}).catch(()=>{});throw error;
 }finally{fs.writeFileSync(path.join(out,label+'.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));await context.close();await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
