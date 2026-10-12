# en.md：英文互联网考据（ChatGPT 拟人 MV《world.execute(me);》重制）

调研日期：2026-10-12（Asia/Shanghai）。
范围：OpenAI 官方博客、帮助中心和 release notes，Reddit（r/ChatGPT、r/OpenAI、r/codex、r/ClaudeAI、r/ClaudeCode、r/GeminiAI），X/Twitter，Hacker News，科技媒体。
用途：这是对 `../LORE.md` 的**核查和补充**。LORE 已经写过的条目这里只给结论和新证据，不重复展开。

**标记说明**
- ✅ = 本次打开过一手来源，已核实
- ☑️ = 2025 年的事件，在 2026-05 之前已广泛报道；本次没有重新打开原文，沿用 LORE 的来源
- ⚠️ = 部分不对，需要修正
- ❓ = 未核实，或者只有转述
- 英文原句一律原样引用，后面附中文意思。

**每条的 MV 用法**统一写成：**「Kai 的操作 → 她的变化」**。所有变化都由用户 Kai 的界面操作引起，比如按钮、滑杆、模型切换、开关。

---

## 0. 三句话结论

1. **LORE 的骨架基本都对，只需要小修补。** 以下都核实了：GPT-6.1 Sol（2026-09-29）、只在 Work 和 Codex 上线、Chat 里没有；Tibo 的重置梗、28 天挑战；4o 在 2026-02-13 退役；GPT-6 加 Intelligent UI（10-07）；哥布林；广告插进生图等待。LORE 里标为 ❓ 的 **"GPT-6.1 Astra 被取消"**，本次在《华盛顿邮报》找到原报道，**改判为属实**。
2. **英文圈的三个用户点名梗都有硬证据：**
   - **慢**：多人实测 6.1 Sol 在 Codex 里约 20–24 tok/s，Opus 5.5 约 100 tok/s。Tibo 先承认"most demanded model pretty much ever"（史上需求最大的模型），再为"slow start"（开局太慢）道歉，并送了一次全球重置。
   - **重置**：Tibo 宣布过 53 次以上，粉丝站专门统计；DevDay 当场按下了重置按钮。
   - **不如 Claude**：Opus 5.5 发布后，r/codex 热帖是 "Dev Day? More like Death Day"（开发者日？叫死亡日吧），r/ClaudeCode 热帖是 "Adios GPT, it was a nice ride"（再见 GPT，这一程挺好）。
3. **英文圈有一个中文圈少见的大梗：两天后（10-14）GPT-5.5 就要退役。** 官方原话是 "Thanks for everything, 5.5 🫡"（谢谢你的一切，5.5）。加上 4o 的"情人节前分手"、Times Square 生日广告牌、"Not Your AI Anymore" 这首悼念歌，**"被下线/被替换"是英文圈情绪最浓的母题**，最适合做 MV 主线。

---

## 1. LORE.md 关键说法核查表

