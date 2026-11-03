/* ============================================================================
   fx.js —— 粒子与互动特效层（无依赖，纯 canvas + CSS）
   ----------------------------------------------------------------------------
   设计原则：
   1. 只做"短命"的爆发特效（夺冠、抽卡、开打、结算），不做常驻漂浮物，
      避免挡住正文；粒子画布 pointer-events:none，层级在内容之上、顶栏之下。
   2. 任何环境里都不许抛错：没有 document / canvas / getContext / rAF 时全部降级为 no-op，
      qa2 与 repair_check 的 DOM stub 里同样安全。
   3. prefers-reduced-motion: reduce 时只保留极少量或直接跳过。
   4. 全局对外只有 window.FX：
        FX.cue(name, opt)   —— 播一次特效
        FX.scene(type, sc)  —— 场景切换时由 ui.js 调用（切场动画 + 场景专属特效）
        FX.count(el, to)    —— 数字滚动
        FX.shake()          —— 轻微震屏
        FX.flash(color)     —— 全屏闪一下
   ========================================================================== */
(function (root) {
  "use strict";

  var doc = root.document || null;
  var reduce = false;
  try {
    if (root.matchMedia) reduce = !!root.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  var cv = null, ctx = null, dpr = 1, W = 0, H = 0;
  var parts = [], raf = 0, lastT = 0, booted = false;
  var MAX = 520;

  var C = {
    gold:  [232, 185, 35],
    warm:  [255, 219, 138],
    white: [255, 248, 226],
    red:   [206, 66, 66],
    blood: [150, 32, 36],
    blue:  [106, 168, 240],
    purple:[176, 126, 240],
    green: [86, 196, 140],
    ash:   [126, 136, 148]
  };

  /* ---------------- 画布 ---------------- */
  function boot() {
    if (booted || !doc || !doc.body) return !!cv;
    booted = true;
    try {
      cv = doc.createElement("canvas");
      cv.id = "fxCanvas";
      cv.className = "fx-canvas";
      cv.setAttribute("aria-hidden", "true");
      ctx = cv.getContext && cv.getContext("2d");
      if (!ctx) { cv = null; return false; }
      doc.body.appendChild(cv);
      resize();
      root.addEventListener("resize", resize, { passive: true });
      return true;
    } catch (e) { cv = null; ctx = null; return false; }
  }

  function resize() {
    if (!cv || !ctx) return;
    W = root.innerWidth || (doc.documentElement && doc.documentElement.clientWidth) || 1280;
    H = root.innerHeight || (doc.documentElement && doc.documentElement.clientHeight) || 800;
    dpr = Math.min(2, root.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    cv.style.width = W + "px";
    cv.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ---------------- 粒子 ---------------- */
  function push(p) {
    if (parts.length >= MAX) parts.shift();
    parts.push(p);
  }

  function rnd(a, b) { return a + Math.random() * (b - a); }

  function spark(x, y, n, col, spd, life) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, v = rnd(spd * 0.35, spd);
      push({ k: "spark", x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
             g: rnd(120, 320), tt: rnd(life * 0.6, life), t: 0, size: rnd(1.1, 2.4), col: col });
    }
  }

  function dots(x, y, n, col, spd, life, rad) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, v = rnd(spd * 0.25, spd);
      push({ k: "dot", x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - rnd(0, 40),
             g: rnd(20, 90), tt: rnd(life * 0.5, life), t: 0, size: rnd(rad * 0.5, rad * 1.5), col: col, glow: true });
    }
  }

  function shards(x, y, n, col, spd, life, dir) {
    for (var i = 0; i < n; i++) {
      var a = dir == null ? Math.random() * Math.PI * 2 : rnd(dir - 0.7, dir + 0.7);
      var v = rnd(spd * 0.4, spd);
      push({ k: "shard", x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
             g: rnd(260, 520), tt: rnd(life * 0.7, life), t: 0, size: rnd(2.5, 6), col: col,
             rot: Math.random() * 6.28, vr: rnd(-6, 6) });
    }
  }

  function coins(x, y, n) {
    for (var i = 0; i < n; i++) {
      push({ k: "coin", x: x + rnd(-40, 40), y: y + rnd(-20, 20), vx: rnd(-60, 60), vy: rnd(-320, -160),
             g: 620, tt: rnd(1.5, 2.2), t: 0, size: rnd(3, 6), col: C.gold, rot: 0, vr: rnd(-4, 4), glow: true });
    }
  }

  function ring(x, y, col, rad, dur) {
    push({ k: "ring", x: x, y: y, vx: 0, vy: 0, g: 0, tt: dur || 0.55, t: 0, size: rad || 10, col: col, grow: rad || 260 });
  }

  function step(now) {
    raf = 0;
    if (!ctx) return;
    if (!lastT) lastT = now;
    var dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    ctx.clearRect(0, 0, W, H);
    if (!parts.length) { lastT = 0; return; }

    ctx.save();
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.t += dt;
      if (p.t >= p.tt) { parts.splice(i, 1); continue; }
      var k = p.t / p.tt, al = 1 - k;
      if (k > 0.82) al = Math.max(0, (1 - k) / 0.18);
      if (p.k === "ring") {
        var r = p.size + p.grow * k;
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = "rgba(" + p.col[0] + "," + p.col[1] + "," + p.col[2] + "," + (0.5 * al) + ")";
        ctx.lineWidth = Math.max(1, 2.4 * al);
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.2832); ctx.stroke();
        continue;
      }
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.rot != null) p.rot += p.vr * dt;

      if (p.k === "spark") {
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = "rgba(" + p.col[0] + "," + p.col[1] + "," + p.col[2] + "," + (0.85 * al) + ")";
        ctx.lineWidth = p.size * 0.8;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.022, p.y - p.vy * 0.022);
        ctx.stroke();
      } else if (p.k === "shard") {
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "rgba(" + p.col[0] + "," + p.col[1] + "," + p.col[2] + "," + (0.8 * al) + ")";
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.beginPath(); ctx.moveTo(0, -p.size); ctx.lineTo(p.size * 0.7, p.size * 0.7); ctx.lineTo(-p.size * 0.55, p.size * 0.5);
        ctx.closePath(); ctx.fill(); ctx.restore();
      } else if (p.k === "coin") {
        ctx.globalCompositeOperation = "lighter";
        var rx = p.size * (0.35 + 0.65 * Math.abs(Math.cos(p.rot * 2)));
        ctx.fillStyle = "rgba(232,185,35," + (0.85 * al) + ")";
        ctx.beginPath(); ctx.ellipse(p.x, p.y, rx, p.size, p.rot, 0, 6.2832); ctx.fill();
        ctx.globalCompositeOperation = "source-over";
      } else {
        ctx.globalCompositeOperation = "lighter";
        var g2 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.4);
        g2.addColorStop(0, "rgba(" + p.col[0] + "," + p.col[1] + "," + p.col[2] + "," + (0.9 * al) + ")");
        g2.addColorStop(1, "rgba(" + p.col[0] + "," + p.col[1] + "," + p.col[2] + ",0)");
        ctx.fillStyle = g2;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 2.4, 0, 6.2832); ctx.fill();
      }
    }
    ctx.restore();
    if (parts.length && root.requestAnimationFrame) raf = root.requestAnimationFrame(step);
  }

  function run() {
    if (!boot()) return;
    if (reduce) {
      /* 减弱动效：只留极少的静态亮斑，一闪即走 */
    }
    if (!raf && root.requestAnimationFrame) raf = root.requestAnimationFrame(step);
  }

  /* ---------------- 全屏闪光 / 震屏 ---------------- */
  function flash(col, ms) {
    if (!doc || !doc.body) return;
    try {
      var el = doc.getElementById("fxFlash");
      if (!el) { el = doc.createElement("div"); el.id = "fxFlash"; el.className = "fx-flash"; doc.body.appendChild(el); }
      el.style.background = "radial-gradient(circle at 50% 45%, rgba(" + col[0] + "," + col[1] + "," + col[2] + ",.34), rgba(" + col[0] + "," + col[1] + "," + col[2] + ",.05) 55%, transparent 72%)";
      el.classList.remove("on");
      void el.offsetWidth;
      el.classList.add("on");
      clearTimeout(el._t);
      el._t = setTimeout(function () { el.classList.remove("on"); }, ms || 520);
    } catch (e) {}
  }

  function shake(strength) {
    if (!doc) return;
    try {
      var app = doc.getElementById("app");
      if (!app || !app.classList) return;
      app.style.setProperty("--fx-shake", (strength || 3) + "px");
      app.classList.remove("fx-shake");
      void app.offsetWidth;
      app.classList.add("fx-shake");
      clearTimeout(app._fxs);
      app._fxs = setTimeout(function () { app.classList.remove("fx-shake"); }, 340);
    } catch (e) {}
  }

  /* ---------------- 特效清单 ---------------- */
  function center() {
    var app = doc && doc.getElementById("app");
    if (app && app.getBoundingClientRect) {
      var r = app.getBoundingClientRect();
      if (r && r.width) return { x: r.left + r.width / 2, y: Math.max(120, r.top + Math.min(r.height * 0.34, 300)) };
    }
    return { x: W / 2, y: H * 0.32 };
  }

  function elCenter(el) {
    try {
      if (!el || !el.getBoundingClientRect) return null;
      var r = el.getBoundingClientRect();
      if (!r || !r.width) return null;
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    } catch (e) { return null; }
  }

  var RAR = { blue: [C.blue, 26], purple: [C.purple, 36], gold: [C.gold, 52], red: [C.red, 74] };

  var CUES = {
    /* 结局：大胜 */
    win: function () {
      var c = center();
      ring(c.x, c.y, C.gold, 24, 0.7);
      dots(c.x, c.y, 46, C.gold, 260, 1.5, 3.2);
      spark(c.x, c.y, 50, C.warm, 420, 1.2);
      setTimeout(function () { spark(c.x, c.y + 40, 34, C.gold, 300, 1.1); }, 160);
      flash(C.gold, 620);
    },
    /* 结局：溃败 */
    lose: function () {
      var c = center();
      shards(c.x, c.y - 60, 26, C.red, 240, 1.5, 1.9);
      dots(c.x, c.y, 26, C.ash, 180, 1.4, 2.6);
      shake(4); flash(C.red, 420);
    },
    /* 结局：不好不坏 */
    calm: function () {
      var c = center();
      dots(c.x, c.y + 60, 18, C.warm, 150, 1.8, 2.2);
      ring(c.x, c.y, C.gold, 20, 0.55);
    },
    /* 操作成功 */
    hit: function () {
      var c = center();
      spark(c.x, c.y, 20, C.gold, 300, 0.9);
      ring(c.x, c.y, C.warm, 16, 0.4);
    },
    /* 操作失败 */
    miss: function () {
      var c = center();
      shards(c.x, c.y, 14, C.red, 210, 0.9);
      shake(2.4);
    },
    /* 抽卡出卡 */
    draw: function (opt) {
      var rar = (opt && opt.rarity) || "blue";
      var cfg = RAR[rar] || RAR.blue;
      var el = opt && opt.el, c = elCenter(el) || center();
      ring(c.x, c.y, cfg[0], 18, 0.6);
      dots(c.x, c.y, cfg[1], cfg[0], 240, 1.4, 3);
      if (rar === "gold" || rar === "red") {
        spark(c.x, c.y, rar === "red" ? 60 : 36, rar === "red" ? C.warm : C.gold, 380, 1.2);
        flash(cfg[0], rar === "red" ? 760 : 540);
      }
      if (rar === "red") shake(3.2);
    },
    /* 成就解锁 */
    award: function (opt) {
      var el = opt && opt.el, c = elCenter(el) || center();
      ring(c.x, c.y, C.gold, 14, 0.7);
      dots(c.x, c.y, 28, C.gold, 200, 1.3, 2.6);
      spark(c.x, c.y, 24, C.warm, 300, 1.0);
    },
    /* 月末发钱 */
    coins: function () {
      coins(W / 2, H * 0.24, 22);
      coins(W / 2, H * 0.18, 10);
    },
    /* 斗蛐蛐开打 */
    arena: function () {
      var c = center();
      dots(c.x, H * 0.72, 30, C.ash, 220, 1.2, 3);
      spark(c.x, H * 0.68, 22, C.warm, 300, 0.9);
      flash(C.gold, 360);
    },
    /* 受伤 */
    hazard: function () {
      var c = center();
      shards(c.x, c.y, 16, C.blood, 220, 1.1, -1.4);
      shake(3.4);
    },
    /* 通用小火花（按钮点击、页面提示） */
    ping: function (opt) {
      var c = (opt && opt.x != null) ? { x: opt.x, y: opt.y } : center();
      spark(c.x, c.y, 8, C.gold, 180, 0.55);
    }
  };

  function cue(name, opt) {
    try {
      if (!CUES[name]) return;
      if (reduce && name !== "ping") return;
      run();
      CUES[name](opt || {});
    } catch (e) {}
  }

  /* ---------------- 场景钩子 ---------------- */
  function scene(type, sc) {
    try {
      var app = doc && doc.getElementById("app");
      if (app && app.classList) {
        app.classList.remove("scene-in");
        void app.offsetWidth;
        app.classList.add("scene-in");
      }
    } catch (e) {}
    var t = String(type || "");
    try {
      if (t === "ending") {
        var rank = (sc && sc.end && sc.end.rank) || "";
        if (/^S/.test(rank)) cue("win");
        else if (/^(X|D|C-)/.test(rank)) cue("lose");
        else cue("calm");
      } else if (t === "gacha") {
        var pulled = (sc && sc.pulled) || [];
        var order = { red: 4, gold: 3, purple: 2, blue: 1 };
        var best = null;
        for (var i = 0; i < pulled.length; i++) {
          var r = pulled[i] && pulled[i].rarity;
          if (r && (!best || (order[r] || 0) > (order[best] || 0))) best = r;
        }
        if (best) cue("draw", { rarity: best });
      } else if (t === "duelResult") {
        if (sc && sc.success) cue("hit"); else cue("miss");
      } else if (t === "monthend") {
        cue("coins");
      } else if (t === "cockfight") {
        cue("arena");
      } else if (t === "injury") {
        cue("hazard");
      } else if (/^(boGame|swissResult)$/.test(t)) {
        cue("ping");
      }
    } catch (e) {}
  }

  /* ---------------- 数字滚动 ---------------- */
  function count(el, to, opt) {
    try {
      if (!el || reduce) { if (el) el.textContent = String(to); return; }
      var dur = (opt && opt.dur) || 620, from = 0, t0 = 0;
      if (!root.requestAnimationFrame) { el.textContent = String(to); return; }
      function tick(now) {
        if (!t0) t0 = now;
        var k = Math.min(1, (now - t0) / dur);
        var e = 1 - Math.pow(1 - k, 3);
        el.textContent = String(Math.round(from + (to - from) * e));
        if (k < 1) root.requestAnimationFrame(tick);
      }
      root.requestAnimationFrame(tick);
    } catch (e) {}
  }

  /* ---------------- 点击涟漪 ---------------- */
  var RIPPLE_SEL = ".btn, .act-btn, .free-btn, [data-act], .chip, .tab-btn, .dock .btn";
  function rippleAt(target, ev) {
    try {
      if (!target || !target.closest) return null;
      var host = target.closest(RIPPLE_SEL);
      if (!host || !doc || !doc.createElement) return null;
      var r = host.getBoundingClientRect && host.getBoundingClientRect();
      if (!r || !r.width) return null;
      var sp = doc.createElement("span");
      sp.className = "fx-ripple";
      var size = Math.max(r.width, r.height) * 1.1;
      sp.style.width = sp.style.height = size + "px";
      sp.style.left = ((ev && ev.clientX != null ? ev.clientX : r.left + r.width / 2) - r.left - size / 2) + "px";
      sp.style.top = ((ev && ev.clientY != null ? ev.clientY : r.top + r.height / 2) - r.top - size / 2) + "px";
      host.appendChild(sp);
      setTimeout(function () { if (sp.parentNode) sp.parentNode.removeChild(sp); }, 620);
      return { x: ev && ev.clientX, y: ev && ev.clientY };
    } catch (e) { return null; }
  }

  function bindInteraction() {
    if (!doc || !doc.addEventListener) return;
    doc.addEventListener("pointerdown", function (ev) {
      try {
        var pos = rippleAt(ev.target, ev);
        if (pos && pos.x != null && !reduce) cue("ping", { x: pos.x, y: pos.y });
      } catch (e) {}
    }, { passive: true });
    /* 超长粒子空闲后自动降级，避免占用 */
    root.addEventListener("blur", function () { parts.length = 0; }, { passive: true });
  }

  function init() {
    boot();
    bindInteraction();
  }

  if (doc && doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", init);
  else if (doc) init();

  root.FX = {
    cue: cue,
    scene: scene,
    count: count,
    flash: function (col) { flash(col || C.gold); },
    shake: shake,
    init: init,
    has: function (n) { return !!CUES[n]; }
  };
})(typeof window !== "undefined" ? window : this);
