#!/usr/bin/env python3
"""Patch only movement/weapon facing and the existing field device on WEB-22."""
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = '34b9dea9c2b52139ebbad90570ff55c6ae018df9'
VERSION = 'V575-WEB-23-MOVEMENT-FIELD'


def base(path):
    return subprocess.check_output(['git', 'show', BASE+':'+path], cwd=ROOT)


def write(path, value, compact=False):
    path.write_text(json.dumps(value, ensure_ascii=False, **({'separators': (',', ':')} if compact else {'indent': 2}))+'\n')


def main():
    dist = ROOT/'dist'
    previous = json.loads(base('dist/version.json'))
    report = json.loads(base('dist/verification.json'))
    old_engine = report['arm_items']['engine']
    original = base('dist/'+old_engine).decode()
    current = json.loads((dist/'verification.json').read_text())
    prior_engine = current.get('movement_field', {}).get('engine', old_engine)
    code = original
    changes = []
    for module, placeholder, art in [
        ('player-original-v588.js', '__PLAYER_ORIGINAL_ART__', 'player-original-art-v588.json'),
        ('arm-items-v589.js', '__ARM_ITEMS_ART__', 'arm-items-art-v589.json'),
        ('red-pulse-v579.js', '__RED_PULSE_ART__', 'red-pulse-art-v579.json'),
    ]:
        payload = json.dumps(json.loads(base('web/'+art)), separators=(',', ':'))
        before = base('web/'+module).decode().replace("JSON.parse('"+placeholder+"')", payload)
        after = (ROOT/'web'/module).read_text().replace("JSON.parse('"+placeholder+"')", payload)
        assert code.count(before) == 1, module+' baseline differs'
        code = code.replace(before, after)
        changes.append((before, after))
    marker = '\nwindow.EVOLVE_WEB_GUARD='
    module = (ROOT/'web/movement-field-v590.js').read_text()
    assert code.count(marker) == 1
    replacement = '\n'+module+marker
    code = code.replace(marker, replacement)
    changes.append((marker, replacement))
    reverted = code
    for before, after in reversed(changes):
        assert reverted.count(after) == 1
        reverted = reverted.replace(after, before)
    assert reverted == original, 'Unrelated game, map, boss or progression bytes changed'

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
    report['red_pulse_device'].update(respawn_seconds=60, wave_spread_seconds=.78, wave_life_seconds=1.18, spawn_policy='uniform random reachable player-foot component across the complete map; no camera, radial-distance or line-of-sight bias', electrical_field_stroke_width=12)
    report['movement_field'] = {
        'engine': engine, 'baseline_commit': BASE, 'source': 'web/movement-field-v590.js',
        'body_follows_actual_movement_only': True, 'weapon_aim_hold_seconds': 2,
        'dash_follows_actual_displacement_without_shortening_aim_hold': True,
        'weapon_returns_to_movement_after_hold': True, 'pause_freezes_hold': True,
        'existing_upright_mirror_limits_preserved': True,
        'field_respawn_seconds': 60, 'field_spread_seconds': .78, 'field_stroke_width': 12,
        'field_uses_reachable_player_foot_component': True, 'field_uses_entire_map': True,
        'no_invalid_spawn_fallback': True, 'one_active_device': True,
        'existing_image_bytes_unchanged': preserved, 'new_image_assets': 0,
        'maps_bosses_save_keys_and_other_attacks_unchanged': True,
        'physical_Galaxy_S23_plus_tested': False,
    }
    write(dist/'verification.json', report)
    for obsolete in {old_engine, prior_engine}-{engine}:
        assert re.fullmatch(r'assets/[a-f0-9]{64}\.js', obsolete)
        (dist/obsolete).unlink(missing_ok=True)
    checkpoint = {'task': 'Independent movement-facing body and two-second weapon aim; slower thick electrical field with infrequent random reachable-map spawns',
                  'progress': 50, 'version': VERSION, 'build': build, 'engine': 'dist/'+engine,
                  'status': 'Implementation packaged; functional and visual checks pending',
                  'constraints': report['movement_field'],
                  'next': 'Verify independent body/weapon angles, two-second expiration and repeated attacks, real-map reachable spawn distribution and wave rendering; automatically upload, deploy and verify actual Pages'}
    write(ROOT/'docs/movement-field-v590-checkpoint.json', checkpoint)
    print(json.dumps(config | {'engine': engine, 'preserved_images': preserved}))


if __name__ == '__main__':
    main()
