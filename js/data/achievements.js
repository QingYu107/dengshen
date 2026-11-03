/* js/data/achievements.js — 成就表。纯数据，判定交给引擎/经理模块。
   结构：
   window.DATA_ACHV = [ { id, name, desc, tier: 1|2|3, cat, cond, reward? } ]
   cat：career 生涯 / honor 荣誉 / money 经济 / relation 关系 / absurd 整活，各 8 条。
   tier：1 好拿、2 要花点心思、3 得赶上点命。

   cond 语义（全部按 AND 处理，一条成就里可以叠多个键）：
     minTitles       number   record.titles.length >= n
     minOvr          number   myOvr() >= n
     minSeasons      number   当前赛季数 S.season >= n（三年模式最多 3，无尽模式可继续累）
     minMoney        number   S.money >= n（单位：万）
     maxMoney        number   S.money <= n（单位：万）
     minFans         number   S.fans >= n
     minFame         number   S.st.FAME >= n
     worldsChampion  boolean  record.worlds 里存在 win:true
     msiChampion     boolean  record.msi 里存在 win:true
     endingName      string   结局名完全一致（登神/无冕之王/人间理想/国内霸主/一冠封神/
                              流量之神/资本玩家/更衣室教皇/干净的人/出国留学的/顶级打工人/
                              混口饭吃/债务缠身/塌房/刀口余生/被追着跑的人/人间蒸发/
                              终身禁赛/查无此人）
     endingRank      string | string[]  结局档位（"S+" 或 ["A+","S","S+"]）
     storyCorrupt    number   S.story.corrupt >= n
     storyJustice    number   S.story.justice >= n
     mateAff         number   队友最高好感度 >= n（0~100）
     heroCount       number   Object.keys(S.pool).length >= n
     gachaCount      number   本局累计抽卡次数 >= n
     debtEver        boolean  本局出现过 S.money < 0
     injuryCount     number   本局累计受伤次数 >= n
     playMode        string   "three" / "endless" / "mgr"

   引擎侧要补的累计字段（现在没有，建议统一挂在 S.record 上，随档保存）：
     S.record.draws    每次 drawScene 抽 1 次 +1（十连按 10 算）
     S.record.injuries 每次 M.injured 由 false 变 true 时 +1
     S.record.debtEver 任意时刻 S.money < 0 时置 true
     S.mateAff         一局内队友最高好感度；没有这套数值的话可以按 S.coachTrust 近似，
                       但更建议在队友事件里攒一个 0~100 的数，否则 relation 组会空。
   判定时机建议：每次月末结算 + 结局页各跑一次；解锁写入 localStorage denshen_achv
   （只存 id，跨局保留），新解锁弹一条 toast，主菜单显示 X/40。

   reward（可缺省）：{ tickets?: number, money?: number(万), fans?: number, fame?: number }
   解锁时一次性发放，同一成就只发一次。 */
