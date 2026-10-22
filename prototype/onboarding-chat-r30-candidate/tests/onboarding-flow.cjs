const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../assets/onboarding-chat-r30.js'), 'utf8');
const roles = ['妈妈', '爸爸', '爷爷/奶奶', '外公/外婆', '其他成员'];
const stages = ['孕前', '孕期', '产后'];
const concerns = ['奶量够不够', '宝宝吃饱了吗', '宝宝为什么哭', '宝宝便便情况', '宝宝睡得好吗', '宝宝生长发育', '我的身体恢复', '情绪起伏与压力', '睡不够疲惫'];
let checks = 0;
function check(condition, message) { assert.ok(condition, message); checks++; }
function equal(actual, expected, message) { assert.equal(actual, expected, message); checks++; }
check(source.includes("if (id === 'age') return ['妈妈的年龄', '']"), 'age card uses the requested title');
check(source.includes('ob-stage-choices'), 'stage card uses the three-option row');
check(source.includes('data-ob-legacy-invalid'), 'number picker retains an invalid legacy value until the user changes it');
check(!source.includes('centerActiveCard'), 'onboarding does not force the active card to the center');
check(source.includes("return index === 0 ? '宝宝'"), 'first baby has no number');

function harness({ profile = {}, state = null, save = true, draftSave = true } = {}) {
  const body = { scrollTop: 0, scrollHeight: 900, isConnected: true, innerHTML: '', style: {}, querySelector: () => null };
  const error = { textContent: '' };
  const field = { setAttribute() {}, focus() {} };
  const ctx = {
    window: {},
    profiles: { baby: '宝宝', birth: '', momStage: '', focus: '', ...structuredClone(profile) },
    onboarding: state ? structuredClone(state) : { status: 'draft', flowVersion: 2, active: 'welcome', completed: [], draft: null },
    CARE_ROLES: roles,
    CARE_STAGES: stages,
    CARE_CONCERNS: concerns,
    profileInteger: (value, min, max) => value === '' || value == null || /^\d+$/.test(String(value)) && Number(value) >= min && Number(value) <= max,
    profileToday: () => '2026-10-22',
    safe: value => String(value ?? ''),
    icon: () => '',
    canvas: () => '',
    hydrate: () => {},
    requestAnimationFrame: () => {},
    CSS: { escape: value => value },
    structuredClone,
    sheet: { open: false },
    closeSheet: () => {},
    page: 'assistant',
    onboardingReturn: 'home',
    go: route => { ctx.lastRoute = route; },
    toast: message => { ctx.lastToast = message; },
    persist: () => save,
    storeOnboarding: () => { if (!draftSave) return false; ctx.persistedOnboarding = structuredClone(ctx.onboarding); return true; }
  };
  ctx.$ = selector => selector === '#onboarding-body' ? body : selector === '#onboarding-error' ? error : selector === '#ob-field' ? field : null;
  vm.runInNewContext(source, ctx, { filename: 'onboarding-chat-r30.js' });
  return { ctx, ob: ctx.window.MomcozyOnboarding, body, error };
}

function begin(h) {
  h.ob.start();
  equal(h.ctx.onboarding.active, 'welcome', 'the first screen is the conversation welcome');
  h.ob.next();
  equal(h.ctx.onboarding.active, 'services', 'service choices come first');
  h.ob.toggle('services', 'record');
  h.ob.next();
  equal(h.ctx.onboarding.active, 'concerns', 'concerns follow services');
  h.ob.next();
  equal(h.ctx.onboarding.active, 'role', 'identity follows concerns');
}

function choose(h, id, value, next) {
  equal(h.ctx.onboarding.active, id, 'expected card ' + id);
  h.ob.select(id, value);
  equal(h.ctx.onboarding.active, next, 'next card after ' + id);
}

function fill(h, id, value, next) {
  equal(h.ctx.onboarding.active, id, 'expected field ' + id);
  const match = id.match(/^baby(Weeks|Birth)-(\d+)$/);
  if (match) h.ctx.onboarding.draft.babies[Number(match[2])][match[1] === 'Weeks' ? 'weeks' : 'birth'] = value;
  else h.ctx.onboarding.draft[id] = value;
  h.ob.next();
  equal(h.ctx.onboarding.active, next, 'next card after ' + id);
}

