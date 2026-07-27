"""Rebuild 3 broken tawheed files using tawheed-1-1.html as structural template."""
import re, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATE = os.path.join(ROOT, 'lessons', 'tawheed-1-1.html')

def read(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write(path, content):
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(content)

def extract_main_block(content):
    """Extract content between <main class="lesson-main"> and </main>."""
    m = re.search(r'(<main class="lesson-main">)(.*?)(</main>)', content, re.DOTALL)
    return m.group(2) if m else ''

def extract_hero(content):
    """Extract hero title ar/en and lesson-unit from header."""
    ar = re.search(r'<span class="ar" dir="rtl">([^<]+)</span>\s*<span class="en">', content)
    en = re.search(r'<span class="en">([^<]+)</span>\s*</h1>', content)
    unit = re.search(r'<p class="lesson-unit">([^<]+)</p>', content)
    return {
        'ar': ar.group(1) if ar else '',
        'en': en.group(1) if en else '',
        'unit': unit.group(1) if unit else '',
    }

def extract_title(content):
    """Extract <title> text."""
    m = re.search(r'<title>([^|]+)\|', content)
    return m.group(1).strip() if m else ''

def extract_lesson_nav(content):
    """Extract prev/next nav links."""
    prev = re.search(r'class="lesson-nav-prev"[^>]*>([^<]+)', content)
    nxt = re.search(r'class="lesson-nav-next"[^>]*>([^<]+)', content)
    return {
        'prev_href': re.search(r'href="([^"]+)"[^>]*class="lesson-nav-prev"', content).group(1) if re.search(r'href="([^"]+)"[^>]*class="lesson-nav-prev"', content) else '',
        'prev_text': prev.group(1) if prev else '',
        'next_href': re.search(r'href="([^"]+)"[^>]*class="lesson-nav-next"', content).group(1) if re.search(r'href="([^"]+)"[^>]*class="lesson-nav-next"', content) else '',
        'next_text': nxt.group(1) if nxt else '',
    }

def rebuild(source_path, target_path):
    source = read(source_path)
    template = read(TEMPLATE)
    
    hero = extract_hero(source)
    title = extract_title(source)
    main_block = extract_main_block(source)
    nav = extract_lesson_nav(source)
    
    # Extract filename for sidebar active state
    fname = os.path.basename(target_path)
    
    # Extract unit number from filename (e.g., tawheed-1-2 -> 1, tawheed-2-1 -> 2, tawheed-3-1 -> 3)
    unit_match = re.match(r'tawheed-(\d)-\d', fname)
    unit_num = unit_match.group(1) if unit_match else '1'
    
    # Build sidebar active state from source
    sidebar_source = re.search(r'<aside class="lesson-sidebar">(.*?)</aside>', source, re.DOTALL)
    
    # Build the file from template structure
    result = template
    
    # 1. Replace title
    result = re.sub(r'<title>[^|]+\|', f'<title>{title} |', result)
    
    # 2. Replace breadcrumb current text
    result = re.sub(
        r'<span class="current" aria-current="page">[^<]+</span>',
        f'<span class="current" aria-current="page">{fname.replace(".html","")}</span>',
        result
    )
    
    # 3. Replace hero content
    result = re.sub(
        r'(<span class="ar" dir="rtl">)[^<]+(</span>\s*<span class="en">)[^<]+(</span>)',
        f'\\g<1>{hero["ar"]}\\g<2>{hero["en"]}\\g<3>',
        result
    )
    
    # 4. Replace lesson-unit
    if hero['unit']:
        result = re.sub(r'<p class="lesson-unit">[^<]+</p>', f'<p class="lesson-unit">{hero["unit"]}</p>', result)
    
    # 5. Replace sidebar active states
    # Make current lesson active
    result = re.sub(
        rf'<a href="{re.escape(fname)}" class="sidebar-lesson[^"]*"><span class="sidebar-lesson-num[^"]*">\d+</span>[^<]+</a>',
        lambda m: f'<a href="{fname}" class="sidebar-lesson active"><span class="sidebar-lesson-num active">{re.search(r"\\d+", m.group()).group()}</span>{re.search(r"</span>([^<]+)", m.group()).group(1)}</a>',
        result
    )
    
    # Make unit label active
    result = re.sub(
        rf'<a href="tawheed/unit{unit_num}\.html" class="sidebar-unit-label[^"]*">',
        f'<a href="tawheed/unit{unit_num}.html" class="sidebar-unit-label active">',
        result
    )
    
    # Deactivate all other sidebar lessons
    def deactivate_sidebar(m):
        text = m.group(0)
        if f'href="{fname}"' in text:
            return text  # Keep active
        text = re.sub(r' class="sidebar-lesson active"', ' class="sidebar-lesson"', text)
        text = re.sub(r' class="sidebar-lesson-num active"', ' class="sidebar-lesson-num"', text)
        return text
    result = re.sub(r'<a href="tawheed-\d+-\d+\.html" class="sidebar-lesson[^"]*">[^<]*<span class="sidebar-lesson-num[^"]*">\d+</span>[^<]+</a>', deactivate_sidebar, result)
    
    # 6. Replace lesson content (main block)
    result = re.sub(
        r'(<main class="lesson-main">)(.*?)(</main>)',
        f'\\g<1>{main_block}\\g<3>',
        result,
        flags=re.DOTALL
    )
    
    # 7. Fix prev/next nav links
    if nav['prev_href']:
        result = re.sub(
            r'<a href="[^"]*" class="lesson-nav-prev">',
            f'<a href="{nav["prev_href"]}" class="lesson-nav-prev">',
            result
        )
    if nav['next_href']:
        result = re.sub(
            r'<a href="[^"]*" class="lesson-nav-next">',
            f'<a href="{nav["next_href"]}" class="lesson-nav-next">',
            result
        )
    
    write(target_path, result)
    
    # Verify
    verify = read(target_path)
    ar_count = len(re.findall(r'<span class="ar"[^>]*>[^<]+</span>', verify))
    has_nav = 'aria-label="Breadcrumb"' in verify
    has_aria = 'aria-current="page"' in verify
    has_sidenav = 'sidenav-with-history-container' in verify
    has_wrapper = 'page-content-wrapper' in verify
    has_concept = 'lesson-concept-block' in verify
    has_speed_select = 'audio-speed-select' in verify
    lines = len(verify.splitlines())
    
    print(f"  {fname}: {lines} lines | ar={ar_count} | nav={has_nav} | aria={has_aria} | sidenav={has_sidenav} | wrapper={has_wrapper} | concept={has_concept} | speedSelect={has_speed_select}")

# Process all 3 files
files = [
    ('tawheed-1-2.html', 'tawheed-1-2.html'),
    ('tawheed-2-1.html', 'tawheed-2-1.html'),
    ('tawheed-3-1.html', 'tawheed-3-1.html'),
]

print("Rebuilding from tawheed-1-1.html template...")
for src_name, tgt_name in files:
    src = os.path.join(ROOT, 'lessons', src_name)
    tgt = os.path.join(ROOT, 'lessons', tgt_name)
    rebuild(src, tgt)
