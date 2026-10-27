'use strict';
// M01: OFFLINE STATE TRANSITION SPECIFICATION ONLY.
// Any caller can imitate an event in a pure JavaScript simulation.
// DO NOT deploy this as payment verification or a real money/rights ledger.
// M03/M04 must provide server auth, signature validation and atomic DB transactions.
const TEST_ENV = 'CONTRACT_TEST_ONLY';
const steps = Object.freeze(['REQUESTED','PROVIDER_PENDING','PROVIDER_VERIFIED','LEDGER_CREDITED','CLIENT_ACKNOWLEDGED','REFUNDED']);
const permitted = Object.freeze({
 REQUESTED: {SERVER_CHECKOUT_CREATED:'PROVIDER_PENDING'},
 PROVIDER_PENDING: {SERVER_PROVIDER_RECEIPT_VERIFIED:'PROVIDER_VERIFIED'},
 PROVIDER_VERIFIED: {SERVER_ATOMIC_GRANT_COMMITTED:'LEDGER_CREDITED'},
 LEDGER_CREDITED: {CLIENT_ACKNOWLEDGED:'CLIENT_ACKNOWLEDGED',SERVER_REFUND_CONFIRMED:'REFUNDED'},
 CLIENT_ACKNOWLEDGED: {SERVER_REFUND_CONFIRMED:'REFUNDED'},
 REFUNDED: {}
});
function cleanString(v, name) {
 if (typeof v !== 'string' || !/^[a-zA-Z0-9_-]{4,96}$/.test(v)) throw new Error('Invalid '+name);
 return v;
}
function startSimulationOrder({orderId,userId,sku,idempotencyKey}) {
 if(!orderId?.startsWith('qa_') || !userId?.startsWith('qa_'))throw new Error('Test-only order and user IDs required');
 return Object.freeze({
  environment:TEST_ENV,
  orderId:cleanString(orderId,'orderId'),userId:cleanString(userId,'userId'),
  sku:cleanString(sku,'sku'),idempotencyKey:cleanString(idempotencyKey,'idempotencyKey'),
  status:'REQUESTED',providerTransactionId:null,
  acknowledged:false,credited:false,refunded:false,
  appliedEventFingerprints:{},history:[]
 });
}
function transitionTestOrder(order,event) {
 if(!order||order.environment!==TEST_ENV||!steps.includes(order.status))
  throw new Error('M01 model rejects all live orders');
 if(!event || typeof event !=='object'||Array.isArray(event))throw new Error('Malformed event');
 const id=cleanString(event.eventId,'eventId'),type=cleanString(event.type,'type');
 const fingerprint=JSON.stringify({type,orderId:event.orderId,providerTransactionId:event.providerTransactionId||null});
 if(event.orderId!==order.orderId)throw new Error('Order ownership mismatch');
 if(Object.prototype.hasOwnProperty.call(order.appliedEventFingerprints,id)){
  if(order.appliedEventFingerprints[id]!==fingerprint)throw new Error('Conflicting event ID reuse');
  return {order,applied:false,duplicate:true};
 }
 const next=permitted[order.status]?.[type];
 if(!next)throw new Error('Disallowed transition '+order.status+' -> '+type);
 // This is a DOCUMENTED SIMULATION GATE, not a real proof of provider payment.
 if(type==='SERVER_PROVIDER_RECEIPT_VERIFIED'){
  if(event.origin!=='QA_SIMULATED_SERVER_VERIFIER'||event.simulatedVerification!==true)
   throw new Error('Missing simulated verifier event');
  cleanString(event.providerTransactionId,'providerTransactionId');
  if(order.providerTransactionId&&event.providerTransactionId!==order.providerTransactionId)
   throw new Error('Provider transaction conflict');
 }
 if(type==='SERVER_ATOMIC_GRANT_COMMITTED' && !order.providerTransactionId)
  throw new Error('Cannot credit without verified provider reference');
 if(type==='SERVER_REFUND_CONFIRMED' &&
  (event.providerTransactionId!==order.providerTransactionId||!order.credited))
  throw new Error('Refund must refer to a credited transaction');
 if(type==='SERVER_CHECKOUT_CREATED' && event.origin!=='QA_SIMULATED_PROVIDER')
  throw new Error('Client return is not checkout authorization');
 const updated={...order,
  status:next,
  providerTransactionId:type==='SERVER_PROVIDER_RECEIPT_VERIFIED'?event.providerTransactionId:order.providerTransactionId,
  credited:order.credited||type==='SERVER_ATOMIC_GRANT_COMMITTED',
  acknowledged:order.acknowledged||type==='CLIENT_ACKNOWLEDGED',
  refunded:order.refunded||type==='SERVER_REFUND_CONFIRMED',
  appliedEventFingerprints:{...order.appliedEventFingerprints,[id]:fingerprint},
  history:[...order.history,{eventId:id,type,from:order.status,to:next}]
 };
 return {order:Object.freeze(updated),applied:true,duplicate:false};
}
function summarizeSimulation(order) {
 if(!order||order.environment!==TEST_ENV)throw new Error('Not a QA simulation');
 return {orderId:order.orderId,stage:order.status,credited:order.credited,refunded:order.refunded,
  safeToGrantRealMoney:false,realProviderVerified:false,clientMayAssumePaid:false};
}
module.exports={TEST_ENV,steps,permitted,startSimulationOrder,transitionTestOrder,summarizeSimulation};
