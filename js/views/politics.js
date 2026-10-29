/* 政治：选择题训练 + 错题本 */

import { horizontalBars, accuracyTone } from '../charts.js';
import {
  badge,
  emptyState,
  icon,
  pageFooter,
  pageHead,
  statCard,
  tagChecks,
} from '../components.js';
import {
  POLITICS_CHAPTERS,
  POLITICS_ERROR_TAGS,
  PRACTICE_SOURCES,
} from '../content.js';
import { ui } from '../ui.js';
import {
  chapterAccuracy,
  politicsStats,
  politicsTagStats,
  wrongStats,
} from '../selectors.js';
import { state } from '../store.js';
import {
  escapeHTML as esc,
  formatDate,
  sortByDateDesc,
  todayKey,
  truncate,
} from '../utils.js';

function tabs() {
  const active = ui.politicsTab;
  return `<div class="tabs" role="tablist" aria-label="政治模块">
    <button type="button" role="tab" aria-selected="${active === 'practice'}" class="tab ${active === 'practice' ? 'is-active' : ''}" data-action="switch-politics" data-tab="practice">
      选择题训练 <span>${state.politics.practice.length}</span>
    </button>
    <button type="button" role="tab" aria-selected="${active === 'wrong'}" class="tab ${active === 'wrong' ? 'is-active' : ''}" data-action="switch-politics" data-tab="wrong">
      错题本 <span>${wrongStats().open}</span>
    </button>
  </div>`;
}

function practiceForm() {
  return `<section class="card form-card" id="practice-form">
    <div class="card-head">
      <div>
        <div class="eyebrow"><i></i>LOG A SET</div>
        <h2>记录一组选择题</h2>
        <p>按“做完一组就记一组”的节奏，不攒到最后补。</p>
      </div>
      <span class="form-hint">建议 30–35 题 / 组</span>
    </div>
    <form data-form="practice">
      <div class="form-grid two">
        <label class="field">
          <span class="field-label">日期</span>
          <input class="input" type="date" name="date" value="${todayKey()}" max="${todayKey()}" required>
        </label>
        <label class="field">
          <span class="field-label">题源</span>
          <select class="select" name="source">
            ${PRACTICE_SOURCES.map((source) => `<option>${source}</option>`).join('')}
          </select>
        </label>
        <label class="field">
          <span class="field-label">章节</span>
          <select class="select" name="chapter">
            ${POLITICS_CHAPTERS.map((chapter) => `<option>${chapter}</option>`).join('')}
          </select>
        </label>
        <label class="field">
          <span class="field-label">用时（分钟）</span>
          <input class="input" type="number" name="minutes" min="0" max="300" value="35" required>
        </label>
        <label class="field">
          <span class="field-label">题量</span>
          <input class="input" type="number" name="count" min="1" max="100" value="35" required id="practice-count">
        </label>
        <label class="field">
          <span class="field-label">答对</span>
          <input class="input" type="number" name="correct" min="0" max="100" placeholder="例如 28" required id="practice-correct">
        </label>
      </div>
      <div class="field">
        <span class="field-label">这次错在哪 <small>可多选</small></span>
        ${tagChecks('errorTags', POLITICS_ERROR_TAGS)}
      </div>
      <label class="field">
        <span class="field-label">一句错因记录 <small>可选</small></span>
        <textarea class="textarea" name="note" rows="2" maxlength="300" placeholder="例如：把“根本任务”和“根本目的”混了，明天先看毛中特第 3 章。"></textarea>
      </label>
      <div class="form-actions">
        <span class="form-note">${icon('info', 14)} 正确率会自动计入分章统计。</span>
        <button type="submit" class="btn btn-primary">${icon('plus', 15)} 记下这组</button>
      </div>
    </form>
  </section>`;
}

