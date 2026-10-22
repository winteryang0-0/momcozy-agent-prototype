# R19 独立视觉复核：首次资料录入应用莓色留白

- 角色：visual；评审者：`/root/r19_visual_review`，未编写 R19 UI。
- 结论：**所覆盖的桌面模拟手机截图视觉通过，未发现 blocker 或 major**。当前仍为未冻结候选，不构成正式设计冻结或真机验收。
- 证据模式：`screenshot-review`。本人逐张审阅了实际浏览器截图；另为夜间状态独立运行 `qa-dark.cjs` 并截图。亮色四步与交互操作由主任务使用 Playwright 本地 Chrome 完成，见 `qa-browser.cjs` 和 `browser-evidence.json`。
- 评审材料：`Momcozy-final.html` SHA-256 `1b6f3f47621c8cf2bb8b7a6ef8d171d95d9ba880ee4dd624ba44dda528b60d64`；R19 来源 `sources/onboarding-berry-ui-19-requirements.json`；样板 `design/2026-10-20-semantic-style/CS-0.5-testboards/berry.html`，SHA-256 `c7fc177614dd01f4381343485e1b3f970550a4a11b02971db867268423e6b55f`。样板仍为项目候选，未有冻结 B-ID。
- 协议：`file://`；Chrome 155.0.8059.80；390×844、360×640 CSS px；截图均为 viewport capture、DPR 1；逐图实际像素、URL、时间和摘要见两个证据 JSON。

## 截图与覆盖矩阵

| 页面与状态 | 390×844 | 360×640 |
|---|---|---|
| 资料录入：身份，亮色 | `01-first-identity-390.png` | `07-first-identity-360.png` |
| 身份必选错误，亮色 | `02-required-role-390.png` | 未截图 |
| 基础资料，亮色 | `03-first-details-390.png` | `08-first-details-360.png` |
| 关注点，亮色 | `04-first-concerns-390.png` | `09-first-concerns-360.png` |
| 功能推荐，亮色 | `05-first-recommendations-390.png` | `10-first-recommendations-360.png` |
| 完成后首页，亮色 | `06-first-complete-home-390.png` | 未截图 |
| 身份，夜间 | `11-first-identity-dark-390.png` | 未截图 |

截图均位于本目录的 `screenshots/`；`browser-evidence.json` 对应前 10 张，`dark-browser-evidence.json` 对应夜间截图。两份证据材料摘要与当前 HTML 一致；逐图 SHA-256 已核对。浏览器操作覆盖身份必选、四步前进和返回、稍后设置、刷新续填、个人菜单返回、完成后原有首页功能，页面与控制台错误均为 0。夜间操作为打开演示设置、切换夜间、关闭设置后确认 `body[data-theme=dark]` 并截图。

## 观察

1. 四步标题、步骤进度、说明、输入区与底部主操作呈稳定层级；当前步骤与选中项使用深莓边界/填充，状态不单靠颜色区分。相比 R18 旧稿，步骤和表单卡片的视觉语法与 CS-0.5 莓色留白更一致。
2. 身份、关注点和推荐卡片保留文字与对象图标。喂养、哭闹、尿布、睡眠使用对应浅色任务图标底，主操作统一深莓色。背景主要为暖白与柔粉环境光，未以复杂玻璃纹理承载正文。
3. 360×640 短屏的标题和步骤进度仍可读，底部操作固定且无遮挡；基础资料、关注点和推荐列表需在内容区内部滚动，截图不代表整个列表已展示或逐项触控验收。390×844 必选错误展示在操作区上方，文案未被按钮遮挡。
4. 夜间身份页的文字、卡片边界和粉色主操作可辨；该截图没有覆盖夜间其余三步。

## 发现与边界

- **minor，待后续验证**：短屏 360×640 的基础资料/关注点/推荐内容需要滚动；实际手机软键盘弹出时的可达性未验证。位置：`#/onboarding` 的内部滚动区与固定操作区。影响：输入生日时可能改变可见区域。建议在真机或移动仿真键盘场景确认焦点字段能滚入视口、底部操作不压住字段。
- **未覆盖**：真机触控、软键盘、读屏、放大字号、360 夜间与夜间后三步；未声称完整 WCAG、原生 Liquid Glass 或品牌正式规范通过。

