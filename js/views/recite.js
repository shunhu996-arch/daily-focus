/* 背诵清单：间隔复习卡片 */

import { progressLine, ring } from '../charts.js';
import {
  badge,
  emptyState,
  icon,
  pageFooter,
  pageHead,
  statCard,
} from '../components.js';
import {
  RECITE_CATEGORIES,
  RECITE_RATINGS,
} from '../content.js';
import { ui } from '../ui.js';
import { reciteDue, reciteStats } from '../selectors.js';
import { state } from '../store.js';
import {
  escapeHTML as esc,
  formatDate,
  pct,
  truncate,
} from '../utils.js';

function filters() {
  const stats = reciteStats();
  return `<div class="tabs recite-tabs" role="tablist" aria-label="背诵筛选">
    <button type="button" role="tab" aria-selected="${ui.reciteFilter === 'due'}" class="tab ${ui.reciteFilter === 'due' ? 'is-active' : ''}" data-action="recite-filter" data-filter="due">待复习 <span>${stats.due}</span></button>
    <button type="button" role="tab" aria-selected="${ui.reciteFilter === 'all'}" class="tab ${ui.reciteFilter === 'all' ? 'is-active' : ''}" data-action="recite-filter" data-filter="all">全部卡片 <span>${stats.total}</span></button>
    <button type="button" role="tab" aria-selected="${ui.reciteFilter === 'mastered'}" class="tab ${ui.reciteFilter === 'mastered' ? 'is-active' : ''}" data-action="recite-filter" data-filter="mastered">已熟练 <span>${stats.mastered}</span></button>
  </div>`;
}

function flashcard(card, due) {
  const index = Math.max(0, due.findIndex((item) => item.id === card.id));
  const subject = card.subject === 'politics' ? '政治' : '英语二';
  return `<section class="flashcard ${ui.reciteRevealed ? 'is-revealed' : ''}">
    <div class="flash-top">
      <div><span class="subject-tag ${card.subject}">${subject}</span><span class="mini-tag">${esc(card.category)}</span></div>
      <span class="flash-count">${index + 1} / ${due.length}</span>
    </div>
    <div class="flash-front">
      <span class="flash-label">今天要回答</span>
      <h2>${esc(card.front)}</h2>
    </div>
    ${ui.reciteRevealed
      ? `<div class="flash-back"><span class="flash-label">框架 / 关键词</span><p>${esc(card.back)}</p></div>`
      : `<button type="button" class="reveal-button" data-action="reveal-recite">
          <span>${icon('spark', 20)}</span>
          <b>先在心里说一遍，再看答案</b>
          <small>点击显示答案</small>
        </button>`}
    <div class="flash-actions">
      ${ui.reciteRevealed
        ? `<div class="rating-row">
            ${RECITE_RATINGS.map((rating) => `<button type="button" class="rating-button ${rating.id}" data-action="rate-recite" data-rating="${rating.id}">
              <b>${rating.label}</b><small>${rating.hint}</small>
            </button>`).join('')}
          </div>`
        : `<button type="button" class="btn btn-primary btn-block" data-action="reveal-recite">显示答案</button>`}
    </div>
    <div class="flash-foot">
      <span>已复习 ${card.reviewedCount || 0} 次</span>
      <span>下次：${card.nextReview ? formatDate(card.nextReview, false) : '今天'}</span>
      <span>熟练度 ${Math.min(4, card.level || 0)} / 4</span>
    </div>
  </section>`;
}

function cardList(cards) {
  if (!cards.length) {
    return emptyState({
      iconName: 'cards',
      title: ui.reciteFilter === 'mastered' ? '还没有熟练卡' : '这里还没有卡片',
      text: '在右侧新增一张卡，或者先复习今天到期的卡片。',
    });
  }
  const labels = ['新卡', '刚起步', '有印象', '熟练', '很稳'];
  return `<div class="recite-list">
    ${cards.map((card) => `<article class="recite-row">
      <span class="recite-subject ${card.subject}">${card.subject === 'politics' ? '政' : '英'}</span>
      <div class="recite-main">
        <div class="recite-title"><h3>${esc(card.front)}</h3>${badge(labels[Math.min(4, card.level || 0)], (card.level || 0) >= 3 ? 'good' : 'neutral')}</div>
        <p>${esc(card.category)} · 下次复习 ${card.nextReview ? formatDate(card.nextReview, false) : '今天'}${card.tags?.length ? ` · ${card.tags.map(esc).join(' / ')}` : ''}</p>
      </div>
      <span class="recite-progress">${progressLine(pct(card.level || 0, 4), '熟练度')}</span>
      <button type="button" class="icon-button danger" data-action="delete-record" data-collection="recite" data-id="${card.id}" aria-label="删除背诵卡">${icon('trash', 15)}</button>
    </article>`).join('')}
  </div>`;
}

