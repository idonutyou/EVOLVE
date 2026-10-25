#!/usr/bin/env python3
"""Preserve an immutable, verified WEB-33 delta; remote saving is separate."""
import argparse, hashlib, json, subprocess, zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE='917ac1cd209bf3eb05a8e90045c59046bb3585ac'
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT,text=True).strip()
def main():
 p=argparse.ArgumentParser();p.add_argument('--stage',type=int,required=True);p.add_argument('--note',required=True);p.add_argument('--next',required=True);args=p.parse_args()
 out=Path('/workspace/scratch/52dc714b3a52/backups')/f'EVOLVE_WEB33_CHECKPOINT_{args.stage:03d}.zip'
 if out.exists():raise FileExistsError('Preserve existing checkpoint: '+str(out))
 report=ROOT/'docs/EQUIPMENT_FIT_V600.json';data=json.loads(report.read_text());data.update(progress=args.stage,status=args.note,next=args.next);report.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 subprocess.run(['git','add','-A','--','web','tools','tests','docs','dist/index.html','dist/version.json','dist/asset-manifest.json','dist/verification.json'],cwd=ROOT,check=True)
 subprocess.run(['git','add','-u','--','dist/assets'],cwd=ROOT,check=True)
 for a in json.loads((ROOT/'dist/asset-manifest.json').read_text()):
  if a['path'].endswith('.js'):subprocess.run(['git','add','--','dist/'+a['path']],cwd=ROOT,check=True)
 subprocess.run(['git','commit','-m',f'WEB-33 checkpoint {args.stage}: {args.note} [skip ci]'],cwd=ROOT,check=True,stdout=subprocess.DEVNULL)
 files=git('diff','--no-renames','--name-only','--diff-filter=ACMR',BASE,'HEAD').splitlines();deleted=git('diff','--no-renames','--name-only','--diff-filter=D',BASE,'HEAD').splitlines()
 meta={'baseline':BASE,'stage':args.stage,'local_commit':git('rev-parse','HEAD'),'working_folder':str(ROOT),'deleted_paths':deleted,'files':{n:{'bytes':(ROOT/n).stat().st_size,'sha256':hashlib.sha256((ROOT/n).read_bytes()).hexdigest()} for n in files}}
 with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=1) as z:
  for n in files:z.write(ROOT/n,n)
  z.writestr('RECOVERY.json',json.dumps(meta,ensure_ascii=False,indent=2)+'\n');z.writestr('RESTORE.txt','Check out baseline '+BASE+', unpack this archive over it, then remove deleted_paths from RECOVERY.json. Keep all older backups.\n')
 with zipfile.ZipFile(out) as z:
  assert z.testzip() is None
  for n,m in meta['files'].items():assert hashlib.sha256(z.read(n)).hexdigest()==m['sha256'],n
 result={'path':str(out),'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'files':len(files),'verified':True,'stage':args.stage}
 Path('/workspace/scratch/52dc714b3a52/web33-latest-archive.json').write_text(json.dumps(result))
 print(json.dumps(result))
if __name__=='__main__':main()
