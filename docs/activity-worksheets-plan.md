# SiratKids — Interactive Worksheets & Activity Engine Plan
_Last updated: 2026-09-06 (rev 4) · Status: engine live (worksheet.html) + CTA injection SHIPPED for ALL stages, headless-matrix verified, validator-green. Only `s1-tawheed-2` authored; remaining 27 keys → "Coming soon". Next: author remaining units, manual Live Server matrix, commit._

## 0. Dark/Light Toggle Polish — ✅ DONE 2026-08-23
_Was ON HOLD pending a parallel session; owner released it._
**Spec (final):**
- Replace legacy moon/sun SVG look with emoji style from worksheet-preview.html:
  `🌙` in light mode, `☀️` in dark mode.
- Click motion (every toggle):
  - outgoing icon: fade + scale-down (~250ms)
  - incoming `☀️`: full rotation entrance (rotate ~360°→0) with spring scale pop
  - incoming `🌙`: crescent swing-in — tilt rock (±25°) + bounce settle
- CSS-only strategy: keep `.dm-toggle` button + existing SVG children untouched in DOM;
  hide SVGs, render emoji via `.dm-toggle::before`, swap content on
  `html[data-theme="dark"]`, drive motion with transitions/keyframes in `css/style.css`.
- Same class name + same `dark-mode` localStorage key → site-wide effect,
  zero HTML churn, validation-safe. Run `python scripts/validate_content.py` after.

## 1. Goal
Turn passive lesson reading into book-style interactivity ("نشاط") across ALL
stages (0–2+), via per-unit Worksheet pages with kid-proof activities, bilingual prompts,
instant feedback, and an always-on on-screen assistant.

## 2. Locked Decisions
| Decision | Choice |
|---|---|
| Page architecture | Approach A: single engine `worksheet.html` + per-unit hash URLs (`worksheet.html#w=s1-tawheed-2`) |
| Scope | ALL stages/units/lessons; worksheet target map = 28 keys (stage0 7: tawheed3/adhkar1/hadith1/seerah1/manners1 · stage1 11: tawheed5/fiqh4/adhkar2 · stage2 10: tawheed5/fiqh3/adhkar1/adab1) |
| Gating | B: every CTA renders everywhere; authored → active "Practice", unauthored → `disabled` "Coming soon" (`data-worksheet-key`, `aria-disabled`) |
| Activity types (round 1) | `match` (Name↔daleel) + `fill` (word-bank blanks) |
| Interaction | Tap-tap pairing; fill gets POINTER-EVENTS drag & drop (mouse+touch+pen) with tap fallback |
| Feedback | Instant per-item (green lock / red shake) + stars at end |
| On-screen assistant | State-driven guide bubble above every activity (EN+AR, aria-live) |
| Placement of CTAs | JS-injected: hub `.unit-card-cta` bar (dedicated, below `.unit-card-foot`) + above `.lesson-nav`/`.lesson-back-row` on lesson & unit-landing pages; root item hubs (hadith/adhkar/seerah/manners) EXCLUDED — zero snapshotted HTML edited |
| Key derivation | `s{stage}-{subj}-{unit}`; fiqh off-by-one (`s1-fiqh-0-x`→u1); single-unit subjects `{adab,adhkar,hadith,seerah,manners}` flatten to u1; stage-0 `tawheed-{u}-{l}`/`unit{n}`→{0,tawheed,u}; flat `adhkar|hadith|seerah|manner-{n}`→u1 (manner→manners) |
| Storage | IndexedDB behind `skStore` adapter (`get/set` promises, DB `siratkids`, store `kv`) + automatic localStorage fallback |
| Dev/test environment | Live Server / `file://` both supported (CTA IIFE derives paths from its own `<script src>`; hub/lesson pages load `worksheets-data.js` dynamically) |
| Quran text policy | All proof verses fetched canonically via quran tools (never memory) |

## 3. Files Touched / Created
| File | Change |
|---|---|
| `js/worksheets-data.js` | NEW · `window.__SK_WORKSHEETS[key]` bundle (28-key target map; pilot `s1-tawheed-2` authored, rest pending, wrapped-script pattern) |
| `worksheet.html` | NEW · shell: navbar/footer/dark-bootstrap copied from hub pattern; bare hash → picker grid |
| `js/worksheet.js` | NEW · ~500 lines vanilla: renderers `match`,`fill`; drag layer; guide-bubble FSM; stars/retry; skStore |
| `js/main.js` | ADDITIVE IIFE only: all-stage basename→worksheet-key derivation (incl. fiqh off-by-one, single-unit flatten), render-always CTA injection into hub `.unit-card-cta` bars + lesson/landing pills, dynamic `worksheets-data.js` load, `file://`-safe prefixing |
| `css/style.css` | ADDITIVE `.ws-*` namespace (tokens, light/dark, RTL, ≥44px targets, focus rings, print-hide bank) |
| `scripts/lesson_snapshots.json` | re-baseline ONCE after new files verified (`--snapshot`) |

