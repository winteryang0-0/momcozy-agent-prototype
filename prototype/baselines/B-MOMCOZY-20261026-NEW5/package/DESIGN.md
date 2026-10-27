---
version: alpha
name: Momcozy proactive assistant — Material web
---

## Overview

移动 App。B方向，主动助手优先，一次突出一项可执行任务；无合适任务时安静。沿用用户提供的Google参考视觉和现有蓝灰基线。本轮恢复原有角色，压缩为任务状态辅助。无底部Dock，不混用iOS组件。会议规则、用户决策、设计推导和假设详见 DELIVERY.md。

## Colors

数值来自现有实现，是项目适配值，不宣称Pixel原生动态取色。

```yaml
colors:
  primary: "#2855c7"
  on-primary: "#ffffff"
  surface: "#ffffff"
  container: "#f0f4f9"
  on-surface: "#202124"
  secondary-text: "#555f6c"
  accent-container: "#c4e7ff"
  mint-container: "#c4eee6"
  outline: "#d6dce5"
  error: "#a92720"
```

深色由同文件中的系统偏好分支提供独立角色色。主题不使用粉色；角色保留几何，以蓝灰/青绿状态色适配本版。

## Typography

```yaml
typography:
  headline:
    fontFamily: "Roboto, Noto Sans SC, sans-serif"
    fontSize: 24px
    fontWeight: 400
    lineHeight: 1.5
  title:
    fontFamily: "Roboto, Noto Sans SC, sans-serif"
    fontSize: 20px
    fontWeight: 500
    lineHeight: 1.6
  body:
    fontFamily: "Roboto, Noto Sans SC, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.85
  label:
    fontFamily: "Roboto, Noto Sans SC, sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "Roboto, Noto Sans SC, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.8
```

输入正文16px；长昵称截断但资料页可编辑查看。页面不能通过禁止缩放解决溢出。字体回退不是Google Sans授权替代品。

## Layout

手机单列，桌面430px手机预览；<=600px填满可用视口。输入区固定在App底部，其上内容独立滚动。安全区和visualViewport处理键盘变化，真机行为仍需验收。摘要默认折叠，执行任务后压缩欢迎区，角色不占据主CTA位置。

```yaml
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  page-gutter: 24px
```

## Elevation & Depth

白底与蓝灰容器表达层级。普通内容卡不加阴影；弹层和手机预览使用局部阴影。模态dialog遮罩与背景inert由浏览器实现。

## Shapes

```yaml
rounded:
  field: 12px
  summary: 22px
  card: 28px
  sheet: 30px
  full: 9999px
```

字段、摘要和任务卡各自使用圆角角色，不把所有控件做同一种大胶囊。

## Components

```yaml
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    height: 48px
  task-card:
    backgroundColor: "{colors.container}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.card}"
    padding: 20px
  text-field:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.field}"
    height: 56px
  summary:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.summary}"
```

默认/按下/焦点/选中/禁用/错误各有明确反馈；错误含可读文字与恢复动作。焦点轮廓3px，不用颜色单独表达选中。语音通过文字、角色与核对表单共同反馈，只有真实保存后才出现成功。CSS动效180–280ms为项目推导；减少动态效果关闭非必要位移，3D角色也响应系统与应用设置。

右滑起点留出两侧24px系统手势区；>95px且纵偏<45px触发。标题拖动关闭弹层，取消回到原位。键盘/按钮均可替代手势。详情见 DELIVERY.md。

## Do's and Don'ts

- 使用CareEngine事实汇总，区分未知、未记录和明确零。
- 同一时刻只突出一个待办；有草稿时隐藏另一张任务卡。
- 成功状态必须来自数据写入结果，动画不得提交业务。
- 不把记录缺失当作健康异常，不把生日对应的观察任务当作发育评估。
- 不在界面暗示已具备后台推送、云同步、多人照护或真实模型服务。
- 不声称CSS适配为官方原生组件，也不声称未执行的用户测试已经通过。

手工检查token引用与唯一性完成；未运行可选上游design.md CLI。


