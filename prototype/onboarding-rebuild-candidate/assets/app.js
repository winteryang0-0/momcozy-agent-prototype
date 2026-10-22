/* Independent onboarding candidate. It never reads or writes the current prototype's keys. */
(() => {
  'use strict';

  const STORAGE_KEY = 'momcozy-onboarding-rebuild-v1';
  const STEP_NAMES = ['identity', 'details', 'concerns', 'recommendations'];
  const ROLES = ['妈妈', '爸爸', '爷爷/奶奶', '外公/外婆', '其他成员'];
  const STAGES = ['孕前', '孕期', '产后'];
  const CONCERNS = ['奶量够不够', '宝宝吃饱了吗', '宝宝为什么哭', '宝宝便便情况', '宝宝睡得好吗', '宝宝生长发育', '我的身体恢复', '情绪起伏与压力', '睡不够疲惫'];
  const LIMITS = {
    age: [18, 50, '岁', '妈妈年龄'],
    parity: [0, 6, '次', '已分娩次数'],
    babyCount: [1, 6, '个', '宝宝数量'],
    pregnancyWeeks: [0, 45, '周', '当前孕周'],
    birthWeeks: [37, 50, '周', '出生孕周']
  };
  const TOOL_CONTENT = {
    record: { title: '持续记录与管理', description: '记录喂养、尿布与吸奶，回顾已记录的变化。', glyph: '▤', task: 'feed' },
    cry: { title: '哭声识别', description: '从「听哭闹」开始，采集后由你确认是否分析。', glyph: '〰', task: 'crying' },
    poop: { title: '便便识别', description: '从「看便便」开始，先确认照片，再进行观察。', glyph: '◇', task: 'diaper' }
  };
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const svgIcon = name => {
    const svg = document.createElementNS(['http:', '', 'www.w3.org', '2000', 'svg'].join('/'), 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.75');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = window.ONBOARDING_ICONS[name] || window.ONBOARDING_ICONS.baby;
    return svg;
  };
  function hydrateIcons() {
    $$('[data-icon]').forEach(element => {
      const icon = svgIcon(element.dataset.icon);
      element.replaceChildren(icon);
      element.removeAttribute('data-icon');
    });
  }
  const routeFor = step => '#/' + STEP_NAMES[step];
  const todayLocal = () => {
    const date = new Date();
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  };
  const freshDraft = () => ({
    role: '', stage: '', age: '', parity: '', pregnancyWeeks: '', babyCount: '',
    babies: [{ birth: '', weeks: '' }], activeBaby: 0, concerns: []
  });
  const integerInRange = (value, min, max) => value === '' || value == null ||
    (/^\d+$/.test(String(value)) && Number(value) >= min && Number(value) <= max);
  const asField = value => value == null ? '' : String(value).slice(0, 48);
  const normalizeDraft = value => {
    const draft = freshDraft();
    if (!value || typeof value !== 'object') return draft;
    draft.role = ROLES.includes(value.role) ? value.role : '';
    draft.stage = STAGES.includes(value.stage) ? value.stage : '';
    for (const key of ['age', 'parity', 'pregnancyWeeks', 'babyCount']) draft[key] = asField(value[key]);
    if (Array.isArray(value.babies) && value.babies.length) {
      draft.babies = value.babies.slice(0, 6).map(baby => ({
        birth: asField(baby?.birth), weeks: asField(baby?.weeks)
      }));
    }
    draft.activeBaby = Number.isInteger(value.activeBaby) ? Math.max(0, Math.min(5, value.activeBaby)) : 0;
    draft.concerns = Array.isArray(value.concerns) ? CONCERNS.filter(item => value.concerns.includes(item)) : [];
    return draft;
  };
  const freshState = () => ({ version: 1, status: 'draft', step: 0, maxStep: 0, draft: freshDraft(), profile: null });

  let state = freshState();
  let storageAvailable = true;
  let storageError = '';
  const activePanel = () => document.querySelector('.step-panel:not([hidden])');
  const activeError = () => activePanel()?.querySelector('[data-step-error]');
  const activeNext = () => activePanel()?.querySelector('[data-step-next]');
  const activeStorageAlert = () => activePanel()?.querySelector('[data-storage-alert]');
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.version === 1 && ['draft', 'paused', 'completed'].includes(parsed.status)) {
        state.status = parsed.status;
        state.step = Math.min(3, Math.max(0, Number(parsed.step) || 0));
        state.maxStep = Math.min(3, Math.max(state.step, Number(parsed.maxStep) || 0));
        state.draft = normalizeDraft(parsed.draft);
        state.profile = parsed.profile && typeof parsed.profile === 'object' ? parsed.profile : null;
        if (state.status === 'completed' && !state.profile) state = freshState();
      }
    }
  } catch {
    storageAvailable = false;
    storageError = 'read';
  }

  function showStorageStatus() {
    const alert = activeStorageAlert();
    if (alert) {
      alert.hidden = storageAvailable;
      alert.querySelector('[data-storage-message]').textContent = storageError === 'read'
        ? '暂时无法读取已保存的资料。为避免覆盖已有内容，请先恢复浏览器存储后重试。'
        : '浏览器暂时无法保存草稿。内容仍在当前页面，关闭前请重试。';
      alert.querySelector('[data-retry-save]').textContent = storageError === 'read' ? '重新读取' : '重试保存';
    }
    $('#paused-message').textContent = storageAvailable
      ? '已保存你刚才填写的内容，下次可以从同一步继续。'
      : '当前内容只保留在这个页面中。浏览器暂时无法保存草稿，请重试后再离开。';
  }
  function save() {
    if (storageError === 'read') {
      showStorageStatus();
      return false;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      storageAvailable = true;
      storageError = '';
    } catch {
      storageAvailable = false;
      storageError = 'write';
    }
    showStorageStatus();
    return storageAvailable;
  }
  function clearError() {
    $$('[data-step-error]').forEach(error => {
      error.hidden = true;
      error.textContent = '';
    });
    $$('[aria-invalid=true]').forEach(element => element.removeAttribute('aria-invalid'));
    $$('[data-error-linked]').forEach(element => {
      const errorId = element.dataset.errorLinked;
      element.setAttribute('aria-describedby', (element.getAttribute('aria-describedby') || '').split(/\s+/).filter(id => id && id !== errorId).join(' '));
      element.removeAttribute('data-error-linked');
    });
  }
  function showError(message, element) {
    const error = activeError();
    if (!error) return;
    error.textContent = message;
    error.hidden = false;
    if (element) {
      element.setAttribute('aria-invalid', 'true');
      element.setAttribute('aria-describedby', [element.getAttribute('aria-describedby'), error.id].filter(Boolean).join(' '));
      element.dataset.errorLinked = error.id;
      element.focus({ preventScroll: false });
    }
  }
  function setRoute(route, push) {
    if (location.hash === route) return;
    if (push) history.pushState(null, '', route);
    else history.replaceState(null, '', route);
  }
  function currentRoute() {
    return state.status === 'paused' ? '#/paused' :
      state.status === 'completed' ? '#/complete' : routeFor(state.step);
  }
  function renderProgress() {
    const active = state.status === 'draft' ? state.step : state.status === 'completed' ? 4 : state.step;
    $$('[data-progress]').forEach((element, index) => {
      element.classList.toggle('current', state.status === 'draft' && index === active);
      element.classList.toggle('done', index < active);
      if (state.status === 'draft' && index === active) element.setAttribute('aria-current', 'step');
      else element.removeAttribute('aria-current');
    });
  }
  function fillNumberSelect(element, config, value) {
    const [min, max, unit] = config;
    const raw = asField(value);
    element.replaceChildren();
    if (raw && !integerInRange(raw, min, max)) {
      element.add(new Option('原值 ' + raw + ' · 需修改', raw));
      element.setAttribute('aria-invalid', 'true');
    }
    element.add(new Option('暂不填', ''));
    for (let number = min; number <= max; number++) element.add(new Option(number + ' ' + unit, String(number)));
    element.value = raw;
    if (element.value !== raw) element.value = '';
  }
  function selectedStage() {
    return state.draft.role === '妈妈' ? state.draft.stage : '';
  }
  function visibleBabyCount() {
    const count = Number(state.draft.babyCount);
    return integerInRange(state.draft.babyCount, 1, 6) && count ? count : 1;
  }
  function ensureBaby(index) {
    while (state.draft.babies.length <= index) state.draft.babies.push({ birth: '', weeks: '' });
    return state.draft.babies[index];
  }
  function renderIdentity() {
    $$('[data-role]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.role === state.draft.role)));
    const mother = state.draft.role === '妈妈';
    $('#stage-choice').hidden = !mother;
    $$('[data-stage]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.stage === state.draft.stage)));
    $('#clear-stage').hidden = !state.draft.stage;
  }
  function renderBabyTabs() {
    const count = visibleBabyCount();
    state.draft.activeBaby = Math.min(count - 1, Math.max(0, state.draft.activeBaby));
    const active = state.draft.activeBaby;
    const tabs = $('#baby-tabs');
    tabs.replaceChildren();
    $('#baby-tabs-wrap').hidden = count < 2;
    for (let index = 0; index < count; index++) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = '宝宝 ' + (index + 1);
      button.dataset.babyIndex = String(index);
      button.dataset.controlId = 'CTRL-baby-tab-' + (index + 1);
      button.setAttribute('aria-pressed', String(index === active));
      tabs.append(button);
    }
    const baby = ensureBaby(active);
    $('#active-baby-title').textContent = '宝宝 ' + (active + 1);
    fillNumberSelect($('#birth-weeks'), LIMITS.birthWeeks, baby.weeks);
    $('#birth-date').max = todayLocal();
    $('#birth-date').value = baby.birth;
    if (baby.birth && $('#birth-date').value !== baby.birth) $('#birth-date').setAttribute('aria-invalid', 'true');
  }
  function renderDetails() {
    const stage = selectedStage();
    const prenatal = stage === '孕前';
    const pregnant = stage === '孕期';
    $('#preconception-note').hidden = !prenatal;
    $('#baby-section').hidden = prenatal;
    $('#pregnancy-fields').hidden = !pregnant;
    $('#born-fields').hidden = pregnant;
    $('#baby-description').textContent = pregnant ? '先记录孕期阶段，出生资料以后再补充。' : '按宝宝分别记录，稍后也能修改。';
    fillNumberSelect($('#age'), LIMITS.age, state.draft.age);
    fillNumberSelect($('#parity'), LIMITS.parity, state.draft.parity);
    fillNumberSelect($('#fetus-count'), LIMITS.babyCount, state.draft.babyCount);
    fillNumberSelect($('#pregnancy-weeks'), LIMITS.pregnancyWeeks, state.draft.pregnancyWeeks);
    fillNumberSelect($('#baby-count'), LIMITS.babyCount, state.draft.babyCount);
    renderBabyTabs();
  }
  function renderConcerns() {
    $$('[data-concern]').forEach(button => button.setAttribute('aria-pressed', String(state.draft.concerns.includes(button.dataset.concern))));
    const count = state.draft.concerns.length;
    $('#concern-count').textContent = count ? '已选择 ' + count + ' 项关注' : '尚未选择';
  }
  function recommendationOrder() {
    const scores = { record: 0, cry: 0, poop: 0 };
    for (const concern of state.draft.concerns) {
      if (concern === '宝宝为什么哭') scores.cry += 2;
      else if (concern === '宝宝便便情况') scores.poop += 2;
      else if (concern === '奶量够不够' || concern === '宝宝吃饱了吗') scores.record += 1;
    }
    return Object.keys(scores).sort((a, b) => scores[b] - scores[a]).map(id => ({ id, matched: scores[id] > 0 }));
  }
  function renderRecommendations() {
    $('#recommendation-lead').textContent = state.draft.concerns.length
      ? '根据你的关注点调整了顺序。所有工具仍可使用。'
      : '还未选择关注点，可以先认识这些照护工具。';
    const summary = state.draft.role + (selectedStage() ? ' · ' + selectedStage() : '');
    $('#review-line').textContent = summary + (state.draft.concerns.length ? ' · 关注 ' + state.draft.concerns.length + ' 项' : ' · 关注点暂未选择');
    const list = $('#recommendation-list');
    list.replaceChildren();
    for (const item of recommendationOrder()) {
      const tool = TOOL_CONTENT[item.id];
      const article = document.createElement('article');
      article.className = 'recommendation-card';
      article.dataset.task = tool.task;
      const icon = document.createElement('span');
      icon.className = 'recommendation-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.append(svgIcon(item.id === 'record' ? 'journal' : item.id === 'cry' ? 'waveform' : 'diaper'));
      const content = document.createElement('div');
      const title = document.createElement('h3');
      title.textContent = tool.title;
      const description = document.createElement('p');
      description.textContent = tool.description;
      content.append(title, description);
      if (item.matched) {
        const matched = document.createElement('small');
        matched.textContent = '与你的关注相关';
        content.append(matched);
      }
      article.append(icon, content);
      list.append(article);
    }
    const notes = [];
    if (['孕前', '孕期'].includes(selectedStage())) notes.push('哭声与便便工具可在宝宝出生后使用。');
    if (state.draft.concerns.some(concern => CONCERNS.indexOf(concern) >= 4)) notes.push('身体、情绪、睡眠与发育关注会保留为照护背景。');
    $('#recommendation-note').textContent = notes.join(' ');
    $('#recommendation-note').hidden = notes.length === 0;
  }
  function renderComplete() {
    const profile = state.profile || {};
    const entries = [
      ['照护身份', profile.careRole || '未填写'],
      ['妈妈阶段', profile.momStage || '未填写'],
      ['宝宝数量', profile.babyCount ? profile.babyCount + ' 个' : '未填写'],
      ['关注点', Array.isArray(profile.concerns) && profile.concerns.length ? profile.concerns.length + ' 项' : '未选择']
    ];
    const summary = $('#complete-summary');
    summary.replaceChildren();
    for (const [label, value] of entries) {
      const wrapper = document.createElement('div');
      const term = document.createElement('dt');
      term.textContent = label;
      const description = document.createElement('dd');
      description.textContent = value;
      wrapper.append(term, description);
      summary.append(wrapper);
    }
    $('#view-complete > p:not(.step-kicker)').textContent = storageAvailable
      ? '基础资料已保存在这个浏览器。你可以随时返回修改。'
      : '基础资料已更新，但浏览器存储尚未确认。请重试保存。';
  }
  function render({ focus = false, route = true, push = false } = {}) {
    const current = state.status === 'draft' ? 'step-' + STEP_NAMES[state.step] :
      state.status === 'paused' ? 'view-paused' : 'view-complete';
    $$('.step-panel, .result-panel').forEach(panel => { panel.hidden = panel.id !== current; });
    renderProgress();
    showStorageStatus();
    clearError();
    if (state.status === 'draft') {
      if (state.step === 0) renderIdentity();
      if (state.step === 1) renderDetails();
      if (state.step === 2) renderConcerns();
      if (state.step === 3) renderRecommendations();
    } else if (state.status === 'completed') renderComplete();
    if (route) setRoute(currentRoute(), push);
    if (focus) {
      window.scrollTo(0, 0);
      $('#' + current + ' h1').focus({ preventScroll: true });
    }
  }
  function validBirth(value) {
    if (!value) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value > todayLocal()) return false;
    const parsed = new Date(value + 'T12:00:00Z');
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }
  function fieldError(name, config, value, element) {
    if (integerInRange(value, config[0], config[1])) return false;
    showError(config[3] + '仅支持 ' + config[0] + '–' + config[1] + config[2] + '；请选择范围内整数，或暂不填。', element);
    return true;
  }
  function validateActiveBirth() {
    if (selectedStage() === '孕前' || selectedStage() === '孕期') return true;
    const input = $('#birth-date');
    const baby = ensureBaby(state.draft.activeBaby);
    if (input.validity.badInput || !validBirth(input.value || baby.birth)) {
      showError('请检查宝宝 ' + (state.draft.activeBaby + 1) + ' 的出生日期；不能晚于今天，也可以留空。', input);
      return false;
    }
    return true;
  }
  function validateDetails() {
    const draft = state.draft;
    if (fieldError('age', LIMITS.age, draft.age, $('#age'))) return false;
    if (fieldError('parity', LIMITS.parity, draft.parity, $('#parity'))) return false;
    if (selectedStage() === '孕前') return true;
    if (fieldError('babyCount', LIMITS.babyCount, draft.babyCount, selectedStage() === '孕期' ? $('#fetus-count') : $('#baby-count'))) return false;
    if (selectedStage() === '孕期') return !fieldError('pregnancyWeeks', LIMITS.pregnancyWeeks, draft.pregnancyWeeks, $('#pregnancy-weeks'));
    if (!validateActiveBirth()) return false;
    const count = visibleBabyCount();
    for (let index = 0; index < count; index++) {
      const baby = ensureBaby(index);
      if (!integerInRange(baby.weeks, ...LIMITS.birthWeeks.slice(0, 2))) {
        state.draft.activeBaby = index;
        renderBabyTabs();
        return !fieldError('birthWeeks', LIMITS.birthWeeks, baby.weeks, $('#birth-weeks'));
      }
      if (!validBirth(baby.birth)) {
        state.draft.activeBaby = index;
        renderBabyTabs();
        showError('请检查宝宝 ' + (index + 1) + ' 的出生日期；不能晚于今天，也可以留空。', $('#birth-date'));
        return false;
      }
    }
    return true;
  }
  function validateCurrentStep() {
    clearError();
    if (state.step === 0 && !ROLES.includes(state.draft.role)) {
      showError('请先选择照护身份；其他资料可以稍后填写。', $('#role-options button'));
      return false;
    }
    if (state.step === 1 || state.step === 3) {
      if (!validateDetails()) {
        if (state.step === 3) {
          const invalidBaby = state.draft.activeBaby;
          state.step = 1;
          save();
          render({ focus: true });
          state.draft.activeBaby = invalidBaby;
          renderBabyTabs();
          validateDetails();
        }
        return false;
      }
    }
    return true;
  }
  function profileFromDraft() {
    const draft = state.draft;
    const stage = selectedStage();
    const born = stage !== '孕前' && stage !== '孕期';
    const count = visibleBabyCount();
    const babies = born ? Array.from({ length: count }, (_, index) => ({
      birth: ensureBaby(index).birth, weeks: ensureBaby(index).weeks
    })) : [];
    return {
      careRole: draft.role,
      momStage: stage,
      momAge: draft.age,
      parity: draft.parity,
      pregnancyWeeks: stage === '孕期' ? draft.pregnancyWeeks : '',
      babyCount: stage === '孕前' ? '' : draft.babyCount,
      babies,
      birth: babies[0]?.birth || '',
      birthWeeks: babies[0]?.weeks || '',
      concerns: [...draft.concerns],
      focus: draft.concerns.join('、')
    };
  }
  function finish() {
    if (!validateCurrentStep()) return;
    if (!storageAvailable && !save()) {
      showError('当前浏览器未能保存资料。请重试，或保持页面打开后再操作。', activeNext());
      return;
    }
    const previous = { status: state.status, profile: state.profile };
    state.status = 'completed';
    state.profile = profileFromDraft();
    if (!save()) {
      state.status = previous.status;
      state.profile = previous.profile;
      showError('当前浏览器未能保存资料。请重试，或保持页面打开后再操作。', activeNext());
      return;
    }
    render({ focus: true, push: true });
  }
  function next() {
    if (!validateCurrentStep()) return;
    if (state.step === 3) return finish();
    state.step++;
    state.maxStep = Math.max(state.maxStep, state.step);
    save();
    render({ focus: true, push: true });
  }
  function back() {
    if (state.step <= 0) return;
    state.step--;
    save();
    render({ focus: true, push: true });
  }
  function pause() {
    clearError();
    if (!storageAvailable && !save()) {
      showError('当前内容尚未保存，恢复浏览器存储后再选择稍后设置。');
      return;
    }
    state.status = 'paused';
    if (!save()) {
      state.status = 'draft';
      showError('当前内容尚未保存，恢复浏览器存储后再选择稍后设置。');
      return;
    }
    render({ focus: true, push: true });
  }
  function resume(first = false) {
    state.status = 'draft';
    if (first) state.step = 0;
    save();
    render({ focus: true, push: true });
  }
  function syncRoute() {
    const target = location.hash.replace(/^#\//, '');
    const step = STEP_NAMES.indexOf(target);
    if (state.status === 'draft' && step >= 0 && step <= state.maxStep && Math.abs(step - state.step) === 1) {
      if (step > state.step && !validateCurrentStep()) {
        setRoute(currentRoute(), false);
        return;
      }
      state.step = step;
      save();
      render({ focus: true, route: false });
    } else if (location.hash !== currentRoute()) {
      setRoute(currentRoute(), false);
    }
  }

  $$('[data-step-next]').forEach(button => button.addEventListener('click', next));
  $$('[data-step-back]').forEach(button => button.addEventListener('click', back));
  $$('[data-step-later]').forEach(button => button.addEventListener('click', pause));
  $('#resume').addEventListener('click', () => resume(false));
  $('#restart-from-first').addEventListener('click', () => resume(true));
  $('#edit-profile').addEventListener('click', () => resume(true));
  $$('[data-retry-save]').forEach(button => button.addEventListener('click', () => {
    if (storageError === 'read') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (!parsed || parsed.version !== 1 || !['draft', 'paused', 'completed'].includes(parsed.status)) {
            throw new Error('invalid stored onboarding state');
          }
          state.status = parsed.status;
          state.step = Math.min(3, Math.max(0, Number(parsed.step) || 0));
          state.maxStep = Math.min(3, Math.max(state.step, Number(parsed.maxStep) || 0));
          state.draft = normalizeDraft(parsed.draft);
          state.profile = parsed.profile && typeof parsed.profile === 'object' ? parsed.profile : null;
          if (state.status === 'completed' && !state.profile) throw new Error('missing saved profile');
        }
        storageError = '';
        storageAvailable = true;
        render({ focus: true });
      } catch {
        storageError = 'read';
        storageAvailable = false;
        showStorageStatus();
      }
    } else {
      if (save()) clearError();
    }
  }));
  $('#role-options').addEventListener('click', event => {
    const button = event.target.closest('[data-role]');
    if (!button) return;
    state.draft.role = button.dataset.role;
    save();
    clearError();
    renderIdentity();
  });
  $('.stage-grid').addEventListener('click', event => {
    const button = event.target.closest('[data-stage]');
    if (!button) return;
    state.draft.stage = button.dataset.stage;
    save();
    renderIdentity();
  });
  $('#clear-stage').addEventListener('click', () => {
    state.draft.stage = '';
    save();
    renderIdentity();
  });
  const simpleFields = {
    age: 'age', parity: 'parity', 'fetus-count': 'babyCount',
    'baby-count': 'babyCount', 'pregnancy-weeks': 'pregnancyWeeks'
  };
  for (const [id, field] of Object.entries(simpleFields)) {
    $('#' + id).addEventListener('change', event => {
      state.draft[field] = event.target.value;
      if (field === 'babyCount') renderBabyTabs();
      clearError();
      save();
    });
  }
  $('#birth-weeks').addEventListener('change', event => {
    ensureBaby(state.draft.activeBaby).weeks = event.target.value;
    clearError();
    save();
  });
  $('#birth-date').addEventListener('change', event => {
    ensureBaby(state.draft.activeBaby).birth = event.target.value;
    clearError();
    save();
  });
  $('#baby-tabs').addEventListener('click', event => {
    const button = event.target.closest('[data-baby-index]');
    if (!button) return;
    clearError();
    if (!validateActiveBirth()) return;
    state.draft.activeBaby = Number(button.dataset.babyIndex);
    save();
    renderBabyTabs();
    $('#baby-tabs [data-baby-index="' + state.draft.activeBaby + '"]').focus({ preventScroll: true });
  });
  $$('.concern-grid').forEach(group => group.addEventListener('click', event => {
    const button = event.target.closest('[data-concern]');
    if (!button) return;
    const concern = button.dataset.concern;
    state.draft.concerns = state.draft.concerns.includes(concern)
      ? state.draft.concerns.filter(item => item !== concern)
      : CONCERNS.filter(item => item === concern || state.draft.concerns.includes(item));
    save();
    renderConcerns();
  }));
  window.addEventListener('popstate', syncRoute);
  window.addEventListener('hashchange', syncRoute);

  hydrateIcons();
  render({ route: false });
  if (location.hash && location.hash !== currentRoute()) syncRoute();
  else setRoute(currentRoute(), false);
})();
