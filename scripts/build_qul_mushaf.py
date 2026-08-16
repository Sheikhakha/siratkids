#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build QUL mushaf page-layout bundles + tajweed rule map for the Quran Reader.

Sources (all public, verified live 2026-08):
  * Layout exports : GET /exports/mushaf_page?mushaf_id={17|18|7}&page_number=N
      - 17 = indopak-nastaleeq-hanafi-compressed (13 lines/page)
      - 18 = indopak-nastaleeq-madinah-normal   (17 lines/page)
      -  7 = indopak-nastaleeq                  (16 lines/page)
      Word text is identical across layouts (same location keys as
      js/quran_source/indopak-nastaleeq-word.js); only page boundaries and
      line breaks differ, which is exactly what these bundles store.
  * Tajweed rules  : GET /tajweed_words/{S:V:1}  (Rails HTML; each page embeds a
      full-ayah "QPC Hafs" preview whose per-word spans carry <r class=RULE>
      letters - one page per ayah therefore yields every word's rules).
  * Fonts          : static-cdn.tarteel.ai/qul/fonts/... (tiny Indopak woff2s
      + the surah-name-v4 calligraphy font).

Outputs:
  * js/quran_source/mushaf-layout-{17,18,7}.js  __QURAN_DATA["mushaf-layout-{id}"]
  * js/quran_source/mushaf-meta.js              __QURAN_DATA["mushaf-meta"]
  * js/quran_source/tajweed-rules.js            __QURAN_DATA["tajweed-rules"]
  * css/qul-mushaf-fonts.css                    @font-face + tajweed rule colors
  * fonts/indopak-nastaleeq-waqf-lazim.woff2, indopak-nastaleeq-hanafi-compressed.woff2,
    indopak-nastaleeq-madinah-normal.woff2, surah-name-v4.woff2
  * scripts/qul_mushaf_report.json

Layout bundle schema (per page): pages[i].lines = list of
  {"t":"w","w":[[loc,count],...]}   text line (run-length compressed locations)
  {"t":"s","s":N}                   surah-name calligraphy line ("surahNNN")
  {"t":"b"}                         bismillah line
plus page_first/page_last (ayah keys) and ayah_page (ayah -> first page).

Usage:
  python scripts/build_qul_mushaf.py --dry-run
  python scripts/build_qul_mushaf.py                       # full build
  python scripts/build_qul_mushaf.py --skip-tajweed        # layouts/fonts only
  python scripts/build_qul_mushaf.py --only-layout 17      # single layout
"""

import argparse
import html
import importlib.util
import io
import json
import os
import re
import sys
import time
from html.parser import HTMLParser

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))

sys.path.insert(0, HERE)
spec = importlib.util.spec_from_file_location("bqd", os.path.join(HERE, "build_qul_data.py"))
bqd = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bqd)

BASE = bqd.BASE
fetch = bqd.fetch
fetch_text = bqd.fetch_text
parse_mushaf_page = bqd.parse_mushaf_page
parallel_map = bqd.parallel_map
load_js_json = bqd.load_js_json
write_wrapped_js = bqd.write_wrapped_js

SRC_DIR = os.path.join(ROOT, "js", "quran_source")
FONT_DIR = os.path.join(ROOT, "fonts")
CSS_PATH = os.path.join(ROOT, "css", "qul-mushaf-fonts.css")
REPORT_PATH = os.path.join(HERE, "qul_mushaf_report.json")
WORD_FILE = os.path.join(SRC_DIR, "indopak-nastaleeq-word.js")
WORD_BASENAME = "indopak-nastaleeq-word"

# Layouts to build (user decision 2026-08-16: Indopak only, Madani id 1 dropped).
LAYOUTS = {
    17: {
        "name": "Indopak (Hanafi compressed)",
        "short": "13 lines",
        "font_family": "indopak-nastaleeq-hanafi-compressed",
    },
    18: {
        "name": "Indopak (Madinah normal)",
        "short": "17 lines",
        "font_family": "indopak-nastaleeq-madinah-normal",
    },
    7: {
        "name": "Indopak Nastaleeq",
        "short": "16 lines",
        "font_family": "indopak-nastaleeq",
    },
}
DEFAULT_LAYOUT = 17

# Tajweed rule classes + colors mirrored from QUL's export stylesheet
# (/assets/export-*.css, .tajweed-new rules). Scoped under .qr-mushaf-page in
# css/qul-mushaf-fonts.css by the writer below.
RULE_COLORS = {
    "ghunnah": "#ff7e1e",
    "ham_wasl": "#aaa",
    "slnt": "#aaa",
    "laam_shamsiyah": "#aaa",
    "idgham_ghunnah": "#169200",
    "idgham_mutajanisayn": "#a1a1a1",
    "idgham_mutaqaribayn": "#a1a1a1",
    "idgham_shafawi": "#58b800",
    "idgham_wo_ghunnah": "#169200",
    "ikhafa": "#9400a8",
    "ikhafa_shafawi": "#d500b7",
    "iqlab": "#26bffd",
    "izhar": "#006400",
    "izhar_shafawi": "#00f",
    "madda_necessary": "#a9045c",
    "madda_normal": "#537fff",
    "madda_obligatory": "#f2007f",
    "madda_obligatory_mottasel": "#f2007f",
    "madda_obligatory_monfasel": "#f2007f",
    "madda_permissible": "#f38e02",
    "qalaqah": "#009ee6",
    "tafkheem": "#006994",
}
RULE_CLASSES = set(RULE_COLORS.keys())

# Dark-theme relaxations for the darkest rule colors (kept minimal).
DARK_OVERRIDES = {
    "izhar": "#22c55e",
    "idgham_ghunnah": "#4ade80",
    "idgham_wo_ghunnah": "#4ade80",
    "idgham_shafawi": "#86efac",
    "izhar_shafawi": "#60a5fa",
    "iqlab": "#38bdf8",
    "qalaqah": "#38bdf8",
    "tafkheem": "#22d3ee",
    "madda_normal": "#818cf8",
}

FONTS = [
    ("indopak-nastaleeq-waqf-lazim.woff2",
     "https://static-cdn.tarteel.ai/qul/fonts/nastaleeq/indopak-nastaleeq-waqf-lazim.woff2?v=3.3"),
    ("indopak-nastaleeq-hanafi-compressed.woff2",
     "https://static-cdn.tarteel.ai/qul/fonts/nastaleeq/Hanafi/compressed-v4.2.2/with-waqf-lazmi/font.woff2?v=3.3"),
    ("indopak-nastaleeq-madinah-normal.woff2",
     "https://static-cdn.tarteel.ai/qul/fonts/nastaleeq/Madinah/normal-v4.2.2/with-waqf-lazmi/font.woff2?v=3.3"),
    ("surah-name-v4.woff2",
     "https://static-cdn.tarteel.ai/qul/fonts/surah-names/v4/surah-name-v4.woff2?v=3.3"),
]

FONT_FAMILY_BY_FILE = {
    "indopak-nastaleeq-waqf-lazim.woff2": "indopak-nastaleeq",
    "indopak-nastaleeq-hanafi-compressed.woff2": "indopak-nastaleeq-hanafi-compressed",
    "indopak-nastaleeq-madinah-normal.woff2": "indopak-nastaleeq-madinah-normal",
    "surah-name-v4.woff2": "surah-name-v4",
}

# Tajweed preview block on /tajweed_words/{S:V:W} pages: the whole ayah with
# per-word spans and <r class=RULE> letters inside each word.
PREVIEW_RE = re.compile(
    r'<div class="qpc-hafs tajweed-new char"[^>]*>(.*?)</div>\s*<h3', re.S)
WORD_SPAN_RE = re.compile(r"<span data-location='([^']+)'>(.*?)</span>", re.S)
RULE_RE = re.compile(r"<r class=([a-z_0-9]+)>")

# Out-of-range mushaf pages return an empty document, so a page with zero word
# units marks the end of the mushaf.
EMPTY_PAGE_RE = re.compile(r"data-location=")


# ---------------------------------------------------------------------------
# mushaf page parser (line-aware)
# ---------------------------------------------------------------------------

class LayoutParser(HTMLParser):
    """Walk a mushaf page export, grouping char units by mushaf line.

    Each page is a sequence of .line-container blocks; inside each, a .line div
    (class `line ...`) holds either a surah-name calligraphy span, a bismillah,
    or .ayah containers with .char spans (data-location). Emits:

      {"page": N, "lines": [ {"n":1, "cls": "...", "surah": 2|None, "units": [...]} ]}
    """

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.page = None
        self.lines = []
        self.cur_line = None
        self.cur_unit = None
        self.unit_depth = 0
        self.name_buf = None

    def handle_starttag(self, tag, attrs):
        ad = dict(attrs)
        if tag == "div":
            cls = ad.get("class", "")
            parts = cls.split()
            if ad.get("id") and re.match(r"page-\d+$", ad.get("id", "")):
                m = re.search(r"page-(\d+)", ad["id"])
                self.page = int(m.group(1)) if m else None
            if "line-container" in parts and ad.get("data-line"):
                pass  # line number is carried by the inner .line div's id
            elif parts and parts[0] == "line":
                ln = None
                m = re.search(r"line-(\d+)", ad.get("id", ""))
                if m:
                    ln = int(m.group(1))
                self.cur_line = {"n": ln, "cls": " ".join(parts), "surah": None, "units": []}
                self.lines.append(self.cur_line)
            return
        if tag == "span":
            cls = ad.get("class", "")
            if "surah-name-v4-icon" in cls.split():
                self.name_buf = []
                return
            if self.cur_unit is not None:
                self.unit_depth += 1
                return
            loc = ad.get("data-location")
            if loc and self.cur_line is not None:
                ctype = "unknown"
                for c in cls.split():
                    if c.startswith("char-"):
                        ctype = c[5:]
                        break
                self.cur_unit = {"loc": loc, "char_type": ctype, "text": ""}
                self.unit_depth = 1
            return
        if self.cur_unit is not None:
            return

    def handle_endtag(self, tag):
        if tag == "span":
            if self.cur_unit is not None:
                self.unit_depth -= 1
                if self.unit_depth <= 0:
                    if self.cur_line is not None:
                        self.cur_line["units"].append(self.cur_unit)
                    self.cur_unit = None
                return
            if self.name_buf is not None:
                txt = "".join(self.name_buf)
                m = re.search(r"surah(\d+)", txt)
                if m and self.cur_line is not None:
                    self.cur_line["surah"] = int(m.group(1))
                self.name_buf = None
                return

    def handle_data(self, data):
        if self.cur_unit is not None:
            self.cur_unit["text"] += data
        elif self.name_buf is not None:
            self.name_buf.append(data)


def parse_layout_page(raw):
    """Parse one mushaf page export into {page, lines:[...]}."""
    parser = LayoutParser()
    parser.feed(raw.decode("utf-8"))
    out = {"page": parser.page, "lines": []}
    for line in parser.lines:
        units = []
        for u in line["units"]:
            units.append({
                "loc": u["loc"],
                "char_type": u["char_type"],
                "text": re.sub(r"\s+", " ", u["text"]).strip(),
            })
        out["lines"].append({
            "n": line["n"],
            "cls": line["cls"],
            "surah": line["surah"],
            "units": units,
        })
    return out


def _loc_parts(loc):
    s, a, w = loc.split(":")
    return int(s), int(a), int(w)


def _is_contiguous(prev, cur):
    """True when cur == prev with word index +1 within the same ayah."""
    ps, pa, pw = _loc_parts(prev)
    cs, ca, cw = _loc_parts(cur)
    return ps == cs and pa == ca and cw == pw + 1


def _compress_locations(locs):
    """Run-length encode a list of locations into [[first_loc, count], ...]."""
    segs = []
    i = 0
    while i < len(locs):
        j = i
        while j + 1 < len(locs) and _is_contiguous(locs[j], locs[j + 1]):
            j += 1
        segs.append([locs[i], j - i + 1])
        i = j + 1
    return segs


def _line_kind(line):
    cls = line["cls"]
    if "line--surah-name" in cls:
        return "s"
    if "line--bismillah" in cls:
        return "b"
    return "w"


def _encode_line(line):
    kind = _line_kind(line)
    if kind == "s":
        return {"t": "s", "s": line["surah"] or 1}
    if kind == "b":
        return {"t": "b"}
    locs = [u["loc"] for u in line["units"]]
    return {"t": "w", "w": _compress_locations(locs)}


# ---------------------------------------------------------------------------
# page-count probing
# ---------------------------------------------------------------------------

def mushaf_page_url(layout_id, page):
    return "%s/exports/mushaf_page?mushaf_id=%d&page_number=%d" % (BASE, layout_id, page)


def page_has_words(layout_id, page, use_cache=True):
    raw = fetch(mushaf_page_url(layout_id, page), use_cache=use_cache)
    if not EMPTY_PAGE_RE.search(raw.decode("utf-8", "replace")):
        return False
    units = parse_mushaf_page(raw)
    return any(u["char_type"] == "word" for u in units)


def probe_page_count(layout_id, use_cache=True):
    """Binary search for the last page that still has word units (1..900)."""
    lo, hi = 1, 900
    last_ok = None
    while lo <= hi:
        mid = (lo + hi) // 2
        if page_has_words(layout_id, mid, use_cache):
            last_ok = mid
            lo = mid + 1
        else:
            hi = mid - 1
    if last_ok is None:
        raise RuntimeError("layout %d: no pages with word units found" % layout_id)
    return last_ok


# ---------------------------------------------------------------------------
# build: one layout bundle
# ---------------------------------------------------------------------------

def build_layout(layout_id, use_cache=True, workers=6, delay=0.4):
    print("\n-- layout %d (%s) --" % (layout_id, LAYOUTS[layout_id]["name"]))
    page_count = probe_page_count(layout_id, use_cache)
    print("  page count: %d" % page_count)

    def fetch_page(p):
        raw = fetch(mushaf_page_url(layout_id, p), use_cache=use_cache)
        parsed = parse_layout_page(raw)
        if not parsed["lines"]:
            raise RuntimeError("no lines parsed on mushaf page %d (layout %d)" % (p, layout_id))
        return p, parsed

    pages = parallel_map(fetch_page, range(1, page_count + 1), workers, "layout%d" % layout_id)

    pages_data = []
    ayah_page = {}
    page_first = {}
    page_last = {}
    line_nums = set()
    unit_total = 0
    for p, parsed in sorted(pages):
        lines = [_encode_line(line) for line in parsed["lines"]]
        for line in parsed["lines"]:
            if line["n"] is not None:
                line_nums.add(line["n"])
            for u in line["units"]:
                unit_total += 1
                akey = ":".join(u["loc"].split(":")[:2])
                if akey not in ayah_page:
                    ayah_page[akey] = p
                page_first.setdefault(str(p), akey)
                page_last[str(p)] = akey
        pages_data.append({"p": p, "lines": lines})

    lines_per_page = len(line_nums) if line_nums else 0
    bundle = {
        "layout_id": layout_id,
        "name": LAYOUTS[layout_id]["name"],
        "short": LAYOUTS[layout_id]["short"],
        "font_family": LAYOUTS[layout_id]["font_family"],
        "lines_per_page": lines_per_page,
        "page_count": page_count,
        "page_first": page_first,
        "page_last": page_last,
        "ayah_page": ayah_page,
        "pages": pages_data,
    }
    print("  lines/page: %d  units: %d  ayahs: %d" % (lines_per_page, unit_total, len(ayah_page)))
    return bundle


# ---------------------------------------------------------------------------
# build: tajweed rules
# ---------------------------------------------------------------------------

def tajweed_url(loc):
    return "%s/tajweed_words/%s" % (BASE, loc)


def parse_tajweed_preview(raw):
    """Extract {loc: [rule, ...]} from one /tajweed_words/{S:V:1} page."""
    text = raw.decode("utf-8")
    m = PREVIEW_RE.search(text)
    if not m:
        return None
    rules = {}
    for loc, inner in WORD_SPAN_RE.findall(m.group(1)):
        found = []
        for r in RULE_RE.findall(inner):
            if r in RULE_CLASSES and r not in found:
                found.append(r)
        if found:
            rules[loc] = found
    return rules


def build_tajweed(word_data, use_cache=True, workers=6, delay=0.4):
    print("\n-- tajweed rules --")
    ayah_keys = sorted(
        {":".join(loc.split(":")[:2]) for loc in word_data.keys()},
        key=lambda k: tuple(int(x) for x in k.split(":")))
    print("  ayahs to scrape: %d" % len(ayah_keys))

    word_locs = set(word_data.keys())
    word_locs_filter = {
        loc for loc in word_locs
        if word_data[loc].get("char_type") == "word"
    }

    def fetch_ayah(akey):
        raw = fetch(tajweed_url(akey + ":1"), use_cache=use_cache)
        return akey, parse_tajweed_preview(raw)

    out = {}
    stats = {"ayahs_fetched": 0, "previews": 0, "no_preview": [], "words_total": 0,
             "dropped_non_word_loc": 0, "unknown_rule": []}
    for akey, preview in parallel_map(fetch_ayah, ayah_keys, workers, "tajweed"):
        stats["ayahs_fetched"] += 1
        if not preview:
            stats["no_preview"].append(akey)
            continue
        stats["previews"] += 1
        for loc, rules in preview.items():
            if loc not in word_locs_filter:
                stats["dropped_non_word_loc"] += 1
                continue
            if rules:
                stats["words_total"] += 1
                out[loc] = rules
    stats["words_with_rules"] = len(out)
    print("  previews: %d/%d  words with rules: %d  dropped: %d"
          % (stats["previews"], stats["ayahs_fetched"], len(out),
             stats["dropped_non_word_loc"]))
    return out, stats


# ---------------------------------------------------------------------------
# build: fonts + css
# ---------------------------------------------------------------------------

def build_fonts(use_cache=True):
    print("\n-- fonts --")
    os.makedirs(FONT_DIR, exist_ok=True)
    results = {}
    for fname, url in FONTS:
        data = fetch(url, use_cache=use_cache)
        path = os.path.join(FONT_DIR, fname)
        with open(path, "wb") as fh:
            fh.write(data)
        results[fname] = len(data)
        print("  %-50s %dKB" % (fname, len(data) // 1024))
    return results


def write_css():
    print("\n-- css --")
    lines = []
    lines.append("/* Generated by scripts/build_qul_mushaf.py - QUL mushaf fonts +")
    lines.append("   tajweed rule colors. Do not hand-edit; re-run the builder. */")
    for fname, family in FONT_FAMILY_BY_FILE.items():
        lines.append("@font-face {")
        lines.append("    font-family: '%s';" % family)
        lines.append("    src: url('../fonts/%s') format('woff2');" % fname)
        lines.append("    font-display: swap;")
        lines.append("}")
        lines.append("")
    lines.append("/* Per-layout font families (local IndopakNastaleeq fallback) */")
    lines.append(".qr-mushaf-layout-17 { font-family: 'indopak-nastaleeq-hanafi-compressed', 'Indopak Nastaleeq', serif; }")
    lines.append(".qr-mushaf-layout-18 { font-family: 'indopak-nastaleeq-madinah-normal', 'Indopak Nastaleeq', serif; }")
    lines.append(".qr-mushaf-layout-7 { font-family: 'indopak-nastaleeq', 'Indopak Nastaleeq', serif; }")
    lines.append("")
    lines.append("/* Tajweed rule colors mirrored from QUL's export stylesheet")
    lines.append("   (.tajweed-new rules), scoped to the mushaf page. */")
    for rule in sorted(RULE_COLORS.keys()):
        lines.append(".qr-mushaf-page .%s { color: %s; }" % (rule, RULE_COLORS[rule]))
    lines.append("")
    lines.append("/* char unit colors (from QUL export css) */")
    lines.append(".qr-mushaf-page .qr-mushaf-end,")
    lines.append(".qr-mushaf-page .qr-mushaf-num { color: #00f; }")
    lines.append(".qr-mushaf-page .qr-mushaf-pause { color: #2cc990; }")
    lines.append("")
    lines.append("/* tajweed swatches (same palette as the word colors) */")
    for rule in sorted(RULE_COLORS.keys()):
        lines.append(".qr-tajweed-swatch.%s { background-color: %s; }" % (rule, RULE_COLORS[rule]))
    lines.append("")
    lines.append("/* dark theme relaxations for the darkest rule colors */")
    lines.append('[data-theme="dark"] .qr-mushaf-page .qr-mushaf-end,')
    lines.append('[data-theme="dark"] .qr-mushaf-page .qr-mushaf-num { color: #60a5fa; }')
    for rule in sorted(DARK_OVERRIDES.keys()):
        lines.append('[data-theme="dark"] .qr-mushaf-page .%s { color: %s; }'
                     % (rule, DARK_OVERRIDES[rule]))
        lines.append('[data-theme="dark"] .qr-tajweed-swatch.%s { background-color: %s; }'
                     % (rule, DARK_OVERRIDES[rule]))
    lines.append("")
    with open(CSS_PATH, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))
    print("  wrote %s (%d lines)" % (os.path.relpath(CSS_PATH, ROOT), len(lines)))


# ---------------------------------------------------------------------------
# dry-run
# ---------------------------------------------------------------------------

def dry_run(use_cache):
    print("== DRY RUN ==")
    print("probing QUL mushaf layouts + tajweed endpoints (cache: %s)" % use_cache)

    for lid in sorted(LAYOUTS.keys()):
        try:
            n = probe_page_count(lid, use_cache)
            raw = fetch(mushaf_page_url(lid, 1), use_cache=use_cache)
            parsed = parse_layout_page(raw)
            kinds = [_line_kind(l) for l in parsed["lines"]]
            words = [u["text"] for u in parsed["lines"][0]["units"]
                     if u["char_type"] == "word"]
            print("\n[probe] layout %d: pages=%d page1 lines=%d kinds=%s"
                  % (lid, n, len(parsed["lines"]), kinds))
            print("  page1 first words: %s" % words[:4])
        except Exception as exc:
            print("\n[probe] layout %d FAILED: %r" % (lid, exc))

    print("\n[probe] tajweed sample:")
    for loc in ["2:255:1", "1:1:1", "2:282:1"]:
        try:
            raw = fetch(tajweed_url(loc), use_cache=use_cache)
            rules = parse_tajweed_preview(raw)
            if rules is None:
                print("  %s: NO PREVIEW" % loc)
            else:
                sample = {k: v for k, v in list(rules.items())[:3]}
                print("  %s: %d word rules; sample %s" % (loc, len(rules), sample))
        except Exception as exc:
            print("  %s FAILED: %r" % (loc, exc))

    print("\n[probe] word bundle for filtering:")
    try:
        word_data = load_js_json(WORD_FILE, WORD_BASENAME)
        print("  %d units (%d words)" % (len(word_data),
              sum(1 for e in word_data.values() if e.get("char_type") == "word")))
    except Exception as exc:
        print("  could not load word bundle: %r" % exc)

    print("\nDry-run done.")


# ---------------------------------------------------------------------------
# full build
# ---------------------------------------------------------------------------

def build(args):
    print("== FULL BUILD ==")
    print("workers=%d delay=%.2f cache=%s" % (args.workers, args.delay, args.use_cache))
    bqd.LIMITER.min_interval = args.delay / max(args.workers, 1)

    report = {"generated": time.strftime("%Y-%m-%dT%H:%M:%S"), "layouts": {}, "tajweed": None, "fonts": {}}

    word_data = None
    try:
        word_data = load_js_json(WORD_FILE, WORD_BASENAME)
    except Exception as exc:
        print("WARNING: could not load indopak-nastaleeq-word.js (%r)" % exc)

    layout_ids = [int(x) for x in args.only_layout] if args.only_layout else sorted(LAYOUTS.keys())

    bundles = {}
    for lid in layout_ids:
        if lid not in LAYOUTS:
            print("skip unknown layout id %d" % lid)
            continue
        bundle = build_layout(lid, args.use_cache, args.workers, args.delay)
        bundles[lid] = bundle
        write_wrapped_js(os.path.join(SRC_DIR, "mushaf-layout-%d.js" % lid),
                         "mushaf-layout-%d" % lid, bundle)
        unit_total = sum(len(l.get("w", [])) for p in bundle["pages"] for l in p["lines"])
        report["layouts"][str(lid)] = {
            "page_count": bundle["page_count"],
            "lines_per_page": bundle["lines_per_page"],
            "units": unit_total,
            "ayahs": len(bundle["ayah_page"]),
            "file": "js/quran_source/mushaf-layout-%d.js" % lid,
        }
        print("  wrote mushaf-layout-%d.js" % lid)

    if bundles:
        meta = {
            "default_layout": DEFAULT_LAYOUT,
            "layouts": {str(lid): {
                "name": LAYOUTS[lid]["name"],
                "short": LAYOUTS[lid]["short"],
                "font_family": LAYOUTS[lid]["font_family"],
                "lines_per_page": bundles[lid]["lines_per_page"],
                "page_count": bundles[lid]["page_count"],
            } for lid in bundles},
        }
        write_wrapped_js(os.path.join(SRC_DIR, "mushaf-meta.js"), "mushaf-meta", meta)
        print("  wrote mushaf-meta.js (%d layouts)" % len(bundles))

    if not args.skip_tajweed:
        if word_data:
            rules, stats = build_tajweed(word_data, args.use_cache, args.workers, args.delay)
            write_wrapped_js(os.path.join(SRC_DIR, "tajweed-rules.js"), "tajweed-rules", rules)
            report["tajweed"] = stats
            print("  wrote tajweed-rules.js (%d words)" % len(rules))
        else:
            print("  SKIPPED tajweed: word bundle unavailable")

    if not args.skip_fonts:
        report["fonts"] = build_fonts(args.use_cache)
        write_css()

    with open(REPORT_PATH, "w", encoding="utf-8") as fh:
        json.dump(report, fh, ensure_ascii=False, indent=2)
    print("\nReport written to %s" % REPORT_PATH)


def main():
    ap = argparse.ArgumentParser(description="QUL mushaf layout + tajweed build")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--no-cache", dest="use_cache", action="store_false")
    ap.add_argument("--delay", type=float, default=0.4)
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--only-layout", type=int, nargs="*", default=None)
    ap.add_argument("--skip-tajweed", action="store_true")
    ap.add_argument("--skip-fonts", action="store_true")
    args = ap.parse_args()
    if args.delay <= 0:
        args.delay = 0.4
    if args.dry_run:
        dry_run(args.use_cache)
    else:
        build(args)


if __name__ == "__main__":
    main()
