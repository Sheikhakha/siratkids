#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fetch the current Mutashabihat ul Quran dataset from the live QUL website.

The public download export for resource 73 (Mutashabihat ul Quran) is stale
server-side (byte-identical re-downloads are missing live entries such as
1:1 -> phrase 11313 and 2:112 -> phrases 858/3601). This scraper therefore
reads the live, server-rendered pages instead:

  * /morphology_phrases?page=N                    - paginated phrase index
  * /morphology_phrases/<id>/phrase_verses?modal=true
      - per-phrase ayah cards with the phrase words colour-highlighted, which
        encodes each ayah's word range for that phrase.

Only APPROVED phrases (occurrence >= 1, verse count >= 1) are kept - the same
set the resource-73 preview page displays.

Writes data/qul/live-mutashabihat.json:
  {
    "scraped_at": iso8601,
    "phrases": {
      "<id>": {
        "source": {"key": "s:a", "from": f, "to": t},
        "count": n, "surahs": s, "ayahs": a,
        "text": "phrase text (site script)",
        "ayah": {"s:a": [[from, to], ...]}
      }, ...
    },
    "phrase_verses": {"s:a": [id, ...], ...}
  }

Phrases whose phrase_verses modal 500s server-side are recovered from the
editor page's saved source range and stored with "partial": true (their only
range is the source ayah). "partial"/"failed" list recovered vs unrecoverable
ids.

Examples:
  python scripts/fetch_mutashabihat_live.py --index-only   # crawl the list only
  python scripts/fetch_mutashabihat_live.py --workers 16   # full crawl
