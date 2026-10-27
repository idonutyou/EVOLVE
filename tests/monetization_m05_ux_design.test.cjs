'use strict';
// M05 10% contract tests: design only, not a store implementation.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const d=JSON.parse(read('monetization/m05/store-inventory-ux.v1.json'));
const m=JSON.parse(read('monetization/catalog/draft_skus.json'));
const api=require('../web/mock-premium-v615.js');
const expectedTabs=['homeLabTab','homeSpecimenTab','homeBattleTabV522','memoryBtn','codexBtn'];

test('M05 starts as design-only at 10% with unchanged published M04 baseline',()=>{
 assert.equal(d.stage,'M05');assert.equal(d.percent,10);assert.equal(d.step,'1/3');
 assert.equal(d.status,'DESIGN_ONLY_NOT_IN_GAME');assert.equal(d.release.current_design_not_deployed,true);
 assert.equal(d.baseline.source_commit,'fbe3224a3bdd95020829228427ddc3b05ed41f9e');
 assert.equal(d.baseline.published_build,JSON.parse(read('dist/version.json')).build);
});
test('five existing home navigation tabs remain the only main tabs',()=>{
 assert.deepEqual(d.preservation.existing_five_home_tabs,expectedTabs);
 const html=read('dist/index.html');const nav=html.match(/<nav id="homeTabs"[\s\S]*?<\/nav>/);
 assert.ok(nav,'original navigation element missing');
 assert.equal((nav[0].match(/<button /g)||[]).length,5);
 for(const id of expectedTabs)assert.ok(nav[0].includes('id="'+id+'"'),id);
 assert.ok(html.includes('id="partsGridV523"')&&html.includes('id="partsSortV523"'));
 assert.equal(d.architecture.existing_equipment_jump.target,'homeSpecimenTab');
});
test('opt-in home-only entry and inventory layout cannot hijack combat',()=>{
 assert.equal(d.entry.required_query,'evolveMockShop=1');
 assert.deepEqual(d.entry.host_allowlist,['idonutyou.github.io','localhost','127.0.0.1']);
 assert.equal(d.entry.entry_button,'m04MockTriggerV616');
 assert.equal(d.entry.battle_access,'DENY');
 assert.equal(d.entry.open_only_when,'EVOLVE_WEB_GUARD.atHome() === true');
 const ids=d.architecture.sections.map(x=>x.id);
 assert.deepEqual(ids,['shop','collection','history']);
 assert.equal(d.architecture.sections[2].availability,'PLANNED_FOR_LATER_STEP');
});
test('five mock draft products retained; season locked and honest values',()=>{
 assert.equal(d.shop.cards.length,5);assert.equal(m.products.length,5);
 assert.deepEqual(d.shop.cards.map(x=>x.sku).sort(),m.products.map(x=>x.sku).sort());
 assert.deepEqual(api.catalog().map(x=>x.sku).sort(),m.products.map(x=>x.sku).sort());
 assert.ok(d.shop.cards.every(x=>x.real_price===null));
 assert.ok(m.products.every(x=>x.status==='draft_disabled'&&x.price_minor===null));
 const pass=d.shop.cards.find(x=>x.sku==='season_research_pass_01');
 assert.equal(pass.ready,false);assert.equal(pass.purchase_action,null);
 assert.equal(d.shop.no_false_scarcity,true);assert.equal(d.shop.no_auto_purchase,true);
});
test('two dev cosmetics only, owned before equip and no gameplay stat upgrade',()=>{
 assert.equal(d.collection.items.length,2);
 assert.deepEqual(d.collection.items.map(x=>x.entitlement),['dev_core_theme_01','dev_core_theme_02']);
 assert.equal(d.collection.items[1].test_price,120);
 assert.equal(d.collection.only_owned_can_equip,true);assert.equal(d.collection.no_combat_advantage,true);
 const st=api.createStore({enabled:true,storage:{getItem:()=>null,setItem:()=>{}}});
 assert.deepEqual(d.collection.items.map(x=>x.entitlement),st.cosmetics().map(x=>x.entitlement));
});
test('dev storage, legacy saves, old part inventory and original images isolated',()=>{
 assert.equal(d.preservation.mock_key,api.storageKey);
 assert.equal(d.preservation.legacy_prefix,'EVOLVE_V575_TEST_');
 assert.equal(d.preservation.separate_real_ledger,true);
 assert.equal(d.preservation.never_migrate_dev_entitlements,true);
 assert.equal(d.preservation.original_images_untouched,true);
 assert.equal(d.preservation.combat_stats_unchanged,true);
 assert.equal(d.preservation.automatic_reload,false);
});
test('purchase confirmation and non-destructive error handling are mandatory',()=>{
 const p=d.interaction;
 assert.deepEqual(p.confirmation_required_for,['simulatePurchase','redeemCosmetic']);
 assert.equal(p.cancel_must_not_change_bytes,true);
 assert.equal(p.failed_storage_never_grants,true);
 assert.equal(p.pending_request_id_reused_on_retry,true);
 assert.equal(p.read_only_on_corrupt_save,true);
 assert.equal(p.reset_requires_two_explicit_taps,true);
 assert.equal(p.preserve_legacy_saves,true);
});
test('accessibility, small-screen and payment gates are specified',()=>{
 assert.equal(d.usability.minimum_touch_target_px,44);
 assert.deepEqual(d.usability.mobile_viewports,[[320,568],[393,852]]);
 for(const k of ['safe_area','modal_internal_scroll','focus_first_element_on_open','restore_focus_on_close','esc_cancels_pending_before_closing','keyboard_focus_trap','accessible_status_role','no_auto_reload'])assert.equal(d.usability[k],true,k);
 assert.equal(d.release.actual_checkout_enabled,false);
 assert.equal(d.release.live_prices,false);
 assert.equal(d.release.billing_integration,'M08_FINAL_GAME_ONLY');
 assert.equal(m.checkout_enabled,false);assert.equal(m.client_grants_enabled,false);
 assert.equal(d.new_images_needed_for_this_milestone,false);
});
