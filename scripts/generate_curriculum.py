#!/usr/bin/env python3
"""Generate curriculum pages from data/curriculum/*.json.

Outputs:
  - lessons/<stage>-<subject>/<lesson>.html   (one per lesson/review)
  - stage-<n>.html                            (stage hub page)

Deterministic: re-running produces byte-identical output.
HTML files are OUTPUT ONLY - edit data JSON, never the generated pages.
"""
import io
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, 'data', 'curriculum')
LESSONS_DIR = os.path.join(ROOT, 'lessons')

FONT_LINK = ('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900'
             '&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Amiri:wght@400;700'
             '&family=Scheherazade+New:wght@400;700&family=Lateef&display=swap')

DARK_SCRIPT = ('<script>!function(){try{if(localStorage.getItem("dark-mode")==="true")'
               '{document.documentElement.setAttribute("data-theme","dark")}}catch(e){}}()</script>')


def esc(s):
    return str(s).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def p(text):
    return '<p>%s</p>' % esc(text)


def head(title, prefix):
    return f"""<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    {DARK_SCRIPT}
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{esc(title)} | SiratKids</title>
    <link rel="stylesheet" href="{prefix}css/style.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="{FONT_LINK}" rel="stylesheet">
</head>
<body class="disable-onload-animations">
"""


def navbar(prefix, show_toggle=True):
    toggle_html = """<button class="sidebar-toggle-btn" aria-label="Toggle sidebar">
                <svg class="icon-sidebar-open" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="3"/>
                    <line x1="7" y1="2" x2="7" y2="22"/>
                </svg>
                <svg class="icon-sidebar-closed" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none">
                    <rect x="2" y="2" width="20" height="20" rx="3"/>
                    <line x1="7" y1="2" x2="7" y2="22"/>
                    <path d="M7,2 L5,2 A3,3 0 0,1 2,5 L2,19 A3,3 0 0,1 5,22 L7,22 Z" fill="currentColor" stroke="none"/>
                </svg>
            </button>""" if show_toggle else ''
    return f"""<nav class="navbar">
        <div class="nav-left">
            {toggle_html}<a href="{prefix}index.html" class="nav-logo">
                <img src="{prefix}images/logo.png" alt="SiratKids logo" class="nav-logo-img">
                <span class="nav-brand">SiratKids</span>
            </a>
        </div>
        <div class="nav-links">
            <a href="{prefix}index.html">Home</a>
            <a href="{prefix}quran-reader.html">Quran</a>
            <button class="dm-toggle" aria-label="Toggle dark mode">
                <svg class="dm-icon-moon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                <svg class="dm-icon-sun" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            </button>
            <div class="settings-dropdown">
                <button class="settings-toggle-btn" aria-label="Settings">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                </button>
                <div class="settings-dropdown-content">
                    <div class="settings-dropdown-item">
                        <label class="font-switcher-label" for="arabic-font">Arabic Script</label>
                        <select id="arabic-font">
                            <option value="nastaleeq" selected>Indopak Nastaleeq</option>
                            <option value="naskh">Noto Naskh</option>
                            <option value="amiri">Amiri</option>
                            <option value="scheherazade">Scheherazade New</option>
                            <option value="lateef">Lateef</option>
                        </select>
                    </div>
                    <div class="settings-dropdown-divider"></div>
                    <div class="settings-dropdown-item">
                        <span class="settings-label">English Size</span>
                        <div class="font-size-group"></div>
                    </div>
                    <div class="settings-dropdown-item">
                        <span class="settings-label">Arabic Size</span>
                        <div class="font-size-group"></div>
                    </div>
                </div>
            </div>
        </div>
    </nav>
"""


