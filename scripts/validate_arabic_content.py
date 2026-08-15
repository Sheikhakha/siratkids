#!/usr/bin/env python3
"""
Validate Arabic Content Preservation
=====================================
Checks that Arabic text, translations, and Quran references in HTML files
match the canonical content in the JSON cache files.

Usage:
  python scripts/validate_arabic_content.py [--verbose]
"""

import glob as globmod
import hashlib
import io
import json
import os
import re
import sys

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

# Golden snapshot manifest (SHA-256 of every hub/lesson file)
SNAPSHOT_FILE = os.path.join(BASE, 'scripts', 'lesson_snapshots.json')

# Root hub pages
HUB_FILES = ['hadith.html', 'adhkar.html', 'seerah.html', 'manners.html']
# Tawheed unit landing pages
UNIT_FILES = [
    os.path.join('lessons', 'tawheed', 'unit1.html'),
    os.path.join('lessons', 'tawheed', 'unit2.html'),
    os.path.join('lessons', 'tawheed', 'unit3.html'),
]

# Toggle bar button values expected in every lesson
EXPECTED_TOGGLES = ['translation', 'tamil', 'transliteration']

# Arabic char range for presence/encoding checks
ARABIC_RE = re.compile(r'[\u0600-\u06FF]')


def lesson_files():
    """All lesson files (content pages, excludes unit landing pages)."""
    files = []
    for p in globmod.glob(os.path.join(BASE, 'lessons', '**', '*.html'), recursive=True):
        rel = os.path.relpath(p, BASE)
        if os.path.basename(rel).startswith('unit'):
            continue
        files.append(rel)
    return sorted(files)


def snapshot_files():
    """Every file guarded by the golden manifest (index + hubs + lessons)."""
    return ['index.html'] + HUB_FILES + UNIT_FILES + lesson_files()


def file_sha256(filepath):
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        for chunk in iter(lambda: f.read(65536), b''):
            h.update(chunk)
    return h.hexdigest()


def write_snapshot():
    manifest = {}
    for rel in snapshot_files():
        path = os.path.join(BASE, rel)
        if os.path.exists(path):
            manifest[rel] = file_sha256(path)
    with open(SNAPSHOT_FILE, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, sort_keys=True)
    print(f"Snapshot written: {len(manifest)} files -> {os.path.relpath(SNAPSHOT_FILE, BASE)}")


