/* EVOLVE M08 10% — bridge authentic on-device stage-unlock changes to CHALLENGE.
   No billing, no server certification, no currency grants, no game-engine mutation.
   Local admin/test progress is not evidence for any real-money entitlement. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&root.window===root){root.__EVOLVE_M08_STAGE_MISSION_V622__=api;api.mount(root);}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const KEY='EVOLVE_M08_STAGE_MISSION_V622_V1',SCHEMA='evolve.m08.stage.v622.1';
 const plain=o=>o!==null&&typeof o==='object'&&!Array.isArray(o);
 const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
 const isoDay=t=>{if(!Number.isFinite(t)||t<0)throw Error('INVALID_CLOCK');return new Date(t+32400000).toISOString().slice(0,10);};
 const validSource=src=>plain(src)&&typeof src.enabled==='boolean'&&plain(src.normal)&&Number.isSafeInteger(src.normal.unlocked)&&src.normal.unlocked>=1&&src.normal.unlocked<=100;
 function createTracker({storage,readGame,clock=()=>Date.now()}={}){
  if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function'||typeof readGame!=='function')throw Error('TRACKER_SETUP_INVALID');
  const fresh=unlocked=>({schema:SCHEMA,seenUnlocked:unlocked,stageEvents:0,completed:{},days:{},lastStage:0,revision:0});
  function read(){
   let value;try{value=storage.getItem(KEY)}catch(_){throw Error('TRACKER_STORAGE_UNAVAILABLE')}
   if(value===null)return null;
   let s;try{s=JSON.parse(value)}catch(_){throw Error('TRACKER_CORRUPT')}
   if(!plain(s)||s.schema!==SCHEMA||!Number.isSafeInteger(s.seenUnlocked)||s.seenUnlocked<1||s.seenUnlocked>100||!Number.isSafeInteger(s.stageEvents)||s.stageEvents<0||s.stageEvents>99||!plain(s.completed)||!plain(s.days)||!Number.isSafeInteger(s.lastStage)||s.lastStage<0||s.lastStage>99||!Number.isSafeInteger(s.revision)||s.revision<0)throw Error('TRACKER_CORRUPT');
   const completed=Object.keys(s.completed),days=Object.keys(s.days);
   if(completed.length>99||days.length>500||s.stageEvents!==completed.length)throw Error('TRACKER_CORRUPT');
   if(completed.some(k=>!/^(?:[1-9]|[1-9][0-9])$/.test(k)||s.completed[k]!==true)||days.some(k=>!/^20\d\d-(0[1-9]|1[0-2])-([0-2][0-9]|3[01])$/.test(k)||s.days[k]!==true))throw Error('TRACKER_CORRUPT');
   return s;
  }
  function write(s){try{storage.setItem(KEY,JSON.stringify(s))}catch(_){throw Error('TRACKER_SAVE_FAILED')}}
  function status(s,day,reason){return Object.freeze({source:'LOCAL_STAGE_UNLOCK',day,initialised:!!s,completedToday:!!s?.days[day],total:s?.stageEvents||0,lastStage:s?.lastStage||0,reason,realPayment:false,serverVerified:false,rewardGrants:0});}
  function poll(){
   const game=readGame(),day=isoDay(clock());
   if(!validSource(game))return status(read(),day,'SOURCE_UNAVAILABLE');
   const unlocked=game.normal.unlocked;
   let s=read();
   if(!s){s=fresh(unlocked);write(s);return status(s,day,'BASELINE_INITIALIZED')}
   if(game.enabled){
    if(s.seenUnlocked!==unlocked){s.seenUnlocked=unlocked;s.revision++;write(s)}
    return status(s,day,'ADMIN_IGNORED');
   }
   if(unlocked===s.seenUnlocked)return status(s,day,'UNCHANGED');
   // A single legitimate new stage unlock comes through the existing game's
   // grantStageClearReward() -> normalProgressV585.unlocked increment.
   // Unexpected jumps are not counted; this remains local and spoofable.
   if(unlocked!==s.seenUnlocked+1){s.seenUnlocked=unlocked;s.revision++;write(s);return status(s,day,'JUMP_OR_RESET_IGNORED')}
   const stage=unlocked-1,key=String(stage);
   s.seenUnlocked=unlocked;s.revision++;
   if(!own(s.completed,key)){s.completed[key]=true;s.stageEvents++;s.days[day]=true;s.lastStage=stage;write(s);return status(s,day,'STAGE_CLEAR_OBSERVED')}
   write(s);return status(s,day,'REPEATED_STAGE_IGNORED');
  }
  function snapshot(){return status(read(),isoDay(clock()),'READ_ONLY')}
  return Object.freeze({poll,snapshot,storageKey:KEY});
 }
 function mount(w){
  if(!w.document||!w.localStorage)return false;
  const document=w.document,styleId='m08StageMissionStyleV622';
  let tracker;
  try{tracker=createTracker({storage:w.localStorage,readGame:()=>w.__EVOLVE_ADMIN_MODE_V585__?.read?.()||null});}
  catch(_){return false}
  const styleText='#homeChallengeViewV601 .m08StageCardV622{margin:12px 0;padding:14px;border:1px solid #ad7258;border-radius:12px;background:linear-gradient(145deg,#362b30,#1b2028);color:#f8e9d8;font-family:system-ui}' +
  '#homeChallengeViewV601 .m08StageCardV622 h3{font-size:16px;margin:0 0 8px;color:#ffdfb9}' +
  '#homeChallengeViewV601 .m08StageCardV622 p{font-size:12px;line-height:1.5;color:#d9b7aa;margin:7px 0}' +
  '#homeChallengeViewV601 .m08StageCardV622 .m08StatV622{font-size:22px;color:#ffcf95;font-weight:900}' +
  '#homeChallengeViewV601 .m08StageCardV622 progress{width:100%;height:12px;accent-color:#d2906a}';
  let box=null,last='';
  function draw(s){
   const host=document.getElementById('homeChallengeViewV601');if(!host)return;
   if(!box){box=document.createElement('section');box.className='m08StageCardV622';box.id='m08StageMissionV622';box.setAttribute('aria-label','스테이지 클리어 임무');host.append(box);
    if(!document.getElementById(styleId)){const style=document.createElement('style');style.id=styleId;style.textContent=styleText;document.head.append(style)}}
   const key=s.day+'|'+s.completedToday+'|'+s.total+'|'+s.lastStage+'|'+s.reason;
   if(key===last)return;last=key;
   box.replaceChildren();
   const title=document.createElement('h3');title.textContent='스테이지 클리어 임무';box.append(title);
   const lead=document.createElement('p');lead.textContent=s.completedToday?'오늘 달성 완료':'새 스테이지를 클리어하면 자동 진행';box.append(lead);
   const progress=document.createElement('progress');progress.max=1;progress.value=s.completedToday?1:0;progress.setAttribute('aria-label','오늘의 스테이지 임무 진행률');box.append(progress);
   const count=document.createElement('p');count.textContent='이번 기기에서 확인한 신규 클리어 '+s.total+'회';box.append(count);
   const info=document.createElement('p');info.textContent='현재 기기 플레이 기록 기준 · 서버 보상은 아직 연결되지 않았습니다.';box.append(info);
  }
  function tick(){
   try{const status=tracker.poll();if(status.initialised)draw(status);}
   catch(e){if(!box)return;const msg=box.querySelector('p');if(msg)msg.textContent='진행 기록 확인이 필요합니다. 기존 저장 데이터는 삭제되지 않았습니다.';}
  }
  tick();const timer=w.setInterval(tick,1500);
  w.addEventListener('pageshow',tick);
  w.document.getElementById('memoryBtn')?.addEventListener('click',tick);
  w.__EVOLVE_M08_STAGE_MISSION_V622_ACTIVE__=Object.freeze({read:()=>tracker.snapshot(),refresh:tick,stop:()=>w.clearInterval(timer),mode:'LOCAL_PLAY_EVENT_NO_SERVER_REWARDS'});
  return true;
 }
 return Object.freeze({createTracker,mount,isoDay,storageKey:KEY,mode:'LOCAL_STAGE_EVENT_BRIDGE'});
});
