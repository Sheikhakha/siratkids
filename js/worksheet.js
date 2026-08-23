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
        s2: { en: "Stage Two", ar: "المرحلة الثانية" }
    };
    var SUBJECT_LABELS = {
        tawheed: { en: "Tawheed", ar: "التوحيد" },
        fiqh:    { en: "Fiqh & Manners", ar: "الفقه والآداب" },
        adhkar:  { en: "Adhkar", ar: "الأذكار والدعاء" },
        seerah:  { en: "Seerah", ar: "السيرة النبوية" },
        hadith:  { en: "Hadith", ar: "الحديث النبوي" }
    };
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

        function clearPicked() {
            $all(".is-selected", listA).forEach(function (x) {
                x.classList.remove("is-selected");
                x.removeAttribute("aria-pressed");
            });
            pickedLeft = null;
        }

        guide.set("idle");

        listA.addEventListener("click", function (ev) {
            var btn = ev.target.closest(".ws-card");
            if (!btn || btn.classList.contains("is-done")) { return; }
            clearPicked();
            btn.classList.add("is-selected");
            btn.setAttribute("aria-pressed", "true");
            pickedLeft = btn;
            guide.set("picked");
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
                }
            } else {
                state.mistakes += 1;
                btn.classList.add("is-wrong");
                pickedLeft.classList.add("is-wrong");
                guide.flash("wrong", "picked", 1300);
                fb.textContent = "Try again! حاول مرة أخرى";
                fb.className = "ws-feedback err";
                var left = pickedLeft;
                pickedLeft = null;
                setTimeout(function () {
                    btn.classList.remove("is-wrong");
                    left.classList.remove("is-wrong");
                }, 520);
            }
        });

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
                guide.set("idle");
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
        bank.addEventListener("click", function (ev) {
            if (suppressClick) { suppressClick = false; return; }
            var chip = ev.target.closest(".ws-chip");
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
           taps never trigger it. Native HTML5 DnD deliberately unused. */
        if (window.PointerEvent) {
            var DRAG_THRESHOLD = 8;
            var drag = null;        /* {chip, ghost, startX, startY, started} */
            var suppressClick = false;

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
                suppressClick = true;
                setTimeout(function () { suppressClick = false; }, 80);
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
            bank.addEventListener("pointermove", function (ev) {
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
            bank.addEventListener("pointerup", function (ev) {
                if (!drag) { return; }
                if (!drag.started) { drag = null; return; } /* plain tap: let click fire */
                var blank = blankAt(ev.clientX, ev.clientY);
                endDrag(blank);
            });
            bank.addEventListener("pointercancel", function () { endDrag(null); });
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
        if (!sheet) { return; }
        var st = onActivityDone.stateRef;
        if (st.matchDone && st.fillDone) { showResult(sheet, st); }
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

    function renderSheet(key, sheet) {
        root.innerHTML = "";
        resetters = [];
        var state = { mistakes: 0, matchDone: false, fillDone: false };

        if (crumbCurrent) {
            crumbCurrent.textContent = (sheet.title.en || key) + " Worksheet";
        }

        var hero = el("header", "ws-hero");
        hero.appendChild(el("h1", null,
            '<span class="ar" dir="rtl">' + (sheet.title.ar || "") + " · ورقة عمل</span>" +
            (sheet.title.en || "")));
        var chips = el("div", "chip-row");
        var sl = STAGE_LABELS[sheet.stage] || { en: sheet.stage || "", ar: "" };
        var sj = SUBJECT_LABELS[sheet.subject] || { en: sheet.subject || "", ar: "" };
        chips.appendChild(el("span", "stage-chip", sl.en + " · " + sl.ar));
        chips.appendChild(el("span", "stage-chip", sj.en + " · " + sj.ar));
        hero.appendChild(chips);
        root.appendChild(hero);

        var secM = el("section", "ws-activity ws-hue-" + (sheet.hue || 1));
        var secF = el("section", "ws-activity ws-hue-" + (sheet.hue || 1));

        bindCompletion(sheet, state);
        resetters.push(buildMatch(secM, sheet, state).reset);
        root.appendChild(secM);
        resetters.push(buildFill(secF, sheet, state).reset);
        root.appendChild(secF);

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
            state.mistakes = 0; state.matchDone = false; state.fillDone = false;
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
            var sl = STAGE_LABELS[s.stage] || { en: s.stage || "", ar: "" };
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
