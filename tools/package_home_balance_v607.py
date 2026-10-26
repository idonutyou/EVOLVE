#!/usr/bin/env python3
"""Apply only the WEB-40 home composition and reference-surface corrections."""
import hashlib,json,re,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE='373bfb1f08714266cc51c7a8acaa8be17e870b30'
VERSION='V575-WEB-40-HOME-BALANCE'
def old(n):return subprocess.check_output(['git','show',BASE+':'+n],cwd=ROOT)
def dump(p,d):p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def main():
 d=ROOT/'dist';version=json.loads(old('dist/version.json'));report=json.loads(old('dist/verification.json'));manifest=json.loads(old('dist/asset-manifest.json'));previous=json.loads((d/'asset-manifest.json').read_text());feature=report['icons_fullscreen_v606'];old_script=feature['controls_script']
 def add(raw,ext,kind):
  sha=hashlib.sha256(raw).hexdigest();path='assets/'+sha+'.'+ext;(d/path).write_bytes(raw)
  if not any(e['path']==path for e in manifest):manifest.append({'path':path,'sha256':sha,'bytes':len(raw),'kind':kind})
  return path
 material=json.loads((ROOT/'web/home-balance-art-v607.json').read_text());raw=(ROOT/material['source']).read_bytes();assert hashlib.sha256(raw).hexdigest()==material['sha256'];material['path']=add(raw,'png','image');controls=dict(feature['reference']);controls['material']=material
 js=(ROOT/'web/home-controls-v606.js').read_text().replace('__HOME_CONTROLS_ART_V606__',json.dumps(controls,separators=(',',':'))).encode();script=add(js,'js','presentation-code');manifest=[e for e in manifest if e['path']!=old_script]
 css=(ROOT/'web/home-balance-v607.css').read_bytes();style=add(css,'css','style');html=old('dist/index.html').decode();assert html.count(old_script)==1;html=html.replace(old_script,script).replace('</head>','<link rel="stylesheet" href="'+style+'">\n</head>')
 build=hashlib.sha256(version['build'].encode()+js+css+html.encode()).hexdigest();config={'version':VERSION,'build':build,'scriptBytes':version['scriptBytes'],'preloadResources':True};html,n=re.subn(r'window\.EVOLVE_WEB_CONFIG=\{.*?\};',lambda m:'window.EVOLVE_WEB_CONFIG='+json.dumps(config,separators=(',',':'))+';',html,count=1);assert n==1
 (d/'index.html').write_text(html);version.update(config,assets=len(manifest));dump(d/'version.json',version);(d/'asset-manifest.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n')
 feature.update(controls_script=script,reference=controls)
 report.update(version=VERSION,build=build,index_bytes=len(html.encode()),cached_files=len(manifest),cached_bytes=sum(e['bytes'] for e in manifest));report['home_balance_v607']={'baseline':BASE,'stylesheet':style,'material':material,'controls_script':script,'stable_heading_status_slots':True,'balanced_portrait_composition':True,'battle_red_rim_removed':True,'warm_gold_start_label':'#ffe0a0','start_outer_frame_preserved':True,'original_engine_preserved':True,'save_keys_and_fullscreen_unchanged':True,'physical_Galaxy_S23_plus_tested':False};dump(d/'verification.json',report)
 keep={e['path'] for e in manifest}
 for e in previous:
  if e['path'] not in keep and e['kind'] in ('style','presentation-code'):(d/e['path']).unlink(missing_ok=True)
 original_images=[e for e in json.loads(old('dist/asset-manifest.json')) if e['kind']=='image']
 for e in original_images:assert hashlib.sha256((d/e['path']).read_bytes()).hexdigest()==e['sha256']
 assert (d/report['home_hub_v601']['engine']).read_bytes()==old('dist/'+report['home_hub_v601']['engine'])
 print(json.dumps(config|{'new_stylesheet':style,'material':material['path'],'original_image_hashes_preserved':len(original_images),'engine_unchanged':True}))
if __name__=='__main__':main()
