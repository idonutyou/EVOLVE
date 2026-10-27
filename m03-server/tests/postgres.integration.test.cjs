'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {readFileSync}=require('node:fs'),{join}=require('node:path');
const {randomUUID}=require('node:crypto');
const enabled=process.env.M03_PG_DISPOSABLE==='YES'&&!!process.env.M03_PG_TEST_URL;
test('disposable PostgreSQL atomicity and persistence',{skip:enabled?false:'no disposable PostgreSQL'},async()=>{
 const url=new URL(process.env.M03_PG_TEST_URL);
 if(!/^evolve_m03_test_[a-z0-9_]+$/.test(url.pathname.slice(1))||!['localhost','127.0.0.1'].includes(url.hostname))throw Error('DISPOSABLE_LOCAL_DB_ONLY');
 const {Pool}=require('pg'),{makeStore}=require('../db.cjs'),{spendBucket}=require('../wallet-ops.cjs');
 const opts={connectionString:url.toString(),ssl:false,max:8};let pool=new Pool(opts);
 const uid=randomUUID(),operation=randomUUID();
 try{
  await pool.query(readFileSync(join(__dirname,'../../docs/monetization/M03_020_LEDGER_SCHEMA.sql'),'utf8'));
  await pool.query(readFileSync(join(__dirname,'../migrations/002_idempotent_results.sql'),'utf8'));
  await pool.query('INSERT INTO m03_accounts(account_id) VALUES($1)',[uid]);
  for(const bucket of ['free','paid'])await pool.query('INSERT INTO m03_wallets(account_id,origin_bucket) VALUES($1,$2)',[uid,bucket]);
  await pool.query("INSERT INTO m03_ledger_operations(operation_id,account_id,kind,idempotency_key,request_hash,source_kind,source_ref,result_json) VALUES($1,$2,'ADMIN_CORRECTION','ci-fixture-grant-001',$3,'admin_review','ci_only','{}'::jsonb)",[operation,uid,Buffer.alloc(32)]);
  await pool.query("INSERT INTO m03_ledger_entries(entry_id,operation_id,account_id,origin_bucket,delta_units) VALUES($1,$2,$3,'paid',100)",[randomUUID(),operation,uid]);
  await pool.query("UPDATE m03_wallets SET available_units=100,version=1 WHERE account_id=$1 AND origin_bucket='paid'",[uid]);
  const store=makeStore(pool),args=(key,units)=>({accountId:uid,key,units,bucket:'paid',sourceRef:'ci_only'});
  const out=await Promise.allSettled([spendBucket(store,args('ci-parallel-spend-01',80)),spendBucket(store,args('ci-parallel-spend-02',80))]);
  assert.equal(out.filter(x=>x.status==='fulfilled').length,1);
  const winner=out.find(x=>x.status==='fulfilled'),keys=['ci-parallel-spend-01','ci-parallel-spend-02'];
  const key=keys[out.findIndex(x=>x===winner)];
  assert.equal((await spendBucket(store,args(key,80))).replayed,true);
  await assert.rejects(spendBucket(store,args(key,79)),/IDEMPOTENCY_CONFLICT/);
  assert.equal((await store.readWallet(uid)).paidCrystals,20);
  await assert.rejects(store.tx(async c=>{await c.query("UPDATE m03_wallets SET available_units=0 WHERE account_id=$1 AND origin_bucket='paid'",[uid]);throw Error('ABORT');}),/ABORT/);
  const sum=await pool.query("SELECT SUM(delta_units)::bigint AS sum FROM m03_ledger_entries WHERE account_id=$1 AND origin_bucket='paid'",[uid]);
  assert.equal(Number(sum.rows[0].sum),20);
  // Immutable event journal: attempts to erase or rewrite accounting history must fail.
  await assert.rejects(pool.query('DELETE FROM m03_ledger_entries WHERE account_id=$1',[uid]),/append-only/);
  await assert.rejects(pool.query('UPDATE m03_ledger_entries SET delta_units=42 WHERE account_id=$1',[uid]),/append-only/);
  await assert.rejects(pool.query('DELETE FROM m03_ledger_operations WHERE account_id=$1',[uid]),/append-only/);
  // Actual DB isolation: two accounts may have separate wallets and source-backed rights.
  const other=randomUUID();
  await pool.query('INSERT INTO m03_accounts(account_id) VALUES($1)',[other]);
  for(const bucket of ['free','paid'])await pool.query('INSERT INTO m03_wallets(account_id,origin_bucket) VALUES($1,$2)',[other,bucket]);
  assert.equal((await store.readWallet(other)).paidCrystals,0);
  assert.equal((await store.readWallet(uid)).paidCrystals,20);
  const first=await pool.query("SELECT count(*)::int AS n FROM m03_ledger_entries WHERE account_id=$1",[uid]);
  const second=await pool.query("SELECT count(*)::int AS n FROM m03_ledger_entries WHERE account_id=$1",[other]);
  assert.equal(first.rows[0].n,2);assert.equal(second.rows[0].n,0);
  await pool.end();pool=new Pool(opts);
  assert.equal((await makeStore(pool).readWallet(uid)).paidCrystals,20);
 }finally{await pool.end()}
});
