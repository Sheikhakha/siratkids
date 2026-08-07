#!/usr/bin/env python3
"""Merge staged English Ibn Kathir tafsir (from the Quran MCP) into
per-surah files under js/tafsir/, mirroring the Tamil tafsir schema.

Workflow (English tafsir is generated incrementally, one surah at a time):
  1. Fetch tafsir for ayahs from the Quran MCP (edition en-ibn-kathir),
     in small batches (2-5 ayahs per call; large ayahs like 1:1 alone).
  2. Save each batch as a JSON "stage" file:
       {"surah": 1, "entries": {"3": {"html": "...", "text": "..."}}}
  3. Merge the stage into the per-surah file:
       python scripts/build_english_tafsir.py --merge stage.json --surah 1
  Repeat until every ayah of the surah is covered; the file is rewritten
  only when a new stage is merged, so progress is never lost.

Output file schema (js/tafsir/english-{NNN}.js):
  {
    "sura": 1,
    "name_ar": "الفاتحة",
    "name_en": "Al-Fatihah",
    "verses": 7,
    "source": "Tafsir Ibn Kathir (Abridged) - quran.com",
    "count": 7,
    "missing": [],
    "data": { "1": {"html": "...", "text": "..."}, ... }
  }

Also maintains the "english" section of js/tafsir/manifest.json.

Requires only the Python standard library.
"""

import argparse
import json
import os
import re
import time

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TAFSIR_DIR = os.path.join(REPO_ROOT, 'js', 'tafsir')
CHAPTER_DATA = os.path.join(REPO_ROOT, 'js', 'quran-chapter-data.js')
ENGLISH_SOURCE = 'Tafsir Ibn Kathir (Abridged) - quran.com'


def write_data_js(path, payload):
    """Write a data payload as a wrapped .js file (loaded via <script>, works on file://)."""
    name = os.path.splitext(os.path.basename(path))[0]
    body = json.dumps(payload, ensure_ascii=False, separators=(',', ':'))
    with open(path, 'w', encoding='utf-8') as fh:
        fh.write('(function(g){g.__QURAN_DATA=g.__QURAN_DATA||{};g.__QURAN_DATA["')
        fh.write(name)
        fh.write('"]=')
        fh.write(body)
        fh.write(';})(self);\n')


def read_data_js(path):
    """Parse a wrapped .js data file back into a dict."""
    with open(path, 'r', encoding='utf-8') as fh:
        text = fh.read()
    body = text.split('"]=', 1)[1].rsplit(';})(self);', 1)[0]
    return json.loads(body)


def load_chapters():
    with open(CHAPTER_DATA, 'r', encoding='utf-8') as fh:
        src = fh.read()
    m = re.search(r'=\s*(\[.*\])\s*;?\s*$', src, re.S)
    if not m:
        raise SystemExit('Could not parse quran-chapter-data.js')
    return json.loads(m.group(1))


def parse_arabic(html):
    """Best-effort plain-text extraction from tafsir HTML."""
    text = re.sub(r'<br\s*/?>', '\n', html)
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'&nbsp;', ' ', text)
    text = re.sub(r'&amp;', '&', text)
    text = re.sub(r'&quot;', '"', text)
    text = re.sub(r'&#39;', "'", text)
    text = re.sub(r'&lt;', '<', text)
    text = re.sub(r'&gt;', '>', text)
    text = re.sub(r'\n{3,}', '\n\n', text).strip()
    return text


def parse_mcp_output(path):
    """Extract {ayah: {html, text}} entries from a Quran MCP tool-output file.

    File shape: {"ayahs": [...], "results": {"<edition>": [{"ayahs": [...],
    "range": "1:2" | "1:2-4", "text": "<html>"}]}}
    """
    with open(path, 'r', encoding='utf-8', errors='replace') as fh:
        raw = fh.read()

    decoder = json.JSONDecoder()
    try:
        data, _ = decoder.raw_decode(raw.lstrip())
    except ValueError:
        raise SystemExit('Could not parse MCP output as JSON: {}'.format(path))

    entries = {}
    results = data.get('results') or {}
    for edition, items in results.items():
        for item in items:
            html = item.get('text') or ''
            if not html.strip():
                continue
            ayahs = item.get('ayahs') or []
            if not ayahs and item.get('range'):
                rng = item['range']
                if ':' in rng:
                    surah_part, rest = rng.split(':', 1)
                    if '-' in rest:
                        start, end = rest.split('-')
                        ayahs = ['{}:{}'.format(int(surah_part), v)
                                 for v in range(int(start), int(end) + 1)]
                    else:
                        ayahs = ['{}:{}'.format(int(surah_part), int(rest))]
            for ref in ayahs:
                if ':' in ref:
                    key = ref.split(':')[1]
                else:
                    key = str(int(ref))
                entries[key] = {
                    'html': html,
                    'text': parse_arabic(html),
                }
    if not entries:
        raise SystemExit('No tafsir entries found in {}'.format(path))
    return entries