TOGGLE_BAR = """<div class="toggle-bar">
            <button class="translation-toggle" data-toggle="translation" data-on="English ON" data-off="English OFF"><span class="toggle-track"><span class="toggle-knob"></span></span><span class="toggle-label">English ON</span></button>
            <button class="translation-toggle" data-toggle="tamil" data-on="Tamil ON" data-off="Tamil OFF"><span class="toggle-track"><span class="toggle-knob"></span></span><span class="toggle-label">Tamil OFF</span></button>
            <button class="translation-toggle" data-toggle="transliteration" data-on="Transliteration ON" data-off="Transliteration OFF"><span class="toggle-track"><span class="toggle-knob"></span></span><span class="toggle-label">Transliteration OFF</span></button>
        </div>
"""


_PAGE_MAPS = {}


def page_map_for(stage):
    if stage not in _PAGE_MAPS:
        path = os.path.join(ROOT, 'data', 's%d_page_map.json' % stage)
        _PAGE_MAPS[stage] = json.load(io.open(path, encoding='utf-8')) if os.path.exists(path) else {}
    return _PAGE_MAPS[stage]


def s0_page_map():
    if 0 not in _PAGE_MAPS:
        path = os.path.join(ROOT, 'data', 's0_page_map.json')
        _PAGE_MAPS[0] = json.load(io.open(path, encoding='utf-8')) if os.path.exists(path) else {}
    return _PAGE_MAPS[0]


def textbook_panel_html(lesson_key, prefix, stage=0):
    m = page_map_for(stage) or s0_page_map()
    pages = m.get(lesson_key)
    if not pages:
        return ''
    book_dir = m.get('book', {}).get('pdf_dir', 'pre')
    figs = []
    for p in pages:
        num = int(p.split('-')[1])
        src = '%simages/pdf/%s/%s.webp' % (prefix, book_dir, p)
        figs.append(
            '<figure class="tb-page">'
            '<img src="%s" alt="Textbook page %d" loading="lazy" tabindex="0" '
            'role="button" aria-label="Zoom textbook page %d">'
            '<figcaption>p. %d</figcaption></figure>' % (src, num, num, num))
    nums = [int(p.split('-')[1]) for p in pages]
    rng = ('p. %d' % nums[0]) if len(nums) == 1 else ('pp. %d&ndash;%d' % (min(nums), max(nums)))
    return (
        '<details class="textbook-panel">\n'
        '            <summary><span class="tb-ico" aria-hidden="true">&#128214;</span>'
        '<span class="tb-title">From the Textbook</span>'
        '<span class="tb-range">%s</span></summary>\n'
        '            <div class="tb-pages">%s</div>\n'
        '        </details>\n' % (rng, ''.join(figs)))


AUDIO_PLAYER = """<div class="audio-player">
            <div class="audio-player-title">Listen in Arabic</div>
            <button class="audio-play-btn" aria-label="Play all Arabic audio">
                <svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
            </button>
            <div class="audio-status">Tap to play all</div>
            <div class="audio-text-preview"></div>
            <div class="audio-speed-select-wrap">
                <label class="audio-speed-label" for="audio-speed">Speed</label>
                <select class="audio-speed-select" id="audio-speed" name="audio-speed">
                    <option value="0.5">0.5x</option>
                    <option value="0.75">0.75x</option>
                    <option value="1" selected>1x</option>
                    <option value="1.5">1.5x</option>
                    <option value="2">2x</option>
                </select>
            </div>
        </div>
"""


def subject_hero_art(key):
    return SUBJECT_SVG.get(key, SUBJECT_SVG['default'])


FOOTER = """<footer class="footer">
        <p>&copy; 2026 SiratKids. All rights reserved.</p>
    </footer>
"""


