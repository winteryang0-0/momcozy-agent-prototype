# 轻跳与轻摇 · 离线关键帧核查

`render-keyframes.cjs` 使用 `@napi-rs/canvas` 执行当前 `assets/app.js`，导出轻跳、轻摇各四帧及两段动作总览图。运行时还核查逐帧定位、减少动态、两段动作循环、长时间切后台后的时间范围，以及角色图片迟到时能否保持用户已选择的动作。

在 PowerShell 中从项目根目录运行：

```powershell
$env:NODE_PATH = 'C:\Users\user\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
node 'design/2026-10-20-folded-assistant-motion/v0.4-pixel-motion-candidate/reviews/render-keyframes.cjs'
```

默认写入同目录的 `frames/`。可用 `--width 800 --height 580 --out <目录>` 指定画布尺寸和输出目录。现行输出为 `jump-00`、`jump-apex-47`、`jump-landing-82`、`jump-100`、`sway-00`、`sway-apex-30`、`sway-opposite-70`、`sway-100` 与 `motion-overview`。

脚本使用替身 DOM 和动画时钟，不启动浏览器；真实页面的按钮、滑杆、视口和播放流畅度仍需浏览器复核。
