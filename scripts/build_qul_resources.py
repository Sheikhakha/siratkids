#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build enriched Quran resources (Surah info, ayah themes, repeated phrases)
from the downloaded QUL public-data files into wrapped .js data bundles that
quran-reader.html can load both over HTTP and from file:// (script-tag pattern).

Inputs (relative to repo root):
  data/qul/surah-info-en.json       - quran.com surah info (English)
  data/qul/surah-info-ta.json       - quran.com surah info (Tamil)
  data/qul/ayah-themes.db           - sqlite: range-based surah themes
  data/qul/Mutashabihat ul Quran.json - zip: repeated phrases (phrases.json + phrase_verses.json)
  js/quran_source/indopak-nastaleeq-word.js  - word data (phrase text + validation)
  js/quran_source/indopak-nastaleeq-verse.js - verse text (validation)

Outputs (wrapped .js bundles under js/quran_source/):
  surah-info-en.js    -> __QURAN_DATA["surah-info-en"]    { "1": {surah_number,surah_name,text,short_text}, ... }
  surah-info-ta.js    -> __QURAN_DATA["surah-info-ta"]    same in Tamil
  ayah-themes.js      -> __QURAN_DATA["ayah-themes"]      { "2": [{from,to,theme}, ...], ... }
  mutashabihat.js     -> __QURAN_DATA["mutashabihat"]     { phrases: {...}, byAyah: {...} }

Do NOT convert the outputs back to .json - the reader loads them via <script>
injection (file:// compatible), exactly like the existing data bundles.
"""

import io
import json
import os
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
    rows = conn.execute(
        'SELECT theme, surah_number, ayah_from, ayah_to FROM themes ORDER BY surah_number, ayah_from'
    ).fetchall()
    conn.close()
    themes = {}
    for theme, surah, frm, to in rows:
        themes.setdefault(str(surah), []).append(
            {'from': frm, 'to': to, 'theme': theme}
        )
    if not themes:
        raise ValueError('ayah-themes.db contains no rows')
    return themes


def build_mutashabihat():
    zip_path = os.path.join(QUL, 'Mutashabihat ul Quran.json')
    with zipfile.ZipFile(zip_path) as zf:
        phrases = json.loads(zf.read('phrases.json'))
        # phrase_verses.json maps ayahKey -> [phrase ids]; used for cross-check only
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

        variants = [(sf, st), (sf, st - 1), (sf, st - 2), (sf + 1, st),
                    (sf + 1, st - 1), (sf, st + 1), (sf + 1, st + 1)]
        base_text = ''
        best_text = ''
        for (f, t) in variants:
            if f < 1 or t < 1 or f > t or t > len(wl):
                continue
            cand = ' '.join(wl[f - 1:t])
            if not cand:
                continue
            ntxt = norm_arabic(cand)
            if not ntxt:
                continue
            if not base_text:
                base_text = cand
            # hard check: the phrase text must appear in its own source ayah
            # (guards against index/tokenization misalignment). Variants like
            # "عَمّا" vs "بِما" legitimately differ in other ayahs of the same
            # QUL phrase, so all-refs uniformity is only a soft signal.
            if ntxt in src_norm:
                if not best_text or len(cand) > len(best_text):
                    best_text = cand
        if not best_text and base_text:
            best_text = base_text
            issues.append('%s: phrase not found in source ayah, kept raw range' % pid)
        elif not best_text:
            issues.append('%s: empty phrase text' % pid)

        surahs = set()
        for r in refs:
            surahs.add(r.split(':')[0])
        if base_text and all(norm_arabic(base_text) in verse_norm(r) for r in refs):
            uniform_count += 1
        out_phrases[pid] = {
            'text': best_text,
            'count': phrase.get('count'),
            'surahs': len(surahs),
            'ayahs': len(refs),
            'refs': sorted(refs, key=lambda r: (int(r.split(':')[0]), int(r.split(':')[1]))),
        }
        for akey, ranges in phrase.get('ayah', {}).items():
            by_ayah.setdefault(akey, []).append([pid, ranges])

    # Deterministic ordering of byAyah entries by phrase id
    for akey in by_ayah:
        by_ayah[akey].sort(key=lambda e: int(e[0]))

    return {'phrases': out_phrases, 'byAyah': by_ayah}, issues, uniform_count


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
    path = write_wrapped_js('mutashabihat.js', 'mutashabihat', mut)
    results['mutashabihat'] = {
        'file': path,
        'phrases': len(mut['phrases']),
        'ayahs': len(mut['byAyah']),
        'uniform': uniform_count,
        'issues': issues,
    }

    report_path = os.path.join(ROOT, 'scripts', 'qul_resources_report.json')
    with io.open(report_path, 'w', encoding='utf-8') as fh:
        json.dump(results, fh, indent=2, ensure_ascii=False)

    for key, r in results.items():
        if key == 'mutashabihat':
            print('mutashabihat.js: phrases=%d byAyah=%d issues=%d' % (
                r['phrases'], r['ayahs'], len(r['issues'])))
            for iss in issues[:20]:
                print('   - %s' % iss)
        else:
            print('%s: %s' % (os.path.basename(r['file']), r))
    return 0


if __name__ == '__main__':
    sys.exit(main())
