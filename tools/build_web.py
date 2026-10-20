#!/usr/bin/env python3
"""Lossless V575 web packaging. Original art and game save/combat code stay intact."""
import argparse,base64,hashlib,json,re,sys
from pathlib import Path
from split_embedded_assets import convert,sha256_file,MAX_GIT_BLOB

ROOT=Path(__file__).resolve().parents[1]
GUARD="\nwindow.EVOLVE_WEB_GUARD={atHome:()=>!running&&!document.getElementById('app').classList.contains('combat'),persist:()=>{saveMeta();savePartsV523();}};\n"
SHELL='''
<style>
#webLoader{position:fixed;inset:0;z-index:2147483640;display:grid;place-content:center;gap:18px;background:#05070a;color:#e1f3f0;text-align:center;font:15px system-ui,sans-serif;padding:24px}#webLoader b{font-size:36px;letter-spacing:.18em;color:#84cba7}#webLoader small{color:#9aa9a4;line-height:1.6}#webRetry,#webApply{font:inherit;color:#d9ffeb;background:#153428;border:1px solid #4b7f65;border-radius:8px;padding:10px 14px}#webUpdate{position:fixed;z-index:2147483639;top:max(12px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);width:min(94vw,510px);padding:12px;display:flex;align-items:center;gap:12px;color:#e1f5e8;background:#102219f2;border:1px solid #50775a;border-radius:10px;font:12px system-ui,sans-serif}#webUpdate[hidden],#webRetry[hidden]{display:none}#webUpdateText{flex:1;line-height:1.5}
</style>
<div id="webLoader" role="status" aria-live="polite"><b>EVOLVE</b><span id="webStatus">실행 준비 0%</span><small>첫 접속에는 원본 파일을 불러와.<br>다음 접속부터 저장된 파일을 재사용해.</small><button id="webRetry" type="button" hidden>다시 열기</button></div>
<div id="webUpdate" hidden><span id="webUpdateText">새 버전이 준비됐어. 저장을 유지하고 적용할 수 있어.</span><button id="webApply" type="button">업데이트 적용</button></div>
'''

