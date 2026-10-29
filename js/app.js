/* 研途 · 应用入口与交互 */

import {
  bottomNav,
  icon,
  mobileTopbar,
  sidebar,
} from './components.js';
import {
  PAPER_STATUS,
  RECITE_RATINGS,
  RECITE_CATEGORIES,
} from './content.js';
import { renderModal } from './modals.js';
import {
  currentStreak,
  focusMinutes,
  isCheckedIn,
  planFor,
  reciteDue,
  taskStats,
  todayPlan,
} from './selectors.js';
import {
  applySettings,
  checkInDate,
  exportState,
  importState,
  recordSession,
  regenerateToday,
  resetState,
  setTodayCheckin,
  state,
  storageOK,
  update,
} from './store.js';
import { timer, startTimer, pauseTimer, resetTimer, setDuration, setSubject, remainingNow, elapsedSeconds, elapsedMinutes, persistTimer } from './timer.js';
import { ui } from './ui.js';
import { englishView } from './views/english.js';
import { mocksView } from './views/mocks.js';
import { papersView } from './views/papers.js';
import { politicsView } from './views/politics.js';
import { reciteView } from './views/recite.js';
import { reviewView } from './views/review.js';
import { todayView } from './views/today.js';
import {
  addDays,
  clamp,
  downloadJSON,
  escapeHTML as esc,
  formatClock,
  formatDate,
  isValidDateKey,
  nowISO,
  pct,
  todayKey,
  uid,
} from './utils.js';

const ROUTES = {
  today: { title: '今日', render: todayView },
  politics: { title: '政治', render: politicsView },
  english: { title: '英语二', render: englishView },
  recite: { title: '背诵清单', render: reciteView },
  mocks: { title: '肖八肖四', render: mocksView },
  papers: { title: '真题打卡', render: papersView },
  review: { title: '复盘', render: reviewView },
};

const RING_RADIUS = 78;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
let lastFocusedElement = null;
let timerFinishing = false;
let pausedByVisibility = false;
let lastWholeSecond = null;

