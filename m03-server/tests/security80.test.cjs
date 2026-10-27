'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {generateKeyPairSync,sign}=require('node:crypto');
const {makeServer}=require('../api.cjs');
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const identity={issuer:'https://evolve.test.invalid',audience:'evolve-m03',publicKey:publicKey.export({type:'spki',format:'pem'})};
const enc=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
const signed=(subject,options={})=>{
 const now=Math.floor(Date.now()/1000);
 const header=enc({alg:'RS256',typ:'JWT',kid:'m03-test'});
 const body=enc({iss:identity.issuer,aud:identity.audience,sub:subject,iat:now-2,exp:now+120,...options});
 const raw=header+'.'+body;
 return 'Bearer '+raw+'.'+sign('RSA-SHA256',Buffer.from(raw),privateKey).toString('base64url');
};
async function serve(store,fn){const srv=makeServer({store,identity});await new Promise(r=>srv.listen(0,'127.0.0.1',r));try{await fn('http://127.0.0.1:'+srv.address().port)}finally{await new Promise(r=>srv.close(r))}}
test('unknown valid user reading wallet never causes registration',async()=>{
 let creations=0,reads=0;
 const store={getOrCreateAccount:async()=>{creations++;throw Error('not allowed')},getAccount:async()=>{reads++;return null}};
 await serve(store,async url=>{
  const reply=await fetch(url+'/v1/me/wallet',{headers:{Authorization:signed('new-user')}});
  assert.equal(reply.status,403);
  assert.equal(creations,0);assert.equal(reads,1);
 });
});
test('account A token cannot select B wallet with query or body',async()=>{
 const seen=[];
 const store={getAccount:async claims=>({id:claims.subject==='alice'?'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa':'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',status:'active'}),
  readWallet:async accountId=>{seen.push(accountId);return {currency:'mutation_crystal',freeCrystals:0,paidCrystals:0,totalCrystals:0,version:0,updatedAt:'2026-10-27T12:00:00.000Z'}}};
 await serve(store,async url=>{
  const evil=await fetch(url+'/v1/me/wallet?accountId=bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',{headers:{Authorization:signed('alice')}});
  assert.equal(evil.status,200);
  const result=await evil.json();assert.equal(result.paidCrystals,0);
  assert.deepEqual(seen,['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa']);
 });
});
test('suspended account has no wallet read',async()=>{
 let access=0;
 await serve({getAccount:async()=>({id:'closed',status:'suspended'}),readWallet:async()=>{access++;throw Error('forbidden')}},async url=>{
  assert.equal((await fetch(url+'/v1/me/wallet',{headers:{Authorization:signed('blocked')}})).status,403);
  assert.equal(access,0);
 });
});
test('malformed expiry, wrong audience, invalid signature cannot access account',async()=>{
 let lookedUp=0;
 await serve({getAccount:async()=>{lookedUp++;return {id:'x',status:'active'}}},async url=>{
  const opts=[signed('alice',{aud:'wrong'}),signed('alice',{exp:1}),signed('alice',{iat:Date.now()})];
  for(const auth of opts)assert.equal((await fetch(url+'/v1/me/wallet',{headers:{Authorization:auth}})).status,401);
  assert.equal(lookedUp,0);
 });
});