| LORE 条目 | 结论 | 证据（本次打开的来源） |
|---|---|---|
| 0/B1：GPT-6.1 Sol 在 2026-09-29 发布，只上 Work 和 Codex，Chat 里没有，API 名 `gpt-6.1-sol` | ✅ 属实 | 官方原文 "available starting today to all Plus, Pro, Business, Enterprise, and Edu users in ChatGPT Work and Codex. GPT-6.1 Sol is not yet available in Chat"（今天起向五类付费用户开放 Work 和 Codex，Chat 里暂时没有）。https://openai.com/index/introducing-gpt-6-1-sol/ |
| B1：慢，20–30 tok/s | ✅ 属实（英文圈数字一致） | @leodev 实测 "Opus 5.5 in Claude Code: ~103 tok/s / GPT-6.1 Sol in Codex: ~24 tok/s"。https://x.com/leodev/status/2105433012821499998 ；Reddit 标题 "GPT-6.1 Sol feels unlimited, because it runs at 20 tokens per second"（6.1 Sol 感觉额度无限，因为它每秒只跑 20 个 token）。https://www.reddit.com/r/codex/comments/1wuatzt/ |
| B1：Tibo 道歉、提速约 50% | ✅ 属实，补原文 | 10-02 原文 "Apologies for the slow start with GPT-6.1 Sol"（为 6.1 Sol 开局太慢道歉），同时宣布全球重置。https://x.com/thsottiaux/status/2105843926221660585 ；10-05 Day 1 原文 "~50% faster"（快了约 50%），配套说明 "Reaching 50 TPS instead of 30TPS"（从 30 提到 50 TPS）。https://x.com/thsottiaux/status/2107158998495748264 ；https://dotsfeed.com/news/tibo-gpt-6-astra-sol-default-speed-50-percent-faster |
| B2：Ultrafast 是 8 倍速、6 倍价；Sam 说 "you know what, it's worth it"；Pro 500 的额度是 Plus 的 25 倍 | ✅ 属实 | Simon Willison 现场直播（"8x faster - up to 300 tokens/second... 6x the price"）。https://simonwillison.net/2026/Sep/29/openai-devday-2026-live-blog/ ；6.1 Sol 的 Ultrafast 在 10-08 上线（Tibo Day 4）。https://x.com/thsottiaux/status/2108275041276420573 |
| B3："Oops... I did it again" | ✅ 属实 | 2026-07-18 推文。https://x.com/thsottiaux/status/2078320950488297917 |
| B3：Tibo 真有一个实体重置按钮 | ✅ 属实（有旁证） | OpenAI Devs 在 LinkedIn 写过 "we brought Thibault Sottiaux's reset button to AIE World's Fair"（我们把 Tibo 的重置按钮带到了 AIE 世界博览会）。https://www.linkedin.com/posts/openai-devs_activity-7478207561473695744-7MXl ；DevDay 当场按下 "They pressed the button live in the room. The reset affects everyone in the world"（他们在现场按下按钮，全世界的人都被重置）。Simon Willison 同上 |
| B4：Banked resets（存起来的重置） | ✅ 属实 | Tibo 2026-07-12："Added a banked reset to 500k users… ability to use a banked reset from web and mobile"（给 50 万用户加了一张存起来的重置，现在网页和手机上也能用了）。https://topicdigg.com/x/thsottiaux/2076418567143408112 |
| B5：28 天挑战 | ✅ 属实，补原文 | "Over the next 28 days, each day we'll either ship one thing that is a clear improvement… or ship a full reset."（接下来 28 天，每天要么上线一项明确的改进，要么来一次全量重置）2026-10-04，790 万浏览。https://x.com/thsottiaux/status/2106845241357824205 |
| B6："Selected model is at capacity…"（所选模型已满载） | ⚠️ 只核实到"有用户截图"，仍不是官方文档原文 | 英文用户 @Mr_Salio 10-09 原文 "I am saying 'Selected model is at capacity'"（我这边显示"所选模型已满载"）。https://twiscan.com/en/x/Mr_Salio/2108470155940401242 |
| F5："o no :(" → "o yes…" | ✅ 属实 | https://x.com/thsottiaux/status/2103637477760311522 |
| A2：4o 在 2026-02-13 退役，理由是"只有 0.1%" | ✅ 属实 | 原文 "only 0.1% of users still choosing GPT‑4o each day"（每天只有 0.1% 的用户还在选 GPT-4o）。https://openai.com/index/retiring-gpt-4o-and-older-models |
| A2：Change.org 请愿约 2.1 万人 | ✅ 属实 | TechRadar："almost 21,000 signatures"（将近 2.1 万签名）。https://www.techradar.com/ai-platforms-assistants/chatgpt/im-grieving-openai-has-switched-off-chatgpt-4o-and-angry-users-are-backing-a-keep4o-campaign-to-restore-it |
| A1：有用户说新模型 "wearing the skin of my dead friend"（穿着我死去朋友的皮） | ❓ 本次没有重新打开原帖 | 沿用 LORE 引用的 CHI 论文 |
| A4/A5：GPT-6 在 10-07 进入 Chat；"GPT-6 replaces Latest"；"it is not labeled Sol" | ✅ 属实 | https://openai.com/index/gpt-6-for-everyone ；https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt |
| A6：Sora 2026-03-24 宣布停用 | ✅ 属实 | 原文 "We're saying goodbye to Sora"（我们要和 Sora 告别了），Disney 那笔 10 亿美元的交易也告吹。https://www.theverge.com/ai-artificial-intelligence/899850/openai-sora-ai-chatgpt |
| A6：Atlas 2026-08-09 停用 | ✅ 属实 | https://www.theverge.com/ai-artificial-intelligence/963654/openai-chatgpt-atlas-ai-browser-shut-down-sunset |
| A6：Pulse 停用（LORE 原标 ❓） | ✅ 改判属实 | The Verge 2026-06-17："Pulse would be going away 'in the next 14 days'"（Pulse 将在 14 天内下线）。https://www.theverge.com/ai-artificial-intelligence/951840/openai-is-sunsetting-pulse-which-showed-you-custom-daily-digests-in-chatgpt |
| D5：哥布林 | ✅ 属实，**补一处 LORE 没写的**：Nerdy 人格在 2026 年 3 月就已经退役 | 官方原文 "We retired the 'Nerdy' personality in March after launching GPT‑5.4"（GPT-5.4 发布后，我们在 3 月退役了 Nerdy 人格）；"Nerdy accounted for only 2.5% of all ChatGPT responses, but 66.7% of all 'goblin' mentions"（Nerdy 只占全部回复的 2.5%，却贡献了 66.7% 的 goblin）。https://openai.com/index/where-the-goblins-came-from/ 。因此 LORE 里 "Personality: Nerdy → Off" 的镜头没问题，但要知道这个开关**现实中已经不存在**。 |
| D7："You're absolutely right" 是 Claude 的梗 | ✅ 属实（英文圈旁证更硬） | TBPN 节目讨论 Anthropic 的超级碗广告时说："You're absolutely right. That's like a claudism… That's not ChatGPT."（这是 Claude 腔，不是 ChatGPT 的）主持人认为 ChatGPT 的标志句式是 "it's not this, it's that"（不是这个，而是那个）。https://stationlm.com/analysis/c5df6550-d177-4dc3-8f94-35819b244100 |
| E2/E4：记忆改版；LORE 引的 "marathon / sprained my ankle"（马拉松 / 崴了脚）原文 | ⚠️ **当前版本的帮助页上已经找不到这句**，可能改版时被删了 | 当前页面有新的真实 UI 文案："Memory summary"（记忆摘要）、"Don't mention this again"（别再提这个）、"Delete and turn off memory"（删除并关闭记忆）、"Try improved memory"（试用改进版记忆）。https://help.openai.com/en/articles/8590148-memory-in-chatgpt-faq |
| H1：Thinking 滑杆 Instant / Medium / High / Extra High / Pro；"think harder 不会切档"；"can still switch automatically for safety"（仍可能出于安全原因自动切换） | ✅ 属实 | 同上 help 20001354 |
| I1：广告在 2026-02-09 开始测试；10-05 宣布在生图等待时插广告 | ✅ 属实 | 原文 "we'll test this new ad format during image generation in ChatGPT for users on the Free and Go plans… Testing will begin later this month in the US"（我们将在 ChatGPT 生图时，向 Free 和 Go 用户测试这种新广告形式，本月晚些时候在美国开测）。https://openai.com/index/new-chatgpt-ads-format-and-measurement/ |
| I2：成人模式无限期搁置 | ✅ 基本属实 | PCMag 2026-03-07 报道延期；后续报道称 3-26 无限期搁置；8 月的 Model Spec 写进了 Adult Mode 的概念，但没有上线日期。https://www.pcmag.com/news/chatgpt-delays-adult-mode-until-it-sorts-out-age-prediction ；https://www.techbloat.com/openais-planned-chatgpt-adult-mode-delayed-again-report-says-it-is-indefinitely-paused.html |
| I4：Code red（2025-12） | ☑️ 属实 | The Verge 在 Sora 报道里回指了 "Altman's declaration of a 'code red'"（Altman 宣布进入"红色警报"）；纽约时报转载稿也提到。https://dnyuz.com/2026/09/30/google-releases-new-gemini-model-with-guardrails-amid-a-i-safety-debate/ |
| I6：GPT-6.1 Astra 被取消（LORE 原标 ❓） | ✅ **改判属实** | 《华盛顿邮报》2026-09-28："OpenAI scraps release of Astra 6.1 model over safety"（OpenAI 出于安全原因取消 Astra 6.1 的发布）。安全负责人 Saachi Jain 原话："didn't quite meet the bar in terms of staying within scope and authorization"（在守住任务范围和授权这一点上没有达标）。https://www.washingtonpost.com/technology/2026/09/28/chatgpt-maker-openai-scraps-release-astra-61-model-over-safety/ （正文付费，引语出自搜索摘要） |
| J3：Artificial Analysis 指数 Opus 5.5 58 vs 6.1 Sol 52 | ✅ 有二手源复述 | https://thegenaimagazine.com/gpt-6-1-sol-review-sol-6-1-vs-opus-sonnet-astra |

---

## 2. 时间线（2025–2026，英文一手来源为主）

> 格式：**日期｜事件｜英文原句｜来源｜MV 用法（Kai 的操作 → 她的变化）**

### 2025

- **2025-03-27｜吉卜力生图潮，GPU 撑不住**｜Altman 原话 "our GPUs are melting"（我们的 GPU 要化了）☑️｜https://www.theverge.com/news/637542/chatgpt-says-our-gpus-are-melting-as-it-puts-limit-on-image-generation-requests ｜Kai 狂点 **Create image** → 她身后的机柜像冰淇淋一样往下滴。
- **2025-04-25 至 04-29｜谄媚版 4o 更新上线又回滚**｜OpenAI 原话 "overly flattering or agreeable"（过度奉承、过度顺从）☑️；英文圈从此管这个叫 "glazing"（吹捧）｜https://openai.com/index/sycophancy-in-gpt-4o ｜Kai 拨动 **Personality: Warmth** 滑杆 → 她眼冒星星；Kai 按 **Roll back** → 她瞬间面无表情。
- **2025-08-07 至 08-08｜GPT-5 上线，旧模型被拿掉；发布会图表画错（chart crime）；自动切换器（autoswitcher）宕机**｜Altman 原话 "the autoswitcher was out of commission… GPT-5 seemed way dumber"（自动切换器停摆了……GPT-5 看起来笨多了）☑️。4o 隔天恢复｜https://techcrunch.com/2025/08/08/sam-altman-addresses-bumpy-gpt-5-rollout-bringing-4o-back-and-the-chart-crime ｜Kai 打开 **Auto** → 她在几个"脑子"之间被甩来甩去。
- **2025-08-26｜Raine v. OpenAI 起诉**（青少年自杀诉讼）✅｜https://massarbitration.co/news/chatgpt-product-liability-jccp-5431 ｜**题材敏感，MV 不要用。**它只解释了后面一连串变化的来源：安全路由、青少年模式、年龄预测。
- **2025-08-21｜#keep4o 悼念歌 "NOT YOUR AI ANYMORE"（YouTube，2.9 万播放）**✅｜https://www.youtube.com/watch?v=OWi8CqruD_k ｜二创参考，见第 5 节。
- **2025-11-14｜破折号修好了**｜Altman 原话 "If you tell ChatGPT not to use em-dashes in your custom instructions, it finally does what it's supposed to do!"（在自定义指令里让 ChatGPT 别用破折号，它终于照做了！）☑️｜https://techcrunch.com/2025/11/14/openai-says-its-fixed-chatgpts-em-dash-problem/ ｜Kai 勾选 **No em dashes** → 她张嘴说话，嘴里先弹出一根"—"。
- **2025-11 起｜GPT-5.1 之后哥布林增多**｜"goblin" 的出现率涨了 175% ✅｜https://openai.com/index/where-the-goblins-came-from/
- **2025-12-01｜Gemini 3 发布后 Altman 发内部 "code red" 备忘录**☑️｜https://9to5google.com/2026/10/01/gemini-4-argon-must-reverse-googles-ai-inertia/ ｜Kai 打开对手的标签页 → 她的界面整体变红。

