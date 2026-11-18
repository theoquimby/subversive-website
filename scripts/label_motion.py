"""Which shapes of a label move: used by extract-label.py to cut a label into layers.

The print PDFs have no named layers, so parts are found by where they are and what colour
they are. Each label has `part_of(i, box, fill, stroke)`, which names the part a shape
belongs to (or None: it stays in the base), and a table of its parts. `i` counts the
shapes that fall in the label's front, in the PDF's order; `box` is [x0, y0, x1, y1] in
the front's own units.

Why layers (Theo, 2026-11-18: "janky feeling and bad frame rate"): the first attempt put
the motion in the label's own SVG, and a browser redraws all of an SVG image on every step.
Now each part is cut out into its own small picture (`<id>.parts.svg`, a sheet of them) and
the label is kept without them (`<id>.base.svg`); the page draws each once and then only
moves or fades the pictures (Can.tsx, fx-can.css: the motion itself lives there, by `kind`).

A part: kind (which keyframes), origin (the point it turns or scales about, in the
front's units), optionally delay and time in seconds (so a flock is out of step), and
cling (keep only the shapes that touch the part's first shape, its body).
"""


def hexsum(h):
    return 999 if not h else sum(int(h[k : k + 2], 16) for k in (1, 3, 5))


# ---- Cheap Dills: the pickle rocks and bobs on the spot; his shadow breathes -----------
# (19-22 and 24 are an earlier drawing of him, left under the yellow oval: never seen, so
# they stay still, and the oval need not be lifted over them)
PICKLE = set(range(26, 63)) | set(range(79, 83)) | set(range(88, 94))


def cheap_dills(i, box, fill, stroke):
    if i in PICKLE:
        return "pickle"
    if i == 63:
        return "shadow"
    return None


CHEAP_DILLS = {
    "shadow": {"kind": "shadow", "origin": (121, 243)},
    "pickle": {"kind": "pickle", "origin": (118, 244)},
}


# ---- Camp Comet: the stars twinkle in four groups; the tail shimmers --------------------
# the six streaks above the comet, by index: each with its mirror, from the middle out
TAIL = {1119: 0, 1121: 0, 1120: 1, 1122: 1, 1123: 2, 1124: 2}
STARS = []  # (box, group) of the stars so far


def camp_comet(i, box, fill, stroke):
    w, h = box[2] - box[0], box[3] - box[1]
    if i in TAIL:
        return f"tail{TAIL[i]}"
    if w < 5 and h < 5 and box[1] < 230 and i > 16 and i < 1118:
        # dealt round the four groups, but a star that touches others joins the topmost of
        # their groups: a group is one picture, laid over the groups before it, so a star
        # may lie over a lower group's star and never under a higher one's
        near = [g for b, g in STARS if b[0] < box[2] + 3 and box[0] < b[2] + 3 and b[1] < box[3] + 3 and box[1] < b[3] + 3]
        group = max(near) if near else len(STARS) % 4
        STARS.append((box, group))
        return f"stars{group}"
    return None


CAMP_COMET = {
    **{f"stars{k}": {"kind": "star", "delay": round(-0.6 * k, 1)} for k in range(4)},
    **{f"tail{k}": {"kind": "tail", "origin": (132, 150), "delay": round(-0.4 * k, 1)} for k in range(3)},
}


# ---- Chinga La Migra: the monarchs flutter ---------------------------------------------
# the twelve silhouettes, by index, with their boxes
WINGS = {
    31: [107, 30, 172, 85],
    32: [94, 74, 143, 118],
    33: [121, 4, 173, 46],
    34: [165, 50, 211, 87],
    35: [74, 11, 113, 51],
    36: [120, 112, 152, 140],
    37: [100, 2, 126, 25],
    38: [147, 30, 181, 54],
    39: [146, 75, 174, 97],
    40: [138, 96, 160, 115],
    41: [184, 82, 208, 101],
    68: [59, 46, 88, 74],
}
ORDER = list(WINGS)


def chinga_la_migra(i, box, fill, stroke):
    if i in WINGS:
        return f"wing{ORDER.index(i)}"
    if i < 42 or fill is None:
        return None
    # a wing's markings: orange, white or black, lying inside one silhouette
    s = hexsum(fill)
    orange = fill.startswith("#f7") or fill.startswith("#f8")
    if not (orange or s > 740 or s < 130):
        return None
    cx, cy = (box[0] + box[2]) / 2, (box[1] + box[3]) / 2
    best = None
    for k, (x0, y0, x1, y1) in WINGS.items():
        if x0 - 1.5 <= box[0] and box[2] <= x1 + 1.5 and y0 - 1.5 <= box[1] and box[3] <= y1 + 1.5:
            d = (cx - (x0 + x1) / 2) ** 2 + (cy - (y0 + y1) / 2) ** 2
            if best is None or d < best[0]:
                best = (d, k)
    return f"wing{ORDER.index(best[1])}" if best else None


# each a little out of step: its own beat and its own place in it
CHINGA = {
    f"wing{n}": {
        "kind": "wing",
        "cling": True,
        "origin": ((x0 + x1) / 2, (y0 + y1) / 2),
        "delay": round(-((n * 0.137) % 0.9), 2),
        "time": round(0.42 + (n % 4) * 0.07, 2),
    }
    for n, (x0, y0, x1, y1) in enumerate(WINGS.values())
}

PARTS = {
    "cheap-dills": (cheap_dills, CHEAP_DILLS),
    "camp-comet": (camp_comet, CAMP_COMET),
    "chinga-la-migra": (chinga_la_migra, CHINGA),
}
