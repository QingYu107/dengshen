/* 《登神》斗蛐蛐模式 · 选手卡元数据（新增文件，不改任何已有数据）
   导出：
     window.DATA_CARD_META      = { "<选手卡 id>": { ... }, "<选手 id>": { ... } }
       { id, pid, name, cn, pos, year, ovr, salary, team, teamName, region, rarity,
         pool:[5 个英雄名], sig:[2 个本命英雄], tilt:{farm,greed,tempo,teamfight,mental}, bond:[羁绊 id], star:bool }
     window.DATA_CARD_BONDS     = [ { id, name, need, desc, eff:{lanes,teamfight,resource,tempo,mental,greed,farm} } ]
       最小羁绊表。若将来有 window.DATA_BONDS / window.DATA_CARD_BONDS 正式数据，斗蛐蛐优先用正式的，缺的用这份补。
   数据来源：window.DATA_MGR.cards（165 张）、window.DATA_HEROES（72 个英雄）、window.DATA_TEAMS。
   规则：明星手写英雄池/本命/倾向；其余按位置 + 卡面标签确定性生成（同一张卡每次生成结果一致）。
*/
(function () {
  "use strict";

  var HEROES = window.DATA_HEROES || [];
  var CARDS = (window.DATA_MGR && window.DATA_MGR.cards) || [];
  var TEAMS = window.DATA_TEAMS || {};
  var POS = ["TOP", "JUG", "MID", "BOT", "SUP"];

  /* ---------- 确定性工具 ---------- */
  function hash(str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h >>> 0;
  }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function rint(key, a, b) { return a + (hash(key) % (b - a + 1)); }

  var HERO_BY_NAME = {};
  HEROES.forEach(function (h) { HERO_BY_NAME[h.n] = h; });

  var HERO_BY_POS = {};
  HEROES.forEach(function (h) {
    (h.pos || []).forEach(function (p) {
      if (!HERO_BY_POS[p]) HERO_BY_POS[p] = [];
      HERO_BY_POS[p].push(h.n);
    });
  });

  /* 卡面标签 → 英雄打法标签 的关键词映射（用于给没有英雄标签的卡生成英雄池） */
  var TAG_MAP = {
    "对线": ["对线"], "压制": ["压制", "对线"], "激进": ["入侵", "节奏"], "入侵": ["入侵"],
    "绝食": ["入侵", "节奏"], "四保一": ["后期", "团战"], "后期": ["后期"], "团战": ["团战"],
    "开团": ["开团"], "单带": ["单带"], "运营": ["运营"], "指挥": ["运营", "视野"],
    "视野": ["视野"], "节奏": ["节奏"], "操作": ["操作"], "秀": ["秀", "操作"],
    "发育": ["发育"], "混": ["混", "坦克"], "坦克": ["坦克"], "老将": ["运营"],
    "稳定": ["团战", "运营"], "大心脏": ["团战"], "输出": ["团战", "后期"],
    "收割": ["团战", "后期"], "游走": ["节奏", "视野"], "抗压": ["坦克", "运营"],
    "摇摆": ["对线", "团战"], "绝活": ["操作", "对线"], "带线": ["单带"],
    "抓机会": ["节奏", "入侵"], "指挥型": ["运营", "视野"], "保护": ["视野", "团战"],
    "双C": ["团战", "后期"], "野核": ["入侵", "节奏"], "节奏型": ["节奏"]
  };

  function tagAffinity(card, hero) {
    var tags = card.tags || [];
    var htags = hero.tag || [];
    var score = 0;
    for (var i = 0; i < tags.length; i++) {
      var t = String(tags[i]);
      for (var key in TAG_MAP) {
        if (t.indexOf(key) >= 0 || key.indexOf(t) >= 0) {
          var wants = TAG_MAP[key];
          for (var j = 0; j < wants.length; j++) {
            if (htags.indexOf(wants[j]) >= 0) score += 3 - j;
          }
        }
      }
    }
    return score;
  }

  /* ---------- 明星手写表（按选手 pid；覆盖所有年份版本） ---------- */
  var STARS = {
    p_uzi: { pool: ["卡莎", "薇恩", "德莱文", "伊泽瑞尔", "霞"], sig: ["卡莎", "薇恩"], tilt: { farm: 88, greed: 74, tempo: 70, teamfight: 86, mental: 56 } },
    p_clearlove: { pool: ["盲僧", "猪妹", "大树", "赵信", "男枪"], sig: ["盲僧", "猪妹"], tilt: { farm: 80, greed: 52, tempo: 84, teamfight: 70, mental: 84 } },
    p_rookie: { pool: ["妖姬", "辛德拉", "沙皇", "发条", "阿狸"], sig: ["妖姬", "辛德拉"], tilt: { farm: 80, greed: 64, tempo: 86, teamfight: 80, mental: 72 } },
    p_theshy: { pool: ["剑姬", "瑞雯", "杰斯", "凯南", "格温"], sig: ["剑姬", "瑞雯"], tilt: { farm: 60, greed: 90, tempo: 58, teamfight: 66, mental: 52 } },
    p_jackeylove: { pool: ["卡莎", "德莱文", "霞", "伊泽瑞尔", "维鲁斯"], sig: ["卡莎", "德莱文"], tilt: { farm: 78, greed: 82, tempo: 72, teamfight: 82, mental: 46 } },
    p_ning: { pool: ["青钢影", "盲僧", "男枪", "蔚", "赵信"], sig: ["青钢影", "盲僧"], tilt: { farm: 64, greed: 86, tempo: 82, teamfight: 78, mental: 60 } },
    p_baolan: { pool: ["洛", "牛头", "布隆", "锤石", "蕾欧娜"], sig: ["洛", "牛头"], tilt: { farm: 56, greed: 46, tempo: 70, teamfight: 82, mental: 62 } },
    p_xiaohu: { pool: ["瑞兹", "阿卡丽", "格温", "杰斯", "沙皇"], sig: ["瑞兹", "阿卡丽"], tilt: { farm: 82, greed: 58, tempo: 80, teamfight: 82, mental: 72 } },
    p_letme: { pool: ["奥恩", "蒙多", "纳尔", "剑魔", "鳄鱼"], sig: ["奥恩", "蒙多"], tilt: { farm: 74, greed: 40, tempo: 66, teamfight: 84, mental: 78 } },
    p_mlxg: { pool: ["盲僧", "千珏", "男枪", "豹女", "蜘蛛"], sig: ["盲僧", "豹女"], tilt: { farm: 56, greed: 92, tempo: 88, teamfight: 70, mental: 56 } },
    p_doinb: { pool: ["瑞兹", "加里奥", "卡尔玛", "卡牌", "塞拉斯"], sig: ["瑞兹", "加里奥"], tilt: { farm: 70, greed: 56, tempo: 92, teamfight: 88, mental: 86 } },
    p_tian: { pool: ["盲僧", "男枪", "蔚", "赵信", "佛耶戈"], sig: ["盲僧", "男枪"], tilt: { farm: 68, greed: 78, tempo: 90, teamfight: 80, mental: 58 } },
    p_crisp: { pool: ["锤石", "洛", "牛头", "派克", "蕾欧娜"], sig: ["锤石", "洛"], tilt: { farm: 58, greed: 60, tempo: 80, teamfight: 84, mental: 70 } },
    p_lwx: { pool: ["卡莎", "霞", "伊泽瑞尔", "小炮", "维鲁斯"], sig: ["卡莎", "霞"], tilt: { farm: 80, greed: 66, tempo: 74, teamfight: 80, mental: 66 } },
    p_bin: { pool: ["剑姬", "杰斯", "贾克斯", "格温", "船长"], sig: ["剑姬", "杰斯"], tilt: { farm: 66, greed: 84, tempo: 60, teamfight: 64, mental: 62 } },
    p_knight: { pool: ["辛德拉", "阿卡丽", "沙皇", "发条", "佐伊"], sig: ["辛德拉", "阿卡丽"], tilt: { farm: 82, greed: 64, tempo: 82, teamfight: 74, mental: 58 } },
    p_369: { pool: ["奥恩", "杰斯", "剑魔", "纳尔", "奎桑提"], sig: ["奥恩", "杰斯"], tilt: { farm: 76, greed: 52, tempo: 66, teamfight: 78, mental: 54 } },
    p_elk: { pool: ["卡莎", "厄斐琉斯", "金克丝", "霞", "泽丽"], sig: ["卡莎", "厄斐琉斯"], tilt: { farm: 84, greed: 70, tempo: 76, teamfight: 82, mental: 64 } },
    p_on: { pool: ["洛", "锤石", "瑞尔", "布隆", "牛头"], sig: ["洛", "锤石"], tilt: { farm: 56, greed: 70, tempo: 78, teamfight: 80, mental: 56 } },
    p_kanavi: { pool: ["盲僧", "男枪", "蔚", "佛耶戈", "千珏"], sig: ["盲僧", "男枪"], tilt: { farm: 80, greed: 76, tempo: 86, teamfight: 78, mental: 60 } },
    p_yagao: { pool: ["沙皇", "发条", "辛德拉", "瑞兹", "妖姬"], sig: ["沙皇", "发条"], tilt: { farm: 78, greed: 56, tempo: 78, teamfight: 76, mental: 70 } },
    p_ruler: { pool: ["卡莎", "薇恩", "伊泽瑞尔", "霞", "泽丽"], sig: ["卡莎", "薇恩"], tilt: { farm: 88, greed: 64, tempo: 74, teamfight: 86, mental: 78 } },
    p_missing: { pool: ["洛", "锤石", "牛头", "布隆", "娜美"], sig: ["洛", "锤石"], tilt: { farm: 54, greed: 48, tempo: 74, teamfight: 82, mental: 74 } },
    p_flandre: { pool: ["船长", "剑姬", "格温", "杰斯", "奥恩"], sig: ["船长", "剑姬"], tilt: { farm: 80, greed: 66, tempo: 70, teamfight: 78, mental: 72 } },
    p_jiejie: { pool: ["盲僧", "赵信", "男枪", "猪妹", "蔚"], sig: ["盲僧", "赵信"], tilt: { farm: 74, greed: 70, tempo: 84, teamfight: 78, mental: 70 } },
    p_meiko: { pool: ["洛", "锤石", "牛头", "布隆", "蕾欧娜"], sig: ["洛", "锤石"], tilt: { farm: 60, greed: 54, tempo: 82, teamfight: 86, mental: 76 } },
    p_scout: { pool: ["妖姬", "辛德拉", "沙皇", "佐伊", "塞拉斯"], sig: ["妖姬", "辛德拉"], tilt: { farm: 84, greed: 62, tempo: 80, teamfight: 78, mental: 70 } },
    p_viper: { pool: ["卡莎", "霞", "伊泽瑞尔", "厄斐琉斯", "泽丽"], sig: ["卡莎", "霞"], tilt: { farm: 86, greed: 68, tempo: 76, teamfight: 84, mental: 76 } },
    p_gala: { pool: ["卡莎", "厄斐琉斯", "金克丝", "霞", "小炮"], sig: ["卡莎", "厄斐琉斯"], tilt: { farm: 86, greed: 66, tempo: 72, teamfight: 84, mental: 74 } },
    p_wei: { pool: ["盲僧", "男枪", "蔚", "赵信", "佛耶戈"], sig: ["盲僧", "男枪"], tilt: { farm: 72, greed: 68, tempo: 84, teamfight: 76, mental: 70 } },
    p_faker: { pool: ["妖姬", "辛德拉", "沙皇", "发条", "瑞兹"], sig: ["妖姬", "辛德拉"], tilt: { farm: 86, greed: 58, tempo: 88, teamfight: 88, mental: 92 } },
    p_zeus: { pool: ["剑姬", "杰斯", "剑魔", "格温", "永恩"], sig: ["剑姬", "杰斯"], tilt: { farm: 78, greed: 76, tempo: 70, teamfight: 80, mental: 74 } },
    p_oner: { pool: ["盲僧", "蔚", "赵信", "千珏", "佛耶戈"], sig: ["盲僧", "蔚"], tilt: { farm: 76, greed: 74, tempo: 86, teamfight: 80, mental: 70 } },
    p_gumayusi: { pool: ["卡莎", "厄斐琉斯", "金克丝", "霞", "维鲁斯"], sig: ["卡莎", "厄斐琉斯"], tilt: { farm: 86, greed: 72, tempo: 76, teamfight: 86, mental: 72 } },
    p_keria: { pool: ["洛", "锤石", "牛头", "巴德", "娜美"], sig: ["洛", "锤石"], tilt: { farm: 62, greed: 64, tempo: 86, teamfight: 86, mental: 76 } },
    p_chovy: { pool: ["沙皇", "发条", "辛德拉", "佐伊", "阿狸"], sig: ["沙皇", "发条"], tilt: { farm: 92, greed: 46, tempo: 82, teamfight: 78, mental: 64 } },
    p_canyon: { pool: ["盲僧", "男枪", "千珏", "豹女", "佛耶戈"], sig: ["盲僧", "男枪"], tilt: { farm: 84, greed: 72, tempo: 88, teamfight: 80, mental: 70 } },
    p_showmaker: { pool: ["辛德拉", "佐伊", "妖姬", "沙皇", "阿狸"], sig: ["辛德拉", "佐伊"], tilt: { farm: 82, greed: 62, tempo: 86, teamfight: 82, mental: 78 } },
    p_deft: { pool: ["卡莎", "薇恩", "伊泽瑞尔", "霞", "泽丽"], sig: ["卡莎", "薇恩"], tilt: { farm: 88, greed: 60, tempo: 78, teamfight: 84, mental: 80 } },
    p_beryl: { pool: ["巴德", "派克", "锤石", "洛", "莫甘娜"], sig: ["巴德", "派克"], tilt: { farm: 58, greed: 60, tempo: 88, teamfight: 82, mental: 84 } },
    p_nuguri: { pool: ["剑姬", "杰斯", "凯南", "格温", "纳尔"], sig: ["剑姬", "杰斯"], tilt: { farm: 76, greed: 78, tempo: 70, teamfight: 80, mental: 66 } },
    p_smeb: { pool: ["剑姬", "兰博", "凯南", "船长", "杰斯"], sig: ["剑姬", "兰博"], tilt: { farm: 78, greed: 74, tempo: 72, teamfight: 80, mental: 70 } },
    p_mata: { pool: ["锤石", "牛头", "布隆", "娜美", "巴德"], sig: ["锤石", "牛头"], tilt: { farm: 60, greed: 50, tempo: 84, teamfight: 84, mental: 86 } },
    p_caps: { pool: ["妖姬", "辛德拉", "佐伊", "塞拉斯", "阿卡丽"], sig: ["妖姬", "辛德拉"], tilt: { farm: 78, greed: 72, tempo: 86, teamfight: 80, mental: 70 } },
    p_perkz: { pool: ["妖姬", "霞", "卡莎", "辛德拉", "伊泽瑞尔"], sig: ["妖姬", "霞"], tilt: { farm: 80, greed: 74, tempo: 82, teamfight: 80, mental: 72 } },
    p_rekkles: { pool: ["卡莎", "薇恩", "伊泽瑞尔", "小炮", "霞"], sig: ["卡莎", "薇恩"], tilt: { farm: 86, greed: 58, tempo: 72, teamfight: 80, mental: 66 } },
    p_jankos: { pool: ["盲僧", "男枪", "豹女", "千珏", "蔚"], sig: ["盲僧", "男枪"], tilt: { farm: 72, greed: 76, tempo: 86, teamfight: 76, mental: 74 } },
    p_wunder: { pool: ["剑姬", "杰斯", "纳尔", "凯南", "格温"], sig: ["剑姬", "杰斯"], tilt: { farm: 76, greed: 70, tempo: 70, teamfight: 74, mental: 68 } },
    p_mikyx: { pool: ["锤石", "洛", "牛头", "派克", "巴德"], sig: ["锤石", "洛"], tilt: { farm: 58, greed: 62, tempo: 84, teamfight: 80, mental: 72 } },
    p_elyoya: { pool: ["盲僧", "男枪", "蔚", "赵信", "佛耶戈"], sig: ["盲僧", "男枪"], tilt: { farm: 74, greed: 72, tempo: 84, teamfight: 76, mental: 70 } },
    p_humanoid: { pool: ["辛德拉", "妖姬", "沙皇", "发条", "阿狸"], sig: ["辛德拉", "妖姬"], tilt: { farm: 82, greed: 62, tempo: 80, teamfight: 76, mental: 68 } },
    p_caliste: { pool: ["卡莎", "霞", "伊泽瑞尔", "泽丽", "金克丝"], sig: ["卡莎", "霞"], tilt: { farm: 84, greed: 66, tempo: 74, teamfight: 80, mental: 70 } },
    p_hanssama: { pool: ["卡莎", "霞", "伊泽瑞尔", "小炮", "维鲁斯"], sig: ["卡莎", "霞"], tilt: { farm: 84, greed: 64, tempo: 74, teamfight: 80, mental: 66 } }
  };

  /* ---------- 羁绊表（最小兜底） ---------- */
  var BONDS = [];

  var TEAM_BONDS = {
    t_ig: { id: "bond_ig", name: "仁川三叉戟", need: 3, desc: "IG 2018 冠军班底：三人成军，团战敢冲敢接。", eff: { teamfight: 2.2, greed: 1.5 } },
    t_fpx: { id: "bond_fpx", name: "巴黎人", need: 3, desc: "FPX 2019 冠军班底：中野辅连成一张网。", eff: { tempo: 2.2, teamfight: 1.2 } },
    t_edg: { id: "bond_edg", name: "冰岛奇迹", need: 3, desc: "EDG 2021 冠军班底：资源运营滴水不漏。", eff: { resource: 2.0, teamfight: 1.5 } },
    t_rng: { id: "bond_rng", name: "皇族血脉", need: 3, desc: "RNG 的老底子：四保一与下路压制。", eff: { lanes: 1.2, resource: 1.5 } },
    t_t1: { id: "bond_t1", name: "T1 王朝", need: 3, desc: "SKT/T1 的传承：团战执行力和大赛心脏。", eff: { teamfight: 2.0, tempo: 1.5 } },
    t_gen: { id: "bond_gen", name: "三星血脉", need: 3, desc: "三星/GenG 的体系：视野与资源控制。", eff: { resource: 2.2, lanes: 1.0 } },
    t_g2: { id: "bond_g2", name: "欧洲之王", need: 3, desc: "G2 的快乐与套路：节奏一起来谁都拦不住。", eff: { tempo: 2.0, mental: 1.5 } },
    t_fnc: { id: "bond_fnc", name: "老牌欧洲", need: 3, desc: "Fnatic 的老牌底蕴：对线稳、运营老。", eff: { lanes: 1.6, resource: 1.2 } },
    t_jdg: { id: "bond_jdg", name: "京东帝国", need: 3, desc: "JDG 的金元战舰：资源拉满。", eff: { resource: 2.0, teamfight: 1.2 } },
    t_blg: { id: "bond_blg", name: "哔哩哔哩", need: 3, desc: "BLG 的青年军：对线与节奏双快。", eff: { lanes: 1.8, tempo: 1.0 } },
    t_tes: { id: "bond_tes", name: "滔搏青年", need: 3, desc: "TES 的青年近卫军：敢打敢拼。", eff: { lanes: 1.6, teamfight: 1.0 } },
    t_wbg: { id: "bond_wbg", name: "微博冲浪", need: 3, desc: "WBG 的冲浪体系：节奏来得快。", eff: { tempo: 1.8, teamfight: 1.0 } },
    t_dk: { id: "bond_dk", name: "DK 王朝", need: 3, desc: "DWG/DK 的统治力：中野节奏压制。", eff: { tempo: 2.0, resource: 1.2 } },
    t_drx: { id: "bond_drx", name: "DRX 黑马", need: 3, desc: "DRX 2022 的奇迹：心态和团战拉满。", eff: { mental: 2.0, teamfight: 1.2 } },
    t_lng: { id: "bond_lng", name: "苏州湾", need: 3, desc: "LNG 的稳健运营：资源与对线兼顾。", eff: { resource: 1.6, lanes: 1.0 } },
    t_kt: { id: "bond_kt", name: "电信王朝", need: 3, desc: "KT 的老牌底子：对线硬度。", eff: { lanes: 1.5, resource: 1.0 } },
    t_hle: { id: "bond_hle", name: "韩华钞能力", need: 3, desc: "HLE 的钞能力：资源与对线双补。", eff: { resource: 2.0, lanes: 1.0 } }
  };
  for (var tk in TEAM_BONDS) BONDS.push(TEAM_BONDS[tk]);

  var REGION_BONDS = {
    LPL: { id: "bond_lpl", name: "LPL 内战王", need: 3, desc: "LPL 三人成军：对线强度与团战开团。", eff: { lanes: 1.2, teamfight: 1.2 } },
    LCK: { id: "bond_lck", name: "韩式运营", need: 3, desc: "LCK 三人成军：视野、资源与节奏。", eff: { resource: 1.6, tempo: 1.2 } },
    LEC: { id: "bond_lec", name: "欧美之光", need: 3, desc: "LEC 三人成军：套路与心态。", eff: { mental: 1.8, tempo: 1.2 } }
  };
  for (var rk in REGION_BONDS) BONDS.push(REGION_BONDS[rk]);

  BONDS.push({ id: "bond_era2018", name: "2018 老将", need: 3, desc: "2019 年前的老骨头：资源与心态。", eff: { resource: 1.4, mental: 1.4 } });
  BONDS.push({ id: "bond_era2024", name: "2024 新生代", need: 3, desc: "2023 年后的新生代：手速与节奏。", eff: { tempo: 1.6, lanes: 1.2 } });
  BONDS.push({ id: "bond_lane", name: "对线怪物", need: 3, desc: "三个 LANE≥90 的对线怪物：三路压制。", eff: { lanes: 2.2 } });
  BONDS.push({ id: "bond_team", name: "团战核心", need: 3, desc: "三个 TEAM≥86 的团战核心：正面团无敌。", eff: { teamfight: 2.2 } });
  BONDS.push({ id: "bond_tempo", name: "节奏发动机", need: 3, desc: "三个 GAME≥90 的节奏点：全场跑起来。", eff: { tempo: 2.0 } });
  BONDS.push({ id: "bond_mech", name: "操作怪", need: 3, desc: "三个 MECH≥90 的操作怪：极限操作。", eff: { lanes: 1.4, teamfight: 1.0 } });
  BONDS.push({ id: "bond_mental", name: "大心脏", need: 3, desc: "三个 MENTAL≥85 的大心脏：越关键越稳。", eff: { mental: 2.0, teamfight: 1.0 } });
  BONDS.push({ id: "bond_pool", name: "英雄海", need: 3, desc: "三个 POOL≥90 的英雄海：BP 永远有解。", eff: { resource: 1.6, lanes: 1.0 } });
  BONDS.push({ id: "bond_greed", name: "莽夫阵", need: 3, desc: "三个 greed≥60 的莽夫：见面就干。", eff: { greed: 1.6, lanes: 1.2 } });
  BONDS.push({ id: "bond_farm", name: "运营大队", need: 3, desc: "三个 farm≥65 的运营怪：把比赛拖成自己的。", eff: { farm: 1.6, resource: 1.6 } });
  BONDS.push({ id: "bond_bot", name: "下路双人组", need: 2, desc: "同队 BOT+SUP：下路默契。", eff: { lanes: 1.0, teamfight: 1.2 } });
  BONDS.push({ id: "bond_midjung", name: "中野联动", need: 2, desc: "同队 MID+JUG：中野二打二。", eff: { tempo: 1.6 } });
  BONDS.push({ id: "bond_topjung", name: "上野联动", need: 2, desc: "同队 TOP+JUG：上半区压制。", eff: { lanes: 1.2 } });

  /* ---------- 卡面 → 元数据 ---------- */
  function heroPoolFor(card) {
    var pos = card.pos;
    var own = HERO_BY_POS[pos] || [];
    var tags = card.tags || [];
    var byTag = [];
    for (var i = 0; i < tags.length; i++) {
      if (HERO_BY_NAME[tags[i]]) byTag.push(tags[i]);
    }
    var pool = [];
    function push(n) { if (n && pool.indexOf(n) < 0) pool.push(n); }
    byTag.forEach(push);
    // 标签不够时，按 卡面标签 → 英雄打法标签 的亲和度补池
    var scored = own.map(function (n) {
      var h = HERO_BY_NAME[n];
      return { n: n, s: tagAffinity(card, h) * 10 + (hash(card.id + "|" + n) % 97) };
    }).sort(function (a, b) { return b.s - a.s; });
    for (var k = 0; k < scored.length && pool.length < 5; k++) push(scored[k].n);
    // 位置英雄不够 5 个时，从全英雄池补（双位置英雄优先）
    if (pool.length < 5) {
      var any = HEROES.slice().sort(function (a, b) {
        var ca = (a.pos || []).indexOf(pos) >= 0 ? 0 : 1;
        var cb = (b.pos || []).indexOf(pos) >= 0 ? 0 : 1;
        return ca - cb || (hash(card.id + a.n) % 101) - (hash(card.id + b.n) % 101);
      });
      for (var m = 0; m < any.length && pool.length < 5; m++) push(any[m].n);
    }
    return pool.slice(0, 5);
  }

  function sigFor(card, pool) {
    var tags = card.tags || [];
    var sig = [];
    for (var i = 0; i < tags.length; i++) {
      if (pool.indexOf(tags[i]) >= 0 && sig.indexOf(tags[i]) < 0) sig.push(tags[i]);
    }
    for (var k = 0; k < pool.length && sig.length < 2; k++) {
      if (sig.indexOf(pool[k]) < 0) sig.push(pool[k]);
    }
    return sig.slice(0, 2);
  }

  function genTilt(card) {
    var st = card.st || {};
    var pos = card.pos;
    var tags = card.tags || [];
    var aggressive = 0, farmTag = 0, teamTag = 0, mentalTag = 0;
    for (var i = 0; i < tags.length; i++) {
      var t = String(tags[i]);
      if (/激进|入侵|绝食|莽|秀|操作|单带/.test(t)) aggressive += 12;
      if (/四保一|后期|发育|运营|稳定|抗压/.test(t)) farmTag += 8;
      if (/团战|开团|大心脏|指挥|保护/.test(t)) teamTag += 8;
      if (/心态|大心脏|稳定|老将/.test(t)) mentalTag += 8;
    }
    var j = function (k, amp) { return (hash(card.id + "|" + k) % (amp * 2 + 1)) - amp; };
    return {
      farm: clamp(Math.round((st.GAME || 70) * 0.55 + (st.LANE || 70) * 0.15 + (pos === "BOT" ? 8 : 0) + (pos === "JUG" ? -6 : 0) + farmTag * 0.6 + j("farm", 6)), 20, 99),
      greed: clamp(Math.round((st.MECH || 70) * 0.45 + (st.LANE || 70) * 0.25 + aggressive + (pos === "TOP" || pos === "BOT" ? 4 : 0) + j("greed", 6)), 15, 99),
      tempo: clamp(Math.round((st.GAME || 70) * 0.7 + (st.LANE || 70) * 0.2 + (pos === "JUG" || pos === "MID" ? 6 : 0) + aggressive * 0.3 + j("tempo", 6)), 20, 99),
      teamfight: clamp(Math.round((st.TEAM || 70) * 0.6 + (st.MENTAL || 70) * 0.2 + teamTag * 0.6 + (pos === "SUP" || pos === "JUG" ? 4 : 0) + j("tf", 5)), 20, 99),
      mental: clamp(Math.round((st.MENTAL || 70) * 0.85 + (st.FAME || 70) * 0.1 + mentalTag * 0.5 + j("mental", 5)), 20, 99)
    };
  }

  function bondsFor(card) {
    var st = card.st || {};
    var tilt = card.tilt;
    var out = [];
    function add(id) { if (out.indexOf(id) < 0) out.push(id); }
    var tb = TEAM_BONDS[card.team];
    if (tb) add(tb.id);
    var region = (TEAMS[card.team] && TEAMS[card.team].region) || "";
    if (REGION_BONDS[region]) add(REGION_BONDS[region].id);
    // 只取一个最突出的属性羁绊，避免人人都能凑满
    var styles = [
      { id: "bond_lane", v: st.LANE || 0, th: 90 },
      { id: "bond_team", v: st.TEAM || 0, th: 86 },
      { id: "bond_tempo", v: st.GAME || 0, th: 90 },
      { id: "bond_mech", v: st.MECH || 0, th: 90 },
      { id: "bond_mental", v: st.MENTAL || 0, th: 85 },
      { id: "bond_pool", v: st.POOL || 0, th: 90 }
    ].filter(function (s) { return s.v >= s.th; }).sort(function (a, b) { return b.v - a.v; });
    if (styles.length) add(styles[0].id);
    // 倾向羁绊只给特征最鲜明的一类
    if (tilt && tilt.greed >= 68) add("bond_greed");
    else if (tilt && tilt.farm >= 72) add("bond_farm");
    /* 双刃剑：只给特征足够极端的卡，避免人人都挂负面 */
    if ((st.FAME || 0) >= 88) add("bond_egos");
    if ((st.POOL || 0) <= 58 && (st.MECH || 0) >= 78) add("bond_onetrick");
    if ((st.MENTAL || 0) < 45) add("bond_boom");
    if ((card.tags || []).indexOf("老将") >= 0 || (tilt && tilt.farm >= 78 && (st.MECH || 0) < 72)) add("bond_old");
    if (card.pos === "BOT" || card.pos === "SUP") add("bond_bot");
    if (card.pos === "MID" || card.pos === "JUG") add("bond_midjung");
    if (card.pos === "TOP" || card.pos === "JUG") add("bond_topjung");
    return out;
  }

  function buildMeta(card) {
    var star = STARS[card.pid];
    var pool = star && star.pool ? star.pool.filter(function (n) { return !!HERO_BY_NAME[n]; }).slice(0, 5) : [];
    if (pool.length < 5) {
      var gen = heroPoolFor(card);
      for (var i = 0; i < gen.length && pool.length < 5; i++) if (pool.indexOf(gen[i]) < 0) pool.push(gen[i]);
    }
    var sig = star && star.sig ? star.sig.filter(function (n) { return pool.indexOf(n) >= 0; }).slice(0, 2) : [];
    if (sig.length < 2) {
      var gs = sigFor(card, pool);
      for (var k = 0; k < gs.length && sig.length < 2; k++) if (sig.indexOf(gs[k]) < 0) sig.push(gs[k]);
    }
    var tilt = star && star.tilt ? {
      farm: clamp(star.tilt.farm, 1, 99), greed: clamp(star.tilt.greed, 1, 99), tempo: clamp(star.tilt.tempo, 1, 99),
      teamfight: clamp(star.tilt.teamfight, 1, 99), mental: clamp(star.tilt.mental, 1, 99)
    } : genTilt(card);
    var team = TEAMS[card.team];
    var meta = {
      id: card.id, pid: card.pid, name: card.name, cn: card.cn || "",
      pos: card.pos, year: card.year, ovr: card.ovr, salary: card.salary || 0,
      team: card.team || "", teamName: (team && team.name) || "", region: (team && team.region) || "",
      rarity: card.rarity || "蓝", star: !!star,
      pool: pool, sig: sig, tilt: tilt, bond: bondsFor({ id: card.id, pid: card.pid, pos: card.pos, year: card.year, team: card.team, st: card.st, tilt: tilt })
    };
    return meta;
  }

  var META = {};
  var byPid = {};
  CARDS.forEach(function (card) {
    var meta = buildMeta(card);
    META[card.id] = meta;
    if (!byPid[card.pid]) byPid[card.pid] = meta;
    else if ((meta.year || 0) > (byPid[card.pid].year || 0)) byPid[card.pid] = meta;
  });
  // 选手 id 也能直接查（取该选手最新年份的版本）
  for (var pid in byPid) if (!META[pid]) META[pid] = byPid[pid];

  /* ---------- v3.11 抽卡扩容池（js/data/talents_v4.js）的卡片元数据 ----------
     DATA_TALENTS_V4 是「本命 / 原创羁绊」天赋卡，不是 DATA_MGR 的选手卡，但斗蛐蛐、
     选人等接口要同一套 pool/sig/tilt/bond 结构。生成规则：
       1) 卡片自带 heroPool / pool / sig 字段就直接用卡片的；
       2) 否则从卡面文案（name + src.event + desc）里按英雄名认池（优先本位置英雄）；
       3) 仍不满 5 个时，按 build/region 走确定性生成（同一张卡每次结果一致）。
     pos：先按 src.who 的真实选手反查（LCK 名单 / 选手卡同名），再按 build 映射。
     注意：本文件要在 talents_v4.js 之后加载；未加载时静默跳过，不影响原有 165 张。 */
  var TAL4 = window.DATA_TALENTS_V4 || [];
  var BUILD_POS = { jungle: "JUG", control: "SUP", attack: "BOT", teamfight: "TOP", split: "TOP", mental: "SUP", money: "MID" };
  var BUILD_TAGS = {
    attack: ["激进", "操作"], control: ["运营", "视野"], teamfight: ["团战", "开团"],
    mental: ["大心脏", "稳定"], split: ["单带", "后期"], jungle: ["入侵", "节奏"], money: ["运营", "发育"]
  };
  var BUILD_TILT = {
    attack: { farm: 0, greed: 14, tempo: 6, teamfight: 0, mental: -4 },
    control: { farm: 4, greed: -8, tempo: 10, teamfight: 6, mental: 6 },
    teamfight: { farm: 0, greed: -2, tempo: -2, teamfight: 18, mental: 6 },
    mental: { farm: 2, greed: -6, tempo: 0, teamfight: 6, mental: 18 },
    split: { farm: 6, greed: 10, tempo: -2, teamfight: -4, mental: 0 },
    jungle: { farm: -2, greed: 10, tempo: 16, teamfight: 2, mental: 0 },
    money: { farm: 12, greed: 0, tempo: 2, teamfight: 0, mental: 2 }
  };
  /* 16 个固定 tag → 羁绊。名字与原有 33 条刻意不重名（T1 王朝 / 下路双人组 等已存在）。 */
  var TAL4_BONDS = {
    skT: ["bond_t4_skt", "SKT 王朝", "SKT/T1 本命卡三人成军：大赛执行力。", { teamfight: 2.0, mental: 1.4 }],
    faker_line: ["bond_t4_fakerline", "Faker 门徒", "中单本命卡三人成军：中路永远有答案。", { tempo: 1.8, resource: 1.2 }],
    lck_jungle: ["bond_t4_lckjungle", "LCK 野区", "LCK 打野三人成军：控图与反蹲。", { resource: 1.6, tempo: 1.4 }],
    lck_top: ["bond_t4_lcktop", "LCK 上路", "LCK 上单三人成军：对线硬度。", { lanes: 2.0 }],
    lck_bot: ["bond_t4_lckbot", "LCK 下路", "LCK 下路三人成军：稳定输出。", { lanes: 1.4, teamfight: 1.2 }],
    lck_support: ["bond_t4_lcksup", "LCK 辅助", "LCK 辅助三人成军：视野与开团。", { resource: 1.4, teamfight: 1.2 }],
    lec_rookie: ["bond_t4_lecnew", "LEC 新秀", "欧洲新秀三人成军：敢打敢秀。", { lanes: 1.4, mental: 1.2 }],
    west_bot: ["bond_t4_westbot", "欧美下路", "欧美下路三人成军：对线压制。", { lanes: 1.8 }],
    west_jungle: ["bond_t4_westjungle", "欧美野区", "欧美打野三人成军：入侵节奏。", { tempo: 1.6, greed: 1.2 }],
    na_import: ["bond_t4_naimport", "北美外援", "北美外援三人成军：个人能力拉满。", { lanes: 1.2, teamfight: 1.2 }],
    dual_lane: ["bond_t4_dual", "双线摇摆", "摇摆位三人成军：BP 永远有错位。", { lanes: 1.2, tempo: 1.2 }],
    vision_duo: ["bond_t4_vision", "视野双人组", "视野体系三人成军：地图全亮。", { resource: 1.8 }],
    draft_book: ["bond_t4_draft", "BP 教科书", "BP 体系三人成军：开局就领先。", { tempo: 1.2, resource: 1.2 }],
    old_guard: ["bond_t4_oldguard", "老将余晖", "老将三人成军：越关键越稳。", { mental: 2.0, teamfight: 1.0 }],
    rookie_wall: ["bond_t4_rookiewall", "新秀墙", "新秀三人成军：手速与冲劲。", { lanes: 1.4, greed: 1.2 }],
    iron_triangle: ["bond_t4_iron", "铁三角", "铁三角三人成军：正面团无解。", { teamfight: 2.2 }]
  };
  var TAL4_BOND_BY_ID = {};
  for (var tb2 in TAL4_BONDS) {
    var tbDef = TAL4_BONDS[tb2];
    BONDS.push({ id: tbDef[0], name: tbDef[1], need: 3, desc: tbDef[2], eff: tbDef[3] });
    TAL4_BOND_BY_ID[tbDef[0]] = tb2;
  }
  /* ---------- 双刃剑 / 负面羁绊 ---------- */
  BONDS.push({ id: "bond_egos", name: "银河战舰", need: 3, risk: true,
    desc: "三个 FAME≥88 的明星：个人能力拉满，但资源分配和更衣室开始打架。",
    eff: { lanes: 1.2, teamfight: -0.8, mental: -0.6, resource: -0.8 } });
  BONDS.push({ id: "bond_onetrick", name: "绝活哥开会", need: 3, risk: true,
    desc: "三个英雄池很浅、绝活很深的选手：拿到本命是神，BP 被针对就一起坐牢。",
    eff: { lanes: 1.6, resource: -1.0, tempo: -0.8 } });
  BONDS.push({ id: "bond_boom", name: "更衣室炸弹", need: 3, risk: true,
    desc: "三个 MENTAL<45 的选手：顺风敢秀，逆风先炸，教练的嗓子就是这么坏的。",
    eff: { lanes: 1.0, mental: -1.5, teamfight: -0.8 } });
  BONDS.push({ id: "bond_old", name: "养老院", need: 3, risk: true,
    desc: "三个老将：经验和对线还在，节奏和体能开始跟不上。",
    eff: { mental: 1.2, farm: 1.0, tempo: -1.0, lanes: -0.4 } });

  // 羁绊表按名字去重（防止和已有正式数据重名）
  var seenBondName = {};
  BONDS = BONDS.filter(function (b) {
    if (seenBondName[b.name]) return false;
    seenBondName[b.name] = 1;
    return true;
  });

  function tal4Who(card) {
    var who = (card.src && card.src.who) || "";
    var parts = who.split(":");
    return { region: parts.length > 1 ? parts[0] : "", name: parts.length > 1 ? parts[1] : who };
  }
  function tal4Pos(card) {
    var w = tal4Who(card);
    if (w.name) {
      if (w.region === "LCK") {
        var lp = (window.DATA_LCK && window.DATA_LCK.players) || [];
        for (var i = 0; i < lp.length; i++) {
          if (lp[i] && lp[i].name === w.name && POS.indexOf(lp[i].pos) >= 0) return lp[i].pos;
        }
      }
      for (var j = 0; j < CARDS.length; j++) {
        if ((CARDS[j].name === w.name || CARDS[j].cn === w.name) && POS.indexOf(CARDS[j].pos) >= 0) return CARDS[j].pos;
      }
    }
    return BUILD_POS[card.build] || "MID";
  }
  function tal4Heroes(card, pos) {
    var own = card.heroPool || card.pool;
    if (own && own.length) return own.filter(function (n) { return !!HERO_BY_NAME[n]; }).slice(0, 5);
    var text = [card.name || "", (card.src && card.src.event) || "", card.desc || ""].join(" ");
    var inPos = [], other = [];
    HEROES.forEach(function (h) {
      if (text.indexOf(h.n) < 0) return;
      if ((h.pos || []).indexOf(pos) >= 0) inPos.push(h.n);
      else other.push(h.n);
    });
    return inPos.concat(other).filter(function (n, i, arr) { return arr.indexOf(n) === i; }).slice(0, 5);
  }
  function tal4Tilt(card) {
    var eff = card.eff || {};
    var b = BUILD_TILT[card.build] || {};
    var j = function (k) { return (hash(card.id + "|" + k) % 11) - 5; };
    return {
      farm: clamp(Math.round(58 + (b.farm || 0) + (eff.GAME || 0) * 1.2 + (eff.POOL || 0) * 0.5 + j("farm")), 15, 99),
      greed: clamp(Math.round(58 + (b.greed || 0) + (eff.LANE || 0) * 1.0 + (eff.MECH || 0) * 0.6 + j("greed")), 15, 99),
      tempo: clamp(Math.round(58 + (b.tempo || 0) + (eff.GAME || 0) * 1.2 + (eff.PHYS || 0) * 0.6 + j("tempo")), 15, 99),
      teamfight: clamp(Math.round(58 + (b.teamfight || 0) + (eff.TEAM || 0) * 1.2 + (eff.MENTAL || 0) * 0.5 + j("tf")), 15, 99),
      mental: clamp(Math.round(58 + (b.mental || 0) + (eff.MENTAL || 0) * 1.2 + (eff.PHYS || 0) * 0.4 + j("mental")), 15, 99)
    };
  }
  function tal4Bonds(card, pos, tilt) {
    var out = [];
    function add(id) { if (id && out.indexOf(id) < 0) out.push(id); }
    var def = TAL4_BONDS[card.tag];
    if (def) add(def[0]);
    var w = tal4Who(card);
    if (REGION_BONDS[w.region]) add(REGION_BONDS[w.region].id);
    if (tilt.greed >= 68) add("bond_greed");
    else if (tilt.farm >= 72) add("bond_farm");
    if (pos === "BOT" || pos === "SUP") add("bond_bot");
    if (pos === "MID" || pos === "JUG") add("bond_midjung");
    if (pos === "TOP" || pos === "JUG") add("bond_topjung");
    return out;
  }
  TAL4.forEach(function (card) {
    if (!card || !card.id) return;
    var pos = tal4Pos(card);
    var pool = tal4Heroes(card, pos);
    var synth = { id: card.id, pos: pos, tags: BUILD_TAGS[card.build] || [] };
    if (pool.length < 5) {
      var gen = heroPoolFor(synth);
      for (var i = 0; i < gen.length && pool.length < 5; i++) if (pool.indexOf(gen[i]) < 0) pool.push(gen[i]);
    }
    var sig = (card.sig || []).filter(function (n) { return pool.indexOf(n) >= 0; }).slice(0, 2);
    if (sig.length < 2) {
      for (var k = 0; k < pool.length && sig.length < 2; k++) if (sig.indexOf(pool[k]) < 0) sig.push(pool[k]);
    }
    var tilt = tal4Tilt(card);
    var w = tal4Who(card);
    META[card.id] = {
      id: card.id, pid: card.id, name: w.name || card.name, cn: card.name,
      pos: pos, year: (card.src && card.src.year) || 0, ovr: 0, salary: 0,
      team: "", teamName: "", region: w.region || "",
      rarity: card.rarity || "blue", star: false, talent: true, tag: card.tag || "", build: card.build || "",
      pool: pool.slice(0, 5), sig: sig.slice(0, 2), tilt: tilt, bond: tal4Bonds(card, pos, tilt)
    };
  });

  window.DATA_CARD_META = META;
  window.DATA_CARD_BONDS = BONDS;
})();
