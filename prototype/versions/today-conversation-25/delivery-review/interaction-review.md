# 独立交互逻辑复审 · Revision 14

**结论：所审静态范围通过；未发现尚未修复的 major / blocker。**

执行者：`/root/review14_logic`。本评审未操作浏览器，也不构成正式冻结。

## 修复复核

- F01：妈妈资料具有空值选项；profile submit 不再清空 babies；onboardingBabiesToSave 在孕前/孕期保留已存宝宝。
- F02：旧资料入口日期 max 使用 profileToday()；生日无 required。
- F03-hidden-baby：validateOnboarding 在步骤 1/3 遍历 onboardingBabiesToSave 全量宝宝；不合法日期定位具体宝宝；含隐藏未来日期的纯逻辑测试通过。
- F04-record-resurrection：删除时清除 saveJob 并加入 deletedRecordIds；commitSave 与 commitInlineSave 均检查 tombstone；独立逻辑测试未复活、未重复新增。
- F05-task-top：startTask 将 task marker 插入 messages；renderTask 清空旧 task-slot 并按消息顺序渲染；scrollChatTask 定位特定 task-id。

## 新增会话记录检查

会话草稿与首页草稿分别保存在 task.drafts 与 drafts 中。会话任务 ID 随消息 marker 持久化；切换对话停止异步任务并增加 epoch；中断保存恢复为 failed，可沿原 ID 重试。未知结果核对复用原 ID，删除 tombstone 防止回执重新创建已删除记录。

取消草稿无法恢复的 minor 已在本轮复读后关闭：当前卡原位恢复，历史卡恢复到独立副本，其他任务在途时保持互斥。

## 独立纯逻辑验证

- 通过：birth 
- 通过：birth 2026-10-20
- 通过：birth 2027-01-01
- 通过：birth 2026-02-30
- 通过：birth 2024-02-29
- 通过：hidden baby validation includes baby 2
- 通过：pregnancy stage preserves existing babies
- 通过：deleted pending update cannot resurrect record
- 通过：inline save repeated confirm is idempotent
- 通过：inline deleted receipt cannot resurrect record
- 通过：timeline reload migration preserves chronology without duplication

## 证据与限制

- 此 pass 仅限所审静态范围与列明的纯逻辑测试，不是正式冻结或全产品 ready。
- 浏览器端焦点、滚动、表单原生有效性及存储恢复须结合主代理的运行报告。
- 历史旧版任务缺少消息位置时，迁移追加未引用卡片；无法凭缺失数据重建原始时间点。
- 真实模型、硬件、麦克风、相机、账户及云端并未接入；相关真实业务边界不在本原型验证范围。
- 未获得完整现行场景账本，因此 ledger_hash 为 null，不宣称全部需求覆盖。

源文件 SHA-256、主代理运行结果与精确发现字段见同目录 interaction-review.json。

## 最终运行补证与关闭结论

**F01–F05 在列明的复现路径上确认关闭。** 本评审人未操作浏览器；以下为主代理 `/root` 提供的 `observed_runtime`，并与独立静态审阅结果对照。最终 app.js SHA-256 与本审阅版本一致：`8d93236babb1570dbeba64bbcf3a403c57320cfad811f5a9a0e68ebe842f5f19`。

- F01：空阶段两宝宝完成→旧妈妈资料显示暂不填写→直接保存→宝宝1仍为2026-10-01，Today仍显示共2宝宝。
- F02：旧宝宝资料 max=2026-10-20、required=false；保存当天2026-10-20后刷新仍为当天。
- F03：宝宝数量2→1→2且停在宝宝1；继续时自动定位宝宝2并提示不得晚于今天；修正日期后可以完成。
- F04：原会话保存101ml→全局编辑130ml结果未知→删除原101ml→重开记一笔显示类型菜单，不再出现旧核对请求，Today为空。
- F05：长对话后关键词便便卡 top=185..578，聊天视口96..594；记录/哭声/长消息/便便顺序完整且刷新保持。
- CHAT-RECORD-ISOLATION：会话101ml与全局88ml草稿隔离；会话刷新恢复。
- CHAT-RECORD-UNKNOWN：未知状态刷新后核对95ml仅形成一条记录。
- CHAT-RECORD-FAILURE：保存125ml失败后重试成功。
- CHAT-RECORD-CANCEL：取消125ml草稿后恢复仍为125ml。
- CHAT-RECORD-INTERRUPT：保存110ml期间立即新对话→历史恢复显示未保存，返回草稿仍为110ml。

该结论不扩展到完整状态/视口矩阵、正式冻结、全产品 ready 或 file:// 验证。配套运行记录由主代理写入 runtime-checks.json。
