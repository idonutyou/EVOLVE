/* EVOLVE M04-50 | Optional home overlay for DEVELOPMENT MOCK store only.
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
 let shop,opening=false,disabled=false,lastError='';
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
 @media(max-width:360px){.m04MockPanel{padding:11px}.m04MockCard{padding:8px}.m04MockHead h2{font-size:17px}.m04MockItemName{font-size:12px}}
 `;
 const titles={
  starter_genome_once:'테스트 결정 +75 · 1회 구매 보상',
  mutation_crystal_small:'테스트 결정 +100 · 반복 가능',
  mutation_crystal_mid:'테스트 결정 +300 · 반복 가능',
  appearance_unlock_01:'코어 외형 테스트 소유권 · 실제 그래픽 준비 중',
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
 };
 function current(){return shop.snapshot(PROFILE)}
 function button(title,action){const n=el('button','',title);n.type='button';n.addEventListener('click',action);return n}
 function buy(sku){
  if(disabled||!shop)return;
  try{
   const uuid=window.crypto?.randomUUID?.().replace(/-/g,'_');
   if(!uuid)throw Error('RANDOM_ID_UNAVAILABLE');
   const {receipt,replayed}=shop.simulatePurchase(sku,PROFILE,'mock_req_'+uuid);
   lastError=(replayed?'이미 처리된 테스트 요청 · ':'모의 구매 완료 · ')+receipt.sku;
   draw();
  }catch(e){lastError=errors[e.code]||'모의 구매 실패: '+String(e.code||e.message||e);draw()}
 }
 function toggleCore(){
  try{
   const s=current();
   if(s.equipped.core)shop.unequip(PROFILE,'core');
   else shop.equip(PROFILE,'core','dev_core_theme_01');
   lastError='코어 테스트 장착 상태가 변경됐어. 실제 외형 적용은 후속 작업이야.';
  }catch(e){lastError=errors[e.code]||'장착할 수 없어.'}
  draw();
 }
 let resetClicks=0;
 function reset(){
  if(!shop)return;
  if(++resetClicks<2){lastError='테스트 구매 기록만 초기화하려면 한 번 더 눌러 줘.';draw();return}
  resetClicks=0;
  try{shop.resetTestProfile(PROFILE);lastError='모의 구매 기록만 초기화했어. 기존 게임 저장은 유지돼.'}
  catch(e){lastError=errors[e.code]||'테스트 초기화 실패';}
  draw();
 }
 const modal=el('div');modal.id='m04MockModalV616';modal.hidden=true;modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','EVOLVE 개발용 모의 상점');
 const panel=el('section','m04MockPanel');
 modal.appendChild(panel);
 function draw(){
  panel.replaceChildren();
  const h=el('div','m04MockHead'),start=el('div');
  start.append(el('h2','','변이 연구소 · MOCK 상점'),el('p','m04MockSub','개발용 모의 구매 · 실제 돈은 청구되지 않아.'));
  h.append(start,button('닫기 ✕',close));panel.appendChild(h);
  let state=null;
  try{state=current()}catch(e){disabled=true;lastError=errors[e.code]||'테스트 저장 데이터를 읽을 수 없어.'}
  panel.appendChild(el('div','m04MockBalance','DEV TEST 결정  ◈  '+(state?state.testCrystals.toLocaleString('ko-KR'):'—')+' 개'));
  const list=el('div','m04MockCards');
  for(const item of (shop?.catalog()||[])){
   const row=el('article','m04MockCard'),left=el('div');
   left.append(el('div','m04MockItemName',item.label),el('div','m04MockItemDesc',titles[item.sku]||'테스트 상품'));
   row.appendChild(left);
   const owned=!!(item.entitlement&&state?.owned[item.entitlement]);
   let caption='모의 구매',action=()=>buy(item.sku);
   if(!item.ready){caption='준비 중';action=()=>{}}
   else if(owned&&item.sku==='appearance_unlock_01'){caption=state?.equipped.core===item.entitlement?'해제':'장착';action=toggleCore}
   else if(owned){caption='보유 중';action=()=>{}}
   const b=button(caption,action);
   b.disabled=disabled||!item.ready||(owned&&item.sku!=='appearance_unlock_01');
   b.setAttribute('aria-label',item.label+' '+caption);
   row.appendChild(b);list.appendChild(row);
  }
  panel.appendChild(list);
  const message=el('p');message.id='m04MockMessageV616';message.setAttribute('role','status');message.textContent=lastError;
  panel.appendChild(message);
  const foot=el('div','m04MockFoot');
  foot.append(el('span','m04MockDisclaimer','MOCK ONLY · 코어 테마는 소유/장착 상태만 저장. 실제 그래픽·유료 재화와 분리.'),button('테스트 초기화',reset));
  panel.appendChild(foot);
 }
 let lastFocus=null;
 function open(){
  if(opening)return;
  opening=true;lastFocus=document.activeElement;lastError='';resetClicks=0;draw();modal.hidden=false;
  panel.querySelector('button')?.focus();
 }
 function close(){
  if(!opening)return;
  opening=false;modal.hidden=true;resetClicks=0;lastFocus?.focus?.();
 }
 function setup(){
  if(q('m04MockTriggerV616')||!q('poster'))return;
  if(!q('homeStatusV525')||!q('homeTabs'))return;
  document.head.appendChild(style);
  const trigger=button('◈ DEV 상점',open);
  trigger.id='m04MockTriggerV616';trigger.setAttribute('aria-label','개발 전용 모의 상점 열기');
  q('poster').append(trigger,modal);
  modal.addEventListener('click',e=>{if(e.target===modal)close()});
  modal.addEventListener('keydown',e=>{
   if(e.key==='Escape'){e.preventDefault();close()}
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
