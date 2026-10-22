const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('web/boss-cinematic-v580.js','utf8').split('const cinematicArtV580=')[0],box={};vm.createContext(box);vm.runInContext(source,box);const pose=box.cinematicPoseV580;
assert.equal(pose(-1).time,0);assert.equal(pose(10).time,3);
assert.deepEqual([0,.8,1.5,2.3].map(t=>pose(t).frame),[0,1,2,3]);
assert.deepEqual([0,1,2,2.99].map(t=>pose(t).count),[3,2,1,1]);
assert.equal(pose(.55).blend,0);assert.ok(pose(.65).blend>0&&pose(.65).blend<1);assert.equal(pose(2.9).next,3);
assert.equal(pose(2,true).frame,0);assert.equal(pose(2,true).blend,0);assert.equal(pose(2,true).zoom,1);
console.log(JSON.stringify({ok:true,checks:['3-second bounded timeline','all four painted poses in sequence','native 3-2-1 countdown','smooth bounded transitions','reduced-motion static framing']}));
