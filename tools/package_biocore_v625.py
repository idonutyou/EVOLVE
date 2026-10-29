#!/usr/bin/env python3
"""Package the bio-core renderer on top of the verified current main build."""
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = 'd2b1c3711a815d807c6f7697f49472e9c273e2a0'
ENGINE = 'assets/a588f107bb6f44770ad9b0e23f56beda5ad5edfcf92499969c18bc442e8e4908.js'

def old(name):
    return subprocess.check_output(['git', 'show', f'{BASE}:{name}'], cwd=ROOT)

def dump(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

def main():
    dist = ROOT / 'dist'
    version = json.loads(old('dist/version.json'))
    manifest = json.loads(old('dist/asset-manifest.json'))
    report = json.loads(old('dist/verification.json'))
    html = old('dist/index.html').decode()
    original = old('dist/' + ENGINE).decode()
    before = old('web/mock-core-adapter-v617.js').decode()
    after = (ROOT / 'web/mock-core-adapter-v617.js').read_text()
    assert original.count(before) == 1, 'Optional premium adapter does not match current engine'
    code = original.replace(before, after)
    art = json.loads((ROOT / 'web/bio-core-art-v625.json').read_text())
    module = (ROOT / 'web/bio-core-player-v625.js').read_text().replace('__BIO_CORE_ART_V625__', json.dumps(art, separators=(',', ':')))
    marker = '\nwindow.EVOLVE_WEB_GUARD='
    assert code.count(marker) == 1
    code = code.replace(marker, '\n' + module + marker)
    gate = 'warningBrandReadyV581,playerReadyV586,mutantReadyV599]'
    assert code.count(gate) == 1
    code = code.replace(gate, 'warningBrandReadyV581,playerReadyV586,mutantReadyV599,bioReadyV625]')
    check = code.replace('warningBrandReadyV581,playerReadyV586,mutantReadyV599,bioReadyV625]', gate).replace('\n' + module + marker, marker).replace(after, before)
    assert check == original, 'Unexpected changes outside the new renderer and optional cosmetic anchor'
    raw = code.encode()
    sha = hashlib.sha256(raw).hexdigest()
    engine = f'assets/{sha}.js'
    (dist / engine).write_bytes(raw)
    assert html.count(ENGINE) == 1
    html = html.replace(ENGINE, engine)
    additions = [{ 'path': engine, 'sha256': sha, 'bytes': len(raw), 'kind': 'game-code' }]
    for key in ['original', 'matte', 'tail', 'gun', 'walkAtlas', 'idleAtlas']:
        entry = art[key]
        content = (dist / entry['path']).read_bytes()
        assert len(content) == entry['bytes'] and hashlib.sha256(content).hexdigest() == entry['sha256']
        additions.append(entry)
    existing = {entry['path'] for entry in manifest}
    assert all(entry['path'] not in existing for entry in additions)
    manifest.extend(additions)
    build = hashlib.sha256(version['build'].encode() + raw + ''.join(entry['sha256'] for entry in additions[1:]).encode()).hexdigest()
    config = {'version': version['version'] + '-BIOCORE625', 'build': build,
              'scriptBytes': version['scriptBytes'] + len(raw) - len(original.encode()), 'preloadResources': True}
    html, n = re.subn(r'window\.EVOLVE_WEB_CONFIG=\{.*?\};', lambda m: 'window.EVOLVE_WEB_CONFIG=' + json.dumps(config, separators=(',', ':')) + ';', html, count=1)
    assert n == 1
    version.update(config, assets=len(manifest))
    (dist / 'index.html').write_text(html)
    dump(dist / 'version.json', version)
    (dist / 'asset-manifest.json').write_text(json.dumps(manifest, separators=(',', ':')) + '\n')
    report.update(version=config['version'], build=build, index_bytes=len(html.encode()), cached_files=len(manifest), cached_bytes=sum(e['bytes'] for e in manifest), image_assets=sum(e['kind']=='image' for e in manifest))
    report['bio_core_v625'] = {'baseline': BASE, 'engine': engine, 'source': art['original'], 'matte': art['matte'], 'four_short_legs': True,
                               'default_tail_absent': True, 'skill_tail': art['tail'], 'cannon': art['gun'], 'walk_atlas': art['walkAtlas'],
                               'idle_atlas': art['idleAtlas'], 'save_migration': False, 'physical_Galaxy_S23_plus_tested': False}
    dump(dist / 'verification.json', report)
    print(json.dumps({'base': BASE, 'engine': engine, 'build': build, 'assets': len(manifest), 'added': len(additions)}, ensure_ascii=False))

if __name__ == '__main__':
    main()
