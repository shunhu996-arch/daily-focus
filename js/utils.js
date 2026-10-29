/* 研途 · 通用工具 */

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const WEEKDAYS_SHORT = ['日', '一', '二', '三', '四', '五', '六'];

export function pad(n) {
  return String(n).padStart(2, '0');
}

/** 今天的本地日期键：YYYY-MM-DD */
export function todayKey() {
  return dateKey(new Date());
}

export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 用本地时间解析日期，固定在正午，避开夏令时边界。 */
export function parseKey(key) {
  if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d, 12, 0, 0, 0);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function utcDay(key) {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** 两个日期键相差的整天数（b - a）。 */
export function diffDays(a, b) {
  return Math.round((utcDay(b) - utcDay(a)) / 86400000);
}

export function addDays(key, amount) {
  const date = parseKey(key);
  if (!date) return key;
  date.setDate(date.getDate() + amount);
  return dateKey(date);
}

export function weekdayCN(key, short = false) {
  const date = parseKey(key);
  if (!date) return '';
  return (short ? WEEKDAYS_SHORT : WEEKDAYS)[date.getDay()];
}

export function isWeekend(key) {
  const date = parseKey(key);
  return date ? date.getDay() === 0 || date.getDay() === 6 : false;
}

export function startOfWeekKey(key) {
  const date = parseKey(key);
  if (!date) return key;
  const day = date.getDay() || 7; // 周一为一周开始
  return addDays(key, 1 - day);
}

export function formatDate(key, withWeekday = true) {
  const date = parseKey(key);
  if (!date) return key || '';
  const base = `${date.getMonth() + 1}月${date.getDate()}日`;
  return withWeekday ? `${base} ${weekdayCN(key)}` : base;
}

export function formatDateFull(key) {
  const date = parseKey(key);
  if (!date) return key || '';
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${weekdayCN(key)}`;
}

export function relativeDay(key, base = todayKey()) {
  const delta = diffDays(base, key);
  if (delta === 0) return '今天';
  if (delta === 1) return '明天';
  if (delta === -1) return '昨天';
  return formatDate(key, false);
}

export function timeLabel(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function nowISO() {
  return new Date().toISOString();
}

export function uid(prefix = 'id') {
  try {
    if (globalThis.crypto?.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
  } catch (_) { /* ignore */ }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function num(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function sum(list, selector = (item) => item) {
  return (list || []).reduce((total, item) => total + num(selector(item)), 0);
}

export function average(list, selector = (item) => item) {
  const values = (list || []).map(selector).filter((value) => Number.isFinite(value));
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

export function pct(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export function formatMinutes(minutes) {
  const value = Math.max(0, Math.round(num(minutes)));
  if (value < 60) return `${value} 分钟`;
  const h = Math.floor(value / 60);
  const m = value % 60;
  return m ? `${h} 小时 ${m} 分` : `${h} 小时`;
}

export function formatClock(seconds) {
  const safe = Math.max(0, Math.ceil(seconds));
  return `${pad(Math.floor(safe / 60))}:${pad(safe % 60)}`;
}

export function shortDate(key) {
  const date = parseKey(key);
  if (!date) return '';
  return `${date.getMonth() + 1}.${pad(date.getDate())}`;
}

export function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export const esc = escapeHTML;

export function attr(value) {
  return escapeHTML(value).replaceAll('`', '&#096;');
}

export function truncate(text, length = 120) {
  const value = String(text ?? '').trim();
  if (value.length <= length) return value;
  return `${value.slice(0, length)}…`;
}

export function normalizeWhitespace(text) {
  return String(text ?? '').replace(/\s+/g, ' ').trim();
}

export function sortByDateDesc(list, key = 'date') {
  return [...(list || [])].sort((a, b) => {
    const av = `${a[key] || ''}${a.createdAt || ''}`;
    const bv = `${b[key] || ''}${b.createdAt || ''}`;
    return bv.localeCompare(av);
  });
}

export function unique(list) {
  return [...new Set(list)];
}

export function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function debounce(fn, wait = 200) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

export function isValidDateKey(key) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(key || '')) && Boolean(parseKey(key));
}

export { WEEKDAYS, WEEKDAYS_SHORT };
