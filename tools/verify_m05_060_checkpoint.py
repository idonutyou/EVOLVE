#!/usr/bin/env python3
"""Independent persisted M05 60% archive audit and original M04 paid catalog gate."""
import hashlib,json,subprocess,zipfile
from pathlib import Path
R=Path(__file__).resolve().parents[1]
N="EVOLVE_M05_060_20261028"
def sha(x):return hashlib.sha256(x).hexdigest()
m=json.loads((R/"checkpoints"/(N+".json")).read_text())
b=(R/"checkpoints"/(N+".zip")).read_bytes()
assert m["percent"]==60 and m["step"]=="2/3"
assert len(b)==m["bytes"] and sha(b)==m["sha256"] and m["crc_verified"] and m["prior_assets_untouched"]
assert m["original_images"]==1021 and m["site_assets"]==1081
assert m["actual_billing_enabled"] is False
with zipfile.ZipFile(R/"checkpoints"/(N+".zip")) as z:
 assert z.testzip() is None
 assert set(z.namelist())==set(m["files"])|{"CHECKPOINT_MANIFEST.json"}
 assert json.loads(z.read("CHECKPOINT_MANIFEST.json"))["files"]==m["files"]
 for path,info in m["files"].items():
  data=z.read(path)
  assert len(data)==info["bytes"] and sha(data)==info["sha256"] and data==(R/path).read_bytes()
for original in ("web/mock-premium-v615.js","web/mock-premium-ui-v616.js","web/mock-core-visuals-v617.js","web/mock-core-adapter-v617.js","monetization/catalog/draft_skus.json"):
 old=subprocess.check_output(["git","show",m["base"]+":"+original],cwd=R)
 assert old==(R/original).read_bytes(),original
manifest=json.loads((R/"dist/asset-manifest.json").read_text())
assert len(manifest)==1081 and sum(i["kind"]=="image" for i in manifest)==1021
asset=m["added_ui_asset"]
assert sha((R/"dist"/asset).read_bytes())==asset.rsplit("/",1)[1].split(".")[0]
print("M05 60% archive verified:",m["bytes"],m["sha256"],m["file_count"],"original 1021 images untouched")
