/* One-time, auditable migration from the preserved relayout-15 snapshot. */
const fs = require('node:fs');
const path = require('node:path');

const file = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(file, 'utf8');

function replaceBetween(start, end, replacement) {
  const from = html.indexOf(start);
  const to = html.indexOf(end, from + start.length);
  if (from < 0 || to < 0) throw new Error(`Missing HTML boundary: ${start} / ${end}`);
  html = html.slice(0, from) + replacement + html.slice(to);
}

replaceBetween('<section class="page" id="home"', '<section class="page" id="records"', '');

replaceBetween('<section class="page" id="records"', '<section class="page" id="assistant"', `
<section class="page journal-page" id="records" data-page-id="PAGE-records" hidden>
  <header class="topbar journal-topbar">
    <button class="icon-button back-home" data-go="home" aria-label="返回 Momcozy AI 首页"><i data-icon="chevron-left"></i></button>
    <span class="eyebrow">CARE JOURNAL</span>
    <label class="journal-calendar" aria-label="选择记录日期"><i data-icon="calendar"></i><input id="journal-date" type="date" aria-label="记录日期" value="2026-10-20"></label>
  </header>
  <div class="journal-heading">
    <p class="eyebrow" id="journal-context">10 月 19 日 · 宝宝</p>
    <h2>每个瞬间，各归其位。</h2>
    <p>只呈现你选择记录的照护。</p>
  </div>
  <div class="segments owner-tabs journal-owner-tabs" aria-label="记录对象">
    <button data-owner="宝宝" aria-pressed="true"><i data-icon="baby"></i><span id="journal-baby-label">宝宝</span></button>
    <button data-owner="妈妈" aria-pressed="false"><i data-icon="heart"></i>妈妈</button>
  </div>
  <section class="journal-summary content-surface" id="record-summary" aria-label="所选日期的记录摘要"></section>
  <div class="journal-timeline-heading"><h3 id="timeline-title">当天的时间线</h3><button class="text-button" data-action="record-filter" aria-haspopup="dialog">筛选<i data-icon="chevron-right"></i></button></div>
  <div id="record-list" class="journal-timeline" aria-live="polite"></div>
  <details class="record-more"><summary>更多记录分析 <i data-icon="chevron-right"></i></summary><div id="record-links" class="insight-links"></div></details>
</section>
`);

replaceBetween('<section class="page" id="assistant"', '<section class="page" id="mine"', `
<section class="page conversation-home" id="assistant" data-page-id="PAGE-home">
  <header class="topbar assistant-topbar home-topbar">
    <button class="icon-button main-menu-button" data-action="main-menu" aria-label="打开主菜单" aria-haspopup="dialog"><i data-icon="menu"></i></button>
    <h2 class="assistant-title" tabindex="-1">Momcozy AI</h2>
    <button class="icon-button sound-button" data-action="sound" aria-label="声音与播报说明"><i data-icon="volume"></i></button>
  </header>
  <div class="conversation-home-head" id="conversation-home-head" hidden>
    <span class="today-chip">Today</span>
    <button class="compact-advice" data-action="advice-detail" aria-label="查看完整今日行动建议"><span id="compact-advice">今日行动建议</span><i data-icon="chevron-right"></i></button>
  </div>
  <div class="assistant-scroll" id="assistant-scroll" role="region" aria-label="聊天内容" tabindex="0">
    <div class="assistant-intro" id="assistant-intro">
      <div class="assistant-hero"><canvas width="640" height="420" data-companion="ready" data-loop="true" role="img" aria-label="Momcozy AI，准备倾听"></canvas><p id="assistant-context">为妈妈和小满，留一份从容</p></div>
      <div class="today-intro"><span class="today-chip">Today</span><span class="caption">从今天开始</span></div>
      <div id="daily-advice" class="daily-advice" aria-live="polite"></div>
      <div class="assistant-tools" aria-label="可开始的照护功能"><button data-action="record"><i data-icon="journal"></i>记一笔</button><button data-task="cry"><i data-icon="waveform"></i>听哭闹</button><button data-task="poop"><i data-icon="diaper"></i>看便便</button></div>
    </div>
    <div id="task-slot"></div><div id="conversation" aria-label="连续对话"></div><div id="chat-status" aria-live="polite"></div>
  </div>
  <div class="composer-area"><button type="button" class="latest-message" id="latest-message" data-action="chat-latest" hidden><i data-icon="arrow-up"></i>回到最新消息</button><p class="voice-status" id="voice-status" role="status" hidden><i data-icon="waveform"></i>正在转写演示 · 松开直接填入，移出取消</p><form id="chat-form" class="composer"><div class="composer-main"><button type="button" class="icon-button" data-action="chat-more" aria-label="添加照片或附件"><i data-icon="plus"></i></button><label class="sr-only" for="chat-message">给 Momcozy AI 发消息</label><textarea id="chat-message" rows="1" placeholder="想聊什么，慢慢说…"></textarea><button type="button" class="icon-button" id="quick-voice" aria-label="长按语音输入，松开后示例转写直接进入输入框"><i data-icon="waveform"></i></button><button class="send-button primary" id="send-message" type="submit" aria-label="发送消息" hidden><i data-icon="arrow-up"></i></button></div><div id="attachments"></div></form><p class="caption center">AI 内容仅为交互演示，不提供诊断。</p></div>
</section>
`);

html = html.replace('<header class="topbar"><span class="eyebrow">YOUR CARE SPACE</span>', '<header class="topbar mine-topbar"><button class="icon-button back-home" data-go="home" aria-label="返回 Momcozy AI 首页"><i data-icon="chevron-left"></i></button><span class="eyebrow">YOUR CARE SPACE</span>');

replaceBetween('<nav class="dock"', '<div id="toast"', '<div class="record-cta" id="record-cta" hidden><button class="primary" data-action="record"><i data-icon="plus"></i>新建记录</button></div>');

html = html.replace('Momcozy · 莓色留白排版候选', 'Momcozy · 对话式首页候选 16');
html = html.replace('<link rel="stylesheet" href="assets/berry.css">', '<link rel="stylesheet" href="assets/berry.css"><link rel="stylesheet" href="assets/layout-16.css">');
html = html.replace('HOME / 1.0', 'HOME / 1.1').replace('从今天的概况开始。<br>记录、了解，再继续生活。', '从一条建议或一句话开始。<br>记录、回看、继续照护。');

fs.writeFileSync(file, html, 'utf8');
console.log('Updated index.html for conversation home and journal timeline');
