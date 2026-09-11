#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""OCR curriculum PDF pages with Tesseract ara into per-page text files.

Replaces the broken Windows.Media.Ocr pipeline (extract_curriculum_text.py).
Renders each PDF page at high DPI via pypdfium2, OCRs with tesseract -l ara,
and writes one UTF-8 .txt per page under data/extracted/<key>/ plus a small
page index (first non-empty line + line count) to help locate lesson boundaries.

Idempotent: pages that already have a non-empty .txt are skipped (--force to
re-OCR). Pages can be restricted with --pages (1-based, e.g. '1-40,77').

Outputs:
  data/extracted/s3/page-001.txt  ... page-270.txt
  data/extracted/s3/_index.json

Run:  python scripts/extract_stage_pages.py --stage s3
      python scripts/extract_stage_pages.py --stage s3 --pages 140-160
      python scripts/extract_stage_pages.py --stage s3 --force
"""
import argparse
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_BASE = os.path.join(ROOT, "data", "extracted")
PDF_BASE = os.path.join(ROOT, "data", "pdfs")
TESS = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
TESSDATA = r"C:\Users\Faridh\AppData\Local\Temp\opencode\tessdata"

BOOKS = {
    "s3": ("ThirdStage.pdf", "Third Stage"),
    "s4": ("FourthStage.pdf", "Fourth Stage"),
    "s5p1": ("Fifthstage_FirstBook.pdf", "Fifth Stage - First Book"),
    "s5p2": ("FifthStage_SecondBook.pdf", "Fifth Stage - Second Book"),
    "s6p1": ("SixthStage_FirstBook.pdf", "Sixth Stage - First Book"),
    "s6p2": ("SixthStage_SecondBook.pdf", "Sixth Stage - Second Book"),
}


WORK = r"C:\Users\Faridh\AppData\Local\Temp\opencode"


def render_page(pdf_path, page_no, scale=3.5, out_png=None):
    import pypdfium2 as pdfium
    from PIL import ImageOps
    doc = pdfium.PdfDocument(pdf_path)
    img = doc[page_no - 1].render(scale=scale).to_pil().convert("L")
    img = ImageOps.autocontrast(img)
    out_png = out_png or os.path.join(WORK, "_ocr_%03d.png" % page_no)
    img.save(out_png)
    doc.close()
    return out_png


def ocr_page(png_path):
    env = dict(os.environ, TESSDATA_PREFIX=TESSDATA)
    outp = png_path[:-4]
    r = subprocess.run([TESS, png_path, outp, "-l", "ara", "--psm", "6"],
                       env=env, capture_output=True, timeout=300)
    if r.returncode != 0:
        print("  tesseract stderr:", r.stderr.decode("utf-8", "replace")[:300])
        return ""
    txt = open(outp + ".txt", encoding="utf-8", errors="replace").read()
    return txt.strip()


def parse_pages(spec, n):
    """'1-40,77,90-95' -> sorted 1-based ints. Empty => all pages."""
    if not spec:
        return list(range(1, n + 1))
    out = []
    for part in spec.split(","):
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            a, b = part.split("-", 1)
            out.extend(range(int(a), int(b) + 1))
        else:
            out.append(int(part))
    return sorted({p for p in out if 1 <= p <= n})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--stage", required=True, choices=list(BOOKS))
    ap.add_argument("--pages", default="", help="1-based page ranges, e.g. '1-40,77'")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--scale", type=float, default=3.5)
    args = ap.parse_args()

    import pypdfium2 as pdfium
    fname, label = BOOKS[args.stage]
    pdf_path = os.path.join(PDF_BASE, fname)
    outdir = os.path.join(OUT_BASE, args.stage)
    os.makedirs(outdir, exist_ok=True)

    doc = pdfium.PdfDocument(pdf_path)
    n = len(doc)
    print("%s: %s (%s, %d pages) -> %s" % (args.stage, label, fname, n, outdir))

    pages = parse_pages(args.pages, n)
    total_bytes = 0
    done = 0
    skipped = 0
    for pno in pages:
        out = os.path.join(outdir, "page-%03d.txt" % pno)
        if not args.force and os.path.exists(out) and open(out, encoding="utf-8").read().strip():
            skipped += 1
            continue
        png = os.path.join(WORK, "_ocr_%03d.png" % pno)
        render_page(pdf_path, pno, scale=args.scale, out_png=png)
        txt = ocr_page(png)
        with open(out, "w", encoding="utf-8", newline="\n") as f:
            f.write(txt + ("\n" if txt else ""))
        total_bytes += len(txt)
        done += 1
        if done % 20 == 0 or done == len(pages):
            print("  %d/%d pages OCR'd (avg %.1f KB)" % (done, len(pages),
                                                         total_bytes / max(done, 1) / 1024))
        try:
            os.remove(png)
            if os.path.exists(png[:-4] + ".txt"):
                os.remove(png[:-4] + ".txt")
        except OSError:
            pass
    doc.close()

    index = {}
    for fname_ in sorted(os.listdir(outdir)):
        if not re.match(r"page-\d{3}\.txt$", fname_):
            continue
        lines = open(os.path.join(outdir, fname_), encoding="utf-8").read().splitlines()
        nonempty = [ln.strip() for ln in lines if ln.strip()]
        index[fname_] = {
            "first": nonempty[0][:80] if nonempty else "",
            "lines": len(lines),
            "nonempty": len(nonempty),
        }
    idx_path = os.path.join(outdir, "_index.json")
    with open(idx_path, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=1)
    print("done: %s (%d pages OCR'd, %d skipped) index -> %s"
          % (args.stage, done, skipped, os.path.relpath(idx_path, ROOT)))


if __name__ == "__main__":
    main()