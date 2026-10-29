/* 复盘 · 数据、周总结与设置 */

import { progressLine, stackedBars } from '../charts.js';
import {
  badge,
  heatmap,
  icon,
  pageFooter,
  pageHead,
  statCard,
} from '../components.js';
import {
  REVIEW_PROMPTS,
} from '../content.js';
import {
  allMockStats,
  currentStreak,
  daysLeft,
  englishStats,
  heatmapDays,
  insights,
  longestStreak,
  overallProgress,
  paperStats,
  phaseList,
  politicsStats,
  priorReviews,
  reciteStats,
  subjectTotalMinutes,
  totalCheckins,
  weekReview,
  weeklyFocusTotal,
} from '../selectors.js';
import { state, storageOK } from '../store.js';
import {
  escapeHTML as esc,
  formatDate,
  formatMinutes,
  pct,
  shortDate,
  startOfWeekKey,
  sum,
  todayKey,
  truncate,
} from '../utils.js';

function last14Days() {
  const end = todayKey();
  return Array.from({ length: 14 }, (_, index) => {
    const dayOffset = index - 13;
    const date = new Date(`${end}T12:00:00`);
    date.setDate(date.getDate() + dayOffset);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const sessions = state.sessions.filter((item) => item.date === key);
    return {
      date: key,
      label: String(date.getDate()),
      politics: sum(sessions.filter((item) => item.subject === 'politics'), (item) => item.minutes),
      english: sum(sessions.filter((item) => item.subject === 'english'), (item) => item.minutes),
      focus: sum(sessions, (item) => item.minutes),
    };
  });
}

function metricRow(label, value, display, tone = '') {
  return `<div class="metric-row">
    <span>${esc(label)}</span>
    <div class="metric-track"><i class="${tone}" style="width:${Math.max(0, Math.min(100, value))}%"></i></div>
    <b>${esc(display)}</b>
  </div>`;
}

function metricsCard() {
  const politics = politicsStats();
  const english = englishStats();
  const papers = paperStats();
  const mocks = allMockStats();
  const split = subjectTotalMinutes();
  const total = split.politics + split.english;
  return `<section class="card metrics-card">
    <div class="card-head compact"><div><div class="eyebrow"><i></i>NUMBERS</div><h2>关键指标</h2></div></div>
    ${metricRow('政治选择题正确率', politics.recentAccuracy || 0, politics.recentAccuracy === null ? '—' : `${politics.recentAccuracy}%`, politics.recentAccuracy >= 75 ? 'good' : 'red')}
    ${metricRow('英语阅读正确率', english.readingAccuracy || 0, english.readingAccuracy === null ? '—' : `${english.readingAccuracy}%`, 'blue')}
    ${metricRow('肖八平均分', mocks.eight.avg === null ? 0 : (mocks.eight.avg / 50) * 100, mocks.eight.avg === null ? '—' : `${mocks.eight.avg.toFixed(1)}/50`, 'gold')}
    ${metricRow('真题推进率', papers.progress, `${papers.touched}/${papers.total}`, 'sage')}
    <div class="divider"></div>
    <div class="time-split">
      <div><span><i class="dot politics"></i>政治</span><b>${formatMinutes(split.politics)}</b></div>
      <div class="split-track"><i style="width:${pct(split.politics, total)}%"></i><em style="width:${pct(split.english, total)}%"></em></div>
      <div><span><i class="dot english"></i>英语二</span><b>${formatMinutes(split.english)}</b></div>
    </div>
  </section>`;
}

function insightsCard() {
  const list = insights();
  return `<section class="card insights-card">
    <div class="card-head compact"><div><div class="eyebrow"><i></i>NEXT</div><h2>明天先做什么</h2></div></div>
    <div class="insight-list">
      ${list.map((item) => `<a href="${item.route}" class="insight-row ${item.tone}">
        <span class="insight-dot"></span>
        <div><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p></div>
        ${icon('arrow', 14)}
      </a>`).join('')}
    </div>
  </section>`;
}

