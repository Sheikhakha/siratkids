/* SIRATKIDS — Main JavaScript */

/* ============================================
   Theme Accent Color — applied immediately so the
   chosen accent (data-accent on <html>) is active
   before the first paint. Works with the swatches
   injected into .settings-dropdown-content below.
   ============================================ */
!function () {
    var ACCENTS = ['blue', 'green', 'purple', 'teal'];
    try {
        var saved = localStorage.getItem('accent-color');
        if (ACCENTS.indexOf(saved) !== -1) {
            document.documentElement.setAttribute('data-accent', saved);
        }
    } catch (e) {}
}();

/* ============================================
   Inline Data — Quran Cache, Vocabulary
   Loaded directly to avoid XHR failures on file:// protocol
   ============================================ */
/* Inline Hadith Data — avoids XHR failures on file:// protocol */
var __HADITH_DATA = [
  {
    "id":1,"arabic":"الدِّينُ يُسْرٌ","english":"Religion is ease.",
    "grade":"Sahih","narrator":"Abu Hurayrah","collection":"Sahih al-Bukhari","number":"39",
    "fullArabic":"إِنَّ الدِّينَ يُسْرٌ، وَلَنْ يُشَادَّ الدِّينَ أَحَدٌ إِلَّا غَلَبَهُ، فَسَدِّدُوا وَقَارِبُوا وَأَبْشِرُوا، وَاسْتَعِينُوا بِالْغَدْوَةِ وَالرَّوْحَةِ وَشَيْءٍ مِنَ الدُّلْجَةِ",
    "fullEnglish":"The Prophet (ﷺ) said, \"Religion is very easy and whoever overburdens himself in his religion will not be able to continue in that way. So you should not be extremists, but try to be near to perfection and receive the good tidings that you will be rewarded; and gain strength by offering the prayers in the mornings, afternoons and during the last hours of the nights.\"",
    "book":"Fighting for the Cause of Allah (Jihad)",
    "sunnah_url":"https://sunnah.com/bukhari/2/32"
  },
  {
    "id":2,"arabic":"مِفْتَاحُ الْجَنَّةِ الصَّلَاةُ","english":"The key to Paradise is prayer.",
    "grade":"Hasan","narrator":"Jabir bin Abdullah","collection":"Jami' at-Tirmidhi","number":"4",
    "fullArabic":"مِفْتَاحُ الْجَنَّةِ الصَّلَاةُ، وَمِفْتَاحُ الصَّلَاةِ الْوُضُوءُ",
    "fullEnglish":"The Messenger of Allah (ﷺ) said: \"The key to Paradise is prayer, and the key to prayer is purification (wudu).\"",
    "book":"Purification",
    "sunnah_url":"https://sunnah.com/tirmidhi/1/4"
  },
  {
    "id":3,"arabic":"مَنْ غَشَّ فَلَيْسَ مِنَّا","english":"Whoever cheats is not one of us.",
    "grade":"Sahih","narrator":"Abu Hurayrah","collection":"Sahih Muslim","number":"102",
    "fullArabic":"مَنْ حَمَلَ عَلَيْنَا السِّلَاحَ فَلَيْسَ مِنَّا، وَمَنْ غَشَّنَا فَلَيْسَ مِنَّا",
    "fullEnglish":"The Messenger of Allah (ﷺ) said: \"He who took up arms against us is not of us, and he who acted dishonestly towards us is not of us.\"",
    "book":"Faith (Iman)",
    "sunnah_url":"https://sunnah.com/muslim/1/190"
  },
  {
    "id":4,"arabic":"إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ","english":"Actions are judged by intentions.",
    "grade":"Sahih","narrator":"Umar ibn al-Khattab","collection":"Sahih al-Bukhari","number":"1",
    "fullArabic":"إِنَّمَا الْأَعْمَالُ بِالنِّيَّةِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى، فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ فَهِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ، وَمَنْ كَانَتْ هِجْرَتُهُ لِدُنْيَا يُصِيبُهَا أَوِ امْرَأَةٍ يَنْكِحُهَا فَهِجْرَتُهُ إِلَى مَا هَاجَرَ إِلَيْهِ",
    "fullEnglish":"I heard Allah's Messenger (ﷺ) saying: \"The reward of deeds depends upon the intentions and every person will get the reward according to what he has intended. So whoever emigrated for worldly benefits or for a woman to marry, his emigration was for what he emigrated for.\"",
    "book":"Revelation",
    "sunnah_url":"https://sunnah.com/bukhari/1/1"
  },
  {
    "id":5,"arabic":"السَّلَامُ قَبْلَ الْكَلَامِ","english":"Greetings (peace) come before speech.",
    "grade":"Da'if","narrator":"Jabir bin Abdullah","collection":"Jami' at-Tirmidhi","number":"2699",
    "fullArabic":"السَّلَامُ قَبْلَ الْكَلَامِ",
    "fullEnglish":"The Prophet (ﷺ) said: \"The greeting (salam) comes before speech.\"",
    "book":"Greetings (Isti'dhan)",
    "sunnah_url":"https://sunnah.com/tirmidhi/42/12"
  },
  {
    "id":6,"arabic":"عَلَيْكُمْ بِالصِّدْقِ","english":"Hold fast to truthfulness.",
    "grade":"Sahih","narrator":"Abdullah ibn Mas'ud","collection":"Sahih al-Bukhari","number":"6094",
    "fullArabic":"عَلَيْكُمْ بِالصِّدْقِ، فَإِنَّ الصِّدْقَ يَهْدِي إِلَى الْبِرِّ، وَإِنَّ الْبِرَّ يَهْدِي إِلَى الْجَنَّةِ، وَمَا يَزَالُ الرَّجُلُ يَصْدُقُ وَيَتَحَرَّى الصِّدْقَ حَتَّى يُكْتَبَ عِنْدَ اللَّهِ صِدِّيقًا",
    "fullEnglish":"The Prophet (ﷺ) said: \"Hold fast to truthfulness, for truthfulness leads to righteousness, and righteousness leads to Paradise. And a person keeps on telling the truth until he is written as a truthful person before Allah.\"",
    "book":"Good Manners and Form (Al-Adab)",
    "sunnah_url":"https://sunnah.com/bukhari/78/121"
  },
  {
    "id":7,"arabic":"إِيَّاكُمْ وَ الْكِذْبَ","english":"Beware of lying.",
    "grade":"Sahih","narrator":"Abdullah ibn Mas'ud","collection":"Sahih Muslim","number":"2607",
    "fullArabic":"إِيَّاكُمْ وَالْكَذِبَ، فَإِنَّ الْكَذِبَ يَهْدِي إِلَى الْفُجُورِ، وَإِنَّ الْفُجُورَ يَهْدِي إِلَى النَّارِ، وَمَا يَزَالُ الرَّجُلُ يَكْذِبُ وَيَتَحَرَّى الْكَذِبَ حَتَّى يُكْتَبَ عِنْدَ اللَّهِ كَذَّابًا",
    "fullEnglish":"The Prophet (ﷺ) said: \"Beware of lying, for lying leads to wickedness, and wickedness leads to Hellfire. And a person keeps on telling lies until he is recorded before Allah as a liar.\"",
    "book":"Righteousness, Good Manners",
    "sunnah_url":"https://sunnah.com/muslim/45/136"
  },
  {
    "id":8,"arabic":"الْجَنَّةُ تَحْتَ أَقْدَامِ الْأُمَّهَاتِ","english":"Paradise lies under the feet of mothers.",
    "grade":"Sahih","narrator":"Mu'awiyah bin Jahimah As-Sulami","collection":"Sunan an-Nasa'i","number":"3104",
    "fullArabic":"الْجَنَّةُ تَحْتَ أَقْدَامِ الْأُمَّهَاتِ",
    "fullEnglish":"The Prophet (ﷺ) said: \"Paradise lies beneath the feet of mothers.\"",
    "book":"Jihad",
    "sunnah_url":"https://sunnah.com/nasai/25/20"
  },
  {
    "id":9,"arabic":"الْوَالِدُ أَوْسَطُ أَبْوَابِ الْجَنَّةِ","english":"A parent is the middle door of Paradise.",
    "grade":"Hasan","narrator":"Abu Ad-Darda'","collection":"Jami' at-Tirmidhi","number":"1900",
    "fullArabic":"الْوَالِدُ أَوْسَطُ أَبْوَابِ الْجَنَّةِ، فَإِنْ شِئْتَ فَأَضِعْ ذَلِكَ الْبَابَ أَوِ احْفَظْهُ",
    "fullEnglish":"The Prophet (ﷺ) said: \"The father is the middle gate of Paradise, so if you wish, lose that gate or protect it.\"",
    "book":"Righteousness, Good Manners",
    "sunnah_url":"https://sunnah.com/tirmidhi/27/4"
  },
  {
    "id":10,"arabic":"لَا يَدْخُلُ الْجَنَّةَ إِلَّا نَفْسٌ مُسْلِمَةٌ","english":"None will enter Paradise except a Muslim soul.",
    "grade":"Sahih","narrator":"Abdullah ibn Mas'ud","collection":"Sahih al-Bukhari","number":"6528",
    "fullArabic":"لَا يَدْخُلُ الْجَنَّةَ إِلَّا نَفْسٌ مُسْلِمَةٌ، وَإِنَّ رُوحِي فِي نَفَسِ الصُّبْحِ",
    "fullEnglish":"The Prophet (ﷺ) said: \"None will enter Paradise except a Muslim soul, and my soul is in the morning breeze.\"",
    "book":"Softening the Heart",
    "sunnah_url":"https://sunnah.com/bukhari/81/117"
  },
  {
    "id":11,"arabic":"مَنْ مَاتَ يُشْرِكُ بِاللَّهِ شَيْئًا دَخَلَ النَّارَ","english":"Whoever dies associating anything in worship with Allah will enter the Hellfire.",
    "grade":"Sahih","narrator":"Jabir","collection":"Sahih Muslim","number":"93a",
    "fullArabic":"مَنْ لَقِيَ اللَّهَ لَا يُشْرِكُ بِهِ شَيْئًا دَخَلَ الْجَنَّةَ، وَمَنْ لَقِيَهُ يُشْرِكُ بِهِ شَيْئًا دَخَلَ النَّارَ",
    "fullEnglish":"The Prophet (ﷺ) said: \"Whoever meets Allah without associating anything with Him will enter Paradise, and whoever meets Him associating anything with Him will enter the Hellfire.\"",
    "book":"Faith (Iman)",
    "sunnah_url":"https://sunnah.com/muslim/1/175"
  },
  {
    "id":12,"arabic":"الطَّهُورُ شَطْرُ الْإِيمَانِ","english":"Purity is half of faith.",
    "grade":"Sahih","narrator":"Abu Malik al-Ash'ari","collection":"Sahih Muslim","number":"223",
    "fullArabic":"الطَّهُورُ شَطْرُ الْإِيمَانِ، وَالْحَمْدُ لِلَّهِ تَمْلَأُ الْمِيزَانَ، وَسُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ تَمْلَآنِ مَا بَيْنَ السَّمَاءِ وَالْأَرْضِ، وَالصَّلَاةُ نُورٌ، وَالصَّدَقَةُ بُرْهَانٌ، وَالصَّبْرُ ضِيَاءٌ، وَالْقُرْآنُ حُجَّةٌ لَكَ أَوْ عَلَيْكَ",
    "fullEnglish":"The Messenger of Allah (ﷺ) said: \"Purity is half of faith. Al-Hamdu lillah (praise be to Allah) fills the scales. Subhan Allah (glory be to Allah) and Al-Hamdu lillah fill what is between the heavens and earth. Prayer is light. Charity is proof. Patience is illumination. And the Quran is a proof for you or against you.\"",
    "book":"Purification",
    "sunnah_url":"https://sunnah.com/muslim/2/1"
  },
  {
    "id":13,"arabic":"الصَّلَاةُ نُورٌ","english":"Prayer is a light.",
    "grade":"Sahih","narrator":"Abu Malik al-Ash'ari","collection":"Sahih Muslim","number":"223",
    "fullArabic":"الطَّهُورُ شَطْرُ الْإِيمَانِ، وَالْحَمْدُ لِلَّهِ تَمْلَأُ الْمِيزَانَ، وَسُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ تَمْلَآنِ مَا بَيْنَ السَّمَاءِ وَالْأَرْضِ، وَالصَّلَاةُ نُورٌ، وَالصَّدَقَةُ بُرْهَانٌ، وَالصَّبْرُ ضِيَاءٌ، وَالْقُرْآنُ حُجَّةٌ لَكَ أَوْ عَلَيْكَ",
    "fullEnglish":"The Messenger of Allah (ﷺ) said: \"Purity is half of faith. Al-Hamdu lillah (praise be to Allah) fills the scales. Subhan Allah (glory be to Allah) and Al-Hamdu lillah fill what is between the heavens and earth. Prayer is light. Charity is proof. Patience is illumination. And the Quran is a proof for you or against you.\"",
    "book":"Purification",
    "sunnah_url":"https://sunnah.com/muslim/2/1"
  },
  {
    "id":14,"arabic":"مَنْ صَلَّى الْبَرْدَيْنِ دَخَلَ الْجَنَّةَ","english":"Whoever prays the two cool prayers (Fajr and 'Asr) will enter Paradise.",
    "grade":"Sahih","narrator":"Abu Bakr bin Abi Musa","collection":"Sahih Muslim","number":"635a",
    "fullArabic":"مَنْ صَلَّى الْبَرْدَيْنِ دَخَلَ الْجَنَّةَ",
    "fullEnglish":"The Prophet (ﷺ) said: \"Whoever prays the two cool prayers (Fajr and 'Asr) will enter Paradise.\"",
    "book":"Prayer (Salat)",
    "sunnah_url":"https://sunnah.com/muslim/5/271"
  },
  {
    "id":15,"arabic":"الصَّبْرُ ضِيَاءٌ","english":"Patience is illumination.",
    "grade":"Sahih","narrator":"Abu Malik al-Ash'ari","collection":"Sahih Muslim","number":"223",
    "fullArabic":"الطَّهُورُ شَطْرُ الْإِيمَانِ، وَالْحَمْدُ لِلَّهِ تَمْلَأُ الْمِيزَانَ، وَسُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ تَمْلَآنِ مَا بَيْنَ السَّمَاءِ وَالْأَرْضِ، وَالصَّلَاةُ نُورٌ، وَالصَّدَقَةُ بُرْهَانٌ، وَالصَّبْرُ ضِيَاءٌ، وَالْقُرْآنُ حُجَّةٌ لَكَ أَوْ عَلَيْكَ",
    "fullEnglish":"The Messenger of Allah (ﷺ) said: \"Purity is half of faith. Al-Hamdu lillah (praise be to Allah) fills the scales. Subhan Allah (glory be to Allah) and Al-Hamdu lillah fill what is between the heavens and earth. Prayer is light. Charity is proof. Patience is illumination. And the Quran is a proof for you or against you.\"",
    "book":"Purification",
    "sunnah_url":"https://sunnah.com/muslim/2/1"
  },
  {
    "id":16,"arabic":"الدِّينُ النَّصِيحَةُ","english":"Religion is sincerity / good advice.",
    "grade":"Sahih","narrator":"Tamim ad-Dari","collection":"Sahih Muslim","number":"55a",
    "fullArabic":"الدِّينُ النَّصِيحَةُ. قُلْنَا: لِمَنْ؟ قَالَ: لِلَّهِ وَلِكِتَابِهِ وَلِرَسُولِهِ وَلِأَئِمَّةِ الْمُسْلِمِينَ وَعَامَّتِهِمْ",
    "fullEnglish":"The Prophet (ﷺ) said: \"Religion is sincerity.\" We said: \"To whom?\" He said: \"To Allah, His Book, His Messenger, the leaders of the Muslims, and their common people.\"",
    "book":"Faith (Iman)",
    "sunnah_url":"https://sunnah.com/muslim/1/103"
  },
  {
    "id":17,"arabic":"الدُّعَاءُ هُوَ الْعِبَادَةُ","english":"Supplication is worship.",
    "grade":"Sahih","narrator":"an-Nu'man ibn Bashir","collection":"Sunan Abi Dawud","number":"1479",
    "fullArabic":"الدُّعَاءُ هُوَ الْعِبَادَةُ، ثُمَّ قَرَأَ: وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ",
    "fullEnglish":"The Prophet (ﷺ) said: \"Supplication is worship.\" Then he recited: \"And your Lord says: Call upon Me; I will answer you.\" (40:60)",
    "book":"Prayer (Salat)",
    "sunnah_url":"https://sunnah.com/abudawud/8/64"
  },
  {
    "id":18,"arabic":"أَفْشُوا السَّلَامَ بَيْنَكُمْ","english":"Spread salam (peace) among yourselves.",
    "grade":"Sahih","narrator":"Abu Hurayrah","collection":"Sahih Muslim","number":"54a",
    "fullArabic":"يَا أَيُّهَا النَّاسُ، أَفْشُوا السَّلَامَ، وَصِلُوا الْأَرْحَامَ، وَأَطْعِمُوا الطَّعَامَ، وَصَلُّوا بِاللَّيْلِ وَالنَّاسُ نِيَامٌ، تَدْخُلُوا الْجَنَّةَ بِسَلَامٍ",
    "fullEnglish":"The Prophet (ﷺ) said: \"O people, spread the greeting of salam, maintain family ties, feed others, and pray at night while people are sleeping, and you will enter Paradise in peace.\"",
    "book":"Faith (Iman)",
    "sunnah_url":"https://sunnah.com/muslim/1/101"
  },
  {
    "id":19,"arabic":"احْرِصْ عَلَى مَا يَنْفَعُكَ","english":"Strive for that which benefits you.",
    "grade":"Sahih","narrator":"Abu Hurayrah","collection":"Sahih Muslim","number":"2664",
    "fullArabic":"الْمُؤْمِنُ الْقَوِيُّ خَيْرٌ وَأَحَبُّ إِلَى اللَّهِ مِنَ الْمُؤْمِنِ الضَّعِيفِ، وَفِي كُلٍّ خَيْرٌ. احْرِصْ عَلَى مَا يَنْفَعُكَ، وَاسْتَعِنْ بِاللَّهِ وَلَا تَعْجِزْ",
    "fullEnglish":"The Messenger of Allah (ﷺ) said: \"The strong believer is better and more beloved to Allah than the weak believer, while there is good in both. Strive for that which benefits you, seek help from Allah, and do not feel helpless.\"",
    "book":"Destiny (Qadr)",
    "sunnah_url":"https://sunnah.com/muslim/46/52"
  },
  {
    "id":20,"arabic":"اسْتَعِنْ بِاللَّهِ وَلَا تَعْجِزْ","english":"Seek help from Allah and do not lose heart.",
    "grade":"Hasan","narrator":"Abdullah ibn Abbas","collection":"Jami' at-Tirmidhi","number":"2516",
    "fullArabic":"احْفَظِ اللَّهَ يَحْفَظْكَ، احْفَظِ اللَّهَ تَجِدْهُ تُجَاهَكَ، إِذَا سَأَلْتَ فَاسْأَلِ اللَّهَ، وَإِذَا اسْتَعَنْتَ فَاسْتَعِنْ بِاللَّهِ",
    "fullEnglish":"The Prophet (ﷺ) said: \"Be mindful of Allah, and He will protect you. Be mindful of Allah, and you will find Him before you. If you ask, ask of Allah. If you seek help, seek help from Allah.\"",
    "book":"Description of the Day of Judgment",
    "sunnah_url":"https://sunnah.com/tirmidhi/37/102"
  },
  {
    "id":21,"arabic":"كُلُّ مَعْرُوفٍ صَدَقَةٌ","english":"Every good deed is charity.",
    "grade":"Sahih","narrator":"Abu Hurayrah","collection":"Sahih al-Bukhari","number":"2989",
    "fullArabic":"كُلُّ سُلَامَى مِنَ النَّاسِ عَلَيْهِ صَدَقَةٌ كُلَّ يَوْمٍ تَطْلُعُ فِيهِ الشَّمْسُ، يَعْدِلُ بَيْنَ الِاثْنَيْنِ صَدَقَةٌ، وَيُعِينُ الرَّجُلَ عَلَى دَابَّتِهِ فَيَحْمِلُ عَلَيْهَا أَوْ يَرْفَعُ عَلَيْهَا مَتَاعَهُ صَدَقَةٌ، وَالْكَلِمَةُ الطَّيِّبَةُ صَدَقَةٌ، وَكُلُّ خَطْوَةٍ يَخْطُوهَا إِلَى الصَّلَاةِ صَدَقَةٌ، وَيُمِيطُ الْأَذَى عَنِ الطَّرِيقِ صَدَقَةٌ",
    "fullEnglish":"Allah's Messenger (ﷺ) said: \"There is a charity to be given for every joint of the human body every day the sun rises. To judge justly between two persons is charity. To help a man with his riding animal by helping him to ride it or by lifting his luggage onto it is charity. A good word is charity. Every step taken towards prayer is charity. And removing a harmful thing from the way is charity.\"",
    "book":"Fighting for the Cause of Allah (Jihad)",
    "sunnah_url":"https://sunnah.com/bukhari/56/198"
  },
  {
    "id":22,"arabic":"الْحَيَاءُ كُلُّهُ خَيْرٌ","english":"Modesty brings nothing but good.",
    "grade":"Sahih","narrator":"Imran ibn Husayn","collection":"Sahih al-Bukhari","number":"6117",
    "fullArabic":"الْحَيَاءُ لَا يَأْتِي إِلَّا بِخَيْرٍ",
    "fullEnglish":"The Prophet (ﷺ) said: \"Modesty (Haya) does not bring anything except good.\"",
    "book":"Good Manners and Form (Al-Adab)",
    "sunnah_url":"https://sunnah.com/bukhari/78/144"
  },
  {
    "id":23,"arabic":"إِنَّ اللَّهَ يُحِبُّ الرِّفْقَ فِي الْأَمْرِ كُلِّهِ","english":"Indeed, Allah loves gentleness in all matters.",
    "grade":"Sahih","narrator":"Aisha","collection":"Sahih al-Bukhari","number":"6024",
    "fullArabic":"يَا عَائِشَةُ، إِنَّ اللَّهَ رَفِيقٌ يُحِبُّ الرِّفْقَ فِي الْأَمْرِ كُلِّهِ",
    "fullEnglish":"The Prophet (ﷺ) said: \"O Aisha, Allah is kind and gentle, and He loves kindness and gentleness in all matters.\"",
    "book":"Good Manners and Form (Al-Adab)",
    "sunnah_url":"https://sunnah.com/bukhari/78/55"
  },
  {
    "id":24,"arabic":"لَا يَدْخُلُ الْجَنَّةَ قَاطِعٌ","english":"The one who severs family ties will not enter Paradise.",
    "grade":"Sahih","narrator":"Jubayr ibn Mut'im","collection":"Sahih al-Bukhari","number":"5984",
    "fullArabic":"لَا يَدْخُلُ الْجَنَّةَ قَاطِعٌ",
    "fullEnglish":"The Prophet (ﷺ) said: \"The person who severs the bond of kinship will not enter Paradise.\"",
    "book":"Good Manners and Form (Al-Adab)",
    "sunnah_url":"https://sunnah.com/bukhari/78/15"
  },
  {
    "id":25,"arabic":"لَا يَدْخُلُ الْجَنَّةَ قَتَّاتٌ","english":"The talebearer (gossipmonger) will not enter Paradise.",
    "grade":"Sahih","narrator":"Hudhayfah","collection":"Sahih al-Bukhari","number":"6056",
    "fullArabic":"لَا يَدْخُلُ الْجَنَّةَ قَتَّاتٌ",
    "fullEnglish":"I heard the Prophet (ﷺ) saying: \"A talebearer (one who spreads gossip) will not enter Paradise.\"",
    "book":"Good Manners and Form (Al-Adab)",
    "sunnah_url":"https://sunnah.com/bukhari/78/86"
  },
  {
    "id":26,"arabic":"مَنْ غَشَّنَا فَلَيْسَ مِنَّا","english":"Whoever cheats us is not from us.",
    "grade":"Sahih","narrator":"Abu Hurayrah","collection":"Sahih Muslim","number":"101",
    "fullArabic":"مَنْ حَمَلَ عَلَيْنَا السِّلَاحَ فَلَيْسَ مِنَّا، وَمَنْ غَشَّنَا فَلَيْسَ مِنَّا",
    "fullEnglish":"The Messenger of Allah (ﷺ) said: \"He who took up arms against us is not of us, and he who acted dishonestly towards us is not of us.\"",
    "book":"Faith (Iman)",
    "sunnah_url":"https://sunnah.com/muslim/1/189"
  }
];

