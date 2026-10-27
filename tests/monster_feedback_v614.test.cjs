const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const text=fs.readFileSync(path.join(__dirname,'../web/monster-feedback-v614.js'),'utf8');
const box={};vm.createContext(box);vm.runInContext(text+';this.make=createMonsterFeedbackV614;',box);
function env(settings={}){
 let time=0;const host={time:()=>time,crowd:()=>settings.crowd||1,settings:()=>settings,
  weaponPose:e=>settings.weaponPose?.(e)||null,organPose:e=>settings.organPose?.(e)||null,direction:()=>0,
  combatType:e=>({ripper:'runner',mauler:'brute',bileback:'spitter'}[e.type]||e.type)};
 const api=box.make(host);return {api,tick:dt=>{time+=dt;api.step(dt);}};
}
const monster=(type='crawler')=>({type,x:60,y:70,hp:80,maxHp:100,kx:0,ky:0,spd:55,dead:false});
const hit=(kind='arm',damage=20)=>({type:'hit',kind,damage,weapon:null,knockback:{x:1,y:1},target:{hpBefore:100},killed:false});
test('fast, heavy and elite impacts use distinct sizes; no combat mutation',()=>{
 const {api,tick}=env(),a=monster('ripper'),b=monster('mauler'),c={...monster('spitter'),elite:true};
 const before=JSON.stringify([a,b,c]);for(const e of [a,b,c])assert.equal(api.receive(hit(),e),true);
 tick(.02);const x=[a,b,c].map(e=>api.pose(e));assert.ok(x.every(p=>p&&p.sx<1));assert.notEqual(x[0].sx,x[1].sx);assert.ok(x[2].sx>x[0].sx);
 assert.equal(JSON.stringify([a,b,c]),before);tick(.4);assert.equal(api.read().active,0);
});
test('owned weapon, organ, electric, warnings, bosses and DOT never double-transform',()=>{
 const {api}=env({weaponPose:e=>e.owner==='weapon'?{sx:.9}:null,organPose:e=>e.owner==='organ'?{rot:.1}:null});
 for(const variant of [{weapon:'gun'},{weapon:'blade'},{kind:'spike'},{kind:'tail'},{kind:'arc'}]){
  const e=monster();assert.equal(api.receive({...hit(),...variant},e),false);assert.equal(api.pose(e),null);
 }
 for(const e of [{...monster(),owner:'weapon'},{...monster(),owner:'organ'},{...monster(),telegraphing:true},
   {...monster(),arcShockV576:{age:0,life:.2}}, {...monster(),finalBoss:true},{...monster('boss')}]){
  assert.equal(api.receive(hit(),e),false);assert.equal(api.pose(e),null);
 }
 for(const kind of ['acid','poison','dot','burn','tick','spit'])assert.equal(api.receive(hit(kind),monster()),false);
 assert.equal(api.receive({...hit(),type:'shield'},monster()),false);
 assert.equal(api.receive({...hit(),damage:0},monster()),false);
});
test('coalescing, 250-enemy capacity and reduced-motion budget',()=>{
 const s=env({crowd:250}),e=monster();for(let i=0;i<10;i++)s.api.receive(hit(),e);
 assert.equal(s.api.read().coalesced,9);
 for(let i=0;i<250;i++)s.api.receive(hit(),monster());
 assert.ok(s.api.read().active<=14);assert.ok(s.api.read().dropped>0);
 const r=env({reducedMotion:true});assert.equal(r.api.receive(hit(),monster()),false);assert.equal(r.api.read().active,0);
});
test('death echo gets visual-only modification once and preserves electric/TITAN deaths',()=>{
 const {api}=env();const e=monster('brute'),echo={vx:0,vy:0,spin:0,life:.35,max:.35};
 const before=JSON.stringify(e);assert.equal(api.attachEcho(e,echo),true);assert.equal(api.attachEcho(e,echo),false);
 assert.ok(echo.max>=.46);assert.equal(JSON.stringify(e),before);
 const boss={...monster(),finalBoss:true},special={...monster(),arcShockV576:{age:0,life:.2}};
 assert.equal(api.attachEcho(boss,{life:.2}),false);
 const electric={life:.48,max:.48,vx:101,vy:-12,spin:1.4};
 assert.equal(api.attachEcho(special,electric),false);assert.equal(electric.vx,101);
});
test('reset clears transient tracking, no live-game changes',()=>{
 const {api,tick}=env();const e=monster();api.receive(hit(),e);assert.equal(api.read().active,1);
 api.reset();assert.equal(api.read().active,0);tick(.3);assert.equal(api.pose(e),null);assert.equal(api.read().visualOnly,true);
});
