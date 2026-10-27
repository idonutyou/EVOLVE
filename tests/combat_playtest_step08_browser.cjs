'use strict';
// STEP08: test-only review runner. Existing published V614 game and assets are never modified.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist'),out=path.join(root,'test-results/step08');
fs.mkdirSync(out,{recursive:true});
const matrix=JSON.parse(fs.readFileSync(path.join(root,'docs/step08/PLAYTEST_MATRIX_V1.json')));
const version=JSON.parse(fs.readFileSync(path.join(dist,'version.json')));
const mode=process.env.STEP08_MODE||'probe',phase=process.env.STEP08_PHASE||'40';
assert.equal(matrix.cases.length,23);
assert.equal(version.version,'V575-STEP07-MONSTER-FEEDBACK-V614');
const mime={'.html':'text/html','.js':'application/javascript','.json':'application/json','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2','.css':'text/css','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1');
 const f=path.resolve(dist,'.'+(u.pathname==='/'?'/index.html':u.pathname));
 if(!f.startsWith(dist+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);
});
function capture(page,report){page.on('pageerror',e=>report.errors.push(String(e.message)));page.on('requestfailed',r=>{if(!r.url().startsWith('data:'))report.requestFailures.push({url:r.url(),reason:r.failure()?.errorText});});}
async function ready(page){
 await page.waitForFunction(()=>window.__EVOLVE_MONSTER_FEEDBACK_V614__?.read().version==='STEP07-V614' &&
 window.__EVOLVE_TEST_MODULE_V575__?.read().ready &&
 !!document.querySelector('#start') && !document.getElementById('start').disabled && !document.getElementById('webLoader'),
 null,{timeout:180000});
}

