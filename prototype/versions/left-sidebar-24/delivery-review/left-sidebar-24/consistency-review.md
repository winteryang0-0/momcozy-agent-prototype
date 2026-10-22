# R24 设计一致性独立评审

- **角色与结论**：`consistency`；R24 候选范围的页面职责、导航与关键交互通过独立复测。**正式冻结/交付结论未给出**，因为项目尚无可追溯的合法 `B-ID`，当前 `design.json.project.stage=draft`。
- **评审对象**：`prototype/current` 的 `left-sidebar-24`，对照 `prototype/versions/conversation-shortcuts-23`；不把实现作者的“沿用原架构”声明当作证据。
- **baseline_id**：无。来源为本轮用户对左上入口、我的/宝宝顺序和首次录入推荐服务的明确修改请求；候选需求见 `sources/left-sidebar-24-requirements.json`，SHA-256 `5a8526c78722f742835756ef63ec023e82604eec55fd0be301b67432bb51bd39`。
- **当前材料 SHA-256**：`design.json` `f18d2ce53911375144ea2fd1afb5c2edb9c17d023e5f1bb71a1ebd70e000d046`；`Momcozy-final.html` `aa766c13f738ec34a24b38df0c0c94a3aee18dd28b0e673bf1f6403aaff9d462`；`index.html` `a307d62aab4fc7186490b294de6aa02e7ca6859401fbf14a6af604dc609bce85`。修改这些材料后本评审须重查。

## 逐项核对

| 范围 | 需求、账本与实现 | 独立判断 |
| --- | --- | --- |
| R24-01 侧栏 | `NAV-sidebar-open/close`、`STATE-home-sidebar-open`、`FLOW-sidebar-dismiss`；首页按钮改为侧栏入口，`assets/sidebar-24.css` 采用从左进入、`min(320px, 84%)`，遮罩、关闭与 Escape 可用。 | 在 `file://` 单文件 390×844 下侧栏宽 320px、位于应用左边界；背景滚动区域为 inert；关闭后焦点回到左上入口。作者另留 360×640 夜间/减少动效和 1280×720 桌面截图。 |
| R24-02 我的、宝宝 | `FLOW-sidebar-mine` 与宝宝关闭/保存两条 FLOW；顶部顺序为我的、宝宝。宝宝资料沿用 `#sheet`、`#profile-form`，我的沿用 `#/mine`。 | 从侧栏进入我的，焦点到“我的”标题；从记录页二级菜单进入我的后返回 `#/records`。宝宝面板聚焦标题；Escape 关闭后未提交名称没有写入资料，保存后的新名称由作者测试核对。修正后的 `ACT-sidebar-baby-close` 指向 `PROFILE-baby-sheet-close`（`#sheet-close`/Escape），`ACT-sidebar-baby-save` 指向 `PROFILE-baby-sheet-save`（表单提交），与真实控件一致。 |
| R24-03 推荐服务 | 复用 `onboardingRecommendations(profiles.concerns)`；侧栏为持续记录与管理、哭声识别、便便识别三项，关注点只改变顺序及“推荐”徽标。记录沿用 `#/records` 与新建入口；哭声/便便沿用会话任务卡。 | 注入哭声和便便关注点时顺序为哭声、便便、记录且前两项有徽标；无关注点时为记录、哭声、便便且无徽标。记录页新建可打开类型面板、焦点到记录标题；哭声和便便分别可进入现有任务卡并聚焦卡片。哭声任务未完成时切到便便会保留原任务并提示先结束。 |

## 证据与包检查

- 我独立运行 `consistency-browser.cjs`，结果见 `consistency-browser-evidence.json`：单文件与模块版均在 Chrome 的 `file://` 路径下复测；覆盖侧栏开关/焦点、我的返回、宝宝 Escape、记录新建、哭声/便便任务与冲突；两个页面均无 `pageerror`。这不代表麦克风或相机在真实设备上的权限及采集验收。
- 对照实现作者的 `browser-evidence.json`：其 8 张截图的 SHA-256 均与现存文件相符；证据所列单文件和模块版 SHA-256 与当前 HTML 一致，10 个作者检查均记录为 pass，错误数组为空。独立评审没有把这些作者检查冒充为自己全部重跑。
- `consistency-package-evidence.json` 核实需求源 SHA 与账本相符；模块版引用的 12 个 CSS/JS 资源均在包内；单文件含侧栏样式/脚本与图像内联，无外部运行时引用。R23 快照 `node prototype/versions/conversation-shortcuts-23/build-manifest.cjs --check` 核验 183 项通过。R24 首次重建的 `file-manifest.json` 已列 203 项，独立逐项读取 Node 文件字节、长度与 SHA-256 后发现 0 个不符、0 个漏列，并通过 `node prototype/current/build-manifest.cjs --check`。本报告及证据随后更新，需由主流程最后重建清单并复验。
- 四条已有 hash 路由仍是 `#/home`、`#/records`、`#/mine`、`#/onboarding`；本轮新增的是应用内侧栏，不是新的页面路由。记录页右上个人入口和已有二级菜单仍可走通。

## 问题、边界与建议

1. **已关闭，交互 minor**：初次复测时从侧栏进入记录页后焦点落在 `body`，哭声任务入口也未聚焦任务内容；实现作者补了目标标题/卡片焦点。最新单文件及模块版独立复测均通过，见 `consistency-browser-evidence.json`。
2. **已关闭，账本 major**：初稿 `ACT-sidebar-baby-close` 错将关闭/保存指向打开侧栏的 `NAV-sidebar-baby`。现拆分关闭与保存控件、动作、FLOW、测试，并与 `#sheet-close`、Escape、`#profile-form` 实际行为对照通过。
3. **最终封包复验待办**：R24 首次全量清单 203 项已独立通过，但此评审文档与 `consistency-package-evidence.json` 在核验后发生更新。最终材料不再改动时，请再生成清单并运行 `--check`；否则不能用首次结果证明最终整包哈希。
4. **冻结边界**：`hw-design-workflow` 的 `design_guard.py check` 要求合法 `B-ID` 和冻结 receipt；当前只有未冻结候选，不能伪造 ID 或宣称静态 guard/正式交付通过。账本亦注明动态面板标记与完整静态 DOM guard 尚待适配。建议用户审阅候选后如要冻结，按真实确认另走基线流程。

**独立结论**：就 R24 授权的候选差异而言，没有发现未关闭的重大页面、导航或任务流程偏差。203 项封包首次全量校验通过，最终清单重建后需只读复验。候选仍未冻结；视觉质量以独立截图评审为准。
