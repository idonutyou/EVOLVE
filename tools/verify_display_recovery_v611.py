#!/usr/bin/env python3
"""Match actual public recovery code, normalized art and blue frame bytes."""
import argparse,hashlib,json,time,urllib.request
from pathlib import Path
def main():
 p=argparse.ArgumentParser();p.add_argument('--url',default='https://idonutyou.github.io/EVOLVE/');p.add_argument('--dist',type=Path,default=Path('dist'));p.add_argument('--output',type=Path,default=Path('test-results/display-recovery-live-bytes.json'));a=p.parse_args();base=a.url.rstrip('/')+'/';v=json.loads((a.dist/'version.json').read_text());r=json.loads((a.dist/'verification.json').read_text());f=r['display_recovery_v611'];paths=['index.html','version.json','asset-manifest.json',f['engine'],f['script'],f['stylesheet'],r['organ_card_art_v610']['script'],r['organ_card_art_v610']['stylesheet'],r['upgrade_scenery_v608']['script']];checks=[]
 for name in paths:
  req=urllib.request.Request(base+name+'?verify='+str(time.time_ns()),headers={'Cache-Control':'no-cache','User-Agent':'EVOLVE-release-verification'})
  with urllib.request.urlopen(req,timeout=45) as response:raw=response.read();assert response.status==200,name
  assert raw==(a.dist/name).read_bytes(),name;checks.append({'path':name,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'matches':True})
 assert f['gameplay_and_stats_unchanged'] and f['engine_changes_rendering_only'];report={'success':True,'url':base,'version':v['version'],'build':v['build'],'checks':checks,'stats_and_effects_unchanged':True,'engine_change':'Rendering recovery and fixed combat viewport only','physical_Galaxy_S23_plus_tested':False};a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'success':True,'url':base,'build':v['build'],'files_matched':len(checks)}))
if __name__=='__main__':main()
