const assert=require('node:assert/strict'),m=require('../web/organ-skill-model-v598.js');
for(const organ of ['shell','tail','mouth'])assert.equal(m.spec(organ,0,{}).enabled,false);
assert.equal(m.segmentHit({x:0,y:0},{x:120,y:0},{x:58,y:0,r:8},2),58/120,'fast shots must hit an enemy between endpoints');
assert.equal(m.segmentHit({x:0,y:0},{x:120,y:0},{x:58,y:11,r:8},2),null,'nearby enemies outside the projectile do not get hit');
assert.equal(m.segmentHit({x:0,y:0},{x:0,y:0},{x:0,y:0,r:8},2),0,'a stationary contact has finite geometry');
const base=m.spec('shell',1,{}),grown=m.spec('shell',3,{spikeCount:3,spikePierce:2,spikeHaste:1,spikeRange:.5});assert.equal(base.count,1);assert.equal(base.hits,1);assert.equal(base.mode,'homing');assert.ok(grown.count>base.count&&grown.hits>base.hits&&grown.cooldown<base.cooldown&&grown.range>base.range);
const center={x:0,y:0},front={x:50,y:0,r:3},back={x:-50,y:0,r:3};
assert.equal(m.sweepWindow(.03,.02,Math.PI),null,'tail anticipation cannot damage');
assert.ok(m.sweepHit(center,0,82,m.sweepWindow(.35,.35,125*Math.PI/180),front));assert.equal(m.sweepHit(center,0,82,m.sweepWindow(.35,.35,125*Math.PI/180),back),false);
const full=m.spec('tail',5,{whipArc:400});assert.equal(full.arc,Math.PI*2);assert.ok(m.sweepHit(center,0,82,m.sweepWindow(.35,.35,full.arc),back));assert.equal(m.sweepHit(center,0,82,m.sweepWindow(.35,.35,full.arc),{x:100,y:0,r:3}),false,'a full-circle whip still has a finite radius');
assert.equal(m.spec('mouth',1,{},'fire_breath').mode,'breath');assert.equal(m.spec('mouth',0,{},'fire_breath').enabled,false);assert.equal(m.spec('mouth',1,{},'poison_spike').mode,'projectile','wrong-slot variants fall back to the organ default');
assert.equal(m.spec('shell',99,{spikeCount:1e6}).count,12);
console.log(JSON.stringify({ok:true,checks:['unlearned attacks disabled','swept projectile collision and off-path exclusion','single-contact homing spike and meaningful projectile growth','whip anticipation, actual swept arc and finite full-circle range','item profile/slot isolation and hard projectile bounds']}));

const firstTail=m.spec('tail',1,{}),secondTail=m.spec('tail',2,{whipRange:.12});assert.equal(firstTail.radius,30);assert.ok(secondTail.radius>firstTail.radius&&secondTail.radius-firstTail.radius<5);assert.equal(m.spec('tail',999,{whipRange:999}).radius,90);
