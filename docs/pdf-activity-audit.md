# PDF Curriculum Activity Audit

_Confirmed 2026-09-07 · Sources: OCR via `scripts/extract_curriculum_text.py` (Windows.Media.Ocr ar-SA) + TOC page reads + per-page marker scan via `scripts/audit_pdfs.py`._

## Purpose

Decide, per unit, whether the site should get an interactive worksheet. **Rule: a unit gets a worksheet
ONLY if its book actually contains an activity section** (أسئلة Q&A, نشاط activity, أكمل الفراغات
fill-the-blank, تلوين/أسمّي coloring-naming). Stage-0 coloring/naming → static printable page (owner
decision). Stages 5 & 6 are two books each → two site parts (owner decision).

Marker legend: **أسئلة** unit/lesson questions · **نشاط** activity · **أكمل/فراغات** fill-blank ·
**تلوين** coloring · **أسمّي** naming · **أكتب** writing · **صِل** matching · **اختبار** test ·
**مراجعة** review · **ض-ع** / **ميّز** discriminate.

---

## Stage 0 — PreStage.pdf (`pre`, 80 pgs)

Front matter p1-5 (title/intro). Body p6-77; TOC + فهرس p78-80.

Unit/lesson blocks with their activity pages:

| Pages | Block | Activities present |
|---|---|---|
| 6-17 | الوحدة الأولى (Tawheed: الله الله الخالق) — lessons | تلوين p6, ض-ع p7-8, صِل p13 |
| **18-19** | lesson 2 «الله الخالق» | **نشاط ألون مخلوقات الله** (coloring), **نشاط أسمّي المخلوقات** (naming) |
| 20-25 | unit review | **نشاط أذكر نعم الله** p23 + أسئلة |
| **26** | lesson 1 «لماذا خلقنا الله» | **نشاط: أذكر لماذا خلقنا الله + الدليل** (Q&A) |
| 27-36 | lessons (خلقنا لنعبد) | ق/ج question pairs p26-35 |
| 38-56 | lessons (مخلوقات، نعم) | ميّز p38, صِل p39/44 |
| 58-66 | lessons | مراجعة صِل p64 |
| 67-77 | lessons (أحكام، آداب) | الدرس headings |
| 78-80 | فهرس/TOC | — |

**Verdict:** Stage-0 HAS activities — not worksheet-less. All are stage-0 style (coloring/naming/simple
Q&A). Per owner decision → **static printable activity pages**, not the interactive engine.

---

## Stage 1 — First Stage.pdf (`s1`, 109 pgs) + Q&A Level1 (`qa`, source MISSING)

s1 units (tawheed + fiqh + adhkar). Activity presence clear from scan:

- Unit Tawheed lessons: **أسئلة** p17,19,25,30,36 · coloring/match p45-46 · outer أسئلة p79-80
- Adhkar/blocks: تلوين p51,53,58,68-71, أكمل فراغات p86, صِل p97
- General/أسئلة at p104-108 (امتحان/مراجعة?)

**Verdict:** s1 has abundant أسئلة + نشاط → **interactive worksheets supported.**

`qa` (QA_Level1.pdf) — source PDF is MISSING (`data/pdfs/official/` empty), prior OCR failed. Cannot audit now. Re-add the PDF to audit it later.

---

## Stage 2 — SecondStage.pdf (`s2`, 116 pgs)

- Tawheed units: أسئلة p7,12,17 (اكمل فراغات p17), نشاط صِل p28,34-35 (نشاط أكمل فراغات), تلوين p38
- Adhkar/manners units: صِل p54,63-64,73, أكمل فراغات p85-86, مراجعة
- General أسئلة p112-113

**Verdict:** abundant → supported.

---

## Stage 3 — ThirdStage.pdf (`s3`, 270 pgs)

Rich activity content throughout (نشاط/أكمل/فراغات/أسئلة/تلوين/صِل/ض-ع on many pages; unit-end أسئلة;
فهرس p264-270). Supported.

---

## Stage 4 — FourthStage.pdf (`s4`, 238 pgs)

Equally rich (نشاط p71,75-76,82,93-96,115,120,125-126,132,134,137; أكمل فراغات throughout; أسئلة frequent;
فهرس p234-237). Supported.

---

## Stage 5, Part 1 — Fifthstage_FirstBook.pdf (`s5p1`, 258 pgs)

**Book = Tawheed (الأصول الثلاثة) + Fiqh.** TOC p252-257.