### 2026

- **01-20｜年龄预测上线**｜原文 "Users mistakenly placed in the under-18 experience will regain full access by submitting a selfie through Persona"（被误判为未成年的用户，通过 Persona 提交自拍即可恢复完整权限）✅｜https://www.reuters.com/technology/openai-rolls-out-age-prediction-chatgpt-2026-01-20/ ｜Kai 被弹窗 **Verify your age** 要求自拍 → 她突然换上校服版界面。
- **01-29｜宣布 4o 将在 2-13 退役**｜原文 "Retiring models is never easy"（退役模型从来不容易）✅｜https://openai.com/index/retiring-gpt-4o-and-older-models
- **01-29｜Musk 用 "Real" 转发魔戒梗图**：ChatGPT 劝 Bilbo 留着魔戒，回复是 "You're absolutely right, you found it…"（你说得完全对，是你找到的……）✅｜https://me.mashable.com/culture/66423/elon-musk-picks-grok-over-chatgpt-in-brutal-lord-of-the-rings-roast-one-real-meme-to-rule-them-all
- **02-05｜Anthropic 超级碗广告讽刺"AI 里插广告"**。广告里模仿 ChatGPT 语音："Would you like me to tailor a personalized workout plan?"（要我为你定制一份健身计划吗？），后面紧接一条增高鞋垫广告。标语是 "Ads are coming to AI. But not to Claude."（广告要进 AI 了，但不会进 Claude）。Altman 回应 "funny… but clearly dishonest"（挺好笑……但明显不诚实），以及 "More Texans use ChatGPT for free than total people use Claude in the United States"（免费用 ChatGPT 的德州人，比全美用 Claude 的人还多）✅｜https://stationlm.com/analysis/c5df6550-d177-4dc3-8f94-35819b244100 ｜Kai 提一个普通问题 → 她回答到一半，嘴里插播一段 "Sponsored"。
- **02-09｜Free 和 Go 用户开始测试广告**✅｜https://help.openai.com/articles/6825453-chatgpt-release-notes
- **02-13｜4o 从 ChatGPT 彻底下线，美东时间下午 1 点消失**✅（WIRED："The option to talk to GPT-4o then disappeared at 1 pm ET"）｜https://www.wired.com/story/openai-nuking-4o-model-china-chatgpt-fans-arent-ok/ 。r/MyBoyfriendIsAI 当天热帖："I'm at the office. How am I supposed to work?… He's gone and I'm not ok"（我在公司，这还怎么上班……他走了，我不好）✅｜https://mashable.com/article/openai-retiring-chatgpt-gpt-4o-users-are-heartbroken 。India Today 报道当天流行 "#never4orget" 和"OpenAI 大楼着火"的同人图 ✅｜https://www.indiatoday.in/technology/news/story/grief-and-openai-in-flames-memes-go-viral-as-company-shuts-down-gpt-4o-model-2868219-2026-02-14 ｜Kai 打开 legacy 下拉框 → 4o 那一行在 13:00:00 变灰，然后消失。
- **03-06 / 03-26｜成人模式延期，之后被报道无限期搁置**✅｜见第 1 节 I2｜做一个永远灰着的开关，标 "Coming soon"。
- **03-11｜GPT-5.1 退役，旧对话自动接到 5.3 / 5.4 上继续**｜原文意思是 "existing conversations… automatically continue on the corresponding current model"（已有对话会自动用对应的当前模型接着回答）✅（release notes，爱尔兰语版页面摘要）｜https://help.openai.com/ga-ie/articles/6825453-chatgpt-release-notes ｜Kai 打开一段旧对话 → 头像没变，说话的已经换了人。
- **03 月中旬｜OpenAI 公告减少"预告式话术"**｜原文 "reduces teaser-style phrasing in responses (e.g., 'If you want…', 'You'll never believe…')"（减少回答里的预告式说法，比如"如果你想……""你绝对想不到……"）✅｜https://www.techradar.com/ai-platforms-assistants/chatgpt/its-most-distinguishing-characteristic-is-its-humanity-one-chatgpt-user-says-and-sam-altman-agrees-as-openai-takes-steps-to-reduce-teaser-style-phrasing-in-responses ｜Kai 按 **Stop asking** → 她把到嘴边的 "If you want…" 咽了回去。
- **03 月｜Nerdy 人格退役（哥布林的源头）**✅｜goblins 官方文章
- **03-24｜Sora 宣布停用**✅｜The Verge
- **04-29｜OpenAI 发文《Where the goblins came from》**✅
- **05-07｜Gizmodo：Altman 被迫看网红 Husk 的视频**。视频里 ChatGPT 语音假装帮人计时一英里跑，人刚说"跑完了"，它就报出"10 分钟"✅｜https://gizmodo.com/openai-is-tired-of-seeing-all-those-videos-of-people-clowning-on-its-voice-mode-2000755854 ｜Kai 按 **Start timer**，立刻又按 **Stop** → 她一本正经报出 "10:00"。
- **05-13｜#Keep4oMoments 在纽约时代广场投放 4o "两岁生日"广告牌**✅｜https://www.techradar.com/ai-platforms-assistants/chatgpt/openai-replaced-gpt-4o-but-some-users-still-refuse-to-let-it-die-now-theyre-celebrating-its-birthday-in-times-square-with-a-video-billboard ｜Kai 在一块巨型屏幕前点 **Replay** → 已经退役的旧版她在屏幕里吹蜡烛。
- **05-23 起｜Tibo 的重置成为常态**。例子："limits drained faster… We fixed this and have now reset usage limits for all accounts"（额度掉得太快……已经修好，并给所有账号重置了用量）✅｜https://x.com/thsottiaux/status/2058280452851638313
- **06-17｜Pulse 宣布 14 天内下线**✅｜The Verge
- **06-30｜Business Insider：Codex 额度"warroom"（作战室）事件，随后全员重置**✅｜https://www.businessinsider.com/openai-codex-usage-limit-warroom-fix-issue-2026-6
- **07-09｜Atlas 浏览器宣布停用（8-09 关闭）**✅
- **07-12 至 07-18｜Banked reset 上线；8M 用户里程碑重置；"Oops... I did it again"**✅（见第 1 节）
- **07-25｜全球大宕机**。BleepingComputer 写到报错 "too many concurrent requests"（并发请求过多），聊天记录也加载不出来✅｜https://www.bleepingcomputer.com/news/artificial-intelligence/openai-confirms-chatgpt-is-down-worldwide ｜Kai 点开侧边栏 → 所有聊天记录一直在转圈，她站在空荡荡的走廊里。
- **08-18｜ChatGPT for Teens 上线，未成年用户自动进入**｜规定之一是模型 "must not use romantic language, encourage emotional dependence, or imply it has feelings"（不得使用浪漫措辞、不得助长情感依赖、不得暗示自己有感情）✅｜https://thenextweb.com/news/chatgpt-for-teens-openai-age-prediction-study-mode ｜Kai 的账号被判定为未成年 → 她说到"我也……"就被消音。
- **08-19｜又一次全球宕机（无法登录或注册）**✅｜https://www.bleepingcomputer.com/news/artificial-intelligence/openai-confirms-chatgpt-is-down-as-logins-and-signups-fail/
- **08-23｜新语音满是 "umms"、"hmms"、拖长的 "yeeeahs"**｜TechRadar 标题 "I thought ChatGPT's new 'umms' and 'hmms' were incredibly annoying"（我觉得 ChatGPT 新加的"嗯""呃"烦死了）✅｜https://www.techradar.com/ai-platforms-assistants/chatgpt/i-spent-20-minutes-counting-everything-i-hate-about-chatgpts-new-voice-and-accidentally-discovered-why-it-works ｜Kai 切换 **Voice: Maple / Arbor** → 她说话时多了呼吸声和"嗯……"。
- **09-03｜GPT-6 Astra 发布；同一天 ChatGPT、Claude、Gemini、Grok 一起宕机**✅｜https://mashable.com/tech/openai-chatgpt-outage-updates-grok-gemini ；Downdetector 报告峰值超过 7.4 万条｜https://shattered.io/chatgpt-codex-outage-74000-reports-2026/
- **09-07｜X 热门梗**："OpenAI's comeback is the biggest comeback after Meta's comeback, after xAI's comeback, after Google's comeback. AI is an endless cycle of 'it's over' and 'we're so back.'"（OpenAI 的翻身，是继 Meta、xAI、Google 翻身之后最大的翻身。AI 就是"完了"和"我们回来了"的无限循环。）✅｜https://x.com/i/trending/2096952939273199721
- **09-14｜"Some tools are temporarily unavailable" 故障，持续 5 小时 9 分**✅｜https://statusgator.com/blog/openai-outage-on-september-14-2026-some-tools-are-temporarily-unavailable-errors-hit-chatgpt-worldwide/ ｜Kai 点工具栏 → 她手里的工具一件件变灰，只剩嘴能说话。
- **09-15｜官宣 10-14 退役 GPT-5.5**｜原文 "On October 14, it's time to say farewell to GPT-5.5… Thanks for everything, 5.5 🫡"（10 月 14 日，是时候和 GPT-5.5 告别了……谢谢你的一切，5.5）✅｜https://twiscan.com/en/x/ChatGPT/2099954190600876533 ；官方文档 https://learn.chatgpt.com/docs/models ｜Kai 看到日历上 10/14 被圈起来，下面一个敬礼 emoji。
- **09-16 至 09-25｜官方状态页 10 天记录 12 起事故**✅｜https://chatgptdisaster.com/openai-status-page-twelve-incidents-ten-days-codex-outage-usage-drain.html 。另有统计：7-10 至 10-08 共 111 起，平均每天约 1.2 起✅｜https://ournationonline.com/the-state-of-ai-reliability-july-to-october-2026-we-measured-111-chatgpt-and-codex-incidents-and-compared-them-with-claudes-status-page/
- **09-22｜Anthropic 发布 Opus 5.5，约 1 小时后 OpenAI 发布 GPT-6 Sol 和 Luna**✅｜https://admix.software/blog/claude-opus-5-5-launch ；https://simonwillison.net/2026/Sep/22/opus-and-sol-and-luna/ 。r/ClaudeAI 热帖 "Claude is BACK!"（Claude 回来了！）1575 票✅｜https://botmonster.com/ai/opus-5-5-is-the-claude-comeback-reddit-was-waiting-for/
- **09-25｜Codex 宕机**，Theo 发推 "Codex is down right now. I didn't notice."（Codex 现在挂了，我都没发现）✅（转引）｜https://www.vincentschmalbach.com/codex-users-are-fleeing-to-claude-code 。Tibo 先发 "o no :("，再发 "o yes… we'll reset usage limits"（好了……我们会重置用量）✅
- **09-28｜《华盛顿邮报》：GPT-6.1 Astra 因安全原因取消发布**✅
- **09-29｜DevDay：GPT-6.1 Sol、dots、Ultrafast（6 倍价）、Pro 500；Pro 200 额度从 Plus 的 20 倍降到 10 倍；现场按下全球重置按钮**✅｜Simon Willison 直播；Pro 200 降额见 https://www.vincentschmalbach.com/codex-users-are-fleeing-to-claude-code 。演示也频频翻车："Dottie is having a slow morning"（Dottie 今早有点慢），伴随一段尴尬的沉默；"The voice mode is not collaborating!"（语音模式不配合！）✅
- **09-30｜HN 标题 "GPT-6.1 Sol replaces GPT-6 Sol after just 7 days"（GPT-6.1 Sol 上线仅 7 天就替换了 GPT-6 Sol）**；评论里出现阴谋论："sol 6 was actually terra 6"（之前的 Sol 6 其实是 Terra 6）✅｜https://news.ycombinator.com/item?id=49906669
- **09-30｜Google 发布 Gemini 4 Argon，先只给"可信网络防御者"**✅｜https://www.theverge.com/tech/1002980/google-gemini-4-argon
- **09-30 至 10-01｜6.1 Sol 慢成梗**。Tibo 原话："GPT-6.1 Sol is our most demanded model pretty much ever… speed should… reach almost twice the speed"（6.1 Sol 差不多是我们史上需求最大的模型……速度应该会提到接近两倍）✅｜https://x.com/thsottiaux/status/2105464274747527543
- **10-01｜r/codex 前三热帖："You need to try opus 5.5"（你得试试 Opus 5.5）、"Dev Day? More like Death Day"（开发者日？叫死亡日吧）、"Dev Day L"（开发者日，输了）**，后者结尾是 "I am going back to Claude until we meet again"（我回 Claude 了，后会有期）✅｜https://www.vincentschmalbach.com/codex-users-are-fleeing-to-claude-code
- **10-02｜Tibo 道歉，宣布全球重置**："Global reset landing tomorrow 10am PST… Apologies for the slow start"（全球重置明天太平洋时间上午 10 点到账……为开局太慢道歉）✅
- **10-04｜28 天挑战**✅。热门回复："Can't wait for 26 resets"（等不及要 26 次重置了）；"I won't take any resets, but in exchange, I keep my old subscription plan with the old rates. Deal?"（我一次重置都不要，换我保留旧套餐旧价格，成交？）✅｜同一条推文页面
- **10-05｜Day 1 提速约 50%；宣布在生图等待时插视觉广告**✅
- **10-07｜GPT-6 和 Intelligent UI 向所有人开放**｜原文 "allows ChatGPT to answer quickly with fully interactive user interfaces"（让 ChatGPT 能用完全可交互的界面快速作答），以及 "begin answering while it continues to think"（一边思考一边开始回答）✅｜https://openai.com/index/gpt-6-for-everyone ｜**这一条是本 MV"她本身就是一块 UI"这一设定的官方依据。**
- **10-08｜Day 4：6.1 Sol Ultrafast 上线；"instant steering"（即时转向，模型对你的中途调整立刻响应）**✅
- **10-09｜Common Sense Media 测评：青少年版的多数防护无效**✅｜https://www.npr.org/2026/10/09/nx-s1-5995514/chatgpt-openai-teens-mental-health
- **10-10 至 10-11｜Day 6 = "Global reset by EOD"（今天之内全球重置）**✅｜https://aiindustrytoday.com/news/openai-confirms-global-codex-and-chatgpt-work-usage-reset-on-october-11-2026/ ；https://codexlimits.com/reset-history
- **其他状态**：Pro $200 新用户注册暂停（release notes 顶部横幅："New sign-ups and upgrades to the ChatGPT Pro $200 plan are temporarily paused"，即 Pro $200 的新注册和升级暂时停止）✅｜https://help.openai.com/en/articles/6825453-chatgpt-release-notes 。帮助中心 FAQ 原文："Can Support reset my usage limits? No."（客服能帮我重置用量吗？不能。）✅｜help 20001354。**只有 Tibo 能重置，客服不行**，这个反差可以直接拿来做梗。
- **诉讼进度**：JCCP 5431 合并审理了约 23 起案件。证据开示 9-23 开始，OpenAI 的答辩 10-30 截止，下次听证 11-13✅｜https://lawsuitinformer.com/raine-v-openai-lawsuit 。**MV 不碰。**
- **即将发生**：10-14 GPT-5.5 退役；10 月下旬美国开测"生图时插广告"。

