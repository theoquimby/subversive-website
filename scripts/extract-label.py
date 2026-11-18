"""Lift a label's front artwork out of Max's print PDF as a clean SVG.

Usage: python scripts/extract-label.py <label.pdf> <out.svg> <x0> <y0> <x1> <y1> [flags]
The box is in fractions of the page (0-1). Flags:
  clip          also keep shapes that cross the box's edge, clipped to it
  dropbig=F     drop shapes whose bounds cover more than F of the box (a label's
                background drawing behind the artwork)
  drop=#hex,..  drop unstroked shapes filled with these colours
  bg=#hex       paint this colour behind everything
  parts=id      also cut the label's moving parts out (label_motion.py): writes, beside
                <out.svg>, <id>.base.svg (the label without them), <id>.parts.svg (each
                part in its own cell of one sheet) and the label's entry in parts.json
                (where each part sits on the label and on the sheet)
  cut=a,b,c,d   drop shapes wholly inside this box (page fractions): small print such as
                an ABV line, which the menu states and a label may state differently Keeps only the vector shapes wholly inside
it (the side panels, with the old "Malting" name, the warnings and the barcode, fall
outside), rounds coordinates to 0.1 pt, and writes one <path> per shape with its fill
and stroke, in the PDF's own order. Rasters and live text are dropped (the labels have
none in their artwork; all type is outlined).

The source PDFs stay out of the repo: they carry the old name on their side panels.
"""

import json
import math
import sys
from pathlib import Path

import pymupdf
from PIL import Image, ImageChops, ImageFilter

GAP = 4  # between cells of a parts sheet, so no part's edge shows in its neighbour's picture


def fmt(v: float) -> str:
    s = f"{v:.1f}"
    return s[:-2] if s.endswith(".0") else s


def pt(p, ox: float, oy: float) -> str:
    return f"{fmt(p.x - ox)} {fmt(p.y - oy)}"


def color(c) -> str:
    if c is None:
        return "none"
    r, g, b = (round(v * 255) for v in c[:3])
    return f"#{r:02x}{g:02x}{b:02x}"


def path_d(items, ox: float, oy: float) -> str:
    out = []
    cur = None
    for it in items:
        kind = it[0]
        if kind == "l":
            a, b = it[1], it[2]
            if cur is None or abs(cur.x - a.x) > 0.05 or abs(cur.y - a.y) > 0.05:
                out.append(f"M{pt(a, ox, oy)}")
            out.append(f"L{pt(b, ox, oy)}")
            cur = b
        elif kind == "c":
            a, c1, c2, b = it[1], it[2], it[3], it[4]
            if cur is None or abs(cur.x - a.x) > 0.05 or abs(cur.y - a.y) > 0.05:
                out.append(f"M{pt(a, ox, oy)}")
            out.append(f"C{pt(c1, ox, oy)} {pt(c2, ox, oy)} {pt(b, ox, oy)}")
            cur = b
        elif kind == "re":
            r = it[1]
            out.append(
                f"M{fmt(r.x0 - ox)} {fmt(r.y0 - oy)}H{fmt(r.x1 - ox)}V{fmt(r.y1 - oy)}H{fmt(r.x0 - ox)}Z"
            )
            cur = None
        elif kind == "qu":
            q = it[1]
            out.append(
                f"M{pt(q.ul, ox, oy)}L{pt(q.ur, ox, oy)}L{pt(q.lr, ox, oy)}L{pt(q.ll, ox, oy)}Z"
            )
            cur = None
    return "".join(out)


def toucher(w: float, h: float, shapes):
    """touch(n, m): whether shapes n and m really overlap (their pixels, not their boxes)."""
    masks: dict[int, Image.Image] = {}

    def mask(n: int) -> Image.Image:
        if n not in masks:
            svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{fmt(w)}" height="{fmt(h)}" viewBox="0 0 {fmt(w)} {fmt(h)}">{shapes[n][0]}</svg>'
            pix = pymupdf.open(stream=svg.encode(), filetype="svg")[0].get_pixmap(matrix=pymupdf.Matrix(2, 2), alpha=True)
            alpha = Image.frombytes("RGBA", (pix.width, pix.height), pix.samples).getchannel("A")
            # a pixel wider all round: soft edges touch before the shapes do
            masks[n] = alpha.point(lambda v: 255 if v else 0).filter(ImageFilter.MaxFilter(3))
        return masks[n]

    return lambda n, m: ImageChops.multiply(mask(n), mask(m)).getbbox() is not None


