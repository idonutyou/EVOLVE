/* M07 60% — isolated deterministic batch-ordering + stale-response gate.
 * Every event is a TEST FIXTURE. No trusted server, wallet, billing, grants,
 * browser storage, runtime hooks, network or account ownership.
 */
'use strict';
const {createTestJournalSession,restoreTestJournal}=require('./mission-journal-050.cjs');
const ID=/^[A-Za-z0-9_-]{3,72}$/;
const MAX_BATCH_EVENTS=32,MAX_REQUESTS=1024;
function exact(obj,names){
 if(!obj||typeof obj!=='object'||Array.isArray(obj)||Object.keys(obj).length!==names.length||names.some(k=>!Object.hasOwn(obj,k)))throw new Error('M07_BATCH_FIELDS_INVALID');
}
function id(x){if(typeof x!=='string'||!ID.test(x))throw new Error('M07_BATCH_ID_INVALID');return x;}
function fenceSnapshot({accountId,freeCycleId,currentRevision,incoming}){
 id(accountId);id(freeCycleId);
 if(!Number.isSafeInteger(currentRevision)||currentRevision<0)throw new Error('M07_REVISION_INVALID');
 if(!incoming||typeof incoming!=='object'||Array.isArray(incoming))return Object.freeze({apply:false,reason:'SNAPSHOT_INVALID'});
 if(incoming.accountId!==accountId||incoming.freeCycleId!==freeCycleId)return Object.freeze({apply:false,reason:'SCOPE_MISMATCH'});
 if(!Number.isSafeInteger(incoming.revision)||incoming.revision<0)return Object.freeze({apply:false,reason:'SNAPSHOT_REVISION_INVALID'});
 if(incoming.revision<currentRevision)return Object.freeze({apply:false,reason:'STALE_SNAPSHOT'});
 if(incoming.revision>currentRevision)return Object.freeze({apply:false,reason:'FUTURE_REVISION_NEEDS_AUTHORITY'});
 return Object.freeze({apply:true,reason:'SAME_REVISION_READ_ONLY'});
}
function createTestBatchGate(options){
 const config={...options};
 id(config.accountId);id(config.freeCycleId);
 let current=createTestJournalSession(config);
 let revision=0;
 const receipts=new Map();
 function snapshot(atUtc){return Object.freeze({...current.snapshot(atUtc),testBatchRevision:revision,realRewardsGranted:0,checkoutEnabled:false,clientGrantsEnabled:false});}
 function tryBatch(command){
  exact(command,['requestId','expectedRevision','events']);
  const requestId=id(command.requestId);
  if(!Number.isSafeInteger(command.expectedRevision)||command.expectedRevision<0)return Object.freeze({ok:false,reason:'BAD_EXPECTED_REVISION',realGrants:0});
  if(!Array.isArray(command.events)||command.events.length<1||command.events.length>MAX_BATCH_EVENTS)return Object.freeze({ok:false,reason:'INVALID_BATCH_SIZE',realGrants:0});
  let encoded;
  try{encoded=JSON.stringify({expectedRevision:command.expectedRevision,events:command.events});}catch(_){return Object.freeze({ok:false,reason:'INVALID_PAYLOAD',realGrants:0});}
  if(typeof encoded!=='string'||encoded.length>16000)return Object.freeze({ok:false,reason:'INVALID_PAYLOAD',realGrants:0});
  if(receipts.has(requestId)){
   const previous=receipts.get(requestId);
   if(previous.encoded!==encoded)return Object.freeze({ok:false,reason:'REQUEST_ID_CONFLICT',realGrants:0});
   return Object.freeze({...previous.receipt,replayed:true});
  }
  if(command.expectedRevision!==revision)return Object.freeze({ok:false,reason:'STALE_EXPECTED_REVISION',revision,realGrants:0});
  if(receipts.size>=MAX_REQUESTS)return Object.freeze({ok:false,reason:'REQUEST_LIMIT',revision,realGrants:0});
  // ALL OR NOTHING: stage in a separately rehydrated TEST journal.
  // The original snapshot cannot be altered if event 2..N is invalid.
  const staged=restoreTestJournal(current.exportTestJournal());
  for(let i=0;i<command.events.length;i++){
   let response;
   try{response=staged.simulateTestEvent(command.events[i]);}
   catch(_){return Object.freeze({ok:false,reason:'INVALID_TEST_EVENT',failedAt:i,revision,realGrants:0});}
   if(!response.accepted)return Object.freeze({ok:false,reason:response.reason,failedAt:i,revision,realGrants:0});
  }
  current=staged;
  revision++;
  const receipt=Object.freeze({ok:true,reason:'TEST_BATCH_ACCEPTED_NO_GRANT',requestId,revision,eventCount:command.events.length,replayed:false,realGrants:0});
  receipts.set(requestId,{encoded,receipt});
  return receipt;
 }
 function claimReward(){return Object.freeze({ok:false,reason:'M08_NO_REWARD_AUTHORITY',realGrants:0});}
 function purchasePass(){return Object.freeze({ok:false,reason:'M08_NO_PAYMENT_PROVIDER',charged:0,owned:false});}
 return Object.freeze({mode:'M07_LOCAL_TEST_BATCH_ONLY',tryBatch,snapshot,claimReward,purchasePass,readRevision:()=>revision,readRequestCount:()=>receipts.size,exportTestJournal:()=>current.exportTestJournal()});
}
module.exports=Object.freeze({createTestBatchGate,fenceSnapshot,mode:'M07_LOCAL_TEST_BATCH_ONLY',maxBatchEvents:MAX_BATCH_EVENTS});
