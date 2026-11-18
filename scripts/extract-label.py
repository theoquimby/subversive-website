"""Lift a label's front artwork out of Max's print PDF as a clean SVG.

Usage: python scripts/extract-label.py <label.pdf> <out.svg> <x0> <y0> <x1> <y1> [flags]
The box is in fractions of the page (0-1). Flags:
  clip          also keep shapes that cross the box's edge, clipped to it
  dropbig=F     drop shapes whose bounds cover more than F of the box (a label's
                background drawing behind the artwork)
  drop=#hex,..  drop unstroked shapes filled with these colours
  bg=#hex       paint this colour behind everything
  live=id       class the label's moving parts and embed their CSS (label_motion.py)
  cut=a,b,c,d   drop shapes wholly inside this box (page fractions): small print such as
                an ABV line, which the menu states and a label may state differently Keeps only the vector shapes wholly inside
it (the side panels, with the old "Malting" name, the warnings and the barcode, fall
outside), rounds coordinates to 0.1 pt, and writes one <path> per shape with its fill
and stroke, in the PDF's own order. Rasters and live text are dropped (the labels have
none in their artwork; all type is outlined).

The source PDFs stay out of the repo: they carry the old name on their side panels.
"""

import sys

import pymupdf


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
    parts: list[str] = []
    backs: list[str] = []
    idx = -1
    classify, css = None, ""
    if flags.get("live"):
        sys.path.insert(0, str(__import__("pathlib").Path(__file__).parent))
        from label_motion import HEAD, MOTION

        classify, css = MOTION[flags["live"]]
        css = HEAD + css
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
        if dr["type"] in ("s", "fs") and dr.get("color") is not None:
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
        if classify:
            rr = [r.x0 - ox, r.y0 - oy, r.x1 - ox, r.y1 - oy]
            cls = classify(
                idx,
                rr,
                color(dr.get("fill")) if dr["type"] in ("f", "fs") else None,
                color(dr.get("color")) if dr["type"] in ("s", "fs") else None,
            )
            if cls:
                attrs.append(f'class="{cls}"')
        op = dr.get("fill_opacity") if fill != "none" else dr.get("stroke_opacity")
        if op is not None and op < 0.999:
            attrs.append(f'opacity="{fmt(op)}"')
        # a shape covering most of the panel is a background: the print files lay some of
        # them over the art with a blend mode, so here they go to the back
        back = r.width * r.height > 0.45 * box.width * box.height
        (backs if back else parts).append(f'<path d="{d}" {" ".join(attrs)}/>')
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {fmt(box.width)} {fmt(box.height)}">'
        + (f"<style>{css}</style>" if css else "")
        + (f'<clipPath id="c"><path d="M0 0H{fmt(box.width)}V{fmt(box.height)}H0Z"/></clipPath><g clip-path="url(#c)">' if clip else "")
        + (f'<path d="M0 0H{fmt(box.width)}V{fmt(box.height)}H0Z" fill="{flags["bg"]}"/>' if flags.get("bg") else "")
        + "".join(backs + parts)
        + ("</g>" if clip else "")
        + "</svg>\n"
    )
    with open(dst, "w", encoding="utf-8", newline="\n") as f:
        f.write(svg)
    print(f"{dst}: {len(backs) + len(parts)} shapes, {len(svg) // 1024} KB")


if __name__ == "__main__":
    main()
