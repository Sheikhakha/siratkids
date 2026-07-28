#!/usr/bin/env python3
"""Add grade labels + read-more buttons + __HADITH_DATA to all 26 hadith lesson pages."""

import os
import re
import json

LESSONS_DIR = os.path.join(os.path.dirname(__file__), '..', 'lessons', 'hadith')

# Complete hadith data for all 26 hadith
HADITH_DATA = [
    {"id":1,"title":"Religion is Ease","arabic":"الدِّينُ يُسْرٌ","english":"Religion is ease.","narrator":"Abu Hurayrah","collection":"Sahih al-Bukhari","number":"39","grade":"Sahih","fullArabic":"الدِّينُ يُسْرٌ","fullEnglish":"Religion is ease."},
    {"id":2,"title":"Key to Paradise","arabic":"مَفْتَاحُ الْجَنَّةِ الصَّلَاةُ","english":"The prayer is the key to Paradise.","narrator":"Mu'adh ibn Jabal","collection":"Jami' at-Tirmidhi","number":"4","grade":"Sahih","fullArabic":"مَفْتَاحُ الْجَنَّةِ الصَّلَاةُ","fullEnglish":"The prayer is the key to Paradise."},
    {"id":3,"title":"Cheating","arabic":"مَنْ غَشَّ فَلَيْسَ مِنَّا","english":"Whoever cheats is not from us.","narrator":"Abu Hurayrah","collection":"Sahih Muslim","number":"101","grade":"Sahih","fullArabic":"مَنْ غَشَّ فَلَيْسَ مِنَّا","fullEnglish":"Whoever cheats is not from us."},
    {"id":4,"title":"Intentions","arabic":"إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ","english":"Actions are judged by intentions.","narrator":"Umar ibn al-Khattab","collection":"Sahih al-Bukhari","number":"1","grade":"Sahih","fullArabic":"إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ","fullEnglish":"Actions are judged by intentions."},
    {"id":5,"title":"Peace Before Speech","arabic":"السَّلَامُ قَبْلَ الْكَلَامِ","english":"Peace before speech.","narrator":"Abdullah ibn Buhaynah","collection":"Jami' at-Tirmidhi","number":"2699","grade":"Da'if","fullArabic":"السَّلَامُ قَبْلَ الْكَلَامِ","fullEnglish":"Peace before speech."},
    {"id":6,"title":"Truthfulness","arabic":"عَلَيْكُمْ بِالصِّدْقِ","english":"Adhere to truthfulness.","narrator":"Abdullah ibn Mas'ud","collection":"Sahih al-Bukhari","number":"6094","grade":"Sahih","fullArabic":"عَلَيْكُمْ بِالصِّدْقِ","fullEnglish":"Adhere to truthfulness."},
    {"id":7,"title":"Beware of Lying","arabic":"إِيَّاكُمْ وَ الْكَذِبَ","english":"Beware of lying.","narrator":"Abdullah ibn Mas'ud","collection":"Sahih Muslim","number":"2607","grade":"Sahih","fullArabic":"إِيَّاكُمْ وَ الْكَذِبَ","fullEnglish":"Beware of lying."},
    {"id":8,"title":"Paradise & Mothers","arabic":"الْجَنَّةُ تَحْتَ أَقْدَامِ الْأُمَّهَاتِ","english":"Paradise lies beneath the feet of mothers.","narrator":"Abu Hurayrah","collection":"Sunan an-Nasa'i","number":"3104","grade":"Sahih","fullArabic":"الْجَنَّةُ تَحْتَ أَقْدَامِ الْأُمَّهَاتِ","fullEnglish":"Paradise lies beneath the feet of mothers."},
    {"id":9,"title":"Door of Paradise","arabic":"الْوَالِدُ أَوْسَطُ أَبْوَابِ الْجَنَّةِ","english":"The parent is the middle door of Paradise.","narrator":"Abdullah ibn Umar","collection":"Jami' at-Tirmidhi","number":"1900","grade":"Hasan","fullArabic":"الْوَالِدُ أَوْسَطُ أَبْوَابِ الْجَنَّةِ","fullEnglish":"The parent is the middle door of Paradise."},
    {"id":10,"title":"None Will Enter Paradise Except a Muslim Soul","arabic":"لَا يَدْخُلُ الْجَنَّةَ إِلَّا نَفْسٌ مُسْلَمَةٌ","english":"None will enter Paradise except a Muslim soul.","narrator":"Abu Hurayrah","collection":"Sahih al-Bukhari","number":"6528","grade":"Sahih","fullArabic":"لَا يَدْخُلُ الْجَنَّةَ إِلَّا نَفْسٌ مُسْلَمَةٌ","fullEnglish":"None will enter Paradise except a Muslim soul."},
    {"id":11,"title":"Whoever Dies Associating Partners with Allah","arabic":"مَنْ مَاتَ يُشْرِكُ بِاللَّهِ شَيْئًا دَخَلَ النَّارَ","english":"Whoever dies associating partners with Allah will enter the Fire.","narrator":"Jabir","collection":"Sahih Muslim","number":"93a","grade":"Sahih","fullArabic":"مَنْ مَاتَ يُشْرِكُ بِاللَّهِ شَيْئًا دَخَلَ النَّارَ","fullEnglish":"Whoever dies associating partners with Allah will enter the Fire."},
    {"id":12,"title":"Purity Is Half of Faith","arabic":"الطَّهُورُ شَطْرُ الْإِيمَانِ","english":"Purity is half of faith.","narrator":"Abu Malik al-Ash'ari","collection":"Sahih Muslim","number":"223","grade":"Sahih","fullArabic":"الطَّهُورُ شَطْرُ الْإِيمَانِ","fullEnglish":"Purity is half of faith."},
    {"id":13,"title":"Prayer Is a Light","arabic":"الصَّلَاةُ نُورٌ","english":"Prayer is a light.","narrator":"Abu Malik al-Ash'ari","collection":"Sahih Muslim","number":"223","grade":"Sahih","fullArabic":"الصَّلَاةُ نُورٌ","fullEnglish":"Prayer is a light."},
    {"id":14,"title":"The Two Cool Prayers: Fajr and Asr","arabic":"مَنْ صَلَّى الْبَرْدَيْنِ دَخَلَ الْجَنَّةَ","english":"Whoever prays the two cool prayers (Fajr and Asr) will enter Paradise.","narrator":"Abu Bakr","collection":"Sahih al-Bukhari","number":"574","grade":"Sahih","fullArabic":"مَنْ صَلَّى الْبَرْدَيْنِ دَخَلَ الْجَنَّةَ","fullEnglish":"Whoever prays the two cool prayers (Fajr and Asr) will enter Paradise."},
    {"id":15,"title":"Patience Is Illumination","arabic":"الصَّبْرُ ضِيَاءٌ","english":"Patience is illumination.","narrator":"Abu Malik al-Ash'ari","collection":"Sahih Muslim","number":"223","grade":"Sahih","fullArabic":"الصَّبْرُ ضِيَاءٌ","fullEnglish":"Patience is illumination."},
    {"id":16,"title":"Religion Is Sincerity","arabic":"الدِّينُ النَّصِيحَةُ","english":"Religion is sincerity.","narrator":"Tamim ad-Dari","collection":"Sahih Muslim","number":"55a","grade":"Sahih","fullArabic":"الدِّينُ النَّصِيحَةُ","fullEnglish":"Religion is sincerity."},
    {"id":17,"title":"Supplication Is Worship","arabic":"الدُّعَاءُ مُخُ الْعِبَادَةِ","english":"Supplication is the essence of worship.","narrator":"an-Nu'man ibn Bashir","collection":"Sunan Abi Dawud","number":"1479","grade":"Sahih","fullArabic":"الدُّعَاءُ مُخُ الْعِبَادَةِ","fullEnglish":"Supplication is the essence of worship."},
    {"id":18,"title":"Spread Salam Among Yourselves","arabic":"أَفْشُوا السَّلَامَ بَيْنَكُمْ","english":"Spread salam among yourselves.","narrator":"Abdullah ibn Salam","collection":"Sahih Muslim","number":"216","grade":"Sahih","fullArabic":"أَفْشُوا السَّلَامَ بَيْنَكُمْ","fullEnglish":"Spread salam among yourselves."},
    {"id":19,"title":"Strive for What Benefits You","arabic":"احْرِصْ عَلَى مَا يَنْفَعُكَ","english":"Strive for what benefits you.","narrator":"Abu Hurayrah","collection":"Sahih Muslim","number":"2664","grade":"Sahih","fullArabic":"احْرِصْ عَلَى مَا يَنْفَعُكَ","fullEnglish":"Strive for what benefits you."},
    {"id":20,"title":"Seek Help from Allah","arabic":"اسْتَعِنْ بِاللَّهِ وَلَا تَعْجَزْ","english":"Seek help from Allah and do not be helpless.","narrator":"Abdullah ibn Abbas","collection":"Jami' at-Tirmidhi","number":"2516","grade":"Hasan","fullArabic":"اسْتَعِنْ بِاللَّهِ وَلَا تَعْجَزْ","fullEnglish":"Seek help from Allah and do not be helpless."},
    {"id":21,"title":"Every Good Deed Is Charity","arabic":"كُلُّ مَعْرُوفٍ صَدَقَةٌ","english":"Every good deed is charity.","narrator":"Abu Hurayrah","collection":"Sahih al-Bukhari","number":"2989","grade":"Sahih","fullArabic":"كُلُّ مَعْرُوفٍ صَدَقَةٌ","fullEnglish":"Every good deed is charity."},
    {"id":22,"title":"Modesty Brings Nothing but Good","arabic":"الْحَيَاءُ لَا يَأْتِي إِلَّا بِخَيْرٍ","english":"Modesty brings nothing but good.","narrator":"Imran ibn Husayn","collection":"Sahih al-Bukhari","number":"6117","grade":"Sahih","fullArabic":"الْحَيَاءُ لَا يَأْتِي إِلَّا بِخَيْرٍ","fullEnglish":"Modesty brings nothing but good."},
    {"id":23,"title":"Allah Loves Gentleness","arabic":"إِنَّ اللَّهَ يُحِبُّ التَّيْسِيرَ فِي كُلِّ شَيْءٍ","english":"Allah loves gentleness in all matters.","narrator":"Aisha","collection":"Sahih al-Bukhari","number":"6927","grade":"Sahih","fullArabic":"إِنَّ اللَّهَ يُحِبُّ التَّيْسِيرَ فِي كُلِّ شَيْءٍ","fullEnglish":"Allah loves gentleness in all matters."},
    {"id":24,"title":"Do Not Sever Family Ties","arabic":"لَا يَدْخُلُ الْجَنَّةَ قَاطِعُ الرَّحِمِ","english":"The one who severs family ties will not enter Paradise.","narrator":"Jubayr ibn Mut'im","collection":"Sahih al-Bukhari","number":"5984","grade":"Sahih","fullArabic":"لَا يَدْخُلُ الْجَنَّةَ قَاطِعُ الرَّحِمِ","fullEnglish":"The one who severs family ties will not enter Paradise."},
    {"id":25,"title":"The Talebearer Will Not Enter Paradise","arabic":"لَا يَدْخُلُ الْجَنَّةَ نَمَّامٌ","english":"The talebearer will not enter Paradise.","narrator":"Hudhayfah","collection":"Sahih al-Bukhari","number":"6056","grade":"Sahih","fullArabic":"لَا يَدْخُلُ الْجَنَّةَ نَمَّامٌ","fullEnglish":"The talebearer will not enter Paradise."},
    {"id":26,"title":"Whoever Cheats Us Is Not from Us","arabic":"مَنْ غَشَّ فَلَيْسَ مِنَّا","english":"Whoever cheats us is not from us.","narrator":"Abu Hurayrah","collection":"Sahih Muslim","number":"101","grade":"Sahih","fullArabic":"مَنْ غَشَّ فَلَيْسَ مِنَّا","fullEnglish":"Whoever cheats us is not from us."},
]


