# ui.md：真实 ChatGPT 界面控件清单 + MV 交互语言 + 交互工具包规格

调研日期：2026-10-12。用途：world.execute(me); · ChatGPT ver.（v3，`STORY3.md`）。界面文字一律保留**原样英文**。

可信度标记：
- ✅ 已核实：本次打开过的 OpenAI 官方页面（帮助中心、发布说明或官方博客）。
- ◐ 部分核实：措辞来自二手报道或较旧的官方页面，2026 年的界面可能有出入。
- ❓ 未核实：凭记忆或通行做法写的，渲染前请看一眼实时截图。

主要来源（本次已打开）：
- [S1] GPT-6 and other models in ChatGPT（2026-10-07）：https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt
- [S2] ChatGPT release notes（截至 2026-10-09）：https://help.openai.com/en/articles/6825453-chatgpt-release-notes
- [S3] Memory in ChatGPT：https://help.openai.com/en/articles/8590148-memory-faq
- [S4] Temporary chat in ChatGPT：https://help.openai.com/en/articles/8914046-temporary-chat-faq
- [S5] Customizing Your ChatGPT Personality（帮助中心，2026-03 存档）：https://help.openai.com/en/articles/11899719-customizing-your-chatgpt-personality ／ https://archive.ph/26dB3
- [S6] Characteristics in ChatGPT：https://help.openai.com/en/articles/20001038-characteristics-in-chatgpt
- [S7] Troubleshooting ChatGPT Error Messages：https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages
- [S8] Age prediction in ChatGPT：https://help.openai.com/en/articles/12652064-age-prediction-in-chatgpt
- [S9] Memory and new controls for ChatGPT（OpenAI 博客，2024）：https://openai.com/index/memory-and-new-controls-for-chatgpt/
- [S10] 广告：OpenAI《Testing ads in ChatGPT》https://openai.com/index/testing-ads-in-chatgpt；MediaPost 2026-06-30 报道的 “Sponsored” 改为 “Ad”：https://www.mediapost.com/publications/article/416199/chatgpt-ads-to-compete-with-google-maps.html；News18 2026-09-05（印度截图里的标签是 “Ad”）
- [S11] Branch in new chat：Lifehacker、Tibor Blaho 的 Threads 帖（“Branch · …” 前缀，“Branched from …” 分隔线）、2026 年 5–9 月的 OpenAI 社区帖（版本切换箭头被移除，改成 “See Versions”）

---

## 0. 结论先行：哪些点会影响我们现有的片子

1. **Thinking 滑杆是真实存在的控件。** 2026-10-07 起，模型菜单里有一根 **Thinking** 滑杆，档位依次为 **Instant · Medium · High · Extra High · Pro**（[S1] ✅）。S12、S50 的“拖滑杆”因此完全写实，档位就按这五个标。
2. **Web 端的模型选择器不在顶栏，在输入框（composer）里。** 2026-04-28 起如此（[S2] ✅ “Model selection now appears in the composer”）。移动端仍在对话顶部。`ui.js` 的 `gpt()` 现在把 “ChatGPT ▾” 画在顶栏，这是 2025 年的布局。建议改成：顶栏左侧放 “ChatGPT”，composer 内左下放模型 chip（如 “GPT-6 ▾” 或 “Instant ▾”）。若刻意保留 4o 时代的顶栏也说得通，但要统一。
3. **Personality 的真实选项**（[S5] ✅）：Default、Professional、Friendly、Candid、Quirky、Efficient、Cynical。**Nerdy 已于 2026-03-17 下线**（[S2] ✅ “Sunsetting the ‘Nerdy’ base style”）。STORY3 S13 写的 “Cynic / Robot / Nerdy / Off” 里，Robot、Listener 是 2025 年旧预设名，现在已不存在。要写实的话改为 **Cynical → Efficient → Nerdy（灰掉，标注 retired）→ Default**；要保留梗，就在字幕里注明“旧版预设”。
4. **Temporary Chat 只能在第一条消息之前开启，开始对话后不能再切换**（[S4] ✅ “You cannot change personalization after the conversation starts”）。按钮文字是 **Temporary**，开启后要先选 **Personalized / Unpersonalized**。S14 的“来回闪切”违背真实行为，作为 MV 夸张可以接受；更写实的做法是每次切换都伴随 **New chat**（每闪一次就是一个新的空白窗口），反而更狠。
5. **“Memory full” 已是旧版 UI。** 2026-06 起默认的是 improved memory，靠一份自动更新的 **Memory summary** 记忆，不再写满（[S3] ✅，第三方称 Plus/Pro 容量翻倍◐）。“Manage memories” 列表和 “Memory full” 只在旧版 **Saved memories** 体验里出现。S30/S33 想用的话，设定上就让 Kai 用旧版列表；画面里可以放一个 “Saved memories” 标签作说明。
6. **广告标签已从 “Sponsored” 改为 “Ad”**（[S10] ◐：MediaPost 2026-06-30，加上 News18 9 月的截图）。广告只出现在 **Free 和 Go** 套餐、成年且已登录的用户，位于回答末尾下方，单独一张卡片。另外 2026-10 起在测试**图片生成时旁边出现的图片广告**，恰好对应 S46 “生成卡住、广告照放”，而且是真事。注意：Kai 要是 Plus 用户就看不到广告。S26 的限额横幅写的是 “Plus plan limit”，与此冲突，二者需择一：改成 Go，或者删掉广告。
7. **Regenerate 现在藏在回答下方 ⋯ 的 retry 菜单里**（[S2] ✅ 2026-03-17：“regenerate responses … by clicking on the three dots underneath the response”）。“‹ 2 / 5 ›” 翻页器 2026 年在 web 端被拿掉了，换成 “See Versions”（[S11] ◐，社区帖）。我们的翻页器是全片母题，建议保留，算 4o 时代的回忆；如需写实，可让 C 部分的翻页器“坏掉”或换成 “See Versions”。
8. **GPT-4o 已于 2026-02-13 在 ChatGPT 下线**（[S2] 标题 “Retiring GPT-4o and other legacy models” ✅；具体日期按 STORY3/LORE 原文）。**GPT-6 于 2026-10-07 上线**，模型菜单里叫 “GPT-6”，“it is not labeled Sol”（[S1] ✅）。S54 那句提示语就出自这里，可放心用。

