# SiratKids - Islamic Learning Platform

## Project Overview
Static HTML/CSS/JavaScript website for children's Islamic education. Bilingual (English/Arabic) with RTL support.

## Architecture
- `index.html` - Homepage with 5 track cards + featured verse (66:6)
- `hadith.html` - Hadith collection hub (26 hadith)
- `manners.html` - Islamic eating manners hub (5 items)
- `adhkar.html` - Adhkar & supplications hub (11 items)
- `seerah.html` - Seerah of Prophet (3 lessons)
- `lessons/tawheed-{unit}-{lesson}.html` - 13 Tawheed lessons (Unit 1: 5, Unit 2: 4, Unit 3: 4)
- `lessons/tawheed/unit{1-3}.html` - Tawheed unit landing pages
- `lessons/hadith/hadith-{1-26}.html` - 26 individual hadith lessons
- `lessons/manners/manner-{1-5}.html` - 5 eating manners lessons
- `lessons/adhkar/adhkar-{1-11}.html` - 11 adhkar/supplication lessons
- `lessons/seerah/seerah-{1-3}.html` - 3 seerah lessons
- `css/style.css` - Single stylesheet (~1920 lines)
- `js/main.js` - Vanilla JavaScript (~1043 lines)
- `js/quran-full-index.json` - Full Quran search index (6236 verses)
- `js/quran-search-index.json` - Lightweight chapter metadata index
- `scripts/validate_content.py` - Content preservation validation suite
- `scripts/inject_audio_player.py` - Batch audio player injector
- `scripts/build_full_index.py` - Quran index builder from quran.com API v4

## Tech Stack
- HTML5, CSS3, Vanilla JavaScript
- Google Fonts: Nunito, Noto Naskh Arabic, Amiri, Scheherazade New, Lateef
- Local font: Indopak Nastaleeq
- Web Speech API (speechSynthesis) for audio TTS (no audio files)
- No build tools, no frameworks

## Code Style
- Semantic HTML5 elements
- CSS custom properties for theming
- Vanilla JS (no jQuery, no frameworks)
- Bilingual parallel content (English + Arabic + Tamil + Transliteration)

## Do / Don't
- DO: Use `dir="rtl"` on all Arabic text elements
- DO: Maintain bilingual (multilingual) content structure
- DO: Use localStorage for user preferences
- DO: Run `python scripts/validate_content.py` after ANY front-end change
- DON'T: Add frameworks or build tools
- DON'T: Modify the Python generator without understanding template sync issues
- DON'T: Change Arabic text, translations, or Quran references without content review
- DON'T: Remove or rename navigation links, sidebar items, or breadcrumbs
- DON'T: Modify popup modal content (Quran translations, tafsir text)

## Content Preservation (CRITICAL)
**Before merging ANY front-end change, run the validation suite:**
```
python scripts/validate_content.py
```
This runs ~2900+ automated checks covering:
- **File existence** (66 HTML files, all images, CSS, JS)
- **Arabic text preservation** (Quran verses, hadith, adhkar, tawheed content)
- **English/Tamil/Transliteration preservation** across all lessons
- **Navigation integrity** (prev/next chains, sidebar links, breadcrumbs, track cards)
- **Quran popup modals** (4 popups with dual translations + Ibn Kathir tafsir)
- **Audio player widgets** (Web Speech API, speed controls, voice selector)
- **CSS selector coverage** (all critical layout/content/UI selectors)
- **JS feature coverage** (all critical functions, localStorage keys, event handlers)
- **Structural integrity** (navbar, sidebar, main, aside, footer on all pages)
- **Image references** (all src attributes resolve to existing files)
- **External resources** (Google Fonts, font references)

Options: `--verbose` for failed check details, `--json report.json` for machine-readable output.

## Key Content Elements
- **4 Quran Popups**: popup-2152 (2:152), popup-3962 (39:62), popup-5156 (51:56), popup-319 (3:19)
- **Featured Verse**: Surah At-Tahrim 66:6 on homepage
- **Audio System**: Web Speech API with word highlighting, speed control (0.5x-2x), voice selection
- **localStorage keys**: arabic-font, toggle-translation, toggle-tamil, toggle-transliteration, ar-font-scale, en-font-scale, audio-speed, audio-voice-name, sidebar-collapsed

## Testing
- Run `python scripts/validate_content.py` for automated content validation
- Manual testing: RTL/LTR rendering, font switching, localStorage persistence
- Check Quran search functionality on all lesson pages
- Verify audio player word highlighting works across different Arabic texts

## Known Issues
- Chinese characters in `generate_lessons.py` line 5
- English font size localStorage key mismatch
- Generator template out of sync with actual files
- Hadith 10-26 use default-placeholder.jpg instead of custom SVGs