### 2026-10-25 追加用户决策
首页左滑＝当日记录，右滑＝历史趋势，顶部按钮为等价入口。性别头像为蓝／绿／中性三种原创 SVG，性别选填。不增加 Dock。趋势图使用真实记录，不插值未记录日；完整区间模型待实现，详见 DELIVERY.md。

### Material Motion Surface V1.1 接入
新增 assets/material-motion.js，采用 S7 固定历史 spatial spring、Web effects 线性淡入；减少动画即时结算。表面层级与蓝/绿/紫/黄色业务类别映射详见 DELIVERY。正文不缩放，图表不虚构中间数值。首页鼠标/触屏横滑阈值更新为72px，替代旧95px。

### 2026-10-25 用户线框重构
方向：轻量照护任务界面，以 Material 低强调表面承载可选择的输入；首页单一主动任务，输入框上方三项浮动工具；左侧四项当日摘要与时间线，右侧日历和体重记录。数值使用原生 range 刻度、步进与快捷值，精确输入后置；不将未操作的范围值默认为事实。shadcn Skill 用于结构评审，当前无 React/shadcn 安装；遵循现有 HTML 运行约束。ui-taste 色彩数量默认让位于用户明确的业务分类四配色，未做陌生用户测试。

### 数据录入与演示数据规则
资料卡可点击并真实保存；手动表单直接保存；语音保留核对。显示正式App用语，功能未接入处仍如实说明。两周示例属于独立宝宝/独立标记，不覆盖用户数据。图表滚动区不触发页面左右导航。图表以量化刻度和原始记录追溯为主，不设育儿评分。

## 2026-10-25 本轮明确决策与状态契约
- 用户决策：保留基础页面；移除欢迎左右滑引导与日期右侧滑动文字；保留实际手势和顶栏图标替代入口。
- 用户决策：历史主卡改为每日日程，横向日期选择、按时序显示已录事件。下方保留两周统计、体重、日历。
- 用户决策：看便便增加独立拍摄入口。Web 使用 capture=environment 的原生文件采集；相机由系统/浏览器提供，不伪造授权或设备支持。取消不创建记录。
- 用户决策：新版 google-material-pixel 1.1.0；沿用 S7 历史弹簧参数。形态循环和 CSS 表面为项目适配，不称官方组件。
- 方法来源：reverse-interaction-design。未找到独立 duolinguo skill，没有竞品录屏；以下为 D 项目迁移设计：每步一组资料、图形选项、真实四步进度、返回/跳过/断点恢复、保存后进入主页。没有积分、连续签到或健康承诺。
- 首次进入→四步资料；输入即时本机保留→返回/刷新恢复；最终保存成功→切换到真实宝宝→主页。示例宝宝独立保留；用户记录不自动归入示例宝宝。权限末步只说明，实际使用再申请。
- M16 发送→本机规则整理→可取消→核对卡；取消清理回调。正常处理无强制650ms等待；延迟仅验证面板显式模拟。局部形态循环不表示真实AI服务。
- M17 保存→localStorage成功→带勾的“已记下”标记与回复入场。失败保留核对卡和错误；动画完成不改变数据。消息入场用default spatial，透明度160ms线性独立轨道；减少动态立即呈现。
- M05 外部业务收起摘要先取消弹簧；动画不能恢复过时展开状态。
- 运行后台暂停装饰循环，返回恢复；减少动态实时停止位移与循环。
- 附件 Baby_AI_Card_Requirements_V1(1).md 已读。本轮并未完成其全部扩展验收：真实哭声/图片分析、分析结果关联、亲喂计时、跨日睡眠分配仍后置，不以动画宣称实现。

## 本轮参考图细化（2026-10-25）

用户决策优先：加号仅拍照/录音文件；当日记录拥有悬浮四项记录Dock，首页仍无Dock；记一笔初始四项、向下滚动更多；Onboarding为覆盖整个App画面的独立流程，使用现有Three.js角色。截图125522明确替代上一轮日程列表，恢复日期×24小时网格，前后七天切换。截图125554提供体重曲线的布局参考。

实现：record-views.js负责图形模板，conversation.js保留事件/数据状态，refined-surfaces.css承载本轮变化。不迁移框架，不新增依赖。每日日程旧列表和专属样式删除；附件菜单不再复制记录入口；不可达的其他记录分支删除；自定义模板移到记一笔末尾。

