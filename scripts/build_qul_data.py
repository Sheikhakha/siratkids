#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase 1 build: fetch QUL (qul.tarteel.ai) data and regenerate the reader data
bundles + the per-reciter count-match report.

Sources (all public, verified live):
  * WBW Indopak Nastaleeq text : GET /exports/mushaf_page?mushaf_id=6&page_number=N   (N=1..610; boundary probed at build time)
  * Verse-level Indopak text   : GET /ayah/<S:V>/text?script=text_indopak_nastaleeq   (6236 verses)
  * Word segments              : GET /api/v1/audio/{surah,ayah}_segments/<recitation_id>?chapter=C

Outputs:
  * js/quran_source/indopak-nastaleeq-word.js    (regenerated, same schema + ids from QUL data-word-id)
  * js/quran_source/indopak-nastaleeq-verse.js   (regenerated, same schema)
  * js/quran_source/segments/{sudais,shuraim,afasy,dussary}.js
  * scripts/qul_count_report.json + console summary (edge cases + full mismatch list + Juhani 162 scan)

Retry / throttle / caching are implemented in code below (http_get retries with backoff
+ Retry-After honouring; a pool-wide rate limiter; on-disk cache so reruns are free).

Usage:
  python scripts/build_qul_data.py --dry-run          # probes + parse validation, no writes
  python scripts/build_qul_data.py                    # full build
  python scripts/build_qul_data.py --skip-mushaf --skip-verse --skip-segments --skip-juhani-scan
