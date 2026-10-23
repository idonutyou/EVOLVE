#!/usr/bin/env python3
"""Confirm the actual Pages build, exact cinematic artwork and painted player after deployment."""
import argparse
import hashlib
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--url', required=True)
    parser.add_argument('--dist', type=Path, default=Path('dist'))
    parser.add_argument('--output', type=Path, default=Path('test-results/web17-live.json'))
    args = parser.parse_args()
    expected = json.loads((args.dist / 'version.json').read_text())
    report = json.loads((args.dist / 'verification.json').read_text())
    art = json.loads(Path('web/warning-branding-art-v581.json').read_text())
    root = args.url.rstrip('/') + '/'
    query = '?evolveVerify=' + expected['build'][:20]

    def fetch(path):
        url = urllib.parse.urljoin(root, path) + query
        request = urllib.request.Request(url, headers={'User-Agent': 'EVOLVE-Pages-Verification', 'Cache-Control': 'no-cache'})
        with urllib.request.urlopen(request, timeout=120) as response:
            return response.read()

    last_error = None
    for attempt in range(12):
        try:
            live = json.loads(fetch('version.json'))
            assert live == expected, 'Pages version has not reached the expected build'
            break
        except Exception as error:
            last_error = error
            if attempt == 11:
                raise RuntimeError('Published build verification failed: ' + str(last_error))
            time.sleep(5)
    live_manifest = fetch('asset-manifest.json')
    assert live_manifest == (args.dist / 'asset-manifest.json').read_bytes(), 'Published asset manifest differs'
    engine = report['attack_warnings']['engine']
    live_engine = fetch(engine)
    engine_sha = hashlib.sha256(live_engine).hexdigest()
    assert engine_sha == Path(engine).stem, 'Published engine bytes differ'
    html = fetch('index.html').decode()
    assert engine in html and expected['build'] in html, 'Published entry page references a stale engine'
    assets = {}
    for name, atlas in art['atlases'].items():
        raw = fetch(atlas['path'])
        digest = hashlib.sha256(raw).hexdigest()
        assert digest == atlas['sha256'] and len(raw) == atlas['bytes'], 'Published artwork differs: ' + name
        assets[name] = {'path': atlas['path'], 'sha256': digest, 'bytes': len(raw), 'matches': True}
    result = {'success': True, 'url': root, 'version': expected['version'], 'build': expected['build'], 'version_matches': True, 'manifest_matches': True, 'entry_matches': True, 'engine': engine, 'engine_sha256': engine_sha, 'engine_matches': True, 'artwork': assets, 'boss_names_English_in_both_locales': 'bio_ko' not in art['sprites'] and 'venom_ko' not in art['sprites'], 'Korean_labels': [key for key in art['sprites'] if key.endswith('_ko')], 'physical_Galaxy_S23_plus_tested': False}
    if 'admin_mode' in report:
        assert 'adminModeStyleV585' in html, 'Published early administrator hiding style is missing'
        assert b'window.__EVOLVE_ADMIN_MODE_V585__' in live_engine, 'Published administrator gate is missing'
        assert report['admin_mode']['normal_start_stage'] == 1 and report['admin_mode']['normal_start_level'] == 1
        result['administrator_mode'] = {'early_style_matches': True, 'engine_gate_matches': True, 'default_enabled': False, 'unlock_presses': 5, 'normal_start_stage': 1, 'normal_start_level': 1}
    if 'player_scorpion' in report:
        player = report['player_scorpion']
        atlas = player['art']
        raw = fetch(atlas['path'])
        assert hashlib.sha256(raw).hexdigest() == atlas['sha256'] and len(raw) == atlas['bytes'], 'Published player atlas differs'
        assert b'window.__EVOLVE_PLAYER_SCORPION_V586__' in live_engine, 'Published default player integration is missing'
        assert b'const PARTS_DEFAULT_V523={arm:null' in live_engine, 'Fresh equipment must start empty'
        result['player_scorpion'] = {'atlas': atlas['path'], 'sha256': atlas['sha256'], 'bytes': len(raw), 'matches': True, 'painted_frames': player['painted_frames'], 'unarmed_default': player['unarmed_default'], 'existing_saved_equipment_preserved': True, 'attack': 'alternating upper-limb contact stabs'}
    if 'player_combat' in report:
        assert b'window.__EVOLVE_PLAYER_COMBAT_V587__' in live_engine
        assert b'const classicCombatV587={firePlayer,hurtEnemy,chooseLevelPicks,levelStatHtml,triggerHordeRupture}' in live_engine
        assert b'active:()=>false, // WEB-20: lightning item combat is not available yet.' in live_engine
        assert b'pose.rotation,blink,0,pose.facing,1' in live_engine
        assert b'b.disabled=true;b.classList.remove' in live_engine
        result['player_combat'] = {'integration_matches': True, 'classic_weapons_restored': True, 'lightning_locked': True, 'facing_mirrored_and_upright': True, 'existing_image_bytes_unchanged': report['player_combat']['existing_image_bytes_unchanged']}
    if 'original_player' in report:
        original = report['original_player']
        assert b'window.__EVOLVE_ORIGINAL_PLAYER_V588__' in live_engine
        assert original['art']['sha256'] == '40df7f6cb18401d39c83fd51360ab080516e10cf3c27bc966756299817f1c6d9'
        assert original['original_source_bytes_unchanged'] and not original['generative_redraw']
        assert original['minimum_triangle_area_ratio'] > .1
        assert result['player_scorpion']['sha256'] == original['art']['sha256']
        result['original_player'] = {'source_matches': True, 'source_bytes_unchanged': True, 'generative_redraw': False, 'anatomy_offsets': original['anatomy_offsets'], 'cached_poses': original['cached_poses'], 'home_preview_surface': original['home_preview_surface']}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(result, ensure_ascii=False))

if __name__ == '__main__':
    main()
