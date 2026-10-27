'use strict';
// M04 mobile-store-only DESIGN assertions. Not a real store transaction.
const test=require('node:test'),assert=require('node:assert/strict');
const {readFileSync}=require('node:fs'),{join}=require('node:path');
const root=join(__dirname,'..');
const d=JSON.parse(readFileSync(join(root,'monetization/m04/payment-flow.draft.json'),'utf8'));
const cat=JSON.parse(readFileSync(join(root,'monetization/catalog/draft_skus.json'),'utf8'));
test('Google Play and Apple App Store are the only targets',()=>{
 assert.equal(d.release_target,'GOOGLE_PLAY_AND_APPLE_APP_STORE');
 assert.deepEqual(d.target_platforms,['android_google_play','ios_apple_app_store']);
 assert.equal(d.primary_exploration,'google_play_billing');
 assert.deepEqual(Object.keys(d.providers).sort(),['apple_storekit_2','google_play_billing']);
});
test('web is development and testing only, not a payment channel',()=>{
 assert.equal(d.web_role,'DEVELOPMENT_AND_TEST_ONLY_NO_PAYMENTS');
 assert.deepEqual(d.web_payment_provider_candidates,[]);
 assert.equal(d.native_bridge.must_not_treat_webview_payment_redirect_as_store_purchase,true);
});
test('M04 and existing M01 remain completely unpriced and disabled',()=>{
 assert.equal(d.environment,'MOBILE_STORES_DESIGN_ONLY');
 for(const f of ['checkout_enabled','merchant_approved','provider_sandbox_connected','secure_account_provider_connected','server_payouts_enabled','production_price_available','public_api_exposed'])assert.equal(d[f],false);
 for(const f of ['checkout_enabled','client_grants_enabled','merchant_connected','backend_ledger_connected'])assert.equal(cat[f],false);
 assert.equal(cat.products.length,5);
 for(const p of cat.products){assert.equal(p.status,'draft_disabled');assert.equal(p.price_minor,null);assert.equal(p.premium_crystal_units,null);assert.equal(p.entitlement_id,null)}
});
test('platform product mapping exists for each internal SKU',()=>{
 assert.deepEqual(Object.keys(d.product_type_mapping).sort(),cat.products.map(x=>x.sku).sort());
 assert.equal(d.product_type_mapping.mutation_crystal_small.apple_app_store,'consumable');
 assert.equal(d.product_type_mapping.appearance_unlock_01.apple_app_store,'non_consumable');
 assert.equal(d.product_type_mapping.season_research_pass_01.google_play,'UNDECIDED_PENDING_SEASON_POLICY');
 assert.equal(d.platform_product_ids_status,'UNASSIGNED');
});
test('Google Play token server verification, acknowledge and refund required',()=>{
 const google=d.providers.google_play_billing;
 assert.match(google.verification,/Google Play Developer API/);
 assert.equal(google.paid_status,'PURCHASED');assert.equal(google.pending_status,'PENDING');
 assert.match(google.purchase_ack_or_consume,/acknowledge/);
 assert.match(google.refund,/Void\/Refund/);
});
test('Apple StoreKit2 JWS transaction and server notifications required',()=>{
 const apple=d.providers.apple_storekit_2;
 assert.match(apple.verification,/App Store Server API/);
 assert.match(apple.notifications,/Notifications V2/);
 assert.match(apple.purchase_proof,/JWS/);
 assert.equal(apple.non_expiry,'purchased in-app currency must not expire');
});
test('no rewards are issued for pending or unverifiable transactions',()=>{
 const x=d.transitions_design_only;
 assert.ok(x.filter(z=>z.from==='DRAFT_DISABLED').every(z=>z.enabled===false));
 assert.deepEqual(x.filter(z=>z.to==='FULFILLED').map(z=>z.from),['STORE_PURCHASE_VERIFIED']);
 assert.ok(!x.some(z=>['AWAITING_STORE','PENDING_STORE_APPROVAL'].includes(z.from)&&z.to==='FULFILLED'));
 assert.equal(d.order_contract.store_server_verification_required,true);
 assert.equal(d.order_contract.callback_success_never_confirms_payment,true);
});
test('backend guards platform transaction uniqueness, account and SKU',()=>{
 for(const k of ['platform:store_transaction_id_or_purchase_token','account_id:idempotency_key','platform:notification_id'])assert.ok(d.order_contract.uniqueness.includes(k));
 for(const k of ['store-app-identity-package-name-or-bundle-id-match','store-product-id-maps-to-internal-sku','store-environment-verified-test-vs-production','server-atomic-wallet-ledger-and-entitlement-source-grant'])assert.ok(d.fulfilment_gates.includes(k));
 assert.equal(d.order_contract.server_verified_account_id,true);
});
test('native release shell and products are not implemented at 30%',()=>{
 assert.equal(d.native_app_project_status,'NOT_CREATED');
 assert.equal(d.native_bridge.status,'DESIGN_ONLY');
 assert.equal(d.response_on_unready.http_status,503);
});
