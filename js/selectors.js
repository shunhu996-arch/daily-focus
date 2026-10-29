/* 研途 · 派生数据与复盘建议 */

import { state } from './store.js';
import {
  PAPER_STATUS,
  PHASES,
  PLAN_TARGET,
  phaseForDate,
  totalPlanDays,
} from './content.js';
import {
  addDays,
  average,
  diffDays,
  pct,
  startOfWeekKey,
  sum,
  todayKey,
  unique,
} from './utils.js';

export function daysLeft(date = todayKey()) {
  return Math.max(0, diffDays(date, state.profile.examDate));
}

export function planFor(date) {
  return state.plans[date] || null;
}

export function todayPlan() {
  return planFor(todayKey());
}

export function currentPhase() {
  return phaseForDate(todayKey(), state.profile);
}

export function planDayNumber(date = todayKey()) {
  return Math.max(1, diffDays(state.profile.startDate, date) + 1);
}

export function totalDays() {
  return totalPlanDays(state.profile);
}

export function focusSessions(date) {
  return state.sessions.filter((item) => item.date === date);
}

export function focusMinutes(date) {
  return sum(focusSessions(date), (item) => item.minutes);
}

export function focusBySubject(date) {
  const sessions = focusSessions(date);
  return {
    politics: sum(sessions.filter((item) => item.subject === 'politics'), (item) => item.minutes),
    english: sum(sessions.filter((item) => item.subject === 'english'), (item) => item.minutes),
  };
}

export function taskStats(date) {
  const plan = planFor(date);
  if (!plan) return { done: 0, total: 0, minutesDone: 0, minutesTotal: 0, rate: 0 };
  const done = plan.tasks.filter((item) => item.done).length;
  return {
    done,
    total: plan.tasks.length,
    minutesDone: sum(plan.tasks.filter((item) => item.done), (item) => item.minutes),
    minutesTotal: sum(plan.tasks, (item) => item.minutes),
    rate: pct(done, plan.tasks.length),
  };
}

export function isCheckedIn(date) {
  return Boolean(planFor(date)?.checkedInAt);
}

export function currentStreak() {
  let cursor = todayKey();
  if (!isCheckedIn(cursor)) cursor = addDays(cursor, -1);
  let count = 0;
  while (isCheckedIn(cursor) && count < 400) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}

export function longestStreak() {
  const days = Object.keys(state.plans).sort();
  let best = 0;
  let run = 0;
  let previous = null;
  for (const day of days) {
    if (!isCheckedIn(day)) {
      run = 0;
      previous = day;
      continue;
    }
    run = previous && diffDays(previous, day) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }
  return best;
}

export function totalCheckins() {
  return Object.values(state.plans).filter((plan) => plan.checkedInAt).length;
}

export function checkedDays() {
  return Object.keys(state.plans).filter((day) => isCheckedIn(day)).sort();
}

export function dayStats(date) {
  const focus = focusMinutes(date);
  const tasks = taskStats(date);
  return {
    date,
    focus,
    ...focusBySubject(date),
    ...tasks,
    checkedIn: isCheckedIn(date),
    target: planFor(date)?.target || PLAN_TARGET,
  };
}

export function recentDays(count = 7, end = todayKey()) {
  return Array.from({ length: count }, (_, index) => dayStats(addDays(end, index - count + 1)));
}

export function thisWeekDays() {
  const start = startOfWeekKey(todayKey());
  return Array.from({ length: 7 }, (_, index) => dayStats(addDays(start, index)));
}

export function weeklyFocusTotal() {
  return thisWeekDays().reduce((total, day) => total + day.focus, 0);
}

export function weeklyCheckins() {
  return thisWeekDays().filter((day) => day.checkedIn).length;
}

export function allPlanDays() {
  return Object.keys(state.plans).sort();
}

