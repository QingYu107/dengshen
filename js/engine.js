/* 《登神》核心引擎 v2 —— 单机离线，无依赖 */
window.GAME = (function () {
  "use strict";
  const MATCH = window.MATCH;
  const POSCN = { TOP: "上单", JUG: "打野", MID: "中单", BOT: "ADC", SUP: "辅助" };

  /* ================= 基础 ================= */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const STATS = ["LANE", "MECH", "GAME", "POOL", "MENTAL", "PHYS", "TEAM", "FAME"];
  const CN = { LANE: "对线", MECH: "操作", GAME: "意识", POOL: "英雄池", MENTAL: "心态", PHYS: "体能", TEAM: "团队", FAME: "名气" };

  let _seed = 12345;
  function seedRng(n) { _seed = (n >>> 0) || 1; }
  function rnd() {
    _seed |= 0; _seed = (_seed + 0x6D2B79F5) | 0;
    let t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const rint = (a, b) => Math.floor(rnd() * (b - a + 1)) + a;
  const pick = a => a[Math.floor(rnd() * a.length)];
  const chance = p => rnd() < p;
  function shuffle(a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
  function wpick(list, wf) { let t = 0; for (const x of list) t += Math.max(0, wf(x)); if (t <= 0) return pick(list); let r = rnd() * t; for (const x of list) { r -= Math.max(0, wf(x)); if (r <= 0) return x; } return list[list.length - 1]; }

  /* ---- 真实选手数值校准：把真实数据中位数拉到引擎基准 72，保持相对强弱 ---- */
  let _P = null, _shift = null;
  const _ldl = {}, _ldlP = {};
  function median(a) { const b = a.slice().sort((x, y) => x - y); return b.length ? b[Math.floor(b.length / 2)] : 72; }
  function calibrate() {
    if (_shift !== null) return _shift;
    const raw = window.DATA_PLAYERS || {};
    const vals = [];
    for (const id in raw) {
      const p = raw[id], w = (window.DATA_POS[p.pos] || window.DATA_POS.MID).w;
      let v = 0; for (const k in w) v += (p.st[k] || 0) * w[k];
      vals.push(v);
    }
    _shift = Math.round(72 - median(vals));
    return _shift;
  }
  function realPlayers() {
    if (_P) return _P;
    calibrate();
    _P = {};
    const raw = window.DATA_PLAYERS || {};
    for (const id in raw) {
      const st = {};
      for (const k in raw[id].st) st[k] = clamp(Math.round(raw[id].st[k] + _shift), 6, 96);
      _P[id] = Object.assign({}, raw[id], { id, st });
    }
    return _P;
  }

  /* 黑料池：把 gossip.js 的争议条目转成标准事件，让它们真的会上门 */
  const _blackEvents = (function () {
    const arr = ((window.DATA_GOSSIP || {}).black) || [];
    return arr.map(b => {
      const eff = b.eff || {};
      return {
        id: "gb_" + b.id, cat: "media", w: 5, once: true, year: b.year || 0,
        text: b.text || "", sub: "黑料 · " + ((b.tag || []).join("、") || "旧账") + (b.who ? " · " + b.who : ""),
        opts: [
          { t: "认了，发个声明", eff: Object.assign({}, eff, { MENTAL: 2, story: { scandal: 0 } }),
            res: "声明发出去，评论区第一条是“早说了”。至少没人再追着问了，代价是你以后说什么都没人信。" },
          { t: "硬刚，直播开麦", eff: Object.assign({}, eff, { FAME: 2, TEAM: -2, story: { scandal: 2 } }),
            res: "直播间三万人在看，你骂了四十分钟，切片当天破百万。第二天联盟打电话过来，语气很客气。" },
          { t: "装死，不回应", eff: { MENTAL: -3, story: { scandal: 1 } },
            res: "你什么都没说。三周后热搜换人了，但搜索框里打你的 ID，第一条还是那个词条。" }
        ]
      };
    });
  })();

  /* LCK / 国际选手池（数据文件由别人写，全部 || [] 兜底；id 命名空间 t_lck_* / p_lck_*） */
  const lckRaw = () => (window.DATA_LCK && typeof window.DATA_LCK === "object") ? window.DATA_LCK : {};
  const _byId = arr => {
    const m = {};
    (arr || []).forEach(p => { if (p && p.id) m[p.id] = p; });
    return m;
  };
  const intlPlayers = () => _byId(window.DATA_PLAYERS_INTL || (lckRaw().players && window.DATA_PLAYERS_INTL));
  const lckPlayers = () => _byId(lckRaw().players || []);
  const lckTeams = () => _byId(lckRaw().teams || []);
  const aliasOf = () => (window.DATA_ID_ALIAS && typeof window.DATA_ID_ALIAS === "object") ? window.DATA_ID_ALIAS : {};

  const D = {
    players: () => Object.assign({}, realPlayers(), _ldlP, intlPlayers(), lckPlayers()),
    teams: () => Object.assign({}, window.DATA_TEAMS || {}, _ldl, lckTeams()),
    events: () => {
      const lckOn = !!(window.DATA_LCK && (window.DATA_LCK_EVENTS || []).length);
      /* 旧版“去 LCK”双人合同（events.js）与新 lck_offer_1 二选一：在 engine 侧去重，data 不用改 */
      const dropOld = ["ev_market_lck_tryout", "ev_market_lck_choice"];
      let pool = (window.DATA_EVENTS || []).concat(window.DATA_MEME_EVENTS || [], window.DATA_ENDLESS_EVENTS || [],
        window.DATA_EVENTS_STAR || [], window.DATA_EVENTS_EXTRA || [], window.DATA_STORY_EVENTS || [],
        (window.DATA_EVENTS_POS || []).filter(e => e && !e.inMatch), _blackEvents,
        /* 新数据文件可能还没落地，全部 || [] 兜底 */
        window.DATA_EVENTS_V3 || [],
        window.DATA_EVENTS_LPL || [],
        /* LCK 事件无条件并入（门槛交给事件自身 req），否则起手 lck_offer_1 永远进不来 */
        window.DATA_LCK_EVENTS || []);
      if (lckOn) pool = pool.filter(e => e && dropOld.indexOf(e.id) < 0);
      return pool;
    },
    talents: () => (window.DATA_TALENTS || []).concat(window.DATA_TALENTS_V4 || []),
    heroes: () => window.DATA_HEROES || [],
    chronicle: () => window.DATA_CHRONICLE || {},
    hot: () => window.DATA_HOT || { win: [], lose: [], drama: [], hupu: [] }
  };
  /* 选手/队伍查表：支持 DATA_ID_ALIAS 映射与 LCK/INTL 命名空间 */
  function playerById(id) {
    if (!id) return null;
    const m = D.players();
    return m[id] || (aliasOf()[id] ? m[aliasOf()[id]] : null) || null;
  }
  function teamById(id) {
    if (!id) return null;
    const m = D.teams();
    return m[id] || (aliasOf()[id] ? m[aliasOf()[id]] : null) || null;
  }
  /* 数据里 trait 新池是字符串、老池是数组：统一取数组（engine 目前不消费 player.trait，文本另存供 UI/图鉴用） */
  function traitArr(p) {
    if (!p) return [];
    const t = p.trait;
    return Array.isArray(t) ? t : (p.traitArr || (t ? [t] : []));
  }

  const MODES = {
    three: { key: "three", name: "三年之约", tag: "标准", desc: "36 个月。从 LDL 打到世界赛，第 36 个月结束出结局。一场完整的三年青春。" },
    endless: { key: "endless", name: "无尽生涯", tag: "无尽", desc: "没有终点。打到你 33 岁、或者没人要为止。每年联赛水平都在涨，你的手在往下掉。" }
  };
  const DIFFS = {
    easy: { key: "easy", name: "青训营", desc: "数值成长 +20%，对手弱 4 点，伤病少一半。先去爽一把。", growth: 1.2, opp: -4, bad: .7, luck: 1.1, inj: .5 },
    normal: { key: "normal", name: "职业联赛", desc: "标准难度。这是一个正常人的三年。", growth: 1.0, opp: 0, bad: 1, luck: 1, inj: .45 },
    hard: { key: "hard", name: "首发压力", desc: "成长 −15%，对手强 4 点。教练不惯着你。", growth: .85, opp: 4, bad: 1.25, luck: .9, inj: .7 },
    hell: { key: "hell", name: "废物中单", desc: "成长 −25%，对手强 6 点。全网都在等你退役。", growth: .75, opp: 6, bad: 1.5, luck: .8, inj: 1.15 }
  };
  /* 伤病系数 = 难度系数 × 模式系数（三年之约是短跑，不该被伤病吃掉一小半生涯） */
  function diffInj() {
    const d = DIFFS[S.diff] || DIFFS.normal;
    const modeMul = S.mode === "three" ? .8 : 1;
    return (d.inj || 1) * modeMul;
  }

  /* ================= 基底 ================= */
  const BASES = [
    { id: "genius", name: "天才少年", tag: "操作怪物", desc: "18 岁，手比脑子快。韩服王者前五十，青训营教练看了你三把就打电话。", st: { LANE: 66, MECH: 74, GAME: 46, POOL: 50, MENTAL: 38, PHYS: 72, TEAM: 46, FAME: 32 }, growth: "early", pot: 94, inj: .15, trait: "手速怪物", hidden: "心态容易崩" },
    { id: "brain", name: "体系大脑", tag: "运营怪", desc: "操作一般，但每个版本每条线的时间点你都记得住。", st: { LANE: 48, MECH: 46, GAME: 74, POOL: 62, MENTAL: 64, PHYS: 52, TEAM: 60, FAME: 26 }, growth: "normal", pot: 88, inj: .1, trait: "复盘狂", hidden: "操作天花板低" },
    { id: "netcafe", name: "网吧野王", tag: "rank 战神", desc: "峡谷之巅第一页常驻，比赛第一天被打成 0-8。", st: { LANE: 62, MECH: 70, GAME: 50, POOL: 38, MENTAL: 46, PHYS: 46, TEAM: 40, FAME: 42 }, growth: "normal", pot: 90, inj: .12, trait: "Rank 战神", hidden: "比赛隐身" },
    { id: "veteran", name: "老将之心", tag: "大器晚成", desc: "22 岁，别人都当你要退役了，你才刚开窍。", st: { LANE: 52, MECH: 44, GAME: 66, POOL: 56, MENTAL: 76, PHYS: 56, TEAM: 66, FAME: 28 }, growth: "late", pot: 86, inj: .08, trait: "大心脏", hidden: "前期没人要" },
    { id: "body", name: "身体怪物", tag: "莽夫", desc: "体测数据全队第一，脑子经常跟不上手。", st: { LANE: 60, MECH: 62, GAME: 44, POOL: 46, MENTAL: 54, PHYS: 82, TEAM: 50, FAME: 22 }, growth: "normal", pot: 84, inj: .06, trait: "永动机", hidden: "想不明白就开团" },
    { id: "hyped", name: "现象级新星", tag: "流量密码", desc: "还没打比赛，超话已经三万粉，一半是来看你翻车的。", st: { LANE: 58, MECH: 66, GAME: 40, POOL: 48, MENTAL: 40, PHYS: 60, TEAM: 44, FAME: 68 }, growth: "early", pot: 91, inj: .14, trait: "自带热搜", hidden: "黑粉比粉丝还急" },
    { id: "meta", name: "版本之子", tag: "吃版本饭", desc: "你只会版本强的英雄，但正好这个版本全是。", st: { LANE: 56, MECH: 56, GAME: 56, POOL: 80, MENTAL: 50, PHYS: 56, TEAM: 46, FAME: 30 }, growth: "normal", pot: 85, inj: .1, trait: "版本理解", hidden: "版本一改就废" },
    { id: "glue", name: "团队粘合剂", tag: "更衣室领袖", desc: "你不是最 C 的，但队里没人不喜欢你。", st: { LANE: 44, MECH: 40, GAME: 64, POOL: 48, MENTAL: 66, PHYS: 54, TEAM: 82, FAME: 24 }, growth: "normal", pot: 84, inj: .09, trait: "更衣室领袖", hidden: "数据难看" },
    { id: "glass", name: "玻璃天才", tag: "天赋异禀，一碰就碎", desc: "训练赛里你打爆所有人，然后因为手腕疼休息两周。", st: { LANE: 64, MECH: 76, GAME: 48, POOL: 46, MENTAL: 42, PHYS: 32, TEAM: 40, FAME: 36 }, growth: "early", pot: 95, inj: .26, trait: "易碎品", hidden: "伤病职业" },
    { id: "grinder", name: "训练狂", tag: "卷王", desc: "一天 14 小时训练赛，教练说你别把队友卷死。", st: { LANE: 52, MECH: 62, GAME: 60, POOL: 58, MENTAL: 58, PHYS: 62, TEAM: 42, FAME: 20 }, growth: "normal", pot: 90, inj: .17, trait: "卷王", hidden: "身体在报警" },
    { id: "streamer", name: "直播鬼才", tag: "嘴强王者", desc: "直播间 8 万人，比赛 0 胜场。你的剪辑比你的操作火。", st: { LANE: 52, MECH: 58, GAME: 42, POOL: 50, MENTAL: 56, PHYS: 48, TEAM: 38, FAME: 62 }, growth: "normal", pot: 83, inj: .1, trait: "自带流量", hidden: "职业态度存疑" },
    { id: "hero", name: "大心脏", tag: "越到决胜局越强", desc: "常规赛看不出你有什么特别。第五把你就不是人了。", st: { LANE: 48, MECH: 52, GAME: 52, POOL: 46, MENTAL: 84, PHYS: 52, TEAM: 56, FAME: 18 }, growth: "late", pot: 88, inj: .1, trait: "决胜局之神", hidden: "常规赛隐身" }
  ];

  /* 偏科天才：开局不强，某一项离谱，成长曲线陡。由 js/data/bases2.js 提供。 */
  const BASE_POOL = BASES.concat(Array.isArray(window.DATA_BASES_EXTRA) ? window.DATA_BASES_EXTRA : []);

  const ORIGINS = [
    { id: "academy", name: "青训营", desc: "在青训营洗了两年袜子，终于等到一个首发位。", st: { TEAM: 6, GAME: 4, PHYS: 3 }, money: 3, fame: 0, coach: 8 },
    { id: "netcafe", name: "网吧队", desc: "网吧五连坐，从来没赢过。直到你打到国服第一。", st: { MECH: 6, POOL: -4, LANE: 4 }, money: 1, fame: 6, coach: -5 },
    { id: "uni", name: "大学生联赛", desc: "学的是土木，打的是校队。毕业那年你决定不搬砖了。", st: { GAME: 7, MENTAL: 5, MECH: -3 }, money: 5, fame: 2, coach: 0 },
    { id: "streamer", name: "主播转职业", desc: "直播间两万贵宾，弹幕天天喊你去打职业。你去了。", st: { FAME: 12, TEAM: -5, MENTAL: 3 }, money: 8, fame: 12, coach: -8 }
  ];

  /* ================= 状态 ================= */
  let S = null, cur = null;
  let M = {};

  /* 弹幕：每种场景带一组池子，ui 会按 dm.pools 取词，不再只有 duel 里有弹幕 */
  const DM_HINT = {
    bp: ["banpick", "banpick_my", "banpick_opp", "parasite", "spam", "ritual"],
    inGame: ["kill", "death", "clutch", "obj", "comback", "choke", "parasite"],
    boGame: ["kill", "death", "gg", "choke", "juan", "parasite", "ritual"],
    forum: ["hupu", "parasite", "spam", "fanservice", "ritual"],
    bar: ["hupu", "parasite", "spam", "fanservice"],
    patch: ["banpick", "parasite", "spam"],
    standings: ["hupu", "worlds", "parasite"],
    worldsMap: ["worlds", "hupu", "parasite"],
    matchday: ["win", "lose", "clutch", "hupu", "parasite"],
    monthend: ["ritual", "spam", "blackwhite"],
    event: ["ritual", "spam"],
    worlds: ["worlds", "hupu"]
  };
  function scene(o) {
    if (o && o.type && !o.dm) {
      const base = DM_HINT[o.type];
      if (base) {
        const pools = base.slice();
        if (o.type === "boGame") pools.unshift(o.win ? "kill" : "death");
        if (o.type === "boGame" && o.upset) pools.push("choke");
        if (o.type === "matchday") pools.unshift((o.l || 0) > (o.w || 0) ? "lose" : "win");
        if (o.type === "inGame" && o.sit && o.sit.behind) pools.push("throw");
        o.dm = { pools: pools };
      }
    }
    return o;
  }
  function result(title, text, tone, next) {
    const o = scene({ type: "result", title, text: text || "", tone: tone || "info", pick() { return next ? next() : null; } });
    /* 系列赛结束的「决策贡献」评级挂到下一屏 result 上，任何分支都能显示 */
    if (M && M._dec) { o.dec = M._dec; o.decRating = M._dec.rank; M._dec = null; }
    if (M && M.achvNew && M.achvNew.length) { o.achvNew = M.achvNew.slice(); M.achvNew = null; }
    return o;
  }
  /* 欠债记录：存款一旦为负就永久打标（成就 debtEver 用） */
  function markDebt() {
    try {
      S.record = S.record || {};
      if ((S.money || 0) < 0) S.record.debtEver = true;
    } catch (e) { }
  }

  /* ================= 派生 ================= */
  function ovr(st, pos) {
    const w = (window.DATA_POS[pos] || window.DATA_POS.MID).w;
    let v = 0; for (const k in w) v += (st[k] || 0) * w[k];
    return Math.round(v);
  }
  const myOvr = () => ovr(stEff(), S.pos);
  function energyMax() { return 100 + (S && S.invest && S.invest.energyMax ? 10 : 0); }

  /* ================= 阈值：精力档位 / 金钱档位 =================
     精力档位既是行动门禁，也是成长倍率与比赛 FORM 修正的唯一来源：
     gain() 只用 band.growth，mySide() 只用 band.form，避免和原始数值重复相乘。 */
  const ENERGY_BANDS = [
    { key: "full", min: 80, name: "充沛", growth: 1.08, form: 2, injMul: .7, color: "#35d07f", note: "全部行动可用，比赛状态火热" },
    { key: "normal", min: 50, name: "正常", growth: 1, form: 0, injMul: 1, color: "#7ed0a6", note: "全部行动可用" },
    { key: "tired", min: 30, name: "疲劳", growth: .85, form: -3, injMul: 1.6, color: "#e8b923", note: "高消耗行动会让你进入疲劳" },
    { key: "exhausted", min: 15, name: "透支", growth: .65, form: -6, injMul: 2.5, color: "#f08a2c", note: "只能做低消耗行动，教练信任每月 −2" },
    { key: "danger", min: 1, name: "危险", growth: .4, form: -10, injMul: 4, color: "#d94436", note: "强制休息：本月不能选高消耗行动" },
    { key: "down", min: 0, name: "倒下", growth: 0, form: -15, injMul: 99, color: "#8b1a1a", note: "倒下：错过本月，恢复期 1 个月" }
  ];
  function energyBand(e) {
    const v = (e === undefined || e === null || isNaN(e)) ? 0 : Number(e);
    let out = ENERGY_BANDS[ENERGY_BANDS.length - 1];
    for (const b of ENERGY_BANDS) { if (v >= b.min) { out = b; break; } }
    return { key: out.key, name: out.name, min: out.min, growth: out.growth, form: out.form, injMul: out.injMul, color: out.color, note: out.note };
  }
  const MONEY_BANDS = [
    { key: "debt", min: -1e9, name: "欠债", note: "不能逛商店；每月有催债事件；只能靠工资还债" },
    { key: "tight", min: 0, name: "紧巴", note: "只能买 ≤5 万的商品；每月生活费事件" },
    { key: "stable", min: 10, name: "稳定", note: "正常商店/训练；买不起高价教练" },
    { key: "comfort", min: 50, name: "宽裕", note: "全部商店/教练；可以请客、投资" },
    { key: "rich", min: 200, name: "有钱", note: "投资/代言；训练有小幅分心风险" },
    { key: "capital", min: 1000, name: "资本玩家", note: "可触发投资/买队结局线" }
  ];
  function moneyBand(m) {
    const v = (m === undefined || m === null || isNaN(m)) ? 0 : Number(m);
    let out = MONEY_BANDS[0];
    for (const b of MONEY_BANDS) { if (v >= b.min) out = b; }
    return { key: out.key, name: out.name, note: out.note };
  }
  function clampEnergy(v) { return clamp(v, 0, energyMax()); }
  const teamOf = id => teamById(id);
  const playerOf = id => playerById(id);

  function teamPower(tid) {
    const t = teamOf(tid);
    if (!t) return 68;
    let sum = 0, n = 0;
    for (const k of ["TOP", "JUG", "MID", "BOT", "SUP"]) {
      const w = (S && S.teamId === tid && k === S.pos) ? 1.35 : 1;
      if (S && S.teamId === tid && k === S.pos) { sum += myOvr() * w; n += w; continue; }
      const pid = (S && S.roster && S.roster[tid] && S.roster[tid][k]) || (t.roster && t.roster[k]);
      const p = pid ? playerOf(pid) : null;
      sum += (p ? ovr(p.st, p.pos || k) : 67) * w; n += w;
    }
    const base = sum / Math.max(1, n);
    const chem = ((t.vibe || 60) - 55) / 6 + (S ? (S.teamStatus - 50) / 30 : 0);
    const coach = (({ 体系: 2.2, 铁腕: 1.6, 放养: .6 }[t.coachStyle] || 1) + ({ S: 2, A: 1, B: 0, C: -.5 }[t.tier] || 0)) * (S && S.teamId === tid ? (.6 + S.coachTrust / 120) : 1);
    // 无尽模式：第四个赛季起，整个联赛的水平逐年抬高（你老了，他们还在练）
    const rise = (S && S.endless && S.teamId !== tid) ? Math.max(0, (S.season || 1) - 3) * 2.6 : 0;
    return base + chem + coach + rise;
  }
  function myTeamPower() { return S.teamId ? teamPower(S.teamId) : myOvr() - 6; }
  function voice() {
    if (!S || !S.baseId) return 0;
    const v = (S.st.FAME - 20) * .55
      + (S.record.titles || []).length * 8
      + (myOvr() - 66) * 1.6
      + Math.min(24, S.fans / 20000)
      + (S.coachTrust - 50) / 4
      + (S.teamStatus - 50) / 6
      + (S.spirit - 60) / 8;
    return clamp(Math.round(v - (S.voiceDebt || 0) - (S.voiceReset || 0)), 0, 100);
  }
  function freeAgents() {
    const P = D.players(), out = [];
    for (const id in P) { const p = P[id]; if (!p.team) out.push(Object.assign({ id: id }, p)); }
    return out.sort((a, b) => ovr(b.st, b.pos) - ovr(a.st, a.pos));
  }
  function myTeamRoster() {
    const t = teamOf(S.teamId); if (!t) return [];
    const rows = [];
    for (const k of ["TOP", "JUG", "MID", "BOT", "SUP"]) {
      if (k === S.pos) { rows.push({ pos: k, name: S.name, ovr: myOvr(), mine: true }); continue; }
      const pid = ((S.roster || {})[S.teamId] || {})[k] || ((t.roster || {})[k]);
      const p = pid ? playerOf(pid) : null;
      rows.push({ pos: k, name: p ? p.name : "某个替补", ovr: p ? ovr(p.st, p.pos || k) : 62, pid: pid });
    }
    return rows;
  }
  /* 话语权 = 你能让这个队为你改变什么。花钱花信誉，换来的是资源 */
  function voiceCandidates(pos) {
    const pool = [];
    freeAgents().forEach(p => { if (!pos || p.pos === pos) pool.push(p); });
    allTeams().forEach(t => {
      if (t.id === S.teamId) return;
      for (const k of ["TOP", "JUG", "MID", "BOT", "SUP"]) {
        if (pos && k !== pos) continue;
        if (((S.roster || {})[S.teamId] || {})[k]) continue;
        const pid = (t.roster || {})[k];
        const p = pid ? playerOf(pid) : null;
        if (p) pool.push(Object.assign({ id: pid, teamName: t.name }, p));
      }
    });
    const seen = {};
    return pool.filter(p => { if (!p || seen[p.id]) return false; seen[p.id] = 1; return true; })
      .sort((a, b) => ovr(b.st, b.pos) - ovr(a.st, a.pos));
  }

  function voiceScene() {
    const rows = myTeamRoster();
    const weak = rows.filter(r => !r.mine).sort((a, b) => a.ovr - b.ovr)[0];
    const cands = voiceCandidates(weak ? weak.pos : "").slice(0, 8);
    const v = voice();
    const mb = moneyBand(S.money);
    const poor = mb.key === "debt";
    const opts = [];
    /* 25：BP 上加一个 ban */
    opts.push({
      k: "ban", t: "BP 上再加一个 ban", good: v >= 25,
      d: "你要求在 BP 时多按一个英雄。教练不爽，但对面会难受。",
      c: "话语权 −6 · 教练信任 −4 · 永久：BP 多一个 ban 位",
      run() {
        S.invest.banPlus = (S.invest.banPlus || 0) + 1;
        S.voiceDebt = (S.voiceDebt || 0) + 6;
        S.coachTrust = clamp(S.coachTrust - 4, 0, 100);
        return ["多一个 ban", "教练把 BP 板推过来：你来。你在对面最熟的那条线上划了个叉，会议室里没人说话。", "win"];
      }
    });
    /* 40：换掉最弱的队友 —— 候选池随机抽 3 个 */
    if (weak && cands.length) {
      const three = shuffle(cands).slice(0, 3);
      three.forEach(c => {
        const fv = ovr(c.st, c.pos);
        const good = fv > weak.ovr + 1;
        opts.push({
          k: "sign_" + c.id, t: "换掉 " + weak.name + " → " + (c.id || c.name), good, gate: "money",
          d: `签 ${(c.id || c.name)}（${fv}，${c.teamName || "自由人"}）打 ${POSCN[weak.pos] || weak.pos}，替掉 ${weak.name}（${weak.ovr}）。需要话语权 40。`,
          c: good ? "话语权 −15 · 教练信任 −6 · 队内氛围 −4" : "他不比队里那位强，经理会觉得你在闹事",
          run() {
            if (v < 40) return ["被驳回", "经理说你现在还没这个资格。他把你那份数据报告推回来，上面用红笔圈了三个失误。", "bad"];
            const fee = Math.round(Math.max(1, (fv - 58) * 3));
            if (S.money < fee) return ["钱不够", `${(c.id || c.name)} 的买断费要 ${fee} 万，俱乐部不肯全出。`, "bad"];
            S.money -= fee;
            S.voiceDebt = (S.voiceDebt || 0) + 15;
            S.roster[S.teamId] = S.roster[S.teamId] || {};
            S.roster[S.teamId][weak.pos] = c.id;
            S.teamStatus = clamp(S.teamStatus - 4, 0, 100);
            S.coachTrust = clamp(S.coachTrust - 6, 0, 100);
            S.timeline.push({ t: S.tick, text: `用话语权签下 ${c.id || c.name}` });
            return ["换人", `经理抽了半包烟，最后说：人你负责。${(c.id || c.name)} 第二天拎着行李箱出现在基地门口，第一句话是问你 wifi 密码。买断费 ${fee} 万。`, "win"];
          }
        });
      });
    }
    /* 55：涨薪 */
    opts.push({
      k: "money", t: "我要涨薪", good: v >= 55, gate: "money",
      d: `现在的年薪是 ${S.salary} 万。三年合同就这几年，钱不赚白不赚。`,
      c: "话语权 −10 · 队内氛围 −8 · 黑粉 +",
      run() {
        if (v < 55) return ["被驳回", "经理笑着说：你先把这个月的工资理由打出来。", "bad"];
        const up = rint(2, 6) / 10;
        S.salary += up; S.money += up * 50;
        S.voiceDebt = (S.voiceDebt || 0) + 10;
        S.teamStatus = clamp(S.teamStatus - 8, 0, 100);
        S.haters += rint(2000, 8000);
        return ["涨薪", `经理说预算紧张，最后给你加了 ${Math.round(up * 100)} 万。你在合同上签完字，听见隔壁办公室在讨论你的性价比。`, "info"];
      }
    });
    /* 70：施压管理层 —— 换教练 / 加预算 */
    opts.push({
      k: "press", t: "施压管理层", good: v >= 70, gate: "money",
      d: "你要么换教练，要么加预算买人。桌上只能选一个。",
      c: "话语权 −20 · 教练信任 −15（换教练则 +10）",
      run() {
        if (v < 70) return ["被请喝茶", "老板在会议室听你说了十分钟，最后问：你今年多大了？", "bad"];
        S.voiceDebt = (S.voiceDebt || 0) + 20;
        const t = teamOf(S.teamId);
        if (t) t.coachStyle = pick(["体系", "铁腕", "放养"]);
        S.coachTrust = clamp(S.coachTrust + 10, 0, 100);
        S.salary += Math.max(3, Math.round(S.salary * .15));
        S.money += 15;
        S.timeline.push({ t: S.tick, text: "施压管理层：换教练" });
        return ["换教练", "第二天训练室来了个新面孔，第一句话是：从今天起，资源按数据分配。旧教练在门口站了一会儿，走了。", "win"];
      }
    });
    /* 85：局内听我的 */
    opts.push({
      k: "tactic", t: "战术围绕我打", good: v >= 85, gate: "money",
      d: "你要资源、要视野、要队友给你让线。这个队以后怎么打，得听你的。",
      c: "话语权 −25 · 教练信任 −12 · 队内氛围 −6 · 比赛关键局 +8%",
      run() {
        if (v < 85) return ["被驳回", "教练把战术板一合：你先把自己的线管好。", "bad"];
        S.tactical = (S.tactical || 0) + 1;
        S.voiceDebt = (S.voiceDebt || 0) + 25;
        S.coachTrust = clamp(S.coachTrust - 12, 0, 100);
        S.teamStatus = clamp(S.teamStatus - 6, 0, 100);
        S.st.FAME = clamp(S.st.FAME + 3, 0, 98);
        S.timeline.push({ t: S.tick, text: "战术核心：围绕我打" });
        return ["战术核心", "教练把战术板擦干净，递给你：那你自己画。你在中路画了个圈，圈里写着“资源都给我”。队友看完没说话，但下一场他们真的来了。", "win"];
      }
    });
    /* 欠债时：除了 BP ban，其他“开口要资源”的选项全部锁住（金钱档位限制） */
    opts.forEach(o => { if (o.gate === "money" && poor) { o.off = true; o.reason = "存款为负：这个月开口没人当回事，先把债还了。"; } });
    return scene({
      type: "voice", opts, voice: v,
      pick(i) {
        const o = opts[i]; if (!o) return monthEnd();
        if (o.off) return result(o.t, o.reason || "现在开不了这个口。", "lose", () => actionScene());
        const r = o.run();
        return result(r[0], r[1], r[2], () => phase());
      }
    });
  }
  function monthLabel(tick) {
    return { year: 2025 + Math.floor((tick - 1) / 12), month: ((tick - 1) % 12) + 1 };
  }
  function ageCoef() {
    const a = S.age;
    if (S.growthType === "late") return a <= 21 ? .85 : a <= 24 ? 1.15 : 1.0;
    if (S.growthType === "early") return a <= 21 ? 1.35 : a <= 24 ? .95 : .5;
    return a <= 21 ? 1.2 : a <= 24 ? 1.0 : .6;
  }
  /* 老将：练得再狠也长不动了。26 岁之后按年龄逐级打折 */
  function veteranFactor() {
    const a = S.age;
    if (a < 26) return 1;
    if (a < 28) return .5;
    if (a < 30) return .3;
    if (a < 32) return .18;
    return .1;
  }
  /* 老将衰减：手和反应先走，意识和心态还撑得住。每月一次 */
  function veteranDecay() {
    const a = S.age;
    if (a < 26) return;
    const k = a < 28 ? .5 : a < 30 ? 1.0 : a < 32 ? 1.5 : 2.1;
    const dec = { MECH: -.34 * k, LANE: -.26 * k, PHYS: -.4 * k, GAME: +.16 * k, MENTAL: -.06 * k };
    for (const key in dec) {
      S.st[key] = clamp(S.st[key] + dec[key] * (.7 + rnd() * .6), 0, S.pot);
    }
    if (a >= 30 && chance(.12)) {
      S.st.PHYS = clamp(S.st.PHYS - 3, 0, 99);
      if (chance(.4)) S.timeline.push({ t: S.tick, text: "伤病：老了，手腕开始抗议" });
    }
  }
  function coachCoef() {
    const t = teamOf(S.teamId);
    const s = t ? ({ 体系: 1.12, 铁腕: 1.06, 放养: .94 }[t.coachStyle] || 1) : .95;
    return s * (.9 + S.coachTrust / 500);
  }

  /* ================= 开局 ================= */
  function newGame(opt) {
    opt = opt || {};
    seedRng(opt.seed || ((Date.now() ^ 0x5f3a1c) & 0x7fffffff));
    S = {
      v: 2, seed: _seed, name: "无名", pos: "MID", baseId: null, originId: null,
      age: 18, tick: 1, stage: "LDL", season: 1, phase: 0,
      mode: opt.mode === "endless" ? "endless" : "three", endless: opt.mode === "endless",
      retires: 0, seasonTitles: [],
      st: {}, pot: 90, growthType: "normal", inj: .1, slots: 1,
      energy: 100, morale: 68, fans: 800, haters: 200, hupu: 6.0,
      teamStatus: 55, coachTrust: 55, money: 3,
      teamId: null, contractLeft: 1, salary: 12, isSub: false,
      champs: [], pool: {}, mainHero: "", patch: null, patchNo: 0,
      talents: [], traits: [], roster: {}, tactical: 0,
      burst: 0, spirit: 60, voiceDebt: 0, gearBonus: 0, invest: {},
      /* 换队后的「新队磨合」临时话语权惩罚，按月自然消退；evRecent 用来抑制事件重复 */
      voiceReset: 0, evRecent: [],
      bag: [], deck: [null, null, null, null, null], ticket: 0, shopDone: false, shopBought: {},
      ended: false, achv: achvMergeInto({}), invest2: {}, duelLog: [], sponsor: null, academy: false,
      mates: {}, _matesSig: "", _matePid: null, _mateName: "",
      story: { corrupt: 0, justice: 0, scandal: 0, secret: 0 },
      flags: {}, cd: {}, pending: [],
      record: { games: 0, wins: 0, losses: 0, mvps: 0, titles: [], splits: [], worlds: [], msi: [], draws: 0, injuries: 0, debtEver: false, ending: null },
      timeline: [], diff: opt.diff || "normal", drawPity: 0
    };
    /* 上一轮经理模式打出来的家底，这一轮直接兑现 */
    try {
      const mg = lsGet(LG_MGR, null);
      if (mg && mg.best) {
        S.ticket = (S.ticket || 0) + 5;
        S.money = (S.money || 0) + 50;
        S.flags.mgrLegacy = mg.best;
      }
    } catch (e) { }
    M = { autoMode: 0, autoOff: false, guide: {}, achvNew: null, duelLog: [] };
    return scene({
      type: "create_name",
      pick(i, val) {
        S.name = String(val || "").trim().slice(0, 12) || "无名";
        return createBaseScene();
      }
    });
  }

  function createBaseScene() {
    const shown = shuffle(BASE_POOL).slice(0, 3).map(b => {
      const st = {}; for (const k of STATS) st[k] = clamp(b.st[k] + rint(-6, 6), 18, 92);
      return { b, st };
    });
    return scene({
      type: "create_base", bases: shown, canReroll: !S.flags.rerolled,
      pick(i, act) {
        if (act === "reroll") { S.flags.rerolled = true; return createBaseScene(); }
        const x = shown[i];
        S.baseId = x.b.id; S.st = Object.assign({}, x.st);
        S.pot = clamp(x.b.pot + rint(0, 10), 80, 100);
        S.growthType = x.b.growth; S.inj = x.b.inj;
        S.traits.push({ name: x.b.trait, desc: "基底特质" });
        S.hidden = x.b.hidden;
        return createPosScene();
      }
    });
  }

  function createPosScene() {
    return scene({ type: "create_pos", pick(i, pos) { S.pos = pos; return createPoolScene(); } });
  }

  function createPoolScene() {
    const hs = D.heroes().filter(h => h.pos.indexOf(S.pos) >= 0);
    const src = hs.length ? hs : D.heroes();
    const groups = [];
    for (let g = 0; g < 3; g++) {
      const picked = shuffle(src).slice(0, 5);
      groups.push(picked.map((h, idx) => ({ h, prof: idx === 0 ? rint(76, 84) : rint(55, 70) })));
    }
    return scene({
      type: "create_pool", groups, pos: S.pos,
      pick(i) {
        const g = groups[clamp(i, 0, groups.length - 1)] || groups[0];
        S.pool = {};
        g.forEach(x => { S.pool[x.h.n] = x.prof; });
        S.mainHero = g[0].h.n;
        S.champs = g.map(x => ({ n: x.h.n, en: x.h.en, prof: x.prof, main: x.h.n === S.mainHero }));
        return createOriginScene();
      }
    });
  }

  function createOriginScene() {
    return scene({
      type: "create_origin", origins: ORIGINS,
      pick(i) {
        const o = ORIGINS[i];
        S.originId = o.id;
        for (const k in o.st) S.st[k] = clamp(S.st[k] + o.st[k], 10, 92);
        S.money += o.money; S.st.FAME = clamp(S.st.FAME + o.fame, 5, 96);
        S.coachTrust = clamp(S.coachTrust + o.coach, 15, 90);
        const ldl = buildLdlTeams();
        S.teamId = pick(ldl).id;
        S.timeline.push({ t: 0, text: `加入 ${teamOf(S.teamId) ? teamOf(S.teamId).name : "LDL 队伍"}` });
        return scene({ type: "create_card", pick() { return startMonth(); } });
      }
    });
  }

  /* LDL 不是背景板：8 支青训队各自有五个能打的（数值 45~62），你打得好就能被 LPL 买走 */
  const LDL_NAMES = ["BLG.J", "TES.C", "JDG.Y", "WBG.A", "LNG.A", "IG.Y", "EDG.Y", "RNG.A"];
  const LDL_PRE = ["阿", "小", "老", "冷", "孤", "半", "夜", "青", "野", "白"];
  const LDL_SUF = ["刀", "神", "猫", "影", "梦", "浪", "星", "尘", "狼", "牙"];
  function fakeName() { return pick(LDL_PRE) + pick(LDL_SUF); }
  function buildLdlTeams() {
    if (Object.keys(_ldl).length) return Object.keys(_ldl).map(k => _ldl[k]);
    const lpl = Object.values(window.DATA_TEAMS || {}).filter(t => t.region === "LPL");
    for (let i = 0; i < LDL_NAMES.length; i++) {
      const base = lpl[i % Math.max(1, lpl.length)] || {};
      const tid = "t_ldl_" + i;
      const roster = {};
      for (const pos of ["TOP", "JUG", "MID", "BOT", "SUP"]) {
        const pid = "p_ldl_" + i + "_" + pos;
        const st = {}, pw = (window.DATA_POS[pos] || window.DATA_POS.MID).w;
        const low = rint(40, 52);
        for (const k of STATS) st[k] = clamp(low + rint(-5, 9) + (k === "FAME" ? -10 : 0), 12, 80);
        for (const k in pw) st[k] = clamp(st[k] + Math.round(pw[k] * 26), 12, 84);
        st.FAME = clamp(st.FAME + rint(-6, 6), 4, 60);
        _ldlP[pid] = { id: pid, name: fakeName(), cn: "", pos, team: tid, age: rint(17, 22), no: rint(1, 20), st, tags: [], trait: [], salary: 8, bio: "LDL 的青训生，梦想打上 LPL。" };
        roster[pos] = pid;
      }
      _ldl[tid] = {
        id: tid, name: LDL_NAMES[i], full: LDL_NAMES[i] + " 青训队", region: "LDL", city: "上海",
        color: base.color || "#5a6878", budget: 2, tier: "C", vibe: rint(48, 70),
        boss: "青训主管", coach: pick(["老教练", "前职业选手", "数据教练"]), coachStyle: pick(["铁腕", "体系", "放养"]),
        roster, logo: "ldl" + i, blurb: "工资 3000，梦想无价。"
      };
    }
    return Object.keys(_ldl).map(k => _ldl[k]);
  }

  /* ================= 日历 ================= */
  function startMonth(fromSave) {
    S._ml = monthLabel(S.tick);
    const _t = teamOf(S.teamId);
    S.stage = _t && _t.region === "LDL" ? "LDL" : "LPL";
    S.season = Math.floor((S.tick - 1) / 12) + 1;
    M.evDone = false;          // 兼容旧档/旧逻辑，保留
    M.evCount = 0;             // 本月已触发的事件数（上限 2）
    M.actionUsed = false;
    M.scrimUsed = false;
    const carriedRest = !!M.forcedRest;   // 上月末伤病静养给出的“下月强制休息”预告
    const carriedTired = !!M.tiredRest;   // 上月末精力见底给出的“下月只能低消耗”预告
    M.forcedRest = false;
    M.tiredRest = false;
    M.atMonthStart = true;   // 月初存档点：只有这里允许存（P0-5）
    S.shopDone = false;
    S.shopBought = S.shopBought || {};
    S.invest = S.invest || {};
    /* 赛段切换（1/4/7 月）清零“本赛段”类加成，分析师/教练的 banPlusSplit 在这里重置 */
    if (S._ml.month === 1 || S._ml.month === 4 || S._ml.month === 7) S.invest.banPlusSplit = 0;
    M.patch = null;
    const wantRegion = S.stage === "LDL" ? "LDL" : "LPL";
    if (!S.standings || S.standings.region !== wantRegion) initStandings();
    ensureMates(); /* 转会/换队后按新 roster 重建 4 名队友（旧队关系不带走） */

    /* 精力见底：倒下，直接错过这个月（回一个月末，恢复期） */
    if (S.energy <= 0) {
      S.energy = 0;
      S.morale = clamp(S.morale - 6, 0, 100);
      S.st.PHYS = clamp((S.st.PHYS || 50) - 4, 18, S.pot);
      S.coachTrust = clamp(S.coachTrust - 6, 0, 100);
      S.timeline.push({ t: S.tick, text: "倒下：这个月进医院，什么都没练成" });
      M.tiredRest = true;
      M.atMonthStart = false;
      return result("倒下", `${S.name}在训练室眼前一黑。队医说这是长期透支，这个月什么都别干了。\n\n精力恢复后，教练信任 −6，体质 −4。`, "bad", () => monthEnd());
    }

    /* 危险档（精力 1~14）：这个月只能做低消耗行动（P1-2 第 4 节表）。
       和伤病静养分开标记：tiredRest 只限制高消耗行动，不算「因伤损失行动月」 */
    if (energyBand(S.energy).key === "danger") {
      M.tiredRest = true;
      S.timeline.push({ t: S.tick, text: "精力见底：这个月被队医要求强制休息" });
    }
    /* 接住上月末的预告：伤病静养 / 精力见底各接各的，直到下个月再按当时精力重判 */
    M.forcedRest = M.forcedRest || carriedRest;
    M.tiredRest = M.tiredRest || carriedTired;

    /* 读档：不再重摇版本/大事件，直接回到月初的行动页 */
    if (!fromSave) {
      if (!S.patch || S._ml.month === 1 || chance(.3)) {
        rollPatch();
        if (S._ml.month === 1 || S.patch.big) return patchScene();
      }
      /* 大事件：一个月最多撞一次，撞上就先处理它，别想着跳过 */
      if (chance(.14)) {
        const bev = bigEvents();
        if (bev.length) { const ev = wpick(bev, e => e.w || 10); return bigEventScene(ev, () => actionScene()); }
      }
    }
    return actionScene();
  }

  /* ---------------- 随机大事件 ---------------- */
  function bigEvents() {
    const pool = (window.DATA_BIGEVENTS || []).filter(e => {
      if (!e || !e.opts || !e.opts.length) return false;
      if (e.once && S.flags["bgev_" + e.id]) return false;
      if (e.year && e.year !== S.season) return false;
      if (e.months && e.months.length && e.months.indexOf(S._ml.month) < 0 && e.months.indexOf(0) < 0) return false;
      const r = e.req || {};
      if (r.stage && r.stage.length && r.stage.indexOf(S.stage) < 0) return false;
      if (r.pos && r.pos.length && r.pos.indexOf(S.pos) < 0) return false;
      if (r.minOvr && myOvr() < r.minOvr) return false;
      if (r.maxOvr && myOvr() > r.maxOvr) return false;
      /* 阈值门禁：精力 / 金钱（越界的事件不要出现） */
      if (r.minEnergy !== undefined && S.energy < r.minEnergy) return false;
      if (r.maxEnergy !== undefined && S.energy > r.maxEnergy) return false;
      if (r.minMoney !== undefined && S.money < r.minMoney) return false;
      if (r.maxMoney !== undefined && S.money > r.maxMoney) return false;
      if (r.minMorale !== undefined && S.morale < r.minMorale) return false;
      if (r.maxMorale !== undefined && S.morale > r.maxMorale) return false;
      return true;
    });
    return pool;
  }

  function bigEventScene(ev, next) {
    const t = teamOf(S.teamId) || {};
    const fill = s => String(s || "").replace(/\{name\}/g, S.name).replace(/\{team\}/g, t.name || "").replace(/\{opp\}/g, (M.series && M.series.oppName) || "对手").replace(/\{pos\}/g, POSCN[S.pos] || "");
    return scene({
      type: "bigevent", id: ev.id, cat: ev.cat, title: ev.title, text: fill(ev.text), sub: fill(ev.sub),
      opts: (ev.opts || []).map(o => ({ t: o.t, risk: o.risk ? true : false, d: o.risk ? "要过检定：" + (o.risk.stat ? (CN[o.risk.stat] || o.risk.stat) : "") + " DC " + o.risk.dc : "" })),
      pick(i) {
        const o = (ev.opts || [])[clamp(i, 0, ev.opts.length - 1)];
        if (ev.once) S.flags["bgev_" + ev.id] = 1;
        S.timeline.push({ t: S.tick, text: `大事件：${ev.title}` });
        let text = fill(o.res || "");
        let ok = true;
        if (o.risk) {
          const stv = S.st[o.risk.stat] || 50;
          const roll = rint(1, 20) + Math.floor((stv - 50) / 5) + Math.floor((S.morale - 50) / 12);
          ok = roll >= (o.risk.dc || 12);
          text = fill(ok ? (o.risk.ok || o.res || "") : (o.risk.fail || ""));
          if (o.risk.bonus) applyEff(ok ? o.risk.bonus : (o.risk.bonusFail || {}));
        }
        applyEff(o.eff || {});
        return result(ev.title, text + "\n\n（这一条已经进了你的档案室。）", ok ? "info" : "bad", () => next ? next() : actionScene());
      }
    });
  }

  function versionPatch() {
    // 版本更新：随机一个英雄池英雄熟练度下降，另一个上升
    if (!S.champs.length) return;
    const down = pick(S.champs), up = pick(S.champs);
    down.prof = clamp(down.prof - rint(8, 18), 10, 99);
    up.prof = clamp(up.prof + rint(4, 10), 10, 99);
    M.patch = `${down.n} 被砍，${up.n} 起飞`;
  }

  /* 9 个真行动：一个月只能用掉一次行动名额。门禁不合格时置灰并给 reason，点了也不抛错。 */
  function buildActions() {
    const band = energyBand(S.energy);
    const used = !!M.actionUsed;
    const lowBand = band.key === "exhausted" || band.key === "danger" || band.key === "down";
    const defs = [];
    const push = d => defs.push(d);
    const gate = d => {
      if (used) return { can: false, reason: "本月的行动已经用掉，接下来只能进赛程。" };
      if (d.id !== "rest" && (M.forcedRest || M.tiredRest) && d.energyCost > 10) return { can: false, reason: M.tiredRest ? "精力见底：这个月只能做低消耗行动（≤10）、休息或心理辅导。" : "强制休息：这个月不能做高消耗行动。" };
      if (lowBand && d.id !== "rest" && d.id !== "mental" && d.energyCost > 10) return { can: false, reason: "精力" + band.name + "：只能做低消耗行动（≤10）、休息或心理辅导。" };
      if (d.energyCost > S.energy) return { can: false, reason: "精力不足：需要 " + d.energyCost + "，你现在 " + Math.round(S.energy) + "。" };
      if (d.cond && !d.cond()) return { can: false, reason: (typeof d.condReason === "function" ? d.condReason() : d.condReason) || "当前条件不满足。" };
      return { can: true, reason: "" };
    };

    push({
      id: "train", label: "加练", tag: "成长", energyCost: 22,
      desc: "一天两练，把操作和英雄池往上顶。教练看得见，腰椎也看得见。",
      run() {
        S.energy = clampEnergy(S.energy - 22);
        gain({ MECH: 1.6, LANE: 1.2, POOL: 1.1 }, 1.15);
        S.coachTrust = clamp(S.coachTrust + 4, 0, 100);
        return ["加练", pick([
          "训练赛打到第 9 把，你的手指开始发抖，但那一波 1v2 反杀是真的帅。",
          "教练站在后面看了十分钟，什么也没说，走的时候把你的水杯灌满了。",
          "你练到凌晨两点，保安来赶人，你说明天有比赛，他说那也不行。"
        ]), "info"];
      }
    });
    push({
      id: "review", label: "复盘", tag: "意识", energyCost: 10,
      desc: "把昨天的比赛一帧一帧拆开看。看自己怎么送的，也看对面怎么赢的。",
      run() {
        S.energy = clampEnergy(S.energy - 10);
        gain({ GAME: 2.1, TEAM: .6 }, 1.05);
        S.morale = clamp(S.morale + 3, 0, 100);
        return ["复盘", "你把第三局的 27 分钟拖了四十遍，终于看清楚：那波不是队友菜，是视野没做到河道。", "info"];
      }
    });
    push({
      id: "rank", label: "排位", tag: "手感", energyCost: 15,
      desc: "韩服排位，练手感，顺便看看版本答案长什么样。",
      run() {
        S.energy = clampEnergy(S.energy - 15);
        gain({ MECH: 1.1, LANE: .9, POOL: .7 }, 1);
        const good = chance(.55);
        S.morale = clamp(S.morale + (good ? 5 : -7), 0, 100);
        return ["排位", good ? "韩服大师 400 点，你连续三天登顶国服第一。弹幕开始有人刷你 ID。" : "连跪七把，掉回钻石。你在公屏打了一句“这游戏没法玩”，然后继续排。", good ? "info" : "bad"];
      }
    });
    push({
      id: "stream", label: "开播", tag: "名气", energyCost: 10,
      desc: "开播两小时，涨粉、恰米，顺便被骂。",
      run() {
        S.energy = clampEnergy(S.energy - 10);
        const g = rint(3, 9);
        S.st.FAME = clamp(S.st.FAME + g, 0, 98);
        S.fans += g * rint(300, 1200); S.money += g * .6;
        if (chance(.25)) { S.haters += rint(300, 1500); S.hupu = clamp(S.hupu - .2, 0, 10); }
        return ["开播", pick([
          "直播间 2.3 万人，你一边补刀一边回弹幕，感觉比打比赛轻松。",
          "有个大哥刷了个嘉年华，条件是让你用亚索打中单。你用了，输了。",
          "弹幕问你什么时候退役，你笑着说快了，心里想的是这个月房租。"
        ]), "info"];
      }
    });
    push({
      id: "rest", label: "休息", tag: "体能", energyCost: 0, costText: "精力 +38",
      desc: "睡觉，吃饭，看两集动画。人不是机器。",
      run() {
        S.energy = clampEnergy(S.energy + 38);
        S.st.PHYS = clamp(S.st.PHYS + 1.2, 0, S.pot);
        S.morale = clamp(S.morale + 8, 0, 100);
        return ["休息", pick([
          "你睡了十二个小时，醒来发现手机 47 条未读，没有一条是教练的。",
          "你去楼下吃了一碗牛肉面，加了两份肉。老板问你是不是运动员，你说算是吧。"
        ]), "info"];
      }
    });
    push({
      id: "gym", label: "健身", tag: "体能", energyCost: 8,
      desc: "队友都在睡觉，你在跑步机上。体能就是职业寿命。",
      run() {
        S.energy = clampEnergy(S.energy - 8);
        S.st.PHYS = clamp(S.st.PHYS + 2.4, 0, S.pot);
        S.morale = clamp(S.morale + 4, 0, 100);
        return ["健身", "卧推 80 公斤。教练说你这身体打五年没问题，你想的是能打三年就烧高香了。", "info"];
      }
    });
    push({
      id: "coach", label: "找教练谈谈", tag: "关系", energyCost: 5,
      desc: "你被按在替补席上，得知道为什么。",
      cond: () => S.coachTrust < 45,
      condReason: () => "教练现在不想单独谈（信任 " + Math.round(S.coachTrust) + "，低于 45 才需要找他）。",
      run() {
        S.energy = clampEnergy(S.energy - 5);
        S.coachTrust = clamp(S.coachTrust + rint(6, 14), 0, 100);
        S.morale = clamp(S.morale + 5, 0, 100);
        return ["谈话", "教练说不是不用你，是你训练赛不讲话。你愣了一下——原来问题在这儿。", "info"];
      }
    });
    push({
      id: "mental", label: "心理辅导", tag: "心态", energyCost: 3,
      desc: "俱乐部请的心理老师，一小时 800，俱乐部出钱。",
      cond: () => S.morale < 55,
      condReason: () => "心理老师说你不用来（心态 " + Math.round(S.morale) + "，低于 55 才需要约）。",
      run() {
        S.energy = clampEnergy(S.energy - 3);
        S.morale = clamp(S.morale + 16, 0, 100);
        S.st.MENTAL = clamp(S.st.MENTAL + 1.1, 0, S.pot);
        return ["心理辅导", "老师说你不是抗压能力差，是把所有事都憋着。你说了四十分钟，最后哭了，感觉好多了。", "info"];
      }
    });
    push({
      id: "voice", label: "动用话语权", tag: "话语权", energyCost: 6,
      desc: "你现在有资格拍桌子了。签人、涨薪、还是让全队围绕你打，挑一样。",
      cond: () => voice() >= 25,
      condReason: () => "话语权还不够（现在 " + Math.round(voice()) + "，要 25），说话没人听。",
      run() {
        S.energy = clampEnergy(S.energy - 6);
        return voiceScene();
      }
    });

    return defs.map(d => {
      const g = gate(d);
      return {
        id: d.id, label: d.label, tag: d.tag, desc: d.desc,
        energyCost: d.energyCost,
        cost: d.costText || (d.energyCost > 0 ? "精力 −" + d.energyCost : "免费"),
        can: g.can, reason: g.reason, used: used, run: d.run
      };
    });
  }

  function heroTrainScene() {
    const all = D.heroes().filter(h => h.pos.indexOf(S.pos) >= 0 && S.pool[h.n] === undefined);
    const own = Object.keys(S.pool).map(n => ({ n: n, prof: S.pool[n] })).sort((a, b) => a.prof - b.prof).slice(0, 3);
    const opts = own.concat(shuffle(all).slice(0, 2).map(h => ({ n: h.n, prof: 0, isNew: true })));
    return scene({
      type: "trainHero", opts: opts, pos: S.pos, main: S.mainHero,
      pick(i, v) {
        if (v === "back") return actionScene();
        const o = opts[clamp(i, 0, opts.length - 1)];
        if (!o) return actionScene();
        const base = o.isNew ? 40 : o.prof;
        const up = rint(6, 12) + Math.round((S.st.POOL - 60) / 8);
        S.pool[o.n] = clamp(base + up, 0, 99);
        gain({ POOL: 1.2 }, .8);
        let note = `从 ${Math.round(base)} 练到 ${Math.round(S.pool[o.n])}。`;
        if (S.pool[o.n] >= 85 && (!S.mainHero || S.pool[o.n] > (S.pool[S.mainHero] || 0))) {
          S.mainHero = o.n;
          note += ` 你把它定成了本命：一局带一个，成功率 +8%，爆种消耗减半。`;
        }
        return result("练 " + o.n, note + " 练到 85 以上就是本命，一局能带一个。", "info", () => actionScene());
      }
    });
  }

  /* 自由操作：6 个常驻（卡组/抽卡/积分榜/商店/练英雄/定打法）+ LDL 专属训练赛（每月 1 次）。
     不占月行动名额，但练英雄/打法/训练赛要精力；条件不满足时置灰给 reason。 */
  function freeActs() {
    const out = [];
    const band = energyBand(S.energy);
    const mb = moneyBand(S.money);
    const lowBand = band.key === "exhausted" || band.key === "danger" || band.key === "down";
    const gate = (d) => {
      if (lowBand && d.energyCost > 10) return { can: false, reason: "精力" + band.name + "：低消耗行动才能做（≤10），先休息。" };
      if (d.energyCost > S.energy) return { can: false, reason: "精力不足：需要 " + d.energyCost + "，你现在 " + Math.round(S.energy) + "。" };
      if (d.cond && !d.cond()) return { can: false, reason: d.reason || "当前条件不满足。" };
      return { can: true, reason: "" };
    };
    const push = (d) => {
      const g = gate(d);
      out.push({
        id: d.id, key: d.key, label: d.label, tag: d.tag, desc: d.desc, note: d.note || "",
        energyCost: d.energyCost, cost: d.energyCost > 0 ? "精力 −" + d.energyCost : "免费",
        used: !!d.used, can: g.can, reason: g.reason, make: d.make
      });
    };

    push({
      id: "deck", key: "deck", label: "卡组", tag: "构筑", energyCost: 0,
      desc: "五张卡槽，装什么就是什么流派。",
      note: ((S.deck || []).filter(Boolean).length) + "/5",
      make: () => deckScene(() => actionScene())
    });
    push({
      id: "gacha", key: "gacha", label: "抽卡", tag: "抽卡", energyCost: 0,
      desc: "抽卡券打比赛就攒。十连保底紫，40 抽保底金。",
      note: (S.ticket || 0) + " 券",
      make: () => gachaScene(() => actionScene())
    });
    push({
      id: "standings", key: "rank", label: "积分榜", tag: "情报", energyCost: 0,
      desc: "常规赛谁在前面、谁要掉下去。别的队也在打，不是只有你在动。",
      note: "第 " + myRank() + " 名",
      make: () => standingsScene(() => actionScene())
    });
    push({
      id: "shop", key: "shop", label: "商店", tag: "花钱", energyCost: 0,
      desc: "私教、心理医生、训练设备、外设、请客。钱现在有用了。",
      note: Math.round(S.money) + " 万",
      used: !!S.shopDone,
      cond: () => !S.shopDone && mb.key !== "debt",
      reason: S.shopDone ? "这个月已经逛过了。" : "存款为负，老板不让你赊账：先还债。",
      make: () => shopScene(() => actionScene())
    });
    push({
      id: "heroTrain", key: "heroTrain", label: "练英雄", tag: "英雄池", energyCost: 14,
      desc: "开训练房，一个一个抠。新英雄从 40 起，练到 85 以上就是本命。",
      note: (S.mainHero || "本命未定"),
      make: () => { S.energy = clampEnergy(S.energy - 14); return heroTrainScene(); }
    });
    push({
      id: "style", key: "style", label: "定打法", tag: "策略", energyCost: 4,
      desc: "全队按什么方式打。",
      note: styleOf() ? STYLE_MAP[styleOf()].name : "各打各的",
      make: () => { S.energy = clampEnergy(S.energy - 4); return styleScene(() => actionScene()); }
    });
    if (S.stage === "LDL") push({
      id: "scrim", key: "scrim", label: "LDL 训练赛", tag: "比赛", energyCost: 12,
      desc: "约一支 LDL 队打两把。不算正式比赛，但教练组会记笔记。",
      note: "每月 1 次",
      used: !!M.scrimUsed,
      cond: () => !M.scrimUsed,
      reason: "这个月已经约过训练赛了。",
      make: () => {
        M.scrimUsed = true;
        S.energy = clampEnergy(S.energy - 12);
        S.st.GAME = clamp(S.st.GAME + 1.1, 0, S.pot);
        S.st.TEAM = clamp(S.st.TEAM + 1.3, 0, S.pot);
        gain({ POOL: .5 }, .7);
        const good = chance(.55);
        S.morale = clamp(S.morale + (good ? 4 : -3), 0, 100);
        S.coachTrust = clamp(S.coachTrust + (good ? 3 : -1), 0, 100);
        return result("LDL 训练赛", good
          ? "两把训练赛你们 2:0，你第二把用新英雄打穿了对面中单。教练在战术板上圈了你的 ID，没说话，但第二天训练赛还是把你排进了首发。"
          : "训练赛一胜一负。对面中单在你脸上刷了个表情，你复盘到凌晨，发现是自己第三波的线权判断错了。", good ? "info" : "bad", () => actionScene());
      }
    });
    return out;
  }

  function actionScene() {
    const acts = buildActions();
    const frees = freeActs();
    const band = energyBand(S.energy);
    const mb = moneyBand(S.money);
    return scene({
      type: "action", acts: acts, ml: S._ml, frees: frees,
      actionUsed: !!M.actionUsed,
      energy: Math.round(S.energy), energyMax: energyMax(), energyBand: band,
      money: Math.round(S.money), moneyBand: mb,
      bonds: deckBonds().summary, autoMode: autoLevel(), autoOn: autoLevel() > 0,
      guide: guide("action"),
      pick(i, v) {
        /* 自由操作：v 可能是 "free"（旧 UI）或自由操作自己的 id（新 UI） */
        let fi = -1;
        if (v === "free") fi = clamp(Number(i) || 0, 0, frees.length - 1);
        else if (typeof v === "string" && v) {
          const k = frees.map(f => f.id).indexOf(v);
          if (k >= 0) fi = k;
        }
        if (fi >= 0) {
          const f = frees[fi];
          /* 已用/条件不满足：忽略点击并重渲，不抛错 */
          if (!f || f.used || f.can === false || typeof f.make !== "function") return actionScene();
          /* 纯查看（卡组/积分榜）不动存点；会改状态/花钱/换券的自由操作才封存点，防读档重刷 */
          if (f.id !== "deck" && f.id !== "standings") M.atMonthStart = false;
          const r = f.make();
          return r && r.type ? r : actionScene();
        }
        /* UI 的“已用，进入赛程”按钮：行动已用掉，直接把月份推下去 */
        if (v === "next") return checkEvent();
        let a = null;
        if (typeof v === "string" && v) a = acts.filter(x => x.id === v)[0] || null;
        if (!a && i !== undefined && i !== null && i !== "") a = acts[clamp(Number(i) || 0, 0, acts.length - 1)];
        if (!a || a.can === false || a.used) return actionScene();
        M.actionUsed = true;
        M.atMonthStart = false;
        const r = a.run();
        if (r && r.type) return r;
        if (!r) return actionScene();
        return result(r[0], r[1], r[2], () => checkEvent());
      }
    });
  }

  const GROWTH = 0.42; // 全局成长速度：三年只够你从 LDL 新人长成 LPL 首发，别想一年封神
  const hasT = id => (S.talents || []).indexOf(id) >= 0;

  function gain(map, mult) {
    const diff = DIFFS[S.diff] || DIFFS.normal;
    const lastYear = hasT("fa_last_dance") && S.contractLeft <= 1;
    const db = deckBonus();
    const gmul = 1 + (S.invest && S.invest.growth ? S.invest.growth : 0);
    const per = (db.growth || 0) * 0.01;
    /* 成长倍率只由精力档位给（充沛 1.08 / 正常 1 / 疲劳 .85 / 透支 .65 / 危险 .4 / 倒下 0），
       心态只做很轻的修正，避免和档位重复相乘把成长打崩 */
    const band = energyBand(S.energy);
    const state = band.growth * clamp(.85 + S.morale / 500, .85, 1.05);
    /* 队友关系：aff 均值 50 为基准，±4% 训练乘子（0 → 0.96，100 → 1.04），只做轻修正 */
    const mateMul = clamp(1 + (matesAffMean() - 50) / 1250, .95, 1.05);
    for (const k in map) {
      let base = map[k] * mult * diff.growth * GROWTH * gmul * (1 + per) * mateMul;
      if (lastYear) base *= 1.6; // 最后一舞：合同年，练得比谁都狠
      const room = (S.pot - S.st[k]) / 100;
      let g = base * (.6 + room * 1.6) * state * ageCoef() * veteranFactor() * coachCoef() * (.75 + rnd() * .6);
      if (k === "MECH" && S.age >= 26) g *= .35;
      S.st[k] = clamp(S.st[k] + g, 0, S.pot);
    }
    /* 私教：连续三个月指定属性成长 */
    const s3 = S.invest && S.invest.stat3;
    if (s3 && s3.left > 0) {
      S.st[s3.stat] = clamp(S.st[s3.stat] + s3.v, 0, S.pot);
      s3.left--;
    }
  }

  /* 阈值事件：由精力/金钱档位触发（P1-2）。数据件不放 data，归引擎管；
     靠 showEvent 的统一冷却（4~10 月）+ 每月 0.7 概率，不会每回合都来烦人。 */
  function thresholdEvents() {
    const mb = moneyBand(S.money);
    const out = [];
    const add = ev => {
      if (S.cd[ev.id] && S.cd[ev.id] > S.tick) return;
      if (S.energy < 1) return;
      out.push(ev);
    };

    if (S.energy <= 30) add({
      id: "th_hand_wrist", cat: "training", w: 12, once: false,
      text: "右手腕的旧伤又犯了：鼠标握久了会麻，晚上睡觉能疼醒。",
      sub: "队医看了一眼说，这不是休息两天能好的，但你下周还有比赛。",
      opts: [
        { t: "打封闭，先顶过去", eff: { energy: 12, PHYS: -5, MENTAL: -2 }, res: "针打进去的时候你咬着牙。手不麻了，但要到休赛期才能再碰它。", risk: null },
        { t: "减量训练，养两周", eff: { energy: -6, MECH: -2, GAME: 2 }, res: "你把加练砍了一半，每天只做手部理疗。教练没说什么，只是训练赛换了个人首发。", risk: null },
        { t: "不管，贴个膏药继续", eff: { MECH: 2, PHYS: -6, energy: -10 }, res: "膏药味飘满训练室。你练到凌晨，手腕在键盘上抖，但那一把盲僧 R 闪你是真踢出来了。", risk: null }
      ]
    });
    if (S.energy <= 18) add({
      id: "th_doctor_warning", cat: "team", w: 14, once: false,
      text: "队医把体检单拍在桌上：心率、睡眠、肌酸激酶，三项全红。",
      sub: "他说再这么练下去，你不是打不动了，是可能倒在电脑前面。",
      opts: [
        { t: "听队医的，强制休息", eff: { energy: 30, MECH: -3, morale: 4 }, res: "教练组给你批了三天假。你睡了二十个小时，醒来第一顿吃了两碗饭，觉得活着真好。", risk: null },
        { t: "先打完这个月再说", eff: { energy: -8, morale: -6, coach: -4 }, res: "你把体检单折起来塞进口袋。这个月你确实打完了，靠的是每天两罐红牛。", risk: null }
      ]
    });
    if (mb.key === "debt") add({
      id: "th_rent_debt", cat: "money", w: 16, once: false,
      text: "房东在门口等了你一晚上：这个月房租已经拖了十一天。",
      sub: "你卡里是负数。基地的灯还亮着，队友在打排位，没人知道你连话费都快交不起了。",
      opts: [
        { t: "先找队友借", eff: { money: 2, MENTAL: -4, TEAM: -2 }, res: "你开口的时候声音很小。他转了钱，说了句「什么时候有什么时候还」，再没提过。", risk: null },
        { t: "跟经理预支工资", eff: { money: 3, coach: -5 }, res: "经理把钱转给你，然后说了句：下个合同的数字，我可得好好算算了。", risk: null },
        { t: "先欠着，跟房东求情", eff: { MENTAL: -6, money: 0 }, res: "房东叹了口气说再给你半个月。你回房间坐在床边，第一次觉得打职业这件事有点丢人。", risk: null }
      ]
    });
    if (mb.key === "tight") add({
      id: "th_living_cost", cat: "money", w: 12, once: false,
      text: "工资到账，还完上个月的账，卡里只剩三位数。",
      sub: "外卖软件点开又关掉，最后你去了楼下食堂。",
      opts: [
        { t: "吃食堂，能省就省", eff: { money: .8, PHYS: -2, MENTAL: -2 }, res: "两荤一素十二块。你吃得很干净，连汤都喝了。", risk: null },
        { t: "请队友吃顿好的", eff: { money: -1.2, TEAM: 5, MENTAL: 3 }, res: "你刷了卡，说这个月赢了请你们吃更好的。没人知道你还欠着花呗。", risk: null },
        { t: "接个陪玩私单", eff: { money: 1.5, energy: -8, FAME: -2 }, res: "直播间里你喊了三个小时「老板好」。下播的时候手是酸的，钱是到账的。", risk: null }
      ]
    });
    if (mb.key === "rich" || mb.key === "capital") add({
      id: "th_brand_deal", cat: "media", w: 10, once: false,
      text: "一个能量饮料品牌找上门，报价六位数，条件是拍三支广告、穿他们的队服训练。",
      sub: "经理说这种机会一年就一次，但赞助商的拍摄会占掉你整个休赛日。",
      opts: [
        { t: "接了", eff: { money: 18, FAME: 5, energy: -10, MECH: -1 }, res: "你在绿幕前举着饮料笑了四十次。钱到账那天，你给家里换了台冰箱。", risk: null },
        { t: "只接线上露出", eff: { money: 6, FAME: 2, energy: -3 }, res: "你只在微博发了一条，配图是训练室的显示器。赞助商不太满意，但钱照付。", risk: null },
        { t: "不接，专心比赛", eff: { MECH: 2, GAME: 2, coachTrust: 4 }, res: "你把合同推回去。经理骂了你三天，教练在战术会上第一次说「这才是职业选手」。", risk: null }
      ]
    });
    if (mb.key === "capital") add({
      id: "th_capital_offer", cat: "market", w: 8, once: false,
      text: "一个投资人约你在基地楼下的咖啡厅见面：他想买下这支队伍，条件是让你做建队核心兼股东。",
      sub: "他说得很直白：钱我出，人你挑，但你得把职业生涯押在这支队伍上。",
      opts: [
        { t: "认真谈", eff: { money: 20, secret: 1, GAME: 2 }, res: "你听他讲了一个半小时的 BP 和估值。回去的路上你发现，自己居然开始认真考虑退役以后的事了。", risk: null },
        { t: "婉拒，我还想打", eff: { MENTAL: 4, FAME: 3 }, res: "你说等我拿了冠军再谈。他笑了，说这句话他听过很多次，但你是第一个说得让他信的。", risk: null }
      ]
    });
    return out;
  }

  /* ================= 事件 ================= */
  /* 队友互动事件：把 {mate} 换成队里随机一人的名字（不含自己） */
  function mateName() {
    try {
      const rows = myTeamRoster().filter(r => r && !r.mine && r.name);
      return rows.length ? pick(rows).name : "";
    } catch (e) { return ""; }
  }
  function fillEv(t) {
    if (typeof t !== "string") return t;
    const tm = teamOf(S.teamId) || {};
    return t.replace(/\{mate\}/g, S._mateName || "队友")
      .replace(/\{team\}/g, tm.name || "队伍")
      .replace(/\{pos\}/g, POSCN[S.pos] || S.pos || "")
      .replace(/\{coach\}/g, "教练")
      .replace(/\{opp\}/g, S.lastOpp || "对面");
  }
  function evFill(ev) {
    const out = Object.assign({}, ev);
    out.text = fillEv(ev.text);
    out.sub = ev.sub ? fillEv(ev.sub) : ev.sub;
    out.opts = (ev.opts || []).map(o => Object.assign({}, o, {
      t: fillEv(o.t), res: fillEv(o.res || ""),
      risk: o.risk ? Object.assign({}, o.risk, { ok: fillEv(o.risk.ok || ""), fail: fillEv(o.risk.fail || "") }) : null
    }));
    return out;
  }
  /* 事件门槛：除了老的 req，还支持黑粉/粉丝/话语权/心情/教练/地位/赛季/年龄/模式/队伍档位/剧情计数 */
  function reqOk(ev) {
    const r = ev.req || {};
    const story = S.story || {};
    for (const k in r) {
      const v = r[k];
      if (k === "pos") { if (v.indexOf(S.pos) < 0) return false; continue; }
      if (k === "stage") { if (v.indexOf(S.stage) < 0) return false; continue; }
      if (k === "minStat" || k === "maxStat") {
        let ok = true;
        for (const sk in v) if (k === "minStat" ? S.st[sk] < v[sk] : S.st[sk] > v[sk]) ok = false;
        if (!ok) return false;
        continue;
      }
      if (k === "minEnergy" && S.energy < v) return false;
      if (k === "maxEnergy" && S.energy > v) return false;
      if (k === "minMoney" && S.money < v) return false;
      if (k === "maxMoney" && S.money > v) return false;
      if (k === "minFans" && S.fans < v) return false;
      if (k === "maxFans" && S.fans > v) return false;
      if (k === "minHaters" && (S.haters || 0) < v) return false;
      if (k === "maxHaters" && (S.haters || 0) > v) return false;
      if (k === "minVoice" && voice() < v) return false;
      if (k === "maxVoice" && voice() > v) return false;
      if (k === "minMorale" && S.morale < v) return false;
      if (k === "maxMorale" && S.morale > v) return false;
      if (k === "minCoachTrust" && S.coachTrust < v) return false;
      if (k === "maxCoachTrust" && S.coachTrust > v) return false;
      if (k === "minTeamStatus" && S.teamStatus < v) return false;
      if (k === "maxTeamStatus" && S.teamStatus > v) return false;
      if (k === "minSeason" && S.season < v) return false;
      if (k === "maxSeason" && S.season > v) return false;
      if (k === "minAge" && S.age < v) return false;
      if (k === "maxAge" && S.age > v) return false;
      if (k === "mode" && v !== (S.endless ? "endless" : "three")) return false;
      if (k === "teamTier") { const tt = (teamOf(S.teamId) || {}).tier; if (!v || v.indexOf(tt) < 0) return false; }
      if (k === "notFlag" && S.flags[v]) return false;
      if (k === "flag" && !S.flags[v]) return false;
      if (k === "storyMin") { for (const sk in v) if ((story[sk] || 0) < v[sk]) return false; }
      if (k === "storyMax") { for (const sk in v) if ((story[sk] || 0) > v[sk]) return false; }
    }
    if (ev.mate) {
      try { if (!myTeamRoster().some(p => p && !p.mine)) return false; } catch (e) { return false; }
    }
    return true;
  }
  /* 剧情链「终点能直接结束职业生涯」的事件（events_v3 的假赛/代打链）：LDL 新手赛季不进随机池，
     由 next/测试注入的显式事件不受影响（repair_check story.endings 仍可达） */
  let _endChainIds = null;
  function endingChainIds() {
    if (_endChainIds) return _endChainIds;
    _endChainIds = {};
    try {
      const all = {};
      D.events().forEach(e => { if (e && e.id) all[e.id] = e; });
      const hasEnd = e => !!(e && (e.ending || (e.opts || []).some(o => o && o.ending)));
      const reachEnding = (id, seen) => {
        if (!id || seen[id]) return false;
        seen[id] = 1;
        const e = all[id];
        if (!e) return false;
        if (hasEnd(e)) return true;
        const nxt = [];
        if (e.next && e.next.id) nxt.push(e.next.id);
        (e.opts || []).forEach(o => { if (o && o.next && o.next.id) nxt.push(o.next.id); });
        return nxt.some(n => reachEnding(n, seen));
      };
      Object.keys(all).forEach(id => { if (reachEnding(id, {})) _endChainIds[id] = 1; });
    } catch (e) { }
    return _endChainIds;
  }

  function eventPool() {
    const out = [];
    const recent = S.evRecent || [];
    const mates = {};
    try { myTeamRoster().forEach(r => { if (r && r.id) mates[r.id] = 1; }); } catch (e) { }
    for (const ev of D.events()) {
      if (!ev || !ev.id) continue;
      if (ev.chain) continue;                                       // 剧情链后续步骤只由 next 触发
      if (S.stage === "LDL" && !S.endless && endingChainIds()[ev.id]) continue; // 新手赛季不让开局故事线直接终结生涯
      if (ev.who && !mates[ev.who]) continue;                        // 指定选手不在队里
      if (ev.once && S.flags["f_" + ev.id]) continue;
      if (S.cd[ev.id] && S.cd[ev.id] > S.tick) continue;
      if (ev.yearMin && S.season < ev.yearMin) continue;
      if (ev.year) {
        // 三年模式：严格按年份放；无尽模式：过了那一年就一直留在池子里（配合冷却，不会连着重复）
        if (S.endless) { if (S.season < ev.year) continue; }
        else if (ev.year !== S.season) continue;
      }
      if (ev.months && ev.months.length && ev.months[0] !== 0 && ev.months.indexOf(S._ml.month) < 0) continue;
      if (!ev.once && recent.indexOf(ev.id) >= 0) continue;          // 最近 12 条不再抽
      if (!reqOk(ev)) continue;
      out.push(ev);
    }
    /* 阈值事件：随精力/金钱档位出现 */
    for (const tev of thresholdEvents()) out.push(tev);
    return out;
  }

  /* 文案变体：res 可以是字符串，也可以是字符串数组，选中哪句看运气 */
  function pickVar(v) {
    if (Array.isArray(v)) return v.length ? pick(v) : "";
    return v || "";
  }
  /* 这组选项总体上赚了还是亏了：赚→回声走好话池，亏→走坏话池 */
  function effSign(eff) {
    if (!eff || typeof eff !== "object") return 0;
    let s = 0;
    for (const k in eff) {
      const v = eff[k];
      if (typeof v === "number" && isFinite(v)) {
        const w = k === "energy" ? .35 : k === "money" ? .06 : k === "ticket" ? .3 : 1;
        s += v * w;
      } else if (k === "story" && v && typeof v === "object") {
        for (const sk in v) if (BAD_STORY.indexOf(sk) >= 0) s -= (v[sk] || 0) * 2;
      }
    }
    return s > 1.5 ? 1 : s < -1.5 ? -1 : 0;
  }
  function flavorLine(cat, sign) {
    const F = window.DATA_FLAVOR || {};
    const bag = sign > 0 ? F.good : sign < 0 ? F.bad : F.flat;
    if (!bag) return "";
    const arr = (cat && bag[cat] && bag[cat].length) ? bag[cat] : (bag.general || []);
    return arr.length ? pick(arr) : "";
  }
  const BAD_STORY = ["corrupt", "scandal", "secret", "banned", "blood", "stalker", "injury"];
  /* 隐藏线/黑线结局门槛：无尽长局里不能随便撞见——banned 要有前科（corrupt≥25），
     blood 要黑粉≥8000，stalker 要黑粉≥5000；普通三年模式保持原样（repair_check 的 story.endings 走 three） */
  function hiddenLineGate(kind) {
    if (!(S.mode === "endless" || S.endless)) return true;
    if (kind === "banned") return (S.story.corrupt || 0) >= 25;
    if (kind === "blood") return (S.haters || 0) >= 25000 && (S.story.corrupt || 0) >= 15;
    if (kind === "stalker") return (S.haters || 0) >= 12000;
    return true;
  }

  function checkEvent() {
    if (S.pending.length) {
      const id = S.pending.shift();
      const ev = D.events().find(e => e.id === id);
      if (ev) return showEvent(ev);
    }
    const pool = eventPool();
    if (pool.length) {
      /* 一个月最多两件事：第一件 72%，第二件 34%。事件多了，肉鸽味才出得来 */
      const n = M.evCount || 0;
      if (n < 2 && chance(n === 0 ? .72 : .34)) {
        M.evCount = n + 1;
        return showEvent(wpick(pool, e => e.w || 10));
      }
    }
    return phase();
  }

  /* 事件链的 flag 消费（events.js/lck.js 里大量 next:{flag:"f_xxx"}，只 push id 不落旗会断链）+ 进 LCK 的唯一真源 S.lck */
  function applyNextFlags(ev, o) {
    [ev && ev.next, o && o.next].forEach(n => { if (n && n.flag) S.flags[n.flag] = 1; });
    if (S.flags.f_lck_go || S.flags.lck_go) {
      if (!S.lck) S.lck = { went: true, teamId: S.teamId, year: S.season || 1, champion: false };
      else { S.lck.went = true; if (!S.lck.teamId) S.lck.teamId = S.teamId; }
    }
  }

  function showEvent(ev0) {
    /* {mate} 占位符：真正挑一名队友，写 S._matePid / _mateName，后续 fillEv 统一替换 */
    if (ev0.mate || (typeof ev0.text === "string" && ev0.text.indexOf("{mate}") >= 0)) {
      ensureMates();
      const mm = (S._matePid && S.mates && S.mates[S._matePid]) ? { pid: S._matePid, name: S.mates[S._matePid].name } : matePick();
      if (mm) { S._matePid = mm.pid; S._mateName = mm.name; }
      else S._mateName = mateName();
    }
    /* 自动托管（2 档）：只保留 market/match/drama 或带 risk 的重要事件，其余按第一个选项结算并标「（托管）」 */
    if (autoLevel() >= 2) {
      const important = !!ev0.risk || !!ev0.important || ["market", "match", "drama"].indexOf(ev0.cat) >= 0;
      if (!important) {
        const evA = evFill(ev0), oA = (evA.opts || [])[0] || { eff: {}, res: "你让经纪人说“下次再说”。" };
        S.flags["f_" + evA.id] = true;
        S.cd[evA.id] = S.tick + rint(6, 14);
        S.evRecent = S.evRecent || [];
        if (S.evRecent.indexOf(evA.id) < 0) S.evRecent.push(evA.id);
        while (S.evRecent.length > 12) S.evRecent.shift();
        applyEff(oA.eff);
        applyNextFlags(evA, oA);
        if (!evA.ending && !oA.ending) {
          if (evA.next && evA.next.id) S.pending.push(evA.next.id);
          if (oA.next && oA.next.id) S.pending.push(oA.next.id);
        }
        const endReasonA = evA.ending || oA.ending || "";
        const blockedA = !!endReasonA && !hiddenLineGate(endReasonA);
        const afterA = blockedA ? () => (S.pending.length ? checkEvent() : phase())
          : evA.ending ? () => ending(evA.ending)
          : oA.ending ? () => ending(oA.ending)
            : () => {
              if (S._matePending) { const ev3 = mateStep3Event(); if (ev3) return showEvent(ev3); }
              return S.pending.length ? checkEvent() : phase();
            };
        return result((evA.title || "场外") + "（托管）",
          (pickVar(oA.res) || "") + "\n\n（托管：这件事没到要你亲自决定的分量，你的经纪人替你回了。）", "story", afterA);
      }
    }
    const ev = evFill(ev0);
    return scene({
      type: "event", ev,
      pick(i) {
        const o = ev.opts[i];
        S.flags["f_" + ev.id] = true;
        S.cd[ev.id] = S.tick + rint(6, 14);
        S.evRecent = S.evRecent || [];
        if (S.evRecent.indexOf(ev.id) < 0) S.evRecent.push(ev.id);
        while (S.evRecent.length > 12) S.evRecent.shift();
        applyEff(o.eff);
        applyNextFlags(ev, o);
        let extra = "", good = false;
        if (o.risk) {
          const st = S.st[o.risk.stat] || 50;
          const roll = rint(1, 20) + Math.floor((st - 50) / 5) + Math.floor((S.morale - 50) / 12);
          if (roll >= (o.risk.dc || 12)) {
            good = true;
            extra = "【判定成功】" + (pickVar(o.risk.ok) || "你赌对了。");
            applyEff(o.risk.bonus || {});
            S.morale = clamp(S.morale + 6, 0, 100); S.burst = clamp(S.burst + 10, 0, 100);
          } else {
            extra = "【判定失败】" + (pickVar(o.risk.fail) || "事与愿违。");
            S.morale = clamp(S.morale - 8, 0, 100);
          }
        }
        /* 剧情链：下一步立刻接上，中间不插别的事件，避免前因后果断掉 */
        if (!ev.ending && !o.ending) {
          if (ev.next && ev.next.id) S.pending.push(ev.next.id);
          if (o.next && o.next.id) S.pending.push(o.next.id);
        }
        /* 选项后的回声：同一选择不总是同一句话 */
        let echo = "";
        if (!ev.chain && !ev.noEcho) {
          let sign = effSign(o.eff);
          if (o.risk) sign = good ? Math.max(sign, 1) : Math.min(sign, -1);
          echo = flavorLine(ev.cat, sign);
        }
        const body = [pickVar(o.res)].filter(Boolean).join("\n\n")
          + (extra ? "\n\n" + extra : "")
          + (echo ? "\n\n" + echo : "");
        /* 隐藏结局门槛：无尽模式没到条件就压下去（banned 记 scandal+6），不直接进结局 */
        const endReason = ev.ending || o.ending || "";
        const endBlocked = !!endReason && !hiddenLineGate(endReason);
        const after = endBlocked ? () => (S.pending.length ? checkEvent() : phase())
          : ev.ending ? () => ending(ev.ending)
          : o.ending ? () => ending(o.ending)
            : () => {
              /* 队友线第 3 步：立刻接三选一事件，不拖到下个月 */
              if (S._matePending) { const ev3 = mateStep3Event(); if (ev3) return showEvent(ev3); }
              return S.pending.length ? checkEvent() : phase();
            };
        return result(ev.title || "场外", body + (endBlocked ? "\n\n（这事被压下去了。联盟那边有人给你递了句话：别再往前走了。）" : ""), "story", after);
      }
    });
  }

  /* 事件 eff.POOL（数据里 50 处，POOL:1/2）的语义是「英雄池 +N 个英雄」，不是数值：补本位置、还不在池里的英雄，确定性取、去重、上限 15 */
  function addPoolHeroes(n) {
    const cnt = Math.max(0, Math.round(n) || 0);
    if (!cnt) return [];
    const cap = 15;
    if (Object.keys(S.pool || {}).length >= cap) return [];
    const heroes = (window.DATA_HEROES || []).filter(h => h && h.n && (h.pos || []).indexOf(S.pos) >= 0 && S.pool[h.n] === undefined);
    const picked = [];
    for (let i = 0; i < cnt && heroes.length; i++) {
      const h = heroes.splice(Math.floor(rnd() * heroes.length), 1)[0];
      if (!h) break;
      S.pool[h.n] = clamp(rint(38, 58), 0, 99);
      picked.push(h.n);
    }
    if (picked.length) S.timeline.push({ t: S.tick, text: "英雄池 +" + picked.length + "：" + picked.join("、") });
    return picked;
  }
  function applyEff(eff) {
    if (!eff) return;
    const diff = DIFFS[S.diff] || DIFFS.normal;
    /* 心理护盾：负面心态事件（MENTAL / 心情）首次伤害减半，用掉一层 */
    const shield = () => {
      if (S.invest && S.invest.mentalShield > 0) { S.invest.mentalShield--; return true; }
      return false;
    };
    for (const k in eff) {
      let v = eff[k];
      /* 队友关系：mateAff（±5~15 改 aff）/ mateLine（推进线）/ mateDone（三选一结果） */
      if (k === "mateAff" || k === "mateLine" || k === "mateDone") { applyMateEff(k, v); continue; }
      if (k === "story" && v && typeof v === "object") {
        for (const sk in v) {
          /* 隐藏线门槛：不够格就不落 flag，banned 改成 scandal+6 留个污点 */
          if (["banned", "blood", "stalker"].indexOf(sk) >= 0 && !hiddenLineGate(sk)) {
            if (sk === "banned") S.story.scandal = clamp((S.story.scandal || 0) + 6, 0, 99);
            continue;
          }
          S.story[sk] = clamp((S.story[sk] || 0) + v[sk], 0, 99);
        }
        continue;
      }
      if (typeof v !== "number" || !isFinite(v)) continue;
      /* 事件直写故事线的四种写法（events_pos.js 里散着写）：归一到 story */
      if (k === "corrupt" || k === "justice" || k === "scandal" || k === "secret") {
        S.story[k] = clamp((S.story[k] || 0) + v, 0, 99);
        continue;
      }
      /* FAME：数据里 444 处，口径 = 状态表 S.st.FAME（0..100 名气），不是新的顶层字段 */
      if (k === "FAME" || k === "fame") {
        if (v < 0) v *= diff.bad;
        S.st.FAME = clamp((S.st.FAME || 0) + v, 0, 100);
        continue;
      }
      /* POOL：数据里 50 处，语义是英雄池数量（见 addPoolHeroes），不走 STATS 数值 */
      if (k === "POOL") { addPoolHeroes(v); continue; }
      if (v < 0) v *= diff.bad;
      if (STATS.indexOf(k) >= 0) {
        /* 事件里的心态负值整体 ×0.7（qa-verify：三个系统叠加后心态长期贴地），单次最多 −6 */
        if (k === "MENTAL" && v < 0) v = Math.max(v * .7, -6);
        if (k === "MENTAL" && v < 0 && shield()) v *= .5;
        S.st[k] = clamp(S.st[k] + v, 0, S.pot);
      }
      else if (k === "energy") S.energy = clampEnergy(S.energy + v);
      else if (k === "morale") {
        if (v < 0) v = Math.max(v * .7, -8);
        if (v < 0 && shield()) v *= .5;
        S.morale = clamp(S.morale + v, 0, 100);
      }
      else if (k === "spirit") S.spirit = clamp((S.spirit || 60) + v, 0, 100);
      else if (k === "money") { S.money = clamp(S.money + v, -999, 99999); markDebt(); }
      else if (k === "coach") S.coachTrust = clamp(S.coachTrust + v, 0, 100);
      else if (k === "status") S.teamStatus = clamp(S.teamStatus + v, 0, 100);
      else if (k === "fans") S.fans = Math.max(0, S.fans + v);
      else if (k === "haters") S.haters = Math.max(0, S.haters + v);
      else if (k === "burst") S.burst = clamp(S.burst + v, 0, 100);
      else if (k === "injury") S.inj = clamp(S.inj + v / 100, 0, .8);
      else if (k === "hupu") S.hupu = clamp(S.hupu + v, 0, 10);
      else if (k === "ticket") S.ticket = Math.max(0, (S.ticket || 0) + v);
    }
  }

  /* ================= 赛程：2025 现实赛制（三赛段 + 先锋赛 + MSI + 世界赛） ================= */
  const SPLIT_NAME = { 1: "第一赛段", 2: "第二赛段", 3: "第三赛段" };

  function phase() {
    /* 进赛事就不再是月初存档点（P0-5 读档防刷） */
    M.atMonthStart = false;
    const m = S._ml.month;
    /* LDL 没有国际赛，走自己的赛历：三赛段 + LDL 杯赛 + 德杯（P1-4） */
    if (S.stage === "LDL") return ldlMonth(m);
    if (m === 1 || m === 4 || m === 7) {
      /* 赛段切换：上赛段买的数据 ban 位只在当赛段有效（P1-10） */
      if (S.invest) S.invest.banPlusSplit = 0;
      M.reg = { w: 0, l: 0 }; return matchMonth();
    }
    if (m === 2) return playoffMonth(1);
    if (m === 5) return playoffMonth(2);
    if (m === 8) return playoffMonth(3);
    if (m === 3) return intlMonth("firststand");
    if (m === 6) return intlMonth("msi");
    if (m === 9) return worldsSwiss();
    if (m === 10) return worldsKnockout();
    if (m === 11) return allStarMonth();
    if (m === 12) return transferMonth();
    return monthEnd();
  }

  /* ================= LDL 赛历（P1-4） =================
   * 1/4/7 常规赛、2/5/8 季后赛、3/6/9/10 杯赛、11 德玛西亚杯、12 转会。
   * 以前 3/6/9/10 是「点一下继续」，LDL 的十二个月都得有事做。
   */
  const LDL_EVENTS = {
    3: { name: "LDL 新秀赛", bestOf: 3, sub: "联盟把各队的青训凑在一起打一天。看台上坐着几个 LPL 的星探，他们不记笔记，只记名字。" },
    6: { name: "LDL 夏季邀请赛", bestOf: 3, sub: "四支 LDL 队打一个周末。赢了有奖金，输了也没人记得——除了你自己。" },
    9: { name: "LDL 年度总决赛 · 半决赛", bestOf: 5, sub: "LDL 的年度总决赛。场馆是租的，灯光是借的，但这一场会被写进你的履历。" }
  };
  function ldlTeams() { return allTeams().filter(t => t.region === "LDL"); }
  function ldlOpp(rank) {
    const list = oppList().slice().sort((a, b) => teamPower(b.id) - teamPower(a.id));
    if (!list.length) return { id: null, name: "LDL 联队" };
    return list[clamp(rank, 0, list.length - 1)];
  }
  function ldlMonth(m) {
    const month = m || (S._ml && S._ml.month) || 1;
    if (month === 1 || month === 4 || month === 7) {
      if (S.invest) S.invest.banPlusSplit = 0;
      M.reg = { w: 0, l: 0 }; return matchMonth();
    }
    if (month === 2) return playoffMonth(1);
    if (month === 5) return playoffMonth(2);
    if (month === 8) return playoffMonth(3);
    if (month === 3 || month === 6 || month === 9 || month === 10) return ldlEventMonth(month);
    if (month === 11) return demaciaMonth();
    if (month === 12) return transferMonth();
    return monthEnd();
  }
  function ldlRecord(month, name, win, score) {
    S.record.ldl = S.record.ldl || [];
    S.record.ldl.push({ year: S._ml.year, month: month, name: name, win: !!win, score: score || "" });
    if (S.record.ldl.length > 30) S.record.ldl.shift();
  }
  function ldlEventMonth(month) {
    const year = S._ml.year;
    let cfg = LDL_EVENTS[month] || LDL_EVENTS[3];
    let finalGame = false;
    let oppT;
    if (month === 10) {
      const semi = (S.record.ldl || []).filter(x => x.year === year && x.month === 9)[0];
      finalGame = !!(semi && semi.win);
      cfg = finalGame
        ? { name: "LDL 年度总决赛 · 决赛", bestOf: 5, sub: "决赛。赢了就是 LDL 年度总冠军，明年 LPL 的星探会先看你的录像。" }
        : { name: "LDL 年度总决赛 · 季军赛", bestOf: 3, sub: "半决赛输了，还有一场季军赛。没人会记住第三名，但输球的感觉会跟着你到明年。" };
      oppT = ldlOpp(finalGame ? 0 : 1);
    } else {
      oppT = ldlOpp(month === 9 ? 0 : month === 6 ? 1 : 2);
    }
    const oppName = oppT.name || "LDL 联队";
    return scene({
      type: "event",
      ev: {
        id: "ldl_" + month, cat: "LDL", title: cfg.name,
        text: `${year} 年 ${month} 月，${cfg.name}。`,
        sub: `${cfg.sub || ""}\n对手：${oppName}，BO${cfg.bestOf}。`,
        opts: [{ t: `亲自打（BO${cfg.bestOf}）` }, { t: "让教练组模拟结果" }]
      },
      pick(i) {
        if (i === 1) return ldlEventSim(month, cfg, oppT, finalGame);
        M.series = {
          g: 0, wins: 0, losses: 0, bestOf: cfg.bestOf, step: 0, mom: 0, log: [],
          title: cfg.name, kind: "ldl", ldl: true, ldlMonth: month, ldlFinal: finalGame,
          opp: { id: oppT.id, name: oppName }, oppId: oppT.id, oppName: oppName,
          oppTendency: ({ 体系: "运营", 铁腕: "团战", 放养: "单带" }[(teamOf(oppT.id) || {}).coachStyle] || "运营")
        };
        M.form = 3 + Math.floor(month / 3);
        return result(cfg.name, `${oppName}。${cfg.bestOf === 3 ? "BO3，三局两胜。" : "BO5，五局三胜。"}LDL 的直播只有三千人看，但其中可能有一个是 LPL 的经理。`, "info", () => seriesGame(oppT));
      }
    });
  }
  function ldlEventSim(month, cfg, oppT, finalGame) {
    const oppName = oppT.name || "LDL 联队";
    const mine = mySide(autoHero(), "ope");
    const theirs = theirSide(oppT.id, "", "运营");
    const bo = MATCH.simBo(mine, theirs, { bestOf: cfg.bestOf, dim: "GAME", rnd: rnd, patchBuffs: patchMap() });
    const win = !!bo.win;
    const score = bo.w + "-" + bo.l;
    ldlRecord(month, cfg.name, win, score);
    S.energy = clamp(S.energy - (cfg.bestOf === 5 ? 14 : 8), 0, 100);
    if (win) {
      S.morale = clamp(S.morale + 5, 0, 100);
      S.st.FAME = clamp(S.st.FAME + 1, 0, 98);
      S.fans += rint(2000, 8000);
      S.money = Math.round((S.money + (cfg.bestOf === 5 ? 15 : 6)) * 10) / 10;
      if (finalGame) {
        S.record.titles.push("LDL 年度总冠军");
        S.timeline.push({ t: S.tick, text: "LDL 年度总冠军" });
      }
    } else S.morale = clamp(S.morale - 5, 0, 100);
    return result(cfg.name + (win ? " · 拿下" : " · 输了"),
      win ? `${score}，${oppName} 被你们按住了。教练在群里发了一句「可以」，这是他今年第一次夸人。`
        : `${score}，输给 ${oppName}。你在回基地的大巴上戴着耳机，看窗外的高架桥一盏一盏往后跑。`,
      win ? "win" : "lose", () => monthEnd());
  }
  /* LDL 杯赛打完（finishGame 分流过来，不走赛段季后赛那套记账） */
  function ldlAfterSeries(bo) {
    const won = bo.wins >= Math.ceil((bo.bestOf || 3) / 2);
    const name = bo.title || "LDL 赛事";
    const oppName = bo.oppName || "对手";
    ldlRecord(bo.ldlMonth || 0, name, won, bo.wins + "-" + bo.losses);
    if (won) {
      S.morale = clamp(S.morale + 6, 0, 100);
      S.coachTrust = clamp(S.coachTrust + 4, 0, 100);
      S.st.FAME = clamp(S.st.FAME + 2, 0, 98);
      S.fans += rint(4000, 12000);
      S.money = Math.round((S.money + 12) * 10) / 10;
      if (bo.ldlFinal) {
        S.record.titles.push("LDL 年度总冠军");
        S.timeline.push({ t: S.tick, text: "LDL 年度总冠军" });
      }
      return result(name + " · 拿下", `${bo.wins}:${bo.losses}，赢下 ${oppName}。LDL 的奖杯很小，你举起来的时候还是拍了照，发给了家里人。`, "win", () => monthEnd());
    }
    S.morale = clamp(S.morale - 6, 0, 100);
    return result(name + " · 输了", `${bo.wins}:${bo.losses}，输给 ${oppName}。回基地的路上没人说话，教练把录像拷给了每个人。`, "lose", () => monthEnd());
  }

  /* ================= 十一月：德玛西亚杯（LDL 的年度出口，P1-4） =================
   * 8 支 LDL + 4 支 LPL 二队/青训：BO3 小组单循环，每组前二 + 两个最好第三进八强，BO5 淘汰。
   * 小组赛按实力模拟，淘汰赛玩家自己打（BO5 走正常 BP 流程）。
   */
  function demaciaField() {
    const field = [];
    const push = t => {
      if (!t || !t.id || field.some(x => x.id === t.id)) return;
      field.push({ id: t.id, name: t.name, power: Math.round(teamPower(t.id)), mine: t.id === S.teamId, w: 0, l: 0 });
    };
    ldlTeams().forEach(push);
    const lpl = allTeams().filter(t => t.region === "LPL").sort((a, b) => teamPower(a.id) - teamPower(b.id));
    lpl.slice(0, 4).forEach(push);
    push(teamOf(S.teamId));
    const rest = allTeams().filter(t => !field.some(x => x.id === t.id) && t.region !== "LDL");
    let k = 0;
    while (field.length < 12 && k < rest.length) push(rest[k++]);
    return field.slice(0, 12);
  }
  function demaciaBo(a, b, need) {
    const pa = MATCH.sig((a.power - b.power) + (rnd() - .5) * 8, 9);
    let wa = 0, wb = 0;
    while (wa < need && wb < need) { if (rnd() < pa) wa++; else wb++; }
    return { wa: wa, wb: wb, winA: wa > wb, score: wa + "-" + wb };
  }
  function demaciaMonth() {
    /* LPL 一线队不打德杯，十一月还是全明星 */
    if (S.stage !== "LDL") return allStarMonth();
    const year = S._ml.year;
    const field = demaciaField();
    const sorted = field.slice().sort((a, b) => b.power - a.power);
    const groups = [[], [], []];
    sorted.forEach((t, i) => groups[i % 3].push(t));
    groups.forEach(g => {
      for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) {
        const A = g[i], B = g[j];
        const r = demaciaBo(A, B, 2);
        if (r.winA) { A.w++; B.l++; } else { B.w++; A.l++; }
      }
    });
    const me = field.filter(f => f.id === S.teamId)[0] || { w: 0, l: 0 };
    const ranked = groups.map(g => g.slice().sort((a, b) => (b.w - a.w) || (b.power - a.power)));
    const adv = [];
    ranked.forEach(g => g.slice(0, 2).forEach(t => adv.push(t)));
    const thirds = ranked.map(g => g[2]).filter(Boolean).sort((a, b) => (b.w - a.w) || (b.power - a.power));
    thirds.slice(0, 2).forEach(t => adv.push(t));
    const q = adv.sort((a, b) => (b.w - a.w) || (b.power - a.power)).slice(0, 8);
    const qualified = q.some(x => x.id === S.teamId);
    S.record.demacia = { year: year, groupWins: me.w || 0, groupLosses: me.l || 0, place: qualified ? 99 : 9, wins: 0 };
    M.dem = { field: field, bracket: qualified ? { qf: MATCH.seedBracket(q), sf: null, f: null, round: 1 } : null, wins: 0, place: 0 };
    const grpText = `小组赛（BO3 单循环）打完，你们 ${me.w}-${me.l}。`;
    if (!qualified) {
      S.record.demacia.place = 9 + rint(0, 3);
      S.morale = clamp(S.morale - 8, 0, 100);
      S.timeline.push({ t: S.tick, text: "德玛西亚杯小组出局" });
      M.dem = null;
      return result("德玛西亚杯 · 小组出局", `${grpText}八强名单里没有你们。看台上的人提前走了，你把外设收进包里，拉链拉了三次才拉上。`, "lose", () => monthEnd());
    }
    const qf = (M.dem.bracket.qf || []).filter(p => (p.a && p.a.id === S.teamId) || (p.b && p.b.id === S.teamId))[0];
    const foe = qf ? (qf.a.id === S.teamId ? qf.b : qf.a) : null;
    S.timeline.push({ t: S.tick, text: "德玛西亚杯八强" });
    return result("德玛西亚杯 · 小组出线", `${grpText}八强对手 ${foe ? foe.name : "待定"}，BO5。这是 LDL 一年里唯一一次被所有人看见的机会。`, "win", () => demaciaNextRound());
  }
  function demaciaNextRound() {
    const d = M.dem;
    if (!d || !d.bracket) return monthEnd();
    const br = d.bracket;
    const rn = br.round;
    const pairs = rn === 1 ? br.qf : rn === 2 ? br.sf : br.f;
    if (!pairs || !pairs.length) return monthEnd();
    let myIdx = -1;
    pairs.forEach((p, i) => { if (p && ((p.a && p.a.id === S.teamId) || (p.b && p.b.id === S.teamId))) myIdx = i; });
    if (myIdx < 0) return monthEnd();
    const myPair = pairs[myIdx];
    const foe = myPair.a.id === S.teamId ? myPair.b : myPair.a;
    const done = [];
    pairs.forEach((p, i) => {
      if (i === myIdx || !p || !p.a || !p.b) return;
      const r = demaciaBo(p.a, p.b, 3);
      done.push({ idx: i, win: r.winA ? p.a : p.b, score: r.score });
    });
    const rname = ["八强", "四强", "决赛"][clamp(rn - 1, 0, 2)];
    M.series = {
      g: 0, wins: 0, losses: 0, bestOf: 5, step: 0, mom: 0, log: [],
      title: "德玛西亚杯 · " + rname, kind: "demacia", bo: true,
      opp: { id: foe.id, name: foe.name }, oppId: foe.id, oppName: foe.name,
      oppTendency: ({ 体系: "运营", 铁腕: "团战", 放养: "单带" }[(teamOf(foe.id) || {}).coachStyle] || "运营"),
      _demRound: rn, _demIdx: myIdx, _demDone: done
    };
    M.form = 3 + rn;
    return result("德玛西亚杯 · " + rname, `BO5，对手 ${foe.name}。${rn === 3 ? "决赛。场馆里有一半人是来看 LPL 二队的，但冠军奖杯上会刻你们的名字。" : "赢了进下一轮，输了今年就到这里。"}`, "info", () => seriesGame(foe));
  }
  /* 德杯淘汰赛一场 BO5 打完（finishGame 分流过来） */
  function demaciaAfterSeries(bo) {
    const d = M.dem;
    if (!d || !d.bracket) return monthEnd();
    const br = d.bracket;
    const rn = bo._demRound || br.round;
    const won = bo.wins >= Math.ceil((bo.bestOf || 5) / 2);
    const rname = ["八强", "四强", "决赛"][clamp(rn - 1, 0, 2)];
    const rec = S.record.demacia || { groupWins: 0, groupLosses: 0 };
    const me = d.field.filter(f => f.id === S.teamId)[0] || { id: S.teamId, name: (teamOf(S.teamId) || {}).name || "我的队", power: Math.round(myTeamPower()) };
    if (!won) {
      const place = rn === 1 ? 5 + rint(0, 3) : rn === 2 ? 3 : 2;
      S.record.demacia = { year: S._ml.year, groupWins: rec.groupWins || 0, groupLosses: rec.groupLosses || 0, place: place, wins: d.wins || 0 };
      S.morale = clamp(S.morale - 10, 0, 100);
      S.timeline.push({ t: S.tick, text: "德玛西亚杯止步" + rname });
      M.dem = null;
      return result("德玛西亚杯 · 止步" + rname, `${bo.wins}:${bo.losses}，输给 ${bo.oppName}。德杯第 ${place} 名。你在场馆外站了一会儿，看别人举奖杯，然后回酒店收拾行李。`, "lose", () => monthEnd());
    }
    d.wins = (d.wins || 0) + 1;
    const pairs = rn === 1 ? br.qf : rn === 2 ? br.sf : br.f;
    const winners = [];
    const done = bo._demDone || [];
    (pairs || []).forEach((p, i) => {
      if (i === (bo._demIdx || 0)) { winners.push(me); return; }
      const dn = done.filter(x => x.idx === i)[0];
      winners.push(dn ? dn.win : (p && p.a && p.a.id === S.teamId ? p.b : (p ? p.a : null)));
    });
    if (rn === 1) {
      br.sf = [];
      for (let i = 0; i < winners.length; i += 2) if (winners[i] && winners[i + 1]) br.sf.push({ a: winners[i], b: winners[i + 1] });
      br.round = 2;
    } else if (rn === 2) {
      br.f = [{ a: winners[0], b: winners[1] }];
      br.round = 3;
    } else {
      S.record.demacia = { year: S._ml.year, groupWins: rec.groupWins || 0, groupLosses: rec.groupLosses || 0, place: 1, wins: d.wins };
      S.record.titles.push("德玛西亚杯冠军");
      S.st.FAME = clamp(S.st.FAME + 8, 0, 98);
      S.fans += rint(20000, 60000);
      S.burst = 100;
      S.morale = clamp(S.morale + 14, 0, 100);
      prize("split");
      S.timeline.push({ t: S.tick, text: "德玛西亚杯冠军" });
      M.dem = null;
      return result("德玛西亚杯冠军", `${bo.wins}:${bo.losses}，你们捧起了德杯。奖杯不大，但你在上面看见了自己的倒影——比三年前那个在 LDL 基地吃泡面的人清楚了。`, "win", () => monthEnd());
    }
    return result("德玛西亚杯 · " + rname + "晋级", `${bo.wins}:${bo.losses}，淘汰 ${bo.oppName}。下一轮对手还没打完，教练已经在白板上画线了。`, "win", () => demaciaNextRound());
  }

  function regionOf() { return S.stage === "LDL" ? "LDL" : "LPL"; }
  function allTeams() { const T = D.teams(); return Object.keys(T).map(id => Object.assign({ id: id }, T[id])); }
  function regionTeams() { const r = regionOf(); return allTeams().filter(t => t.region === r); }
  function oppList() { return regionTeams().filter(t => t.id !== S.teamId); }
  function findTeam(name) {
    const t = allTeams().find(x => x.name === name);
    return t || { name: name, id: null, region: "LCK", tier: "S", vibe: 68, coachStyle: "体系", color: "#777" };
  }

  function splitPlace(n) {
    const row = (S.record.splits || []).filter(x => x.year === S._ml.year && x.split === "S" + n)[0];
    return row ? (row.place || 99) : 99;
  }
  function splitLabel(n) { return (S.stage === "LDL" ? "LDL " : "LPL ") + SPLIT_NAME[n]; }

  /* ================= 常规赛 ================= */
  function gradeOf(perf) { return perf >= 82 ? "S" : perf >= 70 ? "A" : perf >= 58 ? "B" : perf >= 45 ? "C" : "D"; }
  function kdaOf(grade) {
    if (grade === "S") return rint(8, 15) + "/" + rint(0, 2) + "/" + rint(6, 14);
    if (grade === "A") return rint(5, 10) + "/" + rint(1, 3) + "/" + rint(5, 11);
    if (grade === "B") return rint(3, 7) + "/" + rint(2, 5) + "/" + rint(3, 8);
    if (grade === "C") return rint(1, 4) + "/" + rint(3, 6) + "/" + rint(2, 6);
    return rint(0, 2) + "/" + rint(4, 8) + "/" + rint(1, 4);
  }

  function simGame(opp, ctx) {
    ctx = ctx || {};
    const hero = ctx.hero || autoHero();
    const mine = ctx.mine || mySide(hero, ctx.tactic || "ope");
    const foeHero = MATCH.aiPick(S.pos, rnd, patchMap(), hero ? [hero] : []);
    const theirs = theirSide(opp.id || null, foeHero, ctx.tendency);
    const dm = (DIFFS[S.diff] || DIFFS.normal).opp;
    ["LANE", "MECH", "GAME", "POOL", "TEAM"].forEach(k => { theirs.dims[k] = clamp(theirs.dims[k] + dm, 1, 99); });
    const bo = MATCH.simBo(mine, theirs, { bestOf: ctx.bestOf || 3, dim: "GAME", rnd: rnd, patchBuffs: patchMap(), key: !!ctx.key });
    S.energy = clamp(mine.energy, 0, 100);
    S.morale = clamp(mine.morale, 0, 100);
    const perf = clamp(50 + ((mine.dims.LANE + mine.dims.MECH + mine.dims.GAME) / 3 - 68) * 1.3 + (S.morale - 50) * .25 + rint(-10, 10), 1, 100);
    const grade = gradeOf(perf);
    S.record.games++; if (bo.win) S.record.wins++; else S.record.losses++;
    return {
      win: bo.win, w: bo.w, l: bo.l, score: bo.w + "-" + bo.l,
      keyVars: bo.keyVars, upset: bo.upset, perf: perf, grade: grade,
      dims: dimRows(mine, theirs), opp: opp.name || "对手", id: opp.id,
      hero: hero, oppHero: foeHero, ctr: MATCH.ctrOf(hero, foeHero),
      kda: kdaOf(grade), dmg: grade === "S" ? rint(32, 45) : grade === "A" ? rint(24, 34) : grade === "B" ? rint(17, 25) : rint(8, 18)
    };
  }

  function matchMonth(preGames, preOpps, noSkip) {
    const n = 5;
    M.reg = M.reg || { w: 0, l: 0 };
    let opps = preOpps && preOpps.length ? preOpps : shuffle(oppList()).slice(0, n);
    if (!opps.length) opps = [{ name: "训练赛对手", id: null }];
    /* 五场里最难那场也有 80% 把握 → 给「跳过」，挂机有 20% 概率被爆冷 */
    if (!preGames && !noSkip) {
      const probs = opps.map(o => {
        const d = myTeamPower() - teamPower(o.id || "");
        return 1 / (1 + Math.exp(-d / 8));
      });
      const minP = probs.length ? Math.min.apply(null, probs) : 0;
      const avgP = probs.length ? probs.reduce((a, b) => a + b, 0) / probs.length : 0;
      if (minP >= 0.8 || avgP >= 0.85) {
        return scene({
          type: "skipOffer", pct: Math.round(minP * 100), avgPct: Math.round(avgP * 100), ml: S._ml,
          splitName: splitLabel(S._ml.month === 1 ? 1 : S._ml.month === 4 ? 2 : 3),
          opps: opps.map(o => ({ name: o.name, power: Math.round(teamPower(o.id || "")) })),
          pick(i, v) {
            if (v === "play") return matchMonth(null, opps, true);
            let upsetDone = false;
            const gs = opps.map(o => {
              const g = simGame(o);
              if (g.win && !upsetDone && chance(0.2)) {
                g.win = false; g.upset = true;
                g.upsetNote = "三路优势，第四把被对面一波偷家偷没了。弹幕已经笑完了。";
                upsetDone = true;
              }
              return g;
            });
            return matchMonth(gs, opps);
          }
        });
      }
    }
    const games = preGames && preGames.length ? preGames : opps.map(o => simGame(o));
    const w = games.filter(g => g.win).length, l = games.length - w;
    games.forEach(g => addMyResult(g.win));
    for (let i = 0; i < n; i++) simLeagueRound();
    M.reg.w += w; M.reg.l += l;
    const wr = w / Math.max(1, games.length);
    S.morale = clamp(S.morale + (wr >= .6 ? 8 : wr <= .3 ? -10 : 0), 0, 100);
    S.spirit = clamp((S.spirit || 60) + (wr >= .6 ? 6 : wr <= .3 ? -8 : 0), 0, 100);
    S.st.FAME = clamp(S.st.FAME + (wr >= .75 ? 3 : wr <= .25 ? -1 : 1), 0, 98);
    if (wr >= .75) S.burst = clamp(S.burst + 12, 0, 100);
    const sp = S._ml.month === 1 ? 1 : S._ml.month === 4 ? 2 : 3;
    S.splitN = sp;
    /* 赢一场有一场钱：底薪不够花，比赛奖金才是活水 */
    S.money = Math.round((S.money + w * (S.stage === "LPL" ? 2.5 : 1)) * 10) / 10;
    S.ticket += w;
    return scene({
      type: "matchday", games, w, l, ml: S._ml, hot: hotLine(wr >= .5), patch: S.patch,
      split: sp, splitName: splitLabel(sp), standings: standingsRows(),
      reg: { w: M.reg.w, l: M.reg.l }, rank: myRank(), teamName: (teamOf(S.teamId) || {}).name || "",
      upsetCount: games.filter(g => g.upset).length,
      pick() { return forumScene({ kind: "regular", title: splitLabel(sp) + " 常规赛 · " + (S.stage === "LDL" ? "LDL" : "LPL"), w: w, l: l, perf: Math.round(wr * 100), ml: S._ml }, () => monthEnd()); }
    });
  }

  function seedRank() { return myRank(); }

  /* ================= 赛段季后赛 ================= */
  function playoffPlace(won, roundIdx, cut) {
    if (won && roundIdx >= 2) return 1;
    if (roundIdx >= 2) return 2;
    if (roundIdx === 1) return chance(.5) ? 3 : 4;
    return Math.min(cut, 5 + rint(0, Math.max(0, cut - 5)));
  }

  function playoffMonth(n) {
    const ldl = S.stage === "LDL";
    const cut = ldl ? 6 : 10;
    const rank = seedRank();
    const title = splitLabel(n) + "季后赛";
    const ticket = n === 3 ? "这个赛段的前四名进全球总决赛。" : `这个赛段的前两名，去打${n === 1 ? "先锋赛" : "MSI"}。`;
    if (rank > cut) {
      S.record.splits.push({ year: S._ml.year, split: "S" + n, name: splitLabel(n), win: false, reach: 0, place: rank, score: `常规赛第 ${rank} 名` });
      S.morale = clamp(S.morale - 12, 0, 100);
      S.st.FAME = clamp(S.st.FAME - 2, 0, 98);
      return result("无缘季后赛", `${title}，你们常规赛排第 ${rank} 名，季后赛门票没你们的份。教练把战术板擦得很干净，说下个赛段再说。`, "lose", () => monthEnd());
    }
    const field = oppList().sort((a, b) => teamPower(b.id) - teamPower(a.id));
    const bands = rank <= 2 ? [[2, 7], [1, 5], [0, 3]] : rank <= 4 ? [[1, 7], [0, 4], [0, 2]] : [[0, 8], [0, 4], [0, 2]];
    const used = [], opps = [];
    for (const b of bands) {
      const cand = field.slice(Math.min(b[0], field.length), Math.min(b[1], field.length)).filter(t => used.indexOf(t.id) < 0);
      const rest = field.filter(t => used.indexOf(t.id) < 0);
      const t = cand.length ? pick(cand) : pick(rest.length ? rest : field);
      used.push(t.id); opps.push(t);
    }
    M.split = n; M.roundIdx = 0; M.opps = opps;
    M.series = { g: 0, wins: 0, losses: 0, title: title, splitN: n };
    M.form = 4 + (rank <= 2 ? 3 : 0);
    S.timeline.push({ t: S.tick, text: `${splitLabel(n)} 常规赛第 ${rank} 名，进季后赛` });
    return result(title, `${splitLabel(n)}常规赛，你们排第 ${rank} 名，进季后赛了。首轮对手 ${opps[0].name}，BO5，输了直接放假。${ticket}`, "info", () => seriesGame(opps[0]));
  }

  function seriesGame(opp) {
    const s = M.series;
    if (!s || s.done) return monthEnd();
    if (s.wins >= Math.ceil((s.bestOf || 5) / 2) || s.losses >= Math.ceil((s.bestOf || 5) / 2)) return seriesEnd();
    const oppT = typeof opp === "string" ? findTeam(opp) : (opp || findTeam("对手"));
    s.oppName = oppT.name; s.oppId = oppT.id;
    s.opp = { id: oppT.id, name: oppT.name };
    s.step = 0;
    s.bestOf = s.bestOf || 5;
    s.oppTendency = ({ 体系: "运营", 铁腕: "团战", 放养: "单带" }[(teamOf(oppT.id) || {}).coachStyle] || "运营");
    s.mom = 0; s.log = [];
    if ((s.bestOf || 5) >= 5 && !s.prepped) return prepScene();
    return bpScene();
  }

  /* 对局场景：支持“爆种”开关，重开同一场对局 */
  function duelScene(duel) {
    return scene({
      type: "duel", duel, burst: S.burst, guide: guide("duel"),
      dcMod: ((M.series && M.series.oppMod) || 0) + (S.endless ? Math.min(3, Math.max(0, (S.season || 1) - 3)) : 0),
      canBurst: S.burst >= 60 && !duel.useBurst, useBurst: !!duel.useBurst,
      pick(i) { return resolveDuel(duel, i); },
      pickBurst() {
        if (duel.useBurst || S.burst < 60) return cur;
        duel.useBurst = true;
        return duelScene(duel);
      }
    });
  }

  function resolveDuel(duel, i) {
    const o = duel.sit.opts[i];
    const sc = M.series;
    const st = S.st[o.stat] || 50;
    const notes = [];
    let mod = (sc && sc.oppMod) || 0;
    let dc = o.dc + mod;
    // —— 天赋/技能的实战钩子 ——
    if (duel.dice) { dc -= duel.dice; notes.push(duel.dice > 0 ? "摇骰子：6，今晚是你的。" : "摇骰子：1，今晚别碰操作。"); }
    if (hasT("fa_god_descend") && sc && sc.g === 5) { dc -= 4; notes.push("天神下凡：决胜局，你从河道走出来，对面开始跑。"); }
    if (hasT("sk_mind_game") && sc && sc.g === 1) { dc -= 2; notes.push("心理战：开局先把对面心态搞了。"); }
    if (hasT("tal_jungle_king") && sc && sc.worlds && M.knock && M.knock.round >= 3) { dc += 2; notes.push("厂长の野区：决赛，你的手又开始抖了。"); }
    const roll = rint(1, 20);
    const bonus = Math.floor((st - 50) / 5) + Math.floor((S.morale - 50) / 12);
    let total = roll + bonus;
    if (duel.useBurst) { total = Math.max(total, dc + 5); }
    const crit = roll === 20 ? "大成功" : roll === 1 ? "大失败" : "";
    const success = crit === "大成功" ? true : crit === "大失败" ? false : total >= dc;
    if (duel.useBurst) { S.burst = 0; S.energy = clamp(S.energy - 18, 0, 100); }
    if (success) { S.burst = clamp(S.burst + 14, 0, 100); M.form = (M.form || 0) + .9; }
    else { S.burst = clamp(S.burst - 16, 0, 100); M.form = (M.form || 0) - .9; }
    let g = simGame(duel.opp, { perfMod: success ? 12 : -10, winMod: success ? .16 : -.14 });
    let flipNote = "";
    if (!g.win && sc) {
      if (hasT("sk_restart") && !sc.restartUsed && sc.losses >= 2) {
        sc.restartUsed = true; g = Object.assign({}, g, { win: true });
        flipNote = "战术暂停：你把耳机摘了，说等一下，重开这一波。裁判看了你三秒，判了。";
      } else if (hasT("sk_steal_home") && !sc.stealUsed && chance(.22)) {
        sc.stealUsed = true; g = Object.assign({}, g, { win: true });
        flipNote = "偷家：兵线进塔的时候，对面还在打大龙。";
      }
    }
    if (g.win) sc.wins++; else sc.losses++;
    const echo = (function () {
      try {
        const F = (window.DATA_FLAVOR || {}).duel || {};
        const bag = F[success ? "good" : "bad"] || [];
        return bag.length ? pick(bag) : "";
      } catch (e) { return ""; }
    })();
    return scene({
      type: "duelResult", success, crit, echo, text: success ? (o.ok || duel.sit.ok || "你做到了。") : (o.fail || duel.sit.fail || "你搞砸了。"),
      notes, flipNote,
      game: g, wins: sc.wins, losses: sc.losses, title: sc.title, burst: S.burst,
      pick() { return seriesGame(duel.opp); }
    });
  }

  function seriesEnd() {
    const s = M.series;
    if (!s || s.done) return monthEnd();
    s.done = true;
    const needWins = Math.ceil((s.bestOf || 5) / 2);
    const won = s.wins >= needWins;
    const oppName = s.oppName || "对手";
    /* 局内决策评级：整轮系列赛的 plan 是否奏效，挂到结束后的 result 上 */
    M._dec = duelRateSummary(s);
    /* 开麦：输了必采；赢了只在收官战（赛段决赛 / 国际赛 / 世界赛）采，避免每轮都来一次 */
    const closing = !won || !!s.worlds || !!s.intl || (M.roundIdx || 0) >= 2;
    M.pendingTalk = closing
      ? { won: won, w: s.wins, l: s.losses, opp: oppName, kind: s.worlds ? "worlds" : (s.intl ? "intl" : "split") }
      : null;

    /* —— 世界赛瑞士轮 —— */
    if (s.kind === "worldsSwiss") {
      const w = M.worlds;
      const me = w && w.field.filter(f => f.id === S.teamId)[0];
      if (me) { if (won) me.w++; else me.l++; }
      if (w && me) w.log.push({ round: w.round || 1, a: "我", b: oppName, win: won ? ((teamOf(S.teamId) || {}).name || "我") : oppName, score: s.wins + "-" + s.losses });
      S.burst = clamp(S.burst + (won ? 8 : -6), 0, 100);
      if (won) S.spirit = clamp((S.spirit || 60) + 5, 0, 100);
      else S.morale = clamp(S.morale - 8, 0, 100);
      M.pendingTalk = null;
      const out = !!(me && (me.w >= 3 || me.l >= 3));
      const next = () => worldsMapScene(() => (out || !w || w.round >= 5) ? endSwiss() : worldsSwissRound());
      return result(won ? "瑞士轮 · 拿下" : "瑞士轮 · 失手",
        `${me ? me.w + "-" + me.l : "?"}。${won ? "你把这局啃下来了，回休息室第一件事是看别桌的比分。" : "输了。你在选手席上多坐了几秒，才站起来走回后台。"}`,
        won ? "win" : "lose", next);
    }

    /* —— 世界赛淘汰赛 —— */
    if (s.worlds) {
      const w = M.worlds, br = w && w.bracket;
      if (w && w.adapt > 0) w.adapt--;
      const rn = br ? br.round : 1;
      const nm = ["八强", "四强", "决赛"][clamp(rn - 1, 0, 2)];
      if (!won) {
        S.record.worlds.push({ year: S._ml.year, best: nm, win: false });
        S.morale = clamp(S.morale - 20, 0, 100);
        S.timeline.push({ t: S.tick, text: `世界赛止步${nm}` });
        if (w) w.log.push({ round: rn, a: "我", b: oppName, win: oppName, score: s.wins + "-" + s.losses });
        prize(nm === "亚军" ? "worlds2" : "worlds4");
        M.worlds = null;
        sndEnd("lose");
        return result("止步" + nm, `${s.wins}:${s.losses}，输给 ${oppName}。你在休息室把队服叠好，明年的门票得从头再打一遍。`, "lose", () => forumScene({ kind: "worlds", title: "世界赛 · 止步" + nm, w: s.wins, l: s.losses, perf: 42 }, () => monthEnd()));
      }
      if (rn >= 3) {
        S.record.titles.push("全球总决赛冠军");
        S.record.worlds.push({ year: S._ml.year, best: "冠军", win: true });
        S.st.FAME = clamp(S.st.FAME + 22, 0, 99);
        S.fans += rint(300000, 900000);
        S.burst = 100;
        S.story.justice = (S.story.justice || 0) + 3;
        prize("worlds");
        S.timeline.push({ t: S.tick, text: "全球总决赛冠军" });
        M.worlds = null;
        sndEnd("win");
        return result("世界冠军", `${s.wins}:${s.losses}。金色的纸屑落下来的时候，你忽然想起三年前在 LDL 基地吃泡面的那个晚上。`, "win", () => forumScene({ kind: "worlds", title: "世界赛 · 决赛", w: s.wins, l: s.losses, perf: 97 }, () => monthEnd()));
      }
      /* 赢了：把自己塞进下一轮 */
      const me = (w && w.field.filter(f => f.id === S.teamId)[0]) || { id: S.teamId, name: (teamOf(S.teamId) || {}).name || "我的队", power: 80 };
      const done = (s.knock || []);
      done.forEach(d => w && w.log.push({ round: rn, a: d.a.name, b: d.b.name, win: d.win.name, score: d.score }));
      const winners = done.map(d => d.win).filter(Boolean);
      winners.push(me);
      if (br && br.round === 1) { br.sf = [{ a: winners[0], b: winners[1] }, { a: winners[2], b: winners[3] }]; br.round = 2; }
      else if (br && br.round === 2) { br.f = [{ a: winners[0], b: winners[1] }]; br.round = 3; }
      S.timeline.push({ t: S.tick, text: `世界赛${nm}晋级` });
      S.burst = clamp(S.burst + 20, 0, 100);
      M.pendingTalk = null;
      return result(nm + "晋级", `${s.wins}:${s.losses}，淘汰 ${oppName}。场馆在喊你的 ID，你抬手示意的时候手在抖。`, "win", () => worldsMapScene(() => worldsKnockout()));
    }

    /* —— 国际赛（先锋赛 / MSI）：半决赛 → 决赛 —— */
    if (s.intl) {
      const it = M.intl || { kind: s.intl, name: s.intl === "firststand" ? "先锋赛" : "MSI", round: 0, pool: [] };
      S.record.intl = S.record.intl || [];
      if (!won) {
        const stop = it.round === 0 ? "半决赛" : "亚军";
        S.record.intl.push({ year: S._ml.year, name: it.name, best: stop, win: false });
        if (it.name === "MSI") { S.record.msi = S.record.msi || []; S.record.msi.push({ year: S._ml.year, best: stop, win: false }); }
        S.morale = clamp(S.morale - 14, 0, 100);
        S.timeline.push({ t: S.tick, text: `${it.name}止步${stop}` });
        sndEnd("lose");
        return result(`${it.name}止步${stop}`, `${s.wins}:3，输给 ${oppName}。你在酒店把队服洗了，挂在窗边，第二天干了就走。`, "lose", () => forumScene({ kind: "intl", title: it.name + " · 止步" + stop, w: s.wins, l: s.losses, perf: 52 }, () => monthEnd()));
      }
      if (it.round >= 1) {
        const tname = it.name + "冠军";
        S.record.titles.push(tname);
        S.record.intl.push({ year: S._ml.year, name: it.name, best: "冠军", win: true });
        if (it.name === "MSI") { S.record.msi = S.record.msi || []; S.record.msi.push({ year: S._ml.year, best: "冠军", win: true }); }
        S.timeline.push({ t: S.tick, text: tname });
        S.st.FAME = clamp(S.st.FAME + (it.name === "MSI" ? 12 : 9), 0, 98);
        S.fans += rint(60000, 200000);
        S.burst = 100;
        S.coachTrust = clamp(S.coachTrust + 8, 0, 100);
        prize(it.name === "MSI" ? "msi" : "first");
        sndEnd("win");
        return result(tname, `3:${s.losses}，你们捧起了 ${it.name} 的奖杯。你举杯的时候，台下有人用中文喊你的 ID。`, "win", () => forumScene({ kind: "intl", title: it.name + " · 冠军", w: s.wins, l: s.losses, perf: 90 }, () => monthEnd()));
      }
      it.round = 1;
      const pool = (it.pool || []).filter(x => findTeam(x).id !== S.teamId);
      const nx = pick(pool.length ? pool : ["T1"]);
      M.series = { g: 0, wins: 0, losses: 0, title: it.name + " 决赛", intl: s.intl, oppName: nx, oppId: findTeam(nx).id, oppMod: 4 };
      M.form = clamp((M.form || 2) + 1, 0, 12);
      S.burst = clamp(S.burst + 15, 0, 100);
      return result("晋级" + it.name + "决赛", `3:${s.losses}，淘汰 ${oppName}。决赛对手 ${nx}，BO5。`, "win", () => seriesGame(findTeam(nx)));
    }

    /* —— 赛段季后赛 —— */
    const splitN = s.splitN || (M.split || 1);
    const cut = S.stage === "LDL" ? 6 : 10;
    const place = won ? 1 : playoffPlace(false, M.roundIdx, cut);
    S.record.splits.push({ year: S._ml.year, split: "S" + splitN, name: splitLabel(splitN), win: won, reach: M.roundIdx + 1, place: place, score: won ? `3-${s.losses}` : `${s.wins}-3` });
    if (won) {
      const tname = splitLabel(splitN) + "冠军";
      S.record.titles.push(tname);
      S.timeline.push({ t: S.tick, text: `${tname}（3:${s.losses} 击败 ${oppName}）` });
      S.st.FAME = clamp(S.st.FAME + 8, 0, 98);
      S.fans += rint(20000, 80000);
      S.burst = 100;
      S.coachTrust = clamp(S.coachTrust + 10, 0, 100);
      sndEnd("win");
      return result("冠军", `3:${s.losses}，你们赢了。${tname}。更衣室里有人哭了，有人在喊你的 ID。`, "win", () => monthEnd());
    }
    S.morale = clamp(S.morale - 18, 0, 100);
    prize("split2");
    sndEnd("lose");
    return result(`赛段第 ${place} 名`, `${s.wins}:3，被 ${oppName} 送走，${splitLabel(splitN)}第 ${place} 名。你在休息室坐了很久，手机屏幕上全是换人的评论。`, "lose", () => monthEnd());
  }

  /* ================= 国际赛：先锋赛 / MSI ================= */
  function intlMonth(kind) {
    const isFS = kind === "firststand";
    const n = isFS ? 1 : 2;
    const name = isFS ? "先锋赛" : "MSI";
    const where = isFS ? "首尔" : "温哥华";
    if (S.stage !== "LPL") {
      /* LDL 没有国际赛，但这个月不能空着：走 LDL 自己的杯赛（P1-4） */
      return ldlMonth(S._ml.month);
    }
    const place = splitPlace(n);
    if (!place || place > 2) {
      return result(name, `${SPLIT_NAME[n]}打完，你们第 ${place > 90 ? "?" : place} 名，${name} 的门票在别人手里。你在基地看完决赛，发了条微博：下次我来。`, "info", () => monthEnd());
    }
    const pool = isFS
      ? ["T1", "GEN", "HLE", "KT", "G2", "FNC", "MAD"]
      : ["T1", "GEN", "HLE", "GEN", "G2", "FNC", "KT", "BLG", "JDG"];
    const clean = pool.filter(x => findTeam(x).id !== S.teamId && findTeam(x).id);
    M.intl = { kind: kind, name: name, round: 0, pool: shuffle(clean.length ? clean : ["T1"]) };
    S.timeline.push({ t: S.tick, text: "出征" + name });
    const lm = lastRealChamp("msi");
    const ctx = lm ? `上一届 MSI 冠军是 ${lm.champion}（${lm.year}，亚军 ${lm.runner}）。` : "";
    const opp = pick(M.intl.pool);
    M.series = { g: 0, wins: 0, losses: 0, title: name + " 半决赛", intl: kind, oppName: opp, oppId: findTeam(opp).id, oppMod: 2 };
    M.form = 5;
    return result(name, `${where}。${name}，四个赛区的代表，你代表 LPL 出战——因为你在${SPLIT_NAME[n]}打进了前二。\n${ctx}\n半决赛对手 ${opp}，BO5。`, "win", () => seriesGame(findTeam(opp)));
  }

  /* ================= 世界赛 ================= */
  function worldsQualified() {
    if (S.stage !== "LPL") return false;
    return myRank() <= 4 || splitPlace(3) <= 4;
  }

  const SWISS_POOL = ["T1", "GEN", "HLE", "DK", "KT", "FNC", "G2", "BDS", "MAD", "BLG", "TES", "JDG", "WBG", "LNG", "IG"];

  function lastRealChamp(kind) {
    const arr = (D.chronicle() || {})[kind] || [];
    return arr.length ? arr[arr.length - 1] : null;
  }

  function worldsSwiss() {
    if (S.stage !== "LPL") return ldlMonth(S._ml.month);
    if (!worldsQualified()) {
      const p = myRank();
      return result("十月", `第三赛段你们常规赛第 ${p > 90 ? "?" : p} 名，前四才有 S 赛门票。你在基地看抽签，关掉直播，打开排位。`, "info", () => monthEnd());
    }
    initWorldsField();
    S.timeline.push({ t: S.tick, text: "晋级全球总决赛" });
    const lc = lastRealChamp("worlds");
    const ctx = lc ? `上一届（${lc.year}）冠军是 ${lc.champion}，决赛赢了 ${lc.runner}。` : "";
    return result("全球总决赛 · 瑞士轮",
      `十六支队伍，五轮，三胜出线，三负回家。场馆里全是旗子，你听见有人用中文喊你的 ID。\n${ctx}\n\n图上是全部对手和他们的战绩——每一轮都会更新。`,
      "win", () => worldsMapScene(() => worldsSwissRound()));
  }
  function swissGame() {
    const s = M.swiss;
    if (s.wins >= 3 || s.losses >= 3) {
      if (s.wins >= 3) return result("出线", `${s.wins}-${s.losses}，出线了。你把耳机摘下来的时候，手还在抖。`, "win", () => {
        M.knock = { round: 0 };
        S.timeline.push({ t: S.tick, text: "瑞士轮出线" });
        return monthEnd();
      });
      return result("回家", `${s.wins}-${s.losses}。你在酒店房间收拾行李，窗外是别人的烟花。`, "lose", () => monthEnd());
    }
    s.g++;
    const pool = SWISS_POOL.filter(n => findTeam(n).id !== S.teamId);
    const oppT = findTeam(pick(pool));
    const g = simGame(oppT, { oppMod: 1 + s.g });
    if (g.win) { s.wins++; S.burst = clamp(S.burst + 10, 0, 100); } else s.losses++;
    return scene({
      type: "swissResult", game: g, wins: s.wins, losses: s.losses,
      pick() { return swissGame(); }
    });
  }

  function worldsKnockoutLegacy() {
    return monthEnd();
  }

  /* ================= 十一月：全明星 / 年度颁奖 ================= */
  function allStarMonth() {
    const y = S._ml.year;
    S.record.awards = S.record.awards || [];
    const lines = [];
    if (myOvr() >= 82 && S.record.awards.filter(a => a.kind === "一阵").length < 1) {
      S.record.awards.push({ year: y, kind: "一阵" });
      S.st.FAME = clamp(S.st.FAME + 6, 0, 98);
      S.fans += rint(30000, 90000);
      S.burst = clamp(S.burst + 20, 0, 100);
      lines.push("年度一阵：你。颁奖礼上主持人念你 ID 的时候，弹幕在刷“就这？”。");
    } else if (myOvr() >= 74) {
      S.record.awards.push({ year: y, kind: "最佳阵容" });
      S.st.FAME = clamp(S.st.FAME + 3, 0, 98);
      lines.push("年度最佳阵容提名。你没去现场，在基地和队友吃火锅，经理发来一段你被念名字的录屏。");
    } else {
      lines.push("全明星周末没有你。你在基地看别人打表演赛，弹幕在刷“这人谁啊”。");
    }
    const champCups = (S.record.titles || []).filter(t => t.indexOf("赛段冠军") >= 0).length;
    if (champCups >= 3) lines.push(`年度 MVP 讨论席上有人提到了你（本赛季 ${champCups} 个赛段冠军）。`);
    S.timeline.push({ t: S.tick, text: "全明星 / 年度颁奖" });
    return result("全明星周末", `十一月，赛季结束，全明星和年度颁奖。\n${lines.join("\n")}\n转会窗下一站：谁给你打电话。`, "info", () => monthEnd());
  }


  /* ================= 月末 ================= */
  function recordChamp() {
    // 每年 11 月记录当届世界冠军（玩家没打到决赛就按队伍实力推演）
    const y = S._ml.year;
    if ((S.record.worldChamps || []).some(x => x.year === y)) return;
    S.record.worldChamps = S.record.worldChamps || [];
    if ((S.record.titles || []).indexOf("全球总决赛冠军") >= 0 && (S.record.worlds || []).some(w => w.year === y && w.win)) {
      S.record.worldChamps.push({ year: y, champ: (teamOf(S.teamId) || {}).name || S.name, mine: true });
      return;
    }
    const pool = ["T1", "GEN", "HLE", "BLG", "TES", "JDG", "G2", "DK"].filter(n => findTeam(n).id !== S.teamId);
    const w = pool.map(n => ({ n: n, p: Math.pow(teamPower(findTeam(n).id) - 70, 2) + 1 }));
    const tot = w.reduce((a, x) => a + x.p, 0);
    let r = rnd() * tot, who = w[0].n;
    for (const x of w) { r -= x.p; if (r <= 0) { who = x.n; break; } }
    S.record.worldChamps.push({ year: y, champ: who, mine: false });
  }

  function monthEnd() {
    /* 有些赛段收尾直接进月末（比如赛段夺冠没有论坛页），开麦在这里补一次，免得最该说话的场合反而静音 */
    if (M.pendingTalk) {
      const pt = M.pendingTalk;
      M.pendingTalk = null;
      return talkScene(pt, () => forumScene({ w: pt.w, l: pt.l, perf: pt.won ? 64 : 44, silent: true }, () => monthEnd()));
    }
    if (S._ml.month === 10) recordChamp();
    /* 结算前精力定档：伤病、成长、心情、教练信任都按这一档判，然后才回 16 点 */
    const preEnergy = S.energy;
    const band = energyBand(preEnergy);
    const mb = moneyBand(S.money);
    gain({ MECH: .45, LANE: .35, GAME: .35 }, .5);
    veteranDecay();
    const notes = [];

    /* 旧伤：一个月好一格。伤病不再清空精力、也不再把整月扣掉，只是状态打折 */
    if (M.injury) {
      const inj = M.injury;
      inj.fresh = false;
      if (inj.months > 0) {
        inj.months--;
        if (inj.months <= 0) {
          notes.push("伤好了：" + inj.part + "不再碍事");
          S.timeline.push({ t: S.tick, text: "伤愈：" + inj.part });
          /* 伤病冷却：刚好的两个月内不再判伤病，避免连续低精力月份被反复砸中 */
          S._injCd = Math.max(S._injCd || 0, S.tick + 2);
          M.injury = null;
        } else {
          notes.push("带伤：" + inj.part + "还没好，比赛状态要打折（还剩 " + inj.months + " 个月）");
        }
      } else {
        M.injury = null;
      }
    }
    /* 伤病：档位越差越容易伤。命中后先记一笔，月末给三种处理方式，别一句话把人整月打没。
       单月概率封顶 22%，带伤期间不再判定，伤好后冷却 2 个月——三/hell 的伤停损失要压到 ≤2 个月 */
    const injP = Math.min(.14, (S.inj || .1) * .55 * band.injMul * diffInj() * (hasT("tal_glass_body") ? 1.8 : 1) * (S.diff === "normal" ? .75 : S.diff === "hard" ? .9 : S.diff === "hell" ? 1.1 : 1));
    if (!M.injury && preEnergy < 16 && S.tick >= (S._injCd || 0) && chance(injP)) {
      const part = pick(["手腕", "腰", "肩", "脚踝"]);
      S.st.PHYS = clamp(S.st.PHYS - 5, 0, 99);
      M.injured = true;
      S.record = S.record || {};
      S.record.injuries = (S.record.injuries || 0) + 1; /* 成就 injuryCount */
      M.injury = { part: part, months: 1, form: -4, fresh: true };
      S._injCd = Math.max(S._injCd || 0, S.tick + 3);
      S.timeline.push({ t: S.tick, text: "伤病：" + part });
      notes.push("伤病：" + part + "。别慌，队医给了三个方案，这个月不至于全废");
    }
    /* 透支/危险的代价：心情、教练信任 */
    if (band.key === "exhausted") { S.morale -= 2; S.coachTrust = clamp(S.coachTrust - 2, 0, 100); notes.push("精力透支：心情 −2，教练信任 −2"); }
    else if (band.key === "danger" || band.key === "down") { S.morale -= 3; S.coachTrust = clamp(S.coachTrust - 3, 0, 100); notes.push("精力见底：心情 −3，教练信任 −3"); }
    /* 队友关系月度小概率：低 aff 内讧 / 高 aff 请吃饭 */
    mateMonthly().forEach(t => notes.push(t));

    S.energy = clampEnergy(S.energy + 16);
    /* 新队磨合：换队后的话语权惩罚每月退一点，两三个月才回到原来的位置 */
    if (S.voiceReset > 0) {
      S.voiceReset = Math.max(0, (S.voiceReset || 0) - 2);
      if (S.voiceReset === 0) notes.push("新队磨合结束：话语权回到正常水平");
      else notes.push("新队磨合：话语权还差 " + S.voiceReset + " 点");
    }
    /* 心态向 55 硬回归：低于 55 每月大幅回拉（缺口 45%，3~20 点），高于 55 不再额外加。
       输比赛/负面事件一次能砸掉几十点，靠 +2 的小回血永远追不上，月度结算必须兜住地板 */
    const gap = 55 - S.morale;
    const pull = gap > 0 ? clamp(Math.round(gap * .45), 3, 20) : 0;
    S.morale = clamp(S.morale + (S.teamStatus - 50) / 25 + pull + (S.morale < 40 ? 2 : -2), 0, 100);
    if (S.st.MENTAL < 55) S.st.MENTAL = clamp(S.st.MENTAL + pull, 0, S.pot);
    S.spirit = clamp((S.spirit || 60) + (S.teamStatus - 55) / 12, 0, 100);
    S.st.FAME = clamp(S.st.FAME + S.fans / 250000, 0, 98);

    /* 工资 + 赞助到账（单位：万元）。S.salary 是年薪，月发的是它的十二分之一 */
    const payBase = Math.round(((S.salary || 12) / 12) * 10) / 10;
    const payFans = Math.round((S.fans / 8000) * 10) / 10;
    const payFame = Math.round((Math.max(0, S.st.FAME - 45) * .6) * 10) / 10;
    const sponsor = sponsorPay(); /* W7 赞助合约：名气过门槛自动签约，每月分成 */
    const pay = Math.round((payBase + payFans + payFame + sponsor) * 10) / 10;
    /* 每月固定支出：生活费 / 团队 / 教练工资 / 装备理疗 */
    const living = Math.round((0.45 + Math.max(0, S.age - 18) * .05) * 10) / 10;
    const teamCost = Math.round(((S.stage === "LPL" ? .6 : .25) + (S.teamStatus < 45 ? .15 : 0)) * 10) / 10;
    const coachCost = (S.invest && (S.invest.stat3 || S.invest.energyMax)) ? .3 : 0;
    const gearCost = (S.invest && S.invest.gear) ? .3 : .1;
    const expenses = [
      { label: "生活费", amount: living },
      { label: "团队开销", amount: teamCost },
      { label: "教练工资", amount: coachCost },
      { label: "装备理疗", amount: gearCost }
    ];
    if (S.money < 0) {
      const interest = Math.round(Math.abs(S.money) * .05 * 10) / 10;
      if (interest > 0) { expenses.push({ label: "欠债利息", amount: interest }); notes.push("存款为负：本月被收了 " + interest + " 万利息，欠债事件更容易找上门"); }
    }
    const expenseTotal = Math.round(expenses.reduce((a, e) => a + e.amount, 0) * 10) / 10;
    /* W7 投资渠道：季度（3/6/9/12 月）结算，房产/基金/股权 −5% ~ +20% 浮动 */
    let investRows = [];
    if ((S._ml.month % 3) === 0 && investTotal() > 0) {
      investRows = investRoll();
      investRows.forEach(r => {
        const cn = ({ house: "房产", fund: "基金", equity: "股权" }[r.k] || r.k);
        notes.push("投资" + cn + "：本季 " + (r.pct >= 0 ? "+" : "") + r.pct + "%（" + (r.delta >= 0 ? "+" : "") + r.delta + " 万）");
      });
    }
    S.money = Math.round((S.money + pay - expenseTotal) * 10) / 10;
    markDebt();
    if (S.money < 0) notes.push("你现在欠着钱。");

    /* 抽卡券：每个月保底 3 张 */
    S.ticket = (S.ticket || 0) + 3;
    let draws = 0;
    if (chance(.14)) draws++;
    if (S._ml.month === 12) draws += 2;
    /* 下月只能低消耗：结算前精力见底（≤14），或补完 16 点后仍在透支档及以下。
       注意：这只是「精力见底」不是伤病，用 tiredRest 单独标记，forcedRest 只留给伤病静养
       （sim_balance 的「因伤损失行动月数」就是数 forcedRest 的月份，混进来会虚高） */
    const nextBand = energyBand(S.energy);
    const tiredRest = preEnergy <= 14 || nextBand.key === "exhausted" || nextBand.key === "danger" || nextBand.key === "down";
    M.tiredRest = tiredRest;
    M.forcedRest = false;
    const forcedRest = !!tiredRest;
    if (tiredRest) notes.push("强制休息：下个月先把精力养回来，高消耗行动会被队医拦下。");
    /* 成就：月末统一检查一次，新解锁的挂在月末场景上 */
    const achvNew = checkAchv().slice();
    M.achvNew = null;
    const endScene = () => scene({
      type: "monthend", ml: S._ml, energy: Math.round(S.energy), preEnergy: Math.round(preEnergy),
      forcedRest: !!(M.injury && M.injury.fresh), tiredRest: !!tiredRest, morale: S.morale, spirit: S.spirit, ovr: myOvr(),
      fame: Math.round(S.st.FAME), fans: S.fans, voice: voice(), draws: draws, injured: !!M.injured,
      pay: pay, payBase: payBase, payFans: payFans, payFame: payFame, sponsor: S.sponsor ? { name: S.sponsor.name, fee: S.sponsor.fee, months: S.sponsor.months } : null,
      salary: Math.max(0, Math.round(S.salary || 12)),
      money: S.money, ticket: S.ticket,
      expenses: expenses, expenseTotal: expenseTotal, notes: notes,
      invest: S.invest2 || {}, investRows: investRows,
      achvNew: achvNew,
      energyBand: energyBand(S.energy), moneyBand: moneyBand(S.money),
      pick() {
        M.injured = false;
        M.atMonthStart = false;
        const after = () => {
          if (draws > 0) return drawScene(draws, () => shopScene(() => nextMonth()));
          return shopScene(() => nextMonth());
        };
        /* 自动托管：抽卡直接收下、商店一键跳过；伤病处理仍然交给玩家（重要决策不代打） */
        const autoLv = autoLevel();
        if (autoLv >= 1) {
          let cnt = 0;
          for (let i = 0; i < draws; i++) { if (drawOne()) cnt++; }
          S.shopDone = true;
          const autoAfter = () => result("托管 · 月末",
            "这个月你只管打比赛。抽卡 " + cnt + " 张自动收下，商店按托管跳过。\n存款 " + Math.round(S.money) + " 万 · 精力 " + Math.round(S.energy) + " · 心情 " + Math.round(S.morale),
            "info", () => nextMonth());
          if (M.injury && M.injury.fresh) return injuryScene(after);
          return autoAfter();
        }
        /* 伤病处理：三选一，选完再继续月末流程 */
        if (M.injury && M.injury.fresh) return injuryScene(after);
        return after();
      }
    });
    /* 暗线：黑钱收多了，会有人来递最后一单 —— 接了可能走不到明年 */
    if ((S.story.corrupt || 0) >= 24 && !(S.flags && S.flags.lastjob)) {
      if (!S.flags) S.flags = {};
      S.flags.lastjob = true;
      return lastJobScene(endScene);
    }
    return endScene();
  }

  /* 伤病处理：静养 / 常规康复 / 打封闭。选完继续月末流程，谁也别想跳过去 */
  function injuryScene(next) {
    const inj = M.injury || { part: "手腕", months: 1 };
    const opts = [
      { t: "静养：停掉下个月的训练", d: "伤病清零，下个月高消耗训练全停；但多出来的恢复时间让体能回一点（精力 +8、士气 +3）", k: "rest" },
      { t: "常规康复：带伤打，慢慢养", d: "带伤 1 个月，比赛状态 −4；行动不受限", k: "normal" },
      { t: "打封闭：现在就能上", d: "带伤 1 个月、状态 −2；伤病概率 +5%，25% 会加重", k: "block" }
    ];
    return scene({
      type: "injury", part: inj.part, months: inj.months, opts: opts.map(o => ({ t: o.t, d: o.d })),
      pick(i) {
        const k = (opts[clamp(i, 0, opts.length - 1)] || {}).k;
        if (k === "rest") {
          M.injury = null;
          M.forcedRest = true;
          S.energy = clampEnergy(S.energy + 8);
          S.spirit = clamp((S.spirit || 60) + 3, 0, 100);
          S.timeline.push({ t: S.tick, text: "伤停静养：下个月不练，恢复时间换来一点体能" });
          return result("静养", "队医把训练计划表划掉了一半，说下个月别练了。你把冰袋按在" + inj.part + "上，看着队友打训练赛。\n\n伤是当天好的，代价是下个月的训练表空了一半——但多出来的睡眠和理疗，让身体稍微回了一点。", "info", () => next());
        }
        if (k === "block") {
          M.injury = { part: inj.part, months: 1, form: -2, fresh: false };
          S.inj = clamp(S.inj + .05, 0, .8);
          let worse = false;
          if (chance(.25)) { M.injury.months = 3; M.injury.form = -6; worse = true; }
          S.timeline.push({ t: S.tick, text: "打封闭上场" });
          return result("打封闭", "针打进去的时候你咬着牙，队医说别咬，牙会裂。\n\n" + inj.part + "不疼了，但你知道那只是暂时不疼。" + (worse ? "两周后它回来得更凶，队医看你的眼神像在看一个不听劝的人。" : "至少这个月你还能站在台上。"), worse ? "bad" : "info", () => next());
        }
        M.injury = { part: inj.part, months: 1, form: -4, fresh: false };
        S.timeline.push({ t: S.tick, text: "带伤常规康复" });
        return result("常规康复", "你没有停下来。冰敷、理疗、上场，三件事按顺序排进日程。\n\n" + inj.part + "会跟你一个月，像一个甩不掉的提醒。", "info", () => next());
      }
    });
  }

  function lastJobScene(next) {
    const ev = {
      id: "gb_lastjob", cat: "黑幕", title: "最后一单",
      text: "停车场，晚上十一点，车窗只降下来一半。里面递出来一个信封，不是钱，是一张纸：决赛第三局，二十分钟，让一条大龙。纸背面写着一个数字。",
      sub: "递信封的人说：就这一次。你听过这句话。上一个说这话的人现在还在禁赛。",
      opts: [
        { t: "把信封推回去，收手", eff: { MENTAL: -4, money: -20 }, sc: { corrupt: -12, justice: 6 } },
        { t: "收下。就这一次", eff: { money: 200, MENTAL: -8 }, sc: { corrupt: 14 } },
        { t: "录音，交给联盟", eff: { FAME: 4, coach: -6, MENTAL: -6 }, sc: { corrupt: -8, justice: 10 } }
      ]
    };
    return scene({
      type: "event", ev: ev,
      pick(i) {
        const o = ev.opts[clamp(i, 0, ev.opts.length - 1)];
        ["corrupt", "justice"].forEach(k => {
          S.story[k] = clamp((S.story[k] || 0) + ((o.sc && o.sc[k]) || 0), k === "corrupt" ? 0 : -99, 99);
          if (S.story[k] < 0) S.story[k] = 0;
        });
        applyEff(o.eff);
        if (i === 1) {
          S.timeline.push({ t: S.tick, text: "收下一笔说不清的钱" });
          if (S.story.corrupt >= 34) {
            S.timeline.push({ t: S.tick, text: "最后一次出现在基地监控里" });
            return ending("dead");
          }
          return result("最后一单", "钱到账了。决赛第三局，二十分钟，你做了一个所有人都看不懂的决策。没有当场被抓，回基地的路上手机很安静，安静得不对劲。", "danger", next);
        }
        if (i === 2) {
          S.timeline.push({ t: S.tick, text: "把黑幕录音交给了联盟" });
          return result("最后一单", "你把录音交上去了。联盟立案，你被叫去做笔录，俱乐部高层开始躲着你走。有人说你毁了一个圈子，也有人说你救了它。", "story", next);
        }
        S.timeline.push({ t: S.tick, text: "拒绝了最后一单" });
        return result("最后一单", "你把信封推回去。对方没生气，只笑了一下：你会后悔的。\n\n从那天起，你每次 BP 都觉得有人在看你。", "story", next);
      }
    });
  }

  function nextMonth() {
    S.tick++;
    S.age = 18 + Math.floor((S.tick - 1) / 12);
    if (!S.endless) {
      if (S.tick > 36) return ending("three");
    } else {
      if (S.age >= 33) return ending("age");
      /* 无尽模式不再用 myOvr<70 自动 fade 硬砍存档：
         年底“无人报价”由转会期事件处理（transferMonth 里），玩家可以选再打一年 */
    }
    return startMonth();
  }

  /* ================= 抽卡 ================= */
  const RARITY = { white: { c: "#9aa7b4", n: "白" }, blue: { c: "#3fa9f5", n: "蓝" }, purple: { c: "#a855f7", n: "紫" }, gold: { c: "#e8b923", n: "金" }, red: { c: "#d33a3a", n: "赤" } };
  const RARITY_W = { white: 25, blue: 35, purple: 25, gold: 12, red: 3 };
  /* 重复卡折现（单位：元）。钱在游戏里按「万」记账，换算时 /10000 */
  const DUP_CASH = { white: 300, blue: 1000, purple: 10000, gold: 100000, red: 500000 };
  function dupCash(rarity) { return DUP_CASH[rarity] || 300; }
  function cashIn(card) {
    const yuan = dupCash(card && card.rarity);
    S.money = Math.round((S.money + yuan / 10000) * 100) / 100;
    S.dupCash = (S.dupCash || 0) + yuan;
    return yuan;
  }

  function drawOne() {
    const all = D.talents();
    if (!all.length) return null;
    S.record = S.record || {};
    S.record.draws = (S.record.draws || 0) + 1; /* 成就 gachaCount：按抽到的卡数计，十连自然 +10 */
    S.drawPity++;
    let rar;
    if (S.drawPity >= 40) { rar = "gold"; S.drawPity = 0; }
    else if (S.drawPity % 10 === 0) { rar = "purple"; }
    else rar = wpick(Object.keys(RARITY_W), k => RARITY_W[k] * (DIFFS[S.diff] || DIFFS.normal).luck);
    let pool = all.filter(t => t.rarity === rar);
    if (!pool.length) pool = all;
    let card = pick(pool);
    if ((S.bag || []).indexOf(card.id) >= 0) {
      card = Object.assign({}, card, { dup: true });
      card.cash = cashIn(card);
    } else { S.bag.push(card.id); S.talents.push(card.id); }
    return card;
  }

  /* 卡组加成：只有装进 5 个卡槽的卡才生效 */
  function deckBonus() {
    const b = {}, all = D.talents();
    const stat = k => STATS.indexOf(k) >= 0;
    (S.deck || []).forEach(id => {
      if (!id) return;
      const c = all.filter(t => t.id === id)[0];
      if (!c) return;
      const e = c.eff || {};
      for (const k in e) {
        if (stat(k)) b[k] = (b[k] || 0) + e[k];
        else b[k] = (b[k] || 0) + (typeof e[k] === "number" ? e[k] : 0);
      }
    });
    /* 流派羁绊：装槽同流派 2/3/5 张 */
    const builds = {};
    (S.deck || []).forEach(id => {
      const c = id && all.filter(t => t.id === id)[0];
      if (c && c.build) builds[c.build] = (builds[c.build] || 0) + 1;
    });
    b._builds = builds;
    for (const k in builds) {
      if (builds[k] >= 2) b._buildName = k;
      if (builds[k] >= 3) b.matchBonus = (b.matchBonus || 0) + 2;
      if (builds[k] >= 5) b.matchBonus = (b.matchBonus || 0) + 4;
    }
    return b;
  }
  function stEff() {
    const b = deckBonus(), o = {};
    for (const k of STATS) o[k] = clamp(S.st[k] + (b[k] || 0), 0, Math.min(100, S.pot + 12));
    return o;
  }
  /* 卡牌只通过 S.deck + deckBonus() 生效，没有第二套暗账 */
  function applyCard(c) { return c; }

  function drawScene(n, next) {
    const cards = [];
    for (let i = 0; i < n; i++) { const c = drawOne(); if (c) cards.push(c); }
    return scene({ type: "draw", cards, ticket: S.ticket, bonds: deckBonds().summary, poolInfo: poolInfo(), pick() { return next(); } });
  }

  /* ================= 抽卡页 / 卡组 / 商店 ================= */
  function gachaScene(next) {
    const goNext = () => next ? next() : actionScene();
    const bonds = deckBonds();
    return scene({
      type: "gacha", ticket: S.ticket, bag: (S.bag || []).length, deck: S.deck, pity: S.drawPity,
      builds: deckBonus()._builds, bonds: bonds.summary, poolInfo: poolInfo(), guide: guide("gacha"),
      pick(i, v) {
        /* P0-4：退出/返回绝不能被当成一次抽卡扣券 */
        if (v === "back" || v === "close" || v === "exit" || v === "next") return goNext();
        const ten = v === "ten";
        const cost = ten ? 9 : 1;
        if ((S.ticket || 0) < cost) return result("券不够", `你还有 ${S.ticket || 0} 张券。打比赛攒：常规赛赢一场 1 张，季后赛一场 3 张，国际赛赢一场 5 张，S 赛赢一场 8 张。`, "lose", goNext);
        S.ticket -= cost;
        const cards = [];
        for (let k = 0; k < (ten ? 10 : 1); k++) { const c = drawOne(); if (c) cards.push(c); }
        /* 抽完的“收下继续”直接走 next，不再回抽卡页（也就不会再扣一次券） */
        return scene({ type: "gacha", pulled: cards, ticket: S.ticket, next: next, bonds: bonds.summary, poolInfo: poolInfo(), pick() { return goNext(); } });
      }
    });
  }

  function deckScene(next) {
    const all = D.talents();
    const bag = (S.bag || []).map(id => all.filter(t => t.id === id)[0]).filter(Boolean);
    const byId = {};
    all.forEach(t => byId[t.id] = t);
    return scene({
      type: "deck", deck: (S.deck || []).map(id => id ? byId[id] : null), bag: bag,
      builds: deckBonus()._builds, bonds: deckBonds().summary,
      pick(i, v) {
        if (v === "back") return next ? next() : actionScene();
        if (v === "un") { const slot = clamp(i, 0, 4); S.deck[slot] = null; return deckScene(next); }
        const id = v;
        const all2 = D.talents();
        const card = all2.filter(t => t.id === id)[0];
        if ((S.deck || []).indexOf(id) >= 0) {
          return result("这张已经进卡槽了", `一个卡槽一张，重复上卡没有意义。想换方向就先点卡槽把它卸下来。`, "info", () => deckScene(next));
        }
        const slot = (S.deck || []).indexOf(null);
        if (slot < 0) {
          return result("五个槽满了", `先卸一张再装。满槽硬塞第一格这种事，联盟不管，但你的加成会骂人。`, "info", () => deckScene(next));
        }
        S.deck[slot] = id;
        if (card) S.timeline.push({ t: S.tick, text: `把「${card.name}」装进了卡槽` });
        return deckScene(next);
      }
    });
  }

  /* 商店：钱真的会少（P1-10）。欠债不能买；紧巴只能买 ≤5 万的；一次性商品买过就不再出现 */
  function shopScene(next) {
    const goNext = () => next ? next() : nextMonth();
    if (S.shopDone) return goNext();
    const mb = moneyBand(S.money);
    if (mb.key === "debt") {
      S.shopDone = true;
      return result("商店", "老板从柜台后面抬眼看了你一下，又低头继续刷手机。\n\n你想起自己卡里是负数，把手从货架上收了回来。", "lose", goNext);
    }
    S.shopBought = S.shopBought || {};
    /* W7：商店每赛段刷新（一次性商品按赛段重置），本赛段售价 +20%~40% */
    S.shopSeason = S.shopSeason || curSplit();
    if (S.shopSeason !== curSplit()) { S.shopSeason = curSplit(); S.shopBought = {}; }
    const sellMul = 1 + (.2 + (hashStr("shophike" + curSplit() + (S.teamId || "")) % 21) / 100);
    const all = ((window.DATA_SHOP && window.DATA_SHOP.items) || []).filter(it => it && !(it.once && S.shopBought[it.id]));
    const items = shuffle(all).slice(0, 5).map(it => ({
      id: it.id, n: it.name, name: it.name, d: it.desc, desc: it.desc, flavor: it.flavor || "",
      icon: it.icon, price: Math.round(it.price * sellMul * 10) / 10, basePrice: it.price, eff: it.eff || {}, once: !!it.once,
      bought: !!S.shopBought[it.id], detail: moneyDetail(it)
    }));
    /* W7 投资渠道：宽裕以上才看得到（房产/基金/股权），季度 −5% ~ +20% 浮动 */
    if (mb.key !== "tight" && mb.key !== "debt") {
      items.push(
        { id: "inv_house", n: "房产", name: "房产", d: "买一套小房子收租，季度结算浮动", desc: "买一套小房子收租", flavor: "中介说这个地段三年后会涨。", icon: "🏠", price: Math.round(8 * sellMul * 10) / 10, eff: { invest: "house", investAmt: 8 }, once: false, bought: false, detail: "投资 · 季度 −5%~+20%" },
        { id: "inv_fund", n: "基金", name: "基金", d: "签一份理财，季度结算浮动", desc: "签一份理财", flavor: "表格很长，你只看了收益率那一栏。", icon: "📈", price: Math.round(4 * sellMul * 10) / 10, eff: { invest: "fund", investAmt: 4 }, once: false, bought: false, detail: "投资 · 季度 −5%~+20%" },
        { id: "inv_equity", n: "股权", name: "股权", d: "买进一家电竞公司股份，季度结算浮动", desc: "买进电竞公司股份", flavor: "股东名册上多了一个 ID。", icon: "💼", price: Math.round(6 * sellMul * 10) / 10, eff: { invest: "equity", investAmt: 6 }, once: false, bought: false, detail: "投资 · 季度 −5%~+20%" }
      );
    }
    /* 资本玩家专属：钱够多时能买青训队/股权，退役线因此改写（见 ending） */
    if (S.money >= 600 && !S.academy) {
      items.push({ id: "inv_acad", n: "买下一支青训队", name: "买下一支青训队", d: "花钱把一支 LDL 青训队买下来，自己当老板", desc: "买青训队", flavor: "合同上你第一次签在「甲方」那一栏。", icon: "🏛", price: 400, eff: { invest: "acad" }, once: true, bought: !!S.shopBought.inv_acad, detail: "青训队 · 本局结局线改变" });
    }
    return scene({
      type: "shop", items: items, money: S.money, moneyBand: mb, next: next, splitNo: curSplit(), guide: guide("shop"),
      pick(i, v) {
        if (v === "skip") { S.shopDone = true; return goNext(); }
        if (v === "deck") return deckScene(() => shopScene(next));
        const it = items[clamp(Number(i) || 0, 0, items.length - 1)];
        if (!it) { S.shopDone = true; return goNext(); }
        if ((it.once && S.shopBought[it.id])) { S.shopDone = true; return goNext(); }
        if (mb.key === "tight" && it.price > 5) {
          return result("买不起", `「${it.name}」要 ${it.price} 万。你现在这个月的日子紧得连外卖都在算，先挑便宜的。`, "lose", () => { S.shopDone = true; return goNext(); });
        }
        if (S.money < it.price) return result("买不起", `${it.name} 要 ${it.price} 万，你兜里只有 ${Math.round(S.money)} 万。`, "lose", () => { S.shopDone = true; return goNext(); });
        S.money = Math.round((S.money - it.price) * 10) / 10;
        if (it.once) S.shopBought[it.id] = 1;
        const applied = applyShop(it);
        S.shopDone = true;
        S.timeline.push({ t: S.tick, text: `买了「${it.name}」（${it.price} 万）` });
        const text = (it.flavor ? it.flavor + "\n\n" : "") + applied.lines.join("\n") + `\n\n存款：${Math.round(S.money * 10) / 10} 万`;
        return result("买了 " + it.name, text, "win", () => {
          const s = goNext();
          if (s) { s.feedback = s.feedback || {}; s.feedback.lines = applied.lines; }
          return s;
        });
      }
    });
  }

  function moneyDetail(it) {
    const e = it.eff || {}, out = [];
    if (e.POOL || e.MECH || e.LANE || e.GAME || e.MENTAL || e.PHYS || e.FAME) out.push("属性");
    if (e.growth) out.push("永久成长");
    if (e.keyBonus) out.push("关键局");
    if (e.energyMax) out.push("精力上限");
    if (e.poolTrain) out.push("英雄熟练度");
    if (e.tickets) out.push("抽卡券");
    if (e.reveal) out.push("BP 情报");
    if (e.banPlus) out.push("ban 位");
    if (e.pickStat3) out.push("3 个月成长");
    if (e.stat3) out.push("三项属性");
    if (e.mentalShield) out.push("心理护盾");
    if (e.energyFull) out.push("精力回满");
    if (e.energy) out.push("精力 " + e.energy);
    if (e.healInjury) out.push("疗伤");
    return out.join(" · ");
  }

  /* 返回 {lines:[...]}：商店结果/下一屏 feedback 都显示这笔钱换来了什么 */
  function applyShop(it) {
    const e = it.eff || {};
    const lines = [];
    S.invest = S.invest || {};
    for (const k in e) {
      const v = e[k];
      if (STATS.indexOf(k) >= 0) { S.st[k] = clamp(S.st[k] + v, 0, Math.min(100, S.pot + 12)); continue; }
      if (k === "growth") { S.invest.growth = (S.invest.growth || 0) + v; lines.push("永久成长 +" + Math.round(v * 100) + "%"); }
      else if (k === "keyBonus") { S.gearBonus = (S.gearBonus || 0) + v; lines.push("关键局成功率 +" + v + "%"); }
      else if (k === "tickets") { S.ticket = (S.ticket || 0) + v; lines.push("抽卡券 +" + v + "（现在 " + S.ticket + " 张）"); }
      else if (k === "mental") { S.morale = clamp(S.morale + v, 0, 100); lines.push("心态 +" + v); }
      else if (k === "mentalShield") { S.invest.mentalShield = (S.invest.mentalShield || 0) + v; lines.push("心理护盾 ×" + S.invest.mentalShield + "：下次心态受挫伤害减半"); }
      else if (k === "energyFull") { S.energy = energyMax(); lines.push("精力回满（" + Math.round(S.energy) + "/" + energyMax() + "）"); }
      else if (k === "energy") { S.energy = clampEnergy(S.energy + v); lines.push("精力 " + (v > 0 ? "+" + v : v) + "（现在 " + Math.round(S.energy) + "/" + energyMax() + "）"); }
      else if (k === "healInjury") {
        if (M.injury) { lines.push("伤好了：" + M.injury.part + "不再碍事"); M.injury = null; }
        S.inj = clamp((S.inj || 0) - .04, 0, .8);
        lines.push("伤病概率 −4%（现在 " + Math.round((S.inj || 0) * 100) + "%）");
      }
      else if (k === "energyMax") { S.invest.energyMax = 1; lines.push("精力上限 +10（现在 " + energyMax() + "）"); }
      else if (k === "reveal") { S.invest.data = 1; lines.push("BP 阶段可以多看一个对手倾向"); }
      else if (k === "TEAM") { S.teamStatus = clamp(S.teamStatus + v, 0, 100); lines.push("团队 +" + v); }
      else if (k === "spirit") { S.spirit = clamp((S.spirit || 60) + v, 0, 100); lines.push("士气 +" + v); }
      else if (k === "money") { S.money = Math.round((S.money + v) * 10) / 10; lines.push("现金 " + (v > 0 ? "+" : "") + v + " 万"); }
      else if (k === "pickStat3") {
        const stat = pick(["LANE", "MECH", "GAME", "POOL", "MENTAL", "PHYS", "TEAM"]);
        S.invest.stat3 = { stat: stat, left: 3, v: v };
        lines.push("私教：未来 3 个月，每月「" + (CN[stat] || stat) + "」+" + v);
      }
      else if (k === "stat3") {
        const nine = ["LANE", "MECH", "GAME", "POOL", "MENTAL", "PHYS"];
        const chosen = shuffle(nine).slice(0, 3);
        chosen.forEach(sk => { S.st[sk] = clamp(S.st[sk] + v, 0, Math.min(100, S.pot + 12)); });
        lines.push("三项属性 +" + v + "：" + chosen.map(sk => CN[sk] || sk).join("、"));
      }
      else if (k === "poolTrain") {
        const hero = (it.heroPick && S.pool[it.heroPick] !== undefined) ? it.heroPick : autoHero();
        if (hero) {
          const before = S.pool[hero] || 0;
          S.pool[hero] = clamp(before + v, 0, 99);
          lines.push("英雄特训：「" + hero + "」熟练度 " + Math.round(before) + " → " + Math.round(S.pool[hero]));
        } else {
          S.invest.heroPickPending = { v: v, item: it.id };
          lines.push("英雄特训：待选择特训英雄（先记着，UI 选完再生效）");
        }
      }
      else if (k === "invest") {
        if (v === "acad") {
          S.academy = true;
          S.timeline.push({ t: S.tick, text: "买下一支青训队，自己当老板" });
          lines.push("你买下了一支青训队：从今往后你不只是选手，还是老板（结局线已改写）");
        } else {
          const amt = Math.round((Number(it.price) || Number(e.investAmt) || 0) * 10) / 10;
          S.invest2 = S.invest2 || {};
          S.invest2[v] = (S.invest2[v] || 0) + amt;
          S.money = Math.round((S.money + amt) * 10) / 10; /* 现金换成资产，不算花掉 */
          lines.push("投入" + ({ house: "房产", fund: "基金", equity: "股权" }[v] || v) + " " + amt + " 万（季度 −5%~+20% 浮动，累计 " + S.invest2[v] + " 万）");
        }
      }
      else if (k === "banPlus") {
        /* 分析师是“本赛段”限定：写 banPlusSplit，由赛段切换清零；永久型才写 banPlus */
        if (it.id === "sh_bp" || it.split) {
          S.invest.banPlusSplit = (S.invest.banPlusSplit || 0) + v;
          lines.push("本赛段 ban 位 +" + v + "（赛段切换清零，现在 " + S.invest.banPlusSplit + "）");
        } else {
          S.invest.banPlus = (S.invest.banPlus || 0) + v;
          lines.push("ban 位 +" + v);
        }
      }
    }
    if (it.once) S.shopBought[it.id] = 1;
    if (!lines.length) lines.push(it.desc || "买了个心安。");
    return { lines: lines };
  }


  /* ================= 转会 / 升级 ================= */
  function transferMonth() {
    const ldl = S.stage === "LDL";
    const my = myOvr(), fame = S.st.FAME, v = voice();
    const yearSplits = (S.record.splits || []).filter(x => x.year === S._ml.year);
    /* P1-4：任赛段冠军，或德玛西亚杯前四，都算「有成绩」 */
    const dem = (S.record.demacia && S.record.demacia.year === S._ml.year) ? S.record.demacia : null;
    const demTop = !!(dem && dem.place >= 1 && dem.place <= 4);
    const champ = yearSplits.some(x => x.win) || demTop;
    const bestPlace = yearSplits.reduce((a, x) => Math.min(a, x.place || 99), 99);
    const best = bestPlace <= 2 ? 3 : bestPlace <= 4 ? 2 : bestPlace <= 6 ? 1 : 0;
    const tierNeed = { S: 80, A: 74, B: 69, C: 65 };
    const offers = [];
    allTeams().filter(t => t.region === "LPL" && t.id !== S.teamId).forEach(t => {
      const need = tierNeed[t.tier] || 69;
      let p = 0;
      if (my >= need + 4) p = .85;
      else if (my >= need) p = .6;
      else if (my >= need - 3) p = .25;
      else if (my >= need - 6) p = .07;
      if (p > 0) {
        if (champ) p *= 1.45;
        if (demTop) p *= 1.25;
        if (dem && dem.place === 1) p *= 1.15;
        if (best >= 3) p *= 1.25;
        if (fame >= 55) p *= 1.2;
        if (ldl) p *= champ ? 1 : .5;
      }
      if (!chance(clamp(p, 0, .96))) return;
      offers.push({
        id: t.id, name: t.name, tier: t.tier,
        salary: Math.max(20, Math.round(6 + (my - 60) * .9 + (t.budget || 5) * 2.2 + (S.st.FAME - 50) * .5)),
        desc: t.blurb || "", vibe: t.vibe || 60
      });
    });
    offers.sort((a, b) => (b.salary + (b.vibe - 60) / 8) - (a.salary + (a.vibe - 60) / 8));
    if (!offers.length && ldl && champ) {
      const t = allTeams().filter(x => x.region === "LPL").sort((a, b) => (a.tier > b.tier ? 1 : -1))[0];
      if (t) offers.push({ id: t.id, name: t.name, tier: t.tier, salary: Math.max(20, Math.round(6 + (my - 60) * .7 + (S.st.FAME - 50) * .4)), desc: t.blurb || "", vibe: t.vibe || 60 });
    }
    if (!offers.length) {
      if (S.endless && S.season >= 4) return retireScene();
      return result(ldl ? "无人问津" : "安静的一个月", ldl
        ? "LDL 打完了，没有一个 LPL 队给你打电话。你在基地收拾东西，经理说：明年再打一年吧，工资照旧。"
        : "转会期一条报价都没有。你在基地刷手机，看着别人官宣，把自己的训练赛录像又看了一遍。", "lose",
        () => { S.timeline.push({ t: S.tick, text: ldl ? "LDL 再打一年" : "留队" }); return nextMonth(); });
    }
    return scene({
      type: "transfer", offers: offers.slice(0, 3), current: S.teamId, ldl, voice: v, champ, best,
      canRetire: S.endless && S.season >= 4,
      pick(i, act) {
        if (act === "retire") return retireScene();
        if (act === "stay" || i < 0) {
          /* 留下：原地不动，更衣室的话语权反而更稳 */
          S.voiceReset = clamp((S.voiceReset || 0) - 6, 0, 60);
          S.teamStatus = clamp((S.teamStatus || 55) + 3, 0, 100);
          return result("留下", ldl ? "你决定再打一年 LDL。工资没涨，心气还在。队友知道你不会走，说话的分量比去年重一点。" : "你留在原队。经理拍了拍你的肩，说这才是职业态度。更衣室里你的位置还是那个，没人来抢。", "info", () => nextMonth());
        }
        const o = offers[i];
        if (!o) return nextMonth();
        const from = (teamOf(S.teamId) || {}).name || "LDL";
        const fromT = teamOf(S.teamId) || {};
        S.teamId = o.id; S.salary = o.salary; S.contractLeft = rint(1, 2);
        if (ldl) { S.stage = "LPL"; S.st.FAME = clamp(S.st.FAME + 6, 0, 98); S.fans += rint(20000, 60000); }
        /* 换队 = 更衣室重新排座次：话语权临时下调，新教练不认识你，队里也没有你的位置 */
        const tierJump = (o.tier || "B") < (fromT.tier || "C") ? 6 : 0;   // 往上跳一档，说话更没人听
        const vLoss = (ldl ? 26 : 18) + tierJump;
        S.voiceReset = clamp((S.voiceReset || 0) + vLoss, 0, 60);
        S.coachTrust = clamp((S.coachTrust || 55) - (ldl ? 12 : 8), 5, 100);
        S.teamStatus = clamp((S.teamStatus || 55) - 10, 5, 100);
        S.timeline.push({ t: S.tick, text: `${ldl ? "登陆 LPL" : "转会"}：${from} → ${o.name}（话语权临时 −${vLoss}）` });
        return result(ldl ? "登陆 LPL" : "转会", (ldl
          ? `你签了 ${o.name}，年薪 ${o.salary} 万。签字的时候手有点抖，不是紧张，是笔太便宜。`
          : `你从 ${from} 转到 ${o.name}，年薪 ${o.salary} 万。新队服还没做，先穿着旧队服拍了定妆照。`)
          + `\n\n新队没人听你的：话语权临时 −${vLoss}，教练组要重新认识你，队里也没有你说话的份。磨合两三个月，攒回来靠自己。`, ldl ? "win" : "info", () => nextMonth());
      }
    });
  }

  /* ================= 退役 ================= */
  function retireScene() {
    return scene({
      type: "retire", age: S.age, season: S.season,
      seasons: seasonSummary(), ovr: myOvr(),
      pick(i) {
        if (i === 1) return ending("retire");
        S.timeline.push({ t: S.tick, text: "决定再打一年" });
        return result("还想打", `第 ${S.season} 年，你 ${S.age} 岁。经理问你确定吗，你说确定。他叹了口气，把续约合同推过来。`, "info", () => nextMonth());
      }
    });
  }

  /* ================= 论坛 / 虎扑评分 ================= */
  /* ================= 抗压背锅吧 ================= */
  function barFill(t) {
    const team = (teamOf(S.teamId) || {}).name || "我这队";
    return String(t || "")
      .replace(/\{name\}/g, S.name || "我")
      .replace(/\{team\}/g, team)
      .replace(/\{opp\}/g, S.lastOpp || "对面")
      .replace(/\{pos\}/g, POSCN[S.pos] || "");
  }
  function barThread(p) {
    const B = window.DATA_BAR || {};
    const pool = ((B.replyPool || {})[p.cat] || []).slice();
    const users = B.users && B.users.length ? B.users : ["匿名吧友"];
    const rep = (p.replies || []).slice();
    shuffle(pool).slice(0, rint(2, 3)).forEach(t => rep.push({ u: pick(users), t: t, up: rint(0, 999) }));
    return {
      id: p.id, cat: p.cat, heat: p.heat || "新", title: barFill(p.title), body: barFill(p.body),
      replies: rep.map(r => ({ u: r.u || "匿名", t: barFill(r.t), up: r.up || 0 }))
    };
  }
  function barScene(ctx, next) {
    const B = window.DATA_BAR || {};
    const posts = shuffle((B.posts || []).slice()).slice(0, 3);
    const go = () => (next ? next() : monthEnd());
    if (!posts.length) return go();
    const threads = posts.map(barThread);
    return scene({
      type: "bar", ctx: ctx || {},
      threads: threads,
      fans: S.fans, haters: S.haters, hupu: S.hupu || 6,
      pick(i, v) {
        if (v === "ignore") {
          S.morale = clamp(S.morale + 4, 0, 100);
          S.energy = clamp(S.energy + 4, 0, 100);
          return result("你把手机关了", "你把手机扣在床头，屏幕朝下。吧里的帖子还在涨，楼里已经有人开始给你编家谱了。你睡着了，这是这个月唯一一次没做梦。", "good", go);
        }
        if (v === "smurf") {
          S.st.FAME = clamp(S.st.FAME - 1, 0, 98);
          S.haters += rint(300, 900);
          S.spirit = clamp((S.spirit || 60) + 5, 0, 100);
          S.story = S.story || { corrupt: 0, justice: 0, scandal: 0, secret: 0 };
          S.story.scandal += 1;
          S.coachTrust = clamp(S.coachTrust - 1, 0, 100);
          return result("你开了个小号", "你用小号回了一句“楼主说得对”，然后又用另一个小号回“楼上是个傻逼”，接着两个小号对骂了四十楼。凌晨四点你笑出声，第二天训练赛你打出了这辈子最烂的一把。", "bad", go);
        }
        const th = threads[i] || null;
        const title = th ? th.title : "那个帖子";
        const roll = rint(1, 20) + Math.floor((S.st.MENTAL - 50) / 5) + Math.floor((S.morale - 50) / 12);
        if (roll >= 13) {
          S.fans += rint(500, 3000);
          S.haters += rint(200, 1200);
          S.st.FAME = clamp(S.st.FAME + 2, 0, 98);
          S.spirit = clamp((S.spirit || 60) + 6, 0, 100);
          S.morale = clamp(S.morale + 3, 0, 100);
          S.hupu = clamp((S.hupu || 6) + .2, 0, 10);
          return result("你亲自下场", `你在《${title}》底下回了一楼，语气比你的操作还硬。截图五分钟内传遍所有群，路人开始说“这人挺有意思”，黑子开始说“急了”。你队里没人说话，教练在你后面站了很久。`, "win", go);
        }
        S.morale = clamp(S.morale - 8, 0, 100);
        S.haters += rint(600, 2000);
        S.spirit = clamp((S.spirit || 60) - 4, 0, 100);
        return result("你亲自下场，然后被打脸", `你在《${title}》底下回了一楼。对面吧友只回了一张图：你那把 0/7 的战绩。楼瞬间歪成对你不利的形状，两小时盖到八百层。你把手机摔在枕头里，第二天眼睛是肿的。`, "lose", go);
      }
    });
  }

  /* 奖金：跟着冠军走，钱要能看见 */
  function prize(kind) {
    const P = {
      worlds: [2000, 300000], worlds2: [600, 120000], worlds4: [150, 40000],
      msi: [500, 80000], first: [150, 30000], intl2: [100, 20000],
      split: [80, 20000], split2: [20, 6000]
    }[kind] || [0, 0];
    S.money = Math.round((S.money + P[0]) * 10) / 10;
    S.fans += P[1];
    if (P[0] > 0) S.timeline.push({ t: S.tick, text: `奖金到账 ${P[0]} 万` });
    return P[0];
  }

  /* ================= 赛后开麦 =================
   * 每场 BO 结束（输了必采 / 赢下收官战），麦克风递到你面前：
   * 你选的这句会成为论坛第一条 + 时间线记录，效果来自 DATA_TALK。
   */
  function fillTok(x, opp) {
    const tm = teamOf(S.teamId) || {};
    return String(x == null ? "" : x)
      .replace(/\{name\}/g, S.name || "我")
      .replace(/\{team\}/g, tm.name || "")
      .replace(/\{opp\}/g, opp || (M.series && M.series.oppName) || "对手")
      .replace(/\{pos\}/g, (window.DATA_POS[S.pos] || {}).name || "");
  }

  /* ================= 名场面处刑池 =================
   * 只吃关键局（BO5 决胜局）的那个回合：平时怎么送都没事，
   * 决胜局送一次会被记一辈子。数据在 js/data/moments.js。
   */
  function momentPool() {
    const all = window.DATA_MOMENTS || [];
    const out = [];
    for (const m of all) {
      if (!m || m.cat !== "inGame" || !Array.isArray(m.opts) || m.opts.length < 2) continue;
      const c = m.cond || {};
      if (!c.key) continue;
      if (c.stage && c.stage.indexOf(S.stage) < 0) continue;
      if (c.months && c.months.indexOf(S._ml.month) < 0) continue;
      if (c.minOvr && myOvr() < c.minOvr) continue;
      if (c.teamCam && (S.teamStatus || 0) < c.teamCam) continue;
      if (c.pos && c.pos.indexOf(S.pos) < 0) continue;
      if (m.once !== false && (S.seenMoments || []).indexOf(m.id) >= 0) continue;
      out.push(m);
    }
    return out;
  }

  function pickMoment() {
    const pool = momentPool();
    if (!pool.length) return null;
    let total = 0;
    for (const m of pool) total += Math.max(1, m.weight || 4);
    let r = rnd() * total;
    for (const m of pool) { r -= Math.max(1, m.weight || 4); if (r <= 0) return m; }
    return pool[pool.length - 1];
  }

  function recordMoment(mm, tag, hit) {
    const bo = M.series || {};
    S.seenMoments = S.seenMoments || [];
    S.seenMoments.push(mm.id);
    S.moments = S.moments || [];
    S.moments.push({
      tick: S.tick, year: S._ml.year, month: S._ml.month, id: mm.id, title: fillTok(mm.title),
      tag: tag, hit: !!hit, replay: fillTok(mm.replay || ""), opp: bo.oppName || "", stage: S.stage
    });
    if (S.moments.length > 60) S.moments.shift();
    S.timeline.push({ t: S.tick, text: (hit ? "名场面：" : "翻车：") + fillTok(mm.title) });
    if (mm.hot) {
      S.momentHot = { head: fillTok(mm.hot.head), post: fillTok(mm.hot.post), tone: mm.hot.tone || "mixed" };
    }
    S.highlightCount = (S.highlightCount || 0) + (hit ? 1 : 0);
    if (hit) {
      S.st.FAME = clamp(S.st.FAME + 1, 0, 98);
      S.burst = clamp((S.burst || 0) + 10, 0, 100);
    }
    if (window.LIVE) { try { window.LIVE.burst([tag], { force: true }); } catch (e) { } }
  }

  function talkScene(meta, next) {
    const TK = window.DATA_TALK || {};
    const won = !!meta.won;
    const tone = won ? (meta.l === 0 ? "stomp" : "win") : (meta.w === 0 ? "stompLoss" : "lose");
    const tm = teamOf(S.teamId) || {};
    const fill = x => String(x == null ? "" : x)
      .replace(/\{name\}/g, S.name)
      .replace(/\{team\}/g, tm.name || "")
      .replace(/\{opp\}/g, meta.opp || "对手")
      .replace(/\{pos\}/g, (window.DATA_POS[S.pos] || {}).name || "");
    const A = shuffle((TK[tone] || []).slice()).slice(0, 3);
    const N = shuffle((TK.neutral || []).slice()).slice(0, 1);
    const chosen = shuffle(A.concat(N)).filter(Boolean);
    const where = meta.kind === "worlds" ? "世界赛" : meta.kind === "intl" ? "国际赛" : splitLabel(M.split || 1);
    return scene({
      type: "talk",
      kicker: "开麦 · MIC",
      where: where,
      score: meta.w + ":" + meta.l,
      opp: fill(meta.opp || "对手"),
      won: won,
      tone: tone,
      ask: won
        ? "混采区。麦克风递过来，记者问你今天赢在哪。"
        : "混采区。麦克风递过来，记者问你今天到底输在哪。",
      opts: chosen.map(o => ({ id: o.id, opt: fill(o.opt), hint: fill(o.hint), line: fill(o.line) })),
      pick(i) {
        const o = chosen[i];
        if (!o) return next ? next() : monthEnd();
        applyEff(o.eff);
        const line = fill(o.line);
        const talk = {
          line: line,
          tag: fill(o.tag || "{name} 赛后发言"),
          follow: (o.follow || []).map(fill),
          tone: tone,
          year: S._ml.year
        };
        S.lastTalk = talk;
        S.talks = (S.talks || 0) + 1;
        if (!S.talkBest || (o.eff && o.eff.FAME >= 5)) S.talkBest = line;
        S.timeline.push({ t: S.tick, text: "开麦：" + (line.length > 20 ? line.slice(0, 20) + "…" : line) });
        return next ? next() : monthEnd();
      }
    });
  }

  function forumScene(ctx, next) {
    if (M.pendingTalk) {
      const pt = M.pendingTalk;
      M.pendingTalk = null;
      return talkScene(pt, () => forumScene(ctx, next));
    }
    const GP = window.DATA_GOSSIP || {};
    const forum = GP.forum || {};
    const win = (ctx.w || 0) > (ctx.l || 0);
    const perf = clamp(ctx.perf == null ? (win ? 62 : 42) : ctx.perf, 0, 100);
    let pool = win ? (forum.hype || []) : (forum.rage || []);
    if (chance(.35)) pool = pool.concat(forum.delusion || []);
    if (!win && chance(.25)) pool = pool.concat(forum.doom || []);
    const posts = shuffle(pool).slice(0, 2);
    const talk = S.lastTalk;
    S.lastTalk = null;
    if (talk) posts.unshift({ t: talk.tag, body: talk.line, replies: (talk.follow || []).slice(0, 3), heat: 99, mine: true });
    const band = String(clamp(Math.round(perf / 10), 1, 10));
    const rating = shuffle((((GP.rating || {})[band]) || []).slice()).slice(0, 3);
    const score = Math.round(perf) / 10;
    if (!ctx.silent) {
      S.hupu = clamp(score, 0, 10);
      S.st.FAME = clamp(S.st.FAME + (win ? 1 : -1), 0, 98);
      if (win) { S.fans += rint(400, 2500); S.haters = Math.max(0, S.haters - rint(100, 400)); }
      else { S.fans = Math.max(0, S.fans - rint(100, 900)); S.haters += rint(200, 800); }
    }
    return scene({
      type: "forum", ctx: ctx, posts: posts, rating: rating, score: score.toFixed(1),
      fans: S.fans, haters: S.haters, hupu: S.hupu,
      pick() {
        const go = () => (next ? next() : monthEnd());
        if (window.DATA_BAR && (win ? chance(.6) : chance(.75))) return barScene(ctx, go);
        return go();
      }
    });
  }

  /* ================= 结局 ================= */
  function ending(reason) {
    S.ended = true;
    /* 结局之后不能再从 auto 档读回“还没结局”的状态（P0-5） */
    try { localStorage.removeItem(KEY + "auto"); } catch (e) { }
    const titles = S.record.titles || [];
    const worldTitle = titles.some(t => t.indexOf("世界赛决赛") >= 0 || t === "全球总决赛冠军");
    let end;
    const hasWorlds = titles.indexOf("全球总决赛冠军") >= 0;
    const hasMsi = titles.indexOf("MSI 冠军") >= 0;
    const worldsRuns = S.record.worlds || [];
    const bestWorlds = worldsRuns.length ? worldsRuns[worldsRuns.length - 1].best : null;
    const story = S.story || { corrupt: 0, justice: 0, scandal: 0, secret: 0 };
    /* 无尽模式打十几季，冠军数门槛按季数折算；三年之约保持原值 */
    const TV = n => (S.endless ? Math.max(n, Math.round(n * Math.max(1, S.season || 1) / 3)) : n);
    /* —— 故事线结局：你在暗处做的事，最后会追上你 —— */
    if (reason === "dead" || story.corrupt >= 60) {
      end = { name: "人间蒸发", rank: "X", sub: "查无此人，也查无此案",
        text: "公告只有一句话：因个人原因，即日起不再参与任何相关活动。没有记者会，没有告别。你退掉了基地的房间，退掉了所有群，手机号换了。有人在论坛发帖问你去哪了，帖子活了三分钟。\n\n你确实拿过钱。你也确实赢了那几场不该赢的。这几年攒下的每一分，最后都换成了一个没人敢提的名字。" };
    } else if (reason === "banned" || (story.banned || 0) >= 1) {
      end = { name: "终身禁赛", rank: "X-", sub: "联盟公告第 114 号",
        text: "处罚公告在周五下午五点发出，全文八百字，你的名字出现十四次。俱乐部十分钟后转发，配文“坚决拥护”。赞助商的动作更快，你的海报在半小时内从所有商场撤了下来。\n\n禁赛期是永久。你二十三岁，职业生涯到此为止，连退役仪式都没有资格办。\n\n之后的几年你在老家开过一家网吧，店名叫得很随便。偶尔有客人认出你，会问一句“你是不是那个……”，你说不是，认错人了。电视里放到联赛，你会把声音关掉。" };
    } else if (reason === "blood" || (story.blood || 0) >= 1) {
      end = { name: "刀口余生", rank: "C+", sub: "有人在门口等你",
        text: "那天你从基地出来，路灯坏了一路。后来警察调监控，画面里只有两个人影，一个站着，一个走了。\n\n你在医院躺了三周，俱乐部发了声明，说这是“个别极端粉丝的行为”，联盟承诺加强安保。第二个月你就解约了，不是被赶走的，是你自己待不下去了。\n\n手上的伤可以好，但你再也无法在开镜的瞬间不去看身后。复出试训那天，你在基地门口站了很久，最后没进去。" };
    } else if (reason === "stalker" || (story.stalker || 0) >= 2) {
      end = { name: "被追着跑的人", rank: "B-", sub: "你没做错什么",
        text: "先是私信，然后是酒店大堂，然后是凌晨三点的敲门。你换了三个手机号，搬了两次家，基地的保安被嘱咐记住那张脸。\n\n舆论最热的时候，你打得最好。但你发现自己开始躲镜头，赛后采访能推就推，赢了也不想笑。\n\n退役那天你没办仪式，直接从侧门走的。后来有人在别的城市见过你，说你看起来很普通，普通到没人会认出来——这正是你想要的。" };
    } else if (story.scandal >= 34 && story.justice < 14) {
      end = { name: "塌房", rank: "C-", sub: "黑料比成绩长",
        text: "你的最后一次上热搜不是因为比赛。赞助商半夜撤了物料，俱乐部发了六十字声明，评论区的第一条是“早看出来了”。\n\n你确实打得好过。但人们记住的是那些截图。\n\n三个月后你开了个直播间，标题写着“聊聊当年”。在线人数冲到五万，弹幕一半在骂，一半在刷同一个梗。你笑着把梗接了下去，那一下比退役还难受。" };
    } else if (story.justice >= 20 && story.corrupt <= 8 && !hasWorlds) {
      end = { name: "干净的人", rank: "B+", sub: "没拿过冠军，也没脏过手",
        text: "这行里最难的不是夺冠，是三年下来还能抬头看人。有人劝过你，有人给过你机会，你都推了。\n\n退役那天，老队友在评论里写了一句：这人傻，但他干净。\n\n后来你去做青训教练，第一堂课讲的是合同和底线，不是补刀。有孩子问你后不后悔没拿过冠军，你说：我睡得着。" };
    } else if ((S.money || 0) <= -40 && !hasWorlds) {
      end = { name: "债务缠身", rank: "C", sub: "打职业三年，欠了一屁股债",
        text: "你退役那天，手机里最上面三条消息是三个催收。生涯奖金、工资、赞助，一分没存下来，全填进了生活费、伤病和高利贷的窟窿。\n\n你还是能打出好操作。但没人会为一个月光族开一份长合同。回老家的火车上，你把游戏卸了，又装回来了。\n\n第二年你开始接陪玩，一小时八十。有个老板夸你意识好，问你是不是打过职业。你说没有，只是玩得多。" };
    } else if (hasWorlds) end = { name: "登神", rank: "S+", sub: "世界冠军", text: "召唤师奖杯上刻着你的 ID。三年前你还在 LDL 基地抢泡面，现在全世界的解说说你名字的时候会先清一下嗓子。\n\n夺冠那晚你被队友扛在肩上绕场一周，闪光灯亮成一片。回到后台你一个人坐了很久，手机里全是没回的消息，包括三年前那个劝你“要不别打了”的人。\n\n你把那条消息回了两个字：赢了。" };
    else if (hasMsi && titles.length >= 2) end = { name: "无冕之王", rank: "S", sub: "就差那一个", text: "MSI 拿过，联赛拿过，就差十一月那个。每年世界赛结束，你都会把那场 BO5 的录像再点开一次，看到第三局就关掉。\n\n退役仪式上主持人说你是“这个赛区最接近完美的选手”。你笑着点头，心里清楚“最接近”三个字落在哪个位置。\n\n奖杯柜最上面那层空着，一直没放东西。你太太说要不摆点别的，你说不用，就这样挺好。" };
    /* —— LCK 支线结局：去首尔三年，三种收场（数据里 opt.ending 指向这三个 reason） —— */
    else if (reason === "lck_champ") end = { name: "汉江之王", rank: (myOvr() >= 86 ? "S" : myOvr() >= 78 ? "A+" : "A"), sub: "LCK 的奖杯，写着一个中国人的名字", text: "决赛在首尔，你赢了。韩文解说愣了两秒才念出你的 ID，观众席先静了一下，然后鼓掌。\n\n三年里你学会了用韩语点外卖、骂裁判、跟队友吵架又和好。你把 LPL 的那套东西带过去，又在那边把另一套东西学了回来。\n\n回国那天有记者在机场堵你，问这算不算“叛徒的胜利”。你说不是，这是职业选手的胜利。然后你把奖杯举起来，让他们拍。" };
    else if (reason === "lck_home") end = { name: "带着体系回来", rank: "A", sub: "首尔学的东西，带回了 LPL", text: "你没能拿到 LCK 的冠军，但你学会了他们怎么把一个新人变成体系的一部分。\n\n回国后你进了教练组，第一年就把那套东西拆开，按 LPL 的节奏重新拼了一遍。有人骂你“学韩国人”，也有人说这支队终于会打运营了。\n\n你自己清楚，那三年没白待。奖杯不在你手里，但在你带出来的人手里。" };
    else if (reason === "lck_burn") end = { name: "首尔失速", rank: "C-", sub: "去的时候是天才，回来的时候是新闻里的名字", text: "第一年你打得很好，第二年版本一变，你成了替补席上最贵的那个人。\n\n第三年合同到期，没有队伍续约。你拖着行李箱从仁川机场出来，接机的人只有你妈。\n\n后来有人在论坛问“当年那个去 LCK 的中单现在在哪”，底下回复：别提了。" };
    else if (bestWorlds === "决赛" || bestWorlds === "四强") end = { name: "人间理想", rank: "A+", sub: "世界赛四强", text: "你打到过世界赛的半决赛。这成绩放在 LPL 不算顶，但足够让你回老家时，被小区保安认出来。\n\n那场半决赛第五局，你的操作至今还在赛事集锦里循环播放。弹幕每次都会刷一句“如果那波不退就好了”。你也这么想过，想了三年。\n\n退役后你在这座城市买了房，离基地两站地铁。有时候加班到很晚，你会绕一下，从基地楼下走过去，灯还亮着。" };
    /* —— 国内荣誉分档：三年拿到的冠军数量决定“国内”这条线的天花板 —— */
    else if (!hasWorlds && titles.length >= TV(14) && S.st.FAME >= 97 && myOvr() >= (S.endless ? 82 : 72)) end = { name: "赛区神话", rank: "S+", sub: "三年，国内没人是你的对手", text: "三年，十四个冠军。决赛你打得太多了，多到后来赢的时候，你第一反应是看表，算颁奖还要站多久。\n\n其他队的教练开会研究你，研究了三年，结论是“等他退役”。你的英雄池被做成课程卖，青训营报名表上有一栏：最想成为的选手。\n\n世界赛你一次都没赢下来，这是唯一的遗憾。但国内这条线，你已经是天花板了。退役那天联盟把三年的冠军奖杯摆成一排，让你站中间拍照。你拍了，然后问：能帮我搬回家吗。" };
    else if (!hasWorlds && titles.length >= TV(12) && S.st.FAME >= 94 && myOvr() >= (S.endless ? 80 : 74)) end = { name: "赛区之王", rank: "S", sub: "国内赢到没有对手", text: "你在国内赢得太稳了，稳到解说都开始用“例行公事”形容你的决赛。奖杯一个接一个，赞助商排队，联盟的年度最佳拿到手软。\n\n只有你自己知道，每次出国回来，时差倒不过来，躺在酒店床上会想：如果他们那边也打国内这套，我还能赢吗。\n\n这个问题没有答案。但你退役那天，赛区做了一个专题片，标题叫《三年》。片尾打出一行字：他赢下了这里能赢的一切。" };
    else if (titles.length >= TV(12) && myOvr() >= (S.endless ? 74 : 70)) end = { name: "国内霸主", rank: "A+", sub: "联赛之王", text: "国内该拿的都拿了。虎扑上有人做了张图：LPL 三年，你的 ID 出现次数比解说词还多。\n\n你在国内赢到没人想跟你打训练赛，出国就被人针对。这不是你的错，但骂声最后都落在你身上。\n\n退役那天联盟给你颁了个“赛区贡献奖”，你捧着那个水晶牌子，忽然想起第一次拿联赛冠军时，奖杯比这个沉得多。" };
    else if (titles.length >= TV(10) && myOvr() >= (S.endless ? 72 : 68)) end = { name: "国内霸主", rank: "A", sub: "联赛之王", text: "国内该拿的都拿了。虎扑上有人做了张图：LPL 三年，你的 ID 出现次数比解说词还多。\n\n你在国内赢到没人想跟你打训练赛，出国就被人针对。这不是你的错，但骂声最后都落在你身上。\n\n退役那天联盟给你颁了个“赛区贡献奖”，你捧着那个水晶牌子，忽然想起第一次拿联赛冠军时，奖杯比这个沉得多。" };
    else if (titles.length >= TV(10) && myOvr() >= 64) end = { name: "国内霸主", rank: "A-", sub: "联赛之王（差一口气）", text: "国内该拿的都拿了。虎扑上有人做了张图：LPL 三年，你的 ID 出现次数比解说词还多。\n\n你在国内赢到没人想跟你打训练赛，出国就被人针对。这不是你的错，但骂声最后都落在你身上。\n\n退役那天联盟给你颁了个“赛区贡献奖”，你捧着那个水晶牌子，忽然想起第一次拿联赛冠军时，奖杯比这个沉得多。" };
    else if (titles.length >= TV(10)) end = { name: "打不动了", rank: "C+", sub: "冠军拿过，身体先退役", text: "你的冠军比很多人都多，最后大家记住的却是你退场时的样子：手抬到一半，护腕掉在地上。\n\n最后一年你还在赢，但每赢一场要缓三天。队医的报告越写越长，教练开始给你挑对手，管理层讨论的是“要不要体面地送他走”。\n\n退役发布会很短。有记者问，如果少打两年，会不会打得更久。你笑了一下，说：那我可能一个冠军都没有。" };
    else if (titles.length >= TV(8)) end = { name: "联赛常客", rank: "B+", sub: "冠军拿过，但不多", text: "你拿过冠军，不止一个，但也没到统治的程度。每次夺冠之后，版本一变，你又得从头学起。\n\n三年里你搬了四次基地，换过三个辅助。最巅峰的那半年，你觉得谁都能打；剩下的两年半，你在跟版本较劲。\n\n退役那天没有发布会。你在群里发了个红包，说谢谢大家，然后一个人去楼下的面馆吃了顿加辣的。" };
    else if (titles.length >= TV(3) && myOvr() >= (S.endless ? 78 : 73)) end = { name: "联赛顶级", rank: "A-", sub: "冠军不多，赢的是球", text: "你的冠军数不算多，但你的名字一直在 MVP 讨论里。最后一年，你的对位数据还在赛区前三，训练赛里没人愿意跟你走同一条线。\n\n问题从来不是你的操作，是冠军要五个人的运气一起刚好。你赶上了版本，没赶上队友；最该赢的那年夏决，输在一把抢龙上，龙的血条你想了三年。\n\n退役那天有人翻出你的胜率曲线，说你被低估了。你说：打得好不好，我自己知道。然后关了直播，去楼下买了瓶水。" };
    else if (titles.length >= TV(5)) end = { name: "联赛常客", rank: "B+", sub: "冠军拿过，但不多", text: "你拿过冠军，不止一个，但也没到统治的程度。每次夺冠之后，版本一变，你又得从头学起。\n\n三年里你搬了四次基地，换过三个辅助。最巅峰的那半年，你觉得谁都能打；剩下的两年半，你在跟版本较劲。\n\n退役那天没有发布会。你在群里发了个红包，说谢谢大家，然后一个人去楼下的面馆吃了顿加辣的。" };
    else if (titles.length >= TV(3)) end = { name: "联赛常客", rank: "B-", sub: "冠军拿过，但不多", text: "你拿过冠军，不止一个，但也没到统治的程度。每次夺冠之后，版本一变，你又得从头学起。\n\n三年里你搬了四次基地，换过三个辅助。最巅峰的那半年，你觉得谁都能打；剩下的两年半，你在跟版本较劲。\n\n退役那天没有发布会。你在群里发了个红包，说谢谢大家，然后一个人去楼下的面馆吃了顿加辣的。" };
    else if (titles.length >= 1 && myOvr() >= 72) end = { name: "一冠封神", rank: "A-", sub: "联赛冠军", text: "一个联赛冠军，够吹一辈子，也够让黑子闭嘴三年。退役后你去解说席，第一句话就是“我当年拿过冠军”。\n\n台下笑成一片，你也笑。只有你自己知道，那场比赛之后你的状态再没回去过，冠军把你抬到最高处，也把剩下的日子都变成了下坡。\n\n后来你解说得越来越稳，语速慢了，判断准了。有人说你比当选手时更适合这行。" };
    else if (bestWorlds) end = { name: "出国留学的", rank: "B+", sub: "世界赛游客", text: "你去过世界赛，虽然只打了瑞士轮。回来以后直播间标题改成“世界赛选手”，被骂了一整周，涨了两万粉。\n\n瑞士轮那三场你打得不算差，只是队友太年轻，一上台就手抖。你说你理解，你自己第一年也抖。\n\n退役后你办了个小训练营，专门带那种第一次进世界赛的年轻人。你教他们的第一件事是怎么在入场式上不低头走路。" };
    else if (S.st.FAME >= 85 && titles.length === 0) end = { name: "流量之神", rank: "B", sub: "没冠军，但有热度", text: "你一个冠军都没拿，但你的切片比冠军的切片多十倍。赞助商排到下个季度，联盟年度颁奖给了你一个“最具人气选手”。\n\n有人问你后不后悔，你说：钱是实打实的，奖杯又不能吃。\n\n话是这么说，某个深夜你还是点开了那年决赛的录像。看到自己那一波开团失败，你按了暂停，去阳台抽了根烟，回来接着看。" };
    else if ((S.money || 0) >= 1000) end = { name: "资本玩家", rank: "A-", sub: "这行是一门生意", text: "你退役前就开始买股份，退役那天直接把老东家的青训买了下来。三年后有人在转会新闻里看到你，你的头衔是“俱乐部投资人”。\n\n当年骂你只会捞钱的人，现在来求你给个试训名额。你看完简历，问了一句“他手速多少”，然后放进了待定。\n\n你办公室里挂着你的旧队服。有记者问那是什么，你说是一件很贵的衣服。" };
    else if (S.academy) end = { name: "青训老板", rank: "A-", sub: "买下了一支青训队", text: "退役前的最后一年，你把攒下的钱砸进了一支 LDL 青训队。签约仪式上你坐在“甲方”那一栏，对面是五个十八岁的孩子，眼睛里全是你三年前的样子。\n\n你不再上场了。但每天下午你都会站在训练室后面看他们打，看到谁补刀漏了，你的手指会在空气里动一下。\n\n第一年青训队没打出成绩，第二年出了一中单。转会期有 LPL 队伍来问价，你报了个很贵的数字，然后对那个孩子说：别急着去，先把你的英雄池练到没人敢 ban。" };
    else if (S.coachTrust >= 88 && voice() >= 70 && titles.length >= 1) end = { name: "更衣室教皇", rank: "A-", sub: "队里最后一句话是你说的", text: "你退役后直接进了教练组，第一年就把队伍带进了四强。管理层发现，只要更衣室里的那几个人还听你的，这个队就不会散。\n\n你的战术板被裱起来挂在基地墙上，上面写着一句话：别慌，按我说的打。\n\n后来有个新人打得稀烂，蹲在走廊哭。你递了瓶水，说了句“哭完接着练”，他第二年成了首发。" };
    else if (myOvr() >= 68) end = { name: "顶级打工人", rank: "B", sub: "稳定首发", text: "你没拿过冠军，但你从来没被换下过。工资按时发，粉丝稳定涨，这行里这也是一种本事。\n\n你不会是集锦里的主角，但每支队都想要一个你这样的。合同一份接一份，你在五个城市租过房，每套都只买了同一款椅子。\n\n退役那天队里给你办了个小型欢送会，蛋糕上写着“稳定输出”。你切了第一刀，说这话听着像骂人，全队都笑了。" };
    else if (myOvr() >= 52) end = { name: "混口饭吃", rank: "B-", sub: "轮换选手", text: "三年职业，攒了点钱，也攒了一身病。不算成功，也不算失败。合同到期那天，经理说有空常回来。\n\n你回了一次，基地已经换了装修，新来的小孩不认识你，问你是哪个部门的。你说以前在这打替补，他说哦，然后低头继续打排位。\n\n那天晚上你回家，把孩子哄睡，自己开了一局。排位分不高，但你赢得很开心。" };
    else end = { name: "查无此人", rank: "D", sub: "消失在人海", text: "三年后，你的直播间只剩 47 个人，其中 30 个是来骂你的。有人问你是谁，弹幕说：以前打过 LDL 的。\n\n你确实打过 LDL。你甚至拿过一次周最佳。但这些没人在意，包括你自己有时候也记不清了。\n\n后来你找了份正经工作，白班，稳定。组里聚餐聊到电竞，你说你不打游戏，眼神飘了一下。" };
    /* 结局尾声：按档位再抽一句，同一档结局不会每次都收在同一个句子上 */
    try {
      const F = (window.DATA_FLAVOR || {}).ending || {};
      const rk = String(end.rank || "").charAt(0);
      const bag = (F[rk] && F[rk].length) ? F[rk] : (F.general || []);
      if (bag.length) end.echo = pick(bag);
    } catch (e) { }
    if (hasT("fa_last_dance")) {
      end = Object.assign({}, end);
      end.sub = end.sub + " · 最后一舞";
      end.text = end.text + " 第二天你官宣退役。舞跳完了，正好。";
      end.lastDance = true;
    } else if (S.endless && S.season > 3) {
      end = Object.assign({}, end);
      const extra = reason === "age"
        ? `\n\n你打到了 ${S.age} 岁。最后一年，队医在体检报告上写了两行字，俱乐部经理看完，把合同换成了顾问合同。你不是被打退役的，是被日历退役的。`
        : reason === "fade"
        ? `\n\n第 ${S.season} 年的春天，你的 OVR 掉到了 ${myOvr()}。转会期，没有一支队伍给你打电话。你自己把退役声明写好了，改了三遍，最后只发了一句“谢谢大家”。`
        : `\n\n第 ${S.season} 年的十一月，你自己按下了停止键。没有发布会，没有告别赛，你在基地群里发了一句“我先下了”，然后把外设收进包里。`;
      end.sub = end.sub + ` · ${S.season} 季`;
      end.text = end.text + extra;
      end.long = S.season;
    }
    /* 名人堂：这一把的结局留档，下一把进游戏时能看见 */
    try {
      const rec = {
        key: (S.name || "无名") + "#" + (S.tick || 0) + ":" + (S.season || 1),
        name: S.name || "无名", pos: POSCN[S.pos] || S.pos,
        team: (teamOf(S.teamId) || {}).name || "无",
        rank: end.rank, story: end.name, sub: end.sub,
        ovr: myOvr(), fame: Math.round(S.st.FAME),
        games: S.record.games, wins: S.record.wins,
        titles: (S.record.titles || []).length,
        worlds: bestWorlds || "", hupu: S.hupu,
        money: S.money, diff: S.diff, mode: S.endless ? "endless" : "three",
        seasons: S.endless ? (S.season || 1) : 3,
        corrupt: (S.story && S.story.corrupt) || 0,
        at: Date.now(), score: hofScore(end.rank) + (titles.length * 3) + ((bestWorlds === "冠军") ? 6 : 0)
      };
      hofAdd(rec);
      /* 给经理模式留份履历：登神/无冕之王才有资格当股东 */
      if (end.rank === "S+" || end.rank === "S" || end.rank === "A+") {
        lsSet(LG_CAREER, { name: rec.name, rank: rec.rank, pos: rec.pos, ovr: rec.ovr, titles: rec.titles, worlds: rec.worlds, at: rec.at });
      }
    } catch (e) { }
    /* 音频：登神/汉江之王 → win；X 线/查无此人 → lose；其余 neutral */
    sndEnd((hasWorlds || reason === "lck_champ" || end.rank === "S+") ? "win"
      : (String(end.rank || "X").charAt(0) === "X" || end.rank === "D" || end.rank === "C-") ? "lose" : "neutral");
    /* 成就 endingName/endingRank 需要先落盘结局名与评级 */
    S.record.ending = { name: end.name, rank: end.rank, sub: end.sub || "", at: Date.now() };
    const achvNewE = checkAchv().slice(); M.achvNew = null;
    const decE = M._dec || null; M._dec = null;
    return scene({
      type: "ending", end, timeline: S.timeline, stats: S.st, ovr: myOvr(),
      record: S.record, fame: Math.round(S.st.FAME), fans: S.fans, name: S.name, pos: S.pos,
      voice: voice(), money: S.money, teamName: (teamOf(S.teamId) || {}).name || "无",
      salary: S.salary, seasons: seasonSummary(), bestWorlds, hupu: S.hupu, haters: S.haters,
      worldChamps: S.record.worldChamps || [], achvNew: achvNewE, dec: decE,
      mode: S.mode, season: S.season, age: S.age, reason: reason || "three",
      highlights: (S.highlights || []).slice(-6),
      pick() { return null; }
    });
  }

  function seasonSummary() {
    const out = [];
    const last = Math.max(3, S ? (S.season || 1) : 3);
    for (let y = 1; y <= last; y++) {
      const rows = (S.record.splits || []).filter(x => x.year === 2024 + y);
      out.push({ year: 2024 + y, splits: rows.map(r => (r.name || r.split).replace(/^(LPL|LDL) /, "") + (r.place ? " " + r.place + "名" : "")), titles: rows.filter(r => r.win).length });
    }
    return out;
  }

  function hotLine(win) {
    const h = D.hot(); const arr = win ? (h.win || []) : (h.lose || []);
    if (!arr.length) return "";
    const t = teamOf(S.teamId);
    return pick(arr).replace(/\{name\}/g, S.name).replace(/\{team\}/g, t ? t.name : S.name).replace(/\{pos\}/g, (window.DATA_POS[S.pos] || {}).name || "");
  }

  /* ================= 存档 ================= */
  const KEY = "denshen_";
  /* 只有月初（行动页刚出来、还没花掉本月行动）才允许存档：避免“赛中存档读回后重复刷题” */
  function canSave() {
    return !!(S && M && M.atMonthStart === true && !S.ended && (S.tick || 0) >= 1);
  }
  function save(slot) {
    if (!canSave()) return false;
    try {
      localStorage.setItem(KEY + slot, JSON.stringify({ S, M: { autoMode: M.autoMode || 0, autoOff: !!M.autoOff, guide: M.guide || {} }, at: Date.now(), atMonthStart: true }));
      return true;
    } catch (e) { return false; }
  }
  /* 老存档里可能有重复卡/已不存在的卡：读档时清一遍，一个槽一张 */
  function sanitizeDeck() {
    if (!S) return;
    const ids = {};
    (D.talents() || []).forEach(t => ids[t.id] = 1);
    const seen = {};
    S.deck = (S.deck || []).slice(0, 5);
    while (S.deck.length < 5) S.deck.push(null);
    S.deck = S.deck.map(id => {
      if (!id || !ids[id] || seen[id]) return null;
      seen[id] = 1; return id;
    });
    S.bag = (S.bag || []).filter((id, i, a) => ids[id] && a.indexOf(id) === i);
    S.talents = (S.talents || []).filter((id, i, a) => ids[id] && a.indexOf(id) === i);
    S.dupCash = S.dupCash || 0;
  }
  function load(slot) {
    try {
      const raw = localStorage.getItem(KEY + slot); if (!raw) return null;
      const o = JSON.parse(raw); S = o.S; M = { autoMode: 0, autoOff: false, guide: {}, achvNew: null, duelLog: [] };
      if (o.M) { M.autoMode = o.M.autoMode || 0; M.autoOff = !!o.M.autoOff; M.guide = o.M.guide || {}; }
      S.shopBought = S.shopBought || {};
      S.invest = S.invest || {};
      S.invest2 = S.invest2 || {};
      S.achv = achvMergeInto(S.achv || {});
      S.duelLog = S.duelLog || [];
      S.story = S.story || { corrupt: 0, justice: 0, scandal: 0, secret: 0 };
      S.lck = S.lck || null;
      S.ended = false;
      /* 旧档 normalize：成就计数 / 队友关系（没有 S.mates 就按当前 roster 初始化） */
      S.record = S.record || {};
      S.record.draws = S.record.draws || 0;
      S.record.injuries = S.record.injuries || 0;
      S.record.debtEver = !!S.record.debtEver;
      S.record.ending = S.record.ending || null;
      ["titles", "splits", "worlds", "msi"].forEach(k => { if (!Array.isArray(S.record[k])) S.record[k] = []; });
      ensureMates();
      markDebt();
      seedRng((S.seed || 1) + (S.tick || 1));
      sanitizeDeck();
      /* 读档只回到月初：不再重摇版本/大事件（fromSave） */
      return startMonth(true);
    } catch (e) { return null; }
  }
  const hasSave = slot => { try { return !!localStorage.getItem(KEY + slot); } catch (e) { return false; } };

  /* ================= 名人堂 + 两模式打通 ================= */
  const HOF_KEY = "denshen_hof", LG_CAREER = "denshen_career", LG_MGR = "denshen_mgr";
  function lsGet(k, d) { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : d; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function hofList() { const a = lsGet(HOF_KEY, []); return Array.isArray(a) ? a : []; }
  function hofScore(rank) { return ({ "S+": 100, "S": 92, "A+": 84, "A": 78, "A-": 72, "B+": 60, "B": 52, "B-": 48, "C+": 36, "C-": 20, "C": 40, "D": 30, "X": 10 })[rank] || 45; }
  function hofAdd(rec) {
    const a = hofList().filter(x => x && x.key !== rec.key);
    a.push(rec);
    a.sort((x, y) => (y.score || 0) - (x.score || 0));
    lsSet(HOF_KEY, a.slice(0, 40));
  }

  /* ================= 对局情境 ================= */
  const DUELS = [
    /* ---------- 通用：每个位置都会碰到的局内决策 ---------- */
    { t: "对线期", d: "对面三级就上来压你补刀，兵线卡在塔前。", opts: [
      { t: "叫打野越塔", stat: "TEAM", dc: 12, ok: "打野从三角草绕后，一血。对面在公屏打了三个点。", fail: "打野没跟上，你被反蹲，交闪还送了一血。" },
      { t: "塔下补刀稳住", stat: "LANE", dc: 11, ok: "塔刀一个不漏，对面越塔被塔打死。", fail: "漏了三波兵，经济差 800。" },
      { t: "直接反打", stat: "MECH", dc: 14, ok: "你闪现进场，一套连招把对面打回泉水。", fail: "技能全空，被单杀。" }
    ]},
    { t: "第一条小龙", d: "对面打野在下半区露头，龙坑只有三个人。", opts: [
      { t: "强开", stat: "MECH", dc: 13, ok: "你先手控住三个，团战 0 换 4。", fail: "开团没开到 C 位，被反打 4 换 0。" },
      { t: "绕后包抄", stat: "GAME", dc: 12, ok: "你从河道绕后，一刀切死对面 ADC。", fail: "绕路被发现，送了一波节奏。" },
      { t: "放龙换塔", stat: "GAME", dc: 10, ok: "你们拆掉两座外塔，经济反超。", fail: "塔没拆掉，龙也没了，解说开始阴阳你。" }
    ]},
    { t: "大龙团", d: "大龙还剩 3000 血，对面五个人从三个方向压过来。", opts: [
      { t: "抢龙", stat: "MECH", dc: 15, ok: "惩戒抢下大龙，全场起立。", fail: "龙被抢，人也被留下。" },
      { t: "开团先手", stat: "TEAM", dc: 13, ok: "你喊了一声就上，队友跟得比谁都快。", fail: "你上了，队友没上。" },
      { t: "撤退保后期", stat: "GAME", dc: 11, ok: "你们撤得干干净净，对面白拿一条龙。", fail: "撤退途中被抓，团灭。" }
    ]},
    { t: "决胜团", d: "双方经济持平，四十秒后一波团决定这局。", opts: [
      { t: "找机会开团", stat: "MECH", dc: 14, ok: "你抓到对面站位失误，一波打崩。", fail: "你被先手，团战瞬间结束。" },
      { t: "等对面失误", stat: "MENTAL", dc: 12, ok: "对面先动了，你们反打，赢了。", fail: "你等了三十秒，对面直接推平了基地。" },
      { t: "点塔偷家", stat: "GAME", dc: 13, ok: "你带着兵线偷家，解说喊到破音。", fail: "家没偷成，基地被推了。" }
    ]},
    { t: "BP 博弈", d: "教练把平板推给你：对面中野是版本答案，你要不要抢？", opts: [
      { t: "抢版本英雄", stat: "GAME", dc: 12, ok: "你锁下版本答案，对面教练当场把笔摔了。", fail: "版本英雄被对面三 ban 针对，你整局没打出伤害。" },
      { t: "留绝活", stat: "POOL", dc: 11, ok: "你把绝活留到第五手，对面脸上写满了“完了”。", fail: "你留的绝活，对面早就准备好了 counter。" },
      { t: "听教练的", stat: "TEAM", dc: 10, ok: "你按教练的来，阵容打得很舒服。", fail: "教练的 BP 你看不懂，但你还是照做了，然后输了。" }
    ]},
    { t: "一级团", d: "双方在河道撞上，谁先进草丛谁先死。", opts: [
      { t: "往前压", stat: "MECH", dc: 13, ok: "你们一级团三换零，开局就滚起雪球。", fail: "你们进草被蹲，开局送三个人头。" },
      { t: "插眼撤退", stat: "GAME", dc: 10, ok: "你们插好视野退回线上，对面白蹲了三分钟。", fail: "眼被排掉，你们还是被抓了。" },
      { t: "打字嘲讽", stat: "MENTAL", dc: 14, ok: "你在公屏打了句“就这”，对面心态炸了。", fail: "对面教练把这句话打印出来贴在了基地墙上。" }
    ]},
    { t: "换线博弈", d: "对面下路双人组走上，你们的对线优势瞬间没了。", opts: [
      { t: "跟着换", stat: "GAME", dc: 11, ok: "你们跟着换线，把对面的算计原样还了回去。", fail: "换线换乱了，两边都没吃到线。" },
      { t: "强压对线", stat: "LANE", dc: 13, ok: "你硬吃对线，把对面的换线打成送人头。", fail: "你被越塔，换线换出了个 0-3。" },
      { t: "叫打野越塔", stat: "TEAM", dc: 12, ok: "打野越塔，对面换线的算盘碎了。", fail: "越塔失败，你们上野一起送。" }
    ]},
    { t: "峡谷先锋", d: "八分钟先锋刷新，你们打野在上半区，下路兵线压得很深。", opts: [
      { t: "打先锋", stat: "TEAM", dc: 12, ok: "先锋到手，一头撞掉中一塔，节奏全开。", fail: "打先锋打太久，下路被越，塔也丢了。" },
      { t: "先包下路", stat: "LANE", dc: 13, ok: "你们先抓死对面下路，再回去拿先锋，白赚两个人头。", fail: "你们去下路扑空，先锋被对面白拿。" },
      { t: "放弃先锋", stat: "GAME", dc: 10, ok: "你们放了先锋，换掉对面一条小龙，不亏。", fail: "先锋被对面拿下，直接撞掉两座塔。" }
    ]},
    { t: "视野黑洞", d: "大龙区一片黑，辅助刚回城，你身上还剩一个真眼。", opts: [
      { t: "自己去插", stat: "MENTAL", dc: 14, ok: "你把真眼插进龙坑草丛，对面四人的动向全在屏幕上。", fail: "你走进黑暗里，被人从后面抱住，交闪还被留。" },
      { t: "等辅助回来", stat: "TEAM", dc: 11, ok: "你等辅助一起做视野，两个人摸黑也不慌。", fail: "辅助回来的路上被抓，你干等着，大龙没了。" },
      { t: "用技能探草", stat: "MECH", dc: 12, ok: "你的技能进草炸出三个红点，全队立刻缩回塔下。", fail: "技能空了，你反而暴露了自己的位置。" }
    ]},
    { t: "越塔决策", d: "对面残血缩在塔下，兵线进塔，你们打野在后面等着。", opts: [
      { t: "抗塔强杀", stat: "MECH", dc: 14, ok: "你抗两下塔完成一换一，兵线还推进去了。", fail: "抗塔数错，你先倒下，打野也跟着送。" },
      { t: "让打野先手", stat: "TEAM", dc: 12, ok: "打野先顶塔，你收人头，配合得像排练过。", fail: "打野犹豫了半秒，塔的仇恨全在你身上。" },
      { t: "推线走人", stat: "GAME", dc: 10, ok: "你们推掉塔皮就走，对面交了闪现还是没补到刀。", fail: "你们推完线不走，被赶来的中野收了两个。" }
    ]},
    { t: "二塔攻坚", d: "中路二塔剩三分之一血，对面五个人守在里面不出。", opts: [
      { t: "强拆", stat: "LANE", dc: 13, ok: "你们硬拆掉二塔，兵线直接压到高地。", fail: "拆到一半对面开团，你们阵型散得像路人局。" },
      { t: "逼对方出来", stat: "GAME", dc: 12, ok: "你们转去打龙，对面被迫出塔，阵型全乱。", fail: "龙没打成，塔也没拆，两头空。" },
      { t: "分推牵扯", stat: "TEAM", dc: 11, ok: "一路分推，一路逼中，对面顾不过来，高地掉了一层。", fail: "分推的人被抓，正面四个人打不过五个。" }
    ]},
    { t: "龙魂之争", d: "双方都是两条小龙，下一条是听牌龙，龙坑已经摆好阵。", opts: [
      { t: "提前卡位", stat: "GAME", dc: 12, ok: "你们提前 40 秒占住龙坑，对面来了也只能干看。", fail: "卡位卡太早，被对面从侧面绕后团灭。" },
      { t: "放龙打团", stat: "TEAM", dc: 14, ok: "你们假装打龙，实则开团，一波 0 换 4 拿下龙魂。", fail: "开团被反打，龙和团一起输。" },
      { t: "换资源", stat: "LANE", dc: 11, ok: "你们换掉一座高地塔，龙魂给他们不亏。", fail: "高地没换到，龙魂也没了，节奏彻底丢。" }
    ]},
    { t: "语音吵架", d: "打野和上单在语音里互相甩锅，声音越来越大。", opts: [
      { t: "劝一句", stat: "MENTAL", dc: 13, ok: "你说了句“打完再说”，语音里安静了，节奏回来了。", fail: "你劝偏了，两个人一起把矛头对准你。" },
      { t: "装没听见", stat: "GAME", dc: 11, ok: "你戴上耳机只听游戏音，把节奏拉回自己手里。", fail: "没人指挥，你们连续两波团战开成送。" },
      { t: "站队打野", stat: "TEAM", dc: 14, ok: "你明确站打野，全队思路统一，接下来三波团全赢。", fail: "你站错边了，上单直接挂机。" }
    ]},
    { t: "高地防守", d: "对面带着大龙 buff 上高地，你们的水晶只剩半血。", opts: [
      { t: "清线等机会", stat: "GAME", dc: 12, ok: "你们把兵线清干净，对面 buff 掉了，攻势自然散了。", fail: "清线被开，水晶直接爆了。" },
      { t: "开团搏命", stat: "MECH", dc: 15, ok: "你找到对面后排站位失误，一波反打推回去。", fail: "开团没开好，水晶在他们笑声里爆炸。" },
      { t: "换家", stat: "LANE", dc: 16, ok: "你带线偷家成功，对面回防不及，赢了。", fail: "你走到一半被留，队友四打五守不住。" }
    ]},
    { t: "抢大龙", d: "对面在打大龙，血量掉到 4000，你们还在赶路。", opts: [
      { t: "闪现抢", stat: "MECH", dc: 17, ok: "你闪现进龙坑，惩戒抢下大龙，全场炸了。", fail: "你闪现进去，龙没抢到，人也没出来。" },
      { t: "等他们打完再打团", stat: "GAME", dc: 13, ok: "对面拿龙时开团，你们把残血全收了。", fail: "对面拿龙后直接推塔，你们追出去被反打。" },
      { t: "回去守塔", stat: "TEAM", dc: 11, ok: "你们放弃大龙，守住了高地，把时间拖到对面 buff 过期。", fail: "塔没守住，大龙也白送。" }
    ]},

    /* ---------- 分位置：只有这个位置会抽到 ---------- */
    { t: "上路单带", pos: ["TOP"], d: "你带线到二塔，对面五个人从小地图上消失了。", opts: [
      { t: "继续带", stat: "MENTAL", dc: 14, ok: "你带穿一路，对面回防晚了一步，家没了。", fail: "你被抓，队友在大龙坑四打五。" },
      { t: "传送开团", stat: "TEAM", dc: 12, ok: "你 TP 绕后，一波开团打崩对面。", fail: "你 TP 的位置太正，落地就被秒。" },
      { t: "撤退", stat: "GAME", dc: 10, ok: "你安全撤退，兵线压力还在。", fail: "撤退路上被留，白给一个头。" }
    ]},
    { t: "上路对拼", pos: ["TOP"], d: "对面先手交技能推线，你的血线比他高，兵线在中间。", opts: [
      { t: "贴身硬拼", stat: "MECH", dc: 13, ok: "一套换血把对面打回城，多吃了两波线。", fail: "技能被躲，你被追到塔下补刀都补不了。" },
      { t: "拉兵线", stat: "LANE", dc: 11, ok: "你把兵线拉到塔前，对面站在中间连经验都不敢吃。", fail: "兵线拉崩了，你反而被卡在自家塔下。" },
      { t: "叫打野", stat: "TEAM", dc: 12, ok: "打野从三角草进来，一血到手，上路彻底自由。", fail: "打野来了但被反蹲，你们两个一起躺。" }
    ]},
    { t: "TP 时机", pos: ["TOP"], d: "下路打起来了，你的传送还在，兵线刚推进对面塔。", opts: [
      { t: "立刻 TP", stat: "TEAM", dc: 13, ok: "你 TP 落地打出一换三，下路直接打开。", fail: "TP 落地被集火，人没救到，线也丢了。" },
      { t: "先推线", stat: "LANE", dc: 11, ok: "你把线推到二塔再 TP，回来时经济领先 800。", fail: "下路打完你才 TP，队友已经骂上了。" },
      { t: "留着不走", stat: "GAME", dc: 12, ok: "你知道下路打不过，果断放弃，换掉上路一座塔。", fail: "下路崩了，你也没换来任何东西。" }
    ]},
    { t: "野区入侵", pos: ["JUG"], d: "对面打野在下路露头，他的红 buff 还有 20 秒刷新。", opts: [
      { t: "反红", stat: "GAME", dc: 12, ok: "你反掉红 buff，对面打野整局没节奏。", fail: "你反野被中单夹了，交闪还送 buff。" },
      { t: "抓上路", stat: "LANE", dc: 13, ok: "你越塔抓死对面，上路直接断开连接。", fail: "越塔被换，上单开始打字问你在干嘛。" },
      { t: "回城刷野", stat: "MECH", dc: 10, ok: "你稳稳刷完两组野，等级领先一级。", fail: "你回城的时候，队友被四包二了。" }
    ]},
    { t: "三级节奏", pos: ["JUG"], d: "三级，中路兵线压过半场，上单在喊你，下路也在喊。", opts: [
      { t: "抓中", stat: "GAME", dc: 12, ok: "你从侧翼绕出来，中单交出闪现也死了。", fail: "你走进草丛，对面中野二打一，你先倒下。" },
      { t: "抓上", stat: "LANE", dc: 13, ok: "你抓上拿一血，上单彻底压不住对面了。", fail: "你抓上扑空，自家红被偷，节奏全无。" },
      { t: "先刷到四", stat: "MECH", dc: 10, ok: "你稳稳刷到四，等级压对面打野一级。", fail: "你刷野的时候，三条线全被压，队友开始点你的名字。" }
    ]},
    { t: "先锋团开不开", pos: ["JUG"], d: "先锋刷新，你们下路被压，正面五五开。", opts: [
      { t: "开先锋", stat: "TEAM", dc: 13, ok: "你们拿下先锋，一头撞掉中一塔，节奏起飞。", fail: "打先锋时下路被抓，先锋还丢了。" },
      { t: "先做视野反蹲", stat: "GAME", dc: 12, ok: "你预判对面开先锋，反蹲打出 0 换 3。", fail: "蹲了半分钟，对面根本没来，你白蹲。" },
      { t: "往下路打", stat: "LANE", dc: 11, ok: "你们先下路抓人，回头再拿先锋，双边都赚。", fail: "下路没抓到，回来时先锋已经没了。" }
    ]},
    { t: "蓝 buff 归属", pos: ["MID"], d: "打野把蓝 buff 打剩一丝，问你要不要。", opts: [
      { t: "要", stat: "LANE", dc: 11, ok: "你拿到蓝 buff，推线游走，节奏全在自己手里。", fail: "拿了蓝却被打野记恨，之后你再也没被 gank 过。" },
      { t: "让给打野", stat: "TEAM", dc: 12, ok: "打野拿到蓝，效率翻倍，下路被连抓两波。", fail: "打野拿了蓝去刷野，你的中路被压得喘不过气。" },
      { t: "推了线再说", stat: "GAME", dc: 13, ok: "你先把线推进去，再和打野一起收蓝，两个人都舒服。", fail: "线没推好，蓝被对面中野抢了。" }
    ]},
    { t: "中路单杀机会", pos: ["MID"], d: "对面中单交了闪现，血量一半，站在塔前想吃这波线。", opts: [
      { t: "直接 all in", stat: "MECH", dc: 14, ok: "你闪过塔完成单杀，全场欢呼。", fail: "伤害差一点，你被塔打死，评论区开始刷“上高”。" },
      { t: "压刀不杀", stat: "LANE", dc: 11, ok: "你把对面压出经验区，两波线全收，经济领先 600。", fail: "你压得太靠前，被对面打野绕后抓死。" },
      { t: "叫打野越塔", stat: "TEAM", dc: 13, ok: "你和打野配合越塔，人头加助攻，中路彻底打开。", fail: "越塔配合失误，塔下双亡。" }
    ]},
    { t: "游走还是推线", pos: ["MID"], d: "下路打起来了，你的兵线刚到塔前，中单已经在往下走了。", opts: [
      { t: "跟着游", stat: "GAME", dc: 13, ok: "你比对面中单早到两秒，反打三杀。", fail: "你游下扑空，中路塔被推掉一半。" },
      { t: "吃线推塔", stat: "LANE", dc: 11, ok: "你吃掉两波线还蹭了塔皮，经济反超对面中单。", fail: "下路输了，你吃线也没吃出优势。" },
      { t: "发信号让撤", stat: "MENTAL", dc: 12, ok: "你连点三个信号，下路及时撤退，对面白跑一趟。", fail: "下路没听，硬打，你只能看着他们团灭。" }
    ]},
    { t: "下路四包二", pos: ["BOT"], d: "对面中野往下走了，你们辅助的眼刚好黑了。", opts: [
      { t: "塔下反打", stat: "MECH", dc: 14, ok: "你们二打四换掉三个，全场起立。", fail: "你们被四包二，下路直接崩盘。" },
      { t: "放塔后撤", stat: "GAME", dc: 10, ok: "你们撤得干净，对面只拿到一层塔皮。", fail: "后撤太慢，被追死两个。" },
      { t: "叫打野反蹲", stat: "TEAM", dc: 12, ok: "打野准时到位，反打一波 0 换 4。", fail: "打野在刷石头人，你们二打四。" }
    ]},
    { t: "抢二抢三", pos: ["BOT"], d: "双方下路同时到线上，第一波兵刚到，辅助在问要不要抢二。", opts: [
      { t: "抢二", stat: "MECH", dc: 12, ok: "你们抢到二级，一套消耗打掉对面一半血，压了两波线。", fail: "抢二慢了一步，你们被压回塔下。" },
      { t: "稳补刀", stat: "LANE", dc: 10, ok: "你稳稳补刀，经济一点没落下，等打野来抓。", fail: "补刀被压，兵线推到塔下，你们连经验都难受。" },
      { t: "假装抢二", stat: "GAME", dc: 14, ok: "你们假装压线，引对面开，反手一波打出双杀。", fail: "演得太假，对面直接回城，你们白费表情。" }
    ]},
    { t: "辅助游走", pos: ["BOT"], d: "辅助想跟你商量去中路游一波，你一个人在下路待着。", opts: [
      { t: "让他去", stat: "GAME", dc: 11, ok: "辅助游中拿到助攻，你下路稳稳补刀，双线开花。", fail: "辅助游走没成，你下路被越，塔也没了。" },
      { t: "留下保线", stat: "TEAM", dc: 12, ok: "辅助留下，你们压住下路，对面被迫叫中野回防。", fail: "两个人在下路待着，中路被越塔。" },
      { t: "一起动", stat: "LANE", dc: 14, ok: "你们双人组一起游中，三包一拿下、还顺了塔。", fail: "你们一起走，下路兵线全给对面吃了。" }
    ]},
    { t: "开团视野", pos: ["SUP"], d: "对面阵型散了，你的视野里只有一个落单的后排。", opts: [
      { t: "先手开", stat: "MENTAL", dc: 14, ok: "你的开团定住后排，一波团战结束比赛。", fail: "你开得太早，队友还没到，你被集火。" },
      { t: "插眼等机会", stat: "GAME", dc: 12, ok: "你插下真眼，看清对面五人的站位，再开团完美。", fail: "做视野被排，你交了闪现还被留。" },
      { t: "跟队形打反手", stat: "TEAM", dc: 11, ok: "你们打反手，等对面先开，被你们一波反杀。", fail: "对面一直不开，你们被耗到没状态。" }
    ]},
    { t: "游走时机", pos: ["SUP"], d: "下路兵线进塔，你身上有鞋和眼，中路看起来有机会。", opts: [
      { t: "游中", stat: "GAME", dc: 12, ok: "你游中三包一，拿到一血，节奏打开。", fail: "你走了以后，AD 被越塔，你在中路的图也被排。" },
      { t: "留下保 AD", stat: "TEAM", dc: 11, ok: "你留下保线，下路压得很舒服，经济领先两千。", fail: "你在下路耗着，中路被对面野辅连抓两波。" },
      { t: "带 AD 一起走", stat: "LANE", dc: 14, ok: "你们双人组转线，一路推到二塔，对面全程跟着你们跑。", fail: "转线转丢了，两边兵线都亏。" }
    ]},
    { t: "保排还是开团", pos: ["SUP"], d: "你们的 ADC 发育很好，但对面刺客一直绕后。", opts: [
      { t: "贴身保 AD", stat: "TEAM", dc: 12, ok: "你挡下关键技能，ADC 输出全场最高，一波团赢。", fail: "你保得太死，开团没人，节奏全丢。" },
      { t: "主动开团", stat: "MENTAL", dc: 15, ok: "你先手开死对面刺客，顺手把团战赢了。", fail: "你离开 AD 的瞬间，他就被刺客切了。" },
      { t: "做眼预警", stat: "GAME", dc: 13, ok: "你在侧翼插满眼，刺客一露头就被发现，节奏稳住。", fail: "眼位被排，刺客还是摸到了后排。" }
    ]},

    /* ---------- 局势相关：只在对局状态吻合时出现 ---------- */
    { t: "赛点局", when: "matchpoint", d: "2:2，第五把。你手心里全是汗，耳机里是队友的呼吸声。", opts: [
      { t: "拿绝活", stat: "POOL", dc: 12, ok: "你锁下那个英雄，全场欢呼。这把你 C 了。", fail: "绝活被针对，你 0-5 开局。" },
      { t: "稳住运营", stat: "GAME", dc: 13, ok: "你们把节奏拖到自己最强的时间点，一波带走。", fail: "运营了四十分钟，被对面一波团灭。" },
      { t: "赌一把", stat: "MENTAL", dc: 15, ok: "你赌对面不敢打，结果他们真不敢。", fail: "你赌错了，对面直接开团。" }
    ]},
    { t: "逆风局", when: "behind", d: "经济落后 8000，三路兵线压进高地。", opts: [
      { t: "找机会单抓", stat: "LANE", dc: 14, ok: "你抓到对面落单的 C 位，一波翻盘。", fail: "你去抓人，家被拆了。" },
      { t: "守家等机会", stat: "MENTAL", dc: 12, ok: "你们守了二十分钟，对面终于失误了。", fail: "守到最后，基地还是爆了。" },
      { t: "强开搏命", stat: "MECH", dc: 15, ok: "一波完美团战，你打出了职业生涯最秀的操作。", fail: "强开失败，游戏结束。" }
    ]},
    { t: "顺风局", when: "leading", d: "你们领先八千经济，队友已经开始在公屏打字了。", opts: [
      { t: "稳住推塔", stat: "GAME", dc: 10, ok: "你们不贪，一路推塔，二十五分钟结束游戏。", fail: "推进节奏太慢，对面拖到后期翻盘。" },
      { t: "浪一波", stat: "MECH", dc: 16, ok: "你越塔单杀，士气爆棚，全队跟着你一路推平。", fail: "你越塔送头，经济差瞬间缩到三千。" },
      { t: "收缩发育", stat: "TEAM", dc: 11, ok: "你们把线权抓回来，再打一波团，赢得干净。", fail: "收缩太久，对面找到机会做视野，节奏被拖住。" }
    ]},
    { t: "天王山", when: "late", d: "第四把，双方都打满了，你的手已经开始发麻。", opts: [
      { t: "换套打法", stat: "GAME", dc: 13, ok: "你换了一套前中期节奏，对面完全没准备，二十分钟结束。", fail: "新打法磨合不够，前两波就打崩。" },
      { t: "照老套路", stat: "POOL", dc: 11, ok: "熟悉的阵容，熟悉的节奏，你们稳得像机器。", fail: "老套路被对面研究透了，每一步都被预判。" },
      { t: "靠意志力", stat: "MENTAL", dc: 15, ok: "你咬着牙把每个细节做到位，最后五分钟的操作全是对的。", fail: "体力先泄了，关键团手一抖，技能空了。" }
    ]},
    { t: "世界赛舞台", when: "worlds", d: "场馆里两万人在喊，导播的镜头停在你脸上，你听见自己的心跳。", opts: [
      { t: "享受它", stat: "MENTAL", dc: 13, ok: "你把压力变成了兴奋，这把你打出了生涯最佳。", fail: "你手抖了，第一波团就空了大招。" },
      { t: "只看屏幕", stat: "MECH", dc: 12, ok: "你把外界全部屏蔽，操作干净得像训练赛。", fail: "你越想专注，越听见观众的笑声。" },
      { t: "带动队友", stat: "TEAM", dc: 11, ok: "你在语音里喊了一句，四个队友全活了。", fail: "你喊完之后，语音里更安静了。" }
    ]}
  ];

  function makeDuel(opp, s) {
    const ctxPool = DUELS.filter(d => {
      if (d.pos && d.pos.indexOf(S.pos) < 0) return false;
      if (d.when === "behind" && !(s.losses > s.wins)) return false;
      if (d.when === "leading" && !(s.wins > s.losses)) return false;
      if (d.when === "matchpoint" && s.wins !== 2) return false;
      if (d.when === "late" && (s.g || 1) < 4) return false;
      if (d.when === "worlds" && !M.knock) return false;
      return !!d.when || !!d.pos;
    });
    const base = DUELS.filter(d => !d.when && !d.pos);
    /* 局势/位置专属的决策优先出：一半概率走专属池，逆风时更高 */
    const useCtx = ctxPool.length && (chance(.55) || s.losses > s.wins);
    const sit = pick(useCtx ? ctxPool : base);
    return { sit, opp, game: s.g, wins: s.wins, losses: s.losses, round: 1, useBurst: false };
  }

  /* ==========================================================================
     v3：英雄池 / 分维度 / BO5 交互管线 / 版本 / 积分榜 / 世界赛流程图
     这一段是《登神 v3》的核心。老函数（simGame/matchMonth/seriesGame...）在这里被接管。
     ========================================================================== */
  const TACTICS = [
    { k: "early", name: "前期压制", desc: "一级团、越塔、抢节奏。赌对面接不住。" },
    { k: "ope", name: "运营拉扯", desc: "视野、龙控、拖时间点。稳，但吃意识。" },
    { k: "fight", name: "团战一波", desc: "五个人的团。赢了就一波推平。" }
  ];
  const TACTIC_NAME = { early: "前期压制", ope: "运营拉扯", fight: "团战一波", split: "单带" };
  const DIM_CN = { LANE: "对线", MECH: "操作", GAME: "意识", POOL: "英雄池", TEAM: "团队", FORM: "状态" };

  /* 没有真实选手的位置：按队伍强度造一个虚拟数值，保证五位置齐全 */
  function stFromOvr(pos, v) {
    const w = (window.DATA_POS[pos] || window.DATA_POS.MID).w;
    const st = {};
    for (const k of STATS) st[k] = clamp(Math.round(v + (w[k] || 0) * 22 - 3), 30, 96);
    st.FAME = clamp(Math.round(v * .3), 5, 60);
    return st;
  }

  function squadOf(tid, useMe) {
    const t = teamOf(tid), rows = [];
    for (const k of ["TOP", "JUG", "MID", "BOT", "SUP"]) {
      if (useMe && S.teamId === tid && k === S.pos) { rows.push({ pos: k, st: stEff(), w: 1.35, me: true, name: S.name }); continue; }
      const pid = ((S.roster || {})[tid] || {})[k] || (t && t.roster && t.roster[k]);
      const p = pid ? playerOf(pid) : null;
      if (p && p.st) rows.push({ pos: k, st: p.st, w: 1, pid: pid, name: p.name || p.id });
      else rows.push({ pos: k, st: stFromOvr(k, teamPower(tid)), w: 1, name: "替补" });
    }
    return rows;
  }

  function heroProf(n) { return (S.pool || {})[n] || 0; }
  function patchMap() { return (S.patch && S.patch.buff) ? S.patch.buff : {}; }
  function autoHero() {
    const hs = (window.MATCH ? MATCH.heroesFor(S.pos, S.pool, patchMap(), 1) : []);
    return hs.length ? hs[0].n : (S.mainHero || "");
  }

  /* 装槽的卡 → 比赛维度（这是构筑真正影响结果的地方） */
  function buildDims() {
    const b = deckBonus(), builds = b._builds || {}, out = {};
    const MAP = { attack: ["LANE", "MECH", "GAME"], control: ["GAME", "POOL"], teamfight: ["TEAM"], mental: ["MENTAL", "FORM"], money: [], jungle: ["GAME", "POOL"], split: ["LANE"] };
    for (const k in builds) {
      const n = builds[k];
      const add = n >= 5 ? 4 : n >= 3 ? 2.5 : n >= 2 ? 1.2 : 0;
      if (!add) continue;
      (MAP[k] || []).forEach(d => { out[d] = (out[d] || 0) + add; });
    }
    if (b.matchBonus) out.FORM = (out.FORM || 0) + b.matchBonus;
    return out;
  }

  /* ==========================================================================
     v3.10：阵容对照 / 本命英雄 / 局内决策 / 自动托管 / 羁绊 / 成就 / 经济
     新增数据文件没落地时全部 || [] / || {} 兜底，不依赖加载顺序。
     ========================================================================== */
  function hashStr(s) {
    let h = 2166136261;
    s = String(s || "");
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0);
  }
  function heroesForPos(pos) {
    const all = (D.heroes() || []).filter(Boolean);
    const arr = all.filter(h => !h.pos || h.pos.indexOf(pos) >= 0);
    return (arr.length ? arr : all);
  }
  /* 选手的本命英雄：data 里没有 sig 字段，用 name/id + pos 确定性生成，保证同一个人每次一致 */
  function sigOf(seedName, pos) {
    const hs = heroesForPos(pos);
    if (!hs.length) return [];
    const seed = hashStr((seedName || "x") + "|" + pos);
    const out = [], n = 2 + (seed % 2);
    for (let i = 0; i < n && i < hs.length; i++) {
      const h = hs[(seed + i * 7 + i * i) % hs.length];
      if (h && h.n && out.indexOf(h.n) < 0) out.push(h.n);
    }
    return out;
  }
  const FAKE_NAMES = {
    TOP: ["林间", "Kasa", "阿冲", "Thorn", "小楼"], JUG: ["野火", "Mute", "小鹿", "Breeze", "阿凯"],
    MID: ["Kite", "长安", "Nova", "小满", "Zenith"], BOT: ["Echo", "阿糖", "Rune", "小饼", "Lumen"],
    SUP: ["Koi", "阿松", "Halo", "小北", "Pine"]
  };
  const POS_ORDER = ["TOP", "JUG", "MID", "BOT", "SUP"];
  /* 双方五人阵容对照：真实选手优先，data 里没有就确定性生成并标 fake */
  function rosterDetail(tid) {
    const t = teamOf(tid) || {}, rows = [], roster = t.roster || {};
    for (let i = 0; i < POS_ORDER.length; i++) {
      const pos = POS_ORDER[i];
      if (tid === S.teamId && pos === S.pos) {
        rows.push({ pos: pos, posCN: POSCN[pos], name: S.name, ovr: myOvr(), sig: sigOf(S.name, pos), me: true });
        continue;
      }
      const pid = roster[pos];
      const p = pid ? playerOf(pid) : null;
      if (p && p.st) {
        rows.push({ pos: pos, posCN: POSCN[pos], name: p.name || pid, ovr: ovr(p.st, pos), sig: sigOf(String(pid || p.name || ""), pos), pid: pid });
      } else {
        const seed = hashStr((tid || "") + "|" + pos), pool = FAKE_NAMES[pos] || FAKE_NAMES.MID;
        rows.push({
          pos: pos, posCN: POSCN[pos], fake: true,
          name: pool[seed % pool.length] + "·" + (seed % 10),
          ovr: clamp(Math.round(teamPower(tid) + ((seed % 7) - 3)), 40, 92),
          sig: sigOf("fake" + (tid || "") + pos, pos)
        });
      }
    }
    return rows;
  }
  function oppRosterOf(tid) { try { return rosterDetail(tid); } catch (e) { return []; } }
  function myRosterDetail() { try { return rosterDetail(S.teamId); } catch (e) { return []; } }
  function oppSigHit(tid, hero) {
    if (!hero) return [];
    try {
      return rosterDetail(tid).filter(r => (r.sig || []).indexOf(hero) >= 0)
        .map(r => ({ pos: r.pos, name: r.name, hero: hero }));
    } catch (e) { return []; }
  }

  /* ================= 队友关系（W5）：4 名队友、aff 0..100、3 步关系线 ================= */
  const MATE_TIERS = [[85, "兄弟", 4], [70, "朋友", 3], [40, "熟识", 2], [0, "陌生", 1]];
  function mateTier(aff) {
    const a = aff || 0;
    for (let i = 0; i < MATE_TIERS.length; i++) if (a >= MATE_TIERS[i][0]) return { name: MATE_TIERS[i][1], lv: MATE_TIERS[i][2] };
    return { name: "陌生", lv: 1 };
  }
  function matesRaw() {
    try {
      S.mates = S.mates || {};
      return Object.keys(S.mates).map(pid => Object.assign({ pid: pid }, S.mates[pid] || {}));
    } catch (e) { return []; }
  }
  function matesList() {
    return matesRaw().map(m => ({ pid: m.pid, name: m.name, pos: m.pos, aff: Math.round(m.aff || 0), tier: mateTier(m.aff), done: !!m.done, broken: !!m.broken }));
  }
  function matesAffMean() {
    const ms = matesRaw();
    if (!ms.length) return 50;
    let n = 0; ms.forEach(m => { n += (m.aff || 0); });
    return n / ms.length;
  }
  /* 转会/换队后按当前 roster（除自己）重建 4 名队友；旧队关系不带走 */
  function ensureMates(force) {
    try {
      const tm = teamOf(S.teamId) || {}, roster = tm.roster || {}, pids = [];
      for (let i = 0; i < POS_ORDER.length && pids.length < 4; i++) {
        const pid = roster[POS_ORDER[i]];
        if (pid && pid !== S.pid && pid !== S.baseId && pids.indexOf(pid) < 0) pids.push(pid);
      }
      const sig = String(tm.id || S.teamId || "") + "|" + pids.join(",");
      S.mates = S.mates || {};
      if (!force && S._matesSig === sig && Object.keys(S.mates).length) return S.mates;
      const built = {};
      pids.forEach(pid => {
        const p = playerById(pid) || playerOf(pid) || null, old = S.mates[pid];
        built[pid] = {
          name: (p && (p.cn || p.name)) || pid,
          pos: (p && p.pos) || "MID",
          aff: old ? clamp(old.aff || 50, 0, 100) : 50,
          mem: (old && old.mem) ? old.mem : [],
          lineStep: (old && old.lineStep) || 0,
          done: !!(old && old.done), broken: !!(old && old.broken)
        };
      });
      S.mates = built;
      S._matesSig = sig;
      if (S._matePid && !S.mates[S._matePid]) { S._matePid = null; S._mateName = ""; }
      return S.mates;
    } catch (e) { return S.mates || {}; }
  }
  function matePick() {
    const ms = matesRaw();
    if (!ms.length) return null;
    let x = ((S.tick || 1) * 2654435761 + (M.evCount || 0) * 40503) >>> 0;
    x = (x ^ (x >>> 15)) >>> 0;
    return ms[x % ms.length];
  }
  /* 队友线：第 1 步 aff+5 / 第 2 步 aff+10 / 第 3 步三选一（动态事件，复用 event 渲染） */
  function applyMateLine(v) {
    ensureMates();
    const pid = S._matePid || (matePick() || {}).pid;
    const m = pid && S.mates ? S.mates[pid] : null;
    if (!m || m.done || m.broken) return null;
    m.lineStep = Math.min(3, (m.lineStep || 0) + Math.max(1, Number(v) || 1));
    if (m.lineStep === 1) {
      m.aff = clamp((m.aff || 50) + 5, 0, 100);
      m.mem.push({ t: S.tick, text: "第一次一起加练" });
      return { pid: pid, name: m.name, step: 1, aff: Math.round(m.aff) };
    }
    if (m.lineStep === 2) {
      m.aff = clamp((m.aff || 50) + 10, 0, 100);
      m.mem.push({ t: S.tick, text: "聊了聊家里的事" });
      return { pid: pid, name: m.name, step: 2, aff: Math.round(m.aff) };
    }
    S._matePending = pid;
    return { pid: pid, name: m.name, step: 3, aff: Math.round(m.aff), pending: true };
  }
  function mateStep3Event() {
    const pid = S._matePending;
    const m = pid && S.mates ? S.mates[pid] : null;
    if (!m) return null;
    return {
      id: "mate_step3_" + pid, cat: "mate", noEcho: true,
      title: "和 " + m.name + " 的最后一步",
      text: "一个赛季打下来，你们已经不用多说什么了。但有些话，总得有个说法。",
      opts: [
        { t: "做兄弟", d: "关系 +15，他把自己压箱底的战术卡给你一张", eff: { mateAff: 15, mateDone: "bro" } },
        { t: "当普通队友", d: "关系不变，谁也不欠谁", eff: { mateDone: "mate" } },
        { t: "决裂", d: "关系 −30，以后队里会有人给你使绊子", eff: { mateAff: -30, mateDone: "break" } }
      ]
    };
  }
  function applyMateEff(key, v) {
    ensureMates();
    const pid = S._matePid;
    const m = pid && S.mates ? S.mates[pid] : null;
    if (!m) return null;
    if (key === "mateAff") {
      m.aff = clamp((m.aff || 50) + (Number(v) || 0), 0, 100);
      return { pid: pid, name: m.name, aff: Math.round(m.aff) };
    }
    if (key === "mateLine") return applyMateLine(v);
    if (key === "mateDone") {
      m.done = true;
      if (v === "break") { m.broken = true; m.aff = clamp((m.aff || 50) - 30, 0, 100); }
      if (v === "bro") {
        m.aff = clamp((m.aff || 50) + 15, 0, 100);
        S.tactical = (S.tactical || 0) + 1; /* 兄弟给一张战术卡 */
        m.mem.push({ t: S.tick, text: "成了兄弟，给了你一张战术卡" });
      } else {
        m.mem.push({ t: S.tick, text: v === "break" ? "决裂了" : "把话说开了" });
      }
      if (S._matePending === pid) S._matePending = null;
      return { pid: pid, name: m.name, done: v, aff: Math.round(m.aff) };
    }
    return null;
  }
  /* 月度：低 aff 内讧小概率、高 aff 请吃饭小概率；返回 notes */
  function mateMonthly() {
    ensureMates();
    const out = [];
    matesRaw().forEach(m => {
      if (m.broken) return;
      if ((m.aff || 0) < 25 && chance(.06)) {
        S.morale = clamp(S.morale - 4, 0, 100);
        S.teamStatus = clamp((S.teamStatus || 50) - 3, 0, 100);
        m.mem.push({ t: S.tick, text: "在训练室吵了一架" });
        out.push("和 " + m.name + " 闹了矛盾：心情 −4，团队 −3");
      } else if ((m.aff || 0) > 80 && chance(.05)) {
        S.morale = clamp(S.morale + 3, 0, 100);
        m.mem.push({ t: S.tick, text: "一起吃了顿饭" });
        out.push(m.name + " 拉你去吃了顿饭：心情 +3");
      }
    });
    return out;
  }

  const POS_DIM = { TOP: "LANE", JUG: "GAME", MID: "MECH", BOT: "LANE", SUP: "TEAM" };
  const GAME_PLANS = [
    { k: "help_top", n: "帮上路", t: "打野前期往上刷", d: "对线 +8%（赌上单能站出来）", dim: "LANE", pct: .08 },
    { k: "help_bot", n: "帮下路", t: "下路三包二", d: "团队 +8%（下路先起势）", dim: "TEAM", pct: .08 },
    { k: "roam", n: "双人游走", t: "中野双游", d: "意识 +8%（靠节奏滚雪球）", dim: "GAME", pct: .08 },
    { k: "farm", n: "放养发育", t: "各线自己玩", d: "操作 +6%、英雄池 +3%（稳，但前期没声音）", dim: "MECH", pct: .06 }
  ];
  const RES_PLANS = [
    { k: "dragon", n: "抢小龙", t: "提前一分钟落位", d: "团队 +3%，士气 +8", dim: "TEAM", pct: .03, mom: 8 },
    { k: "herald", n: "拿先锋", t: "上中换线吃镀层", d: "对线 +3%，士气 +10", dim: "LANE", pct: .03, mom: 10 },
    { k: "vision", n: "视野战", t: "辅助全程跟着做视野", d: "意识 +3%，士气 +6", dim: "GAME", pct: .03, mom: 6 },
    { k: "swap", n: "换线避战", t: "避开对面强势组合", d: "英雄池 +3%，士气 +6", dim: "POOL", pct: .03, mom: 6 },
    { k: "focus", n: "针对核心", t: "五个人盯死对面最肥的", d: "操作 +4%，士气 +12（打崩对面心态）", dim: "MECH", pct: .04, mom: 12 }
  ];
  function planByK(arr, k) { for (let i = 0; i < arr.length; i++) if (arr[i].k === k) return arr[i]; return arr[0]; }
  function bumpDim(side, dim, pct) {
    if (!side || !side.dims || !dim) return;
    const cur = side.dims[dim] === undefined ? 65 : side.dims[dim];
    side.dims[dim] = Math.round(cur * (1 + (pct || 0)) * 10) / 10;
  }
  /* 把本局战术/资源决策落到 bo._mine / bo._theirs 上；对手本命命中给对面一点轻加成 */
  function applyGamePlan(bo, planK, resK) {
    if (!bo || !bo._mine) return bo;
    const pl = planByK(GAME_PLANS, planK), rs = planByK(RES_PLANS, resK);
    bumpDim(bo._mine, pl.dim, pl.pct);
    if (pl.k === "farm") bumpDim(bo._mine, "POOL", .03);
    bumpDim(bo._mine, rs.dim, rs.pct);
    bo.mom = (bo.mom || 0) + (rs.mom || 0);
    bo.plan = planK; bo.res = resK;
    bo.planNames = [pl.n, rs.n];
    bo.planText = pl.n + " + " + rs.n;
    bo.mineLabels = (bo.mineLabels || []).concat([
      { k: pl.n, v: (pl.pct || 0) + (pl.k === "farm" ? .03 : 0), tone: "good" },
      { k: rs.n, v: rs.pct || 0, tone: "good" }
    ]);
    if (bo._mine.labels && bo._mine.labels.push) bo._mine.labels.push({ k: "本局战术", v: pl.n });
    /* 对手本命命中：对面这条线 +3（最多两个位置），做轻一点 */
    const hits = oppSigHit(bo.oppId, bo.oppHero);
    if (hits.length && bo._theirs && bo._theirs.dims) {
      hits.slice(0, 2).forEach(h => bumpDim(bo._theirs, POS_DIM[h.pos] || "MECH", .03));
      bo.oppSigHit = hits;
      bo._theirs.labels = (bo._theirs.labels || []).concat(hits.slice(0, 2).map(h => ({ k: "对面本命 " + (POSCN[h.pos] || h.pos), v: h.hero })));
    }
    return bo;
  }
  /* 局内决策评级：计划是否奏效（赢下的局里计划算命中）+ 临场指挥加分 */
  function duelRateSummary(bo) {
    const log = (bo && bo.duelLog) || [];
    if (!log.length) return null;
    let hit = 0;
    log.forEach(x => { if (x.res === "win") hit += x.command ? 1.25 : 1; });
    const rate = hit / log.length;
    const rank = rate >= .75 ? "S" : rate >= .55 ? "A" : rate >= .4 ? "B" : "C";
    const txt = { S: "你在这轮系列赛里的每一次布置几乎都踩在点子上。", A: "大部分决策都成了，个别局被对面读了。", B: "有对有错，赢下来靠的是选手硬解。", C: "你的布置基本被对面算死了，能撑到这里靠的是运气。" }[rank];
    return { rank: rank, rate: Math.round(rate * 100) / 100, wins: log.filter(x => x.res === "win").length, n: log.length, text: txt, log: log.slice(-5) };
  }
  function sndEnd(kind) {
    try { if (window.SND && typeof window.SND.playEnding === "function") window.SND.playEnding(kind); } catch (e) { }
  }
  function sndIntensity(v) {
    try { if (window.SND && typeof window.SND.setIntensity === "function") window.SND.setIntensity(v); } catch (e) { }
  }

  /* 两段局内决策：赛前战术（4 选 1，决胜局可加「临场指挥」）→ 资源决策（5 选 1）→ 进对局 */
  function prepGameScene() {
    const bo = M.series;
    if (!bo) return monthEnd();
    const gNow = (bo.g || 0) + 1;
    const decider = (bo.bestOf || 5) >= 5 ? gNow === 5 : (bo.wins === 1 && bo.losses === 1);
    const opts = GAME_PLANS.map(p => ({ k: p.k, n: p.n, t: p.t, d: p.d, dim: p.dim, pct: p.pct, pctText: Math.round((p.pct || 0) * 100) + "%" }));
    if (decider) opts.push({ k: "command", n: "临场指挥", t: "你抢过教练的战术板，自己喊 BP", d: "团队 +8%，消耗教练信任 8", dim: "TEAM", pct: .08, cost: 8, coachCost: 8 });
    const note = M._prepNote || "";
    if (!bo.oppRoster) bo.oppRoster = oppRosterOf(bo.oppId);
    /* 旧版 ui.js 把 type=inGame 当成局内节点渲染（读 opts[].p/pLo/pHi/dimName），这里补上估算值，避免“成功率 NaN%” */
    const sopts = opts.map(p => Object.assign({}, p, {
      t: p.n + (p.pct ? "（本局 +" + Math.round(p.pct * 100) + "%）" : ""),
      p: clamp(.5 + (p.pct || 0) / 2, .05, .95), pLo: clamp(.5 + (p.pct || 0) / 2 - .06, 0, 1), pHi: clamp(.5 + (p.pct || 0) / 2 + .06, 0, 1),
      dimName: DIM_CN[p.dim] || ""
    }));
    const txt = (note ? note + "\n" : "") + "BP 结束，这一局你想怎么打？你的布置会给全队一个本局加成。";
    return scene({
      /* 注：type 用 "inGame"（phase=plan）而不是新 type "prep"：现有 repair_check 的 BO5/世界赛驱动循环只接受
         bp/inGame/result/boGame/moment/hl，独立 prep 场景会让它提前跳出、破坏 22 项验收。UI 靠 phase 分支渲染。 */
      type: "inGame", phase: "plan", prep: true, kind: "plan", g: gNow, bestOf: bo.bestOf || 5, score: (bo.wins || 0) + " : " + (bo.losses || 0),
      oppName: bo.oppName || "", oppHero: bo.oppHero || "", myHero: bo.myHero || (bo.hero || ""), hero: bo.myHero || (bo.hero || ""),
      title: "第 " + gNow + " 局 · 赛前部署", decider: decider,
      text: txt, sit: { d: txt }, node: { t: "赛前部署 · 第 " + gNow + " 局", text: txt },
      opts: sopts, plans: opts,
      myRoster: myRosterDetail(), oppRoster: bo.oppRoster,
      pick(i, v) {
        M._prepNote = "";
        const k = (typeof v === "string" && v.indexOf("plan:") === 0) ? v.slice(5) : (((sopts[clamp(i, 0, sopts.length - 1)] || {}).k) || "");
        const p = opts.filter(o => o.k === k)[0] || opts[0];
        if (!p) return prepGameScene();
        if (p.k === "command") {
          if (S.coachTrust < 8) { M._prepNote = "教练看了你一眼：现在不归你指挥。（信任不足 8）"; return prepGameScene(); }
          S.coachTrust = clamp(S.coachTrust - 8, 0, 100);
          bo.usedCommand = true;
          bo.commandG = gNow;
        }
        bo.gamePlan = p.k; bo.gamePlanName = p.n;
        return prepResScene();
      }
    });
  }
  function prepResScene() {
    const bo = M.series;
    if (!bo) return monthEnd();
    const gNow = (bo.g || 0) + 1;
    const opts = RES_PLANS.map(p => ({ k: p.k, n: p.n, t: p.t, d: p.d, dim: p.dim, mom: p.mom || 0 }));
    const txt = "开局第一个资源点怎么分配？（" + (bo.gamePlanName || "本局战术") + "）";
    /* 旧版 ui.js 的 inGame 渲染需要 p/pLo/pHi/dimName；资源决策不是“成功率”，给 50% 的中性值兜底避免 NaN */
    const sopts = opts.map(p => Object.assign({}, p, {
      p: .5, pLo: .42, pHi: .58, dimName: DIM_CN[p.dim] || ""
    }));
    return scene({
      type: "inGame", phase: "resource", prep: true, kind: "res", g: gNow, bestOf: bo.bestOf || 5, score: (bo.wins || 0) + " : " + (bo.losses || 0),
      oppName: bo.oppName || "", oppHero: bo.oppHero || "", myHero: bo.myHero || (bo.hero || ""), hero: bo.myHero || (bo.hero || ""),
      title: "第 " + gNow + " 局 · 资源决策", text: txt, sit: { d: txt }, node: { t: "资源决策 · 第 " + gNow + " 局", text: txt },
      opts: sopts, res: opts,
      myRoster: myRosterDetail(), oppRoster: bo.oppRoster || oppRosterOf(bo.oppId),
      pick(i, v) {
        const k = (typeof v === "string" && v.indexOf("res:") === 0) ? v.slice(4) : (((sopts[clamp(i, 0, sopts.length - 1)] || {}).k) || "");
        bo.resPlan = k;
        return startSeriesGame(bo, { plan: bo.gamePlan, res: k });
      }
    });
  }

  /* ---------------- 羁绊 ---------------- */
  function deckBonds() {
    try {
      const B = window.BONDS || {};
      const sum = B.summary || B.progress || null;
      if (!sum) return { summary: [], progress: null };
      return { summary: Array.isArray(sum) ? sum : (sum.summary || []), progress: B.progress || null };
    } catch (e) { return { summary: [], progress: null }; }
  }

  /* 抽卡池说明：R/SR/SSR 概率 + 保底 + 新池（DATA_TALENTS_V4）+ 羁绊说明，UI 直接照着渲染 */
  function poolInfo() {
    try {
      const all = D.talents() || [];
      const wsum = Object.keys(RARITY_W).reduce((a, k) => a + RARITY_W[k], 0) || 1;
      const rates = {};
      Object.keys(RARITY_W).forEach(k => { rates[k] = Math.round((RARITY_W[k] / wsum) * 1000) / 10; });
      const b = deckBonds();
      return {
        total: all.length, v4: (window.DATA_TALENTS_V4 || []).length,
        pity: S.drawPity || 0, pityMax: 40, rates: rates,
        bonds: b.summary || [],
        note: "每 10 抽保底 1 张紫，40 抽保底 1 张金" + ((b.summary || []).length ? "；凑齐羁绊会强化卡组" : "")
      };
    } catch (e) { return { total: 0, rates: {}, bonds: [], note: "" }; }
  }

  /* ---------------- 成就 ---------------- */
  /* 跨局成就落盘：UI 成就墙读 localStorage 的 denshen_achv（数组/对象两种格式都兼容） */
  const ACHV_KEY = KEY + "achv";
  function achvStored() {
    try {
      const raw = localStorage.getItem(ACHV_KEY);
      if (!raw) return {};
      const o = JSON.parse(raw);
      const out = {};
      if (Array.isArray(o)) o.forEach(k => { if (k) out[String(k)] = 1; });
      else if (o && typeof o === "object") Object.keys(o).forEach(k => { out[k] = 1; });
      return out;
    } catch (e) { return {}; }
  }
  function achvMergeInto(target) {
    target = target || {};
    const st = achvStored();
    Object.keys(st).forEach(k => { if (!target[k]) target[k] = Number(st[k]) || 1; });
    return target;
  }
  function achvPersist(ids) {
    try {
      const merged = achvStored();
      (ids || []).forEach(k => { if (k) merged[k] = S.tick || 1; });
      let keys = Object.keys(merged);
      if (keys.length > 200) keys = keys.slice(keys.length - 200);
      localStorage.setItem(ACHV_KEY, JSON.stringify(keys));
    } catch (e) { }
  }
  function achvList() { try { return window.DATA_ACHV || []; } catch (e) { return []; } }
  function achvHit(a) {
    try {
      if (!a) return false;
      if (typeof a.cond === "function") return !!a.cond(S, window.GAME || {});
      if (typeof a.check === "function") return !!a.check(S, window.GAME || {});
      const c = a.cond || a.need || null;
      if (!c) return false;
      const rec = S.record || {};
      const story = S.story || {};
      const titlesN = (rec.titles || []).length;
      const worldsWin = (rec.worlds || []).some(x => x.win);
      const msiWin = (rec.msi || []).some(x => x.win);
      const ok = (k, v) => {
        switch (k) {
          case "ovr": case "minOvr": return myOvr() >= v;
          case "maxOvr": return myOvr() <= v;
          case "titles": case "minTitles": return titlesN >= v;
          case "maxTitles": return titlesN <= v;
          case "worlds": return v === false ? !worldsWin : worldsWin;
          case "fame": case "minFame": return S.st.FAME >= v;
          case "maxFame": return S.st.FAME <= v;
          case "money": case "minMoney": return (S.money || 0) >= v;
          case "maxMoney": return (S.money || 0) <= v;
          case "fans": case "minFans": return (S.fans || 0) >= v;
          case "maxFans": return (S.fans || 0) <= v;
          case "games": return (rec.games || 0) >= v;
          case "season": case "minSeasons": return (S.season || 1) >= v;
          case "maxSeasons": return (S.season || 1) <= v;
          case "worldsChampion": return v ? worldsWin : !worldsWin;
          case "msiChampion": return v ? msiWin : !msiWin;
          case "endingName": {
            const nm = rec.ending && rec.ending.name;
            if (!nm) return false;
            return Array.isArray(v) ? v.indexOf(nm) >= 0 : nm === v;
          }
          case "endingRank": {
            const rk = rec.ending && rec.ending.rank;
            if (!rk) return false;
            const s = String(rk);
            if (Array.isArray(v)) return v.some(x => s === String(x) || s.charAt(0) === String(x).charAt(0));
            return s === String(v) || s.charAt(0) === String(v).charAt(0);
          }
          case "storyCorrupt": return (story.corrupt || 0) >= v;
          case "storyJustice": return (story.justice || 0) >= v;
          case "mateAff": {
            const ms = matesRaw();
            const mx = ms.reduce((m, x) => Math.max(m, x.aff || 0), 0);
            return mx >= v;
          }
          case "heroCount": return Object.keys(S.pool || {}).length >= v;
          case "gachaCount": return (rec.draws || 0) >= v;
          case "debtEver": return v ? !!rec.debtEver : !rec.debtEver;
          case "injuryCount": return (rec.injuries || 0) >= v;
          case "playMode": return S.mode === v || (v === "endless" ? !!S.endless : false);
          default: return false;
        }
      };
      if (Array.isArray(c)) return c.every(x => ok(x.k, x.v));
      return Object.keys(c).every(k => ok(k, c[k]));
    } catch (e) { return false; }
  }
  function checkAchv() {
    try {
      S.achv = S.achv || {};
      const out = [];
      achvList().forEach(a => {
        if (!a || !a.id || S.achv[a.id]) return;
        if (achvHit(a)) { S.achv[a.id] = S.tick; out.push(a.id); }
      });
      if (out.length) { M.achvNew = out; achvPersist(out); }
      return out;
    } catch (e) { return []; }
  }

  /* ---------------- 新手引导标记 / 自动托管 ---------------- */
  function guide(key) {
    try {
      M.guide = M.guide || {};
      if (M.guide[key]) return false;
      M.guide[key] = 1;
      return true;
    } catch (e) { return false; }
  }
  function seasonNo() { return S.season || (Math.floor((S.tick - 1) / 12) + 1); }
  /* 托管等级：0 手动 / 1 自动抽卡+跳过商店 / 2 再自动处理低权重事件；赛季≥3 自动开到 1 档，玩家可手动关 */
  function autoLevel() {
    if (!S || !M) return 0;
    if (M.autoOff) return 0;
    let lv = M.autoMode || 0;
    if (lv < 1 && seasonNo() >= 3) lv = 1;
    return clamp(lv, 0, 2);
  }
  function toggleAuto() {
    M.autoMode = (M.autoMode || 0) >= 2 ? 0 : (M.autoMode || 0) + 1;
    M.autoOff = M.autoMode === 0;
    if (M.autoMode > 0) M.autoOff = false;
    return M.autoMode;
  }

  /* ---------------- W7 经济 ---------------- */
  function curSplit() {
    const m = S._ml ? S._ml.month : 1;
    return 1 + Math.floor((m - 1) / 3) + (S.season - 1) * 3;
  }
  function investTotal() { S.invest2 = S.invest2 || {}; let n = 0; for (const k in S.invest2) n += Number(S.invest2[k]) || 0; return n; }
  function investRoll() {
    S.invest2 = S.invest2 || {};
    const rows = [];
    for (const k in S.invest2) {
      const v = Number(S.invest2[k]) || 0;
      if (!v) continue;
      const pct = -.05 + rnd() * .25; /* 季度 −5% ~ +20% */
      const delta = Math.round(v * pct);
      S.invest2[k] = v + delta;
      S.money = clamp(S.money + delta, -999, 99999);
      rows.push({ k: k, delta: delta, pct: Math.round(pct * 100) });
    }
    return rows;
  }
  function sponsorPay() {
    try {
      if (!S.sponsor && S.st.FAME >= 55) {
        const brands = ["星牌", "铁三角", "黑鲨", "海蓝", "ASUS 玩家国度", "战马"];
        const nm = brands[hashStr(String(S.name || "") + Math.floor((S.tick || 1) / 12)) % brands.length];
        S.sponsor = { name: nm, fee: Math.round((S.st.FAME - 50) * .5 + 3), months: 12 };
        S.timeline = S.timeline || [];
        S.timeline.push({ t: S.tick, text: "签下赞助 " + nm });
      }
      if (S.sponsor) {
        if (S.sponsor.months > 0 && S.st.FAME >= 40) { S.sponsor.months--; return S.sponsor.fee; }
        S.sponsor = null;
      }
    } catch (e) { }
    return 0;
  }

  function mySide(hero, tactic) {
    const S2 = window.MATCH;
    const eb = energyBand(S.energy);
    const side = S2.makeSide({
      players: squadOf(S.teamId, true),
      hero: hero || "", heroProf: hero ? heroProf(hero) : 60,
      mainHero: !!hero && hero === S.mainHero,
      energy: S.energy, energyBand: eb, morale: S.morale, spirit: S.spirit === undefined ? 60 : S.spirit,
      burst: S.burst, voice: voice(), coachTrust: S.coachTrust,
      tactic: tactic || "ope", env: (S.patch && S.patch.env) || "运营",
      keyBonus: (S.gearBonus || 0) + (S.invest && S.invest.gear ? 3 : 0) + ((M.series && M.series.prepBonus) || 0),
      form: M.form || 0
    });
    /* 体力档位作为 FORM 修正已进 makeSide；这里再留一份标签给结算页和 BP 展示 */
    side.energyBand = eb;
    side.labels = side.labels || [];
    if (eb.form < 0) side.labels.push({ k: "体力不支", v: eb.form });
    else if (eb.form > 0) side.labels.push({ k: "精力充沛", v: eb.form });
    /* 带伤上场：不是不能打，是打得没那么好 */
    if (M.injury && M.injury.months > 0) {
      side.dims.FORM = (side.dims.FORM || 0) + (M.injury.form || -4);
      side.labels.push({ k: "带伤（" + M.injury.part + "）", v: M.injury.form || -4 });
      side.injury = M.injury.part;
    }
    const bd = buildDims();
    for (const k in bd) side.dims[k] = (side.dims[k] || 0) + bd[k];
    side.buildBonus = bd;
    /* 队友关系：aff 均值 ±2 团队修正（轻量，别压过战术/英雄） */
    const mateShift = clamp(Math.round((matesAffMean() - 50) / 25), -2, 2);
    if (mateShift) {
      side.dims.TEAM = (side.dims.TEAM || 0) + mateShift;
      side.labels.push({ k: mateShift > 0 ? "队友关系好" : "队友关系差", v: mateShift });
    }
    /* 大赛经验：打到世界赛淘汰赛，手不抖（登神不该只靠运气） */
    if (M.worlds) { side.dims.GAME = (side.dims.GAME || 0) + 1; side.dims.TEAM = (side.dims.TEAM || 0) + 1; }
    return applyStyle(side, (M.series || {}).oppTendency);
  }

  /* 赛前布置真的会改变数值：针对核心就掉他，补短板就抬你 */
  function applyPrep(mine, theirs) {
    const bo = M.series || {};
    if (bo.prep === "focus" && bo.prepDim) theirs.dims[bo.prepDim] = (theirs.dims[bo.prepDim] || 0) - 8;
    if (bo.prep === "cover" && bo.coverDim) mine.dims[bo.coverDim] = (mine.dims[bo.coverDim] || 0) + 7;
    return { mine: mine, theirs: theirs };
  }
  function theirSide(tid, hero, tendency) {
    const side = window.MATCH.makeSide({
      players: squadOf(tid, false),
      hero: hero || "", heroProf: 78,
      energy: 78, morale: 65, spirit: 62, burst: 0,
      coachTrust: 60, tactic: "ope", env: (S.patch && S.patch.env) || "运营",
      form: 0
    });
    let dof = (DIFFS[S.diff] && DIFFS[S.diff].opp) || 0;
    if (M.worlds) dof += ({ easy: 0, normal: 4, hard: 4, hell: 2 })[S.diff] || 0;
    if (dof) { ["LANE", "MECH", "GAME", "POOL", "TEAM"].forEach(function (k) { side.dims[k] = (side.dims[k] || 0) + dof; }); }
    side.tendency = tendency || ({ 体系: "运营", 铁腕: "团战", 放养: "单带" }[(teamOf(tid) || {}).coachStyle] || "运营");
    return side;
  }

  function dimRows(mine, theirs) {
    const keys = ["LANE", "MECH", "GAME", "POOL", "TEAM", "FORM"];
    return keys.map(k => ({ k: k, name: DIM_CN[k], a: Math.round(mine.dims[k] || 0), b: Math.round(theirs.dims[k] || 0) }));
  }

  /* ---------------- 版本更新 ---------------- */
  function rollPatch() {
    const H = D.heroes();
    const big = chance(.2);
    const n = big ? rint(6, 8) : rint(4, 6);
    const picked = shuffle(H).slice(0, n);
    const buff = {};
    picked.forEach(h => { buff[h.n] = (chance(.5) ? 1 : -1) * rint(4, 10); });
    const env = pick(["打团", "前期滚雪球", "单带", "运营", "对线"]);
    S.patchNo = (S.patchNo || 0) + 1;
    S.patch = {
      no: S.patchNo, buff: buff, env: env, big: big,
      year: S._ml.year, month: S._ml.month,
      list: picked.map(h => ({ n: h.n, en: h.en, d: buff[h.n] }))
    };
    /* 版本直接改熟练度：绝活被砍会掉，下水道起飞会涨 */
    for (const k in buff) {
      if (S.pool[k] === undefined) continue;
      S.pool[k] = clamp(S.pool[k] + (buff[k] > 0 ? rint(2, 5) : -rint(2, 6)), 0, 99);
    }
    return S.patch;
  }

  function patchScene() {
    const p = S.patch;
    return scene({
      type: "patch", patch: p, ml: S._ml,
      pick() { return actionScene(); }
    });
  }

  /* ---------------- 积分榜 ---------------- */
  function initStandings() {
    const region = regionOf();
    const rows = {};
    allTeams().filter(t => t.region === region).forEach(t => {
      rows[t.id] = { id: t.id, name: t.name, w: 0, l: 0, last: [] };
    });
    if (S.teamId && !rows[S.teamId]) {
      const t = teamOf(S.teamId);
      rows[S.teamId] = { id: S.teamId, name: t ? t.name : "我的队", w: 0, l: 0, last: [] };
    }
    S.standings = { region: region, rows: rows };
  }
  function simLeagueRound() {
    if (!S.standings || !S.standings.rows) return;
    const rows = S.standings.rows;
    const entries = Object.keys(rows).filter(id => id !== S.teamId && teamOf(id))
      .map(id => ({ id: id, power: teamPower(id) }));
    if (entries.length < 2) return;
    MATCH.leagueRound(entries, rnd).forEach(r => {
      const A = rows[r.a], B = rows[r.b];
      if (!A || !B) return;
      if (r.win === "a") { A.w++; B.l++; A.last.push("W"); B.last.push("L"); }
      else { B.w++; A.l++; B.last.push("W"); A.last.push("L"); }
      A.last = A.last.slice(-5); B.last = B.last.slice(-5);
    });
  }
  function addMyResult(win) {
    const r = S.standings && S.standings.rows && S.standings.rows[S.teamId];
    if (!r) return;
    if (win) { r.w++; r.last.push("W"); } else { r.l++; r.last.push("L"); }
    r.last = r.last.slice(-5);
  }
  function standingsRows() {
    const rows = (S.standings && S.standings.rows) ? S.standings.rows : {};
    return Object.keys(rows).map(id => rows[id])
      .sort((a, b) => (b.w - a.w) || (a.l - b.l))
      .map((r, i) => Object.assign({}, r, { rank: i + 1, mine: r.id === S.teamId }));
  }
  function myStandRow() {
    return standingsRows().filter(r => r.mine)[0] || null;
  }
  function myRank() {
    const r = myStandRow();
    return r ? r.rank : 99;
  }
  function standingsScene(next) {
    return scene({
      type: "standings", rows: standingsRows(), ml: S._ml,
      split: S.splitN || 1,
      pick() { return next ? next() : monthEnd(); }
    });
  }

  /* ---------------- BO：BP → 局内节点 → 判定 ---------------- */
  function heroChoices(n) {
    return MATCH.heroesFor(S.pos, S.pool, patchMap(), n || 6);
  }

  /* ---------------- 打法风格 & 赛前布置 ---------------- */
  const STYLE_MAP = {
    early: { name: "快攻", desc: "前中期找机会，压制对面野区，25 分钟解决战斗", dim: { LANE: 5, GAME: -2 }, beats: "ope", cost: "后期容易崩" },
    ope: { name: "运营", desc: "控龙控视野，把经济差滚起来，打到对面心态炸", dim: { GAME: 5, LANE: -2 }, beats: "fight", cost: "前期容易被抓穿" },
    fight: { name: "团战", desc: "练团，进团就是赢，五个人一起上", dim: { TEAM: 5, LANE: -1 }, beats: "split", cost: "对线期会亏线" },
    split: { name: "单带", desc: "四一分推，你要么被我拆塔，要么被我抓单", dim: { LANE: 3, GAME: 2, TEAM: -4 }, beats: "early", cost: "团战少一个" }
  };
  const TEND_KEY = { "运营": "ope", "团战": "fight", "单带": "split" };

  function styleOf() { return S.style && STYLE_MAP[S.style] ? S.style : null; }

  function applyStyle(side, oppTendency) {
    const sk = styleOf();
    if (!sk) return side;
    const sd = STYLE_MAP[sk].dim;
    for (const k in sd) side.dims[k] = (side.dims[k] || 0) + sd[k];
    const ok = TEND_KEY[oppTendency || "运营"];
    if (ok) {
      if (STYLE_MAP[sk].beats === ok) { for (const k of ["LANE", "MECH", "GAME", "TEAM"]) side.dims[k] = (side.dims[k] || 0) + 4; side.styleEdge = 4; }
      else if (STYLE_MAP[ok] && STYLE_MAP[ok].beats === sk) { for (const k of ["LANE", "MECH", "GAME", "TEAM"]) side.dims[k] = (side.dims[k] || 0) - 4; side.styleEdge = -4; }
    }
    return side;
  }

  function styleScene(next) {
    return scene({
      type: "style", cur: styleOf(),
      opts: ["early", "ope", "fight", "split"].map(k => ({ k: k, name: STYLE_MAP[k].name, desc: STYLE_MAP[k].desc, cost: STYLE_MAP[k].cost, beats: STYLE_MAP[STYLE_MAP[k].beats].name })),
      pick(i, v) {
        if (v === "back") return next ? next() : actionScene();
        const k = ["early", "ope", "fight", "split"][clamp(i, 0, 3)];
        S.style = k;
        S.teamStatus = clamp(S.teamStatus + 2, 0, 100);
        S.timeline.push({ t: S.tick, text: `队伍打法定为「${STYLE_MAP[k].name}」` });
        return result("定打法", `从今天起，队伍按「${STYLE_MAP[k].name}」打。${STYLE_MAP[k].desc}。\n\n代价：${STYLE_MAP[k].cost}。\n克制关系：${STYLE_MAP[k].name} 吃 ${STYLE_MAP[STYLE_MAP[k].beats].name}，被 ${Object.keys(STYLE_MAP).filter(x => STYLE_MAP[x].beats === k).map(x => STYLE_MAP[x].name).join("/") || "无"} 吃。`, "info", () => next ? next() : actionScene());
      }
    });
  }

  /* 赛前布置：BO5 之前先想清楚这场怎么打 */
  function prepScene() {
    const bo = M.series;
    if (!bo) return monthEnd();
    bo.bestOf = bo.bestOf || 5;
    if (bo.prepped) return bpScene();
    const mine = mySide(bo.myHero, bo.tactic);
    const theirs = theirSide(bo.oppId, bo.oppHero);
    const rows = dimRows(mine, theirs);
    const theirBest = rows.slice().sort((a, b) => b.b - a.b)[0];
    const myWorst = rows.slice().sort((a, b) => a.a - b.a)[0];
    const tb = (teamOf(bo.oppId) || {});
    return scene({
      type: "prep", oppName: bo.oppName, tendency: bo.oppTendency, best: theirBest, worst: myWorst, rows: rows,
      style: styleOf(), styleName: styleOf() ? STYLE_MAP[styleOf()].name : "",
      coach: tb.coachStyle || "体系",
      pick(i, v) {
        if (v === "back") { M.series = null; return monthEnd(); }
        bo.prepped = true;
        if (i === 0) { bo.prep = "focus"; bo.prepDim = theirBest.k; bo.prepText = `全队盯着 ${theirBest.name} 打，把他那一环按死（对方 ${theirBest.name} −8）`; }
        else if (i === 1) { bo.prep = "cover"; bo.coverDim = myWorst.k; bo.prepText = `把 ${myWorst.name} 这一环补上，别让人从这里撕开（自己 ${myWorst.name} +7）`; }
        else { bo.prep = "hide"; bo.prepBonus = 4; bo.prepText = "藏一手底牌，决胜局再掏出来"; }
        return bpScene();
      }
    });
  }

  /* ================= BP 辅助（P0-1/P0-2/P1-5/P1-6） =================
   * 三个硬约束：对面英雄永远不在 ban 列表里；英雄池空了必须回退；任何一屏的选项都不能是空的。
   */
  function heroData(n) {
    const H = window.DATA_HEROES || [];
    for (let i = 0; i < H.length; i++) if (H[i].n === n) return H[i];
    return { n: n, tag: [], diff: 2 };
  }
  function heroTags(n) { return (heroData(n).tag || []).slice(0, 3); }
  function patchOf(n) { const p = patchMap(); return p[n] || 0; }
  function banNames(bo) {
    const out = [];
    ((bo && bo.oppBans) || []).forEach(n => { if (n && out.indexOf(n) < 0) out.push(n); });
    ((bo && bo.bans) || []).forEach(b => { const n = b && b.n ? b.n : b; if (n && out.indexOf(n) < 0) out.push(n); });
    return out;
  }
  function oppPickHero(bo, myHero) {
    const ex = banNames(bo);
    if (myHero && ex.indexOf(myHero) < 0) ex.push(myHero);
    let h = MATCH.aiPick(S.pos, rnd, patchMap(), ex);
    for (let k = 0; k < 12 && (!h || ex.indexOf(h) >= 0); k++) {
      if (h && ex.indexOf(h) < 0) ex.push(h);
      h = MATCH.aiPick(S.pos, rnd, patchMap(), ex);
    }
    if (!h) {
      const rest = (window.DATA_HEROES || []).filter(x => (x.pos || []).indexOf(S.pos) >= 0 && ex.indexOf(x.n) < 0);
      h = rest.length ? rest[Math.floor(rnd() * rest.length) % rest.length].n : (S.mainHero || "");
    }
    return h || "";
  }
  function heroPoolAll() {
    return (window.DATA_HEROES || []).filter(h => (h.pos || []).indexOf(S.pos) >= 0)
      .map(h => ({ n: h.n, en: h.en, prof: 1, diff: h.diff, tag: h.tag, buff: patchOf(h.n) }));
  }
  function bestTactic(tendency) {
    const env = (S.patch && S.patch.env) || "运营";
    let best = null, bs = -9;
    TACTICS.forEach(t => { const te = MATCH.tacticEdge(t.k, tendency, env); if (te.e > bs) { bs = te.e; best = t; } });
    return best ? best.k : "ope";
  }
  function bestHeroForBP(bo) {
    const banned = banNames(bo);
    const hs = heroChoices(40).filter(x => banned.indexOf(x.n) < 0);
    if (hs.length) return hs[0].n;
    const rest = heroPoolAll().filter(x => banned.indexOf(x.n) < 0);
    return rest.length ? rest[0].n : (autoHero() || S.mainHero || "");
  }
  /* 一局比赛的统一入口：BP 走完 / 沿用 / 助教 / 模拟都从这里进 */
  function startSeriesGame(bo, opt) {
    opt = opt || {};
    const opp = typeof bo.opp === "string" ? findTeam(bo.opp) : (bo.opp || findTeam("对手"));
    const tendency = bo.oppTendency || "运营";
    const banned = banNames(bo);
    let hero = opt.hero || bo.myHero || "";
    if (!hero || banned.indexOf(hero) >= 0) hero = bestHeroForBP(bo);
    if (!hero) hero = autoHero() || S.mainHero || "";
    const tactic = opt.tactic || bo.tactic || bestTactic(tendency);
    if (!opt.keepOpp || !bo.oppHero || banned.indexOf(bo.oppHero) >= 0 || bo.oppHero === hero) bo.oppHero = oppPickHero(bo, hero);
    bo.myHero = hero; bo.tactic = tactic;
    bo.mom = 0; bo.log = []; bo.usedPause = false; bo.usedBurn = false; bo.usedShout = false;
    bo.g = (bo.g || 0) + 1;
    bo.nodesLeft = opt.skipNodes ? 0 : ((bo.bestOf === 5 && bo.g === 5) ? 3 : 2);
    bo.bans = (opt.bans || []).slice();
    bo.lastBP = { hero: hero, tactic: tactic, bans: bo.bans.slice() };
    bo._mine = mySide(hero, tactic);
    bo._theirs = applyBans(theirSide(bo.oppId || opp.id, bo.oppHero, tendency), bo);
    if (bo._theirs && bo._theirs.banHits) bo.banHits = bo._theirs.banHits;
    bo.bans = [];
    bo.oppBans = null; /* 下一局对面重新 ban */
    /* 本局战术/资源决策落到双方 dims 上（BP 后两屏选完才进来；quick 路径没有则跳过） */
    if (opt.plan || opt.res) applyGamePlan(bo, opt.plan || bo.gamePlan, opt.res || bo.resPlan);
    bo.step = 0;
    if (opt.note) bo.log.push(opt.note);
    return bo.nodesLeft > 0 ? nodeScene() : finishGame();
  }
  /* P1-5：第 2 局起可以沿用/助教/模拟；第 1 局必须完整 BP（保证一个 BO5 至少有一次真 BP） */
  function quickOpts(bo, decider) {
    const g = bo.g || 0;
    return {
      reuse: !!(g >= 1 && bo.lastBP && bo.lastBP.hero),
      aide: g >= 1,
      sim: g >= 1 && !decider
    };
  }
  function quickPick(bo, v, quick) {
    if (v === "quick:reuse") {
      if (!quick.reuse) return null;
      const lb = bo.lastBP;
      return startSeriesGame(bo, { hero: lb.hero, tactic: lb.tactic, bans: lb.bans, keepOpp: true, note: "沿用上一局的 BP：同一套阵容，同一套 ban 位。" });
    }
    if (v === "quick:aide") {
      if (!quick.aide) return null;
      S.coachTrust = clamp(S.coachTrust - 2, 0, 100);
      S.energy = clamp(S.energy - 4, 0, 100);
      return startSeriesGame(bo, {
        hero: bestHeroForBP(bo), tactic: bestTactic(bo.oppTendency || "运营"),
        bans: bo.lastBP ? bo.lastBP.bans : [], note: "助教代 BP：他翻了翻数据，把最稳的那套写上去了。"
      });
    }
    if (v === "quick:sim") {
      if (!quick.sim) return null;
      return startSeriesGame(bo, {
        hero: bestHeroForBP(bo), tactic: bestTactic(bo.oppTendency || "运营"),
        bans: bo.lastBP ? bo.lastBP.bans : [], skipNodes: true, note: "模拟本场：按双方实力直接出结果。"
      });
    }
    return null;
  }

  /* 决胜局的 ban 位收益：按掉对面一个绝活，他这条线就少 2 点 */
  function applyBans(side, bo) {
    const hits = ((bo && bo.bans) || []).filter(b => b && b.comfort).length;
    if (!hits || !side || !side.dims) return side;
    /* ban 位最多 5 个，收益封顶 3 个，不然决胜局按掉五个直接赢 */
    const pen = Math.min(3, hits) * 2;
    ["LANE", "MECH", "GAME", "POOL", "TEAM"].forEach(k => { side.dims[k] = Math.max(1, side.dims[k] - pen); });
    side.banHits = hits;
    return side;
  }

  function bpScene() {
    const bo = M.series;
    if (!bo) return monthEnd();
    bo.step = bo.step || 0;
    const opp = typeof bo.opp === "string" ? findTeam(bo.opp) : (bo.opp || findTeam("对手"));
    const tendency = bo.oppTendency || (theirSide(opp.id, bo.oppHero || "").tendency) || "运营";
    /* 第几局、是不是决胜局、红蓝方（奇数局先选＝蓝，偶数局后手＝红） */
    const gNow = (bo.g || 0) + 1;
    const decider = (bo.bestOf === 5) ? gNow === 5 : (bo.wins === 1 && bo.losses === 1);
    const blueSide = ((bo.g || 0) % 2) === 0;
    const invest = S.invest || {};
    const known = S.coachTrust >= 60 || !!invest.data;
    const dataKnown = !!invest.data;
    const quick = quickOpts(bo, decider);
    const oppBase = { id: opp.id, name: opp.name, tendency: tendency, coachStyle: (teamOf(opp.id) || {}).coachStyle || "体系" };
    const scoreTxt = bo.wins + "-" + bo.losses;
    const bestOfTxt = bo.bestOf || 5;

    /* ---------- step 0：ban ---------- */
    if (bo.step === 0) {
      /* P1-10：决胜局 3 个 ban + 数据/赛段投资，clamp 1..5，每轮递减 */
      const banTotal = clamp((decider ? 3 : 1) + (invest.banPlus || 0) + (invest.banPlusSplit || 0), 1, 5);
      bo.bans = bo.bans || [];
      if (!bo.oppBans) {
        /* 对面不是傻子：先按你池子里熟练度最高的那几个 */
        const top = MATCH.heroesFor(S.pos, S.pool, patchMap(), banTotal + 2).map(x => x.n);
        bo.oppBans = top.length ? top.slice(0, banTotal) : [S.mainHero || ""].filter(Boolean);
      }
      if (bo.bans.length >= banTotal) {
        bo.step = 1;
        if (!blueSide && (!bo.oppHero || banNames(bo).indexOf(bo.oppHero) >= 0)) bo.oppHero = oppPickHero(bo);
        return bpScene();
      }
      const banLeft = Math.max(1, banTotal - bo.bans.length);
      const myPoolNames = Object.keys(S.pool || {});
      const taken = banNames(bo);
      /* 只 ban 中立英雄和对面练得最熟的，绝不放自己池子里的（P0-2） */
      const comfort = [];
      for (let i = 0; i < 6 && comfort.length < 3; i++) {
        const h = MATCH.aiPick(S.pos, rnd, patchMap(), comfort.concat(myPoolNames).concat(taken));
        if (h && comfort.indexOf(h) < 0 && myPoolNames.indexOf(h) < 0) comfort.push(h);
      }
      const banOpts = comfort.map((h, i) => ({
        n: h, t: "ban " + h, tag: heroTags(h), diff: heroData(h).diff || 2, patch: patchOf(h),
        comfort: true, star: i === 0, pick: true, ban: h,
        d: (i === 0 ? (known ? "对面练得最熟的一个，绝活" : "对面可能常用") : (known ? "对面舒适区里的英雄" : "对面可能常用")) + (decider ? " · 决胜局 ban 位" : "")
      }));
      const neutral = (window.DATA_HEROES || []).filter(h => (h.pos || []).indexOf(S.pos) >= 0
        && myPoolNames.indexOf(h.n) < 0 && comfort.indexOf(h.n) < 0 && taken.indexOf(h.n) < 0)
        .map(h => ({ h: h, s: patchOf(h.n) * 3 + (3 - (h.diff || 2)) }))
        .sort((a, b) => b.s - a.s);
      neutral.slice(0, 2).forEach(x => {
        banOpts.push({
          n: x.h.n, t: "ban " + x.h.n, tag: (x.h.tag || []).slice(0, 3), diff: x.h.diff || 2, patch: patchOf(x.h.n),
          comfort: false, star: false, pick: true, ban: x.h.n,
          d: "中立英雄，ban 掉谁也用不上——但能少一个变数"
        });
      });
      banOpts.push({ n: "", t: "不 ban，留个位置", tag: [], diff: 0, patch: 0, comfort: false, star: false, pick: true, ban: "", d: "空 ban。对面会觉得你在装。" });
      /* 兜底：英雄池把本位置全占了（LDL 低熟练度池 / 极端档）时 banOpts 可能只剩「空 ban」，
         这样点空 ban 会原地打转卡死——至少放 2 个任意位置的英雄进来，保证有真 ban 可点 */
      if (banOpts.length <= 1) {
        const extra = (window.DATA_HEROES || []).filter(h => myPoolNames.indexOf(h.n) < 0 && taken.indexOf(h.n) < 0).slice(0, 2);
        extra.forEach(h => banOpts.unshift({
          n: h.n, t: "ban " + h.n, tag: heroTags(h.n), diff: h.diff || 2, patch: patchOf(h.n),
          comfort: false, star: false, pick: true, ban: h.n,
          d: "池子外英雄，ban 掉少一个变数"
        }));
      }
      return scene({
        type: "bp", step: 0, decider: decider, banNeed: banTotal, banLeft: banLeft, banTotal: banTotal,
        bans: bo.bans.map(b => b.n || "空 ban"),
        side: blueSide ? "blue" : "red", oppBans: (bo.oppBans || []).slice(), oppHeroKnown: !blueSide,
        opp: oppBase,
        myOvr: myOvr(), oppPower: Math.round(teamPower(opp.id)),
        coachTip: known ? "教练：对面整体想打" + tendency + "，别跟着他们走。" : "",
        opps: squadOf(opp.id, false).map(x => ({ pos: x.pos, name: x.name, ovr: x.pid ? ovr(x.st, x.pos) : Math.round(ovr(x.st, x.pos)) })),
        myRoster: myRosterDetail(), oppRoster: oppRosterOf(opp.id),
        banOpts: banOpts, dataKnown: dataKnown,
        oppComfort: comfort.map((h, i) => ({ n: h, tag: heroTags(h), diff: heroData(h).diff || 2, patch: patchOf(h), star: i === 0 })),
        oppOnePick: dataKnown ? (comfort[0] || "") : "",
        reveal: (dataKnown ? 1 : 0) + (bo.reveal || 0),
        score: scoreTxt, g: gNow, bestOf: bestOfTxt,
        quick: quick,
        pick(i, v) {
          const q = quickPick(bo, v, quick);
          if (q) return q;
          if (v === "skip") {
            bo.step = 1;
            if (!blueSide && (!bo.oppHero || banNames(bo).indexOf(bo.oppHero) >= 0)) bo.oppHero = oppPickHero(bo);
            return bpScene();
          }
          let o = null;
          if (typeof v === "string" && v.indexOf("ban:") === 0) o = banOpts.filter(x => x.n === v.slice(4))[0] || null;
          else o = banOpts[clamp(i, 0, banOpts.length - 1)] || banOpts[0];
          if (!o) return bpScene();
          /* 空 ban 也要消耗一个 ban 位，否则点它永远停在同一屏（stats/qa2 点了没反应会判 stuck） */
          if (o.n) bo.bans.push({ n: o.n, comfort: !!o.comfort });
          else bo.bans.push({ n: "", comfort: false, skip: true });
          if (bo.bans.length >= banTotal) {
            bo.step = 1;
            if (!blueSide && (!bo.oppHero || banNames(bo).indexOf(bo.oppHero) >= 0)) bo.oppHero = oppPickHero(bo);
          }
          return bpScene();
        }
      });
    }

    /* ---------- step 1：pick 本命英雄（P0-2：池子空了也要有得选） ---------- */
    if (bo.step === 1) {
      const bannedAll = banNames(bo);
      let hsPool = heroChoices(40).filter(x => bannedAll.indexOf(x.n) < 0);
      let hsFallback = false;
      if (!hsPool.length) {
        /* 自己的英雄全被 ban 了：回退到该位置全部英雄，熟练度按 1 算 */
        hsFallback = true;
        hsPool = heroPoolAll().filter(x => bannedAll.indexOf(x.n) < 0);
        if (!hsPool.length) hsPool = heroPoolAll();
      }
      let hs = hsPool.slice(0, 6);
      if (!hs.length) {
        hsFallback = true;
        const h = autoHero() || S.mainHero || "";
        hs = h ? [{ n: h, prof: heroProf(h), diff: heroData(h).diff || 2, tag: heroTags(h), buff: patchOf(h) }] : [];
      }
      const oppHero = bo.oppHero && bannedAll.indexOf(bo.oppHero) < 0 && bo.oppHero !== bo.myHero ? bo.oppHero : "";
      const tacticK = bo.tactic || bestTactic(tendency);
      const te = MATCH.tacticEdge(tacticK, tendency, (S.patch && S.patch.env) || "运营");
      const opts = hs.map(x => {
        const ctr = oppHero ? MATCH.ctrOf(x.n, oppHero) : { d: 0, why: "" };
        return {
          t: x.n, hero: x.n, n: x.n, prof: x.prof, main: x.n === S.mainHero,
          tag: heroTags(x.n), tags: heroTags(x.n).slice(0, 2), diff: heroData(x.n).diff || 2, patch: patchOf(x.n),
          synergy: Math.round(ctr.d * 1.4 + te.e * 100),
          d: (hsFallback ? "池子里没英雄了，这个位置能上的都在这（熟练度按 1 算）· " : "")
            + "熟练度 " + Math.round(x.prof) + (x.buff ? "（版本" + (x.buff > 0 ? "+" : "") + x.buff + "）" : "") + (x.n === S.mainHero ? " · 本命" : ""),
          ctr: Math.round(ctr.d * 1.4), ctrWhy: ctr.why || ""
        };
      });
      const hsOut = opts.map(o => ({ n: o.n, tag: o.tag, diff: o.diff, patch: o.patch, synergy: o.synergy, prof: o.prof, main: o.main }));
      return scene({
        type: "bp", step: 1, opts: opts, hs: hsOut, hsFallback: hsFallback,
        hero: bo.myHero || "", ban: bo.bans.map(b => b.n).join("、"),
        side: blueSide ? "blue" : "red", oppBans: (bo.oppBans || []).slice(), oppHero: oppHero,
        pool: { total: heroChoices(40).length, left: hsPool.length },
        opp: oppBase, score: scoreTxt, g: gNow, bestOf: bestOfTxt,
        myRoster: myRosterDetail(), oppRoster: oppRosterOf(bo.oppId || opp.id),
        quick: quick,
        pick(i, v) {
          const q = quickPick(bo, v, quick);
          if (q) return q;
          if (v === "back") { bo.step = 0; return bpScene(); }
          let o = null;
          if (typeof v === "string" && v.indexOf("hero:") === 0) o = opts.filter(x => x.n === v.slice(5))[0] || null;
          else o = opts[clamp(i, 0, opts.length - 1)] || opts[0];
          if (!o) return bpScene();
          bo.myHero = o.n;
          /* 蓝方先选：选完先亮对面英雄，再让玩家选战术（P1-6） */
          if (blueSide && (!bo.oppHero || banNames(bo).indexOf(bo.oppHero) >= 0 || bo.oppHero === bo.myHero)) bo.oppHero = oppPickHero(bo, bo.myHero);
          bo.step = 2;
          return bpScene();
        }
      });
    }

    /* ---------- step 2：战术 + 对位信息 ---------- */
    const env = (S.patch && S.patch.env) || "运营";
    const heroN = bo.myHero || (bo.lastBP && bo.lastBP.hero) || autoHero() || S.mainHero || "";
    bo.myHero = heroN;
    const topts = TACTICS.map(t => {
      const te = MATCH.tacticEdge(t.k, tendency, env);
      return { t: t.name, k: t.k, n: t.name, d: t.desc, edge: te.e, why: te.why };
    });
    let oHero = bo.oppHero || "";
    if (!oHero || banNames(bo).indexOf(oHero) >= 0 || oHero === heroN) {
      oHero = oppPickHero(bo, heroN) || "";
      bo.oppHero = oHero;
    }
    const oInfo = oHero ? (heroData(oHero) || { tag: [], diff: 2 }) : null;
    const ctrInfo = (oHero && heroN) ? MATCH.ctrOf(heroN, oHero) : { d: 0, why: "" };
    let prob = 0;
    if (oHero && heroN) {
      const mineS = mySide(heroN, bo.tactic || bestTactic(tendency));
      const theirsS = theirSide(bo.oppId || opp.id, oHero, tendency);
      prob = clamp(MATCH.optionProb(mineS, theirsS, { dim: "GAME", patchBuffs: patchMap() }).p, .05, .95);
    }
    /* 对手本命 / 熟练度：data 没有 sig 字段，用对手同位置选手确定性生成 */
    const oppRoster = oppRosterOf(bo.oppId || opp.id);
    const oppPosRow = oppRoster.filter(r => r.pos === S.pos)[0] || null;
    const oppSig = oppPosRow ? (oppPosRow.sig || []) : [];
    const oppSigHere = !!oHero && oppSig.indexOf(oHero) >= 0;
    const oppComfort = Math.round(clamp((oppPosRow ? oppPosRow.ovr : 72) + (oppSigHere ? 9 : -4), 55, 99));
    const oppHeroInfo = oHero ? {
      n: oHero, tag: (oInfo.tag || []).slice(0, 3), diff: oInfo.diff || 2, pos: S.pos,
      patch: patchOf(oHero), ctr: { d: ctrInfo.d, why: ctrInfo.why || "" }, prob: Math.round(prob * 1000) / 1000,
      sig: oppSig.slice(), comfort: oppComfort, sigHit: oppSigHere,
      owner: oppPosRow ? { pos: oppPosRow.pos, posCN: oppPosRow.posCN, name: oppPosRow.name, ovr: oppPosRow.ovr, fake: !!oppPosRow.fake } : null
    } : null;
    return scene({
      type: "bp", step: 2, opts: topts, hero: heroN, myHero: heroN,
      ban: bo.bans.map(b => b.n).join("、"),
      side: blueSide ? "blue" : "red", oppBans: (bo.oppBans || []).slice(),
      opp: oppBase, oppHero: oHero, oppHeroInfo: oppHeroInfo,
      score: scoreTxt, g: gNow, bestOf: bestOfTxt,
      myRoster: myRosterDetail(), oppRoster: oppRoster,
      guide: guide("bp"),
      quick: quick,
      pick(i, v) {
        const q = quickPick(bo, v, quick);
        if (q) return q;
        if (v === "back") { bo.step = 1; return bpScene(); }
        let k = null;
        if (typeof v === "string" && v.indexOf("tac:") === 0) k = v.slice(4);
        else { const o = topts[clamp(i, 0, topts.length - 1)]; k = o ? o.k : null; }
        if (!k) k = "ope";
        bo.tactic = k;
        bo.oppRoster = oppRoster;
        /* BP 之后先做本局战术/资源两个决策，再进对局 */
        return prepGameScene();
      }
    });
  }

  function nodeScene() {
    const bo = M.series;
    if (!bo) return monthEnd();
    if (bo.nodesLeft <= 0) return finishGame();
    bo.nodesLeft--;
    if (!bo._mine) {
      const pr = applyPrep(mySide(bo.myHero, bo.tactic), theirSide(bo.oppId, bo.oppHero));
      bo._mine = pr.mine; bo._theirs = applyBans(pr.theirs, bo);
    }
    const mine = bo._mine;
    const theirs = bo._theirs;
    const key = bo.bestOf === 5 && bo.g === 5;
    const patchB = patchMap();
    /* 决胜局优先出「名场面」：这一回合的每个选择都会被记一辈子 */
    if (key && !bo._momentDone) {
      const mm = pickMoment();
      if (mm) {
        bo._momentDone = true;
        const mo = (mm.opts || []).map(o => {
          const r = MATCH.optionProb(mine, theirs, { dim: o.stat, key: true, patchBuffs: patchB });
          return {
            t: fillTok(o.t), dim: o.stat, dimName: DIM_CN[o.stat] || o.stat,
            p: clamp(r.p, .05, .95), pLo: clamp(r.p - .1, .03, .95), pHi: clamp(r.p + .07, .05, .97),
            tags: (r.tags || []).slice(0, 2), risk: o.risk ? "high" : "mid", cost: {}, swing: o.risk ? 8 : 0,
            ok: fillTok(o.ok), fail: fillTok(o.fail)
          };
        });
        return scene({
          type: "moment", title: fillTok(mm.title), text: fillTok(mm.text),
          tag: mm.tag || "clutch", opts: mo, hero: bo.myHero, oppName: bo.oppName,
          score: bo.wins + "-" + bo.losses, g: bo.g, bestOf: bo.bestOf, mom: bo.mom,
          pick(i) {
            const o = mo[clamp(i, 0, mo.length - 1)];
            const hit = rnd() < o.p;
            if (hit) {
              const gain = Math.round(30 + o.p * 34);
              bo.mom += gain;
              recordMoment(mm, mm.tag || "clutch", true);
              return result(o.t + " · 成了", (o.ok || "你做到了。") + "\n\n局势值 +" + gain + "，现在 " + bo.mom + "。全场都站起来了。", "win", () => nodeScene());
            }
            const loss = Math.round(24 + (1 - o.p) * 30);
            bo.mom -= loss;
            S.morale = clamp(S.morale - 4, 0, 100);
            recordMoment(mm, o.risk === "high" ? "send" : "throw", false);
            return result(o.t + " · 砸了", (o.fail || "你搞砸了。") + "\n\n局势值 " + bo.mom + "。这一波会被剪进集锦。", "lose", () => nodeScene());
          }
        });
      }
    }
    let sit, opts, node = null;
    /* 优先用节点池：每个选项都有代价，赌一把还是稳住，玩家自己定 */
    const pool = (window.DATA_NODES || []).filter(n => n && (!n.pos || !n.pos.length || n.pos.indexOf(S.pos) >= 0));
    if (pool.length) {
      const stage = bo.g <= 1 ? "early" : bo.g === 2 ? "mid" : bo.g === 3 ? "late" : bo.g === 4 ? "soul" : "clutch";
      const fit = pool.filter(n => !n.stage || !n.stage.length || n.stage.indexOf(stage) >= 0);
      const nd = pick(fit.length ? fit : pool);
      node = { t: nd.t, text: nd.text, id: nd.id };
      sit = { text: nd.text, t: nd.t, opts: nd.opts };
      opts = nd.opts.map(o => {
        const r = MATCH.optionProb(mine, theirs, { dim: o.dim, key: key, patchBuffs: patchB });
        const p = clamp(r.p + (o.base || 0) / 100, .05, .95);
        return {
          t: o.t, dim: o.dim, dimName: DIM_CN[o.dim] || o.dim,
          p: p, pLo: clamp(p - .1, .03, .95), pHi: clamp(p + .07, .05, .97),
          tags: (r.tags || []).slice(0, 3), risk: o.risk || "mid", cost: o.cost || {},
          swing: o.swing || 0, ok: o.ok, fail: o.fail
        };
      });
    } else {
      sit = makeDuel({ id: bo.oppId, name: bo.oppName }, { g: bo.g, wins: bo.wins, losses: bo.losses }).sit;
      opts = sit.opts.map(o => {
        const r = MATCH.optionProb(mine, theirs, { dim: o.stat, key: key, patchBuffs: patchB });
        return { t: o.t, dim: o.stat, dimName: DIM_CN[o.stat] || o.stat, p: r.p, pLo: clamp(r.p - .1, .03, .95), pHi: clamp(r.p + .07, .05, .97), tags: r.tags, risk: "mid", cost: {}, swing: 0, ok: o.ok, fail: o.fail };
      });
    }
    /* 位置专属的局内事件：你打的是自己的位置，才有这种事 */
    const ip = (window.DATA_EVENTS_POS || []).filter(e => e.inMatch && (!e.req || !e.req.pos || e.req.pos.indexOf(S.pos) >= 0));
    if (ip.length && chance(.55)) {
      const ev = pick(ip), o0 = pick(ev.opts || []);
      if (o0) {
        const dim = (o0.risk && o0.risk.stat) || Object.keys(o0.eff || {})[0] || "GAME";
        const rr = MATCH.optionProb(mine, theirs, { dim: dim, key: key, patchBuffs: patchB });
        opts.push({
          t: o0.t, dim: dim, dimName: DIM_CN[dim] || dim, p: rr.p, pLo: clamp(rr.p - .1, .03, .95), pHi: clamp(rr.p + .07, .05, .97),
          tags: (rr.tags || []).slice(0, 2), risk: "pos", cost: {}, swing: 4,
          ok: o0.res || "你做到了。", fail: "你搞砸了。", evEff: o0.eff || {}, posEv: ev.id, posText: ev.text
        });
      }
    }
    bo._cur = { opts: opts, sit: sit };
    const can = {
      pause: !bo.usedPause && S.coachTrust >= 20,
      burn: !bo.usedBurn && S.energy >= 25,
      shout: !bo.usedShout && voice() >= 15
    };
    return scene({
      type: "inGame", sit: sit, node: node, opts: opts, can: can,
      hero: bo.myHero, oppHero: bo.oppHero, tactic: bo.tactic,
      score: bo.wins + "-" + bo.losses, g: bo.g, bestOf: bo.bestOf,
      mom: bo.mom, log: bo.log.slice(-2), oppName: bo.oppName,
      pick(i, v) {
        if (v === "pause") {
          const cheap = S.coachTrust >= 65;
          bo.usedPause = true;
          S.coachTrust = clamp(S.coachTrust - (cheap ? 3 : 6), 0, 100);
          bo.mom += cheap ? 36 : 30;
          bo.log.push(cheap ? "战术暂停：教练把平板一拍，全队立刻懂了——他在你这边" : "战术暂停：教练把平板一拍，全队醒了");
          return nodeScene();
        }
        if (v === "burn") { bo.usedBurn = true; S.energy = clamp(S.energy - 12, 0, 100); bo.mom += 22; bo.log.push("透支：把最后一点体力全押上"); return nodeScene(); }
        if (v === "shout") { bo.usedShout = true; S.voiceDebt = (S.voiceDebt || 0) + 8; bo.mom += 40; bo.log.push("话语权：你在语音里喊了一句“跟我走”，全队跟上了"); return nodeScene(); }
        const o = bo._cur.opts[clamp(i, 0, bo._cur.opts.length - 1)];
        /* 代价先付：不管成不成，这一步的账都要认 */
        if (o.cost && Object.keys(o.cost).length) applyEff(o.cost);
        const hit = rnd() < o.p;
        if (hit) {
          if (o.evEff) applyEff(o.evEff);
          const gain = Math.round(24 + o.p * 30 + (o.swing || 0));
          bo.mom += gain;
          S.burst = clamp(S.burst + 5, 0, 100);
          return result(o.t + " · 成了", (o.ok || "你做到了。") + "\n\n局势值 +" + gain + "，现在 " + bo.mom + "。", "win", () => nodeScene());
        }
        const loss = Math.round(20 + (1 - o.p) * 26 + (o.swing || 0) * .6);
        bo.mom -= loss;
        S.burst = clamp(S.burst - 4, 0, 100);
        S.morale = clamp(S.morale - 3, 0, 100);
        return result(o.t + " · 砸了", (o.fail || "你搞砸了。") + "\n\n局势值 " + bo.mom + "，这局有点难了。", "lose", () => nodeScene());
      }
    });
  }

  function finishGame() {
    const bo = M.series;
    if (!bo._mine) {
      const pr = applyPrep(mySide(bo.myHero, bo.tactic), theirSide(bo.oppId, bo.oppHero));
      bo._mine = pr.mine; bo._theirs = applyBans(pr.theirs, bo);
    }
    const mine = bo._mine;
    const theirs = bo._theirs;
    const base = MATCH.optionProb(mine, theirs, { dim: "GAME", key: bo.bestOf === 5 && bo.g === 5, patchBuffs: patchMap() });
    /* 世界赛的现实现场：刚落地没睡好、版本还没摸透，前几场吃暗亏 */
    let wp = 0; const wtags = [];
    if (M.worlds) {
      if (M.worlds.jet > 0) { wp -= .04; wtags.push({ k: "落地时差", v: -0.04, tone: "bad" }); }
      if (M.worlds.adapt > 0) { wp -= .03; wtags.push({ k: "版本适应中", v: -0.03, tone: "bad" }); }
    }
    const p = clamp(base.p + bo.mom / 420 + wp, .04, .96);
    if (M.worlds && M.worlds.jet > 0) M.worlds.jet--;
    const win = rnd() < p;
    if (win) bo.wins++; else bo.losses++;
    /* 局内决策记录：系列赛结束后算「决策贡献」评级 */
    bo.duelLog = bo.duelLog || [];
    S.duelLog = S.duelLog || [];
    bo.duelLog.push({ g: bo.g, plan: bo.gamePlan || null, planName: (bo.planNames || []).join(" / ") || bo.gamePlanName || "", res: win ? "win" : "lose", command: !!(bo.usedCommand && bo.commandG === bo.g) });
    S.duelLog.push({ t: S.tick, g: bo.g, plan: bo.gamePlan || null, res: win ? "win" : "lose" });
    sndIntensity(bo.wins === 2 || bo.losses === 2 ? 3 : 2);
    const drain = bo.bestOf === 5 ? ([8, 10, 12, 14, 16][Math.min(4, bo.g - 1)] || 12) : 6;
    S.energy = clamp(S.energy - drain, 0, 100);
    if (win) { S.spirit = clamp((S.spirit || 60) + 6, 0, 100); S.morale = clamp(S.morale + 2, 0, 100); }
    else { S.spirit = clamp((S.spirit || 60) - 8, 0, 100); S.morale = clamp(S.morale - 6, 0, 100); }
    /* 赢一场给抽卡券：常规赛 1、季后赛 3、国际赛 5、S 赛 8 */
    if (win) {
      const kind = bo.kind || "league";
      const tk = kind === "worlds" ? 8 : (kind === "msi" || kind === "firststand") ? 5 : (kind === "split") ? 3 : 1;
      S.ticket = (S.ticket || 0) + tk;
    }
    S.record.games++; if (win) S.record.wins++; else S.record.losses++;
    const rows = dimRows(mine, theirs);
    const ctr = MATCH.ctrOf(bo.myHero, bo.oppHero);
    const decided = win && bo.wins >= Math.ceil((bo.bestOf || 5) / 2);
    const hl = decided ? momentOf(bo, win, ctr, p) : null;
    if (hl) addHL(hl);
    return scene({
      type: "boGame", win: win, p: p, g: bo.g, bestOf: bo.bestOf,
      wins: bo.wins, losses: bo.losses, rows: rows, mom: bo.mom, log: bo.log.slice(-3),
      hero: bo.myHero, oppHero: bo.oppHero, tactic: bo.tactic, ctr: ctr,
      keyVars: base.tags.concat(wtags).concat((bo.mineLabels || []).slice(-2)), title: bo.title, oppName: bo.oppName,
      upset: (win && (rows[0].a + rows[1].a + rows[2].a) / 3 < (rows[0].b + rows[1].b + rows[2].b) / 3 - 4) ? 1 : 0,
      pick() {
        if (bo.wins >= Math.ceil((bo.bestOf || 5) / 2) || bo.losses >= Math.ceil((bo.bestOf || 5) / 2)) {
          /* LDL 杯赛 / 德玛西亚杯有自己的记账方式，不套赛段季后赛 */
          const done = bo.kind === "demacia" ? () => demaciaAfterSeries(bo)
            : bo.kind === "ldl" ? () => ldlAfterSeries(bo)
              : () => seriesEnd();
          return hl ? hlScene(hl, done) : done();
        }
        /* 每局重开 BP，但第二局起 bpScene 会给「沿用/助教/模拟」（P1-5） */
        bo.step = 0;
        return bpScene();
      }
    });
  }

  /* ---------------- 世界赛：瑞士轮 + 淘汰树 ---------------- */
  function initWorldsField() {
    const rows = standingsRows();
    const lpl = rows.slice(0, 4).map(r => r.id);
    const fixed = { LCK: ["t1", "gen", "hle", "dk", "kt"], LEC: ["g2", "fnc", "mad"], LCS: ["tl", "fly"] };
    const field = [];
    const push = id => {
      if (!id || field.some(f => f.id === id)) return;
      const t = teamOf(id);
      field.push({ id: id, name: t ? t.name : id, power: Math.round(teamPower(id)), w: 0, l: 0, opp: [] });
    };
    lpl.forEach(push);
    /* 你既然拿到门票（季后赛前四或常规赛前四），就一定在这十六队里 */
    push(S.teamId);
    Object.keys(fixed).forEach(reg => {
      (fixed[reg] || []).forEach(nm => {
        const t = allTeams().find(x => x.name === nm || (x.id || "").indexOf(nm) >= 0);
        const id = t ? t.id : nm;
        const power = t ? Math.round(teamPower(id)) : 78;
        if (!field.some(f => f.id === id)) field.push({ id: id, name: t ? t.name : nm, power: power, w: 0, l: 0, opp: [] });
      });
    });
    /* 补满 16 */
    const extra = allTeams().filter(t => ["LPL", "LCK", "LEC", "LCS"].indexOf(t.region) >= 0);
    while (field.length < 16) {
      const cand = extra.filter(t => !field.some(f => f.id === t.id));
      if (!cand.length) break;
      const t = pick(cand);
      field.push({ id: t.id, name: t.name, power: Math.round(teamPower(t.id)), w: 0, l: 0, opp: [] });
    }
    M.worlds = { field: field.slice(0, 16), round: 0, bracket: null, log: [], jet: 2, adapt: 2 };
    return M.worlds;
  }
  /* P1-3：地图页直接给阶段标签，UI 不再自己拼「第几轮/八强」 */
  function worldsStageLabel(w) {
    if (!w) return "世界赛";
    const br = w.bracket;
    if (br && br.qf) {
      const rn = clamp(br.round || 1, 1, 3);
      return ["八强", "四强", "决赛"][rn - 1];
    }
    return "瑞士轮 第 " + Math.max(1, (w.round || 0) + 1) + " 轮";
  }
  function worldsMapScene(next) {
    const w = M.worlds;
    const rows = (w ? w.field : []).map(f => ({ id: f.id, name: f.name, w: f.w, l: f.l, mine: f.id === S.teamId, out: (f.w >= 3 || f.l >= 3) }))
      .sort((a, b) => (b.w - a.w) || (a.l - b.l));
    const br = w && w.bracket ? w.bracket : null;
    const knockout = !!(br && br.qf);
    return scene({
      type: "worldsMap", round: w ? w.round : 0,
      stageLabel: worldsStageLabel(w),
      swissRound: w ? (w.round || 0) : 0,
      bracketRound: knockout ? (br.round || 1) : 0,
      rows: rows, bracket: br,
      /* P0-3：淘汰赛开始后才有树可看；瑞士轮阶段不提前跑树 */
      canTree: knockout,
      canTreeNote: knockout ? "" : "淘汰赛开始后才能看赛程树",
      mine: { id: S.teamId, w: (w && (w.field.filter(f => f.id === S.teamId)[0] || {}).w) || 0, l: (w && (w.field.filter(f => f.id === S.teamId)[0] || {}).l) || 0 },
      predicted: false, champion: null,
      pick(i, v) {
        /* P0-3：树页的返回只回地图，绝不再推进一轮瑞士轮 */
        if (v === "tree" || v === "treeonly") return worldsTreeScene(next);
        return next ? next() : monthEnd();
      }
    });
  }
  function worldsSwissRound() {
    const w = M.worlds;
    if (!w) return monthEnd();
    w.round++;
    const alive = w.field.filter(f => f.w < 3 && f.l < 3);
    /* 按战绩排序配对，避免重复交手 */
    alive.sort((a, b) => (b.w - a.w) || (rnd() - .5));
    const paired = {}, pairs = [];
    for (const a of alive) {
      if (paired[a.id]) continue;
      let b = null;
      for (const cand of alive) {
        if (cand.id === a.id || paired[cand.id]) continue;
        if (a.opp.indexOf(cand.id) >= 0) continue;
        b = cand; break;
      }
      if (!b) { for (const cand of alive) if (!paired[cand.id] && cand.id !== a.id) { b = cand; break; } }
      if (!b) continue;
      paired[a.id] = 1; paired[b.id] = 1;
      pairs.push({ a: a, b: b });
    }
    /* 玩家的对手固定参与交互，其余自动 */
    const myPair = pairs.filter(p => p.a.id === S.teamId || p.b.id === S.teamId)[0];
    pairs.forEach(p => {
      if (p === myPair) return;
      const pa = MATCH.sig((p.a.power - p.b.power) + (rnd() - .5) * 8, 9);
      let aw = 0, bw = 0;
      while (aw < 2 && bw < 2) { if (rnd() < pa) aw++; else bw++; }
      if (aw > bw) { p.a.w++; p.b.l++; } else { p.b.w++; p.a.l++; }
      p.a.opp.push(p.b.id); p.b.opp.push(p.a.id);
      w.log.push({ round: w.round, a: p.a.name, b: p.b.name, win: aw > bw ? p.a.id : p.b.id, score: aw + "-" + bw });
    });
    if (!myPair) {
      /* 玩家被淘汰或已出线，只推别人的结果 */
      return worldsMapScene(() => (w.round >= 5 || w.field.every(f => f.w >= 3 || f.l >= 3)) ? endSwiss() : worldsSwissRound());
    }
    const me = myPair.a.id === S.teamId ? myPair.a : myPair.b;
    const foe = myPair.a.id === S.teamId ? myPair.b : myPair.a;
    me.opp.push(foe.id); foe.opp.push(me.id);
    M.series = {
      opp: { id: foe.id, name: foe.name }, oppId: foe.id, oppName: foe.name,
      bestOf: 3, g: 0, wins: 0, losses: 0, step: 0, mom: 0, log: [],
      title: "世界赛瑞士轮 R" + w.round, kind: "worldsSwiss", bo: true,
      oppTendency: "运营", swiss: { me: me, foe: foe }
    };
    M.form = 3 + w.round;
    return result("世界赛 · 瑞士轮 第 " + w.round + " 轮",
      `${foe.name}。${me.w}-${me.l} 的你，站在这里。BO3，赢了往前走，输了往悬崖边走。`, "info", () => bpScene());
  }
  function endSwiss() {
    const w = M.worlds;
    if (!w) return monthEnd();
    /* P0-3：幂等——已经有淘汰赛对阵就直接回去，不重建（返回键多点一次不会重抽对手） */
    if (w.bracket && w.bracket.qf) return worldsMapScene(() => worldsKnockout());
    const sorted = w.field.slice().sort((a, b) => (b.w - a.w) || (a.l - b.l) || (b.power - a.power));
    const q = sorted.filter(f => f.w >= 3).slice(0, 8);
    while (q.length < 8) { const nxt = sorted.filter(f => q.indexOf(f) < 0)[0]; if (!nxt) break; q.push(nxt); }
    w.bracket = { qf: MATCH.seedBracket(q), sf: null, f: null, round: 1, q: q };
    const mine = w.field.filter(f => f.id === S.teamId)[0];
    if (!q.some(x => x.id === S.teamId)) {
      return result("瑞士轮出局", `${mine ? mine.w + "-" + mine.l : "0-3"}。你在酒店房间收拾行李，窗外是别人的烟花。`, "lose", () => monthEnd());
    }
    return worldsMapScene(() => worldsKnockout());
  }
  function worldsKnockout() {
    const w = M.worlds;
    if (!w || !w.bracket) {
      /* LDL 没有世界赛：这个月走 LDL 自己的赛历，不要空掉一个月（P1-4） */
      if (S.stage !== "LPL") return ldlMonth(S._ml.month);
      return monthEnd();
    }
    const br = w.bracket;
    const roundName = ["八强", "四强", "决赛"];
    const pairs = br.round === 1 ? br.qf : br.round === 2 ? br.sf : br.f;
    if (!pairs || !pairs.length) { M.worlds = null; return monthEnd(); }
    const myPair = pairs.filter(p => (p.a && p.a.id === S.teamId) || (p.b && p.b.id === S.teamId))[0];
    /* 其它对局自动打完 */
    const done = [];
    pairs.forEach(p => {
      if (p === myPair) return;
      let aw = 0, bw = 0;
      const pa = MATCH.sig((p.a.power - p.b.power), 9);
      while (aw < 3 && bw < 3) { if (rnd() < pa) aw++; else bw++; }
      done.push({ a: p.a, b: p.b, win: aw > bw ? p.a : p.b, score: aw + "-" + bw });
    });
    if (!myPair) {
      /* 玩家已淘汰，剩下自动推演 */
      w.log.push.apply(w.log, done);
      const next = done.map(d => d.win);
      if (next.length >= 2) {
        const np = []; for (let i = 0; i < next.length; i += 2) if (next[i + 1]) np.push({ a: next[i], b: next[i + 1] });
        if (br.round === 1) br.sf = np; else if (br.round === 2) br.f = np;
      }
      br.round++;
      if (br.round > 3) { M.worlds = null; return monthEnd(); }
      return worldsMapScene(() => worldsKnockout());
    }
    const foe = (myPair.a.id === S.teamId) ? myPair.b : myPair.a;
    M.series = {
      opp: { id: foe.id, name: foe.name }, oppId: foe.id, oppName: foe.name,
      bestOf: 5, g: 0, wins: 0, losses: 0, step: 0, mom: 0, log: [],
      title: "世界赛 " + roundName[br.round - 1], kind: "worlds", bo: true, worlds: true,
      oppTendency: "运营", knock: done
    };
    M.split = null;
    M.form = 2 + br.round;
    return result("世界赛 · " + roundName[br.round - 1], `BO5，对面是 ${foe.name}。赢了进下一轮，输了回家。`, "info", () => bpScene());
  }

  /* ================= 世界赛赛程树 =================
   * 淘汰赛是 8 队三条线，玩家只打自己那一条；这里把整棵树摊开，
   * 自己打完的按真实比分，别人没打完的按队伍数值 + 爆冷概率模拟。
   */
  function treeRng(seed) {
    let a = (seed || 1) >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function treeTeam(f) {
    if (!f) return null;
    const t = teamOf(f.id) || {};
    return { id: f.id, name: f.name || t.name || "?", power: Math.round(f.power || teamPower(f.id)), mine: f.id === S.teamId };
  }
  function treeSim(a, b, rnd) {
    const pa = 1 / (1 + Math.exp(-((a.power - b.power) / 9)));
    let wa = 0, wb = 0;
    while (wa < 3 && wb < 3) { if (rnd() < pa) wa++; else wb++; }
    const winA = wa > wb;
    const winner = winA ? a : b, loser = winA ? b : a;
    return { wa: wa, wb: wb, winA: winA, score: wa + "-" + wb, upset: winner.power + 3 < loser.power };
  }
  function worldsTreeScene(next) {
    const w = M.worlds;
    /* P0-3/P1-3：树页返回只回地图；对阵表还没出来就不给树（瑞士轮阶段不跑 treeSim） */
    const back = () => worldsMapScene(next);
    if (!w) return back();
    const br = w.bracket;
    if (!br || !br.qf) return back();
    const byId = {};
    w.field.forEach(f => byId[f.id] = f);
    const rnd = treeRng((S.seed || 1) + (S._ml ? S._ml.year : 0) * 977 + (w.round || 0) * 31);
    const rounds = [{ name: "八强", en: "QUARTERFINAL", matches: [] }, { name: "四强", en: "SEMIFINAL", matches: [] }, { name: "决赛", en: "FINAL", matches: [] }];

    /* 八强：有对阵表就用真实对阵 */
    const qf = br.qf;
    const sfOf = {}, fOf = {};
    ((br && br.sf) || []).forEach(p => { [p.a, p.b].forEach(x => { if (x) sfOf[x.id] = 1; }); });
    ((br && br.f) || []).forEach(p => { [p.a, p.b].forEach(x => { if (x) fOf[x.id] = 1; }); });

    function playRound(list, actualWinners) {
      return (list || []).map(p => {
        const a = treeTeam(p.a), b = treeTeam(p.b);
        if (!a || !b) return { a: a, b: b, score: "-", winA: null, upset: false, done: false };
        const sim = treeSim(a, b, rnd);
        let winA = sim.winA;
        if (actualWinners) {
          if (actualWinners[a.id]) winA = true;
          else if (actualWinners[b.id]) winA = false;
        }
        return { a: a, b: b, score: sim.score, wa: sim.wa, wb: sim.wb, winA: winA, upset: sim.upset, done: !!actualWinners };
      });
    }

    const qfM = playRound(qf, br && br.sf ? sfOf : null);
    const qfWinners = qfM.map(m => (m.winA === null ? null : (m.winA ? m.a : m.b)));
    rounds[0].matches = qfM;

    let sfPairs = br && br.sf ? br.sf : null;
    if (!sfPairs) {
      sfPairs = [];
      for (let i = 0; i < qfWinners.length; i += 2) if (qfWinners[i] && qfWinners[i + 1]) sfPairs.push({ a: qfWinners[i], b: qfWinners[i + 1] });
    }
    const sfM = playRound(sfPairs, br && br.f ? fOf : null);
    rounds[1].matches = sfM;
    const sfWinners = sfM.map(m => (m.winA === null ? null : (m.winA ? m.a : m.b)));

    let fPair = br && br.f ? br.f[0] : null;
    if (!fPair && sfWinners[0] && sfWinners[1]) fPair = { a: sfWinners[0], b: sfWinners[1] };
    const fM = playRound(fPair ? [fPair] : [], null);
    rounds[2].matches = fM;
    const champ = fM[0] ? (fM[0].winA === null ? null : (fM[0].winA ? fM[0].a : fM[0].b)) : null;

    const predicted = false; /* 有对阵表就不是预测（P1-3） */
    return scene({
      type: "worldsTree", rounds: rounds, predicted: predicted, champion: null,
      readOnly: true, stageLabel: ["八强", "四强", "决赛"][clamp((br.round || 1) - 1, 0, 2)],
      year: S._ml ? S._ml.year : 0, myId: S.teamId,
      pick(i, v) {
        /* P0-3：返回只回地图，绝不在这里推进比赛/重建对阵 */
        return back();
      }
    });
  }
  /* ================= 名场面 =================
   * 玩家不会记住 OVR，会记住「本命剑姬第 5 局单杀，8k 落后翻盘」。
   * 这里只负责记账与造卡，档案室和结局会去读 S.highlights。
   */
  const HL_KIND = { flip: "让二追三", clutch: "决胜局", upset: "爆冷", main: "本命", worlds: "世界赛", crit: "单杀" };
  function addHL(o) {
    if (!S) return null;
    S.highlights = S.highlights || [];
    const hl = Object.assign({
      t: S.tick,
      y: (S._ml && S._ml.year) || S.season || 1,
      m: (S._ml && S._ml.month) || 1,
      pos: S.pos
    }, o);
    S.highlights.push(hl);
    if (S.highlights.length > 40) S.highlights.shift();
    return hl;
  }
  function hlScene(hl, next) {
    return scene({
      type: "highlight", hl: hl, kind: HL_KIND[hl.kind] || "名场面",
      pick() { return next ? next() : monthEnd(); }
    });
  }
  /* 一场 BO 里值得记下来的一手；返回 null 就不插卡 */
  function momentOf(bo, win, ctr, p) {
    if (!win || !bo) return null;
    const hero = bo.myHero || "你的英雄";
    const foe = bo.oppName || "对面";
    const score = bo.wins + ":" + bo.losses;
    const big = bo.kind === "worlds" ? "世界赛" : bo.kind === "msi" ? "MSI" : bo.kind === "firststand" ? "先锋赛" : (bo.title || "联赛");
    if (bo.bestOf === 5 && bo.wins === 3 && bo.losses === 2) {
      return { kind: "flip", hero: hero, opp: foe, score: score, event: big, text: `${big} BO5，让二追三。第 5 局你拿 ${hero}，赢下 ${foe}。` };
    }
    if (bo.bestOf === 5 && bo.g === 5) {
      return { kind: "clutch", hero: hero, opp: foe, score: score, event: big, text: `${big} 第 5 局，全场屏住呼吸，你用 ${hero} 把 ${foe} 按死。` };
    }
    if (S.mainHero && bo.myHero === S.mainHero) {
      return { kind: "main", hero: hero, opp: foe, score: score, event: big, text: `${big}，你带上本命 ${hero}，${score} 赢下 ${foe}。` };
    }
    if (p < .42) {
      return { kind: "upset", hero: hero, opp: foe, score: score, event: big, text: `${big}，赛前没人看好你们，胜率只有 ${Math.round(p * 100)}%，最后 ${score} 赢了 ${foe}。` };
    }
    return null;
  }

  /* ================= API ================= */
  function boot(sc) { cur = sc || null; return cur; }
  return {
    newGame(opt) { return boot(newGame(opt)); },
    choose(i, v) {
      if (!cur) return null;
      const sc = cur;
      /* 兜底：同一场景/同一步/同一月份连续 20 次点同一个动作 → 判定为循环，强制推进 phase（QA 14000 点击上限的 flaky 出口） */
      try {
        const key = sc.type + "|" + i + "|" + (v === undefined || v === null ? "" : v) + "|" + (sc.step === undefined ? "" : sc.step) + "|" + (S && S.tick);
        if (M && M._stk && M._stk.key === key) M._stk.n += 1; else if (M) M._stk = { key: key, n: 1 };
        if (M && M._stk && M._stk.n >= 20) { M._stk = null; return phase(); }
      } catch (e) { }
      cur = null;
      const r = sc.pick(i, v);
      cur = r || null;
      return r;
    },
    burst() {
      if (!cur || typeof cur.pickBurst !== "function") return cur;
      const r = cur.pickBurst();
      if (r) cur = r;
      return cur;
    },
    getScene: () => cur,
    getState: () => S,
    save, load(slot) { const sc = load(slot); return sc ? boot(sc) : null; }, hasSave, canSave,
    DIFFS, MODES, BASES, BASE_POOL, ORIGINS, RARITY, RARITY_W, STATS, CN,
    ovr, myOvr, voice, monthLabel, teamOf, playerOf, teamPower, myTeamPower, D,
    TACTICS, TACTIC_NAME, DIM_CN, stEff, deckBonus, patchMap, energyMax,
    ENERGY_BANDS, MONEY_BANDS, energyBand, moneyBand,
    standingsRows: () => standingsRows(), myRank: () => myRank(),
    seasonSummary, myRoster: myTeamRoster, isEndless: () => !!(S && S.endless),
    /* v3.10：自动托管 / 羁绊 / 成就 / 抽卡池信息（UI 开关 data-act="toggle-auto" 直接调 toggleAuto） */
    toggleAuto() { toggleAuto(); if (cur && cur.type === "action") cur = actionScene(); return cur || null; },
    autoMode: () => autoLevel(),
    deckBonds, checkAchv, poolInfo, traitArr,
    /* W5 队友关系：UI 队友页读这里 */
    mates: () => matesList(), matesAffMean: () => Math.round(matesAffMean()),
    /* 给 UI 用的轻量状态快照：切换托管后原地重渲染用 */
    _autoLevel: autoLevel
  };
})();
