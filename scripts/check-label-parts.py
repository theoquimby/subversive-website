"""Check that a label cut into layers still paints the same picture as the whole label.

Usage: python scripts/check-label-parts.py [folder for the pictures it compares]
For each label in public/brand/labels/parts.json: draws <id>.base.svg, lays each part's
cell of <id>.parts.svg over it at its box, in the list's order (as Can.tsx does), and
compares the result with <id>.svg. Parts are lifted out of the label's paint order, so a
shape that should lie over a part would show here as a difference. Fails if any pixel
differs by more than a rounding of soft edges.
"""

import io
import json
import sys
from pathlib import Path

import pymupdf
from PIL import Image, ImageChops

SCALE = 3  # a phone's pixels per unit, near enough
LIMIT = 24  # of 255: two renderings of one soft edge differ by less

labels = Path(__file__).resolve().parent.parent / "public" / "brand" / "labels"
keep = Path(sys.argv[1]) if len(sys.argv) > 1 else None


def draw(name: str) -> Image.Image:
    page = pymupdf.open(labels / name)[0]
    pix = page.get_pixmap(matrix=pymupdf.Matrix(SCALE, SCALE), alpha=True)
    return Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGBA")


bad = False
for ident, entry in json.loads((labels / "parts.json").read_text(encoding="utf-8")).items():
    whole = draw(f"{ident}.svg")
    built = draw(f"{ident}.base.svg")
    sheet = draw(f"{ident}.parts.svg")
    for part in entry["parts"]:
        (x, y, w, h), (ax, ay) = part["box"], part["at"]
        cell = sheet.crop((ax * SCALE, ay * SCALE, (ax + w) * SCALE, (ay + h) * SCALE))
        built.alpha_composite(cell, (x * SCALE, y * SCALE))
    size = (min(whole.width, built.width), min(whole.height, built.height))
    diff = ImageChops.difference(whole.crop((0, 0, *size)).convert("RGB"), built.crop((0, 0, *size)).convert("RGB"))
    worst = max(hi for _, hi in diff.getextrema())
    over = sum(diff.convert("L").histogram()[LIMIT + 1 :])
    print(f"{ident}: {len(entry['parts'])} parts, worst difference {worst}/255, {over} pixels over {LIMIT}")
    if keep:
        keep.mkdir(parents=True, exist_ok=True)
        whole.save(keep / f"{ident}.whole.png")
        built.save(keep / f"{ident}.built.png")
        diff.point(lambda v: min(255, v * 8)).save(keep / f"{ident}.diff.png")
    bad = bad or over > 0
sys.exit(1 if bad else 0)
