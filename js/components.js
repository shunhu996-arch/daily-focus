/* 研途 · 共享界面组件 */

import { MOODS, PHASES } from './content.js';
import {
  currentPhase,
  currentStreak,
  daysLeft,
  focusBySubject,
  focusMinutes,
  overallProgress,
  planDayNumber,
  reciteDue,
  taskStats,
  todayPlan,
  totalDays,
} from './selectors.js';
import { state } from './store.js';
import {
  escapeHTML as esc,
  formatDate,
  formatMinutes,
  parseKey,
  todayKey,
  weekdayCN,
} from './utils.js';

const ICONS = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/><path d="M8 7h8M8 11h6"/>',
  pen: '<path d="m12 19 7-7 3 3-7 7-3-3Z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5Z"/><path d="m2 2 7.6 7.6"/><circle cx="11" cy="11" r="2"/>',
  cards: '<rect x="3" y="5" width="13" height="16" rx="2"/><path d="M8 5V3h13v16h-2"/><path d="M7 10h5M7 14h5"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="m9 15 2 2 4-4"/>',
  chart: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  play: '<path d="m8 5 11 7-11 7V5Z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  flame: '<path d="M12 22c4 0 7-2.8 7-6.5 0-2.4-1.2-4.2-3-6.1-.5 1.6-1.3 2.5-2.2 3.1.1-2.1-.8-4.8-3.1-6.5.1 3.2-1.6 4.4-3 6.2A8 8 0 0 0 5 15.5C5 19.2 8 22 12 22Z"/><path d="M9.5 17.5c0-1.6 1.1-2.7 2.5-4 .2 1.4.8 2.1 1.5 2.7.4.4.5 1 .5 1.3 0 1.4-1 2.5-2.4 2.5s-2.1-1-2.1-2.5Z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 21h16"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 21h16"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6"/><path d="M10 11v5M14 11v5"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
  spark: '<path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7Z"/><path d="m19 17 .7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7Z"/>',
  leaf: '<path d="M20 4c-9 0-15 4-15 11a5 5 0 0 0 5 5c7 0 10-6 10-16Z"/><path d="M4 21c2-6 6-9 11-11"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  words: '<path d="M4 4h7v16H4Z"/><path d="M13 4h7v16h-7Z"/><path d="M7 8h1M7 12h1M16 8h1M16 12h1"/>',
  flag: '<path d="M5 22V3"/><path d="M5 4c5-3 9 3 14 0v9c-5 3-9-3-14 0"/>',
  seal: '<path d="M7 3h10v5H7z"/><path d="M5 8h14v13H5z"/><path d="M9 12h6M9 16h6"/>',
};

