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

    var _fnNotes = {};
    var tafsirState = null;
    var tafsirPinned = false;
    var tafsirSize = 16;

    var RECITER_CFG = {
        Sudais:  { segKey: 'segments-sudais',  segFile: 'js/quran_source/segments/sudais.js',  mode: 'ayah' },
        Shuraim: { segKey: 'segments-shuraim', segFile: 'js/quran_source/segments/shuraim.js', mode: 'surah' },
        Alafasy: { segKey: 'segments-afasy',   segFile: 'js/quran_source/segments/afasy.js',   mode: 'surah' },
        YasserAlDosari: { segKey: 'segments-dussary', segFile: 'js/quran_source/segments/dussary.js', mode: 'surah' }
    };

    var arabicOrigMap = {};
    var _segCache = {};
    var _wordTimingCache = {};
    var _surahAudioSrc = null;

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

        tafsirLangSelect: document.getElementById('qr-tafsir-lang'),
        fnTooltip: document.getElementById('qr-fn-tooltip'),
        tafsirModalBackdrop: document.getElementById('qr-tafsir-modal-backdrop'),
        tafsirModal: document.getElementById('qr-tafsir-modal'),
        tafsirModalBody: document.getElementById('qr-tafsir-modal-body'),
        tafsirModalSource: document.getElementById('qr-tafsir-modal-source'),
        tafsirSurahAr: document.getElementById('qr-tafsir-surah-ar'),
        tafsirSurahEn: document.getElementById('qr-tafsir-surah-en'),
        tafsirVerse: document.getElementById('qr-tafsir-verse'),
        tafsirJump: document.getElementById('qr-tafsir-jump'),
        tafsirPrev: document.getElementById('qr-tafsir-prev'),
        tafsirNext: document.getElementById('qr-tafsir-next'),
        tafsirPin: document.getElementById('qr-tafsir-pin'),
        tafsirClose: document.getElementById('qr-tafsir-close'),
        tafsirModalLang: document.getElementById('qr-tafsir-modal-lang'),
        tafsirSizeDown: document.getElementById('qr-tafsir-size-down'),
        tafsirSizeUp: document.getElementById('qr-tafsir-size-up'),
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
        setupTafsirModal();
        setupFnTooltip();
        setupClearCache();
        setupWbwToggle();

        var savedReciter = localStorage.getItem('audio-voice-name');
        if (savedReciter && RECITER_CFG[savedReciter]) {
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

        if (els.tafsirLangSelect) {
            var savedTafsirLang = localStorage.getItem('quran-tafsir-lang') || 'ta';
            els.tafsirLangSelect.value = savedTafsirLang;
        }
        if (els.tafsirModalLang) {
            els.tafsirModalLang.value = localStorage.getItem('quran-tafsir-lang') || 'ta';
        }
        tafsirPinned = localStorage.getItem('quran-tafsir-pinned') === 'true';
        updatePinButton();
        var savedTafsirSize = parseInt(localStorage.getItem('quran-tafsir-size'), 10);
        if (!isNaN(savedTafsirSize) && savedTafsirSize >= 12 && savedTafsirSize <= 28) {
            tafsirSize = savedTafsirSize;
        }
        applyTafsirSize();

        initDropdowns();

        els.loading.style.display = 'none';
        els.content.style.display = 'block';

        var lastRead = localStorage.getItem('quran-last-read');
        var startSurah = 1;
        if (lastRead) { var p = lastRead.split(':'); startSurah = parseInt(p[0]) || 1; }
        loadSurah(startSurah);

        if (els.wbwToggle.checked) {
            loadWbwData(function () {
                var ch = chapters[currentSurah - 1];
                if (ch && els.wbwToggle.checked) renderVerses(ch);
            });
        }
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
            _wordTimingCache = {};
            stopAudio();
        });

        if (els.tafsirLangSelect) {
            els.tafsirLangSelect.addEventListener('change', function () {
                localStorage.setItem('quran-tafsir-lang', this.value);
                if (els.tafsirModalLang) els.tafsirModalLang.value = this.value;
                if (tafsirState) loadTafsirIntoModal();
            });
        }
        if (els.tafsirModalLang) {
            els.tafsirModalLang.addEventListener('change', function () {
                localStorage.setItem('quran-tafsir-lang', this.value);
                if (els.tafsirLangSelect) els.tafsirLangSelect.value = this.value;
                if (tafsirState) loadTafsirIntoModal();
            });
        }

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

    function setupTafsirModal() {
        if (!els.tafsirModalBackdrop) return;
        els.tafsirClose.addEventListener('click', closeTafsirModal);
        els.tafsirPrev.addEventListener('click', function () { tafsirStep(-1); });
        els.tafsirNext.addEventListener('click', function () { tafsirStep(1); });
        els.tafsirPin.addEventListener('click', function () {
            tafsirPinned = !tafsirPinned;
            localStorage.setItem('quran-tafsir-pinned', tafsirPinned ? 'true' : 'false');
            updatePinButton();
        });
        els.tafsirJump.addEventListener('change', function () {
            var val = parseInt(this.value, 10);
            if (!isNaN(val) && tafsirState) {
                tafsirState.ayah = val;
                openTafsirFor(tafsirState.ch, val);
            }
        });
        els.tafsirSizeDown.addEventListener('click', function () { adjustTafsirSize(-1); });
        els.tafsirSizeUp.addEventListener('click', function () { adjustTafsirSize(1); });
        els.tafsirModalBackdrop.addEventListener('click', function (e) {
            if (e.target === els.tafsirModalBackdrop && !tafsirPinned) closeTafsirModal();
        });
        document.addEventListener('keydown', function (e) {
            if (!els.tafsirModalBackdrop || els.tafsirModalBackdrop.hidden) return;
            if (e.key === 'Escape' && !tafsirPinned) {
                e.preventDefault();
                closeTafsirModal();
            } else if (e.key === 'ArrowLeft' && tafsirState) {
                tafsirStep(-1);
            } else if (e.key === 'ArrowRight' && tafsirState) {
                tafsirStep(1);
            }
        });
    }

    function setupFnTooltip() {
        if (!els.fnTooltip) return;
        els.fnTooltip.addEventListener('mousedown', function (e) { e.preventDefault(); });
        document.addEventListener('click', function (e) {
            if (e.target.closest && e.target.closest('.qr-fn-sup')) return;
            hideFnTooltip();
        });
        window.addEventListener('scroll', hideFnTooltip, true);
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
        if (els.tafsirModalBackdrop && !els.tafsirModalBackdrop.hidden) closeTafsirModal();
        hideFnTooltip();

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
            var isBm = bookmarks.indexOf(key) !== -1;

            var chPad = pad(ch.id, 3);
            var vPad = pad(v, 3);

            // Parse inline [[footnote]] markers once per verse into [seg, note] pairs
            var fnParts = [];
            var src = transEntry ? (transEntry.t || '') : '';
            if (src.indexOf('[[') !== -1) {
                var r = /\[\[([^\]]*)\]\]/g;
                var m;
                var lastPos = 0;
                while ((m = r.exec(src)) !== null) {
                    fnParts.push({ seg: src.slice(lastPos, m.index), note: m[1].trim() });
                    lastPos = r.lastIndex;
                }
                fnParts.push({ seg: src.slice(lastPos), note: '' });
            } else {
                fnParts.push({ seg: src, note: '' });
            }
            var transText = extractTranslationText(src);

            var transHtml = '';
            for (var pi = 0; pi < fnParts.length; pi++) {
                var piece = fnParts[pi];
                if (piece.seg) transHtml += escapeHtml(piece.seg);
                if (piece.note) {
                    var fnKey = key + ':fn' + (pi + 1);
                    _fnNotes[fnKey] = { verseKey: key, text: piece.note };
                    transHtml += '<sup class="qr-fn-sup" role="button" tabindex="0" data-fnkey="' + fnKey + '" data-verse="' + v + '" data-num="' + (pi + 1) + '" aria-label="Footnote ' + (pi + 1) + '" title="Footnote ' + (pi + 1) + '">' + (pi + 1) + '</sup>';
                }
            }
            if (!transHtml && transText) transHtml = escapeHtml(transText);

            html += '<div class="qr-verse-row' + (wbwMode ? ' wbw-active' : '') + '" id="row-' + key.replace(':', '-') + '" data-key="' + key + '">';

            // Head row: play, verse number
            html += '<div class="qr-verse-head">';
            html += '<button class="qr-verse-tplay" data-chapter="' + ch.id + '" data-verse="' + v + '" data-chpad="' + chPad + '" data-vpad="' + vPad + '" aria-label="Play"><svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg></button>';
            html += '<span class="qr-verse-tnum">' + v + '</span>';
            html += '</div>';

            // Verse body: Arabic + Translation in a single container
            html += '<div class="qr-verse-body">';
            html += '<div class="qr-verse-arabic" id="ar-' + key.replace(':', '-') + '" dir="rtl">';
            if (wbwMode && wbwWordData && wbwTransData) {
                var wIdx = 1;
                var anyWordRendered = false;
                while (wbwWordData[key + ':' + wIdx]) {
                    var wordObj = wbwWordData[key + ':' + wIdx];
                    var wbwTrans = wbwTransData[key + ':' + wIdx] || '';
                    var isArabicLetter = /[\u0600-\u06FF]/.test(wordObj.text);
                    if (!isArabicLetter && !wbwTrans) { wIdx++; continue; }
                    html += '<span class="qr-word-unit" data-wi="' + wIdx + '">';
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

            if (transHtml) {
                html += '<div class="qr-verse-translation">' + transHtml + '</div>';
            }
            html += '</div>';

            // Action row: Tafsir book-icon trigger
            html += '<div class="qr-verse-action">';
            html += '<button class="qr-tafsir-book" type="button" data-key="' + key + '" aria-label="Tafsir for verse ' + v + '" title="Tafsir">';
            html += '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>';
            html += '</button>';
            html += '</div>';

            html += '</div>';
        }

        els.verses.innerHTML = html;

        els.verses.querySelectorAll('.qr-verse-tplay').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                playFromVerse(parseInt(this.getAttribute('data-chapter')), parseInt(this.getAttribute('data-verse')), true);
            });
        });

        els.verses.querySelectorAll('.qr-fn-sup').forEach(function (sup) {
            sup.addEventListener('click', function (e) {
                e.stopPropagation();
                e.preventDefault();
                showFnTooltip(this);
            });
            sup.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    showFnTooltip(this);
                }
            });
        });

        els.verses.querySelectorAll('.qr-tafsir-book').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var key = this.getAttribute('data-key');
                var parts = key.split(':');
                openTafsirFor(chapters[parseInt(parts[0], 10) - 1], parseInt(parts[1], 10));
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
            'js/quran_source/indopak-nastaleeq-verse.js',
            function () { checkDone(); }
        );

        var defaultTrans = window.__QURAN_TRANSLATIONS && window.__QURAN_TRANSLATIONS.hilali;
        if (defaultTrans) {
            loadFromCacheOrFetch(
                defaultTrans.file,
                'js/quran_source/' + defaultTrans.file + '.js',
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
            loadFromCacheOrFetch(t.file, 'js/quran_source/' + t.file + '.js', function () {});
        });

        if (!getCachedData('english-wbw-translation')) {
            loadFromCacheOrFetch('english-wbw-translation', 'js/quran_source/english-wbw-translation.js', function () {});
        }
        if (!getCachedData('tamil-wbw-translation')) {
            loadFromCacheOrFetch('tamil-wbw-translation', 'js/quran_source/tamil-wbw-translation.js', function () {});
        }
    }

    function getAudioUrl(item) {
        var cfg = RECITER_CFG[currentReciter];
        if (!cfg) return null;
        var seg = _segCache[cfg.segKey];
        if (!seg) return null;
        if (cfg.mode === 'surah') {
            return seg.audio[String(item.chapter)] || null;
        }
        var entry = seg.verses[item.key];
        return (entry && entry.audio) || null;
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
                try {
                    var worker = new Worker('js/quran-loader-worker.js');
                    worker.postMessage({
                        file: wordKey,
                        url: 'js/quran_source/indopak-nastaleeq-word.js'
                    });
                    worker.onmessage = function (e) {
                        if (e.data.status === 'done') {
                            window.__QURAN_CACHE[wordKey] = e.data.data;
                            worker.terminate();
                            checkWbwDone();
                        } else if (e.data.status === 'error') {
                            worker.terminate();
                            loadFromCacheOrFetch(wordKey, 'js/quran_source/indopak-nastaleeq-word.js', function () { checkWbwDone(); });
                        }
                    };
                    worker.onerror = function () {
                        worker.terminate();
                        loadFromCacheOrFetch(wordKey, 'js/quran_source/indopak-nastaleeq-word.js', function () { checkWbwDone(); });
                    };
                } catch (e) {
                    // file:// blocks Workers — fall back to main-thread script load
                    loadFromCacheOrFetch(wordKey, 'js/quran_source/indopak-nastaleeq-word.js', function () { checkWbwDone(); });
                }
            } else {
                loadFromCacheOrFetch(wordKey, 'js/quran_source/indopak-nastaleeq-word.js', function () { checkWbwDone(); });
            }
        } else {
            checkWbwDone();
        }

        if (!cachedWbw) {
            loadFromCacheOrFetch(wbwFile, 'js/quran_source/' + wbwFile + '.js', function () {
                checkWbwDone();
            });
        } else {
            checkWbwDone();
        }
    }

    function fetchAndCacheFallback(fileKey, url, callback) {
        loadFromCacheOrFetch(fileKey, url, callback);
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

    /* ---- Inline footnote tooltips ---- */

    function showFnTooltip(btn) {
        if (!els.fnTooltip) return;
        var fnKey = btn.getAttribute('data-fnkey');
        var num = btn.getAttribute('data-num') || '1';
        var note = _fnNotes[fnKey] ? _fnNotes[fnKey].text : '';
        if (!note) return;
        els.fnTooltip.innerHTML = '<span class="qr-fn-tooltip-label">Footnote ' + num + '</span> ' + escapeHtml(note);
        var vr = btn.getBoundingClientRect();
        var tw = els.fnTooltip.offsetWidth;
        var top = vr.bottom + 10;
        var left = vr.left + vr.width / 2 - tw / 2;
        if (left < 8) left = 8;
        if (left + tw > window.innerWidth - 8) left = window.innerWidth - tw - 8;
        var bottom = top + els.fnTooltip.offsetHeight + 10;
        if (bottom > window.innerHeight - 8) {
            top = Math.max(8, vr.top - els.fnTooltip.offsetHeight - 10);
        }
        els.fnTooltip.style.top = top + 'px';
        els.fnTooltip.style.left = left + 'px';
        els.fnTooltip.style.display = 'block';
    }

    function hideFnTooltip() {
        if (els.fnTooltip) els.fnTooltip.style.display = 'none';
    }

    /* ---- Tafsir modal popup ---- */

    function getDefaultTafsirLang() {
        if (els.tafsirLangSelect && els.tafsirLangSelect.value) return els.tafsirLangSelect.value;
        return localStorage.getItem('quran-tafsir-lang') || 'ta';
    }

    function openTafsirFor(ch, ayah) {
        if (!els.tafsirModalBackdrop) return;
        tafsirState = { ch: ch, ayah: ayah };
        updateJumpSelect();
        if (els.tafsirModalLang) els.tafsirModalLang.value = getDefaultTafsirLang();
        updateModalHeader();
        loadTafsirIntoModal();
        els.tafsirModalBackdrop.hidden = false;
        document.body.style.overflow = 'hidden';
        els.tafsirModalBody.focus && els.tafsirModalBody.focus();
    }

    function closeTafsirModal() {
        if (!els.tafsirModalBackdrop) return;
        els.tafsirModalBackdrop.hidden = true;
        document.body.style.overflow = '';
        tafsirState = null;
    }

    function tafsirStep(delta) {
        if (!tafsirState) return;
        var next = tafsirState.ayah + delta;
        if (next < 1 || next > tafsirState.ch.verses) return;
        tafsirState.ayah = next;
        els.tafsirJump.value = String(next);
        updateModalHeader();
        loadTafsirIntoModal();
        els.tafsirModalBody.scrollTop = 0;
    }

    function updateJumpSelect() {
        if (!els.tafsirJump || !tafsirState) return;
        var opts = '';
        for (var a = 1; a <= tafsirState.ch.verses; a++) {
            opts += '<option value="' + a + '"' + (a === tafsirState.ayah ? ' selected' : '') + '>' + tafsirState.ch.id + ':' + a + '</option>';
        }
        els.tafsirJump.innerHTML = opts;
    }

    function updateModalHeader() {
        if (!tafsirState) return;
        if (els.tafsirSurahAr) els.tafsirSurahAr.textContent = tafsirState.ch.ar || '';
        if (els.tafsirSurahEn) els.tafsirSurahEn.textContent = tafsirState.ch.en || '';
        if (els.tafsirVerse) els.tafsirVerse.textContent = tafsirState.ch.id + ':' + tafsirState.ayah;
        if (els.tafsirPrev) els.tafsirPrev.disabled = tafsirState.ayah <= 1;
        if (els.tafsirNext) els.tafsirNext.disabled = tafsirState.ayah >= tafsirState.ch.verses;
        if (els.tafsirJump && els.tafsirJump.value !== String(tafsirState.ayah)) {
            els.tafsirJump.value = String(tafsirState.ayah);
        }
    }

    function loadTafsirIntoModal() {
        if (!tafsirState || !els.tafsirModalBody) return;
        var lang = getDefaultTafsirLang();
        loadTafsirContent(tafsirState.ch.id + ':' + tafsirState.ayah, tafsirState.ch.id, tafsirState.ayah, tafsirState.ch, lang, els.tafsirModalBody, els.tafsirModalSource);
    }

    function tafsirContentCurrent(surah, ayah, lang) {
        if (!tafsirState) return false;
        return tafsirState.ch.id === surah && tafsirState.ayah === ayah && getDefaultTafsirLang() === lang;
    }

    function updatePinButton() {
        if (!els.tafsirPin) return;
        els.tafsirPin.classList.toggle('is-pinned', tafsirPinned);
        els.tafsirPin.setAttribute('aria-pressed', tafsirPinned ? 'true' : 'false');
        els.tafsirPin.innerHTML = tafsirPinned
            ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10v2l-1 1v4l2 3v2H6v-2l2-3V7L7 6V4zm3 16h4v-3h-4v3z"/></svg>'
            : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10v2l-1 1v4l2 3v2H6v-2l2-3V7L7 6V4zm3 16h4v-3h-4v3z"/></svg>';
        els.tafsirPin.title = tafsirPinned ? 'Unpin (closes with X)' : 'Pin (keep open)';
    }

    function applyTafsirSize() {
        if (els.tafsirModalBody) els.tafsirModalBody.style.fontSize = tafsirSize + 'px';
    }

    function adjustTafsirSize(delta) {
        tafsirSize = Math.max(12, Math.min(28, tafsirSize + delta));
        localStorage.setItem('quran-tafsir-size', String(tafsirSize));
        applyTafsirSize();
    }

    function loadTafsirContent(key, surahNum, ayahNum, ch, lang, bodyEl, srcEl) {
        if (!bodyEl) return;
        bodyEl.innerHTML = '<p class="qr-tafsir-loading">Loading tafsir...</p>';
        bodyEl.dir = lang === 'en' ? 'ltr' : 'auto';
        if (srcEl) {
            srcEl.textContent = lang === 'en'
                ? 'Source: Tafsir Ibn Kathir (Abridged) \u00b7 quran.com'
                : 'Source: Tafsir Ibn Kathir (Tamil) \u00b7 tamililquran.com';
        }

        if (lang === 'en') {
            loadEnglishTafsir(surahNum, ayahNum, function (html) {
                if (!tafsirContentCurrent(surahNum, ayahNum, 'en')) return;
                if (html) {
                    bodyEl.innerHTML = html;
                } else {
                    bodyEl.innerHTML = '<p class="qr-tafsir-missing">Tafsir Ibn Kathir (English) is not yet available for this verse. Switch the tafsir language to Tamil or check back later.</p>';
                }
            });
        } else {
            var fileKey = 'tafsir-ta-' + pad(surahNum, 3);
            var filePath = 'js/tafsir/tamil-' + pad(surahNum, 3) + '.js';
            loadFromCacheOrFetch(fileKey, filePath, function (data) {
                if (!tafsirContentCurrent(surahNum, ayahNum, 'ta')) return;
                var entry = data && data.data ? data.data[String(ayahNum)] : null;
                if (entry && entry.html) {
                    bodyEl.innerHTML = entry.html;
                } else {
                    bodyEl.innerHTML = '<p class="qr-tafsir-missing">Tafsir Ibn Kathir (Tamil) is not yet available for this verse. Switch the tafsir language to English or check back later.</p>';
                }
            });
        }
    }

    /* ---- MCP English tafsir (live quran.ai) ---- */

    var MCP_ENDPOINT = 'https://mcp.quran.ai/';
    var mcpSessionId = null;
    var mcpNonce = null;
    var mcpReady = null;
    var mcpSeq = 100;

    function parseSseText(text) {
        var lines = text.split(/\r?\n/);
        var dataParts = [];
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (line.indexOf('data:') === 0) dataParts.push(line.slice(5).trim());
        }
        return JSON.parse(dataParts.join('\n'));
    }

    function mcpExtractText(msg) {
        if (msg && msg.result && msg.result.content && msg.result.content.length) {
            return msg.result.content[0].text || '';
        }
        return '';
    }

    function mcpHeaders() {
        var headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream'
        };
        if (mcpSessionId) headers['mcp-session-id'] = mcpSessionId;
        return headers;
    }

    function mcpRequest(method, params) {
        var body = JSON.stringify({ jsonrpc: '2.0', id: ++mcpSeq, method: method, params: params || {} });
        return fetch(MCP_ENDPOINT, { method: 'POST', headers: mcpHeaders(), body: body }).then(function (resp) {
            if (!resp.ok) throw new Error('MCP HTTP ' + resp.status);
            var sid = resp.headers.get('mcp-session-id');
            if (sid) mcpSessionId = sid;
            return resp.text().then(function (t) {
                if (!t) return {};
                var ct = resp.headers.get('content-type') || '';
                if (ct.indexOf('text/event-stream') !== -1) return parseSseText(t);
                return JSON.parse(t);
            });
        });
    }

    function mcpNotify(method, params) {
        var body = JSON.stringify({ jsonrpc: '2.0', method: method, params: params || {} });
        return fetch(MCP_ENDPOINT, { method: 'POST', headers: mcpHeaders(), body: body })
            .then(function () {})
            .catch(function () {});
    }

    function mcpInit() {
        if (mcpReady) return mcpReady;
        mcpReady = mcpRequest('initialize', {
            protocolVersion: '2025-03-26',
            capabilities: {},
            clientInfo: { name: 'siratkids-quran-reader', version: '1.0.0' }
        }).then(function () {
            mcpNotify('notifications/initialized', {});
            return mcpRequest('tools/call', { name: 'fetch_grounding_rules', arguments: {} });
        }).then(function (msg) {
            var m = /grounding_nonce>([^<]+)<\/grounding_nonce>/.exec(mcpExtractText(msg));
            mcpNonce = m ? m[1] : null;
            return mcpNonce;
        }).catch(function (err) {
            mcpReady = null;
            throw err;
        });
        return mcpReady;
    }

    function mcpFetchTafsir(surah, ayah) {
        return mcpInit().then(function () {
            return mcpRequest('tools/call', {
                name: 'fetch_tafsir',
                arguments: { ayahs: surah + ':' + ayah, editions: 'en-ibn-kathir', grounding_nonce: mcpNonce }
            });
        }).then(function (msg) {
            var txt = mcpExtractText(msg);
            if (!txt) return null;
            var data;
            try { data = JSON.parse(txt); } catch (e) { return null; }
            var res = data && data.results && data.results['en-ibn-kathir'];
            return (res && res.length > 0 && res[0].text) ? res[0].text : null;
        });
    }

    function loadEnglishTafsir(surah, ayah, callback) {
        var fileKey = 'tafsir-en-mcp-' + pad(surah, 3) + '-' + pad(ayah, 3);
        var cached = getCachedData(fileKey);
        if (cached) { callback(cached); return; }
        mcpFetchTafsir(surah, ayah).then(function (html) {
            if (html && window.putCachedData) window.putCachedData(fileKey, html);
            callback(html);
        }).catch(function () {
            callback(null);
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
        els.playbarVerse.textContent = 'Loading...';
        ensureSegmentData(function () {
            if (gen !== audioGen) return;
            startVersePlayback(item, gen);
        });
    }

    function startVersePlayback(item, gen) {
        restoreArabic();
        document.querySelectorAll('.qr-verse-row.playing').forEach(function (el) { el.classList.remove('playing'); });

        var ch = chapters[item.chapter - 1];
        var rowId = 'row-' + item.chapter + '-' + item.verse;
        var rowEl = document.getElementById(rowId);
        if (rowEl) {
            rowEl.classList.add('playing');
            rowEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }

        updateFixedBar(item, ch);
        lastPlayedVerse = item.verse;

        var wbwOn = els.wbwToggle && els.wbwToggle.checked;
        if (!wbwOn || (rowEl && !rowEl.querySelector('.qr-word-unit'))) {
            renderWordSpans(item);
        }

        var entry = getSegmentEntry(item);
        var url = getAudioUrl(item);
        if (!url || !entry) {
            restoreArabic();
            audioQueue.shift();
            playNextAudio();
            return;
        }

        var cfg = RECITER_CFG[currentReciter];
        if (cfg.mode === 'surah') {
            startSurahVerse(item, entry, url, gen);
        } else {
            startPerVerseAudio(item, url, gen);
        }
    }

    function startPerVerseAudio(item, url, gen) {
        var newAudio = new Audio(url);
        var lastScrollTime = 0;
        newAudio.addEventListener('timeupdate', function () {
            if (gen !== audioGen) return;
            var entry = getSegmentEntry(item);
            if (entry) updateWordHighlight(item, newAudio.currentTime * 1000);
            var now = Date.now();
            if (now - lastScrollTime > 800) {
                lastScrollTime = now;
                var row = document.getElementById('row-' + item.chapter + '-' + item.verse);
                if (row) row.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
        });
        newAudio.addEventListener('ended', function () {
            if (gen !== audioGen) return;
            restoreArabic();
            audioQueue.shift();
            playNextAudio();
        });
        newAudio.addEventListener('error', function () {
            if (gen !== audioGen) return;
            restoreArabic();
            audioQueue.shift();
            playNextAudio();
        });
        newAudio.play().catch(function () {
            if (gen !== audioGen) return;
            restoreArabic();
            audioQueue.shift();
            playNextAudio();
        });
        audioEl = newAudio;
        _surahAudioSrc = null;
    }

    function startSurahVerse(item, entry, url, gen) {
        if (audioEl && _surahAudioSrc === url) {
            audioEl.currentTime = entry.start / 1000;
            if (audioEl.paused) audioEl.play().catch(function () {});
            return;
        }

        _surahAudioSrc = url;
        var newAudio = new Audio(url);
        audioEl = newAudio;
        var lastScrollTime = 0;

        newAudio.addEventListener('timeupdate', function () {
            if (!isPlaying) return;
            var cfg = RECITER_CFG[currentReciter];
            if (!cfg || cfg.mode !== 'surah') return;
            var curItem = audioQueue[0];
            if (!curItem) return;
            var curEntry = getSegmentEntry(curItem);
            if (curEntry) {
                updateWordHighlight(curItem, newAudio.currentTime * 1000);
                if (newAudio.currentTime * 1000 >= curEntry.end) {
                    if (audioQueue.length === 1 && isSinglePlay && audioEl) audioEl.pause();
                    restoreArabic();
                    audioQueue.shift();
                    playNextAudio();
                }
            }
            var now = Date.now();
            if (now - lastScrollTime > 800) {
                lastScrollTime = now;
                var row = document.getElementById('row-' + curItem.chapter + '-' + curItem.verse);
                if (row) row.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
        });
        newAudio.addEventListener('ended', function () {
            if (!isPlaying) return;
            if (audioQueue.length === 0) { finishAudio(); return; }
            var curItem = audioQueue[0];
            var curEntry = getSegmentEntry(curItem);
            if (curEntry) {
                audioEl.currentTime = curEntry.start / 1000;
                audioEl.play().catch(function () {});
            } else {
                finishAudio();
            }
        });
        newAudio.addEventListener('error', function () {
            if (!isPlaying) return;
            restoreArabic();
            audioQueue.shift();
            playNextAudio();
        });
        newAudio.currentTime = entry.start / 1000;
        newAudio.play().catch(function () {
            if (!isPlaying) return;
            restoreArabic();
            audioQueue.shift();
            playNextAudio();
        });
    }

    function getSegmentEntry(item) {
        var cfg = RECITER_CFG[currentReciter];
        if (!cfg) return null;
        var seg = _segCache[cfg.segKey];
        return seg && seg.verses[item.key] ? seg.verses[item.key] : null;
    }

    function getWordTimingMap(item) {
        var cacheKey = currentReciter + ':' + item.key;
        if (_wordTimingCache[cacheKey]) return _wordTimingCache[cacheKey];
        var entry = getSegmentEntry(item);
        if (!entry) return null;
        var map = {};
        for (var i = 0; i < entry.segments.length; i++) {
            var seg = entry.segments[i];
            map[seg[0]] = [seg[1], seg[2]];
        }
        _wordTimingCache[cacheKey] = map;
        return map;
    }

    function ensureSegmentData(callback) {
        var cfg = RECITER_CFG[currentReciter];
        if (!cfg) { if (callback) callback(); return; }
        if (_segCache[cfg.segKey]) { ensureWordData(callback); return; }
        loadFromCacheOrFetch(cfg.segKey, cfg.segFile, function (data) {
            if (data) _segCache[cfg.segKey] = data;
            ensureWordData(callback);
        }, cfg.segKey);
    }

    function ensureWordData(callback) {
        if (getCachedData('indopak-nastaleeq-word')) { if (callback) callback(); return; }
        loadFromCacheOrFetch('indopak-nastaleeq-word', 'js/quran_source/indopak-nastaleeq-word.js', function () {
            if (callback) callback();
        });
    }

    function renderWordSpans(item) {
        var rowId = 'row-' + item.chapter + '-' + item.verse;
        var rowEl = document.getElementById(rowId);
        if (!rowEl) return;
        var arEl = rowEl.querySelector('.qr-verse-arabic');
        if (!arEl) return;
        var wordData = getCachedData('indopak-nastaleeq-word');
        if (!wordData) return;
        if (!arabicOrigMap[rowId]) {
            arabicOrigMap[rowId] = arEl.innerHTML;
        }
        var spans = [];
        var w = 1;
        var unit;
        while ((unit = wordData[item.key + ':' + w]) && unit.char_type === 'word') {
            spans.push('<span class="qr-ut-word" data-wi="' + w + '">' + unit.text + '</span>');
            w++;
        }
        if (spans.length > 0) arEl.innerHTML = spans.join(' ');
    }

    function updateWordHighlight(item, currentTimeMs) {
        var entry = getSegmentEntry(item);
        if (!entry) return;
        var cfg = RECITER_CFG[currentReciter];
        if (!cfg) return;
        var t = cfg.mode === 'surah' ? currentTimeMs : currentTimeMs - entry.start;
        var map = getWordTimingMap(item);
        if (!map) return;
        var rowId = 'row-' + item.chapter + '-' + item.verse;
        var rowEl = document.getElementById(rowId);
        if (!rowEl) return;
        var targets = rowEl.querySelectorAll('.qr-word-unit[data-wi], .qr-ut-word');
        for (var j = 0; j < targets.length; j++) {
            var el = targets[j];
            var wi = parseInt(el.getAttribute('data-wi'), 10);
            var tm = wi ? map[wi] : null;
            if (!tm) {
                el.classList.remove('active', 'done');
                continue;
            }
            if (t >= tm[1]) {
                el.classList.add('done');
                el.classList.remove('active');
            } else if (t >= tm[0]) {
                el.classList.add('active');
                el.classList.remove('done');
            } else {
                el.classList.remove('active', 'done');
            }
        }
    }

    function restoreArabic() {
        Object.keys(arabicOrigMap).forEach(function (rowId) {
            var rowEl = document.getElementById(rowId);
            var arEl = rowEl ? rowEl.querySelector('.qr-verse-arabic') : null;
            if (arEl) arEl.innerHTML = arabicOrigMap[rowId];
        });
        arabicOrigMap = {};
        document.querySelectorAll('.qr-word-unit.active, .qr-word-unit.done, .qr-ut-word.active, .qr-ut-word.done').forEach(function (el) {
            el.classList.remove('active', 'done');
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
        var cfg = RECITER_CFG[currentReciter];
        if (cfg && cfg.mode === 'surah') {
            audioQueue.shift();
            if (audioQueue.length > 0) {
                isPaused = false;
                updatePlayPauseIcon();
                playNextAudio();
            }
            return;
        }
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
        var cfg = RECITER_CFG[currentReciter];
        audioQueue.unshift({ chapter: first.chapter, verse: prevVerse, key: first.chapter + ':' + prevVerse });
        if (cfg && cfg.mode === 'surah') {
            isPaused = false;
            updatePlayPauseIcon();
            playNextAudio();
            return;
        }
        if (audioEl) { audioEl.pause(); audioEl.src = ''; }
        audioEl = null;
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
        _surahAudioSrc = null;
        audioQueue = [];
        restoreArabic();
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
        _surahAudioSrc = null;
        audioQueue = [];
        restoreArabic();
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