def block_html(b):
    t = b.get('type', 'text')
    ar = esc(b['ar'])
    if t == 'ayah':
        ar = ar.replace('&amp;#65079;', '').replace('&amp;#65080;', '')
        ar = ar.replace('&#65079;', '').replace('&#65080;', '')
        if not ar.startswith('\ufd3f'):
            ar = '\ufd3f' + ar + '\ufd3e'
        ref = b.get('ref', '')
        ref_html = '<div class="block-ref"><span class="ar" dir="rtl">%s</span></div>' % esc(ref)
    else:
        ref_html = ''
    if t == 'hadith':
        r = b.get('ref') or {}
        src = '%s %s' % (r.get('collection', ''), r.get('number', ''))
        url = r.get('url')
        chip = ('<a class="block-ref hadith-ref" href="%s" target="_blank" rel="noopener">%s</a>'
                % (esc(url), esc(src))) if url else '<span class="block-ref hadith-ref">%s</span>' % esc(src)
    else:
        chip = ''
    lines = ['<div class="lesson-block">']
    lines.append('<div class="ar" dir="rtl">%s</div>' % p(ar))
    if str(b.get('tr', '')).strip():
        lines.append('<div class="transliteration">%s</div>' % p(esc(b['tr'])))
    if str(b.get('en', '')).strip():
        en = esc(b['en']).replace('\n', '<br>')
        lines.append('<div class="en translation">%s</div>' % p(en))
    if str(b.get('ta', '')).strip():
        ta = esc(b['ta']).replace('\n', '<br>')
        lines.append('<div class="tamil">%s</div>' % p(ta))
    if ref_html:
        lines.append(ref_html)
    if chip:
        lines.append(chip)
    lines.append('</div>')
    return '\n'.join(lines)


def stage_label(num):
    return 'Pre-Stage' if num == 0 else ('Stage %d' % num)


def stage_chip_html(stage):
    st = stage['titles']
    return ('<span class="stage-chip"><span class="en">%s</span>'
            '<span class="sep">&middot;</span>'
            '<span class="ar" dir="rtl">%s</span></span>'
            % (esc(stage_label(stage['stage'])), esc(st.get('ar', ''))))


def sidebar(units, active_file, prefix, hub_href, stage_href, subject_title):
    out = ['<aside class="sidenav-with-history-container content-loaded">',
           '        <div class="sidenav-inner">',
           '<div class="sidebar-title">%s</div>' % esc(subject_title['en'])]
    n = 0
    for u in units:
        ut = u['title']
        out.append('            <div class="sidebar-unit">')
        out.append('                <a href="%s" class="sidebar-unit-label">Unit %d: %s</a>'
                   % (hub_href, u['no'], esc(ut['en'])))
        for l in u['lessons']:
            n += 1
            act = ' active' if l['file'] == active_file else ''
            num_act = ' active' if l['file'] == active_file else ''
            kind = ' (Q)' if l.get('kind') == 'review' else ''
            out.append('                <a href="%s.html" class="sidebar-lesson%s">'
                       '<span class="sidebar-lesson-num%s">%d</span>%s%s</a>'
                       % (esc(l['file']), act, num_act, n, esc(l['title']['en']), kind))
        out.append('            </div>')
    out += ['        </div>', '    </aside>']
    return '\n'.join(out)