window.DATA_ACHV = [
  /* ================= career 生涯 ================= */
  {
    id: "c01", cat: "career", tier: 1,
    name: "先活过第一年",
    desc: "第一年没被下放、没被裁、没自己跑路，这行里已经赢了一半。你从基地最角落的机位搬到了靠窗那台，虽然只挪了两米。",
    cond: { minSeasons: 1 },
    reward: { tickets: 1 }
  },
  {
    id: "c02", cat: "career", tier: 2,
    name: "三年工龄",
    desc: "合同一年一签，签了三次，每次都在同一个会议室。第三次你坐下的时候经理先把续约合同推过来了，没绕弯子，也没提涨薪。",
    cond: { minSeasons: 3 }
  },
  {
    id: "c03", cat: "career", tier: 3,
    name: "老而不死",
    desc: "一起进队的人两年前就转解说、转教练、进厂了，你还在打。打到后来年轻队员管你叫哥，再后来叫叔，你应得挺自然。",
    cond: { minSeasons: 5, playMode: "endless" }
  },
  {
    id: "c04", cat: "career", tier: 1,
    name: "站稳首发",
    desc: "终于不用每场开赛前等教练念名单了。你的名字被写在白板第一个，旁边那个圈是教练画的，画得很随意，你看了半天。",
    cond: { minOvr: 75 }
  },
  {
    id: "c05", cat: "career", tier: 2,
    name: "队里最能打的",
    desc: "训练赛打完，队友开始问你该怎么打，不是客气，是真的不知道。你也没觉得自己多强，就是比他们多熬了两年，多挨了两年骂。",
    cond: { minOvr: 85 }
  },
  {
    id: "c06", cat: "career", tier: 3,
    name: "这位置我说了算",
    desc: "联赛里没人愿意在对线期碰你，BP 的时候对面先 ban 你的招牌，再 ban 你的备胎。你看着那两个灰色头像，心里没什么波澜。",
    cond: { minOvr: 92 }
  },
  {
    id: "c07", cat: "career", tier: 2,
    name: "英雄海",
    desc: "从坦克到刺客，从战士到法核，你什么都能掏。教练说你最大的优点是难被针对，你听着像夸，也像在说你没有绝活。",
    cond: { heroCount: 20 }
  },
  {
    id: "c08", cat: "career", tier: 2,
    name: "带伤上班",
    desc: "疼过两次，都没请假。一次是赛前打封闭，一次是赛后自己走回基地。队医看你的眼神从心疼变成了习惯，这比疼更让你难受。",
    cond: { injuryCount: 2, minSeasons: 2 }
  },

  /* ================= honor 荣誉 ================= */
  {
    id: "h01", cat: "honor", tier: 1,
    name: "第一个冠军",
    desc: "奖杯比想象中轻，捧起来的时候你差点没拿稳。回基地的路上你一直翻手机相册，照片拍糊了，你还是没删。",
    cond: { minTitles: 1 },
    reward: { tickets: 2 }
  },
  {
    id: "h02", cat: "honor", tier: 2,
    name: "三冠",
    desc: "第三次站上那个台子，你已经开始注意镜头在哪了。第一次你哭，第二次你笑，第三次你在想晚上吃什么，被队友掐了一把才想起来举奖杯。",
    cond: { minTitles: 3 }
  },
  {
    id: "h03", cat: "honor", tier: 3,
    name: "五冠",
    desc: "解说念你荣誉的时候要停顿换气，弹幕在数你拿了几个。你自己数不清，只记得每个冠军之后队伍都换了一批人，只有你还在。",
    cond: { minTitles: 5 },
    reward: { tickets: 3 }
  },
  {
    id: "h04", cat: "honor", tier: 2,
    name: "MSI 冠军",
    desc: "季中赛的奖杯和世界赛长得不一样，举起来的手感差不多。回国那天机场有粉丝接机，人不多，举的牌子是你 ID，字写得歪歪扭扭。",
    cond: { msiChampion: true }
  },
  {
    id: "h05", cat: "honor", tier: 3,
    name: "世界冠军",
    desc: "召唤师奖杯比你想的沉。你举起来的时候听见全场在喊一个词，喊的是你的名字，喊了三遍你才反应过来，眼泪先掉下来了。",
    cond: { worldsChampion: true },
    reward: { tickets: 5 }
  },
  {
    id: "h06", cat: "honor", tier: 3,
    name: "大满贯",
    desc: "联赛、MSI、世界赛，能拿的都拿了。后来有人做荣誉图，把你那一格塞得满满当当，你看了半天，觉得像别人的简历。",
    cond: { worldsChampion: true, msiChampion: true }
  },
  {
    id: "h07", cat: "honor", tier: 2,
    name: "就差那一个",
    desc: "MSI 拿过，联赛拿过，世界赛决赛打满五局，最后一局输在一条龙上。每年十一月你都会把那个 BO5 找出来，看到第五局就关掉。",
    cond: { endingName: "无冕之王" }
  },
  {
    id: "h08", cat: "honor", tier: 2,
    name: "四强也是成绩",
    desc: "半决赛输的那天你在场馆后门坐了很久，粉丝隔着栏杆喊你名字，你抬手挥了挥，没回头。后来那波操作被剪进集锦，弹幕年年吵该不该退。",
    cond: { endingName: "人间理想" }
  },

  /* ================= money 经济 ================= */
  {
    id: "m01", cat: "money", tier: 1,
    name: "七位数",
    desc: "存款第一次跳到七位数那天，你截了图，没发朋友圈，只发给了你妈。她回了一句“别乱花”，然后问你要不要给家里换个冰箱。",
    cond: { minMoney: 100 },
    reward: { money: 10 }
  },
  {
    id: "m02", cat: "money", tier: 2,
    name: "五百万",
    desc: "你开始算退役以后的事：房子首付、爸妈的保险、自己那点想开店的念头。算完发现钱还是不够，但至少不用再看别人脸色。",
    cond: { minMoney: 500 }
  },
  {
    id: "m03", cat: "money", tier: 3,
    name: "千万身家",
    desc: "账户里的数字到了八位数，你反而没什么感觉。真正让你有感觉的是，俱乐部老板跟你说话开始用“商量”这个词。",
    cond: { minMoney: 1000 }
  },
  {
    id: "m04", cat: "money", tier: 1,
    name: "欠过钱",
    desc: "最惨那个月，你把外卖软件删了，训练基地的泡面吃到想吐。后来你才知道，欠钱这件事在圈里不算新闻，只是没人愿意说。",
    cond: { debtEver: true }
  },
  {
    id: "m05", cat: "money", tier: 2,
    name: "翻身",
    desc: "欠的钱还完那天，你一个人去吃了顿火锅，点了平时舍不得点的毛肚。吃到一半你忽然想不起来当初为什么会欠那么多，只记得那些催收的电话铃声。",
    cond: { debtEver: true, minMoney: 100 }
  },
  {
    id: "m06", cat: "money", tier: 2,
    name: "三年攒出个首付",
    desc: "工资按月发，你按月存，存了三年。签购房合同那天，中介问你是做什么的，你说打游戏的，他愣了一下，说这行挺赚钱。",
    cond: { minMoney: 200, minSeasons: 3 }
  },
  {
    id: "m07", cat: "money", tier: 3,
    name: "冠军没换成钱",
    desc: "你拿过冠军，奖杯摆在柜子里，柜子落灰。退役那年你翻了翻账，发现冠军奖金还没一场商演多，你把账本合上，没跟任何人说。",
    cond: { maxMoney: 5, endingRank: ["A", "A-", "B+"] }
  },
  {
    id: "m08", cat: "money", tier: 3,
    name: "商业价值",
    desc: "代言从外设换到汽车，广告拍到凌晨。你不喜欢镜头，但看到报价的时候还是会点头。有粉丝说你现在不纯粹了，你回了句“你养我啊”，被截屏骂了一周。",
    cond: { minMoney: 800, minFame: 85 }
  },

  /* ================= relation 关系 ================= */
  {
    id: "r01", cat: "relation", tier: 1,
    name: "有人愿意跟你双排",
    desc: "训练赛结束别人都走了，还有个人留下来说“再来一把”。就这一句，你觉得这队没白待，回去的路上脚步都轻了点。",
    cond: { mateAff: 50 },
    reward: { tickets: 1 }
  },
  {
    id: "r02", cat: "relation", tier: 2,
    name: "队宠",
    desc: "点外卖的时候他们会问你想吃什么，复盘的时候会等你先开口，输了比赛没人怪你。你说不上来自己做了什么，可能只是在别人崩的时候没有走。",
    cond: { mateAff: 80 }
  },
  {
    id: "r03", cat: "relation", tier: 1,
    name: "一万粉",
    desc: "粉丝数破万那天你盯着数字看了很久，然后点进粉丝列表一条条翻，想看看都是些什么人。翻到一半你发现有个 ID 从你 LDL 时期就在。",
    cond: { minFans: 10000 }
  },
  {
    id: "r04", cat: "relation", tier: 2,
    name: "十万粉",
    desc: "开始有人在基地门口等你，开始有站姐拍你上下班，开始有人在超话里发你的旧照。你有点不习惯，出门会戴帽子，戴了两次就不戴了，太热。",
    cond: { minFans: 100000 }
  },
  {
    id: "r05", cat: "relation", tier: 3,
    name: "百万粉",
    desc: "百万粉的账号发一条微博要过运营，你问为什么，运营说现在你一句话能上热搜。你想起三年前发什么都没人看，忽然觉得还是那时候自在。",
    cond: { minFans: 1000000 },
    reward: { tickets: 2 }
  },
  {
    id: "r06", cat: "relation", tier: 2,
    name: "名声不脏",
    desc: "圈子里那些破事你一件没沾。有人劝过你，说就一次，没人知道；你没接话，第二天照常训练。后来那个人出事了，你什么也没说。",
    cond: { storyJustice: 15 }
  },
  {
    id: "r07", cat: "relation", tier: 3,
    name: "干净退役",
    desc: "没拿过世界冠军，没赚到大钱，退役那天也没上热搜。但老队友在评论区写了一句“这人干净”，你截图存了下来，比奖杯照片存得还久。",
    cond: { endingName: "干净的人" }
  },
  {
    id: "r08", cat: "relation", tier: 3,
    name: "更衣室教皇",
    desc: "你退役那天，队里几个小孩把你堵在门口不让走。后来你直接进了教练组，战术板第一行写的不是运营，是“别慌”。",
    cond: { endingName: "更衣室教皇" }
  },

  /* ================= absurd 整活 ================= */
  {
    id: "a01", cat: "absurd", tier: 1,
    name: "抽卡上头",
    desc: "本来只想抽一张，抽完发现券没了，钱也没了。你把手机扣在桌上，过了五分钟又拿起来，说再抽最后一次。",
    cond: { gachaCount: 30 }
  },
  {
    id: "a02", cat: "absurd", tier: 2,
    name: "十连无金",
    desc: "你开始研究凌晨抽卡是不是概率高一点，研究到三点，抽出来的还是白卡。你安慰自己说这是在垫刀，然后继续充。",
    cond: { gachaCount: 120 }
  },
  {
    id: "a03", cat: "absurd", tier: 1,
    name: "伤病体质",
    desc: "别人赛季报销是新闻，你赛季报销是常规操作。队医看见你进门就先把冰袋拿出来，连问都不用问。",
    cond: { injuryCount: 3 }
  },
  {
    id: "a04", cat: "absurd", tier: 3,
    name: "玻璃人",
    desc: "从头到脚伤了一遍，手腕、腰、膝盖、眼睛。你开玩笑说自己是被拼起来的，队医没笑，给你排了下一轮理疗。",
    cond: { injuryCount: 6 }
  },
  {
    id: "a05", cat: "absurd", tier: 2,
    name: "亏心钱",
    desc: "那几笔钱到账的时候你手是抖的，后来就习惯了。你给自己找了很多理由，最后一个都没记住，只记得夜里醒过来时房间很安静。",
    cond: { storyCorrupt: 30 }
  },
  {
    id: "a06", cat: "absurd", tier: 2,
    name: "债务缠身",
    desc: "退役那天手机最上面三条消息是三个催收。你把外设卖了，把奖牌收进箱子，坐在出租屋里算这个月还差多少。",
    cond: { endingName: "债务缠身" }
  },
  {
    id: "a07", cat: "absurd", tier: 2,
    name: "塌房",
    desc: "最后一次上热搜不是因为比赛。赞助商半夜撤物料，俱乐部发了六十字声明，评论区第一条是“早看出来了”。",
    cond: { endingName: "塌房" }
  },
  {
    id: "a08", cat: "absurd", tier: 3,
    name: "人间蒸发",
    desc: "公告只有一句话，没开发布会。你换了手机号、退了所有群，回老家开了家网吧，店名很随便。有客人认出你，你说认错人了。",
    cond: { endingName: "人间蒸发" },
    reward: { tickets: 3 }
  }
];
