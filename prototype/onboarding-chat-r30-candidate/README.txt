Momcozy R30 对话式 Onboarding · 可审阅候选

本地预览：在本目录运行 node preview.cjs，打开 http://127.0.0.1:4200/#/onboarding。
也可尝试双击 Momcozy-final.html 或将 index.html 与 assets/ 保持同级后打开；file:// 双击方式尚未实测。

首次设置从 AI 欢迎页开始，按服务、担忧点、身份、适用的妈妈与宝宝资料逐卡推进。已答卡可修改，Skip 会暂存。宝宝默认一位，之后追问是否添加更多宝宝；多位宝宝保留独立资料。

数值卡为横向数字选择条：左右拖动、触屏滚动、点选或用方向键调数值，中心数字为当前选择；「暂不填写」单独选择。年龄 18–50 岁、分娩 0–6 次、当前孕周 0–45 周、出生孕周 37–50 周。完成后点击 Let’s chat 回到原主页。

本候选使用独立本机存储键 momcozy-home-r30-candidate，不会覆盖 R27 正式原型。演示设置中的重置只清理 R30 候选资料和对话。AI 分析、设备和同步均为现有原型的演示状态。

修改分文件后运行 node build-standalone.cjs 再预览单文件。状态检查为 node tests/onboarding-flow.cjs；包检查为 node tests/package-check.cjs。
