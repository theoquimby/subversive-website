"""Rebuild every label front in public/brand/labels from Max's print PDFs.

Usage: python scripts/extract-labels.py <folder holding the PDFs>
The PDFs are not in the repo (their side panels carry the old name). Each row: the PDF,
the label's id (the menu item's id where the beer is on the menu), the front panel's box
as page fractions, and extract-label.py flags. Heritage Grape (a raster scan) and the
Saison ("house-made malts" is set in its ring) are left out. The ABV and size lines are
cropped or cut: the menu states them.
Afterwards: python scripts/check-label-parts.py (the cut labels still paint the same).
"""

import subprocess
import sys
from pathlib import Path

ROWS = [
    ("CHEAP DILLS_ROUND_1.pdf", "cheap-dills", "0.29 0.1 0.77 0.925", "clip bg=#fbefd5"),
    ("ChingaLaMigra_1.pdf", "chinga-la-migra", "0.28 0.05 0.69 0.83", "drop=#fff7ed,#fff5d6 dropbig=0.2 bg=#ffffff"),
    ("Comet_JUNE2026.pdf", "camp-comet", "0.27 0 0.77 0.935", "clip"),
    ("FESTBIER_2026.pdf", "festbier", "0.27 0 0.78 0.865", "clip"),
    ("GoldenLime_16oz.pdf", "golden-lime", "0.24 0.02 0.8 0.94", "clip dropbig=0.45 bg=#fdf1d3"),
    ("Marzen_2026_updated.pdf", "mountain-marzen", "0.22 0 0.77 1", "clip cut=0.42,0.775,0.58,0.815"),
    ("ForbiddenFruit.pdf", "forbidden-fruit", "0.22 0.14 0.78 0.9", "clip"),
    ("off axis_SKETCH_1F.pdf", "off-axis", "0.27 0.06 0.775 0.93", "clip drop=#ffffff"),
    ("Hoppy American_JUN13_b.pdf", "hoppy-american-lager", "0.27 0 0.8 0.93", "clip"),
]

src = Path(sys.argv[1])
out = Path(__file__).resolve().parent.parent / "public" / "brand" / "labels"
out.mkdir(parents=True, exist_ok=True)
tool = Path(__file__).with_name("extract-label.py")
PARTS = {"cheap-dills", "camp-comet", "chinga-la-migra"}  # labels with moving parts (label_motion.py)
for pdf, ident, box, flags in ROWS:
    more = [f"parts={ident}"] if ident in PARTS else []
    subprocess.run(
        [sys.executable, str(tool), str(src / pdf), str(out / f"{ident}.svg"), *box.split(), *flags.split(), *more],
        check=True,
    )
