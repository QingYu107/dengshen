/* 选手梗事件包 —— 真实 ID，正负都来，不预设立场。
   结构同 events.js：{id,cat,w,once,year,months,req,text,sub,opts:[{t,eff,res,risk}]} */
(function () {
  const E = [

    /* ---------- LDL 时期：还没人认识你，但已经有人在排位里认识你 ---------- */
    {
      id: "mem_ldl_zhukai", cat: "life", w: 12, once: true, year: 1,
      who: "LPL 老教练（传闻）", srcType: "parody", quote: "有点东西，就是不会打团", source: "贴吧 / 粉丝群传闻，二创", ctx: "LDL 时期被老教练在粉丝群点评，圈内最常见的“被看见”方式",
      req: { stage: ["LDL"] },
      text: "网上传疯了：LPL 某位老教练在粉丝群里说，LDL 里有个 ID 有点东西，就是不会打团。",
      sub: "评论区第一条：这说的不就是我们队那个吗？",
      opts: [
        { t: "把那句话截图设成屏保", eff: { MENTAL: 6, GAME: 2 }, res: "每次打开手机先看一眼。表扬是真的，批评也是真的，你决定都收下。" },
        { t: "找到那段录像逐帧复盘", eff: { GAME: 5, energy: -15 }, res: "你把团战切了 40 遍，发现自己每次都在等队友先动。原来不会打团是这个意思。" },
        { t: "在直播间回一句：那您来带带我", eff: { FAME: 5, coach: -4, MENTAL: -2 }, res: "直播间 2000 人，截图传到超话。老教练没回你，但青训经理回了你一句“别整活”。" }
      ]
    },

    /* ---------- 排位撞车：最真实的实力检测 ---------- */
    {
      id: "mem_rank_faker", cat: "training", w: 14, once: true, year: 2,
      who: "Faker（李相赫）", srcType: "parody", quote: "gg", source: "韩服排位二创场景", ctx: "凌晨两点韩服排到 Faker，他补位到你位置上",
      req: { stage: ["LPL"] },
      text: "凌晨两点，韩服。你排到了 Faker，他补位到你的位置。",
      sub: "弹幕已经疯了：他知道你是谁吗？",
      opts: [
        { t: "开局就 all in，让他记住你", eff: { MECH: 4, MENTAL: -3 }, risk: { stat: "MECH", dc: 15, ok: "你单杀了他一次，回放被剪成 15 秒视频，标题：LPL 中单单杀 Faker。", fail: "你被反杀两次，屏幕上出现他的招牌英雄时，你手已经开始抖了。", bonus: { FAME: 6 } }, res: "" },
        { t: "正常打，把他当普通对手", eff: { GAME: 4, MENTAL: 2 }, res: "你没赢，但也没崩。他打完发了一句 gg，你在加载界面反复看了三遍。" },
        { t: "截图发群里：兄弟看这是谁", eff: { TEAM: 5, FAME: 2, MECH: -1 }, res: "队友回：别发了，人家刚把你打穿。" }
      ]
    },
    {
      id: "mem_rank_chovy", cat: "training", w: 12, once: true, year: 2,
      who: "Chovy（郑志勋）", srcType: "parody", quote: "这就是顶级中单的基本功", source: "解说词二创", ctx: "15 分钟补刀差 60，回放里看到自己漏了三波炮车",
      req: { stage: ["LPL"] },
      text: "遇到 Chovy。15 分钟，他补刀比你多 60。解说在你的比赛里提了一嘴：这就是顶级中单的基本功。",
      sub: "你回放录像，看到自己漏了三波炮车。",
      opts: [
        { t: "开始补刀特训，一个一个补", eff: { LANE: 5, energy: -12 }, res: "你在训练模式补了四个小时。手酸，但下一场你的补刀是全场第一。" },
        { t: "安慰自己：赢游戏不靠补刀", eff: { MENTAL: 4, LANE: -2 }, res: "你赢了那把游戏，然后被教练单独留下来看了半小时补刀数据。" },
        { t: "去问他本人怎么练的", eff: { GAME: 3, FAME: 3 }, risk: { stat: "TEAM", dc: 13, ok: "他真的回了你，还发了一份训练计划。你把它打印出来贴在床头。", fail: "消息显示已读。你等到天亮，也没等来第二条。", bonus: { GAME: 4 } }, res: "" }
      ]
    },
    {
      id: "mem_369_dice", cat: "match", w: 12, once: true, year: 2,
      who: "369（白家浩）", srcType: "real", quote: "摇骰子", source: "2022 年 LPL 观众对状态起伏的称呼", ctx: "摇到 9 是世界级，摇到 3 是人机，赛前没人知道今天摇到几",
      req: { stage: ["LPL"] },
      text: "赛前看数据，对面那个位置上坐着 369。你队友凑过来：他今天状态是几？",
      sub: "这个问题没有人能回答。他自己也不知道。",
      opts: [
        { t: "不管他，打自己的", eff: { MECH: 2, GAME: 3 }, res: "你打得很好。他今天状态是 3，但你还是赢了。有些事得自己扛。" },
        { t: "开局先抓他，趁他还没摇", eff: { TEAM: 3, energy: -8 }, risk: { stat: "GAME", dc: 13, ok: "他今天状态是 9。你被抓了个正着，但他越打越送。", fail: "他今天状态是 9，而且他记仇。你被他连抓三波，赛后数据面板像张遗照。", bonus: { MENTAL: 4 } }, res: "" },
        { t: "赛前在选手通道看他一眼", eff: { MENTAL: 3 }, res: "他也看了你一眼。你们都没说话。这一眼像两个赌徒在牌桌上互相看手牌。" }
      ]
    },

    /* ---------- 舆论：成名之后，名字就不归你管了 ---------- */
    {
      id: "mem_doinb_cast", cat: "media", w: 12, once: true, year: 2,
      who: "Doinb（金泰相）", srcType: "parody", quote: "这个选手操作有，但是不会打支援", source: "直播点评，二创台词", ctx: "Doinb 直播间点评选手是 LPL 的固定节目",
      req: { stage: ["LPL"] },
      text: "Doinb 在直播间点评你：这个选手操作有，但是不会打支援，中单不能只会对线。",
      sub: "弹幕：说得对 / 早说了 / 他谁啊。",
      opts: [
        { t: "认，去研究支援时机", eff: { GAME: 5, TEAM: 2 }, res: "你把他的直播切片看了三遍，把每一条批评都记了下来。你讨厌承认，但他说得对。" },
        { t: "在采访里回他一句", eff: { FAME: 6, TEAM: -3 }, risk: { stat: "MENTAL", dc: 14, ok: "你说：等我先拿个冠军再讨论支援。当晚热搜第七，评论区打成一片。", fail: "你话说出口就后悔了。第二天解说在直播里阴阳了你半小时，队友看你的眼神变了。", bonus: { FAME: 4 } }, res: "" },
        { t: "私下发消息请教", eff: { GAME: 3, coach: 3 }, res: "他回你：明天下午三点，开个训练房。你以为他开玩笑，第二天他真来了。" }
      ]
    },
    {
      id: "mem_hupu_23", cat: "media", w: 13, year: 2,
      who: "虎扑", srcType: "real", quote: "虎扑评分 2.3", source: "虎扑选手评分版块", ctx: "赛后 2.3 分成了“菜”的量词，热评比比赛好看",
      req: { stage: ["LPL"] },
      text: "比赛打完，虎扑评分 2.3。热评第一是：他没上场，但他上场了。",
      sub: "你妈转发了这条，附了一个问号。",
      opts: [
        { t: "不看评论区，卸载虎扑", eff: { MENTAL: 6, FAME: -3 }, res: "你卸载了三天。第四天你又装回来了。人就是这样。" },
        { t: "把 2.3 截图设成屏保", eff: { MENTAL: 4, MECH: 2, energy: -6 }, res: "每练一个小时看一眼。有人靠鸡汤，你靠这口气。" },
        { t: "开小号回去对线", eff: { MENTAL: -4, FAME: 2 }, risk: { stat: "MENTAL", dc: 12, ok: "你骂赢了一整栋楼，然后被认出来是小号。舆论反转，你成了乐子。", fail: "你被扒出小号。热搜：职业选手亲自下场对线球迷。经理找你谈了一小时。", bonus: { FAME: 3 } }, res: "" }
      ]
    },
    {
      id: "mem_uzi_rumor", cat: "drama", w: 11, once: true, year: 2,
      who: "Uzi（简自豪）/ 营销号", srcType: "parody", quote: "某退役传奇 ADC 正在考虑复出", source: "营销号爆料，二创", ctx: "复出传闻是 LPL 的周期性节目，配图一年能 P 八百张",
      req: { stage: ["LPL"] },
      text: "营销号爆料：某退役传奇 ADC 正在考虑复出。配图是你和他被 P 在一起的合照。",
      sub: "你队友发来链接：兄弟，你要火了。",
      opts: [
        { t: "发微博：期待，能和前辈同台是我的荣幸", eff: { FAME: 8, fans: 15000, TEAM: -1 }, res: "评论区涨了两万粉，一半是来骂你蹭热度的。你把那条微博置顶了。" },
        { t: "当没看见，专心训练", eff: { MECH: 3, GAME: 2, MENTAL: 2 }, res: "热搜挂了两天就下去了。你多练了两天，没人在意，但你在意。" },
        { t: "私信对方求合影", eff: { FAME: 3, fans: 8000 }, risk: { stat: "FAME", dc: 15, ok: "对方团队回了：赛区活动上见。那张真合影后来成了你的头像。", fail: "没有回复。你的私信被营销号截图，标题：某选手私信骚扰前辈。", bonus: { FAME: 4 } }, res: "" }
      ]
    },
    {
      id: "mem_knight_compare", cat: "media", w: 11, year: 3,
      who: "knight（卓定）/ 官方对比视频", srcType: "real", quote: "左手右手一个慢动作", source: "官方中单对比视频弹幕", ctx: "官方做对比视频，弹幕刷“左手右手一个慢动作”",
      req: { stage: ["LPL"] },
      text: "官方做了个中单对比视频，把你和 knight 放在一起。弹幕刷：左手右手一个慢动作。",
      sub: "视频里你被选中的片段，都是被单杀的那几秒。",
      opts: [
        { t: "用一场比赛回应", eff: { MENTAL: 5, GAME: 2 }, risk: { stat: "GAME", dc: 13, ok: "你正面打爆了他一次，那个对比视频被官方悄悄删了。", fail: "你又输了。视频播放量破了百万，评论区在玩梗，没人再提你的名字。", bonus: { FAME: 5 } }, res: "" },
        { t: "在采访里自嘲：左手比我贵", eff: { FAME: 6, MENTAL: 3 }, res: "这句话上了热搜。有人说你清醒，有人说你没志气。你自己知道，你只是不想装。" },
        { t: "关掉手机去训练", eff: { MECH: 3, GAME: 3, energy: -10 }, res: "你把那两天全用在训练上了。没有人知道你看了那个视频多少遍。" }
      ]
    },

    /* ---------- 对局内外的真对手 ---------- */
    {
      id: "mem_theshy_dive", cat: "match", w: 12, once: true, year: 2,
      who: "TheShy（姜承録）", srcType: "real", quote: "他怎么敢的？", source: "2018 年后关于 TheShy 越塔的弹幕名言", ctx: "三级兵线压塔下直接越塔，LPL 上单的集体噩梦",
      req: { stage: ["LPL"] },
      text: "训练赛对上 TheShy。三级，兵线在塔前，他直接越塔。",
      sub: "你的下路双人组在语音里大叫：他怎么敢的？",
      opts: [
        { t: "接，硬碰硬", eff: { MECH: 3, TEAM: 2 }, risk: { stat: "MECH", dc: 14, ok: "你反杀了他。他下次还是照样越塔。你开始理解什么叫不把对手当人。", fail: "你死了。20 分钟后他又越了一次，这次你连闪现都没交出来。", bonus: { LANE: 4 } }, res: "" },
        { t: "退，吃塔刀，等他一波", eff: { LANE: 4, GAME: 3 }, res: "你退了三次。第四次他没来，你反倒吃到了两层镀层。有人管这叫成长。" },
        { t: "录下来发给教练", eff: { GAME: 4, coach: 3 }, res: "教练看完只说了一句：他不是没算过，他是算准了你会退。" }
      ]
    },
    {
      id: "mem_bin_praise", cat: "match", w: 10, once: true, year: 2,
      who: "Bin（陈泽彬）", srcType: "parody", quote: "他线上不输任何人", source: "赛后采访，二创台词", ctx: "Bin 夸对手是 LPL 采访名场面",
      req: { stage: ["LPL"] },
      text: "赛后采访，Bin 被问到对位感受，他说：他线上不输任何人。",
      sub: "记者追问：包括你吗？他笑了笑没说话。",
      opts: [
        { t: "把这句当夸奖收下", eff: { MENTAL: 8, LANE: 2 }, res: "你回更衣室搜了三遍那段采访，还下载到了手机相册。" },
        { t: "隔天训练赛加倍还给他", eff: { LANE: 4, MECH: 3, energy: -12 }, res: "你在他身上试了三套新连招。他一句没说，但第二天你在排位里被他单杀了两次。" },
        { t: "在采访里回：他也一样", eff: { FAME: 5, MENTAL: 3 }, res: "这句话被做成了海报。后来你们俩成了朋友，一起在直播间复读这段话，笑得停不下来。" }
      ]
    },
    {
      id: "mem_ruler_scrim", cat: "training", w: 10, once: true, year: 3,
      who: "Ruler（朴载赫）", srcType: "parody", quote: "第三把开始前，对面教练走进了语音", source: "训练赛传闻，二创", ctx: "训练赛打爆对面两把，下一把他们教练亲自进语音",
      req: { stage: ["LPL"] },
      text: "训练赛，你在一波团里打爆了 Ruler。连续两把。",
      sub: "第三把开始前，对面教练走进了语音。",
      opts: [
        { t: "继续压，让他们记住你", eff: { MECH: 3, MENTAL: 4 }, risk: { stat: "MECH", dc: 14, ok: "第三把你又赢了。对面训练赛直接结束，他们教练说今天就到这。", fail: "第三把你被针对到 0/7。你才明白，前两把是他们没认真。", bonus: { GAME: 3 } }, res: "" },
        { t: "收着打，学对面怎么调整", eff: { GAME: 5, MENTAL: 2 }, res: "你看着他们换了三个 BP 思路，一点一点把你的空间压缩。这比赢两把有价值。" },
        { t: "把录像存起来，年底再看", eff: { MENTAL: 5, GAME: 2 }, res: "你给文件命名：别飘。后来每次状态下滑，你就点开看一遍。" }
      ]
    },
    {
      id: "mem_deft_retire", cat: "life", w: 9, once: true, year: 3,
      who: "Deft（金赫奎）", srcType: "parody", quote: "他把整个青春留在召唤师峡谷", source: "Deft 退役仪式，二创台词", ctx: "退役仪式镜头扫到你，新一代选手坐在台下",
      req: { stage: ["LPL"] },
      text: "Deft 的退役仪式。镜头扫到观众席，刚好扫到你。解说：新一代的选手也坐在下面。",
      sub: "你想起自己刚打职业那年，也是在台下看别人的最后一场。",
      opts: [
        { t: "认真看完，然后把手机收起来", eff: { MENTAL: 10, GAME: 2 }, res: "你在台下坐到了最后。回酒店的路上你一句话没说，第二天训练赛打得很凶。" },
        { t: "发一条长微博致敬", eff: { FAME: 6, fans: 12000, MENTAL: 3 }, res: "你写：他把整个青春留在召唤师峡谷。评论区有人回：你也是。" },
        { t: "提前离场，回去打排位", eff: { MECH: 3, energy: -8, FAME: -2 }, res: "你在空基地打了一晚上排位。有些告别你不想看，因为你知道有一天轮到自己的时候也一样。" }
      ]
    },
    {
      id: "mem_rookie_hand", cat: "match", w: 9, once: true, year: 2,
      who: "Rookie（宋义进）", srcType: "parody", quote: "你打得很好，别急", source: "赛后握手，二创台词", ctx: "赢了才说的安慰，分不清是客套还是真心",
      req: { stage: ["LPL"] },
      text: "比赛结束，Rookie 走过来跟你握手，说：你打得很好，别急。",
      sub: "他是赢了才说的。你分不清这是安慰还是客套。",
      opts: [
        { t: "记住这句话，当成目标", eff: { MENTAL: 7, GAME: 2 }, res: "你在训练室白板上写了“别急”两个字。队友问是谁写的，你没说。" },
        { t: "当场请教他怎么处理劣势局", eff: { GAME: 5, coach: 2 }, res: "他愣了一下，然后真的跟你聊了十分钟。走的时候他说：你会打出来的。" },
        { t: "笑着回：下次不会让你赢", eff: { FAME: 3, MENTAL: 4, TEAM: 1 }, res: "他笑了。你不知道他有没有当真，但你自己当真了。" }
      ]
    }
  ];

  window.DATA_MEME_EVENTS = E;
})();