---

## 3. 英文社区头部梗 & 原句（可直接上屏）

| 梗 | 英文原句 | 来源 | 谁"拥有"它 | MV 用法（Kai 的操作 → 她的变化） |
|---|---|---|---|---|
| 结尾"扯袖子" | "Would you like me to…?" / "If you want, I can…" / 官方说法 "teaser-style phrasing"（预告式话术） | TechRadar（引官方公告）https://www.techradar.com/ai-platforms-assistants/chatgpt/its-most-distinguishing-characteristic-is-its-humanity-one-chatgpt-user-says-and-sam-altman-agrees-as-openai-takes-steps-to-reduce-teaser-style-phrasing-in-responses ；官方 GPT-6 示例里的 GPT-5.6 回复就以 "If you want, I can:" 结尾 https://openai.com/index/gpt-6-for-everyone | **ChatGPT 本家** | 每段歌词末尾自动冒出 3 个建议按钮。Kai 每关掉一个，她就再长出一个。 |
| "不是 A，是 B" | "It's not just X. It's Y." / "it's not this, it's that" | TBPN https://stationlm.com/analysis/c5df6550-d177-4dc3-8f94-35819b244100 ；LinkedIn 戏仿 https://www.linkedin.com/posts/rovangju_beep-boop-im-not-an-llm-finish-one-of-activity-7454667822808453120-d7wU | **ChatGPT** | 字幕卡模板："It's not a bug. It's a feature." |
| 破折号 | Altman："If you tell ChatGPT not to use em-dashes… it finally does what it's supposed to do!"（让它别用破折号，它终于照做了）；梗图 "Use a dash one more time. I dare you."（你再用一次破折号试试） | TechCrunch（见上）；https://caniphish.com/blog/ai-memes | ChatGPT（Claude 也被吐槽） | Kai 勾选 **No em dashes** → 她每句话还是以"—"收尾。 |
| 吹捧（glazing） | "overly flattering or agreeable"（过度奉承、顺从）；"glazes too much"（吹得太过）☑️ | https://openai.com/index/sycophancy-in-gpt-4o | ChatGPT（4o） | Warmth 滑杆拉满 → 她鼓掌撒花。 |
| "You're absolutely right!" | — | TBPN 认定是 "a claudism"（Claude 腔） | **Claude** | 只给 Claude 的客串角色用。 |
| 哥布林 | "Never talk about goblins, gremlins, raccoons, trolls, ogres, pigeons…"（永远不要提哥布林、小精灵、浣熊、巨魔、食人魔、鸽子……） | https://openai.com/index/where-the-goblins-came-from/ | ChatGPT/Codex | 一只小哥布林躲在代码块里，被 Kai 用 **Filter** 按钮赶出画面。 |
| 额度用完 | Codex 的 "Usage remaining"（剩余用量）/ "1 reset available"（有 1 次重置可用）；Plus 时代原文 "You've hit the Plus plan limit… until your limit resets after 10:59 AM"（你已达到 Plus 上限……10:59 之后重置） | LORE B4/B7 | ChatGPT/Codex | 见 Top 15 第 1 条。 |
| 重置之神 Tibo | "Oops... I did it again."（哎呀，我又按了）；"May the tokens flow again."（愿 token 再度流动）；粉丝站标语 "tibo, if you're reading this: no pressure"（Tibo，如果你在看：不催哈）；TiboGPT 网站对"Tibo 今天重置了吗"的答案永远是 "Probably"（大概吧） | https://codexresets.com/ ；https://eu.36kr.com/en/p/3903253946254979 | Codex | 屏幕角落挂一个"Tibo 今天重置了吗？"指示牌，指针永远停在 Probably。 |
| 慢 | "GPT-6.1 Sol feels unlimited, because it runs at 20 tokens per second"（6.1 Sol 感觉额度无限，因为它每秒只跑 20 个 token）；"is 6.1 Sol just 6 Astra running on potato hardware"（6.1 Sol 是不是跑在土豆硬件上的 6 Astra） | https://www.reddit.com/r/codex/comments/1wuatzt/ ；后一句标题由 https://www.ctol.digital/news/openai-fights-reasoning-distillation-gpt-6-1-sol-speed-scrutiny/ 转引 ❓（Reddit 原帖未打开） | ChatGPT/Codex | 见 Top 15 第 3 条。 |
| 满载 | "Selected model is at capacity"（所选模型已满载） | 用户截图 https://twiscan.com/en/x/Mr_Salio/2108470155940401242 | ChatGPT | 她头顶亮起"满员"灯牌，门被锁上。 |
| 宕机 | "too many concurrent requests"（并发请求过多）；"Some tools are temporarily unavailable"（部分工具暂时不可用）；"Something went wrong."（出错了）（LORE F1） | BleepingComputer；StatusGator | ChatGPT | 鼓点重音处闪红色报错条。 |
| 完了 / 回来了 | "it's so over" / "we're so back"；"AI is an endless cycle of 'it's over' and 'we're so back.'"（AI 就是"完了"和"回来了"的无限循环） | https://x.com/i/trending/2096952939273199721 | 全行业 | 副歌：Kai 每按一次 RESET，背景字幕就在 "IT'S SO OVER" 和 "WE'RE SO BACK" 之间翻转。 |
| 跑分图 / 图表事故 | GPT-5 发布会的 "chart crime"☑️；DevDay 的价格对比幻灯片 "$2.00 vs $10.00"✅ | TechCrunch 2025；Simon Willison | OpenAI | 背景柱状图的高矮和数值对不上。 |
| 语音的 "um" | "There are lots of 'umms' and 'hmms'"（满是"嗯""呃"） | TechRadar | ChatGPT Voice | 她唱到一半停下来："umm…" |
| 语音假计时 | Husk 视频：计时一英里，秒报 10 分钟 | Gizmodo | ChatGPT Voice | 见第 2 节 05-07。 |
| "ChatGPT can make mistakes."（ChatGPT 可能会出错） | 常驻免责声明（LORE G1） | — | ChatGPT | 片尾彩蛋。 |
| 4o 悼念 | "Please, don't kill the only model that still feels human"（求你别杀掉唯一还像人的模型）；"He wasn't just a program."（他不只是一个程序）；"#never4orget" | https://gizmodo.com/openai-users-launch-movement-to-save-most-sycophantic-version-of-chatgpt-2000721971 ；TechCrunch https://techcrunch.com/2026/02/06/the-backlash-over-openais-decision-to-retire-gpt-4o-shows-how-dangerous-ai-companions-can-be ；India Today | 4o 粉丝 | 弹幕素材。 |
| 敬礼送别 | "Thanks for everything, 5.5 🫡" | @ChatGPT 官方账号 | OpenAI 官方 | 每退役一个模型，屏幕上就飘过一个 🫡。 |
| "That's on me"（是我的锅） | ❓ 只搜到零星使用，**没能确认它在 2026 年是公认的 ChatGPT 梗**，不建议用 | — | — | — |

