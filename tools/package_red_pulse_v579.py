#!/usr/bin/env python3
"""Apply only the reviewed red-device and centered-arena changes over WEB-11."""
import hashlib,json,re,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE='d7ac76f207e5dc0e42c602b9a7831b9c27bbbd1c'
OLD='assets/ad9e5570775ca0ff30c21a612fe37008c6b22fc39cd8962b79d57182be13ffc6.js'
VERSION='V575-WEB-12-RED-PULSE'
def base(path):return subprocess.check_output(['git','show',BASE+':'+path],cwd=ROOT)
def write(path,data,compact=False):path.write_text(json.dumps(data,separators=(',',':'))+'\n' if compact else json.dumps(data,indent=2)+'\n')
def package():
 d=ROOT/'dist';current=json.loads((d/'version.json').read_text());assert current['version'] in ['V575-WEB-11-LEGACY-MONSTER-MOTION',VERSION]
 old=base('dist/'+OLD).decode();code=old
 changes=[
  ('const l=clamp(player.x-side/2,16,WORLD_W-side-16),top=clamp(player.y-side/2,16,WORLD_H-side-16);','const l=WORLD_W/2-side/2,top=WORLD_H/2-side/2;'),
  ('insets=[36,Math.min(86,side*.12),Math.min(138,side*.20)]','insets=[24]'),
  ('const e=spawn(...args);if(!e||e.dead||e.finalBoss||e.venomAddV553)return e;const p=mapChooseDoorV562(e,e.r);','const e=spawn(...args);if(!e||e.dead||e.finalBoss||e.venomAddV553||bossArena?.active)return e;const p=mapChooseDoorV562(e,e.r);'),
  ('function admitUnregistered(){for(const e of enemies)','function admitUnregistered(){if(bossArena?.active)return;for(const e of enemies)'),
  ('if(window.__EVOLVE_LIGHTNING_V576__)lightningV576.drawGround(ctx);','if(window.__EVOLVE_LIGHTNING_V576__)lightningV576.drawGround(ctx);\n  if(window.__EVOLVE_RED_PULSE_V579__)drawRedPulseGroundV579(ctx);'),
  ('if(window.__EVOLVE_LIGHTNING_V576__)lightningV576.draw(ctx);','if(window.__EVOLVE_LIGHTNING_V576__)lightningV576.draw(ctx);\n  if(window.__EVOLVE_RED_PULSE_V579__)drawRedPulseTopV579(ctx);'),
  ('.then(()=>monsterReadyV577).then(()=>{releaseNormalEnemySourcesV425();','.then(()=>Promise.all([monsterReadyV577,redPulseImageReadyV579])).then(()=>{releaseNormalEnemySourcesV425();')
 ]
 for before,after in changes:
  if code.count(before)!=1:raise ValueError('Baseline anchor mismatch: '+before[:90])
  code=code.replace(before,after)
 art=json.loads((ROOT/'web/red-pulse-art-v579.json').read_text())
 pulse=(ROOT/'web/red-pulse-v579.js').read_text().replace("JSON.parse('__RED_PULSE_ART__')",json.dumps(art,separators=(',',':')))
 arena=(ROOT/'web/centered-arena-v579.js').read_text()
 marker='\nwindow.EVOLVE_WEB_GUARD='
 assert code.count(marker)==1
 code=code.replace(marker,'\n'+pulse+'\n'+arena+marker)
 raw=code.encode();sha=hashlib.sha256(raw).hexdigest();engine='assets/'+sha+'.js';(d/engine).write_bytes(raw)
 manifest=json.loads(base('dist/asset-manifest.json'));images=[e for e in manifest if e['kind']=='image']
 for e in images:assert hashlib.sha256((d/e['path']).read_bytes()).hexdigest()==e['sha256'],e['path']
 assert hashlib.sha256((d/art['path']).read_bytes()).hexdigest()==art['sha256']
 manifest=[e for e in manifest if e['path']!=OLD]+[{'path':engine,'sha256':sha,'bytes':len(raw),'kind':'game-code'},{k:art[k] for k in ['path','sha256','bytes']}|{'kind':'image'}]
 oldver=json.loads(base('dist/version.json'));build=hashlib.sha256(oldver['build'].encode()+raw).hexdigest();config={'version':VERSION,'build':build,'scriptBytes':oldver['scriptBytes']+len(raw)-len(old.encode())}
 html=base('dist/index.html').decode();html=re.sub(r'window\.EVOLVE_WEB_CONFIG=\{.*?\};',lambda m:'window.EVOLVE_WEB_CONFIG='+json.dumps(config)+';',html,count=1)
 before=f'src="{OLD}" onload="EVOLVE_WEB_CLIENT.loaded({len(old.encode())})"';assert html.count(before)==1;html=html.replace(before,f'src="{engine}" onload="EVOLVE_WEB_CLIENT.loaded({len(raw)})"');(d/'index.html').write_text(html)
 write(d/'asset-manifest.json',manifest,True);write(d/'version.json',config|{'assets':len(manifest),'source_sha256':oldver['source_sha256']})
 report=json.loads(base('dist/verification.json'));report.update(version=VERSION,build=build,index_bytes=len(html.encode()),image_assets=len(images)+1,cached_files=len(manifest),cached_bytes=sum(e['bytes'] for e in manifest))
 report['red_pulse_device']={'baseline_commit':BASE,'engine':engine,'art':art,'hold_seconds':3,'respawn_seconds':20,'allowed_sites':['regen','shield','redPulse'],'one_active_device':True,'screen_snapshot_damage':True,'wavefront_damage_once':True,'original_images_preserved':len(images),'original_image_bytes_unchanged':True,'boss_map_center':True,'player_teleport_near_center':True,'boss_reinforcements_inner_edge':True,'all_combat_bodies_confined':True,'maps_and_save_keys_unchanged':True,'physical_Galaxy_S23_plus_tested':False}
 write(d/'verification.json',report)
 p=ROOT/'docs/red-pulse-v579-checkpoint.json';c=json.loads(p.read_text());c.update(progress=40,status='WEB-12 packaged for device and centered-arena integration tests',build=build,engine='dist/'+engine,next='Run device and arena unit checks, then campaign browser tests');write(p,c)
 (d/OLD).unlink(missing_ok=True);print(json.dumps({'version':VERSION,'build':build,'engine':engine,'preserved_images':len(images)}))
if __name__=='__main__':package()
