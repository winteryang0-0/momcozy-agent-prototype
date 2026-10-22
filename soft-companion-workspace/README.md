# 软石动画与相关设计框架 · 后续修改入口

整理日期：2026-10-20。此目录是当前 Momcozy Agent 工作区内的**可修改工作副本**。原目录保留作版本来源，后续改动以此目录为入口。

## 从哪里开始

| 内容 | 编辑入口 | 预览入口 | 当前状态 |
| --- | --- | --- | --- |
| 软石独立动画 | [`app/src/`](design/2026-10-19-soft-companion-motion/v0.1/app/src/)；动作状态见 [`state-spec.json`](design/2026-10-19-soft-companion-motion/v0.1/state-spec.json) | [`bundle/index.html`](design/2026-10-19-soft-companion-motion/v0.1/bundle/index.html) | v0.1 候选演示；源形象已选，动效方案未冻结 |
| 软石原始形象 | [`soft-companion-v0.1.png`](design/2026-10-19-ai-characters/soft-companion-v0.1.png) | 同文件 | 形象方向参考 |
| 形象探索与情绪来源 | [`ai-characters/`](design/2026-10-19-ai-characters/)、[`QO-1.0 情绪板`](design/2026-10-19-moodboards/QO-1.0-candidate/) | 各目录的对照与样张 | 历史视觉来源，供追溯 |
| FW-0.4 产品框架 | [`design.json`](design/2026-10-19-framework/FW-0.4-candidate/design.json)、[`FRAMEWORK.txt`](design/2026-10-19-framework/FW-0.4-candidate/FRAMEWORK.txt) | [`bundle/index.html`](design/2026-10-19-framework/FW-0.4-candidate/bundle/index.html) | 框架候选，未冻结；FW-0.1～0.3 一并保留，供生成脚本和版本比对 |
| HOME-1.0 后续架构 | [`design.json`](design/2026-10-19-home-ia/HOME-1.0/design.json) | [`index.html`](design/2026-10-19-home-ia/HOME-1.0/index.html) | 后续原型及评审来源 |
| 语义视觉风格 | [`CS-0.4`](design/2026-10-20-semantic-style/CS-0.4-testboards/index.html) 最新三方向测试板；[`CS-0.3 Bloom`](design/2026-10-20-semantic-style/CS-0.3-testboards/bloom.html) 为当前交互原型的实际样式来源 | 各目录的 `index.html` | 两者均为候选，未冻结；CS-0.1～0.3 保留版本链 |
| 早期 UI 风格 | [`QO-2.0`](design/2026-10-19-ui-style/QO-2.0-candidate/) | 目录内候选页 | HOME 原型的历史视觉来源 |
| 当前完整交互原型 | [`index.html`](prototype/current/index.html)、[`assets/`](prototype/current/assets/)；[`design.json`](prototype/current/design.json) | [`Momcozy-final.html`](prototype/current/Momcozy-final.html) | 花瓣玻璃候选，未冻结；软石已用于 Today、AI 页与 Dock |

## 版本与依赖关系

`FW-0.1～0.4` 是早期框架候选链。`HOME-1.0` 在此基础上演进；当前 `prototype/current` 是可继续修改的完整交互原型，视觉采用 `CS-0.3 Bloom`。`CS-0.4` 是更新的风格测试板，尚未应用于完整原型。

软石独立动画 `v0.1` 包含 15 个状态、7 条演示流程、表情贴图、React 源码与截图评审。当前完整原型另有软石集成代码，位于 `prototype/current/assets/companion.js`、`motion-model.js` 与 `soft-expressions.png`。修改独立动画**不会自动更新**完整原型；需要对照两处实现再接入。

## 后续修改建议

1. 调整软石形象、状态、节奏：从独立动画的 `app/src/`、`app/assets/` 与 `state-spec.json` 开始。
2. 调整页面责任、任务状态或流程：从 `prototype/current/design.json` 与 `prototype/current/assets/app.js` 开始，核对 FW-0.4 与 HOME-1.0 的来源记录。
3. 调整风格：以 `CS-0.3 Bloom` 的当前应用状态为起点，按需要参考 `CS-0.4` 的未冻结探索板。
4. 完成修改后更新分文件版和单文件交付版，并重新验证截图、交互状态、离线/权限/超时、减少动效与回退行为。

## 整理范围与验证

复制了上述设计框架、HOME 原型、风格板、当前交互原型、情绪板、形象探索与独立软石动效包；未复制动效 `node_modules/` 和 `dist/`，因为它们是依赖安装和构建产物。原包的源文件、独立 HTML、素材、规范、评审与版本元数据均保留。`source-integrity.json` 记录复制时的逐文件 SHA-256 与原位置，供后续区分原始副本和新增修改。

在新位置已通过软石 13 项状态/流程测试、FW-0.4 与当前完整原型的静态资源引用检查，以及 CS-0.4 风格板的本地校验。软石 Sites 打包测试需要先生成 `dist`；本机离线依赖缓存缺少 Vite tarball，且直接借用原目录依赖构建受到路径权限限制，因此**新位置的构建和浏览器画面未完成复测**。复制的独立 `bundle/index.html` 与完整原型交付页仍可作现有预览参考；其历史验证记录对应原目录版本。

本次整理仅确认文件可用作后续修改入口，不等于设计冻结、用户视觉确认或完整产品验收。AI、录音、分析、保存、同步和设备反馈仍按原型中的模拟边界理解。
