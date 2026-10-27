'use strict';

// Offline M02 decision support only. No storage, account, merchant or game integration.
const config = require('./economy-config.draft.json');

function int(value, name, min = 0, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new RangeError(`${name} must be an integer in [${min}, ${max}]`);
  }
  return value;
}

function nonNegative(value, name) {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} must be finite and non-negative`);
  return value;
}

function assertDraft(c = config) {
  if (!c || c.mode !== 'SIMULATION_ONLY' ||
      c.checkout_enabled !== false || c.client_grants_enabled !== false ||
      c.merchant_connected !== false || c.backend_ledger_connected !== false) {
    throw new Error('M02 configuration must remain simulation-only');
  }
  return c;
}
assertDraft();

function researchDefinition(id) {
  const entry = config.dna.research.find((r) => r.id === id);
  if (!entry) throw new RangeError(`unknown research id: ${id}`);
  return entry;
}

function nextResearchCost(id, rank) {
  const def = researchDefinition(id);
  int(rank, 'rank', 0, def.max_rank);
  if (rank === def.max_rank) return null;
  return Math.round(def.base * config.dna.cost_curve[rank] / 5) * 5;
}

function purchaseResearch({ id, rank, clears, dna }) {
  const def = researchDefinition(id);
  int(clears, 'clears'); int(dna, 'dna');
  const cost = nextResearchCost(id, rank);
  if (clears < def.unlocks_after_clears) return { purchased: false, reason: 'locked', rank, dna };
  if (cost === null) return { purchased: false, reason: 'maxed', rank, dna };
  if (dna < cost) return { purchased: false, reason: 'insufficient', rank, dna };
  return { purchased: true, cost, rank: rank + 1, dna: dna - cost };
}

function firstClearReward(stage, alreadyClaimed = false) {
  int(stage, 'stage', 1, 99);
  if (typeof alreadyClaimed !== 'boolean') throw new TypeError('alreadyClaimed must be boolean');
  if (alreadyClaimed) return 0;
  const cycle = Math.floor((stage - 1) / 15) + 1;
  const local = ((stage - 1) % 15) + 1;
  let dna = Math.min(110, 22 + (stage - 1) * 5);
  if (local === 15) dna += 220 + Math.min(120, (cycle - 1) * 20);
  else if (local === 5 || local === 10) dna += 105 + Math.min(75, (cycle - 1) * 15);
  else if (![2, 3, 4, 7, 8, 9].includes(local)) dna += 12 + Math.min(36, cycle * 4);
  return dna;
}

function oneKillReward({ kind, killIndex, chain = 1, route = 1, relic = 1 }) {
  int(killIndex, 'killIndex', 1); int(chain, 'chain', 0);
  nonNegative(route, 'route'); nonNegative(relic, 'relic');
  let base;
  switch (kind) {
    case 'regular': base = killIndex % 7 === 0 ? 1 : 0; break;
    case 'brute': base = 3; break;
    case 'special': base = 2; break;
    case 'elite': base = 14; break;
    case 'boss': base = 40; break;
    case 'apex': base = 100; break;
    default: throw new RangeError(`unknown kill kind: ${kind}`);
  }
  return Math.round(base * route * relic * (1 + Math.min(0.25, Math.floor(chain / 25) * 0.04)));
}

function performanceBonus({ stage, won, rapidWaves = 0, perfectDodges = 0, maxChain = 0,
  blueprint = false, nemesis = false, riftSuccess = 0, riftFail = 0, hpRatio = 0 }) {
  int(stage, 'stage', 1, 99);
  if (typeof won !== 'boolean' || typeof blueprint !== 'boolean' || typeof nemesis !== 'boolean') {
    throw new TypeError('outcome flags must be boolean');
  }
  for (const [n, v] of Object.entries({rapidWaves, perfectDodges, maxChain, riftSuccess, riftFail})) int(v, n);
  nonNegative(hpRatio, 'hpRatio');
  let bonus = Math.min(18, rapidWaves * 5) + Math.min(15, perfectDodges * 3) +
    Math.min(12, Math.floor(maxChain / 10) * 2);
  if (blueprint) bonus += 10;
  if (nemesis) bonus += 8;
  if (riftSuccess > 0 && riftFail === 0) bonus += 5;
  if (won && hpRatio >= 0.65) bonus += 5;
  bonus = Math.min(38 + Math.min(24, Math.max(0, stage - 1) * 3), bonus);
  return won ? bonus : Math.floor(bonus * 0.45);
}

function evaluateRun({ stage, won, alreadyClaimed = false, kills = [], chests = 0,
  riftTiers = [], waves = [], objectiveBonus = 0, metrics = {} }) {
  int(stage, 'stage', 1, 99); int(chests, 'chests', 0, 10000); int(objectiveBonus, 'objectiveBonus');
  if (typeof won !== 'boolean') throw new TypeError('won must be boolean');
  if (!Array.isArray(kills) || !Array.isArray(riftTiers) || !Array.isArray(waves)) {
    throw new TypeError('kills, riftTiers and waves must be arrays');
  }
  let dnaTotal = 0, index = 0;
  for (const group of kills) {
    int(group.count, 'kill count', 0, 100000);
    if (index + group.count > 100000) throw new RangeError('too many simulated kills');
    for (let k = 0; k < group.count; k++) {
      dnaTotal += oneKillReward({kind: group.kind, killIndex: ++index, chain: group.chain ?? 1,
        route: group.route ?? 1, relic: group.relic ?? 1});
    }
  }
  dnaTotal += chests * (10 + Math.min(10, Math.floor(stage * 1.3)));
  for (const tier of riftTiers) dnaTotal += 10 + int(tier, 'rift tier', 1, 100) * 5;
  for (const wave of waves) {
    const waveIndex = int(wave.index, 'wave index', 0);
    if (typeof wave.rapid !== 'boolean') throw new TypeError('wave.rapid must be boolean');
    dnaTotal += 8 + Math.min(8, stage) + (waveIndex >= 3 ? 2 : 0) + (wave.rapid ? 4 : 0);
  }
  const skill = performanceBonus({ ...metrics, stage, won });
  const bank = Math.max(0, Math.floor(dnaTotal) + objectiveBonus + skill);
  const clear = won ? firstClearReward(stage, alreadyClaimed) : 0;
  return { kind: 'SIMULATION_ONLY', stage, won, killCount: index, runDna: dnaTotal, skillBonus: skill,
    bank, firstClearBonus: clear, totalDna: bank + clear };
}

module.exports = { config, assertDraft, nextResearchCost, purchaseResearch, firstClearReward,
  oneKillReward, performanceBonus, evaluateRun };
