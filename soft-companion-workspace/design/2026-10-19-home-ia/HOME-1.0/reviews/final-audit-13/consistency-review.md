# HOME-1.0 独立一致性审查

- 角色：consistency；审查人：`/root/final_consistency`；结论：**static-only，需修订**。
- 材料绑定：`material-snapshot.json` SHA-256 `a537b160813c3d2e4c5917ecc6ad4c1420d1e0ee44836c8a54f25f72caa86d3c`。Node 原始字节复核 12/12 项大小和 SHA 一致。该摘要绑定本次快照，不冒称协议中的正式交付总摘要。
- 未操作浏览器，未作完整运行或视觉通过声明；仅写入本评审的 JSON/Markdown。

## 需要处理的产品问题

1. **Major：阶段留空后，旧妈妈资料表单可能清除宝宝资料。** `assets/app.js:226,301,362`。四步录入允许妈妈阶段为空，旧表单下拉只有孕前/孕期/产后，空值会默认首项孕前。用户只改关注点或直接保存，也会触发清空 `birth/birthWeeks/babies`。最小修复：保留“稍后选择”空选项，不因更新阶段或关注点自动删除宝宝档案；共用资料模型。已请求主 Agent 浏览器复现。
2. **Major：两个生日编辑入口校验冲突。** `assets/app.js:12,102,153,301`。新录入允许本机今天，旧宝宝资料限制固定演示日 2026-10-19，并把生日改成必填。录入 2026-10-20 后，从旧入口仅修改称呼也不能保存；未填生日的用户同样被迫填写。最小修复：统一当前日期上限和选填规则。已请求主 Agent 浏览器复现。

## 文档与正式交付门槛

3. **Major（正式交付门槛）：当前需求与行为账本不完整。** `design.json` 缺 onboarding 页面，actions/tests 为空，flow 与需求/状态没有实质映射；`sources/requirements.json:49` 仍排除首次引导。实际运行 `hw-design-workflow/scripts/design_guard.py check . --baseline HOME-0.1` 得到 `passed=false / Baseline ID must be B plus letters/digits/hyphens`，未进入后续完整校验。旧 HOME-0.1 本身明确是候选，并非冻结基线。应整理当前候选差异和测试账本，再对真实确认的新候选建立合法基线，不能修造旧确认。此问题不等于最新用户授权无效，也不阻止继续评审可交互候选。
4. **Minor：当前实现说明与历史说明混淆。** `IMPLEMENTATION.txt:7,22,24` 仍写四 Dock、未包含多宝宝、对话任务刷新清除，而 README 后续版本与实际代码已更新。`design.json mapping.detail` 指向不存在的根 `ARCHITECTURE.txt`；实际路径位于历史基线目录。STYLE_SPEC 静止形象规则应标记被本会话授权的循环更新覆盖。最小修复是增加当前摘要、明确 supersedes，并修正引用路径。

## 已核实与不误报范围

- 三项 Dock（Today 太阳 / momcozy AI / 记录）、Today 中“我的”入口、共用头像、四段 1.8 秒循环，符合最新授权。
- 固定 composer/独立聊天滚动、历史新建/重命名/搜索/删除确认、统一 app 内弹窗、完成消息与结束态任务三项追加入口，均有对应代码和事件路径。真实滚动/焦点/遮挡效果留给主 Agent 运行证据。
- 四步录入、仅妈妈显示选填阶段、纵向数字滚轮首项“暂不填”、妈妈宝宝同一步与多宝宝切换，静态实现可定位。没有将这些授权变更误报为旧架构漂移。
- 5 个 HTML 本地依赖和运行资产均存在；运行源码静态扫描没有远程 URL、fetch 或 XMLHttpRequest。两条需求 provenance 路径存在且 SHA 一致。没有宣称已观察运行网络或双击打开。
- AI/采集/云同步等模拟、Today 只用宝宝 1、未定义的睡眠/身体/生长录入、真机与原生能力未验收，属于已声明边界；未擅自扩大本轮范围。
- PowerShell 对 icons.js 出现异常原始读取；Node 独立复核完全匹配，已排除伪变更，不列为产品缺陷。

## 主任务运行证据补充

主 Agent `/root` 已实际复现上述两项产品问题，审查者只读查看并核验了三张截图的哈希：

- `screenshots/06-issue-old-profile-date.jpg`：2026/10/20 输入被原生校验提示“指定的值不得晚于 2026/10/19”拦截。
- `screenshots/07-issue-empty-stage-default.jpg`：阶段留空完成录入后，旧妈妈资料默认显示孕前。
- `screenshots/08-issue-baby-cleared.jpg`：不改字段保存后的资料显示已失去宝宝天数背景。生日字段实际清空由主 Agent 运行观察和源代码共同确认，截图本身不被当作 localStorage 值的证明。

两项问题均已从静态风险升级为实际复现问题；本审查仍保留 static-only 身份，不冒称自己重跑浏览器。**存在资料无提示丢失风险，本次不能冻结。**

详细机器记录见 `consistency-review.json`。本次不支持“全量需求覆盖、静态 guard 通过、正式冻结交付”结论。
