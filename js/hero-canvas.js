/* SIRATKIDS — Hero canvas: drifting clouds + wind streaks + golden glow
   The SVG lanterns already sway via CSS; this canvas sets the sky mood.
   Depends on: none. Loaded by index.html only. */
(function () {
    "use strict";

    var canvas = document.getElementById("hero-canvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var W, H, dpr;
    var running = true;
    var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function isDark() {
        return document.documentElement.getAttribute("data-theme") === "dark";
    }

    /* ================================================================
       PALETTE
       ================================================================ */
    var PAL = {
        gold:       "#C9A96E",
        goldLight:  "#D4B87A",
        indigo:     "#2A378A",
        indigoDeep: "#1B2560",
        indigoPale: "#3A4FA0",
        cream:      "#FBF6EC",
        peach:      "#E8B4A0",
        peachLight: "#F0CCBA",
        skyDusk:    "#3B5998",
        skyPeach:   "#D4896A",
        purple:     "#2D1B69"
    };

    /* ================================================================
       SIZING
       ================================================================ */
    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = canvas.parentElement.offsetWidth;
        H = canvas.parentElement.offsetHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + "px";
        canvas.style.height = H + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        buildClouds();
        buildWind();
        buildDust();
    }

    /* ================================================================
       GRAIN OVERLAY
       ================================================================ */
    var grainCanvas = document.createElement("canvas");
    var grainCtx = grainCanvas.getContext("2d");
    var GRAIN_SIZE = 128;
    function renderGrain() {
        grainCanvas.width = GRAIN_SIZE;
        grainCanvas.height = GRAIN_SIZE;
        var img = grainCtx.createImageData(GRAIN_SIZE, GRAIN_SIZE);
        var d = img.data;
        for (var i = 0; i < d.length; i += 4) {
            var v = Math.random() * 255;
            d[i] = v; d[i + 1] = v; d[i + 2] = v;
            d[i + 3] = 14;
        }
        grainCtx.putImageData(img, 0, 0);
    }
    renderGrain();

    function drawGrain() {
        ctx.save();
        ctx.globalAlpha = 0.08;
        ctx.globalCompositeOperation = "overlay";
        ctx.fillStyle = ctx.createPattern(grainCanvas, "repeat");
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
    }

    /* ================================================================
       VIGNETTE
       ================================================================ */
    function drawVignette() {
        ctx.save();
        var grad = ctx.createRadialGradient(
            W / 2, H * 0.45, Math.min(W, H) * 0.25,
            W / 2, H * 0.45, Math.max(W, H) * 0.62
        );
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(0.6, "rgba(0,0,0,0)");
        grad.addColorStop(1, "rgba(10,8,5,0.45)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
    }

    /* ================================================================
       CLOUDS — layered drifting masses
       ================================================================ */
    var clouds = [];
    function buildClouds() {
        clouds = [];
        var defs = [
            { x: 0.1,  y: 0.12, w: 0.38, h: 0.08, speed: 0.018, alpha: 0.55, blur: 0.02 },
            { x: 0.5,  y: 0.18, w: 0.30, h: 0.06, speed: 0.012, alpha: 0.45, blur: 0.025 },
            { x: 0.25, y: 0.08, w: 0.25, h: 0.05, speed: 0.022, alpha: 0.40, blur: 0.018 },
            { x: 0.7,  y: 0.22, w: 0.35, h: 0.07, speed: 0.014, alpha: 0.50, blur: 0.022 },
            { x: 0.0,  y: 0.28, w: 0.28, h: 0.055,speed: 0.010, alpha: 0.35, blur: 0.03 },
            { x: 0.6,  y: 0.10, w: 0.22, h: 0.04, speed: 0.025, alpha: 0.30, blur: 0.015 },
            { x: 0.35, y: 0.30, w: 0.40, h: 0.065,speed: 0.008, alpha: 0.42, blur: 0.028 },
            { x: 0.85, y: 0.15, w: 0.20, h: 0.04, speed: 0.020, alpha: 0.38, blur: 0.016 }
        ];
        for (var i = 0; i < defs.length; i++) {
            var d = defs[i];
            clouds.push({
                baseX: d.x * W,
                y: d.y * H,
                w: d.w * W,
                h: d.h * H,
                speed: d.speed,
                alpha: d.alpha,
                blur: Math.max(8, d.blur * W),
                puffs: 3 + Math.floor(Math.random() * 3),
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    function drawClouds(t, dark) {
        for (var i = 0; i < clouds.length; i++) {
            var c = clouds[i];
            /* Drift across, wrap around */
            var cx = ((c.baseX + t * c.speed * 35) % (W + c.w * 2)) - c.w;
            var cy = c.y + Math.sin(t * 0.0003 + c.phase) * 4;

            ctx.save();
            ctx.globalAlpha = c.alpha;
            ctx.filter = "blur(" + c.blur + "px)";

            var cloudColor = dark
                ? "rgba(180,190,220," + (c.alpha * 0.6).toFixed(3) + ")"
                : "rgba(255,255,255," + c.alpha.toFixed(3) + ")";
            ctx.fillStyle = cloudColor;

            /* Draw puffy cloud shape: overlapping ellipses */
            for (var p = 0; p < c.puffs; p++) {
                var px = cx + (p - c.puffs / 2) * c.w * 0.28;
                var py = cy + Math.sin(p * 1.3) * c.h * 0.25;
                var pw = c.w * (0.25 + Math.sin(p * 0.8) * 0.1);
                var ph = c.h * (0.6 + Math.cos(p * 1.1) * 0.3);
                ctx.beginPath();
                ctx.ellipse(px, py, pw, ph, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    /* ================================================================
       WIND STREAKS — horizontal particles streaming across
       ================================================================ */
    var wind = [];
    function buildWind() {
        wind = [];
        var count = Math.min(Math.floor(W / 55), 22);
        for (var i = 0; i < count; i++) {
            wind.push({
                x: Math.random() * W * 1.5,
                y: Math.random() * H,
                len: 20 + Math.random() * 60,
                speed: 0.4 + Math.random() * 0.8,
                alpha: 0.04 + Math.random() * 0.10,
                drift: (Math.random() - 0.5) * 0.15,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    function drawWind(t, dark) {
        for (var i = 0; i < wind.length; i++) {
            var w = wind[i];
            if (!reducedMotion) {
                w.x += w.speed;
                w.y += w.drift + Math.sin(t * 0.0004 + w.phase) * 0.1;
                if (w.x > W + w.len) {
                    w.x = -w.len;
                    w.y = Math.random() * H;
                }
            }

            ctx.save();
            ctx.globalAlpha = w.alpha;
            ctx.strokeStyle = dark
                ? "rgba(251,214,121," + (w.alpha * 2).toFixed(3) + ")"
                : "rgba(201,169,110," + (w.alpha * 1.5).toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(w.x, w.y);
            ctx.lineTo(w.x + w.len, w.y + Math.sin(t * 0.001 + w.phase) * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    /* ================================================================
       GOLD DUST — slow floating particles
       ================================================================ */
    var dust = [];
    function buildDust() {
        dust = [];
        var count = Math.min(6 + Math.floor(W / 140), 14);
        for (var i = 0; i < count; i++) {
            dust.push({
                x: Math.random() * W,
                y: H + 5 + Math.random() * 30,
                r: 1 + Math.random() * 1.8,
                speed: 0.10 + Math.random() * 0.18,
                drift: (Math.random() - 0.5) * 0.2,
                alpha: 0.12 + Math.random() * 0.28,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    function drawDust(t, dark) {
        for (var i = 0; i < dust.length; i++) {
            var p = dust[i];
            if (!reducedMotion) {
                p.y -= p.speed;
                p.x += p.drift + Math.sin(t * 0.0005 + p.phase) * 0.1;
                if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
            }
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = dark
                ? "rgba(251,214,121," + (p.alpha * 0.8).toFixed(3) + ")"
                : "rgba(201,169,110," + p.alpha.toFixed(3) + ")";
            ctx.fill();
        }
    }

    /* ================================================================
       MAIN DRAW
       ================================================================ */
    function draw(t) {
        ctx.clearRect(0, 0, W, H);
        var dark = isDark();

        /* Sky gradient */
        var sky = ctx.createLinearGradient(0, 0, 0, H);
        if (dark) {
            sky.addColorStop(0, "#0C1024");
            sky.addColorStop(0.35, PAL.indigoDeep);
            sky.addColorStop(0.65, PAL.indigo);
            sky.addColorStop(1, "#1A1040");
        } else {
            sky.addColorStop(0, PAL.indigoDeep);
            sky.addColorStop(0.25, PAL.skyDusk);
            sky.addColorStop(0.5, PAL.skyPeach);
            sky.addColorStop(0.75, PAL.peachLight);
            sky.addColorStop(1, PAL.cream);
        }
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);

        /* Warm glow from lantern region (center-top) */
        var glowX = W * 0.5;
        var glowY = H * 0.3;
        var glowR = Math.max(W, H) * 0.45;
        var glow = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, glowR);
        glow.addColorStop(0, dark ? "rgba(201,169,110,0.08)" : "rgba(201,169,110,0.12)");
        glow.addColorStop(0.5, dark ? "rgba(201,169,110,0.03)" : "rgba(201,169,110,0.05)");
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, W, H);

        /* Clouds */
        drawClouds(t, dark);

        /* Wind streaks */
        drawWind(t, dark);

        /* Gold dust */
        drawDust(t, dark);

        /* Subtle vignette */
        drawVignette();

        /* Film grain */
        drawGrain();
    }

    /* ================================================================
       LOOP
       ================================================================ */
    function frame(t) {
        if (!running) { requestAnimationFrame(frame); return; }
        if (reducedMotion) {
            draw(0);
        } else {
            draw(t);
        }
        requestAnimationFrame(frame);
    }

    /* ---- Events ---- */
    document.addEventListener("visibilitychange", function () { running = !document.hidden; });

    var resizeTimer;
    window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 150);
    });

    if (window.MutationObserver) {
        new MutationObserver(function () { buildClouds(); buildWind(); buildDust(); }).observe(
            document.documentElement,
            { attributes: true, attributeFilter: ["data-theme"] }
        );
    }

    /* ---- Start ---- */
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () { resize(); requestAnimationFrame(frame); });
    } else {
        resize();
        requestAnimationFrame(frame);
    }
})();
