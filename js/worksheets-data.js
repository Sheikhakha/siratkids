/* =====================================================================
   SiratKids · Worksheet activity data bundle
   docs/activity-worksheets-plan.md §3/§4

   - Loaded by worksheet.html via <script> (file://-safe bundle pattern).
   - Engine (js/worksheet.js) reads window.__SK_WORKSHEETS[<pageKey>].
   - EDIT DATA HERE, never the engine, when adding/reviewing units.
- ALL Quranic proof text below is VERBATIM from quran.com
     (edition: ar-simple-clean), fetched canonically per plan §9:
        2:21, 2:255, 7:54, 7:158, 10:56, 13:28, 39:62, 39:66,
        51:56, 51:58, 95:4  (2026-09-07)
     Do NOT alter ayah text without re-fetching canonical sources.
   - Lesson fineness: all Arabic statements that are NOT ayah text are
          taken VERBATIM from the lesson HTML pages (lessons/*).
        - bank[] distractors must not equal any fill.answer string.
        - Stage 0 uses color/name/quiz/match: colouring & naming activities
          from PreStage.pdf lesson blocks (per docs/pdf-activity-audit.md).

   Status: 25 keys authored — s0-tawheed-1..3, s0-adhkar-1, s0-hadith-1,
           s0-seerah-1, s1-tawheed-1..5, s1-fiqh-1..4, s1-adhkar-1,
           s2-tawheed-1..5, s2-fiqh-1..3, s2-adhkar-1.
   ===================================================================== */
