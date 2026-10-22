// Build a self-contained US English testing copy of the CS-0.6 style boards.
// Runtime pages use only local HTML, CSS, and JS. This script is not needed to view them.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = __dirname;
const source = path.resolve(root, '..', 'CS-0.6-testboards');
const readSource = file => fs.readFileSync(path.join(source, file), 'utf8');
const write = (file, value) => fs.writeFileSync(path.join(root, file), value, 'utf8');

for (const file of ['board.css', 'material.css', 'overview.css']) {
  fs.copyFileSync(path.join(source, 'assets', file), path.join(root, 'assets', file));
}

let board = readSource('assets/board.js');
function section(from, to, replacement) {
  const start = board.indexOf(from);
  const end = board.indexOf(to, start + from.length);
  if (start < 0 || end < 0) throw new Error(`Missing board section: ${from}`);
  board = board.slice(0, start) + replacement + board.slice(end);
}
function swap(before, after) {
  if (!board.includes(before)) throw new Error(`Missing board copy: ${before}`);
  board = board.replaceAll(before, after);
}

section('const variants = {', 'const variant =', `const variants = {
  bloom: {
    number: '01', name: 'Bloom Glass', tagline: 'A softer way to care.',
    premise: 'Soft skeuomorphic icons · Warm frosted glass',
    material: 'Gently raised object icons and diffused glass give everyday care a warm, tactile feel.',
    insight: 'Do the soft details help people recognize tasks without making the screen feel heavy?',
    iconStyle: 'soft-relief', glassStyle: 'warm-frost',
    iconDescription: 'Bottle and diaper icons use soft fill, highlights, and shadow to suggest familiar objects. Labels support quick recognition.',
    glassDescription: 'Warm, highly blurred glass softens navigation and small controls. Records and AI text stay on solid surfaces.'
  },
  orbit: {
    number: '02', name: 'Daily Orbit', tagline: 'Care at a glance.',
    premise: 'Flat geometric icons · Satin frosted glass',
    material: 'Solid symbols and a quiet matte finish make the order of events easy to scan.',
    insight: 'Can people identify the flat symbols quickly and follow the timeline without effort?',
    iconStyle: 'solid-flat', glassStyle: 'satin-frost',
    iconDescription: 'Simple, filled shapes use negative space for key details, so each task stays legible at small sizes.',
    glassDescription: 'A softly frosted surface has clear edges and very little shine, keeping dates and navigation easy to scan.'
  },
  garden: {
    number: '03', name: 'After Rain', tagline: 'A little more light.',
    premise: 'Translucent 3D icons · Luminous liquid glass',
    material: 'Waterlike icons, bright edges, and reflected color bring more movement and energy to care tasks.',
    insight: 'Does the liquid treatment feel lively while keeping labels and controls clear?',
    iconStyle: 'liquid-volume', glassStyle: 'luminous-liquid',
    iconDescription: 'Translucent fill and inner highlights give objects a waterlike depth while preserving the bottle, diaper, and crying cues.',
    glassDescription: 'Sharper transparency, bright edges, and reflected color make floating controls feel liquid. Highlights stay clear of body text.'
  },
  berry: {
    number: '04', name: 'Berry Poise', tagline: 'Color, with restraint.',
    premise: 'Minimal outline icons · Subtle clear glass',
    material: 'A deeper berry tone sets the focus while fine outlines and restrained reflections keep the interface calm.',
    insight: 'Can the quieter details retain warmth and make each task easy to recognize?',
    iconStyle: 'hairline-flat', glassStyle: 'quiet-liquid',
    iconDescription: 'Clean outlines and a few precise details keep each object recognizable without adding visual weight.',
    glassDescription: 'Thin, clear surfaces and a narrow highlight keep the berry theme in focus without overpowering the content.'
  }
};
`);

section('const axisLabels = {', 'const symbols =', `const axisLabels = {
  bloom: { icon: 'Soft skeuomorphic', glass: 'Warm frosted glass' },
  orbit: { icon: 'Flat geometric', glass: 'Satin frosted glass' },
  garden: { icon: 'Translucent 3D', glass: 'Luminous liquid glass' },
  berry: { icon: 'Minimal outline', glass: 'Subtle clear glass' }
};
`);

