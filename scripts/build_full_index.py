#!/usr/bin/env python
"""Build full Quran search index from quran.com API v4.

Downloads:
  - 114 chapters metadata
  - 6236 verses with Uthmani Arabic + Hilali-Khan English (translation ID 203)
  - Merges with existing lesson references from quran-search-index.json
  - Builds inverted word index for Arabic + English search
  - Outputs js/quran-full-index.json

Usage: py scripts/build_full_index.py
"""
import json
import os
import re
import sys
import time
import urllib.request

API_BASE = 'https://api.quran.com/api/v4'
TRANSLATION_ID = 203  # Al-Hilali & Khan
PER_PAGE = 300  # max per request
DELAY = 0.3  # seconds between requests to avoid rate limiting

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT = os.path.join(ROOT, 'js', 'quran-full-index.json')
LESSON_INDEX = os.path.join(ROOT, 'js', 'quran-search-index.json')

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


def normalize_ar(text):
    text = (text or '')
    # Strip tashkeel/diacritics
    text = re.sub(r'[\u0610-\u061A\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]', '', text)
    text = re.sub(r'[\u064B-\u065F]', '', text)
    text = re.sub(r'[\u0670]', '', text)  # remove dagger alif (not replace with alef)
    text = text.replace('\u0640', '')
    # Normalize alef variants to plain alef
    text = text.replace('\u0622', '\u0627')  # آ → ا
    text = text.replace('\u0623', '\u0627')  # أ → ا
    text = text.replace('\u0625', '\u0627')  # إ → ا
    text = text.replace('\u0671', '\u0627')  # ٱ → ا (superscript alef/waqf)
    text = text.replace('\u0649', '\u064A')  # ى → ي
    text = text.replace('\u0629', '\u0647')  # ة → ه
    text = re.sub(r'\s+', ' ', text).strip().lower()
    return text


def normalize_en(text):
    text = (text or '').lower()
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def is_stopword_ar(word):
    stops = {
        '\u0641\u064A', '\u0645\u0646', '\u0639\u0644\u0649', '\u0625\u0644\u0649',
        '\u0627\u0644\u0630\u064A', '\u0627\u0644\u062A\u064A', '\u0627\u0644\u0630\u064A\u0646',
        '\u062F\u0639\u0627', '\u0642\u062F', '\u0644\u0645\u0627', '\u0641\u064A\u0647\u0627',
        '\u0648\u0641\u064A', '\u0627\u0644\u062A\u064A', '\u0645\u0627', '\u0647\u0648',
        '\u0647\u064A', '\u0643\u0627\u0646\u0629', '\u0644\u0627', '\u0639\u0646',
        '\u0648\u0627\u0644\u062A\u064A', '\u0623\u0646\u064A', '\u0644\u0643\u0645',
        '\u0645\u0646\u0647\u0627', '\u0628\u0647\u0627', '\u0639\u0644\u064A\u0647\u0627',
        '\u0641\u0628\u064A\u0646', '\u0627\u0644\u0630\u064A\u0646', '\u0627\u0644\u064A\u0648\u0645',
        '\u0643\u0645\u0627', '\u0644\u0645\u0627', '\u0645\u0627\u0644\u0627',
    }
    return word in stops or len(word) <= 1


def is_stopword_en(word):
    stops = {
        'the', 'and', 'of', 'in', 'to', 'is', 'a', 'an', 'it', 'on', 'for',
        'that', 'this', 'with', 'from', 'by', 'are', 'was', 'were', 'be',
        'has', 'have', 'had', 'not', 'they', 'who', 'which', 'them', 'their',
        'its', 'he', 'she', 'his', 'her', 'we', 'our', 'you', 'your',
        'do', 'did', 'does', 'will', 'would', 'can', 'could', 'shall',
        'should', 'may', 'might', 'at', 'as', 'or', 'but', 'if', 'than',
        'no', 'nor', 'so', 'what', 'when', 'where', 'how', 'all', 'each',
        'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such',
        'only', 'own', 'same', 'then', 'also', 'just', 'about', 'up',
        'out', 'into', 'through', 'during', 'before', 'after', 'above',
        'below', 'between', 'under', 'again', 'there', 'here', 'once',
    }
    return word in stops or len(word) <= 2


