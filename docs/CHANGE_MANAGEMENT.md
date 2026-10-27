# 原型迭代与基线变更管理

## 当前基线与历史

- 当前原型：B-MOMCOZY-20261026-NEW5，依据 Wentao 在 2026-10-26 指定桌面 New5 版本的明确指令。
- 权威入口：[prototype-baseline.json](prototype-baseline.json)与[基线说明](BASELINE.md)。源码、设计与交互规则位于该索引指定快照内。
- prototype/current/、docs/baseline-lock.json 和 baseline/B-MOMCOZY-20261022-R27 标签均属历史 R27，不因旧名称中的 current 自动取得当前基线身份。
- codex/internal-test 是当前本地工作分支。main 与远端是否包含新基线，以实际 Git 状态为准；此次本地指定不等于已经合并或发布。
- R30–R41 等目录保留为历史候选，不覆盖或套用 New5 的用户确认。

## 后续变更材料

1. 记录目标、原因、来源，以及涉及的页面、页面内控件、控件内功能和功能交互。
2. 列出原行为与新行为、导航和流程差异、数据/模拟边界，以及失败、取消、权限、同步、恢复与时间边界。
3. 在独立候选目录实现，继承 New5 的 AGENTS.md、DESIGN.md、DELIVERY.md 及首次引导契约；不要覆盖基线包或改写历史收据。
4. 保存与最终文件摘要对应的浏览器、视口、截图及操作证据。实际未测试的范围明确标注。
5. 产品负责人对具体候选确认后，新建版本快照和收据，记录 supersedes；设计/交互验收与纯文件完整性检查分别报告。

使用现有 PR 模板。提交前运行 node scripts/verify-repository.cjs；CI 复核当前 New5 以及历史 R27 的完整性。旧 R30 检查继续保护历史候选，不为当前基线增加验收结论。现有 R27 标签保持不变，不重写历史。
