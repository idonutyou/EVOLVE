'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createTestBatchGate}=require('../monetization/m07/mission-batch-gate-060.cjs');
const renderer=require('../monetization/m07/season-text-view-070.cjs');
const catalog=require('../monetization/catalog/draft_skus.json');
const options={accountId:'test_account_070',freeCycleId:'test_free_070',freeStartUtc:'2026-10-28T00:00:00.000Z',freeDays:28,paidMonth:'2026-10'};
const session=createTestBatchGate(options);
const at='2026-10-28T00:00:00.000Z';
const snapshot=session.snapshot(at);
assert.equal(renderer.mode,'READ_ONLY_TEST_PREVIEW');
const view=renderer.viewModel(snapshot);
assert.equal(view.kind,'ISOLATED_TEST_UI');
assert.equal(view.missions.length,3);
assert.equal(view.missions.every(m=>m.progress===0&&m.goal===1),true);
assert.equal(view.checkoutEnabled,false);
assert.equal(view.grantEnabled,false);
assert.equal(view.realRewardsGranted,0);
assert.match(view.paidDates,/2026년 10월 1일 00:00 ~ 2026년 10월 31일 23:59 \(KST\)/);
assert.match(view.freeDates,/2026-10-28T00:00:00\.000Z ~ 2026-11-25T00:00:00\.000Z/);
const section=renderer.renderSeasonSection(snapshot);
const html=renderer.renderStandaloneHtml(snapshot);
for(const text of ['연구 시즌','무료 연구 미션','월간 유료 연구 패스','판매 준비 중','구매 불가','보상: 서버 검증 전 수령 불가','TEST 전용 미리보기'])assert.ok(html.includes(text),text);
assert.ok(section.includes('data-preview-only="true"'));
assert.ok(html.includes('<html lang="ko">'));
assert.ok(html.includes('viewport-fit=cover'));
assert.ok(html.includes('prefers-reduced-motion:reduce'));
assert.equal((html.match(/<progress /g)||[]).length,3);
assert.ok(!/<(script|form|button|img|canvas|iframe)\b/i.test(html));
assert.ok(!/https?:\/\//i.test(html));
assert.ok(!/localStorage|fetch\s*\(|window\.|document\./.test(html));
assert.equal(renderer.htmlEscape('<script>"&\''),'&lt;script&gt;&quot;&amp;&#39;');
const e={accountId:options.accountId,freeCycleId:options.freeCycleId,missionId:'m07_daily_first_run',eventType:'RUN_COMPLETED_VERIFIED',eventId:'event_preview070',eventUtc:at};
assert.equal(session.tryBatch({requestId:'request_preview070',expectedRevision:0,events:[e]}).ok,true);
const second=session.snapshot(at);
const view2=renderer.viewModel(second);
assert.equal(view2.missions.find(m=>m.name==='일일 · 플레이 완료').progress,1);
assert.match(renderer.renderSeasonSection(second),/가상 완료 · 실제 보상 없음/);
assert.equal(session.claimReward().realGrants,0);
assert.equal(session.purchasePass().charged,0);
const border=session.snapshot('2026-10-31T15:00:00.000Z');
assert.equal(border.paidActive,false);
assert.equal(border.freeActive,true);
assert.match(renderer.renderSeasonSection(border),/월간 유료 연구 패스/);
assert.match(renderer.renderSeasonSection(border),/판매 준비 중/);
const futureMonths=[
 ['2026-11',30,'11월 30일'],
 ['2027-02',28,'2월 28일'],
 ['2028-02',29,'2월 29일'],
 ['2026-12',31,'12월 31일']
];
for(const [month,days,last] of futureMonths){
 const s=createTestBatchGate({...options,paidMonth:month});
 const t=s.snapshot('2026-10-28T00:00:00.000Z');
 const view=renderer.viewModel(t);
 assert.ok(view.paidDates.includes(last));
 assert.ok(renderer.renderStandaloneHtml(t).includes('판매 준비 중'));
}
function bad(change){
 const clone={...snapshot,missions:snapshot.missions.map(m=>({...m}))};
 change(clone);
 assert.throws(()=>renderer.renderStandaloneHtml(clone),/M07_PREVIEW_/);
}
bad(s=>s.mode='LIVE');
bad(s=>s.checkoutEnabled=true);
bad(s=>s.clientGrantsEnabled=true);
bad(s=>s.realRewardsGranted=1);
bad(s=>s.paidState='OWNED_ACTIVE_MONTH');
bad(s=>s.paidStartUtc='2026-10-01T00:00:00.000Z');
bad(s=>s.freeEndExclusiveUtc='2026-10-29T00:00:00.000Z');
bad(s=>s.missions[0].claimable=true);
bad(s=>s.missions[0].awardsGranted=1);
bad(s=>s.missions[0].previewCount=2);
bad(s=>s.missions[0].previewCompleted=true);
bad(s=>s.missions[2].missionId='__proto__');
bad(s=>s.missions=[s.missions[0]]);
assert.equal(catalog.products.find(p=>p.sku==='season_research_pass_01').status,'draft_disabled');
assert.equal(catalog.checkout_enabled,false);
assert.equal(catalog.client_grants_enabled,false);
const audit=JSON.parse(fs.readFileSync(path.join(__dirname,'../monetization/m07/event-source-audit-070.v1.json'),'utf8'));
assert.equal(audit.progress_percent,70);
assert.equal(audit.mapping_status,'BROWSER_LOCAL_ONLY_NO_SERVER_AUTHORITY');
assert.equal(audit.main_shop_guard.applies_to_existing_shop,false);
assert.equal(audit.main_shop_guard.native_shop_unchanged,true);
assert.equal(audit.main_shop_guard.challenge_tab_read_only_preview_later,true);
assert.equal(audit.real_server_verified_event_sources_found,0);
console.log('M07 70% PASS: Korean accessible text-only test preview, 3 missions, paid KST month/free 28d, deny grants and unsafe UI.');
