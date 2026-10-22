/* Focused state test for a backgrounded long conversation crossing a local day. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const source = fs.readFileSync(path.join(__dirname, 'assets/app.js'), 'utf8');
function extract(name) {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`Missing ${name}`);
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`Unclosed ${name}`);
}

const viewport = {scrollTop: 520};
const fields = {
  '#journal-date': {value: '2026-10-20'},
  '#scroll': {scrollTop: 520},
  '#assistant-scroll': viewport
};
const stored = [];
const context = {
  clockDay: '2026-10-20',
  document: {hidden: true},
  localTimestamp: () => `${context.clockDay}T00:01`,
  localStorage: {setItem: (key, value) => stored.push([key, value])},
  $: selector => fields[selector],
  requestAnimationFrame: callback => callback(),
  cancelChatFollow: () => {},
  updateLatestButton: () => {},
  render: () => context.renderCount++,
  renderCount: 0
};
vm.createContext(context);
vm.runInContext(`
  let DAY='2026-10-20', NOW='2026-10-20T23:59', page='assistant';
  let seenDailyDays=['2026-10-20'], dailyGreetingVisible=false;
  let chatPinned=true, homeMode='normal', positions={home:520};
  const DAILY_ENTRY_KEY='test-daily-entry';
  ${['enterDailyGreeting', 'refreshLocalDay', 'revealDailyGreeting', 'updateLocalDay'].map(extract).join('\n')}
  this.inspect=()=>({DAY,seenDailyDays:[...seenDailyDays],dailyGreetingVisible,chatPinned});
`, context);

context.clockDay = '2026-10-21';
vm.runInContext('updateLocalDay()', context);
assert.equal(context.inspect().DAY, '2026-10-21');
assert.equal(context.inspect().seenDailyDays.includes('2026-10-21'), false);
assert.equal(context.inspect().dailyGreetingVisible, false);

context.document.hidden = false;
vm.runInContext('updateLocalDay()', context);
assert.equal(context.inspect().seenDailyDays.includes('2026-10-21'), true);
assert.equal(context.inspect().dailyGreetingVisible, true);
assert.equal(viewport.scrollTop, 0);
assert.equal(context.inspect().chatPinned, false);
assert.equal(context.renderCount, 2);

viewport.scrollTop = 410;
vm.runInContext('updateLocalDay()', context);
assert.equal(context.renderCount, 2);
assert.equal(viewport.scrollTop, 410);
assert.equal(stored.length, 1);

context.clockDay = '2026-10-22';
vm.runInContext('updateLocalDay()', context);
assert.equal(context.inspect().seenDailyDays.includes('2026-10-22'), true);
assert.equal(viewport.scrollTop, 0);
assert.equal(stored.length, 2);
console.log('Day rollover: hidden day change, visible reveal, same-day repeat and foreground change passed');
