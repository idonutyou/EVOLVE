const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');

test('loader removal before DOM ready preserves update and cache setup',async()=>{
 const events={},intervals=[],registered=[],requests=[];
 let reloaded=0;
 const nodes={webStatus:{},webRetry:{addEventListener(){}},webUpdate:{hidden:true},webApply:{},webUpdateText:{}};
 nodes.webLoader={remove(){delete nodes.webLoader;delete nodes.webRetry;}};
 const state={atHome:true};
 const context={URL,Date,JSON,console,
  document:{getElementById:id=>nodes[id]||null,visibilityState:'visible'},
  addEventListener:(name,handler)=>{events[name]=handler;},
  setInterval:(handler,ms)=>intervals.push({handler,ms}),
  location:{href:'https://example.test/EVOLVE/',protocol:'https:',hostname:'example.test',reload:()=>reloaded++},
  navigator:{serviceWorker:{register:(...args)=>{registered.push(args);return Promise.resolve();}}},
  fetch:async url=>{requests.push(String(url));return{ok:true,json:async()=>({build:'next-build'})};},
  localStorage:{length:0,setItem(){},key(){return null;}},
  EVOLVE_WEB_CONFIG:{build:'this-build',version:'V575-WEB-2',scriptBytes:100},
  EVOLVE_WEB_GUARD:{atHome:()=>state.atHome,persist(){}}
 };
 context.window=context;
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../web/client.js'),'utf8'),context);
 context.EVOLVE_WEB_CLIENT.loaded(100);
 assert.equal(nodes.webRetry,undefined);
 assert.doesNotThrow(()=>events.DOMContentLoaded());
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(registered.length,1);
 assert.deepEqual(intervals.map(x=>x.ms),[1500,300000]);
 assert.equal(requests.length,1);
 assert.equal(nodes.webUpdate.hidden,false);
 state.atHome=false;
 intervals[0].handler();
 assert.equal(nodes.webUpdate.hidden,true);
 nodes.webApply.onclick();
 assert.equal(reloaded,0);
 state.atHome=true;
 nodes.webApply.onclick();
 assert.equal(reloaded,1);
});
