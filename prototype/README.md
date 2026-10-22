# Momcozy 交互原型工作入口

当前迭代目录：`current/`。本轮将 CS-0.5「莓色留白」风格板应用于 HOME-1.0 第 14 轮高保真原型，保持原有页面、导航和业务交互架构；版本状态为**候选，未冻结**。上一版花瓣玻璃保存在 `versions/bloom-glass-01/`。

新的 AI 优先 UI/交互架构候选位于 [`branches/AI-1.0-candidate/`](branches/AI-1.0-candidate/README.md)。它独立于 `current/`，默认进入单条持续的 AI 对话，Today 改为建议与概况展示页；详情及测试边界见该分支 README。

## 打开与交付

- `current/Momcozy-final.html`：内嵌样式、四段脚本和形象图片的单文件交付版。
- `current/index.html` 与 `current/assets/`：便于后续修改的分文件版。在 `current/` 执行 `node preview.cjs`，然后打开 `http://127.0.0.1:4192/#/home`。
- `current/delivery-review/berry-poise-01/DELIVERY.md`：本轮改动、独立评审、证据覆盖和未验证项。
- `current/file-manifest.json`：当前文件的 SHA-256 清单；上一版清单保存在 `versions/bloom-glass-01/file-manifest.json`，第 14 轮原始清单保存在 `current/sources/revision-14-file-manifest.json`。

设计来源：`design/2026-10-20-semantic-style/CS-0.5-testboards/berry.html`、同目录的 `STYLE_SPEC.md` 与 `assets/board.css`。原型架构来源：`design/2026-10-19-home-ia/HOME-1.0/` 第 14 轮。源目录与上一版文件均保留，后续修改在 `current/` 进行。

交付状态与验证边界以本轮 `DELIVERY.md` 为准。此前五张用户截图属于花瓣玻璃版，不能用于证明莓色留白的视觉表现。AI、采集、分析、云同步和设备行为均为模拟。
