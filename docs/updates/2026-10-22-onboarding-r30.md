# Onboarding R30 内测候选更新说明

- 日期：2026-10-22
- 状态：可审阅候选，未冻结
- 所在分支：`codex/internal-test`
- 沿用基线：`B-MOMCOZY-20261022-R27`（`prototype/current/` 未修改）

## 本次交付

| 材料 | 位置 | 用途 |
| --- | --- | --- |
| 单文件原型 | [`Momcozy-final.html`](../../prototype/onboarding-chat-r30-candidate/Momcozy-final.html) | 直接查看候选 |
| 分文件原型 | [`index.html`](../../prototype/onboarding-chat-r30-candidate/index.html) 与 [`assets/`](../../prototype/onboarding-chat-r30-candidate/assets/) | 后续修改和本地 HTTP 预览 |
| 使用说明与变更账本 | [`CANDIDATE.md`](../../prototype/onboarding-chat-r30-candidate/CANDIDATE.md)、[`README.txt`](../../prototype/onboarding-chat-r30-candidate/README.txt)、[`design-change.json`](../../prototype/onboarding-chat-r30-candidate/design-change.json) | 范围、流程和限制 |
| 需求与视觉参考 | [`sources/`](../../prototype/onboarding-chat-r30-candidate/sources/) | 需求 ID 与上传图示 |
| 完整性收据 | [`candidate-receipt.json`](../../prototype/onboarding-chat-r30-candidate/candidate-receipt.json) | 30 个候选文件的 SHA-256 |
| 视觉证据 | [`REVIEW-FINAL.md`](../../delivery-review/r30-visual-independent/REVIEW-FINAL.md) 与同目录两张 JPG | 最终候选的实际截图及可见范围 |
| 最终材料核对 | [`r30-final-audit.md`](../../delivery-review/r30-final-audit.md) | 主代理自审和未覆盖项 |

在候选目录执行 `node preview.cjs`，然后访问 `http://127.0.0.1:4200/#/onboarding`。若端口已占用，以终端显示的实际地址为准。分文件版需保持 `index.html` 与 `assets/` 的相对位置。

## 变化

1. **对话式首次录入。** 从欢迎对话开始，先选择推荐服务和担忧点，再逐卡收集照护身份、适用的妈妈与宝宝资料；每个数据项由一张卡片承载。保留已答卡修改、Skip 暂存、返回和完成后进入原主页的路径。
2. **宝宝数量与资料。** 默认一位“宝宝”，随后询问是否录入更多宝宝；多位宝宝分别保存孕周和生日等适用资料。没有将多胎与多位不同生日的宝宝强行合并为一条记录。
3. **R30 卡片滚动。** 卡片在对话中按时间顺序自然排列。新卡超出可视区时仅滚动一次让它可见；展开选项、手动滚动和改变视口不再触发持续强制居中。
4. **R30 数值选择。** 妈妈年龄、分娩次数、当前孕周及出生孕周采用参考图方向的精简横向数字条，支持点选、鼠标拖动、触屏滚动和方向键。中心值为当前选择；“暂不填写”独立于数值 0。原有范围与保存规则沿用候选需求账本。
5. **架构边界。** 原主页、记录、我的和宝宝页面沿用 R27 结构；本次未把候选覆盖到 `prototype/current/`，也未修改 R27 冻结快照。

## 验证与限制

- `node tests/onboarding-flow.cjs`：148 项状态检查通过。
- `node tests/package-check.cjs`：16 个本地资源、5 个内联脚本和 14 个保留的 R27 资产检查通过。
- `candidate-receipt.json` 所列 30 个文件摘要均与候选一致；最终单文件 HTML 的 SHA-256 为 `3adf9e977db99ee2cdbce30dd1a436ee65af97fac4424b226d96dc6c9ec06239`，候选材料摘要为 `909ff853539bb6df531007040937452c66acf7d9b405243f5f6a27fc2a31d067`。
- 最终视觉复核记录了卡片自然排列、数字条以及视口改变后保留未填写/已选状态；两张截图均为 1265 × 712 像素的浏览器视口截图。390 × 844 是浏览器模拟视口，不是真实设备。
- 较早的一致性报告绑定修复前源码摘要，不作为最终候选的独立一致性通过证据。R30 缺少经用户确认的新基线 `design.json`，因此尚未通过正式 `design_guard`。内置浏览器不允许 `file://` 打开，双击运行尚未实测。
- AI 回复、健康分析、设备及同步能力仍属于原型模拟。

本次 GitHub 更新仅供内测审阅。是否接纳为新基线，需先审阅此候选并记录具体确认，再完成相应的设计 guard 和最终独立评审。
