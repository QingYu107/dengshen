/* 《登神》商店道具
   price 单位：万元
   eff 直接给引擎读：
     stat3: {属性: 值}      连续 3 个月每月加
     once: {属性: 值}       立即加
     growth: 0.15           永久成长系数
     keyBonus: 3            关键局成功率 +3%
     energyMax: 10          体力上限
     poolTrain: 8           英雄熟练度 +8
     tickets: 3             抽卡券
     reveal: 1              BP 多看一个对手倾向
     mental: 10             心态
*/
window.DATA_SHOP = {
  items: [
    {
      id: "sh_coach", name: "私教", price: 60, icon: "coach", once: false,
      desc: "请个前职业带你抠细节，三个月，每月固定涨。",
      flavor: "贵，但比你自己瞎练强。",
      eff: { pickStat3: 2 }
    },
    {
      id: "sh_psych", name: "心理医生", price: 40, icon: "heart", once: false,
      desc: "心态 +10，本赛季每输一场少掉一半心态。",
      flavor: "职业选手一半的预算花在这上面，另一半花在会所。",
      eff: { mental: 10, mentalShield: 1 }
    },
    {
      id: "sh_rehab", name: "康复中心", price: 35, icon: "body", once: false,
      desc: "体力回满，伤停立刻好，伤病概率再降一点。",
      flavor: "手腕和腰，是这行的消耗品。养一养，还能多打两年。",
      eff: { energyFull: 1, healInjury: 1 }
    },
    {
      id: "sh_equip", name: "训练设备", price: 120, icon: "cpu", once: true,
      desc: "永久：成长 +15%。",
      flavor: "基地那台十年的老爷机，该换了。",
      eff: { growth: 0.15 }
    },
    {
      id: "sh_gear", name: "外设", price: 25, icon: "mouse", once: true,
      desc: "永久：关键局成功率 +3%。",
      flavor: "鼠标不飘了，手也不抖了。",
      eff: { keyBonus: 3 }
    },
    {
      id: "sh_heroTraing", name: "英雄特训", price: 45, icon: "book", once: false,
      desc: "指定一个英雄，熟练度 +8。",
      flavor: "教练拿小本子给你抠连招，一帧一帧抠。",
      eff: { poolTrain: 8 }
    },
    {
      id: "sh_ticket", name: "抽卡券 x3", price: 30, icon: "ticket", once: false,
      desc: "抽卡券 +3。",
      flavor: "官方活动送的券，黄牛卖你三十万。",
      eff: { tickets: 3 }
    },
    {
      id: "sh_dinner", name: "请客", price: 15, icon: "food", once: false,
      desc: "团队 +6，士气 +8。",
      flavor: "一顿海底捞，比十次战术课管用。",
      eff: { TEAM: 6, spirit: 8 }
    },
    {
      id: "sh_data", name: "数据团队", price: 80, icon: "chart", once: true,
      desc: "永久：BP 阶段多看一个对手倾向。",
      flavor: "对面打野喜欢反蹲还是抓边，数据会说话。",
      eff: { reveal: 1 }
    },
    {
      id: "sh_nutrition", name: "营养师", price: 50, icon: "leaf", once: true,
      desc: "永久：体力上限 +10。",
      flavor: "炸鸡换水煮鸡胸，这是职业选手的第一步堕落。",
      eff: { energyMax: 10 }
    },
    {
      id: "sh_bp", name: "分析师", price: 55, icon: "search", once: false,
      desc: "本赛段：ban 位 +1。",
      flavor: "他把你对手过去三个月的 BP 全背下来了。",
      eff: { banPlus: 1 }
    },
    {
      id: "sh_camp", name: "封闭特训", price: 90, icon: "fire", once: false,
      desc: "本月精力 -25，三项属性 +3，英雄池 +10。",
      flavor: "拉去山里拉练，手机没收，出来人都傻了。",
      eff: { energy: -25, stat3: 3, poolTrain: 10 }
    }
  ]
};
