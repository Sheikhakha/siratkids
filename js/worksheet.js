/* =====================================================================
   SiratKids · Worksheet Activity Engine
   docs/activity-worksheets-plan.md §2/§5/§6/§7

   - Reads window.__SK_WORKSHEETS (js/worksheets-data.js).
   - Route: worksheet.html#w=<pageKey>  (bare hash -> picker grid).
   - Storage: skStore adapter — IndexedDB (db "siratkids", store "kv"),
     automatic localStorage fallback. Feature code never touches raw APIs.
   - Vanilla JS, no frameworks. Motion/CSS live in css/style.css (.ws-*).
   ===================================================================== */
(function () {
    "use strict";

    /* ================= skStore (IndexedDB + LS fallback) ============== */
    var skStore = (function () {
        var DB = "siratkids", STORE = "kv", dbPromise = null;

        function openDb() {
            if (dbPromise) { return dbPromise; }
            dbPromise = new Promise(function (resolve) {
                var done = false;
                function finish(val) { if (!done) { done = true; resolve(val); } }
                try {
                    if (!window.indexedDB) { finish(null); return; }
                    var req = indexedDB.open(DB, 1);
                    req.onupgradeneeded = function () {
                        if (!req.result.objectStoreNames.contains(STORE)) {
                            req.result.createObjectStore(STORE);
                        }
                    };
                    req.onsuccess = function () { finish(req.result); };
                    req.onerror = function () { finish(null); };
                    /* Safari fires blocked/upgrade quirks; don't hang forever */
                    setTimeout(function () { finish(null); }, 3000);
                } catch (e) { finish(null); }
            });
            return dbPromise;
        }

        function lsGet(key, fallback) {
            try {
                var raw = localStorage.getItem(key);
                return raw === null ? fallback : JSON.parse(raw);
            } catch (e) { return fallback; }
        }
        function lsSet(key, val) {
            try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
        }

        function withStore(mode) {
            return openDb().then(function (db) {
                if (!db) { return null; }
                try { return db.transaction(STORE, mode).objectStore(STORE); }
                catch (e) { return null; }
            });
        }

        return {
            get: function (key, fallback) {
                return withStore("readonly").then(function (store) {
                    if (!store) { return lsGet(key, fallback); }
                    return new Promise(function (resolve) {
                        var rq = store.get(key);
                        rq.onsuccess = function () {
                            resolve(rq.value === undefined || rq.value === null ? fallback : rq.value);
                        };
                        rq.onerror = function () { resolve(lsGet(key, fallback)); };
                    });
                });
            },
            set: function (key, val) {
                lsSet(key, val); /* mirror: cheap insurance if IDB later evicted */
                return withStore("readwrite").then(function (store) {
                    if (!store) { return false; }
                    return new Promise(function (resolve) {
                        var rq = store.put(val, key);
                        rq.onsuccess = function () { resolve(true); };
                        rq.onerror = function () { resolve(false); };
                    });
                });
            }
        };
    })();

    /* ============================ helpers ============================= */
    function $(sel, ctx) { return (ctx || document).querySelector(sel); }
    function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
    function el(tag, cls, html) {
        var e = document.createElement(tag);
        if (cls) { e.className = cls; }
        if (html != null) { e.innerHTML = html; }
        return e;
    }
    function shuffled(list) {
        var a = list.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }

    var STAGE_LABELS = {
        s0: { en: "Pre-Stage", ar: "المرحلة التمهيدية" },
        s1: { en: "Stage One", ar: "المرحلة الأولى" },
        s2: { en: "Stage Two", ar: "المرحلة الثانية" },
        s3: { en: "Stage Three", ar: "المرحلة الثالثة" },
        s4: { en: "Stage Four", ar: "المرحلة الرابعة" },
        s5: { en: "Stage Five", ar: "المرحلة الخامسة" },
        s6: { en: "Stage Six", ar: "المرحلة السادسة" }
    };
    var SUBJECT_LABELS = {
        tawheed: { en: "Tawheed", ar: "التوحيد" },
        fiqh:    { en: "Fiqh", ar: "الفقه" },
        adhkar:  { en: "Adhkar", ar: "الأذكار والدعاء" },
        seerah:  { en: "Seerah", ar: "السيرة النبوية" },
        hadith:  { en: "Hadith", ar: "الحديث النبوي" },
        adab:    { en: "Adab", ar: "الآداب" }
    };
    function stageLabel(key) {
        var m = (key || "").match(/^s(\d+)p(\d+)$/);
        if (m) {
            var base = STAGE_LABELS["s" + m[1]] || { en: "Stage " + m[1], ar: "" };
            var p = m[2] === "1" ? "Part 1" : "Part 2";
            var pa = m[2] === "1" ? "الجزء الأول" : "الجزء الثاني";
            return { en: base.en + ", " + p, ar: base.ar + " \u060c " + pa };
        }
        return STAGE_LABELS[key] || { en: key || "", ar: "" };
    }
    var GUIDE_ICONS = {
        idle: "👆", picked: "🔍", dragging: "✋",
        wrong: "🤔", correct: "✅", done: "🎉"
    };

    /* ======================= guide-bubble FSM ========================= */
    function makeGuide(mount, texts) {
        var box = el("div", "ws-guide");
        var icon = el("span", "ws-guide-icon");
        var en = el("span", "ws-guide-en");
        var ar = el("span", "ws-guide-ar ar"); ar.dir = "rtl";
        box.appendChild(icon); box.appendChild(en); box.appendChild(ar);
        mount.appendChild(box);
        var revertTimer = null;
        function set(state) {
            icon.textContent = GUIDE_ICONS[state] || "👉";
            en.textContent = (texts[state] && texts[state].en) || "";
            ar.textContent = (texts[state] && texts[state].ar) || "";
            box.classList.remove("is-pop");
            void box.offsetWidth; /* restart pop animation */
            box.classList.add("is-pop");
        }
        function flash(state, backTo, ms) {
            if (revertTimer) { clearTimeout(revertTimer); }
            set(state);
            revertTimer = setTimeout(function () { set(backTo); }, ms || 1200);
        }
        return { set: set, flash: flash };
    }

    /* ========================= match activity ========================= */
    function buildMatch(section, sheet, state) {
        var head = el("div", "ws-head");
        head.appendChild(el("h2", null, "Match each Name to its proof"));
        head.appendChild(el("p", "ar", "صِلِ الاسْمَ بِالدَّلِيلِ")).dir = "rtl";
        var dots = el("div", "ws-dots");
        sheet.match.forEach(function () { dots.appendChild(el("i")); });
        head.appendChild(dots);
        section.appendChild(head);

        var guide = makeGuide(section, sheet.matchGuide);
        var cols = el("div", "ws-cols");

        var colA = el("div", "ws-col");
        colA.appendChild(el("p", "col-label", "Names · الأسماء"));
        var listA = el("div", "ws-col-list");
        sheet.match.forEach(function (m) {
            var b = el("button", "ws-card",
                '<span class="ws-ar ar" dir="rtl">' + m.name.ar + "</span>" +
                '<span class="ws-en">' + m.name.en + "</span>");
            b.type = "button";
            b.dataset.pair = m.pair;
            listA.appendChild(b);
        });
        colA.appendChild(listA);

        var colB = el("div", "ws-col");
        colB.appendChild(el("p", "col-label b", "Proofs · الأدلة"));
        var listB = el("div", "ws-col-list");
        shuffled(sheet.match).forEach(function (m) {
            var b = el("button", "ws-card",
                '<span class="ws-ar ar" dir="rtl">' + m.proof.ar + "</span>" +
                '<span class="ws-ref">﴿' + m.proof.ref + "﴾</span>");
            b.type = "button";
            b.dataset.pair = m.pair;
            listB.appendChild(b);
        });
        colB.appendChild(listB);

        cols.appendChild(colA); cols.appendChild(colB);
        section.appendChild(cols);
        var fb = el("p", "ws-feedback");
        fb.setAttribute("role", "status");
        fb.setAttribute("aria-live", "polite");
        section.appendChild(fb);

        var pickedLeft = null;
        var matched = 0;
        var matchCardsA = $all(".ws-card", listA);

        function clearPicked() {
            $all(".is-selected", listA).forEach(function (x) {
                x.classList.remove("is-selected");
                x.removeAttribute("aria-pressed");
            });
            pickedLeft = null;
        }

        function selectName(btn) {
            clearPicked();
            if (!btn) { return; }
            btn.classList.add("is-selected");
            btn.setAttribute("aria-pressed", "true");
            pickedLeft = btn;
            guide.set("picked");
            fb.textContent = "Identify this Name's proof ▸ استخرج دليله";
            fb.className = "ws-feedback ok";
        }
        function firstUnmatched() {
            for (var i = 0; i < matchCardsA.length; i++) {
                if (!matchCardsA[i].classList.contains("is-done")) { return matchCardsA[i]; }
            }
            return null;
        }

        guide.set("idle");

        listA.addEventListener("click", function (ev) {
            var btn = ev.target.closest(".ws-card");
            if (!btn || btn.classList.contains("is-done")) { return; }
            selectName(btn); /* child may change which Name is active */
        });

        listB.addEventListener("click", function (ev) {
            var btn = ev.target.closest(".ws-card");
            if (!btn || btn.classList.contains("is-done") || !pickedLeft) { return; }

            if (btn.dataset.pair === pickedLeft.dataset.pair) {
                btn.classList.remove("is-wrong");
                btn.classList.add("is-done", "is-pop");
                pickedLeft.classList.remove("is-selected");
                pickedLeft.classList.add("is-done", "is-pop");
                pickedLeft.removeAttribute("aria-pressed");
                pickedLeft = null;
                dots.children[matched].classList.add("done");
                matched++;
                if (matched === sheet.match.length) {
                    guide.set("done");
                    fb.textContent = "🎉 MashaAllah! All matched! ما شاء الله";
                    fb.className = "ws-feedback ok";
                    state.matchDone = true;
                    onActivityDone();
                } else {
                    guide.flash("correct", "picked", 1100);
                    fb.textContent = "✓ Correct! أحسنت";
                    fb.className = "ws-feedback ok";
                    selectName(firstUnmatched()); /* auto-advance to next Name */
                }
            } else {
                state.mistakes += 1;
                btn.classList.add("is-wrong");
                pickedLeft.classList.add("is-wrong");
                guide.flash("wrong", "picked", 1300);
                fb.textContent = "Try again! حاول مرة أخرى";
                fb.className = "ws-feedback err";
                /* keep pickedLeft pointing at the still-selected Name so a
                   subsequent correct click works (pickedLeft stays selected) */
                var left = pickedLeft;
                setTimeout(function () {
                    btn.classList.remove("is-wrong");
                    left.classList.remove("is-wrong");
                }, 520);
            }
        });

        /* start guided: auto-select the first Name */
        selectName(firstUnmatched());

        return {
            reset: function () {
                matched = 0;
                pickedLeft = null;
                fb.textContent = ""; fb.className = "ws-feedback";
                $all(".ws-card", section).forEach(function (c) {
                    c.classList.remove("is-done", "is-selected", "is-wrong", "is-pop");
                    c.removeAttribute("aria-pressed");
                });
                $all("i", dots).forEach(function (d) { d.classList.remove("done"); });
                /* reshuffle proofs */
                var cards = shuffled($all(".ws-card", listB));
                cards.forEach(function (c) { listB.appendChild(c); });
                /* re-arm guidance: auto-select the first Name */
                selectName(firstUnmatched());
            }
        };

    }

    /* ========================== fill activity ========================= */
    function buildFill(section, sheet, state) {
        var head = el("div", "ws-head");
        head.appendChild(el("h2", null, "Pick the missing word"));
        head.appendChild(el("p", "ar", "اخْتَرِ الكَلِمَةَ النَّاقِصَةَ")).dir = "rtl";
        section.appendChild(head);

        var guide = makeGuide(section, sheet.fillGuide);
        var area = el("div", "ws-questions");

        sheet.fill.forEach(function (q, qi) {
            var qEl = el("div", "ws-q ws-sentence");
            var p = el("p", "ar"); p.dir = "rtl";
            p.appendChild(document.createTextNode(q.before));
            var blank = el("button", "ws-blank", "\u00A0\u00A0\u00A0\u00A0\u00A0");
            blank.type = "button";
            blank.dataset.q = String(qi);
            blank.dataset.word = q.answer;
            blank.addEventListener("keydown", function (ev) {
                if ((ev.key === " " || ev.key === "Enter") &&
                    pickedChip && !this.classList.contains("ok")) {
                    ev.preventDefault();
                    evaluate(pickedChip, this);
                    hoverBlank(null);
                }
            });
            p.appendChild(blank);
            p.appendChild(document.createTextNode(q.after));
            qEl.appendChild(p);
            if (q.en) { qEl.appendChild(el("p", "en", q.en)); }
            area.appendChild(qEl);
        });
        section.appendChild(area);

        var bank = el("div", "ws-bank");
        bank.setAttribute("role", "group");
        bank.setAttribute("aria-label", "Word bank");
        sheet.bank.forEach(function (w) {
            var c = el("button", "ws-chip", w);
            c.type = "button";
            c.dataset.word = w;
            bank.appendChild(c);
        });
        section.appendChild(bank);

        var fb = el("p", "ws-feedback");
        fb.setAttribute("role", "status");
        fb.setAttribute("aria-live", "polite");
        section.appendChild(fb);

        var pickedChip = null;
        var filledOk = 0;

        function unpickChip() {
            if (pickedChip) { pickedChip.classList.remove("is-picked"); pickedChip = null; }
        }
        function hoverBlank(blank) {
            $all(".ws-blank.is-hover", area).forEach(function (b) { b.classList.remove("is-hover"); });
            if (blank && !blank.classList.contains("ok")) { blank.classList.add("is-hover"); }
        }

        function evaluate(chip, blank) {
            if (chip.dataset.word === blank.dataset.word) {
                blank.textContent = chip.dataset.word;
                blank.className = "ws-blank ok";
                chip.classList.remove("is-picked", "is-lifted");
                chip.classList.add("is-used");
                chip.disabled = true;
                pickedChip = null;
                filledOk++;
                if (filledOk === sheet.fill.length) {
                    guide.set("done");
                    fb.textContent = "🎉 MashaAllah! Complete! ما شاء الله";
                    fb.className = "ws-feedback ok";
                    state.fillDone = true;
                    onActivityDone();
                } else {
                    guide.flash("correct", "idle", 1100);
                    fb.textContent = "✓ Correct! أحسنت";
                    fb.className = "ws-feedback ok";
                }
            } else {
                state.mistakes += 1;
                blank.textContent = chip.dataset.word;
                blank.classList.add("bad");
                guide.flash("wrong", "picked", 1300);
                fb.textContent = "Not this one — try again! ليست هذه";
                fb.className = "ws-feedback err";
                setTimeout(function () {
                    blank.textContent = "\u00A0\u00A0\u00A0\u00A0\u00A0";
                    blank.className = "ws-blank";
                }, 650);
            }
        }

        /* --- tap path --- */
        var suppressChip = null;
        bank.addEventListener("click", function (ev) {
            var chip = ev.target.closest(".ws-chip");
            if (suppressChip && chip === suppressChip) {
                suppressChip = null; return; /* synthetic click right after a drag */
            }
            if (!chip || chip.disabled) { return; }
            unpickChip();
            chip.classList.add("is-picked");
            pickedChip = chip;
            guide.set("picked");
        });
        area.addEventListener("click", function (ev) {
            var blank = ev.target.closest(".ws-blank");
            if (!blank || blank.classList.contains("ok")) { return; }
            if (!pickedChip) {
                guide.flash("idle", "idle", 800);
                return;
            }
            evaluate(pickedChip, blank);
            hoverBlank(null);
        });

        /* --- pointer-events drag path (mouse + touch + pen) ---
           Drag intent = movement beyond 8px after pointerdown; plain
           taps never trigger it. Native HTML5 DnD deliberately unused.
           move/up/cancel are on DOCUMENT so tracking continues after the
           pointer leaves the bank (blanks sit above it). */
        if (window.PointerEvent) {
            var DRAG_THRESHOLD = 8;
            var drag = null;        /* {chip, ghost, startX, startY, started} */

            function makeGhost(chip) {
                var g = el("div", "ws-drag-ghost ar", chip.textContent);
                g.dir = "rtl";
                document.body.appendChild(g);
                return g;
            }
            function moveGhost(g, x, y) {
                g.style.transform = "translate(" + x + "px," + y + "px)";
            }
            function endDrag(commitBlank) {
                if (!drag) { return; }
                suppressChip = drag.chip;
                setTimeout(function () { if (suppressChip === drag.chip) { suppressChip = null; } }, 300);
                if (commitBlank && !commitBlank.classList.contains("ok")) {
                    evaluate(drag.chip, commitBlank);
                }
                if (drag.ghost && drag.ghost.parentNode) { drag.ghost.parentNode.removeChild(drag.ghost); }
                drag.chip.classList.remove("is-lifted");
                hoverBlank(null);
                if (pickedChip === drag.chip) { unpickChip(); }
                drag = null;
            }

            bank.addEventListener("pointerdown", function (ev) {
                var chip = ev.target.closest(".ws-chip");
                if (!chip || chip.disabled) { return; }
                drag = { chip: chip, ghost: null, startX: ev.clientX, startY: ev.clientY, started: false };
                /* no preventDefault yet — allow plain tap/click */
            });
            document.addEventListener("pointermove", function (ev) {
                if (!drag) { return; }
                var dx = ev.clientX - drag.startX;
                var dy = ev.clientY - drag.startY;
                if (!drag.started) {
                    if ((dx * dx + dy * dy) < DRAG_THRESHOLD * DRAG_THRESHOLD) { return; }
                    drag.started = true;
                    drag.ghost = makeGhost(drag.chip, ev.clientX, ev.clientY);
                    drag.chip.classList.add("is-lifted");
                    unpickChip();
                    guide.set("dragging");
                }
                ev.preventDefault(); /* keep touch from scrolling mid-drag */
                moveGhost(drag.ghost, ev.clientX, ev.clientY);
                hoverBlank(blankAt(ev.clientX, ev.clientY));
            });
            function upPointer(ev) {
                if (!drag) { return; }
                if (!drag.started) { drag = null; return; } /* plain tap: let click fire */
                var blank = blankAt(ev.clientX, ev.clientY);
                endDrag(blank);
            }
            document.addEventListener("pointerup", upPointer);
            document.addEventListener("pointercancel", function () { endDrag(null); });
        }

        function blankAt(x, y) {
            var elm = document.elementFromPoint(x, y);
            return elm ? elm.closest ? elm.closest(".ws-blank") : null : null;
        }

        guide.set("idle");

        return {
            reset: function () {
                filledOk = 0;
                pickedChip = null;
                fb.textContent = ""; fb.className = "ws-feedback";
                $all(".ws-blank", area).forEach(function (b) {
                    b.textContent = "\u00A0\u00A0\u00A0\u00A0\u00A0";
                    b.className = "ws-blank";
                });
                $all(".ws-chip", bank).forEach(function (c) {
                    c.classList.remove("is-used", "is-picked", "is-lifted");
                    c.disabled = false;
                });
                guide.set("idle");
            }
        };
    }

    /* ======================== quiz activity ========================= */
    function buildQuiz(section, sheet, state) {
        var head = el("div", "ws-head");
        head.appendChild(el("h2", null, "Answer the Questions"));
        head.appendChild(el("p", "ar", "\u0623\u062c\u064a\u0628 \u0639\u0646 \u0627\u0644\u0623\u0633\u0626\u0644\u0629")).dir = "rtl";
        var dots = el("div", "ws-dots");
        sheet.quiz.forEach(function () { dots.appendChild(el("i")); });
        head.appendChild(dots);
        section.appendChild(head);

        var guide = makeGuide(section, sheet.quizGuide);
        var area = el("div", "ws-questions");

        function showQ(idx) {
            $all(".ws-quiz-q", area).forEach(function (q, i) {
                q.style.display = i === idx ? "" : "none";
            });
            guide.set("idle");
        }

        sheet.quiz.forEach(function (q, qi) {
            var qEl = el("div", "ws-q ws-quiz-q");
            qEl.style.display = qi === 0 ? "" : "none";
            qEl.appendChild(el("p", "ar ws-quiz-text", q.q.ar)).dir = "rtl";
            if (q.q.en) { qEl.appendChild(el("p", "en", q.q.en)); }
            var opts = el("div", "ws-quiz-options");
            q.options.forEach(function (opt, oi) {
                var b = el("button", "ws-quiz-opt",
                    '<span class="ws-ar ar" dir="rtl">' + opt.ar + "</span>" +
                    (opt.en ? '<span class="ws-en">' + opt.en + "</span>" : ""));
                b.type = "button";
                b.dataset.qi = String(qi);
                b.dataset.oi = String(oi);
                opts.appendChild(b);
            });
            qEl.appendChild(opts);
            area.appendChild(qEl);
        });
        section.appendChild(area);

        var fb = el("p", "ws-feedback");
        fb.setAttribute("role", "status");
        fb.setAttribute("aria-live", "polite");
        section.appendChild(fb);

        var answered = 0;

        area.addEventListener("click", function (ev) {
            var btn = ev.target.closest(".ws-quiz-opt");
            if (!btn || btn.classList.contains("is-done") || btn.classList.contains("is-wrong")) { return; }
            var qi = parseInt(btn.dataset.qi);
            var oi = parseInt(btn.dataset.oi);
            var q = sheet.quiz[qi];

            if (oi === q.answer) {
                btn.classList.add("is-done", "is-pop");
                $all('[data-qi="' + qi + '"]', area).forEach(function (b) {
                    if (b !== btn) { b.classList.add("is-done"); }
                });
                dots.children[answered].classList.add("done");
                answered++;
                guide.flash("correct", "idle", 1100);
                fb.textContent = "\u2713 Correct! \u0623\u062d\u0633\u0646\u062a";
                fb.className = "ws-feedback ok";
                if (answered === sheet.quiz.length) {
                    guide.set("done");
                    state.quizDone = true;
                    onActivityDone();
                } else {
                    setTimeout(function () { showQ(answered); }, 800);
                }
            } else {
                state.mistakes += 1;
                btn.classList.add("is-wrong");
                guide.flash("wrong", "idle", 1300);
                fb.textContent = "Try again! \u062d\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649";
                fb.className = "ws-feedback err";
                setTimeout(function () { btn.classList.remove("is-wrong"); }, 520);
            }
        });

        guide.set("idle");

        return {
            reset: function () {
                answered = 0;
                fb.textContent = ""; fb.className = "ws-feedback";
                $all(".ws-quiz-opt", area).forEach(function (b) {
                    b.classList.remove("is-done", "is-wrong", "is-pop");
                });
                $all("i", dots).forEach(function (d) { d.classList.remove("done"); });
                showQ(0);
            }
        };
    }

    /* ===================== discriminate activity ====================== */
    function buildDisc(section, sheet, state) {
        var head = el("div", "ws-head");
        head.appendChild(el("h2", null, "True or False?"));
        head.appendChild(el("p", "ar", "\u0635\u062d\u064a\u062d \u0623\u0645 \u062e\u0637\u0623\u061f")).dir = "rtl";
        var dots = el("div", "ws-dots");
        sheet.disc.forEach(function () { dots.appendChild(el("i")); });
        head.appendChild(dots);
        section.appendChild(head);

        var guide = makeGuide(section, sheet.discGuide);
        var area = el("div", "ws-disc-list");

        sheet.disc.forEach(function (item, di) {
            var row = el("div", "ws-q ws-disc-item");
            row.appendChild(el("p", "ar ws-disc-text", item.text.ar)).dir = "rtl";
            if (item.text.en) { row.appendChild(el("p", "en", item.text.en)); }
            var btns = el("div", "ws-disc-btns");
            var bT = el("button", "ws-disc-btn ws-disc-true",
                "\u2713 True <span class='ar' dir='rtl'>\u0635\u0648\u0627\u0628</span>");
            bT.type = "button"; bT.dataset.di = String(di); bT.dataset.val = "true";
            var bF = el("button", "ws-disc-btn ws-disc-false",
                "\u2717 False <span class='ar' dir='rtl'>\u062e\u0637\u0623</span>");
            bF.type = "button"; bF.dataset.di = String(di); bF.dataset.val = "false";
            btns.appendChild(bT); btns.appendChild(bF);
            row.appendChild(btns);
            area.appendChild(row);
        });
        section.appendChild(area);

        var fb = el("p", "ws-feedback");
        fb.setAttribute("role", "status");
        fb.setAttribute("aria-live", "polite");
        section.appendChild(fb);

        var answered = 0;

        area.addEventListener("click", function (ev) {
            var btn = ev.target.closest(".ws-disc-btn");
            if (!btn || btn.classList.contains("is-done") || btn.classList.contains("is-wrong")) { return; }
            var di = parseInt(btn.dataset.di);
            var val = btn.dataset.val === "true";
            var item = sheet.disc[di];

            if (val === item.correct) {
                btn.classList.add("is-done", "is-pop");
                $all('[data-di="' + di + '"]', area).forEach(function (b) {
                    b.classList.add("is-done");
                });
                dots.children[answered].classList.add("done");
                answered++;
                guide.flash("correct", "idle", 1100);
                fb.textContent = "\u2713 Correct! \u0623\u062d\u0633\u0646\u062a";
                fb.className = "ws-feedback ok";
                if (answered === sheet.disc.length) {
                    guide.set("done");
                    state.discDone = true;
                    onActivityDone();
                }
            } else {
                state.mistakes += 1;
                btn.classList.add("is-wrong");
                guide.flash("wrong", "idle", 1300);
                fb.textContent = "Try again! \u062d\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649";
                fb.className = "ws-feedback err";
                setTimeout(function () { btn.classList.remove("is-wrong"); }, 520);
            }
        });

        guide.set("idle");

        return {
            reset: function () {
                answered = 0;
                fb.textContent = ""; fb.className = "ws-feedback";
                $all(".ws-disc-btn", area).forEach(function (b) {
                    b.classList.remove("is-done", "is-wrong", "is-pop");
                });
                $all("i", dots).forEach(function (d) { d.classList.remove("done"); });
            }
        };
    }

    /* ===================== coloring activity ========================= */
    function buildColor(section, sheet, state) {
        var data = sheet.color;
        var head = el("div", "ws-head");
        head.appendChild(el("h2", null, "Color the Picture"));
        head.appendChild(el("p", "ar", "\u0627\u0644\u062a\u0644\u0648\u064a\u0646")).dir = "rtl";
        var dots = el("div", "ws-dots");
        data.zones.forEach(function () { dots.appendChild(el("i")); });
        head.appendChild(dots);
        section.appendChild(head);

        var guide = makeGuide(section, data.guide || sheet.colorGuide);
        var area = el("div", "ws-color-area");

        var zoneEls = el("div", "ws-color-zones");
        data.zones.forEach(function (z, zi) {
            var card = el("button", "ws-color-zone");
            card.type = "button";
            card.dataset.zi = String(zi);
            var arSpan = el("span", "ws-ar ar", z.label.ar);
            card.appendChild(arSpan); card.dir = "rtl";
            if (z.label.en) { card.appendChild(el("span", "ws-en", z.label.en)); }
            zoneEls.appendChild(card);
        });
        area.appendChild(zoneEls);

        var palette = el("div", "ws-color-palette");
        palette.setAttribute("role", "group");
        palette.setAttribute("aria-label", "Color palette");
        data.palette.forEach(function (c) {
            var sw = el("button", "ws-color-swatch");
            sw.type = "button";
            sw.dataset.color = c;
            sw.style.background = c;
            sw.setAttribute("aria-label", "Color " + c);
            palette.appendChild(sw);
        });
        area.appendChild(palette);
        section.appendChild(area);

        var fb = el("p", "ws-feedback");
        fb.setAttribute("role", "status");
        fb.setAttribute("aria-live", "polite");
        section.appendChild(fb);

        var selectedColor = null;
        var colored = 0;

        palette.addEventListener("click", function (ev) {
            var sw = ev.target.closest(".ws-color-swatch");
            if (!sw) { return; }
            $all(".is-picked", palette).forEach(function (s) { s.classList.remove("is-picked"); });
            sw.classList.add("is-picked");
            selectedColor = sw.dataset.color;
            guide.set("picked");
        });

        area.addEventListener("click", function (ev) {
            var zone = ev.target.closest(".ws-color-zone");
            if (!zone || zone.classList.contains("is-done") || !selectedColor) { return; }
            var zi = parseInt(zone.dataset.zi);
            zone.style.background = selectedColor;
            zone.classList.add("is-done", "is-pop");
            dots.children[colored].classList.add("done");
            colored++;
            guide.flash("correct", "idle", 900);
            fb.textContent = "\u2713 Colored! \u0644\u0648\u0646\u0646\u062a";
            fb.className = "ws-feedback ok";
            if (colored === data.zones.length) {
                guide.set("done");
                state.colorDone = true;
                onActivityDone();
            }
        });

        guide.set("idle");

        return {
            reset: function () {
                colored = 0;
                selectedColor = null;
                fb.textContent = ""; fb.className = "ws-feedback";
                $all(".ws-color-zone", area).forEach(function (z) {
                    z.classList.remove("is-done", "is-pop");
                    z.style.background = "";
                });
                $all(".is-picked", palette).forEach(function (s) { s.classList.remove("is-picked"); });
                $all("i", dots).forEach(function (d) { d.classList.remove("done"); });
                guide.set("idle");
            }
        };
    }

    /* ===================== naming activity (fill wrapper) ============ */
    function buildName(section, sheet, state) {
        var fakeSheet = {
            fillGuide: sheet.nameGuide,
            fill: sheet.name.map(function (n) {
                return { before: "", answer: n.label.ar, after: "", en: n.label.en || "" };
            }),
            bank: (function () {
                var labels = sheet.name.map(function (n) { return n.label.ar; });
                sheet.name.forEach(function (n) {
                    (n.distractors || []).forEach(function (d) { labels.push(d); });
                });
                return shuffled(labels);
            })()
        };
        return buildFill(section, fakeSheet, state);
    }

    /* ====================== sheet assembly / route ==================== */
    var root = null;
    var crumbCurrent = null;
    var resultPanel = null;
    var starBox = null;
    var resMsg = null;
    var doneBtn = null;
    var resetters = [];

    function onActivityDone() {
        if (this && this.arg) {} /* noop */
        var sheet = onActivityDone.sheetRef;
        var st = onActivityDone.stateRef;
        if (!sheet || !st) { return; }
        var allDone = true;
        if (sheet.match && sheet.match.length && !st.matchDone) { allDone = false; }
        if (sheet.fill && sheet.fill.length && !st.fillDone) { allDone = false; }
        if (sheet.quiz && sheet.quiz.length && !st.quizDone) { allDone = false; }
        if (sheet.disc && sheet.disc.length && !st.discDone) { allDone = false; }
        if (sheet.color && sheet.color.zones && sheet.color.zones.length && !st.colorDone) { allDone = false; }
        if (sheet.name && sheet.name.length && !st.nameDone) { allDone = false; }
        if (allDone) { showResult(sheet, st); }
    }
    function bindCompletion(sheet, state) {
        onActivityDone.sheetRef = sheet;
        onActivityDone.stateRef = state;
    }

    function showResult(sheet, state) {
        var stars = state.mistakes === 0 ? 3 : (state.mistakes <= 3 ? 2 : 1);
        state.stars = stars;
        starBox.textContent = "★★★".slice(0, stars) + "☆☆☆".slice(0, 3 - stars);
        resMsg.textContent = state.mistakes === 0
            ? "Perfect! ممتاز!"
            : "Well done! Mistakes: " + state.mistakes + " — أحسنت!";
        resultPanel.classList.add("show");
        resultPanel.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function backHref(sheet) {
        var s = String(sheet.stage);
        var mp = s.match(/^s(\d+)p(\d+)$/);
        var dest;
        if (mp) {
            dest = "stage-" + mp[1] + "-part" + mp[2] + "-" + sheet.subject + ".html";
        } else {
            dest = "stage-" + s.replace(/^s/, "") + "-" + sheet.subject + ".html";
        }
        var ref = document.referrer;
        var here = location.href.split("#")[0];
        if (ref && ref.split("#")[0] !== here && ref.indexOf(location.origin + "/") === 0) {
            dest = ref;
        }
        return dest;
    }

    function buildBack(sheet) {
        var a = el("a", "ws-back",
            "← Back to Lessons <span class=\"ar\" dir=\"rtl\">عودة إلى الدروس</span>");
        a.href = backHref(sheet);
        return a;
    }

    function renderSheet(key, sheet) {
        root.innerHTML = "";
        resetters = [];
        var hasMatch = !!(sheet.match && sheet.match.length);
        var hasFill  = !!(sheet.fill && sheet.fill.length);
        var hasQuiz  = !!(sheet.quiz && sheet.quiz.length);
        var hasDisc  = !!(sheet.disc && sheet.disc.length);
        var hasColor = !!(sheet.color && sheet.color.zones && sheet.color.zones.length);
        var hasName  = !!(sheet.name && sheet.name.length);
        var state = {
            mistakes: 0,
            matchDone: !hasMatch, fillDone: !hasFill,
            quizDone: !hasQuiz, discDone: !hasDisc,
            colorDone: !hasColor, nameDone: !hasName
        };

        if (crumbCurrent) {
            crumbCurrent.textContent = (sheet.title.en || key) + " Worksheet";
        }

        var hero = el("header", "ws-hero");
        hero.appendChild(el("h1", null,
            '<span class="ar" dir="rtl">' + (sheet.title.ar || "") + " \u00b7 \u0648\u0631\u0642\u0629 \u0639\u0645\u0644</span>" +
            (sheet.title.en || "")));
        var chips = el("div", "chip-row");
        var sl = stageLabel(sheet.stage);
        var sj = SUBJECT_LABELS[sheet.subject] || { en: sheet.subject || "", ar: "" };
        chips.appendChild(el("span", "stage-chip", sl.en + " \u00b7 " + sl.ar));
        chips.appendChild(el("span", "stage-chip", sj.en + " \u00b7 " + sj.ar));
        hero.appendChild(chips);
        root.appendChild(buildBack(sheet));
        root.appendChild(hero);

        function addSection(buildFn, dataGuard) {
            if (!dataGuard) { return; }
            var sec = el("section", "ws-activity ws-hue-" + (sheet.hue || 1));
            resetters.push(buildFn(sec, sheet, state).reset);
            root.appendChild(sec);
        }
        addSection(buildMatch, hasMatch);
        addSection(buildFill, hasFill);
        addSection(buildQuiz, hasQuiz);
        addSection(buildDisc, hasDisc);
        addSection(buildColor, hasColor);
        addSection(buildName, hasName);

        bindCompletion(sheet, state);

        resultPanel = el("section", "ws-result");
        starBox = el("p", "ws-stars");
        resMsg = el("p", null);
        resMsg.style.fontWeight = "800";
        var row = el("div", "ws-btnrow");
        var retryBtn = el("button", "ws-btn ws-btn-primary", "Try again ↻");
        retryBtn.type = "button";
        doneBtn = el("button", "ws-btn ws-btn-outline ws-btn-done",
            'Practiced ✓ <span class="ar" dir="rtl">ما شاء الله</span>');
        doneBtn.type = "button";
        row.appendChild(retryBtn); row.appendChild(doneBtn);
        resultPanel.appendChild(starBox);
        resultPanel.appendChild(resMsg);
        resultPanel.appendChild(row);
        root.appendChild(resultPanel);

        retryBtn.addEventListener("click", function () {
            state.mistakes = 0;
            state.matchDone = !hasMatch; state.fillDone = !hasFill;
            state.quizDone = !hasQuiz; state.discDone = !hasDisc;
            state.colorDone = !hasColor; state.nameDone = !hasName;
            resultPanel.classList.remove("show");
            doneBtn.classList.remove("is-on");
            resetters.forEach(function (fn) { fn(); });
            window.scrollTo({ top: 0, behavior: "smooth" });
        });

        skStore.get("sk-worksheet-" + key, null).then(function (prev) {
            if (prev && prev.done) {
                doneBtn.classList.add("is-on");
                doneBtn.innerHTML = 'Practiced ✓ saved!';
            }
        });
        doneBtn.addEventListener("click", function () {
            var rec = {
                done: true,
                stars: state.stars || 2,
                mistakes: state.mistakes,
                date: new Date().toISOString()
            };
            skStore.get("sk-worksheet-attempts", {}).then(function (att) {
                att[key] = (att[key] || 0) + 1;
                rec.attempts = att[key];
                skStore.set("sk-worksheet-" + key, rec);
                skStore.set("sk-worksheet-attempts", att);
            });
            doneBtn.classList.add("is-on");
            doneBtn.innerHTML = 'Practiced ✓ saved!';
        });
    }

    function renderPicker() {
        root.innerHTML = "";
        if (crumbCurrent) { crumbCurrent.textContent = "Worksheets"; }
        var W = window.__SK_WORKSHEETS || {};
        var hero = el("header", "ws-hero");
        hero.appendChild(el("h1", null,
            '<span class="ar" dir="rtl">أوراق العمل</span>Worksheets'));
        hero.appendChild(el("p", "ws-picker-note",
            "Practice pages for every unit — pick one! اختر ورقة العمل"));
        root.appendChild(hero);

        var grid = el("div", "ws-picker-grid");
        Object.keys(W).sort().forEach(function (key) {
            var s = W[key];
            var sl = stageLabel(s.stage);
            var sj = SUBJECT_LABELS[s.subject] || { en: "", ar: "" };
            var a = el("a", "ws-pick-card ws-hue-" + (s.hue || 1),
                '<span class="ws-pick-subject">' + sl.en + " · " + sj.en + "</span>" +
                '<span class="ws-pick-title en">' + (s.title.en || key) + "</span>" +
                '<span class="ws-pick-title ar" dir="rtl">' + (s.title.ar || "") + "</span>" +
                '<span class="ws-pick-open">Start ▸ ابدأ</span>');
            a.href = "#w=" + key;
            grid.appendChild(a);
        });
        root.appendChild(grid);
    }

    function route() {
        var m = /^#w=([A-Za-z0-9_-]+)$/.exec(location.hash || "");
        var key = m ? m[1] : null;
        var sheet = key && window.__SK_WORKSHEETS ? window.__SK_WORKSHEETS[key] : null;
        if (sheet) { renderSheet(key, sheet); } else { renderPicker(); }
    }

    function init() {
        root = document.getElementById("ws-root");
        if (!root) { return; } /* engine only runs on worksheet.html */
        crumbCurrent = $(".breadcrumb .current");
        window.addEventListener("hashchange", route);
        route();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    /* test/debug surface */
    window.__worksheetAPI = { store: skStore, route: route };
})();
