/* SIRATKIDS — Login page montage animation
   Nature cinematography + manuscript plates, crossfades, vignette.
   Depends on: none. Loaded by login.html only. */
(function () {
    "use strict";

    var canvas = document.getElementById("sk-login-canvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---- Theme ---- */
    function isDark() {
        return document.documentElement.getAttribute("data-theme") === "dark";
    }

    /* ---- Sizing (9:16 portrait) ---- */
    var W, H, dpr;
    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        var rect = canvas.parentElement.getBoundingClientRect();
        W = rect.width;
        H = rect.height;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + "px";
        canvas.style.height = H + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    var resizeTimer;
    window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 150);
    });

    /* ================================================================
       COLOUR PALETTE
       ================================================================ */
    var PAL = {
        peach:      "#E8B4A0",
        peachLight: "#F0CCBA",
        gold:       "#C9A96E",
        goldLight:  "#D4A84B",
        cream:      "#F5E6C8",
        creamLight: "#FDF8F0",
        indigo:     "#1E293B",
        indigoDeep: "#0F172A",
        purple:     "#2D1B69",
        skyDusk:    "#3B5998",
        skyPeach:   "#D4896A",
        skyPink:    "#C97B6B",
        leafGreen:  "#4A7C59",
        leafDark:   "#2D5016",
        branch:     "#5C4033",
        moonGold:   "#F7D070"
    };

    /* ================================================================
       GRAIN OVERLAY (pre-rendered to offscreen canvas)
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
            d[i + 3] = 18; /* very subtle */
        }
        grainCtx.putImageData(img, 0, 0);
    }
    renderGrain();

    function drawGrain() {
        ctx.save();
        ctx.globalAlpha = 0.12;
        ctx.globalCompositeOperation = "overlay";
        var pat = ctx.createPattern(grainCanvas, "repeat");
        ctx.fillStyle = pat;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
    }

    /* ================================================================
       CIRCULAR VIGNETTE (telescope / loupe effect)
       ================================================================ */
    function drawVignette(amount) {
        ctx.save();
        var grad = ctx.createRadialGradient(
            W / 2, H / 2, Math.min(W, H) * 0.25,
            W / 2, H / 2, Math.min(W, H) * 0.55
        );
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(0.6, "rgba(0,0,0,0)");
        grad.addColorStop(1, "rgba(10,8,5," + (0.7 * amount) + ")");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
    }

    function drawLensVignette(amount) {
        ctx.save();
        var grad = ctx.createRadialGradient(
            W / 2, H / 2, Math.min(W, H) * 0.18,
            W / 2, H / 2, Math.min(W, H) * 0.42
        );
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(0.7, "rgba(0,0,0,0)");
        grad.addColorStop(0.85, "rgba(15,12,8," + (0.5 * amount) + ")");
        grad.addColorStop(1, "rgba(10,8,5," + (0.92 * amount) + ")");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();

        /* Brass ring */
        ctx.save();
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, Math.min(W, H) * 0.41, 0, Math.PI * 2);
        ctx.arc(W / 2, H / 2, Math.min(W, H) * 0.38, 0, Math.PI * 2, true);
        ctx.fillStyle = "rgba(160,130,70," + (0.35 * amount) + ")";
        ctx.fill();
        ctx.restore();
    }

    /* ================================================================
       SCENE 1: DUSK SKY WITH CLOUDS
       ================================================================ */
    function drawScene_sky(t, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;

        /* Gradient sky */
        var sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, PAL.indigoDeep);
        sky.addColorStop(0.25, PAL.skyDusk);
        sky.addColorStop(0.5, PAL.skyPeach);
        sky.addColorStop(0.7, PAL.peachLight);
        sky.addColorStop(1, PAL.cream);
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);

        /* Drifting clouds */
        drawClouds(t);

        /* Subtle handheld drift */
        var drift = Math.sin(t * 0.0003) * 3;
        ctx.translate(drift, Math.sin(t * 0.0004) * 2);

        ctx.restore();
    }

    function drawClouds(t) {
        var clouds = [
            { x: 0.2, y: 0.18, w: 0.35, h: 0.06, speed: 0.012, color: PAL.peach },
            { x: 0.6, y: 0.22, w: 0.28, h: 0.05, speed: 0.008, color: PAL.peachLight },
            { x: 0.35, y: 0.14, w: 0.22, h: 0.04, speed: 0.015, color: PAL.goldLight },
            { x: 0.75, y: 0.28, w: 0.3, h: 0.055, speed: 0.01, color: PAL.peach },
            { x: 0.1, y: 0.32, w: 0.25, h: 0.045, speed: 0.007, color: PAL.cream }
        ];

        for (var i = 0; i < clouds.length; i++) {
            var c = clouds[i];
            var cx = ((c.x * W + t * c.speed * 30) % (W * 1.4)) - W * 0.2;
            var cy = c.y * H;
            var cw = c.w * W;
            var ch = c.h * H;

            ctx.save();
            ctx.globalAlpha = 0.55;
            ctx.filter = "blur(" + Math.max(8, W * 0.015) + "px)";

            /* Cloud shape: overlapping ellipses */
            ctx.fillStyle = c.color;
            ctx.beginPath();
            ctx.ellipse(cx, cy, cw * 0.5, ch, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(cx - cw * 0.2, cy + ch * 0.3, cw * 0.35, ch * 0.8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(cx + cw * 0.25, cy - ch * 0.2, cw * 0.3, ch * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    /* ================================================================
       SCENE 2: CRESCENT MOON EMERGING
       ================================================================ */
    function drawScene_moon(t, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;

        /* Night sky */
        var sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, PAL.indigoDeep);
        sky.addColorStop(0.5, PAL.indigo);
        sky.addColorStop(1, PAL.purple);
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);

        /* Stars */
        for (var i = 0; i < 30; i++) {
            var sx = (i * 97 + 31) % W;
            var sy = (i * 67 + 13) % (H * 0.6);
            var flicker = 0.3 + Math.sin(t * 0.002 + i * 1.7) * 0.25;
            ctx.beginPath();
            ctx.arc(sx, sy, 1 + (i % 3) * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255,255,220," + flicker + ")";
            ctx.fill();
        }

        /* Drifting cloud partially obscuring moon */
        var cloudX = W * 0.55 + Math.sin(t * 0.0004) * W * 0.08;
        ctx.save();
        ctx.globalAlpha = 0.35 * alpha;
        ctx.filter = "blur(" + Math.max(12, W * 0.02) + "px)";
        ctx.fillStyle = PAL.indigo;
        ctx.beginPath();
        ctx.ellipse(cloudX, H * 0.3, W * 0.25, H * 0.04, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        /* Crescent moon */
        var mx = W * 0.5;
        var my = H * 0.28;
        var mr = Math.min(W, H) * 0.08;

        /* Moon glow */
        ctx.save();
        ctx.globalAlpha = 0.2 * alpha;
        var glow = ctx.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 3);
        glow.addColorStop(0, PAL.moonGold);
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.fillRect(mx - mr * 3, my - mr * 3, mr * 6, mr * 6);
        ctx.restore();

        /* Moon body */
        ctx.beginPath();
        ctx.arc(mx, my, mr, 0, Math.PI * 2);
        ctx.fillStyle = PAL.moonGold;
        ctx.fill();
        /* Cut out to make crescent */
        ctx.beginPath();
        ctx.arc(mx + mr * 0.35, my - mr * 0.15, mr * 0.85, 0, Math.PI * 2);
        ctx.fillStyle = PAL.indigoDeep;
        ctx.fill();

        ctx.restore();
    }

    /* ================================================================
       SCENE 3: TREE BRANCHES SWAYING
       ================================================================ */
    function drawScene_branches(t, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;

        /* Dusk sky behind */
        var sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, PAL.indigo);
        sky.addColorStop(0.4, PAL.skyDusk);
        sky.addColorStop(0.7, PAL.skyPeach);
        sky.addColorStop(1, PAL.peach);
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);

        /* Swaying branches */
        drawBranches(t, W * 0.5, H * 0.15, Math.min(W, H) * 0.35, -Math.PI / 2, 5, 0);

        ctx.restore();
    }

    function drawBranches(t, x, y, len, angle, depth, parentSway) {
        if (depth <= 0 || len < 8) return;

        var sway = Math.sin(t * 0.0008 + depth * 0.7 + parentSway) * (0.04 + (5 - depth) * 0.01);
        var a = angle + sway;
        var ex = x + Math.cos(a) * len;
        var ey = y + Math.sin(a) * len;

        /* Draw branch segment */
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(ex, ey);
        ctx.strokeStyle = PAL.branch;
        ctx.lineWidth = depth * 1.2;
        ctx.lineCap = "round";
        ctx.stroke();

        /* Sub-branches */
        var spread = 0.4 + Math.random() * 0.2;
        drawBranches(t, ex, ey, len * 0.68, a - spread, depth - 1, sway);
        drawBranches(t, ex, ey, len * 0.65, a + spread, depth - 1, sway);

        /* Tiny leaves on terminal branches */
        if (depth <= 2) {
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = PAL.leafGreen;
            ctx.beginPath();
            ctx.ellipse(ex, ey, 4, 2.5, a, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    /* ================================================================
       SCENE 4: ASTROLABE / STAR CHART (manuscript plate)
       ================================================================ */
    function drawScene_astrolabe(t, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;

        /* Parchment background */
        ctx.fillStyle = PAL.cream;
        ctx.fillRect(0, 0, W, H);

        /* Aged texture */
        ctx.save();
        ctx.globalAlpha = 0.06;
        for (var i = 0; i < 40; i++) {
            var rx = (i * 137 + 29) % W;
            var ry = (i * 91 + 53) % H;
            ctx.beginPath();
            ctx.arc(rx, ry, 20 + i % 30, 0, Math.PI * 2);
            ctx.fillStyle = i % 2 ? PAL.gold : PAL.peach;
            ctx.fill();
        }
        ctx.restore();

        var cxp = W / 2;
        var cyp = H / 2;
        var outerR = Math.min(W, H) * 0.32;

        /* Outer astrolabe ring */
        ctx.beginPath();
        ctx.arc(cxp, cyp, outerR, 0, Math.PI * 2);
        ctx.strokeStyle = PAL.gold;
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cxp, cyp, outerR * 0.92, 0, Math.PI * 2);
        ctx.strokeStyle = PAL.gold;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        /* Degree markings */
        for (var d = 0; d < 360; d += 10) {
            var da = (d * Math.PI) / 180;
            var r1 = outerR * 0.92;
            var r2 = d % 30 === 0 ? outerR * 0.85 : outerR * 0.88;
            ctx.beginPath();
            ctx.moveTo(cxp + Math.cos(da) * r1, cyp + Math.sin(da) * r1);
            ctx.lineTo(cxp + Math.cos(da) * r2, cyp + Math.sin(da) * r2);
            ctx.strokeStyle = PAL.gold;
            ctx.lineWidth = d % 30 === 0 ? 1.2 : 0.6;
            ctx.stroke();
        }

        /* Rotating star pattern */
        ctx.save();
        ctx.translate(cxp, cyp);
        ctx.rotate(t * 0.0001);

        /* 8-pointed star */
        for (var s = 0; s < 8; s++) {
            var sa = (Math.PI / 4) * s;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(sa) * outerR * 0.7, Math.sin(sa) * outerR * 0.7);
            ctx.strokeStyle = "rgba(201,169,110,0.4)";
            ctx.lineWidth = 1;
            ctx.stroke();

            /* Star endpoints */
            ctx.beginPath();
            ctx.arc(Math.cos(sa) * outerR * 0.7, Math.sin(sa) * outerR * 0.7, 3, 0, Math.PI * 2);
            ctx.fillStyle = PAL.gold;
            ctx.fill();
        }

        /* Concentric circles (celestial rings) */
        for (var ring = 1; ring <= 4; ring++) {
            ctx.beginPath();
            ctx.arc(0, 0, outerR * 0.15 * ring, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(201,169,110,0.25)";
            ctx.lineWidth = 0.8;
            ctx.stroke();
        }

        ctx.restore();

        /* Calligraphic label */
        ctx.fillStyle = PAL.gold;
        ctx.font = Math.max(11, W * 0.035) + "px 'Amiri', serif";
        ctx.textAlign = "center";
        ctx.fillText("\u0627\u0644\u0632\u064A\u062C", cxp, cyp + outerR + Math.min(W, H) * 0.06); /* الزيج */

        /* Small star dots scattered */
        ctx.save();
        ctx.globalAlpha = 0.3;
        for (var sd = 0; sd < 20; sd++) {
            var sdx = cxp + Math.cos(sd * 1.3 + t * 0.00005) * outerR * (0.4 + sd * 0.03);
            var sdy = cyp + Math.sin(sd * 1.7 + t * 0.00005) * outerR * (0.4 + sd * 0.03);
            ctx.beginPath();
            ctx.arc(sdx, sdy, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = PAL.gold;
            ctx.fill();
        }
        ctx.restore();

        ctx.restore();
    }

    /* ================================================================
       SCENE 5: BOTANICAL PLATE (manuscript)
       ================================================================ */
    function drawScene_botanical(t, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;

        /* Parchment */
        ctx.fillStyle = PAL.creamLight;
        ctx.fillRect(0, 0, W, H);

        /* Aged stains */
        ctx.save();
        ctx.globalAlpha = 0.04;
        for (var i = 0; i < 15; i++) {
            ctx.beginPath();
            ctx.arc((i * 179) % W, (i * 131) % H, 30 + i * 5, 0, Math.PI * 2);
            ctx.fillStyle = PAL.peach;
            ctx.fill();
        }
        ctx.restore();

        var cxp = W / 2;
        var cyp = H * 0.42;

        /* Stem */
        ctx.beginPath();
        ctx.moveTo(cxp, cyp + Math.min(W, H) * 0.15);
        ctx.quadraticCurveTo(cxp - 10, cyp, cxp, cyp - Math.min(W, H) * 0.12);
        ctx.strokeStyle = PAL.leafGreen;
        ctx.lineWidth = 2;
        ctx.stroke();

        /* Leaves */
        drawLeaf(cxp - 12, cyp + 10, -0.3, 20, 10, PAL.leafGreen);
        drawLeaf(cxp + 12, cyp + 25, 0.3, 18, 9, PAL.leafGreen);
        drawLeaf(cxp - 8, cyp - 5, -0.4, 16, 8, PAL.leafDark);

        /* Flower petals */
        var flowerColors = [PAL.peach, PAL.peachLight, PAL.peach, PAL.goldLight];
        for (var p = 0; p < 6; p++) {
            var pa = (Math.PI / 3) * p + t * 0.00008;
            var pr = Math.min(W, H) * 0.06;
            ctx.save();
            ctx.translate(cxp, cyp - Math.min(W, H) * 0.12);
            ctx.rotate(pa);
            ctx.beginPath();
            ctx.ellipse(0, -pr * 0.5, pr * 0.3, pr * 0.6, 0, 0, Math.PI * 2);
            ctx.fillStyle = flowerColors[p % flowerColors.length];
            ctx.globalAlpha = 0.6 * alpha;
            ctx.fill();
            ctx.restore();
        }

        /* Flower center */
        ctx.beginPath();
        ctx.arc(cxp, cyp - Math.min(W, H) * 0.12, 5, 0, Math.PI * 2);
        ctx.fillStyle = PAL.gold;
        ctx.fill();

        /* Handwritten caption lines */
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = PAL.gold;
        var capY = cyp + Math.min(W, H) * 0.2;
        for (var cl = 0; cl < 3; cl++) {
            var lw = W * 0.3 + Math.sin(cl * 2.1) * W * 0.08;
            ctx.fillRect(cxp - lw / 2, capY + cl * 14, lw, 1.5);
        }
        ctx.restore();

        ctx.restore();
    }

    function drawLeaf(x, y, angle, w, h, color) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(w * 0.5, -h, w, 0);
        ctx.quadraticCurveTo(w * 0.5, h, 0, 0);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.5;
        ctx.fill();
        ctx.restore();
    }

    /* ================================================================
       SCENE 6: MOON CROSS-SECTION (manuscript)
       ================================================================ */
    function drawScene_moonCross(t, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;

        /* Dark parchment */
        ctx.fillStyle = "#2A2520";
        ctx.fillRect(0, 0, W, H);

        var cxp = W / 2;
        var cyp = H * 0.42;
        var r = Math.min(W, H) * 0.2;

        /* Outer circle */
        ctx.beginPath();
        ctx.arc(cxp, cyp, r, 0, Math.PI * 2);
        ctx.strokeStyle = PAL.gold;
        ctx.lineWidth = 2;
        ctx.stroke();

        /* Inner layers */
        ctx.beginPath();
        ctx.arc(cxp, cyp, r * 0.7, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(201,169,110,0.5)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cxp, cyp, r * 0.35, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(201,169,110,0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();

        /* Radial hatching lines */
        for (var hl = 0; hl < 12; hl++) {
            var ha = (Math.PI / 6) * hl;
            ctx.beginPath();
            ctx.moveTo(cxp + Math.cos(ha) * r * 0.35, cyp + Math.sin(ha) * r * 0.35);
            ctx.lineTo(cxp + Math.cos(ha) * r * 0.7, cyp + Math.sin(ha) * r * 0.7);
            ctx.strokeStyle = "rgba(201,169,110,0.15)";
            ctx.lineWidth = 0.6;
            ctx.stroke();
        }

        /* Labels along lines */
        ctx.fillStyle = "rgba(201,169,110,0.5)";
        ctx.font = Math.max(8, W * 0.022) + "px 'Amiri', serif";
        ctx.textAlign = "center";
        ctx.fillText("\u0627\u0644\u0642\u0645\u0631", cxp, cyp + r + Math.min(W, H) * 0.05); /* القمر */

        /* Reference lines pointing out */
        for (var rl = 0; rl < 4; rl++) {
            var ra = (Math.PI / 2) * rl + 0.3;
            var rlx = cxp + Math.cos(ra) * (r + 15);
            var rly = cyp + Math.sin(ra) * (r + 15);
            var rlex = cxp + Math.cos(ra) * (r + 40);
            var rley = cyp + Math.sin(ra) * (r + 40);
            ctx.beginPath();
            ctx.moveTo(rlx, rly);
            ctx.lineTo(rlex, rley);
            ctx.strokeStyle = "rgba(201,169,110,0.3)";
            ctx.lineWidth = 0.8;
            ctx.stroke();
        }

        ctx.restore();
    }

    /* ================================================================
       MONTAGE TIMELINE
       Total ~10 seconds (at 60fps requestAnimationFrame = ~600 frames)
       Each scene: visible for its duration, crossfades overlap
       ================================================================ */
    var SCENES = [
        /*  sceneFn,              startMs,  durMs,  vignetteType
            "sky"     = nature sky with clouds
            "moon"    = crescent moon emerging
            "branches"= tree branches swaying
            "astro"   = astrolabe manuscript
            "botan"   = botanical manuscript
            "moonX"   = moon cross-section manuscript
            "final"   = sky with logo space
        */
        { fn: drawScene_sky,       start: 0,    dur: 2800,  vig: "none" },
        { fn: drawScene_astrolabe, start: 2400, dur: 2400,  vig: "lens" },
        { fn: drawScene_moon,      start: 4400, dur: 2200,  vig: "none" },
        { fn: drawScene_moonCross, start: 6200, dur: 1800,  vig: "lens" },
        { fn: drawScene_branches,  start: 7600, dur: 2400,  vig: "none" },
        { fn: drawScene_botanical, start: 9600, dur: 2200,  vig: "lens" },
        { fn: drawScene_sky,       start: 11400, dur: 3600, vig: "vignette" }  /* final: sky + logo space */
    ];
    var CROSSFADE = 800; /* ms overlap between scenes */
    var TOTAL_MS = 15000; /* loop point */

    function drawMontage(t) {
        var ms = t % TOTAL_MS;

        for (var i = 0; i < SCENES.length; i++) {
            var s = SCENES[i];
            var end = s.start + s.dur;

            /* Is this scene active? */
            if (ms < s.start - CROSSFADE || ms > end + CROSSFADE) continue;

            /* Calculate alpha (fade in / fade out / hold) */
            var alpha = 1;
            if (ms < s.start + CROSSFADE) {
                /* Fading in */
                alpha = (ms - s.start + CROSSFADE) / CROSSFADE;
            } else if (ms > end - CROSSFADE) {
                /* Fading out */
                alpha = (end - ms + CROSSFADE) / CROSSFADE;
            }
            alpha = Math.max(0, Math.min(1, alpha));

            if (alpha <= 0) continue;

            /* Draw scene */
            s.fn(t, alpha);

            /* Draw vignette overlay */
            if (s.vig === "lens") {
                drawLensVignette(alpha);
            } else if (s.vig === "vignette") {
                drawVignette(alpha);
            }
        }
    }

    /* ================================================================
       FLOATING PARTICLES (warm gold dust)
       ================================================================ */
    var dustParticles = [];
    for (var di = 0; di < 18; di++) {
        dustParticles.push({
            x: Math.random(),
            y: Math.random(),
            size: 1 + Math.random() * 2,
            speed: 0.0001 + Math.random() * 0.0003,
            phase: Math.random() * Math.PI * 2
        });
    }

    function drawDust(t) {
        ctx.save();
        ctx.globalAlpha = 0.25;
        for (var i = 0; i < dustParticles.length; i++) {
            var p = dustParticles[i];
            var px = (p.x + Math.sin(t * p.speed + p.phase) * 0.05) * W;
            var py = ((p.y - t * 0.00002) % 1 + 1) % 1 * H;
            ctx.beginPath();
            ctx.arc(px, py, p.size, 0, Math.PI * 2);
            ctx.fillStyle = PAL.moonGold;
            ctx.fill();
        }
        ctx.restore();
    }

    /* ================================================================
       MAIN LOOP
       ================================================================ */
    var running = true;
    var rafId;

    function frame(t) {
        if (!running) return;
        ctx.clearRect(0, 0, W, H);

        if (reducedMotion) t = 0;

        /* Draw the montage */
        drawMontage(t);

        /* Grain overlay */
        drawGrain();

        /* Floating dust */
        drawDust(t);

        rafId = requestAnimationFrame(frame);
    }

    /* Pause when hidden */
    document.addEventListener("visibilitychange", function () {
        if (document.hidden) {
            running = false;
            if (rafId) cancelAnimationFrame(rafId);
        } else {
            running = true;
            rafId = requestAnimationFrame(frame);
        }
    });

    /* Theme observer */
    if (window.MutationObserver) {
        new MutationObserver(function () {}).observe(
            document.documentElement,
            { attributes: true, attributeFilter: ["data-theme"] }
        );
    }

    rafId = requestAnimationFrame(frame);
})();