def resolve_href(rel_file, href):
    """Resolve an href relative to the file that contains it, against BASE."""
    if href.startswith(('#', 'http', 'mailto', 'tel:', 'javascript:', 'data:')):
        return None
    href = href.split('#')[0].split('?')[0]
    if not href:
        return None
    base_dir = os.path.dirname(os.path.join(BASE, rel_file))
    target = os.path.normpath(os.path.join(base_dir, href))
    return os.path.relpath(target, BASE)


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
    if 'renderWordsSpans' not in js:
        errors.append('quran-reader.js missing renderWordsSpans for Similar Ayat highlighting')
    if 'getQpcWords' not in js:
        errors.append('quran-reader.js missing getQpcWords (QPC-Hafs word spans)')
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
    if 'qurandisp' not in js:
        errors.append('quran-reader.js missing scraped tafsir link (qurandisp) interception')
    if 'quran-sim-size' not in js:
        errors.append('quran-reader.js missing sim modal font-size persistence (quran-sim-size)')
    if 'qr-sim-size-up' not in has(html):
        errors.append('quran-reader.html missing sim modal font-size controls (qr-sim-size-up)')
    if 'Search surah' not in has(html):
        errors.append('quran-reader.html sidebar search placeholder should be "Search surah..."')
    if '<h2>Surahs</h2>' in has(html):
        errors.append('quran-reader.html sidebar still has <h2>Surahs</h2> heading')
    if 'qr-goto-btn' not in has(html):
        errors.append('quran-reader.html missing Go to surah & verse button (qr-goto-btn)')
    if 'qr-nav-toast' not in has(html) or 'role="status"' not in has(html):
        errors.append('quran-reader.html missing navigation toast (qr-nav-toast, role="status")')
    if 'qr-goto-form' not in has(html):
        errors.append('quran-reader.html Go-to dialog must wrap fields in a form (qr-goto-form)')
    if 'qr-goto-error' not in has(html) or 'role="alert"' not in has(html):
        errors.append('quran-reader.html Go-to dialog missing error message (qr-goto-error, role="alert")')
    if 'qr-goto-go' not in has(html) or 'type="submit"' not in has(html):
        errors.append('quran-reader.html Go-to dialog Go button must be type="submit"')
    if 'scrollToVerse' not in js:
        errors.append('quran-reader.js missing scrollToVerse (jump scroll + flash + focus)')
    if 'showNavToast' not in js:
        errors.append('quran-reader.js missing showNavToast (verse-jump indicator)')
    if 'qr-flash-target' not in styles:
        errors.append('quran-reader.css missing verse flash highlight (qr-flash-target)')
    if '--qr-flash-bg' not in styles:
        errors.append('quran-reader.css missing --qr-flash-bg theme variable')
    if 'margin-left: auto' not in styles:
        errors.append('quran-reader.css sim modal font-size controls not right-aligned')
    if 'saveLastRead' not in js:
        errors.append('quran-reader.js missing saveLastRead helper (last-read writer)')
    if 'trackScrollPosition' not in js:
        errors.append('quran-reader.js missing trackScrollPosition (scroll-position memory)')
    if 'setupScrollTracking' not in js:
        errors.append('quran-reader.js missing setupScrollTracking (scroll + pagehide hooks)')
    if 'loadSurah(startSurah, startVerse' not in js:
        errors.append('quran-reader.js init must resume saved verse via loadSurah(startSurah, startVerse)')
    if 'startVerse = parseInt(p[1])' not in js:
        errors.append('quran-reader.js init does not parse the saved verse from quran-last-read')
    if "gotoVerse.value = ''" not in js:
        errors.append('quran-reader.js Go-to dialog must clear the verse field on open')
    if 'position: sticky' not in styles or '.qr-sidebar-header' not in styles:
        errors.append('quran-reader.css sidebar search box is not sticky/frozen')
    if 'saveLastRead(item.chapter' not in js:
        errors.append('quran-reader.js missing audio position tracking in startVersePlayback')
    if '.qr-goto-error' not in styles:
        errors.append('quran-reader.css missing Go-to dialog error styling (.qr-goto-error)')
    if 'gotoForm.addEventListener' not in js:
        errors.append('quran-reader.js Go-to dialog must submit via form (gotoForm.addEventListener)')
    if 'gotoVerse.placeholder' not in js:
        errors.append('quran-reader.js missing verse range placeholder in Go-to dialog')
    if 'setGotoError' not in js or 'clearGotoError' not in js:
        errors.append('quran-reader.js missing Go-to dialog error helpers (setGotoError/clearGotoError)')
    if 'sb.scrollTop = target' not in js:
        errors.append('quran-reader.js must center the active surah in the sidebar (sb.scrollTop)')
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


