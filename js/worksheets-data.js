/* =====================================================================
   SiratKids · Worksheet activity data bundle
   docs/activity-worksheets-plan.md §3/§4

   - Loaded by worksheet.html via <script> (file://-safe bundle pattern).
   - Engine (js/worksheet.js) reads window.__SK_WORKSHEETS[<pageKey>].
   - EDIT DATA HERE, never the engine, when adding/reviewing units.
   - ALL Quranic proof text below is VERBATIM from quran.com
     (edition: ar-simple-clean), fetched canonically per plan §9:
       7:54, 10:56, 11:6, 39:62, 51:58, 95:4  (2026-08-23)
     Do NOT alter ayah text without re-fetching canonical sources.
   - bank[] distractors must not equal any fill.answer string.

   Status: 1/17 units authored (s1-tawheed-2 pilot).
   ===================================================================== */
(function (g) {
    "use strict";
    var W = g.__SK_WORKSHEETS = g.__SK_WORKSHEETS || {};

    /* ------------------------------------------------------------
       Stage 1 · Tawheed · Unit 2 — Tawheed of Lordship (Rububiyyah)
       تَوْحِيدُ الرُّبُوبِيَّةِ
       Seeds: lessons/1-tawheed/s1-tawheed-2-1 … -2-6 (+ review)
    ------------------------------------------------------------ */
    W["s1-tawheed-2"] = {
        stage: "s1",
        subject: "tawheed",
        unit: 2,
        hue: 2,
        title: { en: "Rububiyyah — Lordship", ar: "تَوْحِيدُ الرُّبُوبِيَّةِ" },

        /* Activity 1 · match : Name/Attribute <-> textual proof */
        matchGuide: {
            idle:    { en: "Tap a Name!", ar: "اضغط على اسم" },
            picked:  { en: "Now find its proof!", ar: "الآن ابحث عن دليله" },
            wrong:   { en: "Try again!", ar: "حاول مرة أخرى" },
            correct: { en: "Correct! أحسنت", ar: "أحسنت" },
            done:    { en: "MashaAllah! All matched!", ar: "ما شاء الله" }
        },
        match: [
            {
                pair: "khaliq",
                name: { ar: "الْخَالِقُ", en: "Al-Khaliq" },
                proof: { ref: "39:62", ar: "وَاللَّهُ خَالِقُ كُلِّ شَيْءٍ" }
            },
            {
                pair: "razzaq",
                name: { ar: "الرَّزَّاقُ", en: "Ar-Razzaq" },
                proof: { ref: "51:58", ar: "إِنَّ اللَّهَ هُوَ الرَّزَّاقُ ذُو الْقُوَّةِ الْمَتِينُ" }
            },
            {
                pair: "mudabbir",
                name: { ar: "الْمُدَبِّرُ", en: "Al-Mudabbir" },
                proof: { ref: "7:54", ar: "أَلَا لَهُ الْخَلْقُ وَالْأَمْرُ" }
            },
            {
                pair: "muhyi",
                name: { ar: "يُحْيِي وَيُمِيتُ", en: "Gives life & death" },
                proof: { ref: "10:56", ar: "هُوَ يُحْيِي وَيُمِيتُ وَإِلَيْهِ تُرْجَعُونَ" }
            },
            {
                pair: "insan",
                name: { ar: "خَالِقُ الْإِنسَانِ", en: "Creator of man" },
                proof: { ref: "95:4", ar: "لَقَدْ خَلَقْنَا الْإِنسَانَ فِي أَحْسَنِ تَقْوِيمٍ" }
            }
        ],

        /* Activity 2 · fill : word-bank blanks (tap or drag) */
        fillGuide: {
            idle:    { en: "Pick a word, then tap a blank!", ar: "اختر كلمة ثم اضغط على الفراغ" },
            picked:  { en: "Now tap a blank! (or drag me)", ar: "الآن اختر الفراغ أو اسحب الكلمة إليه" },
            dragging:{ en: "Drop it on a blank!", ar: "أفلتها على الفراغ" },
            wrong:   { en: "Not this one — try again!", ar: "ليست هذه، حاول مرة أخرى" },
            done:    { en: "MashaAllah! Complete!", ar: "ما شاء الله، أكملت" }
        },
        fill: [
            {
                before: "اللهُ ",
                answer: "خَالِقُ",
                after: " كُلِّ شَيْءٍ",
                ref: "39:62",
                en: "Allah is the Creator of everything."
            },
            {
                before: "إِنَّ اللَّهَ هُوَ ",
                answer: "الرَّزَّاقُ",
                after: " ذُو الْقُوَّةِ الْمَتِينُ",
                ref: "51:58",
                en: "Indeed Allah is the Provider, Owner of Power, the Most Strong."
            },
            {
                before: "هُوَ ",
                answer: "يُحْيِي",
                after: " وَيُمِيتُ",
                ref: "10:56",
                en: "He gives life and causes death."
            }
        ],
        bank: [
            "خَالِقُ",
            "الرَّزَّاقُ",
            "يُحْيِي",
            "الْمُدَبِّرُ",
            "نَبِيٌّ"
        ]
    };
})(self);
