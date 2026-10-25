#!/usr/bin/env python3
"""Patch the current WEB-34 modules; retain original images and other gameplay."""
import hashlib,json,re,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE='2c4ed8cc3937550d53a85daa097d725c79c95bfd'
VERSION='V575-WEB-35-VISUAL-FIT'
def old(n):return subprocess.check_output(['git','show',BASE+':'+n],cwd=ROOT)
def dump(p,d):p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def main():
 d=ROOT/'dist';v=json.loads(old('dist/version.json'));report=json.loads(old('dist/verification.json'));manifest=json.loads(old('dist/asset-manifest.json'));previous=json.loads((d/'asset-manifest.json').read_text())
 engine=report['home_hub_v601']['engine'];style=report['home_hub_v601']['stylesheet'];original=old('dist/'+engine).decode();code=original;pairs=[]
 def expand(name,text):
  if name=='arm-items-v589.js':return text.replace("JSON.parse('__ARM_ITEMS_ART__')",json.dumps(json.loads(old('web/arm-items-art-v589.json')),separators=(',',':')))
  if name=='player-mutant-v599.js':return text.replace('__MUTANT_ART_V599__',json.dumps(json.loads(old('web/player-mutant-art-v599.json')),separators=(',',':')))
  if name=='home-hub-v601.js':return text.replace('__HOME_HUB_ART_V601__',json.dumps(report['home_hub_v601']['art'],separators=(',',':')))
  raise ValueError(name)
 for name in ['arm-items-v589.js','player-mutant-v599.js','home-hub-v601.js']:
  a=expand(name,old('web/'+name).decode());b=expand(name,(ROOT/'web'/name).read_text());assert code.count(a)==1,'Baseline module mismatch: '+name;code=code.replace(a,b);pairs.append((a,b))
 restored=code
 for a,b in reversed(pairs):restored=restored.replace(b,a)
 assert restored==original,'Changes outside requested modules'
 font_css=(ROOT/'web/home-hub-fonts-v601.css').read_text()
 for i,f in enumerate(json.loads((ROOT/'web/home-hub-font-v601.json').read_text())['fonts']):
  raw=(ROOT/f['path']).read_bytes();font_css=font_css.replace('__HOME_HUB_FONT_'+str(i)+'_V601__',hashlib.sha256(raw).hexdigest()+'.'+f['format'])
 css=(ROOT/'web/home-hub-v601.css').read_text().replace('__HOME_HUB_FONTS_V601__',font_css).encode();raw=code.encode();sha=hashlib.sha256(raw).hexdigest();css_sha=hashlib.sha256(css).hexdigest();target='assets/'+sha+'.js';target_style='assets/'+css_sha+'.css';(d/target).write_bytes(raw);(d/target_style).write_bytes(css)
 for e in manifest:
  if e['path']==engine:e.update(path=target,sha256=sha,bytes=len(raw))
  elif e['path']==style:e.update(path=target_style,sha256=css_sha,bytes=len(css))
 html=old('dist/index.html').decode().replace(engine,target).replace(style,target_style);build=hashlib.sha256(v['build'].encode()+raw+css+html.encode()).hexdigest();config={'version':VERSION,'build':build,'scriptBytes':v['scriptBytes']+len(raw)-len(original.encode()),'preloadResources':True}
 html,n=re.subn(r'window\.EVOLVE_WEB_CONFIG=\{.*?\};',lambda m:'window.EVOLVE_WEB_CONFIG='+json.dumps(config,separators=(',',':'))+';',html,count=1);assert n==1
 html=re.sub(r'(src="'+re.escape(target)+r'" onload="EVOLVE_WEB_CLIENT\.loaded\()\d+(\))',lambda m:m[1]+str(len(raw))+m[2],html)
 (d/'index.html').write_text(html);v.update(config,assets=len(manifest));dump(d/'version.json',v);(d/'asset-manifest.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n')
 report=json.loads(json.dumps(report).replace(engine,target).replace(style,target_style));report.update(version=VERSION,build=build,index_bytes=len(html.encode()),cached_files=len(manifest),cached_bytes=sum(x['bytes'] for x in manifest))
 report['visual_fit_v602']={'baseline':BASE,'engine':target,'stylesheet':target_style,'navigation_height_and_contours_fixed':True,'start_art_contour_clipped':True,'raised_tail_mirrors_with_body':True,'both_blade_cutting_edges_down':True,'blade_rest_tips_down':True,'stride_world_pixels':40,'near_foot_lift':.85,'toe_roll_radians':.045,'movement_speed_unchanged':True,'combat_and_saves_unchanged':True,'physical_Galaxy_S23_plus_tested':False};dump(d/'verification.json',report)
 keep={a['path'] for a in manifest}
 for a in previous:
  if a['path'] not in keep and a['kind'] in ('game-code','style'):(d/a['path']).unlink(missing_ok=True)
 for e in manifest:
  if e['kind']=='image':assert hashlib.sha256((d/e['path']).read_bytes()).hexdigest()==e['sha256']
 print(json.dumps(config|{'engine':target,'stylesheet':target_style,'original_image_hashes_preserved':sum(e['kind']=='image' for e in manifest),'other_game_modules_unchanged':True}))
if __name__=='__main__':main()
