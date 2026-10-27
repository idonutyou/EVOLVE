#!/usr/bin/env python3
"""M05 30 percent recovery ZIP generator."""
import hashlib,json,subprocess,zipfile
from pathlib import Path
r=Path(__file__).resolve().parents[1]
base="c1713c838f7c2dd5301b4d41d315296acaa7d864"
stem="EVOLVE_M05_030_20261028"
sha=lambda b:hashlib.sha256(b).hexdigest()
paths=sorted(p for p in subprocess.check_output(["git","diff","--name-only",base,"HEAD"],cwd=r,text=True).splitlines() if not p.startswith("checkpoints/") and (r/p).is_file())
required={"monetization/m05/mobile-flow.v1.json","docs/monetization/M05_030_MOBILE_UX_FREEZE_KO.md","tests/monetization_m05_mobile_flow.test.cjs","EVOLVE_PROGRESS.md","EVOLVE_HANDOFF.md","EVOLVE_ROADMAP.md",".github/workflows/m05-design-gate.yml",".github/workflows/m05-030-checkpoint.yml","tools/checkpoint_m05_030.py","tools/verify_m05_030_checkpoint.py"}
assert required.issubset(paths)
assert not any(p.startswith(("dist/","web/","monetization/catalog/")) for p in paths)
data={p:(r/p).read_bytes() for p in paths}
members={p:{"bytes":len(b),"sha256":sha(b)} for p,b in data.items()}
folder=r/"checkpoints";folder.mkdir(exist_ok=True)
zp=folder/(stem+".zip");jp=folder/(stem+".json")
assert not zp.exists() and not jp.exists()
with zipfile.ZipFile(zp,"w",zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for p,b in data.items():z.writestr(p,b)
 z.writestr("MANIFEST.json",json.dumps({"stage":"M05","percent":30,"base":base,"members":members}))
with zipfile.ZipFile(zp) as z:
 assert z.testzip() is None and len(z.namelist())==len(data)+1
 for p,info in members.items():
  b=z.read(p);assert len(b)==info["bytes"] and sha(b)==info["sha256"]
proof={"stage":"M05","percent":30,"step":"1/3","base":base,"archive":"checkpoints/"+stem+".zip","branch":"backup/monetization-m05-030-20261028","bytes":zp.stat().st_size,"sha256":sha(zp.read_bytes()),"files":members,"file_count":len(members),"crc_verified":True,"design_only":True,"real_payment":False}
jp.write_text(json.dumps(proof,indent=2)+"\n")
print(json.dumps({k:v for k,v in proof.items() if k!="files"}))