def lesson_page(stage, subject, unit, lesson, flat, idx):
    st, su = stage['titles'], subject['title']
    lt = lesson['title']
    prefix = '../../'
    stage_href = '../../stage-%d.html' % stage['stage']
    hub_href = '../../stage-%d-%s.html' % (stage['stage'], subject['key'])
    prev_href = flat[idx - 1]['file'] if idx > 0 else None
    next_href = flat[idx + 1]['file'] if idx < len(flat) - 1 else None
    nav_l = ('<a href="%s.html" class="lesson-nav-prev">&#8592; Previous</a>' % esc(prev_href)) if prev_href else '<span></span>'
    nav_r = ('<a href="%s.html" class="lesson-nav-next">Next &#8594;</a>' % esc(next_href)) if next_href else '<span></span>'
    unit_label = 'Unit %d' % unit['no'] if lesson.get('kind') != 'review' else 'Unit %d Review' % unit['no']
    body_blocks = '\n'.join(block_html(b) for b in lesson['blocks'])
    media = ''
    m = lesson.get('media')
    if m and (m.get('image') or m.get('video')):
        fig = []
        if m.get('video'):
            fig.append('<div class="lesson-media-video"><iframe src="%s" title="%s" '
                       'allowfullscreen loading="lazy"></iframe></div>'
                       % (esc(m['video']), esc(lt['en'])))
        elif m.get('image'):
            fig.append('<img class="lesson-media-img" src="%s" alt="" loading="lazy">' % esc(m['image']))
        cap_en = m.get('caption_en') or lt['en']
        cap_ar = m.get('caption_ar') or ''
        fig.append('<figcaption><span class="en">%s</span>%s</figcaption>'
                   % (esc(cap_en),
                      ('<span class="ar" dir="rtl">%s</span>' % esc(cap_ar)) if cap_ar else ''))
        media = '<figure class="lesson-media">%s</figure>' % ''.join(fig)
    return f"""{head('%s - %s' % (lt['en'], su['en']), prefix)}{navbar(prefix)}
    {sidebar(subject['units'], lesson['file'], prefix, hub_href, stage_href, su)}

    <div class="page-content-wrapper">

    <nav aria-label="Breadcrumb"><div class="breadcrumb">
        <a href="{prefix}index.html">Home</a>
        <span class="sep">&#9657;</span>
        <a href="../../stage-{stage['stage']}.html">{esc(st['en'])}</a>
        <span class="sep">&#9657;</span>
        <a href="{esc(hub_href)}">{esc(su['en'])}</a>
        <span class="sep">&#9657;</span>
        <span class="current" aria-current="page">{esc(lt['en'])}</span>
    </div></nav>

    <header class="lesson-hero subj-hero-{esc(subject['key'])}">
        <div class="lesson-hero-art" aria-hidden="true">{SUBJECT_SVG.get(subject['key'], SUBJECT_SVG['default'])}</div>
        <div class="lesson-hero-inner">
            <p class="lesson-unit">{stage_chip_html(stage)}<span class="lesson-unit-chip">{SUBJECT_ICONS.get(subject['key'], '&#11088;')} {esc(unit_label)}</span></p>
            <h1 class="lesson-title">
                <span class="ar" dir="rtl">{esc(lt['ar'])}</span>
                <span class="en">{esc(lt['en'])}</span>
            </h1>
        </div>
    </header>

    <div class="lesson-layout">

    <main class="lesson-main">
        {TOGGLE_BAR}
{textbook_panel_html(lesson['file'], '../../', stage['stage'])}
{body_blocks}

        <div class="lesson-nav">
            {nav_l}
            {nav_r}
        </div>
        <div class="lesson-back-row">
            <a class="btn-back-lg" href="{esc(hub_href)}">&#8592; Back to Units</a>
            <a class="btn-back-lg btn-back-alt" href="{esc(stage_href)}">&#8592; Back to Subjects</a>
        </div>
    </main>
    <aside class="lesson-aside">
        {media}
        {AUDIO_PLAYER}
    </aside>
    </div>

    </div>

    {FOOTER}
    <script src="{prefix}js/main.js"></script>
</body>
</html>
"""


SUBJECT_ICONS = {
    'tawheed': '&#11088;',
    'fiqh': '&#128167;',
    'hadith': '&#128214;',
    'seerah': '&#128220;',
    'adhkar': '&#128172;',
}


SUBJECT_SVG = {
    'tawheed': ('<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="3" '
                'stroke-linejoin="round"><path d="M60 8 L74 34 L102 30 L92 56 L116 70 L88 80 '
                'L92 108 L64 98 L46 118 L38 90 L10 86 L28 64 L12 40 L42 42 Z"/>'
                '<circle cx="60" cy="62" r="16"/></svg>'),
    'fiqh': ('<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="3" '
             'stroke-linecap="round"><path d="M60 10 C60 10 24 54 24 78 a36 36 0 0 0 72 0 '
             'C96 54 60 10 60 10 Z"/><path d="M44 82 a18 18 0 0 0 14 16"/></svg>'),
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
    'default': ('<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="3" '
                'stroke-linecap="round"><circle cx="60" cy="60" r="44"/><path d="M60 24 v72 '
                'M24 60 h72 M35 35 l50 50 M85 35 l-50 50"/></svg>'),
}


