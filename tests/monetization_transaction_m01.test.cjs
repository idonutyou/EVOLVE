'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {TEST_ENV,steps,startSimulationOrder,transitionTestOrder,summarizeSimulation}=require('../monetization/contracts/transaction_fsm.cjs');
const initial=()=>startSimulationOrder({orderId:'qa_order_001',userId:'qa_user_001',sku:'starter_genome_once',idempotencyKey:'qa_idempotency_001'});
const ev=(type,id,extra={})=>({type,eventId:'qa_event_'+id,orderId:'qa_order_001',...extra});
const checkout=()=>ev('SERVER_CHECKOUT_CREATED','checkout',{origin:'QA_SIMULATED_PROVIDER'});
const verify=()=>ev('SERVER_PROVIDER_RECEIPT_VERIFIED','verify',{origin:'QA_SIMULATED_SERVER_VERIFIER',simulatedVerification:true,providerTransactionId:'qa_provider_tx_001'});
const credit=()=>ev('SERVER_ATOMIC_GRANT_COMMITTED','credit',{origin:'QA_SIMULATED_ATOMIC_LEDGER'});
const acknowledge=()=>ev('CLIENT_ACKNOWLEDGED','ack');
const refund=()=>ev('SERVER_REFUND_CONFIRMED','refund',{origin:'QA_SIMULATED_REFUND_VERIFIER',providerTransactionId:'qa_provider_tx_001'});
const next=(order,event)=>transitionTestOrder(order,event).order;
function paidState(){return next(next(next(initial(),checkout()),verify()),credit());}
test('M01 models requests and receipts only as QA contracts, not money',()=>{
 const t=initial();assert.equal(t.environment,TEST_ENV);assert.equal(t.status,'REQUESTED');
 assert.equal(summarizeSimulation(t).safeToGrantRealMoney,false);
 assert.equal(summarizeSimulation(t).clientMayAssumePaid,false);
 assert.ok(steps.includes('REFUNDED'));
});
test('M01 strict request → pending → verified → credited → acknowledged flow',()=>{
 let t=initial();for(const [event,status] of [[checkout(),'PROVIDER_PENDING'],[verify(),'PROVIDER_VERIFIED'],[credit(),'LEDGER_CREDITED'],[acknowledge(),'CLIENT_ACKNOWLEDGED']]){
 t=next(t,event);assert.equal(t.status,status);
 }
 assert.equal(t.history.length,4);assert.equal(t.credited,true);
 assert.equal(summarizeSimulation(t).realProviderVerified,false);
});
test('M01 rejects missing receipts and out-of-order or invented transitions',()=>{
 for(const evt of [verify(),credit(),acknowledge(),refund(),ev('CLIENT_RETURNED','client',{paid:true}),ev('SERVER_ATOMIC_GRANT_COMMITTED','direct')])
  assert.throws(()=>next(initial(),evt));
 const pending=next(initial(),checkout());
 assert.throws(()=>next(pending,credit()));
 assert.throws(()=>next(pending,ev('CLIENT_RETURNED','return',{paid:true})));
});
test('M01 requires simulated server authority tags for test-only verification/grant',()=>{
 const pending=next(initial(),checkout());
 for(const x of [ev('SERVER_PROVIDER_RECEIPT_VERIFIED','evil',{providerTransactionId:'qa_provider_tx_001',simulatedVerification:true}),
 ev('SERVER_PROVIDER_RECEIPT_VERIFIED','evil2',{origin:'QA_SIMULATED_SERVER_VERIFIER',simulatedVerification:false,providerTransactionId:'qa_provider_tx_001'})])
  assert.throws(()=>next(pending,x));
 const verified=next(pending,verify());
 assert.throws(()=>next(verified,ev('SERVER_ATOMIC_GRANT_COMMITTED','client',{origin:'CLIENT'})));
});
test('M01 duplicate identical webhook is idempotent, conflicting event id refused',()=>{
 const first=next(initial(),checkout());
 const after=transitionTestOrder(first,checkout());
 assert.equal(after.duplicate,true);assert.equal(after.applied,false);assert.equal(after.order,first);
 assert.throws(()=>next(first,ev('CLIENT_ACKNOWLEDGED','checkout')));
});
test('M01 one transaction cannot be credited twice',()=>{
 const credited=paidState();
 assert.equal(credited.history.filter(x=>x.type==='SERVER_ATOMIC_GRANT_COMMITTED').length,1);
 assert.equal(transitionTestOrder(credited,credit()).duplicate,true);
 assert.throws(()=>next(credited,ev('SERVER_ATOMIC_GRANT_COMMITTED','credit2',{origin:'QA_SIMULATED_ATOMIC_LEDGER'})));
});
test('M01 verified receipt can only bind to requested order and provider tx',()=>{
 const pending=next(initial(),checkout());
 assert.throws(()=>next(pending,{...verify(),orderId:'qa_other_order'}));
 assert.throws(()=>next(pending,{...verify(),providerTransactionId:'wrong token'}));
});
test('M01 refunds must match already credited simulated provider transaction',()=>{
 let t=paidState();
 assert.throws(()=>next(t,ev('SERVER_REFUND_CONFIRMED','forged',{origin:'CLIENT',providerTransactionId:'qa_provider_tx_001'})));
 assert.throws(()=>next(t,ev('SERVER_REFUND_CONFIRMED','other',{origin:'QA_SIMULATED_REFUND_VERIFIER',providerTransactionId:'qa_other_tx'})));
 t=next(t,refund());assert.equal(t.status,'REFUNDED');assert.equal(t.refunded,true);
 assert.equal(t.credited,true); // history, NOT permission to keep real entitlement
 assert.throws(()=>next(t,checkout()));
 assert.equal(transitionTestOrder(t,refund()).duplicate,true);
});
test('M01 live orders or invalid actor IDs are always rejected',()=>{
 assert.throws(()=>startSimulationOrder({orderId:'real_order_1',userId:'qa_user_001',sku:'sku_test',idempotencyKey:'qa_idempotency_001'}));
 assert.throws(()=>startSimulationOrder({orderId:'qa_order_1',userId:'real_user_001',sku:'sku_test',idempotencyKey:'qa_idempotency_001'}));
 assert.throws(()=>transitionTestOrder({...initial(),environment:'PRODUCTION'},checkout()));
});
test('M01 checkout must originate from simulated provider, not client UI return',()=>{
 assert.throws(()=>next(initial(),{...checkout(),origin:'CLIENT',paid:true}));
});
