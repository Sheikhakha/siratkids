import json, re, sys
from pathlib import Path

def extract_hadith(html: str) -> dict | None:
    id_match = re.search(r'<button class="hadith-read-more" data-hadith-id="(\d+)"', html)
    if not id_match:
        return None
    hid = int(id_match.group(1))

    ar = re.search(r'<div class="ar" dir="rtl"><p class="hadith-text">(.*?)</p></div>', html, re.DOTALL)
    en = re.search(r'<div class="en translation"><p class="hadith-text">(.*?)</p></div>', html, re.DOTALL)

    return {
        "id": hid,
        "arabic": ar.group(1) if ar else "",
        "english": en.group(1) if en else "",
    }

base = Path("D:/primary-islamic-studies/lessons/hadith")
results = []
for i in range(1, 27):
    path = base / f"hadith-{i}.html"
    html = path.read_text(encoding="utf-8")
    entry = extract_hadith(html)
    if entry:
        results.append(entry)

sys.stdout.reconfigure(encoding="utf-8")
print(json.dumps(results, ensure_ascii=False, indent=2))
