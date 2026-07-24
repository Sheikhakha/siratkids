# SiratKids - Islamic Learning Platform

## Project Overview
Static HTML/CSS/JavaScript website for children's Islamic education. Bilingual (English/Arabic) with RTL support.

## Architecture
- `index.html` - Homepage with track selection
- `lessons/` - 13 Tawheed lesson pages (tawheed-1-1.html to tawheed-3-4.html)
- `hadith.html` - Hadith collection (9 hadith)
- `manners.html` - Islamic eating manners (5 items)
- `css/style.css` - Single stylesheet (996 lines)
- `js/main.js` - Vanilla JavaScript (210 lines)
- `generate_lessons.py` - Static site generator

## Tech Stack
- HTML5, CSS3, Vanilla JavaScript
- Google Fonts: Nunito, Noto Naskh Arabic, Noto Sans Tamil
- Local font: Indopak Nastaleeq
- No build tools, no frameworks

## Code Style
- Semantic HTML5 elements
- CSS custom properties for theming
- Vanilla JS (no jQuery, no frameworks)
- Bilingual parallel content (English + Arabic)

## Do / Don't
- DO: Use `dir="rtl"` on Arabic text elements
- DO: Maintain bilingual content structure
- DO: Use localStorage for user preferences
- DON'T: Add frameworks or build tools
- DON'T: Modify the Python generator without understanding template sync issues

## Testing
- Manual testing only (no test framework)
- Check RTL/LTR rendering
- Verify font switching works
- Test localStorage persistence

## Known Issues
- Chinese characters in `generate_lessons.py` line 5
- English font size localStorage key mismatch
- Generator template out of sync with actual files
