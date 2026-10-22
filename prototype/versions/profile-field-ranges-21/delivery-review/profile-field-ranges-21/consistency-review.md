# R21 设计一致性评审

- **角色／判断**：`consistency`；独立于实现作者的代码、账本、运行证据复核，并独立操作最终单文件。结论为 **R21 候选范围一致性通过**。本结论不表示设计基线已冻结，也不代替视觉评审或最终包清单校验。
- **日期**：2026-10-21
- **baseline_id**：无。当前 `design.json` 为 `project.stage=draft`，R20 与 R21 均无 `baselines/<B-ID>/receipt.json`，因此 `design_guard.py check --baseline` 无合法输入。
- **评审材料**：`Momcozy-final.html` SHA-256 `e650f5084b6cb1cdee11cca55f87aa360ff213b434586732fe03641ed814f20f`；`design.json`；`sources/profile-field-ranges-21-requirements.json`；`delivery-review/profile-field-ranges-21/browser-evidence.json`；上一候选 `prototype/versions/conversation-care-cards-20`。
- **授权依据**：用户本轮明确要求妈妈年龄 18–50、分娩次数 0–6、宝宝孕周 37–50，涵盖信息录入及后续修改。R21 来源文件将“宝宝孕周”记为出生孕周，孕期当前孕周沿用 0–45；这与本轮已向用户说明的工作口径一致。

## 覆盖和判断

| 需求 | 页面／控件／动作／状态 | 已核对结果 |
| --- | --- | --- |
| R21-01 妈妈年龄 | `PAGE-onboarding`／`ONBOARD-details`／`ACT-details-next`、`ACT-onboarding-reject`／`STATE-onboarding-details`、`STATE-onboarding-invalid`；`PAGE-mine`／`MINE-profile`／`ACT-profile-save`、`ACT-profile-reject`／`STATE-profile-edit`、`STATE-profile-error` | 首次录入滚轮仅含空值和 18–50；快捷编辑仅接收空值或 18–50 整数。旧值 17 可见，保存前被拒绝，不被自动改写。 |
| R21-02 已分娩次数 | 同上 | 首次录入仅含空值和 0–6；`0` 不被当成空值。快捷编辑阻止 7 和小数，边界及清空能保存。 |
| R21-03 宝宝出生孕周 | 同上，完整资料页的 `baby-*` 滚轮 | 首次录入仅含空值和 37–50；多个宝宝逐项校验并定位出错宝宝。宝宝快捷编辑明确针对宝宝 1，其他宝宝从完整资料页修改。旧值 36／51 保留可见并阻止直接保存；孕期“当前孕周”仍为 0–45。 |

**页面架构**：相对 R20，4 个页面及其 `data-page-id` 顺序、路由、48 个状态、3 个验收视口和系统 token／组件不变。R21 仅更新 `ONBOARD-details` 与 `MINE-profile` 的职责说明、既有动作和流程的需求引用，以及字段校验和局部提示样式。未发现超出用户授权的页面或导航变化。

**资料与异常路径**：`assets/app.js` 的 `PROFILE_LIMITS`、`profileInteger`、`onboardingNumber`、`onboardingRangeError`、`submitProfile` 共用边界；完整资料在离开资料步骤和最终完成前都校验，多宝宝逐一检查。后续快捷编辑会同步暂停中的完整资料草稿；保存、刷新、取消路径在浏览器证据中有断言。未发现 R21 范围内的阻断或重大遗漏。

**机械与运行证据**：调用 `design_guard.py` 的 `validate_design` 检查 `design.json`，得到 0 个错误；`node --check assets/app.js` 通过。`browser-evidence.json` 记录 Chrome 155、`file://`、13 组检查、13 张真实截图、0 条页面或控制台错误；截图文件及 SHA-256 均存在，并全部绑定上述单文件 SHA。独立复核者另用 Chrome headless 从单文件 `file://` 进入首次录入，实测三组精确选项及空值，并用旧年龄 17 的种子资料实测快捷编辑阻止保存、原持久化值不变，未见页面错误。`index.html` 引用的 10 个本地 CSS／JS 文件均存在，无外部 `src`／`href`；浏览器证据另覆盖模块版 `file://` 打开。

## 待关闭的交付门槛

1. `design_guard.py check --baseline` 因没有用户确认的冻结 B-ID 而不能运行；按候选交付，不可称为已冻结或基线一致性认证。
2. 本评审写入时，`node build-manifest.cjs --check` 报 `Manifest differs from current files`。原因是浏览器证据和评审材料仍在定稿；**所有评审文件定稿后**须重新生成 `file-manifest.json` 并运行 `--check`。此项未完成前不声明最终包完整性通过。

**范围边界**：本评审核对 R21 字段规则、相关资料流程及上一候选架构，没有对 R20 之前全部交互重新做端到端回归。截图的审美和各视口视觉判断留给独立视觉评审。
