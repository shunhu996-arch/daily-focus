/* 肖八 / 肖四 记录 */

import { scoreLine } from '../charts.js';
import {
  badge,
  emptyState,
  icon,
  pageFooter,
  pageHead,
  statCard,
} from '../components.js';
import { allMockStats, mockStats } from '../selectors.js';
import { state } from '../store.js';
import { escapeHTML as esc, formatDate } from '../utils.js';

function setCard(item) {
  const completed = item.completed && item.score !== null && item.score !== '';
  const score = completed ? Number(item.score) : null;
  const tone = score === null ? '' : score >= 40 ? 'good' : score >= 32 ? 'mid' : 'warn';
  return `<button type="button" class="mock-card ${completed ? 'is-complete' : ''} ${tone}" data-action="open-mock" data-type="${item.type}" data-number="${item.number}">
    <div class="mock-top">
      <span class="mock-number">${String(item.number).padStart(2, '0')}</span>
      ${completed ? badge(item.reviewed ? '已二刷' : '已完成', item.reviewed ? 'good' : 'neutral') : badge('未记录', 'neutral')}
    </div>
    <div class="mock-score">${completed ? `${item.score}<small>/50</small>` : `<span>—</span><small>/50</small>`}</div>
    <div class="mock-meta">
      <span>${item.date ? formatDate(item.date, false) : '选择题得分'}</span>
      ${item.essayProgress ? `<span>大题 ${item.essayProgress}%</span>` : '<span>大题未记录</span>'}
    </div>
    ${item.essayProgress ? `<div class="progress-line slim"><i style="width:${item.essayProgress}%"></i></div>` : ''}
    ${item.errorTags?.length ? `<div class="mock-tags">${item.errorTags.slice(0, 3).map((tag) => `<span>${esc(tag)}</span>`).join('')}</div>` : ''}
    <span class="mock-open">${completed ? '查看 / 修改' : '记录这一套'} ${icon('arrow', 12)}</span>
  </button>`;
}

function section(type) {
  const isEight = type === 8;
  const stats = mockStats(type);
  const sets = Object.values(state.mocks).filter((item) => item.type === type).sort((a, b) => a.number - b.number);
  return `<section class="card mock-section ${isEight ? 'eight' : 'four'}">
    <div class="mock-section-head">
      <div class="mock-title">
        <span class="mock-seal">${isEight ? '八' : '四'}</span>
        <div><div class="eyebrow"><i></i>${isEight ? 'XIAO BA · 8 SETS' : 'XIAO SI · 4 SETS'}</div><h2>肖${isEight ? '八' : '四'} · 选择题记录</h2></div>
      </div>
      <div class="mock-avg">
        <span>平均</span><b>${stats.avg === null ? '—' : stats.avg.toFixed(1)}</b><small>/50</small>
        <em>${stats.done}/${stats.total} 套</em>
      </div>
    </div>
    <p class="mock-desc">${isEight ? '用来查漏：每一套都值得停下来把错题归因。' : '用来定型：选择题保持手感，大题只背框架和关键词。'}</p>
    <div class="mock-grid">${sets.map(setCard).join('')}</div>
    <div class="mock-summary">
      <span>最高 <b>${stats.best ?? '—'}</b></span>
      <span>最低 <b>${stats.lowest ?? '—'}</b></span>
      <span>大题平均 <b>${stats.essayAvg === null ? '—' : `${Math.round(stats.essayAvg)}%`}</b></span>
      <span>错题二刷 <b>${stats.reviewed}</b></span>
    </div>
  </section>`;
}