function phaseCard() {
  const phases = phaseList();
  return `<section class="card phase-progress-card">
    <div class="card-head compact"><div><div class="eyebrow"><i></i>PHASES</div><h2>三阶段进度</h2></div></div>
    <div class="phase-progress-list">
      ${phases.map((phase) => {
        const checked = phase.days.filter((day) => state.plans[day]?.checkedInAt).length;
        const rate = pct(checked, phase.days.length);
        return `<div class="phase-progress-row tone-${phase.tone}">
          <div class="phase-progress-top"><span>${phase.label}</span><small>${phase.start ? shortDate(phase.start) : ''} – ${phase.end ? shortDate(phase.end) : ''}</small><b>${checked}/${phase.days.length}</b></div>
          ${progressLine(rate, phase.label)}
        </div>`;
      }).join('')}
    </div>
  </section>`;
}

function reviewForm() {
  const current = weekReview();
  const weekStart = startOfWeekKey(todayKey());
  const prior = priorReviews(2);
  return `<section class="card review-form-card">
    <div class="card-head">
      <div><div class="eyebrow"><i></i>WEEKLY REVIEW</div><h2>本周复盘 · 只改一件事</h2><p>${formatDate(weekStart, false)} – ${formatDate(todayKey(), false)}</p></div>
      ${current ? badge('已保存', 'good') : badge('待填写', 'neutral')}
    </div>
    <form data-form="review">
      <input type="hidden" name="weekStart" value="${weekStart}">
      <div class="review-prompts">
        ${REVIEW_PROMPTS.map((prompt, index) => `<label class="field">
          <span class="field-label"><em>0${index + 1}</em>${prompt.label}</span>
          <textarea class="textarea" name="${prompt.id}" rows="3" maxlength="600" placeholder="${esc(prompt.placeholder)}">${esc(current?.[prompt.id] || '')}</textarea>
        </label>`).join('')}
      </div>
      <div class="form-actions"><span class="form-note">${icon('info', 14)} 下周只改一件事，改完再改下一件。</span><button type="submit" class="btn btn-primary">保存本周复盘</button></div>
    </form>
    ${prior.length ? `<div class="prior-reviews">
      <div class="divider"></div>
      <h3 class="small-title">上周的你写了什么</h3>
      ${prior.map((review) => `<details class="prior-review">
        <summary><span>${formatDate(review.weekStart, false)} 那一周</span><small>${truncate(review.next || review.wins || '', 42)}</small>${icon('chevron', 14)}</summary>
        <div>
          ${REVIEW_PROMPTS.map((prompt) => (review[prompt.id] ? `<p><b>${prompt.label}</b>${esc(review[prompt.id])}</p>` : '')).join('')}
        </div>
      </details>`).join('')}
    </div>` : ''}
  </section>`;
}

function settingsCard() {
  return `<section class="card settings-card">
    <div class="card-head">
      <div><div class="eyebrow"><i></i>SETTINGS</div><h2>基本设置</h2><p>考试日期变动会重新排布三阶段计划，已完成的记录会保留。</p></div>
    </div>
    <form data-form="settings">
      <div class="form-grid two">
        <label class="field"><span class="field-label">怎么称呼你 <small>可选</small></span><input class="input" type="text" name="name" maxlength="20" value="${esc(state.profile.name)}" placeholder="例如：小林"></label>
        <label class="field"><span class="field-label">初试日期</span><input class="input" type="date" name="examDate" value="${state.profile.examDate}" min="${todayKey()}" required></label>
      </div>
      <div class="settings-note">
        <span>${icon('clock', 15)} 每日硬上限</span>
        <b>180 分钟（3 小时）</b>
        <small>计划排 170 分钟，留 10 分钟缓冲。超过就停，不用把疲惫当成努力。</small>
      </div>
      <div class="form-actions"><span class="form-note">2027 考研初试时间以官方通知为准。</span><button type="submit" class="btn btn-secondary">保存设置</button></div>
    </form>
  </section>`;
}

