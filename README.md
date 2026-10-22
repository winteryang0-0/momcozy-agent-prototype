# Momcozy Agent 产品原型协作仓库

## 当前基线

| 用途 | 位置 | 状态 |
| --- | --- | --- |
| 高保真交互原型 | [`prototype/current/Momcozy-final.html`](prototype/current/Momcozy-final.html) | **B-MOMCOZY-20261022-R27**，2026-10-22 确认的 Git 协作基线 |
| 可维护源码 | [`prototype/current/index.html`](prototype/current/index.html)、[`assets/`](prototype/current/assets/) | 与同目录单文件版一起纳入文件清单 |
| UI 与交互规范 | [`prototype/current/design.json`](prototype/current/design.json)、[`IMPLEMENTATION.txt`](prototype/current/IMPLEMENTATION.txt) | 页面、控件、动作、状态、流程、组件、token 和测试映射 |
| 冻结依据 | [`receipt.json`](prototype/current/baselines/B-MOMCOZY-20261022-R27/receipt.json)、[`baseline-lock.json`](docs/baseline-lock.json) | 用户确认定位及 SHA-256 |
| 内测优化 | `codex/internal-test` 分支 | Onboarding 等设计变更的候选线，尚未并入基线 |

双击 `prototype/current/Momcozy-final.html` 可以查看单文件原型；分文件版需保留同目录 `assets/`。若浏览器限制本地功能，在 `prototype/current/` 执行 `node preview.cjs`，按终端提示访问本地预览。浏览器记录和已知限制见 [`基线说明`](docs/BASELINE.md)。

## 最新内测候选

对话式 Onboarding R30 位于 [`prototype/onboarding-chat-r30-candidate/`](prototype/onboarding-chat-r30-candidate/CANDIDATE.md)，包含单文件原型、分文件源码、需求与设计差异、参考图、状态检查及文件摘要。它延续 R27 页面架构，将首次录入改为逐卡对话，并按 2026-10-22 的反馈修正卡片滚动与横向数字选择条。截图及评审范围见 [`R30 更新说明`](docs/updates/2026-10-22-onboarding-r30.md)。**R30 仍为待确认候选，未替换 `prototype/current/`。**

## 协作规则

1. `main` 存放已确认基线。历史候选仍在 `prototype/versions/` 与 `prototype/branches/`，不能被解读为现行规范。
2. 内测优化进入 `codex/internal-test`，先提交变更说明、原型、截图和交互验证，再经评审决定是否形成新基线。
3. 涉及页面职责、导航、流程、业务状态或设计 token 的改动，填写 [变更管理说明](docs/CHANGE_MANAGEMENT.md) 和 PR 模板。不得覆盖旧 B-ID 快照。
4. 提交前运行 `node scripts/verify-repository.cjs`；R30 候选另运行 `node scripts/verify-onboarding-r30.cjs` 及候选目录的状态/包检查。GitHub Actions 重复这些静态检查，并与基线标记比较冻结目录；视觉和交互结论仍以实际浏览器证据为准。

`requirements/` 保存需求来源；`design/` 保存设计探索与来源；`research/` 保存研究记录。`soft-companion-workspace/` 是此前形成的可修改工作副本，包含大量与 `design/`、`prototype/` 相同的历史文件，不能当成比当前基线更新的原型。依赖缓存和构建输出由 `.gitignore` 排除。

当前原型中的 AI 回复、分析、保存核对、设备和同步能力含本地模拟。冻结的是当前可见的 UI、交互原型和设计账本，不代表生产功能、真机或所有状态与视口组合已通过验收。
