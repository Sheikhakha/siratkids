#!/usr/bin/env python3
"""Generate the traditional Islamic manuscript page frame as STRETCH-FREE
tiles: the frame is assembled from fixed-size corner medallions plus
seamlessly repeating edge bands, so the rosettes stay circular and the
linework stays crisp at ANY page size / aspect.

Writes into images/:
  * mushaf-band-h.svg  - horizontal edge tile (140x64): braided rope row,
                         one gold floral rosette + two gold motifs, outer rule
  * mushaf-band-v.svg  - vertical edge tile (64x140, same band rotated)
  * mushaf-corner.svg  - 64x64 corner medallion with rope continuing to the
                         tile edges (seams match the band exactly)

CSS assembles them with multiple backgrounds: 4 corners (fixed size) +
4 repeating edge bands. Pure black linework, gold floral rosette band,
empty interior for the mushaf text.

Design grid (band 0..64):
  * outer rule          y/x 8
  * braided rope        y/x 12..28 (circles r=7 at y 17/25, every 28px)
  * rosette band        centre y/x 40 (rosette r=15, motifs r=7)
  * inner double rule   drawn by CSS inset (not in the tile)
  * interior            blank
"""
import math
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTDIR = os.path.join(ROOT, "images")

INK = "#1a1a1a"
GOLD = "#c9a227"


def pt(r, a_deg):
    a = math.radians(a_deg)
    return round(r * math.cos(a), 2), round(r * math.sin(a), 2)


def petal_ring(n, r_base, r_tip, bulge, start_deg=0.0):
    """Continuous closed ring of n pointed petals (one path, no overlaps)."""
    seg = 360.0 / n
    d = []
    for i in range(n):
        a0 = start_deg + i * seg
        a1 = start_deg + (i + 0.5) * seg
        q0 = pt(r_base, a0)
        q1 = pt(r_base, a0 + seg)
        tip = pt(r_tip, a1)
        mx, my = (q0[0] + tip[0]) / 2, (q0[1] + tip[1]) / 2
        ml = math.hypot(mx, my) or 1
        c1 = (round(q0[0] + (tip[0] - q0[0]) * 0.6 + mx / ml * bulge, 2),
              round(q0[1] + (tip[1] - q0[1]) * 0.6 + my / ml * bulge, 2))
        mx2, my2 = (q1[0] + tip[0]) / 2, (q1[1] + tip[1]) / 2
        ml2 = math.hypot(mx2, my2) or 1
        c2 = (round(q1[0] + (tip[0] - q1[0]) * 0.6 + mx2 / ml2 * bulge, 2),
              round(q1[1] + (tip[1] - q1[1]) * 0.6 + my2 / ml2 * bulge, 2))
        if i == 0:
            d.append("M %s %s" % q0)
        d.append("Q %s %s %s %s" % (c1 + tip))
        d.append("Q %s %s %s %s" % (c2 + q1))
    d.append("Z")
    return " ".join(d)


def rosette_path():
    """8-petal gold rosette centred at origin (r=15)."""
    ring = petal_ring(8, 7.0, 15.0, 3.5, start_deg=22.5)
    core = "M 0 -2.6 A 2.6 2.6 0 1 1 -0.01 -2.6 Z"
    return '<path d="%s" stroke="%s"/>' % (ring, GOLD) + \
           '<path d="%s" stroke="%s"/>' % (core, GOLD)


def motif_path():
    """4-petal gold motif centred at origin (r=7)."""
    ring = petal_ring(4, 3.0, 7.0, 1.8, start_deg=45)
    core = "M 0 -1.5 A 1.5 1.5 0 1 1 -0.01 -1.5 Z"
    return '<path d="%s" stroke="%s"/>' % (ring, GOLD) + \
           '<path d="%s" stroke="%s"/>' % (core, GOLD)


def corner_medallion_paths():
    """Ornate black corner medallion centred at origin (outer r=26)."""
    ring = petal_ring(12, 12.5, 20.5, 3.2, start_deg=15)
    dots = " ".join(
        "M %s %s A 2.6 2.6 0 1 1 %s %s Z" % (x, y, x + 0.01, y)
        for x, y in star_pts(6, 16.0, 16.0))
    return ('<path d="M 0 -26 A 26 26 0 1 1 -0.01 -26 Z"/>' +
            '<path d="%s"/>' % ring +
            '<path d="%s"/>' % dots +
            '<path d="M 0 -6 A 6 6 0 1 1 -0.01 -6 Z"/>')