var __QURAN_CACHE = {
  "2:152": {
    "arabic": "\u0641\u0627\u0630\u0643\u0651\u0631\u0648\u0646\u0650\u064a \u0623\u0630\u0643\u0651\u0631\u0643\u0645\u0648\u064a \u0648\u0627\u0634\u0643\u0651\u0631\u0648\u0627 \u0644\u0650\u064a \u0648\u0627\u0644\u0627 \u062a\u0643\u0641\u0651\u0631\u0648\u0646\u0650",
    "translation": {
      "hilali": "Therefore remember Me (by praying, glorifying), I will remember you, and be grateful to Me (for My countless Favours on you) and never be ungrateful to Me."
    },
    "tafsir": {
      "ibn_kathir": "<p>Allah reminds His believing servants with what He has endowed them with by sending Muhammad &#65021; as a Messenger to them, reciting to them Allah's clear Ayat and purifying and cleansing them from the worst types of behavior, the ills of the souls and the acts of Jahiliyyah (pre-Islamic era). The Messenger also takes them away from the darkness (of disbelief) to the light (of faith) and teaches them the Book, the Qur'an, and the Hikmah (i.e., the wisdom), which is his Sunnah. He also teaches them what they knew not. During the time of Jahiliyyah, they used to utter foolish statements. Later on, with the blessing of the Prophet's Message, they were elevated to the status of the Awliya' and the rank of the scholars. Allah said:</p><p>Therefore, remember Me. I will remember you, and be grateful to Me, and never be ungrateful to Me.</p><p>Ibn Abbas commented, 'Allah's favor means Muhammad.' So Allah has commanded the believers to affirm this favor by thanking and remembering Him.</p><p>Al-Hasan Al-Basri commented: 'Remember Me regarding what I have commanded you and I will remember you regarding what I have compelled Myself to do for your benefit (i.e., His rewards and forgiveness).'</p><p>An authentic Hadith states: 'Allah the Exalted said, Whoever mentions Me to himself, then I will mention him to Myself; and whoever mentions Me in a gathering, I will mention him in a better gathering.'</p><p>Allah said, 'and be grateful to Me and never be ungrateful to Me.' In this Ayah, Allah commands that He be thanked and promises even more rewards for thanking Him.</p>",
      "maarif": "<p>The merits of Dhikr (Remembrance) are innumerable. What greater merit than the assurance that when a man remembers Allah, He too remembers him. Abu Uthman said that one can know for himself that as soon as he turns to Allah, Allah too remembers him.</p><p>This verse means that if men remember Allah by obeying His commandments, He will remember them by granting His pardon and rewards. Said ibn Jubayr interpreted Dhikr as obedience and submission: 'He who has not obeyed Him has not remembered Him, even if he keeps himself busy in prayers and reciting praises.'</p><p>The Holy Prophet &#65021; said that one who obeys Allah has truly been remembering Allah, in spite of being deficient in supererogatory prayers, while one who disobeys has forgotten Allah, despite devoting long hours to prayer and fasting.</p>",
      "tazkirul": "<p>It was at the time of the construction of the Ka'bah that Abraham and Ishmael prayed for a prophet to be born among the people of Makkah. The prayer was answered, and the coming of the final prophet was decreed. Now that he had come, the Ka'bah in Makkah was made the prayer direction for all nations. God remembers those who remember Him.</p>"
    },
    "surah_meta": {
      "name_en": "Al-Baqarah",
      "name_ar": "\u0627\u0644\u0628\u0642\u0631\u0629",
      "revelation": "Madinah",
      "verse_count": 286,
      "juz": 2
    },
    "cross_references": [
      {"verse_key": "6:102", "snippet_en": "Such is Allah, your Lord! None has the right to be worshipped but He, the Creator of all things. So worship Him (Alone)."},
      {"verse_key": "39:62", "snippet_en": "Allah is the Creator of all things, and He is the Wakil over all things."},
      {"verse_key": "20:14", "snippet_en": "Verily! I am Allah! La ilaha illa Ana (none has the right to be worshipped but I), so worship Me (Alone), and perform As-Salat for My Remembrance."}
    ]
  },
  "39:62": {
    "arabic": "\u0627\u0644\u0644\u0651\u064e\u0647\u064f \u062e\u064e\u0627\u0644\u0650\u0642\u064f \u0643\u064f\u0644\u0651\u0650 \u0634\u064e\u064a\u0652\u0621\u064d \u0671 \u0648\u064e\u0647\u064f\u0648\u064e \u0639\u064e\u0644\u064e\u0649\u0670 \u0643\u064f\u0644\u0651\u0650 \u0634\u064e\u064a\u0652\u0621\u064d \u0648\u064e\u0643\u0650\u064a\u0644\u064c",
    "translation": {
      "hilali": "Allah is the Creator of all things, and He is the Wakil (Trustee, Disposer of affairs, Guardian) over all things."
    },
    "tafsir": {
      "ibn_kathir": "<p>Allah tells us that He is the Creator, Lord, Sovereign and Controller of all things; everything is subject to His dominion, power and guardianship.</p><p>'To Him belong the Maqalid of the heavens and the earth.' Mujahid said Maqalid means 'keys' in Persian. Both opinions mean that the control of all things is in the Hand of Allah.</p><p>Then Allah mentions those who disbelieve in His Ayat - such are the losers. The reason for revelation: Ibn Abbas narrated that the idolators called the Messenger &#65021; to worship their gods, then they would worship his God with him. Then was revealed: 'Say: Do you order me to worship other than Allah, O you fools!' And: 'Nay! But worship Allah, and be among the grateful.'</p>",
      "maarif": "<p>In previous verses, the disbelievers claimed that if Allah showed them the way, they would have been among those who fear Allah. This verse answers that Allah had already given necessary guidance through His books, verses and signs. Once guidance was given, Allah never forced anyone to be good. Every servant was given the choice to take either truth or falsehood. This was a test. Whoever took the way of error by their own free will is responsible for it.</p>",
      "tazkirul": "<p>This verse is not available in Tazkirul Quran.</p>"
    },
    "surah_meta": {
      "name_en": "Az-Zumar",
      "name_ar": "\u0627\u0644\u0632\u0651\u064f\u0645\u064e\u0631",
      "revelation": "Makkah",
      "verse_count": 75,
      "juz": 24
    },
    "cross_references": [
      {"verse_key": "6:102", "snippet_en": "Such is Allah, your Lord! The Creator of all things. So worship Him (Alone)."},
      {"verse_key": "13:16", "snippet_en": "Allah is the Creator of all things, and He is the Wakil over all things."},
      {"verse_key": "35:3", "snippet_en": "O mankind! Remember the Grace of Allah. There is no creator besides Allah."}
    ]
  },
  "51:56": {
    "arabic": "\u0648\u064e\u0645\u064e\u0627 \u062e\u064e\u0644\u064e\u0642\u0652\u062a\u064f \u0627\u0644\u0652\u062c\u0650\u0646\u0651\u064e \u0648\u064e\u0627\u0644\u0652\u0625\u0650\u0646\u0633\u064e \u0625\u0650\u0644\u0651\u064e\u0627 \u0644\u0650\u064a\u0639\u0652\u0628\u064f\u0630\u064f\u0648\u0646\u0650",
    "translation": {
      "hilali": "And I (Allah) created not the jinn and mankind except that they should worship Me (Alone)."
    },
    "tafsir": {
      "ibn_kathir": "<p>Allah comforts His Prophet: just as these idolators denied you, the disbelievers of old used the same words with their Messengers.</p><p>'And I created not the Jinn and mankind except that they should worship Me' means: I only created them so that I order them to worship Me, not that I need them. Ibn Abbas commented: 'So that they worship Me, willingly or unwillingly.'</p><p>'I seek not any provision from them nor do I ask that they should feed Me. Verily, Allah is the All-Provider, Owner of power, the Most Strong.'</p><p>Allah stated that He does not need creatures, but rather they are in need of Him in all conditions. The Prophet &#65021; said: 'Allah said: O Son of Adam! Busy yourself in worshipping Me, and I will fill your chest with riches and dissipate your meekness. Otherwise, I will fill your chest with distracting affairs.'</p>",
      "maarif": "<p>The purpose of Jinn's and Mankind's creation: This verse may raise questions about free will versus divine will. Some scholars say it pertains to believers only - only believing jinn and believing mankind are created for worship. Ibn Abbas's version includes 'min al-mu'minin' (of the believers).</p><p>Another answer: Allah commanded all to worship but equipped them with free will. Some used it correctly to worship Him, others deviated. The Prophet &#65021; said: 'Every child is born according to the fitrah but his parents turn him into a Jew or Christian or Magian.' Fitrah refers to the natural capacity for Islam and true faith.</p>",
      "tazkirul": "<p>God Himself possesses all kinds of powers. The sole purpose of human creation was devotion and servitude (ibadah) to God. This implies bowing down completely before God and dedicating oneself entirely to Him. The substance of this devotion is deep inner realisation of God (ma'rifah). It is required of man that God should be a discovery for him. The shape which life takes as a result of this ma'rifah is one of devotion and subservience.</p>"
    },
    "surah_meta": {
      "name_en": "Adh-Dhariyat",
      "name_ar": "\u0627\u0644\u0630\u0651\u064e\u0627\u0631\u0650\u064a\u0627\u062a",
      "revelation": "Makkah",
      "verse_count": 60,
      "juz": 27
    },
    "cross_references": [
      {"verse_key": "36:22", "snippet_en": "And why should I not worship Him Who has created me and to Whom you shall be returned."},
      {"verse_key": "19:65", "snippet_en": "Lord of the heavens and the earth, and all that is between them, so worship Him (Alone) and be constant and patient in His worship."},
      {"verse_key": "53:62", "snippet_en": "So fall you down in prostration to Allah and worship Him (Alone)."}
    ]
  },
  "3:19": {
    "arabic": "\u0625\u0650\u0646\u0651\u064e \u0627\u0644\u0652\u062f\u0650\u064a\u0646\u064e \u0639\u0650\u0646\u0652\u062f\u064e \u0627\u0644\u0652\u0644\u0651\u064e\u0647\u0650 \u0627\u0644\u0652\u0625\u0650\u0633\u0652\u0644\u064e\u0627\u0645\u064f \u06d7 \u0648\u064e\u0645\u064e\u0627 \u0627\u064e\u062e\u0652\u062a\u064e\u0644\u064e\u0641\u064e \u0627\u0644\u0652\u0630\u0650\u064a\u0646\u064e \u0623\u064e\u0648\u0652\u062a\u064f\u0648\u0627 \u0627\u0644\u0652\u0643\u0650\u062a\u064e\u0627\u0628\u064e \u0625\u0650\u0644\u0651\u064e\u0627 \u0645\u0650\u0646 \u0628\u064e\u0639\u0652\u062f\u0650 \u0645\u064e\u0627 \u062c\u064e\u0627\u0621\u064e\u0647\u064f\u0645\u064f \u0627\u0644\u0652\u0639\u0650\u0644\u0645\u064f \u0628\u064e\u063a\u0653\u064a\u064e\u0646\u064e\u0628\u064e\u064a\u0646\u064e\u0647\u064f\u0645\u0652 \u0671 \u0648\u064e\u0645\u064e\u0646 \u064a\u064e\u0643\u0652\u0641\u064f\u0631\u0652 \u0628\u0650\u0622\u064a\u064e\u0627\u062a\u0650 \u0627\u0644\u0652\u0644\u0651\u064e\u0647\u0650 \u0641\u0650\u0625\u0650\u0646\u0651\u064e \u0627\u0644\u0652\u0644\u0651\u064e\u0647\u064e \u0633\u064e\u0631\u0650\u064a\u0639\u064f \u0627\u0644\u0652\u062d\u0650\u0633\u064e\u0627\u0628\u0650",
    "translation": {
      "hilali": "Truly, the religion with Allah is Islam. Those who were given the Scripture (Jews and Christians) did not differ except, out of mutual jealousy, after knowledge had come to them. And whoever disbelieves in the Ayat (proofs, evidence, verses, signs, revelations, etc.) of Allah, then surely, Allah is Swift in calling to account."
    },
    "tafsir": {
      "ibn_kathir": "<p>Allah bears witness, and verily, Allah is sufficient as a Witness, that none has the right to be worshipped but He. He Alone is the Lord and God of all creation.</p><p>'Truly, the religion with Allah is Islam.' Allah states that there is no religion accepted from any person except Islam. Islam includes obeying all of the Messengers until Muhammad &#65021; who finalized their commission. After Allah sent Muhammad, whoever meets Allah following a path other than Muhammad's will not have it accepted.</p><p>Those who were given the Scripture beforehand divided in the religion after Allah sent the Messengers and revealed the Books. They did not differ except out of rivalry, after knowledge had come to them. Whoever disbelieves in the Ayat of Allah, then surely Allah is Swift in reckoning.</p><p>'Say: I have submitted myself to Allah (in Islam), and (so have) those who follow me.'</p><p>This verse is clear proof that the Message of Muhammad &#65021; is universal to all creation. The Prophet sent letters to the kings of the earth. He said: 'By He in Whose Hand is my soul! No member of this Ummah, no Jew or Christian, hears of me but dies without believing in what I was sent with, but will be among the people of the Fire.'</p>",
      "maarif": "<p>Din and Islam: The word Din means 'the way.' In Qur'anic terminology, Din stands for principles common to all prophets. Shari'ah covers subsidiary injunctions which differed across ages.</p><p>The din of all prophets was one: belief in Allah's most perfect Being and Attributes, in the Day of Judgment, in all prophets, and in all commandments. Islam means submitting to Allah and obeying His commands.</p><p>In this era, only the Islam brought by the final prophet Muhammad &#65021; is acceptable. The previous religions are abrogated. Whoever seeks a religion other than Islam, it will not be accepted from him.</p><p>These verses refute the notion that every faith can be a source of salvation. The Holy Qur'an explicitly states that light and darkness cannot be the same. Salvation depends on obedience to Allah and His Messenger.</p>",
      "tazkirul": "<p>The God of the universe is the One and only God, and He likes justice. The vast universe run by its Master is exactly as perfect as it can be. Everything in the universe being in its right place proves that its Lord loves justice rather than injustice.</p><p>Each part of the universe is in a complete state of surrender - all functions are performed according to God's plan. Exactly the same performance is required of man. Man must recognize his Lord and mould his life in accordance with God's plan.</p>"
    },
    "surah_meta": {
      "name_en": "Ali 'Imran",
      "name_ar": "\u0622\u0644\u0650 \u0639\u0650\u0645\u0652\u0631\u064e\u0627\u0646",
      "revelation": "Madinah",
      "verse_count": 200,
      "juz": 3
    },
    "cross_references": [
      {"verse_key": "2:163", "snippet_en": "And your Ilah (God) is one Ilah (God - Allah). None has the right to be worshipped but He, the Most Gracious, the Most Merciful."},
      {"verse_key": "3:83", "snippet_en": "Do they seek other than the religion of Allah, while to Him has submitted all that is in the heavens and the earth, willingly or unwillingly?"},
      {"verse_key": "22:34", "snippet_en": "For each We have appointed a way of worship which they follow. So let them not dispute with you about the matter."}
    ]
  }
};

