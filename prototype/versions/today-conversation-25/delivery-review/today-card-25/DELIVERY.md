# R25 · Today 卡片与连续任务候选交付

日期：2026-10-21。状态：可审阅候选，尚无经用户确认的冻结 B-ID。

## 本轮变化

| 需求 | 页面与控件 | 已实现的交互 |
| --- | --- | --- |
| R25-01 | 首页悬浮 Today | 对话后折叠条保留 Today 和当前提醒；展开后提醒标题只在内容区出现一次。说明、依据、点位与左右切换集中在一张卡内，支持触摸滑动和键盘切换。 |
| R25-02 | 常驻照护入口、文字意图、侧栏服务和任务卡 | 每次明确开启新任务均生成独立卡片，包括同类再次触发。旧卡按会话顺序显示暂停状态，可以从原卡继续并生成承接卡。迟到的文字意图不会覆盖较新的任务触发，也不会中断用户随后在现有卡片中的采集或填写。 |
| R25-03 | 会话记一笔 | 保存中可开启下一任务；回执仍更新所属旧卡。结果未明时沿用原请求和记录编号核对，历史草稿承接后原卡只读，避免同一草稿重复提交。 |

四条 hash 路由、左侧栏、记录页新建入口与莓色留白组件沿用上一候选。R23-03、R24-03 中阻止未结束任务再次触发的规则已由 R25-02/03 替换；其他入口职责保留。

## 文件与操作证据

- 打开 [Momcozy-final.html](../../Momcozy-final.html) 可直接审阅单文件原型；[index.html](../../index.html) 与 `assets/` 为相对资源版。使用方法见 [README.txt](../../README.txt)。
- 本轮需求、页面／控件／动作／状态映射分别见 [需求源](../../sources/today-conversation-25-requirements.json) 和 [design.json](../../design.json)，实现边界见 [IMPLEMENTATION.txt](../../IMPLEMENTATION.txt)。
- 执行 `node prototype/current/build-standalone.cjs`、`node prototype/current/delivery-review/today-card-25/qa-browser.cjs`。Google Chrome 155.0.8059.86 headless 在 `file://`、390×844 明亮与 360×640 夜间视口下完成 **15 项定向检查、9 张截图、零页面或控制台错误**；单文件 SHA-256 为 `d67ba97441749745ad321cb976b57bb19da4d6cf737578846f8fe4bb68d87636`。检查和逐图散列保存在 [browser-evidence.json](browser-evidence.json)；截图位于 [screenshots](screenshots)。
- 定向检查包括同类／跨类连续触发、旧草稿承接与单笔保存、后台保存与刷新核对、媒体权限等待及素材切换、较早文字意图与较新任务或现有卡操作的竞态、侧栏服务触发、Today 展开／切换／依据／收起以及模块版入口。
- `node --check` 对 `assets/app.js` 与本轮浏览器脚本通过。`design_guard.py` 的 `validate_design` 内部引用检查返回 0 错误。正式 baseline `check` 需要合法冻结 B-ID，本候选未执行该门槛。

## 评审与适用范围

[视觉评审](visual-review.md)、[设计一致性评审](consistency-review.md) 和 [交互复审](interaction-review.md) 分别记录材料绑定、独立判断及未覆盖范围。浏览器操作使用本地模拟数据；真实后台保存、跨设备同步和 AI 分析结果尚需产品与接口定义。真机触控、系统权限弹窗、软键盘和屏幕阅读器未在本轮验收。浏览器与静态检查结果用于审阅本候选，不代表设计冻结。