def star_pts(n, r_in, r_out, start_deg=0.0):
    pts = []
    seg = 360.0 / n
    for i in range(n):
        pts.append(pt(r_out, start_deg + i * seg + seg / 2))
        pts.append(pt(r_in, start_deg + (i + 1) * seg))
    return pts


def rope_circle(cx, cy):
    return '<circle cx="%s" cy="%s" r="7"/>' % (cx, cy)


def build_band_h():
    """140x64 horizontal tile: rope circles (every 28px, y 17/25), rosette at
    x=70, motifs at x=35/105, outer rule line at y=8."""
    parts = []
    # rope row
    for x in range(0, 141, 28):
        y = 17 if (x // 28) % 2 == 0 else 25
        parts.append(rope_circle(x, y))
    # outer rule
    parts.append('<path d="M 0 8 H 140"/>')
    # rosette + motifs
    parts.append('<g transform="translate(70 40)">%s</g>' % rosette_path())
    parts.append('<g transform="translate(35 40)">%s</g>' % motif_path())
    parts.append('<g transform="translate(105 40)">%s</g>' % motif_path())
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 64" '
           'width="140" height="64" role="img">\n'
           '<g fill="none" stroke="%s" stroke-width="1.5">\n%s\n</g>\n</svg>\n') % (INK, "\n".join(parts))
    write("mushaf-band-h.svg", svg)


def build_band_v():
    """64x140 vertical tile: same band rotated 90 deg (x 17/25, every 28px)."""
    parts = []
    for y in range(0, 141, 28):
        x = 17 if (y // 28) % 2 == 0 else 25
        parts.append(rope_circle(x, y))
    parts.append('<path d="M 8 0 V 140"/>')
    parts.append('<g transform="translate(40 70)">%s</g>' % rosette_path())
    parts.append('<g transform="translate(40 35)">%s</g>' % motif_path())
    parts.append('<g transform="translate(40 105)">%s</g>' % motif_path())
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 140" '
           'width="64" height="140" role="img">\n'
           '<g fill="none" stroke="%s" stroke-width="1.5">\n%s\n</g>\n</svg>\n') % (INK, "\n".join(parts))
    write("mushaf-band-v.svg", svg)


def build_corner():
    """64x64 corner: medallion at (32,32) + rope continuing to all tile edges
    + outer rule corner, so seams match the band tiles exactly."""
    parts = []
    parts.append('<g transform="translate(32 32)">%s</g>' % corner_medallion_paths())
    # horizontal rope (matches band-h circles in x range 0..64)
    for x in (0, 28, 56):
        y = 17 if (x // 28) % 2 == 0 else 25
        parts.append(rope_circle(x, y))
    # vertical rope (matches band-v circles in y range 0..64)
    for y in (0, 28, 56):
        x = 17 if (y // 28) % 2 == 0 else 25
        parts.append(rope_circle(x, y))
    # outer rule corner
    parts.append('<path d="M 8 8 H 64 M 8 8 V 64"/>')
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" '
           'width="64" height="64" role="img">\n'
           '<g fill="none" stroke="%s" stroke-width="1.5">\n%s\n</g>\n</svg>\n') % (INK, "\n".join(parts))
    write("mushaf-corner.svg", svg)


def write(name, content):
    path = os.path.join(OUTDIR, name)
    with open(path, "w", encoding="utf8") as f:
        f.write(content)
    print("wrote", path, "(%.1f KB)" % (os.path.getsize(path) / 1024))


if __name__ == "__main__":
    build_band_h()
    build_band_v()
    build_corner()
    # remove the old per-layout full-frame SVGs (replaced by the tile system)
    for old in ("mushaf-frame-13.svg", "mushaf-frame-16.svg", "mushaf-frame-17.svg"):
        p = os.path.join(OUTDIR, old)
        if os.path.exists(p):
            os.remove(p)
            print("removed", p)
