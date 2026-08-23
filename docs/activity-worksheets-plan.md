# SiratKids — Interactive Worksheets & Activity Engine Plan
_Last updated: 2026-08-23 (rev 2) · Status: APPROVED · Dark-toggle task ON HOLD_

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
Turn passive lesson reading into book-style interactivity ("نشاط") for Stages 0–1,
via per-unit Worksheet pages with kid-proof activities, bilingual prompts,
instant feedback, and an always-on on-screen assistant.

## 2. Locked Decisions
| Decision | Choice |
|---|---|
| Page architecture | Approach A: single engine `worksheet.html` + per-unit hash URLs (`worksheet.html#w=s1-tawheed-2`) |
| Pilot scope | Stage 0 + Stage 1 = 17 unit worksheets; Stage 2+ stays pipelined |
| Activity types (round 1) | `match` (Name↔daleel) + `fill` (word-bank blanks) |
| Interaction | Tap-tap pairing; fill gets POINTER-EVENTS drag & drop (mouse+touch+pen) with tap fallback |
| Feedback | Instant per-item (green lock / red shake) + stars at end |
| On-screen assistant | State-driven guide bubble above every activity (EN+AR, aria-live) |
| Placement of CTAs | Injected by JS into hub `.unit-card-foot` + above lesson `.lesson-nav` — zero snapshotted HTML edited |
| Storage | IndexedDB behind `skStore` adapter (`get/set` promises, DB `siratkids`, store `kv`) + automatic localStorage fallback |
| Dev/test environment | VS Code Live Server (http://localhost). file:// support RETIRED. Production: GitHub Pages |
| Quran text policy | All proof verses fetched canonically via quran tools (never memory) |

## 3. Files Touched / Created
| File | Change |
|---|---|
| `js/worksheets-data.js` | NEW · `window.__SK_WORKSHEETS[key]` bundle (17 units, wrapped-script pattern) |
| `worksheet.html` | NEW · shell: navbar/footer/dark-bootstrap copied from hub pattern; bare hash → picker grid |
| `js/worksheet.js` | NEW · ~500 lines vanilla: renderers `match`,`fill`; drag layer; guide-bubble FSM; stars/retry; skStore |
| `js/main.js` | ADDITIVE IIFE only: CTA injection (basename→worksheet-key map incl. fiqh off-by-one `s1-fiqh-0-x`) |
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

## 8. Entry Points (JS-injected)
1. Hub unit cards (9 hubs): `<button class="ws-cta" data-worksheet-key>` inside
   `.unit-card-foot`; JS stopPropagation→navigate (no nested anchors).
2. Every S0/S1 lesson page: `Practice this unit ✏️ تدرّب على الوحدة` before `.lesson-nav`.
3. Bare `worksheet.html`: picker grid of all 17 sheets.

## 9. Validation Workflow
After each build step run `python scripts/validate_content.py`;
single intentional `--snapshot` re-baseline once new files verified.
Arabic/verse text only from canonically fetched sources.

## 10. Master Backlog
| # | Item | Status |
|---|---|---|
| 0 | Dark/light toggle emoji + motion (spec §0) | ✅ done 2026-08-23 |
| 1 | Activity worksheets (this doc) | ▶ approved — start next session |
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
2. `js/worksheets-data.js` (Stage 1 tawheed U2 first; canonical fetches)
3. `js/worksheet.js`: skStore adapter → match renderer + guide FSM → fill renderer + DnD
4. `worksheet.html` shell + picker grid
5. CSS `.ws-*` additions → main.js CTA injection
6. Remaining 16 units' data → validate → snapshot re-baseline
7. Manual matrix: Live Server, mobile touch, keyboard, dark mode, RTL
8. ~~Task #0 toggle motion~~ ✔ done 2026-08-23 (owner released hold)
