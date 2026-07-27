import re, glob

pattern = re.compile(
    r'\n            <p class="lesson-concept-block">\s*\n'
    r'                <span class="ar"[^>]*>.*?</span>\s*\n'
    r'                <span class="en">.*?</span>\s*\n'
    r'            </p>',
    re.DOTALL
)

files = sorted(glob.glob('lessons/tawheed-*.html'))
for f in files:
    with open(f, 'r', encoding='utf-8') as fh:
        content = fh.read()
    new_content = pattern.sub('', content)
    with open(f, 'w', encoding='utf-8') as fh:
        fh.write(new_content)
    removed = content.count('lesson-concept-block') - new_content.count('lesson-concept-block')
    print(f'{f}: removed {removed} block(s)')
