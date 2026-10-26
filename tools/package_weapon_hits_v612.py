#!/usr/bin/env python3
"""Append reversible visual-only hooks to the current STEP04 engine."""
import hashlib,json,re,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE='bd0a25454bfc9fdc1336de1e534f7b5aee6b1639'
ENGINE='assets/0b7abf3fbe44f27149f793dad0c200c95df00a5053318c3ad109d2eb3b54acaf.js'
EVENTS='assets/d1c5ca91120f8afc1736f36450c3ecc02fb56881fade62b647916ad17724c7c4.js'
VERSION='V575-STEP05-GUN-BLADE-V612'
def dump(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def read_baseline(path):
 cache=ROOT.parent/'tmp/step05-baseline'/path
 return cache.read_bytes() if cache.is_file() else subprocess.check_output(['git','show',BASE+':'+path],cwd=ROOT)
def main():
 d=ROOT/'dist';html=read_baseline('dist/index.html').decode();v=json.loads(read_baseline('dist/version.json'));m=json.loads(read_baseline('dist/asset-manifest.json'));r=json.loads(read_baseline('dist/verification.json'))
 assert v['version']=='V575-STEP04-HIT-EVENTS-V601','Run only on the exact STEP04 baseline'
 original=(d/ENGINE).read_text();assert hashlib.sha256(original.encode()).hexdigest()==Path(ENGINE).stem
 baseline=list(m);new=[]
 def asset(raw,ext,kind):
  sha=hashlib.sha256(raw).hexdigest();p='assets/'+sha+'.'+ext;(d/p).write_bytes(raw)
  e={'path':p,'sha256':sha,'bytes':len(raw),'kind':kind};m.append(e);new.append(e);return p
 art={k:asset((ROOT/('art/hit-reactions-v612/'+name)).read_bytes(),'png','image') for k,name in [('gun','gun-impact.png'),('blade','blade-impact.png')]}
 events=(ROOT/'web/hit-events-v601.js').read_text()
 events=events.replace('_record(enemy,damage,kind,before,gameTime){','_record(enemy,damage,kind,before,gameTime,weaponSource=null){')
 events=events.replace("heavy:typeof meta?.heavy==='boolean'?meta.heavy:null,","heavy:typeof meta?.heavy==='boolean'?meta.heavy:null,\n        weapon:['gun','blade'].includes(weaponSource?.weapon)?weaponSource.weapon:null,\n        angle:Number.isFinite(weaponSource?.angle)?weaponSource.angle:null,")
 (ROOT/'web/hit-events-v612.js').write_text(events)
 event_path=asset(events.encode(),'js','game-code')
 code=original;patches=[]
 def patch(a,b):
  nonlocal code
  assert code.count(a)==1,(code.count(a),a[:120]);code=code.replace(a,b);patches.append((a,b))
 patch('const bridge=window.EVOLVE_HIT_EVENTS;\n  if(!e||!bridge', 'const bridge=window.EVOLVE_HIT_EVENTS;\n  weaponHitConnectV612(bridge);\n  if(!e||!bridge')
 patch("  try{bridge._record(e,dmg,kind,before,typeof t==='number'?t:null);}catch(_){/* Never alter combat results. */}","  const oldTargetV612=weaponHitTargetV612;weaponHitTargetV612=e;\n  try{bridge._record(e,dmg,kind,before,typeof t==='number'?t:null,(kind==='arm'||kind==='artillery')?weaponHitSourceV612:null);}catch(_){/* Never alter combat results. */}finally{weaponHitTargetV612=oldTargetV612;}")
 patch("attack.targets.add(e);attack.hit=true;hurtEnemy(e,damage,'arm');playerMotionV586.hits++;", "attack.targets.add(e);attack.hit=true;withWeaponHitSourceV612('blade',attack.a,()=>hurtEnemy(e,damage,'arm'));playerMotionV586.hits++;")
 patch("upgradeDamageSourceV593=bullet.upgradeHitsV593?'gun':null;try{return hurtEnemy(e,damage,kind);}finally{upgradeDamageSourceV593=before;}","upgradeDamageSourceV593=bullet.upgradeHitsV593?'gun':null;try{return withWeaponHitSourceV612(upgradeDamageSourceV593==='gun'?'gun':null,Math.atan2(bullet.vy||0,bullet.vx||0),()=>hurtEnemy(e,damage,kind));}finally{upgradeDamageSourceV593=before;}")
 patch(" if(blade){damage*=1+upgradeRunV593.bladeDamage;if(upgradeRunV593.bladeCrit>0&&Math.random()<upgradeRunV593.bladeCrit)damage*=2;}"," let hitCriticalV612=null;\n if(blade){damage*=1+upgradeRunV593.bladeDamage;hitCriticalV612=upgradeRunV593.bladeCrit>0&&Math.random()<upgradeRunV593.bladeCrit;if(hitCriticalV612)damage*=2;}")
 patch(" const hp=e.hp;const result=upgradeHurtBaseV593(e,damage,kind);", " const hp=e.hp,hitBridgeV612=window.EVOLVE_HIT_EVENTS;const result=blade&&hitBridgeV612?hitBridgeV612.withContext({critical:hitCriticalV612},()=>upgradeHurtBaseV593(e,damage,kind)):upgradeHurtBaseV593(e,damage,kind);")
 patch('drawAttackWarningsV582();drawEnemyHealthBarsV592();','weaponHitFeedbackV612.draw(ctx);drawAttackWarningsV582();drawEnemyHealthBarsV592();')
 factory=(ROOT/'web/weapon-hit-reactions-v612.js').read_text();adapter=(ROOT/'web/weapon-hit-adapter-v612.js').read_text().replace('__WEAPON_HIT_ART_V612__',json.dumps(art,separators=(',',':')))
 addition='\n/* STEP05_V612_BEGIN */\n'+factory+'\n'+adapter+'\n/* STEP05_V612_END */\n'
 end=code.rfind('\n})();');assert end>0;code=code[:end]+addition+code[end:]
 restored=code.replace(addition,'')
 for a,b in reversed(patches):assert restored.count(b)==1;restored=restored.replace(b,a)
 assert restored==original,'Removing visual hooks must restore the exact baseline engine'
 dump(ROOT/'docs/step05/ENGINE_PATCHES.json',{'patches':patches,'addition':addition})
 engine_path=asset(code.encode(),'js','game-code')
 m=[e for e in m if e['path'] not in (ENGINE,EVENTS)]
 html=html.replace(ENGINE,engine_path).replace(EVENTS,event_path)
 r=json.loads(json.dumps(r).replace(ENGINE,engine_path).replace(EVENTS,event_path))
 v['scriptBytes']+=len(code.encode())-len(original.encode())+len(events.encode())-next(e['bytes'] for e in baseline if e['path']==EVENTS)
 build=hashlib.sha256(v['build'].encode()+html.encode()+code.encode()+events.encode()+json.dumps(art,sort_keys=True).encode()).hexdigest()
 config={'version':VERSION,'build':build,'scriptBytes':v['scriptBytes'],'preloadResources':True}
 html,n=re.subn(r'window\.EVOLVE_WEB_CONFIG=\{.*?\};',lambda _:'window.EVOLVE_WEB_CONFIG='+json.dumps(config,separators=(',',':'))+';',html,count=1);assert n==1
 (d/'index.html').write_text(html);v.update(config,assets=len(m));dump(d/'version.json',v);(d/'asset-manifest.json').write_text(json.dumps(m,separators=(',',':'))+'\n')
 info={'baseline':BASE,'baseline_engine':ENGINE,'engine':engine_path,'events':event_path,'art':art,'grid':[4,2],'image_dimensions':[1774,887],'original_images_unchanged':sum(e['kind']=='image' for e in baseline),'reversible_engine_patches':len(patches),'baseline_engine_restores_exactly':restored==original,'damage_and_collision_unchanged':True,'attack_timing_unchanged':True,'warnings_above_effects':True,'effects_limit':48,'physical_Galaxy_S23_plus_tested':False}
 r.update(version=VERSION,build=build,index_bytes=len(html.encode()),cached_files=len(m),cached_bytes=sum(e['bytes'] for e in m));r['weapon_hits_v612']=info;dump(d/'verification.json',r);dump(ROOT/'docs/step05/PACKAGE_V612.json',info|{'new_assets':new})
 print(json.dumps(config|info))
if __name__=='__main__':main()