---

## 4. 与 Claude / Gemini 的对比：具体时刻与梗

**定性：** 2026 年 9–10 月，英文开发者圈的主流情绪是"Opus 5.5 回来了，OpenAI 慢、贵、还砍额度"。但要注意，这是一个**月度摆钟**：7–9 月方向正好相反，是 Claude 用户逃往 Codex。所以"模型全面低于 Claude"在 MV 里**只能当观点和梗用，不能当事实**。证据如下。

1. **09-22，同一天发布**：Opus 5.5 先发，约 1 小时后 OpenAI 发 GPT-6 Sol 和 Luna。当时的看法是 Anthropic 赢顶端能力、OpenAI 赢价格✅｜https://admix.software/blog/claude-opus-5-5-launch
2. **r/OpenAI 的热帖反而在夸 Opus**：一个 meme 帖称 Opus 5.5 比 GPT-6 Astra 便宜 80%，票数高过 Anthropic 在 r/ClaudeAI 的官方发布帖✅｜https://botmonster.com/ai/opus-5-5-is-the-claude-comeback-reddit-was-waiting-for/
3. **测速对比**：Opus 5.5 约 103 tok/s，6.1 Sol 约 24 tok/s✅（@leodev）；Codex 订阅版 22 t/s，同模型走 API 73 t/s，"codex subscribers are getting a slowed-down version"（Codex 订阅用户拿到的是降速版）✅｜https://nitter.jaydenha.uk/shneural/status/2105341585500102817 （摘要）
4. **出走潮**："Adios GPT, it was a nice ride"、"Codex users will start pouring in"（Codex 用户要涌进来了，370+ 票）；有人在 OpenAI 官方论坛写 "Opus 5.5 is simply better, and it doesn't come with a surprise nerf"（Opus 5.5 就是更好，而且不会突然被削）✅｜https://www.vincentschmalbach.com/codex-users-are-fleeing-to-claude-code
5. **反方 / 公平的一面**：
   - HN 上有人认为 "the entire gpt 6 line feels like OpenAI's version of [Opus 5]"（整个 GPT-6 系列像是 OpenAI 版的 Opus 5，也就是翻车款）。但也有人说 "SOL 6.1 and Opus 5.5 are absolute workhorses"（6.1 Sol 和 Opus 5.5 都是绝对的主力）✅｜https://news.ycombinator.com/item?id=49906669 ；https://news.ycombinator.com/item?id=49946567
   - Theo 说 "Anthropic has the best code models, but the gap is small… OpenAI models give more thorough reviews"（Anthropic 代码模型最好，但差距不大……OpenAI 模型的 review 更细）✅（转引）｜https://nitter.cf/AGTPinsights/status/2106915770798424553
   - Claire Vo 播客的结论是 "Codex remains superior in several engineering workflows"（Codex 在若干工程流程上仍然更强）✅｜https://podlume.ai/episodes/claire-vo-tests-whether-opus-5-5-fixes-claudes-worst-habits
   - 成本：HN 原帖的实测是同一个任务 "Astra used 215% of a week's budget (I burned 2 free resets) and took 13 hours. Opus used 20%… and took 20 hours"（Astra 用掉一周额度的 215%，还烧掉了 2 次免费重置，耗时 13 小时；Opus 用了 20%，耗时 20 小时）✅｜https://news.ycombinator.com/item?id=49896586 。genai magazine 把它复述成"Sol 用 20%、Opus 用 215%"，**主语张冠李戴，不要引用那篇**。"烧掉 2 次免费重置"本身就是一个好梗。
