/* js/data/talents_v4.js — v3.11 抽卡扩容池：LCK / 欧美真实选手本命卡 + 原创羁绊卡。
   纯展示与判定数据，不含逻辑。结构同 DATA_TALENTS：
   { id, src, name, type, rarity, tag, build, desc, eff }
   tag 是固定羁绊标签（engine 侧 GAME.deckBonds() 按 tag 计数），不是「正面/双刃/负面」。
   build 只能是 attack / control / teamfight / mental / money / jungle / split。
   rarity 用 white / blue / purple / gold / red；eff 为可选数值加成。 */
window.DATA_TALENTS_V4 = [
  /* ================= skT · T1 王朝（5） ================= */
  {
    id: "tal4_zeus",
    src: { type: "real", who: "LCK:Zeus", year: 2024, event: "T1 上单，杰斯、永恩、格温，敢在决赛拿永恩打剑魔", quote: "杰斯一炮，先把你血线打没" },
    name: "杰斯一炮先手",
    type: "talent",
    rarity: "gold",
    tag: "skT",
    build: "attack",
    desc: "他拿杰斯的时候你连补刀都得算着来，一炮打掉半管血，你还得笑着说不疼。上路对线被他压出经验区是常事，团战里那炮又总能落在你们后排头上。",
    eff: { LANE: 3, MECH: 2 }
  },
  {
    id: "tal4_oner",
    src: { type: "real", who: "LCK:Oner", year: 2024, event: "T1 打野，蔚、盲僧、赵信，前十五分钟节奏密得像上班打卡", quote: "先吃我一拳" },
    name: "前十五分钟打卡",
    type: "talent",
    rarity: "gold",
    tag: "skT",
    build: "jungle",
    desc: "别人打野还在刷第二组野，他已经站在你中路塔后了；你问他怎么来得这么快，他也不解释，下一波还在。T1 那几年最吓人的不是操作，是他永远比你早到半步。",
    eff: { GAME: 3, MECH: 2 }
  },
  {
    id: "tal4_gumayusi",
    src: { type: "real", who: "LCK:Gumayusi", year: 2024, event: "T1 下路，金克丝、厄斐琉斯、薇恩，敢在决赛拿薇恩", quote: "我拿薇恩，是因为我真的会" },
    name: "决赛敢拿薇恩",
    type: "talent",
    rarity: "gold",
    tag: "skT",
    build: "attack",
    desc: "别人决赛求稳选个混子 AD，他反手锁薇恩，还打得对面下路不敢上线。你笑他狂，他打完数据摆在那儿，你笑不出来了。",
    eff: { LANE: 2, TEAM: 2 }
  },
  {
    id: "tal4_keria",
    src: { type: "real", who: "LCK:Keria", year: 2024, event: "T1 辅助，派克、烈娜塔、巴德，把辅助玩成第二个打野", quote: "辅助也能开团，也能收割" },
    name: "辅助当第二个打野",
    type: "talent",
    rarity: "gold",
    tag: "skT",
    build: "control",
    desc: "他玩派克的时候你会忘了那是个辅助，游走、做视野、开团、收割，一套流程下来比你们打野还忙。等你想起来该管他的时候，下路已经没了。",
    eff: { GAME: 3, POOL: 2 }
  },
  {
    id: "tal4_bengi",
    src: { type: "real", who: "LCK:Bengi", year: 2016, event: "SKT 三冠打野，盲僧、奈德丽、雷克塞，打法不花但总在该在的地方", quote: "我不秀，我只赢" },
    name: "不秀，只赢",
    type: "talent",
    rarity: "purple",
    tag: "skT",
    build: "jungle",
    desc: "他的盲僧没有回旋踢名场面，但每次你回头，他都在你身后；三座冠军奖杯摆着，你再说他混也没人信。那种不声不响把事办了的打野，最难对付。",
    eff: { GAME: 2, MENTAL: 2 }
  },

  /* ================= faker_line · 中路王朝（5） ================= */
  {
    id: "tal4_faker",
    src: { type: "real", who: "LCK:Faker", year: 2024, event: "五冠中单，阿狸、瑞兹、乐芙兰、加里奥，名字本身就是版本", quote: "又是加里奥" },
    name: "又是加里奥",
    type: "talent",
    rarity: "red",
    tag: "faker_line",
    build: "control",
    desc: "你 ban 掉他的阿狸，他掏瑞兹；你 ban 瑞兹，他掏乐芙兰；你把中路 ban 空了，他还能拿加里奥从天上砸下来。打了十年，版本换了一轮又一轮，他还在那儿。",
    eff: { GAME: 5, MENTAL: 4 }
  },
  {
    id: "tal4_chovy",
    src: { type: "real", who: "LCK:Chovy", year: 2024, event: "中单补刀机器，阿卡丽、塞拉斯、维克托，对线期像在打卡", quote: "你先补到三百刀再说话" },
    name: "三百刀的墙",
    type: "talent",
    rarity: "gold",
    tag: "faker_line",
    build: "control",
    desc: "你跟他打了二十分钟，人头 0:0，一看补刀被他多出六十个，经济差像被人不声不响搬空了家。他不急着杀你，他就那么耗着，耗到你发现自己已经打不动了。",
    eff: { LANE: 4, MECH: 3 }
  },
  {
    id: "tal4_showmaker",
    src: { type: "real", who: "LCK:ShowMaker", year: 2021, event: "2021 世界赛决赛前的采访，重铸 LCK 荣光那句被念了很多年", quote: "重铸 LCK 的荣光，我辈义不容辞" },
    name: "重铸荣光",
    type: "talent",
    rarity: "gold",
    tag: "faker_line",
    build: "control",
    desc: "那句话说完的第二年他就开始还债，版本一变，中单从刷子变成工具人，他咬着牙把卡牌和佐伊练了出来。你笑他嘴硬，他拿冠军那年你还没开始看比赛。",
    eff: { MECH: 2, GAME: 3 }
  },
  {
    id: "tal4_bdd",
    src: { type: "real", who: "LCK:Bdd", year: 2024, event: "老牌中单，阿兹尔、佐伊、维克托，打了这么多年还在顶级联赛站着", quote: "我还在，就说明我还能打" },
    name: "还在打的老中单",
    type: "talent",
    rarity: "purple",
    tag: "faker_line",
    build: "control",
    desc: "同批的人退役的退役、转教练的转教练，他还在中路一站就是一整年，输赢都不太露面。你觉得他没什么存在感，可每次关键局，站出来的偏偏是他。",
    eff: { LANE: 2, MENTAL: 2 }
  },
  {
    id: "tal4_zeka",
    src: { type: "real", who: "LCK:Zeka", year: 2022, event: "2022 世界赛中单，阿卡丽、塞拉斯、永恩，淘汰赛突然爆种", quote: "阿卡丽一进场，后排就没了" },
    name: "淘汰赛限定爆种",
    type: "talent",
    rarity: "purple",
    tag: "faker_line",
    build: "attack",
    desc: "常规赛看他打，你会觉得这人也就那样；一到淘汰赛，他拿阿卡丽进场那一下，你们后排血条像被人拿剪刀剪了。每年都有这种常规赛装死、世界赛复活的怪物。",
    eff: { MECH: 3 }
  },

  /* ================= lck_jungle · 野区统治者（4） ================= */
  {
    id: "tal4_canyon",
    src: { type: "real", who: "LCK:Canyon", year: 2021, event: "DWG 冠军打野，男枪、豹女、千珏，刷野路线像用尺子量过", quote: "我的野区，你进来试试" },
    name: "刷野像用尺子量",
    type: "talent",
    rarity: "gold",
    tag: "lck_jungle",
    build: "jungle",
    desc: "你看回放才发现他每一组野都卡在刷新前两秒到，路线干净得像排过很多遍。你想去反他的野，走了半圈发现他早就在那儿等你，反野反成送人头。",
    eff: { GAME: 4, MECH: 2 }
  },
  {
    id: "tal4_peanut",
    src: { type: "real", who: "LCK:Peanut", year: 2024, event: "打了快十年的打野，盲僧、男枪、千珏，风格从莽夫磨成了老狐狸", quote: "小花生也会老，但不会菜" },
    name: "从莽夫到老狐狸",
    type: "talent",
    rarity: "gold",
    tag: "lck_jungle",
    build: "jungle",
    desc: "刚出道那会儿他见人就上，死也死得轰轰烈烈；现在他学会先算一遍，再决定这波送不送。你以为他老了，结果他抓你的时间比你算的还准。",
    eff: { GAME: 3, TEAM: 2 }
  },
  {
    id: "tal4_cuzz",
    src: { type: "real", who: "LCK:Cuzz", year: 2023, event: "LCK 打野，豹女、男枪、赵信，野核版本一到就开始上班", quote: "野核版本，我说了算" },
    name: "野核版本上班",
    type: "talent",
    rarity: "purple",
    tag: "lck_jungle",
    build: "jungle",
    desc: "版本一旦往野核偏，他整个人就像被按了开关，豹女刷得你线上不敢露头，男枪两枪把你打回塔下。版本不站在他这边的时候，他就安安静静等下一个版本。",
    eff: { MECH: 2, GAME: 2 }
  },
  {
    id: "tal4_ambition",
    src: { type: "real", who: "LCK:Ambition", year: 2017, event: "三星冠军打野，嘉文、扎克、猪妹，专干脏活累活", quote: "脏活我来，你们去秀" },
    name: "脏活累活我来",
    type: "talent",
    rarity: "purple",
    tag: "lck_jungle",
    build: "teamfight",
    desc: "他不抢人头，不刷漂亮数据，团战里第一个往里冲，出完石像鬼还替队友挡技能。赛后数据面板上他永远不显眼，可少了他，那支队就是打不出那种团。",
    eff: { TEAM: 3, MENTAL: 2 }
  },

  /* ================= lck_top · 上路铁壁（5） ================= */
  {
    id: "tal4_kiin",
    src: { type: "real", who: "LCK:Kiin", year: 2024, event: "LCK 上单，杰斯、纳尔、奎桑提，什么版本都能拿出一个能打的", quote: "版本怎么变，我都有英雄" },
    name: "什么版本都有英雄",
    type: "talent",
    rarity: "gold",
    tag: "lck_top",
    build: "split",
    desc: "别人版本一变就得重新练英雄，他打开英雄列表随便点一个都能上比赛，还打得像练了半年。你 ban 他三个上单，他拿第四个照样压你线。",
    eff: { LANE: 3, POOL: 2 }
  },
  {
    id: "tal4_doran",
    src: { type: "real", who: "LCK:Doran", year: 2024, event: "LCK 上单，杰斯、格温、贾克斯，对线敢打敢拼也敢送", quote: "这波我能打，真的能打" },
    name: "这波我能打",
    type: "talent",
    rarity: "purple",
    tag: "lck_top",
    build: "attack",
    desc: "他每波都想上，上了有时候把对面打穿，有时候把自家上野区送穿，你在旁边看得血压忽上忽下。可比赛结束一看，他的伤害又莫名其妙排在第一。",
    eff: { LANE: 2, MECH: 2 }
  },
  {
    id: "tal4_kingen",
    src: { type: "real", who: "LCK:Kingen", year: 2022, event: "2022 世界赛冠军上单，亚托克斯、贾克斯，决赛把把硬扛", quote: "剑魔开大，你们后退也没用" },
    name: "剑魔开大往后站",
    type: "talent",
    rarity: "purple",
    tag: "lck_top",
    build: "teamfight",
    desc: "他拿剑魔的时候，你们全队的站位都得往后挪半格；他开大那一下不是来杀人的，是来把你们阵型撕开的。数据上他参团率不算最高，可每波团他都站在最前面。",
    eff: { TEAM: 3 }
  },
  {
    id: "tal4_smeb",
    src: { type: "real", who: "LCK:Smeb", year: 2016, event: "ROX 上单，兰博、凯南、菲奥娜，S6 那场上路对轰到现在还有人剪", quote: "兰博的烧烤架，你敢进来吗" },
    name: "兰博的烧烤架",
    type: "talent",
    rarity: "purple",
    tag: "lck_top",
    build: "split",
    desc: "他拿兰博往塔前一站，兵线就是他的，你想补刀先问问那团火答不答应。那几年 LCK 上单一个比一个能打，他是里面最喜欢把对线打成单方面屠杀的那个。",
    eff: { LANE: 3, MECH: 2 }
  },
  {
    id: "tal4_nuguri",
    src: { type: "real", who: "LCK:Nuguri", year: 2020, event: "DWG 冠军上单，凯南、杰斯、弗拉基米尔，把上路打成第二个中路", quote: "上路也是 C 位" },
    name: "上路也是 C 位",
    type: "talent",
    rarity: "gold",
    tag: "lck_top",
    build: "attack",
    desc: "别人上单想着怎么不崩，他想着怎么把上路打成第二个中路；凯南绕后那一下，你们双 C 的闪现都按不出来。那支 DWG 最不讲理的地方，就是上路也能当核心打。",
    eff: { LANE: 3, TEAM: 2 }
  },

  /* ================= lck_bot · 下路枪口（5） ================= */
  {
    id: "tal4_ruler",
    src: { type: "real", who: "LCK:Ruler", year: 2023, event: "世界冠军 AD，卡莎、泽丽、霞，团战里走位像开了上帝视角", quote: "你抓不到我，就别抓了" },
    name: "抓不到就别抓了",
    type: "talent",
    rarity: "red",
    tag: "lck_bot",
    build: "attack",
    desc: "你们五个人去切他，技能全交完他还有半管血，站在那儿把你们一个个点死。打完你看回放，发现他每一步都踩在你们技能的缝里，像提前看过剧本。",
    eff: { MECH: 4, LANE: 2 }
  },
  {
    id: "tal4_deft",
    src: { type: "real", who: "LCK:Deft", year: 2022, event: "打了十年才拿到世界冠军，金克丝、薇恩、EZ，最后一舞跳成了真的", quote: "我还想继续打" },
    name: "最后一舞",
    type: "talent",
    rarity: "gold",
    tag: "lck_bot",
    build: "mental",
    desc: "他打了十年，被让二追三过，被伤病拖过，被说该退役了，然后在一个谁都没料到的年份把冠军拿了。你看他赛后哭的时候会想，这人到底图什么，可能就是不服。",
    eff: { MENTAL: 4, LANE: 2 }
  },
  {
    id: "tal4_viper",
    src: { type: "real", who: "LCK:Viper", year: 2021, event: "冠军 AD，厄斐琉斯、泽丽、卡莎，输出环境再差也能把伤害打满", quote: "给我一把枪，我就能打输出" },
    name: "给我一把枪",
    type: "talent",
    rarity: "gold",
    tag: "lck_bot",
    build: "attack",
    desc: "队友全倒了，他一个人站在塔下清三波线，还得抽空点你两下；你以为这波稳了，他换把武器又把团打赢了。那种 AD 你没法针对，只能盼他自己失误。",
    eff: { MECH: 3, TEAM: 2 }
  },
  {
    id: "tal4_peyz",
    src: { type: "real", who: "LCK:Peyz", year: 2024, event: "新生代 AD，泽丽、卡莎、霞，出道就在强队里打首发", quote: "新人也可以不手软" },
    name: "新人也不手软",
    type: "talent",
    rarity: "purple",
    tag: "lck_bot",
    build: "attack",
    desc: "刚上来那会儿没人认识他，资格赛一轮打完，弹幕全在问这谁；他拿泽丽在团战里滑来滑去，把对面几个老将当训练营打。新人最怕的是不敢打，他好像没这个毛病。",
    eff: { LANE: 2, MECH: 2 }
  },
  {
    id: "tal4_teddy",
    src: { type: "real", who: "LCK:Teddy", year: 2019, event: "LCK AD，卡莉丝塔、伊泽芮尔，对线期能把对面压到不敢吃线", quote: "补刀落后，你就已经输了" },
    name: "对线期就结束",
    type: "talent",
    rarity: "purple",
    tag: "lck_bot",
    build: "split",
    desc: "他拿卡莉丝塔的时候，对面 AD 前十分钟基本是在塔下度过的，补刀差越拉越大，团战还没开经济已经差一件装备。下路这条线有时候不用打团，对线就分出胜负了。",
    eff: { LANE: 3 }
  },

  /* ================= lck_support · 视野与开团（5） ================= */
  {
    id: "tal4_beryl",
    src: { type: "real", who: "LCK:BeryL", year: 2022, event: "两冠辅助，派克、巴德、烈娜塔，赛前还在研究别的游戏", quote: "抽卡才是主业，夺冠是顺带的" },
    name: "抽卡才是主业",
    type: "talent",
    rarity: "gold",
    tag: "lck_support",
    build: "control",
    desc: "别人赛前研究对手，他赛前研究卡池；然后他拿巴德在地图里乱窜，把你们野区插得跟自家后院一样。你说他不务正业，他两个冠军戒指戴手上，你也不好再说什么。",
    eff: { GAME: 4, POOL: 2 }
  },
  {
    id: "tal4_lehends",
    src: { type: "real", who: "LCK:Lehends", year: 2024, event: "LCK 辅助，蕾欧娜、洛、烈娜塔，开团时机挑得又狠又准", quote: "我说开，你们跟上就行" },
    name: "我说开就开",
    type: "talent",
    rarity: "gold",
    tag: "lck_support",
    build: "teamfight",
    desc: "他喊开团的时候你还没反应过来，人已经进去了；你手忙脚乱跟上去，发现对面阵型正好被他一个人撕成两半。这种辅助最可怕的地方，是他比你们所有人都清楚这波能不能打。",
    eff: { TEAM: 3, GAME: 2 }
  },
  {
    id: "tal4_delight",
    src: { type: "real", who: "LCK:Delight", year: 2024, event: "LCK 辅助，洛、牛头、芮尔，硬辅一拿就敢往里冲", quote: "硬辅就是用来开的" },
    name: "硬辅就是用来开的",
    type: "talent",
    rarity: "purple",
    tag: "lck_support",
    build: "teamfight",
    desc: "他玩洛的时候你会觉得这英雄怎么这么烦，从侧面飞进来抬五个，你们技能还没来得及按，团战已经结束了。硬辅在他手里不是保护位，是一把锤子，见谁砸谁。",
    eff: { TEAM: 3 }
  },
  {
    id: "tal4_effort",
    src: { type: "real", who: "LCK:Effort", year: 2019, event: "LCK 辅助，泰坦、牛头，开团很敢但偶尔把队友一起带走", quote: "我钩中了，你们怎么没跟上" },
    name: "我钩中了你们人呢",
    type: "talent",
    rarity: "blue",
    tag: "lck_support",
    build: "teamfight",
    desc: "他钩中人的时候你们还在赶路，等他被五个人围住，你们才刚走到河道；下一波他还是第一个上。这种辅助你会骂他送，可没有他，你们连开的勇气都没有。",
    eff: { TEAM: 2 }
  },
  {
    id: "tal4_wolf",
    src: { type: "real", who: "LCK:Wolf", year: 2016, event: "SKT 冠军辅助，锤石、莫甘娜、布隆，保护与开团都干过", quote: "锤石的灯笼，能救人也能钓鱼" },
    name: "灯笼钓鱼",
    type: "talent",
    rarity: "purple",
    tag: "lck_support",
    build: "control",
    desc: "他往草里丢个灯笼，你以为是在救人，走过去发现里面蹲着三个；他玩莫甘娜的时候，你们的控制技能全成了摆设。冠军队的辅助不一定要多秀，但一定让你难受。",
    eff: { GAME: 2, TEAM: 2 }
  },

  /* ================= lec_rookie · 欧洲法王（5） ================= */
  {
    id: "tal4_caps",
    src: { type: "real", who: "LEC:Caps", year: 2024, event: "欧洲中单，乐芙兰、佐伊、塞拉斯，敢在决赛拿冷门英雄", quote: "欧洲法王，打的就是操作" },
    name: "欧洲法王",
    type: "talent",
    rarity: "red",
    tag: "lec_rookie",
    build: "attack",
    desc: "他拿乐芙兰的时候，你在中路补个刀都得先看一眼草丛；他要是想单杀你，技能交得又快又省，等你反应过来血条已经见底。欧洲中单里，他是那种真敢跟你拼操作的。",
    eff: { MECH: 4, LANE: 2 }
  },
  {
    id: "tal4_perkz",
    src: { type: "real", who: "LEC:Perkz", year: 2019, event: "G2 中单兼 AD，佐伊、亚索、霞，嘴上功夫和手上功夫一样硬", quote: "EU > NA，这还需要证明吗" },
    name: "EU 大于 NA",
    type: "talent",
    rarity: "gold",
    tag: "lec_rookie",
    build: "control",
    desc: "他赛前能把对面喷到破防，赛后还能拿数据堵你的嘴；中单打腻了就转 AD，照样在决赛里 C。你讨厌他，但你也知道，这种人站在对面就是麻烦。",
    eff: { MECH: 3, GAME: 2 }
  },
  {
    id: "tal4_rekkles",
    src: { type: "real", who: "LEC:Rekkles", year: 2020, event: "欧洲 AD，薇恩、伊泽芮尔、卡莎，打了多年还在追那个冠军", quote: "我还能再打一年" },
    name: "再打一年",
    type: "talent",
    rarity: "gold",
    tag: "lec_rookie",
    build: "split",
    desc: "他每年都说这可能是最后一年，然后每年又出现在名单里；薇恩在他手里还是那个薇恩，只是队友换了一茬又一茬。你看他打比赛的时候会有点心酸，又有点佩服。",
    eff: { LANE: 3, MENTAL: 2 }
  },
  {
    id: "tal4_jankos",
    src: { type: "real", who: "LEC:Jankos", year: 2019, event: "G2 打野，雷克塞、男枪、奥拉夫，前十五分钟抓人抓得你心态爆炸", quote: "First Blood，又是我的" },
    name: "一血专业户",
    type: "talent",
    rarity: "purple",
    tag: "lec_rookie",
    build: "jungle",
    desc: "他二级就来你野区晃，三级从三角草绕后，五分钟你已经被抓了两次；你公屏打字问他是不是住上路，他回你个笑脸。被他抓崩过的人，后来都学会先插眼了。",
    eff: { GAME: 2, TEAM: 2 }
  },
  {
    id: "tal4_hylissang",
    src: { type: "real", who: "LEC:Hylissang", year: 2021, event: "欧洲辅助，派克、洛、塔姆，开团像不要命，送起来也像不要命", quote: "我先上，你们随意" },
    name: "我先上你们随意",
    type: "talent",
    rarity: "purple",
    tag: "lec_rookie",
    build: "control",
    desc: "他开团的时候你永远猜不到他是想赢还是想送，有时候一个人冲进去把对面阵型搅烂，有时候冲进去就再也没出来。跟他当队友心脏得好，跟他当对手心脏更得好。",
    eff: { TEAM: 2, GAME: 2 }
  },

  /* ================= west_bot · 欧美下路（5） ================= */
  {
    id: "tal4_doublelift",
    src: { type: "real", who: "LCS:Doublelift", year: 2019, event: "北美 AD，薇恩、卢锡安、卡莎，嘴上说自己是世界第一", quote: "我是最强的，其他人都是垃圾" },
    name: "我是最强的",
    type: "talent",
    rarity: "gold",
    tag: "west_bot",
    build: "split",
    desc: "他赛前采访把所有人都得罪一遍，比赛里还真敢拿薇恩跟你对点；赢了他说自己早说过，输了他说队友不行。你烦他烦得牙痒，可他的对线确实没几个人压得住。",
    eff: { LANE: 3, MECH: 2 }
  },
  {
    id: "tal4_hans_sama",
    src: { type: "real", who: "LEC:Hans Sama", year: 2024, event: "欧洲 AD，德莱文、卡莎、泽丽，对线期敢跟你换血换到底", quote: "德莱文接斧头，你接得住吗" },
    name: "德莱文接斧头",
    type: "talent",
    rarity: "purple",
    tag: "west_bot",
    build: "attack",
    desc: "他拿德莱文的时候下路就不是对线了，是单方面处刑，斧头落点算得比你走位还准；你缩塔下他也不急，就在那儿晃，等你出来补刀。那几分钟你会怀疑自己为什么要打 AD。",
    eff: { MECH: 2, LANE: 2 }
  },
  {
    id: "tal4_upset",
    src: { type: "real", who: "LEC:Upset", year: 2024, event: "欧洲 AD，卡莎、泽丽、厄斐琉斯，团战里输出位置找得很刁", quote: "你们先打，我找位置" },
    name: "我先找位置",
    type: "talent",
    rarity: "purple",
    tag: "west_bot",
    build: "attack",
    desc: "团战打起来他先往后撤半步，你以为他怂了，结果他从侧面绕出来把你们后排点掉；等你回头找他，他已经换好位置继续输出了。会找位置的 AD，比会操作的更难抓。",
    eff: { MECH: 2, TEAM: 2 }
  },
  {
    id: "tal4_sneaky",
    src: { type: "real", who: "LCS:Sneaky", year: 2018, event: "北美 AD，女警、艾希、希维尔，补刀稳得像机器", quote: "我先把刀补完" },
    name: "先把刀补完",
    type: "talent",
    rarity: "purple",
    tag: "west_bot",
    build: "control",
    desc: "他打比赛像在打卡，补刀、推线、跟团，一步不乱；你几乎看不到他有什么高光，可每次结算他的经济都压你一头。这种 AD 不吓人，但他就是不掉链子。",
    eff: { LANE: 2, GAME: 2 }
  },
  {
    id: "tal4_comp",
    src: { type: "real", who: "LEC:Comp", year: 2024, event: "欧洲 AD，卡莉丝塔、德莱文，前期对线压得特别凶", quote: "三级之前，下路我说了算" },
    name: "三级之前我说了算",
    type: "talent",
    rarity: "blue",
    tag: "west_bot",
    build: "attack",
    desc: "他拿卡莉丝塔的时候，一级就开始往前压，你补一个刀要挨两下平 A；你想着等打野来抓，他早就把线推到你塔下然后去中路游走了。下路崩盘有时候就是从第一个刀开始的。",
    eff: { LANE: 2 }
  },

  /* ================= west_jungle · 欧美野区（5） ================= */
  {
    id: "tal4_blaber",
    src: { type: "real", who: "LCS:Blaber", year: 2024, event: "北美打野，男枪、豹女、千珏，刷野速度像开了加速", quote: "你的野区，我替你刷了" },
    name: "你的野区我替你刷",
    type: "talent",
    rarity: "gold",
    tag: "west_jungle",
    build: "jungle",
    desc: "你还在打红 buff，他已经把你家三狼吃了；你去找他算账，发现他等级比你高两级。北美打野里他最不讲道理的地方，就是从来不跟你讲道理，只讲刷新时间。",
    eff: { GAME: 3, MECH: 2 }
  },
  {
    id: "tal4_elyoya",
    src: { type: "real", who: "LEC:Elyoya", year: 2021, event: "欧洲打野，蔚、盲僧、赵信，抓人路线又怪又准", quote: "我不走寻常路" },
    name: "抓人不走寻常路",
    type: "talent",
    rarity: "purple",
    tag: "west_jungle",
    build: "jungle",
    desc: "别人打野从河道来，他从你家蛤蟆那边绕；你以为他在上半区，他从下路草丛里走出来。你研究他的录像研究了一晚上，第二天他还是能用一条你没见过的路线抓死你。",
    eff: { GAME: 2, TEAM: 2 }
  },
  {
    id: "tal4_inspired",
    src: { type: "real", who: "LEC:Inspired", year: 2024, event: "欧洲打野，男枪、千珏，野核打法，经济领先就滚雪球", quote: "让我刷起来，你们就没了" },
    name: "让我刷起来",
    type: "talent",
    rarity: "purple",
    tag: "west_jungle",
    build: "jungle",
    desc: "前期你不去管他，他闷头刷到六神装，团战里一枪一个；你去了，他早就在河道插好眼跑了。对付这种打野要么把他野区反烂，要么就等着他二十分钟后接管比赛。",
    eff: { GAME: 3 }
  },
  {
    id: "tal4_selfmade",
    src: { type: "real", who: "LEC:Selfmade", year: 2020, event: "欧洲打野，伊芙琳、男枪，rank 气质很重但操作是真的好", quote: "我 rank 就是这么打的" },
    name: "我 rank 就这么打",
    type: "talent",
    rarity: "purple",
    tag: "west_jungle",
    build: "jungle",
    desc: "他打比赛像在打排位，伊芙琳绕后那一下又阴又准，你觉得这人怎么这么不讲章法；可他真被抓崩的时候，也崩得跟排位里那个送头队友一模一样。",
    eff: { MECH: 3 }
  },
  {
    id: "tal4_svenskeren",
    src: { type: "real", who: "LCS:Svenskeren", year: 2019, event: "北美打野，盲僧、雷克塞，前期节奏带得飞快", quote: "前十分钟，我来带" },
    name: "前十分钟我来带",
    type: "talent",
    rarity: "blue",
    tag: "west_jungle",
    build: "jungle",
    desc: "他前十分钟能在地图上出现四五次，每次都在你最难受的位置；十分钟之后他开始迷路，你也开始有机会。跟他打比赛，前十分钟扛住了，后面就好办了。",
    eff: { GAME: 2 }
  },

  /* ================= na_import · 北美外援（5） ================= */
  {
    id: "tal4_bjergsen",
    src: { type: "real", who: "LCS:Bjergsen", year: 2017, event: "北美中单，辛德拉、佐伊、瑞兹，一个人扛着队伍走了很多年", quote: "我还能 carry，再给我一年" },
    name: "再给我一年",
    type: "talent",
    rarity: "gold",
    tag: "na_import",
    build: "control",
    desc: "那几年北美赛区就指着他一个人打，常规赛 MVP 拿了一堆，世界赛还是卡在小组；他每年都说再试一次，队友换了一批又一批。你看他打比赛会觉得，有些坚持是没有回报的。",
    eff: { GAME: 3, MENTAL: 2 }
  },
  {
    id: "tal4_jojopyun",
    src: { type: "real", who: "LCS:Jojopyun", year: 2022, event: "北美新生代中单，阿卡丽、塞拉斯，嘴上不饶人", quote: "我不管你是谁，我都能打" },
    name: "我不管你是谁",
    type: "talent",
    rarity: "purple",
    tag: "na_import",
    build: "attack",
    desc: "他刚上来就敢跟老牌中单对喷，比赛里拿阿卡丽往你后排冲，冲输了下一波还冲；北美赛区太久没出过这种不怕死的年轻人，弹幕一边骂他装，一边又盼着他赢。",
    eff: { MECH: 3 }
  },
  {
    id: "tal4_impact",
    src: { type: "real", who: "LCS:Impact", year: 2018, event: "世界冠军上单，贾克斯、慎、兰博，去北美之后成了最稳的那块砖", quote: "哪里需要我，我就去哪" },
    name: "哪里需要我去哪",
    type: "talent",
    rarity: "gold",
    tag: "na_import",
    build: "teamfight",
    desc: "他拿过世界冠军，后来去北美一打就是很多年，队伍缺前排他就玩坦克，缺单带他就玩贾克斯。你可能觉得他没追求，可每年季后赛你都能看到他在那儿站着。",
    eff: { TEAM: 3, MENTAL: 2 }
  },
  {
    id: "tal4_jensen",
    src: { type: "real", who: "LCS:Jensen", year: 2019, event: "北美中单，阿兹尔、佐伊，对线稳、团战能输出", quote: "中路这条线，我守得住" },
    name: "中路我守得住",
    type: "talent",
    rarity: "purple",
    tag: "na_import",
    build: "control",
    desc: "他不是那种能一打五的中单，但你很难从他身上撕开口子；阿兹尔往塔下一站，兵线进不来，团战还能推个大招。队伍里有这种人，下限就不会太难看。",
    eff: { LANE: 2, GAME: 2 }
  },
  {
    id: "tal4_zven",
    src: { type: "real", who: "LCS:Zven", year: 2020, event: "欧洲转北美的 AD，卡莎、霞，基本功扎实", quote: "我先稳住，再找机会" },
    name: "先稳住再找机会",
    type: "talent",
    rarity: "purple",
    tag: "na_import",
    build: "split",
    desc: "他打比赛很少送，也很少爆，属于那种你看完一整场记不住他干了什么、一看数据又觉得还行的 AD。队伍顺风他跟着推，队伍逆风他守着塔，不惊艳但也不添乱。",
    eff: { LANE: 2, MECH: 2 }
  },

  /* ================= dual_lane · 下路双人组（5，原创） ================= */
  {
    id: "tal4_bond_botlane_twins",
    src: { type: "original", note: "原创羁绊：两个人从 LDL 一起打上来，下路不用说话也知道对方要干嘛" },
    name: "下路连体婴",
    type: "bond",
    rarity: "purple",
    tag: "dual_lane",
    build: "teamfight",
    desc: "你们俩从 LDL 就睡一个屋，打下路不用报点，一个眼神就知道这波是打还是撤；对面来抓，辅助先往后走半步，AD 就知道该往哪闪。凑齐这张和下路的另一张，双人组的默契会变成实打实的团战加成。",
    eff: { TEAM: 2, LANE: 1 }
  },
  {
    id: "tal4_bond_aggressive_lane",
    src: { type: "original", note: "原创羁绊：下路两个人都是暴脾气，二级就敢越塔" },
    name: "二级抓下套餐",
    type: "bond",
    rarity: "purple",
    tag: "dual_lane",
    build: "attack",
    desc: "你们下路从不等到六级，二级就敢把兵线推进塔然后叫打野来越；越成功一次，对面下路整局都别想安生，越失败一次，你们俩一起在泉水里反省。这套卡凑齐，前期的进攻欲望会变成对面下路的噩梦。",
    eff: { LANE: 2, TEAM: 1 }
  },
  {
    id: "tal4_bond_weakside",
    src: { type: "original", note: "原创羁绊：下路被放养，两个人自己想办法活下来" },
    name: "被放养的下路",
    type: "bond",
    rarity: "blue",
    tag: "dual_lane",
    build: "split",
    desc: "打野住在上路，中路忙着刷刀，你们下路两个人被对面四个人轮流照顾；你们学会了自己做视野、自己控线、自己找机会，活得比谁都顽强。凑齐这套，被针对的时候反而能多撑一会儿。",
    eff: { MENTAL: 2 }
  },
  {
    id: "tal4_bond_lanekill",
    src: { type: "original", note: "原创羁绊：下路对线期就要线杀，不跟你拖后期" },
    name: "线杀双人组",
    type: "bond",
    rarity: "purple",
    tag: "dual_lane",
    build: "attack",
    desc: "你们下路的信条是对线期就把账算清，能线杀绝不等团战；辅助先手控住，AD 跟伤害跟得比谁都快，对面下路死两次就开始缩塔。凑齐这套，对线期的压制会变成实实在在的经济差。",
    eff: { LANE: 2, MECH: 1 }
  },
  {
    id: "tal4_bond_roam_support",
    src: { type: "original", note: "原创羁绊：辅助不爱待在下路，AD 一个人也能稳住" },
    name: "游走型辅助",
    type: "bond",
    rarity: "purple",
    tag: "dual_lane",
    build: "control",
    desc: "辅助三级就游走，下路留 AD 一个人对着两个，你以为他会被压崩，结果他补刀一个没漏；辅助在中路和野区转一圈回来，对面已经少了两个人。凑齐这套，地图上的压力会一直跟着对面。",
    eff: { GAME: 2 }
  },

  /* ================= vision_duo · 视野双人组（4，原创） ================= */
  {
    id: "tal4_bond_vision_duo",
    src: { type: "original", note: "原创羁绊：辅助和打野把视野当命，地图上永远有眼" },
    name: "视野双人组",
    type: "bond",
    rarity: "purple",
    tag: "vision_duo",
    build: "control",
    desc: "你们打野和辅助出门必带两个真眼，回家先补眼石再买装备；对面打野走到哪，你们地图上就亮到哪。凑齐这套，你们的野区会变成对面不敢进的地方。",
    eff: { GAME: 2, TEAM: 1 }
  },
  {
    id: "tal4_bond_jungle_support",
    src: { type: "original", note: "原创羁绊：打野和辅助绑在一起动，两个人当一个人用" },
    name: "野辅联动",
    type: "bond",
    rarity: "purple",
    tag: "vision_duo",
    build: "jungle",
    desc: "打野去哪儿，辅助就跟到哪儿，两个人一起做视野、一起抓人、一起撤退；对面中单刚想动，草丛里已经蹲着两个。凑齐这套，你们的游走会变得很难被抓住。",
    eff: { GAME: 2 }
  },
  {
    id: "tal4_bond_deep_ward",
    src: { type: "original", note: "原创羁绊：敢把眼插到对面野区深处的人" },
    name: "深入敌后的那颗眼",
    type: "bond",
    rarity: "blue",
    tag: "vision_duo",
    build: "control",
    desc: "你们辅助最爱干的事是绕到对面红 buff 后面插个眼，被抓死了也不改；可就是那颗眼，让打野每次都能提前知道对面往哪走。凑齐这套，你们开团前的信息会多出半拍。",
    eff: { GAME: 2 }
  },
  {
    id: "tal4_bond_baron_control",
    src: { type: "original", note: "原创羁绊：大龙区视野垄断，逼对面进来送" },
    name: "大龙视野垄断",
    type: "bond",
    rarity: "purple",
    tag: "vision_duo",
    build: "teamfight",
    desc: "二十分钟之后你们全队的眼都往大龙坑扔，对面进也不是退也不是；他们硬着头皮进来做视野，正好撞进你们的口袋。凑齐这套，大龙区的团战会好打很多。",
    eff: { TEAM: 2 }
  },

  /* ================= draft_book · 教练组（4，原创） ================= */
  {
    id: "tal4_bond_draft_book",
    src: { type: "original", note: "原创羁绊：教练的小本子上记着对面每个人的英雄池" },
    name: "教练的 BP 小本子",
    type: "bond",
    rarity: "purple",
    tag: "draft_book",
    build: "control",
    desc: "教练那本子被翻得起了毛边，上面记着对面中单近三个月每个英雄的胜率、打野的开局路线、下路的换血习惯；BP 的时候他不用想，翻开就是答案。凑齐这套，你们的 BP 会多出几个针对位。",
    eff: { GAME: 2 }
  },
  {
    id: "tal4_bond_analyst",
    src: { type: "original", note: "原创羁绊：数据分析师把对手的录像拆到每一分钟" },
    name: "数据分析师",
    type: "bond",
    rarity: "blue",
    tag: "draft_book",
    build: "control",
    desc: "别人备赛看两场录像，他把对面最近二十场的眼位、开团时机、经济曲线全做成表；你嫌他烦，比赛里他说的那句“他们这波要打龙”偏偏每次都准。凑齐这套，局内决策会多一份底气。",
    eff: { GAME: 2, matchBonus: 1 }
  },
  {
    id: "tal4_bond_mind_coach",
    src: { type: "original", note: "原创羁绊：心理教练，专治关键局手抖" },
    name: "心理教练",
    type: "bond",
    rarity: "purple",
    tag: "draft_book",
    build: "mental",
    desc: "他不跟你聊操作，只聊你昨晚睡得好不好、赛前那口气顺不顺；你以为这是玄学，结果决胜局你的手真的没抖。凑齐这套，关键局的心态会稳不少。",
    eff: { MENTAL: 2, keyBonus: 1 }
  },
  {
    id: "tal4_bond_scout",
    src: { type: "original", note: "原创羁绊：青训球探，专门在网吧和 LDL 里挖人" },
    name: "青训球探",
    type: "bond",
    rarity: "blue",
    tag: "draft_book",
    build: "money",
    desc: "他常年泡在网吧和 LDL 场馆，看人只看两局，一局看操作上限，一局看输了之后的脸；他挖回来的人有的成了宝，有的连 LDL 都打不明白。凑齐这套，你队里的年轻人会多一次机会。",
    eff: { money: 1, POOL: 1 }
  },

  /* ================= old_guard · 老将（4，原创） ================= */
  {
    id: "tal4_bond_old_guard",
    src: { type: "original", note: "原创羁绊：老将的最后一年，操作掉了但脑子还在" },
    name: "老将的最后一年",
    type: "bond",
    rarity: "gold",
    tag: "old_guard",
    build: "mental",
    desc: "他的手速已经跟不上了，对线偶尔会被年轻人压，可一到关键局，他知道什么时候该打、什么时候该忍；赛前他还会把年轻人叫到一边，说两句不客气的话。凑齐这套，队伍在逆风里会多一个稳住的人。",
    eff: { MENTAL: 3, TEAM: 1 }
  },
  {
    id: "tal4_bond_veteran_voice",
    src: { type: "original", note: "原创羁绊：更衣室里说话最有分量的那个人" },
    name: "更衣室的话事人",
    type: "bond",
    rarity: "purple",
    tag: "old_guard",
    build: "mental",
    desc: "队里吵起来的时候他不劝，等大家吵累了，他才开口说两句，然后所有人都闭嘴；教练有些话说不出口，也让他去说。凑齐这套，队内的信任会更难被消耗。",
    eff: { TEAM: 2, MENTAL: 2 }
  },
  {
    id: "tal4_bond_late_game",
    src: { type: "original", note: "原创羁绊：后期指挥，兵线和大龙的账算得比谁都清楚" },
    name: "后期指挥",
    type: "bond",
    rarity: "purple",
    tag: "old_guard",
    build: "control",
    desc: "三十分钟之后地图上的事全归他管，谁去带线、谁跟大龙、谁回家补装，他一句一句说；你嫌他啰嗦，可每次到了后期，队伍的执行就是比别人齐。凑齐这套，后期决策会稳很多。",
    eff: { GAME: 2, TEAM: 2 }
  },
  {
    id: "tal4_bond_handover",
    src: { type: "original", note: "原创羁绊：老将把位置交给年轻人，自己在旁边看着" },
    name: "交接班",
    type: "bond",
    rarity: "blue",
    tag: "old_guard",
    build: "teamfight",
    desc: "他打了最后一场，把首发位置让给那个天天跟他抢训练赛的年轻人；赛后他没哭，只是坐在休息室看着屏幕里自己的名字被替换掉。凑齐这套，队伍的新老交替会少一点撕裂。",
    eff: { TEAM: 2, MENTAL: 1 }
  },

  /* ================= rookie_wall · 新人墙（4，原创） ================= */
  {
    id: "tal4_bond_rookie_wall",
    src: { type: "original", note: "原创羁绊：自家青训，从 LDL 一路打上 LPL 的几个人" },
    name: "自家青训",
    type: "bond",
    rarity: "purple",
    tag: "rookie_wall",
    build: "split",
    desc: "你们几个人从青训营一起升上来，教练骂人的词汇都没换过；别人花大价钱买来的选手，你们自己练出来了。凑齐这套，年轻人成长会快一点，队里也更愿意等你们。",
    eff: { growth: 1, MENTAL: 1 }
  },
  {
    id: "tal4_bond_first_split",
    src: { type: "original", note: "原创羁绊：第一次打 LPL，上场前手都是凉的" },
    name: "第一次打 LPL",
    type: "bond",
    rarity: "blue",
    tag: "rookie_wall",
    build: "mental",
    desc: "第一次走进 LPL 的场馆，灯光比 LDL 亮一倍，观众的声音从四面八方压过来；你坐下的时候手是凉的，第一波兵补完才慢慢找回感觉。凑齐这套，新人的第一场会没那么慌。",
    eff: { MENTAL: 2 }
  },
  {
    id: "tal4_bond_ldl_grind",
    src: { type: "original", note: "原创羁绊：在 LDL 熬了两三年才等来一个机会" },
    name: "LDL 熬出来的",
    type: "bond",
    rarity: "purple",
    tag: "rookie_wall",
    build: "mental",
    desc: "LDL 的场馆没有空调，赢了比赛奖金还不够一个月房租，你熬了三年才等到一个试训电话；别人问你后不后悔，你说再选一次还这么打。凑齐这套，你在逆境里的抗压会强一点。",
    eff: { MENTAL: 2, PHYS: 1 }
  },
  {
    id: "tal4_bond_second_team",
    src: { type: "original", note: "原创羁绊：从二队被临时提上一队救火" },
    name: "二队上来救火",
    type: "bond",
    rarity: "purple",
    tag: "rookie_wall",
    build: "attack",
    desc: "一队首发突然伤了，你从二队被拉上来，连队服都是临时改的；没人指望你赢，你上去把对面上单打穿了，赛后教练拍你肩膀说下一场还你上。凑齐这套，临时上场时的发挥会稳一些。",
    eff: { MECH: 1, MENTAL: 2 }
  },

  /* ================= iron_triangle · 铁三角（4，原创） ================= */
  {
    id: "tal4_bond_iron_triangle",
    src: { type: "original", note: "原创羁绊：上中野三个人绑在一起打，谁也不能少" },
    name: "铁三角",
    type: "bond",
    rarity: "gold",
    tag: "iron_triangle",
    build: "teamfight",
    desc: "上中野三个人从训练赛吵到比赛，吵完还是三个人一起动；上路先手、中路跟控、打野收割，一套流程走完对面还没反应过来。凑齐这套，上半区的团战会变成你们的主场。",
    eff: { TEAM: 3, GAME: 1 }
  },
  {
    id: "tal4_bond_three_lanes",
    src: { type: "original", note: "原创羁绊：三路都能 C，对面抓哪路都不对" },
    name: "三路齐飞",
    type: "bond",
    rarity: "gold",
    tag: "iron_triangle",
    build: "attack",
    desc: "对面打野蹲上路，下路被越；去下路，中路又单杀了；他站在野区想了三秒，发现自己哪条路都帮不了。凑齐这套，你们三路的对线压制会互相放大。",
    eff: { LANE: 2, TEAM: 1 }
  },
  {
    id: "tal4_bond_mid_jungle",
    src: { type: "original", note: "原创羁绊：中野双核，节奏从二分钟就开始" },
    name: "中野双核",
    type: "bond",
    rarity: "purple",
    tag: "iron_triangle",
    build: "jungle",
    desc: "中单二级就把线推进去，打野正好在河道等着，两个人一起进你野区；你中路想来帮，兵线又被推回来。凑齐这套，中野联动的第一波会更快。",
    eff: { GAME: 2, MECH: 1 }
  },
  {
    id: "tal4_bond_top_side",
    src: { type: "original", note: "原创羁绊：上中野打上半区，下路自己玩" },
    name: "上中野铁三角",
    type: "bond",
    rarity: "purple",
    tag: "iron_triangle",
    build: "teamfight",
    desc: "你们把资源全压在上半区，先锋、上半野区、上路塔，一样一样吃过去；下路两个人被压着打也不吭声，等你们把上半区打穿再回来接团。凑齐这套，上半区的资源争夺会顺很多。",
    eff: { TEAM: 2, GAME: 1 }
  }
];