export function heatmapDays() {
  return allPlanDays().map((date) => {
    const day = dayStats(date);
    const level = !day.focus && !day.checkedIn
      ? 0
      : day.checkedIn && day.focus >= 120
        ? 4
        : day.checkedIn || day.focus >= 90
          ? 3
          : day.focus >= 30
            ? 2
            : 1;
    return { ...day, level, future: diffDays(todayKey(), date) > 0 };
  });
}

/* ---------------- 政治 ---------------- */

export function politicsStats() {
  const practice = state.politics.practice;
  const totalQuestions = sum(practice, (item) => item.count);
  const totalCorrect = sum(practice, (item) => item.correct);
  const today = practice.filter((item) => item.date === todayKey());
  const recent = practice.filter((item) => diffDays(item.date, todayKey()) <= 6);
  return {
    sessions: practice.length,
    totalQuestions,
    totalCorrect,
    accuracy: totalQuestions ? pct(totalCorrect, totalQuestions) : null,
    todayQuestions: sum(today, (item) => item.count),
    todayAccuracy: sum(today, (item) => item.count) ? pct(sum(today, (item) => item.correct), sum(today, (item) => item.count)) : null,
    recentQuestions: sum(recent, (item) => item.count),
    recentAccuracy: sum(recent, (item) => item.count) ? pct(sum(recent, (item) => item.correct), sum(recent, (item) => item.count)) : null,
    last: practice.slice().sort((a, b) => `${b.date}${b.createdAt || ''}`.localeCompare(`${a.date}${a.createdAt || ''}`))[0] || null,
  };
}

export function chapterAccuracy() {
  const map = new Map();
  for (const record of state.politics.practice) {
    const current = map.get(record.chapter) || { chapter: record.chapter, count: 0, correct: 0, sessions: 0 };
    current.count += Number(record.count) || 0;
    current.correct += Number(record.correct) || 0;
    current.sessions += 1;
    map.set(record.chapter, current);
  }
  return [...map.values()]
    .map((item) => ({ ...item, accuracy: pct(item.correct, item.count) }))
    .sort((a, b) => b.count - a.count);
}

export function wrongStats() {
  const all = state.politics.wrong;
  return {
    total: all.length,
    open: all.filter((item) => !item.mastered).length,
    mastered: all.filter((item) => item.mastered).length,
  };
}

