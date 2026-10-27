'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {generateKeyPairSync,sign}=require('node:crypto');
const {verifyIdentity}=require('../auth.cjs');
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const identity={issuer:'https://identity.example.test',audience:'evolve-dev',publicKey:publicKey.export({format:'pem',type:'spki'})};
const now=Math.floor(Date.now()/1000);
const enc=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
const token=(claims)=>{const body=enc({...claims});const head=enc({alg:'RS256',typ:'JWT',kid:'unit-test'});const text=head+'.'+body;return text+'.'+sign('RSA-SHA256',Buffer.from(text),privateKey).toString('base64url')};
const claims={iss:identity.issuer,aud:identity.audience,sub:'verified_subject_123',iat:now-5,exp:now+180};
test('valid signed short-lived external token authenticates subject',()=>{
 assert.equal(verifyIdentity('Bearer '+token(claims),identity).subject,claims.sub);
});
test('signature forgery, unsigned bearer and wrong issuer fail closed',()=>{
 assert.throws(()=>verifyIdentity('Bearer '+token({...claims,sub:'forged'}).slice(0,-4)+'abcd',identity),/UNAUTHORIZED/);
 assert.throws(()=>verifyIdentity('Bearer undefined',identity),/UNAUTHORIZED/);
 assert.throws(()=>verifyIdentity('Bearer '+token({...claims,iss:'https://attacker.test'}),identity),/UNAUTHORIZED/);
});
test('expired token and wrong audience fail closed',()=>{
 assert.throws(()=>verifyIdentity('Bearer '+token({...claims,exp:now-10}),identity),/UNAUTHORIZED/);
 assert.throws(()=>verifyIdentity('Bearer '+token({...claims,aud:'other-app'}),identity),/UNAUTHORIZED/);
});
test('missing identity configuration never falls back to demo auth',()=>{
 assert.throws(()=>verifyIdentity('Bearer '+token(claims),{}),/IDENTITY_CONFIGURATION_MISSING/);
});