---

## A. 真实 ChatGPT 界面控件清单（2026 年末，Web 桌面为主）

每一项依次列出：确切文字、位置、外观、触发它的光标动作，以及可信度。

### A1. 模型选择器与 Thinking（思考强度）
- **位置**：Web 端在 composer 内，紧挨着输入框（[S2] ✅ 2026-04-28）；iOS/Android 在对话顶部（[S2] ✅ 2026-06-10）。
- **菜单结构**（[S1] ✅，2026-10）：
  - 模型行：**GPT-6**（取代原来的 “Latest”）、**GPT-5.6 Sol**，其余旧模型同样可选（“older selectable models are not being retired”）。
  - **Thinking** 滑杆，档位：**Instant**（“Fast responses for everyday questions.”）· **Medium**（“Standard thinking.”）· **High**（“Extended thinking.”）· **Extra High** · **Pro**。
  - 套餐限制：Plus 用户拿不到 Extra High 和 Pro。Free/Go 用户没有滑杆，只有一个 **Think** 按钮（[S1] ✅；Web 端见 [S2] 2026-08-14 “Use Think on Free and Go”）。
  - 改名历史（[S2] ✅ 2026-06-10）：Thinking-Light 删除；Thinking-Standard 改名 Medium；Thinking-Extended 改名 High；Thinking-Heavy 改名 Extra High；另有 Pro Standard 和 Pro Extended。2026-03 至 06 月间菜单曾是 **Instant / Thinking / Pro** 三档，外加 **Configure** 入口（“Auto-switch to Thinking”、legacy models、thinking effort）（[S2] ✅ 2026-03-17）。
  - 设置项（[S1] ✅）：Settings 里的 **Layout and visuals**，关掉后视觉元素减少。这就是 S09 用的开关。
- **外观**（❓，按 OpenAI 通用设计推断）：圆角弹出菜单，深色模式底色约 #2f2f2f，行高约 40px，当前选中项右侧有 ✓。滑杆是一条细轨道，每档一个刻度点，下方一排档位标签，当前档加粗。
- **光标动作**：点 chip 打开菜单，点模型行切换模型，拖动或点击滑杆刻度改变思考强度。
- **回答中的反馈**：思考时显示带微光动画（shimmer）的 “Thinking”。完成后变为 “Thought for 12s” 这类可展开的标签（◐，2025 年起常见）。GPT-6 可能边想边答（[S2] ✅ “begin answering while it continues to think”）。

### A2. Personality / Customize ChatGPT
- **路径**：右下或左下头像 → **Personalization**（[S6] ✅ “Select the profile icon … Open Personalization”）。
- **Base style and tone** 下拉（[S5] ✅）：**Default · Professional · Friendly · Candid · Quirky · Efficient · Cynical**。Nerdy 已下线（[S2] ✅ 2026-03-17）。
  - 官方描述（[S5]）：Cynical 为 “Sarcastic and dry, delivers blunt help with wit.”；Efficient 为 “Concise and plain…”；Friendly 为 “Warm and chatty…”。
- **Characteristics**（[S6] ✅）：**Warm · Enthusiastic · Headers & Lists · Emoji**，每项是一个三选一下拉 **More / Default / Less**（◐ TechRadar、Daves Computer Tips；官方帮助页写作 “(+)/(–)”）。注意它们不是滑杆。MV 里画成滑杆属于艺术夸张；要写实就画成下拉。
- **Custom instructions** 文本框（字数上限 2026-07 提到 5,000，[S2] ✅）。旧版字段名（2025）：“What should ChatGPT call you?”、“What do you do?”、“What traits should ChatGPT have?”、“Anything else ChatGPT should know about you?”（◐）。STORY3 S03 写的 “Anything else ChatGPT should know?” 少了 “about you”，建议补上。
- **Fast answers** 开关也在 Personalization 里（[S2] ✅ 2026-04-22）。
- **光标动作**：头像 → Personalization（或经 Settings 弹窗左侧菜单）→ 点下拉 → 选中一项。设置页一般自动保存，没有 Save 按钮（❓）。S03 的 “Save” 若要写实，可改为关闭设置弹窗时出现 toast。

### A3. Memory
- **路径**（[S3] ✅）：**Settings → Personalization → Memory**。可见控件因账号而异：**Memory**、**Reference saved memories**、**Reference chat history**、**Memory summary**、**Manage**、**Saved memories**。
- **改进版（2026-06 起默认）**：
  - **Memory summary** 是一页自动更新的概要。可在底部文本框里输入更正，也可高亮文字后更正；部分内容有 “Don't mention this again”；⋯ 菜单里有 **Delete and turn off memory**（[S3]、[S2] 2026-06-12 ✅）。
  - 回答下方可能出现 **Sources**，列出这次用到的记忆或旧对话（[S3] ✅）。
  - 新旧切换：Memory 页里点 **Saved memories** 可回到旧版；旧版里有 **Try improved memory**（[S3] ✅）。