async function functional(page,report){
 await page.locator('#start').click();
 await require('./choose_opening_skill.cjs')(page);
 await page.waitForFunction(()=>window.__EVOLVE_TEST_MODULE_V575__.read().running);
 const data=await page.evaluate(async ()=>{
  const c=window.__EVOLVE_TEST_MODULE_V575__.test.context(),
   catalog=window.__EVOLVE_MONSTER_CATALOG_V593__.list(),
   spawn=window.__EVOLVE_STARTUP_V595__.test.spawn,
   damage=window.__EVOLVE_ORGAN_HITS_V613__.test.damage,
   mid=window.__EVOLVE_COMBAT_V596__.test,
   feedback=window.__EVOLVE_MONSTER_FEEDBACK_V614__,
   map=window.__EVOLVE_MAPS_V567__.test.context(),
   echo=feedback.test.context().deathEchoes,rows={ordinary:[],midboss:[],titan:[],availability:[]},issues=[];
  window.__EVOLVE_TEST_MODULE_V575__.setNatural(false);
  c.player.inv=999;c.player.hp=c.player.maxHp=10000;
  const template=catalog.find(x=>x.id==='crawler');
  const reset=()=>{for(const e of c.enemies)e.dead=true;c.enemies.length=0;
    for(const field of ['eBullets','telegraphs','biomeHazards'])if(Array.isArray(c[field]))c[field].length=0;
    const organs=window.__EVOLVE_ORGAN_SKILLS_V598__.test.context();
    for(const key of ['arm','shell','tail','mouth','wing','leg'])if(organs.state)organs.state[key]=0;
    feedback.test.reset();window.__EVOLVE_WEAPON_HITS_V612__.test.reset();window.__EVOLVE_ORGAN_HITS_V613__.test.reset();
  };
  // Test actual core hit + monster reaction for each existing ordinary actor type.
  for(const id of ['crawler','runner','brute','spitter','froststalker','bileback','ripper','mauler']){
   try{
    reset();const s=catalog.find(x=>x.id===id);if(!s){rows.ordinary.push({id,state:'unavailable'});continue;}
    const raw=spawn(s),e=Object.assign(raw,{type:id,x:c.player.x+60,y:c.player.y,hp:3500,maxHp:3500,spd:0,
      arrivalTime:0,arrivalInvuln:false,dead:false,barrier:0,prism:0,
      finalBoss:false,midBoss:false,elite:false,nemesis:false,eliteArmor:0,staggerLock:999,kx:0,ky:0,shot:999,dashCd:999,slamCd:999});
    c.enemies.splice(0,c.enemies.length,e);
    c.rebuild?.(); const previous=e.hp,hitEvents=window.EVOLVE_HIT_EVENTS.read().hits;
    damage(e,25,'arm',0);map.step(.016);c.draw();
    const impact={id,kind:'real_hurt_enemy_core',damage:previous-e.hp,
      hit_events_increment:window.EVOLVE_HIT_EVENTS.read().hits-hitEvents,
      fallback:feedback.read().fallback,activeVisual:feedback.read().active,
      death:false,score_by_human:null};
    rows.ordinary.push({...impact,state:impact.damage>0?'verified':'needs_review'});
   }catch(error){issues.push({case:id,error:String(error)});rows.ordinary.push({id,state:'blocked',error:String(error)});}
  }
  // Explicit death test uses the game's lethal-hit path. Never manufacture a second echo.
  try{
   reset();const e=spawn(template);Object.assign(e,{x:c.player.x+45,y:c.player.y,hp:30,maxHp:30,dead:false,arrivalTime:0,arrivalInvuln:false,
    elite:false,midBoss:false,finalBoss:false,barrier:0,prism:0,eliteArmor:0});
   c.enemies.splice(0,c.enemies.length,e);const oldEcho=echo.length;
   damage(e,500,'arm',0);c.draw();const added=echo.slice(oldEcho);
   rows.ordinary.push({id:'ordinary-lethal',state:e.dead&&added.length===1?'verified':'needs_review',dead:e.dead,
    echo_added:added.length,echo_decorated:added.filter(v=>v._monsterFeedbackDoneV614).length});
  }catch(error){issues.push({case:'ordinary-lethal',error:String(error)});}
  // Four actually implemented mid-boss profiles and their native preparation fields.
  for(const [id,skill] of [['alpha','crush'],['sentinel','fan'],['hunter','pounce'],['omega','rupture']]){
   try{
    reset();const e=spawn(catalog.find(x=>x.id===id));
    e.arrivalTime=0;e.arrivalInvuln=false;e.midSkillCdV596=99;
    c.enemies.splice(0,c.enemies.length,e);const rank=e.midRankV596?.id||null;
    const cast=mid.cast(e,skill),fields=mid.fields().filter(v=>v.owner===e&&v.kind===skill);
    c.draw();rows.midboss.push({id,skill,rank,cast_ok:cast!==false,
      fields:fields.length,warning_fields:fields.filter(v=>v.warn>=.72).length,
      player_hp:c.player.hp,visual_owner:feedback.read().active,
      state:fields.length&&fields.every(x=>x.warn>=.72)?'verified':'needs_review'});
   }catch(error){issues.push({case:id,error:String(error)});rows.midboss.push({id,state:'blocked',error:String(error)});}
  }
  // Five rank levels are stat/config coverage, not a claim of having played five fights.
  try{
   const stage=c.meta.stage,ranks=[];
   for(const n of [3,6,11,16,25]){c.meta.stage=n;const e={type:'brute',hp:250,maxHp:250,dmg:14,spd:29,r:12.5,xp:52,elite:true,eliteName:'ALPHA BRUTE'};mid.apply(e,'crusher');
    ranks.push({stage:n,rank:e.midRankV596?.id,size:e.midVisualSizeV596,hp:e.maxHp});}
   c.meta.stage=stage;rows.midboss.push({id:'rank-variants',state:ranks.length===5?'verified':'needs_review',ranks});
  }catch(error){issues.push({case:'rank-variants',error:String(error)});}
  // Actual boss spawns must use existing QA API and native phase state.
  for(const [kind,phase] of [['bio',1],['venom',3]]){
   try{
    reset();const ok=await window.__EVOLVE_TEST_MODULE_V575__.boss(kind,phase);
    for(let i=0;i<280;i++)c.step(.02);c.draw();
    const e=c.enemies.find(v=>v.finalBoss&&!v.dead);
    const cine=window.__EVOLVE_CINEMATIC_V580__.read();
    rows.titan.push({id:kind,request_ok:!!ok,spawned:!!e,actual_type:e?.type||null,
      hp:e?.hp||null,phase:kind==='venom'?e?.venomPhaseV554:null,
      attack_warning:!!cine,source:'native_QA_boss_spawn',state:ok&&e?'verified':'needs_review',
      subjective_rating:null});
   }catch(error){issues.push({case:kind,error:String(error)});rows.titan.push({id:kind,state:'blocked',error:String(error)});}
  }
  rows.availability.push({id:'remaining-five-titans',state:'not_confirmed',reason:'Cannot infer all seven planned TITAN implementations from BIO/VENOM QA shortcuts'});
  return {rows,issues,clock:window.__EVOLVE_TEST_MODULE_V575__.read().seconds,feedback:feedback.read()};
 });
 report.functional=data;console.log('STEP08_FUNCTIONAL_DATA '+JSON.stringify(data));
 for(const r of data.rows.ordinary.filter(x=>x.id!=='ordinary-lethal')){
  const id=r.id==='crawler'?'O01':r.id==='spitter'?'O02':r.id==='brute'?'O03':r.id==='froststalker'?'O04':null;
  if(id){const caseRow=report.scenarios.find(x=>x.id===id);Object.assign(caseRow,{status:r.state==='verified'?'functional_verified':'partial',evidence:r,mode:'game_core_hit_not_human_play'});}
 }
 const midIds=['M01','M02','M03','M04'];
 data.rows.midboss.filter(x=>x.id!=='rank-variants').forEach((r,i)=>Object.assign(report.scenarios.find(x=>x.id===midIds[i]),{status:r.state==='verified'?'functional_verified':'partial',evidence:r,mode:'native_midboss_skill_fields'}));
 const rank=data.rows.midboss.find(x=>x.id==='rank-variants');
 Object.assign(report.scenarios.find(x=>x.id==='M05'),{status:rank?.state==='verified'?'functional_verified':'partial',evidence:rank||null,mode:'config_only_not_five_play_sessions'});
 for(const r of data.rows.titan){
  const ids=r.id==='bio'?['T01','T02']:['T03','T04'];for(const id of ids)Object.assign(report.scenarios.find(x=>x.id===id),
  {status:r.state==='verified'?'partial':'blocked',evidence:r,mode:'native_boss_spawn_not_near_far_attacks'});
 }
 Object.assign(report.scenarios.find(x=>x.id==='T05'),{status:'not_confirmed',evidence:data.rows.availability[0]});
 report.functionalVerified=data.rows.ordinary.filter(x=>x.state==='verified').length+
  data.rows.midboss.filter(x=>x.state==='verified').length+data.rows.titan.filter(x=>x.state==='verified').length;
 // The test is valid only if real gameplay is actually exercised; incomplete subcases stay incomplete.
 assert.ok(data.rows.ordinary.some(x=>x.damage>0),'No successful actual monster HP change');
 assert.ok(data.rows.midboss.some(x=>x.fields>0),'No native midboss attack warning');
 assert.ok(data.rows.titan.some(x=>x.spawned),'No actual TITAN encountered');
 await page.screenshot({path:path.join(out,'step08-functional-last-boss.png')});
 return data;
}

