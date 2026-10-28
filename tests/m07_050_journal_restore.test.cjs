'use strict';
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const {createTestJournalSession,restoreTestJournal,mode,version,maxBytes}=require('../monetization/m07/mission-journal-050.cjs');
const catalog=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'../monetization/catalog/draft_skus.json'),'utf8'));
const opts={accountId:'account_test_001',freeCycleId:'free_20261028',freeStartUtc:'2026-10-28T00:00:00.000Z',freeDays:28,paidMonth:'2026-10'};
const mission1='m07_daily_first_run',mission2='m07_daily_stage_activity',mission3='m07_weekly_codex_discovery';
const types={[mission1]:'RUN_COMPLETED_VERIFIED',[mission2]:'STAGE_ACTIVITY_VERIFIED',[mission3]:'CODEX_DISCOVERY_VERIFIED'};
const t1='2026-10-28T00:00:00.000Z',t2='2026-10-29T00:00:00.000Z',t3='2026-11-02T00:00:00.000Z',expired='2026-11-25T00:00:00.000Z';
const ev=(missionId,eventId,eventUtc,changes={})=>({accountId:opts.accountId,freeCycleId:opts.freeCycleId,missionId,eventType:types[missionId],eventId,eventUtc,...changes});
function assertNoGrant(session){
 assert.equal(session.mode,'TEST_ONLY_NO_AUTHORITY');
 assert.equal(session.claimReward().ok,false);
 assert.equal(session.claimReward().grant,0);
 assert.equal(session.purchasePass().entitlementGranted,false);
 assert.equal(session.purchasePass().charge,0);
 const snap=session.snapshot(t2);
 assert.equal(snap.realRewardsGranted,0);
 assert.equal(snap.checkoutEnabled,false);
 assert.equal(snap.clientGrantsEnabled,false);
 assert.equal(snap.paidState,'DRAFT_DISABLED');
 assert.equal(snap.missions.every(m=>m.claimable===false&&m.claimed===false),true);
}
function corrupt(json,change){const data=JSON.parse(json);change(data);return JSON.stringify(data);}
function rehash(json,change){
 const data=JSON.parse(json);change(data.payload);data.payload.revision=data.payload.acceptedTestEvents.length;
 data.sha256=crypto.createHash('sha256').update(JSON.stringify(data.payload)).digest('hex');
 return JSON.stringify(data);
}
assert.equal(mode,'TEST_ONLY_NO_AUTHORITY');
assert.equal(version,'EVOLVE_M07_TEST_JOURNAL_050_V1');
assert.equal(maxBytes,524288);
const s=createTestJournalSession(opts);
assertNoGrant(s);
assert.throws(()=>createTestJournalSession({...opts,extraprop:true}),/UNEXPECTED_FIELDS/);
assert.throws(()=>createTestJournalSession({...opts,freeDays:0}),/SEASON_DAYS_INVALID|BAD_FREE_DAYS/);
assert.equal(s.queueOfflinePreview(ev(mission1,'pending_001',t1)).reason,'PENDING_UNVERIFIED');
assert.equal(s.snapshot(t1).missions[0].previewCount,0);
assert.equal(s.snapshot(t1).pendingUnverified,1);
// Pending proof cannot become verified progress via export/restore.
const emptyCheckpoint=s.exportTestJournal();
const clean=restoreTestJournal(emptyCheckpoint);
assert.equal(clean.snapshot(t1).pendingUnverified,0);
assert.equal(clean.snapshot(t1).simulatedAcceptedEvents,0);
assert.equal(clean.snapshot(t1).missions[0].previewCount,0);
assertNoGrant(clean);
// The only mutator is an explicitly named test simulator, never client claims.
assert.equal(s.simulateTestEvent(ev(mission1,'event_first_001',t1)).accepted,true);
assert.equal(s.simulateTestEvent(ev(mission1,'event_first_001',t1)).reason,'DUPLICATE');
assert.equal(s.simulateTestEvent(ev(mission1,'event_other_001',t1)).reason,'PERIOD_CAP_REACHED');
assert.equal(s.simulateTestEvent(ev(mission2,'event_stage_001',t1)).accepted,true);
assert.equal(s.simulateTestEvent(ev(mission1,'event_first_002',t2)).accepted,true);
assert.equal(s.simulateTestEvent(ev(mission3,'event_week_001',t1)).accepted,true);
assert.equal(s.simulateTestEvent(ev(mission3,'event_week_dup',t2)).reason,'PERIOD_CAP_REACHED');
assert.equal(s.simulateTestEvent(ev(mission3,'event_week_002',t3)).accepted,true);
assert.throws(()=>s.simulateTestEvent(ev(mission2,'event_bad_cycle',t2,{freeCycleId:'free_wrong'})),/IDENTITY_MISMATCH/);

