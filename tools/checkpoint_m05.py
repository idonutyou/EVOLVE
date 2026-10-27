#!/usr/bin/env python3
"""Create an immutable M05 10% incremental recovery ZIP; verify its members."""
import argparse
import hashlib
import json
import subprocess
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = 'fbe3224a3bdd95020829228427ddc3b05ed41f9e'
FILE_PREFIX = 'checkpoints/'

def sha(data):
    return hashlib.sha256(data).hexdigest()

def make():
    changed = subprocess.check_output(['git','diff','--name-only',BASE,'HEAD'],cwd=ROOT,text=True).splitlines()
    changed = sorted(p for p in changed if not p.startswith(FILE_PREFIX) and (ROOT/p).is_file())
    if not changed:
        raise ValueError('No tracked M05 work to save')
    required = {
        'monetization/m05/store-inventory-ux.v1.json',
        'docs/monetization/M05_010_UX_AUDIT_KO.md',
        'tests/monetization_m05_ux_design.test.cjs',
        '.github/workflows/m05-design-gate.yml',
        'EVOLVE_PROGRESS.md',
        'EVOLVE_HANDOFF.md',
        'EVOLVE_ROADMAP.md'
    }
    if not required.issubset(changed):
        raise ValueError('Design/handoff files missing from checkpoint: '+str(required-set(changed)))
    forbidden = [p for p in changed if p.startswith(('dist/','web/','monetization/catalog/'))]
    if forbidden:
        raise ValueError('M05 10% design must not alter game: '+str(forbidden))
    members = {p: {'bytes':len((ROOT/p).read_bytes()),'sha256':sha((ROOT/p).read_bytes())} for p in changed}
    manifest = {
        'stage':'M05','percent':10,'step':'1/3',
        'baseline_commit':BASE,'scope':'incremental overlay; full repo retained in branch backup',
        'design_only':True,'real_billing_enabled':False,
        'files':members
    }
    directory = ROOT/'checkpoints'
    directory.mkdir(exist_ok=True)
    target = directory/'EVOLVE_M05_010_20261028.zip'
    evidence = directory/'EVOLVE_M05_010_20261028.json'
    if target.exists() or evidence.exists():
        raise ValueError('Never overwrite preserved checkpoint')
    with zipfile.ZipFile(target,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as out:
        for p in changed:
            out.write(ROOT/p,p)
        out.writestr('CHECKPOINT_MANIFEST.json',json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    with zipfile.ZipFile(target) as test:
        if test.testzip() is not None:
            raise ValueError('ZIP CRC failed')
        if sorted(test.namelist())!=sorted([*changed,'CHECKPOINT_MANIFEST.json']):
            raise ValueError('Wrong files in recovery')
        for p,info in members.items():
            raw=test.read(p)
            if len(raw)!=info['bytes'] or sha(raw)!=info['sha256']:
                raise ValueError('Recovery member hash wrong: '+p)
    state = {
        'archive':'checkpoints/EVOLVE_M05_010_20261028.zip',
        'bytes':target.stat().st_size,'sha256':sha(target.read_bytes()),
        'file_count':len(members),'files':members,'baseline_commit':BASE,
        'stage':'M05','percent':10,'step':'1/3','design_only':True,
        'archive_crc_and_member_hashes_verified':True,
        'expected_remote_branch':'backup/monetization-m05-010-20261028',
        'source_branch':'monetization-m05-ux-20261028'
    }
    evidence.write_text(json.dumps(state,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:v for k,v in state.items() if k!='files'}))

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--percent',type=int,choices=[10],default=10)
    parser.parse_args()
    make()
