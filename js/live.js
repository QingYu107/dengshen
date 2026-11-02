/* 即时弹幕：跟着"这一下发生了什么"炸出来的那一屏。
 * 与 ui.js 的常驻弹幕（DM）并行：这里只管"结果反馈"，不强依赖 ui.js。
 * 数据来自 js/data/danmaku_live.js；开关由底栏「弹幕」按钮同时控制。
 */
window.LIVE = (function () {
  const COLORS = {
    僵尸: "#77b4ff", 水鬼: "#77b4ff", 碧螺春: "#5fdca0", 皇杂: "#f0c33c",
    猪仔: "#f0c33c", "60E": "#bb8dff", 韩杂: "#bb8dff", 黑子: "#ff6f6f",
    白子: "#dbe4ef", 串子: "#a3b0bf", 乐子人: "#a3b0bf", 路人: "#8f9aa8",
    老婆粉: "#ff9ec4", 扭曲粉: "#bb8dff"
  };
  const TAGS = ["send", "throw", "clutch", "steal", "solo", "teamfight", "bounce", "stomp", "upsetWin", "upsetLose", "gg"];
  const STEAL_WORDS = ["抢", "偷", "龙", "大龙"];
  const SOLO_WORDS = ["单杀", "对线", "换血", "越塔"];
  const FIGHT_WORDS = ["团", "开团", "一波"];
  const THROW_WORDS = ["浪", "优势", "领先", "翻了"];

  let on = true;
  let lastKey = "";
  let roomEl = null;

  function data() { return window.DATA_DANMAKU_LIVE || { tags: {}, thirst: [], idle: [] }; }
  function state() {
    try { return window.GAME && window.GAME.getState ? window.GAME.getState() : null; } catch (e) { return null; }
  }
  function rnd() { return Math.random(); }
  function pickOne(arr) { return arr && arr.length ? arr[Math.floor(rnd() * arr.length)] : null; }

  function room() {
    if (!document || !document.body) return null;
    if (roomEl && roomEl.parentNode) return roomEl;
    roomEl = document.getElementById("danmaku");
    if (!roomEl) {
      roomEl = document.createElement("div");
      roomEl.id = "danmaku";
      document.body.appendChild(roomEl);
    }
    return roomEl;
  }

  function fill(t) {
    const S = state();
    if (!S) return t;
    const team = (window.GAME && window.GAME.teamOf && S.teamId) ? window.GAME.teamOf(S.teamId) : null;
    return String(t)
      .replace(/\{name\}/g, S.name || "他")
      .replace(/\{team\}/g, (team && team.name) || "我们")
      .replace(/\{opp\}/g, (S.oppName || "对面"))
      .replace(/\{pos\}/g, (window.GAME && window.GAME.CN && window.GAME.CN[S.pos]) || S.pos || "对手")
      .replace(/\{cast\}/g, "解说");
  }

  function drop(it, opt) {
    const el = room();
    if (!el || typeof el.appendChild !== "function" || !it) return;
    const span = document.createElement("span");
    span.className = "dm live";
    span.style.top = (4 + rnd() * 62).toFixed(1) + "%";
    span.style.color = COLORS[it.g] || "#dbe4ef";
    span.style.fontSize = (opt && opt.big ? 18 + rnd() * 2 : 13 + rnd() * 2.6).toFixed(1) + "px";
    span.style.animationDuration = (5.2 + rnd() * 3.4).toFixed(2) + "s";
    span.innerHTML = '<span class="g">' + esc(it.g || "") + "</span>" + esc(fill(it.t || ""));
    span.addEventListener("animationend", () => { if (span.parentNode) span.parentNode.removeChild(span); });
    el.appendChild(span);
    if (window.setTimeout) window.setTimeout(() => { if (span.parentNode) span.parentNode.removeChild(span); }, 9000);
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  function tagPool(tag) { const d = data(); return (d.tags && d.tags[tag]) || []; }

  function burst(tags, opt) {
    if (!on) return;
    opt = opt || {};
    const list = Array.isArray(tags) ? tags : [tags];
    const n = opt.n || (3 + Math.floor(rnd() * 3));
    for (let i = 0; i < n; i++) {
      const r = rnd();
      let it = null;
      if (r < 0.14 && data().thirst && data().thirst.length) it = pickOne(data().thirst);
      else if (r < 0.34 && data().idle && data().idle.length) it = pickOne(data().idle);
      else it = pickOne(tagPool(list[Math.floor(rnd() * list.length)]));
      if (!it) it = pickOne(data().idle);
      drop(it, { big: !!opt.big });
    }
  }

  function moment(text) {
    if (!on || !text) return;
    const el = room();
    if (!el || typeof el.appendChild !== "function") return;
    const span = document.createElement("span");
    span.className = "dm-hero";
    span.innerHTML = esc(fill(text));
    el.appendChild(span);
    if (window.setTimeout) window.setTimeout(() => { if (span.parentNode) span.parentNode.removeChild(span); }, 2800);
  }

  function tagOf(sc) {
    if (!sc) return null;
    if (sc.type === "boGame") return sc.win
      ? (sc.upset ? "upsetWin" : (sc.mom >= 120 ? "stomp" : "clutch"))
      : (sc.upset ? "upsetLose" : (sc.mom >= 90 ? "throw" : "send"));
    if (sc.type === "result") {
      const t = String(sc.title || "") + String(sc.text || "");
      if (sc.tone === "win") {
        if (STEAL_WORDS.some(w => t.indexOf(w) >= 0)) return "steal";
        if (SOLO_WORDS.some(w => t.indexOf(w) >= 0)) return "solo";
        if (FIGHT_WORDS.some(w => t.indexOf(w) >= 0)) return "teamfight";
        return "clutch";
      }
      if (sc.tone === "lose") {
        if (THROW_WORDS.some(w => t.indexOf(w) >= 0)) return "throw";
        return "send";
      }
      return null;
    }
    if (sc.type === "duelResult" || sc.type === "swissResult") return sc.win ? "clutch" : "send";
    return null;
  }

  function after(sc) {
    if (!on || !sc) return;
    const key = [sc.type, sc.title || "", sc.g || "", sc.win ? 1 : 0, sc.upset ? 1 : 0, Math.round((sc.mom || 0) / 40)].join("|");
    if (key === lastKey) return;
    lastKey = key;
    const tag = tagOf(sc);
    if (tag) burst(tag, { n: sc.tone === "lose" || tag === "send" ? 6 : 4 });
    if (sc.upset) moment(sc.win ? "这也能赢？" : "这也能输？");
    if (sc.type === "inGame" && (sc.g || 0) >= 4) burst("gg", { n: 3 });
  }

  function toggle(force) { on = force == null ? !on : !!force; if (!on) { const el = room(); if (el && el.innerHTML !== undefined) el.innerHTML = ""; } return on; }
  function enabled() { return on; }

  return { burst, moment, after, tagOf, toggle, enabled, TAGS };
})();
