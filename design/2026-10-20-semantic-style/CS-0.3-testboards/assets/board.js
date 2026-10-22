/* CS-0.3: three self-contained file:// boards share content and interactions. */
const variants = {
  bloom: { number: '01', name: 'Bloom Glass', cn: '花瓣玻璃', premise: '柔和照护 × 鲜活色彩', material: '香槟色玻璃悬浮在玫瑰、杏桃与薄荷的内容之上。', insight: '温度最高；检查模块色是否仍能帮助快速识别。' },
  orbit: { number: '02', name: 'Daily Orbit', cn: '日光轨道', premise: '时间秩序 × 轻快能量', material: '晨光色玻璃承载时间切换和导航，事件保持稳定的实体表面。', insight: '最重视扫描效率；检查时间轴是否造成照护完成度误读。' },
  garden: { number: '03', name: 'After Rain', cn: '雨后花园', premise: '舒展情绪 × 清新生机', material: '青绿、湖蓝、嫩芽色与一点杏色，像雨后重新透亮的空气。', insight: '情绪表达最明显；检查清新是否变成“健康良好”的错误暗示。' }
};
const variant = document.body.dataset.variant || 'bloom';
const meta = variants[variant];
const paths = { bloom: 'bloom.html', orbit: 'orbit.html', garden: 'garden.html' };
const symbols = {
  home: '<path d="M3.5 10.3 12 3.7l8.5 6.6v9.5H3.5z"/><path d="M9.4 19.8v-6.7h5.2v6.7"/>',
  record: '<rect x="5.3" y="3" width="13.4" height="18" rx="2.6"/><path d="M9 7.8h6m-6 4.5h6m-6 4.4h4"/>',
  ai: '<path d="M4 6.5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-5.7L7 21v-3.5a3 3 0 0 1-3-3z"/><path d="M9 10h6m-6 4h3"/>',
  bottle: '<path d="M10 3h4l1.4 3.4v1.5H8.6V6.4zM8.3 8h7.4l1.2 3v8.1a2 2 0 0 1-2 2H9.1a2 2 0 0 1-2-2V11z"/><path d="M9 13h3m-3 3.2h3"/>',
  diaper: '<path d="M4 5h16l1 4c-2 1.4-2.8 3.4-3.2 5.2-.7 3.1-2.7 5.5-5.8 6.7-3.1-1.2-5.1-3.6-5.8-6.7C5.8 12.4 5 10.4 3 9z"/><path d="M4.2 9h15.6M7 13.3l5 3.1 5-3.1"/>',
  sound: '<path d="M3 9.5v5m4-9v13m5-16v19m5-16v13m4-9v5"/>',
  sleep: '<path d="M20.3 14.7A8.8 8.8 0 0 1 9.3 3.7a8.8 8.8 0 1 0 11 11z"/><path d="M3.5 19.5h5"/>',
  pump: '<path d="M4 6h6v5H4zM5.2 11v9h7v-6l-2.2-3M10 8h5l3 3v7m-2 0h5v3h-5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2.3"/><path d="M7 3v4m10-4v4M3 10h18m-14 4h2m3 0h2"/>',
  camera: '<path d="M3 7h4l2-3h6l2 3h4v14H3z"/><circle cx="12" cy="14" r="3.8"/>',
  check: '<path d="m4.5 12.3 4.7 4.6L19.5 6.7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.4 2"/>',
  cloud: '<path d="M6.2 18.5a5 5 0 0 1-.4-10A7 7 0 0 1 19 8a5.3 5.3 0 0 1-1 10.5z"/><path d="M12 10.5v9m-3-3 3 3 3-3"/>',
  alert: '<path d="m12 3 9.8 18H2.2z"/><path d="M12 9v5m0 3h.01"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 1 1 5.1 2.2c-1.4 1-2.2 1.4-2.2 3.2m0 3h.01"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  plus: '<path d="M12 4v16M4 12h16"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  settings: '<path d="M4 7h16m-16 10h16"/><circle cx="9" cy="7" r="2.4" fill="var(--icon-fill,currentColor)" stroke="none"/><circle cx="16" cy="17" r="2.4" fill="var(--icon-fill,currentColor)" stroke="none"/>',
  shield: '<path d="m12 2 8 4v6.5c0 4.4-2.8 7.2-8 9.5-5.2-2.3-8-5.1-8-9.5V6z"/><path d="m8.6 12.2 2.2 2.2 4.7-4.7"/>'
};
const icon = (key, extra = '') => `<svg ${extra} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${symbols[key]}</svg>`;
const state = { screen: 'home', result: 'normal', opaque: false, quiet: false };
const states = {
  normal: { label: '待确认', icon: 'clock', headline: 'Review before saving', detail: 'This entry has not been saved yet.', action: 'Save entry', kind: 'neutral' },
  saving: { label: '保存中', icon: 'clock', headline: 'Saving entry…', detail: 'Please wait. No progress estimate is available.', action: 'Wait', kind: 'neutral' },
  saved: { label: '已保存', icon: 'check', headline: 'Entry saved', detail: 'Your bottle feed is in the journal.', action: 'View entry', kind: 'success' },
  local: { label: '仅本地保存', icon: 'cloud', headline: 'Saved on this device', detail: 'Sync to other devices is not confirmed.', action: 'Check sync', kind: 'local' },
  failed: { label: '保存失败', icon: 'alert', headline: 'Couldn’t save', detail: 'Your entry is still here.', action: 'Try again', kind: 'error' },
  unknown: { label: '结果待核验', icon: 'help', headline: 'Save status unknown', detail: 'Check the journal before trying again.', action: 'Check entry', kind: 'unknown' },
  analyzing: { label: '分析中', icon: 'clock', headline: 'Reviewing the recording…', detail: 'No result or time estimate yet.', action: 'Close', kind: 'neutral' },
  indeterminate: { label: '无法判断', icon: 'help', headline: 'Not enough to tell', detail: 'This recording alone can’t identify a cause.', action: 'Add context', kind: 'unknown' }
};
const stateChoices = { home: ['normal','saving','saved','local','failed','unknown'], records: ['normal','saving','saved','local','failed','unknown'], assistant: ['normal','analyzing','indeterminate'] };
const compareLinks = Object.entries(variants).map(([key,v]) => `<a href="${paths[key]}" ${key===variant?'aria-current="page"':''}><span>${v.number}</span> ${v.cn}</a>`).join('');

