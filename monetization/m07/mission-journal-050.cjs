/* EVOLVE M07 50% — isolated deterministic TEST journal / replay.
 * Never use client data as server proof. SHA-256 below detects accidental
 * damage in test fixtures only; it is not a signature or entitlement authority.
 * No file IO, storage, real grants, purchases or game hooks.
 */
'use strict';
const crypto=require('node:crypto');
const {createLocalSeasonHarness,missions}=require('./mission-harness-040.cjs');
const VERSION='EVOLVE_M07_TEST_JOURNAL_050_V1';
const MAX_BYTES=512*1024,MAX_EVENTS=10000;
const IDS=/^[A-Za-z0-9_-]{3,72}$/;
const missionById=new Map(missions.map(m=>[m.id,m]));
const allowedConfig=['accountId','freeCycleId','freeStartUtc','freeDays','paidMonth'];
const eventFields=['accountId','freeCycleId','missionId','eventType','eventId','eventUtc'];
function exactKeys(obj,expected){
 if(obj===null||typeof obj!=='object'||Array.isArray(obj)||Object.keys(obj).length!==expected.length||!expected.every(k=>Object.hasOwn(obj,k)))throw new Error('M07_UNEXPECTED_FIELDS');
}
function validOptions(options){
 exactKeys(options,allowedConfig);
 if(!IDS.test(options.accountId)||!IDS.test(options.freeCycleId))throw new Error('M07_BAD_ID');
 const obj={...options};
 const h=createLocalSeasonHarness(obj);
 // A calendar probe validates freeStartUtc and paidMonth before state mutation.
 h.snapshot(options.freeStartUtc);
 if(!Number.isSafeInteger(options.freeDays)||options.freeDays<1||options.freeDays>366)throw new Error('M07_BAD_FREE_DAYS');
 return Object.freeze(obj);
}
function canonicalEvent(e,config){
 exactKeys(e,eventFields);
 for(const key of ['accountId','freeCycleId','missionId','eventId'])if(typeof e[key]!=='string'||!IDS.test(e[key]))throw new Error('M07_BAD_EVENT_ID');
 if(e.accountId!==config.accountId||e.freeCycleId!==config.freeCycleId)throw new Error('M07_EVENT_IDENTITY_MISMATCH');
 const m=missionById.get(e.missionId);
 if(!m||e.eventType!==m.eventType)throw new Error('M07_EVENT_TYPE_INVALID');
 if(typeof e.eventUtc!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(e.eventUtc))throw new Error('M07_EVENT_TIME_INVALID');
 const time=Date.parse(e.eventUtc);
 if(!Number.isFinite(time)||new Date(time).toISOString()!==e.eventUtc)throw new Error('M07_EVENT_TIME_INVALID');
 return Object.freeze({...e});
}
function canonicalPayload(config,events,revision){
 if(!Number.isSafeInteger(revision)||revision!==events.length)throw new Error('M07_BAD_REVISION');
 if(!Array.isArray(events)||events.length>MAX_EVENTS)throw new Error('M07_TOO_MANY_EVENTS');
 const clean=events.map(e=>canonicalEvent(e,config));
 return {version:VERSION,config,revision,acceptedTestEvents:clean};
}
function fingerprint(payload){return crypto.createHash('sha256').update(JSON.stringify(payload),'utf8').digest('hex');}
function createTestJournalSession(options){
 const config=validOptions(options);
 const engine=createLocalSeasonHarness(config);
 const acceptedTestEvents=[];
 function simulateTestEvent(input){
  const e=canonicalEvent(input,config);
  // no mutation for rejected duplicate/period-cap/invalid source.
  const response=engine.simulateVerifiedEvent(e);
  if(response.accepted)acceptedTestEvents.push(e);
  return response;
 }
 function queueOfflinePreview(e){return engine.previewUnverifiedEvent(canonicalEvent(e,config));}
 function snapshot(atUtc){return engine.snapshot(atUtc);}
 function exportTestJournal(){
  const payload=canonicalPayload(config,acceptedTestEvents,acceptedTestEvents.length);
  const serialized=JSON.stringify({payload,sha256:fingerprint(payload)});
  if(Buffer.byteLength(serialized,'utf8')>MAX_BYTES)throw new Error('M07_JOURNAL_TOO_LARGE');
  return serialized;
 }
 function claimReward(){return engine.claimReward();}
 function purchasePass(){return engine.purchasePass();}
 return Object.freeze({mode:'TEST_ONLY_NO_AUTHORITY',simulateTestEvent,queueOfflinePreview,snapshot,exportTestJournal,claimReward,purchasePass});
}
function restoreTestJournal(text){
 if(typeof text!=='string'||Buffer.byteLength(text,'utf8')>MAX_BYTES||!text.length)throw new Error('M07_JOURNAL_SIZE_INVALID');
 let body;
 try{body=JSON.parse(text);}catch(_){throw new Error('M07_JOURNAL_JSON_INVALID');}
 exactKeys(body,['payload','sha256']);
 const payload=body.payload;
 exactKeys(payload,['version','config','revision','acceptedTestEvents']);
 if(payload.version!==VERSION)throw new Error('M07_JOURNAL_VERSION_UNSUPPORTED');
 const config=validOptions(payload.config);
 const canonical=canonicalPayload(config,payload.acceptedTestEvents,payload.revision);
 if(typeof body.sha256!=='string'||!/^[a-f0-9]{64}$/.test(body.sha256)||fingerprint(canonical)!==body.sha256)throw new Error('M07_JOURNAL_CHECKSUM_INVALID');
 const restored=createTestJournalSession(config);
 for(const item of canonical.acceptedTestEvents){
  const result=restored.simulateTestEvent(item);
  if(!result.accepted)throw new Error('M07_JOURNAL_REPLAY_INVALID');
 }
 // Pending unverified browser events are intentionally NOT persisted;
 // no server authority or entitlement is recreated on restore.
 return restored;
}
module.exports=Object.freeze({createTestJournalSession,restoreTestJournal,mode:'TEST_ONLY_NO_AUTHORITY',version:VERSION,maxBytes:MAX_BYTES});
