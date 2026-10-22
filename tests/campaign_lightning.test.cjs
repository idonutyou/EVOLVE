const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/../web/lightning-v576.js','utf8').split('const lightningImageV576=')[0],env={};vm.createContext(env);vm.runInContext(source,env);
let paused=false,p={x:0,y:0,look:0},list=[],hits=[],blocked=false;
const host={active:()=>!paused,player:()=>p,enemies:()=>list,range:()=>220,focus:()=>null,face:a=>p.look=a,hops:()=>7,damage:s=>s?80:26,interval:()=>.94,fieldSize:()=>450,texture:()=>null,kick:()=>{},canLink:(a,b)=>!b.wall,damageEnemy:(e,n,strong,a)=>{e.hp-=n;hits.push({e,n,strong,a})}};
const a=env.createCampaignLightningV576(host),make=(x,y=0)=>({x,y,hp:1000,maxHp:1000,r:12,kx:0,ky:0});
function setup(){a.reset();paused=false;hits=[];p.x=p.y=0;list=[make(80),make(145,25),make(300)];}
setup();assert.ok(a.castChain(false));a.step(.08);assert.equal(hits.length,0);a.step(.006);assert.equal(hits.length,1);assert.ok(a.holdEnemy(list[0]));assert.ok(a.pose(list[0]));const weak=Math.hypot(list[0].kx,list[0].ky);assert.ok(a.read().cast);p.x+=3;assert.ok(a.holdEnemy(list[0]));a.step(.06);assert.equal(hits.length,2);assert.equal(hits[0].e,list[0]);assert.equal(hits[1].e,list[1]);assert.equal(list[2].hp,1000);
setup();assert.ok(a.castChain(true));a.step(.12);assert.equal(hits.length,0);a.step(.006);assert.equal(hits.length,1);assert.ok(Math.hypot(list[0].kx,list[0].ky)>weak*1.8);assert.ok(list[0].arcShockV576.hold>.05);assert.equal(hits[0].n,80);
paused=true;const frozen=JSON.stringify(a.read());a.step(1);assert.equal(JSON.stringify(a.read()),frozen);paused=false;
setup();list[0].wall=true;list[1].wall=true;assert.equal(a.castChain(true),false);assert.equal(hits.length,0);
setup();list[1].arrivalInvuln=true;a.castChain(false);a.step(.2);assert.equal(hits.length,1);assert.equal(hits[0].e,list[0]);
setup();a.castChain(true);list[0].dead=true;a.step(.2);assert.equal(hits.length,1);assert.equal(hits[0].e,list[1]);a.reset();assert.equal(a.read().queued,0);assert.equal(a.read().cast,null);assert.equal(a.read().contacts,0);
console.log(JSON.stringify({ok:true,checks:['delayed contacts and ordered unique chain','range and terrain wall exclusion','arrival invulnerability','strong recoil and anticipation','target-local hold and independent player position','pause and restart','dead targets skip safely']}));
