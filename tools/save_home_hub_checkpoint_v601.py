#!/usr/bin/env python3
"""Preserve an immutable, verified WEB-34 delta; remote saving is separate."""
import argparse, hashlib, json, subprocess, zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE='bbc738b6822f2836780b805b742da48e1313f128'
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT,text=True).strip()
def main():
 p=argparse.ArgumentParser();p.add_argument('--stage',type=int,required=True);p.add_argument('--note',required=True);p.add_argument('--next',required=True);args=p.parse_args()
 out=ROOT.parent/'backups'/f'EVOLVE_WEB34_CHECKPOINT_{args.stage:03d}.zip'
 out.parent.mkdir(parents=True,exist_ok=True)
 if out.exists():raise FileExistsError('Preserve existing checkpoint: '+str(out))
 report=ROOT/'docs/HOME_HUB_V601.json';data=json.loads(report.read_text());backups=list(data.get('backups',[]))
 for receipt in sorted(ROOT.parent.glob('web34-save-*.json')):
  for item in json.loads(receipt.read_text())['results']:
   assert item['status']=='succeeded' and item['local_metadata_applied'],receipt
   saved=Path(item['local_path']);stage=int(receipt.stem.rsplit('-',1)[1]);backups=[b for b in backups if b['stage']!=stage];backups.append({'stage':stage,'filename':item['file_name'],'library_file_id':item['library_file_id'],'bytes':saved.stat().st_size,'sha256':hashlib.sha256(saved.read_bytes()).hexdigest(),'confirmed_saved':True,'url':'https://chatgpt.com/library?file_id='+item['library_file_id']+'&account_id=personal'})
 data.update(progress=args.stage,status=args.note,next=args.next,working_folder=str(ROOT),backups=sorted(backups,key=lambda b:b['stage']),current_release=json.loads((ROOT/'dist/version.json').read_text()));report.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 subprocess.run(['git','add','-A','--','web','tools','tests','docs','dist/index.html','dist/version.json','dist/asset-manifest.json','dist/verification.json'],cwd=ROOT,check=True)
 subprocess.run(['git','add','-u','--','dist/assets'],cwd=ROOT,check=True)
 subprocess.run(['git','add','--','.github/workflows/deploy-pages.yml'],cwd=ROOT,check=True)
 known={'dist/'+a['path'] for a in json.loads((ROOT/'dist/asset-manifest.json').read_text())}
 for a in git('ls-files','--others','--exclude-standard','--','dist/assets').splitlines():
  if a in known:subprocess.run(['git','add','--',a],cwd=ROOT,check=True)
 if (ROOT/'art/home-hub-v601').exists():subprocess.run(['git','add','-A','--','art/home-hub-v601'],cwd=ROOT,check=True)
 subprocess.run(['git','commit','-m',f'WEB-34 checkpoint {args.stage}: {args.note} [skip ci]'],cwd=ROOT,check=True,stdout=subprocess.DEVNULL)
 files=git('diff','--no-renames','--name-only','--diff-filter=ACMR',BASE,'HEAD').splitlines();deleted=git('diff','--no-renames','--name-only','--diff-filter=D',BASE,'HEAD').splitlines()
 meta={'baseline':BASE,'stage':args.stage,'local_commit':git('rev-parse','HEAD'),'working_folder':str(ROOT),'deleted_paths':deleted,'files':{n:{'bytes':(ROOT/n).stat().st_size,'sha256':hashlib.sha256((ROOT/n).read_bytes()).hexdigest()} for n in files}}
 with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=1) as z:
  for n in files:z.write(ROOT/n,n)
  z.writestr('RECOVERY.json',json.dumps(meta,ensure_ascii=False,indent=2)+'\n');z.writestr('RESTORE.txt','Check out baseline '+BASE+', unpack this archive over it, then remove deleted_paths from RECOVERY.json. Keep all older backups.\n')
 with zipfile.ZipFile(out) as z:
  assert z.testzip() is None
  for n,m in meta['files'].items():assert hashlib.sha256(z.read(n)).hexdigest()==m['sha256'],n
 result={'path':str(out),'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'files':len(files),'verified':True,'stage':args.stage}
 (ROOT.parent/'web34-latest-archive.json').write_text(json.dumps(result))
 print(json.dumps(result))
if __name__=='__main__':main()
