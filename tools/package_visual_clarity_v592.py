#!/usr/bin/env python3
"""Patch the exact deployed WEB-24 game; retain all other source and image bytes."""
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = '5996ae1f9322ebb2d3ed0cb2e47dfb10c9e6fbc2'
VERSION = 'V575-WEB-25-VISUAL-CLARITY'


def base(path):
    return subprocess.check_output(['git', 'show', BASE+':'+path], cwd=ROOT)


def write(path, value, compact=False):
    path.write_text(json.dumps(value, ensure_ascii=False, **({'separators': (',', ':')} if compact else {'indent': 2}))+'\n')


def main():
    dist = ROOT/'dist'
    previous = json.loads(base('dist/version.json'))
    report = json.loads(base('dist/verification.json'))
    old_engine = report['horde_roles']['engine']
    prior_engine = json.loads((dist/'verification.json').read_text()).get('visual_clarity', {}).get('engine')
    original = base('dist/'+old_engine).decode()
    code = original
    changes = []

    def replace(before, after, count=1):
        nonlocal code
        assert code.count(before) == count, 'Unexpected patch anchor: '+before[:100]
        code = code.replace(before, after)
        changes.append((before, after, count))

    for patch in json.loads((ROOT/'web/visual-clarity-patches-v592.json').read_text()):
        replace(patch['before'], patch['after'], patch['count'])
    for module, art, placeholder in [('warning-branding-v581.js', 'warning-branding-art-v581.json', '__WARNING_BRANDING_ART__'), ('boss-cinematic-v580.js', 'boss-cinematic-art-v580.json', '__BOSS_CINEMATIC_ART__'), ('attack-warning-v582.js', None, None)]:
        before = base('web/'+module).decode()
        after = (ROOT/'web'/module).read_text()
        if art:
            payload = json.dumps(json.loads(base('web/'+art)), separators=(',', ':'))
            before = before.replace("JSON.parse('"+placeholder+"')", payload)
            after = after.replace("JSON.parse('"+placeholder+"')", payload)
        replace(before, after)
    marker = '\nwindow.EVOLVE_WEB_GUARD='
    replace(marker, '\n'+(ROOT/'web/visual-clarity-v592.js').read_text()+marker)
    reverted = code
    for before, after, count in reversed(changes):
        assert reverted.count(after) == count
        reverted = reverted.replace(after, before)
    assert reverted == original, 'Unrelated game bytes changed'

    raw = code.encode()
    sha = hashlib.sha256(raw).hexdigest()
    engine = 'assets/'+sha+'.js'
    (dist/engine).write_bytes(raw)
    manifest = json.loads(base('dist/asset-manifest.json'))
    preserved = 0
    for entry in manifest:
        if entry['path'] == old_engine:
            entry.update(path=engine, sha256=sha, bytes=len(raw))
        elif entry['kind'] == 'image':
            data = (dist/entry['path']).read_bytes()
            assert len(data) == entry['bytes'] and hashlib.sha256(data).hexdigest() == entry['sha256'], entry['path']
            preserved += 1
    assert preserved == 994
    build = hashlib.sha256(previous['build'].encode()+raw).hexdigest()
    config = {'version': VERSION, 'build': build, 'scriptBytes': previous['scriptBytes']+len(raw)-len(original.encode())}
    html = base('dist/index.html').decode()
    html = re.sub(r'window\.EVOLVE_WEB_CONFIG=\{.*?\};', lambda _: 'window.EVOLVE_WEB_CONFIG='+json.dumps(config)+';', html, count=1)
    before = f'src="{old_engine}" onload="EVOLVE_WEB_CLIENT.loaded({len(original.encode())})"'
    assert html.count(before) == 1
    html = html.replace(before, f'src="{engine}" onload="EVOLVE_WEB_CLIENT.loaded({len(raw)})"')
    (dist/'index.html').write_text(html)
    write(dist/'asset-manifest.json', manifest, True)
    write(dist/'version.json', config | {'assets': len(manifest), 'source_sha256': previous['source_sha256']})

    def refs(value):
        if isinstance(value, dict): return {k: refs(v) for k, v in value.items()}
        if isinstance(value, list): return [refs(v) for v in value]
        return engine if value == old_engine else value

    report = refs(report)
    report.update(version=VERSION, build=build, index_bytes=len(html.encode()), cached_bytes=sum(e['bytes'] for e in manifest))
    report['visual_clarity'] = {'engine': engine, 'baseline_commit': BASE,
        'wave_and_spawn_decoration_rings_removed': True, 'cpu_and_gpu_paths_updated': True,
        'all_ordinary_health_bars_on_hit_only': True, 'health_display_seconds': 1.2,
        'health_uses_rendered_sprite_bounds': True, 'health_after_foreground': True,
        'boss_hud_preserved': True, 'venom_parallel_volley_one_outer_warning': True,
        'venom_radial_volley_one_warning': True, 'warning_tape_lettering_shared_canvas_transform': True,
        'warning_tape_speed_px_per_second': 40, 'previous_warning_speed_px_per_second': 27,
        'warning_tape_material': 'cached weathered oxide steel', 'subtitle_removed': True,
        'original_painted_lettering_preserved': True, 'existing_image_bytes_unchanged': preserved,
        'new_image_assets': 0, 'maps_saves_attacks_projectiles_and_damage_unchanged': True,
        'physical_Galaxy_S23_plus_tested': False}
    write(dist/'verification.json', report)
    for obsolete in {old_engine, prior_engine}-{None, engine}:
        assert re.fullmatch(r'assets/[a-f0-9]{64}\.js', obsolete)
        (dist/obsolete).unlink(missing_ok=True)
    write(ROOT/'docs/visual-clarity-v592-checkpoint.json', {'progress': 50, 'version': VERSION, 'build': build,
        'engine': engine, 'status': 'Packaged; functional and visual checks pending', 'rules': report['visual_clarity'],
        'next': 'Verify hit-only bars above all sprite types in CPU/GPU modes, removed circles, merged Venom warnings, aligned moving tape and missing subtitle; automatically upload, deploy and verify Pages.'})
    print(json.dumps(config | {'engine': engine, 'preserved_images': preserved}))


if __name__ == '__main__':
    main()
