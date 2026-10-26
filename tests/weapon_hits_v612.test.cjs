const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'web/weapon-hit-reactions-v612.js'),'utf8');
function setup(settings={}){let time=0;const box={};vm.createContext(box);vm.runInContext(source+';this.create=createWeaponHitReactionsV612;',box);
 const image=()=>({complete:true,naturalWidth:1774,naturalHeight:887,set src(v){this.url=v;queueMicrotask(()=>this.onload());}});
 const api=box.create({art:{gun:'gun.png',blade:'blade.png'},image,time:()=>time,settings:()=>settings,crowd:()=>settings.crowd||0,visible:()=>true});
 return {api,advance:n=>{time+=n;api.step(n);}};
}
function target(){return {x:100,y:100,hp:100,maxHp:100,r:12,dead:false,kx:0,ky:0};}
function hit(weapon='gun',damage=12){return {type:'hit',kind:'arm',weapon,damage,x:100,y:100,angle:0,target:{hpBefore:100},critical:null,heavy:null};}
test('real positive gun/blade damage produces distinct brief visual poses, without mutating combat fields',()=>{
 const a=setup(),g=target(),b=target(),snapshot=JSON.stringify([g,b]);a.api.receive(hit('gun'),g);a.api.receive(hit('blade'),b);a.advance(.025);
 assert.notDeepEqual(a.api.pose(g),a.api.pose(b));assert.equal(JSON.stringify([g,b]),snapshot);assert.equal(a.api.read().active,2);
 a.advance(.25);assert.equal(a.api.pose(g),null);assert.equal(a.api.pose(b),null);assert.equal(a.api.read().active,0);
});
test('misses, shields and other organs do not masquerade as gun or blade impacts',()=>{
 const {api}=setup();for(const e of [{...hit(),damage:0},{...hit(),type:'shield'},{...hit(),weapon:null},{...hit(),weapon:'spike'}])assert.equal(api.receive(e,target()),false);
 assert.equal(api.read().active,0);
});
test('large actual damage and known critical strikes select the stronger reaction',()=>{
 const {api}=setup();api.receive(hit(),target());api.receive(hit('gun',60),target());api.receive({...hit('blade'),critical:true},target());
 assert.equal(api.read().normal,1);assert.equal(api.read().heavy,2);
});
test('same-frame pellets coalesce and heavy crowds remain bounded',()=>{
 const s=setup(),e=target();for(let i=0;i<20;i++)s.api.receive(hit(),e);assert.equal(s.api.read().active,1);assert.equal(s.api.read().coalesced,19);
 for(let i=0;i<300;i++)s.api.receive(hit(),target());assert.ok(s.api.read().active<=48);
 const c=setup({crowd:250});for(let i=0;i<300;i++)c.api.receive(hit(),target());assert.ok(c.api.read().active<=28);
});
test('reduced motion suppresses body deformation and quickly clears effects',()=>{
 const s=setup({reducedMotion:true}),e=target();s.api.receive(hit('blade',60),e);s.advance(.02);assert.equal(s.api.pose(e),null);s.advance(.08);assert.equal(s.api.read().active,0);
});
test('sprite crops stay inside the original high-resolution alpha atlas and respect flash settings',async()=>{
 const s=setup({flash:0});await s.api.ready;const calls=[];const ctx={save(){},restore(){},translate(){},rotate(){},drawImage(...a){calls.push(a);}};
 s.api.receive(hit('gun',60),target());for(let i=0;i<4;i++){s.api.draw(ctx);s.advance(.045);}
 assert.ok(calls.length>=3);for(const a of calls){assert.ok(a[1]>=0&&a[2]>=0&&a[1]+a[3]<=1774&&a[2]+a[4]<=887);assert.ok(a[3]>400);}
 assert.ok(ctx.globalAlpha<=.60);
});
test('event schema remains backward-compatible and preserves actual critical metadata',()=>{
 const box={window:{},location:{search:'?evolveQA=1'},URLSearchParams};vm.createContext(box);vm.runInContext(fs.readFileSync(path.join(root,'web/hit-events-v612.js'),'utf8'),box);
 const api=box.window.EVOLVE_HIT_EVENTS,seen=[];api.subscribe(e=>seen.push(e));const e={...target(),hp:88},before={hp:100,barrier:0,kx:0,ky:0,dead:false};
 api._record(e,12,'arm',before,0);assert.equal(seen[0].weapon,null);assert.equal(seen[0].critical,null);
 api.withContext({critical:true},()=>api._record(e,12,'arm',before,0,{weapon:'blade',angle:1.2}));assert.equal(seen[1].weapon,'blade');assert.equal(seen[1].critical,true);assert.equal(seen[1].angle,1.2);
 assert.equal(Object.isFrozen(seen[1]),true);
});
test('the actual core damage function is byte-identical to the baseline',()=>{
 const p=JSON.parse(fs.readFileSync(path.join(root,'docs/step05/PACKAGE_V612.json'))),old=fs.readFileSync(path.join(root,'dist',p.baseline_engine),'utf8'),next=fs.readFileSync(path.join(root,'dist',p.engine),'utf8');
 const core=s=>s.slice(s.indexOf('function hurtEnemyCoreV601('),s.indexOf('\nfunction hurtEnemy(',s.indexOf('function hurtEnemyCoreV601(')));
 assert.equal(core(next),core(old));assert.equal(p.baseline_engine_restores_exactly,true);assert.equal(p.attack_timing_unchanged,true);
});
