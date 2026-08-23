#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""One-shot S0 cleanup migration.

1. Relabel stage chips: "Stage 0" -> "Pre-Stage" (Arabic unchanged).
2. Remove scanned-page images from all Pre-Stage pages:
   - hub hero background scans + hero <img> scans (Hadith/Adhkar/Manners/Seerah.png)
   - tawheed lesson/unit heroes (UNIT 1/2/3.png backgrounds + hero art imgs)
   - inline .lesson-image / .content-illustration scan blocks
   - assets/default-placeholder.jpg everywhere
   Heroes are rebuilt with the clean SVG-art pattern used by generated pages.

Run:  python scripts/remove_s0_images.py [--dry-run]
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DRY = '--dry-run' in sys.argv

# Same SVG art as generate_curriculum.py SUBJECT_SVG (kept in sync).
SVG = {
    'tawheed': ('<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="3" '
                'stroke-linejoin="round"><path d="M60 8 L74 34 L102 30 L92 56 L116 70 L88 80 '
                'L92 108 L64 98 L46 118 L38 90 L10 86 L28 64 L12 40 L42 42 Z"/>'
                '<circle cx="60" cy="62" r="16"/></svg>'),
    'hadith': ('<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="3" '
               'stroke-linecap="round" stroke-linejoin="round"><path d="M60 28 C48 18 30 16 14 20 '
               'V96 C30 92 48 94 60 104 C72 94 90 92 106 96 V20 C90 16 72 18 60  Z"/>'
               '<line x1="60" y1="28" x2="60" y2="104"/>'
               '<path d="M26 38 h22 M26 52 h22 M72 38 h22 M72 52 h22"/></svg>'),
    'seerah': ('<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="3" '
               'stroke-linecap="round" stroke-linejoin="round"><path d="M60 12 L60 24"/>'
               '<circle cx="60" cy="10" r="4"/><path d="M32 112 V64 a28 28 0 0 1 56 0 V112"/>'
               '<path d="M20 112 H100"/><rect x="52" y="84" width="16" height="28"/>'
               '<path d="M14 66 h10 M96 66 h10"/></svg>'),
    'adhkar': ('<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="3">'
               '<path d="M28 96 a44 44 0 1 1 64 0" stroke-linecap="round"/>'
               '<circle cx="28" cy="100" r="5"/><circle cx="43" cy="105" r="5"/>'
               '<circle cx="60" cy="107" r="6"/><circle cx="77" cy="105" r="5"/>'
               '<circle cx="92" cy="100" r="5"/></svg>'),
    'manners': ('<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="3" '
                'stroke-linecap="round"><circle cx="60" cy="66" r="34"/><circle cx="60" cy="66" '
                'r="22"/><path d="M22 22 v20 a8 8 0 0 0 16 0 V22 M30 22 v58"/><path d="M94 22 '
                'c-8 0 -10 12 -10 22 h10 z M94 22 v58"/></svg>'),
}


def art(key):
    return '<div class="lesson-hero-art" aria-hidden="true">%s</div>' % SVG[key]


LABEL_SUBS = [
    ('<span class="en">Stage 0</span>', '<span class="en">Pre-Stage</span>'),
    ('Stage 0 &middot;', 'Pre-Stage &middot;'),
]

RE_HERO_TAWHEED = re.compile(
    r'<header class="lesson-hero hero-bg-unit(\d)"[^>]*>\s*'
    r'<div class="lesson-hero-inner">\s*'
    r'(?:<div class="hero-illustration">\s*<img[^>]*>\s*</div>\s*)?',
    re.S)

RE_HERO_HUB = re.compile(
    r'<header class="lesson-hero hero-bg-cover"[^>]*>\s*<div class="lesson-hero-inner">\s*',
    re.S)

RE_HERO_PLACEHOLDER = re.compile(
    r'<header class="lesson-hero"[^>]*data-hero-img="[^"]*(?:default-placeholder|manner-\d)\.(?:jpg|svg)"[^>]*>\s*'
    r'<div class="lesson-hero-inner">\s*',
    re.S)

RE_HERO_ILLUS = re.compile(
    r'<div class="hero-illustration">\s*<img[^>]*>\s*</div>\s*', re.S)

RE_CONTENT_ILLUS = re.compile(
    r'<div class="content-illustration">\s*<img[^>]*>\s*</div>\s*', re.S)

RE_LESSON_IMAGE = re.compile(
    r'[ \t]*<div class="lesson-image[^"]*"[^>]*>\s*(?:</div>\s*)?<img[^>]*>\s*</div>\s*|\n?[ \t]*<div class="lesson-image[^"]*"[^>]*>\s*<img[^>]*>\s*</div>\s*',
    re.S)

