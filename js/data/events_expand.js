/* 《登神》扩充事件池 · 通用随机事件（P1 肉鸽扩容） */
window.DATA_EVENTS_EXTRA = [
  {
    id: "ev_x_kr_crush_three", cat: "training", w: 12, once: false, year: 0,
    text: "凌晨两点，韩服连续三把撞到同一个 ID。第三把他换了英雄，还是压了你 40 刀。",
    sub: "他的主页写着：无业，今日在线 14 小时。",
    opts: [
      { t: "加好友，约一场实战", eff: { GAME: 3, energy: -8, MENTAL: -2 },
        res: "他秒接，打了七把，你赢一把。最后他说：你补刀太贪，第 11 分钟那波不该回来。",
        risk: { stat: "GAME", dc: 13, ok: "你连赢两把。他问你是哪个队的，你说 LDL，他回了句「那你还挺闲」。", bonus: { GAME: 2 } } },
      { t: "举报他开脚本", eff: { MENTAL: 2, morale: -2, FAME: -1 }, res: "客服回了模板话术。两天后他还在排，签名改成了：被 LDL 的举报过。", risk: null },
      { t: "关电脑睡觉", eff: { energy: 14, GAME: -1 }, res: "你躺下就睡过去了。第二天看战绩，他打到早上七点，上了 200 分。", risk: null }
    ]
  },
  {
    id: "ev_x_cs_drill_100", cat: "training", w: 12, once: false, year: 0,
    text: "自定义补刀，十分钟 107 刀。你练到第 14 次，还是 96。",
    sub: "训练室的空调声比键盘声大。",
    opts: [
      { t: "再练二十次", eff: { MECH: 4, energy: -12, morale: -2 }, res: "第 31 次，104 刀。手背有点麻，但那一刻训练室很安静。", risk: null },
      { t: "改成练换血", eff: { LANE: 3, MECH: 1 }, res: "补刀还是 96。你学会了在第四波兵之前抢到二级。", risk: null },
      { t: "去问教练要标准", eff: { coach: 2, GAME: 2, energy: -2 }, res: "教练说：职业不是 107 刀，是 107 刀还能看着小地图。你没全听懂，但记下了。", risk: null }
    ]
  },
  {
    id: "ev_x_vod_2am", cat: "training", w: 11, once: false, year: 0,
    text: "凌晨一点四十，教练发来一个 40 分钟的录像，附了 27 条批注。",
    sub: "最后一条：第 31 分钟你在干嘛？",
    opts: [
      { t: "一条条看完", eff: { GAME: 4, energy: -14 }, res: "第 31 分钟你在回城买装备，慢了 4 秒。这一段你倒回去看了六遍。", risk: null },
      { t: "只看最后三条", eff: { GAME: 1, energy: 8, coach: -2 }, res: "第二天他问第 9 条批注什么意思，你说没看到。他没再问，把文件又发了一遍。", risk: null },
      { t: "回他：明天当面讲", eff: { coach: 3, GAME: 2, energy: 4 }, res: "早上七点他在会议室等你，白板上画了半小时的线，画完自己擦掉了。", risk: null }
    ]
  },
  {
    id: "ev_x_three_champs", cat: "training", w: 10, once: false, year: 0,
    text: "你的英雄池深三格：阿卡丽、塞拉斯、岩雀。对面第一轮 ban 掉两个。",
    sub: "解说在台上说：他只剩一个能打的了。",
    opts: [
      { t: "硬掏第四手", eff: { burst: 5, MENTAL: 2, POOL: 1 },
        res: "你锁了从没在比赛里用过的英雄。前十分钟被单杀两次，后面一波团拿了三个人头。",
        risk: { stat: "MECH", dc: 13, ok: "你的第四手打穿了对面上路。赛后 BP 截图被拆解了一整天。", bonus: { POOL: 3, FAME: 2 } } },
      { t: "用最熟的那个", eff: { GAME: 2, LANE: 1, FAME: -1 }, res: "你拿了阿卡丽，被三个人盯着。至少没崩，也没赢。", risk: null },
      { t: "让教练换体系", eff: { TEAM: 2, coach: 1, GAME: -1 }, res: "体系改成四保一。你打了 41 分钟的工具人，补刀 210，全场最低。", risk: null }
    ]
  },
  {
    id: "ev_x_scrim_0_7", cat: "training", w: 11, once: false, year: 0,
    text: "训练赛 0 比 7。第七把结束，语音里没人说话，只有键盘敲到底的声音。",
    sub: "对面是季后赛队伍。教练说这场约得值。",
    opts: [
      { t: "先说一句我的", eff: { TEAM: 3, MENTAL: -2 }, res: "你认了。打野跟着认了一句。语音里终于有人开口，然后有人笑了。", risk: null },
      { t: "关麦，自己复盘", eff: { GAME: 3, TEAM: -3 }, res: "你把七把的死亡回放全看了一遍。第二天训练赛，队友发现你不怎么讲话了。", risk: null },
      { t: "约他们再打七把", eff: { TEAM: 2, GAME: 2, energy: -16 }, res: "对面教练回：你们不累？打到第六把，你们赢了两把，第七把他们没打，说有事。", risk: null }
    ]
  },
  {
    id: "ev_x_patch_nerf_sig", cat: "training", w: 10, once: false, year: 0,
    text: "版本更新，你的招牌被砍了 20 点基础伤害。韩服胜率一夜掉了 4 个点。",
    sub: "群里有人发了张表格，标题是《谁被砍得最狠》。",
    opts: [
      { t: "连夜练新的", eff: { POOL: 3, MECH: 1, energy: -12 }, res: "你练到四点，新英雄的技能 CD 记混了两次。第二周，胜率回来了。", risk: null },
      { t: "继续用老英雄", eff: { MECH: 2, GAME: -2, MENTAL: 2 }, res: "你用旧手感打了两周，多输了四把。数据组把曲线发给了教练，教练没转给你。", risk: null },
      { t: "问对面怎么应对", eff: { GAME: 2, LANE: 1, energy: -4 }, res: "你私信了一个常对线的选手。他回：我们也难受。然后你们讨论了两小时符文。", risk: null }
    ]
  },
  {
    id: "ev_x_mouse_grip", cat: "training", w: 10, once: false, year: 0,
    text: "队里统一换了新鼠标，比上一代轻 12 克。你练了两小时，技能总是偏半格。",
    sub: "后勤说这批货只剩这一款，别的要等下个月。",
    opts: [
      { t: "硬适应新的", eff: { MECH: 3, morale: -3, energy: -6 }, res: "第十天准度回来了。前九天你在排位里掉了 180 分。", risk: null },
      { t: "用自己那把旧的", eff: { MECH: 1, FAME: -2, coach: -2 }, res: "你把旧鼠标从箱子里翻出来。后勤看了你一眼，什么都没说，把新的收走了。", risk: null },
      { t: "买同款二手", eff: { money: -0.3, MECH: 2 }, res: "闲鱼 260，卖家说用过三个月。你摸到那个磨砂面，手一下就稳了。", risk: null }
    ]
  },
  {
    id: "ev_x_comm_silence", cat: "training", w: 11, once: false, year: 0,
    text: "教练把五个人的麦克风录音剪成一段，放给你听。里面有 60 秒，没有一个人报信息。",
    sub: "他说：这不是操作问题。",
    opts: [
      { t: "主动学指挥", eff: { GAME: 3, TEAM: 2, energy: -10 }, res: "你开始每波团前喊三句。第三周，队友开始接你的话。", risk: null },
      { t: "让打野来指挥", eff: { TEAM: 2, GAME: 1, status: -2 }, res: "打野接了。他声音比你大，节奏也更快，只是有时候太急。", risk: null },
      { t: "照旧，靠操作打", eff: { MECH: 3, TEAM: -3 }, res: "你们靠个人能力又赢了两个 BO3。到季后赛，这套不管用了。", risk: null }
    ]
  },
  {
    id: "ev_x_rank_floor", cat: "training", w: 10, once: false, year: 0,
    text: "大号掉了 300 分，从王者掉到钻一。你的小号还在王者，一把没输。",
    sub: "经理路过看了一眼，说：这个号别打了。",
    opts: [
      { t: "继续打这个号", eff: { MECH: 2, morale: -2, MENTAL: 1 }, res: "你一分一分打回来，用了 11 天。第 11 天凌晨你在语音里骂了一句，然后退了游戏。", risk: null },
      { t: "换小号打", eff: { FAME: 1, MECH: 1, morale: 2 }, res: "小号上分很顺。只是你知道，那不是你在被针对。", risk: null },
      { t: "一天只打三把", eff: { GAME: 2, energy: 6, MECH: -1 }, res: "你掐着时间打。分数没涨多少，睡眠好了一点，教练注意到了。", risk: null }
    ]
  },
  {
    id: "ev_x_wave_lesson", cat: "training", w: 10, once: false, year: 0,
    text: "教练在白板上画了三条线，说：这三波兵，你今年全推错了。",
    sub: "会议室只剩你和那块白板，板擦上全是灰。",
    opts: [
      { t: "让他一堂课讲完", eff: { GAME: 4, coach: 3, energy: -8 }, res: "他讲到十二点。你记了七页，回房间发现有一页记反了。", risk: null },
      { t: "回去自己看录像", eff: { GAME: 2, energy: -4 }, res: "你看了三个小时兵线，眼睛发干。第二天训练赛，你推对了两次。", risk: null },
      { t: "问他能不能换个思路", eff: { POOL: 2, GAME: 1, coach: -1 }, res: "他愣了一下说也行。你花了一周去理解打野的刷野路线，中路丢了两把。", risk: null }
    ]
  },
  {
    id: "ev_x_karaoke", cat: "team", w: 10, once: false, year: 0,
    req: { stage: ["LDL"] },
    text: "LDL 常规赛收官那周，经理订了 KTV，人均 80，包厢名字叫「王者峡谷」。",
    sub: "桌上两箱啤酒，和一瓶没人开的可乐。",
    opts: [
      { t: "唱一首，跑调也行", eff: { TEAM: 4, morale: 3, energy: -4 }, res: "你唱了《海阔天空》。副歌全队跟着吼，隔壁包厢敲了三次墙。", risk: null },
      { t: "坐角落喝可乐", eff: { TEAM: -2, energy: 6, MENTAL: 2 }, res: "你听他们唱到两点。散场上单搂着你说：你人挺好，就是太闷。", risk: null },
      { t: "提前回基地打排位", eff: { MECH: 2, TEAM: -3, coach: 1 }, res: "你回去打了四把。教练在楼下抽烟，看见你说：这个点还在？", risk: null }
    ]
  },
  {
    id: "ev_x_jersey_number", cat: "team", w: 9, once: false, year: 0,
    text: "队服印号，后勤让你挑一个。11 号被上单占了，1 到 100 随便选。",
    sub: "他说：别挑 4，以前有人挑完就伤了。",
    opts: [
      { t: "挑 07", eff: { FAME: 2, morale: 2 }, res: "你挑了 07。有人说这号看着像替补，你没解释。", risk: null },
      { t: "跟上单换个号", eff: { TEAM: 2, FAME: -1 }, res: "他答应得很快，条件是你请他吃一周早饭。第二天你起晚了。", risk: null },
      { t: "让他们随便印", eff: { TEAM: 1, FAME: -1, status: -1 }, res: "印出来是 63 号，位置有点歪。摄影师问要不要重拍，你说不用。", risk: null }
    ]
  },
  {
    id: "ev_x_bench", cat: "team", w: 11, once: false, year: 0,
    text: "大名单出来了，首发中单不是你。教练说你最近状态起伏。",
    sub: "你在基地门口站了十分钟，才想起来没带门禁卡。",
    opts: [
      { t: "每天加练到三点", eff: { MECH: 3, GAME: 2, energy: -20, morale: -3 }, res: "你练到第三周，首发在比赛里被单杀四次。教练还是没换人。", risk: null },
      { t: "找教练要说法", eff: { coach: -3, MENTAL: 2, status: 1 }, res: "他说：你打得比他好，但他比我听话。你听完笑了，笑完没说话。", risk: null },
      { t: "趁机休整", eff: { energy: 16, morale: 3, MECH: -1, status: -2 }, res: "你睡了两天，把手腕养了一个月。首发输了三场之后，名单上又出现了你。", risk: null }
    ]
  },
  {
    id: "ev_x_captain_transfer", cat: "team", w: 9, once: true, year: 0,
    text: "老队长要走。走之前他把队群的群主转给了你。",
    sub: "他说：别让他们散了。",
    opts: [
      { t: "接下来", eff: { status: 4, TEAM: 2, MENTAL: -3 }, res: "第一个月你处理了七次吵架、两次借钱、一次有人凌晨三点还没回基地。", risk: null },
      { t: "转给打野", eff: { TEAM: 1, status: -2, coach: -2 }, res: "打野接了，第二天就在群里发了一长段话。有人退了群，又被人拉回来。", risk: null },
      { t: "交给经理管", eff: { coach: -3, status: -1, morale: 2 }, res: "经理第一件事是解散旧群，建了个新的。老队长在旧群里发了一个句号。", risk: null }
    ]
  },
  {
    id: "ev_x_blame_in_scrim", cat: "team", w: 11, once: false, year: 0,
    text: "训练赛第三把，打野在你旁边说了句：这波你为什么不跟。",
    sub: "耳机里四个人都听得见。",
    opts: [
      { t: "当场回他", eff: { TEAM: -3, GAME: 2, burst: 4 },
        res: "你回了一句更狠的。他关麦了，剩下的 20 分钟一句话没讲。",
        risk: { stat: "GAME", dc: 12, ok: "你把回放调出来，一帧一帧讲给他听。他看完说：行，是我。", bonus: { TEAM: 3 } } },
      { t: "认下来", eff: { TEAM: 2, MENTAL: -3 }, res: "你说了句我的。后面三把他一直给你让线，让得你很不舒服。", risk: null },
      { t: "赛后单独找他", eff: { TEAM: 3, coach: 1, energy: -4 }, res: "你们在楼下便利店门口聊了四十分钟。他说他家里最近有点事，你才知道。", risk: null }
    ]
  },
  {
    id: "ev_x_dorm_move", cat: "team", w: 9, once: false, year: 0,
    text: "基地换楼，从六楼搬到二楼。你的床垫被雨淋了一半，后勤说晒晒就行。",
    sub: "新房间没窗，隔壁是机房，风扇整夜响。",
    opts: [
      { t: "自己买张床垫", eff: { money: -0.5, energy: 10, PHYS: 2 }, res: "399 的床垫，睡第一晚就睡到了中午。磨砂袋子还在门口堆着。", risk: null },
      { t: "跟后勤反映", eff: { coach: 1, status: -1, energy: -6 }, res: "后勤说下周处理。你在没窗的房间住了一个月，嗓子一直是干的。", risk: null },
      { t: "跟队友换房", eff: { TEAM: 2, PHYS: -2, status: 1 }, res: "上单把他那间让给你，条件是你帮他带一周早饭。你答应了，起晚了两次。", risk: null }
    ]
  },
  {
    id: "ev_x_group_no_reply", cat: "team", w: 11, once: false, year: 0,
    text: "你在群里发了句「今晚十点加练」，半小时，一个人没回。",
    sub: "打野发了个表情包，一个躺着的人。",
    opts: [
      { t: "自己去练", eff: { MECH: 3, TEAM: -2, morale: -2 }, res: "十点你到训练室，只有你一个人。练到一点半，回房间看见打野在打手游。", risk: null },
      { t: "点外卖等他们", eff: { money: -0.4, TEAM: 3, morale: 2 }, res: "五份炒饭。十一点人陆续下来，吃得比练得多，但都坐到了两点。", risk: null },
      { t: "把消息撤回", eff: { TEAM: 2, status: -2, morale: -2 }, res: "你撤回了。第二天没人提。后来你看见上单在另一个群里问：昨晚谁要加练？", risk: null }
    ]
  },
  {
    id: "ev_x_role_swap", cat: "team", w: 9, once: false, year: 0,
    text: "上单手腕肿了，教练让你去上路顶两场。你上一次打上路是三年前。",
    sub: "他说：就两场，输了算我的。",
    opts: [
      { t: "顶", eff: { POOL: 3, GAME: 1, energy: -8, status: 2 },
        res: "第一场你被压了 60 刀。第二场你选了个坦克，赢了。",
        risk: { stat: "LANE", dc: 12, ok: "你用四场里最难看的数据赢了比赛。队友说：没想到你上路这么稳。", bonus: { POOL: 2, TEAM: 2 } } },
      { t: "拒绝，专心中路", eff: { coach: -3, MECH: 2, status: -1 }, res: "教练自己上了。他打完说：我上一次打比赛是 2019 年。", risk: null },
      { t: "推荐青训顶上", eff: { coach: 2, TEAM: 1, FAME: -1 }, res: "青训上了，被打崩了。回来他说：谢谢哥。你不太敢看他的眼睛。", risk: null }
    ]
  },
  {
    id: "ev_x_weibo_draft", cat: "media", w: 11, once: false, year: 0,
    text: "赛前你写了条微博，存了三天草稿。最后一句是「我只想赢」。",
    sub: "草稿箱显示：已保存 3 天。",
    opts: [
      { t: "发出去", eff: { FAME: 3, haters: 800, MENTAL: 2 }, res: "两小时后 800 条评论。最高赞是：先赢一场再说。", risk: null },
      { t: "全删了", eff: { MENTAL: 2, FAME: -1 }, res: "你删完又去回收站看了一眼，找不回来了。", risk: null },
      { t: "只发一张训练图", eff: { FAME: 1, fans: 300, MENTAL: 1 }, res: "评论区有人说：这是在暗示什么吗。你没想到这也能被解读。", risk: null }
    ]
  },
  {
    id: "ev_x_interview_scripted", cat: "media", w: 11, once: false, year: 0,
    text: "赛后采访，工作人员在耳返里说：等下别说队友，就说我们自己没打好。",
    sub: "你刚输了 0 比 2，麦克风有点凉。",
    opts: [
      { t: "照稿说", eff: { FAME: 1, MENTAL: -2, coach: 2 }, res: "你说了句「我们还需要磨合」。弹幕刷：官话。", risk: null },
      { t: "说实话", eff: { FAME: 4, haters: 1200, TEAM: -3 }, res: "你说中路那波是沟通失误。队友在后台看直播，谁都没讲话。", risk: null },
      { t: "只说一句谢谢", eff: { MENTAL: 2, FAME: -2 }, res: "你说了句谢谢大家就走了。导播愣了一下，切了广告。", risk: null }
    ]
  },
  {
    id: "ev_x_danmaku_photo", cat: "media", w: 9, once: false, year: 0,
    text: "直播弹幕里有人发了张照片，是你家小区门口那家便利店。",
    sub: "配了一句：哥，我昨天在这儿看见你了。",
    opts: [
      { t: "当没看见", eff: { MENTAL: -3, FAME: 1 }, res: "你打完那把才下播。回房间你把窗帘拉上了，第一次觉得它有点薄。", risk: null },
      { t: "回一句：别拍了", eff: { FAME: 2, haters: 600, MENTAL: 1 }, res: "你说完弹幕炸了一下。有人说你耍大牌，也有人说本来就该说。", risk: null },
      { t: "下播，联系俱乐部", eff: { coach: 2, MENTAL: 1, energy: -4 }, res: "俱乐部发了条声明。第二天你去门口拿外卖，下意识看了一眼身后。", risk: null }
    ]
  },
  {
    id: "ev_x_doc_crew", cat: "media", w: 9, once: false, year: 0,
    text: "纪录片摄制组来了三个人，要在基地住两周。他们说：你们不用管我们。",
    sub: "摄像机的红灯一直亮着。",
    opts: [
      { t: "照常生活", eff: { FAME: 3, MENTAL: -2, energy: -4 }, res: "两周后你习惯了那个红灯。片子上线，你吃饭的样子被拍了 40 秒。", risk: null },
      { t: "配合拍点好的", eff: { FAME: 5, energy: -10, MECH: -1 }, res: "一个镜头你练了三遍。成片里那段很燃，只有你知道那是第几遍。", risk: null },
      { t: "不让他们进训练室", eff: { coach: 1, FAME: -1, TEAM: 2 }, res: "导演不太高兴，但答应了。成片里训练室那段是空镜配音。", risk: null }
    ]
  },
  {
    id: "ev_x_fans_gift", cat: "media", w: 10, once: false, year: 0,
    text: "前台堆了一箱快递，收件人写的是你的 ID。拆开是手写信、辣条，和一条手织的围巾。",
    sub: "信上写：我从初三开始看你打。",
    opts: [
      { t: "回一封手写信", eff: { FAME: 2, fans: 800, energy: -4, MENTAL: 2 }, res: "你写了三页，字很难看。她把照片发在超话说哭了一晚上。", risk: null },
      { t: "拍张照发微博", eff: { FAME: 3, fans: 1500, MENTAL: 1 }, res: "你把围巾戴上了。评论区问：这是女朋友织的吗。你没回。", risk: null },
      { t: "让前台统一处理", eff: { MENTAL: -1, FAME: -1 }, res: "前台把东西收进仓库。三个月后你路过，那条围巾还在箱子里。", risk: null }
    ]
  },
  {
    id: "ev_x_hupu_thread", cat: "media", w: 11, once: false, year: 0,
    text: "虎扑有个帖子：《这个中单到底行不行》，已经 400 多楼。",
    sub: "楼主贴了你三场比赛的伤害占比。",
    opts: [
      { t: "从第一楼看到最后", eff: { MENTAL: -4, energy: -6, GAME: 1 }, res: "你看到三点。有个 ID 把你每波失误都标了时间戳，比教练标得准。", risk: null },
      { t: "注册小号回帖", eff: { FAME: -1, MENTAL: 2, haters: 300 }, res: "你回了两句，被人扒出 IP 段。第二天帖子里多了条：本人来了。", risk: null },
      { t: "关掉页面去排位", eff: { MECH: 3, MENTAL: 1 }, res: "你连胜六把。像是要给谁看，又好像只是手痒。", risk: null }
    ]
  },
  {
    id: "ev_x_superchat", cat: "media", w: 10, once: false, year: 0,
    text: "直播间一条 500 块的醒目留言：哥，你觉得你还能打几年？",
    sub: "这条挂在屏幕最上面，等了你三分钟。",
    opts: [
      { t: "认真回答", eff: { FAME: 3, MENTAL: -2, fans: 600 }, res: "你说不知道，能打一天算一天。弹幕安静了几秒，然后刷了一片「哥」。", risk: null },
      { t: "开玩笑带过", eff: { FAME: 1, MENTAL: 2 }, res: "你说打到 30 岁，然后去开网吧。弹幕笑了，你自己也笑了一下。", risk: null },
      { t: "让房管退他钱", eff: { FAME: -2, MENTAL: 1 }, res: "他私信问为什么。你说这问题太贵了。他回了个「行」。", risk: null }
    ]
  },
  {
    id: "ev_x_media_rank", cat: "media", w: 10, once: false, year: 0,
    text: "一家媒体出了中单排名，你在第十。评语是：稳定，但没有上限。",
    sub: "第九是个今年才上一队的新人。",
    opts: [
      { t: "截图当壁纸", eff: { burst: 6, MENTAL: 2 }, res: "你把它设成手机壁纸。每次解锁都看见那四个字：没有上限。", risk: null },
      { t: "发微博阴阳一句", eff: { FAME: 2, haters: 900, MENTAL: -2 }, res: "你写了句「稳定也是本事」。评论区说你在内涵第九名，那位第二天取关了你。", risk: null },
      { t: "去要评分标准", eff: { FAME: 1, GAME: 1, energy: -4 }, res: "对方回了一大段数据口径，你只看懂一半。里面有一条：你的分均伤害排第三。", risk: null }
    ]
  },
  {
    id: "ev_x_hot_search", cat: "media", w: 9, once: false, year: 0,
    text: "你上热搜了。词条不大，挂在第 47 位，配图是你比赛里翻白眼的 0.5 秒。",
    sub: "阅读量 1200 万，评论区在讨论你当时在看哪里。",
    opts: [
      { t: "发个自嘲表情包", eff: { FAME: 4, fans: 2000, haters: 1500 }, res: "你把那张图配上「困了」两个字发出去，转发破了万。", risk: null },
      { t: "让俱乐部发声明", eff: { FAME: -1, MENTAL: -2, coach: 2 }, res: "声明发出去，词条又挂了两个小时。有人说：越描越黑。", risk: null },
      { t: "什么都不做", eff: { MENTAL: -3, FAME: 1 }, res: "三天后词条自己掉了。你妈打电话来问：你是不是在电视上不高兴？", risk: null }
    ]
  },
  {
    id: "ev_x_brand_shoot", cat: "media", w: 10, once: false, year: 0,
    text: "赞助商要拍一组图，占掉整个休赛日。脚本里，你得笑着举一罐饮料。",
    sub: "摄影师说：再来一次，这次自然一点。",
    opts: [
      { t: "拍完，拿钱", eff: { money: 10, FAME: 3, energy: -14 }, res: "你笑了 60 次。钱到账那天你请全队吃火锅，单子拍给经理看，他说下次别忘了他。", risk: null },
      { t: "只拍十分钟就走", eff: { MECH: 2, coach: -2, FAME: -1 }, res: "你拍完就回训练室。品牌方给经理打了电话，尾款按违约条款砍了一半。", risk: null },
      { t: "推掉，去训练", eff: { MECH: 3, coach: 3, FAME: -2 }, res: "经理骂了你两天。教练在会上说：他知道自己要什么。", risk: null }
    ]
  },
  {
    id: "ev_x_press_shade", cat: "media", w: 10, once: false, year: 0,
    text: "发布会，记者问你的队友：那波团你是不是在送？他握着话筒没说话。",
    sub: "四十多个镜头对着他。",
    opts: [
      { t: "抢话筒替他答", eff: { TEAM: 4, FAME: 2, coach: -2 }, res: "你说那波是你们一起决定的。散会后他没讲话，只把水递给了你。", risk: null },
      { t: "低头看桌子", eff: { TEAM: -2, MENTAL: -2 }, res: "他自己回答了，声音很小。回酒店的大巴上，他一路戴着耳机。", risk: null },
      { t: "会后跟记者解释", eff: { FAME: 1, TEAM: 1, energy: -4 }, res: "你花了二十分钟讲那波指挥。稿子发出来只用了你一句，还不是重点。", risk: null }
    ]
  },
  {
    id: "ev_x_salary_cap", cat: "money", w: 9, once: false, year: 0,
    text: "联盟下发工资帽细则，队里三个人的合同要重签。经理把文件放你桌上，第一页第三行画了线。",
    sub: "那一行写着：超出部分按 200% 征收。",
    opts: [
      { t: "按新规签", eff: { money: -2, coach: 3, MENTAL: 1 }, res: "你签了。一年少两万。经理说：明年有钱了第一个找你。", risk: null },
      { t: "找经纪公司谈", eff: { money: 10, coach: -4, FAME: 1 }, res: "他们替你争回一截，还谈了一笔签字费。签约那天经理的笑有点僵。", risk: null },
      { t: "拖到最后一天", eff: { status: 1, MENTAL: -3, coach: -2 }, res: "你在窗口关闭前三小时签了字。队里换了两个人的位置，都不是你。", risk: null }
    ]
  },
  {
    id: "ev_x_stream_contract", cat: "money", w: 10, once: false, year: 0,
    text: "平台给的直播合同：每月 60 小时，礼物分成 45%，不够时长要扣钱。",
    sub: "最后一页写着：违约按三倍赔偿。",
    opts: [
      { t: "签", eff: { money: 10, energy: -14, FAME: 3 }, res: "第一个月你播了 72 小时，嗓子哑了三天。钱到账那天你把合同又看了一遍。", risk: null },
      { t: "只签分成不签时长", eff: { FAME: 1, coach: 1, MENTAL: 2 }, res: "平台同意了，单价低了 30%。你的直播回到每周两次，每次两小时。", risk: null },
      { t: "不签", eff: { MENTAL: 3, FAME: -2 }, res: "你说打比赛要紧。半年后同队的辅助靠直播挣了一台车。", risk: null }
    ]
  },
  {
    id: "ev_x_boost_dm", cat: "money", w: 8, once: false, year: 0,
    req: { stage: ["LDL"] },
    text: "私信有人出价：王者号代打，一段 800。他说你这样的手，一个月能挣两万。",
    sub: "头像是一辆保时捷，朋友圈全是转账截图。",
    opts: [
      { t: "接，做满这个赛季", eff: { money: 10, story: { corrupt: 2 }, MENTAL: -3, energy: -8 }, res: "五个月你打了 37 个号。有一单的号主是个初中生，聊到半夜问你：哥你怎么这么强。", risk: null },
      { t: "拉黑", eff: { MENTAL: 2, FAME: 1 }, res: "你拉黑了他。第二天另一个号又来问，报价涨到了 1000。", risk: null },
      { t: "截图交给俱乐部", eff: { coach: 3, FAME: 1, haters: 200 }, res: "俱乐部把截图报给了联盟。有人的号被封了，也有人在群里说你多事。", risk: null }
    ]
  },
  {
    id: "ev_x_friend_borrow", cat: "money", w: 10, once: false, year: 0,
    text: "初中同学发来消息：兄弟，借 5000，下周还。后面跟着三张医院的单子。",
    sub: "你们上一次说话是两年前。",
    opts: [
      { t: "转 5000", eff: { money: -0.5, MENTAL: 2, TEAM: 1 }, res: "他秒收，发来一段很长的语音。下周没还，再下周也没有。", risk: null },
      { t: "转 3000，说就这么多了", eff: { money: -0.3, MENTAL: 1 }, res: "他回了句谢谢。半年后他在同学群里说：那个打职业的，现在装不认识了。", risk: null },
      { t: "不借", eff: { MENTAL: -3, energy: -2 }, res: "你打了半句话又删了。那天晚上你一直在想那三张单子上的名字。", risk: null }
    ]
  },
  {
    id: "ev_x_car_down_payment", cat: "money", w: 9, once: false, year: 0,
    req: { minMoney: 5 },
    text: "你看中一辆二手思域，落地 11 万。销售说这个月提车能便宜 8000，明天最后一天。",
    sub: "基地到场馆打车要 40 分钟，你算过一年的车费。",
    opts: [
      { t: "付首付", eff: { money: -5, morale: 4, energy: 6 }, res: "提车那晚你在车里坐了半小时。第二周你发现停车费一个月 600。", risk: null },
      { t: "再攒一年", eff: { MENTAL: 2, GAME: 1 }, res: "你把链接存进收藏夹。三个月后那辆卖掉了，价格还涨了 3000。", risk: null },
      { t: "先租一个月开", eff: { money: -0.6, energy: 8, morale: 2 }, res: "月租 6000，你开了 28 天。还车那天算了算，比打车还贵 400。", risk: null }
    ]
  },
  {
    id: "ev_x_tax_bill", cat: "money", w: 9, once: false, year: 0,
    text: "个税汇算清缴，系统提示你补缴 2 万。去年那笔奖金是按劳务报酬算的。",
    sub: "截止日期还有 12 天。",
    opts: [
      { t: "老老实实补", eff: { money: -2, MENTAL: 2 }, res: "你在 APP 上点完，手有点抖。财务说这种事以后每年都有，习惯就好。", risk: null },
      { t: "找俱乐部报销", eff: { money: -0.5, coach: -4, status: -1 }, res: "经理说合同是税后，但不含奖金。最后队里出了一半，剩下的从下月工资扣。", risk: null },
      { t: "拖着不办", eff: { MENTAL: -4, story: { scandal: 1 } }, res: "你把 APP 关了。三个月后短信来了，滞纳金 340 块。", risk: null }
    ]
  },
  {
    id: "ev_x_parents_reno", cat: "money", w: 10, once: false, year: 0,
    text: "你妈发来两张照片：老家厨房的瓷砖裂了，说想翻修一下，预算 5 万。",
    sub: "她说：不着急，你打比赛要紧。",
    opts: [
      { t: "全出", eff: { money: -5, MENTAL: 4, morale: 3 }, res: "你转了 5 万。她发来一段视频，新瓷砖是米白色的，橱柜没换。", risk: null },
      { t: "出一半", eff: { money: -2, MENTAL: 1 }, res: "你转了 2 万。我妈说够了够了。后来表妹告诉你，剩下的是借的。", risk: null },
      { t: "等这个赛季结束", eff: { MENTAL: -3, GAME: 1 }, res: "她回了个「好」。那个赛季你没进季后赛，回家发现瓷砖还是裂的。", risk: null }
    ]
  },
  {
    id: "ev_x_prize_split", cat: "money", w: 9, once: false, year: 0,
    text: "亚军奖金到账，队里按出场率分。你打了 62% 的比赛，拿到的比替补多不了多少。",
    sub: "财务把表格发在群里，谁都能看见。",
    opts: [
      { t: "在群里问一句", eff: { TEAM: -3, status: 1, coach: -1 }, res: "你问了分配依据。经理回了一长段。替补在下面发了个「哦」。", risk: null },
      { t: "私下找经理", eff: { money: 10, coach: -3, TEAM: -1 }, res: "他给你补了 10 万，走的是下赛季预付款。他说：别让第三个人知道。", risk: null },
      { t: "算了", eff: { TEAM: 2, MENTAL: -3, morale: -2 }, res: "你没说话。第二天训练赛，你打得像在还债。", risk: null }
    ]
  },
  {
    id: "ev_x_invest_tip", cat: "money", w: 8, once: false, year: 0,
    text: "一个退役的前辈拉你进群，说有个项目年化 18%，他自己投了 30 万。",
    sub: "群里每天有人晒收益截图，截图上的时间都是凌晨。",
    opts: [
      { t: "投 5 万试试", eff: { money: -5, MENTAL: -2 }, res: "前三个月每月返 750。第四个月，群解散了。", risk: null },
      { t: "只投 5000", eff: { money: -0.5, MENTAL: -1 }, res: "两个月返了 150。第三个月提现失败，客服头像变成了灰色。", risk: null },
      { t: "退群", eff: { MENTAL: 2, FAME: -1 }, res: "你退了。半年后新闻里出现那个项目的名字，涉案两个亿，前辈也在名单上。", risk: null }
    ]
  },
  {
    id: "ev_x_gift_income", cat: "money", w: 10, once: false, year: 0,
    text: "直播礼物结算，三个月一共一万六。榜一那位刷了 8000，头像是空白的。",
    sub: "公会的人说这种号一般是老板的小号。",
    opts: [
      { t: "私信谢他", eff: { FAME: 2, fans: 400, haters: 200 }, res: "他回了句：别客气，你打得好。你点进他主页，什么都没有。", risk: null },
      { t: "直播时念一遍榜", eff: { FAME: 1, fans: 600, energy: -4 }, res: "你念了十几个 ID。第二天榜一换人了，新来的刷了一万。", risk: null },
      { t: "关掉榜单", eff: { MENTAL: 3, FAME: -1 }, res: "礼物特效还在飘，你只是打你的排位。下播前那条空白头像发来一个「晚安」。", risk: null }
    ]
  },
  {
    id: "ev_x_transfer_call", cat: "market", w: 10, once: false, year: 0, months: [11, 12],
    text: "转会期第一天，一个陌生号码打来：我们是 XX 战队，想跟你聊聊。德杯还有三周。",
    sub: "对方报的价，是你现在的一倍半。",
    opts: [
      { t: "去谈", eff: { money: 15, FAME: 4, TEAM: -3 }, res: "谈得很好。消息走漏了，老东家把你的名字从德杯名单上划掉，换了个二队的。", risk: null },
      { t: "先问教练", eff: { coach: 4, TEAM: 2, MENTAL: 2 }, res: "教练说：你想走我不拦，但再等一年，我们这套能打出来。你留下了。", risk: null },
      { t: "挂掉", eff: { MENTAL: 3, FAME: -2 }, res: "你挂了。第二年那个队拿了季军，中单是和你同期的另一个人。", risk: null }
    ]
  },
  {
    id: "ev_x_tryout", cat: "market", w: 11, once: false, year: 0,
    text: "一支 LPL 队约你试训，三天，包住不包路费。他们说：打得好就签。",
    sub: "地址发过来，那个基地你打车去过一次，是送朋友。",
    opts: [
      { t: "去", eff: { energy: -16, GAME: 3, FAME: 3, money: -0.3 },
        res: "三天打了 14 场。最后一场你赢了，教练说：你先回去等消息。",
        risk: { stat: "GAME", dc: 13, ok: "试训第三天他们让你和首发中单对练，你赢了两把。经理当场拿出了合同。", bonus: { FAME: 4, money: 10 } } },
      { t: "要求先给承诺", eff: { FAME: -2, coach: 1, MENTAL: 2 }, res: "对方沉默了几秒，说那就算了。你在基地楼下便利店坐到天黑。", risk: null },
      { t: "让经纪公司代谈", eff: { money: 10, coach: -2, status: -1 }, res: "经纪公司谈了个不错的价。你到队第一天，队友都知道你是「谈出来的」。", risk: null }
    ]
  },
  {
    id: "ev_x_overseas_mail", cat: "market", w: 8, once: false, year: 0,
    text: "一封英文邮件，来自一个你没听过的赛区。月薪 6000 美元，一年合同。",
    sub: "附件里有一张基地照片，墙是白的，没有一张海报。",
    opts: [
      { t: "回信细聊", eff: { money: 18, FAME: 2, MENTAL: -3, energy: -8 }, res: "视频面试 40 分钟，对方最后问你会不会做饭。你说会，他们说那就好。", risk: null },
      { t: "礼貌拒绝", eff: { MENTAL: 3, GAME: 1 }, res: "你回了句 thank you。第二天又来一封，月薪改成了 7500。", risk: null },
      { t: "转给队友", eff: { TEAM: 3, FAME: 1, coach: 1 }, res: "队友去了。半年后他发来一张照片，宿舍窗外是一片空地，什么都没有。", risk: null }
    ]
  },
  {
    id: "ev_x_renew_squeeze", cat: "market", w: 10, once: false, year: 0, months: [11, 12],
    text: "续约谈判，经理把合同推过来：数字比去年低 40%，理由是没进世界赛。",
    sub: "他说队里明年想签个韩援，钱得从这儿挤。笔在桌上，他没递给你。",
    opts: [
      { t: "签", eff: { money: 10, coach: 3, MENTAL: -3 }, res: "你签得很干脆。回去的路上你想：明年得打进去，不然白忍一年。", risk: null },
      { t: "加绩效条款再签", eff: { coach: -2, GAME: 2, MENTAL: 2 },
        res: "你把条款一条条念给他听，他中途接了两个电话。",
        risk: { stat: "GAME", dc: 13, ok: "他被你说服了，把进世界赛翻倍的条款写进合同，还加了一笔签字费。", bonus: { money: 15 } } },
      { t: "不签，进自由市场", eff: { FAME: 2, MENTAL: -4, status: -2 }, res: "你成了自由人。一个月里接到两个电话，一个来自 LDL，另一个打错了。", risk: null }
    ]
  },
  {
    id: "ev_x_agency", cat: "market", w: 9, once: false, year: 0,
    text: "一家经纪公司找上门，说能帮你接商务、谈合同，抽成 15%。",
    sub: "他们发来客户名单，前三个名字你都认识。",
    opts: [
      { t: "签三年", eff: { money: 12, FAME: 3, coach: -1 }, res: "他们确实接了两个商务，第二个是卖鞋。你穿着那双鞋播了一整场。", risk: null },
      { t: "只签一年", eff: { FAME: 1, MENTAL: 2, coach: 1 }, res: "一年里他们帮你多接了两个代言。到期那天他们说：你太保守了。", risk: null },
      { t: "不签，自己谈", eff: { money: -1, MENTAL: 2, FAME: -1 }, res: "你谈的第一个商务，报价低了 4 万，对方一口就答应了。", risk: null }
    ]
  },
  {
    id: "ev_x_rival_dinner", cat: "market", w: 8, once: false, year: 0,
    text: "同城那支队的人约你吃饭，地点在离你们基地两公里的烤肉店。",
    sub: "他说：就当朋友聚聚，不谈工作。",
    opts: [
      { t: "去", eff: { GAME: 1, FAME: 1, TEAM: -2 },
        res: "吃到一半他开始讲他们的体系。回去教练问你去了哪，你说见了个朋友。",
        risk: { stat: "MENTAL", dc: 12, ok: "你什么都没说，只听。他讲到一半自己停了，说：你比我想的能沉住气。", bonus: { GAME: 2, MENTAL: 2 } } },
      { t: "推掉", eff: { TEAM: 2, coach: 1, FAME: -1 }, res: "你回了句改天。他发了个笑脸。三个月后他转会了，去了那支队。", risk: null },
      { t: "告诉经理", eff: { coach: 4, status: 1, FAME: -2 }, res: "经理把这事报给了联盟。那个队被罚了款，圈里也有人说你不够意思。", risk: null }
    ]
  },
  {
    id: "ev_x_showmatch", cat: "market", w: 9, once: false, year: 0, months: [1, 2, 11, 12],
    text: "一个平台办表演赛，出场费 10 万，打三局，全程开麦。",
    sub: "对面是四个退役选手加一个主播，那个主播的段位是大师。",
    opts: [
      { t: "去，配合效果", eff: { money: 10, FAME: 4, MECH: -1, energy: -10 }, res: "第一局你故意送了两个，弹幕笑疯。第三局你想认真赢，队友还在送。", risk: null },
      { t: "去，认真打", eff: { money: 10, FAME: 2, GAME: 2 }, res: "你 20 分钟推完，直播间气氛有点冷。主办方说下次还得请你。", risk: null },
      { t: "不去", eff: { MECH: 3, MENTAL: 2, FAME: -2 }, res: "你在训练室打了一晚上排位。第二天刷到那场的切片，播放量 300 万。", risk: null }
    ]
  },
  {
    id: "ev_x_academy_kid", cat: "market", w: 9, once: false, year: 0,
    text: "青训队有个 17 岁的中单，教练问你要不要带他一队训练。",
    sub: "他说：这孩子手比你快，脑子没你清楚。",
    opts: [
      { t: "带", eff: { TEAM: 3, coach: 3, status: -2, energy: -8 }, res: "你教他看地图，讲了三周。第四周他在训练赛里抢了你的首发位。", risk: null },
      { t: "只教操作", eff: { MECH: 1, TEAM: 1, coach: -1 }, res: "你教了他两个连招，他学得很快。关于节奏，你一个字没说。", risk: null },
      { t: "拒绝", eff: { status: 2, coach: -3, TEAM: -3 }, res: "教练没说什么。赛季末那个孩子去了别的队，第一年就打进了四强。", risk: null }
    ]
  },
  {
    id: "ev_x_rain_traffic", cat: "match", w: 10, once: false, year: 0,
    text: "比赛日下暴雨，大巴在高架上堵了 50 分钟。到场馆时，BP 已经开始倒数。",
    sub: "车窗全是水，看不清外面。",
    opts: [
      { t: "下车跑过去", eff: { energy: -14, PHYS: -2, burst: 4 }, res: "你穿着队服在雨里跑了两百米。进场时鞋在滴水，工作人员递了条毛巾。", risk: null },
      { t: "在车上闭眼", eff: { GAME: 2, energy: 4, burst: -3 }, res: "你靠着窗睡了十分钟。下车时腿有点麻，脑子是清的。", risk: null },
      { t: "打电话给联盟", eff: { coach: 2, GAME: -1, FAME: -1 }, res: "联盟同意延后 15 分钟。对面在场上多站了一刻钟，看你的眼神不太对。", risk: null }
    ]
  },
  {
    id: "ev_x_throw_game1", cat: "match", w: 11, once: false, year: 0,
    text: "第一局你们领先 8 千经济，被一波大龙团翻了。第二局开始前，休息室没人讲话。",
    sub: "教练把白板笔的盖子盖了又拔，拔了又盖。",
    opts: [
      { t: "要 counter 位", eff: { burst: 6, TEAM: 2, coach: -1 }, res: "第二局你压了对面 30 刀。第三局他们第一个 ban 给了那个英雄。", risk: null },
      { t: "不说话，喝水", eff: { MENTAL: -2, GAME: 1 }, res: "你喝了半瓶水。第二局开局 4 分钟，你又被抓了一次。", risk: null },
      { t: "把锅背上", eff: { TEAM: 3, MENTAL: -3, spirit: -3 }, res: "你说大龙那波是你的问题。队友松了口气。你自己知道不是。", risk: null }
    ]
  },
  {
    id: "ev_x_baron_call", cat: "match", w: 11, once: false, year: 0,
    text: "31 分钟，经济持平。语音里三个人喊大龙，两个人说要推塔。",
    sub: "大龙还有 40 秒刷。",
    opts: [
      { t: "拍板，打龙", eff: { GAME: 2, burst: 5, TEAM: 1 },
        res: "你们打了。龙剩 2000 血的时候，对面打野从三角草出来了。",
        risk: { stat: "GAME", dc: 12, ok: "你们 12 秒拿下大龙，对面赶到时只剩假眼。这波直接推掉二塔。", bonus: { GAME: 2, FAME: 2 } } },
      { t: "拍板，推塔", eff: { GAME: 3, TEAM: 2 }, res: "你们推掉中路二塔，稳住了线权。赢了，但没人觉得赢得漂亮。", risk: null },
      { t: "让他们自己定", eff: { TEAM: -3, GAME: -2, spirit: -2 }, res: "三个人冲去龙坑，两个留在中路。结果两边都没打好。", risk: null }
    ]
  },
  {
    id: "ev_x_invade_death", cat: "match", w: 10, once: false, year: 0,
    text: "开局 90 秒，你跟着打野入侵，被三个人堵在河道。交了闪还是死了。",
    sub: "弹幕刷：这个中单在干嘛。",
    opts: [
      { t: "稳住，补发育", eff: { GAME: 2, MENTAL: 1, LANE: -1 }, res: "你缩了 8 分钟，补回 40 刀。中期一波团你打掉了三个人的血条。", risk: null },
      { t: "再跟他做一次视野", eff: { TEAM: 2, GAME: 1, MENTAL: -2 }, res: "你们又去了一趟，这次抢了对面的红。打野说：这波值。", risk: null },
      { t: "问他为什么不看", eff: { TEAM: -3, burst: 3, MENTAL: -1 }, res: "他没回。之后 20 分钟，他没再来过中路一次。", risk: null }
    ]
  },
  {
    id: "ev_x_game5_hands", cat: "match", w: 10, once: false, year: 0,
    text: "BO5 第五局，你摸了摸手腕，发现手在抖，连水杯都拿不稳。",
    sub: "对面中单在座位上笑，笑得很轻松。",
    opts: [
      { t: "选最稳的英雄", eff: { GAME: 3, MENTAL: 2, burst: -4 }, res: "你选了能推线的。整局没做一次冒险操作，也没犯错。你们赢了。", risk: null },
      { t: "选刺客，赌一把", eff: { burst: 8, MENTAL: -2 },
        res: "你锁了阿卡丽。前 15 分钟被抓三次。",
        risk: { stat: "MECH", dc: 14, ok: "22 分钟一波进场，你带走了双 C。全场站起来了一半。", bonus: { FAME: 5, MECH: 2 } } },
      { t: "让教练换人", eff: { coach: -2, TEAM: -2, MENTAL: 2 }, res: "他看了你三秒，说不用。他自己也在抖，你看得出来。", risk: null }
    ]
  },
  {
    id: "ev_x_crowd_boo", cat: "match", w: 9, once: false, year: 0,
    text: "你上场的时候，观众席有一片嘘声。大屏幕正好切到你。",
    sub: "主持人说到你的 ID，后半句被嘘声盖住了。",
    opts: [
      { t: "对着镜头笑一下", eff: { FAME: 3, MENTAL: 2, haters: 600 }, res: "你笑了。第二天这张截图被配上「装」字，转了八千次。", risk: null },
      { t: "低头快走", eff: { MENTAL: -3, GAME: 1 }, res: "你走到座位戴上耳机。耳机里是白噪音，什么都听不见。", risk: null },
      { t: "用表现回应", eff: { burst: 7, MECH: 2, energy: -6 }, res: "第一局你 7-1-5。25 分钟之后，那片声音变成了别的。", risk: null }
    ]
  },
  {
    id: "ev_x_long_pause", cat: "match", w: 9, once: false, year: 0,
    text: "比赛暂停，已经 40 分钟。技术台说对面打野的设备有问题。",
    sub: "你的手开始凉了。",
    opts: [
      { t: "起来走动", eff: { energy: 8, GAME: 1 }, res: "你在通道里来回走了二十分钟。回来的时候手是热的。", risk: null },
      { t: "坐着保持手感", eff: { MECH: 2, energy: -6 }, res: "你一直点着鼠标。恢复比赛时，手是酸的。", risk: null },
      { t: "隔着舞台看他", eff: { MENTAL: 2, burst: 3, TEAM: -1 }, res: "他也在看你。你们对视了三秒，都笑了。恢复后他抓了你两次。", risk: null }
    ]
  },
  {
    id: "ev_x_highlight_1v2", cat: "match", w: 11, once: false, year: 0,
    text: "中期一波，你在三角草 1v2，血条剩 200。全场开始喊。",
    sub: "队友在语音里喊：走！走！",
    opts: [
      { t: "打", eff: { burst: 7, MECH: 2, MENTAL: 2 },
        res: "你按了技能。第一个死了，第二个还站着。",
        risk: { stat: "MECH", dc: 13, ok: "你反杀两个，剩 40 血走出去。这波进了今天集锦的第一位。", bonus: { FAME: 4, burst: 3 } } },
      { t: "交闪走", eff: { GAME: 3, MENTAL: 1, FAME: -1 }, res: "你闪进河道。弹幕说你怂，但你多活了一整波团的时间。", risk: null },
      { t: "拖住等队友", eff: { TEAM: 3, GAME: 2 }, res: "你拖了 6 秒，队友赶到，0 换 3。集锦里没有你。", risk: null }
    ]
  },
  {
    id: "ev_x_late_night_ramen", cat: "life", w: 13, once: false, year: 0,
    text: "凌晨一点半，你在基地厨房煮泡面。锅是上一个中单留下的，锅底有一圈黑。",
    sub: "水开了，你才发现调料包只有一个。",
    opts: [
      { t: "全下进去", eff: { PHYS: -3, morale: 4, energy: 6 }, res: "咸得发苦。你吃完了，连汤都喝了。", risk: null },
      { t: "加个鸡蛋", eff: { PHYS: 2, morale: 2 }, res: "冰箱里最后一个蛋。煎的时候油溅到手背上，心情反而好了点。", risk: null },
      { t: "不吃了，睡觉", eff: { PHYS: 3, morale: -2, energy: 8 }, res: "你躺下，胃在叫。隔壁机房的风扇声很规律，你就着这个节奏睡着了。", risk: null }
    ]
  },
  {
    id: "ev_x_barber", cat: "life", w: 11, once: false, year: 0,
    text: "基地楼下理发店，老板问：还是老样子？你其实记不清老样子是什么样。",
    sub: "镜子上贴着 2019 年的价目表：洗剪吹 25。",
    opts: [
      { t: "剪短", eff: { morale: 3, FAME: 1 }, res: "剪完你看起来像刚入伍。队友笑了三天，你照镜子的时候也笑。", risk: null },
      { t: "只修一下", eff: { morale: 2, FAME: -1 }, res: "老板修了十分钟。回基地没人发现你剪过头发。", risk: null },
      { t: "让他随便剪", eff: { morale: 4, FAME: 2, MENTAL: -1 }, res: "老板给你推了个寸头。第二天摄影日，造型师看着你叹了口气。", risk: null }
    ]
  },
  {
    id: "ev_x_wrist_check", cat: "life", w: 10, once: false, year: 0,
    text: "体检报告出来，右手腕轻微腱鞘炎。医生说最好休息两周。",
    sub: "下周有两场关键比赛。",
    opts: [
      { t: "休息两周", eff: { PHYS: 4, energy: 12, status: -2, coach: -2 }, res: "你休息了。替补一胜一负。手腕不疼了，你也习惯了看着别人打。", risk: null },
      { t: "打封闭继续", eff: { PHYS: -3, MECH: 2, injury: 0.04 }, res: "针扎进去的时候你看着天花板。第二天你打满了五局。", risk: null },
      { t: "改左手练意识", eff: { GAME: 2, PHYS: 1, energy: -6 }, res: "你用左手打了三天。手没养好，但你第一次看懂了打野的路线。", risk: null }
    ]
  },
  {
    id: "ev_x_stray_cat", cat: "life", w: 11, once: false, year: 0,
    text: "基地门口蹲了只黄猫，第三天它开始蹭你的裤腿。",
    sub: "保安说不能养，物业会来查。",
    opts: [
      { t: "偷偷养在阳台", eff: { morale: 4, energy: 4, MENTAL: 2 }, res: "你买了猫砂和一袋 12 斤的猫粮。它每天晚上蹲在你键盘旁边。", risk: null },
      { t: "抱去宠物医院", eff: { money: -0.3, morale: 3, FAME: 1 }, res: "检查加驱虫 380。医生说它是被扔的。你把它送去了一个朋友家。", risk: null },
      { t: "不管它", eff: { MENTAL: -2, GAME: 1 }, res: "第四天它不来了。你出门买水，习惯性往台阶下面看了一眼。", risk: null }
    ]
  },
  {
    id: "ev_x_phone_screen", cat: "life", w: 11, once: false, year: 0,
    text: "手机屏碎了，裂痕从左上角拉到右下角。你用了三个月，习惯了。",
    sub: "换屏 680，换新机首付 3000、分 12 期。",
    opts: [
      { t: "换屏，再用一年", eff: { morale: 2, MENTAL: 1 }, res: "修手机的小哥说换了跟新的一样。你顺手贴了张 9 块的膜。", risk: null },
      { t: "分期换新机", eff: { money: -0.3, morale: 3, FAME: 1 }, res: "新手机第一张照片是训练室的显示器。晚上你在设置里翻了两个小时。", risk: null },
      { t: "不修了", eff: { MENTAL: -1, GAME: 1 }, res: "裂痕正好挡着右上角的小地图。你有两次没看见打野的位置。", risk: null }
    ]
  },
  {
    id: "ev_x_walk_after_loss", cat: "life", w: 10, once: false, year: 0,
    text: "输完比赛你没回基地，在江边走了四十分钟。",
    sub: "手机里 14 条未读，三条是经理的。",
    opts: [
      { t: "走到底再回去", eff: { MENTAL: 4, energy: -8, PHYS: -1 }, res: "你走到桥下，看见有人在钓鱼。回去已经十二点，经理在门口抽烟，把烟掐了。", risk: null },
      { t: "坐下看水面", eff: { MENTAL: 2, GAME: 2, morale: 2 }, res: "你坐了半小时，把最后那波团在脑子里重放三遍。第三遍，你想明白了。", risk: null },
      { t: "打车回基地加练", eff: { MECH: 3, MENTAL: -2, energy: -10 }, res: "你练到三点。第二天教练看你眼圈发黑，把训练赛推后了一小时。", risk: null }
    ]
  },
  {
    id: "ev_x_friend_wedding", cat: "life", w: 9, once: false, year: 0,
    text: "发小结婚，日子在下周六，正好撞上季后赛第一轮。",
    sub: "他发来一段语音：你要是打比赛就不用来了，我懂。",
    opts: [
      { t: "随礼，不去", eff: { money: -0.3, MENTAL: -2, GAME: 2 }, res: "你转了 3000，写了句：等我拿冠军补你一顿。他回了个红包，你没收。", risk: null },
      { t: "打完连夜赶过去", eff: { energy: -18, MENTAL: 4, PHYS: -3 }, res: "你赶了 400 公里。到的时候酒席散了，他和新娘站在酒店门口等你。", risk: null },
      { t: "请假去", eff: { coach: -3, status: -2, MENTAL: 5 }, res: "教练同意了。你缺席两天训练。回来第一场训练赛，你被打了个 0-6。", risk: null }
    ]
  },
  {
    id: "ev_x_insomnia", cat: "life", w: 12, once: false, year: 0,
    text: "凌晨四点，你盯着天花板。脑子里在放第三局那波越塔。",
    sub: "隔壁有人在打呼，声音很规律。",
    opts: [
      { t: "起来看录像", eff: { GAME: 3, energy: -12, PHYS: -2 }, res: "你把那波看了二十遍。第五遍你发现，辅助其实 ping 过。", risk: null },
      { t: "吃半片褪黑素", eff: { energy: 10, PHYS: -1, MENTAL: 1 }, res: "你睡到下午一点。醒来天是灰的，有一瞬间不知道今天几号。", risk: null },
      { t: "去阳台吹风", eff: { MENTAL: 2, PHYS: -3, morale: 2 }, res: "楼下有人在跑步。天开始亮的时候，你想通了那波该往哪走。", risk: null }
    ]
  },
  {
    id: "ev_x_girlfriend_base", cat: "drama", w: 9, once: false, year: 0,
    text: "队友的女朋友在基地住了两周，用你的杯子喝水，还动了你的键盘。",
    sub: "她说是来陪他过生日的。",
    opts: [
      { t: "当面说清楚", eff: { TEAM: -2, MENTAL: 2, status: 1 }, res: "你说了。她第二天走。那个队友一周没跟你讲话，但杯子被换掉了。", risk: null },
      { t: "跟经理反映", eff: { coach: 2, TEAM: -3 }, res: "经理发了通知：非队内人员不得留宿。有人猜是谁告的状。", risk: null },
      { t: "忍着，自己买新的", eff: { money: -0.3, TEAM: 1, MENTAL: -3 }, res: "你买了新键盘和新杯子。她住到第四周才走。", risk: null }
    ]
  },
  {
    id: "ev_x_scrim_leak", cat: "drama", w: 7, once: false, year: 0,
    text: "你们训练赛的录像被人传上了网，标题写着「绝密战术」。",
    sub: "视频里能听见教练的声音：这波别推，等他们先动。",
    opts: [
      { t: "查是谁传的", eff: { TEAM: -3, coach: 3, energy: -8 }, res: "查了两天，是一个陪练。他被踢了，东西已经在网上，收不回来。", risk: null },
      { t: "把泄露的当弃子", eff: { GAME: 4, coach: 3 }, res: "你们把那套体系演了两场假的，第三场换真的。对面从头到尾没反应过来。", risk: null },
      { t: "不管，反正要赢", eff: { GAME: 1, MENTAL: -2, FAME: -1 }, res: "你们照旧打。对面 BP 的时候，果然全针对那一套。", risk: null }
    ]
  },
  {
    id: "ev_x_manager_kickback", cat: "drama", w: 7, once: false, year: 0,
    text: "你在经理桌上看到一张单子：外设采购价 4200，实际市价 2600。",
    sub: "单子下面压着你的报销单。",
    opts: [
      { t: "上报老板", eff: { story: { justice: 2 }, coach: -3, status: -2, FAME: 1 }, res: "经理被换了。新来的第一个月就把预算砍了一半，包括宵夜。", risk: null },
      { t: "装作没看见", eff: { MENTAL: -3, story: { corrupt: 1 }, status: 1 }, res: "你把单子放回去，位置摆得跟原来一样。第二个月，你的报销批得比谁都快。", risk: null },
      { t: "私下问他", eff: { story: { corrupt: 2 }, coach: -1, MENTAL: 1 }, res: "他笑了，说这叫行业惯例，塞给你一个信封。你没收，但他知道你不会说。", risk: null }
    ]
  },
  {
    id: "ev_x_knock_at_door", cat: "drama", w: 7, once: false, year: 0,
    text: "凌晨两点，有人敲基地的门。猫眼里是两个人，举着手机，说想合个影。",
    sub: "基地在工业园三楼，楼下有门禁。",
    opts: [
      { t: "不开，报警", eff: { MENTAL: -3, coach: 2, FAME: -1 }, res: "警察来的时候人已经走了。监控里他们是从消防通道上来的。", risk: null },
      { t: "下去合影", eff: { FAME: 3, haters: 400, MENTAL: -2 }, res: "你隔着铁门跟他们拍了照。第二天照片在网上，配文：凌晨两点我们也见到了他。", risk: null },
      { t: "叫醒打野一起下去", eff: { TEAM: 3, MENTAL: 1, energy: -6 }, res: "两个人一起下去的。那两个人有点慌，说了句不好意思就走了。", risk: null }
    ]
  },
  {
    id: "ev_x_unfollow", cat: "drama", w: 9, once: false, year: 0,
    text: "队里两个人互相取关了，起因是训练赛里一句「这波你为什么不跟」。",
    sub: "超话里已经有人把时间线做出来了。",
    opts: [
      { t: "拉个饭局", eff: { money: -0.4, TEAM: 4, energy: -6 }, res: "三个人吃了顿火锅。他们全程没提那件事，散场时互相拍了下肩。", risk: null },
      { t: "不掺和", eff: { TEAM: -2, MENTAL: 1 }, res: "你没管。两周后他们在比赛里开始不说话，导播的镜头都拍到了。", risk: null },
      { t: "在群里说一句", eff: { TEAM: 2, status: 1, coach: -1 }, res: "你说要吵私下吵。两个人都没回。第二天他们一起吃了早饭。", risk: null }
    ]
  },
  {
    id: "ev_x_coach_vs_vet", cat: "drama", w: 8, once: false, year: 0,
    text: "会议室里，教练和老队员吵起来了。老队员把战术板拍在桌上，笔滚到你脚边。",
    sub: "两个人的目光都在你脸上过了一次。",
    opts: [
      { t: "站教练", eff: { coach: 4, TEAM: -3, status: 1 }, res: "老队员当天没参加训练。第二天他来了，一句话没跟你讲。", risk: null },
      { t: "站老队员", eff: { TEAM: 3, coach: -4, spirit: -2 }, res: "教练把会散了。之后两周，你的战术安排只剩一句「稳一点」。", risk: null },
      { t: "捡起笔，劝两句", eff: { TEAM: 2, coach: 2, MENTAL: -1 }, res: "两个人都不说话了。会开完，谁也没服，但战术板最后还是照教练的改了。", risk: null }
    ]
  },
  {
    id: "ev_x_blackmail_dm", cat: "drama", w: 7, once: false, year: 0,
    text: "有人私信你：我知道你去年那件事，给我 5 万，不然我发出去。",
    sub: "他没说是哪件事。你想了三个小时，也没想起来。",
    opts: [
      { t: "转钱", eff: { money: -5, story: { secret: 2, scandal: 1 }, MENTAL: -4 }, res: "你转了。对方再没出现。但从那天起，每条陌生私信你都会点开。", risk: null },
      { t: "报警", eff: { story: { justice: 2 }, coach: 2, FAME: 1, energy: -8 }, res: "账号是买来的，查了半个月。俱乐部发了通报，评论区说：没事报什么警。", risk: null },
      { t: "回他：你发吧", eff: { MENTAL: 2, FAME: 2, haters: 1200, story: { scandal: 1 } }, res: "你回完就关了手机。三天后他真发了点东西，全是网上能搜到的，没起热度。", risk: null }
    ]
  }
];
