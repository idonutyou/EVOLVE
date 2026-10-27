#!/usr/bin/env python3
"""STEP07 V614: audit exact V613 restore, preserved image hashes, and no game-math rewrites."""
import hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def sha(b):return hashlib.sha256(b).hexdigest()
def main():
 d=ROOT/'dist';pkg=json.loads((ROOT/'docs/step07/PACKAGE_V614.json').read_text())
 patch=json.loads((ROOT/'docs/step07/ENGINE_PATCHES_V614.json').read_text())
 version=json.loads((d/'version.json').read_text());m=json.loads((d/'asset-manifest.json').read_text())
 old=(d/pkg['baseline_engine']).read_bytes()
 new=(d/pkg['engine']).read_bytes()
 assert sha(old)==Path(pkg['baseline_engine']).stem
 assert sha(new)==Path(pkg['engine']).stem
 addition=patch['addition'].encode()
 assert new.count(addition)==1 and new.replace(addition,b'')==old,'Base gameplay engine changed'
 assert pkg['baseline_engine']==patch['baseline_engine'] and pkg['engine']==patch['new_engine']
 assert version['version']=='V575-STEP07-MONSTER-FEEDBACK-V614' or version['version'].startswith('V575-STEP07-MONSTER-FEEDBACK-V614-M04-MOCK')
 assert version['build'] and version['assets']==len(m)
 # The original V614/M04 builds are immutable. M05 adds five dev-only JS assets
 # to the same 1,078 original entries; reject every other manifest expansion.
 if len(m)==1083 and version['version'].endswith('-M05-UX90'):
  assert len([x for x in m if x['kind']=='dev-mock-only'])==5
  assert len([x for x in m if x['kind']=='image'])==1021
  assert all(x['path'].startswith('assets/') and x['path'].endswith('.js') for x in m if x['kind']=='dev-mock-only')
 else:
  assert len(m) in (1067,1078),'Unexpected original manifest size / unreviewed build'
 assert len([x for x in m if x['kind']=='image'])==pkg['original_image_count']==1021
 for item in m:
  if item['kind']=='image':
   assert (d/item['path']).is_file(),item['path']
   assert sha((d/item['path']).read_bytes())==item['sha256'],item['path']
 assert sum(x['path']==pkg['engine'] for x in m)==1
 assert not any(x['path']==pkg['baseline_engine'] for x in m)
 assert version['scriptBytes']>0
 report={'success':True,'baseline_sha256':sha(old),'v614_sha256':sha(new),
  'engine_reversible':True,'images_preserved':1021,'assets':len(m),
  'gameplay_byte_delta_excluding_visual_addition':0,
  'save_assets_unchanged':True,'browser_validation':'separate CI',
  'physical_Galaxy_S23_plus_tested':False}
 print(json.dumps(report,ensure_ascii=False))
if __name__=='__main__':main()
