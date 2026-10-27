#!/usr/bin/env python3
"""Independent validator of the committed M05 20% recovery ZIP and unchanged M04 game."""
import hashlib,json,subprocess,zipfile
from pathlib import Path
R=Path(__file__).resolve().parents[1]
N="EVOLVE_M05_020_20261028"
def sha(body):return hashlib.sha256(body).hexdigest()
meta=json.loads((R/"checkpoints"/(N+".json")).read_text())
archive=(R/"checkpoints"/(N+".zip")).read_bytes()
assert meta["stage"]=="M05" and meta["percent"]==20
assert meta["design_only"] is True and meta["actual_purchase_enabled"] is False
assert len(archive)==meta["bytes"] and sha(archive)==meta["sha256"]
assert meta["archive_crc_and_member_hashes_verified"] is True
with zipfile.ZipFile(R/"checkpoints"/(N+".zip")) as z:
 assert z.testzip() is None
 assert set(z.namelist())==set(meta["files"])|{"CHECKPOINT_MANIFEST.json"}
 internal=json.loads(z.read("CHECKPOINT_MANIFEST.json"))
 assert internal["files"]==meta["files"] and internal["percent"]==20
 for path,info in meta["files"].items():
  body=z.read(path)
  assert len(body)==info["bytes"] and sha(body)==info["sha256"]
  assert (R/path).read_bytes()==body
for path in ("dist/version.json","dist/index.html","dist/asset-manifest.json","monetization/catalog/draft_skus.json","web/mock-premium-v615.js","web/mock-premium-ui-v616.js"):
 old=subprocess.check_output(["git","show",meta["baseline_commit"]+":"+path],cwd=R)
 assert old==(R/path).read_bytes(),"M04 public game or paid catalog altered: "+path
print(json.dumps({"percent":20,"checkpoint_verified":True,"bytes":meta["bytes"],"sha256":meta["sha256"],"files":meta["file_count"],"M04_game_untouched":True}))
