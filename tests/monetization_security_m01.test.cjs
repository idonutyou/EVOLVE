'use strict';
// M01 final audit guardrail. This does not provide cryptographic checkout security.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const repo=path.resolve(__dirname,'..');
const load=p=>fs.readFileSync(path.join(repo,p),'utf8');
const cat=require('../monetization/catalog/draft_skus.json');
const api=require('../monetization/contracts/payment_api_contract.openapi.json');
const {canBeginCheckout}=require('../monetization/catalog/catalog_guard.cjs');
test('M01 production purchase & advertisements are disabled at every draft-contract boundary',()=>{
 assert.equal(cat.environment,'DRAFT_ONLY');
 assert.equal(cat.checkout_enabled,false);
 assert.equal(cat.client_grants_enabled,false);
 assert.equal(cat.merchant_connected,false);
 assert.equal(cat.backend_ledger_connected,false);
 assert.equal(api['x-revenue-enabled'],false);
 assert.equal(api['x-merchant-connected'],false);
 assert.equal(api['x-m01-environment'],'CONTRACT_ONLY');
 assert.equal(api.servers[0].url,'https://api.evolve.invalid');
 for(const product of cat.products){
  assert.equal(product.status,'draft_disabled');
  assert.equal(product.price_minor,null);
  assert.equal(product.premium_crystal_units,null);
  assert.equal(product.entitlement_id,null);
  assert.equal(canBeginCheckout(cat,product.sku).allowed,false);
 }
});
test('M01 every API operation remains SPEC_ONLY with 503 fallback; no live routes silently enabled',()=>{
 for(const [route,methods] of Object.entries(api.paths)){
  for(const [verb,operation] of Object.entries(methods)){
   assert.equal(operation['x-m01-availability'],'SPEC_ONLY',route+' '+verb);
   assert.ok(Object.hasOwn(operation.responses,'503'),route+' '+verb);
   assert.ok(Array.isArray(operation.security)&&operation.security.length,route+' '+verb);
  }
 }
});
test('M01 simulated provider-origin strings are not accepted as production verification',()=>{
 const fsm=load('monetization/contracts/transaction_fsm.cjs');
 const ledger=load('monetization/contracts/qa_ledger.cjs');
 assert.match(fsm,/TEST_ENV = 'CONTRACT_TEST_ONLY'/);
 assert.match(ledger,/QA_ONLY = 'SIMULATED_LEDGER_ONLY'/);
 assert.match(fsm,/DO NOT deploy this as payment verification/i);
 assert.match(ledger,/M03 requires authenticated server API/i);
 assert.doesNotMatch(fsm,/stripe\.com\/v1|api\.toss\.im|api\.portone\.io/i);
 assert.doesNotMatch(ledger,/process\.env\.[A-Z]*(?:SECRET|API_KEY|PRIVATE_KEY)/);
});
test('M01 no commercial API secret material or hardcoded live payment endpoint shipped by new files',()=>{
 const files=[
 'monetization/catalog/draft_skus.json',
 'monetization/catalog/draft_catalog.schema.json',
 'monetization/catalog/catalog_guard.cjs',
 'monetization/contracts/transaction_fsm.cjs',
 'monetization/contracts/qa_ledger.cjs',
 'monetization/contracts/payment_api_contract.openapi.json'
 ];
 for(const name of files){
  const content=load(name);
  // Guard against recognizable live secret token formats, not an exhaustive credential scanner.
  assert.doesNotMatch(content,/sk_live_[a-zA-Z0-9]{12,}|rk_live_[a-zA-Z0-9]{12,}|whsec_[a-zA-Z0-9]{16,}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/);
 }
});
test('M01 future API needs server-based userAuth, not browser localStorage ownership',()=>{
 const api=JSON.parse(load('monetization/contracts/payment_api_contract.openapi.json'));
 assert.deepEqual(api.paths['/v1/checkout/sessions'].post.security,[{userAuth:[]}]);
 assert.deepEqual(api.paths['/v1/me/wallet'].get.security,[{userAuth:[]}]);
 assert.deepEqual(api.paths['/v1/me/entitlements'].get.security,[{userAuth:[]}]);
 assert.deepEqual(api.paths['/v1/webhooks/{provider}'].post.security,[{providerWebhookProof:[]}]);
 assert.equal(Object.hasOwn(api.components.schemas.CheckoutRequest.properties,'premiumCrystalBalance'),false);
});
test('M01 no real payment claim appears in durable docs status',()=>{
 const status=JSON.parse(load('docs/monetization/M01_IMPLEMENTATION_STATUS.json'));
 assert.equal(status.real_purchases_completed,0);
 assert.equal(status.revenue_realized,false);
 assert.equal(status.pages_deployed,false);
 assert.equal(status.game_dist_changed,false);
 assert.equal(status.merchant_account_provisioned,false);
 assert.equal(status.server_ledger_exists,false);
});
