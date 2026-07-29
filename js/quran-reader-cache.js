(function () {
    'use strict';

    var DB_NAME = 'siratkids-quran';
    var STORE_NAME = 'file-cache';
    var DB_VERSION = 1;

    window.__QURAN_CACHE = window.__QURAN_CACHE || {};

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

    window.loadFromCacheOrFetch = function (fileKey, url, callback) {
        if (window.__QURAN_CACHE[fileKey]) {
            if (callback) setTimeout(function () { callback(window.__QURAN_CACHE[fileKey]); }, 0);
            return;
        }
        openQuranDb(function (db) {
            if (!db) {
                fetchAndCache(fileKey, url, callback);
                return;
            }
            var tx = db.transaction(STORE_NAME, 'readonly');
            var req = tx.objectStore(STORE_NAME).get(fileKey);
            req.onsuccess = function () {
                if (req.result) {
                    window.__QURAN_CACHE[fileKey] = req.result;
                    if (callback) callback(req.result);
                } else {
                    fetchAndCache(fileKey, url, callback);
                }
            };
            req.onerror = function () {
                fetchAndCache(fileKey, url, callback);
            };
        });
    };

    function fetchAndCache(fileKey, url, callback) {
        fetch(url)
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then(function (data) {
                window.__QURAN_CACHE[fileKey] = data;
                openQuranDb(function (db) {
                    if (db) {
                        try {
                            var tx = db.transaction(STORE_NAME, 'readwrite');
                            tx.objectStore(STORE_NAME).put(data, fileKey);
                        } catch (e) {}
                    }
                });
                if (callback) callback(data);
            })
            .catch(function (err) {
                console.error('Failed to load ' + fileKey + ':', err);
                if (callback) callback(null);
            });
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
