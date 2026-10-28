/* EVOLVE M08 40% — CHALLENGE research rewards; local preview wallet only.
 * Stage/new codex/battle-result evidence is local, spoofable and never an
 * operational purchase or server-validated result. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&root.window===root){root.__EVOLVE_M08_MISSION_REWARDS_V624__=api;api.mount(root);}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const rows=Object.freeze([['stage','신규 스테이지 연구'],['run','전투 종료 연구'],['codex','도감 발견 연구']]);
 function createController({store}={}){
  if(!store||typeof store.missionStatus!=='function'||typeof store.claimMission!=='function'||typeof store.snapshot!=='function')throw Error('MISSION_REWARD_SETUP');
  return Object.freeze({status:()=>store.missionStatus(),balance:()=>store.snapshot().crystals,claim:id=>store.claimMission(id)});
 }
 function mount(w){
  const engine=w.__EVOLVE_SHOP_EXPERIENCE_V621__,doc=w.document;
  if(!engine||!doc||!w.localStorage||!engine.missionRewards)return false;
  let controller;try{controller=createController({store:engine.createStore({storage:w.localStorage})});controller.status();}
  catch(_){return false}
  const id='m08MissionRewardsV624',styleId='m08MissionRewardsStyleV624';
  const css='#homeChallengeViewV601 .m08MissionRewardsV624{margin:14px 0;padding:14px;background:linear-gradient(155deg,#392a30,#1b2028);border:1px solid #b18d61;border-radius:12px;color:#ffe6c9;font-family:system-ui}'+
   '#homeChallengeViewV601 .m08MissionRewardsV624 h3{margin:0 0 8px;font-size:17px}'+
   '#homeChallengeViewV601 .m08MissionRewardsV624 p{font-size:12px;line-height:1.5;color:#e0c4b6;margin:8px 0}'+
   '#homeChallengeViewV601 .m08RewardRowV624{padding:10px 0;border-top:1px solid #69545a;display:flex;align-items:center;justify-content:space-between;gap:10px}'+
   '#homeChallengeViewV601 .m08RewardRowV624 strong{font-size:12px;line-height:1.5}'+
   '#homeChallengeViewV601 .m08RewardRowV624 button{min-height:44px;min-width:108px;border-radius:9px;border:1px solid #dfaf76;background:#75473d;color:#fff2dc;font-weight:900;font-size:12px;padding:8px;touch-action:manipulation}'+
   '#homeChallengeViewV601 .m08RewardRowV624 button:disabled{opacity:.55;background:#3a343a}';
  let card=null,stamp='',error='',locked=false;
  function draw(){
   const host=doc.getElementById('homeChallengeViewV601');if(!host)return;
   if(!card){card=doc.createElement('section');card.id=id;card.className='m08MissionRewardsV624';card.setAttribute('aria-label','일일 전투 및 발견 연구 보상');host.append(card);
    if(!doc.getElementById(styleId)){const style=doc.createElement('style');style.id=styleId;style.textContent=css;doc.head.append(style);}}
   let states,balance;
   try{states=controller.status();balance=controller.balance()}catch(_){card.textContent='연구 보상 기록을 읽을 수 없습니다. 기존 저장 데이터는 보존됩니다.';stamp='';return}
   const sig=JSON.stringify(states)+'|'+balance+'|'+error+'|'+locked;
   if(sig===stamp)return;stamp=sig;card.replaceChildren();
   const heading=doc.createElement('h3');heading.textContent='일일 연구 보상';card.append(heading);
   const intro=doc.createElement('p');intro.textContent='연구를 완료하면 변이 결정을 받을 수 있습니다. 보상은 현재 브라우저의 체험 지갑에만 저장됩니다.';card.append(intro);
   const wallet=doc.createElement('p');wallet.className='m08RewardWalletV624';wallet.textContent='보유 결정 ◆ '+balance.toLocaleString('ko-KR');card.append(wallet);
   for(const [mission,title] of rows){
    const s=states[mission],row=doc.createElement('div');row.className='m08RewardRowV624';card.append(row);
    const label=doc.createElement('strong');label.textContent=title+' · ◆ '+s.crystals;row.append(label);
    const button=doc.createElement('button');button.type='button';button.dataset.m08Claim=mission;
    button.textContent=s.claimed?'수령 완료':s.blocked?'기록 확인 필요':s.ready?'보상 받기':'진행 대기';
    button.disabled=s.claimed||s.blocked||!s.ready||locked;
    button.addEventListener('click',()=>{
     if(locked)return;locked=true;
     try{controller.claim(mission);error='결정 '+s.crystals+'개를 받았습니다.';}
     catch(e){error=e?.message||'보상을 수령할 수 없습니다.';}
     finally{locked=false;stamp='';draw();}
    });
    row.append(button);
   }
   const note=doc.createElement('p');note.textContent=error||'하루에 각 연구 1회 · 한국시간 기준 · 실제 결제 및 서버 검증 없음';note.setAttribute('role','status');card.append(note);
  }
  // M08 50%: no 1.8s idle polling. Return to CHALLENGE, focus or storage update refreshes the card.
  const memory=doc.getElementById('memoryBtn');
  const onVisibility=()=>{if(doc.visibilityState==='visible')draw();};
  const sourceKeys=new Set([engine.storageKey,'EVOLVE_M08_STAGE_MISSION_V622_V1','EVOLVE_M08_RUNTIME_MISSIONS_V623_V1']);
  const onStorage=event=>{if(event.key===null||sourceKeys.has(event.key))draw();};
  draw();memory?.addEventListener('click',draw);w.addEventListener('pageshow',draw);
  w.addEventListener('focus',draw);doc.addEventListener('visibilitychange',onVisibility);
  w.addEventListener('storage',onStorage);
  function stop(){memory?.removeEventListener('click',draw);w.removeEventListener('pageshow',draw);
   w.removeEventListener('focus',draw);doc.removeEventListener('visibilitychange',onVisibility);w.removeEventListener('storage',onStorage);}
  w.__EVOLVE_M08_MISSION_REWARDS_V624_ACTIVE__=Object.freeze({read:()=>controller.status(),claim:mission=>{const r=controller.claim(mission);stamp='';draw();return r;},refresh:draw,stop,refreshMode:'EVENT_DRIVEN',mode:'LOCAL_CRYSTALS_NO_BILLING'});
  return true;
 }
 return Object.freeze({createController,mount,mode:'LOCAL_CRYSTALS_NO_BILLING'});
});
