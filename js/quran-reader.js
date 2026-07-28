(function () {
    'use strict';

    var quranData = window.__QURAN_DATA;
    var saheehData = window.__SAHEEH_DATA || {};
    if (!quranData) {
        var el = document.getElementById('qr-loading');
        if (el) el.innerHTML = '<p style="color:#dc2626;">Failed to load Quran data.</p>';
        return;
    }

    var chapters = quranData.chapters || [];
    var verses = quranData.verses || [];
    var currentSurah = null;
    var currentReciter = 'Sudais';
    var currentTranslation = 'hilali';
    var audioEl = null;
    var audioQueue = [];
    var isPlaying = false;

    var els = {
        loading: document.getElementById('qr-loading'),
        content: document.getElementById('qr-content'),
        sidebarToggle: document.getElementById('qr-sidebar-toggle'),
        sidebar: document.getElementById('qr-sidebar'),
        main: document.getElementById('qr-main'),
        surahList: document.getElementById('qr-surah-list'),
        surahSearch: document.getElementById('qr-surah-search'),
        surahHeader: document.getElementById('qr-surah-header'),
        verses: document.getElementById('qr-verses'),
        progressFill: document.getElementById('qr-progress-fill'),
        navBottom: document.getElementById('qr-nav-bottom'),
        prevBtn: document.getElementById('qr-prev-surah'),
        nextBtn: document.getElementById('qr-next-surah'),
        fontSelect: document.getElementById('qr-arabic-font'),
        reciterSelect: document.getElementById('qr-reciter'),
        translationSelect: document.getElementById('qr-translation'),
        playSurah: document.getElementById('qr-play-surah'),
        playingIndicator: document.getElementById('qr-playing-indicator'),
        playingText: document.getElementById('qr-playing-text'),
        stopBtn: document.getElementById('qr-stop-btn'),
    };

    if (!els.loading || !els.content) return;
    init();

    function init() {
        els.loading.style.display = 'none';
        els.content.style.display = 'block';

        renderSurahList();
        applyFont();

        /* Restore sidebar */
        if (localStorage.getItem('sidebar-collapsed') === 'true') {
            document.body.classList.add('qr-sidebar-hidden');
        }

        els.sidebarToggle.addEventListener('click', function () {
            document.body.classList.toggle('qr-sidebar-hidden');
            localStorage.setItem('sidebar-collapsed', document.body.classList.contains('qr-sidebar-hidden'));
        });

        els.surahSearch.addEventListener('input', function () {
            var q = this.value.toLowerCase().trim();
            els.surahList.querySelectorAll('.qr-surah-item').forEach(function (item) {
                var en = (item.getAttribute('data-en') || '').toLowerCase();
                var ar = item.getAttribute('data-ar') || '';
                var num = item.getAttribute('data-num') || '';
                item.style.display = (!q || en.indexOf(q) !== -1 || ar.indexOf(q) !== -1 || num === q) ? '' : 'none';
            });
        });

        els.fontSelect.addEventListener('change', applyFont);

        els.reciterSelect.addEventListener('change', function () {
            currentReciter = this.value;
            stopAudio();
        });

        els.translationSelect.addEventListener('change', function () {
            currentTranslation = this.value;
            if (currentSurah) renderVerses(currentSurah);
        });

        els.prevBtn.addEventListener('click', function () {
            if (currentSurah > 1) loadSurah(currentSurah - 1);
        });
        els.nextBtn.addEventListener('click', function () {
            if (currentSurah < 114) loadSurah(currentSurah + 1);
        });

        els.playSurah.addEventListener('click', function () {
            if (!currentSurah) return;
            var ch = chapters[currentSurah - 1];
            if (!ch) return;
            playFromVerse(ch.id, 1);
        });

        els.stopBtn.addEventListener('click', stopAudio);

        /* Restore prefs */
        var savedFont = localStorage.getItem('arabic-font');
        if (savedFont) { els.fontSelect.value = savedFont; applyFont(); }

        var savedReciter = localStorage.getItem('audio-voice-name');
        if (savedReciter === 'Sudais' || savedReciter === 'Alafasy') {
            els.reciterSelect.value = savedReciter;
            currentReciter = savedReciter;
        }

        var lastRead = localStorage.getItem('quran-last-read');
        var startSurah = 1;
        if (lastRead) { var p = lastRead.split(':'); startSurah = parseInt(p[0]) || 1; }
        loadSurah(startSurah);
    }

    function applyFont() {
        var val = els.fontSelect.value;
        document.body.className = 'font-' + val;
        localStorage.setItem('arabic-font', val);
    }

    function renderSurahList() {
        var html = '';
        chapters.forEach(function (ch) {
            html += '<button class="qr-surah-item" data-id="' + ch.id + '" data-en="' + escapeAttr(ch.en) + '" data-ar="' + escapeAttr(ch.ar) + '" data-num="' + ch.id + '">';
            html += '<span class="qr-surah-num">' + ch.id + '</span>';
            html += '<div class="qr-surah-info">';
            html += '<div class="qr-surah-en">' + escapeHtml(ch.en) + '</div>';
            html += '<div class="qr-surah-ar">' + ch.ar + '</div></div>';
            html += '<span class="qr-surah-verses-count">' + ch.verses + '</span>';
            html += '<span class="qr-bookmark-star" data-surah="' + ch.id + '">&#9733;</span>';
            html += '</button>';
        });
        els.surahList.innerHTML = html;

        els.surahList.querySelectorAll('.qr-surah-item').forEach(function (item) {
            item.addEventListener('click', function () {
                loadSurah(parseInt(item.getAttribute('data-id')));
                els.sidebar.classList.remove('open');
            });
        });
    }

    function loadSurah(id) {
        if (id < 1 || id > 114) return;
        currentSurah = id;
        stopAudio();

        var ch = chapters[id - 1];
        if (!ch) return;

        localStorage.setItem('quran-last-read', ch.id + ':1');

        /* Update sidebar */
        els.surahList.querySelectorAll('.qr-surah-item').forEach(function (item) {
            item.classList.toggle('active', parseInt(item.getAttribute('data-id')) === id);
        });
        var activeItem = els.surahList.querySelector('.qr-surah-item.active');
        if (activeItem) activeItem.scrollIntoView({ block: 'nearest' });

        renderSurahHeader(ch);
        renderVerses(ch);

        els.prevBtn.disabled = id <= 1;
        els.nextBtn.disabled = id >= 114;
        els.navBottom.style.display = 'flex';

        els.main.scrollTop = 0;
        els.progressFill.style.width = '0%';

        setupProgressObserver(ch);
        updateSidebarBookmarks();
        scrollToLastReadVerse(ch);
    }

    function renderSurahHeader(ch) {
        var revLabel = ch.revelation_place === 'makkah' ? 'Meccan' : 'Medinan';
        var html = '';
        html += '<div class="qr-surah-header-name-ar">' + ch.ar + '</div>';
        html += '<div class="qr-surah-header-name-en">Surah ' + escapeHtml(ch.en) + '</div>';
        html += '<div class="qr-surah-header-meta">';
        html += '<span><span class="meta-label">Verses:</span> <span class="meta-value">' + ch.verses + '</span></span>';
        html += '<span class="meta-divider">|</span>';
        html += '<span><span class="meta-label">Revealed:</span> <span class="meta-value">' + revLabel + '</span></span>';
        html += '<span class="meta-divider">|</span>';
        html += '<span><span class="meta-label">Order:</span> <span class="meta-value">' + ch.revelation_order + '</span></span>';
        html += '</div>';

        if (ch.id !== 9) {
            html += '<div class="qr-surah-header-bismillah">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</div>';
        }

        els.surahHeader.innerHTML = html;
    }

    function renderVerses(ch) {
        var startIdx = ch.start;
        var endIdx = ch.end;
        var bookmarks = getBookmarks();
        var html = '';

        for (var i = startIdx; i <= endIdx; i++) {
            var verse = verses[i];
            if (!verse) continue;

            var key = verse.k;
            var vnum = verse.v;

            var transText = (currentTranslation === 'hilali') ? (verse.en || '') : (saheehData[key] || verse.en || '');
            var isBm = bookmarks.indexOf(key) !== -1;

            /* Audio URL: https://verses.quran.com/{reciter}/mp3/{ch:03d}{v:03d}.mp3 */
            var chPad = pad(ch.id, 3);
            var vPad = pad(vnum, 3);

            html += '<div class="qr-verse-row" id="row-' + key.replace(':', '-') + '" data-key="' + key + '">';
            html += '<div class="qr-verse-arabic" id="ar-' + key.replace(':', '-') + '" dir="rtl">';
            html += verse.ar;
            html += '<span class="verse-marker-open">﴿</span><span class="verse-sup">' + vnum + '</span><span class="verse-marker-close">﴾</span>';
            html += '</div>';
            html += '<div class="qr-verse-controls">';
            html += '<span class="qr-verse-tnum">' + vnum + '</span>';
            html += '<button class="qr-verse-tbookmark' + (isBm ? ' bookmarked' : '') + '" data-key="' + key + '" aria-label="Bookmark">' + (isBm ? '&#9733;' : '&#9734;') + '</button>';
            html += '<button class="qr-verse-tplay" data-chapter="' + ch.id + '" data-verse="' + vnum + '" data-chpad="' + chPad + '" data-vpad="' + vPad + '" aria-label="Play"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg></button>';
            html += '</div>';
            html += '<div class="qr-verse-translation" id="tr-' + key.replace(':', '-') + '">' + escapeHtml(transText) + '</div>';
            html += '</div>';
        }

        els.verses.innerHTML = html;

        /* Bind events */
        els.verses.querySelectorAll('.qr-verse-tbookmark').forEach(function (btn) {
            btn.addEventListener('click', function (e) { e.stopPropagation(); toggleBookmark(this.getAttribute('data-key')); });
        });

        els.verses.querySelectorAll('.qr-verse-tplay').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                playFromVerse(parseInt(this.getAttribute('data-chapter')), parseInt(this.getAttribute('data-verse')));
            });
        });
    }

    /* ---- Bookmarks ---- */
    function getBookmarks() {
        try { return JSON.parse(localStorage.getItem('quran-bookmarks')) || []; } catch (e) { return []; }
    }
    function setBookmarks(d) { localStorage.setItem('quran-bookmarks', JSON.stringify(d)); }

    function toggleBookmark(key) {
        var bm = getBookmarks();
        var idx = bm.indexOf(key);
        if (idx === -1) bm.push(key); else bm.splice(idx, 1);
        setBookmarks(bm);

        document.querySelectorAll('.qr-verse-tbookmark[data-key="' + key + '"]').forEach(function (btn) {
            var on = bm.indexOf(key) !== -1;
            btn.innerHTML = on ? '&#9733;' : '&#9734;';
            btn.classList.toggle('bookmarked', on);
        });
        updateSidebarBookmarks();
    }

    function updateSidebarBookmarks() {
        var bm = getBookmarks();
        var surahs = {};
        bm.forEach(function (k) { surahs[k.split(':')[0]] = true; });
        els.surahList.querySelectorAll('.qr-bookmark-star').forEach(function (star) {
            star.classList.toggle('show', !!surahs[star.getAttribute('data-surah')]);
        });
    }

    /* ---- Audio ---- */
    function playFromVerse(chapterId, verseNum) {
        stopAudio();

        var ch = chapters[chapterId - 1];
        if (!ch) return;

        audioQueue = [];
        for (var v = verseNum; v <= ch.verses; v++) {
            audioQueue.push({ chapter: chapterId, verse: v, key: chapterId + ':' + v });
        }
        if (audioQueue.length === 0) return;
        isPlaying = true;

        els.playingIndicator.style.display = 'flex';
        els.playingText.textContent = 'Surah ' + ch.en + ' from ' + verseNum;
        els.playSurah.querySelector('span').textContent = 'Playing...';

        playNextAudio();
    }

    function playNextAudio() {
        if (!isPlaying || audioQueue.length === 0) { finishAudio(); return; }

        var item = audioQueue[0];
        var chPad = pad(item.chapter, 3);
        var vPad = pad(item.verse, 3);
        var url = 'https://verses.quran.com/' + currentReciter + '/mp3/' + chPad + vPad + '.mp3';

        /* Remove playing */
        document.querySelectorAll('.qr-verse-row.playing').forEach(function (el) { el.classList.remove('playing'); });

        var rowId = 'row-' + item.chapter + '-' + item.verse;
        var rowEl = document.getElementById(rowId);
        if (rowEl) {
            rowEl.classList.add('playing');
            rowEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }

        els.playingText.textContent = 'Verse ' + item.verse;

        audioEl = new Audio(url);
        audioEl.addEventListener('ended', function () { audioQueue.shift(); playNextAudio(); });
        audioEl.addEventListener('error', function () { audioQueue.shift(); playNextAudio(); });
        audioEl.play().catch(function () { audioQueue.shift(); playNextAudio(); });
    }

    function stopAudio() {
        isPlaying = false;
        if (audioEl) { audioEl.pause(); audioEl.src = ''; audioEl = null; }
        audioQueue = [];
        els.playingIndicator.style.display = 'none';
        var span = els.playSurah.querySelector('span');
        if (span) span.textContent = 'Play Surah';
        document.querySelectorAll('.qr-verse-row.playing').forEach(function (el) { el.classList.remove('playing'); });
    }

    function finishAudio() {
        isPlaying = false;
        audioEl = null;
        els.playingIndicator.style.display = 'none';
        var span = els.playSurah.querySelector('span');
        if (span) span.textContent = 'Play Surah';
        document.querySelectorAll('.qr-verse-row.playing').forEach(function (el) { el.classList.remove('playing'); });
    }

    /* ---- Progress ---- */
    var progressObserver = null;

    function setupProgressObserver(ch) {
        if (progressObserver) { progressObserver.disconnect(); progressObserver = null; }

        var verseEls = els.verses.querySelectorAll('.qr-verse-row');
        if (!verseEls.length) return;

        progressObserver = new IntersectionObserver(function (entries) {
            var visible = 0;
            entries.forEach(function (entry) { if (entry.isIntersecting) visible++; });
            var pct = Math.round((visible / verseEls.length) * 100);
            els.progressFill.style.width = Math.min(pct, 100) + '%';

            if (ch) {
                try {
                    var prog = JSON.parse(localStorage.getItem('quran-progress')) || {};
                    prog[ch.id] = { verseCount: verseEls.length, visibleCount: visible };
                    localStorage.setItem('quran-progress', JSON.stringify(prog));
                } catch (e) {}
            }
        }, { threshold: 0.5, root: els.main });

        verseEls.forEach(function (el) { progressObserver.observe(el); });
    }

    /* ---- Last read ---- */
    function scrollToLastReadVerse(ch) {
        var lastRead = localStorage.getItem('quran-last-read');
        if (!lastRead) return;
        var parts = lastRead.split(':');
        var sid = parseInt(parts[0]), vn = parseInt(parts[1]);
        if (sid !== ch.id || !vn) return;

        var rowId = 'row-' + sid + '-' + vn;
        var rowEl = document.getElementById(rowId);
        if (rowEl) {
            setTimeout(function () {
                rowEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
                rowEl.style.transition = 'background 0.5s';
                rowEl.style.background = 'rgba(79,70,229,0.12)';
                setTimeout(function () { rowEl.style.background = ''; }, 1500);
            }, 300);
        }
    }

    /* ---- Helpers ---- */
    function pad(n, len) {
        var s = n.toString();
        while (s.length < len) s = '0' + s;
        return s;
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function escapeAttr(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    /* Mobile sidebar */
    document.addEventListener('click', function (e) {
        if (window.innerWidth <= 768) {
            if (els.sidebar.classList.contains('open') && !els.sidebar.contains(e.target) && !els.sidebarToggle.contains(e.target)) {
                els.sidebar.classList.remove('open');
            }
        }
    });
    els.sidebarToggle.addEventListener('click', function () {
        if (window.innerWidth <= 768) { els.sidebar.classList.toggle('open'); }
    });

})();
