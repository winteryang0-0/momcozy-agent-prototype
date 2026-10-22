# Momcozy Agent · UI/UX 风格探索交接

整理日期：2026-10-20。本目录保存历史会话产物的原样副本，供后续风格探索使用。

## 入口

- [第 14 轮完整交互原型](prototype-reference/Momcozy-final.html)：自包含 HTML。来源：`design/2026-10-19-home-ia/HOME-1.0/Momcozy-final.html`。
- [QO-2.0 风格实验室](style-lab/index.html)：最近的独立风格候选，含 CSS、JS、[风格规范](style-lab/STYLE_SPEC.txt) 与 [设计定义](style-lab/design.json)。来源：`design/2026-10-19-ui-style/QO-2.0-candidate/`。

## 状态与校验

- 完整交互原型仍有模拟数据、AI、设备与同步反馈；视觉规范尚未冻结。
- QO-2.0 的状态为 `awaiting-user-review-not-frozen`。2026-10-20 的新会话要求重新探索，以 Momcozy App 的组件风格和语义作为参考。此副本仅作历史起点。
- 复制后对 8 个文件逐一计算 SHA-256，全部与现存源文件一致。完整原型哈希：`a437f1d2100dfe134ca7c42ca7ff2ee89560034d81ee8d4ab38e4df7deedef24`；风格实验页哈希：`d6b6afe6281f4ae67f559728dc4df8d5ec0ea8dceda13ad6e1f7685f5f835d52`。
- 原 `candidate-summary.json` 中 `assets/app.js` 和 `STYLE_SPEC.txt` 的哈希与现存源文件不一致，属于过期摘要值，不用于本次校验。本次复制的这两份文件与现存源文件一致。
- 已检查风格实验页的本地 CSS/JS 均已复制，JS 语法检查通过。两页在新目录未重新做浏览器回归；历史验证记录只对应当时的源文件。