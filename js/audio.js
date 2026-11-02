/* ============================================================================
 * 《登神》音频引擎 audio.js
 * 纯 Web Audio API 实时合成：零外部音频文件、零网络、零 ES module。
 * 所有声音（音效 + BGM）在运行时用振荡器 / 噪声 / 滤波器 / 卷积混响合成。
 *
 * 引入方式（index.html，放在 ui.js 之前）：
 *   <script src="js/audio.js"></script>
 * 首个用户手势里调用 SND.init()；本文件另有一次手势监听兜底，
 * 即使忘记调 init，第一次点击 / 按键也会自动开声。
 *
 * ---------------------------------------------------------------------------
 * 接线建议（游戏节点 -> 调用）
 *   任意按钮点击 / 选项确认 .................... SND.sfx("click")
 *   鼠标移入按钮、卡牌、列表项 ................. SND.sfx("hover")
 *   菜单 tab 切换、进入新场景（render 后）...... SND.sfx("page")
 *   抽卡 renderDraw，每张卡翻开 ............... SND.sfx("card")
 *     卡片 rarity === "purple" / "gold" ........ SND.sfx("drawGold")
 *     卡片 rarity === "red" .................... SND.sfx("drawRed")
 *   对局开局、掷骰、BP 完成（renderDuel）....... SND.sfx("dice")
 *   单局判定成功 / 失败（renderDuelResult）..... SND.sfx("win") / SND.sfx("lose")
 *   duelResult.crit 有值、击杀高光 ............. SND.sfx("kill")
 *   大龙 / 远古龙 / 决胜团（event 或 duel）..... SND.sfx("baron")
 *   推塔、破高地、偷家 ......................... SND.sfx("tower")
 *   主场获胜、观众席沸腾 ....................... SND.sfx("crowd")
 *   客场被嘘、被翻盘 ........................... SND.sfx("boo")
 *   夺冠（ending 或冠军 result）................ SND.sfx("victory") + SND.bgm("victory")
 *   被淘汰、止步四强 ........................... SND.sfx("defeat")
 *   转会 / 续约成功（renderTransfer 选择后）.... SND.sfx("sign")
 *   宣布退役（renderRetire 选“结束”）........... SND.sfx("retire")
 *   月底结算 renderMonthEnd、属性成长 ........... SND.sfx("levelup")
 *   热搜、弹幕、toast 通知 ..................... SND.sfx("notify")
 *
 * BGM 切换点（SND.bgm(mode)，1.2 秒交叉淡入淡出）
 *   主菜单 renderMenu .......................... "menu"
 *   S.stage === "LDL" 的常规赛 / LDL 季后赛 .... "ldl"
 *   S.stage === "LPL" 的常规赛 ................. "lpl"
 *   LPL 季后赛 / 世界赛瑞士轮、淘汰赛 .......... "playoff"
 *   世界赛正赛、决赛、决赛赛点 ................. "worlds"
 *   夺冠庆祝画面（ending 前的高光）............. "victory"
 *   结局页 renderEnding ........................ "ending"
 *   静音 / 离开游戏 ............................ "off"
 *
 *   关键判定前可 SND.duck(2.5) 临时压低 BGM；
 *   也可在标题画面/结局用 SND.setMute() / SND.setVolume() 接设置菜单。
 * ========================================================================== */
