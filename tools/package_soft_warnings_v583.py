#!/usr/bin/env python3
"""Apply WEB-16 presentation changes to the exact current WEB-15 release."""
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = '6fabbfbed161b077707ca704cf080f13ec36c762'
VERSION = 'V575-WEB-16-SOFT-WINDUP-WARNINGS'


def base(path):
    return subprocess.check_output(['git', 'show', BASE + ':' + path], cwd=ROOT)


def once(source, before, after):
    assert source.count(before) == 1, 'Unexpected source anchor: ' + before[:100]
    return source.replace(before, after)


def write(path, value, compact=False):
    path.write_text(json.dumps(value, ensure_ascii=False, **({'separators': (',', ':')} if compact else {'indent': 2})) + '\n')


def package():
    d = ROOT / 'dist'
    previous = json.loads(base('dist/version.json'))
    verification = json.loads(base('dist/verification.json'))
    old_engine = verification['attack_warnings']['engine']
    prior_engine = json.loads((d / 'verification.json').read_text())['attack_warnings']['engine']
    original = base('dist/' + old_engine).decode()
    old_module = base('web/attack-warning-v582.js').decode()
    warning = (ROOT / 'web/attack-warning-v582.js').read_text()
    active_art = (ROOT / 'web/active-hazards-v583.js').read_text()
    code = once(original, old_module, warning + '\n' + active_art)
    wrapper_before = "if(!owner||owner.dead||!combat.current||combat.current.stage==='RECOVERY')return;"
    wrapper_after = "if(!owner||owner.dead||!combat.current||combat.current.stage!=='WINDUP')return;"
    code = once(code, wrapper_before, wrapper_after)
    call_before = '  // Rendered pickups and projectiles;'
    call_after = '  drawActiveHazardsV583();\n' + call_before
    code = once(code, call_before, call_after)
    # Nothing outside warning presentation and restored native active field rendering changes.
    assert code.replace(warning + '\n' + active_art, old_module).replace(wrapper_after, wrapper_before).replace(call_after, call_before) == original
    raw = code.encode()
    digest = hashlib.sha256(raw).hexdigest()
    engine = 'assets/' + digest + '.js'
    (d / engine).write_bytes(raw)
    manifest = json.loads(base('dist/asset-manifest.json'))
    old_entry = next(e for e in manifest if e['path'] == old_engine)
    manifest = [e for e in manifest if e['path'] != old_engine]
    manifest.append({'path': engine, 'sha256': digest, 'bytes': len(raw), 'kind': old_entry['kind']})
    build = hashlib.sha256(previous['build'].encode() + raw).hexdigest()
    config = {'version': VERSION, 'build': build, 'scriptBytes': previous['scriptBytes'] + len(raw) - len(original.encode())}
    html = base('dist/index.html').decode()
    html = re.sub(r'window\.EVOLVE_WEB_CONFIG=\{.*?\};', lambda _: 'window.EVOLVE_WEB_CONFIG=' + json.dumps(config) + ';', html, count=1)
    html = once(html, f'src="{old_engine}" onload="EVOLVE_WEB_CLIENT.loaded({old_entry["bytes"]})"', f'src="{engine}" onload="EVOLVE_WEB_CLIENT.loaded({len(raw)})"')
    (d / 'index.html').write_text(html)
    write(d / 'asset-manifest.json', manifest, True)
    write(d / 'version.json', config | {'assets': len(manifest), 'source_sha256': previous['source_sha256']})
    verification.update(version=VERSION, build=build, index_bytes=len(html.encode()), cached_files=len(manifest), cached_bytes=sum(e['bytes'] for e in manifest))
    verification['attack_warnings'].update(baseline_commit=BASE, engine=engine, windup_only=True, fill_opacity=.075, edge_opacity=.65, line_width=1.25, active_overlays=False, native_active_artwork_preserved=True, sources=['web/attack-warning-v582.js', 'web/active-hazards-v583.js'])
    write(d / 'verification.json', verification)
    for stale in {old_engine, prior_engine} - {engine}:
        assert re.fullmatch(r'assets/[a-f0-9]{64}\.js', stale)
        (d / stale).unlink(missing_ok=True)
    cpath = ROOT / 'docs/soft-warnings-v583-checkpoint.json'
    checkpoint = json.loads(cpath.read_text())
    checkpoint.update(progress=40, status='WEB-16 packaged from latest WEB-15; only warning presentation and native active artwork rendering changed', build=build, engine='dist/' + engine, stage_backups={'20': 'b3df61a18b1ae19b182688b9564483b38d72c1bf'}, next='Verify subtle pixels, windup-to-active transitions, native effects and regressions')
    write(cpath, checkpoint)
    print(json.dumps(config | {'engine': engine, 'engine_bytes': len(raw), 'delta_bytes': len(raw) - len(original.encode())}))


if __name__ == '__main__':
    package()