export function politicsTagStats() {
  const counts = {};
  for (const record of state.politics.practice) {
    for (const tag of record.errorTags || []) {
      counts[tag] = (counts[tag] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

/* ---------------- 背诵 ---------------- */

export function reciteDue(date = todayKey()) {
  return state.recite
    .filter((card) => !card.nextReview || card.nextReview <= date)
    .sort((a, b) => String(a.nextReview).localeCompare(String(b.nextReview)));
}

export function reciteReviewedToday() {
  return state.recite.filter((card) => card.lastReviewed === todayKey()).length;
}

export function reciteStats() {
  const total = state.recite.length;
  const mastered = state.recite.filter((card) => card.level >= 3).length;
  const learning = state.recite.filter((card) => card.level > 0 && card.level < 3).length;
  const fresh = state.recite.filter((card) => card.level === 0).length;
  return {
    total,
    mastered,
    learning,
    fresh,
    due: reciteDue().length,
    reviewedToday: reciteReviewedToday(),
    progress: pct(mastered, total),
  };
}

/* ---------------- 英语 ---------------- */

export function englishStats() {
  const vocab = state.english.vocabLogs;
  const readings = state.english.readings;
  const translations = state.english.translations;
  const writings = state.english.writings;
  const weekStart = startOfWeekKey(todayKey());
  const weekVocab = vocab.filter((item) => item.date >= weekStart);
  const totalQuestions = sum(readings, (item) => item.total);
  const totalCorrect = sum(readings, (item) => item.correct);
  const scores = translations.map((item) => Number(item.score)).filter(Number.isFinite);
  return {
    vocabDays: unique(vocab.map((item) => item.date)).length,
    newWords: sum(vocab, (item) => item.newCount),
    reviewWords: sum(vocab, (item) => item.reviewCount),
    weekNewWords: sum(weekVocab, (item) => item.newCount),
    weekReviewWords: sum(weekVocab, (item) => item.reviewCount),
    words: state.english.words.length,
    wordsMastered: state.english.words.filter((item) => item.mastery >= 3).length,
    readings: readings.length,
    readingQuestions: totalQuestions,
    readingAccuracy: totalQuestions ? pct(totalCorrect, totalQuestions) : null,
    translations: translations.length,
    translationAvg: average(scores),
    writings: writings.length,
    writingAvg: average(writings.map((item, index) => (Number.isFinite(Number(item.score)) ? Number(item.score) : null)).filter((item) => item !== null)),
  };
}

export function readingErrorStats() {
  const counts = {};
  for (const record of state.english.readings) {
    for (const tag of record.errorTags || []) {
      counts[tag] = (counts[tag] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

export function lastReadingAccuracy() {
  const recent = state.english.readings
    .slice()
    .sort((a, b) => `${b.date}${b.createdAt || ''}`.localeCompare(`${a.date}${a.createdAt || ''}`))
    .slice(0, 5);
  const total = sum(recent, (item) => item.total);
  return total ? pct(sum(recent, (item) => item.correct), total) : null;
}

/* ---------------- 模考与真题 ---------------- */

export function mockStats(type) {
  const sets = Object.values(state.mocks).filter((item) => item.type === type);
  const done = sets.filter((item) => item.completed && Number.isFinite(Number(item.score)));
  const scores = done.map((item) => Number(item.score));
  const essays = done.map((item) => Number(item.essayProgress) || 0);
  return {
    type,
    done: done.length,
    total: sets.length,
    avg: average(scores),
    best: scores.length ? Math.max(...scores) : null,
    lowest: scores.length ? Math.min(...scores) : null,
    essayAvg: average(essays),
    reviewed: sets.filter((item) => item.reviewed).length,
    scores,
  };
}

export function allMockStats() {
  return {
    eight: mockStats(8),
    four: mockStats(4),
  };
}

export function paperStats() {
  const papers = Object.values(state.papers).sort((a, b) => a.year - b.year);
  const touched = papers.filter((item) => item.status !== 'todo');
  const deep = papers.filter((item) => item.status === 'deep');
  const scored = papers.filter((item) => item.score !== null && item.score !== '' && Number.isFinite(Number(item.score)));
  return {
    total: papers.length,
    touched: touched.length,
    deep: deep.length,
    done: papers.filter((item) => item.status !== 'todo').length,
    avg: average(scored.map((item) => Number(item.score))),
    best: scored.length ? Math.max(...scored.map((item) => Number(item.score))) : null,
    papers,
    progress: pct(touched.length, papers.length),
  };
}

export function statusLabel(statusId) {
  return PAPER_STATUS.find((item) => item.id === statusId)?.label || '未开始';
}

/* ---------------- 复盘 ---------------- */

export function weekReview() {
  const weekStart = startOfWeekKey(todayKey());
  return state.reviews[weekStart] || null;
}

export function priorReviews(limit = 4) {
  return Object.values(state.reviews)
    .filter((item) => item.weekStart < startOfWeekKey(todayKey()))
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart))
    .slice(0, limit);
}

export function insights() {
  const out = [];
  const p = politicsStats();
  const readingAccuracy = lastReadingAccuracy();
  const recite = reciteStats();
  const mocks = allMockStats();
  const papers = paperStats();

  if (p.recentAccuracy === null) {
    out.push({
      tone: 'neutral',
      title: '先完成第一组政治选择题',
      text: '有了正确率，复盘才有起点。今天只做 35 题，做完把错因写下来。',
      route: '#politics',
    });
  } else if (p.recentAccuracy < 65) {
    out.push({
      tone: 'warn',
      title: `政治选择题近 7 天正确率 ${p.recentAccuracy}%`,
      text: '先别加题量。回到错题所在章节，把“概念、主体、关系”各过一遍，再二刷同一批题。',
      route: '#politics',
    });
  } else if (p.recentAccuracy < 80) {
    out.push({
      tone: 'good',
      title: `政治正确率 ${p.recentAccuracy}%，正在变稳`,
      text: '保持每天一组限时选择题；多选题的重点不是“多选”，而是把每个选项错在哪里说清。',
      route: '#politics',
    });
  } else {
    out.push({
      tone: 'good',
      title: `政治正确率 ${p.recentAccuracy}%，可以练速度了`,
      text: '把选择题压到考试节奏，留时间给分析题框架。不要只刷已经会的题。',
      route: '#politics',
    });
  }

  if (readingAccuracy === null) {
    out.push({
      tone: 'neutral',
      title: '英语阅读还没有数据',
      text: '先精读 2 篇真题，记录题量与正确数；错因按“定位、推理、主旨、态度”归类。',
      route: '#english',
    });
  } else if (readingAccuracy < 65) {
    out.push({
      tone: 'warn',
      title: `阅读近 5 次正确率 ${readingAccuracy}%`,
      text: '减少新题，优先回看错题定位句。每道错题只回答：错在哪、正确项如何同义替换。',
      route: '#english',
    });
  } else {
    out.push({
      tone: 'good',
      title: `阅读正确率 ${readingAccuracy}%，保持手感`,
      text: '继续限时训练，重点看时间分配和推断题；每篇控制在 18–20 分钟。',
      route: '#english',
    });
  }

  if (recite.due > 0) {
    out.push({
      tone: recite.due > 8 ? 'warn' : 'neutral',
      title: `今天有 ${recite.due} 张背诵卡待复习`,
      text: recite.due > 8 ? '先清掉最旧的 5 张，不要一次翻完。背诵优先于刷新题。' : '用 15 分钟过一遍，忘记的卡明天会再来。',
      route: '#recite',
    });
  }

  if (mocks.eight.done > 0 && mocks.eight.avg !== null) {
    out.push({
      tone: mocks.eight.avg >= 38 ? 'good' : mocks.eight.avg >= 30 ? 'neutral' : 'warn',
      title: `肖八选择题平均 ${mocks.eight.avg.toFixed(1)} / 50`,
      text: mocks.eight.avg >= 38
        ? '分数不是终点，把错题按章节归因，二刷时只看错题。'
        : '先别追求套数。每套做完必须完成错题归因，再开下一套。',
      route: '#mocks',
    });
  }

  if (papers.touched < papers.total) {
    out.push({
      tone: 'neutral',
      title: `英语二真题已推进 ${papers.touched} / ${papers.total} 年`,
      text: '优先精刷 2015–2023；最近 3 年留作整卷模拟。做完一年的标志是“错题能讲清”，不是“对完答案”。',
      route: '#papers',
    });
  }

  return out.slice(0, 5);
}

export function nextAction() {
  const plan = todayPlan();
  if (!plan) return null;
  return plan.tasks.find((item) => !item.done) || null;
}

export function phaseProgress() {
  const phase = currentPhase();
  const days = allPlanDays().filter((day) => phaseForDate(day, state.profile).id === phase.id);
  const done = days.filter((day) => isCheckedIn(day)).length;
  return { phase, done, total: days.length, rate: pct(done, days.length) };
}

export function overallProgress() {
  const days = allPlanDays();
  const done = days.filter((day) => isCheckedIn(day)).length;
  return { done, total: days.length, rate: pct(done, days.length) };
}

export function subjectTotalMinutes() {
  return {
    politics: sum(state.sessions.filter((item) => item.subject === 'politics'), (item) => item.minutes),
    english: sum(state.sessions.filter((item) => item.subject === 'english'), (item) => item.minutes),
  };
}

export function phaseList() {
  return PHASES.map((phase) => {
    const days = allPlanDays().filter((day) => phaseForDate(day, state.profile).id === phase.id);
    return { ...phase, days, start: days[0] || null, end: days[days.length - 1] || null };
  });
}
