# R25 设计一致性独立评审

- **角色**：consistency；评审日期：2026-10-21。
- **结论**：R25 候选范围的一致性审查通过，迟到文字意图不会打断之后在现有卡片中的采集、填写与继续操作。评审报告修改前，`file-manifest.json` 已按 R25 重建为 226 项并独立逐项核验；本报告写入后须再次重建、复验最终清单。该结论仅适用于候选材料，不代表设计冻结或完整交付门槛已满足。
- **baseline_id**：无。项目 `design.json.project.stage=draft`，没有可追溯的合法 B-ID 与冻结 receipt。此评审不代表框架冻结，也不声称 `design_guard.py check` 已通过。
- **材料绑定**：R25 需求源 `sources/today-conversation-25-requirements.json` SHA-256 `83c8a6ed725edf2af7531312b54cde6b753f2142e45b26457e154da1f4783195`；`design.json` `705ed76f0160e6800dccad5aac8504b99dbe1c9cdabd3d4a0559c281664cb2fd`；单文件 `Momcozy-final.html` `d67ba97441749745ad321cb976b57bb19da4d6cf737578846f8fe4bb68d87636`。材料修改后本结论需重核。

## R25 需求与旧版关系

| 范围 | 来源、账本及实现核查 | 独立判断 |
| --- | --- | --- |
| R25-01 Today 展开卡 | `FLOW-today-expanded-reflow`、`STATE-home-advice-expanded`；`index.html` 增加展开控件标记及播报区域，`adviceWidget(cards,true)` 把提醒标题、说明、依据、左右控件置于内容卡，`renderDailyAdvice()` 改变折叠条状态。 | 独立 Chrome `file://` 操作中，展开后 `#compact-advice` 不显示，提醒标题在内容区出现；作者证据另覆盖切换、依据、收起和 360×640 夜间短屏。常驻对话入口仍在输入框上方。 |
| R25-02 连续触发 | `source.superseded` 仅替换 R23-03 与 R24-03 的“未完成任务阻止新任务”规则；R23 常驻入口与 R24 侧栏入口保留。旧 `T23-record-busy`、`T23-task-busy`、`T23-error-busy`、`T24-service-task` 的预期已改为新卡、旧卡暂停。`startTask()` 每次生成任务 ID，`parkCurrentTask()` 停止旧采集/计时并归档；`resumeTask()` 新建承接卡且令来源卡只读。`taskTriggerRevision` 在新任务触发及现有卡片的类型选择、表单输入、提交、继续、媒体采集等操作时递增；文字回复只在发送时修订号仍相同时自动开启意图任务。`T25-late-intent` 覆盖较新任务和现有卡片操作两种竞态。 | 独立操作从记录草稿切到哭声，再恢复旧记录：旧卡暂停，承接卡 ID 与来源 `resumedBy` 一致，草稿数值 90 保留。另独立复测从现有哭声卡发送“看便便”后开始收音，使权限请求保持待决；迟到回复到达时原哭声卡 ID、`starting` 状态均保留，历史卡未增加，且无 `pageerror`。作者证据另覆盖同类连点、侧栏切换、待权限/已采集媒体切换、迟到回复。未结束任务的新触发不再被互斥提示拦截。 |
| R25-03 保存与草稿归属 | `beginInlineSave(target)` 按任务 ID、固定 `requestId` 与 `conversationEpoch` 查找回写目标；`commitInlineSave(target)` 以记录 ID 更新或新增。切换会话时 `clearInlineSaveTimers(true)` 标未知，载入时把保存中改待核对；历史失败任务恢复后携带原记录/请求 ID。 | 独立操作中，承接记录卡提交后立刻启动便便，等待回执：便便仍是前台，历史记录卡变 success，记录列表仅有原请求对应一笔。作者证据另覆盖结果未知、刷新核对、失败编辑重试及旧卡只读。真实服务端幂等与跨端同步不在本地模拟能力内。 |

## 架构、证据与封包

- 对照 `prototype/versions/left-sidebar-24`：`framework.pages` 仍是 `#/home`、`#/records`、`#/mine`、`#/onboarding` 四条 hash 路由；七个 `NAV-sidebar-*` 控件 ID 全部保留，`assets/sidebar-24.css` 无差异。R25 只在首页对话区加入 Today 标记/样式，并改会话任务逻辑。R23/R24/R25 的 mapping 所引用页面、状态、FLOW、测试及 R25 FLOW 的 action ID 静态引用无缺项。
- 已审作者 `delivery-review/today-card-25/browser-evidence.json`：`material_sha256` 与现有单文件完全一致；9 张截图 SHA 均与文件相符，15 项检查有具体任务状态记录，`errors=[]`。我没有把作者的 15 项检查冒称为自己全部重跑。
- 独立使用 Chrome headless、390×844、`file://` 对现有单文件做无落盘复测：记录草稿→哭声→承接记录→保存中开启便便→历史卡回执、Today 展开，以及现有哭声卡操作对迟到文字意图的保护。浏览器无 `pageerror`，保存后仅一笔记录。`node --check assets/app.js` 通过。
- 模块版 `index.html` 引用的 13 个本地 CSS/JS 资源均存在；单文件无外部 CSS/JS 运行时引用。评审报告修改前，R25 `file-manifest.json` 标记 `today-conversation-25`，列出 226 项；独立逐项核对大小与 SHA-256，无不符或漏列，`node prototype/current/build-manifest.cjs --check` 通过。报告写入后清单须由主 Agent 最终重建并复验。

## 发现与边界

1. **major/resolved（本次材料），包完整性**：R25 清单已列 226 项，评审报告修改前独立逐项检查均匹配且无漏列，`build-manifest.cjs --check` 通过。报告写入导致清单摘要变化，须在最终封包时再次重建并复验；重建清单不等于补造冻结基线。
2. **未覆盖**：本次独立浏览器抽查未重跑每一条作者用例，也未验证真机麦克风/相机授权、音视频生命周期、真实服务端请求查询和跨端幂等。媒体暂停与刷新核对的结论来自当前代码及作者绑定材料的浏览器记录。
3. **冻结/guard 边界**：`hw-design-consistency` 的机械基线检查要求真实 B-ID。当前仅有 R25 用户授权候选及 R24 快照，不以快照目录或假 ID 冒充冻结批准；动态任务卡的静态 DOM 标记适配也不能仅凭账本 ID 宣称完成。

**复核结论**：R25 候选未发现授权范围内未关闭的重大导航、任务归属或迟到意图偏差。主 Agent 完成本报告后的最终清单重建与复验后，可将该候选提交用户审阅；若代码、设计或浏览器证据随后改变，应按新的单文件哈希重跑关键交互和视觉证据。当前无合法 B-ID，候选仍未冻结。