"""

import argparse
import concurrent.futures as cf
import io
import json
import math
import os
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'data', 'qul', 'live-mutashabihat.json')

BASE = 'https://qul.tarteel.ai'
INDEX_URL = BASE + '/morphology_phrases?page=%d'
MODAL_URL = BASE + '/morphology_phrases/%s/phrase_verses?modal=true'
EDITOR_URL = BASE + '/morphology_phrases/%s'

UA = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                  'SiratKids-qul-sync/1.0',
}


def fetch(url, tries=3, timeout=45):
    last = None
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.read().decode('utf-8', 'replace')
        except (urllib.error.URLError, OSError, ValueError) as exc:
            last = exc
            time.sleep(1.0 + attempt)
    raise last


def strip_html(text):
    text = re.sub(r'<[^>]+>', ' ', text)
    return re.sub(r'\s+', ' ', text).strip()


def parse_index_row(tr):
    """Parse one <tr> from the phrase index table."""
    tds = re.findall(r'<td[^>]*>(.*?)</td>', tr, re.S)
    if len(tds) < 8:
        return None
    try:
        pid = int(strip_html(tds[0]))
    except (TypeError, ValueError):
        return None
    return {
        'id': pid,
        'source': strip_html(tds[1]),
        'occurrence': int(strip_html(tds[2]) or 0),
        'verse_count': int(strip_html(tds[3]) or 0),
        'words_count': int(strip_html(tds[4]) or 0),
        'approved': strip_html(tds[5]).lower() == 'true',
        'review': strip_html(tds[6]),
        'text': strip_html(tds[7]),
    }


def fetch_index_page(page):
    return fetch(INDEX_URL % page)


def crawl_index(workers):
    """Return (rows_by_id, total_rows) crawling every index page in parallel."""
    first = fetch_index_page(1)
    m = re.search(r'of\s*(?:<[^>]+>\s*)?(\d+)(?:\s*<[^>]+>)?\s*in total', first)
    total = int(m.group(1)) if m else 0
    pages = int(math.ceil(total / 20)) if total else 1
    print('index: %d total phrases, %d pages' % (total, pages), flush=True)

    rows = {}
    with cf.ThreadPoolExecutor(max_workers=workers) as ex:
        futs = {ex.submit(fetch_index_page, p): p for p in range(1, pages + 1)}
        done = 0
        for fut in cf.as_completed(futs):
            p = futs[fut]
            try:
                html = fut.result()
            except Exception as exc:  # noqa: BLE001
                print('page %d failed: %r' % (p, exc), flush=True)
                continue
            tb = html.find('<tbody')
            if tb < 0:
                continue
            n = 0
            for tr in re.findall(r'<tr[^>]*>(.*?)</tr>', html[tb:], re.S):
                row = parse_index_row(tr)
                if row:
                    rows[row['id']] = row
                    n += 1
            done += 1
            if done % 50 == 0 or done == pages:
                print('index pages %d/%d, rows %d' % (done, pages, len(rows)),
                      flush=True)
    return rows, total


def parse_modal_cards(html):
    """Return {ayah_key: [[from, to], ...]} from a phrase_verses modal page.

    Each ayah card is a div containing a pill span with the ayah key, followed
    by word <span>s. Phrase words carry a style="color: ..." attribute. Word
    indices are 1-based over all word spans (the trailing ayah-number span is
    uncolored and therefore never counted as phrase text).
    """
    body = html.find('<div id="body"')
    if body < 0:
        return {}
    html = html[body:]
    out = {}
    pills = list(re.finditer(
        r'<span class="px-3 py-1 bg-slate-800[^"]*"[^>]*>\s*([0-9]+:[0-9]+)\s*</span>',
        html))
    for i, m in enumerate(pills):
        key = m.group(1)
        seg_end = pills[i + 1].start() if i + 1 < len(pills) else len(html)
        seg = html[m.end():seg_end]
        qt = re.search(r'<div class="quran-text[^"]*"[^>]*>', seg)
        if not qt:
            continue
        block = seg[qt.end():]
        block_end = block.find('</div>')
        if block_end >= 0:
            block = block[:block_end]
        idx = 0
        colored = []
        for wm in re.finditer(r'<span([^>]*)>\s*([^<]*)\s*</span>', block):
            attrs, text = wm.group(1), wm.group(2).strip()
            if not text:
                continue
            idx += 1
            if re.search(r'style\s*=\s*["\']\s*color', attrs):
                colored.append(idx)
        ranges = []
        for pos in colored:
            if ranges and pos == ranges[-1][1] + 1:
                ranges[-1][1] = pos
            else:
                ranges.append([pos, pos])
        if ranges:
            out[key] = ranges
    return out


def fetch_phrase_modal(pid):
    html = fetch(MODAL_URL % pid)
    return pid, parse_modal_cards(html)


def parse_editor(html):
    """Return (source_key, from, to) from a phrase editor page.

    Some phrase_verses modal pages 500 server-side (phrase 447 -> 2:26 etc.).
    Their /morphology_phrases/<id> editor page still renders, and its
    ayah_key / word_from / word_to selects carry the saved source range. The
    word index scheme matches the modal's (last word span = ayah number).
    """
    vals = {}
    for m in re.finditer(
            r'<select\b[^>]*name="([^"]*)"[^>]*>(.*?)</select>', html, re.S):
        name, body = m.group(1), m.group(2)
        for om in re.finditer(r'<option\b([^>]*)>', body):
            if 'selected' not in om.group(1):
                continue
            vm = re.search(r'value="([^"]*)"', om.group(1))
            if vm:
                vals[name] = vm.group(1)
            break
    if 'ayah_key' not in vals or 'word_from' not in vals \
            or 'word_to' not in vals:
        return None
    try:
        return vals['ayah_key'], int(vals['word_from']), int(vals['word_to'])
    except (TypeError, ValueError):
        return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--workers', type=int, default=14)
    ap.add_argument('--index-only', action='store_true',
                    help='only crawl the phrase index, do not fetch modals')
    ap.add_argument('--limit', type=int, default=0,
                    help='stop after N approved phrases (debug)')
    ap.add_argument('--resume', action='store_true',
                    help='re-crawl the index, then fill any approved phrases '
                         'missing from the existing output (retries, no full '
                         're-scrape)')
    args = ap.parse_args()

    rows, total = crawl_index(args.workers)
    approved = [r for r in rows.values()
                if r['approved'] and r['occurrence'] >= 1
                and r['verse_count'] >= 1 and r['text']]
    approved.sort(key=lambda r: r['id'])
    print('approved (occ>=1, verses>=1): %d of %d rows collected (%d)'
          % (len(approved), total, len(rows)), flush=True)

    if args.resume and os.path.exists(OUT):
        with io.open(OUT, encoding='utf-8') as fh:
            payload = json.load(fh)
        have = set(int(k) for k in payload['phrases'])
        pending = [r for r in approved if r['id'] not in have]
        print('resume: %d of %d approved already captured, %d pending'
              % (len(have), len(approved), len(pending)), flush=True)
        if not pending:
            print('nothing to resume')
            return 0
        approved = pending

    if args.limit:
        approved = approved[:args.limit]

    phrases = {}
    phrase_verses = {}
    errors = []
    if not args.index_only:
        if args.resume and os.path.exists(OUT):
            payload = json.load(io.open(OUT, encoding='utf-8'))
            phrases = dict(payload['phrases'])
            phrase_verses = {k: [int(x) for x in v]
                             for k, v in payload['phrase_verses'].items()}
            scraped_at = payload.get('scraped_at')
        else:
            scraped_at = None
        pids = [r['id'] for r in approved]
        with cf.ThreadPoolExecutor(max_workers=args.workers) as ex:
            futs = {ex.submit(fetch_phrase_modal, pid): pid for pid in pids}
            done = 0
            for fut in cf.as_completed(futs):
                pid = futs[fut]
                row = rows[pid]
                try:
                    _, ayah_map = fut.result()
                except Exception as exc:  # noqa: BLE001
                    ayah_map = None
                    reason = repr(exc)
                if not ayah_map:
                    # Modal 500 (server bug). Fall back to the editor page,
                    # which still renders and exposes the source range.
                    try:
                        editor = fetch(EDITOR_URL % pid)
                        parsed = parse_editor(editor)
                    except Exception as exc:  # noqa: BLE001
                        parsed = None
                        reason = 'editor: %r' % (exc,)
                    if parsed:
                        akey, f, t = parsed
                        ayah_map = {akey: [[f, t]]}
                        reason = 'partial (modal 500)'
                    else:
                        reason = 'unrecoverable'
                if not ayah_map:
                    errors.append((pid, reason))
                    done += 1
                    continue
                surahs = len({k.split(':')[0] for k in ayah_map})
                ranges_all = [rng for rngs in ayah_map.values() for rng in rngs]
                if not ranges_all:
                    src = {'key': row['source'], 'from': 1, 'to': 1}
                else:
                    src_ranges = ayah_map.get(row['source']) or [ranges_all[0]]
                    f, t = src_ranges[0]
                    src = {'key': row['source'], 'from': f, 'to': t}
                phrases[str(pid)] = {
                    'source': src,
                    'count': row['occurrence'],
                    'surahs': surahs,
                    'ayahs': row['verse_count'] if not reason else len(ayah_map),
                    'text': row['text'],
                    'ayah': ayah_map,
                }
                if reason:
                    phrases[str(pid)]['partial'] = True
                    errors.append((pid, reason))
                for akey in ayah_map:
                    if pid not in phrase_verses.get(akey, []):
                        phrase_verses.setdefault(akey, []).append(pid)
                done += 1
                if done % 200 == 0 or done == len(pids):
                    print('modals %d/%d (errors %d)'
                          % (done, len(pids), len(errors)), flush=True)

    for lst in phrase_verses.values():
        lst.sort()
    for akey in phrase_verses:
        phrase_verses[akey] = [str(x) for x in phrase_verses[akey]]

    payload = {
        'scraped_at': (datetime.now(timezone.utc).isoformat(timespec='seconds')
                       if not scraped_at else scraped_at),
        'index_total': total,
        'phrases': phrases,
        'phrase_verses': phrase_verses,
        'partial': sorted(str(p) for p, r in errors if 'partial' in r),
        'failed': sorted(str(p) for p, r in errors if r == 'unrecoverable'),
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with io.open(OUT, 'w', encoding='utf-8') as fh:
        json.dump(payload, fh, ensure_ascii=False, indent=1)
    print('wrote %s (%d phrases, %d ayahs)' % (OUT, len(phrases),
                                               len(phrase_verses)), flush=True)
    if errors:
        print('errors: %d (first 20):' % len(errors))
        for e in errors[:20]:
            print('  %s -> %s' % e)
    return 0


if __name__ == '__main__':
    sys.exit(main())