var __VOCABULARY_DATA = {
  "unit1": {
    "title_en": "Rububiyyah",
    "title_ar": "\u0627\u0644\u0631\u0651\u064f\u0628\u064f\u0648\u0628\u0650\u064a\u0651\u064e\u0629\u064f",
    "words": [
      {"ar": "\u062e\u064e\u0627\u0644\u0650\u0642", "en": "Creator", "root": "\u062e \u0644 \u0642", "example_ar": "\u0627\u0644\u0644\u0651\u064e\u0647\u064f \u0627\u0644\u0652\u062e\u064e\u0627\u0644\u0650\u0642\u064f", "example_en": "Allah is the Creator"},
      {"ar": "\u0631\u064e\u0627\u0632\u0650\u0642", "en": "Provider", "root": "\u0631 \u0632 \u0642", "example_ar": "\u0627\u0644\u0644\u0651\u064e\u0647\u064f \u0627\u0644\u0652\u0631\u064e\u0627\u0632\u0650\u0642\u064f", "example_en": "Allah is the Provider"},
      {"ar": "\u0645\u064e\u0627\u0644\u0650\u0643", "en": "Owner/King", "root": "\u0645 \u0644 \u0643", "example_ar": "\u0627\u0644\u0644\u0651\u064e\u0647\u064f \u0627\u0644\u0652\u0645\u064e\u0627\u0644\u0650\u0643\u064f", "example_en": "Allah is the Owner"},
      {"ar": "\u0639\u064e\u0627\u0644\u0650\u0645", "en": "All-Knowing", "root": "\u0639 \u0644 \u0645", "example_ar": "\u0627\u0644\u0644\u0651\u064e\u0647\u064f \u0627\u0644\u0652\u0639\u064e\u0627\u0644\u0650\u0645\u064f", "example_en": "Allah is the All-Knowing"},
      {"ar": "\u0642\u064e\u062f\u0650\u064a\u0631", "en": "All-Powerful", "root": "\u0642 \u062f \u0631", "example_ar": "\u0627\u0644\u0644\u0651\u064e\u0647\u064f \u0639\u064e\u0644\u064e\u0649\u0670 \u0643\u064f\u0644\u0651\u0650 \u0634\u064e\u064a\u0652\u0621\u064d \u0642\u064e\u062f\u0650\u064a\u0631\u064c", "example_en": "Allah is capable of all things"},
      {"ar": "\u062e\u064e\u0644\u0652\u0642", "en": "Creation", "root": "\u062e \u0644 \u0642", "example_ar": "\u062e\u064e\u0644\u0652\u0642\u064e \u0627\u0644\u0633\u0651\u064e\u0645\u064e\u0627\u0648\u064e\u0627\u062a\u0650 \u0648\u064e \u0627\u0644\u0652\u0623\u064e\u0631\u0636\u0650", "example_en": "Creation of the heavens and earth"}
    ]
  },
  "unit2": {
    "title_en": "Uloohiyyah",
    "title_ar": "\u0627\u0644\u0650\u0625\u0644\u064e\u0661\u0647\u0650\u064a\u0651\u064e\u0629\u064f",
    "words": [
      {"ar": "\u0639\u0650\u0628\u064e\u0627\u062f\u064e\u0629", "en": "Worship", "root": "\u0639 \u0628 \u062f", "example_ar": "\u0648\u064e\u0645\u064e\u0627 \u062e\u064e\u0644\u064e\u0642\u0652\u062a\u064f \u0627\u0644\u0652\u062c\u0650\u0646\u0651\u064e \u0648\u064e\u0627\u0644\u0650\u0625\u0646\u0633\u064e \u0625\u0650\u0644\u0651\u064e\u0627 \u0644\u0650\u064a\u0639\u0652\u0628\u064f\u0630\u064f\u0648\u0646\u0650", "example_en": "I did not create jinn and mankind except to worship Me"},
      {"ar": "\u062f\u064f\u0639\u064e\u0627\u0621", "en": "Supplication", "root": "\u062f \u0639 \u0648", "example_ar": "\u0627\u062f\u0651\u064f\u0639\u064f\u0648\u0646\u0650\u064a \u0623\u0633\u0652\u062a\u064e\u062c\u0650\u0628\u0652 \u0644\u064e\u0643\u064f\u0645\u0652", "example_en": "Call upon Me; I will respond to you"},
      {"ar": "\u062a\u064e\u0648\u0652\u062d\u0650\u064a\u062f", "en": "Monotheism", "root": "\u0648 \u062d \u062f", "example_ar": "\u0642\u064f\u0644\u0652 \u0647\u064f\u0648\u064e \u0627\u0644\u0644\u0651\u064e\u0647\u064f \u0623\u064e\u062d\u064e\u062f\u064c", "example_en": "Say: He is Allah, the One"},
      {"ar": "\u0635\u064e\u0644\u064e\u0627\u0629", "en": "Prayer", "root": "\u0635 \u0644 \u0648", "example_ar": "\u0623\u064e\u0642\u0650\u064a\u0645\u064f\u0648\u0627 \u0627\u0644\u0652\u0635\u064e\u0644\u064e\u0627\u0629\u064e", "example_en": "Establish prayer"},
      {"ar": "\u062a\u064e\u0648\u0643\u0651\u064f\u0644", "en": "Reliance on Allah", "root": "\u0648 \u0643 \u0644", "example_ar": "\u062a\u064e\u0648\u0643\u0651\u064e\u0644\u0652\u062a\u064f \u0639\u064e\u0644\u064e\u0649\u0670 \u0627\u0644\u0644\u0651\u064e\u0647\u0650", "example_en": "I put my trust in Allah"},
      {"ar": "\u062e\u064f\u0634\u064f\u0639", "en": "Humility", "root": "\u062e \u0634 \u0639", "example_ar": "\u0642\u064e\u062f \u0623\u064e\u0641\u0652\u0644\u064e\u062d\u064e \u0627\u0644\u0652\u0645\u064f\u0624\u0652\u0645\u0650\u0646\u064f\u0648\u0646\u064e \u0627\u0644\u0651\u064e\u0630\u0650\u064a\u0646\u064e \u0647\u064f\u0645\u0652 \u0641\u0650\u064a \u0635\u064e\u0644\u064e\u0627\u062a\u0650\u0647\u0650\u0645\u0652 \u062e\u064e\u0627\u0634\u0650\u0639\u0648\u0646\u064e", "example_en": "Successful indeed are the believers who are humble in their prayers"}
    ]
  },
  "unit3": {
    "title_en": "Islam",
    "title_ar": "\u0627\u0644\u0625\u0650\u0633\u0652\u0644\u064e\u0627\u0645\u064f",
    "words": [
      {"ar": "\u0625\u0650\u0633\u0652\u0644\u064e\u0627\u0645", "en": "Submission to Allah", "root": "\u0633 \u0644 \u0645", "example_ar": "\u0625\u0650\u0646\u0651\u064e \u0627\u0644\u0652\u062f\u0650\u064a\u0646\u064e \u0639\u0650\u0646\u0652\u062f\u064e \u0627\u0644\u0644\u0651\u064e\u0647\u0650 \u0627\u0644\u0650\u0633\u0652\u0644\u064e\u0627\u0645\u064f", "example_en": "Indeed, the religion in the sight of Allah is Islam"},
      {"ar": "\u0625\u0650\u064a\u0645\u064e\u0627\u0646", "en": "Faith", "root": "\u0623 \u0645 \u0646", "example_ar": "\u0622\u064e\u0645\u064e\u0646\u064e \u0627\u0644\u0652\u0631\u0651\u064e\u0633\u064f\u0648\u0644\u064f \u0628\u0650\u0645\u064e\u0627 \u0623\u064f\u0646\u0632\u0650\u0644\u064e \u0625\u0650\u0644\u0650\u064a\u0647\u0650", "example_en": "The Messenger has believed in what was revealed"},
      {"ar": "\u0634\u064e\u0647\u064e\u0627\u062f\u064e\u0629", "en": "Testimony", "root": "\u0634 \u0647 \u062f", "example_ar": "\u0623\u064e\u0646\u0652 \u0644\u064e\u0627 \u0625\u064e\u0644\u064e\u0661\u064e\u0647\u064e \u0625\u0650\u0644\u0651\u064e\u0627 \u0627\u0644\u0644\u0651\u064e\u0647\u064f", "example_en": "That there is no deity except Allah"},
      {"ar": "\u0625\u0650\u062d\u0652\u0633\u064e\u0627\u0646", "en": "Excellence/Beauty", "root": "\u062d \u0633 \u0646", "example_ar": "\u0623\u064e\u0646\u0652 \u062a\u064e\u0639\u0652\u0628\u064f\u062f\u064e \u0627\u0644\u0644\u0651\u064e\u0647\u064e \u0643\u064e\u0623\u064e\u0646\u0651\u064e\u0643\u064e \u062a\u064e\u0631\u064e\u0627\u0647\u064f", "example_en": "To worship Allah as though you see Him"},
      {"ar": "\u0635\u064e\u0628\u0652\u0631", "en": "Patience", "root": "\u0635 \u0628 \u0631", "example_ar": "\u0625\u0650\u0646\u0651\u064e \u0627\u0644\u0644\u0651\u064e\u0647\u064e \u0645\u064e\u0639\u064e \u0627\u0644\u0652\u0635\u0651\u064e\u0627\u0628\u0650\u0631\u0650\u064a\u0646\u064e", "example_en": "Indeed, Allah is with the patient"},
      {"ar": "\u0642\u064f\u0631\u0652\u0622\u0646", "en": "Quran", "root": "\u0642 \u0631 \u0623", "example_ar": "\u0625\u0650\u0646\u0651\u064e \u0647\u064e\u0650\u0630\u064e \u0627\u0644\u0652\u0642\u064f\u0631\u0652\u0622\u0646\u064e \u064a\u064e\u0647\u0652\u062f\u0650\u064a \u0644\u0644\u0651\u064e\u062a\u0655\u0650 \u0647\u0655\u0650 \u0623\u064e\u0642\u0652\u0648\u064e\u0645\u064f", "example_en": "Indeed, this Quran guides to that which is most suitable"}
    ]
  }
};

