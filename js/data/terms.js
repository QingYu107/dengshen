/* 《登神》中文词表：所有给玩家看的数值名、加成、流派、结局线索，一律走这里。
   规则：UI 层禁止直接显示 LANE / MECH / matchBonus 这种英文 key。 */
window.DATA_TERMS = {
  /* 八维 */
  stat: {
    LANE: "对线", MECH: "操作", GAME: "意识", POOL: "英雄池",
    MENTAL: "心态", PHYS: "体能", TEAM: "团队", FAME: "名气"
  },
  statHint: {
    LANE: "1v1 和换血能力，对线期打不打得过",
    MECH: "手速、反应、操作上限，团战能秀多少",
    GAME: "意识、视野、运营，脑子清不清楚",
    POOL: "英雄池深度，BP 和版本适应全靠它",
    MENTAL: "心态，关键局扛不扛得住",
    PHYS: "体能，BO5 第五局还有没有手",
    TEAM: "和队友的配合，团战默契",
    FAME: "名气，钱、话语权、粉丝都从这来"
  },
  /* 效果 key 的中文（引擎 cnEff 用） */
  eff: {
    LANE: "对线", MECH: "操作", GAME: "意识", POOL: "英雄池",
    MENTAL: "心态", PHYS: "体能", TEAM: "团队", FAME: "名气",
    energy: "精力", morale: "心态", spirit: "士气", money: "存款",
    fans: "粉丝", coach: "教练信任", voice: "话语权", teamStatus: "队内地位",
    corrupt: "亏心", justice: "良心", growth: "成长",
    matchBonus: "比赛全属性", regularWin: "常规赛胜率",
    drawBonus: "抽卡运势", keyBonus: "关键局", energyMax: "体力上限",
    poolTrain: "英雄熟练度", tickets: "抽卡券", banPlus: "ban 位",
    mentalShield: "心态护盾", decode: "版本解读",
    status: "队内地位", haters: "黑粉", burst: "爆气", injury: "伤病概率",
    hupu: "论坛评分", ticket: "抽卡券", banPlusSplit: "赛段 ban 位",
    voiceDebt: "话语权欠账", voiceReset: "话语权临时下调"
  },
  /* 天赋卡流派 */
  build: {
    attack: { name: "进攻", desc: "BO5 决胜局、击杀、越塔，越打越凶", color: "#ff5c5c" },
    control: { name: "运营", desc: "视野、节奏、龙控，把比赛拖死", color: "#5cc8ff" },
    teamfight: { name: "团战", desc: "五个人一起上，一波就赢", color: "#ffb14e" },
    mental: { name: "心态", desc: "关键局不手抖，抗压扛到底", color: "#b18cff" },
    money: { name: "商道", desc: "钱和话语权，场外也是战场", color: "#ffd84e" },
    jungle: { name: "野核", desc: "打野带飞，节奏全在你手里", color: "#6ee7a0" },
    split: { name: "单带", desc: "不团了，拆你家", color: "#ff8ad1" }
  },
  /* 卡牌稀有度（引擎 RARITY 用，颜色在 ui） */
  rarity: { N: "白", R: "蓝", SR: "紫", SSR: "金" },
  /* 结局线索标签 */
  story: {
    corrupt: "亏心值",
    justice: "良心值",
    scandal: "黑料值"
  },
  /* 比赛关键变量文案 */
  keyVar: {
    zone: "对线期", mid: "中期运营", late: "后期团战",
    heroCtr: "英雄克制", mainHero: "本命自信", patch: "版本契合",
    energy: "体力", morale: "心态", spirit: "士气", tactic: "战术克制",
    burst: "爆种", coach: "教练信任", voice: "话语权"
  }
};
