#!/usr/bin/env python3
"""
Fetch hadith data from sunnah.com API and save to js/hadith-data.json.

Usage:
    python scripts/fetch_sunnah_hadith.py --api-key YOUR_KEY

Get your API key at: https://sunnah.com/developers
"""

import argparse
import json
import os
import sys
import urllib.request
import urllib.error

API_BASE = "https://api.sunnah.com/v1"
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), "..", "js", "hadith-data.json")

# All 26 hadith with their sunnah.com references
HADITH_REFS = [
    {"id": 1,  "ref": "bukhari:39",      "narrator": "Abu Hurayrah",           "collection": "Sahih al-Bukhari",  "number": "39"},
    {"id": 2,  "ref": "bukhari:589",     "narrator": "Mu'adh ibn Jabal",       "collection": "Sahih al-Bukhari",  "number": "589"},
    {"id": 3,  "ref": "muslim:101",      "narrator": "Abu Hurayrah",           "collection": "Sahih Muslim",      "number": "101"},
    {"id": 4,  "ref": "bukhari:1",       "narrator": "Umar ibn al-Khattab",    "collection": "Sahih al-Bukhari",  "number": "1"},
    {"id": 5,  "ref": "muslim:38",       "narrator": "Abu Umamah",             "collection": "Sahih Muslim",      "number": "38"},
    {"id": 6,  "ref": "bukhari:6094",    "narrator": "Abdullah ibn Mas'ud",    "collection": "Sahih al-Bukhari",  "number": "6094"},
    {"id": 7,  "ref": "muslim:47",       "narrator": "Abdullah ibn Mas'ud",    "collection": "Sahih Muslim",      "number": "47"},
    {"id": 8,  "ref": "muslim:2548",     "narrator": "Abu Hurayrah",           "collection": "Sahih Muslim",      "number": "2548"},
    {"id": 9,  "ref": "bukhari:5230",    "narrator": "Abdullah ibn Umar",      "collection": "Sahih al-Bukhari",  "number": "5230"},
    {"id": 10, "ref": "muslim:101",      "narrator": "Abu Hurayrah",           "collection": "Sahih Muslim",      "number": "101"},
    {"id": 11, "ref": "muslim:93a",      "narrator": "Jabir",                  "collection": "Sahih Muslim",      "number": "93a"},
    {"id": 12, "ref": "muslim:223",      "narrator": "Abu Malik al-Ash'ari",   "collection": "Sahih Muslim",      "number": "223"},
    {"id": 13, "ref": "muslim:223",      "narrator": "Abu Malik al-Ash'ari",   "collection": "Sahih Muslim",      "number": "223"},
    {"id": 14, "ref": "muslim:635a",     "narrator": "Abu Bakr",               "collection": "Sahih Muslim",      "number": "635a"},
    {"id": 15, "ref": "muslim:223",      "narrator": "Abu Malik al-Ash'ari",   "collection": "Sahih Muslim",      "number": "223"},
    {"id": 16, "ref": "muslim:55a",      "narrator": "Tamim ad-Dari",          "collection": "Sahih Muslim",      "number": "55a"},
    {"id": 17, "ref": "abudawud:1479",   "narrator": "an-Nu'man ibn Bashir",   "collection": "Sunan Abu Dawud",   "number": "1479"},
    {"id": 18, "ref": "muslim:216",      "narrator": "Abdullah ibn Salam",     "collection": "Sahih Muslim",      "number": "216"},
    {"id": 19, "ref": "muslim:2222",     "narrator": "Abu Hurayrah",           "collection": "Sahih Muslim",      "number": "2222"},
    {"id": 20, "ref": "tirmidhi:2516",   "narrator": "Abdullah ibn Abbas",     "collection": "Sunan at-Tirmidhi", "number": "2516"},
    {"id": 21, "ref": "bukhari:2989",    "narrator": "Jaber ibn Abdullah",     "collection": "Sahih al-Bukhari",  "number": "2989"},
    {"id": 22, "ref": "bukhari:6117",    "narrator": "Abu Masud al-Ansari",    "collection": "Sahih al-Bukhari",  "number": "6117"},
    {"id": 23, "ref": "bukhari:6924",    "narrator": "Aisha",                  "collection": "Sahih al-Bukhari",  "number": "6924"},
    {"id": 24, "ref": "bukhari:5984",    "narrator": "Abdullah ibn Amr",       "collection": "Sahih al-Bukhari",  "number": "5984"},
    {"id": 25, "ref": "bukhari:6056",    "narrator": "Hudhayfah",              "collection": "Sahih al-Bukhari",  "number": "6056"},
    {"id": 26, "ref": "muslim:101",      "narrator": "Anas ibn Malik",         "collection": "Sahih Muslim",      "number": "101"},
]

