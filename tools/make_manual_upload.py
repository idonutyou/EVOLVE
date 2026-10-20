#!/usr/bin/env python3
"""Create a complete, flat, web-uploadable V575 package without reencoding assets."""
import argparse
import base64
import hashlib
import json
import shutil
import zipfile
from pathlib import Path
from install_manual_upload import SOURCE_SHA, TOP_FILES, checked_bytes
from verify_site import verify


def make(root, destination):
    root, destination = Path(root), Path(destination)
    dist = root / 'dist'
    checked = verify(dist)
    version = json.loads((dist / 'version.json').read_text())
    if version['source_sha256'] != SOURCE_SHA:
        raise ValueError('The website is not based on the approved V575 source')
    archives = json.loads((root / 'asset-bundles/index.json').read_text())['archives']
    if len(archives) != 1:
        raise ValueError('First-upload package expects exactly one complete archive')
    archive = archives[0]
    payload = destination / 'UPLOAD_FILES'
    payload.mkdir(parents=True, exist_ok=False)
    doc = {'format': 'EVOLVE_MANUAL_UPLOAD_V1', 'version': version['version'],
           'source_sha256': SOURCE_SHA, 'build': version['build'],
           'archive_sha256': archive['sha256'], 'archive_bytes': archive['bytes'],
           'parts': [], 'site_files': []}
    total, whole = 0, hashlib.sha256()
    for i, entry in enumerate(archive['parts'], 1):
        data = checked_bytes(root / 'asset-bundles' / entry['path'], entry)
        name = f'EVOLVE_V575_PART_{i:03d}.bin'
        (payload / name).write_bytes(data)
        whole.update(data)
        total += len(data)
        doc['parts'].append({'path': name, 'sha256': entry['sha256'], 'bytes': len(data)})
    if total != archive['bytes'] or whole.hexdigest() != archive['sha256']:
        raise ValueError('Source archive integrity failed')
    for name in sorted(TOP_FILES):
        data = (dist / name).read_bytes()
        doc['site_files'].append({'path': name, 'sha256': hashlib.sha256(data).hexdigest(),
                                  'bytes': len(data), 'data_base64': base64.b64encode(data).decode()})
    (payload / 'EVOLVE_V575_INSTALL.json').write_text(json.dumps(doc, separators=(',', ':')) + '\n')
    names = [p['path'] for p in doc['parts']] + ['EVOLVE_V575_INSTALL.json']
    if len(names) > 100 or any((payload / n).stat().st_size > 25 * 1024**2 for n in names):
        raise ValueError('GitHub browser upload limit exceeded')
    readme = destination / 'EVOLVE_V575_UPLOAD_GUIDE_KO.txt'
    shutil.copyfile(root / 'docs/MANUAL_UPLOAD_KO.txt', readme)
    output = destination / 'EVOLVE_V575_GITHUB_FULL_UPLOAD.zip'
    with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_STORED, allowZip64=True) as zipout:
        for name in names:
            zipout.write(payload / name, 'UPLOAD_FILES/' + name)
        zipout.write(readme, readme.name, compress_type=zipfile.ZIP_DEFLATED)
    with zipfile.ZipFile(output) as zipin:
        bad = zipin.testzip()
        if bad or len(zipin.infolist()) != len(names) + 1:
            raise ValueError('ZIP verification failed: ' + str(bad))
    result = {'zip': str(output.resolve()), 'bytes': output.stat().st_size,
              'sha256': hashlib.file_digest(output.open('rb'), 'sha256').hexdigest(),
              'upload_files': len(names), 'site': checked}
    (destination / 'package-verification.json').write_text(json.dumps(result, indent=2) + '\n')
    return result


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--root', type=Path, default=Path('.'))
    p.add_argument('--output', type=Path, required=True)
    a = p.parse_args()
    print(json.dumps(make(a.root, a.output), indent=2))