def check_mushaf_layout(verbose):
    """Validate the QUL mushaf page-layout + tajweed-coloring feature.

    Verifies the layout bundles (page counts, ayah map, line data), the
    tajweed-rules bundle (rule classes are a known set, sample words correct),
    the generated font/tajweed CSS, the reader HTML container + nav group, and
    the quran-reader.js wiring.
    """
    errors = []
    src_dir = os.path.join(BASE, 'js', 'quran_source')

    def has(path):
        if not os.path.exists(path):
            return ''
        try:
            return read_file(path)
        except Exception:
            return ''

    # -- generated files --------------------------------------------------
    for rel in [
        'css/qul-mushaf-fonts.css',
        'js/quran_source/mushaf-meta.js',
        'js/quran_source/mushaf-layout-7.js',
        'js/quran_source/mushaf-layout-17.js',
        'js/quran_source/mushaf-layout-18.js',
        'js/quran_source/tajweed-rules.js',
        'fonts/indopak-nastaleeq-waqf-lazim.woff2',
        'fonts/indopak-nastaleeq-hanafi-compressed.woff2',
        'fonts/indopak-nastaleeq-madinah-normal.woff2',
        'fonts/surah-name-v4.woff2',
    ]:
        if not os.path.exists(os.path.join(BASE, rel)):
            errors.append('mushaf: missing generated file %s (run scripts/build_qul_mushaf.py)' % rel)

    # -- layout bundles ---------------------------------------------------
    known_rules = {
        'ghunnah', 'ham_wasl', 'slnt', 'laam_shamsiyah', 'idgham_ghunnah',
        'idgham_mutajanisayn', 'idgham_mutaqaribayn', 'idgham_shafawi',
        'idgham_wo_ghunnah', 'ikhafa', 'ikhafa_shafawi', 'iqlab', 'izhar',
        'izhar_shafawi', 'madda_necessary', 'madda_normal', 'madda_obligatory',
        'madda_obligatory_mottasel', 'madda_obligatory_monfasel',
        'madda_permissible', 'qalaqah', 'tafkheem',
    }
    for lid in ('17', '18', '7'):
        bundle = load_wrapped_bundle(os.path.join(src_dir, 'mushaf-layout-%s.js' % lid),
                                     'mushaf-layout-%s' % lid)
        if bundle is None:
            errors.append('mushaf-layout-%s.js missing or not wrapped' % lid)
            continue
        if bundle.get('layout_id') != int(lid):
            errors.append('mushaf-layout-%s.js layout_id mismatch' % lid)
        if bundle.get('page_count', 0) < 400:
            errors.append('mushaf-layout-%s.js page_count too small (%s)' % (lid, bundle.get('page_count')))
        if len(bundle.get('pages', [])) != bundle.get('page_count'):
            errors.append('mushaf-layout-%s.js pages length != page_count' % lid)
        if len(bundle.get('ayah_page', {})) < 6200:
            errors.append('mushaf-layout-%s.js ayah_page has %d keys (expected ~6236)'
                          % (lid, len(bundle.get('ayah_page', {}))))
        first = bundle.get('page_first', {}).get('1')
        last = bundle.get('page_last', {}).get(str(bundle.get('page_count')))
        if first != '1:1' or last != '114:6':
            errors.append('mushaf-layout-%s.js page boundaries wrong (first=%r last=%r)' % (lid, first, last))
        # every page must have at least one line
        for i, p in enumerate(bundle.get('pages', [])):
            if not p.get('lines'):
                errors.append('mushaf-layout-%s.js page %d has no lines' % (lid, i + 1))
                break

    meta = load_wrapped_bundle(os.path.join(src_dir, 'mushaf-meta.js'), 'mushaf-meta')
    if meta is None:
        errors.append('mushaf-meta.js missing or not wrapped')
    else:
        if str(meta.get('default_layout')) not in meta.get('layouts', {}):
            errors.append('mushaf-meta.js default_layout not in layouts')
        for lid in ('17', '18', '7'):
            if lid not in meta.get('layouts', {}):
                errors.append('mushaf-meta.js missing layout %s' % lid)

    # -- tajweed rules bundle ----------------------------------------------
    rules = load_wrapped_bundle(os.path.join(src_dir, 'tajweed-rules.js'), 'tajweed-rules')
    if rules is None:
        errors.append('tajweed-rules.js missing or not wrapped (run build_qul_mushaf.py)')
    else:
        if len(rules) < 40000:
            errors.append('tajweed-rules.js has only %d words (expected > 40000)' % len(rules))
        bad_rules = set()
        for loc, rule_list in rules.items():
            if not isinstance(rule_list, list):
                bad_rules.add(repr(rule_list))
                continue
            for r in rule_list:
                if r not in known_rules:
                    bad_rules.add(r)
        if bad_rules:
            errors.append('tajweed-rules.js unknown rule classes: %s' % sorted(bad_rules)[:8])
        for loc, want in (('2:255:12', ['madda_necessary', 'izhar']),
                          ('2:255:1', ['ham_wasl']),
                          ('1:1:3', ['ham_wasl', 'tafkheem', 'madda_normal'])):
            if rules.get(loc) != want:
                errors.append('tajweed-rules.js %s expected %r got %r'
                              % (loc, want, rules.get(loc)))

    # -- html / js / css wiring -------------------------------------------
    html = has(os.path.join(BASE, 'quran-reader.html'))
    if 'qr-mushaf' not in html or 'qr-mushaf-inner' not in html:
        errors.append('quran-reader.html missing #qr-mushaf mushaf container')
    if 'qr-mushaf-group' not in html or 'qr-mushaf-layout' not in html:
        errors.append('quran-reader.html missing .qr-mushaf-group nav controls')
    if 'qr-mushaf-tajweed' not in html:
        errors.append('quran-reader.html missing tajweed on/off switch (qr-mushaf-tajweed)')
    if 'qr-mushaf-legend' not in html:
        errors.append('quran-reader.html missing mushaf legend container (qr-mushaf-legend)')
    if 'data-qr-mushaf-hide' not in html:
        errors.append('quran-reader.html settings sliders missing data-qr-mushaf-hide (English/WBW must hide in Mushaf view)')
    if 'qul-mushaf-fonts.css' not in html:
        errors.append('quran-reader.html missing qul-mushaf-fonts.css stylesheet link')

    js = has(os.path.join(BASE, 'js', 'quran-reader.js'))
    for token in ('renderMushafPage', 'jumpToAyah', 'updateMushafWordHighlight',
                  'ensureMushafPageForAyah', 'switchMushafLayout',
                  'mushaf-layout-', 'mushaf-meta', 'tajweed-rules',
                  'DEFAULT_MUSHAF_LAYOUT', 'mushafTajweed', 'buildMushafLegend',
                  'RULE_LABELS', 'qr-mushaf-hidden', 'qr-mushaf-mode',
                  'mushafAnchor', 'qr-mushaf-legend-text'):
        if token not in js:
            errors.append('quran-reader.js missing %s' % token)

    css = has(os.path.join(BASE, 'css', 'quran-reader.css'))
    for token in ('.qr-mushaf-page', '.qr-mushaf-line', '.qr-mushaf-word',
                  '.qr-mushaf-group', '.qr-mushaf-page-btn', '.qr-mushaf-page-label',
                  '.qr-mushaf-tajweed-toggle', '.qr-mushaf-legend', '.qr-mushaf-legend-text',
                  'repeating-linear-gradient', '.qr-mushaf-page::before',
                  'body.qr-mushaf-mode .qr-sidebar-toggle', '.qr-nav-bottom.qr-mushaf-hidden'):
        if token not in css:
            errors.append('quran-reader.css missing %s styling' % token)

    mcss = has(os.path.join(BASE, 'css', 'qul-mushaf-fonts.css'))
    for family in ('indopak-nastaleeq', 'indopak-nastaleeq-hanafi-compressed',
                   'indopak-nastaleeq-madinah-normal', 'surah-name-v4'):
        if "font-family: '%s'" % family not in mcss and '@font-face' not in mcss:
            errors.append('qul-mushaf-fonts.css missing @font-face for %s' % family)
    for rule in ('izhar', 'ikhafa', 'iqlab', 'ghunnah', 'qalaqah', 'idgham_ghunnah',
                 'idgham_wo_ghunnah', 'idgham_shafawi', 'madda_necessary',
                 'madda_normal', 'madda_permissible', 'tafkheem', 'ham_wasl', 'slnt'):
        if ('.qr-mushaf-page .%s' % rule) not in mcss:
            errors.append('qul-mushaf-fonts.css missing tajweed class .%s' % rule)
    for layout_cls in ('.qr-mushaf-layout-17', '.qr-mushaf-layout-18', '.qr-mushaf-layout-7'):
        if layout_cls not in mcss:
            errors.append('qul-mushaf-fonts.css missing %s font-family' % layout_cls)
    for swatch in ('.qr-mushaf-legend-swatch.izhar', '.qr-mushaf-legend-swatch.ikhafa',
                   '.qr-mushaf-legend-swatch.madda_normal'):
        if swatch not in mcss:
            errors.append('qul-mushaf-fonts.css missing %s legend swatch' % swatch)

    if verbose:
        print('  [OK] mushaf layout bundles + tajweed rules checked')
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


