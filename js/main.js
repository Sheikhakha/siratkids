/* SIRATKIDS — Main JavaScript */
document.addEventListener('DOMContentLoaded', function () {
    // Remove disable-onload-animations after DOM mounts
    document.body.classList.remove('disable-onload-animations');

    // Detect pinned sidebar and add helper class to body
    if (document.querySelector('.sidenav-with-history-container')) {
        document.body.classList.add('has-sidenav');
    }

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            var target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Navbar shadow
    var navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', function () {
        navbar.style.boxShadow = window.scrollY > 50
            ? '0 4px 20px rgba(0,0,0,0.12)'
            : '0 2px 8px rgba(0,0,0,0.08)';
    });

    // Arabic font switcher
    var fontSelect = document.getElementById('arabic-font');
    if (fontSelect) {
        var saved = localStorage.getItem('arabic-font');
        if (saved) {
            fontSelect.value = saved;
            applyFont(saved);
        }
        fontSelect.addEventListener('change', function () {
            localStorage.setItem('arabic-font', this.value);
            applyFont(this.value);
        });
    }

    function applyFont(font) {
        var classes = ['font-nastaleeq', 'font-amiri', 'font-scheherazade', 'font-lateef'];
        classes.forEach(function (cls) {
            document.body.classList.remove(cls);
        });
        if (font && font !== 'naskh') {
            document.body.classList.add('font-' + font);
        }
    }

    // Translation toggles — English ON by default, others OFF
    var toggles = document.querySelectorAll('.translation-toggle');
    toggles.forEach(function (btn) {
        var key = btn.getAttribute('data-toggle');
        var cls = 'no-' + key;
        var defaultOn = (key === 'translation');
        var saved = localStorage.getItem('toggle-' + key);
        var isOn;
        if (saved === null) {
            isOn = defaultOn;
        } else {
            isOn = (saved === 'on');
        }

        if (!isOn) {
            document.body.classList.add(cls);
        }
        btn.classList.toggle('on', isOn);
        btn.querySelector('.toggle-label').textContent = isOn ? btn.getAttribute('data-on') : btn.getAttribute('data-off');

        btn.addEventListener('click', function () {
            isOn = !isOn;
            document.body.classList.toggle(cls, !isOn);
            this.classList.toggle('on', isOn);
            this.querySelector('.toggle-label').textContent = isOn ? this.getAttribute('data-on') : this.getAttribute('data-off');
            localStorage.setItem('toggle-' + key, isOn ? 'on' : 'off');
        });
    });

    // Font size controls — direct DOM approach
    var AR_BASE = {
        title: 2.6,
        body: 1.725,
        h3: 1.4,
        hadith: 1.5
    };
    var EN_BASE = {
        title: 2.0,
        body: 1.0,
        h3: 1.15,
        hadith: 1.1
    };

    var arScale = parseFloat(localStorage.getItem('ar-font-scale')) || 1;
    var enScale = parseFloat(localStorage.getItem('en-font-scale')) || 1;

    var arLabel = document.getElementById('ar-font-size-label');
    var enLabel = document.getElementById('en-font-size-label');
    if (arLabel) arLabel.textContent = Math.round(arScale * 100) + '%';
    if (enLabel) enLabel.textContent = Math.round(enScale * 100) + '%';

    function applyArabicScale(scale) {
        document.querySelectorAll('.lesson-title .ar, .unit-hero-title .ar').forEach(function (el) {
            el.style.fontSize = (AR_BASE.title * scale) + 'rem';
        });
        document.querySelectorAll('.lesson-pair .ar p, .lesson-block .ar p, .lesson-concept-block .ar').forEach(function (el) {
            el.style.fontSize = (AR_BASE.body * scale) + 'rem';
        });
        document.querySelectorAll('.lesson-pair .ar h3, .lesson-block .ar h3').forEach(function (el) {
            el.style.fontSize = (AR_BASE.h3 * scale) + 'rem';
        });
        document.querySelectorAll('.hadith-card .ar .hadith-text').forEach(function (el) {
            el.style.fontSize = (AR_BASE.hadith * scale) + 'rem';
        });
        document.querySelectorAll('.verse-arabic').forEach(function (el) {
            el.style.fontSize = (1.5 * scale) + 'rem';
        });
        document.querySelectorAll('.hero-sub-ar').forEach(function (el) {
            el.style.fontSize = (1.6 * scale) + 'rem';
        });
        document.querySelectorAll('.lesson-highlight.ar').forEach(function (el) {
            el.style.fontSize = (1.05 * scale) + 'rem';
        });
        document.querySelectorAll('.track-name-ar').forEach(function (el) {
            el.style.fontSize = (1.3 * scale) + 'rem';
        });
    }

    function applyEnglishScale(scale) {
        document.querySelectorAll('.lesson-title .en, .hero-title, .unit-hero-title .en').forEach(function (el) {
            el.style.fontSize = (EN_BASE.title * scale) + 'rem';
        });
        document.querySelectorAll('.lesson-pair .en p, .lesson-block .en p, .lesson-concept-block .en').forEach(function (el) {
            el.style.fontSize = (EN_BASE.body * scale) + 'rem';
        });
        document.querySelectorAll('.lesson-pair .en h3, .lesson-block .en h3').forEach(function (el) {
            el.style.fontSize = (EN_BASE.h3 * scale) + 'rem';
        });
        document.querySelectorAll('.hadith-card .en .hadith-text').forEach(function (el) {
            el.style.fontSize = (EN_BASE.hadith * scale) + 'rem';
        });
        document.querySelectorAll('.lesson-highlight.en').forEach(function (el) {
            el.style.fontSize = (1.05 * scale) + 'rem';
        });
        document.querySelectorAll('.track-desc, .hero-sub-en, .unit-hero-desc').forEach(function (el) {
            el.style.fontSize = (0.95 * scale) + 'rem';
        });
        document.querySelectorAll('.track-name').forEach(function (el) {
            el.style.fontSize = (1.5 * scale) + 'rem';
        });
    }

    applyArabicScale(arScale);
    applyEnglishScale(enScale);

    var arUp = document.getElementById('ar-font-size-up');
    var arDown = document.getElementById('ar-font-size-down');
    var enUp = document.getElementById('en-font-size-up');
    var enDown = document.getElementById('en-font-size-down');

    if (arUp) {
        arUp.addEventListener('click', function () {
            arScale = Math.min(arScale + 0.05, 1.5);
            applyArabicScale(arScale);
            arLabel.textContent = Math.round(arScale * 100) + '%';
            localStorage.setItem('ar-font-scale', arScale);
        });
    }
    if (arDown) {
        arDown.addEventListener('click', function () {
            arScale = Math.max(arScale - 0.05, 0.7);
            applyArabicScale(arScale);
            arLabel.textContent = Math.round(arScale * 100) + '%';
            localStorage.setItem('ar-font-scale', arScale);
        });
    }
    if (enUp) {
        enUp.addEventListener('click', function () {
            enScale = Math.min(enScale + 0.05, 1.5);
            applyEnglishScale(enScale);
            enLabel.textContent = Math.round(enScale * 100) + '%';
            localStorage.setItem('en-font-scale', enScale);
        });
    }
    if (enDown) {
        enDown.addEventListener('click', function () {
            enScale = Math.max(enScale - 0.05, 0.7);
            applyEnglishScale(enScale);
            enLabel.textContent = Math.round(enScale * 100) + '%';
            localStorage.setItem('en-font-scale', enScale);
        });
    }

    // Add Noto Sans Tamil font
    var tamilLink = document.createElement('link');
    tamilLink.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;500;600;700&display=swap';
    tamilLink.rel = 'stylesheet';
    document.head.appendChild(tamilLink);

    // Auto-insert Arabic-Indic numbers in lesson Arabic h3 headings
    var arNums = ['\u0661', '\u0662', '\u0663', '\u0664', '\u0665', '\u0666', '\u0667', '\u0668', '\u0669'];
    var arH3s = document.querySelectorAll('.lesson-pair .ar h3, .lesson-block .ar h3');
    var numIndex = 0;
    arH3s.forEach(function (h3) {
        if (numIndex >= arNums.length) return;
        var hasNum = h3.textContent.match(/^[\u0661-\u0669]+[\.\s]*/);
        if (hasNum) {
            // Wrap existing number in .ar-num
            var span = document.createElement('span');
            span.className = 'ar-num';
            span.textContent = hasNum[0];
            h3.textContent = h3.textContent.replace(/^[\u0661-\u0669]+[\.\s]*/, '');
            h3.insertBefore(span, h3.firstChild);
        } else {
            // Inject new number
            var span = document.createElement('span');
            span.className = 'ar-num';
            span.textContent = arNums[numIndex] + '. ';
            h3.insertBefore(span, h3.firstChild);
        }
        numIndex++;
    });

    // Fix Arabic-Indic numerals in nastaleeq font: wrap U+0660-U+0669 in .ar-num spans
    if (document.body.classList.contains('font-nastaleeq')) {
        document.querySelectorAll('.ar').forEach(function(el) {
            var html = el.innerHTML;
            var modified = html.replace(/[\u0660-\u0669]/g, function(m) {
                return '<span class="ar-num">' + m + '</span>';
            });
            if (modified !== html) el.innerHTML = modified;
        });
    }

    // Meaning popup toggle
    var meaningBtns = document.querySelectorAll('.meaning-btn');
    meaningBtns.forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            var popupId = btn.getAttribute('data-popup');
            var popup = document.getElementById(popupId);
            if (popup) {
                popup.classList.add('active');
                document.body.classList.add('popup-open');
                var closeBtn = popup.querySelector('.popup-close');
                if (closeBtn) closeBtn.focus();
            }
        });
    });

    function closeMeaningPopup(popup) {
        popup.classList.remove('active');
        document.body.classList.remove('popup-open');
    }

    document.querySelectorAll('.popup-overlay').forEach(function(popup) {
        popup.addEventListener('click', function(e) {
            if (e.target === popup || e.target.classList.contains('popup-close')) {
                closeMeaningPopup(popup);
            }
        });
        var closeBtn = popup.querySelector('.popup-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                closeMeaningPopup(popup);
            });
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            var activePopup = document.querySelector('.popup-overlay.active');
            if (activePopup) {
                closeMeaningPopup(activePopup);
            }
        }
    });

    // Translation radio selector inside popups
    document.querySelectorAll('.popup-translation-selector').forEach(function(selector) {
        var radios = selector.querySelectorAll('input[type="radio"]');
        var popup = selector.closest('.popup-overlay');
        var texts = popup ? popup.querySelectorAll('.popup-translation-text') : [];
        radios.forEach(function(radio) {
            radio.addEventListener('change', function() {
                texts.forEach(function(t) { t.style.display = 'none'; });
                var target = popup ? popup.querySelector('.popup-translation-text.' + radio.value) : null;
                if (target) target.style.display = 'block';
            });
        });
    });

    // Settings dropdown toggle
    var settingsDropdown = document.querySelector('.settings-dropdown');
    if (settingsDropdown) {
        var settingsBtn = settingsDropdown.querySelector('.settings-toggle-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                settingsDropdown.classList.toggle('open');
            });
        }
        document.addEventListener('click', function(e) {
            if (!settingsDropdown.contains(e.target)) {
                settingsDropdown.classList.remove('open');
            }
        });
    }
});

