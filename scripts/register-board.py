#!/usr/bin/env python3
"""Register the kit plates against the approved board (SIFT + similarity).

Writes scripts/out/registration.json: for each plate, the scale (board px per
plate px) and the board position of the plate's top-left corner, plus a 50 %
blend overlay per plate in scripts/out/ to check the fit by eye.

Run with the Anaconda python (OpenCV 4.11): ~/anaconda3/bin/python3 scripts/register-board.py
"""
import json
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "scripts/out"
BOARD = ROOT / "references/Modele3-A-Part-Approuve.png"

# plate file, board search band (y0, y1)
PLATES = {
    "portrait": ("images/master/hero-portrait-D.png", (0, 640)),
    "studio": ("images/master/hero-studio.png", (0, 508)),
    "interior": ("images/originals/interieur-original.png", (508, 851)),
    "nails": ("images/originals/ongles-fuchsia-original.png", (1163, 1447)),
    "team": ("images/originals/equipe-original.png", (1447, 1830)),
    "booking": ("images/master/reservation-scene.png", (1700, 2141)),
}


def load_rgb(path):
    img = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
    if img.shape[2] == 4:
        alpha = img[:, :, 3:4].astype(np.float32) / 255
        rgb = (img[:, :, :3].astype(np.float32) * alpha + 128 * (1 - alpha)).astype(np.uint8)
        return rgb, img[:, :, 3]
    return img, None


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    board, _ = load_rgb(BOARD)
    sift = cv2.SIFT_create(nfeatures=6000)
    result = {"board": {"width": board.shape[1], "height": board.shape[0]}}
    for name, (rel, (y0, y1)) in PLATES.items():
        plate, alpha = load_rgb(ROOT / rel)
        band = np.zeros(board.shape[:2], np.uint8)
        band[y0:y1] = 255
        kb, db = sift.detectAndCompute(cv2.cvtColor(board, cv2.COLOR_BGR2GRAY), band)
        kp, dp = sift.detectAndCompute(cv2.cvtColor(plate, cv2.COLOR_BGR2GRAY), alpha)
        matches = cv2.BFMatcher().knnMatch(dp, db, k=2)
        good = [m for m, n in matches if m.distance < 0.75 * n.distance]
        if len(good) < 8:
            result[name] = {"file": rel, "matches": len(good), "registered": False}
            print(f"{name}: only {len(good)} matches, not registered")
            continue
        src = np.float32([kp[m.queryIdx].pt for m in good])
        dst = np.float32([kb[m.trainIdx].pt for m in good])
        M, inliers = cv2.estimateAffinePartial2D(src, dst, method=cv2.RANSAC, ransacReprojThreshold=3)
        n_in = int(inliers.sum()) if inliers is not None else 0
        scale = float(np.hypot(M[0, 0], M[1, 0]))
        angle = float(np.degrees(np.arctan2(M[1, 0], M[0, 0])))
        tx, ty = float(M[0, 2]), float(M[1, 2])
        h, w = plate.shape[:2]
        result[name] = {
            "file": rel, "plate_size": [w, h], "matches": len(good), "inliers": n_in,
            "scale": round(scale, 5), "angle_deg": round(angle, 3),
            "x": round(tx, 2), "y": round(ty, 2),
            "width_board": round(w * scale, 2), "height_board": round(h * scale, 2),
            "registered": n_in >= 12,
        }
        print(name, result[name])
        warped = cv2.warpAffine(plate, M, (board.shape[1], board.shape[0]))
        mask = cv2.warpAffine(alpha if alpha is not None else np.full((h, w), 255, np.uint8), M,
                              (board.shape[1], board.shape[0]))
        blend = board.copy()
        sel = mask > 128
        blend[sel] = (0.5 * board[sel] + 0.5 * warped[sel]).astype(np.uint8)
        ya, yb = max(0, y0 - 80), min(board.shape[0], y1 + 80)
        cv2.imwrite(str(OUT / f"reg-{name}.jpg"), np.hstack([board[ya:yb], blend[ya:yb]]))
    (OUT / "registration.json").write_text(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
