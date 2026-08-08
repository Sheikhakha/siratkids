#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build enriched Quran resources (Surah info, ayah themes, repeated phrases)
from the downloaded QUL public-data files into wrapped .js data bundles that
quran-reader.html can load both over HTTP and from file:// (script-tag pattern).

Inputs (relative to repo root):
  data/qul/surah-info-en.json       - quran.com surah info (English)
  data/qul/surah-info-ta.json       - quran.com surah info (Tamil)
  data/qul/ayah-themes.db       - sqlite: range-based surah themes
  data/qul/live-mutashabihat.json - live scrape of the QUL phrases (preferred;
                                    falls back to the stale public zip)
  data/qul/Mutashabihat ul Quran.json - zip: repeated phrases (fallback only)
  data/qul/matching-ayah.json          - quran.com similar-ayah word-coincidence rows
  data/qul/qpc-hafs-word-by-word.json  - QUL QPC-Hafs Uthmani word data (used to
                                         rebuild phrase text and to clamp ranges)
  js/quran_source/indopak-nastaleeq-verse.js - verse text (validation)

Outputs (wrapped .js bundles under js/quran_source/):
  surah-info-en.js    -> __QURAN_DATA["surah-info-en"]    { "1": {surah_number,surah_name,text,short_text}, ... }
  surah-info-ta.js    -> __QURAN_DATA["surah-info-ta"]    same in Tamil
  ayah-themes.js      -> __QURAN_DATA["ayah-themes"]      { "2": [{from,to,theme}, ...], ... }
  qpc-hafs-word.js    -> __QURAN_DATA["qpc-hafs-word"]    { "2:112": ["بَلَىٰۚ","مَنۡ","أَسۡلَمَ",...], ... }
  mutashabihat.js     -> __QURAN_DATA["mutashabihat"]     { phrases: {...}, byAyah: {...} }
  similar-ayah.js     -> __QURAN_DATA["similar-ayah"]     { "1:1": [{matched_ayah_key,matched_words_count,coverage,score,match_words}], ... }

Mutashabihat rebuild rules: every phrase (including partial/failed scrapes) is
rebuilt from its source range in the QPC-Hafs script; every span range is
clamped to the ayah word count (QUL ranges are 1-based over ALL spans,
including the trailing ayah-number marker, so raw ranges can exceed the word
count); phrases that yield no valid ref range are dropped; byAyah duplicate
cards (identical rebuilt text) are removed per ayah.

