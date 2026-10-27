#!/usr/bin/env python3
"""Independent remote-ready M05 70% recovery archive and unchanged M04 assets verifier."""
import hashlib,json,subprocess,zipfile
from pathlib import Path
R=Path(__file__).resolve().parents[1]
NAME="EVOLVE_M05_070_20261028"
def sha(b):return hashlib.sha256(b).hexdigest()
proof=json.loads((R/"checkpoints"/(NAME+".json")).read_text())
raw=(R/"checkpoints"/(NAME+".zip")).read_bytes()
assert proof["stage"]=="M05" and proof["percent"]==70 and proof["step"]=="2/3"
assert len(raw)==proof["bytes"] and sha(raw)==proof["sha256"]
assert proof["crc_and_member_sha256_verified"] and proof["prior_assets_unchanged"]
assert proof["original_images"]==1021 and proof["site_asset_count"]==1082
assert proof["actual_billing_enabled"] is False
with zipfile.ZipFile(R/"checkpoints"/(NAME+".zip")) as z:
 assert z.testzip() is None
 assert set(z.namelist())==set(proof["files"])|{"CHECKPOINT_MANIFEST.json"}
 inner=json.loads(z.read("CHECKPOINT_MANIFEST.json"))
 assert inner["files"]==proof["files"] and inner["percent"]==70
 for path,info in proof["files"].items():
  blob=z.read(path)
  assert len(blob)==info["bytes"] and sha(blob)==info["sha256"] and blob==(R/path).read_bytes()
for p in ("web/mock-premium-v615.js","web/mock-premium-ui-v616.js","web/mock-core-visuals-v617.js","web/mock-core-adapter-v617.js","monetization/catalog/draft_skus.json","dist/assets/e343fb68db8ad1e2fb09bad6c28f3d95eff1c5ef232438670453adb56cfba64a.js"):
 before=subprocess.check_output(["git","show",proof["baseline_commit"]+":"+p],cwd=R)
 assert before==(R/p).read_bytes(),"Original M04 engine/catalog/game changed: "+p
manifest=json.loads((R/"dist/asset-manifest.json").read_text())
assert len(manifest)==1082 and sum(x["kind"]=="image" for x in manifest)==1021
assert sha((R/"dist"/proof["added_dev_asset"]).read_bytes())==proof["added_dev_asset"].rsplit("/",1)[1].split(".")[0]
print("M05 70% verified remote-ready ZIP",proof["bytes"],proof["sha256"],len(proof["files"]))
