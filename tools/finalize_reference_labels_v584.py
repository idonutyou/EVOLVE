#!/usr/bin/env python3
"""Map the four approved Korean labels without clipping or including adjacent text."""
import json
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'web/warning-branding-art-v581.json'
art=json.loads(p.read_text())
image=Image.open(ROOT/'dist'/art['atlases']['korean_labels']['path'])
assert image.size==(1774,887)
# The middle line is taller than a third of this atlas; use its actual clear gutters.
regions={'warning_ko':(0,315,887,670),'breach_ko':(887,315,1774,670),'phase_ko':(0,670,887,887),'subtitle_ko':(887,670,1774,887)}
for name,(x0,y0,x1,y1) in regions.items():
    region=image.getchannel('A').crop((x0,y0,x1,y1))
    bounds=region.point(lambda a:255 if a>20 else 0).getbbox()
    assert bounds and bounds[0]>2 and bounds[1]>2 and bounds[2]<x1-x0-2 and bounds[3]<y1-y0-2,(name,bounds)
    left,top,right,bottom=bounds
    art['sprites'][name]['crop']=[x0+left-2,y0+top-2,right-left+4,bottom-top+4]
assert len(art['sprites'])==14
assert {key for key in art['sprites'] if key.endswith('_ko')}==set(regions)
assert art['sprites']['bio']['atlas']=='bio_regeneration'
p.write_text(json.dumps(art,ensure_ascii=False,indent=2)+'\n')
q=ROOT/'docs/reference-lettering-v584-recovery.json'
report=json.loads(q.read_text())
report.update(korean_crops={name:art['sprites'][name]['crop'] for name in regions},korean_crop_gutters_verified=True,atlas_bytes_unchanged=True)
q.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False))
