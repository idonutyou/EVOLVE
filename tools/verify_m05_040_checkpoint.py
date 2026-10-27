#!/usr/bin/env python3
"""Independent M05 40 percent feature build recovery ZIP verification."""
import hashlib,json,subprocess,zipfile
from pathlib import Path
R=Path(__file__).resolve().parents[1]
N="EVOLVE_M05_040_20261028"
digest=lambda b:hashlib.sha256(b).hexdigest()
m=json.loads((R/'checkpoints'/(N+'.json')).read_text())
blob=(R/'checkpoints'/(N+'.zip')).read_bytes()
assert m['stage']=='M05' and m['percent']==40 and m['step']=='2/3'
assert digest(blob)==m['sha256'] and len(blob)==m['bytes']
assert m['crc_verified'] and m['prior_assets_untouched'] and not m['real_checkout']
with zipfile.ZipFile(R/'checkpoints'/(N+'.zip')) as z:
 assert z.testzip() is None
 assert set(z.namelist())==set(m['files'])|{'MANIFEST.json'}
 assert json.loads(z.read('MANIFEST.json'))['files']==m['files']
 for p,d in m['files'].items():
  b=z.read(p);assert digest(b)==d['sha256'] and len(b)==d['bytes'] and b==(R/p).read_bytes()
for p in ('web/mock-premium-v615.js','web/mock-premium-ui-v616.js','dist/assets/e343fb68db8ad1e2fb09bad6c28f3d95eff1c5ef232438670453adb56cfba64a.js','monetization/catalog/draft_skus.json'):
 before=subprocess.check_output(['git','show',m['base']+':'+p],cwd=R)
 assert before==(R/p).read_bytes(),'Original M04 mock or paid catalog changed: '+p
assert len(json.loads((R/'dist/asset-manifest.json').read_text()))==m['site_asset_count']
assert m['image_count']==1021
print('M05 40% ZIP SHA/CRC and original M04 bytes verified',m['bytes'],m['sha256'])
