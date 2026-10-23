#!/usr/bin/env python3
"""Restore classic combat and upright facing from the exact deployed WEB-19 tree."""
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = 'f7e554f77e3550dd5e8959b8dc9d79df57ef1405'
VERSION = 'V575-WEB-20-CLASSIC-COMBAT'


def base(path):
    return subprocess.check_output(['git', 'show', BASE + ':' + path], cwd=ROOT)


def write(path, value, compact=False):
    options = {'separators': (',', ':')} if compact else {'indent': 2}
    path.write_text(json.dumps(value, ensure_ascii=False, **options) + '\n')


def main():
    dist = ROOT / 'dist'
    previous = json.loads(base('dist/version.json'))
    report = json.loads(base('dist/verification.json'))
    old_engine = report['player_scorpion']['engine']
    original = base('dist/' + old_engine).decode()
    current_report = json.loads((dist / 'verification.json').read_text())
    prior_engine = current_report.get('player_combat', {}).get('engine', old_engine)
    art = json.loads(base('web/player-scorpion-art-v586.json'))
    expand = lambda source: source.replace("JSON.parse('__PLAYER_SCORPION_ART__')", json.dumps(art, separators=(',', ':')))
    old_module = expand(base('web/player-scorpion-v586.js').decode())
    new_module = expand((ROOT / 'web/player-combat-v587.js').read_text())
    code, changes = original, []

    def patch(before, after):
        nonlocal code
        assert code.count(before) == 1, 'Unexpected source anchor: ' + before[:100]
        code = code.replace(before, after)
        changes.append((before, after))

    patch(old_module, new_module)
    marker = '// Accepted LIGHTNING06 behavior, adapted to the current V575 campaign engine.'
    patch(marker, '// Keep the complete pre-test weapon and damage paths, including boss rules.\n'
          'const classicCombatV587={firePlayer,hurtEnemy,chooseLevelPicks,levelStatHtml,triggerHordeRupture};\n' + marker)
    # The original ARM projectile branch is deferred until real item combat is implemented.
    # Preserve state.arm for the other weapons' existing synergy calculations.
    patch('if(state.arm>0&&player.shoot<=0){', 'if(false&&state.arm>0&&player.shoot<=0){')
    patch("const lightningResetBaseV576=reset;reset=function(...args){selectedStartWeapon='arm';lightningV576.reset();const out=lightningResetBaseV576(...args);state.arm=Math.max(1,state.arm);return out};",
          'const lightningResetBaseV576=reset;reset=function(...args){lightningV576.reset();return lightningResetBaseV576(...args)};')
    patch('const lightningV576=createCampaignLightningV576({\n active:()=>running&&!paused&&!choosing&&!rewardChoosing&&!ended,',
          'const lightningV576=createCampaignLightningV576({\n active:()=>false, // WEB-20: lightning item combat is not available yet.')
    reverted = code
    for before, after in reversed(changes):
        assert reverted.count(after) == 1
        reverted = reverted.replace(after, before)
    assert reverted == original, 'Unrelated engine bytes changed'

    raw = code.encode()
    digest = hashlib.sha256(raw).hexdigest()
    engine = 'assets/' + digest + '.js'
    (dist / engine).write_bytes(raw)
    manifest = json.loads(base('dist/asset-manifest.json'))
    image_count = 0
    for entry in manifest:
        if entry['path'] == old_engine:
            entry.update(path=engine, sha256=digest, bytes=len(raw))
        elif entry['kind'] == 'image':
            content = (dist / entry['path']).read_bytes()
            assert len(content) == entry['bytes'] and hashlib.sha256(content).hexdigest() == entry['sha256'], entry['path']
            image_count += 1
    assert image_count == 987
    build = hashlib.sha256(previous['build'].encode() + raw).hexdigest()
    config = {'version': VERSION, 'build': build, 'scriptBytes': previous['scriptBytes'] + len(raw) - len(original.encode())}
    html = base('dist/index.html').decode()
    html = re.sub(r'window\.EVOLVE_WEB_CONFIG=\{.*?\};', lambda _: 'window.EVOLVE_WEB_CONFIG=' + json.dumps(config) + ';', html, count=1)
    before = f'src="{old_engine}" onload="EVOLVE_WEB_CLIENT.loaded({len(original.encode())})"'
    assert html.count(before) == 1
    html = html.replace(before, f'src="{engine}" onload="EVOLVE_WEB_CLIENT.loaded({len(raw)})"')
    (dist / 'index.html').write_text(html)
    write(dist / 'asset-manifest.json', manifest, True)
    write(dist / 'version.json', config | {'assets': len(manifest), 'source_sha256': previous['source_sha256']})

    def refs(value):
        if isinstance(value, dict):
            return {k: refs(v) for k, v in value.items()}
        if isinstance(value, list):
            return [refs(v) for v in value]
        return engine if value == old_engine else value

    report = refs(report)
    report.update(version=VERSION, build=build, index_bytes=len(html.encode()), image_assets=image_count,
                  cached_files=len(manifest), cached_bytes=sum(e['bytes'] for e in manifest))
    report['player_scorpion']['unarmed_attack'] = 'ARM-selected alternating upper-limb contact stabs; all five original weapon choices restored; saved cosmetic catalog items do not enable future item combat'
    report['player_combat'] = {
        'engine': engine, 'baseline_commit': BASE, 'source': 'web/player-combat-v587.js',
        'facing': 'left is the exact horizontal mirror of right; broad tilt; body upper side remains upright and head remains away from vertical',
        'body_rotation_limit_degrees': 80, 'head_vertical_margin_degrees': 12,
        'lightning_locked': True, 'lightning_button_disabled_and_dimmed': True,
        'lightning_in_skill_choices': False, 'saved_catalog_equipment_enables_lightning': False,
        'restored_start_weapons': ['arm', 'mouth', 'tail', 'wing', 'leg'],
        'original_non_arm_damage_and_progression_restored': True,
        'arm_attack': 'alternating upper-limb contact stabs; no projectile',
        'existing_image_bytes_unchanged': image_count, 'maps_and_bosses_unchanged': True,
        'save_keys_preserved': True, 'physical_Galaxy_S23_plus_tested': False,
    }
    write(dist / 'verification.json', report)
    for obsolete in {old_engine, prior_engine} - {engine}:
        assert re.fullmatch(r'assets/[a-f0-9]{64}\.js', obsolete)
        (dist / obsolete).unlink(missing_ok=True)

    checkpoint = {
        'task': 'Upright mirrored player facing, locked future lightning, restored original weapon choices and bare ARM stabbing',
        'progress': 30, 'status': 'Implementation packaged; browser and combat verification pending',
        'baseline_commit': BASE, 'version': VERSION, 'build': build, 'engine': 'dist/' + engine,
        'constraints': report['player_combat'], 'next': 'Verify all facing directions, classic attacks, skill choices, saved catalog items and existing deployment guards; automatically upload and publish',
    }
    write(ROOT / 'docs/player-combat-v587-checkpoint.json', checkpoint)
    write(ROOT / 'docs/monster-motion-v577-checkpoint.json', checkpoint)
    print(json.dumps(config | {'engine': engine, 'preserved_images': image_count}))


if __name__ == '__main__':
    main()
