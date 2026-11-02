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

  /* ---------- 工具 ---------- */
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const br = s => esc(s).replace(/\n/g, "<br>");
  const fan = n => !n ? "0" : n >= 1e8 ? (n / 1e8).toFixed(2) + " 亿" : n >= 1e4 ? (n / 1e4).toFixed(1) + " 万" : String(Math.round(n));
  const pct = v => Math.max(0, Math.min(100, Math.round(v)));
  const barHTML = (v, cls) => `<span class="bar ${cls || ""}"><i style="width:${pct(v)}%"></i></span>`;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(() => toastEl.classList.remove("show"), 1700);
  }
  const POSCN = { TOP: "上单", JUG: "打野", MID: "中单", BOT: "ADC", SUP: "辅助" };
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
          <div class="hud-item"><span class="lb">${A.glyph("energy", 12)}精力</span>${barHTML(S.energy, "en")}</div>
          <div class="hud-item"><span class="lb">${A.glyph("mental", 12)}心态</span>${barHTML(S.morale, "mo")}</div>
          <div class="hud-item"><span class="lb">${A.glyph("flag", 12)}士气</span>${barHTML(S.spirit == null ? 60 : S.spirit, "hi")}</div>
          <div class="hud-item"><span class="lb">${A.glyph("fire", 12)}气势</span>${barHTML(S.burst, "hp")}</div>
          <div class="hud-item"><span class="lb">${A.glyph("voice", 12)}话语权</span><span class="vl">${v}</span></div>
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
        <div class="side-kv"><span>身价</span><b>${Math.max(0, Math.round(S.salary))} 万/年</b></div>
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
        <div class="side-kv"><span>存款</span><b>${Math.round(S.money)} 万</b></div>
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
          <button class="btn gold" data-act="mgr-start">电竞经理模式 <span class="tagline">不当选手了 · 选队或自建 · 抽卡组队 · BP 打比赛</span></button>
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
    const rows = ["auto", 1, 2, 3].map(s => {
      const has = G.hasSave(s);
      const label = s === "auto" ? "自动存档" : "手动档 " + s;
      return `<div class="panel flat" style="margin-top:10px">
        <div class="between">
          <div><b>${label}</b> <span class="chip ${has ? "green" : ""}">${has ? "有档" : "空"}</span></div>
          <div class="row">
            ${has ? `<button class="btn small" data-act="load" data-v="${s}">读档</button>` : ""}
            ${s !== "auto" ? `<button class="btn small ghost" data-act="save" data-v="${s}" ${started ? "" : "disabled"}>存档</button>` : ""}
          </div>
        </div>
      </div>`;
    }).join("");
    return `<div class="fade-in">
      <div class="between" style="margin-bottom:14px">
        <div><div class="kicker">SAVES</div><h2>存档</h2></div>
        <button class="btn small ghost" data-act="tab" data-v="main">返回</button>
      </div>
      ${rows}
    </div>`;
  }

  let codexTab = "worlds", codexQ = "";
  function codexHit(o) {
    if (!codexQ) return true;
    try { return JSON.stringify(o).toLowerCase().indexOf(codexQ.toLowerCase()) >= 0; } catch (e) { return false; }
  }
  function codexRow(a, b, c, d) {
    return `<div class="chron-row"><span class="yr">${esc(a)}</span><span class="ch">${esc(b)}</span><span class="dim">${esc(c || "")}</span><span class="nt">${esc(d || "")}</span></div>`;
  }
  function renderCodex() {
    const total = {
      ev: (window.DATA_EVENTS || []).length + (window.DATA_MEME_EVENTS || []).length + (window.DATA_ENDLESS_EVENTS || []).length + (window.DATA_EVENTS_POS || []).length,
      tal: (window.DATA_TALENTS || []).length, hero: (window.DATA_HEROES || []).length,
      team: (window.DATA_TEAMS ? Object.keys(window.DATA_TEAMS).length : 0),
      pl: (window.DATA_PLAYERS ? Object.keys(window.DATA_PLAYERS).length : 0),
      black: ((window.DATA_GOSSIP || {}).black || []).length
    };
    const ch = window.DATA_CHRONICLE || {};
    const TABS = [["update", "更新"], ["worlds", "世界赛"], ["msi", "MSI"], ["lpl", "LPL"], ["timeline", "时间线"], ["hl", "名场面"], ["teams", "战队"], ["players", "选手"]];
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
    } else if (codexTab === "worlds") {
      body = (ch.worlds || []).filter(codexHit).map(w => codexRow(w.year, w.champion, "亚军 " + (w.runner || "?") + (w.city ? " · " + w.city : ""), (w.story || "") + (w.lpl ? " ｜LPL：" + w.lpl : ""))).join("");
    } else if (codexTab === "msi") {
      body = (ch.msi || []).filter(codexHit).map(m => codexRow(m.year, m.champion, "亚军 " + (m.runner || "?"), m.story || "")).join("");
    } else if (codexTab === "lpl") {
      body = (ch.lpl || []).filter(codexHit).map(x => codexRow(x.year + " " + (x.split || ""), x.champion, "亚军 " + (x.runner || "?"), x.story || "")).join("");
    } else if (codexTab === "timeline") {
      body = (ch.timeline || []).filter(codexHit).map(t => codexRow(t.year || t.date || "", t.t || t.title || "", t.who || "", t.text || t.desc || "")).join("");
    } else if (codexTab === "hl") {
      const hs = ((G.getState() || {}).highlights || []).slice().reverse();
      body = hs.filter(codexHit).map(h => codexRow(h.event || "", h.hero || "", (HL_KIND[h.kind] || h.kind || "") + " " + (h.score || ""), h.text || "")).join("");
    } else if (codexTab === "teams") {
      const arr = Array.isArray(ch.teams) ? ch.teams : Object.keys(ch.teams || {}).map(k => Object.assign({ id: k, name: k }, ch.teams[k]));
      body = arr.filter(codexHit).map(t => codexRow(t.name || t.id, t.region || "", (t.titles || []).length + " 冠", t.story || t.desc || "")).join("");
    } else {
      const arr = Array.isArray(ch.players) ? ch.players : Object.keys(ch.players || {}).map(k => Object.assign({ id: k, name: k }, ch.players[k]));
      body = arr.filter(codexHit).map(p => codexRow(p.name || p.id, p.team || "", p.peak ? "巅峰 " + p.peak : "", (p.moments || []).map(m => (m.year ? m.year + " " : "") + (m.event || "") + "：" + (m.text || "")).join(" ｜ "))).join("");
    }
    if (!body) body = `<div class="small-note" style="padding:12px 0">这里没有你要找的。换个词试试。</div>`;
    /* 黑料档案：只给有证据的公开争议，随比赛解锁 */
    const S0 = G.getState();
    const blacks = ((window.DATA_GOSSIP || {}).black || []).filter(codexHit).slice(0, 12);
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
        <div class="chron">${body}</div>
        <div class="divider"></div>
        <h3>黑料档案</h3>
        <p class="story">赛场上能查的都在上面。赛场外的这些东西，真伪自己判断，别当真。${S0 && S0.story && S0.story.corrupt >= 20 ? "\n\n你自己身上也有几条了。有些东西一旦写下来就删不掉。" : ""}</p>
        <div style="display:grid;gap:6px;margin-top:8px">
          ${blacks.map(b => {
            const who = b.who || b.w || "";
            const txt = b.text || b.t || b.desc || "";
            const yr = b.year ? "第 " + b.year + " 年" : "";
            return `<div class="panel flat"><div class="small-note" style="color:var(--gold)">${esc(who)} ${esc(yr)}</div><div style="font-size:13px;line-height:1.7">${esc(txt)}</div></div>`;
          }).join("")}
        </div>
        <div class="divider"></div>
        <h3>数据量</h3>
        <p class="story">事件 ${total.ev} 条 · 天赋卡 ${total.tal} 张 · 英雄 ${total.hero} 个 · 战队 ${total.team} 支 · 选手 ${total.pl} 名 · 黑料 ${total.black} 条。
        编年史写到 2024（Worlds 2011–2024、MSI 2015–2024、LPL 2015–2024），2025 年起全部为推演。</p>
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
      <p class="dim">三组随机的英雄池，每组一个绝活（76–84 熟练度）+ 两个常用。选一组带走。</p>
      <div class="base-grid" style="margin-top:18px">
        ${s.groups.map((g, i) => `<div class="pool-group" data-act="pick" data-i="${i}">
          <div class="tag" style="font-family:var(--mono);font-size:11px;color:var(--gold);letter-spacing:.14em">组合 ${i + 1}</div>
          ${g.map(x => `<div class="hero-row">
            ${A.champIcon(x.h.n, 26)}
            <span class="nm">${esc(x.h.n)} <span class="dim" style="font-size:11px">${esc(x.h.en || "")}</span></span>
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
          <div class="small-note">合同一年，工资 ${S.salary} 万。LDL 月薪三千，梦想无价。</div>
          <button class="btn primary small" data-act="choose" data-i="0">开始职业生涯</button>
        </div>
      </div>
    </div>`, { solo: true });
  }

  /* ---------- 月度行动 ---------- */
  function renderAction(s) {
    return shell(`<div class="fade-in">
      <div class="between">
        <div>
          <div class="kicker">${s.ml.year} 年 ${s.ml.month} 月</div>
          <h2 style="margin:5px 0 0">这个月做点什么</h2>
        </div>
        <div class="small-note">一个月一个行动</div>
      </div>
      <div class="opts" style="margin-top:16px;display:grid;gap:9px">
        ${s.acts.map((a, i) => `<div class="opt">
          <span class="idx">${i + 1}</span>
          <button class="btn" data-act="choose" data-i="${i}">
            ${esc(a.label)} <span class="chip gold" style="margin-left:6px">${esc(a.tag)}</span>
            <span class="tagline">${esc(a.desc)}</span>
          </button>
          <span class="cost" style="padding-top:12px">${esc(a.cost)}</span>
        </div>`).join("")}
      </div>
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
            let risk = "";
            if (o.risk) risk = `<span class="chip ${o.risk.dc >= 13 ? "red" : "blue"}">判定 ${G.CN[o.risk.stat] || o.risk.stat} · 难度 ${o.risk.dc}</span>`;
            let eff = "";
            if (o.eff) {
              const parts = Object.keys(o.eff).filter(k => typeof o.eff[k] === "number").map(k => {
                const v = o.eff[k];
                const nm = G.CN[k] || ({ energy: "精力", money: "钱", morale: "心态", fans: "粉丝", coach: "教练信任", status: "队内地位", burst: "气势", hupu: "虎扑" }[k] || k);
                return `${nm}${v > 0 ? "+" : ""}${v}`;
              });
              if (parts.length) eff = `<span class="chip">${esc(parts.join(" · "))}</span>`;
            }
            return `<div class="opt">
              <span class="idx">${i + 1}</span>
              <button class="btn" data-act="choose" data-i="${i}">${esc(o.t)}
                <span class="tagline">${eff} ${risk}</span>
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
      <div class="between" style="margin-top:18px">
        <div class="small-note">${s.tone === "win" ? "别飘。" : s.tone === "lose" ? "还没结束。" : ""}</div>
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
      ${s.patch ? `<div class="panel flat" style="margin-top:12px"><span class="chip gold">版本</span> <span class="dim">${esc(typeof s.patch === "string" ? s.patch : "14." + (s.patch.no || "") + " · 环境 " + (s.patch.env || ""))}</span></div>` : ""}
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
    return shell(`<div class="fade-in">
      <div class="kicker">${s.ml.year} 年 ${s.ml.month} 月 · 结算</div>
      <h2 style="margin:5px 0 14px">月底</h2>
      <div class="stat-grid">
        <div class="stat-cell"><div class="k">评分</div><div class="v gold">${s.ovr}</div></div>
        <div class="stat-cell"><div class="k">精力</div><div class="v">${Math.round(s.energy)}</div></div>
        <div class="stat-cell"><div class="k">心态</div><div class="v">${Math.round(s.morale)}</div></div>
        <div class="stat-cell"><div class="k">士气</div><div class="v">${s.spirit == null ? "—" : Math.round(s.spirit)}</div></div>
        <div class="stat-cell"><div class="k">话语权</div><div class="v">${s.voice}</div></div>
        <div class="stat-cell"><div class="k">名气</div><div class="v">${s.fame}</div></div>
        <div class="stat-cell"><div class="k">粉丝</div><div class="v" style="font-size:17px">${fan(s.fans)}</div></div>
        <div class="stat-cell"><div class="k">本月工资</div><div class="v" style="font-size:16px">+${s.pay == null ? 0 : s.pay} 万</div></div>
        <div class="stat-cell"><div class="k">存款</div><div class="v" style="font-size:16px">${Math.round(s.money || 0)} 万</div></div>
        <div class="stat-cell"><div class="k">抽卡券</div><div class="v" style="font-size:16px">${s.ticket || 0}</div></div>
        <div class="stat-cell"><div class="k">抽卡</div><div class="v" style="font-size:17px">${s.draws > 0 ? s.draws + " 次" : "—"}</div></div>
        <div class="stat-cell"><div class="k">状态</div><div class="v" style="font-size:16px">${s.injured ? "伤病" : "正常"}</div></div>
      </div>
      ${s.injured ? `<div class="panel flat" style="margin-top:12px;border-color:rgba(211,58,58,.5)"><span class="chip red">伤病</span> <span class="dim">手腕又疼了。这个月你只能看着别人打。</span></div>` : ""}
      ${s.draws > 0 ? `<div class="panel flat" style="margin-top:12px"><span class="chip gold">机遇</span> <span class="dim">这个月有 ${s.draws} 次抽卡机会，赛季末的池子最肥。</span></div>` : ""}
      <div class="row between" style="margin-top:20px;gap:12px">
        <div class="small-note">下个月是 ${s.ml.month === 12 ? (s.ml.year + 1) + " 年 1 月" : s.ml.year + " 年 " + (s.ml.month + 1) + " 月"}${s.draws > 0 ? " · 先把卡抽了再走" : ""}</div>
        <button class="btn primary small" style="width:auto" data-act="choose" data-i="0">${s.draws > 0 ? "去抽卡" : "下一个月"}</button>
      </div>
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
    return shell(`<div class="fade-in">
      <div class="kicker">DECISION · 十一月</div>
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
    const reasonText = { age: "打到了打不动", fade: "没人要了", retire: "自己按下的停止键", three: "三年打完，落子无悔" }[s.reason || "three"] || "";
    return shell(`<div class="fade-in">
      <div class="ending-hero">
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
  const EFFCN = k => ((TERM().eff || {})[k]) || STATCN(k);
  function effCN(eff) {
    const out = [];
    for (const k in (eff || {})) {
      const v = eff[k];
      if (typeof v !== "number") { out.push(EFFCN(k)); continue; }
      out.push(EFFCN(k) + (v > 0 ? "+" : "") + v);
    }
    return out.join(" · ");
  }
  const RC = r => ((G.RARITY || {})[r] || { c: "#9aa7b4", n: "" });
  const BUILDN = k => (((TERM().build || {})[k] || {}).name) || "";
  const KEYVAR = k => (((TERM().keyVar || {})[k]) || k);
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

  /* ---------- 版本更新 ---------- */
  function renderPatch(s) {
    const p = s.patch || {}, list = p.list || [];
    return shell(`<div class="fade-in">
      <div class="between">
        <div><div class="kicker">${p.year} 年 ${p.month} 月 · 版本 ${p.no ? "14." + p.no : ""}</div>
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
          <span class="opp">${esc(r.name)}${r.mine ? ' <span class="chip gold">你</span>' : ""}</span>
          <span class="dim" style="font-family:var(--mono)">${r.w}-${r.l}</span>
          <span class="honor">${(r.last || []).join("")}</span>
        </div>`).join("")}
      </div>
      <div class="right" style="margin-top:18px;text-align:right"><button class="btn primary small" data-act="choose" data-i="0">继续</button></div>
    </div>`);
  }

  /* ---------- BP ---------- */
  function renderBp(s) {
    const S = G.getState() || {};
    const head = `<div class="between">
        <div><div class="kicker">${esc(s.title || "对局")} · 第 ${s.g} 局 · BO${s.bestOf || 5}</div>
        <h2 style="margin:5px 0 0">vs ${esc((s.opp || {}).name || "")}</h2></div>
        <div style="text-align:right"><div class="mono" style="font-size:20px;color:var(--gold)">${esc(s.score || "0-0")}</div><div class="small-note">大比分</div></div>
      </div>`;
    if (s.step === 0) {
      return shell(`<div class="fade-in">${head}
        <div class="panel flat" style="margin-top:12px">
          <div class="between wrap">
            <div><span class="chip blue">对面打法：${esc((s.opp || {}).tendency || "运营")}</span>
            <span class="chip" style="margin-left:6px">我方 OVR ${s.myOvr} · 对面战力 ${s.oppPower}</span>
            ${s.decider ? `<span class="chip gold" style="margin-left:6px">决胜局 · ${s.banNeed || 3} ban</span>` : ""}</div>
            <div class="small-note">${s.reveal > 0 ? "数据团队给了一份报告：多看一层 BP 倾向" : "没有数据团队，对面练什么全靠猜"}</div>
          </div>
          ${s.coachTip ? `<div class="small-note" style="margin-top:8px;color:var(--gold-2)">${esc(s.coachTip)}</div>` : ""}
          ${(s.bans || []).length ? `<div class="row wrap" style="gap:6px;margin-top:8px">${s.bans.map(b => `<span class="chip red">已 ban ${esc(b)}</span>`).join("")}</div>` : ""}
          <div class="match-list" style="margin-top:10px">
            ${(s.opps || []).map(x => `<div class="match-row"><span class="opp" style="width:60px">${esc(POSCN[x.pos] || x.pos)}</span><span class="dim">${esc(x.name)}</span><span class="honor">${x.ovr}</span></div>`).join("")}
          </div>
        </div>
        <div class="scene-tag" style="margin-top:16px">第一步 · ban 掉对面的英雄${s.decider ? "（决胜局 ban 三个，按掉绝活他这条线就废一半）" : ""}</div>
        <div class="opts" style="display:grid;gap:9px;margin-top:10px">
          ${(s.banOpts || []).map((o, i) => `<div class="opt"><span class="idx">${i + 1}</span>
            <button class="btn" data-act="choose" data-i="${i}">${esc(o.t)}
              <span class="tagline">${o.comfort ? `<span class="chip red">对面常用</span>` : ""}<span class="chip">${esc(o.d || "")}</span></span>
            </button></div>`).join("")}
        </div>
      </div>`);
    }
    if (s.step === 1) {
      return shell(`<div class="fade-in">${head}
        <div class="scene-tag" style="margin-top:14px">第二步 · 选英雄（熟练度决定这把你怎么打）</div>
        <div class="panel flat" style="margin-top:8px"><span class="dim" style="font-size:13px">ban 位：${esc(s.ban || "空 ban")} · 对面打法 ${esc((s.opp || {}).tendency || "")}</span></div>
        <div class="opts" style="display:grid;gap:9px;margin-top:12px">
          ${(s.opts || []).map((o, i) => `<div class="opt"><span class="idx">${i + 1}</span>
            <button class="btn" data-act="choose" data-i="${i}">${esc(o.t)}${o.main ? ' <span class="chip gold">本命</span>' : ""}
              <span class="tagline"><span class="chip ${o.prof >= 80 ? "gold" : "blue"}">熟练 ${Math.round(o.prof)}</span>${o.ctr ? `<span class="chip ${o.ctr > 0 ? "green" : "red"}">克制 ${o.ctr > 0 ? "+" : ""}${o.ctr}%</span>` : ""}<span class="chip">${esc(o.d || "")}</span></span>
            </button></div>`).join("")}
        </div>
        <div class="right" style="margin-top:14px;text-align:right"><button class="btn small" style="width:auto" data-act="choose" data-i="0" data-v="back">回去重 ban</button></div>
      </div>`);
    }
    return shell(`<div class="fade-in">${head}
      <div class="scene-tag" style="margin-top:14px">第三步 · 这局怎么打</div>
      <div class="panel flat" style="margin-top:8px"><span class="dim" style="font-size:13px">你的 ${esc(s.hero || "")} · 对面 ${esc(s.oppHero || "")} · 对面 ${esc((s.opp || {}).tendency || "")}（${esc(s.opp ? "" : "")}）</span></div>
      <div class="opts" style="display:grid;gap:9px;margin-top:12px">
        ${(s.opts || []).map((o, i) => `<div class="opt"><span class="idx">${i + 1}</span>
          <button class="btn" data-act="choose" data-i="${i}">${esc(o.t)}
            <span class="tagline"><span class="chip ${o.edge > 0 ? "green" : o.edge < 0 ? "red" : ""}">克制 ${o.edge > 0 ? "+" : ""}${o.edge}%</span><span class="chip">${esc(o.why || "")}</span><span class="chip">${esc(o.d || "")}</span></span>
          </button></div>`).join("")}
      </div>
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
    return shell(`<div class="fade-in">
      <div class="between">
        <div><div class="kicker">赛前 · BO5</div><h2 style="margin:5px 0 0">对 ${esc(s.oppName)}</h2></div>
        <div class="row"><span class="chip">对面倾向 ${esc(s.tendency || "")}</span><span class="chip">教练 ${esc(s.coach || "")}</span>${s.styleName ? `<span class="chip gold">我方 ${esc(s.styleName)}</span>` : ""}</div>
      </div>
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
          <button class="btn" data-act="choose" data-i="0">针对他们的核心<span class="tagline">把对面最强那一环按掉 8 点，赌他站不出来</span></button>
          <button class="btn" data-act="choose" data-i="1">补自己的短板<span class="tagline">自己最弱那一环 +7，别让人从这里撕开</span></button>
          <button class="btn" data-act="choose" data-i="2">藏一手底牌<span class="tagline">决胜局 +4% 成功率，但前几局没有额外加成</span></button>
        </div>
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
    return shell(`<div class="fade-in">
      <div class="between">
        <div><div class="kicker">第 ${s.g} 局 · BO${s.bestOf} · 局势</div>
        <h2 style="margin:5px 0 0">${esc(s.title || "")} ${esc(s.score || "")}</h2></div>
        <div class="row"><span class="chip blue">${esc(s.hero || "")}</span><span class="dim">vs</span><span class="chip red">${esc(s.oppHero || "")}</span></div>
      </div>
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
              <span class="tagline"><span class="chip ${o.p >= .6 ? "green" : o.p >= .45 ? "blue" : "red"}">成功率 ${Math.round(o.p * 100)}%</span><span class="chip dim">区间 ${Math.round(o.pLo * 100)}–${Math.round(o.pHi * 100)}%</span><span class="chip">${esc(o.dimName || "")}</span>${o.risk === "gamble" ? '<span class="chip gold">赌</span>' : o.risk === "pos" ? '<span class="chip red">位置</span>' : ""}${tagsHTML(o.tags)}</span>
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
            <span class="tagline"><span class="chip ${o.p >= .6 ? "green" : o.p >= .45 ? "blue" : "red"}">成功率 ${Math.round(o.p * 100)}%</span><span class="chip">${esc(o.dimName || "")}</span>${o.risk === "high" ? '<span class="chip red">高风险</span>' : ""}</span>
          </button></div>`).join("")}
      </div>
      <div class="small-note" style="margin-top:10px">决胜局的每个选择都会被记住。赛后会有人截这一帧。</div>
    </div>`);
  }

  /* ---------- 单局结算 ---------- */
  function renderBoGame(s) {
    const rows = s.rows || [];
    const ctr = s.ctr || { d: 0, why: "" };
    return shell(`<div class="fade-in">
      <div class="between">
        <div><div class="kicker">${esc(s.title || "")} · 第 ${s.g} 局</div>
        <h2 style="margin:5px 0 0" class="res ${s.win ? "w" : "l"}">${s.win ? "拿下" : "丢了"}</h2></div>
        <div style="text-align:right"><div class="mono" style="font-size:20px">${s.wins}-${s.losses}</div><div class="small-note">阵容 ${esc(s.hero || "")} vs ${esc(s.oppHero || "")}</div></div>
      </div>
      ${s.upset ? `<div class="panel flat" style="margin-top:10px;border-color:rgba(240,195,60,.6)"><span class="chip gold">爆冷</span> <span class="dim">数据全线落后，但你赢了。这就是这游戏的魅力。</span></div>` : ""}
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
        <span class="dim" style="font-size:13px">胜率 ${Math.round((s.p || 0) * 100)}% · 局势值 ${Math.round(s.mom || 0)} · 英雄克制 ${ctr.d > 0 ? "+" : ""}${ctr.d}%${ctr.why ? "（" + esc(ctr.why) + "）" : ""}</span>
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
    return shell(`<div class="fade-in">
      <div class="kicker">世界赛 · 现在的进度：${esc(roundName)}</div>
      <h2 style="margin:5px 0 4px">16 队，只有 8 个位置</h2>
      <p class="dim">赢三场出线，输三场回家。3-0 的队伍直接进八强，2-2 的最后一把是真刀真枪。</p>
      <div class="panel" style="margin-top:12px">
        ${["3-0", "3-1", "3-2", "2-2", "1-2"].filter(k => (grp[k] || []).length).map(k => `<div class="between wrap" style="margin-top:8px">
          <span class="chip gold">${k}</span>
          <div class="row wrap" style="gap:6px;flex:1;justify-content:flex-end">${grp[k].map(r => `<span class="chip ${r.mine ? "gold" : r.out ? "" : "blue"}">${esc(r.name)}</span>`).join(" ")}</div>
        </div>`).join("")}
      </div>
      ${br ? `<div class="panel flat" style="margin-top:12px">
        <div class="scene-tag">淘汰赛</div>
        <div style="margin-top:8px"><div class="small-note">八强</div>${pairHTML(br.qf)}</div>
        ${br.sf ? `<div style="margin-top:8px"><div class="small-note">四强</div>${pairHTML(br.sf)}</div>` : ""}
        ${br.f ? `<div style="margin-top:8px"><div class="small-note">决赛</div>${pairHTML(br.f)}</div>` : ""}
      </div>` : ""}
      <div class="right" style="margin-top:18px;text-align:right"><button class="btn primary small" data-act="choose" data-i="0">继续</button></div>
    </div>`);
  }

  /* ---------- 商店 ---------- */
  function renderShop(s) {
    return shell(`<div class="fade-in">
      <div class="between">
        <div><div class="kicker">${s.ml ? s.ml.year + " 年 " + s.ml.month + " 月" : ""} · 本月采购</div>
        <h2 style="margin:5px 0 0">钱要用出去</h2></div>
        <div style="text-align:right"><div class="mono gold" style="font-size:20px;color:var(--gold)">${Math.round(s.money)} 万</div><div class="small-note">存款</div></div>
      </div>
      <p class="dim" style="margin-top:8px">一个月只能买一样。买之前想清楚，这钱是你三年的青春换的。</p>
      <div style="display:grid;gap:10px;margin-top:14px">
        ${(s.items || []).map((it, i) => `<div class="offer" data-act="choose" data-i="${i}" style="${s.money < it.price ? "opacity:.5" : ""}">
          <div class="between">
            <div style="flex:1">
              <div style="font-weight:800;font-size:16px">${esc(it.name)} <span class="chip ${s.money >= it.price ? "blue" : "red"}">${it.price} 万</span></div>
              <div class="small-note" style="margin-top:4px">${esc(it.desc || "")}</div>
              <div class="small-note" style="color:var(--gold);margin-top:3px">${esc(effCN(it.eff || {}))}</div>
            </div>
          </div>
        </div>`).join("")}
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
      <div class="between"><span class="rar">${esc(rc.n)}${b ? " · " + esc(b) : ""}</span>${c.dup ? '<span class="dup">重复 +30 声望</span>' : ""}</div>
      <div class="cname">${esc(c.name)}</div>
      <div class="cdesc">${esc(c.desc || "")}</div>
      <div class="cflavor">${esc(effCN(c.eff || {}))}</div>
    </div>`;
  }
  function renderGacha(s) {
    const pulled = s.pulled || [];
    const builds = s.builds || {};
    const bk = Object.keys(builds).filter(k => builds[k] > 0);
    return shell(`<div class="fade-in">
      <div class="between">
        <div><div class="kicker">抽卡 · 构筑</div><h2 style="margin:5px 0 0">券 ${s.ticket || 0} 张</h2></div>
        <div style="text-align:right"><div class="small-note">保底 ${s.pity || 0}/40 抽出金</div><div class="small-note">卡包 ${s.bag || 0} 张</div></div>
      </div>
      ${bk.length ? `<div class="panel flat" style="margin-top:10px"><span class="chip gold">流派</span> ${bk.map(k => `<span class="chip" style="margin-left:4px">${esc(BUILDN(k))} ×${builds[k]}</span>`).join("")}</div>` : ""}
      ${pulled.length ? `<div class="draw-wrap" style="margin-top:14px">${pulled.map(c => `<div class="card-flip"><div>${renderGachaCard(c)}</div></div>`).join("")}</div>` : ""}
      <div class="row" style="margin-top:18px;gap:10px">
        <button class="btn primary small" style="width:auto" data-act="choose" data-i="0" data-v="one">单抽 · 1 券</button>
        <button class="btn small" style="width:auto" data-act="choose" data-i="0" data-v="ten">十连 · 9 券</button>
        ${pulled.length ? `<button class="btn small" style="width:auto" data-act="choose" data-i="0">收下继续</button>` : `<button class="btn small" style="width:auto" data-act="choose" data-i="0">退出</button>`}
      </div>
      <div class="panel flat" style="margin-top:12px"><span class="small-note">券从比赛里来：常规赛赢一场 1 张，季后赛一场 3 张，国际赛赢一场 5 张，S 赛赢一场 8 张。抽到的卡在「卡组」里装槽才生效。</span></div>
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
      <p class="dim">同流派越多，羁绊越强：两张 +5%，三张大会心，五张走极端但带副作用。想换方向就卸下来重装。</p>
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
        ${bag.map(c => `<div class="panel flat" style="--rc:${RC(c.rarity).c};cursor:pointer" data-act="choose" data-i="0" data-v="${esc(c.id)}">
          <div class="rar" style="color:${RC(c.rarity).c}">${esc(RC(c.rarity).n)} · ${esc(BUILDN(c.build))}</div>
          <div style="font-weight:800;font-size:13px;margin-top:2px">${esc(c.name)}</div>
          <div class="small-note" style="margin-top:3px">${esc(effCN(c.eff || {}))}</div>
        </div>`).join("")}
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
    el.style.fontSize = (13 + Math.random() * 3.4).toFixed(1) + "px";
    el.style.animationDuration = (7 + Math.random() * 6).toFixed(2) + "s";
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
    /* 一进场先砸几条上来，别等半秒才热闹；换页时已经满了就别再补 */
    let i = 0, sent = 0;
    const room = dmRoom();
    const alive = (room && room.children) ? room.children.length : 0;
    if (alive < 6) {
      const burst = Math.min(6 - alive, list.length);
      for (; i < burst; i++) { dmDrop(list[i]); sent++; }
    }
    const gap = list.length > 11 ? 300 : list.length > 7 ? 420 : 620;
    /* 一条弹幕飞完约 7–13 秒，300ms 一条的话屏幕上始终有 20 条左右；上限只是防内存泄漏 */
    DM.timer = window.setInterval(() => {
      if (sent > 900) { dmStop(false); return; }
      if (i >= list.length) { i = 0; shuffleDM(list); }
      dmDrop(list[i++]); sent++;
    }, gap);
  }

  function renderDock() {
    if (view !== "game" || !started || (sc && /^create_/.test(sc.type))) { dock.classList.add("hidden"); return; }
    dock.classList.remove("hidden");
    const S = G.getState();
    dock.innerHTML = `
      <button class="btn small" style="width:auto" data-act="quicksave">存档</button>
      <button class="btn small" style="width:auto" data-act="tab-slots">读档</button>
      <button class="btn small ghost" style="width:auto" data-act="tab-codex">档案</button>
      <button class="btn small ghost" style="width:auto" data-act="dm-toggle">弹幕${DM.on ? "开" : "关"}</button>
      <button class="btn small ghost" style="width:auto" data-act="snd-toggle">声音${(window.SND && window.SND.muted && window.SND.muted()) ? "关" : "开"}</button>
      <span class="small-note mono" style="margin-left:6px">${S ? tickLabel(S.tick) : ""}${S && S.endless ? " · 第 " + S.season + " 季" : ""}</span>
    `;
  }

  function render() {
    if (mgrMode && window.UIMGR && window.MGR && window.MGR.scene()) {
      const ms = window.MGR.scene();
      app.innerHTML = window.UIMGR.bodyHTML(ms);
      app.dataset.scene = ms.type || "mgr";
      document.body.classList.remove("in-game");
      bgmFor("menu");
      return;
    }
    const creating = view === "game" && sc && /^create_/.test(sc.type);
    const top = creating ? "" : topbarHTML();
    app.innerHTML = top + bodyHTML();
    app.dataset.scene = view === "menu" ? "menu:" + tab : (sc ? sc.type : "");
    document.body.classList.toggle("in-game", view === "game" && started);
    renderDock();
    if (view === "game" && sc && sc.type !== "ending") {
      try { G.save("auto"); } catch (e) {}
    }
    const dmScene = view === "game" && sc && (/^(duel|matchday|duelResult|swissResult|bp|inGame|boGame|prep|worldsMap|highlight|moment)$/.test(sc.type) || !!sc.dm);
    if (dmScene) dmStart(sc, { keep: DM.lastMatch === true }); else dmStop(false);
    DM.lastMatch = !!dmScene;
    /* 即时弹幕：按"这一下发生了什么"炸一屏，与常驻弹幕并行 */
    if (window.LIVE && view === "game" && sc && DM.on) { try { LIVE.after(sc); } catch (e) {} }
    bgmFor(sceneBgm());
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
        sfx(big ? "victory" : "defeat");
      }
    }
    const ni = document.getElementById("nameInput");
    if (ni) { ni.focus(); ni.addEventListener("keydown", e => { if (e.key === "Enter") doName(); }); }
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
      case "mgr-exit": mgrMode = false; render(); break;
      case "mgr": {
        if (!window.MGR || !window.UIMGR) break;
        const handled = window.UIMGR.onAct(v, el, i);
        if (handled === false) window.MGR.choose(i, v);
        render();
        break;
      }
      case "tab": tab = v || "main"; render(); break;
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
        if (G.save(v)) toast("已存到档位 " + v); else toast("存档失败");
        render();
        break;
      }
      case "quicksave": if (G.save("auto")) toast("已自动存档"); break;
      case "tab-slots": tab = "slots"; view = "menu"; render(); break;
      case "tab-codex": tab = "codex"; view = "menu"; render(); break;
      case "codex-tab": codexTab = v; render(); break;
      case "codex-go": {
        const el2 = document.getElementById("codexQ");
        codexQ = el2 ? String(el2.value || "").trim() : "";
        render();
        break;
      }
      case "codex-clear": codexQ = ""; render(); break;
      case "menu": view = "menu"; tab = "main"; started = false; render(); break;
      case "restart": startNew(); break;
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
    onAct(el.dataset.act, el);
  });

  document.addEventListener("keydown", e => {
    if (view !== "game" || !sc) return;
    const k = e.key;
    if (k >= "1" && k <= "9") {
      const idx = Number(k) - 1;
      const sc2 = sc;
      if (sc2.type === "action" || sc2.type === "event" || sc2.type === "duel" || sc2.type === "retire" || sc2.type === "talk" || sc2.type === "moment") {
        const n = sc2.type === "event" ? sc2.ev.opts.length : sc2.type === "duel" ? sc2.duel.sit.opts.length : sc2.type === "retire" ? 2 : (sc2.type === "talk" || sc2.type === "moment") ? (sc2.opts || []).length : sc2.acts.length;
        if (idx < n) { wakeAudio(); sfx("click"); advance(idx); e.preventDefault(); }
      } else if (sc2.type === "create_base" || sc2.type === "create_pool") {
        if (idx < 3) { wakeAudio(); sfx("click"); advance(idx); e.preventDefault(); }
      }
    }
    if (k === "Enter" && (sc.type === "result" || sc.type === "matchday" || sc.type === "duelResult" || sc.type === "swissResult" || sc.type === "monthend" || sc.type === "draw")) {
      wakeAudio(); sfx("click"); advance(0); e.preventDefault();
    }
  });

  render();
})();
