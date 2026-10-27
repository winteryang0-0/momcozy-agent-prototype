# 当前 main 原型入口

[运行 New5 原型](prototype/new5-welcome-stream-candidate/Momcozy-Soft-Companion.html) · [本次改动与边界](releases/new5-main-20261027/CHANGELOG.md) · [完整下载包](releases/new5-main-20261027/Momcozy-New5-20261027.zip)

# Momcozy Agent 产品原型协作仓库

## 当前原型基线：New5 Soft Companion

当前角色形象基线为 **Sprout Creature（2026-10-26 用户确认）**，见 [角色基线说明](docs/CHARACTER_BASELINE.md)。后续角色及动画以该图为准；New5 架构与历史快照继续保留，页面角色尚未替换。

Wentao 于 **2026-10-26** 明确指定桌面 Root Work/Momcozy Agent/New5/Momcozy-Soft-Companion 为原型基线。当前 ID：**B-MOMCOZY-20261026-NEW5**。

| 用途 | 位置 |
| --- | --- |
| 单文件原型 | [Momcozy-Soft-Companion.html](prototype/baselines/B-MOMCOZY-20261026-NEW5/package/Momcozy-Soft-Companion.html) |
| 分文件源码 | [index.html](prototype/baselines/B-MOMCOZY-20261026-NEW5/package/index.html) 与同目录 assets/ |
| 设计与交互规则 | [AGENTS.md](prototype/baselines/B-MOMCOZY-20261026-NEW5/package/AGENTS.md)、[DESIGN.md](prototype/baselines/B-MOMCOZY-20261026-NEW5/package/DESIGN.md)、[首次引导契约](prototype/baselines/B-MOMCOZY-20261026-NEW5/package/ONBOARDING-INTERACTION.md) |
| 能力与历史验证边界 | [DELIVERY.md](prototype/baselines/B-MOMCOZY-20261026-NEW5/package/DELIVERY.md) |
| 当前基线索引 | [prototype-baseline.json](docs/prototype-baseline.json)、[基线说明](docs/BASELINE.md) |
| 用户决定与文件完整性 | [receipt.json](prototype/baselines/B-MOMCOZY-20261026-NEW5/receipt.json)、[manifest.json](prototype/baselines/B-MOMCOZY-20261026-NEW5/manifest.json) |

快照保留指定目录全部 112 个文件的原始字节。后续以该版随包规则为准：Google/Material Web 适配、移动 App、首页对话与浮动工具、无首页底部 Dock。当日记录页有专属记录 Dock；具体规则以设计文档中较新的明确决策为准。

## 历史版本与协作

- prototype/current/ 保留旧 **R27** 冻结包及原路径，供历史校验，已不代表当前原型基线。
- R30–R41 等候选及 soft-companion-workspace/ 为历史材料，不按目录名称或编号推断当前基线。
- 新变更使用独立候选目录，按[变更管理](docs/CHANGE_MANAGEMENT.md)记录差异与验证。不要覆盖已确认快照。
- 本次切换在本地落盘；Git 提交、远端发布和标签另行管理。

校验当前快照和历史 R27：

~~~sh
node scripts/verify-repository.cjs
~~~

本机还可运行 node scripts/verify-prototype-baseline.cjs --source，与原始桌面目录逐文件比较。文件校验不等于交互或视觉验收。图像/哭声分析仍为显式模拟，账号、云同步及真机限制见交付说明。

## 当前局部微调候选

[New5 欢迎页整合](prototype/new5-welcome-stream-candidate/Momcozy-Soft-Companion.html)：2026-10-26，保留姓名前置，合并前两页、移除 onboarding 顶部关闭按钮，并逐字显示欢迎语。说明与验证见[候选记录](prototype/new5-welcome-stream-candidate/CANDIDATE.md)。原基线及上一轮候选均保留。
