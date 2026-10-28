#!/usr/bin/env python3
"""Recolour the letter D of the hero plate from plum to the new olive (#535544).

The D is found by colour (plum: a* > 0, b* near 0 in Lab), restricted to the D's zone
measured on the approved plate (images/master/hero-portrait-D.png), so warm hair
strands of the new portrait are never touched. Lightness keeps the photo's shading
around the olive's lightness; a*/b* take the olive's chroma plus a fraction of the
original local variation, so light and shadow survive.

~/anaconda3/bin/python3 scripts/recolor-d.py <in.png RGBA> <out.png> [approved.png]

With an approved plate, the D is taken from the approved plate itself (recoloured) wherever
the new image still shows the same pixels, so hair that now falls over the D is never
recoloured; only the top bar that the old hair bun used to hide is recoloured in the new image.
"""
import sys

import cv2
import numpy as np

OLIVE = np.uint8([[[0x44, 0x55, 0x53]]])  # BGR of #535544


def plum_mask(bgra):
    lab = cv2.cvtColor(bgra[:, :, :3], cv2.COLOR_BGR2LAB).astype(np.float32)
    L, A, B = lab[:, :, 0], lab[:, :, 1] - 128, lab[:, :, 2] - 128
    m = (bgra[:, :, 3] > 8) & (A > 7) & (B < 8) & (L < 170)
    m = cv2.morphologyEx(m.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    return cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8)) & (bgra[:, :, 3] > 8).astype(np.uint8)


def zone_from(approved):
    """The D's zone on the approved plate: its plum pixels (large parts), grown 25 px,
    plus the top bar band where the old hair bun covered it."""
    m = plum_mask(approved)
    n, labels, stats, _ = cv2.connectedComponentsWithStats(m)
    keep = np.zeros_like(m)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] > 1500:
            keep[labels == i] = 1
    zone = cv2.dilate(keep, np.ones((51, 51), np.uint8))
    zone[:148, 250:1050] = 1
    return zone


def recolor(bgra, zone):
    bgr = bgra[:, :, :3]
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
    L, A, B = lab[:, :, 0], lab[:, :, 1] - 128, lab[:, :, 2] - 128
    keep = plum_mask(bgra) & zone
    keep = cv2.dilate(keep, np.ones((3, 3), np.uint8))
    soft = cv2.GaussianBlur(keep.astype(np.float32), (5, 5), 0)
    tgt = cv2.cvtColor(OLIVE, cv2.COLOR_BGR2LAB).astype(np.float32)[0, 0]
    sel = keep.astype(bool)
    l_mean = float(L[sel].mean())
    a_mean, b_mean = float(A[sel].mean()), float(B[sel].mean())
    out = lab.copy()
    out[:, :, 0] = np.clip(tgt[0] + (L - l_mean), 0, 255)
    out[:, :, 1] = tgt[1] + (A - a_mean) * 0.35
    out[:, :, 2] = tgt[2] + (B - b_mean) * 0.35
    new = cv2.cvtColor(np.clip(out, 0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR).astype(np.float32)
    res = bgr.astype(np.float32) * (1 - soft[..., None]) + new * soft[..., None]
    return np.dstack([np.clip(res, 0, 255).astype(np.uint8), bgra[:, :, 3]]), keep


def recolor_with_reference(new, approved):
    zone = zone_from(approved)
    old_olive, old_d = recolor(approved, zone)
    diff = np.abs(new[:, :, :3].astype(np.float32) - approved[:, :, :3].astype(np.float32)).mean(2)
    same = cv2.GaussianBlur(diff, (0, 0), 1.5) < 18
    take_old = old_d.astype(bool) & same & (new[:, :, 3] > 128)
    top = np.zeros_like(zone)
    top[:148, 250:1050] = 1
    new_olive, new_d = recolor(new, top)
    w_old = cv2.GaussianBlur(take_old.astype(np.float32), (0, 0), 0.8)[..., None]
    w_new = cv2.GaussianBlur((new_d.astype(bool) & ~take_old).astype(np.float32), (0, 0), 0.8)[..., None]
    rgb = new[:, :, :3].astype(np.float32)
    rgb = rgb * (1 - w_old) + old_olive[:, :, :3].astype(np.float32) * w_old
    rgb = rgb * (1 - w_new) + new_olive[:, :, :3].astype(np.float32) * w_new
    out = np.dstack([np.clip(rgb, 0, 255).astype(np.uint8), new[:, :, 3]])
    return out, (take_old | new_d.astype(bool)).astype(np.uint8)


if __name__ == "__main__":
    src = cv2.imread(sys.argv[1], cv2.IMREAD_UNCHANGED)
    if len(sys.argv) > 3:
        out, mask = recolor_with_reference(src, cv2.imread(sys.argv[3], cv2.IMREAD_UNCHANGED))
    else:
        out, mask = recolor(src, zone_from(src))
    cv2.imwrite(sys.argv[2], out)
    cv2.imwrite(sys.argv[2].replace('.png', '-mask.png'), mask * 255)
    print('D pixels', int(mask.sum()))
