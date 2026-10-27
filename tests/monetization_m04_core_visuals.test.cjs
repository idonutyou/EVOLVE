'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {createRenderer}=require('../web/mock-core-visuals-v617.js');
test('two cached core overlays remain bounded during 10,000 draw calls',()=>{
 let made=0,depth=0;
 const gradient={addColorStop(){}};
 const noop=()=>{};
 const context={globalAlpha:1,save(){depth++},restore(){depth--},translate:noop,createRadialGradient:()=>gradient,fillRect:noop,beginPath:noop,moveTo:noop,bezierCurveTo:noop,stroke:noop,ellipse:noop,fill:noop,drawImage:noop};
 const renderer=createRenderer(()=>{made++;return {getContext:()=>context}});
 for(let i=0;i<10000;i++)assert.equal(renderer.draw(context,'dev_core_theme_0'+(1+i%2),2,4,12),true);
 assert.equal(renderer.draw(context,'__proto__',2,4),false);
 assert.equal(renderer.draw(context,'dev_core_theme_01',NaN,4),false);
 assert.equal(made,2);assert.equal(depth,0);
 assert.equal(renderer.read().cacheBytes,294912);assert.equal(renderer.read().draws,10000);
});
test('cosmetic engine addition reverses to the exact original game bytes',()=>{
 const root=path.join(__dirname,'../dist'),r=JSON.parse(fs.readFileSync(path.join(root,'verification.json')));
 const current=fs.readFileSync(path.join(root,r.m04_mock_content.engine),'utf8');
 const original=fs.readFileSync(path.join(root,r.m04_mock_content.baseline_engine),'utf8');
 const reverted=current.replace(/\n\/\* M04_CORE_V617_BEGIN \*\/[\s\S]*?\/\* M04_CORE_V617_END \*\/\n/,'');
 assert.equal(reverted,original);
});
