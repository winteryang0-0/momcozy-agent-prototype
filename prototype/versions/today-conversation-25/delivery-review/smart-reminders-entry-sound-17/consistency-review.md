# 候选 17 结构与交互一致性评审

- `role=consistency`；评审者：独立协同评审 Agent `/root/consistency_review`；日期：2026-10-20。
- `baseline_id`：无合法冻结 B-ID；本报告评审**用户授权的候选 17**，不将候选等同已冻结设计。
- 材料：`Momcozy-final.html` SHA-256 `40de3e14b70312ed2a72b048bd1fd1eb085699e2c5e1b97e38b26c05d39fa791`，`design.json` SHA-256 `ec1e7add1fae5e2bdf2e04df4c3fb502c3380f724cd3611a5ab22b8f3c888999`，`sources/refinement-17-requirements.json` SHA-256 `90cafe0983518f84cc01a90b5d3c0d7947285bf5ee397c1668cbe161b5a8c318`。另核对 `index.html`、`assets/app.js`、`assets/layout-16.css`、`assets/berry.css`、本轮浏览器证据和截图。
- 结论：**R17-01～04 的主要架构与交互路径符合授权，未发现主任务断路。状态为 `revise`，因为缺少合法冻结基线及全量状态验收，不能作为正式交付 gate 的通过记录。**

## 授权范围与证据

| 范围 | 用户授权及账本映射 | 独立核对 | 结果 |
| --- | --- | --- | --- |
| R17-01 首页 / 记录入口 | 首页左上直达当日记录；记录右上进入“我的”及二级功能，保留日期与新建。`HOME-journal-entry`、`RECORDS-profile-menu`、`FLOW-home-menu-records`、`T17-navigation`。 | `index.html` 的首页左上为 `data-go=records`，右上为声音键；记录右上为 `data-action=profile-menu`。菜单按个人资料、设备同步、对话、偏好分类；“我的”返回记录。独立 Chrome `file://` 操作走通：首页→记录→菜单→我的→记录，固定新建→保存→时间线→详情。 | 候选通过。 |
| R17-02 声音 | 右上开关、保存偏好，用户主动在结果中播报。`HOME-sound`、`FLOW-sound-toggle`、`T17-sound`。 | `app.js` 用 `prefs.sound` 与 `aria-pressed` 同步，写入本地数据；关闭调用 `stopSpeech()`。结果播报仅在用户动作后调用 `SpeechSynthesisUtterance`；不支持时提示文字回退。独立 Chrome 操作验证开关与刷新恢复。**未实听系统扬声器，也未覆盖结果播报在所有浏览器的语音质量。** | 开关与状态通过；真实音频输出未验收。 |
| R17-03 智能提醒卡 | 一张横向可切换的 Today 提醒，显示依据。`HOME-advice`、`FLOW-advice-switch`、`T17-advice-switch`。 | `app.js` 生成 3 项本地提示，按钮、点位、键盘左右键和 `touchstart/touchend` 处理切换；边界按钮禁用。提醒依据从本机记录、资料或当前演示状态生成，另有查看依据弹窗。作者的 Chrome 回归执行了箭头、点位、合成触屏事件、键盘与依据，截图绑定当前哈希。 | 候选通过；真机手势未验收。 |
| R17-04 收缩态恢复 | 会话中 Today 默认收缩，点击展开完整卡、保留当前索引、可再次收起。`HOME-today-compact`、`FLOW-advice-restore`、`T17-advice-restore`。 | 独立 Chrome 操作发送消息→展开→切到第二条→收起；作者回归补测新对话回到默认收缩、360px 展开时输入区仍可用。`adviceIndex` 在 `renderDailyAdvice()` 中保留并对边界钳制。 | 候选通过。 |

## 机械与浏览器检查

1. `design_guard.py` 的 `validate_design` 返回 0 个内部引用错误；本轮来源哈希与 `design.json` 一致。`node build-manifest.cjs --check` 在写入本评审报告前通过，检查时为 78 个文件；本报告新增后须由总负责者更新清单再检查。**正式 `design_guard.py check` 因无合法 B-ID 冻结基线仍不能判通过。**
2. `delivery-review/smart-reminders-entry-sound-17/browser-evidence.json` 的材料 SHA-256 与单文件一致，13 张截图哈希全部复核匹配；Chrome 155.0.8059.80 在 `file://` 下报告 8 类检查、0 条页面/控制台错误。截图覆盖 390×844 提醒切换、声音、记录与个人菜单、会话收缩/展开及夜间；360×640 首页/记录/展开；1280×720 首页/记录。这些是作者浏览器回归证据，本评审另用隔离 Chrome 会话重复了入口、新建与回看、Today 展开与切换、声音偏好持久化。
3. 候选 16 的设计一致性报告只绑定候选 16 的旧材料哈希，不被本报告复用为候选 17 的结论。旧资料、历史对话、任务及记录保存逻辑在代码中仍可见；本次没有跑遍 `design.json` 的全部 38 项测试，也没有真机触摸、软键盘、屏幕阅读器及真实音频输出验收。

## 开放项

| ID | 严重性 / 状态 | 影响与处理 |
| --- | --- | --- |
| C17-01 | major / open，仅限正式冻结门槛 | 无用户看过本版具体页面后确认的合法 B-ID 基线、收据及完整静态 guard。应保留本候选与证据，待具体候选获得确认后建立基线并复跑完整设计检查；不能把 `validate_design` 的 0 错误称为正式通过。 |
| C17-02 | minor / open，验收范围 | 浏览器脚本用合成触屏事件检查提醒切换；语音只验证开关、状态和代码路径。真机手势、扬声器输出与辅助技术交互需在后续设备验收补齐。 |

本结论仅适用于上述材料哈希。代码、账本或截图证据再变动时需重新审阅。