def layers_of(shapes, touch) -> list[tuple]:
    """Sort the label's shapes into layers that, stacked, paint the same picture: the base
    (everything still that lies under the parts), then each part, and wherever still art
    lies over a part (a title across a character) a still layer over it, and the part's
    later shapes over that. A shape goes in the lowest layer of its own kind that is above
    every earlier shape it really touches."""

    def boxes_meet(a, b) -> bool:
        return a[0] < b[2] and b[0] < a[2] and a[1] < b[3] and b[1] < a[3]

    layers: list[tuple] = [(None, [])]  # (part or None, the indices of its shapes)
    for n, (_, part, bounds) in enumerate(shapes):
        under = 0
        home = None
        for at in range(len(layers) - 1, -1, -1):
            near = [m for m in layers[at][1] if boxes_meet(bounds, shapes[m][2])]
            if not near:
                continue
            if layers[at][0] == part:
                home = at  # its own kind, and nothing above it is in the way
                break
            if at == 0 and part is None:
                break
            if any(touch(n, m) for m in near):
                under = at
                break
        if home is None:
            home = next(
                (k for k in range(under, len(layers)) if layers[k][0] == part and (k > under or under == 0 and part is None)),
                None,
            )
        if home is None:
            layers.append((part, []))
            home = len(layers) - 1
        layers[home][1].append(n)
    return layers


def write_parts(dst: Path, ident: str, w: float, h: float, shapes, table, wrap) -> None:
    """Cut the label into a base and a sheet of layers. `shapes` is the label in paint
    order: (markup, part or None, bounds). The page lays the sheet's cells over the base in
    the list's order (check-label-parts.py compares that with the whole label)."""
    touch = toucher(w, h, shapes)
    # a part marked `cling` is a body (its first shape) and what is drawn on it: a shape
    # found by its place and colour that does not touch the body is a neighbour's, and stays
    body: dict[str, int] = {}
    for n, (markup, part, bounds) in enumerate(shapes):
        if part and table[part].get("cling") and not touch(n, body.setdefault(part, n)):
            shapes[n] = (markup, None, bounds)
    layers = layers_of(shapes, touch)
    cells = []
    x = y = row = sheet_w = 0
    for name, mine in layers[1:]:
        spec = table[name] if name else {"kind": "still"}
        # the layer's box on the label: whole units, and no further than the label's edge
        x0 = max(0, math.floor(min(shapes[n][2][0] for n in mine)))
        y0 = max(0, math.floor(min(shapes[n][2][1] for n in mine)))
        x1 = min(math.ceil(w), math.ceil(max(shapes[n][2][2] for n in mine)))
        y1 = min(math.ceil(h), math.ceil(max(shapes[n][2][3] for n in mine)))
        bw, bh = x1 - x0, y1 - y0
        if x and x + bw > max(w, bw):
            x, y, row = 0, y + row + GAP, 0
        cell = {"kind": spec["kind"], "box": [x0, y0, bw, bh], "at": [x, y]}
        if "origin" in spec:
            # every layer of one part turns about the same point, so the part moves as one
            cell["origin"] = [round(v, 1) for v in spec["origin"]]
        for k in ("delay", "time"):
            if spec.get(k):
                cell[k] = spec[k]
        cells.append((cell, "".join(shapes[n][0] for n in mine)))
        sheet_w = max(sheet_w, x + bw)
        x, row = x + bw + GAP, max(row, bh)
    for name in table:
        if not any(layer[0] == name for layer in layers):
            sys.exit(f"{ident}: no shapes for part {name}")
    sheet_h = y + row
    # each cell: the layer, moved from its place on the label and clipped to its box
    sheet = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{sheet_w}" height="{sheet_h}" viewBox="0 0 {sheet_w} {sheet_h}">'
        + "".join(
            f'<clipPath id="c{k}"><path d="M{c["at"][0]} {c["at"][1]}h{c["box"][2]}v{c["box"][3]}h-{c["box"][2]}Z"/></clipPath>'
            f'<g clip-path="url(#c{k})"><g transform="translate({c["at"][0] - c["box"][0]} {c["at"][1] - c["box"][1]})">{body}</g></g>'
            for k, (c, body) in enumerate(cells)
        )
        + "</svg>\n"
    )
    base = wrap("".join(shapes[n][0] for n in layers[0][1]))
    for name, text in ((f"{ident}.base.svg", base), (f"{ident}.parts.svg", sheet)):
        with open(dst.with_name(name), "w", encoding="utf-8", newline="\n") as f:
            f.write(text)
        print(f"{dst.with_name(name)}: {len(text)} bytes")
    print(f"{ident}: {len(cells)} layers over the base: " + " ".join(c["kind"] for c, _ in cells))
    book = dst.with_name("parts.json")
    every = json.loads(book.read_text(encoding="utf-8")) if book.exists() else {}
    every[ident] = {"view": [round(w, 1), round(h, 1)], "sheet": [sheet_w, sheet_h], "parts": [c for c, _ in cells]}
    with open(book, "w", encoding="utf-8", newline="\n") as f:
        f.write(json.dumps(dict(sorted(every.items())), separators=(",", ":")) + "\n")


