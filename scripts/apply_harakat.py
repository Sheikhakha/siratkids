"""Apply HARAKAT_MAP to curriculum data JSON files and lesson HTML pages.

Usage:
  python scripts/apply_harakat.py data          # sync data files only
  python scripts/apply_harakat.py html          # sync lesson HTML .ar blocks only
  python scripts/apply_harakat.py all           # sync both (default)
  python scripts/apply_harakat.py report        # show unmatched keys / TODO
"""
import io
import json
import os
import sys
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "scripts"))
from harakat_map import HARAKAT_MAP  # noqa: E402

# Map entries authored from dumps use " / " as a newline surrogate; the data
# files store real newlines. Normalize both keys and values on lookup.
HARAKAT_NORM = {
    k.replace(" / ", "\n"): v.replace(" / ", "\n") for k, v in HARAKAT_MAP.items()
}
VAL_SET = set(HARAKAT_NORM.values())

DATA_FILES = [
    "data/curriculum/s2.json",
    "data/curriculum/s3.json",
    "data/curriculum/s3_adab.json",
    "data/curriculum/s3_adhkar.json",
    "data/curriculum/s3_fiqh.json",
    "data/curriculum/s3_hadith.json",
    "data/curriculum/s3_tawheed.json",
]


def esc(s):
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def units_of(d):
    """Normalize both schemas: subj->unit->lesson and flat unit->lesson."""
    if "subjects" in d:
        return [u for su in d["subjects"] for u in su.get("units", [])]
    return d.get("units", [])


def sync_data(report):
    changed = []
    for rel in DATA_FILES:
        path = os.path.join(ROOT, rel)
        if not os.path.exists(path):
            continue
        d = json.load(open(path, encoding="utf-8"))
        n_chg = 0
        for u in units_of(d):
            for les in u.get("lessons", []):
                    for b in les.get("blocks", []):
                        if b.get("type") == "ayah":
                            continue
                        ar = b.get("ar", "")
                        new = HARAKAT_NORM.get(ar)
                        if new is not None and new != ar:
                            b["ar"] = new
                            n_chg += 1
                        elif new is None and ar not in VAL_SET:
                            report.setdefault("TODO", []).append((les["file"], ar))
        if n_chg:
            with open(path, "w", encoding="utf-8", newline="\n") as f:
                json.dump(d, f, ensure_ascii=False, indent=2)
            changed.append((rel, n_chg))
            print(f"data: {rel}  ({n_chg} blocks updated)")
    return changed


def sync_html(report):
    """Positionally replace `.ar` <p> inner text in each lesson page."""
    # Build ordered (file, [aritypes, arlist, extra texts]) per lesson
    data = json.load(open(os.path.join(ROOT, "data/curriculum/s2.json"), encoding="utf-8"))
    data2 = json.load(open(os.path.join(ROOT, "data/curriculum/s3.json"), encoding="utf-8"))
    lessons = {}

    for d in (data, data2):
        for su in d["subjects"]:
            for u in su.get("units", []):
                for les in u.get("lessons", []):
                    blks = les.get("blocks", [])
                    lessons.setdefault(les["file"], []).extend(
                        (b.get("type", "text"), b.get("ar", "")) for b in blks
                    )

    n_files = 0
    n_blk = 0
    seen = set()
    for fname, blocks in sorted(lessons.items()):
        if fname in seen:
            continue
        seen.add(fname)
        # lesson files live under lessons/<subj>/<fname>.html; find actual path
        cand = os.path.join(ROOT, "lessons")
        target = None
        for root, _dirs, files in os.walk(cand):
            if fname + ".html" in files:
                target = os.path.join(root, fname + ".html")
                break
        if not target:
            report.setdefault("MISSING", []).append(fname)
            continue
        raw = io.open(target, encoding="utf-8").read()
        # find all <div class="ar"...><p>...</p></div>
        pat = re.compile(r'(<div class="ar[^"]*"[^>]*>)(<p>)(.*?)(</p></div>)', re.S)
        mlist = list(pat.finditer(raw))
        if len(mlist) != len(blocks):
            report.setdefault("ARCOUNT", []).append((fname, len(mlist), len(blocks)))
            continue
        # apply in reverse to keep offsets stable
        chunks = []
        for i in range(len(mlist) - 1, -1, -1):
            m = mlist[i]
            btype, bar = blocks[i]
            inner = esc(bar)
            if btype == "ayah":
                inner = inner.replace("&amp;#65079;", "").replace("&amp;#65080;", "")
                inner = inner.replace("&#65079;", "").replace("&#65080;", "")
                if "\ufd3f" not in inner[:1]:
                    inner = "\ufd3f" + inner + "\ufd3e"
            chunks.append((m.start(), m.end(), m.group(1) + m.group(2) + inner + m.group(4)))
            n_blk += 1
        if chunks:
            for s, e, repl in chunks:
                raw = raw[:s] + repl + raw[e:]
            io.open(target, "w", encoding="utf-8", newline="\n").write(raw)
            n_files += 1
    print(f"html: {n_files} files, {n_blk} blocks synced")
    return n_files


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "all"
    report = {}
    if mode in ("data", "all"):
        sync_data(report)
    if mode in ("html", "all"):
        sync_html(report)
    if mode == "report":
        sync_data(report)
    # Summary
    todo = report.get("TODO", [])
    miss = report.get("MISSING", [])
    arc = report.get("ARCOUNT", [])
    if todo or miss or arc:
        print(f"\nREPORT: TODO={len(todo)} MISSING={len(miss)} ARCOUNT_MISMATCH={len(arc)}")
        for f, ar in todo[:5]:
            print(f"  TODO {f}: {ar!r}")
    else:
        print("REPORT: clean (no unmatched blocks)")


if __name__ == "__main__":
    main()