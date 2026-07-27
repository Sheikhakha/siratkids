import re

files = [
    'lessons/tawheed/unit1.html',
    'lessons/tawheed/unit2.html',
    'lessons/tawheed/unit3.html',
    'manners.html',
]

# Remove the entire line containing <span class="lesson-concept">
pattern = re.compile(r'^\s*<span class="lesson-concept">.*</span>\s*$', re.MULTILINE)

for f in files:
    with open(f, 'r', encoding='utf-8') as fh:
        content = fh.read()
    new_content = pattern.sub('', content)
    removed = content.count('lesson-concept"') - new_content.count('lesson-concept"')
    with open(f, 'w', encoding='utf-8') as fh:
        fh.write(new_content)
    print(f'{f}: removed {removed} line(s), size {len(content)} -> {len(new_content)}')