def process_hadith_page(n):
    filename = os.path.join(LESSONS_DIR, f'hadith-{n}.html')
    if not os.path.exists(filename):
        print(f"  SKIP: {filename} not found")
        return False

    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    data = HADITH_DATA[n - 1]
    grade_class = data['grade'].lower().replace("'", "").replace(" ", "")

    # Skip if already processed
    if 'hadith-grade' in content and '__HADITH_DATA' in content:
        print(f"  SKIP: hadith-{n}.html (already processed)")
        return True

    # 1. Insert grade block + read-more button after lesson-block
    # Pages 1-9: lesson-block closes with 12-space indent, lesson-nav with 12-space indent
    # Pages 10-26: lesson-block closes with 12-space indent, lesson-nav with 8-space indent
    grade_block_12 = f'''            </div>

            <p class="hadith-grade"><strong>Grade:</strong> <span class="hadith-badge {grade_class}">{data['grade']}</span></p>
            <button class="hadith-read-more" data-hadith-id="{n}">Read Full Hadith</button>

            <div class="lesson-nav">'''

    grade_block_8 = f'''            </div>

        <p class="hadith-grade"><strong>Grade:</strong> <span class="hadith-badge {grade_class}">{data['grade']}</span></p>
        <button class="hadith-read-more" data-hadith-id="{n}">Read Full Hadith</button>

        <div class="lesson-nav">'''

    old_12 = '            </div>\n\n            <div class="lesson-nav">'
    old_8 = '            </div>\n\n        <div class="lesson-nav">'

    if old_12 in content:
        content = content.replace(old_12, grade_block_12, 1)
    elif old_8 in content:
        content = content.replace(old_8, grade_block_8, 1)
    else:
        print(f"  ERROR: Could not find lesson-nav marker in {filename}")
        return False

    # 2. Add __HADITH_DATA script before </body>
    script_block = f'''    <script>
var __HADITH_DATA = {json.dumps(data, ensure_ascii=False)};
    </script>
</body>'''
    old_body = '</body>'
    if old_body not in content:
        print(f"  ERROR: Could not find </body> in {filename}")
        return False

    content = content.replace(old_body, script_block, 1)

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"  OK: hadith-{n}.html ({data['title']})")
    return True


def main():
    print("Adding grade labels + read-more buttons to hadith lesson pages...")
    success = 0
    for n in range(1, 27):
        if process_hadith_page(n):
            success += 1
    print(f"\nDone! {success}/26 pages updated.")


if __name__ == '__main__':
    main()
