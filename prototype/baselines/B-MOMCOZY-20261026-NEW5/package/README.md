# Momcozy 主动助手原型

打开 `Momcozy-Soft-Companion.html`。Google/Material Web适配，移动App框架，无底部Dock。

第一次可填写资料，也可关闭任务先体验。点输入区 + 快速记录；右上角打开记录页，菜单中设置提醒。语音支持取决于浏览器；偏好里的验证面板可演示语音解析、失败与重试，明确为模拟。

今日摘要引用本机原始记录；修改或删除会重算。记录、资料、提醒、模板仅本机保存，无云同步或多人同步。成长内容为非医学观察提示，没有健康异常阈值或诊断。真实手机语音/键盘需验收。

构建：`python3 build.py`。
测试：`node tests/care-engine.cjs`、`node tests/care-app.cjs`、`node tests/care-voice.cjs`、`node tests/google-edge.cjs`、`node tests/google-motion.cjs`。浏览器脚本内路径对应本环境，其他环境修改 executablePath。

设计基线见 DESIGN.md；规则追溯、功能、状态、异常、验收与独立挑战见 DELIVERY.md。历史Google/iOS报告只作历史资料，不代表本版本验证。

最新重构：悬浮三功能、欢迎左右滑引导、当日四项摘要、历史日历/体重、渐进表单与数值刻度。验证 `node tests/guided-ui.cjs`。原生HTML适配；shadcn Skill用于评审，未安装React组件。详见DELIVERY.md。
