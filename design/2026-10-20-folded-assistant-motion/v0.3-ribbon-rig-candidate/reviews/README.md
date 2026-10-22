# 离线关键帧核查

`render-keyframes.cjs` 使用 `@napi-rs/canvas` 直接执行当前 `assets/app.js`，输出 26 张图片：成形 13 帧、折翼内收 8 帧、轻跳与轻摇峰值、正面原图、头部中间材质参考及动作总览。

在 PowerShell 中从项目根目录运行：

```powershell
$env:NODE_PATH = 'C:\Users\user\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
node 'design/2026-10-20-folded-assistant-motion/v0.3-ribbon-rig-candidate/reviews/render-keyframes.cjs'
```

默认输出到同目录的 `frames/`。可用 `--width 800 --height 580 --out <目录>` 指定画布尺寸和输出目录。帧图使用接近预览窗的暖白背景，角色、折带及动作均由原始脚本绘制。

脚本提供最小替身 DOM 和 `requestAnimationFrame` 时钟，不启动浏览器；角色 PNG 先完成解码再触发载入事件。它按播放时钟抵达指定时间，另检查逐帧定位、减少动态终帧和成形往返循环。替身 DOM 检查不能验证真实页面的按钮、滑杆或 CSS 布局；画面仍需与浏览器预览交叉检查。`clap-contact-candidate` 是早期试验保留的文件名，不代表已实现可信拍手。
