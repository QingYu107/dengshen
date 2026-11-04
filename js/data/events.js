/* 《登神》事件池 —— 遵守 CONTRACT.md 第 5 节
   97 条：LDL 24 / LPL 24 / 季后赛·世界赛 18 / 通用 31
   cat: training team media money market match life drama
   eff 只用八维 + energy + money，单项 1~6，精力 ±10~20 */
window.DATA_EVENTS = [
  {
    id: "ev_ldl_first_salary", cat: "money", w: 10, once: true, year: 1, months: [1, 2],
    req: { stage: ["LDL"] },
    text: "工资到账 3000，扣掉住宿和水电，2870。你盯着那串数字看了半分钟，第一次觉得「职业选手」这个身份有了具体的价格。",
    sub: "室友凑过来看了一眼短信：可以啊，LDL 中上水平。",
    opts: [
      { t: "全转给我妈", eff: { MENTAL: 3, TEAM: 1 }, res: "你妈收了钱，在群里说儿子懂事了，然后问你什么时候回来考编。你没回，把手机扣在桌上。", risk: null },
      { t: "请全队吃烧烤", eff: { TEAM: 4, PHYS: -2, money: -0.2 }, res: "楼下烧烤摊 168 块，五个人吃到撑。打野喝多了，说明年一起上 LPL。你信了。", risk: null },
      { t: "存着，一分不花", eff: { MENTAL: 2, POOL: 1 }, res: "你存进余额宝，每天收益 0.04 元。这是你今年最稳定的正反馈。", risk: null }
    ]
  },
  {
    id: "ev_ldl_noodle", cat: "life", w: 11, once: false, year: 1,
    req: { stage: ["LDL"] },
    text: "凌晨一点，楼下那家面馆拉下了卷帘门，冰箱里只剩昨天剩的麻辣烫。打野在旁边劝你：别吃，明天训练赛手会抖。",
    sub: "他说这话的时候，自己那碗已经拆开一半了。",
    opts: [
      { t: "吃了，管他", eff: { PHYS: -4, MENTAL: 3 }, res: "你辣得直冒汗。第二天训练赛第一把，你 Q 空了三次，打野在语音里笑得直不起腰。", risk: null },
      { t: "点 68 的牛肉外卖", eff: { PHYS: 4, money: -0.05, MENTAL: 1 }, res: "骑手在楼下打电话：你们基地怎么连门牌都没有。你下楼接他，顺便吹了会儿风。", risk: null },
      { t: "饿着睡", eff: { PHYS: 3, MENTAL: -2 }, res: "你翻来覆去到三点。梦里你的野区被对面反得干干净净，连石头人都没了。", risk: null }
    ]
  },
  {
    id: "ev_ldl_kid_bro", cat: "team", w: 9, once: true, year: 1,
    req: { stage: ["LDL"] },
    text: "队里来了个 15 岁的青训，见你第一面喊了声「哥」。他行李箱上贴着一张初中物理公式的贴纸，边角已经卷了。",
    sub: "你想起自己 15 岁那年，家里人还在问你打算考哪个高中。",
    opts: [
      { t: "带他双排", eff: { TEAM: 3, GAME: 2, energy: -8 },
        res: "你带他连赢七把，他激动得手抖。第二天教练说你俩的配合比一队还顺。",
        risk: { stat: "GAME", dc: 11, ok: "你把对面的开野顺序全猜中了，他在旁边看得眼睛发亮。", bonus: { GAME: 2 } } },
      { t: "让他自己练", eff: { TEAM: -2, MECH: 2 }, res: "你说了句「少问多看」。两周后他被送回青训营，走的时候没跟你打招呼。", risk: null },
      { t: "问他家里同意吗", eff: { MENTAL: 2, FAME: 1 }, res: "他说他妈让他打完这个赛季就回去中考。你想起自己那年，家里没人问过你愿不愿意。", risk: null }
    ]
  },
  {
    id: "ev_ldl_car_review", cat: "team", w: 10, once: false, year: 1,
    req: { stage: ["LDL"] },
    text: "教练开着那辆 2013 年的卡罗拉，一边开车一边复盘。他左手扶方向盘，右手在空气里画圈：这波你为什么不跟？",
    sub: "车里有股烟味，混着一股很旧的皮革味。",
    opts: [
      { t: "跟着认错", eff: { TEAM: 2, GAME: 3, MENTAL: -2 }, res: "你说了三遍「我的」，他满意地按了两下喇叭。", risk: null },
      { t: "顶回去", eff: { GAME: 2, MENTAL: 2, TEAM: -3 },
        res: "你说那波对面打野没露头。前车刹车灯亮了，他没再讲话。",
        risk: { stat: "GAME", dc: 12, ok: "你说那波对面打野没露头，他沉默了三秒：……你说得对。然后一路没说话。", bonus: { GAME: 2 } } },
      { t: "装睡", eff: { energy: 10, GAME: -1, TEAM: -2 }, res: "你靠着车窗睡了 20 分钟。下车的时候他说：行啊，睡得挺香。", risk: null }
    ]
  },
  {
    id: "ev_ldl_snore", cat: "life", w: 10, once: false, year: 1,
    req: { stage: ["LDL"] },
    text: "室友打呼，一阵一阵，像有人在野区刷石头人。明天上午十点有 LDL 卡位战，你已经躺了两个小时。",
    sub: "你数过，他一个呼吸周期大概十四秒。",
    opts: [
      { t: "摇醒他", eff: { PHYS: 2, TEAM: -2 }, res: "他翻了个身，五分钟后重新开始。你盯着天花板到天亮。", risk: null },
      { t: "戴耳机听白噪音", eff: { PHYS: 3, MENTAL: 1 }, res: "你听了三小时雨声。梦里你在下路被人抓死，醒来发现耳机线缠在脖子上。", risk: null },
      { t: "去网吧睡", eff: { energy: -8, GAME: 2, FAME: -1 }, res: "网吧沙发一小时 8 块。你睡了四小时，醒来听见隔壁小孩在喷你的 ID。", risk: null }
    ]
  },
  {
    id: "ev_ldl_live_37", cat: "media", w: 9, once: false, year: 1,
    req: { stage: ["LDL"] },
    text: "你开了直播，进来 37 个人，其中四个是你队友。弹幕第一条问这是哪个队的，第二条回：别看了，LDL 的。",
    sub: "两条弹幕之间隔了三秒，那三秒特别长。",
    opts: [
      { t: "自嘲两句", eff: { FAME: 3, MENTAL: 2 }, res: "你说 LDL 怎么了，LDL 也是职业。弹幕飘过一句「有骨气」，然后走了 20 个人。", risk: null },
      { t: "关摄像头，练操作", eff: { MECH: 3, FAME: -1 }, res: "你练了两小时补刀。直播间剩 3 个人，其中一个是你小号。", risk: null },
      { t: "把队友拉上来连麦", eff: { TEAM: 3, FAME: 2 },
        res: "你拉了四个人。他们进了直播间，一个人都没说话，三分钟后全走了。",
        risk: { stat: "MENTAL", dc: 12, ok: "四个队友挤进来互相骂，直播间涨到 128 人。教练冲进来问你们在干嘛。", bonus: { FAME: 3 } } }
    ]
  },
  {
    id: "ev_ldl_hupu23", cat: "media", w: 10, once: false, year: 1,
    req: { stage: ["LDL"] },
    text: "打完比赛，有人把你剪成 15 秒视频，标题是「LDL 最菜中单」。播放量 1.2 万，热评第一：这人是不是走错场馆了。",
    sub: "你点开自己的镜头看了两遍，那波确实打得难看。",
    opts: [
      { t: "关手机", eff: { MENTAL: 3, FAME: -1 }, res: "你把手机塞进抽屉。第二天训练赛你打得比谁都凶，教练问你怎么了，你说没事。", risk: null },
      { t: "去评论区对线", eff: { FAME: 2, MENTAL: -4 },
        res: "你回了句「你行你上」，被截图发进四个群。评论区变成 300 条，全在笑你。",
        risk: { stat: "MENTAL", dc: 11, ok: "对方真发了个大师段位截图，评论区笑成一片，你反而涨了 2000 粉。", bonus: { FAME: 2 } } },
      { t: "剪个更狠的自黑", eff: { FAME: 4, MENTAL: 2, TEAM: -1 }, res: "你把集锦配上《二泉映月》，一晚上 8 万播放。有人开始喊你「抽象哥」。", risk: null }
    ]
  },
  {
    id: "ev_ldl_promo", cat: "match", w: 12, once: false, year: 1, months: [7, 8, 9],
    req: { stage: ["LDL"] },
    text: "LDL 季后赛最后一张门票，赢了进，输了回家。对面打野是去年从 LPL 下放下来的，赛前在群里发了句「小朋友」。",
    sub: "那三个字在群里挂了很久，没人替你们回。",
    opts: [
      { t: "开局三级越塔", eff: { LANE: 2, MECH: 2, energy: -10 },
        res: "你三级越塔，换了一个人头，然后被反杀两次。但对面下路被你们打崩了。",
        risk: { stat: "MECH", dc: 13, ok: "你三级越塔杀了对面中单，顺手把打野也带走。现场三十个人在喊你的 ID。", bonus: { FAME: 3 } } },
      { t: "按体系稳打", eff: { GAME: 3, TEAM: 2 }, res: "四十分钟，一波大龙推进，你们拿下。教练在后台长出一口气，声音都抖了。", risk: null },
      { t: "赛前回他一句叔叔好", eff: { MENTAL: 3, TEAM: -2, FAME: 1 }, res: "他连着两个失误。有些伤害是看不见的。", risk: null }
    ]
  },
  {
    id: "ev_ldl_family_job", cat: "money", w: 9, once: true, year: 1,
    req: { stage: ["LDL"] },
    text: "你妈发来一张截图：表哥考上了事业编，月薪 6800。后面跟着一句：你要是打不出来，家里也养得起你。",
    sub: "这句话听着像退路，其实是催促。",
    opts: [
      { t: "回：给我两年", eff: { MENTAL: 4, energy: -6 }, res: "你妈回了个「好」字。那天你练到凌晨五点，训练室的灯是整层楼最后一个灭的。", risk: null },
      { t: "回：明年我挣得比他多", eff: { MENTAL: 2, FAME: 1, TEAM: -1 }, res: "你妈把这句话发进了家庭群。二舅回了句「拭目以待」。你后悔了。", risk: null },
      { t: "不回", eff: { MENTAL: -3, GAME: 2 }, res: "你把手机反扣在桌上。那一晚韩服连跪七把，你把每一把都打完了。", risk: null }
    ]
  },
  {
    id: "ev_ldl_salary_late", cat: "money", w: 8, once: true, year: 1,
    req: { stage: ["LDL"] },
    text: "两个月工资没发，老板说公司在走流程。后勤大姐自己掏钱买了一袋米，说先垫着。",
    sub: "那袋米搁在厨房角落，谁都没好意思先拆。",
    opts: [
      { t: "忍着", eff: { MENTAL: -3, TEAM: 2 }, res: "你继续打。第三个月工资补上了，绩效少了 40%。", risk: null },
      { t: "找老板要", eff: { money: 0.6, TEAM: -2, MENTAL: 2 }, res: "老板当场转了 6000，说了句「年轻人急什么」。你的名字从此上了他的小本子。", risk: null },
      { t: "跟队友一起罢工", eff: { TEAM: 4, FAME: 2, GAME: -2, money: 0.6 }, res: "五个人集体不训练。第二天工资结了，教练被扣了奖金。你心里并不痛快。", risk: null }
    ]
  },
  {
    id: "ev_ldl_pc_blackout", cat: "life", w: 8, once: false, year: 1,
    req: { stage: ["LDL"] },
    text: "网吧包夜冲到一半，整个片区跳闸了。五个人蹲在门口，教练说这波不怪你们。",
    sub: "黑暗中有人打开手机手电，照着一地散落的键盘线。",
    opts: [
      { t: "打车回基地继续", eff: { MECH: 2, energy: -14, money: -0.03 }, res: "凌晨三点回到基地，五个人挤在一台机器上轮流打。天亮的时候你比谁都清醒。", risk: null },
      { t: "就地睡大厅", eff: { energy: 12, POOL: -1 }, res: "你在网吧大厅睡到早上，被保洁阿姨拍醒：小伙子，上班了。", risk: null },
      { t: "两箱啤酒坐马路牙子", eff: { TEAM: 4, MENTAL: 3, PHYS: -3 },
        res: "你们喝到四点。有人喝多了开始骂教练，你劝不住，第二天全队被罚跑圈。",
        risk: { stat: "TEAM", dc: 10, ok: "你们喝到四点，聊到明年。有人说打不上去就去送外卖。这句话你记了很多年。", bonus: { TEAM: 3 } } }
    ]
  },
  {
    id: "ev_ldl_lpl_scout", cat: "market", w: 8, once: true, year: 1, months: [6, 7, 8],
    req: { stage: ["LDL"] },
    text: "一个穿西装的人站在训练室门口，自称 LPL 某队的选手事务。他看完了你们整场训练赛，记了三页纸。",
    sub: "他的笔一直在动，动得你有点紧张。",
    opts: [
      { t: "打得更凶给他看", eff: { FAME: 3, LANE: 2, TEAM: -2 },
        res: "你压得很凶，也被抓了三次。西装男合上本子，什么都没说。",
        risk: { stat: "LANE", dc: 12, ok: "你压了对面中单两级。西装男走的时候，拍了拍教练的肩膀。", bonus: { FAME: 2 } } },
      { t: "稳住，按计划打", eff: { GAME: 3, MENTAL: 2 }, res: "全场数据不亮眼，一句多余的话都没有。西装男在纸上写了两个字：稳。", risk: null },
      { t: "赛后直接递简历", eff: { FAME: 2, TEAM: -2, MENTAL: -1 }, res: "他说：我们看的是三年，不是一场。然后把简历塞回你手里。", risk: null }
    ]
  },
  {
    id: "ev_ldl_coach_insult", cat: "team", w: 9, once: true, year: 1,
    req: { stage: ["LDL"] },
    text: "训练赛 0-8，教练把耳机摔在桌上，指着屏幕骂：你这脑子是不是网吧捡回来的？我他妈养条狗都比你听话。",
    sub: "训练室里没人敢动，连空调的风声都听得见。",
    opts: [
      { t: "低头不说话", eff: { MENTAL: -4, TEAM: 1 }, res: "全场安静。你低头看着自己的手指，指甲缝里还有昨天烧烤的油。", risk: null },
      { t: "顶回去", eff: { MENTAL: 2, TEAM: -4, FAME: 1 },
        res: "他愣了两秒，转头对经理说：这个人我不要了。",
        risk: { stat: "TEAM", dc: 12, ok: "你说：那你别带我打。他愣了半天，最后把耳机捡起来了。队友低着头在笑。", bonus: { TEAM: 2 } } },
      { t: "咽下去，记本子上", eff: { GAME: 3, MENTAL: 2, TEAM: -2 }, res: "你写下那句话、日期、时间。三个月后翻出来看，发现自己已经不在乎了。", risk: null }
    ]
  },
  {
    id: "ev_ldl_duo_emo", cat: "team", w: 9, once: true, year: 1,
    req: { stage: ["LDL"] },
    text: "凌晨两点，打野发来一条 58 秒语音。开头是「哥……我是不是不适合打职业」，后面 50 秒都是呼吸声。",
    sub: "你把那条语音听了两遍，第二遍才听出他在忍。",
    opts: [
      { t: "直接打过去", eff: { TEAM: 3, MENTAL: 2, energy: -8 }, res: "你们聊了 47 分钟。他哭了，你没笑他。", risk: null },
      { t: "回：明天说", eff: { TEAM: -3, MENTAL: 1, energy: 6 }, res: "第二天他没提，你也装作忘了。后来你们再也没单独聊过。", risk: null },
      { t: "转发给教练", eff: { TEAM: -4, GAME: 2, MENTAL: -1 }, res: "教练第二天找他谈了一个小时。他回来之后，看你的眼神变了。", risk: null }
    ],
    next: { flag: "duo_emo", id: "ev_ldl_duo_talk" }
  },
  {
    id: "ev_ldl_duo_talk", cat: "team", w: 7, once: true, year: 1,
    req: { stage: ["LDL"] },
    text: "打野把椅子搬到你这排，说想聊聊。他手里握着那瓶已经喝空的矿泉水，捏得瓶身一直在响。",
    sub: "他坐了半分钟，第一句话还没想好。",
    opts: [
      { t: "陪他复盘到天亮", eff: { TEAM: 3, GAME: 3, energy: -10 }, res: "四点钟，他说：哥，我想再打一年。你说好。", risk: null },
      { t: "劝他去看心理医生", eff: { TEAM: 2, MENTAL: 3, PHYS: 3 }, res: "他真的去了。回来没说结果，只是开始按时吃饭。", risk: null },
      { t: "告诉他这就是工作", eff: { TEAM: -2, MENTAL: 2, GAME: 1 }, res: "你说：哭完了明天还要打。他点点头，把矿泉水瓶捏扁了。", risk: null }
    ]
  },
  {
    id: "ev_ldl_patch_nerf", cat: "training", w: 11, once: true, year: 1,
    req: { stage: ["LDL"] },
    text: "版本更新，你的绝活被削了，大招伤害 −15%，被动 CD 加两秒。你把补丁说明看了三遍，确认那不是幻觉。",
    sub: "第三遍看完，你甚至想给客服写封邮件。",
    opts: [
      { t: "连夜练新英雄", eff: { POOL: 4, energy: -16 }, res: "你在训练模式待了 6 小时，手已经麻了。新英雄只练到「不送」的水平。", risk: null },
      { t: "硬玩绝活", eff: { MECH: 2, LANE: 2, POOL: -2 }, res: "你用被削的英雄照样压了对面三级。评论区：这人是不是不会版本。", risk: null },
      { t: "找教练要版本答案", eff: { GAME: 3, POOL: 2, TEAM: -1 }, res: "教练发来 8 个英雄和一堆韩服录像。你看到凌晨三点，记住了其中 3 个。", risk: null }
    ],
    next: { flag: "patch_nerf", id: "ev_ldl_patch_grind" }
  },
  {
    id: "ev_ldl_patch_grind", cat: "training", w: 8, once: true, year: 1,
    req: { stage: ["LDL"] },
    text: "下周打头名，教练说你就用新阵容，输了算我的。你练的那个英雄胜率 43%，评价是「打不动团」。",
    sub: "这句话他说得很轻松，你听着一点都不轻松。",
    opts: [
      { t: "信教练", eff: { POOL: 3, TEAM: 2, MENTAL: 2 },
        res: "比赛里你把这个英雄玩出了名场面，自己也吓了一跳。",
        risk: { stat: "MECH", dc: 12, ok: "二路解说当场改口：这谁教他的？弹幕全在问英雄名。", bonus: { FAME: 3 } } },
      { t: "偷偷练回绝活", eff: { LANE: 2, MECH: 2, TEAM: -3 }, res: "你上了场选了绝活，教练在后台摔了耳机。赢了，但他两天没跟你说话。", risk: null },
      { t: "两套混着用", eff: { GAME: 4, POOL: 2, energy: -8 }, res: "你研究出一套过渡打法。BP 的时候对面教练愣了一下，你先想明白了。", risk: null }
    ]
  },
  {
    id: "ev_ldl_fan_first", cat: "media", w: 8, once: true, year: 1,
    req: { stage: ["LDL"] },
    text: "基地门口来了两个女生，举着一块手绘的牌子，上面写你的 ID。那是你打职业以来第一次有人来找你。",
    sub: "牌子的边是用胶带粘的，字写得歪歪扭扭。",
    opts: [
      { t: "出去合影签名", eff: { FAME: 4, MENTAL: 3, GAME: -1 }, res: "你签了 11 个名字，最后一个签歪了。她们说会从 LDL 一路看你上去。", risk: null },
      { t: "让后勤去说我不在", eff: { FAME: -2, MENTAL: 2, MECH: 2 }, res: "你继续排位。半小时后后勤姐说：人家在门口站了一个小时，走了。", risk: null },
      { t: "请她们进来看看", eff: { FAME: 3, TEAM: -2, MENTAL: 1 }, res: "两个人拍了 40 张照片发超话。经理第二天说：以后别带人进训练室。", risk: null }
    ]
  },
  {
    id: "ev_ldl_shotcall", cat: "team", w: 10, once: false, year: 1,
    req: { stage: ["LDL"] },
    text: "打团前 3 秒，你跟辅助同时开口喊「这波开」。两个人都喊了，队伍分成两半，团灭。",
    sub: "复盘的时候，那三秒被反复放了很多遍。",
    opts: [
      { t: "赛后交出指挥权", eff: { TEAM: 3, GAME: 1, MENTAL: -2 }, res: "你看着辅助喊。那波他喊对了，你心里有点不是滋味。", risk: null },
      { t: "抢到底", eff: { TEAM: -3, GAME: 3, MENTAL: 2 }, res: "下一把你先喊，喊得又快又准。队友开始听你的，辅助闭麦了。", risk: null },
      { t: "定规矩：谁先喊谁算", eff: { TEAM: 4, GAME: 2 },
        res: "你们没定成。第二周又团灭了一次，教练把你们俩关在会议室吵了半小时。",
        risk: { stat: "TEAM", dc: 11, ok: "你们发明了一个暗号。三周后，你们成了 LDL 团战失误最少的队伍。", bonus: { TEAM: 2 } } }
    ]
  },
  {
    id: "ev_ldl_kr_jungler", cat: "team", w: 8, once: false, year: 1,
    req: { stage: ["LDL"] },
    text: "队里来了个韩国打野，第一天打招呼只会说「你好」。训练赛里他一直喊一个词，没人懂，后来翻译说那是「撤」。",
    sub: "那局你们没撤，被团灭了两次。",
    opts: [
      { t: "学三个韩语指令", eff: { TEAM: 3, GAME: 2, PHYS: -2 }, res: "你背了「撤、上、龙」。从那天起，你们的配合快了 1.5 秒。", risk: null },
      { t: "让教练改打法", eff: { GAME: 3, TEAM: -2, POOL: 1 }, res: "你们改成前期各玩各的。赢了几把，也埋了几颗雷。", risk: null },
      { t: "靠表情包交流", eff: { TEAM: 2, FAME: 2, GAME: -1 },
        res: "你们用 12 个表情包建了套暗号，全队笑疯了。有人把聊天记录发到网上，上了小热搜。",
        risk: { stat: "TEAM", dc: 10, ok: "你们打出了这赛季最好的一场团战。赛后他发了七个表情包，最后一个是你。", bonus: { TEAM: 2 } } }
    ]
  },
  {
    id: "ev_ldl_keyboard", cat: "life", w: 8, once: true, year: 1,
    req: { stage: ["LDL"] },
    text: "比赛前两小时，你的键盘 W 键卡住了。那是你用了三年的键盘，键帽上磨出一个坑，坑的形状跟你的指腹正好对上。",
    sub: "你按了三下，它只回你两下。",
    opts: [
      { t: "借工作人员的", eff: { LANE: -2, MENTAL: -2, PHYS: 2 }, res: "新键盘的手感像踩在棉花上。第一把你按空了两次闪现，队友问你在干嘛。", risk: null },
      { t: "用队友的备用键盘", eff: { TEAM: 2, MENTAL: 2 }, res: "打野把备用键盘扔给你：用吧，输了算我的。第一把你打得像换了个人。", risk: null },
      { t: "冲出去买", eff: { money: -0.1, MENTAL: 3, energy: -6 }, res: "你打车到最近的数码店，买了同款。回来刚好赶上检录，满头汗。", risk: null }
    ]
  },
  {
    id: "ev_ldl_penta", cat: "match", w: 9, once: true, year: 1, months: [7, 8, 9],
    req: { stage: ["LDL"] },
    text: "半决赛，你在二塔前拿到四杀，第五个人还有三秒复活。全场三十几个人在喊你的 ID，声音大得不像 LDL。",
    sub: "这三秒里，你脑子里已经算完了泉水的位置。",
    opts: [
      { t: "抢五杀", eff: { FAME: 4, MECH: 2, TEAM: -2 },
        res: "你冲进泉水，被塔打了两下，人头没拿到。队友笑了一整晚。",
        risk: { stat: "MECH", dc: 12, ok: "你冲进泉水收了第五个人，队友在语音里骂你，但全场的欢呼是真的。", bonus: { FAME: 4 } } },
      { t: "让给 ADC", eff: { TEAM: 4, MENTAL: 2, FAME: -1 }, res: "ADC 拿到五杀，赛后采访全在谢你。你把那句「谢谢」听成了别的。", risk: null },
      { t: "直接拆塔", eff: { GAME: 3, TEAM: 2, FAME: 2 }, res: "你带着队友把水晶点掉了。赛后教练说：你今天像个队长。", risk: null }
    ]
  },
  {
    id: "ev_ldl_qualifier_eve", cat: "match", w: 10, once: true, year: 1, months: [8, 9],
    req: { stage: ["LDL"] },
    text: "资格赛前一晚，基地停电了。五个人坐在黑暗里，谁也不说话，后来有人开始唱跑调的歌。",
    sub: "唱的是《海阔天空》，调跑到隔壁小区去了。",
    opts: [
      { t: "带头唱完", eff: { TEAM: 4, MENTAL: 3, PHYS: -4 }, res: "五个人在黑暗里唱到 12 点。第二天你们打出了赛季最好的一场。", risk: null },
      { t: "回房间把对手想一遍", eff: { MENTAL: 3, GAME: 2, TEAM: -1 }, res: "第二天的 BP，你比教练早 20 秒说出答案。", risk: null },
      { t: "给对手发微信挑衅", eff: { FAME: 2, MENTAL: 2, TEAM: -1 },
        res: "对面打野回了句「明天见」。你一夜没睡好，脑子里全是他的回城动画。",
        risk: { stat: "MENTAL", dc: 11, ok: "他回了句「怕了？」。你笑了一下，把手机扔一边，睡了七个小时。", bonus: { MENTAL: 3 } } }
    ]
  },
  {
    id: "ev_ldl_lpl_offer", cat: "market", w: 10, once: true, year: 1, months: [8, 9, 10],
    req: { stage: ["LDL"] },
    text: "LPL 那支队又来人了，这次带着合同。年薪 60 万，签三年，替补起步。他说：来了就打 LPL，不用再挤五人宿舍。",
    sub: "「五人宿舍」四个字，他说得像在提醒你什么。",
    opts: [
      { t: "签", eff: { money: 20, FAME: 3, MENTAL: -2 }, res: "你签了字。回去的路上你给家里打电话，声音在抖。", risk: null },
      { t: "先问有没有上场保证", eff: { GAME: 2, MENTAL: 2, FAME: 1 }, res: "对方笑了：小伙子，我们没这个说法。你把笔放下，说再想想。", risk: null },
      { t: "拒绝，留队当核心", eff: { TEAM: 4, FAME: 2, money: 3 },
        res: "你留了下来，队里给你加了 500 块。那年你们冲进了资格赛。",
        risk: { stat: "MENTAL", dc: 12, ok: "经理第一次跟你谈条件。你说：我要打核心。他想了想，说行。", bonus: { MENTAL: 2 } } }
    ]
  },
  {
    id: "ev_lpl_debut", cat: "match", w: 14, once: true, year: 2, months: [1, 2, 3],
    req: { stage: ["LPL"] },
    text: "LPL 首秀，对面中单拿过两个 MSI 冠军。开赛前他走过来，拍了拍你的肩膀，说：别紧张。",
    sub: "他的手很轻，拍完就走了，留你一个人站在原地。",
    opts: [
      { t: "开局就强压", eff: { LANE: 3, MECH: 2, MENTAL: -2 },
        res: "你压了他 20 刀，然后被一个绕后单杀。他起身的时候笑了一下。",
        risk: { stat: "LANE", dc: 13, ok: "第一波对拼你赢了他。转播镜头给了你 5 秒，解说在念你的 ID。", bonus: { FAME: 3 } } },
      { t: "按体系稳打", eff: { GAME: 3, TEAM: 2 }, res: "全场没什么亮点，但你一次没死。教练看回放说：这就够了。", risk: null },
      { t: "采访放狠话", eff: { FAME: 4, MENTAL: 2, TEAM: -2 }, res: "你说他老了。这句话被剪成 8 秒视频，播放量 40 万。第二天你被教育了。", risk: null }
    ]
  },
  {
    id: "ev_lpl_bench", cat: "team", w: 12, once: false, year: 2,
    req: { stage: ["LPL"] },
    text: "你连输两把，教练在群里发了句：明天换人。替补中单是个 21 岁的韩援，来队两个月，一句话没跟你说过。",
    sub: "他搬进训练室那天，连椅子都换成了自己的。",
    opts: [
      { t: "去看替补怎么打", eff: { GAME: 3, TEAM: 2, MENTAL: -2 }, res: "你站在他身后看了四把。他打得比你好。你第一次觉得自己不是主角。", risk: null },
      { t: "找教练要解释", eff: { FAME: 2, TEAM: -3, MENTAL: 2 },
        res: "你说：给我一场。教练盯着你说：你已经有三场了。",
        risk: { stat: "MENTAL", dc: 12, ok: "他沉默了一会儿，说：下一场，你先上。这句话你记了很久。", bonus: { TEAM: 2 } } },
      { t: "发微博：我还能打", eff: { FAME: 3, TEAM: -4, MENTAL: -1, money: -0.5 }, res: "粉丝在评论区撕起来。俱乐部市场部找你要说法，罚了你 5000。", risk: null }
    ]
  },
  {
    id: "ev_lpl_369", cat: "drama", w: 10, once: false, year: 3,
    req: { stage: ["LPL"] },
    text: "对上 TES，数据组说对面 369 最近的评分是 3、9、3、6。意思是，你要赌今天来的是哪一个。",
    sub: "骰子在他手里，你只能先把自己的那份准备好。",
    opts: [
      { t: "当他是 9 来准备", eff: { GAME: 3, energy: -20 }, res: "你把他最强状态的对线细节研究了一遍。结果今天他是 3，你打得像在打空气。", risk: null },
      { t: "当他是 3 来打", eff: { LANE: 2, MECH: 2, TEAM: -1 },
        res: "他摇到了 9。你被单杀两次，弹幕刷「他今天不是 369，他是 999」。",
        risk: { stat: "LANE", dc: 13, ok: "他今天摇到了 3。你压了他 40 刀，赛后有人把你的对线数据做成了图。", bonus: { LANE: 2 } } },
      { t: "不看数据，打自己的", eff: { MENTAL: 3, GAME: 2, POOL: -1 }, res: "你把他拖进团战。赛后有人在群里说：这人不看骰子。", risk: null }
    ]
  },
  {
    id: "ev_lpl_doinb", cat: "media", w: 10, once: true, year: 3,
    req: { stage: ["LPL"] },
    text: "Doinb 在直播里点评你，说了 14 分钟，语速比你补刀还快。结论是这个人有东西，但是不敢打，后面还补一句：Rookie 在我面前都不敢这样。",
    sub: "直播间两万多人，弹幕一直在刷你的 ID。",
    opts: [
      { t: "去他直播间连麦", eff: { FAME: 5, MENTAL: -2, TEAM: -1 },
        res: "你连麦了 12 分钟，被他讲得插不上话。下播涨了 3 万粉。",
        risk: { stat: "MENTAL", dc: 12, ok: "你反问他一句，他愣了两秒，然后直播间炸了。当晚你上了热搜。", bonus: { FAME: 3 } } },
      { t: "剪一段回怼", eff: { FAME: 4, TEAM: -2, MENTAL: 1 }, res: "你发了条 30 秒视频：他说的对，我确实不敢打，我不敢打着打着就退役。评论区爆了。", risk: null },
      { t: "关掉，让他说", eff: { MENTAL: 3, MECH: 2 }, res: "你练了两小时。三天后你赢了他所在的队，直播里他改口了。", risk: null }
    ]
  },
  {
    id: "ev_lpl_chovy", cat: "training", w: 11, once: true, year: 3,
    req: { stage: ["LPL"] },
    text: "数据组贴出一张图：Chovy 场均补刀 10.4，你 8.1。分析师说这不是手的问题，是他每一波都算好了。",
    sub: "那张图贴在你储物柜正对面，你每天换衣服都得看一遍。",
    opts: [
      { t: "练补刀练到死", eff: { LANE: 4, MECH: 2, energy: -18 }, res: "你在训练模式刷了 6 小时。三天后数据到了 9.2，手腕开始疼。", risk: null },
      { t: "学他的兵线理解", eff: { GAME: 3, LANE: 2, energy: -8 }, res: "你把他的 20 场录像拉成表格，发现他放弃了很多次支援。你开始学着放弃。", risk: null },
      { t: "补刀不重要，我要打团", eff: { MECH: 2, TEAM: 3, LANE: -2 }, res: "你打出全场最高伤害，也漏了 60 刀。二路解说：这人是个疯子。", risk: null }
    ]
  },
  {
    id: "ev_lpl_beryl", cat: "life", w: 9, once: true, year: 3,
    req: { stage: ["LPL"] },
    text: "对面辅助赛前两小时还在打原神，直播间 1.2 万人在看。那是 BeryL，教练说别管他，这是他的仪式。",
    sub: "你盯着他的抽卡界面看了半分钟，忽然有点羡慕。",
    opts: [
      { t: "也开一把放松", eff: { MENTAL: 3, PHYS: 2, POOL: -1 }, res: "你抽了个十连，出了个紫。比赛里你打得异常放松，赢了自己那条线。", risk: null },
      { t: "研究他的英雄池", eff: { GAME: 3, POOL: 2, energy: -6 }, res: "你把他的辅助录像看了一遍，发现他从来不按常规出装。你在心里骂了句天才。", risk: null },
      { t: "要求 ban 他的怪辅助", eff: { TEAM: 2, GAME: 2, MENTAL: -1 }, res: "教练照做了，用掉两个 ban 位。BeryL 掏出第三个，笑了一笑。", risk: null }
    ]
  },
  {
    id: "ev_lpl_knight", cat: "drama", w: 10, once: true, year: 3,
    req: { stage: ["LPL"] },
    text: "赛前采访，记者问：都说 knight 大赛软，你怎么看？话筒递到你面前，摄像机的红灯已经亮了。",
    sub: "台下有人咳嗽了一声，安静得能听见。",
    opts: [
      { t: "说他有 MSI 冠军", eff: { FAME: 2, MENTAL: 2, TEAM: 1 }, res: "弹幕刷起了「有素质」。也有 300 条在骂你舔。", risk: null },
      { t: "打场上见", eff: { FAME: 3, MENTAL: 3 }, res: "这句被剪成金句。三天后你在中路被他打爆，评论区把那句话贴在了下面。", risk: null },
      { t: "说我是来替他位置的", eff: { FAME: 4, MENTAL: -2, TEAM: -1 },
        res: "热搜挂了三个小时。你的超话从 800 涨到 4 万，一半是来骂你的。",
        risk: { stat: "MENTAL", dc: 13, ok: "你赢了那场对位。全网开始用另一种语气念你的 ID。", bonus: { FAME: 4 } } }
    ]
  },
  {
    id: "ev_lpl_xiaohu", cat: "media", w: 9, once: false, year: 3,
    req: { stage: ["LPL"] },
    text: "对面中单是 Xiaohu。解说已经开始念他的世界赛数据了，弹幕刷：又到了这一年。",
    sub: "你听着解说的语速，忽然觉得这场馆比平时冷。",
    opts: [
      { t: "赛前跟他说句话", eff: { MENTAL: 3, TEAM: 2, FAME: 1 }, res: "你说：虎哥，今天别紧张。他愣了一下，笑了。全场只有你们两个人懂这个笑。", risk: null },
      { t: "抓他的失误打", eff: { GAME: 3, MECH: 2, TEAM: -1 }, res: "第一波你就逮着他的失误，全场他死了 5 次。赛后有人说你没品。", risk: null },
      { t: "什么都不想", eff: { MECH: 3, MENTAL: 2 }, res: "你把注意力全放在补刀上。打完才发现，你赢了他 40 刀。", risk: null }
    ]
  },
  {
    id: "ev_lpl_theshy", cat: "match", w: 11, once: false, year: 3,
    req: { stage: ["LPL"] },
    text: "对面上单是 TheShy。教练在白板上写：他一定会来送。问题是，是他先送你，还是你先死。",
    sub: "白板上的字写得很重，笔尖把板面压出了印子。",
    opts: [
      { t: "跟他刚", eff: { LANE: 3, MECH: 2, TEAM: -1 },
        res: "你们在边线打了 40 秒，两个人残血回家。全世界的上单都在看这一波。",
        risk: { stat: "MECH", dc: 13, ok: "你单杀了他。全场炸了，解说破音喊出你 ID 的最后三个字。", bonus: { FAME: 5 } } },
      { t: "不跟他玩，帮下路", eff: { GAME: 3, TEAM: 3, LANE: -2 }, res: "TheShy 单带掉了两座塔，但你们赢了。赛后他说了句：聪明的打法。", risk: null },
      { t: "蹲他，等他送", eff: { GAME: 4, MECH: 1 }, res: "你在草丛里蹲了 90 秒。他果然来了。你收下人头，在心里说了句：果然。", risk: null }
    ]
  },
  {
    id: "ev_lpl_uzi", cat: "media", w: 9, once: true, year: 3,
    req: { stage: ["LPL"] },
    text: "后台遇到 Uzi。他看了你一眼，说打得不错，别学我。走廊很吵，但你听清了后半句：别拿亚军拿习惯了。",
    sub: "他说完就走了，你站在原地想了很久。",
    opts: [
      { t: "问他决赛怎么打", eff: { GAME: 3, MENTAL: 3, FAME: 1 }, res: "他讲了 20 分钟，最后一句是：那年我们其实能赢。他没再说话。", risk: null },
      { t: "把这话转给队友", eff: { TEAM: 3, MENTAL: 2 }, res: "你在队会上复述了一遍，全队沉默。那周训练时长多了两个小时。", risk: null },
      { t: "笑回：我先拿个冠军", eff: { FAME: 4, MENTAL: -2 }, res: "他愣了一下，说：行，我等着。这句话你记了一整个赛季。", risk: null }
    ]
  },
  {
    id: "ev_lpl_faker", cat: "match", w: 9, once: true, year: 3,
    req: { stage: ["LPL"] },
    text: "韩服排位，你排到了 Faker。同队两个人在公屏打了一句「这局不许输」。",
    sub: "你在加载界面反复看了三遍他的 ID。",
    opts: [
      { t: "跟着他的节奏打", eff: { GAME: 3, TEAM: 2, FAME: 2 }, res: "他打完在公屏打了句「good」。你截图存了三年。", risk: null },
      { t: "抢他的线，打自己的", eff: { LANE: 3, MECH: 2, TEAM: -2 }, res: "你吃了他的两波线，他什么都没说。结束后他把你加了好友。", risk: null },
      { t: "认真打赢这把", eff: { MECH: 3, MENTAL: 3, energy: -10 },
        res: "你打了 42 分钟，输在他最后一波开团。你截了图，但没发。",
        risk: { stat: "MECH", dc: 14, ok: "你赢在最后一波团。你截了图，还是没发。但那一晚你睡不着。", bonus: { MENTAL: 3 } } }
    ]
  },
  {
    id: "ev_lpl_boss_game", cat: "team", w: 9, once: true, year: 2,
    req: { stage: ["LPL"] },
    text: "老板带着三个朋友来基地，说想打一把高端局，让你陪同。他朋友一上来就选亚索，说我玩这个很秀。",
    sub: "你看了眼他的段位，黄铜三。",
    opts: [
      { t: "全程保老板", eff: { money: 2, TEAM: -3, MENTAL: -2 }, res: "你演得很到位，老板赢了很开心，当场加了你 2 万奖金。队友在群里发了三个省略号。", risk: null },
      { t: "认真打，打崩对面", eff: { MECH: 2, FAME: 2, TEAM: -2, money: -1 }, res: "你在 18 分钟结束了游戏。老板的朋友脸都黑了。老板说：年轻人有胜负心是好事。", risk: null },
      { t: "开小号装菜", eff: { money: 1, FAME: -1, MENTAL: 2 }, res: "你故意送了两波，老板说：原来职业选手也这样啊。你笑了，笑得有点难看。", risk: null }
    ]
  },
  {
    id: "ev_lpl_manager_pie", cat: "money", w: 11, once: true, year: 2, months: [11, 12],
    req: { stage: ["LPL"] },
    text: "经理把一份三年合同推过来，第一页写着「违约金 800 万」。他说签吧，凭你也找不到更好的，你才二十岁，最不缺的就是时间。",
    sub: "合同边上压着一支笔，笔帽已经摘好了。",
    opts: [
      { t: "签", eff: { money: 10, MENTAL: -3, TEAM: 1 }, res: "你签了。他握着你的手说以后就是一家人。你注意到桌上还有另一份合同，签名是另一个中单。", risk: null },
      { t: "叫经纪人来谈", eff: { GAME: 2, MENTAL: 2, money: -1 }, res: "经纪人把违约金从 800 万砍到 300 万。经理从此对你客气了一点。", risk: null },
      { t: "先拖着", eff: { MENTAL: 2, TEAM: -3, POOL: 1 }, res: "你说回去想想。第二天替补中单的训练时间多了一倍。", risk: null }
    ]
  },
  {
    id: "ev_lpl_live_trashtalk", cat: "media", w: 12, once: true, year: 2, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    req: { stage: ["LPL"] },
    text: "直播里你说对面打野的操作像你奶奶，这句话被剪成了 15 秒，一晚上 26 万播放。对面的超话已经在组织「抵制暴力语言」了。",
    sub: "你当时只是随口一说，说完自己还笑了一下。",
    opts: [
      { t: "开播道歉", eff: { FAME: -2, TEAM: 2, MENTAL: -2 }, res: "你鞠了个 90 度的躬，弹幕在刷「好孩子」。第二天对面打野发微博：谁没年轻过。", risk: null },
      { t: "硬刚", eff: { FAME: 4, TEAM: -2, MENTAL: 2 }, res: "你说：我说的是实话，我奶奶补刀都比他准。凌晨三点，词条上了热搜第 11。", risk: null },
      { t: "装死", eff: { FAME: -1, MENTAL: 1, TEAM: 1 }, res: "你一条微博没发。三天后热度自己下去了，但「奶奶」两个字从此跟着你。", risk: null }
    ],
    next: { flag: "live_out", id: "ev_lpl_live_talked" }
  },
  {
    id: "ev_lpl_live_talked", cat: "team", w: 9, once: true, year: 2, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    req: { stage: ["LPL"] },
    text: "经理把手机推到你面前，屏幕上是联盟的书面警告。他说俱乐部罚你 5 万，或者你自己发个检讨，我们压下去。",
    sub: "他说话的时候，一直在看手机屏幕，没看你。",
    opts: [
      { t: "认罚，掏钱", eff: { money: -5, TEAM: 3, FAME: -2 }, res: "5 万从工资里扣了三个月。经理说：这次记住了吧。你说记住了。", risk: null },
      { t: "发检讨", eff: { FAME: -3, TEAM: 2, MENTAL: -2 }, res: "检讨 800 字，你写了三个小时。评论区说：这人道歉还挺有诚意。", risk: null },
      { t: "去联盟申诉", eff: { FAME: 3, TEAM: -4, MENTAL: 3 },
        res: "你把材料交上去，半个月没消息。经理看你的眼神越来越冷。",
        risk: { stat: "MENTAL", dc: 13, ok: "你带着录像去了联盟。半个月后只有口头警告。经理再没在会上点你的名。", bonus: { FAME: 3 } } }
    ],
    next: { flag: "live_out2", id: "ev_lpl_live_fine" }
  },
  {
    id: "ev_lpl_live_fine", cat: "money", w: 8, once: true, year: 2, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    req: { stage: ["LPL"] },
    text: "事情过去一个月，直播间人气翻了一倍。新来的商务说：黑红也是红，我们接了个键盘广告。",
    sub: "他把脚本推过来的时候，笑得特别自然。",
    opts: [
      { t: "接", eff: { money: 8, FAME: 3, TEAM: -2 }, res: "广告词是「嘴硬不如轴硬」。你念完自己都笑了。队友在群里发了个「你行」。", risk: null },
      { t: "不接，专心打", eff: { FAME: -2, MECH: 3, MENTAL: 2 }, res: "你推了单子。商务说你不懂事。三个月后你打出身价，他回来找你。", risk: null },
      { t: "接，但改成公益", eff: { FAME: 4, money: 2, TEAM: 2 }, res: "广告变成了给山区学校捐键盘。评论区一半在夸，一半说你作秀。你已经不在乎了。", risk: null }
    ]
  },
  {
    id: "ev_lpl_contract_trap", cat: "market", w: 10, once: true, year: 2, months: [11, 12],
    req: { stage: ["LPL"] },
    text: "转会期，一家新队开出三倍年薪。合同第 7 条：未进季后赛，工资减半。第 12 条：乙方需配合一切商业活动，包括但不限于直播、代言、线下。",
    sub: "那两条的字体比别处小一号，像故意缩进去的。",
    opts: [
      { t: "签，钱多", eff: { money: 40, TEAM: -2, MENTAL: -2 }, res: "签字那天你数了三遍零。半年后你才知道「一切商业活动」包括给网吧剪彩。", risk: null },
      { t: "找律师逐条改", eff: { money: -2, GAME: 2, MENTAL: 3 }, res: "律师改了 9 处。对方说：这么多改动，我们要重新考虑。最后他们还是签了。", risk: null },
      { t: "不签，留队", eff: { TEAM: 4, FAME: -1, money: 5 }, res: "老东家给你涨了 20%。你在熟悉的地方又待了一年，也开始怀疑自己是不是没野心。", risk: null }
    ],
    next: { flag: "contract_trap", id: "ev_lpl_agent_lawyer" }
  },
  {
    id: "ev_lpl_agent_lawyer", cat: "market", w: 7, once: true, year: 2, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    req: { stage: ["LPL"] },
    text: "半年后，那支队降级了，跟你同期过去的两个人被欠了七个月工资。其中一个给你打电话，第一句是：兄弟，你运气真好。",
    sub: "他说「运气」的时候，声音有点哑。",
    opts: [
      { t: "帮他找律师", eff: { FAME: 3, TEAM: 3, money: -2 }, res: "你垫了律师费。半年后钱要回来一半。他把这事发到网上，你多了个「讲义气」的标签。", risk: null },
      { t: "只请他吃顿饭", eff: { TEAM: 1, MENTAL: 2, money: -1 }, res: "你们喝到凌晨。他说早知道就听你的。你说：你当时也没得选。", risk: null },
      { t: "讲给经理听，让他记住", eff: { GAME: 3, TEAM: -1, money: 2 }, res: "经理听完沉默了一会儿，给你加了个出场奖条款。你第一次觉得谈判也是技术。", risk: null }
    ]
  },
  {
    id: "ev_lpl_matchfix", cat: "drama", w: 8, once: true, year: 2, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    req: { stage: ["LPL"] },
    text: "有人加你微信，头像是辆保时捷。第一句：兄弟，明天那场，别赢太快。后面跟了六个数字。",
    sub: "你把那六个数字数了两遍，确认是万。",
    opts: [
      { t: "拒绝并截图", eff: { MENTAL: 3, FAME: 2, TEAM: -1 }, res: "你把截图发给领队。三天后联盟调查组来了，你在会议室坐了四个小时。", risk: null },
      { t: "犹豫，先加着", eff: { MENTAL: -3, FAME: -1, money: 1 }, res: "你收了 1 万「聊天费」。接下来两周，你每天都没睡好。", risk: null },
      { t: "直接举报给联盟", eff: { FAME: 4, MENTAL: 4, TEAM: -2 },
        res: "联盟发了公告，全网夸你。你也从此成了某些人名单上的名字。",
        risk: { stat: "MENTAL", dc: 13, ok: "联盟第二天就回复了你。公告挂出来的时候，你在训练室里看了三遍。", bonus: { MENTAL: 3 } } }
    ],
    next: { flag: "matchfix", id: "ev_lpl_matchfix_probe" }
  },
  {
    id: "ev_lpl_matchfix_probe", cat: "drama", w: 7, once: true, year: 2, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    req: { stage: ["LPL"] },
    text: "调查组第二次找你，把那份微信记录打印出来了。对面坐着两个人：一个记笔录，一个不说话。",
    sub: "那个不说话的人一直在看你，看得你后背发凉。",
    opts: [
      { t: "全说了", eff: { MENTAL: 2, FAME: 2, TEAM: -2 }, res: "你讲了两个小时，签了 11 页。回基地的时候，走廊里的队友都看着你。", risk: null },
      { t: "只说自己没参与", eff: { MENTAL: -2, GAME: 2 },
        res: "他们把笔录念给你听，念到一半你手心出汗。最后记了一句「配合调查」。",
        risk: { stat: "MENTAL", dc: 13, ok: "你的语气很稳。出来的时候，那个不说话的人说了句：谢谢配合，态度不错。", bonus: { MENTAL: 2 } } },
      { t: "反问他们要证据", eff: { MENTAL: 3, FAME: 1, TEAM: -3 }, res: "你说：我拒绝了，你们查我干嘛。那个人第一次抬头看你，说：好。", risk: null }
    ]
  },
  {
    id: "ev_lpl_wrist", cat: "life", w: 9, once: true, year: 3, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    req: { stage: ["LPL"] },
    text: "早上刷牙的时候，右手手腕突然没劲，牙刷掉进了洗手池。你把它捡起来，握了握拳，感觉像隔着一层布。",
    sub: "你又握了一次，还是那个感觉。",
    opts: [
      { t: "忍着，继续训练", eff: { MECH: 2, energy: -12, MENTAL: -2 }, res: "你贴了两块膏药，练到晚上。夜里手腕开始跳着疼。", risk: null },
      { t: "去队医那儿", eff: { PHYS: 4, GAME: 2, TEAM: 1 }, res: "队医说：腱鞘炎早期，休息两周。你问：能不休吗。他说：那你明年别打了。", risk: null },
      { t: "瞒着，不告诉任何人", eff: { MENTAL: 2, energy: -10, TEAM: -1 }, res: "你换了种握鼠标的姿势。第二周还行，第三周你开始不敢用力点鼠标。", risk: null }
    ],
    next: { flag: "wrist", id: "ev_lpl_wrist_worse" }
  },
  {
    id: "ev_lpl_wrist_worse", cat: "life", w: 8, once: true, year: 3, months: [1, 2, 3, 4, 5, 6, 8, 9, 10, 11],
    req: { stage: ["LPL"] }, big: true,
    text: "训练赛第三把，你的右手开始不受控制地抖。教练在语音里喊你在干什么，你看着自己的手，说：网络卡。",
    sub: "说完那句谎，你把手藏到了桌子底下。",
    opts: [
      { t: "打封闭，硬上", eff: { MECH: 2, energy: -20, MENTAL: 2, PHYS: -6 }, res: "针打完第二天你能握鼠标了。医生说：你这样，最多再撑三年。", risk: null },
      { t: "停赛一个月", eff: { PHYS: 6, TEAM: -3, FAME: -2 }, res: "你坐在替补席上看队友打。有人开始说：他是不是废了。", risk: null },
      { t: "换左手练，试着改", eff: { MECH: -2, POOL: 2, MENTAL: 3 }, res: "你左手连补刀都困难。三个月后能用左手打上大师。教练说：这人有点疯。", risk: null }
    ]
  },
  {
    id: "ev_lpl_tieba_leak", cat: "drama", w: 10, once: true, year: 2, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    req: { stage: ["LPL"] },
    text: "凌晨有人发帖：某 LPL 中单训练赛摆烂，教练喊他三次不动。配图是你趴在桌上的一张糊照，三小时 800 楼。",
    sub: "你放大看了看，那天你其实是胃疼。",
    opts: [
      { t: "发帖自证", eff: { FAME: 2, TEAM: -2, MENTAL: -2 }, res: "你把训练时长截图发出去。有人说 P 的。你把原图发出去，有人说你急了。", risk: null },
      { t: "找管理删帖", eff: { FAME: -1, TEAM: 2, money: -1 }, res: "帖子删了，截图还在。第二天超话有人发：删帖就是心虚。", risk: null },
      { t: "不管，把状态打回来", eff: { MECH: 3, MENTAL: 3, FAME: -1 },
        res: "你连着一周训练赛全胜。帖子被翻出来，最高赞是：打脸了。",
        risk: { stat: "MECH", dc: 12, ok: "你连着三场拿 MVP。那个帖子被人做成合集，标题叫《造谣的成本》。", bonus: { FAME: 3 } } }
    ],
    next: { flag: "tieba", id: "ev_lpl_team_meeting" }
  },
  {
    id: "ev_lpl_team_meeting", cat: "team", w: 7, once: true, year: 2, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    req: { stage: ["LPL"] },
    text: "队里开了个会，议题是「最近的事」。没人先说话，队长的水杯在桌上转了半圈。",
    sub: "空调开得很低，但有人一直在出汗。",
    opts: [
      { t: "先认错", eff: { TEAM: 4, MENTAL: 1 }, res: "你说是我状态不好，不怪别人。队长说：行，那就一起把状态打回来。", risk: null },
      { t: "摊开说：有人泄密", eff: { GAME: 3, TEAM: -3, FAME: 1 }, res: "你问了句：那张照片谁拍的。没人回答。从那天起，训练室的门开始关着。", risk: null },
      { t: "把会开成团建", eff: { TEAM: 3, MENTAL: 3, money: -1 }, res: "你提议点了三只烤鸭。会开了三小时，什么也没解决，但大家笑得比一个月里都多。", risk: null }
    ]
  },
  {
    id: "ev_po_bo5_night", cat: "match", w: 13, once: false, year: 0, months: [4, 8],
    req: { stage: ["PLAYOFF"] },
    text: "季后赛第一轮，BO5，前两把你们 0-2。休息室里没人说话，空调的声音比人声大。",
    sub: "有人把毛巾盖在了脸上，不知道是累还是不想被看见。",
    opts: [
      { t: "站起来讲两句", eff: { TEAM: 4, MENTAL: 3, energy: -8 }, res: "你说：我们练了一个月就是为了这两把？第三把他们打得像换了支队。", risk: null },
      { t: "自己安静地想", eff: { GAME: 3, MENTAL: 2, TEAM: -1 }, res: "你闭眼把对面的 BP 过了一遍。第三把，你抢在教练前面说了三个 ban。", risk: null },
      { t: "换战术，赌一把", eff: { GAME: 2, MECH: 3, TEAM: -2 },
        res: "第三把赢了，第四把被打回原形，第五把输了。回程的车上没人说话。",
        risk: { stat: "MECH", dc: 14, ok: "你把把换阵容，对面教练彻底读不懂了。让二追三，全场起立。", bonus: { FAME: 5 } } }
    ]
  },
  {
    id: "ev_po_fever", cat: "life", w: 9, once: true, year: 0, months: [4, 8, 9],
    req: { stage: ["PLAYOFF"] }, big: true,
    text: "决赛前一晚 39 度。教练说能上就上，不能上我们也不怪你。你说：能上。",
    sub: "说这话的时候，你连水杯都端不太稳。",
    opts: [
      { t: "打封闭硬上", eff: { MECH: 2, energy: -20, MENTAL: 3, PHYS: -6 }, res: "你在舞台上站了四个小时，赛后直接进了医院。第二天热搜第一是你的 ID。", risk: null },
      { t: "申请换替补", eff: { PHYS: 5, TEAM: -2, FAME: -2 }, res: "替补上了，你们输了。颁奖的时候你穿着外套坐在台下，镜头给了你 3 秒。", risk: null },
      { t: "先睡，早上再看", eff: { PHYS: 3, MENTAL: 2 }, res: "早上退烧了。你打了，赢了。医生说：你这是拿命换的。你说：值。", risk: null }
    ]
  },
  {
    id: "ev_po_keyboard_dead", cat: "life", w: 8, once: true, year: 0, months: [4, 8],
    req: { stage: ["PLAYOFF"] },
    text: "决赛前 40 分钟，你的键盘在检录后突然不亮了。换了线、换了口、换了电脑，还是不亮。工作人员说没备用的同款。",
    sub: "你盯着那片不亮的轴体，脑子一片空白。",
    opts: [
      { t: "拆开自己看", eff: { MECH: 2, MENTAL: -2, energy: -8 }, res: "你蹲在后台拆了 20 分钟，是主板烧了。你把键盘扔进包里，像扔掉一个队友。", risk: null },
      { t: "借对手的备用键盘", eff: { TEAM: -1, MENTAL: 2, LANE: -1 }, res: "对面中单把备用键盘递过来，说：用吧。那场你输了，但你记住了这个举动。", risk: null },
      { t: "用杂牌键盘硬上", eff: { MECH: 2, MENTAL: 3, LANE: -2 },
        res: "手感差到你以为自己在打手游。第一把你打得很别扭。",
        risk: { stat: "MECH", dc: 14, ok: "手感差到你以为在打手游。但你赢了第一把，全场起立。", bonus: { FAME: 3 } } }
    ]
  },
  {
    id: "ev_po_ban_comfort", cat: "match", w: 11, once: false, year: 0, months: [4, 8, 9, 10],
    req: { stage: ["PLAYOFF"] },
    text: "对面三个 ban 位，两个给了你的英雄。解说在台上问：他英雄池里还剩什么？",
    sub: "你听见了那句解说，耳机里的音量忽然有点小。",
    opts: [
      { t: "亮绝活，被针对也认", eff: { MECH: 3, LANE: 2, TEAM: -1 }, res: "你在被针对的位置上打出全场最高伤害，然后输了。有人说这就是勇气。", risk: null },
      { t: "掏一个新练的", eff: { POOL: 3, GAME: 2, MENTAL: -2 },
        res: "那个英雄你只练了两周。第一把像人机，第二把像个人。",
        risk: { stat: "POOL", dc: 12, ok: "你在这个英雄上打出了两波名场面。二路解说：他什么时候练的？", bonus: { FAME: 3 } } },
      { t: "改打团队位，让队友 C", eff: { TEAM: 4, GAME: 2, FAME: -2 }, res: "你打了一手控制中单，全场 0 杀 18 助攻。队友 C 了，赛后采访没人找你。", risk: null }
    ]
  },
  {
    id: "ev_po_game5", cat: "match", w: 13, once: false, year: 0, months: [4, 8, 9, 10],
    req: { stage: ["PLAYOFF"] },
    text: "2-2，决胜局，屏幕上还剩 20 秒 BP。教练问你想拿什么，全队都在等你说。",
    sub: "20 秒，够你把整个职业生涯想一遍。",
    opts: [
      { t: "我的绝活", eff: { MECH: 3, FAME: 3, TEAM: -1 },
        res: "全场欢呼。你打了 38 分钟，最后一波团你一个人带走两个。",
        risk: { stat: "MECH", dc: 14, ok: "你从侧面绕后，收掉两个，MVP。解说破音喊：他敢。", bonus: { FAME: 5 } } },
      { t: "听教练的", eff: { TEAM: 3, GAME: 2, FAME: -1 }, res: "你拿了体系里最稳的那个。比赛很稳，稳到对面找不到你破绽——也找不到你任何东西。", risk: null },
      { t: "拿一个没人想到的", eff: { GAME: 4, POOL: 3, MENTAL: -2 },
        res: "你选完，解说席沉默了三秒。这是你们队第一次在正式比赛用它。",
        risk: { stat: "GAME", dc: 13, ok: "那个英雄把对面打崩了。BP 结束的时候，对面教练摔了耳机。", bonus: { FAME: 3 } } }
    ]
  },
  {
    id: "ev_po_interview", cat: "media", w: 9, once: false, year: 0, months: [4, 8, 9, 10],
    req: { stage: ["PLAYOFF"] },
    text: "赛前采访，记者问你怎么看对手。你身后的队友在小声说：别说太满。",
    sub: "话筒递过来的时候，你听见了那句提醒。",
    opts: [
      { t: "说 3:0", eff: { FAME: 5, MENTAL: 2, TEAM: -2 }, res: "词条挂了六个小时。第一把你们输了，弹幕刷「3:0，谁 3 谁 0」。", risk: null },
      { t: "说对手很强", eff: { FAME: -1, TEAM: 3, MENTAL: 2 }, res: "记者明显失望。这句话没上热搜，但你睡得着。", risk: null },
      { t: "说我们准备了一整月", eff: { TEAM: 2, FAME: 2, MENTAL: 2 }, res: "这句话平淡，赛后被反复引用。有人说这是今年最体面的采访。", risk: null }
    ]
  },
  {
    id: "ev_po_t1", cat: "match", w: 12, once: false, year: 0, months: [9, 10, 11],
    req: { stage: ["WORLDS"] },
    text: "半决赛抽到 T1。数据组把「LPL 在世界赛 BO5 对 T1」的胜率标成了红色，那个数字很难看。",
    sub: "难看到没人愿意在群里念出来。",
    opts: [
      { t: "当最后一场打", eff: { GAME: 3, MENTAL: 2, energy: -10 }, res: "你把他们的 BP 研究了一遍。进场时你才发现，观众席有一半穿的是红黑。", risk: null },
      { t: "练到凌晨三点", eff: { MECH: 3, TEAM: 3, energy: -18 },
        res: "第一把 12-1，全场都站起来了。后面四把，你也还站着。",
        risk: { stat: "MECH", dc: 14, ok: "第一把 12-1，全场起立。你在舞台上第一次听见有人用中文喊你的 ID。", bonus: { FAME: 5 } } },
      { t: "翻他的旧录像找弱点", eff: { GAME: 4, POOL: 2, energy: -12 }, res: "你看完 60 场。你发现他从不做某个动作。比赛里你赌了这一手，然后他做了。", risk: null }
    ]
  },
  {
    id: "ev_worlds_swiss", cat: "match", w: 13, once: false, year: 0, months: [9, 10],
    req: { stage: ["WORLDS"] },
    text: "瑞士轮 0-2，再输一场就回国。酒店早餐时间，隔壁桌是欧洲队在笑，你听不懂，但你觉得他们在笑你。",
    sub: "你把那口面包嚼了很久，咽不下去。",
    opts: [
      { t: "通宵看对手录像", eff: { GAME: 4, energy: -16, MENTAL: 2 }, res: "你看了 9 场。第二天你的 BP 里出现三个对手没打过的英雄。", risk: null },
      { t: "带全队出去走一圈", eff: { TEAM: 4, MENTAL: 3, PHYS: 2 }, res: "你们在酒店外走了 40 分钟，谁都没提比赛。回来的时候打野说了句：明天赢。", risk: null },
      { t: "给家里打个电话", eff: { MENTAL: 4, PHYS: 2, TEAM: -1 }, res: "你妈说：输了就回来，家里有饭。你哭了五分钟，然后去训练室。", risk: null }
    ]
  },
  {
    id: "ev_worlds_last", cat: "match", w: 12, once: false, year: 0, months: [9, 10],
    req: { stage: ["WORLDS"] },
    text: "2-2，最后一个出线名额，对手是 GEN。赛前 Chovy 从走廊那头走过来，看了你一眼，什么都没说。",
    sub: "他一眼看完，走得比来时还快。",
    opts: [
      { t: "跟他打对线，一分不让", eff: { LANE: 3, MECH: 2, GAME: -1 }, res: "你补刀落后 30，但你没崩。四十多分钟后你们赢了，你的补刀数据被挂到网上骂。", risk: null },
      { t: "放弃对线，全押团战", eff: { GAME: 4, TEAM: 3, LANE: -3 }, res: "你在中路被打成筛子，但团战每次都能先手。最后一波你开了个完美的团，全场沸腾。", risk: null },
      { t: "抓他补刀的破口", eff: { GAME: 3, MECH: 2, POOL: 1 },
        res: "你研究了他所有漏刀的时机。这招很脏，但好像不管用。",
        risk: { stat: "GAME", dc: 14, ok: "你在他收兵的半秒里下手，两次。他第一次在比赛里打字：nice。", bonus: { GAME: 3 } } }
    ]
  },
  {
    id: "ev_worlds_food", cat: "life", w: 9, once: false, year: 0, months: [9, 10, 11],
    req: { stage: ["WORLDS"] },
    text: "在柏林的第 9 天，你已经连吃三天酒店的冷三明治。队友在群里发了个视频：某中单吃坏肚子，赛前去了四次厕所。",
    sub: "你看完那个视频，把三明治放下了。",
    opts: [
      { t: "打车去找中餐", eff: { PHYS: 5, MENTAL: 3, money: -0.5 }, res: "你找到一家兰州拉面，80 欧一碗。你吃得很香，付钱的时候很难受。", risk: null },
      { t: "忍到回国", eff: { PHYS: -4, MENTAL: -2, GAME: 2 }, res: "你只吃面包，掉了 3 斤。训练赛里你的手在抖。", risk: null },
      { t: "跟酒店借厨房", eff: { PHYS: 4, TEAM: 3, MENTAL: 2 }, res: "你煮了一锅面，全队吃了两碗。有人发朋友圈说这是这一个多月最好的一顿。", risk: null }
    ]
  },
  {
    id: "ev_worlds_caster", cat: "media", w: 9, once: false, year: 0, months: [9, 10, 11],
    req: { stage: ["WORLDS"] },
    text: "二路解说在直播里说：这个人上世界赛，是来旅游的。这段被剪成视频，32 万播放。",
    sub: "弹幕在下面跟着笑，笑得比解说还大声。",
    opts: [
      { t: "采访里点他名字", eff: { FAME: 4, TEAM: -2, MENTAL: 2 }, res: "你说：有人说我是来旅游的，票钱我自己出的。解说第二天发了道歉微博。", risk: null },
      { t: "打进四强再说", eff: { MECH: 3, MENTAL: 3, FAME: -1 }, res: "你什么都没说，赢了两场。有人把那段解说视频翻出来做成了表情包。", risk: null },
      { t: "去他评论区对线", eff: { FAME: 2, MENTAL: -3, TEAM: -1 }, res: "你回了一句，然后删了。截图还在。第二天你成了新的梗。", risk: null }
    ]
  },
  {
    id: "ev_worlds_hope", cat: "drama", w: 11, once: true, year: 0, months: [10, 11],
    req: { stage: ["WORLDS"] },
    text: "四强，LPL 只剩你们一支队。官博发了张图：全村的希望。评论区第一条：全村都得看这一个人。",
    sub: "那张图上只有五个人，评论区只看见一个。",
    opts: [
      { t: "一条一条全看完", eff: { MENTAL: -4, FAME: 3, MECH: 1 }, res: "你看了 400 条。凌晨两点把手机摔在枕头上，然后打开排位。", risk: null },
      { t: "卸载所有社交软件", eff: { MENTAL: 4, FAME: -2, TEAM: 1 }, res: "微博、虎扑、贴吧全删了。队友说：你看起来像换了个人。", risk: null },
      { t: "录一条视频：我们会赢", eff: { FAME: 5, TEAM: 3, MENTAL: -1 }, res: "视频 200 万播放。你从此没有退路，也从此不能输。", risk: null }
    ]
  },
  {
    id: "ev_worlds_gen", cat: "match", w: 11, once: false, year: 0, months: [9, 10, 11],
    req: { stage: ["WORLDS"] },
    text: "淘汰赛对手是 GEN，他们的野区控制率 68%。你们打野看完数据说：那我这局别刷野了？",
    sub: "他说这话的时候是真心的，不是开玩笑。",
    opts: [
      { t: "帮他做视野", eff: { TEAM: 3, GAME: 3, LANE: -2 },
        res: "你在河道插了 30 个眼，全场最多。打野第一次打得不憋屈。",
        risk: { stat: "GAME", dc: 12, ok: "你的视野布得对面打野整局没进过河道。赛后他看了你一眼。", bonus: { GAME: 2 } } },
      { t: "开野区大乱斗", eff: { GAME: 2, MECH: 3, energy: -12 }, res: "前期你们打了 8 次小规模团。对面野王第一次在自己野区迷路。", risk: null },
      { t: "按部就班", eff: { GAME: 2, TEAM: 2, MENTAL: -2 }, res: "你们按计划打，输在 34 分钟那一波大龙。回看录像时教练说：我们没做错什么。", risk: null }
    ]
  },
  {
    id: "ev_worlds_flight", cat: "drama", w: 11, once: true, year: 0, months: [10, 11],
    req: { stage: ["WORLDS"] },
    text: "你们 1-3 输在半决赛前，回国的航班在凌晨四点。机场没有人接机，只有两个粉丝，举的牌子还是去年的。",
    sub: "牌子上你的 ID 掉了一个字母，用马克笔补的。",
    opts: [
      { t: "过去签名", eff: { FAME: 2, MENTAL: 3, energy: -6 }, res: "你签了 6 个名，说了 6 次谢谢。其中一个女生说：明年我还来。", risk: null },
      { t: "从后门走", eff: { MENTAL: -3, FAME: -2 }, res: "你在车上看了整夜的窗外。手机里有 3000 条未读。", risk: null },
      { t: "发一条长微博", eff: { FAME: 3, MENTAL: 2, TEAM: -1 }, res: "你写了 700 字，最后一句是：明年我还会来。评论区一半在骂，一半在哭。", risk: null }
    ]
  },
  {
    id: "ev_worlds_deft", cat: "drama", w: 8, once: true, year: 0, months: [10, 11],
    req: { stage: ["WORLDS"] },
    text: "赛后，Deft 宣布退役。他站在台上说了 6 分钟，最后一句：我尽力了。全场起立。",
    sub: "你站在通道口，看着他走过去，走了很久。",
    opts: [
      { t: "过去跟他握手", eff: { MENTAL: 3, FAME: 3, TEAM: 1 }, res: "他的手很凉。他说：你还有时间。你想说点什么，最后什么都没说出来。", risk: null },
      { t: "回更衣室", eff: { MECH: 2, GAME: 2, MENTAL: -2 }, res: "你戴上耳机。外面的掌声持续了一分钟，你数得很清楚。", risk: null },
      { t: "给教练发消息", eff: { MENTAL: 2, GAME: 3, PHYS: -2 }, res: "你问他：我还能打几年。他回：别想这个，想下一场。你把手机放下，突然有点怕。", risk: null }
    ]
  },
  {
    id: "ev_po_msi", cat: "match", w: 11, once: false, year: 0, months: [4, 5],
    req: { stage: ["PLAYOFF"] },
    text: "春冠就是 MSI 名额，你们打进了春决。对面是常规赛第一，常规赛 3-0 你们。",
    sub: "三场加起来，你们一共活了不到一百分钟。",
    opts: [
      { t: "用他们最擅长的体系", eff: { GAME: 3, TEAM: 3, MECH: -1 }, res: "你用他们的招数赢了他们。赛后有人说：这是今年最难看也最爽的一场。", risk: null },
      { t: "打自己最熟的", eff: { MECH: 3, TEAM: 2, GAME: -1 }, res: "你把节奏拉到最舒服的地方。打了五把，最后一把赢了 41 分钟。", risk: null },
      { t: "赌一把奇招", eff: { POOL: 3, MECH: 2, MENTAL: -2 },
        res: "第一把奇招赢了，第二把被反制。第三把你换回常规阵容，赢在最后一波。",
        risk: { stat: "POOL", dc: 13, ok: "奇招三把全胜。赛后对面教练说：我们准备过，但没准备好。", bonus: { FAME: 4 } } }
    ]
  },
  {
    id: "ev_po_home_crowd", cat: "match", w: 10, once: false, year: 0, months: [4, 8],
    req: { stage: ["PLAYOFF"] },
    text: "季后赛打在你的主场城市，场馆里一半人在喊你的 ID，另一半人在喊对面。你第一次知道主场不是优势，是压力。",
    sub: "两边声音一样大，你站在中间，不知道该听谁。",
    opts: [
      { t: "对着观众席吼回去", eff: { FAME: 4, MENTAL: 2, TEAM: -1 }, res: "你摘下耳机，对着那一半人喊了一句。全场炸了，转播镜头停在你脸上 4 秒。", risk: null },
      { t: "耳机音量调到最大", eff: { MECH: 3, MENTAL: 3, TEAM: -1 }, res: "你什么都听不见。你打了 40 分钟，像在自己房间里。", risk: null },
      { t: "赛前去跟他们击掌", eff: { FAME: 3, TEAM: 3, MENTAL: -1 }, res: "你绕场一圈。有个小孩哭了。你回到座位的时候，手还在抖。", risk: null }
    ]
  },
  {
    id: "ev_po_sweep", cat: "match", w: 10, once: false, year: 0, months: [4, 8],
    req: { stage: ["PLAYOFF"] },
    text: "3-0 拿下，全场在喊你的名字。采访台上，主持人问：下一轮有信心吗？",
    sub: "灯光打在你脸上，你眼睛还有点花。",
    opts: [
      { t: "说：谁来都一样", eff: { FAME: 5, TEAM: -1, MENTAL: 2 }, res: "这句话被顶上热搜。三天后你遇到了那个「谁都一样」的对手。", risk: null },
      { t: "说：先让我喘口气", eff: { MENTAL: 3, TEAM: 2, FAME: -1 }, res: "全场笑了。这句被做成表情包，是全队唯一一次上热搜还不挨骂的。", risk: null },
      { t: "把话筒递给老将", eff: { TEAM: 4, FAME: -2, MENTAL: 2 }, res: "他讲了 5 分钟，讲得比你好。你站在旁边笑得像刚赢了世界赛。", risk: null }
    ]
  },
  {
    id: "ev_rank_midnight", cat: "training", w: 14, once: false, year: 0, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    text: "凌晨四点，韩服第 11 把，你排到了对面的前职业中单。教练在群里发了句：明天 9 点复盘。没人回。",
    sub: "群里 5 个人，4 个已读，一个是你。",
    opts: [
      { t: "再打一把", eff: { MECH: 2, energy: -14, MENTAL: 1 }, res: "你把对面中单单杀了三次，然后天亮了。复盘的时候你睡着了。", risk: null },
      { t: "睡了", eff: { PHYS: 5, TEAM: 2 }, res: "你睡到 8 点 50，洗把脸就去了训练室。教练看你精神好，点了你的名表扬。", risk: null },
      { t: "开直播打", eff: { FAME: 3, energy: -8, TEAM: -2 }, res: "2000 人看你逐帧分析。第二天队友问：昨晚为什么不开麦。", risk: null }
    ]
  },
  {
    id: "ev_train_kda", cat: "training", w: 11, once: false, year: 0, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    text: "训练赛你 12-1，队伍输了。数据组说你的参团率 38%。教练问：你是来赢比赛的，还是来打数据的？",
    sub: "你张了张嘴，那 12 个人头确实都在你击杀栏里。",
    opts: [
      { t: "下一把只打团", eff: { TEAM: 3, GAME: 2, LANE: -2 }, res: "你参团率 78%，KDA 变成 3-6。你们赢了。", risk: null },
      { t: "两个都要", eff: { MECH: 2, GAME: 2, energy: -14 }, res: "你连打 6 个小时。第二天你发现自己两个都没做到。", risk: null },
      { t: "跟他吵", eff: { MENTAL: 2, TEAM: -3, GAME: 1 },
        res: "他说：12-1 还能是我错？他把录像放慢到 0.25 倍。",
        risk: { stat: "GAME", dc: 12, ok: "你把那一波的时间点说得比他准。他合上电脑说：行，下一场按你的打。", bonus: { GAME: 2 } } }
    ]
  },
  {
    id: "ev_train_lane_coach", cat: "training", w: 9, once: false, year: 0, months: [1, 2, 3, 6, 7, 8],
    text: "队里请了个对线教练，一小时 3000 块，专教你补刀的节奏。他说：你不缺手，你缺耐心。",
    sub: "一小时 3000，他讲的第一句是「别急着补」。",
    opts: [
      { t: "认真学", eff: { LANE: 4, MECH: 2, energy: -12 }, res: "两周后你能在塔下稳定补 20 刀，误差不超过 2 个。他说这叫基本盘。", risk: null },
      { t: "觉得浪费时间", eff: { MECH: 3, LANE: -1, TEAM: -2 }, res: "你觉得这些你早会了。一个月后对线数据没变，手感倒是更热了。", risk: null },
      { t: "退课，自己看录像", eff: { GAME: 3, POOL: 2, money: -1 }, res: "你把录像看了三遍，学得比上课快。教练知道你退了课，一句话没说。", risk: null }
    ]
  },
  {
    id: "ev_train_buff_change", cat: "training", w: 10, once: false, year: 0, months: [1, 2, 3, 6, 7, 8],
    text: "版本更新，野区经验改了，你们打野刷到四级要晚 8 秒。他说：这版本不让人活了。",
    sub: "8 秒，在野区就是一条命的距离。",
    opts: [
      { t: "陪他研究新路线", eff: { TEAM: 3, GAME: 3, energy: -12 }, res: "你们在训练模式跑了两小时开野路线。第二天他的四级时间省回了 6 秒。", risk: null },
      { t: "让他自己扛", eff: { GAME: 2, MECH: 2, TEAM: -2 }, res: "你什么都没说。三天后他在比赛里被反烂了野区，赛后一个人在训练室坐到天亮。", risk: null },
      { t: "让教练改战术", eff: { GAME: 3, TEAM: 2, MENTAL: -1 }, res: "你们把前期打法从野核改成三线压制。这套东西后来成了队伍的招牌。", risk: null }
    ]
  },
  {
    id: "ev_team_hotpot", cat: "team", w: 11, once: false, year: 0, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    text: "赢了比赛，队长说出去吃火锅。经理看了眼表：明天早上 9 点有训练赛。",
    sub: "表就在队长眼前，他看都没看。",
    opts: [
      { t: "去", eff: { TEAM: 4, PHYS: -3, money: -0.5 }, res: "你们吃到 12 点。打野在包厢里唱了首跑调的歌，你笑得眼泪都出来了。", risk: null },
      { t: "去，但 10 点回", eff: { TEAM: 2, PHYS: -1, MENTAL: 2 }, res: "第二天训练赛全员准时，没人迟到。队长说：这才叫队。", risk: null },
      { t: "不去，练", eff: { MECH: 2, PHYS: 3, TEAM: -3 }, res: "你一个人在训练室。回来的人身上全是火锅味，还在笑你没去。", risk: null }
    ]
  },
  {
    id: "ev_team_argue", cat: "team", w: 10, once: false, year: 0, months: [1, 2, 3, 6, 7, 8],
    text: "你跟辅助在语音里吵起来了。他说你从来不跟他配合，第三把打完，他直接退了房间。",
    sub: "房间退得很干脆，连再见都没说。",
    opts: [
      { t: "追出去道歉", eff: { TEAM: 4, MENTAL: 2, FAME: -1 }, res: "你说对不起。他抽了根烟，说：不是你的问题，是我今天手感差。", risk: null },
      { t: "让他滚", eff: { MECH: 2, MENTAL: 2, TEAM: -4 }, res: "下一把你打得更凶。教练把你俩分开练了一周。", risk: null },
      { t: "找教练调解", eff: { TEAM: 2, GAME: 2, MENTAL: -1 }, res: "教练让你们面对面把话说清楚。说了两个小时，最后你们一起去吃了宵夜。", risk: null }
    ]
  },
  {
    id: "ev_team_captain", cat: "team", w: 11, once: true, year: 0, months: [1, 2, 3, 6, 7, 8],
    text: "老队长退役，教练把袖标扔到你桌上：从今天起你是队长。你的第一反应不是骄傲，是：我连自己都管不好。",
    sub: "那个袖标叠得很整齐，放的位置正好压着你的排位表。",
    opts: [
      { t: "接了", eff: { TEAM: 4, FAME: 3, MENTAL: -2, energy: -8 }, res: "你开始每天第一个到训练室。第三周你在群里发了一条 500 字的消息，没人回，但没人再迟到。", risk: null },
      { t: "推给老将", eff: { TEAM: -1, MENTAL: 3, FAME: -1 }, res: "你说我不行。老将接了，然后连着骂了你三天。", risk: null },
      { t: "接了，但改规矩", eff: { TEAM: 3, GAME: 2, MENTAL: 2 },
        res: "你把训练时间改了，把复盘改成轮值主持。第一个月队伍成绩没变，气氛变了。",
        risk: { stat: "TEAM", dc: 12, ok: "你把复盘改成轮值主持，第三周队伍连胜。教练说：这袖标给对了。", bonus: { TEAM: 3 } } }
    ]
  },
  {
    id: "ev_team_language", cat: "team", w: 10, once: false, year: 0, months: [1, 2, 3, 6, 7, 8],
    text: "队里来了个韩援，中文只会说「这个」「等一下」「对不起」。团战里他喊什么都听不懂，你们靠 ping 打了两周。",
    sub: "那两周你们的团战，像四个人在跟一个信号灯配合。",
    opts: [
      { t: "教他中文", eff: { TEAM: 3, energy: -10, MENTAL: 2 }, res: "你教了他 40 个词，最熟练的是「别送」。他学得很快，最先学会骂人的那些。", risk: null },
      { t: "你学韩语", eff: { MENTAL: 2, GAME: 2, energy: -8 }, res: "你背了 100 个单词。第一次用韩语喊开团，他愣了半秒，然后开了一个完美的团。", risk: null },
      { t: "用 ping，不折腾", eff: { GAME: 2, TEAM: -2, MECH: 2 }, res: "你们靠 8 个信号的组合打完了整个赛季。有人说你们像在打哑巴局。", risk: null }
    ]
  },
  {
    id: "ev_media_meme", cat: "media", w: 9, once: false, year: 0, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    text: "你的一个操作失误被打成了表情包，全平台都在用。图是你 19 岁的样子，配的文字是「我上我也行」。",
    sub: "那张截图里，你的鼠标正点在一个空地上。",
    opts: [
      { t: "自己转发", eff: { FAME: 4, MENTAL: 2, TEAM: -1 }, res: "你转了一句：确实。评论区笑成一片，黑转路的路转粉的都有。", risk: null },
      { t: "当没看见", eff: { MENTAL: -2, MECH: 2 }, res: "你不看。但队友在训练室里互相发表情包，最后发到了你面前。", risk: null },
      { t: "发律师函", eff: { FAME: -3, MENTAL: 3, TEAM: -1 }, res: "律所回了句「建议不追究」。你把邮件删了，从此这个梗跟你十年。", risk: null }
    ]
  },
  {
    id: "ev_media_supertopic", cat: "media", w: 8, once: false, year: 0, months: [1, 2, 3, 6, 7, 8],
    text: "超话里在吵你是不是队内矛盾主角。有人扒出你跟中单三天没在微博互关互动。",
    sub: "三天，在超话里已经够写一部连续剧了。",
    opts: [
      { t: "发个合照", eff: { TEAM: 2, FAME: 2, MENTAL: -1 }, res: "你发了张两人吃面照，配文：他抢我牛肉。评论区：破案了。", risk: null },
      { t: "让运营处理", eff: { FAME: 2, TEAM: 1, MENTAL: 1 }, res: "运营发了条声明。信的人一半，不信的人一辈子不信。", risk: null },
      { t: "下场解释", eff: { FAME: -2, MENTAL: -3, TEAM: 1 }, res: "你写了 300 字。第一条评论是：解释就是掩饰。", risk: null }
    ]
  },
  {
    id: "ev_media_weibo_feature", cat: "media", w: 8, once: false, year: 0, months: [1, 2, 3, 6, 7, 8, 11],
    text: "某电竞媒体想给你做个专访，标题他们想好了：《从网吧到 LPL，他走了六年》。运营提醒：他们会写你的家庭，你妈不一定想上镜。",
    sub: "「六年」这个数字，你自己都没认真算过。",
    opts: [
      { t: "做，全说", eff: { FAME: 5, MENTAL: -2, money: 2 }, res: "文章 10 万+。你妈打来电话说：你爸把报纸贴在店里了。", risk: null },
      { t: "做，删掉家里那段", eff: { FAME: 3, MENTAL: 2, money: 1 }, res: "文章温和很多。你妈看完说：这个写得像你。", risk: null },
      { t: "不做", eff: { FAME: -2, MENTAL: 3, GAME: 1 }, res: "你推了。那篇后来写的是另一个新人，火了。", risk: null }
    ]
  },
  {
    id: "ev_media_gift", cat: "media", w: 7, once: false, year: 0, months: [1, 2, 3, 6, 7, 8, 12],
    text: "一个粉丝寄来一整箱东西：手写信、自制应援牌，还有一双 43 码的鞋。你穿 42。",
    sub: "信里写她知道你穿 42，但 43 是她能买到的最小码。",
    opts: [
      { t: "回一封信", eff: { FAME: 2, MENTAL: 3, energy: -4 }, res: "你写了 400 字，签名签了 5 遍。她后来把信裱起来发了微博。", risk: null },
      { t: "把鞋捐了", eff: { MENTAL: 2, FAME: 1, TEAM: 1 }, res: "你把鞋捐给了基地附近的一个球场。小孩穿着它拍了照，你转了。", risk: null },
      { t: "交给运营", eff: { MENTAL: -1, FAME: -1, GAME: 2 }, res: "箱子堆在仓库。三个月后你路过，手写信还没拆。", risk: null }
    ]
  },
  {
    id: "ev_media_clip", cat: "media", w: 10, once: false, year: 0, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    text: "剪辑号把你的 3 秒失误剪成 40 秒视频，配乐是悲伤钢琴。播放 87 万，评论第一条：他是不是该退役了。",
    sub: "那 3 秒前面还有 37 分钟，没人剪。",
    opts: [
      { t: "在原视频下面回", eff: { FAME: 3, MENTAL: -1, TEAM: -1 }, res: "你回了一句：那 3 秒前面 37 分钟你怎么不剪。点赞 2 万。", risk: null },
      { t: "用成绩说话", eff: { MECH: 3, MENTAL: 2, FAME: -1 }, res: "你接下来三场都是 MVP。剪辑号又发了条视频：《他为什么不说话》。", risk: null },
      { t: "私信那个剪辑号", eff: { FAME: 1, MENTAL: -2, money: -1 }, res: "你加了他微信。他第一句话是：哥，这条能再给我 500 吗。", risk: null }
    ]
  },
  {
    id: "ev_life_takeout", cat: "life", w: 10, once: false, year: 0, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    text: "一个月你在基地点了 62 次外卖，体测报告出来后，营养师沉默了很久。报告上写着：体脂 24%，你 19 岁。",
    sub: "他把报告推过来的时候，你还在嚼最后一口。",
    opts: [
      { t: "开始跑步", eff: { PHYS: 5, energy: -10, MENTAL: 1 }, res: "你跑了 3 公里，吐了。第二周你能跑 5 公里，第三周你发现反应速度快了。", risk: null },
      { t: "只换健康一点的", eff: { PHYS: 2, MENTAL: 1, money: -0.5 }, res: "你把炸鸡换成了三明治。一周后你在训练室里偷偷点了一份炸鸡。", risk: null },
      { t: "不管，先赢", eff: { MECH: 2, PHYS: -3, MENTAL: 2 }, res: "你把报告折起来塞进抽屉。半年后你才重新打开它。", risk: null }
    ]
  },
  {
    id: "ev_life_blind_date", cat: "life", w: 8, once: true, year: 0, months: [2, 3, 7, 8, 11, 12],
    text: "你妈又在电话里念：隔壁小孩都二胎了，你连对象都没有。她给你安排了个相亲，对方在银行上班，家里人介绍的。",
    sub: "你连人家叫什么都是到了餐厅才知道。",
    opts: [
      { t: "去见一面", eff: { MENTAL: 3, energy: -6 }, res: "你穿了件没褶皱的衬衫。她第一句话是：你打游戏一个月能挣多少。", risk: null },
      { t: "推了，说在训练", eff: { MECH: 2, MENTAL: -2, TEAM: 1 }, res: "你妈说：行，那我跟人家说你在忙。你听出她声音里的失望。", risk: null },
      { t: "让她先看场你的比赛", eff: { FAME: 2, MENTAL: 2 }, res: "她看完说：你那个被杀的是不是故意的。你笑了，第一次觉得这事有希望。", risk: null }
    ],
    next: { flag: "blinddate", id: "ev_life_blind_date2" }
  },
  {
    id: "ev_life_blind_date2", cat: "life", w: 7, once: true, year: 0, months: null,
    text: "你妈把你的微信给了她，她的头像是你打比赛时的截图。你翻了她的朋友圈，第一条是：今年也要买票去看世界赛。",
    sub: "头像那张，正好是你被打爆的那一场。",
    opts: [
      { t: "直接问她喜欢谁", eff: { MENTAL: 3, FAME: 1 }, res: "她说：喜欢你。你盯着屏幕 30 秒，回了句：那我尽量打进去。", risk: null },
      { t: "这事先放放", eff: { MECH: 2, MENTAL: -1 }, res: "你把她的消息标成已读。第二天她没再发。", risk: null },
      { t: "约她看一场线下", eff: { FAME: 2, MENTAL: 4, energy: -6 }, res: "她在观众席第二排，你赢下了那场。赛后她递过来一瓶水，什么都没说。", risk: null }
    ]
  },
  {
    id: "ev_life_family_loan", cat: "life", w: 9, once: true, year: 0, months: [1, 2, 7, 8, 12],
    text: "你爸在电话里绕了 8 分钟，最后说：你弟结婚，差 18 万。他说：借，不是要。",
    sub: "「借」这个字，他说得很轻。",
    opts: [
      { t: "打钱", eff: { money: -18, MENTAL: 3, FAME: -1 }, res: "你把钱打过去。你爸说了句：我儿子出息了。你在阳台上站了半小时。", risk: null },
      { t: "打一半", eff: { money: -9, MENTAL: -2, TEAM: 1 }, res: "你说只有这么多。你妈后来打来电话，说你爸喝多了，在亲戚面前下不来台。", risk: null },
      { t: "说没钱", eff: { MENTAL: -4, money: 0, GAME: 2 }, res: "你说今年没赚到。挂了电话，你看着账户上的数字，第一次觉得自己很坏。", risk: null }
    ]
  },
  {
    id: "ev_life_sick", cat: "life", w: 8, once: false, year: 0, months: [1, 2, 3, 11, 12],
    text: "早训的时候你吐了，胃里全是昨晚的泡面。队医摸了摸你的额头：不高，是胃。",
    sub: "他问昨晚吃了什么，你说没吃。",
    opts: [
      { t: "吃点药继续练", eff: { MECH: 2, PHYS: -3, energy: -8 }, res: "你练了一整天。晚上疼得睡不着，一直到天亮才迷糊过去。", risk: null },
      { t: "休息两天", eff: { PHYS: 5, MENTAL: 2, TEAM: -1 }, res: "你睡了两天。回训练室的时候大家的操作看起来都比你快。", risk: null },
      { t: "去医院做检查", eff: { PHYS: 4, money: -0.6, GAME: 1 }, res: "检查结果：慢性胃炎。医生说：你这年纪不该有。你笑了一下。", risk: null }
    ]
  },
  {
    id: "ev_money_live_contract", cat: "money", w: 10, once: true, year: 0, months: [2, 3, 4, 9, 10, 11],
    text: "直播平台的人来基地，合同摊在桌上：一年 200 万，每月必须播 60 小时。教练在旁边小声说，60 小时啊，你一天训练 12 小时。",
    sub: "他把「60 小时」念得很慢，像在替你算账。",
    opts: [
      { t: "签", eff: { money: 200, energy: -16, FAME: 4, TEAM: -2 },
        res: "你签了。签完的第一个月你播了 63 小时，训练量掉了三成。教练没说话，把训练计划贴在你桌上。",
        risk: null },
      { t: "砍到 30 小时", eff: { money: 120, FAME: 3, energy: -8 }, res: "平台磨了两天，同意了。你的直播时间被安排到比赛后，效果居然更好。", risk: null },
      { t: "不签", eff: { MECH: 2, GAME: 2, money: -2, FAME: -1 }, res: "你说现在不行。对方留了张名片，说：想清楚了再找我。名片在你抽屉里放了两年。", risk: null }
    ]
  },
  {
    id: "ev_money_car", cat: "money", w: 9, once: true, year: 0, months: [2, 3, 4, 5, 9, 10],
    text: "队友提了辆车，落地 68 万。开进基地那天，所有人都下去看。他摇下车窗说：上来坐坐。",
    sub: "车钥匙在他手里转了两圈。",
    opts: [
      { t: "也去买一辆", eff: { money: -60, FAME: 3, MENTAL: 2 }, res: "你开回基地那天，教练在楼上看着。第二天训练赛你迟到 15 分钟。", risk: null },
      { t: "上车坐一圈", eff: { TEAM: 2, MENTAL: 1 }, res: "车里味道很新。他说：你要是拿了冠军，也买一辆。你说：我先买房。", risk: null },
      { t: "攒钱，不买", eff: { money: 5, MENTAL: 3, TEAM: -1 }, res: "你把钱存了定期。三年后你在老家付了首付，那天你把合同拍照发了家庭群。", risk: null }
    ]
  },
  {
    id: "ev_money_bonus", cat: "money", w: 11, once: false, year: 0, months: [4, 5, 8, 9, 11],
    text: "比赛奖金到账了，比说好的少 30%。经理说：俱乐部代扣了一部分运营成本。",
    sub: "他说这话的时候，手里转着一支笔。",
    opts: [
      { t: "要个明细", eff: { money: 8, TEAM: -2, MENTAL: 2 },
        res: "你发了邮件，抄送了老板。三天后补了一部分。经理看你的眼神变了。",
        risk: { stat: "MENTAL", dc: 12, ok: "你把合同条款一条条念给他听。他沉默了很久，第二天全额补上了。", bonus: { money: 10 } } },
      { t: "算了", eff: { TEAM: 2, MENTAL: -3, money: -3 }, res: "你没说。只是从此每次发钱你都要自己算三遍。", risk: null },
      { t: "让老将去谈", eff: { TEAM: 1, money: 3, MENTAL: 1 }, res: "老将去谈，谈回来一半。他说：这种事以后你自己来。", risk: null }
    ]
  },
  {
    id: "ev_money_scam", cat: "money", w: 10, once: true, year: 0, months: [1, 2, 3, 6, 7, 8],
    text: "一个朋友拉你投个项目：电竞酒店，稳赚，年化 30%，还差 80 万。他说咱们这行，钱得跑快点。",
    sub: "他把计划书发过来，封面做得挺像回事。",
    opts: [
      { t: "投 30 万", eff: { money: -30, MENTAL: 2 }, res: "前三个月按时分红。第四个月，他的微信变成了一条横线。", risk: null },
      { t: "只借 5 万", eff: { money: -5, MENTAL: -1 }, res: "五万，没了。你把这当成学费。", risk: null },
      { t: "一分不投", eff: { MENTAL: 2, money: 0, TEAM: -1 }, res: "他说你不讲义气。半年后有人在群里说，那人跑路了，卷了 400 万。", risk: null }
    ]
  },
  {
    id: "ev_market_transfer", cat: "market", w: 12, once: true, year: 0, months: [11, 12, 1],
    text: "转会期开窗第一天，三支队的经理坐在你经纪人的办公室里。一个给钱多，一个给首发，一个给冠军。",
    sub: "三份报价摊在桌上，像三道选择题。",
    opts: [
      { t: "钱最多的那个", eff: { money: 120, TEAM: -2, FAME: 2 },
        res: "你去了。新队的打野第一句话是：听说你是买来的。你打了半年才让这句话消失。",
        risk: null },
      { t: "能打首发的那个", eff: { GAME: 3, TEAM: 2, money: 30 }, res: "你选了能上场的队。第一年你打了 47 场，是全队最多。", risk: null },
      { t: "有冠军相的那个", eff: { GAME: 2, TEAM: 4, money: 40 },
        res: "你去了。第一年你们春冠，你在决赛里拿了 MVP。",
        risk: { stat: "TEAM", dc: 12, ok: "你去的队当年把冠军拿了个遍。你的名字第一次刻在奖杯底座上。", bonus: { FAME: 5 } } }
    ]
  },
  {
    id: "ev_market_agent", cat: "market", w: 9, once: false, year: 0, months: [11, 12, 1, 2],
    text: "经纪人说下份合同我帮你谈到 800 万，抽成 10%。另一个经纪人的报价是抽成 5%，但他只带过两个选手。",
    sub: "一个履历漂亮，一个价格便宜，都没有保证。",
    opts: [
      { t: "用大经纪人", eff: { money: 60, FAME: 3, MENTAL: -2 },
        res: "他真谈到了 800 万。签约那天他笑得比你还开心。",
        risk: null },
      { t: "用新人，便宜", eff: { money: 40, MENTAL: 3, TEAM: 1 }, res: "新人谈得很慢，只谈到 600 万，但一分钱不多抽。他说：哥，我就想做好一个。", risk: null },
      { t: "自己谈", eff: { money: 80, MENTAL: -3, energy: -12 },
        res: "你练了两周谈判，把合同逐条读了三遍。签完你胃疼了两天。",
        risk: { stat: "MENTAL", dc: 13, ok: "你一个人谈下了一份比经纪公司还给得高的合同。俱乐部老板说：这人不能留。", bonus: { money: 60 } } }
    ]
  },
  {
    id: "ev_market_lck_tryout", cat: "market", w: 11, once: true, year: 0, months: [11, 12, 1],
    text: "LCK 一支队伍的教练加了你微信：要不要来试训一周。他们说的是「试训」，不是「邀请」。",
    sub: "这两个词差一个字，差的是你现在的身价。",
    opts: [
      { t: "去，飞首尔", eff: { money: -3, energy: -14, GAME: 3 }, res: "你一个人飞了。试训第一场你被对面的中单单杀了两次。第二场你打回来了。", risk: null },
      { t: "录比赛录像发过去", eff: { GAME: 2, FAME: 1, energy: -4 }, res: "你剪了 20 分钟的集锦。三天后他们回：我们想要能打对线的。", risk: null },
      { t: "不去，LCK 没我位置", eff: { MECH: 2, MENTAL: 2, TEAM: 1 }, res: "你没回那条消息。三天后他又发来一条：我们真的想要你。", risk: null }
    ],
    next: { flag: "lck", id: "ev_market_lck_choice" }
  },
  {
    id: "ev_market_lck_choice", cat: "market", w: 10, once: true, year: 0, months: null,
    text: "LCK 那边回了：可以给一个替补位置，年薪 1.2 亿韩元。折成人民币，比你现在多 30%，但要坐板凳。",
    sub: "你算了两遍汇率，又算了一遍出场时间。",
    opts: [
      { t: "去，赌一个机会", eff: { money: 40, GAME: 3, MENTAL: -3, TEAM: -2 }, res: "你收拾行李的时候，队友在门口说：别把自己弄没了。", risk: null },
      { t: "留下，打首发", eff: { TEAM: 3, GAME: 2, FAME: 2, money: -5 }, res: "你留下了。俱乐部给你加了一点钱，不多，但教练说：队伍需要你。", risk: null },
      { t: "拿报价去谈涨薪", eff: { money: 30, TEAM: -2, FAME: 1 },
        res: "你把邮件转给了老板。他看了三遍，说：你想要多少。",
        risk: { stat: "MENTAL", dc: 13, ok: "你把报价单拍在桌上。老板加了 50% 的薪，还给你配了个助理。", bonus: { money: 50 } } }
    ]
  },
  {
    id: "ev_match_snipe", cat: "match", w: 9, once: false, year: 0, months: [1, 2, 3, 6, 7, 8, 9, 10],
    text: "排位里对面五个人都在卡你的号。每一把你都能感觉到，有人知道你在哪。",
    sub: "你的开局路线，对面比你的队友还清楚。",
    opts: [
      { t: "换个号打", eff: { MECH: 2, GAME: 2, MENTAL: -1 }, res: "你换了个小号，三天打上宗师。第四天，他们又找到了你。", risk: null },
      { t: "就正面打", eff: { MECH: 3, LANE: 2, MENTAL: 2 },
        res: "你连着 6 把对线都被针对。第七把，你打崩了对面中单。",
        risk: { stat: "MECH", dc: 13, ok: "你被针对了一整晚，最后一把 1v5 收完人头。对面直接打字：这人是不是外挂。", bonus: { FAME: 2 } } },
      { t: "关掉排位，去训练模式", eff: { POOL: 2, PHYS: 3, MENTAL: 1 }, res: "你练了一晚上的补刀。手很稳，心也稳了。", risk: null }
    ]
  },
  {
    id: "ev_match_draft", cat: "match", w: 10, once: false, year: 0, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    text: "BP 结束，你发现你们一整个阵容没有硬控制。教练在耳机里说：按计划打。",
    sub: "你看了看那五个英雄，又看了看对面的阵容。",
    opts: [
      { t: "按计划打", eff: { TEAM: 2, GAME: 2, MECH: -1 }, res: "你们打得像五个单独的人在玩。输了 24 分钟。", risk: null },
      { t: "临场改自己的出装", eff: { GAME: 3, MECH: 2, TEAM: -1 },
        res: "你掏了个开团装。这招很脏，但真的救了两波团。",
        risk: { stat: "GAME", dc: 13, ok: "你出的那件装备成了对面整场的噩梦。赛后有人问教练：这是设计好的吗。", bonus: { FAME: 3 } } },
      { t: "赛后把话说明白", eff: { TEAM: 3, GAME: 2, MENTAL: -2 }, res: "你把阵容问题在复盘时点破。教练脸很难看，但下一场的 BP 正常了。", risk: null }
    ]
  },
  {
    id: "ev_drama_netstorm", cat: "drama", w: 13, once: true, year: 0, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    text: "一条爆料上了热搜：某中单训练赛挂机。评论区已经把你的名字打上了马赛克，实际上那天你在医院。",
    sub: "没人问你为什么，也没人问你那天在哪。",
    opts: [
      { t: "发证据，硬刚", eff: { FAME: 2, MENTAL: -3, TEAM: -1 },
        res: "你发了病历和当天定位，评论区安静了一小时。然后新的爆料又来了。",
        risk: { stat: "MENTAL", dc: 14, ok: "你甩出完整聊天记录和时间线，反转成功。那条爆料的账号注销了。", bonus: { FAME: 4 } } },
      { t: "不回应", eff: { MENTAL: -4, GAME: 2, FAME: -2 }, res: "你没回。骂了七天，第八天没人提了。但那个词条一直挂在你名字后面。", risk: null },
      { t: "让俱乐部发律师函", eff: { FAME: -1, TEAM: 2, MENTAL: 1, money: -2 }, res: "律师函上了热搜，被嘲「发函冠军」。但确实有几家营销号删了。", risk: null }
    ]
  },
  {
    id: "ev_drama_betray", cat: "drama", w: 12, once: true, year: 0, months: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    text: "你发现队里有人在跟对面教练吃饭。你自己的训练赛笔记，被人拍下来发到了那个群里。",
    sub: "那页笔记上有你的字，还有一个只有你自己知道的记号。",
    opts: [
      { t: "当场对质", eff: { TEAM: -4, MENTAL: 2, FAME: 2 },
        res: "他把手机摔了。两个人差点打起来。第二天教练把人调走了。",
        risk: { stat: "MENTAL", dc: 13, ok: "你当面对质，他一句话说不出来。教练当场把他调出首发。", bonus: { TEAM: 4 } } },
      { t: "悄悄告诉教练", eff: { TEAM: 2, MENTAL: 1, GAME: 2 }, res: "教练查了三天，换掉了首发。没人知道是谁说的，除了你和他。", risk: null },
      { t: "装不知道", eff: { MENTAL: -4, TEAM: -2 }, res: "你继续打。他继续笑。每一场比赛你都在想他坐在台下看的是什么。", risk: null }
    ]
  },
  {
    id: "ev_team_pos_switch", cat: "team", w: 10, once: true, year: 0, months: [1, 2, 6, 7],
    text: "教练把你叫去：想让你改打上单，队里缺。你练了六年的中单，他说练半年就能上。",
    sub: "他说「半年」的时候，像在说一件很小的事。",
    opts: [
      { t: "换", eff: { LANE: -2, GAME: 3, POOL: 2, TEAM: 3, energy: -12 }, res: "你从 0 开始补刀。第一个月你在排位里被各种上单按在地上摩擦。", risk: null },
      { t: "不换", eff: { MECH: 3, LANE: 2, TEAM: -2 }, res: "你说我中单还没打明白。教练没再提，但新赛季队伍补了个上单，钱花得不少。", risk: null },
      { t: "答应但先打两个位置", eff: { GAME: 2, POOL: 3, TEAM: 2, MENTAL: -2 },
        res: "你两个位置都练，赛季里真上了三场上单。两年后这成了你最大的价值。",
        risk: { stat: "GAME", dc: 13, ok: "你成了队里唯一能打两个位置的人。季后赛你临危顶上，赢了两把。", bonus: { GAME: 3 } } }
    ]
  }
];