/* ---- Sidebar Toggle (Desktop) ---- */
(function() {
    var layout = document.querySelector('.lesson-layout');
    var sidebar = document.querySelector('.lesson-sidebar');
    var toggle = document.querySelector('.sidebar-toggle');
    if (!layout || !toggle || !sidebar) return;

    document.body.appendChild(toggle);
    toggle.innerHTML = '<span class="sidebar-toggle-icon">\u2039</span>';

    var NAV_HEIGHT = 64;

    function updateToggle() {
        var layoutRect = layout.getBoundingClientRect();
        var sidebarRect = sidebar.getBoundingClientRect();
        var sidebarWidth = sidebar.offsetWidth;

        toggle.style.left = (layoutRect.left + sidebarWidth) + 'px';
        toggle.style.top = (sidebarRect.top + 12) + 'px';

        var layoutInView = layoutRect.bottom > 0 && layoutRect.top < window.innerHeight;
        var clearOfNav = sidebarRect.top >= NAV_HEIGHT;
        if (layoutInView && clearOfNav) {
            toggle.style.display = 'flex';
        } else {
            toggle.style.display = 'none';
        }
    }

    window.addEventListener('resize', updateToggle);
    window.addEventListener('scroll', updateToggle, { passive: true });
    sidebar.addEventListener('transitionend', updateToggle);

    if (localStorage.getItem('sidebar-collapsed') === 'true') {
        layout.classList.add('sidebar-collapsed');
        toggle.classList.add('collapsed');
    }

    toggle.addEventListener('click', function() {
        layout.classList.toggle('sidebar-collapsed');
        toggle.classList.toggle('collapsed');
        localStorage.setItem('sidebar-collapsed', layout.classList.contains('sidebar-collapsed'));
    });
})();