section('const states = {', 'const stateChoices =', `const states = {
  normal: { label: 'Default view', icon: 'clock', headline: 'Review before saving', detail: 'This entry has not been saved yet.', action: 'Save the entry', kind: 'neutral' },
  saving: { label: 'Saving', icon: 'clock', headline: 'Saving your entry…', detail: 'There is no time estimate yet.', action: 'Wait for confirmation', kind: 'neutral' },
  saved: { label: 'Saved', icon: 'check', headline: 'Entry saved', detail: 'Iris’s bottle feed is in the Journal.', action: 'Review the entry', kind: 'success' },
  local: { label: 'On this device', icon: 'cloud', headline: 'Saved on this device', detail: 'Sync to other devices has not been confirmed.', action: 'Check sync status', kind: 'local' },
  failed: { label: 'Save failed', icon: 'alert', headline: 'Couldn’t save the entry', detail: 'Your draft is still here.', action: 'Try saving again', kind: 'error' },
  unknown: { label: 'Status unclear', icon: 'help', headline: 'Save status is unclear', detail: 'Check the Journal before saving again to avoid a duplicate.', action: 'Check the Journal', kind: 'unknown' },
  analyzing: { label: 'Reviewing', icon: 'clock', headline: 'Reviewing what you shared…', detail: 'No result or time estimate is available yet.', action: 'Wait for an update', kind: 'neutral' },
  indeterminate: { label: 'Not enough information', icon: 'help', headline: 'Not enough information', detail: 'What you shared isn’t enough to identify why Iris is crying.', action: 'Add more context', kind: 'unknown' }
};
`);

swap('${v.cn}', '${v.name}');
swap('Suggested next step ·', 'Suggested next step:');
swap('aria-label="样张页面"', 'aria-label="Preview navigation"');
swap("['camera', 'Photo'], ['calendar', 'Schedule'], ['ai', 'AI assist']", "['camera', 'Photo'], ['calendar', 'Calendar'], ['ai', 'AI assistant']");

for (const [before, after] of [
  ['LATEST BABY FEED', 'LATEST FEED'],
  ['Today, at your pace.', 'Today, one step at a time.'],
  ['<h3>One thing at a time</h3><span>Choose a task</span>', '<h3>Care tasks</h3><span>Quick access</span>'],
  ['<h3>Recent care</h3><span>View all ${icon(\'chevron\')}</span>', '<h3>Recent care</h3><span>Today</span>'],
  ['Every moment, in place.', 'Today’s care, in one place.'],
  ['<h3>Wednesday’s timeline</h3><span>Filter ${icon(\'chevron\')}</span>', '<h3>Recent entries</h3><span>Latest 4</span>'],
  ["'Iris · 4 fl oz · Editable'", "'Iris · 4 fl oz'"],
  ["timelineEvent('sleep', 'Rest'", "timelineEvent('sleep', 'Nap'"],
  ['Reviewing your recording…', 'Reviewing what you shared…'],
  ['I can’t tell from this recording alone.', 'I can’t tell why Iris is crying from this alone.'],
  ['You could check whether Iris needs a diaper change.', 'It may help to check whether Iris needs a diaper change.'],
  ['I’ll show a result only when there is enough information.', 'I’ll share a response if there is enough information.'],
  ['More context about timing and recent care may help you decide what to do next.', 'Details about timing and recent care may help you decide what to do next.'],
  ['This is one possibility based on what you shared, not a diagnosis of the crying.', 'This is one possibility based on what you shared, not a diagnosis.'],
  ['Based on · Your description of a recent feed', 'Based on what you shared about the feeding'],
  ['A THOUGHT TO CONSIDER', 'ONE POSSIBILITY'],
  ['Observe the diaper and the room. Add context if you want to keep exploring.', 'Check Iris’s diaper and surroundings. Add context if you want to explore other possibilities.']
]) swap(before, after);

swap('Check Iris’s diaper and surroundings. Add context if you want to explore other possibilities.', "${busy?'Wait for the review to finish.':uncertain?'Add details about when the crying began and what happened beforehand.':'Check Iris’s diaper and surroundings. Add context if you want to explore other possibilities.'}");
swap('ONE POSSIBILITY</div>', "${busy?'REVIEW IN PROGRESS':uncertain?'WHAT WE KNOW':'ONE POSSIBILITY'}</div>");
swap('Based on what you shared about the feeding</div>', "${busy?'Reviewing what you shared':uncertain?'Based on what you shared so far':'Based on what you shared about the feeding'}</div>");

