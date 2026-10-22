const fs = require('node:fs');
const path = require('node:path');

const file = path.join(__dirname, 'index.html');
let html = fs.readFileSync(file, 'utf8');

function replaceOnce(before, after) {
  if (!html.includes(before)) throw new Error(`Missing source fragment: ${before.slice(0, 80)}`);
  html = html.replace(before, after);
}

replaceOnce('<span class="wordmark">momcozy</span><button class="icon-button profile-trigger" data-go="mine" aria-label="查看我的资料"><i data-icon="user"></i></button>', '<span class="wordmark">momcozy</span><span class="caption">TODAY</span>');

const homeStart = html.indexOf('<section class="page" id="home"');
const homeEnd = html.indexOf('<section class="page" id="records"', homeStart);
if (homeStart < 0 || homeEnd < 0) throw new Error('Home section not found');
let home = html.slice(homeStart, homeEnd);
const planStart = home.indexOf('<section class="module plan-module"');
const planEnd = home.indexOf('</section>', planStart);
const summaryStart = home.indexOf('<section class="module" aria-labelledby="summary-heading">');
if (planStart < 0 || planEnd < 0 || summaryStart < 0) throw new Error('Home sections not found');
const plan = home.slice(planStart, planEnd + '</section>'.length);
home = home.slice(0, planStart) + home.slice(planEnd + '</section>'.length);
const newSummaryStart = home.indexOf('<section class="module" aria-labelledby="summary-heading">');
home = home.slice(0, newSummaryStart) + plan + home.slice(newSummaryStart);
const recentStart = home.indexOf('<section class="module" aria-labelledby="recent-heading">');
const recentEnd = home.indexOf('</section>', recentStart);
if (recentStart < 0 || recentEnd < 0) throw new Error('Recent section not found');
home = home.slice(0, recentStart) + '<div id="recent" hidden></div>' + home.slice(recentEnd + '</section>'.length);
html = html.slice(0, homeStart) + home + html.slice(homeEnd);

const welcomeFragment = '<h3>今天，先从一件小事开始</h3><p>这些建议参考了你填写的资料与本机记录，可随时调整。</p><div id="ai-daily-plan"></div></div><div class="assistant-tools">';
replaceOnce(welcomeFragment, '<h3>今天，先从一件小事开始</h3><p>这些建议参考了你填写的资料与本机记录，可随时调整。</p></div><div id="ai-daily-plan" aria-label="今天的行动建议"></div><div class="assistant-tools">');

replaceOnce('<p class="eyebrow">YOUR DAY, AT A GLANCE</p>', '<p class="eyebrow">YOUR DAY, AT A GLANCE</p>');
html = html.replace('演示时间 2026-10-19', '演示时间 2026-10-19');
fs.writeFileSync(file, html, 'utf8');
console.log('Finalized AI-first candidate layout');
