/* EVOLVE M04-70 | Optional home overlay for DEVELOPMENT MOCK store only.
 * Never reads/writes real premium currency, DNA, M03 wallets, or existing game state.
 * Explicit opt-in: ?evolveMockShop=1 on the EVOLVE development host.
 */
(()=>{
 'use strict';
 const params=new URLSearchParams(location.search);
 if(params.get('evolveMockShop')!=='1'||!['idonutyou.github.io','localhost','127.0.0.1'].includes(location.hostname))return;
 const API=window.__EVOLVE_DEV_MOCK_STORE_V615__;
 if(!API||API.mode!=='MOCK_ONLY')return;
 const PROFILE='dev_local_profile_01';
 let shop,opening=false,disabled=false,lastError='',pending=null,processing=false;
 try{shop=API.createStore({enabled:true,storage:window.localStorage})}catch(e){disabled=true;lastError=e.code||'MOCK_INIT_UNAVAILABLE'}
 const q=(id)=>document.getElementById(id);
 const el=(tag,cls,txt)=>{
  const n=document.createElement(tag);
  if(cls)n.className=cls;
  if(txt!==undefined)n.textContent=txt;
  return n;
 };
 const style=el('style');style.id='m04MockStyleV616';
 style.textContent=`
 #m04MockTriggerV616{position:absolute;right:12px;top:calc(78px + env(safe-area-inset-top,0px));z-index:39;min-height:33px;padding:7px 12px;border:1px solid #cb96ef;border-radius:18px;background:linear-gradient(135deg,#3e264c,#191c30);color:#f8e4ff;font:800 11px/1.2 system-ui,sans-serif;letter-spacing:.03em;box-shadow:0 3px 11px #000a;cursor:pointer}
 #m04MockTriggerV616:focus-visible,.m04MockPanel button:focus-visible{outline:3px solid #ffda85;outline-offset:2px}
 #m04MockModalV616[hidden]{display:none!important}
 #m04MockModalV616{position:absolute;z-index:60;inset:0;display:grid;place-items:center;padding:calc(15px + env(safe-area-inset-top,0px)) 13px calc(12px + env(safe-area-inset-bottom,0px));background:#03050aec;overscroll-behavior:contain}
 .m04MockPanel{width:min(100%,440px);max-height:100%;overflow-y:auto;overscroll-behavior:contain;padding:15px;border:1px solid #906d9b;border-radius:15px;background:linear-gradient(175deg,#1c2136,#100f1b 62%,#100a16);box-shadow:0 18px 40px #000c;color:#f7edf9;font-family:system-ui,sans-serif;text-align:left}
 .m04MockHead{display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:10px}
 .m04MockHead h2{font:bold 20px/1.15 system-ui;margin:0;color:#f7d6ff;letter-spacing:.02em}
 .m04MockSub{margin:5px 0 9px;color:#d6c2dc;font:12px/1.5 system-ui}
 .m04MockBalance{padding:9px 11px;border:1px solid #bf91dd70;background:#4028544d;border-radius:8px;color:#f8daff;font:700 14px/1.45 system-ui;margin-bottom:9px}
 .m04MockCards{display:grid;gap:8px}
 .m04MockCard{display:flex;justify-content:space-between;gap:10px;align-items:center;border:1px solid #6c647d9c;border-radius:10px;padding:10px;background:linear-gradient(110deg,#252333a8,#151621d9)}
 .m04MockItemName{font:800 13px/1.3 system-ui;color:#fff0fd;margin-bottom:2px}
 .m04MockItemDesc{font:11px/1.45 system-ui;color:#d0c7da}
 .m04MockCard button,.m04MockHead button,.m04MockReset{touch-action:manipulation;min-height:36px;border:1px solid #b48dcd;border-radius:8px;background:#503264;color:#fff3ff;font:bold 12px system-ui;padding:7px 10px;flex-shrink:0}
 .m04MockCard button:disabled{background:#292430;color:#a89aaf;border-color:#55475e;opacity:.85}
 #m04MockMessageV616{min-height:21px;margin:9px 0 6px;font:700 12px/1.5 system-ui;color:#aeeec8}
 .m04MockFoot{border-top:1px solid #5c526b;padding-top:9px;display:flex;align-items:center;justify-content:space-between;gap:8px}
 .m04MockDisclaimer{font:10px/1.55 system-ui;color:#d8bfd7;max-width:245px}
 .m04MockReset{font-size:10px;background:#312332}
 .m04CoreGallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:12px 0}
 .m04CoreLook{min-width:0;border:1px solid #6b6587;border-radius:12px;padding:9px;background:radial-gradient(ellipse at 50% 36%,#32446380,#131722 75%)}
 .m04CoreLook[data-equipped="true"]{border-color:#a6f1ed;box-shadow:inset 0 0 18px #5ee6f222}
 #m04MockModalV616 .m04CoreLook canvas{position:static!important;inset:auto!important;transform:none!important;display:block;width:100%!important;height:auto!important;aspect-ratio:1;object-fit:contain;pointer-events:none;z-index:auto!important}
 .m04CoreLook b{display:block;color:#e5ecff;font:700 12px system-ui}
 .m04CoreLook p{font:10px/1.5 system-ui;color:#c5c2d6;margin:5px 0}
 .m04CoreLook button{width:100%;min-height:35px;border-radius:7px;border:1px solid #9a93b0;color:#fff;background:#3e3559;font:700 11px system-ui;touch-action:manipulation}
 .m04CoreLook button:disabled{opacity:.55}
 .m04CoreSectionTitle{font:700 13px system-ui;margin:14px 0 2px;color:#bceef9}
 #m04MockTriggerV616,#m04MockModalV616,#m04MockModalV616 *{font-family:'EVOLVE Hub Sans','EVOLVE Hangul',system-ui,sans-serif!important}
 .m04MockConfirm{padding:12px;margin:10px 0;border:1px solid #bb9cda;border-radius:9px;background:#2f2843}
 .m04MockConfirm p{margin:4px 0 10px;font-size:12px;line-height:1.6}
 .m04MockConfirmActions{display:flex;gap:8px}
 .m04MockConfirmActions button{flex:1;min-height:38px;border:1px solid #bfb0d6;border-radius:7px;background:#59406c;color:#fff;font-size:12px;font-weight:700}
 @media(max-width:360px){.m04MockPanel{padding:11px}.m04MockCard{padding:8px}.m04MockHead h2{font-size:17px}.m04MockItemName{font-size:12px}}
 `;
 const titles={
  starter_genome_once:'테스트 결정 +75 · 1회 구매 보상',
  mutation_crystal_small:'테스트 결정 +100 · 반복 가능',
  mutation_crystal_mid:'테스트 결정 +300 · 반복 가능',
  appearance_unlock_01:'공명 코어 발광 · 파츠 화면과 전투에 적용',
  season_research_pass_01:'시즌 보상 미완성 · 모의 구매 잠금'
 };
 const errors={
  MOCK_ALREADY_OWNED:'이미 구매한 테스트 상품이야.',
  MOCK_CONTENT_NOT_READY:'아직 상품 보상이 준비되지 않았어.',
  MOCK_STORAGE_WRITE_FAILED:'테스트 구매를 저장하지 못했어. 저장 공간을 확인해 줘.',
  INVALID_MOCK_STORAGE:'테스트 저장 데이터가 손상돼 구매를 진행할 수 없어.',
  MOCK_RECEIPT_LIMIT:'테스트 구매 기록 한도에 도달했어.',
  MOCK_BALANCE_OVERFLOW:'테스트 결정 잔고 한도 초과.',
  MOCK_IDEMPOTENCY_CONFLICT:'같은 구매 요청이 다른 상품에 사용됐어.'
  ,MOCK_INSUFFICIENT_TEST_CRYSTALS:'테스트 결정이 부족해. 결정 묶음을 모의 구매해 줘.'
 };
 function current(){return shop.snapshot(PROFILE)}
 function atHome(){return window.EVOLVE_WEB_GUARD?.atHome()===true}
 function notifyChange(){window.dispatchEvent(new Event('evolve:dev-mock-change'))}
 function requestId(){
  const uuid=window.crypto?.randomUUID?.().replace(/-/g,'_');
  if(!uuid)throw Error('RANDOM_ID_UNAVAILABLE');
  return 'mock_req_'+uuid;
 }
 function button(title,action){const n=el('button','',title);n.type='button';n.addEventListener('click',action);return n}
 function buy(sku){
  if(disabled||!shop||pending||!atHome())return;
  try{
   const item=shop.catalog().find(x=>x.sku===sku);
   pending={kind:'purchase',sku,label:item.label,request:requestId()};resetClicks=0;lastError='';
  }catch(e){lastError=errors[e.code]||'모의 구매 준비 실패';}
  draw();
 }
 function cancelPending(){pending=null;resetClicks=0;lastError='모의 구매를 취소했어. 결정과 보유 외형은 그대로야.';draw()}
 function confirmPending(){
  if(!pending||processing||disabled)return;
  if(!atHome()){pending=null;lastError='홈 화면에서 모의 구매를 진행해 줘.';draw();return}
  processing=true;
  try{
   if(pending.kind==='redeem')shop.redeemCosmetic(PROFILE,pending.entitlement,pending.request);
   else shop.simulatePurchase(pending.sku,PROFILE,pending.request);
   lastError=pending.kind==='redeem'?'심홍 코어 해금 완료 · 테스트 결정 120개 사용':'모의 구매 완료 · '+pending.label;
   pending=null;resetClicks=0;notifyChange();
  }catch(e){lastError=errors[e.code]||'모의 구매 실패: '+String(e.code||e.message||e)}
  finally{processing=false;draw()}
 }
 function toggleCore(entitlement='dev_core_theme_01'){
  if(disabled||pending||!atHome())return;
  resetClicks=0;
  try{
   const s=current();
   if(s.equipped.core===entitlement)shop.unequip(PROFILE,'core');
   else shop.equip(PROFILE,'core',entitlement);
   notifyChange();
   lastError='코어 발광을 변경했어. 파츠 화면과 전투에서 확인할 수 있어.';
  }catch(e){lastError=errors[e.code]||'장착할 수 없어.'}
  draw();
 }
 let resetClicks=0;
 function reset(){
  if(!shop||pending||!atHome())return;
  if(++resetClicks<2){lastError='테스트 구매 기록만 초기화하려면 한 번 더 눌러 줘.';draw();return}
  resetClicks=0;
  try{shop.resetTestProfile(PROFILE);notifyChange();lastError='모의 구매 기록만 초기화했어. 기존 게임 저장은 유지돼.'}
  catch(e){lastError=errors[e.code]||'테스트 초기화 실패';}
  draw();
 }
 const modal=el('div');modal.id='m04MockModalV616';modal.hidden=true;modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','EVOLVE 개발용 모의 상점');
 const panel=el('section','m04MockPanel');
 modal.appendChild(panel);
 function redeem(entitlement){
  if(disabled||pending||!atHome())return;
  try{
   pending={kind:'redeem',entitlement,label:'심홍 코어',request:requestId()};resetClicks=0;lastError='';
  }catch(e){lastError=errors[e.code]||'외형 해금 준비 실패'}
  draw();
 }
 function drawLooks(state){
  panel.appendChild(el('h3','m04CoreSectionTitle','코어 컬렉션 · 능력치 변화 없음'));
  const gallery=el('div','m04CoreGallery'),bridge=window.__EVOLVE_DEV_CORE_BRIDGE_V617__;
  for(const item of shop?.cosmetics()||[]){
   const card=el('article','m04CoreLook'),owned=!!state?.owned[item.entitlement],equipped=state?.equipped.core===item.entitlement;
   card.dataset.entitlement=item.entitlement;card.dataset.equipped=String(equipped);
   const preview=bridge?.preview(item.entitlement,320);
   if(preview){preview.setAttribute('aria-label',item.label+' 장착 미리보기');preview.setAttribute('role','img');card.appendChild(preview)}
   else card.appendChild(el('p','','캐릭터 미리보기 준비 중…'));
   card.append(el('b','',item.label),el('p','',equipped?'장착 중 · 파츠 / 전투 적용':owned?'보유 중 · 장착 가능':item.testPrice?'테스트 결정 '+item.testPrice+'개':'상단 코어 상품 모의 구매로 획득'));
   const action=button(owned?(equipped?'해제':'장착'):item.testPrice?'120 TEST 결정으로 해금':'상품에서 획득',()=>owned?toggleCore(item.entitlement):redeem(item.entitlement));
   action.disabled=disabled||!!pending||!bridge?.read().ready||(!owned&&(!item.testPrice||state.testCrystals<item.testPrice));
   card.appendChild(action);gallery.appendChild(card);
  }
  panel.appendChild(gallery);
 }
 function draw(){
  panel.replaceChildren();
  const h=el('div','m04MockHead'),start=el('div');
  start.append(el('h2','','변이 연구소 · MOCK 상점'),el('p','m04MockSub','개발용 모의 구매 · 실제 돈은 청구되지 않아.'));
  h.append(start,button('닫기 ✕',close));panel.appendChild(h);
  let state=null;
  try{state=current();disabled=false}catch(e){disabled=true;lastError=errors[e.code]||'테스트 저장 데이터를 읽을 수 없어.'}
  panel.appendChild(el('div','m04MockBalance','DEV TEST 결정  ◈  '+(state?state.testCrystals.toLocaleString('ko-KR'):'—')+' 개'));
  if(pending){
   const box=el('section','m04MockConfirm'),actions=el('div','m04MockConfirmActions');box.id='m04MockConfirmV617';
   box.append(el('b','','모의 구매 확인'),el('p','',pending.label+(pending.kind==='redeem'?' · 테스트 결정 120개 사용':' · 실제 돈 청구 없음')));
   const approve=button('확인',confirmPending);approve.id='m04MockApproveV617';approve.disabled=disabled||processing;
   actions.append(button('취소',cancelPending),approve);box.appendChild(actions);panel.appendChild(box);
  }
  const list=el('div','m04MockCards');
  for(const item of (shop?.catalog()||[])){
   const row=el('article','m04MockCard'),left=el('div');
   left.append(el('div','m04MockItemName',item.label),el('div','m04MockItemDesc',titles[item.sku]||'테스트 상품'));
   row.appendChild(left);
   const owned=!!(item.entitlement&&state?.owned[item.entitlement]);
   let caption='모의 구매',action=()=>buy(item.sku);
   if(!item.ready){caption='준비 중';action=()=>{}}
   else if(owned&&item.sku==='appearance_unlock_01'){caption=state?.equipped.core===item.entitlement?'해제':'장착';action=()=>toggleCore(item.entitlement)}
   else if(owned){caption='보유 중';action=()=>{}}
   const b=button(caption,action);
   b.disabled=disabled||!!pending||!item.ready||(owned&&item.sku!=='appearance_unlock_01');
   b.setAttribute('aria-label',item.label+' '+caption);
   row.appendChild(b);list.appendChild(row);
  }
  panel.appendChild(list);
  drawLooks(state);
  const message=el('p');message.id='m04MockMessageV616';message.setAttribute('role','status');message.textContent=lastError;
  panel.appendChild(message);
  const foot=el('div','m04MockFoot');
  const resetButton=button(resetClicks?'초기화 확인':'테스트 초기화',reset);resetButton.className='m04MockReset';resetButton.disabled=disabled||!!pending;
  foot.append(el('span','m04MockDisclaimer','MOCK ONLY · 테스트 결정과 코어 발광만 시험 적용. 실제 결제·전투 능력치 변화 없음.'),resetButton);
  panel.appendChild(foot);
  if(opening&&!panel.contains(document.activeElement))(pending?q('m04MockApproveV617'):panel.querySelector('button'))?.focus();
 }
 let lastFocus=null;
 function open(){
  if(opening||!atHome())return;
  opening=true;lastFocus=document.activeElement;lastError='';resetClicks=0;pending=null;draw();modal.hidden=false;
  panel.querySelector('button')?.focus();
 }
 function close(){
  if(!opening)return;
  opening=false;modal.hidden=true;resetClicks=0;pending=null;lastFocus?.focus?.();
 }
 function setup(){
  if(q('m04MockTriggerV616')||!q('poster'))return;
  if(!q('homeStatusV525')||!q('homeTabs'))return;
  document.head.appendChild(style);
  const trigger=button('◈ DEV 상점',open);
  trigger.id='m04MockTriggerV616';trigger.setAttribute('aria-label','개발 전용 모의 상점 열기');
  q('poster').append(trigger,modal);
  window.addEventListener('evolve:dev-cosmetics-ready',()=>{if(opening)draw()});
  window.addEventListener('storage',e=>{if(opening&&(e.key===API.storageKey||e.key===null)){lastError='테스트 저장 상태를 다시 불러왔어.';draw()}});
  modal.addEventListener('click',e=>{if(e.target===modal)close()});
  modal.addEventListener('keydown',e=>{
   if(e.key==='Escape'){e.preventDefault();if(pending)cancelPending();else close()}
   if(e.key==='Tab'){
    const btns=[...panel.querySelectorAll('button:not([disabled])')];
    if(btns.length===0)return;
    const i=btns.indexOf(document.activeElement);
    if(e.shiftKey&&i<=0){btns[btns.length-1].focus();e.preventDefault()}
    if(!e.shiftKey&&i===btns.length-1){btns[0].focus();e.preventDefault()}
   }
  });
  window.__EVOLVE_DEV_MOCK_UI_V616__=Object.freeze({mode:'MOCK_ONLY',open,close,isOpen:()=>opening,read:()=>shop?.snapshot(PROFILE)||null});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();