function dataCard() {
  return `<section class="card data-card">
    <div class="card-head">
      <div><div class="eyebrow"><i></i>DATA</div><h2>数据与备份</h2><p>没有账号，没有云端。数据只在这台设备的浏览器里。</p></div>
      <span class="storage-pill ${storageOK ? 'ok' : 'warn'}">${icon(storageOK ? 'lock' : 'info', 13)} ${storageOK ? '本地保存正常' : '本地保存受限'}</span>
    </div>
    <div class="data-actions">
      <button type="button" class="data-action" data-action="export-data">
        <span>${icon('download', 20)}</span><div><b>导出备份</b><small>下载一份 JSON，换设备 / 清缓存前使用</small></div>${icon('arrow', 15)}
      </button>
      <button type="button" class="data-action" data-action="import-trigger">
        <span>${icon('upload', 20)}</span><div><b>导入备份</b><small>用之前的 JSON 恢复全部记录</small></div>${icon('arrow', 15)}
      </button>
      <button type="button" class="data-action danger" data-action="reset-data">
        <span>${icon('trash', 20)}</span><div><b>清空全部数据</b><small>重新开始；此操作不可撤销</small></div>${icon('arrow', 15)}
      </button>
    </div>
    <input type="file" id="import-file" accept="application/json,.json" hidden>
    <p class="data-note">${icon('info', 13)} 浏览器清理站点数据会删除记录。建议每周日复盘后导出一次。</p>
  </section>`;
}

export function reviewView() {
  const overall = overallProgress();
  const split = subjectTotalMinutes();
  const total = split.politics + split.english;
  const stats = reciteStats();
  const days = last14Days();
  const total14 = sum(days, (day) => day.focus);
  return `<div class="view review-view">
    ${pageHead({
      eyebrow: 'REVIEW · 看见真实的进度',
      title: '复盘，是为了明天少走一步弯路。',
      sub: '不美化数据，也不被数据吓到。看清楚哪一项在变好，哪一项需要停一停。',
      actions: `<button type="button" class="btn btn-quiet" data-action="export-data">${icon('download', 15)} 导出备份</button>`,
      accent: 'sage',
    })}
    <section class="stat-strip">
      ${statCard({ label: '累计打卡', value: overall.done, unit: `/ ${overall.total} 天`, hint: `完成率 ${overall.rate}%` })}
      ${statCard({ label: '连续打卡', value: currentStreak(), unit: '天', hint: `最长 ${longestStreak()} 天` })}
      ${statCard({ label: '累计专注', value: Math.round((total / 60) * 10) / 10, unit: '小时', hint: `政治 ${Math.round(split.politics / 60 * 10) / 10}h · 英语 ${Math.round(split.english / 60 * 10) / 10}h` })}
      ${statCard({ label: '今天还剩', value: daysLeft(), unit: '天', hint: stats.due ? `还有 ${stats.due} 张卡待复习` : '今日背诵已清' })}
    </section>

    <div class="review-layout">
      <div class="review-main">
        <section class="card chart-card">
          <div class="card-head">
            <div><div class="eyebrow"><i></i>LAST 14 DAYS</div><h2>近 14 天专注</h2><p>柱子高不高不重要，连续出现才重要。</p></div>
            <div class="week-total"><b>${formatMinutes(total14)}</b><span>14 天合计</span></div>
          </div>
          ${stackedBars(days, { today: todayKey(), max: 180 })}
        </section>
        <section class="card heatmap-card">${heatmap(heatmapDays(), '从第一天到现在')}</section>
        ${reviewForm()}
      </div>
      <aside class="review-side">
        ${metricsCard()}
        ${insightsCard()}
        ${phaseCard()}
      </aside>
    </div>

    <div class="settings-grid">
      ${settingsCard()}
      ${dataCard()}
    </div>
    ${pageFooter()}
  </div>`;
}