for (const [before, after] of [
  ['aria-label="四个风格板"', 'aria-label="Four style directions"'],
  ['<h1>${meta.cn}<br><em>${meta.name}</em></h1>', '<h1>${meta.name}<br><em>${meta.tagline}</em></h1>'],
  ['<span>图标 · ${axisLabels[variant].icon}</span><span>材质 · ${axisLabels[variant].glass}</span>', '<span>Icons · ${axisLabels[variant].icon}</span><span>Glass · ${axisLabels[variant].glass}</span>'],
  ['<b>测试关注</b>', '<b>What to watch for</b>'],
  ['同一示例内容 · 相同状态语义<br>候选设计 · 未冻结 / 2026-10-21', 'Same sample content · Same state meanings<br>Design candidate · Not approved / Oct 21, 2026'],
  ['图标 · ${axisLabels[variant].icon}　材质 · ${axisLabels[variant].glass}', 'Icons · ${axisLabels[variant].icon}　Glass · ${axisLabels[variant].glass}'],
  ['可本地双击打开 · 内容为模拟', 'Interactive tabs · Sample content'],
  ['让照护动作<br><em>有温度，也有答案。</em>', 'Make care feel<br><em>clear and calm.</em>'],
  ['彩色光线为任务定调；玻璃只浮在导航与操作控件样式上。事实、来源和状态落在清楚的内容表面。', 'Color gives each task a clear cue. Glass stays on navigation and lightweight controls, while facts and feedback sit on solid surfaces.'],
  ['aria-label="可切换的页面样张"', 'aria-label="Interactive page preview"'],
  ['aria-label="选择样张页面"', 'aria-label="Choose a preview page"'],
  ['反馈状态 <select id="result" aria-label="选择反馈状态"', 'Feedback scenario <select id="result" aria-label="Choose a feedback scenario"'],
  ['390 × 844 · 缩比视图', '390 × 844 · Scaled preview'],
  ['<h2>材质、语义、反馈</h2>', '<h2>Material, meaning, feedback</h2>'],
  ['<h3>浮在内容上方的控件</h3>', '<h3>Controls above the content</h3>'],
  ['<h3>物件轮廓与文字成对</h3>', '<h3>Recognizable icons with labels</h3>'],
  ['<h3>结果后面有下一步</h3>', '<h3>Clear next steps</h3>'],
  ['“已保存”“仅本地保存”“无法判断”各有不同语义，不靠颜色代替文字。', 'A saved entry, a device-only copy, and an inconclusive AI result mean different things. The text makes each state clear without relying on color.'],
  ['<h3>同一组任务，比较四个方向</h3>', '<h3>Same care scenarios. Four visual directions.</h3>'],
  ['观察：先看到什么？能否认出功能？是否理解保存与 AI 的边界？常用环境或低透明度下是否仍舒适？', 'Notice where your eye goes first. Can you identify each task and distinguish saved, device-only, and uncertain AI states? Is the glass comfortable to read on your device? Only the tabs and test controls are interactive.'],
  [' 减少透明度</label>', ' Reduce transparency</label>'],
  [' 减少动效</label>', ' Reduce motion</label>'],
  ['Design candidate · Open <a href="index.html">test overview</a>', 'Design candidate · <a href="index.html">Back to all directions</a>']
]) swap(before, after);

if (/[\u3400-\u9fff]/u.test(board)) {
  const index = board.search(/[\u3400-\u9fff]/u);
  throw new Error(`Untranslated text in board.js: ${board.slice(index - 45, index + 80)}`);
}
write('assets/board.js', board);

for (const [key, name] of Object.entries({
  bloom: 'Bloom Glass', orbit: 'Daily Orbit', garden: 'After Rain', berry: 'Berry Poise'
})) {
  write(`${key}.html`, `<!doctype html>\n<html lang="en-US">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width,initial-scale=1">\n  <meta name="color-scheme" content="light">\n  <meta name="description" content="${name}, an English-language Momcozy Agent style direction for testing.">\n  <title>${name} · Momcozy Agent style study</title>\n  <link rel="stylesheet" href="assets/board.css">\n  <link rel="stylesheet" href="assets/material.css">\n  <link rel="stylesheet" href="assets/english.css">\n  <script src="assets/board.js" defer></script>\n</head>\n<body data-variant="${key}"><div id="board"></div></body>\n</html>\n`);
}

const indexSource = readSource('index.html');
const style = indexSource.match(/<style>[\s\S]*?<\/style>/)?.[0];
if (!style) throw new Error('Missing source overview styles');
const design = JSON.parse(readSource('design.json'));
const head = board.slice(0, board.indexOf('const state ='));
const taskNames = { feed: 'Feed', crying: 'Crying', diaper: 'Diaper', sleep: 'Sleep' };
const boardCards = [
  ['bloom', '01 / CARE & WARMTH', 'LATEST FEED', '4 fl oz', '2:40 PM · Bottle feed', 'Rose, peach, and mint bring a gentle feel to everyday care.'],
  ['orbit', '02 / TIME & CLARITY', 'WEDNESDAY · OCT 21', '3 feeds', 'Only what you recorded', 'Sunlit color and simple geometry make the day easy to scan.'],
  ['garden', '03 / RENEWAL & OPENNESS', 'LATEST FEED', '4 fl oz', '2:40 PM · Bottle feed', 'Green, blue, and warm apricot bring a lighter rhythm to care.'],
  ['berry', '04 / THEME & RESTRAINT', 'LATEST FEED', '4 fl oz', '2:40 PM · Bottle feed', 'A deep berry anchor lets softer task colors do their work without taking over.']
].map(([key, serial, eyebrow, metric, detail, description]) => {
  const meta = vm.runInNewContext(`${head}\n({meta, axis: axisLabels[variant]})`, { document: { body: { dataset: { variant: key } } } });
  return `<a class="board ${key}" href="${key}.html"><span class="num">${serial}</span><span class="orb" aria-hidden="true"></span><div class="sample"><span>${eyebrow}</span><strong>${metric}</strong><small>${detail}</small></div><h2>${meta.meta.name}</h2><div class="axis-label">${meta.axis.icon} · ${meta.axis.glass}</div><p>${description}</p><span class="open">View board <span aria-hidden="true">↗</span></span></a>`;
}).join('');