function parseRoute() {
  const raw = location.hash.replace(/^#/, '').split('?')[0];
  return ROUTES[raw] ? raw : 'today';
}

function render({ preserveScroll = true, focusModal = false } = {}) {
  const route = parseRoute();
  if (location.hash !== `#${route}`) {
    history.replaceState(null, '', `#${route}`);
  }
  ui.route = route;
  const scrollY = window.scrollY;
  const sidebarEl = document.querySelector('#sidebar');
  const mobileEl = document.querySelector('#mobile-top');
  const bottomEl = document.querySelector('#bottom-nav');
  const viewEl = document.querySelector('#view');
  const modalEl = document.querySelector('#modal-root');

  sidebarEl.innerHTML = sidebar(route);
  mobileEl.innerHTML = mobileTopbar(route);
  if (bottomEl) bottomEl.innerHTML = bottomNav(route, ui.mobileMenu);
  viewEl.innerHTML = ROUTES[route].render();
  modalEl.innerHTML = renderModal();
  document.title = `${ROUTES[route].title} · 研途`;
  document.body.dataset.route = route;
  document.querySelector('.app-shell')?.classList.toggle('menu-open', ui.mobileMenu);
  document.body.classList.toggle('modal-open', Boolean(ui.modal));
  document.body.classList.toggle('menu-open', ui.mobileMenu);
  const menuButton = document.querySelector('.menu-button');
  if (menuButton) menuButton.setAttribute('aria-expanded', String(ui.mobileMenu));

  if (preserveScroll) window.scrollTo(0, scrollY);
  updateTimerUI();
  if (focusModal && ui.modal) {
    requestAnimationFrame(() => {
      const target = modalEl.querySelector('input:not([type="hidden"]), textarea, select, button');
      target?.focus();
    });
  }
}

function rerender(options = {}) {
  render({ preserveScroll: true, ...options });
}

/* ---------------- 提示与庆祝 ---------------- */

function toast(message, tone = 'default') {
  const root = document.querySelector('#toast-root');
  if (!root) return;
  const node = document.createElement('div');
  node.className = `toast ${tone}`;
  const symbol = tone === 'error' ? 'info' : tone === 'success' ? 'check' : 'spark';
  node.innerHTML = `<span class="toast-icon">${icon(symbol, 16)}</span><p>${esc(message)}</p>`;
  root.appendChild(node);
  while (root.children.length > 3) root.firstElementChild.remove();
  setTimeout(() => {
    node.classList.add('is-leaving');
    setTimeout(() => node.remove(), 260);
  }, 3200);
}

function celebrate() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const root = document.querySelector('#confetti-root');
  if (!root) return;
  const colors = ['#b4452f', '#607b63', '#b68a45', '#3f5f70', '#e7d6b4'];
  for (let i = 0; i < 18; i += 1) {
    const piece = document.createElement('i');
    piece.className = 'confetti-piece';
    piece.style.left = `${8 + Math.random() * 84}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.setProperty('--drift', `${(Math.random() - 0.5) * 160}px`);
    piece.style.setProperty('--spin', `${Math.random() * 720 - 360}deg`);
    piece.style.animationDelay = `${Math.random() * 0.25}s`;
    root.appendChild(piece);
  }
  setTimeout(() => { root.innerHTML = ''; }, 2000);
}

/* ---------------- 计时器 ---------------- */

function updateTimerUI() {
  const display = document.querySelector('#timer-display');
  if (!display) return;
  const remaining = Math.max(0, remainingNow());
  display.textContent = formatClock(remaining);
  const percent = Math.max(0, Math.min(100, (elapsedSeconds() / timer.duration) * 100));
  const progress = document.querySelector('#timer-progress');
  if (progress) {
    progress.setAttribute('stroke-dashoffset', String(RING_CIRCUMFERENCE - (percent / 100) * RING_CIRCUMFERENCE));
  }
  const hasProgress = timer.remaining < timer.duration - 0.2;
  const status = document.querySelector('#timer-status');
  if (status) {
    status.textContent = timer.running ? '专注中' : hasProgress ? '已暂停' : '待开始';
    status.classList.toggle('is-running', timer.running);
  }
  const caption = document.querySelector('#timer-caption');
  if (caption) caption.textContent = `${timer.subject === 'politics' ? '政治' : '英语二'} · ${timer.duration / 60} 分钟`;
  const toggle = document.querySelector('#timer-toggle');
  if (toggle) {
    toggle.innerHTML = `${icon(timer.running ? 'pause' : 'play', 16)}${timer.running ? '暂停' : hasProgress ? '继续' : '开始专注'}`;
  }
}

function finishTimer(auto = false) {
  if (timerFinishing) return;
  const minutes = auto ? Math.round(timer.duration / 60) : Math.max(1, Math.round(elapsedSeconds() / 60));
  if (!auto && minutes < 1) {
    toast('至少专注 1 分钟再记入。');
    return;
  }
  timerFinishing = true;
  const subject = timer.subject;
  recordSession({ subject, minutes, source: 'timer' });
  resetTimer();
  timerFinishing = false;
  const total = focusMinutes(todayKey());
  rerender();
  toast(
    total >= 180
      ? `已记入 ${minutes} 分钟。今天到 3 小时上限了，剩下的交给明天。`
      : `已记入 ${minutes} 分钟${subject === 'politics' ? '政治' : '英语'}专注。`,
    'success',
  );
}

function timerTick() {
  if (timer.running && remainingNow() <= 0) {
    finishTimer(true);
    return;
  }
  const whole = Math.ceil(remainingNow());
  if (timer.running || whole !== lastWholeSecond) {
    lastWholeSecond = whole;
    updateTimerUI();
  }
}

/* ---------------- 表单工具 ---------------- */

function formText(fd, name) {
  return String(fd.get(name) ?? '').trim();
}

function formInt(fd, name, fallback = 0) {
  const value = Number(fd.get(name));
  return Number.isFinite(value) ? Math.round(value) : fallback;
}

function formNumber(fd, name) {
  const raw = String(fd.get(name) ?? '').trim();
  if (raw === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function fail(form, message, fieldName = '') {
  toast(message, 'error');
  if (fieldName) {
    const field = form.querySelector(`[name="${fieldName}"]`);
    field?.focus();
    field?.classList.add('is-invalid');
    setTimeout(() => field?.classList.remove('is-invalid'), 1600);
  }
  return false;
}

function openModal(payload) {
  lastFocusedElement = document.activeElement;
  ui.modal = payload;
  render({ preserveScroll: true, focusModal: true });
}

function closeModal({ restoreFocus = true } = {}) {
  ui.modal = null;
  render({ preserveScroll: true });
  if (restoreFocus && lastFocusedElement instanceof HTMLElement) lastFocusedElement.focus();
}

/* ---------------- 表单提交 ---------------- */

function submitPractice(form, fd) {
  const date = formText(fd, 'date') || todayKey();
  const count = formInt(fd, 'count');
  const correct = formInt(fd, 'correct');
  const minutes = formInt(fd, 'minutes');
  if (count < 1 || count > 100) return fail(form, '题量需要在 1–100 之间。', 'count');
  if (correct < 0 || correct > count) return fail(form, '答对数不能超过题量。', 'correct');
  if (minutes < 0 || minutes > 300) return fail(form, '用时看起来不太对。', 'minutes');
  update((draft) => {
    draft.politics.practice.push({
      id: uid('practice'),
      date,
      source: formText(fd, 'source') || '其他',
      chapter: formText(fd, 'chapter') || '马原',
      count,
      correct,
      minutes,
      errorTags: fd.getAll('errorTags').map(String),
      note: formText(fd, 'note'),
      createdAt: nowISO(),
    });
  });
  rerender({ preserveScroll: false });
  window.scrollTo({ top: 0, behavior: 'smooth' });
  toast(`已记录 ${correct}/${count} 题，正确率 ${pct(correct, count)}%。`, 'success');
}

function submitWrong(form, fd) {
  const prompt = formText(fd, 'prompt');
  const reason = formText(fd, 'reason');
  if (!prompt) return fail(form, '先写下题干或知识点。', 'prompt');
  if (!reason) return fail(form, '写一句错因，复盘才有用。', 'reason');
  update((draft) => {
    draft.politics.wrong.push({
      id: uid('wrong'),
      date: formText(fd, 'date') || todayKey(),
      chapter: formText(fd, 'chapter') || '马原',
      prompt,
      answer: formText(fd, 'answer'),
      reason,
      tags: fd.getAll('tags').map(String),
      mastered: false,
      createdAt: nowISO(),
    });
  });
  ui.modal = null;
  rerender();
  toast('错题已放入错题本。', 'success');
}

function submitVocab(form, fd) {
  const newCount = formInt(fd, 'newCount');
  const reviewCount = formInt(fd, 'reviewCount');
  const minutes = formInt(fd, 'minutes');
  if (newCount < 0 || reviewCount < 0) return fail(form, '单词数量不能为负数。');
  if (newCount + reviewCount === 0) return fail(form, '至少记录一个新词或复习词。', 'newCount');
  if (minutes < 1) return fail(form, '记录一下用了多少分钟。', 'minutes');
  update((draft) => {
    draft.english.vocabLogs.push({
      id: uid('vocab'),
      date: formText(fd, 'date') || todayKey(),
      source: formText(fd, 'source') || 'APP',
      newCount,
      reviewCount,
      minutes,
      note: formText(fd, 'note'),
      createdAt: nowISO(),
    });
  });
  rerender();
  toast(`已记录 ${newCount + reviewCount} 个词。`, 'success');
}

function submitWord(form, fd) {
  const word = formText(fd, 'word');
  const meaning = formText(fd, 'meaning');
  if (!word || !meaning) return fail(form, '单词和核心义都要填。');
  const existing = state.english.words.find((item) => item.word.toLowerCase() === word.toLowerCase());
  update((draft) => {
    if (existing) {
      const target = draft.english.words.find((item) => item.id === existing.id);
      target.meaning = meaning;
      target.example = formText(fd, 'example') || target.example;
    } else {
      draft.english.words.push({
        id: uid('word'),
        word,
        meaning,
        example: formText(fd, 'example'),
        mastery: 0,
        createdAt: nowISO(),
      });
    }
  });
  rerender();
  toast(existing ? '这个词已更新。' : '已加入生词本。', 'success');
}

function submitReading(form, fd) {
  const total = formInt(fd, 'total');
  const correct = formInt(fd, 'correct');
  if (total < 1) return fail(form, '总题数至少为 1。', 'total');
  if (correct < 0 || correct > total) return fail(form, '答对数不能超过总题数。', 'correct');
  update((draft) => {
    draft.english.readings.push({
      id: uid('reading'),
      date: formText(fd, 'date') || todayKey(),
      year: formInt(fd, 'year'),
      passage: formText(fd, 'passage') || '阅读',
      total,
      correct,
      minutes: formInt(fd, 'minutes'),
      errorTags: fd.getAll('errorTags').map(String),
      note: formText(fd, 'note'),
      createdAt: nowISO(),
    });
  });
  rerender();
  toast(`阅读已记录，正确率 ${pct(correct, total)}%。`, 'success');
}

function submitTranslation(form, fd) {
  const score = formNumber(fd, 'score');
  if (score === null || score < 0 || score > 15) return fail(form, '自评分需要在 0–15 之间。', 'score');
  update((draft) => {
    draft.english.translations.push({
      id: uid('translation'),
      date: formText(fd, 'date') || todayKey(),
      year: formInt(fd, 'year'),
      score,
      minutes: formInt(fd, 'minutes'),
      text: formText(fd, 'text'),
      note: formText(fd, 'note'),
      createdAt: nowISO(),
    });
  });
  rerender();
  toast('翻译记录已保存。', 'success');
}

function submitWriting(form, fd) {
  const score = formNumber(fd, 'score');
  const type = formText(fd, 'type') === 'small' ? 'small' : 'big';
  const maxScore = type === 'small' ? 10 : 15;
  if (score !== null && (score < 0 || score > maxScore)) {
    return fail(form, `${type === 'small' ? '小作文' : '大作文'}自评分需要在 0–${maxScore} 之间。`, 'score');
  }
  const topic = formText(fd, 'topic');
  if (!topic) return fail(form, '写一下题目或年份。', 'topic');
  update((draft) => {
    draft.english.writings.push({
      id: uid('writing'),
      date: formText(fd, 'date') || todayKey(),
      type,
      topic,
      score,
      minutes: formInt(fd, 'minutes'),
      outline: formText(fd, 'outline'),
      note: formText(fd, 'note'),
      createdAt: nowISO(),
    });
  });
  rerender();
  toast('作文整理已保存。', 'success');
}

function submitRecite(form, fd) {
  const front = formText(fd, 'front');
  const back = formText(fd, 'back');
  if (!front || !back) return fail(form, '问题和答案都要填写。');
  const subject = formText(fd, 'subject') === 'english' ? 'english' : 'politics';
  const category = formText(fd, 'category') || RECITE_CATEGORIES[subject][0];
  update((draft) => {
    draft.recite.push({
      id: uid('recite'),
      subject,
      category,
      front,
      back,
      tags: [],
      level: 0,
      lastReviewed: null,
      nextReview: todayKey(),
      reviewedCount: 0,
      createdAt: nowISO(),
    });
  });
  rerender();
  toast('背诵卡已加入今天的队列。', 'success');
}

function submitCheckin(form, fd) {
  const stats = taskStats(todayKey());
  const focus = focusMinutes(todayKey());
  const plan = todayPlan();
  if (!plan) return fail(form, '今天的计划还没有生成。');
  if (!isCheckedIn(todayKey()) && stats.done < 1 && focus < 10) {
    return fail(form, '完成 1 项任务，或记录 10 分钟专注后再打卡。');
  }
  const wasChecked = Boolean(plan.checkedInAt);
  setTodayCheckin({ mood: formText(fd, 'mood'), note: formText(fd, 'note') });
  ui.checkinEdit = false;
  rerender();
  if (!wasChecked) {
    celebrate();
    toast(`今日打卡完成 · 连续 ${currentStreak()} 天。`, 'success');
  } else {
    toast('今日记录已更新。', 'success');
  }
}

function submitMock(form, fd) {
  const id = form.dataset.id;
  const score = formNumber(fd, 'score');
  if (score !== null && (score < 0 || score > 50)) return fail(form, '选择题分数需要在 0–50 之间。', 'score');
  const essayProgress = formInt(fd, 'essayProgress');
  const date = formText(fd, 'date');
  update((draft) => {
    const set = draft.mocks[id];
    if (!set) return;
    set.score = score;
    set.completed = score !== null;
    set.date = date || (score !== null ? todayKey() : '');
    set.minutes = formNumber(fd, 'minutes');
    set.essayProgress = clamp(essayProgress, 0, 100);
    set.errorTags = fd.getAll('errorTags').map(String);
    set.note = formText(fd, 'note');
    set.reviewed = fd.get('reviewed') === 'on';
    set.updatedAt = nowISO();
  });
  ui.modal = null;
  rerender();
  toast(score === null ? '已清空这一套分数。' : `第 ${id.split('-')[1]} 套已记录。`, 'success');
}

function submitPaper(form, fd) {
  const year = form.dataset.year;
  const status = formText(fd, 'status') || 'todo';
  const score = formNumber(fd, 'score');
  const reading = formNumber(fd, 'readingScore');
  const translation = formNumber(fd, 'translationScore');
  const writing = formNumber(fd, 'writingScore');
  if (score !== null && (score < 0 || score > 100)) return fail(form, '总分需要在 0–100 之间。', 'score');
  if (reading !== null && (reading < 0 || reading > 40)) return fail(form, '阅读分需要在 0–40 之间。', 'readingScore');
  if (translation !== null && (translation < 0 || translation > 15)) return fail(form, '翻译分需要在 0–15 之间。', 'translationScore');
  if (writing !== null && (writing < 0 || writing > 25)) return fail(form, '作文分需要在 0–25 之间。', 'writingScore');
  if (!PAPER_STATUS.some((item) => item.id === status)) return fail(form, '请选择有效的完成状态。');
  update((draft) => {
    const paper = draft.papers[year];
    if (!paper) return;
    paper.status = status;
    paper.score = score;
    paper.readingScore = reading;
    paper.translationScore = translation;
    paper.writingScore = writing;
    paper.date = formText(fd, 'date') || (status !== 'todo' ? todayKey() : '');
    paper.minutes = formNumber(fd, 'minutes');
    paper.note = formText(fd, 'note');
    paper.reviewed = fd.get('reviewed') === 'on';
    paper.updatedAt = nowISO();
  });
  ui.modal = null;
  rerender();
  toast(`${year} 年真题记录已保存。`, 'success');
}

function submitSettings(form, fd) {
  const examDate = formText(fd, 'examDate');
  if (!isValidDateKey(examDate) || examDate <= todayKey()) {
    return fail(form, '考试日期需要晚于今天。', 'examDate');
  }
  if (examDate !== state.profile.examDate) {
    const ok = window.confirm('修改考试日期会按新日期重新排布三阶段计划。已完成任务、打卡与训练记录会保留，确定继续吗？');
    if (!ok) return false;
  }
  applySettings({ name: formText(fd, 'name'), examDate });
  rerender();
  toast('设置已保存，计划已按新日期排布。', 'success');
}

function submitReview(form, fd) {
  const weekStart = formText(fd, 'weekStart');
  if (!weekStart) return false;
  update((draft) => {
    draft.reviews[weekStart] = {
      weekStart,
      wins: formText(fd, 'wins'),
      blockers: formText(fd, 'blockers'),
      next: formText(fd, 'next'),
      updatedAt: nowISO(),
    };
  });
  rerender();
  toast('本周复盘已保存。', 'success');
}

function submitManual(form, fd) {
  const date = formText(fd, 'date') || todayKey();
  const subject = formText(fd, 'subject');
  const minutes = formInt(fd, 'minutes');
  if (minutes < 1 || minutes > 240) return fail(form, '时长需要在 1–240 分钟之间。', 'minutes');
  recordSession({ date, subject, minutes, source: 'manual' });
  ui.modal = null;
  rerender();
  toast(`已补记 ${minutes} 分钟。`, 'success');
}

const FORM_HANDLERS = {
  practice: submitPractice,
  wrong: submitWrong,
  vocab: submitVocab,
  word: submitWord,
  reading: submitReading,
  translation: submitTranslation,
  writing: submitWriting,
  recite: submitRecite,
  checkin: submitCheckin,
  mock: submitMock,
  paper: submitPaper,
  settings: submitSettings,
  review: submitReview,
  manual: submitManual,
};

/* ---------------- 操作 ---------------- */

function deleteRecord(element) {
  const collection = element.dataset.collection;
  const id = element.dataset.id;
  if (!collection || !id) return;
  if (!window.confirm('确定删除这条记录吗？此操作不可撤销。')) return;
  const path = collection.split('.');
  update((draft) => {
    let target = draft;
    for (const key of path) target = target?.[key];
    if (Array.isArray(target)) {
      const index = target.findIndex((item) => item.id === id);
      if (index >= 0) target.splice(index, 1);
    }
  });
  rerender();
  toast('已删除。');
}

function rateRecite(ratingId) {
  const due = reciteDue();
  const card = due[0];
  const rating = RECITE_RATINGS.find((item) => item.id === ratingId);
  if (!card || !rating) return;
  const today = todayKey();
  const updated = update((draft) => {
    const target = draft.recite.find((item) => item.id === card.id);
    if (!target) return null;
    target.level = clamp((target.level || 0) + rating.levelDelta, 0, 4);
    const interval = rating.id === 'again'
      ? 1
      : rating.id === 'hard'
        ? 2
        : target.level >= 4
          ? 15
          : target.level >= 3
            ? 7
            : 4;
    target.nextReview = addDays(today, interval);
    target.lastReviewed = today;
    target.reviewedCount = (target.reviewedCount || 0) + 1;
    return target;
  });
  ui.reciteRevealed = false;
  rerender();
  if (updated) toast(`已安排 ${formatDate(updated.nextReview, false)} 再复习。`, 'success');
}

function dayAction(action, element) {
  switch (action) {
    case 'toggle-menu':
      ui.mobileMenu = !ui.mobileMenu;
      render({ preserveScroll: true });
      return true;
    case 'close-menu':
      ui.mobileMenu = false;
      render({ preserveScroll: true });
      return true;
    case 'open-wrong':
      openModal({ type: 'wrong' });
      return true;
    case 'open-mock':
      openModal({ type: 'mock', setType: Number(element.dataset.type) === 4 ? 4 : 8, number: Number(element.dataset.number) || 1 });
      return true;
    case 'open-paper':
      openModal({ type: 'paper', year: Number(element.dataset.year) || 2010 });
      return true;
    case 'open-day':
      openModal({ type: 'day', date: element.dataset.date });
      return true;
    case 'close-modal':
      closeModal();
      return true;
    case 'checkin-day': {
      const date = element.dataset.date;
      checkInDate(date);
      ui.modal = null;
      rerender();
      toast(`${formatDate(date, false)} 已补打卡。`, 'success');
      return true;
    }
    case 'edit-checkin':
      ui.checkinEdit = true;
      rerender();
      return true;
    case 'cancel-edit-checkin':
      ui.checkinEdit = false;
      rerender();
      return true;
    case 'toggle-task': {
      const taskId = element.dataset.id;
      const plan = todayPlan();
      const task = plan?.tasks.find((item) => item.id === taskId);
      if (!task) return true;
      update((draft) => {
        const target = draft.plans[todayKey()]?.tasks.find((item) => item.id === taskId);
        if (target) target.done = !target.done;
      });
      const stats = taskStats(todayKey());
      rerender();
      if (stats.total && stats.done === stats.total) {
        celebrate();
        toast('今日清单已全部完成，记得打卡。', 'success');
      }
      return true;
    }
    case 'regen-plan': {
      if (!window.confirm('重新生成今天的计划会清空今天的任务勾选，打卡与专注记录会保留。确定吗？')) return true;
      regenerateToday();
      rerender();
      toast('今天的计划已重新生成。', 'success');
      return true;
    }
    case 'timer-toggle':
      if (timer.running) pauseTimer(); else startTimer();
      render({ preserveScroll: true });
      return true;
    case 'timer-duration': {
      pauseTimer();
      setDuration(Number(element.dataset.value) === 3000 ? 3000 : 1500);
      render({ preserveScroll: true });
      return true;
    }
    case 'timer-subject':
      setSubject(element.dataset.value);
      render({ preserveScroll: true });
      return true;
    case 'timer-reset':
      if (elapsedSeconds() > 30 && !window.confirm('重置计时器？当前进度不会记入。')) return true;
      resetTimer();
      render({ preserveScroll: true });
      return true;
    case 'timer-finish':
      finishTimer(false);
      return true;
    case 'manual-time':
      openModal({ type: 'manual' });
      return true;
    case 'quick-time': {
      const input = document.querySelector('form[data-form="manual"] input[name="minutes"]');
      if (input) input.value = element.dataset.value;
      return true;
    }
    case 'switch-politics':
      ui.politicsTab = element.dataset.tab === 'wrong' ? 'wrong' : 'practice';
      rerender();
      return true;
    case 'switch-english':
      ui.englishTab = ['vocab', 'reading', 'translation', 'writing'].includes(element.dataset.tab) ? element.dataset.tab : 'vocab';
      rerender();
      return true;
    case 'recite-filter':
      ui.reciteFilter = ['due', 'all', 'mastered'].includes(element.dataset.filter) ? element.dataset.filter : 'due';
      ui.reciteRevealed = false;
      rerender();
      return true;
    case 'reveal-recite':
      ui.reciteRevealed = true;
      rerender();
      return true;
    case 'rate-recite':
      rateRecite(element.dataset.rating);
      return true;
    case 'word-mastery': {
      update((draft) => {
        const word = draft.english.words.find((item) => item.id === element.dataset.id);
        if (word) word.mastery = ((Number(word.mastery) || 0) + 1) % 4;
      });
      rerender();
      return true;
    }
    case 'toggle-wrong': {
      update((draft) => {
        const record = draft.politics.wrong.find((item) => item.id === element.dataset.id);
        if (record) record.mastered = !record.mastered;
      });
      rerender();
      return true;
    }
    case 'delete-record':
      deleteRecord(element);
      return true;
    case 'export-data':
      downloadJSON(`研途备份-${todayKey()}.json`, exportState());
      toast('备份已开始下载。', 'success');
      return true;
    case 'import-trigger':
      document.querySelector('#import-file')?.click();
      return true;
    case 'reset-data': {
      if (!window.confirm('这会清空全部计划、打卡与训练记录，无法撤销。确定继续吗？')) return true;
      if (!window.confirm('最后确认一次：真的要重新开始吗？建议先导出备份。')) return true;
      resetState();
      resetTimer();
      ui.modal = null;
      ui.checkinEdit = false;
      ui.reciteRevealed = false;
      rerender();
      toast('数据已清空，从今天重新开始。', 'success');
      return true;
    }
    case 'print-plan':
      window.print();
      return true;
    case 'scroll-recite-form':
      document.querySelector('#recite-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => document.querySelector('#recite-form textarea[name="front"]')?.focus(), 350);
      return true;
    case 'focus-practice': {
      const target = document.querySelector('#practice-form');
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => target?.querySelector('input[name="correct"]')?.focus(), 350);
      return true;
    }
    default:
      return false;
  }
}

/* ---------------- 事件绑定 ---------------- */

function bindEvents() {
  document.addEventListener('click', (event) => {
    const navItem = event.target.closest('.nav-item, .bottom-item[href]');
    if (navItem) {
      const staysOnRoute = location.hash === navItem.getAttribute('href');
      if (ui.mobileMenu) {
        ui.mobileMenu = false;
        if (staysOnRoute) render({ preserveScroll: true });
      }
      if (staysOnRoute && navItem.classList.contains('bottom-item')) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
    const element = event.target.closest('[data-action]');
    if (!element) return;
    if (element.tagName === 'BUTTON' && element.disabled) return;
    event.preventDefault();
    dayAction(element.dataset.action, element);
  });

  document.addEventListener('submit', (event) => {
    const form = event.target.closest('form[data-form]');
    if (!form) return;
    event.preventDefault();
    const handler = FORM_HANDLERS[form.dataset.form];
    if (!handler) return;
    const fd = new FormData(form);
    handler(form, fd);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (ui.modal) {
      closeModal();
    } else if (ui.mobileMenu) {
      ui.mobileMenu = false;
      render({ preserveScroll: true });
    }
  });

  window.addEventListener('hashchange', () => {
    ui.modal = null;
    ui.mobileMenu = false;
    render({ preserveScroll: false });
    window.scrollTo(0, 0);
  });

  document.addEventListener('change', async (event) => {
    const importInput = event.target;
    if (!(importInput instanceof HTMLInputElement) || importInput.id !== 'import-file') return;
    const file = importInput.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      if (!window.confirm('导入会覆盖当前全部数据。确定继续吗？')) {
        importInput.value = '';
        return;
      }
      importState(text);
      ui.modal = null;
      ui.checkinEdit = false;
      ui.reciteRevealed = false;
      rerender();
      toast('备份已导入。', 'success');
    } catch (error) {
      toast(error.message || '导入失败，请检查文件。', 'error');
    } finally {
      importInput.value = '';
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (timer.running) {
        pauseTimer();
        pausedByVisibility = true;
      }
    } else if (pausedByVisibility) {
      pausedByVisibility = false;
      render({ preserveScroll: true });
    }
  });
}

function init() {
  if (!location.hash || !ROUTES[location.hash.replace(/^#/, '')]) {
    history.replaceState(null, '', '#today');
  }
  bindEvents();
  const recovered = timer.needsCompletion;
  if (recovered) {
    recordSession({ subject: timer.subject, minutes: Math.round(timer.duration / 60), source: 'timer' });
    resetTimer();
    timer.needsCompletion = false;
    persistTimer();
  }
  render({ preserveScroll: false });
  setInterval(timerTick, 500);
  if (!storageOK) {
    setTimeout(() => toast('浏览器本地存储不可用，记录可能无法保存。请检查隐私模式或站点权限。', 'error'), 700);
  }
  if (recovered) {
    setTimeout(() => toast(`上次专注已完成，已补记 ${Math.round(timer.duration / 60)} 分钟。`, 'success'), 500);
  }
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {
        // 离线缓存失败不影响核心功能。
      });
    });
  }
}

init();
