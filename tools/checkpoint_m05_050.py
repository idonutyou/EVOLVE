#!/usr/bin/env python3
"""Immutable M05-050 feature-branch recovery ZIP with complete modified file bytes."""
import hashlib,json,subprocess,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE="a5a21692c376ebae28f09fb9d908b3bb516a9a32"
N="EVOLVE_M05_050_20261028"
def sha(data):return hashlib.sha256(data).hexdigest()
def main():
 paths=sorted(p for p in subprocess.check_output(["git","diff","--name-only",BASE,"HEAD"],cwd=ROOT,text=True).splitlines() if not p.startswith("checkpoints/") and (ROOT/p).is_file())
 required={"web/m05-shop-ui-v618.js","tools/build_m05_050.py","tests/monetization_m05_050_browser.cjs","docs/monetization/M05_050_OWNED_EQUIP_QA_KO.md","dist/index.html","dist/version.json","dist/verification.json","dist/asset-manifest.json","EVOLVE_PROGRESS.md","EVOLVE_HANDOFF.md","EVOLVE_ROADMAP.md",".github/workflows/m05-050-ui.yml",".github/workflows/m05-050-checkpoint.yml","tools/checkpoint_m05_050.py","tools/verify_m05_050_checkpoint.py"}
 assert required.issubset(paths),("M05 50 missing",required-set(paths))
 assert not any(p.startswith(("web/mock-premium-","web/mock-core","monetization/catalog/","monetization/m04/")) for p in paths)
 old=json.loads(subprocess.check_output(["git","show",BASE+":dist/asset-manifest.json"],cwd=ROOT))
 now=json.loads((ROOT/"dist/asset-manifest.json").read_text())
 oldmap={e["path"]:e for e in old};newmap={e["path"]:e for e in now}
 assert len(old)==1079 and len(now)==1080
 assert all(newmap.get(p)==e for p,e in oldmap.items())
 newkeys=set(newmap)-set(oldmap)
 assert len(newkeys)==1
 added=newkeys.pop()
 assert added.startswith("assets/") and newmap[added]["kind"]=="dev-mock-only"
 assert "dist/"+added in paths
 raw=(ROOT/"web/m05-shop-ui-v618.js").read_bytes()
 assert sha(raw)==newmap[added]["sha256"] and raw==(ROOT/"dist"/added).read_bytes()
 assert sum(e["kind"]=="image" for e in now)==1021
 version=json.loads((ROOT/"dist/version.json").read_text())
 assert version["version"].endswith("M05-UX50") and version["assets"]==1080
 assert "data-m05-dev-only=\"shop-ux\"" in (ROOT/"dist/index.html").read_text()
 assert json.loads((ROOT/"dist/verification.json").read_text())["build"]==version["build"]
 records={p:(ROOT/p).read_bytes() for p in paths}
 members={p:{"bytes":len(b),"sha256":sha(b)} for p,b in records.items()}
 manifest={"stage":"M05","percent":50,"base_commit":BASE,"files":members,"mock_only":True,"image_count":1021}
 d=ROOT/"checkpoints";d.mkdir(exist_ok=True)
 zipfile_path=d/(N+".zip");metafile=d/(N+".json")
 if zipfile_path.exists() or metafile.exists():raise RuntimeError("Never overwrite an existing M05 backup")
 with zipfile.ZipFile(zipfile_path,"w",zipfile.ZIP_DEFLATED,compresslevel=9) as z:
  for p,b in records.items():z.writestr(p,b)
  z.writestr("CHECKPOINT_MANIFEST.json",json.dumps(manifest,ensure_ascii=False))
 with zipfile.ZipFile(zipfile_path) as z:
  assert z.testzip() is None
  assert set(z.namelist())==set(paths)|{"CHECKPOINT_MANIFEST.json"}
  for p,info in members.items():
   b=z.read(p);assert len(b)==info["bytes"] and sha(b)==info["sha256"]
 meta={"stage":"M05","percent":50,"step":"2/3","base_commit":BASE,"source_branch":"monetization-m05-ux-20261028","backup_branch":"backup/monetization-m05-050-20261028","archive":"checkpoints/"+N+".zip","archive_mode":"incremental changed files; backup Git ref contains complete repository","bytes":zipfile_path.stat().st_size,"sha256":sha(zipfile_path.read_bytes()),"file_count":len(members),"files":members,"crc_verified":True,"prior_assets_preserved":True,"site_asset_count":1080,"image_count":1021,"new_dev_asset":added,"mock_only":True,"live_billing_enabled":False,"browser_qa_success_run":40562857322,"next":"M05 60% storage corruption, failed writes and double taps"}
 metafile.write_text(json.dumps(meta,ensure_ascii=False,indent=2)+"\n")
 print(json.dumps({k:v for k,v in meta.items() if k!="files"},ensure_ascii=False))
if __name__=="__main__":main()
