"""
Transform all HTML files to the new design:
- New navbar with sidebar-toggle-btn + settings-dropdown
- Pinned sidenav-with-history-container (extracted from lesson-sidebar)
- page-content-wrapper around breadcrumb through footer
- Remove Quran search boxes
- Replace speed pills with select dropdown
- Add disable-onload-animations to body
"""
import re
import os
import glob

NEW_NAVBAR = """    <nav class="navbar">
        <div class="nav-left">
            <button class="sidebar-toggle-btn" aria-label="Toggle sidebar">
                <svg class="icon-sidebar-open" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <line x1="3" y1="12" x2="21" y2="12"/>
                    <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
                <svg class="icon-sidebar-closed" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="display:none">
                    <polyline points="15 18 9 12 15 6"/>
                </svg>
            </button>
            <a href="{p}index.html" class="nav-logo">
                <img src="{p}images/logo.svg" alt="SiratKids logo" class="nav-logo-img">
                <span class="nav-brand">SiratKids</span>
            </a>
        </div>
        <div class="nav-links">
            <a href="{p}index.html">Home</a>
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
                            <option value="naskh">Noto Naskh</option>
                            <option value="nastaleeq">Indopak Nastaleeq</option>
                            <option value="amiri">Amiri</option>
                            <option value="scheherazade">Scheherazade New</option>
                            <option value="lateef">Lateef</option>
                        </select>
                    </div>
                    <div class="settings-dropdown-divider"></div>
                    <div class="settings-dropdown-item">
                        <span class="settings-label">English Size</span>
                        <div class="font-size-group">
                            <button class="font-size-btn" id="en-font-size-down">A-</button>
                            <span class="font-size-label" id="en-font-size-label">100%</span>
                            <button class="font-size-btn" id="en-font-size-up">A+</button>
                        </div>
                    </div>
                    <div class="settings-dropdown-item">
                        <span class="settings-label">Arabic Size</span>
                        <div class="font-size-group">
                            <button class="font-size-btn" id="ar-font-size-down">A-</button>
                            <span class="font-size-label" id="ar-font-size-label">100%</span>
                            <button class="font-size-btn" id="ar-font-size-up">A+</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </nav>"""

SPEED_SELECT = """            <div class="audio-speed-select-wrap">
                <label class="audio-speed-label" for="audio-speed">Speed</label>
                <select class="audio-speed-select" id="audio-speed" name="audio-speed">
                    <option value="0.5">0.5x</option>
                    <option value="0.75">0.75x</option>
                    <option value="1" selected>1x</option>
                    <option value="1.5">1.5x</option>
                    <option value="2">2x</option>
                </select>
            </div>"""


def extract_between(content, start_tag, end_tag):
    """Extract content between two tags (inclusive of start, exclusive of end)."""
    s = content.find(start_tag)
    e = content.find(end_tag, s + len(start_tag))
    if s == -1 or e == -1:
        return None, -1, -1
    return content[s:e], s, e


def get_prefix(filepath):
    rel = os.path.relpath(filepath, os.getcwd()).replace('\\', '/')
    depth = rel.count('/')
    if depth == 0:
        return ''
    return '../' * depth


def transform_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'sidenav-with-history-container' in content:
        print(f"  SKIP (already done): {os.path.basename(filepath)}")
        return False

    prefix = get_prefix(filepath)

    # 1. Add disable-onload-animations to body
    content = content.replace('<body>', '<body class="disable-onload-animations">', 1)

    # 2. Replace navbar
    new_navbar = NEW_NAVBAR.replace('{p}', prefix)
    nav_match = re.search(r'    <nav class="navbar">.*?    </nav>', content, re.DOTALL)
    if nav_match:
        content = content[:nav_match.start()] + new_navbar + content[nav_match.end():]
    else:
        print(f"  WARN: no navbar in {filepath}")
        return False

    # 3. Extract sidebar inner from lesson-sidebar, remove old toggle button
    sidebar_match = re.search(
        r'<aside class="lesson-sidebar">\s*<button class="sidebar-toggle"[^>]*>.*?</button>\s*(.*?)\s*</aside>',
        content, re.DOTALL
    )
    if not sidebar_match:
        print(f"  WARN: no lesson-sidebar in {filepath}")
        return False

    sidebar_inner = sidebar_match.group(1)
    sidebar_start = sidebar_match.start()
    sidebar_end = sidebar_match.end()

    # 4. Remove the entire lesson-sidebar aside
    content = content[:sidebar_start] + content[sidebar_end:]

    # 5. Remove search box from lesson-aside (matches outer + inner closing divs)
    content = re.sub(
        r'\s*<div class="search-box">.*?</div>\s*</div>',
        '', content, flags=re.DOTALL
    )

    # 6. Replace speed pills with select dropdown
    content = re.sub(
        r'<div class="audio-speed-group">.*?</div>',
        SPEED_SELECT, content, flags=re.DOTALL
    )

    # 7. Insert sidenav before breadcrumb, wrap everything in page-content-wrapper
    breadcrumb_marker = '    <div class="breadcrumb">'
    bc_pos = content.find(breadcrumb_marker)
    if bc_pos == -1:
        print(f"  WARN: no breadcrumb in {filepath}")
        return False

    sidenav_html = (
        '    <aside class="sidenav-with-history-container content-loaded collapsed">\n'
        '        <div class="sidenav-inner">\n'
        + sidebar_inner +
        '\n        </div>\n'
        '    </aside>\n\n'
    )

    # Insert sidenav before breadcrumb
    content = content[:bc_pos] + sidenav_html + content[bc_pos:]

    # Open page-content-wrapper before breadcrumb
    content = content.replace(
        sidenav_html + breadcrumb_marker,
        sidenav_html + '    <div class="page-content-wrapper">\n\n' + breadcrumb_marker
    )

    # Close page-content-wrapper before footer
    content = content.replace(
        '    <footer class="footer">',
        '    </div>\n\n    <footer class="footer">'
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"  DONE: {os.path.basename(filepath)}")
    return True


def main():
    base = os.getcwd()
    files = []

    for name in ['manners.html', 'adhkar.html', 'seerah.html']:
        fp = os.path.join(base, name)
        if os.path.exists(fp):
            files.append(fp)

    for subject in ['hadith', 'manners', 'adhkar', 'seerah']:
        files.extend(sorted(glob.glob(os.path.join(base, 'lessons', subject, '*.html'))))

    # Tawheed unit pages (lessons/tawheed/unit*.html)
    files.extend(sorted(glob.glob(os.path.join(base, 'lessons', 'tawheed', '*.html'))))

    # Tawheed individual lessons (lessons/tawheed-*.html, directly in lessons/)
    files.extend(sorted(glob.glob(os.path.join(base, 'lessons', 'tawheed-*.html'))))

    print(f"Found {len(files)} files to transform\n")

    count = 0
    for fp in files:
        if transform_file(fp):
            count += 1

    print(f"\nDone! Transformed {count}/{len(files)} files.")


if __name__ == '__main__':
    main()
