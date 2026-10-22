# AI-1.1 莓色留白候选

日期：2026-10-20。状态：供用户评审，未冻结。此分支独立于 AI-1.0、prototype/current；不会覆盖原有原型。

## 打开与文件

- `index.html` + `assets/`：可维护的多文件原型。
- `Momcozy-final.html`：已内联 CSS、JS 和 PNG 的单文件交付。
- 本次运行验证使用 `node preview.cjs`，地址为 `http://127.0.0.1:4194/#/assistant`。单文件也已通过本地 HTTP 加载并检查交互；该浏览器的 `file://` 直开被安全策略阻止，未宣称双击运行已验证。
- 原型使用本地浏览器存储。设置面板可切换明亮／夜间、减少透明度、模拟异常和重置本版数据；本分支使用独立存储键 `momcozy-ai-first-1.1`。

## 本轮可评审的设计差异

| 项目 | AI-1.1 候选 |
| --- | --- |
| 主页面 | 进入 `#/assistant`；顶部左侧个人入口、右侧快速静音；当天建议解释本机资料或记录依据 |
| 会话 | 一条跨日持续的对话；不展示新建和历史对话入口 |
| 对话输入 | 默认 60 px 单行外框、48 px 文字区域；多行输入随内容增长，文字区最高 112 px；清空草稿后收回 |
| AI 页 Dock | 输入框上方的 56 px 情境切换控件，仅 Today／记录，图标文字横排 |
| 次级页 Dock | Today／记录均保留 Momcozy AI 返回入口及另一个次级页入口 |
| 短屏记录页 | 320×568 保留顶部加号记录入口，隐藏与 Dock 相挤的重复底部按钮 |
| Today | 展示当天行动建议和记录概况，无快捷功能入口 |
| 视觉 | 使用 CS-0.5「莓色留白」候选的背景、主卡、任务类别色、玻璃控件和夜间／减少透明度状态 |

本候选的两项 Dock 是会话情境切换控件。Material 3 的标准 Navigation bar 要求三至五个主目的地，因此不把此实现称为该标准组件。次级页保留 AI 返回入口是本项目的产品判断，需通过用户任务测试。

## 参考与迁移边界

| 来源 | 可核实信息 | 本候选的取舍 |
| --- | --- | --- |
| [CS-0.5 莓色留白](../../../design/2026-10-20-semantic-style/CS-0.5-testboards/STYLE_SPEC.md) | 深莓主卡、收敛玻璃、任务颜色连续性；仍是待测风格板 | 迁移为原型视觉 token 与类别标记，不冒称正式品牌色 |
| [Huckleberry Berry 官方页](https://huckleberrycare.com/product/berry) | 对话利用家庭信息和照护记录，提供个性化指导、记录与近期概况 | 参考“对话 + 记录上下文”，不复制未核实的 Dock 布局 |
| [Flo 官方产品页](https://flo.health/product-tour/tracking-cycle) | 记录感受与症状，提供阶段解释与预测 | 参考“今日解释 + 可回看记录”的职责分离，不移植生理周期规则 |
| [Clue 官方帮助](https://support.helloclue.com/hc/en-us/articles/29049139459101-How-to-track-cycle-symptoms-and-experiences) | Track／Calendar View 可按日期与类别记录 | 参考独立日志的可回看路径，不声称界面形式相同 |
| [Material 3 导航规范](https://m3.material.io/components/navigation-bar/guidelines) | 标准导航栏用于三至五个目的地，含图标与标签 | 两项 Dock 作为项目自定义情境切换；不声称规范符合性 |

公开资料于 2026-10-20 核对。竞品页能证明描述的功能与导航原则，不能证明当前 App 版本的精确像素、页面排布或转化效果。

## 评审与限制

截图与可复核材料见 `evidence/manifest.json`；运行记录见 `qa-candidate.json`。AI 建议、AI 回复、记录保存与同步反馈均为本地模拟；不连接真实模型、医疗服务、麦克风、设备或云端。浏览器截图为桌面环境的移动视口模拟，未实测实体手机软键盘与辅助技术。正式品牌 token、建议逻辑来源以及旧版多会话数据迁移策略仍需确定。
