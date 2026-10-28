'use strict';
const assert=require('node:assert/strict');
const {createLocalSeasonHarness,missions,mode}=require('../monetization/m07/mission-harness-040.cjs');
const period=require('../monetization/m07/paid-month-calendar-v1.cjs');
const catalog=require('../monetization/catalog/draft_skus.json');
const base={accountId:'account_test_001',freeCycleId:'free_20261028',freeStartUtc:'2026-10-28T00:00:00.000Z',paidMonth:'2026-10'};
function harness(overrides={}){return createLocalSeasonHarness({...base,...overrides});}
function ev(missionId,eventId,eventUtc,changes={}){
 const match=missions.find(x=>x.id===missionId);
 return {accountId:base.accountId,freeCycleId:base.freeCycleId,missionId,eventType:match?.eventType??'UNKNOWN',eventId,eventUtc,...changes};
}
const daily='m07_daily_first_run',stage='m07_daily_stage_activity',weekly='m07_weekly_codex_discovery';
const DAY1='2026-10-28T00:00:00.000Z',DAY2='2026-10-29T00:00:00.000Z',DAY_END='2026-11-25T00:00:00.000Z';
assert.equal(mode,'ISOLATED_TEST_NO_GRANTS');
assert.equal(missions.length,3);
const h=harness();
assert.equal(h.mode,'LOCAL_TEST_ONLY');
const snap0=h.snapshot(DAY1);
assert.equal(snap0.freeActive,true);
assert.equal(snap0.paidActive,true);
assert.equal(snap0.paidState,'DRAFT_DISABLED');
assert.equal(snap0.checkoutEnabled,false);
assert.equal(snap0.clientGrantsEnabled,false);
assert.equal(snap0.realRewardsGranted,0);
assert.equal(snap0.paidEndExclusiveUtc,'2026-10-31T15:00:00.000Z');
assert.equal(snap0.freeEndExclusiveUtc,DAY_END);
assert.ok(Object.isFrozen(snap0));
assert.ok(Object.isFrozen(snap0.missions));
assert.ok(Object.isFrozen(snap0.missions[0]));
assert.equal(h.claimReward().grant,0);
assert.equal(h.claimReward().ok,false);
assert.equal(h.purchasePass().charge,0);
assert.equal(h.purchasePass().entitlementGranted,false);
assert.equal(catalog.checkout_enabled,false);
assert.equal(catalog.client_grants_enabled,false);
assert.equal(catalog.products.find(x=>x.sku==='season_research_pass_01').status,'draft_disabled');
// Only a pending marker (not progress or a reward) may be recorded for a client/offline event.
const early=ev(daily,'ev_first_1',DAY1);
assert.equal(h.previewUnverifiedEvent(early).reason,'PENDING_UNVERIFIED');
assert.equal(h.previewUnverifiedEvent(early).reason,'DUPLICATE');
assert.equal(h.snapshot(DAY1).missions[0].previewCount,0);
assert.equal(h.snapshot(DAY1).pendingUnverified,1);
assert.equal(h.claimReward().grant,0);
// Simulated acceptance is an explicit fixture: NEVER a valid purchase or server verification.
const first=h.simulateVerifiedEvent(early);
assert.equal(first.accepted,true);
assert.equal(first.reason,'SIMULATED_PROGRESS_NOT_A_GRANT');
assert.equal(first.award,0);
assert.equal(h.snapshot(DAY1).missions[0].previewCount,1);
assert.equal(h.snapshot(DAY1).missions[0].previewCompleted,true);
assert.equal(h.snapshot(DAY1).missions[0].claimable,false);
assert.equal(h.snapshot(DAY1).pendingUnverified,0);
assert.equal(h.simulateVerifiedEvent(early).reason,'DUPLICATE');
assert.equal(h.simulateVerifiedEvent(ev(daily,'ev_another_1',DAY1)).reason,'PERIOD_CAP_REACHED');
// distinct daily missions have separate per-day quotas.
assert.equal(h.simulateVerifiedEvent(ev(stage,'ev_stage_1',DAY1)).accepted,true);
assert.equal(h.snapshot(DAY1).missions[1].previewCount,1);
// New UTC day allows a fresh completion.
assert.equal(h.simulateVerifiedEvent(ev(daily,'ev_nextday',DAY2)).accepted,true);
assert.equal(h.snapshot(DAY2).missions[0].previewCount,1);
assert.equal(h.snapshot(DAY1).missions[0].previewCount,1);
assert.equal(h.snapshot(DAY2).missions[1].previewCount,0);
// The weekly mission completes once per UTC Monday period, not with every event.
assert.equal(h.simulateVerifiedEvent(ev(weekly,'ev_week_1',DAY1)).accepted,true);
assert.equal(h.simulateVerifiedEvent(ev(weekly,'ev_week_dup',DAY2)).reason,'PERIOD_CAP_REACHED');
assert.equal(h.simulateVerifiedEvent(ev(weekly,'ev_week_next','2026-11-02T00:00:00.000Z')).accepted,true);
// Any simulated event outside free period is refused, regardless of the paid pass month.
assert.equal(h.simulateVerifiedEvent(ev(stage,'ev_outside_early','2026-10-27T23:59:59.000Z')).reason,'OUTSIDE_FREE_PERIOD');
assert.equal(h.simulateVerifiedEvent(ev(stage,'ev_outside_late',DAY_END)).reason,'OUTSIDE_FREE_PERIOD');
assert.equal(h.previewUnverifiedEvent(ev(stage,'ev_outside_p',DAY_END)).reason,'OUTSIDE_FREE_PERIOD');
assert.equal(h.snapshot(DAY_END).freeActive,false);
// Important: when PAID October expires at KST Nov 1, free 28-day cycle remains active.
const crossover='2026-10-31T15:00:00.000Z';
const atBorder=h.snapshot(crossover);
assert.equal(atBorder.freeActive,true);
assert.equal(atBorder.paidActive,false);
assert.equal(atBorder.paidState,'DRAFT_DISABLED');
assert.equal(h.simulateVerifiedEvent(ev(stage,'ev_free_after_paid',crossover)).accepted,true);
// November paid month spans 30 full days; February 28/29 handled independently.
const nov=harness({paidMonth:'2026-11'});
assert.equal(nov.snapshot(crossover).paidActive,true);
assert.equal(nov.snapshot(DAY1).paidActive,false);
assert.equal(period.paidMonthWindow('2027-02').days,28);
assert.equal(period.paidMonthWindow('2028-02').days,29);
assert.equal(period.paidMonthWindow('2026-12').days,31);
// Security boundaries: reject mismatch without touching any previous progress.
const before=h.snapshot(DAY2);
assert.equal(h.simulateVerifiedEvent(ev(daily,'ev_wrong_account',DAY2,{accountId:'account_other'})).reason,'IDENTITY_MISMATCH');
assert.equal(h.simulateVerifiedEvent(ev(daily,'ev_wrong_cycle',DAY2,{freeCycleId:'free_wrong'})).reason,'IDENTITY_MISMATCH');
assert.equal(h.simulateVerifiedEvent(ev(daily,'ev_wrong_type',DAY2,{eventType:'FAKE_VERIFIED'})).reason,'UNRECOGNIZED_EVENT');
assert.equal(h.simulateVerifiedEvent(ev('no_such_mission','ev_wrong_mission',DAY2)).reason,'UNRECOGNIZED_EVENT');
assert.throws(()=>h.simulateVerifiedEvent(ev(daily,'ev_bad_time','2026-02-30T00:00:00.000Z')),/INVALID_TIMESTAMP/);
assert.throws(()=>h.simulateVerifiedEvent(ev(daily,'ev_bad_id!',DAY2)),/INVALID_IDENTIFIER/);
assert.throws(()=>h.simulateVerifiedEvent(ev(daily,'ev_untyped','2026-10-29')),/UTC_TIMESTAMP_REQUIRED/);
assert.throws(()=>h.snapshot('2026-10-29'),/UTC_TIMESTAMP_REQUIRED/);
assert.deepEqual(h.snapshot(DAY2).missions,before.missions);
assert.equal(h.snapshot(DAY2).realRewardsGranted,0);
// Millisecond rollover must be evaluated correctly in the demo, not crash.
assert.equal(h.simulateVerifiedEvent(ev(stage,'ev_ms_boundary','2026-11-24T23:59:59.999Z')).accepted,true);
assert.equal(h.simulateVerifiedEvent(ev(stage,'ev_ms_outside','2026-11-25T00:00:00.000Z')).reason,'OUTSIDE_FREE_PERIOD');
const isolation=harness();
assert.equal(isolation.snapshot(DAY1).simulatedAcceptedEvents,0);
assert.equal(isolation.snapshot(DAY1).pendingUnverified,0);
assert.equal(isolation.snapshot(DAY1).realRewardsGranted,0);
assert.equal(h.snapshot(DAY2).realRewardsGranted,0);
assert.equal(h.claimReward().ok,false);
assert.equal(h.purchasePass().entitlementGranted,false);
console.log('M07 40% PASS: test-only in-memory mission harness, duplicates/caps/calendar/mismatches, zero real grants.');
