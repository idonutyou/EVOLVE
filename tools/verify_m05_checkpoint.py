#!/usr/bin/env python3
"""Reopen and verify the M05 10% recovery bundle."""
import hashlib,json,zipfile
from pathlib import Path
root=Path(__file__).resolve().parents[1]
stem='checkpoints/EVOLVE_M05_010_20261028'
proof=json.loads((root/(stem+'.json')).read_text())
binary=(root/(stem+'.zip')).read_bytes()
assert len(binary)==proof['bytes']
assert hashlib.sha256(binary).hexdigest()==proof['sha256']
assert proof['percent']==10 and proof['stage']=='M05'
with zipfile.ZipFile(root/(stem+'.zip')) as archive:
 assert archive.testzip() is None
 assert set(archive.namelist())==set(proof['files'])|{'CHECKPOINT_MANIFEST.json'}
 for name,info in proof['files'].items():
  body=archive.read(name)
  assert hashlib.sha256(body).hexdigest()==info['sha256']
  assert len(body)==info['bytes']
  assert body==(root/name).read_bytes()
print('M05 checkpoint SHA256 and members verified',proof['sha256'])
