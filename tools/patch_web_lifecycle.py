#!/usr/bin/env python3
"""Apply the small online-shell repair after first-upload restoration."""
import argparse
import hashlib
import json
from pathlib import Path
from verify_site import verify

OLD_SHELL = '17e952267834c50233fa7546cfd43deda9675cb5420a29f9c5c6689bcdff1ee3'


def patch(dist, client):
    dist, client = Path(dist), Path(client)
    manifest = json.loads((dist / 'asset-manifest.json').read_text())
    shell = [entry for entry in manifest if entry.get('kind') == 'web-shell']
    if len(shell) != 1:
        raise ValueError('Expected one online-shell asset')
    entry = shell[0]
    original = (dist / entry['path']).read_bytes()
    new = client.read_bytes()
    if original == new:
        return verify(dist)
    if entry['sha256'] != OLD_SHELL or hashlib.sha256(original).hexdigest() != OLD_SHELL:
        raise ValueError('Refusing to replace a later or unverified online shell')
    digest = hashlib.sha256(new).hexdigest()
    target = 'assets/' + digest + '.js'
    html = (dist / 'index.html').read_text()
    if html.count(entry['path']) != 1:
        raise ValueError('Expected one online-shell script reference')
    html = html.replace(entry['path'], target)
    old_path = entry['path']
    entry.update(path=target, sha256=digest, bytes=len(new))
    version = json.loads((dist / 'version.json').read_text())
    report = json.loads((dist / 'verification.json').read_text())
    old_build = version['build']
    build = hashlib.sha256(old_build.encode() + new).hexdigest()
    html = html.replace(old_build, build).replace('"version": "V575-WEB-1"', '"version": "V575-WEB-2"')
    version.update(build=build, version='V575-WEB-2')
    report.update(build=build, version='V575-WEB-2', index_bytes=len(html.encode()),
                  cached_bytes=sum(e['bytes'] for e in manifest),
                  web_lifecycle_fix={'loader_removed_before_dom_ready': True,
                                     'game_code_changed': False, 'images_changed': False})
    (dist / target).write_bytes(new)
    (dist / 'index.html').write_text(html)
    (dist / 'asset-manifest.json').write_text(json.dumps(manifest, separators=(',', ':')) + '\n')
    (dist / 'version.json').write_text(json.dumps(version, indent=2) + '\n')
    (dist / 'verification.json').write_text(json.dumps(report, indent=2) + '\n')
    (dist / old_path).unlink()
    return verify(dist)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dist', type=Path, default=Path('dist'))
    parser.add_argument('--client', type=Path, default=Path('web/client.js'))
    args = parser.parse_args()
    print(json.dumps(patch(args.dist, args.client), indent=2))
