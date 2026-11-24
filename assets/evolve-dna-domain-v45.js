/* EVOLVE DNA EVOLUTION V4.5 — staged, UNPUBLISHED domain model.
 * Does not touch EVOLVE_V575_TEST_META_V1, existing shop DNA, run level, combat runtime.
 * Persistence is separate; durable writes are disabled by default.
 * Permanent EXP curve/reward remains unapproved: game awards must not be invented.
 */
(function(root,factory){const api=factory(); if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.EVOLVE_DNA_DOMAIN_V45=api;})(typeof window!=='undefined'?window:undefined,function(){
'use strict';
const KEY='EVOLVE_PERMANENT_DNA_EVOLUTION_V45';
const RULES_HASH='d9e70657562dd48f5d0cf0216838bfa0cc9caac87ba2135502380cf2f6f9a12b';
const VERSION=1, LIMIT=100, MAX_RECEIPTS=1500;
const PROTECTED=['EVOLVE_V575_TEST_META_V1','EVOLVE_V575_TEST_NORMAL_PROGRESS_V585'];
const owned=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
function totalDNA(lv){lv=Math.max(1,Math.min(100,Math.floor(Number(lv)||1)));return lv*5+5*Math.floor(lv/5)}
function cleanInt(v,lo,hi){return Number.isSafeInteger(v)&&v>=lo&&v<=hi?v:null}
function isObj(x){return !!x&&typeof x==='object'&&!Array.isArray(x)}
function textId(x){return typeof x==='string'&&/^[A-Za-z0-9_:\-]{3,128}$/.test(x)}
function assertGraph(nodes){
 if(!Array.isArray(nodes)||nodes.length!==179)throw Error('expected 179 canonical nodes');
 const map=new Map(),metrics=new Set(),types={FREE:0,LINEAR:0,AND:0};
 for(const n of nodes){
  if(!textId(n.id)||map.has(n.id)||!['ATK','WPN','DEF','MOV','BIO','SUP','COR'].includes(n.branch))throw Error('bad or duplicate node');
  if(![1,3,5].includes(n.max_rank)||!Array.isArray(n.dna_cost_by_rank)||n.dna_cost_by_rank.length!==n.max_rank||!Array.isArray(n.evolution_level_by_rank)||n.evolution_level_by_rank.length!==n.max_rank||!Array.isArray(n.effect_values_cumulative)||n.effect_values_cumulative.length!==n.max_rank)throw Error('malformed ranks '+n.id);
  if(n.dna_cost_by_rank.some(x=>cleanInt(x,1,200)===null)||n.evolution_level_by_rank.some(x=>cleanInt(x,1,100)===null))throw Error('malformed rank limits '+n.id);
  if(n.dependency_type!=='FREE'&&n.dependency_type!=='LINEAR'&&n.dependency_type!=='AND')throw Error('bad dependency type');
  types[n.dependency_type]++;
  metrics.add(n.effect_metric);map.set(n.id,n);
 }
 if(types.FREE!==38||types.LINEAR!==113||types.AND!==28)throw Error('canonical graph class counts changed');
 if(nodes.reduce((s,n)=>s+n.max_rank,0)!==303||nodes.reduce((s,n)=>s+n.dna_cost_by_rank.reduce((a,b)=>a+b,0),0)!==1515)throw Error('canonical rank/economy changed');
 for(const n of nodes){
  const ps=n.prerequisites_and||[];if(!Array.isArray(ps))throw Error('bad prerequisites');
  if((n.dependency_type==='FREE'&&ps.length!==0)||(n.dependency_type==='LINEAR'&&ps.length!==1)||(n.dependency_type==='AND'&&ps.length<2))throw Error('dependency mismatch '+n.id);
  const ids=new Set();for(const p of ps){const q=map.get(p.id);if(!q||p.id===n.id||ids.has(p.id)||q.branch!==n.branch||!Number.isInteger(p.min_rank)||p.min_rank<1||p.min_rank>q.max_rank)throw Error('bad prerequisite '+n.id);ids.add(p.id);}
 }
 let visiting=new Set(),seen=new Set();function walk(id){if(seen.has(id))return;if(visiting.has(id))throw Error('cycle');visiting.add(id);for(const p of map.get(id).prerequisites_and||[])walk(p.id);visiting.delete(id);seen.add(id);}for(const id of map.keys())walk(id);
 return {map,types,metrics:[...metrics]};
}
function fresh(){return {schema:VERSION,rulesHash:RULES_HASH,revision:0,evolutionLevel:1,evolutionExp:0,shotMode:'off',ranks:{},bossFirstClears:[],resonance:0,catalystsEarned:0,receiptIds:[],migration:{legacyGameSaveReadOnly:true}}}
function parseSave(raw,nodes,map){
 let x;try{x=JSON.parse(raw)}catch(e){throw Error('CORRUPT_JSON')}
 if(!isObj(x)||x.schema!==VERSION||x.rulesHash!==RULES_HASH)throw Error('UNKNOWN_SCHEMA_OR_RULES');
 if(cleanInt(x.evolutionLevel,1,100)===null||cleanInt(x.evolutionExp,0,1e12)===null||cleanInt(x.revision,0,1e9)===null)throw Error('INVALID_LEVEL_OR_REVISION');
 if(!isObj(x.ranks)||!Array.isArray(x.bossFirstClears)||!Array.isArray(x.receiptIds))throw Error('INVALID_COLLECTIONS');
 // Old V45 candidate saves without a mode remain compatible and default to off.
 if(!['off','rapid','multi'].includes(x.shotMode===undefined?'off':x.shotMode))throw Error('INVALID_SHOT_MODE');
 if(x.shotMode==='rapid'&&!(x.ranks['ATK-F01']>0))throw Error('UNOWNED_RAPID_MODE');
 if(x.shotMode==='multi'&&!(x.ranks['ATK-M01']>0))throw Error('UNOWNED_MULTI_MODE');
 if(Object.keys(x.ranks).length>179||x.receiptIds.length>MAX_RECEIPTS||new Set(x.receiptIds).size!==x.receiptIds.length||x.receiptIds.some(id=>!textId(id)))throw Error('INVALID_RECEIPTS');
 if(new Set(x.bossFirstClears).size!==x.bossFirstClears.length||x.bossFirstClears.some(v=>cleanInt(v,1,100)===null))throw Error('INVALID_BOSS_RECORDS');
 if(cleanInt(x.resonance,0,1e9)===null||cleanInt(x.catalystsEarned,0,1e9)===null)throw Error('INVALID_MATERIALS');
 for(const [id,rank]of Object.entries(x.ranks)){const n=map.get(id);if(!n||cleanInt(rank,1,n.max_rank)===null)throw Error('INVALID_RANK');}
 const spent=nodes.reduce((s,n)=>s+n.dna_cost_by_rank.slice(0,x.ranks[n.id]||0).reduce((a,b)=>a+b,0),0);
 const catalystsSpent=nodes.reduce((s,n)=>s+(x.ranks[n.id]?Number(n.unlock?.catalysts_required||0):0),0);
 if(spent>totalDNA(x.evolutionLevel)||catalystsSpent>x.catalystsEarned)throw Error('IMPOSSIBLE_CURRENCY');
 for(const n of nodes){if(!x.ranks[n.id])continue;
  if(n.evolution_level_by_rank[(x.ranks[n.id]||1)-1]>x.evolutionLevel)throw Error('IMPOSSIBLE_RANK_LEVEL');
  for(const p of n.prerequisites_and||[])if((x.ranks[p.id]||0)<p.min_rank)throw Error('IMPOSSIBLE_PREREQUISITE');
  if(n.unlock?.boss_first_clear && !x.bossFirstClears.includes(n.unlock.boss_first_clear))throw Error('IMPOSSIBLE_BOSS');
 }
 return x;
}
function create({nodes,storage=null,writable=false,onCommit=null,allowDirectLevelForQA=false}={}){
 const g=assertGraph(nodes),map=g.map;let raw=null,blocked=null,loaded=false,st=fresh();
 if(storage){try{raw=storage.getItem(KEY);if(raw!==null){st=parseSave(raw,nodes,map);loaded=true;}}catch(e){blocked='READ_OR_VALIDATION_FAILED:'+e.message}}
 function clone(){return JSON.parse(JSON.stringify(st))}
 function spent(){return nodes.reduce((s,n)=>s+n.dna_cost_by_rank.slice(0,st.ranks[n.id]||0).reduce((a,b)=>a+b,0),0)}
 function catalystsSpent(){return nodes.reduce((s,n)=>s+(st.ranks[n.id]?Number(n.unlock?.catalysts_required||0):0),0)}
 function remaining(){return totalDNA(st.evolutionLevel)-spent()}
 function boughtCount(){return Object.keys(st.ranks).filter(id=>st.ranks[id]>0).length}
 function overview(){const s=clone();return {...s,shotMode:st.shotMode||'off',dnaTotal:totalDNA(st.evolutionLevel),dnaSpent:spent(),dnaAvailable:remaining(),catalystsAvailable:st.catalystsEarned-catalystsSpent(),boughtCount:boughtCount(),mode:blocked?'CORRUPT_READ_ONLY':writable?'CANDIDATE_WRITE':'READ_ONLY',warning:blocked||null,loadedFromStorage:loaded}}
 function canBuy(id){const n=map.get(id);if(!n)return {ok:false,problems:['UNKNOWN_NODE']};const rank=st.ranks[id]||0,issues=[];if(rank>=n.max_rank)issues.push('MAX_RANK');else{
  if(st.evolutionLevel<n.evolution_level_by_rank[rank])issues.push('EVOLUTION_LEVEL');
  if(remaining()<n.dna_cost_by_rank[rank])issues.push('DNA_SHORTAGE');
  if(rank===0){for(const p of n.prerequisites_and||[])if((st.ranks[p.id]||0)<p.min_rank)issues.push('PREREQUISITE:'+p.id+':'+p.min_rank);
   const u=n.unlock||{},num=boughtCount();if(u.boss_first_clear&&!st.bossFirstClears.includes(u.boss_first_clear))issues.push('BOSS_FIRST_CLEAR');if(num<Number(u.unique_nodes_required||0))issues.push('UNIQUE_NODES');if(spent()<Number(u.dna_spent_before||0))issues.push('MIN_PRIOR_DNA');
   const domains=new Set(nodes.filter(o=>o.branch!==n.branch&&st.ranks[o.id]>0).map(o=>o.branch));if(domains.size<Number(u.other_domains_required||0))issues.push('OTHER_DOMAINS');
   if(st.catalystsEarned-catalystsSpent()<Number(u.catalysts_required||0))issues.push('CATALYSTS');
  }
 }return {ok:issues.length===0,nodeId:id,nextRank:rank+1,cost:rank<n.max_rank?n.dna_cost_by_rank[rank]:0,problems:issues};}
 function transact(fn){
  if(blocked)return {ok:false,error:'CORRUPT_READ_ONLY',detail:blocked};
  if(!writable)return {ok:false,error:'READ_ONLY'};
  if(!storage)return {ok:false,error:'NO_STORAGE'};
  let current;try{current=storage.getItem(KEY)}catch(e){blocked='STORAGE_READ_FAILED';return {ok:false,error:blocked}}
  if(current!==raw){blocked='STALE_STORAGE_CONFLICT';return {ok:false,error:blocked}}
  let prev=st,next=clone();let result;try{result=fn(next)}catch(e){return {ok:false,error:e.message}}
  if(result?.ok===false)return result;
  next.revision=st.revision+1;
  try{parseSave(JSON.stringify(next),nodes,map)}catch(e){return {ok:false,error:'INVALID_NEXT_STATE:'+e.message}}
  let encoded=JSON.stringify(next);
  try{storage.setItem(KEY,encoded);if(storage.getItem(KEY)!==encoded)throw Error('WRITE_VERIFY_MISMATCH')}
  catch(e){try{if(raw===null)storage.removeItem(KEY);else storage.setItem(KEY,raw)}catch(_){}blocked='DURABILITY_FAILED';return {ok:false,error:blocked}}
  st=next;raw=encoded;loaded=true;try{onCommit?.(overview())}catch(_){}return {ok:true,...result};
 }
 function buy(id){const check=canBuy(id);if(!check.ok)return {ok:false,error:'NOT_ELIGIBLE',problems:check.problems};return transact(next=>{const freshCheck=canBuy(id);if(!freshCheck.ok)return {ok:false,error:'CONCURRENT_ELIGIBILITY_CHANGED'};next.ranks[id]=(next.ranks[id]||0)+1;return {nodeId:id,newRank:next.ranks[id],dnaCost:check.cost}})}
 // Selecting an already purchased attack pattern is free, but persists atomically.
 // Rapid and multi are mutually exclusive: only one string can be active at a time.
 function selectShotMode(mode){
  if(!['off','rapid','multi'].includes(mode))return {ok:false,error:'INVALID_SHOT_MODE'};
  if(mode==='rapid'&&!(st.ranks['ATK-F01']>0))return {ok:false,error:'UNOWNED_RAPID_MODE'};
  if(mode==='multi'&&!(st.ranks['ATK-M01']>0))return {ok:false,error:'UNOWNED_MULTI_MODE'};
  if((st.shotMode||'off')===mode)return {ok:true,unchanged:true,shotMode:mode};
  return transact(next=>{next.shotMode=mode;return {shotMode:mode}});
 }
 function grantBossReward({receiptId,stage,resonance=0}={}){
  if(!textId(receiptId)||cleanInt(stage,1,100)===null||cleanInt(resonance,0,1000)===null)return {ok:false,error:'INVALID_AUTHORITATIVE_RECEIPT'};
  return transact(next=>{if(next.receiptIds.includes(receiptId))return {ok:false,error:'DUPLICATE_RECEIPT'};if(next.receiptIds.length>=MAX_RECEIPTS)return {ok:false,error:'RECEIPT_LOG_FULL'};
  next.receiptIds.push(receiptId);if(!next.bossFirstClears.includes(stage))next.bossFirstClears.push(stage);next.resonance+=resonance;return {firstClear:!st.bossFirstClears.includes(stage),stage,resonance};});
 }
 function craftCatalyst(){return transact(next=>{if(next.resonance<6)return {ok:false,error:'RESONANCE_SHORTAGE'};next.resonance-=6;next.catalystsEarned++;return {catalystsEarned:next.catalystsEarned}})}
 function advanceLevelFromTrustedEvent({receiptId,toLevel}={}){
  if(!textId(receiptId)||cleanInt(toLevel,1,100)===null)return {ok:false,error:'INVALID_LEVEL_EVENT'};
  if(toLevel<=st.evolutionLevel)return {ok:false,error:'NON_ADVANCING_LEVEL'};
  if(!allowDirectLevelForQA)return {ok:false,error:'PERMANENT_XP_RULE_NOT_FINALIZED'};
  return transact(next=>{if(next.receiptIds.includes(receiptId))return {ok:false,error:'DUPLICATE_RECEIPT'};if(next.receiptIds.length>=MAX_RECEIPTS)return {ok:false,error:'RECEIPT_LOG_FULL'};next.receiptIds.push(receiptId);next.evolutionLevel=toLevel;return {fromLevel:st.evolutionLevel,toLevel,newDNATotal:totalDNA(toLevel)}})
 }
 function exportBundle(){return JSON.stringify({kind:'EVOLVE_DNA_EVOLUTION_V45_EXPORT',rulesHash:RULES_HASH,state:overview()},null,2)}
 function validateImported(rawText){try{const obj=JSON.parse(rawText);if(obj.kind!=='EVOLVE_DNA_EVOLUTION_V45_EXPORT'||obj.rulesHash!==RULES_HASH)return {ok:false,error:'WRONG_BUNDLE'};const {state}=obj;const validated=parseSave(JSON.stringify(state),nodes,map);return {ok:true,summary:{level:validated.evolutionLevel,bought:Object.keys(validated.ranks).length,revision:validated.revision},validated};}catch(e){return {ok:false,error:e.message}}}
 // No implicit overwrite, restore exposed only as validated dry run. Game engine must explicitly approve an import workflow.
 return Object.freeze({KEY,RULES_HASH,protectedKeys:PROTECTED.slice(),graph:Object.freeze({nodes:nodes.length,ranks:303,dnaTotalCost:1515,types:g.types}),overview,canBuy,buy,selectShotMode,grantBossReward,craftCatalyst,advanceLevelFromTrustedEvent,exportBundle,validateImported,readOnly:()=>!writable||!!blocked});
}
return Object.freeze({KEY,RULES_HASH,totalDNA,assertGraph,create});
});
