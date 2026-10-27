#!/usr/bin/env python3
"""Write a one-time M05-60 incremental recovery ZIP, verifying every member SHA and CRC."""
import hashlib,json,subprocess,zipfile
from pathlib import Path
R=Path(__file__).resolve().parents[1]
BASE="b34c7f8c5ef5663f751f69a57fc773112dcd403f"
N="EVOLVE_M05_060_20261028"
def sha(b):return hashlib.sha256(b).hexdigest()
def main():
 paths=sorted(p for p in subprocess.check_output(["git","diff","--name-only",BASE,"HEAD"],cwd=R,text=True).splitlines() if not p.startswith("checkpoints/") and (R/p).is_file())
 required={"web/m05-shop-ui-v618.js","tools/build_m05_060.py","tests/monetization_m05_060_browser.cjs","docs/monetization/M05_060_FAILURE_SAFETY_QA_KO.md","dist/index.html","dist/version.json","dist/verification.json","dist/asset-manifest.json","EVOLVE_PROGRESS.md","EVOLVE_HANDOFF.md","EVOLVE_ROADMAP.md",".github/workflows/m05-060-ui.yml",".github/workflows/m05-060-checkpoint.yml","tools/checkpoint_m05_060.py","tools/verify_m05_060_checkpoint.py"}
 assert required.issubset(paths),("Missing",required-set(paths))
 assert not any(p.startswith(("web/mock-premium-","web/mock-core","monetization/catalog/","monetization/m04/")) for p in paths)
 previous=json.loads(subprocess.check_output(["git","show",BASE+":dist/asset-manifest.json"],cwd=R))
 current=json.loads((R/"dist/asset-manifest.json").read_text())
 oldmap={e["path"]:e for e in previous};nowmap={e["path"]:e for e in current}
 assert len(previous)==1080 and len(current)==1081
 assert all(nowmap.get(p)==e for p,e in oldmap.items())
 additions=set(nowmap)-set(oldmap)
 assert len(additions)==1
 newasset=additions.pop()
 assert newasset.startswith("assets/") and nowmap[newasset]["kind"]=="dev-mock-only"
 assert "dist/"+newasset in paths
 src=(R/"web/m05-shop-ui-v618.js").read_bytes()
 assert src==(R/"dist"/newasset).read_bytes()
 assert sha(src)==nowmap[newasset]["sha256"]
 assert sum(e["kind"]=="image" for e in current)==1021
 version=json.loads((R/"dist/version.json").read_text())
 assert version["version"].endswith("M05-UX60") and version["assets"]==1081
 assert version["build"]==json.loads((R/"dist/verification.json").read_text())["build"]
 index=(R/"dist/index.html").read_text()
 assert index.count('data-m05-dev-only="shop-ux"')==1 and newasset in index
 old_billing=json.loads(subprocess.check_output(["git","show",BASE+":monetization/catalog/draft_skus.json"],cwd=R))
 assert old_billing==json.loads((R/"monetization/catalog/draft_skus.json").read_text())
 assert old_billing["checkout_enabled"] is False
 contents={p:(R/p).read_bytes() for p in paths}
 members={p:{"bytes":len(b),"sha256":sha(b)} for p,b in contents.items()}
 internal={"stage":"M05","percent":60,"step":"2/3","base":BASE,"files":members,"real_checkout":False,"image_count":1021}
 folder=R/"checkpoints";folder.mkdir(exist_ok=True)
 zip_path=folder/(N+".zip");json_path=folder/(N+".json")
 if zip_path.exists() or json_path.exists():raise RuntimeError("Existing M05 60% checkpoint must never be overwritten")
 with zipfile.ZipFile(zip_path,"w",zipfile.ZIP_DEFLATED,compresslevel=9) as z:
  for p,b in contents.items():z.writestr(p,b)
  z.writestr("CHECKPOINT_MANIFEST.json",json.dumps(internal,ensure_ascii=False))
 with zipfile.ZipFile(zip_path) as z:
  assert z.testzip() is None
  assert set(z.namelist())==set(paths)|{"CHECKPOINT_MANIFEST.json"}
  for p,v in members.items():
   b=z.read(p)
   assert len(b)==v["bytes"] and sha(b)==v["sha256"]
 meta={"stage":"M05","percent":60,"step":"2/3","source_branch":"monetization-m05-ux-20261028","backup_branch":"backup/monetization-m05-060-20261028","base":BASE,"archive":"checkpoints/"+N+".zip","archive_type":"incremental over M05 50%; full source tree in permanent backup branch","bytes":zip_path.stat().st_size,"sha256":sha(zip_path.read_bytes()),"file_count":len(members),"files":members,"crc_verified":True,"prior_assets_untouched":True,"site_assets":1081,"original_images":1021,"added_ui_asset":newasset,"actual_billing_enabled":False,"browser_qa_success_run":40566198249,"previous_backup":"backup/monetization-m05-050-20261028","next":"M05 70% mobile landscape/focus/scroll accessibility QA"}
 json_path.write_text(json.dumps(meta,ensure_ascii=False,indent=2)+"\n")
 print(json.dumps({k:v for k,v in meta.items() if k!="files"},ensure_ascii=False))
if __name__=="__main__":main()
