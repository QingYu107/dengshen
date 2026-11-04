/* 《登神》剧情链 + 队友互动事件（P1） */
window.DATA_STORY_EVENTS = [
  /* ================= A1 假赛线 ================= */
  {
    id: "ln_fix_1", cat: "drama", w: 12, once: true, chain: false,
    req: { minSeason: 2, minMoney: 0 },
    text: "经理在楼梯间塞给你一个号码，说这人想跟你聊聊，聊什么都行，别问我从哪弄的。你妈昨天刚打过电话，说我爸那个厂子又停了，房贷这个月还没着落。",
    sub: "两件事凑在同一天，你就知道后面没那么干净。",
    opts: [
      { t: "打过去，先听听", eff: { story: { corrupt: 1 }, MENTAL: -2 },
        res: "对面声音很年轻，开口就叫你的 ID。他说不用现在答复，先加个微信。",
        risk: null, next: { id: "ln_fix_2" } },
      { t: "把号码交给领队", eff: { story: { justice: 1 }, coach: -2, MENTAL: -1 },
        res: "领队看完号码，沉默了一会儿，说这事你别管了。第二天经理看你的眼神变了。",
        risk: null, next: { id: "ln_fix_2" } },
      { t: "回去问经理什么意思", eff: { MENTAL: 1, coach: -3 },
        res: "经理说：我什么都不知道。他给你倒了杯水，手很稳。",
        risk: null, next: { id: "ln_fix_2" } }
    ]
  },
  {
    id: "ln_fix_2", cat: "drama", w: 0, once: true, chain: true,
    text: "三天后号码自己打了过来：三十万定金，已经在你老家那张卡上了。他发来一张照片，是你上周进地下车库的背影。",
    sub: "那个角度说明，他从那时候就在等你点头。",
    opts: [
      { t: "收下，就当借的", eff: { money: 30, story: { corrupt: 3 }, MENTAL: -4 },
        res: "你去 ATM 查了余额，数字后面多了好几个零。回来的路上你一直没敢抬头。",
        risk: null, next: { id: "ln_fix_3" } },
      { t: "留五万，剩下的退回去", eff: { money: 5, story: { corrupt: 2 }, MENTAL: -3, coach: 1 },
        res: "你留下五万，剩下的退了回去，在微信上回了两个字：一场。他秒回：够了。",
        risk: null, next: { id: "ln_fix_3" } },
      { t: "一分不要，全程录音", eff: { story: { justice: 2 }, MENTAL: -2, coach: -2 },
        res: "你把手机放在口袋里录了四十分钟。挂断之后，手心全是汗。",
        risk: null, next: { id: "ln_fix_3" } }
    ]
  },
  {
    id: "ln_fix_3", cat: "drama", w: 0, once: true, chain: true,
    text: "联盟调查组进了基地，有人把聊天记录交了上去，截图里你的头像很清楚。俱乐部只发了一句：全力配合调查，别乱说话。队友在门外站着，没人看你。",
    sub: "走廊的灯很亮，亮得你不敢抬头。",
    opts: [
      { t: "死不承认，说号被盗了", eff: { story: { corrupt: 2 }, MENTAL: -4, coach: -3 },
        res: "你演了两个小时。走的时候调查组的人说：我们会再找你，别换手机。",
        risk: null, next: { id: "ln_fix_4" } },
      { t: "找中间人摆平", eff: { money: -20, story: { corrupt: 1 }, FAME: -2, MENTAL: -2 },
        res: "中间人收钱的时候笑了一下：早这样不就完了。三天后，调查组换了个人来。",
        risk: null, next: { id: "ln_fix_4" } },
      { t: "主动交代，把录音交上去", eff: { story: { justice: 3 }, MENTAL: 2, coach: -4, TEAM: -3 },
        res: "你说了六个小时。出来的时候天亮了，走廊里有人在打电话，看见你就挂了。",
        risk: null, next: { id: "ln_fix_4" } }
    ]
  },
  {
    id: "ln_fix_4", cat: "drama", w: 0, once: true, chain: true,
    text: "听证会定在周五，律师把两份文件推过来：一份认罪，一份证人陈述。他说：签哪份，你这辈子都不一样了。",
    sub: "两支笔都摆在桌上，笔帽都摘了。",
    opts: [
      { t: "认罪，一个人扛", eff: { MENTAL: -8, FAME: -10, story: { corrupt: 2, banned: 1 } },
        res: "你在会上说了四十分钟，一个人名都没提。公告出来那天，基地门口的应援牌全被收走了。",
        risk: null, ending: "banned" },
      { t: "不签，连夜走", eff: { money: -30, MENTAL: -5, FAME: -8, story: { banned: 1 } },
        res: "你买了最近一班机票，落地时手机已经打不通了。新闻里你的名字后面跟着四个字：终身禁赛。",
        risk: null, ending: "banned" },
      { t: "签证人陈述，把一切交出去", eff: { story: { justice: 3 }, MENTAL: 2, FAME: -3, TEAM: -3, coach: -5 },
        res: "你把转账记录、录音、那个号码全交了。三个人被带走，你的名字留在了证人栏，也留在了很多人的黑名单里。",
        risk: null }
    ]
  },

  /* ================= A2 极端粉丝线 ================= */
  {
    id: "ln_fan_1", cat: "drama", w: 11, once: true, chain: false,
    req: { minHaters: 8000, minSeason: 2 },
    text: "有人在超话发了你家小区的照片，楼栋号都对，评论还在涨。保安说，这几天门口总停着一辆白色车，没牌照。",
    sub: "你第一次意识到，家这个字原来是能被查到的。",
    opts: [
      { t: "报警", eff: { story: { justice: 1 }, MENTAL: -2, energy: -5 },
        res: "警察做了笔录，说会留意。第二天那辆车还在，只是停远了一点。",
        risk: null, next: { id: "ln_fan_2" } },
      { t: "找俱乐部处理", eff: { coach: -1, TEAM: 1, MENTAL: -1 },
        res: "俱乐部发了条声明，说已报警。评论区第一条：报了吗？",
        risk: null, next: { id: "ln_fan_2" } },
      { t: "当没看见", eff: { MENTAL: -3, haters: 2000 },
        res: "你把那条超话举报了。举报结果：不构成违规。",
        risk: null, next: { id: "ln_fan_2" } }
    ]
  },
  {
    id: "ln_fan_2", cat: "drama", w: 0, once: true, chain: true,
    text: "快递拆开是个鞋盒，里面一把美工刀，一张纸：下一场别上。寄件人写的是你的名字，地址是基地。",
    sub: "他连你的名字和地址都写得比你自己还熟。",
    opts: [
      { t: "留着，当证据", eff: { story: { justice: 2 }, MENTAL: -3 },
        res: "你把鞋盒放进柜子最上层。每次开柜门，都能看见那个角。",
        risk: null, next: { id: "ln_fan_3" } },
      { t: "扔了，别让队友知道", eff: { MENTAL: -4, TEAM: -2 },
        res: "你半夜拎着垃圾袋下楼，扔的时候手在抖。保安问你怎么了，你说没事。",
        risk: null, next: { id: "ln_fan_3" } },
      { t: "拍照发微博", eff: { FAME: 3, haters: 3000, MENTAL: -2 },
        res: "转发过万。有人心疼你，也有人说：怎么不寄给别人。",
        risk: null, next: { id: "ln_fan_3" } }
    ]
  },
  {
    id: "ln_fan_3", cat: "drama", w: 0, once: true, chain: true,
    text: "训练完出门，那辆白车跟在后面，跟了三个路口，最后停在基地门口。车窗摇下来，里面的人冲你笑了一下。",
    sub: "他笑得挺客气，客气得像在打招呼，不像在威胁。",
    opts: [
      { t: "报警，做笔录", eff: { story: { justice: 2 }, MENTAL: -2, energy: -8 },
        res: "警察来了，车已经走了。笔录做到凌晨一点，第二天你照常训练。",
        risk: null, next: { id: "ln_fan_4" } },
      { t: "搬家，换到基地另一头住", eff: { money: -5, MENTAL: 1, TEAM: -1 },
        res: "你换了个没登记过的地址，窗帘换了双层的。第一晚睡了六个小时。",
        risk: null, next: { id: "ln_fan_4" } },
      { t: "忍着，什么都不说", eff: { MENTAL: -5, story: { stalker: 1 } },
        res: "你什么都没做。后来你换了三个城市，那辆车总能在楼下出现。你开始习惯不走正门。",
        risk: null, ending: "stalker" }
    ]
  },
  {
    id: "ln_fan_4", cat: "drama", w: 0, once: true, chain: true,
    text: "凌晨两点，前台打电话上来：有个人说是你表哥，要上楼。监控里他拎着一个保温桶，另一只手一直插在口袋里。",
    sub: "你没有表哥。这个念头让你从床上坐了起来。",
    opts: [
      { t: "报警，锁门，等警察", eff: { MENTAL: -4, energy: -10, injury: 0.02, story: { stalker: 1 } },
        res: "警察十分钟后到。保温桶里是汤，检测报告你只看了一眼。第二天训练，你的手一直抖。",
        risk: { stat: "MENTAL", dc: 12, ok: "你反锁门，把桌子推过去顶住。警察到的时候，他还在按门铃。", bonus: { MENTAL: 2 } } },
      { t: "连夜搬家，去外地", eff: { money: -8, MENTAL: -3, injury: 0.01, TEAM: -2, story: { stalker: 1 } },
        res: "你在队友家沙发上睡了两天，然后换了城市。新基地的地址，只有五个人知道。",
        risk: null },
      { t: "下楼，跟他把话说清楚", eff: { PHYS: -6, MENTAL: -8, FAME: -3, story: { blood: 1 } },
        res: "你没叫任何人。后来是保安报的警，你在医院躺了半个月，队里对外说你训练受伤。",
        risk: null, ending: "blood" }
    ]
  },

  /* ================= A3 欠薪线 ================= */
  {
    id: "ln_pay_1", cat: "drama", w: 10, once: true, chain: false,
    req: { minSeason: 2 },
    text: "工资拖了三个月，财务在群里发：本周一定到账，然后退了群。老板的电话从上周开始关机。",
    sub: "退群这个动作，比那条消息清楚多了。",
    opts: [
      { t: "找经理问", eff: { coach: -2, MENTAL: -2, status: -2 },
        res: "经理说他也是打工的，让再等等。他自己的工位已经空了。",
        risk: null, next: { id: "ln_pay_2" } },
      { t: "把队友叫到一起", eff: { TEAM: 3, MENTAL: 1 },
        res: "五个人在会议室坐到半夜。有人说罢赛，有人说先打完这个月。",
        risk: null, next: { id: "ln_pay_2" } },
      { t: "忍着，怕影响首发", eff: { MENTAL: -4, coach: 1 },
        res: "你什么都没说。训练照常，只是每天晚饭少点一个菜。",
        risk: null, next: { id: "ln_pay_2" } }
    ]
  },
  {
    id: "ln_pay_2", cat: "drama", w: 0, once: true, chain: true,
    text: "第二天训练取消，会议室的门关着，五个人坐了一上午，谁都不先开口。联盟仲裁的电话就贴在墙上，谁都没先去打。",
    sub: "那串号码贴了三年，第一次有人认真看它。",
    opts: [
      { t: "集体签字，申请仲裁", eff: { story: { justice: 2 }, TEAM: 3, coach: -3, MENTAL: -1 },
        res: "五个人签了字。第二天训练赛照打，但没人再喊战术。",
        risk: null, next: { id: "ln_pay_3" } },
      { t: "让队友去，你不出头", eff: { TEAM: -3, story: { corrupt: 1 }, MENTAL: -2 },
        res: "你留在训练室打排位。走廊里他们在吵，你把耳机音量调大了。",
        risk: null, next: { id: "ln_pay_3" } },
      { t: "私下找老板谈", eff: { money: 2, story: { corrupt: 1 }, MENTAL: -2, coach: 2 },
        res: "老板给了你两万，说先拿着。出门的时候他说：别跟他们说。",
        risk: null, next: { id: "ln_pay_3" } }
    ]
  },
  {
    id: "ln_pay_3", cat: "drama", w: 0, once: true, chain: true,
    text: "仲裁开庭前一天，老板的律师来了，带了一份新合同：降薪一半，欠的一笔勾销。他说不签的话，队伍下个月解散。",
    sub: "他说解散两个字的时候，语气跟说下雨差不多。",
    opts: [
      { t: "签，先保住工作", eff: { money: 3, coach: 2, MENTAL: -2, status: -2 },
        res: "你签了。合同上的数字比去年少了一半，你看了三遍才落笔。",
        risk: null, next: { id: "ln_pay_4" } },
      { t: "不签，走完仲裁", eff: { story: { justice: 2 }, MENTAL: -1, coach: -2 },
        res: "律师收起合同，笑了一下：那你等着。仲裁排期排到了三个月后。",
        risk: null, next: { id: "ln_pay_4" } },
      { t: "拍照发到队群", eff: { TEAM: 2, coach: -4, FAME: 1, story: { scandal: 1 } },
        res: "群里炸了。半小时后，经理在群里发了一条：都别转。",
        risk: null, next: { id: "ln_pay_4" } }
    ]
  },
  {
    id: "ln_pay_4", cat: "drama", w: 0, once: true, chain: true,
    text: "仲裁结果下来：补发两个月工资，剩下的按破产清算排，队伍挂牌出售。同一天，三支队伍的人加了你微信。",
    sub: "三支队伍，三个头像，同时亮起来。",
    opts: [
      { t: "拿钱，签新队", eff: { money: 15, status: 2, TEAM: -2, MENTAL: 1, story: { justice: 1 } },
        res: "你拿回了两个月工资，签字那天没跟任何人告别。新队的基地在另一个城市。",
        risk: null },
      { t: "留下来等新老板", eff: { money: 5, coach: 3, status: 1, TEAM: 2, story: { justice: 1 } },
        res: "新老板来基地转了一圈，说队名不改。你把行李又放回了柜子里。",
        risk: null },
      { t: "钱不要了，解约走人", eff: { money: -2, MENTAL: 3, status: -2, FAME: 1, story: { justice: 1 } },
        res: "你签了放弃追偿的声明，拿回了自由身。走出基地的时候，天刚亮。",
        risk: null }
    ]
  },

  /* ================= A4 雪藏线 ================= */
  {
    id: "ln_bench_1", cat: "drama", w: 10, once: true, chain: false,
    req: { minSeason: 2 },
    text: "教练把你叫进办公室：下一场让队友上，你先歇歇。他说这是为了队伍。也可能不是。",
    sub: "「为了队伍」这四个字，你今年听了三遍。",
    opts: [
      { t: "答应", eff: { coach: 3, status: -5, MENTAL: -3 },
        res: "你说了声好。走出办公室，替补席的椅子比平时凉。",
        risk: null, next: { id: "ln_bench_2" } },
      { t: "问为什么", eff: { coach: -2, MENTAL: 1, GAME: 1 },
        res: "他讲了三分钟战术，没讲一句你的问题。你听懂了。",
        risk: null, next: { id: "ln_bench_2" } },
      { t: "直接找经理", eff: { coach: -4, status: 2, TEAM: -2 },
        res: "经理说会处理。第二天教练照常排阵，只是不再跟你单独说话。",
        risk: null, next: { id: "ln_bench_2" } }
    ]
  },
  {
    id: "ln_bench_2", cat: "drama", w: 0, once: true, chain: true,
    text: "接下来四场，名单上都没有你。训练赛顶你的那个人打得一般，教练没换人。直播间有人问你是不是被雪藏了，弹幕刷得很快。",
    sub: "打得一般也不换，说明问题从来不在打得好不好。",
    opts: [
      { t: "直播开麦，把话说明白", eff: { FAME: 4, coach: -6, status: -3, haters: 2000, MENTAL: 2 },
        res: "你讲了二十分钟，没提名字。切片上了热搜，教练在群里发了句：好自为之。",
        risk: null, next: { id: "ln_bench_3" } },
      { t: "找领队，走内部渠道", eff: { coach: 1, status: 2, TEAM: 1, MENTAL: 1 },
        res: "领队听完说会反映。三天后，你被加进了一个新的训练赛分组。",
        risk: null, next: { id: "ln_bench_3" } },
      { t: "忍着，加练", eff: { MECH: 3, GAME: 2, energy: -10, MENTAL: -3 },
        res: "你每天多练三个小时。没人看见，但你的补刀数在涨。",
        risk: null, next: { id: "ln_bench_3" } }
    ]
  },
  {
    id: "ln_bench_3", cat: "drama", w: 0, once: true, chain: true,
    text: "转会期最后一天，经理把三份报价摆在桌上：一支季后赛队，一支重建队，还有一份留队涨薪。他说：你自己选，选完别后悔。",
    sub: "三份纸，三个方向，没有一个写着「稳」。",
    opts: [
      { t: "去季后赛队，先跟那边吃个饭", eff: { status: 6, money: 20, MENTAL: 2, TEAM: -3, story: { scandal: 1 } },
        res: "饭吃完，字也签了。旧队知道后，把你的柜子清空了。",
        risk: null },
      { t: "留队，把位置抢回来", eff: { coach: 4, status: 3, TEAM: 2, MENTAL: 1, story: { justice: 1 } },
        res: "你留了下来。季前赛第一场，你打了四十分钟，赢了。教练在通道里拍了下你的肩。",
        risk: null },
      { t: "去重建队，当核心", eff: { money: 8, FAME: 3, status: 2, MENTAL: 1, story: { justice: 1 } },
        res: "重建队的基地在一栋旧楼里。老板说：这支队伍以后围着你建。你信了一半。",
        risk: null }
    ]
  },

  /* ================= A5 伤病线 ================= */
  {
    id: "ln_inj_1", cat: "drama", w: 11, once: true, chain: false,
    req: { minSeason: 2 },
    text: "手腕疼了两个月，队医看完片子说：腱鞘炎，再拖下去，鼠标都握不住。可下周打关键局。",
    sub: "片子上的那点阴影，看着比对面中单还难缠。",
    opts: [
      { t: "手术，赌下个赛季", eff: { money: -10, PHYS: -8, energy: -25, injury: 0.01, MENTAL: 2 },
        res: "手术做了三个小时。醒来的时候，手腕上缠着厚厚的纱布，你第一反应是问几点了。",
        risk: null, next: { id: "ln_inj_2" } },
      { t: "打封闭，先打完这个赛季", eff: { energy: 10, PHYS: -6, injury: 0.05, MECH: -2 },
        res: "针打进去的时候你咬着牙。手不麻了，但医生说，这是提前透支。",
        risk: null, next: { id: "ln_inj_2" } },
      { t: "保守治疗，减训练量", eff: { energy: -8, MECH: -3, GAME: 2, injury: 0.02 },
        res: "你把每天的训练砍了一半，剩下的时间做理疗。教练没说什么。",
        risk: null, next: { id: "ln_inj_2" } }
    ]
  },
  {
    id: "ln_inj_2", cat: "drama", w: 0, once: true, chain: true,
    text: "康复做到第三个月，教练发来消息：季后赛名单要报了，你能不能上？医生说，现在上，等于把前面白养了。",
    sub: "你把那条消息看了四遍，才回了一个字。",
    opts: [
      { t: "上，绑着护腕上", eff: { injury: 0.04, PHYS: -5, coach: 4, status: 4, MENTAL: -2 },
        res: "你上了。第一场打完，护腕里全是汗，手腕肿了一圈。",
        risk: null, next: { id: "ln_inj_3" } },
      { t: "不上，养到底", eff: { coach: -4, status: -5, energy: 20, PHYS: 4, MENTAL: 3 },
        res: "你说我不上。教练回了两个字：知道了。那轮季后赛，你在基地看的直播。",
        risk: null, next: { id: "ln_inj_3" } },
      { t: "上，但只打关键局", eff: { injury: 0.02, coach: 2, status: 2, energy: -10 },
        res: "你和教练谈了一次，他只答应让你打一个 BO3。你赢了那个 BO3。",
        risk: null, next: { id: "ln_inj_3" } }
    ]
  },
  {
    id: "ln_inj_3", cat: "drama", w: 0, once: true, chain: true,
    text: "赛季结束，队医把复查单给你：手腕的积液少了一点，腰椎多了两节突出。俱乐部发来新合同，签字费很高，条件是明年打满。",
    sub: "一张复查单，一份新合同，摆在一起像在问你选哪个身体。",
    opts: [
      { t: "签，继续打", eff: { money: 20, injury: 0.03, MECH: 2, MENTAL: -2, story: { corrupt: 1 } },
        res: "你签了。签字费到账那天，你去医院又拍了一次片子，没敢给队里看。",
        risk: null },
      { t: "不签，转教练", eff: { GAME: 3, FAME: 2, money: 5, MECH: -3, MENTAL: 2, story: { justice: 1 } },
        res: "你开始跟着教练组做 BP。第一次独立带队打训练赛，你比当选手时还紧张。",
        risk: null },
      { t: "休一年，去养伤", eff: { energy: 30, PHYS: 6, money: -15, status: -4, MENTAL: 4, story: { justice: 1 } },
        res: "你请了一年假，回了老家。每天早上绕着小区走两圈，手腕慢慢不疼了。",
        risk: null }
    ]
  },

  /* ================= B 队友互动 ================= */
  {
    id: "st_mate_duo", cat: "team", w: 12, once: false, year: 0, mate: true,
    text: "{mate}拉你双排，说好只打两把，打到第四把的时候天已经亮了。他还在语音里喊：再来一把，这把肯定赢。",
    sub: "你看了眼时间，八点有训练赛。",
    opts: [
      { t: "陪他打到天亮", eff: { TEAM: 3, energy: -12, MECH: 2, MENTAL: 1 },
        res: "你们连赢了五把。他下线前说：跟你打真舒服。你看了眼时间，八点训练赛。",
        risk: null },
      { t: "说好两把就两把", eff: { TEAM: -2, energy: 8, MENTAL: 2 },
        res: "你退了。他在语音里啧了一声，自己排到凌晨四点。",
        risk: null },
      { t: "不打了，去复盘", eff: { TEAM: -2, GAME: 3, energy: -4 },
        res: "你关了游戏，把昨天那场录像又看了一遍。他一个人排到天亮，第二天没跟你说话。",
        risk: null }
    ]
  },
  {
    id: "st_mate_night", cat: "life", w: 11, once: false, year: 0, mate: true,
    text: "凌晨一点，{mate}点了炸鸡，问你要不要，盒子上还冒着油。明天上午有训练赛。",
    sub: "他连问都没问训练赛的事，好像那玩意儿明天不会来。",
    opts: [
      { t: "吃", eff: { PHYS: -3, MENTAL: 3, TEAM: 2 },
        res: "你们蹲在阳台吃完了一整盒。他说这家店的辣酱是自带的，你说确实够辣。",
        risk: null },
      { t: "只吃一块", eff: { PHYS: -1, MENTAL: 1, TEAM: 1 },
        res: "你拿了一块最小的。他看了眼盒子，说：你这人真没意思。",
        risk: null },
      { t: "不吃，去睡", eff: { PHYS: 3, MENTAL: -1, TEAM: -1 },
        res: "你回房间躺下。隔着门，能听见他一个人边吃边刷视频笑。",
        risk: null }
    ]
  },
  {
    id: "st_mate_start", cat: "team", w: 12, once: false, year: 0, mate: true,
    text: "训练赛名单贴出来，{pos}这个位置只有一个名字。你和{mate}都在等教练开口，他看了你一眼，什么都没说。",
    sub: "一个位置，两个人，谁先说话谁就矮一截。",
    opts: [
      { t: "训练赛往死里打", eff: { MECH: 2, GAME: 2, TEAM: -3, energy: -8 },
        res: "你那把打得很凶，赢了。散会的时候他没跟你击掌。",
        risk: null },
      { t: "让给他，自己加练", eff: { TEAM: 2, coach: -1, MECH: 2, MENTAL: -2 },
        res: "你跟教练说让他上。那天晚上你在训练室练到两点，他路过看了一眼，没进来。",
        risk: null },
      { t: "找他聊清楚", eff: { TEAM: 3, MENTAL: 1, coach: -1 },
        res: "你们在楼下便利店坐了一个小时。他说他想打，你说你也是，最后谁都没让。",
        risk: { stat: "MENTAL", dc: 12, ok: "他先笑了，说那就各凭本事。第二天训练赛，你们俩都打得很认真。", bonus: { TEAM: 2 } } }
    ]
  },
  {
    id: "st_mate_fight", cat: "team", w: 12, once: false, year: 0, mate: true,
    text: "训练赛输了，{mate}在语音里说你那波为什么不跟。你说他开团前不喊。其他三个人都不说话。",
    sub: "四个人都在等谁先闭嘴。",
    opts: [
      { t: "散会再说", eff: { TEAM: 1, MENTAL: -1 },
        res: "你摘了耳机。半小时后他过来递了瓶水，这事就算过去了。",
        risk: null },
      { t: "当场吵回去", eff: { TEAM: -4, MENTAL: 2, FAME: -1 },
        res: "你们吵了十分钟，教练进来把投影关了。第二天复盘，谁都没提这局。",
        risk: null },
      { t: "认了，主动背锅", eff: { TEAM: 3, MENTAL: -3, coach: 1 },
        res: "你说这波是我的。他愣了一下，后半局开始主动给你让线。",
        risk: null }
    ]
  },
  {
    id: "st_mate_review", cat: "team", w: 10, once: false, year: 0, mate: true,
    text: "复盘会上，{mate}把你第三局的操作投到屏幕上，一帧一帧地放。他说：你自己看，这叫不叫送。",
    sub: "投影的光打在你脸上，全队都在看屏幕，也都在看你。",
    opts: [
      { t: "看完，承认", eff: { GAME: 3, TEAM: 2, MENTAL: -3 },
        res: "你看到第四遍，确实是自己走位错了。你说了句我的。他把笔放下了。",
        risk: null },
      { t: "抢过鼠标放他的", eff: { TEAM: -3, GAME: 2, MENTAL: 2 },
        res: "你放了他团战空大的那波。会议室安静了，教练说：继续。",
        risk: null },
      { t: "起身走人", eff: { TEAM: -4, coach: -2, MENTAL: 1 },
        res: "你出了会议室，在楼梯间站了十分钟。回去的时候，他们已经讲到下一局了。",
        risk: null }
    ]
  },
  {
    id: "st_mate_gear", cat: "team", w: 9, once: false, year: 0, mate: true,
    text: "{mate}的鼠标坏了，问你借那个备用的，那是你托人从国外带的。他说明天就还。",
    sub: "他说「明天就还」的时候，眼睛都没抬。",
    opts: [
      { t: "借", eff: { TEAM: 2, money: -0.5, MENTAL: -1 },
        res: "第二天他还回来，线被缠成了一团。你解开的时候，发现侧键有点松。",
        risk: null },
      { t: "借个便宜的给他", eff: { TEAM: 1, MENTAL: 1 },
        res: "你把抽屉里那个旧鼠标给他。他说了声谢，用得也挺顺手。",
        risk: null },
      { t: "不借", eff: { TEAM: -3, MENTAL: -1 },
        res: "你说那个不借。他哦了一声，转头去问别人。之后一周，他训练赛没给你让过一次线。",
        risk: null }
    ]
  },
  {
    id: "st_mate_scapegoat", cat: "team", w: 10, once: false, year: 0, mate: true,
    text: "教练追查谁在训练赛前看了对手直播。{mate}低着头，你确实看见他看了。{coach}把本子往桌上一拍：谁？",
    sub: "全队都知道是谁，全队都在等一个名字。",
    opts: [
      { t: "替他扛", eff: { TEAM: 4, coach: -4, MENTAL: -2 },
        res: "你说是你。教练盯了你三秒，扣了你半个月的绩效。散会后他给你发了条消息：记着。",
        risk: null },
      { t: "说实话", eff: { TEAM: -4, coach: 2, MENTAL: 1 },
        res: "你说他看了。教练让他写检查，他写完摔在桌上。那之后你们再没双排过。",
        risk: null },
      { t: "装不知道", eff: { TEAM: -1, coach: -1, MENTAL: -1 },
        res: "你说没注意。教练看了你一会儿，说：行，都回去。那天训练赛加了两小时。",
        risk: null }
    ]
  },
  {
    id: "st_mate_snore", cat: "life", w: 10, once: false, year: 0, mate: true,
    text: "{mate}打呼，隔着墙都听得见，你戴耳塞戴了三天，耳朵发炎了。明天还有比赛。",
    sub: "你现在一听那个节奏就知道他睡到第几层了。",
    opts: [
      { t: "去敲他门", eff: { TEAM: -1, PHYS: 2, energy: -4 },
        res: "他迷迷糊糊开了门，说不好意思，翻个身又睡了。五分钟后，呼噜声重新响起来。",
        risk: null },
      { t: "去会议室睡", eff: { energy: 5, TEAM: -1, PHYS: -2 },
        res: "会议室的沙发很短，你蜷了一夜。早上保洁阿姨进来，吓了一跳。",
        risk: null },
      { t: "忍着", eff: { PHYS: -4, MENTAL: -3 },
        res: "你盯着天花板到四点。第二天比赛，你在 BP 的时候打了个哈欠，被镜头拍到了。",
        risk: null }
    ]
  },
  {
    id: "st_mate_family", cat: "team", w: 10, once: true, year: 0, mate: true,
    text: "{mate}接了个电话，回来坐在楼梯上，眼睛是红的。他爸住院了。他问你：能不能借我点钱。",
    sub: "他问这句的时候，手一直捏着手机边。",
    opts: [
      { t: "借五万", eff: { money: -5, TEAM: 5, MENTAL: 1 },
        res: "你转了五万。他说了句谢谢，声音很小。半年后他把钱还了，多转了两千，你没收。",
        risk: null },
      { t: "借五千", eff: { money: -0.5, TEAM: 2 },
        res: "你转了五千，说不够再讲。他点点头，那天晚上就买了回老家的票。",
        risk: null },
      { t: "帮他找俱乐部预支", eff: { coach: -2, TEAM: 4, story: { justice: 1 }, money: -1 },
        res: "你陪他去找经理。经理批了三个月工资，条件是下个赛季不涨薪。他签了。",
        risk: null }
    ]
  },
  {
    id: "st_mate_gossip", cat: "life", w: 11, once: false, year: 0, mate: true,
    text: "{mate}最近总在半夜出门，回来身上有香水味，队里都在猜。教练问你知不知道。",
    sub: "教练问得很随意，眼睛却一直看着你。",
    opts: [
      { t: "帮他瞒", eff: { TEAM: 3, coach: -2, story: { scandal: 1 } },
        res: "你说不知道。教练看了你一眼，没再问。第二天{mate}给你带了杯咖啡。",
        risk: null },
      { t: "跟教练说", eff: { coach: 2, TEAM: -4 },
        res: "教练找他谈了话。之后他半夜照常出门，只是再没跟你说过话。",
        risk: null },
      { t: "当面问他", eff: { TEAM: 2, MENTAL: 1 },
        res: "他愣了下，笑了：我谈恋爱了，不行啊。你问是谁，他说你猜，你猜了三个都错。",
        risk: { stat: "MENTAL", dc: 11, ok: "他说是隔壁队的运营。你答应保密，他请你吃了顿火锅。", bonus: { TEAM: 2 } } }
    ]
  },
  {
    id: "st_mate_kr", cat: "team", w: 10, once: false, year: 0, mate: true,
    text: "新来的韩援{mate}在训练赛里一直说「等一下」，说了七次。没人知道他在等什么，他自己急得开始比手势。",
    sub: "七次「等一下」，一次都没人听懂。",
    opts: [
      { t: "学两句韩语", eff: { TEAM: 3, GAME: 2, energy: -6 },
        res: "你学了「上」和「撤」两个词。下一次他说等一下，你问等什么，他笑了。",
        risk: null },
      { t: "让他说英语", eff: { TEAM: 1, MENTAL: 1 },
        res: "他英语也不好。两个人比划了半局，最后靠 ping 信号打完了训练赛。",
        risk: null },
      { t: "找翻译", eff: { coach: 1, TEAM: 2, money: -0.2 },
        res: "翻译来了三天，把常用的二十句话贴在显示器边上。他撕下来，贴在了自己柜门上。",
        risk: null }
    ]
  },
  {
    id: "st_mate_sponsor", cat: "media", w: 10, once: false, year: 0, mate: true,
    text: "{team}的赞助商要拍一组照片，{mate}拉你一起去，说拍两小时给两千。可那天下午本来要复盘。",
    sub: "两千块，两小时，一次复盘。他算得比谁都清楚。",
    opts: [
      { t: "去", eff: { money: 0.2, FAME: 2, coach: -2, energy: -6 },
        res: "你们在绿幕前站了两个小时，笑到脸僵。钱到账那天，他请你吃了顿烧烤。",
        risk: null },
      { t: "不去", eff: { coach: 1, MENTAL: 1, TEAM: -1 },
        res: "你留在基地复盘。晚上他回来，说摄影师问了你三次怎么没来。",
        risk: null },
      { t: "让他帮你说一声", eff: { TEAM: 1, FAME: 1, coach: -1 },
        res: "他帮你跟赞助商解释了半天。回来的时候说：下次你自己说，我嘴都干了。",
        risk: null }
    ]
  },
  {
    id: "st_mate_skin", cat: "life", w: 11, once: false, year: 0, mate: true,
    text: "{mate}给你送了个皮肤，备注写着：上次那波谢了。你想不起来是哪一波。",
    sub: "你翻了翻战绩，有三个「上次那波」都挺像。",
    opts: [
      { t: "回送一个更贵的", eff: { money: -0.3, TEAM: 3, MENTAL: 2 },
        res: "你挑了个限定回送。他收到后在语音里喊了一声，全基地都听见了。",
        risk: null },
      { t: "回送个便宜的", eff: { money: -0.1, TEAM: 1 },
        res: "你送了个打折的。他说谢谢，然后下一把还是选了那个限定。",
        risk: null },
      { t: "口头谢一句", eff: { TEAM: 1, MENTAL: 1 },
        res: "你说了句谢了。他说客气什么。那个皮肤你一直没用过。",
        risk: null }
    ]
  },
  {
    id: "st_mate_blackout", cat: "life", w: 9, once: false, year: 0, mate: true,
    text: "基地跳闸了，五个人排位同时掉线。{mate}在黑暗里骂了一句，然后所有人都笑了。电闸在地下室。",
    sub: "有人在黑暗里喊：谁去修。没人动。",
    opts: [
      { t: "下去修", eff: { TEAM: 3, energy: -5, PHYS: -1 },
        res: "你打着手电筒找到电闸，推上去的瞬间，楼上一片欢呼。你踩着楼梯上来，像个修理工。",
        risk: null },
      { t: "点外卖等来电", eff: { money: -0.2, TEAM: 2, MENTAL: 1 },
        res: "你们在黑暗里吃了顿烧烤。来电的时候，排位已经掉到钻一了。",
        risk: null },
      { t: "去网吧", eff: { money: -0.1, TEAM: 2, FAME: -1, energy: -8 },
        res: "五个人戴着口罩走进网吧。老板认出了你，给你们开了包间，没收钱。",
        risk: null }
    ]
  },
  {
    id: "st_mate_therapy", cat: "team", w: 9, once: true, year: 0, mate: true,
    text: "{mate}每周三下午都出去，后来你才知道他去看心理医生。他让你别跟别人说。",
    sub: "他说这话的时候，语气比平时轻。",
    opts: [
      { t: "陪他去一次", eff: { TEAM: 3, MENTAL: 2, energy: -4 },
        res: "你在诊所楼下等了一个小时。他下来的时候眼睛有点红，说：走，吃饭。",
        risk: null },
      { t: "替他保密", eff: { TEAM: 3, MENTAL: 1 },
        res: "你谁都没说。后来教练问起，你说他那天去体检了。",
        risk: null },
      { t: "告诉教练", eff: { coach: 2, TEAM: -5, story: { corrupt: 1 } },
        res: "教练给他批了假，也在会上说了句「有问题的早点说」。他再没约过你吃饭。",
        risk: null }
    ]
  },
  {
    id: "st_mate_rookie", cat: "team", w: 11, once: true, year: 0, mate: true,
    text: "青训的小孩上来了，十七岁，第一天训练赛就把你打穿了。{mate}在旁边看着，没说话，教练在场边记东西。",
    sub: "教练那个本子，你见过，是记「谁能用」的。",
    opts: [
      { t: "教他", eff: { TEAM: 3, GAME: 2, status: -2, MENTAL: -1 },
        res: "你把自己的对线笔记给了他一半。两周后，他在训练赛里用你教的那套打赢了你。",
        risk: null },
      { t: "压他", eff: { TEAM: -2, MECH: 2, coach: -1 },
        res: "你连着三把选克制他的英雄。他被打得不敢说话，教练合上了本子。",
        risk: null },
      { t: "找教练表忠心", eff: { coach: 2, status: 2, TEAM: -2 },
        res: "你跟教练说你还想打。教练说：我知道，不然我记他干嘛。",
        risk: null }
    ]
  },
  {
    id: "st_mate_vet_money", cat: "money", w: 9, once: false, year: 0, mate: true,
    text: "{mate}把手机银行打开给你看，六位数。他说：打职业就这几年，别乱花。他上个月刚换了个新键盘，三千。",
    sub: "一边劝你别乱花，一边自己先花了。",
    opts: [
      { t: "听，开始存", eff: { money: 1, MENTAL: 2 },
        res: "你开了个定期，每个月发工资先转一半。看着数字慢慢涨，比赢一把还踏实。",
        risk: null },
      { t: "请他吃饭", eff: { money: -0.3, TEAM: 2 },
        res: "你请他去吃了顿好的。结账的时候他抢着买单，说：你那点钱留着。",
        risk: null },
      { t: "笑他抠", eff: { TEAM: -2, MENTAL: 1 },
        res: "你说攒那么多干嘛。他没生气，只说了句：等你退役就知道了。",
        risk: null }
    ]
  },
  {
    id: "st_mate_jungle", cat: "team", w: 12, once: false, year: 0, mate: true,
    text: "{mate}在语音里第三次喊你跟，你还在补那波兵。他直接把耳机摘了。训练赛还有十分钟。",
    sub: "耳机挂在椅背上，晃了两下。",
    opts: [
      { t: "道歉，改", eff: { TEAM: 3, GAME: 2 },
        res: "你说我的，下一波就跟。他真的又来了三次中路，你一次都没落下。",
        risk: null },
      { t: "说兵线不能放", eff: { GAME: 3, TEAM: -2 },
        res: "你讲了两句兵线。他沉默了半分钟，说：行，那你别叫我。",
        risk: null },
      { t: "让他先来中路", eff: { TEAM: 1, MENTAL: 1, GAME: 1 },
        res: "你们各让了一步。那局赢得很难看，但至少没人再摘耳机。",
        risk: null }
    ]
  },
  {
    id: "st_mate_vision", cat: "team", w: 10, once: false, year: 0, mate: true,
    text: "你中路河道黑了整局，{mate}的眼全插在对面野区，一个都没回来。你被 gank 了四次。",
    sub: "你在塔下站着，像在等谁，其实是在等死。",
    opts: [
      { t: "自己买真眼", eff: { money: -0.1, GAME: 2, MENTAL: -1 },
        res: "你自己买了两个真眼，插在河道两边。下一局，你一次都没被抓。",
        risk: null },
      { t: "在语音里要", eff: { TEAM: 1, GAME: 1, MENTAL: 1 },
        res: "你说给我留个眼。他说知道了，下一波回来插了一个。就一个。",
        risk: null },
      { t: "找教练说", eff: { coach: -2, TEAM: -2, GAME: 1 },
        res: "教练在复盘时点了这事。{mate}当场没说话，散会后把你的眼全拆了。",
        risk: null }
    ]
  },
  {
    id: "st_mate_notes", cat: "team", w: 9, once: false, year: 0, mate: true,
    text: "你的笔记本被人翻过，最新那页多了个折角，{mate}的桌上放着一本一样的。上面记着你对线期的习惯。",
    sub: "折角那页，正好写着你怎么打第一个三分钟。",
    opts: [
      { t: "对质", eff: { TEAM: -4, MENTAL: 2 },
        res: "你把本子摊在他面前。他看了三秒，说：我就想学一下。",
        risk: { stat: "MENTAL", dc: 13, ok: "他把本子推回来，说了句对不起。你们后来一起补完了那页笔记。", bonus: { TEAM: 2 } } },
      { t: "换个地方藏", eff: { MENTAL: -2, GAME: 1 },
        res: "你把本子锁进了柜子。之后每次写完，你都会下意识看一眼门口。",
        risk: null },
      { t: "假装不知道，故意写错两页", eff: { GAME: 2, MENTAL: 2, TEAM: -1 },
        res: "你写了两页错的。下一场训练赛，他照着打，被抓了三次。你没笑。",
        risk: null }
    ]
  },
  {
    id: "st_mate_stream", cat: "media", w: 11, once: false, year: 0, mate: true,
    text: "{mate}直播的时候把你拉进语音，直播间人数从三千涨到两万，弹幕全在刷你的 ID。",
    sub: "他对着镜头笑了一下，把麦往你这边推。",
    opts: [
      { t: "多聊一会儿", eff: { FAME: 4, energy: -8, TEAM: 2 },
        res: "你陪他播了一个小时，讲了两句比赛里的梗。下播后他说：你比我会说。",
        risk: null },
      { t: "说两句就撤", eff: { FAME: 1, MENTAL: 1 },
        res: "你说了句大家好就退了。弹幕还在刷，他对着镜头摊手：他就这样。",
        risk: null },
      { t: "让他别提你", eff: { TEAM: -2, FAME: -1, MENTAL: 1 },
        res: "你说别提我。他愣了下，说行。那之后他的直播间再没出现过你的名字。",
        risk: null }
    ]
  },
  {
    id: "st_mate_netcafe", cat: "life", w: 10, once: false, year: 0, mate: true,
    text: "{mate}说基地的网太卡，拉你去楼下网吧开黑。他说戴口罩没人认得出。你信了。",
    sub: "你后来回想，那天你连帽子都没戴。",
    opts: [
      { t: "去", eff: { TEAM: 3, FAME: 2, MENTAL: 3 },
        res: "你们刚坐下十分钟，隔壁桌就有人举着手机拍。第二天超话里全是你们的照片。",
        risk: null },
      { t: "不去", eff: { MECH: 2, TEAM: -1 },
        res: "你留在基地单排。他们五个小时后才回来，身上全是烟味。",
        risk: null },
      { t: "去了，坐角落", eff: { TEAM: 1, MENTAL: 1, FAME: 1 },
        res: "你缩在最里面的机位，还是被老板认出来了。他给你们免了单，条件是合张影。",
        risk: null }
    ]
  },
  {
    id: "st_mate_teambuild", cat: "team", w: 9, once: false, year: 0, mate: true,
    text: "俱乐部组织团建，去爬山。{mate}在半山腰坐下，说谁爱爬谁爬。教练在前面喊集合。",
    sub: "他坐的那块石头，正好能看见所有人往上爬。",
    opts: [
      { t: "陪他坐着", eff: { TEAM: 3, coach: -2, PHYS: 1 },
        res: "你们在石头上坐了半小时，看别人往上爬。他说：这比训练赛累。",
        risk: null },
      { t: "拉他上去", eff: { TEAM: 2, PHYS: 3, energy: -8 },
        res: "你拽着他爬到山顶。他喘得像刚打完 BO5，但合照的时候站得最直。",
        risk: null },
      { t: "自己先上", eff: { coach: 2, TEAM: -1, PHYS: 2 },
        res: "你跟着教练第一批登顶。下山的时候，{mate}已经在大巴上睡着了。",
        risk: null }
    ]
  },
  {
    id: "st_mate_cp", cat: "media", w: 10, once: false, year: 0, mate: true,
    text: "运营找你和{mate}拍一组双人照，说现在流行这个，能涨粉。文案都写好了：最好的下路，最好的兄弟。",
    sub: "文案里那几个字，你们平时一次都没说过。",
    opts: [
      { t: "拍", eff: { FAME: 5, money: 0.5, TEAM: 2, MENTAL: -2 },
        res: "照片发出去，转发破了十万。评论区一半在磕，一半在骂。他倒是挺高兴。",
        risk: null },
      { t: "拒绝", eff: { FAME: -2, TEAM: -1, MENTAL: 1 },
        res: "你说不拍。运营叹了口气，把方案发给了另一对。",
        risk: null },
      { t: "拍，但要求改文案", eff: { FAME: 2, TEAM: 1, coach: -1 },
        res: "照片照拍，文案改成了两个人的 ID。运营说这样没流量，你说就这样。",
        risk: null }
    ]
  },
  {
    id: "st_mate_bet", cat: "money", w: 9, once: false, year: 0, mate: true,
    text: "{mate}把手机递过来，上面是个盘口：今晚这场，买对面赢，稳的。他说队里好几个人都买了。",
    sub: "他把「稳的」说得特别轻，像在说一件家务事。",
    opts: [
      { t: "买两千", eff: { money: 0.3, story: { corrupt: 1 }, MENTAL: -2, TEAM: 1 },
        res: "比赛结束，钱到账了。你盯着那条转账记录，第一次觉得两千块这么烫。",
        risk: null },
      { t: "不买，也不说", eff: { MENTAL: -1 },
        res: "你把手机推回去，说我不玩。他耸耸肩，转头去问别人。",
        risk: null },
      { t: "劝他收手", eff: { TEAM: -1, story: { justice: 1 }, MENTAL: 1 },
        res: "你说这个查得严。他说就玩玩。两周后，联盟的调查邮件发到了俱乐部邮箱。",
        risk: null }
    ]
  },
  {
    id: "st_mate_harass", cat: "media", w: 10, once: false, year: 0, mate: true,
    text: "{mate}今天上了热搜，词条很难听，俱乐部让所有人别发声。{team}官博发的声明，评论区已经关了。",
    sub: "训练室里没人开电视，也没人开手机外放。",
    opts: [
      { t: "发微博挺他", eff: { FAME: 2, haters: 3000, coach: -4, TEAM: 4 },
        res: "你发了五个字：他是我队友。评论区炸了，他给你发了条语音，没说话，只有呼吸声。",
        risk: null },
      { t: "私下陪他", eff: { TEAM: 3, MENTAL: 1, energy: -3 },
        res: "你在阳台陪他站了一会儿，谁都没提热搜。烟抽完，他说：回去打排位吧。",
        risk: null },
      { t: "听俱乐部的", eff: { coach: 2, TEAM: -3 },
        res: "你什么都没发。第二天他照常训练，只是不再跟任何人开玩笑。",
        risk: null }
    ]
  },
  {
    id: "st_mate_debt", cat: "money", w: 9, once: false, year: 0, mate: true,
    text: "上个月{mate}借了你两万，说发工资就还。今天他换了个新手机，没提钱的事。",
    sub: "新手机的盒子就放在他桌上，没拆的封条你看了三眼。",
    opts: [
      { t: "直接要", eff: { money: 2, TEAM: -3, MENTAL: -1 },
        res: "你把话说了。他愣了下，当场转了钱，说：急什么。之后你们再没一起吃过饭。",
        risk: null },
      { t: "再等等", eff: { MENTAL: -3, TEAM: 1 },
        res: "你又等了一个月。他照常跟你双排，照常不提钱。",
        risk: null },
      { t: "当没这回事", eff: { money: -2, TEAM: 2, MENTAL: -2 },
        res: "你没提。年底他送了你一块表，不便宜。你收下了，也没问多少钱。",
        risk: null }
    ]
  },
  {
    id: "st_mate_smurf", cat: "money", w: 9, once: false, year: 0, mate: true,
    text: "{mate}接了个代练单，问你借小号。他说一晚上两千，分你一半。联盟查得正严。",
    sub: "两千这个数字，他说得比「查得严」还顺口。",
    opts: [
      { t: "借", eff: { money: 0.1, story: { corrupt: 1 }, MENTAL: -1 },
        res: "号借出去三天，回来的时候多了七个好友申请。你把他拉黑了。",
        risk: null },
      { t: "不借，也不举报", eff: { MENTAL: -1, TEAM: 1 },
        res: "你说号有用。他哦了一声，去借了别人的。",
        risk: null },
      { t: "举报", eff: { story: { justice: 2 }, TEAM: -5, coach: 2 },
        res: "联盟的邮件回得很快。他被罚了半年工资，离开基地那天，没跟你告别。",
        risk: null }
    ]
  },
  {
    id: "st_mate_goodbye", cat: "team", w: 10, once: true, year: 0, mate: true,
    text: "{mate}的柜子空了。他走之前把外设留给你，说：用不上就扔了。你们一起打了两年。",
    sub: "那副外设的键帽被磨得发亮，是他自己的手磨的。",
    opts: [
      { t: "送他去车站", eff: { TEAM: 3, MENTAL: 2, energy: -4 },
        res: "你们在候车厅坐了半小时，没说什么。检票的时候他抱了你一下，说：好好打。",
        risk: null },
      { t: "请他吃最后一顿", eff: { money: -0.3, TEAM: 3, MENTAL: 1 },
        res: "你们在基地楼下吃了顿烧烤。他喝多了，一直说当年那波团不该开。",
        risk: null },
      { t: "没去送", eff: { MECH: 2, MENTAL: -3 },
        res: "你在训练室打排位。他走的时候敲了敲门，你戴着耳机，没听见。",
        risk: null }
    ]
  },
  {
    id: "st_mate_penta", cat: "team", w: 11, once: false, year: 0, mate: true,
    text: "你四杀的时候，{mate}一个技能把最后那个人收了。语音里安静了两秒。他说：手滑。",
    sub: "手滑得很准，那个人他打了一整局。",
    opts: [
      { t: "骂他两句", eff: { TEAM: -1, MENTAL: 1 },
        res: "你骂了句脏话。他笑着说下次让你。下一把，他又抢了。",
        risk: null },
      { t: "说没事", eff: { TEAM: 2, MENTAL: -1 },
        res: "你说没事，五杀而已。他松了口气。其实你记了很久。",
        risk: null },
      { t: "下一把抢他的", eff: { TEAM: 1, MENTAL: 2, GAME: 1 },
        res: "下一把你盯着他的人头。抢到的时候，他在语音里喊：你他妈。你笑了。",
        risk: null }
    ]
  },
  {
    id: "st_mate_breakup", cat: "life", w: 10, once: false, year: 0, mate: true,
    text: "凌晨三点，{mate}敲你门，说他分手了。他手里拎着两瓶啤酒。明天早上八点训练赛。",
    sub: "他站在门口，眼睛比平时亮，也比平时空。",
    opts: [
      { t: "陪他喝", eff: { TEAM: 4, PHYS: -3, energy: -8, MENTAL: 2 },
        res: "你们喝到天亮。训练赛他打得很烂，教练骂了他一顿，他一句都没反驳。",
        risk: null },
      { t: "劝他去睡", eff: { TEAM: 1, energy: 4, MENTAL: -1 },
        res: "你说先睡吧，明天再说。他站了会儿，把啤酒放你桌上，走了。",
        risk: null },
      { t: "装睡", eff: { TEAM: -3, energy: 6, MENTAL: -1 },
        res: "你没开门。敲门声停了之后，你在黑暗里躺了很久才睡着。",
        risk: null }
    ]
  },
  {
    id: "st_mate_burnout", cat: "team", w: 11, once: false, year: 0, mate: true,
    text: "{mate}最近训练赛一直送，复盘也不说话，教练说他心态崩了。明天有比赛。",
    sub: "他坐在角落里，把脸埋在手里，像在等谁给他一个台阶。",
    opts: [
      { t: "找他聊", eff: { TEAM: 4, MENTAL: 2, energy: -5 },
        res: "你们在楼下走了两圈。他说他不想打了，你说那就先不想。第二天他上了，打得还行。",
        risk: null },
      { t: "让教练处理", eff: { coach: 1, TEAM: -2 },
        res: "教练找他谈了两次。第三次，他被移出了首发名单。",
        risk: null },
      { t: "替他打", eff: { MECH: 2, TEAM: 2, energy: -10, coach: 1 },
        res: "你跟教练说你能顶。那场你打满三局，赢了。他在后台看着，没说话。",
        risk: null }
    ]
  }
];