RE_CAROUSEL = re.compile(
    r'\n?[ \t]*<div class="lesson-image[^"]*lesson-carousel"[^>]*>.*?</div>\s*\n(?=[ \t]*<div class="lesson-block")',
    re.S)

RE_UNIT_HERO_BG = re.compile(
    r'(<header class="unit-hero")[^>]*(style="background-image:[^"]*")[^>]*(>)')


def subject_of(rel):
    parts = rel.replace('\\', '/').lower()
    if 'tawheed' in parts:
        return 'tawheed'
    if 'hadith' in parts and 'adhkar' not in parts:
        return 'hadith'
    if 'seerah' in parts:
        return 'seerah'
    if 'manner' in parts:
        return 'manners'
    if 'adhkar' in parts:
        return 'adhkar'
    return 'tawheed'


def html_files():
    out = []
    for f in sorted(os.listdir(ROOT)):
        if f.endswith('.html'):
            out.append(f)
    lessons = os.path.join(ROOT, 'lessons')
    for dirp, _dirs, files in os.walk(lessons):
        for f in files:
            if f.endswith('.html'):
                out.append(os.path.relpath(os.path.join(dirp, f), ROOT))
    return out


def process(rel):
    path = os.path.join(ROOT, rel)
    s0 = io.open(path, encoding='utf-8').read()
    s = s0
    notes = []

    for old, new in LABEL_SUBS:
        n = s.count(old)
        if n:
            s = s.replace(old, new)
            notes.append('label x%d' % n)

    subj = subject_of(rel)
    base = os.path.basename(rel)

    # Tawheed lesson heroes (UNIT N.png) -> clean subj hero with SVG art
    def sub_tawheed(m):
        return ('<header class="lesson-hero subj-hero-%s">\n'
                '        <div class="lesson-hero-inner">\n        %s\n'
                % (subj, art(subj)))
    s, n = RE_HERO_TAWHEED.subn(sub_tawheed, s)
    if n:
        notes.append('tawheed hero x%d' % n)

    # Root hub heroes (big PNG bg) -> clean subj hero
    def sub_hub(m):
        return ('<header class="lesson-hero subj-hero-%s">\n'
                '        <div class="lesson-hero-inner">\n        %s\n'
                % (subj, art(subj)))
    s, n = RE_HERO_HUB.subn(sub_hub, s)
    if n:
        notes.append('hub hero x%d' % n)

    # Placeholder / manner-svg hero headers -> clean subj hero (keep chip row + h1)
    def sub_ph(m):
        return ('<header class="lesson-hero subj-hero-%s">\n'
                '        <div class="lesson-hero-inner">\n        %s\n'
                % (subj, art(subj)))
    s, n = RE_HERO_PLACEHOLDER.subn(sub_ph, s)
    if n:
        notes.append('placeholder hero x%d' % n)

    # Any leftover hero-illustration image blocks inside heroes
    s, n = RE_HERO_ILLUS.subn('', s)
    if n:
        notes.append('hero-illustration img x%d' % n)

    # content-illustration placeholder blocks after toggle bar
    s, n = RE_CONTENT_ILLUS.subn('', s)
    if n:
        notes.append('content-illustration img x%d' % n)

    # Inline lesson-image scan blocks (single img or carousel of imgs)
    def sub_lesson_image(m):
        block = m.group(0)
        return '' if '<img' in block else block
    s, n = RE_LESSON_IMAGE.subn(sub_lesson_image, s)
    if n:
        notes.append('lesson-image scan x%d' % n)

    # Carousel scan blocks (multi-img)
    s, n = RE_CAROUSEL.subn('', s)
    if n:
        notes.append('carousel scan x%d' % n)

    # Unit landing hero background scans
    s, n = RE_UNIT_HERO_BG.subn(r'\1\3', s)
    if n:
        notes.append('unit-hero bg x%d' % n)

    if s != s0:
        print('%-46s %s' % (rel, ', '.join(notes)))
        if not DRY:
            io.open(path, 'w', encoding='utf-8', newline='').write(s)
        return 1
    return 0


def main():
    changed = 0
    for rel in html_files():
        # index.html has no S0 images/chips; skip early to keep output tight
        if rel == 'index.html':
            continue
        changed += process(rel)
    print('---')
    print('files updated:', changed, '(dry-run)' if DRY else '')


if __name__ == '__main__':
    main()
