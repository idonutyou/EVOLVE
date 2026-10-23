#!/usr/bin/env python3
"""Confirm the actual Pages build and exact cinematic artwork after deployment."""
import argparse
import hashlib
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--url', required=True)
    parser.add_argument('--dist', type=Path, default=Path('dist'))
    parser.add_argument('--output', type=Path, default=Path('test-results/web17-live.json'))
    args = parser.parse_args()
    expected = json.loads((args.dist / 'version.json').read_text())
    report = json.loads((args.dist / 'verification.json').read_text())
    art = json.loads(Path('web/warning-branding-art-v581.json').read_text())
    root = args.url.rstrip('/') + '/'
    query = '?evolveVerify=' + expected['build'][:20]

    def fetch(path):
        url = urllib.parse.urljoin(root, path) + query
        request = urllib.request.Request(url, headers={'User-Agent': 'EVOLVE-Pages-Verification', 'Cache-Control': 'no-cache'})
        with urllib.request.urlopen(request, timeout=120) as response:
            return response.read()

    last_error = None
    for attempt in range(12):
        try:
            live = json.loads(fetch('version.json'))
            assert live == expected, 'Pages version has not reached the expected build'
            break
        except Exception as error:
            last_error = error
            if attempt == 11:
                raise RuntimeError('Published build verification failed: ' + str(last_error))
            time.sleep(5)
    live_manifest = fetch('asset-manifest.json')
    assert live_manifest == (args.dist / 'asset-manifest.json').read_bytes(), 'Published asset manifest differs'
    engine = report['attack_warnings']['engine']
    live_engine = fetch(engine)
    engine_sha = hashlib.sha256(live_engine).hexdigest()
    assert engine_sha == Path(engine).stem, 'Published engine bytes differ'
    html = fetch('index.html').decode()
    assert engine in html and expected['build'] in html, 'Published entry page references a stale engine'
    assets = {}
    for name, atlas in art['atlases'].items():
        raw = fetch(atlas['path'])
        digest = hashlib.sha256(raw).hexdigest()
        assert digest == atlas['sha256'] and len(raw) == atlas['bytes'], 'Published artwork differs: ' + name
        assets[name] = {'path': atlas['path'], 'sha256': digest, 'bytes': len(raw), 'matches': True}
    result = {'success': True, 'url': root, 'version': expected['version'], 'build': expected['build'], 'version_matches': True, 'manifest_matches': True, 'entry_matches': True, 'engine': engine, 'engine_sha256': engine_sha, 'engine_matches': True, 'artwork': assets, 'boss_names_English_in_both_locales': 'bio_ko' not in art['sprites'] and 'venom_ko' not in art['sprites'], 'Korean_labels': [key for key in art['sprites'] if key.endswith('_ko')], 'physical_Galaxy_S23_plus_tested': False}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(result, ensure_ascii=False))

if __name__ == '__main__':
    main()
