#!/usr/bin/env python3
"""Use the ten original supplied PNGs without changing the game engine."""
import hashlib,json,re,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE='449773f580453ed46e0f37502e0ac00e1c44a298'
VERSION='V575-WEB-42-ORGAN-CARD-ART'
def old(path):return subprocess.check_output(['git','show',BASE+':'+path],cwd=ROOT)
def dump(path,obj):path.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
def main():
 dist=ROOT/'dist';manifest=json.loads(old('dist/asset-manifest.json'));baseline=list(manifest);report=json.loads(old('dist/verification.json'));version=json.loads(old('dist/version.json'));config_art=json.loads((ROOT/'web/organ-card-art-v610.json').read_text())
 previous=json.loads((dist/'asset-manifest.json').read_text())
 for card in config_art['cards']:
  supplied=ROOT.parent/'upload'/card['upload'];source=supplied if supplied.exists() else dist/card['path'];raw=source.read_bytes();assert hashlib.sha256(raw).hexdigest()==card['sha256'];assert len(raw)==card['bytes'];(dist/card['path']).write_bytes(raw);manifest.append({'path':card['path'],'sha256':card['sha256'],'bytes':len(raw),'kind':'image'})
 def add(raw,ext,kind):
  sha=hashlib.sha256(raw).hexdigest();path='assets/'+sha+'.'+ext;(dist/path).write_bytes(raw);manifest.append({'path':path,'sha256':sha,'bytes':len(raw),'kind':kind});return path
 source=(ROOT/'web/organ-card-art-v610.js').read_text();assert source.count('__ORGAN_CARD_ART_V610__')==1;js=source.replace('__ORGAN_CARD_ART_V610__',json.dumps(config_art,separators=(',',':'),ensure_ascii=False)).encode();css=(ROOT/'web/organ-card-art-v610.css').read_bytes();script=add(js,'js','presentation-code');style=add(css,'css','style')
 html=old('dist/index.html').decode().replace('</head>','<link rel="stylesheet" href="'+style+'">\n<script defer src="'+script+'"></script>\n</head>');build=hashlib.sha256(version['build'].encode()+js+css+html.encode()).hexdigest();config={'version':VERSION,'build':build,'scriptBytes':version['scriptBytes'],'preloadResources':True};html,n=re.subn(r'window\.EVOLVE_WEB_CONFIG=\{.*?\};',lambda _:'window.EVOLVE_WEB_CONFIG='+json.dumps(config,separators=(',',':'))+';',html,count=1);assert n==1
 (dist/'index.html').write_text(html);version.update(config,assets=len(manifest));dump(dist/'version.json',version);(dist/'asset-manifest.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n');report.update(version=VERSION,build=build,index_bytes=len(html.encode()),cached_files=len(manifest),cached_bytes=sum(a['bytes'] for a in manifest));engine=report['home_hub_v601']['engine'];report['organ_card_art_v610']={'baseline':BASE,'script':script,'stylesheet':style,'cards':config_art['cards'],'engine':engine,'engine_unchanged':True,'all_baseline_asset_bytes_unchanged':True,'card_names_levels_effects_and_handlers_unchanged':True,'only_spike_and_whip_cards':True,'display_example_text_removed':True,'decoded_image_cache_limit':3,'physical_Galaxy_S23_plus_tested':False};dump(dist/'verification.json',report)
 known={e['path'] for e in manifest};basepaths={e['path'] for e in baseline}
 for e in previous:
  if e['path'] not in known and e['path'] not in basepaths and e['kind'] in ('style','presentation-code'):(dist/e['path']).unlink(missing_ok=True)
 for e in baseline:assert hashlib.sha256((dist/e['path']).read_bytes()).hexdigest()==e['sha256'],e['path']
 assert (dist/engine).read_bytes()==old('dist/'+engine)
 print(json.dumps(config|{'script':script,'stylesheet':style,'new_original_pngs':10,'baseline_assets_preserved':len(baseline),'engine_unchanged':True}))
if __name__=='__main__':main()