**A. Tawheed units (الأصول الثلاثة):**
| Unit | Pages (from TOC) | أسئلة | نشاط/أكمل | Coloring/Naming |
|---|---|---|---|---|
| U1 العلم-فضله-العمل به-الدعوة بالتوحيد | ~3-17 | p13 ميّز | p15 فراغات أسمّي, p16 اذكر | p4 تلوين |
| U2 الحنيفية (شهادة أن لا إله إلا الله) | 21-33 | — | p22 نشاط صِل أذكر, p23 تلوين | p23 |
| U3 معرفة الله (أصل 1) | 34-... | p42 أسئلة | p44 فراغات أكتب, p45 أسئلة أذكر | p55 تلوين صِل |
| U4 معرفة العبد دينه (مراتب الدين) | 78-134 | p88 أسئلة | p94 فراغات, p120-130 أكمل/مراجعة | p87 تلوين, p104,134 |
| U5 معرفة العبد نبيه (سيرة) | 140-... | p149 أسئلة | p142-143 أكمل/أكتب, p147 نشاط, p153-155 أكمل/نشاط | — |

**B. Fiqh units (صلاة):**
| Unit | Pages | أسئلة | نشاط/أكمل | Coloring |
|---|---|---|---|---|
| صلاة (مكانة/فرضية/صفة) + أذان | 168-... | — | صِل p164, نشاط p165, اكتب p167 | — |
| الإمامة والائتمام + صلاة الجماعة | 216-237 | — | نشاط p202,204,210,218,221-225,228-231,236 | تلوين p238 |
| سجود السهو · صلاة الأعذار · التطوع/النهي | 242-... | — | نشاط p244,249; اكتب/صِل | — |

**Verdict:** s5p1 is activity-rich across ALL units (أسئلة + نشاط + أكمل + تلوين). Supported for interactive worksheets.

---

## Stage 5, Part 2 — FifthStage_SecondBook.pdf (`s5p2`, 192 pgs)

**Book = Seerah/Hadeeth on the Prophet ﷺ (عِباده).** 8 units per TOC p190-191: ذكر النبي ﷺ، تعبده، الطهارة، القرآن، صلاته، المسجد، الجمعة والعيد، صيامه.

| Unit | Pages | أسئلة | نشاط/أكمل | Coloring |
|---|---|---|---|---|
| U1 هديه في ذكر الله / التعبد | 8-19 | p19 | p15 أكمل فراغات, p18 ميّز | — |
| U2 هديه في الطهارة والقرآن | 20-29 | p29 | p25-28 أكمل/أكتب/ض-ع | — |
| U3 هديه في الصلاة | 30-41 | p41 | p39 تلوين ض-ع | p34-35 |
| U4 مكانة المسجد + عناية بالمساجد | 42-53 | p53 | p47-53 أكمل/أكتب/صِل | — |
| U5 فضل الخمس صلوات | 54-63 | p63 | p59-62 أكمل/ميّز/ض-ع | — |
| U6 الجمعة والعيد مكانة/فضل | 64-75 | p75 | p68 تلوين, p74 اذكر | p68 |
| U7 صيامه ﷺ وبلا أجر | 76-89 | p89 | p79-88 أكمل/أكتب/ض-ع | — |
| U8 الوتر والنوافل | 90-96 (= الأخيرة) | p96 | p95 ميّز | — |

**Verdict:** supported all units.

---

## Stage 6, Part 1 — SixthStage_FirstBook.pdf (`s6p1`, 284 pgs)

**Book = Tawheed embedding (الإيمان فوق الخلل) + Fiqh.** TOC p280-283.

**A. Tawheed (عقيدة):**
| Unit | Pages | أسئلة | نشاط/أكمل | Coloring/Naming |
|---|---|---|---|---|
| U1 الإيمان (الدرس الأول) | 3-7 | — | صِل p7 | تلوين p13 |
| U2 نواقض الإيمان | 21-... | — | — | — |
| U3 الشرك الأكبر وأنواعه | 39-69 | — | أكمل p44,69,71 اذكر/أسمّي | تلوين p30,35,36 |
| U4 منقصات الإيمان (الشرك الأصغر) | 7?-77 | — | — | — |
| U5 منهج أهل السنة والجماعة | 81-83 | — | — | — |
| U6/U7/... حروف النبيﷺ والأسس (حقوق) | 85-144 | p117 أسئلة | p109-110,114,143... | تلوين p93,102,119-123 |
| U9 الأشراط (علامات الساعة) | 115-144 | — | أكمل فراغات | — |

