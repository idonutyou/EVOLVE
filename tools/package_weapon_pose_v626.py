#!/usr/bin/env python3
"""Build the weapon-pose delta without rebuilding or changing image assets."""
import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = 'c24d4f4520875fdf3dc2be3afe44a26c035c223a'
BASE_BUILD = 'c30e76907b0bf8ab4e5232b944711715ed1c83c2ec1d318d014faa6434e57454'
OLD_ENGINE = 'assets/9456ee1167d83869f3b5aff751cff5e5cd1797a11d4547c61eadd0f0ff6e7287.js'
parser = argparse.ArgumentParser()
parser.add_argument('--baseline-dir', type=Path, help='local copy of the exact baseline, when no Git checkout exists')
args = parser.parse_args()

def old(path):
    if args.baseline_dir:
        return (args.baseline_dir / path).read_bytes()
    return subprocess.check_output(['git', 'show', f'{BASE}:{path}'], cwd=ROOT)

art = json.loads((ROOT / 'web/bio-core-art-v625.json').read_text())
inline = lambda src: src.replace('__BIO_CORE_ART_V625__', json.dumps(art, separators=(',', ':')))
before = inline(old('web/bio-core-player-v625.js').decode())
after = inline((ROOT / 'web/bio-core-player-v625.js').read_text())
engine = old('dist/' + OLD_ENGINE).decode()
assert engine.count(before) == 1, 'Baseline renderer must occur exactly once'
updated = engine.replace(before, after)
assert updated.replace(after, '__MODULE__') == engine.replace(before, '__MODULE__')
raw = updated.encode()
engine_hash = hashlib.sha256(raw).hexdigest()
new_engine = 'assets/' + engine_hash + '.js'
(ROOT / 'dist' / new_engine).write_bytes(raw)

manifest = json.loads(old('dist/asset-manifest.json'))
matches = [e for e in manifest if e['path'] == OLD_ENGINE]
assert len(matches) == 1 and not any(e['path'] == new_engine for e in manifest)
matches[0].update(path=new_engine, sha256=engine_hash, bytes=len(raw))
(ROOT / 'dist/asset-manifest.json').write_text(json.dumps(manifest, separators=(',', ':')) + '\n')

html = old('dist/index.html').decode()
assert html.count(OLD_ENGINE) == 1
html = html.replace(OLD_ENGINE, new_engine)
version = json.loads(old('dist/version.json'))
version['version'] += '-WEAPONPOSE626'
version['scriptBytes'] += len(raw) - len(engine.encode())
version['build'] = hashlib.sha256(BASE_BUILD.encode() + raw + ''.join(
    art[k]['sha256'] for k in ('original', 'matte', 'tail', 'gun', 'walkAtlas', 'idleAtlas')
).encode()).hexdigest()
config = {k: version[k] for k in ('version', 'build', 'scriptBytes', 'preloadResources')}
html, changed = re.subn(r'window\.EVOLVE_WEB_CONFIG=\{.*?\};',
                        lambda _: 'window.EVOLVE_WEB_CONFIG=' + json.dumps(config, separators=(',', ':')) + ';', html, count=1)
assert changed == 1
(ROOT / 'dist/index.html').write_text(html)
(ROOT / 'dist/version.json').write_text(json.dumps(version, ensure_ascii=False, indent=2) + '\n')
report = json.loads(old('dist/verification.json'))
report.update(version=version['version'], build=version['build'], index_bytes=len(html.encode()),
              cached_bytes=sum(e['bytes'] for e in manifest), cached_files=len(manifest))
report['bio_core_v625']['engine'] = new_engine
report['weapon_pose_v626'] = {'visual_scale': 1.5, 'preview_angle_radians': -0.08,
                               'combat_damage_range_and_save_keys_changed': False,
                               'baseline': BASE}
(ROOT / 'dist/verification.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'engine': new_engine, 'sha256': engine_hash, 'build': version['build'], 'assets': len(manifest)}))
