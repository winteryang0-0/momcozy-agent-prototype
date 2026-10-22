# R26 独立视觉评审（候选稿）

- role: visual
- reviewer: Codex 子评审者 `r26_final_visual`，未编写本轮 UI
- evidence_mode: 11 张主回归截图由 `qa-browser.cjs` 操作并保存；本人逐张审阅，并用 `verify-sidebar-text.cjs` 独立重跑夜间侧栏三次。Today 卡循环、键盘、收折行为仅依据主回归操作记录，本人未复现。
- status: pass（仅指本轮截图可观察的视觉范围；保留一项不阻塞的 minor，不代表设计冻结或整包交付通过）
- 当前材料：`Momcozy-final.html` SHA-256 `9b58981c227ccfca64341e3fc5e4c586b628e8f0c09ae808380a7f873d4660c0`；`design.json` SHA-256 `ab38ef377ce382d7e984462c6d4452ecf5a833ced0f011944ef8b8a7a5238e4f`；需求源 `sources/today-card-26-requirements.json` SHA-256 `6f9569ecc10766298173904734bb52198acc0fe5953379a4c722973dd4d9df90`；与 `browser-evidence.json` 的材料摘要一致。
- 基线：`HOME-1.1-today-card-26-candidate`，未见用户批准的 B-ID 冻结基线。比较对象为本轮 R26-01～06 需求源和候选设计。
- 截图操作者：`qa-browser.cjs` 的 Playwright 自动化（具体人类操作者 unknown）。Google Chrome 155.0.8059.86、headless、`file://`、deviceScaleFactor 2。截图均为 viewport 截图，`fullPage=false`。URL 均为 `file:///C:/Users/user/Documents/ChatGPT/Momcozy%20Agent/prototype/current/Momcozy-final.html#/home`。逐图时间和 SHA-256 见 `browser-evidence.json`；本评审复核了 11 张图片的文件哈希。

## 页面 × 状态 × 视口覆盖

| 页面／状态 | 390×844 亮色 | 360×640 夜间 | 1280×720 桌面 |
|---|---|---|---|
| 首页欢迎态，Today 第 1 条 | `01-welcome-390.png` | `05-welcome-dark-360.png` | `07-welcome-desktop.png` |
| 首页欢迎态，Today 第 3 条 | `02-welcome-third-390.png` | 未截图 | 未截图 |
| 对话后 Today 展开，第 1 条 | `03-expanded-390.png` | `06-expanded-dark-360.png` | `08-expanded-desktop.png` |
| 对话后 Today 展开，第 3 条 | `04-expanded-third-390.png` | 未截图 | 未截图 |
| 精简侧栏打开 | `09-sidebar-390.png` | `10-sidebar-dark-360.png` | `11-sidebar-desktop.png` |

全部主回归图片位于 `delivery-review/today-card-26/screenshots/`，相对 `prototype/current/`。原始像素尺寸：390 视口为 780×1688；360 视口为 720×1280；桌面视口为 2560×1440。捕获时间为 2026-10-21 13:46:43–13:47:03 UTC。逐图 URL、视口、时间、尺寸和 SHA-256 见 `browser-evidence.json`，11 张哈希均已复核。实际操作覆盖以该文件的 checks 为准；本人额外仅重跑夜间侧栏文字复核。加载、空、失败、离线、权限拒绝等状态不属于本轮差异截图范围；移动视口为桌面浏览器模拟，未在真机复核。

## 视觉判断

1. **Today 卡：符合本轮候选要求。** 欢迎态与展开态都显示三枚底部居中的页码点，当前页以长胶囊形区分；文字层级、留白和卡片边界清楚。截图中没有查看依据入口或左右切换箭头，展开态顶部仍有“收起”。390 亮色与 360 夜间短屏的标题和说明均可读，页码点未被输入区遮挡。循环滑动、键盘切页、折叠恢复属于浏览器操作记录所覆盖的行为，本人未复现。
2. **侧栏：符合本轮候选要求。** 亮色移动、夜间短屏和桌面截图都只显示“我的”“宝宝”“当日记录”三个主入口，未显示智能体服务区、推荐说明或次级描述；标签、图标、关闭按钮清楚。桌面侧栏位于预览设备内，宽度与主区域相称。
3. **短屏滚动限制。** `06-expanded-dark-360.png` 中任务卡下半部被固定输入区遮在当前视口以外；浏览器记录确认输入框可见，但截图本身不能证明任务按钮滚动后的可达性。此项不据此判缺陷，若作全任务验收需滚动到任务卡下部复核。

## 发现

| ID | 严重性 | 定位／现象 | 用户影响 | 最小复核 |
|---|---|---|---|---|
| VR26-01 | minor，已确认 | `10-sidebar-dark-360.png` 中“宝宝”字样有约 1 像素水平线穿过。在相同 Chrome 155、360×640 夜间视口重截两次 DPR 2、一次 DPR 1，均稳定重现，截图见 `12-sidebar-dark-text-1-2x.png`、`12-sidebar-dark-text-2-2x.png`、`12-sidebar-dark-text-3-1x.png`。计算样式 `text-decoration`、`text-shadow` 和 `transform` 均为 `none`；更可能是字体栅格绘制现象，尚不能断言具体成因。 | 局部观感，文字仍可读，入口可操作。 | 需要打磨时在目标真机复核，按字体栈／字重／字号查找最小修正；改动后再截图。 |

独立补测记录见 `sidebar-text-verification.json`；补测使用同一 `file://` 单文件、Chrome 155.0.8059.86、360×640 夜间模式。三张新图中前两张 DPR 2 的 SHA-256 均为 `222ad2ef7901e0218ff0fb734f83643f92a7185a5c620695992b0675603bb8d2`，DPR 1 为 `2b8bb6dff9fda3d4161f2f6284b866903b674248a812fb4eb382f4bd16674e26`。补测脚本未记录精确截图时间，时间项为 unknown。

当前截图和哈希所绑定的候选稿可通过**本轮可观察视觉范围**的独立复核。设计冻结、全状态覆盖、真机触控与整包交付需按各自门槛另行判定。
