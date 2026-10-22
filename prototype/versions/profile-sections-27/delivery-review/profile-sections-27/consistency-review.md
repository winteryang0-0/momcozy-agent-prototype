# R27 独立设计一致性审查

- role: consistency
- 对象：`prototype/current` 的 `profile-sections-27` 候选；实际检查的 standalone SHA-256 为 `7d3bebe5676a09cd3dd2d744fb9b3ae7e31c2844ff702af5aaaccb45afda4676`。
- baseline_id：无合法冻结 B-ID；历史 `HOME-0.1` 不是合法 B-ID。
- 范围：R27-01、R27-02、R27-03；对照 `sources/profile-sections-27-requirements.json`、`design.json`、`index.html`、`Momcozy-final.html`、`assets/app.js`、`assets/profile-sections-27.css` 与 `browser-evidence.json`。
- 授权依据：R27 来源文件记录当前会话对双入口、宝宝独立页面、Today 缩略文字居中的候选修改授权。候选尚未获得用户对具体基线的冻结确认。
- 结论：本轮主要语义与交互证据相符，可供用户审阅；**不支持称为正式冻结或完整交付通过**。不代替视觉审美评审。

## 已核对的对应关系

| 需求 | 账本/实现 | 观察 |
| --- | --- | --- |
| R27-01 | `PAGE-mine`、`PAGE-baby`；`NAV-sidebar-mine`、`NAV-sidebar-baby`；`activateSidebar()` | 侧栏 DOM 仅显示“我的”“宝宝”，记录页及新建入口仍存在；文件协议浏览器日志覆盖打开和跳转。 |
| R27-02 | `FLOW-sidebar-baby`、`FLOW-baby-records`、`FLOW-sidebar-baby-save`；`#baby`、`data-record-owner`、`babyReturnPage` | 宝宝独立路由、资料编辑与孕周错误、保存刷新、按对象进入记录、从记录返回来源均有浏览器操作记录。 |
| R27-03 | `FLOW-advice-restore`；`.compact-advice` 与 `renderDailyAdvice()` | 明亮 390、夜间短屏 360、桌面 1280 的标题中心几何检查通过；截图中 Today 标记及展开图标可见。 |

`browser-evidence.json` 的 source SHA-256 与 `design.json` 和来源文件一致；standalone SHA-256 与当前文件一致；11/11 张截图的文件 SHA-256 与记录一致。浏览器证据注明 Chrome 155、headless、`file://`；没有声称真机覆盖。复核时 `file-manifest.json` 为 `profile-sections-27`，270 个文件条目均存在且摘要与文件一致。

## 发现与交付门槛

| ID | 严重性 | 发现、影响与建议 |
| --- | --- | --- |
| CON-27-01 | major / resolved | 早前 `file-manifest.json` 沿用 R26 且摘要过期。现已重建为 `profile-sections-27`；独立核对 270 个条目全部存在、摘要匹配，含 R27 CSS、来源、standalone 与截图。此项在当前材料关闭；后续改动须重建清单。 |
| CON-27-02 | 正式交付 blocker | `design.json` 标为 `draft`，无合法 B-ID 冻结与实际确认记录。运行 `design_guard.py check prototype/current --baseline HOME-0.1` 返回 `Baseline ID must be B plus letters/digits/hyphens`。保持候选状态，待用户审阅具体稿并确认后按设计交接协议建立合法基线并重跑 guard；不得修饰旧 `HOME-0.1` 为批准基线。 |
| CON-27-03 | minor / resolved | 早前 `T27-two-entry-sidebar` 缺遮罩关闭证据。当前 `qa-browser.cjs` 执行 `.sidebar-scrim` 点击，并断言侧栏隐藏及焦点返回菜单按钮；`browser-evidence.json` 记录 `sidebar scrim closes and restores focus`，`passed=true`、`errors=[]`。 |

上述评审只绑定所列 standalone 摘要。若页面、JS 或 CSS 后续修改，应重新核对并更新此报告与证据。
