#!/usr/bin/env python3
"""Immutable WEB-42 delta snapshots, with earlier recovery receipts retained."""
import argparse,hashlib,json,re,subprocess,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE='449773f580453ed46e0f37502e0ac00e1c44a298'
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT,text=True).strip()
def main():
 p=argparse.ArgumentParser();p.add_argument('--stage',required=True,type=int);p.add_argument('--note',required=True);p.add_argument('--next',required=True);p.add_argument('--label',default='');args=p.parse_args()
 if args.label and not re.fullmatch(r'[a-zA-Z0-9]+',args.label):raise ValueError('Unsafe checkpoint label')
 suffix=('_'+args.label.upper()) if args.label else ''
 out=ROOT.parent/'backups'/f'EVOLVE_WEB42_CHECKPOINT_{args.stage:03d}{suffix}.zip';out.parent.mkdir(parents=True,exist_ok=True)
 if out.exists():raise FileExistsError('Keep the earlier checkpoint: '+str(out))
 report=ROOT/'docs/ORGAN_CARD_ART_V610.json';data=json.loads(report.read_text());backups=list(data.get('backups',[]))
 for receipt in sorted(ROOT.parent.glob('web42-save-*.json')):
  for item in json.loads(receipt.read_text())['results']:
   assert item['status']=='succeeded' and item['local_metadata_applied'],receipt
   saved=Path(item['local_path']);stage=int(receipt.stem.removeprefix('web42-save-').split('-')[0]);backups=[b for b in backups if b.get('filename')!=item['file_name']]
   backups.append({'stage':stage,'filename':item['file_name'],'library_file_id':item['library_file_id'],'bytes':saved.stat().st_size,'sha256':hashlib.sha256(saved.read_bytes()).hexdigest(),'confirmed_saved':True,'url':'https://chatgpt.com/library?file_id='+item['library_file_id']+'&account_id=personal'})
 data.update(progress=args.stage,status=args.note,next=args.next,working_folder=str(ROOT),backups=sorted(backups,key=lambda b:b['stage']),current_release=json.loads((ROOT/'dist/version.json').read_text()));report.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 subprocess.run(['git','add','-A','--','web','tools','tests','docs','dist/index.html','dist/version.json','dist/asset-manifest.json','dist/verification.json','.github/workflows'],cwd=ROOT,check=True)
 if (ROOT/'dist/manifest.webmanifest').exists():subprocess.run(['git','add','--','dist/manifest.webmanifest'],cwd=ROOT,check=True)
 subprocess.run(['git','add','-u','--','dist/assets'],cwd=ROOT,check=True)
 known={'dist/'+a['path'] for a in json.loads((ROOT/'dist/asset-manifest.json').read_text())}
 for n in git('ls-files','--others','--exclude-standard','--','dist/assets').splitlines():
  if n in known:subprocess.run(['git','add','--',n],cwd=ROOT,check=True)
 subprocess.run(['git','commit','-m',f'WEB-42 checkpoint {args.stage}{suffix}: {args.note} [skip ci]'],cwd=ROOT,check=True,stdout=subprocess.DEVNULL)
 files=git('diff','--no-renames','--name-only','--diff-filter=ACMR',BASE,'HEAD').splitlines();deleted=git('diff','--no-renames','--name-only','--diff-filter=D',BASE,'HEAD').splitlines()
 meta={'baseline':BASE,'stage':args.stage,'label':args.label,'local_commit':git('rev-parse','HEAD'),'working_folder':str(ROOT),'deleted_paths':deleted,'files':{n:{'bytes':(ROOT/n).stat().st_size,'sha256':hashlib.sha256((ROOT/n).read_bytes()).hexdigest()} for n in files}}
 with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=1) as z:
  for n in files:z.write(ROOT/n,n)
  z.writestr('RECOVERY.json',json.dumps(meta,ensure_ascii=False,indent=2)+'\n');z.writestr('RESTORE.txt','Check out baseline '+BASE+', unpack this archive over it, then remove deleted_paths from RECOVERY.json. Preserve all older checkpoints.\n')
 with zipfile.ZipFile(out) as z:
  assert z.testzip() is None
  for n,m in meta['files'].items():assert hashlib.sha256(z.read(n)).hexdigest()==m['sha256'],n
 result={'path':str(out),'stage':args.stage,'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'files':len(files),'verified':True};(ROOT.parent/'web42-latest-archive.json').write_text(json.dumps(result));print(json.dumps(result))
if __name__=='__main__':main()