(function () {
  "use strict";

  /* ---------------------------------------------------------------- 全局挂载 */
  var root = null;
  try { if (typeof window !== "undefined" && window) root = window; } catch (e0) {}
  if (!root) { try { if (typeof globalThis !== "undefined" && globalThis) root = globalThis; } catch (e1) {} }
  if (!root) root = {};

  // 先放一层永不抛异常的占位 API，下面的实现再逐项覆盖。
  var API = {
    init: function () { return false; },
    sfx: function () {},
    bgm: function () {},
    setMute: function () {},
    muted: function () { return false; },
    setVolume: function () {},
    volume: function () { return 0.8; },
    duck: function () {}
  };
  try { root.SND = API; } catch (e2) {}

  var LS_MUTE = "dengshen.audio.muted";
  var LS_VOL = "dengshen.audio.vol";

  /* ---------------------------------------------------------------- 小工具 */
  function clamp01(x) {
    x = Number(x);
    if (!(x >= 0)) return 0;
    if (x > 1) return 1;
    return x;
  }

  function lsGet(key) {
    try {
      var ls = root.localStorage;
      if (!ls || typeof ls.getItem !== "function") return null;
      return ls.getItem(key);
    } catch (e) { return null; }
  }

  function lsSet(key, val) {
    try {
      var ls = root.localStorage;
      if (ls && typeof ls.setItem === "function") ls.setItem(key, String(val));
    } catch (e) {}
  }

  function setInt(fn, ms) {
    try {
      if (typeof root.setInterval === "function") return root.setInterval(fn, ms);
    } catch (e) {}
    return 0;
  }

  function clearInt(id) {
    try {
      if (id && typeof root.clearInterval === "function") root.clearInterval(id);
    } catch (e) {}
  }

  function later(fn, ms) {
    try {
      if (typeof root.setTimeout === "function") { root.setTimeout(fn, ms); return; }
    } catch (e) {}
    try {
      if (typeof setTimeout === "function") setTimeout(fn, ms);
    } catch (e2) {}
  }

  function mtof(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  /* ---------------------------------------------------------------- 运行状态 */
  var st = {
    ctx: null,
    master: null,
    comp: null,
    musicBus: null,
    duckGain: null,
    sfxBus: null,
    revIn: null,
    revReturn: null,
    noise: null,
    ready: false,
    building: false,
    noAudio: false,
    vol: 0.8,
    mute: false,
    masterNow: null,
    mode: null,
    desired: null,
    track: null
  };

  try {
    var savedMute = lsGet(LS_MUTE);
    if (savedMute === "1" || savedMute === "true") st.mute = true;
    var savedVol = parseFloat(lsGet(LS_VOL));
    if (isFinite(savedVol)) st.vol = clamp01(savedVol);
  } catch (e3) {}

  function masterLevel() {
    return Math.pow(clamp01(st.vol), 1.6) * 0.95;
  }

  function isReady() {
    return !!(st.ready && st.ctx && st.sfxBus && st.ctx.state !== "closed");
  }

  function resumeCtx() {
    try {
      if (!st.ctx) return;
      if (st.ctx.state === "suspended" && typeof st.ctx.resume === "function") {
        var p = st.ctx.resume();
        if (p && typeof p.catch === "function") p.catch(function () {});
      }
    } catch (e) {}
  }

  /* ---------------------------------------------------------- 上下文与总线图 */
  function buildNoiseBuffer(c) {
    var len = Math.floor(c.sampleRate * 4);
    var buf = c.createBuffer(1, len, c.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  // 用衰减噪声造一个简易冲激响应，得到“有空间但不糊”的混响尾巴。
  function buildIR(c) {
    var sec = 2.6;
    var len = Math.floor(c.sampleRate * sec);
    var buf = c.createBuffer(2, len, c.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var d = buf.getChannelData(ch);
      var lp = 0;
      for (var i = 0; i < len; i++) {
        var n = Math.random() * 2 - 1;
        lp = lp * 0.62 + n * 0.38;
        var e = Math.pow(1 - i / len, 2.8);
        var pre = i < 120 ? n * 0.7 : lp;
        d[i] = pre * e * 0.55;
      }
    }
    return buf;
  }

  function build() {
    var Ctor = null;
    try {
      Ctor = root.AudioContext || root.webkitAudioContext || null;
    } catch (e) { Ctor = null; }
    if (typeof Ctor !== "function") { st.noAudio = true; return false; }

    var c = null;
    try { c = new Ctor(); } catch (e) { return false; }
    if (!c) return false;
    st.ctx = c;

    try {
      var master = c.createGain();
      master.gain.value = st.mute ? 0 : masterLevel();
      st.masterNow = master.gain.value;

      var comp = null;
      try { comp = c.createDynamicsCompressor(); } catch (eComp) { comp = null; }
      if (comp) {
        try {
          comp.threshold.value = -16;
          comp.knee.value = 18;
          comp.ratio.value = 3;
          comp.attack.value = 0.004;
          comp.release.value = 0.22;
        } catch (eComp2) {}
        master.connect(comp);
        comp.connect(c.destination);
      } else {
        master.connect(c.destination);
      }

      var musicBus = c.createGain();
      musicBus.gain.value = 0.85;
      musicBus.connect(master);

      var duckGain = c.createGain();
      duckGain.gain.value = 1;
      duckGain.connect(musicBus);

      var sfxBus = c.createGain();
      sfxBus.gain.value = 1;
      sfxBus.connect(master);

      var revIn = null;
      var revReturn = null;
      try {
        var conv = c.createConvolver();
        conv.buffer = buildIR(c);
        revIn = c.createGain();
        revIn.gain.value = 1;
        revReturn = c.createGain();
        revReturn.gain.value = 0.55;
        revIn.connect(conv);
        conv.connect(revReturn);
        revReturn.connect(master);
      } catch (eRev) {
        revIn = null;
        revReturn = null;
      }

      var noise = null;
      try { noise = buildNoiseBuffer(c); } catch (eNoise) { noise = null; }

      st.master = master;
      st.comp = comp;
      st.musicBus = musicBus;
      st.duckGain = duckGain;
      st.sfxBus = sfxBus;
      st.revIn = revIn;
      st.revReturn = revReturn;
      st.noise = noise;
      return true;
    } catch (eBuild) {
      st.ctx = null;
      st.master = null;
      st.musicBus = null;
      st.duckGain = null;
      st.sfxBus = null;
      st.revIn = null;
      st.revReturn = null;
      st.noise = null;
      try { if (c && typeof c.close === "function") c.close(); } catch (eClose) {}
      return false;
    }
  }

  function init() {
    try {
      if (isReady()) {
        resumeCtx();
        if (st.desired && st.mode !== st.desired) applyMode(st.desired);
        return true;
      }
      if (st.noAudio || st.building) return false;
      st.building = true;
      try {
        if (!build()) return false;
        st.ready = true;
        if (st.desired && st.desired !== "off") applyMode(st.desired);
        return true;
      } finally {
        st.building = false;
      }
    } catch (e) {
      return false;
    }
  }

  // 用 cancelAndHold 保住“当前实际值”，避免淡入淡出起点跳变产生爆音。
  function holdParam(param, now, fallback) {
    try {
      if (typeof param.cancelAndHoldAtTime === "function") {
        param.cancelAndHoldAtTime(now);
        return;
      }
    } catch (e) {}
    try {
      param.cancelScheduledValues(now);
      param.setValueAtTime(fallback, now);
    } catch (e2) {}
  }

  function rampMaster() {
    if (!st.master || !st.ctx) return;
    try {
      var g = st.master.gain;
      var now = st.ctx.currentTime;
      var target = st.mute ? 0 : masterLevel();
      var from = st.masterNow == null ? target : st.masterNow;
      holdParam(g, now, Math.max(0.0001, from));
      g.linearRampToValueAtTime(target, now + 0.12);
      st.masterNow = target;
    } catch (e) {}
  }

  function setMute(on) {
    st.mute = (on === true || on === 1 || on === "1" || on === "true");
    lsSet(LS_MUTE, st.mute ? "1" : "0");
    rampMaster();
    if (!st.mute) {
      resumeCtx();
      if (isReady() && st.desired && st.mode !== st.desired) applyMode(st.desired);
    }
  }

  function setVolume(v) {
    v = Number(v);
    if (!isFinite(v)) return;
    st.vol = clamp01(v);
    lsSet(LS_VOL, st.vol.toFixed(2));
    rampMaster();
  }

  function duck(sec) {
    if (!isReady() || !st.duckGain) return;
    var d = Number(sec);
    if (!isFinite(d) || d <= 0) d = 2.5;
    d = Math.max(0.3, Math.min(10, d));
    try {
      var g = st.duckGain.gain;
      var now = st.ctx.currentTime;
      g.cancelScheduledValues(now);
      g.setValueAtTime(Math.max(0.001, g.value), now);
      g.linearRampToValueAtTime(0.24, now + 0.14);
      g.setValueAtTime(0.24, now + d);
      g.linearRampToValueAtTime(1, now + d + 0.6);
    } catch (e) {}
  }

  /* -------------------------------------------------------------- 合成基元 */
  function newGain(value) {
    var g = st.ctx.createGain();
    if (value != null) g.gain.value = value;
    return g;
  }

  function sendRev(node, amount) {
    if (!(amount > 0) || !st.revIn) return;
    try {
      var g = newGain(amount);
      node.connect(g);
      g.connect(st.revIn);
    } catch (e) {}
  }

  /**
   * 单振荡器音色。
   * o: dest, t, f0, f1, glide, dur, type, level, atk, sus, cut, cut1, q,
   *    filter, rev, detune
   */
  function tone(o) {
    var c = st.ctx;
    var t = o.t;
    var dur = Math.max(0.02, o.dur);
    var osc = c.createOscillator();
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(Math.max(8, o.f0), t);
    if (o.f1 != null) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(8, o.f1),
        t + Math.max(0.01, o.glide != null ? o.glide : dur)
      );
    }
    if (o.detune) osc.detune.value = o.detune;

    var g = newGain(0.0001);
    if (o.cut) {
      var f = c.createBiquadFilter();
      f.type = o.filter || "lowpass";
      f.frequency.setValueAtTime(Math.max(40, o.cut), t);
      if (o.cut1) f.frequency.exponentialRampToValueAtTime(Math.max(40, o.cut1), t + dur);
      f.Q.value = o.q != null ? o.q : 0.8;
      osc.connect(f);
      f.connect(g);
    } else {
      osc.connect(g);
    }

    var peak = Math.max(0.0002, o.level || 0.08);
    var atk = Math.min(o.atk != null ? o.atk : 0.006, dur * 0.5);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + atk);
    if (o.sus != null && o.sus > atk) {
      g.gain.setValueAtTime(peak, t + Math.min(o.sus, dur * 0.9));
    }
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(o.dest);
    if (o.rev) sendRev(g, o.rev);
    osc.start(t);
    osc.stop(t + dur + 0.03);
    return osc;
  }

  /**
   * 一段滤波噪声。
   * o: dest, t, dur, type, f0, f1, sweep, q, level, atk, hold, rev, rate
   */
  function noiseHit(o) {
    if (!st.noise) return;
    var c = st.ctx;
    var t = o.t;
    var dur = Math.max(0.02, o.dur);
    var src = c.createBufferSource();
    src.buffer = st.noise;
    if (o.rate) src.playbackRate.value = o.rate;
    var f = c.createBiquadFilter();
    f.type = o.type || "bandpass";
    f.frequency.setValueAtTime(Math.max(20, o.f0 || 1200), t);
    if (o.f1 != null) {
      f.frequency.exponentialRampToValueAtTime(
        Math.max(20, o.f1),
        t + Math.max(0.01, o.sweep || dur)
      );
    }
    f.Q.value = o.q != null ? o.q : 1;

    var g = newGain(0.0001);
    src.connect(f);
    f.connect(g);
    g.connect(o.dest);

    var peak = Math.max(0.0002, o.level || 0.1);
    var atk = Math.min(o.atk != null ? o.atk : 0.006, dur * 0.7);
    var hold = o.hold != null ? Math.min(o.hold, dur * 0.85) : Math.min(dur * 0.55, 0.25);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + atk);
    g.gain.setValueAtTime(peak, t + Math.max(atk + 0.001, hold));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    if (o.rev) sendRev(g, o.rev);
    try { src.start(t, Math.random() * 0.25); } catch (e) { src.start(t); }
    src.stop(t + dur + 0.02);
  }

  // 金属/铃：非谐分音堆叠，短促亮，适合出卡、提示。
  function bell(o) {
    var parts = o.parts || [1, 2.01, 2.98, 4.07];
    var base = o.level || 0.08;
    for (var i = 0; i < parts.length; i++) {
      tone({
        dest: o.dest, t: o.t + i * 0.003,
        f0: o.f0 * parts[i],
        dur: Math.max(0.15, o.dur * (1 - i * 0.14)),
        type: "sine",
        level: base * Math.pow(0.52, i),
        atk: 0.004,
        rev: o.rev
      });
    }
  }

  // 钢琴感：整数分音 + 高次快速衰减。
  function piano(o) {
    var parts = [1, 2, 3.01, 4.02, 5.05];
    for (var i = 0; i < parts.length; i++) {
      tone({
        dest: o.dest, t: o.t + i * 0.002,
        f0: o.f0 * parts[i],
        dur: Math.max(0.3, o.dur * Math.pow(0.72, i)),
        type: "sine",
        level: (o.level || 0.08) * Math.pow(0.5, i),
        atk: 0.004,
        rev: o.rev
      });
    }
  }

  /* -------------------------------------------------------------- 一次性音效 */
  var SFX = {

    // 木质点击：极短噪声 + 低频敲击感
    click: function (t, v) {
      noiseHit({ dest: st.sfxBus, t: t, dur: 0.045, type: "bandpass", f0: 1900, f1: 1200, q: 1.4, level: 0.16 * v, rev: 0.05 });
      tone({ dest: st.sfxBus, t: t, f0: 210, f1: 120, dur: 0.07, type: "sine", level: 0.13 * v, atk: 0.002 });
      tone({ dest: st.sfxBus, t: t, f0: 640, f1: 420, dur: 0.035, type: "triangle", level: 0.05 * v, atk: 0.001 });
    },

    // 极轻的悬停：像耳机里的一点沙
    hover: function (t, v) {
      noiseHit({ dest: st.sfxBus, t: t, dur: 0.03, type: "highpass", f0: 3200, q: 0.7, level: 0.038 * v, atk: 0.004 });
      tone({ dest: st.sfxBus, t: t, f0: 1500, dur: 0.035, type: "sine", level: 0.018 * v, atk: 0.003 });
    },

    // 界面切换：一口气流扫过
    page: function (t, v) {
      noiseHit({ dest: st.sfxBus, t: t, dur: 0.2, type: "bandpass", f0: 480, f1: 2400, sweep: 0.16, q: 0.8, level: 0.11 * v, atk: 0.03, hold: 0.1, rev: 0.18 });
      tone({ dest: st.sfxBus, t: t, f0: 300, f1: 520, glide: 0.14, dur: 0.14, type: "triangle", level: 0.04 * v, atk: 0.02 });
    },

    // 抽卡翻牌：纸片 + 上行滑音
    card: function (t, v) {
      noiseHit({ dest: st.sfxBus, t: t, dur: 0.08, type: "bandpass", f0: 2600, f1: 1500, q: 1.1, level: 0.12 * v, atk: 0.003 });
      noiseHit({ dest: st.sfxBus, t: t + 0.05, dur: 0.07, type: "bandpass", f0: 3300, q: 1.4, level: 0.055 * v, atk: 0.003, rev: 0.1 });
      tone({ dest: st.sfxBus, t: t + 0.015, f0: 330, f1: 900, glide: 0.19, dur: 0.22, type: "triangle", level: 0.052 * v, atk: 0.02, rev: 0.2 });
    },

    // 紫 / 金卡：金属泛音 + 和弦上扬
    drawGold: function (t, v) {
      var notes = [523.25, 659.25, 783.99, 1046.5];
      for (var i = 0; i < notes.length; i++) {
        bell({ dest: st.sfxBus, t: t + i * 0.065, f0: notes[i], dur: 1.35, level: 0.062 * v, rev: 0.62 });
      }
      tone({ dest: st.sfxBus, t: t + 0.05, f0: 261.63, dur: 1.5, type: "sine", level: 0.05 * v, atk: 0.05, sus: 0.9, rev: 0.5 });
      tone({ dest: st.sfxBus, t: t + 0.12, f0: 880, f1: 1760, glide: 0.5, dur: 0.55, type: "triangle", level: 0.025 * v, atk: 0.06, rev: 0.7 });
      noiseHit({ dest: st.sfxBus, t: t + 0.1, dur: 0.55, type: "highpass", f0: 7000, q: 0.7, level: 0.03 * v, atk: 0.2, hold: 0.3, rev: 0.8 });
    },

    // 赤卡：低频冲击 + 长尾 + 一点不安的金属摩擦
    drawRed: function (t, v) {
      tone({ dest: st.sfxBus, t: t, f0: 115, f1: 32, glide: 0.55, dur: 1.15, type: "sine", level: 0.3 * v, atk: 0.004, rev: 0.3 });
      noiseHit({ dest: st.sfxBus, t: t, dur: 0.95, type: "lowpass", f0: 950, f1: 110, sweep: 0.7, q: 1.1, level: 0.2 * v, atk: 0.004, hold: 0.12, rev: 0.45 });
      tone({ dest: st.sfxBus, t: t, f0: 55, dur: 2.0, type: "sine", level: 0.14 * v, atk: 0.012, sus: 1.3, rev: 0.3 });
      tone({ dest: st.sfxBus, t: t + 0.05, f0: 185, f1: 168, glide: 1.6, dur: 1.8, type: "triangle", level: 0.045 * v, atk: 0.05, rev: 0.75 });
      tone({ dest: st.sfxBus, t: t + 0.05, f0: 196, f1: 178, glide: 1.6, dur: 1.8, type: "triangle", level: 0.035 * v, atk: 0.05, rev: 0.75 });
      noiseHit({ dest: st.sfxBus, t: t + 0.02, dur: 0.3, type: "highpass", f0: 4200, q: 0.8, level: 0.05 * v, atk: 0.01, rev: 0.5 });
    },

    // 骰子：几颗短噪声脉冲
    dice: function (t, v) {
      for (var i = 0; i < 5; i++) {
        var tt = t + i * (0.05 + Math.random() * 0.04);
        noiseHit({ dest: st.sfxBus, t: tt, dur: 0.05, type: "bandpass", f0: 1400 + Math.random() * 1900, q: 5, level: 0.09 * v, atk: 0.002 });
        tone({ dest: st.sfxBus, t: tt, f0: 520 + Math.random() * 280, f1: 250, glide: 0.04, dur: 0.05, type: "triangle", level: 0.03 * v, atk: 0.002 });
      }
    },

    // 赢一局：三两音上行
    win: function (t, v) {
      var notes = [440, 554.37, 659.25];
      for (var i = 0; i < notes.length; i++) {
        tone({
          dest: st.sfxBus, t: t + i * 0.085, f0: notes[i], dur: 0.6,
          type: "triangle", cut: 2600, level: 0.085 * v, atk: 0.008, rev: 0.35
        });
      }
      tone({ dest: st.sfxBus, t: t + 0.17, f0: 1318.5, dur: 0.5, type: "sine", level: 0.025 * v, atk: 0.01, rev: 0.5 });
    },

    // 输一局：下行小三度，暗一点
    lose: function (t, v) {
      tone({ dest: st.sfxBus, t: t, f0: 392, f1: 311.13, glide: 0.42, dur: 0.75, type: "sawtooth", cut: 780, level: 0.07 * v, atk: 0.012, rev: 0.3 });
      tone({ dest: st.sfxBus, t: t, f0: 196, dur: 0.7, type: "sine", level: 0.09 * v, atk: 0.02, sus: 0.35, rev: 0.2 });
      noiseHit({ dest: st.sfxBus, t: t + 0.3, dur: 0.35, type: "lowpass", f0: 420, q: 0.7, level: 0.035 * v, atk: 0.05, rev: 0.3 });
    },

    // 击杀提示：短促高频双音
    kill: function (t, v) {
      tone({ dest: st.sfxBus, t: t, f0: 1318.5, dur: 0.07, type: "square", cut: 4200, level: 0.055 * v, atk: 0.002 });
      tone({ dest: st.sfxBus, t: t + 0.085, f0: 1760, dur: 0.1, type: "square", cut: 4600, level: 0.05 * v, atk: 0.002, rev: 0.25 });
      noiseHit({ dest: st.sfxBus, t: t, dur: 0.06, type: "highpass", f0: 6000, level: 0.035 * v, atk: 0.001 });
    },

    // 大龙 / 关键资源：低沉长音 + 噪声扫频
    baron: function (t, v) {
      tone({ dest: st.sfxBus, t: t, f0: 41.2, dur: 2.9, type: "sine", level: 0.17 * v, atk: 0.45, sus: 2.0, rev: 0.45 });
      tone({ dest: st.sfxBus, t: t + 0.04, f0: 55, dur: 2.7, type: "triangle", level: 0.095 * v, atk: 0.5, sus: 1.9, rev: 0.55 });
      noiseHit({ dest: st.sfxBus, t: t + 0.05, dur: 2.0, type: "bandpass", f0: 120, f1: 2800, sweep: 1.5, q: 1.1, level: 0.1 * v, atk: 0.55, hold: 0.95, rev: 0.65 });
      noiseHit({ dest: st.sfxBus, t: t, dur: 2.4, type: "lowpass", f0: 70, q: 0.8, level: 0.12 * v, atk: 0.2, hold: 1.2 });
      bell({ dest: st.sfxBus, t: t + 1.1, f0: 82.41, dur: 2.2, level: 0.04 * v, rev: 0.8 });
    },

    // 推塔：砖石碎裂
    tower: function (t, v) {
      noiseHit({ dest: st.sfxBus, t: t, dur: 0.55, type: "lowpass", f0: 900, f1: 260, sweep: 0.45, q: 1.2, level: 0.19 * v, atk: 0.004, rev: 0.3 });
      tone({ dest: st.sfxBus, t: t, f0: 105, f1: 44, glide: 0.3, dur: 0.4, type: "sine", level: 0.18 * v, atk: 0.003, rev: 0.2 });
      for (var i = 0; i < 7; i++) {
        var tt = t + 0.04 + Math.random() * 0.5;
        noiseHit({ dest: st.sfxBus, t: tt, dur: 0.05 + Math.random() * 0.08, type: "bandpass", f0: 700 + Math.random() * 1600, q: 2.2, level: (0.03 + Math.random() * 0.04) * v, atk: 0.002, rev: 0.18 });
      }
      noiseHit({ dest: st.sfxBus, t: t + 0.3, dur: 0.35, type: "highpass", f0: 4200, level: 0.03 * v, atk: 0.02, rev: 0.2 });
    },

    // 观众欢呼：带通噪声 + 缓慢包络
    crowd: function (t, v) {
      noiseHit({ dest: st.sfxBus, t: t, dur: 3.4, type: "bandpass", f0: 900, q: 0.55, level: 0.15 * v, atk: 0.5, hold: 2.3, rev: 0.45 });
      noiseHit({ dest: st.sfxBus, t: t + 0.12, dur: 3.1, type: "bandpass", f0: 1750, q: 0.9, level: 0.06 * v, atk: 0.65, hold: 2.0, rev: 0.5 });
      noiseHit({ dest: st.sfxBus, t: t + 0.2, dur: 2.6, type: "lowpass", f0: 320, q: 0.7, level: 0.05 * v, atk: 0.4, hold: 1.8 });
      var w = 0.5 + Math.random() * 0.8;
      tone({ dest: st.sfxBus, t: t + w, f0: 2300, f1: 1900, glide: 0.35, dur: 0.4, type: "sine", level: 0.018 * v, atk: 0.05, rev: 0.6 });
      tone({ dest: st.sfxBus, t: t + w + 0.7, f0: 2600, f1: 2200, glide: 0.3, dur: 0.35, type: "sine", level: 0.014 * v, atk: 0.05, rev: 0.6 });
    },

    // 观众嘘声：更低的带通噪声 + 下沉音
    boo: function (t, v) {
      noiseHit({ dest: st.sfxBus, t: t, dur: 2.6, type: "bandpass", f0: 240, f1: 180, sweep: 2.2, q: 0.8, level: 0.13 * v, atk: 0.35, hold: 1.7, rev: 0.35 });
      tone({ dest: st.sfxBus, t: t + 0.1, f0: 165, f1: 82, glide: 1.8, dur: 2.2, type: "sawtooth", cut: 420, level: 0.05 * v, atk: 0.2, sus: 1.4, rev: 0.3 });
      tone({ dest: st.sfxBus, t: t, f0: 58, dur: 2.2, type: "sine", level: 0.06 * v, atk: 0.25, sus: 1.5 });
    },

    // 夺冠：明亮大和弦 + 号角感
    victory: function (t, v) {
      var chord = [261.63, 329.63, 392.0, 523.25, 587.33];
      for (var i = 0; i < chord.length; i++) {
        tone({ dest: st.sfxBus, t: t + 0.02 * i, f0: chord[i], dur: 3.0, type: "sawtooth", cut: 2600, q: 0.7, level: 0.045 * v, atk: 0.08, sus: 1.5, rev: 0.55 });
      }
      tone({ dest: st.sfxBus, t: t, f0: 196, dur: 2.4, type: "sawtooth", cut: 1200, level: 0.06 * v, atk: 0.14, sus: 1.2, rev: 0.4 });
      tone({ dest: st.sfxBus, t: t, f0: 261.63, dur: 2.4, type: "sawtooth", cut: 1500, level: 0.05 * v, atk: 0.16, sus: 1.2, rev: 0.4 });
      var arp = [523.25, 659.25, 783.99, 1046.5];
      for (var k = 0; k < arp.length; k++) {
        bell({ dest: st.sfxBus, t: t + k * 0.12, f0: arp[k], dur: 1.4, level: 0.05 * v, rev: 0.6 });
      }
      tone({ dest: st.sfxBus, t: t, f0: 82, f1: 45, glide: 0.4, dur: 0.6, type: "sine", level: 0.2 * v, atk: 0.004, rev: 0.3 });
      noiseHit({ dest: st.sfxBus, t: t + 0.1, dur: 2.8, type: "bandpass", f0: 1100, q: 0.6, level: 0.05 * v, atk: 0.5, hold: 1.8, rev: 0.5 });
    },

    // 被淘汰：慢速下行
    defeat: function (t, v) {
      var notes = [220, 261.63, 329.63];
      for (var i = 0; i < notes.length; i++) {
        tone({ dest: st.sfxBus, t: t + i * 0.05, f0: notes[i], f1: notes[i] * 0.84, glide: 2.4, dur: 2.8, type: "sawtooth", cut: 900, q: 0.7, level: 0.04 * v, atk: 0.25, sus: 1.4, rev: 0.6 });
      }
      tone({ dest: st.sfxBus, t: t, f0: 55, f1: 41.2, glide: 3.0, dur: 3.4, type: "sine", level: 0.13 * v, atk: 0.3, sus: 2.0, rev: 0.35 });
      piano({ dest: st.sfxBus, t: t + 0.15, f0: 164.81, dur: 2.4, level: 0.045 * v, rev: 0.55 });
    },

    // 签约 / 转会：落笔 + 印章
    sign: function (t, v) {
      for (var i = 0; i < 3; i++) {
        noiseHit({ dest: st.sfxBus, t: t + i * (0.11 + Math.random() * 0.03), dur: 0.09, type: "bandpass", f0: 2800 + Math.random() * 900, q: 2.4, level: 0.045 * v, atk: 0.004 });
      }
      noiseHit({ dest: st.sfxBus, t: t + 0.38, dur: 0.16, type: "lowpass", f0: 800, q: 0.8, level: 0.11 * v, atk: 0.003 });
      tone({ dest: st.sfxBus, t: t + 0.38, f0: 130, f1: 55, glide: 0.16, dur: 0.22, type: "sine", level: 0.18 * v, atk: 0.002, rev: 0.2 });
      noiseHit({ dest: st.sfxBus, t: t + 0.42, dur: 0.2, type: "bandpass", f0: 1800, q: 0.9, level: 0.035 * v, atk: 0.01, rev: 0.25 });
    },

    // 退役：钢琴式单音衰减
    retire: function (t, v) {
      piano({ dest: st.sfxBus, t: t, f0: 220, dur: 3.2, level: 0.08 * v, rev: 0.6 });
      piano({ dest: st.sfxBus, t: t + 0.09, f0: 329.63, dur: 2.8, level: 0.038 * v, rev: 0.65 });
      piano({ dest: st.sfxBus, t: t + 1.15, f0: 164.81, dur: 2.6, level: 0.04 * v, rev: 0.65 });
      tone({ dest: st.sfxBus, t: t, f0: 55, dur: 3.0, type: "sine", level: 0.04 * v, atk: 0.3, sus: 1.6, rev: 0.3 });
    },

    // 属性成长：铃音
    levelup: function (t, v) {
      var notes = [880, 1108.73, 1318.51];
      for (var i = 0; i < notes.length; i++) {
        bell({ dest: st.sfxBus, t: t + i * 0.075, f0: notes[i], dur: 0.75, level: 0.05 * v, rev: 0.45 });
      }
      noiseHit({ dest: st.sfxBus, t: t + 0.02, dur: 0.4, type: "highpass", f0: 6500, level: 0.022 * v, atk: 0.12, rev: 0.6 });
    },

    // 热搜 / 弹幕 / 通知：轻微 pop
    notify: function (t, v) {
      tone({ dest: st.sfxBus, t: t, f0: 880, f1: 1320, glide: 0.06, dur: 0.09, type: "sine", level: 0.075 * v, atk: 0.002, rev: 0.2 });
      noiseHit({ dest: st.sfxBus, t: t, dur: 0.03, type: "highpass", f0: 5200, level: 0.03 * v, atk: 0.001 });
      tone({ dest: st.sfxBus, t: t + 0.05, f0: 1760, dur: 0.06, type: "sine", level: 0.02 * v, atk: 0.003 });
    }
  };

  /* ------------------------------------------------------------ BGM 曲目配置 */
  // 和弦质量（相对根音的半音）
  var QUAL = {
    min: [0, 3, 7],
    maj: [0, 4, 7],
    dom7: [0, 4, 7, 10],
    min7: [0, 3, 7, 10],
    maj7: [0, 4, 7, 11],
    sus2: [0, 2, 7],
    dim: [0, 3, 6]
  };

  /*
   * 每个 mode 的调式 / 速度 / 音色 / 密度：
   *   menu      D 自然小调  68 BPM  暖 pad + 三角波稀疏琶音，空、慢
   *   ldl       A 小调五声  94 BPM  方波低切、干、粗糙，像地下室网吧
   *   lpl       A 自然小调 112 BPM  锯齿 pad + 方波八分琶音，标准联赛进行曲
   *   playoff   E 和声小调 126 BPM  十六分脉冲、短促 staccato，紧张
   *   worlds    D 自然小调  76 BPM  大 pad + 低音铜管 + 定音鼓，宏大而慢
   *   victory   C 大调     104 BPM  明亮铃音琶音 + 号角，庆祝
   *   ending    A 小调      62 BPM  钢琴式琶音、几乎无鼓，收束
   */
  var CFG = {
    menu: {
      bpm: 68, level: 0.5,
      padWave: "sawtooth", padCut: 720, padLevel: 0.17, detune: 7, padSub: true,
      arpKind: "tone", arpWave: "triangle", arpCut: 1900, arpLevel: 0.06, arpRev: 0.55, arpDur: 2.4,
      bassWave: "sine", bassCut: 300, bassLevel: 0.15, bassDur: 1.8,
      rev: 0.55, kickLevel: 0.09, hatLevel: 0.016, snareLevel: 0,
      scale: [0, 2, 3, 5, 7, 8, 10],
      prog: [{ root: 50, q: "min" }, { root: 46, q: "maj" }, { root: 41, q: "maj" }, { root: 48, q: "maj" }],
      arp: [0, null, null, 2, null, null, 4, null, 2, null, null, 4, null, null, 7, null],
      bass: [0, 8], kick: [0, 8], hat: [], snare: []
    },

    ldl: {
      bpm: 94, level: 0.46,
      padWave: "square", padCut: 520, padLevel: 0.1, detune: 13,
      arpKind: "tone", arpWave: "square", arpCut: 880, arpLevel: 0.055, arpRev: 0.12, arpDur: 1.9,
      bassWave: "sawtooth", bassCut: 200, bassLevel: 0.16, bassDur: 0.9,
      rev: 0.16, kickLevel: 0.13, hatLevel: 0.032, snareLevel: 0.035,
      scale: [0, 3, 5, 7, 10],
      prog: [{ root: 57, q: "min" }, { root: 53, q: "maj" }, { root: 55, q: "maj" }, { root: 57, q: "min" }],
      arp: [0, null, 2, null, 4, null, 7, null, 5, null, 4, null, 2, null, 0, null],
      bass: [0, 6, 8, 14], kick: [0, 8], hat: [2, 6, 10, 14], snare: [4, 12]
    },

    lpl: {
      bpm: 112, level: 0.5,
      padWave: "sawtooth", padCut: 1100, padLevel: 0.13, detune: 8,
      arpKind: "tone", arpWave: "square", arpCut: 2100, arpLevel: 0.045, arpRev: 0.3, arpDur: 2.0,
      bassWave: "sawtooth", bassCut: 260, bassLevel: 0.15, bassDur: 1.1,
      rev: 0.28, kickLevel: 0.12, hatLevel: 0.028, snareLevel: 0.05,
      scale: [0, 2, 3, 5, 7, 8, 10],
      prog: [{ root: 57, q: "min" }, { root: 53, q: "maj" }, { root: 48, q: "maj" }, { root: 55, q: "maj" }],
      arp: [0, null, 2, null, 4, null, 5, null, 7, null, 4, null, 2, null, 4, null],
      bass: [0, 3, 6, 8, 11, 14], kick: [0, 4, 8, 12], hat: [2, 6, 10, 14], snare: [4, 12]
    },

    playoff: {
      bpm: 126, level: 0.52,
      padWave: "sawtooth", padCut: 1350, padLevel: 0.11, detune: 10,
      arpKind: "tone", arpWave: "square", arpCut: 2600, arpLevel: 0.042, arpRev: 0.18, arpDur: 1.6,
      bassWave: "sawtooth", bassCut: 310, bassLevel: 0.16, bassDur: 0.75,
      rev: 0.2, kickLevel: 0.13, hatLevel: 0.034, snareLevel: 0.06,
      scale: [0, 2, 3, 5, 7, 8, 11],
      prog: [{ root: 52, q: "min" }, { root: 57, q: "min" }, { root: 59, q: "dom7" }, { root: 52, q: "min" }],
      arp: [0, 0, 2, 0, 4, 0, 2, 0, 5, 0, 4, 0, 7, 5, 4, 2],
      bass: [0, 2, 4, 6, 8, 10, 12, 14], kick: [0, 4, 8, 12], hat: [1, 3, 5, 7, 9, 11, 13, 15], snare: [4, 12]
    },

    worlds: {
      bpm: 76, level: 0.58,
      padWave: "sawtooth", padCut: 700, padLevel: 0.2, detune: 9, padSub: true,
      arpKind: "tone", arpWave: "triangle", arpCut: 2800, arpLevel: 0.042, arpRev: 0.7, arpDur: 3.0,
      bassWave: "sine", bassCut: 240, bassLevel: 0.17, bassDur: 2.2,
      rev: 0.6, kickLevel: 0.14, hatLevel: 0.012, snareLevel: 0, timp: 0.13,
      scale: [0, 2, 3, 5, 7, 8, 10],
      prog: [{ root: 50, q: "min" }, { root: 46, q: "maj" }, { root: 43, q: "min" }, { root: 45, q: "maj" }],
      arp: [0, null, null, null, 4, null, 7, null, 9, null, null, null, 7, null, 4, null],
      bass: [0, 8], kick: [0, 8], hat: [], snare: []
    },

    victory: {
      bpm: 104, level: 0.52,
      padWave: "sawtooth", padCut: 2200, padLevel: 0.12, detune: 6,
      arpKind: "bell", arpWave: "triangle", arpCut: 3400, arpLevel: 0.035, arpRev: 0.42, arpDur: 2.6,
      bassWave: "triangle", bassCut: 360, bassLevel: 0.15, bassDur: 1.2,
      rev: 0.42, kickLevel: 0.11, hatLevel: 0.026, snareLevel: 0.045,
      scale: [0, 2, 4, 5, 7, 9, 11],
      prog: [{ root: 48, q: "maj" }, { root: 43, q: "maj" }, { root: 45, q: "min" }, { root: 41, q: "maj" }],
      arp: [0, 2, 4, 7, 4, 2, 7, 9, 7, 4, 2, 4, 7, 9, 7, 4],
      bass: [0, 4, 8, 12], kick: [0, 8], hat: [2, 6, 10, 14], snare: [4, 12]
    },

    ending: {
      bpm: 62, level: 0.47,
      padWave: "sawtooth", padCut: 620, padLevel: 0.14, detune: 4, padSub: true,
      arpKind: "piano", arpWave: "triangle", arpCut: 2200, arpLevel: 0.05, arpRev: 0.7, arpDur: 5.0,
      bassWave: "sine", bassCut: 220, bassLevel: 0.12, bassDur: 2.4,
      rev: 0.68, kickLevel: 0.045, hatLevel: 0, snareLevel: 0,
      scale: [0, 2, 3, 5, 7, 8, 10],
      prog: [{ root: 45, q: "min" }, { root: 41, q: "maj" }, { root: 48, q: "maj" }, { root: 43, q: "maj" }],
      arp: [0, null, null, 4, null, 2, null, null, 5, null, null, 4, null, null, 7, null],
      bass: [0], kick: [0], hat: [], snare: []
    },

    /* BP / 局内：心跳压在鼓点下面，别让人喘过气 */
    tense: {
      bpm: 96, level: 0.42,
      padWave: "sawtooth", padCut: 900, padLevel: 0.09, detune: 6,
      arpKind: "tone", arpWave: "triangle", arpCut: 1600, arpLevel: 0.03, arpRev: 0.3, arpDur: 2.2,
      bassWave: "sine", bassCut: 180, bassLevel: 0.13, bassDur: 1.2,
      rev: 0.34, kickLevel: 0.1, hatLevel: 0.018, snareLevel: 0.02,
      scale: [0, 1, 3, 5, 7, 8, 10],
      prog: [{ root: 45, q: "min" }, { root: 45, q: "min" }, { root: 43, q: "maj" }, { root: 41, q: "maj" }],
      arp: [0, null, 0, null, 3, null, 0, null, 5, null, 3, null, 0, null, 7, null],
      bass: [0, 6], kick: [0, 8], hat: [4, 12], snare: []
    },

    /* 抗压吧 / 论坛：滑稽、轻，像有人在你耳边阴阳 */
    meme: {
      bpm: 108, level: 0.4,
      padWave: "square", padCut: 1100, padLevel: 0.07, detune: 14,
      arpKind: "tone", arpWave: "square", arpCut: 1800, arpLevel: 0.036, arpRev: 0.14, arpDur: 1.1,
      bassWave: "triangle", bassCut: 260, bassLevel: 0.12, bassDur: 0.5,
      rev: 0.14, kickLevel: 0.08, hatLevel: 0.026, snareLevel: 0.02,
      scale: [0, 2, 4, 5, 7, 9, 11],
      prog: [{ root: 55, q: "maj" }, { root: 57, q: "min" }, { root: 52, q: "maj" }, { root: 50, q: "maj" }],
      arp: [0, 2, 4, 2, 5, 4, 2, 0, 7, 5, 4, 2, 0, 2, 4, 5],
      bass: [0, 4, 8, 12], kick: [0, 4, 8, 12], hat: [2, 6, 10, 14], snare: [4, 12]
    }
  };

  /* -------------------------------------------------------------- BGM 乐器 */
  function playPad(tr, t, dur, chord) {
    var cfg = tr.cfg;
    var c = st.ctx;
    var filt = c.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = Math.max(200, cfg.padCut * (0.9 + Math.random() * 0.2));
    filt.Q.value = 0.6;
    filt.connect(tr.gain);
    if (cfg.rev) sendRev(filt, cfg.rev * 0.55);

    var ints = QUAL[chord.q] || QUAL.min;
    var midis = [];
    if (cfg.padSub) midis.push(chord.root - 12);
    midis.push(chord.root);
    for (var i = 0; i < ints.length; i++) midis.push(chord.root + ints[i]);
    midis.push(chord.root + 12 + ints[0]);

    var voices = midis.length * 2;
    var env = newGain(0.0001);
    var peak = cfg.padLevel / Math.sqrt(voices) * 1.15;
    var atk = Math.min(1.3, dur * 0.32);
    var rel = Math.min(0.9, dur * 0.28);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(peak, t + atk);
    env.gain.setValueAtTime(peak, Math.max(t + atk + 0.01, t + dur - rel));
    env.gain.linearRampToValueAtTime(0.0001, t + dur);
    env.connect(filt);

    for (var k = 0; k < midis.length; k++) {
      for (var s = -1; s <= 1; s += 2) {
        var o = c.createOscillator();
        o.type = cfg.padWave;
        o.frequency.value = mtof(midis[k]);
        o.detune.value = cfg.detune * s + (Math.random() * 2 - 1);
        o.connect(env);
        o.start(t);
        o.stop(t + dur + 0.05);
      }
    }
  }

  function playBass(tr, t, dur, midi, level) {
    var cfg = tr.cfg;
    var c = st.ctx;
    var filt = c.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = cfg.bassCut;
    filt.Q.value = 0.9;
    filt.connect(tr.gain);

    var env = newGain(0.0001);
    var atk = 0.014;
    var rel = Math.min(0.3, dur * 0.45);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(level, t + atk);
    env.gain.setValueAtTime(level * 0.86, Math.max(t + atk + 0.01, t + dur - rel));
    env.gain.linearRampToValueAtTime(0.0001, t + dur);
    env.connect(filt);

    var o = c.createOscillator();
    o.type = cfg.bassWave;
    o.frequency.value = mtof(midi);
    o.connect(env);
    o.start(t);
    o.stop(t + dur + 0.02);

    var sub = c.createOscillator();
    sub.type = "sine";
    sub.frequency.value = mtof(midi);
    var sg = newGain(0.45);
    sub.connect(sg);
    sg.connect(env);
    sub.start(t);
    sub.stop(t + dur + 0.02);
  }

  function playArp(tr, t, midi, dur, level) {
    var cfg = tr.cfg;
    var f0 = mtof(midi);
    if (cfg.arpKind === "piano") {
      piano({ dest: tr.gain, t: t, f0: f0, dur: Math.max(0.6, dur * 2.2), level: level, rev: cfg.arpRev });
    } else if (cfg.arpKind === "bell") {
      bell({ dest: tr.gain, t: t, f0: f0, dur: Math.max(0.5, dur * 1.8), level: level * 1.15, rev: cfg.arpRev });
    } else {
      tone({
        dest: tr.gain, t: t, f0: f0, dur: dur, type: cfg.arpWave,
        cut: cfg.arpCut, level: level, atk: 0.006, sus: dur * 0.45, rev: cfg.arpRev
      });
    }
  }

  function playKick(tr, t, level) {
    if (!(level > 0)) return;
    var c = st.ctx;
    var o = c.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    var g = newGain(0.0001);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(level, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.connect(g);
    g.connect(tr.gain);
    o.start(t);
    o.stop(t + 0.32);
    noiseHit({ dest: tr.gain, t: t, dur: 0.02, type: "highpass", f0: 3200, level: level * 0.3, atk: 0.001 });
  }

  function playHat(tr, t, level) {
    if (!(level > 0)) return;
    noiseHit({ dest: tr.gain, t: t, dur: 0.045, type: "highpass", f0: 7600, q: 0.7, level: level, atk: 0.001 });
  }

  function playSnare(tr, t, level) {
    if (!(level > 0)) return;
    noiseHit({ dest: tr.gain, t: t, dur: 0.14, type: "bandpass", f0: 1900, q: 0.75, level: level, atk: 0.002, hold: 0.03, rev: 0.18 });
    tone({ dest: tr.gain, t: t, f0: 190, dur: 0.09, type: "triangle", level: level * 0.45, atk: 0.002 });
  }

  function playTimp(tr, t, level) {
    if (!(level > 0)) return;
    tone({ dest: tr.gain, t: t, f0: 98, f1: 58, glide: 0.5, dur: 0.85, type: "sine", level: level, atk: 0.005, rev: 0.35 });
    noiseHit({ dest: tr.gain, t: t, dur: 0.3, type: "lowpass", f0: 320, q: 0.8, level: level * 0.5, atk: 0.004, rev: 0.25 });
  }

  /* ------------------------------------------------------------ BGM 调度器 */
  function scheduleStep(tr, time, step) {
    var cfg = tr.cfg;
    var spb = 60 / cfg.bpm;        // 一拍秒数
    var stepSec = spb / 4;          // 十六分音符
    var barSec = spb * 4;
    var chord = cfg.prog[tr.bar % cfg.prog.length];
    var t = time + Math.random() * 0.004;

    if (step === 0) {
      playPad(tr, t, barSec, chord);
      if (cfg.timp) playTimp(tr, t, cfg.timp);
    }

    if (cfg.bass && cfg.bass.indexOf(step) >= 0) {
      var bdur = spb * (cfg.bassDur || 1);
      var blvl = cfg.bassLevel * (step === 0 ? 1.12 : 0.82);
      playBass(tr, t, bdur, Math.max(26, chord.root - 12), blvl);
    }

    if (cfg.arp) {
      var deg = cfg.arp[step];
      if (deg != null) {
        var sc = cfg.scale;
        var di = ((deg % sc.length) + sc.length) % sc.length;
        var oct = Math.floor(deg / sc.length);
        var midi = chord.root + 12 + sc[di] + 12 * oct;
        playArp(tr, t, midi, stepSec * (cfg.arpDur || 2), cfg.arpLevel * (0.82 + Math.random() * 0.3));
      }
    }

    if (cfg.kick && cfg.kick.indexOf(step) >= 0) playKick(tr, t, cfg.kickLevel);
    if (cfg.hat && cfg.hat.indexOf(step) >= 0) playHat(tr, t, cfg.hatLevel);
    if (cfg.snare && cfg.snare.indexOf(step) >= 0) playSnare(tr, t, cfg.snareLevel);
  }

  function pump(tr) {
    if (!tr || tr.dead || !isReady()) return;
    try {
      var now = st.ctx.currentTime;
      if (tr.next < now - 0.6) tr.next = now + 0.06;
      var guard = 0;
      while (tr.next < now + 0.12 && guard++ < 48) {
        scheduleStep(tr, tr.next, tr.step);
        tr.next += 60 / tr.cfg.bpm / 4;
        tr.step = (tr.step + 1) % 16;
        if (tr.step === 0) tr.bar++;
      }
    } catch (e) {
      stopTrack(tr, 0.05);
    }
  }

  function startTrack(mode, cfg) {
    var c = st.ctx;
    var g = c.createGain();
    g.gain.value = 0.0001;
    g.connect(st.duckGain || st.musicBus || st.master);
    var tr = {
      mode: mode, cfg: cfg, gain: g, dead: false, timer: 0,
      next: c.currentTime + 0.1, step: 0, bar: 0, startAt: c.currentTime
    };
    try { g.gain.linearRampToValueAtTime(cfg.level, c.currentTime + 1.2); } catch (e) {}
    tr.timer = setInt(function () { pump(tr); }, 25);
    pump(tr);
    return tr;
  }

  function stopTrack(tr, fade) {
    if (!tr) return;
    tr.dead = true;
    if (tr.timer) { clearInt(tr.timer); tr.timer = 0; }
    if (!st.ctx || !tr.gain) return;
    var f = fade > 0 ? fade : 0.05;
    try {
      var g = tr.gain.gain;
      var now = st.ctx.currentTime;
      // 估算淡入进行到哪，作为 fallback 起点，保证旧曲是从“当前音量”淡出的。
      var lvl = tr.cfg.level;
      var prog = tr.startAt == null ? 1 : (now - tr.startAt) / 1.2;
      prog = Math.max(0.0001, Math.min(1, prog));
      holdParam(g, now, Math.max(0.0001, lvl * prog));
      g.linearRampToValueAtTime(0.0001, now + f);
    } catch (e) {}
    later(function () {
      try { tr.gain.disconnect(); } catch (e2) {}
    }, Math.round((f + 0.3) * 1000));
  }

  function applyMode(mode) {
    if (!isReady()) return;
    var m = mode === "off" ? "off" : (CFG[mode] ? mode : "off");
    if (m === st.mode && (m === "off" || st.track)) return;
    var old = st.track;
    st.track = null;
    st.mode = m;
    if (old) stopTrack(old, 1.2);
    if (m === "off") return;
    st.track = startTrack(m, CFG[m]);
  }

  /* -------------------------------------------------------------- 公开 API */
  function sfx(name, opt) {
    if (st.mute) return;
    if (!isReady()) {
      if (!init() || !isReady()) return;
    }
    resumeCtx();
    var fn = SFX[name];
    if (typeof fn !== "function") return;
    var v = 1;
    if (opt && typeof opt === "object") {
      var q = Number(opt.vol);
      if (isFinite(q)) v = Math.max(0, Math.min(2, q));
    }
    fn(st.ctx.currentTime + 0.005, v);
  }

  function bgm(mode) {
    var m = mode == null ? "off" : String(mode);
    if (m !== "off" && !CFG[m]) m = "off";
    st.desired = m;
    if (!isReady()) {
      if (!init() || !isReady()) return;
    }
    resumeCtx();
    applyMode(m);
  }

  function safeWrap(fn, fallback) {
    return function () {
      try { return fn.apply(null, arguments); } catch (e) { return fallback; }
    };
  }

  API.init = safeWrap(init, false);
  API.sfx = safeWrap(sfx, undefined);
  API.bgm = safeWrap(bgm, undefined);
  API.setMute = safeWrap(setMute, undefined);
  API.setVolume = safeWrap(setVolume, undefined);
  API.duck = safeWrap(duck, undefined);
  API.muted = function () {
    try { return !!st.mute; } catch (e) { return false; }
  };
  API.volume = function () {
    try { return st.vol; } catch (e) { return 0.8; }
  };

  /* -------------------------------------------------- 首次手势兜底（可选） */
  try {
    var doc = root.document;
    if (doc && typeof doc.addEventListener === "function") {
      var unlock = function () {
        try { init(); } catch (e) {}
        try {
          doc.removeEventListener("pointerdown", unlock, true);
          doc.removeEventListener("keydown", unlock, true);
          doc.removeEventListener("touchstart", unlock, true);
        } catch (e2) {}
      };
      doc.addEventListener("pointerdown", unlock, true);
      doc.addEventListener("keydown", unlock, true);
      doc.addEventListener("touchstart", unlock, true);
    }
  } catch (eHook) {}
})();
