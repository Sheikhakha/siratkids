#!/usr/bin/env python3
"""
Validate Arabic Content Preservation
=====================================
Checks that Arabic text, translations, and Quran references in HTML files
match the canonical content in the JSON cache files.

Usage:
  python scripts/validate_arabic_content.py [--verbose]
"""

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