async function main(){
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const chrome=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
 const context=await chrome.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
 const page=await context.newPage();
 const report={step:8,percent:Number(phase),mode,version:version.version,build:version.build,
   scenarios_planned:matrix.cases.length,scenarios:[],errors:[],requestFailures:[],
   realPhoneTested:false,humanRatingsCollected:false,gameFilesChanged:false};
 capture(page,report);
 try{
  // Only deterministic functional mode deliberately freezes the game's own animation loop.
  if(mode!=='realtime')await page.addInitScript(()=>{
   const original=requestAnimationFrame.bind(window);window.requestAnimationFrame=fn=>fn.name==='loop'?0:original(fn);
  });
  await page.goto('http://127.0.0.1:'+server.address().port+'/?evolveQA=1',{waitUntil:'domcontentloaded',timeout:180000});
  await ready(page);
  const boot=await page.evaluate(()=>({
   version:window.EVOLVE_WEB_CONFIG,feedback:window.__EVOLVE_MONSTER_FEEDBACK_V614__.read(),
   testAPI:typeof window.__EVOLVE_TEST_MODULE_V575__.test?.context==='function',
   catalog:window.__EVOLVE_MONSTER_CATALOG_V593__?.list().map(x=>x.id),
   weaponMode:window.__EVOLVE_ARM_ITEMS_V589__?.read().mode,
   bossQA:typeof window.__EVOLVE_TEST_MODULE_V575__.boss==='function'
  }));
  assert.equal(boot.version.build,version.build);
  assert.equal(boot.feedback.version,'STEP07-V614');
  assert.equal(boot.testAPI,true);
  assert.ok(boot.catalog?.includes('crawler')&&boot.catalog?.includes('alpha'));
  report.boot=boot;
  report.scenarios=matrix.cases.map(x=>({id:x.id,status:'not_executed'}));
  if(mode==='probe')report.success=true;
  else if(mode==='functional'){await functional(page,report);report.success=true;}
  else throw new Error('Mode '+mode+' is not implemented yet, no claim of measured performance');
 }catch(e){report.success=false;report.failure=String(e.stack||e);
  await page.screenshot({path:path.join(out,'step08-'+mode+'-failed.png')}).catch(()=>{});throw e;
 }finally{
  fs.writeFileSync(path.join(out,'step08-'+mode+'.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({mode,success:report.success,scenarios_planned:report.scenarios_planned,
   executed:report.scenarios.filter(x=>x.status!=='not_executed').length,
   errors:report.errors,requestFailures:report.requestFailures,build:report.build}));
  await context.close();await chrome.close();server.close();
 }
}
main().catch(e=>{console.error(e);process.exitCode=1;server.close();});
