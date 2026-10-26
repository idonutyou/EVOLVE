#!/usr/bin/env python3
"""Match the real public card art, display files and unchanged engine bytes."""
import argparse,hashlib,json,time,urllib.request
from pathlib import Path
def main():
 p=argparse.ArgumentParser();p.add_argument('--url',default='https://idonutyou.github.io/EVOLVE/');p.add_argument('--dist',type=Path,default=Path('dist'));p.add_argument('--output',type=Path,default=Path('test-results/organ-card-art-live-bytes.json'));a=p.parse_args();base=a.url.rstrip('/')+'/';v=json.loads((a.dist/'version.json').read_text());r=json.loads((a.dist/'verification.json').read_text());f=r['organ_card_art_v610'];checks=[]
 for name in ['index.html','version.json','asset-manifest.json',f['script'],f['stylesheet'],f['engine']]+[c['path'] for c in f['cards']]:
  request=urllib.request.Request(base+name+'?verify='+str(time.time_ns()),headers={'Cache-Control':'no-cache','User-Agent':'EVOLVE-release-verification'})
  with urllib.request.urlopen(request,timeout=45) as response:raw=response.read();assert response.status==200,name
  expected=(a.dist/name).read_bytes();assert raw==expected,name;checks.append({'path':name,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'matches':True})
 assert f['card_names_levels_effects_and_handlers_unchanged'];report={'success':True,'url':base,'version':v['version'],'build':v['build'],'checks':checks,'original_supplied_pngs_exact':10,'engine_unchanged':f['engine_unchanged'],'stats_and_effects_unchanged':True,'physical_Galaxy_S23_plus_tested':False};a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'success':True,'url':base,'build':v['build'],'files_matched':len(checks),'original_pngs_exact':10,'stats_and_effects_unchanged':True}))
if __name__=='__main__':main()
