/* 今日驾驶舱 */

import { stackedBars, progressLine, ring } from '../charts.js';
import {
  moodPicker,
  heatmap,
  icon,
  pageHead,
  phaseBadge,
  taskRow,
} from '../components.js';
import {
  MOODS,
  PHASES,
  dayGreeting,
  phaseDates,
  weekdayTheme,
} from '../content.js';
import { ui } from '../ui.js';
import {
  currentPhase,
  currentStreak,
  daysLeft,
  focusBySubject,
  focusMinutes,
  heatmapDays,
  nextAction,
  overallProgress,
  phaseList,
  planDayNumber,
  reciteDue,
  reciteReviewedToday,
  taskStats,
  thisWeekDays,
  todayPlan,
  totalDays,
  weeklyCheckins,
  weeklyFocusTotal,
} from '../selectors.js';
import { state } from '../store.js';
import { timer } from '../timer.js';
import {
  escapeHTML as esc,
  formatDateFull,
  formatMinutes,
  pct,
  shortDate,
  sum,
  timeLabel,
  todayKey,
  truncate,
  weekdayCN,
} from '../utils.js';

const RING_R = 78;
const RING_C = 2 * Math.PI * RING_R;

function timerPercentValue() {
  if (!timer.running) {
    return Math.max(0, Math.min(100, ((timer.duration - timer.remaining) / timer.duration) * 100));
  }
  const remaining = Math.max(0, (timer.endAt - Date.now()) / 1000);
  return Math.max(0, Math.min(100, ((timer.duration - remaining) / timer.duration) * 100));
}

function timerClockValue() {
  const seconds = timer.running
    ? Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000))
    : Math.max(0, Math.ceil(timer.remaining));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function phaseRail() {
  const current = currentPhase();
  const phases = phaseList();
  return `<section class="phase-rail" aria-label="三阶段安排">
    ${phases.map((phase, index) => {
      const dates = phase.dateRange || phaseDates(phase.id, state.profile);
      const isActive = phase.id === current.id;
      const start = phases[index + 1]?.start;
      const isDone = start && start <= todayKey() && !isActive;
      return `<div class="phase-step ${isActive ? 'is-active' : ''} ${isDone ? 'is-done' : ''} tone-${phase.tone}">
        <span class="phase-index">0${index + 1}</span>
        <div class="phase-copy">
          <strong>${phase.label}</strong>
          <small>${dates.start ? shortDate(dates.start) : ''} – ${dates.end ? shortDate(dates.end) : ''}</small>
        </div>
        <span class="phase-days">${phase.days.length} 天</span>
      </div>`;
    }).join('')}
  </section>`;
}

function timerCard() {
  const todayFocus = focusMinutes(todayKey());
  const elapsed = timer.running
    ? (timer.duration - Math.max(0, (timer.endAt - Date.now()) / 1000))
    : timer.duration - timer.remaining;
  const canFinish = elapsed >= 45;
  const percent = timerPercentValue();
  const offset = RING_C - (percent / 100) * RING_C;
  const subjectLabel = timer.subject === 'politics' ? '政治' : '英语二';
  const status = timer.running ? '专注中' : elapsed > 0 ? '已暂停' : '待开始';
  return `<section class="card timer-card ${timer.subject}" id="focus-timer" aria-label="专注计时">
    <div class="card-head compact">
      <div>
        <div class="eyebrow"><i></i>FOCUS</div>
        <h2>专注计时</h2>
      </div>
      <span class="timer-status ${timer.running ? 'is-running' : ''}" id="timer-status">${status}</span>
    </div>
    <div class="timer-dial">
      <svg viewBox="0 0 180 180" class="timer-svg" aria-hidden="true">
        <circle cx="90" cy="90" r="${RING_R}" class="timer-track"></circle>
        <circle cx="90" cy="90" r="${RING_R}" class="timer-progress" id="timer-progress"
          stroke-dasharray="${RING_C.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}"></circle>
        <circle cx="90" cy="90" r="64" class="timer-inner"></circle>
      </svg>
      <div class="timer-center">
        <span id="timer-display">${timerClockValue()}</span>
        <small id="timer-caption">${subjectLabel} · ${timer.duration / 60} 分钟</small>
      </div>
    </div>
    <div class="timer-settings">
      <div class="segmented" role="group" aria-label="计时长度">
        <button type="button" data-action="timer-duration" data-value="1500" class="${timer.duration === 1500 ? 'is-active' : ''}">25 分</button>
        <button type="button" data-action="timer-duration" data-value="3000" class="${timer.duration === 3000 ? 'is-active' : ''}">50 分</button>
      </div>
      <div class="segmented" role="group" aria-label="科目">
        <button type="button" data-action="timer-subject" data-value="politics" class="${timer.subject === 'politics' ? 'is-active' : ''}">政治</button>
        <button type="button" data-action="timer-subject" data-value="english" class="${timer.subject === 'english' ? 'is-active' : ''}">英语</button>
      </div>
    </div>
    <div class="timer-actions">
      <button type="button" class="btn btn-primary" data-action="timer-toggle" id="timer-toggle">
        ${icon(timer.running ? 'pause' : 'play', 16)}${timer.running ? '暂停' : elapsed > 0 ? '继续' : '开始专注'}
      </button>
      <button type="button" class="btn btn-quiet" data-action="timer-finish" ${canFinish ? '' : 'disabled'}>结束并记入</button>
      <button type="button" class="icon-button" data-action="timer-reset" aria-label="重置计时器">${icon('reset', 17)}</button>
    </div>
    <div class="timer-foot">
      <span>今日已专注 <b>${todayFocus}</b> 分钟</span>
      <button type="button" class="link-button" data-action="manual-time">补记时长</button>
    </div>
  </section>`;
}

