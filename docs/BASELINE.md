# 高保真原型 Git 协作基线

## 身份与范围

- 基线：`B-MOMCOZY-20261022-R27`
- 用户确认：本次对话中 Wentao 指定“当前的高保真原型作为基线，作为可冻结内容”，并要求内测优化另行管理。
- 实现来源：`prototype/current/` 的 `profile-sections-27`。截至冻结时的现行页面为会话首页、记录、我的、宝宝、资料录入，共五条路由。
- 来源账本：`prototype/current/sources/profile-sections-27-requirements.json`；`design.json` 映射 61 个需求 ID、5 个页面、41 个控件、94 个动作、52 个状态、55 条流程、45 个 token、12 个组件与 94 条测试描述。
- 浏览器验收视口：390×844、360×640、1280×720。已有截图和操作记录覆盖其中部分页面与状态，不能推断为全部组合。

## 可复现材料

| 材料 | 路径 |
| --- | --- |
| 原型单文件版 | `prototype/current/Momcozy-final.html` |
| 原型分文件版 | `prototype/current/index.html` 与 `assets/` |
| 设计账本与来源 | `prototype/current/design.json` 与 `sources/` |
| 实现说明、运行方式 | `prototype/current/IMPLEMENTATION.txt`、`README.txt` |
| 文件级 SHA-256 | `prototype/current/file-manifest.json` |
| 冻结设计快照与确认收据 | `prototype/current/baselines/B-MOMCOZY-20261022-R27/` |
| 本次仓库级锁定摘要 | `docs/baseline-lock.json` |
| 当时的浏览器与评审证据 | `prototype/current/delivery-review/profile-sections-27/` |

`receipt.json` 将需求来源、范围、框架和系统摘要绑定到用户确认。`baseline-lock.json` 另行锁定实际原型和文件清单。`scripts/verify-repository.cjs` 会逐项重新计算，而非只信任清单文字。

## 冻结边界

- 现有需求账本中关于旧轮次“待查看后冻结”的记录保留为历史审批过程；本次确认只锁定当前 R27 合并后的可见原型与账本，不追认每个旧候选曾单独获批。
- 现有 R27 评审在指定截图范围内未发现重大视觉问题；旧评审文件保留其原日期、原结论，不改写为本次正式认证。
- `design_guard.py freeze` 已创建合法 B-ID 收据；`check` 当前因缺少该工具要求的 `bundle/index.html` 和静态 DOM 标记导出而未通过。仓库的 SHA-256 检查是文件完整性门槛，不替代该设计 guard、独立评审或完整交付门槛。
- 真机触控、系统权限、软键盘、屏幕阅读器及全部状态×视口矩阵仍是未验收项。AI、健康分析、云同步、设备连接和服务端幂等仍为模拟或待定义能力。

任何后续优化都在内测分支保留差异证据。产品负责人确认具体差异后，新建 B-ID 和快照；旧快照与收据只读。
