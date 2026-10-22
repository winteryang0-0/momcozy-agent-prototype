/* Conversational first-use profile flow. Loaded before app.js; called after app state exists. */
window.MomcozyOnboarding = (() => {
  const VERSION = 2;
  const MAX_BABIES = 6;
  const SERVICES = [
    { id: 'record', title: '持续记录与管理', description: '记录喂养、尿布与吸奶', icon: 'journal' },
    { id: 'cry', title: '听哭闹', description: '留意哭声与照护线索', icon: 'waveform' },
    { id: 'poop', title: '看便便', description: '观察宝宝便便情况', icon: 'diaper' }
  ];
  const CONCERN_ICONS = ['bottle', 'baby-satisfied', 'waveform', 'diaper', 'moon', 'growth', 'recovery', 'emotion', 'rest'];

  function newBaby(kind = 'born', id) {
    return { id: id || 'baby-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7), kind, birth: '', weeks: '' };
  }

  function normalizeBaby(value, index, defaultKind) {
    const baby = value && typeof value === 'object' ? value : {};
    return {
      id: typeof baby.id === 'string' && baby.id ? baby.id : 'baby-' + (index + 1),
      kind: ['born', 'unborn'].includes(baby.kind) ? baby.kind : defaultKind,
      birth: typeof baby.birth === 'string' ? baby.birth : '',
      weeks: baby.weeks == null ? '' : String(baby.weeks)
    };
  }

  function fromProfile() {
    const role = CARE_ROLES.includes(profiles.careRole) ? profiles.careRole : '';
    const stage = CARE_STAGES.includes(profiles.momStage) ? profiles.momStage : '';
    const original = Array.isArray(profiles.babies) && profiles.babies.length
      ? profiles.babies
      : (profiles.birth || profiles.birthWeeks ? [{ birth: profiles.birth || '', weeks: profiles.birthWeeks || '' }] : []);
    let babies = original.slice(0, MAX_BABIES).map((baby, index) => normalizeBaby(baby, index, baby?.birth || baby?.weeks ? 'born' : stage === '孕期' ? 'unborn' : 'born'));
    const legacyCount = Math.min(MAX_BABIES, Math.max(0, Number(profiles.babyCount) || 0));
    const expecting = role === '妈妈'
      ? stage === '孕期'
      : role ? profiles.babyStatus === 'unborn' : stage === '孕期' || profiles.babyStatus === 'unborn';
    if (expecting) {
      const born = babies.filter(baby => baby.kind === 'born');
      const unborn = babies.filter(baby => baby.kind === 'unborn');
      const expectedCount = Math.max(1, legacyCount - born.length);
      while (unborn.length < expectedCount && born.length + unborn.length < MAX_BABIES) {
        unborn.push(newBaby('unborn', 'expected-' + (unborn.length + 1)));
      }
      babies = [...unborn, ...born];
    } else {
      while (babies.length < legacyCount) babies.push(newBaby('born', 'baby-' + (babies.length + 1)));
    }
    const more = {};
    babies.forEach((_, index) => { if (index < babies.length - 1) more[index] = true; });
    if (babies.length) more[babies.length - 1] = false;
    return {
      services: Array.isArray(profiles.services) ? SERVICES.map(item => item.id).filter(id => profiles.services.includes(id)) : [],
      concerns: Array.isArray(profiles.concerns) ? CARE_CONCERNS.filter(item => profiles.concerns.includes(item)) : [],
      role, stage,
      babyStatus: ['born', 'unborn'].includes(profiles.babyStatus) ? profiles.babyStatus : babies.some(baby => baby.kind === 'unborn') ? 'unborn' : babies.some(baby => baby.kind === 'born') ? 'born' : '',
      age: profiles.momAge == null ? '' : String(profiles.momAge),
      parity: profiles.parity == null ? '' : String(profiles.parity),
      pregnancyWeeks: profiles.pregnancyWeeks == null ? '' : String(profiles.pregnancyWeeks),
      babies, more
    };
  }

  function normalizeDraft(value) {
    const base = fromProfile();
    if (!value || typeof value !== 'object') return base;
    const draft = { ...base, ...value };
    draft.services = Array.isArray(value.services) ? SERVICES.map(item => item.id).filter(id => value.services.includes(id)) : base.services;
    draft.concerns = Array.isArray(value.concerns) ? CARE_CONCERNS.filter(item => value.concerns.includes(item)) : base.concerns;
    draft.babies = (Array.isArray(value.babies) ? value.babies : base.babies).slice(0, MAX_BABIES)
      .map((baby, index) => normalizeBaby(baby, index,
        baby?.birth || baby?.weeks ? 'born' : draft.stage === '孕期' ? 'unborn' : 'born'));
    const hasModernBabies = Array.isArray(value.babies) && value.babies.some(baby => baby && typeof baby === 'object' && 'kind' in baby);
    const requested = hasModernBabies ? 0 : Math.min(MAX_BABIES, Math.max(0, Number(value.babyCount) || 0));
    while (draft.babies.length < requested) draft.babies.push(newBaby(draft.stage === '孕期' ? 'unborn' : 'born', 'baby-' + (draft.babies.length + 1)));
    if (!hasModernBabies && draft.role === '妈妈' && draft.stage === '孕期') {
      const born = draft.babies.filter(baby => baby.kind === 'born');
      const unborn = draft.babies.filter(baby => baby.kind === 'unborn');
      if (!unborn.length) unborn.push(newBaby('unborn', 'expected-1'));
      draft.babies = [...unborn, ...born].slice(0, MAX_BABIES);
    }
    draft.more = value.more && typeof value.more === 'object' ? { ...value.more } : { ...base.more };
    if (!value.more && draft.babies.length > 1) draft.babies.forEach((_, index) => { draft.more[index] = index < draft.babies.length - 1; });
    for (const key of ['age', 'parity', 'pregnancyWeeks']) draft[key] = draft[key] == null ? '' : String(draft[key]);
    return draft;
  }

  function bootstrap() {
    if (!onboarding || typeof onboarding !== 'object') onboarding = { status: 'none' };
    if (onboarding.flowVersion !== VERSION) {
      const prior = onboarding;
      onboarding = {
        status: ['draft', 'paused', 'completed'].includes(prior.status) ? prior.status : 'none',
        flowVersion: VERSION,
        active: prior.status === 'completed' ? 'complete' : 'welcome',
        completed: [],
        draft: prior.draft ? normalizeDraft(prior.draft) : null,
        legacyDraft: prior.draft ? structuredClone(prior.draft) : null
      };
      if (onboarding.status === 'completed') {
        onboarding.draft = fromProfile();
        onboarding.completed = sequence(onboarding.draft).filter(id => id !== 'complete');
      }
    }
    if (onboarding.draft) onboarding.draft = normalizeDraft(onboarding.draft);
    if (!Array.isArray(onboarding.completed)) onboarding.completed = [];
    if (typeof onboarding.active !== 'string') onboarding.active = 'welcome';
    onboarding.commitToken ||= 'ob-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
    // A profile commit may succeed when the separate draft-status write fails.
    if (onboarding.status === 'draft' && profiles.onboardingCommitToken === onboarding.commitToken) {
      onboarding.status = 'completed';
      onboarding.active = 'complete';
      onboarding.completed = sequence(onboarding.draft || fromProfile()).filter(id => id !== 'complete');
    }
    if (onboarding.draft && onboarding.active !== 'welcome') {
      const ids = sequence(onboarding.draft);
      if (!ids.includes(onboarding.active)) onboarding.active = firstPending(ids);
    }
    return onboarding;
  }

  function context(draft) {
    if (!CARE_ROLES.includes(draft.role)) return '';
    if (draft.role === '妈妈') {
      if (!CARE_STAGES.includes(draft.stage)) return '';
      return draft.stage === '孕前' ? 'none' : draft.stage === '孕期' ? 'unborn' : 'born';
    }
    return ['unborn', 'born'].includes(draft.babyStatus) ? draft.babyStatus : '';
  }

  function ensurePrimary(draft, kind) {
    if (!draft.babies.length) draft.babies.push(newBaby(kind, 'baby-1'));
    draft.babies[0].kind = kind;
  }

  function moveToPregnancy(draft) {
    const existing = pregnancyCandidates(draft);
    const firstExpected = existing.find(baby => baby.kind === 'unborn');
    const current = firstExpected || newBaby('unborn', 'expected-' + Date.now());
    const others = existing.filter(baby => baby !== firstExpected);
    draft.babies = [current, ...others];
    draft.more = {};
    draft.babies.forEach((_, index) => { draft.more[index] = index < draft.babies.length - 1; });
  }

  function pregnancyCandidates(draft) {
    return draft.babies.filter(baby => baby && (
      baby.kind === 'unborn' || !String(baby.id).startsWith('expected-') || baby.birth || baby.weeks
    ));
  }

  function activeCount(draft) {
    const kind = context(draft);
    if (!kind || kind === 'none') return 0;
    let count = 1;
    while (count < MAX_BABIES && draft.more[count - 1] === true && draft.babies[count]) count++;
    return count;
  }

  function firstPending(ids) {
    return ids.find(id => id !== 'complete' && !onboarding.completed.includes(id)) || 'complete';
  }

  function sequence(draft) {
    const ids = ['services', 'concerns', 'role'];
    if (!CARE_ROLES.includes(draft.role)) return ids;
    if (draft.role === '妈妈') {
      ids.push('stage');
      if (!CARE_STAGES.includes(draft.stage)) return ids;
      ids.push('age', 'parity');
    } else {
      ids.push('babyStatus');
      if (!['unborn', 'born'].includes(draft.babyStatus)) return ids;
    }
    const kind = context(draft);
    if (kind === 'none') return [...ids, 'complete'];
    ensurePrimary(draft, kind);
    if (kind === 'unborn') ids.push('pregnancyWeeks');
    const count = activeCount(draft);
    for (let index = 0; index < count; index++) {
      if (!draft.babies[index]) draft.babies[index] = newBaby(kind, 'baby-' + (index + 1));
      if (index > 0 && kind === 'unborn') ids.push('babyType-' + index);
      const babyKind = index === 0 ? kind : kind === 'unborn' ? draft.babies[index].kind : 'born';
      if (babyKind === 'born') ids.push('babyWeeks-' + index, 'babyBirth-' + index);
      if (index < MAX_BABIES - 1) ids.push('more-' + index);
    }
    ids.push('complete');
    return ids;
  }

  function validBirth(value) {
    if (!value) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value > profileToday()) return false;
    const date = new Date(value + 'T12:00:00Z');
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }

  function babyLabel(index) {
    return index === 0 ? '宝宝' : '宝宝 ' + (index + 1);
  }

  function meta(id, draft) {
    if (id === 'services') return ['先从哪些服务开始？', ''];
    if (id === 'concerns') return ['最近最关心什么？', ''];
    if (id === 'role') return ['你会以什么身份照护宝宝？', ''];
    if (id === 'stage') return ['你现在处在哪个阶段？', ''];
    if (id === 'babyStatus') return ['宝宝现在是否已经出生？', ''];
    if (id === 'age') return ['妈妈的年龄', ''];
    if (id === 'parity') return ['妈妈经历过几次分娩？', '多胎分娩算 1 次。'];
    if (id === 'pregnancyWeeks') return ['宝宝目前是第几孕周？', ''];
    const index = Number(id.split('-')[1]);
    const babyName = babyLabel(index) + (index > 0 ? ' ' : '');
    if (id.startsWith('babyType-')) return [babyName + '现在是什么状态？', ''];
    if (id.startsWith('babyWeeks-')) return [babyName + '出生时是第几孕周？', ''];
    if (id.startsWith('babyBirth-')) return [babyName + '是哪天出生的？', ''];
    if (id.startsWith('more-')) return ['还有其他宝宝需要一起记录吗？', ''];
    return ['资料已经整理好', ''];
  }

  function answer(id, draft) {
    if (id === 'services') return draft.services.length ? SERVICES.filter(item => draft.services.includes(item.id)).map(item => item.title).join('、') : '暂不选择';
    if (id === 'concerns') return draft.concerns.length ? draft.concerns.join('、') : '暂不选择';
    if (id === 'role') return draft.role;
    if (id === 'stage') return draft.stage;
    if (id === 'babyStatus') return draft.babyStatus === 'born' ? '已经出生' : '尚未出生';
    if (id === 'age') return draft.age ? draft.age + ' 岁' : '暂不填写';
    if (id === 'parity') return draft.parity !== '' ? draft.parity + ' 次' : '暂不填写';
    if (id === 'pregnancyWeeks') return draft.pregnancyWeeks ? draft.pregnancyWeeks + ' 周' : '暂不填写';
    const index = Number(id.split('-')[1]);
    if (id.startsWith('babyType-')) return draft.babies[index]?.kind === 'born' ? '已经出生的宝宝' : '本次怀孕中的宝宝';
    if (id.startsWith('babyWeeks-')) return draft.babies[index]?.weeks ? draft.babies[index].weeks + ' 周' : '暂不填写';
    if (id.startsWith('babyBirth-')) return draft.babies[index]?.birth || '暂不填写';
    if (id.startsWith('more-')) return draft.more[index] === true ? '有，继续添加' : '没有';
    return '';
  }

  function choice(id, value, label, selected, iconName) {
    return '<button type="button" class="ob-choice" data-ob-select="' + safe(id) + '" data-value="' + safe(value) + '" aria-pressed="' + selected + '">' +
      (iconName ? icon(iconName) : '') + '<span>' + safe(label) + '</span>' + (selected ? icon('check', 'ob-check') : '') + '</button>';
  }

  function numberField(id, value, min, max, unit) {
    const raw = value == null ? '' : String(value);
    const legacy = raw !== '' && !profileInteger(raw, min, max);
    const selectedIndex = legacy || raw === '' ? -1 : Number(raw) - min;
    const anchorIndex = selectedIndex >= 0 ? selectedIndex : (id === 'age' ? 29 : Math.round((min + max) / 2)) - min;
    const options = Array.from({ length: max - min + 1 }, (_, index) => String(min + index));
    return '<form id="onboarding-form" class="ob-field-form ob-picker-form" data-control-id="ONBOARD-number" novalidate>' +
      '<input type="hidden" name="' + safe(id) + '" value="' + safe(raw) + '" data-ob-legacy-invalid="' + legacy + '">' +
      '<div id="ob-field" class="ob-number-picker" role="listbox" tabindex="0" aria-orientation="horizontal" aria-labelledby="ob-question" aria-describedby="onboarding-error" aria-activedescendant="ob-picker-option-' + anchorIndex + '" data-ob-min="' + min + '" data-ob-max="' + max + '" data-ob-unit="' + safe(unit) + '" data-ob-selected-index="' + selectedIndex + '" data-ob-anchor-index="' + anchorIndex + '">' +
      options.map((option, index) => '<div id="ob-picker-option-' + index + '" class="ob-picker-option" role="option" aria-selected="' + (index === selectedIndex) + '" aria-label="' + option + ' ' + unit + '" data-ob-index="' + index + '">' + option + '</div>').join('') + '</div>' +
      '<button type="button" class="ob-picker-clear" data-ob-clear aria-pressed="' + (selectedIndex < 0) + '">暂不填写</button>' +
      '<button class="primary ob-continue" data-control-id="ONBOARD-next" type="submit">继续 ' + icon('arrow-right') + '</button></form>';
  }

  function pickerIndex(picker) {
    const step = picker.clientWidth / 5;
    return Math.max(0, Math.min(Number(picker.dataset.obMax) - Number(picker.dataset.obMin), Math.round(picker.scrollLeft / (step || 1))));
  }

  function selectPicker(picker, index, reposition = false, save = true) {
    if (!picker?.isConnected) return;
    const field = picker.closest('form')?.querySelector('input[name]');
    if (!field) return;
    const nextIndex = index < 0 ? -1 : Math.max(0, Math.min(Number(picker.dataset.obMax) - Number(picker.dataset.obMin), index));
    if (reposition && nextIndex >= 0) picker.scrollLeft = nextIndex * picker.clientWidth / 5;
    picker.dataset.obSelectedIndex = String(nextIndex);
    picker.setAttribute('aria-activedescendant', 'ob-picker-option-' + (nextIndex >= 0 ? nextIndex : pickerIndex(picker)));
    picker.querySelectorAll('[role="option"]').forEach((option, optionIndex) => option.setAttribute('aria-selected', String(optionIndex === nextIndex)));
    field.value = nextIndex < 0 ? '' : String(Number(picker.dataset.obMin) + nextIndex);
    field.dataset.obLegacyInvalid = 'false';
    picker.removeAttribute('aria-invalid');
    picker.closest('form')?.querySelector('[data-ob-clear]')?.setAttribute('aria-pressed', String(nextIndex < 0));
    if (save) {
      read();
      $('#onboarding-error').textContent = '';
    }
  }

  function initPicker(body) {
    const picker = body.querySelector('.ob-number-picker');
    if (!picker) return;
    picker.scrollLeft = Number(picker.dataset.obAnchorIndex) * picker.clientWidth / 5;
    let ready = false;
    requestAnimationFrame(() => { ready = true; });
    let settleTimer = 0;
    let drag = null;
    let suppressClick = false;
    let userScroll = false;
    let pickerWidth = picker.clientWidth;
    picker.addEventListener('scroll', () => {
      if (!ready || !userScroll) return;
      picker.dataset.obScrollDirty = 'true';
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        if (drag) return;
        const index = pickerIndex(picker);
        if (index !== Number(picker.dataset.obSelectedIndex)) selectPicker(picker, index);
        picker.dataset.obScrollDirty = 'false';
        userScroll = false;
      }, 85);
    }, { passive: true });
    picker.addEventListener('wheel', event => {
      if (event.deltaX || event.shiftKey) userScroll = true;
    }, { passive: true });
    picker.addEventListener('pointerdown', event => {
      if (event.pointerType === 'touch') {
        userScroll = true;
        return;
      }
      if (event.button !== 0) return;
      suppressClick = false;
      const option = event.target instanceof Element ? event.target.closest('[data-ob-index]') : null;
      drag = { id: event.pointerId, x: event.clientX, left: picker.scrollLeft, moved: false, optionIndex: option ? Number(option.dataset.obIndex) : null };
      picker.style.scrollSnapType = 'none';
      picker.setPointerCapture(event.pointerId);
    });
    picker.addEventListener('pointermove', event => {
      if (!drag || event.pointerId !== drag.id) return;
      const delta = drag.x - event.clientX;
      if (Math.abs(delta) > 5) drag.moved = true;
      if (drag.moved) picker.scrollLeft = drag.left + delta;
    });
    const endDrag = event => {
      if (!drag || event.pointerId !== drag.id) return;
      const moved = drag.moved;
      const optionIndex = drag.optionIndex;
      drag = null;
      picker.style.scrollSnapType = '';
      if (picker.hasPointerCapture(event.pointerId)) picker.releasePointerCapture(event.pointerId);
      if (moved) {
        suppressClick = true;
        clearTimeout(settleTimer);
        selectPicker(picker, pickerIndex(picker), true);
        picker.dataset.obScrollDirty = 'false';
      } else if (optionIndex !== null) {
        suppressClick = true;
        selectPicker(picker, optionIndex, true);
      }
    };
    picker.addEventListener('pointerup', endDrag);
    picker.addEventListener('pointercancel', endDrag);
    picker.addEventListener('click', event => {
      if (suppressClick) { suppressClick = false; return; }
      const option = event.target instanceof Element ? event.target.closest('[data-ob-index]') : null;
      if (!option) return;
      selectPicker(picker, Number(option.dataset.obIndex), true);
      picker.focus({ preventScroll: true });
    });
    picker.addEventListener('keydown', event => {
      const selected = Number(picker.dataset.obSelectedIndex);
      const current = selected >= 0 ? selected : pickerIndex(picker);
      const next = event.key === 'ArrowRight' ? current + 1 : event.key === 'ArrowLeft' ? current - 1 : event.key === 'Home' ? 0 : event.key === 'End' ? Number(picker.dataset.obMax) - Number(picker.dataset.obMin) : null;
      if (next === null) return;
      event.preventDefault();
      selectPicker(picker, next, true);
    });
    picker.closest('form')?.querySelector('[data-ob-clear]')?.addEventListener('click', () => selectPicker(picker, -1));
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => {
      if (!picker.isConnected || drag || userScroll || picker.clientWidth === pickerWidth) return;
      pickerWidth = picker.clientWidth;
      const selected = Number(picker.dataset.obSelectedIndex);
      const anchor = selected >= 0 ? selected : Number(picker.dataset.obAnchorIndex);
      picker.scrollLeft = anchor * picker.clientWidth / 5;
    }).observe(picker);
  }

  function roleChoices(draft) {
    const otherChosen = CARE_ROLES.includes(draft.role) && draft.role !== '妈妈';
    const expanded = onboarding.roleOptionsOpen === undefined ? otherChosen : Boolean(onboarding.roleOptionsOpen);
    return '<div class="ob-role-choices" data-control-id="ONBOARD-role"><div class="ob-choice-grid ob-role-primary">' +
      choice('role', '妈妈', '妈妈', draft.role === '妈妈' && !expanded, 'mom') +
      '<button type="button" class="ob-choice" data-ob-select="role" data-value="other-group" aria-expanded="' + expanded + '" aria-controls="ob-role-detail" aria-pressed="' + otherChosen + '">' + icon('family') + '<span>其他成员</span>' + (otherChosen ? icon('check', 'ob-check') : '') + '</button></div>' +
      (expanded ? '<div id="ob-role-detail" class="ob-choice-grid ob-role-detail" aria-label="其他照护身份">' +
        [['爸爸', 'dad'], ['爷爷/奶奶', 'grandparents'], ['外公/外婆', 'grandparents'], ['其他成员', 'family']].map(([value, iconName]) =>
          choice('role', value, value === '其他成员' ? '其他亲友' : value, draft.role === value, iconName)).join('') + '</div>' : '') + '</div>';
  }

  function activeBody(id, draft) {
    if (id === 'services') return '<div class="ob-choice-grid ob-services" data-control-id="ONBOARD-services">' + SERVICES.map(item =>
      '<button type="button" class="ob-choice ob-service" data-ob-toggle="services" data-value="' + item.id + '" aria-pressed="' + draft.services.includes(item.id) + '">' +
      icon(item.icon) + '<span><b>' + item.title + '</b><small>' + item.description + '</small></span>' + (draft.services.includes(item.id) ? icon('check', 'ob-check') : '') + '</button>').join('') +
      '</div><button type="button" class="primary ob-continue" data-action="onboarding-next" data-control-id="ONBOARD-next">' + (draft.services.length ? '继续' : '暂不选择，继续') + ' ' + icon('arrow-right') + '</button>';
    if (id === 'concerns') return '<div class="ob-choice-grid ob-concerns" data-control-id="ONBOARD-concerns">' + CARE_CONCERNS.map((text, index) =>
      '<button type="button" class="ob-choice" data-ob-toggle="concerns" data-value="' + safe(text) + '" aria-pressed="' + draft.concerns.includes(text) + '">' +
      icon(CONCERN_ICONS[index]) + '<span>' + safe(text) + '</span>' + (draft.concerns.includes(text) ? icon('check', 'ob-check') : '') + '</button>').join('') +
      '</div><button type="button" class="primary ob-continue" data-action="onboarding-next" data-control-id="ONBOARD-next">' + (draft.concerns.length ? '继续' : '暂不选择，继续') + ' ' + icon('arrow-right') + '</button>';
    if (id === 'role') return roleChoices(draft);
    if (id === 'stage') return '<div class="ob-choice-grid ob-stage-choices" data-control-id="ONBOARD-stage">' + CARE_STAGES.map(text => choice(id, text, text, draft.stage === text, 'heart')).join('') + '</div>';
    if (id === 'babyStatus') return '<div class="ob-choice-grid" data-control-id="ONBOARD-stage">' + choice(id, 'unborn', '尚未出生', draft.babyStatus === 'unborn', 'heart') + choice(id, 'born', '已经出生', draft.babyStatus === 'born', 'baby') + '</div>';
    if (id === 'age') return numberField(id, draft.age, 18, 50, '岁');
    if (id === 'parity') return numberField(id, draft.parity, 0, 6, '次');
    if (id === 'pregnancyWeeks') return numberField(id, draft.pregnancyWeeks, 0, 45, '周');
    const index = Number(id.split('-')[1]);
    if (id.startsWith('babyType-')) return '<div class="ob-choice-grid" data-control-id="ONBOARD-baby-type">' +
      choice(id, 'unborn', '本次怀孕中的宝宝', draft.babies[index]?.kind === 'unborn', 'heart') +
      choice(id, 'born', '已经出生的宝宝', draft.babies[index]?.kind === 'born', 'baby') + '</div>';
    if (id.startsWith('babyWeeks-')) return numberField(id, draft.babies[index]?.weeks || '', 37, 50, '周');
    if (id.startsWith('babyBirth-')) return '<form id="onboarding-form" class="ob-field-form" data-control-id="ONBOARD-date" novalidate>' +
      '<input id="ob-field" type="date" name="' + safe(id) + '" value="' + safe(draft.babies[index]?.birth || '') + '" max="' + profileToday() + '" aria-labelledby="ob-question" aria-describedby="onboarding-error">' +
      '<button class="primary ob-continue" data-control-id="ONBOARD-next" type="submit">继续 ' + icon('arrow-right') + '</button></form>';
    if (id.startsWith('more-')) {
      if (onboarding.pendingReduction?.id === id) return '<div class="ob-reduction"><p>后续宝宝的资料将暂时不计入本次保存。你可以返回这张卡恢复录入。</p><div class="ob-reduction-actions"><button type="button" class="secondary" data-ob-cancel-reduction="' + safe(id) + '">继续保留</button><button type="button" class="primary" data-ob-confirm-reduction="' + safe(id) + '">确认只保留前 ' + (index + 1) + ' 位</button></div></div>';
      return '<div class="ob-choice-grid" data-control-id="ONBOARD-more">' + choice(id, 'yes', '有，添加下一位', draft.more[index] === true, 'plus') + choice(id, 'no', '没有了', draft.more[index] === false, 'check') + '</div>';
    }
    const count = activeCount(draft);
    const babySummary = Array.from({ length: count }, (_, index) => {
      const baby = draft.babies[index];
      const babyKind = index === 0 ? context(draft) : context(draft) === 'unborn' ? baby?.kind : 'born';
      return '<li><b>' + babyLabel(index) + '</b><span>' +
        (babyKind === 'unborn' ? '本次孕期' : '已出生' + (baby?.birth ? ' · ' + safe(baby.birth) : ' · 生日暂未填写')) +
        '</span></li>';
    }).join('');
    return '<div class="ob-finish-summary"><span>' + safe(draft.role) + (draft.role === '妈妈' ? ' · ' + safe(draft.stage) : '') + '</span><span>' + (count ? count + ' 位宝宝' : '宝宝资料稍后补充') + '</span><span>' + draft.services.length + ' 项优先服务</span></div>' +
      (babySummary ? '<ul class="ob-baby-summary" aria-label="已录入宝宝">' + babySummary + '</ul>' : '') +
      '<button type="button" class="primary ob-continue" data-action="onboarding-next" data-control-id="ONBOARD-finish">Let’s chat ' + icon('arrow-right') + '</button>';
  }

  function revealActiveCard(body) {
    const card = body?.querySelector('.ob-active-card');
    if (!card || !body.clientHeight) return;
    const frame = body.getBoundingClientRect();
    const item = card.getBoundingClientRect();
    const gap = 16;
    if (item.height > frame.height - gap * 2 || item.top < frame.top + gap) {
      body.scrollTop += item.top - frame.top - gap;
    } else if (item.bottom > frame.bottom - gap) {
      body.scrollTop += item.bottom - frame.bottom + gap;
    }
  }

  function render(reset = false, preserveScroll = false, animate = true) {
    bootstrap();
    if (!onboarding.draft) onboarding.draft = fromProfile();
    const draft = onboarding.draft;
    const body = $('#onboarding-body');
    const previousTop = body.scrollTop;
    body.style.paddingBottom = '';
    body.style.scrollBehavior = '';
    body.style.scrollPaddingBottom = '';
    const ids = sequence(draft);
    if (onboarding.active !== 'welcome' && !ids.includes(onboarding.active)) onboarding.active = firstPending(ids);
    const active = onboarding.active;
    const error = $('#onboarding-error');
    error.textContent = '';
    if (active === 'welcome') {
      body.style.paddingBottom = '';
      body.innerHTML = '<div class="ob-welcome" data-state-id="STATE-onboarding-welcome"><div class="ob-welcome-orbit">' + canvas('ready', false, true) + '</div>' +
        '<div class="ob-welcome-message"><p class="ob-author">Momcozy AI</p><h2 tabindex="-1">先认识一下，我们再开始。</h2><p>让我们录入一些关键信息，以便提供更贴合你的照护支持。</p></div>' +
        '<button type="button" class="primary ob-start" data-ob-start="true" data-control-id="ONBOARD-start">开始 ' + icon('arrow-right') + '</button>' +
        '<p class="ob-privacy">信息保存在当前浏览器，之后随时可以修改。</p></div>';
    } else {
      const activeIndex = ids.indexOf(active);
      const previous = ids.slice(0, activeIndex).filter(id => onboarding.completed.includes(id));
      const [title, hint] = meta(active, draft);
      body.innerHTML = '<div class="ob-thread-intro"><span class="ob-thread-mark">' + icon('sparkles') + '</span><div><b>Momcozy AI</b></div></div>' +
        previous.map(id => {
          const [question] = meta(id, draft);
          return '<section class="ob-history-turn" data-card-id="' + safe(id) + '"><div class="ob-history-question"><span class="ob-mini-avatar">' + icon('sparkles') + '</span><span>' + safe(question) + '</span></div>' +
            '<div class="ob-answer"><span>' + safe(answer(id, draft)) + '</span><button type="button" data-ob-edit="' + safe(id) + '" data-control-id="ONBOARD-edit" aria-label="修改：' + safe(question) + '">修改</button></div></section>';
        }).join('') +
        '<section class="ob-active-card" data-card-id="' + safe(active) + '" data-state-id="' + (active === 'complete' ? 'STATE-onboarding-complete' : 'STATE-onboarding-question') + '">' +
          '<div class="ob-card-intro"><span class="ob-card-avatar">' + canvas('ready', false, true) + '</span><span class="ob-author">Momcozy AI</span></div>' +
          '<h2 id="ob-question" tabindex="-1">' + safe(title) + '</h2>' + (hint ? '<p class="ob-card-hint">' + safe(hint) + '</p>' : '') + activeBody(active, draft) + '</section>';
    }
    if (!animate) body.querySelector('.ob-active-card')?.style.setProperty('animation', 'none');
    hydrate();
    initPicker(body);
    if (preserveScroll) body.scrollTop = previousTop;
    else requestAnimationFrame(() => { if (body.isConnected) revealActiveCard(body); });
    if (reset) requestAnimationFrame(() => body.querySelector('.ob-active-card h2,.ob-welcome h2')?.focus({ preventScroll: true }));
  }

  function read() {
    const form = $('#onboarding-form');
    if (!form || !onboarding.draft) return;
    const field = form.querySelector('[name]');
    if (!field) return;
    const picker = form.querySelector('.ob-number-picker');
    if (picker?.dataset.obScrollDirty === 'true') selectPicker(picker, pickerIndex(picker), false, false);
    if (field.dataset.obLegacyInvalid === 'true') return;
    const id = field.name;
    const value = field.value;
    if (['age', 'parity', 'pregnancyWeeks'].includes(id)) onboarding.draft[id] = value;
    else {
      const match = id.match(/^baby(Weeks|Birth)-(\d+)$/);
      if (match) {
        const index = Number(match[2]);
        if (!onboarding.draft.babies[index]) onboarding.draft.babies[index] = newBaby('born', 'baby-' + (index + 1));
        onboarding.draft.babies[index][match[1] === 'Weeks' ? 'weeks' : 'birth'] = value;
      }
    }
    storeOnboarding();
  }

  function commit(id, branchChanged = false) {
    const completed = onboarding.completed;
    if (branchChanged && completed.includes(id)) onboarding.completed = completed.slice(0, completed.indexOf(id) + 1);
    else if (!completed.includes(id)) completed.push(id);
    const ids = sequence(onboarding.draft);
    onboarding.active = firstPending(ids);
    onboarding.pendingReduction = null;
    storeOnboarding();
    render(true);
  }

  function toggle(group, value) {
    bootstrap();
    if (onboarding.active !== group || !['services', 'concerns'].includes(group)) return;
    const choices = group === 'services' ? SERVICES.map(item => item.id) : CARE_CONCERNS;
    if (!choices.includes(value)) return;
    const list = onboarding.draft[group];
    onboarding.draft[group] = choices.filter(item => item === value ? !list.includes(item) : list.includes(item));
    storeOnboarding();
    render(false, true, false);
    $('#onboarding-body [data-ob-toggle="' + group + '"][data-value="' + CSS.escape(value) + '"]')?.focus({ preventScroll: true });
  }

  function select(id, value) {
    bootstrap();
    if (onboarding.active !== id) return;
    const draft = onboarding.draft;
    let before, after;
    if (id === 'role' && value === 'other-group') {
      onboarding.roleOptionsOpen = onboarding.roleOptionsOpen === undefined
        ? !(CARE_ROLES.includes(draft.role) && draft.role !== '妈妈')
        : !onboarding.roleOptionsOpen;
      storeOnboarding(); render(false, true, false);
      (onboarding.roleOptionsOpen ? $('#ob-role-detail .ob-choice') : $('#onboarding-body [data-value="other-group"]'))?.focus({ preventScroll: true });
      return;
    }
    if (id === 'role' && CARE_ROLES.includes(value)) { before = draft.role; draft.role = value; after = value; onboarding.roleOptionsOpen = value !== '妈妈'; }
    else if (id === 'stage' && CARE_STAGES.includes(value)) {
      const retained = pregnancyCandidates(draft);
      if (value === '孕期' && draft.stage !== value &&
        retained.length >= MAX_BABIES && !retained.some(baby => baby.kind === 'unborn')) {
        $('#onboarding-error').textContent = '已录入 ' + MAX_BABIES + ' 位宝宝，当前版本无法再加入本次孕期宝宝。现有宝宝资料未改变。';
        return;
      }
      before = draft.stage; draft.stage = value; after = value;
      if (value === '孕期' && before !== value) moveToPregnancy(draft);
    }
    else if (id === 'babyStatus' && ['born', 'unborn'].includes(value)) { before = draft.babyStatus; draft.babyStatus = value; after = value; }
    else if (id.startsWith('babyType-') && ['born', 'unborn'].includes(value)) {
      const index = Number(id.split('-')[1]);
      if (!draft.babies[index]) draft.babies[index] = newBaby(value, 'baby-' + (index + 1));
      before = draft.babies[index].kind; draft.babies[index].kind = value; after = value;
    } else if (id.startsWith('more-') && ['yes', 'no'].includes(value)) {
      const index = Number(id.split('-')[1]);
      before = draft.more[index] === true ? 'yes' : draft.more[index] === false ? 'no' : '';
      if (value === 'no' && before === 'yes' && draft.babies.length > index + 1) {
        onboarding.pendingReduction = { id };
        storeOnboarding(); render(false, true, false); return;
      }
      draft.more[index] = value === 'yes';
      if (value === 'yes' && !draft.babies[index + 1]) draft.babies[index + 1] = newBaby(context(draft) === 'unborn' ? 'unborn' : 'born', 'baby-' + (index + 2));
      after = value;
    } else return;
    commit(id, before !== after);
  }

  function confirmReduction(id) {
    if (onboarding.pendingReduction?.id !== id || onboarding.active !== id) return;
    const index = Number(id.split('-')[1]);
    onboarding.draft.more[index] = false;
    commit(id, true);
  }

  function cancelReduction(id) {
    if (onboarding.pendingReduction?.id !== id) return;
    onboarding.pendingReduction = null;
    storeOnboarding(); render(false, true, false);
  }

  function edit(id) {
    bootstrap();
    if (!onboarding.completed.includes(id) || !sequence(onboarding.draft).includes(id)) return;
    onboarding.active = id;
    onboarding.pendingReduction = null;
    storeOnboarding(); render(true);
  }

  function next() {
    bootstrap();
    const id = onboarding.active;
    if (id === 'welcome') { onboarding.active = 'services'; storeOnboarding(); render(true); return; }
    if (id === 'complete') { finish(); return; }
    if (['services', 'concerns'].includes(id)) { commit(id); return; }
    if (!['age', 'parity', 'pregnancyWeeks'].includes(id) && !id.startsWith('babyWeeks-') && !id.startsWith('babyBirth-')) return;
    read();
    const draft = onboarding.draft;
    const index = Number(id.split('-')[1]);
    const raw = id === 'age' || id === 'parity' || id === 'pregnancyWeeks' ? draft[id] : id.startsWith('babyWeeks-') ? draft.babies[index]?.weeks : draft.babies[index]?.birth;
    const limits = id === 'age' ? [18, 50, '妈妈年龄'] : id === 'parity' ? [0, 6, '分娩次数'] : id === 'pregnancyWeeks' ? [0, 45, '当前孕周'] : [37, 50, '出生孕周'];
    if (id.startsWith('babyBirth-') ? !validBirth(raw) : !profileInteger(raw, limits[0], limits[1])) {
      const message = id.startsWith('babyBirth-') ? '请选择有效的出生日期，不能晚于今天；不确定可暂不填写。' : limits[2] + '仅支持 ' + limits[0] + '–' + limits[1] + '；不确定可暂不填写。';
      $('#onboarding-error').textContent = message;
      $('#ob-field')?.setAttribute('aria-invalid', 'true');
      $('#ob-field')?.focus();
      return;
    }
    commit(id);
  }

  function leave() {
    read();
    onboarding.status = 'paused';
    const saved = storeOnboarding();
    if (!saved) {
      onboarding.status = 'draft';
      $('#onboarding-error').textContent = '资料草稿暂时无法保存。请留在此页重试，避免刷新后丢失输入。';
      return;
    }
    go(onboardingReturn);
    toast('已暂存，可从「我的 → 基础照护资料」继续。');
  }

  function start() {
    bootstrap();
    if (sheet.open) closeSheet();
    onboardingReturn = page === 'onboarding' ? 'home' : page;
    if (!onboarding.draft) onboarding.draft = fromProfile();
    if (onboarding.status === 'completed' && onboarding.active !== 'complete') {
      onboarding.completed = sequence(onboarding.draft).filter(id => id !== 'complete');
      onboarding.active = 'complete';
    }
    if (onboarding.status === 'completed') onboarding.commitToken = 'ob-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
    onboarding.status = 'draft';
    storeOnboarding();
    go('onboarding');
    requestAnimationFrame(() => $('#onboarding-body .ob-active-card h2,.ob-welcome h2')?.focus({ preventScroll: true }));
  }

  function finish() {
    if (onboarding.active !== 'complete') return;
    const draft = onboarding.draft;
    const ids = sequence(draft);
    const incomplete = ids.find(id => id !== 'complete' && !onboarding.completed.includes(id));
    if (incomplete) { onboarding.active = incomplete; storeOnboarding(); render(true); return; }
    if (!CARE_ROLES.includes(draft.role) || draft.role === '妈妈' && !CARE_STAGES.includes(draft.stage) || draft.role !== '妈妈' && !['born', 'unborn'].includes(draft.babyStatus)) {
      $('#onboarding-error').textContent = '请先完成身份和阶段信息。'; return;
    }
    for (const id of ids) {
      let valid = true;
      if (id === 'age') valid = profileInteger(draft.age, 18, 50);
      if (id === 'parity') valid = profileInteger(draft.parity, 0, 6);
      if (id === 'pregnancyWeeks') valid = profileInteger(draft.pregnancyWeeks, 0, 45);
      if (id.startsWith('babyWeeks-')) valid = profileInteger(draft.babies[Number(id.split('-')[1])]?.weeks, 37, 50);
      if (id.startsWith('babyBirth-')) valid = validBirth(draft.babies[Number(id.split('-')[1])]?.birth);
      if (!valid) { onboarding.active = id; storeOnboarding(); render(true); $('#onboarding-error').textContent = '这项资料需要重新检查。'; return; }
    }
    const kind = context(draft);
    const count = activeCount(draft);
    const babies = kind === 'none' ? structuredClone(profiles.babies || []) : Array.from({ length: count }, (_, index) => {
      const baby = draft.babies[index] || newBaby(index === 0 ? kind : 'born', 'baby-' + (index + 1));
      const babyKind = index === 0 ? kind : kind === 'unborn' ? baby.kind : 'born';
      return { id: baby.id, kind: babyKind, birth: babyKind === 'born' ? baby.birth : '', weeks: babyKind === 'born' ? baby.weeks : '' };
    });
    const previous = profiles;
    profiles = {
      ...profiles,
      careRole: draft.role,
      momStage: draft.role === '妈妈' ? draft.stage : (profiles.momStage || ''),
      babyStatus: draft.role === '妈妈' ? kind : draft.babyStatus,
      momAge: draft.role === '妈妈' ? draft.age : (profiles.momAge ?? ''),
      parity: draft.role === '妈妈' ? draft.parity : (profiles.parity ?? ''),
      pregnancyWeeks: kind === 'unborn' ? draft.pregnancyWeeks : (profiles.pregnancyWeeks ?? ''),
      babyCount: kind === 'none' ? (profiles.babyCount || null) : count,
      babies,
      birth: babies[0]?.birth || '',
      birthWeeks: babies[0]?.weeks || '',
      services: [...draft.services],
      concerns: [...draft.concerns],
      focus: draft.concerns.join('、'),
      omittedNumbers: {
        ...profiles.omittedNumbers,
        age: draft.role === '妈妈' ? draft.age === '' : profiles.omittedNumbers?.age ?? true,
        parity: draft.role === '妈妈' ? draft.parity === '' : profiles.omittedNumbers?.parity ?? true,
        pregnancyWeeks: kind === 'unborn' ? draft.pregnancyWeeks === '' : profiles.omittedNumbers?.pregnancyWeeks ?? true,
        ...Object.fromEntries(babies.map((baby, index) => ['baby-' + index + '-weeks', baby.weeks === '']))
      },
      onboardingVersion: VERSION,
      onboardingCommitToken: onboarding.commitToken
    };
    if (!persist()) {
      profiles = previous;
      $('#onboarding-error').textContent = '资料暂时无法保存到浏览器，请重试或选择 Skip 稍后继续。';
      return;
    }
    onboarding.status = 'completed';
    onboarding.active = 'complete';
    const draftSaved = storeOnboarding();
    go('home');
    toast(draftSaved ? '资料已保存，开始聊天吧。' : '资料已保存；首次设置的草稿状态未能保存，请稍后检查。');
  }

  return { bootstrap, fromProfile, render, read, toggle, select, edit, next, leave, start, finish, confirmReduction, cancelReduction };
})();
