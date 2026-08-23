#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
extract_curriculum_text.py - Render PDF pages to PNG and OCR them via
scripts/run_ocr.ps1 (Windows.Media.Ocr, ar-SA).

Outputs per book:
    data/extracted/<key>/page-NNN.txt          Y-sorted plain text
    data/extracted/<key>/page-NNN.lines.json   word bounding boxes (authoring aid)
    data/extracted/<book-key>.md               combined, page-marked

Usage:
    python scripts/extract_curriculum_text.py --book qa      # official QA_Level1.pdf
    python scripts/extract_curriculum_text.py --book pre     # PreStage.pdf
    python scripts/extract_curriculum_text.py --book s1      # First Stage.pdf / official Level1
    python scripts/extract_curriculum_text.py --book s2      # SecondStage.pdf / official Level2
    python scripts/extract_curriculum_text.py --book qa --pages 1-20
"""

import argparse
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF_DIR = os.path.join(ROOT, "data", "pdfs")
OUT_ROOT = os.path.join(ROOT, "data", "extracted")

BOOKS = {
    "qa": {
        "pdf": os.path.join(PDF_DIR, "official", "QA_Level1.pdf"),
        "title": "Manahij Dawrat Al-Ulum Al-Sharaiyya Q&A - Stage 1",
    },
    "pre": {
        "pdf": os.path.join(PDF_DIR, "PreStage.pdf"),
        "alt": [os.path.join(PDF_DIR, "official", "PreLevel_Kidssunnah.pdf")],
        "title": "Dawrat Al-Ulum Al-Sharaiyya - Pre-Level (Tawheed)",
    },
    "s1": {
        "pdf": os.path.join(PDF_DIR, "First Stage.pdf"),
        "alt": [os.path.join(PDF_DIR, "official", "Level1_Kidssunnah.pdf")],
        "title": "Dawrat Al-Ulum Al-Sharaiyya - Stage 1",
    },
    "s2": {
        "pdf": os.path.join(PDF_DIR, "SecondStage.pdf"),
        "alt": [os.path.join(PDF_DIR, "official", "Level2_Kidssunnah.pdf")],
        "title": "Dawrat Al-Ulum Al-Sharaiyya - Stage 2",
    },
    "s3": {
        "pdf": os.path.join(PDF_DIR, "ThirdStage.pdf"),
        "title": "Dawrat Al-Ulum Al-Sharaiyya - Stage 3",
    },
    "s4": {
        "pdf": os.path.join(PDF_DIR, "FourthStage.pdf"),
        "title": "Dawrat Al-Ulum Al-Sharaiyya - Stage 4",
    },
}

SCALE = 3.0
BATCH = 12


def parse_pages(spec, total):
    if not spec:
        return list(range(total))
    pages = []
    for part in spec.split(","):
        if "-" in part:
            a, b = part.split("-")
            pages.extend(range(int(a) - 1, min(int(b), total)))
        else:
            n = int(part) - 1
            if 0 <= n < total:
                pages.append(n)
    return sorted(set(pages))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--book", required=True, choices=sorted(BOOKS))
    ap.add_argument("--pages", default="")
    args = ap.parse_args()

    try:
        import pypdfium2 as pdfium
    except ImportError:
        sys.exit("pypdfium2 is required: pip install pypdfium2")

    cfg = BOOKS[args.book]
    pdf_path = cfg["pdf"]
    if not os.path.exists(pdf_path):
        for alt in cfg.get("alt", []):
            if os.path.exists(alt):
                pdf_path = alt
                break
    if not os.path.exists(pdf_path):
        sys.exit("PDF not found for book: " + args.book)

    import tempfile
    tmp_png_dir = tempfile.mkdtemp(prefix="ocr_png_")
    out_dir = os.path.join(OUT_ROOT, args.book)
    os.makedirs(out_dir, exist_ok=True)

    doc = pdfium.PdfDocument(pdf_path)
    pages = parse_pages(args.pages, len(doc))
    print(f"[{args.book}] {os.path.basename(pdf_path)}: {len(doc)} pages, "
          f"processing {len(pages)} -> {out_dir}")

    done_txt = []
    for start in range(0, len(pages), BATCH):
        chunk = pages[start:start + BATCH]
        png_paths = []
        for i in chunk:
            img = doc[i].render(scale=SCALE).to_pil()
            p = os.path.join(tmp_png_dir, f"page-{i+1:03d}.png")
            img.save(p)
            png_paths.append(p)
        ps1 = os.path.join(ROOT, "scripts", "run_ocr.ps1")
        cmd = ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass",
               "-File", ps1, "-Images", "|".join(png_paths), "-OutDir", out_dir]
        r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8",
                           timeout=600)
        for line in (r.stdout or "").splitlines():
            print("  " + line)
        if r.returncode != 0:
            print("  PS stderr:", (r.stderr or "")[:400])
        for i in chunk:
            t = os.path.join(out_dir, f"page-{i+1:03d}.txt")
            if os.path.exists(t):
                done_txt.append(t)

    md_path = os.path.join(OUT_ROOT, f"{args.book}.md")
    with open(md_path, "w", encoding="utf-8") as fh:
        fh.write(f"# {cfg['title']}\n\n")
        fh.write(f"Source: {os.path.relpath(pdf_path, ROOT)}\n\n")
        for i in pages:
            t = os.path.join(out_dir, f"page-{i+1:03d}.txt")
            fh.write(f"\n\n<!-- page:{i+1} -->\n")
            if os.path.exists(t):
                fh.write(open(t, encoding="utf-8").read())
            else:
                fh.write("[OCR FAILED]")
    print(f"Wrote combined markdown: {md_path}")
    import shutil
    shutil.rmtree(tmp_png_dir, ignore_errors=True)


if __name__ == "__main__":
    main()
