/* 研途 · 本地优先数据层 */

import {
  DEFAULT_DAILY_CAP,
  DEFAULT_EXAM_DATE,
  PAPER_YEARS,
  buildPlan,
  createMockSets,
  createPaperRecords,
  starterRecite,
} from './content.js';
import {
  addDays,
  dateKey,
  diffDays,
  isValidDateKey,
  nowISO,
  todayKey,
  uid,
} from './utils.js';

const STORAGE_KEY = 'yantu.sprint.v1';
const TIMER_KEY = 'yantu.timer.v1';

export let storageOK = true;

function initialProfile() {
  return {
    name: '',
    examDate: DEFAULT_EXAM_DATE,
    startDate: todayKey(),
    dailyCap: DEFAULT_DAILY_CAP,
    createdAt: nowISO(),
  };
}

export function createInitialState() {
  const profile = initialProfile();
  const initial = {
    version: 1,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    profile,
    plans: {},
    sessions: [],
    politics: { practice: [], wrong: [] },
    english: { vocabLogs: [], words: [], readings: [], translations: [], writings: [] },
    recite: starterRecite(profile.startDate),
    mocks: createMockSets(),
    papers: createPaperRecords(),
    reviews: {},
  };
  syncSchedule(initial);
  return initial;
}

function dateRange(start, endExclusive) {
  const days = diffDays(start, endExclusive);
  return Array.from({ length: Math.max(0, days) }, (_, index) => addDays(start, index));
}

/** 补齐/重建计划；保留已完成任务、打卡记录与当日备注。 */
export function syncSchedule(target, { resetDone = false } = {}) {
  const { profile } = target;
  if (!isValidDateKey(profile.startDate) || !isValidDateKey(profile.examDate)) return;
  const oldPlans = target.plans || {};
  const fresh = {};
  for (const day of dateRange(profile.startDate, profile.examDate)) {
    const next = buildPlan(day, profile);
    const old = oldPlans[day];
    if (old) {
      if (!resetDone) {
        const doneIds = new Set((old.tasks || []).filter((item) => item.done).map((item) => item.id));
        next.tasks = next.tasks.map((item) => ({ ...item, done: doneIds.has(item.id) }));
      }
      next.note = old.note || '';
      next.mood = old.mood || '';
      next.checkedInAt = old.checkedInAt || null;
      next.generatedAt = old.generatedAt || next.generatedAt;
    }
    fresh[day] = next;
  }
  target.plans = fresh;
}

function normalizeState(raw) {
  if (!raw || typeof raw !== 'object') return createInitialState();
  const base = createInitialState();
  const profile = {
    ...base.profile,
    ...(raw.profile && typeof raw.profile === 'object' ? raw.profile : {}),
  };
  profile.dailyCap = Number(profile.dailyCap) === 150 ? 150 : DEFAULT_DAILY_CAP;
  if (!isValidDateKey(profile.startDate)) profile.startDate = todayKey();
  if (!isValidDateKey(profile.examDate)) profile.examDate = DEFAULT_EXAM_DATE;
  if (diffDays(profile.startDate, profile.examDate) <= 0) {
    profile.startDate = todayKey();
    if (diffDays(profile.startDate, profile.examDate) <= 0) {
      profile.examDate = addDays(profile.startDate, 51);
    }
  }

  const next = {
    ...base,
    ...raw,
    version: 1,
    profile,
    plans: raw.plans && typeof raw.plans === 'object' ? raw.plans : {},
    sessions: Array.isArray(raw.sessions) ? raw.sessions : [],
    politics: {
      practice: Array.isArray(raw.politics?.practice) ? raw.politics.practice : [],
      wrong: Array.isArray(raw.politics?.wrong) ? raw.politics.wrong : [],
    },
    english: {
      vocabLogs: Array.isArray(raw.english?.vocabLogs) ? raw.english.vocabLogs : [],
      words: Array.isArray(raw.english?.words) ? raw.english.words : [],
      readings: Array.isArray(raw.english?.readings) ? raw.english.readings : [],
      translations: Array.isArray(raw.english?.translations) ? raw.english.translations : [],
      writings: Array.isArray(raw.english?.writings) ? raw.english.writings : [],
    },
    recite: Array.isArray(raw.recite) && raw.recite.length ? raw.recite : base.recite,
    mocks: createMockSets(),
    papers: createPaperRecords(),
    reviews: raw.reviews && typeof raw.reviews === 'object' ? raw.reviews : {},
  };

  for (const [key, value] of Object.entries(raw.mocks || {})) {
    if (next.mocks[key] && value && typeof value === 'object') {
      next.mocks[key] = { ...next.mocks[key], ...value };
    }
  }
  for (const year of PAPER_YEARS) {
    const value = raw.papers?.[String(year)];
    if (value && typeof value === 'object') {
      next.papers[String(year)] = { ...next.papers[String(year)], ...value, year };
    }
  }
  for (const card of next.recite) {
    if (!card.id) card.id = uid('recite');
    if (!['politics', 'english'].includes(card.subject)) card.subject = 'politics';
    card.level = Number.isFinite(Number(card.level)) ? Math.max(0, Math.min(4, Number(card.level))) : 0;
    if (!isValidDateKey(card.nextReview)) card.nextReview = todayKey();
  }
  syncSchedule(next, { resetDone: false });
  return next;
}

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('读取本地数据失败', error);
    storageOK = false;
    return null;
  }
}

