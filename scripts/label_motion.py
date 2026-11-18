"""Which shapes of a label move, and how: used by extract-label.py for the `.live.svg` files.

The print PDFs have no named layers, so parts are found by where they are and what colour
they are. Each label has `classify(i, box, fill, stroke)`, which names a shape's class
(or None), and CSS for those classes. `i` counts the shapes that fall in the label's
front, in the PDF's order; `box` is [x0, y0, x1, y1] in the front's own units.

Shapes keep their place in the paint order: they are classed, not regrouped, and every
shape of one part turns about the same point, so a part moves as one.
Motion is stepped, like the site's other loops, and stops with reduced motion.
"""

HEAD = "@media (prefers-reduced-motion:reduce){*{animation:none!important}}"


def hexsum(h):
    return 999 if not h else sum(int(h[k : k + 2], 16) for k in (1, 3, 5))


# ---- Cheap Dills: the pickle strolls on the spot; his shadow breathes ------------------
PICKLE = set(range(19, 23)) | {24} | set(range(26, 63)) | set(range(79, 83)) | set(range(88, 94))


def cheap_dills(i, box, fill, stroke):
    if i in PICKLE:
        return "pk"
    if i == 63:
        return "sh"
    return None


CHEAP_DILLS_CSS = (
    ".pk{transform-origin:118px 244px;animation:pk 1.1s steps(5,jump-none) infinite alternate}"
    "@keyframes pk{from{transform:rotate(-3deg) translateY(0)}50%{transform:rotate(0deg) translateY(-3.5px)}"
    "to{transform:rotate(3deg) translateY(0)}}"
    ".sh{transform-origin:121px 243px;animation:sh .55s steps(3,jump-none) infinite alternate}"
    "@keyframes sh{from{transform:scaleX(1)}to{transform:scaleX(.9)}}"
)


# ---- Camp Comet: the stars twinkle, the tail shimmers, the speed lines slide ------------
def camp_comet(i, box, fill, stroke):
    w, h = box[2] - box[0], box[3] - box[1]
    if 1118 <= i <= 1124:
        return f"tl t{i - 1118}"
    if i in (14, 15, 16):
        return f"sp s{i - 14}"
    if w < 5 and h < 5 and box[1] < 230:
        return f"st k{i % 4}"
    return None


CAMP_COMET_CSS = (
    ".st{animation:tw 2.4s steps(3,jump-none) infinite alternate}"
    ".k1{animation-delay:-.6s}.k2{animation-delay:-1.2s}.k3{animation-delay:-1.8s}"
    "@keyframes tw{from{opacity:1}to{opacity:.25}}"
    ".tl{transform-origin:132px 150px;animation:tl 1.2s steps(4,jump-none) infinite alternate}"
    + "".join(f".t{k}{{animation-delay:-{k * 0.17:.2f}s}}" for k in range(7))
    + "@keyframes tl{from{transform:scaleY(1)}to{transform:scaleY(.78)}}"
    ".sp{animation:sp 1.6s steps(4,jump-none) infinite alternate}"
    ".s1{animation-delay:-.4s}.s2{animation-delay:-.8s}"
    "@keyframes sp{from{transform:translateX(0)}to{transform:translateX(-7px)}}"
)


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
        return f"b b{ORDER.index(i)}"
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
    return f"b b{ORDER.index(best[1])}" if best else None


CHINGA_CSS = (
    ".b{animation:fl .5s steps(3,jump-none) infinite alternate}"
    + "".join(
        f".b{n}{{transform-origin:{(x0 + x1) / 2:.0f}px {(y0 + y1) / 2:.0f}px;"
        f"animation-delay:-{(n * 0.137) % 0.9:.2f}s;animation-duration:{0.42 + (n % 4) * 0.07:.2f}s}}"
        for n, (x0, y0, x1, y1) in enumerate(WINGS.values())
    )
    + "@keyframes fl{from{transform:translateY(0) rotate(-5deg) scale(1)}"
    "to{transform:translateY(-2.5px) rotate(5deg) scale(.84)}}"
)

MOTION = {
    "cheap-dills": (cheap_dills, CHEAP_DILLS_CSS),
    "camp-comet": (camp_comet, CAMP_COMET_CSS),
    "chinga-la-migra": (chinga_la_migra, CHINGA_CSS),
}