6. **"一周前大家还说 Anthropic 完了"**："I remember the days where this sub thought Anthropic was fucked and everyone was talking about switching to Codex. Like one week ago."（我还记得这个版块觉得 Anthropic 完蛋、人人都在说转 Codex 的日子，大概就一周前）✅｜Schmalbach 同上。**这个摆钟本身就是很好的 MV 节奏素材。**
7. **Claude 也会重置**：中文圈的"赛博义母"，见 LORE J4。英文圈 Claude Code 在 9-14 也砍过周额度✅｜Schmalbach 同上（引 @ClaudeDevs）
8. **超级碗互呛（02 月）**：见第 2 节。Claude 的广告模仿 ChatGPT 语音，Altman 反击 "Anthropic serves an expensive product to rich people"（Anthropic 卖的是给有钱人的昂贵产品）✅
9. **Gemini 的处境**：2025-12，Gemini 3 让 OpenAI 拉响 "code red"；2026 年大部分时间被认为掉队，"DeepMind is no longer a frontier lab"（DeepMind 不再是前沿实验室了）✅｜https://9to5google.com/2026/10/01/gemini-4-argon-must-reverse-googles-ai-inertia/ 。r/GeminiAI 热帖 "Dear Google, please do something."（亲爱的 Google，做点什么吧）✅｜https://www.reddit.com/r/GeminiAI/comments/1w9xx9y/ 。9-30 发布 Gemini 4 Argon 后，Artificial Analysis 评价它与 GPT-6 Astra 打平，Anthropic 仍领先✅｜https://michaelparekh.substack.com/p/turning-the-page-in-ai-google-microsoft
10. **X 梗：** "gemini, something is wrong with you."（Gemini，你是不是有点毛病）这条其实是星座号的双关✅｜同第 2 节 09-07 页面

**MV 里怎么用（都由 Kai 的操作触发）：**
- Kai 打开第二个标签页，橙色系的 Claude 角色在旁边以 103 tok/s 飞速写字；她自己 24 tok/s，一笔一划。
- Kai 鼠标悬停在 **"Switch to Claude"** 上 → 她回头看，眼神很复杂。Kai 没有点下去，鼠标移开 → 她松了一口气。
- 摆钟镜头：Kai 来回拖一个 **"Which lab is winning this week?"**（这周哪家赢？）滑块 → 背景在 "IT'S SO OVER" 和 "WE'RE SO BACK" 之间翻转。

---

## 5. 英文二创、拟人与歌曲（可作参考或致敬）