- **旧版（Saved memories 列表）**：
  - 回答上方的内联标签 **“Memory updated”**，悬停后出现 **“Manage memories”**（[S9] ✅）。真实界面里它是回答顶部一行小灰字加图标，不是浮动 toast；我们的 toast 属于风格化处理。
  - 写满时的文字（◐，社区帖原文）：**“Memory Full”**，副文 **“ChatGPT memory is full. You can forget existing memories to make space.”**；接近满时显示 **“Memory almost full. Once memory is full, new memories won't be created.”** 外加百分比（◐ TheWindowsClub）。
  - Manage memories 弹窗：每条记忆一行，右侧垃圾桶图标，底部 “Delete all”（❓，2024 年版写作 “Clear ChatGPT's memory”◐）。**界面上没有叫 “Forget” 的按钮。** “forget” 是对 ChatGPT 说的话。STORY3 S33 的 “Forget” 写实改法：点垃圾桶图标，或在 summary 上高亮后点 “Don't mention this again”。
- **光标动作**：悬停 “Memory updated” → 点 “Manage memories”，或者打开 Settings → Personalization → Memory → Manage。

### A4. Temporary Chat
- **按钮**：新对话页右上角，标签 **Temporary**（[S4] ✅ “Open a new chat. Select Temporary.”）。图标 ❓（历史上是虚线对话气泡）。
- **2026 新增**：开启后、发第一条消息之前，选择 **Personalized** 或 **Unpersonalized**（[S4] ✅）。Unpersonalized “Does not use memory, custom instructions, or plugins.”
- **开启状态**：页面中央是临时对话说明文字，旧版为 “Temporary Chat — This chat won't appear in history, use or update ChatGPT's memory, or be used to train our models.”（◐，2024–25）。按 2026 规则，该文案多半已改写，需截图核对。
- **2026 新功能**：临时对话可以 **save**，保存后变为普通对话（[S4] ✅）。
- **光标动作**：点 Temporary，再选 Personalized/Unpersonalized，然后输入。

### A5. Regenerate / Try again / Branch / 版本
- **回答下方的操作条**（悬停时显示，◐）：Copy · 👍 · 👎 · Share · ↻（retry）· ⋯。
- **Retry 菜单**（[S2] ✅ 2026-03）：点 ⋯（或 ↻）会弹出菜单，可以换 Thinking 或 Pro 重新生成。旧版选项有 “Try again”、“Add details”、“More concise”，以及 “Switch model”（◐，2025）。
- **Branch in new chat**：悬停消息 → **More actions (⋯)** → **Branch in new chat**。新对话在侧栏显示为 “Branch · {标题}”，对话内出现分隔线 “Branched from {title}”（[S11] ◐）。
- **版本切换**：“‹ 2 / 3 ›” 箭头在 2026 年 web 端被移除，改为 **See Versions**（◐，社区帖 2026-05 至 09）。
- **错误时**：显示 **“There was an error generating a response.”** 加一个 **Regenerate** 按钮（[S7] ✅）。

### A6. Edit message（编辑用户消息）
- 悬停用户气泡，下方出现 ✎ 和 Copy 图标（❓）。点 ✎ 后气泡变成文本框，配 **Cancel / Send** 两个按钮（◐，2025）。
- 2026 年部分用户反映，新版 Chat 里编辑和 Try again 消失了（社区帖 2026-07 ◐）。保守做法：可以画，不用作关键情节点。

### A7. 👍 / 👎 与反馈弹窗
- 👍 tooltip 为 **“Good response”**，👎 为 **“Bad response”**（◐，2024–25 常见）。点击后图标变实心。
- 👎 之后弹出 “Tell us more” 类面板，有分类 chip（◐，2024 年研究论文 arXiv 2408.15066 引用的原文）：“Don't like the style”、“Not factually correct”、“Didn't follow instructions”、“Refused when it shouldn't have”、“Being lazy”，外加文本框和 Submit。2026 版措辞未核实 ❓。OpenAI 官方说明：“Click the thumbs down icon below any response to provide feedback, or select Report”。
- **A/B 对比卡**：两个并排回答，标题 **“Which response do you prefer?”**，副文 “Responses may take a moment to load.”，每栏底部一个 **“I prefer this response”** 按钮（◐，2024–25 记忆，arXiv 论文 Fig.6 证实存在“pairwise feedback”形态）。
- **光标动作**：悬停出 tooltip，点击后图标填充；A/B 卡里点某一栏的 “I prefer this response”。

### A8. Voice
- composer 右侧有 **Voice** 按钮（波形图标；登出页可见 “Voice” 文字◐），旁边是 **dictation** 麦克风。
- 2026-07 推出 **GPT-Live-1**，Voice 可调用 GPT-5.6 或 GPT-6 Astra，用与文字相同的模型和强度控件选择（[S2] ✅ 2026-07-08 / 09-09）。
- 界面：中央一个呼吸的蓝白球（或在对话内嵌显示），底部有 mic mute 和红色 **End** 按钮（❓，2025 年版式）。
- **声音选择**：Settings → Voice。2025 年的音色名有 Arbor、Breeze、Cove、Ember、Juniper、Maple、Sol、Spruce、Vale（❓ 凭记忆）。**界面上没有 F/M 性别开关。** S25 的 “F / M” 写实改法：在音色名之间切换，比如 Juniper 换 Cove，用歌词字幕承担 F/M。