assert.throws(()=>s.simulateTestEvent(ev(mission1,'event_bad_type',t2,{eventType:'FAKE_TYPE'})),/EVENT_TYPE_INVALID/);
assert.throws(()=>s.simulateTestEvent(ev(mission1,'bad id!',t2)),/BAD_EVENT_ID/);
assert.throws(()=>s.simulateTestEvent({...ev(mission1,'event_extra',t2),verified:true}),/UNEXPECTED_FIELDS/);
assert.throws(()=>s.simulateTestEvent(ev(mission1,'event_bad_clock','2026-02-30T00:00:00.000Z')),/EVENT_TIME_INVALID/);
assert.equal(s.simulateTestEvent(ev(mission1,'event_before','2026-10-27T23:59:59.000Z')).reason,'OUTSIDE_FREE_PERIOD');
assert.equal(s.simulateTestEvent(ev(mission1,'event_after',expired)).reason,'OUTSIDE_FREE_PERIOD');
assertNoGrant(s);
const checkpoint=s.exportTestJournal();
const data=JSON.parse(checkpoint);
assert.equal(data.payload.revision,5);
assert.equal(data.payload.acceptedTestEvents.length,5);
assert.equal(data.payload.version,version);
assert.ok(/^[0-9a-f]{64}$/.test(data.sha256));
const replay=restoreTestJournal(checkpoint);
assert.equal(replay.exportTestJournal(),checkpoint);
assert.equal(replay.snapshot(t1).missions[0].previewCount,1);
assert.equal(replay.snapshot(t2).missions[0].previewCount,1);
assert.equal(replay.snapshot(t3).missions[2].previewCount,1);
assert.equal(replay.snapshot(t3).simulatedAcceptedEvents,5);
assert.equal(replay.snapshot(t2).pendingUnverified,0);
assert.equal(replay.simulateTestEvent(ev(mission1,'event_first_001',t1)).reason,'DUPLICATE');
assert.equal(replay.simulateTestEvent(ev(mission1,'event_other_001',t1)).reason,'PERIOD_CAP_REACHED');
assert.equal(replay.simulateTestEvent(ev(mission2,'event_stage_next',t2)).accepted,true);
assert.equal(s.snapshot(t2).simulatedAcceptedEvents,5); // no mutation of original by restored session
assert.equal(replay.snapshot(t2).simulatedAcceptedEvents,6);
assertNoGrant(replay);
const paidExpiry='2026-10-31T15:00:00.000Z';
assert.equal(replay.snapshot(new Date(Date.parse(paidExpiry)-1).toISOString()).paidActive,true);
assert.equal(replay.snapshot(paidExpiry).paidActive,false);
assert.equal(replay.snapshot(paidExpiry).freeActive,true);
assert.equal(replay.snapshot(expired).freeActive,false);
assert.equal(replay.snapshot(expired).realRewardsGranted,0);
// Fail closed: modified, damaged, stale, wrong identities or replays cannot hydrate.
assert.throws(()=>restoreTestJournal(checkpoint.slice(0,-3)),/JSON_INVALID/);
assert.throws(()=>restoreTestJournal('x'.repeat(maxBytes+1)),/SIZE_INVALID/);
assert.throws(()=>restoreTestJournal(corrupt(checkpoint,p=>p.payload.acceptedTestEvents[0].eventId='tamper_001')),/CHECKSUM_INVALID/);
assert.throws(()=>restoreTestJournal(corrupt(checkpoint,p=>p.payload.revision=10)),/BAD_REVISION/);
assert.throws(()=>restoreTestJournal(corrupt(checkpoint,p=>p.payload.version='V999')),/VERSION_UNSUPPORTED/);
assert.throws(()=>restoreTestJournal(corrupt(checkpoint,p=>p.payload.config.accountId='account_other')),/EVENT_IDENTITY_MISMATCH|CHECKSUM_INVALID/);
assert.throws(()=>restoreTestJournal(corrupt(checkpoint,p=>p.payload.untrustedGrant=900)),/UNEXPECTED_FIELDS/);
assert.throws(()=>restoreTestJournal(corrupt(checkpoint,p=>p.payload.acceptedTestEvents[0].premiumEntitlement=true)),/UNEXPECTED_FIELDS/);
assert.throws(()=>restoreTestJournal(corrupt(checkpoint,p=>p.payload.acceptedTestEvents[0].eventUtc='2026-02-30T00:00:00.000Z')),/EVENT_TIME_INVALID/);
assert.throws(()=>restoreTestJournal(rehash(checkpoint,p=>p.acceptedTestEvents.push({...p.acceptedTestEvents[0]}))),/JOURNAL_REPLAY_INVALID/);
assert.throws(()=>restoreTestJournal(rehash(checkpoint,p=>p.acceptedTestEvents.push({...p.acceptedTestEvents[0],eventId:'event_extra_same_day'}))),/JOURNAL_REPLAY_INVALID/);
assert.throws(()=>restoreTestJournal(rehash(checkpoint,p=>p.acceptedTestEvents[0].eventUtc=expired)),/JOURNAL_REPLAY_INVALID/);
assert.throws(()=>restoreTestJournal(rehash(checkpoint,p=>p.config.freeCycleId='free_changed')),/EVENT_IDENTITY_MISMATCH/);
assert.throws(()=>restoreTestJournal(rehash(checkpoint,p=>p.acceptedTestEvents[0].eventType='RUN_CLIENT_FORGED')),/EVENT_TYPE_INVALID/);
assert.equal(replay.exportTestJournal()!==checkpoint,true); // replay now has one extra valid fixture event
assert.equal(s.exportTestJournal(),checkpoint); // failed imports cannot mutate original
assert.equal(catalog.checkout_enabled,false);
assert.equal(catalog.client_grants_enabled,false);
assert.equal(catalog.products.find(x=>x.sku==='season_research_pass_01').status,'draft_disabled');
const eventAudit=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'../monetization/m07/event-source-audit-050.v1.json'),'utf8'));
assert.equal(eventAudit.progress_percent,50);
assert.equal(eventAudit.reviewed.length,6);
assert.ok(eventAudit.reviewed.every(f=>f.named_verified_event_symbols_found===0));
assert.equal(eventAudit.source_verification_ready,false);
assert.equal(eventAudit.real_reward_grants,0);
assert.equal(eventAudit.implementation_happened,false);
console.log('M07 50% PASS: 5 accepted TEST events replay; pending lost safely; tamper/stale/duplicate/period/identity rejection; 0 real claims or payments.');
