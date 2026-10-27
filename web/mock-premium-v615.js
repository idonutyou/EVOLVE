/* EVOLVE M04-40 | Developer mock purchases, NOT a payment provider or production wallet.
 * Separate EVOLVE_DEV_MOCK_STORE_V1 storage; does not read/write game save or M03.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&root.window===root&&root.location){
  const host=root.location.hostname;
  const allowed=host==='idonutyou.github.io'||host==='localhost'||host==='127.0.0.1';
  if(allowed&&new URLSearchParams(root.location.search).get('evolveMockShop')==='1'){
   Object.defineProperty(root,'__EVOLVE_DEV_MOCK_STORE_V615__',{value:Object.freeze(api),configurable:false,writable:false});
  }
 }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const KEY='EVOLVE_DEV_MOCK_STORE_V1';
 const VERSION='evolve.dev-mock-shop.v1';
 const CATALOG=Object.freeze({
  starter_genome_once:Object.freeze({sku:'starter_genome_once',label:'첫 변이 지원 패키지',kind:'bundle',repeatLimit:1,ready:true,devCrystals:75,entitlement:'dev_starter_support_v1',visualReady:false}),
  mutation_crystal_small:Object.freeze({sku:'mutation_crystal_small',label:'변이 결정 소형 묶음 (테스트)',kind:'consumable',repeatLimit:null,ready:true,devCrystals:100,entitlement:null,visualReady:false}),
  mutation_crystal_mid:Object.freeze({sku:'mutation_crystal_mid',label:'변이 결정 중형 묶음 (테스트)',kind:'consumable',repeatLimit:null,ready:true,devCrystals:300,entitlement:null,visualReady:false}),
  appearance_unlock_01:Object.freeze({sku:'appearance_unlock_01',label:'공명 코어 테마 (테스트)',kind:'cosmetic',repeatLimit:1,ready:true,devCrystals:0,entitlement:'dev_core_theme_01',visualReady:true}),
  season_research_pass_01:Object.freeze({sku:'season_research_pass_01',label:'연구 시즌 패스 (준비 중)',kind:'season',repeatLimit:1,ready:false,devCrystals:0,entitlement:null,visualReady:false})
 });
 const COSMETICS=Object.freeze({
  dev_core_theme_01:Object.freeze({entitlement:'dev_core_theme_01',label:'공명 코어',slot:'core',testPrice:0,source:'appearance_unlock_01'}),
  dev_core_theme_02:Object.freeze({entitlement:'dev_core_theme_02',label:'심홍 코어',slot:'core',testPrice:120,source:'test_crystal_redemption'})
 });
 const bad=(code)=>{const e=new Error(code);e.code=code;throw e;};
 const copy=x=>JSON.parse(JSON.stringify(x));
 const safeId=(v,max=72)=>typeof v==='string'&&v.length>=3&&v.length<=max&&/^[A-Za-z0-9_-]+$/.test(v)&&!['__proto__','constructor','prototype'].includes(v);
 const fresh=()=>({schema:VERSION,profiles:{}});
 const record=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
 const owns=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
 function validate(state){
  if(!record(state)||state.schema!==VERSION||!record(state.profiles))bad('INVALID_MOCK_STORAGE');
  for(const [id,profile] of Object.entries(state.profiles)){
   if(!safeId(id)||!record(profile)||profile.schema!==VERSION||!Number.isSafeInteger(profile.testCrystals)||profile.testCrystals<0||!record(profile.receipts)||!record(profile.owned)||!record(profile.equipped)||!Number.isSafeInteger(profile.revision)||profile.revision<0)bad('INVALID_MOCK_STORAGE');
   for(const [key,value] of Object.entries(profile.owned))if((!owns(COSMETICS,key)&&key!=='dev_starter_support_v1')||value!==true)bad('INVALID_MOCK_STORAGE');
   for(const [slot,id] of Object.entries(profile.equipped))if(slot!=='core'||!owns(COSMETICS,id)||profile.owned[id]!==true)bad('INVALID_MOCK_STORAGE');
   for(const [key,r] of Object.entries(profile.receipts)){
    if(!safeId(key,96)||key.length<12||!record(r)||r.mockOnly!==true||r.source!=='dev_mock'||r.status!=='MOCK_GRANTED'||!Number.isSafeInteger(r.devCrystals)||r.devCrystals<0)bad('INVALID_MOCK_STORAGE');
    if(!owns(CATALOG,r.sku)&&r.sku!=='redeem_dev_core_theme_02')bad('INVALID_MOCK_STORAGE');
    if(r.sku==='redeem_dev_core_theme_02'&&r.testCrystalsSpent!==COSMETICS.dev_core_theme_02.testPrice)bad('INVALID_MOCK_STORAGE');
   }
  }
  return state;
 }
 function emptyProfile(){return {schema:VERSION,testCrystals:0,receipts:{},owned:{},equipped:{},revision:0};}
 function createStore({storage,enabled=false}={}){
  if(!enabled)bad('MOCK_MODE_DISABLED');
  if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function')bad('MOCK_STORAGE_REQUIRED');
  const read=()=>{let raw;try{raw=storage.getItem(KEY)}catch{bad('MOCK_STORAGE_UNAVAILABLE')}
    if(raw===null)return fresh();
    try{return validate(JSON.parse(raw))}catch{bad('INVALID_MOCK_STORAGE')}
  };
  const persist=data=>{try{storage.setItem(KEY,JSON.stringify(data))}catch{bad('MOCK_STORAGE_WRITE_FAILED')}};
  const inspect=id=>{
   if(!safeId(id))bad('INVALID_TEST_PROFILE');
   const data=read();
   return {data,profile:Object.prototype.hasOwnProperty.call(data.profiles,id)?data.profiles[id]:emptyProfile()};
  };
  const view=id=>{
   const {profile}=inspect(id);
   return copy({mockOnly:true,source:'dev_mock',testCrystals:profile.testCrystals,owned:profile.owned,equipped:profile.equipped,receipts:profile.receipts,revision:profile.revision});
  };
  const buy=(sku,id,requestId)=>{
   if(!safeId(id))bad('INVALID_TEST_PROFILE');
   if(!safeId(requestId,96)||requestId.length<12)bad('INVALID_MOCK_REQUEST_ID');
   const item=CATALOG[sku];
   if(!item)bad('UNKNOWN_MOCK_SKU');
   if(!item.ready)bad('MOCK_CONTENT_NOT_READY');
   const {data,profile}=inspect(id),existing=Object.prototype.hasOwnProperty.call(profile.receipts,requestId)?profile.receipts[requestId]:null;
   if(existing){
    if(existing.sku!==sku)bad('MOCK_IDEMPOTENCY_CONFLICT');
    return {receipt:copy(existing),replayed:true,state:view(id)};
   }
   if(item.repeatLimit===1&&Object.values(profile.receipts).some(r=>r.sku===sku))bad('MOCK_ALREADY_OWNED');
   if(Object.keys(profile.receipts).length>=500)bad('MOCK_RECEIPT_LIMIT');
   if(profile.testCrystals>Number.MAX_SAFE_INTEGER-item.devCrystals)bad('MOCK_BALANCE_OVERFLOW');
   const next=copy(data),p=owns(next.profiles,id)?next.profiles[id]:emptyProfile();
   p.testCrystals+=item.devCrystals;
   if(item.entitlement)p.owned[item.entitlement]=true;
   const receipt={mockOnly:true,source:'dev_mock',mockTransactionId:'devmock_'+requestId,sku,kind:item.kind,devCrystals:item.devCrystals,entitlement:item.entitlement,status:'MOCK_GRANTED'};
   p.receipts[requestId]=receipt;p.revision++;
   next.profiles[id]=p;persist(next);
   return {receipt:copy(receipt),replayed:false,state:view(id)};
  };
  const equip=(id,slot,entitlement)=>{
   if(!safeId(id)||slot!=='core'||!Object.prototype.hasOwnProperty.call(COSMETICS,entitlement))bad('INVALID_MOCK_EQUIP');
   const {data,profile}=inspect(id);
   if(!profile.owned[entitlement])bad('MOCK_ENTITLEMENT_NOT_OWNED');
   const next=copy(data),p=next.profiles[id];
   if(p.equipped[slot]!==entitlement){p.equipped[slot]=entitlement;p.revision++;persist(next)}
   return view(id);
  };
  const unequip=(id,slot)=>{
   if(!safeId(id)||slot!=='core')bad('INVALID_MOCK_EQUIP');
   const {data,profile}=inspect(id);
   if(profile.equipped[slot]){const next=copy(data);delete next.profiles[id].equipped[slot];next.profiles[id].revision++;persist(next)}
   return view(id);
  };
  const reset=(id)=>{
   if(!safeId(id))bad('INVALID_TEST_PROFILE');
   const data=read();delete data.profiles[id];persist(data);return view(id);
  };
  const redeemCosmetic=(id,entitlement,requestId)=>{
   if(!safeId(id))bad('INVALID_TEST_PROFILE');
   if(!safeId(requestId,96)||requestId.length<12)bad('INVALID_MOCK_REQUEST_ID');
   const item=Object.prototype.hasOwnProperty.call(COSMETICS,entitlement)?COSMETICS[entitlement]:null;
   if(!item||item.source!=='test_crystal_redemption')bad('UNKNOWN_MOCK_REDEMPTION');
   const {data,profile}=inspect(id),existing=Object.prototype.hasOwnProperty.call(profile.receipts,requestId)?profile.receipts[requestId]:null;
   const sku='redeem_'+entitlement;
   if(existing){
    if(existing.sku!==sku)bad('MOCK_IDEMPOTENCY_CONFLICT');
    return {receipt:copy(existing),replayed:true,state:view(id)};
   }
   if(profile.owned[entitlement])bad('MOCK_ALREADY_OWNED');
   if(profile.testCrystals<item.testPrice)bad('MOCK_INSUFFICIENT_TEST_CRYSTALS');
   if(Object.keys(profile.receipts).length>=500)bad('MOCK_RECEIPT_LIMIT');
   const next=copy(data),p=next.profiles[id];
   p.testCrystals-=item.testPrice;p.owned[entitlement]=true;p.revision++;
   const receipt={mockOnly:true,source:'dev_mock',mockTransactionId:'devmock_'+requestId,sku,kind:'cosmetic_redemption',devCrystals:0,testCrystalsSpent:item.testPrice,entitlement,status:'MOCK_GRANTED'};
   p.receipts[requestId]=receipt;persist(next);
   return {receipt:copy(receipt),replayed:false,state:view(id)};
  };
  return Object.freeze({storageKey:KEY,mode:'MOCK_ONLY',catalog:()=>copy(Object.values(CATALOG)),cosmetics:()=>copy(Object.values(COSMETICS)),snapshot:view,simulatePurchase:buy,redeemCosmetic,equip,unequip,resetTestProfile:reset});
 }
 return Object.freeze({createStore,storageKey:KEY,version:VERSION,mode:'MOCK_ONLY',catalog:()=>copy(Object.values(CATALOG))});
});
