# 当前原型基线：New5 Soft Companion

角色外观另以 2026-10-26 用户确认的 **Sprout Creature** 为当前基线，见 [角色基线说明](CHARACTER_BASELINE.md)与[机器索引](character-baseline.json)。这一更新优先于本快照中的旧角色外观，不改变 New5 原型架构或原样快照；页面替换尚未实施。

## 用户决定

- 基线 ID：B-MOMCOZY-20261026-NEW5。
- 确认人：Wentao；日期：2026-10-26，Asia/Shanghai。
- 确认原文：“C:\Users\user\Desktop\Root Work\Momcozy Agent\New5\Momcozy-Soft-Companion；修正以这一版为我们的原型基线”。
- 确认定位：Codex 聊天 01a17632-0595-7220-a858-70a2d2b0c24a 中指定 New5 目录的用户消息。
- 该决定替代此前将 R27 作为当前原型基线的项目说明；R41 保持历史候选身份。

## 当前材料

[机器索引](prototype-baseline.json)指向仓库内[原样快照](../prototype/baselines/B-MOMCOZY-20261026-NEW5/package/)。单文件入口为 Momcozy-Soft-Companion.html，分文件入口为 index.html。

快照包含来源目录全部 112 个文件，包括源码、资源、项目指令、设计规范、首次引导契约、测试脚本、历史文字评审及随包 Material 规则。未修改来源目录或快照内原始文件。

[manifest.json](../prototype/baselines/B-MOMCOZY-20261026-NEW5/manifest.json)记录逐文件字节数与 SHA-256；[receipt.json](../prototype/baselines/B-MOMCOZY-20261026-NEW5/receipt.json)记录实际用户指令、来源、清单摘要和替代关系。索引再锁定这两份元数据的摘要。

单文件 SHA-256：7645953259d1056ab7511ea99c4df9b03e0fcd8ffbb32379fa5eb3a19da4f986。

## 规则与验收边界

继承快照内 AGENTS.md、DESIGN.md、DELIVERY.md 及 ONBOARDING-INTERACTION.md。Google/Material 1.1.0 为随包约定，后续 UI 变更按该约定执行；本次仅登记并保存选定版本，没有重新设计界面。

本次确认是现有原型版本的用户指定基线。它没有新增完整 PRD 映射或 design.json，也未执行 design_guard freeze；不得表述为该工具的正式设计冻结认证。无需为了登记版本改造用户已经指定的原型。

历史测试/评审按原字节保留，本次不将其改写为重新执行通过。当前只验证源包复制、文件集合及摘要完整性；不追加真实 AI、临床、真机、云服务或完整交互验收结论。

## 校验与历史保存

- node scripts/verify-repository.cjs：同时核对当前 New5 快照与旧 R27。
- node scripts/verify-prototype-baseline.cjs --source：在本机额外核对桌面来源和仓库快照一致；若桌面版后来改变，检查会报告差异，不自动重建摘要。
- prototype/current/ 和 docs/baseline-lock.json 原样保留为历史 R27 包与历史锁；旧说明原样保存在[历史文档](history/B-MOMCOZY-20261022-R27.md)。
- 当前基线切换不意味着 main、远端或 Git 标签已经更新。后续提交/发布另行管理。
