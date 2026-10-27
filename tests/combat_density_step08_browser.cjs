'use strict';
// STEP08 density investigation. Original V614 game and public assets untouched.
// The test measures browser JS work per fixed call, not true phone FPS.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const dist=path.resolve(__dirname,'../dist'),out=path.resolve(__dirname,'../test-results/step08');
fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'application/javascript','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.css':'text/css','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost'),f=path.resolve(dist,'.'+(u.pathname==='/'?'/index.html':u.pathname));if(!f.startsWith(dist+path.sep)||!fs.existsSync(f)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);});
const percentile=(sorted,p)=>sorted.length?sorted[Math.min(sorted.length-1,Math.floor((sorted.length-1)*p))]:null;
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true}),page=await context.newPage(),report={mode:'fixed_stepped_real_living_enemy_density',build:null,results:[],errors:[],networkErrors:[],physicalPhoneTested:false,subjectiveJudgment:null};
 page.on('pageerror',e=>report.errors.push(e.message));page.on('requestfailed',r=>{if(!r.url().startsWith('data:'))report.networkErrors.push(r.url());});
 try{
  await page.addInitScript(()=>{const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>cb.name==='loop'?0:raf(cb);});
  await page.goto('http://127.0.0.1:'+server.address().port+'/?evolveQA=1',{waitUntil:'domcontentloaded',timeout:180000});
  await page.waitForFunction(()=>window.__EVOLVE_HORDE_ROLES_V591__?.test?.context && !document.getElementById('start')?.disabled&&!document.getElementById('webLoader'),null,{timeout:180000});
  report.build=await page.evaluate(()=>window.EVOLVE_WEB_CONFIG.build);
  assert.equal(report.build,'8bf4982e0c0662adaf631bc0abbf3f96cf9dc509697dd0f26d5d46408c046317');
  await page.locator('#start').click();
  await require('./choose_opening_skill.cjs')(page);
  await page.waitForFunction(()=>window.__EVOLVE_TEST_MODULE_V575__.read().running);
  report.results=await page.evaluate(()=>{
   const c=window.__EVOLVE_HORDE_ROLES_V591__.test.context(),
     spawn=window.__EVOLVE_STARTUP_V595__.test.spawn,
     catalog=window.__EVOLVE_MONSTER_CATALOG_V593__.list(),
     ids=['crawler','runner','brute','spitter','ripper','mauler','bileback','froststalker'],
     rows=[],p=(vals,n)=>vals.length?vals[Math.min(vals.length-1,Math.floor((vals.length-1)*n))]:null;
   window.__EVOLVE_TEST_MODULE_V575__.setNatural(false);c.player.inv=999;c.player.hp=c.player.maxHp=10000;
   for(const k of ['arm','tail','mouth','wing','leg','shell'])if(k in c.state)c.state[k]=0;
   for(const count of [50,180,250]){
    c.enemies.length=0;c.eBullets.length=0;c.telegraphs.length=0;c.biomeHazards.length=0;c.drops.length=0;
    for(let i=0;i<count;i++){
     const id=ids[i%ids.length],s=catalog.find(x=>x.id===id),e=spawn(s);
     if(!e)throw Error('Missing monster '+id);
     const angle=(i*2.399963229728653)%6.28318530718,dist=35+Math.sqrt(i)*16;
     Object.assign(e,{x:c.player.x+Math.cos(angle)*dist,y:c.player.y+Math.sin(angle)*dist,
      hp:10000,maxHp:10000,dead:false,arrivalTime:0,arrivalInvuln:false,
      _mapBirthLockedV562:false,r:e.r||10,spd:Math.max(12,e.spd||24),
      shot:999,dashCd:999,slamCd:999,frostSpecialCd:999,
      barrier:0,prism:0,elite:false,midBoss:false,nemesis:false,finalBoss:false});
     c.enemies.push(e);
    }
    c.rebuild();
    const activeStart=c.enemies.filter(e=>!e.dead).length,stepTimes=[],drawTimes=[];
    for(let i=0;i<30;i++){
     const a=performance.now();c.step(.016);const b=performance.now();
     c.draw();const d=performance.now();stepTimes.push(b-a);drawTimes.push(d-b);
    }
    const sort=x=>x.sort((a,b)=>a-b);
    sort(stepTimes);sort(drawTimes);
    rows.push({configured_real_sprite_monsters:count,living_at_start:activeStart,
     living_at_end:c.enemies.filter(e=>!e.dead).length,
     simulation_game_seconds:30*.016,loop_count:30,
     p50_cpu_step_ms:p(stepTimes,.5),p95_cpu_step_ms:p(stepTimes,.95),
     p50_draw_call_ms:p(drawTimes,.5),p95_draw_call_ms:p(drawTimes,.95),
     max_draw_ms:drawTimes.at(-1),max_step_ms:stepTimes.at(-1),
     cpu_step_and_draw_p95_sum_ms:p(stepTimes,.95)+p(drawTimes,.95),
     note:'Fixed time step with real living species objects and original renderer; not continuous RAF/FPS, not human driving'});
   }
   return rows;
  });
  for(const entry of report.results){
   assert.equal(entry.configured_real_sprite_monsters,entry.living_at_start);
   assert.ok(entry.living_at_end>=entry.living_at_start*.9);
   assert.ok(entry.p95_draw_call_ms>=0&&entry.p95_cpu_step_ms>=0);
  }
  await page.screenshot({path:path.join(out,'step08-density-250.png')});
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.networkErrors,[]);
  report.success=true;
 }catch(error){report.success=false;report.failure=String(error.stack||error);
  await page.screenshot({path:path.join(out,'step08-density-failure.png')}).catch(()=>{});
  throw error;
 }finally{
  fs.writeFileSync(path.join(out,'step08-density-50-180-250.json'),JSON.stringify(report,null,2)+'\n');
  console.log('STEP08_DENSITY_RESULT '+JSON.stringify({success:report.success,results:report.results,errors:report.errors}));
  await context.close();await browser.close();server.close();
 }
})().catch(err=>{console.error(err);process.exitCode=1;server.close();});
