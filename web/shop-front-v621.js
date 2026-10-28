/* EVOLVE V621 native SHOP skin — integrates only with the existing HOME SHOP.
 * Browser-local preview grants; payment provider/receipt/merchant absent.
 * No combat mutation; previously approved original cosmetics renderer is reused.
 */
(()=>{
 'use strict';
 const engine=window.__EVOLVE_SHOP_EXPERIENCE_V621__;
 if(!engine||engine.mode!=='LOCAL_PREVIEW_NO_BILLING')return;
 const host=location.hostname;if(!['idonutyou.github.io','localhost','127.0.0.1'].includes(host))return;
 const oldApi=window.__EVOLVE_DEV_MOCK_STORE_V615__;
 const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el};
 const theme={starter:['✦','starter'],crystal100:['◇','crystal'],crystal300:['✧','crystal'],resonance:['◈','cosmetic'],crimson:['✹','cosmetic'],researchpass:['☷','pass']};
 const categories=['추천','재화','외형','시즌','패키지'];
 const PROFILE='dev_local_profile_01';
 let store=null,legacy=null,root=null,content=null,challengeRoot=null,busy=false,pending=null,category='추천',message='';
 const style=`
 #homeShopViewV601 #nativeShopV620,#homeShopViewV601 #homeShopHintV601{display:none!important}
 #homeShopViewV601 .evolveStoreV621{--glow:#f6b572;font-family:system-ui,-apple-system,sans-serif;max-width:490px;margin:0 auto;color:#f8ebe0;padding:8px 0 24px}
 #homeShopViewV601 .evolveStoreV621 *{box-sizing:border-box}
 #homeShopViewV601 .eStoreHeroV621{position:relative;overflow:hidden;background:radial-gradient(ellipse 220px 170px at 87% 10%,#9c533f76,transparent),linear-gradient(125deg,#342128,#171921 65%,#262027);border:1px solid #a57862;border-radius:16px;padding:18px 17px 16px;margin:6px 0 12px;box-shadow:0 10px 24px #0007,inset 0 1px #ffd3ab23}
 #homeShopViewV601 .eStoreHeroV621::after{content:"◇";position:absolute;right:-12px;top:-46px;font-size:169px;color:#fcb68b25;pointer-events:none;transform:rotate(18deg)}
 #homeShopViewV601 .eStoreEyebrowV621{font-size:10px;font-weight:900;letter-spacing:.19em;color:#ffe1b4}
 #homeShopViewV601 .eStoreHeroV621 h2{margin:8px 0;font-size:23px;line-height:1.2;font-weight:950;color:#fff1de}
 #homeShopViewV601 .eStoreHeroV621 p{position:relative;z-index:1;color:#e4c2b8;font-size:12px;line-height:1.55;margin:4px 0 12px}
 #homeShopViewV601 .eStoreHeroV621 .eStoreHeroButtonV621{background:linear-gradient(#ffd8a7,#e99470);border:1px solid #ffe0ad;color:#2d1c24;box-shadow:0 3px 0 #915c4b;font-weight:950;border-radius:10px;min-height:44px;padding:10px 19px}
 #homeShopViewV601 .eStoreWalletV621{display:flex;align-items:center;gap:9px;padding:11px 13px;border:1px solid #65515a;border-radius:12px;background:linear-gradient(115deg,#25252f,#191c24);margin:0 0 10px}
 #homeShopViewV601 .eStoreWalletV621 span{font-size:12px;color:#d9bcb2}.evolveStoreV621 .eStoreWalletV621 strong{margin-left:auto;color:#fff0c6;font-size:16px;letter-spacing:.02em}
 #homeShopViewV601 .eStoreTabsV621{display:flex;overflow-x:auto;gap:5px;padding:4px 1px 10px;scrollbar-width:none}
 #homeShopViewV601 .eStoreTabsV621::-webkit-scrollbar{display:none}
 #homeShopViewV601 .eStoreTabsV621 button{flex:0 0 auto;min-width:62px;min-height:44px;border:1px solid #634c51;border-radius:10px;background:#201e25;color:#dcc5be;font-weight:800;padding:7px 12px;font-size:12px}
 #homeShopViewV601 .eStoreTabsV621 button[aria-selected="true"]{background:#583634;border-color:#e9a278;color:#fff2dc;box-shadow:inset 0 1px #ffcfb84a}
 #homeShopViewV601 .eStoreHeadingV621{display:flex;justify-content:space-between;align-items:center;gap:9px;margin:8px 0}
 #homeShopViewV601 .eStoreHeadingV621 h3{font-size:15px;font-weight:900;margin:0;color:#ffe3c7}
 #homeShopViewV601 .eStoreHeadingV621 span{font-size:10px;color:#ceb9b0}
 #homeShopViewV601 .eStoreGridV621{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
 #homeShopViewV601 .eStoreCardV621{border:1px solid #5f454a;border-radius:13px;padding:11px;background:linear-gradient(#27212b,#1a1b24);min-width:0}
 #homeShopViewV601 .eStoreArtV621{height:74px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:43px;color:#ffe2c7;text-shadow:0 0 25px #ffae71aa;background:radial-gradient(circle,#8d494a66,#331d2a 50%,#171b23)}
 #homeShopViewV601 .eStoreArtV621[data-art="crystal"]{background:radial-gradient(circle,#c58d4d88,#442c33 45%,#151923)}
 #homeShopViewV601 .eStoreArtV621[data-art="cosmetic"]{background:radial-gradient(circle,#a44b5777,#492733 44%,#1a1820)}
 #homeShopViewV601 .eStoreArtV621[data-art="pass"]{background:radial-gradient(circle,#8e527566,#462337 46%,#1a1924)}
 #homeShopViewV601 .eStoreBadgeV621{display:inline-block;font-size:10px;font-weight:900;border:1px solid #aa765f;border-radius:6px;padding:2px 6px;margin:9px 0 6px;color:#ffd5b1}
 #homeShopViewV601 .eStoreCardV621 h4{font-size:13px;color:#fff0df;line-height:1.35;margin:0 0 6px;overflow-wrap:anywhere}
 #homeShopViewV601 .eStoreCardV621 p{font-size:11px;color:#cbb7b0;line-height:1.45;min-height:32px;margin:0 0 8px}
 #homeShopViewV601 .eStoreCardV621 button,#homeShopViewV601 .eStoreDailyV621 button,#homeShopViewV601 .eStoreConfirmV621 button{min-height:44px;border:1px solid #c18570;border-radius:10px;background:linear-gradient(#a56150,#713c3e);color:#fff7e6;padding:7px 10px;font-size:12px;font-weight:900;touch-action:manipulation}
 #homeShopViewV601 .eStoreCardV621 button{width:100%}
 #homeShopViewV601 .eStoreCardV621 button:disabled,#homeShopViewV601 .eStoreDailyV621 button:disabled{opacity:.52;background:#29282d;color:#c8b9b1;border-color:#51474c}
 #homeShopViewV601 .eStoreDailyV621{padding:12px;border:1px solid #68525c;border-radius:12px;background:#211d28;margin:10px 0}
 #homeShopViewV601 .eStoreDailyV621 strong{font-size:14px;color:#ffe0b7}
 #homeShopViewV601 .eStoreDailyV621 p{color:#c4b7b2;font-size:12px;line-height:1.4}
 #homeShopViewV601 .eStorePassProgressV621{display:flex;gap:6px;margin:10px 0}
 #homeShopViewV601 .eStorePassProgressV621 span{flex:1;text-align:center;border:1px solid #776063;border-radius:7px;padding:6px 0;font-size:12px;color:#d5c2be}
 #homeShopViewV601 .eStorePassProgressV621 span[data-done="true"]{background:#6c423b;color:#ffdab6}
 #homeChallengeViewV601 .eStoreResearchV621{margin:14px 0 24px;padding:13px 12px;border:1px solid #9b6d59;border-radius:12px;background:linear-gradient(155deg,#31242a,#151b26);color:#f5e0ce;font-family:system-ui}
 #homeChallengeViewV601 .eStoreResearchV621 *{box-sizing:border-box}
 #homeChallengeViewV601 .eStoreResearchV621 h3{font-size:16px;margin:0 0 9px;color:#ffe3be}
 #homeChallengeViewV601 .eStoreResearchV621 p{font-size:12px;line-height:1.5;color:#e1c5b6}
 #homeChallengeViewV601 .eStoreResearchV621 .eStoreMissionRowV621{padding:11px 0;border-top:1px solid #61494e}
 #homeChallengeViewV601 .eStoreResearchV621 strong{display:block;font-size:13px;color:#ffdfc3;margin-bottom:7px}
 #homeChallengeViewV601 .eStoreResearchV621 button{min-height:44px;padding:9px 12px;border-radius:9px;border:1px solid #be8263;background:#67413b;color:#fff0e4;font-weight:900;touch-action:manipulation}
 #homeChallengeViewV601 .eStoreResearchV621 button:disabled{background:#29232a;opacity:.62;color:#d5bec1}
 #homeChallengeViewV601 .eStoreResearchV621 button:focus-visible{outline:3px solid #ffd1a2;outline-offset:2px}
 #homeChallengeViewV601 .eStoreResearchV621 small{display:block;font-size:11px;color:#ccb2ad;line-height:1.5;margin:6px 0}
 #homeShopViewV601 .eStoreCollectionV621{margin:14px 0;border:1px solid #6a5055;border-radius:12px;padding:13px;background:linear-gradient(130deg,#27212b,#161923)}
 #homeShopViewV601 .eStoreCollectionV621 h3{font-size:15px;color:#ffe0b7;margin:0 0 6px}
 #homeShopViewV601 .eStoreCoreRowV621{display:flex;align-items:center;gap:9px;padding:11px 0;border-top:1px solid #574148}
 #homeShopViewV601 .eStoreCoreRowV621 .eStoreCoreThumbV621{flex:0 0 44px;width:44px;height:44px;display:grid;place-items:center;border:1px solid #9c6868;border-radius:10px;background:radial-gradient(circle,#8b3845,#281923);font-size:24px;color:#ffe7d1}
 #homeShopViewV601 .eStoreCoreRowV621 .eStoreCoreTextV621{flex:1;min-width:0;font-size:12px;color:#f8dcc5}
 #homeShopViewV601 .eStoreCoreRowV621 .eStoreCoreTextV621 small{display:block;color:#c3a9ab;font-size:11px;margin-top:4px}
 #homeShopViewV601 .eStoreCoreRowV621 button{min-height:44px;min-width:74px;padding:6px 10px;border:1px solid #b87e62;border-radius:9px;background:#5e3c3d;color:#fff0dc;font-weight:900;font-size:12px;touch-action:manipulation}
 #homeShopViewV601 .eStoreCoreRowV621 button:disabled{opacity:.5}
 #homeShopViewV601 .eStoreExpiryV621{display:block;font-weight:800;color:#eec5af;margin:9px 0 2px;font-size:12px}
 #homeShopViewV601 .eStoreConfirmV621{border:1px solid #efbb94;border-radius:12px;padding:12px;background:#3b2930;margin:9px 0}
 #homeShopViewV601 .eStoreConfirmV621 strong{font-size:14px;color:#ffe7d0}
 #homeShopViewV601 .eStoreConfirmV621 p{font-size:12px;color:#eccabc}
 #homeShopViewV601 .eStoreConfirmV621 div{display:flex;gap:8px}
 #homeShopViewV601 .eStoreConfirmV621 button{flex:1}
 #homeShopViewV601 .eStoreFineV621{font-size:11px;line-height:1.55;color:#c7b3b1;margin-top:13px}
 #homeShopViewV601 .eStoreMessageV621{font-size:12px;color:#b6eed2;min-height:18px;line-height:1.5;margin:6px 0}
 #homeShopViewV601 .eStoreMessageV621[data-error="true"]{color:#ffafa5}
 #homeShopViewV601 .evolveStoreV621 button:focus-visible{outline:3px solid #ffd7a7;outline-offset:2px}
 @media(max-width:350px){#homeShopViewV601 .eStoreGridV621{gap:6px}#homeShopViewV601 .eStoreCardV621{padding:8px}#homeShopViewV601 .eStoreTabsV621 button{padding:7px 8px}}
 @media(prefers-reduced-motion:reduce){#homeShopViewV601 .evolveStoreV621 *{transition:none!important;animation:none!important}}
 `;
 function add(el,tag,cls,text){const n=make(tag,cls,text);el.append(n);return n}
 function button(el,text,handler,disabled=false,cls=''){const b=add(el,'button',cls,text);b.type='button';b.disabled=disabled||busy;b.addEventListener('click',handler);return b}
 const storeApi=()=>store?.snapshot();
 function fail(e){message=(e&&e.message)||'상점 데이터를 확인할 수 없습니다.';busy=false;pending=null;draw(true);}
 function coreKey(item){return item==='crimson'?'dev_core_theme_02':'dev_core_theme_01'}
 function coreOwned(item,s){
  let owned=!!s.owned[item];
  if(legacy){try{owned=owned||legacy.snapshot(PROFILE).owned[coreKey(item)]===true}catch(_){}}
  return owned;
 }
 function equippedCore(){
  try{return legacy?.snapshot(PROFILE).equipped.core||null}catch(_){return null}
 }
 // Existing V615/V617 adapter remains the only renderer. The source V621 order is
 // persisted first; deterministic bridge receipt allows retry after interrupted sync.
 function bridgeOwnedCore(item){
  if(!legacy)throw Error('CORE_BRIDGE_UNAVAILABLE');
  const entitlement=coreKey(item),current=legacy.snapshot(PROFILE);
  if(current.owned[entitlement])return entitlement;
  const s=store.snapshot();
  if(s.owned[item]!==true)throw Error('CORE_NOT_OWNED');
  const order=Object.entries(s.orders).find(([id,receipt])=>receipt.item===item);
  if(!order)throw Error('CORE_ORDER_MISSING');
  const receiptId='bridge_'+order[0];
  if(item==='crimson'){
   if(current.testCrystals<120)legacy.simulatePurchase('mutation_crystal_mid',PROFILE,receiptId+'_credit');
   legacy.redeemCosmetic(PROFILE,entitlement,receiptId+'_redeem');
  }else legacy.simulatePurchase('appearance_unlock_01',PROFILE,receiptId+'_theme');
  return entitlement;
 }
 function equipCore(item){
  if(!['resonance','crimson'].includes(item))throw Error('CORE_UNKNOWN');
  const s=store.snapshot();if(!coreOwned(item,s))throw Error('CORE_NOT_OWNED');
  const id=bridgeOwnedCore(item),current=equippedCore();
  if(current===id)legacy.unequip(PROFILE,'core');
  else legacy.equip(PROFILE,'core',id);
  window.dispatchEvent(new Event('evolve:dev-mock-change'));
  window.__EVOLVE_DEV_CORE_BRIDGE_V617__?.sync?.();
  message=current===id?'코어 장착 해제':'코어 장착 완료';
  draw();
 }
 function priceDisplay(p){return p.price}
 function begin(id){if(busy||pending||!atShop())return;pending=id;draw();}
 function atShop(){const view=document.getElementById('homeShopViewV601');return !!(view&&!view.classList.contains('hidden')&&window.EVOLVE_WEB_GUARD?.atHome?.())}
 function done(){
  if(!pending||busy||!atShop())return;
  busy=true;const id=pending;pending=null;
  try{
   const receiptId='shop621_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,14);
   const result=store.order(id,receiptId);
   if(id==='resonance'||id==='crimson'){
    try{
     const entitlement=bridgeOwnedCore(id);
     legacy.equip(PROFILE,'core',entitlement);
     window.dispatchEvent(new Event('evolve:dev-mock-change'));
     window.__EVOLVE_DEV_CORE_BRIDGE_V617__?.sync?.();
    }catch(_){message='보유권은 저장되었어. 코어 컬렉션의 장착 버튼을 눌러 외형을 연결해 주세요.';busy=false;draw(true);return;}
   }
   message=result.receipt.firstBonus?'구매 완료 · 첫 구매 보너스 결정 50개 지급':id==='crimson'?'심홍 코어 획득 · 결정 120개 사용':'구매 완료 · 상품 지급';
  }catch(e){fail(e);return}
  busy=false;draw();
 }
 function drawChallenge(){
  const host=document.getElementById('homeChallengeViewV601');
  if(!host||!store)return;
  if(!challengeRoot){
   challengeRoot=make('section','eStoreResearchV621');challengeRoot.id='evolveResearchV621';
   challengeRoot.setAttribute('aria-label','연구 시즌 진행 및 보상');host.append(challengeRoot);
  }
  let s;
  try{s=store.snapshot()}catch(_){challengeRoot.replaceChildren(make('p','','연구 기록을 읽지 못했습니다. 기존 저장 데이터는 보존됩니다.'));return;}
  const frag=document.createDocumentFragment();
  add(frag,'h3','','연구 시즌');
  add(frag,'p','','현재 월간 연구 패스 · '+s.month+' · 유효 기간 '+s.paidWindow.days+'일 말일 23:59 KST까지');
  add(frag,'small','','무료 출석 보상은 유료 시즌과 독립적으로 제공됩니다. 28일 무료 이벤트는 별도 운영할 수 있습니다.');
  const daily=add(frag,'div','eStoreMissionRowV621');add(daily,'strong','','일일 연구 보급');add(daily,'small','','변이 결정 20개 · 매일 1회');
  button(daily,s.mayClaimDaily?'무료 보상 받기':'오늘 수령 완료',()=>{try{store.claimDaily();message='연구 보급을 받았습니다.';draw()}catch(e){fail(e)}},!s.mayClaimDaily);
  const pass=add(frag,'div','eStoreMissionRowV621');add(pass,'strong','','프리미엄 연구');
  if(!s.passActive){
   add(pass,'small','','월간 패스가 활성화되면 누적 출석일에 따라 보상을 수령할 수 있습니다.');
   button(pass,'월간 패스 보기',()=>{category='시즌';document.getElementById('homeShopTabV601')?.click();draw()});
  }else{
   const progress=Object.keys(s.dailyClaims).filter(day=>day.startsWith(s.month+'-')).length;
   add(pass,'small','','패스 활성화 · 누적 출석 '+progress+'일 · 월말 종료');
   for(let tier=1;tier<=5;tier++){
    const claimKey=s.month+':'+tier,claimed=!!s.rewardClaims[claimKey],ready=progress>=tier;
    const row=add(pass,'div','eStoreMissionRowV621');
    add(row,'strong','','연구 단계 '+tier+' / 5');
    button(row,claimed?'수령 완료':ready?'결정 35개 수령':'출석 '+progress+'/'+tier,
     ()=>{try{store.claimPremium(tier);message='프리미엄 연구 보상을 받았습니다.';draw()}catch(e){fail(e)}},claimed||!ready);
   }
  }
  add(frag,'p','','결제 연결 전 체험 중 · 실제 금액 청구 없음 · 보상/재화는 현재 브라우저에만 보관됩니다.');
  challengeRoot.replaceChildren(frag);
 }
 function draw(err=false){
  if(!root||!content)return;
  let s;try{s=store.snapshot()}catch(e){content.replaceChildren(make('p','eStoreMessageV621','상점 기록을 읽을 수 없어 변경을 중단했습니다. 기록은 삭제되지 않습니다.'));return}
  const frag=document.createDocumentFragment();
  const hero=add(frag,'section','eStoreHeroV621');
  add(hero,'div','eStoreEyebrowV621','EVOLVE · GENOME MARKET');
  add(hero,'h2','','진화의 가치를 깨우다');
  add(hero,'p','','연구 패스, 코어 외형, 변이 결정과 특별 패키지를 확인하세요.');
  button(hero,s.passActive?'월간 패스 보유 중':'월간 패스 보기',()=>{category='시즌';draw()},false,'eStoreHeroButtonV621');
  const wallet=add(frag,'div','eStoreWalletV621');
  add(wallet,'span','','◆ 변이 결정');add(wallet,'strong','',(s.crystals||0).toLocaleString('ko-KR'));
  const disclosure=add(frag,'p','eStoreFineV621','결제 연결 전 체험 중 · 금액 청구 없음 · 표시 가격은 확정되지 않았습니다.');
  disclosure.style.margin='0 0 11px';
  const nav=add(frag,'div','eStoreTabsV621');nav.setAttribute('role','tablist');nav.setAttribute('aria-label','상점 카테고리');
  for(const name of categories){const b=button(nav,name,()=>{category=name;pending=null;draw();});b.setAttribute('role','tab');b.setAttribute('aria-selected',String(category===name));}
  const status=add(frag,'p','eStoreMessageV621',message||'');status.dataset.error=String(err);status.setAttribute('role','status');
  if(pending){
   const p=engine.products.find(x=>x.id===pending);
   const c=add(frag,'section','eStoreConfirmV621');
   add(c,'strong','',p.title+' · '+priceDisplay(p));
   let detail=pending==='crimson'?'변이 결정 120개를 사용하여 심홍 코어를 영구 획득합니다. 실제 금액은 청구되지 않습니다.':'구매를 확인하면 상품이 즉시 지급됩니다. 실제 금액은 청구되지 않습니다.';
   if(pending==='researchpass'){
    const ms=Math.max(0,Date.parse(s.paidWindow.endExclusiveUtc)-Date.now());
    const hours=Math.floor(ms/3600000),minutes=Math.ceil(ms/60000);
    const remaining=hours>=24?Math.floor(hours/24)+'일 '+hours%24+'시간':hours>=1?hours+'시간':Math.max(0,minutes)+'분';
    detail+=' 이 패스는 '+s.month+'월의 마지막 날 23:59(KST)까지만 유효합니다. 현재 남은 기간 약 '+remaining+'이며, 다음 달 자동 갱신되지 않습니다.';
    if(ms<86400000)detail+=' 주의: 이번 달 종료까지 24시간 미만 남았습니다.';
   }
   add(c,'p','',detail);
   const row=add(c,'div');button(row,'취소',()=>{pending=null;draw()});button(row,'구매 확정',done);
  }
  if(category==='추천'||category==='시즌'){
   const box=add(frag,'section','eStoreDailyV621');
   add(box,'strong','','오늘의 연구 보급');
   add(box,'p','','매일 변이 결정 20개 수령 · 무료');
   button(box,s.mayClaimDaily?'보상 받기':'오늘 수령 완료',()=>{try{store.claimDaily();message='오늘의 보상 지급 완료';draw()}catch(e){fail(e)}},!s.mayClaimDaily||!!pending);
   if(s.passActive){
    add(box,'p','','월간 패스 활성화 · '+s.paidWindow.month+' · 매월 1일~말일');
    add(box,'span','eStoreExpiryV621',s.month+' '+s.paidWindow.days+'일 23:59 KST 종료 · 다음 달 갱신 없음');
    const bar=add(box,'div','eStorePassProgressV621');
    for(let tier=1;tier<=5;tier++){const key=s.month+':'+tier;const b=add(bar,'span','',String(tier));b.dataset.done=String(!!s.rewardClaims[key])}
    const days=Object.keys(s.dailyClaims).filter(x=>x.startsWith(s.month+'-')).length;
    for(let tier=1;tier<=5;tier++){
     const key=s.month+':'+tier,claimed=!!s.rewardClaims[key],eligible=days>=tier;
     button(box,'연구 단계 '+tier+' · '+(claimed?'수령 완료':eligible?'결정 35개 받기':'진행 '+days+'/'+tier),
      ()=>{try{store.claimPremium(tier);message='시즌 보상 지급 완료';draw()}catch(e){fail(e)}},claimed||!eligible||!!pending);
    }
   }else add(box,'p','eStoreFineV621','프리미엄 연구 보상은 월간 패스 보유 시 열립니다.');
  }
  const heading=add(frag,'div','eStoreHeadingV621');add(heading,'h3','',category==='추천'?'추천 상품':category+' 상점');add(heading,'span','','SHOP · '+category);
  const grid=add(frag,'div','eStoreGridV621');
  const visible=category==='추천'?engine.products:category==='패키지'?engine.products.filter(p=>p.kind==='starter'):engine.products.filter(p=>p.category===category);
  for(const p of visible){
   const own=p.kind==='monthly'?s.passActive:['resonance','crimson'].includes(p.id)?coreOwned(p.id,s):p.once&&s.owned[p.id]===true;
   const card=add(grid,'article','eStoreCardV621');
   const art=add(card,'div','eStoreArtV621',theme[p.id][0]);art.dataset.art=theme[p.id][1];art.setAttribute('aria-hidden','true');
   add(card,'span','eStoreBadgeV621',p.badge);
   add(card,'h4','',p.title);
   add(card,'p','',p.kind==='monthly'?'매월 1일~말일 유효 · 특별 보상 트랙':p.kind==='cosmetic'?'공명 코어 외형 영구 소장 · 능력치 변화 없음':p.kind==='redeem'?'변이 결정 120개로 영구 소장 · 능력치 변화 없음':p.kind==='starter'?'변이 결정 75개 · 최초 1회':'변이 결정 '+p.crystals+'개');
   button(card,own?'보유 중':p.price+' · '+(p.kind==='redeem'?'교환':'구매'),()=>begin(p.id),!!own||!!pending||(p.kind==='redeem'&&s.crystals<p.spendCrystals));
  }
  if(category==='추천'||category==='외형'){
   const collection=add(frag,'section','eStoreCollectionV621');
   add(collection,'h3','','코어 컬렉션');
   add(collection,'p','eStoreFineV621','영구 소장한 외형을 캐릭터에 장착하거나 해제할 수 있습니다.');
   const equipped=equippedCore();
   for(const [id,title,icon] of [['resonance','공명 코어','◈'],['crimson','심홍 코어','✹']]){
    const owned=coreOwned(id,s),selected=equipped===coreKey(id);
    const row=add(collection,'div','eStoreCoreRowV621');
    add(row,'span','eStoreCoreThumbV621',icon).setAttribute('aria-hidden','true');
    const text=add(row,'div','eStoreCoreTextV621',title);
    add(text,'small','',selected?'장착 중':owned?'영구 보유':'미보유 · 상품에서 획득 가능');
    const action=button(row,selected?'해제':owned?'장착':'미보유',()=>{try{equipCore(id)}catch(e){fail(e)}},!owned||!!pending);
    action.dataset.core=id;action.setAttribute('aria-pressed',String(selected));
   }
  }
  add(frag,'p','eStoreFineV621','상품 획득과 연구 보상은 현재 브라우저에 저장됩니다. 실제 결제, 영수증, 서버 권리 지급은 연결되지 않았으며 별도 계정으로 이전되지 않습니다.');
  content.replaceChildren(frag);
  drawChallenge();
 }
 function mount(){
  const view=document.getElementById('homeShopViewV601');
  if(!view||root||!document.getElementById('nativeShopV620'))return !!root;
  try{store=engine.createStore({storage:window.localStorage});store.snapshot();if(oldApi)legacy=oldApi.createStore({enabled:true,storage:window.localStorage});legacy?.snapshot(PROFILE);}
  catch(e){return false}
  const css=make('style');css.id='shopExperienceStyleV621';css.textContent=style;document.head.append(css);
  root=make('section','evolveStoreV621');root.id='evolveShopV621';root.setAttribute('aria-label','변이 상점');
  content=make('div');root.append(content);view.append(root);
  draw();
  const challengeTab=document.getElementById('memoryBtn');
  challengeTab?.addEventListener('click',()=>drawChallenge());
  const tab=document.getElementById('homeShopTabV601');tab?.addEventListener('click',()=>{pending=null;draw()});
  const observer=new MutationObserver(()=>{if(atShop()){pending=null;draw()}});
  observer.observe(view,{attributes:true,attributeFilter:['class']});
  window.addEventListener('pageshow',()=>{pending=null;draw()});
  window.addEventListener('storage',event=>{if(event.key===engine.storageKey||event.key===null)draw()});
  window.__EVOLVE_SHOP_V621__=Object.freeze({read:()=>store.snapshot(),open:()=>tab?.click(),mode:'NO_BILLING_PREVIEW'});
  return true;
 }
 if(!mount()){let tries=0;const t=setInterval(()=>{if(mount()||++tries>110)clearInterval(t)},150)}
})();