def stage_hero_art(key):
    return SUBJECT_SVG.get(key, SUBJECT_SVG['default'])


def stage_page(stage, subjects_for_stage):
    st = stage['titles']
    sn = stage['stage']
    tiles = []
    for subj in subjects_for_stage:
        n_units = len(subj['units'])
        n_lessons = sum(len(u['lessons']) for u in subj['units'])
        icon = SUBJECT_ICONS.get(subj['key'], '&#11088;')
        tiles.append(
            '<a class="subject-tile tile-%s" href="stage-%d-%s.html">'
            '<span class="subject-tile-icon">%s</span>'
            '<span class="subject-title"><span class="en">%s</span>'
            '<span class="ar" dir="rtl">%s</span></span>'
            '<span class="subject-meta">%d %s &middot; %d lessons</span>'
            '<span class="subject-open">Browse lessons &#9656;</span>'
            '</a>'
            % (esc(subj['key']), sn, esc(subj['key']), icon,
               esc(subj['title']['en']), esc(subj['title']['ar']),
               n_units, 'unit' if n_units == 1 else 'units', n_lessons))
    empty_note = ('<p class="stages-intro">Lessons for this stage are being prepared '
                  'and will appear here soon, in sha Allah.</p>') if not tiles else ''
    return f"""{head(st['en'], '')}{navbar('', show_toggle=False)}
    <div class="page-content-wrapper no-sidebar">

    <nav aria-label="Breadcrumb"><div class="breadcrumb">
        <a href="index.html">Home</a>
        <span class="sep">&#9657;</span>
        <span class="current" aria-current="page">{esc(st['en'])}</span>
    </div></nav>

    <header class="lesson-hero stage-hero">
        <div class="lesson-hero-art" aria-hidden="true">{stage_hero_art('default')}</div>
        <div class="lesson-hero-inner">
            <p class="lesson-unit"><span class="lesson-unit-chip">&#127793; {esc(st.get('age_en', ''))}</span></p>
            <h1 class="lesson-title">
                <span class="ar" dir="rtl">{esc(st['ar'])}</span>
                <span class="en">{esc(st['en'])}</span>
            </h1>
        </div>
    </header>

    <p class="stages-intro">Choose a subject to see its units and lessons.</p>
    <div class="subject-tiles-grid">
{''.join(tiles)}
    </div>
{empty_note}
    </div>

    {FOOTER}
    <script src="js/main.js"></script>
</body>
</html>
"""


