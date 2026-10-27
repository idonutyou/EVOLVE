'use strict';
// M01 contract fixture: IN-MEMORY QA ledger, not a deployed payment service.
// Any JS caller may fabricate QA verifier events; NEVER trust these for real money.
// M03 requires authenticated server API + transactional SQL unique constraints;
// M04 requires provider-side receipt verification and signed webhooks.
const QA_ONLY = 'SIMULATED_LEDGER_ONLY';
const FIXTURE_ITEMS = Object.freeze({
 starter_genome_once: {units:10, once:true},
 mutation_crystal_small: {units:20, once:false},
 mutation_crystal_mid: {units:50, once:false},
 appearance_unlock_01: {units:0, once:true, entitlement:'qa_core_theme'},
 season_research_pass_01: {units:0, once:true, entitlement:'qa_season_01'}
});
const id = (value,label,prefix='qa_') => {
 if(typeof value!=='string'||!value.startsWith(prefix)||!/^qa_[a-z0-9_]{3,96}$/.test(value))
  throw new Error('QA-only invalid '+label);
 return value;
};
const payloadKeys=(obj,keys)=>{
 if(!obj||Array.isArray(obj)||typeof obj!=='object'||
  Object.keys(obj).length!==keys.length||!keys.every(k=>Object.hasOwn(obj,k)))
  throw new Error('Untrusted fields in QA provider event');
};
function createContractLedger() {
 const accounts=new Map(),orders=new Map(),txOrder=new Map(),eventFingerprints=new Map(),spendKeys=new Map();
 const account=(accountId)=>{
  id(accountId,'accountId');
  if(!accounts.has(accountId))accounts.set(accountId,{balance:0,debt:0,entitlements:new Set(),history:[]});
  return accounts.get(accountId);
 };
 const copy=a=>({balance:a.balance,debt:a.debt,entitlements:[...a.entitlements].sort(),
  environment:QA_ONLY,realPurchases:0,actualAccountAuthentication:false});
 function registerTestOrder({orderId,accountId,sku}){
  id(orderId,'orderId');id(accountId,'accountId');
  if(!Object.hasOwn(FIXTURE_ITEMS,sku))throw new Error('Unknown mock SKU');
  const existing=orders.get(orderId);
  if(existing){
   if(existing.accountId!==accountId||existing.sku!==sku)throw new Error('Conflicting order reuse');
   return {accepted:false,duplicate:true};
  }
  orders.set(orderId,{accountId,sku,verified:false,refunded:false,providerTxId:null,unitsGranted:0,entitlementGranted:null});
  return {accepted:true,duplicate:false};
 }
 function claimSimulatedReceipt(event){
  payloadKeys(event,['eventId','providerTransactionId','orderId','origin']);
  id(event.eventId,'eventId');id(event.providerTransactionId,'providerTransactionId');
  id(event.orderId,'orderId');
  if(event.origin!=='QA_SIMULATED_VERIFIED_PROVIDER')throw new Error('No verified QA provider origin');
  const key=JSON.stringify(event),old=eventFingerprints.get(event.eventId);
  if(old!==undefined){
   if(old!==key)throw new Error('Event ID conflict');
   return {credited:false,duplicate:true};
  }
  const order=orders.get(event.orderId);
  if(!order)throw new Error('Order not registered');
  if(order.verified)throw new Error('Order already verified; new event is not a new grant');
  const bound=txOrder.get(event.providerTransactionId);
  if(bound && bound!==event.orderId)throw new Error('Provider transaction already claimed for another order');
  const a=account(order.accountId),reward=FIXTURE_ITEMS[order.sku];
  if(reward.once && [...orders.entries()].some(([k,o])=>k!==event.orderId&&o.accountId===order.accountId&&o.sku===order.sku&&o.verified&&!o.refunded))
   throw new Error('Non-repeatable ownership already active');
  // Mock server derives value from trusted FIXTURE_ITEMS, never from event or localStorage.
  const units=reward.units,appliedToDebt=Math.min(units,a.debt);
  a.debt-=appliedToDebt;a.balance+=units-appliedToDebt;
  if(reward.entitlement)a.entitlements.add(reward.entitlement);
  Object.assign(order,{verified:true,providerTxId:event.providerTransactionId,
   unitsGranted:units,entitlementGranted:reward.entitlement||null});
  txOrder.set(event.providerTransactionId,event.orderId);
  eventFingerprints.set(event.eventId,key);
  a.history.push({orderId:event.orderId,sku:order.sku,kind:'QA_GRANT',units,appliedToDebt});
  return {credited:true,duplicate:false,qaOnly:true,balance:a.balance,entitlements:[...a.entitlements]};
 }
 function spendTestCrystals({accountId,spendKey,units}){
  id(accountId,'accountId');id(spendKey,'spendKey');
  if(!Number.isSafeInteger(units)||units<1)throw new Error('Invalid spend');
  const key=accountId+'|'+spendKey,prev=spendKeys.get(key);
  if(prev!==undefined){if(prev!==units)throw new Error('Spend idempotency conflict');return {spent:false,duplicate:true};}
  const a=account(accountId);
  if(a.debt||a.balance<units)throw new Error('Insufficient available QA premium currency');
  a.balance-=units;spendKeys.set(key,units);a.history.push({spendKey,kind:'QA_SPEND',units});
  return {spent:true,duplicate:false,balance:a.balance};
 }
 function refundSimulatedProvider(event){
  payloadKeys(event,['eventId','providerTransactionId','orderId','origin']);
  id(event.eventId,'eventId');id(event.providerTransactionId,'providerTransactionId');id(event.orderId,'orderId');
  if(event.origin!=='QA_SIMULATED_REFUND_PROVIDER')throw new Error('Missing QA refund verifier');
  const key=JSON.stringify(event),old=eventFingerprints.get(event.eventId);
  if(old!==undefined){if(old!==key)throw new Error('Refund event ID conflict');return {refunded:false,duplicate:true};}
  const o=orders.get(event.orderId);
  if(!o||!o.verified||o.refunded||o.providerTxId!==event.providerTransactionId)throw new Error('Invalid refund');
  const a=account(o.accountId),deduct=Math.min(a.balance,o.unitsGranted);
  a.balance-=deduct;
  a.debt+=o.unitsGranted-deduct; // debt is tracked separately, never negative spendable balance.
  if(o.entitlementGranted)a.entitlements.delete(o.entitlementGranted);
  o.refunded=true;eventFingerprints.set(event.eventId,key);
  a.history.push({orderId:event.orderId,kind:'QA_REFUND',debt:a.debt});
  return {refunded:true,duplicate:false,balance:a.balance,debt:a.debt};
 }
 function restoreQaAccount(accountId){return copy(account(accountId));}
 function convertLocalDnaToPremium(){throw new Error('Local DNA is never a trusted premium credit');}
 return Object.freeze({environment:QA_ONLY,catalogPurchasable:false,providerVerified:false,
  registerTestOrder,claimSimulatedReceipt,spendTestCrystals,refundSimulatedProvider,
  restoreQaAccount,convertLocalDnaToPremium});
}
module.exports={QA_ONLY,createContractLedger};
