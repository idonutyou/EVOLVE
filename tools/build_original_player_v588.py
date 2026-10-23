#!/usr/bin/env python3
"""Build a native texture mesh: retain the supplied PNG, move only requested anatomy.

No generative redraw, raster resave, or atlas re-encoding. Runtime poses reuse the
original texture, and are cached once at the existing game sprite resolution.
"""
import argparse
import hashlib
import json
import math
import shutil
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.spatial import Delaunay

ROOT = Path(__file__).resolve().parents[1]
SOURCE_SHA = '40df7f6cb18401d39c83fd51360ab080516e10cf3c27bc966756299817f1c6d9'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('source', type=Path)
    args = parser.parse_args()
    raw = args.source.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == SOURCE_SHA
    target = ROOT / 'dist/assets' / (SOURCE_SHA + '.png')
    shutil.copyfile(args.source, target)
    image = Image.open(args.source).convert('RGB')
    pixels = np.asarray(image)
    # The source has a black studio backdrop. Retain every lit source pixel;
    # only the near-black backdrop is clipped, with no change to RGB samples.
    visible = pixels.max(axis=2) > 14
    runs = []
    for y, row in enumerate(visible):
        edges = np.diff(np.r_[False, row, False].astype(np.int8))
        for x, end in zip(np.flatnonzero(edges == 1), np.flatnonzero(edges == -1)):
            runs.append([y, int(x), int(end - x)])

    groups = {
        'fixed': [(-256, -256), (1792, -256), (1792, 1792), (-256, 1792),
                  (180, 220), (300, 150), (420, 125), (552, 147),
                  (250, 285), (140, 340), (110, 420), (115, 525),
                  (215, 576), (300, 614), (395, 650), (475, 705),
                  (505, 770), (620, 825), (730, 850), (870, 825),
                  (1030, 810), (1110, 890), (1020, 990), (1090, 1110),
                  (1010, 1190), (900, 1140), (820, 1030), (810, 950),
                  (685, 970), (590, 955), (430, 865), (1150, 980),
                  (1200, 1040), (1110, 1230), (960, 1270)],
        'near_arm': [(430, 470), (490, 416), (552, 351), (592, 324),
                     (642, 275), (689, 216), (716, 194), (745, 205),
                     (786, 236), (858, 294), (888, 328), (922, 397),
                     (941, 476), (937, 546), (907, 498), (870, 433),
                     (823, 382), (778, 355), (732, 345), (687, 370),
                     (650, 414), (618, 472), (619, 514), (647, 557),
                     (673, 622), (676, 673), (643, 709), (607, 730),
                     (569, 714), (544, 675), (517, 620), (478, 587),
                     (460, 546), (450, 510), (505, 514), (615, 362),
                     (738, 285), (804, 323), (886, 420), (603, 644)],
        'far_arm': [(969, 575), (1045, 502), (1096, 438), (1144, 388),
                    (1200, 331), (1242, 297), (1273, 308), (1310, 349),
                    (1374, 393), (1413, 455), (1442, 529), (1464, 620),
                    (1454, 699), (1424, 645), (1373, 581), (1322, 531),
                    (1265, 493), (1219, 487), (1185, 528), (1145, 585),
                    (1120, 644), (1075, 684), (1036, 665), (1096, 560),
                    (1260, 390), (1344, 467)],
        'rear_leg': [(237, 720), (197, 750), (132, 816), (97, 887),
                     (57, 969), (35, 1078), (48, 1187), (88, 1115),
                     (156, 1018), (199, 943), (232, 875), (290, 833),
                     (367, 848), (275, 792), (115, 1008)],
        'near_leg': [(514, 869), (471, 932), (424, 1024), (421, 1101),
                     (448, 1173), (500, 1250), (575, 1313), (651, 1396),
                     (744, 1473), (783, 1496), (774, 1409), (731, 1319),
                     (668, 1229), (616, 1157), (614, 1063), (646, 1005),
                     (704, 929), (662, 872), (539, 1097), (650, 1320)],
        'far_leg': [(1216, 750), (1275, 763), (1348, 821), (1398, 894),
                    (1448, 960), (1492, 1056), (1510, 1142), (1467, 1246),
                    (1413, 1284), (1436, 1164), (1396, 1091), (1345, 1054),
                    (1299, 1047), (1267, 973), (1234, 900), (1186, 855),
                    (1266, 855), (1406, 1005)],
        'core': [(775, 543), (813, 548), (866, 578), (908, 619),
                 (936, 669), (916, 718), (872, 690), (825, 652),
                 (796, 601), (851, 615)],
    }
    points, tags = [], []
    for name, coords in groups.items():
        for p in coords:
            assert list(p) not in points
            points.append(list(p))
            tags.append(name)
    triangles = Delaunay(points).simplices.tolist()
    baseline = {'near_arm': [60, 40], 'far_arm': [60, 40], 'core': [-24, -18]}

    def pose(index):
        offsets = []
        phase = (index % 4) * math.pi / 2
        for (x, y), tag in zip(points, tags):
            dx, dy = baseline.get(tag, [0, 0])
            if index < 4:
                breath = [0, 1.5, .5, -1.5][index]
                if tag == 'core': dy += breath
                if tag in ['near_arm', 'far_arm']: dy += breath * .35
            elif index < 8:
                if tag in ['rear_leg', 'near_leg', 'far_leg']:
                    s = math.sin(phase + (0 if tag == 'near_leg' else math.pi))
                    weight = min(1, max(0, (y - (850 if tag == 'near_leg' else 780)) / 300))
                    dx += s * 20 * weight
                    dy += math.cos(phase) * 11 * weight
                elif tag == 'core': dy += math.cos(phase) * 2
            elif index < 16:
                arm = 'near_arm' if index < 12 else 'far_arm'
                if tag == arm:
                    amount = [-.24, .18, 1, .22][index % 4]
                    pivot_y = 730 if arm == 'near_arm' else 685
                    weight = min(1, max(0, (pivot_y - y) / 350))
                    dx += amount * 84 * weight
                    dy += amount * 57 * weight
            elif index < 18:
                amount = 1 if index == 16 else .35
                if tag == 'core': dx -= 8 * amount; dy -= 4 * amount
                elif tag in ['near_arm', 'far_arm']: dy += 8 * amount
            else:
                amount = .5 if index == 18 else 1
                if tag in ['near_arm', 'far_arm']: dy += 19 * amount
                if tag == 'core': dy += 12 * amount
                if tag in ['rear_leg', 'near_leg', 'far_leg']: dx += (x - 768) * .012 * amount
            offsets.append([round(dx, 3), round(dy, 3)])
        return offsets

    frames = [pose(i) for i in range(20)]
    source_points = np.array(points)
    def cross(a, b): return a[0]*b[1]-a[1]*b[0]
    def area_ratio(offsets):
        dest = source_points + np.array(offsets)
        ratios = []
        for triangle in triangles:
            a, b, c = source_points[triangle]
            u, v, w = dest[triangle]
            ratios.append(cross(v-u, w-u)/cross(b-a, c-a))
        return min(ratios)
    assert area_ratio(frames[0]) > .10, area_ratio(frames[0])
    neutral = np.array(frames[0]);amplitudes=[]
    for i, offsets in enumerate(frames):
        delta = np.array(offsets)-neutral;amount=1
        while area_ratio(neutral+delta*amount) < .12:
            amount *= .8
            assert amount > .02, (i, amount)
        frames[i]=np.round(neutral+delta*amount,3).tolist();amplitudes.append(round(amount,4))
    minimum = min(area_ratio(frame) for frame in frames)
    old = json.loads((ROOT / 'web/player-scorpion-art-v586.json').read_text())
    f = old['frames'][0]
    old_span = max(f['rect'][2:])
    # Match the previous actor's world size while improving the home preview's
    # texture resolution. Original source bytes and dimensions remain untouched.
    art = {'path': 'assets/' + SOURCE_SHA + '.png', 'sha256': SOURCE_SHA,
           'bytes': len(raw), 'width': image.width, 'height': image.height,
           'source_identity': 'supplied-original-1000027490', 'alpha': False,
           'surface': old['surface'], 'displaySize': old['displaySize'],
           'nativeFacing': old['nativeFacing'], 'previewSurface': 1536,
           'sourceScale': old_span / max(image.size), 'anchor': [768, 800],
           'clip': runs, 'points': points, 'triangles': triangles,
           'frames': frames, 'groups': {name: [i for i, tag in enumerate(tags) if tag == name] for name in groups},
           'anatomy_offsets': baseline, 'frame_amplitude_scales': amplitudes, 'minimum_triangle_area_ratio': round(float(minimum), 6),
           'original_source_bytes_unchanged': True, 'generative_redraw': False}
    output = ROOT / 'web/player-original-art-v588.json'
    output.write_text(json.dumps(art, separators=(',', ':')) + '\n')
    print(json.dumps({'path': art['path'], 'source_bytes': len(raw), 'vertices': len(points),
                      'triangles': len(triangles), 'mask_spans': len(runs),
                      'minimum_triangle_area_ratio': art['minimum_triangle_area_ratio'],
                      'old_span': old_span, 'offsets': baseline}))


if __name__ == '__main__':
    main()
