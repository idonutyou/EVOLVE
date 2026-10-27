'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {config, assertDraft, nextResearchCost, purchaseResearch, firstClearReward,
  oneKillReward, performanceBonus, evaluateRun} = require('../monetization/economy/economy-core.cjs');

test('draft mode rejects live purchase and ledger flags', () => {
  assert.equal(assertDraft().mode, 'SIMULATION_ONLY');
  for (const key of ['checkout_enabled', 'client_grants_enabled', 'merchant_connected', 'backend_ledger_connected']) {
    assert.throws(() => assertDraft({...config, [key]: true}), /simulation-only/);
  }
});

test('research costs match observed engine examples, maxima, and full total', () => {
  assert.deepEqual([0,1,2,3,4].map((rank) => nextResearchCost('hp', rank)), [25,40,70,105,150]);
  assert.deepEqual([0,1,2].map((rank) => nextResearchCost('reroll', rank)), [70,125,210]);
  assert.equal(nextResearchCost('reroll', 3), null);
  const total = config.dna.research.reduce((sum, r) =>
    sum + Array.from({length:r.max_rank}, (_, rank) => nextResearchCost(r.id, rank)).reduce((a,b)=>a+b,0), 0);
  assert.equal(total, 2590);
});

test('research is locked by clears, requires enough DNA, and cannot exceed max rank', () => {
  assert.equal(purchaseResearch({id:'speed',rank:0,clears:0,dna:100}).reason, 'locked');
  assert.equal(purchaseResearch({id:'speed',rank:0,clears:1,dna:24}).reason, 'insufficient');
  assert.deepEqual(purchaseResearch({id:'speed',rank:0,clears:1,dna:25}),
    {purchased:true,cost:25,rank:1,dna:0});
  assert.equal(purchaseResearch({id:'speed',rank:5,clears:1,dna:100}).reason, 'maxed');
});

test('first clear rewards match source and never recur on the same stage', () => {
  assert.deepEqual([1,2,5,10,15,16].map((s)=>firstClearReward(s)), [38,27,147,172,312,117]);
  assert.equal(firstClearReward(5, true), 0);
});

test('kill DNA rounds per kill and applies the seventh-kill rule to the global kill index', () => {
  assert.equal(oneKillReward({kind:'regular',killIndex:6}), 0);
  assert.equal(oneKillReward({kind:'regular',killIndex:7}), 1);
  assert.equal(oneKillReward({kind:'elite',killIndex:8,chain:25}), 15);
  assert.equal(oneKillReward({kind:'boss',killIndex:9}), 40);
  assert.equal(oneKillReward({kind:'apex',killIndex:10}), 100);
});

test('skill bonus applies win, defeat, and stage cap correctly', () => {
  assert.equal(performanceBonus({stage:1,won:true,perfectDodges:1,riftSuccess:1,hpRatio:.65}), 13);
  assert.equal(performanceBonus({stage:1,won:false,perfectDodges:1,riftSuccess:1,hpRatio:.65}), 3);
  assert.equal(performanceBonus({stage:1,won:true,rapidWaves:100,perfectDodges:100,maxChain:100,
    blueprint:true,nemesis:true,riftSuccess:1,hpRatio:1}), 38);
});

const sample = { kills:[{kind:'regular',count:84},{kind:'brute',count:4},{kind:'special',count:2},
  {kind:'elite',count:1}], chests:1, riftTiers:[1], waves:[{index:0,rapid:false}],
  metrics:{perfectDodges:1,riftSuccess:1,hpRatio:.7} };

test('documented first three trial runs reproduce 331 DNA without double-counting', () => {
  const a=evaluateRun({...sample,stage:1,won:true});
  const b=evaluateRun({...sample,stage:2,won:true});
  const c=evaluateRun({...sample,stage:3,won:false});
  assert.deepEqual([a.bank,a.firstClearBonus,a.totalDna], [90,38,128]);
  assert.deepEqual([b.bank,b.firstClearBonus,b.totalDna], [92,27,119]);
  assert.deepEqual([c.bank,c.firstClearBonus,c.totalDna], [84,0,84]);
  assert.equal(a.totalDna+b.totalDna+c.totalDna,331);
});

test('a repeat clear banks the run but does not grant the stage first-clear bonus again', () => {
  const first=evaluateRun({...sample,stage:1,won:true});
  const replay=evaluateRun({...sample,stage:1,won:true,alreadyClaimed:true});
  assert.equal(replay.bank,first.bank);
  assert.equal(replay.firstClearBonus,0);
});

test('rejects invalid stage, negative balances and invalid event input', () => {
  assert.throws(() => firstClearReward(0), RangeError);
  assert.throws(() => firstClearReward(100), RangeError);
  assert.throws(() => purchaseResearch({id:'hp',rank:0,clears:0,dna:-1}), RangeError);
  assert.throws(() => oneKillReward({kind:'unknown',killIndex:1}), RangeError);
  assert.throws(() => evaluateRun({stage:1,won:true,chests:NaN}), RangeError);
});
