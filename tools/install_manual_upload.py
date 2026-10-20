#!/usr/bin/env python3
"""Restore the complete V575 website from the user's 68 flat upload files."""
import argparse
import base64
import hashlib
import json
import re
import shutil
import tarfile
import tempfile
from pathlib import Path

from verify_site import verify

SOURCE_SHA = 'd5ea39a2fc07eab4507d7782ccfbd339ab7c6285f0c874fd061716bde2ab63ea'
TOP_FILES = {'index.html', 'version.json', 'asset-manifest.json', 'verification.json', 'sw.js', '.nojekyll'}


def checked_bytes(path, entry):
    data = path.read_bytes()
    if len(data) != entry['bytes'] or hashlib.sha256(data).hexdigest() != entry['sha256']:
        raise ValueError('Upload checksum mismatch: ' + str(path))
    return data


def install(root, dist):
    root, dist = Path(root).resolve(), Path(dist).resolve()
    if dist.exists() and any(dist.iterdir()):
        raise ValueError('Refusing to replace an existing site with the first-upload package')
    doc = json.loads((root / 'EVOLVE_V575_INSTALL.json').read_text())
    if doc.get('format') != 'EVOLVE_MANUAL_UPLOAD_V1' or doc.get('source_sha256') != SOURCE_SHA:
        raise ValueError('This is not the approved V575 upload package')
    parts = doc['parts']
    if not parts or len(parts) > 99 or len({p['path'] for p in parts}) != len(parts):
        raise ValueError('Invalid upload parts')
    for i, part in enumerate(parts, 1):
        if part['path'] != f'EVOLVE_V575_PART_{i:03d}.bin' or not 0 < part['bytes'] <= 25 * 1024**2:
            raise ValueError('Invalid upload part name or size')
        if not (root / part['path']).is_file():
            raise ValueError('Missing upload file: ' + part['path'])
    if {f['path'] for f in doc['site_files']} != TOP_FILES or len(doc['site_files']) != len(TOP_FILES):
        raise ValueError('Incomplete website entry files')
    dist.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='.evolve-install-', dir=dist.parent) as temporary:
        work = Path(temporary)
        stage = work / 'site'
        stage.mkdir()
        for entry in doc['site_files']:
            data = base64.b64decode(entry['data_base64'], validate=True)
            if len(data) != entry['bytes'] or hashlib.sha256(data).hexdigest() != entry['sha256']:
                raise ValueError('Entry file checksum mismatch: ' + entry['path'])
            (stage / entry['path']).write_bytes(data)
        version = json.loads((stage / 'version.json').read_text())
        if version['build'] != doc['build'] or version['source_sha256'] != SOURCE_SHA:
            raise ValueError('Website version does not match the upload package')
        entries = json.loads((stage / 'asset-manifest.json').read_text())
        wanted = {entry['path']: entry for entry in entries}
        if len(wanted) != len(entries) or not wanted:
            raise ValueError('Invalid asset list')
        for name in wanted:
            if not re.fullmatch(r'assets/[a-f0-9]{64}\.[a-z0-9]+', name):
                raise ValueError('Invalid asset path: ' + name)
        archive = work / 'assets.tar.gz'
        digest, count = hashlib.sha256(), 0
        with archive.open('wb') as target:
            for part in parts:
                data = checked_bytes(root / part['path'], part)
                target.write(data)
                digest.update(data)
                count += len(data)
        if count != doc['archive_bytes'] or digest.hexdigest() != doc['archive_sha256']:
            raise ValueError('Complete archive checksum mismatch')
        seen = set()
        with tarfile.open(archive, 'r|gz') as bundle:
            for member in bundle:
                if not member.isfile() or member.name not in wanted or member.name in seen:
                    raise ValueError('Unexpected archive member: ' + member.name)
                entry = wanted[member.name]
                if member.size != entry['bytes']:
                    raise ValueError('Asset size mismatch: ' + member.name)
                target = stage / member.name
                target.parent.mkdir(parents=True, exist_ok=True)
                h = hashlib.sha256()
                with bundle.extractfile(member) as source, target.open('wb') as output:
                    while chunk := source.read(1024 * 1024):
                        h.update(chunk)
                        output.write(chunk)
                if h.hexdigest() != entry['sha256']:
                    raise ValueError('Asset checksum mismatch: ' + member.name)
                seen.add(member.name)
        if seen != set(wanted):
            raise ValueError('Archive is missing game assets')
        result = verify(stage)
        if dist.exists():
            dist.rmdir()
        shutil.move(str(stage), str(dist))
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path('.'))
    parser.add_argument('--dist', type=Path, default=Path('dist'))
    args = parser.parse_args()
    print(json.dumps(install(args.root, args.dist), indent=2))
