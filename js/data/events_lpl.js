/* =========================================================
   登神 · LPL 冠军记忆（window.DATA_EVENTS_LPL）
   2018 IG / 2019 FPX / 2021 EDG / 2021 MSI RNG / 2023 JDG /
   2025 TES / 2026 AL
   这些是“老粉/旧队服/回放”类事件，夸的是那些年，不拉踩现在的选手。
   ========================================================= */
window.DATA_EVENTS_LPL = [
  {
    id: "lpl_legacy_ig2018", yearLabel: "2018", srcType: "real", source: "2018 全球总决赛，IG 3:0 FNC，LPL 第一座召唤师奖杯。", cat: "life", w: 4, once: true, year: 0,
    text: "基地搬家，仓库最里面翻出一件 2018 年 IG 的旧队服。胸口那个队标已经起毛，背后印着的 ID 不是你的。",
    sub: "管理员说：那年的东西，扔了可惜，留着也没人穿。",
    opts: [
      { t: "挂到训练室墙上", eff: { MENTAL: 5, TEAM: 2, FAME: 1 },
        res: "你把队服挂在训练室最显眼的那面墙上。第二天教练开会，第一句话是：都看一眼，那才叫翻过山。" },
      { t: "问老管理员那年的故事", eff: { GAME: 4, MENTAL: 3 },
        res: "他说决赛前没人觉得 LPL 能赢，训练室里安静得能听见鼠标声；赢完那晚，整条街都在喊 IG。你听完没说话，回去多排了两把。" },
      { t: "收进自己的柜子", eff: { MENTAL: 2, FAME: 2 },
        res: "你把队服叠好放进柜子最上层。以后每次输了，打开柜门看一眼，再关上。" }
    ]
  },
  {
    id: "lpl_legacy_fpx2019", yearLabel: "2019", srcType: "real", source: "2019 全球总决赛，FPX 3:0 G2，巴黎。", cat: "team", w: 4, once: true, year: 0,
    text: "团建吃饭，有人提起 2019 年的 FPX：五个看起来不像一个队的人，最后打成了“正确的五个人”。",
    sub: "桌上有人笑：我们现在五个看起来也不像，什么时候能打对一次？",
    opts: [
      { t: "接一句：先从信任开始", eff: { TEAM: 6, MENTAL: 3, spirit: 5 },
        res: "你说完桌上安静了一秒，然后有人举杯。那顿饭之后，训练赛里互相甩锅的次数少了一点。" },
      { t: "回去把那年决赛看一遍", eff: { GAME: 5, MENTAL: 2 },
        res: "你把 2019 年决赛拖了三遍。FPX 的支援永远比对面快半拍，你记了满满一页，第二天训练赛就用上了。" },
      { t: "吐槽：人家有 Doinb，我们有什么", eff: { MENTAL: -2, TEAM: 1, FAME: 1 },
        res: "全桌笑了。笑完还是得打，但至少这个队开始会拿自己开玩笑了。" }
    ]
  },
  {
    id: "lpl_legacy_edg2021", yearLabel: "2021", srcType: "real", source: "2021 全球总决赛，EDG 3:2 DK，冰岛。", cat: "training", w: 5, once: true, year: 0,
    text: "体能师在放 2021 年 EDG 的冰岛决赛回放，声音开得很小。屏幕里第五局，经济落后，龙坑前面五个人站成一排。",
    sub: "他说：那年的 EDG 也不是靠操作赢的，是靠“还没结束”。",
    opts: [
      { t: "坐下来看完第五局", eff: { MENTAL: 6, GAME: 3, energy: -4 },
        res: "你看完了最后一波团。关掉屏幕之后，你在训练日志上写了一句：落后的时候先别急着点投降。" },
      { t: "问体能师那年他们在现场吗", eff: { MENTAL: 4, GAME: 2, TEAM: 2 },
        res: "他说不在，在基地看的。夺冠那晚整栋楼都在吼，隔壁公司第二天来投诉。你笑了很久。" },
      { t: "继续练补刀", eff: { LANE: 3, MECH: 2, MENTAL: 1 },
        res: "你回到电脑前，把补刀练到凌晨一点。冰岛的故事很好，但你的故事还没开始。" }
    ]
  },
  {
    id: "lpl_legacy_rng2021", yearLabel: "2021", srcType: "real", source: "2021 MSI，RNG 3:2 DK，雷克雅未克/线上参赛。", cat: "media", w: 4, once: true, year: 0,
    text: "直播弹幕突然刷起 2021 年 MSI：RNG 在基地线上打，3:2 赢 DK。有人问：那届到底算不算 LPL 的冠军？",
    sub: "弹幕吵成一片，你夹在中间，看见一条：算，怎么不算，奖杯又没长脚。",
    opts: [
      { t: "认真回答：算，那届很难", eff: { FAME: 4, MENTAL: 3, GAME: 2 },
        res: "你说那届比赛网络、时差、场地全是问题，能在基地把 DK 打下来就是本事。弹幕安静了两秒，然后刷了一排“说得好”。" },
      { t: "顺着弹幕玩梗", eff: { FAME: 5, MENTAL: 1, TEAM: -1 },
        res: "你跟着刷了两句梗，直播间热度涨了一截。下播之后你有点后悔，但切片已经发出去了。" },
      { t: "不接这个话题", eff: { MENTAL: 2 },
        res: "你假装没看见，继续打排位。弹幕骂你装死，你当没看见。" }
    ]
  },
  {
    id: "lpl_legacy_jdg2023", yearLabel: "2023", srcType: "real", source: "2023 MSI，JDG 3:1 BLG，伦敦。", cat: "media", w: 4, once: true, year: 0,
    text: "数据组开会，投影上放着 2023 年 JDG 的 MSI：一年三冠，伦敦捧杯，然后世界赛半决赛被 T1 送走。",
    sub: "数据组的人说：我们总爱学他们的运营，但没人想学他们怎么输的。",
    opts: [
      { t: "把“怎么输的”也记下来", eff: { GAME: 5, MENTAL: 4 },
        res: "你把那轮半决赛的 BP、视野、龙团全部拆了一遍。赢的方法很多，输的原因往往就那几个。" },
      { t: "说：先学怎么赢", eff: { GAME: 3, LANE: 2, MENTAL: 2 },
        res: "你把 JDG 的运营时间点抄在本子上。教练看了一眼，说：先别学三冠，先学怎么进决赛。" },
      { t: "开个玩笑：学不了，没钱", eff: { TEAM: 2, MENTAL: 1, money: 1 },
        res: "会议室笑了。数据组的人说：没钱也行，先把眼插了。" }
    ]
  },
  {
    id: "lpl_legacy_tes2025", yearLabel: "2025", srcType: "real", source: "2025 LPL 第一赛段，TES 3:1 AL。", cat: "training", w: 5, once: true, year: 1,
    text: "2025 第一赛段决赛的录像还在首页：TES 3:1 AL，369、Kanavi、Creme、JackeyLove、Hang 第一次一起捧杯。",
    sub: "弹幕说：这套阵容看着也不像能赢，怎么就赢了？",
    opts: [
      { t: "拆一遍他们的团战站位", eff: { GAME: 5, TEAM: 3 },
        res: "你把 TES 的三波团战暂停了二十次。他们不是每条线都最强，但每一次开团都有人在正确的位置。" },
      { t: "看赛后采访", eff: { MENTAL: 4, FAME: 1 },
        res: "采访里有人说：我们五个都不是最贵的，但我们知道怎么一起赢。你把这句话抄在了训练本第一页。" },
      { t: "关掉录像去排位", eff: { MECH: 3, energy: -6 },
        res: "你没看完，直接开了排位。别人的冠军是别人的，你的分还得自己上。" }
    ]
  },
  {
    id: "lpl_legacy_al2026", yearLabel: "2026", srcType: "real", source: "2026 LPL 第三赛段，AL 3:1 BLG，Tarzan FMVP。", cat: "life", w: 5, once: true, year: 2,
    text: "2026 第三赛段决赛，AL 3:1 BLG。Tarzan 在 LPL 的第 3015 天，终于拿到联赛冠军和 FMVP。",
    sub: "镜头给到他时，他没哭，只是把奖杯举得很高，像在确认它不是道具。",
    opts: [
      { t: "看完颁奖再走", eff: { MENTAL: 6, GAME: 2, FAME: 2 },
        res: "你坐在屏幕前看完整个颁奖。3015 天这个数字在你脑子里转了很久——原来坚持本身也可以是一个冠军。" },
      { t: "把“3015”写在训练本上", eff: { MENTAL: 4, TEAM: 3 },
        res: "你在训练本封面写了 3015。队友问什么意思，你说：一个人从上台到拿冠军，用了这么久。" },
      { t: "关掉直播，去练下一把", eff: { MECH: 3, energy: -5 },
        res: "你关掉直播，开了下一把排位。别人等到了，你还没有。" }
    ]
  }
];
