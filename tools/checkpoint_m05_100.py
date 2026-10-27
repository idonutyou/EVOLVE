#!/usr/bin/env python3
"""EVOLVE M05 100% FINAL incremental recovery; permanently retain complete main/backup Git tree."""
import hashlib,json,subprocess,zipfile
from pathlib import Path
R=Path(__file__).resolve().parents[1]
BASE="ff54204d698db51d4f2c88886fe81a4b984aac8f"
STEM="EVOLVE_M05_100_20261028"
def sha(raw):return hashlib.sha256(raw).hexdigest()
def main():
 paths=sorted(p for p in subprocess.check_output(["git","diff","--name-only",BASE,"HEAD"],cwd=R,text=True).splitlines() if not p.startswith("checkpoints/") and (R/p).is_file())
 required={"tests/monetization_m05_100_live_browser.cjs","tools/verify_monster_feedback_v614.py",".github/workflows/deploy-pages.yml",".github/workflows/m05-100-live-final.yml",".github/workflows/m05-100-checkpoint.yml","docs/monetization/M05_100_LIVE_FINAL_QA_KO.md","EVOLVE_PROGRESS.md","EVOLVE_HANDOFF.md","EVOLVE_ROADMAP.md","tools/checkpoint_m05_100.py","tools/verify_m05_100_checkpoint.py"}
 assert required.issubset(paths),("Required file(s) missing",required-set(paths))
 assert not any(p.startswith(("dist/","web/","monetization/catalog/","assets/")) for p in paths),"Never modify the verified game or premium catalog during 100% verification"
 old=json.loads(subprocess.check_output(["git","show",BASE+":dist/version.json"],cwd=R))
 version=json.loads((R/"dist/version.json").read_text())
 assert old==version and version["version"].endswith("M05-UX90") and version["assets"]==1083
 manifest=json.loads((R/"dist/asset-manifest.json").read_text())
 assert len(manifest)==1083 and sum(x["kind"]=="image" for x in manifest)==1021
 assert len([x for x in manifest if x["kind"]=="dev-mock-only"])==14
 for file in ("dist/index.html","dist/asset-manifest.json","dist/verification.json","web/mock-premium-v615.js","web/mock-premium-ui-v616.js","web/mock-core-adapter-v617.js","dist/sw.js","monetization/catalog/draft_skus.json"):
  assert subprocess.check_output(["git","show",BASE+":"+file],cwd=R)==(R/file).read_bytes(),file
 catalog=json.loads((R/"monetization/catalog/draft_skus.json").read_text())
 assert catalog["checkout_enabled"] is False and catalog["client_grants_enabled"] is False
 assert all(p["status"]=="draft_disabled" and p["price_minor"] is None for p in catalog["products"])
 contents={p:(R/p).read_bytes() for p in paths}
 record={p:{"bytes":len(b),"sha256":sha(b)} for p,b in contents.items()}
 folder=R/"checkpoints";folder.mkdir(exist_ok=True)
 zip_path=folder/(STEM+".zip");json_path=folder/(STEM+".json")
 if zip_path.exists() or json_path.exists():raise RuntimeError("Existing M05 100 checkpoint must not be overwritten")
 inner={"stage":"M05","percent":100,"step":"3/3","base":BASE,"files":record,"images":1021,"real_checkout":False}
 with zipfile.ZipFile(zip_path,"w",zipfile.ZIP_DEFLATED,compresslevel=9) as z:
  for p,b in contents.items():z.writestr(p,b)
  z.writestr("CHECKPOINT_MANIFEST.json",json.dumps(inner,ensure_ascii=False,sort_keys=True))
 with zipfile.ZipFile(zip_path) as z:
  assert z.testzip() is None
  assert set(z.namelist())==set(contents)|{"CHECKPOINT_MANIFEST.json"}
  for p,x in record.items():
   data=z.read(p);assert len(data)==x["bytes"] and sha(data)==x["sha256"]
 meta={"stage":"M05","percent":100,"step":"3/3","source_branch":"main","backup_branch":"backup/monetization-m05-100-20261028","baseline_commit":BASE,"archive":"checkpoints/"+STEM+".zip","archive_mode":"incremental final verification/docs over 90%; full project recoverable in frozen Git backup","bytes":zip_path.stat().st_size,"sha256":sha(zip_path.read_bytes()),"file_count":len(record),"files":record,"crc_and_sha256_verified":True,"original_images":1021,"site_assets":1083,"original_game_dist_unchanged":True,"real_billing_enabled":False,"url":"https://idonutyou.github.io/EVOLVE/","build":version["build"],"next":"M06 10% premium appearance monetizable-content catalog/value priorities; rendered new artwork when production asset work begins"}
 json_path.write_text(json.dumps(meta,ensure_ascii=False,indent=2)+"\n")
 print(json.dumps({k:v for k,v in meta.items() if k!="files"},ensure_ascii=False))
if __name__=="__main__":main()
