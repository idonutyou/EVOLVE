#!/usr/bin/env python3
"""Create and verify a recoverable code/asset delta against deployed WEB-31.

Use --full-site for an additional standalone playable website snapshot. This
script makes local artifacts only; persistent saving is confirmed separately.
"""
import argparse
import hashlib
import json
import subprocess
import zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
BASE='9e32ef7cd98a4be02e2b2a70c7885c94f820389f'

def main():
    p=argparse.ArgumentParser();p.add_argument('--stage',type=int,required=True)
    p.add_argument('--output',type=Path,required=True);p.add_argument('--full-site',action='store_true')
    args=p.parse_args();args.output.mkdir(parents=True,exist_ok=True)
    changes=subprocess.check_output(['git','diff','--no-renames','--name-only','--diff-filter=ACMR',BASE,'HEAD'],cwd=ROOT,text=True).splitlines()
    untracked=subprocess.check_output(['git','ls-files','--others','--exclude-standard'],cwd=ROOT,text=True).splitlines()
    files=sorted({n for n in changes+untracked if not any(x.startswith('.') and x not in {'.github','.gitignore'} for x in Path(n).parts)
                  and (ROOT/n).is_file() and not n.endswith('.bin')})
    deleted=subprocess.check_output(['git','diff','--no-renames','--name-only','--diff-filter=D',BASE,'HEAD'],cwd=ROOT,text=True).splitlines()
    if args.full_site:
        manifest=json.loads((ROOT/'dist/asset-manifest.json').read_text())
        site={'dist/'+row['path'] for row in manifest}
        site|={'dist/'+n for n in ['index.html','version.json','asset-manifest.json','verification.json','sw.js','rupture-60.html']}
        tracked=subprocess.check_output(['git','ls-files'],cwd=ROOT,text=True).splitlines()
        source={n for n in tracked if Path(n).parts[0] in {'web','tools','tests','art','.github'}
                or n in {'AGENTS.md','README.md','.gitignore'}
                or (Path(n).parts[0]=='docs' and Path(n).suffix in {'.md','.json','.txt'})}
        files=sorted(set(files)|site|source)
    metadata={'baseline':BASE,'local_commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
              'stage':args.stage,'standalone_site':args.full_site,'deleted_paths':deleted,
              'files':{n:{'bytes':(ROOT/n).stat().st_size,'sha256':hashlib.sha256((ROOT/n).read_bytes()).hexdigest()} for n in files}}
    prefix='FULL_BACKUP' if args.full_site else 'CHECKPOINT'
    out=args.output/f'EVOLVE_WEB32_{prefix}_{args.stage:03d}.zip'
    with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=1) as z:
        for n in files:z.write(ROOT/n,n)
        z.writestr('RECOVERY.json',json.dumps(metadata,ensure_ascii=False,indent=2)+'\n')
        z.writestr('RESTORE.txt','EVOLVE WEB-32 checkpoint '+str(args.stage)+'%\nBaseline: '+BASE+'\n'+
                   ('Standalone dist/ is included.\n' if args.full_site else 'Restore the exact baseline checkout, unpack files over it, and remove deleted_paths listed in RECOVERY.json.\n')+
                   'Status and remaining work: docs/player-mutant-v599-checkpoint.json\n')
    with zipfile.ZipFile(out) as z:
        assert z.testzip() is None
        for n,m in metadata['files'].items():assert hashlib.sha256(z.read(n)).hexdigest()==m['sha256'],n
    print(json.dumps({'path':str(out),'bytes':out.stat().st_size,'files':len(files),'verified':True,'stage':args.stage}))

if __name__=='__main__':main()
