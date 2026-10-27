#!/usr/bin/env python3
"""EVOLVE M05 70% immutable incremental recovery with byte SHA256 and archive CRC."""
import hashlib,json,subprocess,zipfile
from pathlib import Path
R=Path(__file__).resolve().parents[1]
BASE="8c841bc8349c5749640ddc6e59e80b443cec863d"
NAME="EVOLVE_M05_070_20261028"
def sha(data):return hashlib.sha256(data).hexdigest()
def main():
 changed=sorted(p for p in subprocess.check_output(["git","diff","--name-only",BASE,"HEAD"],cwd=R,text=True).splitlines() if not p.startswith("checkpoints/") and (R/p).is_file())
 required={"web/m05-shop-ui-v618.js","tools/build_m05_070.py","tests/monetization_m05_070_browser.cjs","docs/monetization/M05_070_RESPONSIVE_QA_KO.md","dist/index.html","dist/version.json","dist/verification.json","dist/asset-manifest.json","EVOLVE_PROGRESS.md","EVOLVE_HANDOFF.md","EVOLVE_ROADMAP.md",".github/workflows/m05-070-ui.yml",".github/workflows/m05-070-checkpoint.yml","tools/checkpoint_m05_070.py","tools/verify_m05_070_checkpoint.py","tests/monetization_m05_ux_design.test.cjs","tests/monetization_m05_mobile_flow.test.cjs"}
 assert required.issubset(changed),("Missing 70% file",required-set(changed))
 assert not any(p.startswith(("web/mock-premium-","web/mock-core","monetization/catalog/","monetization/m04/")) for p in changed)
 old=json.loads(subprocess.check_output(["git","show",BASE+":dist/asset-manifest.json"],cwd=R))
 new=json.loads((R/"dist/asset-manifest.json").read_text())
 assert len(old)==1081 and len(new)==1082
 oldmap={x["path"]:x for x in old};newmap={x["path"]:x for x in new}
 assert all(newmap.get(path)==metadata for path,metadata in oldmap.items())
 additions=set(newmap)-set(oldmap)
 assert len(additions)==1
 newasset=additions.pop()
 assert newasset.startswith("assets/") and newmap[newasset]["kind"]=="dev-mock-only"
 assert "dist/"+newasset in changed
 source=(R/"web/m05-shop-ui-v618.js").read_bytes()
 assert source==(R/"dist"/newasset).read_bytes() and sha(source)==newmap[newasset]["sha256"]
 assert sum(x["kind"]=="image" for x in new)==1021
 version=json.loads((R/"dist/version.json").read_text())
 assert version["version"].endswith("M05-UX70") and version["assets"]==1082
 report=json.loads((R/"dist/verification.json").read_text())
 assert version["build"]==report["build"] and report["m05_ux_070"]["real_checkout"] is False
 assert (R/"dist/index.html").read_text().count('data-m05-dev-only="shop-ux"')==1
 original_catalog=json.loads(subprocess.check_output(["git","show",BASE+":monetization/catalog/draft_skus.json"],cwd=R))
 assert original_catalog==json.loads((R/"monetization/catalog/draft_skus.json").read_text())
 assert original_catalog["checkout_enabled"] is False and all(p["price_minor"] is None for p in original_catalog["products"])
 payload={path:(R/path).read_bytes() for path in changed}
 entries={path:{"bytes":len(blob),"sha256":sha(blob)} for path,blob in payload.items()}
 manifest={"stage":"M05","percent":70,"step":"2/3","baseline_commit":BASE,"files":entries,"original_images":1021,"real_checkout":False}
 folder=R/"checkpoints";folder.mkdir(exist_ok=True)
 archive=folder/(NAME+".zip");evidence=folder/(NAME+".json")
 if archive.exists() or evidence.exists():raise RuntimeError("Existing archive: never overwrite prior checkpoints")
 with zipfile.ZipFile(archive,"w",zipfile.ZIP_DEFLATED,compresslevel=9) as z:
  for path,blob in payload.items():z.writestr(path,blob)
  z.writestr("CHECKPOINT_MANIFEST.json",json.dumps(manifest,ensure_ascii=False,sort_keys=True))
 with zipfile.ZipFile(archive) as z:
  assert z.testzip() is None
  assert set(z.namelist())==set(changed)|{"CHECKPOINT_MANIFEST.json"}
  for path,v in entries.items():
   blob=z.read(path)
   assert len(blob)==v["bytes"] and sha(blob)==v["sha256"]
 report={"stage":"M05","percent":70,"step":"2/3","source_branch":"monetization-m05-ux-20261028","backup_branch":"backup/monetization-m05-070-20261028","baseline_commit":BASE,"archive":"checkpoints/"+NAME+".zip","archive_mode":"incremental overlay on M05 60%; entire source tree in recovery Git branch","bytes":archive.stat().st_size,"sha256":sha(archive.read_bytes()),"file_count":len(entries),"files":entries,"crc_and_member_sha256_verified":True,"prior_assets_unchanged":True,"site_asset_count":1082,"original_images":1021,"added_dev_asset":newasset,"actual_billing_enabled":False,"browser_qa_run":40568940812,"next":"M05 80% STEP 3/3 full game safety and predeploy integration"}
 evidence.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
 print(json.dumps({k:v for k,v in report.items() if k!="files"},ensure_ascii=False))
if __name__=="__main__":main()
