#!/usr/bin/env python3
"""M05 90% full-branch recoverability + incremental SHA256/CRC ZIP, previous checkpoints untouched."""
import hashlib,json,subprocess,zipfile
from pathlib import Path
R=Path(__file__).resolve().parents[1]
BASE="c61623a5274defb54f3a725101fc9f7ea4c9ccf9"
NAME="EVOLVE_M05_090_20261028"
def sha(data):return hashlib.sha256(data).hexdigest()
def main():
 changed=sorted(p for p in subprocess.check_output(["git","diff","--name-only",BASE,"HEAD"],cwd=R,text=True).splitlines() if not p.startswith("checkpoints/") and (R/p).is_file())
 req={"web/m05-shop-ui-v618.js","tools/build_m05_090.py","tools/verify_m05_090_release.py","tests/monetization_m05_090_touch_browser.cjs",".github/workflows/m05-090-ui.yml",".github/workflows/m05-090-checkpoint.yml","docs/monetization/M05_090_MERGE_QA_KO.md","EVOLVE_PROGRESS.md","EVOLVE_HANDOFF.md","EVOLVE_ROADMAP.md","dist/asset-manifest.json","dist/index.html","dist/version.json","dist/verification.json","tools/checkpoint_m05_090.py","tools/verify_m05_090_checkpoint.py"}
 assert req.issubset(changed),("Missing checkpoint artifacts",req-set(changed))
 assert not any(p.startswith(("web/mock-premium-","web/mock-core-","monetization/catalog/")) for p in changed)
 from80=json.loads(subprocess.check_output(["git","show",BASE+":dist/asset-manifest.json"],cwd=R))
 updated=json.loads((R/"dist/asset-manifest.json").read_text())
 old={p["path"]:p for p in from80};new={p["path"]:p for p in updated}
 assert len(from80)==1082 and len(updated)==1083
 assert all(new.get(name)==item for name,item in old.items())
 addition=list(set(new)-set(old));assert len(addition)==1
 asset=addition[0];assert "dist/"+asset in changed and new[asset]["kind"]=="dev-mock-only"
 assert sha((R/"dist"/asset).read_bytes())==new[asset]["sha256"]
 assert (R/"web/m05-shop-ui-v618.js").read_bytes()==(R/"dist"/asset).read_bytes()
 assert sum(x["kind"]=="image" for x in updated)==1021
 v=json.loads((R/"dist/version.json").read_text())
 assert v["version"].endswith("M05-UX90") and v["assets"]==1083
 assert (R/"monetization/catalog/draft_skus.json").read_bytes()==subprocess.check_output(["git","show",BASE+":monetization/catalog/draft_skus.json"],cwd=R)
 contents={p:(R/p).read_bytes() for p in changed}
 files={p:{"bytes":len(raw),"sha256":sha(raw)} for p,raw in contents.items()}
 folder=R/"checkpoints";folder.mkdir(exist_ok=True)
 archive=folder/(NAME+".zip");meta=folder/(NAME+".json")
 assert not archive.exists() and not meta.exists(),"Do not overwrite an existing M05 archive"
 embedded={"stage":"M05","percent":90,"base":BASE,"files":files,"real_checkout":False,"images":1021}
 with zipfile.ZipFile(archive,"w",zipfile.ZIP_DEFLATED,compresslevel=9) as z:
  for p,raw in contents.items():z.writestr(p,raw)
  z.writestr("CHECKPOINT_MANIFEST.json",json.dumps(embedded,ensure_ascii=False))
 with zipfile.ZipFile(archive) as z:
  assert z.testzip() is None
  assert set(z.namelist())==set(files)|{"CHECKPOINT_MANIFEST.json"}
  for p,record in files.items():
   raw=z.read(p);assert sha(raw)==record["sha256"] and len(raw)==record["bytes"]
 evidence={"stage":"M05","percent":90,"step":"3/3","source_branch":"monetization-m05-ux-20261028","backup_branch":"backup/monetization-m05-090-20261028","base":BASE,"archive":"checkpoints/"+NAME+".zip","archive_type":"incremental from M05 80%; permanent full Git tree in backup branch","bytes":archive.stat().st_size,"sha256":sha(archive.read_bytes()),"file_count":len(files),"files":files,"crc_sha_members_verified":True,"images_preserved":1021,"site_assets":1083,"added_dev_asset":asset,"actual_billing_enabled":False,"browser_run":40575562801,"next":"M05 100% published Pages verify + final handoff"}
 meta.write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+"\n")
 print(json.dumps({k:v for k,v in evidence.items() if k!="files"},ensure_ascii=False))
if __name__=="__main__":main()
