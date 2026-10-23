#!/usr/bin/env python3
"""Apply WEB-26 to the exact current WEB-25 tree and preserve all existing artwork."""
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = '2fa4c431a76737486ed94e11016d605556c98c0a'
VERSION = 'V575-WEB-26-UPGRADE-CARDS'


def base(path):
    return subprocess.check_output(['git', 'show', BASE+':'+path], cwd=ROOT)


def write(path, value, compact=False):
    path.write_text(json.dumps(value, ensure_ascii=False, **({'separators': (',', ':')} if compact else {'indent': 2}))+'\n')


def main():
    dist = ROOT/'dist'
    previous = json.loads(base('dist/version.json'))
    report = json.loads(base('dist/verification.json'))
    old_engine = report['visual_clarity']['engine']
    prior_engine = json.loads((dist/'verification.json').read_text()).get('upgrade_cards', {}).get('engine')
    original = base('dist/'+old_engine).decode()
    code = original
    changes = []

    def replace(before, after, count=1):
        nonlocal code
        assert code.count(before) == count, 'Unexpected patch anchor: '+before[:120]
        code = code.replace(before, after)
        changes.append((before, after, count))

    for patch in json.loads((ROOT/'web/upgrade-card-patches-v593.json').read_text()):
        replace(patch['before'], patch['after'], patch['count'])
    for module, art, placeholder in [('horde-roles-v591.js', None, None), ('player-original-v588.js', 'player-original-art-v588.json', '__PLAYER_ORIGINAL_ART__'), ('arm-items-v589.js', 'arm-items-art-v589.json', '__ARM_ITEMS_ART__')]:
        before = base('web/'+module).decode()
        after = (ROOT/'web'/module).read_text()
        if art:
            payload = json.dumps(json.loads(base('web/'+art)), separators=(',', ':'))
            before = before.replace("JSON.parse('"+placeholder+"')", payload)
            after = after.replace("JSON.parse('"+placeholder+"')", payload)
        replace(before, after)
    art = json.loads((ROOT/'web/upgrade-art-v593.json').read_text())
    module = (ROOT/'web/upgrade-cards-v593.js').read_text().replace("JSON.parse('__UPGRADE_ART__')", json.dumps(art, separators=(',', ':')))
    module += '\n'+(ROOT/'web/monster-catalog-v593.js').read_text()
    marker = '\nwindow.EVOLVE_WEB_GUARD='
    replace(marker, '\n'+module+marker)
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
    assert hashlib.sha256((dist/art['path']).read_bytes()).hexdigest() == art['sha256']
    manifest.append({'path': art['path'], 'sha256': art['sha256'], 'bytes': art['bytes'], 'kind': 'image', 'mime': 'image/png'})
    font = json.loads((ROOT/'web/upgrade-font-v593.json').read_text())
    assert hashlib.sha256((dist/font['path']).read_bytes()).hexdigest() == font['sha256']
    manifest.append({k: font[k] for k in ['path', 'sha256', 'bytes']} | {'kind': 'font'})
    css = (ROOT/'web/upgrade-cards-v593.css').read_text().replace('__UPGRADE_FONT_PATH__', Path(font['path']).name).encode()
    css_sha = hashlib.sha256(css).hexdigest()
    css_path = 'assets/'+css_sha+'.css'
    (dist/css_path).write_bytes(css)
    manifest.append({'path': css_path, 'sha256': css_sha, 'bytes': len(css), 'kind': 'style', 'mime': 'text/css'})
    build = hashlib.sha256(previous['build'].encode()+raw+css+art['sha256'].encode()).hexdigest()
    config = {'version': VERSION, 'build': build, 'scriptBytes': previous['scriptBytes']+len(raw)-len(original.encode())}
    html = base('dist/index.html').decode()
    html = re.sub(r'window\.EVOLVE_WEB_CONFIG=\{.*?\};', lambda _: 'window.EVOLVE_WEB_CONFIG='+json.dumps(config)+';', html, count=1)
    before = f'src="{old_engine}" onload="EVOLVE_WEB_CLIENT.loaded({len(original.encode())})"'
    assert html.count(before) == 1
    html = html.replace(before, f'src="{engine}" onload="EVOLVE_WEB_CLIENT.loaded({len(raw)})"')
    html = html.replace('</head>', '<link rel="stylesheet" href="'+css_path+'">\n</head>', 1)
    html = html.replace('CHOOSE 1 · MAX LEVEL 10', 'CHOOSE 1 UPGRADE')
    (dist/'index.html').write_text(html)
    write(dist/'asset-manifest.json', manifest, True)
    write(dist/'version.json', config | {'assets': len(manifest), 'source_sha256': previous['source_sha256']})

    def refs(value):
        if isinstance(value, dict): return {k: refs(v) for k, v in value.items()}
        if isinstance(value, list): return [refs(v) for v in value]
        return engine if value == old_engine else value

    report = refs(report)
    report.update(version=VERSION, build=build, index_bytes=len(html.encode()), cached_files=len(manifest), cached_bytes=sum(e['bytes'] for e in manifest))
    report['horde_roles']['ordinary_spawn_multiplier'] = 1.95
    report['horde_roles']['additional_web26_population_multiplier'] = 1.3
    report['upgrade_cards'] = {'engine': engine, 'baseline_commit': BASE, 'stylesheet': css_path,
        'independent_stat_cards': 19, 'choices_per_level': 3, 'max_effects_per_card': 2,
        'rarity_probabilities': [.60, .27, .10, .027, .003], 'rarity_increment_multipliers': [1, 1.5, 2, 3, 5],
        'count_increments': [1, 2, 3, 4, 5], 'experience_per_level': 12, 'level_cap': None,
        'additional_ordinary_quantity_multiplier': 1.3, 'old_movement_and_attack_roles_preserved': True,
        'rarity_art': art, 'font': font, 'art_reference_tier': 'rare', 'monster_catalog': True,
        'upgrades_reset_each_run': True, 'home_equipment_and_save_keys_preserved': True,
        'existing_image_bytes_unchanged': preserved, 'new_image_assets': 1,
        'physical_Galaxy_S23_plus_tested': False}
    write(dist/'verification.json', report)
    for obsolete in {old_engine, prior_engine}-{None, engine}:
        assert re.fullmatch(r'assets/[a-f0-9]{64}\.js', obsolete)
        (dist/obsolete).unlink(missing_ok=True)
    # Repeated packaging does not retain intermediate stylesheets.
    tracked_css = subprocess.check_output(['git', 'ls-files', 'dist/assets/*.css'], cwd=ROOT, text=True).splitlines()
    for path in (dist/'assets').glob('*.css'):
        if path != dist/css_path and str(path.relative_to(ROOT)) not in tracked_css:
            path.unlink()
    write(ROOT/'docs/upgrade-cards-v593-checkpoint.json', {'progress': 50, 'version': VERSION, 'build': build,
        'engine': engine, 'status': 'Packaged; functional and visual verification pending', 'rules': report['upgrade_cards'],
        'next': 'Verify every card, real projectiles, melee, body size, regeneration, constant XP at high levels and guarded monster summons; automatically upload, deploy and verify Pages.'})
    print(json.dumps(config | {'engine': engine, 'preserved_images': preserved, 'new_art_bytes': art['bytes']}))


if __name__ == '__main__':
    main()
