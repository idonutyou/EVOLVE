'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const S=require('../web/m08-stage-mission-v622.js'),R=require('../web/m08-runtime-missions-v623.js');
let now=Date.parse('2026-10-28T14:59:59Z'),game={enabled:false,normal:{unlocked:4}};
let ui={home:true,battleActive:false,resultVisible:false,codexVisible:false,codexCount:null};
const data=new Map([['EVOLVE_V575_PRESERVE','ORIGINAL_SAVE'],['EVOLVE_SHOP_EXPERIENCE_V621_V1','SHOP_SAVE']]);
const storage={getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,v)};
const stage=S.createTracker({storage,readGame:()=>game,clock:()=>now});
const run=R.createObserver({storage,readGame:()=>game,readUi:()=>ui,clock:()=>now});
assert.equal(stage.poll().total,0);assert.equal(run.poll().runEnds,0);
ui.codexVisible=true;ui.codexCount={count:2,total:30};
assert.equal(run.poll().discoveries,0);
ui.codexCount={count:3,total:30};assert.equal(run.poll().discoveries,1);
assert.equal(run.poll().discoveries,1);
game.normal.unlocked=5;assert.equal(stage.poll().total,1);assert.equal(stage.poll().total,1);
ui.home=false;ui.battleActive=true;ui.codexVisible=false;ui.codexCount=null;run.poll();
ui.battleActive=false;ui.resultVisible=true;assert.equal(run.poll().runEnds,1);
assert.equal(run.poll().runEnds,1);
assert.equal(S.createTracker({storage,readGame:()=>game,clock:()=>now}).snapshot().total,1);
assert.equal(R.createObserver({storage,readGame:()=>game,readUi:()=>ui,clock:()=>now}).snapshot().runEnds,1);
ui.resultVisible=false;ui.home=true;game.enabled=true;game.normal.unlocked=6;
assert.equal(stage.poll().reason,'ADMIN_IGNORED');run.poll();
ui.home=false;ui.battleActive=true;run.poll();ui.battleActive=false;ui.resultVisible=true;
assert.equal(run.poll().runEnds,1);
game.enabled=false;ui.home=true;ui.resultVisible=false;run.poll();game.normal.unlocked=7;
assert.equal(stage.poll().total,2);
now=Date.parse('2026-10-28T15:00:00Z');
assert.equal(stage.snapshot().completedToday,false);assert.equal(run.snapshot().todayRuns,0);
assert.equal(run.snapshot().todayDiscoveries,0);
assert.equal(data.get('EVOLVE_V575_PRESERVE'),'ORIGINAL_SAVE');
assert.equal(data.get('EVOLVE_SHOP_EXPERIENCE_V621_V1'),'SHOP_SAVE');
for(const [key,badCall,goodCall] of [
 [S.storageKey,()=>stage.poll(),()=>run.snapshot().discoveries],
 [R.storageKey,()=>run.poll(),()=>stage.snapshot().total]]){
 const old=data.get(key);data.set(key,'{corrupt');assert.throws(badCall);
 assert.equal(data.get(key),'{corrupt');assert.ok(goodCall()>=1);data.set(key,old);
}
const web1=fs.readFileSync(path.join(__dirname,'../web/m08-stage-mission-v622.js'),'utf8'),
 web2=fs.readFileSync(path.join(__dirname,'../web/m08-runtime-missions-v623.js'),'utf8'),
 html=fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8');
assert.equal(web1,fs.readFileSync(path.join(__dirname,'../dist/m08-stage-mission-v622.js'),'utf8'));
assert.equal(web2,fs.readFileSync(path.join(__dirname,'../dist/m08-runtime-missions-v623.js'),'utf8'));
assert.equal((html.match(/m08-stage-mission-v622\.js\?v=10/g)||[]).length,1);
assert.equal((html.match(/m08-runtime-missions-v623\.js\?v=20/g)||[]).length,1);
assert.ok(html.indexOf('m08-stage-mission-v622.js?v=10')<html.indexOf('m08-runtime-missions-v623.js?v=20'));
assert.ok(!/\b(?:fetch|checkout|claimPremium|claimDaily)\s*\(/.test(web1+web2));
console.log('M08 30% PASS: stage/run/codex integration, admin rejection, KST, save isolation, corruption safety.');
