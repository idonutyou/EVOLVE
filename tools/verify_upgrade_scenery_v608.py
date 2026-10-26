#!/usr/bin/env python3
"""Confirm the actual published upgrade UI, engine and reference image bytes."""
import argparse
import hashlib
import json
import time
import urllib.request
from pathlib import Path

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--url', default='https://idonutyou.github.io/EVOLVE/')
    parser.add_argument('--dist', type=Path, default=Path('dist'))
    parser.add_argument('--output', type=Path, default=Path('test-results/upgrade-scenery-live-bytes.json'))
    args = parser.parse_args()
    base = args.url.rstrip('/') + '/'
    version = json.loads((args.dist / 'version.json').read_text())
    verification = json.loads((args.dist / 'verification.json').read_text())
    feature = verification['upgrade_scenery_v608']
    paths = ['index.html', 'version.json', 'asset-manifest.json',
             feature['script'], feature['stylesheet'], feature['reference']['path'],
             verification['home_hub_v601']['engine']]
    checks = []
    for name in dict.fromkeys(paths):
        request = urllib.request.Request(base + name + '?verify=' + str(time.time_ns()),
                                         headers={'Cache-Control': 'no-cache', 'User-Agent': 'EVOLVE-release-verification'})
        with urllib.request.urlopen(request, timeout=45) as response:
            actual = response.read()
            assert response.status == 200, name
        expected = (args.dist / name).read_bytes()
        assert actual == expected, name
        checks.append({'path': name, 'bytes': len(actual), 'sha256': hashlib.sha256(actual).hexdigest(), 'matches': True})
    assert feature['engine_unchanged'] and feature['original_image_bytes_unchanged']
    report = {'success': True, 'url': base, 'version': version['version'], 'build': version['build'],
              'checks': checks, 'engine_unchanged': True, 'reference_bytes_unchanged': True,
              'physical_Galaxy_S23_plus_tested': False}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'success': True, 'url': base, 'build': version['build'], 'files_matched': len(checks)}))

if __name__ == '__main__':
    main()
