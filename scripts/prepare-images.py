#!/usr/bin/env python3
"""Prepare the master plates the site is built from (scripts/out/plates/).

- Real photos (interior cleaned of its carousel buttons, nails, gallery): Real-ESRGAN
  x4, then resampled to 2x, so desktop and retina screens never upscale a 760 px capture.
- Capture headers/bars are cropped away here (gallery, nails); nothing else changes.
- Phone cut-out from the booking scene (GrabCut seeded on the measured phone), used
  where the phone crosses over the team photo, as on the approved board.

~/anaconda3/bin/python3 scripts/prepare-images.py [--skip-sr]
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "scripts/out/plates"
SKIP_SR = "--skip-sr" in sys.argv

# name: (source, crop box x0, y0, x1, y1 in source px or None)
REAL = {
    "interieur": ("scripts/out/clean/interieur.png", None),
    "ongles-fuchsia": ("images/originals/ongles-fuchsia-original.png", (0, 100, 762, 1000)),
    "ongles-bleu-jaune": ("images/originals/ongles-bleu-jaune-original.png", (0, 100, 760, 1014)),
    "ongles-fraises": ("images/originals/ongles-fraises-original.png", (0, 100, 760, 1010)),
    "regard": ("images/originals/regard-02-original.png", (0, 100, 1260, 1640)),
}


def sr2(bgr):
    if SKIP_SR:
        return cv2.resize(bgr, None, fx=2, fy=2, interpolation=cv2.INTER_LANCZOS4)
    sys.path.insert(0, str(ROOT / "scripts"))
    from upscale import sr4
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    big = sr4(rgb)
    big = cv2.resize(big, (bgr.shape[1] * 2, bgr.shape[0] * 2), interpolation=cv2.INTER_AREA)
    return cv2.cvtColor(big, cv2.COLOR_RGB2BGR)


def phone_cutout():
    """RGBA of the phone in the booking scene (same canvas as the scene)."""
    src = cv2.imread(str(ROOT / "images/master/reservation-scene.png"), cv2.IMREAD_COLOR)
    meta = json.loads((ROOT / "scripts/out/phone.json").read_text())
    poly = np.array(meta["polygon"], np.int32)
    mask = np.full(src.shape[:2], cv2.GC_BGD, np.uint8)
    cv2.fillPoly(mask, [poly], cv2.GC_PR_FGD)
    inner = cv2.erode((mask == cv2.GC_PR_FGD).astype(np.uint8), np.ones((25, 25), np.uint8))
    mask[inner > 0] = cv2.GC_FGD
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(src, mask, None, bgd, fgd, 6, cv2.GC_INIT_WITH_MASK)
    alpha = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    alpha = cv2.GaussianBlur(alpha, (3, 3), 0)
    return np.dstack([src, alpha])


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, (rel, box) in REAL.items():
        img = cv2.imread(str(ROOT / rel), cv2.IMREAD_COLOR)
        if box:
            x0, y0, x1, y1 = box
            img = img[y0:y1, x0:x1]
        target = OUT / f"{name}.png"
        if target.exists() and not SKIP_SR:
            print("kept", target.name)
            continue
        cv2.imwrite(str(target), sr2(img))
        print("wrote", target.name, img.shape[1] * 2, "x", img.shape[0] * 2)
    if (ROOT / "scripts/out/phone.json").exists():
        cv2.imwrite(str(OUT / "telephone.png"), phone_cutout())
        print("wrote telephone.png")


if __name__ == "__main__":
    main()
