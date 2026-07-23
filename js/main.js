/* SIRATKIDS — Main JavaScript */
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            var target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

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

        // Default: translation=on, tamil=off, transliteration=off
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
            btn.classList.remove('on');
            btn.querySelector('.toggle-label').textContent = btn.getAttribute('data-off');
        } else {
            btn.classList.add('on');
            btn.querySelector('.toggle-label').textContent = btn.getAttribute('data-on');
        }

        btn.addEventListener('click', function () {
            isOn = !isOn;
            document.body.classList.toggle(cls, !isOn);
            this.classList.toggle('on', isOn);
            this.querySelector('.toggle-label').textContent = isOn ? this.getAttribute('data-on') : this.getAttribute('data-off');
            localStorage.setItem('toggle-' + key, isOn ? 'on' : 'off');
        });
    });

    // Font size controls — Arabic and English separate
    var arLabel = document.getElementById('ar-font-size-label');
    var enLabel = document.getElementById('en-font-size-label');

    // Load saved sizes
    var savedAr = localStorage.getItem('ar-font-size');
    var savedEn = localStorage.getItem('en-font-size');
    if (savedAr) {
        document.documentElement.style.setProperty('--ar-font-scale', savedAr);
        if (arLabel) arLabel.textContent = Math.round(parseFloat(savedAr) * 100) + '%';
    }
    if (savedEn) {
        document.documentElement.style.setProperty('--en-font-scale', savedEn);
        if (enLabel) enLabel.textContent = Math.round(parseFloat(savedEn) * 100) + '%';
    }

    var arUp = document.getElementById('ar-font-size-up');
    var arDown = document.getElementById('ar-font-size-down');
    var enUp = document.getElementById('en-font-size-up');
    var enDown = document.getElementById('en-font-size-down');

    if (arUp && arDown && arLabel) {
        arUp.addEventListener('click', function () {
            var current = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ar-font-scale')) || 1;
            var next = Math.min(current + 0.1, 1.8);
            document.documentElement.style.setProperty('--ar-font-scale', next);
            arLabel.textContent = Math.round(next * 100) + '%';
            localStorage.setItem('ar-font-size', next);
        });
        arDown.addEventListener('click', function () {
            var current = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ar-font-scale')) || 1;
            var next = Math.max(current - 0.1, 0.7);
            document.documentElement.style.setProperty('--ar-font-scale', next);
            arLabel.textContent = Math.round(next * 100) + '%';
            localStorage.setItem('ar-font-size', next);
        });
    }

    if (enUp && enDown && enLabel) {
        enUp.addEventListener('click', function () {
            var current = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--en-font-scale')) || 1;
            var next = Math.min(current + 0.1, 1.8);
            document.documentElement.style.setProperty('--en-font-scale', next);
            enLabel.textContent = Math.round(next * 100) + '%';
            localStorage.setItem('en-font-size', next);
        });
        enDown.addEventListener('click', function () {
            var current = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--en-font-scale')) || 1;
            var next = Math.max(current - 0.1, 0.7);
            document.documentElement.style.setProperty('--en-font-scale', next);
            enLabel.textContent = Math.round(next * 100) + '%';
            localStorage.setItem('en-font-size', next);
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
    arH3s.forEach(function (h3, i) {
        if (i < arNums.length) {
            var span = document.createElement('span');
            span.className = 'ar-num';
            span.textContent = arNums[i] + '. ';
            h3.insertBefore(span, h3.firstChild);
        }
    });
});