export function icon(name, size = 18) {
  const path = ICONS[name] || ICONS.spark;
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

export function brandMark(compact = false) {
  return `<span class="brand-mark ${compact ? 'is-compact' : ''}" aria-hidden="true">
    <span>岸</span>
  </span>`;
}

const NAV = [
  { route: 'today', href: '#today', label: '今日', icon: 'sun', sub: 'Today' },
  { route: 'politics', href: '#politics', label: '政治', icon: 'book', sub: 'Politics' },
  { route: 'english', href: '#english', label: '英语二', icon: 'pen', sub: 'English' },
  { route: 'recite', href: '#recite', label: '背诵清单', icon: 'cards', sub: 'Recite' },
  { route: 'mocks', href: '#mocks', label: '肖八肖四', icon: 'target', sub: 'Mock' },
  { route: 'papers', href: '#papers', label: '真题打卡', icon: 'file', sub: 'Papers' },
  { route: 'review', href: '#review', label: '复盘', icon: 'chart', sub: 'Review' },
];

export function sidebar(route) {
  const left = daysLeft();
  const phase = currentPhase();
  const done = taskStats(todayKey());
  const focus = focusMinutes(todayKey());
  const split = focusBySubject(todayKey());
  const due = reciteDue().length;
  const overall = overallProgress();
  const plan = todayPlan();
  const target = plan?.target || 170;
  const progress = Math.min(100, Math.round((focus / Math.max(1, target)) * 100));
  const exam = state.profile.examDate;
  const examDate = parseKey(exam);
  const examPrint = examDate ? `${examDate.getFullYear()}.${String(examDate.getMonth() + 1).padStart(2, '0')}.${String(examDate.getDate()).padStart(2, '0')}` : '';

  return `
    <div class="sidebar-inner">
      <div class="brand">
        ${brandMark()}
        <div class="brand-copy">
          <strong>研途</strong>
          <span>五十日冲刺 · YANTU</span>
        </div>
      </div>

      <section class="countdown-card" aria-label="考试倒计时">
        <div class="countdown-kicker">
          <span>距 2027 考研初试</span>
          <i></i>
        </div>
        <div class="countdown-number">
          <strong>${left}</strong><span>天</span>
        </div>
        <div class="countdown-meta">
          <span>${examPrint} · ${examDate ? weekdayCN(exam) : ''}</span>
          <span>第 ${planDayNumber()} / ${totalDays()} 天</span>
        </div>
        <div class="phase-chip tone-${phase.tone}">${phase.label}<span>${phase.goal}</span></div>
      </section>

      <nav class="main-nav" aria-label="主要导航">
        ${NAV.map((item) => {
          const active = item.route === route;
          const badge = item.route === 'recite' && due ? `<em>${due}</em>` : '';
          return `<a href="${item.href}" class="nav-item ${active ? 'is-active' : ''}" ${active ? 'aria-current="page"' : ''}>
            <span class="nav-icon">${icon(item.icon, 19)}</span>
            <span class="nav-label">${item.label}<small>${item.sub}</small></span>
            ${badge}
          </a>`;
        }).join('')}
      </nav>

      <section class="side-budget" aria-label="今日时长">
        <div class="side-budget-head">
          <span>今日配额</span>
          <b>${focus} <small>/ ${target} 分钟</small></b>
        </div>
        <div class="progress-line slim"><i style="width:${Math.min(100, (focus / Math.max(1, target)) * 100)}%"></i></div>
        <div class="side-budget-split">
          <span>${done.done}/${done.total} 项任务</span>
          <span>${progress}%</span>
        </div>
        <div class="subject-dots">
          <span><i class="dot politics"></i>政治 ${split.politics}m</span>
          <span><i class="dot english"></i>英语 ${split.english}m</span>
        </div>
      </section>

      <div class="sidebar-foot">
        <span>${icon('lock', 13)} 只存本机</span>
        <span>无需登录</span>
        <span class="tiny-progress">已打卡 ${overall.done}/${overall.total}</span>
      </div>
    </div>`;
}

export function mobileTopbar(route) {
  const left = daysLeft();
  const current = NAV.find((item) => item.route === route);
  return `
    <button class="menu-button" type="button" data-action="toggle-menu" aria-label="打开菜单" aria-expanded="false">
      ${icon('menu', 22)}
    </button>
    <a class="mobile-brand" href="#today">
      ${brandMark(true)}
      <span><b>研途</b><small>${current?.label || '今日'}</small></span>
    </a>
    <span class="mobile-countdown"><b>${left}</b> 天</span>`;
}

const QUICK_NAV = [
  { route: 'today', label: '今日', icon: 'sun' },
  { route: 'politics', label: '政治', icon: 'book' },
  { route: 'english', label: '英语', icon: 'pen' },
  { route: 'recite', label: '背诵', icon: 'cards' },
];

export function bottomNav(route, menuOpen = false) {
  const moreActive = ['mocks', 'papers', 'review'].includes(route);
  const due = reciteDue().length;
  return `${QUICK_NAV.map((item) => {
    const active = item.route === route && !menuOpen;
    return `<a href="#${item.route}" class="bottom-item ${active ? 'is-active' : ''}" ${active ? 'aria-current="page"' : ''}>
      <span class="bottom-icon">${icon(item.icon, 21)}${item.route === 'recite' && due ? `<em>${due}</em>` : ''}</span>
      <small>${item.label}</small>
    </a>`;
  }).join('')}
  <button type="button" class="bottom-item ${moreActive || menuOpen ? 'is-active' : ''}" data-action="toggle-menu" aria-expanded="${menuOpen}" aria-label="打开全部模块">
    <span class="bottom-icon">${icon('menu', 21)}</span>
    <small>更多</small>
  </button>`;
}

export function pageHead({ eyebrow, title, sub, actions = '', accent = 'red' }) {
  return `<header class="page-head accent-${accent}">
    <div class="page-head-copy">
      ${eyebrow ? `<div class="eyebrow"><i></i>${esc(eyebrow)}</div>` : ''}
      <h1>${title}</h1>
      ${sub ? `<p>${sub}</p>` : ''}
    </div>
    ${actions ? `<div class="head-actions">${actions}</div>` : ''}
  </header>`;
}

export function statCard({ label, value, unit = '', hint = '', tone = '', iconName = '' }) {
  return `<div class="stat-card ${tone}">
    <div class="stat-label">${iconName ? icon(iconName, 15) : ''}${esc(label)}</div>
    <div class="stat-value">${value}${unit ? `<small>${unit}</small>` : ''}</div>
    ${hint ? `<div class="stat-hint">${hint}</div>` : ''}
  </div>`;
}

export function taskRow(task, plan) {
  const subjectLabel = task.subject === 'politics' ? '政治' : '英语';
  return `<div class="task-item ${task.done ? 'is-done' : ''} ${task.subject}">
    <button class="task-check" type="button" data-action="toggle-task" data-id="${task.id}"
      aria-label="${task.done ? '取消完成' : '标记完成'}：${esc(task.title)}" aria-pressed="${task.done}">
      ${task.done ? icon('check', 14) : ''}
    </button>
    <div class="task-content">
      <div class="task-top">
        <span class="subject-tag ${task.subject}">${subjectLabel}</span>
        <h3>${esc(task.title)}</h3>
      </div>
      <p>${esc(task.detail)}</p>
      <div class="task-meta">
        <span>${icon('clock', 13)} ${task.minutes} 分钟</span>
        <a href="${task.route}">去记录 ${icon('arrow', 12)}</a>
      </div>
    </div>
    <span class="task-index">${String((plan?.tasks || []).indexOf(task) + 1).padStart(2, '0')}</span>
  </div>`;
}

export function emptyState({ iconName = 'leaf', title, text, action = '' }) {
  return `<div class="empty-state">
    <span class="empty-icon">${icon(iconName, 26)}</span>
    <h3>${esc(title)}</h3>
    <p>${esc(text)}</p>
    ${action}
  </div>`;
}

export function badge(text, tone = 'neutral') {
  return `<span class="badge ${tone}">${esc(text)}</span>`;
}

export function phaseBadge(phase) {
  const found = PHASES.find((item) => item.id === phase) || PHASES[0];
  return badge(found.label, found.tone);
}

export function moodPicker(selected = '') {
  return `<div class="mood-picker" role="radiogroup" aria-label="今日状态">
    ${MOODS.map((mood) => `<label class="mood-option ${selected === mood.id ? 'is-selected' : ''}">
      <input type="radio" name="mood" value="${mood.id}" ${selected === mood.id ? 'checked' : ''}>
      <span>${mood.char}</span><small>${mood.label}</small>
    </label>`).join('')}
  </div>`;
}

export function tagChecks(name, tags, selected = []) {
  return `<div class="tag-checks">
    ${tags.map((tag, index) => `<label class="check-chip">
      <input type="checkbox" name="${name}" value="${esc(tag)}" id="${name}-${index}" ${selected.includes(tag) ? 'checked' : ''}>
      <span>${esc(tag)}</span>
    </label>`).join('')}
  </div>`;
}

export function heatmap(days, title = '51 天打卡轨迹') {
  if (!days.length) return '';
  const first = parseKey(days[0].date);
  const lead = first ? (first.getDay() + 6) % 7 : 0;
  const today = todayKey();
  const checked = days.filter((day) => day.checkedIn).length;
  const rate = Math.round((checked / days.length) * 100);
  const cells = [
    ...Array.from({ length: lead }, () => '<span class="heat-cell is-blank"></span>'),
    ...days.map((day) => `<button type="button" class="heat-cell level-${day.level} ${day.future ? 'is-future' : ''} ${day.date === today ? 'is-today' : ''}"
      data-action="open-day" data-date="${day.date}"
      title="${formatDate(day.date)} · ${day.checkedIn ? '已打卡' : '未打卡'} · 专注 ${day.focus} 分钟"
      aria-label="${formatDate(day.date)}，${day.checkedIn ? '已打卡' : '未打卡'}，专注 ${day.focus} 分钟"></button>`),
  ].join('');
  return `<div class="heatmap-wrap">
    <div class="heatmap-head">
      <div>
        <h3>${esc(title)}</h3>
        <p>每个格子都是一天。颜色深一点，今天就更稳一点。</p>
      </div>
      <div class="heatmap-legend"><span>少</span><i class="level-0"></i><i class="level-1"></i><i class="level-2"></i><i class="level-3"></i><i class="level-4"></i><span>多</span></div>
    </div>
    <div class="heatmap-body">
      <div class="heatmap-weekdays"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div>
      <div class="heatmap-grid">${cells}</div>
      <div class="heatmap-side">
        <span>打卡率</span>
        <b>${rate}<small>%</small></b>
        <em>${checked} / ${days.length} 天</em>
        <i></i>
        <span>连续</span>
        <b>${currentStreak()}<small>天</small></b>
      </div>
    </div>
    <div class="heatmap-foot"><span><i class="today-mark"></i>今天</span><span>点击任意一天查看详情</span></div>
  </div>`;
}

export function modalShell({ eyebrow = '', title, body, footer = '', size = 'normal' }) {
  return `<div class="modal-layer">
    <div class="modal-backdrop" data-action="close-modal"></div>
    <section class="modal ${size === 'wide' ? 'is-wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button class="modal-close" type="button" data-action="close-modal" aria-label="关闭">${icon('close', 20)}</button>
      <header class="modal-head">
        ${eyebrow ? `<div class="eyebrow"><i></i>${esc(eyebrow)}</div>` : ''}
        <h2 id="modal-title">${title}</h2>
      </header>
      <div class="modal-body">${body}</div>
      ${footer ? `<footer class="modal-foot">${footer}</footer>` : ''}
    </section>
  </div>`;
}

export function timeSince(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  const minutes = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.floor(hours / 24)} 天前`;
}

export function focusBudgetLabel(minutes) {
  return formatMinutes(minutes);
}

export function pageFooter() {
  return `<footer class="page-footer">
    <span>${brandMark(true)} 研途 · 五十日冲刺</span>
    <span>数据仅保存在当前浏览器 · 建议每周导出一次备份</span>
  </footer>`;
}

export { NAV };
