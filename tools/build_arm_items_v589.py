#!/usr/bin/env python3
"""Extract only the marked weapon ends, retaining their original RGB pixels."""
import argparse
import hashlib
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import binary_propagation, label

ROOT = Path(__file__).resolve().parents[1]


def main():
    p = argparse.ArgumentParser()
    p.add_argument('cannon', type=Path)
    p.add_argument('blades', type=Path)
    args = p.parse_args()
    old_path = ROOT / 'web/arm-items-art-v589.json'
    previous = json.loads(old_path.read_text()) if old_path.exists() else {'items': {}}
    art = {'source_pixels_preserved': True, 'generative_redraw': False, 'items': {}}
    specs = {
        'cannon': (args.cannon, [(0, 350), (248, 350), (326, 410), (365, 455), (398, 510), (368, 568), (345, 620), (292, 704), (0, 704)], (305, 436), (86, 584), .058),
        'blades': (args.blades, [(0, 400), (220, 400), (300, 456), (400, 526), (445, 620), (445, 860), (0, 860)], (285, 470), (20, 821), .090),
    }

    def save(image):
        import io
        stream = io.BytesIO()
        image.save(stream, format='PNG', optimize=True)
        raw = stream.getvalue()
        sha = hashlib.sha256(raw).hexdigest()
        name = 'assets/' + sha + '.png'
        (ROOT / 'dist' / name).write_bytes(raw)
        return {'path': name, 'sha256': sha, 'bytes': len(raw), 'width': image.width, 'height': image.height}

    for kind, (source_path, polygon, pivot, tip, scale) in specs.items():
        raw = source_path.read_bytes()
        source = Image.open(source_path).convert('RGB')
        rgb = np.asarray(source)
        # Remove only background connected to the canvas edge. Dark barrel
        # interiors and original metal/organic shading remain intact.
        dark = rgb.max(axis=2) <= 14
        seed = np.zeros(dark.shape, dtype=bool)
        seed[[0, -1], :] = dark[[0, -1], :]
        seed[:, [0, -1]] = dark[:, [0, -1]]
        background = binary_propagation(seed, mask=dark)
        sides = []
        item = {'source_sha256': hashlib.sha256(raw).hexdigest(), 'world_scale': scale}
        for side in ['left', 'right']:
            poly = polygon if side == 'left' else [(source.width - 1 - x, y) for x, y in polygon]
            mask = Image.new('L', source.size)
            ImageDraw.Draw(mask).polygon(poly, fill=255)
            alpha = np.where(background, 0, np.asarray(mask)).astype(np.uint8)
            # A cut through a wrist may leave a disconnected spike from the
            # discarded upper arm. Keep the connected weapon end only.
            components, _ = label(alpha > 0)
            counts = np.bincount(components.ravel())
            counts[0] = 0
            alpha[components != counts.argmax()] = 0
            rgba = np.dstack([rgb, alpha])
            selected = Image.fromarray(rgba)
            box = selected.getbbox()
            selected = selected.crop(box)
            assert np.array_equal(np.asarray(selected)[:, :, :3], rgb[box[1]:box[3], box[0]:box[2]])
            px, py = pivot if side == 'left' else (source.width - 1 - pivot[0], pivot[1])
            tx, ty = tip if side == 'left' else (source.width - 1 - tip[0], tip[1])
            item[side] = save(selected) | {
                'source_box': list(box), 'pivot': [px - box[0], py - box[1]],
                'tip': [tx - box[0], ty - box[1]], 'native_angle': math.atan2(ty-py, tx-px),
                'length': math.hypot(tx-px, ty-py),
            }
            sides.append(selected)
        icon = Image.new('RGBA', (sum(x.width for x in sides)+24, max(x.height for x in sides)))
        x = 0
        for side in sides:
            icon.paste(side, (x, (icon.height-side.height)//2))
            x += side.width+24
        item['icon'] = save(icon)
        item['left_polygon'] = polygon
        art['items'][kind] = item
    old_path.write_text(json.dumps(art, indent=2)+'\n')
    keep = {part[k]['path'] for part in art['items'].values() for k in ['left', 'right', 'icon']}
    for part in previous['items'].values():
        for k in ['left', 'right', 'icon']:
            if part[k]['path'] not in keep:
                (ROOT / 'dist' / part[k]['path']).unlink(missing_ok=True)
    print(json.dumps({'items': list(art['items']), 'assets': len(keep), 'original_rgb_pixels_preserved': True}))


if __name__ == '__main__':
    main()