(function (g) {
    "use strict";
    var W = g.__SK_WORKSHEETS = g.__SK_WORKSHEETS || {};

    /* ------------------------------------------------------------
       Stage 0 · Tawheed · Unit 1 — Rububiyyah (Lordship)
       الرُّبوبِيَّة · Allāh is my Creator
       Seeds: lessons/tawheed-1-1 … -1-5
    ------------------------------------------------------------ */
    W["s0-tawheed-1"] = {
        stage: "s0",
        subject: "tawheed",
        unit: 1,
        hue: 1,
        title: { en: "Rububiyyah (Lordship)", ar: "الرُّبوبِيَّة" },

        colorGuide: {
            idle:    { en: "Pick a color, then tap a picture!", ar: "اختر لونًا ثم اضغط على الصورة" },
            picked:  { en: "Now tap a picture to color it!", ar: "اضغط على صورة لتلوينها" },
            correct: { en: "Colored! لنونها", ar: "لُوِّنت" },
            done:    { en: "Lovely! All colored!", ar: "جميل، أتممت التلوين" }
        },
        color: {
            zones: [
                { id: "khaliq", label: { ar: "اللَّهُ خَالِقِي", en: "Allah is my Creator" } },
                { id: "shams",  label: { ar: "الشَّمْسُ", en: "The Sun" } },
                { id: "qamar",  label: { ar: "الْقَمَرُ", en: "The Moon" } },
                { id: "insan",  label: { ar: "النَّاسُ", en: "People" } },
                { id: "hayawan", label: { ar: "الْحَيَوَانَاتُ", en: "Animals" } }
            ],
            palette: ["#f59e0b", "#ef4444", "#10b981", "#3b82f6", "#8b5cf6"]
        },

        quizGuide: {
            idle:    { en: "Choose an answer!", ar: "اختر الإجابة" },
            wrong:   { en: "Try again!", ar: "حاول مرة أخرى" },
            correct: { en: "Correct! أحسنت", ar: "أحسنت" },
            done:    { en: "MashaAllah! All correct!", ar: "ما شاء الله" }
        },
        quiz: [
            {
                q: { ar: "مَنْ خَلَقَنِي وَخَلَقَ النَّاسَ جَمِيعًا؟", en: "Who created me and all people?" },
                options: [
                    { ar: "اللَّهُ", en: "Allah" },
                    { ar: "أَبِي", en: "My father" },
                    { ar: "الطَّبِيبُ", en: "The doctor" }
                ],
                answer: 0
            },
            {
                q: { ar: "مَنْ خَلَقَ الْحَيَوَانَاتِ وَالطُّيُورَ؟", en: "Who created animals and birds?" },
                options: [
                    { ar: "اللَّهُ", en: "Allah" },
                    { ar: "الْحَدِيقَةُ", en: "The garden" },
                    { ar: "الْبَيْتُ", en: "The house" }
                ],
                answer: 0
            },
            {
                q: { ar: "اللَّهُ خَلَقَ الشَّمْسَ وَالْقَمَرَ. صَواب أم خَطَأ؟", en: "Allah created the sun and the moon." },
                options: [
                    { ar: "صَوَابٌ", en: "True" },
                    { ar: "خَطَأٌ", en: "False" },
                    { ar: "لَا أَدْرِي", en: "I don't know" }
                ],
                answer: 0
            }
        ],

        nameGuide: {
            idle:    { en: "Pick a word, then tap a blank!", ar: "اختر كلمة ثم اضغط على الفراغ" },
            picked:  { en: "Now tap a blank!", ar: "الآن اختر الفراغ" },
            dragging:{ en: "Drop it on a blank!", ar: "أفلتها على الفراغ" },
            wrong:   { en: "Not this one — try again!", ar: "ليست هذه، حاول مرة أخرى" },
            done:    { en: "MashaAllah! Complete!", ar: "ما شاء الله، أكملت" }
        },
        name: [
            { label: { ar: "اللَّهُ", en: "Allah" }, distractors: [] },
            { label: { ar: "خَالِقِي", en: "My Creator" }, distractors: ["مُلَوِّنِي"] },
            { label: { ar: "الشَّمْسُ", en: "The sun" }, distractors: ["الْقَمَرُ"] },
            { label: { ar: "الْقَمَرُ", en: "The moon" }, distractors: ["الشَّمْسُ"] }
        ]
    };

    /* ------------------------------------------------------------
       Stage 0 · Tawheed · Unit 2 — Uloohiyyah (Worship)
       الأُلُوهِيَّة · why Allah created us
       Seeds: lessons/tawheed-2-1 … -2-4
    ------------------------------------------------------------ */
    W["s0-tawheed-2"] = {
        stage: "s0",
        subject: "tawheed",
        unit: 2,
        hue: 2,
        title: { en: "Uloohiyyah (Worship)", ar: "الأُلُوهِيَّة" },

        quizGuide: {
            idle:    { en: "Choose an answer!", ar: "اختر الإجابة" },
            wrong:   { en: "Try again!", ar: "حاول مرة أخرى" },
            correct: { en: "Correct! أحسنت", ar: "أحسنت" },
            done:    { en: "MashaAllah! All correct!", ar: "ما شاء الله" }
        },
        quiz: [
            {
                q: { ar: "لِمَاذَا خَلَقَنَا اللَّهُ؟", en: "Why did Allah create us?" },
                options: [
                    { ar: "لِتَوْحِيدِهِ وَعِبَادَتِهِ", en: "To single Him out in Tawheed and worship Him" },
                    { ar: "لِلَّعِبِ", en: "To play" },
                    { ar: "لِلنَّوْمِ", en: "To sleep" }
                ],
                answer: 0
            },
            {
                q: { ar: "﴿وَمَا خَلَقْتُ الْجِنَّ وَالْإِنْسَ إِلَّا لِيَعْبُدُونِ﴾ مَاذَا نَتَعَلَّمُ مِنْ هَذِهِ الآيَةِ؟", en: "What do we learn from this ayah?" },
                options: [
                    { ar: "خَلَقَ اللَّهُ الْجِنَّ وَالْإِنْسَ لِعِبَادَتِهِ", en: "Allah created jinn and mankind to worship Him" },
                    { ar: "خَلَقَهُمْ لِلَّعِبِ", en: "He created them to play" },
                    { ar: "لَا نَتَعَلَّمُ شَيْئًا", en: "We learn nothing" }
                ],
                answer: 0
            }
        ],

        matchGuide: {
            idle:    { en: "Tap a Name!", ar: "اضغط على اسم" },
            picked:  { en: "Now find its proof!", ar: "الآن ابحث عن دليله" },
            wrong:   { en: "Try again!", ar: "حاول مرة أخرى" },
            correct: { en: "Correct! أحسنت", ar: "أحسنت" },
            done:    { en: "MashaAllah! All matched!", ar: "ما شاء الله" }
        },
        match: [
            {
                pair: "ibadah",
                name: { ar: "عِبَادَةُ اللَّهِ", en: "Worship of Allah" },
                proof: { ref: "51:56", ar: "وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ" }
            },
            {
                pair: "tawhid",
                name: { ar: "تَوْحِيدُهُ", en: "Tawheed of Him" },
                proof: { ref: "39:62", ar: "اللَّهُ خَالِقُ كُلِّ شَيْءٍ" }
            }
        ]
    };

    /* ------------------------------------------------------------
       Stage 0 · Tawheed · Unit 3 — Islam & Love of the Prophet
       الإِسْلَامُ وَحُبُّ النَّبِيِّ
       Seeds: lessons/tawheed-3-1 … -3-4
    ------------------------------------------------------------ */
    W["s0-tawheed-3"] = {
        stage: "s0",
        subject: "tawheed",
        unit: 3,
        hue: 3,
        title: { en: "Islam & Love of the Prophet", ar: "الإِسْلَامُ وَحُبُّ النَّبِيِّ" },

        quizGuide: {
            idle:    { en: "Choose an answer!", ar: "اختر الإجابة" },
            wrong:   { en: "Try again!", ar: "حاول مرة أخرى" },
            correct: { en: "Correct! أحسنت", ar: "أحسنت" },
            done:    { en: "MashaAllah! All correct!", ar: "ما شاء الله" }
        },
        quiz: [
            {
                q: { ar: "مَا هُوَ الدِّينُ الْحَقُّ؟", en: "What is the true religion?" },
                options: [
                    { ar: "الإِسْلَامُ", en: "Islam" },
                    { ar: "اللَّعِبُ", en: "Play" },
                    { ar: "الْآلَاتُ", en: "Toys" }
                ],
                answer: 0
            },
            {
                q: { ar: "﴿إِنَّ الدِّينَ عِنْدَ اللَّهِ الْإِسْلَامُ﴾ (آل عمران: 19). مَاذَا نَتَعَلَّمُ؟", en: "What do we learn from this ayah?" },
                options: [
                    { ar: "الدِّينُ عِنْدَ اللَّهِ هُوَ الْإِسْلَامُ", en: "The religion with Allah is Islam" },
                    { ar: "الدِّينُ عِنْدَ اللَّهِ هُوَ اللَّعِبُ", en: "The religion with Allah is play" },
                    { ar: "لَا شَيْءَ", en: "Nothing" }
                ],
                answer: 0
            }
        ],

        colorGuide: {
            idle:    { en: "Pick a color, then tap a picture!", ar: "اختر لونًا ثم اضغط على الصورة" },
            picked:  { en: "Now tap a picture to color it!", ar: "اضغط على صورة لتلوينها" },
            correct: { en: "Colored! لنونها", ar: "لُوِّنت" },
            done:    { en: "Lovely! All colored!", ar: "جميل، أتممت التلوين" }
        },
        color: {
            zones: [
                { id: "islam",  label: { ar: "الإِسْلَامُ", en: "Islam" } },
                { id: "nabi",   label: { ar: "النَّبِيُّ ﷺ", en: "The Prophet ﷺ" } },
                { id: "quran",  label: { ar: "الْقُرْآنُ", en: "The Quran" } },
                { id: "masjid", label: { ar: "الْمَسْجِدُ", en: "The Mosque" } }
            ],
            palette: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"]
        }
    };

    /* ------------------------------------------------------------
       Stage 0 · Adhkar · Unit 1 — Adhkar & Islamic Manners
       الأَذْكَارُ وَالآدَابُ الإِسْلَامِيَّةُ
       Seeds: lessons/adhkar-1 … -11
    ------------------------------------------------------------ */
    W["s0-adhkar-1"] = {
        stage: "s0",
        subject: "adhkar",
        unit: 1,
        hue: 1,
        title: { en: "Adhkar & Islamic Manners", ar: "الأَذْكَارُ وَالآدَابُ الإِسْلَامِيَّةُ" },

        quizGuide: {
            idle:    { en: "Choose an answer!", ar: "اختر الإجابة" },
            wrong:   { en: "Try again!", ar: "حاول مرة أخرى" },
            correct: { en: "Correct! أحسنت", ar: "أحسنت" },
            done:    { en: "MashaAllah! All correct!", ar: "ما شاء الله" }
        },
        quiz: [
            {
                q: { ar: "مَاذَا نَقُولُ قَبْلَ أَنْ نَأْكُلَ؟", en: "What do we say before eating?" },
                options: [
                    { ar: "بِسْمِ اللَّهِ", en: "Bismillah" },
                    { ar: "لَا بَارَكَ", en: "Nothing" },
                    { ar: "يَا لَيْلَى", en: "A song" }
                ],
                answer: 0
            },
            {
                q: { ar: "مَاذَا نَقُولُ بَعْدَ الْأَكْلِ؟", en: "What do we say after eating?" },
                options: [
                    { ar: "الْحَمْدُ لِلَّهِ", en: "Alhamdulillah" },
                    { ar: "لَا شَيْءَ", en: "Nothing" },
                    { ar: "صَبَاحُ الْخَيْرِ", en: "Good morning" }
                ],
                answer: 0
            },
            {
                q: { ar: "مِنَ الآدَابِ عِنْدَ الْأَكْلِ أَنْ نَأْكُلَ بِالْيَدِ الْيُمْنَى", en: "Good manners while eating: eat with the right hand." },
                options: [
                    { ar: "صَوَابٌ", en: "True" },
                    { ar: "خَطَأٌ", en: "False" },
                    { ar: "لَا أَعْرِفُ", en: "I don't know" }
                ],
                answer: 0
            }
        ],

        nameGuide: {
            idle:    { en: "Pick a word, then tap a blank!", ar: "اختر كلمة ثم اضغط على الفراغ" },
            picked:  { en: "Now tap a blank!", ar: "الآن اختر الفراغ" },
            dragging:{ en: "Drop it on a blank!", ar: "أفلتها على الفراغ" },
            wrong:   { en: "Not this one — try again!", ar: "ليست هذه، حاول مرة أخرى" },
            done:    { en: "MashaAllah! Complete!", ar: "ما شاء الله، أكملت" }
        },
        name: [
            { label: { ar: "بِسْمِ اللَّهِ", en: "In the name of Allah" }, distractors: [] },
            { label: { ar: "الْحَمْدُ لِلَّهِ", en: "Praise be to Allah" }, distractors: ["ثُمَّ اللَّهِ"] },
            { label: { ar: "الْيُمْنَى", en: "The right (hand)" }, distractors: ["الْيُسْرَى"] }
        ]
    };

    /* ------------------------------------------------------------
       Stage 0 · Hadith · Unit 1 — Prophetic Hadith
       الحَدِيثُ النَّبَوِيُّ
       Seeds: lessons/hadith-1 … -26
    ------------------------------------------------------------ */
    W["s0-hadith-1"] = {
        stage: "s0",
        subject: "hadith",
        unit: 1,
        hue: 1,
        title: { en: "Prophetic Hadith", ar: "الحَدِيثُ النَّبَوِيُّ" },

        quizGuide: {
            idle:    { en: "Choose an answer!", ar: "اختر الإجابة" },
            wrong:   { en: "Try again!", ar: "حاول مرة أخرى" },
            correct: { en: "Correct! أحسنت", ar: "أحسنت" },
            done:    { en: "MashaAllah! All correct!", ar: "ما شاء الله" }
        },
        quiz: [
            {
                q: { ar: "بِمَاذَا أَمَرَنَا النَّبِيُّ ﷺ قَبْلَ الْأَكْلِ؟", en: "What did the Prophet ﷺ command before eating?" },
                options: [
                    { ar: "أَنْ نَقُولَ بِسْمِ اللَّهِ", en: "To say Bismillah" },
                    { ar: "أَنْ نَغْسِلَ الْيَدَيْنِ", en: "To wash our hands" },
                    { ar: "أَنْ نَلْعَبَ", en: "To play" }
                ],
                answer: 0
            },
            {
                q: { ar: "مَا هُوَ شِعَارُ الْمُسْلِمِ بِسْمِ اللَّهِ؟", en: "What is the Muslim's slogan?" },
                options: [
                    { ar: "بِسْمِ اللَّهِ", en: "Bismillah" },
                    { ar: "يَا حَجَرُ", en: "Oh stone" },
                    { ar: "لَا مَعْنَى", en: "Meaningless" }
                ],
                answer: 0
            }
        ],

        discGuide: {
            idle:    { en: "Decide: true or false?", ar: "قَرِّر: صواب أم خطأ؟" },
            wrong:   { en: "Try again!", ar: "حاول مرة أخرى" },
            correct: { en: "Correct! أحسنت", ar: "أحسنت" },
            done:    { en: "MashaAllah! All correct!", ar: "ما شاء الله" }
        },
        disc: [
            { text: { ar: "نَقُولُ بِسْمِ اللَّهِ قَبْلَ الْأَكْلِ", en: "We say Bismillah before eating." }, correct: true },
            { text: { ar: "نَأْكُلُ بِالْيَدِ الْيُسْرَى", en: "We eat with the left hand." }, correct: false },
            { text: { ar: "النَّبِيُّ ﷺ هُوَ قُدْوَتَنَا", en: "The Prophet ﷺ is our example." }, correct: true }
        ]
    };

    /* ------------------------------------------------------------
       Stage 0 · Seerah · Unit 1 — Knowing Our Prophet
       مَعْرِفَةُ نَبِيِّنَا
       Seeds: lessons/seerah-1 … -3
    ------------------------------------------------------------ */
    W["s0-seerah-1"] = {
        stage: "s0",
        subject: "seerah",
        unit: 1,
        hue: 1,
        title: { en: "Knowing Our Prophet", ar: "مَعْرِفَةُ نَبِيِّنَا" },

        quizGuide: {
            idle:    { en: "Choose an answer!", ar: "اختر الإجابة" },
            wrong:   { en: "Try again!", ar: "حاول مرة أخرى" },
            correct: { en: "Correct! أحسنت", ar: "أحسنت" },
            done:    { en: "MashaAllah! All correct!", ar: "ما شاء الله" }
        },
        quiz: [
            {
                q: { ar: "مَنْ هُوَ نَبِيُّنَا؟", en: "Who is our Prophet?" },
                options: [
                    { ar: "مُحَمَّدٌ ﷺ", en: "Muhammad ﷺ" },
                    { ar: "مُوسَى", en: "Musa" },
                    { ar: "عِيسَى", en: "Isa" }
                ],
                answer: 0
            },
            {
                q: { ar: "مَا اسْمُ خِدْمَةِ نَبِيِّنَا؟", en: "What is the name of our Prophet's city?" },
                options: [
                    { ar: "مَكَّةُ", en: "Makkah" },
                    { ar: "بَارِيسُ", en: "Paris" },
                    { ar: "لُنْدُنْ", en: "London" }
                ],
                answer: 0
            }
        ],

        nameGuide: {
            idle:    { en: "Pick a word, then tap a blank!", ar: "اختر كلمة ثم اضغط على الفراغ" },
            picked:  { en: "Now tap a blank!", ar: "الآن اختر الفراغ" },
            dragging:{ en: "Drop it on a blank!", ar: "أفلتها على الفراغ" },
            wrong:   { en: "Not this one — try again!", ar: "ليست هذه، حاول مرة أخرى" },
            done:    { en: "MashaAllah! Complete!", ar: "ما شاء الله، أكملت" }
        },
        name: [
            { label: { ar: "مُحَمَّدٌ", en: "Muhammad" }, distractors: ["عِيسَى"] },
            { label: { ar: "الرَّسُولُ", en: "The Messenger" }, distractors: ["الْمَلِكُ"] },
            { label: { ar: "مَكَّةُ", en: "Makkah" }, distractors: ["الْمَدِينَةُ"] }
        ]
    };

    /* ------------------------------------------------------------
       Stage 1 · Tawheed · Unit 1 — The First Duty of the Servants
       أَوَّلُ وَاجِبٍ عَلَى الْعِبَادِ
       Seeds: lessons/1-tawheed/s1-tawheed-1-1 … -1-3
    ------------------------------------------------------------ */
    W["s1-tawheed-1"] = {
        stage: "s1",
        subject: "tawheed",
        unit: 1,
        hue: 1,
        title: { en: "The First Duty of the Servants", ar: "أَوَّلُ وَاجِبٍ عَلَى الْعِبَادِ" },

        matchGuide: {
            idle:    { en: "Tap a Name!", ar: "اضغط على اسم" },
            picked:  { en: "Now find its proof!", ar: "الآن ابحث عن دليله" },
            wrong:   { en: "Try again!", ar: "حاول مرة أخرى" },
            correct: { en: "Correct! أحسنت", ar: "أحسنت" },
            done:    { en: "MashaAllah! All matched!", ar: "ما شاء الله" }
        },
        match: [
            {
                pair: "khalaq",
                name: { ar: "خَالِقُنَا", en: "Our Creator" },
                proof: { ref: "51:56", ar: "وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ" }
            },
            {
                pair: "rabb",
                name: { ar: "رَبُّنَا", en: "Our Lord" },
                proof: { ref: "2:21", ar: "يَا أَيُّهَا النَّاسُ اعْبُدُوا رَبَّكُمُ الَّذِي خَلَقَكُمْ" }
            },
            {
                pair: "shakireen",
                name: { ar: "الْمَعْبُودُ وَحْدَهُ", en: "Worshipped alone" },
                proof: { ref: "39:66", ar: "بَلِ اللَّهَ فَاعْبُدْ وَكُن مِّنَ الشَّاكِرِينَ" }
            },
            {
                pair: "dhikr",
                name: { ar: "الَّذِي يَدْعُو إِلَيْهِ", en: "The One we call upon" },
                proof: { ref: "13:28", ar: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ" }
            }
        ],

        fillGuide: {
            idle:    { en: "Pick a word, then tap a blank!", ar: "اختر كلمة ثم اضغط على الفراغ" },
            picked:  { en: "Now tap a blank! (or drag me)", ar: "الآن اختر الفراغ أو اسحب الكلمة إليه" },
            dragging:{ en: "Drop it on a blank!", ar: "أفلتها على الفراغ" },
            wrong:   { en: "Not this one — try again!", ar: "ليست هذه، حاول مرة أخرى" },
            done:    { en: "MashaAllah! Complete!", ar: "ما شاء الله، أكملت" }
        },
        fill: [
            {
                before: "أَوَّلُ واجِبٍ عَلَى العِبادِ: أَن يَعرِفوا ",
                answer: "رَبَّهُم",
                after: "، وَيَعبُدوهُ وَحدَهُ لا شَريكَ لَه",
                en: "The first duty upon the servants is to know their Lord and to worship Him alone, with no partner."
            },
            {
                before: "﴿وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا ",
                answer: "لِيَعْبُدُونِ",
                after: "﴾",
                ref: "51:56",
                en: "I did not create jinn and mankind except to worship Me."
            },
            {
                before: "التَّوحيدُ هُوَ: إفرادُ اللهِ تَعالى بالعِبادَةِ ",
                answer: "وَحدَه",
                after: " دونَ شَريك",
                en: "Tawheed is to single out Allah alone with all worship, without any partner."
            }
        ],
        bank: [
            "رَبَّهُم",
            "لِيَعْبُدُونِ",
            "وَحدَه",
            "مَالِكَ",
            "شَريكَ"
        ]
    };

    /* ------------------------------------------------------------
       Stage 1 · Tawheed · Unit 2 — Rububiyyah (Lordship)
       تَوْحِيدُ الرُّبُوبِيَّةِ
       Seeds: lessons/1-tawheed/s1-tawheed-2-1 … -2-6
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
                proof: { ref: "39:62", ar: "اللَّهُ خَالِقُ كُلِّ شَيْءٍ" }
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

    /* ------------------------------------------------------------
       Stage 1 · Tawheed · Unit 3 — Tawheed of Worship (Uluhiyyah)
       تَوْحِيدُ الْأُلُوهِيَّةِ
       Seeds: lessons/1-tawheed/s1-tawheed-3-1 … -3-4
    ------------------------------------------------------------ */
    W["s1-tawheed-3"] = {
        stage: "s1",
        subject: "tawheed",
        unit: 3,
        hue: 3,
        title: { en: "Tawheed of Worship (Uluhiyyah)", ar: "تَوْحِيدُ الْأُلُوهِيَّةِ" },

        quizGuide: {
            idle:    { en: "Choose an answer!", ar: "اختر الإجابة" },
            wrong:   { en: "Try again!", ar: "حاول مرة أخرى" },
            correct: { en: "Correct! أحسنت", ar: "أحسنت" },
            done:    { en: "MashaAllah! All correct!", ar: "ما شاء الله" }
        },
        quiz: [
            {
                q: { ar: "لِماذا خَلَقَنا اللهُ؟", en: "Why did Allah create us?" },
                options: [
                    { ar: "لِنَعبُدَه ونشكرَه وحدَه", en: "To worship and thank Him alone" },
                    { ar: "لِنَلعَبَ ونَلهو", en: "To play and have fun" },
                    { ar: "لِنَأكُلَ ونَشرَبَ فقط", en: "Only to eat and drink" }
                ],
                answer: 0
            },
            {
                q: { ar: "ما الذي يَفعَلُه مَن أَتَمَّ التوحيدَ وعَمِلَ به؟", en: "What happens to one who perfects Tawheed?" },
                options: [
                    { ar: "يَدخُلُ في الإسلام ويَعبُدُ اللهَ وحدَه", en: "He enters Islam and worships Allah alone" },
                    { ar: "يَخرُجُ من الإسلام", en: "He leaves Islam" },
                    { ar: "يَعبُدُ اللهَ ومعَه شَريك", en: "He worships Allah with a partner" }
                ],
                answer: 0
            },
            {
                q: { ar: "مَن الذي خَلَقَ الجنَّ والإنْسَ؟", en: "Who created the jinn and mankind?" },
                options: [
                    { ar: "اللهُ وَحدَه لا شَريكَ له", en: "Allah alone, no partner" },
                    { ar: "الشَّيطانُ", en: "The Shaytan" },
                    { ar: "البَشَرُ أنفُسُهم", en: "People themselves" }
                ],
                answer: 0
            },
            {
                q: { ar: "العِبادَةُ الصَّحيحةُ تَكونُ لِمَن؟", en: "To whom is correct worship directed?" },
                options: [
                    { ar: "للهِ وَحدَه", en: "To Allah alone" },
                    { ar: "للأَصنَامِ", en: "To idols" },
                    { ar: "للوَطَنِ", en: "To the homeland" }
                ],
                answer: 0
            }
        ]
    };

    /* ------------------------------------------------------------
       Stage 1 · Tawheed · Unit 4 — Our Religion is Islam
       دِينُنا هُوَ الْإِسْلَامُ
       Seeds: lessons/1-tawheed/s1-tawheed-4-1 … -4-5 (+ review)
    ------------------------------------------------------------ */
    W["s1-tawheed-4"] = {
        stage: "s1",
        subject: "tawheed",
        unit: 4,
        hue: 4,
        title: { en: "Our Religion Is Islam", ar: "دِينُنا هُوَ الْإِسْلَامُ" },

        quizGuide: {
            idle:    { en: "Choose an answer!", ar: "اختر الإجابة" },
            wrong:   { en: "Try again!", ar: "حاول مرة أخرى" },
            correct: { en: "Correct! أحسنت", ar: "أحسنت" },
            done:    { en: "MashaAllah! All correct!", ar: "ما شاء الله" }
        },
        quiz: [
            {
                q: { ar: "بُنِيَ الإسلامُ على كَم رُكنًا؟", en: "Upon how many pillars is Islam built?" },
                options: [
                    { ar: "خَمسةُ أَركان", en: "Five pillars" },
                    { ar: "ثلاثةُ أَركان", en: "Three pillars" },
                    { ar: "سَبعةُ أَركان", en: "Seven pillars" }
                ],
                answer: 0
            },
            {
                q: { ar: "ما أوَّلُ رُكنٍ من أَركانِ الإسلام؟", en: "Which is the first pillar of Islam?" },
                options: [
                    { ar: "الشَّهادتان", en: "The Two Testimonies" },
                    { ar: "الصَّلاة", en: "Prayer" },
                    { ar: "الحَجُّ", en: "Hajj" }
                ],
                answer: 0
            },
            {
                q: { ar: "ما الرُّكنُ الذي نُؤَدِّيه في شهرِ رمضان؟", en: "Which pillar do we perform in the month of Ramadan?" },
                options: [
                    { ar: "صَومُ رمضان", en: "Fasting Ramadan" },
                    { ar: "الزَّكاة", en: "Zakat" },
                    { ar: "الحَجُّ", en: "Hajj" }
                ],
                answer: 0
            },
            {
                q: { ar: "مَن خَلَقَنا وصَنَعَنا؟", en: "Who created us and made us?" },
                options: [
                    { ar: "اللهُ تعالى", en: "Allah the Exalted" },
                    { ar: "الشَّخصُ نَفسُه", en: "The person himself" },
                    { ar: "الطَّبيعةُ", en: "Nature" }
                ],
                answer: 0
            }
        ],

        discGuide: {
            idle:    { en: "Decide: true or false?", ar: "قَرِّر: صواب أم خطأ؟" },
            wrong:   { en: "Try again!", ar: "حاول مرة أخرى" },
            correct: { en: "Correct! أحسنت", ar: "أحسنت" },
            done:    { en: "MashaAllah! All correct!", ar: "ما شاء الله" }
        },
        disc: [
            { text: { ar: "الإسلامُ هو دِينُنا", en: "Islam is our religion." }, correct: true },
            { text: { ar: "أركانُ الإسلامِ خَمسة", en: "The pillars of Islam are five." }, correct: true },
            { text: { ar: "الصَّلاةُ من أركانِ الإسلام", en: "Prayer is one of the pillars of Islam." }, correct: true },
            { text: { ar: "نَعبُدُ شَريكًا معَ الله", en: "We worship a partner along with Allah." }, correct: false },
            { text: { ar: "الحَجُّ من أركانِ الإسلام", en: "Hajj is one of the pillars of Islam." }, correct: true }
        ],

        fillGuide: {
            idle:    { en: "Pick a word, then tap a blank!", ar: "اختر كلمة ثم اضغط على الفراغ" },
            picked:  { en: "Now tap a blank! (or drag me)", ar: "الآن اختر الفراغ أو اسحب الكلمة إليه" },
            dragging:{ en: "Drop it on a blank!", ar: "أفلتها على الفراغ" },
            wrong:   { en: "Not this one — try again!", ar: "ليست هذه، حاول مرة أخرى" },
            done:    { en: "MashaAllah! Complete!", ar: "ما شاء الله، أكملت" }
        },
        fill: [
            {
                before: "«بُنيَ الإسلامُ على خمسٍ: شهادةِ أن لا إله إلا الله وأن محمدًا رسولُ الله، وإقامِ الصلاة، وإيتاءِ الزكاة، والحجِّ، وصومِ ",
                answer: "رمضان",
                after: "»",
                en: "Islam is built upon five: the two testimonies, prayer, zakat, Hajj, and fasting Ramadan."
            },
            {
                before: "﴿وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا ",
                answer: "لِيَعْبُدُونِ",
                after: "﴾",
                ref: "51:56",
                en: "I did not create jinn and mankind except to worship Me."
            }
        ],
        bank: [
            "رمضان",
            "لِيَعْبُدُونِ",
            "الحَجِّ",
            "الزَّكَاة",
            "الوِتر"
        ]
    };

    /* ------------------------------------------------------------
       Stage 1 · Tawheed · Unit 5 — Muhammad (ﷺ) Is Our Prophet
       مُحَمَّدٌ رَسُولُ الله
       Seeds: lessons/1-tawheed/s1-tawheed-5-1 … -5-3
    ------------------------------------------------------------ */
    W["s1-tawheed-5"] = {
        stage: "s1",
        subject: "tawheed",
        unit: 5,
        hue: 5,
        title: { en: "Muhammad Is Our Prophet", ar: "مُحَمَّدٌ رَسُولُ الله" },

        matchGuide: {
            idle:    { en: "Tap a Name!", ar: "اضغط على اسم" },
            picked:  { en: "Now find its proof!", ar: "الآن ابحث عن دليله" },
            wrong:   { en: "Try again!", ar: "حاول مرة أخرى" },
            correct: { en: "Correct! أحسنت", ar: "أحسنت" },
            done:    { en: "MashaAllah! All matched!", ar: "ما شاء الله" }
        },
        match: [
            {
                pair: "rasul",
                name: { ar: "الرَّسُول", en: "The Messenger" },
                proof: { ref: "7:158", ar: "إِنِّي رَسُولُ اللَّهِ إِلَيْكُمْ جَمِيعًا" }
            },
            {
                pair: "nabi",
                name: { ar: "النَّبِيُّ", en: "The Prophet" },
                proof: { ref: "7:158", ar: "النَّبِيِّ الْأُمِّيِّ الَّذِي يُؤْمِنُ بِاللَّهِ وَكَلِمَاتِهِ" }
            },
            {
                pair: "ittiba",
                name: { ar: "الْمُتَّبَعُ", en: "The Followed" },
                proof: { ref: "7:158", ar: "وَاتَّبِعُوهُ لَعَلَّكُمْ تَهْتَدُونَ" }
            }
        ],

        discGuide: {
            idle:    { en: "Decide: true or false?", ar: "قَرِّر: صواب أم خطأ؟" },
            wrong:   { en: "Try again!", ar: "حاول مرة أخرى" },
            correct: { en: "Correct! أحسنت", ar: "أحسنت" },
            done:    { en: "MashaAllah! All correct!", ar: "ما شاء الله" }
        },
        disc: [
            { text: { ar: "مُحمَّدٌ ﷺ رَسولُ اللهِ", en: "Muhammad ﷺ is the Messenger of Allah." }, correct: true },
            { text: { ar: "نُطيعُه فيما أمر", en: "We obey him in what he commands." }, correct: true },
            { text: { ar: "نَجتَنِبُ ما نَهى عنه", en: "We avoid what he forbade." }, correct: true },
            { text: { ar: "نَعبُدُ اللهَ بما شِئنا من غيرِ الشَّرع", en: "We worship Allah however we like, without the Shariah." }, correct: false },
            { text: { ar: "لا نُصدِّقُ بشيءٍ مما أخبَرَ به", en: "We do not believe anything he informed us of." }, correct: false }
        ]
    };

    /* ------------------------------------------------------------
       Stage 1 · Fiqh · Unit 1 — Dealing with the Book of Allah
       فقه التعامل مع كتاب الله
       Seeds: lessons/1-fiqh/s1-fiqh-0-1
    ------------------------------------------------------------ */
    W["s1-fiqh-1"] = {
        stage: "s1",
        subject: "fiqh",
        unit: 1,
        hue: 1,
        title: { en: "Dealing with the Book of Allah", ar: "فقه التعامل مع كتاب الله" },

        quizGuide: {
            idle:    { en: "Choose an answer!", ar: "اختر الإجابة" },
            wrong:   { en: "Try again!", ar: "حاول مرة أخرى" },
            correct: { en: "Correct! أحسنت", ar: "أحسنت" },
            done:    { en: "MashaAllah! All correct!", ar: "ما شاء الله" }
        },
        quiz: [
            {
                q: { ar: "ما هو كتابُ اللهِ الذي أنزَلَه على نبيِّه؟", en: "What is the Book that Allah revealed to His Prophet?" },
                options: [
                    { ar: "القُرآنُ الكريم", en: "The Noble Quran" },
                    { ar: "التَّوراة", en: "The Torah" },
                    { ar: "الإنجيلُ", en: "The Gospel" }
                ],
                answer: 0
            },
            {
                q: { ar: "قَبْلَ أن نَقرأَ القُرآنَ ماذا نَقول؟", en: "What do we say before reading the Quran?" },
                options: [
                    { ar: "أَعوذُ باللهِ من الشَّيطانِ الرَّجيم", en: "I seek refuge in Allah from the accursed Shaytan" },
                    { ar: "لا شيء", en: "Nothing" },
                    { ar: "كلامًا عاديًّا", en: "Ordinary speech" }
                ],
                answer: 0
            },
            {
                q: { ar: "كيف نُعامِلُ القُرآنَ عندَ القِراءة؟", en: "How do we treat the Quran when reading?" },
                options: [
                    { ar: "بِتَعظيمٍ وخُشوع", en: "With reverence and humility" },
                    { ar: "بِلا مُبالاة", en: "Carelessly" },
                    { ar: "نُلاعِبُ بهِ", en: "Playing with it" }
                ],
                answer: 0
            }
        ],

        discGuide: {
            idle:    { en: "Decide: true or false?", ar: "قَرِّر: صواب أم خطأ؟" },
            wrong:   { en: "Try again!", ar: "حاول مرة أخرى" },
            correct: { en: "Correct! أحسنت", ar: "أحسنت" },
            done:    { en: "MashaAllah! All correct!", ar: "ما شاء الله" }
        },
        disc: [
            { text: { ar: "القُرآنُ كلامُ اللهِ", en: "The Quran is the Speech of Allah." }, correct: true },
            { text: { ar: "نَضَعُ القُرآنَ على الأَرضِ بلا رِفق", en: "We put the Quran on the floor carelessly." }, correct: false },
            { text: { ar: "نَقرأُ القُرآنَ بِتَدَبُّرٍ", en: "We read the Quran with reflection." }, correct: true }
        ]
    };

    /* ------------------------------------------------------------
       Stage 1 · Fiqh · Unit 2 — Dealing with Others
       فقه التعامل · آداب السلام
       Seeds: lessons/1-fiqh/s1-fiqh-1-1 … -1-7
    ------------------------------------------------------------ */
    W["s1-fiqh-2"] = {
        stage: "s1",
        subject: "fiqh",
        unit: 2,
        hue: 2,
        title: { en: "Dealing with Others", ar: "فقه التعامل" },

        quizGuide: {
            idle:    { en: "Choose an answer!", ar: "اختر الإجابة" },
            wrong:   { en: "Try again!", ar: "حاول مرة أخرى" },
            correct: { en: "Correct! أحسنت", ar: "أحسنت" },
            done:    { en: "MashaAllah! All correct!", ar: "ما شاء الله" }
        },
        quiz: [
            {
                q: { ar: "مَتى نُسَلِّمُ على أَخينا المُسلِم؟", en: "When do we give salam to a Muslim brother?" },
                options: [
                    { ar: "كُلَّما لَقِينا هُ", en: "Whenever we meet him" },
                    { ar: "في العِيدِ فقط", en: "Only on Eid" },
                    { ar: "لا نُسَلِّمُ أبدًا", en: "Never" }
                ],
                answer: 0
            },
            {
                q: { ar: "قال النبي ﷺ: «أَفْشُوا السَّلامَ...»", en: "The Prophet ﷺ said: 'Spread the salam...'" },
                options: [
                    { ar: "بَيْنَكُمْ", en: "among you" },
                    { ar: "لِلوَزارَةِ", en: "to the ministry" },
                    { ar: "لِلْجِيرَانِ فقط", en: "only to neighbors" }
                ],
                answer: 0
            },
            {
                q: { ar: "السَّلامُ بَيْنَ المُسلِمينَ هِبَةٌ وَ...", en: "The salam among Muslims is a gift of..." },
                options: [
                    { ar: "مَحَبَّة", en: "love" },
                    { ar: "كَراهِيَة", en: "hatred" },
                    { ar: "تَعَب", en: "tiredness" }
                ],
                answer: 0
            }
        ],

        discGuide: {
            idle:    { en: "Decide: true or false?", ar: "قَرِّر: صواب أم خطأ؟" },
            wrong:   { en: "Try again!", ar: "حاول مرة أخرى" },
            correct: { en: "Correct! أحسنت", ar: "أحسنت" },
            done:    { en: "MashaAllah! All correct!", ar: "ما شاء الله" }
        },
        disc: [
            { text: { ar: "نُسَلِّمُ عَلى إِخوانِنا كُلَّما لَقِيناهُم", en: "We greet our brothers whenever we meet them." }, correct: true },
            { text: { ar: "نُفْشي السَّلامَ بَيْنَنا", en: "We spread the salam among us." }, correct: true },
            { text: { ar: "السَّلامُ فِعلٌ مَكروه", en: "The salam is a disliked act." }, correct: false }
        ]
    };

    /* ------------------------------------------------------------
       Stage 1 · Fiqh · Unit 3 — Purity & Wudu
       الطهارة والوضوء
       Seeds: lessons/1-fiqh/s1-fiqh-2-1 … -2-6
    ------------------------------------------------------------ */
    W["s1-fiqh-3"] = {
        stage: "s1",
        subject: "fiqh",
        unit: 3,
        hue: 3,
        title: { en: "Purity & Wudu", ar: "الطهارة والوضوء" },

        quizGuide: {
            idle:    { en: "Choose an answer!", ar: "اختر الإجابة" },
            wrong:   { en: "Try again!", ar: "حاول مرة أخرى" },
            correct: { en: "Correct! أحسنت", ar: "أحسنت" },
            done:    { en: "MashaAllah! All correct!", ar: "ما شاء الله" }
        },
        quiz: [
            {
                q: { ar: "الإسلامُ يُحِبُّ الطَّهارةَ في...", en: "Islam loves purity in..." },
                options: [
                    { ar: "البَدَنِ والثَّوبِ والمَكانِ", en: "body, clothes, and place" },
                    { ar: "الأَكْلِ فقط", en: "only eating" },
                    { ar: "لا شيء", en: "nothing" }
                ],
                answer: 0
            },
            {
                q: { ar: "﴿إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ وَيُحِبُّ الْمُتَطَهِّرِينَ﴾ فِيمَ تَدُلُّ الآيَةُ؟", en: "What does this ayah indicate?" },
                options: [
                    { ar: "اللهُ يُحِبُّ الطَّهارة", en: "Allah loves purity" },
                    { ar: "اللهُ يُحِبُّ الفَوضى", en: "Allah loves mess" },
                    { ar: "لا دلالة", en: "No indication" }
                ],
                answer: 0
            },
            {
                q: { ar: "الوُضوءُ تَهيئةٌ للـ...", en: "Wudu is a preparation for..." },
                options: [
                    { ar: "الصَّلاة", en: "prayer" },
                    { ar: "اللَّعِب", en: "play" },
                    { ar: "النَّوم", en: "sleep" }
                ],
                answer: 0
            }
        ],

        fillGuide: {
            idle:    { en: "Pick a word, then tap a blank!", ar: "اختر كلمة ثم اضغط على الفراغ" },
            picked:  { en: "Now tap a blank! (or drag me)", ar: "الآن اختر الفراغ أو اسحب الكلمة إليه" },
            dragging:{ en: "Drop it on a blank!", ar: "أفلتها على الفراغ" },
            wrong:   { en: "Not this one — try again!", ar: "ليست هذه، حاول مرة أخرى" },
            done:    { en: "MashaAllah! Complete!", ar: "ما شاء الله، أكملت" }
        },
        fill: [
            {
                before: "الإسلامُ يُحِبُّ الطَّهارةَ في كُلِّ شيءٍ: طَهارةَ "
                ,
                answer: "البَدنِ",
                after: "، والثَّوبِ، والمَكانِ",
                en: "Islam loves purity in everything: a clean body, clean clothes, and a clean place."
            }
        ],
        bank: ["البَدنِ", "الثَّوبِ", "المَكانِ", "الطَّعامِ", "المالِ"]
    };

    /* ------------------------------------------------------------
       Stage 1 · Fiqh · Unit 4 — Prayer
       الصلاة
       Seeds: lessons/1-fiqh/s1-fiqh-3-1 … -3-7
    ------------------------------------------------------------ */
    W["s1-fiqh-4"] = {
        stage: "s1",
        subject: "fiqh",
        unit: 4,
        hue: 4,
        title: { en: "Prayer", ar: "الصلاة" },

        quizGuide: {
            idle:    { en: "Choose an answer!", ar: "اختر الإجابة" },
            wrong:   { en: "Try again!", ar: "حاول مرة أخرى" },
            correct: { en: "Correct! أحسنت", ar: "أحسنت" },
            done:    { en: "MashaAllah! All correct!", ar: "ما شاء الله" }
        },
        quiz: [
            {
                q: { ar: "الصَّلاةُ رُكنٌ من...", en: "Prayer is a pillar of..." },
                options: [
                    { ar: "أَركانِ الإسلام", en: "the pillars of Islam" },
                    { ar: "أَركانِ البَيت", en: "the house pillars" },
                    { ar: "لا شيء", en: "nothing" }
                ],
                answer: 0
            },
            {
                q: { ar: "نَستَقبِلُ في الصَّلاةِ الـ...", en: "In prayer we face the..." },
                options: [
                    { ar: "القِبلَة", en: "Qiblah" },
                    { ar: "الغَرب", en: "west" },
                    { ar: "الجِبال", en: "mountains" }
                ],
                answer: 0
            },
            {
                q: { ar: "الصَّلاةُ تُصَلَّى في...", en: "Prayer is performed..." },
                options: [
                    { ar: "أَوقاتٍ مَحدودة", en: "at fixed times" },
                    { ar: "أَيُّ وقتٍ نشاء", en: "whenever we like" },
                    { ar: "مرةً في السنة", en: "once a year" }
                ],
                answer: 0
            }
        ]
    };

    /* ------------------------------------------------------------
       Stage 2 · Tawheed · Unit 1 — Knowing the Three Principles
       مَعْرِفَةُ الأُصُولِ الثَّلَاثَةِ
       Seeds: lessons/2-tawheed/s2-tawheed-1-1 … -1-4
    ------------------------------------------------------------ */
    W["s2-tawheed-1"] = {
        stage: "s2",
        subject: "tawheed",
        unit: 1,
        hue: 1,
        title: { en: "Knowing the Three Principles", ar: "مَعْرِفَةُ الأُصُولِ الثَّلَاثَةِ" },

        quizGuide: {
            idle:    { en: "Choose an answer!", ar: "اختر الإجابة" },
            wrong:   { en: "Try again!", ar: "حاول مرة أخرى" },
            correct: { en: "Correct! أحسنت", ar: "أحسنت" },
            done:    { en: "MashaAllah! All correct!", ar: "ما شاء الله" }
        },
        quiz: [
            {
                q: { ar: "ما الأُصولُ التي يَجِبُ على المُسلِمِ مَعرِفتُها؟", en: "What are the principles the Muslim must know?" },
                options: [
                    { ar: "مَعرِفةُ اللهِ، ومَعرِفةُ دِينِه، ومَعرِفةُ نبيِّه", en: "Knowing Allah, His religion, and His Prophet" },
                    { ar: "مَعرِفةُ الدُّنيا فقط", en: "Knowing only the world" },
                    { ar: "مَعرِفةُ الأَخبارِ المُتَجدِّدة", en: "Knowing the latest news" }
                ],
                answer: 0
            },
            {
                q: { ar: "مَن خَلَقَنا ورَزَقَنا؟", en: "Who created us and provided for us?" },
                options: [
                    { ar: "اللهُ وَحدَه", en: "Allah alone" },
                    { ar: "أَبُوانا", en: "Our parents" },
                    { ar: "النَّاسُ", en: "People" }
                ],
                answer: 0
            },
            {
                q: { ar: "ما هو دِينُنا؟", en: "What is our religion?" },
                options: [
                    { ar: "الإسلام", en: "Islam" },
                    { ar: "اليهوديَّة", en: "Judaism" },
                    { ar: "النَّصرانيَّة", en: "Christianity" }
                ],
                answer: 0
            },
            {
                q: { ar: "مَن هو نَبيُّنا؟", en: "Who is our Prophet?" },
                options: [
                    { ar: "مُحمَّدٌ ﷺ", en: "Muhammad ﷺ" },
                    { ar: "موسى عليه السلام", en: "Musa (peace be upon him)" },
                    { ar: "عيسى عليه السلام", en: "Isa (peace be upon him)" }
                ],
                answer: 0
            }
        ],

        fillGuide: {
            idle:    { en: "Pick a word, then tap a blank!", ar: "اختر كلمة ثم اضغط على الفراغ" },
            picked:  { en: "Now tap a blank! (or drag me)", ar: "الآن اختر الفراغ أو اسحب الكلمة إليه" },
            dragging:{ en: "Drop it on a blank!", ar: "أفلتها على الفراغ" },
            wrong:   { en: "Not this one — try again!", ar: "ليست هذه، حاول مرة أخرى" },
            done:    { en: "MashaAllah! Complete!", ar: "ما شاء الله، أكملت" }
        },
        fill: [
            {
                before: " الأُصولُ الثلاثةُ: مَعرِفةُ ",
                answer: "الله",
                after: "، ومَعرِفةُ دِينِهِ، ومَعرِفةُ نبيِّهِ",
                en: "The three principles: knowing Allah, His religion, and His Prophet."
            },
            {
                before: "دِينُنا ",
                answer: "الإسلام",
                after: "",
                en: "Our religion is Islam."
            },
            {
                before: "نَبيُّنا ",
                answer: "مُحَمَّدٌ",
                after: " ﷺ",
                en: "Our Prophet is Muhammad ﷺ."
            }
        ],
        bank: [
            "الله",
            "الإسلام",
            "مُحَمَّدٌ",
            "الصَّوم",
            "التَّوراة"
        ]
    };

    /* ------------------------------------------------------------
       Stage 2 · Tawheed · Unit 3 — Worship & Shirk (Uloohiyyah)
       العِبَادَةُ وَمَا يُضَادُّهَا مِنَ الشِّرْكِ
       Seeds: lessons/2-tawheed/s2-tawheed-3-1 … -3-5
    ------------------------------------------------------------ */
    W["s2-tawheed-3"] = {
        stage: "s2",
        subject: "tawheed",
        unit: 3,
        hue: 3,
        title: { en: "Worship & Its Opposite: Shirk", ar: "الْعِبَادَةُ وَمَا يُضَادُّهَا مِنَ الشِّرْكِ" },

        quizGuide: {
            idle:    { en: "Choose an answer!", ar: "اختر الإجابة" },
            wrong:   { en: "Try again!", ar: "حاول مرة أخرى" },
            correct: { en: "Correct! أحسنت", ar: "أحسنت" },
            done:    { en: "MashaAllah! All correct!", ar: "ما شاء الله" }
        },
        quiz: [
            {
                q: { ar: "مَا هِيَ عِبَادَةُ اللهِ؟", en: "What is the worship of Allah?" },
                options: [
                    { ar: "تَوْحِيدُهُ وَطَاعَتُهُ", en: "Declaring His oneness and obeying Him" },
                    { ar: "مَعْصِيَتُهُ", en: "Disobeying Him" },
                    { ar: "نِسْيَانُهُ", en: "Forgetting Him" }
                ],
                answer: 0
            },
            {
                q: { ar: "خَلَقَنا اللهُ لِـ...", en: "Allah created us to..." },
                options: [
                    { ar: "عِبَادَتِهِ وَحْدَهُ", en: "worship Him alone" },
                    { ar: "اللَّعِبِ", en: "play" },
                    { ar: "البُكاءِ", en: "crying" }
                ],
                answer: 0
            },
            {
                q: { ar: "الشِّرْكُ بِاللهِ هُوَ...", en: "Shirk with Allah is..." },
                options: [
                    { ar: "صَرْفُ العِبَادَةِ لِغَيْرِ اللهِ", en: "directing worship to other than Allah" },
                    { ar: "تَوْحِيدُ اللهِ", en: "Tawheed of Allah" },
                    { ar: "طَاعَةُ اللهِ", en: "obedience to Allah" }
                ],
                answer: 0
            }
        ],

        fillGuide: {
            idle:    { en: "Pick a word, then tap a blank!", ar: "اختر كلمة ثم اضغط على الفراغ" },
            picked:  { en: "Now tap a blank! (or drag me)", ar: "الآن اختر الفراغ أو اسحب الكلمة إليه" },
            dragging:{ en: "Drop it on a blank!", ar: "أفلتها على الفراغ" },
            wrong:   { en: "Not this one — try again!", ar: "ليست هذه، حاول مرة أخرى" },
            done:    { en: "MashaAllah! Complete!", ar: "ما شاء الله، أكملت" }
        },
        fill: [
            {
                before: "﴿وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا ",
                answer: "لِيَعْبُدُونِ",
                after: "﴾",
                ref: "51:56",
                en: "I did not create jinn and mankind except to worship Me."
            },
            {
                before: "عِبَادَةُ اللهِ هِيَ ",
                answer: "تَوْحِيدُهُ",
                after: " وَطَاعَتُهُ",
                en: "The worship of Allah is declaring His oneness and obeying Him."
            }
        ],
        bank: [
            "لِيَعْبُدُونِ",
            "تَوْحِيدُهُ",
            "اللَّعِبُ",
            "لِيَأْكُلُوا",
            "شِركًا"
        ]
    };

    /* ------------------------------------------------------------
       Stage 2 · Tawheed · Unit 4 — Knowing One's Religion
       مَعْرِفَةُ العَبْدِ دِينَهُ
       Seeds: lessons/2-tawheed/s2-tawheed-4-1 … -4-4
    ------------------------------------------------------------ */
    W["s2-tawheed-4"] = {
        stage: "s2",
        subject: "tawheed",
        unit: 4,
        hue: 4,
        title: { en: "Knowing One's Religion", ar: "مَعْرِفَةُ العَبْدِ دِينَهُ" },

        quizGuide: {
            idle:    { en: "Choose an answer!", ar: "اختر الإجابة" },
            wrong:   { en: "Try again!", ar: "حاول مرة أخرى" },
            correct: { en: "Correct! أحسنت", ar: "أحسنت" },
            done:    { en: "MashaAllah! All correct!", ar: "ما شاء الله" }
        },
        quiz: [
            {
                q: { ar: "الإسْلامُ هُوَ: الاسْتِسْلامُ للهِ بِـ...", en: "Islam is submitting to Allah through..." },
                options: [
                    { ar: "التَّوْحِيدِ", en: "Tawheed" },
                    { ar: "الشِّرْكِ", en: "Shirk" },
                    { ar: "الكُفْرِ", en: "Kufr" }
                ],
                answer: 0
            },
            {
                q: { ar: "الإسْلامُ دِينِي، وَهُوَ الدِّينُ...", en: "Islam is my religion, and it is the..." },
                options: [
                    { ar: "الحَقُّ", en: "true religion" },
                    { ar: "الباطِلُ", en: "false religion" },
                    { ar: "القَديمُ", en: "old religion" }
                ],
                answer: 0
            },
            {
                q: { ar: "مَنْ يَبْتَغِ غَيْرَ الإسْلامِ دِينًا فَلَنْ يُقْبَلَ مِنْهُ، وَهُوَ مِنَ...", en: "Whoever seeks a religion other than Islam, it will never be accepted, and he will be among..." },
                options: [
                    { ar: "الْخَاسِرِينَ", en: "the losers" },
                    { ar: "الرَّابِحِينَ", en: "the winners" },
                    { ar: "الصَّادِقِينَ", en: "the truthful" }
                ],
                answer: 0
            },
            {
                q: { ar: "مَعْرِفَةُ مَنَازِلِ العِبَادَةِ..." },
                options: [
                    { ar: "الإسلام، الإيمان، الإحسان", en: "Islam, Iman, Ihsan" },
                    { ar: "اللَّعِبُ وَالنَّوْمُ", en: "Play and sleep" },
                    { ar: "الأَكْلُ وَالشُّرْبُ", en: "Eating and drinking" }
                ],
                answer: 0
            }
        ],

        discGuide: {
            idle:    { en: "Decide: true or false?", ar: "قَرِّر: صواب أم خطأ؟" },
            wrong:   { en: "Try again!", ar: "حاول مرة أخرى" },
            correct: { en: "Correct! أحسنت", ar: "أحسنت" },
            done:    { en: "MashaAllah! All correct!", ar: "ما شاء الله" }
        },
        disc: [
            { text: { ar: "الإسلامُ هو الاستسلامُ لله بالتوحيد", en: "Islam is submitting to Allah through tawheed." }, correct: true },
            { text: { ar: "الإسلامُ دينٌ باطل", en: "Islam is a false religion." }, correct: false },
            { text: { ar: "البراءة من الشرك وأهله من لوازم الإسلام", en: "Being free from shirk and its people is part of Islam." }, correct: true }
        ]
    };

    /* ------------------------------------------------------------
       Stage 2 · Tawheed · Unit 5 — Knowing the Prophet
       مَعْرِفَةُ العَبْدِ نَبِيَّهُ
       Seeds: lessons/2-tawheed/s2-tawheed-5-1 … -5-3
    ------------------------------------------------------------ */
    W["s2-tawheed-5"] = {
        stage: "s2",
        subject: "tawheed",
        unit: 5,
        hue: 5,
        title: { en: "Knowing the Prophet", ar: "مَعْرِفَةُ العَبْدِ نَبِيَّهُ" },

        matchGuide: {
            idle:    { en: "Tap a Name!", ar: "اضغط على اسم" },
            picked:  { en: "Now find its proof!", ar: "الآن ابحث عن دليله" },
            wrong:   { en: "Try again!", ar: "حاول مرة أخرى" },
            correct: { en: "Correct! أحسنت", ar: "أحسنت" },
            done:    { en: "MashaAllah! All matched!", ar: "ما شاء الله" }
        },
        match: [
            {
                pair: "nabi",
                name: { ar: "نَبِيُّنا", en: "Our Prophet" },
                proof: { ref: "7:158", ar: "إِنِّي رَسُولُ اللَّهِ إِلَيْكُمْ جَمِيعًا" }
            },
            {
                pair: "makkah",
                name: { ar: "مُحَمَّدٌ ﷺ", en: "Muhammad ﷺ" },
                proof: { ref: "7:158", ar: "النَّبِيِّ الْأُمِّيِّ الَّذِي يُؤْمِنُ بِاللَّهِ وَكَلِمَاتِهِ" }
            }
        ],
        quizGuide: {
            idle:    { en: "Choose an answer!", ar: "اختر الإجابة" },
            wrong:   { en: "Try again!", ar: "حاول مرة أخرى" },
            correct: { en: "Correct! أحسنت", ar: "أحسنت" },
            done:    { en: "MashaAllah! All correct!", ar: "ما شاء الله" }
        },
        quiz: [
            {
                q: { ar: "مُحَمَّدٌ ﷺ هُوَ نَبِيُّنا وَ...", en: "Muhammad ﷺ is our Prophet and..." },
                options: [
                    { ar: "رَسُولُ اللهِ", en: "the Messenger of Allah" },
                    { ar: "مَلِكُ المَدِينَةِ", en: "king of Madinah" },
                    { ar: "تَاجِرٌ فَقَطْ", en: "just a merchant" }
                ],
                answer: 0
            },
            {
                q: { ar: "مَاذَا نَفْعَلُ مَعَ أَمْرِ النَّبِيِّ ﷺ؟", en: "What do we do with the Prophet's command?" },
                options: [
                    { ar: "نُطِيعُهُ", en: "We obey him" },
                    { ar: "نُخَالِفُهُ", en: "We oppose him" },
                    { ar: "نَتَسَاهَلُ", en: "We are careless" }
                ],
                answer: 0
            }
        ]
    };

    /* ------------------------------------------------------------
       Stage 2 · Fiqh · Unit 1 — Purity (Taharah)
       الطهارة
       Seeds: lessons/2-fiqh/s2-fiqh-1-1 … -1-8
    ------------------------------------------------------------ */
    W["s2-fiqh-1"] = {
        stage: "s2",
        subject: "fiqh",
        unit: 1,
        hue: 1,
        title: { en: "Purity (Taharah)", ar: "الطَّهَارَةُ" },

        quizGuide: {
            idle:    { en: "Choose an answer!", ar: "اختر الإجابة" },
            wrong:   { en: "Try again!", ar: "حاول مرة أخرى" },
            correct: { en: "Correct! أحسنت", ar: "أحسنت" },
            done:    { en: "MashaAllah! All correct!", ar: "ما شاء الله" }
        },
        quiz: [
            {
                q: { ar: "الطَّهَارَةُ هِيَ: إِزَالَةُ الحَدَثِ وَالـ...", en: "Taharah is removing ritual impurity and..." },
                options: [
                    { ar: "النَّجَاسَةِ", en: "filth" },
                    { ar: "المَالِ", en: "money" },
                    { ar: "الطَّعَامِ", en: "food" }
                ],
                answer: 0
            },
            {
                q: { ar: "قَالَ رَسُولُ اللهِ ﷺ: «الطُّهُورُ...»", en: "The Messenger of Allah said: 'Purification is...'" },
                options: [
                    { ar: "شَطْرُ الإِيْمَانِ", en: "half of faith" },
                    { ar: "نِصْفُ المَالِ", en: "half of wealth" },
                    { ar: "ثُلُثُ العِلْمِ", en: "a third of knowledge" }
                ],
                answer: 0
            },
            {
                q: { ar: "لا تَصِحُّ الصَّلاةُ إِلا بِـ...", en: "Prayer is not valid except with..." },
                options: [
                    { ar: "الطَّهَارَةِ", en: "taharah" },
                    { ar: "الطَّعَامِ", en: "food" },
                    { ar: "اللَّبَاسِ الجَدِيدِ", en: "new clothes" }
                ],
                answer: 0
            }
        ],

        discGuide: {
            idle:    { en: "Decide: true or false?", ar: "قَرِّر: صواب أم خطأ؟" },
            wrong:   { en: "Try again!", ar: "حاول مرة أخرى" },
            correct: { en: "Correct! أحسنت", ar: "أحسنت" },
            done:    { en: "MashaAllah! All correct!", ar: "ما شاء الله" }
        },
        disc: [
            { text: { ar: "الطَّهَارَةُ نِظَافَةُ دِينِ الإسْلامِ", en: "Purity is a cleanliness that belongs to Islam." }, correct: true },
            { text: { ar: "التَّيَمُّمُ مِنْ طُرُقِ الطَّهَارَةِ", en: "Tayammum is one of the ways of purification." }, correct: true },
            { text: { ar: "لا نُبَالِي بِالنَّجَاسَةِ فِي الصَّلاةِ", en: "We don't care about filth during prayer." }, correct: false }
        ]
    };

    /* ------------------------------------------------------------
       Stage 2 · Fiqh · Unit 2 — The Virtue of Prayer
       فَضْلُ الصَّلاةِ
       Seeds: lessons/2-fiqh/s2-fiqh-2-1 … -2-6
    ------------------------------------------------------------ */
    W["s2-fiqh-2"] = {
        stage: "s2",
        subject: "fiqh",
        unit: 2,
        hue: 2,
        title: { en: "The Virtue of Prayer", ar: "فَضْلُ الصَّلاةِ" },

        quizGuide: {
            idle:    { en: "Choose an answer!", ar: "اختر الإجابة" },
            wrong:   { en: "Try again!", ar: "حاول مرة أخرى" },
            correct: { en: "Correct! أحسنت", ar: "أحسنت" },
            done:    { en: "MashaAllah! All correct!", ar: "ما شاء الله" }
        },
        quiz: [
            {
                q: { ar: "الصَّلاةُ هِيَ الرُّكْنُ ... مِنْ أَرْكَانِ الإسْلامِ", en: "Prayer is the ... pillar of Islam" },
                options: [
                    { ar: "الثَّانِي", en: "second" },
                    { ar: "الْأَوَّلُ", en: "first" },
                    { ar: "الْخَامِسُ", en: "fifth" }
                ],
                answer: 0
            },
            {
                q: { ar: "الصَّلاةُ خَيْرُ الأَعْمَالِ بَعْدَ...", en: "Prayer is the best deed after..." },
                options: [
                    { ar: "التَّوْحِيدِ", en: "tawheed" },
                    { ar: "الطَّعَامِ", en: "food" },
                    { ar: "النَّوْمِ", en: "sleep" }
                ],
                answer: 0
            },
            {
                q: { ar: "الصَّلاةُ مِفْتَاحُ...", en: "Prayer is the key to..." },
                options: [
                    { ar: "الجَنَّةِ", en: "Paradise" },
                    { ar: "البَيْتِ", en: "the house" },
                    { ar: "المُتْجَرِ", en: "the shop" }
                ],
                answer: 0
            }
        ]
    };

    /* ------------------------------------------------------------
       Stage 2 · Fiqh · Unit 3 — The Prayer of the Prophet ﷺ
       صِفَةُ الصَّلاةِ
       Seeds: lessons/2-fiqh/s2-fiqh-3-1 … -3-7
    ------------------------------------------------------------ */
    W["s2-fiqh-3"] = {
        stage: "s2",
        subject: "fiqh",
        unit: 3,
        hue: 3,
        title: { en: "The Prayer of the Prophet ﷺ", ar: "صِفَةُ الصَّلاةِ" },

        quizGuide: {
            idle:    { en: "Choose an answer!", ar: "اختر الإجابة" },
            wrong:   { en: "Try again!", ar: "حاول مرة أخرى" },
            correct: { en: "Correct! أحسنت", ar: "أحسنت" },
            done:    { en: "MashaAllah! All correct!", ar: "ما شاء الله" }
        },
        quiz: [
            {
                q: { ar: "يَسْتَقْبِلُ المُسْلِمُ فِي الصَّلاةِ الْـ...", en: "In prayer the Muslim faces the..." },
                options: [
                    { ar: "قِبْلَةَ", en: "qiblah" },
                    { ar: "شَمْسَ", en: "sun" },
                    { ar: "بَحْرَ", en: "sea" }
                ],
                answer: 0
            },
            {
                q: { ar: "مَا هِيَ القِبْلَةُ؟", en: "What is the qiblah?" },
                options: [
                    { ar: "الكَعْبَةُ", en: "the Ka'bah" },
                    { ar: "البَيْتُ العَتِيقُ الجَدِيدُ بَعْدَهُ", en: "a new house" },
                    { ar: "الجَبَلُ", en: "the mountain" }
                ],
                answer: 0
            },
            {
                q: { ar: "نَقُولُ عِنْدَ بَدْءِ الصَّلاةِ: اللهُ...", en: "At the start of prayer we say: Allahu..." },
                options: [
                    { ar: "أَكْبَرُ", en: "Akbar" },
                    { ar: "يَرْحَمُ", en: "Yarham" },
                    { ar: "يَغْفِرُ", en: "Yaghfir" }
                ],
                answer: 0
            },
            {
                q: { ar: "أَيْنَ نَجْعَلُ أَيْدِيْنَا عِنْدَ تَكْبِيرَةِ الإحْرَامِ؟", en: "Where do we put our hands at takbirat al-ihram?" },
                options: [
                    { ar: "حَذْوَ مَنْكِبَيْنَا", en: "to shoulder level" },
                    { ar: "عَلَى الأَرْضِ", en: "on the ground" },
                    { ar: "فِي جُيُوبِنَا", en: "in our pockets" }
                ],
                answer: 0
            }
        ],

        fillGuide: {
            idle:    { en: "Pick a word, then tap a blank!", ar: "اختر كلمة ثم اضغط على الفراغ" },
            picked:  { en: "Now tap a blank! (or drag me)", ar: "الآن اختر الفراغ أو اسحب الكلمة إليه" },
            dragging:{ en: "Drop it on a blank!", ar: "أفلتها على الفراغ" },
            wrong:   { en: "Not this one — try again!", ar: "ليست هذه، حاول مرة أخرى" },
            done:    { en: "MashaAllah! Complete!", ar: "ما شاء الله، أكملت" }
        },
        fill: [
            {
                before: "يَسْتَقْبِلُ المُسْلِمُ ",
                answer: "القِبْلَةَ",
                after: "، وَهِيَ الكَعْبَةُ",
                en: "The Muslim faces the qiblah, which is the Ka'bah."
            }
        ],
        bank: [
            "القِبْلَةَ",
            "الكَعْبَةُ",
            "أَكْبَرُ",
            "مَنْكِبَيْنَا",
            "الدُّنْيَا"
        ]
    };

    /* ------------------------------------------------------------
       Stage 2 · Tawheed · Unit 2 — Knowing One's Lord (Rububiyyah)
       مَعْرِفَةُ الْعَبْدِ رَبَّهُ (تَوْحِيدُ الرُّبُوبِيَّةِ)
       Seeds: lessons/2-tawheed/s2-tawheed-2-1 … -2-3
    ------------------------------------------------------------ */
    W["s2-tawheed-2"] = {
        stage: "s2",
        subject: "tawheed",
        unit: 2,
        hue: 2,
        title: { en: "Knowing One's Lord (Rububiyyah)", ar: "مَعْرِفَةُ الْعَبْدِ رَبَّهُ (تَوْحِيدُ الرُّبُوبِيَّةِ)" },

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
                proof: { ref: "39:62", ar: "اللَّهُ خَالِقُ كُلِّ شَيْءٍ" }
            },
            {
                pair: "razzaq",
                name: { ar: "الرَّزَّاقُ", en: "Ar-Razzaq" },
                proof: { ref: "51:58", ar: "إِنَّ اللَّهَ هُوَ الرَّزَّاقُ ذُو الْقُوَّةِ الْمَتِينُ" }
            },
            {
                pair: "muhyi",
                name: { ar: "يُحْيِي وَيُمِيتُ", en: "Gives life & death" },
                proof: { ref: "10:56", ar: "هُوَ يُحْيِي وَيُمِيتُ وَإِلَيْهِ تُرْجَعُونَ" }
            },
            {
                pair: "malik",
                name: { ar: "الْمَالِكُ", en: "Al-Malik" },
                proof: { ref: "2:255", ar: "لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ" }
            }
        ],

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
                before: "هُوَ ",
                answer: "يُحْيِي",
                after: " وَيُمِيتُ",
                ref: "10:56",
                en: "He gives life and causes death."
            }
        ],
        bank: [
            "خَالِقُ",
            "يُحْيِي",
            "الرَّزَّاقُ",
            "الْمَالِكُ",
            "نَبِيٌّ"
        ]
    };

    /* ------------------------------------------------------------
       Stage 2 · Adhkar · Unit 1 — Daily Remembrances
       الأَذْكَارُ اليَوْمِيَّة
       Seeds: lessons/2-adhkar/s2-adhkar-1 … -7
    ------------------------------------------------------------ */
    W["s2-adhkar-1"] = {
        stage: "s2",
        subject: "adhkar",
        unit: 1,
        hue: 1,
        title: { en: "Daily Remembrances", ar: "الأَذْكَارُ اليَوْمِيَّة" },

        quizGuide: {
            idle:    { en: "Choose an answer!", ar: "اختر الإجابة" },
            wrong:   { en: "Try again!", ar: "حاول مرة أخرى" },
            correct: { en: "Correct! أحسنت", ar: "أحسنت" },
            done:    { en: "MashaAllah! All correct!", ar: "ما شاء الله" }
        },
        quiz: [
            {
                q: { ar: "قَبْلَ النَّوْمِ مَاذَا نَقُولُ؟", en: "What do we say before sleeping?" },
                options: [
                    { ar: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا", en: "Bismika Allahumma amutu wa ahya" },
                    { ar: "لَا شَيْءَ", en: "Nothing" },
                    { ar: "نُغَنِّي", en: "We sing" }
                ],
                answer: 0
            },
            {
                q: { ar: "بَعْدَ الِاسْتِيقَاظِ مَاذَا نَقُولُ؟", en: "What do we say upon waking?" },
                options: [
                    { ar: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا", en: "Alhamdu lillahilladhi ahyana ba'da ma amatana" },
                    { ar: "صَبَاحُ الْخَيْرِ فَقَطْ", en: "Just good morning" },
                    { ar: "يَا عَالَمُ", en: "Oh world" }
                ],
                answer: 0
            },
            {
                q: { ar: "عِنْدَ النَّوْمِ نَقْرَأُ فِي الْكَفَّيْنِ...", en: "At night we recite into cupped palms..." },
                options: [
                    { ar: "الْإِخْلَاصِ وَالْفَلَقِ وَالنَّاسِ", en: "Al-Ikhlas, Al-Falaq, and An-Nas" },
                    { ar: "الْبَقَرَةِ كُلِّهَا", en: "All of Al-Baqarah" },
                    { ar: "سُورَةِ الْفَاتِحَةِ فَقَطْ", en: "Only Al-Fatiha" }
                ],
                answer: 0
            }
        ]
    };

    /* ------------------------------------------------------------
       Stage 1 · Adhkar · Unit 1 — Daily Adhkar
       الأَذْكَارُ اليَوْمِيَّة
       Seeds: lessons/1-adhkar/s1-adhkar-1 … -7
    ------------------------------------------------------------ */
    W["s1-adhkar-1"] = {
        stage: "s1",
        subject: "adhkar",
        unit: 1,
        hue: 1,
        title: { en: "Daily Adhkar", ar: "الأَذْكَارُ اليَوْمِيَّة" },

        quizGuide: {
            idle:    { en: "Choose an answer!", ar: "اختر الإجابة" },
            wrong:   { en: "Try again!", ar: "حاول مرة أخرى" },
            correct: { en: "Correct! أحسنت", ar: "أحسنت" },
            done:    { en: "MashaAllah! All correct!", ar: "ما شاء الله" }
        },
        quiz: [
            {
                q: { ar: "حَالُ مَا نَفْعَلُ الْمُسْلِمُ ذِكْرَ اللَّهِ؟", en: "When does the Muslim remember Allah?" },
                options: [
                    { ar: "فِي كُلِّ حَالٍ وَوَقْتٍ", en: "In every situation and time" },
                    { ar: "فِي الْمَسْجِدِ فَقَطْ", en: "Only in the mosque" },
                    { ar: "فِي الْعِيدِ فَقَطْ", en: "Only on Eid" }
                ],
                answer: 0
            },
            {
                q: { ar: "ذِكْرُ اللَّهِ يُطْمَئِنُّ...", en: "Remembrance of Allah brings tranquility to..." },
                options: [
                    { ar: "الْقُلُوبَ", en: "The hearts" },
                    { ar: "الْجُيُوبَ", en: "The pockets" },
                    { ar: "الْأَبْوَابَ", en: "The doors" }
                ],
                answer: 0
            },
            {
                q: { ar: "﴿أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ﴾ (الرعد: 28)", en: "What does this ayah teach us?" },
                options: [
                    { ar: "الْقُلُوبُ تَطْمَئِنُّ بِذِكْرِ اللَّهِ", en: "Hearts find peace in remembering Allah" },
                    { ar: "الْقُلُوبُ تَطْمَئِنُّ بِالْمَالِ", en: "Hearts find peace in money" },
                    { ar: "لَا تَطْمَئِنُّ الْقُلُوبُ أَبَدًا", en: "Hearts never rest" }
                ],
                answer: 0
            }
        ]
    };
})(self);