def tokenize_ar(text):
    words = normalize_ar(text).split()
    result = []
    for w in words:
        if is_stopword_ar(w) or len(w) <= 1:
            continue
        result.append(w)
        # Strip definite article ال for root matching
        if w.startswith('\u0627\u0644') and len(w) > 3:
            result.append(w[2:])
    return result


def tokenize_en(text):
    words = normalize_en(text).split()
    return [w for w in words if not is_stopword_en(w) and len(w) > 2]


def load_lesson_refs():
    refs = {}
    if not os.path.exists(LESSON_INDEX):
        return refs
    with open(LESSON_INDEX, 'r', encoding='utf-8') as f:
        data = json.load(f)
    for v in data.get('key_verses', []):
        refs[v['key']] = v.get('lesson', '')
    return refs


def download_chapters():
    print('Downloading chapters metadata...')
    data = api_get('chapters?language=en')
    chapters = data['chapters']
    print(f'  Got {len(chapters)} chapters')
    return chapters


def download_verses(chapter_id, chapter_name_ar):
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


def build_index():
    # Check if we have a cached download
    cache_file = os.path.join(ROOT, 'scripts', '_quran_cache.json')

    if os.path.exists(cache_file):
        print('Loading cached data...')
        with open(cache_file, 'r', encoding='utf-8') as f:
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
            verses = download_verses(ch_id, ch.get('name_arabic', ''))
            all_verses_raw.extend(verses)
            time.sleep(DELAY)
        print(f'\n  Total verses downloaded: {len(all_verses_raw)}')

        # Cache raw data
        os.makedirs(os.path.dirname(cache_file), exist_ok=True)
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump({'chapters': chapters_raw, 'verses': all_verses_raw}, f, ensure_ascii=False)
        print('  Cached to scripts/_quran_cache.json')

    # Load lesson references
    lesson_refs = load_lesson_refs()
    print(f'  Loaded {len(lesson_refs)} lesson verse references')

    # Build processed verses
    print('Processing verses...')
    verses = []
    ar_index = {}
    en_index = {}

    for v in all_verses_raw:
        key = v['verse_key']
        ar_text = v.get('text_uthmani', '')
        trans_raw = ''
        if v.get('translations'):
            trans_raw = v['translations'][0].get('text', '')
        en_text = strip_html(trans_raw)

        surah_num, verse_num = key.split(':')

        verses.append({
            'k': key,
            's': int(surah_num),
            'v': int(verse_num),
            'ar': ar_text,
            'en': en_text,
            'lesson': lesson_refs.get(key, ''),
        })

        # Index Arabic words
        for word in tokenize_ar(ar_text):
            if word not in ar_index:
                ar_index[word] = []
            idx = len(verses) - 1
            if not ar_index[word] or ar_index[word][-1] != idx:
                ar_index[word].append(idx)

        # Index English words
        for word in tokenize_en(en_text):
            if word not in en_index:
                en_index[word] = []
            idx = len(verses) - 1
            if not en_index[word] or en_index[word][-1] != idx:
                en_index[word].append(idx)

    # Build chapter metadata
    chapters = []
    verse_idx = 0
    for ch in chapters_raw:
        ch_id = ch['id']
        v_count = ch.get('verses_count', 0)
        chapters.append({
            'id': ch_id,
            'ar': ch.get('name_arabic', ''),
            'en': ch.get('name_simple', ''),
            'verses': v_count,
            'start': verse_idx,
            'end': verse_idx + v_count - 1,
        })
        verse_idx += v_count

    # Merge Arabic and English index under a single key
    # English words prefixed with 'en:' to avoid collisions
    merged_idx = {}
    for k, v in ar_index.items():
        merged_idx[k] = v
    for k, v in en_index.items():
        merged_idx['en:' + k] = v

    # Build final output
    output = {
        'meta': {
            'source': 'quran.com API v4',
            'translation': 'Al-Hilali & Khan (ID 203)',
            'arabic': 'Uthmani',
            'verses': len(verses),
            'chapters': len(chapters),
            'tokens': len(merged_idx),
        },
        'chapters': chapters,
        'verses': verses,
        'idx': merged_idx,
    }

    # Write output
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, separators=(',', ':'))

    size_mb = os.path.getsize(OUTPUT) / (1024 * 1024)
    print(f'\nOutput: {OUTPUT}')
    print(f'Verses: {len(verses)}, Chapters: {len(chapters)}, Tokens: {len(merged_idx)}')
    print(f'File size: {size_mb:.2f} MB')


if __name__ == '__main__':
    build_index()
