const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const env={};vm.createContext(env);vm.runInContext(fs.readFileSync(__dirname+'/../web/movement-field-v590.js','utf8').split('const playerFacingStateV590=')[0],env);
const aim=env.createIndependentAimV590(2);aim.reset(0);aim.step(.1,-5,0,true);assert.ok(Math.abs(aim.body()-Math.PI)<1e-8);aim.attack(0);assert.equal(aim.weapon(),0);assert.ok(Math.abs(aim.body()-Math.PI)<1e-8);
aim.step(1.99,0,5,true);assert.ok(Math.abs(aim.body()-Math.PI/2)<1e-8);assert.equal(aim.weapon(),0);aim.step(.011,0,0,false);assert.equal(aim.weapon(),aim.body());
aim.attack(-1);aim.step(1.5,4,0,true);aim.attack(.5);aim.step(1.99,-4,0,true);assert.equal(aim.weapon(),.5);const paused=JSON.stringify(aim.read());aim.step(0,5,5,true);assert.equal(JSON.stringify(aim.read()),paused);aim.step(.011,0,0,false);assert.equal(aim.weapon(),aim.body());aim.reset(0);assert.equal(aim.read().holdRemaining,0);
let seed=123456789;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const sampler=env.createReachableFieldSamplerV590(),key={},clear=(x,y)=>{
 if(x<25||y<25||x>975||y>975)return false;
 if(x>475&&x<525&&(y<390||y>610))return false;
 const box=x>690&&x<910&&y>690&&y<910,inside=x>730&&x<870&&y>730&&y<870;
 return !box||inside;
};
const host={key,width:1000,height:1000,cell:14,player:{x:150,y:150},clearFoot:clear,clearSite:clear,random};
const points=Array.from({length:160},()=>sampler.sample(host));assert.ok(points.every(p=>p&&clear(p.x,p.y)));assert.ok(points.every(p=>!(p.x>730&&p.x<870&&p.y>730&&p.y<870)));assert.ok(points.filter(p=>Math.hypot(p.x-150,p.y-150)>500).length>65);for(let q=0;q<4;q++)assert.ok(points.some(p=>(p.x>500?1:0)+(p.y>500?2:0)===q));assert.equal(sampler.read().builds,1);
host.player={x:800,y:800};for(let i=0;i<15;i++){const p=sampler.sample(host);assert.ok(p&&p.x>730&&p.x<870&&p.y>730&&p.y<870);}assert.equal(sampler.read().builds,2);
host.key={};host.clearFoot=()=>false;assert.equal(sampler.sample(host),null);
const corner=env.createReachableFieldSamplerV590(),cornerHost={key:{},width:42,height:42,cell:14,player:{x:7,y:7},clearFoot:(x,y)=>(x>0&&x<14&&y>0&&y<14)||(x>14&&x<28&&y>14&&y<28),clearSite:()=>true,random};
for(let i=0;i<15;i++){const p=corner.sample(cornerHost);assert.ok(p&&p.x<14&&p.y<14);}assert.equal(corner.read().reachableCells,1);
console.log(JSON.stringify({ok:true,checks:['movement changes the body without changing held weapon aim','two-second aim expiry and attack refresh','pause and reset','whole-map random distribution across a connected corridor','disconnected floor exclusion','component cache reuse and invalidation','no diagonal wall crossing','no invalid spawn fallback']}));
