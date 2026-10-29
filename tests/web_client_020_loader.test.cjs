'use strict';
// No Chromium or full dist required: exercise the actual web client with tiny fake resources.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const client=fs.readFileSync(path.join(__dirname,'../web/client.js'),'utf8');
const cases=['success','cache-hit','cache-read-stall','cache-write-stall','network-stall','stream-stall','http-error','manifest-stall'];

async function run(mode){
 const elements=Object.create(null);
 for(const id of ['webLoader','webStatus','webDetail','webProgress','webRetry','webApply','webUpdate','webUpdateText']){
  elements[id]={hidden:id==='webRetry'||id==='webUpdate',textContent:'',value:0,removed:false,remove(){this.removed=true;delete elements[id];},addEventListener(){}};
 }
 const handlers={};let assetFetches=0,assetReads=0,matchCalls=0,putCalls=0;
 const settings={preloadResources:true,version:'TEST',build:'test-build',scriptBytes:0,resourceIdleTimeoutMs:100,resourceCacheTimeoutMs:100};
 const window={EVOLVE_WEB_CONFIG:settings,EVOLVE_WEB_GUARD:{atHome:()=>true},caches:null};
 const fakeCache={
  async match(){
   matchCalls++;
   if(mode==='cache-hit')return {ok:true};
   if(mode==='cache-read-stall')return new Promise(()=>{});
   return undefined;
  },
  put(){
   putCalls++;
   if(mode==='cache-write-stall')return new Promise(()=>{});
   return Promise.resolve();
  },
  delete:async()=>true
 };
 const caches={open:async()=>fakeCache};window.caches=caches;
 const location={href:'https://example.test/game/',protocol:'https:',hostname:'example.test',search:''};
 async function fetch(url){
  const u=String(url);
  if(u.includes('version.json'))return {ok:true,json:async()=>({build:'test-build'})};
  if(u.includes('asset-manifest.json')){
   if(mode==='manifest-stall')return new Promise(()=>{});
   return {ok:true,json:async()=>[{kind:'game-code',path:'assets/111.js',bytes:4},{kind:'image',path:'assets/deferred.png',bytes:1000}]};
  }
  if(!u.includes('assets/111.js'))throw Error('Unexpected fixture request '+u);
  assetFetches++;
  if(mode==='http-error')return {ok:false};
  if(mode==='network-stall')return new Promise(()=>{});
  return {
   ok:true,clone(){return {}},
   body:{getReader(){return {read(){
    assetReads++;
    if(mode==='stream-stall')return new Promise(()=>{});
    if(assetReads===1)return Promise.resolve({done:false,value:Uint8Array.from([1,2,3,4])});
    return Promise.resolve({done:true});
   }}}}
  };
 }
 const placeholder={dataset:{evolveSrc:'assets/111.js'}};
 const document={
  getElementById:id=>elements[id]||null,
  querySelectorAll:selector=>selector==='script[data-evolve-src]'?[placeholder]:[],
  createElement:()=>({async:false,src:'',onload:null,onerror:null}),
  body:{appendChild(el){Promise.resolve().then(()=>el.onload?.());}}
 };
 const sandbox={window,document,caches,fetch,location,navigator:{},URL,AbortController,Date,console,Uint8Array,
  setInterval:()=>0,setTimeout,clearTimeout,addEventListener:(k,v)=>{handlers[k]=v;}};
 vm.runInNewContext(client,sandbox,{filename:'web/client.js',timeout:1000});
 assert.ok(handlers.DOMContentLoaded,'DOMContentLoaded handler');
 handlers.DOMContentLoaded();
 const start=Date.now();
 while(!window.EVOLVE_WEB_CLIENT.read().done&&!window.EVOLVE_WEB_CLIENT.read().failed&&Date.now()-start<1500){
  await new Promise(r=>setTimeout(r,10));
 }
 const state=window.EVOLVE_WEB_CLIENT.read();
 assert.ok(state.done||state.failed,mode+': bounded by test deadline');
 const shouldFail=['network-stall','stream-stall','http-error','manifest-stall'].includes(mode);
 assert.equal(state.failed,shouldFail,mode+': failed');
 assert.equal(state.done,!shouldFail,mode+': done');
 if(shouldFail){
  assert.equal(elements.webRetry.hidden,false,mode+': retry visible');
  assert.ok(elements.webStatus.textContent,mode+': error surfaced');
 }else{
  assert.equal(state.loaded,4,mode+': complete asset count');
  assert.equal(state.files,1,mode+': one essential script');
  assert.equal(state.total,4,mode+': blocks only the tiny essential script');
  assert.equal(state.deferredBytes,1000,mode+': does not fetch deferred image');
  assert.equal(state.deferredFiles,1,mode+': one image remains on demand');
  assert.equal(elements.webLoader,undefined,mode+': loader removed');
 }
 if(mode==='cache-hit'){assert.equal(assetFetches,0);assert.equal(state.cached,4);}
 if(mode==='cache-read-stall'||mode==='cache-write-stall')assert.ok(state.cacheErrors>0,mode+': cache diagnostics');
 if(mode==='cache-read-stall')assert.equal(assetFetches,1);
 if(mode==='cache-write-stall')assert.equal(putCalls,1);
 return {mode,done:state.done,failed:state.failed,elapsedMs:Date.now()-start,assetFetches,cacheErrors:state.cacheErrors||0};
}
(async()=>{const results=[];for(const name of cases)results.push(await run(name));console.log(JSON.stringify({success:true,tests:results},null,2));})().catch(e=>{console.error(e);process.exitCode=1;});
