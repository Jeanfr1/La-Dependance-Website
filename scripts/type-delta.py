#!/usr/bin/env python3
"""Compare text ink boxes: board vs rendered page (middle panel of qa/board-compare.png).
Prints, per line, the shift of the page ink box against the board (board px)."""
import importlib.util
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("fit", ROOT / "scripts/fit-type.py")
fit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fit)

sheet = Image.open(ROOT / "qa/board-compare.png").convert("RGB")
page = np.asarray(sheet.crop((754, 0, 754 + 734, sheet.height))).astype(int)
board = fit.BOARD
for key, text, font, colour, box in fit.LINES:
    fit.BOARD = board
    a = fit.ink_box(box, colour)
    fit.BOARD = page
    b = fit.ink_box(box, colour)
    if not a or not b:
        print(f"{key:15s} missing", a, b)
        continue
    d = [b[i] - a[i] for i in range(4)]
    flag = "  <-" if max(abs(v) for v in d) > 3 else ""
    print(f"{key:15s} dx0={d[0]:+3d} dy0={d[1]:+3d} dx1={d[2]:+3d} dy1={d[3]:+3d}  w {a[2]-a[0]}->{b[2]-b[0]}  h {a[3]-a[1]}->{b[3]-b[1]}{flag}")