def check_golden_files(verbose):
    """Golden snapshot check: every hub/lesson file must match its manifest hash."""
    errors = []
    if not os.path.exists(SNAPSHOT_FILE):
        errors.append(f"Snapshot manifest missing: {os.path.relpath(SNAPSHOT_FILE, BASE)} (run --snapshot)")
        return errors

    manifest = load_json(SNAPSHOT_FILE)
    for rel, expected_hash in manifest.items():
        path = os.path.join(BASE, rel)
        if not os.path.exists(path):
            errors.append(f"{rel}: file missing (was in snapshot)")
            continue
        actual = file_sha256(path)
        if actual != expected_hash:
            errors.append(f"{rel}: content CHANGED vs snapshot (re-run --snapshot if intended)")
        elif verbose:
            print(f"  [OK] {rel}: unchanged")

    for rel in snapshot_files():
        if rel not in manifest:
            path = os.path.join(BASE, rel)
            if os.path.exists(path):
                errors.append(f"{rel}: new file not in snapshot (re-run --snapshot)")
    return errors


def check_lesson_arabic(verbose):
    """Every lesson file must contain Arabic text in .ar[dir="rtl"] blocks."""
    errors = []
    for rel in lesson_files():
        path = os.path.join(BASE, rel)
        content = read_file(path)
        if not ARABIC_RE.search(content):
            errors.append(f"{rel}: no Arabic characters found")
        if 'class="ar"' not in content:
            errors.append(f"{rel}: missing .ar element")
        if 'dir="rtl"' not in content:
            errors.append(f"{rel}: missing dir=\"rtl\" on Arabic text")
        if 'lesson-block' not in content:
            errors.append(f"{rel}: missing lesson-block element")
        elif verbose:
            print(f"  [OK] {rel}: Arabic content present")
    return errors


