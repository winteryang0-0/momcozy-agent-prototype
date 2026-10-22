const fs = require('node:fs');
const path = require('node:path');

const target = path.join(__dirname, 'assets/app.js');
let js = fs.readFileSync(target, 'utf8');
function replaceOnce(before, after, name) {
  const start = js.indexOf(before);
  if (start < 0 || js.indexOf(before, start + before.length) >= 0) throw new Error(`${name}: expected one match`);
  js = js.slice(0, start) + after + js.slice(start + before.length);
}
function replaceCount(before, after, expected, name) {
  const count = js.split(before).length - 1;
  if (count !== expected) throw new Error(`${name}: expected ${expected}, got ${count}`);
  js = js.split(before).join(after);
}

replaceOnce("const KEY='momcozy-ai-first-1.0';", "const KEY='momcozy-ai-first-1.1',PRIOR_KEY='momcozy-ai-first-1.0';", 'storage key');
replaceOnce("JSON.parse(localStorage.getItem('momcozy-home-1.0'))", "JSON.parse(localStorage.getItem(PRIOR_KEY)||localStorage.getItem('momcozy-home-1.0'))", 'profile import');
replaceOnce("JSON.parse(localStorage.getItem('momcozy-home-1.0-conversations'))", "JSON.parse(localStorage.getItem(PRIOR_KEY+'-conversations')||localStorage.getItem('momcozy-home-1.0-conversations'))", 'conversation import');
replaceOnce("const TYPES={'亲喂':'breast','配方奶':'formula','瓶喂母乳':'bottle','换尿布':'diaper','吸奶':'pump'};",
  "const TYPES={'亲喂':'breast','配方奶':'formula','瓶喂母乳':'bottle','换尿布':'diaper','吸奶':'pump'};\n/* Presentation-only keys from CS-0.5 Berry Poise. */\nconst RECORD_CATEGORY={'亲喂':'feed','配方奶':'feed','瓶喂母乳':'feed','换尿布':'diaper'};\nconst recordCategory=type=>RECORD_CATEGORY[type]||'neutral';", 'category mapping');
replaceOnce("$$('.dock button').forEach(b=>{b.removeAttribute('aria-current');if(b.dataset.go===page)b.setAttribute('aria-current','page');});",
  "$$('.dock button').forEach(b=>{b.hidden=b.dataset.go===page;});", 'context dock visibility');
replaceOnce("function updateComposer(){const hasContent=!!($('#chat-message').value.trim()||attachment);$('#quick-voice').hidden=hasContent;$('#send-message').hidden=!hasContent;$('#send-message').disabled=chatBusy;}",
  "function updateComposer(){const field=$('#chat-message');field.style.height='48px';field.style.height=Math.min(112,Math.max(48,field.scrollHeight))+'px';const hasContent=!!(field.value.trim()||attachment);$('#quick-voice').hidden=hasContent;$('#send-message').hidden=!hasContent;$('#send-message').disabled=chatBusy;}", 'compact composer');
replaceCount("tone:'apricot'", "tone:'berry'", 2, 'advice primary tone');
replaceCount("tone:'mint'", "tone:'soft'", 3, 'advice secondary tone');

for (const [before, after, name] of [
  ['<button class="record-row" data-record-id=', '<button class="record-row" data-category="${recordCategory(r.type)}" data-record-id=', 'record row category'],
  ['<button type="button" \'+attr+\'=\"\'+t+\'\">', '<button type="button" data-category="\'+recordCategory(t)+\'" \'+attr+\'=\"\'+t+\'\">', 'record menu category'],
  ['<div class="record-form-heading"><span class="icon-tile">', '<div class="record-form-heading" data-category="\'+recordCategory(type)+\'"><span class="icon-tile">', 'record form category'],
  ['<section class="task-card inline-record-card" data-task-id="\'+t.id+\'"', '<section class="task-card inline-record-card" data-category="\'+recordCategory(t.type)+\'" data-task-id="\'+t.id+\'"', 'inline task category'],
  ['<section class="task-card" data-task-id="${t.id}"', '<section class="task-card" data-category="${cry?\'crying\':\'diaper\'}" data-task-id="${t.id}"', 'special task category'],
  ['<div class="record-row"><span class="icon-tile">${icon(TYPES[r.type])}', '<div class="record-row" data-category="${recordCategory(r.type)}"><span class="icon-tile">${icon(TYPES[r.type])}', 'sync row category'],
]) replaceOnce(before, after, name);

fs.writeFileSync(target, js, 'utf8');
console.log('Migrated AI-1.1 app.js');
