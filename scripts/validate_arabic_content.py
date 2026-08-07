#!/usr/bin/env python3
"""
Validate Arabic Content Preservation
=====================================
Checks that Arabic text, translations, and Quran references in HTML files
match the canonical content in the JSON cache files.

Usage:
  python scripts/validate_arabic_content.py [--verbose]
"""

import io
import json
import os
import re
import sys
import glob as globmod

BASE = os.path.join(os.path.dirname(__file__), '..')
CACHE_FILE = os.path.join(BASE, 'js', 'quran-content-cache.json')
FEATURED_FILE = os.path.join(BASE, 'js', 'featured-verses.json')
VOCAB_FILE = os.path.join(BASE, 'js', 'vocabulary-data.json')

# Popup IDs and their expected verse keys
POPUP_MAP = {
    'popup-2152': '2:152',
    'popup-3962': '39:62',
    'popup-5156': '51:56',
    'popup-319': '3:19',
}

# Files containing popups
POPUP_FILES = [
    os.path.join(BASE, 'lessons', 'adhkar', 'adhkar-1.html'),
    os.path.join(BASE, 'lessons', 'tawheed-1-2.html'),
    os.path.join(BASE, 'lessons', 'tawheed-2-1.html'),
    os.path.join(BASE, 'lessons', 'tawheed-3-1.html'),
]