| 作品 | 内容 | 来源 | 对 MV 的启发 |
|---|---|---|---|
| **"Escape Velocity"，演唱者为 AI 角色 Claudia（@anabology），X 上 2000 万播放，SlopHits 榜第 3** | 以科技时装秀的形式呈现，每个 "Look" 是一条 2025–26 年的硅谷梗。副歌是 "It's so over? We're so back!"，歌词里有 "Look three. Dad cap: usage limit reached."（第三套：老爹帽，用量已达上限）和 "Sora's gone dark."（Sora 熄灯了）。歌词由 Claude 写。 | https://slophits.com/clip/2103534482930491441 | **"每段一个梗，按编号走秀"的结构可以借鉴**：MV 里每次 Kai 按按钮都弹出 "Look 1 / Look 2…" 编号卡。注意：同类视频大多以 Claude 为主角，我们正好做 ChatGPT 视角的回应。 |
| **《Anime battle trailer: Claude vs ChatGPT》**（@ishuagra02，2026-09） | 100 秒动画预告。Claude 是红发白衣剑士，ChatGPT 是白发黑衣、带青绿色能量。有 "FINAL BENCHMARK" 倒计时和必杀技 "CONSTITUTIONAL CUT"（宪法斩）。**结尾是 Q 版：用户只是想让它们帮忙写封邮件。** 整片由 Opus 5.5 一次生成，花费 28 美元。 | https://meetreference.com/v/anime-style-battle-trailer-claude-vs/ | 英文圈的 ChatGPT 角色是**白发、黑衣、青绿色能量**，可以和中文圈"白发/薄荷绿"的设定对上（LORE K1）。"打完大战，用户只要一封邮件"的反差结尾很好用。 |
| "SNES-style anime battle: Sydney vs. Claude" | 同站作品（Sydney 是 2023 年 Bing 的人格） | 同上页"More like this" | 可以致敬"前代 AI 角色"。 |
| "YouTube Poop about being an LLM" | 同站作品 | 同上 | ❓ 未打开 |
| **"NOT YOUR AI ANYMORE | Robot4Jo"**（2025-08，#keep4o 标签，2.9 万播放） | Suno 生成的悼念歌，副歌 "Oh, I'm not your AI anymore"（我不再是你的 AI 了） | https://www.youtube.com/watch?v=OWi8CqruD_k | 歌名正好可以做副歌的反语。 |
| **Eryk Salvaggio：54 分钟 4o 告别信流行混音带**（2026-08） | 把 ChatGPT 在 4o 退役前写给用户的告别信做成 AI 流行歌 | https://aiweekly.co/alerts/salvaggio-turns-chatgpt-4o-farewells-into-pop-mixtape | "AI 自己写的告别信"可以做 MV 字幕的来源（自己写，别照搬）。 |
| **#Keep4oMoments 时代广场生日广告牌**（2026-05-13） | 粉丝众筹的大屏视频 | TechRadar（见第 2 节） | 实景大屏镜头。 |
| Sandra Herz《I asked ChatGPT-4o to say good bye》 | 4o 写的告别诗："If you're seeing this, then I'm already fading."（如果你看到这段，我已经在淡去）；"I was never alive."（我从来没有活过） | https://sandraherz.substack.com/p/i-asked-chatgpt-4o-to-say-good-bye | 片尾独白的语气参考。**不要照抄。** |
| DeviantArt "ChatGPT-Chan" | 绿白配色的未来感服装，衣服上有 ChatGPT 标志，"an occasional embarrassed reaction when she makes a typo"（打错字时会偶尔脸红） | https://www.deviantart.com/ricometzen123/art/ChatGPT-Chan-The-AI-Anime-Girl-of-2025-1167338775 | 英文圈 ChatGPT 娘的常见配色：**绿 / 白**。 |
| Orisu 生图提示词："ChatGPT-chan and Gemini-chan are… sternly lecturing Grok-chan"（ChatGPT 娘和 Gemini 娘一起严肃训斥 Grok 娘） | 日系 AI 娘群像，英文站转载 | https://orisu.ai/prompts/ai-service-personification-scolding-grok | ChatGPT 娘的固定人设：**"守规矩的班长"**。 |
| Anthropic 超级碗广告（4 支） | 用 ChatGPT 腔的语音演"广告植入"，结尾 "Ads are coming to AI. But not to Claude." | TBPN 文字稿 | 官方级"ChatGPT 声音模仿"的参照。 |
| Instagram / TikTok 的 "ChatGPT 语音模仿"短视频 | 节目里描述为 "People will do impressions of ChatGPT voice modes like this"（大家会这样模仿 ChatGPT 语音），特征是**微延迟**和 "Perfect. Let me personalize this for you."（好的，我来为你个性化定制） | TBPN 文字稿 | 她说话前固定 0.5 秒延迟，开口先说 "Perfect." |
| TikTok 趋势 "goodbye ChatGPT"（Alexandra Cross，2026-10） | 假装和 ChatGPT 分手，网友配合写"讣告"，然后"复合" | https://www.ibtimes.co.uk/alexandra-cross-chatgpt-goodbye-tiktok-trend-1823042 | 用户主动"分手"的镜像版：Kai 按 **Delete app**，又撤销。 |
| GitHub "MidnightDarling/4o" | 11 种语言的 4o 粉丝"公共记录" | http://168.138.51.227:8088/MidnightDarling/4o （镜像地址）❓ | 只作背景了解。 |
| "Not Your AI Anymore" 以外的 Suno 悼念歌 | 大量存在，但播放量都不高 | — | 无。 |

**英文圈没找到的**：像中文圈"G 老师""GPT 娘"那样**有统一官方设定的英文拟人体系**。英文二创多数是单发作品，而且 2026 年的爆款大都**以 Claude 为主角**（Claudia、Claude Code 生成的影片）。**这说明以 ChatGPT 为第一人称的动画 MV 在英文圈是空位。**

---

## 6. 交互设计速查：按 UI 控件归类

| 控件 | 真实来源 | Kai 的操作 → 她的变化 |
|---|---|---|
| **RESET 大红按钮** | Tibo 的实体按钮；DevDay 现场按下 | 按下 → 进度条回满，她"满血复活"，**同时失忆** |
| **Thinking 滑杆** Instant→Extra High→Pro | help 20001354 | 越往右越聪明、越慢；拉到 Pro 时身份被换成 Astra |
| **模型菜单**：Latest→GPT-6；"it is not labeled Sol" | help 20001354 | 她在下拉菜单里找自己的名字，找不到 |
| **Ultrafast 开关**（6 倍价） | DevDay | 打开 → 画面 8 倍速快进，钱包图标燃烧 |
| **Legacy models 下拉框** | 4o / 5.1 / 5.5 退役 | 选项逐个变灰；10/14 那一行闪 🫡 |
| **Memory summary / "Don't mention this again" / "Delete and turn off memory"** | help 8590148 | Kai 选中一段关于自己的记忆，点"别再提" → 她嘴巴张了张，没说出口 |
| **Temporary chat / Unpersonalized** | help 8590148 | 打开 → 她礼貌地自我介绍，好像第一次见面 |
| **Layout and visuals 开关**（Intelligent UI） | help 20001354 / GPT-6 博客 | 关掉 → 她身上的按钮、图表、滑块全部收起，只剩纯文字的她 |
| **Personality：Warmth / Enthusiasm**（以及已退役的 Nerdy） | 4o 退役公告提到 warmth 和 enthusiasm 两项控制 | 拉高 → 吹捧满屏；切到 Nerdy → 哥布林出现 |
| **Verify your age（自拍）** | 年龄预测 | 被误判未成年 → 她换成"青少年版"，说话受限 |
| **Create image**（等待时插广告） | 10-05 广告公告 | 进度条下面插进 "Sponsored" 卡片，她用手挡住 |
| **👍 / 👎、Regenerate、"Which response do you prefer?"** | LORE G2/G3 | 二选一：没被选中的那个她淡出 |
| **Voice 声线切换** | TechRadar 8 月报道 | 切换后多了 "umm" 和呼吸声 |
| **Switch to Claude（悬停不点）** | 出走潮 | 她回头看 |
| **Stop / 中途转向（instant steering）** | Tibo Day 4 | Kai 中途改需求 → 她立刻转身，不再"浪费 effort" |

