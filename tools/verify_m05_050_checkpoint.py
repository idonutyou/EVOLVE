#!/usr/bin/env python3
"""Independently verify M05 50% persisted recovery ZIP, game source and older assets."""
import hashlib,json,subprocess,zipfile
from pathlib import Path
R=Path(__file__).resolve().parents[1]
N="EVOLVE_M05_050_20261028"
def sha(x):return hashlib.sha256(x).hexdigest()
m=json.loads((R/"checkpoints"/(N+".json")).read_text())
b=(R/"checkpoints"/(N+".zip")).read_bytes()
assert m["stage"]=="M05" and m["percent"]==50 and m["step"]=="2/3"
assert len(b)==m["bytes"] and sha(b)==m["sha256"]
assert m["crc_verified"] and m["prior_assets_preserved"] and m["mock_only"] and not m["live_billing_enabled"]
with zipfile.ZipFile(R/"checkpoints"/(N+".zip")) as z:
 assert z.testzip() is None
 assert set(z.namelist())==set(m["files"])|{"CHECKPOINT_MANIFEST.json"}
 inside=json.loads(z.read("CHECKPOINT_MANIFEST.json"))
 assert inside["files"]==m["files"] and inside["percent"]==50
 for p,info in m["files"].items():
  data=z.read(p)
  assert len(data)==info["bytes"] and sha(data)==info["sha256"] and data==(R/p).read_bytes()
for file in ("web/mock-premium-v615.js","web/mock-premium-ui-v616.js","web/mock-core-visuals-v617.js","web/mock-core-adapter-v617.js","monetization/catalog/draft_skus.json"):
 previous=subprocess.check_output(["git","show",m["base_commit"]+":"+file],cwd=R)
 assert previous==(R/file).read_bytes(),"M04 engine, visuals or payments catalog changed: "+file
manifest=json.loads((R/"dist/asset-manifest.json").read_text())
assert len(manifest)==m["site_asset_count"] and sum(x["kind"]=="image" for x in manifest)==m["image_count"]
report=json.loads((R/"dist/verification.json").read_text())
assert report["m05_ux_050"]["new_asset"]==m["new_dev_asset"]
assert report["m05_ux_050"]["real_checkout"] is False
assert sha((R/"dist"/m["new_dev_asset"]).read_bytes())==m["new_dev_asset"].split("/")[-1][:-3]
print("M05 50% original M04 and archive hashes verified",m["bytes"],m["sha256"])
