#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Verify curriculum JSON faithfulness to source PDF using Tesseract ara OCR.

Strategy: for each lesson with a page mapping, render the PDF page at high res,
grayscale + autocontrast, OCR with tesseract (ara), strip tashkeel from both
JSON blocks and OCR text, then compute word-overlap of the JSON lesson Arabic
against the OCR page text. High overlap => JSON content is faithful to PDF.

Usage:
    python scripts/verify_pdf_faithfulness.py --stage s2 --pages 10,19,47
    python scripts/verify_pdf_faithfulness.py --stage s2 --all-first-pages
    python scripts/verify_pdf_faithfulness.py --stage s2 --lessons s2-tawheed-1-1,s2-fiqh-1-5
"""
import argparse
import json
import os
import re
import subprocess
import sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CUR = os.path.join(ROOT, "data", "curriculum")
PDF = os.path.join(ROOT, "data", "pdfs")
TESS = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
TESSDATA = r"C:\Users\Faridh\AppData\Local\Temp\opencode\tessdata"
WORK = r"C:\Users\Faridh\AppData\Local\Temp\opencode"

PDFS = {
    "s0": ("PreStage.pdf"),
    "s1": ("s1.json", "First Stage.pdf"),
    "s2": ("s2.json", "SecondStage.pdf"),
}

S0_MAP = os.path.join(ROOT, "data", "s0_page_map.json")


def _first_existing(key):
    """Resolve a classic pre-stage lesson file to its real path."""
    cands = [
        f"{key}.html",
        f"hadith/{key}.html",
        f"seerah/{key}.html",
        f"adhkar/{key}.html",
        f"manners/{key}.html",
    ]
    for c in cands:
        p = os.path.join(ROOT, "lessons", c)
        if os.path.exists(p):
            return p
    return None


def load_lessons_s0():
    """Pre-stage lessons live in classic lesson HTML files; Arabic comes from
    `.lesson-block .ar[dir=rtl]` blocks, pages come from s0_page_map.json."""
    import re as _re
    import html as _html
    mapping = json.load(open(S0_MAP, encoding="utf-8"))
    out = []
    for key, pages in mapping.items():
        if not isinstance(pages, list):
            continue
        html_path = _first_existing(key)
        if not html_path:
            continue
        raw = open(html_path, encoding="utf-8").read()
        blocks = _re.findall(
            r'<div class="lesson-block[^"]*".*?<div class="ar" dir="rtl">(.*?)</div>',
            raw, _re.S)
        ar = "\n".join(_re.sub(r"<[^>]+>", "", _html.unescape(b)).strip()
                       for b in blocks)
        pages_n = sorted(int(re.search(r"(\d+)", pg).group(1))
                        for pg in pages if re.search(r"(\d+)", pg))
        out.append({
            "file": key,
            "page": pages_n[0] if pages_n else 0,
            "extra_pages": pages_n[1:] or [],
            "title_ar": os.path.splitext(key)[0].replace("-", " ") + " درس",
            "blocks_ar": ar.strip(),
        })
    return out

_ALEF = str.maketrans(
    {"\u0623": "\u0627", "\u0625": "\u0627", "\u0622": "\u0627", "\u0629": "\u0647", "\u0649": "\u064a"}
)


def norm_ar(s: str) -> str:
    s = re.sub(r"[\u064b-\u0652\u0640]", "", s)          # tashkeel + tatweel
    s = re.sub(r"[\u0660-\u0669\u06f0-\u06f9]", " ", s)  # digits -> space
    s = s.translate(_ALEF)                               # unify alef/ta marbuta/alef maqsura
    s = re.sub(r"[^\w\s\u0600-\u06FF]+", " ", s)          # punctuation -> space
    s = re.sub(r"\s+", " ", s)                            # collapse spaces
    return s.strip().lower()


def split_words(s: str):
    return [w for w in s.split() if len(w) >= 3]


def load_lessons(stage):
    if stage == "s0":
        return load_lessons_s0()
    data = json.load(open(os.path.join(CUR, PDFS[stage][0]), encoding="utf-8"))
    out = []
    for subj in data["subjects"]:
        for u in subj["units"]:
            for l in u["lessons"]:
                blocks = l.get("blocks") or []
                ar = "\n".join(b.get("ar", "") for b in blocks if (b or {}).get("ar"))
                out.append({
                    "file": l["file"],
                    "page": l.get("page", 0),
                    "title_ar": l.get("title", {}).get("ar", ""),
                    "blocks_ar": ar.strip(),
                })
    return out


def render_page(pdf_path, page_no, scale=4.0):
    import pypdfium2 as pdfium
    from PIL import ImageOps
    doc = pdfium.PdfDocument(pdf_path)
    img = doc[page_no - 1].render(scale=scale).to_pil().convert("L")
    img = ImageOps.autocontrast(img)
    p = os.path.join(WORK, f"_vfy_{page_no:03d}.png")
    img.save(p)
    doc.close()
    return p


def ocr_page(png_path):
    env = dict(os.environ, TESSDATA_PREFIX=TESSDATA)
    outp = png_path[:-4]
    subprocess.run([TESS, png_path, outp, "-l", "ara", "--psm", "6"],
                   env=env, capture_output=True, timeout=300)
    txt = open(outp + ".txt", encoding="utf-8", errors="replace").read()
    return txt


def overlap(json_ar, page_ar):
    """Ratio of significant JSON Arabic words found in OCR page text."""
    jn = norm_ar(json_ar)
    pn = norm_ar(page_ar)
    j_words = [w for w in jn.split() if len(w) >= 3]
    if not j_words:
        return 1.0, 0, 0
    found = [w for w in j_words if w in pn.split()]
    return len(found) / len(j_words), len(found), len(j_words)


def words_in_both(a, b):
    ja = set(w for w in norm_ar(a).split() if len(w) >= 3)
    pb = set(w for w in norm_ar(b).split() if len(w) >= 3)
    return sorted(ja & pb), sorted(ja - pb)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--stage", required=True, choices=["s0", "s1", "s2"])
    ap.add_argument("--pages", default="")
    ap.add_argument("--lessons", default="")
    ap.add_argument("--all", action="store_true")
    args = ap.parse_args()

    cfg = PDFS[args.stage]
    lessons = load_lessons(args.stage)
    pdf_path = os.path.join(PDF, cfg if isinstance(cfg, str) else cfg[1])

    selected = []
    if args.lessons:
        wanted = set(args.lessons.split(","))
        selected = [l for l in lessons if l["file"] in wanted]
    elif args.pages:
        wanted = set(int(x) for x in args.pages.split(","))
        selected = [l for l in lessons if l["page"] in wanted]
    elif args.all:
        selected = lessons

    print(f"=== {args.stage} : {len(selected)} lessons to verify ===")
    print(f"{'lesson':26} {'page':>4}  {'ovl%':>5}  {'found/total':>12}  title-match  missing-vs-OCR")
    results = []
    seen_pages = {}
    for l in selected:
        if not l["page"] or l["page"] >= 300:
            continue
        if l["page"] in seen_pages:
            page_ar = seen_pages[l["page"]]
        else:
            try:
                png = render_page(pdf_path, l["page"])
                page_ar = ocr_page(png)
            except Exception as e:
                print(f"{l['file']:26} page={l['page']} OCR ERROR: {e}")
                continue
            seen_pages[l["page"]] = page_ar
        jn = norm_ar(l["blocks_ar"])
        # use lesson title too, in case blocks_ar is empty
        jfull = (l["title_ar"] + " " + l["blocks_ar"]).strip()
        if not jfull:
            print(f"{l['file']:26} page={l['page']} (no Arabic in JSON)")
            continue
        ov, fnd, tot = overlap(jfull, page_ar)
        # title match check
        title_words = split_words(norm_ar(l["title_ar"]))
        page_words = split_words(norm_ar(page_ar))
        page_set = set(page_words)
        # count title words found anywhere
        tfound = sum(1 for w in title_words if w in page_set)
        tflag = "YES" if title_words and tfound >= max(1, len(title_words) - 1) else "no"
        common, missing = words_in_both(jfull, page_ar)
        miss_str = " ".join(missing[:8]) if missing else "-"
        print(f"{l['file']:26} {l['page']:>4}  {ov*100:5.1f}  {fnd:>6}/{tot:<5}  {tflag:>14}  {miss_str}")
        results.append((l["file"], l["page"], ov, tflag, miss_str))

    if results:
        valid = [r for r in results if r[3] == "YES"]
        avg = sum(r[2] for r in results) / len(results)
        print(f"\nSummary: {len(valid)}/{len(results)} lessons with title match; avg word-overlap={avg*100:.1f}%")
        low = [r for r in results if r[2] < 0.35]
        if low:
            print(f"\nLow-overlap lessons (<35%): {[r[0] for r in low]}")


if __name__ == "__main__":
    main()