### A9. 图片生成
- 2026-09 为 **ChatGPT Images 2.5**（[S2] ✅），侧栏有 **Images** 入口（◐）。
- 生成中是一张占位卡，从上到下逐渐清晰，配 “Creating image” 字样（◐，2025 年 4o 图像的典型表现：自上而下的模糊揭示）。我们的 `reveal` 与真实效果一致。
- 2026-10 测试：Free/Go 用户在图片生成时旁边出现图片广告（[S10] ◐ Mashable / 9to5Google 2026-10-05）。

### A10. Canvas / Intelligent UI / Sites
- Canvas 是右侧编辑面板（2024 起）。2026 年的新主角是 **Intelligent UI**：回答里直接嵌入图表、按钮、表单、滑块、计算器、小游戏（[S1][S2] ✅ 2026-10-07）。S09–S11 和 S50 的“在回答里拖动图表手柄”因此完全写实，可以算本片最贴合时事的一点。
- 另有 2026-03 的 “interactive visual module”，可在数理题中调整变量（[S2] ✅）。

### A11. Projects / Library / 侧栏
- 侧栏（Web，◐）：**New chat**（Ctrl+Shift+O）、**Search chats**（Ctrl+K）、**Library**、**Images**、**Projects**、**Apps/Plugins**、**Codex**，然后是 **Chats/Recents** 列表。OpenAI 2026-10 官方配图可见 “Library, Projects, Scheduled and Plugins”（mixed-news 转述◐）。
- 2026-07 新桌面 app 顶部有 **Chat / Work / Codex** 切换器（[S2] ✅）。
- 旧版按时间分组 “Today / Yesterday / Previous 7 days / Previous 30 days”。2025 年后多数界面改为单一的 “Chats” 列表 ❓。我们的老化效果建议改成：对话条目逐渐被新条目挤下去，或者改用 Search 结果里的日期。
- 每个对话条目悬停时右侧出现 ⋯，菜单为 **Share · Rename · Archive · Delete**，另有 “Add to project”（◐）。
- Projects：⋯ → **Project settings** → Memory：**Default memory / Project-only memory**（[S2] ✅ 2026-08-14）。

### A12. 用量限制与错误横幅
- 官方错误文字（[S7] ✅）：**“Something went wrong.”**、**“There was an error generating a response.”**（配 **Regenerate**），排障说明里还提到 **“Stop generating”** 和 **“Regenerate”** 按钮。
- 其他常见（◐，第三方汇编）：**“A network error occurred.”**、**“Error in message stream”**、**“An unknown error occurred”**、**“Too many requests in 1 hour. Try again later.”**、旧版的 **“You've reached our limit of messages per hour. Please try again later.”**
- 限额（◐）：composer 上方出现横幅，大意为 “You've hit the {Plus/Free} plan limit for {model}. Responses will use another model until your limit resets after {time}.”，附 **Upgrade** 按钮。精确措辞未核实。[S1] 只确认 “ChatGPT displays when an allowance resets”，以及 Pro 达到上限后会“automatically switches to GPT-5.6 Thinking at Medium”。
- 页脚：**“ChatGPT can make mistakes. Check important info.”**（◐，长期不变）。

### A13. Share / Archive / Delete
- 顶栏右侧有 **Share** 按钮（上传箭头图标）。弹窗标题 “Share public link to chat”（◐），主按钮 **Create link**，生成后变为 **Copy link**（❓）。
- **Delete**：确认弹窗标题 **“Delete chat?”**，正文 “This will delete **{title}**.”，两个按钮：**Cancel**（灰）和 **Delete**（红底白字）（◐，2024–25 截图记忆）。
- **Archive**：没有确认框，条目直接消失，出现 toast（❓）。

### A14. 账户与年龄验证
- **Settings → Account → Verify age**，也可访问 chatgpt.com/verify_age。第三方 Persona 负责，可能要求 live selfie 和/或证件（[S8] ✅）。
- 被预测为未满 18 岁的账户自动进入 **ChatGPT for Teens** 体验（[S8] ✅）。另有成年时的提示 “you now have access to more features and settings”，配 **Learn more** 和 **I'm under 18**（[S2]/帮助中心 ✅ “What changes when a ChatGPT user turns 18”）。

### A15. 广告
- 仅限 Free/Go 套餐、已登录的成年用户；敏感话题（健康、心理健康、政治）不投放；Plus 及以上没有广告（[S10] ✅ OpenAI）。
- 位置在回答末尾下方，单独一张卡片：广告主名称、favicon、标题、描述、图片、链接。标签原为 “Sponsored”，2026-06 起为 **“Ad”**（◐）。卡片带 ⋯ 菜单，可 dismiss 广告，也可查看 why this ad（[S10] ✅ “dismiss any ad and tell us why”）。

### A16. 其他可用的真实细节（可作彩蛋）
- 2026-10-09：Codex 的 composer 有 **Tab 接受建议**（灰色预测文字），即 “Composer predictions”（[S2] ✅）。可做成 Kai 打字时出现的灰色预测，Kai 按 Tab 接受，是现成的“她替他说完”的画面。
- 2026-06-17：**Scheduled tasks**（[S2] ✅）。
- 2026-05-07：**Trusted contact**（[S2] ✅，标题已见，细节未读）。
- 欢迎语轮换（◐）：“What can I help with?”、“What's on your mind today?”、“Where should we begin?”、“Ready when you are.”

---

## B. 交互语言：怎样让代码画的屏幕“看起来有人在操作”

