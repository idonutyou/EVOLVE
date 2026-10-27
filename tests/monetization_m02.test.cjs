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

const {simulatePlayer,packComparisons,hypotheticalCash} = require('../monetization/economy/scenario-model.cjs');

test('seven-day hypothetical examples match the independently calculated design table', () => {
  const short=simulatePlayer({days:7,minutesPerDay:20});
  const long=simulatePlayer({days:7,minutesPerDay:60});
  const d1=short.daily[0],d3=short.daily[2],d7=short.daily[6],l7=long.daily[6];
  assert.deepEqual([d1.runs,d1.clears,d1.totalDna,d1.spentDna,d1.dna,d1.researchRanks],[3,2,331,310,21,9]);
  assert.deepEqual([d3.runs,d3.clears,d3.totalDna,d3.spentDna,d3.dna,d3.researchRanks],[9,6,1184,1140,44,19]);
  assert.deepEqual([d7.runs,d7.clears,d7.totalDna,d7.spentDna,d7.dna,d7.researchRanks],[21,14,3139,2590,549,28]);
  assert.deepEqual([l7.runs,l7.clears,l7.totalDna,l7.spentDna,l7.dna,l7.researchRanks],[63,42,11675,2590,9085,28]);
});

test('a trial cosmetic purchase changes cosmetic access, not DNA or research', () => {
  const free=simulatePlayer({days:7,minutesPerDay:20});
  const paid=simulatePlayer({days:7,minutesPerDay:20,starterPurchase:true});
  const a=free.daily[6],b=paid.daily[6];
  assert.deepEqual([a.totalDna,a.dna,a.researchRanks,a.clears],[b.totalDna,b.dna,b.researchRanks,b.clears]);
  assert.equal(a.boughtThemeDay,null); assert.equal(b.boughtThemeDay,1);
  assert.equal(b.freeCrystals,45); assert.equal(b.paidCrystals,0); assert.equal(paid.paidGrossKRW,2200);
});

test('the free crystal route reaches the 150-crystal theme on day 24 under full completion', () => {
  const r=simulatePlayer({days:24,minutesPerDay:0});
  assert.equal(r.daily[22].boughtThemeDay,null);
  assert.equal(r.daily[23].boughtThemeDay,24);
  assert.equal(r.daily[23].freeCrystals,0);
});

test('package pricing and hypothetical processing/refund assumptions are explicit', () => {
  const p=packComparisons();
  assert.equal(p.smallPerCrystal,16.5); assert.ok(Math.abs(p.midExtraVersusEqualPriceSmall-.125)<1e-10);
  const noRefund=hypotheticalCash({sku:'starter_genome_once',count:1});
  assert.ok(Math.abs(noRefund.remainingBeforeOtherCosts-1917.72)<1e-7);
  const feeRetained=hypotheticalCash({sku:'starter_genome_once',count:2,refunds:1,feesOnRefundedOrders:true});
  const feeReversed=hypotheticalCash({sku:'starter_genome_once',count:2,refunds:1,feesOnRefundedOrders:false});
  assert.ok(feeReversed.remainingBeforeOtherCosts>feeRetained.remainingBeforeOtherCosts);
  assert.equal(feeRetained.notOperatingProfit,true);
});

test('rejects invalid or excessive simulation and sale assumptions', () => {
  assert.throws(()=>simulatePlayer({days:0}),RangeError);
  assert.throws(()=>simulatePlayer({days:2,wins:[]}),TypeError);
  assert.throws(()=>hypotheticalCash({sku:'missing',count:1}),RangeError);
  assert.throws(()=>hypotheticalCash({sku:'starter_genome_once',count:1,refunds:2}),RangeError);
});

const {simulateCollection} = require('../monetization/economy/collection-model.cjs');

test('research outcome distinguishes no upgrade from reaching the research cap', () => {
  const none=simulatePlayer({days:7,minutesPerDay:0,completeDaily:false});
  assert.equal(none.daily[2].researchStatus,'no_upgrade_insufficient_or_no_spend');
  assert.equal(none.daily[6].researchRanks,0);
  const full=simulatePlayer({days:7,minutesPerDay:20});
  assert.equal(full.daily[2].researchStatus,'upgraded');
  assert.equal(full.daily[6].researchStatus,'all_maxed');
});

test('84-day collection conserves free/paid crystals and never purchases a theme twice', () => {
  const r=simulateCollection({days:84}); const last=r.daily.at(-1);
  assert.deepEqual([r.freeEarned,r.paidEarned,last.released,last.owned,last.free,last.paid],[540,0,12,3,90,0]);
  assert.equal(r.freeEarned-r.freeSpent,last.free);
  assert.equal(r.paidEarned-r.paidSpent,last.paid);
  assert.equal(new Set(r.obtained.map(x=>x.theme)).size,r.obtained.length);
});

test('content supply limits actual consumption even when a player has paid balance', () => {
  const purchasePlan=[{day:1,sku:'starter_genome_once'},{day:29,sku:'mutation_crystal_small'},
    {day:57,sku:'mutation_crystal_small'}];
  const weekly=simulateCollection({days:84,releaseEveryDays:7,purchasePlan});
  const monthly=simulateCollection({days:84,releaseEveryDays:28,purchasePlan});
  assert.deepEqual([weekly.daily.at(-1).released,weekly.daily.at(-1).owned],[12,7]);
  assert.deepEqual([monthly.daily.at(-1).released,monthly.daily.at(-1).owned],[3,3]);
  assert.equal(weekly.gross,8800); assert.equal(monthly.gross,8800);
  assert.ok(monthly.daily.at(-1).free+monthly.daily.at(-1).paid > weekly.daily.at(-1).free+weekly.daily.at(-1).paid);
});

test('a five-of-seven attendance pattern uses an explicit weekly goal', () => {
  const r=simulateCollection({days:84,attendance:[true,true,true,true,true,false,false],weeklyGoal:5});
  assert.equal(r.freeEarned,420);
  assert.equal(r.daily.at(-1).owned,2);
  assert.equal(r.daily.at(-1).free,120);
});

test('trial collection rejects repeat starter purchases and invalid schedules', () => {
  assert.throws(()=>simulateCollection({purchasePlan:[{day:1,sku:'starter_genome_once'},{day:2,sku:'starter_genome_once'}]}),/limited/);
  assert.throws(()=>simulateCollection({purchasePlan:[{day:1000,sku:'mutation_crystal_small'}]}),RangeError);
  assert.throws(()=>simulateCollection({releaseEveryDays:0}),RangeError);
});
