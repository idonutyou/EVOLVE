#!/usr/bin/env python3
"""Edit the current WEB-28 deployment, retaining every original image byte."""
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
BASE='3f8f3164bc19d89fb67d4ea95069674f9fcba1ab'
VERSION='V575-WEB-29-ADMIN-COMBAT'
def old(path):return subprocess.check_output(['git','show',BASE+':'+path],cwd=ROOT)
def dump(path,data,compact=False):path.write_text(json.dumps(data,ensure_ascii=False,**({'separators':(',',':')} if compact else {'indent':2}))+'\n')

def main():
 dist=ROOT/'dist';manifest=json.loads(old('dist/asset-manifest.json'));version=json.loads(old('dist/version.json'));report=json.loads(old('dist/verification.json'))
 engine=report['upgrade_reference']['engine'];original=old('dist/'+engine).decode();code=original;html=old('dist/index.html').decode()
 def replace(before,after,count=1):
  nonlocal code
  assert code.count(before)==count,(code.count(before),before[:160]);code=code.replace(before,after)
 def remove_between(start,end):
  nonlocal code
  a=code.index(start);b=code.index(end,a);code=code[:a]+code[b:]
 # Delete the contract engine and all live connections; old save fields remain readable.
 remove_between('const RISK_TIERS=[','const START_WEAPONS={')
 remove_between('function openContractSelect(){','function updatePredationHUD(){')
 remove_between('function applyContractBossEdge(fb){','function combatClarityLevel(){')
 remove_between('function settleContractStreak(success){','let runWonV506I18n=')
 replace(',contractEdgeUsed=false','');replace('contractEdgeUsed=false;','')
 replace("selectedContractId='exterminate',selectedRisk=0,selectedStartWeapon='arm',contract=null,contractDone=false,contractFailed=false,contractBankBonus=0,contractNodes=[],contractCores=0,contractEventFlags=[false,false,false],","selectedStartWeapon='arm',objectiveBankBonus=0,")
 replace("contractDone=false;contractFailed=false;contractBankBonus=0;contractNodes=[];contractCores=0;contractEventFlags=[false,false,false];nemesisSpawned=false;nemesisKilledThisRun=false;contract=createContract(selectedContractId);predation=Math.min(35,(meta.contractStreak||0)*4);","objectiveBankBonus=0;nemesisSpawned=false;nemesisKilledThisRun=false;predation=0;")
 replace("updateContractHUD._key='';",'');replace('updateContractHUD();','');replace('updateContractNodes(dt);','');replace('updateContract();','')
 replace("$('contractOverlay').style.display='none';",'',count=2)
 replace("$('contractOverlay').style.display==='flex'||",'',count=2)
 replace("$('homeContractBackV522').onclick=()=>returnToHome('battle');",'')
 replace("homeSetTextV522('homeContractBackV522',homeTextV522('‹ HOME','‹ 홈으로'));",'')
 replace('openContractSelect()','openStartWeaponSelect()',count=4)
 replace("selectedContractId='exterminate';selectedRisk=0;selectedStartWeapon='arm';","selectedStartWeapon='arm';")
 replace("SELECT CONTRACT & STARTING WEAPON","SELECT STARTING WEAPON");replace('계약과 시작 무기를 선택한 뒤 진입합니다.','시작 무기를 선택한 뒤 진입합니다.')
 replace('계약과 시작 무기를 선택하면 시험이 시작됩니다.','시작 무기를 선택하면 시험이 시작됩니다.')
 # Shared choice decoration and HUD carry no contract elements.
 replace(',.contractCard','');replace("   if(!key&&b.classList.contains('contractCard'))key='enemy/'+(b.dataset.contract==='exterminate'?'brute':b.dataset.contract==='predator'?'runner':'symbiote');\n",'')
 replace(',.contractIcon','');replace(",'contractCards'",'')
 replace("+' · STREAK '+(meta.contractStreak||0)",'')
 # Former difficulty choices belonged to contracts. Preserve the standard baseline.
 replace('const rk=riskTier(),timeHp=','const timeHp=');replace('let rk=riskTier(),hpTempo=','let hpTempo=')
 for key in ['hp','spd','dmg']:code=code.replace('*rk.'+key,'')
 replace('e.superApex||riskTier().id>=2','e.superApex',count=2)
 replace('+(riskTier().organLuck||0)','')
 replace('  if(contractDone)bonus+=8+riskTier().id*3;\n','')
 replace("  if(contract?.id==='exterminate'&&!contractDone&&!contractFailed&&t>48)base*=.97;\n",'')
 replace("e.contractBossTitle||",'')
 replace("    contract:e.contractVariant||contract?.id||'exterminate',\n    risk:selectedRisk,\n    riskName:riskTier().name,\n",'')
 replace("let type=n.contract==='harvest'?'spitter':'brute';","let type=['runner','spitter'].includes(n.sourceType)?n.sourceType:'brute';")
 replace("e.spd*=n.contract==='predator'?(1.18+.035*power):(1.05+.02*power)","e.spd*=1.05+.02*power")
 replace("e.contractBossTitle?e.contractBossTitle+' · '+(e.bossName||'BIO TITAN'):(e.bossName||'BIO TITAN')","e.bossName||'BIO TITAN'")
 replace('if(e.contractArmor)dmg*=1-e.contractArmor;','')
 code=code.replace('contractBankBonus','objectiveBankBonus')
 replace("((contract?.id==='predator'&&!contractDone&&!contractFailed)?2.75:2.25)",'2.25')
 replace("(e.contractPrey?8:(e.type==='brute'||e.type==='warden'||e.type==='froststalker'||e.type==='symbiote'||e.type==='embermaw'?7:3))","(e.type==='brute'||e.type==='warden'||e.type==='froststalker'||e.type==='symbiote'||e.type==='embermaw'?7:3)")
 a=code.index("    fb.contractVariant=contract?.id||'exterminate';");b=code.index('const evoN=evoCount();',a);code=code[:a]+'    '+code[b:]
 replace("let contractEdgeLabel=contractDone?applyContractBossEdge(fb):'';directorHold(2.0);","directorHold(2.0);")
 replace("    if(contractFailed)encounterSub='CONTRACT RETALIATION';\n    else if(contractDone)encounterSub='CONTRACT HUNT COMPLETE';\n    else if(fb.superApex)","    if(fb.superApex)")
 replace('contractEdgeLabel||encounterSub','encounterSub')
 replace("flash(contractEdgeLabel||((contractFailed?'ENRAGED ':'WARNING: ')+(fb.bossName||'BIO TITAN')),1600)","flash('WARNING: '+(fb.bossName||'BIO TITAN'),1600)")
 replace("if(e.contractRegen&&e.hp>0&&e.hp<e.maxHp&&(!isBioTitanV435(e)||e.titanPhase<3))e.hp=Math.min(e.maxHp,e.hp+e.maxHp*e.contractRegen*dt);",'')
 replace("if(e.contractVariant==='exterminate'&&Math.random()<.55)spawnEnemy(Math.random()<.5?'runner':'crawler');",'')
 replace("e.contractVariant==='predator'?.92:.72",'.72')
 replace('settleContractStreak(!!contractDone);','');replace('settleContractStreak(false);','')
 replace("+' · '+contract.riskName+' · '+contract.name+' '+(contractDone?'COMPLETE':'FAILED')",'')
 replace('(contractDone?180:0)+','');replace("  if(contractDone)highlights.push('CONTRACT COMPLETE');\n",'')
 # Delete the contract-only world objects, navigation exclusions and radar targets.
 code=re.sub(r"\s*&&\s*!contractNodes\.some\(s=>s!==ignore&&Math\.hypot\(p\.x-s\.x,p\.y-s\.y\)<r\+s\.r\+32\)",'',code)
 replace("&&!contractNodes.some(s=>Math.hypot(x-s.x,y-s.y)<r+s.r+32)",'')
 for line in code.splitlines():
  if 'for(const n of contractNodes)' in line or 'if(contractNodes.length)' in line:code=code.replace(line+'\n','')
 replace('contract:updateContract,','');replace(" updateContract=function(...args){if(B.encounter)return;return original.contract(...args);};\n",'')
 replace('contractEventFlags=[true,true,true];','')
 replace('if(jump&&contract&&!contractDone&&!contractFailed)contract.deadline+=jump;','')
 replace('contract:()=>({done:contractDone,failed:contractFailed,deadline:contract?.deadline}),','')
 replace('Optional gene-rift field devices are disabled; stage exits and contract progression remain native.','Optional gene-rift field devices are disabled; stage exits remain native.')
 # Remove the contract DOM rather than leaving a hidden unused screen.
 html=re.sub(r'\s*<div id="contractOverlay">.*?</div></div></div>','',html,count=1)
 html=html.replace('    <div id="contractBadge"></div>\n','')
 # Remove contract selectors from shared rules without deleting other selectors.
 bad=re.compile(r'contract|riskRow|riskBtn|streakLine',re.I)
 def clean_style(style):
  css=re.sub(r'([^{}]+)\{([^{}]*)\}',lambda m: (','.join(s for s in m[1].split(',') if not bad.search(s))+'{'+m[2]+'}') if any(not bad.search(s) for s in m[1].split(',')) else '',style[2])
  return style[1]+css+'</style>'
 html=re.sub(r'(<style[^>]*>)(.*?)</style>',clean_style,html,flags=re.S)
 # Register independent species before any art or combat setup.
 code=(ROOT/'web/monster-species-v596.js').read_text()+'\n'+code
 replace("const monsterSourceV577={crawler:{row:0,b:[24,91,307,381]},runner:{row:0,b:[24,91,307,381]},brute:{row:1,b:[4,0,314,375]},spitter:{row:2,b:[0,0,309,364]}};","const monsterSourceV577={ripper:{row:0,b:[24,91,307,381]},mauler:{row:1,b:[4,0,314,375]},bileback:{row:2,b:[0,0,309,364]}};")
 replace("return key.startsWith('legacy_')?'enemy_legacy/'+key.slice(7):'enemy/'+(key==='froststalker'?'frost_stalker':key);","key=NEW_MONSTER_SPECIES_V596[key]?.combatType||key;return key.startsWith('legacy_')?'enemy_legacy/'+key.slice(7):'enemy/'+(key==='froststalker'?'frost_stalker':key);")
 replace("'legacy_crawler','legacy_warden'];","'legacy_crawler','legacy_warden','ripper','mauler','bileback'];")
 replace('types.includes(type)?type:','types.includes(enemyCombatTypeV596(type))?type:')
 replace("if(type==='boss'||boss){","if(type==='boss'||boss){")
 # Special species use inherited stats; their identity stays in e.type for saves/rendering.
 replace('const spawnZone=worldZoneAt(x,y);',"const species=NEW_MONSTER_SPECIES_V596[type];if(species){e.hp*=species.hp;e.maxHp=e.hp;e.spd*=species.speed;e.dmg*=species.damage;}\n  const spawnZone=worldZoneAt(x,y);")
 replace("e.bossName||e.eliteName||({crawler:","e.bossName||e.eliteName||NEW_MONSTER_SPECIES_V596[e.type]?.en||({crawler:")
 before=old('web/monster-catalog-v593.js').decode();after=(ROOT/'web/monster-catalog-v593.js').read_text();replace(before,after)
 before=old('web/admin-mode-v585.js').decode();after=(ROOT/'web/admin-mode-v585.js').read_text();replace(before,after)
 before=old('web/horde-roles-v591.js').decode();after=(ROOT/'web/horde-roles-v591.js').read_text();replace(before,after)
 before=old('web/visual-clarity-v592.js').decode();after=(ROOT/'web/visual-clarity-v592.js').read_text();replace(before,after)
 # Intent is applied before collision-aware terrain steering, never by teleporting.
 replace('    steerTerrainV418(e);moveTerrainBodyV418(e,','    enemyIntentV596(e,dt,slowMul,d);steerTerrainV418(e);moveTerrainBodyV418(e,')
 replace('if(e.elite&&e.elitePatternCd<=0&&!e.telegraphing','if(e.elite&&!e.midRankV596&&e.elitePatternCd<=0&&!e.telegraphing',count=2)
 replace('    if(e.elite){\n      e.affixCd=','    if(e.elite&&!e.midRankV596){\n      e.affixCd=')
 replace("e.elite?(e.bossName==='TITAN SENTINEL'?106.6:68):","e.elite?(e.midVisualSizeV596||(e.bossName==='TITAN SENTINEL'?106.6:68)):")
 replace('e.elite?68:','e.elite?(e.midVisualSizeV596||68):',count=4)
 replace('dmg:e.elite?12:9','dmg:e.midRankV596?e.dmg*.65:e.elite?12:9')
 # Normalize archetype comparisons, retaining actual type in catalogs, echoes and artwork.
 code=re.sub(r"\b([A-Za-z_$][\w$]*(?:\?\.|\.)type|(?<!\.)type)\s*([=!]==)\s*(['\"])(crawler|runner|brute|spitter)\3",lambda m:'enemyCombatTypeV596('+m[1]+')'+m[2]+m[3]+m[4]+m[3],code)
 code=code.replace(".includes(e.type)",".includes(enemyCombatTypeV596(e))")
 code=code.replace('threatSpriteV426(e.type)','threatSpriteV426(enemyCombatTypeV596(e))')
 # The saved test-map override starts applying when admin is enabled: prepare it immediately.
 # The module is maintained separately and included before the web guard.
 marker='\nwindow.EVOLVE_WEB_GUARD=';replace(marker,'\n'+(ROOT/'web/combat-elites-v596.js').read_text()+marker)
 # Every live contract identifier is gone, apart from inert imported save fields and English anatomy prose.
 for token in ['contractOverlay','contractBadge','contractNodes','contractDone','contractFailed','createContract','updateContract','riskTier','selectedRisk','contractVariant']:
  assert token not in code,token
 assert 'contractOverlay' not in html
 raw=code.encode();sha=hashlib.sha256(raw).hexdigest();target='assets/'+sha+'.js';(dist/target).write_bytes(raw)
 for e in manifest:
  if e['path']==engine:e.update(path=target,sha256=sha,bytes=len(raw))
  elif e['kind']=='image':
   data=(dist/e['path']).read_bytes();assert len(data)==e['bytes'] and hashlib.sha256(data).hexdigest()==e['sha256']
 build=hashlib.sha256(version['build'].encode()+raw+html.encode()).hexdigest()
 config={k:version[k] for k in ['scriptBytes','preloadResources']};config.update(version=VERSION,build=build,scriptBytes=version['scriptBytes']+len(raw)-len(original.encode()))
 html=html.replace(engine,target);html=re.sub(r'window\.EVOLVE_WEB_CONFIG=\{.*?\};',lambda m:'window.EVOLVE_WEB_CONFIG='+json.dumps(config,separators=(',',':'))+';',html,count=1)
 report=json.loads(json.dumps(report).replace(engine,target));report.update(version=VERSION,build=build,index_bytes=len(html.encode()),cached_bytes=sum(e['bytes'] for e in manifest))
 report['admin_combat_v596']={'engine':target,'baseline':BASE,'new_species':['ripper','mauler','bileback'],'original_four_restored':True,'contract_system_removed':True,'admin_map_prepared_on_enable':True,'all_monsters_contact_damage':True,'ranked_midbosses':True,'original_image_bytes_unchanged':sum(e['kind']=='image' for e in manifest),'physical_Galaxy_S23_plus_tested':False}
 version.update(config)
 (dist/'index.html').write_text(html);dump(dist/'asset-manifest.json',manifest,True);dump(dist/'version.json',version);dump(dist/'verification.json',report)
 prior=json.loads((ROOT/'docs/admin-cleanup-v596-checkpoint.json').read_text());prior.update(version=VERSION,progress=50,build=build,status='Implemented; browser verification pending');dump(ROOT/'docs/admin-cleanup-v596-checkpoint.json',prior)
 if target!=engine:(dist/engine).unlink(missing_ok=True)
 print(json.dumps(config|{'engine':target}))

if __name__=='__main__':main()
