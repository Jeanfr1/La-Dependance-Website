#!/usr/bin/env python3
"""Swap the brand on the phone screen of the booking scene (images/master/reservation-scene.png).

Only the screen changes: the old LD logo is removed by refilling its pixels with the
screen's own gradient (a plane fitted to the clean screen around it, plus matching
grain), the new olive logo is laid in at the screen's angle, and the plum button is
recoloured to olive (its white label stays). Hand, phone, light and framing are the
original pixels.

~/anaconda3/bin/python3 scripts/phone-logo.py <logo-olive.png RGBA> <out.png>
"""
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
CENTRE = (1147.0, 462.0)      # old logo centre on the screen (plate px)
ANGLE = 10.9                  # screen rotation, counter-clockwise (button minAreaRect)
LOGO_H = 172                  # new logo height along the screen (old mark: 142 px + tagline air)
OLIVE = np.uint8([[[0x44, 0x55, 0x53]]])


def rotated_box_mask(shape, centre, size, angle):
    box = cv2.boxPoints((centre, size, -angle)).astype(np.int32)
    m = np.zeros(shape[:2], np.uint8)
    cv2.fillConvexPoly(m, box, 1)
    return m.astype(bool)


def main(logo_path, out_path):
    im = cv2.imread(str(ROOT / 'images/master/reservation-scene.png')).astype(np.float32)
    lab = cv2.cvtColor(im.astype(np.uint8), cv2.COLOR_BGR2LAB).astype(np.float32)
    L, A, B = lab[..., 0], lab[..., 1] - 128, lab[..., 2] - 128

    # 1. remove the old mark: repaint its whole box with the screen's own gradient
    #    (plane fitted to the bare screen around it + matching grain); frame and thumb stay.
    area = rotated_box_mask(im.shape, CENTRE, (318, 182), ANGLE)
    ring = rotated_box_mask(im.shape, CENTRE, (360, 230), ANGLE) & ~area
    bezel = (L < 70) & (np.abs(A) < 5) & (np.abs(B) < 6)
    skin = (A > 9) & (B > 9)
    keep_out = cv2.dilate((bezel | skin).astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool)
    screen = (L > 215) & ~keep_out
    fitset = (area | ring) & screen
    ys, xs = np.where(fitset)
    X = np.column_stack([xs, ys, xs * ys, xs ** 2, ys ** 2, np.ones_like(xs)]).astype(np.float64)
    region = area & ~keep_out
    ly, lx = np.where(region)
    Xl = np.column_stack([lx, ly, lx * ly, lx ** 2, ly ** 2, np.ones_like(lx)]).astype(np.float64)
    fill = im.copy()
    rng = np.random.default_rng(7)
    for c in range(3):
        coef, *_ = np.linalg.lstsq(X, im[ys, xs, c].astype(np.float64), rcond=None)
        resid = im[ys, xs, c] - X @ coef
        fill[ly, lx, c] = Xl @ coef + rng.normal(0, min(resid.std(), 2.0) * 0.8, len(lx))
    soft = cv2.GaussianBlur(region.astype(np.float32), (0, 0), 2.0)[..., None]
    im = im * (1 - soft) + fill * soft
    letters = region

    # 2. new logo, rotated with the screen
    logo = cv2.imread(logo_path, cv2.IMREAD_UNCHANGED)
    ys0, xs0 = np.where(logo[:, :, 3] > 0)
    logo = logo[ys0.min():ys0.max() + 1, xs0.min():xs0.max() + 1]
    s = LOGO_H / logo.shape[0]
    logo = cv2.resize(logo, (round(logo.shape[1] * s), LOGO_H), interpolation=cv2.INTER_AREA)
    h, w = logo.shape[:2]
    canvas = np.zeros((im.shape[0], im.shape[1], 4), np.float32)
    x0, y0 = int(CENTRE[0] - w / 2), int(CENTRE[1] - h / 2)
    canvas[y0:y0 + h, x0:x0 + w] = logo
    M = cv2.getRotationMatrix2D(CENTRE, ANGLE, 1.0)
    canvas = cv2.warpAffine(canvas, M, (im.shape[1], im.shape[0]), flags=cv2.INTER_CUBIC)
    canvas = cv2.GaussianBlur(canvas, (0, 0), 0.45)
    a = np.clip(canvas[..., 3:4] / 255, 0, 1)
    im = im * (1 - a) + canvas[..., :3] * a

    # 3. button: plum -> olive, label untouched
    btn = rotated_box_mask(im.shape, (1171.6, 626.4), (300, 80), ANGLE)
    plum = btn & (A > 7) & (B < 8) & (L < 120)
    plum = cv2.morphologyEx(plum.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8)).astype(bool) & btn
    tgt = cv2.cvtColor(OLIVE, cv2.COLOR_BGR2LAB).astype(np.float32)[0, 0]
    lab2 = cv2.cvtColor(np.clip(im, 0, 255).astype(np.uint8), cv2.COLOR_BGR2LAB).astype(np.float32)
    lm = lab2[..., 0][plum].mean()
    new = lab2.copy()
    new[..., 0] = np.clip(tgt[0] + (lab2[..., 0] - lm), 0, 255)
    new[..., 1] = tgt[1] + (lab2[..., 1] - lab2[..., 1][plum].mean()) * 0.35
    new[..., 2] = tgt[2] + (lab2[..., 2] - lab2[..., 2][plum].mean()) * 0.35
    newbgr = cv2.cvtColor(np.clip(new, 0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR).astype(np.float32)
    k = cv2.GaussianBlur(plum.astype(np.float32), (0, 0), 0.8)[..., None]
    im = im * (1 - k) + newbgr * k

    cv2.imwrite(out_path, np.clip(im, 0, 255).astype(np.uint8))
    print('letters px', int(letters.sum()), 'button px', int(plum.sum()), 'logo', w, 'x', h)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
