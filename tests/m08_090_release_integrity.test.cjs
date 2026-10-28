'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const index=read('dist/index.html'),main=read('dist/version.json');
assert.ok(main.length>12,'original build version remains present');
const releaseVersion=JSON.parse(main),report=JSON.parse(read('dist/verification.json'));
assert.equal(releaseVersion.build,report.build,'new release build and verification agree');
assert.ok(index.includes('"build":"'+releaseVersion.build+'"'),'HTML embedded build agrees with version.json');
assert.equal(report.index_bytes,Buffer.byteLength(index),'index byte count updated for public release');

const names=[
 ['shop-experience-v621.js','v=100&m08=40'],
 ['shop-front-v621.js','v=100'],
 ['m08-stage-mission-v622.js','v=10'],
 ['m08-runtime-missions-v623.js','v=20'],
 ['m08-mission-rewards-v624.js','v=100']
];
let last=-1;
for(const [name,version] of names){
 const entry=name+'?'+version;const i=index.indexOf(entry);
 assert.ok(i>last,'script missing/reordered: '+entry);
 assert.equal(index.split(entry).length,2,'single script entry: '+entry);
 last=i;
}
for(const name of ['m08-stage-mission-v622.js','m08-runtime-missions-v623.js','m08-mission-rewards-v624.js','shop-experience-v621.js']){
 const web=read('web/'+name),dist=read('dist/'+name);
 assert.equal(web,dist,'web/dist mirror identical '+name);
 assert.ok(!/\b(?:fetch|XMLHttpRequest|paymentRequest|PaymentRequest)\s*\(/.test(web),'no payment or network path: '+name);
}
const shop=require('../web/shop-experience-v621.js');
const m08=require('../web/m08-mission-rewards-v624.js');
assert.equal(shop.mode,'LOCAL_PREVIEW_NO_BILLING');
assert.equal(m08.mode,'LOCAL_CRYSTALS_NO_BILLING');
assert.equal(shop.missionRewards.stage,10);assert.equal(shop.missionRewards.run,5);
assert.equal(shop.missionRewards.codex,10);
assert.ok(index.includes('data-mission-rewards="claim"'));
assert.ok(index.includes('data-native-shop="native-shop"'));
assert.ok(!index.includes('http://checkout.'));
console.log('M08 90% PASS: correct production script order, mirrored assets, V575 preserved, no external billing, research reward contract.');
