# 莓色留白高保真原型 · 文件交付与静态复核

日期：2026-10-20。版本：`berry-poise-01`。状态：**候选，未冻结；文件已交付，视觉与交互运行验收未通过。**

## 本轮范围与来源

- 用户要求将当前高保真原型整体切换为工作组中的「莓色留白」，保留原型架构，并先完成文件交付。
- 风格源：`design/2026-10-20-semantic-style/CS-0.5-testboards/berry.html` 与同目录 `STYLE_SPEC.md`、`assets/board.css`、`assets/board.js`。来源文件 SHA-256 分别为 `c7fc177614dd01f4381343485e1b3f970550a4a11b02971db867268423e6b55f`、`80dcae15baacd0ecd8a9529dd6f545641cd123dba8205d7718d50622221c0d6b`、`93eb29f10ae06e2f24b9bace951a89780848f0cd4cd9144167c45d1c66d79dd7`、`d68bad195c2dc7fb6fdcb7ff6866935b18bd790b6a2518fec3e51452129dfce0`；已逐项与 `design.json` 记录核对。
- 需求源 `sources/revision-14-requirements.json` SHA-256 为 `d389373557d9352e96b03edcc9c91c9e6d6f2ab17cb39509f3c3a9945febaaae`，与设计账本一致。
- 风格板 CS-0.5 是未冻结候选，未给出夜间规范。夜间配色和辅助设置是当前原型的延展，不能称为风格板原样复刻；莓色值不代表官方品牌 token。

## 已交付文件与改动

- 维护入口 `index.html` 加载 `assets/style.css` 与新的 `assets/berry.css`；后者包含莓色留白主色、留白、克制玻璃、任务类别色、夜间和减少透明度规则。页面主题色与标题同步更新。
- `assets/app.js` 给记录行、记录类型菜单、表单标题和任务卡增加只供呈现的 `data-category`。喂养映射 `feed`，尿布映射 `diaper`，哭闹专项映射 `crying`；吸奶及通用“记一笔”保持中性。现有 `data-task` 点击入口不变，未用类别标记触发任务。
- `design.json` 的视觉来源与 token 已改为莓色留白，项目仍标记 `draft`。`build-standalone.cjs`、`preview.cjs`、`build-manifest.cjs` 已使用新样式；`Momcozy-final.html` 已重新生成，并内嵌两层 CSS、四段脚本和形象 PNG。`README.txt` 与 `IMPLEMENTATION.txt` 说明本轮版本身份。
- 切换前的 32 文件完整快照保存在 `prototype/versions/bloom-glass-01/`，该版 `node build-manifest.cjs --check` 通过。当前运行入口已不引用 `bloom.css`；历史评审和旧截图保留作历史证据。

## 架构及静态校验

与上一版逐项比较：`design.json.source`、`framework`、`mapping`、`tests`、`pending_decisions` 相同；业务 HTML 主体相同；基础 `style.css`、`icons.js`、`motion-model.js`、`companion.js` 和 PNG 字节相同。架构仍为 **5 页面、17 控件、35 动作、34 状态、14 流程、3 视口**。`app.js` 差异只包含类别标记及其映射；静态点击代理未读取 `data-category`。

已执行：7 个 JavaScript 文件的 `node --check`；`design.json` 与 `berry.css` 33 个新定义 token 值比对一致，另有沿用基础 CSS 的 `--gutter`；来源 SHA-256 比对；单文件中 CSS、四段脚本、PNG base64 的逐字节一致性及脚本语法检查；检查单文件没有 `assets/` 或 HTTP(S) 运行资源引用。构建后的单文件 SHA-256 为 `14fa74be83758379082a02598bd51450d04034cfff0159e7e0aa36f21d76a3d7`。最终包的文件级散列以同目录上方的 `file-manifest.json` 为准。

设计 guard 实际执行 `check prototype/current --baseline HOME-0.1`，返回 `Baseline ID must be B plus letters/digits/hyphens`。历史候选没有合法 B-ID 冻结凭据，且动态 DOM 未完整适配该静态 guard；不能把本轮称为 guard 通过或正式设计冻结。

## 协同审查与边界

- **视觉实现**：独立子 Agent 根据 CS-0.5 风格板编写 `berry.css`，覆盖深莓焦点卡、实体浅色面、四种任务色及克制玻璃。静态样式完成；没有本轮真实截图，视觉判定为 `unavailable`。
- **一致性**：独立架构审查与主 Agent 静态复核确认业务结构和源文件未变；仅能给出 `static-only`，不能推断所有点击、状态和视口均运行通过。
- **交互挑战审查**：独立子 Agent 确认新增 `data-category` 未与点击代理的 `data-task` 冲突，任务类别色与保存/失败/离线状态色分离。发现深色 iOS 无 `backdrop-filter` 时实体兜底优先级不足；已增强 `@supports not` 的深色选择器。记录详情弹层仍以通用实体面展示，保留记录类型文字，类别色只在入口、列表、任务卡和表单标题连续。
- **视觉运行限制**：尝试读取用户当前已打开的 `file://` 原型标签时，浏览器工具明确拒绝该协议，并禁止通过其他页面入口或浏览器通道绕过。故未取得莓色版截图，也未声明 `file://`、HTTP、夜间、焦点或视口的实际浏览器通过。此前花瓣玻璃截图只证明旧稿；本版需要独立的新截图与操作记录。用户已要求先完成文件交付。

## 下次视觉复核矩阵

按当前 `Momcozy-final.html` 的散列重开并记录：Today 的常规、空、错误状态；记录列表与记录表单；AI 欢迎、会话任务卡及保存结果；我的与引导页。至少检查设计账本的 3 个视口，并单独检查夜间、iOS/Android 表达、减少透明度和动效、键盘焦点、Dock 遮挡与弹层滚动。实际完成后将截图、浏览器/协议/时间/视口、操作路径和结果附到新的评审，不沿用旧版截图结论。

## 使用

可先打开 `Momcozy-final.html` 查看单文件版，或保持目录结构打开 `index.html`。本版数据与响应为模拟；是否能在具体浏览器以 `file://` 双击运行尚未验证。开发预览脚本 `node preview.cjs` 仅在本机 `127.0.0.1:4192` 提供维护入口，端口可用时适用。历史版位于 `prototype/versions/bloom-glass-01/`。当前候选供 Wentao 视觉确认；确认前不冻结设计基线。
