self.onmessage = function (e) {
    var fileKey = e.data.file;
    var url = e.data.url;

    try {
        importScripts(url);
    } catch (err) {
        self.postMessage({ file: fileKey, status: 'error', error: err.message });
        return;
    }

    var base = (url || '').split('/').pop().replace(/\.(json|js)$/i, '');
    var data = self.__QURAN_DATA ? self.__QURAN_DATA[base] : null;
    if (!data) {
        self.postMessage({ file: fileKey, status: 'error', error: 'no data in ' + url });
        return;
    }

    var req = indexedDB.open('siratkids-quran', 1);
    req.onsuccess = function () {
        var db = req.result;
        try {
            var tx = db.transaction('file-cache', 'readwrite');
            tx.objectStore('file-cache').put(data, fileKey);
        } catch (e) {}
        self.postMessage({ file: fileKey, status: 'done', data: data });
    };
    req.onerror = function () {
        self.postMessage({ file: fileKey, status: 'done', data: data });
    };
    req.onupgradeneeded = function (ev) {
        var d = ev.target.result;
        if (!d.objectStoreNames.contains('file-cache')) {
            d.createObjectStore('file-cache');
        }
    };
};
