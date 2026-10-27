'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {generateKeyPairSync,sign}=require('node:crypto');
const {makeServer}=require('../api.cjs');
const {makeStore}=require('../db.cjs');
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const issuer='https://evolve.test.invalid/identity',audience='evolve-m03-private';
const identity={issuer,audience,publicKey:publicKey.export({format:'pem',type:'spki'})};
const encoded=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
const now=Math.floor(Date.now()/1000);
const payload={iss:issuer,aud:audience,sub:'test_account_subject_001',iat:now-10,exp:now+240};
const prefix=encoded({alg:'RS256',typ:'JWT',kid:'test-pinned-key'})+'.'+encoded(payload);
const token='Bearer '+prefix+'.'+sign('RSA-SHA256',Buffer.from(prefix),privateKey).toString('base64url');
async function withApi(store,fn){
 const server=makeServer({store,identity});
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 try{return await fn('http://127.0.0.1:'+server.address().port)}
 finally{await new Promise(done=>server.close(done))}
}
test('GET bootstrap never creates account even with valid token',async()=>{
 let calls=0;
 await withApi({getOrCreateAccount:async()=>{calls++;return {id:'x',status:'active'}}},async url=>{
  const r=await fetch(url+'/v1/accounts/bootstrap',{headers:{Authorization:token}});
  assert.equal(r.status,405);assert.equal(calls,0);
 });
});
test('wallet HTTP response matches contract version and timestamp',async()=>{
 const expected={freeCrystals:10,paidCrystals:12,totalCrystals:22,currency:'mutation_crystal',version:3,updatedAt:'2026-10-27T12:00:00.000Z'};
 await withApi({getAccount:async()=>({id:'server-account-123',status:'active'}),readWallet:async id=>{assert.equal(id,'server-account-123');return expected}},async url=>{
  const r=await fetch(url+'/v1/me/wallet',{headers:{Authorization:token}});
  assert.equal(r.status,200);assert.deepEqual(await r.json(),expected);
 });
});
test('DB wallet adapter returns versions and server timestamps',async()=>{
 let query;const pool={query:async(sql,params)=>{query=sql;assert.deepEqual(params,['1234']);return {rows:[
  {origin_bucket:'free',available_units:'10',version:'2',updated_at:'2026-10-27T11:00:00Z'},
  {origin_bucket:'paid',available_units:'12',version:'3',updated_at:'2026-10-27T12:00:00Z'}]}}};
 const r=await makeStore(pool).readWallet('1234');
 assert.match(query,/version,updated_at/);
 assert.deepEqual(r,{freeCrystals:10,paidCrystals:12,totalCrystals:22,currency:'mutation_crystal',version:3,updatedAt:'2026-10-27T12:00:00.000Z'});
});
test('negative balances fail closed',async()=>{
 const pool={query:async()=>({rows:[
  {origin_bucket:'free',available_units:'-1',version:'2',updated_at:'2026-10-27T11:00:00Z'},
  {origin_bucket:'paid',available_units:'12',version:'3',updated_at:'invalid'}]})};
 await assert.rejects(()=>makeStore(pool).readWallet('1234'),/BAD_BALANCE|WALLET_INVALID/);
});
test('unsigned requests denied; checkout remains disabled',async()=>{
 let called=0;
 await withApi({getOrCreateAccount:async()=>{called++;throw Error('unexpected')}},async url=>{
  assert.equal((await fetch(url+'/v1/me/wallet')).status,401);
  assert.equal((await fetch(url+'/v1/checkout/sessions',{method:'POST',headers:{Authorization:token}})).status,503);
  assert.equal(called,0);
 });
});
