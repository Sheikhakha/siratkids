#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Extract Tamil Tafsir (Ibn Kathir) for every ayah of the Quran from
https://www.tamililquran.com/tafsiribnkathir.php?sura={s}&ayah={a}

Output: one wrapped .js file per surah under js/tafsir/ plus a manifest.
Resumable: skips ayahs already written. Uses stdlib only.
"""

import argparse
import html
import json
import os
import re
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX_PATH = os.path.join(ROOT, "js", "quran-full-index.json")
OUT_DIR = os.path.join(ROOT, "js", "tafsir")

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
ACCEPT_LANG = "ta-IN,ta;q=0.9,en;q=0.8"

TAFSIR_RE = re.compile(
    r"<div class=(['\"])tafsir-text tamil-custom-font[^'\"]*\1>(.*?)</div>\s*</div>\s*</div>",
    re.S,
)
TAFSIR_RE2 = re.compile(r"<div class=['\"]tafsir-text[^>]*>(.*?)</div>", re.S)


def load_chapters():
    with open(INDEX_PATH, encoding="utf-8") as f:
        data = json.load(f)
    chapters = {}
    for ch in data["chapters"]:
        chapters[ch["id"]] = ch
    return chapters


def fetch_page(sura, ayah, timeout=60):
    url = f"https://www.tamililquran.com/tafsiribnkathir.php?sura={sura}&ayah={ayah}"
    req = urllib.request.Request(
        url, headers={"User-Agent": UA, "Accept-Language": ACCEPT_LANG}
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read()
    return raw.decode("utf-8", "replace")


def extract_tafsir(page):
    """Return (html_content, text_content)."""
    m = TAFSIR_RE.search(page)
    if not m:
        m = TAFSIR_RE2.search(page)
    if not m:
        return None, None
    content = m.group(2) if len(m.groups()) > 1 else m.group(1)
    content = content.strip()
    text = re.sub(r"<br\s*/?>", "\n", content)
    text = re.sub(r"</(p|div)>", "\n", text)
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text)
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return content, text


def verse_key(sura, ayah):
    return f"{sura}:{ayah}"


def write_data_js(path, payload):
    """Write a data payload as a wrapped .js file (loaded via <script>, works on file://)."""
    name = os.path.splitext(os.path.basename(path))[0]
    body = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write('(function(g){g.__QURAN_DATA=g.__QURAN_DATA||{};g.__QURAN_DATA["')
        f.write(name)
        f.write('"]=')
        f.write(body)
        f.write(';})(self);\n')
    os.replace(tmp, path)


def read_data_js(path):
    """Parse a wrapped .js data file back into a dict."""
    with open(path, encoding="utf-8") as f:
        text = f.read()
    body = text.split('"]=', 1)[1].rsplit(';})(self);', 1)[0]
    return json.loads(body)


def load_done(path):
    """Load already-extracted ayah numbers from an existing output file."""
    if not os.path.exists(path):
        return set(), {}
    data = read_data_js(path)
    done = {int(a) for a in data.get("data", {})}
    missing = set(data.get("missing", []))
    return done, missing


def process_one(chapters, sura, ayah, log):
    for attempt in range(1, 5):
        try:
            page = fetch_page(sura, ayah)
            content, text = extract_tafsir(page)
            if content is None:
                return verse_key(sura, ayah), {"ok": False, "reason": "no_tafsir_div", "sura": sura, "ayah": ayah}
            return verse_key(sura, ayah), {"ok": True, "sura": sura, "ayah": ayah, "html": content, "text": text}
        except Exception as e:  # noqa: BLE001
            if attempt == 4:
                return verse_key(sura, ayah), {"ok": False, "reason": f"error: {e}", "sura": sura, "ayah": ayah}
            time.sleep(2 * attempt)


def scrape_surah(chapters, sura, workers, delay, force, log):
    ch = chapters[sura]
    total = ch["verses"]
    out_path = os.path.join(OUT_DIR, f"tamil-{sura:03d}.js")
    done, missing = load_done(out_path)
    pending = []
    for a in range(1, total + 1):
        if a in done:
            continue
        pending.append(a)

    if not pending and not force:
        log.write(f"sura {sura}: complete ({len(done)}/{total})\n")
        log.flush()
        return

    log.write(f"sura {sura}: {len(pending)} pending (done {len(done)}/{total})\n")
    log.flush()

    results = []
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(process_one, chapters, sura, a, log): a for a in pending}
        for fut in as_completed(futures):
            key, res = fut.result()
            results.append(res)
            if delay:
                time.sleep(delay)

    data = {}
    for res in results:
        if res["ok"]:
            data[res["ayah"]] = {"html": res["html"], "text": res["text"]}
            done.add(res["ayah"])
        else:
            missing.add(res["ayah"])

    # merge with previously stored data for resume-safety
    if os.path.exists(out_path) and not force:
        prev = read_data_js(out_path)
        data = {**prev.get("data", {}), **data}
        missing = set(prev.get("missing", [])) | missing

    out = {
        "sura": sura,
        "name_ar": ch.get("ar"),
        "name_en": ch.get("en"),
        "verses": total,
        "source": "https://www.tamililquran.com/tafsiribnkathir.php",
        "count": len(data),
        "missing": sorted(int(x) for x in missing),
        "data": {str(k): v for k, v in sorted(data.items())},
    }
    write_data_js(out_path, out)
    log.write(f"sura {sura}: saved {len(data)}/{total} -> {out_path}\n")
    log.flush()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--start", type=int, default=1)
    ap.add_argument("--end", type=int, default=114)
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--delay", type=float, default=0.15)
    ap.add_argument("--force", action="store_true", help="re-scrape even if done")
    ap.add_argument("--log", default=os.path.join(ROOT, "scripts", "tafsir_extract.log"))
    args = ap.parse_args()

    os.makedirs(OUT_DIR, exist_ok=True)
    chapters = load_chapters()
    log = open(args.log, "a", encoding="utf-8")
    log.write(f"\n=== run start {time.ctime()} surah {args.start}-{args.end} workers={args.workers} ===\n")
    log.flush()

    t0 = time.time()
    for sura in range(args.start, args.end + 1):
        if sura not in chapters:
            log.write(f"sura {sura}: not in index, skip\n")
            continue
        scrape_surah(chapters, sura, args.workers, args.delay, args.force, log)
    log.write(f"=== run end {time.ctime()} elapsed={(time.time()-t0)/60:.1f} min ===\n")
    log.close()

    # write manifest
    manifest = {"source": "https://www.tamililquran.com/tafsiribnkathir.php",
                "generated": time.ctime(), "surahs": {}}
    total_ok = 0
    total_missing = 0
    for sura in range(1, 115):
        p = os.path.join(OUT_DIR, f"tamil-{sura:03d}.js")
        if os.path.exists(p):
            d = read_data_js(p)
            manifest["surahs"][sura] = {"verses": d["verses"], "count": d["count"], "missing": d["missing"]}
            total_ok += d["count"]
            total_missing += len(d["missing"])
    manifest["total_ok"] = total_ok
    manifest["total_missing"] = total_missing
    with open(os.path.join(OUT_DIR, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)
    log = open(args.log, "a", encoding="utf-8")
    log.write(f"manifest: total_ok={total_ok} total_missing={total_missing}\n")
    log.close()


if __name__ == "__main__":
    main()