function chartSection() {
  const eight = Object.values(state.mocks).filter((item) => item.type === 8).sort((a, b) => a.number - b.number);
  const four = Object.values(state.mocks).filter((item) => item.type === 4).sort((a, b) => a.number - b.number);
  const hasEight = eight.some((item) => item.completed);
  const hasFour = four.some((item) => item.completed);
  if (!hasEight && !hasFour) {
    return `<section class="card">
      <div class="card-head"><div><div class="eyebrow"><i></i>TREND</div><h2>分数趋势</h2><p>记录第一套后，这里会画出你的变化。</p></div></div>
      ${emptyState({ iconName: 'target', title: '还没有模考分数', text: '分数不是审判，是定位。先完成第一套，再把错题按章节标出来。' })}
    </section>`;
  }
  return `<section class="card">
    <div class="card-head"><div><div class="eyebrow"><i></i>TREND</div><h2>选择题分数趋势</h2><p>只看趋势，不用和别人比。目标线是 40 / 50。</p></div><span class="form-hint">满分 50</span></div>
    <div class="trend-grid">
      <div class="trend-block"><div class="trend-head"><h3>肖八</h3><span>${hasEight ? '每套都算数' : '等待记录'}</span></div>${scoreLine(eight, { target: 40, label: '肖八选择题趋势' })}</div>
      <div class="trend-block"><div class="trend-head"><h3>肖四</h3><span>${hasFour ? '保持手感' : '等待记录'}</span></div>${scoreLine(four, { target: 40, label: '肖四选择题趋势' })}</div>
    </div>
  </section>`;
}

function guidanceSection() {
  return `<div class="guide-grid">
    <section class="card guide-card">
      <span class="guide-icon">${icon('spark', 20)}</span>
      <div><div class="eyebrow"><i></i>HOW TO USE</div><h2>肖八：把“不会”找出来</h2>
      <ul>
        <li>选择题限时 20–25 分钟，先做完整套再对答案。</li>
        <li>错题按章节归类，不抄题干；只写“错在哪个概念”。</li>
        <li>第二天先回看错题，再开下一套。</li>
      </ul></div>
    </section>
    <section class="card guide-card">
      <span class="guide-icon">${icon('seal', 20)}</span>
      <div><div class="eyebrow"><i></i>HOW TO USE</div><h2>肖四：把“会背”变成“写得出”</h2>
      <ul>
        <li>选择题保持手感，不因分数大起大落。</li>
        <li>大题按“原理—材料—意义”记框架，不逐字背。</li>
        <li>每套至少口述一遍，再合上书复述关键词。</li>
      </ul></div>
    </section>
  </div>`;
}

export function mocksView() {
  const stats = allMockStats();
  return `<div class="view mocks-view">
    ${pageHead({
      eyebrow: 'MOCK · 选择题满分 50',
      title: '肖八查漏，肖四定型。',
      sub: '分数只用来定位，不用来否定自己。真正要记录的是：错在哪，下一次怎么不再错。',
      actions: `<button type="button" class="btn btn-primary" data-action="open-mock" data-type="8" data-number="1">${icon('plus', 15)} 记录一套</button>`,
      accent: 'red',
    })}
    <section class="stat-strip">
      ${statCard({ label: '肖八平均分', value: stats.eight.avg === null ? '—' : stats.eight.avg.toFixed(1), unit: stats.eight.avg === null ? '' : '/50', hint: `完成 ${stats.eight.done} / 8 套` })}
      ${statCard({ label: '肖八错题二刷', value: stats.eight.reviewed, unit: '套', hint: stats.eight.done ? '二刷比刷新套更重要' : '完成后再回看' })}
      ${statCard({ label: '肖四平均分', value: stats.four.avg === null ? '—' : stats.four.avg.toFixed(1), unit: stats.four.avg === null ? '' : '/50', hint: `完成 ${stats.four.done} / 4 套` })}
      ${statCard({ label: '大题背诵平均', value: stats.four.essayAvg === null ? '—' : Math.round(stats.four.essayAvg), unit: stats.four.essayAvg === null ? '' : '%', hint: '按套记录进度' })}
    </section>
    <div class="mock-layout">
      ${section(8)}
      ${section(4)}
    </div>
    ${chartSection()}
    ${guidanceSection()}
    ${pageFooter()}
  </div>`;
}
