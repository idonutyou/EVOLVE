#!/usr/bin/env python3
"""Independently validate M05 30% recovery ZIP and original M04 live assets."""
import hashlib,json,subprocess,zipfile
from pathlib import Path
r=Path(__file__).resolve().parents[1]
name="EVOLVE_M05_030_20261028"
sha=lambda b:hashlib.sha256(b).hexdigest()
m=json.loads((r/"checkpoints"/(name+".json")).read_text())
zpath=r/"checkpoints"/(name+".zip")
blob=zpath.read_bytes()
assert m["percent"]==30 and m["stage"]=="M05"
assert len(blob)==m["bytes"] and sha(blob)==m["sha256"]
assert m["crc_verified"] and m["design_only"] and not m["real_payment"]
with zipfile.ZipFile(zpath) as z:
 assert z.testzip() is None
 assert set(z.namelist())==set(m["files"])|{"MANIFEST.json"}
 internal=json.loads(z.read("MANIFEST.json"))
 assert internal["members"]==m["files"]
 for p,v in m["files"].items():
  b=z.read(p)
  assert len(b)==v["bytes"] and sha(b)==v["sha256"] and b==(r/p).read_bytes()
for p in ["dist/version.json","dist/index.html","dist/asset-manifest.json","monetization/catalog/draft_skus.json","web/mock-premium-v615.js","web/mock-premium-ui-v616.js"]:
 orig=subprocess.check_output(["git","show",m["base"]+":"+p],cwd=r)
 assert orig==(r/p).read_bytes(),p
print("M05 30% verified",m["bytes"],m["sha256"],len(m["files"]))