function checkinCard() {
  const plan = todayPlan();
  const date = todayKey();
  const stats = taskStats(date);
  const focus = focusMinutes(date);
  const checked = Boolean(plan?.checkedInAt);
  const mood = MOODS.find((item) => item.id === plan?.mood);
  const showForm = !checked || ui.checkinEdit;
  return `<section class="card checkin-card ${checked ? 'is-checked' : ''}" id="checkin" aria-label="今日打卡">
    <div class="checkin-head">
      <div>
        <div class="eyebrow"><i></i>CHECK IN</div>
        <h2>${checked ? '今天，算数。' : '给今天一个确认'}</h2>
      </div>
      ${checked ? `<div class="checkin-stamp" aria-label="已打卡"><span>已</span><b>打卡</b><small>${timeLabel(plan.checkedInAt)}</small></div>` : `<span class="checkin-orbit">${icon('seal', 20)}</span>`}
    </div>
    ${checked ? `<div class="checkin-summary">
      <p>${mood ? `${mood.char} · ${mood.label}` : '今日已打卡'}${plan.note ? `<span>${esc(plan.note)}</span>` : ''}</p>
      <div class="checkin-numbers">
        <span><b>${stats.done}</b>/${stats.total} 项任务</span>
        <span><b>${focus}</b> 分钟专注</span>
      </div>
      ${!ui.checkinEdit ? `<button type="button" class="link-button" data-action="edit-checkin">修改今日记录</button>` : ''}
    </div>` : ''}
    ${showForm ? `<form data-form="checkin" class="checkin-form">
      <p class="checkin-prompt">${checked ? '调整一下状态或备注。' : '完成后打勾，不追求完美，只确认今天没有断。'}</p>
      ${moodPicker(plan?.mood || '')}
      <label class="field">
        <span class="field-label">今天留一句话 <small>可选</small></span>
        <textarea class="textarea" name="note" rows="2" maxlength="180" placeholder="例如：多选题的关系题还是会混，明天先看这一块。">${esc(plan?.note || '')}</textarea>
      </label>
      <div class="checkin-eligibility">
        <span>${stats.done > 0 || focus >= 10 ? `${icon('check', 14)} 已满足打卡条件` : `${icon('info', 14)} 完成 1 项任务或记录 10 分钟专注后打卡`}</span>
      </div>
      <button type="submit" class="btn btn-primary btn-block">${checked ? '保存今日记录' : '完成今日打卡'}</button>
      ${checked ? '<button type="button" class="link-button center" data-action="cancel-edit-checkin">收起</button>' : ''}
    </form>` : ''}
  </section>`;
}

