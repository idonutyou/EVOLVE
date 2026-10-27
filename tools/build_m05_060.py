#!/usr/bin/env python3
"""EVOLVE M05 60%: content-hashed replacement of opt-in UI without modifying original assets."""
from pathlib import Path
import hashlib,json,re
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'dist'
def sha(b):return hashlib.sha256(b).hexdigest()
def main():
 source=(ROOT/'web/m05-shop-ui-v618.js').read_bytes()
 newasset='assets/'+sha(source)+'.js'
 index_path=D/'index.html';html=index_path.read_text()
 manifest_file=D/'asset-manifest.json';entries=json.loads(manifest_file.read_text())
 version_file=D/'version.json';version=json.loads(version_file.read_text())
 proof_file=D/'verification.json';proof=json.loads(proof_file.read_text())
 assert version['version'].endswith('M05-UX50') and version['assets']==1080
 assert len(entries)==1080 and sum(x['kind']=='image' for x in entries)==1021
 oldasset=proof['m05_ux_050']['new_asset']
 oldrecord=next(x for x in entries if x['path']==oldasset)
 assert sha((D/oldasset).read_bytes())==oldrecord['sha256']
 assert not any(x['path']==newasset for x in entries)
 before='<script defer src="'+oldasset+'" data-m05-dev-only="shop-ux"></script>'
 after='<script defer src="'+newasset+'" data-m05-dev-only="shop-ux"></script>'
 assert html.count(before)==1
 html=html.replace(before,after)
 oldconfig=re.search(r'window\.EVOLVE_WEB_CONFIG=\{[^;]+\};',html)
 assert oldconfig
 version['version']=version['version'].replace('M05-UX50','M05-UX60')
 version['build']=sha((version['build']+'|'+newasset+'|M05_060').encode())
 version['assets']=1081
 version['scriptBytes']+=len(source)-oldrecord['bytes']
 config={k:version[k] for k in ['version','build','scriptBytes','preloadResources']}
 html=html[:oldconfig.start()]+'window.EVOLVE_WEB_CONFIG='+json.dumps(config,separators=(',',':'))+';'+html[oldconfig.end():]
 entries.append({'path':newasset,'sha256':sha(source),'bytes':len(source),'kind':'dev-mock-only'})
 proof.update(version=version['version'],build=version['build'],index_bytes=len(html.encode()),cached_files=len(entries),cached_bytes=sum(x['bytes'] for x in entries))
 proof['m05_ux_060']={'percent':60,'dev_only':True,'requires_query':['evolveMockShop=1','evolveM05UX=1'],'new_asset':newasset,'previous_asset':oldasset,'new_asset_sha256':sha(source),'images':1021,'existing_game_engine_modified':False,'M04_engine_modified':False,'real_checkout':False,'main_deployed':False}
 (D/newasset).write_bytes(source)
 index_path.write_text(html)
 manifest_file.write_text(json.dumps(entries,separators=(',',':'))+'\n')
 version_file.write_text(json.dumps(version,ensure_ascii=False,indent=2)+'\n')
 proof_file.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'stage':'M05','percent':60,'asset':newasset,'bytes':len(source),'version':version['version'],'assets':len(entries),'images':1021,'build':version['build']}))
if __name__=='__main__':main()
