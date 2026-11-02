/* 《登神》界面层 —— 场景渲染 + 交互绑定 */
(function () {
  "use strict";
  const A = window.ART, G = window.GAME;
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
    if (sc.type === "duel" || sc.type === "duelResult" || sc.type === "matchday" || sc.type === "swissResult") {
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
          <div class="ovr-badge"><b>${ovr}</b><span>OVR</span></div>
          <div class="hud-item"><span class="lb">精力</span>${barHTML(S.energy, "en")}</div>
          <div class="hud-item"><span class="lb">心态</span>${barHTML(S.morale, "mo")}</div>
          <div class="hud-item"><span class="lb">气势</span>${barHTML(S.burst, "hp")}</div>
          <div class="hud-item"><span class="lb">话语权</span><span class="vl">${v}</span></div>
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
        <h4>PLAYER</h4>
        <div class="side-kv"><span>OVR</span><b>${G.myOvr()}</b></div>
        <div class="side-kv"><span>年龄</span><b>${S.age}</b></div>
        <div class="side-kv"><span>身价</span><b>${Math.max(0, Math.round(S.salary))} 万/年</b></div>
        <div class="side-kv"><span>粉丝</span><b>${fan(S.fans)}</b></div>
        <div class="side-kv"><span>虎扑</span><b>${(S.hupu || 0).toFixed(1)}</b></div>
      </div>
      <div class="side-card">
        <h4>ATTRIBUTES</h4>
        <div class="radar-box">${A.radar(S.st, 216)}</div>
        ${G.STATS.map(k => `<div class="side-stat"><span>${G.CN[k]}</span>${barHTML(S.st[k])}<span>${Math.round(S.st[k])}</span></div>`).join("")}
      </div>
      <div class="side-card side-wide">
        <h4>ROSTER · ${esc(t ? t.name : "无队")}</h4>
        ${roster.length ? roster.map(r => `<div class="roster-row ${r.mine ? "me" : ""}">
          <span class="rp">${posShort(r.pos)}</span>
          <span class="rn">${esc(r.name)}${r.mine ? " ★" : ""}</span>
          <span class="ro">${Math.round(r.ovr)}</span>
        </div>`).join("") : `<div class="small-note">你还没有队。</div>`}
      </div>
      <div class="side-card side-wide">
        <h4>CAREER</h4>
        <div class="side-kv"><span>战绩</span><b>${S.record.wins} 胜 ${S.record.losses} 负</b></div>
        <div class="side-kv"><span>冠军</span><b>${titles.length}</b></div>
        <div class="side-kv"><span>存款</span><b>${Math.round(S.money)} 万</b></div>
        <div class="side-kv"><span>天赋槽</span><b>${(S.talents || []).length}/${S.slots}</b></div>
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
          <button class="btn" data-act="tab" data-v="codex">档案室 <span class="tagline">赛制、数值、编年史、冷知识</span></button>
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

  function renderCodex() {
    const total = {
      ev: (window.DATA_EVENTS || []).length + (window.DATA_MEME_EVENTS || []).length + (window.DATA_ENDLESS_EVENTS || []).length,
      tal: (window.DATA_TALENTS || []).length, hero: (window.DATA_HEROES || []).length,
      team: (window.DATA_TEAMS ? Object.keys(window.DATA_TEAMS).length : 0),
      pl: (window.DATA_PLAYERS ? Object.keys(window.DATA_PLAYERS).length : 0)
    };
    const ch = window.DATA_CHRONICLE || {};
    return `<div class="fade-in">
      <div class="between" style="margin-bottom:14px">
        <div><div class="kicker">ARCHIVE</div><h2>档案室</h2></div>
        <button class="btn small ghost" data-act="tab" data-v="main">返回</button>
      </div>
      <div class="panel">
        <h3>一局怎么过</h3>
        <p class="story">2025 年 1 月进队，第 1 年打 LDL，第 2、3 年打 LPL。每个月：一次行动（加练 / 复盘 / 排位 / 开播 / 休息 / 健身 / 谈话）→ 一次随机事件 → 当月的比赛。
        每月约 40 秒。三年之约 23–30 分钟收工；无尽生涯没有终点，打到你 33 岁、或者没人要为止。</p>
        <div class="divider"></div>
        <h3>赛制（写实）</h3>
        <p class="story">LDL 与 LPL 都分三个赛段。每个赛段：一个月常规赛 + 一个月季后赛（BO5），决出赛段名次。
        第一赛段前二 → 先锋赛（First Stand，各赛区顶尖队伍的国际赛）；第二赛段前二 → MSI；第三赛段前四 → 全球总决赛。
        LDL 打不上国际赛，但 LDL 赛段夺冠会被 LPL 直接买走（LPL 2018 年联盟化后没有直接降级，走联盟准入）。
        世界赛瑞士轮五轮三胜出线，八强、四强、决赛 BO5。十一月全明星与年度颁奖，十二月转会窗。</p>
        <div class="divider"></div>
        <h3>数值</h3>
        <p class="story">八维 0–100：对线、操作、意识、英雄池、心态、体能、团队、名气。OVR 按位置加权。精力每月 100，低于 20 会开始掉体能；心态影响判定与成长；
        话语权由名气、冠军数、OVR、粉丝决定，超过 45 能对管理层施压，超过 60 能点名要人。对局里气势攒到 60 可以点【爆种】，本回合判定保底成功，代价是精力。</p>
        <div class="divider"></div>
        <h3>编年史 · 真实战绩</h3>
        <div class="chron">
          ${(ch.worlds || []).map(w => `<div class="chron-row">
            <span class="yr">${w.year}</span>
            <span class="ch">${esc(w.champion)}</span>
            <span class="dim">${esc(w.score || "")} vs ${esc(w.runnerUp || "")}</span>
            <span class="nt">${esc((w.note || "").slice(0, 46))}</span>
          </div>`).join("")}
        </div>
        <div class="small-note" style="margin-top:8px">MSI 2015–2024：${(ch.msi || []).map(m => m.year + " " + m.champion).join("、")}</div>
        <div class="small-note">LPL 近五年：${(ch.lpl || []).filter(x => x.year >= 2020).map(x => x.year + x.split + " " + x.champion).join("、")}</div>
        <div class="divider"></div>
        <h3>冷知识库</h3>
        <div class="row wrap" style="gap:6px">
          ${(ch.records || []).map(r => `<span class="chip" title="${esc(r.note || "")}">${esc(r.value)} ${esc(r.holder || "")}</span>`).join("")}
        </div>
        <div class="divider"></div>
        <h3>数据量</h3>
        <p class="story">事件 ${total.ev} 条 · 天赋卡 ${total.tal} 张 · 英雄 ${total.hero} 个 · 战队 ${total.team} 支 · 真实选手 ${total.pl} 名。
        编年史截至 2024 赛季（Worlds 2011–2024、MSI 2015–2024、LPL 2015–2024），2025 年起全部为推演。</p>
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
      ${s.patch ? `<div class="panel flat" style="margin-top:12px"><span class="chip gold">版本</span> <span class="dim">${esc(s.patch)}</span></div>` : ""}
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
        <div class="stat-cell"><div class="k">OVR</div><div class="v gold">${s.ovr}</div></div>
        <div class="stat-cell"><div class="k">精力</div><div class="v">${Math.round(s.energy)}</div></div>
        <div class="stat-cell"><div class="k">心态</div><div class="v">${Math.round(s.morale)}</div></div>
        <div class="stat-cell"><div class="k">话语权</div><div class="v">${s.voice}</div></div>
        <div class="stat-cell"><div class="k">名气</div><div class="v">${s.fame}</div></div>
        <div class="stat-cell"><div class="k">粉丝</div><div class="v" style="font-size:17px">${fan(s.fans)}</div></div>
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
          return `<div class="card-flip" style="animation-delay:${i * .09}s"><div class="card-face" style="--rc:${rc}">
            <div class="between"><span class="rar">${(G.RARITY[c.rarity] || {}).n || ""} · ${esc(c.type || "")}</span>${c.dup ? `<span class="dup">重复 +30 声望</span>` : ""}</div>
            <div class="cname">${esc(c.name)}</div>
            <div class="ctype">${esc(c.tag || "")}</div>
            <div class="cdesc">${esc(c.desc)}</div>
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
  function dmPools(sc) {
    const D = window.DATA_DANMAKU;
    if (!D) return [];
    const keep = [];
    const push = (k, n) => { if (Array.isArray(D[k])) for (let i = 0; i < n; i++) keep.push(D[k]); };
    const all = (k) => (Array.isArray(D[k]) ? D[k] : []);
    const out = [];
    const take = (k, n) => {
      const pool = all(k).slice();
      for (let i = 0; i < n && pool.length; i++) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    };
    if (sc.type === "duel") {
      const d = sc.duel || {};
      const lead = (d.wins || 0) >= (d.losses || 0);
      take(lead ? "win" : "lose", 3);
      take("clutch", 2); take("throw", 2);
      take("banpick", 2); take("ritual", 2); take("spam", 1);
      if ((d.game || 1) >= 4) take("gg", 2);
    } else if (sc.type === "matchday") {
      take((sc.l || 0) > (sc.w || 0) ? "lose" : "win", 4);
      take("clutch", 1); take("throw", 1); take("ritual", 2); take("blackwhite", 1);
    } else if (sc.type === "duelResult" || sc.type === "swissResult") {
      const won = (sc.game && sc.game.win) || sc.win;
      take(won ? "win" : "lose", 3); take("gg", 2); take("ritual", 1); take("blackwhite", 1);
    }
    return out;
  }
  function dmStop() {
    if (DM.timer) { clearInterval(DM.timer); DM.timer = null; }
    const room = document.getElementById("danmaku");
    if (room && !window.__dmKeep) room.innerHTML = "";
  }
  function dmDrop(item) {
    const room = dmRoom();
    const D = window.DATA_DANMAKU;
    const grp = D && D.groups ? D.groups.filter(x => x.g === item.g)[0] : null;
    const el = document.createElement("div");
    el.className = "dm";
    el.style.top = (5 + Math.random() * 58).toFixed(2) + "%";
    el.style.fontSize = (13 + Math.random() * 3).toFixed(1) + "px";
    el.style.animationDuration = (8 + Math.random() * 6).toFixed(2) + "s";
    el.style.animationDelay = (Math.random() * 0.9).toFixed(2) + "s";
    el.style.color = dmColor(item.g);
    el.innerHTML = `<span class="g">${esc(item.g)}</span>${esc(dmFill(item.t))}`;
    el.addEventListener("animationend", () => { if (el.parentNode) el.parentNode.removeChild(el); });
    room.appendChild(el);
  }
  function dmStart(sc) {
    dmStop();
    if (!DM.on || !window.DATA_DANMAKU || typeof window.setInterval !== "function") return;
    const list = dmPools(sc);
    if (!list.length) return;
    let i = 0;
    DM.timer = window.setInterval(() => {
      if (i >= list.length) { dmStop(); return; }
      dmDrop(list[i++]);
    }, 620);
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
    const creating = view === "game" && sc && /^create_/.test(sc.type);
    const top = creating ? "" : topbarHTML();
    app.innerHTML = top + bodyHTML();
    app.dataset.scene = view === "menu" ? "menu:" + tab : (sc ? sc.type : "");
    document.body.classList.toggle("in-game", view === "game" && started);
    renderDock();
    if (view === "game" && sc && sc.type !== "ending") {
      try { G.save("auto"); } catch (e) {}
    }
    const dmScene = view === "game" && sc && /^(duel|matchday|duelResult|swissResult)$/.test(sc.type);
    if (dmScene) dmStart(sc); else dmStop();
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
      case "tab": tab = v || "main"; render(); break;
      case "dm-toggle": DM.on = !DM.on; if (!DM.on) dmStop(); else if (view === "game" && sc) dmStart(sc); sfx("notify"); render(); break;
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
      if (sc2.type === "action" || sc2.type === "event" || sc2.type === "duel" || sc2.type === "retire") {
        const n = sc2.type === "event" ? sc2.ev.opts.length : sc2.type === "duel" ? sc2.duel.sit.opts.length : sc2.type === "retire" ? 2 : sc2.acts.length;
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
