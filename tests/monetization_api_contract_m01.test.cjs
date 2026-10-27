'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {QA_ONLY,createContractLedger}=require('../monetization/contracts/qa_ledger.cjs');
const contract=require('../monetization/contracts/payment_api_contract.openapi.json');
const make=()=>createContractLedger();
const order=(id='qa_order_001',accountId='qa_user_001',sku='mutation_crystal_small')=>({orderId:id,accountId,sku});
const paid=(id='qa_order_001',tx='qa_provider_001',eventId='qa_evt_001')=>({eventId,providerTransactionId:tx,orderId:id,origin:'QA_SIMULATED_VERIFIED_PROVIDER'});
const refunded=(id='qa_order_001',tx='qa_provider_001',eventId='qa_rfd_001')=>({eventId,providerTransactionId:tx,orderId:id,origin:'QA_SIMULATED_REFUND_PROVIDER'});
test('M01 ledger fixture cannot be mistaken for a production merchant or actual account authentication',()=>{
 const l=make();assert.equal(l.environment,QA_ONLY);assert.equal(l.providerVerified,false);
 assert.equal(l.catalogPurchasable,false);
 assert.deepEqual(l.restoreQaAccount('qa_user_001'),{balance:0,debt:0,entitlements:[],
  environment:QA_ONLY,realPurchases:0,actualAccountAuthentication:false});
});
test('M01 mock provider event grants backend-fixed units; no client supplied amounts',()=>{
 const l=make();l.registerTestOrder(order());
 assert.throws(()=>l.claimSimulatedReceipt({...paid(),units:1000000}));
 assert.throws(()=>l.claimSimulatedReceipt({...paid(),origin:'CLIENT_RETURN',paid:true}));
 const r=l.claimSimulatedReceipt(paid());assert.equal(r.credited,true);
 assert.equal(l.restoreQaAccount('qa_user_001').balance,20);
});
test('M01 duplicate webhook and same provider transaction never double-credit',()=>{
 const l=make();l.registerTestOrder(order());
 assert.equal(l.claimSimulatedReceipt(paid()).credited,true);
 assert.equal(l.claimSimulatedReceipt(paid()).duplicate,true);
 assert.equal(l.restoreQaAccount('qa_user_001').balance,20);
 l.registerTestOrder(order('qa_order_002','qa_user_002','mutation_crystal_mid'));
 assert.throws(()=>l.claimSimulatedReceipt(paid('qa_order_002','qa_provider_001','qa_evt_002')));
 assert.equal(l.restoreQaAccount('qa_user_002').balance,0);
});
test('M01 same order ID cannot change owner/SKU, and conflicting event ID is refused',()=>{
 const l=make();l.registerTestOrder(order());
 assert.equal(l.registerTestOrder(order()).duplicate,true);
 assert.throws(()=>l.registerTestOrder(order('qa_order_001','qa_user_002')));
 l.claimSimulatedReceipt(paid());
 assert.throws(()=>l.claimSimulatedReceipt(paid('qa_order_001','qa_provider_002','qa_evt_001')));
});
test('M01 account-isolated purchase restore and spend budget',()=>{
 const l=make();l.registerTestOrder(order());l.claimSimulatedReceipt(paid());
 assert.equal(l.restoreQaAccount('qa_user_002').balance,0);
 assert.deepEqual(l.restoreQaAccount('qa_user_001').entitlements,[]);
 assert.equal(l.spendTestCrystals({accountId:'qa_user_001',spendKey:'qa_spend_001',units:5}).spent,true);
 assert.equal(l.spendTestCrystals({accountId:'qa_user_001',spendKey:'qa_spend_001',units:5}).duplicate,true);
 assert.equal(l.restoreQaAccount('qa_user_001').balance,15);
 assert.throws(()=>l.spendTestCrystals({accountId:'qa_user_001',spendKey:'qa_spend_001',units:6}));
 assert.throws(()=>l.spendTestCrystals({accountId:'qa_user_001',spendKey:'qa_spend_002',units:25}));
});
test('M01 refunds after spend never create a negative balance; debt tracked separately',()=>{
 const l=make();l.registerTestOrder(order());l.claimSimulatedReceipt(paid());
 l.spendTestCrystals({accountId:'qa_user_001',spendKey:'qa_spend_001',units:18});
 const r=l.refundSimulatedProvider(refunded());
 assert.equal(r.refunded,true);assert.equal(r.balance,0);assert.equal(r.debt,18);
 assert.throws(()=>l.spendTestCrystals({accountId:'qa_user_001',spendKey:'qa_spend_002',units:1}));
 l.registerTestOrder(order('qa_order_002','qa_user_001','mutation_crystal_mid'));
 l.claimSimulatedReceipt(paid('qa_order_002','qa_provider_002','qa_evt_002'));
 const state=l.restoreQaAccount('qa_user_001');
 assert.equal(state.debt,0);assert.equal(state.balance,32);
});
test('M01 refund requires correct provider ref and trusted QA origin; duplicate safe',()=>{
 const l=make();l.registerTestOrder(order());
 assert.throws(()=>l.refundSimulatedProvider(refunded()));
 l.claimSimulatedReceipt(paid());
 assert.throws(()=>l.refundSimulatedProvider({...refunded(),origin:'CLIENT'}));
 assert.throws(()=>l.refundSimulatedProvider({...refunded(),providerTransactionId:'qa_bad_tx'}));
 assert.equal(l.refundSimulatedProvider(refunded()).refunded,true);
 assert.equal(l.refundSimulatedProvider(refunded()).duplicate,true);
 assert.throws(()=>l.refundSimulatedProvider({...refunded(),eventId:'qa_rfd_002'}));
});
test('M01 mock non-consumable purchase is once/account, restored and refund-revoked',()=>{
 const l=make();
 l.registerTestOrder(order('qa_cosm_001','qa_user_001','appearance_unlock_01'));
 l.claimSimulatedReceipt(paid('qa_cosm_001','qa_provider_cosm1','qa_evt_cosm1'));
 assert.deepEqual(l.restoreQaAccount('qa_user_001').entitlements,['qa_core_theme']);
 l.registerTestOrder(order('qa_cosm_002','qa_user_001','appearance_unlock_01'));
 assert.throws(()=>l.claimSimulatedReceipt(paid('qa_cosm_002','qa_provider_cosm2','qa_evt_cosm2')));
 l.refundSimulatedProvider(refunded('qa_cosm_001','qa_provider_cosm1','qa_rfd_cosm1'));
 assert.deepEqual(l.restoreQaAccount('qa_user_001').entitlements,[]);
});
test('M01 local DNA cannot create a premium entitlement or premium balance',()=>{
 const l=make();assert.throws(()=>l.convertLocalDnaToPremium({dna:999999999}));
 assert.deepEqual(l.restoreQaAccount('qa_user_001').entitlements,[]);
 assert.equal(l.restoreQaAccount('qa_user_001').balance,0);
});
test('M01 API contract is documentation-only, all six routes require server trust',()=>{
 assert.equal(contract.openapi,'3.1.0');
 assert.equal(contract['x-m01-environment'],'CONTRACT_ONLY');
 assert.equal(contract['x-revenue-enabled'],false);
 assert.equal(contract.servers[0].url.endsWith('.invalid'),true);
 assert.equal(Object.keys(contract.paths).length,6);
 for(const [p,verbs] of Object.entries(contract.paths))for(const method of Object.values(verbs)){
  assert.equal(method['x-m01-availability'],'SPEC_ONLY',p);
  assert.ok(method.responses['503'],p);
 }
});
test('M01 API checkout never accepts client payment success/price/amount fields',()=>{
 const schema=contract.components.schemas.CheckoutRequest;
 assert.deepEqual(schema.required,['sku','idempotencyKey']);assert.equal(schema.additionalProperties,false);
 assert.equal(Object.hasOwn(schema.properties,'price'),false);
 assert.equal(Object.hasOwn(schema.properties,'amount'),false);
 assert.equal(Object.hasOwn(schema.properties,'paid'),false);
 const endpoint=contract.paths['/v1/checkout/sessions'].post;
 assert.deepEqual(endpoint.security,[{userAuth:[]}]);
});
test('M01 signed webhook is separately authorized from authenticated wallet GET',()=>{
 const webhook=contract.paths['/v1/webhooks/{provider}'].post;
 assert.deepEqual(webhook.security,[{providerWebhookProof:[]}]);
 const wallet=contract.paths['/v1/me/wallet'].get;
 assert.deepEqual(wallet.security,[{userAuth:[]}]);
 assert.equal(contract.components.schemas.AccountWallet.properties.premiumCrystalBalance.minimum,0);
});
test('M01 account restoration requires auth and provider revalidation, not local save',()=>{
 const restore=contract.paths['/v1/purchases/restore'].post;
 assert.deepEqual(restore.security,[{userAuth:[]}]);
 assert.match(restore.description,/re-query provider/);
 assert.equal(contract.components.schemas.RestoreRequest.additionalProperties,false);
});
test('M01 unapproved ads stay disabled and require provider proof',()=>{
 const route=contract.paths['/v1/ads/rewards/confirm'].post;
 assert.equal(route['x-m01-availability'],'SPEC_ONLY');
 assert.deepEqual(route.security,[{providerWebhookProof:[]}]);
});
