# R23 框架与交互一致性自审

日期：2026-10-21。评审者：实现者 `/root`，`independent=false`。基线 ID：**无合法冻结 B-ID**；本轮为待审阅候选，不声明完整 `design_guard.py check` 或正式设计交付通过。

材料：本轮 [需求记录](../../sources/conversation-shortcuts-23-requirements.json) SHA-256 `9f6bca63e38be7b54a7f65ada2b514546ba7a7932ac20b20933cf6ac47dd9724`；`design.json` SHA-256 `6a3a95c93282504d6fb4c9f4a471cc6c14c0662be125f70d3ac19a72044ef332`；`Momcozy-final.html` SHA-256 `a8e5650f92b8bbb3b60ec05ac78322f16c3b4f5de514d4f13a4ce75f48f2c5df`。上一完整候选为 `prototype/versions/secondary-sheet-motion-22/`，其原文件清单 `--check` 复验为 167 文件。

## 对照结果

| 范围 | 对照证据 | 结果 |
| --- | --- | --- |
| 页面与导航 | 上版与本版 `design.json` 的 PAGE-ID、hash 路由和控制数对比 | 均为 4 页、32 个控件，路由仍是 `#/home`、`#/records`、`#/mine`、`#/onboarding`；无底部导航。首页仅将 `three-care-actions` 区域改为输入框前的 `persistent-care-shortcuts`。 |
| 功能职责 | `CHAT-care`、新 `CMP-care-shortcuts`、5 个新增动作和 6 条新增流程 | 同一 `CHAT-care` 控件从欢迎与回复卡片迁至输入区；新增欢迎入口和任务互斥的显式映射，未更换任务卡片状态机。 |
| 业务逻辑 | 上版与本版 `assets/app.js` 逐段差异 | 差异为移除 `followupServices()` 及其在回复、记录回执和照护终态的渲染；`startTask()`、`launchCare()`、保存、媒体采集、取消与恢复逻辑未改。 |
| 视觉规范 | 新 `assets/care-shortcuts-23.css` 与四份旧样式差异 | 新增入口只引用既有 CS-0.5 语义 token；旧样式仅移除重复入口的选择器，资料录入和图标资源未改。 |
| 包完整性 | `build-standalone.cjs`、[浏览器证据](browser-evidence.json) | 单文件内嵌新 CSS，模块版保留相对资源；Chrome 155 在 `file://` 下打开两版入口，页面及控制台错误均为 0。 |

## 需求闭环与运行证据

| 需求 | 页面／控件／流程 | 已执行的观察 |
| --- | --- | --- |
| R23-01 去重复入口 | `PAGE-home`／`CHAT-care`／`FLOW-task`、`FLOW-inline-record`、`FLOW-photo-task` | 连续三条回复、保存回执与两类失败卡片中无 `data-care` 重复节点；对应截图 02、04、05、06。 |
| R23-02 常驻横排 | `PAGE-home`／`CHAT-care`／`FLOW-shortcut-record-welcome` | 390×844 明亮与 360×640 夜间实测 29px 对 58px、按钮同排、无水平溢出；键盘焦点及减少动效检查通过；截图 01、03、07、08。 |
| R23-03 原任务交互 | `CHAT-care`／欢迎入口、三条任务流和互斥流程 | 记一笔保存一条记录；听哭闹与看便便进入设备拒绝及恢复状态；活跃任务时切换入口保留当前卡片并提示；刷新后入口仍在。 |

设计技能的 `validate_design(root, design.json)` 使用本地捆绑 Python 运行，内部来源 SHA-256、页面／控件／动作／状态／流程引用、需求映射和验收描述返回 `[]`（0 错误）。[浏览器证据](browser-evidence.json)记录 12 组实际检查和 8 张当前单文件散列对应截图。

## 未关闭的正式交付条件

本项目历史 `HOME-0.1` 不符合设计协议所需的 B-ID，当前 `project.stage=draft`，没有针对 R23 可追溯的冻结确认；本轮视觉与一致性均由实现者自审。因此本稿可作为用户审阅候选，不标记为独立评审通过或设计冻结。真机触控、软键盘、辅助技术与真实系统权限弹窗未在本轮复测。
