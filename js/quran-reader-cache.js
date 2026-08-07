(function () {
    'use strict';

    var DB_NAME = 'siratkids-quran';
    var STORE_NAME = 'file-cache';
    var DB_VERSION = 1;

    window.__QURAN_CACHE = window.__QURAN_CACHE || {};
    window.__QURAN_DATA = window.__QURAN_DATA || {};

    function openQuranDb(callback) {
        var req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = function (e) {
            var db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        req.onsuccess = function (e) { callback(e.target.result); };
        req.onerror = function () { callback(null); };
    }

    window.getCachedData = function (fileKey) {
        return window.__QURAN_CACHE[fileKey] || null;
    };

    window.putCachedData = function (fileKey, data, callback) {
        window.__QURAN_CACHE[fileKey] = data;
        openQuranDb(function (db) {
            if (db) {
                try {
                    var tx = db.transaction(STORE_NAME, 'readwrite');
                    tx.objectStore(STORE_NAME).put(data, fileKey);
                } catch (e) {}
            }
            if (callback) callback();
        });
    };

    window.loadFromCacheOrFetch = function (fileKey, url, callback) {
        if (window.__QURAN_CACHE[fileKey]) {
            if (callback) setTimeout(function () { callback(window.__QURAN_CACHE[fileKey]); }, 0);
            return;
        }
        openQuranDb(function (db) {
            if (!db) {
                loadScriptAndCache(fileKey, url, callback);
                return;
            }
            var tx = db.transaction(STORE_NAME, 'readonly');
            var req = tx.objectStore(STORE_NAME).get(fileKey);
            req.onsuccess = function () {
                if (req.result) {
                    window.__QURAN_CACHE[fileKey] = req.result;
                    if (callback) callback(req.result);
                } else {
                    loadScriptAndCache(fileKey, url, callback);
                }
            };
            req.onerror = function () {
                loadScriptAndCache(fileKey, url, callback);
            };
        });
    };

    // Load a wrapped data script (window.__QURAN_DATA[<basename>]) via a <script>
    // tag. Works over HTTP and from file:// (where fetch/XHR of local JSON is
    // blocked), which is why the data files ship as .js instead of .json.
    function loadScriptAndCache(fileKey, url, callback) {
        var script = document.createElement('script');
        script.src = url;
        script.onload = function () {
            var base = (url || '').split('/').pop().replace(/\.(json|js)$/i, '');
            var data = window.__QURAN_DATA ? window.__QURAN_DATA[base] : null;
            if (script.parentNode) script.parentNode.removeChild(script);
            if (data) {
                window.__QURAN_CACHE[fileKey] = data;
                openQuranDb(function (db) {
                    if (db) {
                        try {
                            var tx = db.transaction(STORE_NAME, 'readwrite');
                            tx.objectStore(STORE_NAME).put(data, fileKey);
                        } catch (e) {}
                    }
                });
            } else {
                console.error('Failed to load ' + fileKey + ': no data in ' + url);
            }
            if (callback) callback(data);
        };
        script.onerror = function () {
            console.error('Failed to load ' + fileKey + ':', url);
            if (script.parentNode) script.parentNode.removeChild(script);
            if (callback) callback(null);
        };
        document.head.appendChild(script);
    }

    window.clearQuranCache = function (callback) {
        openQuranDb(function (db) {
            if (db) {
                try {
                    var tx = db.transaction(STORE_NAME, 'readwrite');
                    tx.objectStore(STORE_NAME).clear();
                } catch (e) {}
            }
            window.__QURAN_CACHE = {};
            if (callback) callback();
        });
    };

})();
