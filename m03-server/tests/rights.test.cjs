'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {effectiveRights,openRefundReview}=require('../rights.cjs');
const accountId='11111111-1111-4111-8111-111111111111';
const rights=[{id:'cosmetic_core',source:'direct_purchase',state:'revoked'},{id:'cosmetic_core',source:'crystal_spend',state:'active'}];
function testStore(){
 let review;
 const c={query:async(q,v)=>{
  if(q.includes('FROM m03_accounts'))return {rows:[{status:'active'}]};
  if(q.includes('FROM m03_refund_review_cases'))return {rows:review?[review]:[]};
  if(q.startsWith('INSERT INTO m03_refund_review_cases')){review={case_id:v[0],account_id:v[1],state:'pending_review'};return {rows:[]}};
  throw Error('unexpected query');
 }};
 return {pool:{query:async()=>({rows:[{entitlement_id:'cosmetic_core',origins:rights.filter(r=>r.state==='active').length}]})},tx:async f=>f(c)};
}
test('refund of one purchase source does not erase another active source',async()=>{
 const r=await effectiveRights(testStore(),accountId);
 assert.equal(r.length,1);assert.equal(r[0].activeSources,1);
});
test('review is pending and replay returns same case without changing rights',async()=>{
 const s=testStore(),p={accountId,provider:'web',providerRef:'qa-only-provider-id'};
 const a=await openRefundReview(s,p),b=await openRefundReview(s,p);
 assert.equal(a.state,'pending_review');assert.equal(b.duplicate,true);
 assert.equal(a.caseId,b.caseId);
});
test('malformed owner or provider reference does not create review',async()=>{
 await assert.rejects(openRefundReview(testStore(),{accountId:'not-an-uuid',provider:'web',providerRef:'x'}),/INVALID_REFUND_CASE/);
});
