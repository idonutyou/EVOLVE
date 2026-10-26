#!/usr/bin/env python3
"""Retry only a public cold-start timeout; keep every gameplay assertion intact."""
import argparse,json,os,subprocess,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--url',required=True);p.add_argument('--script',required=True);p.add_argument('--report',type=Path,required=True);a=p.parse_args()
env=dict(os.environ,EVOLVE_TEST_BASE_URL=a.url)
result=subprocess.run(['node',a.script],env=env)
if result.returncode:
 try:r=json.loads(a.report.read_text())
 except (OSError,ValueError):sys.exit(result.returncode)
 retry=(not r.get('checks') and not r.get('errors') and 'waitForFunction: Timeout' in r.get('failure',''))
 if retry:
  print('Retrying the public cold-start check once after its initial resource download timed out.',flush=True)
  result=subprocess.run(['node',a.script],env=env)
sys.exit(result.returncode)
