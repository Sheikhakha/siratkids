# Session Resume — 2026-09-07 (commit `a24a226`)

## Status (updated after Phase 2 commit `fdffbd8`)
- **Phase 2 shipped:** worksheet engine now renders `match`/`fill`/`quiz`/`disc`/`color`/`name`;
  25 data keys authored (s0 ×6, s1 ×10, s2 ×9) — all ayah proof text verified verbatim against
  quran.com `ar-simple-clean` (refs 2:21, 2:255, 7:54, 7:158, 10:56, 13:28, 39:62, 39:66,
  51:56, 51:58, 95:4). `s1-tawheed-2` pilot (from `3e47985`) re-inserted after being
  overwritten during initial bulk authoring.
- **Phase 3 done:** save-on-Practiced ✓ persisted via skStore + confirmation in engine; CTA
  entries now inject a **lesson-aside practice card** (replaces the lesson-wise pill) and hub
  CTAs show a green **✓ practiced** badge when `sk-worksheet-<key>` has `done:true`.
- **Hold:** Stage 5/6 worksheet DATA is paused (owner decision) — their lesson pages don't
  exist yet and OCR is jumbled; do not author s5p1/s5p2/s6p1/s6p2 keys until lesson HTML is available.

## Where we are
Executing the **PDF-audit-first** worksheet plan (rev 5 in `docs/activity-worksheets-plan.md`).
All 9 PDFs OCR'd (11 book entries: `s5p1/s5p2/s6p1/s6p2` added as 4 separate books, NO merging).
Unit-level activity audit delivered in `docs/pdf-activity-audit.md`.

## Result of the audit (now in repo)
- **Every unit of every book contains an activity** (أسئلة/نشاط/أكمل فراغات/تلوين) — no unit is worksheet-less.
- Stage 0 (pre): HAS نشاط (coloring p18 "ألون مخلوقات الله", naming p19, مراجعة+نشاط p23 "اذكر نعم الله",
  Q&A نشاط p26 "لماذا خلقنا الله") → owner decided **static printable pages**.
- `qa` (QA_Level1.pdf): UNVERIFIABLE — source PDF missing from `data/pdfs/official/` (dir empty).

## Locked owner decisions
1. Audit scope = all 9 PDFs; auto-audit with owner verification; I recommended + user OK'd proceed.
2. Stage 0 = static printable activity pages (not interactive engine).
3. Stages 5 & 6 = TWO books each (`s5p1/s5p2/s6p1/s6p2`); site gets TWO parts per stage.
4. Site structure: hub `stage-5.html`/`stage-6.html` (Ages 10-11 / 11-12) → Part 1/Part 2 cards
   → `stage-5-part1.html` / `stage-5-part2.html` / `stage-6-part1.html` / `stage-6-part2.html`.
5. **Subject tiles on part pages → SCAFFOLD subject pages** (user answered the question):
   `stage-5-part1-tawheed.html`, `stage-5-part1-fiqh.html`, `stage-5-part2-seerah.html`,
   `stage-6-part1-tawheed.html`, `stage-6-part1-fiqh.html`, `stage-6-part2-adab.html`
   → each with audit-derived unit cards + disabled "Coming soon" worksheet CTAs (gating B).

## Next steps (in order)
### Phase 2 — Site structure (start here)
1. Create `stage-5.html`/`stage-6.html` hubs (copy `stage-3.html`/`stage-4.html` skeleton — hero + breadcrumb,
   empty-tile pattern; but with TWO part cards instead). CSS: `.part-card` styles needed in `css/style.css`.
2. Create 4 part landing pages with subject tiles per audit (s5p1 → tawheed+fiqh; s5p2 → seerah;
   s6p1 → tawheed+fiqh; s6p2 → adab). Reuse `stage-2.html` tile markup pattern
   (`generate_curriculum.py` lines 399-451 for reference).
3. Create 6 scaffold subject pages (unit-card grids + `.unit-card-cta` bars, disabled CTAs,
   keys `s5p1-tawheed-{u}` style — see key derivation rules).
4. Homepage `index.html`: add Stage 5 & 6 to journey timeline (nodes `journey-node-5/6` + CSS in
   `style.css` ~4545), stage `<select>` (~213-220), nav stage dropdown (~25-35).
5. Re-baseline snapshot ONCE: `python scripts/validate_content.py --snapshot` — then `validate_content.py`.

### Phase 3 — Engine + entry points
6. Add `quiz` renderer (multiple-choice AR question → tap answer) + variable activity sets in `js/worksheet.js`.
7. Entry points: lesson-aside practice card (replaces lesson-wise pill) + keep hub CTAs + ✓ practiced badge
   (`js/main.js` CTA IIFE + `css/style.css`).
8. Save-on-Practiced-✓ verified + saved confirmation (`js/worksheet.js`, skStore).

### Phase 4 — Authoring
10. Author `js/worksheets-data.js` for units with أسئلة → `quiz`; نشاط/أكمل → `fill`/`match`;
    verses canonically verified (quran MCP, never memory).
11. Full validation: `python scripts/validate_content.py`, `node --check`, manual pass incl. stages 5/6.

## Open items for owner
- `qa` book: re-add `QA_Level1.pdf` to `data/pdfs/official/` to audit, or drop it.
- Stage-0 printable count confirmation (recommended 3).
- s5p2/s6p2 subject naming: s5p2 → seerah, s6p2 → adab (used in scaffold list above).

## Useful references
- Audit matrix: `docs/pdf-activity-audit.md` (unit ranges, activity types per unit).
- Plan: `docs/activity-worksheets-plan.md` (rev 5, schema, gating, engine specs).
- CTA injection: `js/main.js` lines 1745-1899.
- Worksheet engine: `js/worksheet.js` (renders `match`/`fill`; `route()` at 657; add `quiz`).
- Validator: `scripts/validate_content.py` → real suite `validate_arabic_content.py` (snapshot 1604 files).
- OCR: `scripts/extract_curriculum_text.py` (+`--merge-only`), `scripts/audit_pdfs.py` (+`--docs`).
- PS quirk: PowerShell `Get-Content` mangles UTF-8 Arabic — use the Read tool, never Get-Content for Arabic.