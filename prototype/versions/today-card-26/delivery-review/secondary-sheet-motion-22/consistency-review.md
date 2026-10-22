# R22 设计与实现一致性独立评审

## 身份、范围与结论

- `role=consistency`；评审者：`/root/r22_consistency_review`；`independent=true`。评审时间：2026-10-21。
- `baseline_id=null`。R22 是**未冻结候选**；[设计账本](../../design.json)的 `project.stage=draft`，没有可追溯的当前合法 B-ID。旧 HOME-0.1 快照不作为本轮已批准基线。本评审只以[上一完整候选 R21](../../../versions/profile-field-ranges-21/)对照本轮用户授权的[两项变更](../../sources/secondary-sheet-motion-22-requirements.json)，不声明 `design_guard.py check` 或正式交付通过。
- **局部结论**：R22 的「我的」标题、共用二级弹窗入场与减少动效逻辑，与本轮要求一致；未发现 `blocker` 或功能/架构类 `major`。页面、导航、资料字段及原业务处理逻辑未见本轮漂移。原文件清单版本问题已复验关闭；更新本报告后仍须重建最终清单并再执行一次 `--check`。

## 材料与哈希

| 材料 | SHA-256 / 检查结果 |
| --- | --- |
| [R22 需求记录](../../sources/secondary-sheet-motion-22-requirements.json) | `ab8e2d6b756aea0654a0b23be393903aa39b250d0f4775854821d5010e92c28b`；与 `design.json.source.sha256` 相同 |
| [当前单文件](../../Momcozy-final.html) | `f556bbafad4e0ebdcb3302ba28513ab7ba63a5d5775ff2f905a1516be798e529`；与[浏览器证据](browser-evidence.json)相同 |
| [当前模块化入口](../../index.html) | `dd00cccf30c16d79709c96f690e48614687cf90ece96f0c65d377644ad799d9b`；与浏览器证据相同 |
| [R21 单文件](../../../versions/profile-field-ranges-21/Momcozy-final.html) | `e650f5084b6cb1cdee11cca55f87aa360ff213b434586732fe03641ed814f20f`；与浏览器证据的旧版摘要相同 |
| [截图](screenshots/) | 10 张 PNG 均存在，逐项 SHA-256 与 `browser-evidence.json` 一致 |

我按 [`build-standalone.cjs`](../../build-standalone.cjs) 的读取与嵌入规则做了**只读重构**：当前单文件与 `index.html`、六份 CSS、四份 JS 和 sprite 生成结果逐字节一致，且无远程运行资源引用。原有 R21 快照的 `build-manifest.cjs --check` 返回 `Manifest verified: 150 files`。

## R21 → R22 范围核对

| 核对项 | 证据与差异 | 判断 |
| --- | --- | --- |
| 页面、导航与区域 | `framework.pages` 四项、`viewports` 原样；`index.html` 相比 R21 仅把记录页右上按钮 `aria-label` 从「打开我的与二级功能」改为「打开我的」。`PAGE-home`、`PAGE-records`、`PAGE-mine`、`PAGE-onboarding` 的静态节点与路由未改。 | 符合“不改现有架构”；`PAGE-mine` 未被新弹窗替代。 |
| 控件、动作、状态、流程 | `framework.controls` 仍 32、`actions` 仍 66、`states` 仍 48、`flows` 仍 34。唯一控件职责文字更正为「我的」；动作和流程仅追加 R22 需求 ID，既有起止状态、目标页与动作序列未改。 | 语义变化限于标题和新动效要求；导航/返回路径未见漂移。 |
| 资料字段与业务逻辑 | R21→R22 的 [`assets/app.js`](../../assets/app.js) 差异仅涉及共享 `openSheet` 的动效状态、`profileMenu()` 标题；原 [`profile-ranges-21.css`](../../assets/profile-ranges-21.css) 及其余功能资产哈希未变。 | 年龄、分娩次数、出生孕周规则及记录/对话处理逻辑未因本轮更改。此项是差异审查，非重跑 R21 全部 54 个验收用例。 |
| 视觉规范 | `system.tokens`、`system.components` 原样；[`assets/style.css`](../../assets/style.css) 只对共享 `#sheet` 增加遮罩首次渐入、400 ms 面板上移动画并去除面板透明度动画。`design.json.system.motion` 记录相同规则。 | 没有新增页面或组件职责；动效规范属于本轮授权差异。 |