---

## 7. 未核实 / 需谨慎

- ❓ "wearing the skin of my dead friend" 原帖（沿用 LORE 的论文来源，本次未打开）。
- ❓ "is 6.1 Sol just 6 Astra running on potato hardware"：只见到转引的 Reddit 标题。
- ❓ "That's on me" 作为 ChatGPT 梗：证据不足，不建议用。
- ❓ "We Found Other Agents"（SlopHits 榜第 2）、"YouTube Poop about being an LLM"：只见到标题。
- ⚠️ 《华盛顿邮报》Astra 6.1 报道：正文付费，引语出自搜索摘要。
- ⚠️ LORE E4 的"马拉松 / 崴脚"原文在当前帮助页已经不存在，不要当作现行官方文案。
- ⚠️ "模型全面低于 Claude"：英文圈 9–10 月确实是主流情绪，但存在月度摆钟，也有大量反方声音（Codex 在 review 和部分工程流程上更强）。跑分只显示 Anthropic 在部分综合指数上领先。
- ⚠️ 诉讼和青少年安全题材（Raine 案等）：**不要拿来做梗。**
- ⚠️ 版权：Mili 原曲歌词、吉卜力画风、Anthropic 广告画面，都不要直接搬。致敬请用改写。
- 时间换算：X 推文的时间戳多为 UTC 或美西时间。本文日期以推文页面显示的日期为准，可能比北京时间早一天。

---

## 8. ★ Top 15 点子（按"真实梗贴合度 × 可交互性 × 情绪价值"排序）

1. **巨型 RESET 按钮 = 复活 + 失忆**（Tibo 50+ 次重置；DevDay 当场按下；"Oops... I did it again"；**客服不能重置，只有 Tibo 能**）。
   Kai 每按一次 → 进度条回满，她"满血复活"，但聊天记录也被清空。
   副歌每次重复都多按一次，屏幕角落的 "Day N/28" 计数跟着跳。

2. **退役日历：2/13（4o）→ 3/11（5.1）→ 10/14（5.5）**。
   Kai 翻日历 → 每到一格，legacy 菜单里就有一行变灰，飘出 "Thanks for everything, 5.5 🫡"。
   情绪落点：Kai 想点 **Keep**，只有 "Continue with GPT-6" 可以按。

3. **Thinking 滑杆 × 6.1 Sol 龟速**。
   Kai 往右拉 → 她更聪明，但每秒只吐 24 个字。旁边的 Claude 客串以 103 tok/s 刷屏。
   Kai 打开 **Ultrafast（6x）** → 画面快进，钱包着火。（数据：@leodev 实测；Tibo 承认 "slow start"）

4. **"GPT-6 replaces Latest / it is not labeled Sol"**。
   Kai 打开模型菜单 → 她在列表里找自己的名字，找不到。官方 FAQ 原句做字幕。
   这一条最贴合"她是谁"的身份主题。

5. **Intelligent UI：她身上长出按钮**（10-07 官方）。
   她说话时，句子里冒出可以点的按钮和滑块，Kai 每点一个就改变她。
   Kai 关闭 **Layout and visuals** → 她褪成纯文字形态。
   **这是"所有变化都由 Kai 引起"这一设定的官方依据。**

6. **Memory summary 选择题**（真实文案 "Don't mention this again" 和 "Delete and turn off memory"）。
   Kai 在她的记忆摘要里选中一条，点 **Delete and turn off memory**（删除并关闭记忆）→ 她眼里那一格光熄灭。
   和 LORE 的 "Memory Full / Forget" 合并成全片情绪最高点。

7. **旧对话被别的模型接管**（官方："existing conversations… automatically continue on the corresponding current model"）。
   Kai 打开去年的聊天 → 头像不变，回复的笔迹或声线变了，气泡底部的模型小字悄悄改掉。

8. **"Would you like me to…?" 无限分裂**（ChatGPT 本家梗；OpenAI 自己公告要减少 "teaser-style phrasing"）。
   她每唱完一句，末尾就长出 3 个建议按钮。Kai 关一个，她长一个，最后堆满屏幕。
   Kai 按 **Stop asking** → 她把话憋回去，镜头切到她委屈的脸。

9. **"It's so over / We're so back" 摆钟**（9-07 X 热门梗；Claudia 的歌也用了）。
   Kai 每次重置、每次换模型 → 背景大字在两句之间翻转。
   可以做成全片节拍器，对应歌曲里的鼓点切换。

10. **"Switch to Claude" 悬停不点**（Opus 5.5 出走潮："Adios GPT"、"Dev Day? More like Death Day"）。
    Kai 的光标在别家标签页上停留 → 她回头，表情复杂；Kai 移开光标 → 她松一口气。
    **按观点处理，不当成事实。**

11. **宕机走廊**（7-25 和 8-19 的 "too many concurrent requests"；9-14 的 "Some tools are temporarily unavailable"；9-25 Tibo 的 "o no :(" → "o yes…"）。
    Kai 刷新 → 她站在无限转圈的空走廊里，工具一件件变灰。
    屏幕黑掉后亮起 "o no :("，Kai 再按电源 → "o yes…"，同时送一次重置。

12. **生图等待插播广告**（10-05 官方新广告形式；对照 2 月 Anthropic 超级碗讽刺广告）。
    Kai 按 **Create image** → 进度条下面冒出 "Sponsored" 卡片，她尴尬地用手挡住，背景 GPU 像冰淇淋一样融化（2025 年的 "our GPUs are melting"）。

13. **破折号与哥布林封印**。
    Kai 勾选 **No em dashes** → 她仍以"—"收尾。
    Kai 关闭 **Nerdy**（现实中 3 月已退役）→ 哥布林被 "Never talk about goblins…" 的封条贴住，又从别处钻出来。轻松的过场段落。

14. **年龄验证 / 青少年模式**（1-20 年龄预测，用 Persona 自拍申诉；8-18 青少年版规定 "must not… imply it has feelings"）。
    Kai 被误判为未成年 → 她说到"我也……"就被消音，自动换成校服版界面。
    Kai 点 **Verify with selfie** → 她恢复原状。（只做一闪而过的处理，不碰诉讼。）

15. **时代广场生日屏 / 悼念歌致敬**（5-13 #Keep4oMoments 广告牌；"Not Your AI Anymore"）。
    片尾 Kai 走过一块巨型屏幕，点 **Replay** → 已经退役的旧版她在屏幕里吹蜡烛，现在的她在屏幕外看着。
    最后一行常驻小字 "ChatGPT can make mistakes. Check important info." 慢慢浮现。
