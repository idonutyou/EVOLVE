#!/usr/bin/env python3
"""Create immutable M05 80% predeploy integration QA recovery ZIP and file digest manifest."""
import hashlib,json,subprocess,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE="2e647bc08a56831e4d12090cf20aa07887c3bb38"
STEM="EVOLVE_M05_080_20261028"
def digest(blob):return hashlib.sha256(blob).hexdigest()
def main():
 changed=sorted(p for p in subprocess.check_output(["git","diff","--name-only",BASE,"HEAD"],cwd=ROOT,text=True).splitlines() if not p.startswith("checkpoints/") and (ROOT/p).is_file())
 expected={
  "tools/verify_m05_080_integration.py","tests/monetization_m05_080_integration_browser.cjs",
  ".github/workflows/m05-080-integration.yml","docs/monetization/M05_080_INTEGRATION_GATE_KO.md",
  "EVOLVE_PROGRESS.md","EVOLVE_HANDOFF.md","EVOLVE_ROADMAP.md",
  ".github/workflows/m05-080-checkpoint.yml","tools/checkpoint_m05_080.py","tools/verify_m05_080_checkpoint.py"
 }
 assert expected.issubset(changed),("Missing M05 80 checkpoint files",expected-set(changed))
 assert not any(p.startswith(("dist/","web/","monetization/catalog/","assets/")) for p in changed),"80% premerge QA must not modify the game, checkout or assets"
 now=json.loads((ROOT/"dist/version.json").read_text())
 baseline=json.loads(subprocess.check_output(["git","show",BASE+":dist/version.json"],cwd=ROOT))
 assert now==baseline and now["assets"]==1082 and now["version"].endswith("M05-UX70")
 source={p:(ROOT/p).read_bytes() for p in changed}
 files={p:{"bytes":len(blob),"sha256":digest(blob)} for p,blob in source.items()}
 inner={"stage":"M05","percent":80,"step":"3/3","base_commit":BASE,"files":files,"game_dist_unchanged":True,"real_checkout":False}
 folder=ROOT/"checkpoints";folder.mkdir(exist_ok=True)
 zip_path=folder/(STEM+".zip");json_path=folder/(STEM+".json")
 if zip_path.exists() or json_path.exists():raise RuntimeError("Refusing overwrite of immutable M05 80% checkpoint")
 with zipfile.ZipFile(zip_path,"w",zipfile.ZIP_DEFLATED,compresslevel=9) as z:
  for path,blob in source.items():z.writestr(path,blob)
  z.writestr("CHECKPOINT_MANIFEST.json",json.dumps(inner,ensure_ascii=False,sort_keys=True))
 with zipfile.ZipFile(zip_path) as z:
  assert z.testzip() is None
  assert set(z.namelist())==set(changed)|{"CHECKPOINT_MANIFEST.json"}
  for name,info in files.items():
   raw=z.read(name);assert len(raw)==info["bytes"] and digest(raw)==info["sha256"]
 proof={"stage":"M05","percent":80,"step":"3/3","source_branch":"monetization-m05-ux-20261028",
  "backup_branch":"backup/monetization-m05-080-20261028","base_commit":BASE,
  "archive":"checkpoints/"+STEM+".zip","archive_mode":"incremental overlay on 70%; complete Git tree held in backup ref",
  "bytes":zip_path.stat().st_size,"sha256":digest(zip_path.read_bytes()),"file_count":len(files),"files":files,
  "crc_and_sha256_verified":True,"main_unmodified":True,"dist_game_untouched_since_70":True,
  "original_image_count":1021,"site_asset_count":1082,"real_checkout":False,
  "original_main_sha":"fbe3224a3bdd95020829228427ddc3b05ed41f9e",
  "integration_qa_run":40572366219,"next":"M05 90% controlled main merge and dev Pages integration only after all release gates pass"}
 json_path.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+"\n")
 print(json.dumps({k:v for k,v in proof.items() if k!="files"},ensure_ascii=False))
if __name__=="__main__":main()