# Grade mapping (from sunnah.com)
GRADE_MAP = {
    1: "Sahih", 2: "Sahih", 3: "Sahih", 4: "Sahih", 5: "Sahih",
    6: "Sahih", 7: "Sahih", 8: "Sahih", 9: "Sahih", 10: "Sahih",
    11: "Sahih", 12: "Sahih", 13: "Sahih", 14: "Sahih", 15: "Sahih",
    16: "Sahih", 17: "Sahih", 18: "Sahih", 19: "Sahih", 20: "Hasan",
    21: "Sahih", 22: "Sahih", 23: "Sahih", 24: "Sahih", 25: "Sahih",
    26: "Sahih",
}


def fetch_hadith(api_key, collection, number):
    """Fetch a single hadith from sunnah.com API."""
    url = f"{API_BASE}/collections/{collection}/hadiths/{number}"
    req = urllib.request.Request(url, headers={"X-API-Key": api_key})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"  HTTP {e.code} for {collection}:{number}")
        return None
    except Exception as e:
        print(f"  Error for {collection}:{number}: {e}")
        return None


def build_offline_data():
    """Build JSON from known data (no API needed)."""
    data = []
    for ref in HADITH_REFS:
        hid = ref["id"]
        data.append({
            "id": hid,
            "arabic": "",  # Will be populated from HTML or API
            "english": "",  # Will be populated from HTML or API
            "grade": GRADE_MAP.get(hid, "Sahih"),
            "narrator": ref["narrator"],
            "collection": ref["collection"],
            "number": ref["number"],
            "sunnah_url": f"https://sunnah.com/{ref['ref'].replace(':', '/')}",
        })
    return data


def fetch_all_data(api_key):
    """Fetch all hadith from sunnah.com API."""
    data = []
    for ref in HADITH_REFS:
        hid = ref["id"]
        collection = ref["ref"].split(":")[0]
        number = ref["ref"].split(":")[1]

        print(f"Fetching hadith {hid} ({ref['ref']})...")
        result = fetch_hadith(api_key, collection, number)

        arabic = ""
        english = ""
        grade = GRADE_MAP.get(hid, "Sahih")

        if result and "data" in result:
            hadith = result["data"]
            arabic = hadith.get("arab", "")
            # English translation
            if hadith.get("englishGrade1"):
                grade = hadith["englishGrade1"]
            # Get the first translation
            translations = hadith.get("translations", [])
            if translations:
                english = translations[0].get("text", "")

        data.append({
            "id": hid,
            "arabic": arabic,
            "english": english,
            "grade": grade,
            "narrator": ref["narrator"],
            "collection": ref["collection"],
            "number": ref["number"],
            "sunnah_url": f"https://sunnah.com/{ref['ref'].replace(':', '/')}",
        })

    return data


def main():
    parser = argparse.ArgumentParser(description="Fetch hadith data from sunnah.com API")
    parser.add_argument("--api-key", help="sunnah.com API key (get from https://sunnah.com/developers)")
    args = parser.parse_args()

    if args.api_key:
        print("Fetching hadith from sunnah.com API...")
        data = fetch_all_data(args.api_key)
    else:
        print("No API key provided. Building offline data from known references...")
        print("To fetch full content, run: python scripts/fetch_sunnah_hadith.py --api-key YOUR_KEY")
        data = build_offline_data()

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\nSaved {len(data)} hadith to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
