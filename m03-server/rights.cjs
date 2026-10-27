'use strict';
// Internal-only read and review. No payment provider is trusted in M03.
async function effectiveRights(store,accountId){
 const r=await store.pool.query("SELECT entitlement_id,count(*)::int AS origins FROM m03_entitlement_sources WHERE account_id=$1 AND state='active' GROUP BY entitlement_id ORDER BY entitlement_id",[accountId]);
 return r.rows.map(x=>({entitlementId:x.entitlement_id,activeSources:Number(x.origins)}));
}
async function openRefundReview(store,{accountId,provider,providerRef}){
 if(!/^[0-9a-f-]{36}$/i.test(accountId)||typeof provider!=='string'||!/^[a-z0-9_]{2,50}$/.test(provider)
 ||typeof providerRef!=='string'||providerRef.length<1||providerRef.length>200)throw Error('INVALID_REFUND_CASE');
 return store.tx(async c=>{
  const a=await c.query('SELECT status FROM m03_accounts WHERE account_id=$1 FOR UPDATE',[accountId]);
  if(a.rows[0]?.status!=='active')throw Error('ACCOUNT_UNAVAILABLE');
  // Never make automatic negative balances or revoke entitlements from unverified claims.
  const exists=await c.query('SELECT case_id,account_id,state FROM m03_refund_review_cases WHERE provider=$1 AND provider_ref=$2',[provider,providerRef]);
  if(exists.rows.length){
   if(exists.rows[0].account_id!==accountId)throw Error('REFUND_REFERENCE_CONFLICT');
   return {caseId:exists.rows[0].case_id,state:exists.rows[0].state,duplicate:true};
  }
  const {randomUUID}=require('node:crypto');const id=randomUUID();
  await c.query("INSERT INTO m03_refund_review_cases(case_id,account_id,provider,provider_ref,state) VALUES($1,$2,$3,$4,'pending_review')",[id,accountId,provider,providerRef]);
  return {caseId:id,state:'pending_review',duplicate:false};
 });
}
module.exports={effectiveRights,openRefundReview};
