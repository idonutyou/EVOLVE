#!/usr/bin/env node
'use strict';

// All printed values are deterministic trial scenarios, not forecasts or payment results.
const {simulatePlayer,packComparisons,hypotheticalCash}=require('../monetization/economy/scenario-model.cjs');
const {simulateCollection}=require('../monetization/economy/collection-model.cjs');
const {exampleSensitivity}=require('../monetization/economy/finance-model.cjs');
const player=(options)=>{const r=simulatePlayer({days:7,...options});return {assumptions:r.assumptions,
  day3:r.daily[2],day7:r.daily[6],trialChargeKRW:r.paidGrossKRW};};
const plan=[{day:1,sku:'starter_genome_once'},{day:29,sku:'mutation_crystal_small'},
  {day:57,sku:'mutation_crystal_small'}];
const collection=(options)=>{const r=simulateCollection({days:84,...options});return {assumptions:r.assumptions,
  freeEarned:r.freeEarned,paidEarned:r.paidEarned,freeSpent:r.freeSpent,paidSpent:r.paidSpent,
  trialChargeKRW:r.gross,last:r.daily.at(-1),obtained:r.obtained};};
const out={
  kind:'SIMULATION_ONLY',
  warning:'Assumed inputs, not gameplay telemetry, actual payments, legal/tax advice or projected profits.',
  baseline:{
    free20:player({minutesPerDay:20}),
    free60:player({minutesPerDay:60}),
    cosmetic20:player({minutesPerDay:20,starterPurchase:true}),
    lowWin20:player({minutesPerDay:20,wins:[true,false,false]})
  },
  collection:{
    freeWeeklyThemes:collection({releaseEveryDays:7}),
    paidWeeklyThemes:collection({releaseEveryDays:7,purchasePlan:plan}),
    paidMonthlyThemes:collection({releaseEveryDays:28,purchasePlan:plan}),
    freeFiveDaysPerWeek:collection({releaseEveryDays:7,attendance:[true,true,true,true,true,false,false],weeklyGoal:5})
  },
  packComparisons:packComparisons(),
  starterCashExample:hypotheticalCash({sku:'starter_genome_once',count:1}),
  financeSensitivity:exampleSensitivity()
};
process.stdout.write(JSON.stringify(out,null,2)+'\n');