document.addEventListener('DOMContentLoaded', function () {
    // Remove disable-onload-animations after DOM mounts
    document.body.classList.remove('disable-onload-animations');

    // Detect pinned sidebar and add helper class to body
    if (document.querySelector('.sidenav-with-history-container')) {
        document.body.classList.add('has-sidenav');
    }

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            var target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Navbar shadow
    var navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', function () {
        navbar.style.boxShadow = window.scrollY > 50
            ? '0 4px 20px rgba(0,0,0,0.12)'
            : '0 2px 8px rgba(0,0,0,0.08)';
    });

    // Arabic font switcher
    var fontSelect = document.getElementById('arabic-font');
    if (fontSelect) {
        var saved = localStorage.getItem('arabic-font');
        if (saved) {
            fontSelect.value = saved;
            applyFont(saved);
        }
        fontSelect.addEventListener('change', function () {
            localStorage.setItem('arabic-font', this.value);
            applyFont(this.value);
        });
    }

    function applyFont(font) {
        var classes = ['font-nastaleeq', 'font-amiri', 'font-scheherazade', 'font-lateef'];
        classes.forEach(function (cls) {
            document.body.classList.remove(cls);
        });
        if (font && font !== 'naskh') {
            document.body.classList.add('font-' + font);
        }
    }

    // Translation toggles — English ON by default, others OFF
    var toggles = document.querySelectorAll('.translation-toggle');
    toggles.forEach(function (btn) {
        var key = btn.getAttribute('data-toggle');
        var cls = 'no-' + key;
        var defaultOn = (key === 'translation');
        var saved = localStorage.getItem('toggle-' + key);
        var isOn;
        if (saved === null) {
            isOn = defaultOn;
        } else {
            isOn = (saved === 'on');
        }

        if (!isOn) {
            document.body.classList.add(cls);
        }
        btn.classList.toggle('on', isOn);
        btn.querySelector('.toggle-label').textContent = isOn ? btn.getAttribute('data-on') : btn.getAttribute('data-off');

        btn.addEventListener('click', function () {
            isOn = !isOn;
            document.body.classList.toggle(cls, !isOn);
            this.classList.toggle('on', isOn);
            this.querySelector('.toggle-label').textContent = isOn ? this.getAttribute('data-on') : this.getAttribute('data-off');
            localStorage.setItem('toggle-' + key, isOn ? 'on' : 'off');
        });
    });

    // Font size controls — direct DOM approach
    var AR_BASE = {
        title: 2.6,
        body: 1.725,
        h3: 1.4,
        hadith: 1.5
    };
    var EN_BASE = {
        title: 2.0,
        body: 1.0,
        h3: 1.15,
        hadith: 1.1
    };

    var arScale = parseFloat(localStorage.getItem('ar-font-scale')) || 1;
    var enScale = parseFloat(localStorage.getItem('en-font-scale')) || 1;

    function applyArabicScale(scale) {
        document.querySelectorAll('.lesson-title .ar, .unit-hero-title .ar').forEach(function (el) {
            el.style.fontSize = (AR_BASE.title * scale) + 'rem';
        });
        document.querySelectorAll('.lesson-pair .ar p, .lesson-block .ar p, .lesson-concept-block .ar').forEach(function (el) {
            el.style.fontSize = (AR_BASE.body * scale) + 'rem';
        });
        document.querySelectorAll('.lesson-pair .ar h3, .lesson-block .ar h3').forEach(function (el) {
            el.style.fontSize = (AR_BASE.h3 * scale) + 'rem';
        });
        document.querySelectorAll('.hadith-card .ar .hadith-text').forEach(function (el) {
            el.style.fontSize = (AR_BASE.hadith * scale) + 'rem';
        });
        document.querySelectorAll('.hero-sub-ar').forEach(function (el) {
            el.style.fontSize = (1.6 * scale) + 'rem';
        });
        document.querySelectorAll('.lesson-highlight.ar').forEach(function (el) {
            el.style.fontSize = (1.05 * scale) + 'rem';
        });
        document.querySelectorAll('.track-name-ar').forEach(function (el) {
            el.style.fontSize = (1.3 * scale) + 'rem';
        });
        document.querySelectorAll('.lesson-name.ar').forEach(function (el) {
            el.style.fontSize = (1.725 * scale) + 'rem';
        });
    }

    function applyEnglishScale(scale) {
        document.querySelectorAll('.lesson-title .en, .hero-title, .unit-hero-title .en').forEach(function (el) {
            el.style.fontSize = (EN_BASE.title * scale) + 'rem';
        });
        document.querySelectorAll('.lesson-pair .en p, .lesson-block .en p, .lesson-concept-block .en').forEach(function (el) {
            el.style.fontSize = (EN_BASE.body * scale) + 'rem';
        });
        document.querySelectorAll('.lesson-pair .en h3, .lesson-block .en h3').forEach(function (el) {
            el.style.fontSize = (EN_BASE.h3 * scale) + 'rem';
        });
        document.querySelectorAll('.hadith-card .en .hadith-text').forEach(function (el) {
            el.style.fontSize = (EN_BASE.hadith * scale) + 'rem';
        });
        document.querySelectorAll('.lesson-highlight.en').forEach(function (el) {
            el.style.fontSize = (1.05 * scale) + 'rem';
        });
        document.querySelectorAll('.track-desc, .hero-sub-en, .unit-hero-desc').forEach(function (el) {
            el.style.fontSize = (0.95 * scale) + 'rem';
        });
        document.querySelectorAll('.track-name').forEach(function (el) {
            el.style.fontSize = (1.5 * scale) + 'rem';
        });
        document.querySelectorAll('.lesson-name:not(.ar)').forEach(function (el) {
            el.style.fontSize = (1.0 * scale) + 'rem';
        });
    }

    applyArabicScale(arScale);
    applyEnglishScale(enScale);

    // Add Noto Sans Tamil font
    var tamilLink = document.createElement('link');
    tamilLink.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;500;600;700&display=swap';
    tamilLink.rel = 'stylesheet';
    document.head.appendChild(tamilLink);

    // Auto-insert Arabic-Indic numbers in lesson Arabic h3 headings
    var arNums = ['\u0661', '\u0662', '\u0663', '\u0664', '\u0665', '\u0666', '\u0667', '\u0668', '\u0669'];
    var arH3s = document.querySelectorAll('.lesson-pair .ar h3, .lesson-block .ar h3');
    var numIndex = 0;
    arH3s.forEach(function (h3) {
        if (numIndex >= arNums.length) return;
        var hasNum = h3.textContent.match(/^[\u0661-\u0669]+[\.\s]*/);
        if (hasNum) {
            // Wrap existing number in .ar-num
            var span = document.createElement('span');
            span.className = 'ar-num';
            span.textContent = hasNum[0];
            h3.textContent = h3.textContent.replace(/^[\u0661-\u0669]+[\.\s]*/, '');
            h3.insertBefore(span, h3.firstChild);
        } else {
            // Inject new number
            var span = document.createElement('span');
            span.className = 'ar-num';
            span.textContent = arNums[numIndex] + '. ';
            h3.insertBefore(span, h3.firstChild);
        }
        numIndex++;
    });

    // Fix Arabic-Indic numerals in nastaleeq font: wrap U+0660-U+0669 in .ar-num spans
    if (document.body.classList.contains('font-nastaleeq')) {
        document.querySelectorAll('.ar').forEach(function(el) {
            var html = el.innerHTML;
            var modified = html.replace(/[\u0660-\u0669]/g, function(m) {
                return '<span class="ar-num">' + m + '</span>';
            });
            if (modified !== html) el.innerHTML = modified;
        });
    }

    // Meaning popup toggle — opens popup + loads enriched content from inline cache
    var meaningBtns = document.querySelectorAll('.meaning-btn');
    meaningBtns.forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            var popupId = btn.getAttribute('data-popup');
            var popup = document.getElementById(popupId);
            if (popup) {
                var verseKey = popup.getAttribute('data-verse-key');
                var body = popup.querySelector('.popup-body');
                if (verseKey && body && window.__QURAN_CACHE && window.__QURAN_CACHE[verseKey]) {
                    renderPopupContent(verseKey, window.__QURAN_CACHE[verseKey], body);
                }
                popup.classList.add('active');
                document.body.classList.add('popup-open');
                var closeBtn = popup.querySelector('.popup-close');
                if (closeBtn) closeBtn.focus();
            }
        });
    });

    // Render the enriched popup content (surah badge + Arabic + Hilali
    // translation + tafsir tabs + cross-references) from the inline
    // __QURAN_CACHE entry into an existing .popup-body. This overwrites the
    // static shipped content on every open so the full 3-tafsir view is
    // always shown. (Regressed in 16a2f30 by an early-return on non-empty
    // bodies; restored from 22a74cd.)
    function renderPopupContent(verseKey, data, body) {
        var meta = data.surah_meta || {};
        var html = '';

        html += '<div class="popup-surah-badge">';
        html += '<span class="surah-badge-ar">' + (meta.name_ar || '') + '</span>';
        html += '<span>' + (meta.name_en || '') + ' ' + verseKey.split(':')[1] + '</span>';
        if (meta.revelation) html += ' &middot; ' + meta.revelation;
        html += '</div>';

        html += '<div class="popup-arabic-verse">' + data.arabic + '</div>';

        html += '<h3>Translation</h3>';
        html += '<div class="popup-translation-text">' + (data.translation.hilali || '') + '</div>';
        html += '<div style="font-size:0.75rem;color:#a0aec0;margin-top:4px;">Al-Hilali-Khan</div>';

        var tafsirEditions = [
            { key: 'ibn_kathir', label: 'Ibn Kathir' },
            { key: 'maarif', label: "Ma'arif" },
            { key: 'tazkirul', label: 'Tazkirul' }
        ];
        var availableEditions = tafsirEditions.filter(function (ed) {
            return data.tafsir[ed.key] && data.tafsir[ed.key].indexOf('not available') === -1;
        });

        if (availableEditions.length > 0) {
            html += '<h3>Tafsir</h3>';
            html += '<div class="popup-tafsir-tabs">';
            availableEditions.forEach(function (ed, i) {
                html += '<button class="popup-tafsir-tab' + (i === 0 ? ' active' : '') + '" data-tafsir="' + ed.key + '">' + ed.label + '</button>';
            });
            html += '</div>';
            availableEditions.forEach(function (ed, i) {
                html += '<div class="popup-tafsir-panel' + (i === 0 ? ' active' : '') + '" data-tafsir-panel="' + ed.key + '">';
                html += '<div class="popup-tafsir-text">' + data.tafsir[ed.key] + '</div>';
                html += '</div>';
            });
        }

        if (data.cross_references && data.cross_references.length > 0) {
            html += '<div class="popup-cross-refs">';
            html += '<div class="popup-cross-refs-title">Related Verses</div>';
            data.cross_references.forEach(function (ref) {
                html += '<a class="popup-cross-ref-item" href="#" data-cross-ref="' + ref.verse_key + '">';
                html += '<div class="popup-cross-ref-key">' + ref.verse_key + '</div>';
                html += '<div class="popup-cross-ref-snippet">' + ref.snippet_en + '</div>';
                html += '</a>';
            });
            html += '</div>';
        }

        body.innerHTML = html;

        body.querySelectorAll('.popup-tafsir-tab').forEach(function (tab) {
            tab.addEventListener('click', function () {
                body.querySelectorAll('.popup-tafsir-tab').forEach(function (t) { t.classList.remove('active'); });
                body.querySelectorAll('.popup-tafsir-panel').forEach(function (p) { p.classList.remove('active'); });
                tab.classList.add('active');
                var panel = body.querySelector('[data-tafsir-panel="' + tab.getAttribute('data-tafsir') + '"]');
                if (panel) panel.classList.add('active');
            });
        });
    }

    function closeMeaningPopup(popup) {
        popup.classList.remove('active');
        document.body.classList.remove('popup-open');
    }

    document.querySelectorAll('.popup-overlay').forEach(function(popup) {
        popup.addEventListener('click', function(e) {
            if (e.target === popup || e.target.classList.contains('popup-close')) {
                closeMeaningPopup(popup);
            }
        });
        var closeBtn = popup.querySelector('.popup-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                closeMeaningPopup(popup);
            });
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            var activePopup = document.querySelector('.popup-overlay.active');
            if (activePopup) {
                closeMeaningPopup(activePopup);
            }
        }
    });

    // "Read Full Hadith" — opens a detail modal with the full Arabic text,
    // grade badge, English translation, and source metadata from the inline
    // __HADITH_DATA array (keyed by data-hadith-id). Reuses the popup pattern.
    function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    var hadithModal = null;
    document.addEventListener('click', function(e) {
        if (!e.target || !e.target.closest) return;
        var btn = e.target.closest('.hadith-read-more');
        if (!btn) return;
        e.preventDefault();
        var id = parseInt(btn.getAttribute('data-hadith-id'), 10);
        var data = (typeof __HADITH_DATA !== 'undefined') ? __HADITH_DATA : [];
        var hadith = null;
        for (var i = 0; i < data.length; i++) {
            if (parseInt(data[i].id, 10) === id) { hadith = data[i]; break; }
        }
        if (!hadith) return;

        var grade = esc(hadith.grade || '');
        var gradeClass = grade.toLowerCase().replace(/[^a-z]/g, '');
        var SUNNAH_BOOKS = {
            'Sahih al-Bukhari': 'bukhari',
            'Sahih Muslim': 'muslim',
            'Jami\' at-Tirmidhi': 'tirmidhi',
            'Sunan an-Nasa\'i': 'nasai',
            'Sunan Abi Dawud': 'abudawud'
        };
        var meta = [];
        if (hadith.narrator) meta.push('<span><strong>Narrated by:</strong> ' + esc(hadith.narrator) + '</span>');
        if (hadith.collection) meta.push('<span><strong>Source:</strong> ' + esc(hadith.collection) + (hadith.number ? ', No. ' + esc(hadith.number) : '') + '</span>');
        if (hadith.book) meta.push('<span><strong>Book:</strong> ' + esc(hadith.book) + '</span>');
        var sunnahUrl = hadith.sunnah_url || '';
        if (!sunnahUrl && hadith.collection && SUNNAH_BOOKS[hadith.collection] && hadith.number) {
            sunnahUrl = 'https://sunnah.com/' + SUNNAH_BOOKS[hadith.collection] + '/' + encodeURIComponent(hadith.number);
        }
        if (sunnahUrl) {
            meta.push('<span><a class="hadith-sunnah-link" href="' + esc(sunnahUrl) + '" target="_blank" rel="noopener">View on Sunnah.com &#8599;</a></span>');
        }

        var modal = document.getElementById('hadith-detail-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'popup-overlay hadith-detail-modal';
            modal.id = 'hadith-detail-modal';
            document.body.appendChild(modal);
        }
        modal.innerHTML =
            '<div class="popup-modal">' +
                '<div class="popup-header">' +
                    '<span>Hadith #' + id + '</span>' +
                    '<button type="button" class="popup-close" aria-label="Close hadith details">&#10005;</button>' +
                '</div>' +
                '<div class="popup-body">' +
                    '<div class="hadith-detail-arabic" dir="rtl">' + esc(hadith.arabic || '') + '</div>' +
                    (grade ? '<div class="hadith-detail-grade ' + gradeClass + '">' + grade + '</div>' : '') +
                    (hadith.fullArabic ? '<h3>Full Hadith (Arabic)</h3><div class="hadith-detail-arabic" dir="rtl">' + esc(hadith.fullArabic) + '</div>' : '') +
                    (hadith.fullEnglish ? '<h3>Full Hadith (English)</h3><p class="hadith-detail-english">' + esc(hadith.fullEnglish) + '</p>' : '') +
                    (meta.length ? '<div class="hadith-detail-meta">' + meta.join('<br>') + '</div>' : '') +
                '</div>' +
            '</div>';
        modal.classList.add('active');
        document.body.classList.add('popup-open');
        var closeBtn = modal.querySelector('.popup-close');
        if (closeBtn) closeBtn.focus();
    });

    document.addEventListener('click', function(e) {
        var modal = document.getElementById('hadith-detail-modal');
        if (!modal || !modal.classList.contains('active')) return;
        if (e.target === modal || (e.target.classList && e.target.classList.contains('popup-close'))) {
            closeMeaningPopup(modal);
        }
    });

    // Translation radio selector inside popups
    document.querySelectorAll('.popup-translation-selector').forEach(function(selector) {
        var radios = selector.querySelectorAll('input[type="radio"]');
        var popup = selector.closest('.popup-overlay');
        var texts = popup ? popup.querySelectorAll('.popup-translation-text') : [];
        radios.forEach(function(radio) {
            radio.addEventListener('change', function() {
                texts.forEach(function(t) { t.style.display = 'none'; });
                var target = popup ? popup.querySelector('.popup-translation-text.' + radio.value) : null;
                if (target) target.style.display = 'block';
            });
        });
    });

    // Settings dropdown toggle
    var settingsDropdown = document.querySelector('.settings-dropdown');
    if (settingsDropdown) {
        var settingsBtn = settingsDropdown.querySelector('.settings-toggle-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                settingsDropdown.classList.toggle('open');
            });
        }
        document.addEventListener('click', function(e) {
            if (!settingsDropdown.contains(e.target)) {
                settingsDropdown.classList.remove('open');
            }
        });
    }

    /* ---- Theme Accent Color Swatches ---- */
    var ACCENT_LIST = [
        { key: 'blue', label: 'Blue' },
        { key: 'green', label: 'Green' },
        { key: 'purple', label: 'Purple' },
        { key: 'teal', label: 'Teal' }
    ];

    document.querySelectorAll('.settings-dropdown-content').forEach(function(content) {
        if (content.querySelector('.accent-swatches')) return;

        var row = document.createElement('div');
        row.className = 'settings-dropdown-item';

        var label = document.createElement('span');
        label.className = 'settings-label';
        label.textContent = 'Theme Color';

        var swatches = document.createElement('div');
        swatches.className = 'accent-swatches';
        swatches.setAttribute('role', 'radiogroup');
        swatches.setAttribute('aria-label', 'Theme color');

        var current = document.documentElement.getAttribute('data-accent') || 'blue';
        var btns = [];
        ACCENT_LIST.forEach(function(accent) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'accent-swatch';
            btn.setAttribute('data-accent', accent.key);
            btn.setAttribute('role', 'radio');
            btn.setAttribute('aria-checked', accent.key === current ? 'true' : 'false');
            btn.setAttribute('aria-label', accent.label);

            var dot = document.createElement('span');
            dot.className = 'accent-swatch-dot';
            btn.appendChild(dot);

            btn.addEventListener('click', function() {
                setAccent(accent.key);
            });
            btns.push(btn);
            swatches.appendChild(btn);
        });

        function setAccent(key) {
            document.documentElement.setAttribute('data-accent', key);
            try { localStorage.setItem('accent-color', key); } catch (e) {}
            btns.forEach(function(b) {
                b.setAttribute('aria-checked', b.getAttribute('data-accent') === key ? 'true' : 'false');
            });
        }

        swatches.addEventListener('keydown', function(e) {
            var idx = btns.indexOf(document.activeElement);
            if (idx === -1) return;
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                var dir = e.key === 'ArrowRight' ? 1 : -1;
                var next = btns[(idx + dir + btns.length) % btns.length];
                next.focus();
                setAccent(next.getAttribute('data-accent'));
            } else if (e.key === 'Home') {
                e.preventDefault();
                btns[0].focus();
                setAccent(btns[0].getAttribute('data-accent'));
            } else if (e.key === 'End') {
                e.preventDefault();
                btns[btns.length - 1].focus();
                setAccent(btns[btns.length - 1].getAttribute('data-accent'));
            }
        });

        row.appendChild(label);
        row.appendChild(swatches);

        var divider = document.createElement('div');
        divider.className = 'settings-dropdown-divider';

        content.insertBefore(divider, content.firstChild);
        content.insertBefore(row, content.firstChild);
    });

    /* ---- Dark Mode Toggle ---- */
    var dmToggle = document.querySelector('.dm-toggle');
    if (dmToggle) {
        dmToggle.addEventListener('click', function () {
            var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            var newTheme = isDark ? null : 'dark';
            if (newTheme) {
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }
            try { localStorage.setItem('dark-mode', newTheme === 'dark' ? 'true' : 'false'); } catch (e) {}
        });
    }

    /* ---- Mobile Nav Toggle ---- */
    var navbar = document.querySelector('.navbar');
    if (navbar) {
        var navToggle = document.createElement('button');
        navToggle.className = 'nav-toggle';
        navToggle.setAttribute('aria-label', 'Menu');
        navToggle.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none"/></svg>';
        navbar.appendChild(navToggle);

        navToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            navbar.classList.toggle('nav-open');
        });

        document.addEventListener('click', function(e) {
            if (navbar.classList.contains('nav-open') && !navbar.contains(e.target)) {
                navbar.classList.remove('nav-open');
            }
        });
    }

    /* ---- Range Sliders for Font Size ---- */
    var fontGroups = document.querySelectorAll('.settings-dropdown-content .font-size-group');
    fontGroups.forEach(function(group) {
        var item = group.closest('.settings-dropdown-item');
        var labelText = item ? (item.querySelector('.settings-label')?.textContent || '') : '';
        var isArabic = labelText.toLowerCase().indexOf('arabic') !== -1;
        var storageKey = isArabic ? 'ar-font-scale' : 'en-font-scale';
        var currentScale = parseFloat(localStorage.getItem(storageKey)) || 1;

        var wrap = document.createElement('div');
        wrap.className = 'font-size-slider-wrap';

        var slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0.7';
        slider.max = '1.5';
        slider.step = '0.05';
        slider.value = currentScale;

        var valDisplay = document.createElement('span');
        valDisplay.className = 'font-size-slider-value';
        valDisplay.textContent = Math.round(currentScale * 100) + '%';

        wrap.appendChild(slider);
        wrap.appendChild(valDisplay);
        group.appendChild(wrap);

        slider.addEventListener('input', function() {
            var scale = parseFloat(this.value);
            valDisplay.textContent = Math.round(scale * 100) + '%';
            if (isArabic) {
                applyArabicScale(scale);
            } else {
                applyEnglishScale(scale);
            }
            localStorage.setItem(storageKey, scale);
            if (typeof scheduleDetectLongNames === 'function') scheduleDetectLongNames();
        });
    });
});

