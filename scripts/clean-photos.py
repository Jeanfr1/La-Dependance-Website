#!/usr/bin/env python3
"""Remove capture UI from the client's real photos, without retouching the subject.

interieur: two translucent carousel buttons (dark disc + white chevron). The disc
is un-blended (observed = (1 - a) * photo + a * k), the chevron is inpainted.
Output goes to scripts/out/clean/, read by prepare-images.py.

~/anaconda3/bin/python3 scripts/clean-photos.py
"""
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "scripts/out/clean"


def fit_disc(img, cx, cy, r_guess):
    """Refine the disc centre/radius on the luminance step at its rim."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    best = None
    for dx in range(-4, 5):
        for dy in range(-4, 5):
            for r in np.arange(r_guess - 4, r_guess + 4.5, 0.5):
                x, y = cx + dx, cy + dy
                ang = np.linspace(0, 2 * np.pi, 180, endpoint=False)
                inner = gray[(y + (r - 2) * np.sin(ang)).astype(int), (x + (r - 2) * np.cos(ang)).astype(int)]
                outer = gray[(y + (r + 2) * np.sin(ang)).astype(int), (x + (r + 2) * np.cos(ang)).astype(int)]
                score = float(np.median(outer.astype(int) - inner.astype(int)))
                if best is None or score > best[0]:
                    best = (score, x, y, r)
    return best[1:]


def remove_button(img, cx, cy, r):
    h, w = img.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.hypot(xx - cx, yy - cy)
    ring_in = (d > r - 7) & (d < r - 3)
    ring_out = (d > r + 3) & (d < r + 7)
    f = img.astype(np.float32)
    # k = 0 (black overlay): (1 - a) = inner / outer, per channel, robust median
    t = np.median(f[ring_in], axis=0) / np.maximum(np.median(f[ring_out], axis=0), 1)
    t = float(np.clip(np.mean(t), 0.2, 0.95))
    alpha = np.clip((r + 1.2 - d) / 2.4, 0, 1)[..., None]   # anti-aliased rim
    scale = 1 / (1 - alpha * (1 - t))
    out = np.clip(f * scale, 0, 255).astype(np.uint8)
    # chevron: bright pixels inside the disc after un-blending + a rim band
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    chevron = ((d < r - 4) & (gray > 175)).astype(np.uint8) * 255
    chevron = cv2.dilate(chevron, np.ones((5, 5), np.uint8))
    rim = ((d > r - 3.5) & (d < r + 3.5)).astype(np.uint8) * 255
    mask = cv2.bitwise_or(chevron, rim)
    out = cv2.inpaint(out, mask, 5, cv2.INPAINT_TELEA)
    return out, t


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    src = cv2.imread(str(ROOT / "images/originals/interieur-original.png"), cv2.IMREAD_COLOR)
    img = src.copy()
    for guess in [(66, 373, 36), (1291, 373, 36)]:
        cx, cy, r = fit_disc(img, *guess)
        img, t = remove_button(img, cx, cy, r)
        print(f"button at ({cx}, {cy}) r={r} transmission={t:.2f}")
    cv2.imwrite(str(OUT / "interieur.png"), img)
    crops = [img[300:450, 0:150], img[300:450, 1215:1350]]
    before = [src[300:450, 0:150], src[300:450, 1215:1350]]
    sheet = np.vstack([np.hstack([cv2.resize(b, None, fx=3, fy=3), cv2.resize(a, None, fx=3, fy=3)])
                       for b, a in zip(before, crops)][:1])
    sheet2 = np.hstack([cv2.resize(before[1], None, fx=3, fy=3), cv2.resize(crops[1], None, fx=3, fy=3)])
    cv2.imwrite(str(OUT / "check-arrows-left.jpg"), sheet)
    cv2.imwrite(str(OUT / "check-arrows-right.jpg"), sheet2)


if __name__ == "__main__":
    main()
