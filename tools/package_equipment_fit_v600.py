#!/usr/bin/env python3
"""Replace only the four changed modules in the deployed WEB-32 engine."""
import hashlib,json,re,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE='917ac1cd209bf3eb05a8e90045c59046bb3585ac'
VERSION='V575-WEB-33-EQUIPMENT-FIT'
def old(n):return subprocess.check_output(['git','show',BASE+':'+n],cwd=ROOT).decode()
def dump(p,d):p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def expand(name,text,read):
 if name=='arm-items-v589.js':return text.replace("JSON.parse('__ARM_ITEMS_ART__')",json.dumps(json.loads(read('web/arm-items-art-v589.json')),separators=(',',':')))
 if name=='player-mutant-v599.js':return text.replace('__MUTANT_ART_V599__',json.dumps(json.loads(read('web/player-mutant-art-v599.json')),separators=(',',':')))
 return text
def main():
 d=ROOT/'dist';v=json.loads(old('dist/version.json'));report=json.loads(old('dist/verification.json'));manifest=json.loads(old('dist/asset-manifest.json'));engine=report['player_mutant_v599']['engine'];original=old('dist/'+engine);code=original;pairs=[]
 for name in ['arm-items-v589.js','organ-skill-model-v598.js','organ-skills-v598.js','player-mutant-v599.js']:
  a=expand(name,old('web/'+name),old);b=expand(name,(ROOT/'web'/name).read_text(),lambda n:(ROOT/n).read_text())
  assert code.count(a)==1,'Baseline module mismatch: '+name
  code=code.replace(a,b);pairs.append((a,b))
 restored=code
 for a,b in reversed(pairs):restored=restored.replace(b,a)
 assert restored==original,'Unexpected changes outside requested modules'
 raw=code.encode();sha=hashlib.sha256(raw).hexdigest();target='assets/'+sha+'.js';(d/target).write_bytes(raw)
 for entry in manifest:
  if entry['path']==engine:entry.update(path=target,sha256=sha,bytes=len(raw))
 html=old('dist/index.html').replace(engine,target);build=hashlib.sha256(v['build'].encode()+raw).hexdigest();config={'version':VERSION,'build':build,'scriptBytes':v['scriptBytes']+len(raw)-len(original.encode()),'preloadResources':True}
 html,n=re.subn(r'window\.EVOLVE_WEB_CONFIG=\{.*?\};',lambda m:'window.EVOLVE_WEB_CONFIG='+json.dumps(config,separators=(',',':'))+';',html,count=1);assert n==1
 html=re.sub(r'(src="'+re.escape(target)+r'" onload="EVOLVE_WEB_CLIENT\.loaded\()\d+(\))',lambda m:m[1]+str(len(raw))+m[2],html)
 (d/'index.html').write_text(html);v.update(config,assets=len(manifest));dump(d/'version.json',v);(d/'asset-manifest.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n')
 report=json.loads(json.dumps(report).replace(engine,target));report.update(version=VERSION,build=build,index_bytes=len(html.encode()),cached_files=len(manifest),cached_bytes=sum(x['bytes'] for x in manifest))
 report['equipment_fit_v600']={'baseline':BASE,'engine':target,'cannon_scale':.026,'blade_scale':.032,'blade_edges_down':True,'blade_recovery_seconds':.10,'cannon_hold_seconds':2,'first_learned_tail_radius':30,'tail_radius_cap':90,'original_images_unchanged':True}
 dump(d/'verification.json',report)
 if engine!=target:(d/engine).unlink(missing_ok=True)
 for entry in manifest:
  if entry['kind']=='image':assert hashlib.sha256((d/entry['path']).read_bytes()).hexdigest()==entry['sha256']
 print(json.dumps(config|{'engine':target,'images_unchanged':sum(e['kind']=='image' for e in manifest),'baseline_other_modules_unchanged':True}))
if __name__=='__main__':main()