### B1. 参考作品，以及它们为什么读起来像真人在操作
| 作品 | 能借鉴的点 | 可信度 |
|---|---|---|
| **Searching**（2018，Aneesh Chaganty） | 打一行字、停顿、删掉、重打，“犹豫”本身就是表演。光标在 Send 上悬停不点。缓慢的 zoom-in 推到关键 UI 上，用镜头替观众“看重点”。 | ✅ 常识级 |
| **Unfriended**（2014）/ **Dark Web**（2018） | 实时、无剪辑的桌面；鼠标抖动；打字错误；连接卡顿和错误本身是剧情。 | ✅ |
| **Noah**（2013 短片，Cederberg & Woodman） | 光标速度就是情绪：慌乱时快速甩动、来回点击，冷静时直线移动。浏览器标签页之间切换来做叙事剪辑。 | ✅ |
| **NEEDY STREAMER OVERLOAD / “INTERNET OVERDOSE”“INTERNET YAMERO”**（Aiobahn feat. KOTOKO） | 伪 OS 桌面加窗口弹出。每个视觉事件都卡在鼓点上。窗口带像素风开合动画（scale 加阶梯帧）。 | ◐ 视频已确认，分析为个人判断 |
| **稲葉曇 Inabakumori 系 PV（如 “Relayouter”）** | 扁平 UI 碎片、平面图形、强节奏剪切，UI 是“乐器”。 | ❓ 风格描述凭记忆，建议亲看 |
| 米津玄師 / ハチ 早期 nico PV | 不是 UI 类，可借的是手绘和限帧（12fps）节奏，我们已在用 `fx.step`。 | ◐ |

**共性：** 观众相信“有人在操作”，靠的不是 UI 画得多像，而是四件事：
1. **因果先行**：光标先到，界面后变。延迟 60–120ms，绝不能同时发生，更不能界面先动。
2. **不完美**：路径带弧线、轻微过冲、偶尔停顿和犹豫、打错字再删。
3. **反馈齐全**：每次操作都有 hover、press、release 三段状态，并留下痕迹，比如勾选、计数变化、toast。
4. **注意力引导**：镜头或缩放跟着光标走，光标就是“眼睛”。

### B2. 各动作的动画规范（60fps；时间单位为秒）
**光标移动**
- 时长用 Fitts 定律：`T = 0.10 + 0.13·log2(D/Wt + 1)`，D 为距离 px，Wt 为目标宽度。一般在 0.25–0.7s 之间。音乐卡点时直接用拍长（0.4615s），并让**到达时刻比拍子早 1–2 帧**，点击才能正好落在拍上。
- 路径用三次贝塞尔，中点向一侧偏移 `D×(0.06–0.15)`，方向随种子决定。缓动用 minimum-jerk：`s = 10u³ − 15u⁴ + 6u⁵`，比 ioC 更像人手。
- 过冲：小目标（宽 < 40px）或情绪急切时，越过目标 `4–10px`，再用 0.08–0.12s 回正。
- 静止时的手抖：幅度 0.6–1.2px 的低频噪声（noise1，约 0.7Hz）。完全静止的光标一看就是假的。
- 犹豫（S53 那种）：在目标前 20–40px 停住，0.3s 后挪近一半，再停一下，最后点下去。
- 情绪映射：平静时速度均匀；慌乱时 T 乘 0.6，加大过冲，偶尔点歪再补点；疲惫时 T 乘 1.4，路径更弯，中途停顿。

**悬停（hover）**
- 进入目标后，背景用 0.12s 渐变到 hover 色（深色模式下在底色上叠约 6–8% 白）。光标在按钮上可换成 pointer 手形（可选：箭头换手指，与 S01“指尖”统一）。
- 悬停约 0.5s 后出现 tooltip：黑底圆角 6px、白字 13–14px，0.1s 淡入，同时上移 4px。

**点击（press / release）**
- 按下（0 至 0.08s）：按钮 scale 到 0.96，颜色加深约 8%；光标 scale 到 0.9（我们的风格可额外加一点“压扁”）。
- 松开（0.08 至 0.2s）：scale 用 spring 回到 1（`K.spring`，w 18，ζ 0.6）。从点击点扩散一圈波纹（已有 `ripple`），半径 8 到 50，时长 0.4s。
- 结果：在松开后 60–120ms 才发生（因果延迟），比如菜单打开、开关翻转、计数加一。
- 节拍处理：按下帧对齐 `KICKS`，结果帧对齐下一个 1/8 拍。要有“声音感”，可在按下帧加 1 帧 2–4px 的局部屏幕震动，或者 1 帧白闪。
- 音效（可选，后期混入）：在 post 阶段把短 click（10–20ms）用 ffmpeg 的 `adelay` 加 `amix` 混到对应时间点，音量 −24 dB 左右，不抢音乐。是否加由导演决定。不加的话，视觉上的拍点必须足够强。

**打字（typing）**
- 节奏：每字符 0.06–0.14s，带随机扰动（hash 种子，保证确定性）。空格后、标点后停 0.15–0.35s。可按词成串快打。
- 打错再改：插入一个错字，停 0.2s，按 Backspace 删除（每删一个字符 0.05s），再重打。`STORY3` S07 的 “hi → 退格” 即此类。
- 光标插入符：打字时常亮；停下 0.5s 后以 530ms 亮 / 530ms 灭闪烁（macOS/Chrome 默认约 530ms ◐）。
- 输入框变化：一旦有文字，Send 按钮从灰变白（已有 `sendOn`）；输入框获得焦点时边框变亮（已有 `focus`）。
- 可选键帽浮层：屏幕角落短暂弹出 “⏎”、“⌫”、“Tab” 键帽，0.25s 后淡出。教程类录屏常用，能强化“有人在按键”。