def check_nav_chains(verbose):
    """Verify prev/next links, sidebar links, lesson-item links, and breadcrumbs."""
    errors = []
    hub_set = set(HUB_FILES + UNIT_FILES)

    for rel in snapshot_files():
        path = os.path.join(BASE, rel)
        content = read_file(path)
        is_hub = rel in hub_set

        if rel == 'index.html':
            for m in re.finditer(r'class="track-card[^"]*"[^>]*href="([^"]+)"', content):
                target = resolve_href(rel, m.group(1))
                if target and not os.path.exists(os.path.join(BASE, target)):
                    errors.append(f"{rel}: track-card link -> {m.group(1)} (missing)")
            continue

        # Sidebar lesson links (all non-index pages)
        for m in re.finditer(r'class="sidebar-lesson[^"]*"[^>]*href="([^"]+)"', content):
            target = resolve_href(rel, m.group(1))
            if target and not os.path.exists(os.path.join(BASE, target)):
                errors.append(f"{rel}: sidebar-lesson link -> {m.group(1)} (missing)")

        if is_hub:
            # Hub lesson-item cards
            for m in re.finditer(r'class="lesson-item[^"]*"[^>]*href="([^"]+)"', content):
                target = resolve_href(rel, m.group(1))
                if target and not os.path.exists(os.path.join(BASE, target)):
                    errors.append(f"{rel}: lesson-item link -> {m.group(1)} (missing)")
        else:
            # Lesson prev/next chain
            for m in re.finditer(
                r'class="(lesson-nav-prev|lesson-nav-next)[^"]*"[^>]*href="([^"]+)"', content
            ):
                target = resolve_href(rel, m.group(2))
                if target and not os.path.exists(os.path.join(BASE, target)):
                    errors.append(f"{rel}: {m.group(1)} link -> {m.group(2)} (missing)")

        # Breadcrumb on every non-index page
        if 'aria-label="Breadcrumb"' not in content:
            errors.append(f"{rel}: missing breadcrumb nav")
        if 'aria-current="page"' not in content:
            errors.append(f"{rel}: missing aria-current=\"page\" in breadcrumb")

        if verbose:
            print(f"  [OK] {rel}: nav chain present")
    return errors


