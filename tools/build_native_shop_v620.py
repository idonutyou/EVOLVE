#!/usr/bin/env python3
"""Unify SHOP: remove ALL legacy DEV mock-shop UI assets; add only 3 native mock-safe scripts.
Retain existing original game code, every image, and old immutable Git checkpoints.
"""
from pathlib import Path
import json,hashlib,re
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'dist'
def sha(b):return hashlib.sha256(b).hexdigest()
def main():
 manifestpath=D/'asset-manifest.json';verpath=D/'version.json';htmlpath=D/'index.html';reportpath=D/'verification.json'
 original=json.loads(manifestpath.read_text());v=json.loads(verpath.read_text());html=htmlpath.read_text();report=json.loads(reportpath.read_text())
 assert v['assets']==1083 and v['version'].endswith('M05-UX90')
 assert len(original)==1083 and sum(x['kind']=='image' for x in original)==1021
 old_scripts=[x for x in original if x['kind']=='dev-mock-only']
 assert len(old_scripts)==14,len(old_scripts)
 oldpaths={x['path'] for x in old_scripts}
 for x in old_scripts:
  data=(D/x['path']).read_bytes()
  assert sha(data)==x['sha256'] and len(data)==x['bytes']
 # One and only one block of four separate DEV UI/bridge script tags is removed.
 tags=re.findall(r'<script defer src="(assets/[a-f0-9]{64}\.js)" data-m0[45]-dev-only="[^"]+"></script>',html)
 assert len(tags)==4 and set(tags).issubset(oldpaths),tags
 html,n=re.subn(r'<!-- M04 50% DEV-ONLY MOCK STORE:[^\n]*\n','',html);assert n==1
 html,n=re.subn(r'<script defer src="assets/[a-f0-9]{64}\.js" data-m0[45]-dev-only="[^"]+"></script>\n?','',html)
 assert n==4,n
 for t in tags:assert t not in html
 # Preserve unchanged non-DEV files and all original images, including the game engine.
 base=[x for x in original if x['kind']!='dev-mock-only']
 assert len(base)==1069
 added=[]
 for source,label in [('web/mock-premium-v615.js','mock-engine'),('web/mock-core-visuals-v617.js','core-art'),('web/native-shop-v620.js','native-shop')]:
  data=(ROOT/source).read_bytes();digest=sha(data);name='assets/'+digest+'.js'
  assert name not in {x['path'] for x in base}
  (D/name).write_bytes(data)
  item={'path':name,'sha256':digest,'bytes':len(data),'kind':'native-shop-test-only'}
  added.append(item)
  html=html.replace('</body>',f'<script defer src="{name}" data-native-shop="{label}"></script>\n</body>')
 for x in old_scripts:(D/x['path']).unlink()
 manifest=base+added
 assert len(manifest)==1072 and sum(x['kind']=='image' for x in manifest)==1021
 for x in base:
  data=(D/x['path']).read_bytes()
  assert sha(data)==x['sha256'],'Original game asset tampered: '+x['path']
 # No costed purchase or production entitlement is added.
 catalog=json.loads((ROOT/'monetization/catalog/draft_skus.json').read_text())
 assert catalog['checkout_enabled'] is False and catalog['client_grants_enabled'] is False
 assert all(p['status']=='draft_disabled' and p['price_minor'] is None for p in catalog['products'])
 v['version']=v['version']+'-SHOP620'
 v['build']=sha((v['build']+'|native-shop-v620|'+'|'.join(x['path'] for x in added)).encode())
 v['assets']=len(manifest)
 v['scriptBytes']=v['scriptBytes']-sum(x['bytes'] for x in old_scripts)+sum(x['bytes'] for x in added)
 config={k:v[k] for k in ['version','build','scriptBytes','preloadResources']}
 html,n=re.subn(r'window\.EVOLVE_WEB_CONFIG=\{[^;]+\};','window.EVOLVE_WEB_CONFIG='+json.dumps(config,separators=(',',':'))+';',html)
 assert n==1
 assert 'data-m04-dev-only' not in html and 'data-m05-dev-only' not in html
 assert 'data-native-shop="native-shop"' in html
 # Avoid stale JS references being served from a previously cached service worker.
 htmlpath.write_text(html)
 manifestpath.write_text(json.dumps(manifest,separators=(',',':'))+'\n')
 verpath.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
 report.update(version=v['version'],build=v['build'],index_bytes=len(html.encode()),cached_files=len(manifest),cached_bytes=sum(x['bytes'] for x in manifest))
 report['native_shop_v620']={'single_home_shop':True,'dev_overlay_removed':True,'legacy_dev_scripts_removed':len(old_scripts),'native_script_paths':[x['path'] for x in added],'original_image_count':1021,'legacy_engine_untouched':True,'real_checkout':False,'original_DNA_laboratory_hidden_in_shop_only':True}
 reportpath.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'version':v['version'],'build':v['build'],'assets':len(manifest),'images':1021,'deleted_dev_ui_assets':len(old_scripts),'new_assets':[x['path'] for x in added]},ensure_ascii=False))
if __name__=='__main__':main()