function addForm() {
  return `<section class="card form-card recite-add-card">
    <div class="card-head compact"><div><div class="eyebrow"><i></i>NEW CARD</div><h2>新增一张卡</h2></div></div>
    <form data-form="recite">
      <div class="form-grid two tight">
        <label class="field"><span class="field-label">科目</span><select class="select" name="subject"><option value="politics">政治</option><option value="english">英语二</option></select></label>
        <label class="field"><span class="field-label">分类</span><select class="select" name="category">
          ${Object.entries(RECITE_CATEGORIES).flatMap(([, categories]) => categories).map((category) => `<option>${category}</option>`).join('')}
        </select></label>
      </div>
      <label class="field"><span class="field-label">问题 / 提示</span><textarea class="textarea" name="front" rows="2" maxlength="200" placeholder="例如：矛盾普遍性与特殊性的方法论是什么？" required></textarea></label>
      <label class="field"><span class="field-label">答案 / 关键词</span><textarea class="textarea" name="back" rows="4" maxlength="1200" placeholder="只写能复述的框架和关键词，不抄整段。" required></textarea></label>
      <button type="submit" class="btn btn-secondary btn-block">${icon('plus', 15)} 加入背诵清单</button>
    </form>
  </section>`;
}

function sideStats() {
  const stats = reciteStats();
  return `<section class="card recite-stats-card">
    <div class="card-head compact"><div><div class="eyebrow"><i></i>MEMORY</div><h2>记忆进度</h2></div></div>
    <div class="reading-ring small-ring">
      ${ring(stats.progress, { size: 108, stroke: 7, color: 'var(--gold)' })}
      <span><b>${stats.progress}%</b><small>已熟练</small></span>
    </div>
    <div class="memory-legend">
      <span><i class="dot gold"></i>熟练 ${stats.mastered}</span>
      <span><i class="dot sage"></i>学习中 ${stats.learning}</span>
      <span><i class="dot faint"></i>新卡 ${stats.fresh}</span>
    </div>
    <p class="card-note">“忘记 / 模糊 / 记住”会分别安排 1 / 2 / 4 天后复习。</p>
  </section>`;
}

export function reciteView() {
  const stats = reciteStats();
  const due = reciteDue();
  const current = due[0];
  const all = state.recite.slice().sort((a, b) => String(a.nextReview).localeCompare(String(b.nextReview)));
  const mastered = all.filter((card) => (card.level || 0) >= 3);
  const list = ui.reciteFilter === 'all'
    ? all
    : ui.reciteFilter === 'mastered'
      ? mastered
      : due.slice(1);
  const showList = ui.reciteFilter !== 'due' || Boolean(current);
  const queueOnly = ui.reciteFilter === 'due' && Boolean(current) && !list.length;

  return `<div class="view recite-view">
    ${pageHead({
      eyebrow: 'RECITE · 每天 20–40 分钟',
      title: '背下来，才是你的。',
      sub: '先复述框架，再补关键词。能说出来，才算真的背过。',
      actions: `<button type="button" class="btn btn-primary" data-action="scroll-recite-form">${icon('plus', 15)} 新增卡片</button>`,
      accent: 'gold',
    })}
    <section class="stat-strip">
      ${statCard({ label: '今日待复习', value: stats.due, unit: '张', hint: stats.due ? '先清最旧的卡' : '今天的卡已清完' })}
      ${statCard({ label: '今天已复习', value: stats.reviewedToday, unit: '张', hint: `总卡片 ${stats.total} 张` })}
      ${statCard({ label: '已熟练', value: stats.mastered, unit: '张', hint: `学习中 ${stats.learning} 张` })}
      ${statCard({ label: '总进度', value: stats.progress, unit: '%', hint: '熟练度 3 以上计入' })}
    </section>
    ${filters()}
    <div class="recite-layout">
      <div class="recite-main">
        ${ui.reciteFilter === 'due'
          ? (current
            ? flashcard(current, due)
            : `<section class="card recite-done-card">
                <span class="done-mark">${icon('check', 30)}</span>
                <h2>今天的卡，清完了。</h2>
                <p>不用再刷新卡。去把省下的时间留给阅读或错题；明天它们会再出现。</p>
                <a href="#today" class="btn btn-secondary">回到今日计划</a>
              </section>`)
          : ''}
        ${!showList
          ? ''
          : queueOnly
            ? `<section class="card queue-empty-card"><p>今天只剩这一张，答完就清空。</p></section>`
            : `<section class="card">
                <div class="card-head compact">
                  <div><div class="eyebrow"><i></i>LIST</div><h2>${ui.reciteFilter === 'due' ? '后面的队列' : ui.reciteFilter === 'mastered' ? '已经熟练' : '全部卡片'}</h2></div>
                  <span class="form-hint">${list.length} 张</span>
                </div>
                ${cardList(list)}
              </section>`}
      </div>
      <aside class="recite-side">
        ${sideStats()}
        <div id="recite-form">${addForm()}</div>
        <section class="card coach-card neutral"><span class="coach-icon">${icon('spark', 20)}</span><div><div class="eyebrow"><i></i>HOW TO</div><h2>先说，再看</h2><p>看到问题先口头复述 30 秒，再点开答案。直接读答案，会让“看懂了”冒充“记住了”。</p></div></section>
      </aside>
    </div>
    ${pageFooter()}
  </div>`;
}

