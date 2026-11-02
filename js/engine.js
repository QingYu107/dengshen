/* 《登神》核心引擎 v2 —— 单机离线，无依赖 */
window.GAME = (function () {
  "use strict";

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

  const D = {
    players: () => Object.assign({}, realPlayers(), _ldlP),
    teams: () => Object.assign({}, window.DATA_TEAMS || {}, _ldl),
    events: () => (window.DATA_EVENTS || []).concat(window.DATA_MEME_EVENTS || [], window.DATA_ENDLESS_EVENTS || []),
    talents: () => window.DATA_TALENTS || [],
    heroes: () => window.DATA_HEROES || [],
    chronicle: () => window.DATA_CHRONICLE || {},
    hot: () => window.DATA_HOT || { win: [], lose: [], drama: [], hupu: [] }
  };

  const MODES = {
    three: { key: "three", name: "三年之约", tag: "标准", desc: "36 个月。从 LDL 打到世界赛，第 36 个月结束出结局。一场完整的三年青春。" },
    endless: { key: "endless", name: "无尽生涯", tag: "无尽", desc: "没有终点。打到你 33 岁、或者没人要为止。每年联赛水平都在涨，你的手在往下掉。" }
  };
  const DIFFS = {
    easy: { key: "easy", name: "青训营", desc: "数值成长 +20%，对手弱 4 点，负面事件轻。先去爽一把。", growth: 1.2, opp: -4, bad: .7, luck: 1.1 },
    normal: { key: "normal", name: "职业联赛", desc: "标准难度。这是一个正常人的三年。", growth: 1.0, opp: 0, bad: 1, luck: 1 },
    hard: { key: "hard", name: "首发压力", desc: "成长 −15%，对手强 4 点。教练不惯着你。", growth: .85, opp: 4, bad: 1.25, luck: .9 },
    hell: { key: "hell", name: "废物中单", desc: "成长 −30%，对手强 8 点。全网都在等你退役。", growth: .7, opp: 8, bad: 1.5, luck: .8 }
  };

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
    { id: "glass", name: "玻璃天才", tag: "天赋异禀，一碰就碎", desc: "训练赛里你打爆所有人，然后因为手腕疼休息两周。", st: { LANE: 64, MECH: 76, GAME: 48, POOL: 46, MENTAL: 42, PHYS: 32, TEAM: 40, FAME: 36 }, growth: "early", pot: 95, inj: .32, trait: "易碎品", hidden: "伤病职业" },
    { id: "grinder", name: "训练狂", tag: "卷王", desc: "一天 14 小时训练赛，教练说你别把队友卷死。", st: { LANE: 52, MECH: 62, GAME: 60, POOL: 58, MENTAL: 58, PHYS: 62, TEAM: 42, FAME: 20 }, growth: "normal", pot: 90, inj: .2, trait: "卷王", hidden: "身体在报警" },
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

  function scene(o) { return o; }
  function result(title, text, tone, next) {
    return scene({ type: "result", title, text: text || "", tone: tone || "info", pick() { return next ? next() : null; } });
  }

  /* ================= 派生 ================= */
  function ovr(st, pos) {
    const w = (window.DATA_POS[pos] || window.DATA_POS.MID).w;
    let v = 0; for (const k in w) v += (st[k] || 0) * w[k];
    return Math.round(v);
  }
  const myOvr = () => ovr(S.st, S.pos);
  const teamOf = id => D.teams()[id] || null;
  const playerOf = id => D.players()[id] || null;

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
    return clamp(Math.round((S.st.FAME - 25) * .7 + (S.record.titles || []).length * 7 + (myOvr() - 68) * 1.1 + Math.min(20, S.fans / 30000)), 0, 100);
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
      rows.push({ pos: k, name: p ? (p.cn || p.name) : "某个替补", ovr: p ? ovr(p.st, p.pos || k) : 62, pid: pid });
    }
    return rows;
  }
  function voiceScene() {
    const rows = myTeamRoster();
    const weak = rows.filter(r => !r.mine).sort((a, b) => a.ovr - b.ovr)[0];
    const fa = freeAgents()[0];
    const opts = [];
    if (weak && fa) {
      const fv = ovr(fa.st, fa.pos), good = fv > weak.ovr + 1;
      opts.push({
        k: "sign", t: "我要这个人", good,
        d: `签下 ${fa.cn || fa.name}（${fv}）替掉 ${weak.name}（${weak.ovr}）。`,
        c: good ? "队内氛围 −4 · 教练信任 −6" : "他不比队里那位强，经理会觉得你在闹事",
        run() {
          if (good) {
            S.roster[S.teamId] = S.roster[S.teamId] || {};
            S.roster[S.teamId][weak.pos] = fa.id;
            S.teamStatus = clamp(S.teamStatus - 4, 0, 100);
            S.coachTrust = clamp(S.coachTrust - 6, 0, 100);
            S.timeline.push({ t: S.tick, text: `用话语权签下 ${fa.cn || fa.name}` });
            return ["签人", `经理抽了半包烟，最后说：钱我出，人你负责。${fa.cn || fa.name} 第二天就拎着行李箱出现在基地门口，第一句话是问你基地 wifi 密码。`, "win"];
          }
          S.teamStatus = clamp(S.teamStatus - 8, 0, 100);
          S.coachTrust = clamp(S.coachTrust - 10, 0, 100);
          return ["被驳回", "你把简历拍在桌上，经理看了一眼，说你先把上一场那波团解释清楚。会议室里安静了很久。", "bad"];
        }
      });
    }
    opts.push({
      k: "money", t: "我要涨薪", good: true,
      d: `现在的年薪是 ${S.salary} 万。三年合同就这几年，钱不赚白不赚。`,
      c: "队内氛围 −8 · 黑粉 +",
      run() {
        const up = rint(2, 6);
        S.salary += up; S.money += up; S.teamStatus = clamp(S.teamStatus - 8, 0, 100);
        S.haters += rint(2000, 8000);
        return ["涨薪", `经理说预算紧张，最后给你加了 ${up} 万。你在合同上签完字，听见隔壁办公室在讨论你的性价比。`, "info"];
      }
    });
    opts.push({
      k: "tactic", t: "战术围绕我打", good: true,
      d: "你要资源、要视野、要队友给你让线。这个队以后怎么打，得听你的。",
      c: "教练信任 −12 · 队内氛围 −6 · 个人数据永久加成",
      run() {
        S.tactical = (S.tactical || 0) + 1;
        S.coachTrust = clamp(S.coachTrust - 12, 0, 100);
        S.teamStatus = clamp(S.teamStatus - 6, 0, 100);
        S.st.FAME = clamp(S.st.FAME + 3, 0, 98);
        S.timeline.push({ t: S.tick, text: "战术核心：围绕我打" });
        return ["战术核心", "教练把战术板擦干净，递给你：那你自己画。你在中路画了个圈，圈里写着“资源都给我”。队友看完没说话，但下一场他们真的来了。", "win"];
      }
    });
    return scene({
      type: "voice", opts,
      pick(i) {
        const o = opts[i]; if (!o) return monthEnd();
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
      teamId: null, contractLeft: 1, salary: 1.2, isSub: false,
      champs: [], talents: [], skills: [], items: [], traits: [], roster: {}, tactical: 0,
      burst: 0, flags: {}, cd: {}, pending: [],
      record: { games: 0, wins: 0, losses: 0, mvps: 0, titles: [], splits: [], worlds: [], msi: [] },
      timeline: [], diff: opt.diff || "normal", drawPity: 0, drawPts: 0
    };
    M = {};
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
        S.pot = clamp(x.b.pot + rint(-4, 4), 70, 99);
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
      groups.push(shuffle(src).slice(0, 3).map((h, idx) => ({ h, prof: idx === 0 ? rint(76, 84) : rint(50, 60) })));
    }
    return scene({
      type: "create_pool", groups,
      pick(i) {
        S.champs = groups[i].map(x => ({ n: x.h.n, en: x.h.en, prof: x.prof, main: x.prof >= 76 }));
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
        _ldlP[pid] = { id: pid, name: fakeName(), cn: "", pos, team: tid, age: rint(17, 22), no: rint(1, 20), st, tags: [], trait: [], salary: 1, bio: "LDL 的青训生，梦想打上 LPL。" };
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
  function startMonth() {
    S._ml = monthLabel(S.tick);
    const _t = teamOf(S.teamId);
    S.stage = _t && _t.region === "LDL" ? "LDL" : "LPL";
    S.season = Math.floor((S.tick - 1) / 12) + 1;
    M.evDone = false;
    if (S._ml.month === 1) versionPatch();
    return actionScene();
  }

  function versionPatch() {
    // 版本更新：随机一个英雄池英雄熟练度下降，另一个上升
    if (!S.champs.length) return;
    const down = pick(S.champs), up = pick(S.champs);
    down.prof = clamp(down.prof - rint(8, 18), 10, 99);
    up.prof = clamp(up.prof + rint(4, 10), 10, 99);
    M.patch = `${down.n} 被砍，${up.n} 起飞`;
  }

  function buildActions() {
    const list = [];
    list.push({
      label: "加练", tag: "成长", cost: "精力 −22",
      desc: "一天两练，把操作和英雄池往上顶。教练看得见，腰椎也看得见。",
      run() {
        S.energy -= 22;
        gain({ MECH: 1.6, LANE: 1.2, POOL: 1.1 }, 1.15);
        S.coachTrust = clamp(S.coachTrust + 4, 0, 100);
        return ["加练", pick([
          "训练赛打到第 9 把，你的手指开始发抖，但那一波 1v2 反杀是真的帅。",
          "教练站在后面看了十分钟，什么也没说，走的时候把你的水杯灌满了。",
          "你练到凌晨两点，保安来赶人，你说明天有比赛，他说那也不行。"
        ]), "info"];
      }
    });
    list.push({
      label: "复盘", tag: "意识", cost: "精力 −12",
      desc: "把昨天的比赛一帧一帧拆开看。看自己怎么送的，也看对面怎么赢的。",
      run() {
        S.energy -= 12; gain({ GAME: 2.1, TEAM: .6 }, 1.05); S.morale = clamp(S.morale + 3, 0, 100);
        return ["复盘", "你把第三局的 27 分钟拖了四十遍，终于看清楚：那波不是队友菜，是视野没做到河道。", "info"];
      }
    });
    list.push({
      label: "排位", tag: "手感", cost: "精力 −15",
      desc: "韩服排位，练手感，顺便看看版本答案长什么样。",
      run() {
        S.energy -= 15; gain({ MECH: 1.1, LANE: .9, POOL: .7 }, 1);
        const good = chance(.55);
        S.morale = clamp(S.morale + (good ? 5 : -7), 0, 100);
        return ["排位", good ? "韩服大师 400 点，你连续三天登顶国服第一。弹幕开始有人刷你 ID。" : "连跪七把，掉回钻石。你在公屏打了一句“这游戏没法玩”，然后继续排。", good ? "info" : "bad"];
      }
    });
    list.push({
      label: "开播", tag: "名气", cost: "精力 −10",
      desc: "开播两小时，涨粉、恰米，顺便被骂。",
      run() {
        S.energy -= 10;
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
    list.push({
      label: "休息", tag: "体能", cost: "精力 +38",
      desc: "睡觉，吃饭，看两集动画。人不是机器。",
      run() {
        S.energy = clamp(S.energy + 38, 0, 100);
        S.st.PHYS = clamp(S.st.PHYS + 1.2, 0, S.pot);
        S.morale = clamp(S.morale + 8, 0, 100);
        return ["休息", pick([
          "你睡了十二个小时，醒来发现手机 47 条未读，没有一条是教练的。",
          "你去楼下吃了一碗牛肉面，加了两份肉。老板问你是不是运动员，你说算是吧。"
        ]), "info"];
      }
    });
    list.push({
      label: "健身", tag: "体能", cost: "精力 −8",
      desc: "队友都在睡觉，你在跑步机上。体能就是职业寿命。",
      run() {
        S.energy -= 8; S.st.PHYS = clamp(S.st.PHYS + 2.4, 0, S.pot); S.morale = clamp(S.morale + 4, 0, 100);
        return ["健身", "卧推 80 公斤。教练说你这身体打五年没问题，你想的是能打三年就烧高香了。", "info"];
      }
    });
    if (S.coachTrust < 45) list.push({
      label: "找教练谈谈", tag: "关系", cost: "精力 −5",
      desc: "你被按在替补席上，得知道为什么。",
      run() {
        S.energy -= 5; S.coachTrust = clamp(S.coachTrust + rint(6, 14), 0, 100); S.morale = clamp(S.morale + 5, 0, 100);
        return ["谈话", "教练说不是不用你，是你训练赛不讲话。你愣了一下——原来问题在这儿。", "info"];
      }
    });
    if (S.morale < 42) list.push({
      label: "心理辅导", tag: "心态", cost: "精力 −3",
      desc: "俱乐部请的心理老师，一小时 800，俱乐部出钱。",
      run() {
        S.energy -= 3; S.morale = clamp(S.morale + 16, 0, 100); S.st.MENTAL = clamp(S.st.MENTAL + 1.1, 0, S.pot);
        return ["心理辅导", "老师说你不是抗压能力差，是把所有事都憋着。你说了四十分钟，最后哭了，感觉好多了。", "info"];
      }
    });
    if (voice() >= 45) list.push({
      label: "动用话语权", tag: "话语权", cost: "精力 −6",
      desc: "你现在有资格拍桌子了。签人、涨薪、还是让全队围绕你打，挑一样。",
      run() {
        S.energy -= 6;
        return voiceScene();
      }
    });
    return list;
  }

  function actionScene() {
    const acts = buildActions();
    return scene({
      type: "action", acts, ml: S._ml,
      pick(i) {
        const r = acts[i].run();
        if (r && r.type) return r;
        return result(r[0], r[1], r[2], () => checkEvent());
      }
    });
  }

  const GROWTH = 0.42; // 全局成长速度：三年只够你从 LDL 新人长成 LPL 首发，别想一年封神
  const hasT = id => (S.talents || []).indexOf(id) >= 0;

  function gain(map, mult) {
    const diff = DIFFS[S.diff] || DIFFS.normal;
    const lastYear = hasT("fa_last_dance") && S.contractLeft <= 1;
    for (const k in map) {
      let base = map[k] * mult * diff.growth * GROWTH;
      if (lastYear) base *= 1.6; // 最后一舞：合同年，练得比谁都狠
      const room = (S.pot - S.st[k]) / 100;
      const state = clamp(.55 + S.energy / 200 + S.morale / 260, .4, 1.25);
      let g = base * (.6 + room * 1.6) * state * ageCoef() * veteranFactor() * coachCoef() * (.75 + rnd() * .6);
      if (k === "MECH" && S.age >= 26) g *= .35;
      S.st[k] = clamp(S.st[k] + g, 0, S.pot);
    }
  }

  /* ================= 事件 ================= */
  function eventPool() {
    const stageTag = S.stage;
    const out = [];
    for (const ev of D.events()) {
      if (!ev || !ev.id) continue;
      if (ev.once && S.flags["f_" + ev.id]) continue;
      if (S.cd[ev.id] && S.cd[ev.id] > S.tick) continue;
      if (ev.yearMin && S.season < ev.yearMin) continue;
      if (ev.year) {
        // 三年模式：严格按年份放；无尽模式：过了那一年就一直留在池子里（配合冷却，不会连着重复）
        if (S.endless) { if (S.season < ev.year) continue; }
        else if (ev.year !== S.season) continue;
      }
      if (ev.months && ev.months.indexOf(S._ml.month) < 0) continue;
      const r = ev.req || {};
      if (r.pos && r.pos.indexOf(S.pos) < 0) continue;
      if (r.stage && r.stage.indexOf(stageTag) < 0) continue;
      if (r.minStat) { let ok = true; for (const k in r.minStat) if (S.st[k] < r.minStat[k]) ok = false; if (!ok) continue; }
      if (r.maxStat) { let ok = true; for (const k in r.maxStat) if (S.st[k] > r.maxStat[k]) ok = false; if (!ok) continue; }
      out.push(ev);
    }
    return out;
  }

  function checkEvent() {
    if (S.pending.length) {
      const id = S.pending.shift();
      const ev = D.events().find(e => e.id === id);
      if (ev) return showEvent(ev);
    }
    const pool = eventPool();
    if (M.evDone || !pool.length || !chance(.7)) return phase();
    M.evDone = true;
    return showEvent(wpick(pool, e => e.w || 10));
  }

  function showEvent(ev) {
    return scene({
      type: "event", ev,
      pick(i) {
        const o = ev.opts[i];
        S.flags["f_" + ev.id] = true;
        S.cd[ev.id] = S.tick + rint(4, 10);
        applyEff(o.eff);
        let extra = "";
        if (o.risk) {
          const st = S.st[o.risk.stat] || 50;
          const roll = rint(1, 20) + Math.floor((st - 50) / 5) + Math.floor((S.morale - 50) / 12);
          if (roll >= (o.risk.dc || 12)) {
            extra = "【判定成功】" + (o.risk.ok || "你赌对了。");
            applyEff(o.risk.bonus || {});
            S.morale = clamp(S.morale + 6, 0, 100); S.burst = clamp(S.burst + 10, 0, 100);
          } else {
            extra = "【判定失败】" + (o.risk.fail || "事与愿违。");
            S.morale = clamp(S.morale - 8, 0, 100);
          }
        }
        if (ev.next && ev.next.id) S.pending.push(ev.next.id);
        return result(ev.title || "场外", (o.res || "") + (extra ? "\n\n" + extra : ""), "story", () => (S.pending.length ? checkEvent() : phase()));
      }
    });
  }

  function applyEff(eff) {
    if (!eff) return;
    const diff = DIFFS[S.diff] || DIFFS.normal;
    for (const k in eff) {
      let v = eff[k];
      if (typeof v !== "number") continue;
      if (v < 0) v *= diff.bad;
      if (STATS.indexOf(k) >= 0) S.st[k] = clamp(S.st[k] + v, 0, S.pot);
      else if (k === "energy") S.energy = clamp(S.energy + v, 0, 100);
      else if (k === "morale") S.morale = clamp(S.morale + v, 0, 100);
      else if (k === "money") S.money += v;
      else if (k === "coach") S.coachTrust = clamp(S.coachTrust + v, 0, 100);
      else if (k === "status") S.teamStatus = clamp(S.teamStatus + v, 0, 100);
      else if (k === "fans") S.fans = Math.max(0, S.fans + v);
      else if (k === "haters") S.haters = Math.max(0, S.haters + v);
      else if (k === "burst") S.burst = clamp(S.burst + v, 0, 100);
      else if (k === "injury") S.inj = clamp(S.inj + v / 100, 0, .8);
      else if (k === "hupu") S.hupu = clamp(S.hupu + v, 0, 10);
    }
  }

  /* ================= 赛程：2025 现实赛制（三赛段 + 先锋赛 + MSI + 世界赛） ================= */
  const SPLIT_NAME = { 1: "第一赛段", 2: "第二赛段", 3: "第三赛段" };

  function phase() {
    const m = S._ml.month;
    if (m === 1 || m === 4 || m === 7) { M.reg = { w: 0, l: 0 }; return matchMonth(); }
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
  function simGame(opp, ctx) {
    ctx = ctx || {};
    const mine = myTeamPower() + (M.form || 0);
    const theirs = teamPower(opp.id) + (DIFFS[S.diff] || DIFFS.normal).opp + (ctx.oppMod || 0);
    let p = 1 / (1 + Math.exp(-(mine - theirs) / 6.5));
    p = clamp(p + (ctx.winMod || 0) + (S.burst / 900), .05, .95);
    const perf = clamp(50 + (myOvr() - 72) * 1.1 + (S.morale - 50) * .28 + (S.energy - 60) * .12 + (S.tactical || 0) * 4 + rint(-14, 14) + (ctx.perfMod || 0), 1, 100);
    const win = chance(p);
    let grade = perf >= 82 ? "S" : perf >= 70 ? "A" : perf >= 58 ? "B" : perf >= 45 ? "C" : "D";
    if (win && grade === "C") grade = "B";
    const kda = grade === "S" ? `${rint(8, 15)}/${rint(0, 2)}/${rint(6, 14)}` : grade === "A" ? `${rint(5, 10)}/${rint(1, 3)}/${rint(5, 11)}` : grade === "B" ? `${rint(3, 7)}/${rint(2, 5)}/${rint(3, 8)}` : grade === "C" ? `${rint(1, 4)}/${rint(3, 6)}/${rint(2, 6)}` : `${rint(0, 2)}/${rint(4, 8)}/${rint(1, 4)}`;
    const dmg = grade === "S" ? rint(32, 45) : grade === "A" ? rint(24, 34) : grade === "B" ? rint(17, 25) : rint(8, 18);
    S.record.games++; if (win) S.record.wins++; else S.record.losses++;
    return { win, perf, grade, kda, dmg, opp: opp.name || "对手", id: opp.id };
  }

  function matchMonth() {
    const n = 5;
    M.reg = M.reg || { w: 0, l: 0 };
    let opps = shuffle(oppList()).slice(0, n);
    if (!opps.length) opps = [{ name: "训练赛对手", id: null }];
    const games = opps.map(o => simGame(o));
    const w = games.filter(g => g.win).length, l = games.length - w;
    M.reg.w += w; M.reg.l += l;
    const wr = w / Math.max(1, games.length);
    S.morale = clamp(S.morale + (wr >= .6 ? 8 : wr <= .3 ? -10 : 0), 0, 100);
    S.st.FAME = clamp(S.st.FAME + (wr >= .75 ? 3 : wr <= .25 ? -1 : 1), 0, 98);
    if (wr >= .75) S.burst = clamp(S.burst + 12, 0, 100);
    S.energy = clamp(S.energy - 12, 0, 100);
    const sp = S._ml.month === 1 ? 1 : S._ml.month === 4 ? 2 : 3;
    return scene({
      type: "matchday", games, w, l, ml: S._ml, hot: hotLine(wr >= .5), patch: M.patch || null,
      split: sp, splitName: splitLabel(sp),
      reg: { w: M.reg.w, l: M.reg.l }, rank: seedRank(), teamName: (teamOf(S.teamId) || {}).name || "",
      pick() { return monthEnd(); }
    });
  }

  function seedRank() {
    const reg = M.reg || { w: 0, l: 0 };
    const wr = reg.w / Math.max(1, reg.w + reg.l);
    const mine = myTeamPower() + (wr - .5) * 9;
    return 1 + oppList().filter(t => teamPower(t.id) + rint(-4, 4) > mine).length;
  }

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
    if (s.wins >= 3 || s.losses >= 3) return seriesEnd();
    s.g++;
    if (s.g === 1 && hasT("tal_dice")) s.dice = pick([3, 3, -3, -3, 0]);
    const oppT = typeof opp === "string" ? findTeam(opp) : (opp || findTeam("对手"));
    s.oppName = oppT.name; s.oppId = oppT.id;
    const duel = makeDuel(oppT, s);
    duel.dice = s.dice || 0;
    return duelScene(duel);
  }

  /* 对局场景：支持“爆种”开关，重开同一场对局 */
  function duelScene(duel) {
    return scene({
      type: "duel", duel, burst: S.burst,
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
    return scene({
      type: "duelResult", success, crit, text: success ? (o.ok || duel.sit.ok || "你做到了。") : (o.fail || duel.sit.fail || "你搞砸了。"),
      notes, flipNote,
      game: g, wins: sc.wins, losses: sc.losses, title: sc.title, burst: S.burst,
      pick() { return seriesGame(duel.opp); }
    });
  }

  function seriesEnd() {
    const s = M.series;
    if (!s || s.done) return monthEnd();
    s.done = true;
    const won = s.wins >= 3;
    const oppName = s.oppName || "对手";

    /* —— 世界赛淘汰赛 —— */
    if (s.worlds) {
      const nm = ["八强", "四强", "决赛"][clamp(M.knock.round - 1, 0, 2)];
      if (!won) {
        S.record.worlds.push({ year: S._ml.year, best: nm, win: false });
        S.morale = clamp(S.morale - 20, 0, 100);
        S.timeline.push({ t: S.tick, text: `世界赛止步${nm}` });
        M.knock = null;
        return result("止步" + nm, `${s.wins}:3，输给 ${oppName}。你在休息室把队服叠好，明年的门票得从头再打一遍。`, "lose", () => monthEnd());
      }
      if (M.knock.round >= 3) {
        S.record.titles.push("全球总决赛冠军");
        S.record.worlds.push({ year: S._ml.year, best: "冠军", win: true });
        S.st.FAME = clamp(S.st.FAME + 22, 0, 99);
        S.fans += rint(300000, 900000);
        S.burst = 100;
        S.timeline.push({ t: S.tick, text: "全球总决赛冠军" });
        M.knock = null;
        return result("世界冠军", `3:${s.losses}。金色的纸屑落下来的时候，你忽然想起三年前在 LDL 基地吃泡面的那个晚上。`, "win", () => monthEnd());
      }
      S.timeline.push({ t: S.tick, text: `世界赛${nm}晋级` });
      S.burst = clamp(S.burst + 20, 0, 100);
      return result(nm + "晋级", `3:${s.losses}，淘汰 ${oppName}。场馆在喊你的 ID，你抬手示意的时候手在抖。`, "win", () => worldsKnockout());
    }

    /* —— 国际赛（先锋赛 / MSI）：半决赛 → 决赛 —— */
    if (s.intl) {
      const it = M.intl || { kind: s.intl, name: s.intl === "firststand" ? "先锋赛" : "MSI", round: 0, pool: [] };
      S.record.intl = S.record.intl || [];
      if (!won) {
        const stop = it.round === 0 ? "半决赛" : "亚军";
        S.record.intl.push({ year: S._ml.year, name: it.name, best: stop, win: false });
        S.morale = clamp(S.morale - 14, 0, 100);
        S.timeline.push({ t: S.tick, text: `${it.name}止步${stop}` });
        return result(`${it.name}止步${stop}`, `${s.wins}:3，输给 ${oppName}。你在酒店把队服洗了，挂在窗边，第二天干了就走。`, "lose", () => monthEnd());
      }
      if (it.round >= 1) {
        const tname = it.name + "冠军";
        S.record.titles.push(tname);
        S.record.intl.push({ year: S._ml.year, name: it.name, best: "冠军", win: true });
        S.timeline.push({ t: S.tick, text: tname });
        S.st.FAME = clamp(S.st.FAME + (it.name === "MSI" ? 12 : 9), 0, 98);
        S.fans += rint(60000, 200000);
        S.burst = 100;
        S.coachTrust = clamp(S.coachTrust + 8, 0, 100);
        return result(tname, `3:${s.losses}，你们捧起了 ${it.name} 的奖杯。你举杯的时候，台下有人用中文喊你的 ID。`, "win", () => monthEnd());
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
      return result("冠军", `3:${s.losses}，你们赢了。${tname}。更衣室里有人哭了，有人在喊你的 ID。`, "win", () => monthEnd());
    }
    S.morale = clamp(S.morale - 18, 0, 100);
    return result(`赛段第 ${place} 名`, `${s.wins}:3，被 ${oppName} 送走，${splitLabel(splitN)}第 ${place} 名。你在休息室坐了很久，手机屏幕上全是换人的评论。`, "lose", () => monthEnd());
  }

  /* ================= 国际赛：先锋赛 / MSI ================= */
  function intlMonth(kind) {
    const isFS = kind === "firststand";
    const n = isFS ? 1 : 2;
    const name = isFS ? "先锋赛" : "MSI";
    const where = isFS ? "首尔" : "温哥华";
    if (S.stage !== "LPL") {
      return result(name, `你还在 LDL，${name} 和你没关系。你在基地看直播，教练让全队记笔记，说看懂了以后用得上。`, "info", () => monthEnd());
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
    const ctx = lm ? `上一届 MSI 冠军是 ${lm.champion}（${lm.score} 赢 ${lm.runnerUp}）。` : "";
    const opp = pick(M.intl.pool);
    M.series = { g: 0, wins: 0, losses: 0, title: name + " 半决赛", intl: kind, oppName: opp, oppId: findTeam(opp).id, oppMod: 2 };
    M.form = 5;
    return result(name, `${where}。${name}，四个赛区的代表，你代表 LPL 出战——因为你在${SPLIT_NAME[n]}打进了前二。\n${ctx}\n半决赛对手 ${opp}，BO5。`, "win", () => seriesGame(findTeam(opp)));
  }

  /* ================= 世界赛 ================= */
  function worldsQualified() {
    if (S.stage !== "LPL") return false;
    return splitPlace(3) <= 4;
  }

  const SWISS_POOL = ["T1", "GEN", "HLE", "DK", "KT", "FNC", "G2", "BDS", "MAD", "BLG", "TES", "JDG", "WBG", "LNG", "IG"];

  function lastRealChamp(kind) {
    const arr = (D.chronicle() || {})[kind] || [];
    return arr.length ? arr[arr.length - 1] : null;
  }

  function worldsSwiss() {
    if (!worldsQualified()) {
      const p = splitPlace(3);
      return result("十月", S.stage !== "LPL" ? "你还在 LDL，世界赛和你没关系。十一月的基地很安静，只有你和排位。" : `第三赛段你们第 ${p > 90 ? "?" : p} 名，前四才有 S 赛门票。你在基地看抽签，关掉直播，打开排位。`, "info", () => monthEnd());
    }
    M.swiss = { g: 0, wins: 0, losses: 0 };
    S.timeline.push({ t: S.tick, text: "晋级全球总决赛" });
    const lc = lastRealChamp("worlds");
    const ctx = lc ? `上一届（${lc.year}）冠军是 ${lc.champion}，决赛 ${lc.score} 赢了 ${lc.runnerUp}。` : "";
    return result("全球总决赛", `瑞士轮，五轮，三胜出线，三负回家。场馆里全是旗子，你听见有人用中文喊你的 ID。\n${ctx}`, "win", () => swissGame());
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

  function worldsKnockout() {
    if (!M.knock) return result("淘汰赛", "世界赛已经结束了，和你没关系。你提前开始准备明年的第一赛段。", "info", () => monthEnd());
    M.knock.round++;
    const names = ["八强", "四强", "决赛"];
    if (M.knock.round > 3) { M.knock = null; return monthEnd(); }
    const round = M.knock.round;
    const pool = round === 3 ? ["T1", "GEN"] : round === 2 ? ["GEN", "T1", "HLE", "BLG"] : ["HLE", "DK", "KT", "G2", "JDG"];
    const oppT = findTeam(pick(pool.filter(n => findTeam(n).id !== S.teamId)));
    M.series = { g: 0, wins: 0, losses: 0, title: "世界赛" + names[round - 1], worlds: true, oppName: oppT.name, oppId: oppT.id, oppMod: [0, 5, 7, 11][round] };
    M.split = null;
    M.form = 2 + round;
    return result(names[round - 1], `BO5，对手 ${oppT.name}。赢了继续，输了回家。`, "info", () => seriesGame(oppT));
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
    if (S._ml.month === 10) recordChamp();
    gain({ MECH: .45, LANE: .35, GAME: .35 }, .5);
    veteranDecay();
    S.energy = clamp(S.energy + 16, 0, 100);
    S.morale = clamp(S.morale - 2 + (S.teamStatus - 50) / 25, 0, 100);
    S.st.FAME = clamp(S.st.FAME + S.fans / 250000, 0, 98);
    if (S.energy < 16 && chance(S.inj * .55 * (hasT("tal_glass_body") ? 1.8 : 1))) {
      S.energy = 10; S.st.PHYS = clamp(S.st.PHYS - 6, 0, 99);
      S.timeline.push({ t: S.tick, text: "伤病：手腕" });
      M.injured = true;
    }
    let draws = 0;
    if (chance(.14)) draws++;
    if (S._ml.month === 12) draws += 2;
    return scene({
      type: "monthend", ml: S._ml, energy: S.energy, morale: S.morale, ovr: myOvr(),
      fame: Math.round(S.st.FAME), fans: S.fans, voice: voice(), draws, injured: M.injured,
      pick() {
        M.injured = false;
        if (draws > 0) return drawScene(draws, () => nextMonth());
        return nextMonth();
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
      if (S.season > 3 && S.tick % 12 === 1 && myOvr() < 70) return ending("fade");
    }
    return startMonth();
  }

  /* ================= 抽卡 ================= */
  const RARITY = { white: { c: "#9aa7b4", n: "白" }, blue: { c: "#3fa9f5", n: "蓝" }, purple: { c: "#a855f7", n: "紫" }, gold: { c: "#e8b923", n: "金" }, red: { c: "#d33a3a", n: "赤" } };
  const RARITY_W = { white: 25, blue: 35, purple: 25, gold: 12, red: 3 };

  function drawOne() {
    const all = D.talents();
    if (!all.length) return null;
    S.drawPity++;
    let rar;
    if (S.drawPity >= 10) { rar = "purple"; S.drawPity = 0; }
    else rar = wpick(Object.keys(RARITY_W), k => RARITY_W[k] * (DIFFS[S.diff] || DIFFS.normal).luck);
    let pool = all.filter(t => t.rarity === rar);
    if (!pool.length) pool = all;
    let card = pick(pool);
    if (S.talents.indexOf(card.id) >= 0) { S.drawPts += 30; card = Object.assign({}, card, { dup: true }); }
    else { S.talents.push(card.id); applyCard(card); }
    return card;
  }

  function applyCard(c) {
    const e = c.eff || {};
    for (const k of STATS) if (e[k]) S.st[k] = clamp(S.st[k] + e[k], 0, S.pot);
    if (c.type === "skill") S.skills.push(c.id);
  }

  function drawScene(n, next) {
    const cards = [];
    for (let i = 0; i < n; i++) { const c = drawOne(); if (c) cards.push(c); }
    return scene({ type: "draw", cards, pick() { return next(); } });
  }

  /* ================= 转会 / 升级 ================= */
  function transferMonth() {
    const ldl = S.stage === "LDL";
    const my = myOvr(), fame = S.st.FAME, v = voice();
    const yearSplits = (S.record.splits || []).filter(x => x.year === S._ml.year);
    const champ = yearSplits.some(x => x.win);
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
        if (best >= 3) p *= 1.25;
        if (fame >= 55) p *= 1.2;
        if (ldl) p *= champ ? 1 : .5;
      }
      if (!chance(clamp(p, 0, .96))) return;
      offers.push({
        id: t.id, name: t.name, tier: t.tier,
        salary: Math.max(2, Math.round(6 + (my - 60) * .7 + (t.budget || 5) * 1.3)),
        desc: t.blurb || "", vibe: t.vibe || 60
      });
    });
    offers.sort((a, b) => (b.salary + (b.vibe - 60) / 8) - (a.salary + (a.vibe - 60) / 8));
    if (!offers.length && ldl && champ) {
      const t = allTeams().filter(x => x.region === "LPL").sort((a, b) => (a.tier > b.tier ? 1 : -1))[0];
      if (t) offers.push({ id: t.id, name: t.name, tier: t.tier, salary: Math.max(2, Math.round(6 + (my - 60) * .5)), desc: t.blurb || "", vibe: t.vibe || 60 });
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
        if (act === "stay" || i < 0) return result("留下", ldl ? "你决定再打一年 LDL。工资没涨，心气还在。" : "你留在原队。经理拍了拍你的肩，说这才是职业态度。", "info", () => nextMonth());
        const o = offers[i];
        if (!o) return nextMonth();
        const from = (teamOf(S.teamId) || {}).name || "LDL";
        S.teamId = o.id; S.salary = o.salary; S.contractLeft = rint(1, 2);
        if (ldl) { S.stage = "LPL"; S.st.FAME = clamp(S.st.FAME + 6, 0, 98); S.fans += rint(20000, 60000); }
        S.timeline.push({ t: S.tick, text: `${ldl ? "登陆 LPL" : "转会"}：${from} → ${o.name}` });
        return result(ldl ? "登陆 LPL" : "转会", ldl
          ? `你签了 ${o.name}，年薪 ${o.salary} 万。签字的时候手有点抖，不是紧张，是笔太便宜。`
          : `你从 ${from} 转到 ${o.name}，年薪 ${o.salary} 万。新队服还没做，先穿着旧队服拍了定妆照。`, ldl ? "win" : "info", () => nextMonth());
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

  /* ================= 结局 ================= */
  function ending(reason) {
    const titles = S.record.titles || [];
    const worldTitle = titles.some(t => t.indexOf("世界赛决赛") >= 0 || t === "全球总决赛冠军");
    let end;
    const hasWorlds = titles.indexOf("全球总决赛冠军") >= 0;
    const hasMsi = titles.indexOf("MSI 冠军") >= 0;
    const worldsRuns = S.record.worlds || [];
    const bestWorlds = worldsRuns.length ? worldsRuns[worldsRuns.length - 1].best : null;
    if (hasWorlds) end = { name: "登神", rank: "S+", sub: "世界冠军", text: "召唤师奖杯上刻着你的 ID。三年前你还在 LDL 基地抢泡面，现在全世界的解说说你名字的时候会先清一下嗓子。" };
    else if (hasMsi && titles.length >= 2) end = { name: "无冕之王", rank: "S", sub: "就差那一个", text: "MSI 拿过，联赛拿过，就差十一月那个。每年世界赛结束，你都会把那场 BO5 的录像再点开一次，看到第三局就关掉。" };
    else if (bestWorlds === "决赛" || bestWorlds === "四强") end = { name: "人间理想", rank: "A+", sub: "世界赛四强", text: "你打到过世界赛的半决赛。这成绩放在 LPL 不算顶，但足够让你回老家时，被小区保安认出来。" };
    else if (titles.length >= 3) end = { name: "国内霸主", rank: "A", sub: "联赛之王", text: "国内该拿的都拿了。虎扑上有人做了张图：LPL 三年，你的 ID 出现次数比解说词还多。" };
    else if (titles.length >= 1) end = { name: "一冠封神", rank: "A-", sub: "联赛冠军", text: "一个联赛冠军，够吹一辈子，也够让黑子闭嘴三年。退役后你去解说席，第一句话就是“我当年拿过冠军”。" };
    else if (bestWorlds) end = { name: "出国留学的", rank: "B+", sub: "世界赛游客", text: "你去过世界赛，虽然只打了瑞士轮。回来以后直播间标题改成“世界赛选手”，被骂了一整周，涨了两万粉。" };
    else if (myOvr() >= 78) end = { name: "顶级打工人", rank: "B", sub: "稳定首发", text: "你没拿过冠军，但你从来没被换下过。工资按时发，粉丝稳定涨，这行里这也是一种本事。" };
    else if (myOvr() >= 68) end = { name: "混口饭吃", rank: "C", sub: "轮换选手", text: "三年职业，攒了点钱，也攒了一身病。不算成功，也不算失败。合同到期那天，经理说有空常回来。" };
    else end = { name: "查无此人", rank: "D", sub: "消失在人海", text: "三年后，你的直播间只剩 47 个人，其中 30 个是来骂你的。有人问你是谁，弹幕说：以前打过 LDL 的。" };
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
    return scene({
      type: "ending", end, timeline: S.timeline, stats: S.st, ovr: myOvr(),
      record: S.record, fame: Math.round(S.st.FAME), fans: S.fans, name: S.name, pos: S.pos,
      voice: voice(), money: S.money, teamName: (teamOf(S.teamId) || {}).name || "无",
      salary: S.salary, seasons: seasonSummary(), bestWorlds, hupu: S.hupu, haters: S.haters,
      worldChamps: S.record.worldChamps || [],
      mode: S.mode, season: S.season, age: S.age, reason: reason || "three",
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
  function save(slot) { try { localStorage.setItem(KEY + slot, JSON.stringify({ S, at: Date.now() })); return true; } catch (e) { return false; } }
  function load(slot) {
    try {
      const raw = localStorage.getItem(KEY + slot); if (!raw) return null;
      const o = JSON.parse(raw); S = o.S; M = {}; seedRng(S.seed + S.tick);
      return startMonth();
    } catch (e) { return null; }
  }
  const hasSave = slot => { try { return !!localStorage.getItem(KEY + slot); } catch (e) { return false; } };

  /* ================= 对局情境 ================= */
  const DUELS = [
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
    { t: "野区入侵", pos: ["JUG"], d: "对面打野在下路露头，他的红 buff 还有 20 秒刷新。", opts: [
      { t: "反红", stat: "GAME", dc: 12, ok: "你反掉红 buff，对面打野整局没节奏。", fail: "你反野被中单夹了，交闪还送 buff。" },
      { t: "抓上路", stat: "LANE", dc: 13, ok: "你越塔抓死对上单，上路直接断开连接。", fail: "越塔被换，上单开始打字问你在干嘛。" },
      { t: "回城刷野", stat: "MECH", dc: 10, ok: "你稳稳刷完两组野，等级领先一级。", fail: "你回城的时候，队友被四包二了。" }
    ]},
    { t: "中路线权", pos: ["MID"], d: "兵线推到塔下，下路正在被越，你还有 8 秒决定游不游。", opts: [
      { t: "游下支援", stat: "GAME", dc: 12, ok: "你赶到下路，反打三杀，解说喊你名字。", fail: "你游下没抓到，中路塔被推了。" },
      { t: "吃塔皮", stat: "LANE", dc: 11, ok: "你吃了三层塔皮，经济领先 700。", fail: "塔皮没吃完，下路已经炸了。" },
      { t: "蹲草丛", stat: "MECH", dc: 14, ok: "你在草丛蹲到对面中单，直接单杀。", fail: "蹲了三分钟，对面中单在下路拿了双杀。" }
    ]},
    { t: "上路单带", pos: ["TOP"], d: "你带线到二塔，对面五个人从小地图上消失了。", opts: [
      { t: "继续带", stat: "MENTAL", dc: 14, ok: "你带穿一路，对面回防晚了一步，家没了。", fail: "你被抓，队友在大龙坑四打五。" },
      { t: "传送开团", stat: "TEAM", dc: 12, ok: "你 TP 绕后，一波开团打崩对面。", fail: "你 TP 的位置太正，落地就被秒。" },
      { t: "撤退", stat: "GAME", dc: 10, ok: "你安全撤退，兵线压力还在。", fail: "撤退路上被留，白给一个头。" }
    ]},
    { t: "下路四包二", pos: ["BOT"], d: "对面中野往下走了，你们辅助的眼刚好黑了。", opts: [
      { t: "塔下反打", stat: "MECH", dc: 14, ok: "你们二打四换掉三个，全场起立。", fail: "你们被四包二，下路直接崩盘。" },
      { t: "放塔后撤", stat: "GAME", dc: 10, ok: "你们撤得干净，对面只拿到一层塔皮。", fail: "后撤太慢，被追死两个。" },
      { t: "叫打野反蹲", stat: "TEAM", dc: 12, ok: "打野准时到位，反打一波 0 换 4。", fail: "打野在刷石头人，你们二打四。" }
    ]},
    { t: "视野争夺", pos: ["SUP"], d: "大龙还有一分钟，河道一片黑，你要不要去做眼？", opts: [
      { t: "独自做眼", stat: "MENTAL", dc: 14, ok: "你摸黑插下关键眼，抓住了对面的开团路线。", fail: "你被对面蹲到，交了闪现还送了眼。" },
      { t: "叫队友一起", stat: "TEAM", dc: 11, ok: "你们一起做视野，顺便抓到了对面的辅助。", fail: "你们一起去，被对面反蹲团灭。" },
      { t: "放弃视野", stat: "GAME", dc: 10, ok: "你们放弃视野，稳住了经济差。", fail: "没视野被偷大龙，游戏结束。" }
    ]},
    { t: "世界赛舞台", when: "worlds", d: "场馆里两万人在喊，导播的镜头停在你脸上，你听见自己的心跳。", opts: [
      { t: "享受它", stat: "MENTAL", dc: 13, ok: "你把压力变成了兴奋，这把你打出了生涯最佳。", fail: "你手抖了，第一波团就空了大招。" },
      { t: "只看屏幕", stat: "MECH", dc: 12, ok: "你把外界全部屏蔽，操作干净得像训练赛。", fail: "你越想专注，越听见观众的笑声。" },
      { t: "带动队友", stat: "TEAM", dc: 11, ok: "你在语音里喊了一句，四个队友全活了。", fail: "你喊完之后，语音里更安静了。" }
    ]},
    { t: "换线博弈", d: "对面下路双人组走上，你们的对线优势瞬间没了。", opts: [
      { t: "跟着换", stat: "GAME", dc: 11, ok: "你们跟着换线，把对面的算计原样还了回去。", fail: "换线换乱了，两边都没吃到线。" },
      { t: "强压对线", stat: "LANE", dc: 13, ok: "你硬吃对线，把对面的换线打成送人头。", fail: "你被越塔，换线换出了个 0-3。" },
      { t: "叫打野越塔", stat: "TEAM", dc: 12, ok: "打野越塔，对面换线的算盘碎了。", fail: "越塔失败，你们上野一起送。" }
    ]}
  ];

  function makeDuel(opp, s) {
    const ctxPool = DUELS.filter(d => {
      if (d.pos && d.pos.indexOf(S.pos) < 0) return false;
      if (d.when === "behind" && !(s.losses > s.wins)) return false;
      if (d.when === "matchpoint" && s.wins !== 2) return false;
      if (d.when === "worlds" && !M.knock) return false;
      return !!d.when || !!d.pos;
    });
    const base = DUELS.filter(d => !d.when && !d.pos);
    const useCtx = ctxPool.length && (chance(.5) || s.losses > s.wins);
    const sit = pick(useCtx ? ctxPool : base);
    return { sit, opp, game: s.g, wins: s.wins, losses: s.losses, round: 1, useBurst: false };
  }

  /* ================= API ================= */
  function boot(sc) { cur = sc || null; return cur; }
  return {
    newGame(opt) { return boot(newGame(opt)); },
    choose(i, v) { if (!cur) return null; const sc = cur; cur = null; const r = sc.pick(i, v); cur = r || null; return r; },
    burst() {
      if (!cur || typeof cur.pickBurst !== "function") return cur;
      const r = cur.pickBurst();
      if (r) cur = r;
      return cur;
    },
    getScene: () => cur,
    getState: () => S,
    save, load(slot) { const sc = load(slot); return sc ? boot(sc) : null; }, hasSave,
    DIFFS, MODES, BASES, BASE_POOL, ORIGINS, RARITY, RARITY_W, STATS, CN,
    ovr, myOvr, voice, monthLabel, teamOf, playerOf, teamPower, myTeamPower, D,
    seasonSummary, myRoster: myTeamRoster, isEndless: () => !!(S && S.endless)
  };
})();