def merge_stage(stage_path, surah_num, chapters, force=False):
    with open(stage_path, 'r', encoding='utf-8') as fh:
        stage = json.load(fh)

    if 'surah' not in stage:
        raise SystemExit('Stage file must contain a "surah" field')
    sid = int(stage['surah'])
    if surah_num is not None and sid != surah_num:
        raise SystemExit('Stage surah {} does not match --surah {}'.format(sid, surah_num))
    surah_num = sid

    ch = chapters[surah_num - 1]
    verses = int(ch['verses'])
    pad = '{:03d}'.format(surah_num)
    target = os.path.join(TAFSIR_DIR, 'english-' + pad + '.js')

    payload = None
    if os.path.exists(target) and not force:
        payload = read_data_js(target)

    if payload is None:
        payload = {
            'sura': surah_num,
            'name_ar': ch['ar'],
            'name_en': ch['en'],
            'verses': verses,
            'source': ENGLISH_SOURCE,
            'count': 0,
            'missing': list(range(1, verses + 1)),
            'data': {},
        }

    for ayah, entry in stage.get('entries', {}).items():
        akey = str(int(ayah))
        html = entry.get('html', '')
        payload['data'][akey] = {
            'html': html,
            'text': entry.get('text') or parse_arabic(html),
        }

    payload['count'] = len(payload['data'])
    payload['missing'] = [v for v in range(1, verses + 1) if str(v) not in payload['data']]

    write_data_js(target, payload)
    print('{}: {}/{} ayahs covered, missing={}'.format(
        pad, payload['count'], verses, payload['missing'] or '-'))
    print('wrote', os.path.relpath(target, REPO_ROOT))
    return payload


def update_manifest(payload):
    manifest_path = os.path.join(TAFSIR_DIR, 'manifest.json')
    manifest = {}
    if os.path.exists(manifest_path):
        with open(manifest_path, 'r', encoding='utf-8') as fh:
            manifest = json.load(fh)
    if not isinstance(manifest.get('surahs'), dict):
        manifest['surahs'] = {}
    manifest['surahs'].setdefault(str(payload['sura']), {})['english'] = {
        'verses': payload['verses'],
        'count': payload['count'],
        'missing': payload['missing'],
    }
    manifest['english'] = {
        'source': ENGLISH_SOURCE,
        'updated': time.strftime('%Y-%m-%d %H:%M:%S'),
        'total_verses': sum(
            s.get('english', {}).get('count', 0)
            for s in manifest.get('surahs', {}).values()
        ),
    }
    with open(manifest_path, 'w', encoding='utf-8') as fh:
        json.dump(manifest, fh, ensure_ascii=False, indent=1)
    print('manifest updated:', manifest_path)


def show_status(chapters):
    for sid in range(1, 115):
        pad = '{:03d}'.format(sid)
        target = os.path.join(TAFSIR_DIR, 'english-' + pad + '.js')
        if os.path.exists(target):
            payload = read_data_js(target)
            print('{} {}: {}/{}'.format(
                pad, chapters[sid - 1]['en'], payload.get('count', 0), payload.get('verses', 0)))
        else:
            print('{} {}: --'.format(pad, chapters[sid - 1]['en']))


def main():
    ap = argparse.ArgumentParser(description='Merge staged English Ibn Kathir tafsir')
    ap.add_argument('--merge', metavar='stage.json', help='stage file to merge')
    ap.add_argument('--ingest', metavar='mcp-output.json', action='append',
                    help='Quran MCP tool-output file(s) to extract and merge')
    ap.add_argument('--surah', type=int, help='surah number for the merge target')
    ap.add_argument('--force', action='store_true', help='rebuild from scratch, discarding old entries')
    ap.add_argument('--status', action='store_true', help='print per-surah English coverage')
    args = ap.parse_args()

    chapters = load_chapters()

    if args.status:
        show_status(chapters)
        return

    if not args.merge and not args.ingest:
        ap.error('provide --merge stage.json and/or --ingest mcp-output.json (or --status)')
    if not args.surah:
        ap.error('--surah N is required for merging/ingesting')

    if args.ingest:
        import tempfile
        stage_entries = {}
        for path in args.ingest:
            stage_entries.update(parse_mcp_output(path))
        if stage_entries:
            stage_path = os.path.join(
                tempfile.gettempdir(),
                'english-tafsir-stage-{:03d}.json'.format(args.surah))
            with open(stage_path, 'w', encoding='utf-8') as fh:
                json.dump({'surah': args.surah, 'entries': stage_entries}, fh,
                          ensure_ascii=False, separators=(',', ':'))
            print('ingested {} ayahs from {} file(s)'.format(
                len(stage_entries), len(args.ingest)))

    payload = None
    if args.merge:
        payload = merge_stage(args.merge, args.surah, chapters, force=args.force)
    if args.ingest:
        stage_path = os.path.join(
            tempfile.gettempdir(),
            'english-tafsir-stage-{:03d}.json'.format(args.surah))
        payload = merge_stage(stage_path, args.surah, chapters, force=args.force)
    if payload:
        update_manifest(payload)


if __name__ == '__main__':
    main()
