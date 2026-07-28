#!/usr/bin/env python
"""Fetch Saheeh International translation from quran.com API v4.
Outputs js/quran-saheeh-data.js as window.__SAHEEH_DATA object.

Usage: py scripts/fetch_saheeh.py
"""
import json
import os
import re
import sys
import time
import urllib.request

API_BASE = 'https://api.quran.com/api/v4'
TRANSLATION_ID = 20  # Saheeh International
PER_PAGE = 300
DELAY = 0.3

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT = os.path.join(ROOT, 'js', 'quran-saheeh-data.js')
CACHE = os.path.join(ROOT, 'scripts', '_quran_cache.json')

HEADERS = {'User-Agent': 'SiratKids/1.0 (static Islamic education site)'}


def api_get(path):
    url = f'{API_BASE}/{path}'
    req = urllib.request.Request(url, headers=HEADERS)
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode('utf-8'))
        except Exception as e:
            if attempt < 2:
                time.sleep(1)
            else:
                raise


def strip_html(text):
    text = re.sub(r'<sup[^>]*>.*?</sup>', '', text, flags=re.DOTALL)
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def download_chapters():
    print('Downloading chapters...')
    data = api_get('chapters?language=en')
    return data['chapters']


def download_verses(chapter_id):
    verses = []
    page = 1
    while True:
        path = f'verses/by_chapter/{chapter_id}?language=en&words=false&translations={TRANSLATION_ID}&fields=text_uthmani&per_page={PER_PAGE}&page={page}'
        data = api_get(path)
        batch = data.get('verses', [])
        if not batch:
            break
        verses.extend(batch)
        if len(batch) < PER_PAGE:
            break
        page += 1
        time.sleep(DELAY)
    return verses


def build():
    # Try loading cached raw data
    if os.path.exists(CACHE):
        print('Loading cached data...')
        with open(CACHE, 'r', encoding='utf-8') as f:
            raw = json.load(f)
        chapters_raw = raw['chapters']
        all_verses_raw = raw['verses']
    else:
        chapters_raw = download_chapters()
        all_verses_raw = []
        for i, ch in enumerate(chapters_raw):
            ch_id = ch['id']
            ch_name = ch.get('name_simple', f'Surah {ch_id}')
            sys.stdout.write(f'\r  [{ch_id:3d}/114] {ch_name}...')
            sys.stdout.flush()
            vers = download_verses(ch_id)
            all_verses_raw.extend(vers)
            time.sleep(DELAY)
        print(f'\n  Total: {len(all_verses_raw)} verses')

        os.makedirs(os.path.dirname(CACHE), exist_ok=True)
        with open(CACHE, 'w', encoding='utf-8') as f:
            json.dump({'chapters': chapters_raw, 'verses': all_verses_raw}, f, ensure_ascii=False)
        print('  Cached to _quran_cache.json')

    # Build saheeh data object
    print('Processing verses...')
    saheeh = {}
    for v in all_verses_raw:
        key = v['verse_key']
        text = ''
        if v.get('translations'):
            text = strip_html(v['translations'][0].get('text', ''))
        saheeh[key] = text

    # Write output
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    js = 'window.__SAHEEH_DATA = ' + json.dumps(saheeh, ensure_ascii=False, separators=(',', ':')) + ';'
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        f.write(js)

    size_kb = os.path.getsize(OUTPUT) / 1024
    print(f'\nOutput: {OUTPUT}')
    print(f'Verses: {len(saheeh)}, Size: {size_kb:.1f} KB')


if __name__ == '__main__':
    build()
