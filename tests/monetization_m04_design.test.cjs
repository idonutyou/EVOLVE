'use strict';
// Design-time assertions only. Never connects to a payment provider.
const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const flow=JSON.parse(readFileSync(join(root,'monetization/m04/payment-flow.draft.json'),'utf8'));
const catalog=JSON.parse(readFileSync(join(root,'monetization/catalog/draft_skus.json'),'utf8'));
test('all M04 services and grants remain disabled',()=>{
 assert.equal(flow.environment,'DESIGN_ONLY');
 for(const name of ['checkout_enabled','merchant_approved','provider_sandbox_connected','secure_account_provider_connected','server_payouts_enabled','public_api_exposed'])assert.equal(flow[name],false);
 assert.equal(flow.response_on_unready.http_status,503);
});
test('existing five SKUs cannot sell or grant anything',()=>{
 assert.equal(catalog.products.length,5);
 for(const field of ['checkout_enabled','client_grants_enabled','merchant_connected','backend_ledger_connected'])assert.equal(catalog[field],false);
 for(const p of catalog.products){assert.equal(p.status,'draft_disabled');assert.equal(p.price_minor,null);assert.equal(p.premium_crystal_units,null);assert.equal(p.entitlement_id,null)}
});
test('no enabled checkout state transitions',()=>{
 const states=new Set(flow.states);
 for(const edge of flow.transitions_design_only){assert.ok(states.has(edge.from));assert.ok(states.has(edge.to));if(edge.from==='DRAFT_DISABLED')assert.equal(edge.enabled,false)}
});
test('fulfilment can start only from verified paid status',()=>{
 assert.deepEqual(flow.transitions_design_only.filter(t=>t.to==='FULFILLED').map(t=>t.from),['PAID_VERIFIED']);
 assert.equal(flow.order_contract.provider_api_confirmation_required,true);
 assert.equal(flow.order_contract.callback_success_never_confirms_payment,true);
});
test('virtual account awaiting deposit is not paid',()=>{
 assert.ok(flow.providers.toss_payments_web.status_not_paid.includes('WAITING_FOR_DEPOSIT'));
 assert.ok(flow.providers.portone_v2_web.status_not_paid.includes('VIRTUAL_ACCOUNT_ISSUED'));
});
test('server controls price, identity, merchant and credits',()=>{
 const ignored=new Set(flow.order_contract.fields_never_authoritative_from_client);
 for(const field of ['account_id','amount','price_minor','currency','premium_crystal_units','entitlement_id','paid','merchant_id'])assert.ok(ignored.has(field));
 for(const needed of ['provider-merchant-account-match','server-catalog-price-and-currency-match','provider-order-ID-linked-to-server-account','atomic-ledger-entitlement-operation'])assert.ok(flow.fulfilment_gates.includes(needed));
});
test('prevent duplicate payment and credit',()=>{
 for(const key of ['account_id:idempotency_key','provider:provider_transaction_id','provider:provider_event_id'])assert.ok(flow.order_contract.uniqueness.includes(key));
 assert.equal(flow.order_contract.hash_request_payload,true);
});
test('refund requires review, no client callback grants',()=>{
 assert.ok(flow.transitions_design_only.some(t=>t.from==='FULFILLED'&&t.to==='REFUND_REVIEW'));
 assert.equal(flow.providers.toss_payments_web.webhook_payment_status,'notify-and-requery-provider');
 assert.equal(flow.server_payouts_enabled,false);
});
