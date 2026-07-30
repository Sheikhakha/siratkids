(function () {
    'use strict';

    var chapters = window.__QURAN_CHAPTERS || [];
    var currentSurah = null;
    var currentReciter = 'Sudais';
    var currentTranslation = 'hilali';
    var audioEl = null;
    var audioQueue = [];
    var isPlaying = false;
    var isPaused = false;
    var isSinglePlay = false;
    var singlePlayChapter = null;
    var lastPlayedVerse = 0;
    var audioGen = 0;
    var dataLoaded = false;

    var RECITER_CFG = {
        Sudais:       { url: 'https://verses.quran.com/Sudais/mp3/',     padCh: true,  padVr: true,  type: 'per-verse' },
        Alafasy:      { url: 'https://verses.quran.com/Alafasy/mp3/',    padCh: true,  padVr: true,  type: 'per-verse' },
        MinshawiKids: { url: 'https://download.quranicaudio.com/qdc/siddiq_minshawi/kids_repeat/', padCh: false, padVr: false, type: 'per-surah' },
        YasserAlDosari: { url: 'https://audio-cdn.tarteel.ai/quran/yasserAlDosari/', padCh: true, padVr: true, type: 'per-verse' }
    };

    var SURAH_META = {};
    var DOSARI_META = {};
    var _reciterMetaLoading = {};

    var SURAH_LIGATURES = [
        '\uFC45','\uFC46','\uFC47','\uFC4A','\uFC4B','\uFC4E','\uFC4F','\uFC51','\uFC52','\uFC53',
        '\uFC55','\uFC56','\uFC58','\uFC5A','\uFC5B','\uFC5C','\uFC5D','\uFC5E','\uFC61','\uFC62',
        '\uFC64','\uFB51','\uFB52','\uFB54','\uFB55','\uFB57','\uFB58','\uFB5A','\uFB5B','\uFB5D',
        '\uFB5E','\uFB60','\uFB61','\uFB63','\uFB64','\uFB66','\uFB67','\uFB69','\uFB6A','\uFB6C',
        '\uFB6D','\uFB6F','\uFB70','\uFB72','\uFB73','\uFB75','\uFB76','\uFB78','\uFB79','\uFB7B',
        '\uFB7C','\uFB7E','\uFB7F','\uFB81','\uFB82','\uFB84','\uFB85','\uFB87','\uFB88','\uFB8A',
        '\uFB8B','\uFB8D','\uFB8E','\uFB90','\uFB91','\uFB93','\uFB94','\uFB96','\uFB97','\uFB99',
        '\uFB9A','\uFB9C','\uFB9D','\uFB9F','\uFBA0','\uFBA2','\uFBA3','\uFBA5','\uFBA6','\uFBA8',
        '\uFBA9','\uFBAB','\uFBAC','\uFBAE','\uFBAF','\uFBB1','\uFBB2','\uFBB4','\uFBB5','\uFBB7',
        '\uFBB8','\uFBBA','\uFBBB','\uFBBD','\uFBBE','\uFBC0','\uFBC1','\uFBD3','\uFBD4','\uFBD6',
        '\uFBD7','\uFBD9','\uFBDA','\uFBDC','\uFBDD','\uFBDF','\uFBE0','\uFBE2','\uFBE3','\uFBE5',
        '\uFBE6','\uFBE8','\uFBE9','\uFBEB'
    ];

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
        navBottom: document.getElementById('qr-nav-bottom'),
        prevBtn: document.getElementById('qr-prev-surah'),
        nextBtn: document.getElementById('qr-next-surah'),
        reciterSelect: document.getElementById('qr-reciter'),
        translationSelect: document.getElementById('qr-translation'),
        wbwToggle: document.getElementById('qr-wbw-toggle'),
        wbwToggleLabel: document.getElementById('qr-wbw-toggle-label'),
        wbwLangSelect: document.getElementById('qr-wbw-lang'),

        fixedPlayBar: document.getElementById('qr-fixed-play-bar'),
        playbarSurah: document.getElementById('qr-playbar-surah'),
        playbarVerse: document.getElementById('qr-playbar-verse'),
        playbarPlayPause: document.getElementById('qr-playbar-playpause'),
        playbarPrev: document.getElementById('qr-playbar-prev'),
        playbarNext: document.getElementById('qr-playbar-next'),
        playbarStop: document.getElementById('qr-playbar-stop'),
        continuePrompt: document.getElementById('qr-continue-prompt'),
        continueYes: document.getElementById('qr-continue-yes'),
        continueNo: document.getElementById('qr-continue-no'),

        footnotePopup: document.getElementById('qr-footnote-popup'),
        footnoteOverlay: document.getElementById('qr-footnote-overlay'),
        footnoteBody: document.getElementById('qr-footnote-body'),
        footnoteClose: document.getElementById('qr-footnote-close'),
        clearCache: document.getElementById('qr-clear-cache'),
    };

    if (!els.loading || !els.content) return;

    loadEssentialData(function () {
        init();
    });

    loadBackgroundTranslations();

    function setupNavToggle() {
        var qrNavbar = document.querySelector('.qr-navbar');
        if (!qrNavbar) return;
        var toggle = document.createElement('button');
        toggle.className = 'qr-nav-toggle';
        toggle.setAttribute('aria-label', 'Menu');
        toggle.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none"/></svg>';
        qrNavbar.appendChild(toggle);
        toggle.addEventListener('click', function(e) {
            e.stopPropagation();
            qrNavbar.classList.toggle('qr-nav-open');
        });
        document.addEventListener('click', function(e) {
            if (qrNavbar.classList.contains('qr-nav-open') && !qrNavbar.contains(e.target)) {
                qrNavbar.classList.remove('qr-nav-open');
            }
        });
    }

    function init() {
        renderSurahList();
        populateTranslationDropdown();
        setupSidebarToggle();
        setupNavToggle();
        setupSearch();
        setupEventListeners();
        setupPlaybar();
        setupFootnotePopup();
        setupClearCache();
        setupWbwToggle();

        var savedReciter = localStorage.getItem('audio-voice-name');
        if (savedReciter === 'Sudais' || savedReciter === 'Alafasy') {
            els.reciterSelect.value = savedReciter;
            currentReciter = savedReciter;
        }

        var savedTrans = localStorage.getItem('quran-translation');
        if (savedTrans && window.__QURAN_TRANSLATIONS && window.__QURAN_TRANSLATIONS[savedTrans]) {
            els.translationSelect.value = savedTrans;
            currentTranslation = savedTrans;
        }

        var savedWbw = localStorage.getItem('quran-wbw');
        if (savedWbw === 'true') {
            els.wbwToggle.checked = true;
            if (els.wbwLangSelect) els.wbwLangSelect.classList.add('show');
        }

        if (els.wbwLangSelect) {
            var savedWbwLang = localStorage.getItem('quran-wbw-lang') || 'auto';
            els.wbwLangSelect.value = savedWbwLang;
        }

        initDropdowns();

        els.loading.style.display = 'none';
        els.content.style.display = 'block';

        var lastRead = localStorage.getItem('quran-last-read');
        var startSurah = 1;
        if (lastRead) { var p = lastRead.split(':'); startSurah = parseInt(p[0]) || 1; }
        loadSurah(startSurah);
    }

    function setupSidebarToggle() {
        var qrSvgBase = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="8" y1="6" x2="8" y2="18"/></svg>';
        var qrSvgExpHover = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="8" y1="6" x2="8" y2="18"/><polyline points="14,9 10,12 14,15"/></svg>';
        var qrSvgColHover = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="8" y1="6" x2="8" y2="18"/><polyline points="12,10 15,13 12,16"/></svg>';

        els.sidebarToggle.innerHTML =
            '<span class="qr-tv qr-tv-base">' + qrSvgBase + '</span>' +
            '<span class="qr-tv qr-tv-expanded-hover" style="display:none">' + qrSvgExpHover + '</span>' +
            '<span class="qr-tv qr-tv-collapsed-hover" style="display:none">' + qrSvgColHover + '</span>' +
            '<span class="qr-tv qr-tv-logo" style="display:none"></span>' +
            '<span class="qr-tv-tooltip" style="display:none"></span>';

        var qrTvBase = els.sidebarToggle.querySelector('.qr-tv-base');
        var qrTvExpHover = els.sidebarToggle.querySelector('.qr-tv-expanded-hover');
        var qrTvColHover = els.sidebarToggle.querySelector('.qr-tv-collapsed-hover');
        var qrTvLogo = els.sidebarToggle.querySelector('.qr-tv-logo');
        var qrTooltipEl = els.sidebarToggle.querySelector('.qr-tv-tooltip');
        var qrNavLogo = document.querySelector('.qr-nav-logo');
        var qrNavLogoImg = qrNavLogo ? qrNavLogo.querySelector('.qr-nav-logo-img') : null;

        if (qrNavLogoImg && qrTvLogo) {
            qrTvLogo.appendChild(qrNavLogoImg.cloneNode(true));
        }

        function qrShow(el) {
            [qrTvBase, qrTvExpHover, qrTvColHover, qrTvLogo].forEach(function(e) { if (e) e.style.display = 'none'; });
            if (el) el.style.display = 'flex';
        }

        function qrIsHidden() {
            if (window.innerWidth <= 768) {
                return !els.sidebar.classList.contains('open');
            }
            return document.body.classList.contains('qr-sidebar-hidden');
        }

        function updateQrToggleIcons() {
            var isHidden = qrIsHidden();
            els.sidebarToggle.classList.toggle('qr-hidden', isHidden);
            if (isHidden) {
                qrShow(qrTvLogo);
                if (qrNavLogoImg) qrNavLogoImg.style.display = 'none';
            } else {
                qrShow(qrTvBase);
                if (qrNavLogoImg) qrNavLogoImg.style.display = '';
            }
            els.sidebarToggle.setAttribute('aria-expanded', isHidden ? 'false' : 'true');
            if (qrTooltipEl) qrTooltipEl.style.display = 'none';
        }

        // On mobile start with qr-sidebar-hidden cleared to avoid CSS conflict
        if (window.innerWidth <= 768) {
            document.body.classList.remove('qr-sidebar-hidden');
        }

        updateQrToggleIcons();

        els.sidebarToggle.addEventListener('mouseenter', function() {
            var isHidden = qrIsHidden();
            if (isHidden) {
                qrTvColHover.style.display = 'flex';
                if (qrTvLogo) qrTvLogo.style.visibility = 'hidden';
            } else {
                qrShow(qrTvExpHover);
            }
            if (qrTooltipEl) {
                qrTooltipEl.textContent = isHidden ? 'Open surahs' : 'Close surahs';
                qrTooltipEl.style.display = 'block';
            }
        });

        els.sidebarToggle.addEventListener('mouseleave', function() {
            if (qrTvLogo) qrTvLogo.style.visibility = '';
            if (qrTooltipEl) qrTooltipEl.style.display = 'none';
            updateQrToggleIcons();
        });

        els.sidebarToggle.addEventListener('click', function () {
            if (window.innerWidth <= 768) {
                els.sidebar.classList.toggle('open');
            } else {
                document.body.classList.toggle('qr-sidebar-hidden');
            }
            updateQrToggleIcons();
        });
    }

    function setupSearch() {
        els.surahSearch.addEventListener('input', function () {
            var q = this.value.toLowerCase().trim();
            els.surahList.querySelectorAll('.qr-surah-item').forEach(function (item) {
                var en = (item.getAttribute('data-en') || '').toLowerCase();
                var ar = item.getAttribute('data-ar') || '';
                var num = item.getAttribute('data-num') || '';
                item.style.display = (!q || en.indexOf(q) !== -1 || ar.indexOf(q) !== -1 || num === q) ? '' : 'none';
            });
        });
    }

    function setupEventListeners() {
        els.reciterSelect.addEventListener('change', function () {
            currentReciter = this.value;
            localStorage.setItem('audio-voice-name', this.value);
            loadReciterMetadata(this.value);
            stopAudio();
        });

        els.translationSelect.addEventListener('change', function () {
            currentTranslation = this.value;
            localStorage.setItem('quran-translation', this.value);
            if (currentSurah) {
                var ch = chapters[currentSurah - 1];
                if (ch) renderVerses(ch);
            }
        });

        if (els.wbwLangSelect) {
            els.wbwLangSelect.addEventListener('change', function () {
                localStorage.setItem('quran-wbw-lang', this.value);
                if (currentSurah && els.wbwToggle && els.wbwToggle.checked) {
                    var ch = chapters[currentSurah - 1];
                    if (ch) renderVerses(ch);
                }
            });
        }

        els.prevBtn.addEventListener('click', function () {
            if (currentSurah > 1) loadSurah(currentSurah - 1);
        });
        els.nextBtn.addEventListener('click', function () {
            if (currentSurah < 114) loadSurah(currentSurah + 1);
        });
    }

    function setupPlaybar() {
        els.playbarPlayPause.addEventListener('click', function () {
            if (isPlaying) { togglePause(); return; }
            if (!currentSurah) return;
            var ch = chapters[currentSurah - 1];
            if (!ch) return;
            var lastRead = localStorage.getItem('quran-last-read');
            var startV = 1;
            if (lastRead) { var p = lastRead.split(':'); if (parseInt(p[0]) === ch.id) startV = parseInt(p[1]) || 1; }
            playFromVerse(ch.id, startV, false);
        });
        els.playbarPrev.addEventListener('click', playPrev);
        els.playbarNext.addEventListener('click', playNext);
        els.playbarStop.addEventListener('click', stopAudio);
        els.continueYes.addEventListener('click', continuePlay);
        els.continueNo.addEventListener('click', function () { stopAudio(); hideContinuePrompt(); });
    }

    function setupFootnotePopup() {
        els.footnoteOverlay.addEventListener('click', closeFootnotePopup);
        els.footnoteClose.addEventListener('click', closeFootnotePopup);
    }

    function setupClearCache() {
        els.clearCache.addEventListener('click', function () {
            if (window.clearQuranCache) {
                window.clearQuranCache(function () {
                    location.reload();
                });
            }
        });
    }

    function setupWbwToggle() {
        els.wbwToggle.addEventListener('change', function () {
            localStorage.setItem('quran-wbw', this.checked ? 'true' : 'false');
            if (els.wbwLangSelect) {
                els.wbwLangSelect.classList.toggle('show', this.checked);
            }
            if (this.checked) {
                loadWbwData(function () {
                    if (currentSurah) {
                        var ch = chapters[currentSurah - 1];
                        if (ch) renderVerses(ch);
                    }
                });
            } else {
                if (currentSurah) {
                    var ch = chapters[currentSurah - 1];
                    if (ch) renderVerses(ch);
                }
            }
        });
    }

    function populateTranslationDropdown() {
        var registry = window.__QURAN_TRANSLATIONS || {};
        var keys = Object.keys(registry);
        keys.forEach(function (key) {
            var opt = document.createElement('option');
            opt.value = key;
            opt.textContent = registry[key].name;
            els.translationSelect.appendChild(opt);
        });
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
            html += '<span class="qr-bookmark-star" data-surah="' + ch.id + '"><svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></span>';
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

        updateSidebarBookmarks();
        scrollToLastReadVerse(ch);
    }

    function renderSurahHeader(ch) {
        var revLabel = ch.revelation_place === 'makkah' ? 'Meccan' : 'Medinan';
        var html = '';
        html += '<div class="qr-surah-header-name-ar" dir="rtl">' + SURAH_LIGATURES[ch.id - 1] + '</div>';
        html += '<div class="qr-surah-header-name-en">Surah ' + escapeHtml(ch.en) + '</div>';
        html += '<div class="qr-surah-header-meta">';
        html += '<span><span class="meta-label">Verses:</span> <span class="meta-value">' + ch.verses + '</span></span>';
        html += '<span class="meta-divider">|</span>';
        html += '<span><span class="meta-label">Revealed:</span> <span class="meta-value">' + revLabel + '</span></span>';
        html += '<span class="meta-divider">|</span>';
        html += '<span><span class="meta-label">Order:</span> <span class="meta-value">' + ch.revelation_order + '</span></span>';
        html += '</div>';

        if (ch.id !== 9) {
            html += '<div class="qr-surah-header-bismillah">\u0628\u0650\u0633\u0652\u0645\u0650 \u0671\u0644\u0644\u064e\u0651\u0647\u0650 \u0671\u0644\u0631\u064e\u0651\u062d\u0652\u0645\u064e\u0670\u0646\u0650 \u0671\u0644\u0631\u064e\u0651\u062d\u0650\u064a\u0645\u0650</div>';
        }

        els.surahHeader.innerHTML = html;
        document.fonts.ready.then(function() {
            var el = els.surahHeader.querySelector('.qr-surah-header-name-ar');
            if (el) el.style.opacity = '1';
        });
    }

    function renderVerses(ch) {
        var indopakData = getCachedData('indopak-nastaleeq-verse');
        var transData = getCurrentTranslationData();
        var wbwMode = els.wbwToggle && els.wbwToggle.checked;
        var wbwWordData = wbwMode ? getCachedData('indopak-nastaleeq-word') : null;
        var wbwTransData = wbwMode ? getCurrentWbwData() : null;
        var bookmarks = getBookmarks();
        var html = '';

        for (var v = 1; v <= ch.verses; v++) {
            var key = ch.id + ':' + v;
            var verse = indopakData ? indopakData[key] : null;
            var transEntry = transData ? transData[key] : null;
            var transText = transEntry ? extractTranslationText(transEntry.t || '') : '';
            var hasFootnotes = transEntry && transEntry.t && transEntry.t.indexOf('[[') !== -1;
            var isBm = bookmarks.indexOf(key) !== -1;

            var chPad = pad(ch.id, 3);
            var vPad = pad(v, 3);

            html += '<div class="qr-verse-row' + (wbwMode ? ' wbw-active' : '') + '" id="row-' + key.replace(':', '-') + '" data-key="' + key + '">';

            // Arabic column
            html += '<div class="qr-verse-arabic" id="ar-' + key.replace(':', '-') + '" dir="rtl">';
            if (wbwMode && wbwWordData && wbwTransData) {
                var wIdx = 1;
                var anyWordRendered = false;
                while (wbwWordData[key + ':' + wIdx]) {
                    var wordObj = wbwWordData[key + ':' + wIdx];
                    var wbwTrans = wbwTransData[key + ':' + wIdx] || '';
                    var isArabicLetter = /[\u0600-\u06FF]/.test(wordObj.text);
                    if (!isArabicLetter && !wbwTrans) { wIdx++; continue; }
                    html += '<span class="qr-word-unit">';
                    html += '<span class="qr-word-arabic">' + wordObj.text + '</span>';
                    if (wbwTrans) {
                        html += '<span class="qr-word-trans">' + escapeHtml(wbwTrans) + '</span>';
                    }
                    html += '</span>';
                    anyWordRendered = true;
                    wIdx++;
                }
                if (!anyWordRendered && verse) {
                    html += verse.text;
                }
            } else {
                html += verse ? verse.text : '';
            }
            html += '</div>';

            // Controls column
            html += '<div class="qr-verse-controls">';
            html += '<span class="qr-verse-tnum">' + v + '</span>';
            html += '<button class="qr-verse-tbookmark' + (isBm ? ' bookmarked' : '') + '" data-key="' + key + '" aria-label="Bookmark">';
            html += '<svg viewBox="0 0 24 24" width="14" height="14" fill="' + (isBm ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
            html += '</button>';
            html += '<button class="qr-verse-tplay" data-chapter="' + ch.id + '" data-verse="' + v + '" data-chpad="' + chPad + '" data-vpad="' + vPad + '" aria-label="Play"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg></button>';
            html += '</div>';

            // Translation column
            html += '<div class="qr-verse-translation">';
            if (transText) {
                html += escapeHtml(transText);
                if (hasFootnotes) {
                    html += '<button class="qr-verse-footnote-btn" data-key="' + key + '" title="View footnotes">\u2139</button>';
                }
            }
            html += '</div>';
            html += '</div>';
        }

        els.verses.innerHTML = html;

        els.verses.querySelectorAll('.qr-verse-tbookmark').forEach(function (btn) {
            btn.addEventListener('click', function (e) { e.stopPropagation(); toggleBookmark(this.getAttribute('data-key')); });
        });

        els.verses.querySelectorAll('.qr-verse-tplay').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                playFromVerse(parseInt(this.getAttribute('data-chapter')), parseInt(this.getAttribute('data-verse')), true);
            });
        });

        els.verses.querySelectorAll('.qr-verse-footnote-btn').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var key = this.getAttribute('data-key');
                var transData = getCurrentTranslationData();
                var entry = transData ? transData[key] : null;
                var notes = extractFootnotes(entry);
                if (notes.length > 0) {
                    showFootnotePopup(notes);
                }
            });
        });
    }

    /* ---- Data loading ---- */

    function loadEssentialData(callback) {
        var loaded = 0;
        var total = 2;

        function checkDone() {
            loaded++;
            if (loaded >= total && callback) callback();
        }

        loadFromCacheOrFetch(
            'indopak-nastaleeq-verse',
            'js/quran_source/indopak-nastaleeq-verse.json',
            function () { checkDone(); }
        );

        var defaultTrans = window.__QURAN_TRANSLATIONS && window.__QURAN_TRANSLATIONS.hilali;
        if (defaultTrans) {
            loadFromCacheOrFetch(
                defaultTrans.file,
                'js/quran_source/' + defaultTrans.file + '.json',
                function () { checkDone(); }
            );
        } else {
            checkDone();
        }
    }

    function loadBackgroundTranslations() {
        var registry = window.__QURAN_TRANSLATIONS || {};
        var keys = Object.keys(registry);
        keys.forEach(function (key) {
            var t = registry[key];
            if (t.file === 'taqi-ud-din-al-hilali-muhsin-khan-inline-footnotes') return;
            if (getCachedData(t.file)) return;
            loadFromCacheOrFetch(t.file, 'js/quran_source/' + t.file + '.json', function () {});
        });

        if (!getCachedData('english-wbw-translation')) {
            loadFromCacheOrFetch('english-wbw-translation', 'js/quran_source/english-wbw-translation.json', function () {});
        }
        if (!getCachedData('tamil-wbw-translation')) {
            loadFromCacheOrFetch('tamil-wbw-translation', 'js/quran_source/tamil-wbw-translation.json', function () {});
        }
    }

    function loadReciterMetadata(reciter, callback) {
        if (_reciterMetaLoading[reciter]) return;
        _reciterMetaLoading[reciter] = true;
        var cfg = RECITER_CFG[reciter];
        if (!cfg || reciter === 'Sudais' || reciter === 'Alafasy') {
            if (callback) callback();
            return;
        }
        if (reciter === 'MinshawiKids') {
            loadFromCacheOrFetch('surah-json', 'js/quran_source/surah.json', function (data) {
                if (data) SURAH_META = data;
                _reciterMetaLoading[reciter] = false;
                if (callback) callback();
            });
        } else if (reciter === 'YasserAlDosari') {
            loadFromCacheOrFetch('dosari-json', 'js/quran_source/ayah-recitation-yasser-al-dosari-murattal-hafs-961.json', function (data) {
                if (data) DOSARI_META = data;
                _reciterMetaLoading[reciter] = false;
                if (callback) callback();
            });
        } else {
            _reciterMetaLoading[reciter] = false;
            if (callback) callback();
        }
    }

    function getAudioUrl(item) {
        var cfg = RECITER_CFG[currentReciter];
        if (!cfg) return null;
        if (cfg.type === 'per-surah') {
            var meta = SURAH_META[String(item.chapter)];
            if (meta && meta.audio_url) return meta.audio_url;
            return null;
        }
        var chPad = cfg.padCh ? pad(item.chapter, 3) : String(item.chapter);
        var vrPad = cfg.padVr ? pad(item.verse, 3) : String(item.verse);
        return cfg.url + chPad + vrPad + '.mp3';
    }

    function loadWbwData(callback) {
        var wordKey = 'indopak-nastaleeq-word';
        var cachedWord = getCachedData(wordKey);

        var lang = getWbwLang();
        var wbwFile = lang === 'ta' ? 'tamil-wbw-translation' : 'english-wbw-translation';
        var cachedWbw = getCachedData(wbwFile);

        if (cachedWord && cachedWbw) {
            if (callback) callback();
            return;
        }

        var wbwLabel = els.wbwToggleLabel.querySelector('.qr-wbw-label');
        var origText = wbwLabel ? wbwLabel.textContent : '';
        if (wbwLabel) wbwLabel.textContent = 'Loading...';

        var loadedCount = 0;
        function checkWbwDone() {
            loadedCount++;
            if (loadedCount >= 2) {
                if (wbwLabel) wbwLabel.textContent = origText;
                if (callback) callback();
            }
        }

        if (!cachedWord) {
            if (typeof Worker !== 'undefined') {
                var worker = new Worker('js/quran-loader-worker.js');
                worker.postMessage({
                    file: wordKey,
                    url: 'js/quran_source/indopak-nastaleeq-word.json'
                });
                worker.onmessage = function (e) {
                    if (e.data.status === 'done') {
                        window.__QURAN_CACHE[wordKey] = e.data.data;
                        worker.terminate();
                        checkWbwDone();
                    } else if (e.data.status === 'error') {
                        worker.terminate();
                        fetchAndCacheFallback(wordKey, 'js/quran_source/indopak-nastaleeq-word.json', checkWbwDone);
                    }
                };
                worker.onerror = function () {
                    worker.terminate();
                    fetchAndCacheFallback(wordKey, 'js/quran_source/indopak-nastaleeq-word.json', checkWbwDone);
                };
            } else {
                fetchAndCacheFallback(wordKey, 'js/quran_source/indopak-nastaleeq-word.json', checkWbwDone);
            }
        } else {
            checkWbwDone();
        }

        if (!cachedWbw) {
            loadFromCacheOrFetch(wbwFile, 'js/quran_source/' + wbwFile + '.json', function () {
                checkWbwDone();
            });
        } else {
            checkWbwDone();
        }
    }

    function fetchAndCacheFallback(fileKey, url, callback) {
        fetch(url)
            .then(function (r) { return r.json(); })
            .then(function (data) {
                window.__QURAN_CACHE[fileKey] = data;
                if (callback) callback(data);
            })
            .catch(function () { if (callback) callback(null); });
    }

    /* ---- Translation helpers ---- */

    function getCurrentTranslationData() {
        var registry = window.__QURAN_TRANSLATIONS || {};
        var entry = registry[currentTranslation];
        return entry ? getCachedData(entry.file) : null;
    }

    function getWbwLang() {
        var saved = localStorage.getItem('quran-wbw-lang') || 'auto';
        if (saved !== 'auto') return saved;
        var registry = window.__QURAN_TRANSLATIONS || {};
        var entry = registry[currentTranslation];
        return entry && entry.lang === 'ta' ? 'ta' : 'en';
    }

    function getCurrentWbwData() {
        var lang = getWbwLang();
        var wbwFile = lang === 'ta' ? 'tamil-wbw-translation' : 'english-wbw-translation';
        return getCachedData(wbwFile) || null;
    }

    function extractTranslationText(text) {
        if (!text) return '';
        return text.replace(/\[\[[^\]]*\]\]/g, '').trim();
    }

    function extractFootnotes(entry) {
        if (!entry || !entry.t) return [];
        var notes = [];
        entry.t.replace(/\[\[([^\]]*)\]\]/g, function (match, content) {
            notes.push(content.trim());
            return '';
        });
        return notes;
    }

    function showFootnotePopup(notes) {
        var html = notes.map(function (n, i) {
            return '<p><sup>' + (i + 1) + '</sup> ' + escapeHtml(n) + '</p>';
        }).join('');
        els.footnoteBody.innerHTML = html;
        els.footnotePopup.style.display = 'flex';
    }

    function closeFootnotePopup() {
        els.footnotePopup.style.display = 'none';
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
            btn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="' + (on ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
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

    function playFromVerse(chapterId, verseNum, singleOnly) {
        stopAudio();
        hideContinuePrompt();

        var ch = chapters[chapterId - 1];
        if (!ch) return;

        isSinglePlay = !!singleOnly;
        singlePlayChapter = ch;

        audioQueue = [];
        if (singleOnly) {
            audioQueue.push({ chapter: chapterId, verse: verseNum, key: chapterId + ':' + verseNum });
        } else {
            for (var v = verseNum; v <= ch.verses; v++) {
                audioQueue.push({ chapter: chapterId, verse: v, key: chapterId + ':' + v });
            }
        }
        if (audioQueue.length === 0) return;
        isPlaying = true;
        isPaused = false;

        showFixedBar(ch, verseNum);
        updatePlayPauseIcon();
        playNextAudio();
    }

    function playNextAudio() {
        var gen = ++audioGen;

        if (!isPlaying || audioQueue.length === 0) {
            if (isSinglePlay && singlePlayChapter) {
                showContinuePrompt(singlePlayChapter);
            } else {
                finishAudio();
            }
            return;
        }

        var item = audioQueue[0];
        var url = getAudioUrl(item);

        document.querySelectorAll('.qr-verse-row.playing').forEach(function (el) { el.classList.remove('playing'); });

        var ch = chapters[item.chapter - 1];
        var rowId = 'row-' + item.chapter + '-' + item.verse;
        var rowEl = document.getElementById(rowId);
        if (rowEl) {
            rowEl.classList.add('playing');
            rowEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }

        updateFixedBar(item, ch);
        lastPlayedVerse = item.verse;

        var cfg = RECITER_CFG[currentReciter];
        var isPerSurah = cfg && cfg.type === 'per-surah';
        var isDosari = currentReciter === 'YasserAlDosari';
        var dosariEntry = isDosari ? (DOSARI_META[item.key] || null) : null;

        if (isPerSurah && audioEl && audioEl.src && audioEl.src.indexOf(String(item.chapter) + '.mp3') !== -1 && !audioEl.ended) {
            updateWbwVerseHighlight(item);
            audioQueue.shift();
            if (audioQueue.length > 0 && audioQueue[0].chapter === item.chapter) {
                setTimeout(playNextAudio, 200);
            } else {
                playNextAudio();
            }
            return;
        }

        var newAudio = new Audio(url);
        newAudio.addEventListener('timeupdate', function () {
            updateWbwVerseHighlight(item);
            if (isDosari && dosariEntry && dosariEntry.segments) {
                updateDosariWordHighlight(item, dosariEntry.segments, newAudio.currentTime * 1000);
            }
        });
        newAudio.addEventListener('ended', function () {
            if (gen !== audioGen) return;
            audioQueue.shift();
            playNextAudio();
        });
        newAudio.addEventListener('error', function () {
            if (gen !== audioGen) return;
            audioQueue.shift();
            playNextAudio();
        });
        newAudio.play().catch(function () {
            if (gen !== audioGen) return;
            audioQueue.shift();
            playNextAudio();
        });
        audioEl = newAudio;
    }

    function updateWbwVerseHighlight(item) {
        var rowId = 'row-' + item.chapter + '-' + item.verse;
        var rowEl = document.getElementById(rowId);
        if (rowEl) {
            rowEl.classList.add('playing');
        }
        var cfg = RECITER_CFG[currentReciter];
        if (!cfg || cfg.type !== 'per-surah') return;
        var ch = chapters[item.chapter - 1];
        if (!ch) return;
        var meta = SURAH_META[String(item.chapter)];
        if (!meta || !meta.duration) return;
        if (!audioEl || audioEl.duration <= 0) return;
        var progress = (audioEl.currentTime / meta.duration) * 100;
        var verseDur = 100 / ch.verses;
        var expectedVerse = Math.floor(progress / verseDur) + 1;
        if (expectedVerse > ch.verses) expectedVerse = ch.verses;
        if (expectedVerse !== item.verse) {
            var nextRowId = 'row-' + item.chapter + '-' + expectedVerse;
            var nextRow = document.getElementById(nextRowId);
            if (nextRow) nextRow.classList.add('playing');
        }
    }

    function updateDosariWordHighlight(item, segments, currentTimeMs) {
        var rowId = 'row-' + item.chapter + '-' + item.verse;
        var rowEl = document.getElementById(rowId);
        if (!rowEl) return;
        var activeWord = null;
        for (var i = 0; i < segments.length; i++) {
            var seg = segments[i];
            if (currentTimeMs >= seg[1] && currentTimeMs < seg[2]) {
                activeWord = seg[0];
                break;
            }
        }
        var wordUnits = rowEl.querySelectorAll('.qr-word-unit');
        wordUnits.forEach(function (w, idx) {
            if (activeWord !== null && idx + 1 === activeWord) {
                w.style.background = 'rgba(79,70,229,0.2)';
            } else {
                w.style.background = '';
            }
        });
    }

    function togglePause() {
        if (!isPlaying) return;
        if (isPaused) { resumeAudio(); } else { pauseAudio(); }
    }

    function pauseAudio() {
        if (!audioEl || !isPlaying) return;
        isPaused = true;
        audioEl.pause();
        els.fixedPlayBar.classList.remove('playing');
        updatePlayPauseIcon();
    }

    function resumeAudio() {
        if (!isPlaying) return;
        isPaused = false;
        if (audioEl) {
            audioEl.play().catch(function () {});
        } else if (audioQueue.length > 0) {
            playNextAudio();
        }
        els.fixedPlayBar.classList.add('playing');
        updatePlayPauseIcon();
    }

    function playNext() {
        if (!isPlaying || audioQueue.length <= 1) return;
        ++audioGen;
        if (audioEl) { audioEl.pause(); audioEl.src = ''; }
        audioEl = null;
        audioQueue.shift();
        if (audioQueue.length > 0) {
            isPaused = false;
            updatePlayPauseIcon();
            playNextAudio();
        }
    }

    function playPrev() {
        if (!isPlaying || audioQueue.length === 0) return;
        var first = audioQueue[0];
        if (!first) return;
        var prevVerse = first.verse - 1;
        if (prevVerse < 1) return;
        var ch = chapters[first.chapter - 1];
        if (!ch) return;
        ++audioGen;
        if (audioEl) { audioEl.pause(); audioEl.src = ''; }
        audioEl = null;
        audioQueue.unshift({ chapter: first.chapter, verse: prevVerse, key: first.chapter + ':' + prevVerse });
        isPaused = false;
        updatePlayPauseIcon();
        playNextAudio();
    }

    function stopAudio() {
        ++audioGen;
        isPlaying = false;
        isPaused = false;
        isSinglePlay = false;
        singlePlayChapter = null;
        lastPlayedVerse = 0;
        hideContinuePrompt();
        if (audioEl) { audioEl.pause(); audioEl.src = ''; audioEl = null; }
        audioQueue = [];
        document.querySelectorAll('.qr-verse-row.playing').forEach(function (el) { el.classList.remove('playing'); });
        els.fixedPlayBar.classList.remove('playing');
        updatePlayPauseIcon();
    }

    function finishAudio() {
        ++audioGen;
        isPlaying = false;
        isPaused = false;
        isSinglePlay = false;
        singlePlayChapter = null;
        lastPlayedVerse = 0;
        hideContinuePrompt();
        if (audioEl) { audioEl.pause(); audioEl.src = ''; audioEl = null; }
        audioQueue = [];
        document.querySelectorAll('.qr-verse-row.playing').forEach(function (el) { el.classList.remove('playing'); });
        els.fixedPlayBar.classList.remove('playing');
        updatePlayPauseIcon();
    }

    function showFixedBar(ch, verseNum) {
        els.playbarSurah.textContent = ch.en;
        els.playbarVerse.textContent = 'Verse ' + verseNum;
        els.fixedPlayBar.classList.add('playing');
    }

    function updateFixedBar(item, ch) {
        if (ch) els.playbarSurah.textContent = ch.en;
        els.playbarVerse.textContent = 'Verse ' + item.verse;
    }

    function updatePlayPauseIcon() {
        var pauseIcon = els.playbarPlayPause.querySelector('.qr-playbar-pause-icon');
        var playIcon = els.playbarPlayPause.querySelector('.qr-playbar-play-icon');
        if (!pauseIcon || !playIcon) return;
        if (!isPlaying || isPaused) {
            pauseIcon.style.display = 'none';
            playIcon.style.display = 'block';
            els.playbarPlayPause.setAttribute('aria-label', 'Play');
            els.fixedPlayBar.classList.remove('playing');
        } else {
            pauseIcon.style.display = 'block';
            playIcon.style.display = 'none';
            els.playbarPlayPause.setAttribute('aria-label', 'Pause');
            els.fixedPlayBar.classList.add('playing');
        }
    }

    function showContinuePrompt(ch) {
        if (!els.continuePrompt) return;
        els.continuePrompt.style.display = 'flex';
    }

    function hideContinuePrompt() {
        if (els.continuePrompt) els.continuePrompt.style.display = 'none';
    }

    function continuePlay() {
        hideContinuePrompt();
        if (!singlePlayChapter) return;
        var startVerse = lastPlayedVerse > 0 ? lastPlayedVerse + 1 : 1;
        if (startVerse > singlePlayChapter.verses) { stopAudio(); return; }
        isSinglePlay = false;
        audioQueue = [];
        for (var v = startVerse; v <= singlePlayChapter.verses; v++) {
            audioQueue.push({ chapter: singlePlayChapter.id, verse: v, key: singlePlayChapter.id + ':' + v });
        }
        if (audioQueue.length > 0) {
            isPlaying = true;
            isPaused = false;
            updatePlayPauseIcon();
            playNextAudio();
        }
    }

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

    /* ---- Custom dropdowns ---- */

    function initDropdowns() {
        document.querySelectorAll('.qr-dropdown').forEach(function (container) {
            var native = container.querySelector('.qr-nav-select');
            if (!native) return;

            var trigger = document.createElement('button');
            trigger.type = 'button';
            trigger.className = 'qr-dropdown-trigger';
            trigger.setAttribute('aria-haspopup', 'listbox');
            trigger.setAttribute('aria-expanded', 'false');

            var valueSpan = document.createElement('span');
            valueSpan.className = 'qr-dropdown-value';
            trigger.appendChild(valueSpan);

            var chevronNS = 'http://www.w3.org/2000/svg';
            var chevron = document.createElementNS(chevronNS, 'svg');
            chevron.setAttribute('viewBox', '0 0 24 24');
            chevron.setAttribute('width', '14');
            chevron.setAttribute('height', '14');
            chevron.setAttribute('fill', 'none');
            chevron.setAttribute('stroke', 'currentColor');
            chevron.setAttribute('stroke-width', '2.5');
            chevron.setAttribute('stroke-linecap', 'round');
            chevron.classList.add('qr-dropdown-chevron');
            var polyline = document.createElementNS(chevronNS, 'polyline');
            polyline.setAttribute('points', '6,9 12,15 18,9');
            chevron.appendChild(polyline);
            trigger.appendChild(chevron);

            var menu = document.createElement('ul');
            menu.className = 'qr-dropdown-menu';
            menu.setAttribute('role', 'listbox');
            var menuId = native.id + '-dropdown-menu';
            menu.id = menuId;
            trigger.setAttribute('aria-controls', menuId);

            function buildOptions() {
                menu.innerHTML = '';
                Array.from(native.options).forEach(function (opt) {
                    var li = document.createElement('li');
                    li.className = 'qr-dropdown-option';
                    li.setAttribute('role', 'option');
                    li.setAttribute('data-value', opt.value);
                    var isSel = opt.selected;
                    li.setAttribute('aria-selected', isSel ? 'true' : 'false');

                    var check = document.createElement('span');
                    check.className = 'qr-dropdown-option-check';
                    check.innerHTML = isSel ? '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20,6 9,17 4,12"/></svg>' : '';
                    li.appendChild(check);

                    var txt = document.createElement('span');
                    txt.textContent = opt.textContent;
                    li.appendChild(txt);

                    menu.appendChild(li);
                });
            }

            function syncFromNative() {
                valueSpan.textContent = native.options[native.selectedIndex] ? native.options[native.selectedIndex].textContent : '';
                buildOptions();
            }

            syncFromNative();

            container.appendChild(trigger);
            container.appendChild(menu);

            var isOpen = false;
            var hlIdx = -1;

            function openMenu() {
                isOpen = true;
                container.classList.add('is-open');
                trigger.setAttribute('aria-expanded', 'true');
                hlIdx = Array.from(menu.children).findIndex(function (el) {
                    return el.getAttribute('aria-selected') === 'true';
                });
                if (hlIdx < 0) hlIdx = 0;
                var items = menu.children;
                for (var i = 0; i < items.length; i++) items[i].classList.toggle('is-highlighted', i === hlIdx);
                if (items[hlIdx]) items[hlIdx].scrollIntoView({ block: 'nearest' });
                menu.focus({ preventScroll: true });
            }

            function closeMenu(restoreFocus) {
                isOpen = false;
                container.classList.remove('is-open');
                trigger.setAttribute('aria-expanded', 'false');
                menu.querySelectorAll('.is-highlighted').forEach(function (el) { el.classList.remove('is-highlighted'); });
                if (restoreFocus !== false) trigger.focus();
            }

            function selectItem(li) {
                if (!li) return;
                var val = li.getAttribute('data-value');
                native.value = val;
                syncFromNative();
                native.dispatchEvent(new Event('change', { bubbles: true }));
                closeMenu();
            }

            trigger.addEventListener('click', function (e) {
                e.stopPropagation();
                isOpen ? closeMenu() : openMenu();
            });

            menu.addEventListener('click', function (e) {
                var li = e.target.closest('[role="option"]');
                if (li) selectItem(li);
            });

            trigger.addEventListener('keydown', function (e) {
                if ((e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') && !isOpen) {
                    e.preventDefault(); openMenu(); return;
                }
                if (e.key === 'Escape' && isOpen) { e.preventDefault(); closeMenu(); }
            });

            menu.addEventListener('keydown', function (e) {
                var items = menu.querySelectorAll('[role="option"]');
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    hlIdx = Math.min(hlIdx + 1, items.length - 1);
                    items.forEach(function (el, i) { el.classList.toggle('is-highlighted', i === hlIdx); });
                    if (items[hlIdx]) items[hlIdx].scrollIntoView({ block: 'nearest' });
                }
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    hlIdx = Math.max(hlIdx - 1, 0);
                    items.forEach(function (el, i) { el.classList.toggle('is-highlighted', i === hlIdx); });
                    if (items[hlIdx]) items[hlIdx].scrollIntoView({ block: 'nearest' });
                }
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    var hl = menu.querySelector('.is-highlighted');
                    if (hl) selectItem(hl);
                }
                if (e.key === 'Escape') {
                    e.preventDefault(); closeMenu();
                }
            });

            document.addEventListener('click', function (e) {
                if (isOpen && !container.contains(e.target)) closeMenu(false);
            });
        });
    }

    /* Mobile sidebar: tap outside to close */
    document.addEventListener('click', function (e) {
        if (window.innerWidth <= 768) {
            if (els.sidebar.classList.contains('open') && !els.sidebar.contains(e.target) && !els.sidebarToggle.contains(e.target)) {
                els.sidebar.classList.remove('open');
            }
        }
    });

})();
