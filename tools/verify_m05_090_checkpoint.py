#!/usr/bin/env python3
"""Independently check M05 90% remote-ready ZIP, member CRC/hash and unchanged M04 payment engine."""
import hashlib,json,subprocess,zipfile
from pathlib import Path
R=Path(__file__).resolve().parents[1];N="EVOLVE_M05_090_20261028"
sha=lambda b:hashlib.sha256(b).hexdigest()
proof=json.loads((R/"checkpoints"/(N+".json")).read_text())
payload=(R/"checkpoints"/(N+".zip")).read_bytes()
assert proof["stage"]=="M05" and proof["percent"]==90
assert sha(payload)==proof["sha256"] and len(payload)==proof["bytes"]
assert proof["crc_sha_members_verified"] and proof["images_preserved"]==1021
assert proof["site_assets"]==1083 and proof["actual_billing_enabled"] is False
with zipfile.ZipFile(R/"checkpoints"/(N+".zip")) as z:
 assert z.testzip() is None
 assert set(z.namelist())==set(proof["files"])|{"CHECKPOINT_MANIFEST.json"}
 assert json.loads(z.read("CHECKPOINT_MANIFEST.json"))["files"]==proof["files"]
 for p,info in proof["files"].items():
  b=z.read(p);assert len(b)==info["bytes"] and sha(b)==info["sha256"] and b==(R/p).read_bytes()
for p in ("web/mock-premium-v615.js","web/mock-premium-ui-v616.js","web/mock-core-adapter-v617.js","web/mock-core-visuals-v617.js","monetization/catalog/draft_skus.json","dist/sw.js"):
 assert subprocess.check_output(["git","show",proof["base"]+":"+p],cwd=R)==(R/p).read_bytes(),p
assert sha((R/"dist"/proof["added_dev_asset"]).read_bytes())==proof["added_dev_asset"].split("/")[-1][:-3]
print("M05 90% ZIP sha/member CRC verified",proof["bytes"],proof["sha256"],proof["file_count"])
