'use strict';
const {createServer}=require('node:http');
const {verifyIdentity}=require('./auth.cjs');
const DISABLED={code:'PAYMENT_BACKEND_NOT_READY'};
function send(res,code,json){res.writeHead(code,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(json))}
function createHandler({store,identity}){
 return async (req,res)=>{
  const path=new URL(req.url,'http://localhost').pathname;
  if(path==='/v1/catalog'&&req.method==='GET')return send(res,200,{checkoutEnabled:false,products:[]});
  if(req.method==='POST'&&path!=='/v1/accounts/bootstrap')return send(res,503,DISABLED);
  if(!['/v1/accounts/bootstrap','/v1/me/wallet','/v1/me/entitlements'].includes(path))return send(res,404,{code:'NOT_FOUND'});
  if(path==='/v1/accounts/bootstrap'&&req.method!=='POST')return send(res,405,{code:'METHOD_NOT_ALLOWED'});
  if(path!=='/v1/accounts/bootstrap'&&req.method!=='GET')return send(res,405,{code:'METHOD_NOT_ALLOWED'});
  let principal;try{principal=verifyIdentity(req.headers.authorization,identity)}catch{return send(res,401,{code:'UNAUTHORIZED'})}
  try{
   const account=path==='/v1/accounts/bootstrap'?await store.getOrCreateAccount(principal):await store.getAccount(principal);
   if(!account||account.status!=='active')return send(res,403,{code:'ACCOUNT_DISABLED'});
   if(path==='/v1/accounts/bootstrap'&&req.method==='POST')return send(res,200,{accountId:account.id});
   if(path==='/v1/me/wallet'&&req.method==='GET')return send(res,200,await store.readWallet(account.id));
   if(path==='/v1/me/entitlements'&&req.method==='GET')return send(res,200,{entitlements:await store.readEntitlements(account.id)});
   return send(res,405,{code:'METHOD_NOT_ALLOWED'});
  }catch{return send(res,503,{code:'BACKEND_NOT_READY'})}
 };
}
module.exports={createHandler,makeServer:args=>createServer(createHandler(args))};
