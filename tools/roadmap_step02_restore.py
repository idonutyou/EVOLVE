#!/usr/bin/env python3
"""EVOLVE WEB43 offline restoration from retained Library checkpoint ZIP files.
Never overwrites an existing game or user save data.
"""
import argparse, pathlib, zipfile, json, hashlib, sys
ORDER = [
 "EVOLVE_WEB32_FULL_BACKUP_090.zip",
 "EVOLVE_WEB32_CHECKPOINT_100.zip",
 "EVOLVE_WEB33_CHECKPOINT_100.zip",
 "EVOLVE_WEB34_CHECKPOINT_100.zip",
 "EVOLVE_WEB35_CHECKPOINT_100.zip",
 "EVOLVE_WEB36_CHECKPOINT_100.zip",
 "EVOLVE_WEB37_CHECKPOINT_100.zip",
 "EVOLVE_WEB39_CHECKPOINT_100.zip",
 "EVOLVE_WEB40_CHECKPOINT_100.zip",
 "EVOLVE_WEB41_CHECKPOINT_100.zip",
 "EVOLVE_WEB42_CHECKPOINT_100.zip",
 "EVOLVE_WEB43_CHECKPOINT_100.zip",
]
EXPECTED_BUILD = "f5798ff9181a789c27bcdcf741093907ebbd06b74b2030750a60380b52bfe42f"
EXPECTED_SOURCE = {
 "EVOLVE_WEB32_FULL_BACKUP_090.zip":"2aead2bc85b606e8aac355e3d01163875eb8742d1065f476475a0a72df393b45",
 "EVOLVE_WEB43_CHECKPOINT_100.zip":"4ce90dad0a4bac150f98275fca65ff1af628f4205ebb4a79d39ea2bed7b998ce"
}
def digest(data): return hashlib.sha256(data).hexdigest()
def safe(path):
 p=pathlib.PurePosixPath(path)
 if path.startswith("/") or ".." in p.parts or "\\" in path: raise ValueError("Unsafe path: "+path)
 return p
def main():
 ap=argparse.ArgumentParser()
 ap.add_argument("--archives",type=pathlib.Path,required=True,help="Directory containing the 12 original ZIPs")
 ap.add_argument("--output",type=pathlib.Path,required=True,help="NEW EMPTY directory for restored files")
 args=ap.parse_args()
 root=args.output.resolve()
 if root.exists() and any(root.iterdir()): raise SystemExit("Refusing nonempty output directory: "+str(root))
 root.mkdir(parents=True,exist_ok=True)
 for archive in ORDER:
  path=args.archives/archive
  if not path.is_file(): raise SystemExit("Missing source archive: "+str(path))
  if archive in EXPECTED_SOURCE and digest(path.read_bytes())!=EXPECTED_SOURCE[archive]: raise SystemExit("Original backup digest mismatch: "+archive)
  with zipfile.ZipFile(path) as z:
   if z.testzip() is not None: raise SystemExit("Corrupt ZIP: "+archive)
   meta=json.loads(z.read("RECOVERY.json"))
   for name,info in meta["files"].items():
    target=root/safe(name);body=z.read(name)
    if len(body)!=info["bytes"] or digest(body)!=info["sha256"]:raise SystemExit("Corrupted backup entry: "+archive+" "+name)
    target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(body)
   for name in meta.get("deleted_paths",[]):
    target=root/safe(name)
    if target.is_file():target.unlink()
   print("restored",archive)
 manifest=json.loads((root/"dist/asset-manifest.json").read_text())
 version=json.loads((root/"dist/version.json").read_text())
 if version["build"]!=EXPECTED_BUILD:raise SystemExit("Wrong restored game build")
 bad=[]
 for row in manifest:
  target=root/"dist"/safe(row["path"])
  if not target.is_file() or target.stat().st_size!=row["bytes"] or digest(target.read_bytes())!=row["sha256"]:bad.append(row["path"])
 if bad:raise SystemExit("Missing or damaged active game assets: "+", ".join(bad[:10]))
 if len(manifest)!=1064: raise SystemExit("Unexpected asset manifest count")
 print(json.dumps({"ok":True,"version":version["version"],"build":version["build"],"verified_active_assets":len(manifest)},indent=2))
 print("NOTE: Runtime payload matched. Historical unused JS/CSS files may differ from current main; use the GitHub backup branch for exact Git tree parity.")
if __name__=="__main__":main()
