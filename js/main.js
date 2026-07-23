/* SIRATKIDS — Main JavaScript */
document.addEventListener('DOMContentLoaded', function () {
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
        if (font === 'nastaleeq') {
            document.body.classList.add('font-nastaleeq');
        } else {
            document.body.classList.remove('font-nastaleeq');
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
        title: 2.2,
        body: 1.15,
        h3: 1.4,
        hadith: 1.2
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
        document.querySelectorAll('.lesson-title .ar').forEach(function (el) {
            el.style.fontSize = (AR_BASE.title * scale) + 'rem';
        });
        document.querySelectorAll('.lesson-pair .ar p').forEach(function (el) {
            el.style.fontSize = (AR_BASE.body * scale) + 'rem';
        });
        document.querySelectorAll('.lesson-pair .ar h3').forEach(function (el) {
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
    }

    function applyEnglishScale(scale) {
        document.querySelectorAll('.lesson-title .en').forEach(function (el) {
            el.style.fontSize = (EN_BASE.title * scale) + 'rem';
        });
        document.querySelectorAll('.lesson-pair .en p').forEach(function (el) {
            el.style.fontSize = (EN_BASE.body * scale) + 'rem';
        });
        document.querySelectorAll('.lesson-pair .en h3').forEach(function (el) {
            el.style.fontSize = (EN_BASE.h3 * scale) + 'rem';
        });
        document.querySelectorAll('.hadith-card .en .hadith-text').forEach(function (el) {
            el.style.fontSize = (EN_BASE.hadith * scale) + 'rem';
        });
        document.querySelectorAll('.lesson-highlight.en').forEach(function (el) {
            el.style.fontSize = (1.05 * scale) + 'rem';
        });
        document.querySelectorAll('.track-desc').forEach(function (el) {
            el.style.fontSize = (0.95 * scale) + 'rem';
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
            localStorage.setItem('en-font-size', enScale);
        });
    }
    if (enDown) {
        enDown.addEventListener('click', function () {
            enScale = Math.max(enScale - 0.05, 0.7);
            applyEnglishScale(enScale);
            enLabel.textContent = Math.round(enScale * 100) + '%';
            localStorage.setItem('en-font-size', enScale);
        });
    }

    // Add Noto Sans Tamil font
    var tamilLink = document.createElement('link');
    tamilLink.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;500;600;700&display=swap';
    tamilLink.rel = 'stylesheet';
    document.head.appendChild(tamilLink);

    // Auto-insert Arabic-Indic numbers in lesson Arabic h3 headings
    var arNums = ['\u0661', '\u0662', '\u0663', '\u0664', '\u0665', '\u0666', '\u0667', '\u0668', '\u0669'];
    var arH3s = document.querySelectorAll('.lesson-pair .ar h3');
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
});
