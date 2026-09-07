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
        "ar-font-scale", "en-font-scale", "quran-wbw-scale",
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

    /* ---------------- per-name device vault ----------------
       Anonymous UIDs are destroyed on sign-out, so a returning kid
       can never re-link to their old Firestore uid. To keep a kid's
       progress (a) isolated from other kids on the same device and
       (b) restorable after any logout, we snapshot each kid's synced
       data under "sk-vault-<slug>:<kind>" keyed by their name.
       The vault is the device-local source of truth; Firestore is the
       cross-device backup. Two different names = two different kids. */
    var VAULT_PREFIX = "sk-vault-";

    function kidSlug(name) {
        var s = (name || "").toLowerCase().trim().replace(/\s+/g, "-");
        return s.replace(/[^a-z0-9\u0600-\u06FF-]/g, "");
    }

    function vaultItem(slug, kind) {
        return VAULT_PREFIX + slug + ":" + kind;
    }

    function saveKidVault(name) {
        var slug = kidSlug(name);
        if (!slug) { return; }
        setLS(vaultItem(slug, "prefs"), JSON.stringify(gatherPreferences()));
        setLS(vaultItem(slug, "worksheets"), JSON.stringify(gatherWorksheets()));
    }

    function migrateVault(fromName, toName) {
        var from = kidSlug(fromName);
        var to = kidSlug(toName);
        if (!from || !to || from === to) { return; }
        ["prefs", "worksheets"].forEach(function (kind) {
            var v = getLS(vaultItem(from, kind));
            if (v !== null) { setLS(vaultItem(to, kind), v); }
            setLS(vaultItem(from, kind), null);
        });
    }

    /* Wipe every live synced key so no other kid's data leaks in. */
    function clearSyncLocal() {
        SYNC_KEYS.forEach(function (k) { setLS(k, null); });
        try {
            for (var i = localStorage.length - 1; i >= 0; i--) {
                var k = localStorage.key(i);
                if (k && k.indexOf(WORKSHEET_PREFIX) === 0) { setLS(k, null); }
            }
        } catch (e) {}
    }

    /* Reset to this kid's own snapshot (fresh if none exists yet). */
    function restoreKidVault(name) {
        clearSyncLocal();
        var slug = kidSlug(name);
        if (!slug) { return; }
        var prefsV = parseJSON(getLS(vaultItem(slug, "prefs")));
        var wsV = parseJSON(getLS(vaultItem(slug, "worksheets")));
        if (prefsV && typeof prefsV === "object") {
            Object.keys(prefsV).forEach(function (k) {
                var v = prefsV[k];
                if (v !== null && v !== undefined) { setLS(k, v); }
            });
        }
        if (wsV && typeof wsV === "object") {
            Object.keys(wsV).forEach(function (k) {
                var v = wsV[k];
                if (v !== null && v !== undefined) { setLS(k, v); }
            });
        }
    }

    /* Worksheet records also live in IndexedDB (worksheet.js: db "siratkids",
       store "kv"). That store is shared by every kid on the device, so wipe
       only the sk-worksheet-* keys when switching identities, or the previous
       kid's records would leak back in via the IDB-first read path. */
    function clearWorksheetIDB() {
        return new Promise(function (resolve) {
            var finished = false;
            function done() { if (!finished) { finished = true; resolve(); } }
            try {
                if (!window.indexedDB) { done(); return; }
                var req = indexedDB.open("siratkids", 1);
                req.onupgradeneeded = function () {
                    if (!req.result.objectStoreNames.contains("kv")) {
                        req.result.createObjectStore("kv");
                    }
                };
                req.onsuccess = function () {
                    var db = req.result;
                    try {
                        var tx = db.transaction("kv", "readwrite");
                        var store = tx.objectStore("kv");
                        var keysReq = store.getAllKeys();
                        keysReq.onsuccess = function () {
                            var toDelete = (keysReq.result || []).filter(function (k) {
                                return typeof k === "string" && k.indexOf(WORKSHEET_PREFIX) === 0;
                            });
                            toDelete.forEach(function (k) { store.delete(k); });
                        };
                        keysReq.onerror = function () {};
                        tx.oncomplete = function () { db.close(); done(); };
                        tx.onerror = function () { db.close(); done(); };
                        tx.onabort = function () { db.close(); done(); };
                    } catch (e) { db.close(); done(); }
                };
                req.onerror = function () { done(); };
                req.onblocked = function () { done(); };
                setTimeout(done, 2000);
            } catch (e) { done(); }
        });
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
            .catch(function (err) {
                try { console.error("[auth] Firestore write failed:", err && (err.code || err.message || err)); } catch (e) {}
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
        }).catch(function (err) {
            try { console.error("[auth] Firestore read failed:", err && (err.code || err.message || err)); } catch (e) {}
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
        /* Whatever is live on this device belongs to the previous kid
           (if any) — snapshot it before switching identities. */
        var prevName = getKidName();
        if (prevName) { saveKidVault(prevName); }
        AUTH.signInAnonymously().then(function (res) {
            var user = res.user || AUTH.currentUser;
            if (!user) { throw new Error("no-user"); }
            setLS(AUTH_KEY, user.uid);
            if (cleanName) {
                restoreKidVault(cleanName);
                setLS(NAME_KEY, cleanName);
                user.updateProfile({ displayName: cleanName }).catch(function () {});
            }
            /* Clear the old kid's IndexedDB worksheet records before the new
               kid can read them, then push this kid's state to Firestore. */
            return clearWorksheetIDB().then(function () {
                return syncToFirestore();
            });
        }).then(function () {
            if (cb) { cb(null); }
        }).catch(function (err) {
            if (cb) { cb(err); }
            else { showToast("Sign-in failed — please try again."); }
        });
    }

    function logout() {
        /* Anonymous sign-out is permanent, so preserve this kid first. */
        saveKidVault(getKidName());
        var done = AUTH ? AUTH.signOut() : Promise.resolve();
        return done.catch(function () {}).then(function () {
            setLS(AUTH_KEY, null);
            redirectTo(LOGIN_URL);
        });
    }

    function updateKidName(name) {
        var clean = (name || "").trim();
        var prevName = getKidName();
        if (prevName && kidSlug(prevName) !== kidSlug(clean)) {
            migrateVault(prevName, clean);
        }
        saveKidVault(clean);
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

                var toggle = document.createElement('button');
                toggle.type = 'button';
                toggle.className = 'nav-auth-toggle';
                toggle.setAttribute('aria-label', 'Account');
                toggle.setAttribute('aria-haspopup', 'menu');
                toggle.setAttribute('aria-expanded', 'false');
                toggle.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';

                var menu = document.createElement('div');
                menu.className = 'nav-auth-menu';
                menu.setAttribute('role', 'menu');

                var renameRow = document.createElement('div');
                renameRow.className = 'nav-auth-rename-row';
                var renameInput = document.createElement('input');
                renameInput.className = 'settings-kid-name-input';
                renameInput.type = 'text';
                renameInput.maxLength = 40;
                renameInput.setAttribute('aria-label', 'Rename kid');
                var saveBtn = document.createElement('button');
                saveBtn.type = 'button';
                saveBtn.className = 'nav-auth-save';
                saveBtn.textContent = 'Save';
                saveBtn.addEventListener('click', function () {
                    var clean = (renameInput.value || '').trim();
                    if (!clean) {
                        showToast('Name cannot be empty.');
                        return;
                    }
                    updateKidName(clean);
                    renameRow.classList.remove('open');
                    showToast('Name updated');
                });
                renameInput.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter') { saveBtn.click(); }
                });
                renameRow.appendChild(renameInput);
                renameRow.appendChild(saveBtn);

                var nameRow = document.createElement('div');
                nameRow.className = 'nav-auth-name-row';
                var nameEl = document.createElement('span');
                nameEl.className = 'nav-kid-name';
                var editBtn = document.createElement('button');
                editBtn.type = 'button';
                editBtn.className = 'nav-auth-edit-btn';
                editBtn.setAttribute('aria-label', 'Rename kid');
                editBtn.title = 'Rename';
                editBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>';
                editBtn.addEventListener('click', function () {
                    renameRow.classList.toggle('open');
                    renameInput.focus();
                    renameInput.select();
                });
                nameRow.appendChild(nameEl);
                nameRow.appendChild(editBtn);

                var divider = document.createElement('div');
                divider.className = 'settings-dropdown-divider';

                var signoutBtn = document.createElement('button');
                signoutBtn.type = 'button';
                signoutBtn.className = 'nav-auth-signout';
                signoutBtn.textContent = 'Sign out';
                signoutBtn.addEventListener('click', function () {
                    closeAuthMenus();
                    logout();
                });

                menu.appendChild(nameRow);
                menu.appendChild(renameRow);
                menu.appendChild(divider);
                menu.appendChild(signoutBtn);

                chip.appendChild(toggle);
                chip.appendChild(menu);
                container.appendChild(chip);

                toggle.addEventListener('click', function (e) {
                    e.stopPropagation();
                    closeAuthMenus(chip);
                    var open = chip.classList.toggle('open');
                    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
                });
            }

            var nameEl = chip.querySelector('.nav-kid-name');
            if (nameEl) { nameEl.textContent = name || 'Kid'; }
            var nameInput = chip.querySelector('.settings-kid-name-input');
            if (nameInput) { nameInput.value = name || ''; }
        });
        bindAuthMenuClose();
    }

    function closeAuthMenus(keep) {
        document.querySelectorAll('.nav-auth.open').forEach(function (other) {
            if (other === keep) { return; }
            other.classList.remove('open');
            var t = other.querySelector('.nav-auth-toggle');
            if (t) { t.setAttribute('aria-expanded', 'false'); }
        });
    }

    var authMenuCloseBound = false;
    function bindAuthMenuClose() {
        if (authMenuCloseBound) { return; }
        authMenuCloseBound = true;
        document.addEventListener('click', function (e) {
            document.querySelectorAll('.nav-auth.open').forEach(function (chip) {
                if (chip.contains(e.target)) { return; }
                chip.classList.remove('open');
                var t = chip.querySelector('.nav-auth-toggle');
                if (t) { t.setAttribute('aria-expanded', 'false'); }
            });
        });
        document.addEventListener('keydown', function (e) {
            if (e.key !== 'Escape') { return; }
            document.querySelectorAll('.nav-auth.open').forEach(function (chip) {
                chip.classList.remove('open');
                var t = chip.querySelector('.nav-auth-toggle');
                if (t) { t.setAttribute('aria-expanded', 'false'); }
            });
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