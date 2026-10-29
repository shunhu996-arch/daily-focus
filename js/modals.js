/* 研途 · 弹层表单 */

import {
  badge,
  icon,
  modalShell,
  tagChecks,
} from './components.js';
import {
  MOODS,
  MOCK_ERROR_TAGS,
  PAPER_STATUS,
  POLITICS_CHAPTERS,
  POLITICS_ERROR_TAGS,
} from './content.js';
import {
  focusBySubject,
  focusMinutes,
  isCheckedIn,
  planFor,
  taskStats,
} from './selectors.js';
import { state } from './store.js';
import { ui } from './ui.js';
import {
  escapeHTML as esc,
  formatDateFull,
  timeLabel,
  todayKey,
} from './utils.js';

function cancelButton(label = '取消') {
  return `<button type="button" class="btn btn-quiet" data-action="close-modal">${label}</button>`;
}

function wrongModal() {
  return modalShell({
    eyebrow: 'WRONG BOOK',
    title: '记一道错题',
    body: `<form data-form="wrong" class="modal-form">
      <div class="form-grid two">
        <label class="field"><span class="field-label">章节</span><select class="select" name="chapter">${POLITICS_CHAPTERS.map((chapter) => `<option>${chapter}</option>`).join('')}</select></label>
        <label class="field"><span class="field-label">日期</span><input class="input" type="date" name="date" value="${todayKey()}" max="${todayKey()}" required></label>
      </div>
      <label class="field"><span class="field-label">题干 / 知识点</span><textarea class="textarea" name="prompt" rows="3" maxlength="600" placeholder="只写能帮你回忆起这道题的内容，不必抄全题。" required></textarea></label>
      <label class="field"><span class="field-label">正确答案 / 知识点</span><textarea class="textarea" name="answer" rows="2" maxlength="600" placeholder="正确项为什么对？错误项错在哪个词？"></textarea></label>
      <label class="field"><span class="field-label">我的错因</span><textarea class="textarea" name="reason" rows="2" maxlength="400" placeholder="例如：把“根本任务”看成了“根本目的”。" required></textarea></label>
      <div class="field"><span class="field-label">错因标签 <small>可多选</small></span>${tagChecks('tags', POLITICS_ERROR_TAGS)}</div>
      <div class="modal-actions">${cancelButton()}<button type="submit" class="btn btn-primary">保存到错题本</button></div>
    </form>`,
  });
}

function mockModal() {
  const { setType, number } = ui.modal;
  const key = `${setType}-${number}`;
  const set = state.mocks[key];
  if (!set) return '';
  const isEight = setType === 8;
  return modalShell({
    eyebrow: isEight ? 'XIAO BA' : 'XIAO SI',
    title: `肖${isEight ? '八' : '四'} · 第 ${number} 套`,
    body: `<form data-form="mock" data-id="${key}" class="modal-form">
      <div class="score-callout">
        <div><span>选择题</span><b>${set.score ?? '—'}<small>/ 50</small></b></div>
        <p>${set.completed ? `已记录${set.date ? ` · ${set.date}` : ''}` : '记录分数，也记录错因。'}</p>
      </div>
      <div class="form-grid three">
        <label class="field"><span class="field-label">完成日期</span><input class="input" type="date" name="date" value="${set.date || todayKey()}" max="${todayKey()}"></label>
        <label class="field"><span class="field-label">选择题分数</span><input class="input" type="number" name="score" min="0" max="50" step="1" value="${set.score ?? ''}" placeholder="0–50"></label>
        <label class="field"><span class="field-label">用时（分钟）</span><input class="input" type="number" name="minutes" min="0" max="180" value="${set.minutes ?? ''}" placeholder="例如 25"></label>
      </div>
      <div class="field"><span class="field-label">大题背诵进度</span>
        <select class="select" name="essayProgress">
          ${[0, 25, 50, 75, 100].map((value) => `<option value="${value}" ${Number(set.essayProgress) === value ? 'selected' : ''}>${value === 0 ? '还没开始' : value === 100 ? '已完整背过一遍' : `完成 ${value}%`}</option>`).join('')}
        </select>
      </div>
      <div class="field"><span class="field-label">错题章节 <small>可多选</small></span>${tagChecks('errorTags', MOCK_ERROR_TAGS, set.errorTags || [])}</div>
      <label class="field"><span class="field-label">这一套暴露了什么 <small>可选</small></span><textarea class="textarea" name="note" rows="2" maxlength="300" placeholder="例如：毛中特多选题错 4 道，都是“根本/基本”混淆。">${esc(set.note || '')}</textarea></label>
      <label class="check-line"><input type="checkbox" name="reviewed" ${set.reviewed ? 'checked' : ''}> <span>错题已经二刷 / 复盘</span></label>
      <div class="modal-actions">${cancelButton()}<button type="submit" class="btn btn-primary">保存这一套</button></div>
    </form>`,
    size: 'wide',
  });
}