Do NOT convert the outputs back to .json - the reader loads them via <script>
injection (file:// compatible), exactly like the existing data bundles.
"""

import io
import json
import os
import re
import sqlite3
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QUL = os.path.join(ROOT, 'data', 'qul')
SRC = os.path.join(ROOT, 'js', 'quran_source')

WRAPPER_HEAD = '(function(g){g.__QURAN_DATA=g.__QURAN_DATA||{};g.__QURAN_DATA["%s"]=%s;})(self);\n'


def load_wrapped_js(path, key):
    """Extract the JSON payload from a wrapped __QURAN_DATA script."""
    with io.open(path, encoding='utf-8') as fh:
        text = fh.read()
    head = '__QURAN_DATA["%s"]=' % key
    i = text.find(head)
    j = text.rfind(';})(self);')
    if i < 0 or j < 0 or j <= i:
        raise ValueError('cannot find wrapped key %r in %s' % (key, path))
    return json.loads(text[i + len(head):j])


def write_wrapped_js(name, key, data):
    payload = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    out_path = os.path.join(SRC, name)
    with io.open(out_path, 'w', encoding='utf-8') as fh:
        fh.write(WRAPPER_HEAD % (key, payload))
    return out_path


def norm_arabic(s):
    """Normalize Arabic for substring matching: keep letters, drop harakat,
    tatweel and whitespace."""
    parts = []
    for ch in s:
        o = ord(ch)
        if o == 0x0640 or 0x064B <= o <= 0x065F:
            continue
        if 0x0600 <= o <= 0x06FF or 0xFE70 <= o <= 0xFEFF or ch.isspace():
            if not ch.isspace():
                parts.append(ch)
            continue
        parts.append(ch)
    return ''.join(parts)


def build_surah_info():
    out = {}
    for name, key in (('surah-info-en', 'surah-info-en'), ('surah-info-ta', 'surah-info-ta')):
        path = os.path.join(QUL, name + '.json')
        with io.open(path, encoding='utf-8') as fh:
            data = json.load(fh)
        # Keep the raw per-surah objects (surah_number, surah_name, text, short_text)
        out[key] = data
        if len(data) != 114:
            raise ValueError('%s has %d surahs (expected 114)' % (name, len(data)))
    return out


def build_ayah_themes():
    db_path = os.path.join(QUL, 'ayah-themes.db')
    conn = sqlite3.connect(db_path)
    # DISTINCT collapses the duplicate (theme, surah_number, ayah_from, ayah_to)
    # rows that exist in the exported DB, so each (from..to, theme) range is
    # stored once per surah.
    rows = conn.execute(
        'SELECT DISTINCT theme, surah_number, ayah_from, ayah_to '
        'FROM themes ORDER BY surah_number, ayah_from'
    ).fetchall()
    conn.close()
    themes = {}
    for theme, surah, frm, to in rows:
        entry = {'from': frm, 'to': to, 'theme': theme}
        lst = themes.setdefault(str(surah), [])
        if lst and lst[-1] == entry:
            continue
        lst.append(entry)
    if not themes:
        raise ValueError('ayah-themes.db contains no rows')
    return themes


def load_qpc_word_texts():
    """Per-ayah ordered word-text lists from the QUL QPC-Hafs word data.

    The QUL phrase ranges are 1-based over ALL spans, including the trailing
    ayah-number marker span, so callers must clamp spans against these lists
    (see clamp_span). Ayal-number marker spans are excluded here.
    """
    path = os.path.join(QUL, 'qpc-hafs-word-by-word.json')
    with io.open(path, encoding='utf-8') as fh:
        data = json.load(fh)
    per_ayah = {}
    for loc, w in data.items():
        key = loc[:loc.rfind(':')]
        txt = (w or {}).get('text', '')
        if txt and all('\u0660' <= c <= '\u0669' for c in txt):
            continue
        per_ayah.setdefault(key, []).append(txt)
    return per_ayah


def build_qpc_words():
    """Build qpc-hafs-word.js: per-ayah word-text arrays in the QUL QPC-Hafs
    Uthmani script. Array positions are the 1-based range indices the reader
    uses to highlight Mutashabihat / Similar-Ayat words."""
    per_ayah = load_qpc_word_texts()
    path = write_wrapped_js('qpc-hafs-word.js', 'qpc-hafs-word', per_ayah)
    return path, len(per_ayah), sum(len(v) for v in per_ayah.values())


def clamp_span(lo, hi, wc):
    """Clamp a 1-based span to a word count; returns None when invalid.

    QUL ranges are 1-based over all spans (words + the trailing ayah-number
    marker), so `hi` is often word_count+1. Clamping drops the marker and
    discards spans that live entirely beyond the word count.
    """
    try:
        lo = int(lo)
        hi = int(hi)
    except (TypeError, ValueError):
        return None
    lo = min(max(lo, 1), wc)
    hi = min(hi, wc)
    if lo > hi:
        return None
    return [lo, hi]


def build_mutashabihat():
    # Prefer the live scrape (current server data, includes phrases missing
    # from the stale public export); fall back to the zip for offline builds.
    live_path = os.path.join(QUL, 'live-mutashabihat.json')
    zip_path = os.path.join(QUL, 'Mutashabihat ul Quran.json')
    source_name = 'live'
    if os.path.exists(live_path):
        with io.open(live_path, encoding='utf-8') as fh:
            payload = json.load(fh)
        phrases = payload['phrases']
        # phrase_verses.json maps ayahKey -> [phrase ids]; cross-check only
        phrase_verses = payload.get('phrase_verses', {})
    else:
        source_name = 'zip'
        with zipfile.ZipFile(zip_path) as zf:
            phrases = json.loads(zf.read('phrases.json'))
            # phrase_verses.json maps ayahKey -> [phrase ids]; cross-check only
            phrase_verses = json.loads(zf.read('phrase_verses.json'))

    qpc = load_qpc_word_texts()

    def sort_key(r):
        try:
            s, a = r.split(':', 1)
            return (int(s), int(a))
        except (ValueError, AttributeError):
            return (0, 0)

    out_phrases = {}
    by_ayah = {}
    stats = {'dropped_invalid': 0, 'fallback_source': 0, 'rebuilt_text': 0}

    for pid, phrase in phrases.items():
        src = phrase.get('source') or {}
        skey = src.get('key', '')

        # Clamp every ref range to the ayah word count.
        raw_map = phrase.get('ayah', {}) or {}
        final_map = {}
        for akey, ranges in raw_map.items():
            wc = len(qpc.get(akey, []))
            if not wc:
                continue
            cleaned = []
            if isinstance(ranges, list):
                for rng in ranges:
                    if not isinstance(rng, (list, tuple)) or len(rng) < 2:
                        continue
                    span = clamp_span(rng[0], rng[1], wc)
                    if span:
                        cleaned.append(span)
            if cleaned:
                final_map[akey] = cleaned
        if not final_map:
            stats['dropped_invalid'] += 1
            continue

        # Canonical text: rebuild from the source range in the QPC-Hafs script
        # (clamped), falling back to the first valid ref range for the rare
        # phrase whose source range is broken (e.g. id 14570).
        chosen = None
        src_span = None
        wl = qpc.get(skey, [])
        if wl:
            sfrom = int(src.get('from', 1))
            sto = int(src.get('to', 1))
            span = clamp_span(sfrom, sto, len(wl))
            if span:
                src_span = span
                chosen = ' '.join(wl[span[0] - 1:span[1]])
        if chosen is None:
            for akey in sorted(final_map.keys(), key=sort_key):
                wl2 = qpc.get(akey, [])
                if wl2 and final_map[akey]:
                    lo, hi = final_map[akey][0]
                    if lo <= hi <= len(wl2):
                        chosen = ' '.join(wl2[lo - 1:hi])
                        src_span = [lo, hi]
                        stats['fallback_source'] += 1
                        break
        if chosen is None:
            stats['dropped_invalid'] += 1
            continue

        if phrase.get('text') != chosen:
            stats['rebuilt_text'] += 1

        refs = sorted(final_map.keys(), key=sort_key)
        surahs = {r.split(':')[0] for r in refs}
        src_ref = skey if skey else refs[0]
        out_phrases[pid] = {
            'text': chosen,
            'src': [src_ref, src_span[0], src_span[1]],
            'count': len(refs),
            'surahs': len(surahs),
            'ayahs': len(refs),
            'refs': refs,
            'ranges': final_map,
        }
        for akey, ranges in final_map.items():
            by_ayah.setdefault(akey, []).append([pid, ranges])

    # Dedupe byAyah cards whose displayed (rebuilt) text is identical, keeping
    # the lowest phrase id. The dropped phrase stays in `phrases` for its other
    # ayahs where it is unique.
    dup_removed = 0
    for akey in by_ayah:
        by_ayah[akey].sort(key=lambda e: int(e[0]))
        seen = {}
        kept = []
        for pid, ranges in by_ayah[akey]:
            txt = out_phrases[pid]['text']
            if txt in seen:
                dup_removed += 1
                continue
            seen[txt] = True
            kept.append([pid, ranges])
        by_ayah[akey] = kept
    stats['dup_cards_removed'] = dup_removed

    meta = {'source': source_name}
    if source_name == 'live':
        meta['partial'] = sorted(payload.get('partial', []))
        meta['failed'] = sorted(payload.get('failed', []))
    return {'phrases': out_phrases, 'byAyah': by_ayah, 'meta': meta}, stats


def norm_match_ranges(raw):
    """Normalize a similar-ayah word-range value to a list of [from, to].

    Accepts the quran.com export shape (list of [from, to]) as well as the
    QUL Help schema shape (a TEXT column like "5-8" or "5-8;12-13").
    """
    if raw is None:
        return []
    if isinstance(raw, (list, tuple)):
        out = []
        for r in raw:
            if not isinstance(r, (list, tuple)):
                continue
            try:
                if len(r) == 1:
                    pos = int(r[0])
                    if pos >= 1:
                        out.append([pos, pos])
                elif len(r) >= 2:
                    out.append([int(r[0]), int(r[1])])
            except (TypeError, ValueError):
                continue
        return out
    if isinstance(raw, str):
        out = []
        for part in re.split(r'[;,\s]+', raw.strip()):
            part = part.strip().strip('[]()')
            if '-' in part:
                a, _, b = part.partition('-')
                try:
                    out.append([int(a), int(b)])
                except ValueError:
                    continue
            else:
                try:
                    pos = int(part)
                    if pos >= 1:
                        out.append([pos, pos])
                except ValueError:
                    continue
        return out
    return []


def build_similar_ayah():
    """Build the Similar Ayat index from the quran.com word-coincidence export.

    matching-ayah.json maps verse_key -> list of match rows (or null). Each row
    has matched_ayah_key, matched_words_count, coverage, score, and a word-range
    field (match_words list of [from, to] inside the matched ayah, or the QUL
    Help schema TEXT form match_words_range).
    """
    path = os.path.join(QUL, 'matching-ayah.json')
    with io.open(path, encoding='utf-8') as fh:
        data = json.load(fh)
    out = {}
    skipped = 0
    total = 0
    for verse_key, matches in data.items():
        if not matches:
            skipped += 1
            continue
        clean = []
        for m in matches:
            if not m.get('matched_ayah_key'):
                continue
            ranges = norm_match_ranges(
                m.get('match_words') if m.get('match_words') is not None
                else m.get('match_words_range'))
            clean.append({
                'matched_ayah_key': m['matched_ayah_key'],
                'matched_words_count': m.get('matched_words_count', 0),
                'coverage': m.get('coverage', 0),
                'score': m.get('score', 0),
                'match_words': ranges,
            })
        # Highest similarity first (score, then coverage, then raw word count).
        clean.sort(key=lambda m: (m['score'], m['coverage'], m['matched_words_count']),
                   reverse=True)
        out[verse_key] = clean
        total += len(clean)
    return out, skipped, total


def main():
    results = {}

    si = build_surah_info()
    for key, data in si.items():
        path = write_wrapped_js(key + '.js', key, data)
        results[key] = {'file': path, 'surahs': len(data)}

    themes = build_ayah_themes()
    path = write_wrapped_js('ayah-themes.js', 'ayah-themes', themes)
    total_themes = sum(len(v) for v in themes.values())
    results['ayah-themes'] = {'file': path, 'surahs': len(themes), 'themes': total_themes}

    qpc_path, qpc_ayahs, qpc_words = build_qpc_words()
    results['qpc-hafs-word'] = {
        'file': qpc_path,
        'ayahs': qpc_ayahs,
        'words': qpc_words,
    }

    mut, stats = build_mutashabihat()
    mut_payload = {'phrases': mut['phrases'], 'byAyah': mut['byAyah']}
    path = write_wrapped_js('mutashabihat.js', 'mutashabihat', mut_payload)
    results['mutashabihat'] = {
        'file': path,
        'source': mut['meta']['source'],
        'phrases': len(mut['phrases']),
        'ayahs': len(mut['byAyah']),
        'stats': stats,
    }
    if 'partial' in mut['meta']:
        results['mutashabihat']['partial'] = mut['meta']['partial']
        results['mutashabihat']['failed'] = mut['meta']['failed']

    sim, skipped, matches = build_similar_ayah()
    path = write_wrapped_js('similar-ayah.js', 'similar-ayah', sim)
    results['similar-ayah'] = {
        'file': path,
        'verses': len(sim),
        'matches': matches,
        'skipped_null': skipped,
    }

    report_path = os.path.join(ROOT, 'scripts', 'qul_resources_report.json')
    with io.open(report_path, 'w', encoding='utf-8') as fh:
        json.dump(results, fh, indent=2, ensure_ascii=False)

    for key, r in results.items():
        if key == 'mutashabihat':
            print('mutashabihat.js: source=%s phrases=%d byAyah=%d stats=%s' % (
                r['source'], r['phrases'], r['ayahs'], r['stats']))
            if 'failed' in r:
                print('   partial=%d failed=%d' % (len(r['partial']), len(r['failed'])))
        elif key == 'similar-ayah':
            print('similar-ayah.js: verses=%d matches=%d skipped=%d' % (
                r['verses'], r['matches'], r['skipped_null']))
        elif key == 'qpc-hafs-word':
            print('qpc-hafs-word.js: ayahs=%d words=%d' % (r['ayahs'], r['words']))
        else:
            print('%s: %s' % (os.path.basename(r['file']), r))
    return 0


if __name__ == '__main__':
    sys.exit(main())
