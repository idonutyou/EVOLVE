#!/usr/bin/env python3
"""Check final M05 100% ZIP byte hashes, CRC, all old game assets and disabled real billing."""
import hashlib,json,subprocess,zipfile
from pathlib import Path
R=Path(__file__).resolve().parents[1];STEM="EVOLVE_M05_100_20261028"
def sha(b):return hashlib.sha256(b).hexdigest()
m=json.loads((R/"checkpoints"/(STEM+".json")).read_text())
b=(R/"checkpoints"/(STEM+".zip")).read_bytes()
assert m["stage"]=="M05" and m["percent"]==100 and m["step"]=="3/3"
assert len(b)==m["bytes"] and sha(b)==m["sha256"]
assert m["crc_and_sha256_verified"] and m["original_game_dist_unchanged"]
assert m["original_images"]==1021 and m["site_assets"]==1083 and m["real_billing_enabled"] is False
with zipfile.ZipFile(R/"checkpoints"/(STEM+".zip")) as z:
 assert z.testzip() is None
 assert set(z.namelist())==set(m["files"])|{"CHECKPOINT_MANIFEST.json"}
 inner=json.loads(z.read("CHECKPOINT_MANIFEST.json"))
 assert inner["files"]==m["files"] and not inner["real_checkout"]
 for p,x in m["files"].items():
  data=z.read(p)
  assert len(data)==x["bytes"] and sha(data)==x["sha256"] and data==(R/p).read_bytes()
for p in ("dist/version.json","dist/index.html","dist/verification.json","dist/asset-manifest.json","web/mock-premium-v615.js","web/mock-premium-ui-v616.js","dist/sw.js","monetization/catalog/draft_skus.json"):
 before=subprocess.check_output(["git","show",m["baseline_commit"]+":"+p],cwd=R)
 assert before==(R/p).read_bytes(),"Original game changed "+p
print("M05 100% ZIP VERIFIED",m["bytes"],m["sha256"],m["file_count"])