function paperModal() {
  const year = ui.modal.year;
  const paper = state.papers[String(year)];
  if (!paper) return '';
  return modalShell({
    eyebrow: `ENGLISH II · ${year}`,
    title: `${year} 年英语二真题`,
    body: `<form data-form="paper" data-year="${year}" class="modal-form">
      <div class="form-grid three">
        <label class="field"><span class="field-label">完成状态</span><select class="select" name="status">${PAPER_STATUS.map((status) => `<option value="${status.id}" ${paper.status === status.id ? 'selected' : ''}>${status.label}</option>`).join('')}</select></label>
        <label class="field"><span class="field-label">完成日期</span><input class="input" type="date" name="date" value="${paper.date || todayKey()}" max="${todayKey()}"></label>
        <label class="field"><span class="field-label">用时（分钟）</span><input class="input" type="number" name="minutes" min="0" max="240" value="${paper.minutes ?? ''}" placeholder="例如 170"></label>
      </div>
      <div class="form-grid three">
        <label class="field"><span class="field-label">总分 / 100</span><input class="input" type="number" name="score" min="0" max="100" step="0.5" value="${paper.score ?? ''}" placeholder="—"></label>
        <label class="field"><span class="field-label">阅读 / 40</span><input class="input" type="number" name="readingScore" min="0" max="40" step="0.5" value="${paper.readingScore ?? ''}" placeholder="—"></label>
        <label class="field"><span class="field-label">翻译 / 15</span><input class="input" type="number" name="translationScore" min="0" max="15" step="0.5" value="${paper.translationScore ?? ''}" placeholder="—"></label>
      </div>
      <div class="form-grid two">
        <label class="field"><span class="field-label">作文 / 25</span><input class="input" type="number" name="writingScore" min="0" max="25" step="0.5" value="${paper.writingScore ?? ''}" placeholder="—"></label>
        <div class="field"><span class="field-label">复盘状态</span><label class="check-line inline"><input type="checkbox" name="reviewed" ${paper.reviewed ? 'checked' : ''}> <span>错题与同义替换已整理</span></label></div>
      </div>
      <label class="field"><span class="field-label">复盘笔记 <small>只写下次能用的</small></span><textarea class="textarea" name="note" rows="3" maxlength="500" placeholder="例如：Text 3 推断题错 2 道，问题在把常识带进选项；作文没写完，下次先写结尾。">${esc(paper.note || '')}</textarea></label>
      <div class="modal-actions">${cancelButton()}<button type="submit" class="btn btn-primary">保存这一年</button></div>
    </form>`,
    size: 'wide',
  });
}

function manualModal() {
  return modalShell({
    eyebrow: 'MANUAL LOG',
    title: '补记学习时长',
    body: `<form data-form="manual" class="modal-form">
      <p class="modal-lead">只补记真实发生的时间。没有计时器也算数，但不要为了凑满 3 小时而记。</p>
      <div class="form-grid two">
        <label class="field"><span class="field-label">日期</span><input class="input" type="date" name="date" value="${todayKey()}" max="${todayKey()}" required></label>
        <label class="field"><span class="field-label">科目</span><select class="select" name="subject"><option value="politics">政治</option><option value="english">英语二</option></select></label>
      </div>
      <label class="field"><span class="field-label">时长（分钟）</span><input class="input" type="number" name="minutes" min="1" max="240" value="30" required></label>
      <div class="quick-time"><span>快速选择</span>${[15, 30, 45, 60].map((value) => `<button type="button" data-action="quick-time" data-value="${value}">${value}</button>`).join('')}</div>
      <div class="modal-actions">${cancelButton()}<button type="submit" class="btn btn-primary">记入今日</button></div>
    </form>`,
  });
}

function dayModal() {
  const date = ui.modal.date;
  const plan = planFor(date);
  if (!plan) return '';
  const stats = taskStats(date);
  const focus = focusMinutes(date);
  const split = focusBySubject(date);
  const mood = MOODS.find((item) => item.id === plan.mood);
  const checked = isCheckedIn(date);
  const isFuture = date > todayKey();
  const weekday = new Intl.DateTimeFormat('zh-CN', { weekday: 'short' }).format(new Date(`${date}T12:00:00`));
  return modalShell({
    eyebrow: 'DAY DETAIL',
    title: formatDateFull(date),
    body: `<div class="day-detail">
      <div class="day-detail-stats">
        <span><b>${stats.done}</b>/${stats.total} 项任务</span>
        <span><b>${focus}</b> 分钟专注</span>
        <span><b>${split.politics}</b> 政治</span>
        <span><b>${split.english}</b> 英语</span>
      </div>
      <div class="day-status-line">
        ${checked ? badge(`已打卡 ${timeLabel(plan.checkedInAt)}`, 'good') : isFuture ? badge('未来计划', 'neutral') : badge('未打卡', 'warn')}
        ${mood ? badge(`${mood.char} · ${mood.label}`, 'neutral') : ''}
        <span>${weekday} · ${plan.phase === 'foundation' ? '基础收口' : plan.phase === 'sprint' ? '强化提分' : '考前定型'}</span>
      </div>
      <div class="day-task-list">
        ${plan.tasks.map((task) => `<div class="day-task ${task.done ? 'is-done' : ''}">
          <span class="day-task-check">${task.done ? icon('check', 13) : ''}</span>
          <div><b>${esc(task.title)}</b><small>${task.subject === 'politics' ? '政治' : '英语'} · ${task.minutes} 分钟</small></div>
        </div>`).join('')}
      </div>
      ${plan.note ? `<div class="day-note"><span>那天的备注</span><p>${esc(plan.note)}</p></div>` : ''}
      ${!checked && !isFuture ? `<div class="day-modal-actions"><p>如果那天确实学过但忘了打卡，可以补上。诚实比连续天数重要。</p><button type="button" class="btn btn-secondary" data-action="checkin-day" data-date="${date}">补打卡</button></div>` : ''}
    </div>`,
  });
}

export function renderModal() {
  if (!ui.modal) return '';
  switch (ui.modal.type) {
    case 'wrong':
      return wrongModal();
    case 'mock':
      return mockModal();
    case 'paper':
      return paperModal();
    case 'manual':
      return manualModal();
    case 'day':
      return dayModal();
    default:
      return '';
  }
}
