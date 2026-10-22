# R30 最终候选交付核对

- 核对日期：2026-10-22（Asia/Shanghai）
- 角色：主代理自审；不是独立一致性评审
- 候选：`prototype/onboarding-chat-r30-candidate/`
- 状态：可审阅，未冻结；`prototype/current/` 未替换
- 候选收据 `material_sha256`：`909ff853539bb6df531007040937452c66acf7d9b405243f5f6a27fc2a31d067`
- `Momcozy-final.html` SHA-256：`3adf9e977db99ee2cdbce30dd1a436ee65af97fac4424b226d96dc6c9ec06239`

## 核对结果

1. 收据所列 30 个文件的 SHA-256 与当前文件全部一致；最终 HTML、onboarding JS 和 CSS 的摘要与收据一致。
2. `node tests/onboarding-flow.cjs`：148 项状态检查通过。
3. `node tests/package-check.cjs`：16 项本地资源、5 个内联脚本、14 项沿用的 R27 资产通过。
4. `http://127.0.0.1:4200/#/onboarding` 返回 HTTP 200。最终视觉报告记录了浏览器中的自然对话流、横向数字条及视口变化后保留未填写/已选状态；本次自审没有重新操作浏览器。
5. 最终截图实际为 JPEG，已使用 `.jpg` 扩展名，摘要与 `r30-visual-independent/REVIEW-FINAL.md` 一致：`r30-final-picker.jpg` 为 `7d4503ab21c7c42f7178df32fac14d465eeb4ccee22824e1ed90ed4113b24bb8`，`r30-final-flow.jpg` 为 `7925899cdeb7888a37131e5b143b18af85fc7d93b3f36537f6763525a741eee8`。两图均为 1265 × 712 像素。

## 交付边界

- `r30-consistency-independent/REVIEW.md` 对应最终修复之前的 HTML 和 JS 摘要，不作为最终候选的独立一致性通过证据。
- 候选缺少新获确认基线的 `design.json`，`design_guard` 尚不能对 R30 作正式交付通过判断。
- 浏览器安全策略阻止通过内置浏览器测试 `file://`，双击打开尚未实测。
- 用户确认具体 R30 候选后，才可建立新基线、完成正式 guard 与最终独立一致性复核，再替换当前原型。
