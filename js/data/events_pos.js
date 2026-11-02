/* 《登神》位置专属事件池 + 四条故事线
   108 条：TOP 14 / JUG 15 / MID 14 / BOT 14 / SUP 14 条场外 + 25 条局内（顶层 inMatch:true，id ip_<pos>_<n>），另 4 条故事线每条 3 环
   schema 同 events.js；corrupt / justice 为结局暗线隐性数值，引擎读 eff 判定结局 */
window.DATA_EVENTS_POS = [
  /* ================= TOP：边线孤岛 ================= */
  {
    id: "pos_top_island", cat: "life", w: 15, once: false, year: 2,
    req: { pos: ["TOP"], stage: ["LPL"] },
    text: "上路兵线在塔下冻了四分钟。你一个人把对面压到二塔，抬头一看，四个队友已经在下路开大龙。",
    sub: "语音里没人叫你。你甚至不确定他们还记不记得场上有个上单。",
    opts: [
      { t: "传下去，赶最后一波", eff: { TEAM: 3, LANE: -2, energy: -6 },
        res: "你落地的时候团已经打完了。你捡了个人头，队友说：早该传了。",
        risk: { stat: "GAME", dc: 13, ok: "你从三角草绕后切死对面双 C，解说喊你的 ID 喊破了音。", fail: "你走到一半，屏幕右上角跳出「团灭」。", bonus: { FAME: 4 } } },
      { t: "继续带，直接拆二塔", eff: { LANE: 4, GAME: 2, TEAM: -3 }, res: "你带掉二塔，对面回防三个。他们那波龙团还是没赢。赛后教练问：那波你为什么不来？" },
      { t: "在语音里问一句：还打不打", eff: { TEAM: 1, MENTAL: -2, GAME: 2 }, res: "沉默三秒，打野回你：你说什么？然后他们开团了。你站在边线，看着屏幕上四条血条一起掉。" }
    ]
  },
  {
    id: "pos_top_dive", cat: "match", w: 13, once: false, year: 2,
    req: { pos: ["TOP"], stage: ["LPL"] },
    text: "对面上单只剩三分之一血，兵线顶在塔前。你双招全,等级领先一级。",
    sub: "你知道该上，你也知道这是一个陷阱。你就这么站在塔外想了十秒。",
    opts: [
      { t: "上，越塔", eff: { LANE: 3, MECH: 3, PHYS: -3 },
        res: "你打出一换一，塔伤把你压在残血。对面中单已经往下走了。",
        risk: { stat: "MECH", dc: 14, ok: "越塔单杀，兵线全吃，对面打野在三角草看完全程，没敢上。", fail: "你被塔打了两下，被对面反手一套带走。回放里你像在自杀。", bonus: { LANE: 3, FAME: 3 } } },
      { t: "忍，把线放回来", eff: { GAME: 3, LANE: 1, MENTAL: -1 }, res: "你把线放回来，稳稳吃满三波。下一波你有了铲子一样的补刀数，对面开始焦躁。" },
      { t: "叫打野来", eff: { TEAM: 2, GAME: 1, energy: -5 }, res: "打野在刷石头人，说马上。你等到对面中单上来，你们二打二打输了。他说：来得也太快了吧。" }
    ]
  },
  {
    id: "pos_top_tp", cat: "team", w: 14, once: false, year: 2,
    req: { pos: ["TOP"], stage: ["LPL"] },
    text: "下半区打起来了，你的 TP 亮在河道眼上。对面辅助已经在往那个眼插真眼。",
    sub: "教练在耳麦里倒数：三、二——",
    opts: [
      { t: "传，落点换草丛", eff: { GAME: 3, MECH: 2, LANE: -2 },
        res: "你落地时正好卡在对面阵型侧面，一波四打五打成了五打四。",
        risk: { stat: "GAME", dc: 12, ok: "你从侧面切进去，一波团把人头刷成 3-0。", fail: "你落地被真眼照到，五个人站在草丛里等你。", bonus: { FAME: 3 } } },
      { t: "不传，吃塔皮", eff: { LANE: 4, TEAM: -3, money: 5 }, res: "你吃到两层塔皮，三百块。下路那波团你们死了四个。教练没说话，只是把复盘的速度调慢了。" },
      { t: "传下去当人肉盾", eff: { TEAM: 3, PHYS: -4, MENTAL: -1 }, res: "你落地就顶上去，吃了全部控制。队友收完人头，打字：兄弟，这波你是爹。" }
    ]
  },
  {
    id: "pos_top_nofollow", cat: "match", w: 13, once: false, year: 2,
    req: { pos: ["TOP"], stage: ["LPL"] },
    text: "你在中路侧翼蹲了二十秒，绕后路线已经跑到位。你按下了开团键。",
    sub: "你的队友还在清最后两波线。",
    opts: [
      { t: "开了，剩下交给他们", eff: { MECH: 3, TEAM: -2, MENTAL: 2 },
        res: "你一个人吃了四个人的技能。屏幕黑掉的那五秒，你听见队友在喊：别送啊。",
        risk: { stat: "MECH", dc: 15, ok: "你一波开到三个人，队友跟着冲进来。这一波之后，全场都在说这个上单能处。", fail: "没人跟。你死得很干净，也很孤独。", bonus: { MECH: 3, TEAM: 2 } } },
      { t: "收手，等他们", eff: { GAME: 2, TEAM: 2, MECH: -2 }, res: "你退回来，等他们推完线。这三秒对面把位置站好了。这波团最后打成三换三。" },
      { t: "在语音里吼：跟啊！", eff: { TEAM: -3, MENTAL: 2, GAME: 1 }, res: "吼完那一下，全队安静了两秒。然后辅助说：你先看看地图。" }
    ]
  },
  {
    id: "pos_top_tank", cat: "team", w: 12, once: false, year: 2,
    req: { pos: ["TOP"], stage: ["LPL"] },
    text: "教练把你的椅子转过来：这版本你就玩坦克。你的剑姬练了两千场。",
    sub: "他说：队伍需要一个能开团的上单。你看了看中单，中单在看手机。",
    opts: [
      { t: "练，把坦克练成绝活", eff: { POOL: 4, TEAM: 3, MECH: -2 }, res: "你连玩三十把奥恩，玩到能闭着眼敲装备。队伍的胜率涨了，你的集锦没了。" },
      { t: "嘴上答应，比赛选剑姬", eff: { MECH: 4, LANE: 3, coach: -5, TEAM: -2 },
        res: "你偷偷练剑姬，BP 的时候硬点。赢了一把，也输了一把。",
        risk: { stat: "MECH", dc: 14, ok: "你的剑姬把对面上单打崩，赛后教练黑着脸说了句：行。", fail: "剑姬 0-5。教练当着全队把你换了下来。", bonus: { FAME: 5, MECH: 2 } } },
      { t: "直接摊牌：我不想当工具人", eff: { MENTAL: 3, coach: -4, TEAM: 1 }, res: "谈了一小时。他最后说：那你证明给我看。你知道这句话不是台阶，是绳子。" }
    ]
  },
  {
    id: "pos_top_split", cat: "training", w: 12, once: false, year: 2,
    req: { pos: ["TOP"], stage: ["LPL"], minStat: { LANE: 55 } },
    text: "队伍开始练四一分推。你是那个「一」。",
    sub: "意思是：他们四个打团，你一个人在地图另一边。",
    opts: [
      { t: "把单带练成一条命", eff: { LANE: 4, GAME: 3, energy: -14 }, res: "你练到能算清每一波兵线到塔的时间。一个人带穿三条边线，对面得派两个人来。" },
      { t: "跟团练，别老想着带", eff: { TEAM: 3, GAME: 2, LANE: -2 }, res: "你跟着团练了一整周。四一分推变成了五零团战，你们团战数据全联盟倒数。" },
      { t: "问教练：正面四个人守得住吗", eff: { GAME: 3, MENTAL: -2, TEAM: -1 }, res: "教练沉默了一会儿。第二天他改成了三二，你还是那个「二」。",
        risk: { stat: "GAME", dc: 13, ok: "你算出了对面的回防习惯：他们每次都慢 8 秒。这套东西后来成了你们的招牌。", fail: "对面直接放弃守塔，五个人压上来，你们正面四个人死得很快。", bonus: { GAME: 3 } } }
    ]
  },
  {
    id: "pos_top_rank1v1", cat: "training", w: 12, once: false, year: 2,
    req: { pos: ["TOP"], stage: ["LPL"] },
    text: "韩服凌晨三点，你排到了那个上路魔王。他的 ID 一出来，弹幕就飘满了。",
    sub: "你队友在语音里说：这把不上路，帮你不了。",
    opts: [
      { t: "硬碰硬，从一级打到结束", eff: { LANE: 4, MECH: 3, MENTAL: -3 },
        res: "你在两次对拼里赢了一次。那一把输了，你在回放里反复看他每一个走位。",
        risk: { stat: "LANE", dc: 15, ok: "你单杀他一次。截图在超话飞了一整晚，标题是：LPL 上单能打。", fail: "你被单杀三次。你关了游戏，坐在黑暗里，什么都没想。", bonus: { FAME: 6 } } },
      { t: "稳线，把资源让给队友", eff: { GAME: 3, TEAM: 2, LANE: -1 }, res: "你只死了两次，让出上路。队友 carry 了，评论区说：这上单好自觉。你听着像在夸你，又像在骂你。" },
      { t: "去偷他的蓝 buff", eff: { GAME: 3, POOL: 1, MENTAL: -2 }, res: "你偷到了，还顺手做掉一个真眼。他也偷了你的红，顺手把你带走。" }
    ]
  },
  {
    id: "pos_top_farm20", cat: "training", w: 11, once: false, year: 2,
    req: { pos: ["TOP"], stage: ["LPL"] },
    text: "20 分钟，你 210 刀，全场第一。人头 0-0-1，你们输了两千经济。",
    sub: "数据组把表贴在墙上，你的名字在第三页。",
    opts: [
      { t: "少补点，多去打架", eff: { TEAM: 3, GAME: 2, LANE: -2 }, res: "你开始主动推线跟团。补刀掉了 40，团战贡献冲进前三。教练第一次在复盘里点了你的名字。" },
      { t: "我就是队里最稳的那个", eff: { LANE: 3, MENTAL: 2, TEAM: -2 }, res: "你把线压死，对面上单连经验都吃不到。但你们还是输，因为对面中单 8-1。" },
      { t: "去单挑对面中单", eff: { MECH: 3, LANE: 1, MENTAL: -1 },
        res: "你从侧面绕进去，中单交了个闪现跑了。",
        risk: { stat: "MECH", dc: 13, ok: "你单杀了那个 8-1 的中单。全场解说说了一句：上单醒了。", fail: "你被中单和辅助联手做掉，还丢了个传送。", bonus: { FAME: 3 } } }
    ]
  },
  {
    id: "pos_top_backdoor", cat: "match", w: 10, once: false, year: 3,
    req: { pos: ["TOP"], stage: ["LPL"] },
    text: "对面五个人在打大龙。你们四个人守家，你站在对面高地塔前面。",
    sub: "打野在语音里喊：回来！回来！回来！",
    opts: [
      { t: "偷家，赌一把", eff: { GAME: 4, MECH: 3, TEAM: -2 },
        res: "你一个人拆开高地，对面大龙没了，家也没了。",
        risk: { stat: "GAME", dc: 17, ok: "你在对面五个人回城之前把水晶打爆。全场的镜头都在抖。", fail: "水晶差最后一下，五个人回来了。你们输掉这场，还上了十年集锦。", bonus: { FAME: 8, MECH: 2 } } },
      { t: "回去守", eff: { TEAM: 3, GAME: 2, LANE: -1 }, res: "你传送回城，五打五守下来了。这场比赛你们赢了，没人记得你为什么没去偷。" },
      { t: "打字问队友：偷不偷", eff: { TEAM: -2, MENTAL: 1, GAME: 1 }, res: "没人回你。你站在原地等了五秒，对面把大龙打完，你们被一波推平。" }
    ]
  },
  {
    id: "pos_top_benched", cat: "drama", w: 9, once: true, year: 2,
    req: { pos: ["TOP"], stage: ["LPL"] },
    text: "名单出来了，首发上单不是你。理由是「对线风格不适配版本」。",
    sub: "经理拍你肩膀：别多想，这不是你的问题。这句话他说了三遍。",
    opts: [
      { t: "留在基地，把替补打成首发", eff: { MECH: 4, LANE: 3, MENTAL: -3, energy: -15 }, res: "你每天练到凌晨，两周后教练把你换回来了。你回来那天，队伍刚输两场。" },
      { t: "开直播骂管理层", eff: { FAME: 6, coach: -6, TEAM: -5, MENTAL: -4 }, res: "直播间 8 万人，热搜挂了六个小时。第二天你被叫去开会，桌上放着一份文件。" },
      { t: "申请转会", eff: { MENTAL: 2, FAME: 2, TEAM: -6, coach: -5 }, res: "你把申请交上去，经理说：你想清楚，外面没这么多钱。你说我想清楚了。" }
    ]
  },
  {
    id: "pos_top_meta", cat: "training", w: 12, once: false, year: 2,
    req: { pos: ["TOP"], stage: ["LPL"] },
    text: "版本更新，上单从线霸变成了打工位。你的对线数据第二天就掉到了联盟第十八。",
    sub: "弹幕开始刷：版本上单。",
    opts: [
      { t: "换英雄池，硬练版本答案", eff: { POOL: 4, GAME: 3, energy: -14 }, res: "你连练十二天。新英雄熟练度从 40 练到 78，你的队内评分回到了前五。" },
      { t: "我打我的，版本会回来", eff: { MECH: 3, LANE: 3, POOL: -2, MENTAL: 2 }, res: "你继续玩自己的绝活。赢了两场，输了四场。解说说：这人在跟版本赌气。" },
      { t: "找数据组要对手的习惯", eff: { GAME: 4, POOL: 2, money: -8 }, res: "数据组给你做了 40 页的对线习惯表。你背下来，下一场对线期就把对面压回了塔下。" }
    ]
  },
  {
    id: "pos_top_soloq", cat: "life", w: 10, once: false, year: 2,
    req: { pos: ["TOP"], stage: ["LPL"] },
    text: "排位排到一个主播上单。他边打边开麦：兄弟们看好了，怎么打爆职业上单。",
    sub: "直播间三万人在看你。",
    opts: [
      { t: "认真打，把他打回原形", eff: { MECH: 3, LANE: 3, MENTAL: -2 },
        res: "你压了他四十刀。他关了麦，弹幕开始刷「职业就是职业」。",
        risk: { stat: "MECH", dc: 13, ok: "你在他直播间里单杀他三次。第二天他的粉丝来你超话道歉。", fail: "你被他的套路打得很难看。直播间标题改成：职业上单也不过如此。", bonus: { FAME: 4 } } },
      { t: "摆烂，把直播间变成节目", eff: { FAME: 5, MECH: -3, LANE: -2 }, res: "你故意送了两波，直播间笑疯了。第二天队友拿这个视频在群里刷了一整天。" },
      { t: "退了，不理他", eff: { MENTAL: 3, FAME: -2 }, res: "你交了投降。他在直播间说：跑了。你关掉客户端，去楼下买了瓶水。" }
    ]
  },
  {
    id: "pos_top_vs_fiora", cat: "match", w: 11, once: false, year: 2,
    req: { pos: ["TOP"], stage: ["LPL"] },
    text: "对面一楼亮剑姬。你的手在鼠标上停了一秒，全队都在等你说行不行。",
    sub: "教练问：能不能打？",
    opts: [
      { t: "能打，给我反手", eff: { LANE: 3, MECH: 3, TEAM: 1 },
        res: "你选了个坦克，前二十分钟把自己压在塔下。她一个越塔都没成功。",
        risk: { stat: "LANE", dc: 15, ok: "你两次化解她的越塔，后期一波团把她按在地上。这版本上单的尊严回来了。", fail: "你被越塔两次，二十分钟掉了两层塔皮。弹幕说：这上单在给她当爹。", bonus: { LANE: 4, FAME: 3 } } },
      { t: "换线，让下路去挨打", eff: { GAME: 3, LANE: -2, TEAM: -1 }, res: "你们换了线，她的剑姬在下路杀疯了。你说这是团队决策，弹幕说这是躲。" },
      { t: "硬选剑姬，跟她单挑", eff: { MECH: 4, LANE: 2, TEAM: -2, coach: -3 },
        res: "两个剑姬在上路打了十八分钟。",
        risk: { stat: "MECH", dc: 16, ok: "你赢了那场单挑，也赢了那把。赛后她发了个「gg」，你在训练室坐着笑了很久。", fail: "你输得很难看。她的名字挂在热搜，你的 ID 挂在集锦里，标题带「教学」。", bonus: { FAME: 6, LANE: 3 } } }
    ]
  },
  {
    id: "pos_top_aloof", cat: "team", w: 10, once: false, year: 3,
    req: { pos: ["TOP"], stage: ["LPL"], maxStat: { TEAM: 55 } },
    text: "这周的训练赛，四打五打了三次。你每次都在边线。",
    sub: "辅助终于忍不住了：你能不能别老一个人待着。",
    opts: [
      { t: "我待着是因为你们不需要我", eff: { MENTAL: 2, TEAM: -4, LANE: 2 }, res: "语音里静了十秒。训练赛继续，他们四打五，你继续带。这周你上了两次分。" },
      { t: "道歉，跟着团练一周", eff: { TEAM: 5, GAME: 2, LANE: -2 }, res: "你跟着团练了一周，参团率从 34% 涨到 62%。你不习惯，但队伍的气氛确实变了。" },
      { t: "找教练把话摊开", eff: { TEAM: 3, GAME: 3, coach: 2, MENTAL: -1 }, res: "三个人在训练室谈到凌晨。教练说了一句很实在的话：我们不是不想用你，是不会用你。" }
    ]
  },

  /* ---------- TOP 局内 ---------- */
  {
    id: "ip_top_1", cat: "match", w: 12, once: false, year: 0,
    inMatch: true,
    req: { pos: ["TOP"] },
    text: "你把对面上单压在塔下，他只剩一丝血，双招全交。打野在红区，赶不过来。",
    sub: "这波你上不上？",
    opts: [
      { t: "越，强杀", eff: { LANE: 3, MECH: 3, PHYS: -2 },
        res: "你抗了两下塔，把他按死在塔下。",
        risk: { stat: "MECH", dc: 14, ok: "单杀，兵线全吃，上路彻底打开。对面打野只能去下路找机会。", fail: "你被塔打死，送出一血。上路从此变成了提款机。", bonus: { LANE: 4, FAME: 3 } } },
      { t: "控线，等打野", eff: { GAME: 3, LANE: 2, TEAM: 1 }, res: "你把线冻在塔前，他连补刀都不敢。三分钟后打野来了，一波带走。" },
      { t: "推线游走中路", eff: { GAME: 2, TEAM: 2, LANE: -2 }, res: "你把线推进去，去中路蹲了一波。对面中单交闪跑了，你白跑一趟，上路丢了两波线。" }
    ]
  },
  {
    id: "ip_top_2", cat: "match", w: 12, once: false, year: 0,
    inMatch: true,
    req: { pos: ["TOP"] },
    text: "大龙还有 40 秒。你家上路的兵线卡在对面二塔前面，对面五个人在集结。",
    sub: "这波线你带不带？",
    opts: [
      { t: "带到底，逼他们分人", eff: { GAME: 3, LANE: 3, TEAM: -2 },
        res: "对面被迫派两个人回防。你们四个人拿下了大龙。",
        risk: { stat: "GAME", dc: 15, ok: "你一个人逼回两个人，大龙稳稳到手。这波运营教科书级别。", fail: "对面不回头，五个人直接开龙。你带掉一座塔，他们拿到大龙。", bonus: { GAME: 4 } } },
      { t: "回城参团", eff: { TEAM: 3, GAME: 1, LANE: -2 }, res: "你回城赶到龙坑，五打五。你们站位更好，龙团赢了。" },
      { t: "假装带线，实际绕后", eff: { MECH: 3, GAME: 2, MENTAL: -1 },
        res: "你绕到龙坑后面，正面开团，你从侧翼切进去。",
        risk: { stat: "MECH", dc: 14, ok: "你从龙坑上方跳下去，一刀砍死对面 C 位。解说席全站起来了。", fail: "你被真眼照到，从草丛里被揪出来打死，大龙也丢了。", bonus: { FAME: 4 } } }
    ]
  },
  {
    id: "ip_top_3", cat: "match", w: 12, once: false, year: 0,
    inMatch: true,
    req: { pos: ["TOP"] },
    text: "下路二打三打起来了，你有一个 TP。对面辅助刚插了个真眼在你脚下的眼位。",
    sub: "传不传？传哪个眼？",
    opts: [
      { t: "传脚下的眼，硬刚", eff: { MECH: 2, TEAM: 2, PHYS: -3 },
        res: "你落地清掉真眼，正面加入。",
        risk: { stat: "GAME", dc: 14, ok: "你在真眼上落地，对面反而慌了。五打四变成你们赢团，还拿了下路一塔。", fail: "你在真眼上落地，四打三被反打成一换三。队友问：为什么不走后面？", bonus: { TEAM: 3 } } },
      { t: "走三角草，绕后传", eff: { GAME: 3, MECH: 2, LANE: -2 }, res: "你从侧面落地，对面阵型直接散了。你们收了两个人头。" },
      { t: "不传，吃上路塔皮", eff: { LANE: 4, TEAM: -3, money: 5 }, res: "你吃到两层塔皮。下路死了三个，这波之后队伍经济落后四千。" }
    ]
  },
  {
    id: "ip_top_4", cat: "match", w: 12, once: false, year: 0,
    inMatch: true,
    req: { pos: ["TOP"] },
    text: "对面打野从河道摸上来了，你贴在塔前，兵线顶在对面塔下，你还剩一瓶血。",
    sub: "这波你怎么活？",
    opts: [
      { t: "反打，一打二", eff: { MECH: 4, LANE: 2, PHYS: -4 },
        res: "你退了半步，等打野先手。",
        risk: { stat: "MECH", dc: 16, ok: "你骗掉打野的位移，反手一套把人打死，再收掉上单。一打二双杀。", fail: "你被控在原地打死，塔下的兵线也白送。看台上有人开始笑。", bonus: { FAME: 5, LANE: 4 } } },
      { t: "交闪，缩塔下", eff: { GAME: 3, LANE: -1, PHYS: -1 }, res: "你闪回塔下，兵线全丢。你活着，上路暂时没崩。" },
      { t: "往中路拉，把兵线让出去", eff: { TEAM: 2, GAME: 2, LANE: -2 }, res: "你把人带到中路附近，给了中单包抄的机会。这波你们反拿两个人头。" }
    ]
  },
  {
    id: "ip_top_5", cat: "match", w: 12, once: false, year: 0,
    inMatch: true,
    req: { pos: ["TOP"] },
    text: "中路团，对面五个人挤在龙坑口。你在侧翼，队友在正面等你的先手。",
    sub: "你上不上？",
    opts: [
      { t: "先手，把人开穿", eff: { TEAM: 3, MECH: 3, PHYS: -3 },
        res: "你压上去了，队友跟着冲。",
        risk: { stat: "MECH", dc: 15, ok: "你开到四个人，团战二十秒结束。这一波之后你上了集锦封面。", fail: "你开进人堆，队友没跟上，你被集火秒了。弹幕刷屏：上单又单机了。", bonus: { TEAM: 4, FAME: 4 } } },
      { t: "等，让对方开", eff: { GAME: 3, TEAM: 2, MECH: -1 }, res: "你等对面先动手，反手切后排。这波团打成四换二，你们赢下小规模团战。" },
      { t: "去后排找 C 位", eff: { MECH: 4, LANE: 1, TEAM: -2 }, res: "你一个人绕后排，跟队友脱节了。你把 AD 打残，但正面已经崩了。" }
    ]
  },
  /* ================= JUG：背锅位 ================= */
  {
    id: "pos_jug_blame", cat: "team", w: 15, once: false, year: 2,
    req: { pos: ["JUG"], stage: ["LPL"] },
    text: "三路都在喊你。上路说被越了，中路说没视野，下路说对面打野来了三次。",
    sub: "你站在自家野区，红 buff 还剩三秒刷新。",
    opts: [
      { t: "先去下路，至少救一路", eff: { TEAM: 2, GAME: 2, LANE: -2 }, res: "你下去反蹲，蹲到对面打野。下路保住了，上路骂了一整局。" },
      { t: "闷头刷到六，再出来讲话", eff: { GAME: 4, MECH: 2, TEAM: -3, MENTAL: -2 }, res: "你刷到六分钟才第一次支援。出来的时候你等级领先两级，三路都在骂你。" },
      { t: "在语音里说：你们先别死", eff: { MENTAL: 2, TEAM: -4, GAME: 2 }, res: "说完这句话，语音安静了。下一波三路同时被抓，你一个人在野区笑出了声。" }
    ]
  },
  {
    id: "pos_jug_countergank", cat: "training", w: 13, once: false, year: 2,
    req: { pos: ["JUG"], stage: ["LPL"] },
    text: "复盘时教练指着屏幕：这里对面打野在蹲，你在草里看着他蹲了十二秒。",
    sub: "他说：你为什么不反蹲？你说：我在等他先动。",
    opts: [
      { t: "练反蹲，练到能读他每一步", eff: { GAME: 4, POOL: 2, energy: -12 }, res: "你研究了一百场对面打野的第一波路线。下一场你三次反蹲成功，赛后他来找你握手。" },
      { t: "我这是反蹲，只是他不动", eff: { MENTAL: 3, GAME: 1, coach: -2 }, res: "教练笑了，然后把这段录像放进了全队复盘的 PPT，标题：等待型打野。" },
      { t: "改成主动入侵", eff: { GAME: 3, MECH: 3, MENTAL: -2 },
        res: "你第二场直接进他野区。",
        risk: { stat: "GAME", dc: 14, ok: "你连偷三个野怪，他的节奏直接断了。", fail: "你被他和中单夹在野区，送出一血，还丢了两组野。", bonus: { GAME: 3 } } }
    ]
  },
  {
    id: "pos_jug_invaded", cat: "match", w: 13, once: false, year: 2,
    req: { pos: ["JUG"], stage: ["LPL"] },
    text: "你的红 buff 没了，F6 也没了。一级入侵，对面打野连个招呼都没打。",
    sub: "你只能去上半区吃那几组垃圾野。",
    opts: [
      { t: "硬吃，抢回节奏", eff: { GAME: 3, MECH: 2, PHYS: -3 }, res: "你吃了两组野，等级落后一级。这局你前十分钟没露过一次面。" },
      { t: "去对面野区换东西", eff: { GAME: 4, TEAM: 1, LANE: -1 },
        res: "你跑到他野区偷了两组，顺便在河道插了个眼。",
        risk: { stat: "GAME", dc: 13, ok: "你换到了两波野，等级没掉。他还得回防。", fail: "你在对面野区被三个人抓住，害得中路也跟着来救你。", bonus: { GAME: 2 } } },
      { t: "叫队友一起进", eff: { TEAM: 4, GAME: 2, energy: -6 }, res: "辅助和上单陪你进了两次野区。对面打野从入侵者变成了被入侵者。这波气势拉回来了。" }
    ]
  },
  {
    id: "pos_jug_dragon", cat: "match", w: 14, once: false, year: 2,
    req: { pos: ["JUG"], stage: ["LPL"] },
    text: "小龙还有 10 秒。对面五个人在河道，你们只有四个人到齐，中单还在补刀。",
    sub: "你手里有惩戒，也有 2000 血。",
    opts: [
      { t: "抢，跳下去惩戒", eff: { GAME: 4, MECH: 2, PHYS: -3 },
        res: "你算好了血量跳下去。",
        risk: { stat: "GAME", dc: 15, ok: "你惩戒抢到小龙，还活着爬出来。队友在语音里吼了一嗓子。", fail: "你被控在龙坑里，龙也没抢到。这波之后你没再拿到过一条龙。", bonus: { TEAM: 4, FAME: 3 } } },
      { t: "放龙，反手拿峡谷", eff: { GAME: 3, TEAM: 1, LANE: -1 }, res: "你们放了小龙，转头拿峡谷先锋。换资源的账算得很清楚，但弹幕在刷「打野不敢抢」。" },
      { t: "让中单先推线，等下一波", eff: { TEAM: 2, GAME: 2, MENTAL: -2 }, res: "你们放了三条小龙。第四条的时候，对面已经不给你机会了。" }
    ]
  },
  {
    id: "pos_jug_helpwho", cat: "team", w: 13, once: false, year: 2,
    req: { pos: ["JUG"], stage: ["LPL"] },
    text: "上路被压，中路被压，下路也喊被抓。你只能蹲一路。",
    sub: "教练在耳麦里说：自己判断。",
    opts: [
      { t: "蹲上路，他是队里最贵的人", eff: { TEAM: 2, LANE: 2, GAME: -1 }, res: "上单起来了，中路崩了。赛后数据：中路被抓七次，你去了零次。" },
      { t: "蹲下路，保住后期", eff: { GAME: 3, TEAM: 2, LANE: -2 }, res: "下路三打二反打成功，AD 拿到两个人头。上路那位在语音里说了一句：行，我就是孤儿。" },
      { t: "三路平均，哪都不深蹲", eff: { GAME: 2, TEAM: 1, MECH: -2 }, res: "你三路各去了两次。三路都没起来，赛后数据说你「覆盖面广」。你知道那是句客套话。" }
    ]
  },
  {
    id: "pos_jug_smite", cat: "match", w: 12, once: false, year: 2,
    req: { pos: ["JUG"], stage: ["LPL"] },
    text: "大龙 1000 血，你按下惩戒。屏幕上跳出一行字：敌方抢到了大龙。",
    sub: "全队安静了六秒。",
    opts: [
      { t: "认，是我没算好", eff: { MENTAL: 2, TEAM: 3, GAME: 2 }, res: "你说了三遍对不起。队长说：算了，下一条龙还在。" },
      { t: "怪对面辅助挡了一下", eff: { TEAM: -4, MENTAL: 1, coach: -2 }, res: "语音里没人接话。赛后集锦把你的惩戒剪成了慢动作，配了个心跳音效。" },
      { t: "当场崩，下一波不打了", eff: { MENTAL: -4, TEAM: -3, GAME: -2 }, res: "剩下的十分钟你像在梦游。比赛结束的时候，你第一个站起身走了。" }
    ]
  },
  {
    id: "pos_jug_path", cat: "training", w: 12, once: false, year: 2,
    req: { pos: ["JUG"], stage: ["LPL"] },
    text: "数据组给你看了开野路线：你的第一波，对面已经背了三个月。",
    sub: "你的第一波被研究透了。",
    opts: [
      { t: "改路线，从今天开始随机", eff: { GAME: 4, POOL: 2, energy: -10 }, res: "你把开野路线改成三种随机，对面数据组的表就废了一半。第一周你多死两次，第二周开始赢。" },
      { t: "不改，我的路线就是最优的", eff: { GAME: 2, MECH: 3, TEAM: -1 }, res: "你用同一套路线又打了一个月。赢了三场，被反了五次。" },
      { t: "去问对面打野怎么研究我的", eff: { GAME: 3, FAME: 2, MENTAL: -1 },
        res: "你托人问了。他回了一句：你的路线不是问题，你的视野习惯才是。",
        risk: { stat: "GAME", dc: 13, ok: "你顺着他的思路重做了自己的视野布点。下一场你的开野偷到了他两波。", fail: "这句评价流到了论坛，标题是：LPL 打野连自己怎么被研究都不知道。", bonus: { GAME: 3 } } }
    ]
  },
  {
    id: "pos_jug_junglecarry", cat: "training", w: 11, once: false, year: 2,
    req: { pos: ["JUG"], stage: ["LPL"] },
    text: "版本改成野核。打野经济占了队伍的三分之一，教练把战术本翻到最后一页。",
    sub: "他说：这版本你可以 C 了。你听着像在给你加担子。",
    opts: [
      { t: "接，按野核的打法来", eff: { MECH: 3, GAME: 3, TEAM: -1, energy: -12 }, res: "你开始吃线、吃人头、吃野区。两场 MVP，一场被针对到零参团。" },
      { t: "还是给线上让资源", eff: { TEAM: 4, GAME: 2, MECH: -2 }, res: "你把资源让出去，稳住三路。野核版本你们打成了四保一，还赢了两场。" },
      { t: "跟教练说：我更适合工具人打野", eff: { TEAM: 2, MECH: 2, GAME: 1, coach: -2 }, res: "教练看了你很久，说：行，那你就做版本不需要的那个人。" }
    ]
  },
  {
    id: "pos_jug_young", cat: "drama", w: 10, once: true, year: 2,
    req: { pos: ["JUG"], stage: ["LPL"] },
    text: "青训打野被提上一队，十七岁，韩服第一。他叫你哥，但眼神不像在看哥。",
    sub: "训练赛第一场，他把你压成了替补。",
    opts: [
      { t: "教他，把位置坐稳", eff: { TEAM: 4, GAME: 3, MECH: -1, energy: -10 }, res: "你教他怎么读对手的入侵。三个月后他成了首发，你成了他的教练之一。" },
      { t: "冷处理，不教", eff: { MENTAL: 2, TEAM: -4, GAME: 1 }, res: "他在训练赛里被对面研究透了。教练问你为什么不带他，你说：我忙。" },
      { t: "跟他明抢，赢的人上", eff: { MECH: 3, GAME: 3, MENTAL: -3, coach: 2 },
        res: "你们打了一周的对练。",
        risk: { stat: "MECH", dc: 14, ok: "你把十七岁按在地上摩擦了一周。教练说：位置还是你的，但别得意。", fail: "你输了。那天晚上你在基地外面的台阶上坐了两个小时。", bonus: { MECH: 4 } } }
    ]
  },
  {
    id: "pos_jug_banned", cat: "match", w: 11, once: false, year: 2,
    req: { pos: ["JUG"], stage: ["LPL"] },
    text: "对面 ban 了你三个打野。你唯一会玩的那个，是版本下水道。",
    sub: "教练问：还有没有能拿的？",
    opts: [
      { t: "拿一个只练过五把的", eff: { POOL: 3, MECH: 2, MENTAL: -2 },
        res: "你拿了个冷门，前期刷得很顺。",
        risk: { stat: "POOL", dc: 14, ok: "你的冷门打野把对面刷崩了。赛后有人做视频：LPL 打野的第五个英雄。", fail: "你连技能循环都没打对。二十分钟，经济差四千。", bonus: { FAME: 4, POOL: 3 } } },
      { t: "拿绝活，硬玩", eff: { MECH: 3, LANE: 1, GAME: -2 }, res: "你把绝活从 ban 里抠出来用。打得很凶，也很险。" },
      { t: "跟教练说：这把我打辅助节奏", eff: { GAME: 3, TEAM: 3, MECH: -2 }, res: "你整局让经济，专门开视野。这一把你们赢得很难看，但赢了。" }
    ]
  },
  {
    id: "pos_jug_stream", cat: "media", w: 10, once: false, year: 2,
    req: { pos: ["JUG"], stage: ["LPL"] },
    text: "一个退役打野在直播里评价你：这人不是打野，是逃跑型打野。",
    sub: "弹幕笑了一整晚。",
    opts: [
      { t: "回他一句：你当年也是", eff: { FAME: 4, MENTAL: -2, TEAM: 1 }, res: "你回得很干脆。他直播里愣了两秒，说：这小孩有点意思。第二天你上了热搜。" },
      { t: "打一场完美比赛堵他嘴", eff: { GAME: 4, MECH: 2, energy: -12 }, res: "下一场你全场零失误，抢了两条龙。他第二天发了个视频，标题：我道歉。" },
      { t: "关掉直播，不看", eff: { MENTAL: 3, FAME: -2 }, res: "你卸载了直播软件一周。一周后你回到直播间，那句话已经变成了梗。" }
    ]
  },
  {
    id: "pos_jug_negcollapse", cat: "drama", w: 9, once: true, year: 2,
    req: { pos: ["JUG"], stage: ["LPL"] },
    text: "三路被压，你进野区被反，出来被抓。这局你连一次正面团都没打过。",
    sub: "你坐在那里，觉得这把游戏跟你无关。",
    opts: [
      { t: "认了，等下一把", eff: { MENTAL: -3, TEAM: -2, GAME: -1 }, res: "剩下的二十分钟你在刷野。比赛结束，你的数据是全队最差的。" },
      { t: "强行找一波节奏", eff: { GAME: 2, MECH: 2, MENTAL: -3, TEAM: -2 }, res: "你强行开了一波，被抓了。这波之后，队伍连反抗的力气都没了。" },
      { t: "换打法，给线上当狗", eff: { TEAM: 2, GAME: 2, MECH: -3, energy: -12 }, res: "你把能给的都给了。你们还是输，但赛后没人骂你——这已经是你今年最好的结果。" }
    ]
  },
  {
    id: "pos_jug_public", cat: "media", w: 9, once: false, year: 3,
    req: { pos: ["JUG"], stage: ["LPL"] },
    text: "赛后发布会，第一个问题就是：今天打野的节奏为什么这么慢？",
    sub: "你坐在那儿，手里的话筒有点凉。",
    opts: [
      { t: "把责任全揽下来", eff: { TEAM: 4, FAME: -2, MENTAL: -1 }, res: "你说：我的问题。第二天队友来你房间，什么也没说，放下两瓶饮料就走了。" },
      { t: "说：三路都在被压，打野很难", eff: { TEAM: -4, FAME: 2, MENTAL: 1 }, res: "这句话被剪成十五秒视频，标题：打野甩锅三路。第二天队内气氛冷得像冰箱。" },
      { t: "说：下一场我会更好", eff: { MENTAL: 3, TEAM: 2, FAME: 1 }, res: "最无聊的答案，也是最没风险的。第二天你练了四个小时，没人看见。" }
    ]
  },
  {
    id: "pos_jug_1v1", cat: "training", w: 11, once: false, year: 2,
    req: { pos: ["JUG"], stage: ["LPL"] },
    text: "河道撞见对面打野，两个人六组野都刷完了，等级一样，都只剩三成血。",
    sub: "中路还在补刀，辅助在中路。这波只可能是你们两个的事。",
    opts: [
      { t: "打，谁跑谁是狗", eff: { MECH: 3, GAME: 2, PHYS: -2 },
        res: "两个人在河道打了四十秒。",
        risk: { stat: "MECH", dc: 14, ok: "你赢了这场单挑，还顺手把他的红 buff 拿走。士气直接拉满。", fail: "你死了。他的 ID 上了集锦，标题：正面对话。", bonus: { MECH: 3, TEAM: 2 } } },
      { t: "撤，去抢他的野", eff: { GAME: 3, TEAM: 1, MECH: -1 }, res: "你撤退去偷了他两组野。他追过来，被你带着队友围攻。这波你赚了。" },
      { t: "叫中路一起上", eff: { TEAM: 3, GAME: 2, energy: -5 }, res: "中路来了，你们两个把他按死。辅助在语音里说：打野终于会叫人了。" }
    ]
  },
  {
    id: "pos_jug_reviewnone", cat: "team", w: 9, once: false, year: 2,
    req: { pos: ["JUG"], stage: ["LPL"] },
    text: "复盘两小时，四十分钟在讲上路的对线，四十分钟在讲下路的团战。你的野区路线，一句没提。",
    sub: "所有人都走了，你一个人把录像拖回第一分钟。",
    opts: [
      { t: "自己复盘，做成 PPT 发给教练", eff: { GAME: 4, energy: -14, coach: 2 }, res: "你做了 30 页。教练在群里回了一句：这个做得不错。就这一句，你看了三遍。" },
      { t: "算了，反正没人看", eff: { MENTAL: 3, GAME: -2 }, res: "你关掉电脑，去打了两把排位。这两把你都没认真。" },
      { t: "质问教练为什么不讲打野", eff: { GAME: 2, coach: -4, MENTAL: 1 }, res: "教练说：打野没有对错，只有节奏。你听完更迷茫了。" }
    ]
  },

  /* ---------- JUG 局内 ---------- */
  {
    id: "ip_jug_1", cat: "match", w: 12, once: false, year: 0,
    inMatch: true,
    req: { pos: ["JUG"] },
    text: "你在上路草丛蹲了二十秒。对面打野从河道过来，也蹲在这里。你们俩只隔了两堵墙。",
    sub: "这波你反不反蹲？",
    opts: [
      { t: "反蹲他，等他先手", eff: { GAME: 3, MECH: 2, TEAM: 1 },
        res: "他先上了，你从草丛里出来。",
        risk: { stat: "GAME", dc: 14, ok: "你反蹲成功，一波二换零，上单拿到人头。对面打野这局再没来过上路。", fail: "他的中单跟着来了。你们二打三，全死了。", bonus: { GAME: 3, TEAM: 3 } } },
      { t: "去打龙，逼他回防", eff: { GAME: 3, LANE: -1, TEAM: 1 }, res: "你转头去打小龙，对面被迫放弃上路。你们拿下龙，还赚了一波兵线。" },
      { t: "继续等，再蹲十秒", eff: { MECH: 2, GAME: -1, PHYS: -2 }, res: "你多蹲了十秒。他走了，你的上单被越了。这波你什么都没拿到。" }
    ]
  },
  {
    id: "ip_jug_2", cat: "match", w: 12, once: false, year: 0,
    inMatch: true,
    req: { pos: ["JUG"] },
    text: "大龙 1200 血。对面打野的位置不明，你的惩戒已经攥出汗了。",
    sub: "抢不抢？",
    opts: [
      { t: "算血量，卡惩戒", eff: { GAME: 3, MECH: 2, TEAM: 1 },
        res: "你一边打一边数血量。",
        risk: { stat: "GAME", dc: 15, ok: "你卡住惩戒，一刀抢到。这波之后对面心态崩了一半。", fail: "你晚了 0.2 秒，大龙被抢。全场镜头切到你的脸。", bonus: { TEAM: 4, FAME: 3 } } },
      { t: "先杀人再拿龙", eff: { MECH: 3, TEAM: 2, GAME: -1 }, res: "你转头开团，把对面打野先杀了。大龙白拿。" },
      { t: "让中单去惩戒，你开视野", eff: { TEAM: 2, GAME: 2, MECH: -2 }, res: "你在龙坑外插满眼，中单惩戒成功。这波你没上镜头，但龙是你们的。" }
    ]
  },
  {
    id: "ip_jug_3", cat: "match", w: 12, once: false, year: 0,
    inMatch: true,
    req: { pos: ["JUG"] },
    text: "你在对面红区做视野。他刚好走过来，一个人，没插眼，血量七成。",
    sub: "这波搞不搞？",
    opts: [
      { t: "搞，直接上", eff: { MECH: 3, GAME: 2, PHYS: -2 },
        res: "你贴上去一套。",
        risk: { stat: "MECH", dc: 14, ok: "你把他打死在自家野区，还偷了一波野。这波以后对面打野不敢一个人动。", fail: "他把你引进三角草，中单在那里等着。你送了，还丢了两组野。", bonus: { GAME: 3, TEAM: 2 } } },
      { t: "不搞，把真眼插到他家", eff: { GAME: 4, TEAM: 1, MENTAL: -1 }, res: "你在他家插了个深眼。对方打野的路线从此全在你们视野里。" },
      { t: "叫线上过来包", eff: { TEAM: 3, GAME: 2, energy: -5 }, res: "上单绕了一圈过来，你们把他夹在野区。这波人头给了上单，他直接在语音里喊了声：爱了。" }
    ]
  },
  {
    id: "ip_jug_4", cat: "match", w: 12, once: false, year: 0,
    inMatch: true,
    req: { pos: ["JUG"] },
    text: "你落后两级，野区被刷空了。第一条小龙还有 30 秒，队友都在往河道靠。",
    sub: "打不打？",
    opts: [
      { t: "打，用人数优势换", eff: { TEAM: 3, GAME: 2, MECH: -1 },
        res: "你们五个人在河道开团。",
        risk: { stat: "TEAM", dc: 13, ok: "人数优势打成一换二，小龙到手，你也追回了一波经验。", fail: "对面打野等级领先，你们团战被开成筛子。", bonus: { GAME: 2, TEAM: 2 } } },
      { t: "放龙，去偷他的野区", eff: { GAME: 3, LANE: -1, MECH: 1 }, res: "你放掉小龙，把他的野区刷了个干净。等级追回来了，但对面拿了两条龙。" },
      { t: "让队友别来，自己去抢", eff: { GAME: 2, MECH: 2, MENTAL: -2 }, res: "你一个人摸进龙坑。没抢到，也没死。队友说你赌，你说这叫节奏。" }
    ]
  },
  {
    id: "ip_jug_5", cat: "match", w: 12, once: false, year: 0,
    inMatch: true,
    req: { pos: ["JUG"] },
    text: "中路团打起来了。你从侧面绕过去，正面队友已经掉了两个人，龙坑还剩三个残血。",
    sub: "上不上？",
    opts: [
      { t: "上，切他们后排", eff: { MECH: 3, TEAM: 2, PHYS: -3 },
        res: "你从侧翼冲进去，目标是那个 5-1 的 AD。",
        risk: { stat: "MECH", dc: 15, ok: "你切死 AD，再收掉中单。这波团你们零换四，直接翻盘。", fail: "你被集火死在人群里。这波团之后，你没再进场过。", bonus: { TEAM: 3, FAME: 4 } } },
      { t: "带走一个，然后撤", eff: { GAME: 3, TEAM: 1, MENTAL: 1 }, res: "你换掉辅助，然后活着撤出来。这波你们少亏两个人。" },
      { t: "不开，等他们追出来", eff: { GAME: 3, TEAM: 2, MECH: -2 }, res: "你退到塔下，把对面引进来。这波你们反打成一换三。" }
    ]
  },
  /* ================= MID：全图最亮的靶子 ================= */
  {
    id: "pos_mid_target", cat: "match", w: 15, once: false, year: 2,
    req: { pos: ["MID"], stage: ["LPL"] },
    text: "开局四分钟，对面中野辅三个人从河道压过来。你的兵线刚好卡在对面塔前。",
    sub: "你看了看地图，四个队友都在自己的线上。",
    opts: [
      { t: "交闪，把命保住", eff: { GAME: 3, LANE: -2, PHYS: -2 }, res: "你交闪跑掉，丢了两波线。对面中单吃完线去下路，你只能眼睁睁看着。" },
      { t: "反打，赌他们越塔", eff: { MECH: 4, LANE: 2, MENTAL: -2 },
        res: "你贴着塔打，等辅助先交控制。",
        risk: { stat: "MECH", dc: 15, ok: "你反手一换二，还把打野打残。全场解说说：这中单有点东西。", fail: "三个人把你按在塔下。你死了，塔也掉了，弹幕开始刷「中单提款机」。", bonus: { MECH: 3, FAME: 3 } } },
      { t: "往野区拉，等队友包", eff: { GAME: 3, TEAM: 2, LANE: -1 }, res: "你把战场拉到野区，打野和辅助终于赶到了。这波打成二换二，你没吃亏。" }
    ]
  },
  {
    id: "pos_mid_roam", cat: "training", w: 14, once: false, year: 2,
    req: { pos: ["MID"], stage: ["LPL"] },
    text: "你 15 分钟补了 160 刀，对面中单补了 190。他去游走了三次，你去了零次。",
    sub: "教练问：你到底想赢哪一条线？",
    opts: [
      { t: "改，跟着游走", eff: { GAME: 4, TEAM: 3, LANE: -2 }, res: "你开始把兵线推出去就往下走。这周你游走了十二次，成了队里支援最多的人。" },
      { t: "不改，中单就要吃线", eff: { LANE: 4, MECH: 2, TEAM: -2 }, res: "你的补刀数据全联盟前三。你们输了那三场，每场对面中单都在下路拿到人头。" },
      { t: "先推线，再游走，两个都要", eff: { GAME: 3, LANE: 2, energy: -12 },
        res: "你把兵线处理练到极致。",
        risk: { stat: "GAME", dc: 13, ok: "你找到了那个时间差：推完线两秒就走，回来正好接下一波。这套节奏你们连赢四场。", fail: "你两头都想要，结果补刀掉了三十，游走也没抓到人。", bonus: { GAME: 3, TEAM: 2 } } }
    ]
  },
  {
    id: "pos_mid_focus", cat: "match", w: 14, once: false, year: 2,
    req: { pos: ["MID"], stage: ["LPL"] },
    text: "对面打野这局第一次露面，就在你中路草丛里。他已经蹲了你两波。",
    sub: "你的辅助在语音里说：他住中路了。",
    opts: [
      { t: "认，先缩塔下发育", eff: { GAME: 3, LANE: -1, MENTAL: 1 }, res: "你在塔下吃了十分钟。补刀少二十，但没死。对面打野浪费了大量时间。" },
      { t: "反过来抓他", eff: { GAME: 3, MECH: 2, LANE: 2 },
        res: "你故意走位失误，等他上。",
        risk: { stat: "MECH", dc: 15, ok: "你把他骗出来，反手配合辅助击杀。这波之后他再没蹲过中路。", fail: "你没骗到他，反而把自己送进去了。中路二塔提前告急。", bonus: { FAME: 3, TEAM: 2 } } },
      { t: "跟辅助换线，去下路打", eff: { TEAM: 3, GAME: 2, LANE: -2 }, res: "你跟下路换线，去下路打了两波。中路的压力转给了 AD，他被打得很惨。" }
    ]
  },
  {
    id: "pos_mid_version", cat: "training", w: 13, once: false, year: 2,
    req: { pos: ["MID"], stage: ["LPL"] },
    text: "版本更新，你的本命被砍了 8% 伤害。新版本答案是那个你从来没玩过的英雄。",
    sub: "训练赛第一把，你被对面用版本答案打穿了。",
    opts: [
      { t: "硬练版本答案，练到能上场", eff: { POOL: 4, GAME: 3, energy: -15 }, res: "你连练十天，把它练到熟练度 82。第二周你用它拿了 MVP。" },
      { t: "我玩本命，砍了也是本命", eff: { MECH: 3, LANE: 3, POOL: -2, MENTAL: 2 }, res: "你的本命打得还是有模有样，就是每次团战都差那么一点伤害。那一点，就是 8%。" },
      { t: "让队伍围绕我的本命改战术", eff: { TEAM: 3, GAME: 3, coach: 2, energy: -10 }, res: "教练组为你设计了三套体系。这套东西打出了效果，但版本一改就全废。" }
    ]
  },
  {
    id: "pos_mid_solo", cat: "match", w: 12, once: false, year: 2,
    req: { pos: ["MID"], stage: ["LPL"] },
    text: "你单杀了对面中单。导播的镜头切到你脸上，全场在喊。",
    sub: "三十秒后，你被对面四个人抓在中路二塔下。",
    opts: [
      { t: "撤，别贪那波兵", eff: { GAME: 3, MENTAL: 2, LANE: -1 }, res: "你放弃那波兵回城。对面四个人在塔下站了十秒，什么也没拿到。" },
      { t: "吃完这波再走", eff: { LANE: 3, MECH: 2, MENTAL: -3 },
        res: "你多吃了六个兵。",
        risk: { stat: "GAME", dc: 14, ok: "你吃完最后两个兵，卡着对面进塔的时间溜了。这波单杀含金量拉满。", fail: "你被四个人堵在塔下。刚拿的人头，连本带利还了回去。", bonus: { LANE: 3 } } },
      { t: "回头再打一个", eff: { MECH: 3, MENTAL: 2, LANE: -2 }, res: "你回头想再杀一次，对面辅助已经到了。你换了半血，人头没拿到。" }
    ]
  },
  {
    id: "pos_mid_carry", cat: "team", w: 13, once: false, year: 2,
    req: { pos: ["MID"], stage: ["LPL"] },
    text: "赛前教练把战术板推到你面前：今天就围绕你打，你是唯一的核心。",
    sub: "上单和 AD 的表情都不太好看。",
    opts: [
      { t: "接，我来 C", eff: { MECH: 3, GAME: 3, TEAM: -2, energy: -10 }, res: "你打了四把，两把 MVP，两把被打崩。队友说：这战术太赌了。" },
      { t: "推掉：还是打团队", eff: { TEAM: 4, GAME: 2, MECH: -1 }, res: "你把战术板推回去。教练盯了你三秒，说：行，那就谁都不围绕。" },
      { t: "接，但要求资源全给我", eff: { GAME: 3, TEAM: 2, coach: -3 },
        res: "你要求打野住中路、辅助前期跟中。教练同意了，上单在群里发了个句号。" }
    ]
  },
  {
    id: "pos_mid_broken", cat: "drama", w: 9, once: true, year: 2,
    req: { pos: ["MID"], stage: ["LPL"] },
    text: "你被对面中单打穿了三局。第三局结束，你的对位经济差是 -4800。",
    sub: "热搜第一：#中单该不该退役#",
    opts: [
      { t: "闭关，把对面中单的录像看十遍", eff: { GAME: 4, LANE: 3, MENTAL: -4, energy: -18 }, res: "你把他的对线习惯抄在本子上，抄了六页。第二周再遇到他，你没崩。" },
      { t: "关评论，先活下来", eff: { MENTAL: 3, FAME: -2, TEAM: 1 }, res: "你卸载了所有社交软件。队友替你说了句话，你看到的时候已经三天后了。" },
      { t: "在采访里说：我会证明", eff: { FAME: 3, MENTAL: 2, TEAM: -1 }, res: "这句话被做成表情包，配文：证明什么？证明能送？" }
    ]
  },
  {
    id: "pos_mid_nogank", cat: "team", w: 11, once: false, year: 2,
    req: { pos: ["MID"], stage: ["LPL"] },
    text: "对面打野来了中路五次。你的打野一次都没来。",
    sub: "你在语音里问了一句：能来一趟吗。",
    opts: [
      { t: "自己扛，不问了", eff: { GAME: 3, LANE: 2, MENTAL: -2, TEAM: -1 }, res: "你缩在塔下，硬扛了十五分钟。这局你数据很差，但你没崩。" },
      { t: "跟他吵：你到底在干嘛", eff: { TEAM: -4, MENTAL: 2, GAME: 1 }, res: "他说：我在下路做了两个眼。你说：那你把眼插我塔下。" },
      { t: "去他野区帮他刷，换支援", eff: { TEAM: 3, GAME: 2, energy: -8 }, res: "你帮他清了半片野区，他不好意思了，下一波就来中路反蹲。这波反蹲拿到人头。" }
    ]
  },
  {
    id: "pos_mid_poster", cat: "media", w: 10, once: true, year: 3,
    req: { pos: ["MID"], stage: ["LPL"] },
    text: "全明星的宣传海报出来了。你站在中间，旁边是那个拿了三次世界冠军的中单。",
    sub: "论坛标题：新老中单交接，还是又一次公开处刑？",
    opts: [
      { t: "赛场上打爆他", eff: { MECH: 4, GAME: 3, MENTAL: -2 },
        res: "你从第一分钟就压着他打。",
        risk: { stat: "MECH", dc: 16, ok: "你单杀他两次，全场 MVP。那张海报第二天被球迷做成了新版，你站在最前面。", fail: "你被打得很惨。海报被 P 成你跪着，转了两万次。", bonus: { FAME: 8, MECH: 2 } } },
      { t: "赛前找他合影", eff: { FAME: 3, MENTAL: 3, TEAM: 1 }, res: "他很客气地跟你拍了张照，说了句：打得不错。你把照片设成头像，被喷了一周。" },
      { t: "拒绝参加活动，专心训练", eff: { GAME: 3, MECH: 2, FAME: -3, coach: 2 }, res: "你没去。联盟罚了俱乐部一笔钱，教练什么都没说，只让你多练两小时。" }
    ]
  },
  {
    id: "pos_mid_ban", cat: "match", w: 11, once: false, year: 2,
    req: { pos: ["MID"], stage: ["LPL"] },
    text: "对面 ban 了你三个中单，第四个是你的绝活，他们一手抢了。",
    sub: "你手里只剩一个熟练度 40 的英雄。",
    opts: [
      { t: "拿它，硬着头皮玩", eff: { POOL: 2, MECH: 2, MENTAL: -2 },
        res: "你选了那个没怎么练过的。",
        risk: { stat: "POOL", dc: 14, ok: "你把那个生英雄玩出了花。赛后有人说：这人的英雄池比数据显示的深。", fail: "你连招都放不利索，中路被压了四十刀。", bonus: { POOL: 3, FAME: 3 } } },
      { t: "换位置，让上单来中", eff: { TEAM: 3, GAME: 2, LANE: -2 }, res: "上单来了中路，你去了上路。你们两个都打得很别扭，但赢了。" },
      { t: "让打野住中路，硬保", eff: { TEAM: 2, GAME: 3, LANE: -1 }, res: "打野从二级就蹲在中路。你活下来了，他六级晚了四分钟。" }
    ]
  },
  {
    id: "pos_mid_streamer", cat: "media", w: 10, once: false, year: 2,
    req: { pos: ["MID"], stage: ["LPL"] },
    text: "弹幕在刷：这中单就是个混子，赢的局全是队友 C。",
    sub: "你刚拿了 MVP。",
    opts: [
      { t: "截图发出来，一句话不说", eff: { FAME: 4, MENTAL: 2, TEAM: 1 }, res: "你只发了一张 MVP 的图。评论区炸了，两派人吵了一整晚。" },
      { t: "直播逐帧解释那局", eff: { GAME: 3, FAME: 3, energy: -12 }, res: "你直播讲了两小时。有人听完路转粉，也有人说你在洗。" },
      { t: "关掉弹幕，继续练", eff: { MECH: 3, GAME: 2, MENTAL: 3 }, res: "你什么都没回。下一场你打了 8-0-6，评论区自己换了话题。" }
    ]
  },
  {
    id: "pos_mid_jgpair", cat: "training", w: 11, once: false, year: 2,
    req: { pos: ["MID"], stage: ["LPL"] },
    text: "教练让你和打野练中野联动，一天二十把，只练一个组合。",
    sub: "第三把你们就吵起来了。",
    opts: [
      { t: "忍，把二十把打完", eff: { TEAM: 4, GAME: 3, MENTAL: -2, energy: -12 }, res: "二十把打完，你们的配合终于顺了。第三周的比赛，你们的中野联动成了全联盟第一。" },
      { t: "吵完再练，把话说开", eff: { TEAM: 3, GAME: 2, MENTAL: 2, coach: 1 }, res: "你们在训练室吵了半小时，然后一起吃了顿饭。第二天配合突然就通了。" },
      { t: "不练了，我自己排", eff: { MECH: 3, TEAM: -3, GAME: -1 }, res: "你一个人去排位。打野在群里发了句：行，那你自己玩。" }
    ]
  },
  {
    id: "pos_mid_negative", cat: "drama", w: 9, once: false, year: 2,
    req: { pos: ["MID"], stage: ["LPL"] },
    text: "你的中路被越了三次，塔掉了两座。赛后数据：参团率 21%，伤害占比 12%。",
    sub: "你知道这局你什么都没做。",
    opts: [
      { t: "认，加练到凌晨", eff: { MECH: 3, GAME: 2, MENTAL: -3, energy: -15 }, res: "你练到凌晨四点。第二天训练赛，你被同一个套路又越了一次。" },
      { t: "怪打野不帮", eff: { TEAM: -4, MENTAL: 1, GAME: -2 }, res: "你在复盘会上把锅推出去。教练把录像倒回去，一帧一帧地问你：这一波你在哪？" },
      { t: "申请去打替补，先冷静", eff: { MENTAL: 2, MECH: -2, FAME: -2, coach: 1 }, res: "你在替补席坐了两周。回来的时候，你的手感找回来了一半。" }
    ]
  },
  {
    id: "pos_mid_1v1top", cat: "training", w: 10, once: false, year: 3,
    req: { pos: ["MID"], stage: ["LPL"], minStat: { MECH: 65 } },
    text: "队内 1v1 大赛，决赛是你对上路那个只会单带的疯子。全队围着看。",
    sub: "赌注是一周的早餐。",
    opts: [
      { t: "认真打，赢下来", eff: { MECH: 3, LANE: 2, TEAM: 2 },
        res: "你三比一拿下。",
        risk: { stat: "MECH", dc: 13, ok: "你把上路按在地上打，全队笑疯了。他认输的时候说：中单的手真快。", fail: "你被单杀三次。早餐买了两周，队伍气氛倒是挺好。", bonus: { MECH: 2, TEAM: 3 } } },
      { t: "故意输，给他面子", eff: { TEAM: 3, MECH: -1, MENTAL: 1 }, res: "你演得很假，全队都看出来了。他笑着说：你他妈的。然后请你吃了饭。" },
      { t: "打一半开始整活", eff: { FAME: 2, TEAM: 3, MECH: -1 }, res: "你换了个奇葩出装，全队笑到打不动。这段录像后来成了队内年度最佳。" }
    ]
  },

  /* ---------- MID 局内 ---------- */
  {
    id: "ip_mid_1", cat: "match", w: 12, once: false, year: 0,
    inMatch: true,
    req: { pos: ["MID"] },
    text: "你中路兵线推完了，下路有机会，上路也有机会。你的 TP 还剩 60 秒。",
    sub: "这波你去哪？",
    opts: [
      { t: "去下路，四包二", eff: { GAME: 3, TEAM: 3, LANE: -2 },
        res: "你走到下路草丛，配合打野越塔。",
        risk: { stat: "GAME", dc: 14, ok: "四包二打成一换二，下路彻底打开。AD 拿到两个人头。", fail: "对面辅助插了真眼，你们被反蹲。三个人全死，你丢了两波线。", bonus: { TEAM: 4 } } },
      { t: "去上路，帮单带的上单", eff: { TEAM: 2, LANE: 2, GAME: 1 }, res: "你上去帮上单反蹲。他拿到人头，你在语音里听到他第一次说谢谢。" },
      { t: "回城，吃自己的线", eff: { LANE: 4, GAME: 2, TEAM: -2 }, res: "你回城补装备，稳稳吃线。你的补刀领先对面中单四十，但下路被抓崩了。" }
    ]
  },
  {
    id: "ip_mid_2", cat: "match", w: 12, once: false, year: 0,
    inMatch: true,
    req: { pos: ["MID"] },
    text: "你和对面中单在河道单挑，他交了闪现，血剩三成。你有闪现，有大招。",
    sub: "追不追？",
    opts: [
      { t: "追，闪上去收", eff: { MECH: 4, LANE: 2, PHYS: -2 },
        res: "你闪上去，一套连招。",
        risk: { stat: "MECH", dc: 15, ok: "你单杀他，还顺手拿了河道蟹。这波之后中路是你的了。", fail: "他把你引进野区，打野在那里。你送了，中路从此逆风。", bonus: { FAME: 4, LANE: 3 } } },
      { t: "不追，拿线权", eff: { GAME: 3, LANE: 3, TEAM: 1 }, res: "你推线进塔，把他逼回城。你多打了一波经济，还控住了河道视野。" },
      { t: "回头打龙，把优势换资源", eff: { TEAM: 3, GAME: 2, MECH: -1 }, res: "你叫打野来打小龙。对面中单残血不敢来，你们白拿一条龙。" }
    ]
  },
  {
    id: "ip_mid_3", cat: "match", w: 12, once: false, year: 0,
    inMatch: true,
    req: { pos: ["MID"] },
    text: "四个人从四个方向压到中路二塔。你在塔下，队友在赶来的路上，还有 8 秒。",
    sub: "这波你怎么打？",
    opts: [
      { t: "守塔，等队友", eff: { GAME: 3, TEAM: 2, PHYS: -3 },
        res: "你站在塔后，把兵线清掉。",
        risk: { stat: "GAME", dc: 14, ok: "你拖住了 8 秒，队友赶到，反手打成一换三。这波守住二塔。", fail: "你被越塔打死，二塔也掉了。这波之后你们的中路彻底失守。", bonus: { TEAM: 3 } } },
      { t: "放弃二塔，退到高地", eff: { GAME: 3, MENTAL: 2, LANE: -2 }, res: "你退了。二塔掉了，但人保住了。教练在耳麦里说：这波退得对。" },
      { t: "从侧面绕出去，反打", eff: { MECH: 3, GAME: 2, MENTAL: -2 },
        res: "你从红区绕后。",
        risk: { stat: "MECH", dc: 16, ok: "你绕后一套，把对面 AD 秒了。这波你们反打零换三，直接翻盘。", fail: "你被辅助的真眼照到，从草里被揪出来打死。", bonus: { FAME: 5, TEAM: 2 } } }
    ]
  },
  {
    id: "ip_mid_4", cat: "match", w: 12, once: false, year: 0,
    inMatch: true,
    req: { pos: ["MID"] },
    text: "上路打起来了，二打二。你手里有 TP，兵线刚好推完，中路还能再吃一波。",
    sub: "传不传？",
    opts: [
      { t: "传上去，三打二", eff: { TEAM: 3, LANE: 2, PHYS: -2 },
        res: "你落地的时候上单已经快死了。",
        risk: { stat: "GAME", dc: 13, ok: "你落地换掉一个，救下上单。这波之后上路归你们。", fail: "你落地太晚，上单已经死了。你被二打一，也送了。", bonus: { TEAM: 3 } } },
      { t: "不传，推中路塔", eff: { LANE: 3, GAME: 2, TEAM: -2 }, res: "你带掉中路一层塔皮。上路那位死了，语音里安静了半分钟。" },
      { t: "传，但落点在对面野区", eff: { GAME: 3, MECH: 2, LANE: -1 }, res: "你落在对面野区，切断了他们的退路。这波你们零换二。" }
    ]
  },
  {
    id: "ip_mid_5", cat: "match", w: 12, once: false, year: 0,
    inMatch: true,
    req: { pos: ["MID"] },
    text: "大龙坑团，双方五五开。你的大招还在冷却，还有 4 秒。队友已经在喊：打！",
    sub: "这波你上不上？",
    opts: [
      { t: "等大招，喊队友先稳", eff: { TEAM: 3, GAME: 2, MECH: -1 }, res: "你喊了三遍等一下。大招好的时候团刚开，你进场一波收割。" },
      { t: "不等，硬上", eff: { MECH: 3, TEAM: 1, MENTAL: -2 },
        res: "你冲进去，用技能平A打伤害。",
        risk: { stat: "MECH", dc: 14, ok: "你在大招没好之前用平A把对面 AD 点死。这波团你们赢了。", fail: "你进场没技能，被秒了。队友骂了一句：为什么不等大。", bonus: { TEAM: 2 } } },
      { t: "绕后，等收割", eff: { MECH: 3, GAME: 2, TEAM: -1 }, res: "你绕到侧翼，等第一波技能交完再进。这波你收了三个残血。" }
    ]
  },
  /* ================= BOT：四保一也是四骂一 ================= */
  {
    id: "pos_bot_protect", cat: "team", w: 15, once: false, year: 2,
    req: { pos: ["BOT"], stage: ["LPL"] },
    text: "教练说：这版本打四保一。全队四个人都在保你。",
    sub: "赛后输了，评论区第一条：四保一也保不出个东西。",
    opts: [
      { t: "认，是我没打好", eff: { MENTAL: 2, TEAM: 3, MECH: 2 }, res: "你在采访里说：四保一保的是我，输也是我。这句话后来被人反复引用。" },
      { t: "在队内说：四保一本身就过时了", eff: { GAME: 3, TEAM: -3, coach: -2 }, res: "你把数据表拍在桌上。教练看了很久，说：那你明天开始自己找输出位置。" },
      { t: "加练三件套节奏，把四保一打出来", eff: { LANE: 3, MECH: 3, energy: -12 }, res: "你练了三十把出装顺序。下一场你的三件套比对面早了两分钟，团战伤害全队第一。" }
    ]
  },
  {
    id: "pos_bot_cs", cat: "training", w: 14, once: false, year: 2,
    req: { pos: ["BOT"], stage: ["LPL"] },
    text: "训练赛你 20 分钟 180 刀。对面 AD 205 刀。数据组圈出了你漏的那七个炮车。",
    sub: "教练说：你这七个炮车，等于半件装备。",
    opts: [
      { t: "练补刀，练到手抽筋", eff: { LANE: 4, MECH: 2, energy: -12 }, res: "你在训练模式补了六个小时。第二天你的补刀误差不超过三个，辅助都看愣了。" },
      { t: "我参团率高，补刀少正常", eff: { TEAM: 2, MECH: 2, LANE: -2 }, res: "你把参团率贴给教练看。他说：你参团率高，是因为你一直在打不该打的团。" },
      { t: "让辅助帮我垫刀", eff: { TEAM: 2, LANE: 2, coach: -1 }, res: "辅助帮你垫了一周刀。你的补刀涨了，他的眼位少了。后来他在语音里阴阳了你一句。" }
    ]
  },
  {
    id: "pos_bot_focus", cat: "match", w: 14, once: false, year: 2,
    req: { pos: ["BOT"], stage: ["LPL"] },
    text: "对面中野从五分钟开始往下路走。你塔下的兵线已经三波了，辅助在河道做视野。",
    sub: "你知道他们要来，你也知道你跑不掉。",
    opts: [
      { t: "缩塔下，硬吃这波", eff: { GAME: 3, LANE: -1, PHYS: -2 }, res: "你在塔下被越了两次，死了。但对面浪费了中野两个大招，你们上中拿了资源。" },
      { t: "提前回城，放弃兵线", eff: { GAME: 3, MENTAL: 2, LANE: -2 }, res: "你回城，三波兵全丢。你活着，下路塔保住了。补刀落后三十。" },
      { t: "叫辅助回来，反打", eff: { TEAM: 3, MECH: 2, MENTAL: -1 },
        res: "辅助赶回来，你们二打三。",
        risk: { stat: "TEAM", dc: 14, ok: "辅助一个闪现开，你们反打成一换二。对面中野这波亏到姥姥家。", fail: "辅助先死，你被越塔。这波之后下路彻底崩了。", bonus: { TEAM: 3 } } }
    ]
  },
  {
    id: "pos_bot_suppgap", cat: "team", w: 13, once: false, year: 2,
    req: { pos: ["BOT"], stage: ["LPL"] },
    text: "你的辅助这局第三次开团开到四个人身上，你被四个人一起秒了。",
    sub: "他打完说：我开得好，你怎么不跟。",
    opts: [
      { t: "跟他吵：开团前看一下我的位置", eff: { TEAM: -4, MENTAL: 2, GAME: 1 }, res: "你们在训练室吵了四十分钟。第二天他开团前会先喊一声：我开了啊。" },
      { t: "忍，改自己的站位", eff: { GAME: 3, MECH: 2, TEAM: 2 }, res: "你开始站在他身后两个身位。他的开团终于变成了好开团，你的输出也终于打满。" },
      { t: "找教练换辅助", eff: { TEAM: -3, coach: 2, MENTAL: 2, FAME: -1 }, res: "教练把替补辅助提上来。新辅助保人能力强，但开团能力差了三个档次。" }
    ]
  },
  {
    id: "pos_bot_kite", cat: "training", w: 12, once: false, year: 2,
    req: { pos: ["BOT"], stage: ["LPL"] },
    text: "团战复盘，教练把速度调到 0.25 倍：这里你多走了半步，多打了两下平A。",
    sub: "他说：AD 的全部技术就在这半步里。",
    opts: [
      { t: "练走位，练到形成肌肉记忆", eff: { MECH: 4, LANE: 2, energy: -14 }, res: "你练了一个月的走A。第二个月，你的团战输出从全队第二变成了第一。" },
      { t: "我手速够快，不用练这个", eff: { MECH: 3, LANE: -2, GAME: -1 }, res: "你继续用你的方式打。你打出了几波神仙操作，也送了几波。" },
      { t: "问教练要具体的练习方法", eff: { MECH: 3, GAME: 3, coach: 2, energy: -10 }, res: "他给了你一套训练计划。你照着练了两个月，他第一次在复盘里说：这个位置你打得像个人了。" }
    ]
  },
  {
    id: "pos_bot_3item", cat: "match", w: 12, once: false, year: 2,
    req: { pos: ["BOT"], stage: ["LPL"] },
    text: "25 分钟，你还差 800 块三件套。队友在大龙坑附近打起来了。",
    sub: "这波团你参不参？",
    opts: [
      { t: "参，没三件套也上", eff: { TEAM: 2, MECH: 2, GAME: -1 }, res: "你打了一波输出，伤害不够。团输了，但你的输出是全场最高。" },
      { t: "刷完这波兵，凑三件套", eff: { LANE: 3, GAME: 2, TEAM: -3 }, res: "你刷完兵，出了三件套。你赶到的时候团已经打完了，队友死了三个。" },
      { t: "边刷边往龙坑靠", eff: { GAME: 3, LANE: 2, energy: -5 },
        res: "你一边补刀一边靠近，出装刚好赶在团战爆发前。",
        risk: { stat: "GAME", dc: 13, ok: "你带着三件套进场，一波团打了 7000 伤害。这把翻盘了。", fail: "你刷到一半被对面抓了，三件套的钱变成了对面的经济。", bonus: { MECH: 3 } } }
    ]
  },
  {
    id: "pos_bot_negative", cat: "drama", w: 9, once: false, year: 2,
    req: { pos: ["BOT"], stage: ["LPL"] },
    text: "这局你输出 3200，全场最低。对面 AD 输出了 21000。",
    sub: "赛后集锦把你被单杀的镜头做成了合集，配乐是《凉凉》。",
    opts: [
      { t: "认，练到凌晨", eff: { MECH: 3, LANE: 3, MENTAL: -3, energy: -15 }, res: "你练到天亮。第二天训练赛，你又被打成了 3200。" },
      { t: "关评论，卸载微博", eff: { MENTAL: 4, FAME: -2 }, res: "你把所有社交软件都删了。一个月后你重新装回来，那个合集已经有八十万播放。" },
      { t: "在采访里硬刚：输出不是全部", eff: { FAME: 3, TEAM: -2, MENTAL: 1 }, res: "这句话被剪成十五秒，标题：输 3200 还嘴硬。评论区刷了三天。" }
    ]
  },
  {
    id: "pos_bot_swap", cat: "training", w: 11, once: false, year: 2,
    req: { pos: ["BOT"], stage: ["LPL"] },
    text: "版本改成换线版本。你和辅助要跟上单换线，去打上路。",
    sub: "你练了两把，被对面单带位打成了 0-4。",
    opts: [
      { t: "练，把上路的对线也吃下来", eff: { LANE: 4, POOL: 2, energy: -12 }, res: "你练了二十把换线。现在你能在上路稳住，还能反打。教练说：这套东西值一个 ban 位。" },
      { t: "不换，我们在下路打", eff: { TEAM: -3, LANE: 2, coach: -2 }, res: "你们没换线。对面换了，你们的下路二塔十二分钟就没了。" },
      { t: "练但只练三把，别浪费时间", eff: { LANE: 2, GAME: 2, TEAM: 1 }, res: "你只练了三把，换线打得一般，但至少不会崩。这已经够用了。" }
    ]
  },
  {
    id: "pos_bot_nofight", cat: "team", w: 11, once: false, year: 2,
    req: { pos: ["BOT"], stage: ["LPL"] },
    text: "中期你在下路补刀，队友在上半区开了三波团。你一次都没到。",
    sub: "上单在语音里说：AD 呢？",
    opts: [
      { t: "推掉二塔，换资源", eff: { LANE: 3, GAME: 2, TEAM: -2 }, res: "你带掉二塔，队友输了团。赛后复盘，教练说：这波你换得对，但他们不知道。" },
      { t: "放弃兵线，赶过去", eff: { TEAM: 3, GAME: 2, LANE: -2 }, res: "你赶到了，打了一波输出。团没赢，但至少你在了。" },
      { t: "在语音里说：别在这打", eff: { GAME: 3, TEAM: 2, MENTAL: -1 }, res: "你开始指挥。三波团被拖到你能到的时候，两胜一负。" }
    ]
  },
  {
    id: "pos_bot_rank", cat: "training", w: 10, once: true, year: 3,
    req: { pos: ["BOT"], stage: ["LPL"] },
    text: "排位遇到那个拿了两个世界冠军的 AD。他补位打野，你打 AD。",
    sub: "弹幕在刷：这波是给前辈上课，还是被上课。",
    opts: [
      { t: "正面打，打出气势", eff: { MECH: 4, LANE: 3, MENTAL: -2 },
        res: "你压了他三十刀。",
        risk: { stat: "MECH", dc: 15, ok: "你在这把里单杀了他两次。第二天他直播提到你：这个 AD 有点东西。", fail: "你被打成 2-8。弹幕刷了一晚上，你把录像看了十遍。", bonus: { FAME: 6 } } },
      { t: "稳，把他当普通对手", eff: { GAME: 3, MENTAL: 2, LANE: 1 }, res: "你稳稳打完了这把，赢了。他发了个 gg，你截了图，没发出去。" },
      { t: "问他怎么练的对线", eff: { GAME: 3, FAME: 2, MENTAL: -1 }, res: "他真的回了你，讲了三分钟。你听完，发现自己练的方向全错了。" }
    ]
  },
  {
    id: "pos_bot_streamer", cat: "media", w: 10, once: false, year: 2,
    req: { pos: ["BOT"], stage: ["LPL"] },
    text: "论坛高赞：这队的 AD 只要不送，队伍就能赢。",
    sub: "点赞八千。",
    opts: [
      { t: "下一场打 12-1-8，让他们闭嘴", eff: { MECH: 4, LANE: 2, energy: -12 }, res: "你打出了赛季最好的一场。那个帖子被顶起来，底下全是：对不起。" },
      { t: "截图存着，当燃料", eff: { MENTAL: 3, MECH: 2, GAME: 1 }, res: "你把截图设成了手机壁纸。每次训练到想放弃的时候，你就解锁看一眼。" },
      { t: "回帖：不送就能赢，那你上", eff: { FAME: 3, MENTAL: -1, TEAM: -1 }, res: "你回完就后悔了。帖子被顶到热搜，你的 ID 挂了两天。" }
    ]
  },
  {
    id: "pos_bot_mental", cat: "life", w: 10, once: false, year: 2,
    req: { pos: ["BOT"], stage: ["LPL"] },
    text: "凌晨两点，你在基地楼下坐着。今天你被换下去了一局，替补 AD 打出了 MVP。",
    sub: "手机里是妈妈发来的消息：最近怎么样。",
    opts: [
      { t: "回：挺好的", eff: { MENTAL: 2, TEAM: 1, PHYS: -2 }, res: "你打了三个字，删掉，又打了一遍。你妈回：那就好，早点睡。" },
      { t: "说实话：我可能要被淘汰了", eff: { MENTAL: 4, TEAM: 2, FAME: -1 }, res: "你妈打了电话过来，说了四十分钟。最后一句是：不行就回来。你挂了电话，眼睛有点热。" },
      { t: "不回，回训练室加练", eff: { MECH: 3, GAME: 2, MENTAL: -3, energy: -12 }, res: "你练到五点。第二天训练赛你打得很好，教练多看了你两眼。" }
    ]
  },
  {
    id: "pos_bot_negative2", cat: "drama", w: 9, once: true, year: 2,
    req: { pos: ["BOT"], stage: ["LPL"], maxStat: { MENTAL: 60 } },
    text: "你在比赛里连续三次走位失误，被单杀三次。赛后你在通道里坐着，腿有点软。",
    sub: "队医过来问你还好吗。你说没事。",
    opts: [
      { t: "跟队医说实话", eff: { MENTAL: 4, PHYS: 2, TEAM: 2, FAME: -2 }, res: "你被安排去做了心理评估。俱乐部给你减了两次训练。你在休息室里睡了一整天。" },
      { t: "硬扛，第二天照常训练", eff: { MECH: 2, MENTAL: -4, PHYS: -3 }, res: "你第二天照常出现在训练室。你的手在抖，但没人看出来。" },
      { t: "跟教练请假三天", eff: { MENTAL: 3, MECH: -2, coach: -2 }, res: "你请了三天假，回了一趟家。回来的时候，你的位置已经有人在练了。" }
    ]
  },
  {
    id: "pos_bot_late", cat: "match", w: 11, once: false, year: 3,
    req: { pos: ["BOT"], stage: ["LPL"], minStat: { MECH: 65 } },
    text: "四十分钟，双方经济持平。你是全场唯一一个能打的输出点。",
    sub: "所有人都知道这一点，对面也知道。",
    opts: [
      { t: "站出来，主动找输出位置", eff: { MECH: 4, GAME: 3, MENTAL: -2 },
        res: "你绕到侧翼，等一个技能空档。",
        risk: { stat: "MECH", dc: 15, ok: "你在大龙团打出 9000 伤害，一波结束比赛。这是你职业生涯最好的一波团。", fail: "你被对面辅助勾中，秒了。这把输得很难看，弹幕刷：AD 又送了。", bonus: { FAME: 6, MECH: 2 } } },
      { t: "稳住，等对面失误", eff: { GAME: 4, TEAM: 2, MECH: -1 }, res: "你等到了对面的失误。这波你们赢了，但没人记得你打了多少输出。" },
      { t: "让上单去卖，你在后面输出", eff: { TEAM: 3, GAME: 3, MECH: 1 }, res: "上单冲进去卖，你在后面输出。这波你们零换三，拿下大龙。" }
    ]
  },

  /* ---------- BOT 局内 ---------- */
  {
    id: "ip_bot_1", cat: "match", w: 12, once: false, year: 0,
    inMatch: true,
    req: { pos: ["BOT"] },
    text: "对面下路双人组残血，兵线推到塔前。你们辅助还有闪现，你的大招好了。",
    sub: "这波越不越？",
    opts: [
      { t: "越，辅助先手", eff: { MECH: 3, TEAM: 2, PHYS: -2 },
        res: "辅助闪现进去开，你跟上去。",
        risk: { stat: "MECH", dc: 14, ok: "你们越塔双杀，下路彻底打开。对面辅助当场就崩了。", fail: "辅助先被塔打死，你被反手打死。这波之后下路变成逆风。", bonus: { TEAM: 3, LANE: 2 } } },
      { t: "控线，等打野来", eff: { GAME: 3, LANE: 2, TEAM: 1 }, res: "你把线冻住，对面双人组不敢回城。打野来了，一波带走。" },
      { t: "推线回家，先出装备", eff: { LANE: 3, GAME: 2, TEAM: -1 }, res: "你回城出了核心装，回线后压得更狠。这波你没拿到人头，但装备领先了。" }
    ]
  },
  {
    id: "ip_bot_2", cat: "match", w: 12, once: false, year: 0,
    inMatch: true,
    req: { pos: ["BOT"] },
    text: "中路团，对面刺客从侧翼绕后，你被切了。辅助在前面，没人管你。",
    sub: "这波你怎么活？",
    opts: [
      { t: "闪现拉开，边撤边打", eff: { MECH: 3, GAME: 2, PHYS: -2 },
        res: "你交闪往塔下撤，边走边输出。",
        risk: { stat: "MECH", dc: 14, ok: "你把刺客点死，回头继续打团。这波输出打了 6000。", fail: "你没闪开，被秒了。团战打成一换四，你们输了。", bonus: { TEAM: 2 } } },
      { t: "站桩硬输出，赌他伤害不够", eff: { MECH: 4, LANE: 1, PHYS: -3 }, res: "你不走，站在原地把技能全打出去。这波你死了，但对面也死了两个。" },
      { t: "往辅助身上贴，让他挡", eff: { TEAM: 3, GAME: 2, MECH: -1 }, res: "你贴着辅助打，他替你挡了致命一套。你在后面打满了输出。" }
    ]
  },
  {
    id: "ip_bot_3", cat: "match", w: 12, once: false, year: 0,
    inMatch: true,
    req: { pos: ["BOT"] },
    text: "对面中野同时消失往下走了，你的兵线正好卡在对面塔前。这波线吃不吃？",
    sub: "吃了可能死，不吃就落后两波。",
    opts: [
      { t: "吃，赌他们来得慢", eff: { LANE: 3, GAME: 1, MENTAL: -2 },
        res: "你顶着压力吃线。",
        risk: { stat: "GAME", dc: 14, ok: "你吃完整波线，卡着时间撤了。补刀反超对面 AD 十五个。", fail: "你被四个人包在塔下。人头、兵线、塔，全丢了。", bonus: { LANE: 3 } } },
      { t: "不吃，退二塔", eff: { GAME: 3, MENTAL: 2, LANE: -2 }, res: "你退了，两波线全丢。但你活着，还保住了塔。" },
      { t: "叫辅助来保，硬吃", eff: { TEAM: 2, LANE: 2, MENTAL: -1 }, res: "辅助来保你，你们二打四。这波你们换掉一个，兵线也吃了。" }
    ]
  },
  {
    id: "ip_bot_4", cat: "match", w: 12, once: false, year: 0,
    inMatch: true,
    req: { pos: ["BOT"] },
    text: "团战打到一半，对面坦克贴到你脸上。你的技能全交了，只剩平A。",
    sub: "这波你怎么打？",
    opts: [
      { t: "走A，边退边打", eff: { MECH: 3, GAME: 2, energy: -6 },
        res: "你把输出拉满，一步一步往后退。",
        risk: { stat: "MECH", dc: 15, ok: "你走A把坦克点死，转头把后排也收了。这一波你像开了脚本。", fail: "你走位失误，被坦克贴死。团战结束，你输出 800。", bonus: { MECH: 3, FAME: 3 } } },
      { t: "往队友身后躲，先活下来", eff: { GAME: 3, TEAM: 1, MECH: -1 }, res: "你退到队友身后，重新找位置。这波团你们赢了，你输出第二。" },
      { t: "换掉对面 AD 再死", eff: { MECH: 4, TEAM: 2, PHYS: -3 }, res: "你冲上去把对面 AD 换掉，然后自己死了。这波团打成四换四。" }
    ]
  },
  {
    id: "ip_bot_5", cat: "match", w: 12, once: false, year: 0,
    inMatch: true,
    req: { pos: ["BOT"] },
    text: "四十分钟，大龙团。你是队里唯一的后期核心，全队的命都在你手上。",
    sub: "这波你敢不敢站最前面输出？",
    opts: [
      { t: "站前面，把伤害打满", eff: { MECH: 4, TEAM: 2, PHYS: -3 },
        res: "你站在最前面，一秒输出三下。",
        risk: { stat: "MECH", dc: 16, ok: "你打出全场最高伤害，一波团结束比赛。全场站起来喊你的 ID。", fail: "你被对面开团开到，秒了。这把输了，你上了热搜。", bonus: { FAME: 6, TEAM: 3 } } },
      { t: "站后面，等对面技能交完", eff: { GAME: 4, TEAM: 2, MECH: -1 }, res: "你等第一波技能交完才进。这波你收了两个残血，团战赢了。" },
      { t: "先点塔，逼对面回防", eff: { GAME: 3, LANE: 2, TEAM: -1 }, res: "你去点塔，对面被迫回防。你们拿下大龙，但正面团没打起来。" }
    ]
  },
  /* ================= SUP：数据最差，功劳最少，锅最大 ================= */
  {
    id: "pos_sup_vision", cat: "training", w: 15, once: false, year: 2,
    req: { pos: ["SUP"], stage: ["LPL"] },
    text: "你一场插了 82 个眼，排了 21 个。赛后数据面板上，你是 0-0-3。",
    sub: "解说念数据的时候，念到你只说了三个字：辅助位。",
    opts: [
      { t: "认，这就是辅助", eff: { GAME: 4, TEAM: 2, MENTAL: 1 }, res: "你继续插眼。下一场你的视野得分全场第一，队伍赢了，MVP 是 AD。" },
      { t: "开始抢人头，让人看见我", eff: { FAME: 3, TEAM: -3, GAME: -1 }, res: "你抢了两个人头。数据好看了一点，队友看你的眼神变了一点。" },
      { t: "把视野数据做成表发给教练", eff: { GAME: 3, coach: 3, TEAM: 1 }, res: "教练把表贴在了墙上。从那以后，复盘会第一次开始讲辅助的落眼位置。" }
    ]
  },
  {
    id: "pos_sup_engage", cat: "match", w: 14, once: false, year: 2,
    req: { pos: ["SUP"], stage: ["LPL"] },
    text: "你开了。你的控制链完美，四个人被你框在里面。",
    sub: "你的队友在收线。",
    opts: [
      { t: "喊：跟！跟！跟！", eff: { TEAM: -2, MENTAL: 2, GAME: 1 }, res: "你喊到破音。他们终于来了，但技能全空。这波团打成三换二。" },
      { t: "自己把伤害打满再死", eff: { MECH: 3, TEAM: 2, PHYS: -3 },
        res: "你一个人在里面打输出。",
        risk: { stat: "MECH", dc: 14, ok: "你一个辅助打出了全队第二的伤害。队友赶到的时候，对面已经残了。", fail: "你死了，队友没来。这波之后你被换下去了。", bonus: { FAME: 3, TEAM: 2 } } },
      { t: "撤，等下一波", eff: { GAME: 3, MENTAL: -2, TEAM: -1 }, res: "你退了，大招白交。教练在耳麦里说：这个开团很好，下次等人齐。" }
    ]
  },
  {
    id: "pos_sup_block", cat: "match", w: 13, once: false, year: 2,
    req: { pos: ["SUP"], stage: ["LPL"] },
    text: "对面中单的技能飞过来，你的 AD 和你的中单站在一起。你只能挡一个。",
    sub: "你往哪边动？",
    opts: [
      { t: "挡给 AD", eff: { TEAM: 2, GAME: 2, PHYS: -3 }, res: "你替 AD 吃了那一套，被打到残血。AD 反手把对面中单点死了。他说：谢了。" },
      { t: "挡给中单", eff: { TEAM: 2, GAME: 2, MENTAL: -1 }, res: "你替中单挡了。中单活下来了，AD 被打残回城。AD 在语音里没说话。" },
      { t: "谁都不挡，自己闪开", eff: { MECH: 2, GAME: 2, TEAM: -4 }, res: "你闪开了。中单和 AD 都掉了半血。赛后复盘，教练只问了一句：你在想什么？" }
    ]
  },
  {
    id: "pos_sup_blame", cat: "team", w: 13, once: false, year: 2,
    req: { pos: ["SUP"], stage: ["LPL"] },
    text: "输了。评论区：辅助什么都不会，挂机吧。",
    sub: "这局你开了四次团，三次开到关键人。",
    opts: [
      { t: "不看不回，继续练", eff: { MENTAL: 3, GAME: 3, energy: -8 }, res: "你把所有平台都关了。第二天你照样第一个到训练室。" },
      { t: "发一条微博：数据可以看回放", eff: { FAME: 4, MENTAL: -2, TEAM: -1 }, res: "你发完就后悔了。评论区更疯了，但有几个职业辅助转发了你。" },
      { t: "跟队友说：下次开团前喊一声", eff: { TEAM: 4, GAME: 2, MENTAL: 1 }, res: "你开始要求队友在你开团前给个信号。队伍的团战胜率涨了 12%。" }
    ]
  },
  {
    id: "pos_sup_roam", cat: "match", w: 12, once: false, year: 2,
    req: { pos: ["SUP"], stage: ["LPL"] },
    text: "你跟打野去上路做了一波三包一。回来的时候，你的 AD 被对面越塔了两次。",
    sub: "AD 在语音里说：你去哪了。",
    opts: [
      { t: "道歉，后面死保下路", eff: { TEAM: 4, GAME: 1, LANE: -1 }, res: "你后面二十分钟没离开下路。AD 起来了，队伍赢了。你的游走数据是零。" },
      { t: "解释：那波拿了上路一血塔", eff: { TEAM: 2, GAME: 3, MENTAL: 1 }, res: "你把经济账算给他听。他沉默了一会儿，说：那下次提前说一声。" },
      { t: "吵回去：你自己不会跑吗", eff: { TEAM: -5, MENTAL: 2, GAME: 1 }, res: "你们在语音里吵了一分钟。教练把你们两个都换了下来。" }
    ]
  },
  {
    id: "pos_sup_ward", cat: "training", w: 12, once: false, year: 2,
    req: { pos: ["SUP"], stage: ["LPL"] },
    text: "你去排眼，被对面三个人蹲在草丛里。你死之前把那个眼排掉了。",
    sub: "教练说：这个眼值得吗？",
    opts: [
      { t: "值得，视野比人头重要", eff: { GAME: 4, TEAM: 1, MENTAL: -1 }, res: "你继续这么打。这个赛季你的视野得分全联盟第二，死亡数全联盟第一。" },
      { t: "不值，下次不排了", eff: { GAME: 2, PHYS: 2, MENTAL: 2 }, res: "你开始放弃危险的眼位。你的死亡数掉了，队伍的视野压制也掉了。" },
      { t: "练排眼时机，找那个空档", eff: { GAME: 3, MECH: 2, energy: -10 }, res: "你研究了对面插眼的规律。现在你能在他们走之后的三秒内排掉，一次没被抓。" }
    ]
  },
  {
    id: "pos_sup_captain", cat: "team", w: 11, once: true, year: 3,
    req: { pos: ["SUP"], stage: ["LPL"] },
    text: "队里选队长。教练说：辅助来当吧，你最了解全局。",
    sub: "你在这个队待了三年，没人记得你的 ID 怎么念。",
    opts: [
      { t: "接，把队伍扛起来", eff: { TEAM: 4, GAME: 3, MENTAL: -2, energy: -10 }, res: "你开始每天开会、定计划、调解矛盾。队伍的气氛好了，你的状态掉了。" },
      { t: "不接，我只想打比赛", eff: { MECH: 3, GAME: 2, TEAM: -2 }, res: "你拒绝了。队长给了中单。三个月后，队里所有矛盾都变成了你的问题。" },
      { t: "接，但要求话语权", eff: { TEAM: 3, coach: 2, GAME: 2, FAME: 1 }, res: "你提出要参与 BP 和人员决定。教练同意了。你第一次觉得自己不只是个辅助。" }
    ]
  },
  {
    id: "pos_sup_sacrifice", cat: "match", w: 12, once: false, year: 2,
    req: { pos: ["SUP"], stage: ["LPL"] },
    text: "大龙团，你身上有唯一的真眼和唯一的救赎。你知道这波你得死。",
    sub: "教练在耳麦里说：你上。",
    opts: [
      { t: "上，用命换团战", eff: { TEAM: 4, GAME: 3, PHYS: -4 }, res: "你冲进去卖，队友拿到三杀。赛后采访，AD 说这波团赢在辅助。" },
      { t: "先保自己，活着才有输出", eff: { GAME: 2, MECH: 2, TEAM: -2 }, res: "你活下来了，团战没开起来。这波你们打成二换二。" },
      { t: "把救赎交出去，然后撤", eff: { TEAM: 2, GAME: 2, PHYS: -2 }, res: "你交完救赎就撤。队友靠那个盾活下来两个，这波打成三换二。" }
    ]
  },
  {
    id: "pos_sup_nobody", cat: "life", w: 10, once: false, year: 2,
    req: { pos: ["SUP"], stage: ["LPL"] },
    text: "粉丝见面会。队伍排了四张桌子，你前面没人排队。",
    sub: "旁边 AD 的队伍排到了走廊。",
    opts: [
      { t: "自己走过去，跟那几个人聊", eff: { FAME: 2, MENTAL: 3, TEAM: 1 }, res: "有五个人排队。你给他们签了名，聊了十分钟。他们说：你是队里最好说话的那个。" },
      { t: "坐着，玩手机", eff: { MENTAL: -2, FAME: -1, PHYS: 2 }, res: "你刷了一小时手机。结束后 AD 说：要不要一起吃饭。你说不用。" },
      { t: "去帮 AD 那边维持秩序", eff: { TEAM: 3, FAME: 3, MENTAL: 2 }, res: "你站在 AD 旁边帮他递笔。有人拍了下来发到网上，标题：这才是队伍的样子。" }
    ]
  },
  {
    id: "pos_sup_adcblame", cat: "team", w: 11, once: false, year: 2,
    req: { pos: ["SUP"], stage: ["LPL"] },
    text: "AD 在复盘会上说：这局输在下路，辅助不会保人。",
    sub: "全场安静。教练看着你。",
    opts: [
      { t: "当场把录像放出来", eff: { TEAM: -2, GAME: 3, MENTAL: 2 }, res: "你把录像拖到那一波，画面里他往塔里走。教练说：行了，都别说了。" },
      { t: "认，是我保得不好", eff: { TEAM: 2, MENTAL: -3, GAME: 2 }, res: "你说了对不起。会后 AD 过来跟你说了句：刚才我话说重了。" },
      { t: "会后单独找他聊", eff: { TEAM: 4, GAME: 2, MENTAL: 1 }, res: "你们在楼下聊了半小时。他说他最近压力大。你说我也是。第二天你们配合顺了很多。" }
    ]
  },
  {
    id: "pos_sup_meta", cat: "training", w: 10, once: false, year: 2,
    req: { pos: ["SUP"], stage: ["LPL"] },
    text: "版本改成硬辅版本。你练了三年的软辅，一夜之间全废。",
    sub: "训练赛你拿硬辅开了六次，五次开空。",
    opts: [
      { t: "硬练，练到会开", eff: { MECH: 3, POOL: 3, energy: -14 }, res: "你练了两百把硬辅。第三周你的开团成功率到了 60%，队友开始信你了。" },
      { t: "坚持软辅，版本会回来", eff: { GAME: 2, MECH: 1, POOL: -2, coach: -2 }, res: "你用软辅赢了一场。下一场对面直接针对你的软辅，你被打成了提款机。" },
      { t: "找教练改打法，不打硬辅开团", eff: { GAME: 3, TEAM: 2, coach: 1 }, res: "你们改成了中野开团，你只做保人和视野。这套东西意外地好用。" }
    ]
  },
  {
    id: "pos_sup_negative", cat: "drama", w: 9, once: true, year: 2,
    req: { pos: ["SUP"], stage: ["LPL"] },
    text: "这局你死了 11 次。每一次都是为了保人。",
    sub: "数据面板上，你的死亡数旁边有个红色的小箭头。",
    opts: [
      { t: "认，继续这么打", eff: { TEAM: 2, GAME: 2, MENTAL: -3 }, res: "你继续用命换人。教练说：你这样打，队伍能赢，但你打不了几年。" },
      { t: "改打法，先保自己", eff: { MENTAL: 3, GAME: 1, TEAM: -2 }, res: "你开始不死了。数据好看了，队友死了。AD 说：你现在怎么不保人了。" },
      { t: "去跟教练说：我需要换人", eff: { TEAM: 3, coach: 3, MENTAL: 2, FAME: -2 }, res: "你提出换一个能保你的 AD。教练没同意，但他第一次认真听了你的意见。" }
    ]
  },
  {
    id: "pos_sup_rank", cat: "training", w: 10, once: false, year: 2,
    req: { pos: ["SUP"], stage: ["LPL"] },
    text: "排位，你排到一个主播 AD。他全程指挥你，最后怪你不出救赎。",
    sub: "你看了下他的补刀：20 分钟 90。",
    opts: [
      { t: "开麦教他怎么补刀", eff: { FAME: 3, MENTAL: 2, TEAM: 1 }, res: "你开麦讲了三分钟补刀。直播间笑疯了，这段被剪成了短视频，播放两百万。" },
      { t: "闭麦打完，不理他", eff: { MENTAL: 3, GAME: 1, FAME: -1 }, res: "你打完就退了。他在直播间说你：这个辅助心态真好。你听着像在夸，又像在骂。" },
      { t: "故意不给他治疗", eff: { MENTAL: -2, FAME: 2, MECH: -1 }, res: "他死了三次，全程在骂。你在直播间出名了，但名声不太好。" }
    ]
  },
  {
    id: "pos_sup_shotcall", cat: "training", w: 11, once: false, year: 3,
    req: { pos: ["SUP"], stage: ["LPL"], minStat: { GAME: 62 } },
    text: "教练把指挥权交给你。全队的节奏都要你来喊。",
    sub: "第一场你喊错了一次，队伍丢了大龙。",
    opts: [
      { t: "继续喊，喊到对为止", eff: { GAME: 4, TEAM: 3, MENTAL: -2, energy: -12 }, res: "你喊了一个月。第三周开始，队伍的决策速度快了 3 秒。这 3 秒值一个赛季。" },
      { t: "把指挥权还回去", eff: { GAME: -2, MENTAL: 3, TEAM: -2 }, res: "你把指挥权还给了打野。队伍又回到了没人做决定的状态。" },
      { t: "只喊关键决策，其他交给打野", eff: { GAME: 3, TEAM: 3, coach: 2 }, res: "你和打野分工：他管前期，你管大龙和团战。这套分工成了你们的核心竞争力。" }
    ]
  },

  /* ---------- SUP 局内 ---------- */
  {
    id: "ip_sup_1", cat: "match", w: 12, once: false, year: 0,
    inMatch: true,
    req: { pos: ["SUP"] },
    text: "你手里有闪现，有开团技能。对面五个人挤在龙坑里，你的队友在后面 300 码。",
    sub: "这波你开不开？",
    opts: [
      { t: "开，闪现进去", eff: { TEAM: 3, MECH: 3, PHYS: -3 },
        res: "你闪进去，一个大招框住四个人。",
        risk: { stat: "MECH", dc: 15, ok: "完美开团，队友跟着冲，这波零换五。全场镜头都在你身上。", fail: "你开到了，队友没跟上。你死了，龙也丢了。", bonus: { TEAM: 4, FAME: 4 } } },
      { t: "等队友到位再开", eff: { GAME: 3, TEAM: 2, MECH: -1 }, res: "你等了 1.5 秒，队友到了。这波团你们打赢了，没人提你的开团。" },
      { t: "不开，做视野等他们出来", eff: { GAME: 3, TEAM: 1, MENTAL: -1 }, res: "你在龙坑外插满眼。对面出来的时候被你们抓了个正着。" }
    ]
  },
  {
    id: "ip_sup_2", cat: "match", w: 12, once: false, year: 0,
    inMatch: true,
    req: { pos: ["SUP"] },
    text: "大龙还有 30 秒，河道全是黑雾。你需要去做视野，但对面打野刚在附近露过头。",
    sub: "这波眼你插不插？",
    opts: [
      { t: "插，带着打野一起去", eff: { GAME: 3, TEAM: 2, PHYS: -2 },
        res: "你和打野一起摸进河道。",
        risk: { stat: "GAME", dc: 14, ok: "你们插满视野，还排掉了对面的真眼。大龙稳稳拿下。", fail: "你们被蹲了。打野死了，大龙也丢了。", bonus: { TEAM: 3 } } },
      { t: "不插，让 AD 站好位置", eff: { GAME: 2, TEAM: 2, MENTAL: 1 }, res: "你们收缩阵型，等对面先动。这波你们没抢到视野，但也没被抓。" },
      { t: "一个人去插，赌他不在", eff: { GAME: 2, MECH: 2, MENTAL: -2 }, res: "你一个人摸进去，插了两个眼，活着回来了。全队都不知道你刚才赌了多大。" }
    ]
  },
  {
    id: "ip_sup_3", cat: "match", w: 12, once: false, year: 0,
    inMatch: true,
    req: { pos: ["SUP"] },
    text: "对面刺客闪现进来切你的 AD。你有治疗，有护盾，还有一个可以挡技能的位移。",
    sub: "这波你怎么救？",
    opts: [
      { t: "位移上去挡技能", eff: { TEAM: 3, GAME: 2, PHYS: -3 },
        res: "你把自己扔到 AD 前面。",
        risk: { stat: "MECH", dc: 14, ok: "你挡下致命一套，AD 反手把刺客点死。这波团你们零换三。", fail: "你挡空了，AD 还是死了。这波团你们被打成一换四。", bonus: { TEAM: 4 } } },
      { t: "交治疗，让 AD 自己闪", eff: { GAME: 3, TEAM: 2, MECH: 1 }, res: "你交了治疗，AD 闪开。刺客扑空，被你们反手秒掉。" },
      { t: "先跑，保自己不死", eff: { MENTAL: 2, GAME: 1, TEAM: -4 }, res: "你跑了。AD 死了。语音里安静了五秒，然后 AD 说：辅助呢？" }
    ]
  },
  {
    id: "ip_sup_4", cat: "match", w: 12, once: false, year: 0,
    inMatch: true,
    req: { pos: ["SUP"] },
    text: "你跟着打野去中路做视野。下路 AD 一个人，对面双人组还在。",
    sub: "这波你走不走？",
    opts: [
      { t: "走，中路这波必须插眼", eff: { GAME: 3, TEAM: 2, LANE: -1 },
        res: "你和打野插满了中路视野，还抓到对面中单。",
        risk: { stat: "GAME", dc: 13, ok: "你们抓到对面中单，一波带走。下路 AD 缩在塔下没死。", fail: "下路 AD 被越了。这波之后他在语音里一句话都没说。", bonus: { GAME: 3 } } },
      { t: "不走，先保 AD", eff: { TEAM: 2, GAME: 1, LANE: 1 }, res: "你留在下路。中路视野没做，但 AD 发育起来了。" },
      { t: "让打野自己去，你走一半", eff: { GAME: 2, TEAM: 2, MENTAL: 1 }, res: "你走到河道就折返。两边都顾到了一点，也都没顾好。" }
    ]
  },
  {
    id: "ip_sup_5", cat: "match", w: 12, once: false, year: 0,
    inMatch: true,
    req: { pos: ["SUP"] },
    text: "团战打到一半，你的大招好了。对面五个人站成一排，但你的 AD 只剩三成血。",
    sub: "你开团还是保人？",
    opts: [
      { t: "开团，赌一波结束", eff: { TEAM: 3, MECH: 2, PHYS: -3 },
        res: "你开进去，框住四个人。",
        risk: { stat: "MECH", dc: 15, ok: "这波团你们零换五，直接推平。你的名字出现在 MVP 候选里。", fail: "你开进去，AD 被切死。这波团输了，你成了第一责任人。", bonus: { TEAM: 4, FAME: 3 } } },
      { t: "保 AD，把盾和治疗全给他", eff: { TEAM: 3, GAME: 3, MECH: -1 }, res: "你把 AD 保下来了。他在后面打了 6000 伤害，这波团赢了。" },
      { t: "先控住切 AD 的人", eff: { GAME: 3, TEAM: 2, MECH: 1 }, res: "你把那个切 AD 的刺客控住，AD 反手把他点死。这波你们零换三。" }
    ]
  },
  /* ================= 故事线 1：黑幕假赛线 ================= */
  {
    id: "pos_story_fix_offer", cat: "fate", w: 12, once: true, year: 2, months: [1, 2, 4, 5, 7, 8],
    req: { stage: ["LPL"] },
    next: { flag: "fix_offer_next", id: "pos_story_fix_after" },
    text: "深夜，一个陌生号码打进来。对面说得很客气：下一场第三局，你送掉一血和第一条龙，八十万，赛后到账。",
    sub: "他说：不用你现在答应，你先想想。挂之前补了一句：你以为只有我们在做这个？",
    opts: [
      { t: "收，八十万够买套房", eff: { corrupt: 4, money: 80, MENTAL: -3 },
        res: "你把那张卡收进了抽屉最里面。那天晚上你睡得很沉，第二天醒得很早。" },
      { t: "装傻：你打错了吧", eff: { corrupt: 1, MENTAL: 1, FAME: -1 },
        res: "你挂了电话，把号码拉黑。第二天那个号码换了个号又打来一次。" },
      { t: "录音，举报", eff: { justice: 5, MENTAL: -2, FAME: 2, coach: 1 },
        res: "你把电话录了下来，发给了联盟的举报邮箱。三个小时后，一个陌生号发来一条消息：你确定？" }
    ]
  },
  {
    id: "pos_story_fix_after", cat: "fate", w: 12, once: true, year: 2,
    req: { stage: ["LPL"] },
    next: { flag: "fix_after_next", id: "pos_story_fix_end" },
    text: "联盟的调查组进了基地。他们单独找你谈了四十分钟，问的问题很具体：那场比赛的第三局，你的召唤师技能为什么那样交。",
    sub: "你队友在门外等着，看你的眼神已经不一样了。",
    opts: [
      { t: "全说了，把号码交出去", eff: { justice: 4, corrupt: -2, TEAM: -2, MENTAL: -3 },
        res: "你说完的那一刻，觉得肩膀轻了一点。走出会议室，走廊里没人跟你说话。" },
      { t: "死撑，说不知道", eff: { corrupt: 3, justice: -1, MENTAL: -4, TEAM: -2 },
        res: "你演了四十分钟。他们记了满满两页纸，最后说：我们会再找你。" },
      { t: "反咬一口，说有人陷害我", eff: { corrupt: 2, justice: 1, FAME: 2, MENTAL: -3 },
        res: "你把水搅浑了。调查拖了两个月，舆论分裂成两派，你成了这场风暴的中心。" }
    ]
  },
  {
    id: "pos_story_fix_end", cat: "fate", w: 12, once: true, year: 3,
    req: { stage: ["LPL"] },
    text: "处罚公告挂在了官网上。你盯着那行字看了很久，字很小，但每一个字都很重。",
    sub: "手机在震。经纪人说：先别说话，什么都别说。",
    opts: [
      { t: "认罚，从头再来", eff: { justice: 3, corrupt: -3, FAME: -6, MENTAL: 3, TEAM: -2 }, res: "你签了字。禁赛期你每天去基地后面的球场跑步。回来的时候，你比走的时候更瘦，也更硬。" },
      { t: "找律师，打官司", eff: { corrupt: 1, money: -120, FAME: 2, MENTAL: -4 }, res: "律师说证据不足，能拖。官司打了两年，你赢了一半，输掉的另一半是你最好的两年。" },
      { t: "退役声明，自己发", eff: { MENTAL: 4, FAME: -4, TEAM: -3, corrupt: 1 }, res: "你发了六行字，没有一个字辩解。评论区第一条：可惜了。你看到的时候笑了一下。" }
    ]
  },

  /* ================= 故事线 2：网暴退圈线 ================= */
  {
    id: "pos_story_hate_storm", cat: "fate", w: 12, once: true, year: 2, months: [1, 2, 4, 5, 7, 8],
    req: { stage: ["LPL"] },
    next: { flag: "hate_storm_next", id: "pos_story_hate_after" },
    text: "一局关键的败仗之后，热搜前五条有四条是你。第一条后面挂着「爆」字。",
    sub: "私信里有人说要去基地门口等你。你的电话号码被贴在了评论区。",
    opts: [
      { t: "硬扛，一条不回", eff: { MENTAL: -3, FAME: 3, GAME: 1 },
        res: "你一条都没回。三天后热搜下去了，你还在。只有你自己知道这三天是怎么过的。" },
      { t: "关评论，谢绝一切采访", eff: { MENTAL: 3, FAME: -2, TEAM: -1 },
        res: "你把头像换成了纯黑，评论区关了。俱乐部发了声明，没提你的名字。" },
      { t: "开直播，正面反击", eff: { FAME: 6, MENTAL: -4, TEAM: -2, haters: 3000 },
        res: "你在直播间骂了四十分钟。有人路转粉，也有人把你说的话剪成了新的刀。" }
    ]
  },
  {
    id: "pos_story_hate_after", cat: "fate", w: 12, once: true, year: 2,
    req: { stage: ["LPL"] },
    next: { flag: "hate_after_next", id: "pos_story_hate_end" },
    text: "心理老师说：你现在的状态，不适合上场。教练问你要不要休息两周。",
    sub: "可是下周是季后赛。",
    opts: [
      { t: "休息，先救自己", eff: { MENTAL: 5, PHYS: 3, coach: -1, FAME: -2 },
        res: "你停了两周。回来的时候，替补打进了四强，你成了那个「不需要的人」。" },
      { t: "上场，能打就打", eff: { MENTAL: -4, MECH: 2, TEAM: 2 },
        res: "你上了。第一把打得还行，第二把在台上手抖得握不住鼠标。" },
      { t: "找律师，起诉造谣的人", eff: { justice: 4, money: -25, MENTAL: 2, FAME: 1 },
        res: "你告了三个账号。开庭那天你去了，对方是个二十岁的学生，坐在那里一直在哭。" }
    ]
  },
  {
    id: "pos_story_hate_end", cat: "fate", w: 12, once: true, year: 3,
    req: { stage: ["LPL"] },
    text: "又过了一个赛季。当年骂你最狠的那条帖子，被人翻出来，底下开始有人说：那时候我们是不是太过了。",
    sub: "你已经不太看这些东西了。",
    opts: [
      { t: "回去打，把这事翻篇", eff: { MENTAL: 4, GAME: 3, FAME: 2, energy: -12 }, res: "你回到赛场。第一场，观众席有人举了个牌子：欢迎回来。你在台上没敢抬头看。" },
      { t: "不打了，去做别的事", eff: { MENTAL: 5, FAME: -4, money: -30, TEAM: -2 }, res: "你退了。开了一家小店，日子过得很慢。有人认出你，问你为什么不打了，你说：打不动了。" },
      { t: "留在队里当教练", eff: { GAME: 4, TEAM: 3, MENTAL: 2, FAME: -1 }, res: "你换了个身份坐在台下。你比谁都清楚那些小孩在想什么，因为你都走过。" }
    ]
  },

  /* ================= 故事线 3：兄弟战队线 ================= */
  {
    id: "pos_story_bro_down", cat: "fate", w: 12, once: true, year: 2, months: [1, 2, 6, 7, 11, 12],
    req: { stage: ["LPL"] },
    next: { flag: "bro_down_next", id: "pos_story_bro_after" },
    text: "你当年一起打 LDL 的老队友被下放到二队了。他给你发消息，只有三个字：我完了。",
    sub: "你们一起吃过三个月的泡面，也一起被人 3-0 过。",
    opts: [
      { t: "在群里替他说话", eff: { justice: 4, TEAM: 3, coach: -3, MENTAL: 2 },
        res: "你在队群里发了三百字。教练没回，但第二天他被叫回来跟了一队训练。" },
      { t: "装没看见", eff: { corrupt: 2, MENTAL: -3, TEAM: -1 },
        res: "你没回。三天后他发了一条朋友圈，定位是老家。你点了个赞，又取消了。" },
      { t: "跟管理层提，把他挖过来", eff: { justice: 3, TEAM: 4, coach: 2, money: -10 },
        res: "你去找经理谈了两次。他合同不便宜，你答应从自己的奖金里出一部分。" }
    ]
  },
  {
    id: "pos_story_bro_after", cat: "fate", w: 12, once: true, year: 2,
    req: { stage: ["LPL"] },
    next: { flag: "bro_after_next", id: "pos_story_bro_end" },
    text: "他真的来了。第一天训练赛，他打得很差，被教练当着全队骂了十分钟。",
    sub: "散会之后他在走廊里站着，看见你，笑了一下：我是不是不该来。",
    opts: [
      { t: "陪他练，练到能上场", eff: { TEAM: 4, justice: 2, energy: -15, GAME: 2 },
        res: "你们每天加练两小时。一个月后他打上了首发，教练说：你们这套配合有点东西。" },
      { t: "让他自己扛，别连累我", eff: { corrupt: 3, TEAM: -4, MENTAL: -2 },
        res: "你开始躲着他。他也看出来了，一个月后主动申请下放。走的时候没跟你说。" },
      { t: "去跟教练说：给他时间", eff: { justice: 3, TEAM: 3, coach: -2 },
        res: "你跟教练争了一次。教练说：行，再给他两周。两周后，他在关键局拿了 MVP。" }
    ]
  },
  {
    id: "pos_story_bro_end", cat: "fate", w: 12, once: true, year: 3,
    req: { stage: ["LPL"] },
    text: "季后赛最后一场，你和他在同一个队，也在一起打。",
    sub: "赢下来，或者一起被别人送走。",
    opts: [
      { t: "把关键局交给他", eff: { justice: 3, TEAM: 5, GAME: 2, MENTAL: 2 }, res: "你把最后一把的指挥交给他。他打赢了。赛后他抱着你说：当年那碗泡面没白吃。" },
      { t: "自己来，信不过他", eff: { corrupt: 2, MECH: 3, TEAM: -3, MENTAL: -2 }, res: "你自己接管了所有决策。你们赢了，但他坐在那里一句话都没说。" },
      { t: "输了，一起扛", eff: { MENTAL: 3, TEAM: 4, justice: 2, FAME: -2 }, res: "你们输了。他在采访里说：是我的问题。你说：不是。两个人在镜头前都没哭。" }
    ]
  },

  /* ================= 故事线 4：教练背叛线 ================= */
  {
    id: "pos_story_coach_betray", cat: "fate", w: 12, once: true, year: 2, months: [1, 2, 6, 7, 11, 12],
    req: { stage: ["LPL"] },
    next: { flag: "coach_betray_next", id: "pos_story_coach_after" },
    text: "你从经理那里听到一件事：教练在跟别的队谈，条件里写着「带一个中单过去」。那个中单不是你。",
    sub: "他这周还在跟你讲战术。",
    opts: [
      { t: "当面硬刚：你是不是要走", eff: { MENTAL: 2, coach: -5, TEAM: 2, justice: 2 },
        res: "他愣了三秒，说：谁跟你说的。你说：你别管谁跟我说的。那天之后他再没单独找过你。" },
      { t: "忍，装作不知道", eff: { corrupt: 2, MENTAL: -3, coach: 1 },
        res: "你什么都没说。接下来的训练你打得很保守，因为你不确定这套战术是给谁准备的。" },
      { t: "直接找老板", eff: { justice: 3, coach: -4, TEAM: 1, FAME: 1 },
        res: "老板听完只说了一句：我知道。然后让你先回去。第二天教练的战术本换了。" }
    ]
  },
  {
    id: "pos_story_coach_after", cat: "fate", w: 12, once: true, year: 2,
    req: { stage: ["LPL"] },
    next: { flag: "coach_after_next", id: "pos_story_coach_end" },
    text: "他被换掉了。新教练上任第一天，把所有人的位置重新排了一遍。",
    sub: "你的名字被排在了替补。",
    opts: [
      { t: "去问新教练：为什么", eff: { GAME: 3, MENTAL: 2, coach: -2 },
        res: "他说：我不是针对你，我只是不想用他留下的人。你听懂了，也记住了。" },
      { t: "找老教练，跟他走", eff: { corrupt: 3, coach: 3, TEAM: -4, money: 40 },
        res: "他给你开了个价，也给了你一个承诺。你签了那份合同，然后收拾了行李箱。" },
      { t: "什么都不做，用表现说话", eff: { justice: 2, MECH: 4, GAME: 3, energy: -12 },
        res: "你把训练量翻了一倍。两周后新教练把你换回来了，只说了两个字：不错。" }
    ]
  },
  {
    id: "pos_story_coach_end", cat: "fate", w: 12, once: true, year: 3,
    req: { stage: ["LPL"] },
    text: "一年后，那个教练带队打进了世界赛。抽签那天，你们分在了同一组。",
    sub: "赛前握手，他笑着说了句：好久不见。",
    opts: [
      { t: "打爆他的队", eff: { MECH: 4, GAME: 3, MENTAL: 2, justice: 2 },
        res: "你赢了他。赛后他走过来，说了一句：当年是我看走眼。你说：不是你看走眼，是你没看完。",
        risk: { stat: "MECH", dc: 15, ok: "你在这场比赛里打出了生涯代表作。全场的 MVP 掌声给了你。", fail: "你输了。他在采访里说了一句很客气的话，你听了比骂你还难受。", bonus: { FAME: 6 } } },
      { t: "握手，什么也不说", eff: { MENTAL: 4, FAME: 1, TEAM: 1 }, res: "你握了手，什么都没说。这一场你打得很平静，赢也好输也好，都过去了。" },
      { t: "在采访里把当年的事说出来", eff: { corrupt: 2, FAME: 4, coach: -3, TEAM: -2 }, res: "你把当年的事讲了出来。第二天舆论炸了，他发了一条长文，你一个字都没看。" }
    ]
  }
];