def check_audio_widget(verbose):
    """Every hub/lesson page must have an audio player inside lesson-aside."""
    errors = []
    for rel in HUB_FILES + UNIT_FILES + lesson_files():
        path = os.path.join(BASE, rel)
        content = read_file(path)

        aside_match = re.search(
            r'<aside[^>]*class="lesson-aside[^"]*"[^>]*>(.*?)</aside>', content, re.DOTALL
        )
        if not aside_match:
            errors.append(f"{rel}: missing lesson-aside")
            continue
        aside = aside_match.group(1)
        for token in ('audio-player', 'audio-play-btn', 'audio-status', 'audio-text-preview', 'audio-speed-select'):
            if token not in aside:
                errors.append(f"{rel}: lesson-aside missing {token}")
        if verbose:
            print(f"  [OK] {rel}: audio widget complete")
    return errors


def check_toggle_bar(verbose):
    """Every lesson must have translation/tamil/transliteration toggle buttons."""
    errors = []
    for rel in lesson_files():
        path = os.path.join(BASE, rel)
        content = read_file(path)
        toggles = re.findall(r'data-toggle="([^"]+)"', content)
        if sorted(EXPECTED_TOGGLES) != sorted(toggles):
            errors.append(f"{rel}: translation-toggle mismatch: {toggles}")
        elif verbose:
            print(f"  [OK] {rel}: toggles = {sorted(toggles)}")
    return errors


def check_encoding(verbose):
    """Warn about entity-encoded Arabic text that should be normalized to raw UTF-8."""
    warnings = []
    for rel in snapshot_files():
        path = os.path.join(BASE, rel)
        content = read_file(path)
        entities = re.findall(r'&#x([0-9A-Fa-f]{2,6});', content)
        arabic_entities = []
        for hexval in entities:
            cp = int(hexval, 16)
            if 0x0600 <= cp <= 0x06FF or 0xFB50 <= cp <= 0xFDFF or 0xFE70 <= cp <= 0xFEFF:
                arabic_entities.append(hexval)
        if arabic_entities:
            warnings.append(f"{rel}: {len(arabic_entities)} entity-encoded Arabic chars (&#x{arabic_entities[0]}; ...) - normalize to raw UTF-8")
        elif verbose:
            print(f"  [OK] {rel}: no encoded Arabic entities")
    return warnings


def main():
    verbose = '--verbose' in sys.argv
    snapshot = '--snapshot' in sys.argv

    if snapshot:
        write_snapshot()
        sys.exit(0)

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

    # Check QUL mushaf layout + tajweed bundles
    print("\n--- QUL Mushaf Layouts ---")
    all_errors.extend(check_mushaf_layout(verbose))

    # Golden snapshot: every hub/lesson file unchanged
    print("\n--- Golden Snapshot Files ---")
    all_errors.extend(check_golden_files(verbose))

    # Lesson Arabic content presence
    print("\n--- Lesson Arabic Content ---")
    all_errors.extend(check_lesson_arabic(verbose))

    # Navigation chains
    print("\n--- Navigation Chains ---")
    all_errors.extend(check_nav_chains(verbose))

    # Audio widgets
    print("\n--- Audio Widgets ---")
    all_errors.extend(check_audio_widget(verbose))

    # Translation toggle bars
    print("\n--- Translation Toggle Bars ---")
    all_errors.extend(check_toggle_bar(verbose))

    # Encoding check (warnings only)
    print("\n--- Encoding ---")
    all_warnings.extend(check_encoding(verbose))

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
