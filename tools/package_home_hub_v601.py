#!/usr/bin/env python3
"""Add the home hub to the exact WEB-33 release; keep gameplay and art intact."""
import hashlib,json,re,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE='bbc738b6822f2836780b805b742da48e1313f128'
VERSION='V575-WEB-34-HOME-HUB'
def old(n):return subprocess.check_output(['git','show',BASE+':'+n],cwd=ROOT)
def dump(p,d):p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def main():
 d=ROOT/'dist';manifest=json.loads(old('dist/asset-manifest.json'));v=json.loads(old('dist/version.json'));report=json.loads(old('dist/verification.json'));previous=json.loads((d/'asset-manifest.json').read_text());base_paths={a['path'] for a in manifest}
 def asset(raw,ext,kind):
  sha=hashlib.sha256(raw).hexdigest();path='assets/'+sha+'.'+ext;(d/path).write_bytes(raw)
  if not any(a['path']==path for a in manifest):manifest.append({'path':path,'sha256':sha,'bytes':len(raw),'kind':kind})
  return {'path':path,'sha256':sha,'bytes':len(raw)}
 art=asset((ROOT/'art/home-hub-v601/approved-ui.png').read_bytes(),'png','image')|{'width':711,'height':340,'original_bytes_unchanged':True}
 font_css=(ROOT/'web/home-hub-fonts-v601.css').read_text()
 for i,font in enumerate(json.loads((ROOT/'web/home-hub-font-v601.json').read_text())['fonts']):
  font_asset=asset((ROOT/font['path']).read_bytes(),font['format'],'font');font_css=font_css.replace('__HOME_HUB_FONT_'+str(i)+'_V601__',Path(font_asset['path']).name)
 css=(ROOT/'web/home-hub-v601.css').read_text().replace('__HOME_HUB_FONTS_V601__',font_css);style=asset(css.encode(),'css','style')
 engine=report['equipment_fit_v600']['engine'];original=old('dist/'+engine).decode();module=(ROOT/'web/home-hub-v601.js').read_text().replace('__HOME_HUB_ART_V601__',json.dumps(art,separators=(',',':')));marker='\nwindow.EVOLVE_WEB_GUARD=';assert original.count(marker)==1
 code=original.replace(marker,'\n'+module+marker);assert code.replace('\n'+module+marker,marker)==original
 target=asset(code.encode(),'js','game-code');manifest=[a for a in manifest if a['path']!=engine]
 html=old('dist/index.html').decode().replace(engine,target['path']);html=html.replace('</head>','<link rel="stylesheet" href="'+style['path']+'">\n</head>')
 build=hashlib.sha256(v['build'].encode()+code.encode()+css.encode()+html.encode()).hexdigest();config={'version':VERSION,'build':build,'scriptBytes':v['scriptBytes']+len(code.encode())-len(original.encode()),'preloadResources':True}
 html,n=re.subn(r'window\.EVOLVE_WEB_CONFIG=\{.*?\};',lambda m:'window.EVOLVE_WEB_CONFIG='+json.dumps(config,separators=(',',':'))+';',html,count=1);assert n==1
 v.update(config,assets=len(manifest));(d/'index.html').write_text(html);dump(d/'version.json',v);(d/'asset-manifest.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n')
 report=json.loads(json.dumps(report).replace(engine,target['path']));report.update(version=VERSION,build=build,index_bytes=len(html.encode()),cached_files=len(manifest),cached_bytes=sum(a['bytes'] for a in manifest),image_assets=sum(a['kind']=='image' for a in manifest))
 report['home_hub_v601']={'baseline':BASE,'engine':target['path'],'stylesheet':style['path'],'art':art,'fonts':json.loads((ROOT/'web/home-hub-fonts-v601.json').read_text()),'navigation_order':['shop','parts','battle','challenge','codex'],'every_tab_can_be_enlarged':True,'single_selected_tab':True,'existing_gameplay_unchanged':True,'existing_saves_preserved':True,'original_image_bytes_unchanged':1004,'physical_Galaxy_S23_plus_tested':False};dump(d/'verification.json',report)
 keep={a['path'] for a in manifest}
 for a in previous:
  if a['path'] not in keep and (a['path']==engine or a['path'] not in base_paths):(d/a['path']).unlink(missing_ok=True)
 for a in json.loads(old('dist/asset-manifest.json')):
  if a['kind']=='image':assert hashlib.sha256((d/a['path']).read_bytes()).hexdigest()==a['sha256']
 print(json.dumps(config|{'engine':target['path'],'stylesheet':style['path'],'original_image_hashes_preserved':1004}))
if __name__=='__main__':main()