function recitePreview() {
  const due = reciteDue();
  const reviewed = reciteReviewedToday();
  return `<section class="card preview-card recite-preview">
    <div class="card-head compact">
      <div>
        <div class="eyebrow"><i></i>RECITE</div>
        <h2>今日要背</h2>
      </div>
      <a class="text-link" href="#recite">全部 ${icon('arrow', 13)}</a>
    </div>
    ${due.length ? `<div class="due-count"><b>${due.length}</b><span>张待复习</span><small>今日已完成 ${reviewed} 张</small></div>
      <ul class="mini-recite-list">
        ${due.slice(0, 3).map((card) => `<li>
          <span class="mini-subject ${card.subject}">${card.subject === 'politics' ? '政' : '英'}</span>
          <div><b>${esc(truncate(card.front, 34))}</b><small>${esc(card.category)}</small></div>
        </li>`).join('')}
      </ul>
      <a href="#recite" class="btn btn-secondary btn-block">开始复习 ${icon('arrow', 15)}</a>`
      : `<div class="recite-clear"><span>${icon('check', 22)}</span><div><b>今天的卡都清完了</b><p>可以去背一段作文，或者提前看看明天的卡。</p></div></div>
        <a href="#recite" class="btn btn-secondary btn-block">打开背诵清单 ${icon('arrow', 15)}</a>`}
  </section>`;
}

function weekCard() {
  const days = thisWeekDays().map((day) => ({
    ...day,
    label: day.date === todayKey() ? '今' : weekdayCN(day.date, true),
  }));
  const total = weeklyFocusTotal();
  const checkins = weeklyCheckins();
  return `<section class="card week-card">
    <div class="card-head compact">
      <div>
        <div class="eyebrow"><i></i>THIS WEEK</div>
        <h2>本周节奏</h2>
      </div>
      <div class="week-total"><b>${formatMinutes(total)}</b><span>${checkins} 次打卡</span></div>
    </div>
    ${stackedBars(days, { today: todayKey(), max: 180 })}
    <p class="card-note">不追每天满分，追每天不断。低于 90 分钟的日子，第二天优先补上最薄弱的一项。</p>
  </section>`;
}

function lowerSection() {
  return `<div class="lower-grid">
    <section class="card heatmap-card">
      ${heatmap(heatmapDays())}
    </section>
    ${weekCard()}
  </div>`;
}

