# Momcozy 工程化独立候选 1.0

状态：draft。以 R27 高保真原型为起点，继承其页面、信息顺序、莓色留白样式和交互含义。本目录可独立修改，不写入 prototype/current。

## 打开与修改

- 双击 Momcozy-final.html：使用自包含单文件预览。
- 双击 index.html：直接预览分离的 CSS 和 JavaScript 源码，适合快速修改。
- 修改后运行 node build-standalone.cjs，再运行 node verify.cjs。两条命令仅使用 Node.js 内置模块，不需要安装依赖。
- 可选：运行 node preview.cjs，命令会打印本机预览地址；MOMCOZY_PREVIEW_PORT 可指定端口。

首次打开会进入资料录入。此分支使用独立的 momcozy-engineering-1.0 浏览器存储命名空间，不自动读取或迁移 prototype/current 的记录。原型内的重置操作只清理此分支的三个存储键。

## 项目结构

| 文件或目录 | 作用 |
| --- | --- |
| index.html | 可直接打开的分离源码入口，决定 CSS 和脚本加载顺序 |
| assets/app/ | 按职责拆分的应用逻辑；00 至 70 按 index.html 顺序加载 |
| assets/*.css | 继承 R27 的莓色留白样式，顺序保持不变 |
| build-standalone.cjs | 从 index.html 自动读取资源并生成自包含 HTML |
| verify.cjs | 检查构建一致性、脚本语法、资源、来源快照和页面标记 |
| branch.json | 分支身份、来源摘要与独立存储键 |
| design.json | R27 框架与规范的分支候选账本，未作为新基线冻结 |
| upstream-baseline/ | R27 上游基线快照与收据存档；不是本分支的批准记录 |
| docs/ | 信息架构、工程问题和本轮验证边界 |

功能与交互调整先更新 docs/architecture.md 的差异项，再修改代码和 design.json，最后重建与复核。上游 R27 基线不在本分支中改写。

## 能力边界

记录保存在当前浏览器；聊天分析、设备连接、同步和部分素材输入仍有原型模拟。哭声和拍照任务会调用浏览器媒体能力，实际能否使用取决于浏览器和权限。此包不是生产服务。
