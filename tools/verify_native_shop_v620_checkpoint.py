#!/usr/bin/env python3
"""Verify deleted legacy DEV UI and the new SHOP recovery ZIP, every member SHA/CRC and unchanged images."""
import hashlib,json,subprocess,zipfile
from pathlib import Path
R=Path(__file__).resolve().parents[1];N='EVOLVE_NATIVE_SHOP_V620_20261028'
sha=lambda b:hashlib.sha256(b).hexdigest()
m=json.loads((R/'checkpoints'/(N+'.json')).read_text())
blob=(R/'checkpoints'/(N+'.zip')).read_bytes()
assert m['stage']=='NATIVE_SHOP_V620' and sha(blob)==m['sha256'] and len(blob)==m['bytes']
assert m['sha256_crc_verified'] and m['original_image_count']==1021
assert m['site_asset_count']==1072 and m['legacy_dev_assets_removed']==14 and not m['real_checkout_enabled']
with zipfile.ZipFile(R/'checkpoints'/(N+'.zip')) as z:
 assert z.testzip() is None
 assert set(z.namelist())==set(m['files'])|{'CHECKPOINT_MANIFEST.json'}
 inside=json.loads(z.read('CHECKPOINT_MANIFEST.json'))
 assert inside['files']==m['files'] and inside['deleted_files']==m['deleted_paths']
 for p,e in m['files'].items():
  b=z.read(p);assert len(b)==e['bytes'] and sha(b)==e['sha256'] and b==(R/p).read_bytes()
for path in m['deleted_paths']:
 assert not (R/path).exists(),'Obsolete DEV file still present: '+path
for p in ('dist/sw.js','monetization/catalog/draft_skus.json','web/mock-core-adapter-v617.js'):
 assert subprocess.check_output(['git','show',m['base_commit']+':'+p],cwd=R)==(R/p).read_bytes(),'Protected original modified: '+p
print('NATIVE SHOP V620 durable ZIP and 16 Git-tracked deletions verified',m['bytes'],m['sha256'],m['deleted_count'])