export function todayView() {
  const date = todayKey();
  const plan = todayPlan();
  const phase = currentPhase();
  const left = daysLeft();
  const stats = taskStats(date);
  const focus = focusMinutes(date);
  const split = focusBySubject(date);
  const streak = currentStreak();
  const overall = overallProgress();
  const due = reciteDue();
  const next = nextAction();
  const phaseDatesNow = phaseDates(phase.id, state.profile);

  if (!plan) {
    return `<div class="view today-view">
      ${pageHead({
        eyebrow: '考试日',
        title: left === 0 ? '今天上考场。' : '计划还在等你。',
        sub: left === 0 ? '把会做的做对，把该拿的分拿到。' : '去设置里检查考试日期，重新生成计划。',
      })}
      <section class="card exam-card">
        <span class="exam-seal">岸</span>
        <h2>${left === 0 ? '走到这里，已经很了不起。' : '计划没有生成'}</h2>
        <p>${left === 0 ? '不再刷新知识，不再比较进度。按平时的节奏，把每一道会做的题做对。' : '请前往复盘页检查考试日期与开始日期。'}</p>
        <a href="${left === 0 ? '#review' : '#review'}" class="btn btn-primary">${left === 0 ? '看看这一路' : '去设置计划'}</a>
      </section>
    </div>`;
  }

  const pPlanned = sum(plan.tasks.filter((item) => item.subject === 'politics'), (item) => item.minutes);
  const ePlanned = sum(plan.tasks.filter((item) => item.subject === 'english'), (item) => item.minutes);
  const todayLabel = formatDateFull(date);
  const name = state.profile.name ? `，${esc(state.profile.name)}` : '';
  const dailyProgress = pct(stats.done, stats.total);

  return `<div class="view today-view">
    ${pageHead({
      eyebrow: `${todayLabel} · 第 ${planDayNumber()} / ${totalDays()} 天`,
      title: '把今天过好，岸会自己靠近。',
      sub: '不用把 50 天一次想完。今天只完成这张清单，然后去睡觉。',
      actions: `<button type="button" class="btn btn-quiet" data-action="manual-time">${icon('plus', 15)} 补记时长</button>
        <button type="button" class="btn btn-quiet" data-action="print-plan">${icon('file', 15)} 打印计划</button>`,
    })}

    <section class="today-hero">
      <div class="hero-copy">
        <div class="hero-greeting">${dayGreeting(date)}${name}。</div>
        <p class="hero-quote">“${esc(plan.guidance)}”</p>
        <div class="hero-tags">
          ${phaseBadge(plan.phase)}
          <span>${weekdayTheme(date)}</span>
          <span>${plan.tasks.length} 项 · ${plan.target} 分钟</span>
          <span>上限 180 分钟</span>
        </div>
      </div>
      <div class="hero-day" aria-label="第 ${planDayNumber()} 天，共 ${totalDays()} 天">
        <span>DAY</span>
        <strong>${String(planDayNumber()).padStart(2, '0')}</strong>
        <em>/ ${totalDays()}</em>
        <i style="--day-progress:${pct(stats.done, stats.total)}%"></i>
      </div>
    </section>

    <section class="stat-strip">
      <div class="stat-card streak">
        <div class="stat-label">${icon('flame', 15)} 连续打卡</div>
        <div class="stat-value">${streak}<small>天</small></div>
        <div class="stat-hint">已打卡 ${overall.done} / ${overall.total} 天</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${icon('clock', 15)} 今日专注</div>
        <div class="stat-value">${focus}<small>分钟</small></div>
        <div class="stat-hint">${focus >= plan.target ? '已达到今日计划' : `还差 ${Math.max(0, plan.target - focus)} 分钟完成计划`}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${icon('check', 15)} 今日任务</div>
        <div class="stat-value">${stats.done}<small>/ ${stats.total} 项</small></div>
        <div class="stat-hint">${dailyProgress}% · ${stats.minutesDone} 分钟内容</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${icon('cards', 15)} 待背卡片</div>
        <div class="stat-value">${due.length}<small>张</small></div>
        <div class="stat-hint">${reciteReviewedToday()} 张今天已复习</div>
      </div>
    </section>

    ${phaseRail()}

    <div class="today-layout">
      <div class="today-main">
        <section class="card plan-card" id="today-plan">
          <div class="plan-head">
            <div class="plan-head-copy">
              <div class="eyebrow"><i></i>TODAY'S PLAN</div>
              <h2>今天的 ${plan.target} 分钟</h2>
              <p>先做最难的，再做最熟的。${next ? `下一项：${esc(next.title)}` : '清单已全部完成，去打卡。'}</p>
            </div>
            <div class="plan-ring">
              ${ring(dailyProgress, { size: 78, stroke: 6, color: 'var(--red)' })}
              <span><b>${dailyProgress}%</b><small>完成</small></span>
            </div>
          </div>
          <div class="plan-split">
            <div class="plan-subject politics">
              <span><i class="dot politics"></i>政治</span>
              <b>${pPlanned} 分钟</b>
              <div class="progress-line slim"><i style="width:${Math.min(100, (split.politics / Math.max(1, pPlanned)) * 100)}%"></i></div>
              <small>已专注 ${split.politics} 分钟</small>
            </div>
            <div class="plan-subject english">
              <span><i class="dot english"></i>英语二</span>
              <b>${ePlanned} 分钟</b>
              <div class="progress-line slim"><i style="width:${Math.min(100, (split.english / Math.max(1, ePlanned)) * 100)}%"></i></div>
              <small>已专注 ${split.english} 分钟</small>
            </div>
          </div>
          <div class="task-list">
            ${plan.tasks.map((task) => taskRow(task, plan)).join('')}
          </div>
          <div class="plan-foot">
            <span>${icon('info', 14)} 计划 ${plan.target} 分钟，留 10 分钟缓冲；超过 180 分钟就停。</span>
            <button type="button" class="link-button subtle" data-action="regen-plan">重新生成今日计划</button>
          </div>
        </section>

        ${lowerSection()}
      </div>

      <aside class="today-side">
        ${timerCard()}
        ${checkinCard()}
        ${recitePreview()}
        <section class="card phase-focus-card">
          <div class="eyebrow"><i></i>PHASE</div>
          <h2>${phase.label}</h2>
          <p>${esc(phase.desc)}</p>
          <div class="phase-focus-meta">
            <span>${shortDate(phaseDatesNow.start)} – ${shortDate(phaseDatesNow.end)}</span>
            <b>${phase.goal}</b>
          </div>
          <div class="phase-list-mini">
            ${PHASES.map((item) => `<span class="${item.id === phase.id ? 'is-active' : ''}">${item.label}</span>`).join('')}
          </div>
        </section>
      </aside>
    </div>
  </div>`;
}