function statusBlock() {
  if (state.result === 'normal') return '';
  const s = states[state.result];
  return `<div class="status-block ${s.kind}" role="status">${icon(s.icon)}<div><strong>${s.headline}</strong><span>${s.detail}</span><b>Suggested next step · ${s.action}</b></div></div>`;
}
function tabBar() {
  return `<nav class="glass-tabbar" aria-label="样张页面">${[['home','Today','home'],['records','Journal','record'],['assistant','Momcozy AI','ai']].map(([id,text,g])=>`<button type="button" data-screen="${id}" aria-current="${state.screen===id?'page':'false'}">${icon(g)}<span>${text}</span></button>`).join('')}</nav>`;
}
function quickCards() {
  return `<div class="quick-row"><div class="quick feed"><span class="quick-icon">${icon('bottle')}</span><b>Log a feed</b><small>Time & amount</small></div><div class="quick listen"><span class="quick-icon">${icon('sound')}</span><b>Understand crying</b><small>Add context</small></div><div class="quick diaper"><span class="quick-icon">${icon('diaper')}</span><b>Check a diaper</b><small>Photo or note</small></div></div>`;
}
function homeScreen() {
  return `<div class="app-scroll"><div class="app-top"><span>OCT 20 · TUESDAY</span><span class="glass-icon" aria-hidden="true">${icon('settings')}</span></div><header class="app-heading"><span class="kicker">IRIS · DAY 12</span><h2>Today, at your pace.</h2><p>A clear view of what you’ve recorded.</p></header><div class="today-hero"><div class="hero-orb" aria-hidden="true"><span></span><span></span></div><span class="eyebrow">LATEST BABY FEED</span><div class="metric"><strong>4</strong><span>fl oz</span></div><p>2:40 PM · Bottle feed</p><div class="hero-foot"><span>3 feeds recorded today</span><span>${icon('arrow')}</span></div></div>${statusBlock()}<section class="app-section"><div class="app-section-heading"><h3>One thing at a time</h3><span>Choose a task</span></div>${quickCards()}</section><section class="app-section recent"><div class="app-section-heading"><h3>Recent care</h3><span>View all ${icon('chevron')}</span></div><div class="event"><span class="event-icon">${icon('bottle')}</span><div><b>Bottle feed</b><small>Iris · 4 fl oz</small></div><time>2:40 PM</time></div><div class="event"><span class="event-icon">${icon('diaper')}</span><div><b>Diaper change</b><small>Iris · Recorded</small></div><time>1:50 PM</time></div></section></div>${tabBar()}`;
}
function recordScreen() {
  return `<div class="app-scroll"><div class="app-top"><span>CARE JOURNAL</span><span class="glass-icon" aria-hidden="true">${icon('calendar')}</span></div><header class="app-heading"><span class="kicker">OCT 20 · IRIS</span><h2>Every moment, in place.</h2><p>Only events you chose to record.</p></header><div class="owner-switch"><span class="selected">Iris · Baby</span><span>Mom</span></div><div class="journal-summary"><span class="eyebrow">TODAY’S RECORDS</span><strong>3 <small>feeds</small></strong><span>Latest 2:40 PM · 4 fl oz</span></div>${statusBlock()}<section class="app-section"><div class="app-section-heading"><h3>Tuesday’s timeline</h3><span>Filter ${icon('chevron')}</span></div><div class="timeline"><div class="timeline-item"><time>2:40 PM</time><span class="event-icon">${icon('bottle')}</span><div><b>Bottle feed</b><small>Iris · 4 fl oz · Editable</small></div></div><div class="timeline-item"><time>1:50 PM</time><span class="event-icon">${icon('diaper')}</span><div><b>Diaper change</b><small>Iris · Recorded</small></div></div><div class="timeline-item"><time>11:40 AM</time><span class="event-icon">${icon('bottle')}</span><div><b>Formula feed</b><small>Iris · 3 fl oz</small></div></div><div class="timeline-item"><time>9:30 AM</time><span class="event-icon">${icon('sleep')}</span><div><b>Rest</b><small>Iris · 15 min</small></div></div></div></section></div>${tabBar()}`;
}
function assistantScreen() {
  const uncertain = state.result === 'indeterminate';
  const busy = state.result === 'analyzing';
  return `<div class="app-scroll"><div class="app-top"><span>HERE WITH YOU</span><span class="glass-icon" aria-hidden="true">${icon('record')}</span></div><header class="app-heading"><span class="kicker">MOMCOZY AI</span><h2>Let’s make sense of it.</h2><p>Context first. You choose the next step.</p></header><div class="user-note"><span>YOU SHARED</span><p>“Iris cried after her bottle feed.”</p></div><div class="ai-answer"><div class="ai-identity"><span class="ai-gem" aria-hidden="true"></span> A THOUGHT TO CONSIDER</div><h3>${busy?'Reviewing your recording…':uncertain?'I can’t tell from this recording alone.':'You could check whether Iris needs a diaper change.'}</h3><p>${busy?'I’ll show a result only when there is enough information.':uncertain?'More context about timing and recent care may help you decide what to do next.':'This is one possibility based on what you shared, not a diagnosis of the crying.'}</p><div class="source">Based on · Your description of a recent feed</div></div>${statusBlock()}<div class="next-step"><span class="step-icon">${icon('shield')}</span><div><b>What you can do next</b><p>Observe the diaper and the room. Add context if you want to keep exploring.</p></div></div><section class="app-section"><div class="app-section-heading"><h3>Common tools</h3></div>${quickCards()}</section></div>${tabBar()}`;
}
function iconStudies() {
  return [['bottle','Feed'],['diaper','Diaper'],['sound','Crying'],['sleep','Sleep'],['pump','Pump'],['camera','Photo'],['calendar','Schedule'],['ai','AI assist']].map(([g,n])=>`<div class="icon-sample"><span>${icon(g)}</span><b>${n}</b></div>`).join('');
}
function feedbackStudies() {
  return ['saved','local','failed','unknown','indeterminate'].map(k=>{const s=states[k];return `<article class="feedback ${s.kind}">${icon(s.icon)}<div><b>${s.headline}</b><span>${s.detail}</span></div></article>`}).join('');
}
function render(focusSelector) {
  const app = document.getElementById('board');
  app.innerHTML = `<div class="page-shell"><aside class="editorial"><div class="brand"><span class="brand-dot">m</span><span>momcozy <small>AGENT / STYLE STUDY</small></span></div><nav class="variant-links" aria-label="三个风格板">${compareLinks}</nav><div class="intro"><span class="serial">STYLE BOARD ${meta.number} / 03 · CS-0.3</span><h1>${meta.cn}<br><em>${meta.name}</em></h1><p class="premise">${meta.premise}</p><p class="description">${meta.material}</p><div class="palette"><i></i><i></i><i></i><i></i><i></i></div><div class="test-note"><b>测试关注</b><p>${meta.insight}</p></div></div><div class="editorial-foot">同一示例内容 · 相同状态语义<br>候选设计 · 未冻结 / 2026-10-20</div></aside><main class="board-main"><div class="board-top"><span>CAREFUL PRESENCE / MORE VITAL COLOR</span><span>可本地双击打开 · 内容为模拟</span></div><div class="headline"><div><span class="serial">THE EXPERIENCE IN CONTEXT</span><h2>让照护动作<br><em>有温度，也有答案。</em></h2></div><p>彩色光线为任务定调；玻璃只浮在导航与操作控件样式上。事实、来源和状态落在清楚的内容表面。</p></div><section class="workbench" aria-label="可切换的页面样张"><div class="preview-controls"><div role="group" aria-label="选择样张页面" class="screen-switch"><button type="button" data-page="home" aria-pressed="${state.screen==='home'}">Today</button><button type="button" data-page="records" aria-pressed="${state.screen==='records'}">Journal</button><button type="button" data-page="assistant" aria-pressed="${state.screen==='assistant'}">Momcozy AI</button></div><label class="state-picker">反馈状态 <select id="result" aria-label="选择反馈状态">${stateChoices[state.screen].map(k=>`<option value="${k}" ${k===state.result?'selected':''}>${states[k].label}</option>`).join('')}</select></label></div><div class="preview-area"><div class="ambient a1"></div><div class="ambient a2"></div><div class="preview-caption"><span>01 / PAGE STUDY</span><b>${meta.name}</b><small>390 × 844 · 缩比视图</small></div><div class="phone" lang="en"><div class="phone-status"><span>9:41</span><span aria-hidden="true">●●● ▰</span></div><div class="phone-body">${state.screen==='home'?homeScreen():state.screen==='records'?recordScreen():assistantScreen()}</div></div><div class="floating-label">${icon('shield')}<span>Clear states<br><b>Calm next steps</b></span></div></div></section><section class="specimens"><div class="specimen-title"><span class="serial">THE DESIGN LANGUAGE</span><h2>材质、语义、反馈</h2></div><div class="specimen-grid"><article class="specimen glass-study"><div class="specimen-kicker">01 · FUNCTIONAL GLASS</div><h3>浮在内容上方的控件</h3><div class="glass-demo"><div class="glass-orb"></div><div class="glass-pill">${icon('calendar')} Today, Oct 20 ${icon('chevron')}</div><div class="glass-mini">${icon('plus')}</div></div><p>导航、日期切换和临时操作使用玻璃。记录正文使用稳定表面，避免透过文字层。</p></article><article class="specimen icons-study"><div class="specimen-kicker">02 · SEMANTIC ICONS</div><h3>物件轮廓与文字成对</h3><div class="icons-grid">${iconStudies()}</div><p>从对象识别功能；色彩只辅助分类。AI 图标不代表医学判断。</p></article><article class="specimen status-study"><div class="specimen-kicker">03 · HONEST FEEDBACK</div><h3>结果后面有下一步</h3><div class="feedback-grid">${feedbackStudies()}</div><p>“已保存”“仅本地保存”“无法判断”各有不同语义，不靠颜色代替文字。</p></article></div></section><section class="test-strip"><div><span class="serial">TEST CONDITIONS</span><h3>同一组任务，比较三个方向</h3><p>观察：先看到什么？能否认出功能？是否理解保存与 AI 的边界？常用环境或低透明度下是否仍舒适？</p></div><div class="test-toggles"><label><input type="checkbox" id="opaque" ${state.opaque?'checked':''}> 减少透明度</label><label><input type="checkbox" id="quiet" ${state.quiet?'checked':''}> 减少动效</label></div></section><footer>CS-0.3 · ${meta.name} · Design candidate · Open <a href="index.html">test overview</a></footer></main></div>`;
  document.body.classList.toggle('opaque', state.opaque);
  document.body.classList.toggle('quiet', state.quiet);
  bind();
  if (focusSelector) document.querySelector(focusSelector)?.focus({ preventScroll: true });
}
function bind() {
  document.querySelectorAll('[data-page],[data-screen]').forEach(el => el.addEventListener('click', () => { state.screen = el.dataset.page || el.dataset.screen; state.result = 'normal'; render(el.dataset.page ? `[data-page="${state.screen}"]` : `[data-screen="${state.screen}"]`); }));
  document.getElementById('result').addEventListener('change', e => { state.result=e.target.value; render('#result'); });
  document.getElementById('opaque').addEventListener('change', e => { state.opaque=e.target.checked; render('#opaque'); });
  document.getElementById('quiet').addEventListener('change', e => { state.quiet=e.target.checked; render('#quiet'); });
}
render();
