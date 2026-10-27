'use strict';
const {createHash,randomUUID}=require('node:crypto');
function makeStore(pool){
 async function tx(fn){const c=await pool.connect();try{await c.query('BEGIN');const result=await fn(c);await c.query('COMMIT');return result}catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}}
 async function getOrCreateAccount({issuer,subject}){
  const digest=createHash('sha256').update(issuer+'|'+subject).digest();
  return tx(async c=>{
   await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[issuer+digest.toString('hex')]);
   let r=await c.query('SELECT a.account_id,a.status FROM m03_auth_identities i JOIN m03_accounts a ON i.account_id=a.account_id WHERE issuer=$1 AND subject_hash=$2',[issuer,digest]);
   if(r.rows.length)return {id:r.rows[0].account_id,status:r.rows[0].status};
   const id=randomUUID();await c.query('INSERT INTO m03_accounts(account_id) VALUES($1)',[id]);
   await c.query('INSERT INTO m03_auth_identities(issuer,subject_hash,account_id) VALUES($1,$2,$3)',[issuer,digest,id]);
   for(const b of ['free','paid'])await c.query('INSERT INTO m03_wallets(account_id,origin_bucket) VALUES($1,$2)',[id,b]);
   return {id,status:'active'};
  });
 }
 async function readWallet(accountId){
  const r=await pool.query('SELECT origin_bucket,available_units FROM m03_wallets WHERE account_id=$1',[accountId]);
  const get=b=>Number(r.rows.find(x=>x.origin_bucket===b)?.available_units);
  const free=get('free'),paid=get('paid');
  if(!Number.isSafeInteger(free)||!Number.isSafeInteger(paid)||free<0||paid<0)throw Error('BAD_BALANCE');
  return {freeCrystals:free,paidCrystals:paid,totalCrystals:free+paid,currency:'mutation_crystal'};
 }
 async function readEntitlements(accountId){
  const r=await pool.query("SELECT entitlement_id FROM m03_entitlement_sources WHERE account_id=$1 AND state='active' GROUP BY entitlement_id",[accountId]);
  return r.rows.map(x=>({entitlementId:x.entitlement_id,active:true}));
 }
 return {tx,getOrCreateAccount,readWallet,readEntitlements,pool};
}
module.exports={makeStore};