**下拉菜单 / 弹出菜单**
- 打开：0.15s，origin 在触发器处，scale 0.96 到 1，透明度 0 到 1，用 E.outC。阴影 0 8 24 rgba(0,0,0,.4)。
- 光标在菜单里移动时，高亮行跟随（行底色过渡 0.08s）。选中时 ✓ 移到新行，菜单 0.1s 内关闭，触发器上的标签在 0.1s 后更新（因果延迟）。

**开关（toggle）**
- 旋钮滑动 0.18–0.22s，缓动 E.outB（轻微回弹）。轨道颜色在同一时段内交叉渐变。按下时旋钮横向拉长 1.15 倍（iOS 的经典细节），松开后恢复。

**滑杆（slider）**
- 抓取：光标移到旋钮上，旋钮放大到 1.2 倍并加一圈光环。
- 拖动：旋钮跟随光标，带 1–2 帧滞后（lerp 0.6）。
- 离散档位（Thinking 滑杆）：经过每个刻度时吸附，标签加粗，刻度点“咔哒”闪一下，档位标签在 0.1s 内换字。**每个刻度对齐一拍**（S12 已这样设计）。
- 松开：旋钮回到 1 倍，光环消失。

**拖放（drag-and-drop）**
- 拿起：元素 scale 1.03，阴影加大，透明度 0.9，在原位留一个虚线轮廓。
- 移动：元素跟随光标，抓取点的偏移保持不变，轻微倾斜（速度乘 0.02rad，上限 ±4°）。
- 放下目标：虚线框高亮（2px 虚线，lav）。
- 放下：spring 吸附到位，过冲后回弹，同时一圈波纹。S02 的“拼 UI”就用这一套。

**滚动**
- 一个滚轮 tick 约 100px，惯性衰减约 0.3s；“疯狂滚动”就是高频 tick 加运动模糊（S47）。滚动条在滚动时出现，0.8s 后淡出。

**确认弹窗（modal）**
- 背后加 scrim：黑色，透明度 0 到 0.5，用 0.2s。弹窗 scale 0.95 到 1，同时淡入，0.2s。
- 危险按钮红底。光标“犹豫”：从 Cancel 移向 Delete，停一下，退回一点，再点下去。这是全片最强的“人性”表演，S33、S53 都可以用。

**捏合 / 缩放**（S20）
- 用 Ctrl+滚轮：每个 tick 缩放 0.9 倍，带 0.15s 缓动。屏幕角落显示 “80%” 之类的缩放百分比，1s 后淡出（浏览器的真实行为◐）。

### B3. 镜头与光标的关系
- 镜头**跟随但滞后**：先让光标出发，0.1–0.2s 后镜头 pan/zoom 跟上，缓动用 ioC。
- 关键点击前做 “Searching 式”缓推：z 1.0 到 1.15，持续 1–2 拍，点击帧加一个 hit。
- 点击后的结果如果在屏幕另一边（比如 toast），镜头要么先停住再甩过去，要么用分屏。不要在动作和结果之间切镜头，否则因果会断。

---

## C. 现有代码盘点（`ui.js`、`kit.js`，加上 `lib.js` 里的 E/ease）

**已有：**
- `U.gpt(c, o)`：整窗（侧栏、顶栏模型名、消息、composer）。composer 支持 `text`、`cursor`（插入符，不会闪）、`focus`、`sendOn`、`stop`、`glow`。
- `U.toggle(c,x,y,on)`：`on` 是 0–1 连续值，所以能做旋钮滑动；但没有轨道颜色渐变和按下拉长的效果。
- `U.panel`：通用对话框底板，可带标题；**没有按钮**。
- `U.cursorArrow` 和 `K.pointer`：**重复了**，两者是同一个箭头。`pointer` 支持 outline/dash。建议统一为 `pointer`。
- `K.ripple(c,x,y,t,t0)`：点击波纹。`K.toast`（含 mem/err 图标）、`K.thumbs`（实心/空心）、`K.regenIcon`、`K.pager`、`K.thinking`（shimmer）、`K.orb`（voice）。
- `K.spring`、`K.hit`、`K.kick`、`KICKS`、`L.BEATS`、`L.beatInfo`：已具备卡拍基础。
- `L.typed(s,p)`：只能按比例截断字符，**不支持**不均匀节奏、退格和错字。
- `E`：lin、inQ/outQ、inC/outC/ioC、outE/inE/ioE、outB。**缺 minimum-jerk 和 spring 弹出类缓动。**

**缺失（本次交互需求必需）：**
1. 时间轴驱动的光标脚本系统：在给定 t 时给出光标位置和按下状态，以及当前悬停的目标。
2. 命中目标注册：组件在绘制时登记 `id → rect`，光标脚本按 id 指定去哪里，避免手写坐标。
3. 按钮、图标按钮的 hover/press 状态绘制（`button()`、`iconBtn()`）。
4. Tooltip。
5. 下拉/弹出菜单（`menu()`）。
6. 滑杆（`slider()`），支持离散档位和标签。
7. 模态确认框（`modal()`，含按钮和 scrim）。
8. 打字脚本（`typeScript()`）：支持不均匀节奏、错字、退格、插入符闪烁、Tab 预测。
9. 回答下方的操作条（Copy / 👍 / 👎 / Share / ↻ / ⋯）和 retry 菜单。
10. 横幅（`banner()`）：限额、错误、Memory full。
11. composer 内的模型 chip，以及右上角的 **Temporary** 按钮。
12. A/B 对比卡（“Which response do you prefer?”）。
13. 键帽浮层（`keycap()`），可选。
14. 拖动的拿起与放下（`dragItem()`）。

---

## D. 交互工具包规格（建议新建 `ix.js`，由 kit.js 引用；所有函数都是 t 的纯函数，可确定性重渲任意帧）

