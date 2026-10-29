/* 研途 · 专注计时器（跨刷新保存） */

import { loadTimer, saveTimer } from './store.js';
import { clamp } from './utils.js';

const ALLOWED = [1500, 3000];
const FALLBACK = {
  duration: 1500,
  remaining: 1500,
  subject: 'politics',
  running: false,
  endAt: null,
  needsCompletion: false,
};

function hydrate() {
  const saved = loadTimer();
  if (!saved || typeof saved !== 'object') return { ...FALLBACK };
  const duration = ALLOWED.includes(Number(saved.duration)) ? Number(saved.duration) : 1500;
  let remaining = clamp(Number(saved.remaining) || duration, 0, duration);
  let running = Boolean(saved.running);
  let needsCompletion = false;
  if (running && saved.endAt) {
    const live = (Number(saved.endAt) - Date.now()) / 1000;
    if (live <= 0) {
      remaining = 0;
      running = false;
      needsCompletion = true;
    } else {
      remaining = Math.ceil(live);
    }
  } else if (running) {
    running = false;
  }
  return {
    duration,
    remaining,
    subject: saved.subject === 'english' ? 'english' : 'politics',
    running,
    endAt: running ? Number(saved.endAt) : null,
    needsCompletion,
  };
}

export const timer = hydrate();

export function persistTimer() {
  saveTimer({
    duration: timer.duration,
    remaining: Math.round(timer.remaining),
    subject: timer.subject,
    running: timer.running,
    endAt: timer.endAt,
  });
}

export function remainingNow() {
  if (!timer.running || !timer.endAt) return Math.max(0, timer.remaining);
  return Math.max(0, (timer.endAt - Date.now()) / 1000);
}

export function elapsedSeconds() {
  return Math.max(0, timer.duration - remainingNow());
}

export function elapsedMinutes() {
  return Math.max(0, Math.round(elapsedSeconds() / 60));
}

export function timerPercent() {
  return clamp(Math.round((elapsedSeconds() / timer.duration) * 100), 0, 100);
}

export function startTimer() {
  if (timer.running) return;
  const remaining = Math.max(1, timer.remaining);
  timer.remaining = remaining;
  timer.running = true;
  timer.endAt = Date.now() + remaining * 1000;
  persistTimer();
}

export function pauseTimer() {
  if (!timer.running) return;
  timer.remaining = Math.max(0, (timer.endAt - Date.now()) / 1000);
  timer.running = false;
  timer.endAt = null;
  persistTimer();
}

export function resetTimer(keepSubject = true) {
  timer.running = false;
  timer.endAt = null;
  timer.remaining = timer.duration;
  if (!keepSubject) timer.subject = 'politics';
  persistTimer();
}

export function setDuration(seconds) {
  if (!ALLOWED.includes(seconds)) return;
  timer.duration = seconds;
  timer.running = false;
  timer.endAt = null;
  timer.remaining = seconds;
  persistTimer();
}

export function setSubject(subject) {
  timer.subject = subject === 'english' ? 'english' : 'politics';
  persistTimer();
}

export function markCompleted() {
  timer.remaining = 0;
  timer.running = false;
  timer.endAt = null;
  persistTimer();
}

export { ALLOWED };