const family = harness();
begin(family);
const roleInitial = family.body.innerHTML;
check(roleInitial.includes('data-value="妈妈"') && roleInitial.includes('data-value="other-group"'), 'role starts with mom and other members');
check(!roleInitial.includes('data-value="爸爸"'), 'specific family roles are initially hidden');
family.ob.select('role', 'other-group');
equal(family.ctx.onboarding.active, 'role', 'expanding other members does not submit the role');
check(family.body.innerHTML.includes('data-value="爸爸"'), 'expanded family options include dad');
choose(family, 'role', '妈妈', 'stage');
check(family.body.innerHTML.includes('ob-stage-choices'), 'three stages share the compact choice row');
choose(family, 'stage', '产后', 'age');
check(family.body.innerHTML.includes('妈妈的年龄'), 'age card says mom age');
check(family.body.innerHTML.includes('ob-number-picker'), 'age card uses the compact horizontal number picker');
check(!family.body.innerHTML.includes('选择数值'), 'numeric card removes select-value label');
family.ctx.onboarding.draft.age = '17';
family.ob.next();
equal(family.ctx.onboarding.active, 'age', 'age 17 is rejected');
check(family.error.textContent.includes('18–50'), 'age error explains the accepted range');
fill(family, 'age', '18', 'parity');
check(family.body.innerHTML.includes('data-ob-clear') && family.body.innerHTML.includes('>0</div>'), 'parity picker keeps omitted and zero as separate options');
family.ctx.onboarding.draft.parity = '7';
family.ob.next();
equal(family.ctx.onboarding.active, 'parity', 'parity 7 is rejected');
fill(family, 'parity', '0', 'babyWeeks-0');
equal(family.ctx.onboarding.draft.parity, '0', 'zero parity remains distinct from omitted parity');
check(family.body.innerHTML.includes('宝宝出生时'), 'first baby question has no numeric suffix');
family.ctx.onboarding.draft.babies[0].weeks = '36';
family.ob.next();
equal(family.ctx.onboarding.active, 'babyWeeks-0', 'birth week 36 is rejected');
fill(family, 'babyWeeks-0', '37', 'babyBirth-0');
family.ctx.onboarding.draft.babies[0].birth = '2026-10-23';
family.ob.next();
equal(family.ctx.onboarding.active, 'babyBirth-0', 'future birth date is rejected');
fill(family, 'babyBirth-0', '2026-10-01', 'more-0');
equal(family.ctx.onboarding.draft.babies.length, 1, 'one baby is the default before the follow-up');
choose(family, 'more-0', 'yes', 'babyWeeks-1');
fill(family, 'babyWeeks-1', '40', 'babyBirth-1');
fill(family, 'babyBirth-1', '2026-10-01', 'more-1');
choose(family, 'more-1', 'no', 'complete');
check(family.body.innerHTML.includes('<b>宝宝</b>') && family.body.innerHTML.includes('<b>宝宝 2</b>'), 'summary names first baby without number and distinguishes the second');
family.ob.finish();
equal(family.ctx.lastRoute, 'home', 'Let’s chat opens the existing home');
equal(family.ctx.profiles.babies.length, 2, 'both babies are saved');
equal(family.ctx.profiles.babies[0].birth, family.ctx.profiles.babies[1].birth, 'same-day births are allowed');
check(family.ctx.profiles.babies[0].id !== family.ctx.profiles.babies[1].id, 'babies have distinct IDs even with the same birthday');
equal(family.ctx.profiles.services[0], 'record', 'priority service is saved');

family.ob.start();
family.ob.edit('stage');
choose(family, 'stage', '孕期', 'age');
equal(family.ctx.onboarding.draft.babies.length, 3, 'changing to pregnancy adds the current fetus and preserves born children');
equal(family.ctx.onboarding.draft.babies[1].birth, '2026-10-01', 'older child birthday remains in the draft');
equal(family.ctx.onboarding.draft.babies[0].kind, 'unborn', 'the current pregnancy is the first baby in the draft');

const fullFamily = harness({ profile: { careRole: '妈妈', momStage: '产后', babyCount: 6,
  babies: Array.from({ length: 6 }, (_, index) => ({ id: 'existing-' + index, kind: 'born', birth: '2020-01-0' + (index + 1), weeks: '40' })) } });
fullFamily.ctx.onboarding.draft = fullFamily.ob.fromProfile();
fullFamily.ctx.onboarding.active = 'stage';
fullFamily.ctx.onboarding.completed = ['services', 'concerns', 'role'];
fullFamily.ob.select('stage', '孕期');
equal(fullFamily.ctx.onboarding.active, 'stage', 'pregnancy choice remains on stage card when six babies already exist');
equal(fullFamily.ctx.onboarding.draft.stage, '产后', 'stage is unchanged when the new pregnancy would exceed the limit');
equal(fullFamily.ctx.onboarding.draft.babies.map(baby => baby.id).join(','),
  Array.from({ length: 6 }, (_, index) => 'existing-' + index).join(','), 'all six existing baby IDs remain in order');
equal(fullFamily.ctx.onboarding.draft.babies[5].birth, '2020-01-06', 'last baby birth remains unchanged');
check(fullFamily.error.textContent.includes('6 位宝宝'), 'the limit explains why pregnancy cannot be selected');

