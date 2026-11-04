/* 《登神》英雄池数据
   pos: 可用位置  TOP JUG MID BOT SUP
   diff: 上手难度 1 简单 2 中等 3 困难
   tag: 打法标签，用于事件、教练要求、版本事件
*/
window.DATA_HEROES = [
  /* ============ 上单 ============ */
  { n: "剑姬", en: "Fiora", pos: ["TOP"], diff: 3, tag: ["1v1", "单带", "操作"] },
  { n: "贾克斯", en: "Jax", pos: ["TOP", "JUG"], diff: 2, tag: ["单带", "后期", "1v1"] },
  { n: "青钢影", en: "Camille", pos: ["TOP"], diff: 3, tag: ["单带", "开团", "操作"] },
  { n: "杰斯", en: "Jayce", pos: ["TOP", "MID"], diff: 3, tag: ["对线", "消耗", "压制"] },
  { n: "纳尔", en: "Gnar", pos: ["TOP"], diff: 2, tag: ["开团", "对线", "变身"] },
  { n: "剑魔", en: "Aatrox", pos: ["TOP"], diff: 2, tag: ["团战", "续航", "单带"] },
  { n: "奥恩", en: "Ornn", pos: ["TOP"], diff: 1, tag: ["坦克", "开团", "后期"] },
  { n: "鳄鱼", en: "Renekton", pos: ["TOP"], diff: 1, tag: ["对线", "压制", "前中期"] },
  { n: "格温", en: "Gwen", pos: ["TOP"], diff: 3, tag: ["单带", "后期", "团战"] },
  { n: "兰博", en: "Rumble", pos: ["TOP"], diff: 2, tag: ["团战", "消耗", "版本"] },
  { n: "凯南", en: "Kennen", pos: ["TOP"], diff: 2, tag: ["开团", "爆发", "闪现"] },
  { n: "蒙多", en: "Dr. Mundo", pos: ["TOP"], diff: 1, tag: ["坦克", "续航", "混"] },
  { n: "船长", en: "Gangplank", pos: ["TOP"], diff: 3, tag: ["后期", "团战", "运营"] },
  { n: "瑞雯", en: "Riven", pos: ["TOP"], diff: 3, tag: ["操作", "1v1", "连招"] },
  { n: "奎桑提", en: "KSante", pos: ["TOP"], diff: 3, tag: ["坦克", "开团", "操作"] },

  /* ============ 打野 ============ */
  { n: "盲僧", en: "Lee Sin", pos: ["JUG"], diff: 3, tag: ["节奏", "操作", "秀"] },
  { n: "千珏", en: "Kindred", pos: ["JUG"], diff: 3, tag: ["发育", "后期", "印记"] },
  { n: "男枪", en: "Graves", pos: ["JUG"], diff: 2, tag: ["刷野", "压制", "入侵"] },
  { n: "蔚", en: "Vi", pos: ["JUG"], diff: 1, tag: ["开团", "锁人", "节奏"] },
  { n: "大树", en: "Maokai", pos: ["JUG", "SUP"], diff: 1, tag: ["坦克", "开团", "视野"] },
  { n: "佛耶戈", en: "Viego", pos: ["JUG"], diff: 3, tag: ["团战", "滚雪球", "操作"] },
  { n: "破败王", en: "BelVeth", pos: ["JUG"], diff: 2, tag: ["后期", "单带", "刷"] },
  { n: "莉莉娅", en: "Lillia", pos: ["JUG"], diff: 2, tag: ["团战", "消耗", "节奏"] },
  { n: "螳螂", en: "KhaZix", pos: ["JUG"], diff: 2, tag: ["刺客", "入侵", "滚雪球"] },
  { n: "赵信", en: "XinZhao", pos: ["JUG"], diff: 1, tag: ["节奏", "开团", "前中期"] },
  { n: "猪妹", en: "Sejuani", pos: ["JUG"], diff: 1, tag: ["坦克", "开团", "团战"] },
  { n: "豹女", en: "Nidalee", pos: ["JUG"], diff: 3, tag: ["入侵", "节奏", "操作"] },
  { n: "岩雀", en: "Taliyah", pos: ["JUG", "MID"], diff: 3, tag: ["支援", "视野", "运营"] },
  { n: "蜘蛛", en: "Elise", pos: ["JUG"], diff: 3, tag: ["节奏", "越塔", "前中期"] },
  { n: "猴子", en: "Wukong", pos: ["JUG", "TOP"], diff: 2, tag: ["开团", "团战", "节奏"] },

  /* ============ 中单 ============ */
  { n: "沙皇", en: "Azir", pos: ["MID"], diff: 3, tag: ["后期", "团战", "操作"] },
  { n: "发条", en: "Orianna", pos: ["MID"], diff: 2, tag: ["团战", "运营", "稳定"] },
  { n: "辛德拉", en: "Syndra", pos: ["MID"], diff: 2, tag: ["爆发", "对线", "团战"] },
  { n: "阿狸", en: "Ahri", pos: ["MID"], diff: 1, tag: ["机动", "消耗", "开团"] },
  { n: "妖姬", en: "LeBlanc", pos: ["MID"], diff: 3, tag: ["刺客", "节奏", "操作"] },
  { n: "劫", en: "Zed", pos: ["MID"], diff: 3, tag: ["刺客", "1v1", "秀"] },
  { n: "瑞兹", en: "Ryze", pos: ["MID"], diff: 3, tag: ["运营", "支援", "后期"] },
  { n: "卡牌", en: "Twisted Fate", pos: ["MID"], diff: 2, tag: ["支援", "运营", "单带"] },
  { n: "加里奥", en: "Galio", pos: ["MID"], diff: 1, tag: ["支援", "坦克", "团战"] },
  { n: "佐伊", en: "Zoe", pos: ["MID"], diff: 3, tag: ["消耗", "爆发", "操作"] },
  { n: "塞拉斯", en: "Sylas", pos: ["MID"], diff: 2, tag: ["团战", "开团", "偷技能"] },
  { n: "阿卡丽", en: "Akali", pos: ["MID", "TOP"], diff: 3, tag: ["刺客", "团战", "操作"] },
  { n: "维克托", en: "Viktor", pos: ["MID"], diff: 2, tag: ["后期", "消耗", "团战"] },
  { n: "永恩", en: "Yone", pos: ["MID", "TOP"], diff: 3, tag: ["刺客", "单带", "操作"] },

  /* ============ ADC ============ */
  { n: "卡莎", en: "Kaisa", pos: ["BOT"], diff: 2, tag: ["后期", "团战", "机动"] },
  { n: "厄斐琉斯", en: "Aphelios", pos: ["BOT"], diff: 3, tag: ["后期", "团战", "武器库"] },
  { n: "薇恩", en: "Vayne", pos: ["BOT"], diff: 3, tag: ["后期", "操作", "1v1"] },
  { n: "德莱文", en: "Draven", pos: ["BOT"], diff: 3, tag: ["对线", "滚雪球", "操作"] },
  { n: "伊泽瑞尔", en: "Ezreal", pos: ["BOT"], diff: 2, tag: ["消耗", "机动", "混"] },
  { n: "金克丝", en: "Jinx", pos: ["BOT"], diff: 1, tag: ["后期", "团战", "推塔"] },
  { n: "女警", en: "Caitlyn", pos: ["BOT"], diff: 2, tag: ["对线", "推塔", "消耗"] },
  { n: "霞", en: "Xayah", pos: ["BOT"], diff: 2, tag: ["团战", "自保", "对线"] },
  { n: "卢锡安", en: "Lucian", pos: ["BOT"], diff: 2, tag: ["对线", "压制", "前中期"] },
  { n: "小炮", en: "Tristana", pos: ["BOT"], diff: 1, tag: ["推塔", "后期", "跳跃"] },
  { n: "泽丽", en: "Zeri", pos: ["BOT"], diff: 3, tag: ["后期", "机动", "操作"] },
  { n: "维鲁斯", en: "Varus", pos: ["BOT"], diff: 2, tag: ["消耗", "团战", "稳定"] },
  { n: "萨米拉", en: "Samira", pos: ["BOT"], diff: 3, tag: ["团战", "操作", "爆发"] },
  { n: "斯莫德", en: "Smolder", pos: ["BOT"], diff: 2, tag: ["后期", "叠层", "混"] },

  /* ============ 辅助 ============ */
  { n: "锤石", en: "Thresh", pos: ["SUP"], diff: 3, tag: ["开团", "视野", "操作"] },
  { n: "洛", en: "Rakan", pos: ["SUP"], diff: 3, tag: ["开团", "机动", "团战"] },
  { n: "牛头", en: "Alistar", pos: ["SUP"], diff: 2, tag: ["坦度", "开团", "保护"] },
  { n: "布隆", en: "Braum", pos: ["SUP"], diff: 1, tag: ["保护", "团战", "坦度"] },
  { n: "蕾欧娜", en: "Leona", pos: ["SUP"], diff: 1, tag: ["开团", "硬控", "越塔"] },
  { n: "娜美", en: "Nami", pos: ["SUP"], diff: 2, tag: ["保护", "续航", "对线"] },
  { n: "露露", en: "Lulu", pos: ["SUP"], diff: 1, tag: ["保护", "加buff", "混"] },
  { n: "卡尔玛", en: "Karma", pos: ["SUP", "MID"], diff: 1, tag: ["消耗", "对线", "保护"] },
  { n: "派克", en: "Pyke", pos: ["SUP"], diff: 3, tag: ["游走", "收割", "开团"] },
  { n: "瑞尔", en: "Rell", pos: ["SUP"], diff: 2, tag: ["开团", "硬控", "团战"] },
  { n: "巴德", en: "Bard", pos: ["SUP"], diff: 3, tag: ["游走", "视野", "整活"] },
  { n: "莫甘娜", en: "Morgana", pos: ["SUP"], diff: 1, tag: ["反手", "控制", "保护"] },
  { n: "塔姆", en: "TahmKench", pos: ["SUP"], diff: 2, tag: ["保护", "坦度", "救援"] },
  { n: "赛娜", en: "Senna", pos: ["SUP", "BOT"], diff: 2, tag: ["后期", "消耗", "叠层"] }
];

/* 位置定义 */
window.DATA_POS = {
  TOP: { name: "上单", en: "TOP", icon: "sword", desc: "1v1 的孤岛，边线是你的战场", w: { LANE: .3, MECH: .3, GAME: .2, POOL: .1, MENTAL: .1 } },
  JUG: { name: "打野", en: "JUG", icon: "leaf", desc: "全图的节奏，队友的爹", w: { GAME: .3, MECH: .25, TEAM: .2, LANE: .15, POOL: .1 } },
  MID: { name: "中单", en: "MID", icon: "star", desc: "地图中心，也是舆论中心", w: { LANE: .3, MECH: .3, GAME: .2, POOL: .1, MENTAL: .1 } },
  BOT: { name: "ADC", en: "BOT", icon: "bow", desc: "四保一的对象，也是背锅位", w: { LANE: .3, MECH: .35, GAME: .15, TEAM: .1, POOL: .1 } },
  SUP: { name: "辅助", en: "SUP", icon: "shield", desc: "数据最差，功劳最少，锅最大", w: { GAME: .3, TEAM: .3, MENTAL: .2, LANE: .1, MECH: .1 } }
};
