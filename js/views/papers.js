/* 英语二真题打卡墙 */

import {
  icon,
  pageFooter,
  pageHead,
  statCard,
} from '../components.js';
import { PAPER_STATUS } from '../content.js';
import { paperStats } from '../selectors.js';
import { state } from '../store.js';
import { formatDate } from '../utils.js';

function paperCard(paper) {
  const status = PAPER_STATUS.find((item) => item.id === paper.status) || PAPER_STATUS[0];
  return `<button type="button" class="paper-card status-${paper.status}" data-action="open-paper" data-year="${paper.year}">
    <div class="paper-top">
      <span class="paper-year">${paper.year}</span>
      <span class="paper-status ${paper.status}">${status.label}</span>
    </div>
    <div class="paper-score">
      ${paper.score !== null && paper.score !== '' ? `<b>${paper.score}</b><small>/100</small>` : '<b class="paper-empty">—</b><small>待记录</small>'}
    </div>
    <div class="paper-parts">
      ${paper.readingScore !== null && paper.readingScore !== '' ? `<span>阅读 ${paper.readingScore}/40</span>` : '<span>阅读 —</span>'}
      ${paper.translationScore !== null && paper.translationScore !== '' ? `<span>翻译 ${paper.translationScore}/15</span>` : '<span>翻译 —</span>'}
    </div>
    <div class="paper-foot">
      <span>${paper.date ? formatDate(paper.date, false) : '点击记录'}</span>
      ${paper.reviewed ? `<span class="reviewed-mark">${icon('check', 12)} 已复盘</span>` : ''}
    </div>
  </button>`;
}

function progressWall(stats) {
  return `<section class="paper-progress-card">
    <div class="paper-progress-copy">
      <span class="eyebrow"><i></i>ENGLISH II · 2010–2026</span>
      <h2>${stats.touched} <small>/ ${stats.total}</small> 年已推进</h2>
      <p>“做完”不是终点，“错题能讲清”才算一年真正完成。</p>
    </div>
    <div class="paper-progress-visual">
      <div class="paper-track">
        ${stats.papers.map((paper) => `<span class="track-seg ${paper.status}" title="${paper.year} · ${statusLabel(paper.status)}"></span>`).join('')}
      </div>
      <div class="paper-track-labels"><span>2010</span><span>2018</span><span>2026</span></div>
      <div class="paper-progress-stats">
        <span><b>${stats.deep}</b> 精析完成</span>
        <span><b>${stats.avg === null ? '—' : stats.avg.toFixed(1)}</b> 平均分</span>
        <span><b>${stats.progress}%</b> 推进率</span>
      </div>
    </div>
  </section>`;
}

function statusLabel(status) {
  return PAPER_STATUS.find((item) => item.id === status)?.label || '未开始';
}

function legend() {
  return `<div class="paper-legend">
    ${PAPER_STATUS.map((item) => `<span><i class="paper-dot ${item.id}"></i>${item.label}</span>`).join('')}
  </div>`;
}

function nextPaperTile(records) {
  const untouched = records.filter((paper) => paper.status === 'todo');
  const next = untouched.find((paper) => paper.year >= 2024)
    || untouched.find((paper) => paper.year >= 2015)
    || untouched[0];
  return `<div class="paper-next">
    <div>
      <div class="eyebrow"><i></i>NEXT STEP</div>
      <h3>${next ? '下一步：完整做一套' : '17 年都走完了'}</h3>
      <p>${next ? '2024–2026 建议留到冲刺做整卷模拟；做完一定回来记录分数与复盘。' : '接下来只做一件事：回看错题和同义替换，保持手感。'}</p>
    </div>
    ${next
      ? `<button type="button" class="btn btn-secondary" data-action="open-paper" data-year="${next.year}">记录 ${next.year} 年 ${icon('arrow', 13)}</button>`
      : `<a href="#review" class="btn btn-secondary">去复盘 ${icon('arrow', 13)}</a>`}
  </div>`;
}

