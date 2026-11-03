/* 《登神》斗蛐蛐模式 · 关公战秦琼（新增文件）
   导出 window.COCKFIGHT = {
     mount(root)             把界面挂到某个 DOM 容器上（自动绑定 data-act 点击代理）
     html()                  当前界面 HTML（.cf 根节点，可直接塞进 stage）
     pageHTML()              带 .console.solo 外壳的完整页面 HTML（方便直接当场景页）
     click(act, i, v)        处理一次点击，返回 true 表示已接管；已 mount 时会自动重绘
     onAct(act, el)          click 的兼容别名（ui 层可传 el，内部取 el.dataset）
     simulate(blue, red, opt)纯函数模拟：blue/red 为 5 个选手卡 id，opt={mode:"BO1"|"BO3",seed}
     open(opt)               重置并回到选人页
     state()                 当前内部状态（只读调试用）
     VERSION
   }
   依赖：window.DATA_MGR.cards、window.DATA_HEROES、window.DATA_CARD_META（js/data/card_meta.js）、
        可选 window.DATA_BONDS / window.DATA_CARD_BONDS（缺失时用 card_meta 里的最小羁绊表兜底）。
   约定：无 inline onclick，所有可点元素 data-act="cf-*"；无 Math.random，随机全部来自 seed。
*/
window.COCKFIGHT = (function () {
  "use strict";

  var POS = ["TOP", "JUG", "MID", "BOT", "SUP"];
  var POSCN = { TOP: "上单", JUG: "打野", MID: "中单", BOT: "下路", SUP: "辅助" };
  var POSIDX = { TOP: 0, JUG: 1, MID: 2, BOT: 3, SUP: 4 };
  var RARITY_TONE = { "金": "gold", "紫": "purple", "蓝": "" };
  var TILT_CN = { farm: "农", greed: "贪", tempo: "节", teamfight: "团", mental: "心" };

  /* 每个位置的对位权重：对线型位置看 LANE，节奏型看 GAME，辅助看 TEAM/视野 */
  var WEIGHTS = {
    TOP: { LANE: 0.44, MECH: 0.20, GAME: 0.10, POOL: 0.10, TEAM: 0.06, farm: 0.10 },
    JUG: { LANE: 0.14, MECH: 0.20, GAME: 0.32, POOL: 0.12, TEAM: 0.12, tempo: 0.10 },
    MID: { LANE: 0.36, MECH: 0.22, GAME: 0.16, POOL: 0.12, TEAM: 0.08, farm: 0.06 },
    BOT: { LANE: 0.38, MECH: 0.22, GAME: 0.10, POOL: 0.10, TEAM: 0.06, farm: 0.14 },
    SUP: { LANE: 0.12, MECH: 0.16, GAME: 0.20, POOL: 0.16, TEAM: 0.26, teamfight: 0.10 }
  };

  /* ---------- 小工具 ---------- */
  function esc(v) {
    if (v === null || v === undefined) return "";
    return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function r1(v) { return Math.round(v * 10) / 10; }
  function f1(v) { return (Math.round(v * 10) / 10).toFixed(1); }
  function avg(arr) { var s = 0; for (var i = 0; i < arr.length; i++) s += arr[i]; return s / (arr.length || 1); }
  function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }
  function hash32(str) {
    var h = 2166136261 >>> 0;
    str = String(str);
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  /* UI 侧随机（不用 Math.random，保证可复现/可调试） */
  var rndState = (Date.now() >>> 0) || 12345;
  function rand() {
    rndState = (rndState * 1664525 + 1013904223) >>> 0;
    return rndState / 4294967296;
  }

  /* ---------- 数据 ---------- */
  var META = window.DATA_CARD_META || {};
  var CARDS = ((window.DATA_MGR && window.DATA_MGR.cards) || []).filter(function (c) { return !!META[c.id]; });
  var CARD_BY_ID = {};
  CARDS.forEach(function (c) { CARD_BY_ID[c.id] = c; });

  var BOND_MAP = {};
  (window.DATA_CARD_BONDS || []).forEach(function (b) { if (b && b.id) BOND_MAP[b.id] = b; });
  (window.DATA_BONDS || []).forEach(function (b) { if (b && b.id) BOND_MAP[b.id] = b; });

  function metaOf(id) {
    if (!id) return null;
    var m = META[id];
    if (!m && CARD_BY_ID[id]) m = META[id];
    return m || null;
  }
  function cardOf(id) {
    var m = metaOf(id);
    return m ? (CARD_BY_ID[m.id] || { st: {} }) : null;
  }
  function usedIds() {
    var out = [];
    S.blue.concat(S.red).forEach(function (id) { if (id) out.push(id); });
    return out;
  }

  /* ---------- 状态 ---------- */
  var S = {
    mode: "BO3",
    screen: "setup",
    pickSide: "blue",
    pickPos: "TOP",
    tab: "TOP",
    blue: [null, null, null, null, null],
    red: [null, null, null, null, null],
    seed: 0,
    result: null,
    root: null,
    bound: false,
    boundRoot: null,
    _handler: null
  };

  /* ---------- 羁绊 ---------- */
  function computeBonds(ids) {
    var counts = {};
    ids.forEach(function (id) {
      var m = metaOf(id);
      if (!m) return;
      (m.bond || []).forEach(function (bid) {
        if (!counts[bid]) counts[bid] = [];
        counts[bid].push(m.name);
      });
    });
    var active = [], near = [];
    for (var bid in counts) {
      var def = BOND_MAP[bid];
      if (!def) continue;
      var need = def.need || 3;
      var have = counts[bid].length;
      if (have >= need) {
        active.push({ id: bid, name: def.name, desc: def.desc || "", eff: def.eff || {}, have: have, need: need, members: counts[bid] });
      } else if (have === need - 1) {
        near.push({ id: bid, name: def.name, have: have, need: need, missing: need - have });
      }
    }
    active.sort(function (a, b) { return (b.need - a.need) || (a.id < b.id ? -1 : 1); });
    near.sort(function (a, b) { return a.missing - b.missing || (a.id < b.id ? -1 : 1); });
    return { active: active, near: near };
  }
  function effText(eff) {
    var map = { lanes: "对线", teamfight: "团战", resource: "资源", tempo: "节奏", mental: "心态", greed: "凶", farm: "发育" };
    var out = [];
    for (var k in (eff || {})) if (map[k] && Number(eff[k])) out.push("+" + f1(Number(eff[k])) + " " + map[k]);
    return out.join("，");
  }

  /* ---------- 阵容构建 ---------- */
  function buildSide(ids, label) {
    var lanes = POS.map(function (pos, i) {
      var m = metaOf(ids[i]);
      var card = cardOf(ids[i]) || {};
      var st = card.st || {};
      var w = WEIGHTS[pos];
      var power = (st.LANE || 70) * w.LANE + (st.MECH || 70) * w.MECH + (st.GAME || 70) * w.GAME
        + (st.POOL || 70) * w.POOL + (st.TEAM || 70) * w.TEAM
        + (m.tilt.farm || 50) * (w.farm || 0) + (m.tilt.tempo || 50) * (w.tempo || 0)
        + (m.tilt.teamfight || 50) * (w.teamfight || 0);
      power += m.rarity === "金" ? 1.2 : (m.rarity === "紫" ? 0.6 : 0);
      power += m.star ? 0.6 : 0;
      return { pos: pos, idx: i, id: m.id, meta: m, card: card, power: power, draft: 0 };
    });
    var ovr = 0, salary = 0;
    lanes.forEach(function (l) { ovr += l.meta.ovr || 0; salary += l.meta.salary || 0; });
    return {
      label: label, ids: ids.slice(), lanes: lanes,
      ovr: ovr, salary: salary, bonds: computeBonds(ids),
      bonus: { lanes: 0, teamfight: 0, resource: 0, tempo: 0, mental: 0, greed: 0, farm: 0 }
    };
  }

  /* 同位置英雄池重合 + 本命被对手池覆盖 → 选人被针对 */
  function draftPenalty(mine, opp) {
    var overlap = 0;
    for (var i = 0; i < mine.meta.pool.length; i++) {
      if (opp.meta.pool.indexOf(mine.meta.pool[i]) >= 0) overlap++;
    }
    var depth = clamp((((mine.card.st || {}).POOL || 70) - 70) * 0.012, 0, 0.36);
    var pen = overlap * (0.62 - depth);
    var sigHit = 0;
    for (var k = 0; k < mine.meta.sig.length; k++) {
      if (opp.meta.pool.indexOf(mine.meta.sig[k]) >= 0) sigHit++;
    }
    return pen + sigHit * 1.5;
  }

  function dimsOf(side) {
    var tf = 0, res = 0, tmp = 0;
    side.lanes.forEach(function (l) {
      var st = l.card.st || {}, m = l.meta;
      tf += (m.tilt.teamfight || 50) * 0.42 + (st.TEAM || 70) * 0.38 + (st.MECH || 70) * 0.20;
      res += (m.tilt.farm || 50) * 0.40 + (st.GAME || 70) * 0.34 + (st.POOL || 70) * 0.16;
      tmp += (m.tilt.tempo || 50) * 0.42 + (st.GAME || 70) * 0.36 + (st.LANE || 70) * 0.22;
    });
    var dims = { teamfight: tf / 5, resource: res / 5, tempo: tmp / 5, synergy: 0 };
    // 倾向互补：相邻两路一个更偏发育、一个更偏抓机会，体系更完整
    var pairs = [[0, 1], [1, 2], [2, 3], [3, 4]], syn = 0;
    pairs.forEach(function (p) {
      var a = side.lanes[p[0]].meta.tilt, b = side.lanes[p[1]].meta.tilt;
      syn += (Math.abs(a.farm - b.farm) + Math.abs(a.greed - b.greed) + Math.abs(a.teamfight - b.teamfight)) / 3;
    });
    dims.synergy = syn / 4;
    dims.teamfight += dims.synergy * 0.02;
    dims.tempo += dims.synergy * 0.02;
    dims.resource += dims.synergy * 0.015;
    return dims;
  }

  function applyBonds(side, dims) {
    var b = side.bonus;
    side.bonds.active.forEach(function (bond) {
      var e = bond.eff || {};
      for (var k in e) if (b[k] !== undefined) b[k] += Number(e[k]) || 0;
    });
    dims.teamfight += b.teamfight * 1.6 + b.greed * 0.8 + b.farm * 0.4;
    dims.resource += b.resource * 1.6 + b.farm * 1.0;
    dims.tempo += b.tempo * 1.6 + b.greed * 0.6;
    side.lanes.forEach(function (l) { l.power += b.lanes * 1.3; });
  }

  function mentalOf(side) {
    return avg(side.lanes.map(function (l) { return l.meta.tilt.mental || 50; })) + side.bonus.mental * 2;
  }
  function compScore(d) { return d.teamfight * 0.42 + d.resource * 0.30 + d.tempo * 0.28; }

  /* ---------- 阵容输入兼容 ----------
     simulate(blue, red) 的 blue/red 既接受「选手卡 id」（mp_*），也接受
     「玩家/选手 id」（p_*、p_lck_*，即玩家当前阵容、队友 id）。解析顺序：
       1) 直接是卡 id；
       2) window.DATA_ID_ALIAS[raw] 映射（可能映射到卡 id / p_* / p_lck_*），循环展开；
       3) window.DATA_CARD_META[raw] 的 pid 别名（card_meta 为每张卡的 pid 建了别名）；
       4) p_lck_* → window.DATA_LCK.players 的 name+pos 反查卡（优先明星/新年份）；
       5) 去掉 p_ 前缀后按卡面 pid 精确匹配。
     全部失败返回 null（simulate 返回 {error:"无法识别的选手: …"}，不抛异常）。 */
  function byNamePos(name, pos) {
    var best = null;
    CARDS.forEach(function (c) {
      var m = META[c.id];
      if (!m || m.pos !== pos) return;
      if (m.name !== name && m.cn !== name) return;
      if (!best) { best = c.id; return; }
      var bm = META[best];
      if ((m.year || 0) > (bm.year || 0) || (m.star && !bm.star)) best = c.id;
    });
    return best;
  }
  function resolveId(raw) {
    if (!raw) return null;
    var s = String(raw);
    if (CARD_BY_ID[s]) return s;
    var alias = window.DATA_ID_ALIAS || {};
    var cur = s, seen = {}, guard = 0;
    while (alias[cur] && !seen[cur] && guard++ < 4) {
      seen[cur] = 1;
      cur = alias[cur];
      if (CARD_BY_ID[cur]) return cur;
    }
    var m = META[s] || META[cur];
    if (m) return m.id;   // pid 别名 / talents_v4 扩容卡（tal4_*）也走这里
    if (/^p_lck_/.test(cur)) {
      var lp = (window.DATA_LCK && window.DATA_LCK.players) || [];
      for (var i = 0; i < lp.length; i++) {
        if (lp[i] && lp[i].id === cur) {
          var hit = byNamePos(lp[i].name, lp[i].pos);
          if (hit) return hit;
        }
      }
    }
    if (/^p_/.test(cur)) {
      for (var j = 0; j < CARDS.length; j++) {
        if (CARDS[j].pid === cur || CARDS[j].pid === "p_" + cur.replace(/^p_/, "")) return CARDS[j].id;
      }
    }
    return null;
  }
  function normalizeLineup(arr) {
    var out = (arr || []).slice(0, 5).map(resolveId);
    var usedPos = {}, unique = true;
    out.forEach(function (id) {
      var m = id && META[id];
      if (!m) { unique = false; return; }
      if (usedPos[m.pos]) unique = false;
      usedPos[m.pos] = 1;
    });
    // 位置齐全且不重复时按 TOP/JUG/MID/BOT/SUP 排序，容忍乱序输入
    if (unique) out.sort(function (a, b) { return POS.indexOf(META[a].pos) - POS.indexOf(META[b].pos); });
    return out;
  }

  /* ---------- 模拟核心（纯函数、确定性） ---------- */
  function simulate(blue, red, opt) {
    opt = opt || {};
    var mode = opt.mode === "BO1" ? "BO1" : (opt.mode === "BO3" ? "BO3" : (S.mode === "BO1" ? "BO1" : "BO3"));
    var rawB = (blue || []).slice(0, 5), rawR = (red || []).slice(0, 5);
    if (rawB.length !== 5 || rawR.length !== 5 || rawB.some(function (x) { return !x; }) || rawR.some(function (x) { return !x; })) {
      return { error: "双方都要选满 5 个位置才能开打。" };
    }
    var bIds = normalizeLineup(rawB), rIds = normalizeLineup(rawR);
    var unknown = [];
    bIds.forEach(function (id, i) { if (!id) unknown.push(rawB[i]); });
    rIds.forEach(function (id, i) { if (!id) unknown.push(rawR[i]); });
    if (unknown.length) {
      return { error: "无法识别的选手: " + unknown.slice(0, 3).join("、") };
    }
    if (bIds.some(function (x) { return !metaOf(x); }) || rIds.some(function (x) { return !metaOf(x); })) {
      return { error: "阵容里有不存在的选手卡。" };
    }
    var seed = opt.seed != null ? (opt.seed >>> 0) : hash32(bIds.join(",") + "#" + rIds.join(",") + "#" + mode);
    var rng = mulberry32(seed);

    var B = buildSide(bIds, "蓝方");
    var R = buildSide(rIds, "红方");
    var lanes = [];
    for (var i = 0; i < 5; i++) {
      var a = B.lanes[i], b = R.lanes[i];
      a.draft = draftPenalty(a, b);
      b.draft = draftPenalty(b, a);
      a.power -= a.draft;
      b.power -= b.draft;
      var edge = a.power - b.power;
      lanes.push({ pos: POS[i], blue: a, red: b, edge: edge, pBlue: sigmoid(edge / 9) });
    }
    var dimsB = dimsOf(B), dimsR = dimsOf(R);
    applyBonds(B, dimsB);
    applyBonds(R, dimsR);
    var laneAgg = avg(lanes.map(function (l) { return l.pBlue; }));
    var teamEdge = 0.42 * (dimsB.teamfight - dimsR.teamfight)
      + 0.30 * (dimsB.resource - dimsR.resource)
      + 0.28 * (dimsB.tempo - dimsR.tempo);
    var mentalB = mentalOf(B), mentalR = mentalOf(R);

    var games = [], bw = 0, rw = 0;
    var maxG = mode === "BO1" ? 1 : 3;
    for (var g = 1; g <= maxG; g++) {
      if (g > 1 && (bw >= 2 || rw >= 2)) break;
      var decider = (mode === "BO3" && g === 3);
      var noise = (rng() * 2 - 1) * 0.30;
      var clutch = (mentalB - mentalR) * 0.012 * (decider ? 1.6 : 0.5);
      var pBlue = sigmoid((laneAgg - 0.5) * 2.6 + teamEdge * 0.022 + clutch + noise);
      var winner = rng() < pBlue ? "blue" : "red";
      if (winner === "blue") bw++; else rw++;
      var side = winner === "blue" ? B : R;
      var best = side.lanes.slice().sort(function (x, y) { return y.power - x.power; })[0];
      var key = lanes.slice().sort(function (x, y) { return Math.abs(y.edge) - Math.abs(x.edge); })[0];
      games.push({
        n: g, winner: winner, pBlue: pBlue, score: bw + ":" + rw,
        mvp: { pos: best.pos, name: best.meta.name, id: best.meta.id },
        keyLane: key.pos, keySide: key.edge >= 0 ? "blue" : "red"
      });
    }

    var blueView = viewSide(B, dimsB);
    var redView = viewSide(R, dimsR);
    var result = {
      mode: mode, seed: seed,
      winner: bw > rw ? "blue" : "red",
      score: { blue: bw, red: rw },
      blue: blueView, red: redView,
      lanes: lanes.map(function (l) {
        return {
          pos: l.pos, edge: r1(l.edge), pBlue: l.pBlue,
          blue: laneView(l.blue), red: laneView(l.red)
        };
      }),
      dims: {
        blue: { teamfight: r1(dimsB.teamfight), resource: r1(dimsB.resource), tempo: r1(dimsB.tempo), synergy: r1(dimsB.synergy), comp: r1(compScore(dimsB)) },
        red: { teamfight: r1(dimsR.teamfight), resource: r1(dimsR.resource), tempo: r1(dimsR.tempo), synergy: r1(dimsR.synergy), comp: r1(compScore(dimsR)) },
        weights: { teamfight: 0.42, resource: 0.30, tempo: 0.28 }
      },
      games: games
    };
    result.report = buildReport(result);
    return result;
  }

  function laneView(l) {
    return {
      pos: l.pos, id: l.meta.id, name: l.meta.name, team: l.meta.teamName, year: l.meta.year,
      ovr: l.meta.ovr, salary: l.meta.salary, rarity: l.meta.rarity,
      pool: l.meta.pool.slice(), sig: l.meta.sig.slice(), tilt: l.meta.tilt,
      power: r1(l.power), draft: r1(l.draft)
    };
  }
  function viewSide(side, dims) {
    return {
      label: side.label, ids: side.ids.slice(),
      ovr: side.ovr, salary: side.salary,
      lanes: side.lanes.map(laneView),
      dims: { teamfight: r1(dims.teamfight), resource: r1(dims.resource), tempo: r1(dims.tempo), synergy: r1(dims.synergy), comp: r1(compScore(dims)) },
      bonds: side.bonds,
      bonus: side.bonus,
      mental: r1(mentalOf(side))
    };
  }

  /* ---------- 战报（3~5 条长句） ---------- */
  function buildReport(r) {
    var B = r.blue, R = r.red, lines = [];
    var bn = B.lanes.map(function (l) { return l.name; });
    var rn = R.lanes.map(function (l) { return l.name; });
    lines.push("蓝方摆出 " + POSCN.TOP + " " + bn[0] + "、" + POSCN.JUG + " " + bn[1] + "、" + POSCN.MID + " " + bn[2]
      + "、" + POSCN.BOT + " " + bn[3] + "、" + POSCN.SUP + " " + bn[4] + "；红方是 " + rn[0] + "、" + rn[1] + "、" + rn[2]
      + "、" + rn[3] + "、" + rn[4] + "。纸面上蓝方总 OVR " + B.ovr + "、总身价 " + B.salary + "，红方 " + R.ovr + "、" + R.salary + "。");
    var key = r.lanes.slice().sort(function (x, y) { return Math.abs(y.edge) - Math.abs(x.edge); })[0];
    var keySide = key.edge >= 0 ? key.blue : key.red;
    var keyOpp = key.edge >= 0 ? key.red : key.blue;
    lines.push("对位最悬殊的是" + POSCN[key.pos] + "：蓝方 " + key.blue.name + "（" + key.blue.pool.slice(0, 2).join("/")
      + "）对红方 " + key.red.name + "（" + key.red.pool.slice(0, 2).join("/") + "），对位分差 " + (key.edge >= 0 ? "+" : "") + key.edge
      + "，" + keySide.name + " 这一路占优，是全场最大的突破口。");
    var d = r.dims;
    lines.push("团战 " + f1(d.blue.teamfight) + " 对 " + f1(d.red.teamfight) + "，资源 " + f1(d.blue.resource) + " 对 " + f1(d.red.resource)
      + "，节奏 " + f1(d.blue.tempo) + " 对 " + f1(d.red.tempo) + "；按 0.42 / 0.30 / 0.28 加权，蓝方综合 " + f1(d.blue.comp)
      + "，红方 " + f1(d.red.comp) + "，体系互补度 " + f1(d.blue.synergy) + " 对 " + f1(d.red.synergy) + "。");
    var ab = B.bonds.active, rb = R.bonds.active;
    var bondLine = "羁绊方面，蓝方" + (ab.length ? "达成「" + ab[0].name + "」（" + effText(ab[0].eff) + "）" : "没有成型的羁绊")
      + "，红方" + (rb.length ? "达成「" + rb[0].name + "」（" + effText(rb[0].eff) + "）" : "没有成型的羁绊");
    var nearB = B.bonds.near[0] || R.bonds.near[0];
    if (nearB) bondLine += "；还差 " + nearB.missing + " 人就能凑出「" + nearB.name + "」";
    lines.push(bondLine + "。");
    var scoreLine = r.mode + " 打完，" + (r.winner === "blue" ? "蓝方" : "红方") + " " + r.score.blue + " : " + r.score.red
      + " 拿下这盘斗蛐蛐";
    var gameTxt = r.games.map(function (g) {
      return "第" + g.n + "局" + (g.winner === "blue" ? "蓝方" : "红方") + "赢（MVP " + g.mvp.name + "）";
    }).join("，");
    lines.push(scoreLine + "：" + gameTxt + "。");
    return lines;
  }

  /* ---------- 界面：选人 ---------- */
  function modeBtn(m) {
    return '<button class="btn small' + (S.mode === m ? " primary" : "") + '" data-act="cf-mode" data-v="' + m + '">' + m + "</button>";
  }
  function poolChips(m) {
    return m.pool.map(function (h) {
      var sig = m.sig.indexOf(h) >= 0;
      return '<span class="chip' + (sig ? " gold" : "") + '">' + esc(h) + (sig ? "★" : "") + "</span>";
    }).join("");
  }
  function tiltText(m) {
    var t = m.tilt;
    return TILT_CN.farm + t.farm + " " + TILT_CN.greed + t.greed + " " + TILT_CN.tempo + t.tempo
      + " " + TILT_CN.teamfight + t.teamfight + " " + TILT_CN.mental + t.mental;
  }
  function teamPanel(side) {
    var arr = S[side], total = 0, sal = 0;
    arr.forEach(function (id) { if (id) { var m = META[id]; total += m.ovr; sal += m.salary; } });
    var rows = POS.map(function (pos, i) {
      var id = arr[i], m = id ? META[id] : null;
      var active = (S.pickSide === side && S.pickPos === pos);
      var idx = i + (side === "blue" ? 0 : 5);
      var inner = m
        ? '<span class="cf-name"><b>' + esc(m.name) + '</b><span class="chip ' + (RARITY_CHIP_TONE(m.rarity)) + '">' + m.ovr + '</span>'
          + '<span class="dim cf-sub">' + esc(m.teamName || "自由人") + " · " + m.year + '</span></span>'
          + '<span class="cf-x" data-act="cf-clear" data-i="' + idx + '" title="移除">×</span>'
        : '<span class="dim cf-empty">点击选择</span>';
      return '<div class="cf-slot' + (active ? " active" : "") + (m ? " filled" : "") + '" data-act="cf-slot" data-i="' + idx + '">'
        + '<span class="cf-pos mono">' + POSCN[pos] + "</span>" + inner + "</div>";
    }).join("");
    return '<div class="panel cf-team ' + side + '">'
      + '<div class="between"><div><div class="kicker">' + (side === "blue" ? "BLUE SIDE" : "RED SIDE") + '</div>'
      + '<h3 class="cf-team-title">' + (side === "blue" ? "蓝方阵容" : "红方阵容") + '</h3></div>'
      + '<div class="right cf-small mono">总 OVR ' + total + '<br>总身价 ' + sal + '</div></div>'
      + rows + "</div>";
  }
  function RARITY_CHIP_TONE(r) { return RARITY_TONE[r] || ""; }

  function benchHTML() {
    var used = usedIds();
    var list = CARDS.filter(function (c) { return c.pos === S.tab && used.indexOf(c.id) < 0; });
    list.sort(function (a, b) { return (b.ovr - a.ovr) || (a.id < b.id ? -1 : 1); });
    if (!list.length) return '<div class="dim cf-empty-bench">这个位置已经没有可用的卡了。</div>';
    return '<div class="cf-bench-list">' + list.map(function (c) {
      var m = META[c.id];
      return '<button class="cf-card" data-act="cf-pick" data-v="' + c.id + '">'
        + '<span class="cf-card-top"><b>' + esc(m.name) + '</b><span class="chip ' + (RARITY_TONE[m.rarity] || "") + '">' + m.ovr + "</span>"
        + (m.star ? '<span class="chip gold">明星</span>' : "") + "</span>"
        + '<span class="cf-card-sub mono">' + esc(m.teamName || "自由人") + " · " + m.year + " · " + esc(m.rarity) + "</span>"
        + '<span class="cf-pool">' + poolChips(m) + "</span>"
        + '<span class="cf-tilt mono">' + tiltText(m) + "</span>"
        + "</button>";
    }).join("") + "</div>";
  }

  function setupHTML() {
    var completeB = S.blue.every(Boolean), completeR = S.red.every(Boolean);
    var canStart = completeB && completeR;
    return '<div class="cf cf-setup">'
      + '<div class="cf-head">'
      + '<div class="kicker">COCKFIGHT · 关公战秦琼</div>'
      + '<h2 class="cf-title">斗蛐蛐</h2>'
      + '<div class="small-note">各挑 5 张选手卡按位置对位，模拟 BO1 / BO3。英雄池重合、本命被针对、倾向互补、卡面 OVR 与羁绊都会算进胜负。</div>'
      + "</div>"
      + '<div class="cf-bar"><div class="row wrap">'
      + '<span class="kicker">赛制</span>' + modeBtn("BO1") + modeBtn("BO3")
      + '<span class="chip mono">seed ' + (S.seed ? S.seed : "自动") + "</span>"
      + '<button class="btn small" data-act="cf-newseed">换种子</button>'
      + "</div></div>"
      + '<div class="cf-teams">' + teamPanel("blue") + teamPanel("red") + "</div>"
      + '<div class="cf-bench">'
      + '<div class="between cf-bench-head"><div class="kicker">选手卡池 · ' + (S.pickSide === "blue" ? "蓝方" : "红方")
      + " · " + POSCN[S.pickPos] + '</div><div class="row wrap">'
      + POS.map(function (pos) {
        return '<button class="btn small' + (S.tab === pos ? " primary" : "") + '" data-act="cf-tab" data-v="' + pos + '">' + POSCN[pos] + "</button>";
      }).join("") + "</div></div>"
      + benchHTML()
      + "</div>"
      + '<div class="cf-actions">'
      + '<button class="btn" data-act="cf-random" data-v="blue">蓝方随机补齐</button>'
      + '<button class="btn" data-act="cf-random" data-v="red">红方随机补齐</button>'
      + '<button class="btn" data-act="cf-random" data-v="both">两边随机</button>'
      + '<button class="btn" data-act="cf-clear" data-i="-1">清空</button>'
      + '<button class="btn primary" data-act="cf-start"' + (canStart ? "" : " disabled") + ">开打</button>"
      + "</div></div>";
  }

  /* ---------- 界面：结算 ---------- */
  function dualBar(a, b) {
    var t = (a + b) || 1, pa = Math.round(a / t * 100);
    return '<span class="cf-dbar"><i class="cf-b" style="width:' + pa + '%"></i><i class="cf-r" style="width:' + (100 - pa) + '%"></i></span>';
  }
  function dimRow(name, a, b) {
    return '<div class="cf-dim"><span class="cf-dim-name mono">' + name + "</span>"
      + '<span class="cf-dim-val cf-b">' + f1(a) + "</span>" + dualBar(a, b)
      + '<span class="cf-dim-val cf-r">' + f1(b) + "</span></div>";
  }
  function bondCol(side) {
    var a = side.bonds.active, n = side.bonds.near;
    var h = '<div class="cf-bonds-col"><div class="kicker">' + esc(side.label) + " 羁绊</div>";
    if (!a.length) h += '<div class="dim cf-sub">没有成型的羁绊。</div>';
    a.forEach(function (b) {
      h += '<div class="cf-bond"><span class="chip gold">达成：' + esc(b.name) + "</span>"
        + '<span class="dim cf-sub">' + esc(effText(b.eff)) + "</span></div>";
    });
    n.slice(0, 3).forEach(function (b) {
      h += '<div class="cf-bond near"><span class="chip">差 ' + b.missing + " 人：" + esc(b.name) + "</span></div>";
    });
    return h + "</div>";
  }
  function lineupMini(side) {
    return '<div class="cf-mini">' + side.lanes.map(function (l) {
      return '<div class="cf-mini-row"><span class="mono cf-pos">' + POSCN[l.pos] + "</span><b>" + esc(l.name)
        + '</b><span class="dim cf-sub">' + esc(l.team || "自由人") + " · " + l.ovr + "</span></div>";
    }).join("") + "</div>";
  }

  function resultHTML() {
    var r = S.result;
    if (!r || r.error) {
      return '<div class="cf"><div class="panel"><div class="kicker">结果</div><h2 class="cf-title">还没开打</h2>'
        + '<div class="dim">' + esc((r && r.error) || "先选满两套阵容。") + "</div></div>"
        + '<div class="cf-actions"><button class="btn" data-act="cf-back">返回选人</button></div></div>';
    }
    var winName = r.winner === "blue" ? "蓝方" : "红方";
    var scoreLine = '<span class="cf-b">' + r.score.blue + '</span><span class="cf-colon">:</span><span class="cf-r">' + r.score.red + "</span>";
    var gameChips = r.games.map(function (g) {
      return '<span class="chip ' + (g.winner === "blue" ? "blue" : "red") + '">第' + g.n + "局 " + (g.winner === "blue" ? "蓝" : "红")
        + " · MVP " + esc(g.mvp.name) + "</span>";
    }).join("");
    var laneRows = r.lanes.map(function (l) {
      var cls = l.edge > 0 ? "win-b" : (l.edge < 0 ? "win-r" : "");
      return '<div class="cf-lane"><span class="cf-pos mono">' + POSCN[l.pos] + "</span>"
        + '<span class="cf-side cf-b"><b>' + esc(l.blue.name) + '</b><span class="dim cf-sub">' + esc(l.blue.team || "自由人") + " · " + l.blue.ovr + "</span></span>"
        + '<span class="cf-edge mono ' + cls + '">' + (l.edge > 0 ? "+" : "") + l.edge + "</span>"
        + '<span class="cf-side cf-r"><b>' + esc(l.red.name) + '</b><span class="dim cf-sub">' + esc(l.red.team || "自由人") + " · " + l.red.ovr + "</span></span></div>";
    }).join("");
    var report = r.report.map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("");
    return '<div class="cf cf-result">'
      + '<div class="cf-head"><div class="kicker">' + r.mode + " · RESULT · seed " + r.seed + '</div>'
      + '<h2 class="cf-title">斗蛐蛐结果</h2>'
      + '<div class="cf-score">' + scoreLine + '<span class="cf-win">' + winName + " 胜</span></div></div>"
      + '<div class="cf-teams cf-result-teams">'
      + '<div class="panel cf-team blue"><div class="kicker">蓝方</div><h3 class="cf-team-title">' + esc(r.blue.label) + '</h3>'
      + lineupMini(r.blue) + '<div class="cf-small mono dim">总 OVR ' + r.blue.ovr + " · 总身价 " + r.blue.salary + "</div></div>"
      + '<div class="panel cf-team red"><div class="kicker">红方</div><h3 class="cf-team-title">' + esc(r.red.label) + '</h3>'
      + lineupMini(r.red) + '<div class="cf-small mono dim">总 OVR ' + r.red.ovr + " · 总身价 " + r.red.salary + "</div></div>"
      + "</div>"
      + '<div class="panel cf-panel"><div class="kicker">逐路对位</div>' + laneRows + "</div>"
      + '<div class="panel cf-panel"><div class="between"><div class="kicker">团战 / 资源 / 节奏（0.42 / 0.30 / 0.28 加权）</div>'
      + '<div class="cf-small mono dim">综合 ' + f1(r.dims.blue.comp) + " 对 " + f1(r.dims.red.comp) + "</div></div>"
      + dimRow("团战", r.dims.blue.teamfight, r.dims.red.teamfight)
      + dimRow("资源", r.dims.blue.resource, r.dims.red.resource)
      + dimRow("节奏", r.dims.blue.tempo, r.dims.red.tempo)
      + '<div class="cf-small mono dim cf-syn">体系互补 ' + f1(r.dims.blue.synergy) + " 对 " + f1(r.dims.red.synergy) + "</div></div>"
      + '<div class="panel cf-panel"><div class="kicker">局分</div><div class="row wrap cf-games">' + gameChips + "</div></div>"
      + '<div class="panel cf-panel cf-bonds">' + bondCol(r.blue) + bondCol(r.red) + "</div>"
      + '<div class="panel cf-panel cf-report"><div class="kicker">战报</div>' + report + "</div>"
      + '<div class="cf-actions">'
      + '<button class="btn primary" data-act="cf-again">再来一局</button>'
      + '<button class="btn" data-act="cf-random" data-v="both">随机再战</button>'
      + '<button class="btn" data-act="cf-back">换阵</button>'
      + "</div></div>";
  }

  function html() { return S.screen === "result" && S.result ? resultHTML() : setupHTML(); }
  function pageHTML() { return '<div class="console solo"><div class="stage fade-in">' + html() + "</div></div>"; }

  /* ---------- 交互 ---------- */
  function fillRandom(side) {
    var used = usedIds();
    POS.forEach(function (pos, i) {
      if (S[side][i]) return;
      var cand = CARDS.filter(function (c) { return c.pos === pos && used.indexOf(c.id) < 0; });
      if (!cand.length) return;
      var c = cand[Math.floor(rand() * cand.length)];
      S[side][i] = c.id;
      used.push(c.id);
    });
  }
  function canPick(c) { return usedIds().indexOf(c.id) < 0; }
  function assign(c) {
    var side = S.pickSide, pos = S.pickPos;
    S[side][POSIDX[pos]] = c.id;
    // 自动跳到下一个空位：先本侧，再另一侧
    var order = side === "blue" ? ["blue", "red"] : ["red", "blue"];
    for (var s = 0; s < order.length; s++) {
      for (var i = 0; i < 5; i++) {
        if (!S[order[s]][i]) { S.pickSide = order[s]; S.pickPos = POS[i]; S.tab = POS[i]; return; }
      }
    }
    // 两边都满了，保持当前选择
    S.tab = pos;
  }
  function resetAll() {
    S.blue = [null, null, null, null, null];
    S.red = [null, null, null, null, null];
    S.screen = "setup";
    S.result = null;
    S.pickSide = "blue";
    S.pickPos = "TOP";
    S.tab = "TOP";
  }
  function click(act, i, v) {
    var handled = true;
    var idx = Number(i);
    switch (act) {
      case "cf-mode": S.mode = v === "BO1" ? "BO1" : "BO3"; break;
      case "cf-slot":
        if (idx >= 0 && idx < 10) {
          S.pickSide = idx < 5 ? "blue" : "red";
          S.pickPos = POS[idx % 5];
          S.tab = S.pickPos;
        }
        break;
      case "cf-tab": S.tab = POSIDX[v] != null ? v : S.tab; S.pickPos = S.tab; break;
      case "cf-pick":
        var c = CARD_BY_ID[v];
        if (c && canPick(c)) assign(c);
        break;
      case "cf-clear":
        if (idx >= 0 && idx < 5) S.blue[idx] = null;
        else if (idx >= 5 && idx < 10) S.red[idx - 5] = null;
        else resetAll();
        break;
      case "cf-random":
        if (S.screen === "result") {
          // 结算页「随机再战」：重抽两边阵容直接开打
          resetAll();
          fillRandom("blue"); fillRandom("red");
          S.seed = (S.seed ? (S.seed * 1103515245 + 12345) : hash32(usedIds().join(","))) >>> 0;
          S.result = simulate(S.blue, S.red, { mode: S.mode, seed: S.seed });
          S.screen = "result";
        } else {
          if (v === "blue" || v === "both") fillRandom("blue");
          if (v === "red" || v === "both") fillRandom("red");
        }
        break;
      case "cf-newseed": S.seed = (S.seed ? (S.seed * 1103515245 + 12345) : hash32("cf" + Date.now())) >>> 0; break;
      case "cf-start":
        if (S.blue.every(Boolean) && S.red.every(Boolean)) {
          S.result = simulate(S.blue, S.red, { mode: S.mode, seed: S.seed || null });
          S.screen = "result";
        }
        break;
      case "cf-again":
        var base = S.result && S.result.seed ? S.result.seed : (S.seed || hash32(usedIds().join(",")));
        S.seed = (base + 7919) >>> 0;
        S.result = simulate(S.blue, S.red, { mode: S.mode, seed: S.seed });
        S.screen = "result";
        break;
      case "cf-back": S.screen = "setup"; S.result = null; break;
      case "cf-open": resetAll(); break;
      default: handled = false;
    }
    if (handled && S.root) S.root.innerHTML = html();
    return handled;
  }
  function onAct(act, el) {
    if (el && el.getAttribute) {
      return click(act || el.getAttribute("data-act"), el.getAttribute("data-i"), el.getAttribute("data-v"));
    }
    return click(act);
  }
  function mount(root) {
    if (!root) return;
    if (S.boundRoot && S.boundRoot !== root && S.boundRoot.removeEventListener && S._handler) {
      S.boundRoot.removeEventListener("click", S._handler);
      S.bound = false;
    }
    S.root = root;
    if (!S.bound && root.addEventListener) {
      S._handler = function (e) {
        var el = e.target;
        while (el && el !== root && !(el.getAttribute && el.getAttribute("data-act"))) el = el.parentNode;
        if (!el || !el.getAttribute) return;
        var act = el.getAttribute("data-act");
        if (!act || act.indexOf("cf-") !== 0) return;
        click(act, el.getAttribute("data-i"), el.getAttribute("data-v"));
      };
      root.addEventListener("click", S._handler);
      S.bound = true;
      S.boundRoot = root;
    }
    root.innerHTML = html();
  }
  function open(opt) {
    resetAll();
    if (opt && opt.mode) S.mode = opt.mode === "BO1" ? "BO1" : "BO3";
    if (S.root) S.root.innerHTML = html();
    return html();
  }

  return {
    VERSION: "1.0.0",
    mount: mount, html: html, pageHTML: pageHTML,
    click: click, onAct: onAct, simulate: simulate, open: open,
    state: function () { return S; },
    POS: POS, POSCN: POSCN
  };
})();
