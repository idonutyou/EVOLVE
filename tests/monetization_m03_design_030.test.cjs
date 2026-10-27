'use strict';
// M03 30% document contract tests ONLY: no live payments or DB.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const spec=JSON.parse(readFileSync(join(root,'docs/monetization/M03_030_LEDGER_API_DRAFT.openapi.json'),'utf8'));
const sql=readFileSync(join(root,'docs/monetization/M03_020_LEDGER_SCHEMA.sql'),'utf8');
const catalog=JSON.parse(readFileSync(join(root,'monetization/catalog/draft_skus.json'),'utf8'));
test('M03 spec only; no deployed provider',()=>{
 assert.equal(spec['x-m03-mode'],'SPEC_ONLY');
 assert.equal(spec['x-revenue-enabled'],false);
 assert.equal(spec['x-paid-grant-enabled'],false);
 assert.match(spec.servers[0].url,/\.invalid$/);
});
test('existing catalog stays disabled',()=>{
 assert.equal(catalog.environment,'DRAFT_ONLY');
 for(const k of ['checkout_enabled','client_grants_enabled','merchant_connected','backend_ledger_connected'])
  assert.equal(catalog[k],false);
 for(const p of catalog.products){assert.equal(p.status,'draft_disabled');assert.equal(p.price_minor,null);}
});
test('wallet, entitlements require auth',()=>{
 for(const path of ['/v1/me/wallet','/v1/me/entitlements']){
  assert.deepEqual(spec.paths[path].get.security,[{userAuth:[]}]);
  assert.ok(spec.paths[path].get.responses['401']);
 }
});
test('payment and reward paths explicitly disabled',()=>{
 for(const path of ['/v1/rewards/claims','/v1/checkout/sessions','/v1/purchases/verify','/v1/purchases/restore'])
  assert.ok(spec.paths[path].post.responses['503']);
});
test('catalog cannot advertise purchasable items',()=>{
 assert.equal(spec.components.schemas.CatalogDisabled.properties.checkoutEnabled.const,false);
 assert.equal(spec.components.schemas.CatalogDisabled.properties.products.items.properties.purchasable.const,false);
});
test('schema prevents negative wallet balances',()=>{
 assert.match(sql,/available_units >= 0/);assert.match(sql,/origin_bucket IN/);
});
test('ledger operations have user-scoped idempotency',()=>{
 assert.match(sql,/UNIQUE \(account_id,idempotency_key\)/);
});
test('ledger operations and entries immutable',()=>{
 assert.match(sql,/CREATE TRIGGER m03_operations_no_update_delete/);
 assert.match(sql,/CREATE TRIGGER m03_entries_no_update_delete/);
});
test('ledger entry owns same user as operation',()=>{
 assert.match(sql,/FOREIGN KEY \(operation_id,account_id\)/);
});
test('independent rights sources and refund cases retained',()=>{
 assert.match(sql,/CREATE TABLE m03_entitlement_sources/);
 assert.match(sql,/CREATE TABLE m03_refund_review_cases/);
 assert.match(sql,/UNIQUE \(account_id,entitlement_id,source_type,source_ref\)/);
});
