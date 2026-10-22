# 常驻照护入口候选交付（R23）

日期：2026-10-21。状态：**可交互候选，待用户审阅，未冻结**。主文件为 [Momcozy-final.html](../../Momcozy-final.html)，模块化入口为 [index.html](../../index.html)；打开方式及能力边界见 [README.txt](../../README.txt)。本轮依据 [R23 需求记录](../../sources/conversation-shortcuts-23-requirements.json)，沿用上一版 [R22 完整候选](../../../versions/secondary-sheet-motion-22/)。

## 修改

1. 「记一笔」「听哭闹」「看便便」成为输入框上方的常驻横排。默认高 29px，输入框外框高 58px；欢迎、连续对话及任务期间均显示。
2. 移除欢迎内容、AI 回复、记录回执与照护终态卡片里的重复建议入口。卡片自身的类型选择、采集、保存、重试、取消与回执保留。
3. 常驻入口仍走原有任务点击代理；进行中任务不会被另一项入口覆盖。页面路由、当日记录、今日建议、资料字段和 R22 二级弹窗动效保持原有行为。

## 验证

[浏览器证据](browser-evidence.json)绑定单文件 SHA-256 `a8e5650f92b8bbb3b60ec05ac78322f16c3b4f5de514d4f13a4ce75f48f2c5df`。Chrome 155 headless 在 `file://` 下执行 **12 组检查、8 张截图、零页面与控制台错误**；覆盖浅色 390×844、夜间 360×640、减少动效、键盘焦点、记录保存、采集失败、任务互斥、刷新及模块版。截图判断见 [视觉自审](visual-review.md)，来源、框架与流程对照见 [一致性自审](consistency-review.md)。

`design_guard.py` 的 `validate_design` 内部引用校验为 0 错误；上一 R22 快照文件清单 `--check` 为 167 文件。本轮最终静态摘要及文件数见 [file-manifest.json](../../file-manifest.json)。当前没有经用户确认的合法 B-ID 冻结基线，也未完成独立双角色评审，因此不声明完整基线 `check` 或正式冻结通过。

真机触控、系统软键盘、真实系统权限弹窗和屏幕阅读器未在本轮验收。原型的 AI 回复及识别能力仍为模拟，浏览器决定设备权限。
