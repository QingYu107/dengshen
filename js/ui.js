/* 《登神》界面层 —— 场景渲染 + 交互绑定 */
(function () {
  "use strict";
  const A = window.ART, G = window.GAME;
  let mgrMode = false;
  const app = document.getElementById("app");

  const dock = document.getElementById("dock");
  const toastEl = document.getElementById("toast");

  let view = "menu";        // menu | game
  let tab = "main";         // menu 子页：main | diff | slots | codex
  let sc = null;            // 当前场景
  let diff = "normal";
  let mode = "three";       // three | endless
  let started = false;
  let glossTab = "";        // 图鉴当前分组

  /* ---------- 工具 ---------- */
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const br = s => esc(s).replace(/\n/g, "<br>");
  const fan = n => !n ? "0" : n >= 1e8 ? (n / 1e8).toFixed(2) + " 亿" : n >= 1e4 ? (n / 1e4).toFixed(1) + " 万" : String(Math.round(n));
  const pct = v => Math.max(0, Math.min(100, Math.round(v)));
  /* 概率/胜率统一出口：0..1 当比例换算成百分比，0..100 原样用，非数字给「—」，绝不吐 NaN */
  const probTxt = v => {
    const n = Number(v);
    if (v === null || v === undefined || !isFinite(n)) return "—";
    return Math.round(n * (Math.abs(n) <= 1 ? 100 : 1)) + "%";
  };
  const probNum = v => {
    const n = Number(v);
    if (v === null || v === undefined || !isFinite(n)) return null;
    return Math.round(n * (Math.abs(n) <= 1 ? 100 : 1));
  };
  const barHTML = (v, cls) => `<span class="bar ${cls || ""}"><i style="width:${pct(v)}%"></i></span>`;

  /* ---------- 精力 / 存款档位 ----------
     优先吃 engine 导出的 GAME.energyBand()/moneyBand()/ENERGY_BANDS/MONEY_BANDS；
     engine 还没落地时按需求文档的档位表回退，保证旧场景照常渲染。 */
  const EB_FALLBACK = [
    { min: 80, key: "peak", name: "充沛", color: "#3fc1c9", note: "手感最好，别拿来干杂活。" },
    { min: 50, key: "normal", name: "正常", color: "#59c26a", note: "够打一场硬仗。" },
    { min: 30, key: "tired", name: "疲劳", color: "#e8b923", note: "训练效果打折，失误变多。" },
    { min: 15, key: "drain", name: "透支", color: "#f07a1f", note: "在借下个月的点打这个月。" },
    { min: 1, key: "danger", name: "危险", color: "#e0423f", note: "再掉一点就要进医院。" },
    { min: -1, key: "collapse", name: "倒下", color: "#8f1414", note: "这个月什么都做不了。" }
  ];
  const MB_FALLBACK = [
    { min: 1000, key: "capital", name: "资本玩家", color: "#b07bff", note: "你已经不是选手了，你是资本。" },
    { min: 200, key: "rich", name: "有钱", color: "#3fc1c9", note: "在圈里算有钱人。" },
    { min: 50, key: "easy", name: "宽裕", color: "#59c26a", note: "偶尔能请全队吃饭。" },
    { min: 10, key: "steady", name: "稳定", color: "#e8b923", note: "够花，别乱花。" },
    { min: 0, key: "tight", name: "紧巴", color: "#f07a1f", note: "一分钱掰两半花。" },
    { min: -1e9, key: "debt", name: "欠债", color: "#e0423f", note: "兜里比脸还干净。" }
  ];
  function normBands(raw) {
    if (!raw) return null;
    const arr = Array.isArray(raw) ? raw.slice() : Object.keys(raw).map(k => Object.assign({ key: k }, raw[k] || {}));
    const out = arr.filter(b => b && typeof b === "object" && (b.min != null || b.from != null)).map(b => ({
      min: b.min != null ? b.min : b.from,
      key: b.key || "", name: b.name || b.label || b.key || "",
      color: b.color || "", note: b.note || b.desc || ""
    })).sort((a, b) => a.min - b.min);
    return out.length ? out : null;
  }
  function energyBands() {
    const b = normBands(window.GAME && window.GAME.ENERGY_BANDS);
    return b || EB_FALLBACK.slice().sort((a, c) => a.min - c.min);
  }
  function moneyBands() {
    const b = normBands(window.GAME && window.GAME.MONEY_BANDS);
    return b || MB_FALLBACK.slice().sort((a, c) => a.min - c.min);
  }
  function pickBand(list, x) {
    let out = list[0];
    list.forEach(b => { if (x >= b.min) out = b; });
    return out;
  }
  function energyBandOf(e) {
    const x = e == null ? 0 : e;
    if (window.GAME && typeof window.GAME.energyBand === "function") {
      try {
        const r = window.GAME.energyBand(x);
        if (r && r.name) return { min: null, key: r.key || "", name: r.name, color: r.color || "", note: r.note || "" };
      } catch (err) {}
    }
    return pickBand(energyBands(), x);
  }
  function moneyBandOf(m) {
    const x = m == null ? 0 : m;
    if (window.GAME && typeof window.GAME.moneyBand === "function") {
      try {
        const r = window.GAME.moneyBand(x);
        if (r && r.name) return { min: null, key: r.key || "", name: r.name, color: r.color || "", note: r.note || "" };
      } catch (err) {}
    }
    return pickBand(moneyBands(), x);
  }
  function nextBandHint(list, x) {
    for (let i = 0; i < list.length; i++) {
      if (list[i].min > x) {
        const d = Math.ceil(list[i].min - x);
        return d > 0 ? `离「${list[i].name}」还差 ${d} 点` : `快进「${list[i].name}」了`;
      }
    }
    return null;
  }
  function bandTip(b, list, x, up) {
    const n = nextBandHint(list, x);
    const t = (b.note ? b.note : b.name) + (n ? "｜" + n : "");
    return esc(t);
  }
  function energyMaxOf() {
    if (window.GAME && typeof window.GAME.energyMax === "function") {
      try {
        const m = window.GAME.energyMax();
        if (typeof m === "number" && m > 0) return m;
      } catch (err) {}
    }
    const S = window.GAME && window.GAME.getState ? window.GAME.getState() : null;
    return (S && S.invest && S.invest.energyMax) ? 110 : 100;
  }
  /* 行动按钮上的一行精力预告：当前 42 → 行动后 20（进入疲劳） */
  function energyPreview(cost) {
    const S = window.GAME.getState ? window.GAME.getState() : null;
    if (!S || cost == null || typeof cost !== "number") return "";
    const cur = Math.round(S.energy == null ? 0 : S.energy);
    const emax = energyMaxOf();
    const after = Math.max(0, Math.min(emax, Math.round(cur - cost)));
    const b0 = energyBandOf(cur), b1 = energyBandOf(after);
    const move = b1.name !== b0.name ? `进入${b1.name}` : `还是${b1.name}`;
    return `当前 ${cur} → 行动后 ${after}（${move}）`;
  }
  function dedupeByLabel(list) {
    const seen = {};
    return (list || []).filter(x => {
      const k = x && x.label != null ? String(x.label) : "";
      if (!k) return true;
      if (seen[k]) return false;
      seen[k] = 1; return true;
    });
  }
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(() => toastEl.classList.remove("show"), 1700);
    try { if (window.FX && /成就|解锁/.test(String(msg))) window.FX.cue("award", { el: toastEl }); } catch (e) {}
  }
  const POSCN = { TOP: "上单", JUG: "打野", MID: "中单", BOT: "ADC", SUP: "辅助" };
  const DIMCN = { LANE: "对线", MECH: "操作", GAME: "意识", POOL: "英雄池", TEAM: "团队", FORM: "状态", PHYS: "身体", MENTAL: "心态", HYPE: "气势", FAME: "名气", ALL: "全局" };
  const dimCN = d => DIMCN[d] || (d == null ? "" : String(d));
  const posShort = p => ({ TOP: "TOP", JUG: "JUG", MID: "MID", BOT: "BOT", SUP: "SUP" }[p] || p);

  /* ---------- 声音（js/audio.js 提供 window.SND；没有就全静默） ---------- */
  let audioAwake = false, bgmCur = "", bgmWant = "menu", lastSfx = 0;
  function sfx(name, opt) {
    const a = window.SND;
    if (!a || !a.sfx) return;
    const now = Date.now();
    if (name === "click" && now - lastSfx < 40) return;
    try { a.sfx(name, opt); } catch (e) {}
    lastSfx = now;
  }
  function wakeAudio() {
    if (audioAwake) return;
    const a = window.SND;
    if (!a) return;
    audioAwake = true;
    try { a.init && a.init(); } catch (e) {}
    bgmCur = bgmWant;
    try { a.bgm && a.bgm(bgmWant); } catch (e) {}
  }
  function bgmFor(next) {
    bgmWant = next;
    const a = window.SND;
    if (!a || !a.bgm || !audioAwake) return;
    if (next === bgmCur) return;
    bgmCur = next;
    try { a.bgm(next); } catch (e) {}
  }
  function sceneBgm() {
    if (view !== "game" || !started || !sc) return "menu";
    if (/^create_/.test(sc.type)) return "menu";
    if (sc.type === "ending") {
      const big = /S/.test((sc.end || {}).rank || "") || ((sc.record || {}).titles || []).some(t => String(t).indexOf("全球总决赛") >= 0);
      return big ? "victory" : "ending";
    }
    const S = G.getState() || {};
    const m = (S._ml || {}).month || 1;
    const big = m === 9 || m === 10;
    const cup = m === 2 || m === 3 || m === 5 || m === 6 || m === 8;
    if (sc.type === "highlight") return "victory";
    if (sc.type === "worldsMap") return "worlds";
    if (sc.type === "bp" || sc.type === "inGame" || sc.type === "prep") return "tense";
    if (sc.type === "bar" || sc.type === "forum") return "meme";
    if (sc.type === "duel" || sc.type === "duelResult" || sc.type === "matchday" || sc.type === "swissResult"
      || sc.type === "boGame") {
      if (big) return "worlds";
      if (cup) return "playoff";
      return S.stage === "LDL" ? "ldl" : "lpl";
    }
    if (big) return "worlds";
    if (cup) return "playoff";
    return S.stage === "LDL" ? "ldl" : "lpl";
  }

  /* ---------- 顶栏 ---------- */
  function topbarHTML() {
    const S = G.getState(); if (!S || !started) return "";
    const t = G.teamOf(S.teamId);
    const ml = G.monthLabel(S.tick);
    const ovr = G.myOvr(), v = G.voice();
    const S2 = S.endless ? `<span class="chip purple">无尽 · 第 ${S.season} 季</span>` : `<span class="chip">第 ${S.season} 年</span>`;
    const e0 = Math.round(S.energy == null ? 0 : S.energy), m0 = Math.round(S.money == null ? 0 : S.money);
    const eb = energyBandOf(e0), mb = moneyBandOf(m0);
    const ec = eb.color || "#3fc1c9", mc = mb.color || "#e8b923";
    return `<div id="topbar">
      <div class="between">
        <div class="who">
          <span class="avatar-ring">${A.avatar(S.name + S.pos, "#e8b923", 34)}</span>
          <div style="min-width:0">
            <div class="name">${esc(S.name)} <span class="chip gold">${POSCN[S.pos] || S.pos}</span>${S2}</div>
            <div class="who-sub">${esc(t ? t.name : "无队")} · ${ml.year}.${String(ml.month).padStart(2, "0")} · 合同剩 ${S.contractLeft} 年</div>
          </div>
        </div>
        <div class="hud-meters">
          <div class="ovr-badge"><b>${ovr}</b><span>评分</span></div>
          <div class="hud-item" title="${bandTip(mb, moneyBands(), m0)}"><span class="lb">${A.glyph("money", 12)}存款</span><span class="vl" style="color:${mc};font-weight:600">${m0}<span class="unit">万</span></span></div>
          <div class="hud-item" title="${bandTip(eb, energyBands(), e0)}"><span class="lb">${A.glyph("energy", 12)}精力</span><span class="bar bnd"><i style="width:${pct(e0)}%;background:linear-gradient(90deg,${ec}99,${ec})"></i></span><span class="vl" style="color:${ec}">${e0}</span></div>
          <div class="hud-item"><span class="lb">${A.glyph("mental", 12)}心态</span>${barHTML(S.morale, "mo")}</div>
          <div class="hud-item"><span class="lb">${A.glyph("flag", 12)}士气</span>${barHTML(S.spirit == null ? 60 : S.spirit, "hi")}</div>
          <div class="hud-item"><span class="lb">${A.glyph("fire", 12)}气势</span>${barHTML(S.burst, "hp")}</div>
          <div class="hud-item" title="话语权：队里说话的分量，语音里喊得动人才有用"><span class="lb">${A.glyph("voice", 12)}话语权</span><span class="vl">${v}</span></div>
        </div>
      </div>
    </div>`;
  }

  /* ---------- 侧栏 ---------- */
  function sideHTML() {
    const S = G.getState(); if (!S) return "";
    const t = G.teamOf(S.teamId);
    const roster = (G.myRoster ? G.myRoster() : []) || [];
    const titles = (S.record && S.record.titles) || [];
    return `
      <div class="side-card">
        <h4>选手</h4>
        <div class="side-kv"><span>评分</span><b>${G.myOvr()}</b></div>
        <div class="side-kv"><span>年龄</span><b>${S.age}</b></div>
        <div class="side-kv" title="年薪是你的合同价，工资按月发，所以每个月到手的是年薪的十二分之一"><span>身价</span><b>${Math.max(0, Math.round(S.salary))} 万/年 · 月发 ${Math.round((S.salary || 0) / 12 * 10) / 10} 万</b></div>
        <div class="side-kv"><span>粉丝</span><b>${fan(S.fans)}</b></div>
        <div class="side-kv"><span>虎扑</span><b>${(S.hupu || 0).toFixed(1)}</b></div>
      </div>
      <div class="side-card">
        <h4>八维</h4>
        <div class="radar-box">${A.radar(S.st, 216)}</div>
        ${G.STATS.map(k => `<div class="side-stat"><span>${G.CN[k]}</span>${barHTML(S.st[k])}<span>${Math.round(S.st[k])}</span></div>`).join("")}
      </div>
      <div class="side-card side-wide">
        <h4>队友 · ${esc(t ? t.name : "无队")}</h4>
        ${roster.length ? roster.map(r => `<div class="roster-row ${r.mine ? "me" : ""}">
          <span class="rp">${posShort(r.pos)}</span>
          <span class="rn">${esc(r.name)}${r.mine ? " ★" : ""}</span>
          <span class="ro">${Math.round(r.ovr)}</span>
        </div>`).join("") : `<div class="small-note">你还没有队。</div>`}
      </div>
      <div class="side-card side-wide">
        <h4>生涯</h4>
        <div class="side-kv"><span>战绩</span><b>${S.record.wins} 胜 ${S.record.losses} 负</b></div>
        <div class="side-kv"><span>冠军</span><b>${titles.length}</b></div>
        <div class="side-kv" title="${bandTip(moneyBandOf(S.money), moneyBands(), Math.round(S.money || 0))}"><span>存款</span><b style="color:${(moneyBandOf(S.money) || {}).color || "inherit"}">${Math.round(S.money)} 万</b></div>
        <div class="side-kv"><span>抽卡券</span><b>${S.ticket || 0}</b></div>
        <div class="side-kv"><span>卡槽</span><b>${(S.deck || []).filter(Boolean).length}/5</b></div>
        ${titles.length ? `<div class="row wrap" style="gap:5px;margin-top:8px">${titles.slice(-3).map(x => `<span class="chip gold">${esc(x)}</span>`).join("")}</div>` : ""}
      </div>`;
  }

  function shell(inner, opt) {
    const solo = !!(opt && opt.solo);
    const showSide = !solo && started && sc && !/^create_/.test(sc.type) && sc.type !== "ending";
    return `<div class="console ${showSide ? "" : "solo"}">
      <div class="stage">${inner}</div>
      ${showSide ? `<aside class="side">${sideHTML()}</aside>` : ""}
    </div>`;
  }

  /* ---------- 主菜单 ---------- */
  function renderMenu() {
    if (tab === "diff") return renderDiff();
    if (tab === "mgrpick") return renderMgrPick();
    if (tab === "slots") return renderSlots();
    if (tab === "codex") return renderCodex();
    if (tab === "hall") return renderHall();
    const has = G.hasSave("auto");
    return `<div class="menu-wrap fade-in">
      <div class="title-mark">
        <div class="kicker">LPL ROAD TO GLORY</div>
        <h1>登神</h1>
        <div class="sub">从 LDL 打到世界赛</div>
        <div class="en">ONE ID · 2025 → ∞ · REAL NAMES · REAL MEMES</div>
      </div>
      <div class="panel">
        <div class="menu-actions">
          <button class="btn primary" data-act="tab" data-v="diff">开始职业生涯 <span class="tagline">选模式与难度 · 抽基底 · 选位置 · 选英雄池</span></button>
          ${has ? `<button class="btn" data-act="continue">继续上次 <span class="tagline">读取自动存档</span></button>` : ""}
          <button class="btn" data-act="tab" data-v="slots">存档 / 读档 <span class="tagline">三个手动档 + 一个自动档</span></button>
          <button class="btn" data-act="tab" data-v="codex">档案室 <span class="tagline">赛制、数值、编年史、冷知识、黑料</span></button>
          <button class="btn gold" data-act="tab" data-v="mgrpick">电竞经理模式 <span class="tagline">不当选手了 · 选难度 · 选队或自建 · 抽卡组队 · BP 打比赛</span></button>
          <button class="btn" data-act="cockfight">斗蛐蛐 <span class="tagline">不进游戏，把两个人拉到台上按数据打一场，看谁先死</span></button>
        <button class="btn" data-act="tab" data-v="hall">名人堂 <span class="tagline">你打出来过的角色 · 结局与战绩留档</span></button>
        </div>
      </div>
      <div class="menu-foot">真实选手 ID 与真实战绩（截至 2024 赛季，2025 年起为推演）<br>调侃不是事实，梗只对事不对人。该夸就夸，该骂就骂。</div>
    </div>`;
  }

  function renderDiff() {
    const ds = G.DIFFS, ms = G.MODES || {};
    return `<div class="fade-in">
      <div class="between" style="margin-bottom:16px">
        <div><div class="kicker">NEW CAREER</div><h2>开一局新的</h2><p class="dim" style="margin:4px 0 0">先选打多久，再选多难打。</p></div>
        <button class="btn small ghost" data-act="tab" data-v="main">返回</button>
      </div>
      <div class="kicker" style="margin-bottom:8px">MODE · 打多久</div>
      <div class="mode-row">
        ${Object.values(ms).map(m => `<div class="mode-card ${m.key === mode ? "on" : ""}" data-act="setmode" data-v="${m.key}">
          <div class="mflag">${esc(m.tag || "")}</div>
          <div class="mt">${esc(m.name)}</div>
          <div class="md">${esc(m.desc)}</div>
        </div>`).join("")}
      </div>
      <div class="kicker" style="margin:20px 0 8px">DIFFICULTY · 多难打</div>
      <div class="base-grid">
        ${Object.values(ds).map(d => `<div class="base-card ${d.key === diff ? "on" : ""}" data-act="setdiff" data-v="${d.key}" style="border-color:${d.key === diff ? "rgba(232,185,35,.75)" : ""}">
          <div class="tag">${esc(d.key.toUpperCase())}</div>
          <h3>${esc(d.name)}</h3>
          <p>${esc(d.desc)}</p>
          <div class="mini-stats">
            <span>成长</span><b>${Math.round(d.growth * 100)}%</b>
            <span>对手</span><b>${d.opp > 0 ? "+" + d.opp : d.opp}</b>
            <span>负面</span><b>${Math.round(d.bad * 100)}%</b>
            <span>运气</span><b>${Math.round(d.luck * 100)}%</b>
          </div>
        </div>`).join("")}
      </div>
      <div class="panel" style="margin-top:18px">
        <div class="between wrap">
          <div class="small-note">${esc((ms[mode] || {}).name || "")} · <b style="color:var(--gold)">${esc(ds[diff].name)}</b> · ${mode === "endless" ? "打到退役为止，随时可以自己叫停" : "36 个月，约 23–30 分钟"}</div>
          <button class="btn primary small" data-act="start">进队</button>
        </div>
      </div>
    </div>`;
  }

  /* ---------- 经理模式：先选难度 ---------- */
  function renderMgrPick() {
    const M = window.MGR || {};
    const ds = M.DIFFS || {};
    let order = Array.isArray(M.DIFF_ORDER) && M.DIFF_ORDER.length ? M.DIFF_ORDER : Object.keys(ds);
    const list = order.map(k => ds[k]).filter(Boolean);
    return `<div class="fade-in">
      <div class="between" style="margin-bottom:16px">
        <div><div class="kicker">MANAGER MODE</div><h2>当经理，不当选手</h2>
        <p class="dim" style="margin:4px 0 0">你坐在办公室里，工资帽、转会、上场名单都是你的事。先选个难度。</p></div>
        <button class="btn small ghost" data-act="tab" data-v="main">返回</button>
      </div>
      <div class="kicker" style="margin-bottom:8px">DIFFICULTY · 多难打</div>
      <div class="base-grid">
        ${list.map(d => `<div class="base-card" data-act="mgr-diff" data-v="${esc(d.key)}" style="cursor:pointer">
          <div class="tag">${esc(String(d.key || "").toUpperCase())}${d.tag ? " · " + esc(d.tag) : ""}</div>
          <h3>${esc(d.name || d.key)}</h3>
          <p>${esc(d.desc || "")}</p>
        </div>`).join("")}
      </div>
      <div class="panel flat" style="margin-top:16px"><div class="small-note">细的不说：轻松是给你熟悉流程的，正常是这游戏该有的样子，困难是给已经打过几遍的人准备的。选错了也能重开。</div></div>
    </div>`;
  }

  function renderHall() {
    let list = [];
    try { list = JSON.parse(localStorage.getItem("denshen_hof") || "[]") || []; } catch (e) { list = []; }
    let mg = null;
    try { mg = JSON.parse(localStorage.getItem("denshen_mgr") || "null"); } catch (e) { mg = null; }
    const RC = { "S+": "#e8b923", "S": "#d8c27a", "A+": "#7fd0ff", "A": "#8fb3a1", "A-": "#8fb3a1", "B+": "#aaa", "B": "#999", "C-": "#c05a5a", "C": "#888", "D": "#777", "X": "#c05a5a" };
    const rows = list.length ? list.map(function (h) {
      return '<div class="chron-row"><span class="chron-a" style="color:' + (RC[h.rank] || "#ccc") + '">' + esc(h.rank) + " · " + esc(h.story || "") + '</span><span class="chron-b">' + esc(h.name) + " · " + esc(h.pos || "") + " · " + esc(h.team || "") + '</span><span class="chron-c">评分 ' + esc(h.ovr) + " · 冠军 " + esc(h.titles || 0) + " · 世界赛 " + esc(h.worlds || "无") + '</span><span class="chron-d">' + esc(h.mode === "endless" ? h.seasons + " 季" : "三年") + '</span></div>';
    }).join("") : '<div class="empty">你还没打出过一个角色。三年打完，不管什么结局，都会刻在这里。</div>';
    const mgLine = (mg && mg.best) ? '<div class="callout">上一轮经理模式：' + esc(mg.best.team || "") + " · " + esc(mg.best.grade || "") + " · 奖杯 " + esc(mg.best.cups || 0) + ' 座（本局生涯开局多 5 抽卡券 + 50 万）</div>' : "";
    return '<div class="menu-wrap fade-in"><div class="title-mark"><div class="tm-k">HALL OF FAME</div><div class="tm-t">名人堂</div></div>'
      + '<div class="panel"><div class="panel-kicker">已留档 ' + list.length + ' 位 · 登神 / 无冕之王 / 人间理想会同时进经理模式当股东</div>'
      + mgLine + rows + '</div>'
      + '<button class="btn small" data-act="tab" data-v="main">返回</button></div>';
  }

  function renderSlots() {
    const canSave = !!(G.canSave && G.canSave());
    const rows = ["auto", 1, 2, 3].map(s => {
      const has = G.hasSave(s);
      const label = s === "auto" ? "自动存档" : "手动档 " + s;
      return `<div class="panel flat" style="margin-top:10px">
        <div class="between">
          <div><b>${label}</b> <span class="chip ${has ? "green" : ""}">${has ? "有档" : "空"}</span></div>
          <div class="row">
            ${has ? `<button class="btn small" data-act="load" data-v="${s}">读档</button>` : ""}
            ${s !== "auto" ? `<button class="btn small ghost" data-act="save" data-v="${s}" ${(started && canSave) ? "" : "disabled"} title="${started ? (canSave ? "本周刚开月，能存" : "只能月初存档") : "先开一局"}">${canSave ? "存档" : "只能月初存档"}</button>` : ""}
          </div>
        </div>
      </div>`;
    }).join("");
    return `<div class="fade-in">
      <div class="between" style="margin-bottom:14px">
        <div><div class="kicker">SAVES</div><h2>存档</h2></div>
        <button class="btn small ghost" data-act="tab" data-v="main">返回</button>
      </div>
      ${started && !canSave ? `<div class="panel flat" style="border-color:rgba(232,185,35,.4)"><span class="chip gold">只能月初存档</span> <span class="small-note">这个月的进度已经动了。下个月开头再存，不然读回来对不上。</span></div>` : ""}
      ${rows}
    </div>`;
  }

  let codexTab = "worlds", codexQ = "";
  let bfCat = "all", bfSeason = "all", bfTag = "all", bPage = 0;
  let memeSub = "memes", cardSub = "talents", cardPage = 0;
  const CATCN = { attitude: "嘴脸", betray: "背刺", cope: "嘴硬", food: "食堂", girl: "女粉", lazy: "摆烂", match: "比赛", money: "钱", rank: "排位", trash: "垃圾话" };
  const MGR_EFFCN = { lanes: "对线", team: "团战", mental: "心态", GAME: "意识", MECH: "操作", MENTAL: "心态", TEAM: "团队" };
  function codexHit(o) {
    if (!codexQ) return true;
    try { return JSON.stringify(o).toLowerCase().indexOf(codexQ.toLowerCase()) >= 0; } catch (e) { return false; }
  }
  /* 第 5 个参数 art：给了（哪怕是空串）就给所有行留出缩略图列，保证年份对齐 */
  function codexRow(a, b, c, d, art) {
    const withArt = art !== undefined;
    const pic = withArt ? `<span class="chron-art-wrap">${art ? `<img class="chron-art" src="${art}" alt="" width="46" height="32">` : ""}</span>` : "";
    return `<div class="chron-row${withArt ? " has-art" : ""}">${pic}<span class="yr">${esc(a)}</span><span class="ch">${esc(b)}</span><span class="dim">${esc(c || "")}</span><span class="nt">${esc(d || "")}</span></div>`;
  }
  /* 显示名：gossip/编年史 里存的是 id，按 DATA_PLAYERS / DATA_TEAMS join 成真名 */
  function displayName(who) {
    if (!who) return "";
    const P = window.DATA_PLAYERS || {}, T = window.DATA_TEAMS || {};
    const g = x => (x && (x.displayName || x.name || x.cn)) || "";
    if (P[who]) return g(P[who]) || who;
    if (T[who]) return g(T[who]) || who;
    const L = window.DATA_LCK || {};
    const lc = (L.teams || []).filter(x => x && (x.id === who || x.teamId === who))[0];
    if (lc) return g(lc) || who;
    const lp = (Array.isArray(L) ? L : (L.players || [])).filter(x => x && (x.id === who || x.pid === who))[0];
    if (lp) return g(lp) || lp.trait || who;
    const ip = (window.DATA_PLAYERS_INTL || []).filter(x => x && (x.id === who || x.pid === who))[0];
    if (ip) return g(ip) || who;
    return who;
  }
  /* 行内名字：编年史里有些对象只有 id 没 name，先 join 真名，再退 name，最后才用 id */
  function rowName(o) {
    if (!o) return "";
    const id = o.id || o.name || "";
    const nm = displayName(id);
    if (nm && nm !== id) return nm;
    if (o.name && o.name !== id) return o.name;
    return id;
  }
  function guestName(b) {
    if (!b) return "";
    const nm = displayName(b.who);
    if (nm && nm !== b.who) return nm;
    return b.whoLabel || b.who || "";
  }
  function gossipAll() { return ((window.DATA_GOSSIP || {}).black || []); }
  function gossipFiltered() {
    const q = codexQ.toLowerCase();
    return gossipAll().filter(b => {
      if (bfCat !== "all" && b.cat !== bfCat) return false;
      if (bfSeason !== "all" && String(b.season) !== String(bfSeason)) return false;
      if (bfTag !== "all" && !(b.tag || []).some(t => String(t) === bfTag)) return false;
      if (!q) return true;
      const hay = [guestName(b), b.who, b.year, b.season, b.cat, (b.tag || []).join(" "), b.text].join(" ").toLowerCase();
      return hay.indexOf(q) >= 0;
    });
  }
  function pagerHTML(total, page, size, act) {
    const pages = Math.max(1, Math.ceil(total / size));
    let p = Number(page) || 0;
    if (p >= pages) p = pages - 1;
    if (p < 0) p = 0;
    return {
      page: p, pages,
      html: `<div class="row between pager" style="margin-top:10px;align-items:center">
        <span class="small-note">共 ${total} 条 · 第 ${p + 1}/${pages} 页</span>
        <div class="row" style="gap:6px">
          <button class="btn small ghost" data-act="${act}" data-v="-1"${p <= 0 ? " disabled" : ""}>上一页</button>
          <button class="btn small ghost" data-act="${act}" data-v="1"${p >= pages - 1 ? " disabled" : ""}>下一页</button>
        </div>
      </div>`
    };
  }
  function gossipCard(b) {
    const chips = (b.tag || []).map(t => `<span class="chip">${esc(t)}</span>`).join("");
    const risk = b.risk ? `<span class="chip ${b.risk === "high" ? "red" : b.risk === "mid" ? "gold" : ""}">风险 ${esc(b.risk)}</span>` : "";
    const cat = b.cat ? `<span class="chip blue">${esc(CATCN[b.cat] || b.cat)}</span>` : "";
    return `<div class="panel flat gossip-card">
      <div class="between" style="align-items:flex-start;gap:10px">
        <div class="row wrap" style="gap:6px">
          <span class="chip gold">${esc(guestName(b))}</span>
          <span class="chip">${esc(b.season || (b.year ? "第 " + b.year + " 年" : ""))}</span>${cat}${chips}
        </div>
        ${risk}
      </div>
      <div style="font-size:13px;line-height:1.7;margin-top:5px">${esc(b.text || "")}</div>
    </div>`;
  }
  /* 黑料档案：20 条一页，可按人/队/年/标签筛，懒得筛也能翻 */
  function gossipHTML() {
    const all = gossipAll(), list = gossipFiltered();
    const pg = pagerHTML(list.length, bPage, 20, "codex-bpage");
    bPage = pg.page;
    const rows = list.slice(bPage * 20, bPage * 20 + 20);
    const seasons = Array.from(new Set(all.map(b => b.season).filter(Boolean))).sort((a, b) => String(b).localeCompare(String(a)));
    const tags = Array.from(new Set(all.reduce((a, b) => a.concat(b.tag || []), []))).filter(Boolean);
    const opt = (sel, v, label) => `<option value="${esc(v)}"${sel === String(v) ? " selected" : ""}>${esc(label || v)}</option>`;
    return `<div class="row wrap" style="gap:6px;margin-bottom:8px">
        <button class="chip ${bfCat === "all" ? "gold" : ""}" data-act="codex-cat" data-v="all">全部</button>
        ${Object.keys(CATCN).map(k => `<button class="chip ${bfCat === k ? "gold" : ""}" data-act="codex-cat" data-v="${k}">${CATCN[k]}</button>`).join("")}
      </div>
      <div class="row wrap" style="gap:6px;margin-bottom:12px;align-items:center">
        <span class="small-note">年份</span>
        <select id="cf-season" class="input" style="width:auto;flex:0 0 auto;padding:6px 8px"><option value="all"${bfSeason === "all" ? " selected" : ""}>全部</option>${seasons.map(x => opt(bfSeason, x)).join("")}</select>
        <span class="small-note">标签</span>
        <select id="cf-tag" class="input" style="width:auto;flex:0 0 auto;max-width:160px;padding:6px 8px"><option value="all"${bfTag === "all" ? " selected" : ""}>全部</option>${tags.map(x => opt(bfTag, x)).join("")}</select>
        <button class="btn small" data-act="codex-filter">筛选</button>
        ${(bfCat !== "all" || bfSeason !== "all" || bfTag !== "all") ? `<button class="btn small ghost" data-act="codex-filter-reset">清空条件</button>` : ""}
      </div>
      <div style="display:grid;gap:6px">${rows.map(gossipCard).join("") || `<div class="small-note">没有对上号的。换个条件。</div>`}</div>
      ${pg.html}`;
  }
  function fillLine(t) {
    const S = (window.GAME && window.GAME.getState && window.GAME.getState()) || {};
    const team = displayName(S.teamId) || S.teamName || "你的队";
    return String(t == null ? "" : (typeof t === "string" ? t : (t.text || t.title || "")))
      .replace(/\{opp\}/g, "对面").replace(/\{name\}/g, S.name || "你")
      .replace(/\{team\}/g, team).replace(/\{pos\}/g, POSCN[S.pos] || "选手")
      .replace(/#\{/g, "#").replace(/\}#/g, "#");
  }
  function trashHTML() {
    const T = window.DATA_TRASH || {};
    const groups = [["win", "赢了之后"], ["lose", "输了之后"], ["teammate", "队内嘴"], ["fan", "粉丝发言"]];
    const box = (label, arr) => (arr || []).length ? `<h3 style="margin:16px 0 8px">${label} <span class="small-note">${arr.length} 条</span></h3>
      <div style="display:grid;gap:6px">${arr.map(t => `<div class="panel flat"><div style="font-size:13px;line-height:1.7">${esc(fillLine(t))}</div></div>`).join("")}</div>` : "";
    return `<div class="row wrap" style="gap:6px;margin-bottom:8px">
      <button class="chip ${memeSub === "memes" ? "gold" : ""}" data-act="codex-memesub" data-v="memes">梗百科</button>
      <button class="chip ${memeSub === "gossip" ? "gold" : ""}" data-act="codex-memesub" data-v="gossip">黑料档案</button>
      <button class="chip ${memeSub === "trash" ? "gold" : ""}" data-act="codex-memesub" data-v="trash">抗压背锅吧</button>
      <button class="chip ${memeSub === "hot" ? "gold" : ""}" data-act="codex-memesub" data-v="hot">热搜话题</button>
    </div>
    <p class="small-note">贴吧和微博那套话，看看就行。掉下去的时候他们会用同样的句式说你。</p>
    ${groups.map(g => box(g[1], T[g[0]])).join("")}`;
  }
  function hotHTML() {
    const H = window.DATA_HOT || {};
    const groups = [["win", "赢了之后"], ["lose", "输了之后"], ["drama", "节奏"], ["hupu", "虎扑热帖"]];
    const box = (label, arr) => (arr || []).length ? `<h3 style="margin:16px 0 8px">${label} <span class="small-note">${arr.length} 条</span></h3>
      <div style="display:grid;gap:6px">${arr.map(t => `<div class="panel flat"><div style="font-size:13px;line-height:1.7">${esc(fillLine(t))}</div></div>`).join("")}</div>` : "";
    return `<div class="row wrap" style="gap:6px;margin-bottom:8px">
      <button class="chip ${memeSub === "memes" ? "gold" : ""}" data-act="codex-memesub" data-v="memes">梗百科</button>
      <button class="chip ${memeSub === "gossip" ? "gold" : ""}" data-act="codex-memesub" data-v="gossip">黑料档案</button>
      <button class="chip ${memeSub === "trash" ? "gold" : ""}" data-act="codex-memesub" data-v="trash">抗压背锅吧</button>
      <button class="chip ${memeSub === "hot" ? "gold" : ""}" data-act="codex-memesub" data-v="hot">热搜话题</button>
    </div>
    <p class="small-note">赢的时候这些是赞美，输的时候同一个号换个主谓宾再发一遍。</p>
    ${groups.map(g => box(g[1], H[g[0]])).join("")}`;
  }
  function memesHTML() {
    const subs = `<div class="row wrap" style="gap:6px;margin-bottom:10px">
      <button class="chip ${memeSub === "memes" ? "gold" : ""}" data-act="codex-memesub" data-v="memes">梗百科</button>
      <button class="chip ${memeSub === "gossip" ? "gold" : ""}" data-act="codex-memesub" data-v="gossip">黑料档案</button>
      <button class="chip ${memeSub === "trash" ? "gold" : ""}" data-act="codex-memesub" data-v="trash">抗压背锅吧</button>
      <button class="chip ${memeSub === "hot" ? "gold" : ""}" data-act="codex-memesub" data-v="hot">热搜话题</button>
    </div>`;
    if (memeSub === "gossip") return subs + gossipHTML();
    if (memeSub === "trash") return trashHTML();
    if (memeSub === "hot") return hotHTML();
    const MS = (window.DATA_MEME_EVENTS || []).concat(window.DATA_EVENTS_LPL || []).filter(codexHit);
    const body = MS.map(m => {
      const srcChip = m.srcType === "real" ? `<span class="chip gold">真事改编</span>` : `<span class="chip">二创</span>`;
      const opts = (m.opts || []).map((o, i) => `<div class="note-line" style="margin-top:6px"><b>${i + 1}. ${esc(o.t || "")}</b>${o.eff && Object.keys(o.eff).length ? `<span class="dim"> · ${esc(effCN(o.eff))}</span>` : ""}${o.res ? `<div class="src-note">${esc(o.res)}</div>` : ""}</div>`).join("");
      return `<div class="panel flat meme-card">
        <div class="between" style="align-items:flex-start;gap:10px">
          <div class="row wrap" style="gap:6px">
            ${m.who ? `<span class="chip blue">${esc(m.who)}</span>` : ""}
            <span class="chip">${esc(m.yearLabel || (m.year ? "第 " + m.year + " 年" : "历史"))}</span>${m.cat ? `<span class="chip">${esc(m.cat)}</span>` : ""}
          </div>${srcChip}
        </div>
        <div style="font-size:13px;line-height:1.75;margin-top:6px">${esc(m.text || "")}</div>
        ${m.quote ? `<div class="src-quote">「${esc(m.quote)}」</div>` : ""}
        ${m.source ? `<div class="src-note">来源：${esc(m.source)}</div>` : ""}
        ${m.ctx ? `<div class="src-note">${esc(m.ctx)}</div>` : ""}
        <div style="margin-top:6px">${opts}</div>
      </div>`;
    }).join("");
    return subs + `<div style="display:grid;gap:8px">${body || `<div class="small-note">搜不到这条梗。</div>`}</div>
      <p class="small-note" style="margin-top:12px">梗是人编的，年份可能记错，当事人也可能根本没说过。当真你就输了。</p>`;
  }
  function cardsHTML() {
    const TAL = window.DATA_TALENTS || [], MGR = window.DATA_MGR || {};
    const subs = [["talents", "天赋 " + TAL.length], ["tactics", "经理战术 " + (MGR.tactics || []).length], ["players", "选手卡 " + (MGR.cards || []).length]];
    const chips = `<div class="row wrap" style="gap:6px;margin-bottom:10px">
      ${subs.map(x => `<button class="chip ${cardSub === x[0] ? "gold" : ""}" data-act="codex-cardsub" data-v="${x[0]}">${x[1]}</button>`).join("")}
    </div>`;
    const S0 = (window.GAME && window.GAME.getState && window.GAME.getState()) || {};
    const seen = {};
    (S0.bag || []).concat(S0.talents || []).forEach(id => { seen[id] = true; });
    let list = cardSub === "tactics" ? (MGR.tactics || []) : cardSub === "players" ? (MGR.cards || []) : TAL;
    const q = codexQ.toLowerCase();
    list = list.filter(x => !q || JSON.stringify(x).toLowerCase().indexOf(q) >= 0);
    const pg = pagerHTML(list.length, cardPage, 30, "codex-cpage");
    cardPage = pg.page;
    const rows = list.slice(cardPage * 30, cardPage * 30 + 30);
    const effMgr = eff => Object.keys(eff || {}).map(k => (MGR_EFFCN[k] || k) + ((typeof eff[k] === "number" && eff[k] > 0) ? "+" + eff[k] : (typeof eff[k] === "number" ? eff[k] : ""))).join(" · ");
    const body = rows.map(x => {
      if (cardSub === "tactics") {
        return `<div class="panel flat card-row">
          <div class="between"><b>${esc(x.name || "")}</b><span class="row wrap" style="gap:5px"><span class="chip">${esc(x.dim || "")}</span><span class="chip gold">${esc(x.rarity || "")}</span></span></div>
          <div class="small-note" style="margin-top:4px">${esc(x.desc || "")}</div>
          <div class="small-note" style="color:var(--gold);margin-top:3px">${esc(effMgr(x.eff))}</div>
        </div>`;
      }
      if (cardSub === "players") {
        const st = x.st || {};
        const kk = ["LANE", "MECH", "GAME", "POOL"].map(k => `${STATCN(k)} ${esc(st[k] == null ? "?" : Math.round(st[k]))}`).join(" · ");
        return `<div class="panel flat card-row">
          <div class="between"><b>${esc(x.name || "")}</b><span class="row wrap" style="gap:5px"><span class="chip gold">${esc(x.year || "")}</span><span class="chip">${esc(POSCN[x.pos] || x.pos || "")}</span><span class="chip">OVR ${esc(x.ovr == null ? "" : x.ovr)}</span></span></div>
          <div class="small-note" style="margin-top:3px">${esc(x.cn || "")}${x.team ? " · " + esc(displayName(x.team) || x.team) : ""}${x.trait ? " · " + esc(x.trait) : ""}</div>
          <div class="small-note mono" style="margin-top:3px">${kk}</div>
          <div class="row wrap" style="gap:5px;margin-top:4px">${(x.tags || []).map(t => `<span class="chip">${esc(t)}</span>`).join("")}</div>
        </div>`;
      }
      const got = seen[x.id];
      return `<div class="panel flat card-row${got ? "" : " is-unknown"}">
        <div class="between"><b>${esc(x.name || "")}</b><span class="row wrap" style="gap:5px">
          <span class="chip gold">${esc(x.rarity || "")}</span>${x.build ? `<span class="chip blue">${esc(BUILDN(x.build) || x.build)}</span>` : ""}
          ${got ? `<span class="chip gold">已获得</span>` : `<span class="chip dark">未获得</span>`}
        </span></div>
        <div class="small-note" style="margin-top:4px">${esc(x.desc || "")}</div>
        <div class="small-note" style="color:var(--gold);margin-top:3px">${esc(effCN(x.eff || {}))}</div>
        ${srcLine(x.src, "mini")}
      </div>`;
    }).join("");
    const hint = cardSub === "talents"
      ? `天赋卡 ${TAL.length} 张，你已经拿到 ${Math.min(TAL.length, Object.keys(seen).length)} 张。没拿到的也给你摆出来，看着长大的。`
      : cardSub === "tactics" ? `经理模式里能点出来的战术，一共 ${(MGR.tactics || []).length} 套。` : `经理模式的选手卡，${(MGR.cards || []).length} 张，按年份和位置翻。`;
    return chips + `<p class="small-note">${hint}</p>
      <div style="display:grid;gap:7px;margin-top:8px">${body || `<div class="small-note">这页没搜到。清空搜索再试。</div>`}</div>
      ${pg.html}`;
  }
  /* 图鉴：战队 / 选手名单拼装，数据表缺哪块就少哪块 */
  function objArr(x) {
    if (Array.isArray(x)) return x;
    if (!x || typeof x !== "object") return [];
    return Object.keys(x).map(k => { const v = x[k] && typeof x[k] === "object" ? x[k] : { name: String(x[k] || k) }; return Object.assign({ id: v.id || k }, v); });
  }
  function codexTeamList() {
    const seen = {}, out = [];
    const add = t => { if (!t) return; const id = t.id || t.teamId || t.name; if (!id || seen[id]) return; seen[id] = 1; out.push(t); };
    objArr(window.DATA_TEAMS).forEach(add);
    objArr(window.DATA_TEAMS_EXTRA).forEach(add);
    objArr((window.DATA_LCK || {}).teams).forEach(add);
    objArr((window.DATA_CHRONICLE || {}).teams).forEach(add);
    return out;
  }
  function codexPlayerList() {
    const seen = {}, out = [];
    const add = p => { if (!p) return; const id = p.id || p.pid || p.name; if (!id || seen[id]) return; seen[id] = 1; out.push(p); };
    objArr(window.DATA_PLAYERS).forEach(add);
    objArr(window.DATA_LCK || []).forEach(add);
    objArr((window.DATA_LCK || {}).players).forEach(add);
    objArr(window.DATA_PLAYERS_INTL || []).forEach(add);
    objArr((window.DATA_CHRONICLE || {}).players).forEach(add);
    return out;
  }
  /* 战队所属赛区：LCK 队标 LCK，欧美按 team id 前缀分 LEC/LCS */
  function teamRegion(t) {
    if (!t) return "";
    const r = t.region || t.league || "";
    if (r) return String(r).toUpperCase().indexOf("LCK") >= 0 ? "LCK" : r;
    const id = String(t.id || t.team || "");
    if (/^t_(lck|t1|gen|geng)/.test(id) || (window.DATA_LCK && (window.DATA_LCK.teams || []).some(x => x && x.id === id))) return "LCK";
    if (/^t_(g2|fnc|mad|lec)/.test(id)) return "LEC";
    if (/^t_(lcs|tl|c9|100|na)/.test(id)) return "LCS";
    return "";
  }

  function renderCodex() {
    const total = {
      ev: (window.DATA_EVENTS || []).length + (window.DATA_MEME_EVENTS || []).length + (window.DATA_ENDLESS_EVENTS || []).length + (window.DATA_EVENTS_POS || []).length
        + (window.DATA_EVENTS_EXTRA || []).length + (window.DATA_STORY_EVENTS || []).length + (window.DATA_EVENTS_V3 || []).length
        + (window.DATA_EVENTS_LPL || []).length
        + (window.DATA_LCK_EVENTS || []).length,
      tal: (window.DATA_TALENTS || []).length + (window.DATA_TALENTS_V4 || []).length, hero: (window.DATA_HEROES || []).length,
      team: (window.DATA_TEAMS ? Object.keys(window.DATA_TEAMS).length : 0) + (window.DATA_TEAMS_EXTRA ? Object.keys(window.DATA_TEAMS_EXTRA).length : 0) + ((window.DATA_LCK && window.DATA_LCK.teams) ? window.DATA_LCK.teams.length : 0),
      pl: (window.DATA_PLAYERS ? Object.keys(window.DATA_PLAYERS).length : 0) + ((window.DATA_LCK && window.DATA_LCK.players) ? window.DATA_LCK.players.length : 0) + ((window.DATA_PLAYERS_INTL || []).length),
      black: ((window.DATA_GOSSIP || {}).black || []).length
    };
    const ch = window.DATA_CHRONICLE || {};
    const TABS = [["update", "更新"], ["memes", "梗百科"], ["cards", "卡牌图鉴"], ["achv", "成就"], ["mates", "关系"], ["worlds", "世界赛"], ["msi", "MSI"], ["lpl", "LPL"], ["timeline", "时间线"], ["hl", "名场面"], ["teams", "战队"], ["players", "选手"]];
    const mgrN = (window.DATA_MGR || {});
    const totalMgr = { tac: (mgrN.tactics || []).length, card: (mgrN.cards || []).length };
    let body = "";
    if (codexTab === "update") {
      const CL = window.DATA_CHANGELOG || [];
      body = CL.map((u, i) => `<div class="upd-item${i === 0 ? " now" : ""}">
        <span class="upd-dot"></span>
        <div class="upd-c">
          <div class="upd-h"><b>${esc(u.v)}</b><span class="mono dim">${esc(u.date || "")}</span>${u.tag ? `<span class="chip gold">${esc(u.tag)}</span>` : ""}</div>
          <div class="upd-t">${esc(u.title || "")}</div>
          <ul class="upd-l">${(u.items || []).map(x => `<li>${esc(x)}</li>`).join("")}</ul>
        </div>
      </div>`).join("");
      if (!body) body = `<div class="small-note">还没有更新记录。</div>`;
      body = `<div class="upd">${body}</div>`;
    } else if (codexTab === "memes") {
      body = memesHTML();
    } else if (codexTab === "cards") {
      body = cardsHTML();
    } else if (codexTab === "achv") {
      body = achvHTML();
    } else if (codexTab === "mates") {
      body = matesHTML();
    } else if (codexTab === "worlds") {
      body = (ch.worlds || []).filter(codexHit).map(w => codexRow(w.year, w.champion, "亚军 " + (w.runner || "?") + (w.city ? " · " + w.city : ""), (w.story || "") + (w.lpl ? " ｜LPL：" + w.lpl : ""), A.archiveArt(w.year))).join("");
    } else if (codexTab === "msi") {
      body = (ch.msi || []).filter(codexHit).map(m => codexRow(m.year, m.champion, "亚军 " + (m.runner || "?"), m.story || "", A.archiveArt(m.year))).join("");
    } else if (codexTab === "lpl") {
      body = (ch.lpl || []).filter(codexHit).map(x => codexRow(x.year + " " + (x.split || ""), x.champion, "亚军 " + (x.runner || "?"), x.story || "", A.archiveArt(x.year))).join("");
    } else if (codexTab === "timeline") {
      body = (ch.timeline || []).filter(codexHit).map(t => codexRow(t.year || t.date || "", t.t || t.title || "", displayName(t.who) || "", t.text || t.desc || "", A.archiveArt(t.year))).join("");
    } else if (codexTab === "hl") {
      const hs = ((G.getState() || {}).highlights || []).slice().reverse();
      body = hs.filter(codexHit).map(h => codexRow(h.event || "", h.hero || "", (HL_KIND[h.kind] || h.kind || "") + " " + (h.score || ""), h.text || "")).join("");
    } else if (codexTab === "teams") {
      const arr = codexTeamList().filter(codexHit);
      const pg = codexPaged(arr, 20, "codex-tpage");
      body = pg.rows.map(t => codexRow(rowName(t), teamRegion(t), (t.titles || []).length ? (t.titles || []).length + " 冠" : "", t.story || t.desc || t.note || "")).join("") + pg.page;
    } else {
      const arr = codexPlayerList().filter(codexHit);
      const pg = codexPaged(arr, 20, "codex-ppage");
      body = pg.rows.map(p => {
        const tr = Array.isArray(p.trait) ? p.trait : (p.traitArr || (p.trait ? [p.trait] : []));
        const meta = displayName(p.team) || p.teamName || p.team || p.region || "";
        return codexRow(rowName(p), meta, p.peak ? "巅峰 " + p.peak : (p.ovr ? "OVR " + p.ovr : ""), (p.moments || []).map(m => (m.year ? m.year + " " : "") + (m.event || "") + "：" + (m.text || "")).join(" ｜ ") || tr.join(" / ") || p.story || "");
      }).join("") + pg.page;
    }
    if (!body) body = `<div class="small-note" style="padding:12px 0">这里没有你要找的。换个词试试。</div>`;
    const freeForm = codexTab === "memes" || codexTab === "cards" || codexTab === "achv" || codexTab === "mates";
    /* 黑料档案：只给有证据的公开争议，20 条一页，按人/队/年/标签筛 */
    const S0 = G.getState();
    return `<div class="fade-in">
      <div class="between" style="margin-bottom:14px">
        <div><div class="kicker">ARCHIVE</div><h2>档案室</h2></div>
        <button class="btn small ghost" data-act="tab" data-v="main">返回</button>
      </div>
      <div class="panel">
        <div class="upd-banner">
          <div><div class="kicker">UPDATE</div><h3 style="margin:2px 0 4px">更新公告 · ${esc((window.DATA_CHANGELOG && window.DATA_CHANGELOG[0] && window.DATA_CHANGELOG[0].v) || "v3.4")}</h3>
          <p class="small-note" style="margin:0">最近一次更新：${esc((window.DATA_CHANGELOG && window.DATA_CHANGELOG[0] && window.DATA_CHANGELOG[0].title) || "")}。点下面的「更新」看完整时间线。</p></div>
          <button class="btn small" data-act="codex-tab" data-v="update" style="width:auto">看更新记录</button>
        </div>
        <div class="divider"></div>
        <h3>一局怎么过</h3>
        <p class="story">2025 年 1 月进队，第 1 年打 LDL，第 2、3 年打 LPL。每个月：版本更新 → 一次行动（练英雄 / 加练 / 复盘 / 排位 / 开播 / 休息 / 健身 / 逛商店 / 卡组 / 抽卡）→ 一次随机事件 → 当月的比赛（情报 → BP → 局内抉择 → 逐局结算）→ 抽卡与商店。三年之约第 36 个月收工。</p>
        <div class="divider"></div>
        <h3>赛制（写实）</h3>
        <p class="story">LDL 与 LPL 都分三个赛段：常规赛（积分榜，别的队也一起打）+ 季后赛（BO5）。第一赛段前二 → 先锋赛；第二赛段前二 → MSI；第三赛段前四 → 全球总决赛。世界赛 16 队瑞士轮，三胜出线、三负回家，3-0 直接进八强，然后八强、四强、决赛全是 BO5。十一月全明星，十二月转会窗。</p>
        <div class="divider"></div>
        <h3>怎么赢</h3>
        <p class="story">比赛不是纯数值对撞。BP 里你 ban 什么、拿哪个英雄（熟练度、本命加成、英雄克制）、选哪套战术，都会改变每条维度的强弱；局内每个抉择都会显示成功率，成败直接加/扣局势值；一把里还能赌一次资源（战术暂停 / 透支 / 喊话）。数据落后照样能爆冷，数据领先也可能被翻。</p>
        <div class="divider"></div>
        <h3>编年史 · 检索</h3>
        <div class="row wrap" style="gap:6px;margin-bottom:10px">
          ${TABS.map(t => `<button class="chip ${codexTab === t[0] ? "gold" : ""}" data-act="codex-tab" data-v="${t[0]}" style="cursor:pointer">${t[1]}</button>`).join("")}
        </div>
        <div class="row" style="gap:8px;margin-bottom:10px">
          <input id="codexQ" class="input" style="flex:1" placeholder="搜人、搜队、搜年份、搜梗…" value="${esc(codexQ)}">
          <button class="btn small" data-act="codex-go" style="width:auto">搜</button>
          ${codexQ ? `<button class="btn small ghost" data-act="codex-clear" style="width:auto">清空</button>` : ""}
        </div>
        <div class="${freeForm ? "codex-body" : "chron"}">${body}</div>
        <div class="divider"></div>
        <h3>黑料档案</h3>
        <p class="story">赛场上能查的都在上面。赛场外的这些东西，真伪自己判断，别当真。${S0 && S0.story && S0.story.corrupt >= 20 ? "\n\n你自己身上也有几条了。有些东西一旦写下来就删不掉。" : ""}</p>
        ${gossipHTML()}
        <div class="divider"></div>
        <h3>数据量</h3>
        <p class="story">事件 ${total.ev} 条 · 天赋卡 ${total.tal} 张 · 经理战术 ${totalMgr.tac} 套 · 选手卡 ${totalMgr.card} 张 · 英雄 ${total.hero} 个 · 战队 ${total.team} 支 · 选手 ${total.pl} 名 · 黑料 ${total.black} 条。
        编年史写到 2026（Worlds 2011–2025、MSI 2015–2026、LPL 2015–2026），2026 世界赛按当前进度记录，尚未结束的部分仍由游戏内推演。</p>
      </div>
    </div>`;
  }

  /* ---------- 建档 ---------- */
  function bar2(v, max) {
    return `<span class="bar" style="width:100%"><i style="width:${Math.max(0, Math.min(100, (v / (max || 100)) * 100))}%"></i></span>`;
  }

  function renderName() {
    return shell(`<div class="fade-in">
      <div class="kicker">CREATE · 01</div>
      <h1 style="margin:8px 0 6px">起个 ID</h1>
      <p class="dim">它会被解说喊出来，会被弹幕打在公屏上，也会被写进赛后标题。</p>
      <div class="panel" style="margin-top:18px">
        <input id="nameInput" maxlength="12" placeholder="比如：SHY、Knight、Zeka……" value=""
          style="width:100%;background:#0a0f15;border:1px solid var(--line-2);color:var(--ink);font-family:var(--mono);font-size:24px;letter-spacing:.14em;padding:13px 15px;border-radius:10px;outline:none">
        <div class="between" style="margin-top:14px">
          <div class="small-note">最多 12 个字符。不填就当你叫「无名」。</div>
          <button class="btn primary small" data-act="name-ok">就用这个 ID</button>
        </div>
      </div>
    </div>`, { solo: true });
  }

  function statRows(st, hi) {
    return G.STATS.map(k => {
      const v = Math.round(st[k]);
      const isHi = hi && hi.indexOf(k) >= 0;
      return `<span>${G.CN[k]}</span><b class="${isHi ? "hi" : ""}">${v}</b>`;
    }).join("");
  }

  function renderBase(s) {
    return shell(`<div class="fade-in">
      <div class="kicker">CREATE · 02</div>
      <h1 style="margin:8px 0 6px">三选一：你的底子</h1>
      <p class="dim">出生属性决定你前期怎么活。三个模板是随机的，不满意可以重掷——代价是一项属性 −5。</p>
      <div class="base-grid" style="margin-top:18px">
        ${s.bases.map((x, i) => {
          const top = Object.keys(x.st).sort((a, b) => x.st[b] - x.st[a]).slice(0, 2);
          const low = Object.keys(x.st).sort((a, b) => x.st[a] - x.st[b]).slice(0, 1);
          return `<div class="base-card" data-act="pick" data-i="${i}">
            <div class="tag">${esc(x.b.tag)}</div>
            <h3>${esc(x.b.name)}</h3>
            <p>${esc(x.b.desc)}</p>
            <div class="mini-stats">${statRows(x.st, top.concat(low))}</div>
            <div class="row" style="margin-top:10px;gap:6px;flex-wrap:wrap">
              <span class="chip gold">${esc(x.b.trait)}</span>
              <span class="chip red">隐藏：${esc(x.b.hidden)}</span>
            </div>
          </div>`;
        }).join("")}
      </div>
      ${s.canReroll ? `<div class="center" style="margin-top:16px"><button class="btn small ghost" style="width:auto" data-act="reroll">重掷一次（随机一项属性 −5）</button></div>` : `<div class="center small-note" style="margin-top:16px">已经重掷过了，认命吧。</div>`}
    </div>`, { solo: true });
  }

  function renderPos() {
    const desc = {
      TOP: "上路一条线，赢了叫压制，输了叫送。", JUG: "全队的节拍器，节奏好是爹，节奏差是罪人。",
      MID: "地图中心，最容易被记住也最容易被换掉的位置。", BOT: "后期核心，三件套之前你是队友的负担。",
      SUP: "没有补刀，没有高光，但赢不赢常常看你。"
    };
    return shell(`<div class="fade-in">
      <div class="kicker">CREATE · 03</div>
      <h1 style="margin:8px 0 6px">你打哪路</h1>
      <p class="dim">位置决定 OVR 权重、事件池、对局情境和以后的英雄池。</p>
      <div class="pos-grid" style="margin-top:18px">
        ${["TOP", "JUG", "MID", "BOT", "SUP"].map(p => `<div class="pos-card" data-act="choose" data-v="${p}">
          <div class="ico">${A.posIcon(p, 44)}</div>
          <div class="nm">${POSCN[p]}</div>
          <div class="ds">${desc[p]}</div>
        </div>`).join("")}
      </div>
    </div>`, { solo: true });
  }

  function renderPool(s) {
    return shell(`<div class="fade-in">
      <div class="kicker">CREATE · 04</div>
      <h1 style="margin:8px 0 6px">开局英雄池</h1>
      <p class="dim">三组随机的英雄池，每组一个绝活（76–84 熟练度）+ 两个常用。标签是打法克制关系：进对局以后，被克制的一方每条判定都更难受。</p>
      <div class="base-grid" style="margin-top:18px">
        ${s.groups.map((g, i) => `<div class="pool-group" data-act="pick" data-i="${i}">
          <div class="tag" style="font-family:var(--mono);font-size:11px;color:var(--gold);letter-spacing:.14em">组合 ${i + 1}</div>
          ${g.map(x => `<div class="hero-row">
            ${A.champIcon(x.h.n, 26)}
            <span class="nm">${esc(x.h.n)} <span class="dim" style="font-size:11px">${esc(x.h.en || "")}</span></span>
            <span class="hrow-tags">${(x.h.tag || []).slice(0, 2).map(t => `<span class="chip">${esc(t)}</span>`).join("")}</span>
            <span class="pf ${x.prof < 70 ? "low" : ""}">${x.prof}</span>
          </div>`).join("")}
        </div>`).join("")}
      </div>
    </div>`, { solo: true });
  }

  function renderOrigin(s) {
    return shell(`<div class="fade-in">
      <div class="kicker">CREATE · 05</div>
      <h1 style="margin:8px 0 6px">你从哪来</h1>
      <p class="dim">这决定你进 LDL 时的初始资源、教练信任和一点属性。</p>
      <div class="base-grid" style="margin-top:18px;grid-template-columns:repeat(2,1fr)">
        ${s.origins.map((o, i) => `<div class="base-card" data-act="pick" data-i="${i}">
          <h3>${esc(o.name)}</h3>
          <p>${esc(o.desc)}</p>
          <div class="mini-stats">
            ${Object.keys(o.st).map(k => `<span>${G.CN[k]}</span><b class="${o.st[k] > 0 ? "hi" : ""}">${o.st[k] > 0 ? "+" : ""}${o.st[k]}</b>`).join("")}
            <span>签约金</span><b>${o.money} 万</b>
            <span>教练信任</span><b>${o.coach > 0 ? "+" : ""}${o.coach}</b>
          </div>
        </div>`).join("")}
      </div>
    </div>`, { solo: true });
  }

  function renderCard() {
    const S = G.getState();
    const t = G.teamOf(S.teamId);
    const ovr = G.myOvr();
    return shell(`<div class="fade-in">
      <div class="kicker">CREATE · 06</div>
      <h1 style="margin:8px 0 6px">选手卡</h1>
      <div class="panel" style="margin-top:18px">
        <div class="id-card">
          <div class="left">
            ${A.avatar(S.name + S.pos, "#e8b923", 150)}
            <div class="big-name">${esc(S.name)}</div>
            <div class="pos-label">${POSCN[S.pos]} · ${esc(t ? t.name : "")}</div>
            <div style="margin-top:12px;font-family:var(--mono);font-size:30px;color:var(--gold-2)" class="glow-gold">OVR ${ovr}</div>
            <div class="small-note">潜力上限：未知（打完才知道）</div>
          </div>
          <div class="radar-box" style="margin:0">${A.radar(S.st, 260)}</div>
        </div>
        <div class="divider"></div>
        <div class="row wrap" style="gap:8px">
          ${(S.traits || []).map(x => `<span class="chip gold">${esc(x.name)}</span>`).join("")}
          <span class="chip red">隐藏：${esc(S.hidden || "")}</span>
          <span class="chip blue">成长：${{ early: "早熟", normal: "平稳", late: "大器晚成" }[S.growthType]}</span>
          <span class="chip">天赋槽 ${S.slots}</span>
        </div>
        <div class="divider"></div>
        <div class="row wrap" style="gap:8px">
          ${(S.champs || []).map(c => `<span class="chip ${c.main ? "gold" : ""}">${esc(c.n)} ${c.prof}</span>`).join("")}
        </div>
        <div class="between" style="margin-top:18px">
          <div class="small-note">合同一年：年薪 ${S.salary} 万，按月发 ${Math.round(S.salary / 12 * 10) / 10} 万。LDL 月薪三千，梦想无价。</div>
          <button class="btn primary small" data-act="choose" data-i="0">开始职业生涯</button>
        </div>
      </div>
    </div>`, { solo: true });
  }

  /* ---------- 月度行动 ---------- */
  function renderAction(s) {
    const S = G.getState();
    const ml = s.ml || s.month || G.monthLabel(S.tick);
    const acts = dedupeByLabel(s.acts || []);
    const frees = dedupeByLabel(s.frees || []);
    const used = s.actionUsed === true;
    const isNew = s.actionUsed != null || acts.some(a => a && (a.id || a.energyCost != null || a.used != null || a.can === false));
    const cnt = used ? "1/1" : "0/1";
    const subline = used ? "已用，进入赛程" : "一个月只做一件事，点完就进赛程";

    const actRows = acts.map((a, i) => {
      /* 条件不满足：engine 给 can:false，旧引擎可能只给 reason，两种都按灰态处理 */
      const blocked = a.can === false || (a.can == null && !!a.reason);
      const isUsed = used || a.used === true;
      const cls = isUsed ? " is-used" : (blocked ? " is-off" : "");
      const vAttr = (isNew && a.id) ? ` data-v="${esc(a.id)}"` : "";
      const lock = blocked && !isUsed ? " disabled" : "";
      const ec = typeof a.energyCost === "number" ? a.energyCost : null;
      const gainM = /\+(\d+)/.exec(a.cost || "");
      const delta = ec == null ? 0 : (ec > 0 ? ec : (ec === 0 && gainM ? -Number(gainM[1]) : 0));
      const costTxt = ec != null ? (ec > 0 ? "精力 −" + ec : (a.cost || "精力 ±0")) : (a.cost || "");
      const prev = delta ? energyPreview(delta) : "";
      const forecast = a.preview ? `<span class="tagline" style="color:var(--dim)">${esc(a.preview)}</span>` : "";
      const chip = isUsed
        ? `<span class="chip dark">已用，进入赛程</span>`
        : `<span class="chip gold">${esc(a.tag || "")}</span>`;
      const why = blocked && a.reason ? `<span class="act-why">${esc(a.reason)}</span>` : "";
      return `<div class="opt${blocked ? " dim" : ""}">
        <span class="idx">${i + 1}</span>
        <button class="btn act-btn${cls}" data-act="choose" data-i="${i}"${vAttr}${lock}>
          ${esc(a.label)} ${chip}
          <span class="tagline">${esc(a.desc || "")}</span>
          ${prev ? `<span class="tagline mono">${prev}</span>` : ""}
          ${forecast}
          ${why}
        </button>
        <span class="cost" style="padding-top:12px">${esc(costTxt)}</span>
      </div>`;
    }).join("");

    const freeRows = frees.map((f, i) => {
      const id = f.id || f.key || "";
      const blocked = f.can === false || (f.can == null && !!f.reason);
      const usedFree = f.used === true || (!isNew && id === "shop" && S.shopDone);
      const vv = isNew ? (id || "free") : "free";
      const lock = (blocked || usedFree) ? " disabled" : "";
      const energyChip = f.energyCost != null && f.energyCost > 0
        ? `<span class="chip">耗精力 −${f.energyCost}，不占行动</span>`
        : (/练英雄|定打法/.test(f.label || "") ? `<span class="chip">耗精力，不占行动</span>` : "");
      const onceChip = usedFree
        ? `<span class="chip dark">本月已用</span>`
        : (isNew && id === "shop" ? `<span class="chip">本月一次</span>` : "");
      const why = blocked && f.reason ? `<span class="act-why">${esc(f.reason)}</span>` : "";
      return `<button class="btn small free-btn${usedFree ? " is-used" : ""}${blocked ? " is-off" : ""}" data-act="choose" data-i="${i}" data-v="${esc(vv)}"${lock}>
        ${esc(f.label)}${energyChip}${onceChip}<span class="small-note">${esc(f.note || f.desc || "")}</span>${why}
      </button>`;
    }).join("");

    return shell(`<div class="fade-in">${guideHTML(s)}
      ${autoOn() ? `<div class="auto-note">托管中：抽卡、商店这些不用你点，引擎自己处理。烦了就在设置里关掉。</div>` : ""}
      <div class="between act-head">
        <div>
          <div class="kicker">${ml.year} 年 ${ml.month} 月 · 月度行动</div>
          <h2 style="margin:5px 0 0">本月行动 · ${cnt}</h2>
        </div>
        <div class="small-note">${subline}</div>
      </div>
      <div class="opts" style="margin-top:16px;display:grid;gap:9px">
        ${actRows}
      </div>
      ${frees.length ? `<div class="free-zone">
        <div class="free-head"><span class="kicker">FREE · 不占行动</span><span class="small-note">不耗本月行动，点完还是这个月</span></div>
        <div class="free-row">${freeRows}</div>
      </div>` : ""}
      ${s.feedback && (s.feedback.lines || []).length ? `<div class="feedback-panel"><span class="kicker">上月采购到手</span>${s.feedback.lines.map(l => `<div class="note-line">· ${esc(l)}</div>`).join("")}</div>` : ""}
      ${used ? `<div class="row between" style="margin-top:16px;gap:10px">
        <div class="small-note">行动已经用掉了。继续走进赛程。</div>
        <button class="btn primary small" style="width:auto" data-act="choose" data-i="0" data-v="next">已用，进入赛程</button>
      </div>` : ""}
    </div>`);
  }

  /* ---------- 事件 ---------- */
  function renderEvent(s) {
    const ev = s.ev;
    return shell(`<div class="fade-in">
      <div class="between">
        <div class="scene-tag">场外 · ${esc(ev.cat || "")}</div>
        <div class="small-note">${esc((G.monthLabel(G.getState().tick) || {}).year)} 年</div>
      </div>
      <div class="panel" style="margin-top:12px">
        <div class="story">${br(ev.text)}</div>
        ${ev.sub ? `<p class="quote">${br(ev.sub)}</p>` : ""}
        <div class="opts" style="display:grid;gap:9px;margin-top:14px">
          ${ev.opts.map((o, i) => {
            const odds = riskOdds(o.risk);
            const risk = o.risk
              ? `<span class="chip ${odds && odds.pct >= 65 ? "green" : odds && odds.pct < 45 ? "red" : "blue"}">判定 ${esc((G.CN && G.CN[o.risk.stat]) || o.risk.stat || "属性")} · 难度 ${esc(o.risk.dc == null ? 12 : o.risk.dc)}${odds ? " · 约 " + odds.pct + "%" : ""}</span>`
              : "";
            const eff = effChipHTML(o.eff);
            const note = o.risk
              ? `<span class="tagline" style="color:var(--dim)">这一下不是稳的，按你现在的${odds ? esc(odds.stat) : "属性"}和心态，大概 ${odds ? odds.pct : "?"}% 能过；过了有额外好处，砸了要认。</span>`
              : (o.eff ? `<span class="tagline" style="color:var(--dim)">选完就按上面这些数结算，不玩文字游戏。</span>` : "");
            return `<div class="opt">
              <span class="idx">${i + 1}</span>
              <button class="btn" data-act="choose" data-i="${i}">${esc(o.t)}
                <span class="tagline">${eff} ${risk}</span>
                ${note}
              </button>
            </div>`;
          }).join("")}
        </div>
      </div>
    </div>`);
  }

  /* ---------- 结果 ---------- */
  function renderResult(s) {
    return shell(`<div class="panel result-${esc(s.tone || "info")} fade-in">
      <div class="scene-tag">${esc(s.title || "")}</div>
      <div class="story" style="margin-top:10px">${br(s.text)}</div>
      ${duoHTML(s)}
      <div class="between" style="margin-top:18px">
        <div class="small-note">${s.tone === "win" ? "赢了先别急着高兴，回去把这一把拆开看，下一场对面会照着这个打你。" : s.tone === "lose" ? "输了就输了，别在休息室坐着，回去把这一把拆开看，同一个错别再犯第二次。" : ""}</div>
        <button class="btn primary small" data-act="choose" data-i="0">继续</button>
      </div>
    </div>`);
  }

  /* ---------- 常规赛 ---------- */
  function renderMatchday(s) {
    return shell(`<div class="fade-in">
      <div class="between">
        <div><div class="kicker">${s.ml.year} 年 ${s.ml.month} 月 · ${esc(s.splitName || "常规赛")} · ${esc(s.teamName || "")}</div><h2 style="margin:5px 0 0">${s.w} 胜 ${s.l} 负</h2></div>
        <div style="text-align:right">
          <div class="scoreboard"><span class="sc win">${s.w}</span><span class="dim">:</span><span class="sc lose">${s.l}</span></div>
          <div class="small-note" style="margin-top:4px">赛季 ${s.reg.w} 胜 ${s.reg.l} 负 · 积分榜第 ${s.rank}</div>
        </div>
      </div>
      <div class="match-list" style="margin-top:14px">
        ${s.games.map(g => `<div class="match-row">
          <span class="res ${g.win ? "w" : "l"}">${g.win ? "胜" : "负"}</span>
          <span class="gr ${g.grade}">${g.grade}</span>
          <span class="opp">vs ${esc(g.opp)}</span>
          <span class="dim">${g.kda}</span>
          <span class="honor">${g.dmg}%</span>
        </div>`).join("")}
      </div>
      ${s.patch ? `<div class="panel flat" style="margin-top:12px"><span class="chip gold">版本</span> <span class="dim">${esc(typeof s.patch === "string" ? s.patch : patchVer(s.patch) + " · 环境 " + (s.patch.env || ""))}</span></div>` : ""}
      ${s.hot ? `<div class="panel flat" style="margin-top:10px"><span class="chip red">热搜</span> <span style="font-size:13px">${esc(s.hot)}</span></div>` : ""}
      ${trashLine((s.l || 0) > (s.w || 0) ? "lose" : "win") ? `<div class="panel flat" style="margin-top:10px"><span class="chip">论坛</span> <span style="font-size:13px" class="dim">${esc(trashLine((s.l || 0) > (s.w || 0) ? "lose" : "win"))}</span></div>` : ""}
      <div class="right" style="margin-top:18px;text-align:right"><button class="btn primary small" data-act="choose" data-i="0">过完这个月</button></div>
    </div>`);
  }

  /* ---------- 对局 ---------- */
  function renderDuel(s) {
    const d = s.duel, sit = d.sit;
    const S = G.getState();
    return shell(`<div class="fade-in">
      <div class="between">
        <div class="scene-tag">${esc(sit.t)} · 第 ${d.game} 局</div>
        <div class="row">
          <span class="chip ${s.useBurst ? "gold" : ""}">气势 ${Math.round(S.burst)}</span>
          <span class="chip blue">${esc(d.opp.name)}</span>
        </div>
      </div>
      <div class="series-dots" style="justify-content:flex-start;margin:12px 0">
        ${[0, 1, 2].map(i => `<i class="${i < d.wins ? "w" : ""}"></i>`).join("")}
        <span class="dim" style="font-family:var(--mono);font-size:11px;margin:0 4px">${d.wins}-${d.losses}</span>
        ${[0, 1, 2].map(i => `<i class="${i < d.losses ? "l" : ""}"></i>`).join("")}
      </div>
      <div class="panel">
        <div class="story">${br(sit.d)}</div>
        <div class="opts" style="display:grid;gap:9px;margin-top:14px">
          ${sit.opts.map((o, i) => `<div class="opt">
            <span class="idx">${i + 1}</span>
            <button class="btn" data-act="choose" data-i="${i}">${esc(o.t)}
              <span class="tagline"><span class="chip">${G.CN[o.stat] || o.stat} ${Math.round(S.st[o.stat])}</span> <span class="chip ${o.dc + (s.dcMod || 0) >= 14 ? "red" : "blue"}">难度 ${o.dc}${s.dcMod ? `+${s.dcMod}` : ""}</span></span>
            </button>
          </div>`).join("")}
        </div>
        <div class="between" style="margin-top:18px">
          <div class="small-note">${s.canBurst ? "气势够了，可以爆种：本回合判定保底成功，但精力 −18。" : s.useBurst ? "已爆种：本次判定必定成功。" : "气势到 60 才能爆种。"}</div>
          ${s.canBurst ? `<button class="btn small primary pulse" style="width:auto" data-act="burst">爆种</button>` : `<button class="btn small" style="width:auto" disabled>爆种</button>`}
        </div>
      </div>
    </div>`);
  }

  function renderDuelResult(s) {
    const g = s.game;
    return shell(`<div class="panel result-${g.win ? "win" : "lose"} fade-in">
      <div class="between">
        <div class="scene-tag">${esc(s.title)} · 第 ${s.wins + s.losses} 局</div>
        <div class="row">
          ${s.crit ? `<span class="chip gold">${esc(s.crit)}</span>` : ""}
          <span class="chip ${s.success ? "green" : "red"}">${s.success ? "操作成功" : "操作失败"}</span>
        </div>
      </div>
      <div class="story" style="margin-top:10px">${br(s.text)}</div>
      ${(s.notes && s.notes.length) ? `<div class="row" style="flex-wrap:wrap;gap:6px;margin-top:10px">${s.notes.map(n => `<span class="chip gold">${esc(n)}</span>`).join("")}</div>` : ""}
      ${s.flipNote ? `<p class="quote" style="color:var(--gold)">${esc(s.flipNote)}</p>` : ""}
      ${s.echo ? `<p class="quote dim" style="margin-top:6px">${esc(s.echo)}</p>` : ""}
      ${duoHTML(s)}
      <div class="divider"></div>
      <div class="match-row">
        <span class="res ${g.win ? "w" : "l"}">${g.win ? "胜" : "负"}</span>
        <span class="gr ${g.grade}">${g.grade}</span>
        <span class="opp">vs ${esc(g.opp)}</span>
        <span class="dim">${g.kda}</span>
        <span class="honor">${g.dmg}%</span>
      </div>
      <div class="between" style="margin-top:16px">
        <div class="scoreboard" style="margin:0"><span class="sc win">${s.wins}</span><span class="dim">:</span><span class="sc lose">${s.losses}</span></div>
        <button class="btn primary small" data-act="choose" data-i="0">下一局</button>
      </div>
    </div>`);
  }

  function renderSwiss(s) {
    const g = s.game;
    return shell(`<div class="panel result-${g.win ? "win" : "lose"} fade-in">
      <div class="between">
        <div class="scene-tag">瑞士轮 · 第 ${s.wins + s.losses} 轮</div>
        <span class="chip ${s.wins >= 3 ? "gold" : "blue"}">${s.wins} 胜 ${s.losses} 负</span>
      </div>
      <div class="match-row" style="margin-top:12px">
        <span class="res ${g.win ? "w" : "l"}">${g.win ? "胜" : "负"}</span>
        <span class="gr ${g.grade}">${g.grade}</span>
        <span class="opp">vs ${esc(g.opp)}</span>
        <span class="dim">${g.kda}</span>
        <span class="honor">${g.dmg}%</span>
      </div>
      <div class="right" style="margin-top:16px;text-align:right"><button class="btn primary small" data-act="choose" data-i="0">继续</button></div>
    </div>`);
  }

  /* ---------- 月末 ---------- */
  function renderMonthEnd(s) {
    const eNow = Math.round(s.energy == null ? 0 : s.energy), eB = (s.energyBand && s.energyBand.name) ? s.energyBand : energyBandOf(eNow);
    const ePrev = s.preEnergy != null ? Math.round(s.preEnergy) : null;
    const mNow = Math.round(s.money == null ? 0 : s.money), mB = (s.moneyBand && s.moneyBand.name) ? s.moneyBand : moneyBandOf(mNow);
    const expenses = s.expenses || [];
    const notes = s.notes || [];
    const sponsor = (s.sponsor && typeof s.sponsor === "object") ? s.sponsor : (typeof s.sponsor === "number" ? { fee: s.sponsor } : null);
    const INVCN = { house: "房产", fund: "基金", equity: "股权" };
    const investRows = Array.isArray(s.investRows) ? s.investRows : [];
    const statusTxt = s.forcedRest ? "强制休息" : (s.injured ? "伤病" : (eB.name || "正常"));
    return shell(`<div class="fade-in">
      <div class="kicker">${s.ml.year} 年 ${s.ml.month} 月 · 结算</div>
      <h2 style="margin:5px 0 14px">月底</h2>
      <div class="stat-grid">
        <div class="stat-cell"><div class="k">评分</div><div class="v gold">${s.ovr}</div></div>
        <div class="stat-cell" title="${bandTip(eB, energyBands(), eNow)}"><div class="k">精力</div><div class="v" style="color:${eB.color || "inherit"}">${eNow}<span style="font-size:12px;color:var(--dim,#8b96a3);margin-left:4px">${esc(eB.name || "")}</span></div></div>
        <div class="stat-cell"><div class="k">心态</div><div class="v">${Math.round(s.morale)}</div></div>
        <div class="stat-cell"><div class="k">士气</div><div class="v">${s.spirit == null ? "—" : Math.round(s.spirit)}</div></div>
        <div class="stat-cell"><div class="k">话语权</div><div class="v">${s.voice}</div></div>
        <div class="stat-cell"><div class="k">名气</div><div class="v">${s.fame}</div></div>
        <div class="stat-cell"><div class="k">粉丝</div><div class="v" style="font-size:17px">${fan(s.fans)}</div></div>
        <div class="stat-cell"><div class="k">本月到手</div><div class="v" style="font-size:16px">+${s.pay == null ? 0 : s.pay} 万</div></div>
        <div class="stat-cell" title="${bandTip(mB, moneyBands(), mNow)}"><div class="k">存款</div><div class="v" style="font-size:16px;color:${mB.color || "inherit"}">${mNow} 万<span style="font-size:12px;color:var(--dim,#8b96a3);margin-left:4px">${esc(mB.name || "")}</span></div></div>
        <div class="stat-cell"><div class="k">抽卡券</div><div class="v" style="font-size:16px">${s.ticket || 0}</div></div>
        <div class="stat-cell"><div class="k">抽卡</div><div class="v" style="font-size:17px">${s.draws > 0 ? s.draws + " 次" : "—"}</div></div>
        <div class="stat-cell"><div class="k">状态</div><div class="v" style="font-size:16px;color:${s.injured || s.forcedRest ? "#e0423f" : (eB.color || "inherit")}">${esc(statusTxt)}</div></div>
      </div>
      ${ePrev != null ? `<div class="panel flat" style="margin-top:12px"><span class="chip">精力变化</span> <span class="dim mono">月初 ${ePrev} → 月底 ${eNow}（${eNow - ePrev >= 0 ? "+" : ""}${eNow - ePrev}）${ePrev !== eNow ? " · " + esc(eB.note || "") : ""}</span></div>` : ""}
      ${(expenses.length || sponsor) ? `<div class="panel flat" style="margin-top:12px">
        <div class="between"><span class="kicker">本月到账</span><span class="dim mono">合计 +${s.pay == null ? 0 : s.pay} 万${sponsor ? "（含赞助）" : ""}</span></div>
        <div class="expense-row"><span>工资（年薪 ${s.salary == null ? "—" : s.salary} 万，按月发 ${s.payBase == null ? "—" : s.payBase} 万）</span><b class="pos">+${s.payBase == null ? "—" : s.payBase} 万</b></div>
        ${s.payFans ? `<div class="expense-row"><span>粉丝分成</span><b class="pos">+${s.payFans} 万</b></div>` : ""}
        ${s.payFame ? `<div class="expense-row"><span>名气分成</span><b class="pos">+${s.payFame} 万</b></div>` : ""}
        ${sponsor ? `<div class="expense-row"><span>赞助分成${sponsor.name ? "（" + esc(sponsor.name) + (sponsor.months ? " · 合约还剩 " + sponsor.months + " 个月" : "") + "）" : ""}</span><b class="pos">+${sponsor.fee == null ? "—" : sponsor.fee} 万</b></div>` : ""}
      </div>` : ""}
      ${investRows.length ? `<div class="panel flat" style="margin-top:12px">
        <div class="between"><span class="kicker">投资收益</span><span class="dim">现金转资产，季度结算</span></div>
        ${investRows.map(x => {
        const pct = Number(x && (x.pct != null ? x.pct : x.amount != null ? x.amount : x.v));
        const delta = Number(x && (x.delta != null ? x.delta : x.amount != null ? x.amount : x.v));
        const lbl = (x && (x.label || x.name)) || INVCN[(x && (x.k || x.key))] || "资产";
        const pd = isFinite(pct) ? (pct >= 0 ? "+" : "") + pct + "%" : "";
        const dd = isFinite(delta) ? (delta >= 0 ? "+" : "") + delta + " 万" : "";
        return `<div class="expense-row"><span>${esc(lbl)}${pd ? "（本季 " + esc(pd) + "）" : ""}</span><b class="${delta >= 0 ? "pos" : "neg"}">${esc(dd || "—")}</b></div>`;
      }).join("")}
      </div>` : ""}
      ${expenses.length ? `<div class="panel flat" style="margin-top:12px">
        <div class="between"><span class="kicker">本月支出</span><span class="dim mono">合计 ${s.expenseTotal != null ? s.expenseTotal : "—"} 万</span></div>
        ${expenses.filter(x => Math.abs(Number(x.amount != null ? x.amount : x.v) || 0) > 0.001).map(x => `<div class="expense-row"><span>${esc(x.label || x.n || x.name || "")}</span><b class="neg">−${esc(x.amount != null ? x.amount : (x.v != null ? x.v : "?"))} 万</b></div>`).join("")}
      </div>` : ""}
      ${notes.length ? `<div class="panel flat" style="margin-top:12px">${notes.map(n => `<div class="note-line">· ${esc(n)}</div>`).join("")}</div>` : ""}
      ${(Array.isArray(s.achvNew) && s.achvNew.length) ? `<div class="panel flat" style="margin-top:12px;border-color:rgba(232,185,35,.45)">
        <div class="between wrap"><span class="kicker">解锁成就</span><span class="row wrap" style="gap:6px">${s.achvNew.map(a => {
        const nm = a && typeof a === "object" ? (a.name || a.t || a.id || "") : (achvNameOf(a) || a);
        return `<span class="chip gold">${esc(nm)}</span>`;
      }).join("")}</span></div>
      </div>` : ""}
      ${s.forcedRest ? `<div class="panel flat" style="margin-top:12px;border-color:rgba(240,122,31,.5)"><span class="chip" style="color:#f07a1f;border-color:#f07a1f">强制休息</span> <span class="dim">训练计划被队医砍掉一半，比赛照打。高消耗的训练这个月先别碰。</span></div>` : ""}
      ${s.injured ? `<div class="panel flat" style="margin-top:12px;border-color:rgba(211,58,58,.5)"><span class="chip red">伤病</span> <span class="dim">身上有伤。这个月不耽误上场，但状态要打折——怎么处理，队医在等你的一句话。</span></div>` : ""}
      ${s.draws > 0 ? `<div class="panel flat" style="margin-top:12px"><span class="chip gold">机遇</span> <span class="dim">这个月有 ${s.draws} 次抽卡机会，赛季末的池子最肥。</span></div>` : ""}
      <div class="row between" style="margin-top:20px;gap:12px">
        <div class="small-note">下个月是 ${s.ml.month === 12 ? (s.ml.year + 1) + " 年 1 月" : s.ml.year + " 年 " + (s.ml.month + 1) + " 月"}${s.draws > 0 ? " · 先把卡抽了再走" : ""}</div>
        <button class="btn primary small" style="width:auto" data-act="choose" data-i="0">${s.draws > 0 ? "去抽卡" : "下一个月"}</button>
      </div>
    </div>`);
  }

  /* ---------- 伤病处理 ---------- */
  function renderInjury(s) {
    const opts = s.opts || [];
    return shell(`<div class="fade-in">
      <div class="kicker">队医办公室 · 只有你和他</div>
      <h2 style="margin:5px 0 6px">${esc(s.part || "手腕")}的报告</h2>
      <p class="dim">片子拍完了。队医把三种处理方式摆在桌上，说了一句：你自己选，我按你说的写报告。</p>
      <div style="display:grid;gap:10px;margin-top:16px">
        ${opts.map((o, i) => `<div class="offer" data-act="choose" data-i="${i}">
          <div class="between"><b>${esc(o.t)}</b><span class="chip">方案 ${i + 1}</span></div>
          <div class="dim" style="margin-top:6px;font-size:13px">${esc(o.d || "")}</div>
        </div>`).join("")}
      </div>
      <div class="small-note" style="margin-top:14px">不影响这个月的流程，选完继续结算。</div>
    </div>`);
  }

  /* ---------- 抽卡 ---------- */
  function renderDraw(s) {
    return shell(`<div class="fade-in">
      <div class="kicker">机遇 · GACHA</div>
      <h2 style="margin:5px 0 16px">抽到了 ${s.cards.length} 张</h2>
      <div class="draw-wrap">
        ${s.cards.map((c, i) => {
          const rc = (G.RARITY[c.rarity] || {}).c || "#9aa7b4";
          const bl = (((window.DATA_TERMS || {}).build || {})[c.build] || {}).name || "";
          return `<div class="card-flip" style="animation-delay:${i * .09}s"><div class="card-face" style="--rc:${rc}">
            <div class="between"><span class="rar">${(G.RARITY[c.rarity] || {}).n || ""} · ${esc(c.type || "")}${bl ? " · " + esc(bl) : ""}</span>${c.dup ? `<span class="dup">重复 +30 声望</span>` : ""}</div>
            <div class="cname">${esc(c.name)}</div>
            <div class="ctype">${esc(c.tag || "")}</div>
            <div class="cdesc">${esc(c.desc)}</div>
            <div class="cflavor" style="color:var(--gold)">${esc(effCN(c.eff || {}))}</div>
            ${c.flavor ? `<div class="cflavor">${esc(c.flavor)}</div>` : ""}
            ${srcLine(srcOf(c))}
          </div></div>`;
        }).join("")}
      </div>
      <div class="row" style="margin-top:22px;gap:12px">
        <button class="btn primary small" style="width:auto" data-act="choose" data-i="0">全部收下</button>
        <span class="small-note" style="align-self:center">收完就继续往下走，卡会进收藏夹</span>
      </div>
    </div>`);
  }

  /* ---------- 转会 ---------- */
  function renderTransfer(s) {
    return shell(`<div class="fade-in">
      <div class="kicker">${s.ldl ? "LDL 打完这一年" : "转会期"}</div>
      <h2 style="margin:5px 0 6px">${s.offers.length ? "有人给你打电话了" : "没有人给你打电话"}</h2>
      <p class="dim">${s.offers.length ? "挑一个，或者留下来再打一年。" : "手机很安静。你可以留在原队，也可以等下一年。"}</p>
      <div style="display:grid;gap:10px;margin-top:16px">
        ${s.offers.map((o, i) => `<div class="offer" data-act="choose" data-i="${i}">
          <div class="between">
            <div class="row">
              ${A.logo({ name: o.name, color: "#3fa9f5" }, 40)}
              <div>
                <div style="font-weight:800;font-size:17px">${esc(o.name)} <span class="chip ${o.tier === "S" ? "gold" : "blue"}">${esc(o.tier)} 级</span></div>
                <div class="small-note">${esc(o.desc || "")}</div>
              </div>
            </div>
            <div style="text-align:right"><div class="mono" style="color:var(--gold);font-size:17px">${o.salary} 万</div><div class="small-note">年薪</div></div>
          </div>
        </div>`).join("")}
      </div>
      <div class="panel flat" style="margin-top:14px">
        <div class="between wrap">
          <div class="small-note">话语权 ${s.voice} · 留在 ${s.ldl ? "LDL" : "原队"}也是一条路</div>
          <div class="row">
            ${s.canRetire ? `<button class="btn small" style="width:auto" data-act="choose" data-i="-1" data-v="retire">宣布退役</button>` : ""}
            <button class="btn small ghost" style="width:auto" data-act="choose" data-i="-1" data-v="stay">${s.ldl ? "再打一年 LDL" : "续约留队"}</button>
          </div>
        </div>
      </div>
    </div>`);
  }

  /* ---------- 退役 ---------- */
  function renderRetire(s) {
    const S = G.getState() || {};
    const ml = s.ml || S._ml || {};
    const kicker = ml.month ? `DECISION · ${ml.year} 年 ${ml.month} 月` : "DECISION · 赛季末";
    return shell(`<div class="fade-in">
      <div class="kicker">${esc(kicker)}</div>
      <h1 style="margin:8px 0 6px">还打吗</h1>
      <p class="dim">你 ${s.age} 岁，第 ${s.season} 季。手还能动，反应慢了一点。经理把续约合同放在桌上，没催你。</p>
      <div class="stat-grid" style="margin-top:16px">
        <div class="stat-cell"><div class="k">年龄</div><div class="v">${s.age}</div></div>
        <div class="stat-cell"><div class="k">赛季</div><div class="v">${s.season}</div></div>
        <div class="stat-cell"><div class="k">OVR</div><div class="v gold">${s.ovr}</div></div>
        <div class="stat-cell"><div class="k">冠军</div><div class="v">${(G.getState().record.titles || []).length}</div></div>
      </div>
      <div class="opts" style="display:grid;gap:9px;margin-top:18px">
        <div class="opt"><span class="idx">1</span>
          <button class="btn" data-act="choose" data-i="0">再打一年 <span class="tagline">合同续上，明年再来。联赛还会更强。</span></button>
        </div>
        <div class="opt"><span class="idx">2</span>
          <button class="btn" data-act="choose" data-i="1">就在这里结束 <span class="tagline">把外设收进包里，让故事停在还能打的时候。</span></button>
        </div>
      </div>
    </div>`);
  }

  /* ---------- 话语权 ---------- */
  function renderVoice(s) {
    const S = G.getState();
    return shell(`<div class="fade-in">
      <div class="between">
        <div><div class="kicker">话语权 ${G.voice()} · 你现在说话有人听了</div><h2 style="margin:5px 0 6px">会议室</h2></div>
        <span class="chip gold">${esc((G.teamOf(S.teamId) || {}).name || "")}</span>
      </div>
      <p class="dim">经理把门关上，教练把战术板翻到背面。接下来你说的话会写进这个队的下一份计划里。</p>
      <div class="opts" style="display:grid;gap:9px;margin-top:14px">
        ${s.opts.map((o, i) => `<div class="opt">
          <span class="idx">${i + 1}</span>
          <button class="btn" data-act="choose" data-i="${i}">${esc(o.t)}
            <span class="tagline"><span class="chip ${o.good ? "blue" : "red"}">${esc(o.c || "")}</span></span>
          </button>
          <div class="small-note" style="margin:6px 0 0 30px">${esc(o.d || "")}</div>
        </div>`).join("")}
      </div>
    </div>`);
  }

  /* ---------- 结局 ---------- */
  function tickLabel(t) {
    if (!t) return "2025.01";
    const y = 2025 + Math.floor((t - 1) / 12), m = ((t - 1) % 12) + 1;
    return y + "." + (m < 10 ? "0" + m : m);
  }

  function renderEnding(s) {
    const isEndless = s.mode === "endless";
    const reasonText = { age: "打到了打不动", fade: "没人要了", retire: "自己按下的停止键", three: "三年打完，落子无悔", banned: "被查出来的那件事", blood: "场外的那一刀", stalker: "追着你跑的人" }[s.reason || "three"] || "";
    return shell(`<div class="fade-in">
      <div class="ending-hero has-art">
        <div class="ending-art" style="background-image:url('${A.endingArt(s)}')" aria-hidden="true"></div>
        <div class="ending-shade" aria-hidden="true"></div>
        <div class="rank">${esc(s.end.rank)} · ${esc(s.end.sub)}</div>
        <h1>${esc(s.end.name)}</h1>
        <div class="scene-tag" style="margin-top:8px">${esc(s.name)} · ${POSCN[s.pos]} · ${esc(s.teamName)} · ${isEndless ? `第 ${s.season} 季 · ${s.age} 岁` : "2025–2027"}</div>
        <div class="row" style="justify-content:center;gap:8px;margin-top:12px">
          <span class="chip ${isEndless ? "purple" : "gold"}">${isEndless ? "无尽生涯" : "三年之约"}</span>
          <span class="chip">${esc(reasonText)}</span>
        </div>
      </div>
      <div class="panel">
        <div class="story">${br(s.end.text)}</div>
        ${s.end.echo ? `<p class="quote" style="margin-top:10px;color:var(--dim)">${esc(s.end.echo)}</p>` : ""}
        <div class="divider"></div>
        <div class="stat-grid">
          <div class="stat-cell"><div class="k">最终 OVR</div><div class="v gold">${s.ovr}</div></div>
          <div class="stat-cell"><div class="k">生涯战绩</div><div class="v" style="font-size:17px">${s.record.wins} 胜 ${s.record.losses} 负</div></div>
          <div class="stat-cell"><div class="k">冠军</div><div class="v" style="font-size:17px">${(s.record.titles || []).length} 个</div></div>
          <div class="stat-cell"><div class="k">粉丝</div><div class="v" style="font-size:17px">${fan(s.fans)}</div></div>
          <div class="stat-cell"><div class="k">名气</div><div class="v">${s.fame}</div></div>
          <div class="stat-cell"><div class="k">虎扑</div><div class="v">${(s.hupu || 0).toFixed(1)}</div></div>
          <div class="stat-cell"><div class="k">话语权</div><div class="v">${s.voice}</div></div>
          <div class="stat-cell"><div class="k">存款</div><div class="v" style="font-size:17px">${Math.round(s.money)} 万</div></div>
        </div>
        ${(s.record.titles || []).length ? `<div class="divider"></div><div class="row wrap" style="gap:6px">${s.record.titles.map(t => `<span class="chip gold">${esc(t)}</span>`).join("")}</div>` : ""}
      </div>
      ${(s.highlights || []).length ? `<div class="panel">
        <div class="kicker">HIGHLIGHTS</div>
        <h3 style="margin:5px 0 10px">能被记住的几场</h3>
        ${s.highlights.slice().reverse().map(h => `<div class="chron-row hl-row"><span class="yr">${esc(h.event || "")}</span><span class="ch">${esc(HL_KIND[h.kind] || h.kind || "")}</span><span class="dim">${esc(h.hero || "")}</span><span class="nt">${esc(h.text || "")}</span></div>`).join("")}
      </div>` : ""}
      <div class="panel">
        <div class="kicker">TIMELINE</div>
        <h3 style="margin:5px 0 10px">这一路的节点</h3>
        <div class="timeline">
          ${(s.timeline || []).map(x => `<div class="tl-item"><div class="t">${tickLabel(x.t)}</div><div class="x">${esc(x.text)}</div></div>`).join("") || `<div class="small-note">什么都没发生过。这才是最惨的。</div>`}
        </div>
      </div>
      <div class="panel">
        <div class="kicker">SEASONS</div>
        <div style="margin-top:8px;font-family:var(--mono);font-size:13px;line-height:2">
          ${(s.seasons || []).map(y => `<div>${y.year}　${y.splits.length ? esc(y.splits.join(" / ")) : "无战绩"}</div>`).join("")}
        </div>
        ${(s.worldChamps || []).length ? `<div class="divider"></div><div class="small-note">这几年世界冠军：${(s.worldChamps || []).map(w => `${w.year} ${esc(w.champ)}${w.mine ? "（你）" : ""}`).join(" · ")}</div>` : ""}
      </div>
      <div class="row" style="margin-top:18px;justify-content:center;gap:10px">
        <button class="btn primary small" style="width:auto" data-act="restart">再来一局</button>
        <button class="btn small ghost" style="width:auto" data-act="menu">回主菜单</button>
      </div>
      <div class="center small-note" style="margin-top:14px">最终属性：${G.STATS.map(k => G.CN[k] + Math.round(s.stats[k])).join(" · ")}</div>
    </div>`, { solo: true });
  }

  /* ================= v3 新场景 ================= */
  const TERM = () => window.DATA_TERMS || {};
  const STATCN = k => (G.CN && G.CN[k]) || k;
  const EFFCN = k => ((TERM().eff || {})[k]) || (k === "mateAff" ? "队友关系" : k === "mateLine" ? "队友线推进" : k === "invest" ? "资产" : k === "investAmt" ? "投入" : STATCN(k));
  function effCN(eff) {
    const out = [];
    for (const k in (eff || {})) {
      const v = eff[k];
      if (typeof v !== "number") { out.push(EFFCN(k)); continue; }
      out.push(EFFCN(k) + (v > 0 ? "+" : "") + v);
    }
    return out.join(" · ");
  }
  /* ---------- 4.0：关键因素 / 即时后果 ---------- */
  function factorPanel(title, intro, list) {
    if (!list || !list.length) return "";
    return `<div class="factor-panel">
      <div class="factor-head"><span class="kicker">${esc(title || "关键因素")}</span><span class="small-note">${esc(intro || "")}</span></div>
      <div class="factor-list">${list.map(f => `<div class="factor-item">
        <span class="factor-k">${esc(f.k || "")}</span>
        <b class="factor-v ${esc(f.tone || "")}">${esc(f.v || "")}</b>
        <span class="factor-note">${esc(f.note || "")}</span>
      </div>`).join("")}</div>
    </div>`;
  }
  function riskOdds(risk) {
    if (!risk) return null;
    const S = (G && G.getState) ? G.getState() : null;
    if (!S) return null;
    const st = Number((S.st || {})[risk.stat]) || 50;
    const mo = Number(S.morale == null ? 50 : S.morale);
    const bonus = Math.floor((st - 50) / 5) + Math.floor((mo - 50) / 12);
    const need = Number(risk.dc == null ? 12 : risk.dc) - bonus;
    const p = Math.max(.05, Math.min(.95, (21 - need) / 20));
    return { pct: Math.round(p * 100), stat: G.CN && G.CN[risk.stat] || risk.stat || "判定", dc: risk.dc };
  }
  function effChipHTML(eff) {
    if (!eff || typeof eff !== "object") return "";
    const parts = [];
    for (const k in eff) {
      const v = eff[k];
      if (typeof v !== "number" || !v) continue;
      parts.push(`<span class="chip ${v > 0 ? "green" : "red"}">${esc(EFFCN(k))}${v > 0 ? "+" : ""}${v}</span>`);
    }
    return parts.join("");
  }

  const RC = r => ((G.RARITY || {})[r] || { c: "#9aa7b4", n: "" });
  const BUILDN = k => (((TERM().build || {})[k] || {}).name) || "";
  const KEYVAR = k => (((TERM().keyVar || {})[k]) || k);
  /* 天赋卡的「原梗」：src 由数据层给（real/parody/original），缺失就整行不显示 */
  function talentById(id) {
    if (!id) return null;
    const all = (G.talents ? G.talents() : (window.DATA_TALENTS || [])) || [];
    for (let i = 0; i < all.length; i++) if (all[i] && all[i].id === id) return all[i];
    return null;
  }
  function srcOf(card) {
    if (card && card.src && typeof card.src === "object") return card.src;
    const t = card && talentById(card.id);
    return (t && t.src && typeof t.src === "object") ? t.src : null;
  }
  function srcLine(src, cls) {
    if (!src || typeof src !== "object") return "";
    if (src.type === "original") {
      return `<div class="card-src ${cls || ""}">原创梗${src.note ? " · " + esc(src.note) : ""}</div>`;
    }
    const who = esc(src.who || "圈内");
    const segs = [who];
    if (src.year && String(src.year) !== "0") segs.push(esc(String(src.year)));
    if (src.event) segs.push(esc(src.event));
    const q = src.quote ? `<span class="src-quote">「${esc(src.quote)}」</span>` : "";
    const n = src.note ? `<span class="src-note">${esc(src.note)}</span>` : "";
    return `<div class="card-src ${cls || ""}">原梗：${segs.join(" · ")}${q}${n}</div>`;
  }
  function tagsHTML(tags, cls) {
    return (tags || []).map(t => {
      if (t && typeof t === "object") {
        const v = Math.round((t.v || 0) * 100);
        const nm = t.k || "";
        return `<span class="chip ${t.tone === "bad" ? "red" : v ? "green" : ""}">${esc(nm)}${v ? (v > 0 ? "+" : "") + v + "%" : ""}</span>`;
      }
      return `<span class="chip ${cls || ""}">${esc(KEYVAR(t) || t)}</span>`;
    }).join(" ");
  }

  /* ---------- 阵容 / 羁绊 / 教程 / 成就 / 设置 ----------
     这些字段由 engine-core / repair-close 陆续补进场景与数据层，
     没落地时一律「静默不显示」，不能让页面炸。 */
  const POS_ORDER = ["TOP", "JUG", "MID", "BOT", "SUP"];
  function rosterList(v) {
    if (Array.isArray(v)) return v.filter(Boolean);
    if (v && typeof v === "object") return POS_ORDER.map(k => v[k]).filter(Boolean); // {TOP:{...}}
    return [];
  }
  function sigList(p) {
    const raw = (p && (p.sig || p.signature || p.mains || p.comfort)) || [];
    if (typeof raw === "string") return raw ? [raw] : [];
    if (Array.isArray(raw)) return raw.map(x => (x && typeof x === "object") ? (x.n || x.hero || x.name || "") : String(x || "")).filter(Boolean).slice(0, 3);
    return [];
  }
  function rosterPanel(title, list, tone) {
    const rows = rosterList(list);
    if (!rows.length) return "";
    const byPos = {};
    rows.forEach(p => { if (p && p.pos) byPos[p.pos] = p; });
    const ordered = POS_ORDER.map(k => byPos[k]).filter(Boolean);
    const rest = rows.filter(p => !p || !p.pos || !byPos[p.pos] || byPos[p.pos] !== p);
    const all = ordered.length ? ordered.concat(rest) : rows;
    return `<div class="roster-panel ${tone || ""}">
      <div class="roster-head"><span class="kicker">${esc(title)}</span></div>
      ${all.map(p => {
        const pos = POSCN[p.pos] || p.pos || "";
        const sig = sigList(p);
        return `<div class="roster-row">
          <span class="rp-pos">${esc(pos)}</span>
          <span class="rp-name">${esc(p.name || p.n || "?")}</span>
          <span class="rp-ovr">${p.ovr != null ? Math.round(p.ovr) : ""}</span>
          <span class="rp-sig">${sig.map(x => `<span class="chip">${esc(x)}</span>`).join("")}</span>
        </div>`;
      }).join("")}
    </div>`;
  }
  function rostersOf(s) {
    const mine = rosterList(s && (s.myRoster || s.rosterMy || s.myTeam));
    const opp = rosterList(s && (s.oppRoster || s.rosterOpp || s.opps));
    const fallbackMine = mine.length ? mine : (G.myRoster ? rosterList(G.myRoster()) : []);
    return { mine: fallbackMine, opp: opp };
  }
  function rostersBlock(s) {
    const r = rostersOf(s);
    if (!r.mine.length && !r.opp.length) return "";
    return `<div class="roster-grid">
      ${rosterPanel("我方阵容", r.mine, "mine")}
      ${rosterPanel("对面阵容", r.opp, "opp")}
    </div>`;
  }
  /* 羁绊：优先吃 scene.bonds，其次 window.BONDS.progress(deck) */
  function bondSet(s) {
    if (s && Array.isArray(s.bonds)) return s.bonds;
    try {
      if (G.deckBonds && typeof G.deckBonds === "function") {
        const b = G.deckBonds();
        if (Array.isArray(b) && b.length) return b;
        if (b && Array.isArray(b.summary) && b.summary.length) return b.summary;
      }
    } catch (e) { }
    const B = window.BONDS;
    if (B && typeof B.progress === "function") {
      let deck = null;
      try { deck = (G.getState() || {}).deck; } catch (e) { deck = null; }
      try { return B.progress(deck) || []; } catch (e) { return []; }
    }
    return [];
  }
  function bondRow(b) {
    if (!b || typeof b !== "object") return "";
    const name = b.name || b.buildName || BUILDN(b.build) || b.k || "";
    if (!name) return "";
    const count = b.count != null ? b.count : (b.n != null ? b.n : (b.have != null ? b.have : 0));
    const size = b.size || b.total || b.max || 5;
    const need = b.need != null ? b.need : Math.max(0, size - count);
    const tiers = Array.isArray(b.tiers) ? b.tiers : (Array.isArray(b.steps) ? b.steps : []);
    const mods = Array.isArray(b.mods) ? b.mods : (Array.isArray(b.bonuses) ? b.bonuses : (Array.isArray(b.buffs) ? b.buffs : []));
    const conflict = b.conflict || b.conflicts || b.clash;
    const tierHTML = tiers.map(t => {
      const at = t.at != null ? t.at : (t.need != null ? t.need : 0);
      const on = count >= at;
      const label = t.label || t.name || (at + " 张");
      const eff = t.eff ? effCN(t.eff) : (t.d || "");
      return `<span class="bond-tier ${on ? "on" : ""}">${esc(label)}${eff ? " · " + esc(eff) : ""}</span>`;
    }).join("");
    const modHTML = mods.map(m => {
      if (typeof m === "string") return `<span class="bond-mod">${esc(m)}</span>`;
      const lb = m.label || m.k || m.name || "";
      const v = m.value != null ? m.value : m.v;
      const txt = v != null ? `${lb}${v > 0 ? "+" : ""}${typeof v === "number" && Math.abs(v) <= 1 ? Math.round(v * 100) + "%" : v}` : lb;
      return `<span class="bond-mod ${v > 0 ? "up" : v < 0 ? "down" : ""}">${esc(txt)}</span>`;
    }).join("");
    return `<div class="bond-row">
      <div class="bond-top"><b>${esc(name)}</b><span class="mono">${count}/${size}${need ? "（还差 " + need + " 张）" : "（已满）"}</span></div>
      ${tierHTML || modHTML ? `<div class="bond-meta">${tierHTML}${modHTML}</div>` : ""}
      ${conflict ? `<div class="bond-clash">${esc(typeof conflict === "string" ? conflict : "和别的流派冲突，互相抵消")}</div>` : ""}
    </div>`;
  }
  function bondsHTML(s) {
    const list = bondSet(s);
    if (!list.length) return "";
    return `<div class="bonds-panel">
      <div class="between"><span class="kicker">羁绊</span><span class="small-note">同流派越多越强，冲突的会互相抵消</span></div>
      ${list.map(bondRow).join("")}
    </div>`;
  }
  function poolInfoHTML(p) {
    if (!p) return "";
    if (typeof p === "string") return `<div class="pool-info"><span class="small-note">${esc(p)}</span></div>`;
    const rows = Array.isArray(p.rows) ? p.rows : (Array.isArray(p.prob) ? p.prob : []);
    const head = p.label || p.name || p.title || "当前池";
    const note = p.note || p.d || "";
    return `<div class="pool-info">
      <div class="row wrap" style="gap:6px"><span class="kicker">${esc(head)}</span>
        ${rows.map(r => {
          const k = r.k || r.key || r.rarity || r.label || "";
          const v = r.v != null ? r.v : (r.p != null ? r.p : r.value);
          const txt = typeof v === "number" ? (v <= 1 ? Math.round(v * 100) + "%" : String(v)) : (v == null ? "" : v);
          return `<span class="chip">${esc(k)}${txt ? " " + esc(txt) : ""}</span>`;
        }).join("")}
        ${p.pity != null ? `<span class="chip gold">保底 ${esc(p.pity)}/40</span>` : ""}
      </div>
      ${note ? `<div class="small-note" style="margin-top:4px">${esc(note)}</div>` : ""}
    </div>`;
  }
  /* 新手教程：DATA_TUTORIAL 有就用，没有就用内置一版；engine 的 sc.guide 优先级最高 */
  const TUT_FALLBACK = {
    action: { title: "一个月，只够干一件正事", text: "底下那排自由操作不占行动，但有的要花精力。精力见底了还硬练，伤病就在门口等你。", tips: ["9 个行动里挑一个，选完就进赛程", "卡组、商店、练英雄这些随时能点"] },
    bp: { title: "BP 不是走流程", text: "ban 掉对面最熟的那个，比抢一个版本英雄更值。第三步的对位信息写了这把大概能打出多少，看不懂就跟着克制关系走。", tips: ["蓝方先亮英雄，会吃针对", "决胜局多两个 ban 位"] },
    duel: { title: "每一个选择都会算进局势值", text: "成功率是算过的，不是心理暗示。局势值落后的时候别急着赌大的，先把节奏捡回来。", tips: ["气势到 60 可以爆种，保底成功", "一把只能赌一次资源"] },
    shop: { title: "钱要花在能变成战力上", text: "这个月货架就这些，下个月换一批。一次性道具买了就没，别手滑。", tips: ["月初才能存档", "存款见底会有人来催"] },
    gacha: { title: "抽卡靠券，不靠运气解释", text: "重复的卡会折成现金。抽到的卡要装进卡组才生效，五个槽，同流派越多羁绊越强。", tips: ["退出不扣券，别怕点错", "保底 40 抽"] }
  };
  function tutorialFor(t) {
    const D = window.DATA_TUTORIAL || {};
    const raw = D[t];
    const fb = TUT_FALLBACK[t] || null;
    if (!raw) return fb;
    if (typeof raw === "string") return { title: (fb && fb.title) || "提示", text: raw, tips: (fb && fb.tips) || [] };
    return {
      title: raw.title || (fb && fb.title) || "",
      text: raw.text || raw.d || raw.desc || (fb && fb.text) || "",
      tips: (Array.isArray(raw.tips) ? raw.tips : (Array.isArray(raw.list) ? raw.list : (fb && fb.tips) || [])).slice(0, 4)
    };
  }
  const GUIDE_KEY = "denshen_guide_seen";
  let guideSeen = {};
  try { guideSeen = JSON.parse(localStorage.getItem(GUIDE_KEY) || "{}") || {}; } catch (e) { guideSeen = {}; }
  function guideOn(s) {
    if (!s || !s.type) return false;
    if (s.guide === false) return false;
    if (s.guide === true) return true;
    return !!TUT_FALLBACK[s.type] && !guideSeen[s.type];
  }
  function guideHTML(s) {
    if (!guideOn(s)) return "";
    const t = tutorialFor(s.type);
    if (!t) return "";
    return `<div class="guide-bubble">
      <div class="guide-h"><span class="guide-dot"></span><b>${esc(t.title || "先说一句")}</b></div>
      <div class="guide-t">${esc(t.text || "")}</div>
      ${(t.tips || []).length ? `<div class="guide-tips">${t.tips.map(x => `<span class="chip">${esc(x)}</span>`).join("")}</div>` : ""}
      <div class="right"><button class="btn small ghost" style="width:auto" data-act="guide-ok" data-v="${esc(s.type)}">知道了</button></div>
    </div>`;
  }
  function markGuide(t) {
    if (!t) return;
    guideSeen[t] = 1;
    try { localStorage.setItem(GUIDE_KEY, JSON.stringify(guideSeen)); } catch (e) { }
  }
  function guideReset() {
    guideSeen = {};
    try { localStorage.removeItem(GUIDE_KEY); } catch (e) { }
  }
  function introTutorial() {
    const D = window.DATA_TUTORIAL || {};
    const raw = D.intro || {};
    if (typeof raw === "string") return raw;
    return raw.text || raw.d || "一局大约三十分钟：选模式与难度，抽一个基底，选位置和英雄池，然后一个月一个月地过。每个月先看版本、做一件正事、碰一件场外事，再打一场比赛。不想细看就托管，想自己来就点开每一场。";
  }
  /* 系列赛「决策贡献」评级：字段名以 engine 给的为准，缺就整块不显示 */
  function duoHTML(s) {
    if (!s) return "";
    const g = s.duoGrade || s.duo || s.decisionGrade || s.dec || s.decRating;
    if (!g) return "";
    let grade = "", score = null, text = "";
    if (typeof g === "string") grade = g;
    else { grade = g.grade || g.rank || g.tier || ""; score = g.score != null ? g.score : (g.rate != null ? g.rate * 100 : (g.value != null ? g.value : null)); text = g.text || g.desc || g.note || ""; }
    if (!grade && score == null) return "";
    return `<div class="duo-panel">
      <div class="between"><span class="kicker">决策贡献</span>${grade ? `<span class="duo-grade">${esc(grade)}</span>` : ""}</div>
      ${score != null ? `<div class="small-note" style="margin-top:3px">这一轮 BP 与临场指挥，把胜率抬了 <b class="gold">${Math.round(score)}</b> 点。</div>` : ""}
      ${text ? `<div class="small-note" style="margin-top:3px">${esc(text)}</div>` : ""}
    </div>`;
  }
  /* 成就条件（cond）转人话：engine 用 AND 组合，别名在这里统一 */
  const COND_CN = {
    minTitles: v => "至少 " + v + " 个冠军", maxTitles: v => "冠军不超过 " + v + " 个",
    minOvr: v => "总评 ≥ " + v, minSeasons: v => "打满 " + v + " 个赛季",
    minMoney: v => "存款 ≥ " + v + " 万", maxMoney: v => "存款 ≤ " + v + " 万",
    minFans: v => "粉丝 ≥ " + v + " 万", minFame: v => "名气 ≥ " + v,
    worldsChampion: () => "拿过世界赛冠军", msiChampion: () => "拿过 MSI 冠军",
    endingName: v => "结局：" + (Array.isArray(v) ? v.join(" / ") : v),
    endingRank: v => "评级：" + (Array.isArray(v) ? v.join(" / ") : v),
    storyCorrupt: () => "走过黑幕线", storyJustice: () => "走过举报线",
    mateAff: v => "队友关系 ≥ " + v, heroCount: v => "会 " + v + " 个英雄",
    gachaCount: v => "抽卡 " + v + " 次", debtEver: () => "欠过债",
    injuryCount: v => "受伤 " + v + " 次", playMode: v => "模式：" + v,
    games: v => "场次 ≥ " + v, season: v => "赛季 " + v
  };
  function condTxt(cond) {
    if (!cond || typeof cond !== "object") return "";
    const out = [];
    Object.keys(cond).forEach(k => {
      const v = cond[k];
      if (v === false || v === null || v === undefined) return;
      const f = COND_CN[k];
      out.push(f ? f(v) : (k + " " + (Array.isArray(v) ? v.join("/") : v)));
    });
    return out.join(" · ");
  }
  /* 成就 */
  let achvCat = "all";
  function achvNameOf(id) {
    if (!id) return "";
    const list = achvList();
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (a && (a.id === id || a.k === id)) return a.name || a.t || id;
    }
    return "";
  }
  /* 队友关系（W5）：优先 GAME.mates()，其次直接读 S.mates，全缺给空状态 */
  const MATE_TIER = { 0: "陌生", 1: "熟识", 2: "朋友", 3: "兄弟", 4: "决裂" };
  function matesList() {
    let arr = null;
    try { if (G.mates && typeof G.mates === "function") arr = G.mates(); } catch (e) { arr = null; }
    if (!arr) {
      const S = G.getState() || {};
      const m = S.mates;
      if (Array.isArray(m)) arr = m;
      else if (m && typeof m === "object") arr = Object.keys(m).map(k => Object.assign({ pid: k }, m[k]));
    }
    return (Array.isArray(arr) ? arr : []).map(x => {
      if (!x || x.mem) return x;
      try {
        const S = G.getState() || {};
        const raw = S.mates && S.mates[x.pid];
        if (raw && raw.mem) return Object.assign({}, x, { mem: raw.mem });
      } catch (e) { }
      return x;
    });
  }
  function mateTier(x) {
    if (!x) return "陌生";
    if (typeof x.tier === "string" && x.tier) return x.tier;
    if (x.tier && typeof x.tier === "object" && x.tier.name) return x.tier.name;
    if (x.broken) return "决裂";
    const a = Number(x.aff);
    if (!isFinite(a)) return "陌生";
    if (a >= 85) return "兄弟";
    if (a >= 70) return "朋友";
    if (a >= 40) return "熟识";
    return "陌生";
  }
  function mateBarColor(a) {
    if (!isFinite(Number(a))) return "#5d6b7a";
    const v = Number(a);
    return v > 65 ? "#e8b923" : v >= 35 ? "#4cc2ff" : "#ff4d5e";
  }
  function matesHTML() {
    const list = matesList();
    if (!list.length) return `<div class="small-note" style="padding:14px 0">这段关系还没开始记录。等你进队，四个队友的关系会在这里一个人一个人地长出来。</div>`;
    const team = (G.getState && G.teamOf) ? (G.teamOf((G.getState() || {}).teamId) || {}) : {};
    const tc = team.color || "#e8b923";
    return `<div class="mate-grid">${list.map(x => {
      const a = Math.max(0, Math.min(100, Number(x.aff)));
      const av = (x.aff == null || !isFinite(a)) ? 50 : a;
      const mem = Array.isArray(x.mem) ? x.mem.filter(Boolean) : [];
      const lastMem = mem.length ? mem[mem.length - 1] : "";
      const memTxt = lastMem && typeof lastMem === "object" ? (lastMem.t || lastMem.text || lastMem.d || "") : lastMem;
      const pos = POSCN[x.pos] || x.pos || "";
      const tier = mateTier(x);
      const broken = tier === "决裂" || x.broken;
      return `<div class="mate-card${broken ? " is-broken" : ""}">
        <div class="mate-head">
          <span class="avatar-ring mate-av">${A.avatar(x.pid || x.name || "mate", tc, 40)}</span>
          <div style="min-width:0;flex:1">
            <div class="mate-name">${esc(x.name || x.pid || "队友")}${pos ? ` <span class="chip">${esc(pos)}</span>` : ""}</div>
            <div class="mate-sub">${esc(tier)}${x.done ? " · 线走完了" : " · 这条线还没走完"}</div>
          </div>
        </div>
        <div class="mate-aff">
          <span class="bar"><i style="width:${av}%;background:${mateBarColor(a)}"></i></span>
          <span class="mono" style="color:${mateBarColor(a)}">${isFinite(a) ? Math.round(a) : "—"}</span>
        </div>
        ${memTxt ? `<div class="mate-mem">最近：${esc(memTxt)}</div>` : `<div class="mate-mem dim">还没发生过什么值得记的事。</div>`}
      </div>`;
    }).join("")}</div>`;
  }
  function achvList() {
    const D = window.DATA_ACHV;
    if (Array.isArray(D)) return D;
    if (D && Array.isArray(D.list)) return D.list;
    return [];
  }
  function achvGot() {
    const S = G.getState() || {};
    const a = S.achv || S.achievements || {};
    let o = {};
    if (Array.isArray(a)) { a.forEach(x => { o[x] = 1; }); }
    else if (a && typeof a === "object") { o = Object.assign({}, a); }
    /* 跨局：GAME.checkAchv 会把达成项写进 localStorage denshen_achv，刷新后依然亮着 */
    try {
      const raw = window.localStorage.getItem("denshen_achv");
      if (raw) {
        const ls = JSON.parse(raw);
        if (Array.isArray(ls)) ls.forEach(x => { if (x != null) o[typeof x === "object" ? (x.id || x.k || x.name) : x] = 1; });
        else if (ls && typeof ls === "object") Object.keys(ls).forEach(k => { if (ls[k]) o[k] = 1; });
      }
    } catch (e) { }
    return (o && typeof o === "object") ? o : {};
  }
  function achvHTML() {
    const list = achvList();
    const got = achvGot();
    const total = (window.DATA_ACHV && window.DATA_ACHV.total) || 40;
    if (!list.length) return `<div class="small-note" style="padding:12px 0">成就数据还没接进来。等这一版的数据表落地，这里会按分类列出所有条目。</div>`;
    const cats = [];
    list.forEach(a => { const c = a.cat || a.category || "其他"; if (cats.indexOf(c) < 0) cats.push(c); });
    const shown = list.filter(a => {
      if (codexQ) { try { return JSON.stringify(a).toLowerCase().indexOf(codexQ.toLowerCase()) >= 0; } catch (e) { return false; } }
      return achvCat === "all" || (a.cat || a.category || "其他") === achvCat;
    });
    const gotN = Object.keys(got).filter(k => got[k]).length;
    return `<div class="achv-wrap">
      <div class="between wrap" style="gap:8px">
        <div class="row wrap" style="gap:6px">
          <button class="chip ${achvCat === "all" ? "gold" : ""}" data-act="achv-cat" data-v="all" style="cursor:pointer">全部</button>
          ${cats.map(c => `<button class="chip ${achvCat === c ? "gold" : ""}" data-act="achv-cat" data-v="${esc(c)}" style="cursor:pointer">${esc(c)}</button>`).join("")}
        </div>
        <span class="mono" style="color:var(--gold)">${gotN}/${total}</span>
      </div>
      <div class="achv-list">
        ${shown.map(a => {
          const id = a.id || a.k || a.name;
          const on = !!got[id];
          return `<div class="achv-row ${on ? "on" : "off"}">
            <div class="achv-h"><b>${esc(a.name || a.t || id)}</b>${on ? `<span class="chip gold">已达成</span>` : `<span class="chip dark">未达成</span>`}</div>
            <div class="small-note">${esc(a.desc || a.d || a.text || "")}</div>
            ${condTxt(a.cond || a.conds) ? `<div class="small-note dim" style="margin-top:2px">条件：${esc(condTxt(a.cond || a.conds))}</div>` : ""}
            ${a.reward ? `<div class="small-note" style="color:var(--gold-2);margin-top:2px">奖励：${esc(typeof a.reward === "string" ? a.reward : effCN(a.reward))}</div>` : ""}
          </div>`;
        }).join("")}
      </div>
    </div>`;
  }
  /* 图鉴页翻页（战队 / 选手） */
  let codexPage = 0;
  function codexPaged(arr, per, act) {
    const total = arr.length;
    const p = pagerHTML(total, codexPage, per, act);
    codexPage = p.page;
    return { rows: arr.slice(p.page * per, p.page * per + per), page: p.html };
  }
  /* 设置 overlay */
  function audioOf() { return window.SND || window.AUDIO || null; }
  function autoOn() {
    const S = G.getState() || {};
    try { if (G.autoMode && typeof G.autoMode === "function") return !!G.autoMode(); } catch (e) { }
    return !!(S.autoMode || S.auto || (G.getState && (G.getState() || {}).autoMode));
  }
  function volOf(which) {
    const a = audioOf();
    try {
      if (a) {
        const fn = which === "music" ? (a.musicVolume || (window.AUDIO && window.AUDIO.musicVolume)) : (a.sfxVolume || (window.AUDIO && window.AUDIO.sfxVolume));
        if (typeof fn === "function") { const v = fn(); if (typeof v === "number") return v; }
      }
    } catch (e) { }
    try { if (window.SND && typeof window.SND.volume === "function") return window.SND.volume(); } catch (e) { }
    return 0.7;
  }
  function mutedNow() {
    try { if (window.SND && typeof window.SND.muted === "function") return !!window.SND.muted(); } catch (e) { }
    return false;
  }
  function settingsHTML() {
    const mv = Math.round(volOf("music") * 100), sv = Math.round(volOf("sfx") * 100);
    return `<div class="settings fade-in" data-act="set-stop">
      <div class="gloss-head">
        <div><div class="kicker">SETTINGS</div><h2>设置</h2>
        <p class="dim" style="margin:4px 0 0">不想听的可以关小，不想点的可以托管。存档还是只能月初存。</p></div>
        <button class="btn small ghost" style="width:auto" data-act="settings-close">关闭</button>
      </div>
      <div class="set-row">
        <div class="set-lb"><b>音乐</b><span class="small-note">比赛和菜单分开走的两条轨道</span></div>
        <div class="set-ctl"><input type="range" id="setMusic" min="0" max="100" value="${mv}"><span class="mono" id="setMusicV">${mv}%</span></div>
      </div>
      <div class="set-row">
        <div class="set-lb"><b>音效</b><span class="small-note">点击、抽卡、比赛的反馈音</span></div>
        <div class="set-ctl"><input type="range" id="setSfx" min="0" max="100" value="${sv}"><span class="mono" id="setSfxV">${sv}%</span></div>
      </div>
      <div class="set-row">
        <div class="set-lb"><b>静音</b><span class="small-note">线条还在，声音全关</span></div>
        <div class="set-ctl"><button class="btn small ${mutedNow() ? "primary" : ""}" style="width:auto" data-act="mute-toggle">${mutedNow() ? "已静音 · 打开" : "关掉声音"}</button></div>
      </div>
      <div class="set-row">
        <div class="set-lb"><b>托管</b><span class="small-note">${autoOn() ? "当前开着：抽卡和商店自动处理，省你的手" : "当前关着：每一步都自己点"}</span></div>
        <div class="set-ctl"><button class="btn small ${autoOn() ? "primary" : ""}" style="width:auto" data-act="toggle-auto">${autoOn() ? "关掉托管" : "开启托管"}</button></div>
      </div>
      <div class="set-row">
        <div class="set-lb"><b>教程</b><span class="small-note">第一次进某个页面时的提示，已经点掉的那些</span></div>
        <div class="set-ctl"><button class="btn small ghost" style="width:auto" data-act="guide-replay">重看开场说明</button></div>
      </div>
      <div class="set-row">
        <div class="set-lb"><b>图鉴</b><span class="small-note">数值、机制、暗线、效果词，随时能查</span></div>
        <div class="set-ctl"><button class="btn small ghost" style="width:auto" data-act="glossary">打开图鉴</button></div>
      </div>
      <div class="panel flat" style="margin-top:14px"><div class="small-note">${esc(introTutorial())}</div></div>
    </div>`;
  }
  function bindSettings() {
    const ov = document.getElementById("setOverlay");
    if (!ov) return;
    const bind = (id, labelId, which) => {
      const el = document.getElementById(id);
      if (!el || typeof el.addEventListener !== "function") return;
      const show = () => { const l = document.getElementById(labelId); if (l) l.textContent = el.value + "%"; };
      el.addEventListener("input", () => {
        show();
        const v = Number(el.value) / 100;
        try {
          if (window.SND && typeof window.SND.setMusicVolume === "function" && which === "music") window.SND.setMusicVolume(v);
          else if (window.SND && typeof window.SND.setSfxVolume === "function" && which === "sfx") window.SND.setSfxVolume(v);
          else if (window.AUDIO && typeof window.AUDIO.setMusicVolume === "function" && which === "music") window.AUDIO.setMusicVolume(v);
          else if (window.AUDIO && typeof window.AUDIO.setSfxVolume === "function" && which === "sfx") window.AUDIO.setSfxVolume(v);
          else if (window.SND && typeof window.SND.setVolume === "function") window.SND.setVolume(v);
        } catch (e) { }
      });
    };
    bind("setMusic", "setMusicV", "music");
    bind("setSfx", "setSfxV", "sfx");
  }
  function openSettings() {
    let ov = document.getElementById("setOverlay");
    if (!ov) {
      ov = document.createElement("div");
      ov.id = "setOverlay";
      ov.className = "gloss-overlay";
      if (document.body && typeof document.body.appendChild === "function") document.body.appendChild(ov);
    }
    ov.innerHTML = settingsHTML();
    bindSettings();
  }
  function closeSettings() {
    const ov = document.getElementById("setOverlay");
    if (ov && ov.parentNode && typeof ov.parentNode.removeChild === "function") ov.parentNode.removeChild(ov);
  }
  /* 音乐/音效：SND 是 lead 这一版的多轨 API，缺方法就静默 */
  function audTheme(name) {
    if (!name) return false;
    try { if (window.SND && typeof window.SND.bgm === "function") { window.SND.bgm(name); return true; } } catch (e) { }
    try { if (window.AUDIO && typeof window.AUDIO.playTheme === "function") { window.AUDIO.playTheme(name); return true; } } catch (e) { }
    return false;
  }
  function audIntensity(n) {
    try { if (window.SND && typeof window.SND.setIntensity === "function") window.SND.setIntensity(n); } catch (e) { }
  }
  function audEnding(kind) {
    try { if (window.SND && typeof window.SND.playEnding === "function") { window.SND.playEnding(kind); return true; } } catch (e) { }
    try { if (window.AUDIO && typeof window.AUDIO.playEnding === "function") { window.AUDIO.playEnding(kind); return true; } } catch (e) { }
    return false;
  }
  /* 日常页按赛段走 ldl / lpl；国际赛与世界赛单独给 */
  function themeOf() {
    if (view === "menu") return "menu";
    if (view === "cockfight") return "cockfight";
    if (!sc) return "menu";
    const t = sc.type || "";
    if (/^create_/.test(t)) return "menu";
    if (t === "retire") return "collapse";
    if (t === "ending") return "ending";
    if (t === "bp" || t === "prep") return "tense";
    if (t === "worldsMap" || t === "worldsTree") return "worlds";
    if (t === "swissResult") return "worlds";
    if (/^(inGame|boGame|duel|duelResult|matchday|moment|highlight)$/.test(t)) return "duel";
    if (t === "bigevent") return "meme";
    const S = G.getState() || {};
    if (S.league === "LCK" || S.stage === "LCK") return "lck";
    if (S.stage === "LDL") return "ldl";
    if (S.stage === "Worlds" || S.stage === "worlds") return "worlds";
    return "lpl";
  }
  function intensityOf() {
    if (!sc) return 1;
    const d = sc.duel || {};
    const g = sc.g || d.game || 0;
    const wins = sc.wins != null ? sc.wins : (d.wins || 0);
    const losses = sc.losses != null ? sc.losses : (d.losses || 0);
    if (sc.type === "bp" || sc.type === "prep") return 2;
    if (/^(inGame|boGame|duel|duelResult|swissResult|moment|highlight)$/.test(sc.type || "")) {
      if (wins === 2 || losses === 2) return 3;
      if (sc.bestOf === 5 && g === 5) return 3;
      return 2;
    }
    return 1;
  }
  /* 斗蛐蛐 */
  function cockfightHTML() {
    const C = window.COCKFIGHT;
    const back = `<div class="between wrap" style="margin-bottom:12px">
      <span class="kicker">COCKFIGHT · 纯看戏，不占生涯</span>
      <button class="btn small ghost" style="width:auto" data-act="cockfight-back">回主菜单</button>
    </div>`;
    if (C && typeof C.html === "function") {
      let inner = "";
      try { inner = C.html(); } catch (e) { inner = ""; }
      if (inner) return shell(`<div class="fade-in">${back}${inner}</div>`, { solo: true });
      return shell(`<div class="fade-in">${back}<div class="panel"><div class="story">斗蛐蛐开场动画卡住了，退出去再进一次。</div></div></div>`, { solo: true });
    }
    return shell(`<div class="fade-in">${back}<div class="panel"><div class="kicker">COCKFIGHT</div><h2 style="margin:5px 0 0">斗蛐蛐</h2>
      <div class="story">两只蛐蛐，一个笼子，你自己下注。这个模块还没加载进来，等它接上就是纯看戏，不占生涯。</div></div></div>`, { solo: true });
  }

  /* ---------- 版本更新 ---------- */
  function patchVer(p) {
    if (!p) return "";
    if (typeof p.ver === "string") return p.ver;
    if (!p.no) return "";
    const yy = Number(p.year) >= 2000 ? (Number(p.year) % 100) : null;
    return (yy ? String(yy) : "25") + "." + p.no;
  }
  function renderPatch(s) {
    const p = s.patch || {}, list = p.list || [];
    return shell(`<div class="fade-in">
      <div class="between">
        <div><div class="kicker">${p.year} 年 ${p.month} 月 · 版本 ${patchVer(p)}</div>
        <h2 style="margin:5px 0 0">${p.big ? "大版本" : "补丁"}更新</h2></div>
        <div class="row"><span class="chip ${p.big ? "gold" : "blue"}">环境：${esc(p.env || "")}</span></div>
      </div>
      <p class="dim" style="margin-top:10px">${p.big ? "整个打法体系被重做了一遍，所有队的 BP 都要重学。" : "四个到六个英雄动了刀，谁吃到红利、谁被砍废，全看运气。"}</p>
      <div class="match-list" style="margin-top:12px">
        ${list.map(x => `<div class="match-row">
          <span class="res ${x.d > 0 ? "w" : "l"}">${x.d > 0 ? "加强" : "削弱"}</span>
          <span class="opp">${esc(x.n)}</span>
          <span class="dim">${esc(x.en || "")}</span>
          <span class="honor">${x.d > 0 ? "+" : ""}${x.d}</span>
        </div>`).join("")}
      </div>
      <div class="panel flat" style="margin-top:12px"><span class="chip">英雄池</span> <span class="dim" style="font-size:13px">版本直接改熟练度：被加强的会涨，被砍的习惯会掉。练什么都得看版本脸色。</span></div>
      <div class="right" style="margin-top:18px;text-align:right"><button class="btn primary small" data-act="choose" data-i="0">继续</button></div>
    </div>`);
  }

  /* ---------- 积分榜 ---------- */
  function renderStandings(s) {
    const rows = s.rows || [];
    return shell(`<div class="fade-in">
      <div class="kicker">${s.ml ? s.ml.year + " 年 " + s.ml.month + " 月" : ""} · 常规赛积分榜</div>
      <h2 style="margin:5px 0 4px">联赛排名</h2>
      <p class="dim">别的队也在打，每个月一起更新。前四才能去世界赛。</p>
      <div class="match-list" style="margin-top:12px">
        ${rows.map(r => `<div class="match-row" style="${r.mine ? "border-color:rgba(240,195,60,.6);background:rgba(240,195,60,.06)" : ""}">
          <span class="res ${r.rank <= 4 ? "w" : ""}" style="width:44px">${r.rank}</span>
          ${A.crest(r.id || r.name, 26, r.color || "#e8b923")}
          <span class="opp">${esc(r.name)}${r.mine ? ' <span class="chip gold">你</span>' : ""}</span>
          <span class="dim" style="font-family:var(--mono)">${r.w}-${r.l}</span>
          <span class="honor">${(r.last || []).join("")}</span>
        </div>`).join("")}
      </div>
      <div class="right" style="margin-top:18px;text-align:right"><button class="btn primary small" data-act="choose" data-i="0">继续</button></div>
    </div>`);
  }

  /* ---------- BP ---------- */
  /* ---------- 跳过分（常规赛全是大优，给你一个快进键） ---------- */
  function renderSkipOffer(s) {
    return shell(`<div class="fade-in">
      <div class="between">
        <div><div class="kicker">${s.ml.year} 年 ${s.ml.month} 月 · ${esc(s.splitName || "")}</div>
        <h2 style="margin:5px 0 0">这五场，还用你亲自打吗</h2></div>
        <div class="chip gold">最硬一场 ${s.pct}% · 平均 ${s.avgPct || s.pct}%</div>
      </div>
      <div class="panel" style="margin-top:14px">
        <div class="story">常规赛五场，最硬的一场你都有 ${s.pct}% 的把握，平均 ${s.avgPct || s.pct}%。教练说这种局他自己上去也能赢，问你要不要省点力气。
挂机不是没有代价的：手感会凉，对面也会憋着一手爆冷。</div>
        <div class="match-list" style="margin-top:12px">
          ${(s.opps || []).map(o => `<div class="match-row"><span class="dim">${esc(o.name)}</span><span class="honor">${o.power}</span></div>`).join("")}
        </div>
      </div>
      <div class="opts" style="display:grid;gap:9px;margin-top:14px">
        <div class="opt"><span class="idx">1</span>
          <button class="btn primary" data-act="choose" data-v="skip" data-i="0">
            挂机五场
            <span class="tagline">省时间，但 <b>20% 概率</b>被爆冷一局，这局的锅你还得背</span>
          </button></div>
        <div class="opt"><span class="idx">2</span>
          <button class="btn" data-act="choose" data-v="play" data-i="0">
            自己打
            <span class="tagline">一场一场来，手感在线，气势也能攒</span>
          </button></div>
      </div>
    </div>`);
  }

  function renderBp(s) {
    const S = G.getState() || {};
    const head = `<div class="between">
        <div><div class="kicker">${esc(s.title || "对局")} · 第 ${s.g} 局 · BO${s.bestOf || 5}</div>
        <h2 style="margin:5px 0 0">vs ${esc((s.opp || {}).name || "")}</h2></div>
        <div style="text-align:right"><div class="mono" style="font-size:20px;color:var(--gold)">${esc(s.score || "0-0")}</div><div class="small-note">大比分</div></div>
      </div>`;
    const rosters = rostersBlock(s);
    const guide = guideHTML(s);
    const quick = s.quick || null;
    const quickRows = Array.isArray(quick) ? quick.map(q => ({ v: q.v, t: q.label || q.t || q.v, d: q.d || "" }))
      : quick ? [
        quick.reuse ? { v: "reuse", t: "沿用上一局", d: "上一套打法原样再来一遍，省脑子，也省得对面摸清你" } : null,
        quick.aide ? { v: "aide", t: "助教代 BP", d: "交给助教按数据选，稳，但这局你没什么手感加成" } : null,
        quick.sim ? { v: "sim", t: "模拟本场", d: "先在训练室过一遍这套阵容，赌一把成功率" } : null
      ].filter(Boolean) : [];
    /* 第 2 局起（quick.reuse 为真）在 ban 之前就给一键沿用，不必走完整三步 BP */
    const quickMiss = (!quickRows.length && s.step === 0)
      ? `<div class="small-note" style="margin-top:10px;color:var(--dim)">这一局没有快捷 BP：要么是第一局，要么是必须自己打的关键局。第一局和决胜局我不替你跳，前面几局能沿用的都给你放在上面了。</div>` : "";
    const quickBlock = quickRows.length ? `<div class="quick-block" style="margin-top:12px">
      <div class="between wrap" style="gap:8px">
        <span class="small-note">上一局怎么打的，这一局还认得。要不要直接用掉？</span>
        <div class="quick-row">${quickRows.map(q => `<button class="btn small ghost quick-btn" data-act="choose" data-i="0" data-v="quick:${esc(q.v)}" title="${esc(q.d)}">${esc(q.t)}</button>`).join("")}</div>
      </div>
    </div>` : "";
    if (s.step === 0) {
      const dataKnown = s.dataKnown != null ? !!s.dataKnown : (s.reveal > 0);
      return shell(`<div class="fade-in">${head}${guide}${rosters}${quickBlock}${quickMiss}
        <div class="panel flat" style="margin-top:12px">
          <div class="between wrap">
<div><span class="chip ${s.side === "blue" ? "blue" : "red"}">${s.side === "blue" ? "蓝方 · 一选" : "红方 · 后手"}</span>
            <span class="chip blue" style="margin-left:6px">对面打法：${esc((s.opp || {}).tendency || "运营")}</span>
            <span class="chip" style="margin-left:6px">我方 OVR ${s.myOvr} · 对面战力 ${s.oppPower}</span>
            ${s.decider ? `<span class="chip gold" style="margin-left:6px">决胜局 · 本轮还剩 ${s.banLeft != null ? s.banLeft : (s.banNeed != null ? s.banNeed : 3)} ban</span>` : (s.banLeft != null ? `<span class="chip">本轮还剩 ${s.banLeft} ban</span>` : "")}</div>
            <div class="small-note">${dataKnown ? "数据团队给了一份报告：多看一层 BP 倾向" : "没有数据团队，对面练什么全靠猜"}</div>
          </div>
          ${dataKnown && ((s.oppComfort || []).length || s.oppOnePick) ? `<div class="row wrap" style="gap:6px;margin-top:8px">
            ${(s.oppComfort || []).length ? `<span class="small-note">对面舒适区：</span>` : ""}
            ${(s.oppComfort || []).map(c => `<span class="chip red">${esc(typeof c === "string" ? c : ((c.n || c.hero || "") + (c.star ? " · 最熟" : "")))}</span>`).join("")}
            ${s.oppOnePick ? `<span class="chip gold">可能一选 ${esc(s.oppOnePick)}</span>` : ""}
          </div>` : ""}
          ${s.coachTip ? `<div class="small-note" style="margin-top:8px;color:var(--gold-2)">助教：${esc(s.coachTip)}</div>` : ""}
${(s.oppBans || []).length ? `<div class="row wrap" style="gap:6px;margin-top:8px">
            <span class="small-note">对面先手 ban 掉了你的：</span>
            ${s.oppBans.map(b => `<span class="chip red">${esc(b)}</span>`).join("")}
          </div>` : ""}
          ${(s.bans || []).length ? `<div class="row wrap" style="gap:6px;margin-top:6px">${s.bans.map(b => `<span class="chip">已 ban ${esc(b)}</span>`).join("")}</div>` : ""}
          <div class="match-list" style="margin-top:10px">
            ${(s.opps || []).map(x => `<div class="match-row"><span class="opp" style="width:60px">${esc(POSCN[x.pos] || x.pos)}</span><span class="dim">${esc(x.name)}</span><span class="honor">${x.ovr}</span></div>`).join("")}
          </div>
        </div>
        <div class="scene-tag" style="margin-top:16px">第一步 · ban 掉对面的英雄${s.decider ? "（决胜局 ban 三个，按掉绝活他这条线就废一半）" : ""}</div>
        <div class="opts" style="display:grid;gap:9px;margin-top:10px">
          ${(s.banOpts || []).map((o, i) => {
            const nm = o.n != null ? (o.n ? "ban " + o.n : "不 ban，留着名额") : (o.t || "");
            const vv = o.pick || (o.n != null ? "ban:" + (o.n || "") : null);
            const vAttr = vv ? ` data-v="${esc(vv)}"` : "";
            const tg = o.tag == null ? [] : (Array.isArray(o.tag) ? o.tag : [o.tag]);
            const chips = [
              o.comfort ? `<span class="chip red">对面常用</span>` : "",
              tg.filter(t => t !== "常用").map(t => `<span class="chip">${esc(t)}</span>`).join(""),
              o.star ? `<span class="chip gold">最熟</span>` : "",
              o.diff != null ? `<span class="chip">难度 ${esc(o.diff)}</span>` : "",
              o.patch != null ? `<span class="chip">版本 ${o.patch > 0 ? "+" + o.patch : o.patch}</span>` : "",
              o.d ? `<span class="chip">${esc(o.d)}</span>` : ""
            ].filter(Boolean).join("");
            return `<div class="opt"><span class="idx">${i + 1}</span>
              <button class="btn" data-act="choose" data-i="${i}"${vAttr}>${esc(nm)}
                <span class="tagline">${chips}</span>
              </button></div>`;
          }).join("")}
        </div>
      </div>`);
    }
    if (s.step === 1) {
      const hs = s.hs || s.opts || [];
      return shell(`<div class="fade-in">${head}${guide}${rosters}${quickBlock}
<div class="scene-tag" style="margin-top:14px">第二步 · 选英雄（被 ban 的已经没了，池子浅就只能硬玩）</div>
        <div class="panel flat" style="margin-top:8px">
          <div class="row wrap" style="gap:6px">
            <span class="chip ${s.side === "blue" ? "blue" : "red"}">${s.side === "blue" ? "蓝方 · 一选" : "红方 · 后手"}</span>
            <span class="chip">你的 ban：${esc(s.ban || "空 ban")}</span>
            ${(s.oppBans || []).map(b => `<span class="chip red">对面 ban ${esc(b)}</span>`).join("")}
            ${s.oppHero ? `<span class="chip gold">对面已选 ${esc(s.oppHero)}</span>` : (s.side === "blue" ? `<span class="chip">你先亮，对面后手针对你</span>` : `<span class="chip">对面还没选，你一选他必针对</span>`)}
          </div>
          <div class="small-note" style="margin-top:6px">池子里还能挑 <b style="color:var(--gold)">${(s.pool || {}).left || "?"}</b> / ${(s.pool || {}).total || "?"} 个${s.hsFallback ? " · 池子被 ban 光了，只能从剩下的里挑" : ""}</div>
        </div>
        <div class="opts" style="display:grid;gap:9px;margin-top:12px">
          ${hs.map((o, i) => {
            const nm = o.t || o.hero || o.n || "";
            const hname = o.hero || (o.n != null && o.n !== "" ? o.n : null);
            const vv = o.pick || (hname ? "hero:" + hname : null);
            const vAttr = vv ? ` data-v="${esc(vv)}"` : "";
            const chips = [
              o.prof != null ? `<span class="chip ${o.prof >= 80 ? "gold" : "blue"}">熟练 ${Math.round(o.prof)}</span>` : "",
              o.ctr != null ? `<span class="chip ${o.ctr > 0 ? "green" : o.ctr < 0 ? "red" : ""}">克制 ${o.ctr > 0 ? "+" : ""}${o.ctr}%</span>` : "",
              o.diff != null ? `<span class="chip">难度 ${esc(o.diff)}</span>` : "",
              o.patch != null ? `<span class="chip">版本 ${o.patch > 0 ? "+" + o.patch : o.patch}</span>` : "",
              o.synergy ? `<span class="chip green">${esc(o.synergy)}</span>` : "",
              (o.tags || (o.tag ? [o.tag] : [])).filter(t => t && t !== "本命").map(t => `<span class="chip">${esc(t)}</span>`).join(""),
              o.d ? `<span class="chip">${esc(o.d)}</span>` : ""
            ].filter(Boolean).join("");
            return `<div class="opt"><span class="idx">${i + 1}</span>
              <button class="btn" data-act="choose" data-i="${i}"${vAttr}>${esc(nm)}${o.main || (hname && hname === S.mainHero) ? ' <span class="chip gold">本命</span>' : ""}
<span class="tagline">${chips}</span>
                ${o.ctrWhy ? `<span class="tagline" style="color:var(--dim)">${esc(o.ctrWhy)}</span>` : ""}
              </button></div>`;
          }).join("")}
        </div>
        <div class="right" style="margin-top:14px;text-align:right"><button class="btn small" style="width:auto" data-act="choose" data-i="0" data-v="back">回去重 ban</button></div>
      </div>`);
    }
    const info = s.oppHeroInfo || null;
    const myH = s.myHero || s.hero || "";
    const qprob = info && info.prob != null ? probNum(info.prob) : null;
    const SNow = G.getState() || {};
    const myPow = Math.round(G.myTeamPower ? G.myTeamPower() : 70);
    const oppPow = Math.round(s.oppPower || (s.opp && G.teamPower ? G.teamPower(s.opp.id) : 0) || 0);
    const paper = oppPow ? myPow - oppPow : null;
    const ctrD = info && info.ctr && info.ctr.d != null ? Number(info.ctr.d) : 0;
    const edgeNum = v => { const n = Number(v) || 0; return Math.abs(n) <= 1 ? n * 100 : n; };
    const edges = (s.opts || []).map(o => edgeNum(o.edge));
    const bestEdge = edges.length ? Math.max.apply(null, edges) : 0;
    const worstEdge = edges.length ? Math.min.apply(null, edges) : 0;
    const eB = energyBandOf(SNow.energy);
    const bpFactors = factorPanel("这把的胜负手", "别急着点。纸面、对位、战术、状态，这四样里哪一项在帮你、哪一项在拖你，先看清楚再选；看不懂就按绿色的那一条走。", [
      { k: "纸面", v: paper == null ? "待定" : ((paper >= 0 ? "+" : "") + paper), tone: paper == null ? "warn" : paper >= 0 ? "good" : "bad", note: "我方队伍强度 " + myPow + "，对面 " + (oppPow || "待定") + "；纸面只决定起点，不决定结局。" },
      { k: "对位", v: ctrD === 0 ? "五五开" : (ctrD > 0 ? "你 +" + ctrD : "对面 +" + Math.abs(ctrD)), tone: ctrD > 0 ? "good" : ctrD < 0 ? "bad" : "warn", note: info && info.ctr && info.ctr.why ? info.ctr.why : "对面还没亮英雄，或者这组对位没什么明显的克制。" },
      { k: "战术", v: Math.round(bestEdge) > 0 ? "+" + Math.round(bestEdge) : (Math.round(worstEdge) < 0 ? Math.round(worstEdge) : "0"), tone: bestEdge > 0 ? "good" : worstEdge < 0 ? "bad" : "warn", note: "这是三套战术里最好/最差的那一档；选之前先看对面想打什么，别只看自己顺手。" },
      { k: "状态", v: eB.name || "正常", tone: eB.key === "peak" || eB.key === "normal" ? "good" : eB.key === "tired" ? "warn" : "bad", note: "精力 " + Math.round(SNow.energy || 0) + "，心态 " + Math.round(SNow.morale || 0) + "；低精力会让你在第五局手抖，这不是玄学。" }
    ]);
    return shell(`<div class="fade-in">${head}${guide}${rosters}${quickBlock}
      <div class="scene-tag" style="margin-top:14px">第三步 · 这局怎么打</div>
      <div class="panel flat" style="margin-top:8px">
        <div class="row wrap" style="gap:6px">
          <span class="chip gold">你的 ${esc(myH)}</span>
          <span class="chip ${s.side === "blue" ? "blue" : "red"}">${s.side === "blue" ? "蓝方" : "红方"}</span>
          <span class="chip red">对面 ${esc(s.oppHero || "还没定")}</span>
          <span class="chip blue">对面打法 ${esc((s.opp || {}).tendency || "运营")}</span>
        </div>
      </div>
      ${bpFactors}
      ${info ? `<div class="bp-info">
        <div class="between"><span class="kicker">对位信息 · ${esc(info.n || s.oppHero || "")}</span>${qprob != null ? `<span class="bpi-prob">胜率估计 ${qprob}%</span>` : ""}</div>
        <div class="row wrap" style="gap:6px;margin-top:8px">
          ${info.pos ? `<span class="chip">定位 ${esc(POSCN[info.pos] || info.pos)}</span>` : ""}
          ${info.diff != null ? `<span class="chip">难度 ${esc(info.diff)}</span>` : ""}
          ${info.patch != null ? `<span class="chip">版本 ${info.patch > 0 ? "+" + info.patch : info.patch}</span>` : ""}
          ${info.ctr && info.ctr.d != null ? `<span class="chip ${info.ctr.d > 0 ? "green" : info.ctr.d < 0 ? "red" : ""}">${info.ctr.d > 0 ? "你克制 +" : info.ctr.d < 0 ? "被克制 " : "克制 "}${info.ctr.d}%</span>` : ""}
          ${info.tag != null ? (Array.isArray(info.tag) ? info.tag : [info.tag]).filter(Boolean).map(t => `<span class="chip">${esc(t)}</span>`).join("") : ""}
        </div>
        ${(() => {
          const sg = sigList({ sig: info.sig, signature: info.sig, mains: info.sig });
          if (!sg.length) return "";
          const cf = typeof info.comfort === "number" ? Math.round(info.comfort) : (info.prof != null ? Math.round(info.prof) : null);
          return `<div class="small-note" style="margin-top:6px">对面 ${esc(info.n || s.oppHero || "")} 的本命：${sg.map(x => `<b style="color:var(--gold-2)">${esc(x)}</b>`).join(" / ")}${cf != null ? `（熟练度 ${cf}）` : ""}</div>`;
        })()}
        ${info.ctr && info.ctr.why ? `<div class="small-note" style="margin-top:6px">${esc(info.ctr.why)}</div>` : ""}
      </div>` : ""}
      <div class="opts" style="display:grid;gap:9px;margin-top:12px">
        ${(s.opts || []).map((o, i) => {
          const vAttr = o.k ? ` data-v="tac:${esc(o.k)}"` : "";
          return `<div class="opt"><span class="idx">${i + 1}</span>
          <button class="btn" data-act="choose" data-i="${i}"${vAttr}>${esc(o.t || o.n || "")}
            <span class="tagline"><span class="chip ${o.edge > 0 ? "green" : o.edge < 0 ? "red" : ""}">克制 ${o.edge > 0 ? "+" : ""}${o.edge}%</span><span class="chip">${esc(o.why || "")}</span><span class="chip">${esc(o.d || "")}</span></span>
          </button></div>`;
        }).join("")}
      </div>
      ${quickRows.length ? `<div class="quick-row">${quickRows.map(q => `<button class="btn small ghost quick-btn" data-act="choose" data-i="0" data-v="quick:${esc(q.v)}" title="${esc(q.d)}">${esc(q.t)}</button>`).join("")}</div>` : ""}
      <div class="right" style="margin-top:14px;text-align:right"><button class="btn small" style="width:auto" data-act="choose" data-i="0" data-v="back">换英雄</button></div>
    </div>`);
  }

  /* ---------- 局内节点 ---------- */
  /* ---------- 名场面 ---------- */
  const HL_KIND = { flip: "让二追三", clutch: "决胜局", upset: "爆冷", main: "本命", worlds: "世界赛", crit: "单杀" };
  function renderHighlight(s) {
    const hl = s.hl || {};
    const kind = HL_KIND[hl.kind] || "名场面";
    return shell(`<div class="fade-in">
      <div class="between">
        <div><div class="kicker">这一幕会被人反复剪出来</div>
        <h2 style="margin:5px 0 0" class="res w">${esc(kind)}</h2></div>
        <div class="chip gold">${esc(hl.hero || "")}</div>
      </div>
      <div class="panel" style="margin-top:12px">
        <div class="story">${br(hl.text || "")}</div>
        <div class="row wrap" style="margin-top:12px">
          <span class="chip">${esc(hl.event || "")}</span>
          <span class="chip">${esc(hl.pos ? (G.CN && G.CN[hl.pos]) || hl.pos : "")}</span>
          <span class="chip blue">${esc(hl.score || "")}</span>
          <span class="chip red">对方 ${esc(hl.opp || "")}</span>
        </div>
      </div>
      <div class="panel flat" style="margin-top:10px"><div class="small-note">已记入生涯名场面，结局和档案室都会用到它。</div></div>
      <button class="btn gold" style="margin-top:14px" data-act="choose" data-i="0" data-v="hl">继续</button>
    </div>`);
  }

  /* ---------- 打法风格 ---------- */
  function renderStyle(s) {
    const cur = s.cur;
    return shell(`<div class="fade-in">
      <div class="kicker">策略</div>
      <h2 style="margin:5px 0 14px">这支队怎么打？</h2>
      <div class="grid2">
        ${(s.opts || []).map((o, i) => `<div class="panel ${cur === o.k ? "" : "flat"}" style="margin:0${cur === o.k ? ";border-color:var(--gold)" : ""}">
          <div class="between"><div class="scene-tag">${esc(o.name)}${cur === o.k ? " · 当前" : ""}</div><span class="chip">${esc(o.desc)}</span></div>
          <div class="small-note" style="margin:8px 0">吃 ${esc(o.beats)} · 代价：${esc(o.cost)}</div>
          <button class="btn ${cur === o.k ? "gold" : ""}" data-act="choose" data-i="${i}">${cur === o.k ? "就这个" : "改成" + esc(o.name)}</button>
        </div>`).join("")}
      </div>
      <button class="btn" style="margin-top:14px" data-act="choose" data-i="0" data-v="back">不改了，回去</button>
    </div>`);
  }

  /* ---------- 赛前布置 ---------- */
  function renderPrep(s) {
    const rows = s.rows || [];
    const tacs = s.tacs || s.tacCards || s.tactics || s.opts || null;
    return shell(`<div class="fade-in">${guideHTML(s)}
      <div class="between">
        <div><div class="kicker">赛前 · BO5</div><h2 style="margin:5px 0 0">对 ${esc(s.oppName)}</h2></div>
        <div class="row"><span class="chip">对面倾向 ${esc(s.tendency || "")}</span><span class="chip">教练 ${esc(s.coach || "")}</span>${s.styleName ? `<span class="chip gold">我方 ${esc(s.styleName)}</span>` : ""}</div>
      </div>
      ${rostersBlock(s)}
      <div class="panel" style="margin-top:12px">
        <div class="scene-tag">他们最强 / 你最弱</div>
        <div class="row wrap" style="margin-top:8px">
          <span class="chip red">对方 ${esc((s.best || {}).name || "")} ${Math.round((s.best || {}).b || 0)}</span>
          <span class="chip blue">我方 ${esc((s.worst || {}).name || "")} ${Math.round((s.worst || {}).a || 0)}</span>
        </div>
        <div style="margin-top:10px">${rows.map(r => `<div class="between" style="margin-top:5px"><span class="small-note">${esc(r.name)}</span><span class="mono" style="font-size:12px">${r.a} / ${r.b}</span></div>`).join("")}</div>
      </div>
      <div class="panel" style="margin-top:10px">
        <div class="scene-tag">这一场你打算怎么准备</div>
        <div class="opts" style="display:grid;gap:9px;margin-top:12px">
          ${tacs && (Array.isArray(tacs) ? tacs.length : false) ? tacs.map((o, i) => {
            const vv = o.v || o.k || o.key || null;
            const nm = o.t || o.name || o.title || "";
            const dd = o.d || o.desc || o.text || "";
            const prN = probNum(o.p != null ? o.p : o.prob);
            return `<div class="opt"><span class="idx">${i + 1}</span>
              <button class="btn" data-act="choose" data-i="${i}"${vv ? ` data-v="${esc(vv)}"` : ""}>${esc(nm)}
                ${dd ? `<span class="tagline">${esc(dd)}</span>` : ""}
                ${prN != null ? `<span class="tagline"><span class="chip ${prN >= 60 ? "green" : prN >= 45 ? "blue" : "red"}">成功率 ${prN}%</span>${o.edge != null && isFinite(Number(o.edge)) ? `<span class="chip">克制 ${Number(o.edge) > 0 ? "+" : ""}${Math.round(Number(o.edge))}%</span>` : ""}</span>` : ""}
              </button></div>`;
          }).join("") : `
          <button class="btn" data-act="choose" data-i="0">针对他们的核心<span class="tagline">把对面最强那一环按掉 8 点，赌他站不出来</span></button>
          <button class="btn" data-act="choose" data-i="1">补自己的短板<span class="tagline">自己最弱那一环 +7，别让人从这里撕开</span></button>
          <button class="btn" data-act="choose" data-i="2">藏一手底牌<span class="tagline">决胜局 +4% 成功率，但前几局没有额外加成</span></button>`}
        </div>
        ${s.canCoach || s.coachCall ? `<div class="right" style="margin-top:10px"><button class="btn small ghost" style="width:auto" data-act="choose" data-i="0" data-v="coach">临场指挥 · 让教练在台上喊</button></div>` : ""}
      </div>
      <button class="btn" style="margin-top:12px" data-act="choose" data-i="0" data-v="back">算了，直接放假</button>
    </div>`);
  }

  /* ---------- 随机大事件 ---------- */
  const BECAT = { scandal: "塌房", finance: "钱", transfer: "转会", patch: "版本", league: "赛事", media: "舆论", team: "队内", health: "身体" };
  function renderBigevent(s) {
    return shell(`<div class="fade-in">
      <div class="between">
        <div><div class="kicker">大事件 · ${esc(BECAT[s.cat] || s.cat || "")}</div>
        <h2 style="margin:5px 0 0">${esc(s.title || "")}</h2></div>
        <span class="chip red">躲不掉</span>
      </div>
      <div class="panel" style="margin-top:12px;border-color:rgba(240,195,60,.45)">
        <div class="story">${br(s.text || "")}</div>
        ${s.sub ? `<div class="small-note" style="margin-top:10px;color:var(--gold)">${esc(s.sub)}</div>` : ""}
      </div>
      <div class="panel" style="margin-top:10px">
        <div class="scene-tag">你怎么处理</div>
        <div class="opts" style="display:grid;gap:9px;margin-top:12px">
          ${(s.opts || []).map((o, i) => `<div class="opt"><span class="idx">${i + 1}</span>
            <button class="btn" data-act="choose" data-i="${i}">${esc(o.t)}
              ${o.d ? `<span class="tagline"><span class="chip gold">${esc(o.d)}</span></span>` : ""}
            </button></div>`).join("")}
        </div>
      </div>
    </div>`);
  }

  /* ---------- 局内节点 ---------- */
  function renderInGame(s) {
    const mom = Math.round(s.mom || 0);
    const momMax = 160;
    /* 赛前部署（phase=plan）：4 选 1 战术，决胜局多一张「临场指挥」 */
    if (s.phase === "plan") {
      const opts = s.opts || s.plans || [];
      const note = s.text || s.note || "";
      return shell(`<div class="fade-in">${guideHTML(s)}
        <div class="between wrap">
          <div><div class="kicker">BO${s.bestOf || 5} 第 ${s.g || 1} 局 · 赛前部署${s.decider ? " · 决胜局" : ""}</div>
          <h2 style="margin:5px 0 0">这一局怎么打，你说了算</h2></div>
          <div class="row"><span class="chip blue">${esc(s.myHero || s.hero || "")}</span><span class="dim">vs</span><span class="chip red">${esc(s.oppHero || "")}</span></div>
        </div>
        ${rostersBlock(s)}
        ${note ? `<div class="panel" style="margin-top:12px"><div class="scene-tag">教练赛前交代</div><div class="story">${br(note)}</div></div>` : ""}
        <div class="panel" style="margin-top:10px">
          <div class="scene-tag">本局战术 · 选一个</div>
          <div class="opts" style="display:grid;gap:9px;margin-top:12px">
            ${opts.map((o, i) => {
        const k = o.k || "";
        const dd = o.d || o.text || o.desc || "";
        const pl = probTxt(o.p != null ? o.p : o.pct);
        const dim = o.dim || o.dimName || "";
        return `<div class="opt"><span class="idx">${i + 1}</span>
              <button class="btn" data-act="choose" data-i="${i}" data-v="plan:${esc(k)}">${esc(o.n || o.t || "")}
                ${dd ? `<span class="tagline">${esc(dd)}</span>` : ""}
                <span class="tagline"><span class="chip ${o.k === "command" ? "gold" : "blue"}">${esc(dim ? dimCN(dim) : "全局")}</span>${o.k === "command" ? `<span class="chip red">消耗教练信任 ${Number(o.coachCost || 0) || 8}</span>` : `<span class="chip dim">预估成效 ${pl}</span>`}</span>
              </button></div>`;
      }).join("")}
          </div>
        </div>
      </div>`);
    }
    /* 资源决策（phase=resource）：5 选 1 */
    if (s.phase === "resource") {
      const opts = s.opts || s.res || [];
      const note = s.text || s.note || "";
      return shell(`<div class="fade-in">${guideHTML(s)}
        <div class="between wrap">
          <div><div class="kicker">BO${s.bestOf || 5} 第 ${s.g || 1} 局 · 资源决策</div>
          <h2 style="margin:5px 0 0">开局第一个资源点，怎么分配</h2></div>
          <div class="row"><span class="chip blue">${esc(s.myHero || s.hero || "")}</span><span class="dim">vs</span><span class="chip red">${esc(s.oppHero || "")}</span></div>
        </div>
        ${rostersBlock(s)}
        ${note ? `<div class="panel" style="margin-top:12px"><div class="story">${br(note)}</div></div>` : ""}
        <div class="panel" style="margin-top:10px">
          <div class="scene-tag">这一波资源 · 选一个</div>
          <div class="opts" style="display:grid;gap:9px;margin-top:12px">
            ${opts.map((o, i) => {
        const k = o.k || "";
        const dd = o.d || o.text || o.desc || "";
        const dim = o.dim || o.dimName || "";
        const mv = Number(o.mom);
        return `<div class="opt"><span class="idx">${i + 1}</span>
              <button class="btn" data-act="choose" data-i="${i}" data-v="res:${esc(k)}">${esc(o.n || o.t || "")}
                ${dd ? `<span class="tagline">${esc(dd)}</span>` : ""}
                <span class="tagline"><span class="chip">${esc(dim ? dimCN(dim) : "全局")}</span>${isFinite(mv) && mv ? `<span class="chip ${mv > 0 ? "green" : "red"}">局势 ${mv > 0 ? "+" : ""}${mv}</span>` : ""}</span>
              </button></div>`;
      }).join("")}
          </div>
        </div>
      </div>`);
    }
    return shell(`<div class="fade-in">${guideHTML(s)}
      <div class="between">
        <div><div class="kicker">第 ${s.g} 局 · BO${s.bestOf} · 局势</div>
        <h2 style="margin:5px 0 0">${esc(s.title || "")} ${esc(s.score || "")}</h2></div>
        <div class="row"><span class="chip blue">${esc(s.hero || "")}</span><span class="dim">vs</span><span class="chip red">${esc(s.oppHero || "")}</span></div>
      </div>
      ${rostersBlock(s)}
      <div style="margin:12px 0">
        <div class="between" style="margin-bottom:4px"><span class="small-note">局势值</span><span class="mono" style="color:${mom >= 0 ? "var(--green,#5fdca0)" : "var(--red,#ff6f6f)"}">${mom > 0 ? "+" : ""}${mom}</span></div>
        ${barHTML(Math.max(0, Math.min(100, (mom + 100) / 2)), mom >= 0 ? "green" : "red")}
      </div>
      <div class="panel">
        ${s.node ? `<div class="scene-tag">${esc(s.node.t || "")}</div>` : ""}
        <div class="story">${br((s.sit || {}).d || (s.node ? s.node.text : "") || "")}</div>
        <div class="opts" style="display:grid;gap:9px;margin-top:14px">
          ${(s.opts || []).map((o, i) => `<div class="opt"><span class="idx">${i + 1}</span>
            <button class="btn" data-act="choose" data-i="${i}">${esc(o.t)}
              <span class="tagline"><span class="chip ${probNum(o.p) != null && probNum(o.p) >= 60 ? "green" : probNum(o.p) != null && probNum(o.p) >= 45 ? "blue" : "red"}">成功率 ${probTxt(o.p)}</span><span class="chip dim">区间 ${probTxt(o.pLo)}–${probTxt(o.pHi)}</span><span class="chip">${esc(o.dimName || "")}</span>${o.risk === "gamble" ? '<span class="chip gold">赌</span>' : o.risk === "pos" ? '<span class="chip red">位置</span>' : ""}${tagsHTML(o.tags)}</span>
              ${o.cost && Object.keys(o.cost).length ? `<span class="tagline dim" style="display:block;margin-top:5px">代价先付：${esc(effCN(o.cost))}</span>` : ""}
            </button></div>`).join("")}
        </div>
      </div>
      <div class="panel flat" style="margin-top:12px">
        <div class="between wrap">
          <div class="small-note">这把只能赌一次的资源，用还是不用？</div>
          <div class="row">
            <button class="btn small" style="width:auto" data-act="choose" data-i="0" data-v="pause" ${s.can && s.can.pause ? "" : "disabled"}>战术暂停 · 教练信任 −6</button>
            <button class="btn small" style="width:auto" data-act="choose" data-i="0" data-v="burn" ${s.can && s.can.burn ? "" : "disabled"}>透支 · 体力 −12</button>
            <button class="btn small" style="width:auto" data-act="choose" data-i="0" data-v="shout" ${s.can && s.can.shout ? "" : "disabled"}>喊话 · 话语权 −8</button>
          </div>
        </div>
      </div>
      ${(s.canCoach || s.coachCall) ? `<div class="row" style="margin-top:10px"><button class="btn small ghost" style="width:auto" data-act="choose" data-i="0" data-v="coach">临场指挥 · 让教练在台上喊两句</button></div>` : ""}
      ${(s.log || []).length ? `<div class="panel flat" style="margin-top:10px">${s.log.map(l => `<div class="small-note">· ${esc(l)}</div>`).join("")}</div>` : ""}
    </div>`);
  }

  /* ---------- 名场面：BO5 决胜局的处刑池 ---------- */
  const MOMENT_TAG = { send: "送了", throw: "浪输", clutch: "抓机会", steal: "偷", solo: "单杀", teamfight: "团战", bounce: "打回来", stomp: "碾了", upset: "爆冷" };
  function renderMoment(s) {
    const mom = Math.round(s.mom || 0);
    return shell(`<div class="fade-in moment-wrap">
      <div class="moment-kicker">KEY MOMENT · 决胜局 · 这一帧会被剪进集锦</div>
      <h1 class="moment-title">${esc(s.title || "")}</h1>
      <div class="row wrap" style="gap:6px;margin:2px 0 12px">
        <span class="chip gold">BO${s.bestOf || 5} 第 ${s.g || 5} 局</span>
        <span class="chip">比分 ${esc(s.score || "")}</span>
        <span class="chip ${s.tag === "send" || s.tag === "throw" ? "red" : "blue"}">${esc(MOMENT_TAG[s.tag] || "关键时刻")}</span>
        <span class="chip dim">局势值 ${mom > 0 ? "+" : ""}${mom}</span>
      </div>
      <div class="panel moment-panel">
        <div class="story">${br(s.text || "")}</div>
      </div>
      <div class="opts" style="display:grid;gap:9px;margin-top:14px">
        ${(s.opts || []).map((o, i) => `<div class="opt"><span class="idx">${i + 1}</span>
          <button class="btn" data-act="choose" data-i="${i}">${esc(o.t)}
            <span class="tagline"><span class="chip ${probNum(o.p) != null && probNum(o.p) >= 60 ? "green" : probNum(o.p) != null && probNum(o.p) >= 45 ? "blue" : "red"}">成功率 ${probTxt(o.p)}</span><span class="chip">${esc(o.dimName || "")}</span>${o.risk === "high" ? '<span class="chip red">高风险</span>' : ""}</span>
          </button></div>`).join("")}
      </div>
      <div class="small-note" style="margin-top:10px">决胜局的每个选择都会被记住。赛后会有人截这一帧。</div>
    </div>`);
  }

  /* ---------- 单局结算 ---------- */
  function renderBoGame(s) {
    const rows = s.rows || [];
    const ctr = s.ctr || { d: 0, why: "" };
    const diffs = rows.map(r => ({ name: r.name, d: Number(r.a || 0) - Number(r.b || 0) })).sort((a, b) => b.d - a.d);
    const best = diffs[0] || null, worst = diffs[diffs.length - 1] || null;
    const boFactors = rows.length ? factorPanel("这把为什么是这个结果", "别只看比分。下面这几项是这把真正拉开差距的地方，赢在哪、输在哪，都写清楚；下一把照着改，别凭感觉。", [
      best ? { k: "最大优势", v: (best.d >= 0 ? "+" : "") + best.d, tone: best.d >= 0 ? "good" : "bad", note: "「" + best.name + "」是全队相对对面最明显的一条线，赛前布置和选手状态都算在里面。" } : null,
      worst ? { k: "最大短板", v: (worst.d >= 0 ? "+" : "") + worst.d, tone: worst.d < 0 ? "bad" : "good", note: "「" + worst.name + "」被对面压住了；如果只差这一项，下一把的 ban/pick 和战术就该往这里补。" } : null,
      { k: "对位", v: ctr.d === 0 ? "五五开" : (ctr.d > 0 ? "你 +" + Math.round(ctr.d) : "对面 +" + Math.abs(Math.round(ctr.d))), tone: ctr.d > 0 ? "good" : ctr.d < 0 ? "bad" : "warn", note: ctr.why || "这组中野/下路对位没有明显的克制关系，胜负更多看团战和资源。" },
      { k: "胜负", v: s.win ? "赢了" : "输了", tone: s.win ? "good" : "bad", note: "赛前模型给的成功率是 " + probTxt(s.p) + "；模型只看概率，真打起来还有爆冷、失误和一口气。" }
    ].filter(Boolean)) : "";
    return shell(`<div class="fade-in">
      <div class="between">
        <div><div class="kicker">${esc(s.title || "")} · 第 ${s.g} 局</div>
        <h2 style="margin:5px 0 0" class="res ${s.win ? "w" : "l"}">${s.win ? "拿下" : "丢了"}</h2></div>
        <div style="text-align:right"><div class="mono" style="font-size:20px">${s.wins}-${s.losses}</div><div class="small-note">阵容 ${esc(s.hero || "")} vs ${esc(s.oppHero || "")}</div></div>
      </div>
      ${s.upset ? `<div class="panel flat" style="margin-top:10px;border-color:rgba(240,195,60,.6)"><span class="chip gold">爆冷</span> <span class="dim">数据全线落后，但你赢了。这就是这游戏的魅力。</span></div>` : ""}
      ${boFactors}
      <div class="panel" style="margin-top:12px">
        <div class="scene-tag">双方实力对比</div>
        ${rows.map(r => `<div style="margin-top:8px">
          <div class="between" style="margin-bottom:3px"><span class="small-note">${esc(r.name)}</span>
          <span class="mono" style="font-size:12px"><b style="color:${r.a >= r.b ? "var(--gold)" : "inherit"}">${r.a}</b> / ${r.b}</span></div>
          <div class="row" style="gap:4px">${barHTML(Math.min(100, r.a), "blue")}${barHTML(Math.min(100, r.b), "red")}</div>
        </div>`).join("")}
      </div>
      <div class="panel flat" style="margin-top:10px">
        <span class="chip">本场关键</span>
        <span class="dim" style="font-size:13px">胜率 ${probTxt(s.p)} · 局势值 ${Math.round(Number(s.mom) || 0)} · 英雄克制 ${ctr.d > 0 ? "+" : ""}${Math.round(Number(ctr.d) || 0)}%${ctr.why ? "（" + esc(ctr.why) + "）" : ""}</span>
        <div style="margin-top:6px">${tagsHTML(s.keyVars)}</div>
      </div>
      <div class="right" style="margin-top:18px;text-align:right"><button class="btn primary small" data-act="choose" data-i="0">继续</button></div>
    </div>`);
  }

  /* ---------- 世界赛流程图 ---------- */
  function renderWorldsMap(s) {
    const rows = s.rows || [], br = s.bracket;
    const grp = { "3-0": [], "3-1": [], "3-2": [], "2-2": [], "1-2": [] };
    rows.forEach(r => { const k = r.w + "-" + r.l; if (grp[k]) grp[k].push(r); });
    const pairHTML = arr => (arr || []).map(p => {
      if (!p) return `<div class="match-row"><span class="dim">待定</span></div>`;
      const a = p.a || p, b = p.b;
      if (!b) return `<div class="match-row"><span class="opp">${esc(a.name || a)}</span><span class="honor">晋级</span></div>`;
      return `<div class="match-row"><span class="opp">${esc(a.name)} <span class="dim">vs</span> ${esc(b.name)}</span><span class="honor">${esc(p.score || "")}</span></div>`;
    }).join("");
    const roundName = ["瑞士轮", "八强", "四强", "决赛"][s.round || 0] || "";
    const stageLabel = s.stageLabel || roundName;
    const swissDone = !!(br && br.qf);
    return shell(`<div class="fade-in">
      <div class="kicker">世界赛 · 现在的进度：${esc(stageLabel)}</div>
      <h2 style="margin:5px 0 4px">16 队，只有 8 个位置</h2>
      <p class="dim">赢三场出线，输三场回家。3-0 的队伍直接进八强，2-2 的最后一把是真刀真枪。</p>
      <div class="panel" style="margin-top:12px">
        ${["3-0", "3-1", "3-2", "2-2", "1-2"].filter(k => (grp[k] || []).length).map(k => `<div class="between wrap" style="margin-top:8px">
          <span class="chip gold">${k}</span>
          <div class="row wrap" style="gap:6px;flex:1;justify-content:flex-end">${grp[k].map(r => `<span class="chip ${r.mine ? "gold" : r.out ? "" : "blue"}">${esc(r.name)}</span>`).join(" ")}</div>
        </div>`).join("")}
      </div>
      ${swissDone ? `<div class="panel flat" style="margin-top:12px">
        <div class="scene-tag">淘汰赛</div>
        <div style="margin-top:8px"><div class="small-note">八强</div>${pairHTML(br.qf)}</div>
        ${br.sf ? `<div style="margin-top:8px"><div class="small-note">四强</div>${pairHTML(br.sf)}</div>` : ""}
        ${br.f ? `<div style="margin-top:8px"><div class="small-note">决赛</div>${pairHTML(br.f)}</div>` : ""}
      </div>` : `<div class="panel flat" style="margin-top:12px"><span class="chip">淘汰赛对阵待定</span> <span class="small-note">瑞士轮打完才排种子，现在谁碰谁都不知道。</span></div>`}
      <div class="row between" style="margin-top:18px;gap:10px">
        <div class="row">${s.canTree ? `<button class="btn small" style="width:auto" data-act="choose" data-i="0" data-v="tree">看赛程树</button>` : `<span class="small-note">${esc(s.canTreeNote || "赛程树还没解锁，打完这轮再看。")}</span>`}</div>
        <button class="btn primary small" style="width:auto" data-act="choose" data-i="0">继续</button>
      </div>
    </div>`);
  }

  /* ---------- 世界赛赛程树 ---------- */
  function renderWorldsTree(s) {
    const rounds = s.rounds || [];
    const teamRow = (tm, win, score) => {
      if (!tm) return `<div class="br-team tbd"><span class="nm">待定</span><span class="sc">-</span></div>`;
      return `<div class="br-team ${win ? "win" : ""} ${tm.mine ? "mine" : ""}">
        <span class="nm">${esc(tm.name)}</span>
        <span class="sc">${score == null ? "" : score}</span>
      </div>`;
    };
    const matchCard = (m) => {
      const aWin = m.winA === true, bWin = m.winA === false;
      return `<div class="br-match">
        ${teamRow(m.a, aWin, m.wa)}
        ${teamRow(m.b, bWin, m.wb)}
        ${m.upset ? '<span class="br-upset">爆冷</span>' : ""}
      </div>`;
    };
    const stageLabel = s.stageLabel || "";
    const swissNotDone = /瑞士轮/.test(stageLabel) || !(rounds.length && (rounds[0].matches || []).length);
    return shell(`<div class="fade-in">
      <div class="between wrap">
        <div><div class="kicker">世界赛 ${esc(String(s.year || ""))} · ${esc(stageLabel || "淘汰赛对阵")}</div>
        <h2 style="margin:5px 0 4px">整棵树</h2></div>
        <div class="chip gold">实时</div>
      </div>
      <p class="dim">${swissNotDone ? "瑞士轮还没打完，种子没排，对阵和冠军都是空的。打完才排得出来。" : "你自己打的那几场按真实比分走；别人没打完的，按各队数值加爆冷概率推。实力差 3 点以上被翻，标「爆冷」。"}</p>
      <div class="bracket" style="margin-top:14px">
        ${rounds.map(r => `<div class="br-col">
          <div class="br-round">${esc(r.name)}<span class="dim mono">${esc(r.en || "")}</span></div>
          <div class="br-list">${(r.matches || []).map(matchCard).join("") || '<div class="br-match empty">待定</div>'}</div>
        </div>`).join("")}
        <div class="br-col br-champ">
          <div class="br-round">冠军</div>
          <div class="br-list"><div class="br-champ-card ${s.champion && s.champion.mine ? "mine" : ""}">
            <span class="dim small-note">${s.champion ? "冠军" : "对阵待定"}</span>
            <b>${s.champion ? esc(s.champion.name) : "待定"}</b>
            ${s.champion ? `<span class="small-note">评分 ${s.champion.power}</span>` : ""}
          </div></div>
        </div>
      </div>
      <div class="right" style="margin-top:18px;text-align:right"><button class="btn small" style="width:auto" data-act="choose" data-i="0" data-v="back">回到积分榜</button></div>
    </div>`);
  }

  /* ---------- 商店 ---------- */
  function renderShop(s) {
    const S = G.getState() || {};
    const m0 = Math.round(s.money == null ? 0 : s.money);
    const mb = (s.moneyBand && s.moneyBand.name) ? s.moneyBand : moneyBandOf(m0);
    const items = s.items || [];
    const lines = (s.feedback && s.feedback.lines) || [];
    return shell(`<div class="fade-in">${guideHTML(s)}
      <div class="between">
        <div><div class="kicker">${s.ml ? s.ml.year + " 年 " + s.ml.month + " 月" : ""} · 本月采购</div>
        <h2 style="margin:5px 0 0">钱要用出去</h2></div>
        <div style="text-align:right"><div class="mono gold" style="font-size:20px;color:${mb.color || "var(--gold)"}">${m0} 万</div><div class="small-note">存款 · ${esc(mb.name || "")}</div></div>
      </div>
      <p class="dim" style="margin-top:8px">一个月只能买一样。买之前想清楚，这钱是你三年的青春换的。</p>
      ${lines.length ? `<div class="feedback-panel" style="margin-top:10px"><span class="kicker">上一笔钱换来的</span>${lines.map(l => `<div class="note-line">· ${esc(l)}</div>`).join("")}</div>` : ""}
      <div class="scene-tag" style="margin-top:14px">本期货架 · ${items.length} 样${items.some(it => it.once) ? " · 一次性商品买过就不再上架" : ""}</div>
      <div style="display:grid;gap:10px;margin-top:10px">
        ${items.map((it, i) => {
          const nm = it.n || it.name || "";
          const ds = it.d || it.desc || "";
          const afford = s.money >= it.price;
          const bought = !!it.bought && !!it.once;
          const chips = [
            `<span class="chip ${afford ? "blue" : "red"}">${esc(it.price)} 万</span>`,
            it.once ? `<span class="chip">一次性</span>` : "",
            bought ? `<span class="chip dark">已拥有</span>` : "",
            it.detail ? `<span class="chip">${esc(it.detail)}</span>` : ""
          ].filter(Boolean).join("");
          const inv = it.eff && it.eff.invest;
          const effShown = Object.assign({}, it.eff || {});
          if (inv) { delete effShown.invest; delete effShown.investAmt; }
          const invChip = inv ? `<div class="invest-note"><span class="chip gold">资产</span><span class="small-note">${inv === "acad" ? "一次性 · 四百万买支青训队，可走「青训老板」退役线" : "现金转资产，季度结算。放着不动也会自己长。"}</span></div>` : "";
          return `<div class="offer" data-act="choose" data-i="${i}" style="${!afford || bought ? "opacity:.5" : ""}">
            <div class="between">
              <div class="row" style="flex:1;align-items:flex-start;gap:10px">
                ${it.icon ? `<img class="offer-ico" src="assets/icons/${esc(it.icon)}.webp" alt="" loading="lazy" decoding="async" onerror="this.style.display='none'">` : ""}
                <div style="flex:1">
                  <div style="font-weight:800;font-size:16px">${esc(nm)} ${chips}</div>
                  <div class="small-note" style="margin-top:4px">${esc(ds)}</div>
                  ${it.flavor ? `<div class="small-note" style="margin-top:3px;color:var(--dim,#8b96a3)">${esc(it.flavor)}</div>` : ""}
                  <div class="small-note" style="color:var(--gold);margin-top:3px">${esc(effCN(effShown))}</div>
                  ${invChip}
                </div>
              </div>
            </div>
          </div>`;
        }).join("")}
      </div>
      <div class="row between" style="margin-top:16px;gap:10px">
        <div class="row"><button class="btn small" style="width:auto" data-act="choose" data-i="0" data-v="skip">不买了，攒着</button>
        <button class="btn small" style="width:auto" data-act="choose" data-i="0" data-v="deck">看卡组</button></div>
        <span class="small-note">钱不花就是数字，花了才是战力</span>
      </div>
    </div>`);
  }

  /* ---------- 抽卡页 ---------- */
  function renderGachaCard(c) {
    const rc = RC(c.rarity), b = BUILDN(c.build);
    return `<div class="card-face" style="--rc:${rc.c}">
      <div class="card-art" style="background-image:url('${A.cardArt(c.build, c.id || c.name)}')" aria-hidden="true"></div>
      <div class="between"><span class="rar">${esc(rc.n)}${b ? " · " + esc(b) : ""}</span>${c.dup ? `<span class="dup">重复 · 折现 ${c.cash || 0} 元</span>` : ""}</div>
      <div class="cname">${esc(c.name)}</div>
      <div class="cdesc">${esc(c.desc || "")}</div>
      <div class="cflavor">${esc(effCN(c.eff || {}))}</div>
      ${srcLine(srcOf(c))}
    </div>`;
  }
  function renderGacha(s) {
    const pulled = s.pulled || [];
    const builds = s.builds || {};
    const bk = Object.keys(builds).filter(k => builds[k] > 0);
    return shell(`<div class="fade-in">${guideHTML(s)}
      <div class="between">
        <div><div class="kicker">抽卡 · 构筑</div><h2 style="margin:5px 0 0">券 ${s.ticket || 0} 张</h2></div>
        <div style="text-align:right"><div class="small-note">保底 ${s.pity || 0}/40 抽出金</div><div class="small-note">卡包 ${s.bag || 0} 张</div></div>
      </div>
      ${poolInfoHTML(s.poolInfo || s.pool)}
      ${bondsHTML(s)}
      ${bk.length ? `<div class="panel flat" style="margin-top:10px"><span class="chip gold">流派</span> ${bk.map(k => `<span class="chip" style="margin-left:4px">${esc(BUILDN(k))} ×${builds[k]}</span>`).join("")}</div>` : ""}
      ${pulled.length ? `<div class="draw-wrap" style="margin-top:14px">${pulled.map(c => `<div class="card-flip"><div>${renderGachaCard(c)}</div></div>`).join("")}</div>` : ""}
      ${(function(){ const cash = pulled.reduce((a,c)=>a+((c&&c.cash)||0),0); const dup = pulled.filter(c=>c&&c.dup).length; return cash ? `<div class="panel flat" style="margin-top:10px"><span class="chip gold">重复 ${dup} 张</span> <span class="small-note">折现进账 <b class="gold">${cash} 元</b>（蓝 1000 / 紫 10000 / 金 100000 / 赤 500000）</span></div>` : ""; })()}
      <div class="row" style="margin-top:18px;gap:10px">
        <button class="btn primary small" style="width:auto" data-act="choose" data-i="0" data-v="one">单抽 · 1 券</button>
        <button class="btn small" style="width:auto" data-act="choose" data-i="0" data-v="ten">十连 · 9 券</button>
        ${pulled.length ? `<button class="btn small" style="width:auto" data-act="choose" data-i="0" data-v="next">收下继续</button>` : `<button class="btn small" style="width:auto" data-act="choose" data-i="0" data-v="back">退出</button>`}
      </div>
      <div class="panel flat" style="margin-top:12px"><span class="small-note">券从比赛里来：常规赛赢一场 1 张，季后赛一场 3 张，国际赛赢一场 5 张，S 赛赢一场 8 张。抽到的卡在「卡组」里装槽才生效。</span></div>
      <div class="disclaimer" style="margin-top:8px">卡面上的「原梗」是二创整理，不是选手本人原话；标了「说话人与年份存疑」的，就当听个段子。</div>
    </div>`);
  }

  /* ---------- 卡组（5 槽构筑） ---------- */
  function renderDeck(s) {
    const deck = s.deck || [null, null, null, null, null];
    const bag = s.bag || [];
    const builds = s.builds || {};
    return shell(`<div class="fade-in">
      <div class="kicker">构筑 · 五个槽</div>
      <h2 style="margin:5px 0 4px">装进去才算数</h2>
      <p class="dim">一个槽一张，同一张卡不能装两次。同流派越多羁绊越强：两张 +5%，三张大会心，五张走极端但带副作用。想换方向就先卸下来。</p>
      ${bondsHTML(s)}
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:12px">
        ${deck.map((c, i) => c ? `<div class="panel flat" style="--rc:${RC(c.rarity).c};border-color:${RC(c.rarity).c}" data-act="choose" data-i="${i}" data-v="un">
          <div class="rar">${esc(RC(c.rarity).n)} · ${esc(BUILDN(c.build))}</div>
          <div style="font-weight:800;font-size:13px;margin-top:2px">${esc(c.name)}</div>
          <div class="small-note" style="margin-top:4px">${esc(effCN(c.eff || {}))}</div>
          <div class="small-note" style="margin-top:6px;color:var(--red,#ff6f6f)">点一下卸下</div>
        </div>` : `<div class="panel flat" style="border-style:dashed;opacity:.6"><div class="rar">空槽</div><div class="small-note" style="margin-top:6px">点下面的卡装进来</div></div>`).join("")}
      </div>
      ${Object.keys(builds).filter(k => builds[k] > 0).length ? `<div class="panel flat" style="margin-top:10px">${Object.keys(builds).filter(k => builds[k] > 0).map(k => `<span class="chip" style="margin-right:5px">${esc(BUILDN(k))} ×${builds[k]}</span>`).join("")}</div>` : ""}
      <div class="scene-tag" style="margin-top:16px">卡包 · ${bag.length} 张</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:8px">
        ${bag.map(c => { const inDeck = (deck || []).some(x => x && x.id === c.id); return `<div class="panel flat" style="--rc:${RC(c.rarity).c};cursor:pointer;${inDeck ? "opacity:.42" : ""}" data-act="choose" data-i="0" data-v="${esc(c.id)}">
          <div class="rar" style="color:${RC(c.rarity).c}">${esc(RC(c.rarity).n)} · ${esc(BUILDN(c.build))}</div>
          <div style="font-weight:800;font-size:13px;margin-top:2px">${esc(c.name)}</div>
          <div class="small-note" style="margin-top:3px">${esc(effCN(c.eff || {}))}</div>
          ${inDeck ? '<div class="small-note" style="margin-top:4px;color:var(--gold)">已装槽</div>' : ""}
        </div>`; }).join("")}
      </div>
      <div class="right" style="margin-top:18px;text-align:right"><button class="btn primary small" data-act="choose" data-i="0" data-v="back">回到行动</button></div>
    </div>`);
  }

  /* ---------- 练英雄 ---------- */
  function renderTrainHero(s) {
    return shell(`<div class="fade-in">
      <div class="kicker">训练房 · 英雄池</div>
      <h2 style="margin:5px 0 4px">练到 85 就是本命</h2>
      <p class="dim">一局只能带一个本命，成功率 +8%，爆种消耗减半。英雄池越深，版本怎么改都饿不死你。</p>
      <div class="opts" style="display:grid;gap:9px;margin-top:14px">
        ${(s.opts || []).map((o, i) => `<div class="opt"><span class="idx">${i + 1}</span>
          <button class="btn" data-act="choose" data-i="${i}">${esc(o.n)}${o.n === s.main ? ' <span class="chip gold">本命</span>' : ""}
            <span class="tagline"><span class="chip ${o.isNew ? "" : o.prof >= 80 ? "gold" : "blue"}">${o.isNew ? "没玩过 · 从 40 起" : "熟练 " + Math.round(o.prof)}</span></span>
          </button></div>`).join("")}
      </div>
      <div class="right" style="margin-top:14px;text-align:right"><button class="btn small" style="width:auto" data-act="choose" data-i="0" data-v="back">不练了</button></div>
    </div>`);
  }

  /* ---------- 赛后论坛 / 虎扑 ---------- */
  /* ---------- 赛后开麦 ---------- */
  function renderTalk(s) {
    return shell(`<div class="fade-in">
      <div class="between">
        <div>
          <div class="kicker">${A.glyph("bar", 13)} 混采区 · 麦克风在你面前</div>
          <h2 style="margin:5px 0 0">${esc(s.where || "")} <span class="mono" style="color:${s.won ? "var(--gold)" : "#ff6f6f"}">${esc(s.score || "")}</span></h2>
          <div class="small-note" style="margin-top:4px">对面 ${esc(s.opp || "")} · 你现在说的每一句，都会被人截图</div>
        </div>
        <div style="text-align:right">
          <div class="mono" style="font-size:20px;color:${s.won ? "var(--gold)" : "#ff6f6f"}">${s.won ? "WIN" : "LOSE"}</div>
          <div class="small-note">赛后采访</div>
        </div>
      </div>
      <div class="panel talk-mic" style="margin-top:12px">
        <div class="talk-ask">${br(s.ask || "")}</div>
        <div class="opts" style="display:grid;gap:9px;margin-top:14px">
          ${(s.opts || []).map((o, i) => `<div class="opt">
            <span class="idx">${i + 1}</span>
            <button class="btn" data-act="choose" data-i="${i}">${esc(o.opt)}
              <span class="tagline">${esc(o.hint || "")}</span>
            </button>
          </div>`).join("")}
        </div>
        <div class="small-note" style="margin-top:10px">说出口的话会挂在论坛第一条，也可能变成明天的热搜。没有人会记得你沉默的那次。</div>
      </div>
    </div>`);
  }

  function renderForum(s) {
    const c = s.ctx || {};
    return shell(`<div class="fade-in">
      <div class="between">
        <div><div class="kicker">${A.glyph("bar", 13)} ${esc(c.title || "赛后")}</div>
        <h2 style="margin:5px 0 0">${c.w || 0}-${c.l || 0}</h2></div>
        <div style="text-align:right"><div class="mono" style="font-size:22px;color:${Number(s.score) >= 7 ? "var(--gold)" : Number(s.score) >= 4 ? "#c8d4e0" : "#ff6f6f"}">${esc(s.score)}</div><div class="small-note">虎扑评分 / 10</div></div>
      </div>
      <div class="panel" style="margin-top:12px">
        <div class="scene-tag">虎扑短评</div>
        ${(s.rating || []).map(r => `<div class="story" style="font-size:13px;margin-top:6px;padding-left:10px;border-left:2px solid rgba(255,255,255,.12)">${esc(r)}</div>`).join("")}
      </div>
      ${(s.posts || []).map(p => `<div class="panel flat${p.mine ? " mine" : ""}" style="margin-top:10px">
        <div class="between"><div style="font-weight:800;font-size:14px">${esc(p.t || "")}</div><span class="row" style="gap:6px">${p.mine ? `<span class="chip gold">本人发言</span>` : ""}<span class="chip red">热度 ${p.heat || 0}</span></span></div>
        <div class="story" style="margin-top:6px;font-size:13px;line-height:1.75">${br(p.body || "")}</div>
        <div class="row wrap" style="gap:6px;margin-top:8px">${(p.replies || []).map(r => `<span class="chip">${esc(r)}</span>`).join("")}</div>
      </div>`).join("")}
      <div class="panel flat" style="margin-top:10px"><span class="small-note">粉丝 ${fan(s.fans)} · 黑子 ${fan(s.haters)} · 这些人不会因为你赢一场就不骂你</span></div>
      <div class="right" style="margin-top:16px;text-align:right"><button class="btn primary small" data-act="choose" data-i="0">关掉论坛</button></div>
    </div>`);
  }

  function renderBar(s) {
    const CATC = { "吹": "gold", "骂": "red", "喷": "purple", "串": "blue", "发情": "green" };
    const HEATC = { "爆": "red", "热": "gold", "新": "gray" };
    return shell(`<div class="fade-in">
      <div class="between">
        <div><div class="kicker">${A.glyph("bar", 13)} 抗压背锅吧 · 今日热门</div>
        <h2 style="margin:5px 0 0">吧里已经吵起来了</h2>
        <div class="small-note" style="margin-top:4px">326 人正在刷这面墙 · 楼里的每一条你都看得懂</div></div>
        <div style="text-align:right"><div class="mono" style="font-size:20px;color:#ff6f6f">${fan(s.haters)}</div><div class="small-note">盯着你的人</div></div>
      </div>
      ${(s.threads || []).map((t, i) => `<div class="panel flat bar-thread" style="margin-top:12px">
        <div class="between">
          <div class="row wrap" style="gap:6px;align-items:center">
            <span class="chip ${CATC[t.cat] || "gray"}">${esc(t.cat || "吧友")}</span>
            <span class="chip ${HEATC[t.heat] || "gray"}">${esc(t.heat || "新")}</span>
            <span class="mono" style="font-size:11px;color:var(--dim-2)">#${esc(t.id || "")}</span>
          </div>
          <span class="small-note">${(t.replies || []).length} 条回复</span>
        </div>
        <h3 style="margin:8px 0 6px;font-size:16px;line-height:1.45">${esc(t.title || "")}</h3>
        <div class="story" style="font-size:13px;line-height:1.8">${br(t.body || "")}</div>
        <div class="bar-replies" style="margin-top:10px">
          ${(t.replies || []).map(r => `<div class="bar-reply"><span class="bar-user">${esc(r.u || "匿名")}</span><span class="bar-text">${esc(r.t)}</span><span class="bar-up">${r.up || 0}</span></div>`).join("")}
        </div>
        <div class="right" style="margin-top:10px"><button class="btn small ghost" data-act="choose" data-i="${i}">亲自下场回这个帖</button></div>
      </div>`).join("")}
      <div class="panel flat" style="margin-top:12px">
        <div class="small-note" style="margin-bottom:8px">不想看，又忍不住。你现在有 ${fan(s.fans)} 个粉丝，${fan(s.haters)} 个黑子。</div>
        <div class="row wrap" style="gap:8px">
          <button class="btn small ghost" data-act="choose" data-i="0" data-v="smurf">开小号，反串</button>
          <button class="btn small ghost" data-act="choose" data-i="0" data-v="ignore">关手机，睡觉</button>
        </div>
      </div>
    </div>`);
  }

  /* ---------- 场景分发 ---------- */
  function bodyHTML() {
    if (view === "cockfight") return cockfightHTML();
    if (view === "menu") return renderMenu();
    const s = sc;
    if (!s) return renderMenu();
    switch (s.type) {
      case "create_name": return renderName();
      case "create_base": return renderBase(s);
      case "create_pos": return renderPos();
      case "create_pool": return renderPool(s);
      case "create_origin": return renderOrigin(s);
      case "create_card": return renderCard();
      case "action": return renderAction(s);
      case "event": return renderEvent(s);
      case "result": return renderResult(s);
      case "matchday": return renderMatchday(s);
      case "duel": return renderDuel(s);
      case "duelResult": return renderDuelResult(s);
      case "swissResult": return renderSwiss(s);
      case "monthend": return renderMonthEnd(s);
      case "injury": return renderInjury(s);
      case "draw": return renderDraw(s);
      case "transfer": return renderTransfer(s);
      case "retire": return renderRetire(s);
      case "ending": return renderEnding(s);
      case "voice": return renderVoice(s);
      case "patch": return renderPatch(s);
      case "standings": return renderStandings(s);
      case "bp": return renderBp(s);
      case "inGame": return renderInGame(s);
      case "moment": return renderMoment(s);
      case "boGame": return renderBoGame(s);
      case "highlight": return renderHighlight(s);
      case "style": return renderStyle(s);
      case "prep": return renderPrep(s);
      case "bigevent": return renderBigevent(s);
      case "worldsMap": return renderWorldsMap(s);
    case "worldsTree": return renderWorldsTree(s);
    case "skipOffer": return renderSkipOffer(s);
      case "shop": return renderShop(s);
      case "gacha": return renderGacha(s);
      case "deck": return renderDeck(s);
      case "trainHero": return renderTrainHero(s);
      case "talk": return renderTalk(s);
      case "forum": return renderForum(s);
      case "bar": return renderBar(s);
      default: return `<div class="panel"><div class="story">未知场景：${esc(s.type)}</div></div>`;
    }
  }

  /* ---------- 嘴臭文案 ---------- */
  function trashLine(kind) {
    const D = window.DATA_TRASH; if (!D) return "";
    const pool = (D[kind] && D[kind].length) ? D[kind] : D.fan || [];
    if (!pool.length) return "";
    const S = G.getState() || {};
    return dmFill(pool[Math.floor(Math.random() * pool.length)]);
  }

  /* ---------- 比赛弹幕 ---------- */
  const DM = { on: true, timer: null, el: null };
  const DM_COLOR = { gold: "#f0c33c", red: "#ff6f6f", blue: "#77b4ff", green: "#5fdca0", purple: "#bb8dff", gray: "#a3b0bf" };
  const DM_KEYS = ["win", "lose", "clutch", "throw", "banpick", "pause", "gg", "ritual", "blackwhite", "spam"];

  function dmRoom() {
    if (DM.el && DM.el.parentNode) return DM.el;
    let n = document.getElementById("danmaku");
    if (!n) { n = document.createElement("div"); n.id = "danmaku"; document.body.appendChild(n); }
    DM.el = n;
    return n;
  }
  function dmColor(g) {
    const D = window.DATA_DANMAKU;
    const grp = D && D.groups ? D.groups.filter(x => x.g === g)[0] : null;
    return (grp && DM_COLOR[grp.c]) || "#dbe4ef";
  }
  function dmFill(t) {
    const S = G.getState() || {};
    const me = (S.name || "");
    const team = (G.teamOf(S.teamId) || {}).name || "你这队";
    const opp = (S.lastOpp || "")
      || ((G.getScene() || {}).duel && G.getScene().duel.opp.name)
      || "对面";
    const pos = G.CN[S.pos] || "";
    return String(t)
      .replace(/\{name\}/g, me).replace(/\{team\}/g, team)
      .replace(/\{opp\}/g, opp).replace(/\{pos\}/g, pos)
      .replace(/\{score\}/g, (S.reg && S.reg.w) ? (S.reg.w + "-" + S.reg.l) : "");
  }
  function dmTake(out, k, n) {
    const D = window.DATA_DANMAKU;
    const pool = (D && Array.isArray(D[k])) ? D[k].slice() : [];
    for (let i = 0; i < n && pool.length; i++) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  function dmPools(sc) {
    const D = window.DATA_DANMAKU;
    if (!D) return [];
    const out = [];
    const hint = sc && sc.dm;
    if (hint && Array.isArray(hint.pools)) {
      hint.pools.forEach(p => {
        if (typeof p === "string") dmTake(out, p, 2);
        else if (p && p.k) dmTake(out, p.k, p.n || 2);
      });
      if (out.length) return out;
    }
    if (!sc) return out;
    if (sc.type === "bp") {
      dmTake(out, "banpick", 4); dmTake(out, "banpick_my", 3); dmTake(out, "banpick_opp", 3);
      dmTake(out, "parasite", 2); dmTake(out, "spam", 2); dmTake(out, "ritual", 2); dmTake(out, "hupu", 1);
    } else if (sc.type === "inGame" || sc.type === "boGame") {
      const win = sc.win;
      dmTake(out, win === true ? "kill" : win === false ? "death" : "clutch", 3);
      dmTake(out, "obj", 2); dmTake(out, "comback", 1); dmTake(out, "choke", 1);
      dmTake(out, (sc.bestOf === 5 && (sc.g || 1) === 5) ? "gg" : "clutch", 2);
      dmTake(out, "parasite", 2); dmTake(out, "juan", 1); dmTake(out, "fanservice", 1);
      dmTake(out, "ritual", 2); dmTake(out, "spam", 2);
      if (sc.upset) dmTake(out, "choke", 2);
      if ((sc.losses || 0) >= 2) dmTake(out, "throw", 2);
      /* 场外池：黑粉多了就有人开盒；决赛/线下才有人堵门 */
      let ht = 0;
      try { ht = Number((G.getState() || {}).haters) || 0; } catch (e) { ht = 0; }
      if (ht > 8000 && Math.random() < .5) dmTake(out, "doxx", 2);
      else if (ht > 3000 && Math.random() < .25) dmTake(out, "doxx", 1);
      if (sc.intl || sc.stage === "Worlds" || sc.final || (sc.bestOf === 5 && (sc.g || 1) === 5)) dmTake(out, "offline", 1);
    } else if (sc.type === "duel") {
      const d = sc.duel || {};
      const lead = (d.wins || 0) >= (d.losses || 0);
      dmTake(out, lead ? "win" : "lose", 3);
      dmTake(out, "clutch", 2); dmTake(out, "throw", 2);
      dmTake(out, "banpick", 2); dmTake(out, "ritual", 2); dmTake(out, "spam", 1);
      dmTake(out, "parasite", 1);
      if ((d.game || 1) >= 4) dmTake(out, "gg", 2);
    } else if (sc.type === "matchday") {
      dmTake(out, (sc.l || 0) > (sc.w || 0) ? "lose" : "win", 4);
      dmTake(out, "clutch", 1); dmTake(out, "throw", 1); dmTake(out, "ritual", 2);
      dmTake(out, "blackwhite", 1); dmTake(out, "hupu", 2); dmTake(out, "parasite", 1);
      dmTake(out, "juan", 1);
    } else if (sc.type === "duelResult" || sc.type === "swissResult") {
      const won = (sc.game && sc.game.win) || sc.win;
      dmTake(out, won ? "win" : "lose", 3); dmTake(out, "gg", 2);
      dmTake(out, "ritual", 1); dmTake(out, "blackwhite", 1); dmTake(out, "hupu", 2);
    } else if (sc.type === "forum") {
      dmTake(out, "hupu", 5); dmTake(out, "parasite", 4); dmTake(out, "spam", 3); dmTake(out, "ritual", 2);
      dmTake(out, "fanservice", 1);
    } else if (sc.type === "worldsMap" || sc.type === "standings") {
      dmTake(out, "worlds", 5); dmTake(out, "hupu", 3); dmTake(out, "parasite", 2); dmTake(out, "juan", 1);
    } else if (sc.type === "patch") {
      dmTake(out, "banpick", 3); dmTake(out, "parasite", 2); dmTake(out, "spam", 2); dmTake(out, "ritual", 1);
    } else if (sc.type === "monthend" || sc.type === "action" || sc.type === "event" || sc.type === "result") {
      dmTake(out, "ritual", 3); dmTake(out, "spam", 2); dmTake(out, "blackwhite", 2); dmTake(out, "hupu", 1);
      /* 私生粉蹲基地：平时少见，月末和事件里有人跟车 */
      if (sc.type === "event" || sc.type === "monthend") dmTake(out, "sasaeng", Math.random() < .5 ? 1 : 0);
    }
    return out;
  }
  function shuffleDM(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function dmStop(keep) {
    if (DM.timer) { clearInterval(DM.timer); DM.timer = null; }
    const room = document.getElementById("danmaku");
    /* keep=true：还在比赛流程里换页，让已经在飞的弹幕自己飞完，别整片清空 */
    if (room && !keep && !window.__dmKeep) room.innerHTML = "";
  }
  function dmDrop(item) {
    const room = dmRoom();
    if (!room || typeof room.appendChild !== "function" || typeof document.createElement !== "function") return;
    const D = window.DATA_DANMAKU;
    const grp = D && D.groups ? D.groups.filter(x => x.g === item.g)[0] : null;
    const el = document.createElement("div");
    el.className = "dm";
    el.style.top = (4 + Math.random() * 62).toFixed(2) + "%";
    el.style.fontSize = (12.2 + Math.random() * 2.6).toFixed(1) + "px";
    el.style.animationDuration = (9 + Math.random() * 6).toFixed(2) + "s";
    el.style.animationDelay = (Math.random() * 0.7).toFixed(2) + "s";
    el.style.color = dmColor(item.g);
    el.innerHTML = `<span class="g">${esc(item.g)}</span>${esc(dmFill(item.t))}`;
    el.addEventListener("animationend", () => { if (el.parentNode) el.parentNode.removeChild(el); });
    room.appendChild(el);
  }
  function dmStart(sc, opts) {
    const keep = !!(opts && opts.keep);
    dmStop(keep);
    if (!DM.on || !window.DATA_DANMAKU || typeof window.setInterval !== "function") return;
    const list = dmPools(sc);
    if (!list.length) return;
    /* 一进场最多三条，屏幕上有字就够了，别糊住界面 */
    let i = 0, sent = 0;
    const room = dmRoom();
    const aliveOf = () => (room && room.children) ? room.children.length : 0;
    const alive = aliveOf();
    const OPEN = 3;
    if (alive < OPEN) {
      const burst = Math.min(OPEN - alive, list.length);
      for (; i < burst; i++) { dmDrop(list[i]); sent++; }
    }
    /* 同时在屏上限 7 条；一条飞 7–13 秒，约 1.1 秒一条刚好补得上 */
    const GAP = 1100;
    DM.timer = window.setInterval(() => {
      if (sent > 900) { dmStop(false); return; }
      if (aliveOf() >= 7) return;
      if (i >= list.length) { i = 0; shuffleDM(list); }
      dmDrop(list[i++]); sent++;
    }, GAP);
  }

  function renderDock() {
    if (view !== "game" || !started || (sc && /^create_/.test(sc.type))) { dock.classList.add("hidden"); return; }
    dock.classList.remove("hidden");
    const S = G.getState();
    const canSave = !!(G.canSave && G.canSave()) && !(sc && /^create_/.test(sc.type || ""));
    dock.innerHTML = `
      <button class="btn small" style="width:auto" data-act="quicksave" ${canSave ? "" : "disabled"} title="${canSave ? "自动档" : "只能月初存档"}">${canSave ? "存档" : "存档 · 月初"}</button>
      <button class="btn small" style="width:auto" data-act="tab-slots">读档</button>
      <button class="btn small ghost" style="width:auto" data-act="tab-codex">档案</button>
      <button class="btn small ghost" style="width:auto" data-act="glossary">图鉴</button>
      <button class="btn small ghost" style="width:auto" data-act="settings">设置</button>
      <button class="btn small ghost" style="width:auto" data-act="dm-toggle">弹幕${DM.on ? "开" : "关"}</button>
      <button class="btn small ghost" style="width:auto" data-act="snd-toggle">声音${(window.SND && window.SND.muted && window.SND.muted()) ? "关" : "开"}</button>
      <span class="small-note mono" style="margin-left:6px">${S ? tickLabel(S.tick) : ""}${S && S.endless ? " · 第 " + S.season + " 季" : ""}</span>
    `;
  }

  /* ---------- 图鉴：底栏随时可开，不用离开当前场景 ---------- */
  function glossaryHTML() {
    const D = window.DATA_GLOSSARY || {};
    const groups = (D.groups || []).filter(g => g && g.items && g.items.length);
    if (!groups.length) return `<div class="gloss"><div class="gloss-main"><p class="dim">图鉴数据没加载。</p></div></div>`;
    let key = glossTab;
    if (!key || !groups.some(g => g.key === key)) key = groups[0].key;
    const cur = groups.filter(g => g.key === key)[0];
    return `<div class="gloss fade-in" data-act="gloss-stop">
      <div class="gloss-head">
        <div>
          <div class="kicker">GLOSSARY</div>
          <h2>图鉴</h2>
          <p class="dim" style="margin:4px 0 0">数值、机制、暗线、效果词——看不懂的地方查这里。</p>
        </div>
        <button class="btn small ghost" style="width:auto" data-act="gloss-close">关闭</button>
      </div>
      <div class="gloss-body">
        <div class="gloss-tabs">
          ${groups.map(g => `<button class="gloss-tab ${g.key === key ? "on" : ""}" data-act="gloss-tab" data-v="${esc(g.key)}">${esc(g.name)}</button>`).join("")}
        </div>
        <div class="gloss-main">
          <p class="gloss-intro">${esc(cur.intro || "")}</p>
          ${cur.items.map(it => `<div class="gloss-item">
            <div class="gloss-k">${esc(it.t || it.k || "")}${it.t && it.k ? `<span class="mono">${esc(it.k)}</span>` : ""}</div>
            <div class="gloss-d">${esc(it.d || "")}</div>
          </div>`).join("")}
        </div>
      </div>
    </div>`;
  }

  function openGloss() {
    let ov = null;
    try {
      ov = document.getElementById("glossOverlay");
      if (!ov) {
        ov = document.createElement("div");
        ov.id = "glossOverlay";
        ov.className = "gloss-overlay";
        if (typeof ov.setAttribute === "function") ov.setAttribute("data-act", "gloss-close");
        if (document.body && typeof document.body.appendChild === "function") document.body.appendChild(ov);
      }
      ov.innerHTML = glossaryHTML();
    } catch (e) {
      try { if (ov) ov.innerHTML = glossaryHTML(); } catch (e2) { }
    }
  }

  function closeGloss() {
    try {
      const ov = document.getElementById("glossOverlay");
      if (!ov) return;
      if (ov.parentNode && typeof ov.parentNode.removeChild === "function") ov.parentNode.removeChild(ov);
      else ov.innerHTML = "";
    } catch (e) { }
  }

  /* 特效：场景切换 + 场景专属粒子（js/fx.js 提供 window.FX；没有就静默） */
  function fxScene(type, s) {
    try {
      if (!window.FX) return;
      if (window.FX.scene) window.FX.scene(type, s || (G.getState ? G.getState() : null));
      if (s && Array.isArray(s.achvNew) && s.achvNew.length) window.FX.cue("award");
    } catch (e) {}
  }

  function render() {
    if (mgrMode && window.UIMGR && window.MGR && window.MGR.scene()) {
      const ms = window.MGR.scene();
      app.innerHTML = window.UIMGR.bodyHTML(ms);
      app.dataset.scene = ms.type || "mgr";
      document.body.classList.remove("in-game");
      try { A.sceneBg(app.dataset.scene, { S: (window.MGR && window.MGR.state ? window.MGR.state() : null) }); } catch (e) {}
      if (!audTheme("menu")) bgmFor("menu");
      audIntensity(1);
      fxScene(app.dataset.scene, null);
      return;
    }
    if (view === "cockfight") {
      app.innerHTML = cockfightHTML();
      app.dataset.scene = "cockfight";
      document.body.classList.remove("in-game");
      try { A.sceneBg("cockfight", { S: null }); } catch (e) {}
      try { dock.classList.add("hidden"); } catch (e) {}
      if (!audTheme("cockfight")) bgmFor("menu");
      audIntensity(1);
      fxScene("cockfight", null);
      return;
    }
    const creating = view === "game" && sc && /^create_/.test(sc.type);
    const top = creating ? "" : topbarHTML();
    app.innerHTML = top + bodyHTML();
    app.dataset.scene = view === "menu" ? "menu:" + tab : (sc ? sc.type : "");
    try { A.sceneBg(app.dataset.scene, { S: G.getState ? G.getState() : null }); } catch (e) {}
    document.body.classList.toggle("in-game", view === "game" && started);
    renderDock();
    if (view === "game" && sc && sc.type !== "ending" && started && !/^create_/.test(sc.type || "")) {
      try { if (!G.canSave || G.canSave()) G.save("auto"); } catch (e) {}
    }
    const dmScene = view === "game" && sc && (/^(duel|matchday|duelResult|swissResult|bp|inGame|boGame|prep|worldsMap|highlight|moment)$/.test(sc.type) || !!sc.dm);
    if (dmScene) dmStart(sc, { keep: DM.lastMatch === true }); else dmStop(false);
    DM.lastMatch = !!dmScene;
    /* 即时弹幕：按"这一下发生了什么"炸一屏，与常驻弹幕并行 */
    if (window.LIVE && view === "game" && sc && DM.on) { try { LIVE.after(sc); } catch (e) {} }
    /* 场景音乐：SND 多轨版本优先，没有就用旧的 bgmFor */
    if (!audTheme(themeOf())) bgmFor(sceneBgm());
    audIntensity(intensityOf());
    if (view === "game" && sc) {
      if (sc.type === "draw") {
        sfx("card");
        (sc.cards || []).forEach(c => { if (c.rarity === "red") sfx("drawRed"); else if (c.rarity === "gold" || c.rarity === "purple") sfx("drawGold"); });
      } else if (sc.type === "duelResult" || sc.type === "swissResult") {
        const won = (sc.game && sc.game.win) || sc.win;
        sfx(won ? "win" : "lose");
      } else if (sc.type === "monthend") {
        sfx("levelup");
      } else if (sc.type === "transfer") {
        sfx("page");
      } else if (sc.type === "retire") {
        sfx("page");
      } else if (sc.type === "ending") {
        const big = /S/.test((sc.end || {}).rank || "") || ((sc.record || {}).titles || []).some(t => String(t).indexOf("全球总决赛") >= 0);
        const bad = /(塌房|身败名裂|欠债|退役|解散|无球可打)/.test(String((sc.end || {}).story || "") + String((sc.end || {}).title || "")) && !big;
        sfx(big ? "victory" : "defeat");
        audEnding(big ? "win" : (bad ? "lose" : "neutral"));
      }
    }
    const ni = document.getElementById("nameInput");
    if (ni) { ni.focus(); ni.addEventListener("keydown", e => { if (e.key === "Enter") doName(); }); }
    fxScene(app.dataset.scene, sc);
  }

  /* ---------- 行为 ---------- */
  function startNew() {
    sc = G.newGame({ diff, mode });
    view = "game"; started = true; tab = "main";
    render();
  }

  function doName() {
    const el = document.getElementById("nameInput");
    advance(0, el ? el.value : "");
  }

  function advance(i, v) {
    if (!sc) return;
    const next = G.choose(i, v);
    if (next) sc = next;
    render();
  }

  function onAct(act, el) {
    const i = el.dataset.i != null ? Number(el.dataset.i) : undefined;
    const v = el.dataset.v;
    switch (act) {
      case "mgr-start": {
        if (!window.MGR || !window.UIMGR) { toast("经理模式没加载"); break; }
        mgrMode = true;
        window.MGR.start();
        try { wakeAudio(); } catch (e) {}
        render();
        break;
      }
      case "mgr-diff": {
        if (!window.MGR || !window.UIMGR) { toast("经理模式没加载"); break; }
        mgrMode = true;
        window.MGR.start({ diff: v });
        try { wakeAudio(); } catch (e) {}
        render();
        break;
      }
      case "mgr-exit": mgrMode = false; render(); break;
      case "mgr": {
        if (!window.MGR || !window.UIMGR) break;
        const handled = window.UIMGR.onAct(v, el, i);
        if (handled === false) window.MGR.choose(i, v);
        render();
        break;
      }
      case "tab": tab = v || "main"; render(); break;
      case "cockfight": view = "cockfight"; tab = "main"; render(); break;
      case "cockfight-back": view = "menu"; tab = "main"; render(); break;
      case "settings": openSettings(); break;
      case "settings-close": closeSettings(); break;
      case "set-stop": break;
      case "mute-toggle": {
        try {
          if (window.SND && typeof window.SND.setMute === "function") { window.SND.setMute(!mutedNow()); sfx("notify"); }
          else toast("这一版没有音频模块");
        } catch (e) { }
        openSettings();
        break;
      }
      case "auto-toggle":
      case "toggle-auto": {
        try {
          if (G.toggleAuto && typeof G.toggleAuto === "function") G.toggleAuto();
          else { const S0 = G.getState(); if (S0) S0.autoMode = !autoOn(); }
        } catch (e) { }
        sfx("notify");
        openSettings();
        if (view === "game") render();
        break;
      }
      case "guide-ok": {
        markGuide(v || (sc && sc.type) || "");
        render();
        break;
      }
      case "guide-replay": {
        try { window.localStorage.removeItem(GUIDE_KEY); } catch (e) { }
        guideReset();
        closeSettings();
        if (view === "game" && sc && (sc.type === "action" || sc.type === "bp" || sc.type === "duel" || sc.type === "shop" || sc.type === "gacha")) render();
        else toast("下次进对应页面时，提示会重新出现");
        break;
      }
      case "achv-cat": achvCat = v || "all"; render(); break;
      case "codex-tpage": codexPage += Number(v) || 0; if (codexPage < 0) codexPage = 0; render(); break;
      case "codex-ppage": codexPage += Number(v) || 0; if (codexPage < 0) codexPage = 0; render(); break;
      case "glossary": openGloss(); break;
      case "gloss-close": closeGloss(); break;
      case "gloss-tab": {
        glossTab = v || "";
        const ov = document.getElementById("glossOverlay");
        if (ov) ov.innerHTML = glossaryHTML();
        break;
      }
      case "gloss-stop": break;
      case "dm-toggle": DM.on = !DM.on; if (window.LIVE) LIVE.toggle(DM.on); if (!DM.on) dmStop(); else if (view === "game" && sc) dmStart(sc); sfx("notify"); render(); break;
      case "snd-toggle": {
        const a = window.SND;
        if (a && a.setMute) { a.setMute(!a.muted()); sfx("notify"); }
        else toast("这一版没有音频模块");
        render();
        break;
      }
      case "setdiff": diff = v; render(); break;
      case "setmode": mode = v === "endless" ? "endless" : "three"; render(); break;
      case "start": startNew(); break;
      case "continue": {
        const s = G.load("auto");
        if (s) { sc = s; view = "game"; started = true; render(); toast("已读取自动存档"); }
        else toast("没有自动存档");
        break;
      }
      case "load": {
        const s = G.load(v);
        if (s) { sc = s; view = "game"; started = true; tab = "main"; render(); toast("读档成功"); }
        else toast("读档失败");
        break;
      }
      case "save": {
        if (G.canSave && !G.canSave()) { toast("只能月初存档"); break; }
        if (G.save(v)) toast("已存到档位 " + v); else toast("存档失败");
        render();
        break;
      }
      case "quicksave": {
        if (G.canSave && !G.canSave()) { toast("只能月初存档"); break; }
        if (G.save("auto")) toast("已自动存档"); else toast("存档失败");
        break;
      }
      case "tab-slots": tab = "slots"; view = "menu"; render(); break;
      case "tab-codex": tab = "codex"; view = "menu"; render(); break;
      case "codex-tab": {
        codexTab = v || "update";
        if (codexTab === "memes") memeSub = memeSub || "memes";
        if (codexTab === "cards") cardPage = 0;
        if (codexTab === "teams" || codexTab === "players") codexPage = 0;
        render();
        break;
      }
      case "codex-cat": bfCat = v || "all"; bPage = 0; render(); break;
      case "codex-filter": {
        const a = document.getElementById("cf-season"), b = document.getElementById("cf-tag");
        bfSeason = a ? (a.value || "all") : "all";
        bfTag = b ? (b.value || "all") : "all";
        bPage = 0;
        render();
        break;
      }
      case "codex-filter-reset": bfCat = "all"; bfSeason = "all"; bfTag = "all"; bPage = 0; codexQ = ""; render(); break;
      case "codex-bpage": bPage += Number(v) || 0; render(); break;
      case "codex-memesub": memeSub = v || "memes"; render(); break;
      case "codex-cardsub": cardSub = v || "talents"; cardPage = 0; render(); break;
      case "codex-cpage": cardPage += Number(v) || 0; render(); break;
      case "codex-go": {
        const el2 = document.getElementById("codexQ");
        codexQ = el2 ? String(el2.value || "").trim() : "";
        bPage = 0; cardPage = 0; codexPage = 0;
        render();
        break;
      }
      case "codex-clear": codexQ = ""; bPage = 0; cardPage = 0; codexPage = 0; render(); break;
      case "menu": view = "menu"; tab = "main"; started = false; render(); break;
      /* 再来一局 = 回主菜单新开一局：模式、难度、建号全部重选一遍 */
      case "restart": sc = null; view = "menu"; tab = "diff"; started = false; render(); break;
      case "name-ok": doName(); break;
      case "choose": advance(i, v); break;
      case "pick": advance(i); break;
      case "reroll": advance(0, "reroll"); break;
      case "burst": {
        sfx("baron");
        const s = G.burst();
        if (s) sc = s;
        render();
        break;
      }
      default:
    }
  }

  document.addEventListener("click", e => {
    const el = e.target.closest("[data-act]");
    if (!el || el.disabled) return;
    e.preventDefault();
    wakeAudio();
    sfx("click");
    const act = el.dataset.act || "";
    /* 斗蛐蛐自己的按钮（cf- 前缀）直接交给它的模块处理 */
    if (act.indexOf("cf-") === 0) {
      try {
        if (window.COCKFIGHT && typeof window.COCKFIGHT.click === "function") {
          window.COCKFIGHT.click(act, el.dataset.i != null ? Number(el.dataset.i) : undefined, el.dataset.v);
          render();
          return;
        }
      } catch (err) { }
    }
    onAct(act, el);
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && document.getElementById("glossOverlay")) {
      closeGloss();
      e.preventDefault();
      return;
    }
    if (view !== "game" || !sc || mgrMode) return;
    const k = e.key, t = sc.type || "";
    if (k >= "1" && k <= "9") {
      const idx = Number(k) - 1;
      let n = 0, v = undefined;
      if (t === "action") n = (sc.acts || []).length;
      else if (t === "event") n = ((sc.ev || {}).opts || []).length;
      else if (t === "duel") n = ((sc.duel && sc.duel.sit && sc.duel.sit.opts) || []).length;
      else if (t === "retire") n = 2;
      else if (t === "talk" || t === "moment" || t === "style" || t === "trainHero" || t === "voice" || t === "inGame" || t === "prep" || t === "gacha") n = (sc.opts || []).length;
      else if (t === "create_base" || t === "create_pool") n = 3;
      else if (t === "create_origin") n = (sc.origins || []).length;
      else if (t === "transfer") n = (sc.offers || []).length;
      else if (t === "shop") n = (sc.items || []).length;
      else if (t === "bp") n = sc.step === 0 ? (sc.banOpts || []).length : sc.step === 1 ? (sc.hs || sc.opts || []).length : (sc.opts || []).length;
      else if (t === "skipOffer") { n = 2; v = idx === 0 ? "skip" : "play"; }
      else if (t === "seriesPick") n = (sc.opts || []).length;
      if (n && idx >= 0 && idx < n) {
        wakeAudio(); sfx("click");
        advance(idx, v);
        e.preventDefault();
      }
      return;
    }
    if (k !== "Enter" && k !== " ") return;
    let v;
    if (t === "shop") v = "skip";
    else if (t === "gacha" || t === "deck" || t === "skipOffer" || t === "transfer") return;
    else if (t === "create_base") v = undefined;
    if (t === "result" || t === "matchday" || t === "duelResult" || t === "swissResult" || t === "monthend"
      || t === "draw" || t === "standings" || t === "patch" || t === "worldsMap" || t === "worldsTree"
      || t === "forum" || t === "highlight" || t === "create_card") {
      wakeAudio(); sfx("click");
      advance(0, v);
      e.preventDefault();
    }
  });

  render();
})();
