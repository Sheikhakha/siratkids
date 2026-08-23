#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Render curriculum PDF pages to WebP for the per-lesson Textbook panel.

Outputs:
  images/pdf/pre/page-NNN.webp   <- data/pdfs/PreStage.pdf
  images/pdf/s1/page-NNN.webp    <- data/pdfs/First Stage.pdf

Run:  python scripts/build_pdf_pages.py [--scale 2.0] [--only pre|s1]
"""
import argparse
import io
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

try:
    import pypdfium2 as pdfium
except ImportError:
    print('pypdfium2 missing: pip install pypdfium2 pillow')
    sys.exit(1)

try:
    from PIL import Image
except ImportError:
    print('Pillow missing: pip install pillow')
    sys.exit(1)

SOURCES = {
    'pre': ('data/pdfs/PreStage.pdf', 'images/pdf/pre'),
    's1': ('data/pdfs/First Stage.pdf', 'images/pdf/s1'),
    's2': ('data/pdfs/SecondStage.pdf', 'images/pdf/s2'),
    's3': ('data/pdfs/ThirdStage.pdf', 'images/pdf/s3'),
    's4': ('data/pdfs/FourthStage.pdf', 'images/pdf/s4'),
}


def render(key, scale):
    src_rel, out_rel = SOURCES[key]
    src = os.path.join(ROOT, src_rel)
    outdir = os.path.join(ROOT, out_rel)
    if not os.path.exists(src):
        print('missing PDF: %s' % src)
        return
    os.makedirs(outdir, exist_ok=True)
    pdf = pdfium.PdfDocument(src)
    n = len(pdf)
    print('%s: %d pages -> %s' % (key, n, out_rel))
    total = 0
    for i in range(n):
        out = os.path.join(outdir, 'page-%03d.webp' % (i + 1))
        if os.path.exists(out):
            continue
        page = pdf[i]
        bitmap = page.render(scale=scale)
        img = bitmap.to_pil().convert('RGB')
        buf = io.BytesIO()
        img.save(buf, 'WEBP', quality=72, method=6)
        data = buf.getvalue()
        with open(out, 'wb') as f:
            f.write(data)
        total += len(data)
        if (i + 1) % 20 == 0 or i + 1 == n:
            print('  %d/%d pages (%.1f KB avg)' % (
                i + 1, n, total / max(i + 1, 1) / 1024))
        page.close()
    pdf.close()
    print('done: %s' % key)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--scale', type=float, default=2.0)
    ap.add_argument('--only', choices=['pre', 's1', 's2', 's3', 's4'], default=None)
    args = ap.parse_args()
    keys = [args.only] if args.only else list(SOURCES)
    for k in keys:
        render(k, args.scale)


if __name__ == '__main__':
    main()