function boot() {
  const raw = readStorage();
  return raw ? { value: normalizeState(raw), fresh: false } : { value: createInitialState(), fresh: true };
}

const booted = boot();
export const state = booted.value;
if (booted.fresh) persist();

export function persist() {
  state.updatedAt = nowISO();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    storageOK = true;
  } catch (error) {
    storageOK = false;
    console.warn('保存本地数据失败', error);
  }
  return storageOK;
}

export function update(mutator) {
  const result = mutator(state);
  persist();
  return result;
}

export function replaceState(nextRaw) {
  const normalized = normalizeState(nextRaw);
  for (const key of Object.keys(state)) delete state[key];
  Object.assign(state, normalized);
  persist();
}

export function resetState() {
  replaceState(createInitialState());
}

export function regeneratePlans() {
  update((draft) => {
    syncSchedule(draft, { resetDone: true });
  });
}

export function regenerateToday() {
  const date = todayKey();
  update((draft) => {
    const next = buildPlan(date, draft.profile);
    const old = draft.plans[date];
    if (old) {
      next.note = old.note || '';
      next.mood = old.mood || '';
      next.checkedInAt = old.checkedInAt || null;
    }
    draft.plans[date] = next;
  });
  return state.plans[date];
}

export function applySettings({ name, examDate }) {
  const changedExam = examDate && examDate !== state.profile.examDate;
  update((draft) => {
    draft.profile.name = String(name || '').trim().slice(0, 20);
    if (examDate && isValidDateKey(examDate)) draft.profile.examDate = examDate;
    if (changedExam) syncSchedule(draft, { resetDone: false });
  });
  return state.profile;
}

export function checkInDate(date) {
  update((draft) => {
    const plan = draft.plans[date];
    if (plan) plan.checkedInAt = plan.checkedInAt || nowISO();
  });
  return state.plans[date] || null;
}

export function toggleTask(taskId) {
  update((draft) => {
    const plan = draft.plans[todayKey()];
    const task = plan?.tasks.find((item) => item.id === taskId);
    if (task) task.done = !task.done;
  });
}

export function setTodayCheckin({ mood, note }) {
  const date = todayKey();
  update((draft) => {
    const plan = draft.plans[date];
    if (!plan) return;
    plan.checkedInAt = plan.checkedInAt || nowISO();
    plan.mood = mood || plan.mood || '';
    plan.note = String(note || '').trim();
  });
  return state.plans[date];
}

export function recordSession({ date = todayKey(), subject = 'politics', minutes, source = 'timer' }) {
  const value = Math.max(1, Math.round(Number(minutes) || 0));
  const session = {
    id: uid('session'),
    date,
    subject: subject === 'english' ? 'english' : 'politics',
    minutes: value,
    source,
    createdAt: nowISO(),
  };
  update((draft) => draft.sessions.push(session));
  return session;
}

export function addReview(weekStart, payload) {
  update((draft) => {
    draft.reviews[weekStart] = {
      weekStart,
      ...payload,
      updatedAt: nowISO(),
    };
  });
  return state.reviews[weekStart];
}

export function exportState() {
  return {
    app: '研途 · 五十日冲刺',
    exportedAt: nowISO(),
    ...state,
  };
}

export function importState(text) {
  const parsed = typeof text === 'string' ? JSON.parse(text) : text;
  if (!parsed || typeof parsed !== 'object' || !parsed.profile) {
    throw new Error('这不是有效的研途备份文件');
  }
  replaceState(parsed);
  return state;
}

/* ------- 计时器持久化 ------- */
export function loadTimer() {
  try {
    const raw = localStorage.getItem(TIMER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

export function saveTimer(timer) {
  try {
    localStorage.setItem(TIMER_KEY, JSON.stringify(timer));
  } catch (_) { /* 计时器不是关键数据 */ }
}

export function clearTimer() {
  try {
    localStorage.removeItem(TIMER_KEY);
  } catch (_) { /* ignore */ }
}

export { STORAGE_KEY, TIMER_KEY, dateKey };