"""

import argparse
import gzip
import hashlib
import html
import json
import os
import re
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib import request as urlrequest
from urllib.error import HTTPError, URLError
from html.parser import HTMLParser

try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except (AttributeError, OSError):
    pass

BASE = "https://qul.tarteel.ai"
UA = ("Mozilla/5.0 (compatible; SiratKids/QUL-build; educational Quran reader data "
      "generator; contact: project maintainer)")
SCRIPT = "text_indopak_nastaleeq"
MUSHAF_ID = 6
EXPECTED_VERSES = 6236

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE_DIR = os.path.join(HERE, ".qul_cache")
OUT_DIR = os.path.normpath(os.path.join(HERE, "..", "js", "quran_source"))
SEG_DIR = os.path.join(OUT_DIR, "segments")
REPORT_PATH = os.path.join(HERE, "qul_count_report.json")

WORD_BASENAME = "indopak-nastaleeq-word"
VERSE_BASENAME = "indopak-nastaleeq-verse"
WORD_FILE = os.path.join(OUT_DIR, WORD_BASENAME + ".js")
VERSE_FILE = os.path.join(OUT_DIR, VERSE_BASENAME + ".js")

RECITERS = [
    {"name": "sudais",  "api": 3,   "mode": "ayah",  "resource": 102,
     "audio_surah": None},
    {"name": "shuraim", "api": 10,  "mode": "surah", "resource": 107,
     "audio_surah": "https://audio-cdn.tarteel.ai/quran/surah/saudAlShuraim/murattal/mp3/{s}.mp3"},
    {"name": "afasy",   "api": 7,   "mode": "surah", "resource": 411,
     "audio_surah": "https://audio-cdn.tarteel.ai/quran/surah/alafasy/murattal/mp3/{s}.mp3"},
    {"name": "dussary", "api": 174, "mode": "surah", "resource": 422,
     "audio_surah": "https://audio-cdn.tarteel.ai/quran/surah/yasserAlDosari/murattal/mp3/{s}.mp3"},
]
JUHANI_API = 162

# Arabic-text overrides (user decision 2026-08-07): keep the ORIGINAL shipped
# spellings for these two words/verses -- QUL's current Indopak data spells them
# slightly differently. QUL is used only for segments/timing; word + verse text
# stays as shipped except where regeneration is otherwise byte-identical.
WORD_TEXT_OVERRIDES = {
    "59:13:1": "لَاَنْتُمْ",
    "27:21:5": "لَاَاَذْبَحَنَّهٗۤ",
}
VERSE_TEXT_OVERRIDES = {
    "59:13": "لَاَنْتُمْ اَشَدُّ رَهْبَةً فِیْ صُدُوْرِهِمْ مِّنَ اللّٰهِ ؕ ذٰلِكَ بِاَنَّهُمْ قَوْمٌ لَّا یَفْقَهُوْنَ ۟\uf50c",
    "27:21": "لَاُعَذِّبَنَّهٗ عَذَابًا شَدِیْدًا اَوْ لَاَاَذْبَحَنَّهٗۤ اَوْ لَیَاْتِیَنِّیْ بِسُلْطٰنٍ مُّبِیْنٍ ۟\uf514",
}

EDGE_CASE_VERSE_KEYS = [
    "2:282", "1:1", "2:1", "3:1", "4:1", "20:1", "36:1", "42:1",
    "2:255", "9:128", "9:129", "73:20", "112:1", "112:4", "114:6",
]

RETRYABLE = {429, 500, 502, 503, 504}


# ---------------------------------------------------------------------------
# rate limiting / fetching / caching
# ---------------------------------------------------------------------------

class RateLimiter(object):
    """Pool-wide spacing between request STARTS: min_interval seconds apart."""

    def __init__(self, min_interval):
        self.min_interval = min_interval
        self.lock = threading.Lock()
        self.next_t = 0.0

    def wait(self):
        with self.lock:
            now = time.monotonic()
            wait = self.next_t - now
            if wait > 0:
                time.sleep(wait)
                now = time.monotonic()
            self.next_t = now + self.min_interval


LIMITER = RateLimiter(0.05)  # overridden at runtime


def http_get(url, retries=5, timeout=30):
    """GET with retries + backoff + Retry-After honouring. Returns (bytes, headers)."""
    last = None
    for attempt in range(retries + 1):
        if attempt:
            time.sleep(min(1.5 ** attempt, 30.0))
        try:
            req = urlrequest.Request(url, headers={
                "User-Agent": UA,
                "Accept-Encoding": "gzip",
            })
            LIMITER.wait()
            with urlrequest.urlopen(req, timeout=timeout) as resp:
                body = resp.read()
                if resp.headers.get("Content-Encoding", "").lower() == "gzip":
                    body = gzip.decompress(body)
                return body, resp.headers
        except HTTPError as exc:
            last = "HTTP %s" % exc.code
            if exc.code in RETRYABLE or exc.code >= 500:
                ra = exc.headers.get("Retry-After")
                if ra:
                    try:
                        time.sleep(max(0.0, float(ra)))
                    except ValueError:
                        pass
                continue
            raise
        except URLError as exc:
            last = "URLError: %s" % (exc.reason,)
            continue
        except Exception as exc:  # timeout / ssl / connection reset
            last = "%s: %s" % (type(exc).__name__, exc)
            continue
    raise RuntimeError("fetch failed after %d retries: %s | last error: %s" % (retries, url, last))


def _cache_path(url):
    digest = hashlib.sha256(url.encode("utf-8")).hexdigest()[:20]
    return os.path.join(CACHE_DIR, digest)


def fetch(url, use_cache=True):
    """Cache-aware fetch returning bytes."""
    if use_cache:
        path = _cache_path(url)
        if os.path.exists(path):
            with open(path, "rb") as fh:
                return fh.read()
    data, _headers = http_get(url)
    if use_cache:
        os.makedirs(CACHE_DIR, exist_ok=True)
        with open(_cache_path(url), "wb") as fh:
            fh.write(data)
    return data


def fetch_json(url, use_cache=True):
    return json.loads(fetch(url, use_cache=use_cache).decode("utf-8"))


def fetch_text(url, use_cache=True):
    return fetch(url, use_cache=use_cache).decode("utf-8")


def parallel_map(fn, items, workers, desc=""):
    """Run fn(item) across a pool, preserving input order in the returned list."""
    done = 0
    total = len(items)
    results = [None] * total
    lock = threading.Lock()

    def wrapped(i, item):
        r = fn(item)
        with lock:
            nonlocal done
            done += 1
            if done % 200 == 0 or done == total:
                print("  [%s] %d/%d" % (desc, done, total), flush=True)
        return i, r

    with ThreadPoolExecutor(max_workers=workers) as pool:
        futs = [pool.submit(wrapped, i, it) for i, it in enumerate(items)]
        for fut in as_completed(futs):
            i, r = fut.result()
            results[i] = r
    return results


# ---------------------------------------------------------------------------
# parsing
# ---------------------------------------------------------------------------

class MushafParser(HTMLParser):
    """Walk a mushaf page export and collect every data-location char unit,
    handling nested <span>s (e.g. inline mark spans) correctly."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.units = []
        self.cur = None
        self.depth = 0

    def handle_starttag(self, tag, attrs):
        if tag == "span":
            if self.cur is not None:
                self.depth += 1
                return
            ad = dict(attrs)
            cls = ad.get("class", "").split()
            ctype = "unknown"
            for c in cls:
                if c.startswith("char-"):
                    ctype = c[5:]
                    break
            loc = ad.get("data-location")
            if loc:
                self.cur = {
                    "location": loc,
                    "ayah": ad.get("data-ayah", ""),
                    "position": ad.get("data-position", ""),
                    "word_id": ad.get("data-word-id", ""),
                    "char_type": ctype,
                    "text": "",
                }
                self.depth = 1
        elif self.cur is not None:
            return

    def handle_endtag(self, tag):
        if tag == "span" and self.cur is not None:
            self.depth -= 1
            if self.depth <= 0:
                self.units.append(self.cur)
                self.cur = None

    def handle_data(self, data):
        if self.cur is not None:
            self.cur["text"] += data