function practiceList() {
  const records = sortByDateDesc(state.politics.practice);
  if (!records.length) {
    return `<section class="card">
      <div class="card-head"><div><div class="eyebrow"><i></i>HISTORY</div><h2>训练记录</h2></div></div>
      ${emptyState({
        iconName: 'book',
        title: '还没有训练记录',
        text: '做完第一组选择题后，在这里记下题量与正确数。数据会帮你找到真正的薄弱章节。',
        action: '<button type="button" class="btn btn-secondary" data-action="focus-practice">去记录第一组</button>',
      })}
    </section>`;
  }
  return `<section class="card">
    <div class="card-head">
      <div><div class="eyebrow"><i></i>HISTORY</div><h2>最近训练</h2></div>
      <span class="form-hint">共 ${records.length} 组</span>
    </div>
    <div class="record-list">
      ${records.slice(0, 12).map((record) => {
        const accuracy = record.count ? Math.round((record.correct / record.count) * 100) : 0;
        return `<article class="record-row">
          <div class="record-date"><b>${formatDate(record.date, false).replace('月', '.').replace('日', '')}</b><span>${record.source}</span></div>
          <div class="record-main">
            <div class="record-title"><h3>${esc(record.chapter)} · ${record.count} 题</h3>${badge(`${accuracy}%`, accuracyTone(accuracy))}</div>
            <p>${record.errorTags?.length ? record.errorTags.map((tag) => `<span class="mini-tag">${esc(tag)}</span>`).join('') : '<span class="muted">未标注错因</span>'}
              ${record.note ? `<span class="record-note">${esc(truncate(record.note, 54))}</span>` : ''}</p>
          </div>
          <div class="record-score"><b>${record.correct}<small>/${record.count}</small></b><span>${record.minutes} 分钟</span></div>
          <button type="button" class="icon-button danger" data-action="delete-record" data-collection="politics.practice" data-id="${record.id}" aria-label="删除这条记录">${icon('trash', 15)}</button>
        </article>`;
      }).join('')}
    </div>
  </section>`;
}

function chapterCard() {
  const rows = chapterAccuracy();
  const items = rows.map((item) => ({
    label: item.chapter,
    value: item.accuracy,
    display: `${item.accuracy}%`,
    tone: item.accuracy >= 75 ? 'good' : item.accuracy >= 60 ? 'mid' : 'warn',
  }));
  return `<section class="card">
    <div class="card-head compact">
      <div><div class="eyebrow"><i></i>BY CHAPTER</div><h2>分章正确率</h2></div>
    </div>
    ${items.length ? horizontalBars(items) : `<p class="muted-note">记录两组以上，就能看到章节差异。</p>`}
    <div class="divider"></div>
    <div class="card-head compact tight">
      <h3 class="small-title">错因分布</h3>
    </div>
    ${politicsTagStats().length ? `<div class="tag-cloud">${politicsTagStats().map((item) => `<span>${esc(item.tag)} <b>${item.count}</b></span>`).join('')}</div>` : `<p class="muted-note">还没有标注过错因。</p>`}
  </section>`;
}

function coachCard() {
  const stats = politicsStats();
  let title = '先完成第一组';
  let text = '政治选择题的提分，来自“错因归类 + 二刷”，不是刷题数量。今天先做 35 题，把错因写下来。';
  let tone = 'neutral';
  if (stats.recentAccuracy !== null) {
    if (stats.recentAccuracy < 65) {
      title = '先补概念，再谈题量';
      text = '近 7 天正确率偏低。把错题按章节归堆，回教材/背诵手册补“概念、主体、关系”，48 小时后再二刷同一批题。';
      tone = 'warn';
    } else if (stats.recentAccuracy < 80) {
      title = '正确率在变稳';
      text = '保持每天一组限时训练。多选题不要凭感觉，逐个选项判断“错在哪个词”。';
      tone = 'good';
    } else {
      title = '可以练速度了';
      text = '把一组题压到 25–30 分钟，留出时间给分析题。不要只刷已经会的章节。';
      tone = 'good';
    }
  }
  return `<section class="card coach-card ${tone}">
    <span class="coach-icon">${icon('spark', 20)}</span>
    <div><div class="eyebrow"><i></i>COACH</div><h2>${title}</h2><p>${text}</p></div>
  </section>`;
}

