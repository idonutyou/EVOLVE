'use strict';

const {config,assertDraft} = require('./economy-core.cjs');

function positiveInteger(n, name, min, max) {
  if (!Number.isSafeInteger(n) || n<min || n>max) throw new RangeError(`${name} out of range`);
}

// Inventory simulation only. A hypothetical new theme is released periodically.
// Attendance, purchasing intent, rewards, price and supply are inputs, not predictions.
function simulateCollection({days=84, releaseEveryDays=7, maxThemes=100, themeCost=150,
  dailyCrystals=5, weeklyCrystals=10, weeklyGoal=7, attendance=[true],
  purchasePlan=[], consumeOrder='paid_first'}={}) {
  assertDraft();
  positiveInteger(days,'days',1,365);
  positiveInteger(releaseEveryDays,'releaseEveryDays',1,365);
  positiveInteger(maxThemes,'maxThemes',0,1000);
  positiveInteger(themeCost,'themeCost',1,100000);
  positiveInteger(dailyCrystals,'dailyCrystals',0,100000);
  positiveInteger(weeklyCrystals,'weeklyCrystals',0,100000);
  positiveInteger(weeklyGoal,'weeklyGoal',1,7);
  if (!Array.isArray(attendance)||!attendance.length||attendance.some(v=>typeof v!=='boolean')) {
    throw new TypeError('attendance must be a nonempty boolean sequence');
  }
  if (!Array.isArray(purchasePlan)) throw new TypeError('purchasePlan must be an array');
  if (!['paid_first','free_first'].includes(consumeOrder)) throw new RangeError('invalid consumeOrder');
  const plan=purchasePlan.map(entry=>{
    if (!entry || typeof entry!=='object') throw new TypeError('invalid planned purchase');
    positiveInteger(entry.day,'purchase day',1,days);
    const product=config.premium_draft.sku_candidates.find(p=>p.sku===entry.sku);
    if (!product || !['starter_genome_once','mutation_crystal_small','mutation_crystal_mid'].includes(entry.sku)) {
      throw new RangeError('unsupported currency pack');
    }
    return {day:entry.day,sku:entry.sku,crystals:product.crystals,price:product.price_krw};
  });
  if (plan.filter(p=>p.sku==='starter_genome_once').length>1) throw new Error('trial starter is limited to one per account');
  let free=0,paid=0,freeEarned=0,paidEarned=0,freeSpent=0,paidSpent=0,gross=0,weekDone=0;
  let nextTheme=1;
  const daily=[],obtained=[];
  for (let day=1;day<=days;day++) {
    const present=attendance[(day-1)%attendance.length];
    if (present) {free+=dailyCrystals;freeEarned+=dailyCrystals;weekDone++;}
    if (day%7===0) {
      if (weekDone>=weeklyGoal) {free+=weeklyCrystals;freeEarned+=weeklyCrystals;}
      weekDone=0;
    }
    for (const event of plan.filter(p=>p.day===day)) {
      paid+=event.crystals;paidEarned+=event.crystals;gross+=event.price;
    }
    const released=Math.min(maxThemes,Math.floor((day-1)/releaseEveryDays)+1);
    while(nextTheme<=released && free+paid>=themeCost) {
      let need=themeCost,paidUsed=0,freeUsed=0;
      if (consumeOrder==='paid_first') {
        paidUsed=Math.min(need,paid);need-=paidUsed;freeUsed=need;
      } else {
        freeUsed=Math.min(need,free);need-=freeUsed;paidUsed=need;
      }
      free-=freeUsed;paid-=paidUsed;freeSpent+=freeUsed;paidSpent+=paidUsed;
      obtained.push({theme:nextTheme,day,freeUsed,paidUsed});
      nextTheme++;
    }
    daily.push({day,released,owned:obtained.length,unowned:released-obtained.length,
      free,paid,gross});
  }
  return {kind:'SIMULATION_ONLY', assumptions:{days,releaseEveryDays,maxThemes,themeCost,
    dailyCrystals,weeklyCrystals,weeklyGoal,attendance,purchasePlan,consumeOrder},
    freeEarned,paidEarned,freeSpent,paidSpent,gross,obtained,daily};
}
module.exports={simulateCollection};
