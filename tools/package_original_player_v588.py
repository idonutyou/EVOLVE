#!/usr/bin/env python3
"""Replace only the player artwork renderer on the exact deployed WEB-20 tree."""
import hashlib,json,re,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE='1ddc00e1fd6e16aa88d7729254e75f23c3ff809d'
VERSION='V575-WEB-21-ORIGINAL-SPECIMEN'
def base(path):return subprocess.check_output(['git','show',BASE+':'+path],cwd=ROOT)
def write(path,value,compact=False):path.write_text(json.dumps(value,ensure_ascii=False,**({'separators':(',',':')} if compact else {'indent':2}))+'\n')
def main():
 d=ROOT/'dist';previous=json.loads(base('dist/version.json'));report=json.loads(base('dist/verification.json'))
 old_engine=report['player_combat']['engine'];original=base('dist/'+old_engine).decode()
 current=json.loads((d/'verification.json').read_text());prior_engine=current.get('original_player',{}).get('engine',old_engine)
 old_art=json.loads(base('web/player-scorpion-art-v586.json'))
 old_module=base('web/player-combat-v587.js').decode().replace("JSON.parse('__PLAYER_SCORPION_ART__')",json.dumps(old_art,separators=(',',':')))
 art=json.loads((ROOT/'web/player-original-art-v588.json').read_text());source=(d/art['path']).read_bytes()
 assert hashlib.sha256(source).hexdigest()==art['sha256'] and len(source)==art['bytes']
 module=(ROOT/'web/player-original-v588.js').read_text().replace("JSON.parse('__PLAYER_ORIGINAL_ART__')",json.dumps(art,separators=(',',':')))
 assert original.count(old_module)==1
 code=original.replace(old_module,module)
 assert code.replace(module,old_module)==original,'Unrelated combat/map/boss code changed'
 raw=code.encode();sha=hashlib.sha256(raw).hexdigest();engine='assets/'+sha+'.js';(d/engine).write_bytes(raw)
 manifest=json.loads(base('dist/asset-manifest.json'));image_count=0
 for e in manifest:
  if e['path']==old_engine:e.update(path=engine,sha256=sha,bytes=len(raw))
  elif e['kind']=='image':
   data=(d/e['path']).read_bytes();assert hashlib.sha256(data).hexdigest()==e['sha256'] and len(data)==e['bytes'],e['path'];image_count+=1
 assert image_count==987
 assert not any(e['path']==art['path'] for e in manifest)
 manifest.append({k:art[k] for k in ['path','sha256','bytes']}|{'kind':'image'})
 build=hashlib.sha256(previous['build'].encode()+raw+source).hexdigest()
 config={'version':VERSION,'build':build,'scriptBytes':previous['scriptBytes']+len(raw)-len(original.encode())}
 html=base('dist/index.html').decode();html=re.sub(r'window\.EVOLVE_WEB_CONFIG=\{.*?\};',lambda _:'window.EVOLVE_WEB_CONFIG='+json.dumps(config)+';',html,count=1)
 before=f'src="{old_engine}" onload="EVOLVE_WEB_CLIENT.loaded({len(original.encode())})"';assert html.count(before)==1
 html=html.replace(before,f'src="{engine}" onload="EVOLVE_WEB_CLIENT.loaded({len(raw)})"')
 (d/'index.html').write_text(html);write(d/'asset-manifest.json',manifest,True);write(d/'version.json',config|{'assets':len(manifest),'source_sha256':previous['source_sha256']})
 def refs(v):
  if isinstance(v,dict):return {k:refs(x) for k,x in v.items()}
  if isinstance(v,list):return [refs(x) for x in v]
  return engine if v==old_engine else v
 report=refs(report);report.update(version=VERSION,build=build,index_bytes=len(html.encode()),image_assets=image_count+1,cached_files=len(manifest),cached_bytes=sum(e['bytes'] for e in manifest))
 report['player_scorpion'].update(art={k:art[k] for k in ['path','sha256','bytes','width','height','alpha']},painted_frames=1,cached_frames=20)
 report['original_player']={'engine':engine,'baseline_commit':BASE,'art':{k:art[k] for k in ['path','sha256','bytes','width','height']},'original_source_bytes_unchanged':True,'generative_redraw':False,'anatomy_offsets':art['anatomy_offsets'],'cached_poses':20,'pose_surface':art['surface'],'home_preview_surface':art['previewSurface'],'mesh_vertices':len(art['points']),'mesh_triangles':len(art['triangles']),'minimum_triangle_area_ratio':art['minimum_triangle_area_ratio'],'existing_image_bytes_unchanged':image_count,'combat_facing_maps_bosses_save_keys_unchanged':True,'physical_Galaxy_S23_plus_tested':False}
 write(d/'verification.json',report)
 for obsolete in {old_engine,prior_engine}-{engine}:
  assert re.fullmatch(r'assets/[a-f0-9]{64}\.js',obsolete);(d/obsolete).unlink(missing_ok=True)
 checkpoint={'task':'Use the supplied original creature without a generative redraw; shift its raised forelimbs slightly toward the head and cyan core slightly toward the tail, consistently in home and combat poses','progress':30,'status':'Exact supplied source imported unchanged and native anatomy/pose renderer packaged; visual/browser verification pending','baseline_commit':BASE,'version':VERSION,'build':build,'engine':'dist/'+engine,'constraints':report['original_player'],'next':'Inspect original detail and both requested offsets, verify home and all twenty native combat poses, preserve WEB-20 facing/combat/lightning lock, automatically upload and publish'}
 write(ROOT/'docs/original-player-v588-checkpoint.json',checkpoint);write(ROOT/'docs/monster-motion-v577-checkpoint.json',checkpoint)
 print(json.dumps(config|{'engine':engine,'preserved_images':image_count,'source_bytes':len(source)}))
if __name__=='__main__':main()