Onboarding复用现有canvas节点：打开步骤前归还角色、渲染后移入全屏角色区，退出恢复首页。选择立即更新语料与角色状态；输入不依赖动画完成。权限末步按用途图文说明，实际操作才触发系统授权。

记录页Dock不随内容滚动；列表留底部112px空间。提交成功留在原记录/趋势上下文；保存失败恢复原表单并显示错误，同一记录ID重试。

图表点击事件或分组后查看真实记录；同小时多个非睡眠事件合并为计数点，点击查看全部。睡眠旧数据按结束时刻减已录时长展示，同日截断；跨午夜归属尚未升级。密集图表事件触控区域30px，是密集可视化的适配偏差，提供日期进入完整记录列表替代；不声明完全符合48dp标准。

体重按生日计算近似月龄（天数/30.4375）；未知生日用日期，不捏造月龄。五条百分位曲线来自WHO男女0–24月官方月度表；表间以折线连接，只显示参考线，不计算个体百分位或输出诊断。缺少性别时不展示参考线。超出24月只显示实际记录。界面/源码标记WHO，不冒充截图中的卫健委2025指南。

数据来源（核验2026-10-25）：
- https://www.who.int/tools/child-growth-standards/standards/weight-for-age
- https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/weight-for-age/wfa-boys-0-5-percentiles.pdf?sfvrsn=488e74e6_11
- https://www.who.int/docs/default-source/child-growth/child-growth-standards/indicators/weight-for-age/wfa-girls-0-5-percentiles.pdf

humanizer：删去采集页重复“本机/原型”措辞，不添加假分析状态。媒体关闭后释放资源、文件只用于当前采集界面；完整能力/保留说明集中在偏好与数据。上传入口为文件选择与播放，不等于连接远端服务。

## 当前优先基线：日程、首次引导与结构化观察（2026-10-25）

本节覆盖前文历史版本中“四步引导”“媒体仅预览”“历史主卡为日程列表”的描述。其余业务规则保留。

用户明确决策：当日记录以真实记录驱动的今日建议卡开场；七日选择与从早到晚的日程时间线放在当日记录；历史为可展开的紧凑日期×时段概览。快记首屏四项卡等比例缩小，记录类型有对应图标。删除宝宝采用可恢复移除，不删除记录。

用户明确决策：设置最下方可重置首次引导；参考上传的11张多邻国截图重构。观察/推导边界和逐控件契约详见 ONBOARDING-INTERACTION.md。延续 Material/Pixel 1.1.0 和原角色；没有多邻国专用 Skill，使用 reverse-interaction-design。源素材没有账号认证屏，当前未实现真实账号登录。

用户明确决策：媒体发送→AI形象处理→结构化回复；录音页展示同步形象；所有助手回复旁有当前角色。哭声为原因/依据/安抚三段；图片为状态/颜色形态特殊特征/解读/行动/关注。卡片支持查看材料、补充观察、快捷追问、失败重试、取消和刷新恢复。

事实边界：media-analysis.js 为显式模拟适配器，不调用模型。所有识别结果保持信息不足，不生成临床结论；用户补充与识别结果分开。10秒绿色仅为时长提示，不是录音有效性或医疗可靠性判定。补充回复为本地规则说明。照片/音频只在当前会话保留预览，最多5份；刷新后文字卡、来源信息和补充保留，媒体需重新添加。

状态与资源：permission→recording→stopped→processing→insufficient/error/cancelled；每阶段文字与角色同步。重复提交拒绝，AbortController拒收过期结果；实际保存失败不显示完成。头像复用原Three.js单渲染器；已完成回复采用静态缓存，新回复短暂回应后静止；后台/减少动态停止装饰动作。未接入流式模型token或真实上传进度。

来源：上述全部为本轮用户决策或项目实现推导；不能表述为会议医疗结论或Google官方业务流程。方法来自 google-material-pixel/processes.md、reverse-interaction-design 和 ui-ux-pro-max 的用户自主权、错误恢复、固定操作可达性规则。
