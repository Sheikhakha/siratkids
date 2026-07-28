#!/usr/bin/env python3
"""
Quran Content Builder for SiratKids
====================================
This script documents how the Quran content cache was built using the quran.ai MCP server.
The content in js/quran-content-cache.json was fetched during development using:

  - quran_fetch_quran(ayahs, editions="ar-simple-clean") — Arabic text (Indopak Nastaleeq compatible)
  - quran_fetch_translation(ayahs, editions="en-al-hilali-khan") — Al-Hilali-Khan translation
  - quran_fetch_tafsir(ayahs, editions="en-ibn-kathir") — Ibn Kathir (hadith-based)
  - quran_fetch_tafsir(ayahs, editions="en-maarif-ul-quran") — Ma'arif al-Qur'an (Hanafi)
  - quran_fetch_tafsir(ayahs, editions="en-tazkirul-quran") — Tazkirul Quran (modern reflective)
  - quran_fetch_quran_metadata(surah, ayah) — Surah metadata

Usage:
  python scripts/quran-content-builder.py --validate
    Validates that all 4 popup verse entries exist in the cache.

  python scripts/quran-content-builder.py --list
    Lists all verses in the cache with their surah names.

To add new verses to the cache:
  1. Call the appropriate quran_fetch_* tools with the verse reference
  2. Add the verse entry to js/quran-content-cache.json following the existing structure
  3. Run this script with --validate to confirm

The cache uses:
  - ar-simple-clean edition for Arabic (standard Unicode, renders in Indopak Nastaleeq font)
  - en-al-hilali-khan for English translation
  - All 3 English tafsir editions (Ibn Kathir, Ma'arif, Tazkirul)
  - Cross-references from search_quran thematic results

Note: The Arabic text is stored as standard Unicode Arabic. The site's font-switcher
(CSS font-family mapping) handles rendering in Indopak Nastaleeq, Noto Naskh, Amiri,
Scheherazade New, or Lateef based on user preference.
"""

import json
import os
import sys

CACHE_FILE = os.path.join(os.path.dirname(__file__), '..', 'js', 'quran-content-cache.json')
FEATURED_FILE = os.path.join(os.path.dirname(__file__), '..', 'js', 'featured-verses.json')
VOCAB_FILE = os.path.join(os.path.dirname(__file__), '..', 'js', 'vocabulary-data.json')

REQUIRED_VERSES = ['2:152', '39:62', '51:56', '3:19']
REQUIRED_FIELDS = ['arabic', 'translation', 'tafsir', 'surah_meta', 'cross_references']
REQUIRED_TAFSIR = ['ibn_kathir', 'maarif', 'tazkirul']


def load_json(filepath):
    """Load and return JSON file contents."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def validate_cache():
    """Validate that the content cache has all required entries."""
    print("=" * 60)
    print("Quran Content Cache Validation")
    print("=" * 60)

    errors = []
    warnings = []

    # Check cache file exists
    if not os.path.exists(CACHE_FILE):
        print(f"\n[FAIL] Cache file not found: {CACHE_FILE}")
        return False

    cache = load_json(CACHE_FILE)
    print(f"\n[OK] Cache file loaded: {len(cache)} verses")

    # Check required verses
    for verse_key in REQUIRED_VERSES:
        if verse_key not in cache:
            errors.append(f"Missing verse: {verse_key}")
            continue

        verse = cache[verse_key]

        # Check required fields
        for field in REQUIRED_FIELDS:
            if field not in verse:
                errors.append(f"{verse_key}: Missing field '{field}'")

        # Check Arabic text
        if 'arabic' in verse:
            if not verse['arabic'] or len(verse['arabic']) < 5:
                errors.append(f"{verse_key}: Arabic text too short or empty")
            else:
                print(f"[OK] {verse_key}: Arabic text present ({len(verse['arabic'])} chars)")

        # Check translation
        if 'translation' in verse:
            if 'hilali' not in verse['translation']:
                errors.append(f"{verse_key}: Missing Hilali translation")
            else:
                print(f"[OK] {verse_key}: Hilali translation present")

        # Check tafsir editions
        if 'tafsir' in verse:
            for edition in REQUIRED_TAFSIR:
                if edition not in verse['tafsir']:
                    errors.append(f"{verse_key}: Missing tafsir '{edition}'")
                elif 'not available' in verse['tafsir'][edition].lower():
                    warnings.append(f"{verse_key}: Tafsir '{edition}' marked as not available")
                else:
                    print(f"[OK] {verse_key}: Tafsir '{edition}' present")

        # Check surah metadata
        if 'surah_meta' in verse:
            meta = verse['surah_meta']
            for key in ['name_en', 'name_ar', 'revelation', 'verse_count', 'juz']:
                if key not in meta:
                    errors.append(f"{verse_key}: Missing surah_meta.{key}")

        # Check cross-references
        if 'cross_references' in verse:
            if len(verse['cross_references']) < 2:
                warnings.append(f"{verse_key}: Only {len(verse['cross_references'])} cross-references")
            else:
                print(f"[OK] {verse_key}: {len(verse['cross_references'])} cross-references")

    # Check featured verses
    if os.path.exists(FEATURED_FILE):
        featured = load_json(FEATURED_FILE)
        print(f"\n[OK] Featured verses: {len(featured)} entries")
        for v in featured:
            if 'verse_key' not in v or 'arabic' not in v or ('translation' not in v and 'translation_en' not in v):
                errors.append(f"Featured verse incomplete: {v.get('verse_key', 'unknown')}")
    else:
        warnings.append("Featured verses file not found")

    # Check vocabulary data
    if os.path.exists(VOCAB_FILE):
        vocab = load_json(VOCAB_FILE)
        total_words = sum(len(v.get('words', [])) for v in vocab.values())
        print(f"[OK] Vocabulary data: {total_words} words across {len(vocab)} units")
    else:
        warnings.append("Vocabulary data file not found")

    # Summary
    print("\n" + "=" * 60)
    if errors:
        print(f"RESULT: {len(errors)} ERRORS found")
        for e in errors:
            print(f"  [ERROR] {e}")
    else:
        print("RESULT: ALL CHECKS PASSED")

    if warnings:
        print(f"\n{len(warnings)} warnings:")
        for w in warnings:
            print(f"  [WARN] {w}")

    print("=" * 60)
    return len(errors) == 0


def list_verses():
    """List all verses in the cache."""
    if not os.path.exists(CACHE_FILE):
        print("Cache file not found")
        return

    cache = load_json(CACHE_FILE)
    print(f"\n{'Verse':<12} {'Surah (EN)':<20} {'Surah (AR)':<15} {'Revelation':<10} {'Juz':<5}")
    print("-" * 65)

    for verse_key, data in sorted(cache.items(), key=lambda x: (int(x[0].split(':')[0]), int(x[0].split(':')[1]))):
        meta = data.get('surah_meta', {})
        print(f"{verse_key:<12} {meta.get('name_en', '?'):<20} {meta.get('name_ar', '?'):<15} {meta.get('revelation', '?'):<10} {meta.get('juz', '?'):<5}")


def main():
    if len(sys.argv) < 2:
        print("Usage: python quran-content-builder.py [--validate|--list]")
        print("  --validate  Validate the content cache")
        print("  --list      List all verses in the cache")
        sys.exit(1)

    command = sys.argv[1]

    if command == '--validate':
        success = validate_cache()
        sys.exit(0 if success else 1)
    elif command == '--list':
        list_verses()
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)


if __name__ == '__main__':
    main()