const mixed = harness();
begin(mixed);
choose(mixed, 'role', '妈妈', 'stage');
choose(mixed, 'stage', '孕期', 'age');
fill(mixed, 'age', '30', 'parity');
fill(mixed, 'parity', '1', 'pregnancyWeeks');
fill(mixed, 'pregnancyWeeks', '22', 'more-0');
choose(mixed, 'more-0', 'yes', 'babyType-1');
choose(mixed, 'babyType-1', 'unborn', 'more-1');
choose(mixed, 'more-1', 'yes', 'babyType-2');
choose(mixed, 'babyType-2', 'born', 'babyWeeks-2');
fill(mixed, 'babyWeeks-2', '39', 'babyBirth-2');
fill(mixed, 'babyBirth-2', '2024-03-01', 'more-2');
choose(mixed, 'more-2', 'no', 'complete');
mixed.ob.finish();
equal(mixed.ctx.profiles.babies.map(baby => baby.kind).join(','), 'unborn,unborn,born', 'current twins and an older born child coexist');
equal(mixed.ctx.profiles.babies[2].birth, '2024-03-01', 'older child birth date survives completion');
equal(mixed.ctx.profiles.pregnancyWeeks, '22', 'current pregnancy week is stored once');

const reduction = harness();
begin(reduction);
reduction.ob.select('role', 'other-group');
equal(reduction.ctx.onboarding.active, 'role', 'other-member expansion remains on the role card');
choose(reduction, 'role', '爸爸', 'babyStatus');
choose(reduction, 'babyStatus', 'born', 'babyWeeks-0');
fill(reduction, 'babyWeeks-0', '', 'babyBirth-0');
fill(reduction, 'babyBirth-0', '', 'more-0');
choose(reduction, 'more-0', 'yes', 'babyWeeks-1');
fill(reduction, 'babyWeeks-1', '', 'babyBirth-1');
fill(reduction, 'babyBirth-1', '', 'more-1');
choose(reduction, 'more-1', 'no', 'complete');
reduction.ob.edit('more-0');
reduction.ob.select('more-0', 'no');
equal(reduction.ctx.onboarding.active, 'more-0', 'reducing saved baby count asks for confirmation');
check(Boolean(reduction.ctx.onboarding.pendingReduction), 'reduction confirmation is pending');
reduction.ob.cancelReduction('more-0');
equal(reduction.ctx.onboarding.draft.more[0], true, 'cancel retains the second baby');
reduction.ob.select('more-0', 'no');
reduction.ob.confirmReduction('more-0');
equal(reduction.ctx.onboarding.active, 'complete', 'confirmed reduction reaches completion');
reduction.ob.finish();
equal(reduction.ctx.profiles.babies.length, 1, 'only the selected baby is committed');

const legacy = harness({ profile: { careRole: '妈妈', momStage: '孕期', babyCount: 2, babies: [{ id: 'older', birth: '2023-04-01', weeks: '40' }] } });
const migrated = legacy.ob.fromProfile();
equal(migrated.babies.map(baby => baby.kind).join(','), 'unborn,born', 'old born profile is retained alongside current pregnancy');
equal(migrated.babies[1].birth, '2023-04-01', 'legacy birth date is retained');
const oldDraft = harness({ state: { status: 'paused', flowVersion: 1, draft: { role: '妈妈', stage: '孕期', babyCount: 2, babies: [{ birth: '2023-04-01', weeks: '40' }] } } });
oldDraft.ob.bootstrap();
equal(oldDraft.ctx.onboarding.draft.babies.map(baby => baby.kind).join(','), 'unborn,born', 'old-format draft keeps current and older babies separate');
equal(oldDraft.ctx.onboarding.active, 'welcome', 'old-format draft restarts from the new conversation welcome');

const committed = harness({ profile: { onboardingCommitToken: 'saved-commit', careRole: '爸爸', babyStatus: 'born' }, state: { status: 'draft', flowVersion: 2, commitToken: 'saved-commit', active: 'complete', completed: [], draft: null } });
committed.ob.bootstrap();
equal(committed.ctx.onboarding.status, 'completed', 'a committed profile repairs a failed draft-status write');

const saveFailure = harness({ save: false });
begin(saveFailure);
choose(saveFailure, 'role', '妈妈', 'stage');
choose(saveFailure, 'stage', '孕前', 'age');
fill(saveFailure, 'age', '', 'parity');
fill(saveFailure, 'parity', '', 'complete');
saveFailure.ob.finish();
equal(saveFailure.ctx.onboarding.status, 'draft', 'failed profile storage keeps onboarding editable');
equal(saveFailure.ctx.onboarding.active, 'complete', 'failed storage leaves Let’s chat available for retry');
check(saveFailure.error.textContent.includes('无法保存'), 'failed storage explains the retry');

const draftFailure = harness({ draftSave: false });
begin(draftFailure);
draftFailure.ob.leave();
equal(draftFailure.ctx.onboarding.status, 'draft', 'failed draft storage keeps onboarding active');
equal(draftFailure.ctx.lastRoute, 'onboarding', 'failed draft storage does not navigate home');
check(draftFailure.error.textContent.includes('无法保存'), 'failed draft storage shows an inline retry message');
draftFailure.ctx.storeOnboarding = () => { draftFailure.ctx.persistedOnboarding = structuredClone(draftFailure.ctx.onboarding); return true; };
draftFailure.ob.leave();
equal(draftFailure.ctx.onboarding.status, 'paused', 'successful retry stores a paused draft');
equal(draftFailure.ctx.lastRoute, 'assistant', 'successful retry returns to the page that opened onboarding');

console.log('Onboarding state checks passed: ' + checks);
