# S 级快赢功能需求设计文档（9 项）

- **日期**：2026-07-18
- **状态**：需求定稿，待评审后进入实现计划
- **来源**：多视角脑暴（51 个候选 → 收敛 31 个）后选定的 9 个 S 级快赢；每份需求由独立分析对照真实源码编写（函数名/行号已核实），另经跨功能一致性核查。
- **产品硬原则（所有需求共同遵守）**：数据诚实（未公开显示「官网未公开」、评分标注「拍库相对评估非实验室测量」）、无登录全功能可用、打法答案默认不出本机、hash 深链可分享且脏参数 canonical 化、无障碍对齐现有水准、「源码即规格」零框架测试。

## 总览

| #   | 功能               | 价值 | 可行性 | 轨道     | 轨道内顺序 |
| --- | ------------------ | ---- | ------ | -------- | ---------- |
| 1   | 推荐评分拆解       | 5    | 5      | C 匹配页 | 1          |
| 2   | 侧重秒切预览       | 4    | 5      | C 匹配页 | 2          |
| 3   | 相似平替查找       | 4    | 5      | B 对比页 | 1          |
| 4   | 对比白话解读       | 4    | 5      | B 对比页 | 2          |
| 5   | 购买链接体检       | 4    | 5      | A 独立   | 1          |
| 6   | 拍库严选榜单       | 4    | 5      | D 发现页 | 1          |
| 7   | 好友球拍对决       | 3    | 5      | B 对比页 | 3          |
| 8   | 球星同频指数与深链 | 3    | 5      | C 匹配页 | 3          |
| 9   | 最近浏览货架       | 3    | 5      | D 发现页 | 2          |

**实施轨道（可并行）**：

```
轨道A（独立）:  购买链接体检
轨道B（对比页）: 相似平替 → 白话解读 → 好友对决
轨道C（匹配页）: 评分拆解 → 秒切预览 → 球星同频
轨道D（发现页）: 严选榜单 → 最近浏览货架
```

---

## 1. 推荐评分拆解——匹配结果卡「为什么是它」折叠区

> **用户故事**：作为完成三步匹配的球友，我想在每张匹配结果卡上展开「为什么是它」，以便看懂匹配指数由哪些分项构成、以及哪些同系型号因拍系去重让位，从而信任并理解推荐结果。

#### 功能需求

- FR-1 新增导出纯函数 recommendationBreakdown(racket, stage, style, priority)（新增于 app/page.tsx，与 recommendationScore 同区段）：返回 { base: 10, stageHit: boolean, stagePoints: 0|22, styleHit: boolean, stylePoints: 0|28, priorityMode: '均衡'|单项, priorityPoints: number(原始浮点), raw: number, total: Math.min(99, raw), capped: raw>99 }。分项算法必须逐字对齐 recommendationScore 现有实现（均衡：六维均值×0.18+最低维×0.06；单项：keyMap 对应维×0.2+均值×0.04）。recommendationScore 的签名与返回值保持不变（可内部改为复用明细函数），现有 tests/match-engine.test.mjs 既有断言零回归。
- FR-2 buildRecommendations（app/page.tsx:689）在不改变排序、去重键（familyId ?? series）、break-at-limit 语义与现有条目字段 { racket, match } 的前提下，为每个入选条目附加 skippedSiblings: { racket, match }[]：即 ranked 降序遍历中、第 limit 个入选者产生之前、因 usedFamilies 命中被 continue 的型号，归属到其拍系已入选的那张推荐条目，保持 ranked 原序（分数降序、同分按 model localeCompare 'en'）。注意：源码集满即 break，之后的同系型号从未被遍历，不得纳入（与构想'所有兄弟型号'的差异以源码为准）。
- FR-3 匹配视图 3 张 match-result-card（recommendations.slice(0,3)）各新增「为什么是它」折叠触发按钮：默认收起；aria-expanded 绑定展开状态、aria-controls 指向唯一 id 且 role='region' 的明细区（复用 catalog-filter-trigger 既有 disclosure 模式）；展开状态仅为组件内 React state，不写 hash、不写 Web Storage、不入历史栈；重新匹配（修改答案/restartMatchProfile）后重置为收起。
- FR-4 明细区以语义列表逐条列出分项：'基础分 +10'；阶段项命中显示'阶段命中 +22（适合{stage}）'、未命中如实显示'阶段未命中 +0（该拍标注：{racket.stages 顿号连接}）'；打法项同理 +28/+0；优先项为'均衡'时显示'六维均衡加权 +X.X（六维均值×0.18 + 最低维×0.06）'，单项时显示'{priority}加权 +X.X（{priority} {racket.scores[key]}×0.2 + 六维均值×0.04）'，加权分保留 1 位小数。未命中项必须显示 +0 而非隐藏（数据诚实原则）。
- FR-5 明细区末行显示合计：'合计 X.X ≈ 卡面 {Math.round(match)}'（用 ≈ 说明卡面为四舍五入）；当 capped 为 true 时追加'原始 X.X，封顶 99'（按当前数据不可触发，仅防御性渲染分支）；并固定附注一句：'匹配指数为拍库相对评估，非实验室测量。'（措辞对齐 app/page.tsx 477/6513 行现有口径）。
- FR-6 明细区在分项下方列出该卡 skippedSiblings：每条显示'{racket.model}（指数 {Math.round(match)}）· 与本卡同属 {familyName ?? series}，为保持拍系多样性未入选'；最多展示 2 条，超出显示'另有 N 款同系型号让位'；skippedSiblings 为空时显示固定短句'排在它之前的候选中没有同系型号'，不留空白也不臆造。第 4 名推荐（匹配视图不渲染）的让位信息不挪到前三卡。
- FR-7 折叠交互无障碍：触发按钮为原生 button（Enter/Space 天然可用）、min-height 44px；每卡按钮带含型号的 aria-label（如'查看 {model} 的匹配指数拆解'）避免 3 卡重名；展开/收起不转移焦点、不用 aria-live（状态由 aria-expanded 表达）；展开动画遵循 globals.css 既有 prefers-reduced-motion 约定。
- FR-8 测试（源码即规格）：扩展 tests/match-engine.test.mjs——对 3×5×7=105 组合 × 全部 deepRackets 断言 base+stagePoints+stylePoints+priorityPoints 与 recommendationScore 误差 <1e-9、stagePoints∈{0,22}、stylePoints∈{0,28}、raw≤99 时 capped=false；用手工构造的伪造 racket（六维全 200 之类）断言封顶分支 total=99 且 capped=true；对 buildRecommendations 断言每个 skippedSibling 的去重键与宿主一致、match ≤ 宿主 match、且不与 4 个推荐条目重复。新增源码正则断言（armory-presentation.test.mjs 风格，可新增 tests/match-breakdown.test.mjs）：page.tsx 含「为什么是它」触发器的 aria-expanded/aria-controls、role='region' 明细区、'非实验室测量'附注文案。

#### 边界与降级

- 阶段与打法双未命中：明细显示两个 +0，合计仍与卡面一致（此类拍通常排不进前 3，但函数层必须正确，105 组合全量断言覆盖）。
- 封顶分支按当前数据（六维 50-97，原始分上限约 83.3）永不触发：UI 与函数仍实现 capped 分支，仅能通过伪造 racket 的单测验证；不得因此删掉 Math.min(99,…) 语义。
- familyId 缺失（DeepRacket.familyId 为可选字段）：去重键与让位归属一律回退 series（与源码 item.racket.familyId ?? item.racket.series 完全一致），文案回退 familyName ?? series。
- skippedSiblings 为空（前三名之前无同系竞争者）：显示固定短句而非空区块。
- 浮点展示：priorityPoints 为小数，分项各自保留 1 位小数后相加可能与合计有 ±0.1 显示级偏差——合计必须由 raw 直接格式化，不得由已舍入的分项相加。
- 存储不可用（memory-only 会话）：折叠状态本就不持久化，零影响；未完成匹配时结果视图不渲染，该功能无入口，与现状一致。
- 深链 #match 直达（committed 档案从 session 恢复）：折叠区默认收起，与页内到达行为一致。
- 多卡同时展开互不干扰；展开状态不随 compare 篮、overlay 打开等其他交互被意外重置。

#### 无障碍要求

- disclosure 模式：button + aria-expanded + aria-controls + 目标区 role='region' 与唯一 id，对齐 catalog-filter-trigger/catalog-filter-panel 既有先例。
- 触发按钮 min-height 44px，符合 globals.css 全站触控标准。
- 每卡触发按钮 aria-label 含具体型号，读屏用户可区分 3 张卡的同名按钮。
- 分项与让位型号用语义列表（ul/dl），数值与解释在同一文本节点内可被完整朗读。
- 展开动画遵循 prefers-reduced-motion；不转移焦点、不加 aria-live、不做 focus trap（非模态）。

#### 路由与持久化

- 折叠展开状态仅存组件 state，刷新/重进即收起，属预期行为而非缺陷。
- 不得改动 app/navigation-state.ts 的 #match（含 /step/N）解析与 canonicalHash/shouldReplace 逻辑；新增 UI 不引入任何 hash query 参数，脏参数 canonical 化行为保持不变。
- 不得向 app/session-state.ts 的 match/compare/tour/catalog 四域新增键或改动序列化格式。

#### 验收标准