const comparison = ['bloom', 'orbit', 'garden', 'berry'].map(key => {
  const { meta, axis, makeIcon } = vm.runInNewContext(`${head}\n({meta, axis: axisLabels[variant], makeIcon: icon})`, { document: { body: { dataset: { variant: key } } } });
  const icons = Object.entries(taskNames).map(([task, label]) => {
    const [background, ink] = design.system.task_color_tokens[key][task];
    const symbol = task === 'feed' ? 'bottle' : task === 'crying' ? 'sound' : task;
    return `<div class="compare-icon" style="--chip-bg:${background};--chip-ink:${ink}"><span>${makeIcon(symbol)}</span><b>${label}</b></div>`;
  }).join('');
  return `<article class="compare-card ${key}"><div class="compare-number">${meta.number} / ${meta.name}</div><div class="compare-window"><span class="compare-glow" aria-hidden="true"></span><span class="compare-glass">${axis.glass}</span></div><div class="compare-axis">${axis.icon} · ${axis.glass}</div><div class="compare-icons">${icons}</div><a href="${key}.html">See it in context ↗</a></article>`;
}).join('');

const index = `<!doctype html>
<html lang="en-US">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="description" content="Compare four Momcozy Agent style directions, from skeuomorphic to flat icons and frosted to liquid glass.">
  <title>Four style directions · Momcozy Agent</title>
  ${style}
  <link rel="stylesheet" href="assets/overview.css">
  <style>
    .hero h1 { font-size: clamp(45px, 5vw, 74px); letter-spacing: -3px; }
    .compare-glass { white-space: normal; text-align: center; }
    @media (max-width: 620px) { .hero h1 { font-size: 40px; letter-spacing: -1.8px; } }
  </style>
</head>
<body><div class="wrap">
  <header class="top"><div class="brand"><i aria-hidden="true">m</i>momcozy</div><small>AGENT / CS-0.6 · OCT 21, 2026</small></header>
  <main>
    <section class="hero" aria-labelledby="overview-title"><div><span class="eyebrow">FOUR DESIGN DIRECTIONS</span><h1 id="overview-title">Tactile to flat.<br><em>Frosted to liquid.</em></h1></div><p>Four directions built around the same care scenarios. Compare how tactile, flat, dimensional, and outline icons work with frosted or liquid glass while task colors stay consistent within each board.</p></section>
    <section class="grid" aria-label="Explore the four style directions">${boardCards}</section>
    <section class="compare-section" aria-labelledby="compare-title"><div class="compare-heading"><div><span class="eyebrow">ICON & MATERIAL STUDY</span><h2 id="compare-title">The same tasks, four visual treatments.</h2></div><p>Each task keeps its meaning and uses a consistent color within each board. Shape, depth, blur, and reflected light change across directions.</p></div><div class="compare-grid">${comparison}</div></section>
    <section class="rules" aria-label="Testing guidance"><article><h2>How to compare</h2><ul><li>In each direction, switch between Today, Journal, and Momcozy AI.</li><li>Try the save, device-only, failed, unclear, and inconclusive feedback scenarios.</li><li>Turn on reduced transparency and motion. Check whether labels stay easy to read.</li><li>Guess what each icon means before reading its label, then compare the four treatments.</li></ul></article><article><h2>About this concept</h2><p>These HTML previews approximate frosted and liquid glass with blur, highlights, and color. They do not reproduce native operating-system refraction. Records and AI feedback use solid surfaces for readability. All four directions are candidates for testing.</p><p>The sample content is simulated. No entry is saved, synced, or analyzed.</p></article></section>
  </main>
  <footer>Momcozy Agent · CS-0.6 English candidate · Open any direction as a local HTML file</footer>
</div></body>
</html>
`;
write('index.html', index);
console.log('Built English overview, four boards, and local assets');
