/* 《登神》比赛模拟核心 —— 纯函数，无 DOM，无状态。
   所有随机数由外部注入 rnd()（引擎用可复现的种子随机），保证存档可复现。

   设计要点：
   1) 比赛不再是"总分对撞"。双方各算六个维度（对线/操作/意识/英雄池/团队/状态），
      选项按维度比成功率，玩家看得到百分比。
   2) 英雄克制、版本环境、战术选择、体力心态士气都直接进成功率，并且作为"关键变量"回显给玩家。
   3) 爆冷：sigmoid 斜率放平（除以 9），弱队有状态优势时窗口更大。
*/
window.MATCH = (function () {
  var STATS = ["LANE", "MECH", "GAME", "POOL", "MENTAL", "PHYS", "TEAM", "FAME"];
  var DIMS = ["LANE", "MECH", "GAME", "POOL", "TEAM"];

  /* 每个位置对各个维度的话语权（每列和≈1） */
  var INFLUENCE = {
    TOP: { LANE: .34, MECH: .30, GAME: .14, POOL: .08, TEAM: .06, MENTAL: .08 },
    JUG: { LANE: .10, MECH: .24, GAME: .34, POOL: .10, TEAM: .14, MENTAL: .08 },
    MID: { LANE: .30, MECH: .30, GAME: .20, POOL: .10, TEAM: .04, MENTAL: .06 },
    BOT: { LANE: .28, MECH: .36, GAME: .14, POOL: .08, TEAM: .08, MENTAL: .06 },
    SUP: { LANE: .06, MECH: .16, GAME: .34, POOL: .08, TEAM: .30, MENTAL: .06 }
  };

  /* 版本环境 → 战术收益 */
  var ENV_TACTIC = {
    "打团": { fight: .07, ope: -.02, split: -.05 },
    "前期滚雪球": { fight: -.02, ope: .01, split: -.02, early: .07 },
    "单带": { fight: -.04, ope: -.02, split: .07 },
    "运营": { fight: -.02, ope: .07, split: .02 },
    "对线": { fight: 0, ope: .02, split: .02 }
  };

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function sig(x, k) { return 1 / (1 + Math.exp(-x / (k || 9))); }

  function heroByName(n) {
    var H = window.DATA_HEROES || [];
    for (var i = 0; i < H.length; i++) if (H[i].n === n) return H[i];
    return null;
  }

  /* ---------- 分维度战力 ---------- */
  // players: [{pos, st, w?}]
  function dimsOf(players) {
    var d = { LANE: 0, MECH: 0, GAME: 0, POOL: 0, TEAM: 0, MENTAL: 0 };
    var norm = { LANE: 0, MECH: 0, GAME: 0, POOL: 0, TEAM: 0, MENTAL: 0 };
    (players || []).forEach(function (p) {
      if (!p || !p.st) return;
      var inf = INFLUENCE[p.pos] || INFLUENCE.MID;
      var w = p.w || 1;
      for (var k in inf) { d[k] += (p.st[k] || 50) * inf[k] * w; norm[k] += inf[k] * w; }
    });
    for (var k in d) d[k] = norm[k] ? d[k] / norm[k] : 65;
    return d;
  }

  /* 队伍的完整"侧"描述
     side = {
       players:[{pos,st,w}], hero:"本局英雄", heroProf:0-100, mainHero:bool,
       energy:0-100, morale:0-100, spirit:0-100, burst:0-100, voice:0-100,
       coachTrust:0-100, tactic:"fight|ope|split|early", env:"打团|前期滚雪球|单带|运营|对线",
       keyBonus:0, form:0
     } */
  function makeSide(desc) {
    desc = desc || {};
    var d = dimsOf(desc.players);
    var s = {
      dims: d,
      hero: desc.hero || "",
      heroProf: desc.heroProf || 60,
      mainHero: !!desc.mainHero,
      tactic: desc.tactic || "ope",
      env: desc.env || "运营",
      energy: desc.energy === undefined ? 70 : desc.energy,
      morale: desc.morale === undefined ? 60 : desc.morale,
      spirit: desc.spirit === undefined ? 60 : desc.spirit,
      burst: desc.burst || 0,
      voice: desc.voice || 0,
      coachTrust: desc.coachTrust === undefined ? 50 : desc.coachTrust,
      keyBonus: desc.keyBonus || 0,
      form: desc.form || 0,
      reveal: desc.reveal || 0
    };
    /* 英雄熟练度直接写进英雄池维度：本局英雄熟练低于 60 会拖后腿 */
    s.dims.POOL = clamp(s.dims.POOL * .55 + s.heroProf * .45, 1, 99);
    /* 状态维度 */
    s.dims.FORM = clamp((s.energy - 50) * .45 + (s.morale - 50) * .40 + (s.spirit - 50) * .30
      + (s.burst || 0) * .12 + s.form * 4, -30, 30);
    return s;
  }

  /* ---------- 英雄克制 ---------- */
  function ctrOf(aName, bName) {
    var CTR = window.DATA_HERO_CTR || { hard: [], ring: {} };
    var A = heroByName(aName), B = heroByName(bName);
    var out = { d: 0, why: "" };
    if (!A || !B || aName === bName) return out;
    var hard = CTR.hard || [], i;
    for (i = 0; i < hard.length; i++) {
      if (hard[i].a === aName && hard[i].b === bName) return { d: 8, why: hard[i].why };
      if (hard[i].a === bName && hard[i].b === aName) return { d: -8, why: hard[i].why };
    }
    var ta = A.tag || [], tb = B.tag || [], best = 0, why = "";
    for (var x = 0; x < ta.length; x++) {
      for (var y = 0; y < tb.length; y++) {
        if (CTR.ring && CTR.ring[ta[x]] === tb[y]) {
          var txt = (CTR.ringText && (CTR.ringText[ta[x] + ">" + tb[y]])) || (ta[x] + "克" + tb[y]);
          if (!best) { best = 5; why = txt; }
        }
      }
    }
    if (best) return { d: best, why: why };
    return out;
  }

  /* ---------- 战术克制 ---------- */
  function tacticEdge(tactic, foeTendency, env) {
    var e = 0, why = [];
    var et = ENV_TACTIC[env];
    if (et && et[tactic]) { e += et[tactic]; if (et[tactic] > .03) why.push("吃了版本环境"); }
    /* 对手倾向 */
    var tend = foeTendency || "运营";
    if (tactic === "early" && (tend === "运营" || tend === "后期")) { e += .04; why.push("对手爱拖，你抢前期"); }
    if (tactic === "split" && tend === "打团") { e += .05; why.push("对手只会打团，你用边线耗死他"); }
    if (tactic === "fight" && tend === "单带") { e += .04; why.push("对手边线流，你强开逼团"); }
    if (tactic === "ope" && tend === "打团") { e += .03; why.push("他用团战，你用运营绕开"); }
    return { e: clamp(e, -.06, .08), why: why };
  }

  /* ---------- 单个选项/单局的胜率 ---------- */
  /* dim: 该选项吃哪个维度；opt 可带 heroCtr / 其它 */
  function optionProb(mine, theirs, ctx) {
    var dim = (ctx && ctx.dim) || "GAME";
    var a = mine.dims[dim] || 65, b = theirs.dims[dim] || 65;
    var p = sig(a - b, 9);
    var tags = [];
    function add(k, v, tone) { if (Math.abs(v) >= .01) tags.push({ k: k, v: v, tone: tone || (v > 0 ? "good" : "bad") }); }

    /* 状态 */
    add("体力", (mine.energy - 60) * .002);
    add("心态", (mine.morale - 55) * .002);
    add("士气", (mine.spirit - 55) * .0015);
    /* 爆种 */
    if (mine.burst >= 60) add("爆种", .05 + Math.min(.05, mine.burst / 2000));
    /* 本命 */
    if (mine.mainHero && mine.hero) add("本命自信", .08);
    else if (mine.heroProf >= 85) add("熟练度", .04);
    else if (mine.heroProf < 55) add("生疏", -.06);
    /* 英雄克制 */
    var ctr = ctrOf(mine.hero, theirs.hero);
    add("英雄克制", ctr.d / 55);
    /* 版本契合：本局英雄是否在版本加强名单 */
    if (ctx && ctx.patchBuffs && ctx.patchBuffs[mine.hero]) {
      add("版本契合", ctx.patchBuffs[mine.hero] > 0 ? .03 : -.03);
    } else if (ctx && ctx.patchBuffs && ctx.patchBuffs[theirs.hero]) {
      add("版本吃亏", ctx.patchBuffs[theirs.hero] > 0 ? -.03 : .03);
    }
    /* 战术 */
    var te = tacticEdge(mine.tactic, theirs.tendency, mine.env);
    add("战术克制", te.e);
    /* 教练信任 / 话语权 */
    add("教练信任", (mine.coachTrust - 50) * .001);
    add("外设加成", (mine.keyBonus || 0) / 100);
    if (ctx && ctx.key) { /* 关键局 */ 
      add("关键局", (mine.morale - 55) * .002);
    }
    var sum = 0;
    tags.forEach(function (t) { sum += t.v; });
    p += sum;
    p = clamp(p, .05, .95);
    /* 大优势留 6% 被翻、大劣势留 8% 翻盘 */
    if (p > .88) p = .88 + (p - .88) * .5;
    if (p < .12) p = .12 - (.12 - p) * .5;
    return { p: p, tags: tags, ctr: ctr, tacticWhy: te.why };
  }

  /* ---------- 自动 BO（常规赛/其它队比赛） ---------- */
  function simBo(mine, theirs, ctx) {
    ctx = ctx || {};
    var bestOf = ctx.bestOf || 3;
    var need = Math.ceil(bestOf / 2);
    var w = 0, l = 0, games = [];
    var drain = bestOf === 5 ? [8, 10, 12, 14, 16] : [6, 6, 6];
    var keyVars = null;
    while (w < need && l < need) {
      var idx = w + l;
      var one = optionProb(mine, theirs, { dim: ctx.dim || "GAME", key: (idx === bestOf - 1) && bestOf === 5, patchBuffs: ctx.patchBuffs });
      var win = (ctx.rnd ? ctx.rnd() : Math.random()) < one.p;
      if (idx === 0) keyVars = one.tags.slice(0, 4);
      games.push({ win: win, p: one.p });
      if (win) w++; else l++;
      /* 体力/心态消耗，mutable side */
      mine.energy = clamp(mine.energy - (drain[idx] || 8), 0, 100);
      if (!win) mine.morale = clamp(mine.morale - 6, 0, 100);
      /* 连败心态继续掉 */
      if (l >= 2 && !win) mine.morale = clamp(mine.morale - 4, 0, 100);
      mine.dims.FORM = clamp((mine.energy - 50) * .45 + (mine.morale - 50) * .40 + (mine.spirit - 50) * .30 + mine.burst * .12, -30, 30);
    }
    var winBo = w > l;
    /* 爆冷：按双方基础实力差判定"这算不算冷门" */
    var gap = (mine.dims.LANE + mine.dims.MECH + mine.dims.GAME) / 3
      - (theirs.dims.LANE + theirs.dims.MECH + theirs.dims.GAME) / 3;
    var upset = 0;
    if (winBo && gap < -4) upset = 1;
    if (!winBo && gap > 4) upset = 1;
    return {
      win: winBo, w: w, l: l, games: games, keyVars: keyVars || [],
      upset: upset, gap: gap, energyLeft: mine.energy, moraleLeft: mine.morale
    };
  }

  /* ---------- 联赛：一轮比赛全部模拟（其它队互打） ---------- */
  /* entries: [{id, power}]，返回 [{a,b,win:"a"|"b", score:"2-0"}] */
  function leagueRound(entries, rnd) {
    var list = entries.slice();
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1)), t = list[i]; list[i] = list[j]; list[j] = t;
    }
    var out = [];
    for (var k = 0; k + 1 < list.length; k += 2) {
      var A = list[k], B = list[k + 1];
      var p = sig((A.power - B.power) + (rnd() - .5) * 6, 9);
      var winA = rnd() < p;
      out.push({ a: A.id, b: B.id, win: winA ? "a" : "b", score: rnd() < .35 ? "2-1" : "2-0" });
    }
    return out;
  }

  /* ---------- 瑞士轮 ---------- */
  /* entries:[{id,power}]，rounds 默认 5，返回每一轮的配对和结果 */
  function swiss(entries, rnd, bestOf) {
    bestOf = bestOf || 3;
    var rec = {}, res = [], alive = entries.map(function (e) { return e.id; });
    entries.forEach(function (e) { rec[e.id] = { w: 0, l: 0, opp: [] }; });
    var byId = {}; entries.forEach(function (e) { byId[e.id] = e; });
    for (var r = 0; r < 5; r++) {
      var pool = alive.slice().sort(function (x, y) { return (rec[x].w - rec[y].w) || (rnd() - .5); });
      var pairs = [], round = { round: r + 1, matches: [] };
      while (pool.length > 1) {
        var A = pool.shift(), B = null;
        for (var i = 0; i < pool.length; i++) {
          if ((rec[A].opp || []).indexOf(pool[i]) < 0) { B = pool.splice(i, 1)[0]; break; }
        }
        if (!B) B = pool.shift();
        if (!B) break;
        var p = sig((byId[A].power - byId[B].power) + (rnd() - .5) * 8, 9);
        var winA = rnd() < p;
        rec[A].opp.push(B); rec[B].opp.push(A);
        if (winA) { rec[A].w++; rec[B].l++; } else { rec[B].w++; rec[A].l++; }
        round.matches.push({ a: A, b: B, win: winA ? A : B });
        pairs.push(winA ? A : B);
      }
      res.push(round);
    }
    var out = entries.map(function (e) {
      return { id: e.id, w: rec[e.id].w, l: rec[e.id].l };
    }).sort(function (x, y) { return y.w - x.w; });
    return { rounds: res, table: out, rec: rec };
  }

  /* ---------- 单败淘汰 ---------- */
  /* entries: [{id,power}] 按种子顺序，bestOf 数组或单值 */
  function bracketRound(pairs, rnd, bestOf) {
    bestOf = bestOf || 5;
    var need = Math.ceil(bestOf / 2);
    return pairs.map(function (pr) {
      var A = pr.a, B = pr.b, wa = 0, wb = 0;
      while (wa < need && wb < need) {
        var p = sig((A.power - B.power) + (rnd() - .5) * 7, 9);
        if (rnd() < p) wa++; else wb++;
      }
      return { a: A, b: B, win: wa > wb ? A : B, score: wa + "-" + wb };
    });
  }

  /* ---------- BP 辅助 ---------- */
  /* 从英雄池里按位置筛可玩英雄，熟练度排序 */
  function heroesFor(pos, pool, patch, n) {
    var H = window.DATA_HEROES || [];
    var list = [];
    H.forEach(function (h) {
      if ((h.pos || []).indexOf(pos) >= 0) {
        var prof = (pool && pool[h.n]) || 0;
        if (prof > 0) list.push({ n: h.n, en: h.en, prof: prof, diff: h.diff, tag: h.tag, buff: (patch && patch[h.n]) || 0 });
      }
    });
    list.sort(function (x, y) { return (y.prof + y.buff * 2) - (x.prof + x.buff * 2); });
    return n ? list.slice(0, n) : list;
  }

  /* 对手 AI 选英雄：从该位置英雄里挑版本分最高的几个之一 */
  function aiPick(pos, rnd, patch, exclude) {
    var H = (window.DATA_HEROES || []).filter(function (h) {
      return (h.pos || []).indexOf(pos) >= 0 && (!exclude || exclude.indexOf(h.n) < 0);
    });
    if (!H.length) return "";
    var scored = H.map(function (h) {
      var b = (patch && patch[h.n]) || 0;
      return { n: h.n, s: b * 3 + (1 - (h.diff || 2) / 3) * 4 + rnd() * 8 };
    }).sort(function (x, y) { return y.s - x.s; });
    return scored[0].n;
  }

  /* 对手 ban：ban 掉玩家熟练度最高的英雄 */
  function aiBan(pool, rnd, exclude) {
    var arr = Object.keys(pool || {}).map(function (n) { return { n: n, p: pool[n] }; })
      .sort(function (x, y) { return y.p - x.p; });
    for (var i = 0; i < arr.length; i++) {
      if (!exclude || exclude.indexOf(arr[i].n) < 0) return arr[i].n;
    }
    return "";
  }

  /* ---------- 世界赛赛制辅助 ---------- */
  function seedBracket(qualified) {
    /* qualified: 8 队按瑞士轮战绩排序 -> 1v8 2v7 3v6 4v5 */
    var q = qualified.slice(0, 8);
    return [
      { a: q[0], b: q[7] }, { a: q[3], b: q[4] },
      { a: q[1], b: q[6] }, { a: q[2], b: q[5] }
    ];
  }

  return {
    DIMS: DIMS, STATS: STATS, INFLUENCE: INFLUENCE,
    dimsOf: dimsOf, makeSide: makeSide,
    ctrOf: ctrOf, tacticEdge: tacticEdge,
    optionProb: optionProb, simBo: simBo,
    leagueRound: leagueRound, swiss: swiss, bracketRound: bracketRound, seedBracket: seedBracket,
    heroesFor: heroesFor, aiPick: aiPick, aiBan: aiBan,
    heroByName: heroByName, sig: sig, clamp: clamp
  };
})();
