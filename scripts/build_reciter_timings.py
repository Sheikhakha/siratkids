#!/usr/bin/env python3
"""Build per-surah Alafasy word-timing files for the Quran Reader.

Source: quranlab/quran-audio-text dataset, config 'mishary-alafasy'
(https://huggingface.co/datasets/quranlab/quran-audio-text).

Each verse row provides:
  - text: canonical Uthmani verse text
  - segments: [{word_start, word_end, word_position (1-based), start_ms, end_ms}]

Output layout (written under --out, default js/quran_source/timings/alafasy):
  001.json ... 114.json      per-surah timing data
  manifest.json              coverage summary

Per-surah file schema:
  {
    "surah": 1,
    "verse_count": 7,
    "source": "quranlab/quran-audio-text (config: mishary-alafasy)",
    "data": {
      "1": { "count": 4, "words": [ {"w": "...", "s": 60, "e": 610}, ... ] },
      ...
    },
    "missing": [3, 5]
  }

A verse is stored only when the segment list aligns with the word split
(segment count == number of words and word_position is contiguous 1..n).
Otherwise it is listed in "missing" so the reader falls back to verse-row
highlighting only for that verse.

Requires: pyarrow (pip install pyarrow). No other third-party deps.
"""

import argparse
import json
import os
import sys
import tempfile
import urllib.request

DATASET_URL = (
    'https://huggingface.co/datasets/quranlab/quran-audio-text/resolve/main/'
    'mishary-alafasy/train-00000-of-00001.parquet'
)
SOURCE_LABEL = 'quranlab/quran-audio-text (config: mishary-alafasy)'


def fetch_parquet(cache_dir):
    os.makedirs(cache_dir, exist_ok=True)
    path = os.path.join(cache_dir, 'mishary-alafasy.parquet')
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return path
    print('Downloading dataset parquet...')
    urllib.request.urlretrieve(DATASET_URL, path)
    print('Downloaded:', path)
    return path


def load_rows(path):
    try:
        import pyarrow.parquet as pq
    except ImportError:
        sys.exit('pyarrow is required. Run: python -m pip install pyarrow')
    pf = pq.ParquetFile(path)
    return pf.read().to_pylist()


def build_surah_verse(verse, words):
    segs = verse.get('segments') or []
    n = len(words)
    if n == 0:
        return None
    if len(segs) != n:
        return None
    for i, seg in enumerate(segs):
        if seg.get('word_position') != i + 1:
            return None
    out_words = []
    for i, seg in enumerate(segs):
        out_words.append({
            'w': words[i],
            's': int(seg['start_ms']),
            'e': int(seg['end_ms']),
        })
    return {'count': n, 'words': out_words}


def build(path, out_dir, only_surah=None, force=False):
    os.makedirs(out_dir, exist_ok=True)
    rows = load_rows(path)
    by_surah = {}
    for row in rows:
        by_surah.setdefault(int(row['surah']), []).append(row)
    for sid in sorted(by_surah):
        by_surah[sid].sort(key=lambda r: int(r['ayah']))

    manifest = {
        'reciter': 'Alafasy',
        'source': SOURCE_LABEL,
        'total_surahs': len(by_surah),
        'total_verses': len(rows),
        'covered_verses': 0,
        'missing_verses': 0,
        'total_words': 0,
        'surahs': {},
    }

    for sid in sorted(by_surah):
        if only_surah is not None and sid != only_surah:
            continue
        verses = by_surah[sid]
        pad = '{:03d}'.format(sid)
        out_path = os.path.join(out_dir, pad + '.json')
        if os.path.exists(out_path) and not force:
            with open(out_path, 'r', encoding='utf-8') as fh:
                existing = json.load(fh)
            manifest['surahs'][str(sid)] = {
                'verses': len(verses),
                'words': existing.get('word_total', 0),
                'missing': existing.get('missing', []),
            }
            manifest['covered_verses'] += len(verses) - len(existing.get('missing', []))
            manifest['missing_verses'] += len(existing.get('missing', []))
            manifest['total_words'] += existing.get('word_total', 0)
            print('skip {} (exists)'.format(pad))
            continue

        data = {}
        missing = []
        word_total = 0
        for verse in verses:
            key = str(int(verse['ayah']))
            words = (verse.get('text') or '').split()
            entry = build_surah_verse(verse, words)
            if entry is None:
                missing.append(int(verse['ayah']))
                continue
            data[key] = entry
            word_total += entry['count']

        payload = {
            'surah': sid,
            'verse_count': len(verses),
            'source': SOURCE_LABEL,
            'data': data,
            'missing': missing,
            'word_total': word_total,
        }
        with open(out_path, 'w', encoding='utf-8') as fh:
            json.dump(payload, fh, ensure_ascii=False, separators=(',', ':'))
        manifest['surahs'][str(sid)] = {
            'verses': len(verses),
            'words': word_total,
            'missing': missing,
        }
        manifest['covered_verses'] += len(verses) - len(missing)
        manifest['missing_verses'] += len(missing)
        manifest['total_words'] += word_total
        print('{}: {}/{} verses, {} words, missing={}'.format(
            pad, len(verses) - len(missing), len(verses), word_total, missing or '-'))

    manifest_path = os.path.join(out_dir, 'manifest.json')
    with open(manifest_path, 'w', encoding='utf-8') as fh:
        json.dump(manifest, fh, ensure_ascii=False, indent=1)
    print('manifest written:', manifest_path)
    print('covered={} missing={} total_words={}'.format(
        manifest['covered_verses'], manifest['missing_verses'], manifest['total_words']))


def main():
    ap = argparse.ArgumentParser(description='Build Alafasy word timings')
    ap.add_argument('--out', default='js/quran_source/timings/alafasy',
                    help='output directory (default: js/quran_source/timings/alafasy)')
    ap.add_argument('--surah', type=int, default=None,
                    help='build only this surah (default: all)')
    ap.add_argument('--force', action='store_true', help='rebuild existing files')
    args = ap.parse_args()

    cache_dir = os.path.join(tempfile.gettempdir(), 'siratkids-build-cache')
    parquet_path = fetch_parquet(cache_dir)
    build(parquet_path, args.out, only_surah=args.surah, force=args.force)


if __name__ == '__main__':
    main()