- npm test（build + node --import tsx --test tests/*.test.mjs）全部测试通过，现有 18 个测试文件零回归，尤其 tests/match-engine.test.mjs 原有 4 项断言不修改仍绿。
- tests/match-engine.test.mjs 新增断言通过：105 组合全量分项求和恒等、分项取值域、伪造 racket 封顶分支、skippedSiblings 去重键/分数/不重复三项性质。
- 新增源码正则断言通过：aria-expanded/aria-controls 触发器、role='region' 明细区、'非实验室测量'附注均存在于 app/page.tsx。
- 手动验收：完成一次匹配后 3 张结果卡均可键盘与触控展开/收起；任选一卡人工核算分项之和 ≈ 卡面指数；让位型号确与该卡同系且在拍库中分数不低于第 3 名卡面值以下的合理区间。
- recommendationScore 与 buildRecommendations 对外行为兼容：featured 卡（recommendations[0]）与发现页 RecommendationRow 渲染无任何变化。
- npm run lint 通过；无新增 console.log。

#### 涉及文件

- `app/page.tsx` — 修改：recommendationScore(661行)保持兼容并内部复用新逻辑；新增导出纯函数 recommendationBreakdown；buildRecommendations(689行)条目附加 skippedSiblings；match-results-app 段(约5646-5731行)的 match-result-card 增加「为什么是它」disclosure 触发器与明细区渲染
- `app/globals.css` — 修改：新增 match-result-card 折叠区样式（44px 触发、明细列表、让位型号小节），遵循既有 prefers-reduced-motion 与 760px 断点约定
- `tests/match-engine.test.mjs` — 修改：新增 recommendationBreakdown 分项恒等/取值域/封顶断言与 buildRecommendations.skippedSiblings 性质断言（原有断言不动）
- `tests/match-breakdown.test.mjs` — 新增：对 app/page.tsx 的源码正则断言（aria-expanded/aria-controls 触发器、role='region' 明细区、'非实验室测量'附注），风格对齐 tests/armory-presentation.test.mjs

#### 明确不做（Out of Scope）

- 发现页 featured 卡与 RecommendationRow（recommendations.slice(1)）不加折叠区，本期仅匹配视图 3 张 match-result-card。
- 折叠状态不写入 hash 路由、Web Storage、历史栈；不新增任何 query 参数或 session 域键。
- 不改动评分公式、权重常数、99 封顶值、去重键与 limit=4；不动 recommendationReason 一行摘要。
- 不新增/修改任何静态数据（catalog-data.ts、racket-profiles.ts 的字段与派生逻辑不动）。
- 不做'换个优先项会怎样'的 what-if 对比、不做分项条形图/可视化（纯文本列表交付）。
- 球拍详情 overlay、对比视图内不展示评分拆解。
- 第 4 名推荐及其让位信息在匹配视图仍不展示（维持 slice(0,3) 现状）。

---

## 2. 匹配结果优先项秒切预览（结果页七胶囊即时重算榜单，不落盘、返回即还原）

> **用户故事**：作为已完成三问匹配的球员，我想在结果页直接点按七个优先项胶囊即时预览推荐榜单的名次变化，以便不重做问卷、不改动已保存档案就能理解"优先取舍"对选拍的真实影响。

#### 功能需求

- FR-1 胶囊组渲染：在结果屏（page.tsx `matchStep >= 3` 分支的 `section.match-results-app` 内、`match-result-list` 与 `match-results-actions` 之间）新增一组 7 个优先项胶囊按钮，按 match-flow.ts 导出的 `matchPriorities` 顺序渲染（均衡/力量/旋转/控制/手感/灵活/护臂）；"护臂"显示为"护臂 / 容错"，与问卷第 3 步（page.tsx:5638）措辞一致；当前生效优先项胶囊呈选中态。
- FR-2 秒切重算与单一显示数据源：点击任意胶囊，用组件内瞬态 state（如 `previewPriority: MatchPriority | null`）调用已导出的纯函数 `buildRecommendations(deepRackets, profileStage, profileStyle, previewPriority ?? profilePriority)` 同步重算"当前显示榜单"；结果屏的前 3 卡片、`Math.round(match)` 指数、`recommendationReason` 理由文案、hero 中"优先方向"文案、以及"对比前两名"按钮（`compareTopMatches`，page.tsx:5127 现取 committed 版 `recommendations.slice(0,2)`）全部读取同一份显示榜单，不允许出现"看的是预览、对比的是原榜"的分裂。修正说明：不得使用 `beginMatchDraft`/`answerMatchDraft` 实现预览——前者会使 `snapshotMatchScreen` 切回问卷屏，后者在第 2 步会立即提交档案并触发 `persistMatchSnapshot` 落盘，与"不落盘"直接冲突；本功能仅复用 committed/draft 分离的原则（committed 档案是唯一真相，预览是未确认覆盖层），match-flow.ts 本身零改动。
- FR-3 名次变化标注：新增纯逻辑模块 app/match-preview.ts（新增文件，不依赖 React），导出 diff 纯函数（输入基线榜单与预览榜单两份 `buildRecommendations` 输出及展示位数 3，输出每个 racket.id 的 {delta: 上升n/下降n/持平, isNew: 是否新进前三}）；卡片上以"↑n / ↓n / 新上榜"徽标标出与 committed 基线榜单的名次差异，徽标含文字符号不只靠颜色；位置变化伴随 CSS 过渡动画，`prefers-reduced-motion: reduce` 时（globals.css:6268 现有块内）禁用位移动画、徽标静态显示。
- FR-4 预览态诚实文案：当预览优先项 ≠ committed 优先项时，胶囊组附近显示状态行，明确"预览中：X 优先（未保存）· 你的档案仍为 Y 优先"；指数措辞维持项目既有数据诚实口径（"拍库相对评估 / 满分 100 / 非实验室测量"，page.tsx:477、6513），预览不得引入"实测""更适合你"等超出相对评估语义的表述；预览与基线一致时不显示预览态标识。
- FR-5 还原语义（零持久化）：预览状态只存在于组件内存——点击 committed 优先项对应胶囊、点击"修改答案"（`restartMatchProfile`）、点返回（`goToPreviousMatchStep`）、切换底部任一 Tab（`goToView`）、浏览器前进/后退（popstate 还原 `paikuMatchScreen`）、或刷新页面后，预览一律清除并恢复 committed 基线榜单；`serializeMatchFlow` v2 结构、`persistMatchSnapshot`、session-state 四域、`PaikuHistoryState` 均不新增字段。发现页 featured/recommendation-list 始终基于 committed 档案，不受预览影响。
- FR-6 hash 深链不变：预览不改变地址栏——结果页始终为 `#match/step/3`（navigation-state.ts `formatAppRoute`），不新增 query 参数、不 push/replace history；分享出去的链接语义不变（仍是"仅结果位置"链接，跨设备打开继续走现有 missing-result 恢复路径，page.tsx:5566-5591），canonical 化逻辑零改动。
- FR-7 无障碍：胶囊组容器 `role="group"` 加中文 aria-label（如"预览不同优先方向"）；每个胶囊为原生 button 且 `aria-pressed` 标记当前生效项（与问卷选项 page.tsx:5635 同模式）；触控目标不小于 44px；切换后焦点保持在被点击的胶囊上，卡片现有 `data-focus-key`（match-result-open-_/match-result-compare-_）保留以兼容焦点恢复机制；名次变化通过现有 `setLiveMessage` 全局 live region（page.tsx:7221，role=status aria-live=polite aria-atomic）播报一句摘要（如"预览 力量 优先：第一名变为 XX，2 把球拍名次变化"），不新增重复 live region。

#### 边界与降级

- 点击当前 committed 优先项胶囊 = 退出预览：清空预览 state、徽标与预览态文案全部消失，不播报名次变化。
- 预览榜单与基线完全相同（家族去重后同一前三）：不显示任何 ↑/↓ 徽标，live 播报"名次没有变化"，避免暗示不存在的差异。
- `buildRecommendations` 返回 4 条但结果屏只展示前 3：diff 按展示位数 3 计算"新上榜/跌出"；第 4 条不参与徽标判定。
- missing-result 恢复态（`matchRouteNotice === "missing-result"`）：结果屏渲染的是 recovery 分支，无 committed 档案，不渲染胶囊组。
- sessionPersistence 为 memory-only（存储不可用）：预览行为完全不变（本就不读写存储），现有 match-storage-warning 文案不因预览出现或消失。
- 快速连点多个胶囊：重算为同步纯函数，以最后一次点击为准；动画可被打断，reduced-motion 下无动画无中间态。
- 预览态下点击卡片"加入对比"或打开球拍详情：对比篮（compare-state 持久域）正常写入并保留；从详情返回结果页时预览已按 FR-5 还原为基线，属预期行为，不视为丢失。
- 预览态下点"对比前两名"：按当前显示（预览）榜单前两名装载，live 播报沿用现有"已装载匹配指数最高的两把球拍"语义。
- history.state 的 `paikuMatchScreen` 快照不含预览字段：任何历史导航还原后自然回到 committed 基线，无脏状态。
- 手动输入 `#match/step/3?任意脏参数`：现有 `parseAppRoute` 按 split("?") 忽略 query，行为与现状一致，预览不参与解析。

#### 无障碍要求

- 胶囊组 `role="group"` + 中文 aria-label；每个胶囊原生 button + `aria-pressed`，对齐问卷选项现有模式（page.tsx:5609-5642）。
- 触控目标 ≥44px，760px 断点下胶囊可换行/横向滚动均可，但不得截断文字（对齐 globals.css 现有 iOS 风格与断点体系）。
- 名次变化经现有全局 `setLiveMessage` live region 播报（polite），一次切换一条摘要，不逐卡轰炸读屏。
- 切换后焦点留在被点胶囊；不抢焦点到榜单或标题（区别于问卷步进的 `matchHeadingRef` 聚焦，预览是同屏更新非换屏）。
- 徽标信息不只靠颜色：↑/↓/新 字符 + aria-label 全文（如"较档案榜单上升 2 位"）。
- `@media (prefers-reduced-motion: reduce)` 内禁用全部位移/过渡动画，功能不降级。
- 明暗双主题下胶囊选中态与徽标对比度达标（沿用 globals.css 现有主题变量，不新增硬编码颜色）。

#### 路由与持久化

- 预览状态零持久化：不写 localStorage/sessionStorage 任何域，`serializeMatchFlow` v2 结构与 `persistMatchSnapshot`(page.tsx:3304) 不新增字段，session-state.ts 零改动。
- hash 路由零改动：结果页保持 `#match/step/3`，navigation-state.ts 的 parse/format/canonical 逻辑不动，预览不引入任何 query 参数。
- 历史栈零改动：预览切换不 push/replace history，`PaikuHistoryState` 与 `paikuMatchScreen` 快照不新增字段；popstate/前进后退还原后预览自然消失即为正确行为。

#### 验收标准

- 新增 tests/match-preview.test.mjs（node:test + 零框架，仿 tests/match-flow.test.mjs）：diff 纯函数覆盖 上升/下降/持平/新上榜/完全相同 五类；并遍历 3 阶段 × 5 打法 × 7×7 优先项组合（基线×预览）断言 diff 输出不抛错、delta 与两份 `buildRecommendations` 排序一致（仿 tests/match-engine.test.mjs 的全组合遍历风格）。
- 同文件或扩展现有正则断言测试（仿 tests/armory-presentation.test.mjs 的 readFile+assert.match 惯例）：page.tsx 含胶囊组 aria-label 与 `aria-pressed`、含预览态"未保存"文案、预览点击 handler 中不出现 `persistMatchSnapshot`/`pushPaikuHistory` 调用；globals.css 的 reduced-motion 块覆盖新动画类。
- 既有 18 个测试全绿（尤其 match-flow.test.mjs、match-engine.test.mjs、rendered-html.test.mjs、session-state.test.mjs 零改动零回归），match-flow.ts 与 serializeMatchFlow v2 结构 diff 为空。
- 手工验收：完成三问 → 结果页点"力量"→ 榜单同步重排且徽标正确 → 点"对比前两名"装载的是预览榜前两名 → 刷新页面 → 预览消失、榜单与档案回到原优先项 → 地址栏全程保持 #match/step/3。
- 读屏验收：VoiceOver 下切换胶囊可听到一条名次摘要播报，焦点未离开胶囊；系统开启"减弱动态效果"后无位移动画。

#### 涉及文件

- `app/page.tsx` — 修改：结果屏 `section.match-results-app`（5646-5731）内新增胶囊组与预览态文案；新增 `previewPriority` useState 及显示榜单 useMemo（复用已导出 `buildRecommendations`(689)/`recommendationReason`(716)，与 1490 行 committed 版 `recommendations` 并存）；`compareTopMatches`(5127) 改读显示榜单；离开结果屏/视图切换/popstate 时重置预览；切换时调用 `setLiveMessage` 播报
- `app/match-preview.ts` — 新增：纯逻辑模块，导出榜单名次 diff 纯函数（输入基线/预览两份 buildRecommendations 输出与展示位数，输出各 racket.id 的名次增减与是否新上榜），零 React 依赖
- `app/globals.css` — 修改：新增胶囊组（44px 触控、明暗主题、760px 断点）与名次徽标、位移过渡样式；在现有 `@media (prefers-reduced-motion: reduce)`(6268) 块补充禁用规则
- `tests/match-preview.test.mjs` — 新增：diff 纯函数单测（全组合遍历）+ page.tsx/globals.css 源码正则断言（"源码即规格"惯例）
- `app/match-flow.ts` — 不改动（明确约束）：committed/draft 状态机、serializeMatchFlow v2 均保持原样；预览仅复用其设计原则

#### 明确不做（Out of Scope）

- 不提供"把预览优先项一键保存为档案"——修改档案仍走既有"修改答案"三步流程（answerMatchDraft 提交语义不动）。
- 不做阶段/打法两个维度的秒切预览，只做优先项一个维度。
- 不把预览写入 URL（不加 query 参数、不做预览态深链分享）。
- 不改 recommendationScore/buildRecommendations 算法、权重或家族去重规则。
- 不展示第 4 名及"跌出前三去了哪"的完整对照表，只在前 3 卡片上打徽标。
- 不做 FLIP/共享元素级复杂动画，只用 CSS 过渡；reduced-motion 直接无动画。
- 不在发现页 featured/recommendation-list 复制同款预览控件。
- 不新增第 19 类测试形态（不引入测试框架、不加浏览器端 E2E），沿用 node:test 纯函数 + 源码正则惯例。

---

## 3. 相似平替查找（型号档案页「找相似的拍」）

> **用户故事**：作为正在查看某型号深度档案的球友，我想一键看到全库规格最接近的 3 把他牌型号及各自最大差异，以便在不换手感取向的前提下横向比价比货，并直接把候选加入对比。

#### 功能需求

- FR-1 区块展示：racket-inspector 滚动区内、`inspector-radar` 六维雷达之后新增「找相似的拍」区块（h3 标题 + 卡片列表），仅当当前型号五项规格（official.head/weight/pattern/balance/beam）齐全且存在至少 1 个合格候选时展示卡片；每张卡片显示品牌、型号名、缩略规格与最大差异标签，最多 3 张。
- FR-2 相似度算法：新增纯逻辑模块 app/similar-rackets.ts，导出 buildSimilarRackets(target: DeepRacket, pool: DeepRacket[], limit=3)：对拍面(in²)、重量(g)、线床(patternRanks 序数)、平衡点(mm)、框厚(beamAverage mm) 五维做归一化距离（每维 |Δ|/固定刻度常量，取均值），升序取前 limit；结果确定性（距离相同按 id 字典序破平），零副作用、不触 DOM/Storage。归一化刻度以具名常量写死在模块顶部，作为「源码即规格」的一部分。
- FR-3 候选过滤：候选必须满足 (a) brand ≠ 目标 brand（他牌平替定位）；(b) 五项 official 规格全部非 null 且 beam 可被 beamAverage 解析；(c) 按 familyId 去重、每拍系只留距离最近的 1 把（对齐 buildRecommendations 的拍系去重惯例）。线床无法映射 patternRanks 时：与目标字符串归一化后相同计 0 差，不同计满刻度 1（不因特色线床把整拍排除）。
- FR-4 诚实排除与空态：目标自身任一维缺失时不出卡片，改为诚实空态文案「该型号官网未公开〈缺失维列表〉，无法进行规格相似度排序」；候选侧的缺规格型号静默排除，区块脚注固定注明「官网规格不全的型号未参与排序」。合格候选不足 3 把时按实际数量展示，不凑数、不降低门槛。
- FR-5 最大差异标注：每张卡片标出五维中归一化差最大的一项，以带符号原单位展示（如「平衡点 −10 mm」「线床 18×20 vs 16×19」），格式对齐 numericFamilyPosition 的 formatDelta 风格（最多 2 位小数）；五维归一化差全部 < 0.1 时改标「五项规格几乎一致」。不展示相似度百分比或分数，避免伪精确。
- FR-6 卡片操作：每张卡片提供两个操作——「查看档案」调用现有 openRacket(id)（page.tsx:3972，自动推历史、更新 hash、记录返回焦点）；「+ 对比」调用现有 requestCompare(id)（page.tsx:4278，含满槽替换流程、undo、liveMessage 播报、Storage 持久化）。对比按钮三态与档案头部按钮一致：未加入「+ 对比」/ 已加入「✓ 移出」（aria-pressed=true）/ 篮满且未含「管理 3/3」。修正说明：构想中的 addCompareId 在源码中由 requestCompare→toggleCompare 间接调用，直接复用 requestCompare 以免绕过满槽/undo/播报逻辑。
- FR-7 诚实声明：区块底部固定一行注释：「按品牌官网公开的拍面、重量、线床、平衡点、框厚归一化接近度排序，属拍库相对评估；规格相似不等于手感等价，穿线、磅数与挥重差异仍会改变实际感受，不替代实际试打。」措辞风格与既有 inspector-note（page.tsx:7175-7178）一致。
- FR-8 导出复用：app/racket-profiles.ts 将现为模块私有的 beamAverage、normalizedPattern、patternRanks（约 164–217 行）改为 export 供 similar-rackets.ts 复用，不复制阈值常量，保证与规格标签口径单一来源。

#### 边界与降级

- 目标型号缺任一维（全库 56/259 把）：显示 FR-4 空态并列出缺失维度名，不渲染卡片、不报错。
- 合格他牌候选为 0（理论极端）：整个区块仅显示空态说明，不显示空列表。
- 候选 beam 为区间串（如 "23/26/23"）：用 beamAverage 取均值参与距离；解析不出数字视为缺失并排除。
- 特色线床（如 14×18）不在 patternRanks：按 FR-3 字符串等价降级比较，不抛异常。
- 相似型号已在对比篮：按钮呈「✓ 移出」态，点击走 toggleCompare 移除分支并播报。
- 对比篮已满 3/3：点击「+ 对比」进入 requestCompare 既有的选槽替换流程并跳转 compare 视图，原档案关闭行为与现有 header 按钮完全一致。
- 连续钻取（相似→档案→相似→档案）：每层由 openRacket 推入独立历史条目，Back 逐级返回并经既有 paikuRacketScrollTop 机制恢复滚动位置。
- 距离并列：按 id 字典序破平，保证两次渲染/SSR 与 CSR 结果一致。
- Web Storage 不可用：本功能不写任何存储，无降级路径需求；对比加入的降级提示由 commitCompareSlots 既有逻辑承担。

#### 无障碍要求

- 区块使用语义结构：h3 标题 + ul/li 列表，卡片操作为原生 button/a，不用 div 点击。
- 每个操作按钮 aria-label 含完整型号名（如「打开 Ezone 100 深度档案」「加入 Ezone 100 对比」），对比按钮带 aria-pressed，与 page.tsx:7058 现有模式一致。
- 按钮加 data-focus-key（如 similar-open-${id} / similar-compare-${id}），使 openRacket 的 rememberReturnFocus/焦点恢复机制在 Back 后能回落到触发按钮。
- 触控目标 ≥44px：复用 app-button 系列 class；新增样式在明暗双主题下对比度达标，760px 断点下卡片纵向堆叠。
- 不新增动画；如有过渡须落在既有 prefers-reduced-motion 降级规则内。
- 对比结果播报复用 requestCompare→setLiveMessage 的既有 aria-live=polite 通道，不新增 live region。

#### 路由与持久化

- 零新增 hash 参数与存储：相似列表由 selected.id 确定性派生，随既有 #<view>/racket/:racketId 深链天然可分享；脏 id 的 canonical 化由既有 parseAppRoute/deepRacketById（含 legacy id 别名，page.tsx:240-246）路径处理，无需改动。
- 点击「查看档案」复用 openRacket 的 pushPaikuHistory：推入新历史条目、更新 hash、记录 paikuRacketScrollTop 与返回焦点；浏览器 Back 逐级回到来源档案。
- 「+ 对比」经 requestCompare→commitCompareSlots 复用既有 compare 域 Web Storage 持久化与「memory-only」降级播报，本功能不新增持久化代码。

#### 验收标准

- 新增 tests/similar-rackets.test.mjs（node --test + tsx，与现有 18 个测试同框架，纳入 npm test 通配）：断言 (1) 任意目标返回 ≤3 且全部 brand ≠ 目标 brand；(2) 返回 id 全部存在于 deepRackets；(3) 返回中无重复 familyId；(4) 五维任一缺失的候选绝不出现在结果中；(5) 目标缺规格时返回含缺失维度列表的空结果对象；(6) 同一输入两次调用结果逐项相等（确定性）；(7) 结果按距离非降序排列；(8) 每条结果的最大差异维度确为五维归一化差的最大者。
- 在该测试文件中追加对 app/page.tsx 源码的正则断言（对齐 armory-presentation 风格）：包含「找相似的拍」标题、「规格相似不等于手感等价」与「官网规格不全的型号未参与排序」措辞、similar-open-/similar-compare- focus key。
- 手动验收：打开规格齐全型号（如 Blade 100 V10）档案见 3 张他牌卡片各带最大差异标签；打开缺规格型号见诚实空态；点「查看档案」hash 变为 #view/racket/:id 且 Back 返回原档案并恢复滚动与焦点；篮满时点「+ 对比」进入替换选槽流程。
- npm test 全量（现有 18 个 + 新增 1 个）通过；npm run build 无 TS 错误；不出现 console.log。

#### 涉及文件

- `app/similar-rackets.ts` — 新增：纯函数 buildSimilarRackets 与 SimilarRacketResult/SimilarRacketEmpty 类型、五维归一化刻度常量、最大差异计算与格式化。
- `app/racket-profiles.ts` — 修改：为 beamAverage、normalizedPattern、patternRanks（现模块私有，约 164–217 行）加 export，供新模块复用；不改动任何现有行为。
- `app/page.tsx` — 修改：racket-inspector 滚动区 inspector-radar 之后（约 7168–7178 行间）新增「找相似的拍」区块；复用 openRacket(3972)、requestCompare(4278)、compareIds(1650)、deepRacketById(234)；相似结果用 useMemo 按 selected.id 派生。
- `app/globals.css` — 修改：新增 .similar-rackets 区块与卡片样式，明暗双主题 + 760px 断点 + 44px 触控目标。
- `tests/similar-rackets.test.mjs` — 新增：纯函数单测 + page.tsx 源码正则断言（见验收标准）。

#### 明确不做（Out of Scope）

- 同品牌内的相似推荐（本功能定位「他牌平替」；同系替代已有「查看拍系全部型号」入口）。
- 六维评分、阶段、打法参与相似度计算（评分是拍库派生值，混入会稀释「基于官网公开规格」的诚实口径）。
- 相似度百分比/得分的数值化展示。
- 档案页以外的入口（armory 卡片、对比页、推荐结果页不加「找相似」）。
- hash 新增查询参数或 Web Storage 持久化相似区状态（列表为确定性派生，无状态可存）。
- 价格、库存、渠道数据接入。
- 挥重(swingweight)、硬度(RA) 等官网未收录维度。
- 可调权重/自定义相似度 UI。
- 服务端或 AI 相似度计算（保持全静态确定性派生）。

---

## 4. 对比白话解读（差异翻译）

> **用户故事**：作为一名看不懂规格数字的业余球员，我想在对比页雷达图下方看到用白话解释的最大规格差异（如「A 比 B 轻 15 g：挥拍更省力，但对抗重球时稳定性相对略降」），以便不做数字换算就能理解差异对实际打球的影响。

#### 功能需求

- FR-1 区块渲染条件：对比视图装载 ≥2 把球拍时，在 .compare-radar-card 区块之后、.compare-product-grid 之前渲染「差异翻译」区块（section + 标题「差异翻译」+ 副标「按官网公开规格的确定性规则生成」）；装载 0 或 1 把时该区块完全不渲染（1 把时现有「还差一把」引导保持不变）。
- FR-2 纯逻辑模块：新增 app/compare-insights.ts，导出 buildCompareDiffInsights(rackets: DeepRacket[])，输入按槽位顺序的已装载球拍，输出确定性差异条目数组（含 key、显著度、白话句、涉及的两把球拍 id）；函数不依赖 DOM/随机/时间，对相同输入永远输出相同结果。数值一律取 racket.official 原始字段（number|null），不得使用展示层被置 0 的 racket.weight/racket.head。
- FR-3 差异判定规则：对六个规格维度逐一计算——weight/head/balance/beam(均厚)/length 取装载球拍中的极值对求差值，pattern 用 patternRanks 序差；每维设固定显著阈值（建议：weight ≥10g、head ≥3in²、balance ≥5mm、beam 均厚 ≥2mm、length ≥0.2in、pattern 序差 ≥1，最终以实现时写入测试的常量为准）；低于阈值的维度不生成句子；显著维度按「差值/阈值」比降序排列，并列时按 weight>head>pattern>balance>beam>length 固定顺序 tie-break；最多输出 3 条。
- FR-4 白话句模板：每条句子为确定性模板，点名两把球拍型号 + 官网单位数值差 + 双方 specTags 对应维度的 characteristic 措辞（如「Blade 100 V10 比 Pure Drive 轻 15 g（轻量 · 灵活 vs 主流重量）：更易加速挥拍，对抗来球分量时稳定性相对略降」）；三拍装载时固定取该维极值对并点名型号；每条句子尾部附「基于规格推断」标注，措辞使用相对语气（更/相对/略），禁止绝对断言。
- FR-5 最大差值行高亮：显著度第一的维度对应的对比表规格行（comparisonRows 中裸拍重量/拍面/线床/平衡点/框厚/长度之一）添加高亮样式类，并在该行 th[scope=row] 内追加可见「差异最大」文字徽标（不得仅靠颜色传达）；无任何显著维度时不高亮任何行。为此 comparisonRows 的六个规格行需补充与 RacketSpecTag.key 对应的稳定 key 字段。
- FR-6 数据诚实降级：任一装载球拍在某维为 null（官网未公开）则该维不参与差异计算，且区块底部以一行说明列出「以下参数官网未公开，未参与解读：平衡点、长度…」；六维全部不可比时区块显示回退文案「两把球拍的公开规格不足以生成差异解读」；全部可比维度均低于阈值时显示「六项公开规格均处于相近区间，无显著差异可解读」；区块级免责声明沿用现有口径：「基于官网公开硬规格的拍库相对推断，非实验室测量」。
- FR-7 路由与持久化零新增：差异翻译完全由现有 r0/r1/r2 对比槽位派生，不新增任何 hash 参数、不新增任何 Web Storage 键；通过分享深链（#/compare?r0=…&r1=…）直接打开时，经现有 parseCompareRouteState 失效 id 拒绝与 canonical 化后，差异翻译内容与站内操作产生的完全一致。
- FR-8 测试（源码即规格）：新增 tests/compare-insights.test.mjs，包含（a）纯函数单测：阈值边界、null 跳过与披露、三拍极值对与并列 tie-break 确定性、输出句子无 NaN/undefined/null 字样、遍历全部 259 把两两组合不抛错且输出确定；（b）对 app/page.tsx 的源码正则断言：差异翻译区块存在、含「基于规格推断」与「非实验室测量」措辞、高亮徽标不只靠颜色（存在可见文字）；npm test（18+1 个测试文件）全绿。

#### 边界与降级

- 对比槽仅 1 把或 0 把：区块不渲染，现有空态/「还差一把」引导不受影响。
- hash 携带失效/脏 id：由现有 parseCompareRouteState 拒绝并 canonical 化，差异翻译只对成功解析的球拍计算，不需自行容错。
- 同系共用规格的两把（如同拍系仅涂装差异）：全部维度低于阈值，显示「公开规格均处于相近区间」回退文案，不硬造差异。
- 某维一方为 null（如平衡点官网未公开）：该维跳过并在「未参与解读」说明中列出，绝不将 null 当 0 参与计算。
- 平衡点已知但长度未知：差异句仅基于官网平衡点 mm 差值，不做重心/midpoint 二次推算（balanceCharacteristic 此时为「缺长度参照」，措辞照抄即可）。
- 三拍中两拍在某维数值并列极值：按槽位序取先者，tie-break 写入测试保证确定性。
- 小数规格（length 27.25、beam 均厚等）：格式化后无 NaN/undefined，浮点差值按 formatDelta 同风格保留最多两位小数。
- Web Storage 不可用：本功能不读写任何存储，无降级路径需要处理（对比槽本身的降级由 session-state 现有逻辑负责）。

#### 无障碍要求

- 区块为 section + aria-labelledby 指向可见标题，层级与现有 compare-radar-card 一致。
- 白话句使用语义列表 ul/li，「基于规格推断」标注为句内可见文本（非 title/tooltip）。
- 最大差值行高亮不得仅靠颜色：th 内有可见「差异最大」文字徽标；明暗双主题下对比度达标。
- 本功能不新增可交互控件，因此无新增焦点管理/44px 触控要求；若实现中引入任何按钮则违反 outOfScope。
- 不新增动画；如加高亮过渡需遵循现有 prefers-reduced-motion 处理。
- 对比表现有 role=region、aria-describedby=compare-scroll-hint、tabIndex 滚动语义保持不变。

#### 路由与持久化

- 不新增 URL/hash 参数：差异翻译完全由现有 #/compare?r0/r1/r2 槽位派生。
- 现有 formatCompareRouteState/parseCompareRouteState 的 canonical 化与失效 id 拒绝行为保持不变，作为本功能的唯一输入入口。
- 不新增 Web Storage 键；session-state.ts 的 match/compare/tour/catalog 四域不改动。
- 「复制对比」分享链接无需任何改动即可携带差异翻译（内容确定性派生）。

#### 验收标准

- 装载两把规格齐全的球拍（如 Blade 100 V10 与任一 Pure Drive 型号），差异翻译区块显示 1–3 条白话句，每条含型号点名、带单位数值差、双方 characteristic 措辞、「基于规格推断」标注。
- 显著度第一的维度在对比表对应行出现高亮类与可见「差异最大」徽标；移除球拍至 1 把后区块与高亮同时消失。
- 直接打开 #/compare?r0=…&r1=… 深链，差异翻译内容与站内加入对比后所见完全一致；携带失效 id 时地址被 canonical 化且不崩溃。
- 装载官网规格缺失的球拍（specCoverage 低的型号），缺失维度出现在「未参与解读」说明中，且没有任何句子基于 null 值生成。
- 新增 tests/compare-insights.test.mjs 通过：阈值边界、null 披露、tie-break 确定性、259 拍两两组合无异常、page.tsx 源码正则断言（「基于规格推断」「非实验室测量」措辞与徽标文字存在）。
- npm test 全部（19 个文件）通过，npm run lint 无新增告警；page.tsx 不引入新的外部依赖。

#### 涉及文件

- `app/compare-insights.ts` — 新增：导出 buildCompareDiffInsights(rackets: DeepRacket[]) 纯函数，实现阈值判定、显著度排序、tie-break、白话句模板与未公开维度披露清单。
- `app/page.tsx` — 修改：compare 视图在 .compare-radar-card（约 6506-6520 行）之后新增「差异翻译」区块；comparisonRows（5141 行）六个规格行补充与 RacketSpecTag.key 对应的稳定 key，并按最大差值维度加高亮类与「差异最大」徽标。
- `app/racket-profiles.ts` — 修改：为模块私有的 beamAverage（164 行）与 patternRanks（209 行）添加 export，供 compare-insights.ts 复用，避免重复实现（characteristic 措辞经 DeepRacket.specTags 直接读取，无需导出私有函数）。
- `app/globals.css` — 修改：新增差异翻译区块样式与 .compare-spec-table 高亮行/徽标样式，覆盖明暗双主题与 760px 断点，不新增动画。
- `tests/compare-insights.test.mjs` — 新增：纯函数单测（阈值/null/tie-break/259 拍两两组合确定性/无 NaN）+ 对 app/page.tsx 的源码正则断言（区块与数据诚实措辞存在）。

#### 明确不做（Out of Scope）

- 不做 LLM/AI 生成文案，全部句子来自确定性模板与规则。
- 不解读六维评分（scores/雷达图数值）差异——评分本身是派生评估，再翻译属于二次推断，仅解读六项官网硬规格。
- 不新增 hash 参数、存储键或任何持久化状态。
- 三拍时不提供逐对切换器（A/B 选择 UI），固定取各维极值对。
- 不新增任何可交互控件（折叠、tooltip、维度筛选）。
- 不改动推荐算法、球拍详情页（深度档案）与拍系检查器中的规格标签展示。
- 不做英文/多语言版本，不做分享卡片或图片导出。
- 不调整 buildRacketSpecInsights 现有措辞与阈值（仅复用其产物；racket-profiles.ts 仅允许为 beamAverage 与 patternRanks 加 export）。

---

## 5. 购买链接体检：新增 scripts/check-purchase-links.mjs 定期检测 259 个官网购买链接，产出链接健康 manifest，零框架测试守护硬失效归零，UI 对"页面已变动"链接做数据诚实降级

> **用户故事**：作为正在选拍的球友，我想在点击「前往官网」之前就知道该链接是否仍指向有效的官方商品页，以便不被 404 或改版后的页面浪费时间，并继续信任拍库"数据诚实"的承诺。

#### 功能需求

- FR-1 体检脚本：新增 scripts/check-purchase-links.mjs（node --import tsx 运行），从 catalogFamilies flatMap 出 259 条 { id: catalogRacketId(family, modelIndex), url: model.url }（与 sync-catalog-images.mjs 第 23-32 行完全同构），复用其已验证模式：CLI 参数 Map 解析（--write/--brand/--limit/--concurrency，并发默认 5、上限 10）、runPool 游标并发池、fetchResponse（AbortController 25 秒超时、redirect:"follow"、同款含 PaikuCatalogVerifier/1.0 的 UA）、Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Shanghai"}) 生成 checkedAt 日期、逐条 NDJSON 写 stdout、结束输出 JSON 汇总、manifest 按键 localeCompare 排序后写盘。修正说明：构想称复用"重试模式"，但经核实源脚本并无重试逻辑（仅图片候选回退），本脚本需自行新增"失败后退避约 2 秒重试一次"以降低瞬时网络误报。
- FR-2 三态判定（化解构想内部冲突的核心设计）：每条链接判定为 ok/changed/broken 三态之一，另有不落盘的 unreachable——(a) 最终响应 2xx 且未发生重定向、或重定向后仍同官方域（含子域）且路径尾段 slug 不变 → ok；(b) 最终 2xx 但重定向落到不同路径尾段、站点首页("/"或纯 locale 根)、search/404/not-found 类路径、或跨到非官方域 → changed（官网改版信号，驱动 UI 降级）；(c) 重试一次后仍为 HTTP 404/410 或 DNS 解析失败 → broken（硬失效，测试强制归零，提交前必须修 catalog-data.ts 的 url）；(d) 403/405/429/5xx/超时等（重试后仍失败）→ unreachable：不改写该 id 的既有记录（保留上次状态），仅在 stdout 汇总中报告——反爬拦截≠链接失效，避免误伤数据诚实。
- FR-3 健康 manifest 与类型包装：新增 app/purchase-link-health.json，键为 catalogRacketId 生成的稳定型号 id，值为 { url, status: "ok"|"changed"|"broken", httpStatus: number|null, finalUrl?: string, checkedAt: "YYYY-MM-DD" }；新增 app/purchase-link-health.ts 按 app/catalog-model-images.ts 同款模式（import JSON + 导出带类型断言的 Record）供应用层与测试消费。脚本仅在 --write 时落盘。
- FR-4 零框架测试（源码即规格）：新增 tests/purchase-link-health.test.mjs，按 tests/catalog-model-images.test.mjs 范式断言——manifest 键集合与 259 个 catalogRacketId 完全一致（Object.keys 数量 === catalogModelCount 且 deepEqual 排序后 id 列表）；每条 record.url 严格等于对应 model.url（体检溯源与目录一致）；url 以 https:// 开头；status 属于合法枚举；checkedAt 匹配 /^\d{4}-\d{2}-\d{2}$/ 且不晚于当前日期+1 天；status === "broken" 的条目数为 0。修正说明：构想的"断言失效数为零"落在 broken 态——changed 态允许长期存在于 manifest（它正是 UI 降级的数据源），否则"测试归零"与"UI 降级"永远不能同时成立。
- FR-5 派生链路注入：app/racket-profiles.ts 的 DeepRacket 类型（buyUrl/buyLabel 位于第 52-53 行）新增可选字段 buyLinkChanged?: boolean；buildDeepRacket（第 730 行起，buyUrl: model.url 在第 786 行）沿用其读取 catalogModelImages[id] 的同款模式读取 purchaseLinkHealth[id]，当 status === "changed" 时置 buyLinkChanged: true。broken 分支无需进入 UI——FR-4 已保证提交态 manifest 中 broken 恒为零。
- FR-6 UI 数据诚实降级（三处已核实的链接渲染点）：当 buyLinkChanged 为真时——(a) 深度档案页脚购买按钮（app/page.tsx 约 7202 行 href={selected.buyUrl}）、(b) 对比视图 compare-buy-grid（约 6638 行 href={racket.buyUrl}）、(c) 拍系规格表"官网资料 ↗"（约 6960 行 href={model.url}，该行作用域内已有 racketProfile 可取 buyLinkChanged）——均追加小字提示「官网页面已变动」，链接保持可点并仍指向原官网 URL（不隐藏、不替换为第三方渠道、不伪造可用性），措辞与现有"官网未公开/拍库相对评估非实验室测量"同一诚实口径；对应 aria-label 更新为如「前往 Wilson 官网查看 …（官网页面已变动），新标签页打开」。
- FR-7 去重抓取与可诊断日志：259 条链接实测仅 255 个唯一 URL（4 组型号共享商品页，已用脚本核实），体检按唯一 URL 抓取一次、结果广播到共享该 URL 的所有 id，减少对官网的请求压力；每条结果以 NDJSON 输出 { id, url, status, httpStatus, finalUrl, attempt }，结尾输出 { write, requested, uniqueUrls, manifest, counts: {ok, changed, broken, unreachable} } 汇总；存在 broken 时 process.exitCode = 2（与图片脚本 counts.failed 约定一致），日志字段需足以在不复跑的情况下定位单条失败原因。
- FR-8 命令入口：package.json scripts 新增 "links:check": "node --import tsx scripts/check-purchase-links.mjs"（与既有 "images:sync" 完全同款调用方式）；"定期检测"在本仓库现实中指人工定期执行 links:check --write 后随数据 PR 提交 manifest——仓库无任何 CI/cron 配置（已核实无 .github 目录），自动化排程见 outOfScope。

#### 边界与降级

- 首次运行时 app/purchase-link-health.json 不存在：脚本按图片脚本同款 try/catch 从空对象起步，不报错；但 FR-4 测试要求提交态 manifest 必须全量覆盖 259 id，故首次 --write 必须全量跑完再提交。
- unreachable（403/429/5xx/超时）：不落盘、保留该 id 上次记录、只进 stdout 汇总——避免品牌官网反爬导致的假"已变动"降级；若该 id 从未有记录则跑完后 manifest 缺键、测试红灯，属预期（无法确认就不许上线声称健康）。
- UI 防御性降级：page.tsx/racket-profiles 若查不到某 id 的健康记录（理论上被测试排除），按无标记处理即正常显示链接，不显示降级提示——宁可漏报也不误报"已变动"。
- 共享 URL 的 4 组型号：同一 URL 的判定结果必须一致地广播到每个 id，禁止同 URL 出现互相矛盾的 status。
- 重定向到同域 locale 变体或加尾斜杠但路径尾段 slug 不变：判 ok，避免把品牌站常规 locale 跳转误报为改版。
- broken 出现时的处置路径：测试红灯 → 人工修正 catalog-data.ts 中该 model 的 url（源码即规格，体检只报告不自动改数据）→ 重跑 links:check --write → 测试转绿；注意 tests/catalog-model-images.test.mjs 第 60 行同时断言图片 sourceUrl === model.url，改 url 后需同步重跑 images:sync 该型号，验收中需提醒。
- hash 深链不受影响：降级纯属渲染差异，#racket/#family 等深链、脏参数 canonical 化（navigation-state.ts）与历史栈行为零变化。
- Web Storage 不可用场景不受影响：本功能不读写任何浏览器存储，session-state.ts 四域不变。

#### 无障碍要求

- 降级提示不得只靠颜色区分：「官网页面已变动」为可见文字节点，装饰性图标（如有）加 aria-hidden="true"，与现有 ↗ 图标处理方式一致。
- 三处链接的 aria-label 在降级时同步携带「官网页面已变动」信息，屏幕阅读器用户获得与视觉用户等量的信息（对齐现有 aria-label 模板「前往 … 官网查看 …，新标签页打开」）。
- 追加小字提示不得压缩链接/按钮的可点区域至 44px 触控目标以下（对齐 globals.css 现有 min-height 约定）。
- 提示文字在明暗双主题下均满足 WCAG AA 对比度（globals.css 双主题变量体系内取色）。
- 不新增动效；若加过渡需纳入现有 prefers-reduced-motion 降级规则。

#### 路由与持久化

- 零浏览器持久化：不新增 Web Storage 键，session-state.ts 的 match/compare/tour/catalog 四域接口不变。
- 零路由变化：不新增 hash 参数，#racket/#family 等深链、脏参数 canonical 化与历史栈（navigation-state.ts）行为完全不变；降级提示随静态 manifest 构建期确定，同一深链在所有访客处呈现一致。
- manifest 为仓库内静态 JSON（构建期打包，与 catalog-model-images.json 同生命周期），仅脚本带 --write 时落盘，UI 与测试只读。

#### 验收标准

- 本地执行 npm run links:check（先不带 --write）：stdout 逐条输出 259 条 NDJSON、末尾汇总含 counts 与 uniqueUrls=255，且不写任何文件；带 --write 时生成键排序的 app/purchase-link-health.json；存在 broken 时退出码为 2。
- 新增 tests/purchase-link-health.test.mjs 全绿，覆盖 FR-4 全部断言（259 覆盖一致性、url 溯源相等、https、枚举、日期格式与不在未来、broken===0）；npm test 下 18 个既有测试文件 + 新文件共 19 个全部通过。
- tests/deep-rackets.test.mjs 第 39-40 行既有断言（buyUrl === model.url、https）不回归。
- 手动将 manifest 中任一条 status 改为 "changed" 后构建：深度档案页脚、对比 compare-buy-grid、拍系规格表三处均出现「官网页面已变动」小字，链接仍可点且 href 不变，aria-label 含降级说明；改回 "ok" 后提示消失。
- status 为 "ok" 的型号在三处 UI 与改动前逐像素等价（无多余 DOM/文案），SSR 冒烟测试 tests/rendered-html.test.mjs 保持通过。
- npm run lint 通过；新脚本与新测试均为零框架（仅 node:test / node:assert / 原生 fetch），不新增任何依赖。

#### 涉及文件

- `scripts/check-purchase-links.mjs` — 新增：链接体检脚本，镜像 scripts/sync-catalog-images.mjs 的参数解析/runPool 并发池/fetchResponse(25s 超时+PaikuCatalogVerifier UA)/Asia-Shanghai 日期/NDJSON/排序落盘/退出码模式，自行新增一次退避重试（源脚本无重试，构想措辞已修正）
- `app/purchase-link-health.json` — 新增：259 键健康 manifest（url/status/httpStatus/finalUrl/checkedAt），仅由脚本 --write 生成
- `app/purchase-link-health.ts` — 新增：JSON 类型包装，仿 app/catalog-model-images.ts 的 import + as Record 断言模式
- `app/racket-profiles.ts` — 修改：DeepRacket 类型（buyUrl/buyLabel 现位于 52-53 行）新增 buyLinkChanged?: boolean；buildDeepRacket（786 行 buyUrl: model.url 处）读 purchaseLinkHealth[id] 注入标记，沿用其 catalogModelImages[id] 读取模式
- `app/page.tsx` — 修改：三处链接渲染点降级——约 7202 行 selected.buyUrl 档案页脚、约 6638 行 compare-buy-grid racket.buyUrl、约 6960 行拍系规格表 model.url（该作用域已有 racketProfile），追加「官网页面已变动」提示并更新 aria-label
- `tests/purchase-link-health.test.mjs` — 新增：零框架 manifest 测试，仿 tests/catalog-model-images.test.mjs 范式（覆盖一致性/溯源/https/日期/broken===0）
- `package.json` — 修改：scripts 新增 "links:check"，与既有 "images:sync" 同款 node --import tsx 调用
- `app/globals.css` — 修改：新增降级提示小字样式（明暗双主题变量取色、不压缩 44px 触控目标）

#### 明确不做（Out of Scope）

- CI/cron 自动定时执行：仓库无 .github 与任何 CI 配置（已核实），本期"定期"即人工执行 npm run links:check；接入自动排程另立任务。
- 自动修复/改写 catalog-data.ts 中的 url：体检只报告，修数据永远是人工审阅后的独立提交（数据诚实：不让脚本猜新链接）。
- familyUrl（49 个拍系官网链接）、tour-links.ts 球员链接、brand-data.ts 品牌链接的体检——本期仅 259 个型号购买链接。
- 无头浏览器渲染级检测与页面内容比对（如断言页面标题包含型号名、JS 渲染 soft-404 识别）：超出零框架与一天工作量，原生 fetch 状态码+重定向判定已覆盖主要失效形态。
- UI 展示 checkedAt 日期、健康总览面板或历史趋势。
- broken 链接的第三方替代购买渠道推荐（违背"仅官网"原则）。
- 为降级状态新增 hash 参数或可分享视图——降级是纯渲染差异，navigation-state.ts 不动。

---

## 6. 拍库严选榜单（发现页编辑榜单区）

> **用户故事**：作为还没想清楚具体需求的选拍球友，我想在发现页直接看到按公开规格条件和评分门槛自动筛出的严选榜单（如「新手第一支拍」「控制型进阶拍」）及其透明的入选标准，以便不做问卷也能快速圈定可信候选并一键进入档案深读。

#### 功能需求

- FR-1 发现页新增「拍库严选」榜单区：渲染在现有选拍提示卡（insight-card，page.tsx 约 5446-5466 行）之后、discover-shortcuts（约 5468-5483 行）之前；无论用户是否完成匹配（hasCompletedMatch 两种布局）均展示且位置一致，随 discover 默认视图 SSR 直出；首发两个榜单：「新手第一支拍」「控制型进阶拍」。
- FR-2 新增纯逻辑模块 app/curated-lists.ts：每个榜单由 criteria 对象声明——硬性规格条件（仅基于 DeepRacket.official 六项官网规格与 stages 派生阶段，如 head≥100 in²、weight≤295g、stages 含「入门」）+ 派生评分门槛（基于 scores 六维，如 forgiveness≥78、control≥85）；导出 buildCuratedListEntries(lists, rackets) 纯函数，输出确定性：单榜单内按 familyId 去重（无 familyId 回退 series，对齐 buildRecommendations 的既有约定，page.tsx:708）、每榜上限 4 款、按六维总分降序、同分按 model.localeCompare(x, "en") 稳定排序。
- FR-3 条目由筛选器自动筛出而非人工钦点：curatedLists 数据中禁止出现任何具体型号 id 白名单；卡片上展示的入选标准文案必须由同一 criteria 对象的 label 字段逐条生成（单一事实源），保证「展示的标准」与「实际执行的筛选」永不漂移；由源码正则测试断言 curated-lists.ts 不含 catalog- 前缀的型号 id 硬编码。
- FR-4 每个榜单卡顶部固定一个「入选标准」折叠控件：默认折叠，摘要行显示条数（如「3 项硬性规格条件 + 2 项评分门槛」）；展开后逐条列出标准，硬性条件与评分门槛分组呈现；评分门槛组固定注明「六维评分为拍库相对评估，非实验室测量」（对齐 page.tsx:477 既有措辞）；折叠状态仅存组件 state，不写入 hash、不写入 Web Storage。
- FR-5 每个入选条目显示品牌、型号、代际与关键公开规格（复用 DeepRacket.official / specTags，未公开项显示「—」或「官网未公开」，不得推测补值），并提供两个操作：「查看档案」调用现有 openRacket(racket.id)（page.tsx:3972），产生 #discover/racket/<id> 可分享深链；「加入对比」调用现有 requestCompare(racket.id)（page.tsx:4278），按钮 aria-pressed 与 3/3 满员文案对齐 featured-racket 区既有实现（page.tsx:5360-5371）。
- FR-6 数据诚实降级：硬性规格条件涉及的官网字段为 null（未公开）时，该型号判定为不满足、不入选（宁缺毋滥，不用派生值顶替官网值做硬性判定）；若某榜单筛出不足 2 款，榜单卡仍渲染完整入选标准，条目区显示空态文案「当前拍库暂无满足全部标准的型号」，禁止在运行时放宽标准凑数。
- FR-7 深链与 canonical 完全复用现有机制：parseAppRoute 已支持 #discover/racket/<id>（navigation-state.ts:103-106），失效 id 复用现有「该球拍链接已失效，已返回当前栏目」提示（page.tsx:2221），脏参数由现有 formatCurrentRoute 对比替换逻辑 canonical 化（page.tsx:2457）；本功能不新增 AppView、不修改 navigation-state.ts（修正说明：构想中「是否需要新路由段」经核实为否）。
- FR-8 无障碍对齐现有水准：榜单区为 section + aria-labelledby 指向榜单区标题；折叠控件为原生 button，带 aria-expanded 与 aria-controls 指向标准列表容器 id（对齐 page.tsx:5910-5911 的 catalog-filter-panel 模式）；「查看档案」「加入对比」按钮带 data-focus-key（如 curated-open-<listId>-<racketId>）纳入现有焦点恢复机制；全部可点目标 ≥44px；折叠展开不依赖动画，过渡受 globals.css:6268 的 prefers-reduced-motion reduce 块约束。
- FR-9 测试（源码即规格）：新增 tests/curated-lists.test.mjs 纯函数单测——两次调用 deepEqual 验证确定性、单榜 familyId 无重复、条目数 ≤4、null 官网字段不入选、每条入选条目逐项满足其榜单 criteria、源码无型号 id 硬编码；tests/rendered-html.test.mjs 增补 SSR 冒烟断言——直出 HTML 含两个榜单标题、「入选标准」折叠按钮与「拍库相对评估」措辞，并用源码正则断言榜单区调用 openRacket 与 requestCompare。

#### 边界与降级

- 官网规格字段为 null：硬性条件判为不满足、直接不入选；条目展示层同样显示「—/官网未公开」，全程不出现猜测值。
- 榜单筛出结果不足 2 款（未来目录数据更新可能触发）：仍渲染标准，条目区空态文案，不放宽标准；单测覆盖空结果分支。
- Web Storage 不可用（memory-only 环境）：榜单功能零依赖存储，行为完全不变；折叠状态为组件内 state，刷新后回默认折叠属预期。
- 深链中的 racket id 失效：复用现有降级（live region 播报「该球拍链接已失效，已返回当前栏目」），无需新代码。
- 脏 hash（如 #discover?x=1 或多余段）：现有 canonical 化逻辑已覆盖 discover 视图，无需新代码。
- 同一型号命中多个榜单：允许跨榜单重复出现（各榜单独立成立），仅单榜单内做拍系去重。
- 同一拍系多款满足标准：familyId 去重后只保留排序最高的一款，避免榜单被单一拍系刷屏。
- prefers-reduced-motion 用户：折叠展开为纯显隐切换，无必需动画。
- SSR 与客户端一致性：榜单由静态 deepRackets 确定性派生，服务端与客户端渲染结果必然一致，无 hydration 分歧风险。

#### 无障碍要求

- 榜单区 section + aria-labelledby 指向区标题 id；每个榜单卡有自己的 heading 层级（h2/h3 对齐 discover 视图现状）。
- 折叠控件用原生 button + aria-expanded + aria-controls（指向标准列表容器 id），键盘 Enter/Space 可操作。
- 条目操作按钮带 data-focus-key，进入档案再返回时由现有 rememberReturnFocus/焦点恢复机制找回焦点。
- 「加入对比」按钮 aria-pressed 反映在篮状态，满员时文案变「管理对比 3/3」，与 featured-racket 区一致。
- 所有可点目标 min-height/min-width ≥44px，沿用 globals.css 既有约定。
- 评分门槛的「拍库相对评估，非实验室测量」说明为可见文本而非仅 title/aria-label，读屏与视觉用户获得同等信息。
- 折叠过渡纳入 globals.css:6268 prefers-reduced-motion reduce 块。

#### 路由与持久化

- 不新增持久化域：session-state.ts 的 match/compare/tour/catalog 四域保持不变，榜单功能零存储依赖。
- 折叠状态不写入 hash、不写入 Web Storage，仅组件 state（刷新回默认折叠）。
- 档案深链完全复用既有 #<view>/racket/<id> 路由段与 openRacket 的 history push；不修改 navigation-state.ts、不新增 AppView。
- 脏参数 canonical 化依赖现有 formatCurrentRoute 替换逻辑（page.tsx:2457），本功能无新增 canonical 规则。

#### 验收标准

- npm test 全绿：含新增 tests/curated-lists.test.mjs 与更新后的 tests/rendered-html.test.mjs，不破坏现有 18 个测试文件。
- 单测断言：buildCuratedListEntries 两次调用结果 deepEqual；每榜条目 ≤4 且 familyId 无重复；构造含 null 官网字段的型号不入选；每条入选条目逐项满足其榜单全部 criteria；curated-lists.ts 源码不匹配 /catalog-[a-z0-9-]+/ 型号 id 硬编码（榜单 id 自身命名避开该前缀）。
- SSR 冒烟：直出 HTML 含「新手第一支拍」「控制型进阶拍」「入选标准」与「拍库相对评估」字样。
- 手动验收：未完成匹配与已完成匹配两种发现页布局下榜单区均出现且位置一致；折叠默认收起，展开后逐条显示标准；键盘可完整操作。
- 手动验收：点击「查看档案」后地址栏为 #discover/racket/<id>，复制到新标签直达同一档案；关闭档案返回后焦点回到来源按钮。
- 手动验收：「加入对比」与对比篮 3 槽位联动、可撤销提示正常；明暗双主题及 760px 以下窄屏布局无溢出。
- lint 通过（eslint 现有配置）。

#### 涉及文件

- `app/curated-lists.ts` — 新增：CuratedList/CuratedCriterion 类型、curatedLists 常量（首发 2 个榜单的 criteria+label）、buildCuratedListEntries(lists, rackets) 纯函数；类型引用 racket-profiles.ts 已有导出 DeepRacket/ScoreKey/Stage。
- `app/page.tsx` — 修改：discover 视图内（insight-card 与 discover-shortcuts 之间，约 5466-5468 行处）新增榜单区渲染与折叠 state；复用已核实的 openRacket(page.tsx:3972)、requestCompare(page.tsx:4278)、deepRacketById(page.tsx:234)、data-focus-key/aria-pressed 既有模式；import app/curated-lists.ts。
- `app/globals.css` — 修改：新增 .curated-list 系列样式（沿用 CSS 变量明暗双主题、760px 断点、44px 触控），必要过渡纳入 6268 行 prefers-reduced-motion reduce 块。
- `tests/curated-lists.test.mjs` — 新增：零框架纯函数单测（确定性、去重、上限、null 不入选、criteria 逐项校验、无型号 id 硬编码的源码正则断言）。
- `tests/rendered-html.test.mjs` — 修改：SSR 冒烟增加榜单标题/「入选标准」/「拍库相对评估」断言；源码正则断言榜单区接线 openRacket 与 requestCompare。

#### 明确不做（Out of Scope）

- 不新增独立路由段或视图（无 #lists / #discover/list/<id> 榜单专属深链，也不做定位滚动锚点）。
- 首发仅 2 个榜单；更多榜单（力量拍、护臂拍等）留待后续迭代，仅需在 curatedLists 常量追加。
- 不做榜单个性化：榜单对所有访客一致（这是「编辑严选」与「个性化推荐」的定位区分），不按用户匹配档案重排。
- 不改 buildRecommendations/recommendationScore 及匹配问卷任何逻辑。
- 不引入价格、购买链接聚合、库存/地区在售信息。
- 不新增图片资产，条目不放大图（复用现有档案页的 catalog-model-images）。
- 不持久化折叠状态，不做榜单区的历史栈滚动恢复增强。
- 不做榜单管理后台/CMS，标准变更走源码修改 + 测试。

---

## 7. 好友球拍对决（compare 视图 vs=1 对决模式）

> **用户故事**：作为已看中一把球拍的球友，我想把这把拍生成一条"对决"链接发给朋友，让他选拍应战后在同一张雷达图上逐维分出高下，以便用可分享、可反击的方式讨论选拍。

#### 功能需求

- FR-1 档案页发起对决：在球拍深档弹层 header 的 inspector-header-actions 区（app/page.tsx 约 7044 行，现有「分享」「+ 对比」旁）新增「发起对决」按钮；点击后将 `location.origin + #compare?r0=<该拍id>&vs=1` 写入剪贴板（沿用 copyCompareLink 的 navigator.clipboard 写法），并经既有 setLiveMessage 播报「已复制对决链接，发给朋友选拍应战」；剪贴板被拒时沿用既有降级文案「浏览器未允许复制，请直接复制地址栏链接」。修正说明：构想中的 `#/compare?a=拍id&vs=1` 不符合源码——本项目 hash 无 `#/` 前缀且槽位键由 compareRouteKeys 固定为 r0/r1/r2，故对决链接为 `#compare?r0=<拍id>&vs=1`，A 槽即 slot 0。
- FR-2 vs 参数进入解析/格式化闭环：扩展 app/compare-state.ts——ParsedCompareRouteState 新增 `duel: boolean` 字段；parseCompareRouteState 仅在 route.view === "compare" 且 vs 值恰为 "1" 时置 duel=true；formatCompareRouteState 新增可选第三参（如 options?: { duel?: boolean }），duel=true 且为 compare 视图时在 query 末尾追加 vs=1，否则不输出。canonicalHash 必须保留合法的 vs=1；脏值（vs=0、vs=abc、vs 重复、非 compare 视图携带 vs）canonical 化为移除，走既有 shouldReplace 替换通道。修正说明：此项不可省——page.tsx 的 formatCurrentRoute（1697-1710 行）在每次 canonical 重写（2457-2458 行）都会用 formatCompareRouteState 重建 hash，vs 若不进闭环会被立即剥掉，因此「仅新增 vs 参数」必须落在这两个纯函数上，page.tsx 用一个 duelModeRef 把当前对决态喂给 formatCurrentRoute。
- FR-3 应战态（A 槽标记 + 引导）：打开对决链接（duel=true 且 r0 经 deepRacketById resolver 解析有效）时，compare 视图 slot 0 卡片（compare-product-grid，data-compare-slot=0）显示可见文本徽标「对方战拍」，卡片 aria-label 同步包含该状态；首次进入经 setLiveMessage 播报「收到球拍对决：<品牌 型号>，选一把球拍应战」；slot 1 为空时，现有 compared.length === 1 的 compare-guidance 提示（6468-6476 行）在对决态下替换为应战文案，按钮仍复用 browseForCompare 进拍库。修正说明：「A 槽锁定」调整为语义标记而非禁止操作——用户移除 A 槽拍即退出对决模式（见 FR-8），保持用户永远可控，与现有 compareUndo 交互一致。
- FR-4 逐维赢家徽章：对决态且 slot 0、slot 1 均有拍时，对比表 comparisonRows 的六维评分行（radarKeys × scoreLabels：控制/力量/旋转/手感/容错/灵活）在得分更高一方的单元格渲染「领先」徽章（可见文本 + 图形，非纯颜色），两拍同分该行双方显示「战平」且无徽章；胜负判定由新增纯函数模块 app/compare-duel.ts 的 buildDuelVerdicts(scoresA, scoresB) 完成（逐维返回 "a"|"b"|"tie"）。徽章区必须紧邻既有数据诚实角标句式并追加对决措辞：「胜负徽章基于拍库相对评估（满分 100）；非实验室测量，不代表两拍实际优劣，不替代实际试打」（沿用 6513 行既有角标风格）。雷达叠加不需新开发：RadarChart 已支持多系列重叠与 seriesSlots 配色，本功能不改 RadarChart 本体。
- FR-5 对决比分摘要：对决态双方齐备时，在 compare-radar-card（6506-6520 行）内显示比分摘要，如「六维战报 4 : 2」或「3 : 3 战平」（各自领先维度计数，平分维度不计入任一方），附两拍型号名；该摘要为静态文本随内容渲染，屏幕阅读器按文档流朗读，不额外新增 live region。
- FR-6 反向宣战：对决态双方齐备时，在对比视图底部（compare-buy-grid 之前）渲染「反向宣战」按钮：点击复制以 B 槽（slot 1）球拍为 r0 的新对决链接 `#compare?r0=<B拍id>&vs=1` 到剪贴板，setLiveMessage 播报「已复制反向对决链接，把 <B 型号> 立为战拍发回去」；不改变本机对比篮与当前 URL。
- FR-7 失效与脏参数降级：vs=1 但 r0 缺失、为空或被 resolver 拒绝（型号已失效）时，对决降级为普通对比视图——沿用既有 compareImportMessage 失效提示通道（2163-2182 行文案），canonicalHash 移除 vs 并 replace 地址栏；vs 出现在非 compare 视图（如 #tour?vs=1）一律忽略并 canonical 移除。任何脏链接打开后地址栏最终等于「发起对决」按钮生成的同形 canonical 链接，保证深链可分享闭环。
- FR-8 对决生命周期：以下操作退出对决模式并从 hash canonical 移除 vs=1，同时 setLiveMessage 说明原因——(a) 加入第三把拍（对决仅限 1v1）；(b) 移除 A 槽（slot 0）球拍；(c) clearComparison 清空。既有 compareUndo 撤销仅恢复篮子内容，不自动恢复对决态（重开对决链接即可再次进入），此简化需在 toast 文案中不造成误导（如「已退出对决模式」）。打开对决链接对本机已有篮子的整篮覆盖行为沿用现状：hasExplicitSlots 导入 + import-link 撤销（2184-2212 行），不新造机制。

#### 边界与降级

- r0 型号 id 失效（下架/改名）：resolver 返回 null，走既有失效提示（「链接中的球拍均已失效…」等），vs 被 canonical 移除，降级为普通对比，不出现空 A 槽假锁定。
- vs 脏值：vs=0、vs=abc、vs=1&vs=1、#tour?vs=1 —— parse 层全部 duel=false 或忽略，canonicalHash 不含 vs，shouldReplace=true 触发既有 replace，地址栏自愈。
- vs=1 但无任何 r 参数（#compare?vs=1）：非对决，canonical 为 #compare，显示普通空对比态。
- 接收方本机已有 2-3 把对比篮：显式槽导入整篮替换为对决 A 槽（现有行为），toast + import-link 撤销可一键找回原篮子；撤销后对决态随 vs 移除而结束。
- Back/Forward：沿用 shouldImportCompareRoute 语义——app 自有历史条目 pop 不回滚篮子，此时 duel 态以 duelModeRef 当前值 canonical 重写，避免历史穿越出「幽灵对决」。
- 两拍六维全部同分：比分摘要显示「3 : 3 战平」类文案（实际为 0:0 全平时显示六维战平），每行「战平」，无任何赢家徽章，不得强行判胜。
- Web Storage 不可用（隐私模式）：对决态完全由 URL 驱动，不依赖 session-state 四域存储，功能不降级；篮子跨标签持久化失败沿用现有静默降级。
- 剪贴板权限被拒：发起对决/反向宣战均降级为既有「浏览器未允许复制，请直接复制地址栏链接」提示。
- prefers-reduced-motion：徽章「逐维亮出」的 stagger 动画整体禁用，直接呈现最终态。
- 隐私：对决链接仅含拍 id 与 vs=1，不携带任何打法问卷答案，符合「打法答案默认不出本机」原则。

#### 无障碍要求

- 赢家徽章不得只靠颜色区分：必须有可见文本「领先」/「战平」，且六维行单元格提供完整可读文本（如「力量 92，领先」），与现有雷达图 <desc> 文本化惯例对齐。
- 所有播报复用既有单一 polite live region（setLiveMessage → app-toast 内 role=status aria-live=polite），不新增 live region，避免双播报。
- 「发起对决」「反向宣战」按钮满足 44px 触控目标（复用 text-action / app-button 既有类），aria-label 含完整品牌型号（如「发起 Blade 98 v9 球拍对决，复制对决链接」）。
- A 槽「对方战拍」状态同时以可见徽标文本和卡片 aria-label 表达，不允许仅视觉描边/变色。
- 复制链接、换位等操作后焦点保持在触发按钮上，不发生焦点丢失；徽章与比分为纯展示内容，不进入 Tab 序列。
- 徽章亮出动画尊重 prefers-reduced-motion: reduce（globals.css 既有媒体查询惯例），明暗双主题下徽章对比度达标。

#### 路由与持久化

- 对决态唯一事实来源是 URL 的 vs=1 参数 + 运行期 duelModeRef，不写入 session-state 四域（paiku-compare-v1 仍只存槽位），刷新对决链接可完整还原应战态。
- canonical 化规则：vs 仅在 view=compare 且值为 "1" 时保留于 canonicalHash 且固定置于 r0/r1/r2 之后；其余情况移除并借既有 shouldReplace → replacePaikuHistory 通道自愈地址栏。
- 「发起对决」与「反向宣战」生成的链接必须与 canonical 形一致（打开后地址栏不发生二次 replace），保证深链分享闭环。
- 历史栈遵循既有 shouldImportCompareRoute 语义：冷启动/hash 导航导入对决链接槽位，app 自有 Back/Forward 条目不回滚篮子、duel 态按当前 ref canonical 重写；整篮覆盖沿用 import-link compareUndo 撤销。

#### 验收标准

- tests/compare-state.test.mjs 新增断言：parseCompareRouteState("#compare?r0=a&vs=1") 返回 duel:true、canonicalHash 保留 vs=1、shouldReplace:false；formatCompareRouteState({view:"compare"}, slots, {duel:true}) 与 parse 往返一致；vs=2 / vs 重复 / #tour?vs=1 / r0 全失效四种脏况的 canonicalHash 均不含 vs 且 shouldReplace:true；现有 13 个用例全部不回归（formatCompareRouteState 第三参必须可选）。
- 新增 tests/compare-duel.test.mjs：(a) buildDuelVerdicts 纯函数单测——A 全胜、互有胜负、单维同分、全平四组输入的逐维判定与比分计数；(b) 源码即规格正则断言（仿 armory-presentation.test.mjs 读取 app/page.tsx）——存在「发起对决」「反向宣战」「对方战拍」字样、徽章文案伴随「非实验室测量」措辞、对决按钮 aria-label 模式存在。
- npm test（build + node --import tsx --test tests/*.test.mjs）18+2 组测试全绿，rendered-html SSR 冒烟无回归。
- 手工验收：档案页复制对决链接 → 新无痕窗口打开 → A 槽显「对方战拍」且播报应战提示 → 从拍库加入第二把 → 雷达叠加 + 六维行逐维出现「领先/战平」+ 比分摘要 + 相对评估角标 → 点「反向宣战」得到 r0 换位的新链接 → 加第三把拍后 vs 从地址栏消失且 toast 说明。
- 脏链接自愈验收：手输 #compare?vs=abc&r0=<有效id> 打开后地址栏被 replace 为 #compare?r0=<有效id>（无 vs），无控制台报错。

#### 涉及文件

- `app/compare-state.ts` — 修改：ParsedCompareRouteState 新增 duel 字段；parseCompareRouteState 解析 vs 参数并纳入 canonicalHash/shouldReplace；formatCompareRouteState 新增可选 { duel } 选项（现有两参调用不受影响）
- `app/compare-duel.ts` — 新增：纯函数 buildDuelVerdicts（逐维 a/b/tie 判定与比分计数），零依赖便于 node --test 直测
- `app/page.tsx` — 修改：档案页 inspector-header-actions 新增「发起对决」按钮；新增 duelModeRef 并接入 formatCurrentRoute 与 hashchange 处理（parseCompareRouteState 调用点 2112 行、canonical 重写 2457 行）；compare 视图渲染「对方战拍」徽标、应战引导、comparisonRows 六维行赢家徽章、compare-radar-card 比分摘要、「反向宣战」按钮及退出对决逻辑（toggleCompare/clearComparison 路径）
- `app/globals.css` — 修改：新增对决徽章/对方战拍徽标/比分摘要样式，覆盖明暗双主题、760px 断点与 prefers-reduced-motion
- `tests/compare-state.test.mjs` — 修改：新增 vs 参数解析、canonical 化与 round-trip 断言
- `tests/compare-duel.test.mjs` — 新增：buildDuelVerdicts 单测 + page.tsx 对决措辞/aria 源码正则断言

#### 明确不做（Out of Scope）

- 不做任何后端、登录、房间码、实时联机或对决结果上报——保持无登录全功能可用与纯静态数据。
- 不做「综合胜者」加权总分或胜率百分比——六维逐维比对之外的合成结论有伪精确风险，违背数据诚实原则。
- 不支持 3 拍混战徽章：对决严格 1v1（第三把拍加入即退出对决），普通 3 槽对比维持现状。
- 不修改 RadarChart SVG 组件本体，不做逐维揭晓的复杂动画编排（仅简单 stagger，reduced-motion 下禁用）。
- 不把对决态持久化到 Web Storage、不进对比篮跨标签同步、不做对决历史记录。
- 不生成社交分享卡片/OG 图/截图导出。
- 不在 tour、armory、推荐列表等其它位置增加「发起对决」入口，仅深档弹层一处。
- 不为对决新增独立 hash 视图（如 #duel）——复用 compare 视图与其全部既有状态机。

---

## 8. 球星同频指数与深链（#tour/player/{id} + 匹配结果页球星同频区块 + 球星卡分享）

> **用户故事**：作为完成匹配问卷的球友，我想看到自己的打法画像与哪些顶尖球星最同频，并能一键跳到对应球星卡、把球星卡深链分享给球友，以便用球星参照理解推荐结果。

#### 功能需求

- FR-1 同频度纯函数（新增 app/tour-sync.ts）：导出 buildTourPlayerSync(players, targets, rackets, profile, score) 纯函数；对全部 16 位 tourPlayers 计算同频指数——tourCatalogTargets 为 racket 级时对该 DeepRacket 调用注入的评分函数 score(racket, stage, style, priority)，为 family 级时取该 familyId 下全部 DeepRacket 的最高分并记录依据型号；返回按分数降序（同分按 tour+rank 稳定排序）的 {player, syncScore(Math.round 取整), viaRacket, mapping} 列表。评分函数由 page.tsx 传入现有导出 recommendationScore（page.tsx:661），通过回调注入避免 page.tsx↔tour-sync 循环依赖（与 parseCompareRouteState 的 resolver 回调模式一致）。修正说明：项目无球员真实打法数据，同频度只能且只应基于官网零售映射球拍在拍库中的相对评分。
- FR-2 匹配结果页球星同频区块：仅在匹配结果屏（matchScreen.kind === "result"，即 #match/step/3 且有 committed profile）渲染；插入位置为 page.tsx 中 match-result-list（约 5658 行）与 match-results-actions（约 5710 行）之间。展示同频最高的前 4 位（ATP/WTA 混排），每项含：nameZh、巡回赛与排名（如 ATP #3）、同频指数（如「同频 89%」，取整规则与匹配指数一致）、四档可信度标注（直接渲染 player.mapping 原文：型号级映射/系列级映射/基础型号等效/当前拍系参考）、依据型号或拍系名（family 级标注「按系内最同频型号 {model} 估算」）。区块头部有可见数据诚实文案：「同频指数基于品牌官网零售映射球拍在拍库中的相对评估，非球员真实打法或比赛拍数据」。底部提供「查看全部 16 位球星」入口跳 #tour。
- FR-3 同频项点击跳转：每个同频项为按钮，激活后经现有 hash 导航与历史栈机制 push 到 #tour/player/{playerId}；浏览器返回键回到 #match/step/3 匹配结果页并按现有 paikuHistory 机制恢复滚动与焦点。
- FR-4 路由扩展（app/navigation-state.ts）：AppRoute 增加可选 playerId 字段；parseAppRoute 识别 #tour/player/{id}（仅 tour 视图接受该段，沿用 decodeSegment 容错）；formatAppRoute 输出 player 段并 encodeURIComponent；formatTourRouteState 在 route.playerId 存在时省略 ?tour= query（巡回赛由球星唯一决定）；parseTourRouteState 增加 resolvePlayer?: (id: string) => TourRouteFilter | null 回调参数（page.tsx 用 tourPlayers 实现），有效 id 时 ParsedTourRouteState.tour 强制为该球星所属巡回赛、canonicalHash 为 #tour/player/{id}（无 query），无效或不可解码 id 时 canonical 回落 #tour（沿用现有 tour query 规则）且 shouldReplace=true。修正说明：现状 parseAppRoute 会把未知段静默丢弃导致 #tour/player/x 被 canonical 化为 #tour，故必须先做本条扩展。
- FR-5 深链落地行为（app/page.tsx 路由 effect）：hash 含有效 playerId 时切到 tour 视图并应用该球星所属 ATP/WTA 筛选（复用 applyTourFilterToState），目标 TourPlayerCard 根元素新增 id="tour-player-{player.id}" 与 tabIndex={-1}，落地后 scrollIntoView（prefers-reduced-motion: reduce 时 behavior:"auto"，否则 "smooth"，对齐 page.tsx:3744 现有模式）并 focus({preventScroll:true})，同时 setLiveMessage 播报「已定位到 {nameZh} 的球星卡」；无效 id 时留在 tour 视图并 setLiveMessage（文案对齐 page.tsx:2221「该球拍链接已失效」模式，如「该球星链接已失效，已返回巡回赛拍房」）。
- FR-6 球星卡分享按钮：TourPlayerCard（含 leader 卡）新增「分享」按钮；将 shareCurrentView（page.tsx:4595）泛化为接受可选 url 参数（默认 window.location.href），按钮用 formatTourRouteState 构造当前 origin + #tour/player/{id} 的绝对 URL 调用之；保持现有降级链：navigator.share 可用则调用且 AbortError 静默返回，否则 clipboard 复制，两路径均 setLiveMessage，clipboard 拒绝时沿用「浏览器未允许分享，请直接复制地址栏链接」。修正说明：构想的「复用现有 share 逻辑」需先做该泛化，因现有实现只能分享当前地址。
- FR-7 playerId 生命周期清理：commitTourFilter 切换 ATP/WTA 后 hash 回到无 playerId 的 #tour(?tour=WTA) canonical 形态；copyTourLink 改为复制不含 playerId 的当前榜单 canonical 链接（保持「复制 {tour} 榜单」语义不被球星深链污染）；playerId 不写入 session-state 的 tour 域（该域继续只存 ATP/WTA 筛选）。
- FR-8 样式（app/globals.css）：新增同频区块、同频项、卡片分享按钮与深链落地强调样式；遵循现有 iOS 风格设计语言、明暗双主题 CSS 变量、760px 主断点，交互控件触控目标 ≥44px，落地强调动画在 prefers-reduced-motion: reduce 下禁用。
- FR-9 测试（源码即规格，零框架 node --test）：tests/navigation-state.test.mjs 新增 player 路由 round-trip、脏参数 canonical 化、无效 id 回落断言；新增 tests/tour-sync.test.mjs 覆盖同频纯函数（16 位全覆盖、确定性、分数区间、family 级取系内最高分、排序稳定）并按 armory-presentation.test.mjs 风格对 page.tsx 源码正则断言数据诚实措辞与四档映射标注存在。

#### 边界与降级

- 无效/已下榜 playerId（#tour/player/unknown）：canonicalHash 回落 #tour、history.replaceState 修正地址栏，留在 tour 视图并 toast「该球星链接已失效，已返回巡回赛拍房」，不崩溃不白屏。
- URL 编码脏值（decodeURIComponent 抛错的段）：decodeSegment 返回 undefined，按无 playerId 处理，canonical 回落 #tour。
- playerId 与 ?tour 冲突（#tour/player/iga-swiatek?tour=ATP）：以球星所属巡回赛为准（tour=WTA），canonical 剥离多余 query 为 #tour/player/iga-swiatek，shouldReplace=true。
- 未完成匹配（matchFlow.committed 为 null）：结果屏不可达（现有 matchRouteNotice 机制兜底 #match/step/3 直链），同频区块自然不渲染，任何其他视图均不显示同频数据。
- family 级映射球星的拍系在 deepRackets 中无型号（理论上被 tour-links.test.mjs 排除）：该球星从同频列表静默跳过，计算不抛错。
- Web Storage 不可用（memory-only 会话）：同频度为纯派生、playerId 为纯路由态，深链打开与分享全功能可用，符合无登录原则。
- navigator.share 不存在或 clipboard 权限被拒：沿用 shareCurrentView 现有降级链与既有 toast 文案，AbortError（用户取消系统分享）静默不报错。
- 球拍图片加载失败：沿用 TourRacketVisual 现有 onError 占位降级；同频区块不因图片失败而布局塌陷。
- 性能：同频计算包在 useMemo（依赖 profileStage/profileStyle/profilePriority），16 位球星各最多计算一个拍系内的型号，纯同步无感知开销。

#### 无障碍要求

- 同频区块为带 aria-labelledby 标题的 section，列表项激活控件提供完整 aria-label（含球星中文名、同频指数、四档映射档位、动作说明），对齐现有 tour-player-card 按钮的 aria-label 详尽度。
- 深链落地焦点管理：目标卡 tabIndex=-1 + focus({preventScroll:true})，scrollIntoView 尊重 prefers-reduced-motion（复用 page.tsx:3744 的媒体查询判断模式）。
- 所有状态播报复用现有 sr-only role=status aria-live=polite 区（setLiveMessage），不新建 live region、不重复播报。
- 分享按钮与同频跳转按钮触控目标 ≥44px，focus-visible 焦点环沿用全局样式，明暗双主题下文本对比度达标。
- 数据诚实免责声明与四档映射标注为可见正文文本（不藏在 title/tooltip），屏幕阅读器按 DOM 顺序可读。
- 球星卡新增分享按钮不破坏卡内现有 Tab 顺序（排在「查看深度档案/加入对比」动作组内），data-focus-key 命名沿用 tour-{action}-{playerId} 约定以兼容焦点恢复机制。

#### 路由与持久化

- 新增 hash 形态 #tour/player/{playerId}，为可分享 canonical 深链；playerId 仅存在于路由态，不写入 session-state 四域（tour 域继续只存 ATP/WTA 筛选字符串）。
- canonical 化规则：#tour/player/{id}?tour=X → #tour/player/{id}（tour 由球星唯一决定，多余 query 经 history.replaceState 剥离）；无效/不可解码 id → 回落 #tour（沿用现有 tour!==ATP 时追加 ?tour= 的规则），shouldReplace=true；分享按钮生成的 URL 必须与 canonical 完全一致，二次打开不触发 replace。
- 历史栈：匹配结果页→球星卡为 push（返回可回 #match/step/3 并恢复滚动/焦点，沿用现有 paikuHistory 快照机制）；commitTourFilter 切换巡回赛时从 hash 移除 playerId 并保持现有 push 语义。
- 无新增 Web Storage 键；memory-only 降级下深链、同频计算、分享全部可用。

#### 验收标准

- npm test（含 vinext build + 18+ 个零框架测试）与 npm run lint 全部通过，rendered-html.test.mjs SSR 冒烟不回归。
- tests/navigation-state.test.mjs 新增断言通过：(a) {view:"tour",playerId:"carlos-alcaraz"} 经 formatAppRoute→parseAppRoute round-trip 相等；(b) parseTourRouteState("#tour/player/iga-swiatek?tour=ATP", resolver) 得 tour==="WTA"、canonicalHash==="#tour/player/iga-swiatek"、shouldReplace===true；(c) 无效 id 时 canonicalHash==="#tour"、shouldReplace===true 且 route.playerId 未泄漏。
- 新增 tests/tour-sync.test.mjs 通过：16 位球星全部产出 0–99 整数同频分；同一 profile 两次调用结果 deepEqual（确定性）；family 级球星分数等于其拍系内型号的最高 recommendationScore 且 viaRacket 指向该型号；列表严格降序、同分排序稳定；page.tsx 源码正则断言含「拍库相对评估/非球员真实」类数据诚实措辞。
- 手动验收 1：完成一次三步匹配后，结果页出现「球星同频」区块——前 4 位球星、百分比数值、四档映射标注原文、可见免责声明、「查看全部 16 位球星」入口。
- 手动验收 2：点击同频项后地址栏为 #tour/player/{id}，tour 视图已切到该球星所属 ATP/WTA，目标卡滚入视口并获得焦点；按浏览器返回回到 #match/step/3 且滚动/焦点恢复。
- 手动验收 3：球星卡「分享」按钮在支持 navigator.share 环境唤起系统分享面板，否则复制 #tour/player/{id} 绝对 URL；两路径均有 toast 播报；隐身窗口（无任何本地存储、无登录）直接打开该链接可精确落到球星卡。
- 手动验收 4：在球星深链上切换 ATP/WTA 后 hash 不再含 playerId；「复制 ATP/WTA 榜单」复制的链接不含 playerId。

#### 涉及文件

- `app/navigation-state.ts` — 修改：AppRoute 增加可选 playerId；parseAppRoute/formatAppRoute 支持 tour/player/{id} 段（复用 decodeSegment/encodeURIComponent）；formatTourRouteState 对 playerId 路由省略 tour query；parseTourRouteState 新增 resolvePlayer 回调参数并在 ParsedTourRouteState 中输出校验后的 playerId 与 canonical 化结果。
- `app/tour-sync.ts` — 新增：纯函数 buildTourPlayerSync（评分函数经参数注入以复用 page.tsx 导出的 recommendationScore，避免循环依赖），零 DOM 依赖、可被 node --test 直接单测。
- `app/page.tsx` — 修改：匹配结果区（match-result-list 约 5658 行之后、match-results-actions 之前）插入球星同频 section（useMemo 计算）；TourPlayerCard 增加分享按钮、根元素 id=tour-player-{id} 与 tabIndex=-1；路由 effect（约 2111 行与 3216 行的 parseTourRouteState 调用点）及 buildAppHash（约 1704 行 formatTourRouteState 调用）接入 playerId 与落地滚动/焦点；commitTourFilter（约 4644 行）与 copyTourLink（约 4572 行）清理 playerId；shareCurrentView（约 4595 行）泛化可选 url 参数。
- `app/globals.css` — 修改：新增球星同频区块、同频项、卡片分享按钮、深链落地强调样式（明暗双主题变量、760px 断点、≥44px 触控、reduced-motion 降级）。
- `tests/navigation-state.test.mjs` — 修改：新增 player 路由 round-trip、脏 query canonical 化、无效 id 回落三组断言。
- `tests/tour-sync.test.mjs` — 新增：同频纯函数单测（16 位覆盖/确定性/区间/family 取最优/排序稳定）+ page.tsx 数据诚实措辞与四档映射标注的源码正则断言。

#### 明确不做（Out of Scope）

- 不引入任何球员真实打法数据（挥速、上旋率、击球统计）或外部 API/运行时抓取——同频度只基于既有静态映射球拍评分。
- 不在结果页内联展开全部 16 位（只展示前 4 + 「查看全部」入口），不做同频列表的筛选/搜索/分页。
- 不新增顶级路由 view（不加 #player），复用 tour 视图内定位；appViewIds 保持五元组不变。
- 不修改 recommendationScore/buildRecommendations 算法与其所在位置，不做评分模块抽取重构。
- 不做用户六维画像与球星球拍的雷达叠加对比图、不做「与球星装备差距」等衍生分析。
- 不持久化「最近查看的球星」「历史同频记录」。
- 不新增球星头像/肖像等图片资产（沿用现有球拍映射图与占位降级），不做按球星的 SSR/OG meta 定制。
- 不改动 compare-state、armory 路由 query 语义与其余 16 个测试文件的既有断言。

---

## 9. 最近浏览货架（发现页「最近看过」横滑货架 + paiku-catalog-v1 域扩展持久化）

> **用户故事**：作为反复对比犹豫的选拍球友，我想在发现页看到自己最近打开过的球拍深度档案并一键跳回，以便不用重新搜索或翻拍库就能继续比较候选拍。

#### 功能需求

- FR-1 自动记录：任一路径使深度档案实际打开（点击调用 openRacket、#<view>/racket/<id> 深链冷启动、history 前进/后退恢复，三者最终都经 setSelectedId 生效，见 app/page.tsx:4004/3150/2610）时，将该拍 canonical id 记入「最近看过」：已存在则去重置顶，最多保留 12 条，超出丢弃最旧。记录逻辑放入新增纯函数模块 app/recent-rackets.ts（如 recordRecentRacket(input, id)），page.tsx 内用一个依赖 selectedId 的 effect 作为唯一记录入口。
- FR-2 持久化（向后兼容）：最近列表作为 recents: string[] 字段并入现有 paiku-catalog-v1 域载荷——即扩展 app/page.tsx:3386 处 writeSessionDomain(SESSION_DOMAIN_STORAGE_KEYS.catalog, {...}) 的对象并补充 effect 依赖；session-state.ts 信封结构与 version:1 均不改。旧格式载荷（无 recents）恢复时筛选字段行为与现状完全一致、货架为空；新格式被旧构建读取时因恢复端逐字段类型守卫（app/page.tsx:3232-3267）而被安全忽略。
- FR-3 宽容恢复：初始化恢复（app/page.tsx:3219 起 savedCatalog 分支）读取 recents 时调用新增 normalizeRecentRackets：非字符串/空串项丢弃；legacy id 用 deepRacketById.get(id)?.id 做 canonical 化后再以 deepRacketById.has 过滤失效 id（同 compare 恢复既有模式 app/page.tsx:3154-3160）；去重、截断 12；任何解析失败等同空列表，绝不影响 scope/brand 等其余 catalog 字段恢复。
- FR-4 货架展示：仅在发现页（activeView === "discover" 的 section，app/page.tsx:5266-5485）渲染「最近看过」横滑货架，位置在 discover-shortcuts 区块之后；列表为空时整个区块不渲染（无空态占位）。条目按最近优先排序，展示 RacketPhoto（variant="thumb"，组件见 app/page.tsx:248）+ 品牌 + 型号文字；货架副标题以诚实措辞注明「仅保存在本机」。
- FR-5 深链回跳：点击条目主体直接调用现有 openRacket(id)（app/page.tsx:3972），复用其 snapshotCurrentHistoryEntry、rememberReturnFocus、pushPaikuHistory 与 formatCurrentRoute（discover 视图下即 navigation-state.ts 的 formatAppRoute，生成 #discover/racket/<encodeURIComponent(id)>）；该 hash 可分享，档案关闭/回退后按既有 overlay 历史栈回到发现页并恢复焦点。不新增任何 hash 参数或路由格式。
- FR-6 单条移除：每个条目提供独立的移除按钮（点击不触发打开档案），移除后立即更新状态与存储，并经现有 setLiveMessage 通道播报「已从最近看过移除 <品牌 型号>」；焦点移至后一条目的移除按钮（无后一条则前一条）；移除最后一条后区块整体消失，焦点落到「统一球拍库」快捷入口按钮（browseFullCatalog 按钮，app/page.tsx:5469）。
- FR-7 一键清空：货架标题行提供「清空」按钮（对齐对比页既有清空文案模式 app/page.tsx:6408-6410），点击一次性清空列表并播报「已清空最近看过」，区块消失、焦点安置同 FR-6 末条规则；不做确认弹窗。
- FR-8 存储降级诚实提示：当 sessionPersistence === "memory-only"（现有状态，参考 match-draft-banner 措辞 app/page.tsx:5308-5314）时，货架副标题改为「仅保留在本页，刷新或关闭页面后会丢失」；货架在纯内存模式下仍在本页正常工作。列表数据永不离开本机，无登录即全功能可用。

#### 边界与降级

- 双存储均不可用：writeSessionDomain 返回 false 走现有 setSessionPersistence("memory-only") 通道，货架仍以 React 状态在本页工作，刷新即空，配 FR-8 措辞。
- 载荷损坏 / recents 非数组 / 混入对象或数字：normalizeRecentRackets 输出合法子集或空数组，绝不抛错，且不影响同载荷中筛选字段的恢复。
- 失效或改名 id：legacyCatalogRacketId 形态先 canonical 化，未知 id 静默过滤（与 compare 恢复一致）；不为货架新增失效提示——直开失效深链已有「该球拍链接已失效」既有提示路径（app/page.tsx:2881）。
- 跨窗口：catalog 域为 session 优先（selectSessionDomainCopy），且 storage 事件监听仅同步 compare 域（app/page.tsx:3465）——两个已打开窗口的最近列表不实时互通、后写者覆盖 localStorage，新标签页从 localStorage 继承；此为既有域语义，本功能不改。
- 同一拍反复打开或经 history 回退重新展示档案：仅去重置顶，不产生重复条目；置顶视为再次浏览，接受。
- SSR/hydration：page.tsx 为 "use client"，recents 初始为空、sessionReady 后才注水（与筛选恢复同模式），SSR 输出不含货架，不得引发 hydration 告警。
- 体积：12 个 id 远低于 session-state.ts 的 MAX_SESSION_DOMAIN_LENGTH(1MB)，无需额外限流。
- 正在浏览的拍本身也会入列并置顶，返回发现页时它位于货架首位——预期行为，不做排除。

#### 无障碍要求

- 货架为带 aria-labelledby 标题的 section，条目主体与移除按钮均为原生 button、Tab 序可达；横滑容器键盘可横向滚动。
- 移除按钮 aria-label 含完整品牌型号（如「从最近看过移除 Wilson Blade 98 v9」），清空按钮 aria-label 含当前条数；触控目标遵守 globals.css 既有 min-height/min-width 44px 惯例。
- 移除/清空结果经既有 sr-only role="status" aria-live="polite" 通道（setLiveMessage → app/page.tsx:1071/5221）播报。
- 焦点管理：移除后焦点落相邻条目移除按钮、末条移除/清空后落「统一球拍库」入口（FR-6/7）；打开档案与返回复用现有 rememberReturnFocus（app/page.tsx:1848）与 data-focus-key 焦点恢复机制。
- 横滑采用 globals.css 既有先例：overflow-x:auto + scroll-snap-type: inline proximity（参考 6005-6020 行模式），动画遵守既有 @media (prefers-reduced-motion: reduce) 块（6268 行）。
- 明暗双主题下条目与按钮对比度对齐现有 discover-shortcuts / recommendation-list 卡片样式。

#### 路由与持久化

- 复用 paiku-catalog-v1 域（SESSION_DOMAIN_STORAGE_KEYS.catalog）：value 由 {scope,brand,type,generation,releaseYear,search,sort} 扩展为附加 recents: string[]；serializeSessionDomain 信封 version 保持 1，session-state.ts 零改动。
- 写入沿用 page.tsx 现有 catalog useEffect → writeSessionDomain 双写 localStorage + sessionStorage；恢复沿用初始化 effect 的 selectSessionDomainCopy（catalog 域 session 优先）语义。
- 深链与历史栈：条目点击复用 openRacket 的 pushPaikuHistory(…, formatCurrentRoute(route))，discover 下 canonical hash 为 #discover/racket/<encodeURIComponent(id)>（parseAppRoute 已支持任意 view 的 racket 段）；不新增 hash query 参数，脏/失效 id 深链沿用既有 canonical 化与失效提示路径。
- 不新增任何 storage key；不向只读的 legacy paiku-session-v1 快照写入新字段。

#### 验收标准

- 新增 tests/recent-rackets.test.mjs（零框架 node:test 风格）：纯函数单测覆盖 recordRecentRacket 去重置顶与 12 条截断、normalizeRecentRackets 丢弃非法项/canonical 化 legacy id/过滤未知 id、removeRecentRacket 与清空语义；另含源码正则断言（对齐 tests/armory-presentation.test.mjs 风格）：page.tsx 的 catalog 写入 payload 含 recents 字段、discover 区块含「最近看过」与「清空」markup、移除按钮 aria-label 模式、条目点击调用 openRacket。
- tests/session-state.test.mjs 无需修改（session-state.ts 不改、域 key 仍为 4 个）；若实现意外触碰 session-state.ts 则必须同步补断言。
- npm test（build + node --import tsx --test tests/*.test.mjs）18 个既有测试 + 新增测试全绿；tests/rendered-html.test.mjs SSR 冒烟不回归（SSR 输出无货架、无 hydration 报错）。
- 手工验收：打开任一深档→回发现页见货架首位为该拍；刷新后仍在；打开第 13 支拍后最旧条目消失；点条目地址栏变为 #discover/racket/<id> 且可新标签直开、返回落发现页；移除/清空生效且读屏播报；localStorage 中 paiku-catalog-v1 的 value 同时含原 7 个筛选字段与 recents；手工写入旧格式（无 recents）载荷后刷新，筛选恢复正常、货架为空。

#### 涉及文件

- `app/recent-rackets.ts` — 新增：纯逻辑模块，导出 MAX_RECENT_RACKETS(=12)、recordRecentRacket(input, id)、normalizeRecentRackets(input, resolveId?)、removeRecentRacket(input, id)，风格对齐 compare-state.ts 的 normalizeCompareSlots 宽容解析模式
- `app/page.tsx` — 修改：① 新增 recentRacketIds 状态与依赖 selectedId 的记录 effect；② 扩展 3386 行 writeSessionDomain(SESSION_DOMAIN_STORAGE_KEYS.catalog, {...}) 载荷加 recents 并补 effect 依赖；③ 在 3219 行起 savedCatalog 恢复分支解析 recents（用 deepRacketById canonical 化）；④ 在 discover 视图（5266-5485 行）discover-shortcuts 之后渲染货架，条目 onClick 走既有 openRacket(3972 行)，移除/清空经 setLiveMessage 播报
- `app/globals.css` — 修改：新增货架横滑样式（overflow-x + scroll-snap + 44px 触控目标 + 明暗主题变量），并纳入既有 prefers-reduced-motion 块
- `tests/recent-rackets.test.mjs` — 新增：纯函数单测 + page.tsx 源码正则断言（源码即规格）

#### 明确不做（Out of Scope）

- 不做跨窗口实时同步（storage 事件监听仍仅覆盖 compare 域，不为 catalog 域新增监听）。
- 不做移除/清空的撤销（不复制 compareUndo 机制）与二次确认弹窗。
- 不记录拍系（family）浏览与 Tour 球员浏览，仅记录球拍深度档案（racketId）。
- 不存时间戳、不展示「x 分钟前」等相对时间。
- 不在 armory/compare/tour/match 视图重复渲染货架，仅发现页。
- 不将最近浏览喂入 buildRecommendations 推荐算法（算法零改动）。
- 不做云端同步、账号体系或任何数据上传（无登录硬原则）。
- 不提升 session-state.ts 信封版本、不新增存储 key、不做 legacy 快照迁移扩展。
- 不为货架条目增加「加入对比」等次级操作（openRacket 打开后档案内已有既有入口）。

---

## 跨功能一致性核查

### 共享 UI 面冲突（必须在设计期裁定）

- 【匹配结果屏·插入槽位直接冲突】priority-preview FR-1 与 star-affinity FR-2 都声明插入在 match-result-list(5658) 与 match-results-actions(5710) 之间——两份规格互不知情，必须裁定纵向顺序。建议归并为固定布局：胶囊组+预览状态行（紧贴其控制的榜单，置于 match-result-list 之前或紧后）→ 结果卡列表（含拆解折叠区+名次徽标）→ 球星同频区块 → match-results-actions
- 【匹配结果卡·数据源分裂风险】score-breakdown 的 recommendationBreakdown 按规格接收 priority 参数，但未说明预览态下取哪个值；priority-preview FR-2 要求全屏读『显示榜单』。若拆解仍用 committed priority，展开的分项之和将不等于卡面显示的预览指数，直接违反两份规格各自的『合计≈卡面』与『单一显示数据源』要求。归并：拆解必须传 previewPriority ?? profilePriority，skippedSiblings 也必须取自预览版 buildRecommendations 输出；折叠区按 racket.id 而非卡片序号做 key/id，避免秒切重排后展开态错位到另一把拍
- 【匹配结果屏·同频区块口径冲突】star-affinity 的同频 useMemo 依赖 committed 的 profilePriority，预览态下屏幕上榜单是预览优先项、同频却基于档案优先项，同屏两套口径。归并二选一：同频跟随显示优先项重算，或区块显式标注『按你保存的档案（Y 优先）计算』——需在设计期裁定，不能各自实现
- 【匹配结果屏·信息密度】三功能叠加后单屏新增：7 胶囊+状态行、每卡折叠触发+徽标、4 球星同频项+免责声明+入口——760px 下结果屏长度约翻倍。建议同频区块默认收敛（如仅显示前 2 位+展开），或胶囊组砍状态行合并进摘要播报
- 【对比页·同一张表双重改造】compare-narrative FR-5 给 comparisonRows 六个规格行加 key 字段+『差异最大』高亮；racket-duel FR-4 给六个评分行加『领先/战平』徽章。同一数据结构两次扩展，必须一次性设计 comparisonRows 的 key/rowKind 字段（spec 行 vs score 行），先做者定义结构、后做者复用，否则第二个功能会重构第一个的实现
- 【对比页·免责声明堆叠】既有 6513 行角标 + narrative 的『基于规格推断/非实验室测量』+ duel 的『胜负徽章基于拍库相对评估…不替代实际试打』——雷达卡附近将出现三段近似免责文案。建议合并为对比页单一免责区块，各功能测试正则指向同一段文案
- 【对比页·哲学张力需布局区隔】duel 基于派生六维评分判胜负，narrative 刻意只用官网硬规格；两区块相邻呈现时用户易混淆口径。归并建议：差异翻译区块副标已注明『按官网公开规格』，对决徽章仅出现在评分行、永不触碰规格行，narrative 永不触碰评分行——此互斥约束应写进两个功能的源码正则测试
- 【发现页·首屏下移与 SSR/CSR 时序】curated-lists（insight-card 后、SSR 直出、2 榜单×4 条目）+ recent-shelf（shortcuts 后、客户端注水后才出现、最多 12 条）。无插入点冲突，但：a) curated 区块把 discover-shortcuts 推至首屏外，需确认 model-matrix-first-screen.test.mjs 不受影响；b) shelf 注水后出现造成布局位移，置于 shortcuts 之后（页面下部）是正确缓解，两功能实施顺序应 curated 先行定版上半区
- 【racket-inspector·header 动作区拥挤】racket-duel 在 inspector-header-actions(7044) 加第 3 个按钮（分享/+对比/发起对决），44px 触控目标在 ≤760px 宽度下可能换行/挤压——需一次性设计三按钮布局；similar-rackets 区块(7168 后)自带脚注 + 既有 inspector-note(7177) + link-health 页脚降级提示(7202)，档案页尾部三段小字堆叠，建议合并脚注区
- 【跨功能·requestCompare 满槽跳转副作用】similar-rackets、curated-lists、（间接）recent-shelf 打开的档案内都新增/复用『+对比』入口，篮满时 requestCompare 会关闭 overlay 并跳转 compare 视图——多个功能的验收都依赖此行为，属一致复用而非冲突，但 data-focus-key 命名空间（similar-compare-_/curated-open-_/tour-*）需登记避免撞名

### 状态与路由冲突

- 【hash 参数无命名冲突但同管道双改造】全部 9 个功能中仅两个动路由：racket-duel 在 compare query 加 vs=1（compare-state.ts formatCompareRouteState 加第三参、parseCompareRouteState 加 duel 字段），star-affinity 在 tour 加路径段 /player/{id}（navigation-state.ts parse/format/tourRouteState 三处）。参数名与路径段互不冲突，但两者都要穿透 page.tsx 的 formatCurrentRoute(1697) 与 canonical 重写点(2457)、hashchange/popstate effect(2100-2460 区域)——这是全文件最危险的状态机区域，两功能若并行开发必然合并冲突，必须串行且共同评审该 effect 的改动
- 【#tour/player 与 racket 段的组合未定义】parseAppRoute 现支持任意视图的 /racket/<id> 段；star-affinity 新增 /player/<id> 后，规格未定义『在球星深链上打开球拍档案』的 hash 形态（#tour/player/x/racket/y？还是 playerId 被丢弃？）。openRacket 用 formatCurrentRoute(当前 route) 生成 hash，若 route 含 playerId 会产出未定义组合。需在 FR-4 明确：racket 段出现时 playerId 剥离（建议），并补 round-trip 测试
- 【session-state 域扩展无踩踏】唯一动存储的是 recent-shelf（catalog 域载荷加 recents 字段，信封 version 不变）；priority-preview/racket-duel/star-affinity/score-breakdown 均显式零持久化，link-health/similar/narrative/curated 不触存储。四域接口安全。仅提醒：recent-shelf 扩展 3386 行 writeSessionDomain 载荷时，写入 effect 依赖数组必须补 recentRacketIds，否则筛选变更会用旧 recents 覆盖新值（规格已提及『补 effect 依赖』，实施时是回归高发点）
- 【history.state 无新键冲突】racket-duel 显式用 duelModeRef 不入 PaikuHistoryState；priority-preview 显式不入 paikuMatchScreen 快照；star-affinity 复用现有 push 语义。核实 PaikuHistoryState(750-768) 现有键 paikuMatchScreen/paikuRacketScrollTop 等均无人新增。但 racket-duel 的『Back/Forward 时以 duelModeRef 当前值 canonical 重写』与 priority-preview 的『popstate 后预览自然清除』改的是同一个 popstate 处理路径，实施顺序上后做者需回归测前者
- 【单一 live region 的播报竞争】priority-preview（名次摘要）、racket-duel（对决进入/退出/复制）、star-affinity（落地定位/失效）、recent-shelf（移除/清空）、similar/curated（经 requestCompare）全部复用 setLiveMessage 单通道——设计正确（不新增 region），但快速连续操作（如预览切换后立即加对比）会互相覆盖播报，属可接受的既有语义，测试不应断言播报时序
- 【compareTopMatches 的读源变更连锁】priority-preview 要求 compareTopMatches(5127) 改读『显示榜单』；racket-duel 与 compare-narrative 不触该函数但消费其写入的 compare 槽位。无冲突，但 preview 实施后 match-engine/相关源码正则测试若断言 compareTopMatches 读 recommendations 变量名需同步更新
- 【score-breakdown 改 buildRecommendations 输出形状的下游影响】若保留 skippedSiblings 字段，priority-preview 的 diff 纯函数与 star-affinity 均以 buildRecommendations 输出为输入——字段为附加性扩展不破坏类型，但三个功能的测试都遍历该输出，字段语义需一次定稿（建议按 scopeTrims 砍掉以消除此耦合）

### 需求真实性抽查结论

- ✅ score-breakdown/priority-preview 算法锚点属实：page.tsx:661 export recommendationScore、689 export buildRecommendations，实现逐字吻合规格（基础10 + 阶段22 + 打法28；均衡=均值×0.18+最低维×0.06，单项=对应维×0.2+均值×0.04；Math.min(99)；去重键 item.racket.familyId ?? item.racket.series；集满即 break）。⚠️ 一处小误：priority-preview 称 recommendationReason(716) '已导出'，实际为模块私有 function（未 export），在 page.tsx 内使用无碍，但若测试想直接 import 会失败
- ✅ racket-duel 对 compare-state.ts 的修正说明属实：compareRouteKeys = ['r0','r1','r2'](60行)，formatCompareRouteState(route, input) 现为两参(91行)，parseCompareRouteState 带 resolver(105行)——构想中 '#/compare?a=拍id' 确实不符源码，规格的 r0+vs=1 修正正确
- ✅ similar-rackets/compare-narrative 的 racket-profiles.ts 锚点属实：beamAverage@164、normalizedPattern@172、patternRanks@209 均为模块私有需加 export；buyUrl/buyLabel@52-53、buildDeepRacket@730、buyUrl: model.url@786、catalogModelImages[id] 读取模式@736 全部吻合
- ✅ link-health 的关键事实经实测核实：实际运行 node 统计 259 个型号 URL 中唯一值恰为 255（4 组共享商品页属实）；scripts/sync-catalog-images.mjs:23-32 的 flatMap/id/sourceUrl 结构同构；grep 确认源脚本确无重试逻辑（修正说明属实）；package.json 仅有 images:sync；tests/deep-rackets.test.mjs:39-40 buyUrl===model.url 与 catalog-model-images.test.mjs:60 sourceUrl 溯源断言均存在——注意后者意味着改 url 后必须重跑 images:sync，规格已提醒
- ✅ star-affinity 前提属实：navigation-state.ts:103-105 仅识别 racket 段、未知段静默丢弃（#tour/player/x 今日确会被 canonical 回 #tour，FR-4 修正说明正确）；tour-data.ts 恰 16 位球员（rank 1-8 × 2 巡回赛），mapping 四档字面量类型@tour-data.ts:14 与规格逐字一致；formatTourRouteState@249/parseTourRouteState@260 存在
- ✅ page.tsx UI 锚点抽查基本准确（个位数行号漂移）：openRacket@3972、requestCompare@4278、copyTourLink@4572、shareCurrentView@4595、commitTourFilter@4644、compareTopMatches@5127、comparisonRows@5141、match-results-app@5646、match-result-list@5658、match-results-actions@5710、compare-radar-card@6506、inspector-header-actions@7044、inspector-radar@7168、catalog 域 writeSessionDomain@3386（载荷恰为 7 个筛选字段）、savedCatalog 逐字段守卫@3219 起、失效文案@2221、canonical replace@2457。微差：compare-buy-grid 实为 6631（规格写 ~6638）、storage 监听实为 3470（规格写 3465），均不影响实施

### 建议实施顺序

1. link-health —— 零共享面（脚本+manifest+独立测试），与其余 8 个功能无任何文件级耦合，可最先做或全程并行
2. similar-rackets —— 首个需要 racket-profiles.ts 导出 beamAverage/normalizedPattern/patternRanks 的功能，由它一次性完成 export 改造，供 compare-narrative 复用
3. compare-narrative —— 复用上一步的 racket-profiles 导出；并率先给 comparisonRows 六个规格行补稳定 key 字段，为对决徽章定义表结构基础
4. racket-duel —— 必须在 compare-narrative 之后：赢家徽章渲染在同一张 comparisonRows 表（评分行）上，且两者共同决定对比页免责声明的排布；compare-state.ts vs 参数扩展独立于 narrative 但 UI 面重叠
5. score-breakdown —— 匹配面第一块：先在算法层落地 recommendationBreakdown 与 skippedSiblings（若保留），为结果卡建立拆解数据结构；与 priority-preview 必须一起设计（拆解必须读『显示优先项』而非 committed）
6. priority-preview —— 在 breakdown 之后实施：它引入『显示榜单』单一数据源（previewPriority ?? profilePriority），breakdown、recommendationReason、compareTopMatches 全部改读该榜单，是结果屏状态流的重构点
7. star-affinity —— 匹配面最后一块：同频区块与 preview 胶囊竞争同一插入槽位（match-result-list 与 match-results-actions 之间），必须等前两者定稿结果屏布局；且它改动 page.tsx 2100-2460 路由 effect 与 navigation-state.ts，是风险最高的路由改造，放最后减少 rebase 冲突
8. curated-lists —— 发现页轨道可与匹配/对比轨道完全并行；先于 recent-shelf 是因为它插在 discover-shortcuts 之前、参与 SSR 直出，影响 rendered-html 与 model-matrix-first-screen 首屏测试，先落定发现页上半区布局
9. recent-shelf —— 发现页最后一块：插在 discover-shortcuts 之后（与 curated-lists 无插入点冲突），且是唯一扩展 session-state catalog 域载荷的功能，独立收尾；三条并行轨道为 {link-health} / {similar→narrative→duel} / {breakdown→preview→affinity} / {curated→shelf}

### 范围裁剪建议（保住「S = 一天」）

- star-affinity 明显超 S 级（实为 M~L）：同时改 navigation-state 解析/格式化/resolver 回调、page.tsx 最危险的 2100-2460 路由 effect、shareCurrentView 泛化、TourPlayerCard、新纯函数模块、两个测试文件。建议拆成两个 S：S1=『#tour/player 深链 + 落地定位』（FR-4/5/7/9 路由部分），S2=『结果页同频区块』（FR-1/2/3）；本期先砍 FR-6 分享按钮泛化（球星卡暂只用既有 copyTourLink 思路或延后）与落地强调动画
- racket-duel 超 S 级（约 M）：vs 参数闭环 + duelModeRef 穿透 formatCurrentRoute/hashchange + 生命周期退出 + 徽章 + 比分 + 反向宣战。建议砍 FR-6 反向宣战（对方重开链接即可实现同语义）与徽章 stagger 动画（outOfScope 已半承认），FR-5 比分摘要并入徽章区一行文本；保留 vs 参数、对方战拍标记、逐维徽章即可回到 S
- link-health 网络不确定性使其超 S：三态判定启发式（重定向 slug 对比、soft-404 路径识别）需反复调参，且首次全量 259 URL 跑通才能提交。建议本期砍 FR-6 三处 UI 降级（changed 态先只存在于 manifest，UI 降级另立 S 任务），并把 changed 判定简化为『跨域重定向或落到根路径』两条规则；FR-5 的 buyLinkChanged 注入随 UI 一起延后
- score-breakdown 建议砍 FR-2/FR-6 skippedSiblings（让位型号）：这是唯一改动 buildRecommendations 输出结构的部分，会波及 priority-preview 的 diff 输入与既有消费方，且『让位归属』语义（break 后未遍历型号不纳入）解释成本高；砍掉后纯函数拆解+折叠区+测试可稳收一天，让位信息另立 S
- priority-preview 建议砍 FR-3 的位移过渡动画（只保留 ↑/↓/新上榜 静态徽标，reduced-motion 反正要求无动画，砍掉后明暗双主题动画调试时间归零）；并把 live 播报简化为固定句式『预览 X 优先，N 把球拍名次变化』，不点名第一名
- recent-shelf 建议砍 FR-6 的精细焦点编排（移除后焦点落相邻条目移除按钮、末条落 browseFullCatalog）——简化为焦点回货架标题/区块；FR-7 清空按钮可保留但不做条数 aria-label。核心（记录/持久化/宽容恢复/横滑/移除）已够一天
- similar-rackets、compare-narrative、curated-lists 三个基本符合 S 级，无需砍：唯一提醒是 compare-narrative 的 259×259 两两组合测试（约 3.3 万次调用）需确认耗时可接受，必要时抽样；curated-lists 严守首发 2 个榜单即可
- 横向建议（省全局工时）：9 个功能引入至少 6 处新的『拍库相对评估/非实验室测量』类免责文案与对应源码正则测试——应抽一个共享文案常量（如 page.tsx 顶部 HONESTY_NOTE 常量组），各测试断言常量引用而非各自散落字符串，避免后续措辞微调引发 6 个测试文件连锁改动
