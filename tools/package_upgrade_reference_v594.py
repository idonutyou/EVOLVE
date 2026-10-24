#!/usr/bin/env python3
"""WEB-27: exact supplied UI texture, unclipped sprites and equipment-only upgrades."""
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = '79ea7d94d753f67fd59b491a40ddecd1041b711e'
VERSION = 'V575-WEB-27-REFERENCE-CARDS'


def base(path):
    return subprocess.check_output(['git', 'show', BASE+':'+path], cwd=ROOT)


def write(path, value, compact=False):
    path.write_text(json.dumps(value, ensure_ascii=False, **({'separators': (',', ':')} if compact else {'indent': 2}))+'\n')


def main():
    dist = ROOT/'dist'
    previous = json.loads(base('dist/version.json'))
    report = json.loads(base('dist/verification.json'))
    old = report['upgrade_cards']
    old_engine = old['engine']
    current = json.loads((dist/'verification.json').read_text()).get('upgrade_reference', {})
    original = base('dist/'+old_engine).decode()
    code = original
    changes = []

    def replace(before, after, count=1):
        nonlocal code
        assert code.count(before) == count, 'Unexpected anchor: '+before[:120]
        code = code.replace(before, after)
        changes.append((before, after, count))

    patches = json.loads((ROOT/'web/monster-clean-patches-v594.json').read_text())
    for patch in patches:
        replace(patch['before'], patch['after'], patch['count'])
    payload = json.dumps(json.loads(base('web/upgrade-art-v593.json')), separators=(',', ':'))
    before = base('web/upgrade-cards-v593.js').decode().replace("JSON.parse('__UPGRADE_ART__')", payload)
    after = (ROOT/'web/upgrade-cards-v593.js').read_text().replace("JSON.parse('__UPGRADE_ART__')", payload)
    replace(before, after)
    reference = json.loads((ROOT/'web/upgrade-reference-v594.json').read_text())
    module = (ROOT/'web/upgrade-reference-v594.js').read_text().replace("JSON.parse('__UPGRADE_REFERENCE__')", json.dumps(reference, separators=(',', ':')))
    marker = '\nwindow.EVOLVE_WEB_GUARD='
    replace(marker, '\n'+module+marker)
    reverted = code
    for before, after, count in reversed(changes):
        assert reverted.count(after) == count
        reverted = reverted.replace(after, before)
    assert reverted == original, 'Unrelated code changed'

    raw = code.encode()
    sha = hashlib.sha256(raw).hexdigest()
    engine = 'assets/'+sha+'.js'
    (dist/engine).write_bytes(raw)
    manifest = json.loads(base('dist/asset-manifest.json'))
    font = json.loads((ROOT/'web/upgrade-font-v594.json').read_text())
    assert hashlib.sha256((dist/font['path']).read_bytes()).hexdigest() == font['sha256']
    license_text = '\n'.join(line.rstrip() for line in (ROOT/'docs/NOTO_SANS_KR_OFL.txt').read_text().splitlines())
    css = ('/*\n'+license_text+'\n*/\n'+(ROOT/'web/upgrade-reference-v594.css').read_text().replace('__UPGRADE_FONT_PATH__', Path(font['path']).name)).encode()
    css_sha = hashlib.sha256(css).hexdigest()
    style = 'assets/'+css_sha+'.css'
    (dist/style).write_bytes(css)
    preserved = 0
    for e in manifest:
        if e['path'] == old_engine:
            e.update(path=engine, sha256=sha, bytes=len(raw))
        elif e['path'] == old['stylesheet']:
            e.update(path=style, sha256=css_sha, bytes=len(css))
        elif e['path'] == old['font']['path']:
            e.update({k: font[k] for k in ['path', 'sha256', 'bytes']})
        elif e['kind'] == 'image':
            data = (dist/e['path']).read_bytes()
            assert len(data) == e['bytes'] and hashlib.sha256(data).hexdigest() == e['sha256'], e['path']
            preserved += 1
    assert preserved == 995
    assert hashlib.sha256((dist/reference['path']).read_bytes()).hexdigest() == reference['sha256']
    manifest.append({k: reference[k] for k in ['path', 'sha256', 'bytes']} | {'kind': 'image'})
    build = hashlib.sha256(previous['build'].encode()+raw+css+font['sha256'].encode()+reference['sha256'].encode()).hexdigest()
    config = {'version': VERSION, 'build': build, 'scriptBytes': previous['scriptBytes']+len(raw)-len(original.encode())}
    html = base('dist/index.html').decode()
    html = re.sub(r'window\.EVOLVE_WEB_CONFIG=\{.*?\};', lambda _: 'window.EVOLVE_WEB_CONFIG='+json.dumps(config)+';', html, count=1)
    before = f'src="{old_engine}" onload="EVOLVE_WEB_CLIENT.loaded({len(original.encode())})"'
    assert html.count(before) == 1
    html = html.replace(before, f'src="{engine}" onload="EVOLVE_WEB_CLIENT.loaded({len(raw)})"')
    assert html.count(old['stylesheet']) == 1
    html = html.replace(old['stylesheet'], style)
    (dist/'index.html').write_text(html)
    write(dist/'asset-manifest.json', manifest, True)
    write(dist/'version.json', config | {'assets': len(manifest), 'source_sha256': previous['source_sha256']})

    def refs(v):
        if isinstance(v, dict): return {k: refs(x) for k, x in v.items()}
        if isinstance(v, list): return [refs(x) for x in v]
        return engine if v == old_engine else v

    report = refs(report)
    report.update(version=VERSION, build=build, index_bytes=len(html.encode()), cached_files=len(manifest), cached_bytes=sum(e['bytes'] for e in manifest))
    report['upgrade_cards'].update(stylesheet=style, font=font, independent_stat_cards=17)
    report['upgrade_reference'] = {'engine': engine, 'baseline_commit': BASE, 'reference': reference,
        'stylesheet': style, 'font': font, 'reference_background_and_frames': True, 'level_visible': True,
        'part_labels': {'gun': '팔', 'blade': '팔', 'legs': '발', 'shell': '외피'},
        'weapon_equipping_cards_removed': True, 'only_current_equipped_weapon_stats': True,
        'generic_existing_body_upgrades_retained': True, 'item_art_alpha_margin': 32, 'item_edge_feather': 18, 'item_source_region_extension': 20,
        'item_art_original_bytes_unchanged': True, 'monster_body_marker_paths_removed': [p['name'] for p in patches],
        'all_monster_types_including_elites_and_bosses': True, 'both_cpu_and_gpu': True,
        'attack_warnings_damage_and_hp_behavior_preserved': True, 'existing_image_bytes_unchanged': preserved,
        'new_image_assets': 1, 'physical_Galaxy_S23_plus_tested': False}
    write(dist/'verification.json', report)
    for obsolete in {old_engine, current.get('engine')}-{None, engine}:
        assert re.fullmatch(r'assets/[a-f0-9]{64}\.js', obsolete)
        (dist/obsolete).unlink(missing_ok=True)
    for obsolete in {old['stylesheet'], current.get('stylesheet')}-{None, style}:
        assert re.fullmatch(r'assets/[a-f0-9]{64}\.css', obsolete)
        (dist/obsolete).unlink(missing_ok=True)
    for obsolete in {old['font']['path'], current.get('font', {}).get('path')}-{None, font['path']}:
        assert re.fullmatch(r'assets/[a-f0-9]{64}\.woff', obsolete)
        (dist/obsolete).unlink(missing_ok=True)
    write(ROOT/'docs/upgrade-reference-v594-checkpoint.json', {'progress': 40, 'version': VERSION, 'build': build,
        'engine': engine, 'status': 'Packaged; functional and pixel/layout verification pending', 'rules': report['upgrade_reference'],
        'next': 'Verify supplied UI resemblance, all rarity art edges, equipment-only pools, unchanged wear after choices, and clean CPU/GPU monster bodies; upload, deploy and verify Pages.'})
    print(json.dumps(config | {'engine': engine, 'preserved_images': preserved, 'reference_bytes': reference['bytes']}))


if __name__ == '__main__':
    main()
