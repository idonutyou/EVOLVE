#!/usr/bin/env python3
import argparse,hashlib,json,re
from pathlib import Path

def verify(root):
    for name in ['index.html','version.json','asset-manifest.json','verification.json','sw.js']:
        if not (root/name).is_file() or not (root/name).stat().st_size:raise ValueError('Missing game file: '+name)
    manifest=json.loads((root/'asset-manifest.json').read_text());version=json.loads((root/'version.json').read_text());report=json.loads((root/'verification.json').read_text());known=set()
    if not manifest or not any(x.get('kind')=='image' for x in manifest):raise ValueError('No original images')
    if version['build']!=report['build'] or version['source_sha256']!=report['source_sha256'] or report['image_recompression'] or not report['source_unchanged']:raise ValueError('Original preservation records disagree')
    for e in manifest:
        name=e['path']
        if not re.fullmatch(r'assets/[a-f0-9]{64}\.[a-z0-9]+',name) or name in known:raise ValueError('Invalid asset path')
        known.add(name);p=root/name
        if not p.is_file() or p.stat().st_size!=e['bytes'] or hashlib.sha256(p.read_bytes()).hexdigest()!=e['sha256'] or Path(name).stem!=e['sha256']:raise ValueError('Asset checksum mismatch: '+name)
    html=(root/'index.html').read_text()
    if re.search(r'data:(?:image|font)/[^\s\'"<>)]*;base64,',html,re.I):raise ValueError('Embedded asset remains')
    for p in [root/'index.html']+[root/e['path'] for e in manifest if e['path'].endswith('.js')]:
        for name in re.findall(r'assets/[a-f0-9]{64}\.[a-z0-9]+',p.read_text()):
            if name not in known:raise ValueError('Unverified reference: '+name)
    files=[p for p in root.rglob('*') if p.is_file()];total=sum(p.stat().st_size for p in files)
    if total>=1024**3 or any(p.stat().st_size>100*1024**2 for p in files):raise ValueError('GitHub size limit exceeded')
    return {'verified_files':len(manifest),'images':sum(e.get('kind')=='image' for e in manifest),'site_bytes':total,'index_bytes':(root/'index.html').stat().st_size,'largest_file':max(p.stat().st_size for p in files),'build':version['build']}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--dist',type=Path,default=Path('dist'));print(json.dumps(verify(p.parse_args().dist),indent=2))
