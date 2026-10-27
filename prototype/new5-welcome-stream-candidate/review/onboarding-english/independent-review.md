# English onboarding 独立复核

日期：2026-10-26。范围：onboarding 英文、暖火烈鸟粉配色、真实姓名与代词、年月显示及 320 px 布局。

## 已关闭

- 阶段按钮、保存中、重试和保存失败提示的中文残留已修复；空宝宝名的核对展示使用 “Your little one”，不改变原有存储兜底值。
- onboarding 控件、日期及滑尺的辅助标签已改为英文；生日完整使用英文月份和年份。
- CTA 原先继承蓝色 accent，现使用 onboarding 局部粉色。未修改主页主题变量。
- 年份被英文月份挤压的问题已修复：年/月控件保留明确宽度，窄屏允许换行。
- 性别选择反馈保留真实宝宝姓名；孕周提问按已选性别使用 she/he，真实姓名经原有 esc 转义显示。

## 验证

- 最终单文件 `tests/gestation-flow.cjs`：25 项通过。
- 分文件独立 `tests/onboarding-english-review.cjs`：93 项通过，覆盖 390×844 与 320×568 下各步骤的可见英文、横向溢出、控件辅助标签、female/male 代词、空姓名兜底、失败重试与主页颜色隔离。重复的逐页/逐尺寸断言计入总数，不等于 93 个独立用户场景。
- 已查看 `independent-name-320.png`、`independent-birthday-320.png`、`independent-review-320.png`、`independent-weeks-390.png`、`independent-save-error-320.png`。320 px 下内容通过纵向滚动访问，无横向溢出或按钮遮断操作。

## 非阻断边界

- 共享 Companion 渲染器仍为角色 canvas 自动生成中文 aria-label（画面不可见）；控件和主要文字的英文检查不包含此共享角色标签。为保持本轮仅 onboarding 及最终哈希稳定，未扩大修改共享渲染器。
- 未验证真机键盘、系统原生日历的语言设置及完整屏幕阅读器体验。默认 native date picker 的语言仍可能受浏览器/系统设置影响。

未发现本轮可见语言、颜色及窄屏范围的未关闭阻断问题。
