# Momcozy Agent 当前原型基线

Wentao 于 2026-10-26 明确指定 `C:\Users\user\Desktop\Root Work\Momcozy Agent\New5\Momcozy-Soft-Companion` 为原型基线。

- 当前基线 ID：`B-MOMCOZY-20261026-NEW5`。
- 权威索引：`docs/prototype-baseline.json`；说明：`docs/BASELINE.md`。
- 原样快照：`prototype/baselines/B-MOMCOZY-20261026-NEW5/package/`。
- 单文件入口：快照内 `Momcozy-Soft-Companion.html`；源码入口：`index.html`。
- 后续设计/实现前，读取快照内 `AGENTS.md`、`DESIGN.md`、`DELIVERY.md`，继承其用户决策、Google/Material 规范与能力边界。不要自动套用旧 R27/R41 的导航与视觉规则。
- `prototype/current/` 是保留原路径的历史 R27 冻结包，目录名不代表现行基线；R30–R41 均不替代 New5。
- 在独立候选目录迭代，不覆盖基线快照。运行 `node scripts/verify-repository.cjs` 验证当前快照与历史 R27 的完整性。

本次用户决定确认原型参考版本，不代表真实 AI、临床能力、真机或全部交互状态通过验收。历史测试与评审保持原结论，不冒充本次重新执行。

## 当前角色形象基线：Sprout Creature

Wentao 于 2026-10-26 明确要求“更新基线形象，现在以这个形象为基准”，以所附 Sprout Creature 图片为准。

- 角色基线 ID：`C-MOMCOZY-20261026-SPROUT`；索引：`docs/character-baseline.json`；说明：`docs/CHARACTER_BASELINE.md`。
- 原始参考：`design/baselines/C-MOMCOZY-20261026-SPROUT/reference.png`，保留原图，不去除水印或重绘覆盖。
- 后续角色、配饰与动画制作使用浅绿色芽苗角色：圆润身体、奶油色脸部、头顶双叶、深色椭圆眼睛与粉色腮红。眼镜、书本、花盆属于配饰，不将其固化为身体结构。
- 本决定在角色外观上优先于旧快照与 Nest 候选；Nest 的卷带身体、口袋和骨骼不作为新角色默认结构。旧样片保留为历史候选，动作逻辑可参考，需按新角色肢体重新适配。
- 原型架构基线仍是 New5；本次登记不表示页面角色已经替换，也不表示新角色的拆层、动作或业务集成已经完成。
