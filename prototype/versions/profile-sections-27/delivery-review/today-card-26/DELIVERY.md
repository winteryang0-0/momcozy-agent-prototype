# R26 Today 卡与精简侧栏候选交付

日期：2026-10-21。状态：**可交互候选，待审阅，未冻结**。双击 [Momcozy-final.html](../../Momcozy-final.html) 可打开单文件；[index.html](../../index.html) 是同内容的模块化入口。使用与模拟能力见 [README.txt](../../README.txt)。

## 本轮差异

| 需求 | 可见结果 |
| --- | --- |
| R26-01 | 欢迎态与对话后展开的 Today 卡均移除「查看依据」入口与弹窗。 |
| R26-02 | 三枚页面指示点置于卡片底部居中，点选同步更新提醒。 |
| R26-03 | 移除卡片左右箭头；悬浮 Today 仍可收起并点击恢复。 |
| R26-04 | 左右滑动及键盘方向键在三条提醒之间循环，折叠恢复保留当前页。 |
| R26-05 | 侧栏暂时只保留「我的」「宝宝」「当日记录」，移除智能体服务及其入口；对话区常驻照护功能与记录页新建仍可用。 |
| R26-06 | 侧栏移除「照护空间」、推荐排序和附加说明，只显示三个主菜单标签。 |

需求源见 [today-card-26-requirements.json](../../sources/today-card-26-requirements.json)，页面、控件、动作与状态映射见 [design.json](../../design.json)，实现边界见 [IMPLEMENTATION.txt](../../IMPLEMENTATION.txt)。上一完整候选为 `prototype/versions/today-conversation-25/`，未覆盖。

## 验证与评审

- [浏览器记录](browser-evidence.json)：Google Chrome 155 headless，`file://` 单文件及模块版，12 组定向检查、11 张当前截图，页面与控制台错误均为零。覆盖 390×844 明亮、360×640 夜间短屏和 1280×720 桌面视口；含侧栏关闭、Escape、遮罩、宝宝资料保存重开与焦点回归。
- [交互复审](interaction-review.md)：R26-01～06 的目标动作与回归边界。
- [独立视觉复审](visual-review.md)：按当前截图评估 Today 卡与侧栏，结论限于已截图的状态；夜间 2× 文字横线列为 minor 待确认。
- [独立一致性复审](consistency-review.md)：核对需求、页面职责、历史候选差异及当前浏览器证据。
- `node --check assets/app.js` 通过。`design_guard.py` 的 `validate_design` 核对需求源摘要、引用及测试描述为 0 错误。正式 `check --baseline` 需真实用户确认的合法 B-ID，本候选没有该输入，因此不宣称设计冻结。
- 完整文件摘要见 [file-manifest.json](../../file-manifest.json)，定稿后运行 `node build-manifest.cjs --check` 核对。

真实 AI 识别、后台服务、同步、真机权限弹窗、手机软键盘及屏幕阅读器不在本轮验收范围。浏览器模拟的触摸和移动视口不等同于真机通过。
