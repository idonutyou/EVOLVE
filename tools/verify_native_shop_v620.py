#!/usr/bin/env python3
"""Native SHOP V620 release gate: no legacy DEV UI, exact original game assets, mock-only commerce."""
from pathlib import Path
import hashlib,json,subprocess,re
R=Path(__file__).resolve().parents[1];D=R/'dist'
BASE="4bceade598f3caad3235d0b41e508b1e33c33768"
def sha(b):return hashlib.sha256(b).hexdigest()
def previous(path):return subprocess.check_output(['git','show',BASE+':'+path],cwd=R)
def main():
 old=json.loads(previous('dist/asset-manifest.json'));new=json.loads((D/'asset-manifest.json').read_text())
 o={x['path']:x for x in old};n={x['path']:x for x in new}
 assert len(old)==1083 and len(new)==1072
 original={p:e for p,e in o.items() if e['kind']!='dev-mock-only'}
 dev={p:e for p,e in o.items() if e['kind']=='dev-mock-only'}
 assert len(original)==1069 and len(dev)==14
 assert all(n.get(p)==e for p,e in original.items()),'Original game/weapon/arts manifest changed'
 for p,e in original.items():
  blob=(D/p).read_bytes()
  assert sha(blob)==e['sha256'],'Original art/code byte mismatch: '+p
 assert all(p not in n and not (D/p).exists() for p in dev),'Unused DEV JS assets still present'
 added=set(n)-set(original)
 assert len(added)==3 and all(n[p]['kind']=='native-shop-test-only' for p in added)
 assert sum(x['kind']=='image' for x in new)==1021
 assert sum(x['kind']=='dev-mock-only' for x in new)==0
 assert all(len((D/p).read_bytes())==n[p]['bytes'] and sha((D/p).read_bytes())==n[p]['sha256'] for p in added)
 version=json.loads((D/'version.json').read_text());report=json.loads((D/'verification.json').read_text())
 assert version['version'].endswith('-SHOP620') and version['assets']==1072 and version['build']==report['build']
 assert report['native_shop_v620']['dev_overlay_removed'] and not report['native_shop_v620']['real_checkout']
 html=(D/'index.html').read_text()
 assert html.count('data-native-shop=')==3
 assert 'data-m04-dev-only' not in html and 'data-m05-dev-only' not in html
 assert 'm04MockModalV616' not in html and 'm04MockTriggerV616' not in html
 assert not (R/'web/mock-premium-ui-v616.js').exists() and not (R/'web/m05-shop-ui-v618.js').exists()
 ui=(R/'web/native-shop-v620.js').read_text()
 assert 'homeShopViewV601' in ui and "EVOLVE_DEV_MOCK_STORE_V1" in (R/'web/mock-premium-v615.js').read_text()
 assert 'shop.simulatePurchase' in ui and 'shop.equip' in ui and 'shop.redeemCosmetic' in ui
 assert 'nativeShopLegacyResearchV620' in ui and 'hold.style.display' in ui
 catalog=json.loads((R/'monetization/catalog/draft_skus.json').read_text())
 assert catalog['checkout_enabled'] is False and catalog['client_grants_enabled'] is False
 assert all(x['status']=='draft_disabled' and x['price_minor'] is None for x in catalog['products'])
 assert previous('dist/sw.js')==(D/'sw.js').read_bytes()
 print(json.dumps({'success':True,'page':'existing SHOP tab only','old_dev_scripts_deleted':14,'original_assets_byte_verified':1069,'images_untouched':1021,'new_scripts':3,'assets':1072,'real_checkout':False,'old_DNA_upgrade_dom_preserved_hidden':True},ensure_ascii=False))
if __name__=='__main__':main()
