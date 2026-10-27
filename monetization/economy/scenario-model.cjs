'use strict';

const core = require('./economy-core.cjs');
const cfg = core.config;

// This is a deterministic, hypothetical simulation. It never reads a game save,
// accepts a payment, grants a real item, or communicates with a server.
function validInteger(n, name, min = 0, max = 1000000) {
  if (!Number.isSafeInteger(n) || n < min || n > max) throw new RangeError(`${name} is out of range`);
}
function trialEvent(stage, won) {
  return {
    stage, won,
    kills: [{kind:'regular',count:84},{kind:'brute',count:4},{kind:'special',count:2},{kind:'elite',count:1}],
    chests: 1, riftTiers: [1], waves: [{index:0,rapid:false}],
    metrics: {perfectDodges:1,riftSuccess:1,hpRatio:0.7}
  };
}

function simulatePlayer({ days = 7, minutesPerDay = 20, runSeconds = 400,
  wins = [true, true, false], completeDaily = true, starterPurchase = false,
  autoBuyTheme = true, dailyCrystals = cfg.premium_draft.free_daily,
  weeklyCrystals = cfg.premium_draft.free_weekly, eventFactory = trialEvent } = {}) {
  core.assertDraft();
  validInteger(days, 'days', 1, 365);
  validInteger(minutesPerDay, 'minutesPerDay', 0, 1440);
  validInteger(runSeconds, 'runSeconds', 1, 86400);
  validInteger(dailyCrystals, 'dailyCrystals', 0, 100000);
  validInteger(weeklyCrystals, 'weeklyCrystals', 0, 100000);
  if (!Array.isArray(wins) || !wins.length || wins.some(x => typeof x !== 'boolean')) throw new TypeError('wins must be a nonempty boolean array');
  for (const v of [completeDaily,starterPurchase,autoBuyTheme]) if (typeof v !== 'boolean') throw new TypeError('scenario flags must be boolean');
  if (typeof eventFactory !== 'function') throw new TypeError('eventFactory must be a function');
  const runsPerDay = Math.floor(minutesPerDay * 60 / runSeconds);
  if (runsPerDay * days > 10000) throw new RangeError('too many trial runs');
  let stage=1, clears=0, dna=0, totalDna=0, spentDna=0, runs=0, boughtThemeDay=null;
  let freeCrystals=0, paidCrystals=0, charged=0;
  const levels=Object.fromEntries(cfg.dna.research.map(r=>[r.id,0]));
  const claimed=new Set(), daily=[];

  for (let day=1; day<=days; day++) {
    let todayDna=0, todayWins=0;
    if (completeDaily) {
      freeCrystals += dailyCrystals;
      if (day % 7 === 0) freeCrystals += weeklyCrystals;
    }
    if (day === 1 && starterPurchase) {
      const starter=cfg.premium_draft.sku_candidates.find(s=>s.sku==='starter_genome_once');
      paidCrystals += starter.crystals;
      charged += starter.price_krw;
    }
    // One hypothetical theme, consumed from purchased crystals first in this example.
    if (autoBuyTheme && boughtThemeDay===null &&
        freeCrystals+paidCrystals >= cfg.premium_draft.theme_cost) {
      let cost=cfg.premium_draft.theme_cost;
      const fromPaid=Math.min(cost,paidCrystals);
      paidCrystals-=fromPaid; cost-=fromPaid; freeCrystals-=cost;
      boughtThemeDay=day;
    }

    for (let r=0; r<runsPerDay; r++) {
      if (stage > 99) break;
      const won=wins[runs % wins.length];
      const result=core.evaluateRun({...eventFactory(stage,won), stage, won, alreadyClaimed:claimed.has(stage)});
      runs++; todayDna+=result.totalDna; totalDna+=result.totalDna; dna+=result.totalDna;
      if (won) {
        claimed.add(stage);
        clears++; todayWins++; stage++;
      }
      // Greedy order is a documented test input, not a recommended play strategy.
      while (true) {
        const options=cfg.dna.research
          .filter(x=>clears>=x.unlocks_after_clears && levels[x.id]<x.max_rank)
          .map((x,index)=>({id:x.id,cost:core.nextResearchCost(x.id,levels[x.id]),index}))
          .sort((a,b)=>a.cost-b.cost || a.index-b.index);
        if (!options.length || options[0].cost>dna) break;
        const selected=options[0];
        const purchased=core.purchaseResearch({id:selected.id,rank:levels[selected.id],clears,dna});
        if (!purchased.purchased) throw new Error('inconsistent research purchase');
        dna=purchased.dna; spentDna+=purchased.cost; levels[selected.id]=purchased.rank;
      }
    }
    daily.push({day,runs,clears,todayWins,todayDna,totalDna,spentDna,dna,
      researchRanks:Object.values(levels).reduce((a,b)=>a+b,0),
      freeCrystals,paidCrystals,boughtThemeDay});
  }
  return {kind:'SIMULATION_ONLY', assumptions:{days,minutesPerDay,runSeconds,runsPerDay,
    wins,completeDaily,starterPurchase,autoBuyTheme,dailyCrystals,weeklyCrystals},
    paidGrossKRW:charged, levels, daily};
}

function packComparisons() {
  const products=cfg.premium_draft.sku_candidates;
  const pack=(sku)=>products.find(p=>p.sku===sku);
  const small=pack('mutation_crystal_small'), mid=pack('mutation_crystal_mid');
  const equivalentSmallPacks=mid.price_krw/small.price_krw;
  return {kind:'SIMULATION_ONLY', smallPerCrystal:small.price_krw/small.crystals,
    midPerCrystal:mid.price_krw/mid.crystals,
    midExtraVersusEqualPriceSmall:mid.crystals/(small.crystals*equivalentSmallPacks)-1};
}

function hypotheticalCash({sku, count, refunds = 0, feesOnRefundedOrders = true}) {
  core.assertDraft();
  validInteger(count, 'count'); validInteger(refunds, 'refunds', 0, count);
  if (typeof feesOnRefundedOrders !== 'boolean') throw new TypeError('feesOnRefundedOrders must be boolean');
  const p=cfg.premium_draft.sku_candidates.find(x=>x.sku===sku);
  if (!p) throw new RangeError('unknown trial SKU');
  const f=cfg.finance_assumptions;
  const gross=p.price_krw*count, refunded=p.price_krw*refunds, retained=gross-refunded;
  const feeBase=feesOnRefundedOrders ? gross : retained;
  const fee=feeBase*f.processing_fee_rate*(1+f.processing_fee_vat_rate);
  const outputVatReserve=retained*f.sales_vat_inclusive_rate/(1+f.sales_vat_inclusive_rate);
  return {kind:'SIMULATION_ONLY',sku,count,refunds,gross,refunded,fee,outputVatReserve,
    remainingBeforeOtherCosts:retained-fee-outputVatReserve,notOperatingProfit:true};
}

module.exports={trialEvent,simulatePlayer,packComparisons,hypotheticalCash};
