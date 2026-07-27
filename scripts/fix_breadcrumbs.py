"""Breadcrumb audit fixes: B (tawheed link), A (crumb text), C (accessibility)."""
import re, os, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Fix A: Crumb text mapping  (file_glob, old_current_text, new_current_text)
# We match <span class="current">OLD</span> inside breadcrumb blocks only
FIX_A_MAP = {
    # hadith: bare numbers → "Hadith N"
    **{f"lessons/hadith/hadith-{i}.html": (str(i), f"Hadith {i}") for i in range(1, 27)},
    # manners: bare numbers → "Manners N"
    **{f"lessons/manners/manner-{i}.html": (str(i), f"Manners {i}") for i in range(1, 6)},
    # adhkar: titles/ truncated → "Adhkar N"
    **{f"lessons/adhkar/adhkar-{i}.html": (None, f"Adhkar {i}") for i in range(1, 12)},
    # seerah: titles/ truncated → "Seerah N"
    **{f"lessons/seerah/seerah-{i}.html": (None, f"Seerah {i}") for i in range(1, 4)},
    # tawheed lessons: titles → "Tawheed X-Y"
    **{f"lessons/tawheed-{i}-{j}.html": (None, f"Tawheed {i}-{j}")
       for i in range(1, 4) for j in range(1, {1: 5, 2: 4, 3: 4}[i] + 1)},
}

# Files with tawheed unit breadcrumbs (Fix B)
TAWHEED_UNITS = [
    "lessons/tawheed/unit1.html",
    "lessons/tawheed/unit2.html",
    "lessons/tawheed/unit3.html",
]

# All files with breadcrumbs (Fix C) — everything except index.html
ALL_BREADCRUMB_FILES = []

def find_breadcrumb_block(lines, start_idx):
    """Given the line index of <div class="breadcrumb">, return (start, end) line indices
    of the full breadcrumb block (inclusive)."""
    # Could be single-line: <div class="breadcrumb">...</div> on one line
    if '</div>' in lines[start_idx] and 'class="breadcrumb"' in lines[start_idx]:
        return (start_idx, start_idx)
    # Multi-line: find closing </div>
    for i in range(start_idx + 1, min(start_idx + 15, len(lines))):
        if '</div>' in lines[i]:
            return (start_idx, i)
    return (start_idx, start_idx)

def apply_fix_b(content):
    """Replace <a href="unit1.html">Tawheed</a> with <span>Tawheed</span> in breadcrumb blocks."""
    # Match the breadcrumb block (multi-line or single-line) containing the link
    # Multi-line pattern
    content = re.sub(
        r'(<div class="breadcrumb">.*?)(<a href="unit1\.html">Tawheed</a>)(.*?</div>)',
        lambda m: m.group(1) + '<span>Tawheed</span>' + m.group(3),
        content,
        count=1,
        flags=re.DOTALL
    )
    return content

def apply_fix_a(content, old_text, new_text):
    """Replace <span class="current">OLD</span> with <span class="current">NEW</span> in breadcrumb blocks."""
    if old_text is None:
        # Match any current span content (for adhkar/seerah/tawheed lessons)
        # We need to be careful to only match within breadcrumb blocks
        # Strategy: find breadcrumb block, then replace within it
        def replace_in_breadcrumb(m):
            block = m.group(0)
            return re.sub(
                r'<span class="current">[^<]*</span>',
                f'<span class="current">{new_text}</span>',
                block,
                count=1
            )
        content = re.sub(
            r'<div class="breadcrumb">.*?</div>',
            replace_in_breadcrumb,
            content,
            count=1,
            flags=re.DOTALL
        )
    else:
        # Exact match (hadith/manners bare numbers)
        def make_replacer(n):
            def replacer(m):
                return re.sub(
                    r'<span class="current">[^<]*</span>',
                    f'<span class="current">{n}</span>',
                    m.group(0),
                    count=1
                )
            return replacer
        content = re.sub(
            r'<div class="breadcrumb">.*?</div>',
            make_replacer(new_text),
            content,
            count=1,
            flags=re.DOTALL
        )
    return content

def apply_fix_c(content):
    """Wrap <div class="breadcrumb"> in <nav> and add aria-current to .current span."""
    # Single-line breadcrumb
    content = re.sub(
        r'(<div class="breadcrumb">)(.*?)(</div>)',
        lambda m: f'<nav aria-label="Breadcrumb">{m.group(1)}{m.group(2).replace("<span class=\"current\">", "<span class=\"current\" aria-current=\"page\">")}{m.group(3)}</nav>',
        content,
        count=1
    )
    # Multi-line breadcrumb: the closing </div> of the breadcrumb is the one right after <span class="current">
    # Strategy: find the breadcrumb opening, then find its closing </div>, wrap both
    def wrap_multiline_breadcrumb(content):
        match = re.search(r'(<div class="breadcrumb">)', content)
        if not match:
            return content
        start = match.start()
        # Find the matching </div> — it's the first </div> after the breadcrumb opening
        # that's at the same indent level or the one closing the breadcrumb
        # Look for the closing pattern: whitespace + </div>
        rest = content[start:]
        # Find the breadcrumb block end — look for the line with just </div> after breadcrumb content
        # The breadcrumb block ends with a line like "    </div>"
        end_match = re.search(r'\n(\s*)</div>', rest)
        if not end_match:
            return content
        end = start + end_match.end()
        block = content[start:end]
        # Add aria-current to the current span
        block = block.replace(
            '<span class="current">',
            '<span class="current" aria-current="page">'
        )
        # Wrap in nav
        content = content[:start] + f'<nav aria-label="Breadcrumb">{block}</nav>' + content[end:]
        return content

    # Only apply multi-line wrap if single-line didn't already handle it
    if '<nav aria-label="Breadcrumb">' not in content:
        content = wrap_multiline_breadcrumb(content)
    return content

def process_file(filepath, fix_a_map, fix_b_files):
    rel = os.path.relpath(filepath, ROOT).replace('\\', '/')
    with open(filepath, 'r', encoding='utf-8') as f:
        original = f.read()
    content = original

    # Fix B: tawheed unit breadcrumb link
    if rel in fix_b_files:
        content = apply_fix_b(content)

    # Fix A: crumb text normalization
    if rel in fix_a_map:
        old_text, new_text = fix_a_map[rel]
        content = apply_fix_a(content, old_text, new_text)

    # Fix C: accessibility — wrap in nav + aria-current (skip index.html)
    if 'breadcrumb' in content and '<nav aria-label="Breadcrumb">' not in content:
        content = apply_fix_c(content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

# Collect all HTML files
html_files = glob.glob(os.path.join(ROOT, '*.html')) + \
             glob.glob(os.path.join(ROOT, 'lessons', '**', '*.html'), recursive=True)

changed = 0
for fp in sorted(html_files):
    if process_file(fp, FIX_A_MAP, set(TAWHEED_UNITS)):
        changed += 1
        rel = os.path.relpath(fp, ROOT).replace('\\', '/')
        print(f"  CHANGED: {rel}")

print(f"\nDone. {changed} files modified.")
