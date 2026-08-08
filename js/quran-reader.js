(function () {
    'use strict';

    var chapters = window.__QURAN_CHAPTERS || [];
    var currentSurah = null;
    var currentReciter = 'Sudais';
    var currentTranslation = 'hilali';
    var audioEl = null;
    var audioQueue = [];
    var isPlaying = false;
    var isPaused = false;
    var isSinglePlay = false;
    var singlePlayChapter = null;
    var lastPlayedVerse = 0;
    var audioGen = 0;
    var dataLoaded = false;

    var _fnNotes = {};
    var tafsirState = null;
    var tafsirPinned = false;
    var tafsirSize = 16;
    var simState = null;
    var simSize = 16;
    var _flashTimer = null;
    var _toastTimer = null;
    var infoState = null;
    var infoSize = 16;
    var mushafState = { ch: null, page: 1, pages: [] };

    var QUL_BUNDLES = {
        'surah-info-en': 'js/quran_source/surah-info-en.js',
        'surah-info-ta': 'js/quran_source/surah-info-ta.js',
        'ayah-themes': 'js/quran_source/ayah-themes.js',
        'mutashabihat': 'js/quran_source/mutashabihat.js',
        'similar-ayah': 'js/quran_source/similar-ayah.js',
        'qpc-hafs-word': 'js/quran_source/qpc-hafs-word.js'
    };

    // Bundles loaded on demand only (the QPC word data is large and is only
    // needed inside the Mutashabihat / Similar Ayat popup).
    var QUL_LAZY_KEYS = { 'qpc-hafs-word': 1 };

    var RECITER_CFG = {
        Sudais:  { segKey: 'segments-sudais',  segFile: 'js/quran_source/segments/sudais.js',  mode: 'ayah' },
        Shuraim: { segKey: 'segments-shuraim', segFile: 'js/quran_source/segments/shuraim.js', mode: 'surah' },
        Alafasy: { segKey: 'segments-afasy',   segFile: 'js/quran_source/segments/afasy.js',   mode: 'surah' },
        YasserAlDosari: { segKey: 'segments-dussary', segFile: 'js/quran_source/segments/dussary.js', mode: 'surah' }
    };

    var arabicOrigMap = {};
    var _segCache = {};
    var _wordTimingCache = {};
    var _surahAudioSrc = null;

    var SURAH_LIGATURES = [
        '\uFC45','\uFC46','\uFC47','\uFC4A','\uFC4B','\uFC4E','\uFC4F','\uFC51','\uFC52','\uFC53',
        '\uFC55','\uFC56','\uFC58','\uFC5A','\uFC5B','\uFC5C','\uFC5D','\uFC5E','\uFC61','\uFC62',
        '\uFC64','\uFB51','\uFB52','\uFB54','\uFB55','\uFB57','\uFB58','\uFB5A','\uFB5B','\uFB5D',
        '\uFB5E','\uFB60','\uFB61','\uFB63','\uFB64','\uFB66','\uFB67','\uFB69','\uFB6A','\uFB6C',
        '\uFB6D','\uFB6F','\uFB70','\uFB72','\uFB73','\uFB75','\uFB76','\uFB78','\uFB79','\uFB7B',
        '\uFB7C','\uFB7E','\uFB7F','\uFB81','\uFB82','\uFB84','\uFB85','\uFB87','\uFB88','\uFB8A',
        '\uFB8B','\uFB8D','\uFB8E','\uFB90','\uFB91','\uFB93','\uFB94','\uFB96','\uFB97','\uFB99',
        '\uFB9A','\uFB9C','\uFB9D','\uFB9F','\uFBA0','\uFBA2','\uFBA3','\uFBA5','\uFBA6','\uFBA8',
        '\uFBA9','\uFBAB','\uFBAC','\uFBAE','\uFBAF','\uFBB1','\uFBB2','\uFBB4','\uFBB5','\uFBB7',
        '\uFBB8','\uFBBA','\uFBBB','\uFBBD','\uFBBE','\uFBC0','\uFBC1','\uFBD3','\uFBD4','\uFBD6',
        '\uFBD7','\uFBD9','\uFBDA','\uFBDC','\uFBDD','\uFBDF','\uFBE0','\uFBE2','\uFBE3','\uFBE5',
        '\uFBE6','\uFBE8','\uFBE9','\uFBEB'
    ];

    /* Bilingual Surah overviews (English + Tamil). Curated child-friendly
       summaries and core themes for the surahs most studied by young
       learners. Any surah without a curated entry falls back to the QUL
       surah-info bundles or a factual blurb built from chapter metadata. */
    var SURAH_INFO = {
        "1": {
            en: { summary: 'The Opening of the Quran and the essence of Salah, recited in every unit of prayer. It praises Allah, affirms His Lordship and Mercy, and asks Him alone to guide us upon the straight path.',
                  themes: ['Praise of Allah', 'Lordship & Mercy', 'Seeking Guidance'] },
            ta: { summary: 'குர்ஆனின் துவக்கமும், தொழுகையின் ஒவ்வொரு ரக்அத்திலும் ஓதப்படும் மையப் பகுதியும் இதுவாகும். இது அல்லாஹ்வைப் போற்றி, அவனுடைய இறைமையையும் கருணையையும் உறுதிசெய்து, நேரான பாதைக்கு வழிகாட்டுமாறு அவனிடமே கேட்கிறது.',
                  themes: ['அல்லாஹ்வைப் போற்றுதல்', 'இறைமை & கருணை', 'நேர்வழியைத் தேடல்'] }
        },
        "2": {
            en: { summary: 'The longest surah of the Quran, revealed in Madinah. It lays the foundation of Islamic belief and law, tells the story of the Children of Israel, and emphasises taqwa, worship and patience.',
                  themes: ['Faith & Taqwa', 'Laws & Guidance', 'Stories of Bani Isra\u2019il'] },
            ta: { summary: 'குர்ஆனின் மிக நீண்ட சூரா, மதீனாவில் இறங்கியது. இஸ்லாமிய நம்பிக்கை மற்றும் சட்டங்களின் அடித்தளத்தை அமைக்கிறது; பனூ இஸ்ராயீலின் கதையைக் கூறுகிறது; தக்வா, வணக்கம், பொறுமை ஆகியவற்றை வலியுறுத்துகிறது.',
                  themes: ['நம்பிக்கை & தக்வா', 'சட்டங்கள் & வழிகாட்டல்', 'பனூ இஸ்ராயீல் கதை'] }
        },
        "3": {
            en: { summary: 'Revealed in Madinah, this surah tells of the family of Imran, including Maryam and \u2018Isa (peace be upon them). It calls the People of the Book to the truth of Islam and teaches firmness in faith and unity.',
                  themes: ['Family of Imran', 'People of the Book', 'Unity & Steadfastness'] },
            ta: { summary: 'மதீனாவில் இறங்கிய இந்தச் சூரா, இம்ரான் குடும்பத்தின் கதையை \u2014 மர்யம், ஈசா (அலை) ஆகியோரை \u2014 கூறுகிறது. வேதக்காரர்களை இஸ்லாத்தின் உண்மைக்கு அழைத்து, உறுதியான நம்பிக்கையையும் ஒற்றுமையையும் கற்பிக்கிறது.',
                  themes: ['இம்ரான் குடும்பம்', 'வேதக்காரர்கள்', 'ஒற்றுமை & உறுதி'] }
        },
        "4": {
            en: { summary: 'A Madinan surah focusing on justice, the rights of women and orphans, family law, and the importance of unity among Muslims. It teaches that all believers are one community.',
                  themes: ['Rights & Justice', 'Women & Family', 'Community Unity'] },
            ta: { summary: 'மதீனாவில் இறங்கிய இந்தச் சூரா, நீதியை, பெண்கள் மற்றும் அநாதைகளின் உரிமைகளை, குடும்பச் சட்டங்களை வலியுறுத்துகிறது. அனைத்து இறைநம்பிக்கையாளர்களும் ஒரே சமுதாயம் என்பதைக் கற்பிக்கிறது.',
                  themes: ['உரிமைகள் & நீதி', 'பெண்கள் & குடும்பம்', 'சமுதாய ஒற்றுமை'] }
        },
        "5": {
            en: { summary: 'A Madinan surah that completes the religion of Islam and teaches lawful and unlawful matters of food, the covenants with the People of the Book, and justice. It contains the famous verse about the completion of the religion (5:3).',
                  themes: ['Halal & Haram', 'Covenants', 'Completing the Religion'] },
            ta: { summary: 'மதீனாவில் இறங்கிய இந்தச் சூரா, இஸ்லாம் மார்க்கத்தைப் பூர்த்தி செய்யும் புகழ்பெற்ற வசனத்தைக் (5:3) கொண்டுள்ளது. உணவின் அனுமதிக்கப்பட்ட, தடைசெய்யப்பட்ட விஷயங்களையும், வேதக்காரர்களுடனான உடன்படிக்கைகளையும், நீதியையும் கற்பிக்கிறது.',
                  themes: ['ஹலால் & ஹராம்', 'உடன்படிக்கைகள்', 'மார்க்கத்தின் பூர்த்தி'] }
        },
        "6": {
            en: { summary: 'A Makkan surah that firmly establishes Tawhid, refutes shirk and idol-worship, and tells the story of Prophet Ibrahim (peace be upon him) searching for his Lord through His creation.',
                  themes: ['Tawhid', 'Refuting Shirk', 'Story of Ibrahim'] },
            ta: { summary: 'மக்காவில் இறங்கிய இந்தச் சூரா, ஏகத்துவத்தை உறுதிப்படுத்தி, இணைவைப்பையும் சிலை வணக்கத்தையும் மறுக்கிறது. நபி இப்ராஹீம் (அலை) படைப்பின் மூலம் தம் இறைவனைத் தேடிய கதையைக் கூறுகிறது.',
                  themes: ['ஏகத்துவம்', 'இணைவைப்பு மறுப்பு', 'இப்ராஹீமின் கதை'] }
        },
        "18": {
            en: { summary: 'A Makkan surah containing four famous stories: the People of the Cave, the owner of the two gardens, Musa and Khidr, and Dhul-Qarnayn. It is recommended to recite every Friday for protection from trials.',
                  themes: ['People of the Cave', 'Musa & Khidr', 'Dhul-Qarnayn', 'Trials & Faith'] },
            ta: { summary: 'மக்காவில் இறங்கிய இந்தச் சூராவில் நான்கு புகழ்பெற்ற கதைகள் உள்ளன: குகையினர், இரு தோட்டங்களின் உரிமையாளர், மூஸா & கிழ்ர், துல்கர்னைன். சோதனைகளிலிருந்து பாதுகாப்புக்காக ஒவ்வொரு வெள்ளியும் ஓத பரிந்துரைக்கப்படுகிறது.',
                  themes: ['குகையினர்', 'மூஸா & கிழ்ர்', 'துல்கர்னைன்', 'சோதனை & நம்பிக்கை'] }
        },
        "36": {
            en: { summary: 'Called the heart of the Quran, this Makkan surah affirms the Quran as revelation, tells of a town\u2019s messengers, and powerfully describes resurrection and the Hereafter.',
                  themes: ['Heart of the Quran', 'Prophethood', 'Resurrection & Hereafter'] },
            ta: { summary: 'குர்ஆனின் இதயம் என அழைக்கப்படும் இந்த மக்கா சூரா, குர்ஆன் வஹீ என்பதை உறுதிப்படுத்தி, ஒரு ஊருக்கு வந்த தூதர்களின் கதையைக் கூறி, உயிர்த்தெழுதலையும் மறுமை வாழ்வையும் விவரிக்கிறது.',
                  themes: ['குர்ஆனின் இதயம்', 'நபித்துவம்', 'மறுமை & உயிர்த்தெழுதல்'] }
        },
        "55": {
            en: { summary: 'A Makkan surah that counts the countless blessings of Allah \u2014 the Quran, creation, mercy and paradise \u2014 and repeatedly asks: \u2018Which of the favours of your Lord will you deny?\u2019',
                  themes: ['Countless Blessings', 'Mercy of Allah', 'Paradise & Favours'] },
            ta: { summary: 'மக்காவில் இறங்கிய இந்தச் சூரா, அல்லாஹ்வின் எண்ணற்ற அருள்களை \u2014 குர்ஆன், படைப்பு, கருணை, சொர்க்கம் \u2014 விவரித்து, \u2018உங்கள் இறைவனின் எந்த அருளை நீங்கள் மறுப்பீர்கள்?\u2019 எனத் திரும்பத் திரும்பக் கேட்கிறது.',
                  themes: ['எண்ணற்ற அருள்கள்', 'அல்லாஹ்வின் கருணை', 'சொர்க்கம் & அருட்கொடைகள்'] }
        },
        "67": {
            en: { summary: 'A Makkan surah that begins with Allah\u2019s blessed sovereignty and the wisdom of creation, warns of the Fire for those who disbelieve, and is recommended to recite every night for protection from the punishment of the grave.',
                  themes: ['Sovereignty of Allah', 'Purpose of Creation', 'Protection from Punishment'] },
            ta: { summary: 'மக்காவில் இறங்கிய இந்தச் சூரா, அல்லாஹ்வின் மிகவும் பாக்கியமான ஆட்சியையும் படைப்பின் ஞானத்தையும் கூறி, இறைமறுப்பாளர்களை நரகம் பற்றி எச்சரிக்கிறது. ஒவ்வொரு இரவும் ஓத பரிந்துரைக்கப்படுகிறது.',
                  themes: ['அல்லாஹ்வின் ஆட்சி', 'படைப்பின் நோக்கம்', 'தண்டனையிலிருந்து பாதுகாப்பு'] }
        },
        "112": {
            en: { summary: 'A short Makkan surah that summarises Tawhid: Allah is One, Self-Sufficient, He does not beget nor is He begotten, and there is none comparable to Him. It is equal to a third of the Quran in reward.',
                  themes: ['Tawhid', 'Oneness of Allah', 'Sincerity'] },
            ta: { summary: 'மக்காவில் இறங்கிய சிறிய சூரா. அல்லாஹ் ஒருவன், தேவையற்றவன்; அவன் யாரையும் பெறவில்லை, பெறப்படவுமில்லை; அவனுக்கு நிகரானவர் யாருமில்லை என ஏகத்துவத்தைச் சுருக்கமாகக் கூறுகிறது. குர்ஆனின் மூன்றில் ஒரு பங்கிற்கு சமமான நன்மையுள்ளது.',
                  themes: ['ஏகத்துவம்', 'அல்லாஹ்வின் ஒருமை', 'கலப்பற்ற நம்பிக்கை'] }
        },
        "113": {
            en: { summary: 'A Makkan surah, one of the two \u2018Protections\u2019 (al-Mu\u2019awwidhatayn), in which we seek refuge in Allah from the evil of what He created, from darkness, and from the harm of envious people.',
                  themes: ['Seeking Refuge', 'Protection from Evil', 'Trust in Allah'] },
            ta: { summary: 'மக்காவில் இறங்கிய சூரா; இரண்டு \u2018பாதுகாப்பு\u2019 சூராக்களில் (அல்-முஅவ்விதத்தைன்) ஒன்று. படைக்கப்பட்டவற்றின் தீமையிலிருந்தும், இருளிலிருந்தும், பொறாமைக்காரர்களின் தீங்கிலிருந்தும் அல்லாஹ்விடம் பாதுகாப்புக் கேட்கிறோம்.',
                  themes: ['பாதுகாப்பு வேண்டல்', 'தீமையிலிருந்து பாதுகாப்பு', 'அல்லாஹ்வின் மீது நம்பிக்கை'] }
        },
        "114": {
            en: { summary: 'The final surah of the Quran, one of the two \u2018Protections.\u2019 We seek refuge in the Lord of Mankind from the whispering of the Shaytan who plants evil thoughts in people\u2019s hearts.',
                  themes: ['Seeking Refuge', 'Lord of Mankind', 'Protection from Shaytan'] },
            ta: { summary: 'குர்ஆனின் இறுதிச் சூரா; இரண்டு \u2018பாதுகாப்பு\u2019 சூராக்களில் ஒன்று. மனிதர்களின் இதயங்களில் தீய எண்ணங்களைப் போடும் ஷைத்தானின் கிசுகிசுப்பிலிருந்து, மனிதர்களின் இறைவனிடம் பாதுகாப்புக் கேட்கிறோம்.',
                  themes: ['பாதுகாப்பு வேண்டல்', 'மனிதர்களின் இறைவன்', 'ஷைத்தானிடமிருந்து பாதுகாப்பு'] }
        }
    };

    /* Verified similar / related verses (mutashabihat) for Hifz and
       comparative study. Pairs mirror the project\u2019s own reviewed
       cross-references so the connections shown are consistent with the
       study popups already on the site. Verses without an entry show a
       graceful empty state. */
    var MUTASHABIHAT = {
        "2:152": [
            { key: "6:102", snippet: "Such is Allah, your Lord! None has the right to be worshipped but He, the Creator of all things. So worship Him (Alone)." },
            { key: "39:62", snippet: "Allah is the Creator of all things, and He is the Wakil (Trustee, Disposer of affairs, Guardian) over all things." },
            { key: "20:14", snippet: "Verily! I am Allah! La ilaha illa Ana (none has the right to be worshipped but I), so worship Me (Alone), and perform As-Salat for My Remembrance." }
        ],
        "39:62": [
            { key: "6:102", snippet: "Such is Allah, your Lord! The Creator of all things. So worship Him (Alone)." },
            { key: "13:16", snippet: "Allah is the Creator of all things, and He is the Wakil over all things." },
            { key: "35:3", snippet: "O mankind! Remember the Grace of Allah. There is no creator besides Allah." }
        ],
        "51:56": [
            { key: "36:22", snippet: "And why should I not worship Him Who has created me and to Whom you shall be returned." },
            { key: "19:65", snippet: "Lord of the heavens and the earth, and all that is between them, so worship Him (Alone) and be constant and patient in His worship." },
            { key: "53:62", snippet: "So fall you down in prostration to Allah and worship Him (Alone)." }
        ],
        "3:19": [
            { key: "2:163", snippet: "And your Ilah (God) is one Ilah (God - Allah). None has the right to be worshipped but He, the Most Gracious, the Most Merciful." },
            { key: "3:83", snippet: "Do they seek other than the religion of Allah, while to Him has submitted all that is in the heavens and the earth, willingly or unwillingly?" },
            { key: "22:34", snippet: "For each We have appointed a way of worship which they follow. So let them not dispute with you about the matter." }
        ],
        "6:102": [
            { key: "2:152", snippet: "So remember Me; I will remember you. And be grateful to Me and do not deny Me." },
            { key: "39:62", snippet: "Allah is the Creator of all things, and He is the Wakil (Trustee, Disposer of affairs, Guardian) over all things." }
        ],
        "13:16": [
            { key: "39:62", snippet: "Allah is the Creator of all things, and He is the Wakil (Trustee, Disposer of affairs, Guardian) over all things." }
        ],
        "35:3": [
            { key: "39:62", snippet: "Allah is the Creator of all things, and He is the Wakil (Trustee, Disposer of affairs, Guardian) over all things." }
        ],
        "20:14": [
            { key: "2:152", snippet: "So remember Me; I will remember you. And be grateful to Me and do not deny Me." }
        ],
        "36:22": [
            { key: "51:56", snippet: "And I did not create the jinn and mankind except to worship Me." }
        ],
        "19:65": [
            { key: "51:56", snippet: "And I did not create the jinn and mankind except to worship Me." }
        ],
        "53:62": [
            { key: "51:56", snippet: "And I did not create the jinn and mankind except to worship Me." }
        ],
        "2:163": [
            { key: "3:19", snippet: "Truly, the religion with Allah is Islam..." }
        ],
        "3:83": [
            { key: "3:19", snippet: "Truly, the religion with Allah is Islam..." }
        ],
        "22:34": [
            { key: "3:19", snippet: "Truly, the religion with Allah is Islam..." }
        ]
    };

    var els = {
        loading: document.getElementById('qr-loading'),
        content: document.getElementById('qr-content'),
        sidebarToggle: document.getElementById('qr-sidebar-toggle'),
        sidebar: document.getElementById('qr-sidebar'),
        main: document.getElementById('qr-main'),
        surahList: document.getElementById('qr-surah-list'),
        surahSearch: document.getElementById('qr-surah-search'),
        surahHeader: document.getElementById('qr-surah-header'),
        verses: document.getElementById('qr-verses'),
        navBottom: document.getElementById('qr-nav-bottom'),
        prevBtn: document.getElementById('qr-prev-surah'),
        nextBtn: document.getElementById('qr-next-surah'),
        reciterSelect: document.getElementById('qr-reciter'),
        translationSelect: document.getElementById('qr-translation'),
        wbwToggle: document.getElementById('qr-wbw-toggle'),
        wbwToggleLabel: document.getElementById('qr-wbw-toggle-label'),
        wbwLangSelect: document.getElementById('qr-wbw-lang'),

        fixedPlayBar: document.getElementById('qr-fixed-play-bar'),
        playbarSurah: document.getElementById('qr-playbar-surah'),
        playbarVerse: document.getElementById('qr-playbar-verse'),
        playbarPlayPause: document.getElementById('qr-playbar-playpause'),
        playbarPrev: document.getElementById('qr-playbar-prev'),
        playbarNext: document.getElementById('qr-playbar-next'),
        playbarStop: document.getElementById('qr-playbar-stop'),
        continuePrompt: document.getElementById('qr-continue-prompt'),
        continueYes: document.getElementById('qr-continue-yes'),
        continueNo: document.getElementById('qr-continue-no'),

        tafsirLangSelect: document.getElementById('qr-tafsir-lang'),
        fnTooltip: document.getElementById('qr-fn-tooltip'),
        tafsirModalBackdrop: document.getElementById('qr-tafsir-modal-backdrop'),
        tafsirModal: document.getElementById('qr-tafsir-modal'),
        tafsirModalBody: document.getElementById('qr-tafsir-modal-body'),
        tafsirModalSource: document.getElementById('qr-tafsir-modal-source'),
        tafsirSurahAr: document.getElementById('qr-tafsir-surah-ar'),
        tafsirSurahEn: document.getElementById('qr-tafsir-surah-en'),
        tafsirVerse: document.getElementById('qr-tafsir-verse'),
        tafsirJump: document.getElementById('qr-tafsir-jump'),
        tafsirPrev: document.getElementById('qr-tafsir-prev'),
        tafsirNext: document.getElementById('qr-tafsir-next'),
        tafsirPin: document.getElementById('qr-tafsir-pin'),
        tafsirClose: document.getElementById('qr-tafsir-close'),
        tafsirModalLang: document.getElementById('qr-tafsir-modal-lang'),
        tafsirSizeDown: document.getElementById('qr-tafsir-size-down'),
        tafsirSizeUp: document.getElementById('qr-tafsir-size-up'),
        clearCache: document.getElementById('qr-clear-cache'),

        simBackdrop: document.getElementById('qr-mutashabihat-modal-backdrop'),
        simModal: document.getElementById('qr-mutashabihat-modal'),
        simBody: document.getElementById('qr-sim-modal-body'),
        simClose: document.getElementById('qr-sim-close'),
        simSurahAr: document.getElementById('qr-sim-surah-ar'),
        simSurahEn: document.getElementById('qr-sim-surah-en'),
        simVerse: document.getElementById('qr-sim-verse'),
        simSource: document.getElementById('qr-sim-modal-source'),
        simSizeDown: document.getElementById('qr-sim-size-down'),
        simSizeUp: document.getElementById('qr-sim-size-up'),

        navToast: document.getElementById('qr-nav-toast'),
        gotoBtn: document.getElementById('qr-goto-btn'),
        gotoBackdrop: document.getElementById('qr-goto-backdrop'),
        gotoSurah: document.getElementById('qr-goto-surah'),
        gotoVerse: document.getElementById('qr-goto-verse'),
        gotoGo: document.getElementById('qr-goto-go'),
        gotoForm: document.getElementById('qr-goto-form'),
        gotoError: document.getElementById('qr-goto-error'),
        gotoClose: document.getElementById('qr-goto-close'),

        infoBackdrop: document.getElementById('qr-surah-info-modal-backdrop'),
        infoModal: document.getElementById('qr-surah-info-modal'),
        infoBody: document.getElementById('qr-info-modal-body'),
        infoClose: document.getElementById('qr-info-modal-close'),
        infoSurahAr: document.getElementById('qr-info-surah-ar'),
        infoSurahEn: document.getElementById('qr-info-surah-en'),
        infoSource: document.getElementById('qr-info-modal-source'),
        infoLangSelect: document.getElementById('qr-info-modal-lang'),
        infoSizeDown: document.getElementById('qr-info-size-down'),
        infoSizeUp: document.getElementById('qr-info-size-up'),

        mushafBackdrop: document.getElementById('qr-mushaf-backdrop'),
        mushafFrame: document.getElementById('qr-mushaf-frame'),
        mushafTitle: document.getElementById('qr-mushaf-title'),
        mushafPageInfo: document.getElementById('qr-mushaf-pageinfo'),
        mushafPrev: document.getElementById('qr-mushaf-prev'),
        mushafNext: document.getElementById('qr-mushaf-next'),
        mushafClose: document.getElementById('qr-mushaf-close'),
        mushafPageEl: document.getElementById('qr-mushaf-page'),
    };

    if (!els.loading || !els.content) return;

    loadEssentialData(function () {
        init();
    });

    loadBackgroundTranslations();
    preloadQulBundles();

    function setupNavToggle() {
        var qrNavbar = document.querySelector('.qr-navbar');
        if (!qrNavbar) return;
        var toggle = document.createElement('button');
        toggle.className = 'qr-nav-toggle';
        toggle.setAttribute('aria-label', 'Menu');
        toggle.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none"/></svg>';
        qrNavbar.appendChild(toggle);
        toggle.addEventListener('click', function(e) {
            e.stopPropagation();
            qrNavbar.classList.toggle('qr-nav-open');
        });
        document.addEventListener('click', function(e) {
            if (qrNavbar.classList.contains('qr-nav-open') && !qrNavbar.contains(e.target)) {
                qrNavbar.classList.remove('qr-nav-open');
            }
        });
    }

    function init() {
        renderSurahList();
        populateTranslationDropdown();
        setupSidebarToggle();
        setupNavToggle();
        setupSearch();
        setupEventListeners();
        setupPlaybar();
        setupTafsirModal();
        setupFnTooltip();
        setupClearCache();
        setupWbwToggle();
        setupMutashabihatModal();
        setupSurahInfoModal();
        setupMushaf();
        setupGotoDialog();
        setupScrollTracking();

        var savedReciter = localStorage.getItem('audio-voice-name');
        if (savedReciter && RECITER_CFG[savedReciter]) {
            els.reciterSelect.value = savedReciter;
            currentReciter = savedReciter;
        }

        var savedTrans = localStorage.getItem('quran-translation');
        if (savedTrans && window.__QURAN_TRANSLATIONS && window.__QURAN_TRANSLATIONS[savedTrans]) {
            els.translationSelect.value = savedTrans;
            currentTranslation = savedTrans;
        }

        var savedWbw = localStorage.getItem('quran-wbw');
        if (savedWbw === 'true') {
            els.wbwToggle.checked = true;
            if (els.wbwLangSelect) els.wbwLangSelect.classList.add('show');
        }

        if (els.wbwLangSelect) {
            var savedWbwLang = localStorage.getItem('quran-wbw-lang') || 'auto';
            els.wbwLangSelect.value = savedWbwLang;
        }

        if (els.tafsirLangSelect) {
            var savedTafsirLang = localStorage.getItem('quran-tafsir-lang') || 'ta';
            els.tafsirLangSelect.value = savedTafsirLang;
        }
        if (els.tafsirModalLang) {
            els.tafsirModalLang.value = localStorage.getItem('quran-tafsir-lang') || 'ta';
        }
        tafsirPinned = localStorage.getItem('quran-tafsir-pinned') === 'true';
        updatePinButton();
        var savedTafsirSize = parseInt(localStorage.getItem('quran-tafsir-size'), 10);
        if (!isNaN(savedTafsirSize) && savedTafsirSize >= 12 && savedTafsirSize <= 28) {
            tafsirSize = savedTafsirSize;
        }
        applyTafsirSize();

        if (els.infoLangSelect) {
            els.infoLangSelect.value = localStorage.getItem('quran-info-lang') || 'en';
        }
        var savedInfoSize = parseInt(localStorage.getItem('quran-info-size'), 10);
        if (!isNaN(savedInfoSize) && savedInfoSize >= 12 && savedInfoSize <= 28) {
            infoSize = savedInfoSize;
        }
        applyInfoSize();

        var savedSimSize = parseInt(localStorage.getItem('quran-sim-size'), 10);
        if (!isNaN(savedSimSize) && savedSimSize >= 12 && savedSimSize <= 28) {
            simSize = savedSimSize;
        }
        applySimSize();

        initDropdowns();

        els.loading.style.display = 'none';
        els.content.style.display = 'block';

        var lastRead = localStorage.getItem('quran-last-read');
        var startSurah = 1, startVerse = 0;
        if (lastRead) { var p = lastRead.split(':'); startSurah = parseInt(p[0]) || 1; startVerse = parseInt(p[1]) || 0; }
        loadSurah(startSurah, startVerse > 0 ? startVerse : undefined);

        if (els.wbwToggle.checked) {
            loadWbwData(function () {
                var ch = chapters[currentSurah - 1];
                if (ch && els.wbwToggle.checked) renderVerses(ch);
            });
        }
    }

    function setupSidebarToggle() {
        var qrSvgBase = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="8" y1="6" x2="8" y2="18"/></svg>';
        var qrSvgExpHover = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="8" y1="6" x2="8" y2="18"/><polyline points="14,9 10,12 14,15"/></svg>';
        var qrSvgColHover = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="8" y1="6" x2="8" y2="18"/><polyline points="12,10 15,13 12,16"/></svg>';

        els.sidebarToggle.innerHTML =
            '<span class="qr-tv qr-tv-base">' + qrSvgBase + '</span>' +
            '<span class="qr-tv qr-tv-expanded-hover" style="display:none">' + qrSvgExpHover + '</span>' +
            '<span class="qr-tv qr-tv-collapsed-hover" style="display:none">' + qrSvgColHover + '</span>' +
            '<span class="qr-tv qr-tv-logo" style="display:none"></span>' +
            '<span class="qr-tv-tooltip" style="display:none"></span>';

        var qrTvBase = els.sidebarToggle.querySelector('.qr-tv-base');
        var qrTvExpHover = els.sidebarToggle.querySelector('.qr-tv-expanded-hover');
        var qrTvColHover = els.sidebarToggle.querySelector('.qr-tv-collapsed-hover');
        var qrTvLogo = els.sidebarToggle.querySelector('.qr-tv-logo');
        var qrTooltipEl = els.sidebarToggle.querySelector('.qr-tv-tooltip');
        var qrNavLogo = document.querySelector('.qr-nav-logo');
        var qrNavLogoImg = qrNavLogo ? qrNavLogo.querySelector('.qr-nav-logo-img') : null;

        if (qrNavLogoImg && qrTvLogo) {
            qrTvLogo.appendChild(qrNavLogoImg.cloneNode(true));
        }

        function qrShow(el) {
            [qrTvBase, qrTvExpHover, qrTvColHover, qrTvLogo].forEach(function(e) { if (e) e.style.display = 'none'; });
            if (el) el.style.display = 'flex';
        }

        function qrIsHidden() {
            if (window.innerWidth <= 768) {
                return !els.sidebar.classList.contains('open');
            }
            return document.body.classList.contains('qr-sidebar-hidden');
        }

        function updateQrToggleIcons() {
            var isHidden = qrIsHidden();
            els.sidebarToggle.classList.toggle('qr-hidden', isHidden);
            if (isHidden) {
                qrShow(qrTvLogo);
                if (qrNavLogoImg) qrNavLogoImg.style.display = 'none';
            } else {
                qrShow(qrTvBase);
                if (qrNavLogoImg) qrNavLogoImg.style.display = '';
            }
            els.sidebarToggle.setAttribute('aria-expanded', isHidden ? 'false' : 'true');
            if (qrTooltipEl) qrTooltipEl.style.display = 'none';
        }

        // On mobile start with qr-sidebar-hidden cleared to avoid CSS conflict
        if (window.innerWidth <= 768) {
            document.body.classList.remove('qr-sidebar-hidden');
        }

        updateQrToggleIcons();

        els.sidebarToggle.addEventListener('mouseenter', function() {
            var isHidden = qrIsHidden();
            if (isHidden) {
                qrTvColHover.style.display = 'flex';
                if (qrTvLogo) qrTvLogo.style.visibility = 'hidden';
            } else {
                qrShow(qrTvExpHover);
            }
            if (qrTooltipEl) {
                qrTooltipEl.textContent = isHidden ? 'Open surahs' : 'Close surahs';
                qrTooltipEl.style.display = 'block';
            }
        });

        els.sidebarToggle.addEventListener('mouseleave', function() {
            if (qrTvLogo) qrTvLogo.style.visibility = '';
            if (qrTooltipEl) qrTooltipEl.style.display = 'none';
            updateQrToggleIcons();
        });

        els.sidebarToggle.addEventListener('click', function () {
            if (window.innerWidth <= 768) {
                els.sidebar.classList.toggle('open');
            } else {
                document.body.classList.toggle('qr-sidebar-hidden');
            }
            updateQrToggleIcons();
        });
    }

    function setupSearch() {
        els.surahSearch.addEventListener('input', function () {
            var q = this.value.toLowerCase().trim();
            els.surahList.querySelectorAll('.qr-surah-item').forEach(function (item) {
                var en = (item.getAttribute('data-en') || '').toLowerCase();
                var ar = item.getAttribute('data-ar') || '';
                var num = item.getAttribute('data-num') || '';
                item.style.display = (!q || en.indexOf(q) !== -1 || ar.indexOf(q) !== -1 || num === q) ? '' : 'none';
            });
        });
    }

    function setupGotoDialog() {
        if (!els.gotoBackdrop) return;
        els.gotoBtn.addEventListener('click', openGotoDialog);
        els.gotoClose.addEventListener('click', closeGotoDialog);
        els.gotoBackdrop.addEventListener('click', function (e) {
            if (e.target === els.gotoBackdrop) closeGotoDialog();
        });
        populateGotoSurahs();
        els.gotoSurah.addEventListener('change', function () {
            var ch = chapters[parseInt(this.value, 10) - 1];
            els.gotoVerse.max = ch ? ch.verses : 1;
            els.gotoVerse.placeholder = ch ? ('1 - ' + ch.verses) : '1 - 7';
            if (parseInt(els.gotoVerse.value, 10) > els.gotoVerse.max) els.gotoVerse.value = els.gotoVerse.max;
            clearGotoError();
        });
        if (els.gotoForm) {
            els.gotoForm.addEventListener('submit', function (e) {
                e.preventDefault();
                gotoSubmit();
            });
        }
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && els.gotoBackdrop && !els.gotoBackdrop.hidden) closeGotoDialog();
        });
    }

    function populateGotoSurahs() {
        if (!els.gotoSurah) return;
        var opts = '<option value="">Select surah</option>';
        for (var i = 1; i <= 114; i++) {
            var ch = chapters[i - 1];
            opts += '<option value="' + i + '">' + i + '. ' + escapeHtml(ch.en) + '</option>';
        }
        els.gotoSurah.innerHTML = opts;
    }

    function openGotoDialog() {
        if (!els.gotoBackdrop) return;
        els.gotoSurah.value = String(currentSurah || 1);
        els.gotoVerse.value = '';
        els.gotoBackdrop.hidden = false;
        clearGotoError();
        els.gotoSurah.dispatchEvent(new Event('change'));
        setTimeout(function () { if (els.gotoVerse) els.gotoVerse.focus(); }, 0);
    }

    function closeGotoDialog() {
        if (els.gotoBackdrop) els.gotoBackdrop.hidden = true;
        if (els.gotoBtn) els.gotoBtn.focus();
    }

    function setGotoError(msg) {
        if (!els.gotoError) return;
        els.gotoError.textContent = msg;
        els.gotoError.hidden = false;
    }

    function clearGotoError() {
        if (!els.gotoError) return;
        els.gotoError.textContent = '';
        els.gotoError.hidden = true;
    }

    function gotoSubmit() {
        if (!els.gotoSurah || !els.gotoVerse) return;
        var sid = parseInt(els.gotoSurah.value, 10);
        var vn = parseInt(els.gotoVerse.value, 10);
        var ch = chapters[sid - 1];
        if (!ch) {
            setGotoError('Select a surah.');
            if (els.gotoSurah) els.gotoSurah.focus();
            return;
        }
        if (!vn || vn < 1 || vn > ch.verses) {
            setGotoError('Enter a verse between 1 and ' + ch.verses + '.');
            if (els.gotoVerse) els.gotoVerse.focus();
            return;
        }
        clearGotoError();
        closeGotoDialog();
        loadSurah(sid, vn);
    }

    function setupEventListeners() {
        els.reciterSelect.addEventListener('change', function () {
            currentReciter = this.value;
            localStorage.setItem('audio-voice-name', this.value);
            _wordTimingCache = {};
            stopAudio();
        });

        if (els.tafsirLangSelect) {
            els.tafsirLangSelect.addEventListener('change', function () {
                localStorage.setItem('quran-tafsir-lang', this.value);
                if (els.tafsirModalLang) els.tafsirModalLang.value = this.value;
                if (tafsirState) loadTafsirIntoModal();
            });
        }
        if (els.tafsirModalLang) {
            els.tafsirModalLang.addEventListener('change', function () {
                localStorage.setItem('quran-tafsir-lang', this.value);
                if (els.tafsirLangSelect) els.tafsirLangSelect.value = this.value;
                if (tafsirState) loadTafsirIntoModal();
            });
        }

        els.translationSelect.addEventListener('change', function () {
            currentTranslation = this.value;
            localStorage.setItem('quran-translation', this.value);
            if (currentSurah) {
                var ch = chapters[currentSurah - 1];
                if (ch) renderVerses(ch);
            }
        });

        if (els.wbwLangSelect) {
            els.wbwLangSelect.addEventListener('change', function () {
                localStorage.setItem('quran-wbw-lang', this.value);
                if (currentSurah && els.wbwToggle && els.wbwToggle.checked) {
                    var ch = chapters[currentSurah - 1];
                    if (ch) renderVerses(ch);
                }
            });
        }

        els.prevBtn.addEventListener('click', function () {
            if (currentSurah > 1) loadSurah(currentSurah - 1);
        });
        els.nextBtn.addEventListener('click', function () {
            if (currentSurah < 114) loadSurah(currentSurah + 1);
        });
    }

    function setupPlaybar() {
        els.playbarPlayPause.addEventListener('click', function () {
            if (isPlaying) { togglePause(); return; }
            if (!currentSurah) return;
            var ch = chapters[currentSurah - 1];
            if (!ch) return;
            var lastRead = localStorage.getItem('quran-last-read');
            var startV = 1;
            if (lastRead) { var p = lastRead.split(':'); if (parseInt(p[0]) === ch.id) startV = parseInt(p[1]) || 1; }
            playFromVerse(ch.id, startV, false);
        });
        els.playbarPrev.addEventListener('click', playPrev);
        els.playbarNext.addEventListener('click', playNext);
        els.playbarStop.addEventListener('click', stopAudio);
        els.continueYes.addEventListener('click', continuePlay);
        els.continueNo.addEventListener('click', function () { stopAudio(); hideContinuePrompt(); });
    }

    function setupTafsirModal() {
        if (!els.tafsirModalBackdrop) return;
        els.tafsirClose.addEventListener('click', closeTafsirModal);
        els.tafsirPrev.addEventListener('click', function () { tafsirStep(-1); });
        els.tafsirNext.addEventListener('click', function () { tafsirStep(1); });
        els.tafsirPin.addEventListener('click', function () {
            tafsirPinned = !tafsirPinned;
            localStorage.setItem('quran-tafsir-pinned', tafsirPinned ? 'true' : 'false');
            updatePinButton();
        });
        els.tafsirJump.addEventListener('change', function () {
            var val = parseInt(this.value, 10);
            if (!isNaN(val) && tafsirState) {
                tafsirState.ayah = val;
                openTafsirFor(tafsirState.ch, val);
            }
        });
        els.tafsirSizeDown.addEventListener('click', function () { adjustTafsirSize(-1); });
        els.tafsirSizeUp.addEventListener('click', function () { adjustTafsirSize(1); });

        // Scraped tafsir data (tamililquran.com) contains internal ayah links
        // like qurandisp.php?sura=15&ayah=87 that point to invalid URLs when
        // served from this site. Intercept them and navigate the reader to the
        // same verse instead.
        if (els.tafsirModalBody) {
            els.tafsirModalBody.addEventListener('click', function (e) {
                var a = e.target && e.target.closest ? e.target.closest('a') : null;
                if (!a) return;
                var href = a.getAttribute('href') || '';
                var mSura = /\bsura=(\d+)/i.exec(href);
                var mAyah = /\bayah=(\d+)/i.exec(href);
                if (!mSura || !mAyah) return;
                var s = parseInt(mSura[1], 10);
                var ay = parseInt(mAyah[1], 10);
                var ch = chapters[s - 1];
                if (!ch || ay < 1 || ay > ch.verses) return;
                e.preventDefault();
                e.stopPropagation();
                var srcKey = tafsirState ? tafsirState.ch.id + ':' + tafsirState.ayah : '';
                closeTafsirModal();
                loadSurah(s, ay);
                if (srcKey) showNavToast(srcKey, s + ':' + ay);
            });
        }

        els.tafsirModalBackdrop.addEventListener('click', function (e) {
            if (e.target === els.tafsirModalBackdrop && !tafsirPinned) closeTafsirModal();
        });
        document.addEventListener('keydown', function (e) {
            if (!els.tafsirModalBackdrop || els.tafsirModalBackdrop.hidden) return;
            if (e.key === 'Escape' && !tafsirPinned) {
                e.preventDefault();
                closeTafsirModal();
            } else if (e.key === 'ArrowLeft' && tafsirState) {
                tafsirStep(-1);
            } else if (e.key === 'ArrowRight' && tafsirState) {
                tafsirStep(1);
            }
        });
    }

    function setupFnTooltip() {
        if (!els.fnTooltip) return;
        els.fnTooltip.addEventListener('mousedown', function (e) { e.preventDefault(); });
        document.addEventListener('click', function (e) {
            if (e.target.closest && e.target.closest('.qr-fn-sup')) return;
            hideFnTooltip();
        });
        window.addEventListener('scroll', hideFnTooltip, true);
    }

    function setupClearCache() {
        els.clearCache.addEventListener('click', function () {
            if (window.clearQuranCache) {
                window.clearQuranCache(function () {
                    location.reload();
                });
            }
        });
    }

    function setupWbwToggle() {
        els.wbwToggle.addEventListener('change', function () {
            localStorage.setItem('quran-wbw', this.checked ? 'true' : 'false');
            if (els.wbwLangSelect) {
                els.wbwLangSelect.classList.toggle('show', this.checked);
            }
            if (this.checked) {
                loadWbwData(function () {
                    if (currentSurah) {
                        var ch = chapters[currentSurah - 1];
                        if (ch) renderVerses(ch);
                    }
                });
            } else {
                if (currentSurah) {
                    var ch = chapters[currentSurah - 1];
                    if (ch) renderVerses(ch);
                }
            }
        });
    }

    function populateTranslationDropdown() {
        var registry = window.__QURAN_TRANSLATIONS || {};
        var keys = Object.keys(registry);
        keys.forEach(function (key) {
            var opt = document.createElement('option');
            opt.value = key;
            opt.textContent = registry[key].name;
            els.translationSelect.appendChild(opt);
        });
    }

    function renderSurahList() {
        var html = '';
        chapters.forEach(function (ch) {
            html += '<button class="qr-surah-item" data-id="' + ch.id + '" data-en="' + escapeAttr(ch.en) + '" data-ar="' + escapeAttr(ch.ar) + '" data-num="' + ch.id + '">';
            html += '<span class="qr-surah-num">' + ch.id + '</span>';
            html += '<div class="qr-surah-info">';
            html += '<div class="qr-surah-en">' + escapeHtml(ch.en) + '</div>';
            html += '<div class="qr-surah-ar">' + ch.ar + '</div></div>';
            html += '<span class="qr-surah-verses-count">' + ch.verses + '</span>';
            html += '<span class="qr-bookmark-star" data-surah="' + ch.id + '"><svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></span>';
            html += '</button>';
        });
        els.surahList.innerHTML = html;

        els.surahList.querySelectorAll('.qr-surah-item').forEach(function (item) {
            item.addEventListener('click', function () {
                loadSurah(parseInt(item.getAttribute('data-id')));
                els.sidebar.classList.remove('open');
            });
        });
    }

    function loadSurah(id, targetVerse) {
        if (id < 1 || id > 114) return;
        currentSurah = id;
        stopAudio();
        if (els.tafsirModalBackdrop && !els.tafsirModalBackdrop.hidden) closeTafsirModal();
        if (els.simBackdrop && !els.simBackdrop.hidden) closeMutashabihatModal();
        if (els.infoBackdrop && !els.infoBackdrop.hidden) closeSurahInfoModal();
        if (els.mushafBackdrop && !els.mushafBackdrop.hidden) closeMushaf();
        hideFnTooltip();

        var ch = chapters[id - 1];
        if (!ch) return;

        saveLastRead(ch.id, targetVerse || 1);

        els.surahList.querySelectorAll('.qr-surah-item').forEach(function (item) {
            item.classList.toggle('active', parseInt(item.getAttribute('data-id')) === id);
        });
        var activeItem = els.surahList.querySelector('.qr-surah-item.active');
        if (activeItem && els.sidebar) {
            var sb = els.sidebar;
            var headerEl = sb.querySelector('.qr-sidebar-header');
            var headerH = headerEl ? headerEl.offsetHeight : 0;
            var sbRect = sb.getBoundingClientRect();
            var itemRect = activeItem.getBoundingClientRect();
            var visibleH = sb.clientHeight - headerH;
            var target = sb.scrollTop + (itemRect.top - sbRect.top) - (visibleH - itemRect.height) / 2;
            target = Math.max(0, Math.min(target, sb.scrollHeight - sb.clientHeight));
            sb.scrollTop = target;
        }

        renderSurahHeader(ch);
        renderVerses(ch);

        els.prevBtn.disabled = id <= 1;
        els.nextBtn.disabled = id >= 114;
        els.navBottom.style.display = 'flex';

        els.main.scrollTop = 0;

        updateSidebarBookmarks();
        if (targetVerse) {
            scrollToVerse(ch.id, targetVerse);
        } else {
            scrollToLastReadVerse(ch);
        }
    }

    function renderSurahHeader(ch) {
        var revLabel = ch.revelation_place === 'makkah' ? 'Meccan' : 'Medinan';
        var html = '';
        html += '<div class="qr-surah-header-name-ar" dir="rtl">' + SURAH_LIGATURES[ch.id - 1] + '</div>';
        html += '<div class="qr-surah-header-name-en">Surah ' + escapeHtml(ch.en) + '</div>';
        html += '<div class="qr-surah-header-info-wrap">';
        html += '<button class="qr-surah-info-btn" type="button" title="Surah Information (English &amp; Tamil)" aria-label="Surah Information">';
        html += '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
        html += '<span>Surah Info</span>';
        html += '</button>';
        html += '</div>';
        html += '<div class="qr-surah-header-meta">';
        html += '<span><span class="meta-label">Verses:</span> <span class="meta-value">' + ch.verses + '</span></span>';
        html += '<span class="meta-divider">|</span>';
        html += '<span><span class="meta-label">Revealed:</span> <span class="meta-value">' + revLabel + '</span></span>';
        html += '<span class="meta-divider">|</span>';
        html += '<span><span class="meta-label">Order:</span> <span class="meta-value">' + ch.revelation_order + '</span></span>';
        html += '</div>';

        if (ch.id !== 9) {
            html += '<div class="qr-surah-header-bismillah">\u0628\u0650\u0633\u0652\u0645\u0650 \u0671\u0644\u0644\u064e\u0651\u0647\u0650 \u0671\u0644\u0631\u064e\u0651\u062d\u0652\u0645\u064e\u0670\u0646\u0650 \u0671\u0644\u0631\u064e\u0651\u062d\u0650\u064a\u0645\u0650</div>';
        }

        els.surahHeader.innerHTML = html;
        document.fonts.ready.then(function() {
            var el = els.surahHeader.querySelector('.qr-surah-header-name-ar');
            if (el) el.style.opacity = '1';
        });

        wireSurahInfoButton();
    }

    function ordinal(n) {
        var mod100 = n % 100;
        if (mod100 >= 11 && mod100 <= 13) return n + 'th';
        var mod10 = n % 10;
        if (mod10 === 1) return n + 'st';
        if (mod10 === 2) return n + 'nd';
        if (mod10 === 3) return n + 'rd';
        return n + 'th';
    }

    // Short theme chips from the ayah-themes bundle (used when a surah has no
    // curated SURAH_INFO entry): the first few range themes, truncated.
    function getSurahThemeChips(ch) {
        var themes = getQulBundle('ayah-themes');
        if (!themes) return [];
        var list = themes[String(ch.id)] || [];
        var chips = [];
        for (var i = 0; i < list.length && chips.length < 4; i++) {
            var theme = list[i].theme || '';
            if (theme.length > 64) theme = theme.slice(0, 61) + '\u2026';
            if (chips.indexOf(theme) === -1) chips.push(theme);
        }
        return chips;
    }

    function wireSurahInfoButton() {
        var infoBtn = els.surahHeader.querySelector('.qr-surah-info-btn');
        if (infoBtn) {
            infoBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                if (currentSurah) openSurahInfoModal(chapters[currentSurah - 1]);
            });
        }
    }

    function renderVerses(ch) {
        var indopakData = getCachedData('indopak-nastaleeq-verse');
        var transData = getCurrentTranslationData();
        var wbwMode = els.wbwToggle && els.wbwToggle.checked;
        var wbwWordData = wbwMode ? getCachedData('indopak-nastaleeq-word') : null;
        var wbwTransData = wbwMode ? getCurrentWbwData() : null;
        var bookmarks = getBookmarks();
        var html = '';

        for (var v = 1; v <= ch.verses; v++) {
            var key = ch.id + ':' + v;
            var verse = indopakData ? indopakData[key] : null;
            var transEntry = transData ? transData[key] : null;
            var isBm = bookmarks.indexOf(key) !== -1;

            var chPad = pad(ch.id, 3);
            var vPad = pad(v, 3);

            // Parse inline [[footnote]] markers once per verse into [seg, note] pairs
            var fnParts = [];
            var src = transEntry ? (transEntry.t || '') : '';
            if (src.indexOf('[[') !== -1) {
                var r = /\[\[([^\]]*)\]\]/g;
                var m;
                var lastPos = 0;
                while ((m = r.exec(src)) !== null) {
                    fnParts.push({ seg: src.slice(lastPos, m.index), note: m[1].trim() });
                    lastPos = r.lastIndex;
                }
                fnParts.push({ seg: src.slice(lastPos), note: '' });
            } else {
                fnParts.push({ seg: src, note: '' });
            }
            var transText = extractTranslationText(src);

            var transHtml = '';
            for (var pi = 0; pi < fnParts.length; pi++) {
                var piece = fnParts[pi];
                if (piece.seg) transHtml += escapeHtml(piece.seg);
                if (piece.note) {
                    var fnKey = key + ':fn' + (pi + 1);
                    _fnNotes[fnKey] = { verseKey: key, text: piece.note };
                    transHtml += '<sup class="qr-fn-sup" role="button" tabindex="0" data-fnkey="' + fnKey + '" data-verse="' + v + '" data-num="' + (pi + 1) + '" aria-label="Footnote ' + (pi + 1) + '">' + (pi + 1) + '</sup>';
                }
            }
            if (!transHtml && transText) transHtml = escapeHtml(transText);

            html += '<div class="qr-verse-row' + (wbwMode ? ' wbw-active' : '') + '" id="row-' + key.replace(':', '-') + '" data-key="' + key + '">';

            // Head row: verse number (surah:verse), play
            html += '<div class="qr-verse-head">';
            html += '<span class="qr-verse-tnum">' + ch.id + ':' + v + '</span>';
            html += '<button class="qr-verse-tplay" data-chapter="' + ch.id + '" data-verse="' + v + '" data-chpad="' + chPad + '" data-vpad="' + vPad + '" aria-label="Play"><svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg></button>';
            html += '</div>';

            // Verse body: Arabic + Translation in a single container
            html += '<div class="qr-verse-body">';
            html += '<div class="qr-verse-arabic" id="ar-' + key.replace(':', '-') + '" dir="rtl">';
            if (wbwMode && wbwWordData && wbwTransData) {
                var wIdx = 1;
                var anyWordRendered = false;
                while (wbwWordData[key + ':' + wIdx]) {
                    var wordObj = wbwWordData[key + ':' + wIdx];
                    var wbwTrans = wbwTransData[key + ':' + wIdx] || '';
                    var isArabicLetter = /[\u0600-\u06FF]/.test(wordObj.text);
                    if (!isArabicLetter && !wbwTrans) { wIdx++; continue; }
                    html += '<span class="qr-word-unit" data-wi="' + wIdx + '">';
                    html += '<span class="qr-word-arabic">' + wordObj.text + '</span>';
                    if (wbwTrans) {
                        html += '<span class="qr-word-trans">' + escapeHtml(wbwTrans) + '</span>';
                    }
                    html += '</span>';
                    anyWordRendered = true;
                    wIdx++;
                }
                if (!anyWordRendered && verse) {
                    html += verse.text;
                }
            } else {
                html += verse ? verse.text : '';
            }
            html += '</div>';

            if (transHtml) {
                html += '<div class="qr-verse-translation"><span class="qr-verse-translation-inner">' + transHtml + '</span></div>';
            }
            html += '</div>';

            // Action row: Tafsir book-icon trigger + Theme + Similar Ayat trigger
            html += '<div class="qr-verse-action">';
            html += '<button class="qr-tafsir-book" type="button" data-key="' + key + '" aria-label="Tafsir for verse ' + v + '" title="Tafsir">';
            html += '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>';
            html += '</button>';
            html += '<button class="qr-theme-book" type="button" data-key="' + key + '" aria-label="Theme for verse ' + v + '" title="Theme">';
            html += '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>';
            html += '</button>';
            html += '<button class="qr-sim-book" type="button" data-key="' + key + '" aria-label="Similar Ayat for verse ' + v + '" title="Similar Ayat">';
            html += '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';
            html += '</button>';
            html += '<button class="qr-muta-book" type="button" data-key="' + key + '" aria-label="Mutashabihat for verse ' + v + '" title="Mutashabihat">';
            html += '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="6" height="14" rx="1.5"/><rect x="9" y="3" width="6" height="14" rx="1.5"/></svg>';
            html += '</button>';
            html += '</div>';

            html += '</div>';
        }

        els.verses.innerHTML = html;

        els.verses.querySelectorAll('.qr-verse-tplay').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                playFromVerse(parseInt(this.getAttribute('data-chapter')), parseInt(this.getAttribute('data-verse')), true);
            });
        });

        els.verses.querySelectorAll('.qr-fn-sup').forEach(function (sup) {
            sup.addEventListener('mouseenter', function (e) {
                e.stopPropagation();
                showFnTooltip(this);
            });
            sup.addEventListener('mouseleave', function (e) {
                e.stopPropagation();
                hideFnTooltip();
            });
            sup.addEventListener('focus', function () {
                showFnTooltip(this);
            });
            sup.addEventListener('blur', function () {
                hideFnTooltip();
            });
            sup.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') {
                    e.stopPropagation();
                    hideFnTooltip();
                }
            });
        });

        els.verses.querySelectorAll('.qr-tafsir-book').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var key = this.getAttribute('data-key');
                var parts = key.split(':');
                openTafsirFor(chapters[parseInt(parts[0], 10) - 1], parseInt(parts[1], 10));
            });
        });

        els.verses.querySelectorAll('.qr-sim-book').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var parts = this.getAttribute('data-key').split(':');
                openSimilarAyatFor(chapters[parseInt(parts[0], 10) - 1], parseInt(parts[1], 10));
            });
        });
        els.verses.querySelectorAll('.qr-muta-book').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var parts = this.getAttribute('data-key').split(':');
                openMutashabihatFor(chapters[parseInt(parts[0], 10) - 1], parseInt(parts[1], 10));
            });
        });
        els.verses.querySelectorAll('.qr-theme-book').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                toggleAyahTheme(this);
            });
        });
    }

    /* ---- QUL enriched resources (surah overviews, ayah themes, similar ayat) ---- */

    function getQulBundle(key) {
        var d = window.__QURAN_DATA;
        return (d && d[key]) || getCachedData(key) || null;
    }

    function loadQulBundle(key, cb) {
        if (getQulBundle(key)) {
            if (cb) setTimeout(cb, 0);
            return;
        }
        loadFromCacheOrFetch(key, QUL_BUNDLES[key], cb);
    }

    // Warm the QUL bundles in the background after the reader is usable.
    function preloadQulBundles() {
        for (var key in QUL_BUNDLES) {
            if (QUL_LAZY_KEYS[key]) continue;
            if (getQulBundle(key)) continue;
            loadQulBundle(key, function () {});
        }
    }

    // Strip HTML tags/entities to plain text for compact card summaries.
    function stripHtml(html) {
        if (!html) return '';
        var div = document.createElement('div');
        div.innerHTML = html;
        return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
    }

    // Truncate long summaries at a word boundary with an ellipsis.
    function truncateText(text, max) {
        if (!text) return '';
        if (text.length <= max) return text;
        var cut = text.slice(0, max);
        var sp = cut.lastIndexOf(' ');
        if (sp > max * 0.6) cut = cut.slice(0, sp);
        return cut.replace(/\s+$/, '') + '\u2026';
    }

    /* ---- Data loading ---- */

    function loadEssentialData(callback) {
        var loaded = 0;
        var total = 2;

        function checkDone() {
            loaded++;
            if (loaded >= total && callback) callback();
        }

        loadFromCacheOrFetch(
            'indopak-nastaleeq-verse',
            'js/quran_source/indopak-nastaleeq-verse.js',
            function () { checkDone(); }
        );

        var defaultTrans = window.__QURAN_TRANSLATIONS && window.__QURAN_TRANSLATIONS.hilali;
        if (defaultTrans) {
            loadFromCacheOrFetch(
                defaultTrans.file,
                'js/quran_source/' + defaultTrans.file + '.js',
                function () { checkDone(); }
            );
        } else {
            checkDone();
        }
    }

    function loadBackgroundTranslations() {
        var registry = window.__QURAN_TRANSLATIONS || {};
        var keys = Object.keys(registry);
        keys.forEach(function (key) {
            var t = registry[key];
            if (t.file === 'taqi-ud-din-al-hilali-muhsin-khan-inline-footnotes') return;
            if (getCachedData(t.file)) return;
            loadFromCacheOrFetch(t.file, 'js/quran_source/' + t.file + '.js', function () {});
        });

        if (!getCachedData('english-wbw-translation')) {
            loadFromCacheOrFetch('english-wbw-translation', 'js/quran_source/english-wbw-translation.js', function () {});
        }
        if (!getCachedData('tamil-wbw-translation')) {
            loadFromCacheOrFetch('tamil-wbw-translation', 'js/quran_source/tamil-wbw-translation.js', function () {});
        }
    }

    function getAudioUrl(item) {
        var cfg = RECITER_CFG[currentReciter];
        if (!cfg) return null;
        var seg = _segCache[cfg.segKey];
        if (!seg) return null;
        if (cfg.mode === 'surah') {
            return seg.audio[String(item.chapter)] || null;
        }
        var entry = seg.verses[item.key];
        return (entry && entry.audio) || null;
    }

    function loadWbwData(callback) {
        var wordKey = 'indopak-nastaleeq-word';
        var cachedWord = getCachedData(wordKey);

        var lang = getWbwLang();
        var wbwFile = lang === 'ta' ? 'tamil-wbw-translation' : 'english-wbw-translation';
        var cachedWbw = getCachedData(wbwFile);

        if (cachedWord && cachedWbw) {
            if (callback) callback();
            return;
        }

        var wbwLabel = els.wbwToggleLabel.querySelector('.qr-wbw-label');
        var origText = wbwLabel ? wbwLabel.textContent : '';
        if (wbwLabel) wbwLabel.textContent = 'Loading...';

        var loadedCount = 0;
        function checkWbwDone() {
            loadedCount++;
            if (loadedCount >= 2) {
                if (wbwLabel) wbwLabel.textContent = origText;
                if (callback) callback();
            }
        }

        if (!cachedWord) {
            if (typeof Worker !== 'undefined') {
                try {
                    var worker = new Worker('js/quran-loader-worker.js');
                    worker.postMessage({
                        file: wordKey,
                        url: 'js/quran_source/indopak-nastaleeq-word.js'
                    });
                    worker.onmessage = function (e) {
                        if (e.data.status === 'done') {
                            window.__QURAN_CACHE[wordKey] = e.data.data;
                            worker.terminate();
                            checkWbwDone();
                        } else if (e.data.status === 'error') {
                            worker.terminate();
                            loadFromCacheOrFetch(wordKey, 'js/quran_source/indopak-nastaleeq-word.js', function () { checkWbwDone(); });
                        }
                    };
                    worker.onerror = function () {
                        worker.terminate();
                        loadFromCacheOrFetch(wordKey, 'js/quran_source/indopak-nastaleeq-word.js', function () { checkWbwDone(); });
                    };
                } catch (e) {
                    // file:// blocks Workers — fall back to main-thread script load
                    loadFromCacheOrFetch(wordKey, 'js/quran_source/indopak-nastaleeq-word.js', function () { checkWbwDone(); });
                }
            } else {
                loadFromCacheOrFetch(wordKey, 'js/quran_source/indopak-nastaleeq-word.js', function () { checkWbwDone(); });
            }
        } else {
            checkWbwDone();
        }

        if (!cachedWbw) {
            loadFromCacheOrFetch(wbwFile, 'js/quran_source/' + wbwFile + '.js', function () {
                checkWbwDone();
            });
        } else {
            checkWbwDone();
        }
    }

    function fetchAndCacheFallback(fileKey, url, callback) {
        loadFromCacheOrFetch(fileKey, url, callback);
    }

    /* ---- Translation helpers ---- */

    function getCurrentTranslationData() {
        var registry = window.__QURAN_TRANSLATIONS || {};
        var entry = registry[currentTranslation];
        return entry ? getCachedData(entry.file) : null;
    }

    function getWbwLang() {
        var saved = localStorage.getItem('quran-wbw-lang') || 'auto';
        if (saved !== 'auto') return saved;
        var registry = window.__QURAN_TRANSLATIONS || {};
        var entry = registry[currentTranslation];
        return entry && entry.lang === 'ta' ? 'ta' : 'en';
    }

    function getCurrentWbwData() {
        var lang = getWbwLang();
        var wbwFile = lang === 'ta' ? 'tamil-wbw-translation' : 'english-wbw-translation';
        return getCachedData(wbwFile) || null;
    }

    function extractTranslationText(text) {
        if (!text) return '';
        return text.replace(/\[\[[^\]]*\]\]/g, '').trim();
    }

    /* ---- Inline footnote tooltips ---- */

    function showFnTooltip(btn) {
        if (!els.fnTooltip) return;
        var fnKey = btn.getAttribute('data-fnkey');
        var num = btn.getAttribute('data-num') || '1';
        var note = _fnNotes[fnKey] ? _fnNotes[fnKey].text : '';
        if (!note) return;
        els.fnTooltip.innerHTML = '<span class="qr-fn-tooltip-label">Footnote ' + num + '</span> ' + escapeHtml(note);
        els.fnTooltip.style.display = 'block';
        els.fnTooltip.style.visibility = 'hidden';
        els.fnTooltip.style.top = '0px';
        els.fnTooltip.style.left = '0px';
        var tw = els.fnTooltip.offsetWidth;
        var th = els.fnTooltip.offsetHeight;
        var vr = btn.getBoundingClientRect();
        var top = vr.bottom + 10;
        var left = vr.left + vr.width / 2 - tw / 2;
        if (left < 8) left = 8;
        if (left + tw > window.innerWidth - 8) left = window.innerWidth - tw - 8;
        if (top + th + 10 > window.innerHeight - 8) {
            top = Math.max(8, vr.top - th - 10);
        }
        els.fnTooltip.style.top = top + 'px';
        els.fnTooltip.style.left = left + 'px';
        els.fnTooltip.style.visibility = 'visible';
    }

    function hideFnTooltip() {
        if (els.fnTooltip) els.fnTooltip.style.display = 'none';
    }

    /* ---- Tafsir modal popup ---- */

    function getDefaultTafsirLang() {
        if (els.tafsirLangSelect && els.tafsirLangSelect.value) return els.tafsirLangSelect.value;
        return localStorage.getItem('quran-tafsir-lang') || 'ta';
    }

    function openTafsirFor(ch, ayah) {
        if (!els.tafsirModalBackdrop) return;
        tafsirState = { ch: ch, ayah: ayah };
        updateJumpSelect();
        if (els.tafsirModalLang) els.tafsirModalLang.value = getDefaultTafsirLang();
        updateModalHeader();
        loadTafsirIntoModal();
        els.tafsirModalBackdrop.hidden = false;
        document.body.style.overflow = 'hidden';
        els.tafsirModalBody.focus && els.tafsirModalBody.focus();
    }

    function closeTafsirModal() {
        if (!els.tafsirModalBackdrop) return;
        els.tafsirModalBackdrop.hidden = true;
        document.body.style.overflow = '';
        tafsirState = null;
    }

    function tafsirStep(delta) {
        if (!tafsirState) return;
        var next = tafsirState.ayah + delta;
        if (next < 1 || next > tafsirState.ch.verses) return;
        tafsirState.ayah = next;
        els.tafsirJump.value = String(next);
        updateModalHeader();
        loadTafsirIntoModal();
        els.tafsirModalBody.scrollTop = 0;
    }

    function updateJumpSelect() {
        if (!els.tafsirJump || !tafsirState) return;
        var opts = '';
        for (var a = 1; a <= tafsirState.ch.verses; a++) {
            opts += '<option value="' + a + '"' + (a === tafsirState.ayah ? ' selected' : '') + '>' + tafsirState.ch.id + ':' + a + '</option>';
        }
        els.tafsirJump.innerHTML = opts;
    }

    function updateModalHeader() {
        if (!tafsirState) return;
        if (els.tafsirSurahAr) els.tafsirSurahAr.textContent = tafsirState.ch.ar || '';
        if (els.tafsirSurahEn) els.tafsirSurahEn.textContent = tafsirState.ch.en || '';
        if (els.tafsirVerse) els.tafsirVerse.textContent = tafsirState.ch.id + ':' + tafsirState.ayah;
        if (els.tafsirPrev) els.tafsirPrev.disabled = tafsirState.ayah <= 1;
        if (els.tafsirNext) els.tafsirNext.disabled = tafsirState.ayah >= tafsirState.ch.verses;
        if (els.tafsirJump && els.tafsirJump.value !== String(tafsirState.ayah)) {
            els.tafsirJump.value = String(tafsirState.ayah);
        }
    }

    function loadTafsirIntoModal() {
        if (!tafsirState || !els.tafsirModalBody) return;
        var lang = getDefaultTafsirLang();
        loadTafsirContent(tafsirState.ch.id + ':' + tafsirState.ayah, tafsirState.ch.id, tafsirState.ayah, tafsirState.ch, lang, els.tafsirModalBody, els.tafsirModalSource);
    }

    /* ---- Mutashabihat / Similar Ayat modal ---- */

    function setupMutashabihatModal() {
        if (!els.simBackdrop) return;
        if (els.simClose) els.simClose.addEventListener('click', closeMutashabihatModal);
        if (els.simSizeDown) els.simSizeDown.addEventListener('click', function () { adjustSimSize(-1); });
        if (els.simSizeUp) els.simSizeUp.addEventListener('click', function () { adjustSimSize(1); });
        els.simBackdrop.addEventListener('click', function (e) {
            if (e.target === els.simBackdrop) closeMutashabihatModal();
        });
        document.addEventListener('keydown', function (e) {
            if (els.simBackdrop && !els.simBackdrop.hidden && e.key === 'Escape') {
                e.preventDefault();
                closeMutashabihatModal();
            }
        });
    }

    function applySimSize() {
        if (els.simBody) els.simBody.style.fontSize = simSize + 'px';
    }

    function adjustSimSize(delta) {
        simSize = Math.max(12, Math.min(28, simSize + delta));
        localStorage.setItem('quran-sim-size', String(simSize));
        applySimSize();
    }

    function openSimilarAyatFor(ch, ayah) {
        openSimModal(ch, ayah, 'similar');
    }

    function openMutashabihatFor(ch, ayah) {
        openSimModal(ch, ayah, 'qul');
    }

    function openSimModal(ch, ayah, mode) {
        if (!els.simBackdrop) return;
        if (els.simModal) els.simModal.setAttribute('aria-label', mode === 'qul' ? 'Mutashabihat' : 'Similar Ayat');
        simState = { ch: ch, ayah: ayah, key: ch.id + ':' + ayah, mode: mode || 'curated' };
        if (els.simSurahAr) els.simSurahAr.textContent = ch.ar || '';
        if (els.simSurahEn) els.simSurahEn.textContent = ch.en || '';
        if (els.simVerse) els.simVerse.textContent = simState.key;
        if (els.simSource) els.simSource.textContent = mode === 'qul'
            ? 'Verses sharing repeated phrases with this ayah \u00b7 Mutashabihat are verses or passages that closely resemble each other in wording or phrasing, often with subtle differences.'
            : (mode === 'similar'
                ? 'Similar Ayat \u00b7 word-overlap matches across the Quran, sorted by similarity score'
                : 'Curated similar & related verses \u00b7 Project cross-references');
        if (els.simBody) els.simBody.innerHTML = '<p class="qr-sim-empty">Loading \u2026</p>';
        els.simBackdrop.hidden = false;
        document.body.style.overflow = 'hidden';
        if (els.simBody) els.simBody.focus && els.simBody.focus();
        var renderNow = function () {
            try { if (document.fonts && document.fonts.load) document.fonts.load('30px qpc-hafs'); } catch (e) {}
            renderSimBody();
        };
        if (mode === 'qul') {
            loadQulBundle('mutashabihat', function () {
                loadQulBundle('qpc-hafs-word', renderNow);
            });
        } else if (mode === 'similar') {
            loadQulBundle('similar-ayah', function () {
                loadQulBundle('qpc-hafs-word', renderNow);
            });
        } else {
            loadQulBundle('qpc-hafs-word', renderNow);
        }
    }

    function closeMutashabihatModal() {
        if (!els.simBackdrop) return;
        els.simBackdrop.hidden = true;
        document.body.style.overflow = '';
        simState = null;
    }

    function getCuratedRefs(key) {
        var refs = [];
        var seen = {};
        (MUTASHABIHAT[key] || []).forEach(function (r) {
            if (!seen[r.key]) {
                seen[r.key] = true;
                refs.push(r);
            }
        });
        return refs;
    }

    function getSimilarAyahRefs(key, max) {
        var refs = [];
        var sa = getQulBundle('similar-ayah');
        if (!sa) return refs;
        var matches = sa[key] || [];
        max = max || 12;
        for (var i = 0; i < matches.length && i < max; i++) {
            var m = matches[i];
            var mk = m.matched_ayah_key;
            if (!mk || mk === key) continue;
            refs.push({ key: mk, similar: true, match: m });
        }
        return refs;
    }

    function getAyahTheme(ch, ayah) {
        var themes = getQulBundle('ayah-themes');
        if (!themes) return '';
        var list = themes[String(ch.id)] || [];
        for (var i = 0; i < list.length; i++) {
            if (ayah >= list[i].from && ayah <= list[i].to) return list[i].theme || '';
        }
        return '';
    }

    function toggleAyahTheme(btn) {
        if (!btn) return;
        var key = btn.getAttribute('data-key');
        var parts = key.split(':');
        var ch = chapters[parseInt(parts[0], 10) - 1];
        var ayah = parseInt(parts[1], 10);
        var existing = btn.parentNode.querySelector('.qr-ayah-theme-text');
        if (existing) {
            existing.remove();
            btn.classList.remove('is-active');
            return;
        }
        var show = function () {
            var theme = getAyahTheme(ch, ayah);
            var txt = theme || 'No specific theme recorded for this verse.';
            var span = document.createElement('span');
            span.className = 'qr-ayah-theme-text';
            span.textContent = txt;
            btn.parentNode.appendChild(span);
            btn.classList.add('is-active');
        };
        if (getQulBundle('ayah-themes')) {
            show();
        } else {
            loadQulBundle('ayah-themes', show);
        }
    }

    // QPC-Hafs Uthmani words for an ayah (array positions are the 1-based
    // range indices the build clamps spans against). Falls back to the stored
    // Indopak verse text split on whitespace so the popup still renders if the
    // bundle has not loaded yet.
    function getQpcWords(key, fallbackText) {
        var b = getQulBundle('qpc-hafs-word');
        var words = b && b[key];
        if (words && words.length) return words;
        return (fallbackText || '').split(/\s+/).filter(Boolean);
    }

    // Render an ayah's words as spans; ranges ([[from,to]]) apply to array
    // positions and get the given css class. Empty cls renders plain words.
    function renderWordsSpans(words, ranges, cls) {
        var out = [];
        for (var i = 0; i < words.length; i++) {
            var inRange = false;
            if (ranges && ranges.length) {
                for (var ri = 0; ri < ranges.length; ri++) {
                    var lo = ranges[ri][0], hi = ranges[ri][1];
                    if ((i + 1) >= lo && (i + 1) <= hi) { inRange = true; break; }
                }
            }
            out.push(inRange && cls
                ? '<span class="' + cls + '">' + escapeHtml(words[i]) + '</span>'
                : escapeHtml(words[i]));
        }
        return out.join(' ');
    }

    var QUL_HL_CLASSES = ['qr-sim-hl-0', 'qr-sim-hl-1', 'qr-sim-hl-2'];

    function getQulPhraseEntries(key) {
        var entries = [];
        var mb = getQulBundle('mutashabihat');
        if (!mb || !mb.byAyah || !mb.phrases) return entries;
        (mb.byAyah[key] || []).forEach(function (e) {
            var ph = mb.phrases[String(e[0])];
            if (!ph) return;
            entries.push({ pid: String(e[0]), ranges: e[1] || [], ph: ph });
        });
        return entries;
    }

    // Pick the highlight slot (phrase card index) covering a 1-based word
    // position in the current ayah. Overlapping phrases resolve to the
    // narrowest range (mirrors the QUL preview, where a sub-phrase keeps its
    // own colour inside a longer phrase).
    function qulCoverSlot(entries, idx) {
        var best = -1, bestLen = Infinity;
        for (var s = 0; s < entries.length; s++) {
            var ranges = entries[s].ranges;
            for (var r = 0; r < ranges.length; r++) {
                var lo = ranges[r][0], hi = ranges[r][1];
                if (idx >= lo && idx <= hi) {
                    var len = hi - lo;
                    if (len < bestLen) { bestLen = len; best = s; }
                }
            }
        }
        return best;
    }

    function renderColoredVerse(key, entries, fallbackText) {
        var words = getQpcWords(key, fallbackText);
        if (!words.length) return '';
        var out = [];
        for (var i = 0; i < words.length; i++) {
            var slot = qulCoverSlot(entries, i + 1);
            if (slot >= 0) {
                out.push('<span class="' + QUL_HL_CLASSES[slot % QUL_HL_CLASSES.length] + '">'
                    + escapeHtml(words[i]) + '</span>');
            } else {
                out.push(escapeHtml(words[i]));
            }
        }
        return out.join(' ');
    }

    function renderPhraseWords(ph, slot) {
        var src = ph.src || [];
        var skey = src[0];
        var words = skey ? getQpcWords(skey, ph.text) : (ph.text || '').split(/\s+/).filter(Boolean);
        var lo = Math.max(0, (src[1] || 1) - 1);
        var hi = Math.min(words.length, src[2] || words.length);
        var cls = QUL_HL_CLASSES[slot % QUL_HL_CLASSES.length];
        var out = [];
        for (var i = lo; i < hi && i < words.length; i++) {
            out.push('<span class="qr-sim-pill ' + cls + '">' + escapeHtml(words[i]) + '</span>');
        }
        return out.length ? out.join(' ') : escapeHtml(ph.text || '');
    }

    function renderRefAyah(key, ranges, cls, transData) {
        var parts = key.split(':');
        var rSurah = chapters[parseInt(parts[0], 10) - 1];
        var html = '<div class="qr-sim-ref-ayah" data-key="' + key + '">';
        html += '<div class="qr-sim-ref-ayah-key">' + key
            + (rSurah ? ' \u00b7 ' + escapeHtml(rSurah.en) : '') + '</div>';
        var arabicHtml = renderWordsSpans(getQpcWords(key), ranges || [], cls || 'qr-sim-highlight');
        if (arabicHtml) {
            html += '<div class="qr-sim-ref-ayah-arabic" dir="rtl">' + arabicHtml + '</div>';
        }
        if (transData && transData[key] && transData[key].t) {
            var snippet = extractTranslationText(transData[key].t);
            if (snippet) html += '<div class="qr-sim-ref-ayah-en">' + escapeHtml(snippet) + '</div>';
        }
        html += '</div>';
        return html;
    }

    function renderQulBody(key, transData) {
        var entries = getQulPhraseEntries(key);
        if (!entries.length) return '';
        var verseData = getCachedData('indopak-nastaleeq-verse');
        var html = '';
        html += '<div class="qr-sim-section-title">' + escapeHtml('Phrases in ' + key) + '</div>';
        html += '<div class="qr-sim-list">';
        for (var s = 0; s < entries.length; s++) {
            var en = entries[s];
            var ph = en.ph;
            var n = ph.count, a = ph.ayahs, su = ph.surahs;
            var statsTxt = 'This phrase is repeated ' + n + ' times in ' + a
                + ' ayah' + (a === 1 ? '' : 's') + ' across ' + su + ' surah'
                + (su === 1 ? '' : 's') + '.';
            html += '<div class="qr-sim-phrase-card">';
            html += '<div class="qr-sim-phrase-pills" dir="rtl">'
                + renderPhraseWords(ph, s) + '</div>';
            html += '<div class="qr-sim-phrase-stats">' + escapeHtml(statsTxt) + '</div>';
            html += '<button class="qr-sim-viewall" type="button" data-phr="' + en.pid + '">View all</button>';
            html += '<div class="qr-sim-phrase-ayahs" data-phr-panel="' + en.pid + '" hidden>';
            var rangeMap = ph.ranges || {};
            var refKeys = Object.keys(rangeMap).length ? Object.keys(rangeMap) : (ph.refs || []);
            refKeys = refKeys.slice().sort(function (ka, kb) {
                var pa = ka.split(':'), pb = kb.split(':');
                return (parseInt(pa[0], 10) - parseInt(pb[0], 10))
                    || (parseInt(pa[1], 10) - parseInt(pb[1], 10));
            });
            var cls = QUL_HL_CLASSES[s % QUL_HL_CLASSES.length];
            for (var j = 0; j < refKeys.length; j++) {
                html += renderRefAyah(refKeys[j], rangeMap[refKeys[j]], cls, transData);
            }
            html += '</div>';
            html += '</div>';
        }
        html += '</div>';
        return html;
    }

    function renderSimItem(r, verseData, transData) {
        var rData = verseData && verseData[r.key] ? verseData[r.key] : null;
        var rArabic = rData ? rData.text : '';
        var parts = r.key.split(':');
        var rSurah = chapters[parseInt(parts[0], 10) - 1];
        var snippet = r.snippet;
        if (!snippet && transData && transData[r.key]) {
            snippet = extractTranslationText(transData[r.key].t || '');
        }
        var html = '<button class="qr-sim-item" type="button" data-key="' + r.key + '">';
        var arabicHtml = renderWordsSpans(
            getQpcWords(r.key, rArabic),
            (r.similar && r.match) ? (r.match.match_words || []) : null,
            'qr-sim-highlight');
        if (arabicHtml) html += '<div class="qr-sim-item-arabic" dir="rtl">' + arabicHtml + '</div>';
        if (r.phrase) html += '<div class="qr-sim-item-phrase" dir="rtl">' + escapeHtml(r.phrase) + '</div>';
        html += '<div class="qr-sim-item-meta">';
        html += '<span class="qr-sim-item-key">' + r.key + '</span>';
        if (rSurah) html += '<span class="qr-sim-item-surah">' + escapeHtml(rSurah.en) + '</span>';
        html += '</div>';
        if (r.similar && r.match) {
            var m = r.match;
            var summ = m.matched_words_count + ' words matched \u00b7 ' + m.coverage + '% overlap \u00b7 score ' + m.score;
            html += '<div class="qr-sim-item-summary">' + escapeHtml(summ) + '</div>';
        }
        if (snippet) html += '<div class="qr-sim-item-snippet">' + escapeHtml(snippet) + '</div>';
        html += '</button>';
        return html;
    }

    function bindSimNavigation(root) {
        root.querySelectorAll('.qr-sim-item, .qr-sim-ref-ayah[data-key]').forEach(function (item) {
            item.addEventListener('click', function () {
                var k = this.getAttribute('data-key');
                var p = k.split(':');
                var srcKey = simState ? simState.key : '';
                closeMutashabihatModal();
                loadSurah(parseInt(p[0], 10), parseInt(p[1], 10));
                if (srcKey) showNavToast(srcKey, k);
            });
        });
    }

    function bindQulViewAll(root) {
        root.querySelectorAll('.qr-sim-viewall').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var pid = this.getAttribute('data-phr');
                var panel = root.querySelector('[data-phr-panel="' + pid + '"]');
                if (!panel) return;
                var hidden = panel.hidden;
                panel.hidden = !hidden;
                this.textContent = hidden ? 'Hide ayahs' : 'View all';
            });
        });
    }

    function renderSimBody() {
        if (!simState || !els.simBody) return;
        var key = simState.key;
        var verseData = getCachedData('indopak-nastaleeq-verse');
        var transData = getCurrentTranslationData();
        var arabic = verseData && verseData[key] ? verseData[key].text : '';
        var mode = simState.mode === 'qul' ? 'qul' : (simState.mode === 'similar' ? 'similar' : 'curated');
        var html = '';

        html += '<div class="qr-sim-current">';
        html += '<span class="qr-sim-current-label">' + escapeHtml('Current verse') + '</span>';
        if (mode === 'qul') {
            var entries = getQulPhraseEntries(key);
            html += '<div class="qr-sim-current-arabic" dir="rtl">' + renderColoredVerse(key, entries, arabic) + '</div>';
        } else {
            html += '<div class="qr-sim-current-arabic" dir="rtl">' + renderWordsSpans(getQpcWords(key, arabic), null, '') + '</div>';
        }
        html += '<div class="qr-sim-current-key">' + key + '</div>';
        html += '</div>';

        if (mode === 'qul') {
            var qulEntries = getQulPhraseEntries(key);
            if (!qulEntries.length) {
                html += '<p class="qr-sim-empty">No Mutashabihat (repeated-phrase) matches are recorded for this verse.</p>';
            } else {
                html += renderQulBody(key, transData);
            }
            els.simBody.innerHTML = html;
            bindQulViewAll(els.simBody);
            bindSimNavigation(els.simBody);
            applySimSize();
            return;
        }

        var refs = (mode === 'similar') ? getSimilarAyahRefs(key, 1000) : getCuratedRefs(key);
        var emptyMsg = mode === 'similar'
            ? 'No similar-word matches are recorded for this verse.'
            : 'No curated similar verses are recorded for this verse yet. Check the Mutashabihat button for repeated-phrase matches across the Quran.';
        if (!refs.length) {
            html += '<p class="qr-sim-empty">' + escapeHtml(emptyMsg) + '</p>';
        } else {
            if (mode === 'similar') {
                html += '<div class="qr-sim-count-banner">'
                    + escapeHtml(key + ' has ' + refs.length + ' similar ayah' + (refs.length === 1 ? '' : 's'))
                    + '</div>';
            }
            var sectionTitle = mode === 'similar'
                ? 'Similar Ayat \u2014 word-overlap matches across the Quran'
                : 'Curated similar / related verses (project-reviewed cross-references)';
            html += '<div class="qr-sim-section">';
            html += '<div class="qr-sim-section-title">' + escapeHtml(sectionTitle) + '</div>';
            html += '<div class="qr-sim-list">';
            refs.forEach(function (r) { html += renderSimItem(r, verseData, transData); });
            html += '</div>';
            html += '</div>';
        }
        els.simBody.innerHTML = html;
        bindSimNavigation(els.simBody);
        applySimSize();
    }

    /* ---- Surah Information modal (full bilingual overview) ---- */

    function setupSurahInfoModal() {
        if (!els.infoBackdrop) return;
        if (els.infoClose) els.infoClose.addEventListener('click', closeSurahInfoModal);
        els.infoBackdrop.addEventListener('click', function (e) {
            if (e.target === els.infoBackdrop) closeSurahInfoModal();
        });
        document.addEventListener('keydown', function (e) {
            if (els.infoBackdrop && !els.infoBackdrop.hidden && e.key === 'Escape') {
                e.preventDefault();
                closeSurahInfoModal();
            }
        });
        if (els.infoLangSelect) {
            els.infoLangSelect.addEventListener('change', function () {
                localStorage.setItem('quran-info-lang', this.value);
                if (infoState && infoState.ch) renderInfoBody(infoState.ch);
            });
        }
        if (els.infoSizeDown) els.infoSizeDown.addEventListener('click', function () { adjustInfoSize(-1); });
        if (els.infoSizeUp) els.infoSizeUp.addEventListener('click', function () { adjustInfoSize(1); });
    }

    function loadSurahInfoBundles(cb) {
        var need = ['surah-info-en', 'surah-info-ta', 'ayah-themes'].filter(function (k) {
            return !getQulBundle(k);
        });
        if (!need.length) {
            if (cb) setTimeout(cb, 0);
            return;
        }
        var pending = need.length, done = function () {
            pending--;
            if (pending <= 0 && cb) cb();
        };
        need.forEach(function (key) { loadQulBundle(key, done); });
    }

    function openSurahInfoModal(ch) {
        if (!els.infoBackdrop) return;
        infoState = { ch: ch };
        if (els.infoSurahAr) els.infoSurahAr.textContent = ch.ar || '';
        if (els.infoSurahEn) els.infoSurahEn.textContent = 'Surah ' + (ch.en || '');
        if (els.infoSource) els.infoSource.textContent = 'Detailed Surah Overview \u00b7 English & Tamil';
        if (els.infoBody) els.infoBody.innerHTML = '<p class="qr-sim-empty">Loading surah information \u2026</p>';
        els.infoBackdrop.hidden = false;
        document.body.style.overflow = 'hidden';
        loadSurahInfoBundles(function () { renderInfoBody(ch); });
    }

    function closeSurahInfoModal() {
        if (!els.infoBackdrop) return;
        els.infoBackdrop.hidden = true;
        document.body.style.overflow = '';
        infoState = null;
    }

    function getSurahInfoFull(ch) {
        var curated = SURAH_INFO[String(ch.id)];
        var enEntry = getQulBundle('surah-info-en');
        var taEntry = getQulBundle('surah-info-ta');
        enEntry = enEntry && enEntry[String(ch.id)];
        taEntry = taEntry && taEntry[String(ch.id)];
        var enFull = '', taFull = '', enChips = [], taChips = [];
        if (curated) {
            enFull = curated.en.summary; taFull = curated.ta.summary;
            enChips = curated.en.themes || []; taChips = curated.ta.themes || [];
        }
        if (enEntry) {
            if (!curated) enFull = stripHtml(enEntry.short_text || enEntry.text);
            enChips = enChips.length ? enChips : getSurahThemeChips(ch);
        }
        if (taEntry) taFull = taFull || stripHtml(taEntry.short_text || taEntry.text);
        return { en: { full: enFull, themes: enChips }, ta: { full: taFull, themes: taChips } };
    }

    function infoRichHtmlEn(ch) {
        var entry = getQulBundle('surah-info-en');
        entry = entry && entry[String(ch.id)];
        var s = entry && (entry.text || entry.short_text);
        if (!s) return '';
        return '<div class="qr-info-rich">' + asRichHtml(s) + '</div>';
    }

    function infoRichHtmlTa(ch) {
        var entry = getQulBundle('surah-info-ta');
        entry = entry && entry[String(ch.id)];
        var s = entry && (entry.text || entry.short_text);
        if (!s) return '';
        return '<div class="qr-info-rich" dir="auto">' + asRichHtml(s) + '</div>';
    }

    function asRichHtml(s) {
        return s.replace(/<h2>/gi, '<h4 class="qr-info-sub">')
                .replace(/<\/h2>/gi, '</h4>')
                .replace(/<p align="center"/gi, '<p class="qr-info-center"');
    }

    function renderInfoBody(ch) {
        if (!els.infoBody) return;
        var info = getSurahInfoFull(ch);
        var lang = els.infoLangSelect ? els.infoLangSelect.value : 'en';
        var html = '';

        html += '<div class="qr-info-section" dir="' + (lang === 'ta' ? 'auto' : 'ltr') + '">';
        if (lang === 'en') {
            if (info.en.full) html += '<p class="qr-info-summary">' + escapeHtml(info.en.full) + '</p>';
            var enChips = info.en.themes || [];
            if (enChips.length) {
                html += '<div class="qr-surah-info-themes">';
                enChips.forEach(function (t) { html += '<span class="qr-surah-theme">' + escapeHtml(t) + '</span>'; });
                html += '</div>';
            }
            html += infoRichHtmlEn(ch);
        } else {
            if (info.ta.full) html += '<p class="qr-info-summary">' + escapeHtml(info.ta.full) + '</p>';
            var taChips = info.ta.themes || [];
            if (taChips.length) {
                html += '<div class="qr-surah-info-themes">';
                taChips.forEach(function (t) { html += '<span class="qr-surah-theme">' + escapeHtml(t) + '</span>'; });
                html += '</div>';
            }
            html += infoRichHtmlTa(ch);
        }
        html += '</div>';

        els.infoBody.innerHTML = html;
        els.infoBody.style.fontSize = infoSize + 'px';
    }

    function applyInfoSize() {
        if (els.infoBody) els.infoBody.style.fontSize = infoSize + 'px';
    }

    function adjustInfoSize(delta) {
        infoSize = Math.max(12, Math.min(28, infoSize + delta));
        localStorage.setItem('quran-info-size', String(infoSize));
        applyInfoSize();
    }

    /* ---- Mushaf view ---- */

    function setupMushaf() {
        if (!els.mushafBackdrop) return;
        var openBtn = document.getElementById('qr-mushaf-open');
        var fab = document.getElementById('qr-mushaf-fab');
        if (openBtn) openBtn.addEventListener('click', openMushaf);
        if (fab) fab.addEventListener('click', openMushaf);
        if (els.mushafClose) els.mushafClose.addEventListener('click', closeMushaf);
        if (els.mushafPrev) els.mushafPrev.addEventListener('click', function () { mushafPage(-1); });
        if (els.mushafNext) els.mushafNext.addEventListener('click', function () { mushafPage(1); });
        els.mushafBackdrop.addEventListener('click', function (e) {
            if (e.target === els.mushafBackdrop) closeMushaf();
        });
        document.addEventListener('keydown', function (e) {
            if (els.mushafBackdrop && !els.mushafBackdrop.hidden) {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    closeMushaf();
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    mushafPage(e.key === 'ArrowRight' ? 1 : -1);
                }
            }
        });
    }

    function buildMushafPages(ch) {
        var verseData = getCachedData('indopak-nastaleeq-verse');
        var verses = [];
        for (var v = 1; v <= ch.verses; v++) {
            var entry = verseData ? verseData[ch.id + ':' + v] : null;
            verses.push({ n: v, text: entry ? entry.text : '' });
        }
        var pages = [];
        var current = [];
        var currentLen = 0;
        var MAX_LEN = 1800;
        verses.forEach(function (item) {
            if (current.length > 0 && currentLen + item.text.length > MAX_LEN) {
                pages.push(current);
                current = [];
                currentLen = 0;
            }
            current.push(item);
            currentLen += item.text.length + 4;
        });
        if (current.length) pages.push(current);
        if (!pages.length) pages.push([]);
        return pages;
    }

    function renderMushafPage() {
        if (!mushafState.ch || !els.mushafPageEl) return;
        var ch = mushafState.ch;
        var page = mushafState.pages[mushafState.page - 1] || [];
        var html = '';
        if (mushafState.page === 1) {
            html += '<div class="qr-mushaf-surah-head">';
            html += '<div class="qr-mushaf-surah-ar" dir="rtl">' + (SURAH_LIGATURES[ch.id - 1] || '') + '</div>';
            html += '<div class="qr-mushaf-surah-en">Surah ' + escapeHtml(ch.en) + '</div>';
            if (ch.id !== 9) {
                html += '<div class="qr-mushaf-bismillah" dir="rtl">\u0628\u0650\u0633\u0652\u0645\u0650 \u0671\u0644\u0644\u064e\u0651\u0647\u0650 \u0671\u0644\u0631\u064e\u0651\u062d\u0652\u0645\u064e\u0670\u0646\u0650 \u0671\u0644\u0631\u064e\u0651\u062d\u0650\u064a\u0645\u0650</div>';
            }
            html += '</div>';
        }
        page.forEach(function (item) {
            html += '<div class="qr-mushaf-verse">';
            html += '<span class="qr-mushaf-verse-text">' + item.text + '</span>';
            html += '<span class="qr-mushaf-verse-num" aria-hidden="true">' + item.n + '</span>';
            html += '</div>';
        });
        els.mushafPageEl.innerHTML = html;
        if (els.mushafTitle) els.mushafTitle.textContent = 'Surah ' + ch.en + ' \u00b7 Mushaf view';
        if (els.mushafPageInfo) els.mushafPageInfo.textContent = mushafState.page + ' / ' + mushafState.pages.length;
        if (els.mushafPrev) els.mushafPrev.disabled = mushafState.page <= 1;
        if (els.mushafNext) els.mushafNext.disabled = mushafState.page >= mushafState.pages.length;
        if (els.mushafPageEl) els.mushafPageEl.scrollTop = 0;
    }

    function mushafPage(delta) {
        if (!mushafState.ch) return;
        var next = mushafState.page + delta;
        if (next < 1 || next > mushafState.pages.length) return;
        mushafState.page = next;
        renderMushafPage();
    }

    function openMushaf() {
        if (!els.mushafBackdrop) return;
        var ch = chapters[currentSurah - 1];
        if (!ch) return;
        mushafState = { ch: ch, page: 1, pages: buildMushafPages(ch) };
        renderMushafPage();
        els.mushafBackdrop.hidden = false;
        document.body.style.overflow = 'hidden';
    }

    function closeMushaf() {
        if (!els.mushafBackdrop) return;
        els.mushafBackdrop.hidden = true;
        document.body.style.overflow = '';
        mushafState = { ch: null, page: 1, pages: [] };
    }

    function tafsirContentCurrent(surah, ayah, lang) {
        if (!tafsirState) return false;
        return tafsirState.ch.id === surah && tafsirState.ayah === ayah && getDefaultTafsirLang() === lang;
    }

    function updatePinButton() {
        if (!els.tafsirPin) return;
        els.tafsirPin.classList.toggle('is-pinned', tafsirPinned);
        els.tafsirPin.setAttribute('aria-pressed', tafsirPinned ? 'true' : 'false');
        els.tafsirPin.innerHTML = tafsirPinned
            ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10v2l-1 1v4l2 3v2H6v-2l2-3V7L7 6V4zm3 16h4v-3h-4v3z"/></svg>'
            : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10v2l-1 1v4l2 3v2H6v-2l2-3V7L7 6V4zm3 16h4v-3h-4v3z"/></svg>';
        els.tafsirPin.title = tafsirPinned ? 'Unpin (closes with X)' : 'Pin (keep open)';
    }

    function applyTafsirSize() {
        if (els.tafsirModalBody) els.tafsirModalBody.style.fontSize = tafsirSize + 'px';
    }

    function adjustTafsirSize(delta) {
        tafsirSize = Math.max(12, Math.min(28, tafsirSize + delta));
        localStorage.setItem('quran-tafsir-size', String(tafsirSize));
        applyTafsirSize();
    }

    function loadTafsirContent(key, surahNum, ayahNum, ch, lang, bodyEl, srcEl) {
        if (!bodyEl) return;
        bodyEl.innerHTML = '<p class="qr-tafsir-loading">Loading tafsir...</p>';
        bodyEl.dir = lang === 'en' ? 'ltr' : 'auto';
        if (srcEl) {
            srcEl.textContent = lang === 'en'
                ? 'Source: Tafsir Ibn Kathir (Abridged) \u00b7 quran.com'
                : 'Source: Tafsir Ibn Kathir (Tamil) \u00b7 tamililquran.com';
        }

        if (lang === 'en') {
            loadEnglishTafsir(surahNum, ayahNum, function (html) {
                if (!tafsirContentCurrent(surahNum, ayahNum, 'en')) return;
                if (html) {
                    bodyEl.innerHTML = html;
                } else {
                    bodyEl.innerHTML = '<p class="qr-tafsir-missing">Tafsir Ibn Kathir (English) is not yet available for this verse. Switch the tafsir language to Tamil or check back later.</p>';
                }
            });
        } else {
            var fileKey = 'tafsir-ta-' + pad(surahNum, 3);
            var filePath = 'js/tafsir/tamil-' + pad(surahNum, 3) + '.js';
            loadFromCacheOrFetch(fileKey, filePath, function (data) {
                if (!tafsirContentCurrent(surahNum, ayahNum, 'ta')) return;
                var entry = data && data.data ? data.data[String(ayahNum)] : null;
                if (entry && entry.html) {
                    bodyEl.innerHTML = entry.html;
                } else {
                    bodyEl.innerHTML = '<p class="qr-tafsir-missing">Tafsir Ibn Kathir (Tamil) is not yet available for this verse. Switch the tafsir language to English or check back later.</p>';
                }
            });
        }
    }

    /* ---- MCP English tafsir (live quran.ai) ---- */

    var MCP_ENDPOINT = 'https://mcp.quran.ai/';
    var mcpSessionId = null;
    var mcpNonce = null;
    var mcpReady = null;
    var mcpSeq = 100;

    function parseSseText(text) {
        var lines = text.split(/\r?\n/);
        var dataParts = [];
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (line.indexOf('data:') === 0) dataParts.push(line.slice(5).trim());
        }
        return JSON.parse(dataParts.join('\n'));
    }

    function mcpExtractText(msg) {
        if (msg && msg.result && msg.result.content && msg.result.content.length) {
            return msg.result.content[0].text || '';
        }
        return '';
    }

    function mcpHeaders() {
        var headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream'
        };
        if (mcpSessionId) headers['mcp-session-id'] = mcpSessionId;
        return headers;
    }

    function mcpRequest(method, params) {
        var body = JSON.stringify({ jsonrpc: '2.0', id: ++mcpSeq, method: method, params: params || {} });
        return fetch(MCP_ENDPOINT, { method: 'POST', headers: mcpHeaders(), body: body }).then(function (resp) {
            if (!resp.ok) throw new Error('MCP HTTP ' + resp.status);
            var sid = resp.headers.get('mcp-session-id');
            if (sid) mcpSessionId = sid;
            return resp.text().then(function (t) {
                if (!t) return {};
                var ct = resp.headers.get('content-type') || '';
                if (ct.indexOf('text/event-stream') !== -1) return parseSseText(t);
                return JSON.parse(t);
            });
        });
    }

    function mcpNotify(method, params) {
        var body = JSON.stringify({ jsonrpc: '2.0', method: method, params: params || {} });
        return fetch(MCP_ENDPOINT, { method: 'POST', headers: mcpHeaders(), body: body })
            .then(function () {})
            .catch(function () {});
    }

    function mcpInit() {
        if (mcpReady) return mcpReady;
        mcpReady = mcpRequest('initialize', {
            protocolVersion: '2025-03-26',
            capabilities: {},
            clientInfo: { name: 'siratkids-quran-reader', version: '1.0.0' }
        }).then(function () {
            mcpNotify('notifications/initialized', {});
            return mcpRequest('tools/call', { name: 'fetch_grounding_rules', arguments: {} });
        }).then(function (msg) {
            var m = /grounding_nonce>([^<]+)<\/grounding_nonce>/.exec(mcpExtractText(msg));
            mcpNonce = m ? m[1] : null;
            return mcpNonce;
        }).catch(function (err) {
            mcpReady = null;
            throw err;
        });
        return mcpReady;
    }

    function mcpFetchTafsir(surah, ayah) {
        return mcpInit().then(function () {
            return mcpRequest('tools/call', {
                name: 'fetch_tafsir',
                arguments: { ayahs: surah + ':' + ayah, editions: 'en-ibn-kathir', grounding_nonce: mcpNonce }
            });
        }).then(function (msg) {
            var txt = mcpExtractText(msg);
            if (!txt) return null;
            var data;
            try { data = JSON.parse(txt); } catch (e) { return null; }
            var res = data && data.results && data.results['en-ibn-kathir'];
            return (res && res.length > 0 && res[0].text) ? res[0].text : null;
        });
    }

    function loadEnglishTafsir(surah, ayah, callback) {
        var fileKey = 'tafsir-en-mcp-' + pad(surah, 3) + '-' + pad(ayah, 3);
        var cached = getCachedData(fileKey);
        if (cached) { callback(cached); return; }
        mcpFetchTafsir(surah, ayah).then(function (html) {
            if (html && window.putCachedData) window.putCachedData(fileKey, html);
            callback(html);
        }).catch(function () {
            callback(null);
        });
    }

    /* ---- Bookmarks ---- */

    function getBookmarks() {
        try { return JSON.parse(localStorage.getItem('quran-bookmarks')) || []; } catch (e) { return []; }
    }

    function setBookmarks(d) { localStorage.setItem('quran-bookmarks', JSON.stringify(d)); }

    function toggleBookmark(key) {
        var bm = getBookmarks();
        var idx = bm.indexOf(key);
        if (idx === -1) bm.push(key); else bm.splice(idx, 1);
        setBookmarks(bm);

        document.querySelectorAll('.qr-verse-tbookmark[data-key="' + key + '"]').forEach(function (btn) {
            var on = bm.indexOf(key) !== -1;
            btn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="' + (on ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
            btn.classList.toggle('bookmarked', on);
        });
        updateSidebarBookmarks();
    }

    function updateSidebarBookmarks() {
        var bm = getBookmarks();
        var surahs = {};
        bm.forEach(function (k) { surahs[k.split(':')[0]] = true; });
        els.surahList.querySelectorAll('.qr-bookmark-star').forEach(function (star) {
            star.classList.toggle('show', !!surahs[star.getAttribute('data-surah')]);
        });
    }

    /* ---- Audio ---- */

    function playFromVerse(chapterId, verseNum, singleOnly) {
        stopAudio();
        hideContinuePrompt();

        var ch = chapters[chapterId - 1];
        if (!ch) return;

        isSinglePlay = !!singleOnly;
        singlePlayChapter = ch;

        audioQueue = [];
        if (singleOnly) {
            audioQueue.push({ chapter: chapterId, verse: verseNum, key: chapterId + ':' + verseNum });
        } else {
            for (var v = verseNum; v <= ch.verses; v++) {
                audioQueue.push({ chapter: chapterId, verse: v, key: chapterId + ':' + v });
            }
        }
        if (audioQueue.length === 0) return;
        isPlaying = true;
        isPaused = false;

        showFixedBar(ch, verseNum);
        updatePlayPauseIcon();
        playNextAudio();
    }

    function playNextAudio() {
        var gen = ++audioGen;

        if (!isPlaying || audioQueue.length === 0) {
            if (isSinglePlay && singlePlayChapter) {
                showContinuePrompt(singlePlayChapter);
            } else {
                finishAudio();
            }
            return;
        }

        var item = audioQueue[0];
        els.playbarVerse.textContent = 'Loading...';
        ensureSegmentData(function () {
            if (gen !== audioGen) return;
            startVersePlayback(item, gen);
        });
    }

    function startVersePlayback(item, gen) {
        restoreArabic();
        document.querySelectorAll('.qr-verse-row.playing').forEach(function (el) { el.classList.remove('playing'); });

        var ch = chapters[item.chapter - 1];
        var rowId = 'row-' + item.chapter + '-' + item.verse;
        var rowEl = document.getElementById(rowId);
        if (rowEl) {
            rowEl.classList.add('playing');
            rowEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }

        updateFixedBar(item, ch);
        lastPlayedVerse = item.verse;
        saveLastRead(item.chapter, item.verse);

        var wbwOn = els.wbwToggle && els.wbwToggle.checked;
        if (!wbwOn || (rowEl && !rowEl.querySelector('.qr-word-unit'))) {
            renderWordSpans(item);
        }

        var entry = getSegmentEntry(item);
        var url = getAudioUrl(item);
        if (!url || !entry) {
            restoreArabic();
            audioQueue.shift();
            playNextAudio();
            return;
        }

        var cfg = RECITER_CFG[currentReciter];
        if (cfg.mode === 'surah') {
            startSurahVerse(item, entry, url, gen);
        } else {
            startPerVerseAudio(item, url, gen);
        }
    }

    function startPerVerseAudio(item, url, gen) {
        var newAudio = new Audio(url);
        var lastScrollTime = 0;
        newAudio.addEventListener('timeupdate', function () {
            if (gen !== audioGen) return;
            var entry = getSegmentEntry(item);
            if (entry) updateWordHighlight(item, newAudio.currentTime * 1000);
            var now = Date.now();
            if (now - lastScrollTime > 800) {
                lastScrollTime = now;
                var row = document.getElementById('row-' + item.chapter + '-' + item.verse);
                if (row) row.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
        });
        newAudio.addEventListener('ended', function () {
            if (gen !== audioGen) return;
            restoreArabic();
            audioQueue.shift();
            playNextAudio();
        });
        newAudio.addEventListener('error', function () {
            if (gen !== audioGen) return;
            restoreArabic();
            audioQueue.shift();
            playNextAudio();
        });
        newAudio.play().catch(function () {
            if (gen !== audioGen) return;
            restoreArabic();
            audioQueue.shift();
            playNextAudio();
        });
        audioEl = newAudio;
        _surahAudioSrc = null;
    }

    function startSurahVerse(item, entry, url, gen) {
        if (audioEl && _surahAudioSrc === url) {
            audioEl.currentTime = entry.start / 1000;
            if (audioEl.paused) audioEl.play().catch(function () {});
            return;
        }

        _surahAudioSrc = url;
        var newAudio = new Audio(url);
        audioEl = newAudio;
        var lastScrollTime = 0;

        newAudio.addEventListener('timeupdate', function () {
            if (!isPlaying) return;
            var cfg = RECITER_CFG[currentReciter];
            if (!cfg || cfg.mode !== 'surah') return;
            var curItem = audioQueue[0];
            if (!curItem) return;
            var curEntry = getSegmentEntry(curItem);
            if (curEntry) {
                updateWordHighlight(curItem, newAudio.currentTime * 1000);
                if (newAudio.currentTime * 1000 >= curEntry.end) {
                    if (audioQueue.length === 1 && isSinglePlay && audioEl) audioEl.pause();
                    restoreArabic();
                    audioQueue.shift();
                    playNextAudio();
                }
            }
            var now = Date.now();
            if (now - lastScrollTime > 800) {
                lastScrollTime = now;
                var row = document.getElementById('row-' + curItem.chapter + '-' + curItem.verse);
                if (row) row.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
        });
        newAudio.addEventListener('ended', function () {
            if (!isPlaying) return;
            if (audioQueue.length === 0) { finishAudio(); return; }
            var curItem = audioQueue[0];
            var curEntry = getSegmentEntry(curItem);
            if (curEntry) {
                audioEl.currentTime = curEntry.start / 1000;
                audioEl.play().catch(function () {});
            } else {
                finishAudio();
            }
        });
        newAudio.addEventListener('error', function () {
            if (!isPlaying) return;
            restoreArabic();
            audioQueue.shift();
            playNextAudio();
        });
        newAudio.currentTime = entry.start / 1000;
        newAudio.play().catch(function () {
            if (!isPlaying) return;
            restoreArabic();
            audioQueue.shift();
            playNextAudio();
        });
    }

    function getSegmentEntry(item) {
        var cfg = RECITER_CFG[currentReciter];
        if (!cfg) return null;
        var seg = _segCache[cfg.segKey];
        return seg && seg.verses[item.key] ? seg.verses[item.key] : null;
    }

    function getWordTimingMap(item) {
        var cacheKey = currentReciter + ':' + item.key;
        if (_wordTimingCache[cacheKey]) return _wordTimingCache[cacheKey];
        var entry = getSegmentEntry(item);
        if (!entry) return null;
        var map = {};
        for (var i = 0; i < entry.segments.length; i++) {
            var seg = entry.segments[i];
            map[seg[0]] = [seg[1], seg[2]];
        }
        _wordTimingCache[cacheKey] = map;
        return map;
    }

    function ensureSegmentData(callback) {
        var cfg = RECITER_CFG[currentReciter];
        if (!cfg) { if (callback) callback(); return; }
        if (_segCache[cfg.segKey]) { ensureWordData(callback); return; }
        loadFromCacheOrFetch(cfg.segKey, cfg.segFile, function (data) {
            if (data) _segCache[cfg.segKey] = data;
            ensureWordData(callback);
        }, cfg.segKey);
    }

    function ensureWordData(callback) {
        if (getCachedData('indopak-nastaleeq-word')) { if (callback) callback(); return; }
        loadFromCacheOrFetch('indopak-nastaleeq-word', 'js/quran_source/indopak-nastaleeq-word.js', function () {
            if (callback) callback();
        });
    }

    function renderWordSpans(item) {
        var rowId = 'row-' + item.chapter + '-' + item.verse;
        var rowEl = document.getElementById(rowId);
        if (!rowEl) return;
        var arEl = rowEl.querySelector('.qr-verse-arabic');
        if (!arEl) return;
        var wordData = getCachedData('indopak-nastaleeq-word');
        if (!wordData) return;
        if (!arabicOrigMap[rowId]) {
            arabicOrigMap[rowId] = arEl.innerHTML;
        }
        var spans = [];
        var w = 1;
        var unit;
        while ((unit = wordData[item.key + ':' + w]) && unit.char_type === 'word') {
            spans.push('<span class="qr-ut-word" data-wi="' + w + '">' + unit.text + '</span>');
            w++;
        }
        if (spans.length > 0) arEl.innerHTML = spans.join(' ');
    }

    function updateWordHighlight(item, currentTimeMs) {
        var entry = getSegmentEntry(item);
        if (!entry) return;
        var cfg = RECITER_CFG[currentReciter];
        if (!cfg) return;
        var t = cfg.mode === 'surah' ? currentTimeMs : currentTimeMs - entry.start;
        var map = getWordTimingMap(item);
        if (!map) return;
        var rowId = 'row-' + item.chapter + '-' + item.verse;
        var rowEl = document.getElementById(rowId);
        if (!rowEl) return;
        var targets = rowEl.querySelectorAll('.qr-word-unit[data-wi], .qr-ut-word');
        for (var j = 0; j < targets.length; j++) {
            var el = targets[j];
            var wi = parseInt(el.getAttribute('data-wi'), 10);
            var tm = wi ? map[wi] : null;
            if (!tm) {
                el.classList.remove('active', 'done');
                continue;
            }
            if (t >= tm[1]) {
                el.classList.add('done');
                el.classList.remove('active');
            } else if (t >= tm[0]) {
                el.classList.add('active');
                el.classList.remove('done');
            } else {
                el.classList.remove('active', 'done');
            }
        }
    }

    function restoreArabic() {
        Object.keys(arabicOrigMap).forEach(function (rowId) {
            var rowEl = document.getElementById(rowId);
            var arEl = rowEl ? rowEl.querySelector('.qr-verse-arabic') : null;
            if (arEl) arEl.innerHTML = arabicOrigMap[rowId];
        });
        arabicOrigMap = {};
        document.querySelectorAll('.qr-word-unit.active, .qr-word-unit.done, .qr-ut-word.active, .qr-ut-word.done').forEach(function (el) {
            el.classList.remove('active', 'done');
        });
    }

    function togglePause() {
        if (!isPlaying) return;
        if (isPaused) { resumeAudio(); } else { pauseAudio(); }
    }

    function pauseAudio() {
        if (!audioEl || !isPlaying) return;
        isPaused = true;
        audioEl.pause();
        els.fixedPlayBar.classList.remove('playing');
        updatePlayPauseIcon();
    }

    function resumeAudio() {
        if (!isPlaying) return;
        isPaused = false;
        if (audioEl) {
            audioEl.play().catch(function () {});
        } else if (audioQueue.length > 0) {
            playNextAudio();
        }
        els.fixedPlayBar.classList.add('playing');
        updatePlayPauseIcon();
    }

    function playNext() {
        if (!isPlaying || audioQueue.length <= 1) return;
        ++audioGen;
        var cfg = RECITER_CFG[currentReciter];
        if (cfg && cfg.mode === 'surah') {
            audioQueue.shift();
            if (audioQueue.length > 0) {
                isPaused = false;
                updatePlayPauseIcon();
                playNextAudio();
            }
            return;
        }
        if (audioEl) { audioEl.pause(); audioEl.src = ''; }
        audioEl = null;
        audioQueue.shift();
        if (audioQueue.length > 0) {
            isPaused = false;
            updatePlayPauseIcon();
            playNextAudio();
        }
    }

    function playPrev() {
        if (!isPlaying || audioQueue.length === 0) return;
        var first = audioQueue[0];
        if (!first) return;
        var prevVerse = first.verse - 1;
        if (prevVerse < 1) return;
        var ch = chapters[first.chapter - 1];
        if (!ch) return;
        ++audioGen;
        var cfg = RECITER_CFG[currentReciter];
        audioQueue.unshift({ chapter: first.chapter, verse: prevVerse, key: first.chapter + ':' + prevVerse });
        if (cfg && cfg.mode === 'surah') {
            isPaused = false;
            updatePlayPauseIcon();
            playNextAudio();
            return;
        }
        if (audioEl) { audioEl.pause(); audioEl.src = ''; }
        audioEl = null;
        isPaused = false;
        updatePlayPauseIcon();
        playNextAudio();
    }

    function stopAudio() {
        ++audioGen;
        isPlaying = false;
        isPaused = false;
        isSinglePlay = false;
        singlePlayChapter = null;
        lastPlayedVerse = 0;
        hideContinuePrompt();
        if (audioEl) { audioEl.pause(); audioEl.src = ''; audioEl = null; }
        _surahAudioSrc = null;
        audioQueue = [];
        restoreArabic();
        document.querySelectorAll('.qr-verse-row.playing').forEach(function (el) { el.classList.remove('playing'); });
        els.fixedPlayBar.classList.remove('playing');
        updatePlayPauseIcon();
    }

    function finishAudio() {
        ++audioGen;
        isPlaying = false;
        isPaused = false;
        isSinglePlay = false;
        singlePlayChapter = null;
        lastPlayedVerse = 0;
        hideContinuePrompt();
        if (audioEl) { audioEl.pause(); audioEl.src = ''; audioEl = null; }
        _surahAudioSrc = null;
        audioQueue = [];
        restoreArabic();
        document.querySelectorAll('.qr-verse-row.playing').forEach(function (el) { el.classList.remove('playing'); });
        els.fixedPlayBar.classList.remove('playing');
        updatePlayPauseIcon();
    }

    function showFixedBar(ch, verseNum) {
        els.playbarSurah.textContent = ch.en;
        els.playbarVerse.textContent = 'Verse ' + verseNum;
        els.fixedPlayBar.classList.add('playing');
    }

    function updateFixedBar(item, ch) {
        if (ch) els.playbarSurah.textContent = ch.en;
        els.playbarVerse.textContent = 'Verse ' + item.verse;
    }

    function updatePlayPauseIcon() {
        var pauseIcon = els.playbarPlayPause.querySelector('.qr-playbar-pause-icon');
        var playIcon = els.playbarPlayPause.querySelector('.qr-playbar-play-icon');
        if (!pauseIcon || !playIcon) return;
        if (!isPlaying || isPaused) {
            pauseIcon.style.display = 'none';
            playIcon.style.display = 'block';
            els.playbarPlayPause.setAttribute('aria-label', 'Play');
            els.fixedPlayBar.classList.remove('playing');
        } else {
            pauseIcon.style.display = 'block';
            playIcon.style.display = 'none';
            els.playbarPlayPause.setAttribute('aria-label', 'Pause');
            els.fixedPlayBar.classList.add('playing');
        }
    }

    function showContinuePrompt(ch) {
        if (!els.continuePrompt) return;
        els.continuePrompt.style.display = 'flex';
    }

    function hideContinuePrompt() {
        if (els.continuePrompt) els.continuePrompt.style.display = 'none';
    }

    function continuePlay() {
        hideContinuePrompt();
        if (!singlePlayChapter) return;
        var startVerse = lastPlayedVerse > 0 ? lastPlayedVerse + 1 : 1;
        if (startVerse > singlePlayChapter.verses) { stopAudio(); return; }
        isSinglePlay = false;
        audioQueue = [];
        for (var v = startVerse; v <= singlePlayChapter.verses; v++) {
            audioQueue.push({ chapter: singlePlayChapter.id, verse: v, key: singlePlayChapter.id + ':' + v });
        }
        if (audioQueue.length > 0) {
            isPlaying = true;
            isPaused = false;
            updatePlayPauseIcon();
            playNextAudio();
        }
    }

    function scrollToLastReadVerse(ch) {
        var lastRead = localStorage.getItem('quran-last-read');
        if (!lastRead) return;
        var parts = lastRead.split(':');
        var sid = parseInt(parts[0]), vn = parseInt(parts[1]);
        if (sid !== ch.id || !vn) return;

        var rowId = 'row-' + sid + '-' + vn;
        var rowEl = document.getElementById(rowId);
        if (rowEl) {
            setTimeout(function () {
                rowEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
                rowEl.style.transition = 'background 0.5s';
                rowEl.style.background = 'rgba(79,70,229,0.12)';
                setTimeout(function () { rowEl.style.background = ''; }, 1500);
            }, 300);
        }
    }

    function clearVerseFlash() {
        document.querySelectorAll('.qr-flash-target').forEach(function (el) {
            el.classList.remove('qr-flash-target');
        });
    }

    function scrollToVerse(sid, vn) {
        var ch = chapters[sid - 1];
        if (!ch || vn < 1 || vn > ch.verses) return;
        var rowEl = document.getElementById('row-' + sid + '-' + vn);
        if (!rowEl) return;
        clearVerseFlash();
        var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        setTimeout(function () {
            rowEl.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
            rowEl.setAttribute('tabindex', '-1');
            rowEl.classList.add('qr-flash-target');
            try { rowEl.focus({ preventScroll: true }); } catch (e) { rowEl.focus(); }
            clearTimeout(_flashTimer);
            _flashTimer = setTimeout(clearVerseFlash, 2400);
        }, 60);
    }

    function showNavToast(srcKey, tgtKey) {
        if (!els.navToast) return;
        var sp = srcKey.split(':'), tp = tgtKey.split(':');
        var srcSid = parseInt(sp[0], 10), srcVn = parseInt(sp[1], 10);
        var tgtSid = parseInt(tp[0], 10), tgtVn = parseInt(tp[1], 10);
        var srcCh = chapters[srcSid - 1], tgtCh = chapters[tgtSid - 1];
        if (!srcCh || !tgtCh || !srcVn || !tgtVn) return;
        els.navToast.innerHTML =
            '<span class="qr-nav-toast-msg">Jumped from <strong>' + srcKey + '</strong> to <strong>' + tgtKey + '</strong></span>' +
            '<button type="button" class="qr-nav-toast-back" id="qr-nav-toast-back">Back to ' + srcKey + '</button>' +
            '<button type="button" class="qr-nav-toast-close" id="qr-nav-toast-close" aria-label="Dismiss">&#10005;</button>';
        els.navToast.hidden = false;
        var backBtn = els.navToast.querySelector('#qr-nav-toast-back');
        var closeBtn = els.navToast.querySelector('#qr-nav-toast-close');
        backBtn.onclick = function () {
            hideNavToast();
            loadSurah(srcSid, srcVn);
        };
        closeBtn.onclick = hideNavToast;
        clearTimeout(_toastTimer);
        _toastTimer = setTimeout(hideNavToast, 6000);
    }

    function hideNavToast() {
        clearTimeout(_toastTimer);
        if (els.navToast) els.navToast.hidden = true;
    }

    function saveLastRead(sid, vn) {
        if (!sid || !vn || sid < 1 || sid > 114) return;
        localStorage.setItem('quran-last-read', sid + ':' + vn);
    }

    var _scrollSaveTimer = null;

    function trackScrollPosition() {
        clearTimeout(_scrollSaveTimer);
        _scrollSaveTimer = null;
        if (!els.main || !currentSurah) return;
        var rows = els.main.querySelectorAll('.qr-verse-row');
        if (!rows.length) return;
        var mainTop = els.main.getBoundingClientRect().top;
        var vn = 1;
        for (var i = 0; i < rows.length; i++) {
            if (rows[i].getBoundingClientRect().bottom - mainTop > 0) { vn = i + 1; break; }
        }
        if (vn >= 1 && vn <= rows.length) saveLastRead(currentSurah, vn);
    }

    function setupScrollTracking() {
        if (!els.main) return;
        els.main.addEventListener('scroll', function () {
            clearTimeout(_scrollSaveTimer);
            _scrollSaveTimer = setTimeout(trackScrollPosition, 350);
        }, { passive: true });
        window.addEventListener('pagehide', function () {
            trackScrollPosition();
            if (isPlaying && singlePlayChapter && lastPlayedVerse > 0) {
                saveLastRead(singlePlayChapter.id, lastPlayedVerse);
            }
        });
    }

    /* ---- Helpers ---- */

    function pad(n, len) {
        var s = n.toString();
        while (s.length < len) s = '0' + s;
        return s;
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function escapeAttr(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    /* ---- Custom dropdowns ---- */

    function initDropdowns() {
        document.querySelectorAll('.qr-dropdown').forEach(function (container) {
            var native = container.querySelector('.qr-nav-select');
            if (!native) return;

            var trigger = document.createElement('button');
            trigger.type = 'button';
            trigger.className = 'qr-dropdown-trigger';
            trigger.setAttribute('aria-haspopup', 'listbox');
            trigger.setAttribute('aria-expanded', 'false');

            var valueSpan = document.createElement('span');
            valueSpan.className = 'qr-dropdown-value';
            trigger.appendChild(valueSpan);

            var chevronNS = 'http://www.w3.org/2000/svg';
            var chevron = document.createElementNS(chevronNS, 'svg');
            chevron.setAttribute('viewBox', '0 0 24 24');
            chevron.setAttribute('width', '14');
            chevron.setAttribute('height', '14');
            chevron.setAttribute('fill', 'none');
            chevron.setAttribute('stroke', 'currentColor');
            chevron.setAttribute('stroke-width', '2.5');
            chevron.setAttribute('stroke-linecap', 'round');
            chevron.classList.add('qr-dropdown-chevron');
            var polyline = document.createElementNS(chevronNS, 'polyline');
            polyline.setAttribute('points', '6,9 12,15 18,9');
            chevron.appendChild(polyline);
            trigger.appendChild(chevron);

            var menu = document.createElement('ul');
            menu.className = 'qr-dropdown-menu';
            menu.setAttribute('role', 'listbox');
            var menuId = native.id + '-dropdown-menu';
            menu.id = menuId;
            trigger.setAttribute('aria-controls', menuId);

            function buildOptions() {
                menu.innerHTML = '';
                Array.from(native.options).forEach(function (opt) {
                    var li = document.createElement('li');
                    li.className = 'qr-dropdown-option';
                    li.setAttribute('role', 'option');
                    li.setAttribute('data-value', opt.value);
                    var isSel = opt.selected;
                    li.setAttribute('aria-selected', isSel ? 'true' : 'false');

                    var check = document.createElement('span');
                    check.className = 'qr-dropdown-option-check';
                    check.innerHTML = isSel ? '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20,6 9,17 4,12"/></svg>' : '';
                    li.appendChild(check);

                    var txt = document.createElement('span');
                    txt.textContent = opt.textContent;
                    li.appendChild(txt);

                    menu.appendChild(li);
                });
            }

            function syncFromNative() {
                valueSpan.textContent = native.options[native.selectedIndex] ? native.options[native.selectedIndex].textContent : '';
                buildOptions();
            }

            syncFromNative();

            container.appendChild(trigger);
            container.appendChild(menu);

            var isOpen = false;
            var hlIdx = -1;

            function openMenu() {
                isOpen = true;
                container.classList.add('is-open');
                trigger.setAttribute('aria-expanded', 'true');
                hlIdx = Array.from(menu.children).findIndex(function (el) {
                    return el.getAttribute('aria-selected') === 'true';
                });
                if (hlIdx < 0) hlIdx = 0;
                var items = menu.children;
                for (var i = 0; i < items.length; i++) items[i].classList.toggle('is-highlighted', i === hlIdx);
                if (items[hlIdx]) items[hlIdx].scrollIntoView({ block: 'nearest' });
                menu.focus({ preventScroll: true });
            }

            function closeMenu(restoreFocus) {
                isOpen = false;
                container.classList.remove('is-open');
                trigger.setAttribute('aria-expanded', 'false');
                menu.querySelectorAll('.is-highlighted').forEach(function (el) { el.classList.remove('is-highlighted'); });
                if (restoreFocus !== false) trigger.focus();
            }

            function selectItem(li) {
                if (!li) return;
                var val = li.getAttribute('data-value');
                native.value = val;
                syncFromNative();
                native.dispatchEvent(new Event('change', { bubbles: true }));
                closeMenu();
            }

            trigger.addEventListener('click', function (e) {
                e.stopPropagation();
                isOpen ? closeMenu() : openMenu();
            });

            menu.addEventListener('click', function (e) {
                var li = e.target.closest('[role="option"]');
                if (li) selectItem(li);
            });

            trigger.addEventListener('keydown', function (e) {
                if ((e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') && !isOpen) {
                    e.preventDefault(); openMenu(); return;
                }
                if (e.key === 'Escape' && isOpen) { e.preventDefault(); closeMenu(); }
            });

            menu.addEventListener('keydown', function (e) {
                var items = menu.querySelectorAll('[role="option"]');
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    hlIdx = Math.min(hlIdx + 1, items.length - 1);
                    items.forEach(function (el, i) { el.classList.toggle('is-highlighted', i === hlIdx); });
                    if (items[hlIdx]) items[hlIdx].scrollIntoView({ block: 'nearest' });
                }
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    hlIdx = Math.max(hlIdx - 1, 0);
                    items.forEach(function (el, i) { el.classList.toggle('is-highlighted', i === hlIdx); });
                    if (items[hlIdx]) items[hlIdx].scrollIntoView({ block: 'nearest' });
                }
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    var hl = menu.querySelector('.is-highlighted');
                    if (hl) selectItem(hl);
                }
                if (e.key === 'Escape') {
                    e.preventDefault(); closeMenu();
                }
            });

            document.addEventListener('click', function (e) {
                if (isOpen && !container.contains(e.target)) closeMenu(false);
            });
        });
    }

    /* Mobile sidebar: tap outside to close */
    document.addEventListener('click', function (e) {
        if (window.innerWidth <= 768) {
            if (els.sidebar.classList.contains('open') && !els.sidebar.contains(e.target) && !els.sidebarToggle.contains(e.target)) {
                els.sidebar.classList.remove('open');
            }
        }
    });

})();
