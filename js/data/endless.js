/* 无尽模式专用事件池 —— yearMin: 4 之后才会进池子
   主题：老将、合同年、伤病、后浪、直播、历史地位
   结构同 events.js：{id,cat,w,once,yearMin,req,text,sub,opts[{t,eff,risk,res}]}
   eff 只写八维 + energy/money/morale/fans/status/coach/burst/hupu/haters */
window.DATA_ENDLESS_EVENTS = [
  {
    id: "end_kid_call", cat: "team", w: 12, once: false, yearMin: 4,
    req: { stage: ["LPL"] },
    text: "青训营来了个 17 岁的小孩，训练赛第一天就把你按在塔下补刀。晚上他敲你房门，问你打职业有什么建议。",
    sub: "你看着他，想起四年前自己也这么敲过别人的门。",
    opts: [
      { t: "把压箱底的全教了", eff: { TEAM: 5, FAME: 2, MENTAL: 2 }, res: "你从补刀讲到兵线，从兵线讲到心态，讲到凌晨三点。他记了满满两页。你突然觉得自己像个教练。" },
      { t: "只说一句：别学我", eff: { MENTAL: 4, TEAM: -2 }, res: "他愣了半天，说了句“哥你别这么说”，然后回房间了。你在走廊站了一会儿。" },
      { t: "拉他打一把 solo，教他做人", eff: { MECH: 2, TEAM: 3 }, risk: { stat: "MECH", dc: 13, ok: "你三把全胜，他心服口服，第二天训练赛主动给你让蓝。", fail: "你输了。他很有礼貌地说“哥你今天手感不好”，你笑不出来。", bonus: { MENTAL: -3 } } }
    ]
  },
  {
    id: "end_wrist", cat: "life", w: 11, once: false, yearMin: 4,
    req: { stage: ["LPL"] },
    text: "早上起来，右手手腕又麻了。队医按了两下，说这是老伤，不是新伤，你自己心里有数。",
    sub: "理疗室的灯很白，白得让人想退役。",
    opts: [
      { t: "打封闭，继续上", eff: { PHYS: -6, MECH: 3, MENTAL: -2 }, risk: { stat: "PHYS", dc: 14, ok: "封闭打进去，你又能甩鼠标了。疼是疼，但能打。", fail: "封闭没压住，你在训练赛里连空三个技能，教练把录像停了。", bonus: { MENTAL: -4 } } },
      { t: "休两周，让替补上", eff: { PHYS: 8, status: -6, coach: -3 }, res: "两周没碰鼠标。你每天在基地看别人打，看得手心发痒。回来的时候，替补已经打出两个 MVP 了。" },
      { t: "改握法，重新学一遍操作", eff: { MECH: -4, PHYS: 6 }, res: "你把鼠标换成竖握，前两周补刀像新手。第三周开始，手腕居然不疼了。" }
    ]
  },
  {
    id: "end_stream_money", cat: "money", w: 10, once: true, yearMin: 4,
    req: { stage: ["LPL"] },
    text: "直播平台的人约你吃饭，开口就是七位数：退役，全职播，公会给你推流。",
    sub: "他们算得很清楚：你的粉丝量，正好够撑起一个中腰部的直播间。",
    opts: [
      { t: "签了，边打边播", eff: { money: 40, FAME: 6, PHYS: -4, coach: -4 }, res: "合同签了，违约金写得很小。你开始每天播四小时，训练赛开始迟到。" },
      { t: "不签，我还想赢", eff: { MENTAL: 6, money: -2 }, res: "你把合同推回去，说再打一年。对方笑了笑，说这行不缺人。" },
      { t: "签，但要求只播休赛期", eff: { money: 22, FAME: 3 }, risk: { stat: "FAME", dc: 13, ok: "平台居然同意了，说你的故事比流量值钱。", fail: "平台不同意，饭局不欢而散，第二天有小作文说你耍大牌。", bonus: { FAME: -3 } } }
    ]
  },
  {
    id: "end_patch_kill", cat: "match", w: 11, once: false, yearMin: 4,
    req: { stage: ["LPL"] },
    text: "版本大改。你练了四年的三个绝活，全部被砍进下水道，公告下面第一条热评是“爷的青春结束了”。",
    sub: "你翻着改动列表，发现连装备都改了名。",
    opts: [
      { t: "连夜练新英雄", eff: { POOL: 6, PHYS: -4 }, risk: { stat: "POOL", dc: 12, ok: "三天练出两个能上比赛的新英雄，教练看你的眼神变了。", fail: "新英雄在训练赛被对面当提款机，你被打回原形。", bonus: { MENTAL: -3 } } },
      { t: "找教练要一套不吃版本的体系", eff: { GAME: 5, TEAM: 3 }, res: "教练在白板上画了半小时，最后说：那就打运营。你们开始一场一场地磨。" },
      { t: "直播吐槽版本", eff: { FAME: 6, coach: -5, MENTAL: 2 }, res: "你说了句“这版本是给手残准备的”，切片上了热搜。官方没理你，粉丝笑了三天。" }
    ]
  },
  {
    id: "end_contract_down", cat: "market", w: 10, once: false, yearMin: 4,
    req: { stage: ["LPL"] },
    text: "经理把你叫进办公室，桌上摊着新合同：年限加一，薪水砍三成，理由是“你也不年轻了”。",
    sub: "他说这话的时候，眼睛看着窗外。",
    opts: [
      { t: "签，只要能打", eff: { money: -8, MENTAL: -2, status: 3 }, res: "你签了。签字的时候手很稳，比四年前签第一份合同的时候稳多了。" },
      { t: "不签，试水自由市场", eff: { MENTAL: 4, money: -3 }, risk: { stat: "FAME", dc: 14, ok: "三支队伍联系你，其中一支开了比原合同更高的价。", fail: "自由市场很冷。你的电话安静了整整一个月。", bonus: { MENTAL: -6 } } },
      { t: "把话语权摆上桌", eff: { status: 4, coach: -2, money: -4 }, res: "你说：降薪可以，我要参与 BP 和人员决定。经理愣了三秒，说这不合规矩，然后问你想要多少。" }
    ]
  },
  {
    id: "end_new_challenger", cat: "media", w: 10, once: false, yearMin: 4,
    req: { stage: ["LPL"] },
    text: "一个 19 岁的新人中单在采访里点名你：“他那个时代的打法，现在已经过时了。”",
    sub: "热搜第三。评论区一半在说他说得对，一半在等你回。",
    opts: [
      { t: "赛场上见", eff: { MENTAL: 5, burst: 20 }, res: "你只在微博发了四个字：下周见。然后一周没开直播。" },
      { t: "采访里回一句狠的", eff: { FAME: 6, haters: 30000, MENTAL: -2 }, risk: { stat: "FAME", dc: 11, ok: "你那句“我打职业的时候你还在打人机”冲上热搜第一。", fail: "你那句话被剪成了鬼畜，循环播放了半个月。", bonus: { FAME: -4 } } },
      { t: "什么都不说", eff: { MENTAL: 3, coach: 3 }, res: "你关掉手机，去训练室多打了两个小时。教练路过，什么也没说，给你放了瓶水。" }
    ]
  },
  {
    id: "end_legacy", cat: "media", w: 9, once: true, yearMin: 5,
    req: { stage: ["LPL"] },
    text: "有 UP 主做了一期视频：《他到底算不算 LPL 的顶级选手？》。播放量破了百万。",
    sub: "评论区吵成一片。你把进度条拖到自己出场的那一段，看了三遍。",
    opts: [
      { t: "转发，配一句“还在打”", eff: { FAME: 5, fans: 40000, MENTAL: 2 }, res: "转发之后，评论区安静了一会儿。有人回：那就再打一年。" },
      { t: "私信 UP 主，聊了两小时", eff: { FAME: 2, MENTAL: 3, money: -1 }, res: "你把当年那场 BO5 的细节讲给他听。他说要重做一期，标题叫《被低估的那些年》。" },
      { t: "关掉视频，去排位", eff: { MECH: 2, MENTAL: 2 }, res: "你打到了凌晨四点。赢一把，输一把，分数没动。你关掉客户端，觉得挺好。" }
    ]
  },
  {
    id: "end_owner_sell", cat: "team", w: 8, once: true, yearMin: 5,
    req: { stage: ["LPL"] },
    text: "老板资金链断了，队伍要卖。经理开会的时候说：下个月工资可能晚发，大家理解一下。",
    sub: "会议室里没人说话。有人已经开始联系经纪人了。",
    opts: [
      { t: "带头留下，稳住队伍", eff: { TEAM: 8, status: 6, money: -10 }, res: "你在群里发了句“先打完这个赛季”。没人回复，但第二天训练赛，五个人一个都没少。" },
      { t: "联系下家，先给自己找退路", eff: { money: 6, TEAM: -5 }, risk: { stat: "FAME", dc: 12, ok: "有一支重建中的队伍愿意接你，位置和薪水都谈得不错。", fail: "消息走漏了，队里气氛彻底散了。", bonus: { TEAM: -4 } } },
      { t: "找联盟，问有没有托管方案", eff: { GAME: 3, status: 3, coach: 2 }, res: "联盟回复得很快：会有托管，工资有保障。你把邮件转到群里，配了个“稳了”。" }
    ]
  },
  {
    id: "end_body_check", cat: "life", w: 9, once: false, yearMin: 5,
    req: { stage: ["LPL"] },
    text: "体检报告出来了：颈椎曲度变直，视力下降，体脂率比去年高五个点。医生在报告上写了一行字：建议减少久坐。",
    sub: "你是职业选手。你的工作就是久坐。",
    opts: [
      { t: "请私教，认真练", eff: { PHYS: 8, money: -6, energy: -8 }, res: "私教是个退役举重运动员，第一次课就让你做了四十个深蹲。第二天你连楼梯都下不去。" },
      { t: "先不管，比赛重要", eff: { PHYS: -5, MECH: 2 }, res: "你把报告塞进抽屉。赛季还长，身体的事，打完再说。" },
      { t: "改作息，十一点断网", eff: { PHYS: 5, MENTAL: 4, energy: 6 }, res: "你把手机放在客厅充电。第一周睡不着，第二周开始，早上醒来的时候居然不困了。" }
    ]
  },
  {
    id: "end_fan_letter", cat: "media", w: 8, once: true, yearMin: 4,
    req: { stage: ["LPL"] },
    text: "基地前台给你一个信封。里面是一张 2018 年的票根，和一张手写的纸：“我从你打 LDL 的时候就开始看你。谢谢你还在打。”",
    sub: "字迹很用力，纸都划破了。",
    opts: [
      { t: "回信，把票根裱起来", eff: { MENTAL: 6, FAME: 3, fans: 20000 }, res: "你写了整整两页。写完发现，你其实是在给自己写。" },
      { t: "在赛后采访提了一句", eff: { FAME: 4, morale: 6 }, res: "你说“谢谢那个从 LDL 就看我的人”。弹幕刷了一整屏的“是我是我”。" },
      { t: "把票根放进护腕里", eff: { MENTAL: 4, burst: 10 }, res: "护腕里多了一张硬纸片。每次上场，你都会下意识摸一下。" }
    ]
  },
  {
    id: "end_coach_hat", cat: "team", w: 8, once: true, yearMin: 5,
    req: { stage: ["LPL"] },
    text: "教练组找你谈话：想让你兼任一部分指挥和 BP，理由是“你比我们更懂场上”。",
    sub: "这话听着像升职，也可能是在给你找退路。",
    opts: [
      { t: "接，边打边带", eff: { GAME: 5, TEAM: 5, coach: 6, PHYS: -4 }, res: "你开始每天多看两小时录像。队友说你变啰嗦了，但你叫的每一波团，基本都赢了。" },
      { t: "不接，我还是只管打", eff: { MECH: 3, coach: -3 }, res: "你说我还没准备好转教练。教练点点头，把战术板收回去了。" },
      { t: "接，但要话语权", eff: { status: 5, coach: -1, GAME: 4 }, risk: { stat: "TEAM", dc: 13, ok: "你拿到了人员建议权。第一件事是把那个摆烂的替补按到替补席。", fail: "教练组觉得你在抢权，接下来半个月的会议都没叫你。", bonus: { coach: -5 } } }
    ]
  },
  {
    id: "end_old_rival", cat: "match", w: 9, once: false, yearMin: 4,
    req: { stage: ["LPL"] },
    text: "对面中单是你 LDL 时期的老队友。赛前握手的时候，他低声说了句：“还打得动吗？”",
    sub: "你们那年一起被 0-2 淘汰，第二年他去了 LPL，你留在了 LDL。",
    opts: [
      { t: "比赛里回答他", eff: { MENTAL: 4, burst: 15 }, risk: { stat: "LANE", dc: 13, ok: "你单杀了他两次。赛后他拍了拍你的肩，说你是真没老。", fail: "你被他单杀，赛后他笑着说“我就问问”。", bonus: { MENTAL: -3 } } },
      { t: "笑着说打不动了", eff: { MENTAL: 2, FAME: 2 }, res: "他说“那你还赢我”，然后走了。你想了半天，没想出怎么回。" },
      { t: "请他吃夜宵，聊到三点", eff: { TEAM: 2, MENTAL: 5, money: -1 }, res: "你们在烧烤摊聊到凌晨三点。他说他可能要退役了，你说我也是。然后两个人一起说：再打一年。" }
    ]
  },
  {
    id: "end_year_ritual", cat: "life", w: 7, once: false, yearMin: 4,
    req: { stage: ["LPL"] },
    text: "又到十一月。基地楼下的那家便利店换了第三任老板，你还在打。",
    sub: "你算了算，这已经是第五个年头了。",
    opts: [
      { t: "给自己立个规矩：今年只练一个新英雄", eff: { POOL: 5, MENTAL: 3 }, res: "你选了那个最丑的，练了一整个休赛期。开赛第一场就拿出来，赢了。" },
      { t: "请全队吃一顿", eff: { TEAM: 6, money: -3, morale: 4 }, res: "十七个人吃了一万多。老板说这顿饭算他的，你抢着付了，说这可能是最后一次了。" },
      { t: "一个人去网吧打一夜", eff: { MECH: 3, PHYS: -3, MENTAL: 4 }, res: "你开了个多小时机，旁边小孩问你玩不玩排位。你说玩。你们双排了一夜，他没认出你是谁。" }
    ]
  }
];
