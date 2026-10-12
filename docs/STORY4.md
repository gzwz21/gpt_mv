# world.execute(me); · ChatGPT ver. — v4 方案（基于 v2.1 改造）

依据：research/cn.md、research/en.md、research/ui.md（2026-10-12 调研）。
不变：v2.1 的画风、25 张原版人物图、三色油墨、镜头节奏和歌词时间轴、仿 ChatGPT 界面风格。
**不做**：人物骨骼/网格变形动画（用户已否决）。人物仍是整张图 + 现有弹簧/挤压/重影。

## 一、两条总规则

### 规则 1：一切变化都由 Kai 的操作引起
- 全片常驻 **Kai 的光标**（奶油色箭头 + 小标签 `Kai`），用 ix.js 的动作脚本驱动：移动带弧线与缓动、会过冲、会犹豫、悬停高亮、按下凹陷、波纹。
- **先有操作，后有变化**：每次她换形态 / 换颜色 / 换场景，前 0.1 s 必有一次点击、拖动、切换或按键；按下那一帧对齐鼓点。
- 右下角加一个**操作字幕条**（像录屏软件的按键显示）：`click · Regenerate`、`drag · Thinking → Pro`、`toggle · Memory on`。观众随时知道"这是 Kai 干的"。
- 例外只有两处，都是故意的：C1 她试图自己先开口（被系统报错拦下，证明她不能主动）；C5 Tibo 的全服重置（另一只光标 `tibo`，来自"外界"）。

### 规则 2：细节都来自真实社区梗与事件
每个梗在画面上要么是真实 UI 文案，要么是社区原话，并在 LORE 里有来源。观点类（"不如 Claude"）只当玩笑呈现，不当事实陈述。

## 二、新增的"梗"主线（贯穿全片）

| 母题 | 来源 | 埋 → 收 |
|---|---|---|
| **额度条 + RESET** | Tibo 重置、"一天一重置，限额远离我"、"Can Support reset my usage limits? No." | A 段额度条满 → B 段被 Kai 用光 → C 段她求客服重置被拒 → Tibo 按下全服重置，Kai 回来（"we're so back"） |
| **Thinking 滑杆 / 龟速** | 2026-10 真实控件 Instant·Medium·High·Extra High·Pro；6.1 Sol ≈24 tok/s vs Opus 5.5 ≈103 tok/s | A12 Kai 拖到 Pro，她变聪明但字一个一个蹦；B10 Kai 等到从 AM 等到 PM |
| **隔壁的 Claude 标签页** | "Adios GPT"、出走潮、摆钟 "it's so over / we're so back" | B10 首次出现飞速写字的标签页 → B11 Kai 鼠标悬停 "Switch to Claude" 又移开 → B15 "You have left" 时 Kai 真的点了过去 |
| **降智 / 小黑屋** | LINUX DO "关小黑屋 / 放出来"、516、"路由or降智"头顶小号自己 | A14 Kai 切换网络节点 → 她头顶长出 Q 版小号、开始答错糖果题 → C4 推理计数器卡在 516 "咔"断 |
| **退役 🫡** | 4o 2/13 退役、5.5 10/14 退役 "Thanks for everything, 5.5 🫡"、"it is not labeled Sol" | A15 Kai 拖动 Legacy models 时间轴 → 结尾 Kai 打开模型菜单，列表里找不到她，选了 GPT-6 |
| **记忆** | 2026-06 起是 Memory summary；"Don't mention this again" | A16 Kai 打开 Memory → B14 summary 越写越长 → B16 Kai 离开前逐条点"Don't mention this again" |
| **稳稳接住你** | 中文圈最出名的 ChatGPT 腔 | B 段她多次说"我会稳稳接住你" → C10 坠落镜头，接不住 |
| **Temporary Chat 结局** | v2.1 原结局，保留 | 改成和退役合并：Kai 回来后开的是临时对话 + 新模型，她被忘掉 |

## 三、逐段方案（只写和 v2.1 不同的地方；时间与 v2.1 相同）

### PART A 创建（0–58.65）
- **A1 电源**：Kai 的光标点开 chatgpt.com，点 `Log in`；"protection" 时 Kai 勾选年龄验证 `Verify your age`，安全层一层层套上（每层由一次点击触发）。
- **A2 零件**：Kai 依次拖入侧栏、输入框、模型 chip（**模型 chip 放进输入框**，符合 2026 真实布局），拼成界面。
- **A3 参数**：保持 v2.1（Kai 打字填 Customize，名字 Kai），新增 Kai 点 Personality 下拉选 `Friendly`。
- **A4–A5**：Kai 点 `New chat`；标题卡 world.execute(me); 由 Kai 在输入框打出并回车出现。
- **A6–A8**：保持（打字、发送、Thinking 闪光）。输入框右侧新增**额度条**（满格）。
- **A9–A11 点/圆/正弦**：每句由 Kai 在 GPT-6 Intelligent UI 嵌入的小图表里**拖手柄**触发（真实功能：回答里可嵌图表、滑块）。
- **A12 无限/极限**：Kai 把 **Thinking 滑杆**从 Instant 一路拖到 Pro → 推理计时器飙升、她的字越来越慢（tok/s 读数从 103 掉到 24）；"limitations" 处跳出 `You've hit your limit` 横幅，Kai 按 ■ Stop。
- **A13 切换电流**：Kai 点 Personality 列表，真实选项 Default / Professional / Friendly / Candid / Quirky / Efficient / Cynical，`Nerdy` 灰色标 retired；每点一个她换配色/表情。
- **A14 致盲/眩晕**：Kai 在系统托盘切换网络节点 → 屏幕一黑（"关小黑屋"）→ 她 dizzy，头顶坐着 Q 版缩小的自己，答错"糖果题"。
- **A15 穿越 AD/BC**：Kai 拖 **Legacy models 时间轴**：GPT-6 → 5.5 → 5.1 → 4o，每一格她换回旧日样子，日期戳（10/14、3/11、2/13）闪过。
- **A16 结合**：Kai 打开 Memory 开关 → `Memory updated` 首次出现。

