const fs = require('node:fs');
const path = require('node:path');

const target = path.join(__dirname, 'index.html');
let html = fs.readFileSync(target, 'utf8');
function replaceOnce(pattern, replacement, name) {
  const matches = html.match(pattern);
  if (!matches || matches.length !== 1) throw new Error(`${name}: expected one match`);
  html = html.replace(pattern, replacement);
}

replaceOnce(/assets\/bloom\.css/g, 'assets/berry.css', 'style link');
replaceOnce(/Momcozy · AI 优先架构候选/g, 'Momcozy · 莓色留白 AI 候选', 'page title');
replaceOnce(/<meta name="theme-color" content="#fff9f8">/g, '<meta name="theme-color" content="#f8f4f2">', 'browser theme color');
replaceOnce(/AI FIRST \/ 1\.0/g, 'AI FIRST / 1.1', 'studio version');
replaceOnce(/<h2>Momcozy AI<\/h2>/g, '<h2>今天，从一件事开始</h2>', 'assistant heading');
replaceOnce(/<form id="chat-form" class="composer">[\s\S]*?<\/form>/g,
  '<form id="chat-form" class="composer">' +
  '<button type="button" class="icon-button composer-more" data-action="chat-more" aria-label="更多输入方式与功能"><i data-icon="plus"></i></button>' +
  '<label class="sr-only" for="chat-message">给 Momcozy AI 发消息</label>' +
  '<textarea id="chat-message" rows="1" placeholder="想聊什么，慢慢说…"></textarea>' +
  '<button type="button" class="icon-button composer-voice" id="quick-voice" data-action="voice" aria-label="快捷语音输入"><i data-icon="waveform"></i></button>' +
  '<button class="send-button primary" id="send-message" type="submit" aria-label="发送消息" hidden><i data-icon="arrow-up"></i></button>' +
  '<div id="attachments"></div></form>', 'chat composer');
replaceOnce(/<nav class="dock" aria-label="主导航">[\s\S]*?<\/nav>/g,
  '<nav class="dock" aria-label="切换页面">' +
  '<button data-go="assistant" aria-label="返回 Momcozy AI" hidden><span><canvas class="dock-companion" width="640" height="420" data-companion="ready" data-static="true" aria-hidden="true"></canvas></span><b>Momcozy AI</b></button>' +
  '<button data-go="home"><span><i data-icon="sun"></i></span><b>Today</b></button>' +
  '<button data-go="records"><span><i data-icon="journal"></i></span><b>记录</b></button>' +
  '</nav>', 'context dock');

fs.writeFileSync(target, html, 'utf8');
console.log('Migrated AI-1.1 index.html');
