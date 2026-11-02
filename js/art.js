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

  window.ART = { logo, emblem, posIcon, champIcon, radar, avatar, trophy, hash: H.hash };
})();
