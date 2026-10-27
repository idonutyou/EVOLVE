#!/usr/bin/env python3
"""Durable immutable full-tree native SHOP V620 recovery + SHA256/CRC incremental change ZIP with deletion manifest."""
import hashlib,json,subprocess,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE="4bceade598f3caad3235d0b41e508b1e33c33768"
NAME="EVOLVE_NATIVE_SHOP_V620_20261028"
def sha(x):return hashlib.sha256(x).hexdigest()
def main():
 lines=subprocess.check_output(["git","diff","--no-renames","--name-status",BASE,"HEAD"],cwd=ROOT,text=True).splitlines()
 deleted=sorted(line.split('\t',1)[1] for line in lines if line.startswith('D\t'))
 changed=sorted(line.split('\t',1)[1] for line in lines if not line.startswith('D\t') and '\t' in line and not line.split('\t',1)[1].startswith('checkpoints/'))
 assert len([x for x in deleted if x.startswith('dist/assets/')])==14,deleted # Git rename detection disabled so replaced hash assets become deletes plus additions
 assert "web/mock-premium-ui-v616.js" in deleted and "web/m05-shop-ui-v618.js" in deleted
 assert ".github/workflows/m05-100-live-final.yml" in deleted
 assert ".github/workflows/m05-100-checkpoint.yml" in deleted
 required={'web/native-shop-v620.js','web/mock-premium-v615.js','web/mock-core-visuals-v617.js','tools/build_native_shop_v620.py','tests/native_shop_v620_browser.cjs','tools/verify_native_shop_v620.py','.github/workflows/deploy-pages.yml','dist/index.html','dist/version.json','dist/verification.json','dist/asset-manifest.json','docs/monetization/NATIVE_SHOP_V620_MIGRATION_KO.md','EVOLVE_PROGRESS.md','EVOLVE_HANDOFF.md','EVOLVE_ROADMAP.md','tools/checkpoint_native_shop_v620.py','tools/verify_native_shop_v620_checkpoint.py'}
 assert required.issubset(changed),('missing',required-set(changed))
 assert not any(x.startswith('dist/assets/') and not x.endswith('.js') for x in deleted)
 for p in changed:assert (ROOT/p).is_file(),p
 original=json.loads(subprocess.check_output(['git','show',BASE+':dist/asset-manifest.json'],cwd=ROOT))
 after=json.loads((ROOT/'dist/asset-manifest.json').read_text())
 assert len(original)==1083 and len(after)==1072
 assert sum(x['kind']=='image' for x in after)==1021
 assert len([x for x in after if x['kind']=='native-shop-test-only'])==3
 catalog=json.loads((ROOT/'monetization/catalog/draft_skus.json').read_text())
 assert not catalog['checkout_enabled'] and not catalog['client_grants_enabled']
 payload={p:(ROOT/p).read_bytes() for p in changed}
 files={p:{'bytes':len(b),'sha256':sha(b)} for p,b in payload.items()}
 internal={'stage':'NATIVE_SHOP_V620','base':BASE,'files':files,'deleted_files':deleted,'real_billing':False,'images_preserved':1021}
 folder=ROOT/'checkpoints';folder.mkdir(exist_ok=True)
 zfile=folder/(NAME+'.zip');mfile=folder/(NAME+'.json')
 if zfile.exists() or mfile.exists():raise RuntimeError('Refusing overwrite of V620 checkpoint')
 with zipfile.ZipFile(zfile,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
  for p,b in payload.items():z.writestr(p,b)
  z.writestr('CHECKPOINT_MANIFEST.json',json.dumps(internal,ensure_ascii=False,sort_keys=True))
 with zipfile.ZipFile(zfile) as z:
  assert z.testzip() is None
  assert set(z.namelist())==set(files)|{'CHECKPOINT_MANIFEST.json'}
  for p,v in files.items():
   b=z.read(p);assert len(b)==v['bytes'] and sha(b)==v['sha256']
 v=json.loads((ROOT/'dist/version.json').read_text())
 meta={'stage':'NATIVE_SHOP_V620','date':'2026-10-28','base_commit':BASE,'source_branch':'feature/native-shop-unification-20261028','backup_branch':'backup/native-shop-v620-20261028','archive':'checkpoints/'+NAME+'.zip','archive_mode':'incremental over M05 100%; listed deletions must be applied; backup Git ref is full tree','bytes':zfile.stat().st_size,'sha256':sha(zfile.read_bytes()),'file_count':len(files),'files':files,'deleted_paths':deleted,'deleted_count':len(deleted),'sha256_crc_verified':True,'original_image_count':1021,'site_asset_count':1072,'legacy_dev_assets_removed':14,'native_shop_scripts':3,'real_checkout_enabled':False,'browser_test_run':40588368786,'build':v['build']}
 mfile.write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({k:v for k,v in meta.items() if k not in ('files','deleted_paths')},ensure_ascii=False))
if __name__=='__main__':main()