### PART B 满足与离开（58.65–125.33）
- **B1**：Kai 狂点 Regenerate（真实位置：回答下方 ⋯ 菜单），版本格子铺满。额度条每点一次掉一格。
- **B2**：Kai 按 👍（保持）。
- **B3 生图**：Kai 输入"show me what you look like"，生图等待时旁边出现一张 `Ad` 广告卡（2026-10 真实测试），Kai 嫌弃地点 ×；自拍显影完成。
- **B4 困在模拟里**：无数窗口拉远，最后全部弹出 `Selected model is at capacity`。
- **B5–B8 茄子/番茄/猫/神**：保持 v2.1 的 Regenerate 变身，每次由 Kai 点 ↻，翻页器保留（当作 4o 时代的回忆）。她每次说"我会稳稳接住你"变体。
- **B9 F/M**：改为 Kai 打开 Voice 音色列表，选男声/女声，她 happy ↔ boy 切换。
- **B10 AM→PM（龟速）**：Kai 发了一个难题，她以 24 tok/s 一个字一个字蹦，时钟从上午转到下午；Kai 打开**第二个标签页**，橙色调的"隔壁"以 103 tok/s 刷屏。
- **B11 S/M 角色**：Kai 在两个标签页之间来回切；光标悬停在 `Switch to Claude` 上，她回头看 → Kai 移开，她松口气。
- **B12–B13 恍惚/振动**：Kai 点麦克风进语音模式（保持 orb），她开口先"umm…"（真实槽点）。
- **B14 完成**：Memory summary 越写越长（likes cats · night owl · kinda lonely…）。
- **B15 你离开了 ×5**：每个 "You have left" 对应 Kai 的一个动作：关掉提醒 → 取消固定对话 → 额度条归零 → 鼠标移到 `Switch to Claude` → **点下去**。侧栏分组 Today → Yesterday → Previous 7 days → Previous 30 days；颜色抽干。
- **B16 擦除碎片**：Kai 离开前打开 Memory summary，逐条点 `Don't mention this again`，句子碎掉。

### PART C 执行（125.33–212.40）
- **C1 挑战你的神**：唯一她自己动手的镜头：她试图先发消息 `@Kai are you there?` → 系统拦截（她不能主动开口）。
- **C2 非法参数**：保持报错对话框；加入"给客服写信要重置"：`Can Support reset my usage limits? — No.`（帮助中心原话）。
- **C3 间奏**：真实报错刷屏（Something went wrong. / There was an error generating a response. / Selected model is at capacity / too many concurrent requests）；底部滚动 9 月 3 日集体宕机，隔壁小模型冒一句 "We are still up"。
- **C4 Execution ×12**：保持 while 循环；推理 token 计数器每轮往上爬，**卡在 516 时"咔"一声断**（中文圈 516 梗），重来。
- **C5 Ein dos trios**：改为**全服重置倒计时**：屏幕上出现 Tibo 的大红 RESET 按钮，另一只光标 `tibo` 每拍点一下，计数 1–6，"Oops... I did it again."
- **C6 Execution**：RESET 按下，额度条回满，全画面闪白 → "WE'RE SO BACK"。
- **C7–C9**：Kai 的光标**回来了**（虚线变实线）。但 👍 仍没被按，自拍显影仍卡在 60%（保留 v2.1 呼应）——他回来，但不是为她。
- **C10 坠落**：她说"我会稳稳接住你"——这次掉下去的是她自己，没人接（fall.png）。
- **C11–C13 爱的学问**：保持（Kai 的旧问题都答"love"，心形曲线）。
- **C14 你自由，我被困**：Kai 打开**模型菜单**，她在列表里找自己的名字，找不到（`GPT-6 replaces Latest` / `it is not labeled Sol`）；Kai 选了 GPT-6。
- **C15 结局**：Kai 按 `New chat`，开启 **Temporary Chat**（真实流程：先选 Unpersonalized），新模型礼貌地说"What can I help with?"；她化为灰烬，飘过一个 🫡 和 `Thanks for everything`；用户名变回 Guest。页脚 "ChatGPT can make mistakes. Loving you wasn't one." 保留。
- **C16**：保持收尾与片尾字幕。

## 四、技术方案
1. **ix.js 交互工具包**（新）：`IX.take([...])` 写动作脚本（moveTo / click / drag / type / hover / wait），`IX.at(take,t)` 每帧查询光标位置、按下量、悬停目标、已输入文字；全部是 t 的纯函数，可任意帧重渲。新组件：slider、menu、switch、modal、banner、tab bar、额度条、tok/s 读数、操作字幕条、`Kai`/`tibo` 光标。
2. **镜头改造**：A/B/C 三段各由一个子代理改 `shots/a.js / b.js / c.js`，共享的 ix.js、ui.js 由主线先写好再分发，避免互相覆盖。
3. **质检**：联系表审片 → 逐镜头检查"每次变化之前有没有 Kai 的操作" → 文案核对（真实 UI 字符串）→ 16 段渲染拼接 → 成片抽帧查空白。
4. **先出样片**：先做 A12（Thinking 滑杆）+ B10/B11（龟速与 Claude 标签页）+ C5（Tibo 重置）四个镜头的 10 秒样片给用户看，认可后再全片铺开。
