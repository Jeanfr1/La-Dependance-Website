#!/usr/bin/env python3
"""Technical outline conversion of the approved alpha PNG, without changing it.
Creates code-native SVG paths (not a raster image in an SVG wrapper).
"""
from pathlib import Path
import json
from PIL import Image
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / 'brand'


def main():
    source = BRAND/'La-Dependance-Logo-Transparente.png'
    im = Image.open(source).convert('RGBA')
    alpha = np.asarray(im)[:, :, 3].astype(float) / 255
    fig, ax = plt.subplots()
    contours = ax.contour(np.pad(alpha, 1), levels=[.5]).allsegs[0]
    plt.close(fig)
    paths = []
    for segment in contours:
        if len(segment) < 4:
            continue
        pts = [[round(float(x - .5), 3), round(float(y - .5), 3)] for x, y in segment]
        paths.append(pts)
    d = ' '.join('M' + ' L'.join(f'{x:g},{y:g}' for x,y in p) + ' Z' for p in paths)
    for name, color, view in [
        ('La-Dependance-Logo.svg', '#3D2435', f'0 0 {im.width} {im.height}'),
        ('La-Dependance-Logo-Ivoire.svg', '#F5EFE7', f'0 0 {im.width} {im.height}'),
        ('Monogramme-LD.svg', '#3D2435', '680 85 410 420'),
        ('Monogramme-LD-Ivoire.svg', '#F5EFE7', '680 85 410 420')
    ]:
        svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view}" role="img" aria-labelledby="logo-title"><title id="logo-title">La Dépendance — Ongles et Regard</title><path fill="{color}" fill-rule="evenodd" d="{d}"/></svg>'
        (BRAND/name).write_text(svg)
    (BRAND/'logo-outlines.json').write_text(json.dumps({'width':im.width,'height':im.height,'source':'La-Dependance-Logo-Transparente.png','method':'alpha contour 0.5; approved raster unchanged; SVG paths outlined, not font text','paths':paths},separators=(',',':')))
    print(json.dumps({'contours':len(paths),'points':sum(map(len,paths)),'SVG_embedded_raster':False}))


if __name__ == '__main__':
    main()
