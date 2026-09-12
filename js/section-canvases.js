/* SIRATKIDS — Section cinematic canvas animations
   Each section gets a unique, lightweight background scene.
   Low particle counts + IntersectionObserver = no perf hit.
   Loaded by index.html only. */
(function () {
    "use strict";

    var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var canvases = [];
    var running = true;
    var rafId;

    function isDark() {
        return document.documentElement.getAttribute("data-theme") === "dark";
    }

    /* ================================================================
       CANVAS INIT
       ================================================================ */
    function initCanvas(el) {
        var section = el.parentElement;
        var item = {
            el: el,
            ctx: el.getContext("2d"),
            section: section,
            type: el.getAttribute("data-section"),
            visible: false,
            W: 0, H: 0, dpr: 1,
            state: {}
        };
        resizeCanvas(item);
        canvases.push(item);

        if (window.IntersectionObserver) {
            var obs = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) { item.visible = e.isIntersecting; });
            }, { threshold: 0.05 });
            obs.observe(section);
        } else {
            item.visible = true;
        }
        return item;
    }

    function resizeCanvas(item) {
        item.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        item.W = item.el.offsetWidth;
        item.H = item.el.parentElement.offsetHeight;
        item.el.width = item.W * item.dpr;
        item.el.height = item.H * item.dpr;
        item.ctx.setTransform(item.dpr, 0, 0, item.dpr, 0, 0);
    }

    /* ================================================================
       MISSION — Fire star / meteor falling from space to earth
       ================================================================ */
    function initMission(item) {
        var s = item.state;
        s.stars = [];
        for (var i = 0; i < 30; i++) {
            s.stars.push({
                x: Math.random(), y: Math.random(),
                r: 0.3 + Math.random() * 1.2,
                alpha: 0.2 + Math.random() * 0.5,
                twinkle: Math.random() * Math.PI * 2
            });
        }
        resetMeteor(s, item.W, item.H);
    }

    function resetMeteor(s, W, H) {
        s.meteorX = W * (0.6 + Math.random() * 0.3);
        s.meteorY = -20;
        s.meteorTargetY = H * (0.55 + Math.random() * 0.2);
        s.meteorSpeed = 1.5 + Math.random() * 1.5;
        s.meteorAngle = Math.PI / 2 + (Math.random() - 0.5) * 0.3;
        s.meteorTrail = [];
        s.meteorPhase = "falling"; /* falling → impact → fading */
        s.meteorAlpha = 1;
        s.impactTime = 0;
    }

    function drawMission(item, t, dark) {
        var ctx = item.ctx, W = item.W, H = item.H;
        var s = item.state;

        /* Deep space → earth gradient */
        var sky = ctx.createLinearGradient(0, 0, 0, H);
        if (dark) {
            sky.addColorStop(0, "#050810");
            sky.addColorStop(0.3, "#0C1225");
            sky.addColorStop(0.6, "#1A1040");
            sky.addColorStop(0.85, "#1B2560");
            sky.addColorStop(1, "#0D3B2A");
        } else {
            sky.addColorStop(0, "#0B1028");
            sky.addColorStop(0.3, "#1A1848");
            sky.addColorStop(0.6, "#2A2060");
            sky.addColorStop(0.85, "#3A4FA0");
            sky.addColorStop(1, "#2D6B4A");
        }
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);

        /* Earth horizon glow */
        var horizonY = H * 0.82;
        var glowH = ctx.createRadialGradient(W * 0.5, horizonY, 0, W * 0.5, horizonY, W * 0.5);
        glowH.addColorStop(0, dark ? "rgba(45,107,74,0.15)" : "rgba(45,107,74,0.2)");
        glowH.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glowH;
        ctx.fillRect(0, 0, W, H);

        /* Earth surface hint */
        ctx.save();
        ctx.globalAlpha = dark ? 0.12 : 0.15;
        ctx.fillStyle = dark ? "#1A4030" : "#2D6B4A";
        ctx.beginPath();
        ctx.ellipse(W * 0.5, H * 1.05, W * 0.7, H * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        /* Background stars */
        for (var i = 0; i < s.stars.length; i++) {
            var st = s.stars[i];
            var tw = st.alpha * (0.5 + 0.5 * Math.sin(t * 0.001 + st.twinkle));
            ctx.beginPath();
            ctx.arc(st.x * W, st.y * H, st.r, 0, Math.PI * 2);
            ctx.fillStyle = dark
                ? "rgba(255,255,220," + (tw * 0.7).toFixed(3) + ")"
                : "rgba(255,255,255," + tw.toFixed(3) + ")";
            ctx.fill();
        }

        /* Meteor */
        if (s.meteorPhase === "falling") {
            s.meteorY += s.meteorSpeed;
            s.meteorX += Math.cos(s.meteorAngle) * s.meteorSpeed * 0.3;
            s.meteorTrail.push({ x: s.meteorX, y: s.meteorY, age: 0 });
            if (s.meteorTrail.length > 25) s.meteorTrail.shift();
            if (s.meteorY >= s.meteorTargetY) {
                s.meteorPhase = "impact";
                s.impactTime = t;
            }
        } else if (s.meteorPhase === "impact") {
            s.meteorAlpha -= 0.015;
            if (t - s.impactTime > 600) {
                s.meteorPhase = "fading";
            }
        } else {
            s.meteorAlpha -= 0.008;
            if (s.meteorAlpha <= 0) {
                resetMeteor(s, W, H);
                s.meteorAlpha = 1;
            }
        }

        /* Draw trail */
        if (s.meteorTrail.length > 1) {
            for (var j = 0; j < s.meteorTrail.length; j++) {
                var tr = s.meteorTrail[j];
                var prog = j / s.meteorTrail.length;
                var tAlpha = prog * s.meteorAlpha * 0.5;
                var tWidth = 1 + prog * 3;
                ctx.beginPath();
                ctx.arc(tr.x, tr.y, tWidth, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(251,180,80," + tAlpha.toFixed(3) + ")";
                ctx.fill();
            }
        }

        /* Meteor head */
        if (s.meteorAlpha > 0.05) {
            /* Glow */
            ctx.save();
            ctx.globalAlpha = 0.25 * s.meteorAlpha;
            var mGlow = ctx.createRadialGradient(s.meteorX, s.meteorY, 0, s.meteorX, s.meteorY, 30);
            mGlow.addColorStop(0, "rgba(255,200,80,0.8)");
            mGlow.addColorStop(0.5, "rgba(255,120,30,0.3)");
            mGlow.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = mGlow;
            ctx.fillRect(s.meteorX - 35, s.meteorY - 35, 70, 70);
            ctx.restore();

            /* Core */
            ctx.beginPath();
            ctx.arc(s.meteorX, s.meteorY, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255,240,200," + s.meteorAlpha.toFixed(3) + ")";
            ctx.fill();
        }

        /* Impact flash */
        if (s.meteorPhase === "impact") {
            var flash = Math.max(0, 1 - (t - s.impactTime) / 600);
            if (flash > 0) {
                ctx.save();
                ctx.globalAlpha = flash * 0.2;
                var impGlow = ctx.createRadialGradient(s.meteorX, s.meteorTargetY, 0, s.meteorX, s.meteorTargetY, 80);
                impGlow.addColorStop(0, "rgba(255,200,80,0.9)");
                impGlow.addColorStop(1, "rgba(0,0,0,0)");
                ctx.fillStyle = impGlow;
                ctx.fillRect(s.meteorX - 90, s.meteorTargetY - 90, 180, 180);
                ctx.restore();
            }
        }
    }

    /* ================================================================
       JOURNEY — Space planets scattered in background
       ================================================================ */
    function initJourney(item) {
        var s = item.state;
        s.stars = [];
        for (var i = 0; i < 40; i++) {
            s.stars.push({
                x: Math.random(), y: Math.random(),
                r: 0.3 + Math.random() * 1,
                alpha: 0.15 + Math.random() * 0.4,
                twinkle: Math.random() * Math.PI * 2
            });
        }
        /* 5 planets */
        var planetDefs = [
            { x: 0.12, y: 0.2, r: 18, color: [201,169,110], ring: false, speed: 0.00008 },
            { x: 0.75, y: 0.35, r: 12, color: [139,100,60],  ring: false, speed: -0.00012 },
            { x: 0.4,  y: 0.6, r: 22, color: [42,55,138],   ring: true,  speed: 0.00006 },
            { x: 0.88, y: 0.7, r: 10, color: [160,58,56],   ring: false, speed: -0.0001 },
            { x: 0.25, y: 0.85, r: 14, color: [13,148,136],  ring: false, speed: 0.00009 }
        ];
        s.planets = [];
        for (var p = 0; p < planetDefs.length; p++) {
            var pd = planetDefs[p];
            s.planets.push({
                baseX: pd.x, baseY: pd.y,
                r: pd.r, color: pd.color, ring: pd.ring, speed: pd.speed,
                angle: Math.random() * Math.PI * 2,
                driftX: (Math.random() - 0.5) * 0.003,
                driftY: (Math.random() - 0.5) * 0.002
            });
        }
        s.nebulaPhase = Math.random() * Math.PI * 2;
    }

    function drawJourney(item, t, dark) {
        var ctx = item.ctx, W = item.W, H = item.H;
        var s = item.state;

        /* Deep space */
        var sky = ctx.createLinearGradient(0, 0, W, H);
        if (dark) {
            sky.addColorStop(0, "#050810");
            sky.addColorStop(0.5, "#0A0E20");
            sky.addColorStop(1, "#0F0828");
        } else {
            sky.addColorStop(0, "#0B1028");
            sky.addColorStop(0.5, "#151838");
            sky.addColorStop(1, "#1A1548");
        }
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);

        /* Nebula glow */
        var nx = W * (0.4 + Math.sin(t * 0.0001 + s.nebulaPhase) * 0.1);
        var ny = H * (0.4 + Math.cos(t * 0.00008 + s.nebulaPhase) * 0.1);
        var ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, W * 0.35);
        ng.addColorStop(0, dark ? "rgba(42,55,138,0.06)" : "rgba(42,55,138,0.08)");
        ng.addColorStop(0.5, "rgba(139,100,60,0.03)");
        ng.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = ng;
        ctx.fillRect(0, 0, W, H);

        /* Stars */
        for (var i = 0; i < s.stars.length; i++) {
            var st = s.stars[i];
            var tw = st.alpha * (0.4 + 0.6 * Math.sin(t * 0.001 + st.twinkle));
            ctx.beginPath();
            ctx.arc(st.x * W, st.y * H, st.r, 0, Math.PI * 2);
            ctx.fillStyle = dark
                ? "rgba(255,255,220," + (tw * 0.6).toFixed(3) + ")"
                : "rgba(255,255,255," + tw.toFixed(3) + ")";
            ctx.fill();
        }

        /* Planets */
        for (var p = 0; p < s.planets.length; p++) {
            var pl = s.planets[p];
            if (!reducedMotion) {
                pl.angle += pl.speed;
                pl.baseX += pl.driftX;
                pl.baseY += pl.driftY;
                if (pl.baseX < -0.05) pl.baseX = 1.05;
                if (pl.baseX > 1.05) pl.baseX = -0.05;
                if (pl.baseY < -0.05) pl.baseY = 1.05;
                if (pl.baseY > 1.05) pl.baseY = -0.05;
            }
            var px = pl.baseX * W;
            var py = pl.baseY * H;

            ctx.save();
            ctx.globalAlpha = dark ? 0.25 : 0.3;

            /* Planet glow */
            var pg = ctx.createRadialGradient(px, py, pl.r * 0.5, px, py, pl.r * 2.5);
            pg.addColorStop(0, "rgba(" + pl.color.join(",") + ",0.15)");
            pg.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = pg;
            ctx.beginPath();
            ctx.arc(px, py, pl.r * 2.5, 0, Math.PI * 2);
            ctx.fill();

            /* Planet body */
            var bodyGrad = ctx.createRadialGradient(px - pl.r * 0.3, py - pl.r * 0.3, 0, px, py, pl.r);
            bodyGrad.addColorStop(0, "rgba(" + pl.color.join(",") + ",0.5)");
            bodyGrad.addColorStop(1, "rgba(" + pl.color.join(",") + ",0.15)");
            ctx.fillStyle = bodyGrad;
            ctx.beginPath();
            ctx.arc(px, py, pl.r, 0, Math.PI * 2);
            ctx.fill();

            /* Planet outline */
            ctx.strokeStyle = "rgba(" + pl.color.join(",") + ",0.3)";
            ctx.lineWidth = 1;
            ctx.stroke();

            /* Ring */
            if (pl.ring) {
                ctx.save();
                ctx.translate(px, py);
                ctx.scale(1, 0.35);
                ctx.beginPath();
                ctx.arc(0, 0, pl.r * 1.6, 0, Math.PI * 2);
                ctx.strokeStyle = "rgba(" + pl.color.join(",") + ",0.2)";
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.restore();
            }

            ctx.restore();
        }
    }

    /* ================================================================
       SUBJECTS — Open book with floating knowledge symbols
       ================================================================ */
    function initSubjects(item) {
        var s = item.state;
        s.symbols = [];
        var types = ["star", "crescent", "leaf", "pen", "circle"];
        for (var i = 0; i < 6; i++) {
            s.symbols.push({
                type: types[i % types.length],
                x: 0.15 + Math.random() * 0.7,
                y: 1.0 + Math.random() * 0.2,
                r: 6 + Math.random() * 8,
                speed: 0.02 + Math.random() * 0.03,
                drift: (Math.random() - 0.5) * 0.01,
                alpha: 0.15 + Math.random() * 0.15,
                phase: Math.random() * Math.PI * 2
            });
        }
        s.bookOpen = 0;
    }

    function drawSubjects(item, t, dark) {
        var ctx = item.ctx, W = item.W, H = item.H;
        var s = item.state;

        /* Soft background */
        ctx.fillStyle = dark ? "rgba(15,12,30,0.95)" : "rgba(251,246,236,0.95)";
        ctx.fillRect(0, 0, W, H);

        /* Central open book */
        var bx = W * 0.5, by = H * 0.45;
        var bw = Math.min(W * 0.25, 160), bh = bw * 0.7;
        if (!reducedMotion) {
            s.bookOpen = Math.min(1, s.bookOpen + 0.008);
        } else {
            s.bookOpen = 1;
        }

        ctx.save();
        ctx.globalAlpha = dark ? 0.12 : 0.15;

        /* Left page */
        ctx.save();
        ctx.translate(bx, by);
        ctx.transform(-0.9 * s.bookOpen, -0.1, 0, 1, -bw * 0.05, 0);
        ctx.fillStyle = dark ? "rgba(201,169,110,0.3)" : "rgba(42,55,138,0.15)";
        ctx.fillRect(-bw, -bh, bw, bh * 2);
        ctx.restore();

        /* Right page */
        ctx.save();
        ctx.translate(bx, by);
        ctx.transform(0.9 * s.bookOpen, 0.1, 0, 1, bw * 0.05, 0);
        ctx.fillStyle = dark ? "rgba(201,169,110,0.3)" : "rgba(42,55,138,0.15)";
        ctx.fillRect(0, -bh, bw, bh * 2);
        ctx.restore();

        /* Spine */
        ctx.beginPath();
        ctx.moveTo(bx, by - bh);
        ctx.lineTo(bx, by + bh);
        ctx.strokeStyle = dark ? "rgba(201,169,110,0.2)" : "rgba(42,55,138,0.15)";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();

        /* Floating symbols */
        for (var i = 0; i < s.symbols.length; i++) {
            var sym = s.symbols[i];
            if (!reducedMotion) {
                sym.y -= sym.speed;
                sym.x += sym.drift + Math.sin(t * 0.0005 + sym.phase) * 0.002;
                if (sym.y < -0.1) {
                    sym.y = 1.05;
                    sym.x = 0.15 + Math.random() * 0.7;
                }
            }
            var sx = sym.x * W;
            var sy = sym.y * H;

            ctx.save();
            ctx.globalAlpha = sym.alpha;
            ctx.translate(sx, sy);
            ctx.rotate(t * 0.0005 + sym.phase);

            if (sym.type === "star") {
                drawMiniStar(ctx, 0, 0, sym.r, dark);
            } else if (sym.type === "crescent") {
                ctx.beginPath();
                ctx.arc(0, 0, sym.r, 0, Math.PI * 2);
                ctx.arc(sym.r * 0.3, 0, sym.r * 0.7, 0, Math.PI * 2, true);
                ctx.fillStyle = dark ? "rgba(201,169,110,0.4)" : "rgba(42,55,138,0.3)";
                ctx.fill();
            } else if (sym.type === "leaf") {
                ctx.beginPath();
                ctx.moveTo(0, -sym.r);
                ctx.quadraticCurveTo(sym.r * 0.7, 0, 0, sym.r);
                ctx.quadraticCurveTo(-sym.r * 0.7, 0, 0, -sym.r);
                ctx.fillStyle = dark ? "rgba(13,148,136,0.3)" : "rgba(13,148,136,0.25)";
                ctx.fill();
            } else if (sym.type === "pen") {
                ctx.beginPath();
                ctx.moveTo(0, -sym.r);
                ctx.lineTo(2, sym.r * 0.6);
                ctx.lineTo(-2, sym.r * 0.6);
                ctx.closePath();
                ctx.fillStyle = dark ? "rgba(160,58,56,0.35)" : "rgba(160,58,56,0.25)";
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.arc(0, 0, sym.r * 0.5, 0, Math.PI * 2);
                ctx.fillStyle = dark ? "rgba(42,55,138,0.3)" : "rgba(42,55,138,0.2)";
                ctx.fill();
            }
            ctx.restore();
        }
    }

    function drawMiniStar(ctx, cx, cy, r, dark) {
        ctx.beginPath();
        for (var i = 0; i < 8; i++) {
            var a = (Math.PI / 4) * i;
            var rad = i % 2 === 0 ? r : r * 0.4;
            if (i === 0) ctx.moveTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
            else ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
        }
        ctx.closePath();
        ctx.fillStyle = dark ? "rgba(201,169,110,0.3)" : "rgba(42,55,138,0.2)";
        ctx.fill();
    }

    /* ================================================================
       WHY — Shield / fortress being fortified
       ================================================================ */
    function initWhy(item) {
        var s = item.state;
        s.shieldAngle = 0;
        s.rings = [];
        for (var i = 0; i < 4; i++) {
            s.rings.push({ r: 30 + i * 18, alpha: 0.1 + i * 0.05, rot: Math.random() * Math.PI * 2 });
        }
        s.particles = [];
        for (var j = 0; j < 8; j++) {
            s.particles.push({
                angle: Math.random() * Math.PI * 2,
                dist: 50 + Math.random() * 60,
                r: 1.5 + Math.random() * 2,
                speed: 0.0003 + Math.random() * 0.0004,
                alpha: 0.15 + Math.random() * 0.2
            });
        }
    }

    function drawWhy(item, t, dark) {
        var ctx = item.ctx, W = item.W, H = item.H;
        var s = item.state;

        /* Subtle gradient bg */
        var bg = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.5);
        bg.addColorStop(0, dark ? "rgba(27,37,96,0.08)" : "rgba(42,55,138,0.06)");
        bg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        var cx = W * 0.5, cy = H * 0.5;

        /* Concentric rings */
        for (var i = 0; i < s.rings.length; i++) {
            var ring = s.rings[i];
            if (!reducedMotion) ring.rot += 0.0008;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(ring.rot);
            ctx.beginPath();
            ctx.arc(0, 0, ring.r, 0, Math.PI * 2);
            ctx.strokeStyle = dark
                ? "rgba(201,169,110," + ring.alpha.toFixed(3) + ")"
                : "rgba(42,55,138," + (ring.alpha * 0.8).toFixed(3) + ")";
            ctx.lineWidth = 1.2;
            ctx.stroke();
            ctx.restore();
        }

        /* Shield shape */
        if (!reducedMotion) s.shieldAngle += 0.001;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(Math.sin(s.shieldAngle) * 0.05);
        ctx.globalAlpha = dark ? 0.15 : 0.18;

        var sr = Math.min(W, H) * 0.18;
        ctx.beginPath();
        ctx.moveTo(0, -sr);
        ctx.lineTo(sr * 0.7, -sr * 0.5);
        ctx.lineTo(sr * 0.7, sr * 0.2);
        ctx.quadraticCurveTo(sr * 0.3, sr * 0.9, 0, sr);
        ctx.quadraticCurveTo(-sr * 0.3, sr * 0.9, -sr * 0.7, sr * 0.2);
        ctx.lineTo(-sr * 0.7, -sr * 0.5);
        ctx.closePath();

        var sGrad = ctx.createLinearGradient(0, -sr, 0, sr);
        sGrad.addColorStop(0, dark ? "rgba(201,169,110,0.3)" : "rgba(42,55,138,0.2)");
        sGrad.addColorStop(1, dark ? "rgba(201,169,110,0.1)" : "rgba(42,55,138,0.08)");
        ctx.fillStyle = sGrad;
        ctx.fill();
        ctx.strokeStyle = dark ? "rgba(201,169,110,0.25)" : "rgba(42,55,138,0.2)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.restore();

        /* Orbiting particles */
        for (var j = 0; j < s.particles.length; j++) {
            var pp = s.particles[j];
            if (!reducedMotion) pp.angle += pp.speed;
            var ppx = cx + Math.cos(pp.angle) * pp.dist;
            var ppy = cy + Math.sin(pp.angle) * pp.dist;
            ctx.beginPath();
            ctx.arc(ppx, ppy, pp.r, 0, Math.PI * 2);
            ctx.fillStyle = dark
                ? "rgba(201,169,110," + pp.alpha.toFixed(3) + ")"
                : "rgba(42,55,138," + (pp.alpha * 0.8).toFixed(3) + ")";
            ctx.fill();
        }
    }

    /* ================================================================
       CTA — Rising gold dust
       ================================================================ */
    function initCTA(item) {
        var s = item.state;
        s.dust = [];
        for (var i = 0; i < 12; i++) {
            s.dust.push({
                x: Math.random(), y: 1.0 + Math.random() * 0.2,
                r: 0.8 + Math.random() * 1.5,
                speed: 0.0003 + Math.random() * 0.0006,
                drift: (Math.random() - 0.5) * 0.0003,
                alpha: 0.15 + Math.random() * 0.3,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    function drawCTA(item, t, dark) {
        var ctx = item.ctx, W = item.W, H = item.H;
        var s = item.state;

        for (var i = 0; i < s.dust.length; i++) {
            var d = s.dust[i];
            if (!reducedMotion) {
                d.y -= d.speed;
                d.x += d.drift + Math.sin(t * 0.0004 + d.phase) * 0.0002;
                if (d.y < -0.05) {
                    d.y = 1.05;
                    d.x = Math.random();
                }
            }
            ctx.beginPath();
            ctx.arc(d.x * W, d.y * H, d.r, 0, Math.PI * 2);
            ctx.fillStyle = dark
                ? "rgba(251,214,121," + (d.alpha * 0.6).toFixed(3) + ")"
                : "rgba(201,169,110," + d.alpha.toFixed(3) + ")";
            ctx.fill();
        }
    }

    /* ================================================================
       DISPATCH
       ================================================================ */
    var inits = { mission: initMission, journey: initJourney, subjects: initSubjects, why: initWhy, cta: initCTA };
    var draws = { mission: drawMission, journey: drawJourney, subjects: drawSubjects, why: drawWhy, cta: drawCTA };

    function initObjects(item) {
        if (inits[item.type]) inits[item.type](item);
    }

    /* ================================================================
       MAIN LOOP
       ================================================================ */
    function frame(t) {
        if (!running) { rafId = requestAnimationFrame(frame); return; }
        var dark = isDark();

        for (var i = 0; i < canvases.length; i++) {
            var item = canvases[i];
            if (!item.visible) continue;
            item.ctx.clearRect(0, 0, item.W, item.H);
            if (draws[item.type]) draws[item.type](item, t, dark);
        }

        rafId = requestAnimationFrame(frame);
    }

    document.addEventListener("visibilitychange", function () { running = !document.hidden; });

    /* ================================================================
       INIT
       ================================================================ */
    function init() {
        var els = document.querySelectorAll(".section-canvas");
        for (var i = 0; i < els.length; i++) {
            var item = initCanvas(els[i]);
            initObjects(item);
        }
        rafId = requestAnimationFrame(frame);
    }

    var resizeTimer;
    window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            for (var i = 0; i < canvases.length; i++) {
                resizeCanvas(canvases[i]);
                initObjects(canvases[i]);
            }
        }, 200);
    });

    if (window.MutationObserver) {
        new MutationObserver(function () {}).observe(
            document.documentElement,
            { attributes: true, attributeFilter: ["data-theme"] }
        );
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
