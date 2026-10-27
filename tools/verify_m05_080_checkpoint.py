#!/usr/bin/env python3
"""Independently verify M05 80% integration recovery archive, stable game and billing disablement."""
import hashlib,json,subprocess,zipfile
from pathlib import Path
R=Path(__file__).resolve().parents[1]
STEM="EVOLVE_M05_080_20261028"
def sha(b):return hashlib.sha256(b).hexdigest()
m=json.loads((R/"checkpoints"/(STEM+".json")).read_text())
blob=(R/"checkpoints"/(STEM+".zip")).read_bytes()
assert m["stage"]=="M05" and m["percent"]==80 and m["step"]=="3/3"
assert len(blob)==m["bytes"] and sha(blob)==m["sha256"]
assert m["crc_and_sha256_verified"] and m["main_unmodified"] and m["dist_game_untouched_since_70"]
assert m["original_image_count"]==1021 and m["site_asset_count"]==1082 and not m["real_checkout"]
with zipfile.ZipFile(R/"checkpoints"/(STEM+".zip")) as z:
 assert z.testzip() is None
 assert set(z.namelist())==set(m["files"])|{"CHECKPOINT_MANIFEST.json"}
 inside=json.loads(z.read("CHECKPOINT_MANIFEST.json"))
 assert inside["files"]==m["files"] and inside["game_dist_unchanged"]
 for p,info in m["files"].items():
  b=z.read(p)
  assert len(b)==info["bytes"] and sha(b)==info["sha256"] and b==(R/p).read_bytes()
for p in ("dist/index.html","dist/version.json","dist/verification.json","dist/asset-manifest.json","web/mock-premium-v615.js","web/mock-premium-ui-v616.js","web/mock-core-adapter-v617.js","monetization/catalog/draft_skus.json"):
 orig=subprocess.check_output(["git","show",m["base_commit"]+":"+p],cwd=R)
 assert orig==(R/p).read_bytes(),p
print("M05 80% ZIP/file sha and M04/M05 70% game untouched",m["bytes"],m["sha256"],m["file_count"])
