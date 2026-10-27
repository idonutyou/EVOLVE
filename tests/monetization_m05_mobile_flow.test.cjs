'use strict';
// M05 30% design freeze regression only: no graphical/mobile UI implemented here.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const flow=JSON.parse(read('monetization/m05/mobile-flow.v1.json'));
const ux=JSON.parse(read(flow.extends[0]));
const detail=JSON.parse(read(flow.extends[1]));
const product=JSON.parse(read('monetization/catalog/draft_skus.json'));
const mock=require('../web/mock-premium-v615.js');
const indexed=Object.fromEntries(flow.surfaces.map(x=>[x.id,x]));
const transition=(from,event)=>flow.transitions.find(x=>x.from===from&&x.event===event);

test('STEP 1/3 frozen at M05 30%, chained to immutable 10% and 20% designs',()=>{
 assert.equal(flow.stage,'M05');assert.equal(flow.percent,30);assert.equal(flow.step,'1/3');
 assert.equal(flow.status,'DESIGN_FROZEN_NOT_IMPLEMENTED');
 assert.equal(ux.percent,10);assert.equal(detail.percent,20);
 assert.equal(flow.baseline.checkpoint_20_sha,'c1713c838f7c2dd5301b4d41d315296acaa7d864');
 const active=JSON.parse(read('dist/version.json'));
 assert.ok(active.build===flow.baseline.published_build||(active.version.endsWith('-M05-UX40')&&active.assets===1079),'Only original M04 or reviewed M05 development build is allowed');
 assert.equal(flow.freeze.design_ready_for_step_2,true);
 assert.equal(flow.freeze.new_images_required_for_next_40_percent,false);
});
test('all screen surfaces are unique and no history/paid screen is invented',()=>{
 const ids=flow.surfaces.map(x=>x.id);
 assert.equal(new Set(ids).size,ids.length);
 for(const s of ['HOME','SHOP_LIST','PRODUCT_DETAIL','CORE_COLLECTION','CONFIRM','PROCESSING','RESULT','SAFE_ERROR','HISTORY_PLACEHOLDER'])assert.ok(indexed[s],s);
 assert.equal(indexed.HISTORY_PLACEHOLDER.enabled,false);
 assert.equal(flow.safety.history,'DEFERRED_AND_DISABLED');
 assert.equal(flow.safety.real_payment_provider,'ABSENT');
 assert.equal(flow.scope.images_generated,false);
});
test('product detail/collection flow has reversible transitions and safe request handling',()=>{
 assert.equal(transition('HOME','OPEN_DEV_SHOP').to,'SHOP_LIST');
 assert.equal(transition('SHOP_LIST','TAP_PRODUCT').to,'PRODUCT_DETAIL');
 assert.equal(transition('PRODUCT_DETAIL','TAP_BACK').to,'SHOP_LIST');
 assert.equal(transition('SHOP_LIST','TAP_COLLECTION').to,'CORE_COLLECTION');
 assert.equal(transition('CORE_COLLECTION','TAP_SHOP').to,'SHOP_LIST');
 assert.equal(transition('PRODUCT_DETAIL','TAP_BUY').to,'CONFIRM');
 assert.equal(transition('CONFIRM','CANCEL').to,'DETAIL_OR_COLLECTION');
 assert.equal(transition('CONFIRM','ACCEPT').to,'PROCESSING');
 assert.equal(transition('PROCESSING','SUCCESS').to,'RESULT');
 assert.equal(transition('PROCESSING','ESCAPE_OR_CLOSE').to,'PROCESSING');
 assert.equal(flow.safety.retry,'SAME_REQUEST_ID');
 assert.equal(flow.safety.cancel,'NO_STORAGE_BYTES_CHANGED');
 assert.equal(flow.safety.processing_tap,'IGNORE');
});
test('Escape priority puts processing block and confirmation cancellation first',()=>{
 assert.deepEqual(flow.back_priority,['PROCESSING_BLOCK','CONFIRM_CANCEL','DETAIL_TO_LIST','SECTION_TO_HOME','CLOSED_NOOP']);
 assert.equal(transition('CONFIRM','ESCAPE').to,'DETAIL_OR_COLLECTION');
 assert.equal(transition('PRODUCT_DETAIL','ESCAPE').to,'SHOP_LIST');
 assert.equal(transition('CORE_COLLECTION','ESCAPE_OR_CLOSE').to,'HOME');
 assert.equal(flow.accessibility.escape_cancel_first,true);
});
test('preserve actual original navigation and original ORGANISM equipment',()=>{
 const original=read('dist/index.html');
 const nav=original.match(/<nav id="homeTabs"[\s\S]*?<\/nav>/)?.[0];
 assert.ok(nav);
 assert.equal((nav.match(/<button /g)||[]).length,5);
 for(const id of ux.preservation.existing_five_home_tabs)assert.ok(nav.includes('id="'+id+'"'),id);
 assert.equal(flow.scope.keep_existing_home_tab_count,5);
 assert.equal(flow.scope.keep_existing_organism_equipment,true);
 assert.ok(original.includes('id="partsGridV523"')&&original.includes('id="partsSortV523"'));
});
test('safe scrolling restores position without new save keys or automatic reload',()=>{
 assert.match(flow.scroll.strategy,/internal scroll/);
 assert.match(flow.scroll.safe_area,/safe-area-inset/);
 assert.match(flow.scroll.list_restore,/not new localStorage/);
 assert.match(flow.scroll.detail_back,/restore selected product/);
 assert.match(flow.scroll.close,/do not force game reload/);
 assert.equal(flow.scope.mock_only_storage_key,mock.storageKey);
 assert.equal(flow.scope.legacy_save_prefix,'EVOLVE_V575_TEST_');
});
test('mobile sizes, orientation and at least 44 CSS pixel touch controls',()=>{
 assert.deepEqual(flow.mobile.viewports.map(x=>[x.width,x.height]),[[320,568],[393,852],[852,393]]);
 assert.ok(flow.mobile.minimum_touch_width_px>=44&&flow.mobile.minimum_touch_height_px>=44);
 assert.ok(flow.mobile.minimum_target_spacing_px>=8);
 assert.equal(flow.mobile.modal_max_width_css_px,440);
 assert.match(flow.mobile.narrow_320,/44/);
 assert.match(flow.mobile.landscape,/scroll/);
 assert.ok(flow.mobile.text.body_min_px>=12);
 assert.ok(flow.mobile.text.action_min_px>=13);
});
test('accessible focus management, cancel-first, disabled labels and live status',()=>{
 assert.equal(flow.accessibility.dialog_role,'dialog');assert.equal(flow.accessibility.aria_modal,true);
 assert.equal(flow.accessibility.focus_on_confirm,'cancel button');
 assert.equal(flow.accessibility.focus_return_on_close,'originating DEV trigger or prior home control');
 assert.equal(flow.accessibility.trap_tab,true);
 assert.deepEqual(flow.mobile.confirm.button_order,['취소','확인']);
 assert.equal(flow.mobile.confirm.first_focus,'취소');
 assert.equal(flow.accessibility.announcements.error,'role=alert aria-live=assertive');
 assert.equal(flow.accessibility.disabled_controls.reason_text_visible,true);
 assert.equal(flow.mobile.states.equipped.includes('aria-pressed'),true);
});
test('mock-only billing: five draft SKUs, locked season and no real money',()=>{
 assert.equal(detail.products.length,5);assert.equal(product.products.length,5);
 assert.deepEqual(detail.products.map(p=>p.sku).sort(),mock.catalog().map(p=>p.sku).sort());
 assert.ok(product.products.every(x=>x.status==='draft_disabled'&&x.price_minor===null));
 assert.equal(product.checkout_enabled,false);
 assert.equal(detail.products.at(-1).ready,false);
 assert.equal(flow.scope.real_checkout_enabled,false);
 assert.equal(flow.scope.season_pass_locked,true);
 assert.deepEqual(flow.scope.host_allowlist,ux.entry.host_allowlist);
 assert.equal(flow.scope.only_developer_query,'evolveMockShop=1');
});
test('error handling fails closed and preserves old game data',()=>{
 assert.equal(flow.safety.corrupt_save,'FAIL_CLOSED_NO_RESET');
 assert.equal(flow.safety.storage_write_failure,'NO_SUCCESS_MESSAGE');
 assert.equal(flow.safety.storage_unavailable,'DISABLE_GRANTS');
 assert.equal(flow.safety.mock_reset,'TWO_TAPS_ONLY');
 assert.equal(flow.safety.startup_without_flag,'MOCK_UI_ABSENT');
 assert.equal(flow.scope.home_only,true);
 assert.equal(flow.scope.changes_live_game,false);
 assert.equal(flow.scope.changes_dist,false);
 assert.deepEqual(flow.safety.never_write_keys,['EVOLVE_V575_TEST_*','M03_PAID_LEDGER_*']);
});
test('12 planned browser test cases cover mobile UX, persistence and combat isolation',()=>{
 const ids=flow.qa.map(x=>x.id);
 assert.equal(ids.length,12);assert.equal(new Set(ids).size,12);
 for(const id of ['NAV_5','SMALL','NORMAL','LANDSCAPE','CANCEL_BYTES','FLAG_OFF','COMBAT_BLOCK','PREVIEW','DEBIT_120','CORRUPT','KEYBOARD','LEGACY'])assert.ok(ids.includes(id),id);
 assert.ok(flow.qa.some(x=>x.viewport==='320x568'));
 assert.ok(flow.qa.some(x=>x.viewport==='393x852'));
});
test('next implementation is gated: isolated M05 module, no images or early main deploy',()=>{
 assert.equal(flow.freeze.design_ready_for_step_2,true);
 assert.equal(flow.freeze.do_not_merge_main_until_regression,true);
 assert.equal(flow.freeze.new_images_required_for_next_40_percent,false);
 assert.match(flow.freeze.next_40_percent,/isolated module/);
 for(const p of flow.freeze.required_files)assert.ok(fs.existsSync(path.join(root,p)),p);
});
