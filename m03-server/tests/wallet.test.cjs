'use strict';
// Fake SQL adapter exercises application control flow, not PostgreSQL atomicity.
const {test}=require('node:test'),assert=require('node:assert/strict');
const {spendBucket}=require('../wallet-ops.cjs');
const accountId='11111111-1111-4111-8111-111111111111';
function fakeStore(initial=100){
 let balance=initial,op=new Map(),entries=[],lock=Promise.resolve();
 return {get balance(){return balance},get entries(){return entries},
  async tx(fn){
   let release;const previous=lock;lock=new Promise(r=>release=r);await previous;
   const orig=[balance,new Map(op),entries.slice()];
   const db={async query(sql,v=[]){
    if(sql.includes('FROM m03_accounts'))return {rows:[{status:'active'}]};
    if(sql.includes('FROM m03_ledger_operations'))return {rows:op.has(v[1])?[op.get(v[1])]:[]};
    if(sql.includes('FROM m03_wallets'))return {rows:[{available_units:balance}]};
    if(sql.startsWith('UPDATE m03_wallets')){if(balance<v[2])return {rows:[]};balance-=v[2];return {rows:[{available_units:balance}]}};
    if(sql.startsWith('INSERT INTO m03_ledger_operations')){op.set(v[2],{request_hash:v[3],result_json:JSON.parse(v[5])});return {rows:[]}};
    if(sql.startsWith('INSERT INTO m03_ledger_entries')){entries.push(v);return {rows:[]}};
    throw Error('UNHANDLED_TEST_SQL');
   }};
   try{return await fn(db)}catch(e){[balance,op,entries]=orig;throw e}finally{release()}
  }
 };
}
const spend=(s,key,units)=>spendBucket(s,{accountId,key,bucket:'paid',units,sourceRef:'qa_cosmetic'});
test('100 units cannot fund concurrent 80 + 80',async()=>{
 const s=fakeStore();
 const outcomes=await Promise.allSettled([spend(s,'request-key-aaa-01',80),spend(s,'request-key-bbb-01',80)]);
 assert.equal(outcomes.filter(x=>x.status==='fulfilled').length,1);
 assert.equal(s.balance,20);assert.equal(s.entries.length,1);
});
test('identical operation key replays without double debit',async()=>{
 const s=fakeStore(),a=await spend(s,'request-key-ccc-01',60),b=await spend(s,'request-key-ccc-01',60);
 assert.equal(a.remaining,40);assert.equal(b.replayed,true);assert.equal(s.entries.length,1);
});
test('same idempotency key with new input is rejected',async()=>{
 const s=fakeStore();await spend(s,'request-key-ddd-01',20);
 await assert.rejects(spend(s,'request-key-ddd-01',21),/IDEMPOTENCY_CONFLICT/);
 assert.equal(s.balance,80);
});
test('never accepts negative units or invalid bucket',async()=>{
 const s=fakeStore();
 await assert.rejects(spend(s,'request-key-eee-01',-1),/INVALID_SPEND_INPUT/);
 assert.equal(s.balance,100);
});
