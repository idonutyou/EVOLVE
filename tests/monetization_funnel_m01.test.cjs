'use strict';
// M01 end-to-end CONTRACT-ONLY funnel. Simulates provider proof; no money is taken.
const test=require('node:test'),assert=require('node:assert/strict');
const {getDraftCatalog,canBeginCheckout}=require('../monetization/catalog/catalog_guard.cjs');
const {startSimulationOrder,transitionTestOrder,summarizeSimulation}=require('../monetization/contracts/transaction_fsm.cjs');
const {createContractLedger}=require('../monetization/contracts/qa_ledger.cjs');
const account='qa_acct_001',orderId='qa_order_001',tx='qa_provider_001',sku='mutation_crystal_small';
const orderArgs={orderId,userId:account,sku,idempotencyKey:'qa_key_001'};
const event=(type,eventId,extra={})=>({type,eventId,orderId,...extra});
test('M01 funnel: draft product selection MUST stop before actual payment',()=>{
 const catalog=getDraftCatalog();
 assert.equal(catalog.products.some(x=>x.sku===sku),true);
 const result=canBeginCheckout(catalog,sku);
 assert.deepEqual({allowed:result.allowed,reason:result.reason},{allowed:false,reason:'PAYMENTS_NOT_CONNECTED'});
 assert.equal(catalog.checkout_enabled,false);
});
test('M01 funnel: account-scoped simulated provider success follows each required phase, never proof of real payment',()=>{
 let state=startSimulationOrder(orderArgs),ledger=createContractLedger(),events=[];
 ledger.registerTestOrder({orderId,accountId:account,sku});
 const apply=e=>{state=transitionTestOrder(state,e).order;events.push(state.status);};
 apply(event('SERVER_CHECKOUT_CREATED','qa_e001',{origin:'QA_SIMULATED_PROVIDER'}));
 assert.equal(ledger.restoreQaAccount(account).balance,0);
 apply(event('SERVER_PROVIDER_RECEIPT_VERIFIED','qa_e002',{origin:'QA_SIMULATED_SERVER_VERIFIER',
  simulatedVerification:true,providerTransactionId:tx}));
 assert.equal(ledger.restoreQaAccount(account).balance,0); // mere verified state cannot auto-grant
 ledger.claimSimulatedReceipt({eventId:'qa_receipt_001',providerTransactionId:tx,orderId,origin:'QA_SIMULATED_VERIFIED_PROVIDER'});
 apply(event('SERVER_ATOMIC_GRANT_COMMITTED','qa_e003',{origin:'QA_SIMULATED_ATOMIC_LEDGER'}));
 assert.equal(ledger.restoreQaAccount(account).balance,20); // QA fixture only, no real price
 apply(event('CLIENT_ACKNOWLEDGED','qa_e004'));
 assert.deepEqual(events,['PROVIDER_PENDING','PROVIDER_VERIFIED','LEDGER_CREDITED','CLIENT_ACKNOWLEDGED']);
 const summary=summarizeSimulation(state);
 assert.equal(summary.realProviderVerified,false);assert.equal(summary.safeToGrantRealMoney,false);
 assert.equal(ledger.restoreQaAccount(account).realPurchases,0);
});
test('M01 funnel: user returning from a browser redirect is not a verified provider event',()=>{
 const l=createContractLedger();
 l.registerTestOrder({orderId,accountId:account,sku});
 assert.throws(()=>l.claimSimulatedReceipt({eventId:'qa_fake_001',providerTransactionId:tx,orderId,
  origin:'BROWSER_RETURN',success:true}));
 assert.equal(l.restoreQaAccount(account).balance,0);
});
test('M01 funnel: cancel/no verification leaves balance unchanged, even with 999999999 client DNA',()=>{
 const l=createContractLedger();
 l.registerTestOrder({orderId,accountId:account,sku});
 assert.equal(l.restoreQaAccount(account).balance,0);
 assert.throws(()=>l.convertLocalDnaToPremium({dna:999999999}));
 assert.equal(l.restoreQaAccount(account).balance,0);
});
test('M01 funnel: refund after spent QA units revokes available units and records explicit debt',()=>{
 const l=createContractLedger();
 l.registerTestOrder({orderId,accountId:account,sku});
 l.claimSimulatedReceipt({eventId:'qa_receipt_001',providerTransactionId:tx,orderId,origin:'QA_SIMULATED_VERIFIED_PROVIDER'});
 l.spendTestCrystals({accountId:account,spendKey:'qa_spend_001',units:17});
 assert.equal(l.restoreQaAccount(account).balance,3);
 l.refundSimulatedProvider({eventId:'qa_refund_001',providerTransactionId:tx,orderId,
  origin:'QA_SIMULATED_REFUND_PROVIDER'});
 const r=l.restoreQaAccount(account);assert.equal(r.balance,0);assert.equal(r.debt,17);
 assert.throws(()=>l.spendTestCrystals({accountId:account,spendKey:'qa_spend_002',units:1}));
});
test('M01 funnel: duplicate refunds and double-credit attempts cannot alter account balance',()=>{
 const l=createContractLedger();
 l.registerTestOrder({orderId,accountId:account,sku});
 const receipt={eventId:'qa_receipt_001',providerTransactionId:tx,orderId,origin:'QA_SIMULATED_VERIFIED_PROVIDER'};
 l.claimSimulatedReceipt(receipt);assert.equal(l.claimSimulatedReceipt(receipt).duplicate,true);
 const refund={eventId:'qa_refund_001',providerTransactionId:tx,orderId,origin:'QA_SIMULATED_REFUND_PROVIDER'};
 l.refundSimulatedProvider(refund);assert.equal(l.refundSimulatedProvider(refund).duplicate,true);
 assert.equal(l.restoreQaAccount(account).balance,0);
});
test('M01 funnel: two accounts cannot share provider transaction and have no leaked rights',()=>{
 const l=createContractLedger();
 l.registerTestOrder({orderId,accountId:account,sku});
 l.registerTestOrder({orderId:'qa_order_002',accountId:'qa_acct_002',sku});
 l.claimSimulatedReceipt({eventId:'qa_receipt_001',providerTransactionId:tx,orderId,
  origin:'QA_SIMULATED_VERIFIED_PROVIDER'});
 assert.throws(()=>l.claimSimulatedReceipt({eventId:'qa_receipt_002',
  providerTransactionId:tx,orderId:'qa_order_002',origin:'QA_SIMULATED_VERIFIED_PROVIDER'}));
 assert.equal(l.restoreQaAccount('qa_acct_002').balance,0);
});
test('M01 funnel: non-consumable appearance rights restore but do not unlock paid currency',()=>{
 const l=createContractLedger(),id='qa_cosmetic_001',providerId='qa_tx_cosmetic_001';
 l.registerTestOrder({orderId:id,accountId:account,sku:'appearance_unlock_01'});
 l.claimSimulatedReceipt({eventId:'qa_ev_cosmetic_001',providerTransactionId:providerId,
  orderId:id,origin:'QA_SIMULATED_VERIFIED_PROVIDER'});
 assert.equal(l.restoreQaAccount(account).balance,0);
 assert.deepEqual(l.restoreQaAccount(account).entitlements,['qa_core_theme']);
});
test('M01 funnel: all draft products remain unpurchasable regardless of QA simulation success',()=>{
 const catalog=getDraftCatalog(),ledger=createContractLedger();
 ledger.registerTestOrder({orderId,accountId:account,sku});
 ledger.claimSimulatedReceipt({eventId:'qa_receipt_001',providerTransactionId:tx,orderId,
  origin:'QA_SIMULATED_VERIFIED_PROVIDER'});
 for(const p of catalog.products)assert.equal(canBeginCheckout(catalog,p.sku).allowed,false);
 assert.equal(ledger.catalogPurchasable,false);
});
test('M01 funnel: no AD promise because publisher SSV approval and backend is absent',()=>{
 const api=require('../monetization/contracts/payment_api_contract.openapi.json');
 assert.equal(api.paths['/v1/ads/rewards/confirm'].post['x-m01-availability'],'SPEC_ONLY');
 assert.equal(api['x-revenue-enabled'],false);
});