def _clean_text(text):
    return re.sub(r"\s+", " ", text).strip()


def parse_mushaf_page(raw):
    """Return list of dicts for every char unit on a mushaf page export."""
    parser = MushafParser()
    parser.feed(raw.decode("utf-8"))
    units = []
    for u in parser.units:
        units.append({
            "location": u["location"],
            "ayah": u["ayah"],
            "position": u["position"],
            "word_id": u["word_id"],
            "char_type": u["char_type"],
            "text": _clean_text(u["text"]),
        })
    return units


VERSE_DIV_RE = re.compile(
    r'<div\b[^>]*\bdir="rtl"[^>]*class="[^"]*text-3xl[^"]*"[^>]*>(.*?)</div>', re.S)


def parse_verse_text(raw):
    text = raw.decode("utf-8")
    m = VERSE_DIV_RE.search(text)
    if not m:
        raise ValueError("verse text div (text-3xl) not found in page")
    body = re.sub(r"<[^>]+>", "", m.group(1))
    body = html.unescape(body)
    return _clean_text(body)


def load_js_json(filepath, basename):
    """Extract the __QURAN_DATA[basename] object from a wrapped JS file."""
    with open(filepath, "r", encoding="utf-8") as fh:
        raw = fh.read()
    m = re.search(
        r'__QURAN_DATA\["' + re.escape(basename) + r'"\]\s*=\s*(\{.*?\})(?=\s*;)',
        raw, re.S)
    if not m:
        raise ValueError("could not extract %s from %s" % (basename, filepath))
    return json.loads(m.group(1))


def numkey(key):
    return tuple(int(x) for x in key.split(":"))


def sort_keys(keys):
    return sorted(keys, key=numkey)


def apply_text_overrides(obj, overrides):
    """Force specific locations/verses back to the shipped spelling."""
    applied = []
    for key, text in overrides.items():
        if key in obj:
            obj[key]["text"] = text
            applied.append(key)
    return applied


# ---------------------------------------------------------------------------
# writers
# ---------------------------------------------------------------------------

def write_wrapped_js(path, basename, obj):
    body = json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
    wrapper = ('(function(g){g.__QURAN_DATA=g.__QURAN_DATA||{};'
               'g.__QURAN_DATA["%s"]=%s;})(self);\n') % (basename, body)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(wrapper)


# ---------------------------------------------------------------------------
# segment normalization
# ---------------------------------------------------------------------------

def normalize_surah_verse(entry, surah_url):
    segs = entry.get("segments") or []
    clean = []
    for s in segs:
        clean.append([int(s[0]), int(s[1]), int(s[2])])
    return {
        "start": int(entry.get("time_from", 0)),
        "end": int(entry.get("time_to", 0)),
        "segments": clean,
    }


def normalize_ayah_verse(entry):
    raw = entry.get("segments") or []
    segs = []
    max_end = 0
    for t in raw:
        wf = int(t[0])
        wt = int(t[1])
        st = int(t[2])
        en = int(t[3])
        if en > max_end:
            max_end = en
        for w in range(wf, wt):
            segs.append([w + 1, st, en])
    return {
        "audio": entry.get("audio_url", ""),
        "start": 0,
        "end": max_end,
        "segments": segs,
    }


def segment_endpoint(rec):
    kind = "ayah" if rec["mode"] == "ayah" else "surah"
    return "%s/api/v1/audio/%s_segments/%d" % (BASE, kind, rec["api"])


# ---------------------------------------------------------------------------
# report
# ---------------------------------------------------------------------------

def compute_char_word_counts(word_data):
    """char_type=='word' unit count per verse (excludes end/pause/sign units)."""
    counts = {}
    for loc, entry in word_data.items():
        if entry.get("char_type") != "word":
            continue
        key = ":".join(loc.split(":")[:2])
        counts[key] = counts.get(key, 0) + 1
    return counts


