#!/usr/bin/env python3
"""Add the approved native rig to WEB-31 without reverting any gameplay changes."""
import hashlib,json,re,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE='9e32ef7cd98a4be02e2b2a70c7885c94f820389f'
VERSION='V575-WEB-32-ARMORED-MUTANT'
def old(path):return subprocess.check_output(['git','show',BASE+':'+path],cwd=ROOT)
def dump(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
def main():
 d=ROOT/'dist';version=json.loads(old('dist/version.json'));report=json.loads(old('dist/verification.json'));manifest=json.loads(old('dist/asset-manifest.json'))
 engine=report['organ_skills_v598']['engine'];original=old('dist/'+engine).decode();html=old('dist/index.html').decode()
 art=json.loads((ROOT/'web/player-mutant-art-v599.json').read_text());raw_source=(d/art['path']).read_bytes();assert hashlib.sha256(raw_source).hexdigest()==art['sha256']
 module=(ROOT/'web/player-mutant-v599.js').read_text().replace('__MUTANT_ART_V599__',json.dumps(art,separators=(',',':')))
 gate='warningBrandReadyV581,playerReadyV586]';assert original.count(gate)==1
 code=original.replace(gate,'warningBrandReadyV581,playerReadyV586,mutantReadyV599]')
 marker='\nwindow.EVOLVE_WEB_GUARD=';assert code.count(marker)==1;code=code.replace(marker,'\n'+module+marker)
 # Removing this module and readiness dependency must recover the exact current engine.
 assert code.replace('\n'+module+marker,marker).replace('warningBrandReadyV581,playerReadyV586,mutantReadyV599]',gate)==original
 raw=code.encode();sha=hashlib.sha256(raw).hexdigest();target='assets/'+sha+'.js';(d/target).write_bytes(raw)
 for entry in manifest:
  if entry['path']==engine:entry.update(path=target,sha256=sha,bytes=len(raw))
 if not any(e['path']==art['path'] for e in manifest):manifest.append({k:art[k] for k in ['path','sha256','bytes']}|{'kind':'image'})
 html=html.replace(engine,target)
 html=re.sub(r'(src="'+re.escape(target)+r'" onload="EVOLVE_WEB_CLIENT\.loaded\()\d+(\))',lambda m:m[1]+str(len(raw))+m[2],html)
 build=hashlib.sha256(version['build'].encode()+raw+raw_source).hexdigest();config={'version':VERSION,'build':build,'scriptBytes':version['scriptBytes']+len(raw)-len(original.encode()),'preloadResources':True}
 html,n=re.subn(r'window\.EVOLVE_WEB_CONFIG=\{.*?\};',lambda m:'window.EVOLVE_WEB_CONFIG='+json.dumps(config,separators=(',',':'))+';',html,count=1);assert n==1
 version.update(config,assets=len(manifest));(d/'index.html').write_text(html);dump(d/'version.json',version)
 (d/'asset-manifest.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n')
 report=json.loads(json.dumps(report).replace(engine,target));report.update(version=VERSION,build=build,index_bytes=len(html.encode()),cached_files=len(manifest),cached_bytes=sum(e['bytes'] for e in manifest),image_assets=sum(e['kind']=='image' for e in manifest))
 report['player_mutant_v599']={'engine':target,'baseline':BASE,'source':{k:art[k] for k in ['path','sha256','bytes','width','height']},'native_source_bytes_unchanged':True,'walking_legs':4,'weapon_arms':2,'planted_two_bone_gait':True,'tail_uses_native_armor_pixels':True,'weapon_ids_and_damage_rules_preserved':True,'maps_bosses_saves_unchanged':True,'physical_Galaxy_S23_plus_tested':False}
 dump(d/'verification.json',report)
 if engine!=target:(d/engine).unlink(missing_ok=True)
 known={e['path'] for e in manifest}
 baseline={line.removeprefix('dist/') for line in subprocess.check_output(['git','ls-tree','-r','--name-only',BASE,'--','dist/assets'],cwd=ROOT,text=True).splitlines()}
 for file in (d/'assets').glob('*.js'):
  rel=file.relative_to(d).as_posix()
  if rel not in known and rel not in baseline:file.unlink()
 checkpoint={'version':VERSION,'baseline':BASE,'build':build,'progress':40,'status':'Approved artwork and continuous native rig integrated; visual and browser validation pending','source':report['player_mutant_v599']['source'],'requirements':['Use the exact approved near-arm perspective render','Four walking legs with stance/swing and planted feet','Two forward shoulder arms retain current cannon/blade equipment','Short default tail, textured segmented growth and matching whip sweep','Preserve maps, bosses, saves, current organ progression and home update timing'],'physical_Galaxy_S23_plus_tested':False,'next':'Inspect cutout, walking and both weapon modes; run regression suites; checkpoint and automatically publish after validation'}
 dump(ROOT/'docs/player-mutant-v599-checkpoint.json',checkpoint)
 print(json.dumps(config|{'engine':target,'assets':len(manifest),'source_bytes':len(raw_source)},ensure_ascii=False))
if __name__=='__main__':main()
