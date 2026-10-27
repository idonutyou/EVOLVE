#!/usr/bin/env python3
"""M05 40% immutable feature-branch recovery ZIP; assert original image and payment safety."""
import hashlib,json,subprocess,zipfile
from pathlib import Path
R=Path(__file__).resolve().parents[1]
BASE="e6cb8457986f459c711c5f3af5e5182e72342e45"
N="EVOLVE_M05_040_20261028"
def sha(b):return hashlib.sha256(b).hexdigest()
def main():
 changed=sorted(p for p in subprocess.check_output(['git','diff','--name-only',BASE,'HEAD'],cwd=R,text=True).splitlines() if not p.startswith('checkpoints/') and (R/p).is_file())
 required={'web/m05-shop-ui-v618.js','tools/build_m05_040.py','tests/monetization_m05_040_browser.cjs','docs/monetization/M05_040_IMPL_QA_KO.md','dist/index.html','dist/version.json','dist/verification.json','dist/asset-manifest.json','EVOLVE_PROGRESS.md','EVOLVE_HANDOFF.md','EVOLVE_ROADMAP.md','.github/workflows/m05-040-ui.yml','.github/workflows/m05-040-checkpoint.yml','tools/checkpoint_m05_040.py','tools/verify_m05_040_checkpoint.py'}
 assert required.issubset(changed),('Missing',required-set(changed))
 assert not any(p.startswith(('web/mock-','monetization/catalog/')) for p in changed)
 baseline=json.loads(subprocess.check_output(['git','show',BASE+':dist/asset-manifest.json'],cwd=R))
 current=json.loads((R/'dist/asset-manifest.json').read_text())
 old={x['path']:x for x in baseline};new={x['path']:x for x in current}
 assert len(current)==len(baseline)+1
 assert all(new.get(p)==entry for p,entry in old.items())
 addition=list(set(new)-set(old))
 assert len(addition)==1 and new[addition[0]]['kind']=='dev-mock-only'
 assert addition[0] in changed
 assert sum(x['kind']=='image' for x in current)==1021
 v=json.loads((R/'dist/version.json').read_text())
 assert v['assets']==len(current) and v['version'].endswith('M05-UX40')
 assert 'M05-UX40' in (R/'dist/index.html').read_text()
 assert 'data-m05-dev-only="shop-ux"' in (R/'dist/index.html').read_text()
 entries={p:(R/p).read_bytes() for p in changed}
 info={p:{'bytes':len(b),'sha256':sha(b)} for p,b in entries.items()}
 folder=R/'checkpoints';folder.mkdir(exist_ok=True)
 zpath=folder/(N+'.zip');jpath=folder/(N+'.json')
 assert not zpath.exists() and not jpath.exists(),'Never overwrite saved checkpoint'
 manifest={'stage':'M05','percent':40,'base':BASE,'features':['dev-only shop sections','product details'],'files':info,'real_checkout':False,'image_count':1021}
 with zipfile.ZipFile(zpath,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
  for p,b in entries.items():z.writestr(p,b)
  z.writestr('MANIFEST.json',json.dumps(manifest,ensure_ascii=False))
 with zipfile.ZipFile(zpath) as z:
  assert z.testzip() is None and set(z.namelist())==set(changed)|{'MANIFEST.json'}
  for p,data in info.items():
   b=z.read(p);assert len(b)==data['bytes'] and sha(b)==data['sha256']
 proof={'stage':'M05','percent':40,'step':'2/3','archive':'checkpoints/'+N+'.zip','source_branch':'monetization-m05-ux-20261028','backup_branch':'backup/monetization-m05-040-20261028','base':BASE,'bytes':zpath.stat().st_size,'sha256':sha(zpath.read_bytes()),'file_count':len(info),'files':info,'crc_verified':True,'prior_assets_untouched':True,'image_count':1021,'site_asset_count':len(current),'new_dev_asset':addition[0],'real_checkout':False,'main_untouched':True,'browser_run':40558205928,'next':'M05 50% owned/equipped actions and collection UX'}
 jpath.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({k:v for k,v in proof.items() if k!='files'},ensure_ascii=False))
if __name__=='__main__':main()