def build_verse_report(bundle, char_counts, rec):
    rows = []
    for key in sort_keys(bundle["verses"].keys()):
        entry = bundle["verses"][key]
        segs = entry["segments"]
        idxs = [s[0] for s in segs]
        distinct = sorted(set(idxs))
        cw = char_counts.get(key, 0)
        missing = [i for i in range(1, cw + 1) if i not in idxs]
        extra = [i for i in distinct if i > cw]
        has_dupes = len(idxs) != len(distinct)
        no_word_data = cw == 0
        matched = (not no_word_data) and not missing and not extra
        sample = []
        if segs:
            sample = [segs[0]]
            if len(segs) > 1:
                sample.append(segs[-1])
        rows.append({
            "verse_key": key,
            "segment_count": len(idxs),
            "distinct_segment_count": len(distinct),
            "char_word_count": cw,
            "max_segment_index": max(idxs, default=0),
            "missing_indices_count": len(missing),
            "missing_indices": missing[:20],
            "extra_indices": extra[:20],
            "has_duplicate_indices": has_dupes,
            "no_word_data": no_word_data,
            "matched": matched,
            "segments_sample": sample,
        })
    return rows


def write_report(word_data, bundles, juhani_scan):
    char_counts = compute_char_word_counts(word_data)
    report = {
        "generated": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "methodology": (
            "For every verse: the set of DISTINCT QUL word-segment indices is compared "
            "against {1..N} where N is the number of Indopak Nastaleeq units of "
            "char_type 'word' (end/pause/sign units such as the ۟ end-marker are excluded). "
            "A verse MATCHES when the segment set is exactly {1..N}. Duplicate indices "
            "(repeated segments, seen in Afasy/Dussary data where a phrase is recited "
            "twice) are allowed and do not break word-by-word playback. A mismatch is "
            "recorded for gaps (missing indices -> words with no timing), indices beyond "
            "N, or verses with no word data at all."),
        "summary": {},
        "edge_cases": {},
        "mismatches": {},
        "juhani_162_scan": juhani_scan,
    }
    for rec in RECITERS:
        name = rec["name"]
        bundle = bundles[name]
        rows = build_verse_report(bundle, char_counts, rec)
        total = len(rows)
        mismatched = [r for r in rows if not r["matched"]]
        report["summary"][name] = {
            "recitation_api_id": rec["api"],
            "resource_id": rec["resource"],
            "mode": rec["mode"],
            "verses_compared": total,
            "matched": total - len(mismatched),
            "mismatched": len(mismatched),
            "with_duplicate_indices": sum(1 for r in rows if r["has_duplicate_indices"]),
            "no_word_data": sum(1 for r in rows if r["no_word_data"]),
            "mismatch_gaps": sum(1 for r in mismatched if r["missing_indices_count"]),
            "mismatch_out_of_range": sum(1 for r in mismatched if r["extra_indices"]),
        }
        report["mismatches"][name] = mismatched
        ec = {}
        for k in EDGE_CASE_VERSE_KEYS:
            row = next((r for r in rows if r["verse_key"] == k), None)
            if row:
                ec[k] = row
        report["edge_cases"][name] = ec

    with open(REPORT_PATH, "w", encoding="utf-8") as fh:
        json.dump(report, fh, ensure_ascii=False, indent=2)
    return report


