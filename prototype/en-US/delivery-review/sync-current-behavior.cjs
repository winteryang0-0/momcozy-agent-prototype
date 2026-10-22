const fs = require('node:fs');
const path = require('node:path');

const sourcePath = path.resolve(__dirname, '../../current/assets/app.js');
const targetPath = path.resolve(__dirname, '../assets/app.js');
const source = fs.readFileSync(sourcePath, 'utf8');
let target = fs.readFileSync(targetPath, 'utf8');

function replaceSection(sourceStart, sourceEnd, targetStart = sourceStart, targetEnd = sourceEnd, adapt = text => text) {
  const a = source.indexOf(sourceStart);
  const b = source.indexOf(sourceEnd, a + sourceStart.length);
  const c = target.indexOf(targetStart);
  const d = target.indexOf(targetEnd, c + targetStart.length);
  if ([a, b, c, d].some(index => index < 0)) throw new Error(`Missing section: ${sourceStart}`);
  target = target.slice(0, c) + adapt(source.slice(a, b)) + target.slice(d);
  console.log(`Synced ${sourceStart}`);
}

replaceSection('function scrollChatTask()', 'function go(next)');
replaceSection('function clearInlineSaveTimers(', 'function taskButton(', 'function archiveTask()');
replaceSection('function selectInlineRecord(', 'function inlineButton(');
replaceSection('function inlineRecordCard(', 'function careStateId(');
replaceSection('function renderCareCard(', 'function renderTask(', undefined, undefined, block => {
  const sourceSnippet = "<span>'+safe(t.mediaMeta?.name||'照片已拍摄')+'</span>";
  const localizedSnippet = "<span data-user-content>'+safe(t.mediaMeta?.name||'Photo captured')+'</span>";
  if (!block.includes(sourceSnippet)) throw new Error('Photo filename markup changed');
  return block.replace(sourceSnippet, localizedSnippet);
});

const taskNames = "const taskNames={ready:'Ready to start',starting:'Opening microphone',camera:'Opening camera',cameraReady:'Camera ready',listening:'Recording',finishing:'Finishing recording',captured:'Review captured media',captureError:'Capture unavailable',processing:'Reviewing what you shared',indeterminate:'No clear result yet',result:'What we know so far',timeout:'Taking longer than expected',offline:'Unable to continue right now',cancelled:'Canceled',interrupted:'Paused',speaking:'Reading aloud',picker:'Choose an entry type',editing:'Enter care details',saving:'Saving',success:'Entry saved'};";
target = target.replace(/const taskNames=\{[^\r\n]+\};/, taskNames);

fs.writeFileSync(targetPath, target, 'utf8');
