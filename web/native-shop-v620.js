/* EVOLVE V620 — single native SHOP view. No DEV popup or separate store.
 * MOCK_ONLY / free test grants: NEVER uses real billing, DNA, M03, or game save.
 */
(()=>{
 'use strict';
 const host=location.hostname;
 if(!['idonutyou.github.io','localhost','127.0.0.1'].includes(host))return;
 const api=window.__EVOLVE_DEV_MOCK_STORE_V615__;
 if(!api||api.mode!=='MOCK_ONLY')return;
 const PROFILE='dev_local_profile_01',make=(tag,cls,txt)=>{
  const e=document.createElement(tag);if(cls)e.className=cls;
  if(txt!==undefined)e.textContent=txt;return e;
 };
 const copy=Object.freeze({
  starter_genome_once:['첫 변이 지원','TEST 결정 75개 · 계정당 1회'],
  mutation_crystal_small:['변이 결정 소형','TEST 결정 100개 · 반복 테스트'],
  mutation_crystal_mid:['변이 결정 중형','TEST 결정 300개 · 반복 테스트'],
  appearance_unlock_01:['공명 코어 테마','캐릭터·전투 코어 발광 외형 · 능력치 변화 없음'],
  season_research_pass_01:['연구 시즌 패스','아직 준비 중 · 구매할 수 없음']
 });
 const styles=`
 #homeShopViewV601 .nativeShopV620{padding:10px 0 20px;max-width:440px;margin:0 auto;color:#f3e9e3;font-family:'EVOLVE Hub Sans','EVOLVE Hangul',system-ui,sans-serif}
 #homeShopViewV601 .nativeShopV620 *{box-sizing:border-box}
 #homeShopViewV601 .nativeShopTitleV620{font:900 19px/1.3 system-ui;margin:8px 0 5px;color:#ffe2ad}
 #homeShopViewV601 .nativeShopNoteV620{font:600 12px/1.5 system-ui;margin:0 0 9px;color:#d5c0ad}
 #homeShopViewV601 .nativeShopBalanceV620{padding:11px;border-radius:10px;border:1px solid #957458;background:linear-gradient(130deg,#392c25,#1d2029);font:800 14px/1.5 system-ui;color:#ffe1b2;margin:10px 0}
 #homeShopViewV601 .nativeShopGroupV620{font:800 13px/1.5 system-ui;margin:17px 0 7px;color:#eac9ba;letter-spacing:.02em}
 #homeShopViewV601 .nativeShopCardV620{display:flex;justify-content:space-between;align-items:center;gap:9px;margin:6px 0;padding:11px 9px;background:#1e2028;border:1px solid #6e5654;border-radius:10px}
 #homeShopViewV601 .nativeShopCardV620>div{min-width:0;flex:1}
 #homeShopViewV601 .nativeShopCardV620 strong{display:block;font:800 13px/1.4 system-ui;color:#ffe9d1}
 #homeShopViewV601 .nativeShopCardV620 small{display:block;font:500 11px/1.45 system-ui;color:#cbbdbf;margin-top:4px;overflow-wrap:anywhere}
 #homeShopViewV601 .nativeShopCardV620 button,#homeShopViewV601 .nativeShopConfirmV620 button{flex:0 0 auto;min-height:44px;min-width:84px;max-width:46%;padding:7px 10px;border:1px solid #a48572;border-radius:9px;background:#5a3932;color:#fff4e7;font:800 12px/1.35 system-ui;touch-action:manipulation}
 #homeShopViewV601 .nativeShopCardV620 button:disabled{color:#baa9a3;background:#302b30;opacity:.76;border-color:#5c4c49}
 #homeShopViewV601 .nativeShopCardV620 button:focus-visible,#homeShopViewV601 .nativeShopConfirmV620 button:focus-visible{outline:3px solid #ffd28e;outline-offset:2px}
 #homeShopViewV601 .nativeShopStatusV620{font:800 11px/1.4 system-ui;color:#baf4e4;margin:6px 0}
 #homeShopViewV601 .nativeShopMessageV620{font:700 12px/1.6 system-ui;color:#c9f0dd;margin:12px 0;min-height:20px;overflow-wrap:anywhere}
 #homeShopViewV601 .nativeShopMessageV620[data-error="true"]{color:#ffb4ad}
 #homeShopViewV601 .nativeShopConfirmV620{border:2px solid #e9ac7a;border-radius:10px;background:#332726;padding:13px;margin:10px 0}
 #homeShopViewV601 .nativeShopConfirmV620 strong{display:block;font:900 13px/1.55 system-ui;margin-bottom:11px}
 #homeShopViewV601 .nativeShopConfirmV620>div{display:flex;gap:10px}
 #homeShopViewV601 .nativeShopConfirmV620 button{max-width:none;flex:1}
 #homeShopViewV601 .nativeShopFootV620{color:#d0b3ae;font:600 11px/1.5 system-ui;margin:15px 0}
 @media(max-width:350px){#homeShopViewV601 .nativeShopCardV620{flex-wrap:wrap}#homeShopViewV601 .nativeShopCardV620 button{min-width:100%;max-width:none}}
 `;
 const css=make('style');css.id='nativeShopStyleV620';css.textContent=styles;document.head.appendChild(css);
 let shop=null,root=null,content=null,pending=null,busy=false,readOnly=false,message='',error=false,seq=0;
 let lastSnapshot=null;
 function safeSnapshot(){
  if(!shop)return null;
  try{return shop.snapshot(PROFILE)}catch(e){
   readOnly=true;message='테스트 기록을 읽을 수 없어. 기록을 삭제하지 않고 상점 조작을 차단했어.';error=true;return null;
  }
 }
 function atShop(){
  const view=document.getElementById('homeShopViewV601');
  return !!(view&&!view.classList.contains('hidden')&&window.EVOLVE_WEB_GUARD?.atHome?.());
 }
 function stamp(){seq++;return 'native_'+Date.now().toString(36)+'_'+seq.toString(36)+'_'+Math.random().toString(36).slice(2,12)}
 function fire(){
  window.dispatchEvent(new Event('evolve:dev-mock-change'));
  window.__EVOLVE_DEV_CORE_BRIDGE_V617__?.sync?.();
 }
 function action(kind,key){
  if(busy||readOnly||pending||!atShop())return;
  const snap=safeSnapshot();if(!snap){render();return}
  if(kind==='equip'){
   try{const next=snap.equipped.core===key?shop.unequip(PROFILE,'core'):shop.equip(PROFILE,'core',key);
    message=snap.equipped.core===key?'코어 장착을 해제했어.':'코어를 장착했어.';error=false;lastSnapshot=next;fire();
   }catch(e){failed(e)}render();return;
  }
  pending={kind,key,request:stamp()};
  render();
 }
 function failed(e){
  const code=e?.code||String(e?.message||'UNKNOWN');
  const texts={MOCK_INSUFFICIENT_TEST_CRYSTALS:'TEST 결정이 부족해.',MOCK_ALREADY_OWNED:'이미 획득한 상품이야.',MOCK_CONTENT_NOT_READY:'아직 준비되지 않은 상품이야.',MOCK_RECEIPT_LIMIT:'테스트 기록 한도에 도달했어.',MOCK_STORAGE_WRITE_FAILED:'저장 실패: 추가 조작을 막았어.',INVALID_MOCK_STORAGE:'기록이 손상됐어. 자동으로 초기화하지 않아.',MOCK_STORAGE_UNAVAILABLE:'브라우저 저장소를 읽지 못했어.'};
  message=texts[code]||'테스트를 완료하지 못했어 ('+code+')';error=true;
  if(/STORAGE/.test(code))readOnly=true;
 }
 function commit(){
  if(!pending||busy||readOnly||!atShop())return;
  busy=true;const p=pending;pending=null;
  try{
   if(p.kind==='buy')shop.simulatePurchase(p.key,PROFILE,p.request);
   else if(p.kind==='redeem')shop.redeemCosmetic(PROFILE,p.key,p.request);
   message='TEST 상품을 획득했어. 실제 결제나 게임 재화 지급은 없어.';error=false;
   lastSnapshot=safeSnapshot();fire();
  }catch(e){failed(e)}
  busy=false;render();
 }
 function cancel(){pending=null;message='구매 확인을 취소했어. 저장 기록은 바뀌지 않았어.';error=false;render()}
 function button(label,onclick,disabled=false,key=''){
  const b=make('button','',label);b.type='button';b.disabled=disabled||readOnly||busy||!!pending;
  if(key)b.dataset.nativeSku=key;
  b.addEventListener('click',onclick);return b;
 }
 function addCard(parent,title,desc,label,onclick,disabled=false,key='',status=''){
  const row=make('article','nativeShopCardV620'),left=make('div'),name=make('strong','',title),small=make('small','',desc);
  left.append(name,small);if(status)left.append(make('p','nativeShopStatusV620',status));
  row.append(left,button(label,onclick,disabled,key));parent.append(row);
 }
 function render(){
  if(!root||!content)return;
  const state=safeSnapshot();
  const frag=document.createDocumentFragment();
  frag.append(make('h3','nativeShopTitleV620','변이 상점'));
  frag.append(make('p','nativeShopNoteV620','기존 SHOP 통합 · 무료 모의 획득 테스트 · 실제 결제 없음'));
  frag.append(make('div','nativeShopBalanceV620','TEST 결정  ◈  '+(state?state.testCrystals.toLocaleString('ko-KR'):'확인 불가')+' 개'));
  const warning=make('p','nativeShopMessageV620',message||'시험용 외형은 능력치·전투 밸런스를 변경하지 않아.');
  warning.dataset.error=String(error||readOnly);warning.setAttribute('role','status');frag.append(warning);
  if(readOnly){frag.append(make('p','nativeShopFootV620','테스트 저장 문제가 발생했어. 기존 데이터를 자동 삭제·변경하지 않아.'));content.replaceChildren(frag);return;}
  if(pending){
   const confirm=make('section','nativeShopConfirmV620');confirm.id='nativeShopConfirmV620';
   confirm.append(make('strong','',pending.kind==='redeem'?'TEST 결정 120개를 사용해 심홍 코어를 해금할까?':'이 TEST 상품을 무료로 모의 획득할까?'));
   const actions=make('div'),yes=make('button','','확인'),no=make('button','','취소');
   yes.type=no.type='button';yes.id='nativeShopConfirmAcceptV620';no.id='nativeShopConfirmCancelV620';
   yes.addEventListener('click',commit);no.addEventListener('click',cancel);actions.append(no,yes);confirm.append(actions);frag.append(confirm);
  }
  frag.append(make('h4','nativeShopGroupV620','TEST 상품'));
  for(const item of api.catalog()){
   const [label,desc]=copy[item.sku];
   const owned=state&&item.entitlement&&state.owned[item.entitlement];
   const already=!!(item.repeatLimit===1&&(owned||Object.values(state?.receipts||{}).some(x=>x.sku===item.sku)));
   const disabled=!item.ready||already||!state;
   const btn=!item.ready?'준비 중':already?'획득 완료':'무료 테스트';
   addCard(frag,label,desc,btn,()=>action('buy',item.sku),disabled,item.sku,owned?'보유 중':!item.ready?'판매 준비 중':'');
  }
  frag.append(make('h4','nativeShopGroupV620','코어 컬렉션'));
  const options=api.cosmetics(),count=options.filter(item=>state?.owned[item.entitlement]).length;
  frag.append(make('p','nativeShopNoteV620','보유 코어 '+count+' / '+options.length+'개 · 전투 외형에만 적용'));
  for(const item of options){
   const owned=!!state?.owned[item.entitlement],active=state?.equipped.core===item.entitlement;
   const label=active?'해제':owned?'장착':item.testPrice>0?item.testPrice+' TEST 결정':'상품에서 획득';
   const disable=!state||(!owned&&item.testPrice===0)||(item.testPrice>state.testCrystals&&!owned);
   const desc=item.entitlement==='dev_core_theme_01'?'청록 공명 발광 코어':'붉은 심홍 발광 코어';
   const row=make('article','nativeShopCardV620'),left=make('div');
   left.append(make('strong','',item.label),make('small','',desc),make('p','nativeShopStatusV620',active?'장착 중':owned?'획득 완료':'미보유'));
   const btn=button(label,()=>action(owned?'equip':'redeem',item.entitlement),disable,item.entitlement);
   btn.dataset.nativeCore=item.entitlement;
   btn.setAttribute('aria-pressed',String(active));
   row.append(left,btn);frag.append(row);
  }
  frag.append(make('p','nativeShopFootV620','TEST 결정과 모의 구매 내역은 이 브라우저의 분리된 테스트 저장 공간에만 기록돼. 실제 돈·DNA·게임 진행 저장·운영 유료 권리는 변경되지 않아.'));
  content.replaceChildren(frag);
 }
 function mount(){
  const view=document.getElementById('homeShopViewV601');
  if(!view||root)return !!root;
  // Keep the original DNA upgrade engine nodes alive but remove obsolete cards from SHOP.
  const existing=view.querySelector('#labPanel');
  if(existing){const hold=make('div');hold.id='nativeShopLegacyResearchV620';hold.hidden=true;hold.style.display='none';existing.replaceWith(hold);hold.appendChild(existing);}
  const hint=document.getElementById('homeShopHintV601');if(hint)hint.textContent='코어 외형·TEST 상품을 확인하고 장착하세요. 실제 결제는 제공하지 않습니다.';
  root=make('section','nativeShopV620');root.id='nativeShopV620';root.setAttribute('aria-label','변이 상점 · 모의 상품');
  content=make('div');content.id='nativeShopContentV620';root.append(content);view.append(root);
  try{shop=api.createStore({enabled:true,storage:window.localStorage});safeSnapshot()}catch(e){failed(e);readOnly=true;}
  render();
  const nav=document.getElementById('homeShopTabV601');
  nav?.addEventListener('click',()=>{pending=null;render();});
  const observer=new MutationObserver(()=>{if(atShop()){if(pending)pending=null;render();}});
  observer.observe(view,{attributes:true,attributeFilter:['class']});
  window.addEventListener('pageshow',()=>{pending=null;render()});
  window.addEventListener('storage',e=>{if(e.key===api.storageKey||e.key===null)render()});
  return true;
 }
 if(!mount()){
  const retry=setInterval(()=>{if(mount())clearInterval(retry)},150);
  setTimeout(()=>clearInterval(retry),20000);
 }
 window.__EVOLVE_NATIVE_SHOP_V620__=Object.freeze({mode:'MOCK_ONLY',getState:()=>shop?.snapshot(PROFILE),open:()=>document.getElementById('homeShopTabV601')?.click(),hasPending:()=>!!pending,isReadOnly:()=>readOnly});
})();