def print_report(report):
    print("\n==================== COUNT-MATCH REPORT ====================")
    print("methodology: %s" % report["methodology"])
    print("\n-- summary --")
    for name, s in report["summary"].items():
        print("  %-9s rec#%-3d mode=%-5s compared=%4d matched=%4d mismatched=%3d "
              "dupes=%3d noWordData=%3d gaps=%3d outOfRange=%3d"
              % (name, s["recitation_api_id"], s["mode"],
                 s["verses_compared"], s["matched"], s["mismatched"],
                 s["with_duplicate_indices"], s["no_word_data"],
                 s["mismatch_gaps"], s["mismatch_out_of_range"]))

    print("\n-- edge-case verses (segment_count / distinct vs char_word_count) --")
    for name, ec in report["edge_cases"].items():
        print("  %s:" % name)
        for k, row in ec.items():
            print("    %-6s seg=%3d distinct=%3d word=%3d maxIdx=%3d matched=%s"
                  " missing=%s extra=%s dup=%s"
                  % (k, row["segment_count"], row["distinct_segment_count"],
                     row["char_word_count"], row["max_segment_index"],
                     row["matched"], row["missing_indices"], row["extra_indices"],
                     row["has_duplicate_indices"]))

    print("\n-- full mismatch list --")
    any_mismatch = False
    for name, mism in report["mismatches"].items():
        if mism:
            any_mismatch = True
            print("  %s (%d):" % (name, len(mism)))
            for row in mism:
                print("    %-6s seg=%3d distinct=%3d word=%3d maxIdx=%3d matched=%s"
                      " noWordData=%s missing=%s extra=%s dup=%s"
                      % (row["verse_key"], row["segment_count"],
                         row["distinct_segment_count"], row["char_word_count"],
                         row["max_segment_index"], row["matched"],
                         row["no_word_data"], row["missing_indices"],
                         row["extra_indices"], row["has_duplicate_indices"]))
    if not any_mismatch:
        print("  (none)")

    j = report.get("juhani_162_scan") or {}
    print("\n-- Juhani 162 scan (resource 415) --")
    print("  chapters_fetched=%s total_verses=%s verses_with_word_segments=%s"
          % (j.get("chapters_fetched"), j.get("total_verses"),
             j.get("verses_with_word_segments")))
    print("\nReport JSON written to %s" % REPORT_PATH)


# ---------------------------------------------------------------------------
# dry-run
# ---------------------------------------------------------------------------

def load_old(path, basename):
    try:
        return load_js_json(path, basename)
    except (OSError, ValueError):
        return None


def dry_run(args):
    print("== DRY RUN ==")
    print("probing QUL endpoints and validating parsers (cache: %s)" % args.use_cache)

    # 1. segment range behaviour
    for label, url in [
        ("surah_segments/7 chapter=2 from=1 to=300", segment_endpoint(RECITERS[2]) + "?chapter=2&from=1&to=300"),
        ("surah_segments/10 chapter=2 from=1 to=300", segment_endpoint(RECITERS[1]) + "?chapter=2&from=1&to=300"),
        ("ayah_segments/3 chapter=2 from=1 to=300", segment_endpoint(RECITERS[0]) + "?chapter=2&from=1&to=300"),
        ("surah_segments/162 chapter=1 from=1 to=7", "%s/api/v1/audio/surah_segments/%d?chapter=1&from=1&to=7" % (BASE, JUHANI_API)),
    ]:
        try:
            data = fetch_json(url, use_cache=args.use_cache)
            segs = data.get("segments") or {}
            pag = data.get("pagination") or {}
            first_key = sort_keys(segs.keys())[0] if segs else None
            first_entry = segs.get(first_key) if first_key else None
            n_nonempty = sum(1 for e in segs.values() if e.get("segments"))
            print("\n[probe] %s" % label)
            print("  verses=%d pagination=%s first_key=%s nonempty_segments=%d"
                  % (len(segs), json.dumps(pag), first_key, n_nonempty))
            if first_key:
                print("  first entry: %s" % json.dumps(first_entry)[:400])
        except Exception as exc:
            print("\n[probe] %s FAILED: %r" % (label, exc))

    # 2. mushaf page 1 parse
    try:
        raw = fetch("%s/exports/mushaf_page?mushaf_id=%d&page_number=1"
                    % (BASE, MUSHAF_ID), use_cache=args.use_cache)
        units = parse_mushaf_page(raw)
        print("\n[probe] mushaf_page 6 page 1: %d char units (expected 36)" % len(units))
        for u in units[:5]:
            print("  %s id=%s type=%s text=%r" % (u["location"], u["word_id"], u["char_type"], u["text"]))
        for u in units[-2:]:
            print("  %s id=%s type=%s text=%r" % (u["location"], u["word_id"], u["char_type"], u["text"]))
        old_words = load_old(WORD_FILE, WORD_BASENAME)
        if old_words:
            renamed = [u["location"] for u in units
                       if u["word_id"].isdigit() and u["location"] in old_words
                       and old_words[u["location"]].get("id") != int(u["word_id"])]
            print("  page-1 id diffs (local file renumbers sequentially vs QUL global data-word-id): %d"
                  % len(renamed))
            for loc in renamed[:3]:
                print("    %s local=%s QUL=%s" % (loc, old_words[loc].get("id"),
                                                  next(u["word_id"] for u in units if u["location"] == loc)))
            missing = [u["location"] for u in units if u["location"] not in old_words]
            print("  page-1 locations missing from existing file: %s" % missing)
            text_diffs = 0
            for u in units:
                old = old_words.get(u["location"])
                if old and old.get("text") != u["text"]:
                    text_diffs += 1
                    if text_diffs <= 5:
                        print("    TEXT DIFF %s: QUL=%r local=%r" % (u["location"], u["text"], old.get("text")))
            print("  page-1 text diffs vs local file: %d" % text_diffs)
            # char-word count sanity for page 1 (1:1..1:7 -> 4+4+1+4+4+3+9 = 29 words + 7 end units)
            words = [u for u in units if u["char_type"] == "word"]
            ends = [u for u in units if u["char_type"] == "end"]
            print("  page-1 char-word units: %d (expected 29); end units: %d (expected 7)"
                  % (len(words), len(ends)))
        snippet = re.search(r'<span\b[^>]*\bdata-location="[^"]*"[^>]*>', raw.decode("utf-8"))
        print("  raw span sample:", snippet.group(0)[:300] if snippet else "NOT FOUND")
    except Exception as exc:
        import traceback
        traceback.print_exc()
        print("[probe] mushaf parse FAILED: %r" % exc)

    # 3. verse text parse
    try:
        raw = fetch("%s/ayah/1:1/text?script=%s" % (BASE, SCRIPT), use_cache=args.use_cache)
        parsed = parse_verse_text(raw)
        print("\n[probe] ayah 1:1 text parse:", repr(parsed))
        old_verses = load_old(VERSE_FILE, VERSE_BASENAME)
        if old_verses and "1:1" in old_verses:
            print("  existing 1:1 text:", repr(old_verses["1:1"].get("text")))
    except Exception as exc:
        print("[probe] verse text parse FAILED: %r" % exc)

    # 4. local wrappers (tail)
    for path, name in [(WORD_FILE, WORD_BASENAME), (VERSE_FILE, VERSE_BASENAME)]:
        try:
            with open(path, "r", encoding="utf-8") as fh:
                raw = fh.read()
            print("\n[probe] %s wrapper tail: %r" % (os.path.basename(path), raw[-90:]))
        except OSError as exc:
            print("\n[probe] %s unreadable: %r" % (path, exc))

    print("\nDry-run done.")