## R22 需求映射与交互复核

| 需求 / 关联 ID | 实现、运行证据与判断 |
| --- | --- |
| `R22-01` → `RECORDS-profile-menu`、`ACT-profile-menu-open`、`FLOW-records-profile-menu`、`STATE-records-menu`、`T22-01-my-title` | [`profileMenu()`](../../assets/app.js) 将弹窗标题改为精确的「我的」，原分组及入口数组未改；记录页按钮无障碍名称同步更正。[浏览器记录](browser-evidence.json)及 [01 截图](screenshots/01-my-menu-390.png)显示标题；从该菜单进入妈妈资料的操作成功。 |
| `R22-02` → `FLOW-records-profile-menu`、`FLOW-profile`、`FLOW-journal-create`、`FLOW-chat-material-menu`、`T22-02-*` | 所有现有 `#sheet` 内容由共享 `openSheet()` 打开；`kind` 或标题变化时重置并重放 `.sheet-panel` 上移，首次打开才让 `::before` 遮罩渐入。`sheet-rise` 从 `translate3d(0,100%,0)` 到 0，未改变面板不透明度。现成 29 帧记录显示「我的」顶部 `800→24 px`、妈妈资料子层 `800→159.3 px`，两者面板 opacity 全程 1；遮罩分别 `0→1` 与全程 1。记录选择→表单、对话加号→照片、设置、夜间短屏、桌面及模块化 `file://` 入口在现有 QA 中有运行断言；用户及系统减少动效时 `animationName=none`。 |
| 同一 `kind`/标题的状态刷新 | 我另外以 Chrome `155.0.8059.80`、`file://`、390×844 **独立操作当前单文件**：记录页「我的」→「我的设备」，待首次入场结束后点击「演示连接设备」。更新前后 `kind=devices`、标题「我的设备」；`data-motion=steady`、计算动画 `none`、面板 top 均 `254.421875 px`、遮罩 opacity 均 1；内容由未连接变为已连接，0 `pageerror`。50 ms 后动画仍为 `none`。该验证未生成或覆盖原 QA 截图、日志。它证明共享面板的同类刷新规则；`T22-02-nested-rise` 文本所写的“资料表单内修改状态”未逐字复跑。 |

静态账本检查：直接调用 `design_guard.py` 的 `validate_design`，来源摘要、43 项需求映射、页面/控件/动作/状态/流程引用和测试描述共 **0 错误**。这仅是内部引用检查；本包有 JavaScript 动态生成的控件与状态、无当前合法 B-ID，不把它表述为完整 `check` 通过。[独立视觉评审](visual-review.md)是对现有截图与帧记录的复核，视觉评审者未亲自重跑浏览器；本报告的浏览器实操只限上表“我的设备”同类刷新。

## 发现与待关闭项

| ID / 严重性 | 可复现问题、影响与建议 |
| --- | --- |
| `CONS-22-01` / `major`（交付完整性，`resolved`） | 初审时[文件清单](../../file-manifest.json)仍写 `revision=profile-field-ranges-21`，`node build-manifest.cjs --check` 报 `Manifest differs from current files`。主 Agent 重建后，本评审独立只读复跑同一命令，返回 **`Manifest verified: 167 files`**；清单现写 `revision=secondary-sheet-motion-22`、167 个文件，生成时间 `2026-10-21T07:15:36.956Z`，且当时包含本评审文件的散列。旧版清单问题据此关闭。本报告这次状态更新会改变该文件散列；主 Agent 须在此后再次生成最终清单并复验，才能声明最终文件清单与交付材料一致。 |

本轮没有未关闭的可复现 `blocker` 或 `major`；最终清单复验仍待本报告更新后完成。运行覆盖仍限所列浏览器样本：现成 QA 对其他 sheet kind 主要依据共享实现与抽样入口，不等于每一种弹窗、真机软键盘、屏幕阅读器或全部历史流程已重新验收。R22 用户审阅和具体候选确认仍是建立合法 B-ID 的前提。
