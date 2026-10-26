const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
function setup(cfg={},other={count:0,pose:null}){
 let time=0;const box={};vm.createContext(box);vm.runInContext(read('web/organ-hit-reactions-v613.js')+';this.create=createOrganHitReactionsV613;',box);
 const image=()=>({complete:true,naturalWidth:1774,naturalHeight:887,set src(v){this.url=v;queueMicrotask(()=>this.onload());}});
 const api=box.create({art:{spike:'gun.png',tail:'blade.png'},image,time:()=>time,settings:()=>cfg,crowd:()=>cfg.crowd||0,otherEffects:()=>other.count,weaponPose:()=>other.pose,visible:()=>true});
 return {api,advance:n=>{time+=n;api.step(n);},other,cfg};
}
const enemy=()=>({x:100,y:100,hp:100,maxHp:100,r:12,dead:false,kx:0,ky:0});
const hit=(kind='spike',damage=12)=>({type:'hit',kind,damage,x:100,y:100,target:{hpBefore:100},critical:null,heavy:null});
const source=(kind='spike',angle=0)=>({kind,angle,direct:true});
test('direct spikes compress while whips twist, then recover without writing to combat state',()=>{
 const s=setup(),a=enemy(),b=enemy(),before=JSON.stringify([a,b]);s.api.receive(hit(),a,source());s.api.receive(hit('tail'),b,source('tail'));s.advance(.02);
 assert.ok(s.api.pose(a).sx<1);assert.ok(s.api.pose(b).rot>s.api.pose(a).rot);assert.equal(JSON.stringify([a,b]),before);
 s.advance(.3);assert.equal(s.api.pose(a),null);assert.equal(s.api.pose(b),null);assert.equal(s.api.read().active,0);assert.equal(s.api.read().poses,0);
});
test('DOT, shield-only contacts, misses, mismatched sources and spit never create organ impact poses',()=>{
 const {api}=setup();for(const [e,s] of [[hit(),null],[{...hit(),type:'shield'},source()],[hit('spit'),source('spit')],[hit('tail'),source()],[hit('spike',0),source()],[hit(),{...source(),direct:false}]])assert.equal(api.receive(e,enemy(),s),false);
 assert.equal(api.read().active,0);assert.equal(api.read().spike,0);
});
test('heavy reactions use actual damage or explicit criticals, not attempted damage',()=>{
 const {api}=setup();api.receive({...hit(),attemptedDamage:10000},enemy(),source());api.receive(hit('tail',60),enemy(),source('tail'));api.receive({...hit(),critical:true},enemy(),source());assert.equal(api.read().normal,1);assert.equal(api.read().heavy,2);
});
test('same-frame hits coalesce and both poses and effects remain bounded under a crowd',()=>{
 const s=setup({crowd:250}),e=enemy();for(let i=0;i<20;i++)s.api.receive(hit(),e,source());assert.equal(s.api.read().coalesced,19);
 for(let i=0;i<500;i++)s.api.receive(hit(),enemy(),source());assert.ok(s.api.read().active<=24);assert.ok(s.api.read().poses<=24);
});
test('existing gun effects and new organ effects share the cap even when gun events arrive later',()=>{
 const other={count:40,pose:null},s=setup({},other);for(let i=0;i<100;i++)s.api.receive(hit(),enemy(),source());assert.ok(s.api.read().active<=8);
 other.count=48;s.api.receive({...hit(),kind:'arm'},enemy());assert.equal(s.api.read().active,0);assert.equal(s.api.read().poses,0);
 other.count=10;s.cfg.crowd=250;for(let i=0;i<100;i++)s.api.receive(hit(),enemy(),source());assert.ok(s.api.read().active+other.count<=28);
});
test('lightning and gun poses take priority, with electric contacts delegated instead of duplicated',()=>{
 const s=setup(),e=enemy();s.api.receive(hit(),e,source());s.advance(.02);assert.ok(s.api.pose(e));e.arcShockV576={age:.01,life:.23};assert.equal(s.api.pose(e),null);
 const count=s.api.read().active;s.api.receive(hit('arc'),e);assert.equal(s.api.read().arc,1);assert.equal(s.api.read().active,count);assert.equal(s.api.read().poses,0);
 delete e.arcShockV576;s.api.receive(hit('tail'),e,source('tail'));s.advance(.02);s.other.pose={sx:.9};assert.equal(s.api.pose(e),null);
});
test('reduced motion disables body deformation and ends local effects promptly',()=>{
 const s=setup({reducedMotion:true}),e=enemy();s.api.receive(hit(),e,source());s.advance(.02);assert.equal(s.api.pose(e),null);s.advance(.06);assert.equal(s.api.read().active,0);
});
test('existing high-resolution atlases are cropped safely and flash intensity is respected',async()=>{
 const s=setup({flash:0});await s.api.ready;const calls=[],ctx={save(){},restore(){},translate(){},rotate(){},drawImage(...v){calls.push(v);}};
 s.api.receive(hit(),enemy(),source());s.api.receive(hit('tail',60),enemy(),source('tail',1));for(let i=0;i<3;i++){s.api.draw(ctx);s.advance(.025);}
 assert.ok(calls.length>=4);for(const c of calls){assert.ok(c[1]>=0&&c[2]>=0&&c[1]+c[3]<=1774&&c[2]+c[4]<=887);assert.ok(c[3]>400);assert.ok(c[7]<c[5]||c[7]>0);}
 assert.ok(ctx.globalAlpha<=.48);
});
const info=JSON.parse(read('docs/step06/PACKAGE_V613.json')),before=read('dist/'+info.baseline_engine),after=read('dist/'+info.engine);
function section(s,from,to){const start=s.indexOf(from);assert.ok(start>=0,from);const end=s.indexOf(to,start+from.length);assert.ok(end>start,to);return s.slice(start,end);}
function fixture(code,mode,wall=false){
 const box={Math,Set,Map,console,player:{x:0,y:0},targets:[],calls:[],observed:[],wall};vm.createContext(box);
 vm.runInContext(read('web/organ-skill-model-v598.js')+`
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const organRunV598={hits:{shell:0,tail:0,mouth:0},dots:new Map(),projectiles:[],whips:[],breaths:[],cooldowns:{shell:1,tail:1,mouth:1}};
 let organHitSourceV613=null;
 function withOrganHitSourceV613(kind,angle,callback){const old=organHitSourceV613;organHitSourceV613={kind,angle,direct:true};try{return callback();}finally{organHitSourceV613=old;}}
 const playerTargetV586=e=>!!e&&!e.dead&&e.hp>0;
 function hurtEnemy(e,n,kind){const absorb=Math.min(e.barrier||0,n);e.barrier=(e.barrier||0)-absorb;e.hp-=n-absorb;if(e.hp<=0)e.dead=true;calls.push({n,kind});if(organHitSourceV613)observed.push({...organHitSourceV613});}
 const enemyEachCandidateCircleV425=(x,y,r,fn)=>{for(const e of targets)fn(e);};
 const terrainHitV418=()=>wall;
 const compactArrayV426=(list,keep)=>{const good=list.filter(keep);list.splice(0,list.length,...good);};
 const organSpecV598=()=>({enabled:false});
 `,box);
 for(const [a,b] of [['function organNearestV598(', '\nfunction organElementV598('],['function organElementV598(', '\nfunction organHitV598('],['function organHitV598(', '\nfunction organCastV598('],['function organProjectileStepV598(', '\nfunction organWhipStepV598('],['function organWhipStepV598(', '\nfunction organStepV598('],['function organStepV598(', '\nfunction drawOrganNeedleV598(']])vm.runInContext(section(code,a,b),box);
 const result=vm.runInContext(`
 targets.push({x:${mode==='tail'?20:45},y:0,r:8,hp:100,maxHp:100,kx:0,ky:0,dead:false},{x:${mode==='tail'?28:72},y:0,r:8,hp:100,maxHp:100,kx:0,ky:0,dead:false});
 const s=ORGAN_SKILL_MODEL_V598.spec('${mode==='tail'?'tail':'shell'}',3,{spikePierce:2},'${mode==='tail'?'whip':'spike'}');
 let moving;
 if('${mode}'==='spike') {moving={x:0,y:0,angle:0,life:1,remaining:200,organ:'shell',hitsLeft:3,hit:new Set(),target:targets[0],s:{...s,damage:17}};for(let i=0;i<20;i++)if(!organProjectileStepV598(moving,.01))break;}
 else if('${mode}'==='tail'){moving={age:0,aim:0,targets:new Set(),s:{...s,damage:19}};for(let i=0;i<36;i++)organWhipStepV598(moving,.01);}
 else {organRunV598.dots.set(targets[0],{left:1,clock:0,dps:8,organ:'shell'});for(let i=0;i<10;i++)organStepV598(.1);}
 JSON.stringify({targets,calls,hits:organRunV598.hits,moving:moving?{x:moving.x,y:moving.y,angle:moving.angle,life:moving.life,remaining:moving.remaining,hitsLeft:moving.hitsLeft,age:moving.age}:null});`,box);
 return {result:JSON.parse(result),observed:box.observed};
}
test('actual projectile, swept-whip and DOT functions preserve V612 damage, pierce, motion and knockback',()=>{
 for(const mode of ['spike','tail','dot'])for(const wall of [false,true]){const old=fixture(before,mode,wall),next=fixture(after,mode,wall);assert.deepEqual(next.result,old.result,mode+' wall='+wall);if(mode==='dot'||wall)assert.equal(next.observed.length,0);else assert.ok(next.observed.length>0);}
});
test('all visual hooks reverse to the exact baseline and core damage/lightning simulation remain identical',()=>{
 const manifest=JSON.parse(read('docs/step06/ENGINE_PATCHES.json'));let restored=after.replace(manifest.addition,'');for(const [a,b] of [...manifest.patches].reverse()){assert.equal(restored.split(b).length,2);restored=restored.replace(b,a);}assert.equal(restored,before);
 assert.equal(crypto.createHash('sha256').update(after).digest('hex'),path.basename(info.engine,'.js'));
 assert.equal(section(after,'function hurtEnemyCoreV601(', '\nfunction hurtEnemy('),section(before,'function hurtEnemyCoreV601(', '\nfunction hurtEnemy('));
 assert.equal(section(after,'function createCampaignLightningV576(', '\nconst lightningImageV576='),section(before,'function createCampaignLightningV576(', '\nconst lightningImageV576='));
 assert.ok(after.includes('organHitFeedbackV613.draw(ctx);drawAttackWarningsV582();'));
});
test('actual hit-source context restores correctly after nested callbacks and exceptions',()=>{
 const box={};vm.createContext(box);vm.runInContext('let organHitSourceV613=null;'+section(read('web/organ-hit-adapter-v613.js'),'function withOrganHitSourceV613(', '\nconst organHitFeedbackV613=')+`
 this.check=()=>{const log=[];try{withOrganHitSourceV613('spike',1,()=>{log.push(organHitSourceV613.kind);try{withOrganHitSourceV613('tail',2,()=>{throw Error('expected');});}catch(e){log.push(organHitSourceV613.kind);}throw Error('outer');});}catch(e){log.push(organHitSourceV613);}return JSON.stringify(log);};`,box);
 assert.deepEqual(JSON.parse(box.check()),['spike','spike',null]);
});