# ---------------------------------------------------------------------------
# full build
# ---------------------------------------------------------------------------

def build(args):
    print("== FULL BUILD ==")
    print("workers=%d delay=%.2fs min_spacing=%.3fs cache=%s"
          % (args.workers, args.delay, args.delay / max(args.workers, 1), args.use_cache))
    LIMITER.min_interval = args.delay / max(args.workers, 1)

    word_data = {}
    old_words = load_old(WORD_FILE, WORD_BASENAME)
    if old_words:
        print("loaded existing word bundle: %d entries (id preservation source)" % len(old_words))

    # ---- 1. mushaf pages -> word bundle --------------------------------
    if not args.skip_mushaf:
        print("\n-- locating mushaf page count (probe from 604) --")
        max_page = 604
        for p in range(604, 701):
            raw = fetch("%s/exports/mushaf_page?mushaf_id=%d&page_number=%d"
                        % (BASE, MUSHAF_ID, p), use_cache=args.use_cache)
            units = parse_mushaf_page(raw)
            if not units:
                max_page = p - 1
                break
            max_page = p
        if max_page >= 700:
            raise SystemExit("mushaf page-count probe ran off the end (>=700); aborting")
        print("  mushaf has %d pages" % max_page)

        print("\n-- fetching mushaf %d pages (1..%d) --" % (MUSHAF_ID, max_page))

        def fetch_page(p):
            raw = fetch("%s/exports/mushaf_page?mushaf_id=%d&page_number=%d"
                        % (BASE, MUSHAF_ID, p), use_cache=args.use_cache)
            units = parse_mushaf_page(raw)
            if not units:
                raise RuntimeError("no char units parsed on mushaf page %d" % p)
            return p, units

        pages = parallel_map(fetch_page, range(1, max_page + 1), args.workers, "mushaf")
        for p, units in pages:
            for u in units:
                loc = u["location"]
                s, a, w = loc.split(":")
                entry = {
                    "id": int(u["word_id"]) if u["word_id"].isdigit() else _next_id(word_data),
                    "surah": s,
                    "ayah": a,
                    "word": w,
                    "location": loc,
                    "text": u["text"],
                    "char_type": u["char_type"],
                }
                word_data[loc] = entry
        print("parsed %d char units from mushaf" % len(word_data))
        if old_words and len(word_data) != len(old_words):
            print("  WARNING: unit count differs from existing bundle (%d != %d)"
                  % (len(word_data), len(old_words)))
        if len(word_data) == 0:
            raise SystemExit("no char units parsed from mushaf pages")
    else:
        word_data = load_old(WORD_FILE, WORD_BASENAME) or {}
        print("-- mushaf skipped; using existing word bundle (%d entries)" % len(word_data))

    if args.skip_mushaf and not word_data:
        raise SystemExit("no word data available; cannot continue")

    # unique verse keys from word data
    verse_keys = sorted({":".join(loc.split(":")[:2]) for loc in word_data.keys()}, key=numkey)
    print("verse keys derived from word data: %d (expected ~%d)"
          % (len(verse_keys), EXPECTED_VERSES))

    # ---- 2. verse-level text -> verse bundle ---------------------------
    verses_new = {}
    if not args.skip_verse:
        print("\n-- fetching verse-level text (%d verses) --" % len(verse_keys))

        def fetch_verse(key):
            raw = fetch("%s/ayah/%s/text?script=%s" % (BASE, key, SCRIPT),
                        use_cache=args.use_cache)
            try:
                text = parse_verse_text(raw)
            except ValueError:
                text = ""
            return key, text

        for key, text in parallel_map(fetch_verse, verse_keys, args.workers, "verse-text"):
            s, a = key.split(":")
            verses_new[key] = {
                "id": 0,
                "verse_key": key,
                "surah": int(s),
                "ayah": int(a),
                "text": text,
            }
            if not text:
                print("  WARNING: empty verse text for %s" % key)

        # preserve existing ids by verse_key
        old_verses = load_old(VERSE_FILE, VERSE_BASENAME) or {}
        for key, entry in verses_new.items():
            if key in old_verses:
                entry["id"] = int(old_verses[key].get("id", 0))
        max_old_id = max((int(e.get("id", 0)) for e in old_verses.values()), default=0)
        nid = max_old_id + 1
        for key in sort_keys(verses_new.keys()):
            if verses_new[key]["id"] == 0:
                verses_new[key]["id"] = nid
                nid += 1

        # order like existing file (key order) and write
        ordered = {k: verses_new[k] for k in sort_keys(verses_new.keys())}
        overridden = apply_text_overrides(ordered, VERSE_TEXT_OVERRIDES)
        if overridden:
            print("  applied verse text overrides: %s" % overridden)
        write_wrapped_js(VERSE_FILE, VERSE_BASENAME, ordered)
        print("wrote %s (%d verses)" % (VERSE_FILE, len(ordered)))
    else:
        verses_new = load_old(VERSE_FILE, VERSE_BASENAME) or {}
        print("-- verse fetch skipped; using existing verse bundle (%d verses)" % len(verses_new))

    # ---- 3. segments -> per-reciter bundles ----------------------------
    bundles = {}
    if not args.skip_segments:
        print("\n-- fetching + normalizing word segments --")
        for rec in RECITERS:
            name = rec["name"]
            print("  reciter %s (api %d, %s mode)" % (name, rec["api"], rec["mode"]))
            endpoint = segment_endpoint(rec)
            audio_map = {}
            verses = {}

            def fetch_chapter(ch):
                # page 1 of a wide range returns the first 20 verses plus the
                # chapter's total_count (all chapters are < 300 verses), so it
                # also gives us the paging bound without risking a 500.
                out = {}
                first = fetch_json("%s?chapter=%d&from=1&to=300" % (endpoint, ch),
                                   use_cache=args.use_cache)
                out.update(first.get("segments") or {})
                total = (first.get("pagination") or {}).get("total_count") or len(out)
                from_v = 21
                while from_v <= total:
                    url = "%s?chapter=%d&from=%d&to=%d" % (endpoint, ch, from_v, min(from_v + 19, total))
                    data = fetch_json(url, use_cache=args.use_cache)
                    more = data.get("segments") or {}
                    if not more:
                        break
                    out.update(more)
                    from_v += 20
                return ch, out

            for ch, segs in parallel_map(fetch_chapter, range(1, 115), args.workers, name):
                if rec["mode"] == "surah":
                    url = rec["audio_surah"].format(s="%03d" % ch)
                    audio_map[str(ch)] = url
                    for key, entry in segs.items():
                        verses[key] = normalize_surah_verse(entry, url)
                else:
                    for key, entry in segs.items():
                        verses[key] = normalize_ayah_verse(entry)
                        audio_map[key] = verses[key]["audio"]

            bundle = {
                "name": name,
                "mode": rec["mode"],
                "resource_id": rec["resource"],
                "recitation_api_id": rec["api"],
                "audio": audio_map,
                "verses": {k: verses[k] for k in sort_keys(verses.keys())},
            }
            bundles[name] = bundle
            write_wrapped_js(os.path.join(SEG_DIR, name + ".js"), "segments-" + name, bundle)
            print("    wrote segments/%s.js (%d verses)" % (name, len(bundle["verses"])))
    else:
        for rec in RECITERS:
            name = rec["name"]
            path = os.path.join(SEG_DIR, name + ".js")
            if os.path.exists(path):
                bundles[name] = load_js_json(path, "segments-" + name)
            else:
                print("  WARNING: %s segment bundle missing and --skip-segments set" % path)
        print("-- segment fetch skipped")

    # ---- 4. write word bundle (mushaf-derived) -------------------------
    if not args.skip_mushaf:
        ordered_words = {k: word_data[k] for k in sort_keys(word_data.keys())}
        overridden = apply_text_overrides(ordered_words, WORD_TEXT_OVERRIDES)
        if overridden:
            print("  applied word text overrides: %s" % overridden)
        write_wrapped_js(WORD_FILE, WORD_BASENAME, ordered_words)
        print("wrote %s (%d entries)" % (WORD_FILE, len(ordered_words)))

    # ---- 5. Juhani 162 scan --------------------------------------------
    juhani_scan = {"chapters_fetched": 0, "total_verses": 0,
                   "verses_with_word_segments": 0, "empty_chapters": []}
    if not args.skip_juhani_scan:
        print("\n-- scanning Juhani 162 (resource 415) for word segments --")
        endpoint = "%s/api/v1/audio/surah_segments/%d" % (BASE, JUHANI_API)

        def scan_ch(ch):
            first = fetch_json("%s?chapter=%d&from=1&to=300" % (endpoint, ch),
                               use_cache=args.use_cache)
            segs = first.get("segments") or {}
            count = len(segs)
            with_nonempty = sum(1 for e in segs.values() if e.get("segments"))
            total = (first.get("pagination") or {}).get("total_count") or count
            from_v = 21
            while from_v <= total:
                data = fetch_json("%s?chapter=%d&from=%d&to=%d"
                                  % (endpoint, ch, from_v, min(from_v + 19, total)),
                                  use_cache=args.use_cache)
                more = data.get("segments") or {}
                if not more:
                    break
                count += len(more)
                with_nonempty += sum(1 for e in more.values() if e.get("segments"))
                from_v += 20
            return ch, count, with_nonempty

        for ch, total, nonempty in parallel_map(scan_ch, range(1, 115), args.workers, "juhani"):
            juhani_scan["chapters_fetched"] += 1
            juhani_scan["total_verses"] += total
            juhani_scan["verses_with_word_segments"] += nonempty
            if nonempty:
                juhani_scan.setdefault("empty_chapters", [])
                juhani_scan["empty_chapters"].append(ch)
        print("  Juhani scan: chapters=%d verses=%d with_segments=%d"
              % (juhani_scan["chapters_fetched"], juhani_scan["total_verses"],
                 juhani_scan["verses_with_word_segments"]))
        if juhani_scan.get("empty_chapters"):
            print("  chapters WITH word segments: %s" % juhani_scan["empty_chapters"])
    else:
        print("\n-- Juhani scan skipped --")

    # ---- 6. count-match report -----------------------------------------
    print("\n-- building count-match report --")
    report = write_report(word_data, bundles, juhani_scan)
    print_report(report)


def _next_id(data):
    n = 1
    for e in data.values():
        if isinstance(e.get("id"), int):
            n = max(n, e["id"] + 1)
    return n


def main():
    ap = argparse.ArgumentParser(description="QUL data build + count-match report")
    ap.add_argument("--dry-run", action="store_true", help="probe + validate, no writes")
    ap.add_argument("--no-cache", dest="use_cache", action="store_false",
                    help="bypass the on-disk cache")
    ap.add_argument("--delay", type=float, default=0.4, help="pool-wide request spacing (s)")
    ap.add_argument("--workers", type=int, default=4, help="concurrent fetches")
    ap.add_argument("--skip-mushaf", action="store_true")
    ap.add_argument("--skip-verse", action="store_true")
    ap.add_argument("--skip-segments", action="store_true")
    ap.add_argument("--skip-juhani-scan", action="store_true")
    args = ap.parse_args()

    if args.delay <= 0:
        args.delay = 0.4

    if args.dry_run:
        dry_run(args)
    else:
        build(args)


if __name__ == "__main__":
    main()