def subject_page(stage, subj):
    st, su = stage['titles'], subj['title']
    sn = stage['stage']
    sdir = '%d-%s' % (sn, subj['key'])
    stage_href = 'stage-%d.html' % sn
    icon = SUBJECT_ICONS.get(subj['key'], '&#11088;')
    n_units = len(subj['units'])
    unit_cards = []
    for u in subj['units']:
        first = u['lessons'][0]
        first_href = first.get('href') or 'lessons/%s/%s.html' % (sdir, first['file'])
        n = len([l for l in u['lessons'] if l.get('kind') != 'review'])
        unit_cards.append(
            '<a class="unit-card-link" href="%s">'
            '<section class="unit-card unit-hue-%d">'
            '<header class="unit-card-head">'
            '<span class="unit-card-num">%d</span>'
            '<div class="unit-card-titles"><h2 class="en">Unit %d &middot; %s</h2>'
            '<p class="ar" dir="rtl">%s</p></div>'
            '</header>'
            '<footer class="unit-card-foot"><span class="unit-card-stage">%s &middot; %s</span>'
            '<span>%d lessons</span>'
            '<span class="unit-open">Start Unit &#9656;</span></footer>'
            '</section></a>'
            % (esc(first_href), ((u['no'] - 1) % 5) + 1, u['no'], u['no'],
               esc(u['title']['en']), esc(u['title'].get('ar', '')),
               esc(stage_label(sn)), esc(st.get('ar', '')), n))
    back_row = ('<div class="lesson-back-row">'
                '<a class="btn-back-lg" href="%s">&#8592; Back to Subjects</a>'
                '</div>' % esc(stage_href))
    return f"""{head('%s - %s' % (su['en'], st['en']), '')}{navbar('', show_toggle=False)}
    <div class="page-content-wrapper no-sidebar">

    <nav aria-label="Breadcrumb"><div class="breadcrumb">
        <a href="index.html">Home</a>
        <span class="sep">&#9657;</span>
        <a href="{stage_href}">{esc(st['en'])}</a>
        <span class="sep">&#9657;</span>
        <span class="current" aria-current="page">{esc(su['en'])}</span>
    </div></nav>

    <header class="lesson-hero subject-hero subj-hero-{esc(subj['key'])}">
        <div class="lesson-hero-art" aria-hidden="true">{stage_hero_art(subj['key'])}</div>
        <div class="lesson-hero-inner">
            <p class="lesson-unit">{stage_chip_html(stage)}<span class="lesson-unit-chip">{icon} {n_units} {'unit' if n_units == 1 else 'units'}</span></p>
            <h1 class="lesson-title">
                <span class="ar" dir="rtl">{esc(su['ar'])}</span>
                <span class="en">{esc(su['en'])}</span>
            </h1>
        </div>
    </header>

    <div class="unit-cards-grid">
{''.join(unit_cards)}
    </div>
{back_row}
    </div>

    {FOOTER}
    <script src="js/main.js"></script>
</body>
</html>
"""


def load_stage(path):
    return json.load(io.open(path, encoding='utf-8'))


def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    io.open(path, 'w', encoding='utf-8', newline='\n').write(content)


def main():
    files = sorted(f for f in os.listdir(DATA_DIR) if f.endswith('.json'))
    total_lessons = 0
    seen_stages = set()
    for fname in files:
        stage = load_stage(os.path.join(DATA_DIR, fname))
        sn = stage['stage']
        seen_stages.add(sn)
        all_subjects = []
        for subj in stage['subjects']:
            all_subjects.append(subj)
            sdir = '%d-%s' % (sn, subj['key'])
            flat = [l for u in subj['units'] for l in u['lessons']]
            idx = 0
            written = 0
            for u in subj['units']:
                for l in u['lessons']:
                    if 'href' in l:
                        idx += 1
                        continue
                    html = lesson_page(stage, subj, u, l, flat, idx)
                    write_file(os.path.join(LESSONS_DIR, sdir, l['file'] + '.html'), html)
                    written += 1
                    idx += 1
            linked = len(flat) - written
            print('[ok] %d-%s: %d lesson pages (%d external links)' % (sn, subj['key'], written, linked))
            total_lessons += len(flat)
            write_file(os.path.join(ROOT, 'stage-%d-%s.html' % (sn, subj['key'])),
                       subject_page(stage, subj))
            print('[ok] stage-%d-%s.html' % (sn, subj['key']))
        write_file(os.path.join(ROOT, 'stage-%d.html' % sn), stage_page(stage, all_subjects))
        print('[ok] stage-%d.html' % sn)
    placeholders = {
        2: {'stage': 2, 'titles': {'en': 'Stage Two', 'ar': 'المرحلة الثانية', 'age_en': 'Ages 7-8 years'}},
        3: {'stage': 3, 'titles': {'en': 'Stage Three', 'ar': 'المرحلة الثالثة', 'age_en': 'Ages 8-9 years'}},
        4: {'stage': 4, 'titles': {'en': 'Stage Four', 'ar': 'المرحلة الرابعة', 'age_en': 'Ages 9-10 years'}},
    }
    for sn, meta in sorted(placeholders.items()):
        if sn not in seen_stages:
            write_file(os.path.join(ROOT, 'stage-%d.html' % sn), stage_page(meta, []))
            print('[ok] stage-%d.html (placeholder)' % sn)
    print('DONE | lesson entries:', total_lessons)


if __name__ == '__main__':
    main()

