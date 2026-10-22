// Generates a static comparison strip from the same icon source as each board.
// The resulting index.html has no runtime build dependency.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = __dirname;
const indexPath = path.join(root, 'index.html');
const boardScript = fs.readFileSync(path.join(root, 'assets/board.js'), 'utf8');
const design = JSON.parse(fs.readFileSync(path.join(root, 'design.json'), 'utf8'));
const headEnd = boardScript.indexOf('const state =');
if (headEnd < 0) throw new Error('Could not isolate the icon definitions');
const iconSource = boardScript.slice(0, headEnd);
const variants = ['bloom', 'orbit', 'garden', 'berry'];
const tasks = { feed: '喂养', crying: '哭闹', diaper: '尿布', sleep: '睡眠' };

const cards = variants.map(variant => {
  const preview = vm.runInNewContext(`${iconSource}\n({meta, axis: axisLabels[variant], makeIcon: icon})`, {
    document: { body: { dataset: { variant } } }
  });
  const icons = Object.entries(tasks).map(([task, name]) => {
    const [background, ink] = design.system.task_color_tokens[variant][task];
    const symbol = task === 'feed' ? 'bottle' : task === 'crying' ? 'sound' : task;
    return `<div class="compare-icon" style="--chip-bg:${background};--chip-ink:${ink}"><span>${preview.makeIcon(symbol)}</span><b>${name}</b></div>`;
  }).join('');
  return `<article class="compare-card ${variant}"><div class="compare-number">${preview.meta.number} / ${preview.meta.cn}</div><div class="compare-window"><span class="compare-glow" aria-hidden="true"></span><span class="compare-glass">${preview.axis.glass}</span></div><div class="compare-axis">${preview.axis.icon} · ${preview.axis.glass}</div><div class="compare-icons">${icons}</div><a href="${variant}.html">查看页面中的应用 ↗</a></article>`;
}).join('');

const section = `<section class="compare-section" aria-label="图标与玻璃材质对照"><div class="compare-heading"><span class="eyebrow">ICON & MATERIAL STUDY</span><h2>同一任务，四种形态。</h2><p>图标保持对象语义与任务颜色，变化集中在体积、线条与玻璃的雾度和反光。</p></div><div class="compare-grid">${cards}</div></section>`;
const start = '<!-- ICON_MATERIAL_COMPARISON_START -->';
const end = '<!-- ICON_MATERIAL_COMPARISON_END -->';
let index = fs.readFileSync(indexPath, 'utf8');
if (index.includes(start) && index.includes(end)) {
  const a = index.indexOf(start);
  const b = index.indexOf(end, a) + end.length;
  index = index.slice(0, a) + start + section + end + index.slice(b);
} else {
  const anchor = '<section class="rules">';
  if (!index.includes(anchor)) throw new Error('Missing overview insertion point');
  index = index.replace(anchor, start + section + end + anchor);
}
fs.writeFileSync(indexPath, index, 'utf8');
console.log('Generated four static icon and material comparison cards');
