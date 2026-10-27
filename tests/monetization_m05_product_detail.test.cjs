'use strict';
/* M05 STEP 1/3, 20% — data-contract and M04 mock engine compatibility only. */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const base=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(base,p),'utf8');
const d=JSON.parse(read('monetization/m05/product-detail-states.v1.json'));
const ux=JSON.parse(read(d.extends));
const catalog=JSON.parse(read('monetization/catalog/draft_skus.json'));
const engine=require('../web/mock-premium-v615.js');
function fixture(){
 const db=new Map(),storage={getItem:k=>db.has(k)?db.get(k):null,setItem:(k,v)=>db.set(k,v),removeItem:k=>db.delete(k)};
 const store=engine.createStore({storage,enabled:true});
 const profile='dev_local_profile_01';
 return {db,store,profile,read:()=>store.snapshot(profile),bytes:()=>db.get(engine.storageKey)};
}
test('20% is a design-only extension to M05 10% and preserves M04 site assets',()=>{
 assert.equal(d.stage,'M05');assert.equal(d.percent,20);assert.equal(d.step,'1/3');
 assert.equal(d.status,'DESIGN_CONTRACT_ONLY');assert.equal(d.implement_in_game,false);
 assert.equal(ux.percent,10);assert.equal(ux.status,'DESIGN_ONLY_NOT_IN_GAME');
 assert.equal(d.gates.owner_key,engine.storageKey);
 assert.equal(d.gates.legacy_prefix,'EVOLVE_V575_TEST_');
 assert.equal(d.gates.actual_checkout_enabled,false);
 assert.equal(d.gates.real_price,null);
 assert.equal(d.constraints.checkout_disabled,true);assert.equal(catalog.checkout_enabled,false);
 assert.equal(d.constraints.keep_original_nav_tabs,5);
 assert.equal(d.constraints.original_images_unchanged,true);
 assert.equal(d.constraints.gameplay_stats_unchanged,true);
 assert.equal(d.constraints.never_write_legacy_save,true);
 assert.equal(d.constraints.physical_device_tested,false);
});
test('exactly five actual draft SKUs, with truthful values and a locked season',()=>{
 const ids=d.products.map(x=>x.sku);
 assert.equal(new Set(ids).size,5);
 assert.deepEqual(ids.slice().sort(),catalog.products.map(x=>x.sku).sort());
 assert.deepEqual(ids.slice().sort(),engine.catalog().map(x=>x.sku).sort());
 assert.deepEqual(d.products.map(x=>x.grants?.dev_test_crystals??null),[75,100,300,0,null]);
 assert.equal(d.products[0].repeat,'once');assert.equal(d.products[3].repeat,'once');
 assert.equal(d.products[4].ready,false);assert.equal(d.products[4].grants,null);
 assert.equal(d.products[4].action_initial,'준비 중');
 assert.ok(d.products.every(x=>!x.description.includes('₩')));
 assert.ok(catalog.products.every(x=>x.price_minor===null&&x.status==='draft_disabled'));
});
test('two owned core themes: only the real M04 mock entitlement can be equipped',()=>{
 assert.deepEqual(d.cosmetic_collection.map(x=>x.entitlement),['dev_core_theme_01','dev_core_theme_02']);
 assert.equal(d.cosmetic_collection[1].test_price,120);
 assert.ok(d.cosmetic_collection.every(x=>x.equip_only_if_owned));
 const f=fixture();
 assert.throws(()=>f.store.equip(f.profile,'core','dev_core_theme_01'),{code:'MOCK_ENTITLEMENT_NOT_OWNED'});
 f.store.simulatePurchase('appearance_unlock_01',f.profile,'req_core_purchase_00001');
 assert.equal(f.read().owned.dev_core_theme_01,true);
 f.store.equip(f.profile,'core','dev_core_theme_01');
 assert.equal(f.read().equipped.core,'dev_core_theme_01');
 f.store.unequip(f.profile,'core');
 assert.equal(f.read().equipped.core,undefined);
});
test('test crystal 120 debit and purchase idempotency preserve balances and receipts',()=>{
 const f=fixture();
 f.store.simulatePurchase('mutation_crystal_small',f.profile,'req_test_small_000001');
 f.store.simulatePurchase('mutation_crystal_mid',f.profile,'req_test_middle_00001');
 assert.equal(f.read().testCrystals,400);
 const redeem=f.store.redeemCosmetic(f.profile,'dev_core_theme_02','req_test_redeem_00001');
 assert.equal(redeem.state.testCrystals,280);
 const replay=f.store.redeemCosmetic(f.profile,'dev_core_theme_02','req_test_redeem_00001');
 assert.equal(replay.replayed,true);
 assert.equal(f.read().testCrystals,280);
 assert.equal(d.confirmation.balance_after_formula,'snapshot.testCrystals - 120');
});
test('a preview or canceled confirmation must not mutate any stored bytes',()=>{
 const f=fixture();
 const baseline=f.bytes();
 assert.equal(baseline,undefined);
 assert.equal(d.transaction_states.find(x=>x.id==='CANCELLED').writes,false);
 assert.equal(d.transaction_states.find(x=>x.id==='CANCELLED').require_same_storage_bytes,true);
 assert.equal(d.gates.storage_on_cancel,'UNCHANGED_BYTES');
 assert.deepEqual(d.confirmation.explicit_buttons,['취소','확인']);
 assert.equal(f.bytes(),baseline);
});
test('action priority separates unavailable, owned, enabled and insufficient balance states',()=>{
 const byId=Object.fromEntries(d.action_matrix.map(x=>[x.id,x]));
 assert.equal(d.action_matrix.length,12);
 assert.equal(new Set(d.action_matrix.map(x=>x.id)).size,d.action_matrix.length);
 for(const id of ['DEV_MODE_OFF','NOT_AT_HOME','STORAGE_UNREADABLE','ACTION_PROCESSING','LOCKED_SEASON','ONCE_OWNED','REDEEM_INSUFFICIENT']){
  assert.equal(byId[id].enabled,false,id);
 }
 assert.equal(byId.CORE_OWNED.enabled,true);
 assert.equal(byId.CORE_EQUIPPED.button,'해제');
 assert.equal(byId.REDEEM_READY.mutation,'CONFIRM_THEN_DEBIT_120');
 assert.equal(byId.CONFIRM_PENDING.mutation,'ONLY_AFTER_CONFIRM');
});
test('errors distinguish locked, balance, corrupt storage and failed storage writes',()=>{
 const errors=d.error_copy;
 for(const code of ['MOCK_ALREADY_OWNED','MOCK_CONTENT_NOT_READY','MOCK_INSUFFICIENT_TEST_CRYSTALS','INVALID_MOCK_STORAGE','MOCK_STORAGE_UNAVAILABLE','MOCK_STORAGE_WRITE_FAILED','MOCK_ENTITLEMENT_NOT_OWNED','MOCK_IDEMPOTENCY_CONFLICT','MOCK_RECEIPT_LIMIT','MOCK_BALANCE_OVERFLOW','INVALID_MOCK_REQUEST_ID','UNKNOWN_MOCK_SKU','UNKNOWN_MOCK_REDEMPTION']){
  assert.ok(typeof errors[code]==='string'&&errors[code].length>8,code);
 }
 assert.match(errors.MOCK_STORAGE_WRITE_FAILED,/저장하지 못/);
 assert.match(errors.INVALID_MOCK_STORAGE,/자동 삭제하지 않아/);
 assert.equal(d.empty_states.storage_error.do_not_reset_automatically,true);
 const broken={getItem:()=>'{broken',setItem:()=>{throw Error('unexpected write')}};
 const shop=engine.createStore({enabled:true,storage:broken});
 assert.throws(()=>shop.snapshot('dev_local_profile_01'),{code:'INVALID_MOCK_STORAGE'});
});
test('detail screen is reachable without auto-purchase and has accessible 44px controls',()=>{
 assert.deepEqual(d.detail_template.primary_order.slice(0,3),['title','existing_character_preview_if_available','actual_dev_reward']);
 assert.equal(d.detail_template.no_auto_transaction,true);
 assert.equal(d.confirmation.no_real_money_disclaimer,'DEV MOCK · 실제 결제 없음');
 assert.equal(d.confirmation.never_recreate_idempotency_key_on_retry,true);
 assert.equal(d.confirmation.close_on_processing,false);
 assert.equal(d.accessibility.tap_target_min_px,44);
 assert.deepEqual(d.accessibility.viewport_sizes,[[320,568],[393,852]]);
 assert.equal(d.accessibility.focus_restore,true);
 assert.equal(d.accessibility.aria_disabled_for_locked,true);
 assert.equal(d.implement_in_game,false);
});
