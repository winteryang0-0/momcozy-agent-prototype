const fs = require('node:fs');
const path = require('node:path');

const file = path.join(__dirname, 'index.html');
let html = fs.readFileSync(file, 'utf8');

function replaceOnce(before, after) {
  if (!html.includes(before)) throw new Error(`Missing source fragment: ${before.slice(0, 70)}`);
  html = html.replace(before, after);
}

replaceOnce('href="#/home"', 'href="#/assistant"');
replaceOnce('HOME / 1.0', 'AI FIRST / 1.0');
replaceOnce('从今天的概况开始。<br>记录、了解，再继续生活。', '先进入一条持续的对话。<br>再查看今天与记录。');

const homeStart = html.indexOf('<section class="page" id="home"');
const homeEnd = html.indexOf('<section class="page" id="records"', homeStart);
if (homeStart < 0 || homeEnd < 0) throw new Error('Home section not found');
let home = html.slice(homeStart, homeEnd);
home = home.replace('<button class="identity" data-action="baby-profile">', '<div class="identity">')
  .replace('</span><i data-icon="chevron-right"></i></button>', '</span></div>');
home = home.replace('<button class="text-button" data-go="records">查看记录<i data-icon="chevron-right"></i></button>', '');
const quickStart = home.indexOf('<section class="module" aria-labelledby="quick-heading">');
const quickEnd = home.indexOf('<div id="resume-slot"></div>', quickStart);
if (quickStart < 0 || quickEnd < 0) throw new Error('Quick action block not found');
home = home.slice(0, quickStart)
  + '<section class="module plan-module" aria-labelledby="plan-heading"><div class="section-heading"><h3 id="plan-heading">今天的行动建议</h3><span class="caption">依据当前资料与本机记录</span></div><div id="daily-plan" aria-live="polite"></div></section><div id="resume-slot" hidden></div>'
  + home.slice(quickEnd + '<div id="resume-slot"></div>'.length);
const companionStart = home.indexOf('<button class="companion-link" data-go="assistant">');
if (companionStart < 0) throw new Error('Companion link not found');
const companionEnd = home.indexOf('</button>', companionStart);
home = home.slice(0, companionStart) + home.slice(companionEnd + '</button>'.length);
html = html.slice(0, homeStart) + home + html.slice(homeEnd);

const chatStart = html.indexOf('<section class="page" id="assistant"');
const chatEnd = html.indexOf('<section class="page" id="mine"', chatStart);
if (chatStart < 0 || chatEnd < 0) throw new Error('Assistant section not found');
let chat = html.slice(chatStart, chatEnd);
const topbarEnd = chat.indexOf('</header>');
if (topbarEnd < 0) throw new Error('Assistant header not found');
chat = chat.slice(0, chat.indexOf('<header class="topbar">'))
  + '<header class="topbar ai-topbar"><button class="icon-button profile-trigger" data-go="mine" aria-label="查看个人资料"><i data-icon="user"></i></button><span class="wordmark">momcozy AI</span><button class="icon-button mute-toggle" data-action="mute-toggle" aria-label="打开声音" aria-pressed="true" title="声音已关闭"><i data-icon="volume"></i><span class="mute-slash" aria-hidden="true"></span></button></header>'
  + chat.slice(topbarEnd + '</header>'.length);
chat = chat.replace('<h3>想从哪里说起？</h3><p>可以聊聊照护，也可以先记下一件事。</p>', '<h3>今天，先从一件小事开始</h3><p>这些建议参考了你填写的资料与本机记录，可随时调整。</p><div id="ai-daily-plan"></div>');
chat = chat.replace('AI 内容仅为交互演示，不提供诊断。', '本地建议与 AI 回应仅为交互演示，不提供诊断。');
html = html.slice(0, chatStart) + chat + html.slice(chatEnd);

replaceOnce('<button data-go="home" aria-current="page">', '<button data-go="home">');
replaceOnce('<button data-go="assistant"><span>', '<button data-go="assistant" aria-current="page"><span>');

fs.writeFileSync(file, html, 'utf8');
console.log('Updated candidate index.html');
