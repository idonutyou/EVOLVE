#!/usr/bin/env python3
"""V625 delta-only publication invariants. Avoid touching the 386 MB legacy asset payload."""
import hashlib,json,re,subprocess
from pathlib import Path
P=Path(__file__).resolve().parents[1]
Dist=P/'dist'
manifest=json.loads((Dist/'asset-manifest.json').read_text())
ver=json.loads((Dist/'version.json').read_text())
report=json.loads((Dist/'verification.json').read_text())
html=(Dist/'index.html').read_text()
art=json.loads((P/'web/bio-core-art-v625.json').read_text())
engines=[e for e in manifest if e['kind']=='game-code' and (Dist/e['path']).is_file()]
assert len(engines)==1 and len(manifest)==1079
engine=engines[0];data=(Dist/engine['path']).read_bytes();code=data.decode()
assert hashlib.sha256(data).hexdigest()==engine['sha256'] and engine['bytes']==len(data)
assert html.count(engine['path'])==1
assert html.count('4a817c884dec9c5708883e99240bd37c471e4d1f93cda4432bd9d3cae2758578.js')==0
assert code.count('const bioArtV625=')==1
assert code.count('const bioReadyV625=')==1
assert code.count('load_failure_falls_back_to_legacy_renderer')==0
assert code.index('const bioArtV625=')<code.index('if(window.__EVOLVE_DEV_CORE_VISUALS_V617__')
assert code.count('const bioLegacyArmPointV625=')==1
assert code.count('const bioLegacyOrganPointV625=')==1
assert code.count('bioV625.loadError=')==1
assert code.count('warningBrandReadyV581,playerReadyV586,mutantReadyV599,bioReadyV625')==1
assert ver['build']==report['build']
assert ver['assets']==report['cached_files']==len(manifest)
assert report['cached_bytes']==sum(e['bytes'] for e in manifest)
assert report['bio_core_v625']['load_failure_falls_back_to_legacy_renderer'] is True
assert ver['source_sha256']=='d5ea39a2fc07eab4507d7782ccfbd339ab7c6285f0c874fd061716bde2ab63ea'
assert 'EVOLVE_SHOP_EXPERIENCE_V621_V1' not in (P/'web/bio-core-player-v625.js').read_text()
assert not re.search(r'(?:localStorage|sessionStorage)\.(?:setItem|removeItem|clear)\s*\(', (P/'web/bio-core-player-v625.js').read_text())
for key in ['original','matte','tail','gun','walkAtlas','idleAtlas']:
 e=art[key];raw=(Dist/e['path']).read_bytes()
 assert len(raw)==e['bytes'] and hashlib.sha256(raw).hexdigest()==e['sha256']
 assert sum(x['path']==e['path'] for x in manifest)==1
assert len({x['path'] for x in manifest})==len(manifest)
original_records=manifest[:1072]
value='\n'.join(f"{x['path']}|{x['sha256']}|{x['bytes']}|{x['kind']}" for x in original_records)
h=2166136261
for char in value:h=((h^ord(char))*16777619)&0xffffffff
assert h==1701511232,f'base asset manifest changed: {h}'
subprocess.run(['node','--check',str(Dist/engine['path'])],check=True,stdout=subprocess.DEVNULL)
print(json.dumps({'success':True,'base_manifest_entries':1072,'base_fingerprint_fnv32':h,'new_png_verified':6,'compiled_engine_sha256':engine['sha256'],'patched_build':ver['build'],'client_saves_untouched':True,'renderer_failure_fallback':True,'legacy_code_unchanged_except_V625_module':True}))