import glob
import re
import os

PLAYER_HTML = '''
        <div class="audio-player">
            <div class="audio-player-title">Listen in Arabic</div>
            <button class="audio-play-btn" aria-label="Play all Arabic audio">
                <svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
            </button>
            <div class="audio-status">Tap to play all</div>
            <div class="audio-text-preview"></div>
            <div class="audio-speed-group">
                <label class="speed-pill"><input type="radio" name="audio-speed" value="0.5">0.5x</label>
                <label class="speed-pill"><input type="radio" name="audio-speed" value="0.75">0.75x</label>
                <label class="speed-pill active"><input type="radio" name="audio-speed" value="1" checked>1x</label>
                <label class="speed-pill"><input type="radio" name="audio-speed" value="1.5">1.5x</label>
                <label class="speed-pill"><input type="radio" name="audio-speed" value="2">2x</label>
            </div>
        </div>'''

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
patterns = [
    os.path.join(root, 'lessons', '**', '*.html'),
]
html_files = []
for p in patterns:
    html_files.extend(glob.glob(p, recursive=True))

for f in glob.glob(os.path.join(root, '*.html')):
    with open(f, encoding='utf-8') as fh:
        if 'lesson-aside' in fh.read():
            html_files.append(f)

count = 0
skipped = 0
for fpath in html_files:
    with open(fpath, encoding='utf-8') as f:
        content = f.read()

    if 'lesson-aside' not in content:
        skipped += 1
        continue

    old_pattern = r'(<aside class="lesson-aside">.*?</aside>)'
    old_match = re.search(old_pattern, content, re.DOTALL)
    if not old_match:
        skipped += 1
        continue

    old_aside = old_match.group(0)

    new_aside = '''<aside class="lesson-aside">
            <div class="search-box">
                <span class="search-icon">\U0001f50d</span>
                <input type="text" id="quran-search" placeholder="Search in Quran" dir="auto" autocomplete="off">
                <div class="search-results" id="search-results"></div>
            </div>
''' + PLAYER_HTML + '''
        </aside>'''

    content = content.replace(old_aside, new_aside)

    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)

    count += 1
    rel = os.path.relpath(fpath, root)
    print(f'  [OK] {rel}')

print(f'\nDone: {count} files updated, {skipped} skipped')
