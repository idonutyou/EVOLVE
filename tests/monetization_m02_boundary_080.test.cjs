'use strict';
// M02 80% boundary regression. DRAFT-only values cannot activate production checkout.
const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const gameCatalog = JSON.parse(readFileSync(join(__dirname,'../monetization/catalog/draft_skus.json'),'utf8'));
const {config, assertDraft, purchaseResearch} = require('../monetization/economy/economy-core.cjs');
const {simulatePlayer,hypotheticalCash} = require('../monetization/economy/scenario-model.cjs');
const {simulateCollection} = require('../monetization/economy/collection-model.cjs');

test('production candidate catalog remains 100% disabled and unpriced', () => {
  assert.equal(gameCatalog.environment,'DRAFT_ONLY');
  assert.equal(gameCatalog.price_source,'VERIFIED_PROVIDER_CATALOG_ONLY');
  for (const key of ['checkout_enabled','client_grants_enabled','merchant_connected','backend_ledger_connected']) {
    assert.equal(gameCatalog[key],false,key);
  }
  assert.equal(gameCatalog.products.length,5);
  for (const p of gameCatalog.products) {
    assert.equal(p.status,'draft_disabled');
    assert.equal(p.price_minor,null);
    assert.equal(p.premium_crystal_units,null);
    assert.equal(p.entitlement_id,null);
    assert.equal(p.content_state,'not_finalized');
  }
});

test('M02 simulated prices cannot be mistaken for validated M01 catalog prices', () => {
  assert.equal(assertDraft().mode,'SIMULATION_ONLY');
  const draftSkus=config.premium_draft.sku_candidates.map(x=>x.sku).sort();
  assert.deepEqual(draftSkus,gameCatalog.products.map(x=>x.sku).sort());
  for (const p of config.premium_draft.sku_candidates) {
    assert.ok(Number.isInteger(p.price_krw)&&p.price_krw>0);
    assert.equal(gameCatalog.products.find(x=>x.sku===p.sku).price_minor,null);
  }
});

test('premium draft cannot enable remote grants or a merchant', () => {
  for (const flag of ['checkout_enabled','client_grants_enabled','merchant_connected','backend_ledger_connected']) {
    assert.throws(()=>assertDraft({...config,[flag]:true}),/simulation-only/);
  }
});

test('simulated cosmetic purchase does not increase DNA research progression', () => {
  const f=simulatePlayer({days:7,minutesPerDay:20,starterPurchase:false});
  const p=simulatePlayer({days:7,minutesPerDay:20,starterPurchase:true});
  const a=f.daily.at(-1),b=p.daily.at(-1);
  assert.deepEqual([a.researchRanks,a.dna,a.clears,a.totalDna],
    [b.researchRanks,b.dna,b.clears,b.totalDna]);
  assert.equal(p.paidGrossKRW,2200);
  assert.equal(p.assumptions.starterPurchase,true);
});

test('negative balances, fraudulent confirmation fields and invalid refunds are rejected', () => {
  assert.throws(()=>purchaseResearch({id:'hp',rank:0,clears:0,dna:-1}),RangeError);
  assert.throws(()=>simulateCollection({paidBalance:900000}),/unsupported collection option/);
  assert.throws(()=>simulateCollection({purchasePlan:[{day:1,sku:'starter_genome_once',paymentConfirmed:true}]}),/unsupported planned purchase field/);
  assert.throws(()=>hypotheticalCash({sku:'starter_genome_once',count:1,refunds:2}),RangeError);
});

test('all simulated finance output explicitly excludes actual operating profit', () => {
  const x=hypotheticalCash({sku:'starter_genome_once',count:2,refunds:1});
  assert.equal(x.kind,'SIMULATION_ONLY');
  assert.equal(x.notOperatingProfit,true);
  assert.ok(x.remainingBeforeOtherCosts < x.gross);
});
