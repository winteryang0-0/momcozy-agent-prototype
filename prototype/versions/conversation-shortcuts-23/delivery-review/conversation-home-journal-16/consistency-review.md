# 候选 16 结构与交互一致性评审

- `role`: consistency；评审者：独立协同评审 Agent `/root/consistency_review`。
- 日期：2026-10-20；`baseline_id`: **无合法冻结 B-ID**；对象为用户授权的候选稿，不是已冻结设计。
- 评审材料：`Momcozy-final.html` SHA-256 `5bdf0c6f1d0fcdf0bb0818565450dd2a17fdad9f13a4cfa2b052584d9c773de7`；`sources/framework-16-requirements.json` SHA-256 `0d05c15cf4c8b21af12823ef8ae291841dd8ead0667c4894e39392b6bd184818`；`design.json` SHA-256 `2fe2995f6720313fbf670d73ac484911247282bc8fd644083691b11c3abdb137`；`README.txt`、`IMPLEMENTATION.txt`、`browser-evidence.json`、12 张截图及当前 `index.html` / `assets/app.js` / `assets/berry.css` / `assets/layout-16.css`。
- 结论：**本轮授权的页面结构与主要入口一致；上轮两项 minor 已在本材料上复核关闭。正式设计一致性状态仍为 `revise`，不能作为冻结或交付 gate 的 pass。** 当前材料未发现 R16 主任务断路。视觉风格质量由独立视觉评审判断。

## 授权差异与检查结果

| 范围 | 授权依据 | 独立核对 | 结论 |
| --- | --- | --- | --- |
| R16-01 / PAGE-home / HOME-main-menu | 用户确认图 1 替换 Today、移除三栏 Dock，左上角菜单承接记录等入口；`framework-16-requirements.json` R16-01 | `index.html` 的首页为 `#assistant[data-page-id=PAGE-home]`；`app.js:234` 将 `#/assistant` 归并到 `#/home`；HTML 无 `.dock`。菜单实现含记录、我的、资料、设备、同步、历史、新对话和设置。390 / 360 / 1280 首页截图与 `file://` 浏览器回归相符。 | 符合候选授权。 |
| R16-02 / PAGE-records / RECORDS-owner、summary、filter、events | 用户提供记录排布参考图，要求保留莓色留白风格；`framework-16-requirements.json` R16-02 | `index.html:8-27` 的可见顺序为日期、对象、摘要、时间线、折叠二级分析；`app.js:235-245` 按所选日期和对象计算摘要、筛选列表；390 填充与滚动截图显示时间线，360 空态滚动截图显示底部内容可继续查看。 | 符合候选授权。 |
| R16-03 / RECORDS-record、RECORDS-events、CHAT-record | 用户要求保留新建入口；`framework-16-requirements.json` R16-03 | 固定 `#record-cta` 仅记录页显示；浏览器证据实际完成类型选择、保存、日期/对象回切与回看。`app.js:267-279,398-404` 保留详情、编辑、删除确认路径；首页“记一笔”仍走会话卡。 | 入口与关键闭环可达。 |
| 历史会话与既有二级功能 | R16-01 对旧业务入口的保留说明 | 本评审另用独立、隔离的 Chrome `file://` 上下文操作：菜单→我的→返回、发送消息→历史对话→新对话→恢复旧会话、菜单→记录→新建→详情→编辑、删除取消、展开“更多记录分析”并打开卡片，均成功，无页面异常。 | 这些路径可达；未据此推定所有旧状态完整回归。 |

## 机械核对与运行证据

1. 来源文件与 `design.json` 记录的本轮、历史、上一候选 SHA-256 均匹配。`design_guard.py` 的 `validate_design` 对当前账本返回 **0 个内部引用错误**。完整 `check --baseline HOME-0.1` 返回 `Baseline ID must be B plus letters/digits/hyphens`；历史 `HOME-0.1` 不能作为合法冻结基线，也不能把内部引用检查称作完整 guard 通过。
2. `browser-evidence.json` 在 2026-10-20 12:56:28 UTC 重采，与新单文件 SHA-256 一致；12 张截图 SHA-256 全部复核一致。Chrome 155.0.8059.80 在 `file://` 下记录 9 类检查、无 console / page 错误。截图覆盖 390×844 首页欢迎/会话/夜间、记录空态/填充/滚动/妈妈；360×640 首页与记录首屏/滚动；1280×720 首页与记录空态。截图来源是作者的 Playwright 浏览器回归；本评审审阅了图片和脚本，并在新哈希上另用隔离 Chrome 上下文复查无 Dock、历史菜单、菜单→记录、新建入口及记录摘要的明亮/夜间计算样式，均通过。
3. 未覆盖真机触摸、系统软键盘、屏幕阅读器、每个 `design.json` 测试与状态组合；也没有完整静态 DOM/token guard 和合法冻结收据。因此不能写成全量交互、视觉或正式交付通过。

## 发现与建议

| ID | 严重性 / 状态 | 证据与影响 | 建议 |
| --- | --- | --- | --- |
| C16-01 | minor / resolved | `design.json` 中 `CHAT-history`、`CHAT-new` 已改为首页左上菜单；`R15-07` 当前页映射为 `PAGE-home` / `PAGE-mine` 并保留 `superseded_by=R16-01`；`T15-profile-menu` 与 `T15-profile-mine` 的步骤/预期均按新路径更新。旧 flow ID 仍作历史标识，不再与步骤冲突。 | 独立复核当前账本及新单文件菜单路径通过。`verified_by=/root/consistency_review`；`verified_material_hash=5bdf0c6f1d0fcdf0bb0818565450dd2a17fdad9f13a4cfa2b052584d9c773de7`。 |
| C16-02 | minor / resolved | 新增记录摘要边框、背景、阴影和新建按钮阴影已迁至 `assets/berry.css` 的 `--journal-*` 语义 token，`design.json` 值匹配，`assets/layout-16.css` 使用 `var(...)` 且无颜色字面值。隔离 Chrome 计算样式复核：明亮摘要边框 `rgb(234, 215, 222)`，夜间为 `rgb(91, 74, 84)`，背景渐变也随主题切换。 | 独立复核 token 声明、使用和实际主题状态通过。`verified_by=/root/consistency_review`；`verified_material_hash=5bdf0c6f1d0fcdf0bb0818565450dd2a17fdad9f13a4cfa2b052584d9c773de7`。 |
| C16-03 | major / open（仅限正式交付门槛） | 无经用户审阅确认的合法 B-ID 冻结基线；完整 `design_guard.py check` 不能执行为通过。此项是正式冻结与交付门槛，**不是本轮候选结构的未授权变更**。 | 保留当前候选材料和差异；待用户看过具体页面并明确确认后，再按设计交接协议建立合法基线并复跑完整 guard 与独立双角色验收。 |

本报告仅评价上述材料哈希对应的候选。任何代码、设计账本或证据变化均须重新核对。
