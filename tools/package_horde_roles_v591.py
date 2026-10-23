#!/usr/bin/env python3
"""Patch the exact deployed WEB-23 game; retain all other source and image bytes."""
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = '8aac2f1cb3668011ee300d0b6dee3d684045b50d'
VERSION = 'V575-WEB-24-HORDE-ROLES'


def base(path):
    return subprocess.check_output(['git', 'show', BASE+':'+path], cwd=ROOT)


def write(path, value, compact=False):
    path.write_text(json.dumps(value, ensure_ascii=False, **({'separators': (',', ':')} if compact else {'indent': 2}))+'\n')


def main():
    dist = ROOT/'dist'
    previous = json.loads(base('dist/version.json'))
    report = json.loads(base('dist/verification.json'))
    old_engine = report['movement_field']['engine']
    prior_engine = json.loads((dist/'verification.json').read_text()).get('horde_roles', {}).get('engine')
    original = base('dist/'+old_engine).decode()
    code = original
    changes = []

    def replace(before, after):
        nonlocal code
        assert code.count(before) == 1, 'Unexpected patch anchor: '+before[:100]
        code = code.replace(before, after)
        changes.append((before, after))

    for patch in json.loads((ROOT/'web/horde-role-patches-v591.json').read_text()):
        replace(patch['before'], patch['after'])
    for module, art in [('red-pulse-v579.js', 'red-pulse-art-v579.json'), ('attack-warning-v582.js', None), ('movement-field-v590.js', None)]:
        before = base('web/'+module).decode()
        after = (ROOT/'web'/module).read_text()
        if art:
            payload = json.dumps(json.loads(base('web/'+art)), separators=(',', ':'))
            before = before.replace("JSON.parse('__RED_PULSE_ART__')", payload)
            after = after.replace("JSON.parse('__RED_PULSE_ART__')", payload)
        replace(before, after)
    marker = '\nwindow.EVOLVE_WEB_GUARD='
    replace(marker, '\n'+(ROOT/'web/horde-roles-v591.js').read_text()+marker)
    reverted = code
    for before, after in reversed(changes):
        assert reverted.count(after) == 1
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
    assert html.count('id="homeLevelCapV522">Lv.10') == 1
    html = html.replace('id="homeLevelCapV522">Lv.10', 'id="homeLevelCapV522">No limit')
    (dist/'index.html').write_text(html)
    write(dist/'asset-manifest.json', manifest, True)
    write(dist/'version.json', config | {'assets': len(manifest), 'source_sha256': previous['source_sha256']})

    def refs(value):
        if isinstance(value, dict): return {k: refs(v) for k, v in value.items()}
        if isinstance(value, list): return [refs(v) for v in value]
        return engine if value == old_engine else value

    report = refs(report)
    report.update(version=VERSION, build=build, index_bytes=len(html.encode()), cached_bytes=sum(e['bytes'] for e in manifest))
    report['red_pulse_device'].update(wave_spread_seconds=1.56, wave_life_seconds=2.36)
    report['movement_field']['field_spread_seconds'] = 1.56
    report['horde_roles'] = {'engine': engine, 'baseline_commit': BASE,
        'ordinary_movement_multiplier': .5, 'ordinary_spawn_multiplier': 1.5,
        'existing_population_hard_limit_preserved': True, 'major_encounter_behavior_preserved': True,
        'roles': {'crawler': 'melee', 'brute': 'melee', 'runner': 'charge', 'embermaw': 'charge',
                  'spitter': 'ranged', 'froststalker': 'ranged', 'warden': 'support', 'symbiote': 'support'},
        'ranged_and_support_contact_damage': False, 'charge_damage_requires_burst': True,
        'ordinary_spitter_ground_pools': False, 'ordinary_frost_beam': False, 'ordinary_charge_magma_trails': False,
        'ordinary_attack_warnings': False, 'boss_attack_warnings_preserved': True,
        'stage_level_cap': None, 'xp_overflow_preserved': True, 'field_speed_multiplier': .5,
        'field_spread_seconds': 1.56, 'field_life_seconds': 2.36,
        'field_charge_and_respawn_seconds_unchanged': [3, 60],
        'existing_image_bytes_unchanged': preserved, 'new_image_assets': 0,
        'maps_save_keys_and_player_attacks_unchanged': True, 'physical_Galaxy_S23_plus_tested': False}
    write(dist/'verification.json', report)
    for obsolete in {old_engine, prior_engine}-{None, engine}:
        assert re.fullmatch(r'assets/[a-f0-9]{64}\.js', obsolete)
        (dist/obsolete).unlink(missing_ok=True)
    write(ROOT/'docs/horde-roles-v591-checkpoint.json', {'progress': 50, 'version': VERSION, 'build': build,
        'engine': engine, 'status': 'Packaged; functional verification pending', 'rules': report['horde_roles'],
        'next': 'Verify half-speed movement and field, denser waves, exclusive attack roles, ordinary-warning suppression and leveling beyond 10; automatically upload, deploy and verify Pages.'})
    print(json.dumps(config | {'engine': engine, 'preserved_images': preserved}))


if __name__ == '__main__':
    main()
