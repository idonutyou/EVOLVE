#!/usr/bin/env python3
"""Lossless immutable archive parts for MCP/GitHub transfer, never image re-encoding."""
import argparse,base64,gzip,hashlib,json,re,tarfile,tempfile
from pathlib import Path
CHUNK=4*1024*1024
FRAGMENT=512*1024

def digest(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda:f.read(1048576),b''):h.update(b)
    return h.hexdigest()

def pack(site,bundles):
    files=json.loads((site/'asset-manifest.json').read_text());bundles.mkdir(parents=True,exist_ok=True);index=bundles/'index.json'
    doc=json.loads(index.read_text()) if index.exists() else {'format':1,'archives':[]}
    needed={x['path'] for x in files}
    doc['archives']=[a for a in doc['archives'] if needed.intersection(x['path'] for x in a['files'])]
    covered={x['path'] for a in doc['archives'] for x in a['files']};fresh=[x for x in files if x['path'] not in covered]
    if fresh:
        with tempfile.TemporaryDirectory() as tmp:
            arc=Path(tmp)/'assets.tar.gz'
            with arc.open('wb') as raw,gzip.GzipFile(fileobj=raw,mode='wb',mtime=0,compresslevel=6) as compressed,tarfile.open(fileobj=compressed,mode='w|') as tar:
                for e in sorted(fresh,key=lambda x:x['path']):
                    p=site/e['path']
                    if p.stat().st_size!=e['bytes'] or digest(p)!=e['sha256']:raise ValueError('Unverified source asset')
                    info=tarfile.TarInfo(e['path']);info.size=e['bytes'];info.mode=0o644;info.mtime=0
                    with p.open('rb') as f:tar.addfile(info,f)
            parts=[]
            with arc.open('rb') as f:
                for block in iter(lambda:f.read(CHUNK),b''):
                    sha=hashlib.sha256(block).hexdigest();name=sha+'.bin';p=bundles/name
                    if not p.exists():p.write_bytes(block)
                    if digest(p)!=sha:raise ValueError('Bundle checksum mismatch')
                    parts.append({'path':name,'sha256':sha,'bytes':len(block)})
            doc['archives'].append({'sha256':digest(arc),'bytes':arc.stat().st_size,'parts':parts,'files':fresh})
    index.write_text(json.dumps(doc,separators=(',',':'))+'\n')
    return {'archives':len(doc['archives']),'new_assets':len(fresh),'parts':sum(len(a['parts']) for a in doc['archives']),'bytes':sum(a['bytes'] for a in doc['archives'])}

def unpack(site,bundles,fragments_only=False):
    doc=json.loads((bundles/'index.json').read_text());expected={x['path']:x for x in json.loads((site/'asset-manifest.json').read_text())};restored=set()
    if doc.get('format')!=1 or not expected:raise ValueError('Empty or unsupported bundles')
    for a in doc['archives']:
        with tempfile.TemporaryDirectory() as tmp:
            arc=Path(tmp)/'assets.tar.gz'
            with arc.open('wb') as out:
                for part in a['parts']:
                    if not re.fullmatch('[a-f0-9]{64}',part['sha256']) or part['path']!=part['sha256']+'.bin':raise ValueError('Invalid bundle path')
                    p=bundles/part['path']
                    if p.exists() and not fragments_only:
                        if p.stat().st_size!=part['bytes'] or digest(p)!=part['sha256']:raise ValueError('Bundle checksum mismatch: '+part['path'])
                        with p.open('rb') as f:
                            for b in iter(lambda:f.read(1048576),b''):out.write(b)
                    else:
                        h=hashlib.sha256();size=0
                        for i,offset in enumerate(range(0,part['bytes'],FRAGMENT)):
                            fragment=bundles/part['sha256']/f'{i:03d}.b64'
                            if not fragment.is_file():raise ValueError('Missing saved fragment: '+str(fragment))
                            data=base64.b64decode(fragment.read_bytes(),validate=True)
                            if len(data)!=min(FRAGMENT,part['bytes']-offset):raise ValueError('Fragment size mismatch')
                            h.update(data);size+=len(data);out.write(data)
                        if size!=part['bytes'] or h.hexdigest()!=part['sha256']:raise ValueError('Reassembled original bundle differs')
            if arc.stat().st_size!=a['bytes'] or digest(arc)!=a['sha256']:raise ValueError('Archive checksum mismatch')
            allowed={e['path']:e for e in a['files']};seen=set()
            with tarfile.open(arc,'r|gz') as tar:
                for m in tar:
                    if not m.isfile() or m.name not in allowed or m.name in seen:raise ValueError('Unexpected archive entry')
                    seen.add(m.name);e=allowed[m.name]
                    if m.size!=e['bytes']:raise ValueError('Archive size mismatch')
                    if m.name not in expected:continue
                    if not re.fullmatch(r'assets/[a-f0-9]{64}\.[a-z0-9]+',m.name) or expected[m.name]['sha256']!=e['sha256']:raise ValueError('Unsafe asset entry')
                    data=tar.extractfile(m).read()
                    if hashlib.sha256(data).hexdigest()!=e['sha256']:raise ValueError('Restored original differs')
                    p=site/m.name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data);restored.add(m.name)
            if seen!=set(allowed):raise ValueError('Incomplete archive')
    if restored!=set(expected):raise ValueError('Required game assets are missing')
    return {'restored_assets':len(restored)}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('command',choices=['pack','unpack']);p.add_argument('--dist',type=Path,default=Path('dist'));p.add_argument('--bundles',type=Path,default=Path('asset-bundles'));p.add_argument('--fragments-only',action='store_true');a=p.parse_args();result=pack(a.dist,a.bundles) if a.command=='pack' else unpack(a.dist,a.bundles,a.fragments_only);print(json.dumps(result,indent=2))