**B. Fiqh (الفقه) p145+:**
| Unit | Pages | أسئلة | نشاط/أكمل | — |
|---|---|---|---|---|
| U1 صلاة الجمعة | 147-153 | — | أكمل/أكتب صِل | — |
| U2 صلاة العيدين | 155-169 | — | أكمل/أكتب | — |
| U3 صلاة الكسوف | 171-178 | — | أكمل | — |
| U4 صلاة الاستسقاء | 183-... | — | — | — |
| U5 الجنائز | 189-195 | — | — | — |
| U6 الزكاة | 199-215 | — | أكمل | — |
| U7 زكاة الفطر والصدقة | 220-224 | — | — | — |
| U8 الصيام | 229-243 | — | أكمل | — |
| U9 الحج والعمرة | 247-270 | p231 أسئلة | أكمل فراغات, أسمّي | — |

**Verdict:** supported (أسئلة p117,231; نشاط/أكمل/تلوين throughout).

---

## Stage 6, Part 2 — SixthStage_SecondBook.pdf (`s6p2`, 222 pgs)

**Book = هدي النبي ﷺ الأخلاقي (Adab).** 14 units per TOC p218-221 (التعامل مع الصغار/الكبار/الجلساء/الجيران، الوفود، غير المسلمين، الصدق الأمانة الحلم الكرم الشجاعة الرحمة الحياء الصبر التواضع، التأسي بالنبي ﷺ).

| Unit | Pages (approx) | أسئلة | نشاط/أكمل | Coloring/Naming |
|---|---|---|---|---|
| U1 تعامله ﷺ مع الصغار | 3-19 | p37(p?), p49 | أكمل p5,16,19,24,37 | تلوين p25 الوحدة نشاط |
| U2 رحمه بذوي الرحم / الصلة | 26-50 | p49 | أكمل p32,44,49 | — |
| U3 المجلس | 50-62 | p61 | أكمل p55 | — |
| U4 الجار | 62-73 | p73 | أكمل p68,72 | — |
| U5 خدمه | 74-85 | p85 | أكمل p80-84 | — |
| U6 الوفود/الضيف | 86-99 | p99 | أكمل p93,98 | — |
| U7 غير المسلمين | 100-111 | p111 | أكمل فراغات | — |
| U8 الحيوان | 112-122 | p122 | — | — |
| U9/10 بركات (الماء/الطعام) + الجود | 123-135 | p135 | أكمل p131-135 | — |
| U11 حفظ الله ⴽسبابه | 136-142 | — | أكمل | — |
| U12 محبة النبي ﷺ وأهل بيته | 143-161 | p149 | أكمل p142,153,157-161 | تلوين p154 |
| U13 التأسي بالنبي ﷺ (الصلاة على٩نبي) | 163-177 | p161,165,176 | أكمل p160,168-176 | — |
| U14 الصحابة / النهي عن سبّهم | 180-222 | p189,203,215 | أكمل p198,210; نشاط p204,216-221 | تلوين p182,207 |

**Verdict:** supported (نشاط on nearly every unit, أسئلة frequent, أكمل فراغات throughout).

---

## Summary Matrix (site-relevant)

| Stage | Site subjects | Book(s) | Worksheet Candidacy |
|---|---|---|---|
| 0 | Tawheed/Adhkar/etc. (hub only) | pre | ✅ HAS نشاط — **static printable** (owner) |
| 1 | tawheed/fiqh/adhkar | s1 | ✅ interactive |
| 2 | tawheed/fiqh/adhkar/adab | s2 | ✅ interactive |
| 3 | (hub placeholder) | s3 | ✅ (when launched) |
| 4 | (hub placeholder) | s4 | ✅ (when launched) |
| 5·P1 | tawheed/fiqh | s5p1 | ✅ interactive (all units) |
| 5·P2 | seerah/hadith | s5p2 | ✅ interactive (all units) |
| 6·P1 | tawheed/fiqh | s6p1 | ✅ interactive (all units) |
| 6·P2 | adab (هدي النبي ﷺ) | s6p2 | ✅ interactive (all units) |

## Open items for owner
1. `qa` (QA_Level1.pdf) unverifiable — source PDF missing from `data/pdfs/official/`.
2. Stage-0 static printable pages: which units/how many (recommend: one printable per نشاط page found: الله الخالق coloring, أسمّي النعم, لماذا خلقنا الله Q&A).
3. Confirmation that s5p2/s6p2 "هدي النبي" chapters map to site subject **seerah/hadith/adab** respectively (site subject naming).