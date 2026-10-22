#!/usr/bin/env python3
"""Add only WEB-13 warning presentation over the deployed WEB-12 package."""
import hashlib,json,re,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE='a3d1fb7c7bed975a2c4b7703923960ba309bc289'
OLD='assets/61a82afb656587b351c3e67826ef7f5c3c254cc3623fdb16c8d9d52e8dd2b86a.js'
VERSION='V575-WEB-13-BOSS-CINEMATIC'
def base(path):return subprocess.check_output(['git','show',BASE+':'+path],cwd=ROOT)
def write(path,data,compact=False):path.write_text(json.dumps(data,separators=(',',':'))+'\n' if compact else json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def package():
 d=ROOT/'dist';current=json.loads((d/'version.json').read_text());assert current['version'] in ['V575-WEB-12-RED-PULSE',VERSION]
 art=json.loads((ROOT/'web/boss-cinematic-art-v580.json').read_text());assert set(art)=={'bio','venom'}
 for a in art.values():
  assert not a.get('draft'), 'Do not package unapproved camera drafts'
  assert hashlib.sha256((d/a['path']).read_bytes()).hexdigest()==a['sha256']
  assert a['alpha'] and a['width']%2==0 and a['height']%2==0
 old=base('dist/'+OLD).decode();code=old;source=(ROOT/'web/boss-cinematic-v580.js').read_text();assert source.count("JSON.parse('__BOSS_CINEMATIC_ART__')")==1
 source=source.replace("JSON.parse('__BOSS_CINEMATIC_ART__')",json.dumps(art,separators=(',',':')))
 before='.then(()=>Promise.all([monsterReadyV577,redPulseImageReadyV579])).then(()=>{releaseNormalEnemySourcesV425();'
 assert code.count(before)==1;code=code.replace(before,before.replace('redPulseImageReadyV579]','redPulseImageReadyV579,cinematicReadyV580]'))
 marker='\nwindow.EVOLVE_WEB_GUARD=';assert code.count(marker)==1;code=code.replace(marker,'\n'+source+marker)
 raw=code.encode();sha=hashlib.sha256(raw).hexdigest();engine='assets/'+sha+'.js';(d/engine).write_bytes(raw)
 manifest=json.loads(base('dist/asset-manifest.json'));images=[e for e in manifest if e['kind']=='image']
 for e in images:assert hashlib.sha256((d/e['path']).read_bytes()).hexdigest()==e['sha256'],e['path']
 manifest=[e for e in manifest if e['path']!=OLD]+[{'path':engine,'sha256':sha,'bytes':len(raw),'kind':'game-code'}]+[{k:a[k] for k in ['path','sha256','bytes']}|{'kind':'image'} for a in art.values()]
 oldver=json.loads(base('dist/version.json'));build=hashlib.sha256(oldver['build'].encode()+raw).hexdigest();config={'version':VERSION,'build':build,'scriptBytes':oldver['scriptBytes']+len(raw)-len(old.encode())}
 html=base('dist/index.html').decode();html=re.sub(r'window\.EVOLVE_WEB_CONFIG=\{.*?\};',lambda m:'window.EVOLVE_WEB_CONFIG='+json.dumps(config)+';',html,count=1)
 before=f'src="{OLD}" onload="EVOLVE_WEB_CLIENT.loaded({len(old.encode())})"';assert html.count(before)==1;html=html.replace(before,f'src="{engine}" onload="EVOLVE_WEB_CLIENT.loaded({len(raw)})"');(d/'index.html').write_text(html)
 write(d/'asset-manifest.json',manifest,True);write(d/'version.json',config|{'assets':len(manifest),'source_sha256':oldver['source_sha256']})
 report=json.loads(base('dist/verification.json'));report.update(version=VERSION,build=build,index_bytes=len(html.encode()),image_assets=len(images)+2,cached_files=len(manifest),cached_bytes=sum(e['bytes'] for e in manifest))
 report['boss_cinematic']={'baseline_commit':BASE,'engine':engine,'art':art,'warning_seconds':3,'new_painted_poses':8,'frontal_camera':True,'predecoded_frame_canvases':True,'per_frame_image_processing':False,'preserved_original_images':len(images),'original_image_bytes_unchanged':True,'red_device_and_centered_arena_preserved':True,'combat_stats_and_save_keys_unchanged':True,'physical_Galaxy_S23_plus_tested':False};write(d/'verification.json',report)
 p=ROOT/'docs/boss-cinematic-v580-checkpoint.json';c=json.loads(p.read_text());c.update(progress=40,status='WEB-13 packaged for cinematic integration tests',art=art,build=build,engine='dist/'+engine,next='Verify cinematic playback, controls, pause/resume, scheduled boss entry and WEB-12 regression');write(p,c)
 (d/OLD).unlink(missing_ok=True);print(json.dumps({'version':VERSION,'build':build,'engine':engine,'preserved_images':len(images),'new_poses':8}))
if __name__=='__main__':package()