/* ---- Sidebar Toggle (Desktop) ---- */
(function() {
    function svgBase() {
        return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<rect x="3" y="3" width="18" height="18" rx="3"/>' +
            '<line x1="8" y1="6" x2="8" y2="18"/>' +
        '</svg>';
    }
    function svgExpandedHover() {
        return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<rect x="3" y="3" width="18" height="18" rx="3"/>' +
            '<line x1="8" y1="6" x2="8" y2="18"/>' +
            '<polyline points="14,9 10,12 14,15"/>' +
        '</svg>';
    }
    function svgCollapsedHover() {
        return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<rect x="3" y="3" width="18" height="18" rx="3"/>' +
            '<line x1="8" y1="6" x2="8" y2="18"/>' +
            '<polyline points="10,9 14,12 10,15"/>' +
        '</svg>';
    }

    var layout = document.querySelector('.lesson-layout');
    var sidebar = document.querySelector('.lesson-sidebar');
    var toggle = document.querySelector('.sidebar-toggle');
    if (!layout || !toggle || !sidebar) return;

    document.body.appendChild(toggle);
    toggle.innerHTML = '<span class="sidebar-toggle-icon">' +
        '<span class="fl-vis fl-base">' + svgBase() + '</span>' +
        '<span class="fl-vis fl-expanded-hover" style="display:none">' + svgExpandedHover() + '</span>' +
        '<span class="fl-vis fl-collapsed-hover" style="display:none">' + svgCollapsedHover() + '</span>' +
    '</span>' +
    '<span class="fl-tooltip" style="display:none"></span>';

    var NAV_HEIGHT = 64;

    function updateToggle() {
        var layoutRect = layout.getBoundingClientRect();
        var sidebarRect = sidebar.getBoundingClientRect();
        var sidebarWidth = sidebar.offsetWidth;

        toggle.style.left = (layoutRect.left + sidebarWidth) + 'px';
        toggle.style.top = (sidebarRect.top + 12) + 'px';

        var layoutInView = layoutRect.bottom > 0 && layoutRect.top < window.innerHeight;
        var clearOfNav = sidebarRect.top >= NAV_HEIGHT;
        if (layoutInView && clearOfNav) {
            toggle.style.display = 'flex';
        } else {
            toggle.style.display = 'none';
        }
    }

    window.addEventListener('resize', updateToggle);
    window.addEventListener('scroll', updateToggle, { passive: true });
    sidebar.addEventListener('transitionend', updateToggle);

    var flBase = toggle.querySelector('.fl-base');
    var flExpHover = toggle.querySelector('.fl-expanded-hover');
    var flColHover = toggle.querySelector('.fl-collapsed-hover');
    var flTooltip = toggle.querySelector('.fl-tooltip');

    function updateFloatingIcons() {
        var isCollapsed = layout.classList.contains('sidebar-collapsed');
        toggle.classList.toggle('collapsed', isCollapsed);
        if (flBase) flBase.style.display = 'flex';
        if (flExpHover) flExpHover.style.display = 'none';
        if (flColHover) flColHover.style.display = 'none';
        toggle.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
        if (flTooltip) flTooltip.style.display = 'none';
    }

    toggle.addEventListener('mouseenter', function() {
        var isCollapsed = layout.classList.contains('sidebar-collapsed');
        if (flBase) flBase.style.display = 'none';
        if (flExpHover) flExpHover.style.display = isCollapsed ? 'none' : 'flex';
        if (flColHover) flColHover.style.display = isCollapsed ? 'flex' : 'none';
        if (flTooltip) {
            flTooltip.textContent = isCollapsed ? 'Open sidebar' : 'Close sidebar';
            flTooltip.style.display = 'block';
        }
    });

    toggle.addEventListener('mouseleave', function() {
        if (flTooltip) flTooltip.style.display = 'none';
        updateFloatingIcons();
    });

    updateFloatingIcons();

    toggle.addEventListener('click', function() {
        layout.classList.toggle('sidebar-collapsed');
        updateFloatingIcons();
    });
})();

