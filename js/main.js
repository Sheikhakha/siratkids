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

    // Translation toggles (lessons only)
    var toggles = document.querySelectorAll('.translation-toggle');
    toggles.forEach(function (btn) {
        var key = btn.getAttribute('data-toggle');
        var cls = 'no-' + key;
        var saved = localStorage.getItem('toggle-' + key);
        if (saved === 'off') {
            document.body.classList.add(cls);
            btn.classList.remove('on');
        } else {
            btn.classList.add('on');
        }
        btn.addEventListener('click', function () {
            var isOff = !document.body.classList.toggle(cls);
            this.classList.toggle('on', isOff);
            this.querySelector('.toggle-label').textContent = isOff ? this.getAttribute('data-off') : this.getAttribute('data-on');
            localStorage.setItem('toggle-' + key, isOff ? 'off' : 'on');
        });
    });

    // Add Noto Sans Tamil font
    var tamilLink = document.createElement('link');
    tamilLink.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;500;600;700&display=swap';
    tamilLink.rel = 'stylesheet';
    document.head.appendChild(tamilLink);

    // Font size controls
    var fontSizeLabel = document.getElementById('font-size-label');
    if (fontSizeLabel) {
        var savedSize = localStorage.getItem('font-size');
        if (savedSize) {
            document.documentElement.style.fontSize = savedSize + 'px';
            fontSizeLabel.textContent = Math.round(parseInt(savedSize) / 16 * 100) + '%';
        }
        document.getElementById('font-size-up').addEventListener('click', function () {
            var current = parseFloat(getComputedStyle(document.documentElement).fontSize);
            var next = Math.min(current + 2, 28);
            document.documentElement.style.fontSize = next + 'px';
            localStorage.setItem('font-size', next);
            fontSizeLabel.textContent = Math.round(next / 16 * 100) + '%';
        });
        document.getElementById('font-size-down').addEventListener('click', function () {
            var current = parseFloat(getComputedStyle(document.documentElement).fontSize);
            var next = Math.max(current - 2, 12);
            document.documentElement.style.fontSize = next + 'px';
            localStorage.setItem('font-size', next);
            fontSizeLabel.textContent = Math.round(next / 16 * 100) + '%';
        });
    }
});
