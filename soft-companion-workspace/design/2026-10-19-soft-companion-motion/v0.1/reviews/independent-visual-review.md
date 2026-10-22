# 软石 AI 动态候选 v0.1：独立截图视觉复核

- role: visual
- reviewer: /root/motion_visual_review；未编写应用代码
- independent: true
- evidence_mode: screenshot-review
- status: pass（仅限下表实际查看的候选截图视觉范围）
- baseline: 用户已选 soft-companion-v0.1.png 角色方向；动态实现仍为候选演示，非已冻结产品设计或生产验收。
- 截图操作者：主 Agent /root。浏览器：ChatGPT in-app browser；版本 unknown；URL：http://127.0.0.1:5196/standalone.html。主 Agent 报告捕获时间约 2026-10-19 11:27–11:33 UTC，精确捕获时间 unknown，文件保存时间不能替代精确捕获日志。
- 声明视口：桌面 1280×1000 CSS px；移动模拟 390×844 CSS px。截图为长页，实际宽度可为 1264、374；主 Agent 说明平台滚动条占用了部分可见宽度。

## 结论

实际使用 view_image 查看源概念板、实现与源图同屏对照，以及下表 14 张实现截图。样本内未发现需要阻断候选演示的 P1/P2 问题，可作为独立交互演示供用户评估。此结论不代表产品接入、全部动态表现或全部状态视觉验收通过。

角色保留原图扁圆、不对称的软石轮廓，奶油白主体、酒红下腹与面部，以及柔和颗粒质感、渐变体积。中性嘴型在源图右上角色中有依据，不应因与主图微笑不同判为造型漂移。外围控制面板是独立演示布局，不在原概念板一比一复刻范围。

所审状态的主标题、说明和操作清楚。无法判断、离线、权限、失败状态以文字及恢复入口表达，不通过笑脸暗示医学判断或健康结果。移动长标题和双操作按钮仍在角色卡片内可见；未发现角色卡片、状态选择区的截断、重叠或页面宽度溢出。主按钮、次操作和选中状态可辨认。

减少动态截图中仍可看见播报状态、状态文字和打断入口；静态截图不能证明运动实际停止。

## 实际查看覆盖矩阵

所有实现截图来自独立演示主页。下面每行仅证明对应状态与视口组合。

|视口|状态/用途|截图|
|---|---|---|
|源图 1536×1024|原角色基准|../../../2026-10-19-ai-characters/soft-companion-v0.1.png|
|桌面|源图与就绪角色同屏对照|source-and-implementation.png|
|桌面|就绪|desktop-state-01.png|
|桌面|保存成功、反馈结束后的静态状态|desktop-state-07.png|
|桌面|无法判断|desktop-state-09.png|
|桌面|播报中、减少动态已勾选|desktop-reduced.png|
|移动|就绪|mobile-ready.png|
|移动|收音中|mobile-state-02.png|
|移动|待确认|mobile-state-05.png|
|移动|无法判断|mobile-state-09.png|
|移动|保存失败|mobile-state-10.png|
|移动|离线|mobile-state-11.png|
|移动|权限未开启|mobile-state-12.png|
|移动|处理超时|mobile-state-13.png|
|移动|已取消、流程条横向滚动至末步|mobile-timeline-scrolled.png|

state-captures.json 列出了 15 状态 × 2 视口共 30 项；条目存在不等同于本人逐图审阅。其余状态/视口组合不在本人视觉通过范围。

## 发现与限制

- P1/P2：所审范围未发现。
- 移动流程步骤条的横向截取已排除为阻断缺陷：主 Agent 在 390×844 视口实际横滑，报告 clientWidth 339、scrollWidth 492，scrollLeft 从 0 变为 153.33。本人进一步查看 mobile-timeline-scrolled.png，确认第四、第五步完整显示；本项关闭。此处为操作者运行记录加本人截图复核，不是本人亲自触摸实测。
- 本人未操作浏览器，也未运行流程。动画节奏、插值、流畅性、循环、暂停恢复、打断即时性、后台恢复、触摸滚动、键盘焦点均未由本人验证。
- 主 Agent 报告的交互实测归属于主 Agent；flow-checks.json 列有七条流程结束状态，不是本人运行证据。
- 小尺寸角色、真实移动硬件、多语言、极端文字、屏幕阅读器和完整 WCAG 合规未审查。大尺寸对照通过不能推广到 24/48/96 px。
- 应用或素材变化后，变更部分需新截图复核。散列绑定评审时文件，不能单独证明浏览器执行的是此文件。

