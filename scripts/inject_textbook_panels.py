#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Inject per-lesson Textbook page panels into Pre-Stage lesson pages.

Reads data/s0_page_map.json (lesson key -> list of page basenames) and inserts
a collapsible <details class="textbook-panel"> block right before the first
<div class="lesson-block"> of each mapped lesson page.

Idempotent: pages that already contain .textbook-panel are skipped.

Run:  python scripts/inject_textbook_panels.py [--dry-run]
"""
import io
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DRY = '--dry-run' in sys.argv

MAP_PATH = os.path.join(ROOT, 'data', 's0_page_map.json')

# lesson key -> relative html path from repo root
LESSON_PATHS = {}
for k in os.listdir(os.path.join(ROOT, 'lessons')):
    pass


def build_lesson_paths():
    paths = {}
    taw_dir = os.path.join(ROOT, 'lessons')
    for f in os.listdir(taw_dir):
        if f.startswith('tawheed-') and f.endswith('.html'):
            paths[f[:-5]] = os.path.join('lessons', f)
    for sub in ('hadith', 'adhkar', 'manners', 'seerah'):
        d = os.path.join(ROOT, 'lessons', sub)
        for f in os.listdir(d):
            if f.endswith('.html'):
                paths[f[:-5]] = os.path.join('lessons', sub, f)
    return paths


def page_label(pages):
    nums = [int(p.split('-')[1]) for p in pages]
    if len(nums) == 1:
        return 'p. %d' % nums[0]
    return 'pp. %d&ndash;%d' % (min(nums), max(nums))


def panel_html(rel_prefix, book_dir, pages):
    figs = []
    for p in pages:
        num = int(p.split('-')[1])
        src = '%simages/pdf/%s/%s.webp' % (rel_prefix, book_dir, p)
        figs.append(
            '                <figure class="tb-page">\n'
            '                    <img src="%s" alt="Textbook page %d" '
            'loading="lazy" tabindex="0" role="button" aria-label="Zoom textbook page %d">\n'
            '                    <figcaption>p. %d</figcaption>\n'
            '                </figure>' % (src, num, num, num))
    return (
        '\n        <details class="textbook-panel">\n'
        '            <summary><span class="tb-ico" aria-hidden="true">&#128214;</span>'
        '<span class="tb-title">From the Textbook</span>'
        '<span class="tb-range">%s</span></summary>\n'
        '            <div class="tb-pages">\n'
        '%s\n'
        '            </div>\n'
        '        </details>\n' % (page_label(pages), '\n'.join(figs)))


def main():
    mapping = json.load(io.open(MAP_PATH, encoding='utf-8'))
    book_dir = mapping['book']['pdf_dir']
    paths = build_lesson_paths()
    done = skipped = missing = 0
    for key, pages in sorted(mapping.items()):
        if key.startswith('_') or key == 'book' or not isinstance(pages, list):
            continue
        rel = paths.get(key)
        if not rel or not os.path.exists(os.path.join(ROOT, rel)):
            print('MISSING lesson file for %s' % key)
            missing += 1
            continue
        depth = rel.count(os.sep)
        rel_prefix = '../' * depth
        full = os.path.join(ROOT, rel)
        s = io.open(full, encoding='utf-8').read()
        if 'textbook-panel' in s:
            skipped += 1
            continue
        anchor = '<div class="lesson-block">'
        idx = s.find(anchor)
        if idx < 0:
            print('NO ANCHOR (.lesson-block) in %s' % rel)
            missing += 1
            continue
        block = panel_html(rel_prefix, book_dir, pages)
        s = s[:idx] + block + s[idx:]
        print('%-40s + %d page(s)' % (rel, len(pages)))
        if not DRY:
            io.open(full, 'w', encoding='utf-8', newline='').write(s)
        done += 1
    print('---')
    print('injected: %d, already-present: %d, problems: %d%s'
          % (done, skipped, missing, ' (dry-run)' if DRY else ''))


if __name__ == '__main__':
    main()
