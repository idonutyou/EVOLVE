#!/usr/bin/env python3
"""Package only the WEB-28 changes over the verified WEB-27 tree."""
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
BASE='7689cab'
VERSION='V575-WEB-28-PLAYFIELD'
def old(path):return subprocess.check_output(['git','show',BASE+':'+path],cwd=ROOT)
def dump(path,value,compact=False):path.write_text(json.dumps(value,ensure_ascii=False,**({'separators':(',',':')} if compact else {'indent':2}))+'\n')
def main():
 dist=ROOT/'dist'
 manifest=json.loads(old('dist/asset-manifest.json'))
 version=json.loads(old('dist/version.json'));report=json.loads(old('dist/verification.json'))
 html=old('dist/index.html').decode();removed=[]
 prior_manifest=json.loads((dist/'asset-manifest.json').read_text())
 def put(data,ext,kind):
  sha=hashlib.sha256(data).hexdigest();path='assets/'+sha+'.'+ext
  (dist/path).write_bytes(data)
  return {'path':path,'sha256':sha,'bytes':len(data),'kind':kind}
 art_source=dist/json.loads((ROOT/'web/ground-art-v595.json').read_text())['path']
 art=put(art_source.read_bytes(),'png','image')
 dump(ROOT/'web/ground-art-v595.json',{k:art[k] for k in ['path','sha256','bytes']}|{'prompt':'Top-down circular scarlet plasma eruption, bright crimson damage perimeter, hot branching cracks and plasma jets, genuinely transparent background.','generation':'built-in image_gen','original_bytes_preserved':True})
 engine=next(e for e in manifest if e['path']==report['upgrade_reference']['engine'])
 original=old('dist/'+engine['path']).decode();code=original
 before=old('web/monster-catalog-v593.js').decode();after=(ROOT/'web/monster-catalog-v593.js').read_text()
 assert code.count(before)==1;code=code.replace(before,after)
 def replace(before,after):
  nonlocal code
  assert code.count(before)==1,before[:160]
  code=code.replace(before,after)
 replace("const e=spawn(...args);if(!e||e.dead||e.finalBoss||e.venomAddV553||bossArena?.active)return e;const p=mapChooseDoorV562(e,e.r);","const e=spawn(...args);if(evolveAdminEnabledV585&&upgradeSpawnPermissionV593)return e;if(!e||e.dead||e.finalBoss||e.venomAddV553||bossArena?.active)return e;const p=mapChooseDoorV562(e,e.r);")
 replace("if(e.dead||e.finalBoss||e.venomAddV553||e.mapDoorSpawnV562)continue;const p=mapChooseDoorV562(e,e.r);","if(e.dead||e.finalBoss||e.venomAddV553||e.mapDoorSpawnV562||e.catalogSpawnV593)continue;const p=mapChooseDoorV562(e,e.r);")
 replace("flash('CONTAINMENT PURGE · MOVE',1000)","flash(homeTextV522('CONTAINMENT PURGE · MOVE','시설 정화 · 붉은 범위에서 벗어나세요'),1300)")
 start=code.index('function drawActiveHazardsV583(){');end=code.index(' for(const tg of telegraphs){',start)
 code=code[:start]+'function drawActiveHazardsV583(){\n for(const z of purges)if(z.warn<=0)paintGroundFieldV595(z,true,true);\n for(const z of biomeHazards)if(z.warn<=0)paintGroundFieldV595(z,false,true);\n'+code[end:]
 module=(ROOT/'web/playfield-v595.js').read_text().replace("JSON.parse('__GROUND_ART_V595__')",json.dumps({k:art[k] for k in ['path','sha256','bytes']},separators=(',',':')))
 marker='\nwindow.EVOLVE_WEB_GUARD=';assert code.count(marker)==1;code=code.replace(marker,'\n'+module+marker)
 new_engine=put(code.encode(),'js','game-code')
 style=next(e for e in manifest if e['path']==report['upgrade_reference']['stylesheet'])
 new_style=put(old('dist/'+style['path'])+b'\n'+(ROOT/'web/playfield-v595.css').read_bytes(),'css','style')
 shell=next(e for e in manifest if e['kind']=='web-shell');new_shell=put((ROOT/'web/client.js').read_bytes(),'js','web-shell')
 for entry,new in [(engine,new_engine),(style,new_style),(shell,new_shell)]:
  removed.append(entry['path']);html=html.replace(entry['path'],new['path'])
  report=json.loads(json.dumps(report).replace(entry['path'],new['path']));entry.update(new)
 manifest.append(art)
 for e in manifest:
  if e['kind']=='image' and e['path']!=art['path']:
   raw=(dist/e['path']).read_bytes();assert len(raw)==e['bytes'] and hashlib.sha256(raw).hexdigest()==e['sha256']
 script_bytes=version['scriptBytes']+len(code.encode())-len(original.encode())
 build=hashlib.sha256(version['build'].encode()+code.encode()+(ROOT/'web/client.js').read_bytes()+(ROOT/'web/playfield-v595.css').read_bytes()+art['sha256'].encode()).hexdigest()
 config={'version':VERSION,'build':build,'scriptBytes':script_bytes,'preloadResources':True}
 html=re.sub(r'window\.EVOLVE_WEB_CONFIG=\{.*?\};','window.EVOLVE_WEB_CONFIG='+json.dumps(config,separators=(',',':'))+';',html,count=1)
 def defer(m):
  attrs=m['attrs'];src=re.search(r'src="([^"]+)"',attrs)[1];ident=re.search(r'id="([^"]+)"',attrs)
  return '<script'+(' id="'+ident[1]+'"' if ident else '')+' type="application/evolve-resource" data-evolve-src="'+src+'"></script>'
 html=re.sub(r'<script(?P<attrs>[^>]*\bdefer\b[^>]*)>\s*</script>',defer,html)
 html=html.replace('<span id="webStatus">실행 준비 0%</span>','<span id="webStatus">리소스를 다운로드 중 · 0%</span><progress id="webProgress" max="100" value="0" aria-label="리소스 다운로드 진행률"></progress>')
 html=html.replace('<small>첫 접속에는 원본 파일을 불러와.<br>다음 접속부터 저장된 파일을 재사용해.</small>','<small id="webDetail">남은 시간 계산 중 · 다음 접속부터 저장된 리소스를 재사용해.</small>')
 html=html.replace('</head>','<style>#webProgress{width:min(76vw,340px);height:8px;accent-color:#d84a43;margin:auto}#webDetail{max-width:380px}</style>\n</head>',1)
 version.update(config,assets=len(manifest))
 report.update(version=VERSION,build=build,index_bytes=len(html.encode()),cached_files=len(manifest),cached_bytes=sum(e['bytes'] for e in manifest))
 report['upgrade_reference'].update(engine=new_engine['path'],stylesheet=new_style['path'])
 rules={'engine':new_engine['path'],'stylesheet':new_style['path'],'shell':new_shell['path'],'ground_art':art,'compact_transparent_selector':True,'prepared_map_reused':True,'gate_accessor_and_route_release':True,'bosses_only_in_phase_controls':True,'catalog_entries':16,'download_bytes_and_eta':True,'cache_reused':True,'existing_image_bytes_unchanged':sum(e['kind']=='image' for e in manifest)-1,'physical_Galaxy_S23_plus_tested':False}
 report['playfield_v595']=rules
 (dist/'index.html').write_text(html);dump(dist/'asset-manifest.json',manifest,True);dump(dist/'version.json',version);dump(dist/'verification.json',report)
 for e in prior_manifest:
  if e['kind'] in ['game-code','style','web-shell']:removed.append(e['path'])
 for path in removed:
  if path not in {e['path'] for e in manifest}:(dist/path).unlink(missing_ok=True)
 checkpoint=ROOT/'docs/playfield-hazards-v595-checkpoint.json';plan=json.loads(checkpoint.read_text());plan.update(progress=50,build=build,rules=rules,status='Implemented; local execution checks pending; no deployment yet');dump(checkpoint,plan)
 print(json.dumps(config|{'art':art['path'],'catalog':16,'preserved_images':rules['existing_image_bytes_unchanged']}))
if __name__=='__main__':main()
