'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const {getDraftCatalog, validateDraftCatalog, canBeginCheckout} = require('../monetization/catalog/catalog_guard.cjs');
const base = getDraftCatalog();
const clone = () => structuredClone(base);
test('M01 schema draft has five candidate SKUs and zero spendable prices', () => {
 assert.equal(base.products.length,5);
 assert.equal(new Set(base.products.map(x=>x.sku)).size,5);
 assert.equal(base.products.every(x=>x.price_minor===null&&x.premium_crystal_units===null),true);
 assert.equal(validateDraftCatalog(base).valid,true);
});
for(const k of ['checkout_enabled','client_grants_enabled','merchant_connected','backend_ledger_connected']) {
 test('M01 gate refuses enabling '+k,()=>{
  const x=clone();x[k]=true;assert.equal(validateDraftCatalog(x).valid,false);
  assert.equal(canBeginCheckout(x,'starter_genome_once').allowed,false);
 });
}
test('M01 checkout refuses known and unknown SKU',()=>{
 for(const sku of [...base.products.map(x=>x.sku),'bad','']) {
  const r=canBeginCheckout(base,sku);
  assert.equal(r.allowed,false);
  assert.match(r.reason,/PAYMENTS_NOT_CONNECTED|SKU_UNAVAILABLE/);
 }
});
test('M01 rejects local price tampering and invented currency quantities',()=>{
 for(const key of ['price_minor','premium_crystal_units','entitlement_id']) {
  const x=clone();x.products[0][key]=key==='entitlement_id'?'cosmetic_gold':2200;
  assert.equal(validateDraftCatalog(x).valid,false);
  assert.equal(canBeginCheckout(x,'starter_genome_once').allowed,false);
 }
});
test('M01 rejects undocumented live status, role, and checkout flags',()=>{
 for(const mutate of [
  x=>x.products[0].status='available',x=>x.environment='PRODUCTION',
  x=>x.price_source='CLIENT',x=>x.products[0].isFree=true,
  x=>x.products[0].purchase_type='unknown',x=>x.display_currency='USD',
  x=>x.products[0].content_state='approved']) {
  const x=clone();mutate(x);assert.equal(validateDraftCatalog(x).valid,false);
 }
});
test('M01 rejects duplicate SKU and invalid one-time rules',()=>{
 for(const mutate of [
  x=>x.products[1].sku=x.products[0].sku,
  x=>x.products[0].repeat_limit=null,
  x=>x.products[1].repeat_limit=1,
  x=>x.products[0].sku='../../server',
  x=>x.products[0].sku='',
  x=>x.products[0].title_ko=''
 ]) {
  const x=clone();mutate(x);assert.equal(validateDraftCatalog(x).valid,false);
 }
});
test('M01 schema explicitly disallows unknown keys',()=>{
 const schema=require('../monetization/catalog/draft_catalog.schema.json');
 assert.equal(schema.properties.checkout_enabled.const,false);
 assert.equal(schema.properties.client_grants_enabled.const,false);
 assert.equal(schema.properties.products.items.properties.status.const,'draft_disabled');
 assert.equal(schema.properties.products.items.properties.price_minor.type,'null');
 const x=clone();x.testOverride=true;assert.equal(validateDraftCatalog(x).valid,false);
});
test('M01 free DNA cannot be mistaken for paid mutation crystals',()=>{
 const localSave={dna:999999999};
 const x=clone();x.legacyDNA=localSave.dna;
 assert.equal(canBeginCheckout(x,'mutation_crystal_small').allowed,false);
 assert.equal(validateDraftCatalog(x).valid,false);
});
