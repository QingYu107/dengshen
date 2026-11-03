/* 《登神》手搓 SVG 美术库 —— 零外部素材 */
(function () {
  const H = {
    hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; },
    rnd(s, n) { const h = H.hash(s); return (h % 1000) / 1000 * n; }
  };

  function logo(team, size) {
    size = size || 64;
    const id = (team && team.logo) || (team && team.id) || "x";
    const c = (team && team.color) || "#e8b923";
    const short = (team && (team.name || team.id || "?")) + "";
    const h = H.hash(id);
    const variant = h % 5;
    const rot = h % 360;
    const dark = "#0b0f14";
    let shape = "";
    if (variant === 0) shape = `<path d="M32 4 L58 16 V40 C58 52 46 58 32 62 C18 58 6 52 6 40 V16 Z"/>`;
    else if (variant === 1) shape = `<circle cx="32" cy="32" r="28"/>`;
    else if (variant === 2) shape = `<path d="M32 3 L59 18 V46 L32 61 L5 46 V18 Z"/>`;
    else if (variant === 3) shape = `<path d="M8 8 H56 V34 C56 50 44 60 32 60 C20 60 8 50 8 34 Z"/>`;
    else shape = `<path d="M32 3 L61 32 L32 61 L3 32 Z"/>`;

    const inner = variant === 1
      ? `<circle cx="32" cy="32" r="21" fill="none" stroke="${c}" stroke-width="2" opacity=".7"/>`
      : `<path d="M32 12 L52 32 L32 52 L12 32 Z" fill="none" stroke="${c}" stroke-width="1.6" opacity=".55"/>`;

    const initial = short.replace(/[^A-Za-z0-9\u4e00-\u9fa5]/g, "").slice(0, 3).toUpperCase();

    return `<svg class="logo-svg" viewBox="0 0 64 64" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" style="--c:${c};transform:rotate(${rot % 12 - 6}deg)">
      <defs><linearGradient id="lg${h}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${c}" stop-opacity=".95"/><stop offset="100%" stop-color="${dark}" stop-opacity=".95"/>
      </linearGradient></defs>
      <g fill="url(#lg${h})" stroke="${c}" stroke-width="1.5">${shape}</g>
      ${inner}
      <text x="32" y="37" text-anchor="middle" font-size="${initial.length > 2 ? 13 : 16}" font-family="Impact,'Arial Black',SimHei,sans-serif" fill="${dark}" font-weight="900" letter-spacing=".5">${initial}</text>
    </svg>`;
  }

  /* 段位/赛事徽记 */
  function emblem(kind, size) {
    size = size || 56;
    const c = { ldl: "#7f8c99", lpl: "#e8b923", msi: "#3fa9f5", worlds: "#d33a3a" }[kind] || "#e8b923";
    const label = { ldl: "LDL", lpl: "LPL", msi: "MSI", worlds: "WORLDS" }[kind] || "?";
    return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs><radialGradient id="eg${kind}"><stop offset="0%" stop-color="${c}" stop-opacity=".55"/><stop offset="100%" stop-color="${c}" stop-opacity=".05"/></radialGradient></defs>
      <circle cx="32" cy="32" r="30" fill="url(#eg${kind})" stroke="${c}" stroke-width="1.5"/>
      <circle cx="32" cy="32" r="24" fill="none" stroke="${c}" stroke-width=".7" stroke-dasharray="2 4" opacity=".8"/>
      <path d="M32 14 L36 26 L48 30 L36 34 L32 46 L28 34 L16 30 L28 26 Z" fill="${c}" opacity=".85"/>
      <text x="32" y="56" text-anchor="middle" font-size="8" font-family="SimHei,sans-serif" fill="${c}" letter-spacing="1">${label}</text>
    </svg>`;
  }

  /* 位置图标 */
  function posIcon(pos, size) {
    size = size || 28;
    const p = {
      TOP: `<path d="M24 4 L24 44 M24 44 L16 36 M24 44 L32 36" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M10 14 H38" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>`,
      JUG: `<path d="M24 6 C12 16 10 30 18 40 C21 44 27 44 30 40 C38 30 36 16 24 6 Z" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M24 16 V38" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
      MID: `<path d="M24 5 L29 19 L43 24 L29 29 L24 43 L19 29 L5 24 L19 19 Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>`,
      BOT: `<path d="M28 8 L10 40 M28 8 L36 22" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="28" cy="26" r="3" fill="currentColor"/><path d="M32 18 L42 30" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
      SUP: `<path d="M24 5 L40 11 V26 C40 36 32 41 24 44 C16 41 8 36 8 26 V11 Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/><path d="M24 16 V33 M16 24 H32" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>`
    }[pos] || "";
    return `<svg viewBox="0 0 48 48" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">${p}</svg>`;
  }

  /* 英雄简笔图标：按名字哈希生成几何纹章 */
  function champIcon(name, size) {
    size = size || 40;
    const h = H.hash(name);
    const hue = h % 360;
    const c1 = `hsl(${hue},70%,58%)`, c2 = `hsl(${(hue + 40) % 360},75%,42%)`;
    const seed = (n) => ((h >> n) & 15) / 15;
    const type = h % 4;
    let inner = "";
    if (type === 0) inner = `<path d="M20 8 L30 20 L24 32 L14 24 Z" fill="${c1}" opacity=".9"/><circle cx="20" cy="20" r="4" fill="#07090c"/>`;
    else if (type === 1) inner = `<circle cx="20" cy="20" r="10" fill="none" stroke="${c1}" stroke-width="3"/><path d="M20 6 V34" stroke="${c2}" stroke-width="2.5"/><circle cx="20" cy="20" r="3" fill="${c1}"/>`;
    else if (type === 2) inner = `<path d="M8 28 L20 8 L32 28 Z" fill="none" stroke="${c1}" stroke-width="3"/><circle cx="20" cy="22" r="3.5" fill="${c2}"/>`;
    else inner = `<path d="M10 12 Q20 4 30 12 Q36 20 30 28 Q20 36 10 28 Q4 20 10 12 Z" fill="none" stroke="${c1}" stroke-width="2.6"/><circle cx="20" cy="20" r="2.5" fill="${c2}"/>`;
    const spikes = type === 0 ? 3 : 6;
    let marks = "";
    for (let i = 0; i < spikes; i++) {
      const a = seed(i + 1) * Math.PI * 2, r1 = 13 + seed(i + 3) * 3, r2 = 17;
      marks += `<line x1="${20 + Math.cos(a) * r1}" y1="${20 + Math.sin(a) * r1}" x2="${20 + Math.cos(a) * r2}" y2="${20 + Math.sin(a) * r2}" stroke="${c1}" stroke-width="1.2" opacity=".55"/>`;
    }
    return `<svg viewBox="0 0 40 40" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="38" height="38" rx="7" fill="#0d131a" stroke="${c2}" stroke-width="1.2"/>${marks}${inner}</svg>`;
  }

  /* 雷达图 */
  function radar(st, size) {
    size = size || 220;
    const keys = ["LANE", "MECH", "GAME", "POOL", "MENTAL", "PHYS", "TEAM", "FAME"];
    const cn = { LANE: "对线", MECH: "操作", GAME: "意识", POOL: "英雄池", MENTAL: "心态", PHYS: "体能", TEAM: "团队", FAME: "名气" };
    const cx = 50, cy = 50, R = 36;
    const pt = (i, r) => { const a = -Math.PI / 2 + i * Math.PI * 2 / keys.length; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
    let grid = "";
    [0.25, 0.5, 0.75, 1].forEach(k => {
      const pts = keys.map((_, i) => pt(i, R * k).join(",")).join(" ");
      grid += `<polygon points="${pts}" fill="none" stroke="#2a3542" stroke-width="0.5"/>`;
    });
    let axes = "", labels = "";
    keys.forEach((k, i) => {
      const [x, y] = pt(i, R); axes += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#2a3542" stroke-width="0.5"/>`;
      const [lx, ly] = pt(i, R + 9.5);
      labels += `<text x="${lx}" y="${ly + 1.4}" font-size="4.6" fill="#93a8be" text-anchor="middle" font-family="SimHei,sans-serif">${cn[k]}</text>`;
      labels += `<text x="${lx}" y="${ly + 5.2}" font-size="3.6" fill="#e8b923" text-anchor="middle" font-family="Consolas,monospace">${Math.round(st[k])}</text>`;
    });
    const poly = keys.map((k, i) => pt(i, R * Math.max(.06, st[k] / 100)).join(",")).join(" ");
    return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs><radialGradient id="rg"><stop offset="0%" stop-color="#e8b923" stop-opacity=".42"/><stop offset="100%" stop-color="#e8b923" stop-opacity=".08"/></radialGradient></defs>
      ${grid}${axes}
      <polygon points="${poly}" fill="url(#rg)" stroke="#e8b923" stroke-width="0.9" stroke-linejoin="round"/>
      ${keys.map((k, i) => { const [x, y] = pt(i, R * Math.max(.06, st[k] / 100)); return `<circle cx="${x}" cy="${y}" r="1" fill="#fff8dc"/>`; }).join("")}
      ${labels}
    </svg>`;
  }

  /* 选手卡头像：几何抽象 */
  function avatar(seed, color, size) {
    size = size || 72;
    const h = H.hash(seed || "x"), c = color || "#e8b923";
    const a = h % 360;
    return `<svg viewBox="0 0 72 72" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="av${h}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="hsl(${a},55%,30%)"/><stop offset="100%" stop-color="#0b0f14"/></linearGradient></defs>
      <rect width="72" height="72" rx="10" fill="url(#av${h})"/>
      <circle cx="36" cy="28" r="12" fill="none" stroke="${c}" stroke-width="2"/>
      <path d="M14 66 Q18 44 36 44 Q54 44 58 66" fill="none" stroke="${c}" stroke-width="2"/>
      <path d="M36 8 L38 14 L44 16 L38 18 L36 24 L34 18 L28 16 L34 14 Z" fill="${c}" opacity=".8"/>
    </svg>`;
  }

  /* 奖杯 */
  function trophy(kind, size) {
    size = size || 64;
    const c = { worlds: "#e8b923", msi: "#3fa9f5", lpl: "#d33a3a", none: "#5a6878" }[kind] || "#5a6878";
    return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 8 H44 V22 C44 32 38 38 32 38 C26 38 20 32 20 22 Z" fill="none" stroke="${c}" stroke-width="2.6"/>
      <path d="M20 12 H12 V18 C12 24 16 26 20 26" fill="none" stroke="${c}" stroke-width="2.2"/>
      <path d="M44 12 H52 V18 C52 24 48 26 44 26" fill="none" stroke="${c}" stroke-width="2.2"/>
      <path d="M32 38 V48 M22 56 H42 M26 48 H38" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M32 14 L34 20 L40 21 L34 23 L32 29 L30 23 L24 21 L30 20 Z" fill="${c}"/>
    </svg>`;
  }

    /* 界面小图标（手搓，不用外部素材，也不靠 emoji 撑场） */
  function glyph(kind, size) {
    size = size || 17;
    const P = {
      energy: '<path d="M13 2 L5 14 H11 L9 22 L19 9 H12 Z" fill="currentColor"/>',
      mental: '<path d="M12 3 A9 9 0 1 0 21 12 H12 Z" fill="currentColor" opacity=".55"/><path d="M12 3 A9 9 0 0 1 21 12 H12 Z" fill="currentColor"/>',
      fire: '<path d="M12 2 C16 7 20 9 20 14 A8 8 0 0 1 4 14 C4 10 8 8 9 4 C10 7 12 8 12 8 Z" fill="currentColor"/>',
      flag: '<path d="M5 3 V21 M5 4 H18 L15 9 L18 14 H5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
      voice: '<path d="M12 3 A3 3 0 0 1 15 6 V12 A3 3 0 0 1 9 12 V6 A3 3 0 0 1 12 3 Z" fill="currentColor"/><path d="M6 11 A6 6 0 0 0 18 11 M12 17 V21" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
      money: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7 V17 M9 10 H15 M9 14 H15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
      bar: '<path d="M4 5 H20 V15 H13 L9 19 V15 H4 Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 9 H16 M8 12 H13" stroke="currentColor" stroke-width="1.4"/>',
      deck: '<rect x="3" y="6" width="10" height="14" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.7"/><rect x="9" y="4" width="10" height="14" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.7"/>',
      shop: '<path d="M5 8 H19 L17 21 H7 Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 8 A3 3 0 0 1 15 8" fill="none" stroke="currentColor" stroke-width="1.8"/>',
      trophy: '<path d="M7 4 H17 V10 A5 5 0 0 1 7 10 Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M7 6 H4 V8 A3 3 0 0 0 7 10 M17 6 H20 V8 A3 3 0 0 1 17 10 M12 15 V19 M8 21 H16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>'
    };
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" class="gly" aria-hidden="true">${P[kind] || P.bar}</svg>`;
  }

  /* ================= 位图素材层（assets/*.webp，缺图回退旧 SVG） =================
   * 素材来自自有生成图，已去水印、按类型统一尺寸并压成 webp。
   * 路径统一走 assets/<类>/<名>.webp，页面在仓库根目录，preview.html 也一样。
   */
  const ASSET = "assets/";
  function assetUrl(rel) { return ASSET + rel; }

  /* 战队徽章：八枚按哈希分给各队，队伍主色用 CSS 混合叠一层 */
  const CRESTS = ["dragon", "wolf", "eagle", "tiger", "star", "flame", "ice", "shield"];
  function crestImg(key, size, color) {
    size = size || 44;
    const h = H.hash("crest:" + String(key == null ? "x" : key));
    const name = CRESTS[h % CRESTS.length];
    const c = color || "#e8b923";
    return `<span class="crest-wrap" style="width:${size}px;height:${size}px;--tc:${c}"><img class="crest-img" src="${assetUrl("crests/" + name + ".webp")}" width="${size}" height="${size}" alt="" loading="lazy" decoding="async" onerror="this.style.visibility='hidden'"><span class="crest-tint"></span></span>`;
  }

  /* 队标：有徽章素材就用素材，不再画手搓形状 */
  function bmpLogo(team, size) {
    size = size || 64;
    const key = (team && (team.logo || team.id || team.name)) || "x";
    return crestImg(key, size, (team && team.color) || "#e8b923");
  }

  /* 头像：按位置/身份挑素材，同一个 seed 永远同一张 */
  function bmpAvatar(seed, color, size) {
    size = size || 72;
    const s = String(seed == null ? "x" : seed);
    let f;
    if (/(COACH|教练|经理)$/i.test(s)) f = "coach";
    else if (/JUG$/i.test(s)) f = "jungle";
    else if (/SUP$/i.test(s)) f = "support";
    else f = ["rookie", "veteran", "star"][H.hash("av:" + s) % 3];
    const sun = 0.5; /* 人物眼睛基准线偏上，圆形裁切时往上挪一点 */
    return `<span class="av-wrap" style="width:${size}px;height:${size}px;--ac:${color || "#e8b923"}"><img class="av-photo" src="${assetUrl("avatars/" + f + ".webp")}" width="${size}" height="${size}" alt="" style="object-position:50% ${sun * 100}%" onerror="this.style.visibility='hidden'"><span class="av-ring"></span></span>`;
  }

  /* 场景背景：按场景类型挑一张，弱化后铺在最底层 */
  function sceneBg(scene, ctx) {
    const el = document.getElementById("bgPhoto");
    if (!el) return "";
    const s = String(scene || "");
    const st = (ctx && ctx.S) || null;
    let name = "";
    if (/^mgr/.test(s)) name = /market|sell|draft/.test(s) ? "mgr_market" : (/train/.test(s) ? "mgr_training" : "mgr_office");
    else if (/^(menu|create|hall|slots|codex|load)/.test(s)) name = "menu";
    else if (s === "bp") name = "bp";
    else if (/^ending/.test(s)) name = "ending";
    else if (/worlds|swiss/i.test(s)) name = "worlds";
    else if (/playoff|msi|firststand|final/i.test(s)) name = "playoff";
    else if (/^(action|monthend|shop|gacha|draw|deck|transfer|retire|standings|forum|bar|talk|voice|event|bigevent|patch|prep|highlight|result|matchday|duel|inGame|boGame|skipOffer|moment|series|scrim|ldl|demacia)/.test(s)) name = (st && st.stage === "LDL") ? "ldl" : "lpl";
    if (!name) { el.classList.remove("on"); el.style.backgroundImage = ""; el.dataset.bg = ""; return ""; }
    const url = assetUrl("bg/" + name + ".webp");
    if (el.dataset.bg !== url) { el.dataset.bg = url; el.style.backgroundImage = "url('" + url + "')"; }
    el.classList.add("on");
    return url;
  }

  /* 结局插画：按结局名/评级挑图 */
  function endingArt(s) {
    const e = (s && s.end) || s || {};
    const nm = String(e.name || ""), rk = String(e.rank || "");
    if (/登神|无冕之王/.test(nm) || /^S/.test(rk)) return assetUrl("ending/worlds.webp");
    if (/人间理想/.test(nm) || /^A\+/.test(rk)) return assetUrl("ending/worlds.webp");
    if (/国内霸主|一冠封神/.test(nm) || /^A/.test(rk)) return assetUrl("ending/league.webp");
    if (/出国留学/.test(nm)) return assetUrl("ending/intl.webp");
    if (/干净的人|债务缠身/.test(nm)) return assetUrl("ending/intl.webp");
    if (/名人堂/.test(nm)) return assetUrl("ending/hof.webp");
    return assetUrl("ending/retire.webp");
  }

  /* 卡面插画：七种流派各一张 */
  const CARDS = ["attack", "control", "teamfight", "mental", "money", "jungle", "split"];
  function cardArt(build, seed) {
    let k = String(build || "");
    if (CARDS.indexOf(k) < 0) k = CARDS[H.hash("card:" + String(seed || "x")) % CARDS.length];
    return assetUrl("cards/" + k + ".webp");
  }

  /* 编年史年份插画：只给有素材的 6 个年份 */
  const ARCHIVE_YEARS = [2011, 2013, 2017, 2018, 2021, 2024];
  function archiveArt(year) {
    const y = parseInt(String(year), 10);
    if (!isFinite(y)) return "";
    /* 素材只有 6 个年份：取不晚于该年的最近一张，2025 之后落到最新一张，保证每行都有图且年代大致对得上 */
    let pickYear = ARCHIVE_YEARS[0];
    for (let i = 0; i < ARCHIVE_YEARS.length; i++) if (ARCHIVE_YEARS[i] <= y) pickYear = ARCHIVE_YEARS[i];
    if (y < ARCHIVE_YEARS[0]) pickYear = ARCHIVE_YEARS[0];
    return assetUrl("archive/" + pickYear + ".webp");
  }

  window.ART = {
    logo: bmpLogo, emblem, posIcon, champIcon, radar, avatar: bmpAvatar, trophy, glyph, hash: H.hash,
    crest: crestImg, sceneBg, endingArt, cardArt, archiveArt, assetUrl
  };
})();
