#!/usr/bin/env python3
"""Verify only the changed WEB-23 entry, engine, manifest and version on Pages."""
import argparse
import hashlib
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--url', required=True)
    p.add_argument('--dist', type=Path, default=Path('dist'))
    p.add_argument('--output', type=Path, default=Path('test-results/web23-live.json'))
    args = p.parse_args()
    expected = json.loads((args.dist/'version.json').read_text())
    verification = json.loads((args.dist/'verification.json').read_text())
    root = args.url.rstrip('/')+'/'
    query = '?evolveVerify='+expected['build'][:20]

    def fetch(path):
        request = urllib.request.Request(urllib.parse.urljoin(root, path)+query, headers={'Cache-Control': 'no-cache', 'User-Agent': 'EVOLVE-Pages-Verification'})
        with urllib.request.urlopen(request, timeout=30) as response:
            return response.read()

    for attempt in range(12):
        live = json.loads(fetch('version.json'))
        if live == expected: break
        if attempt == 11: raise AssertionError('Expected Pages build is not published')
        time.sleep(5)
    manifest = fetch('asset-manifest.json')
    assert manifest == (args.dist/'asset-manifest.json').read_bytes(), 'Live manifest differs'
    engine = verification['movement_field']['engine']
    code = fetch(engine)
    digest = hashlib.sha256(code).hexdigest()
    assert digest == Path(engine).stem, 'Live engine differs'
    html = fetch('index.html').decode()
    assert engine in html and expected['build'] in html, 'Live entry points to an older engine'
    assert b'window.__EVOLVE_MOVEMENT_FIELD_V590__' in code
    assert b'playerMovementStepV590(dt,player.x-m.x,player.y-m.y,m.moving)' in code
    assert b'playerFacingStateV590.move(player.x-x,player.y-y)' in code
    assert b'cooldown=60;metrics.detonations++' in code
    assert b'life:2.36,spread:1.56' in code
    assert b'window.__EVOLVE_HORDE_ROLES_V591__' in code
    assert b'const STAGE_LEVEL_CAP_V521=Infinity;' in code
    assert b'enemyContactAllowedV591(e)&&(e.contactCd' in code
    assert b'window.__EVOLVE_VISUAL_CLARITY_V592__' in code
    assert b'markEnemyHitV592(e,dmg);' in code
    assert b'drawAttackWarningsV582();drawEnemyHealthBarsV592();' in code
    assert b'window.__EVOLVE_UPGRADE_CARDS_V593__' in code
    assert b'function xpNeedForLevel(lv){return 12;}' in code
    assert b'window.__EVOLVE_MONSTER_CATALOG_V593__' in code
    upgrade = verification.get('upgrade_cards')
    if upgrade:
        for path in [upgrade['stylesheet'], upgrade['rarity_art']['path']]:
            data = fetch(path)
            assert hashlib.sha256(data).hexdigest() == Path(path).stem, 'Live upgrade asset differs: '+path
    result = {'success': True, 'url': root, 'version': expected['version'], 'build': expected['build'],
              'version_matches': True, 'manifest_matches': True, 'engine_matches': True,
              'entry_matches': True, 'engine': engine, 'engine_sha256': digest,
              'movement_field': verification['movement_field'], 'horde_roles': verification['horde_roles'],
              'visual_clarity': verification['visual_clarity'], 'upgrade_cards': upgrade,
              'physical_Galaxy_S23_plus_tested': False}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    main()
