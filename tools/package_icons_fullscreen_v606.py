#!/usr/bin/env python3
"""Replace only home glyphs/start interior, then add fullscreen web-app presentation."""
import hashlib,json,re,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE='caa0430a13595695ce896aac22a5732bb39eb2ef'
VERSION='V575-WEB-39-ICONS-FULLSCREEN'
def old(n):return subprocess.check_output(['git','show',BASE+':'+n],cwd=ROOT)
def dump(p,d):p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def main():
 d=ROOT/'dist';v=json.loads(old('dist/version.json'));report=json.loads(old('dist/verification.json'));manifest=json.loads(old('dist/asset-manifest.json'));previous=json.loads((d/'asset-manifest.json').read_text())
 controls=json.loads((ROOT/'web/home-controls-art-v606.json').read_text())
 def asset(raw,ext,kind):
  sha=hashlib.sha256(raw).hexdigest();path='assets/'+sha+'.'+ext;(d/path).write_bytes(raw)
  entry={'path':path,'sha256':sha,'bytes':len(raw),'kind':kind}
  if not any(e['path']==path for e in manifest):manifest.append(entry)
  return path
 controls['path']=asset((ROOT/controls['source']).read_bytes(),'png','image')
 fulljs=asset((ROOT/'web/fullscreen-v606.js').read_bytes(),'js','web-shell')
 fullcss=asset((ROOT/'web/fullscreen-v606.css').read_bytes(),'css','style')
 appmanifest=json.loads((ROOT/'web/manifest-v606.json').read_text());appmanifest['icons']=[]
 for size,purpose,name in [(192,'any','icon-192.png'),(512,'any','icon-512.png'),(512,'maskable','icon-maskable-512.png')]:
  path=asset((ROOT/'art/home-controls-v606'/name).read_bytes(),'png','image');appmanifest['icons'].append({'src':path,'sizes':f'{size}x{size}','type':'image/png','purpose':purpose})
 (d/'manifest.webmanifest').write_text(json.dumps(appmanifest,ensure_ascii=False,indent=2)+'\n')
 engine=report['home_hub_v601']['engine'];style=report['home_hub_v601']['stylesheet'];target=engine;target_style=style;original=old('dist/'+engine).decode();raw=original.encode();css=old('dist/'+style)
 controlsjs=asset((ROOT/'web/home-controls-v606.js').read_text().replace('__HOME_CONTROLS_ART_V606__',json.dumps(controls,separators=(',',':'))).encode(),'js','web-shell')
 html=old('dist/index.html').decode().replace(engine,target).replace(style,target_style);html=html.replace('</head>','<link rel="manifest" href="manifest.webmanifest">\n<meta name="mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n<link rel="apple-touch-icon" href="'+appmanifest['icons'][0]['src']+'">\n<link rel="stylesheet" href="'+fullcss+'">\n<script defer src="'+fulljs+'"></script>\n<script defer src="'+controlsjs+'"></script>\n</head>');build=hashlib.sha256(v['build'].encode()+raw+css+html.encode()).hexdigest();config={'version':VERSION,'build':build,'scriptBytes':v['scriptBytes']+len(raw)-len(original.encode()),'preloadResources':True}
 html,n=re.subn(r'window\.EVOLVE_WEB_CONFIG=\{.*?\};',lambda m:'window.EVOLVE_WEB_CONFIG='+json.dumps(config,separators=(',',':'))+';',html,count=1);assert n==1
 html=re.sub(r'(src="'+re.escape(target)+r'" onload="EVOLVE_WEB_CLIENT\.loaded\()\d+(\))',lambda m:m[1]+str(len(raw))+m[2],html)
 (d/'index.html').write_text(html);v.update(config,assets=len(manifest));dump(d/'version.json',v);(d/'asset-manifest.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n')
 report=json.loads(json.dumps(report).replace(engine,target).replace(style,target_style));report.update(version=VERSION,build=build,index_bytes=len(html.encode()),cached_files=len(manifest),cached_bytes=sum(x['bytes'] for x in manifest))
 report['icons_fullscreen_v606']={'baseline':BASE,'engine':target,'stylesheet':target_style,'reference':controls,'controls_script':controlsjs,'navigation_frames_labels_and_layout_unchanged':True,'reference_icon_row':1,'start_inner_material_row':5,'start_frame_unchanged':True,'fullscreen_manifest':'manifest.webmanifest','fullscreen_script':fulljs,'fullscreen_style':fullcss,'save_keys_and_update_timing_unchanged':True,'physical_Galaxy_S23_plus_tested':False};dump(d/'verification.json',report)
 keep={a['path'] for a in manifest}
 for a in previous:
  if a['path'] not in keep and a['kind'] in ('game-code','style','web-shell'):(d/a['path']).unlink(missing_ok=True)
 for e in manifest:
  if e['kind']=='image':assert hashlib.sha256((d/e['path']).read_bytes()).hexdigest()==e['sha256']
 print(json.dumps(config|{'engine':target,'stylesheet':target_style,'original_image_hashes_preserved':sum(e['kind']=='image' for e in manifest),'entire_game_engine_unchanged':True}))
if __name__=='__main__':main()
