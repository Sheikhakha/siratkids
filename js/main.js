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
});