/* ---- Pinned Sidebar Toggle (new layout: sidenav-with-history-container) ---- */
(function() {
    function svgBase() {
        return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<rect x="3" y="3" width="18" height="18" rx="3"/>' +
            '<line x1="8" y1="6" x2="8" y2="18"/>' +
        '</svg>';
    }
    function svgExpandedHover() {
        return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<rect x="3" y="3" width="18" height="18" rx="3"/>' +
            '<line x1="8" y1="6" x2="8" y2="18"/>' +
            '<polyline points="14,9 10,12 14,15"/>' +
        '</svg>';
    }
    function svgCollapsedHover() {
        return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<rect x="3" y="3" width="18" height="18" rx="3"/>' +
            '<line x1="8" y1="6" x2="8" y2="18"/>' +
            '<polyline points="12,10 15,13 12,16"/>' +
        '</svg>';
    }

    var sidenav = document.querySelector('.sidenav-with-history-container');
    var toggleBtn = document.querySelector('.sidebar-toggle-btn');
    var navLogo = document.querySelector('.nav-logo');
    if (!sidenav || !toggleBtn) return;

    // Build state containers inside the button
    toggleBtn.innerHTML =
        '<span class="pv-vis pv-base">' + svgBase() + '</span>' +
        '<span class="pv-vis pv-expanded-hover" style="display:none">' + svgExpandedHover() + '</span>' +
        '<span class="pv-vis pv-collapsed-hover" style="display:none">' + svgCollapsedHover() + '</span>' +
        '<span class="pv-vis pv-logo" style="display:none"></span>' +
        '<span class="pv-tooltip" style="display:none"></span>';

    var pvBase = toggleBtn.querySelector('.pv-base');
    var pvExpHover = toggleBtn.querySelector('.pv-expanded-hover');
    var pvColHover = toggleBtn.querySelector('.pv-collapsed-hover');
    var pvLogo = toggleBtn.querySelector('.pv-logo');
    var tooltipEl = toggleBtn.querySelector('.pv-tooltip');

    var navLogoImg = navLogo ? navLogo.querySelector('.nav-logo-img') : null;

    // Clone only logo image into pv-logo (no brand text)
    if (navLogoImg && pvLogo) {
        pvLogo.appendChild(navLogoImg.cloneNode(true));
    }

    function show(vis) {
        [pvBase, pvExpHover, pvColHover, pvLogo].forEach(function(el) {
            if (el) el.style.display = 'none';
        });
        if (vis) vis.style.display = 'flex';
    }

    function updatePinnedIcons() {
        var isCollapsed = sidenav.classList.contains('collapsed');
        toggleBtn.classList.toggle('collapsed', isCollapsed);
        toggleBtn.classList.toggle('expanded', !isCollapsed);
        if (isCollapsed) {
            show(pvLogo);
            if (navLogoImg) navLogoImg.style.display = 'none';
        } else {
            show(pvBase);
            if (navLogoImg) navLogoImg.style.display = '';
        }
        toggleBtn.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
        if (tooltipEl) tooltipEl.style.display = 'none';
    }

    updatePinnedIcons();

    toggleBtn.addEventListener('mouseenter', function() {
        var isCollapsed = sidenav.classList.contains('collapsed');
        if (isCollapsed) {
            pvColHover.style.display = 'flex';
            if (pvLogo) pvLogo.style.visibility = 'hidden';
        } else {
            show(pvExpHover);
        }
        if (tooltipEl) {
            tooltipEl.textContent = isCollapsed ? 'Open sidebar' : 'Close sidebar';
            tooltipEl.style.display = 'block';
        }
    });

    toggleBtn.addEventListener('mouseleave', function() {
        if (pvLogo) pvLogo.style.visibility = '';
        if (tooltipEl) tooltipEl.style.display = 'none';
        updatePinnedIcons();
    });

    // Create sidebar backdrop for mobile overlay
    var backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    document.body.appendChild(backdrop);

    // Activate backdrop if sidebar is already open on mobile (e.g., hub pages)
    if (window.innerWidth <= 768 && sidenav.classList.contains('open')) {
        backdrop.classList.add('active');
    }

    toggleBtn.addEventListener('click', function() {
        if (window.innerWidth <= 768) {
            sidenav.classList.toggle('open');
            backdrop.classList.toggle('active');
            var navbar = document.querySelector('.navbar');
            if (navbar) navbar.classList.remove('nav-open');
        } else {
            sidenav.classList.toggle('collapsed');
            updatePinnedIcons();
            setTimeout(detectLongNames, 350);
        }
    });

    // Backdrop close disabled for now (side effect: layout shifting)
    // backdrop.addEventListener('click', function() {
    //     sidenav.classList.remove('open');
    //     backdrop.classList.remove('active');
    // });
})();