### D1. 核心：动作脚本（Take）
渲染是逐帧的纯函数，所以“交互”要写成**一段预先声明的动作时间线**，每帧查询它在 t 时的状态。

```js
// 声明（每个镜头一次，模块顶层）
const take = IX.take({start:[1700, 900], seed: 7}, [
  {at: 18.0, move: 'chip.model', dur: 'fitts', overshoot: 6},   // 'fitts' 自动算时长；也可给数字或 'beat'
  {hover: .5},                                                  // 停留 0.5s → 触发 tooltip
  {click: true, align: 'kick'},                                 // 按下帧吸附最近 KICKS
  {wait: .3},
  {move: 'menu.thinking.Medium', dur: 'beat'},
  {drag: 'slider.thinking', to: ['Medium','High','Extra High','Pro'], per: 'beat'},
  {type: 'if you could be anything, what would you be?', into: 'composer', cps: 11, typos: 1},
  {key: 'Enter'},
  {hesitate: 'modal.delete', approaches: 2, dur: 2.0},
  {click: true},
]);
// 查询（每帧）
const s = IX.at(take, t, targets);
// s = { x, y, down:0..1, pressT, releaseT, hoverId, hoverFor, dragId, dragV,
//       text:{composer:'if you co'}, caretOn:bool, keys:[{k:'Enter',t0}],
//       events:[{type:'click', id, t0}, ...] }   // events 给结果动画用（因果延迟）
```

参数：
- `move`：`to`（目标 id 或 `[x,y]`）、`dur`（数字、`'fitts'` 或 `'beat'`）、`arc`（0–0.2，默认按种子取 0.06–0.15）、`overshoot`（px）、`ease`（默认 `'mj'`）、`mood`（`'calm' | 'eager' | 'panic' | 'tired'`，调制时长、弧度和过冲）。
- `click`：`hold`（按下时长，默认 0.08）、`align`（`'kick' | 'beat' | null`）、`double`。
- `drag`：`id`、`to`（坐标、目标 id 或离散档位数组）、`per`（每档时长）、`lag`（默认 0.6）。
- `type`：`text`、`into`、`cps`（默认 10）、`jitter`（默认 0.35）、`typos`（个数）、`pauseAfter`（`{',':.2, '.':.35, ' ':.04}`）、`predict`（灰色预测文字，按 Tab 接受）。
- `key`：`'Enter' | 'Backspace' | 'Tab' | 'Ctrl+Scroll'`，可带 `n` 次数。
- `hesitate`：`target`、`approaches`（次数）、`dur`。
- `wait` / `hover`：停留时长。
- `scroll`：`ticks`、`per`。

### D2. 目标注册
```js
const T = IX.targets();               // 每帧新建
T.add('chip.model', x, y, w, h);      // 组件在绘制时登记（button/menu/slider 自动登记）
T.rect('chip.model') → {x,y,w,h,cx,cy}
```
问题：光标路径要用到目标位置，而目标要先绘制才会登记。解决办法是先跑一遍“只登记、不画”的布局（layout pass），或把关键坐标写成常量表（`LAYOUT.composer.send` 等），每帧先算布局再画。推荐后者，简单可靠。

### D3. 绘制原语（全部读取 `s` 来决定状态）
| 函数 | 关键参数 | 说明 |
|---|---|---|
| `IX.cursor(c, s, o)` | `kind:'arrow'|'hand'|'text'|'grab'`、`trail`（运动残影帧数）、`color` | 按下时 scale 0.9；hand/arrow 根据 `hoverId` 是否可点自动切换 |
| `IX.press(s, id)` → 0..1 | — | 该目标的按下量，给 scale 和变暗用 |
| `IX.hover(s, id)` → 0..1 | `fade:.12` | 悬停量，带渐入 |
| `IX.after(s, id, delay=.08)` → t0 或 null | — | 该目标被点击后的结果时刻（因果延迟），用来驱动“界面变化” |
| `IX.button(c, id, x,y,w,h, label, s, o)` | `variant:'primary'|'ghost'|'danger'|'icon'`、`icon`、`r` | 自动登记目标，画出 hover/press 状态 |
| `IX.tooltip(c, s, id, text, o)` | `delay:.5`、`side:'top'|'bottom'` | — |
| `IX.menu(c, id, x,y, items, s, o)` | `open`（0..1，可由 `after('chip.x')` 推导）、`selected`、`check:true`、`width` | items 为 `{id,label,sub,disabled,badge}`；每项自动登记 |
| `IX.slider(c, id, x,y,w, stops, s, o)` | `value`（连续或档位索引）、`labels`、`locked:[...]`（灰锁档，如 Plus 用户的 Pro） | 吸附与刻度闪烁 |
| `IX.switch(c, id, x,y, on, s, o)` | `on` 可来自 `after()`；旋钮 0.2s outB | 替代 `U.toggle`，或作为它的升级版 |
| `IX.dropdown3(c, id, x,y, value, s)` | value 取 `'More'|'Default'|'Less'` | Characteristics 写实版 |
| `IX.textField(c, id, x,y,w,h, s, o)` | `placeholder`、`multiline`、`predict` | 文字从 `s.text[id]` 取，插入符读 `s.caretOn` |
| `IX.modal(c, s, o)` | `open`、`title`、`body`、`buttons:[{id,label,variant}]`、`scrim:.5` | “Delete chat?” 等 |
| `IX.banner(c, x,y,w, o)` | `kind:'limit'|'error'|'warn'|'info'`、`text`、`action:{id,label}` | 限额、错误、Memory full |
| `IX.actionBar(c, x,y, s, o)` | `items:['copy','up','down','share','retry','more']`、`filled:{up:1}`、`visible`（悬停才显示） | 回答下方操作条 |
| `IX.abCard(c, x,y,w,h, left,right, s, o)` | 标题 “Which response do you prefer?”；按钮 “I prefer this response” | — |
| `IX.keycap(c, key, t, t0)` | 屏幕角落弹出约 0.4s | 可选 |
| `IX.dragGhost(c, s, id, drawFn)` | 拿起时 scale 1.03 加阴影，放下时 spring | — |
| `IX.scrim(c, a)` | — | — |

