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
- `js/main.js` - Vanilla JavaScript (~1277 lines; lines 1-900 core site code, lines 901+ audio player IIFE)
- `js/audio-manifests.js` - Generated per-page MP3 manifest (`window.__AUDIO_MANIFESTS` keyed by page basename)
- `audio/lessons/<key>/block-<N>.mp3` - Pre-rendered per-block Arabic MP3 audio (generated)
- `js/quran-full-index.json` - Full Quran search index (6236 verses)
- `js/quran-search-index.json` - Lightweight chapter metadata index
- `js/quran_source/*.js` + `js/quran_source/segments/{sudais,shuraim,afasy,dussary}.js` + `js/tafsir/*.js` - Reader data (Quran text, translations, WBW, per-reciter word/verse segment bundles, per-surah tafsir) shipped as wrapped `.js` scripts (`window.__QURAN_DATA[<basename>] = {...}`) loaded via `<script>` tags so double-clicked `file://` pages work. Do NOT convert back to plain `.json` — `fetch()` of local JSON is blocked on `file://`. Segment bundles are keyed `segments-{name}` and drive word-synced playback highlighting (Sudais = per-verse audio; Shuraim/Al-Afasy/Yasser Al-Dosari = whole-surah audio). Reader enrichment bundles (built by `scripts/build_qul_resources.py` from `data/qul/` exports, then loaded via script tags for `file://` support): `surah-info-en`, `surah-info-ta`, `ayah-themes`, `mutashabihat` (from `Mutashabihat ul Quran.json` + `indopak-nastaleeq.json`), and `similar-ayah` (from `matching-ayah.json`).
- `scripts/validate_content.py` - Content preservation validation suite
- `scripts/inject_audio_player.py` - Batch audio player injector
- `scripts/build_full_index.py` - Quran index builder from quran.com API v4
- `scripts/build_lesson_audio.py` - Pre-renders per-block Arabic MP3 audio (`tts_arabic` -> ffmpeg) and regenerates `js/audio-manifests.js`

## Tech Stack
- HTML5, CSS3, Vanilla JavaScript
- Google Fonts: Nunito, Noto Naskh Arabic, Amiri, Scheherazade New, Lateef
- Local font: Indopak Nastaleeq
- Audio: pre-rendered per-block MP3 (offline) with Web Speech API fallback
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
- **Golden snapshot** (SHA-256 manifest of all 66 hub/lesson files in `scripts/lesson_snapshots.json` — flags ANY unintended content drift; re-baseline with `--snapshot` only after intentional changes)
- **Arabic text preservation** (Quran verses, hadith, adhkar, tawheed content)
- **Lesson Arabic presence** (every lesson has `.ar[dir="rtl"]` blocks and `lesson-block` elements)
- **English/Tamil/Transliteration preservation** across all lessons
- **Navigation integrity** (prev/next chains, sidebar links, breadcrumbs, track cards)
- **Audio widget structure** (every hub/lesson `lesson-aside` contains full audio player: play button, status, text preview, speed selector)
- **Translation toggle bars** (every lesson has exactly `translation`/`tamil`/`transliteration` toggle buttons)
- **Quran popup modals** (4 popups with dual translations + Ibn Kathir tafsir)
- **Audio player widgets** (Web Speech API, speed controls, voice selector)
- **CSS selector coverage** (all critical layout/content/UI selectors)
- **JS feature coverage** (all critical functions, localStorage keys, event handlers)
- **Structural integrity** (navbar, sidebar, main, aside, footer on all pages)
- **Image references** (all src attributes resolve to existing files)
- **External resources** (Google Fonts, font references)

Options: `--verbose` for failed check details, `--json report.json` for machine-readable output.
`--snapshot` re-generates the golden manifest (run only after intentional, verified hub/lesson edits).

## Key Content Elements
- **4 Quran Popups**: popup-2152 (2:152), popup-3962 (39:62), popup-5156 (51:56), popup-319 (3:19)
- **Featured Verse**: Surah At-Tahrim 66:6 on homepage
- **Audio System**: per-block pre-rendered MP3 playback (from `js/audio-manifests.js`) with proportional word highlighting, speed control (0.5x-2x); falls back to Web Speech API, then "Audio not supported." Per-sentence `.lp-play-btn` buttons are injected under each block; the player IIFE lives in `js/main.js` lines 901+ and exposes `window.__lessonAudioAPI` (`playAll`, `playBlock(i)`, `audio` getter). MP3 highlighting is driven by `requestAnimationFrame` over `currentTime/duration` (timeupdate alone is unreliable in some engines). The lesson player has no voice selector — it plays the pre-rendered speaker-1 MP3s and `pickArabicVoice()` (internal TTS fallback) just prefers the first Arabic voice (`audio-voice-name` is used only by the Quran Reader's reciter dropdown).
- **Quran Reader** (`quran-reader.html`): Surah info modal (English + Tamil, aligned via `dir="auto"`); Similar Ayat (QUL word-overlap matches, matched words highlighted); Mutashabihat (shared repeated phrases); per-ayah **Theme** button next to Tafsir (`theme:` inline lookup across the verse's theme group). See `/docs/data-model` for the QUL `mutashabihat` (`phrases.json`/`phrase_verses.json`) and `similar-ayah` schemas.
- **localStorage keys**: arabic-font, toggle-translation, toggle-tamil, toggle-transliteration, ar-font-scale, en-font-scale, audio-speed, audio-voice-name

## Audio Build (offline per-block MP3)
The lesson audio player (`js/main.js` lines 901+) plays pre-rendered MP3s listed in `js/audio-manifests.js`, keyed by page basename with page-relative paths (`../audio/...` for top-level lessons, `../../audio/...` for `lessons/<track>/`). Each entry is one `.lesson-block .ar` block in document order.

- Build: `python scripts/build_lesson_audio.py` (dry-run `--dry-run`, per-track `--track`, single-lesson `--only <page-key>`, `--resume`). Requires Python 3.12 venv with `tts_arabic` (ONNX FastPitch + HiFi-GAN, Halabi corpus) + ffmpeg. Output: `audio/lessons/<page-key>/block-<N>.mp3`, `audio/lessons/_build_report.json`, and regenerates `js/audio-manifests.js`.
- IMPORTANT: `tts_arabic` is CPU-only; batch build of all 58 lessons takes ~2 min.
- Text cleaning applied at build time: ﷺ (U+FDFA) -> `صلى الله عليه وسلم`, strip ﴿ ﴾ [ ] ( ) quotes, Arabic-Indic digits -> ASCII, collapse whitespace. Clean text is stored in `_build_report.json` — edit lessons then REBUILD, never hand-edit the MP3s.
- Spoken word-highlighting is proportional (bit-space = 1 + word char length); MP3 progress maps `currentTime/duration` onto that space. Keep `audio/lessons/**` and `js/audio-manifests.js` committed (offline requirement).
- Old `pickArabicVoice` ReferenceError (broken player site-wide) is fixed by the new IIFE — do not reintroduce `speechSynthesis` as the primary path.

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
