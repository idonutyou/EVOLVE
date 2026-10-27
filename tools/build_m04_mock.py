#!/usr/bin/env python3
"""Incrementally package the opt-in M04 shop. Never rebuild/re-encode images."""
import argparse, hashlib, json, re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
BASE='assets/e343fb68db8ad1e2fb09bad6c28f3d95eff1c5ef232438670453adb56cfba64a.js'
def build(percent):
    dist=ROOT/'dist'
    manifest=json.loads((dist/'asset-manifest.json').read_text())
    html=(dist/'index.html').read_text()
    report=json.loads((dist/'verification.json').read_text())
    version=json.loads((dist/'version.json').read_text())
    entries=[]
    def asset(data,kind):
        digest=hashlib.sha256(data).hexdigest();name=f'assets/{digest}.js'
        (dist/name).write_bytes(data)
        entry=dict(path=name,sha256=digest,bytes=len(data),kind=kind)
        if not any(e['path']==name for e in manifest):manifest.append(entry)
        entries.append(entry);return name
    source=(dist/BASE).read_bytes()
    if hashlib.sha256(source).hexdigest()!=Path(BASE).stem:raise ValueError('Baseline hash mismatch')
    adapter=(ROOT/'web/mock-core-adapter-v617.js').read_text()
    marker='/* STEP07_V614_END */'
    if source.count(marker.encode())!=1:raise ValueError('Expected one engine insertion point')
    addition='\n/* M04_CORE_V617_BEGIN */\n'+adapter+'/* M04_CORE_V617_END */\n'
    engine=source.replace(marker.encode(),(marker+addition).encode())
    if engine.replace(addition.encode(),b'',1)!=source:raise ValueError('Engine does not restore exactly')
    engine_path=asset(engine,'game-code')
    for path in re.findall(r'data-evolve-src="(assets/[a-f0-9]{64}\.js)"',html):
        if path==BASE or path==report.get('m04_mock_content',{}).get('engine'):html=html.replace(path,engine_path)
    sources=['web/mock-premium-v615.js','web/mock-core-visuals-v617.js','web/mock-premium-ui-v616.js']
    paths=[asset((ROOT/p).read_bytes(),'dev-mock-only') for p in sources]
    html=re.sub(r'<script defer src="assets/[a-f0-9]{64}\.js" data-m04-dev-only="[^"]+"></script>\n?','',html)
    scripts='\n'.join(f'<script defer src="{p}" data-m04-dev-only="{k}"></script>' for p,k in zip(paths,['engine','visuals','ui']))
    html=html.replace('</body>',scripts+'\n</body>')
    build_hash=hashlib.sha256(''.join([engine_path,*paths]).encode()).hexdigest()
    label=f'V575-STEP07-MONSTER-FEEDBACK-V614-M04-MOCK{percent}'
    version.update(version=label,build=build_hash,assets=len(manifest))
    version['scriptBytes']=sum(e['bytes'] for e in manifest if e['path'].endswith('.js') and e['kind']!='web-shell')
    config={k:version[k] for k in ['version','build','scriptBytes','preloadResources']}
    html=re.sub(r'window\.EVOLVE_WEB_CONFIG=\{[^;]+\};',lambda _: 'window.EVOLVE_WEB_CONFIG='+json.dumps(config,separators=(',',':'))+';',html)
    (dist/'index.html').write_text(html)
    report.update(version=label,build=build_hash,index_bytes=len(html.encode()),cached_files=len(manifest),cached_bytes=sum(e['bytes'] for e in manifest))
    report['m04_mock_content']=dict(percent=percent,engine=engine_path,baseline_engine=BASE,engine_restores_exactly=True,asset_paths=paths,new_images=0,source_art_unchanged=True,cosmetic_stats_unchanged=True,theme_count=2,test_crystal_redemption=120,query='evolveMockShop=1',published=False,physical_device_tested=False)
    for name,obj in [('version.json',version),('verification.json',report)]:
        (dist/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
    (dist/'asset-manifest.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n')
    design_path=ROOT/'monetization/m04/mock-premium-shop.design.json';design=json.loads(design_path.read_text())
    design.update(runtime_asset_paths=paths,core_visual_source='web/mock-core-visuals-v617.js',core_adapter_source='web/mock-core-adapter-v617.js',cosmetic_overlay_connected=True,real_cosmetic_art_connected=False,integration_next='M04_070_RESTORE_CANCEL_AND_FAILURE_QA' if percent==60 else 'M04_080_REGRESSION_AND_DEPLOYMENT_GATE')
    design['test_grants']['appearance_unlock_01']['visualReady']=True
    for item in design['product_drafts']:
        if item['sku']=='appearance_unlock_01':item['dev_status']='TWO_RENDERED_CORE_OVERLAYS_DEV_ONLY'
    design['cosmetic_value']={'art_mode':'EXISTING_PLAYER_WITH_CACHED_LIGHT_OVERLAY','themes':['dev_core_theme_01','dev_core_theme_02'],'test_crystal_spend':120,'combat_stats_changed':False,'new_raster_art':False}
    design_path.write_text(json.dumps(design,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(dict(percent=percent,engine=engine_path,entries=entries,images_unchanged=True)))
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--percent',type=int,choices=[60,70],required=True);build(p.parse_args().percent)
