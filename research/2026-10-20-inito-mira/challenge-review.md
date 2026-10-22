# 第二挑战人格评审：Inito 与 Mira 软件竞品研究

- 评审角色：`challenger`；评审者：独立子 Agent（未参与被审稿撰写）。
- 评审日期：2026-10-20；结论：`revise`。本稿可作为**待返修研究草案**，不能作为完整当前 App 页面基线或研发 PRD。
- 被审文件：`analysis.md` SHA-256 `C7D2CB392124314494B5C6A47252421155ECD467EAEC09947E7BD1AD4E3994D8`；`evidence.md` SHA-256 `967B04C9D4B7D3F1280A21CE8F51F9A1919D7C101CEA1D5E88F61C1D6164EFEE`。
- 方法：阅读两份全文，抽样打开 Inito I01–I03、Mira M01、M04、M07、M10–M11、M18–M19、M21、M23、M26 的官方网页。抽样核对代际、采样/同步、结果状态、图表、报告门槛、手工排卵覆盖、伴侣权限、模式和删除限制。没有实机、账号、App build 或固件；未逐条复核 27 个主张及 35 个来源，未做完整界面覆盖审计。

## 发现

### CR-01 · major · 核心设备比较轴缺少蓝牙来源

- **定位**：`analysis.md` §1「决策摘要」第 1 条、§4 M-P05「我的设备」；`evidence.md` CLM-10 / M04。
- **观察**：报告把 Mira 归为“蓝牙设备同步”，但引证的 [M04 设备同步说明](https://help.miracare.com/en-US/how-do-i-sync-data-from-mira-hormone-monitor-to-mira-app-848117)只明确 `My devices` 配对和结果自动同步，未说明连接介质。CLM-10 同样没有蓝牙依据。Inito Wi‑Fi 对 Mira 蓝牙是设备路线比较的关键前提。
- **影响**：可能把配对步骤推演为特定无线协议，并误导权限、后台、故障恢复和硬件适配设计。
- **修复**：补可定位的当前 Mira 官方说明书/硬件文档并注明型号与版本；如不能确认，把摘要和比较表改为“设备配对后自动同步，连接介质本次未核实”，将 Bluetooth 权限相关内容列为待验证。
- **状态**：`open`。

### CR-02 · major · Inito 首页控件位置被标为 A，但原文只确认 App 可查状态

- **定位**：`analysis.md` §3「Inito：按页面、模块、控件与交互拆分」I-P03「测试状态入口」；`evidence.md` CLM-04 / I02。
- **观察**：[I02 检测指南](https://blog.inito.com/a-complete-guide-to-testing-with-the-inito-fertility-monitor/)的 Step 4 说明测试中可随时在 App 查看状态，完成后收到通知并显示结果；未说明状态入口位于**首页**。I-P03 将其放在「首页/今日」并标为 A，使研究归类看起来像已核实的页面控件。
- **影响**：若下游据此建立页面和控件映射，会把未证实的导航位置当成当前竞品 UI 事实。
- **修复**：将该行移到“检测任务状态（位置待核）”，或把首页位置明确标 U；仅保留“App 可查看状态、完成通知和同步”为 A。实机或官方带页面定位的资料到手后再升级。
- **状态**：`open`。

## 复核通过的关键点与边界

- [I01 新读数器公告](https://blog.inito.com/inito-fertility-monitor-new-wireless-reader/)明确 2026-04 新 InSight、内置 Wi‑Fi、旧手机连接读数器停产；报告没有混用两代测试流程。
- [I02 检测指南](https://blog.inito.com/a-complete-guide-to-testing-with-the-inito-fertility-monitor/)明确 15 秒浸棒、后台检测、五种结果状态，并说明首页 Waiting for PdG Rise 与图表 Low Fertility 的表述差异；[I03 图表指南](https://blog.inito.com/how-to-read-your-inito-chart-a-beginners-guide/)明确彩色/黑白 PDF 和至少一完整检测周期的导出门槛。
- [M11 排卵日编辑](https://help.miracare.com/en-US/how-to-manually-change-the-date-of-my-ovulation-848128)明确手工确认会删除同周期既有预测/检测/确认排卵信息；[M18 医生报告](https://help.miracare.com/en-US/how-to-generate-a-doctors-report-848129)明确至少 3 个月 Monitor 检测；[M19 伴侣邀请](https://help.miracare.com/en-US/how-to-invite-a-partner-848116)明确仅一人且只读。这些限制在报告中基本得到保留。
- 报告把公开资料、页面研究归类、可迁移建议和待验证事项区分开，没有把“未查到”普遍写成“不支持”，也明确没有完整 App build / 实机覆盖。INS-01–05 是**候选推论**，其必要性与优先级仍需目标人群、硬件路线和真实用户研究支撑；当前不应升格为研发已批准需求。

## 关闭标准

作者修复 CR-01/02 后，评审者应按新文件 SHA-256 和对应官方定位复核关闭。若核心比较、范围或页面映射另有材料性变化，需重审受影响段落；不得沿用本次结论直接标记为通过。

## 2026-10-20 返修复核

- 复核稿：`analysis.md` SHA-256 `9B6A37CA77B2D64A66220961A0BE9C99EBF93166DF50E00A02161E3E0F939F92`；`evidence.md` 未变。复核者：本次独立挑战评审者；仅复核 CR-01/02 对应段落。
- **CR-01：仍 open**。§1 已改为“设备配对后自动同步”，并明确连接介质待核；但 §4 M-P05 仍写“蓝牙与系统权限异常须实机核对”。该行标 `CLM-10 / A`，容易让读者误将蓝牙视为已确认的设备连接条件。把此处改为“连接与系统权限异常须实机核对”或列明蓝牙仅为待核假设后可关闭。
- **CR-02：resolved**。§3 I-P03 已写明“状态入口是否位于首页未证实”，并将位置标为 U；行为仍由 I02 支持。复核证据为该稿 I-P03 行与 [I02 Step 4](https://blog.inito.com/a-complete-guide-to-testing-with-the-inito-fertility-monitor/) 的对应关系。
- 结论维持 `revise`，直至 CR-01 关闭；缺少 App build/实机的范围限制继续适用。

## 2026-10-20 再复核与结论

- 复核稿：`analysis.md` SHA-256 `45A4B498442798E9266C8A3FC117A7A67155D98041C6FD0901443FC93DE0A0F8`；`evidence.md` 未变。复核者：本次独立挑战评审者；检查 §1、§3 I-P03、§4 M-P05 与对应官方来源。
- **CR-01：resolved**。§1 已将 Mira 改为“设备配对后自动同步”并注明连接介质按型号核验；§4 M-P05 现写“连接介质、连接失败与系统权限异常须按型号实机核对”，且同格分开标注“配对及同步 A；介质 U”。这与 [M04 设备同步说明](https://help.miracare.com/en-US/how-do-i-sync-data-from-mira-hormone-monitor-to-mira-app-848117) 的证据强度一致。
- **CR-02：resolved**，沿用上轮独立复核结论；本次 §3 I-P03 再次确认位置 U 与状态行为 A 分开。
- **最终结论：`pass`，仅适用于公开资料范围内的基础竞品研究稿。** 两条 major 均已关闭；未实机验证的 App build、完整导航、异常恢复、算法和账号权益仍须保持 U，不能据本次通过宣称完整 UI 审计或研发 PRD 已就绪。
