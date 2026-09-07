/* SIRATKIDS — Firebase Anonymous Auth + Firestore data sync
   Depends on js/firebase-config.js (compat SDK). Loaded in <head> of every
   page before js/main.js. Exposes window.authAPI.

   Auth model:
     - Anonymous sign-in with an editable kid display name.
     - Login required: any page without a valid cached uid redirects to
       login.html (fast synchronous gate via localStorage, confirmed by
       onAuthStateChanged).
   Data model (Firestore):
     users/{uid}
       preferences: { <sync key>: <stored raw value> }
       worksheets:  { "sk-worksheet-<key>": <record>, "sk-worksheet-attempts": {...} }
   Merge on load:
     - preferences:  Firestore wins (server is source of truth).
     - worksheets:   newer rec.date wins; per-key attempts take the max.
   After merge the converged state is pushed back so devices agree.
   If Firestore is unreachable: toast "Sync failed — using local data",
   continue with localStorage. */
(function () {
    "use strict";

    var AUTH_KEY = "sk-auth-uid";
    var NAME_KEY = "sk-kid-name";

    var AUTH = window.__fbAuth;
    var DB = window.__fbDB;

    /* Derive root-relative prefix from this script's own src (same trick as
       main.js): "js/auth.js" -> "", "../../js/auth.js" -> "../../". */
    var scriptEl = document.querySelector('script[src*="auth.js"]');
    var src = scriptEl ? scriptEl.getAttribute("src") : "js/auth.js";
    var jsDir = src.slice(0, src.lastIndexOf("/") + 1);
    var ROOT_PREFIX = jsDir.replace(/js\/$/, "");

    var LOGIN_URL = ROOT_PREFIX + "login.html";
    var INDEX_URL = ROOT_PREFIX + "index.html";

    /* Settings/preferences keys synced verbatim (stored as raw strings). */
    var SYNC_KEYS = [
        "dark-mode", "accent-color", "arabic-font",
        "ar-font-scale", "en-font-scale",
        "toggle-translation", "toggle-tamil", "toggle-transliteration",
        "audio-speed", "audio-voice-name",
        "quran-translation", "quran-wbw", "quran-tafsir-lang",
        "quran-tafsir-pinned", "quran-tafsir-size", "quran-info-lang",
        "quran-info-size", "quran-sim-size", "mushaf-tajweed",
        "quran-font-scale", "quran-last-read", "quran-bookmarks",
        NAME_KEY
    ];

    var WORKSHEET_PREFIX = "sk-worksheet-";

    var toastTimer = null;
    var authListenerAttached = false;
    var syncTimer = null;

    /* ---------------- localStorage helpers ---------------- */
    function getLS(k) {
        try { return localStorage.getItem(k); } catch (e) { return null; }
    }
    function setLS(k, v) {
        try {
            if (v === null || v === undefined || v === "") { localStorage.removeItem(k); }
            else { localStorage.setItem(k, String(v)); }
        } catch (e) {}
    }
    function parseJSON(v) {
        if (v === null || v === undefined) { return undefined; }
        try { return JSON.parse(v); } catch (e) { return v; }
    }

    /* ---------------- misc ---------------- */
    function isLoginPage() {
        var base = (location.pathname.split("/").pop() || "index.html");
        return base === "login.html";
    }

    function currentUid() {
        var u = AUTH && AUTH.currentUser;
        return u ? u.uid : null;
    }

    function redirectTo(url) {
        try { window.location.href = url; } catch (e) {}
    }

    function showToast(msg) {
        try {
            var t = document.querySelector(".sk-sync-toast");
            if (!t) {
                t = document.createElement("div");
                t.className = "sk-sync-toast";
                document.body.appendChild(t);
            }
            t.textContent = msg;
            t.classList.add("show");
            clearTimeout(toastTimer);
            toastTimer = setTimeout(function () { t.classList.remove("show"); }, 3200);
        } catch (e) {}
    }

    /* ---------------- sync: build payload ---------------- */
    function gatherPreferences() {
        var prefs = {};
        SYNC_KEYS.forEach(function (k) {
            var v = getLS(k);
            if (v !== null) { prefs[k] = v; }
        });
        return prefs;
    }

    function gatherWorksheets() {
        var ws = {};
        try {
            for (var i = 0; i < localStorage.length; i++) {
                var k = localStorage.key(i);
                if (k && k.indexOf(WORKSHEET_PREFIX) === 0) {
                    var v = localStorage.getItem(k);
                    if (v !== null) { ws[k] = v; }
                }
            }
        } catch (e) {}
        return ws;
    }

    /* ---------------- merge worksheets ---------------- */
    function mergeWorksheet(a, b) {
        if (!a) { return b; }
        if (!b) { return a; }
        var aDate = (a && a.date) || "";
        var bDate = (b && b.date) || "";
        if (aDate === bDate) { return b; }  /* tie -> Firestore */
        return aDate > bDate ? a : b;        /* newer wins */
    }

    function mergeAttempts(a, b) {
        if (typeof a !== "object" || !a) { return b || a; }
        if (typeof b !== "object" || !b) { return a || b; }
        var out = {};
        var keys = Object.keys(a).concat(Object.keys(b));
        keys.forEach(function (k) {
            out[k] = Math.max((a[k] || 0), (b[k] || 0));
        });
        return out;
    }

    /* ---------------- sync: read local -> Firestore ---------------- */
    function syncToFirestore() {
        var u = currentUid();
        if (!u) { return Promise.resolve(false); }
        if (!DB) { showToast("Sync failed — using local data"); return Promise.resolve(false); }

        var payload = {
            preferences: gatherPreferences(),
            worksheets: gatherWorksheets(),
            updatedAt: new Date().toISOString()
        };

        return DB.collection("users").doc(u).set(payload, { merge: true })
            .then(function () { return true; })
            .catch(function () {
                showToast("Sync failed — using local data");
                return false;
            });
    }

    /* Debounced push, used by the localStorage.setItem patch in main.js. */
    function scheduleSync() {
        if (!currentUid()) { return; }
        clearTimeout(syncTimer);
        syncTimer = setTimeout(function () { syncToFirestore(); }, 2000);
    }

    /* ---------------- sync: Firestore -> local, then converge ---------------- */
    function syncFromFirestore() {
        var u = currentUid();
        if (!u) { return Promise.resolve(false); }
        if (!DB) { showToast("Sync failed — using local data"); return Promise.resolve(false); }

        return DB.collection("users").doc(u).get().then(function (snap) {
            if (!snap.exists) {
                /* First-ever login: seed the doc with whatever is local. */
                return syncToFirestore();
            }
            return mergeRemote(snap.data());
        }).catch(function () {
            showToast("Sync failed — using local data");
            return false;
        });
    }

    function mergeRemote(data) {
        var changed = false;
        var prefs = (data && data.preferences) || {};
        var remoteWS = (data && data.worksheets) || {};

        /* Preferences: Firestore wins. */
        Object.keys(prefs).forEach(function (k) {
            var rv = prefs[k];
            if (rv === null || rv === undefined) { return; }
            var lv = getLS(k);
            if (lv !== rv) {
                setLS(k, rv);
                changed = true;
            }
        });

        /* Worksheets: newer rec.date wins; attempts take the max. */
        Object.keys(remoteWS).forEach(function (k) {
            var rv = parseJSON(remoteWS[k]);
            var lv = parseJSON(getLS(k));
            var merged;
            if (k === "sk-worksheet-attempts") {
                merged = mergeAttempts(lv, rv);
            } else {
                merged = mergeWorksheet(lv, rv);
            }
            if (merged !== undefined && merged !== null) {
                var current = getLS(k);
                var next = JSON.stringify(merged);
                if (current !== next) {
                    setLS(k, next);
                    changed = true;
                }
            }
        });

        /* Converge: push merged state back so other devices agree. */
        if (changed) { syncToFirestore(); }
        return changed;
    }

    /* ---------------- auth actions ---------------- */
    function loginAnonymously(name, cb) {
        if (!AUTH) {
            showToast("Login unavailable — check your connection.");
            if (cb) { cb(new Error("auth-unavailable")); }
            return;
        }
        var cleanName = (name || "").trim();
        AUTH.signInAnonymously().then(function (res) {
            var user = res.user || AUTH.currentUser;
            if (!user) { throw new Error("no-user"); }
            setLS(AUTH_KEY, user.uid);
            if (cleanName) {
                setLS(NAME_KEY, cleanName);
                user.updateProfile({ displayName: cleanName }).catch(function () {});
            }
            return syncToFirestore();
        }).then(function () {
            if (cb) { cb(null); }
        }).catch(function (err) {
            if (cb) { cb(err); }
            else { showToast("Sign-in failed — please try again."); }
        });
    }

    function logout() {
        var done = AUTH ? AUTH.signOut() : Promise.resolve();
        return done.catch(function () {}).then(function () {
            setLS(AUTH_KEY, null);
            redirectTo(LOGIN_URL);
        });
    }

    function updateKidName(name) {
        var clean = (name || "").trim();
        setLS(NAME_KEY, clean);
        if (AUTH && AUTH.currentUser) {
            AUTH.currentUser.updateProfile({ displayName: clean }).catch(function () {});
        }
        updateNavChip(clean || getKidName());
        scheduleSync();
    }

    function getKidName() {
        var current = AUTH && AUTH.currentUser;
        if (current && current.displayName) { return current.displayName; }
        return getLS(NAME_KEY) || "";
    }

    /* ---------------- auth guard ---------------- */
    function requireAuth() {
        if (isLoginPage()) {
            /* Login page: already authed -> straight back to the site. */
            if (getLS(AUTH_KEY)) { redirectTo(INDEX_URL); return; }
            return;
        }

        /* Fast gate: no cached uid -> redirect without waiting for Firebase. */
        if (!getLS(AUTH_KEY)) { redirectTo(LOGIN_URL); return; }
        if (!AUTH) {
            /* Firebase unreachable but user was signed in here before: keep
               their local data usable rather than trapping them at login. */
            initAuthUI();
            return;
        }

        if (!authListenerAttached) {
            authListenerAttached = true;
            AUTH.onAuthStateChanged(function (user) {
                if (!user) {
                    setLS(AUTH_KEY, null);
                    if (!isLoginPage()) { redirectTo(LOGIN_URL); }
                    return;
                }
                setLS(AUTH_KEY, user.uid);
                if (user.displayName) { setLS(NAME_KEY, user.displayName); }
                syncFromFirestore();
                initAuthUI();
            });
        }
    }

    /* ---------------- UI ---------------- */
    function initAuthUI() {
        updateNavChip(getKidName());
    }

    function updateNavChip(name) {
        ['.navbar .nav-links', '.qr-navbar .qr-nav-right'].forEach(function (sel) {
            var container = document.querySelector(sel);
            if (!container) { return; }
            var chip = container.querySelector('.nav-auth');
            if (!chip) {
                chip = document.createElement('div');
                chip.className = 'nav-auth';
                var span = document.createElement('span');
                span.className = 'nav-kid-name';
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'nav-logout-btn';
                btn.setAttribute('aria-label', 'Log out');
                btn.textContent = '✕';
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    logout();
                });
                chip.appendChild(span);
                chip.appendChild(btn);
                container.appendChild(chip);
            }
            var spanEl = chip.querySelector('.nav-kid-name');
            if (spanEl) {
                spanEl.textContent = name || 'Kid';
                spanEl.title = name || '';
            }
        });
    }

    /* Fill the kid-name inputs injected by main.js with the current name. */
    function fillSettingsName(name) {
        var clean = name || getKidName();
        document.querySelectorAll('.settings-kid-name-input').forEach(function (inp) {
            inp.value = clean || '';
        });
    }

    /* ---------------- public API ---------------- */
    window.authAPI = {
        loginAnonymously: loginAnonymously,
        logout: logout,
        requireAuth: requireAuth,
        updateKidName: updateKidName,
        getKidName: getKidName,
        syncToFirestore: syncToFirestore,
        syncFromFirestore: syncFromFirestore,
        scheduleSync: scheduleSync,
        initAuthUI: initAuthUI,
        fillSettingsName: fillSettingsName,
        showToast: showToast,
        isAuthenticated: function () { return !!currentUid(); }
    };

    /* Auto-run the guard when the library loads. */
    requireAuth();
})();