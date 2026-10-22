const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const env={};vm.createContext(env);vm.runInContext(fs.readFileSync(__dirname+'/../web/red-pulse-v579.js','utf8').split('const redPulseImageV579=')[0],env);
let active=true,blocked=false,site=null,p={x:0,y:0},list=[],hits=[];
const host={active:()=>active,blocked:()=>blocked,device:()=>site&&!site.claimed?site:null,spawn:()=>site={x:0,y:0,r:24,hold:0,claimed:false},player:()=>p,view:()=>({l:-100,r:100,t:-100,b:100}),enemies:()=>list,damage:e=>{hits.push(e);e.hp-=50},kick(){}};
const api=env.createRedPulseDeviceV579(host);
api.ensure();assert.equal(api.read().spawned,1);for(let i=0;i<100;i++)api.ensure();assert.equal(api.read().spawned,1);
api.step(2);assert.equal(site.hold,2);p.x=25;api.step(.01);assert.equal(site.hold,0);p.x=0;
const inside={x:75,y:0,r:5,hp:100},outside={x:150,y:0,r:5,hp:100},arriving={x:20,y:0,r:5,hp:100,arrivalInvuln:true};list=[inside,outside,arriving];
api.step(2.99);assert.equal(api.read().detonations,0);active=false;const before=JSON.stringify(api.read());api.step(5);assert.equal(JSON.stringify(api.read()),before);active=true;api.step(.01);assert.equal(api.read().detonations,1);assert.equal(hits.length,0);
api.step(.15);assert.equal(hits.length,1);assert.equal(hits[0],inside);api.step(.8);assert.equal(hits.length,1);assert.equal(outside.hp,100);assert.equal(arriving.hp,100);
for(let i=0;i<18;i++)api.step(1);assert.equal(api.read().spawned,1);api.step(1.1);assert.equal(api.read().spawned,2);blocked=true;api.step(9);assert.equal(api.read().detonations,1);assert.equal(site.hold,0);
api.reset();site=null;blocked=true;api.ensure();assert.equal(api.read().spawned,0);
console.log(JSON.stringify({ok:true,checks:['one active device','three continuous seconds and leave resets','pause freezes charging and cooldown','expanding front applies one hit','offscreen and arrival invulnerability excluded','20-second respawn','boss arena disables field devices']}));
const arena={};vm.createContext(arena);vm.runInContext(fs.readFileSync(__dirname+'/../web/centered-arena-v579.js','utf8').split('function placePlayerNearArenaCenterV579')[0],arena);
for(const [width,worldWidth,worldHeight]of [[393,1728,3072],[844,1728,3072],[360,900,1200]]){const a=arena.centeredArenaLayoutV579(width,worldWidth,worldHeight);assert.equal(a.x,worldWidth/2);assert.equal(a.y,worldHeight/2);assert.equal((a.l+a.r)/2,worldWidth/2);assert.equal((a.t+a.b)/2,worldHeight/2);for(const r of [7,12,38])for(const p of arena.centeredArenaEdgesV579({...a,half:12},r)){assert.ok(p.x>=a.l+12+r&&p.x<=a.r-12-r&&p.y>=a.t+12+r&&p.y<=a.b-12-r);const d=Math.min(p.x-a.l,a.r-p.x,p.y-a.t,a.b-p.y);assert.ok(Math.abs(d-(12+r+18))<1e-6)}}
console.log(JSON.stringify({ok:true,checks:['map-centered arena in portrait and landscape','reinforcements confined to inner edge with body padding']}));
