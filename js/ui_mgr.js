/* 《登神》电竞经理模式 —— 界面层（纯字符串，不碰 DOM）
   导出：window.UIMGR = { bodyHTML(scene), onAct(act, el), VERSION }
   约定：
   - bodyHTML 返回完整页面 HTML（自带 .console.solo，不依赖主生涯的 shell/side）。
   - 所有可点元素带 data-act="mgr" data-v="<指令>"，onAct 返回 true 表示已接管，
     调用方需要在返回 true 后重新 render。
*/
window.UIMGR = (function () {
  "use strict";

  var POS = ["TOP", "JUG", "MID", "BOT", "SUP"];
  var POSCN = { TOP: "上单", JUG: "打野", MID: "中单", BOT: "下路", SUP: "辅助" };

  /* ---------- 小工具 ---------- */
  function esc(v) {
    if (v === null || v === undefined) return "";
    return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function n(v) { var x = Math.round(Number(v) || 0); return String(x); }
  function num(v) { var x = Math.round(Number(v) || 0); return String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  function wan(v) { var x = Math.round(Number(v) || 0); var neg = x < 0; x = Math.abs(x); return (neg ? "-" : "") + num(x) + " 万"; }
  function sp(v) { return (Number(v) > 0 ? "+" : "") + Math.round(Number(v) || 0); }
  function bar(v, color) {
    var w = Math.max(0, Math.min(100, Number(v) || 0));
    return '<span class="bar"><i style="width:' + w + '%' + (color ? ";background:" + color : "") + '"></i></span>';
  }
  function chip(t, tone) { return '<span class="chip' + (tone ? " " + tone : "") + '">' + esc(t) + "</span>"; }
  function tags(arr, tone) {
    if (!arr || !arr.length) return "";
    return '<div class="row wrap" style="gap:5px;margin-top:8px">' + arr.map(function (t) {
      return typeof t === "string" ? chip(t, tone) : chip(t);
    }).join("") + "</div>";
  }
  function panel(inner, flat) { return '<div class="panel' + (flat ? " flat" : "") + '">' + inner + "</div>"; }
  function line(t) { return '<p class="dim" style="margin:8px 0 0;line-height:1.7">' + esc(t) + "</p>"; }
  function note(t) { return '<div class="small-note" style="margin-top:10px">' + esc(t) + "</div>"; }
  function kicker(t) { return '<div class="kicker">' + esc(t) + "</div>"; }
  function title(t) { return '<h2 style="margin:5px 0 0">' + esc(t) + "</h2>"; }
  function head2(a, b) {
    return '<div class="between"><div>' + kicker(a || "") + title(b || "") + '</div>'
      + '<div class="small-note" style="text-align:right">' + (Array.isArray(arguments[2]) ? arguments[2].join("<br>") : esc(arguments[2] || "")) + "</div></div>";
  }
  function kv(k, v) {
    return '<div class="between" style="padding:5px 0;border-bottom:1px solid rgba(255,255,255,.055)">'
      + '<span class="dim">' + esc(k) + '</span><b>' + v + "</b></div>";
  }
  function wrap(inner) {
    return '<div class="console solo"><div class="stage fade-in">' + inner + "</div></div>";
  }
  function actBtn(a, i, cls) {
    var dis = a.dis ? " disabled" : "";
    return '<button class="btn' + (a.tone === "gold" ? " primary" : "") + (cls ? " " + cls : "") + '"'
      + ' data-act="mgr" data-v="' + esc(a.v) + '" data-i="' + i + '"' + dis + ">"
      + esc(a.label) + (a.hint ? ' <span class="tagline">' + esc(a.hint) + "</span>" : "") + "</button>";
  }
  function opts(acts) {
    if (!acts || !acts.length) return "";
    return '<div class="opts" style="display:grid;gap:9px;margin-top:16px">' + acts.map(function (a, i) {
      return '<div class="opt"><span class="idx">' + (i + 1) + "</span>" + actBtn(a, i) + "</div>";
    }).join("") + "</div>";
  }

  /* ---------- 顶部状态条 ---------- */
  function topBar(sc) {
    var h = sc && sc.head;
    if (!h) return "";
    var over = h.salary > h.cap;
    return panel(
      '<div class="between">'
      + '<div><div class="kicker">' + esc(h.team) + " · 第 " + n(h.season) + " / " + n(h.maxSeason) + " 年</div>"
      + '<div class="row wrap" style="gap:6px;margin-top:8px">'
      + chip(h.stage || "", "blue")
      + chip("预算 " + wan(h.budget), "gold")
      + chip("首发工资 " + wan(h.salary) + " / 帽 " + wan(h.cap), over ? "red" : "green")
      + chip("评分 " + n(h.ovr))
      + chip("抽卡券 " + n(h.tickets), "purple")
      + (h.diff ? chip("难度 " + esc(h.diff.name), h.diff.key === "hard" ? "red" : h.diff.key === "easy" ? "green" : "blue") : "")
      + chip("常规赛 " + esc(h.reg || "0 胜 0 负"))
      + (h.roster ? chip("名单 " + esc(h.roster)) : "")
      + (h.inj > 0 ? chip("伤停 " + n(h.inj), "red") : "")
      + (h.coach ? chip("教练 " + h.coach, "blue") : "")
      + "</div></div>"
      + '<div class="small-note" style="text-align:right">' + (over ? "超帽了，老板在看你" : "账面还行") + "</div>"
      + "</div>", true);
  }
  function msgs(sc) {
    if (!sc || !sc.msgs || !sc.msgs.length) return "";
    var last = sc.msgs.slice(-3);
    return '<div class="small-note" style="margin-top:10px;line-height:1.7">'
      + last.map(function (m) { return "· " + esc(m); }).join("<br>") + "</div>";
  }

  /* ---------- 卡片 ---------- */
  function cardHTML(b, code, extra) {
    if (!b) return "";
    var attr = code ? ' data-act="mgr" data-v="' + esc(code) + '"' : "";
    var stats = (b.st || []).map(function (s) {
      return '<div class="stat-cell"><span class="k">' + esc(s.cn) + '</span><span class="v' + (s.v >= 90 ? " gold" : "") + '">' + n(s.v) + "</span></div>";
    }).join("");
    return '<div class="card-face"' + attr + ' style="--rc:' + esc(b.rc) + ';border-color:' + esc(b.rc) + '">'
      + '<div class="rar">' + esc(b.rarn) + "</div>"
      + '<div class="cname">' + esc(b.name || "无名") + "</div>"
      + '<div class="ctype">' + esc(b.poscn) + " · " + n(b.year) + " · " + esc(b.team) + "</div>"
      + '<div class="cdesc">评分 ' + n(b.ovr) + " · 工资 " + wan(b.salary) + "</div>"
      + (stats ? '<div class="stat-grid">' + stats + "</div>" : "")
      + (b.hero ? '<div class="cflavor">本命 · ' + esc(b.hero) + (b.heroProf ? "（熟练 " + n(b.heroProf) + "）" : "") + "</div>" : "")
      + (b.trait && b.trait.length ? '<div class="cflavor">' + esc(b.trait.join("；")) + "</div>" : "")
      + (b.trained ? '<div class="dup">已特训 +' + n(b.trained) + "</div>" : "")
      + (b.injured ? '<div class="dup" style="color:var(--red)">伤停 ' + n(b.injured) + " 场</div>" : "")
      + (extra || "")
      + "</div>";
  }
  function cardGrid(list, codeOf) {
    if (!list || !list.length) return note("一张卡都没有。");
    return '<div class="draw-wrap" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(168px,1fr));gap:12px;margin-top:14px">'
      + list.map(function (b, i) { return cardHTML(b, codeOf ? codeOf(b, i) : ""); }).join("") + "</div>";
  }
  function miniCard(b) {
    if (!b) return chip("空", "red");
    return chip(POSCN[b.pos] + " " + (b.name || "无名") + " · " + n(b.ovr) + (b.injured ? " · 伤停" + n(b.injured) + " 场" : ""), b.rarity === "金" ? "gold" : b.rarity === "紫" ? "purple" : "blue");
  }

  /* ---------- 各场景 ---------- */
  function rMenu(sc) {
    return wrap(
      '<div class="menu-wrap">'
      + '<div class="title-mark">' + kicker("LPL · 电竞经理") + "<h1>登神</h1>"
      + '<div class="sub">你负责买人，不负责操作</div>'
      + '<div class="en">不用按键盘 · 只用签字 · 三年' + "</div></div>"
      + panel((sc.lines || []).map(line).join(""))
      + opts(sc.acts)
      + "</div>");
  }

  function rTeam(sc) {
    var teams = (sc.teams || []).map(function (t) {
      return '<div class="offer" data-act="mgr" data-v="team:' + esc(t.id) + '">'
        + '<div class="between"><b style="color:' + esc(t.color) + '">' + esc(t.name) + "</b>"
        + chip(t.tier + " 级", t.tier === "S" ? "gold" : t.tier === "A" ? "purple" : "blue") + "</div>"
        + '<div class="small-note" style="margin-top:6px">' + esc(t.full || "") + (t.city ? " · " + esc(t.city) : "") + "</div>"
        + '<div class="row wrap" style="gap:5px;margin-top:8px">' + chip("预算 " + wan(t.budget), "gold") + chip("帽 " + wan(t.cap)) + chip("底子 " + n(t.power)) + "</div>"
        + '<div class="small-note" style="margin-top:7px">' + esc(t.blurb || "") + "</div>"
        + "</div>";
    }).join("");
    var custom = '<div class="offer" data-act="mgr" data-v="team:custom">'
      + '<div class="between"><b>自建战队</b>' + chip("3000 万", "gold") + "</div>"
      + '<div class="small-note" style="margin-top:6px">注册资金 3000 万，名单空了重来。工资帽 1600 万，谁都不认识你。</div></div>';
    return wrap(
      head2(sc.kicker, sc.title, "十七支 LPL 队 + 一条野路子")
      + panel((sc.lines || []).map(line).join(""))
      + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(232px,1fr));gap:12px;margin-top:16px">' + teams + custom + "</div>");
  }

  function rDraft(sc) {
    var acts = opts(sc.acts);
    return wrap(
      topBar(sc)
      + head2(sc.kicker, sc.title, "重抽次数 " + n(sc.redraftLeft))
      + panel((sc.lines || []).map(line).join("") + msgs(sc))
      + cardGrid(sc.cards)
      + acts);
  }

  function rLineup(sc) {
    var salary = sc.salary || 0, cap = sc.cap || 0, over = salary > cap;
    var slots = (sc.slots || []).map(function (s) {
      var b = s.card;
      return '<div class="panel flat" style="--rc:' + (b ? esc(b.rc) : "#47526b") + '">'
        + '<div class="between"><b>' + esc(s.poscn) + "</b>" + (b ? chip("评分 " + n(b.ovr), "gold") : chip("空", "red")) + "</div>"
        + '<div class="small-note" style="margin-top:6px">' + (b ? esc(b.name || "无名") + " · " + esc(b.team) + " · 工资 " + wan(b.salary) + (b.injured ? ' · <span style="color:var(--red)">伤停 ' + n(b.injured) + " 场</span>" : "") : "这里没人。") + "</div>"
        + "</div>";
    }).join("");
    var salaryBar = '<div class="between" style="margin-top:12px"><span class="dim">首发工资 ' + wan(salary) + " / 帽 " + wan(cap)
      + '</span><b style="color:' + (over ? "var(--red)" : "var(--green)") + '">' + (over ? "超 " + wan(salary - cap) : "余 " + wan(cap - salary)) + "</b></div>"
      + '<div style="margin-top:6px">' + bar(cap ? salary / cap * 100 : 0, over ? "#ff4d5e" : "#37d67a") + "</div>";
    return wrap(
      topBar(sc)
      + head2(sc.kicker, sc.title, sc.ready ? "五个人齐了" : "还缺人")
      + panel('<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px">' + slots + "</div>" + salaryBar)
      + (sc.lines || []).map(line).join("")
      + cardGrid(sc.cards)
      + opts(sc.acts));
  }

  function rManage(sc) {
    var lineup = (sc.lineup || []).map(miniCard).join(" ");
    var coach = sc.coach
      ? '<div class="between"><b>' + esc(sc.coach.name) + " · " + esc(sc.coach.style) + "</b>" + chip(sc.coach.rar, "purple") + "</div>"
      + '<div class="small-note" style="margin-top:6px">' + esc(sc.coach.eff || "") + "</div>"
      + (sc.coach.desc ? '<div class="small-note" style="margin-top:5px">' + esc(sc.coach.desc) + "</div>" : "")
      : note("教练席空着。没教练就是全队裸奔，团队和心态都少一截。");
    var tacs = (sc.tactics || []).length
      ? (sc.tactics || []).map(function (t) { return chip(t.name, "blue"); }).join(" ")
      : note("一张战术卡都没有。");
    var patch = sc.patch || {};
    return wrap(
      topBar(sc)
      + '<div style="margin-top:14px">' + head2(sc.kicker, sc.title, "") + "</div>"
      + panel((sc.lines || []).map(line).join("") + msgs(sc))
      + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;margin-top:14px">'
      + panel('<div class="kicker">首发五人</div><div class="row wrap" style="gap:6px;margin-top:10px">' + (lineup || chip("没人", "red")) + "</div>", true)
      + panel('<div class="kicker">教练</div><div style="margin-top:10px">' + coach + "</div>", true)
      + panel('<div class="kicker">战术卡 · ' + n((sc.tactics || []).length) + ' 张</div><div class="row wrap" style="gap:6px;margin-top:10px">' + tacs + "</div>", true)
      + panel('<div class="kicker">版本环境 · ' + esc(patch.env || "") + '</div>'
        + '<div class="small-note" style="margin-top:8px">' + esc(patch.envWhy || "") + "</div>"
        + '<div class="row wrap" style="gap:5px;margin-top:8px">'
        + (patch.up || []).map(function (h) { return chip("加强 " + h, "green"); }).join("")
        + (patch.down || []).map(function (h) { return chip("削弱 " + h, "red"); }).join("")
        + "</div>", true)
      + "</div>"
      + opts(sc.acts));
  }

  function rGacha(sc) {
    var pulled = sc.pulled || [];
    var box = pulled.length
      ? '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:14px">'
      + pulled.map(function (p) {
        return '<div class="panel flat" style="--rc:' + esc(p.rc || "#4cc2ff") + ';border-color:' + esc(p.rc || "#4cc2ff") + '">'
          + '<div class="between"><b>' + esc(p.name || "无名") + "</b>" + chip(p.rar, p.rar === "金" ? "gold" : p.rar === "紫" ? "purple" : "blue") + "</div>"
          + '<div class="small-note" style="margin-top:6px">' + esc(p.poscn || "")
          + (p.dup ? ' · <span style="color:var(--red)">重复，折 ' + n(p.back) + " 券</span>" : " · 评分 " + n(p.ovr))
          + "</div></div>";
      }).join("") + "</div>"
      : note("还没抽。券留着也不会生崽。");
    return wrap(
      head2(sc.kicker, sc.title, ["保底计数 " + n(sc.pity) + " / 10", "累计 " + n(sc.goldPity || 0) + " 抽", "卡池 " + esc(sc.roster || "")])
      + panel((sc.lines || []).map(line).join("") + msgs(sc))
      + box
      + opts(sc.acts)
      + '<div class="kicker" style="margin-top:22px">你的队</div>'
      + cardGrid(sc.cards));
  }

  function rTrain(sc) {
    var f = sc.focus;
    var body = f
      ? cardHTML(f) + '<div class="small-note" style="margin-top:10px">点下面的维度，一次 +2。</div>'
      : note("先挑个人。练谁，谁就是你的亲儿子。");
    return wrap(
      head2(sc.kicker, sc.title, "预算 " + wan((sc.head || {}).budget || 0))
      + panel(body)
      + msgs(sc)
      + (f ? "" : cardGrid(sc.cards))
      + opts(sc.acts));
  }

  function rMarket(sc) {
    var offers = (sc.offers || []).map(function (o) {
      var b = o.card;
      return '<div class="offer" style="border-color:' + esc(b.rc) + '">'
        + '<div class="between"><b>' + esc(b.name || "无名") + "</b>" + chip(b.rarn, b.rarity === "金" ? "gold" : b.rarity === "紫" ? "purple" : "blue") + "</div>"
        + '<div class="small-note" style="margin-top:6px">' + esc(b.poscn) + " · " + n(b.year) + " · " + esc(b.team) + " · 评分 " + n(b.ovr) + " · 工资 " + wan(b.salary) + "</div>"
        + '<div class="row wrap" style="gap:5px;margin-top:8px">' + (b.tags || []).map(function (t) { return chip(t); }).join("") + "</div>"
        + '<div class="between" style="margin-top:10px"><span class="dim">身价 ' + wan(o.price) + '</span>'
        + '<button class="btn small' + (o.can ? " primary" : "") + '" data-act="mgr" data-v="buy:' + esc(b.cardId) + '" data-i="0"' + (o.can ? "" : " disabled") + ">签下</button></div>"
        + "</div>";
    }).join("");
    return wrap(
      head2(sc.kicker, sc.title, "预算 " + wan((sc.head || {}).budget || 0))
      + panel((sc.lines || []).map(line).join(""))
      + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;margin-top:14px">' + (offers || note("这一轮没人挂牌。")) + "</div>"
      + msgs(sc)
      + opts(sc.acts));
  }

  function rSell(sc) {
    return wrap(
      head2(sc.kicker, sc.title, "队里 " + n((sc.cards || []).length) + " 人")
      + panel((sc.lines || []).map(line).join("") + msgs(sc))
      + cardGrid(sc.cards)
      + opts(sc.acts));
  }

  function rCoach(sc) {
    var now = sc.now
      ? panel('<div class="kicker">现任</div><div class="between" style="margin-top:8px"><b>' + esc(sc.now.name) + " · " + esc(sc.now.style) + "</b>" + chip(sc.now.rar, "purple") + "</div>"
        + '<div class="small-note" style="margin-top:6px">' + esc(sc.now.eff || "") + "</div>", true)
      : "";
    var offers = (sc.offers || []).map(function (o) {
      return '<div class="offer">'
        + '<div class="between"><b>' + esc(o.coach.name) + "</b>" + chip(o.coach.rar, o.coach.rar === "金色" ? "gold" : "purple") + "</div>"
        + '<div class="small-note" style="margin-top:6px">' + esc(o.coach.style) + " 派 · " + esc(o.coach.eff || "") + "</div>"
        + (o.coach.desc ? '<div class="small-note" style="margin-top:5px">' + esc(o.coach.desc) + "</div>" : "")
        + '<div class="between" style="margin-top:10px"><span class="dim">签字费 ' + wan(o.cost) + '</span>'
        + '<button class="btn small' + (o.can ? " primary" : "") + '" data-act="mgr" data-v="hire:' + esc(o.coach.id) + '" data-i="0"' + (o.can ? "" : " disabled") + ">签</button></div>"
        + "</div>";
    }).join("");
    return wrap(
      head2(sc.kicker, sc.title, "预算 " + wan((sc.head || {}).budget || 0))
      + (now || panel((sc.lines || []).map(line).join("")))
      + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;margin-top:14px">' + offers + "</div>"
      + msgs(sc)
      + opts(sc.acts));
  }

  function rCap(sc) {
    var i = sc.info || {};
    var rows = kv("首发工资", wan(i.sal)) + kv("工资帽", wan(i.cap))
      + kv("超帽", i.over > 0 ? '<span style="color:var(--red)">' + wan(i.over) + "</span>" : "0 万")
      + kv("奢侈税", wan(i.tax)) + kv("本次共出", '<b style="color:' + (i.can ? "var(--gold)" : "var(--red)") + '">' + wan(i.pay) + "</b>")
      + kv("账上余额", wan(i.budget));
    return wrap(
      head2(sc.kicker, sc.title, i.can ? "钱够" : "钱不够")
      + panel(rows + (sc.lines || []).map(line).join(""))
      + msgs(sc)
      + opts(sc.acts));
  }

  function rLeague(sc) {
    var rows = (sc.table || []).map(function (r) {
      var me = r.me;
      return '<div class="between" style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,.055)'
        + (me ? ";background:rgba(232,185,35,.09);border-radius:4px;padding-left:8px;padding-right:8px" : "") + '">'
        + '<span class="dim" style="width:34px;display:inline-block">' + n(r.rank) + "</span>"
        + '<b style="flex:1;' + (me ? "color:var(--gold)" : "") + '">' + esc(r.name) + "</b>"
        + '<span class="dim">' + n(r.w) + " 胜 " + n(r.l) + " 负</span>"
        + (r.top8 ? chip("前八", "green") : "")
        + "</div>";
    }).join("");
    return wrap(
      topBar(sc)
      + '<div style="margin-top:14px">' + head2(sc.kicker, sc.title, "进度 " + n(sc.played) + " / " + n(sc.total) + " 轮") + "</div>"
      + panel((sc.lines || []).map(line).join("") + (sc.note ? note("下一场：" + sc.note) : "") + msgs(sc))
      + panel(rows)
      + opts(sc.acts));
  }

  function rBP(sc) {
    var bans = '<div class="row wrap" style="gap:5px;margin-top:8px">'
      + (sc.myBans || []).map(function (h) { return chip("禁 " + h, "red"); }).join("")
      + (sc.aiBans || []).map(function (h) { return chip("对面禁 " + h, "blue"); }).join("")
      + "</div>";
    var picks = Object.keys(sc.picks || {}).map(function (k) { return chip((POSCN[k] || k) + " " + sc.picks[k], "gold"); }).join(" ");
    var ai = sc.aiPicks
      ? '<div class="small-note" style="margin-top:8px">对面已选：' + esc(POS.join(" ").split(" ").map(function (p) { return sc.aiPicks[p] ? (POSCN[p] + " " + sc.aiPicks[p]) : ""; }).filter(Boolean).join(" · ")) + "</div>"
      : "";
    var patch = sc.patch || {};
    return wrap(
      head2(sc.kicker, sc.title, ["版本环境 " + (sc.env || ""), "战术 " + (sc.tactic ? (function () {
        var t = (sc.tactics || []).filter(function (x) { return x.id === sc.tactic; })[0];
        return t ? t.name : "无";
      })() : "无")])
      + panel((sc.lines || []).map(line).join("") + bans
        + '<div class="row wrap" style="gap:5px;margin-top:8px">' + (picks || '<span class="small-note">还没选人</span>') + "</div>"
        + ai
        + '<div class="small-note" style="margin-top:8px">' + esc(patch.envWhy || "")
        + " " + (patch.up || []).map(function (h) { return "▲" + h; }).join(" ")
        + (patch.down || []).map(function (h) { return "▼" + h; }).join(" ") + "</div>")
      + msgs(sc)
      + opts(sc.acts));
  }

  function rMatch(sc) {
    var m = sc.m || {};
    var games = (m.games || []).map(function (g, i) {
      return '<div class="match-row">'
        + '<span class="res ' + (g.win ? "w" : "l") + '">' + (g.win ? "胜" : "负") + "</span>"
        + '<span class="opp">第 ' + (i + 1) + " 局 · 预测胜率 " + n(g.p) + "%</span>"
        + "</div>";
    }).join("");
    var detail = (m.detail || []).map(function (d) {
      var diff = d.me - d.foe;
      return '<div class="between" style="padding:5px 0">'
        + '<span class="dim" style="width:64px">' + esc(d.cn) + "</span>"
        + '<span style="flex:1;margin:0 8px">' + bar(Math.max(0, Math.min(100, d.me)), "#e8b923") + "</span>"
        + '<b style="width:52px;text-align:right">' + n(d.me) + " / " + n(d.foe) + "</b>"
        + '<span style="width:52px;text-align:right;color:' + (diff > 0 ? "var(--green)" : diff < 0 ? "var(--red)" : "var(--dim)") + '">' + sp(diff) + "</span>"
        + "</div>";
    }).join("");
    var kvs = (m.keyVars || []).map(function (t) {
      return chip(t.k + " " + sp(t.v) + "%", t.tone === "good" ? "green" : "red");
    }).join(" ");
    var heroes = Object.keys(m.myHeroes || {}).map(function (k) {
      return chip((POSCN[k] || k) + " " + m.myHeroes[k], "gold");
    }).join(" ");
    return wrap(
      head2(m.label || "赛后", m.win ? "赢" : "输", (m.w || 0) + " - " + (m.l || 0))
      + panel((sc.lines || []).map(line).join("")
        + (games ? '<div class="match-list" style="margin-top:12px">' + games + "</div>" : "")
        + (m.upset ? note("爆冷。") : "")
        + (kvs ? '<div class="row wrap" style="gap:5px;margin-top:12px">' + kvs + "</div>" : ""))
      + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;margin-top:14px">'
      + panel('<div class="kicker">分维度对比 · 我方 / 对手</div><div style="margin-top:10px">' + (detail || note("没数据。")) + "</div>", true)
      + panel('<div class="kicker">阵容</div><div class="row wrap" style="gap:5px;margin-top:10px">' + (heroes || "") + "</div>"
        + (m.tac && m.tac.name ? '<div class="small-note" style="margin-top:8px">战术：' + esc(m.tac.name) + "（" + esc((m.tac.rows || []).join(" · ") || "无明显加成") + "）</div>" : "")
        + (m.ctr && m.ctr.why ? '<div class="small-note" style="margin-top:6px">克制：' + esc(m.ctr.why) + "</div>" : "")
        + '<div class="small-note" style="margin-top:8px">体力 ' + n(m.formLeft) + " · 心态 " + n(m.moraleLeft) + "</div>", true)
      + "</div>"
      + opts(sc.acts));
  }

  function rPlayoff(sc) {
    var seeds = (sc.seeds || []).map(function (s) {
      return '<div class="between" style="padding:4px 0"><span class="dim">' + n(s.seed) + ' 号种子</span><b style="' + (s.me ? "color:var(--gold)" : "") + '">' + esc(s.name) + "</b></div>";
    }).join("");
    var pairs = (sc.pairs || []).map(function (p) {
      return '<div class="between" style="padding:5px 0;border-bottom:1px solid rgba(255,255,255,.055)">'
        + "<span>" + esc(p.a) + " <span class=\"dim\">对</span> " + esc(p.b) + "</span>"
        + (p.win ? chip(p.win + " 晋级", "gold") : chip("待打", "blue")) + "</div>";
    }).join("");
    var log = (sc.log || []).map(function (x) {
      return '<div class="match-row"><span class="res ' + (x.win ? "w" : "l") + '">' + (x.win ? "胜" : "负") + "</span>"
        + '<span class="opp">' + esc(x.rd) + " · " + esc(x.opp) + "</span></div>";
    }).join("");
    return wrap(
      topBar(sc)
      + '<div style="margin-top:14px">' + head2(sc.kicker, sc.title, "") + "</div>"
      + panel((sc.lines || []).map(line).join("") + msgs(sc))
      + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;margin-top:14px">'
      + panel('<div class="kicker">种子</div><div style="margin-top:8px">' + seeds + "</div>", true)
      + panel('<div class="kicker">本轮对阵</div><div style="margin-top:8px">' + (pairs || note("还没开始。")) + "</div>", true)
      + "</div>"
      + (log ? '<div class="match-list" style="margin-top:14px">' + log + "</div>" : "")
      + opts(sc.acts));
  }

  function rWorlds(sc) {
    function groupHTML(name, rows) {
      return '<div class="kicker">' + esc(name) + "</div><div style=\"margin-top:8px\">"
        + (rows || []).map(function (r) {
          return '<div class="between" style="padding:5px 0' + (r.me ? ";background:rgba(232,185,35,.09);border-radius:4px;padding-left:8px" : "") + '">'
            + '<span class="dim" style="width:26px">' + n(r.rank) + "</span>"
            + '<b style="flex:1;' + (r.me ? "color:var(--gold)" : "") + '">' + esc(r.name) + "</b>"
            + '<span class="dim">' + n(r.w) + " - " + n(r.l) + "</span></div>";
        }).join("") + "</div>";
    }
    var pairs = (sc.pairs || []).map(function (p) {
      return '<div class="between" style="padding:6px 0"><span>' + esc(p.a) + ' <span class="dim">对</span> ' + esc(p.b) + "</span>"
        + (p.win ? chip(p.win, "gold") : chip("待打", "blue")) + "</div>";
    }).join("");
    return wrap(
      topBar(sc)
      + '<div style="margin-top:14px">' + head2(sc.kicker, sc.title, sc.meIn ? "你还在里面" : "你不在里面") + "</div>"
      + panel((sc.lines || []).map(line).join("") + msgs(sc))
      + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;margin-top:14px">'
      + panel(groupHTML("A 组", sc.groupA), true)
      + panel(groupHTML("B 组", sc.groupB), true)
      + "</div>"
      + (pairs ? panel('<div class="kicker">淘汰赛</div><div style="margin-top:8px">' + pairs + "</div>", true) : "")
      + opts(sc.acts));
  }

  function historyTable(list) {
    if (!list || !list.length) return note("什么都没有。");
    return '<div style="margin-top:10px">' + list.map(function (h) {
      return '<div class="between" style="padding:7px 0;border-bottom:1px solid rgba(255,255,255,.055)">'
        + '<span><b>第 ' + n(h.season) + " 年</b> · " + esc(h.team || "") + "</span>"
        + '<span class="dim">' + n(h.reg ? h.reg.w : 0) + " 胜 " + n(h.reg ? h.reg.l : 0) + " 负 · " + esc(h.playoff || "") + " · " + esc(h.worlds || "") + "</span>"
        + '<span>' + chip("评分 " + n(h.ovr)) + (h.trophies ? chip("奖杯 " + n(h.trophies), "gold") : "") + "</span>"
        + "</div>";
    }).join("") + "</div>";
  }

  function rSeason(sc) {
    var o = sc.outcome || {};
    return wrap(
      topBar(sc)
      + '<div style="margin-top:14px">' + head2(sc.kicker, sc.title, "") + "</div>"
      + panel((sc.lines || []).map(line).join("")
        + '<div class="row wrap" style="gap:6px;margin-top:12px">'
        + chip("季后赛 " + (o.po || ""), "blue") + chip("世界赛 " + (o.wd || ""), "purple") + "</div>"
        + historyTable(sc.history))
      + msgs(sc)
      + opts(sc.acts));
  }

  function rResult(sc) {
    var g = sc.grade || {};
    return wrap(
      '<div class="menu-wrap">'
      + '<div class="title-mark">' + kicker(sc.kicker || "") + "<h1>" + esc(g.g || "") + "</h1>"
      + '<div class="sub">' + esc(g.t || "") + "</div>"
      + '<div class="en">总积分 ' + n(sc.score) + " · 奖杯 " + n(sc.cups) + " 座</div></div>"
      + panel((sc.lines || []).map(line).join("") + historyTable(sc.history))
      + opts(sc.acts)
      + "</div>");
  }

  var MAP = {
    mgr_menu: rMenu, mgr_team: rTeam, mgr_draft: rDraft, mgr_lineup: rLineup,
    mgr_manage: rManage, mgr_gacha: rGacha, mgr_train: rTrain, mgr_market: rMarket,
    mgr_sell: rSell, mgr_coach: rCoach, mgr_cap: rCap, mgr_league: rLeague,
    mgr_bp: rBP, mgr_match: rMatch, mgr_playoff: rPlayoff, mgr_worlds: rWorlds,
    mgr_season: rSeason, mgr_result: rResult
  };

  function bodyHTML(scene) {
    var sc = scene;
    if (!sc || !sc.type) {
      try { sc = window.MGR && window.MGR.scene ? window.MGR.scene() : null; } catch (e) { sc = null; }
    }
    if (!sc) return wrap(panel(note("状态丢了。")));
    var fn = MAP[sc.type];
    if (!fn) return wrap(panel(note("没有这个界面：" + sc.type)) + opts(sc.acts));
    var html;
    try { html = fn(sc); } catch (e) {
      html = wrap(panel('<div class="kicker">界面出错</div><div class="small-note" style="margin-top:8px">'
        + esc(String(e && e.message || e)) + "</div>") + opts(sc.acts));
    }
    return html;
  }

  /* 协议：
     - 推荐 onAct(code, el, i)：code 即按钮上的 data-v（也可能是 "team:t_blg" / "buy:xxx" 这类指令串）。
     - 兼容 onAct("mgr", el)：从 el.dataset 读 v / i。
     - 只有当前 MGR 场景是 mgr_* 时才接管，否则返回 false 交给主流程兜底。 */
  function onAct(a, el, i) {
    var code = "", idx = 0;
    if (a === "mgr") {
      if (el && el.dataset) {
        code = el.dataset.v || "";
        idx = el.dataset.i !== undefined && el.dataset.i !== null ? Number(el.dataset.i) : 0;
      }
    } else {
      code = (a === null || a === undefined) ? "" : String(a);
      var ni = Number(i);
      idx = (i === undefined || i === null || isNaN(ni)) ? 0 : ni;
    }
    if (isNaN(idx)) idx = 0;
    if (!code) return false;
    if (code === "mgr-start" || code === "mgr-exit") return false;
    var M = window.MGR;
    if (!M || typeof M.choose !== "function" || typeof M.scene !== "function") return false;
    if (!M.state || !M.state()) return false;
    var sc = M.scene();
    if (!sc || String(sc.type || "").indexOf("mgr_") !== 0) return false;
    try {
      M.choose(idx, code);
    } catch (e) {
      if (window.console && console.error) console.error("[UIMGR]", e);
    }
    return true;
  }

  return { VERSION: "1.0.0", bodyHTML: bodyHTML, onAct: onAct };
})();
