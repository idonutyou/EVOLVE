'use strict';
const {createHash,randomUUID}=require('node:crypto');
// Internal only: NEVER mount this on an HTTP purchase or credit endpoint.
async function spendBucket(store,{accountId,key,bucket,units,sourceRef}){
 if(!/^[0-9a-f-]{36}$/i.test(accountId)||typeof key!=='string'||key.length<16||key.length>128
 ||!['free','paid'].includes(bucket)||!Number.isSafeInteger(units)||units<1||units>1000000
 ||typeof sourceRef!=='string'||sourceRef.length<1||sourceRef.length>200)throw Error('INVALID_SPEND_INPUT');
 const digest=createHash('sha256').update(JSON.stringify({accountId,key,bucket,units,sourceRef})).digest();
 return store.tx(async db=>{
  const acc=await db.query('SELECT status FROM m03_accounts WHERE account_id=$1 FOR UPDATE',[accountId]);
  if(acc.rows[0]?.status!=='active')throw Error('ACCOUNT_NOT_ACTIVE');
  const prior=await db.query('SELECT request_hash,result_json FROM m03_ledger_operations WHERE account_id=$1 AND idempotency_key=$2',[accountId,key]);
  if(prior.rows.length){
   if(!Buffer.from(prior.rows[0].request_hash).equals(digest))throw Error('IDEMPOTENCY_CONFLICT');
   return {...prior.rows[0].result_json,replayed:true};
  }
  const w=await db.query('SELECT available_units FROM m03_wallets WHERE account_id=$1 AND origin_bucket=$2 FOR UPDATE',[accountId,bucket]);
  if(!w.rows.length||Number(w.rows[0].available_units)<units)throw Error('INSUFFICIENT_UNITS');
  const change=await db.query('UPDATE m03_wallets SET available_units=available_units-$3,version=version+1,updated_at=now() WHERE account_id=$1 AND origin_bucket=$2 AND available_units >= $3 RETURNING available_units',[accountId,bucket,units]);
  if(!change.rows.length)throw Error('INSUFFICIENT_UNITS');
  const remaining=Number(change.rows[0].available_units),operation=randomUUID();
  const result={spent:true,bucket,units,remaining,operationId:operation};
  await db.query("INSERT INTO m03_ledger_operations(operation_id,account_id,kind,idempotency_key,request_hash,source_kind,source_ref,result_json) VALUES($1,$2,'SPEND',$3,$4,'entitlement_spend',$5,$6::jsonb)",[operation,accountId,key,digest,sourceRef,JSON.stringify(result)]);
  await db.query('INSERT INTO m03_ledger_entries(entry_id,operation_id,account_id,origin_bucket,delta_units) VALUES($1,$2,$3,$4,$5)',[randomUUID(),operation,accountId,bucket,-units]);
  return result;
 });
}
module.exports={spendBucket};