### D4. 节拍工具
- `IX.snapKick(t)`、`IX.snapBeat(t, sub=1)`：取最近的 KICKS 或 BEATS（sub 为 2 时取 1/8 拍）。
- 动作 `align:'kick'` 时，`at` 由脚本自动微调（±0.12s 以内），保证**按下帧**正好落在鼓点上。
- `IX.clickFlash(c, s)`：按下帧给 1 帧局部提亮。可配合全局 `K.hit`，作为“视觉音效”。

### D5. 实现要点（伪代码）
```js
const mj = u => u*u*u*(10 - 15*u + 6*u*u);          // minimum-jerk
function fitts(D, W) { return clamp(.10 + .13*Math.log2(D/Math.max(W,8) + 1), .22, .9); }
function bez(p0, p3, arc, side) {                    // 弧形控制点
  const dx=p3[0]-p0[0], dy=p3[1]-p0[1], nx=-dy*side*arc, ny=dx*side*arc;
  const p1=[p0[0]+dx*.3+nx, p0[1]+dy*.3+ny], p2=[p0[0]+dx*.75+nx*.6, p0[1]+dy*.75+ny*.6];
  return u => cubic(p0,p1,p2,p3,u);
}
// 过冲：到达目标时继续越过 overshoot px（沿运动方向），再用 0.1s outC 回正
// 手抖：x += (noise1(t*0.7+seed)-.5)*1.2，y 同理（只在静止时加，移动时衰减为 0）
// 打字：预先展开成事件序列 [{t, op:'ins'|'del', ch}]，用 hash(seed,i) 生成间隔，按 t 回放得到当前字符串
// 插入符：typing 时 on；距最后一次按键 > .5s 后 on = ((t - last) % 1.06) < .53
// 编译期把整个 take 展开成段表 segs[{t0,t1,kind,...}]，查询时二分查找，O(log n)
```

### D6. 与 STORY3 的对接建议（只列需要改控件或文字的行）
| 镜头 | 现写法 | 写实化建议 |
|---|---|---|
| S03 | “Anything else ChatGPT should know?”，点 Save | 文字补全为 “…know about you?”（◐）。Save 可保留（艺术化处理），或改为关闭弹窗时出现 toast |
| S06 | 顶栏 “ChatGPT ▾”，chip `4o` | 4o 时代（2025）的顶栏布局没问题；C 部分 GPT-6 时代建议把 chip 移进 composer（[S2] ✅） |
| S12 / S50 | Thinking 滑杆 Instant→Medium→High→Extra High→Pro | ✅ 完全写实，标签一字不改。Plus 用户的 Extra High/Pro 应显示为锁定；如要拖到 Pro，就让 Kai 是 Pro 用户 |
| S13 | Cynic / Robot / Nerdy / Off | 改为 **Cynical / Efficient / Nerdy（retired，灰）/ Default**。“Off” 不存在 |
| S14 | Temporary 来回闪切 | 真实规则是对话开始后不能切换。每次切换配一次 New chat，或者接受为艺术夸张；按钮名为 **Temporary**，开启后选 **Personalized / Unpersonalized** |
| S18 / S45 | 👍 tooltip “Good response” | ◐ 保持 |
| S24 | “Which response do you prefer?” | ◐ 保持，按钮用 “I prefer this response” |
| S25 | Voice 选 F/M | 真实界面没有 F/M 开关，建议在音色名之间切换（如 Juniper 换 Cove，❓），F/M 交给字幕 |
| S26 | “You've hit the Plus plan limit… resets after 10:59 AM” | ◐ 措辞可用；若同片出现广告（S46），套餐应改成 Go |
| S30 / S33 | Memory Full、点 “Forget” | Memory Full 属于旧版 Saved memories（◐ 文案见 A3）。“Forget” 改为垃圾桶图标，或 summary 上的 “Don't mention this again” |
| S36 / S37 | 错误文案 | ✅ “Something went wrong.” 与 “There was an error generating a response.” 来自官方；“A network error occurred.” 为◐ |
| S46 | “Sponsored” 卡 | 改为 **“Ad”**（◐ 2026-06 起），且 Plus 用户不会有广告。2026-10 恰好在测试图片生成旁的广告，是真事 |
| S53 / S54 | “Chats can be continued using other models after February 13, 2026.”；GPT-6 “it is not labeled Sol” | 后一句 [S1] ✅ 原文；前一句沿用 LORE 的来源 |

---

## E. 未能核实、建议截图确认的清单
- 2026 年 Web 端：retry 菜单的具体选项文字，👎 反馈面板的分类文字，A/B 卡的按钮文字。
- 临时对话开启后中央的说明文案（2026 年按新规则应该已改写）。
- 限额横幅的准确措辞。
- Share / Delete 弹窗的 2026 年文案。
- 侧栏的确切条目顺序；是否仍按 Today / Yesterday 分组。
- Voice 音色名单（GPT-Live-1 之后可能变动）。
- Characteristics 是下拉还是其他控件（多家报道都说是 More/Default/Less 下拉）。
- 稲葉曇 PV 的 UI 风格描述（凭记忆）。
