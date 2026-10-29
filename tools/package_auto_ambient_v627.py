#!/usr/bin/env python3
"""Package only the automatic character-lighting delta on the verified baseline."""
import argparse, hashlib, json, re, subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
BASE='dca540e54419393191920aab7908cc65bb609e9d'
BASE_BUILD='b6daa0894769f43e5f922f6b5e141efe57cf62b9a8609f6f4eabef4215f7c28c'
OLD='assets/ad12c4f10d7f2b31a02fc516e316649efd5fec1b44926ff4fc0049f6cddd511e.js'
ap=argparse.ArgumentParser();ap.add_argument('--baseline-dir',type=Path);args=ap.parse_args()
def old(path):
 if args.baseline_dir:return (args.baseline_dir/path).read_bytes()
 return subprocess.check_output(['git','show',f'{BASE}:{path}'],cwd=ROOT)
art=json.loads((ROOT/'web/bio-core-art-v625.json').read_text())
inline=lambda x:x.replace('__BIO_CORE_ART_V625__',json.dumps(art,separators=(',',':')))
before=inline(old('web/bio-core-player-v625.js').decode());after=inline((ROOT/'web/bio-core-player-v625.js').read_text())
old_adapter=old('web/mock-core-adapter-v617.js').decode();new_adapter=(ROOT/'web/mock-core-adapter-v617.js').read_text()
engine=old('dist/'+OLD).decode();assert engine.count(before)==1 and engine.count(old_adapter)==1
updated=engine.replace(before,after).replace(old_adapter,new_adapter)
marker='\n})();\n\n// V340_LARGE_WORLD_LEGACY_JOYSTICK';assert updated.count(marker)==1
module=(ROOT/'web/auto-ambient-v627.js').read_text();updated=updated.replace(marker,'\n'+module+marker)
raw=updated.encode();digest=hashlib.sha256(raw).hexdigest();new='assets/'+digest+'.js'
(ROOT/'dist'/new).write_bytes(raw)
manifest=json.loads(old('dist/asset-manifest.json'));matches=[x for x in manifest if x['path']==OLD]
assert len(matches)==1 and not any(x['path']==new for x in manifest)
matches[0].update(path=new,sha256=digest,bytes=len(raw))
(ROOT/'dist/asset-manifest.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n')
html=old('dist/index.html').decode();assert html.count(OLD)==1;html=html.replace(OLD,new)
version=json.loads(old('dist/version.json'));version['version']+='-AUTOAMBIENT627'
version['scriptBytes']+=len(raw)-len(engine.encode());version['build']=hashlib.sha256(BASE_BUILD.encode()+raw).hexdigest()
config={k:version[k] for k in ('version','build','scriptBytes','preloadResources')}
html,count=re.subn(r'window\.EVOLVE_WEB_CONFIG=\{.*?\};',lambda _:'window.EVOLVE_WEB_CONFIG='+json.dumps(config,separators=(',',':'))+';',html,count=1);assert count==1
(ROOT/'dist/index.html').write_text(html);(ROOT/'dist/version.json').write_text(json.dumps(version,ensure_ascii=False,indent=2)+'\n')
report=json.loads(old('dist/verification.json'));report.update(version=version['version'],build=version['build'],index_bytes=len(html.encode()),cached_bytes=sum(e['bytes'] for e in manifest),cached_files=len(manifest))
report['auto_ambient_v627']={'engine':new,'baseline':BASE,'map_sampling':'one small sample per source with reuse','core_specific_settings':False,'shadow':'cached per animation silhouette','image_bytes_changed':False,'save_keys_changed':False}
(ROOT/'dist/verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'engine':new,'sha256':digest,'build':version['build'],'assets':len(manifest)}))
