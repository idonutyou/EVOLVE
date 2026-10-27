#!/usr/bin/env python3
"""Create and reopen a hash-verified incremental M04 recovery archive."""
import argparse,hashlib,json,subprocess,zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
BASE='4af248bd7d2b655afa77299e9c8afb2743d88278'
def create(percent,extra):
    names=set(subprocess.check_output(['git','diff','--name-only',BASE],cwd=ROOT,text=True).splitlines())
    names.update(extra)
    names={n for n in names if not n.startswith('checkpoints/') and (ROOT/n).is_file()}
    entries={name:dict(bytes=(ROOT/name).stat().st_size,sha256=hashlib.sha256((ROOT/name).read_bytes()).hexdigest()) for name in sorted(names)}
    manifest=dict(baseline=BASE,scope='incremental overlay on M04 50 percent; full repository retained in backup branch',percent=percent,files=entries,checkout_enabled=False)
    folder=ROOT/'checkpoints';folder.mkdir(exist_ok=True)
    target=folder/f'EVOLVE_M04_{percent:03d}_20261027.zip'
    if target.exists():raise ValueError('Never overwrite a preserved checkpoint archive')
    with zipfile.ZipFile(target,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for name in entries:z.write(ROOT/name,name)
        z.writestr('CHECKPOINT_MANIFEST.json',json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    with zipfile.ZipFile(target) as z:
        if z.testzip() is not None:raise ValueError('Archive CRC failure')
        for name,meta in entries.items():
            data=z.read(name)
            if len(data)!=meta['bytes'] or hashlib.sha256(data).hexdigest()!=meta['sha256']:raise ValueError('Archive member hash mismatch: '+name)
    evidence=dict(path=str(target.relative_to(ROOT)),bytes=target.stat().st_size,sha256=hashlib.sha256(target.read_bytes()).hexdigest(),files=len(entries),uncompressed_bytes=sum(x['bytes'] for x in entries.values()),baseline=BASE,archive_crc_and_member_hashes_verified=True)
    (folder/f'EVOLVE_M04_{percent:03d}_20261027.json').write_text(json.dumps(evidence,indent=2)+'\n')
    print(json.dumps(evidence))
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--percent',type=int,choices=[60,70],required=True);p.add_argument('--extra',nargs='*',default=[]);a=p.parse_args();create(a.percent,a.extra)
