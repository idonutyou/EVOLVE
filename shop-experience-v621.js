/* EVOLVE V621 — offline shop experience. NO real money, merchant or server.
 * Local entitlements are for preview and cannot become production purchases.
 * Local browser persistence is separate from the game save and V620 core store.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&root.window===root)root.__EVOLVE_SHOP_EXPERIENCE_V621__=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const STORAGE_KEY='EVOLVE_SHOP_EXPERIENCE_V621_V1',SCHEMA='evolve.shop.experience.v621.v1';
 const PRODUCTS=Object.freeze([
  Object.freeze({id:'starter',title:'첫 진화 패키지',category:'추천',price:'₩1,200',kind:'starter',crystals:160,once:true,badge:'첫 구매 · 배지 포함'}),
  Object.freeze({id:'crystal100',title:'변이 결정 ×100',category:'재화',price:'₩1,200',kind:'crystal',crystals:100,once:false,badge:'기본'}),
  Object.freeze({id:'crystal300',title:'변이 결정 ×300',category:'재화',price:'₩3,300',kind:'crystal',crystals:300,once:false,badge:'인기'}),
  Object.freeze({id:'resonance',title:'공명 코어',category:'외형',price:'₩4,900',kind:'cosmetic',crystals:0,once:true,badge:'영구 외형'}),
  Object.freeze({id:'crimson',title:'심홍 코어',category:'외형',price:'◆ 120',kind:'redeem',crystals:0,spendCrystals:120,once:true,badge:'결정 교환'}),
  Object.freeze({id:'researchpass',title:'월간 연구 패스',category:'시즌',price:'₩5,900',kind:'monthly',crystals:0,once:false,badge:'월간 전용'})
 ]);
 const byId=Object.fromEntries(PRODUCTS.map(p=>[p.id,p]));
 // M09 40%: non-combat permanent HOME nameplate; not a billing SKU.
 const UI_COSMETICS=Object.freeze({lab_nameplate:Object.freeze({id:'lab_nameplate',title:'연구실 명패 · 변이 기록자',slot:'home_nameplate',crystals:180})});
 const fresh=()=>({schema:SCHEMA,revision:0,crystals:0,firstPurchase:false,owned:{},orders:{},passMonths:{},dailyClaims:{},rewardClaims:{},missionClaims:{}});
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 const copy=x=>JSON.parse(JSON.stringify(x));
 function kstDay(timestamp){
  if(!Number.isFinite(timestamp))throw Error('INVALID_TIME');
  return new Date(timestamp+9*3600000).toISOString().slice(0,10);
 }
 const kstMonth=ts=>kstDay(ts).slice(0,7);
 function paidMonthWindow(month){
  if(!/^20\d\d-(0[1-9]|1[0-2])$/.test(month))throw Error('INVALID_MONTH');
  const y=Number(month.slice(0,4)),m=Number(month.slice(5));
  return Object.freeze({month,startUtc:new Date(Date.UTC(y,m-1,1)-32400000).toISOString(),endExclusiveUtc:new Date(Date.UTC(y,m,1)-32400000).toISOString(),days:new Date(Date.UTC(y,m,0)).getUTCDate()});
 }
 function requireObject(x){return !!x&&typeof x==='object'&&!Array.isArray(x)}
 function validate(x){
  if(!requireObject(x)||x.schema!==SCHEMA||!Number.isSafeInteger(x.revision)||x.revision<0||!Number.isSafeInteger(x.crystals)||x.crystals<0||x.crystals>100000000||typeof x.firstPurchase!=='boolean')throw Error('STORE_DATA_INVALID');
  for(const k of ['owned','orders','passMonths','dailyClaims','rewardClaims'])if(!requireObject(x[k])||Object.keys(x[k]).length>2500)throw Error('STORE_DATA_INVALID');
  if(x.missionClaims!==undefined){
   if(!requireObject(x.missionClaims)||Object.keys(x.missionClaims).length>2500)throw Error('STORE_DATA_INVALID');
   for(const [key,val] of Object.entries(x.missionClaims))
    if(!/^20\d\d-(0[1-9]|1[0-2])-([0-2]\d|3[01]):(?:stage|run|codex)$/.test(key)||val!==true)throw Error('STORE_DATA_INVALID');
  }
  for(const k of Object.keys(x.owned))if(!own(byId,k)||x.owned[k]!==true)throw Error('STORE_DATA_INVALID');
  for(const [id,o] of Object.entries(x.orders))if(!/^[A-Za-z0-9_-]{12,72}$/.test(id)||!requireObject(o)||!own(byId,o.item)||typeof o.month!=='string')throw Error('STORE_DATA_INVALID');
  for(const [k,v] of Object.entries(x.passMonths))if(!/^20\d\d-(0[1-9]|1[0-2])$/.test(k)||v!==true)throw Error('STORE_DATA_INVALID');
  for(const [k,v] of Object.entries(x.dailyClaims))if(!/^20\d\d-\d\d-\d\d$/.test(k)||v!==true)throw Error('STORE_DATA_INVALID');
  for(const [k,v] of Object.entries(x.rewardClaims))if(!/^20\d\d-(0[1-9]|1[0-2]):[1-5]$/.test(k)||v!==true)throw Error('STORE_DATA_INVALID');
  // Optional for V621 saves created before M09. A corrupt extension must fail closed.
  if(x.uiCollectibles!==undefined){
   const ui=x.uiCollectibles;
   if(!requireObject(ui)||!requireObject(ui.owned)||!requireObject(ui.equipped))throw Error('STORE_DATA_INVALID');
   for(const [id,val] of Object.entries(ui.owned))if(!own(UI_COSMETICS,id)||val!==true)throw Error('STORE_DATA_INVALID');
   for(const [slot,id] of Object.entries(ui.equipped))if(slot!=='home_nameplate'||id!=='lab_nameplate'||ui.owned[id]!==true)throw Error('STORE_DATA_INVALID');
  }
  if(x.passCompletions!==undefined){
   if(!requireObject(x.passCompletions)||Object.keys(x.passCompletions).length>2500)throw Error('STORE_DATA_INVALID');
   for(const [month,v] of Object.entries(x.passCompletions))
    if(!/^20\d\d-(0[1-9]|1[0-2])$/.test(month)||v!==true||x.passMonths[month]!==true)throw Error('STORE_DATA_INVALID');
  }
  return x;
 }
 const PASS_DAYS=Object.freeze([1,3,7,14,21]);
 const MISSION_REWARDS=Object.freeze({stage:10,run:5,codex:10});
 const STAGE_KEY='EVOLVE_M08_STAGE_MISSION_V622_V1',RUNTIME_KEY='EVOLVE_M08_RUNTIME_MISSIONS_V623_V1';
 function eligibleMission(storage,mission,day){
  const key=mission==='stage'?STAGE_KEY:RUNTIME_KEY;
  let raw;
  try{raw=storage.getItem(key)}catch(_){throw Error('MISSION_SOURCE_UNAVAILABLE')}
  if(raw===null)return false;
  let evidence;try{evidence=JSON.parse(raw)}catch(_){throw Error('MISSION_SOURCE_CORRUPT')}
  if(!requireObject(evidence))throw Error('MISSION_SOURCE_CORRUPT');
  if(mission==='stage'){
   if(evidence.schema!=='evolve.m08.stage.v622.1'||!requireObject(evidence.days))throw Error('MISSION_SOURCE_CORRUPT');
   const value=evidence.days[day];if(value!==undefined&&value!==true)throw Error('MISSION_SOURCE_CORRUPT');
   return value===true;
  }
  if(evidence.schema!=='evolve.m08.runtime.v623.1'||!requireObject(evidence.days))throw Error('MISSION_SOURCE_CORRUPT');
  const record=evidence.days[day];
  if(record===undefined)return false;
  if(!requireObject(record)||!Number.isSafeInteger(record.runEnds)||record.runEnds<0||!Number.isSafeInteger(record.discoveries)||record.discoveries<0)throw Error('MISSION_SOURCE_CORRUPT');
  return (mission==='run'?record.runEnds:record.discoveries)>0;
 }
 function createStore({storage,clock=()=>Date.now()}={}){
  if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function')throw Error('STORAGE_UNAVAILABLE');
  const read=()=>{let data;try{data=storage.getItem(STORAGE_KEY)}catch(_){throw Error('STORAGE_UNAVAILABLE')}if(data===null)return fresh();try{return validate(JSON.parse(data))}catch(_){throw Error('STORE_DATA_INVALID')}};
  const write=(state)=>{validate(state);try{storage.setItem(STORAGE_KEY,JSON.stringify(state))}catch(_){throw Error('STORAGE_WRITE_FAILED')}};
  const now=()=>{const t=clock();if(!Number.isFinite(t)||t<0)throw Error('INVALID_TIME');return t};
  function passStatus(state,ts){
   const month=kstMonth(ts),day=kstDay(ts),window=paidMonthWindow(month);
   const progress=Object.keys(state.dailyClaims).filter(d=>d.startsWith(month+'-')&&state.dailyClaims[d]===true).length;
   const lastDay=window.days,dayOfMonth=Number(day.slice(8));
   const futureDays=lastDay-dayOfMonth+(state.dailyClaims[day]===true?0:1);
   const maxReachable=progress+futureDays;
   return Object.freeze({month,progress,maxReachable,milestones:PASS_DAYS,canBuy:state.passMonths[month]!==true&&maxReachable>=21,passBadgeOwned:Object.values(state.passCompletions||{}).some(v=>v===true),passBadgeClaimable:state.passMonths[month]===true&&progress>=21&&state.passCompletions?.[month]!==true,daysRemaining:lastDay-dayOfMonth+1});
  }
  function snapshot(){const state=read(),ts=now(),month=kstMonth(ts),day=kstDay(ts);return Object.freeze({...copy(state),month,day,passActive:state.passMonths[month]===true,paidWindow:paidMonthWindow(month),pass:passStatus(state,ts),mayClaimDaily:!state.dailyClaims[day],starterBadgeOwned:state.owned.starter===true,noBilling:true,source:'LOCAL_ONLY'});}
  function order(id,requestId){
   if(!own(byId,id)||typeof requestId!=='string'||!/^[A-Za-z0-9_-]{12,72}$/.test(requestId))throw Error('INVALID_ORDER');
   const s=read(),p=byId[id],month=kstMonth(now());
   if(own(s.orders,requestId)){const receipt=s.orders[requestId];if(receipt.item!==id)throw Error('ORDER_ID_CONFLICT');return Object.freeze({replayed:true,state:snapshot(),receipt:copy(receipt)});}
   if(Object.keys(s.orders).length>=1200)throw Error('ORDER_LIMIT');
   if(p.once&&s.owned[id]===true)throw Error('ALREADY_OWNED');
   if(id==='researchpass'&&s.passMonths[month])throw Error('ALREADY_OWNED');
   if(id==='researchpass'&&!passStatus(s,now()).canBuy)throw Error('PASS_COMPLETION_UNREACHABLE');
   const spend=p.kind==='redeem'?p.spendCrystals:0;
   if(spend>0&&s.crystals<spend)throw Error('INSUFFICIENT_CRYSTALS');
   const firstBonus=p.kind==='redeem'?0:!s.firstPurchase?50:0;
   if(s.crystals-spend>100000000-p.crystals-firstBonus)throw Error('BALANCE_LIMIT');
   const next=copy(s);
   next.crystals=next.crystals-spend+p.crystals+firstBonus;
   if(p.kind!=='redeem')next.firstPurchase=true;
   if(p.once)next.owned[id]=true;
   if(id==='researchpass')next.passMonths[month]=true;
   const receipt={item:id,month,charged:false,status:'GRANTED_LOCAL',firstBonus,crystals:p.crystals,spentCrystals:spend};
   next.orders[requestId]=receipt;next.revision++;write(next);
   return Object.freeze({replayed:false,state:snapshot(),receipt:copy(receipt)});
  }
  function claimDaily(){
   const s=read(),day=kstDay(now());if(s.dailyClaims[day])throw Error('ALREADY_CLAIMED');
   if(s.crystals>99999980)throw Error('BALANCE_LIMIT');
   const next=copy(s);next.crystals+=20;next.dailyClaims[day]=true;next.revision++;write(next);return snapshot();
  }
  function claimPremium(tier){
   if(!Number.isInteger(tier)||tier<1||tier>5)throw Error('INVALID_REWARD');
   const s=read(),month=kstMonth(now()),key=month+':'+tier;
   if(!s.passMonths[month])throw Error('PASS_REQUIRED');
   if(s.rewardClaims[key])throw Error('ALREADY_CLAIMED');
   const days=Object.keys(s.dailyClaims).filter(day=>day.startsWith(month+'-')).length;
   if(days<PASS_DAYS[tier-1])throw Error('PROGRESS_REQUIRED');
   const next=copy(s);if(next.crystals>99999960)throw Error('BALANCE_LIMIT');
   next.crystals+=35;next.rewardClaims[key]=true;next.revision++;write(next);return snapshot();
  }
  function claimPassBadge(){
   const s=read(),month=kstMonth(now()),progress=passStatus(s,now());
   if(!s.passMonths[month])throw Error('PASS_REQUIRED');
   if(s.passCompletions?.[month]===true)throw Error('ALREADY_CLAIMED');
   if(progress.progress<21)throw Error('PROGRESS_REQUIRED');
   const next=copy(s);next.passCompletions=next.passCompletions||{};
   next.passCompletions[month]=true;next.revision++;write(next);
   return Object.freeze({badge:'월간 연구자',permanent:true,charged:false,state:snapshot()});
  }
  function missionStatus(){
   const s=read(),day=kstDay(now()),result={};
   for(const mission of Object.keys(MISSION_REWARDS)){
    const key=day+':'+mission,claimed=s.missionClaims?.[key]===true;
    let ready=false,blocked=false;
    if(!claimed)try{ready=eligibleMission(storage,mission,day)}catch(_){blocked=true}
    result[mission]=Object.freeze({day,ready,claimed,blocked,crystals:MISSION_REWARDS[mission]});
   }
   return Object.freeze(result);
  }
  function claimMission(mission){
   if(!own(MISSION_REWARDS,mission))throw Error('MISSION_UNKNOWN');
   const s=read(),day=kstDay(now()),key=day+':'+mission;
   if(s.missionClaims?.[key]===true)throw Error('ALREADY_CLAIMED');
   if(!eligibleMission(storage,mission,day))throw Error('MISSION_NOT_COMPLETE');
   const value=MISSION_REWARDS[mission];
   if(s.crystals>100000000-value)throw Error('BALANCE_LIMIT');
   if(Object.keys(s.missionClaims||{}).length>=2500)throw Error('MISSION_CLAIMS_LIMIT');
   const next=copy(s);
   next.missionClaims=next.missionClaims||{};
   next.missionClaims[key]=true;
   next.crystals+=value;next.revision++;write(next);
   return Object.freeze({mission,day,crystals:value,charged:false,source:'LOCAL_PREVIEW_ONLY',state:snapshot()});
  }
  function redeemUiCosmetic(id){
   if(!own(UI_COSMETICS,id))throw Error('COLLECTIBLE_UNKNOWN');
   const s=read(),item=UI_COSMETICS[id],ui=s.uiCollectibles||{owned:{},equipped:{}};
   if(ui.owned[id]===true)throw Error('ALREADY_OWNED');
   if(s.crystals<item.crystals)throw Error('INSUFFICIENT_CRYSTALS');
   const next=copy(s);
   if(!next.uiCollectibles)next.uiCollectibles={owned:{},equipped:{}};
   next.crystals-=item.crystals;
   next.uiCollectibles.owned[id]=true;
   next.revision++;
   write(next); // Single V621 wallet write: never deduct without granting ownership.
   return Object.freeze({item:id,spentCrystals:item.crystals,charged:false,state:snapshot()});
  }
  function equipUiCosmetic(id){
   if(!own(UI_COSMETICS,id))throw Error('COLLECTIBLE_UNKNOWN');
   const s=read(),ui=s.uiCollectibles;
   if(ui?.owned?.[id]!==true)throw Error('COLLECTIBLE_NOT_OWNED');
   const next=copy(s),slot=UI_COSMETICS[id].slot;
   const selected=next.uiCollectibles.equipped[slot]===id;
   if(selected)delete next.uiCollectibles.equipped[slot];
   else next.uiCollectibles.equipped[slot]=id;
   next.revision++;write(next);
   return Object.freeze({item:id,equipped:!selected,charged:false,state:snapshot()});
  }
  return Object.freeze({snapshot,order,claimDaily,claimPremium,claimPassBadge,missionStatus,claimMission,redeemUiCosmetic,equipUiCosmetic});
 }
 return Object.freeze({createStore,kstDay,kstMonth,paidMonthWindow,products:PRODUCTS,uiCosmetics:UI_COSMETICS,passDays:PASS_DAYS,missionRewards:MISSION_REWARDS,storageKey:STORAGE_KEY,mode:'LOCAL_PREVIEW_NO_BILLING'});
});