## 4. Data Schema
```js
__SK_WORKSHEETS["s1-tawheed-2"] = {
  title:{en:"Rububiyyah", ar:"الربوبية"},
  hue:2,
  match:[ {pair:"khaliq",
           name:{ar:"الْخَالِقُ", en:"Al-Khaliq"},
           proof:{ref:"39:62", ar:"وَاللَّهُ خَالِقُ كُلِّ شَيْءٍ"}} , ... ],
  fill:[ {before:"اللهُ ", answer:"كُلِّ", after:" شَيْءٍ",
          en:"Allah is the Creator of everything."} , ... ],
  bank:["كُلِّ","الرَّزَّاقُ","يُحْيِي", /*+distractors*/]
}
```
Pilot seed (verified refs from lessons): Al-Khaliq↔39:62 · Ar-Razzaq↔11:6 & 51:58 ·
Al-Mudabbir↔7:54 · يُحيي ويُميت↔10:56 · Creator-of-man↔95:4.

## 5. Guide-Bubble Assistant (state machine, per activity)
| State | Bubble text |
|---|---|
| match idle | 👆 Tap a Name! اضغط على اسم |
| name selected | 🔍 Now find its proof! ابحث عن دليله |
| wrong pair | 🤔 Try again! حاول مرة أخرى |
| match complete | 🎉 MashaAllah! ما شاء الله |
| fill chip lifted | ✋ Drag to a blank! اسحبها إلى الفراغ |
| hovering blank | ⬇️ Drop here! أفلتها هنا |
| blank wrong | 🤔 Not this one! ليست هذه |
Bubble = bilingual, `role=status aria-live=polite`; selected card pulses;
correct pop-scale; dots animate. Voice prompts = fast-follow (#13).

## 6. Drag & Drop Spec (fill)
- pointerdown lift (scale+shadow) → pointermove follow → pointerup hit-test blank → check;
  hovered blank glows (`--primary`). Native HTML5 DnD NOT used (breaks touch).
- Tap fallback identical logic; keyboard: chips/blanks are buttons (Enter).

## 7. Result Panel
Stars: 0 mistakes ★★★ · ≤3 ★★ · else ★. Retry resets+reshuffles.
`Practiced ✓` → `skStore.set("sk-worksheet-"+key,{done,stars,mistakes,date})`
(consumed later by progress tracker #2).

## 8. Entry Points (JS-injected, all stages)
1. Unit hub cards (`stage-{0,1,2}-*.html`): dedicated `.unit-card-cta` bar appended to
   each `.unit-card` below `.unit-card-foot`; `<button class="ws-cta" data-worksheet-key>`;
   JS stopPropagation→navigate (no nested anchors). Root item hubs (hadith.html / adhkar.html /
   seerah.html / manners.html) excluded by decision.
2. Every lesson page (ALL stages, incl. `lessons/x/` dirs) + unit landing pages
   (`lessons/tawheed/unit{1-3}.html`): `Practice this unit ✏️ تدرّب على الوحدة` pill above
   `.lesson-nav` (fallback `.lesson-back-row`).
3. Bare `worksheet.html`: picker grid of all authored sheets (currently `s1-tawheed-2`).
Unauthored keys render `disabled` "Coming soon 🔜 قريباً" everywhere (gating B).

## 9. Validation Workflow
After each build step run `python scripts/validate_content.py`;
single intentional `--snapshot` re-baseline once new files verified.
Arabic/verse text only from canonically fetched sources.

## 10. Master Backlog
| # | Item | Status |
|---|---|---|
| 0 | Dark/light toggle emoji + motion (spec §0) | ✅ done 2026-08-23 |
| 1 | Activity worksheets (this doc) | ▶ engine + CTA injection done 2026-09-06 — author remaining 27 units |
| 2 | Progress tracker UI + Parent-corner export/import | queued (reads #1 keys) |
| 3 | Bilingual translation readout (Web Speech EN/TA) | parked |
| 4 | Takhreej expansion (hub badges + adhkar/manners/seerah sourcing) | parked |
| 5 | Seerah interactive timeline (`.journey` zigzag reuse) | parked |
| 6 | Printables / PDF worksheets | parked by owner |
| 7 | Stage 3 curriculum launch (Thalathat al-Usul adapted) | deferred |
| 8 | Tamil theological-term precision review | deferred (needs reviewer) |
| 9 | AGENTS.md revision: retire file://, Live Server flow, stale counts | batch anytime |
| 11 | PWA / service worker (offline + installable) | new |
| 12 | Worksheets fast-follows: verse audio, mic read-after-me, more units | queued |
| 13 | Voice prompts for guide bubbles (TTS) | queued |

## 11. Kickoff Order (next session)
1. ~~Write this MD to `docs/activity-worksheets-plan.md`~~ ✔ done 2026-08-23
2. ~~`js/worksheets-data.js`~~ ✔ pilot `s1-tawheed-2` authored + syntax/consistency checked (2026-08-23) — remaining 16 units after engine preview
3. ~~`js/worksheet.js`~~ ✔ engine built + `node --check` clean (2026-08-23): skStore(IDB+LS mirror), match FSM, fill tap+pointer-drag, guide bubbles, stars/retry/practiced
4. ~~`worksheet.html` shell + picker grid~~ ✔ built 2026-08-23 (hub skeleton verbatim + `#ws-root` mount)
5. ~~CSS `.ws-*` additions~~ ✔ appended 2026-08-23 + CTA styles (`.ws-cta`, `.ws-cta.is-pending`, `.lesson-practice-cta`, `.unit-card-cta`) 2026-09-06
6. CTA injection (main.js IIFE) ✔ shipped + headless-matrix verified all stages 2026-09-06 — remaining 27 units' data → validate → snapshot re-baseline
7. Manual matrix: Live Server, mobile touch, keyboard, dark mode, RTL
8. ~~Task #0 toggle motion~~ ✔ done 2026-08-23 (owner released hold)