def build(source,out,version='V575-WEB-1'):
    report=convert(source,out,version)
    manifest=json.loads((out/'asset-manifest.json').read_text())
    for e in manifest:e['kind']='image'
    names={e['path'] for e in manifest}
    def save(data,ext,kind):
        sha=hashlib.sha256(data).hexdigest();name='assets/'+sha+'.'+ext
        if len(data)>MAX_GIT_BLOB:raise ValueError('Oversized file')
        if name not in names:
            (out/name).write_bytes(data)
            if sha256_file(out/name)!=sha:raise ValueError('Written bytes differ')
            manifest.append({'path':name,'sha256':sha,'bytes':len(data),'kind':kind});names.add(name)
        return name
    html=(out/'index.html').read_text()
    canonical=html
    html=re.sub(r'data:font/(woff2?);base64,([A-Za-z0-9+/]+={0,2})',lambda m:save(base64.b64decode(m[2],validate=True),m[1],'font'),html)
    data_scripts=[];data_hashes=[]
    for name in ['ENV_OPT_V518','CAMPAIGN_MAPS_V567']:
        m=re.search(r'^const '+name+r'=(.*);$',html,re.M)
        if not m:raise ValueError('Required V575 constant missing: '+name)
        raw=m[1];value=json.loads(raw);head='window.__EVOLVE_WEB_DATA__=window.__EVOLVE_WEB_DATA__||{};\n'
        if name=='CAMPAIGN_MAPS_V567':
            decoder=json.JSONDecoder();pos=1;entries=[]
            while pos<len(raw):
                while raw[pos] in ' \n\r\t,':pos+=1
                if raw[pos]==']':break
                _,end=decoder.raw_decode(raw,pos);entries.append(raw[pos:end]);pos=end
            if [json.loads(x) for x in entries]!=value:raise ValueError('Map values differ')
            for i,entry in enumerate(entries):
                content=head+('window.__EVOLVE_WEB_DATA__.CAMPAIGN_MAPS_V567=[];\n' if i==0 else '')+'window.__EVOLVE_WEB_DATA__.CAMPAIGN_MAPS_V567.push('+entry+');\n'
                data_scripts.append(save(content.encode(),'js','map-data'))
        else:data_scripts.append(save((head+'window.__EVOLVE_WEB_DATA__.'+name+'='+raw+';\n').encode(),'js','environment-data'))
        data_hashes.append({'name':name,'json_sha256':hashlib.sha256(raw.encode()).hexdigest(),'equivalent':True})
        html=html[:m.start()]+'const '+name+'=window.__EVOLVE_WEB_DATA__.'+name+';'+html[m.end():]
    def tag(p,attrs=''):
        n=(out/p).stat().st_size
        return f'<script{attrs} defer src="{p}" onload="EVOLVE_WEB_CLIENT.loaded({n})" onerror="EVOLVE_WEB_CLIENT.failed()"></script>'
    scripts=[];guardless=[]
    def external(m):
        body=m['body'];guardless.append(hashlib.sha256(body.encode()).hexdigest())
        if not scripts:
            end=body.rfind('\n})();')
            if end<0:raise ValueError('Game closure missing')
            body=body[:end]+GUARD+body[end:]
        p=save(body.encode(),'js','game-code');scripts.append(p);return tag(p,m['attrs'])
    html=re.sub(r'<script(?P<attrs>[^>]*)>(?P<body>.*?)</script>',external,html,flags=re.S)
    html=html.replace(tag(scripts[0]),'\n'.join(tag(p) for p in data_scripts)+'\n'+tag(scripts[0]),1)
    client=save((ROOT/'web/client.js').read_bytes(),'js','web-shell')
    (out/'sw.js').write_bytes((ROOT/'web/sw.js').read_bytes());(out/'.nojekyll').write_bytes(b'')
    build_id=hashlib.sha256(json.dumps(manifest,sort_keys=True).encode()+html.encode()+SHELL.encode()+(out/'sw.js').read_bytes()).hexdigest()
    config={'version':version,'build':build_id,'scriptBytes':sum((out/p).stat().st_size for p in data_scripts+scripts)}
    html=html.replace('</head>','<script>window.EVOLVE_WEB_CONFIG='+json.dumps(config)+';</script>\n<script src="'+client+'"></script>\n</head>',1).replace('<body>','<body>'+SHELL,1).replace('<title>EVOLVE V575 · FLOOR VISIBILITY TEST</title>','<title>EVOLVE V575 · ONLINE</title>',1)
    (out/'index.html').write_text(html)
    (out/'asset-manifest.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n')
    (out/'version.json').write_text(json.dumps({**config,'assets':len(manifest),'source_sha256':report['source_sha256']},indent=2)+'\n')
    report.update({'build':build_id,'index_bytes':(out/'index.html').stat().st_size,'image_assets':sum(e['kind']=='image' for e in manifest),'cached_files':len(manifest),'cached_bytes':sum(e['bytes'] for e in manifest),'data_extraction':data_hashes,'game_scripts_before_web_guard':guardless,'save_keys_unchanged':True,'automatic_reload':False,'image_recompression':False,'source_unchanged':sha256_file(source)==report['source_sha256']})
    (out/'verification.json').write_text(json.dumps(report,indent=2)+'\n')
    # Independently compare the canonical extracted source scripts with packaged code.
    expected=re.findall(r'<script[^>]*>(.*?)</script>',canonical,re.S)
    for name in ['ENV_OPT_V518','CAMPAIGN_MAPS_V567']:
        expected[0]=re.sub(r'^const '+name+r'=(.*);$','const '+name+'=window.__EVOLVE_WEB_DATA__.'+name+';',expected[0],flags=re.M)
    if len(expected)!=len(scripts):raise ValueError('Script count changed')
    for old,p in zip(expected,scripts):
        if old!=(out/p).read_text().replace(GUARD,''):raise ValueError('Original game code changed')
    return report

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--source',type=Path,required=True);p.add_argument('--output',type=Path,default=Path('dist'));p.add_argument('--version',default='V575-WEB-1');a=p.parse_args();print(json.dumps(build(a.source,a.output,a.version),indent=2))
