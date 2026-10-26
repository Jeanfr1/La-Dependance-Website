#!/usr/bin/env python3
"""Subset the kit's OFL fonts (fonts-print/*.ttf) to Latin + French and write WOFF2.

src/fonts/*.woff2 is imported by the CSS, so Vite fingerprints the files.
~/anaconda3/bin/python3 scripts/build-fonts.py   (fontTools + brotli)
"""
from pathlib import Path

from fontTools import subset

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src/fonts"
UNICODES = "U+0020-007E,U+00A0-00FF,U+0152-0153,U+0178,U+2013-2014,U+2018-201E,U+2022,U+2026,U+20AC"
FONTS = ["Anton-400", "Manrope-400", "Manrope-600", "Caveat-500"]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name in FONTS:
        options = subset.Options()
        options.flavor = "woff2"
        options.layout_features = ["kern", "liga", "calt", "ccmp", "locl", "mark", "mkmk"]
        options.name_IDs = ["*"]
        font = subset.load_font(str(ROOT / f"fonts-print/{name}.ttf"), options)
        subsetter = subset.Subsetter(options)
        subsetter.populate(unicodes=subset.parse_unicodes(UNICODES))
        subsetter.subset(font)
        dest = OUT / f"{name}.woff2"
        subset.save_font(font, str(dest), options)
        print(dest.name, dest.stat().st_size)
    for lic in ["Anton-OFL.txt", "Manrope-OFL.txt", "Caveat-OFL.txt"]:
        (OUT / lic).write_bytes((ROOT / "fonts-print" / lic).read_bytes())


if __name__ == "__main__":
    main()
