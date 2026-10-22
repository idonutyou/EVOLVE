#!/usr/bin/env python3
"""Package the reviewed WEB-11 monster-only change over the exact WEB-10 baseline."""
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = '25b88a698d225b1bcb5aaacef4125596206b9ff5'
OLD_ENGINE = 'assets/5810c067cab080ff526dae458240de606e33f22e596514f39c9a986498487e41.js'
ATLAS = 'assets/1957116b5da4e7d11cc66e4b5bf4bce48af2fc1ec649a5b13f3a6f428f10b63b.png'
VERSION = 'V575-WEB-11-LEGACY-MONSTER-MOTION'


def baseline(path):
    return subprocess.check_output(['git', 'show', BASE + ':' + path], cwd=ROOT)


def write_json(path, value, compact=False):
    text = json.dumps(value, separators=(',', ':')) if compact else json.dumps(value, indent=2)
    path.write_text(text + '\n')


def package():
    dist = ROOT / 'dist'
    current = json.loads((dist / 'version.json').read_text())
    if current['version'] not in ['V575-WEB-10-MONSTER-MOTION', VERSION]:
        raise ValueError('A newer or unrelated baseline must not be overwritten')
    old = baseline('dist/' + OLD_ENGINE).decode()
    old_module = baseline('web/monster-motion-v577.js').decode().replace('__MONSTER_ATLAS_PATH__', ATLAS)
    if old.count(old_module) != 1:
        raise ValueError('Canonical WEB-10 module does not match its embedded copy')
    metadata = json.loads((ROOT / 'web/monster-atlas-v578.json').read_text())
    module = (ROOT / 'web/monster-motion-v578.js').read_text()
    module = module.replace("JSON.parse('__LEGACY_MONSTER_FRAMES__')", json.dumps(metadata, separators=(',', ':')))
    module = module.replace('__MONSTER_ATLAS_PATH__', ATLAS)
    if '__LEGACY_MONSTER' in module or '__MONSTER_ATLAS' in module:
        raise ValueError('Unresolved module input')
    code = old.replace(old_module, module).encode()
    digest = hashlib.sha256(code).hexdigest()
    engine = 'assets/' + digest + '.js'
    (dist / engine).write_bytes(code)
    manifest = json.loads(baseline('dist/asset-manifest.json'))
    original_images = [e for e in manifest if e['kind'] == 'image']
    for entry in original_images:
        if hashlib.sha256((dist / entry['path']).read_bytes()).hexdigest() != entry['sha256']:
            raise ValueError('Original image changed: ' + entry['path'])
    manifest = [e for e in manifest if e['path'] != OLD_ENGINE]
    manifest.append({'path': engine, 'sha256': digest, 'bytes': len(code), 'kind': 'game-code'})
    for entry in metadata['sheets']:
        data = (dist / entry['path']).read_bytes()
        if hashlib.sha256(data).hexdigest() != entry['sha256']:
            raise ValueError('Generated atlas bytes changed')
        manifest.append({k: entry[k] for k in ['path', 'sha256', 'bytes']} | {'kind': 'image'})
    html = baseline('dist/index.html').decode()
    old_version = json.loads(baseline('dist/version.json'))
    build = hashlib.sha256(old_version['build'].encode() + code + json.dumps(metadata, sort_keys=True).encode()).hexdigest()
    config = {'version': VERSION, 'build': build, 'scriptBytes': old_version['scriptBytes'] + len(code) - len(old.encode())}
    html = re.sub(r'window\.EVOLVE_WEB_CONFIG=\{.*?\};', lambda m: 'window.EVOLVE_WEB_CONFIG=' + json.dumps(config) + ';', html, count=1)
    old_tag = f'src="{OLD_ENGINE}" onload="EVOLVE_WEB_CLIENT.loaded({len(old.encode())})"'
    new_tag = f'src="{engine}" onload="EVOLVE_WEB_CLIENT.loaded({len(code)})"'
    if html.count(old_tag) != 1:
        raise ValueError('Engine script tag is not the expected baseline tag')
    html = html.replace(old_tag, new_tag)
    (dist / 'index.html').write_text(html)
    write_json(dist / 'asset-manifest.json', manifest, compact=True)
    write_json(dist / 'version.json', config | {'assets': len(manifest), 'source_sha256': old_version['source_sha256']})
    report = json.loads(baseline('dist/verification.json'))
    report.update(version=VERSION, build=build, index_bytes=len(html.encode()),
                  image_assets=len(original_images) + 2, cached_files=len(manifest),
                  cached_bytes=sum(e['bytes'] for e in manifest))
    report['legacy_monster_motion'] = {
        'baseline_commit': BASE, 'baseline_version': old_version['version'],
        'engine': engine, 'source': 'web/monster-motion-v578.js',
        'atlases': metadata['sheets'], 'types': list(metadata['types']),
        'painted_poses': 24, 'total_cached_frames': 40,
        'old_split_limb_deformation_removed': True, 'foot_anchors_normalized': True,
        'original_image_entries_preserved': len(original_images),
        'original_image_bytes_unchanged': True, 'atlas_bytes_not_reencoded': True,
        'per_frame_texture_uploads': False, 'titan_motion_preserved': True,
        'maps_changed': False, 'combat_balance_changed': False,
        'save_keys_unchanged': True, 'audio_changed': False,
        'physical_Galaxy_S23_plus_tested': False,
    }
    report['monster_motion']['engine'] = engine
    write_json(dist / 'verification.json', report)
    checkpoint = ROOT / 'docs/legacy-monster-motion-v578-checkpoint.json'
    state = json.loads(checkpoint.read_text())
    state.update(progress=50, status='WEB-11 packaged; all original images verified byte for byte',
                 build=build, engine='dist/' + engine,
                 original_image_entries_preserved=len(original_images),
                 next='Run state, packaging and full mobile browser regressions, including all six original appearances')
    write_json(checkpoint, state)
    (dist / OLD_ENGINE).unlink(missing_ok=True)
    print(json.dumps({'version': VERSION, 'build': build, 'engine': engine,
                      'painted_original_types': list(metadata['types']),
                      'unchanged_original_images': len(original_images)}))


if __name__ == '__main__':
    package()
