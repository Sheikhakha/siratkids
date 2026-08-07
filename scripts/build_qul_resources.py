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
  js/quran_source/indopak-nastaleeq-word.js  - word data (phrase text + validation)
  js/quran_source/indopak-nastaleeq-verse.js - verse text (validation)

Outputs (wrapped .js bundles under js/quran_source/):
  surah-info-en.js    -> __QURAN_DATA["surah-info-en"]    { "1": {surah_number,surah_name,text,short_text}, ... }
  surah-info-ta.js    -> __QURAN_DATA["surah-info-ta"]    same in Tamil
  ayah-themes.js      -> __QURAN_DATA["ayah-themes"]      { "2": [{from,to,theme}, ...], ... }
  mutashabihat.js     -> __QURAN_DATA["mutashabihat"]     { phrases: {...}, byAyah: {...} }
  similar-ayah.js     -> __QURAN_DATA["similar-ayah"]     { "1:1": [{matched_ayah_key,matched_words_count,coverage,score,match_words}], ... }

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
        phrase_verses = payload['phrase_verses']
    else:
        source_name = 'zip'
        with zipfile.ZipFile(zip_path) as zf:
            phrases = json.loads(zf.read('phrases.json'))
            # phrase_verses.json maps ayahKey -> [phrase ids]; cross-check only
            phrase_verses = json.loads(zf.read('phrase_verses.json'))

    words = load_wrapped_js(os.path.join(SRC, 'indopak-nastaleeq-word.js'),
                            'indopak-nastaleeq-word')
    verses = load_wrapped_js(os.path.join(SRC, 'indopak-nastaleeq-verse.js'),
                             'indopak-nastaleeq-verse')

    # real-word texts per ayah (skip end/word-number markers)
    word_texts = {}
    for key in words:
        if key.count(':') != 2:
            continue
        ayah_key = key[:key.rfind(':')]
        w = words[key]
        if w.get('char_type') == 'word':
            word_texts.setdefault(ayah_key, []).append(w.get('text', ''))

    verse_norm_cache = {}

    def verse_norm(akey):
        if akey not in verse_norm_cache:
            v = verses.get(akey)
            verse_norm_cache[akey] = norm_arabic(v.get('text', '')) if v else ''
        return verse_norm_cache[akey]

    def sort_key(r):
        try:
            s, a = r.split(':', 1)
            return (int(s), int(a))
        except (ValueError, AttributeError):
            return (0, 0)

    def pick_phrase_text(sf, st, src_norm, refs_norm, wl):
        """Choose the display text for a phrase.

        Tries the exact source range first; only falls back to neighbouring
        variants when the exact range is not a substring of the source ayah
        (index/tokenization drift). Among the valid candidates that occur in
        the source ayah, prefer ones that also occur in every ref ayah, then
        the shortest span, then the exact source range. This fixes phrases
        being over-extended beyond their true source range (e.g. id 13963).
        Returns (text, chosen_range_or_None, exact_used_bool).
        """
        ordered = [(sf, st), (sf, st - 1), (sf + 1, st), (sf, st + 1),
                   (sf + 1, st - 1), (sf, st - 2), (sf + 1, st + 1)]
        candidates = []
        seen = set()
        for (f, t) in ordered:
            if (f, t) in seen or f < 1 or t < 1 or f > t or t > len(wl):
                continue
            seen.add((f, t))
            cand = ' '.join(wl[f - 1:t])
            ntxt = norm_arabic(cand)
            if ntxt:
                candidates.append((f, t, cand, ntxt))
        if not candidates:
            return '', None, False
        in_src = [c for c in candidates if c[3] in src_norm]
        if not in_src:
            # Nothing matches the source ayah: keep the raw exact range as a
            # best-effort (reported as an issue by the caller).
            return candidates[0][2], (sf, st), False
        uniform = [c for c in in_src if all(c[3] in rn for rn in refs_norm)]
        pool = uniform if uniform else in_src
        pool.sort(key=lambda c: (0 if (c[0], c[1]) == (sf, st) else 1,
                                 c[1] - c[0], len(c[2])))
        best = pool[0]
        return best[2], (best[0], best[1]), (best[0], best[1]) == (sf, st)

    out_phrases = {}
    by_ayah = {}
    issues = []
    uniform_count = 0

    for pid, phrase in phrases.items():
        src = phrase.get('source') or {}
        skey = src.get('key', '')
        sf = int(src.get('from', 1))
        st = int(src.get('to', 1))
        refs = list(phrase.get('ayah', {}).keys())
        src_norm = verse_norm(skey)
        wl = word_texts.get(skey, [])
        refs_norm = [verse_norm(r) for r in refs]

        exact_cand = ' '.join(wl[sf - 1:st]) if wl and sf >= 1 and st <= len(wl) and sf <= st else ''
        if exact_cand and all(norm_arabic(exact_cand) in rn for rn in refs_norm):
            uniform_count += 1

        best_text, chosen_range, exact_used = pick_phrase_text(sf, st, src_norm, refs_norm, wl)
        if not best_text:
            issues.append('%s: empty phrase text' % pid)
        elif not exact_used:
            issues.append('%s: phrase text taken from range %s (source range %s-%s)' % (
                pid, chosen_range, sf, st))

        surahs = set()
        for r in refs:
            surahs.add(r.split(':')[0])
        out_phrases[pid] = {
            'text': best_text,
            'count': phrase.get('count'),
            'surahs': phrase.get('surahs', len(surahs)),
            'ayahs': phrase.get('ayahs', len(refs)),
            'refs': sorted(refs, key=sort_key),
            'ranges': phrase.get('ayah', {}),
        }
        for akey, ranges in phrase.get('ayah', {}).items():
            by_ayah.setdefault(akey, []).append([pid, ranges])

    # Deterministic ordering of byAyah entries by phrase id
    for akey in by_ayah:
        by_ayah[akey].sort(key=lambda e: int(e[0]))

    meta = {'source': source_name}
    if source_name == 'live':
        meta['partial'] = sorted(payload.get('partial', []))
        meta['failed'] = sorted(payload.get('failed', []))
    return {'phrases': out_phrases, 'byAyah': by_ayah, 'meta': meta}, issues, uniform_count


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
            if isinstance(r, (list, tuple)) and len(r) >= 2:
                try:
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

    mut, issues, uniform_count = build_mutashabihat()
    mut_payload = {'phrases': mut['phrases'], 'byAyah': mut['byAyah']}
    path = write_wrapped_js('mutashabihat.js', 'mutashabihat', mut_payload)
    results['mutashabihat'] = {
        'file': path,
        'source': mut['meta']['source'],
        'phrases': len(mut['phrases']),
        'ayahs': len(mut['byAyah']),
        'uniform': uniform_count,
        'issues': issues,
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
            print('mutashabihat.js: source=%s phrases=%d byAyah=%d issues=%d' % (
                r['source'], r['phrases'], r['ayahs'], len(r['issues'])))
            if 'failed' in r:
                print('   partial=%d failed=%d' % (len(r['partial']), len(r['failed'])))
            for iss in issues[:20]:
                print('   - %s' % iss)
        elif key == 'similar-ayah':
            print('similar-ayah.js: verses=%d matches=%d skipped=%d' % (
                r['verses'], r['matches'], r['skipped_null']))
        else:
            print('%s: %s' % (os.path.basename(r['file']), r))
    return 0


if __name__ == '__main__':
    sys.exit(main())
