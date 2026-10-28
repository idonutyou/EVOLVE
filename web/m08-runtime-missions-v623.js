/* EVOLVE M08 20% — read-only run-result and codex discovery observation.
   DOM result and codex counts are local indications, not verified game receipts.
   No combat hooks, save migration, payment, or reward grants. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&root.window===root){root.__EVOLVE_M08_RUNTIME_MISSIONS_V623__=api;api.mount(root);}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const KEY='EVOLVE_M08_RUNTIME_MISSIONS_V623_V1',SCHEMA='evolve.m08.runtime.v623.1';
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 const plain=o=>o!==null&&typeof o==='object'&&!Array.isArray(o);
 const validCount=n=>Number.isSafeInteger(n)&&n>=0&&n<=10000;
 function dayOf(ts){if(!Number.isFinite(ts)||ts<0)throw Error('INVALID_CLOCK');return new Date(ts+32400000).toISOString().slice(0,10);}
 function parseCodex(text){
  if(typeof text!=='string')return null;
  const match=text.trim().match(/^(?:DISCOVERED|발견)\s+(\d+)\s*\/\s*(\d+)/i);
  if(!match)return null;
  const count=Number(match[1]),total=Number(match[2]);
  return validCount(count)&&validCount(total)&&total>0&&count<=total?{count,total}:null;
 }
 const fresh=()=>({schema:SCHEMA,revision:0,runEnds:0,discoveries:0,codex:null,days:{}});
 function validate(s){
  if(!plain(s)||s.schema!==SCHEMA||!validCount(s.revision)||!validCount(s.runEnds)||!validCount(s.discoveries)||!plain(s.days)||Object.keys(s.days).length>1000)throw Error('RUNTIME_MISSION_CORRUPT');
  if(s.codex!==null&&(!plain(s.codex)||!validCount(s.codex.count)||!validCount(s.codex.total)||s.codex.total===0||s.codex.count>s.codex.total))throw Error('RUNTIME_MISSION_CORRUPT');
  for(const [day,v]of Object.entries(s.days)){
   if(!/^20\d\d-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(day)||!plain(v)||!validCount(v.runEnds)||!validCount(v.discoveries))throw Error('RUNTIME_MISSION_CORRUPT');
  }
  return s;
 }
 function createObserver({storage,readGame,readUi,clock=()=>Date.now()}={}){
  if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function'||typeof readGame!=='function'||typeof readUi!=='function')throw Error('RUNTIME_MISSION_SETUP');
  let armed=false,tainted=false,resultLatched=false,codexNeedsBaseline=false;
  const read=()=>{let raw;try{raw=storage.getItem(KEY)}catch(_){throw Error('RUNTIME_MISSION_STORAGE')};if(raw===null)return null;
   try{return validate(JSON.parse(raw))}catch(_){throw Error('RUNTIME_MISSION_CORRUPT')}};
  const save=s=>{validate(s);try{storage.setItem(KEY,JSON.stringify(s))}catch(_){throw Error('RUNTIME_MISSION_SAVE_FAILED')}};
  const status=(s,day,reason)=>Object.freeze({day,reason,initialised:!!s,runEnds:s?.runEnds||0,discoveries:s?.discoveries||0,
    todayRuns:s?.days[day]?.runEnds||0,todayDiscoveries:s?.days[day]?.discoveries||0,source:'LOCAL_UI_OBSERVATION',serverVerified:false,rewardGrants:0});
  function poll(){
   const day=dayOf(clock()),existing=read(),game=readGame(),ui=readUi();
   if(!plain(game)||typeof game.enabled!=='boolean'||!plain(game.normal)||!Number.isSafeInteger(game.normal.unlocked)||game.normal.unlocked<1||game.normal.unlocked>100||
      !plain(ui)||typeof ui.home!=='boolean'||typeof ui.battleActive!=='boolean'||typeof ui.resultVisible!=='boolean'||typeof ui.codexVisible!=='boolean'||
      (ui.codexCount!==null&&(!plain(ui.codexCount)||!validCount(ui.codexCount.count)||!validCount(ui.codexCount.total)||ui.codexCount.total<1||ui.codexCount.count>ui.codexCount.total)))
     return status(existing,day,'SOURCE_UNAVAILABLE');
   const s=existing||fresh();
   let changed=!existing,reason='NO_NEW_EVENT';
   if(game.enabled){armed=false;tainted=true;codexNeedsBaseline=true;}
   if(ui.home){armed=false;tainted=false;}
   else if(ui.battleActive&&!ui.resultVisible&&!game.enabled&&!tainted)armed=true;
   if(ui.resultVisible){
    if(!resultLatched&&armed&&!tainted&&!game.enabled){
     const d=s.days[day]||{runEnds:0,discoveries:0};
     if(s.runEnds>=10000||d.runEnds>=10000)throw Error('RUNTIME_MISSION_LIMIT');
     d.runEnds++;s.days[day]=d;s.runEnds++;changed=true;reason='RUN_RESULT_OBSERVED';
    }
    armed=false;resultLatched=true;
   }else resultLatched=false;
   if(ui.codexVisible&&ui.codexCount){
    const c=ui.codexCount,p=s.codex;
    if(!p||game.enabled||codexNeedsBaseline||c.total!==p.total||c.count<p.count){
     if(!p||p.count!==c.count||p.total!==c.total){s.codex={count:c.count,total:c.total};changed=true;}
     if(!game.enabled)codexNeedsBaseline=false;
     if(reason==='NO_NEW_EVENT')reason='CODEX_BASELINE';
    }else if(c.count>p.count){
     const delta=c.count-p.count,d=s.days[day]||{runEnds:0,discoveries:0};
     if(s.discoveries>10000-delta||d.discoveries>10000-delta)throw Error('RUNTIME_MISSION_LIMIT');
     d.discoveries+=delta;s.days[day]=d;s.discoveries+=delta;s.codex={count:c.count,total:c.total};
     changed=true;reason=reason==='RUN_RESULT_OBSERVED'?'RUN_AND_CODEX_OBSERVED':'CODEX_DISCOVERY_OBSERVED';
    }
   }
   if(changed){s.revision++;save(s);}
   return status(s,day,reason);
  }
  return Object.freeze({poll,snapshot:()=>status(read(),dayOf(clock()),'READ_ONLY'),storageKey:KEY});
 }
 function mount(w){
  if(!w.document||!w.localStorage)return false;
  const doc=w.document, visible=id=>{const el=doc.getElementById(id);return !!el&&w.getComputedStyle(el).display!=='none'&&w.getComputedStyle(el).visibility!=='hidden';};
  function readUi(){
   const atHome=w.EVOLVE_WEB_GUARD?.atHome?.(),resultVisible=visible('endOverlay'),codexVisible=visible('codexOverlay');
   return {home:atHome===true,battleActive:atHome===false&&!resultVisible,resultVisible,codexVisible,
    codexCount:codexVisible?parseCodex(doc.getElementById('codexSummary')?.textContent||''):null};
  }
  let tracker;try{tracker=createObserver({storage:w.localStorage,readGame:()=>w.__EVOLVE_ADMIN_MODE_V585__?.read?.()||null,readUi});}catch(_){return false;}
  const styleId='m08RuntimeStyleV623',styleText='#homeChallengeViewV601 .m08RuntimeCardV623{margin:12px 0;padding:14px;border:1px solid #637b8c;border-radius:12px;background:linear-gradient(145deg,#1d303a,#161d27);color:#e8edf2;font-family:system-ui}' +
   '#homeChallengeViewV601 .m08RuntimeCardV623 h3{margin:0 0 10px;font-size:16px;color:#c9e9fa}' +
   '#homeChallengeViewV601 .m08RuntimeCardV623 p{margin:7px 0;font-size:12px;line-height:1.55;color:#b9ccd6}' +
   '#homeChallengeViewV601 .m08RuntimeCardV623 progress{width:100%;height:10px;accent-color:#74abc7}';
  let box=null,last='';
  function draw(s){
   const host=doc.getElementById('homeChallengeViewV601');if(!host)return;
   if(!box){
    box=doc.createElement('section');box.id='m08RuntimeMissionsV623';box.className='m08RuntimeCardV623';box.setAttribute('aria-label','전투·도감 연구 임무');host.append(box);
    if(!doc.getElementById(styleId)){const style=doc.createElement('style');style.id=styleId;style.textContent=styleText;doc.head.append(style);}
   }
   const stamp=[s.day,s.todayRuns,s.todayDiscoveries,s.runEnds,s.discoveries,s.reason].join('|');if(stamp===last)return;last=stamp;
   box.replaceChildren();const title=doc.createElement('h3');title.textContent='전투 · 도감 연구';box.append(title);
   for(const [label,value,count]of [['전투 결과 확인',s.todayRuns,s.runEnds],['새 도감 발견',s.todayDiscoveries,s.discoveries]]){
    const p=doc.createElement('p');p.textContent=label+' · 오늘 '+(value>0?'완료':'진행 대기')+' · 누적 '+count;box.append(p);
    const bar=doc.createElement('progress');bar.max=1;bar.value=value>0?1:0;bar.setAttribute('aria-label',label+' 임무 진행');box.append(bar);
   }
   const note=doc.createElement('p');note.textContent='일반 전투 결과 화면과 도감의 새 발견을 이 기기에서 기록합니다. 최초 발견 수는 소급하지 않으며 보상 지급은 아직 연결되지 않았습니다.';box.append(note);
  }
  function tick(){try{const s=tracker.poll();if(s.initialised)draw(s);}catch(_){if(box){const p=box.querySelector('p');if(p)p.textContent='연구 기록 확인이 필요합니다. 저장 데이터를 덮어쓰지 않았습니다.';}}}
  tick();const timer=w.setInterval(tick,1200);w.addEventListener('pageshow',tick);
  for(const id of ['memoryBtn','codexBtn'])doc.getElementById(id)?.addEventListener('click',tick);
  w.__EVOLVE_M08_RUNTIME_MISSIONS_V623_ACTIVE__=Object.freeze({read:()=>tracker.snapshot(),refresh:tick,stop:()=>w.clearInterval(timer),mode:'READ_ONLY_NO_REWARDS'});
  return true;
 }
 return Object.freeze({createObserver,parseCodex,dayOf,mount,storageKey:KEY,mode:'LOCAL_RUNTIME_MISSION_OBSERVER'});
});
