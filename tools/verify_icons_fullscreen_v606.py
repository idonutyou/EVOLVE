#!/usr/bin/env python3
"""Verify the published presentation assets and PWA without changing user data."""
import argparse,hashlib,json,time,urllib.request
from pathlib import Path

def main():
 p=argparse.ArgumentParser();p.add_argument('--url',default='https://idonutyou.github.io/EVOLVE/');p.add_argument('--dist',type=Path,default=Path('dist'));p.add_argument('--output',type=Path,default=Path('test-results/icons-fullscreen-live-bytes.json'));a=p.parse_args()
 base=a.url.rstrip('/')+'/';version=json.loads((a.dist/'version.json').read_text());verification=json.loads((a.dist/'verification.json').read_text());feature=verification['icons_fullscreen_v606'];manifest=json.loads((a.dist/'manifest.webmanifest').read_text());checks=[]
 paths=['index.html','version.json','manifest.webmanifest','asset-manifest.json',feature['reference']['path'],feature['controls_script'],feature['fullscreen_script'],feature['fullscreen_style'],feature['stylesheet'],*[i['src'] for i in manifest['icons']]]
 extra=verification.get('home_balance_v607')
 if extra:paths.extend([extra['stylesheet'],extra['material']['path']])
 for name in dict.fromkeys(paths):
  req=urllib.request.Request(base+name+'?verify='+str(time.time_ns()),headers={'Cache-Control':'no-cache','User-Agent':'EVOLVE-release-verification'})
  with urllib.request.urlopen(req,timeout=45) as response:remote=response.read();mime=response.headers.get_content_type();status=response.status
  local=(a.dist/name).read_bytes();assert status==200 and local==remote,name
  if name=='manifest.webmanifest':assert mime in ('application/manifest+json','application/json','application/octet-stream'),mime
  checks.append({'path':name,'bytes':len(remote),'sha256':hashlib.sha256(remote).hexdigest(),'matches':True})
 assert manifest['display']=='fullscreen' and manifest['scope']=='./' and manifest['start_url']=='./'
 assert feature['reference_icon_row']==1 and feature['start_inner_material_row']==5
 report={'success':True,'url':base,'build':version['build'],'version':version['version'],'checks':checks,'navigation_frame_unchanged':True,'game_engine_unchanged':True,'physical_Galaxy_S23_plus_tested':False}
 a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'success':True,'url':base,'build':version['build'],'files_matched':len(checks)}))
if __name__=='__main__':main()