## 证据元数据

PNG 尺寸来自文件头，保存时间来自文件 mtime；精确捕获时间 unknown。SHA-256 来自本次实际字节。

|文件|像素尺寸|文件保存时间 UTC|SHA-256|
|---|---|---|---|
|source-and-implementation.png|65536×4292542531|2026-10-19T11:30:25.632Z|5aa48196b92a0ca09b7d909fcf402329d12dd4438249a74fd1ac163b5955681e|
|desktop-state-01.png|65536×4292542531|2026-10-19T11:27:40.374Z|2a978fea8e22962763f2b7c7ed6425a8114dbc8ff0ca4db272bbf89e91f29f6d|
|desktop-state-07.png|65536×4292542531|2026-10-19T11:27:48.996Z|361fd928bc58ab46b47e988bf0588ace3057d1907a09c9286436f4e12fc41f43|
|desktop-state-09.png|65536×4292542531|2026-10-19T11:27:51.811Z|c7d659fcefc585d8cb4e87f10e3afc3c9ee72d098563921ced81d920972fa91a|
|desktop-reduced.png|65536×4292542531|2026-10-19T11:28:24.317Z|af51e88afa1ebb0e6155e556d1f92998135db8b925a08959e634933383ba11d5|
|mobile-ready.png|65536×4292542531|2026-10-19T11:29:27.584Z|2723b506766d441d829c88598b96e2e238ae4eda26fdc61ed02e8828ff840577|
|mobile-state-02.png|65536×4292542531|2026-10-19T11:30:04.290Z|e50e6283b2911b023ac1c4527dcdc5e5d1e37aafe666761c65a2a198996975b4|
|mobile-state-05.png|65536×4292542531|2026-10-19T11:30:08.678Z|955244c3ac415a358b6bde5e72f58b0b450bc978c44a511bf60104bd6ec88ade|
|mobile-state-09.png|65536×4292542531|2026-10-19T11:30:14.527Z|1e58af09d318759d24eee96d91624d5e4a96c913dd16836d90ecf44314bb170a|
|mobile-state-10.png|65536×4292542531|2026-10-19T11:30:15.988Z|12b9e89070ea003e02d795c3ed961edef16c395b9652f23bcb65062fc6dc8375|
|mobile-state-11.png|65536×4292542531|2026-10-19T11:30:17.516Z|f056b175a89240c9c48df7e72262e72501e43166491d8d1ca79f43de6f52be4f|
|mobile-state-12.png|65536×4292542531|2026-10-19T11:30:19.016Z|f0e94ea6af71a769d75f6e25b42df6d8a525e5eddd44d84720604523915e861e|
|mobile-state-13.png|65536×4292542531|2026-10-19T11:30:20.483Z|68d2251183526e818eb563c89dddc6d0790476df4cbcad240651699c5fa4882b|
|mobile-timeline-scrolled.png|65536×4292542531|2026-10-19T11:33:44.458Z|f0d8c477e05df3079cf678163c291c999e27d7dfdfd50b7353f8d52d7aebaa0f|

## 材料散列

- bundle/index.html: 261ca1fe525f2d698cf128e0c92694ad9dd1da0f59f324f64b5ee6d93251084d
- state-spec.json: d75aa492b7bcb4b086537ef756a5d4534b5799f0aa4c910507abd404fe3fd539
- app/src/App.jsx: fbd01df8cbabd1dc233a48d48e206680cb8a91edc35d766fb9ba48901a498f0a
- app/src/Avatar.jsx: b6517f6895f1633ce24af638a51495ea4dc2bfa2842f693372298644b038199c
- app/src/motion.css: 5042051954337cdd8954b7e2edddd5635d6061509d3b45f6ef464548cdf8ceae
- app/src/motion-model.mjs: 9990dec4d7b82ff44d5305181149b98e850fb15ce3b5accba39ce628574db5d9
- 原始概念板: ceb0185b13376654ef9a43f0aa49bb0929f96518305fc75ab3d4e2c3efb8cc98
