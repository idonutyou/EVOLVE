#!/usr/bin/env python3
"""Make M05 20% incremental GitHub recovery ZIP; never overwrite an existing checkpoint."""
import hashlib
import json
import subprocess
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = "db518e05f598ffef9ee34646ee7eb69866950d7f"
NAME = "EVOLVE_M05_020_20261028"

def digest(binary):
    return hashlib.sha256(binary).hexdigest()

def main():
    all_changed = subprocess.check_output(["git", "diff", "--name-only", BASE, "HEAD"], cwd=ROOT, text=True).splitlines()
    changed = sorted(p for p in all_changed if not p.startswith("checkpoints/") and (ROOT / p).is_file())
    required = {
        "monetization/m05/product-detail-states.v1.json",
        "docs/monetization/M05_020_DETAIL_STATES_KO.md",
        "tests/monetization_m05_product_detail.test.cjs",
        "EVOLVE_PROGRESS.md",
        "EVOLVE_HANDOFF.md",
        "EVOLVE_ROADMAP.md",
        ".github/workflows/m05-design-gate.yml",
        ".github/workflows/m05-020-checkpoint.yml",
        "tools/checkpoint_m05_020.py",
        "tools/verify_m05_020_checkpoint.py"
    }
    if not required.issubset(changed):
        raise AssertionError("M05 20% recovery missing files " + repr(required - set(changed)))
    forbidden_prefixes = ("dist/", "web/", "assets/", "monetization/catalog/", "monetization/m04/")
    if any(p.startswith(forbidden_prefixes) for p in changed):
        raise AssertionError("M05 design milestone touched original game or billing files")
    contents = {p:(ROOT / p).read_bytes() for p in changed}
    members = {p:{"bytes":len(b), "sha256":digest(b)} for p,b in contents.items()}
    manifest = {"stage":"M05", "percent":20, "step":"1/3", "baseline_commit":BASE, "mode":"INCREMENTAL_OVERLAY_ON_VERIFIED_M05_010", "design_only":True, "real_checkout":False, "files":members}
    folder=ROOT / "checkpoints"
    folder.mkdir(exist_ok=True)
    zip_path=folder / (NAME+".zip")
    json_path=folder / (NAME+".json")
    if zip_path.exists() or json_path.exists():
        raise RuntimeError("Existing checkpoint: refusing overwrite")
    with zipfile.ZipFile(zip_path,"w",compression=zipfile.ZIP_DEFLATED,compresslevel=9) as out:
        for path, body in contents.items():
            out.writestr(path,body)
        out.writestr("CHECKPOINT_MANIFEST.json",json.dumps(manifest,ensure_ascii=False,indent=2)+"\n")
    with zipfile.ZipFile(zip_path) as test:
        if test.testzip() is not None:
            raise AssertionError("ZIP CRC failed")
        if set(test.namelist()) != set(changed)|{"CHECKPOINT_MANIFEST.json"}:
            raise AssertionError("ZIP file set differs")
        for path, expected in members.items():
            body=test.read(path)
            if len(body)!=expected["bytes"] or digest(body)!=expected["sha256"]:
                raise AssertionError("ZIP member digest mismatch: "+path)
    meta={
        "stage":"M05","percent":20,"step":"1/3",
        "archive":"checkpoints/"+NAME+".zip",
        "backup_branch":"backup/monetization-m05-020-20261028",
        "source_branch":"monetization-m05-ux-20261028",
        "baseline_commit":BASE,
        "archive_type":"incremental overlay; full source tree in immutable backup branch",
        "bytes":zip_path.stat().st_size,
        "sha256":digest(zip_path.read_bytes()),
        "file_count":len(members),
        "files":members,
        "design_only":True,
        "actual_purchase_enabled":False,
        "archive_crc_and_member_hashes_verified":True,
        "previous_checkpoint_branch":"backup/monetization-m05-010-20261028"
    }
    json_path.write_text(json.dumps(meta,ensure_ascii=False,indent=2)+"\n")
    print(json.dumps({k:v for k,v in meta.items() if k!="files"},ensure_ascii=False))

if __name__=="__main__":
    main()
