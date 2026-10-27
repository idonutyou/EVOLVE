'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {makeServer}=require('../api.cjs');
const store={getOrCreateAccount:async()=>{throw Error('should not reach db')},readWallet:async()=>{throw Error('no wallet')}};
test('developer API fails closed for unauthenticated reads and disabled checkout',async()=>{
 const server=makeServer({store,identity:{issuer:'test',audience:'test',publicKey:'bad'}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const {port}=server.address(),base='http://127.0.0.1:'+port;
  const wallet=await fetch(base+'/v1/me/wallet');
  assert.equal(wallet.status,401);
  const checkout=await fetch(base+'/v1/checkout/sessions',{method:'POST'});
  assert.equal(checkout.status,503);
  assert.equal((await checkout.json()).code,'PAYMENT_BACKEND_NOT_READY');
  const claim=await fetch(base+'/v1/rewards/claims',{method:'POST'});
  assert.equal(claim.status,503);
  const catalog=await(await fetch(base+'/v1/catalog')).json();
  assert.equal(catalog.checkoutEnabled,false);assert.deepEqual(catalog.products,[]);
 }finally{await new Promise(resolve=>server.close(resolve))}
});
