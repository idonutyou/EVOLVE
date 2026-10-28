/* EVOLVE M07 40%: memory-only research-mission simulation.
 * No runtime hook, no network, browser storage, billing, or real rewards.
 * simulateVerifiedEvent() is a TEST FIXTURE, not proof or authority.
 */
'use strict';
const free=require('./utc-period-planner-v1.cjs');
const paid=require('./paid-month-calendar-v1.cjs');
const MISSIONS=Object.freeze([
  Object.freeze({id:'m07_daily_first_run',eventType:'RUN_COMPLETED_VERIFIED',cadence:'daily',goal:1}),
  Object.freeze({id:'m07_daily_stage_activity',eventType:'STAGE_ACTIVITY_VERIFIED',cadence:'daily',goal:1}),
  Object.freeze({id:'m07_weekly_codex_discovery',eventType:'CODEX_DISCOVERY_VERIFIED',cadence:'weekly',goal:1})
]);
const missionById=new Map(MISSIONS.map(m=>[m.id,m]));
function requireId(x){if(typeof x!=='string'||!/^[A-Za-z0-9_-]{3,72}$/.test(x))throw new TypeError('M07_INVALID_IDENTIFIER');return x;}
function requireTime(x){
 if(typeof x!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.\d{3}Z$/.test(x))throw new TypeError('M07_UTC_TIMESTAMP_REQUIRED');
 const t=Date.parse(x);if(!Number.isFinite(t)||new Date(t).toISOString()!==x)throw new RangeError('M07_INVALID_TIMESTAMP');
 return t;
}
function createLocalSeasonHarness(options){
 if(!options||typeof options!=='object')throw new TypeError('M07_OPTIONS_REQUIRED');
 const accountId=requireId(options.accountId),freeCycleId=requireId(options.freeCycleId);
 const start=free.seasonWindow(options.freeStartUtc,options.freeDays??28);
 const paidMonth=paid.paidMonthWindow(options.paidMonth);
 const accepted=new Set(),pending=new Set(),counts=new Map(),completions=new Set(),eventLog=[];
 const maxUnique=10000,maxPending=128;
 function belongs(period){return period!==null}
 function validEvent(input){
  if(!input||typeof input!=='object')throw new TypeError('M07_EVENT_REQUIRED');
  const eventId=requireId(input.eventId),missionId=requireId(input.missionId);
  if(input.accountId!==accountId||input.freeCycleId!==freeCycleId)return {error:'IDENTITY_MISMATCH'};
  const m=missionById.get(missionId);
  if(!m||input.eventType!==m.eventType)return {error:'UNRECOGNIZED_EVENT'};
  const ts=requireTime(input.eventUtc);
  const period=free.candidatePeriod(m.cadence,new Date(ts).toISOString(),start.startUtc,start.days);
  if(!belongs(period))return {error:'OUTSIDE_FREE_PERIOD'};
  return {eventId,missionId,m,period};
 }
 function previewUnverifiedEvent(input){
  const e=validEvent(input);if(e.error)return Object.freeze({accepted:false,reason:e.error,award:0});
  if(pending.size>=maxPending)return Object.freeze({accepted:false,reason:'PENDING_LIMIT',award:0});
  const k=free.eventDedupe({seasonId:freeCycleId,accountId,missionId:e.missionId,eventId:e.eventId});
  if(accepted.has(k)||pending.has(k))return Object.freeze({accepted:false,reason:'DUPLICATE',award:0});
  pending.add(k);
  return Object.freeze({accepted:false,reason:'PENDING_UNVERIFIED',award:0});
 }
 function simulateVerifiedEvent(input){
  const e=validEvent(input);if(e.error)return Object.freeze({accepted:false,reason:e.error,award:0});
  const k=free.eventDedupe({seasonId:freeCycleId,accountId,missionId:e.missionId,eventId:e.eventId});
  if(accepted.has(k))return Object.freeze({accepted:false,reason:'DUPLICATE',award:0});
  if(accepted.size>=maxUnique)return Object.freeze({accepted:false,reason:'EVENT_LIMIT',award:0});
  // Only this explicit test helper simulates a server acceptance.
  // No production 'verified' boolean, receipt, or entitlement is trusted.
  const completionKey=free.completionDedupe({seasonId:freeCycleId,accountId,missionId:e.missionId,periodKey:e.period});
  if(completions.has(completionKey))return Object.freeze({accepted:false,reason:'PERIOD_CAP_REACHED',award:0});
  const previous=counts.get(completionKey)||0;
  const current=Math.min(e.m.goal,previous+1);
  counts.set(completionKey,current);accepted.add(k);pending.delete(k);
  if(current===e.m.goal)completions.add(completionKey);
  eventLog.push({missionId:e.missionId,period:e.period,eventId:e.eventId});
  return Object.freeze({accepted:true,reason:'SIMULATED_PROGRESS_NOT_A_GRANT',period:e.period,previewCount:current,award:0});
 }
 function snapshot(atUtc){
  const ts=requireTime(atUtc);
  const paidActive=paid.isWithinPaidMonth(paidMonth.month,atUtc);
  const freeActive=ts>=Date.parse(start.startUtc)&&ts<Date.parse(start.endUtc);
  const missionProgress=MISSIONS.map(m=>{
    const key=freeActive?free.candidatePeriod(m.cadence,atUtc,start.startUtc,start.days):null;
    const id=key===null?null:free.completionDedupe({seasonId:freeCycleId,accountId,missionId:m.id,periodKey:key});
    return Object.freeze({missionId:m.id,periodKey:key,goal:m.goal,previewCount:id?(counts.get(id)||0):0,previewCompleted:id?completions.has(id):false,claimable:false,claimed:false,awardsGranted:0});
  });
  return Object.freeze({mode:'LOCAL_TEST_ONLY',accountId,freeCycleId,freeStartUtc:start.startUtc,freeEndExclusiveUtc:start.endUtc,freeActive,paidMonth:paidMonth.month,paidStartUtc:paidMonth.startUtc,paidEndExclusiveUtc:paidMonth.endExclusiveUtc,paidActive,paidState:'DRAFT_DISABLED',checkoutEnabled:false,clientGrantsEnabled:false,realRewardsGranted:0,pendingUnverified:pending.size,simulatedAcceptedEvents:eventLog.length,missions:Object.freeze(missionProgress)});
 }
 function claimReward(){return Object.freeze({ok:false,reason:'NO_SERVER_REWARD_LEDGER_OR_APPROVED_CONTENT',grant:0});}
 function purchasePass(){return Object.freeze({ok:false,reason:'M08_BILLING_DISABLED',charge:0,entitlementGranted:false});}
 return Object.freeze({mode:'LOCAL_TEST_ONLY',previewUnverifiedEvent,simulateVerifiedEvent,snapshot,claimReward,purchasePass});
}
module.exports=Object.freeze({createLocalSeasonHarness,missions:MISSIONS,mode:'ISOLATED_TEST_NO_GRANTS'});
