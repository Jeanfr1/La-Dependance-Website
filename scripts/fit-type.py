#!/usr/bin/env python3
"""Measure every text line of the approved board and fit the kit fonts to it.

For each line: tight ink box on the board (pixel scan inside a search box), then the
font size whose rendered ink height matches, and the horizontal scale that makes the
rendered ink width match. Results (board px) go to src/data/board-type.json; the CSS
reads them through custom properties, so the page sets its words where the board has them.

python3 scripts/fit-type.py   (Pillow + numpy)
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
BOARD = np.asarray(Image.open(ROOT / "references/Modele3-A-Part-Approuve.png").convert("RGB")).astype(int)
FONTS = {
    "anton": ROOT / "fonts-print/Anton-400.ttf",
    "manrope": ROOT / "fonts-print/Manrope-400.ttf",
    "manrope600": ROOT / "fonts-print/Manrope-600.ttf",
    "caveat": ROOT / "fonts-print/Caveat-500.ttf",
}
PRUNE = np.array([61, 36, 53])
IVORY = np.array([245, 239, 231])

# id, text, font, ink colour, search box (x0, y0, x1, y1) on the board
LINES = [
    ("nav1", "Ongles", "manrope", "prune", (240, 22, 295, 46)),
    ("nav2", "Regard", "manrope", "prune", (315, 22, 370, 46)),
    ("nav3", "L’institut", "manrope", "prune", (390, 22, 455, 46)),
    ("header-cta", "PRENDRE RENDEZ-VOUS ↗", "manrope600", "prune", (548, 24, 692, 40)),
    ("script", "votre beauté", "caveat", "mauve", (70, 140, 262, 200)),
    ("title", "PART.", "anton", "prune", (105, 196, 350, 375)),
    ("title-a", "À", "anton", "prune", (25, 196, 100, 375)),
    ("lead1", "La beauté des ongles et du regard,", "manrope", "prune", (25, 380, 300, 402)),
    ("lead2", "à Pontchâteau.", "manrope", "prune", (25, 403, 160, 424)),
    ("hero-cta", "RÉSERVER SUR PLANITY ↗", "manrope600", "ivory", (50, 446, 210, 462)),
    ("place1", "UNE ADRESSE.", "anton", "ivory", (28, 555, 290, 622)),
    ("place2", "VOTRE PARENTHÈSE.", "anton", "ivory", (28, 622, 390, 686)),
    ("place-sub", "La Dépendance · Au sein de La Maison B", "manrope", "ivory", (30, 690, 260, 708)),
    ("services1", "CHACUNE", "anton", "prune", (118, 858, 460, 975)),
    ("services2", "SON", "anton", "prune", (40, 1000, 200, 1100)),
    ("services2b", "SON ÉCLAT.", "anton", "prune", (40, 985, 465, 1100)),
    ("services-links", "Onglerie", "manrope", "prune", (44, 1110, 100, 1132)),
    ("services-cta", "DÉCOUVRIR LES PRESTATIONS ↗", "manrope600", "prune", (498, 1110, 690, 1132)),
    ("eyebrow", "Ongles & regard", "manrope", "ivory", (24, 1188, 135, 1208)),
    ("create1", "DESSINER.", "anton", "ivory", (24, 1208, 245, 1279)),
    ("create2", "SOULIGNER.", "anton", "ivory", (24, 1279, 275, 1349)),
    ("create3", "R", "anton", "ivory", (24, 1352, 62, 1418)),
    ("team1", "Le sens du détail.", "manrope", "ivory", (34, 1494, 240, 1524)),
    ("team2", "Le plaisir du lien.", "manrope", "ivory", (34, 1526, 240, 1557)),
    ("book1", "VOTRE", "anton", "prune", (28, 1782, 240, 1886)),
    ("book2", "MOMENT.", "anton", "prune", (28, 1884, 325, 1988)),
    ("book-lead", "Choisissez votre rendez-vous sur Planity.", "manrope", "prune", (30, 1990, 295, 2012)),
    ("book-cta", "PRENDRE RENDEZ-VOUS ↗", "manrope600", "ivory", (60, 2024, 225, 2042)),
    ("addr", "22 Grande Rue · 44160 Pontchâteau", "manrope", "prune", (58, 2068, 245, 2092)),
    ("insta", "@ladependance_beauteduregard", "manrope", "prune", (58, 2093, 235, 2117)),
]


def ink_box(box, colour):
    x0, y0, x1, y1 = box
    crop = BOARD[y0:y1, x0:x1]
    lum = crop.mean(axis=2)
    if colour == "ivory":
        mask = lum > np.percentile(lum, 50) + 0.45 * (lum.max() - np.percentile(lum, 50))
    else:
        mask = lum < np.percentile(lum, 50) - 0.45 * (np.percentile(lum, 50) - lum.min())
    rows, cols = np.where(mask)
    if not len(rows):
        return None
    return [int(x0 + cols.min()), int(y0 + rows.min()), int(x0 + cols.max() + 1), int(y0 + rows.max() + 1)]


def render_ink(text, font_key, size):
    font = ImageFont.truetype(str(FONTS[font_key]), size)
    img = Image.new("L", (int(size * len(text) * 1.2) + 40, int(size * 2.2)), 0)
    d = ImageDraw.Draw(img)
    d.text((20, int(size * 0.4)), text, font=font, fill=255)
    a = np.asarray(img)
    rows, cols = np.where(a > 110)
    asc = font.getmetrics()[0]
    top_from_baseline = int(size * 0.4) + asc - rows.min()
    return cols.max() - cols.min() + 1, rows.max() - rows.min() + 1, top_from_baseline


def fit(text, font_key, ink_h):
    """Ink height is linear in the font size: measure once at 400 px."""
    return 400 * ink_h / render_ink(text, font_key, 400)[1]


def main():
    out = {}
    for key, text, font, colour, box in LINES:
        ink = ink_box(box, colour)
        if ink is None:
            print("no ink", key)
            continue
        w, h = ink[2] - ink[0], ink[3] - ink[1]
        size = fit(text, font, h)
        rw, rh, top = render_ink(text, font, 400)
        rw, top = rw * size / 400, top * size / 400
        out[key] = {
            "text": text, "font": font, "ink": ink,
            "size": round(size, 2), "scale_x": round(w / max(rw, 1), 3),
            "baseline": round(ink[1] + top, 1),
        }
        print(f"{key:15s} ink={ink} size={size:6.2f} scaleX={w / max(rw, 1):.3f}")
    dest = ROOT / "src/data/board-type.json"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(out, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
