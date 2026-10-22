# 2026-10-22 初始工程分支核验

## 静态结果

- R27 来源单文件 SHA-256：7d3bebe5676a09cd3dd2d744fb9b3ae7e31c2844ff702af5aaaccb45afda4676。
- 原主脚本 SHA-256：a20e5cbc0dd11684c8e72bc00412510abb709e5a655f1f46e927afb6183c86e3；拆分时拼接字节与原脚本完全相同，之后仅替换分支存储键。
- 将分支存储键和 HTML 入口标签还原后，主脚本及 index.html 与 R27 逐字节相同；其他运行资产与 R27 的 SHA-256 全部相同。
- 构建后独立单文件 SHA-256：6d92641563bfd0ff239302f2f9a7ce283c37bb36f8af68f95fe1f4fbab4069a8。
- node verify.cjs：10 份 CSS、11 份 JavaScript、24 个运行文件、11 份继承需求快照、5 个静态页面标记校验通过。8 个应用脚本单独通过语法检查。
- 分支 design.json 的 framework、system、source 与上游基线快照相同；上游 receipt 的快照文件 SHA-256、框架摘要与存档内容相符。上游批准记录仅作来源存档，本分支未获新的设计冻结确认。

## 未覆盖

浏览器工具拒绝打开 file:// 页面，原因为当前浏览器 URL 策略只允许 http: 和 https:。因此本轮没有实际点击、截图、视口或控制台证据，也未给出视觉及交互通过结论。未改用其他浏览器路径绕过该策略。

上游项目的 design_guard.py check 能核对基线，但因上游目录没有该脚本要求的 bundle/index.html 和 bundle/README.txt，返回 bundle_missing；不能将它算作交付通过。

下一轮若获得正常的本地浏览器测试条件，应按 architecture.md 的回归范围验证 file:// 入口，再绑定最终文件摘要保存截图和操作记录。
