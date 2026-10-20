#!/usr/bin/env python3
"""Create deterministic resumable 512KiB fragments; never change source bytes."""
import argparse,base64,hashlib,json
from pathlib import Path
from asset_bundles import FRAGMENT,digest

def prepare(root):
    bundles=root/'asset-bundles';index=json.loads((bundles/'index.json').read_text());entries=[];parts=[]
    for archive in index['archives']:
        for part in archive['parts']:
            p=bundles/part['path']
            if p.stat().st_size!=part['bytes'] or digest(p)!=part['sha256']:raise ValueError('Original bundle differs')
            names=[]
            with p.open('rb') as f:
                for i,raw in enumerate(iter(lambda:f.read(FRAGMENT),b'')):
                    encoded=base64.b64encode(raw);rel=f"asset-bundles/{part['sha256']}/{i:03d}.b64";target=root/rel
                    target.parent.mkdir(parents=True,exist_ok=True)
                    if not target.exists() or target.read_bytes()!=encoded:target.write_bytes(encoded)
                    sha=hashlib.sha1(b'blob '+str(len(encoded)).encode()+b'\0'+encoded).hexdigest()
                    entries.append({'path':rel,'git_sha':sha,'raw_sha256':hashlib.sha256(raw).hexdigest(),'raw_bytes':len(raw),'encoded_bytes':len(encoded),'bundle':part['sha256'],'index':i})
                    names.append(rel)
            parts.append({'sha256':part['sha256'],'bytes':part['bytes'],'fragments':names})
    manifest={'format':1,'fragment_bytes':FRAGMENT,'total_bytes':sum(e['raw_bytes'] for e in entries),'total_fragments':len(entries),'parts':parts,'fragments':entries}
    path=root/'migration/transfer-manifest.json';path.parent.mkdir(exist_ok=True);path.write_text(json.dumps(manifest,separators=(',',':'))+'\n')
    return {'fragments':len(entries),'bytes':manifest['total_bytes'],'parts':len(parts)}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--root',type=Path,default=Path('.'));print(json.dumps(prepare(p.parse_args().root),indent=2))
