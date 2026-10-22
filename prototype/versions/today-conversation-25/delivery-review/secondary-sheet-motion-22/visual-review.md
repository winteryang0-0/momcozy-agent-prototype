# R22 二级弹窗视觉独立评审

## 评审身份与材料

- `role=visual`，`independent=true`，`evidence_mode=screenshot-review`。评审者独立阅读当前截图与 QA 帧序列，**未亲自操作浏览器**，未修改原型、账本或其他交付材料。
- 评审对象：`prototype/current/Momcozy-final.html`；实测文件 SHA-256：`f556bbafad4e0ebdcb3302ba28513ab7ba63a5d5775ff2f905a1516be798e529`，与 `browser-evidence.json` 的 `material_sha256` 一致。
- 基线：当前 R22 为候选版本；本评审不作冻结基线或最终交付通过判断。
- 运行证据：`browser-evidence.json` 及 `screenshots/` 下 10 张 PNG。证据记录的操作者为 **Playwright Chrome headless**，浏览器为 **Chrome 155.0.8059.80**，协议为 `file://`，总体记录时间为 **2026-10-21 07:01:31.870 UTC**。这些是证据文件的声明，并非评审者亲自运行的结果。
- 截图 URL 基址：`file:///C:/Users/user/Documents/ChatGPT/Momcozy%20Agent/prototype/current/Momcozy-final.html`；下表列出每图的路由。所有截图 `fullPage=false`，实际图片像素等于声明视口；已逐一复核 10 张 PNG 的 SHA-256 与证据文件一致。

## 页面 × 状态 × 视口覆盖

| 截图 / 路由 | 可见状态与评审结果 | 声明视口 = 实际像素 | 捕获时间 UTC | PNG SHA-256 |
| --- | --- | --- | --- | --- |
| [01-my-menu-390.png](screenshots/01-my-menu-390.png) `#/records` | “我的”首层；标题、分类、资料与同步条目可读，关闭入口可见。 | 390×844 | 07:01:21.952 | `d3d42b66c30f7e3303e47b61cea06a8e4ca35059a5c73e1d698d0098449a56aa` |
| [02-mom-profile-390.png](screenshots/02-mom-profile-390.png) `#/records` | “妈妈资料”子层；标题、表单字段、说明与保存入口可读，未见相互遮挡。 | 390×844 | 07:01:22.476 | `aaf25cd15f2a258cc0ec06a23d68b7c6ac7eb57c610bacee94f996e2d608bb4e` |
| [03-record-picker-390.png](screenshots/03-record-picker-390.png) `#/records` | 记录选择；类别及各记录类型可读，关闭入口可见。 | 390×844 | 07:01:23.066 | `c48cef0ba3b5de4f4107ef2d1c7f70de451a9b9995b658fbf5488bee79a6f40a` |
| [04-record-form-390.png](screenshots/04-record-form-390.png) `#/records` | “亲喂”表单；侧别、时长、发生时间、备注及保存按钮可见且可读。 | 390×844 | 07:01:23.585 | `576d77c30bfe25611f594aa5ff8d9abe40cc1fbc9facd6fc6d04849410bd897e` |
| [05-chat-more-390.png](screenshots/05-chat-more-390.png) `#/home` | “添加素材”首层；拍照、附件入口与关闭按钮清楚可见。 | 390×844 | 07:01:24.539 | `289bea5ec48588b3e9d59f12aee74eea5a31abaa3b0343afa89b2a20d7f39bef` |
| [06-photo-attachment-390.png](screenshots/06-photo-attachment-390.png) `#/home` | “添加照片”子层；示例素材说明、占位提示、操作按钮可读。 | 390×844 | 07:01:25.093 | `f9edd69d966f693451a0ba1c5e7f8aa574a38d05a897b6a46215ac8d69000a69` |
| [07-dark-enter-360.png](screenshots/07-dark-enter-360.png) `#/records` | 夜间短屏进场帧；弹窗从下方进入，已露出的标题与条目可读；底部尚未进场的内容不作为遮挡缺陷。 | 360×640 | 07:01:26.836 | `1e2087bfa3844d773aae6b6abe02938e9252dae34d9b53733e76d38e36bea978` |
| [08-dark-settled-360.png](screenshots/08-dark-settled-360.png) `#/records` | 夜间短屏稳定帧；“我的”标题、四个资料条目和下一组标题可读，未见横向截断。 | 360×640 | 07:01:27.237 | `1429fb1a10dd191f90d96081a8df616a9ad0be4191d2c5187d4457e84b06c5f8` |
| [09-reduced-motion-390.png](screenshots/09-reduced-motion-390.png) `#/records` | 用户减少动效模式；完整弹窗立即可见，标题、入口和关闭控件可读。 | 390×844 | 07:01:27.952 | `6b0e665ea72256a00dd8d034a5dd4b4b1b34c2b16cf4698d6eebc4ddba674c31` |
| [10-my-menu-desktop-1280.png](screenshots/10-my-menu-desktop-1280.png) `#/records` | 桌面预览；弹窗位于右侧应用预览框内，标题与可见条目可读。 | 1280×900 | 07:01:30.417 | `90a25a12feb2bb6221c164311f0ed22bb069525eae7686cc5df226f42f405418` |

## 动效与遮罩判断

依据 `browser-evidence.json` 的现成 QA 帧序列（每条 29 帧，0–467 ms），而非本人重跑：

| 路径 | 面板顶部坐标 | 面板不透明度 | 遮罩 | 判断 |
| --- | --- | --- | --- | --- |
| “我的”首层 `profile_menu` | 800 → 24 px；未发现超过 1.5 px 的反向位移 | 全程 1 | 0 → 1，未见回落 | 自下而上连续进场，未见面板透明闪烁迹象。 |
| “妈妈资料”子层 `profile_submenu` | 800 → 159.3 px；未发现超过 1.5 px 的反向位移 | 全程 1 | 全程 1 | 子层沿相同方向进场，已有遮罩保持稳定。 |

静态截图与上述帧序列相符：夜间进场帧到稳定帧可见弹窗向上展开；在已给样本中未见标题闪现、面板穿透、显著闪烁或关键控件被遮挡。对比数据中旧版首层不透明度从 0 增至 1、子层顶部位置不变；本次证据显示进场方向已统一。

## 发现、结论与边界

- **发现**：本次可见截图中无可确认的 `blocker` 或 `major` 视觉问题；未记录需要修复的 `minor` 问题。
- **局部结论**：R22 当前单文件在上述截图覆盖的页面、状态与视口中，标题和核心内容可读，进场方向连续，未见明显闪烁或遮挡。此结论仅适用于该 SHA-256 对应的候选材料与所列样本。
- **未实测边界**：本人未操作浏览器；点击、关闭、滚动、键盘、真实移动设备与虚拟键盘表现均未亲自验证。短屏和桌面截图没有展示弹窗底部内容的完整滚动过程。证据文件记录了系统减少动效与模块版检查，但两者没有对应截图，本评审不据此宣称独立视觉通过。未覆盖其他页面、语言、长文案或全部异常状态，也不作完整无障碍合规判断。