function guide() {
  return `<section class="card paper-guide">
    <div class="card-head"><div><div class="eyebrow"><i></i>ORDER</div><h2>真题不是从 2010 顺做到 2026</h2><p>按“熟悉题型 → 精刷提分 → 整卷模拟”的顺序使用。</p></div></div>
    <div class="paper-steps">
      <div class="paper-step">
        <span class="step-no">01</span>
        <div><h3>2010–2014 · 熟悉题型</h3><p>不必卡时间。阅读逐句精读，翻译动笔，作文先搭框架。目标是把题型和出题方式摸清。</p></div>
        <em>打基础</em>
      </div>
      <div class="paper-step">
        <span class="step-no">02</span>
        <div><h3>2015–2023 · 精刷与二刷</h3><p>按考试时间做阅读和翻译；错题按“定位、推理、主旨、态度”归因。二刷只看错题和同义替换。</p></div>
        <em>主战场</em>
      </div>
      <div class="paper-step">
        <span class="step-no">03</span>
        <div><h3>2024–2026 · 整卷模拟</h3><p>留到冲刺期，按 14:00–17:00 完整做一套。模拟后不追分，先复盘时间分配和作文是否写完。</p></div>
        <em>保手感</em>
      </div>
    </div>
  </section>`;
}

function scoreGuide() {
  return `<section class="card paper-score-guide">
    <div class="card-head compact"><div><div class="eyebrow"><i></i>SCORE MAP</div><h2>英语二 100 分构成</h2></div></div>
    <div class="score-map">
      <span style="--w:10"><b>完形</b><em>10</em></span>
      <span style="--w:40"><b>阅读</b><em>40</em></span>
      <span style="--w:10"><b>新题型</b><em>10</em></span>
      <span style="--w:15"><b>翻译</b><em>15</em></span>
      <span style="--w:25"><b>作文</b><em>25</em></span>
    </div>
    <p class="card-note">阅读 + 作文共 65 分，是冲刺期最值得反复投入的两块。</p>
  </section>`;
}

export function papersView() {
  const stats = paperStats();
  const records = Object.values(state.papers).sort((a, b) => a.year - b.year);
  return `<div class="view papers-view">
    ${pageHead({
      eyebrow: 'PAST PAPERS · 2010–2026',
      title: '把真题做完，不如把真题吃透。',
      sub: '一年真题至少留下三样东西：错因、同义替换、时间分配。打卡只是开始，复盘才算完成。',
      actions: '<button type="button" class="btn btn-primary" data-action="open-paper" data-year="2010">' + icon('plus', 15) + ' 记录一年</button>',
      accent: 'blue',
    })}
    <section class="stat-strip">
      ${statCard({ label: '已推进', value: stats.touched, unit: `/ ${stats.total} 年`, hint: `精析完成 ${stats.deep} 年` })}
      ${statCard({ label: '平均总分', value: stats.avg === null ? '—' : stats.avg.toFixed(1), unit: stats.avg === null ? '' : '/100', hint: stats.avg === null ? '记录后自动计算' : '只统计已填总分' })}
      ${statCard({ label: '最高分', value: stats.best ?? '—', unit: stats.best ? '/100' : '', hint: '不跟别人比，跟上次比' })}
      ${statCard({ label: '复盘完成', value: records.filter((item) => item.reviewed).length, unit: '年', hint: '错题能讲清才算复盘' })}
    </section>
    ${progressWall(stats)}
    <section class="card paper-wall-card">
      <div class="card-head">
        <div><div class="eyebrow"><i></i>CHECK-IN WALL</div><h2>真题打卡墙</h2><p>点击任意年份，记录分数与复盘状态。</p></div>
        ${legend()}
      </div>
      <div class="paper-grid">${records.map(paperCard).join('')}${nextPaperTile(records)}</div>
    </section>
    <div class="paper-lower">
      ${guide()}
      <div class="paper-lower-side">
        ${scoreGuide()}
        <section class="card coach-card neutral"><span class="coach-icon">${icon('spark', 20)}</span><div><div class="eyebrow"><i></i>NOTE</div><h2>别用“刷了几套”感动自己</h2><p>一套真题吃透，胜过三套只对答案。每次打开记录，先问：这套题让我发现了哪个固定错误？</p></div></section>
      </div>
    </div>
    ${pageFooter()}
  </div>`;
}