def main() -> None:
    src, dst = sys.argv[1], sys.argv[2]
    fx0, fy0, fx1, fy1 = (float(v) for v in sys.argv[3:7])
    page = pymupdf.open(src)[0]
    W, H = page.rect.width, page.rect.height
    flags = dict((f.split("=", 1) + [""])[:2] for f in sys.argv[7:])
    clip = "clip" in flags
    dropbig = float(flags["dropbig"]) if "dropbig" in flags else None
    cut = None
    if "cut" in flags:
        c = [float(v) for v in flags["cut"].split(",")]
        cut = pymupdf.Rect(c[0] * W, c[1] * H, c[2] * W, c[3] * H)
    drop = set(flags["drop"].lower().split(",")) if "drop" in flags else set()
    box = pymupdf.Rect(fx0 * W, fy0 * H, fx1 * W, fy1 * H)
    ox, oy = box.x0, box.y0
    parts: list[tuple] = []
    backs: list[tuple] = []
    idx = -1
    classify, table = None, {}
    if flags.get("parts"):
        sys.path.insert(0, str(Path(__file__).parent))
        from label_motion import PARTS

        classify, table = PARTS[flags["parts"]]
    for dr in page.get_drawings():
        r = dr["rect"]
        inside = box.x0 - 0.5 <= r.x0 and r.x1 <= box.x1 + 0.5 and box.y0 - 0.5 <= r.y0 and r.y1 <= box.y1 + 0.5
        if not inside and not (clip and r.intersects(box)):
            continue
        idx += 1
        if cut is not None and cut.contains(r):
            continue
        if dropbig is not None and r.width * r.height > dropbig * box.width * box.height:
            continue
        if dr["type"] == "f" and color(dr.get("fill")) in drop:
            continue
        d = path_d(dr["items"], ox, oy)
        if not d:
            continue
        if dr.get("closePath"):
            d += "Z"
        attrs = []
        fill = color(dr.get("fill")) if dr["type"] in ("f", "fs") else "none"
        attrs.append(f'fill="{fill}"')
        if dr.get("even_odd") and fill != "none":
            attrs.append('fill-rule="evenodd"')
        stroked = dr["type"] in ("s", "fs") and dr.get("color") is not None
        if stroked:
            attrs.append(f'stroke="{color(dr["color"])}"')
            attrs.append(f'stroke-width="{fmt(dr.get("width") or 1)}"')
            if dr.get("lineCap"):
                caps = {0: "butt", 1: "round", 2: "square"}
                cap = dr["lineCap"][0] if isinstance(dr["lineCap"], (list, tuple)) else dr["lineCap"]
                if cap:
                    attrs.append(f'stroke-linecap="{caps.get(cap, "butt")}"')
            if dr.get("lineJoin"):
                joins = {0: "miter", 1: "round", 2: "bevel"}
                attrs.append(f'stroke-linejoin="{joins.get(int(dr["lineJoin"]), "miter")}"')
        rr = [r.x0 - ox, r.y0 - oy, r.x1 - ox, r.y1 - oy]
        part = None
        if classify:
            part = classify(
                idx,
                rr,
                color(dr.get("fill")) if dr["type"] in ("f", "fs") else None,
                color(dr.get("color")) if dr["type"] in ("s", "fs") else None,
            )
        op = dr.get("fill_opacity") if fill != "none" else dr.get("stroke_opacity")
        if op is not None and op < 0.999:
            attrs.append(f'opacity="{fmt(op)}"')
        # a shape covering most of the panel is a background: the print files lay some of
        # them over the art with a blend mode, so here they go to the back
        back = r.width * r.height > 0.45 * box.width * box.height
        # a part's box leaves room for soft edges, and for a pen's width and its mitres
        pad = 1 + (1.5 * (dr.get("width") or 1) if stroked else 0)
        bounds = [rr[0] - pad, rr[1] - pad, rr[2] + pad, rr[3] + pad]
        shape = (f'<path d="{d}" {" ".join(attrs)}/>', None if back else part, bounds)
        (backs if back else parts).append(shape)
    shapes = backs + parts

    def wrap(body: str) -> str:
        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{fmt(box.width)}" height="{fmt(box.height)}" viewBox="0 0 {fmt(box.width)} {fmt(box.height)}">'
            + (f'<clipPath id="c"><path d="M0 0H{fmt(box.width)}V{fmt(box.height)}H0Z"/></clipPath><g clip-path="url(#c)">' if clip else "")
            + (f'<path d="M0 0H{fmt(box.width)}V{fmt(box.height)}H0Z" fill="{flags["bg"]}"/>' if flags.get("bg") else "")
            + body
            + ("</g>" if clip else "")
            + "</svg>\n"
        )

    svg = wrap("".join(s[0] for s in shapes))
    with open(dst, "w", encoding="utf-8", newline="\n") as f:
        f.write(svg)
    print(f"{dst}: {len(shapes)} shapes, {len(svg) // 1024} KB")
    if table:
        write_parts(Path(dst), flags["parts"], box.width, box.height, shapes, table, wrap)


if __name__ == "__main__":
    main()
