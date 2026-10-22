const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = __dirname;
const bundle = path.join(root, 'bundle');
fs.mkdirSync(path.join(bundle, 'assets'), { recursive: true });
const files = ['index.html', 'assets/styles.css', 'assets/app.js', 'assets/icons.js'];
const hashes = {};
for (const file of files) {
  const source = path.join(root, file);
  const destination = path.join(bundle, file);
  fs.copyFileSync(source, destination);
  hashes[file] = crypto.createHash('sha256').update(fs.readFileSync(destination)).digest('hex');
}
const readme = [
  'Momcozy Onboarding 独立重构候选',
  '',
  '双击 index.html 可在浏览器中体验。请保留 assets 文件夹。',
  '四步：照护身份、基础资料、关注点、功能推荐。',
  '此候选尚未获得页面框架和设计规范的确认，不与旧原型同步资料。',
  '仅使用当前浏览器的 momcozy-onboarding-rebuild-v1 存储键。',
  '识别与推荐仅为静态原型演示，不连接账号或线上服务。',
  '详细设计与测试记录见上一层项目目录中的 README.md、STYLE_SPEC.md、design.json 与 reviews。',
  ''
].join('\n');
fs.writeFileSync(path.join(bundle, 'README.txt'), readme, 'utf8');
hashes['README.txt'] = crypto.createHash('sha256').update(fs.readFileSync(path.join(bundle, 'README.txt'))).digest('hex');
fs.writeFileSync(path.join(root, 'bundle-manifest.json'), JSON.stringify({
  status: 'candidate-not-frozen',
  files: hashes
}, null, 2) + '\n', 'utf8');
console.log('Built candidate bundle with ' + Object.keys(hashes).length + ' files');