def load_json(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def read_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()


def strip_html(text):
    """Remove HTML tags from text."""
    return re.sub(r'<[^>]+>', '', text)


def check_popup_files(cache, verbose):
    """Check that popup overlay divs have data-verse-key attributes."""
    errors = []
    warnings = []

    for filepath in POPUP_FILES:
        if not os.path.exists(filepath):
            errors.append(f"File not found: {filepath}")
            continue

        content = read_file(filepath)
        rel = os.path.relpath(filepath, BASE)

        for popup_id, verse_key in POPUP_MAP.items():
            if popup_id in content:
                # Check for data-verse-key attribute
                pattern = rf'id="{popup_id}"[^>]*data-verse-key="{re.escape(verse_key)}"'
                if re.search(pattern, content):
                    if verbose:
                        print(f"  [OK] {rel}: {popup_id} has data-verse-key=\"{verse_key}\"")
                else:
                    # Check if it at least has the id
                    if re.search(rf'id="{popup_id}"', content):
                        warnings.append(f"{rel}: {popup_id} missing data-verse-key attribute")

                # Check that hardcoded Arabic is NOT in the popup (should be loaded dynamically)
                popup_match = re.search(
                    rf'<div class="popup-overlay" id="{popup_id}"[^>]*>.*?</div>\s*</div>\s*</div>\s*</div>',
                    content, re.DOTALL
                )
                if popup_match:
                    popup_html = popup_match.group()
                    if 'popup-tafsir-text' in popup_html and 'popup-skeleton' not in popup_html:
                        warnings.append(f"{rel}: {popup_id} may still have hardcoded tafsir content (should use skeleton loader)")

    return errors, warnings


def check_arabic_in_cache(cache, verbose):
    """Verify Arabic text in cache is non-empty and reasonable length."""
    errors = []
    for verse_key, data in cache.items():
        arabic = data.get('arabic', '')
        if len(arabic) < 5:
            errors.append(f"{verse_key}: Arabic text too short ({len(arabic)} chars)")
        elif verbose:
            print(f"  [OK] {verse_key}: Arabic text {len(arabic)} chars")

    return errors


def check_featured_verses(verbose):
    """Check featured-verses.json structure."""
    errors = []
    if not os.path.exists(FEATURED_FILE):
        errors.append("featured-verses.json not found")
        return errors

    verses = load_json(FEATURED_FILE)
    for v in verses:
        vk = v.get('verse_key', '?')
        if 'arabic' not in v or len(v.get('arabic', '')) < 5:
            errors.append(f"Featured {vk}: missing or short Arabic text")
        if 'translation_en' not in v:
            errors.append(f"Featured {vk}: missing translation_en")
        if verbose:
            print(f"  [OK] Featured {vk}: {len(v.get('arabic', ''))} chars Arabic")

    return errors


def check_vocabulary(verbose):
    """Check vocabulary-data.json structure."""
    errors = []
    if not os.path.exists(VOCAB_FILE):
        errors.append("vocabulary-data.json not found")
        return errors

    data = load_json(VOCAB_FILE)
    for unit_key, unit in data.items():
        words = unit.get('words', [])
        for w in words:
            if 'ar' not in w or 'en' not in w:
                errors.append(f"{unit_key}: vocab word missing ar or en field")
            elif verbose:
                print(f"  [OK] {unit_key}: word OK")

    return errors


def check_qul_reader_features(verbose):
    # Validate the QURAN-reader enrichment features tied to QUL bundles:
    # similar-ayah rendering, per-ayah theme button, Mutashabihat icon + popup text,
    # Tamil alignment, and the builder/preload wiring.
    errors = []
    reader_js = os.path.join(BASE, 'js', 'quran-reader.js')
    html = os.path.join(BASE, 'quran-reader.html')
    css = os.path.join(BASE, 'css', 'quran-reader.css')
    builder = os.path.join(BASE, 'scripts', 'build_qul_resources.py')
    sim_bundle = os.path.join(BASE, 'js', 'quran_source', 'similar-ayah.js')
    auto_dir = 'dir=' + chr(34) + 'auto' + chr(34)

    def has(path):
        if not os.path.exists(path):
            return ''
        try:
            return read_file(path)
        except Exception:
            return ''

    js = has(reader_js)
    if not os.path.exists(sim_bundle):
        errors.append('similar-ayah.js bundle missing (run build_qul_resources.py)')
    else:
        data = has(sim_bundle)
        if len(data) < 100 or '__QURAN_DATA' not in data:
            errors.append('similar-ayah.js bundle is empty or not wrapped')
    if 'similar-ayah' not in has(builder):
        errors.append('build_qul_resources.py does not emit similar-ayah')
    if 'similar-ayah.js' not in has(html):
        errors.append('quran-reader.html does not preload similar-ayah.js')
    if 'getSimilarAyahRefs' not in js:
        errors.append('quran-reader.js missing getSimilarAyahRefs')
    if 'similar-ayah' not in js:
        errors.append('quran-reader.js missing similar-ayah bundle registration')
    if 'qr-theme-book' not in js:
        errors.append('quran-reader.js missing qr-theme-book theme button')
    if 'highlightMatchedWords' not in js:
        errors.append('quran-reader.js missing highlightMatchedWords for Similar Ayat')
    if 'Mutashabihat are verses' not in js:
        errors.append('quran-reader.js missing Mutashabihat definition text in popup')
    if 'M17.5' in js:
        errors.append('quran-reader.js still uses the old Mutashabihat icon path (M17.5)')
    if auto_dir not in js:
        errors.append('quran-reader.js Tamil info section should use dir=auto (not rtl)')
    styles = has(css)
    if 'qr-sim-highlight' not in styles:
        errors.append('quran-reader.css missing .qr-sim-highlight')
    if 'qr-theme-book' not in styles:
        errors.append('quran-reader.css missing .qr-theme-book styling')
    if verbose:
        print('  [OK] QUL reader features checked')
    return errors


def load_wrapped_bundle(path, key):
    """Extract the JSON payload from a __QURAN_DATA wrapped .js bundle."""
    if not os.path.exists(path):
        return None
    try:
        with io.open(path, encoding='utf-8') as fh:
            text = fh.read()
    except Exception:
        return None
    head = '__QURAN_DATA["%s"]=' % key
    i = text.find(head)
    j = text.rfind(';})(self);')
    if i < 0 or j < 0 or j <= i:
        return None
    try:
        return json.loads(text[i + len(head):j])
    except ValueError:
        return None


def check_mutashabihat_bundles(verbose):
    """Validate the rebuilt QUL mutashabihat / similar-ayah data bundles.

    Verifies the bundle wrapper, the key QA mappings (1:1, 27:30, 2:112),
    partial-phrase recovery, and that every word range stays inside its ayah.
    """
    errors = []
    src_dir = os.path.join(BASE, 'js', 'quran_source')
    mut_path = os.path.join(src_dir, 'mutashabihat.js')
    sim_path = os.path.join(src_dir, 'similar-ayah.js')

    mut = load_wrapped_bundle(mut_path, 'mutashabihat')
    if mut is None:
        errors.append('mutashabihat.js missing or not wrapped (run build_qul_resources.py)')
    else:
        if not mut.get('byAyah') or not mut.get('phrases'):
            errors.append('mutashabihat.js bundle missing phrases/byAyah keys')
        expect = {
            '1:1': [('11313', [[1, 4]])],
            '27:30': [('11313', [[5, 8]])],
            '2:112': {
                '858': [[12, 15]],
                '13963': [[2, 7]],
                '3601': [[9, 17]],
            },
        }
        for akey, want in expect.items():
            got = {str(e[0]): e[1] for e in mut['byAyah'].get(akey, [])}
            if isinstance(want, dict):
                for pid, ranges in want.items():
                    if got.get(pid) != ranges:
                        errors.append('%s: phrase %s ranges %r != expected %r'
                                      % (akey, pid, got.get(pid), ranges))
            elif got.get(want[0][0]) != want[0][1]:
                errors.append('%s: expected phrase %s ranges %r, got %r'
                              % (akey, want[0][0], want[0][1],
                                 got.get(want[0][0])))
        if '447' in mut['phrases']:
            p = mut['phrases']['447']
            if p['refs'] != ['2:26'] or p['ranges'] != {'2:26': [[17, 19]]}:
                errors.append('partial phrase 447 not recovered (2:26 [17,19])')
        else:
            errors.append('mutashabihat bundle missing partial phrase 447')

        # Range bounds: every range must fit inside its ayah's word count.
        verses = load_wrapped_bundle(
            os.path.join(src_dir, 'indopak-nastaleeq-verse.js'),
            'indopak-nastaleeq-verse') or {}
        word_count = {}
        for akey, v in verses.items():
            if v and v.get('text'):
                word_count[akey] = len(v['text'].split())
        bad = 0
        for akey, entries in mut['byAyah'].items():
            wc = word_count.get(akey)
            for _pid, ranges in entries:
                for (lo, hi) in ranges:
                    if wc is None:
                        errors.append('%s: ayah has no verse text for range bounds'
                                      % akey)
                        break
                    if lo < 1 or hi < lo or hi > wc:
                        bad += 1
                        if bad <= 20:
                            errors.append('%s: range [%d,%d] out of bounds (words=%d)'
                                          % (akey, lo, hi, wc))
            if wc is None:
                break
        if bad:
            errors.append('range bounds: %d out-of-bounds ranges total' % bad)

    sim = load_wrapped_bundle(sim_path, 'similar-ayah')
    if sim is None:
        errors.append('similar-ayah.js missing or not wrapped (run build_qul_resources.py)')
    else:
        if len(sim) < 1000:
            errors.append('similar-ayah.js has only %d verse keys (expected > 1000)'
                          % len(sim))
        for akey in ('1:1', '2:1'):
            rows = sim.get(akey)
            if not rows:
                errors.append('similar-ayah.js missing matches for %s' % akey)
            else:
                for r in rows:
                    if not r.get('matched_ayah_key') or \
                            not isinstance(r.get('match_words'), list):
                        errors.append('similar-ayah.js %s: malformed match row %r'
                                      % (akey, r))

    if verbose:
        n_mut = len(mut['byAyah']) if mut else 0
        n_phr = len(mut['phrases']) if mut else 0
        n_sim = len(sim) if sim else 0
        print('  [OK] mutashabihat.js: phrases=%d byAyah=%d, similar-ayah.js: %d verse keys'
              % (n_phr, n_mut, n_sim))
    return errors


def check_unit_vocab_sections(verbose):
    """Check that unit pages have vocab-section elements."""
    errors = []
    unit_files = [
        os.path.join(BASE, 'lessons', 'tawheed', 'unit1.html'),
        os.path.join(BASE, 'lessons', 'tawheed', 'unit2.html'),
        os.path.join(BASE, 'lessons', 'tawheed', 'unit3.html'),
    ]

    for filepath in unit_files:
        if not os.path.exists(filepath):
            errors.append(f"Unit file not found: {filepath}")
            continue

        content = read_file(filepath)
        rel = os.path.relpath(filepath, BASE)

        if 'vocab-section' in content:
            if verbose:
                print(f"  [OK] {rel}: has vocab-section")
        else:
            errors.append(f"{rel}: missing vocab-section element")

    return errors


def main():
    verbose = '--verbose' in sys.argv

    print("=" * 60)
    print("Arabic Content Validation")
    print("=" * 60)

    all_errors = []
    all_warnings = []

    # Load cache
    if os.path.exists(CACHE_FILE):
        cache = load_json(CACHE_FILE)
        print(f"\n[OK] Cache loaded: {len(cache)} verses")
    else:
        print("\n[FAIL] Cache file not found")
        all_errors.append("Cache file not found")
        cache = {}

    # Check cache Arabic text
    print("\n--- Arabic Text in Cache ---")
    all_errors.extend(check_arabic_in_cache(cache, verbose))

    # Check popup files
    print("\n--- Popup Files ---")
    errs, warns = check_popup_files(cache, verbose)
    all_errors.extend(errs)
    all_warnings.extend(warns)

    # Check featured verses
    print("\n--- Featured Verses ---")
    all_errors.extend(check_featured_verses(verbose))

    # Check vocabulary
    print("\n--- Vocabulary ---")
    all_errors.extend(check_vocabulary(verbose))

    # Check unit vocab sections
    print("\n--- Unit Vocab Sections ---")
    all_errors.extend(check_unit_vocab_sections(verbose))

    # Check QUL reader enrichment features
    print("\n--- QUL Reader Features ---")
    all_errors.extend(check_qul_reader_features(verbose))

    # Check QUL mutashabihat / similar-ayah data bundles
    print("\n--- QUL Data Bundles ---")
    all_errors.extend(check_mutashabihat_bundles(verbose))

    # Summary
    print("\n" + "=" * 60)
    if all_errors:
        print(f"RESULT: {len(all_errors)} ERRORS")
        for e in all_errors:
            print(f"  [ERROR] {e}")
    else:
        print("RESULT: ALL CHECKS PASSED")

    if all_warnings:
        print(f"\n{len(all_warnings)} warnings:")
        for w in all_warnings:
            print(f"  [WARN] {w}")

    print("=" * 60)
    sys.exit(0 if not all_errors else 1)


if __name__ == '__main__':
    main()