/* ============================================
   Audio Player (Lesson Pages)
   MP3-first: per-block MP3s built by scripts/build_lesson_audio.py
   (data in js/audio-manifests.js, loaded on demand), with Web Speech
   API fallback per block when no MP3 entry exists. The aside play-all
   button steps through every .lesson-block .ar in order; per-sentence
   .lp-play-btn buttons are injected under each block. Word highlighting
   is driven by requestAnimationFrame over MP3 currentTime/duration and by
   speechSynthesis.onboundary for the TTS fallback.
   ============================================ */
(function () {
    'use strict';

    var player = document.querySelector('.audio-player');
    if (!player) return;

    var playBtn = player.querySelector('.audio-play-btn');
    var statusEl = player.querySelector('.audio-status');
    var previewEl = player.querySelector('.audio-text-preview');
    var speedSelect = player.querySelector('.audio-speed-select') || player.querySelector('#audio-speed');

    /* ---- state ---- */
    var currentRate = 1;
    var savedSpeed = localStorage.getItem('audio-speed');
    if (savedSpeed && speedSelect) {
        speedSelect.value = savedSpeed;
        currentRate = parseFloat(savedSpeed) || 1;
    }
    var isPlayingAll = false;
    var currentBlockIndex = -1;
    var audioEl = null;
    var manifest = null;
    var manifestReady = false;
    var rafId = null;

    function setStatus(msg) {
        if (statusEl) statusEl.textContent = msg;
    }

    function updatePreview(text) {
        if (previewEl) previewEl.textContent = text || '';
    }

    function shortText(text) {
        text = text || '';
        return text.length > 60 ? text.substring(0, 60) + '...' : text;
    }

    /* ---- js/ asset base, resolved from this script's own src so both
       http(s):// and file:// pages find audio-manifests.js correctly ---- */
    function getBasePath() {
        if (document.currentScript && document.currentScript.src) {
            var src = document.currentScript.src;
            return src.substring(0, src.lastIndexOf('/') + 1);
        }
        var depth = Math.max(0, (location.pathname.split('/').length - 2) - 1);
        return Array(depth + 1).join('../');
    }

    /* ---- load the pre-rendered audio manifest (js/audio-manifests.js) ---- */
    function pageKey() {
        return (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
    }

    function loadManifest() {
        if (window.__AUDIO_MANIFESTS) {
            manifest = window.__AUDIO_MANIFESTS[pageKey()] || null;
            manifestReady = true;
            return;
        }
        var sc = document.createElement('script');
        sc.src = getBasePath() + 'audio-manifests.js';
        sc.onload = function () {
            manifest = window.__AUDIO_MANIFESTS[pageKey()] || null;
            manifestReady = true;
            setStatus('Tap to play all');
        };
        sc.onerror = function () {
            manifestReady = false;
            setStatus('Tap to play all');
        };
        document.head.appendChild(sc);
    }

    /* ---- blocks: one `.ar` per `.lesson-block`, in document order
       (the same order scripts/build_lesson_audio.py emits entries for) ---- */
    function collectBlocks() {
        var main = document.querySelector('.lesson-main');
        if (!main) return [];
        return Array.prototype.slice.call(main.querySelectorAll('.lesson-block .ar'));
    }

    function getBlockText(block) {
        var node = block.cloneNode(true);
        node.querySelectorAll('.meaning-btn').forEach(function (b) { b.remove(); });
        node.querySelectorAll('.audio-word').forEach(function (s) {
            s.replaceWith(document.createTextNode(s.textContent));
        });
        return node.textContent.replace(/\s+/g, ' ').trim();
    }

    /* ---- wrap plain text nodes into .audio-word spans for highlighting ---- */
    function wrapWords(block) {
        var ps = block.querySelectorAll('p');
        var totalWords = 0;
        ps.forEach(function (p) {
            var walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT, null);
            var textNodes = [];
            while (walker.nextNode()) textNodes.push(walker.currentNode);
            textNodes.forEach(function (node) {
                if (node.parentNode.closest && node.parentNode.closest('.meaning-btn')) return;
                if (node.parentNode.closest && node.parentNode.closest('.audio-word')) return;
                var text = node.textContent;
                if (!text.trim()) return;
                var words = text.split(/(\s+)/);
                var frag = document.createDocumentFragment();
                words.forEach(function (word) {
                    if (word.trim()) {
                        var span = document.createElement('span');
                        span.className = 'audio-word';
                        span.dataset.wi = totalWords;
                        span.textContent = word;
                        totalWords++;
                        frag.appendChild(span);
                    } else {
                        frag.appendChild(document.createTextNode(word));
                    }
                });
                node.parentNode.replaceChild(frag, node);
            });
        });
    }

    function unwrapWords(block) {
        block.querySelectorAll('.audio-word').forEach(function (span) {
            span.replaceWith(document.createTextNode(span.textContent));
        });
    }

    /* ---- word highlighting (proportional bit-space; shared MP3 + TTS) ---- */
    function blockTotalBits(block) {
        var total = 0;
        block.querySelectorAll('.audio-word').forEach(function (w) {
            total += 1 + w.textContent.length;
        });
        return total;
    }

    function highlightWord(block, charIndex, blockText) {
        var text = blockText || '';
        if (!block || !text) return;
        var words = block.querySelectorAll('.audio-word');
        var totalBits = 0;
        var starts = [];
        words.forEach(function (w) {
            starts.push(totalBits);
            totalBits += 1 + w.textContent.length;
        });
        if (totalBits <= 0) return;
        var activeIdx = -1;
        words.forEach(function (w, i) {
            var start = starts[i];
            var end = start + 1 + w.textContent.length;
            if (charIndex >= totalBits || charIndex >= end) {
                w.classList.add('audio-word-done');
                w.classList.remove('audio-word-active');
            } else if (charIndex >= start) {
                w.classList.add('audio-word-active');
                w.classList.remove('audio-word-done');
                if (activeIdx < 0) activeIdx = i;
            } else {
                w.classList.remove('audio-word-active');
                w.classList.remove('audio-word-done');
            }
        });
        if (activeIdx >= 0) {
            var el = block.querySelector('.audio-word[data-wi="' + activeIdx + '"]');
            if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    function removeHighlight(block) {
        if (!block) return;
        block.querySelectorAll('.audio-word-active, .audio-word-done').forEach(function (w) {
            w.classList.remove('audio-word-active', 'audio-word-done');
        });
    }

    function pickArabicVoice() {
        if (!window.speechSynthesis || !speechSynthesis.getVoices) return null;
        var voices = Array.prototype.slice.call(speechSynthesis.getVoices());
        var matches = [];
        for (var j = 0; j < voices.length; j++) {
            var v = voices[j];
            if ((v.lang || '').toLowerCase().indexOf('ar') === 0) matches.push(v);
        }
        for (var k = 0; k < matches.length; k++) {
            if (matches[k].default) return matches[k];
        }
        return matches.length ? matches[0] : null;
    }

    /* ---- per-sentence play buttons ---- */
    function injectPlayButtons() {
        var blocks = collectBlocks();
        blocks.forEach(function (block, i) {
            var parent = block.parentNode;
            if (!parent || parent.querySelector('.lp-play-btn')) return;
            var btn = document.createElement('button');
            btn.className = 'lp-play-btn';
            btn.type = 'button';
            btn.dataset.lpIdx = i;
            btn.setAttribute('aria-label', 'Play this sentence');
            btn.innerHTML = '<svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>';
            block.parentNode.insertBefore(btn, block.nextSibling);
        });
    }

    function setPlayIcon(btn, playing) {
        if (!btn) return;
        btn.innerHTML = playing
            ? '<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
            : '<svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>';
        btn.setAttribute('aria-label', playing ? 'Pause' : 'Play this sentence');
    }

    function resetAllButtons() {
        document.querySelectorAll('.lp-play-btn').forEach(function (btn) {
            btn.classList.remove('playing', 'active');
            setPlayIcon(btn, false);
        });
    }

    function setActiveButton(blockIdx) {
        document.querySelectorAll('.lp-play-btn').forEach(function (btn) {
            var active = parseInt(btn.dataset.lpIdx, 10) === blockIdx;
            btn.classList.toggle('playing', active);
            btn.classList.toggle('active', active);
            setPlayIcon(btn, active);
        });
    }

    /* ---- TTS fallback (Web Speech API path) ---- */
    function makeUtterance(block, onAdvance) {
        var text = getBlockText(block);
        var utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'ar-SA';
        utter.rate = currentRate;
        var arVoice = pickArabicVoice();
        if (arVoice) utter.voice = arVoice;
        var lastChar = -1;
        utter.onboundary = function (e) {
            var idx = e.charIndex;
            if (idx === lastChar) return;
            lastChar = idx;
            idx = Math.min(idx, text.length - 1);
            highlightWord(block, idx, text);
        };
        utter.onend = onAdvance;
        utter.onerror = function () {
            setStatus('Speech error; moving on.');
            onAdvance();
        };
        return utter;
    }

    function speak(block, onAdvance) {
        if (!block) return;
        if (!window.speechSynthesis) {
            setStatus('Audio not supported.');
            return;
        }
        speechSynthesis.speak(makeUtterance(block, onAdvance));
    }

    /* ---- MP3 path (pre-rendered audio) ---- */
    function cancelRaf() {
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    function playMp3(block, entry) {
        if (!block || !entry || !entry.f) return false;
        var text = getBlockText(block);
        var totalBits = blockTotalBits(block);
        if (!audioEl) {
            audioEl = new Audio();
            audioEl.style.display = 'none';
            document.body.appendChild(audioEl);
        }
        cancelRaf();
        audioEl.src = entry.f;
        audioEl.playbackRate = currentRate;
        var tick = function () {
            if (!audioEl || audioEl.paused) {
                cancelRaf();
                return;
            }
            var dur = entry.d || 0;
            var pct = dur > 0 ? Math.min(1, Math.max(0, audioEl.currentTime / dur)) : 0;
            highlightWord(block, Math.floor(pct * (totalBits > 0 ? totalBits : text.length)), text);
            rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
        audioEl.ontimeupdate = function () {
            var dur = entry.d || 0;
            var pct = dur > 0 ? Math.min(1, Math.max(0, audioEl.currentTime / dur)) : 0;
            highlightWord(block, Math.floor(pct * (totalBits > 0 ? totalBits : text.length)), text);
        };
        audioEl.onended = function () { advance(); };
        audioEl.onerror = function () {
            setStatus('Audio unavailable; trying TTS.');
            speak(block, function () { advance(); });
        };
        var p = audioEl.play();
        if (p && p.catch) {
            p.catch(function () {
                setStatus('Audio unavailable; trying TTS.');
                speak(block, function () { advance(); });
            });
        }
        return true;
    }

    function playBlock(index) {
        var blocks = collectBlocks();
        if (blocks.length === 0) return;
        var block = blocks[index];
        if (!block) return;
        cancelRaf();
        blocks.forEach(function (b) { removeHighlight(b); });
        if (!block.querySelector('.audio-word')) wrapWords(block);
        currentBlockIndex = index;
        setActiveButton(index);
        updatePreview(shortText(getBlockText(block)));
        var entry = (manifestReady && manifest && manifest[index]) || null;
        if (entry && entry.f) {
            playMp3(block, entry);
        } else {
            speak(block, function () { advance(); });
        }
        setStatus('Playing ' + (index + 1) + ' of ' + blocks.length);
    }

    function playAll() {
        var blocks = collectBlocks();
        if (blocks.length === 0) {
            setStatus('No Arabic text found.');
            return;
        }
        isPlayingAll = true;
        setMainIcon(true);
        currentBlockIndex = -1;
        advance();
    }

    function advance() {
        var blocks = collectBlocks();
        if (blocks.length === 0) {
            finish();
            return;
        }
        if (isPlayingAll && currentBlockIndex < blocks.length - 1) {
            currentBlockIndex++;
            playBlock(currentBlockIndex);
        } else {
            finish();
        }
    }

    function teardown() {
        cancelRaf();
        isPlayingAll = false;
        if (audioEl) {
            audioEl.pause();
            audioEl.removeAttribute('src');
            audioEl.onerror = null;
            audioEl.onended = null;
            audioEl.ontimeupdate = null;
        }
        if (window.speechSynthesis) speechSynthesis.cancel();
        removeHighlight(collectBlocks()[currentBlockIndex] || null);
        collectBlocks().forEach(function (block) { unwrapWords(block); });
        resetAllButtons();
    }

    function finish() {
        teardown();
        setStatus('Playback finished');
        setMainIcon(false);
    }

    function stopAll() {
        teardown();
        setStatus('Stopped');
        setMainIcon(false);
    }

    function setMainIcon(playing) {
        playBtn.classList.toggle('playing', playing);
        playBtn.innerHTML = playing
            ? '<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
            : '<svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>';
    }

    playBtn.addEventListener('click', function () {
        if (playBtn.classList.contains('playing')) {
            stopAll();
        } else {
            playAll();
        }
    });

    document.addEventListener('click', function (e) {
        if (!e.target || !e.target.closest) return;
        var btn = e.target.closest('.lp-play-btn');
        if (!btn) return;
        var idx = parseInt(btn.dataset.lpIdx, 10);
        var blocks = collectBlocks();
        if (isNaN(idx) || idx < 0 || idx >= blocks.length) return;
        var isActive = currentBlockIndex === idx && !audioEl.paused;
        if (isActive) {
            stopAll();
            return;
        }
        isPlayingAll = false;
        teardown();
        setMainIcon(true);
        playBlock(idx);
    });

    if (speedSelect) {
        speedSelect.addEventListener('change', function () {
            currentRate = parseFloat(this.value) || 1;
            localStorage.setItem('audio-speed', this.value);
            if (audioEl && !audioEl.paused) audioEl.playbackRate = currentRate;
        });
    }

    function init() {
        injectPlayButtons();
        var blocks = collectBlocks();
        if (blocks.length) {
            updatePreview(shortText(getBlockText(blocks[0])));
            loadManifest();
        } else {
            manifestReady = false;
        }
    }

    /* Late hook: expose the audio API so init scripts can trigger playback. */
    window.__lessonAudioAPI = {
        playAll: function () {
            playAll();
        },
        playBlock: function (i) {
            var blocks = collectBlocks();
            if (blocks.length > 0 && blocks[i - 1]) {
                isPlayingAll = false;
                teardown();
                setMainIcon(true);
                playBlock(i - 1);
            }
        },
        get audio() { return audioEl; },
        get activeBlock() { return currentBlockIndex; }
    };

    init();
})();