/* ---- Pinned Sidebar Toggle (new layout: sidenav-with-history-container) ---- */
(function() {
    var sidenav = document.querySelector('.sidenav-with-history-container');
    var toggleBtn = document.querySelector('.sidebar-toggle-btn');
    var iconOpen = toggleBtn ? toggleBtn.querySelector('.icon-sidebar-open') : null;
    var iconClosed = toggleBtn ? toggleBtn.querySelector('.icon-sidebar-closed') : null;
    if (!sidenav || !toggleBtn) return;

    // Restore saved state
    if (localStorage.getItem('sidebar-collapsed') === 'true') {
        sidenav.classList.add('collapsed');
    } else {
        sidenav.classList.remove('collapsed');
    }

    function updateToggleIcons() {
        var isCollapsed = sidenav.classList.contains('collapsed');
        if (iconOpen) iconOpen.style.display = isCollapsed ? 'none' : 'block';
        if (iconClosed) iconClosed.style.display = isCollapsed ? 'block' : 'none';
    }

    updateToggleIcons();

    toggleBtn.addEventListener('click', function() {
        sidenav.classList.toggle('collapsed');
        localStorage.setItem('sidebar-collapsed', sidenav.classList.contains('collapsed'));
        updateToggleIcons();
    });
})();

/* ---- Audio Player Widget (Web Speech API) ---- */
(function() {
    var player = document.querySelector('.audio-player');
    if (!player) return;
    if (!('speechSynthesis' in window)) {
        player.innerHTML = '<div class="audio-no-support">Audio is not supported in this browser.</div>';
        return;
    }

    var playBtn = player.querySelector('.audio-play-btn');
    var statusEl = player.querySelector('.audio-status');
    var previewEl = player.querySelector('.audio-text-preview');
    var isPlayingAll = false;
    var isPlayingSingle = false;
    var utteranceQueue = [];
    var currentUtterance = null;
    var currentBlockIndex = 0;
    var blocks = [];
    var blockTexts = [];
    var activeAyahBtn = null;

    /* ---- Speed (select dropdown) ---- */
    var currentSpeed = 1;
    var speedSelect = player.querySelector('.audio-speed-select') || player.querySelector('#audio-speed');
    var savedSpeed = localStorage.getItem('audio-speed');
    if (savedSpeed) currentSpeed = parseFloat(savedSpeed);

    function initSpeedSelect() {
        if (!speedSelect) return;
        speedSelect.value = currentSpeed;
        speedSelect.addEventListener('change', function() {
            currentSpeed = parseFloat(this.value);
            localStorage.setItem('audio-speed', currentSpeed);
            if (currentUtterance) currentUtterance.rate = currentSpeed;
        });
    }
    initSpeedSelect();

    /* ---- Voice Selector (Qari + Standard categories) ---- */
    var arVoices = null;
    var voiceSelect = document.createElement('select');
    voiceSelect.className = 'audio-voice-select';
    voiceSelect.setAttribute('aria-label', 'Choose Arabic voice');
    player.appendChild(voiceSelect);

    var ALL_VOICES = [
        // Qari voices (recitation masters)
        { label: 'Abdul Basit — Hafs',     keys: ['abdul basit', 'basit'],   provider: '', cat: 'qari' },
        { label: 'Mujawwad — Tajweed',     keys: ['mujawwad'],              provider: '', cat: 'qari' },
        { label: 'Al-Husary — Warsh',      keys: ['al-husary', 'husary'],   provider: '', cat: 'qari' },
        { label: 'Al-Afasy — Hafs',        keys: ['al-afasy', 'afasy'],     provider: '', cat: 'qari' },
        { label: 'Al-Minshawi — Warsh',    keys: ['al-minshawi', 'minshawi'], provider: '', cat: 'qari' },
        { label: 'Az-Zahir — Hafs',        keys: ['az-zahir', 'zahir'],     provider: '', cat: 'qari' },
        { label: 'Al-Jazeera — Hafs',      keys: ['al-jazeera', 'jazeera'], provider: '', cat: 'qari' },
        // Standard voices (TTS fallback)
        { label: 'Majid — Google TTS',     keys: ['majid'],                 provider: 'google',    cat: 'standard' },
        { label: 'Laila — Google TTS',     keys: ['laila', 'leila'],        provider: 'google',    cat: 'standard' },
        { label: 'Shakir — Microsoft TTS', keys: ['shakir'],               provider: 'microsoft', cat: 'standard' },
        { label: 'Salma — Microsoft TTS',  keys: ['salma'],                provider: 'microsoft', cat: 'standard' },
        { label: 'Maged — Apple TTS',      keys: ['maged'],                provider: 'apple',     cat: 'standard' }
    ];

    function getArabicVoices() {
        if (arVoices) return arVoices;
        var all = speechSynthesis.getVoices();
        arVoices = all.filter(function(v) { return v.lang.indexOf('ar') === 0; });
        return arVoices;
    }

    function findRealVoice(predefined) {
        var voices = getArabicVoices();
        for (var i = 0; i < voices.length; i++) {
            var name = (voices[i].name || '').toLowerCase();
            for (var k = 0; k < predefined.keys.length; k++) {
                if (name.indexOf(predefined.keys[k]) !== -1) return voices[i];
            }
        }
        if (predefined.provider) {
            for (var i = 0; i < voices.length; i++) {
                var name = (voices[i].name || '').toLowerCase();
                if (name.indexOf(predefined.provider) !== -1) return voices[i];
            }
        }
        return null;
    }

    function createOpt(optGroup, pv, saved) {
        var opt = document.createElement('option');
        opt.value = pv.label;
        var real = findRealVoice(pv);
        opt.textContent = pv.label + (real ? '' : ' (not installed)');
        if (pv.label === saved) opt.selected = true;
        optGroup.appendChild(opt);
    }

    function populateVoiceList() {
        var saved = localStorage.getItem('audio-voice-name');
        voiceSelect.innerHTML = '<option value="">Auto (best available)</option>';

        var qariGroup = document.createElement('optgroup');
        qariGroup.label = '\u{1F54C} Qari Voices — Recitation';

        var stdGroup = document.createElement('optgroup');
        stdGroup.label = '\u{1F4E2} Standard Voices — Text-to-Speech';

        ALL_VOICES.forEach(function(pv) {
            if (pv.cat === 'qari') {
                createOpt(qariGroup, pv, saved);
            } else {
                createOpt(stdGroup, pv, saved);
            }
        });

        voiceSelect.appendChild(qariGroup);
        voiceSelect.appendChild(stdGroup);
    }

    voiceSelect.addEventListener('change', function() {
        if (this.value) {
            localStorage.setItem('audio-voice-name', this.value);
        } else {
            localStorage.removeItem('audio-voice-name');
        }
    });

    function getSavedVoice() {
        var savedLabel = localStorage.getItem('audio-voice-name');
        if (!savedLabel) return null;
        for (var i = 0; i < ALL_VOICES.length; i++) {
            if (ALL_VOICES[i].label === savedLabel) {
                return findRealVoice(ALL_VOICES[i]);
            }
        }
        return null;
    }

    function findArabicVoice() {
        var saved = getSavedVoice();
        if (saved) return saved;

        for (var i = 0; i < ALL_VOICES.length; i++) {
            var real = findRealVoice(ALL_VOICES[i]);
            if (real) return real;
        }

        var voices = getArabicVoices();
        if (!voices.length) return null;
        for (var i = 0; i < voices.length; i++) {
            if (voices[i].default) return voices[i];
        }
        return voices[0];
    }

    /* ---- Word Wrapping & Highlighting ---- */
    function collectBlocks() {
        var main = document.querySelector('.lesson-main');
        if (!main) return [];
        return Array.prototype.slice.call(main.querySelectorAll('.lesson-block .ar'));
    }

    function wrapWords(block) {
        var ps = block.querySelectorAll('p');
        var totalWords = 0;
        ps.forEach(function(p) {
            var walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT, null);
            var textNodes = [];
            while (walker.nextNode()) textNodes.push(walker.currentNode);

            textNodes.forEach(function(node) {
                if (node.parentNode.classList && node.parentNode.classList.contains('meaning-btn')) return;
                if (node.parentNode.closest && node.parentNode.closest('.meaning-btn')) return;
                if (node.parentNode.closest && node.parentNode.closest('.audio-word')) return;
                if (node.parentNode.closest && node.parentNode.closest('.ayah-play-btn')) return;

                var text = node.textContent;
                if (!text.trim()) return;

                var words = text.split(/(\s+)/);
                var frag = document.createDocumentFragment();
                words.forEach(function(word) {
                    if (word.trim()) {
                        var span = document.createElement('span');
                        span.className = 'audio-word';
                        span.dataset.wi = totalWords;
                        span.textContent = word;
                        frag.appendChild(span);
                        totalWords++;
                    } else {
                        frag.appendChild(document.createTextNode(word));
                    }
                });
                node.parentNode.replaceChild(frag, node);
            });
        });
        return totalWords;
    }

    function unwrapWords(block) {
        var words = block.querySelectorAll('.audio-word');
        words.forEach(function(span) {
            var parent = span.parentNode;
            parent.replaceChild(document.createTextNode(span.textContent), span);
            parent.normalize();
        });
        removeHighlight(block);
    }

    function highlightWord(block, charIndex, blockText) {
        removeHighlight(block);
        var offset = 0;
        var words = blockText.split(/\s+/);
        for (var i = 0; i < words.length; i++) {
            var end = offset + words[i].length;
            if (charIndex >= offset && charIndex < end) {
                var wordEl = block.querySelector('.audio-word[data-wi="' + i + '"]');
                if (wordEl) {
                    wordEl.classList.add('audio-word-active');
                    wordEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
                return;
            }
            offset = end + 1;
        }
    }

    function removeHighlight(block) {
        var prev = block.querySelector('.audio-word-active');
        if (prev) prev.classList.remove('audio-word-active');
    }

    function updatePreview(text) {
        if (previewEl) previewEl.textContent = text || '';
    }

    function setStatus(msg) {
        if (statusEl) statusEl.textContent = msg;
    }

    /* ---- Inline Ayah Play Buttons ---- */
    function injectAyahButtons() {
        blocks.forEach(function(block) {
            if (block.querySelector('.ayah-play-btn')) return;
            var btn = document.createElement('button');
            btn.className = 'ayah-play-btn';
            btn.setAttribute('aria-label', 'Play this ayah');
            btn.innerHTML = '<svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>';
            block.appendChild(btn);
        });
    }

    function stopAll() {
        isPlayingAll = false;
        isPlayingSingle = false;
        speechSynthesis.cancel();
        utteranceQueue = [];
        currentUtterance = null;
        blocks.forEach(function(block) { unwrapWords(block); });
        if (activeAyahBtn) {
            activeAyahBtn.classList.remove('active');
            activeAyahBtn.innerHTML = '<svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>';
            activeAyahBtn = null;
        }
        playBtn.classList.remove('playing');
        playBtn.innerHTML = '<svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>';
        setStatus('Tap to play all');
        updatePreview('');
    }

    /* ---- Play All ---- */
    function playAll() {
        blocks = collectBlocks();
        if (!blocks.length) { setStatus('No Arabic text found'); return; }

        stopAll();
        blocks.forEach(function(block) { wrapWords(block); });

        blockTexts = [];
        blocks.forEach(function(block) {
            var text = block.textContent.trim().replace(/\s+/g, ' ');
            blockTexts.push(text);
        });

        utteranceQueue = blockTexts.slice();
        currentBlockIndex = 0;
        isPlayingAll = true;
        playBtn.classList.add('playing');
        playBtn.innerHTML = '<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
        speakNextAll();
    }

    function speakNextAll() {
        if (!isPlayingAll || utteranceQueue.length === 0) {
            stopAll();
            return;
        }

        var text = utteranceQueue.shift();
        var blockIdx = currentBlockIndex;
        currentBlockIndex++;
        var short = text.length > 60 ? text.substring(0, 60) + '...' : text;
        updatePreview(short);
        setStatus('Playing ' + currentBlockIndex + ' / ' + blockTexts.length);

        var utt = new SpeechSynthesisUtterance(text);
        utt.lang = 'ar';
        utt.rate = currentSpeed;
        var voice = findArabicVoice();
        if (voice) utt.voice = voice;

        utt.onboundary = function(e) {
            if (e.name === 'word' && blocks[blockIdx]) {
                highlightWord(blocks[blockIdx], e.charIndex, text);
            }
        };
        utt.onend = function() {
            if (blocks[blockIdx]) removeHighlight(blocks[blockIdx]);
            if (isPlayingAll) speakNextAll();
        };
        utt.onerror = function() {
            if (blocks[blockIdx]) removeHighlight(blocks[blockIdx]);
            if (isPlayingAll) speakNextAll();
        };

        currentUtterance = utt;
        speechSynthesis.speak(utt);
    }

    /* ---- Play Single Ayah ---- */
    function playSingleAyah(block, btn) {
        if (isPlayingSingle && activeAyahBtn === btn) {
            stopAll();
            return;
        }

        stopAll();
        isPlayingSingle = true;
        activeAyahBtn = btn;
        btn.classList.add('active');
        btn.innerHTML = '<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';

        wrapWords(block);
        var text = block.textContent.trim().replace(/\s+/g, ' ');
        var short = text.length > 60 ? text.substring(0, 60) + '...' : text;
        updatePreview(short);
        setStatus('Reading...');

        var utt = new SpeechSynthesisUtterance(text);
        utt.lang = 'ar';
        utt.rate = currentSpeed;
        var voice = findArabicVoice();
        if (voice) utt.voice = voice;

        utt.onboundary = function(e) {
            if (e.name === 'word') highlightWord(block, e.charIndex, text);
        };
        utt.onend = function() { stopAll(); };
        utt.onerror = function() { stopAll(); };

        currentUtterance = utt;
        speechSynthesis.speak(utt);
    }

    /* ---- Event Listeners ---- */
    playBtn.addEventListener('click', function() {
        if (isPlayingAll) {
            stopAll();
        } else {
            playAll();
        }
    });

    document.addEventListener('click', function(e) {
        var btn = e.target.closest('.ayah-play-btn');
        if (!btn) return;
        var block = btn.closest('.lesson-block');
        if (!block) return;
        var arBlock = block.querySelector('.ar');
        if (!arBlock) return;
        playSingleAyah(arBlock, btn);
    });

    /* ---- Init ---- */
    blocks = collectBlocks();
    injectAyahButtons();
    if (blocks.length) {
        var firstText = blocks[0].textContent.trim().replace(/\s+/g, ' ');
        var short = firstText.length > 60 ? firstText.substring(0, 60) + '...' : firstText;
        updatePreview(short);
    }

    arVoices = null;
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = function() {
            arVoices = null;
            getArabicVoices();
            populateVoiceList();
        };
    }
    speechSynthesis.getVoices();
    populateVoiceList();
})();