function wrongSection() {
  const all = sortByDateDesc(state.politics.wrong);
  const open = all.filter((item) => !item.mastered);
  const mastered = all.filter((item) => item.mastered);
  const item = (record) => `<details class="wrong-item ${record.mastered ? 'is-mastered' : ''}">
    <summary>
      <span class="wrong-flag">${record.mastered ? '已掌握' : '待回看'}</span>
      <div class="wrong-summary">
        <h3>${esc(truncate(record.prompt, 62))}</h3>
        <small>${esc(record.chapter)} · ${formatDate(record.date, false)}${record.tags?.length ? ` · ${record.tags.map(esc).join(' / ')}` : ''}</small>
      </div>
      <span class="summary-chevron">${icon('chevron', 16)}</span>
    </summary>
    <div class="wrong-detail">
      <div><span class="detail-label">正确答案 / 知识点</span><p>${esc(record.answer || '未填写')}</p></div>
      <div><span class="detail-label">我的错因</span><p>${esc(record.reason || '未填写')}</p></div>
      <div class="wrong-actions">
        <button type="button" class="btn btn-quiet" data-action="toggle-wrong" data-id="${record.id}">${record.mastered ? '标为待回看' : '标记已掌握'}</button>
        <button type="button" class="link-button danger" data-action="delete-record" data-collection="politics.wrong" data-id="${record.id}">删除</button>
      </div>
    </div>
  </details>`;

  return `<div class="wrong-layout">
    <section class="card">
      <div class="card-head">
        <div><div class="eyebrow"><i></i>WRONG BOOK</div><h2>待回看的错题</h2><p>错题不是收藏品，能讲清错因才算掌握。</p></div>
        <button type="button" class="btn btn-primary" data-action="open-wrong">${icon('plus', 15)} 记一道错题</button>
      </div>
      ${open.length ? `<div class="wrong-list">${open.map(item).join('')}</div>` : emptyState({
        iconName: 'check',
        title: '没有待回看的错题',
        text: '如果刚做完一组题，趁记忆还热，把最典型的 1–2 道记下来。',
      })}
    </section>
    <section class="card subdued-card">
      <div class="card-head compact">
        <div><h2 class="small-title">已经掌握</h2><span class="form-hint">${mastered.length} 道</span></div>
      </div>
      ${mastered.length ? `<div class="wrong-list compact">${mastered.map(item).join('')}</div>` : `<p class="muted-note">标记“已掌握”的错题会收在这里，偶尔回来看看。</p>`}
    </section>
  </div>`;
}

export function politicsView() {
  const stats = politicsStats();
  const wrong = wrongStats();
  return `<div class="view politics-view">
    ${pageHead({
      eyebrow: 'POLITICS · 每天约 70 分钟',
      title: '选择题，是最好拿的分。',
      sub: '记录题量与错因，让“感觉会”变成“真的会”。',
      actions: `<button type="button" class="btn btn-primary" data-action="open-wrong">${icon('plus', 15)} 记错题</button>`,
      accent: 'red',
    })}
    <section class="stat-strip">
      ${statCard({ label: '累计正确率', value: stats.accuracy === null ? '—' : stats.accuracy, unit: stats.accuracy === null ? '' : '%', hint: stats.totalQuestions ? `累计 ${stats.totalQuestions} 题` : '完成第一组后有数据', tone: stats.accuracy >= 75 ? 'good' : '' })}
      ${statCard({ label: '近 7 天正确率', value: stats.recentAccuracy === null ? '—' : stats.recentAccuracy, unit: stats.recentAccuracy === null ? '' : '%', hint: stats.recentQuestions ? `近 7 天 ${stats.recentQuestions} 题` : '先积累三组训练' })}
      ${statCard({ label: '今日题量', value: stats.todayQuestions, unit: '题', hint: stats.todayAccuracy === null ? '今天还没有记录' : `今日正确率 ${stats.todayAccuracy}%` })}
      ${statCard({ label: '错题待回看', value: wrong.open, unit: '道', hint: `已掌握 ${wrong.mastered} 道` })}
    </section>
    ${tabs()}
    ${ui.politicsTab === 'practice'
      ? `<div class="politics-layout">
          <div class="practice-main">
            ${practiceForm()}
            ${practiceList()}
          </div>
          <aside class="practice-side">
            ${coachCard()}
            ${chapterCard()}
          </aside>
        </div>`
      : wrongSection()}
    ${pageFooter()}
  </div>`;
}
