/* 《登神》电竞经理模式 —— 纯状态机，不碰 DOM。
   导出：window.MGR = { start(opts), scene(), choose(i,v), state(), ... }
   界面层：js/ui_mgr.js（window.UIMGR）。场景全部以 mgr_ 前缀命名。

   设计口径：
   1) 玩家是经理，不是选手。选队 → 抽八张卡 → 排五个首发 → 备赛 → BP → 打完 → 经营 → 下一年。
   2) 比赛核心全部复用 window.MATCH（分维度胜率 / 英雄克制 / 爆冷），这里只负责把阵容翻译成"侧"。
   3) 所有给玩家看的字都是中文；LANE/MECH 这类 key 一律不上屏。
   4) 单位统一「万」：卡面 salary × 20 = 一年工资。预算付工资、付训练、付转会。
*/
window.MGR = (function () {
  "use strict";

  /* ================= 常量 ================= */
  var POS = ["TOP", "JUG", "MID", "BOT", "SUP"];
  var POSCN = { TOP: "上单", JUG: "打野", MID: "中单", BOT: "下路", SUP: "辅助" };
  var STAT = ["LANE", "MECH", "GAME", "POOL", "MENTAL", "PHYS", "TEAM", "FAME"];
  var TERM = function () { return window.DATA_TERMS || {}; };
  var STCN = (function () {
    var t = TERM().stat || {};
    return {
      LANE: t.LANE || "对线", MECH: t.MECH || "操作", GAME: t.GAME || "意识", POOL: t.POOL || "英雄池",
      MENTAL: t.MENTAL || "心态", PHYS: t.PHYS || "体能", TEAM: t.TEAM || "团队", FAME: t.FAME || "名气"
    };
  })();
  var RAR = {
    "金": { c: "#ffd84e", n: "金色", v: 3 },
    "紫": { c: "#b47cff", n: "紫色", v: 2 },
    "蓝": { c: "#4cc2ff", n: "蓝色", v: 1 }
  };
  var DIMTAC = { "单带": "split", "前期": "early", "团战": "fight", "运营": "ope", "野核": "early", "爆发": "fight", "稳定": "ope" };
  var TEND_TAC = { "运营": "ope", "后期": "ope", "打团": "fight", "单带": "split", "前期": "early" };
  var TIERMONEY = {
    S: { budget: 4200, cap: 2400 },
    A: { budget: 3600, cap: 2100 },
    B: { budget: 3000, cap: 1800 },
    C: { budget: 2600, cap: 1600 }
  };
  var CUSTOM_MONEY = { budget: 3000, cap: 1600 };
  var TIERPOWER = { S: 84, A: 78, B: 71, C: 65 };
  var MONEY = 20;            // 卡面工资 × 20 = 万/年
  var MAX_CARDS = 12;
  var MAX_SEASON = 3;
  var ENVS = ["打团", "前期滚雪球", "单带", "运营", "对线"];
  var RDNAME = ["八强赛", "四强赛", "决赛"];
  var ENEMY_TEND = ["运营", "打团", "单带", "后期", "前期"];

  /* ================= 小工具 ================= */
  var rnd = Math.random;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ri(a, b) { return a + Math.floor(rnd() * (b - a + 1)); }
  function pickOne(a) { return a && a.length ? a[Math.floor(rnd() * a.length)] : null; }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function each(o, fn) {
    if (!o || !o.length) return;
    for (var i = 0; i < o.length; i++) {
      if (o[i] === null || o[i] === undefined) continue;
      fn(o[i], i);
    }
  }
  function hash(s) {
    var h = 2166136261; s = String(s);
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; }
    return h >>> 0;
  }
  function seeded(s) {
    var x = hash(s) || 2463534242;
    return function () {
      x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0;
      return x / 4294967296;
    };
  }
  function wan(v) {
    v = Math.round(Number(v) || 0);
    var neg = v < 0; v = Math.abs(v);
    var s = String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return (neg ? "-" : "") + s + " 万";
  }
  function sp(v) { return (v > 0 ? "+" : "") + Math.round(v); }
  function digits(v) { return String(Math.round(Number(v) || 0)); }
  function act(v, label, hint, tone, dis) { return { v: v, label: label, hint: hint || "", tone: tone || "", dis: !!dis }; }

  /* ================= 数据访问（只读） ================= */
  function DM() { return window.DATA_MGR || {}; }
  function CARDDB() { return DM().cards || []; }
  function TACDB() { return DM().tactics || []; }
  function COACHDB() { return DM().coaches || []; }
  function HEROES() { return window.DATA_HEROES || []; }
  function TEAMSRAW() { return window.DATA_TEAMS || null; }
  var _teamsCache = null;
  function TEAMS() {
    if (_teamsCache) return _teamsCache;
    var T = TEAMSRAW(), out = [];
    if (!T) return (_teamsCache = out);
    if (T instanceof Array) {
      each(T, function (t) { if (t) { var c = shallow(t); if (!c.id) c.id = ""; out.push(c); } });
    } else {
      for (var k in T) {
        if (!T.hasOwnProperty(k)) continue;
        var t = T[k];
        if (!t || typeof t !== "object") continue;
        var c2 = shallow(t); c2.id = t.id || k; out.push(c2);
      }
    }
    return (_teamsCache = out);
  }
  function shallow(o) { var c = {}; for (var k in o) if (o.hasOwnProperty(k)) c[k] = o[k]; return c; }
  function teamById(id) { var L = TEAMS(); for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i]; return null; }
  function teamName(id) { var t = teamById(id); return t ? (t.name || t.id || "无队") : "自由人"; }
  function coachById(id) { var L = COACHDB(); for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i]; return null; }
  function tacById(id) { var L = TACDB(); for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i]; return null; }
  function cardById(id) { var L = CARDDB(); for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i]; return null; }
  function heroByName(n) {
    var H = HEROES();
    for (var i = 0; i < H.length; i++) if (H[i].n === n) return H[i];
    return null;
  }

  /* ================= 状态 ================= */
  var S = null;

  function newState(o) {
    o = o || {};
    return {
      version: 1,
      seq: 1,
      season: 1,
      maxSeason: Math.max(1, Math.min(9, o.seasons || MAX_SEASON)),
      phase: "menu",
      teamId: null, teamName: "", custom: false, tier: "B",
      budget: 0, cap: 0,
      cards: [], lineup: { TOP: null, JUG: null, MID: null, BOT: null, SUP: null },
      coach: null, coachOffers: [],
      tactics: [],
      tickets: 0, pity: 0, goldPity: 0, pull: [], redraft: 1,
      patch: {}, env: "运营",
      history: [], log: [], msg: [],
      lg: null, lgDone: false, seasonActive: false,
      pre: null, bp: null, match: null, tactic: null,
      regW: 0, regL: 0, regPlayed: 0,
      debt: 0,
      po: null, wd: null,
      market: [], marketRound: 0, trainFocus: null,
      seasonStat: null,
      score: 0, ended: false,
      opts: { name: o.name || "" }
    };
  }

  function logLine(t) {
    if (!S) return;
    S.log.push({ season: S.season, t: String(t) });
    if (S.log.length > 160) S.log.shift();
  }
  function note(t) {
    if (!S) return;
    S.msg.push(String(t));
    if (S.msg.length > 12) S.msg.shift();
    logLine(t);
  }
  function clearMsg() { if (S) S.msg = []; }

  /* ================= 卡 / 阵容 ================= */
  function genPool(card) {
    var r = seeded(String(card.id || card.pid || "x") + "|pool");
    var list = [];
    each(HEROES(), function (h) { if ((h.pos || []).indexOf(card.pos) >= 0) list.push(h.n); });
    if (!list.length) return {};
    shuffleBy(list, r);
    var rb = (RAR[card.rarity] || {}).v || 1;
    var n = Math.min(list.length, 4 + Math.floor(r() * 3));
    var out = {};
    for (var i = 0; i < n; i++) out[list[i]] = clamp(Math.round(56 + r() * 20 + rb * 5), 45, 97);
    var best = null;
    for (var k in out) if (!best || out[k] > out[best]) best = k;
    if (best) out[best] = clamp(out[best] + 8, 62, 99);
    return out;
  }
  function shuffleBy(a, r) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function mainHeroOf(card) {
    var pool = card.pool || {}, best = "";
    for (var k in pool) if (!best || pool[k] > pool[best]) best = k;
    return best;
  }
  function mkCard(raw) {
    var c = shallow(raw);
    c.uid = "c" + (S.seq++);
    c.pool = genPool(raw);
    c.train = {};
    if (!c.st || typeof c.st !== "object") c.st = {};
    return c;
  }
  function ownIds() {
    var m = {};
    each(S.cards, function (c) { m[c.id] = 1; });
    return m;
  }
  function findCard(uid) {
    for (var i = 0; i < S.cards.length; i++) if (S.cards[i].uid === uid) return S.cards[i];
    return null;
  }
  function cardAt(pos) {
    var uid = S.lineup[pos];
    return uid ? findCard(uid) : null;
  }
  function starters() { return POS.map(function (p) { return cardAt(p); }); }
  function lineupReady() {
    for (var i = 0; i < POS.length; i++) if (!cardAt(POS[i])) return false;
    return true;
  }
  function salOf(card) { return Math.round((Number(card.salary) || 1) * MONEY); }
  function coachEffNow() { return (S.coach && S.coach.eff) || {}; }
  function effSt(card) {
    var st = {}, base = card.st || {}, ce = coachEffNow();
    for (var i = 0; i < STAT.length; i++) {
      var k = STAT[i], v = base[k];
      if (typeof v !== "number" || !isFinite(v)) v = 60;
      if (card.train && card.train[k]) v += card.train[k];
      if (k === "TEAM") v += (ce.team || 0) * 0.6;
      if (k === "MENTAL") v += (ce.mental || 0) * 0.6;
      if (k === "GAME") v += (ce.growth || 0) * 0.25;
      st[k] = clamp(v, 1, 99);
    }
    return st;
  }
  function infOf(pos) {
    var M = window.MATCH;
    return (M && M.INFLUENCE && M.INFLUENCE[pos]) || { LANE: .3, MECH: .3, GAME: .2, POOL: .1, TEAM: .05, MENTAL: .05 };
  }
  function ovrOf(card) {
    var st = effSt(card), inf = infOf(card.pos), a = 0, b = 0;
    for (var k in inf) { a += (st[k] || 60) * inf[k]; b += inf[k]; }
    return b ? Math.round(a / b) : 60;
  }
  function teamOvr() {
    var cs = starters().filter(Boolean);
    if (!cs.length) return 40;
    var t = 0;
    each(cs, function (c) { t += ovrOf(c); });
    return Math.round(t / cs.length);
  }
  function totalSalary() {
    var t = 0;
    each(starters(), function (c) { if (c) t += salOf(c); });
    return t;
  }
  function storeTacNames() {
    return S.tactics.map(function (id) { var t = tacById(id); return t ? t.name : ""; }).filter(Boolean);
  }

  /* ================= 卡面摘要（给界面用，全中文） ================= */
  function liveRoster() { return (S && S.cards ? S.cards : []).filter(function (c) { return !!c && !!c.pos; }); }
  function cardBrief(c) {
    if (!c || !c.st) return null;
    var st = effSt(c), r = RAR[c.rarity] || RAR["蓝"], arr = [];
    for (var i = 0; i < STAT.length; i++) {
      var k = STAT[i];
      arr.push({ k: k, cn: STCN[k], v: Math.round(st[k]), hint: (TERM().statHint || {})[k] || "" });
    }
    return {
      uid: c.uid, cardId: c.id, name: c.name || "", cn: c.cn || "", year: c.year || 0,
      pos: c.pos, poscn: POSCN[c.pos] || "全能", team: teamName(c.team),
      rarity: c.rarity || "蓝", rc: r.c, rarn: r.n,
      salary: salOf(c), ovr: ovrOf(c),
      st: arr, tags: c.tags || [], trait: c.trait || [],
      hero: mainHeroOf(c), heroProf: (c.pool && mainHeroOf(c)) ? (c.pool[mainHeroOf(c)] || 0) : 0,
      fits: S.lineup[c.pos] === c.uid,
      trained: (function () { var n = 0; for (var k2 in (c.train || {})) n += c.train[k2]; return n; })()
    };
  }
  function briefs(list) { return (list || []).filter(Boolean).map(cardBrief).filter(Boolean); }

  /* ================= 队 / 预算 ================= */
  function moneyOfTeam(t) {
    if (!t) return CUSTOM_MONEY;
    var m = TIERMONEY[t.tier] || TIERMONEY.B;
    return { budget: m.budget, cap: m.cap };
  }
  function tierPower(tier) {
    var p = TIERPOWER[tier] || 70;
    return p + Math.round((rnd() - .5) * 5);
  }
  function weakestLpl(arr) {
    var w = null;
    each(arr, function (t) { if (!w || (TIERPOWER[t.tier] || 70) < (TIERPOWER[w.tier] || 70)) w = t; });
    return w;
  }
  function signTeam(id) {
    var custom = (id === "custom");
    var t = custom ? null : teamById(id);
    if (!custom && !t) return false;
    var mny = moneyOfTeam(t);
    S.custom = custom;
    S.teamId = custom ? "t_me" : t.id;
    S.teamName = custom ? (S.opts.name || "自建战队") : (t.name || t.id);
    S.tier = custom ? "C" : (t.tier || "B");
    S.budget = mny.budget;
    S.cap = mny.cap;
    S.tickets = 10;
    try {
      var lg = JSON.parse(localStorage.getItem("denshen_career") || "null");
      if (lg && lg.rank) {
        S.budget += 500; S.tickets += 3; S.legacy = lg;
        logLine("前任传奇 " + (lg.name || "无名") + " 掏了 500 万入股，还塞给你 3 张卡。");
      }
    } catch (e) { }
    S.teamColor = custom ? "#e8b923" : (t.color || "#e8b923");
    S.teamBlurb = custom ? "注册资金 3000 万，股东是你妈。" : (t.blurb || "");
    S.boss = custom ? "你自己" : (t.boss || "资方");
    logLine("接手 " + S.teamName + "，预算 " + wan(S.budget) + "，工资帽 " + wan(S.cap) + "。");
    return true;
  }

  /* ================= 抽卡 ================= */
  var RARW = {
    S: { "金": 34, "紫": 50, "蓝": 16 },
    A: { "金": 18, "紫": 48, "蓝": 34 },
    B: { "金": 8, "紫": 38, "蓝": 54 },
    C: { "金": 2, "紫": 24, "蓝": 74 }
  };
  function rollRarity(w) {
    w = w || RARW[S.tier] || RARW.B;
    var tot = (w["金"] || 0) + (w["紫"] || 0) + (w["蓝"] || 0), r = rnd() * tot;
    if (r < (w["金"] || 0)) return "金";
    if (r < (w["金"] || 0) + (w["紫"] || 0)) return "紫";
    return "蓝";
  }
  function candidatesBy(pos, rarity, used) {
    var out = [];
    each(CARDDB(), function (c) {
      if (used && used[c.id]) return;
      if (pos && c.pos !== pos) return;
      if (rarity && c.rarity !== rarity) return;
      out.push(c);
    });
    return out;
  }
  function drawOne(pos, rw, used) {
    var want = rollRarity(rw), tries = ["金", "紫", "蓝"], i;
    var ord = [want];
    each(tries, function (x) { if (x !== want) ord.push(x); });
    for (i = 0; i < ord.length; i++) {
      var pool = candidatesBy(pos, ord[i], used);
      if (pool.length) return pickOne(pool);
    }
    var any = candidatesBy(pos, null, used);
    return any.length ? pickOne(any) : null;
  }
  function drawAny(rw, used) {
    var want = rollRarity(rw), ord = [want];
    each(["金", "紫", "蓝"], function (x) { if (x !== want) ord.push(x); });
    for (var i = 0; i < ord.length; i++) {
      var pool = candidatesBy(null, ord[i], used);
      if (pool.length) return pickOne(pool);
    }
    var any = candidatesBy(null, null, used);
    return any.length ? pickOne(any) : null;
  }
  function doInitialDraft() {
    var used = {}, out = [];
    var rw = RARW[S.tier] || RARW.B;
    each(POS, function (p) {
      var raw = drawOne(p, rw, used);
      if (raw) { used[raw.id] = 1; out.push(raw); }
    });
    var guard = 0;
    while (out.length < 8 && guard++ < 80) {
      var raw2 = drawAny(rw, used);
      if (!raw2) break;
      used[raw2.id] = 1; out.push(raw2);
    }
    S.cards = out.map(mkCard);
    S.lineup = { TOP: null, JUG: null, MID: null, BOT: null, SUP: null };
    autoLineup();
    clearMsg();
    note("开局八张卡，五个位置先凑齐，剩下的自己看着办。");
  }
  function autoLineup() {
    var taken = {};
    each(POS, function (p) { taken[p] = null; });
    // 先按位置取评分最高
    each(POS, function (p) {
      var best = null;
      each(S.cards, function (c) {
        if (c.pos !== p) return;
        if (!best || ovrOf(c) > ovrOf(best)) best = c;
      });
      if (best) S.lineup[p] = best.uid;
    });
  }

  /* ================= 版本 / 环境 ================= */
  function rollPatch() {
    var H = HEROES().slice();
    if (!H.length) { S.patch = {}; S.env = "运营"; return; }
    shuffle(H);
    var p = {};
    for (var i = 0; i < Math.min(6, H.length); i++) p[H[i].n] = 1;
    for (var j = 6; j < Math.min(9, H.length); j++) p[H[j].n] = -1;
    S.patch = p;
    S.env = pickOne(ENVS) || "运营";
  }
  function patchBrief() {
    var up = [], down = [];
    for (var k in S.patch) { if (S.patch[k] > 0) up.push(k); else down.push(k); }
    return { up: up, down: down, env: S.env, envWhy: envWhy(S.env) };
  }
  function envWhy(e) {
    return {
      "打团": "这版本就是五个人的团战，谁先开谁赢。",
      "前期滚雪球": "二十分钟前不打架，后面没你的份。",
      "单带": "边线一个人带穿，正面拖着不打就赢了。",
      "运营": "谁先动资源谁先输，都等着对面犯错。",
      "对线": "线上一换一，压三十刀等于赢一局。"
    }[e] || "";
  }

  /* ================= 教练 / 战术 / 转会 ================= */
  function rollCoachOffers() {
    var list = COACHDB().slice();
    var fit = { S: ["金", "金", "紫"], A: ["金", "紫", "紫"], B: ["紫", "紫", "蓝"], C: ["紫", "蓝", "蓝"] }[S.tier] || ["紫", "蓝", "蓝"];
    var out = [], used = {};
    each(fit, function (rar) {
      var pool = list.filter(function (c) { return c.rarity === rar && !used[c.id]; });
      if (!pool.length) pool = list.filter(function (c) { return !used[c.id]; });
      if (!pool.length) return;
      var c = pickOne(pool);
      used[c.id] = 1; out.push(c.id);
    });
    S.coachOffers = out;
  }
  function coachHireCost(id) {
    var c = coachById(id); if (!c) return 0;
    return ({ "金": 700, "紫": 400, "蓝": 160 })[c.rarity] || 200;
  }
  function coachBrief(c) {
    if (!c) return null;
    var e = c.eff || {}, rows = [];
    if (e.team) rows.push("全队团队 " + sp(e.team * 1.6));
    if (e.mental) rows.push("全队心态 " + sp(e.mental * 1.6));
    if (e.growth) rows.push("每年成长 " + sp(e.growth));
    return { id: c.id, name: c.name, style: c.style || "放养", rar: (RAR[c.rarity] || RAR["蓝"]).n, rc: (RAR[c.rarity] || RAR["蓝"]).c, desc: c.desc || "", eff: rows.join(" · ") };
  }
  function rollMarket() {
    var own = ownIds(), pool = [];
    var target = { S: ["金", "紫", "紫"], A: ["紫", "紫", "金"], B: ["紫", "蓝", "蓝"], C: ["蓝", "蓝", "紫"] }[S.tier] || ["蓝", "蓝", "蓝"];
    each(target, function (rar) {
      var cand = CARDDB().filter(function (c) { return c.rarity === rar && !own[c.id]; });
      if (!cand.length) cand = CARDDB().filter(function (c) { return !own[c.id]; });
      if (!cand.length) return;
      var c = pickOne(cand);
      own[c.id] = 1;
      pool.push(c.id);
    });
    S.market = pool;
    S.marketRound++;
  }
  function buyPrice(id) {
    var c = cardById(id); if (!c) return 0;
    var pre = ({ "金": 600, "紫": 320, "蓝": 120 })[c.rarity] || 100;
    return Math.round(salOf(c) * 1.1 + pre);
  }
  function sellPrice(c) { return Math.round(salOf(c) * 0.75); }
  function grantTactics(n) {
    var pool = TACDB().slice(), own = {};
    each(S.tactics, function (id) { own[id] = 1; });
    each(pool, function (t) { if (own[t.id]) return; });
    var got = 0;
    for (var i = 0; i < 40 && got < n; i++) {
      var cand = TACDB().filter(function (t) { return S.tactics.indexOf(t.id) < 0; });
      if (!cand.length) break;
      var t = pickOne(cand);
      S.tactics.push(t.id); got++;
    }
  }
  function tacBrief(id) {
    var t = tacById(id); if (!t) return null;
    return { id: id, name: t.name, desc: t.desc || "", dim: t.dim || "运营", eff: tacEffCN(t), rar: (RAR[t.rarity] || RAR["蓝"]).n, rc: (RAR[t.rarity] || RAR["蓝"]).c };
  }
  function tacEffCN(t) {
    var e = t.eff || {}, out = [];
    if (e.lanes) out.push("对线 " + sp(e.lanes));
    if (e.team) out.push("团队 " + sp(e.team));
    if (e.mental) out.push("心态 " + sp(e.mental));
    if (e.growth) out.push("成长 " + sp(e.growth));
    return out.join(" · ") || "没写，自己悟";
  }

  /* ================= 收入 / 结算 ================= */
  function incomeFor(kind, win) {
    if (kind === "regular") return win ? 70 : 22;
    if (kind === "playoff") return win ? 200 : 60;
    if (kind === "worlds") return win ? 260 : 80;
    return 0;
  }
  function ticketFor(kind, win) {
    if (!win) return 0;
    if (kind === "regular") return 1;
    if (kind === "playoff") return 2;
    if (kind === "worlds") return 3;
    return 0;
  }

  /* ================= 场景公共头 ================= */
  function head() {
    if (!S || !S.teamId) return null;
    return {
      season: S.season,
      maxSeason: S.maxSeason,
      team: S.teamName,
      tier: S.tier,
      custom: S.custom,
      budget: S.budget,
      cap: S.cap,
      salary: totalSalary(),
      ovr: teamOvr(),
      tickets: S.tickets,
      reg: S.regW + " 胜 " + S.regL + " 负",
      stage: stageCN(),
      coach: S.coach ? S.coach.name : "",
      hcap: S.cap
    };
  }
  function stageCN() {
    if (S.wd && !S.wd.done) return "世界赛 · " + wdStageCN();
    if (S.po && !S.po.done) return "季后赛 · " + (RDNAME[Number(S.po.round) || 0] || "");
    if (S.po && S.po.done) return "赛季收尾";
    if (S.lgDone) return "常规赛结束";
    if (S.regPlayed > 0) return "常规赛 第 " + (S.regPlayed + 1) + " 场";
    return "新赛季备战";
  }
  function wdStageCN() {
    var w = S.wd;
    if (!w) return "世界赛";
    if (w.champion) return "冠军 " + idName(w.champion);
    if (w.done) return "已结束";
    if (w.bracket) return "淘汰赛 · " + (Number(w.bRound) === 0 ? "半决赛" : "决赛");
    var r = Number(w.r);
    if (!isFinite(r)) r = 0;
    return "小组赛 第 " + (r + 1) + " 轮";
  }
  function scene(type, o) {
    var s = { type: "mgr_" + type };
    if (o) for (var k in o) if (o.hasOwnProperty(k)) s[k] = o[k];
    s.acts = s.acts || [];
    s.head = head();
    s.msgs = (S && S.msg) ? S.msg.slice() : [];
    return s;
  }

  /* ================= 场景：开场 ================= */
  function scMenu() {
    return scene("menu", {
      kicker: "电竞经理 · 赛季模式",
      title: "登神 · 经理模式",
      lines: [
        "你不再打游戏了。你坐在训练室最后一排，面前是一张预算表、五份合同、和一个永远嫌你花钱的老板。",
        "选队、抽人、排阵、备赛、BP、打完写复盘。三年时间，把这堆人送到世界赛，或者送到解散公告里。",
        "规则很干脆：预算有限，工资帽有限，选手的耐心最有限。超帽就交税，超不动就卖人。"
      ],
      acts: [act("go", "接手一支队"), act("custom", "自建战队 · 3000 万预算", "从零开始，从零挨打")]
    });
  }

  /* ================= 场景：选队 ================= */
  function scTeam() {
    var L = TEAMS().filter(function (t) { return t.region === "LPL"; });
    var acts = [], rows = [];
    each(L, function (t) {
      var mny = moneyOfTeam(t);
      rows.push({
        id: t.id, name: t.name || t.id, full: t.full || "", city: t.city || "",
        tier: t.tier || "B", color: t.color || "#9aa7b4",
        budget: mny.budget, cap: mny.cap,
        boss: t.boss || "", coach: t.coach || "", blurb: t.blurb || "",
        power: TIERPOWER[t.tier] || 70
      });
      acts.push(act("team:" + t.id, (t.name || t.id) + " · " + (t.tier || "B") + " 级", t.blurb || ""));
    });
    acts.push(act("team:custom", "自建战队 · 3000 万预算", "没有历史，也没有包袱"));
    return scene("team", {
      kicker: "第一步 · 选队",
      title: "十七支队，挑一个跳进去",
      lines: ["强队有钱有帽，但球迷要冠军；烂队没人看，可你有时间。都不好当。"],
      teams: rows,
      acts: acts
    });
  }

  /* ================= 场景：抽卡组队 ================= */
  function scDraft() {
    var acts = [act("keep", "收下这八张", "五个位置先凑齐了")]
      ;
    if (S.redraft > 0) acts.push(act("redraft", "重抽一次", "只有一次，抽完就得认"));
    return scene("draft", {
      kicker: "第二步 · 抽卡组队",
      title: "八张卡，五个位置，剩下的卖钱",
      lines: ["卡是选手的某一年。同一个人不同年份是不同卡，别问，问就是玄学。"],
      cards: briefs(S.cards),
      redraftLeft: S.redraft,
      acts: acts
    });
  }

  /* ================= 场景：首发 ================= */
  function scLineup(trainMode) {
    var acts = [], slots = [];
    each(POS, function (p) {
      var c = cardAt(p);
      slots.push({ pos: p, poscn: POSCN[p], card: c ? cardBrief(c) : null });
    });
    each(POS, function (p) {
      each(S.cards, function (c) {
        if (c.pos !== p) return;
        var fits = S.lineup[p] === c.uid;
        acts.push(act("set:" + p + ":" + c.uid,
          POSCN[p] + " 换 " + (c.name || "无名") + (fits ? "（已在场）" : ""),
          "评分 " + ovrOf(c) + " · 工资 " + wan(salOf(c)), fits ? "gold" : ""));
      });
    });
    acts.push(act("auto", "自动排最强", "按评分从高到低排"));
    acts.push(act("clear", "全部卸下"));
    acts.push(act("ready", "就这套，开赛", "总工资 " + wan(totalSalary()) + " / 帽 " + wan(S.cap), "gold", !lineupReady()));
    return scene("lineup", {
      kicker: "第三步 · 首发五人",
      title: "五个位置，一个人都不能少",
      lines: ["位置不对的卡上不了场。工资超帽可以硬上，但赛季开始要交奢侈税。"],
      slots: slots,
      cards: briefs(S.cards),
      salary: totalSalary(),
      cap: S.cap,
      ready: lineupReady(),
      acts: acts
    });
  }

  function stageSub() {
    if (S.wd && !S.wd.done) return "worlds";
    if (S.po && !S.po.done) return "playoff";
    if (S.lg && !S.lgDone) return "league";
    if (S.po || S.wd) return "playoff";
    if (S.lgDone) return "league";
    return "manage";
  }
  /* 赛季是否还在进行：显式标记，避免"上一年的常规赛对象还挂在那"导致下一年直接跳季后赛 */
  function seasonStarted() {
    return S.seasonActive === true;
  }

  /* ================= 场景：经营总览 ================= */
  function scManage() {
    var sal = totalSalary(), over = sal > S.cap;
    var acts;
    if (seasonStarted()) {
      acts = [
        act("go:league", "回赛场", stageCN()),
        act("go:gacha", "抽卡", "券 " + S.tickets + " 张 · 重复卡自动折券"),
        act("go:train", "训练", "花预算，一个人一个维度 +2"),
        act("go:market", "转会市场", S.market.length ? "挂牌 " + S.market.length + " 人" : "本轮没挂牌"),
        act("go:coach", "教练席", S.coach ? "现任 " + S.coach.name : "还没人坐")
      ];
    } else {
      acts = [
        act("go:gacha", "抽卡", "券 " + S.tickets + " 张 · 重复卡自动折券"),
        act("go:train", "训练", "花预算，一个人一个维度 +2"),
        act("go:market", "转会市场", S.market.length ? "挂牌 " + S.market.length + " 人" : "本轮没挂牌"),
        act("go:coach", "教练席", S.coach ? "现任 " + S.coach.name : "还没人坐"),
        act("go:cap", "工资帽", over ? "超帽 " + wan(sal - S.cap) : "在帽内"),
        act("go:start", "开赛", "常规赛 16 场，打完进季后赛", "gold")
      ];
    }
    return scene("manage", {
      kicker: "第 " + S.season + " 赛季 · 备战",
      title: "你现在有 " + wan(S.budget),
      lines: [
        over ? ("工资 " + wan(sal) + "，帽 " + wan(S.cap) + "，超了 " + wan(sal - S.cap) + "。老板脸色不好看。")
          : ("工资 " + wan(sal) + "，帽 " + wan(S.cap) + "，还剩 " + wan(S.cap - sal) + " 的空间。")
      ],
      lineup: briefs(starters()),
      cards: briefs(S.cards),
      coach: coachBrief(S.coach),
      tactics: S.tactics.map(tacBrief).filter(Boolean),
      patch: patchBrief(),
      salary: sal, over: over,
      acts: acts
    });
  }

  /* ================= 场景：抽卡页 ================= */
  function scGacha() {
    var acts = [
      act("g1", "单抽 · 1 券", "保底计数 " + S.pity + "/10", "", S.tickets < 1),
      act("g10", "十连 · 9 券", "十连必出紫", "", S.tickets < 9),
      act("back", "回办公室")
    ];
    return scene("gacha", {
      kicker: "抽卡 · 选手卡池",
      title: "券 " + S.tickets + " 张",
      lines: ["抽到重复的卡自动分解成券：蓝退 1 张，紫退 2 张，金退 3 张。别嫌亏，重复的卡本来就上不了场。"],
      pity: S.pity, goldPity: S.goldPity,
      pulled: (S.pull || []).slice(),
      cards: briefs(S.cards),
      roster: S.cards.length + "/" + MAX_CARDS,
      acts: acts
    });
  }

  /* ================= 场景：训练 ================= */
  function scTrain() {
    var focus = S.trainFocus ? findCard(S.trainFocus) : null;
    var acts = [];
    if (!focus) {
      each(S.cards, function (c) {
        acts.push(act("focus:" + c.uid, (c.name || "无名") + " · " + POSCN[c.pos], "评分 " + ovrOf(c) + " · 工资 " + wan(salOf(c))));
      });
      acts.push(act("back", "回办公室"));
    } else {
      var st = effSt(focus);
      each(STAT, function (k) {
        var cost = trainCost(focus, k);
        acts.push(act("up:" + k, STCN[k] + " " + Math.round(st[k]) + " → " + Math.round(clamp(st[k] + 2, 1, 99)),
          "花费 " + wan(cost), "", S.budget < cost || st[k] >= 99));
      });
      acts.push(act("focus_back", "换个人"));
      acts.push(act("back", "回办公室"));
    }
    return scene("train", {
      kicker: "训练室",
      title: focus ? ("练 " + (focus.name || "无名") + " 的那点东西") : "练谁？",
      lines: ["一次 +2，封顶 99。钱花在谁身上，谁就是你的亲儿子。"],
      focus: focus ? cardBrief(focus) : null,
      cards: briefs(S.cards),
      acts: acts
    });
  }
  function trainCost(card, dim) {
    var v = effSt(card)[dim] || 60;
    return Math.round(60 + v * 2.2 + (card.train && card.train[dim] ? 40 : 0));
  }

  /* ================= 场景：转会 ================= */
  function scMarket() {
    var acts = [], list = [];
    each(S.market, function (id) {
      var raw = cardById(id);
      if (!raw) return;
      var p = buyPrice(id);
      list.push({ card: cardBrief(mkProbe(raw)), price: p, can: S.budget >= p && S.cards.length < MAX_CARDS });
      acts.push(act("buy:" + id, "买 " + (raw.name || "无名") + " · " + POSCN[raw.pos], wan(p), "", S.budget < p || S.cards.length >= MAX_CARDS));
    });
    acts.push(act("sellmode", "挂牌卖人", "队里 " + S.cards.length + "/" + MAX_CARDS + " 人"));
    acts.push(act("back", "回办公室"));
    return scene("market", {
      kicker: "转会市场",
      title: "三条鱼，看你要不要",
      lines: ["买人花预算，卖人回血。工资帽只看首发五个人，替补的工资你照付，这行就这样。"],
      offers: list,
      acts: acts
    });
  }
  function mkProbe(raw) {
    var c = shallow(raw);
    c.uid = raw.id;
    c.pool = genPool(raw);
    c.train = {};
    c.probe = true;
    return c;
  }
  function scSell() {
    var acts = [];
    each(S.cards, function (c) {
      acts.push(act("sell:" + c.uid, "卖 " + (c.name || "无名") + " · " + POSCN[c.pos], "回 " + wan(sellPrice(c)), "", S.cards.length <= 5));
    });
    acts.push(act("back", "不卖了"));
    return scene("sell", {
      kicker: "转会市场 · 出人",
      title: "谁走？",
      lines: ["卖人就是承认自己看走眼。这行每天都在承认。"],
      cards: briefs(S.cards),
      acts: acts
    });
  }

  /* ================= 场景：教练 ================= */
  function scCoach() {
    var acts = [], offers = [];
    each(S.coachOffers, function (id) {
      var c = coachById(id);
      if (!c) return;
      var cost = coachHireCost(id);
      offers.push({ coach: coachBrief(c), cost: cost, can: S.budget >= cost && (!S.coach || S.coach.id !== id) });
      acts.push(act("hire:" + id, "签 " + c.name + " · " + (c.style || "放养"), wan(cost), "", S.budget < cost || (S.coach && S.coach.id === id)));
    });
    acts.push(act("back", "回办公室"));
    return scene("coach", {
      kicker: "教练席",
      title: S.coach ? ("现任 " + S.coach.name + " · " + (S.coach.style || "")) : "教练席空着",
      lines: ["教练不背锅，教练只加分。全队团队、心态，还有每年那点成长，都算他的。"],
      now: coachBrief(S.coach),
      offers: offers,
      acts: acts
    });
  }

  /* ================= 场景：工资帽结算 ================= */
  function capInfo() {
    var sal = totalSalary(), over = Math.max(0, sal - S.cap);
    var tax = Math.round(over * 1.0);
    var pay = sal + tax;
    return { sal: sal, cap: S.cap, over: over, tax: tax, pay: pay, budget: S.budget, can: true, short: S.budget < pay };
  }
  function scCap() {
    var c = capInfo();
    var acts = [];
    if (c.over > 0) acts.push(act("tax", "认税开赛", "税 " + wan(c.tax)));
    acts.push(act("autosell", "卖掉贵的换钱", "优先卖替补", "", S.cards.length <= 5));
    acts.push(act("go:market", "自己开转会"));
    acts.push(act("ok", c.over > 0 ? ("发工资 + 交税，" + wan(c.pay)) : ("发工资 " + wan(c.pay) + "，开赛"), c.short ? "账上不够，先欠着，老板记账" : "", "gold"));
    return scene("cap", {
      kicker: "财务 · 赛季结算",
      title: c.short ? "钱不够，先欠着" : "账面清楚",
      lines: [
        "发工资是本分，交奢侈税是天赋。帽内省下来的钱，是你夏天买人的底气。",
        c.over > 0 ? ("首发工资 " + wan(c.sal) + "，超帽 " + wan(c.over) + "，税 " + wan(c.tax) + "，一共要出 " + wan(c.pay) + "。") : "首发工资在帽内，不用交税。",
        c.short ? ("账上只有 " + wan(c.budget) + "，差 " + wan(c.pay - c.budget) + "。硬发就是欠薪，全队心态要掉。") : ""
      ].filter(function (x) { return !!x; }),
      info: c,
      acts: acts
    });
  }

  /* ================= 赛季构造 ================= */
  var TACSTAT = { "单带": "LANE", "前期": "GAME", "团战": "TEAM", "运营": "GAME", "野核": "MECH", "爆发": "MECH", "稳定": "GAME" };

  function buildPowers() {
    S.power = {};
    each(TEAMS(), function (t) { if (t.id) S.power[t.id] = tierPower(t.tier); });
    S.power[S.teamId] = teamOvr();
  }
  function lplIds() {
    var L = TEAMS().filter(function (t) { return t.region === "LPL"; });
    var arr = [];
    each(L, function (t) { arr.push(t.id); });
    if (S.custom) {
      var w = weakestLpl(L);
      var i = w ? arr.indexOf(w.id) : -1;
      if (i >= 0) arr.splice(i, 1);
      arr.push("t_me");
    }
    return arr;
  }
  function circle(ids) {
    var arr = ids.slice();
    if (arr.length % 2) arr.push("BYE");
    var n = arr.length, rounds = [], r, i;
    for (r = 0; r < n - 1; r++) {
      var pairs = [];
      for (i = 0; i < n / 2; i++) pairs.push({ a: arr[i], b: arr[n - 1 - i], win: null });
      rounds.push(pairs);
      var fixed = arr[0], rest = arr.slice(1);
      rest.unshift(rest.pop());
      arr = [fixed].concat(rest);
    }
    return rounds;
  }
  function idName(id) {
    if (!S) return id;
    if (id === S.teamId) return S.teamName;
    if (id === "BYE") return "轮空";
    var t = teamById(id);
    return t ? (t.name || id) : "神秘队";
  }
  function myOppIn(r) {
    var pairs = S.lg.sched[r] || [];
    for (var i = 0; i < pairs.length; i++) {
      if (pairs[i].a === S.teamId) return pairs[i].b;
      if (pairs[i].b === S.teamId) return pairs[i].a;
    }
    return null;
  }
  function addRec(wid, lid) {
    if (!S.lg.rec[wid]) S.lg.rec[wid] = { w: 0, l: 0 };
    if (!S.lg.rec[lid]) S.lg.rec[lid] = { w: 0, l: 0 };
    S.lg.rec[wid].w++; S.lg.rec[lid].l++;
  }
  function simPair(a, b) {
    var pa = (S.power[a] || 70), pb = (S.power[b] || 70);
    var p = window.MATCH.sig(pa - pb, 9);
    return rnd() < p ? a : b;
  }
  function simRoundRest(r) {
    var pairs = S.lg.sched[r] || [];
    each(pairs, function (pr) {
      if (pr.a === S.teamId || pr.b === S.teamId) return;
      if (pr.a === "BYE" || pr.b === "BYE") return;
      var w = simPair(pr.a, pr.b);
      addRec(w, w === pr.a ? pr.b : pr.a);
    });
  }
  function standings() {
    var arr = [];
    each(S.lg.ids, function (id) {
      var r = S.lg.rec[id] || { w: 0, l: 0 };
      arr.push({ id: id, w: r.w, l: r.l, p: S.power[id] || 70 });
    });
    arr.sort(function (x, y) { return (y.w - x.w) || (x.l - y.l) || (y.p - x.p); });
    return arr;
  }
  function mySeed() {
    var st = standings();
    for (var i = 0; i < st.length; i++) if (st[i].id === S.teamId) return i + 1;
    return st.length;
  }

  /* ================= 常规赛推进 ================= */
  function prepLeague() {
    for (var guard = 0; guard < 40; guard++) {
      if (S.lg.rnd >= S.lg.sched.length) { S.lgDone = true; return; }
      var r = S.lg.rnd, opp = myOppIn(r);
      if (opp) { S.pend = { kind: "lg", oppId: opp, rnd: r, bestOf: 3, label: "常规赛 第 " + (S.regPlayed + 1) + " 场" }; return; }
      simRoundRest(r); S.lg.rnd++;
    }
  }
  function startLeague() {
    buildPowers();
    S.lg = { ids: lplIds(), sched: null, rnd: 0, rec: {} };
    /* 17 队要 18 个坑，多出来的「轮空」直接删掉整对：轮空那一轮助教自动带完，玩家只打 16 场 */
    S.lg.sched = circle(S.lg.ids).map(function (pairs) {
      return pairs.filter(function (pr) { return pr.a !== "BYE" && pr.b !== "BYE"; });
    });
    S.lgDone = false; S.regW = 0; S.regL = 0; S.regPlayed = 0;
    S.seasonActive = true;
    S.po = null; S.wd = null; S.pend = null;
    if (!S.form) S.form = { energy: 74, morale: 64, spirit: 62 };
    S.sub = "league";
    prepLeague();
  }

  /* ================= 季后赛 ================= */
  function seedPairs(seeds) {
    var q = seeds.slice(0, 8);
    return [{ a: q[0], b: q[7] }, { a: q[3], b: q[4] }, { a: q[1], b: q[6] }, { a: q[2], b: q[5] }];
  }
  function myPair(pairs) {
    for (var i = 0; i < pairs.length; i++) {
      if (pairs[i].a === S.teamId || pairs[i].b === S.teamId) return pairs[i];
    }
    return null;
  }
  function startPlayoff() {
    var st = standings().map(function (x) { return x.id; });
    S.po = { seeds: st.slice(0, 8), round: 0, pairs: null, prev: null, top4: null, champion: null, done: false, meOut: false, log: [] };
    S.pend = null;
    S.sub = "playoff";
    var q = S.po.seeds.indexOf(S.teamId) >= 0;
    note(q ? ("常规赛第 " + mySeed() + " 名进季后赛。") : "常规赛没进前八，季后赛没你的份。");
    prepPlayoff();
  }
  function prepPlayoff() {
    for (var guard = 0; guard < 24; guard++) {
      var po = S.po;
      if (po.round > 2) { po.done = true; return; }
      if (!po.pairs) {
        if (po.round === 0) {
          po.pairs = seedPairs(po.seeds);
        } else if (po.round === 1) {
          po.pairs = [
            { a: po.prev[0], b: po.prev[1], win: null },
            { a: po.prev[2], b: po.prev[3], win: null }
          ];
          po.top4 = [po.pairs[0].a, po.pairs[0].b, po.pairs[1].a, po.pairs[1].b];
          if (po.top4.indexOf(S.teamId) >= 0) po.reachedSemi = true;
        } else {
          po.pairs = [{ a: po.prev[0], b: po.prev[1], win: null }];
          if (po.pairs[0].a === S.teamId || po.pairs[0].b === S.teamId) po.reachedFinal = true;
        }
      }
      var mp = myPair(po.pairs);
      if (mp && !mp.win) {
        var idx = po.pairs.indexOf(mp);
        S.pend = { kind: "po", oppId: mp.a === S.teamId ? mp.b : mp.a, poRound: po.round, pi: idx, bestOf: 5, label: "季后赛 · " + RDNAME[po.round] };
        return;
      }
      each(po.pairs, function (pr) { if (!pr.win) pr.win = simPair(pr.a, pr.b); });
      po.prev = po.pairs.map(function (pr) { return pr.win; });
      if (po.round === 2) po.champion = po.prev[0];
      po.pairs = null; po.round++;
    }
  }

  /* ================= 世界赛 ================= */
  function fieldWorlds() {
    var quals = (S.po && S.po.top4) ? S.po.top4.slice() : [];
    var foreign = TEAMS().filter(function (t) { return t.region !== "LPL"; });
    foreign.sort(function (a, b) { return (S.power[b.id] || 0) - (S.power[a.id] || 0); });
    var out = [];
    each(quals, function (id) { out.push(id); });
    for (var i = 0; i < foreign.length && out.length < 8; i++) {
      if (out.indexOf(foreign[i].id) < 0) out.push(foreign[i].id);
    }
    return out;
  }
  function startWorlds() {
    var f = fieldWorlds();
    var ranked = f.slice().sort(function (x, y) { return (S.power[y] || 0) - (S.power[x] || 0); });
    while (ranked.length < 8) ranked.push("BYE");
    var gA = [ranked[0], ranked[3], ranked[4], ranked[7]];
    var gB = [ranked[1], ranked[2], ranked[5], ranked[6]];
    var w = {
      groups: [gA, gB], sched: [circle(gA), circle(gB)],
      r: 0, grec: {}, bracket: null, pairs: null, bRound: 0,
      champion: null, done: false, meIn: gA.indexOf(S.teamId) >= 0 || gB.indexOf(S.teamId) >= 0, field: f
    };
    each(f, function (id) { w.grec[id] = { w: 0, l: 0 }; });
    S.wd = w;
    S.pend = null;
    S.sub = "worlds";
    note(w.meIn ? "进世界赛了。八支队，两个小组，前二出线。" : "世界赛没你。");
    prepWorlds();
  }
  function myGroup() {
    var w = S.wd;
    if (!w) return -1;
    if (w.groups[0].indexOf(S.teamId) >= 0) return 0;
    if (w.groups[1].indexOf(S.teamId) >= 0) return 1;
    return -1;
  }
  function setGroupWin(pr) {
    if (!pr.win) return;
    var g = S.wd.grec;
    if (!g[pr.win]) g[pr.win] = { w: 0, l: 0 };
    var lo = pr.win === pr.a ? pr.b : pr.a;
    if (!g[lo]) g[lo] = { w: 0, l: 0 };
    g[pr.win].w++; g[lo].l++;
    pr.scored = true;
  }
  function resolveGroupRound(r, skip) {
    var w = S.wd;
    for (var gi = 0; gi < 2; gi++) {
      var pairs = w.sched[gi][r] || [];
      for (var i = 0; i < pairs.length; i++) {
        var pr = pairs[i];
        if (skip && pr === skip) continue;
        if (!pr.win) { pr.win = simPair(pr.a, pr.b); }
        if (!pr.scored) setGroupWin(pr);
      }
    }
  }
  function groupRank(gi) {
    var w = S.wd, arr = [];
    each(w.groups[gi], function (id) {
      var g = w.grec[id] || { w: 0, l: 0 };
      arr.push({ id: id, w: g.w, l: g.l, p: S.power[id] || 70 });
    });
    arr.sort(function (x, y) { return (y.w - x.w) || (x.l - y.l) || (y.p - x.p); });
    return arr;
  }
  function buildWorldsBracket() {
    var A = groupRank(0), B = groupRank(1);
    var w = S.wd;
    w.qualA = [A[0] ? A[0].id : null, A[1] ? A[1].id : null];
    w.qualB = [B[0] ? B[0].id : null, B[1] ? B[1].id : null];
    var pairs = [
      { a: w.qualA[0], b: w.qualB[1], win: null },
      { a: w.qualB[0], b: w.qualA[1], win: null }
    ];
    var ok = true;
    each(pairs, function (pr) { if (!pr.a || !pr.b) ok = false; });
    return ok ? pairs : null;
  }
  function prepWorlds() {
    var w = S.wd;
    if (!w) return;
    for (var guard = 0; guard < 40; guard++) {
      if (w.done) return;
      if (!w.bracket) {
        if (w.r >= 3) {
          var br = buildWorldsBracket();
          if (!br) { w.done = true; return; }
          w.bracket = br; w.pairs = br; w.bRound = 0;
          continue;
        }
        var gi = myGroup();
        var mine = null;
        if (gi >= 0) {
          var pairs = w.sched[gi][w.r] || [];
          for (var i = 0; i < pairs.length; i++) if (pairs[i].a === S.teamId || pairs[i].b === S.teamId) mine = pairs[i];
        }
        resolveGroupRound(w.r, mine);
        if (mine && !mine.win) {
          S.pend = { kind: "wdg", oppId: mine.a === S.teamId ? mine.b : mine.a, gr: gi, ri: w.r, bestOf: 1, label: "世界赛 · 小组赛 第 " + (w.r + 1) + " 轮" };
          return;
        }
        w.r++;
        continue;
      }
      if (w.bRound > 1) { w.done = true; return; }
      var mp = myPair(w.pairs);
      if (mp && !mp.win) {
        S.pend = { kind: "wdb", oppId: mp.a === S.teamId ? mp.b : mp.a, pi: w.pairs.indexOf(mp), bestOf: 5, label: "世界赛 · " + (w.bRound === 0 ? "半决赛" : "决赛") };
        return;
      }
      each(w.pairs, function (pr) { if (!pr.win) pr.win = simPair(pr.a, pr.b); });
      if (w.bRound === 1) { w.champion = w.pairs[0].win; w.done = true; return; }
      w.pairs = [{ a: w.pairs[0].win, b: w.pairs[1].win, win: null }];
      w.bRound = 1;
      if (w.pairs[0].a === S.teamId || w.pairs[0].b === S.teamId) w.reachedFinal = true;
    }
  }

  /* ================= 侧构建 ================= */
  function aiTendency(id) {
    var r = seeded(String(id) + "|t|" + S.season);
    return ENEMY_TEND[Math.floor(r() * ENEMY_TEND.length)];
  }
  function aiTacticOf(id) {
    var t = aiTendency(id);
    return TEND_TAC[t] || "ope";
  }
  function aiPicksFor(oppId) {
    var M = window.MATCH, out = {}, used = [];
    each(POS, function (pos) {
      var h = M.aiPick(pos, rnd, S.patch, used);
      if (h) { out[pos] = h; used.push(h); }
    });
    return out;
  }
  function aiSide(oppId, aiPicks) {
    var M = window.MATCH;
    var p = clamp(S.power[oppId] || 70, 40, 95);
    var st = {}, i;
    for (i = 0; i < STAT.length; i++) st[STAT[i]] = clamp(p + (rnd() - .5) * 6, 35, 96);
    var players = [];
    each(POS, function (pos) { players.push({ pos: pos, st: st }); });
    var sigHero = aiPicks ? (aiPicks.MID || aiPicks.BOT || "") : "";
    var prof = clamp(p + ((S.patch[sigHero] || 0) * 6), 40, 97);
    var s = M.makeSide({
      players: players, hero: sigHero, heroProf: prof, mainHero: prof >= 90,
      tactic: aiTacticOf(oppId), env: S.env,
      energy: clamp(76 + (rnd() - .5) * 10, 45, 96),
      morale: clamp(60 + (rnd() - .5) * 12, 35, 92),
      spirit: clamp(58 + (rnd() - .5) * 12, 30, 90),
      burst: rnd() < .12 ? 60 + rnd() * 25 : 0,
      voice: clamp(p * .55, 20, 80),
      coachTrust: 50 + (rnd() - .5) * 20
    });
    s.tendency = aiTendency(oppId);
    return s;
  }
  function applyTac(side, tacId) {
    var t = tacById(tacId);
    if (!t) return { name: "", rows: [], used: false };
    var e = t.eff || {}, rows = [];
    side.tactic = DIMTAC[t.dim] || "ope";
    if (e.lanes) { side.dims.LANE = clamp(side.dims.LANE + e.lanes * .26, 1, 99); rows.push("对线 " + sp(e.lanes)); }
    if (e.team) { side.dims.TEAM = clamp(side.dims.TEAM + e.team * .26, 1, 99); rows.push("团队 " + sp(e.team)); }
    if (e.mental) { side.morale = clamp(side.morale + e.mental * .8, 0, 100); rows.push("心态 " + sp(e.mental)); }
    if (e.growth) rows.push("成长 " + sp(e.growth));
    return { name: t.name, rows: rows, used: true, dim: TACSTAT[t.dim] || "GAME" };
  }
  function buildMySide(bp, theirs, aiPicks) {
    var M = window.MATCH, players = [], profs = {}, heroes = {};
    each(POS, function (pos) {
      var c = cardAt(pos);
      if (!c) return;
      players.push({ pos: pos, st: effSt(c) });
      var h = (bp.picks || {})[pos];
      if (h) { heroes[pos] = h; profs[pos] = (c.pool && c.pool[h]) || 50; }
    });
    var sigPos = "MID", bestProf = -1;
    each(POS, function (pos) {
      if (profs[pos] !== undefined && profs[pos] > bestProf) { bestProf = profs[pos]; sigPos = pos; }
    });
    var sigHero = heroes[sigPos] || "";
    var cev = coachEffNow();
    var side = M.makeSide({
      players: players, hero: sigHero, heroProf: bestProf < 0 ? 55 : bestProf,
      mainHero: bestProf >= 90,
      tactic: "ope", env: S.env,
      energy: S.form ? S.form.energy : 70,
      morale: S.form ? S.form.morale : 60,
      spirit: S.form ? S.form.spirit : 60,
      burst: 0, voice: clamp(50 + (cev.team || 0), 0, 90),
      coachTrust: S.coach ? 60 : 42
    });
    side.tendency = "运营";
    side.heroes = heroes;
    /* 其余四条线的英雄克制，折成对线维度的小加成（避免与代表英雄重复计算） */
    if (aiPicks) {
      var acc = 0, cnt = 0;
      each(POS, function (pos) {
        if (pos === sigPos || !heroes[pos] || !aiPicks[pos]) return;
        var ctr = M.ctrOf(heroes[pos], aiPicks[pos]);
        acc += ctr.d; cnt++;
      });
      if (cnt) side.dims.LANE = clamp(side.dims.LANE + (acc / cnt) * .06, 1, 99);
    }
    /* 战术卡 */
    var tacInfo = bp.tac ? applyTac(side, bp.tac) : { name: "", rows: [], used: false, dim: "GAME" };
    side.tacInfo = tacInfo;
    return side;
  }

  /* ================= BP ================= */
  function banCandidates() {
    var H = HEROES().slice(), out = [];
    each(H, function (h) {
      var b = (S.patch[h.n] || 0);
      out.push({ n: h.n, en: h.en || "", poscn: (h.pos || []).map(function (p) { return POSCN[p] || p; }).join("/"), score: b * 3 + (3 - (h.diff || 2)) });
    });
    out.sort(function (x, y) { return y.score - x.score; });
    return out.slice(0, 12);
  }
  function startBP(pend) {
    var M = window.MATCH;
    S.bp = {
      step: "ban", myBans: [], aiBans: [], picks: {}, aiPicks: {}, tac: null,
      oppId: pend.oppId, bestOf: pend.bestOf || 3, label: pend.label || "",
      cand: banCandidates(), pickPos: 0, aiPicksBuilt: false
    };
    /* AI 先 ban 你熟练度最高的三个 */
    var pool = {};
    each(POS, function (pos) {
      var c = cardAt(pos);
      if (!c || !c.pool) return;
      for (var k in c.pool) pool[k] = Math.max(pool[k] || 0, c.pool[k]);
    });
    for (var i = 0; i < 3; i++) {
      var b = M.aiBan(pool, rnd, S.bp.aiBans);
      if (b) { S.bp.aiBans.push(b); delete pool[b]; }
    }
    S.bp.aiPicks = aiPicksFor(pend.oppId);
    S.sub = "bp";
  }
  function bpAvailable(pos) {
    var c = cardAt(pos), ban = S.bp.myBans.concat(S.bp.aiBans), used = [];
    for (var p in S.bp.picks) used.push(S.bp.picks[p]);
    var list = window.MATCH.heroesFor(pos, c ? c.pool : {}, S.patch, 6);
    return list.filter(function (h) {
      return ban.indexOf(h.n) < 0 && used.indexOf(h.n) < 0 && !(S.bp.aiPicks[pos] === h.n);
    });
  }
  function finishBP() {
    var pend = S.pend || { oppId: S.bp.oppId, bestOf: S.bp.bestOf, label: S.bp.label };
    var bp = S.bp;
    var theirs = aiSide(pend.oppId, bp.aiPicks);
    var mine = buildMySide(bp, theirs, bp.aiPicks);
    var M = window.MATCH;
    var dim = (mine.tacInfo && mine.tacInfo.dim) || "GAME";
    var res = M.simBo(mine, theirs, { bestOf: pend.bestOf || 3, dim: dim, patchBuffs: S.patch });
    if (!S.form) S.form = { energy: 70, morale: 60, spirit: 60 };
    S.form.energy = clamp(res.energyLeft + 8, 0, 100);
    S.form.morale = clamp(res.moraleLeft + 4, 0, 100);
    S.form.spirit = clamp(S.form.spirit + (res.win ? 3 : -2), 0, 100);
    var detail = [];
    var keys = ["LANE", "MECH", "GAME", "POOL", "TEAM"];
    each(keys, function (k) {
      detail.push({ k: k, cn: STCN[k], me: Math.round(mine.dims[k] || 0), foe: Math.round(theirs.dims[k] || 0) });
    });
    var ctr = M.ctrOf(mine.hero, theirs.hero);
    S.lastMatch = {
      win: res.win, w: res.w, l: res.l, games: res.games.map(function (g) { return { win: g.win, p: Math.round(g.p * 100) }; }),
      upset: res.upset, gap: Math.round(res.gap * 10) / 10,
      keyVars: (res.keyVars || []).map(function (t) { return { k: t.k, v: Math.round(t.v * 100), tone: t.tone === "good" ? "good" : "bad" }; }),
      oppId: pend.oppId, oppName: idName(pend.oppId), label: pend.label || "",
      bestOf: pend.bestOf || 3,
      myHeroes: bp.picks, aiHeroes: bp.aiPicks, myBans: bp.myBans, aiBans: bp.aiBans,
      tac: mine.tacInfo, ctr: { d: ctr.d, why: ctr.why },
      detail: detail, dimcn: STCN[dim] || "意识",
      formLeft: Math.round(S.form.energy), moraleLeft: Math.round(S.form.morale)
    };
    /* 消耗战术卡 */
    if (bp.tac) {
      var idx = S.tactics.indexOf(bp.tac);
      if (idx >= 0) S.tactics.splice(idx, 1);
    }
    S.bp = null;
    S.sub = "match";
    S.pendingWin = res.win;
  }
  function scBP() {
    var bp = S.bp;
    var acting = bp.step === "ban" ? "ban" : "pick";
    var acts = [];
    var pctr = null;
    if (bp.step === "ban") {
      each(bp.cand, function (h) {
        var dead = bp.myBans.indexOf(h.n) >= 0;
        acts.push(act("ban:" + h.n, (dead ? "已禁 " : "禁 ") + h.n, h.poscn + " · 版本强度 " + (h.score > 0 ? "高" : "一般"), dead ? "gold" : "", dead || bp.myBans.length >= 3));
      });
      each(S.tactics, function (id) {
        var t = tacById(id); if (!t) return;
        var on = bp.tac === id;
        acts.push(act("tac:" + id, "战术 · " + t.name, tacEffCN(t), on ? "gold" : ""));
      });
      acts.push(act("bpstep", "禁完了，开始选人", "已禁 " + bp.myBans.length + "/3", "gold", bp.myBans.length < 3));
    } else {
      var pos = POS[bp.pickPos] || "MID";
      var pool = bpAvailable(pos);
      each(pool, function (h) {
        var ctr = bp.aiPicks[pos] ? window.MATCH.ctrOf(h.n, bp.aiPicks[pos]) : { d: 0, why: "" };
        acts.push(act("pick:" + h.n,
          h.n + (ctr.d > 0 ? " · 克制" : ctr.d < 0 ? " · 被克" : ""),
          "熟练 " + Math.round(h.prof) + (h.buff ? " · 版本" + (h.buff > 0 ? "加强" : "削弱") : "") + (ctr.why ? " · " + ctr.why : ""),
          ctr.d > 0 ? "gold" : ctr.d < 0 ? "red" : ""));
      });
      if (!pool.length) acts.push(act("autopick", "这条线没英雄了，随便抓一个"));
      acts.push(act("autopick", "剩下的交给助教", "自动补完五个位置"));
      acts.push(act("bpstep", "禁完了，开始选人", "", "", true));
    }
    return scene("bp", {
      kicker: "赛前 BP · " + (bp.label || ""),
      title: "对 " + idName(bp.oppId) + " · " + (bp.bestOf === 1 ? "一局定生死" : "BO" + bp.bestOf),
      lines: bp.step === "ban"
        ? ["禁三个人。禁对了对面直接少一套打法，禁错了就是你亲手送他一场。"]
        : ["五个位置，一人一个英雄。熟练度低的就是在场上裸奔。"],
      step: bp.step, pickPos: bp.step === "pick" ? (POS[bp.pickPos] || "MID") : "",
      pickPosCN: bp.step === "pick" ? (POSCN[POS[bp.pickPos]] || "") : "",
      myBans: bp.myBans, aiBans: bp.aiBans, picks: bp.picks,
      aiPicks: bp.step === "pick" ? bp.aiPicks : null,
      patch: patchBrief(), env: S.env, envWhy: envWhy(S.env),
      tactic: bp.tac, tactics: S.tactics.map(tacBrief).filter(Boolean),
      acts: acts
    });
  }

  /* ================= 比赛结束分发 ================= */
  function gain(m, t, win) {
    S.budget += m;
    if (t) S.tickets += t;
    note((win ? "赢了。" : "输了。") + " 进账 " + wan(m) + (t ? ("，抽卡券 +" + t) : "") + "。");
  }
  function finishMatch(win) {
    var pend = S.pend;
    var kind = pend ? pend.kind : "lg";
    var lm = S.lastMatch || {};
    if (kind === "lg") {
      var r = pend.rnd;
      simRoundRest(r);
      addRec(win ? S.teamId : pend.oppId, win ? pend.oppId : S.teamId);
      S.lg.rnd = r + 1;
      S.regPlayed++; if (win) S.regW++; else S.regL++;
      S.score += win ? 3 : 0;
      gain(incomeFor("regular", win), ticketFor("regular", win), win);
      S.pend = null; S.sub = "league"; prepLeague();
    } else if (kind === "po") {
      var po = S.po, pr = po.pairs[pend.pi];
      pr.win = win ? S.teamId : pend.oppId;
      po.log.push({ rd: RDNAME[po.round], opp: pend.oppId, win: win });
      S.score += win ? 40 : 8;
      gain(incomeFor("playoff", win), ticketFor("playoff", win), win);
      S.pend = null; S.sub = "playoff"; prepPlayoff();
      if (S.po.done && S.po.champion === S.teamId) {
        S.budget += 1500; S.score += 500;
        note("季后赛夺冠。老板第一次主动给你倒水。");
      }
    } else if (kind === "wdg") {
      var w = S.wd, gpr = w.sched[pend.gr][pend.ri];
      for (var i = 0; i < gpr.length; i++) if (gpr[i].a === S.teamId || gpr[i].b === S.teamId) gpr[i].win = win ? S.teamId : pend.oppId;
      each(gpr, function (p2) { if (!p2.scored) setGroupWin(p2); });
      S.score += win ? 10 : 2;
      gain(incomeFor("worlds", win), ticketFor("worlds", win), win);
      S.pend = null; S.sub = "worlds"; prepWorlds();
    } else if (kind === "wdb") {
      var w2 = S.wd, pr2 = w2.pairs[pend.pi];
      pr2.win = win ? S.teamId : pend.oppId;
      S.score += win ? 60 : 15;
      gain(incomeFor("worlds", win), ticketFor("worlds", win), win);
      S.pend = null; S.sub = "worlds"; prepWorlds();
      if (S.wd.done && S.wd.champion === S.teamId) {
        S.budget += 3000; S.score += 900;
        note("世界赛冠军。你把这支队变成了历史。");
      }
    }
    if (lm.label) logLine(lm.label + " 对 " + (lm.oppName || "") + " → " + (win ? "胜" : "负") + " " + lm.w + "-" + lm.l);
  }
  function scMatch() {
    var m = S.lastMatch || {};
    return scene("match", {
      kicker: "赛后",
      title: m.win ? "赢了" : "输了",
      lines: [
        (m.label || "") + " · 对 " + (m.oppName || "") + " · " + (m.w || 0) + "-" + (m.l || 0),
        (m.upset ? (m.win ? "这就是爆冷。没人看好你，你也不在乎。" : "被爆冷了。对面打得比你想的脏。") : (m.win ? "该赢的赢了，仅此而已。" : "该输的输了，别找借口。"))
      ],
      m: m,
      acts: [act("next", "继续", "", "gold")]
    });
  }

  /* ================= 场景：常规赛 ================= */
  function scLeague() {
    var st = standings(), rows = [], acts = [];
    each(st, function (x, i) {
      rows.push({ rank: i + 1, name: idName(x.id), w: x.w, l: x.l, me: x.id === S.teamId, top8: i < 8 });
    });
    var pend = S.pend;
    if (pend) acts.push(act("pre", "准备对 " + idName(pend.oppId), pend.label, "gold"));
    if (S.lgDone) acts.push(act("toplayoff", "进季后赛", "前八名才有资格", "gold"));
    else {
      acts.push(act("skip", "把剩下的常规赛交给助教", "直接出结果，好坏都认", ""));
    }
    acts.push(act("go:manage", "回办公室", "训练、抽卡、卖人"));
    return scene("league", {
      kicker: "常规赛 · 第 " + S.season + " 年",
      title: "第 " + mySeed() + " 名 · " + S.regW + " 胜 " + S.regL + " 负",
      lines: S.lgDone ? ["常规赛打完。前八进季后赛，剩下的放假。"] : ["一场一场来。输了也别急，赛季长。"],
      table: rows, played: S.lg ? S.lg.rnd : 0, total: S.lg ? S.lg.sched.length : 17,
      note: pend ? ("下一场：" + idName(pend.oppId)) : "",
      acts: acts
    });
  }
  function scPlayoff() {
    var po = S.po || {};
    var acts = [];
    if (S.pend) acts.push(act("pre", "准备对 " + idName(S.pend.oppId), S.pend.label, "gold"));
    else if (po.done) acts.push(act("toworlds", "赛季收尾", "", "gold"));
    return scene("playoff", {
      kicker: "季后赛 · " + (RDNAME[po.round] || "已结束"),
      title: po.champion ? ("冠军：" + idName(po.champion)) : (po.top4 && po.top4.indexOf(S.teamId) >= 0 ? "还在打" : "已出局"),
      lines: ["八强开始 BO5。输了就回家，赢了继续挨打。"],
      seeds: (po.seeds || []).map(function (id, i) { return { seed: i + 1, name: idName(id), me: id === S.teamId }; }),
      pairs: (po.pairs || []).map(function (pr) { return { a: idName(pr.a), b: idName(pr.b), win: pr.win ? idName(pr.win) : "", score: pr.score || "" }; }),
      log: (po.log || []).map(function (x) { return { rd: x.rd, opp: idName(x.opp), win: x.win }; }),
      acts: acts
    });
  }
  function scWorlds() {
    var w = S.wd || {};
    var acts = [];
    if (S.pend) acts.push(act("pre", "准备对 " + idName(S.pend.oppId), S.pend.label, "gold"));
    else if (w.done) acts.push(act("toseason", "赛季结束", "", "gold"));
    var g0 = w.groups ? groupRank(0) : [], g1 = w.groups ? groupRank(1) : [];
    function rowsOf(arr) { return arr.map(function (x, i) { return { rank: i + 1, name: idName(x.id), w: x.w, l: x.l, me: x.id === S.teamId }; }); }
    return scene("worlds", {
      kicker: "世界赛 · 第 " + S.season + " 年",
      title: w.champion ? ("冠军：" + idName(w.champion)) : (w.bracket ? ("淘汰赛 · " + (w.bRound === 0 ? "半决赛" : "决赛")) : ("小组赛 第 " + ((w.r || 0) + 1) + " 轮")),
      lines: ["全世界的队挤在一起。你的对手不再只是隔壁那支队。"],
      groupA: rowsOf(g0), groupB: rowsOf(g1),
      pairs: (w.pairs || []).map(function (pr) { return { a: idName(pr.a), b: idName(pr.b), win: pr.win ? idName(pr.win) : "" }; }),
      meIn: !!w.meIn,
      acts: acts
    });
  }

  /* ================= 赛季结算 / 结局 ================= */
  function seasonOutcomeCN() {
    var po = S.po, wd = S.wd;
    var poCN = "未进季后赛";
    if (po && po.seeds && po.seeds.indexOf(S.teamId) >= 0) {
      if (po.champion === S.teamId) poCN = "冠军";
      else if (po.reachedFinal) poCN = "亚军";
      else if (po.reachedSemi) poCN = "四强";
      else poCN = "八强";
    }
    var wdCN = "没进世界赛";
    if (wd && wd.field && wd.field.indexOf(S.teamId) >= 0) {
      if (wd.champion === S.teamId) wdCN = "世界冠军";
      else if (wd.reachedFinal) wdCN = "世界亚军";
      else if (wd.bracket) wdCN = "世界赛四强";
      else wdCN = "小组赛出局";
    }
    return { po: poCN, wd: wdCN };
  }
  function endSeason() {
    var out = seasonOutcomeCN();
    S.history.push({
      season: S.season, team: S.teamName, tier: S.tier,
      reg: { w: S.regW, l: S.regL }, playoff: out.po, worlds: out.wd,
      ovr: teamOvr(), budget: S.budget, champion: (S.po && S.po.champion === S.teamId) || (S.wd && S.wd.champion === S.teamId),
      trophies: (S.po && S.po.champion === S.teamId ? 1 : 0) + (S.wd && S.wd.champion === S.teamId ? 1 : 0)
    });
    logLine("第 " + S.season + " 年结束：" + out.po + " / " + out.wd);
    S.seasonActive = false;
    S.sub = "season";
  }
  function scSeason() {
    var out = seasonOutcomeCN();
    var acts = [];
    if (S.season < S.maxSeason) acts.push(act("next_season", "进入第 " + (S.season + 1) + " 年", "", "gold"));
    else acts.push(act("finish", "收尾 · 看成绩单", "", "gold"));
    return scene("season", {
      kicker: "第 " + S.season + " 年 · 结束",
      title: "常规赛 " + S.regW + " 胜 " + S.regL + " 负",
      lines: ["一年就这么过去了。拿了什么、丢了什么，都在这张纸上。"],
      outcome: out,
      history: S.history.slice(),
      acts: acts
    });
  }
  function nextSeason() {
    S.season++;
    S.regW = 0; S.regL = 0; S.regPlayed = 0;
    /* 关键：把上一年的赛程对象清干净，否则 seasonStarted/stageSub 会认为新赛季"还在打"，直接跳过常规赛 */
    S.lg = null; S.lgDone = false; S.seasonActive = false;
    S.po = null; S.wd = null; S.pend = null; S.lastMatch = null;
    S.tickets += 3;
    S.form = { energy: 76, morale: 64, spirit: 64 };
    rollPatch();
    rollCoachOffers();
    S.market = []; S.marketRound = 0;
    rollMarket();
    grantTactics(1);
    note("休赛期。抽卡券 +3，转会市场开张，教练席换人。");
    S.sub = "manage";
  }
  function gradeOf(score) {
    if (score >= 1600) return { g: "S", t: "神", d: "你把这个游戏玩成了自己的纪录片。选手签你签得比签冠军还急。" };
    if (score >= 1000) return { g: "A", t: "王朝", d: "三年两冠。联盟开始改规则针对你，这算夸奖。" };
    if (score >= 600) return { g: "B", t: "强队", d: "成绩摆在那，钱也赚到了。老板满意，你不太满意。" };
    if (score >= 300) return { g: "C", t: "混子", d: "有高光，也有烂账。够吃饭，不够立碑。" };
    return { g: "D", t: "解散", d: "三年过去，队没了，你的名字还在转会群里被人当笑话讲。" };
  }
  function scEnd() {
    var g = gradeOf(S.score);
    var cups = 0;
    each(S.history, function (h) { cups += h.trophies || 0; });
    try {
      var prev = JSON.parse(localStorage.getItem("denshen_mgr") || "null");
      var best = { score: Math.round(S.score), grade: g.g, cups: cups, team: S.teamName || "", season: S.season || 1 };
      if (!prev || !prev.best || (prev.best.score || 0) < best.score) localStorage.setItem("denshen_mgr", JSON.stringify({ best: best, at: Date.now() }));
    } catch (e) { }
    return scene("result", {
      kicker: "三年 · 成绩单",
      title: g.g + " · " + g.t,
      lines: [g.d, "总积分 " + Math.round(S.score) + " · 奖杯 " + cups + " 座。"],
      grade: g, score: Math.round(S.score), cups: cups,
      history: S.history.slice(),
      acts: [act("restart", "再来一次", "从零开始", "gold")]
    });
  }

  /* ================= 财务 ================= */
  function payAndStart() {
    var c = capInfo();
    var short = Math.max(0, c.pay - S.budget);
    S.budget -= c.pay;
    if (short > 0) {
      /* 钱不够也得开赛：欠薪进账，全队心态掉一截。绝不把玩家锁死在财务页 */
      S.debt = Math.round((S.debt || 0) + short);
      if (S.form) {
        S.form.morale = clamp(S.form.morale - 12, 15, 100);
        S.form.spirit = clamp(S.form.spirit - 8, 15, 100);
      }
      note("工资差 " + wan(short) + "，老板先记账上。全队心态掉一截，这赛季背着债打。");
    } else {
      note("发了 " + wan(c.sal) + " 工资" + (c.tax > 0 ? ("，交了 " + wan(c.tax) + " 奢侈税") : "") + "。");
    }
    startLeague();
    return true;
  }
  function autosellOne() {
    var starterUids = [];
    each(POS, function (p) { if (S.lineup[p]) starterUids.push(S.lineup[p]); });
    var bench = S.cards.filter(function (c) { return starterUids.indexOf(c.uid) < 0 && POS.indexOf(c.pos) >= 0; });
    var pool = bench.length ? bench : S.cards.filter(function (c) { return POS.indexOf(c.pos) >= 0; });
    var best = null;
    each(pool, function (c) { if (!best || salOf(c) > salOf(best)) best = c; });
    if (!best) return false;
    var got = sellPrice(best);
    S.budget += got;
    for (var p in S.lineup) if (S.lineup[p] === best.uid) S.lineup[p] = null;
    S.cards = S.cards.filter(function (c) { return c.uid !== best.uid; });
    note("把 " + (best.name || "无名") + " 卖了，" + wan(got) + " 到账。人走茶凉。");
    return true;
  }

  /* ================= 场景分发 ================= */
  function sceneNow() {
    if (!S) return scMenu();
    switch (S.sub) {
      case "menu": return scMenu();
      case "team": return scTeam();
      case "draft": return scDraft();
      case "lineup": return scLineup();
      case "manage": return scManage();
      case "gacha": return scGacha();
      case "train": return scTrain();
      case "market": return scMarket();
      case "sell": return scSell();
      case "coach": return scCoach();
      case "cap": return scCap();
      case "league": return scLeague();
      case "bp": return S.bp ? scBP() : scLeague();
      case "match": return scMatch();
      case "playoff": return scPlayoff();
      case "worlds": return scWorlds();
      case "season": return scSeason();
      case "end": return scEnd();
      default: return scManage();
    }
  }

  function doPull(n) {
    var cost = n === 10 ? 9 : 1;
    if (S.tickets < cost) return false;
    S.tickets -= cost;
    var got = [], refund = 0, seen = ownIds();
    for (var i = 0; i < n; i++) {
      S.pity++;
      S.goldPity++;
      var forceGold = S.goldPity >= 40;
      var forcePurple = S.pity >= 10 || (n === 10 && i === n - 1);
      var raw = null;
      if (forceGold) raw = drawOne(null, { "金": 100, "紫": 0, "蓝": 0 }, null) || drawAny(null, null);
      else if (forcePurple) raw = drawOne(null, { "金": 0, "紫": 100, "蓝": 0 }, null) || drawAny(null, null);
      else raw = drawAny(RARW[S.tier] || RARW.B, null);
      if (!raw) break;
      if (raw.rarity === "金") { S.pity = 0; S.goldPity = 0; }
      else if (raw.rarity === "紫") { S.pity = 0; }
      if (seen[raw.id] || S.cards.length >= MAX_CARDS) {
        var back = (RAR[raw.rarity] || RAR["蓝"]).v;
        refund += back;
        got.push({ dup: true, name: raw.name || "", cn: raw.cn || "", rar: raw.rarity || "蓝", rc: (RAR[raw.rarity] || RAR["蓝"]).c, back: back, poscn: POSCN[raw.pos] || "" });
        continue;
      }
      seen[raw.id] = 1;
      var c = mkCard(raw);
      S.cards.push(c);
      got.push({ dup: false, name: c.name || "", cn: c.cn || "", rar: c.rarity, rc: RAR[c.rarity].c, poscn: POSCN[c.pos] || "", uid: c.uid, ovr: ovrOf(c) });
    }
    S.tickets += refund;
    S.pull = got;
    if (refund) note("重复卡分解，退回 " + refund + " 张券。");
    return true;
  }

  function dispatch(code) {
    var i, c;
    if (!code) return sceneNow();
    if (code.indexOf("team:") === 0) {
      var tid = code.slice(5);
      if (tid === "custom") {
        if (!signTeam("custom")) return scTeam();
      } else if (!signTeam(tid)) return scTeam();
      doInitialDraft();
      S.sub = "draft";
      return sceneNow();
    }
    if (code.indexOf("set:") === 0) {
      var parts = code.slice(4).split(":");
      for (var p in S.lineup) if (S.lineup[p] === parts[1]) S.lineup[p] = null;
      S.lineup[parts[0]] = parts[1];
      S.sub = "lineup";
      return sceneNow();
    }
    if (code.indexOf("focus:") === 0) { S.trainFocus = code.slice(6); S.sub = "train"; return sceneNow(); }
    if (code.indexOf("up:") === 0) {
      var dim = code.slice(3), card = S.trainFocus ? findCard(S.trainFocus) : null;
      if (card) {
        var cost = trainCost(card, dim);
        if (S.budget >= cost) {
          S.budget -= cost;
          card.train[dim] = (card.train[dim] || 0) + 2;
          note((card.name || "无名") + " 的" + STCN[dim] + " +2。练得怎么样，看他自己。");
        }
      }
      S.sub = "train";
      return sceneNow();
    }
    if (code.indexOf("buy:") === 0) {
      var cid = code.slice(4), raw = cardById(cid), price = buyPrice(cid);
      if (raw && S.budget >= price && S.cards.length < MAX_CARDS && !ownIds()[cid]) {
        S.budget -= price;
        S.cards.push(mkCard(raw));
        S.market = S.market.filter(function (x) { return x !== cid; });
        note("签下 " + (raw.name || "无名") + "，" + wan(price) + "。");
      }
      S.sub = "market";
      return sceneNow();
    }
    if (code.indexOf("sell:") === 0) {
      var uid = code.slice(5), cc = findCard(uid);
      if (cc && S.cards.length > 5) {
        S.budget += sellPrice(cc);
        for (var q in S.lineup) if (S.lineup[q] === uid) S.lineup[q] = null;
        S.cards = S.cards.filter(function (x) { return x.uid !== uid; });
        note("卖掉 " + (cc.name || "无名") + "，" + wan(sellPrice(cc)) + " 回血。");
      }
      S.sub = "sell";
      return sceneNow();
    }
    if (code.indexOf("hire:") === 0) {
      var hid = code.slice(5), rawC = coachById(hid), costC = coachHireCost(hid);
      if (rawC && S.budget >= costC) {
        S.budget -= costC;
        S.coach = rawC;
        note("签了教练 " + rawC.name + "，" + wan(costC) + "。他第一句话是：你们训练量不够。");
      }
      S.sub = "coach";
      return sceneNow();
    }
    if (code.indexOf("ban:") === 0) {
      var bn = code.slice(4);
      if (S.bp && S.bp.myBans.indexOf(bn) < 0 && S.bp.myBans.length < 3) S.bp.myBans.push(bn);
      S.sub = "bp";
      return sceneNow();
    }
    if (code.indexOf("tac:") === 0) {
      var tcid = code.slice(4);
      if (S.bp) S.bp.tac = (S.bp.tac === tcid ? null : tcid);
      S.sub = "bp";
      return sceneNow();
    }
    if (code.indexOf("pick:") === 0) {
      var hn = code.slice(5), ppos = POS[S.bp.pickPos];
      if (S.bp && ppos) {
        S.bp.picks[ppos] = hn;
        S.bp.pickPos++;
        if (S.bp.pickPos >= POS.length) { finishBP(); return sceneNow(); }
      }
      S.sub = "bp";
      return sceneNow();
    }
    switch (code) {
      case "go": S.sub = "team"; return sceneNow();
      case "custom": S.sub = "team"; return sceneNow();
      case "restart": S = null; return scMenu();
      case "keep": S.sub = "lineup"; return sceneNow();
      case "redraft":
        if (S.redraft > 0) { S.redraft--; doInitialDraft(); }
        S.sub = "draft"; return sceneNow();
      case "auto": autoLineup(); S.sub = "lineup"; return sceneNow();
      case "clear": S.lineup = { TOP: null, JUG: null, MID: null, BOT: null, SUP: null }; S.sub = "lineup"; return sceneNow();
      case "ready":
        if (!lineupReady()) return scLineup();
        S.pendingWin = null;
        rollPatch(); rollCoachOffers(); rollMarket(); grantTactics(1);
        S.marketRound = 0;
        S.sub = "manage"; return sceneNow();
      case "back": S.sub = "manage"; return sceneNow();
      case "focus_back": S.trainFocus = null; S.sub = "train"; return sceneNow();
      case "sellmode": S.sub = "sell"; return sceneNow();
      case "g1": doPull(1); S.sub = "gacha"; return sceneNow();
      case "g10": doPull(10); S.sub = "gacha"; return sceneNow();
      case "go:gacha": S.sub = "gacha"; return sceneNow();
      case "go:train": S.trainFocus = null; S.sub = "train"; return sceneNow();
      case "go:market": S.sub = "market"; return sceneNow();
      case "go:coach": S.sub = "coach"; return sceneNow();
      case "go:cap": if (seasonStarted()) { S.sub = stageSub(); return sceneNow(); } S.sub = "cap"; return sceneNow();
      case "go:start": if (seasonStarted()) { S.sub = stageSub(); return sceneNow(); } S.sub = "cap"; return sceneNow();
      case "go:league": S.sub = stageSub(); return sceneNow();
      case "go:manage": S.sub = "manage"; return sceneNow();
      case "tax": case "ok": if (seasonStarted()) { S.sub = stageSub(); return sceneNow(); } payAndStart(); return sceneNow();
      case "autosell": autosellOne(); S.sub = "cap"; return sceneNow();
      case "bpstep": if (S.bp && S.bp.myBans.length >= 3) S.bp.step = "pick"; S.sub = "bp"; return sceneNow();
      case "autopick":
        if (S.bp) {
          for (var pi = S.bp.pickPos; pi < POS.length; pi++) {
            var pz = POS[pi], av = bpAvailable(pz);
            S.bp.picks[pz] = av.length ? av[0].n : "";
            S.bp.pickPos = pi + 1;
          }
          finishBP();
        }
        return sceneNow();
      case "pre": if (S.pend) startBP(S.pend); return sceneNow();
      case "next": onMatchNext(); return sceneNow();
      case "skip":
        while (S.pend || !S.lgDone) {
          if (!S.pend) { prepLeague(); if (!S.pend) break; }
          var opp = S.pend.oppId;
          var theirs = aiSide(opp, aiPicksFor(opp));
          var mine = buildMySide({ picks: {}, tac: null }, theirs, null);
          var res = window.MATCH.simBo(mine, theirs, { bestOf: S.pend.bestOf || 3, dim: "GAME", patchBuffs: S.patch });
          S.lastMatch = { win: res.win, w: res.w, l: res.l, label: S.pend.label, oppId: opp, oppName: idName(opp), keyVars: [] };
          finishMatch(res.win);
          if (S.lgDone) break;
        }
        S.sub = S.lgDone ? "league" : "league";
        return sceneNow();
      case "toplayoff": startPlayoff(); return sceneNow();
      case "toworlds":
        if (S.po && S.po.reachedSemi) { startWorlds(); return sceneNow(); }
        endSeason(); return sceneNow();
      case "toseason": endSeason(); return sceneNow();
      case "finish": S.sub = "end"; return sceneNow();
      case "next_season": nextSeason(); return sceneNow();
    }
    return sceneNow();
  }
  function onMatchNext() {
    var win = !!S.pendingWin;
    S.pendingWin = null;
    finishMatch(win);
    /* 阶段推进 */
    if (S.sub === "league" && S.lgDone) { /* 留在 league，由 topPlayoff 触发 */ }
    if (S.sub === "playoff" && S.po && S.po.done) { /* 留在 playoff */ }
    if (S.sub === "worlds" && S.wd && S.wd.done) { /* 留在 worlds */ }
  }

  /* ================= 导出 ================= */
  function start(opts) {
    var o = (typeof opts === "string") ? { teamId: opts } : (opts || {});
    S = newState(o);
    S.sub = "menu";
    if (o.teamId) {
      signTeam(o.teamId === "custom" ? "custom" : o.teamId);
      if (S.teamId) { doInitialDraft(); S.sub = "draft"; return sceneNow(); }
    }
    return scMenu();
  }
  function choose(i, v) {
    if (!S) return scMenu();
    var code = (v !== undefined && v !== null && v !== "") ? String(v) : null;
    if (!code) {
      var sc = sceneNow();
      if (sc && sc.acts && sc.acts[i]) code = String(sc.acts[i].v);
    }
    if (!code) return sceneNow();
    return dispatch(code);
  }

  return {
    VERSION: "1.0.0",
    POS: POS, POSCN: POSCN, STAT: STAT,
    start: start,
    scene: sceneNow,
    choose: choose,
    state: function () { return S; },
    /* 供 ui.js / 主存档 / 调试使用的辅助 */
    acts: function () { var sc = sceneNow(); return (sc && sc.acts) || []; },
    can: function (code) {
      var sc = sceneNow(), list = (sc && sc.acts) || [];
      for (var i = 0; i < list.length; i++) if (String(list[i].v) === String(code)) return !list[i].dis;
      return false;
    }
  };
})();
