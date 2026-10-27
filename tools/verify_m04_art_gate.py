#!/usr/bin/env python3
"""Keep M04 original asset set exactly unchanged."""
import json,subprocess
from pathlib import Path
r=Path(__file__).resolve().parents[1]
base='4af248bd7d2b655afa77299e9c8afb2743d88278'
old=json.loads(subprocess.check_output(['git','show',base+':dist/asset-manifest.json'],cwd=r))
new=json.loads((r/'dist/asset-manifest.json').read_text())
refs={x['path']:x for x in new}
assert len(refs)==len(new)
assert all(refs.get(x['path'])==x for x in old)
assert sum(x['kind']=='image' for x in new)==1021
print('M04 original assets preserved; 1021 images')
