#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
audit_pdfs.py - Scan the OCR-extracted book markdown (data/extracted/<key>.md)
and produce, per book, a page-indexed inventory of:
  - structure markers   (فهرس, المقدمة, الوحدة, الدرس, الباب/الفصل/القسم)
  - activity markers    (أسئلة, نشاط, أكمل, فراغ, لون/ألون, أكتب, صلّ, اختبر,
                         مراجعة, اذكر, ميّز, ضع علامة, اختر)
Outputs a report to stdout and writes docs/pdf-activity-audit.md when --docs.
Usage:
    python scripts/audit_pdfs.py [--key pre|s1|...] [--docs] [--pages "3-12"]
"""

import argparse
import os
import re
import sys
import unicodedata

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXTRACT = os.path.join(ROOT, "data", "extracted")

BOOKS = {
    "pre":  {"stage": 0, "part": "", "file": "PreStage.pdf"},
    "qa":   {"stage": 1, "part": "", "file": "official/QA_Level1.pdf (MISSING)", "missing": True},
    "s1":   {"stage": 1, "part": "", "file": "First Stage.pdf"},
    "s2":   {"stage": 2, "part": "", "file": "SecondStage.pdf"},
    "s3":   {"stage": 3, "part": "", "file": "ThirdStage.pdf"},
    "s4":   {"stage": 4, "part": "", "file": "FourthStage.pdf"},
    "s5p1": {"stage": 5, "part": "1", "file": "Fifthstage_FirstBook.pdf"},
    "s5p2": {"stage": 5, "part": "2", "file": "FifthStage_SecondBook.pdf"},
    "s6p1": {"stage": 6, "part": "1", "file": "SixthStage_FirstBook.pdf"},
    "s6p2": {"stage": 6, "part": "2", "file": "SixthStage_SecondBook.pdf"},
}

# normalise Arabic for matching: strip tashkeel, unify alef/hamza forms, ta marbuta, alef maqsura
_DIAC = dict.fromkeys(
    [ord(x) for x in "\u064b\u064c\u064d\u064e\u064f\u0650\u0651\u0652\u0640"] +
    [ord(c) for c in "\u0636\u0634\u0635\u0630\u0626\u0621\u0623\u0625\u0622\u0629\u0627"], "")
_TRANS = str.maketrans({
    "\u0623": "\u0627", "\u0625": "\u0627", "\u0622": "\u0627",  # أ إ آ -> ا
    "\u0629": "\u0647",  # ة -> ه
    "\u0649": "\u064a",  # ى -> ي
})


def norm(s):
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    s = s.translate(_TRANS)
    s = re.sub(r"[^\u0600-\u06FF \n]", " ", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def load_pages(key):
    md_path = os.path.join(EXTRACT, f"{key}.md")
    if not os.path.exists(md_path):
        return []
    text = open(md_path, encoding="utf-8").read()
    parts = re.split(r"<!-- page:(\d+) -->", text)
    # parts[0] = header; then pairs (num, body)
    pages = []
    for i in range(1, len(parts), 2):
        num = int(parts[i])
        body = parts[i + 1] if i + 1 < len(parts) else ""
        pages.append((num, body))
    return pages


# (label, regex-patterns on normalised text)
STRUCTURE = [
    ("فهرس",           r"فهرس"),
    ("المقدمة",        r"مقدمه"),
    ("الوحدة",         r"الوحده|وحده"),
    ("الباب",          r"\bالباب\b|االباب|الباب:"),
    ("الفصل",          r"الفصل"),
    ("القسم",          r"القسم"),
    ("الدرس",          r"الدرس"),
    ("الدرس الأول",    r"الدرس[ ]{0,2}الاول"),
    ("الدرس الثاني",   r"الدرس[ ]{0,2}الثاني"),
    ("الدرس الثالث",   r"الدرس[ ]{0,2}الثالث"),
    ("الدرس الرابع",   r"الدرس[ ]{0,2}الرابع"),
    ("الدرس الخامس",   r"الدرس[ ]{0,2}الخامس"),
    ("الدرس السادس",   r"الدرس[ ]{0,2}السادس"),
    ("الدرس السابع",   r"الدرس[ ]{0,2}السابع"),
    ("الدرس الثامن",   r"الدرس[ ]{0,2}الثامن"),
    ("الوحدة الأولى",  r"الوحده[ ]{0,2}الاولى"),
    ("الوحدة الثانية", r"الوحده[ ]{0,2}الثانيه"),
    ("الوحدة الثالثة", r"الوحده[ ]{0,2}الثالثه"),
]

ACTIVITY = [
    ("أسئلة",      r"اسئله|اسئلة"),
    ("نشاط",       r"نشاط"),
    ("أكمل",       r"اكمل|اكملي|اكمال"),
    ("فراغات",     r"فراغ"),
    ("تلوين",      r"لون|الون|لونن|تلوين"),
    ("أكتب",       r"اكتب|اكتبي"),
    ("صِل",        r"\bصل\b|صلي"),
    ("اختبار",     r"اختبر|اختبار|امتحان"),
    ("مراجعة",     r"راجع|مراجعه"),
    ("اذكر",       r"اذكر|اذكري"),
    ("ميّز",       r"ميز|تميز"),
    ("ضع علامة",   r"ضع[ ]{0,2}علامه|علامة|علامه"),
    ("اختر/لون",   r"اختر|اختاري"),
    ("أسمّي",      r"اسمي|سمي"),
    ("أعبر/أجرب",  r"اجرب|اعبر"),
    ("سؤال واحد",  r"سؤال"),
]

PAGE_FILTER = r"[0-9]+"
# keep lines that look like headings (short) or that contain strong markers
_HEAD_RE = re.compile(r"^[^\d:;.()\u2014\u2013\[\]{}]{2,60}$")


def scan_pages(key, page_filter=None, verbose=False):
    pages = load_pages(key)
    if page_filter:
        lo, hi = page_filter
        pages = [p for p in pages if lo <= p[0] <= hi]
    if not pages:
        return pages
    res = []
    for num, body in pages:
        if body.strip() in ("[OCR FAILED]", "", "N/A"):
            res.append((num, ["OCR_FAILED"]))
            continue
        n = norm(body)
        tags = []
        for label, pat in ACTIVITY + STRUCTURE:
            if re.search(pat, n, flags=re.IGNORECASE):
                tags.append(label)
        res.append((num, tags))
    return res


def find_headings(key, page_filter=None):
    """Return {page: [heading-candidates]} - short lines near top that look like titles."""
    pages = load_pages(key)
    out = {}
    for num, body in pages:
        if page_filter and not (page_filter[0] <= num <= page_filter[1]):
            continue
        lines = [l.strip() for l in body.splitlines() if l.strip()]
        heads = []
        for i, l in enumerate(lines[:6]):
            ln = norm(l)
            if 3 <= len(ln) <= 70 and _HEAD_RE.match(ln):
                heads.append(ln)
        if heads:
            out[num] = heads
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--key", choices=sorted(BOOKS))
    ap.add_argument("--docs", action="store_true")
    ap.add_argument("--pages", default="", help="e.g. 3-12")
    args = ap.parse_args()

    keys = [args.key] if args.key else sorted(BOOKS)
    page_filter = None
    if args.pages and "-" in args.pages:
        a, b = args.pages.split("-")
        page_filter = (int(a), int(b))

    for key in keys:
        cfg = BOOKS[key]
        if cfg.get("missing"):
            print(f"\n### {key} (stage {cfg['stage']}{cfg['part']}) — source PDF missing, skipped")
            continue
        print(f"\n### {key} (stage {cfg['stage']} part '{cfg['part']}' — {cfg['file']})")
        res = scan_pages(key, page_filter, verbose=(args.key is not None))
        for num, tags in res:
            fmt = " ".join(tags) if tags else ""
            print(f"p{num:03d} {fmt}")

    if args.docs:
        build_docs(keys)


def build_docs(keys):
    lines = ["# PDF Curriculum Activity Audit",
             "",
             "_Generated by scripts/audit_pdfs.py · OCR via extract_curriculum_text.py (Windows.Media.Ocr ar-SA)_",
             "",
             "Legend: **أسئلة** unit/lesson Q&A · **نشاط** activity · **أكمل/فراغات** fill-the-blank · "
             "**تلوين** coloring · **أكتب** writing · **اختبار** test · **مراجعة** review.",
             "",
             "Legend for decision: a unit gets an interactive worksheet ONLY if its book shows أسئلة/نشاط "
             "content; stage-0 coloring/naming becomes a static printable page.",
             ""]
    for key in keys:
        cfg = BOOKS[key]
        if cfg.get("missing"):
            lines.append(f"## {key} — stage {cfg['stage']} — {cfg['file']}")
            lines.append("")
            lines.append("> Source PDF is missing from `data/pdfs/official/`; cannot audit. Skipped.")
            lines.append("")
            continue
        lines.append(f"## {key} — stage {cfg['stage']}{' part ' + cfg['part'] if cfg['part'] else ''} — {cfg['file']}")
        lines.append("")
        res = scan_pages(key)
        lines.append("| Page | Markers |")
        lines.append("|---|---|")
        for num, tags in res:
            if tags:
                lines.append(f"| {num} | {' · '.join(tags)} |")
        co = [n for n, t in res if any(x in t for x in ("نشاط", "أكمل", "فراغات", "تلوين", "أكتب", "صِل", "ضع علامة"))]
        qa = [n for n, t in res if "أسئلة" in t]
        lines.append("")
        lines.append(f"- Activity-bearing pages: {co or 'none'}")
        lines.append(f"- Q&A (أسئلة) pages: {qa or 'none'}")
        lines.append("")
    out = os.path.join(ROOT, "docs", "pdf-activity-audit.md")
    with open(out, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))
    print(f"\nWrote {out}")


if __name__ == "__main__":
    main()