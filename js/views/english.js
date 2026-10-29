/* 英语二：单词、阅读、翻译、作文 */

import { horizontalBars, ring } from '../charts.js';
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
  PAPER_YEARS,
  READING_ERROR_TAGS,
} from '../content.js';
import { ui } from '../ui.js';
import {
  englishStats,
  lastReadingAccuracy,
  readingErrorStats,
} from '../selectors.js';
import { state } from '../store.js';
import {
  addDays,
  escapeHTML as esc,
  formatDate,
  pct,
  sortByDateDesc,
  sum,
  todayKey,
  truncate,
  weekdayCN,
} from '../utils.js';

const TABS = [
  { id: 'vocab', label: '单词', icon: 'words' },
  { id: 'reading', label: '阅读', icon: 'book' },
  { id: 'translation', label: '翻译', icon: 'pen' },
  { id: 'writing', label: '作文', icon: 'file' },
];

function tabs() {
  return `<div class="tabs" role="tablist" aria-label="英语模块">
    ${TABS.map((tab) => `<button type="button" role="tab" aria-selected="${ui.englishTab === tab.id}"
      class="tab ${ui.englishTab === tab.id ? 'is-active' : ''}" data-action="switch-english" data-tab="${tab.id}">
      ${icon(tab.icon, 15)} ${tab.label}
    </button>`).join('')}
  </div>`;
}

function yearOptions(selected = '') {
  return PAPER_YEARS.map((year) => `<option value="${year}" ${String(selected) === String(year) ? 'selected' : ''}>${year} 年</option>`).join('');
}

function vocabWeek() {
  const end = todayKey();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(end, index - 6);
    const logs = state.english.vocabLogs.filter((item) => item.date === date);
    return {
      date,
      newCount: sum(logs, (item) => item.newCount),
      reviewCount: sum(logs, (item) => item.reviewCount),
      total: sum(logs, (item) => item.newCount) + sum(logs, (item) => item.reviewCount),
      minutes: sum(logs, (item) => item.minutes),
    };
  });
  const max = Math.max(1, ...days.map((item) => item.total));
  return `<div class="vocab-week">
    ${days.map((day) => `<div class="vocab-day ${day.date === end ? 'is-today' : ''} ${day.total ? '' : 'is-empty'}">
      <b>${day.total || ''}</b>
      <span class="vocab-bar"><i style="height:${Math.max(day.total ? 8 : 0, (day.total / max) * 100)}%"></i></span>
      <small>${day.date === end ? '今' : weekdayCN(day.date, true)}</small>
    </div>`).join('')}
  </div>`;
}

function wordList() {
  const words = state.english.words.slice().reverse();
  if (!words.length) {
    return `<p class="muted-note">生词本还是空的。把反复忘的词放进来，比抄一整页单词更有效。</p>`;
  }
  const labels = ['新词', '眼熟', '认识', '熟练'];
  return `<div class="word-list">
    ${words.slice(0, 14).map((word) => `<div class="word-row">
      <div class="word-main"><b>${esc(word.word)}</b><span>${esc(word.meaning)}</span>${word.example ? `<small>${esc(word.example)}</small>` : ''}</div>
      <button type="button" class="mastery-pill level-${word.mastery || 0}" data-action="word-mastery" data-id="${word.id}" title="点击切换熟练度">${labels[Math.min(3, word.mastery || 0)]}</button>
      <button type="button" class="icon-button danger" data-action="delete-record" data-collection="english.words" data-id="${word.id}" aria-label="删除单词">${icon('trash', 14)}</button>
    </div>`).join('')}
  </div>`;
}

function vocabPanel() {
  const stats = englishStats();
  return `<div class="english-layout">
    <div class="english-main">
      <section class="card form-card">
        <div class="card-head">
          <div><div class="eyebrow"><i></i>VOCABULARY</div><h2>今日单词记录</h2><p>不追求一次背很多，追求明天还记得。</p></div>
          <span class="form-hint">本周 ${stats.weekNewWords + stats.weekReviewWords} 词</span>
        </div>
        <form data-form="vocab">
          <div class="form-grid three">
            <label class="field"><span class="field-label">日期</span><input class="input" type="date" name="date" value="${todayKey()}" max="${todayKey()}" required></label>
            <label class="field"><span class="field-label">词源</span><select class="select" name="source"><option>APP</option><option>词汇书</option><option>真题</option><option>生词本</option><option>其他</option></select></label>
            <label class="field"><span class="field-label">用时（分钟）</span><input class="input" type="number" name="minutes" min="1" max="180" value="20" required></label>
            <label class="field"><span class="field-label">新词</span><input class="input" type="number" name="newCount" min="0" max="300" value="30" required></label>
            <label class="field"><span class="field-label">复习旧词</span><input class="input" type="number" name="reviewCount" min="0" max="500" value="60" required></label>
            <label class="field"><span class="field-label">备注 <small>可选</small></span><input class="input" type="text" name="note" maxlength="80" placeholder="例如：熟词僻义 12 个"></label>
          </div>
          <div class="form-actions"><span class="form-note">${icon('info', 14)} 新词和复习分开记，才能看出时间花在哪。</span><button type="submit" class="btn btn-primary">记下今天的单词</button></div>
        </form>
      </section>

      <section class="card">
        <div class="card-head compact">
          <div><div class="eyebrow"><i></i>LAST 7 DAYS</div><h2>单词节奏</h2></div>
          <span class="form-hint">本周 ${stats.vocabDays} 天有记录</span>
        </div>
        ${vocabWeek()}
        <div class="vocab-summary">
          <span><b>${stats.newWords}</b> 新词累计</span>
          <span><b>${stats.reviewWords}</b> 旧词复习</span>
          <span><b>${stats.words}</b> 生词本</span>
        </div>
      </section>

      <section class="card">
        <div class="card-head compact"><div><h2 class="small-title">单词记录</h2></div></div>
        ${state.english.vocabLogs.length ? `<div class="record-list compact-list">
          ${sortByDateDesc(state.english.vocabLogs).slice(0, 8).map((log) => `<article class="record-row slim">
            <div class="record-date"><b>${formatDate(log.date, false).replace('月', '.').replace('日', '')}</b><span>${esc(log.source)}</span></div>
            <div class="record-main"><h3>新词 ${log.newCount} · 复习 ${log.reviewCount}</h3><p>${log.note ? esc(log.note) : `${log.minutes} 分钟`}</p></div>
            <div class="record-score"><b>${log.newCount + log.reviewCount}</b><span>词</span></div>
            <button type="button" class="icon-button danger" data-action="delete-record" data-collection="english.vocabLogs" data-id="${log.id}" aria-label="删除单词记录">${icon('trash', 14)}</button>
          </article>`).join('')}
        </div>` : emptyState({ iconName: 'words', title: '还没有单词记录', text: '记录第一天的单词，7 天后就能看到自己的节奏。' })}
      </section>
    </div>
    <aside class="english-side">
      <section class="card">
        <div class="card-head compact"><div><div class="eyebrow"><i></i>WORD BOOK</div><h2>生词本</h2></div><span class="form-hint">${stats.wordsMastered}/${stats.words} 熟练</span></div>
        <form data-form="word" class="inline-form">
          <div class="form-grid two tight">
            <label class="field"><span class="visually-hidden">单词</span><input class="input" type="text" name="word" placeholder="单词" aria-label="单词" required maxlength="60"></label>
            <label class="field"><span class="visually-hidden">核心义</span><input class="input" type="text" name="meaning" placeholder="核心义" aria-label="核心义" required maxlength="100"></label>
          </div>
          <label class="field"><span class="visually-hidden">例句或搭配</span><input class="input" type="text" name="example" placeholder="例句 / 搭配（可选）" aria-label="例句或搭配" maxlength="160"></label>
          <button type="submit" class="btn btn-secondary btn-block">${icon('plus', 14)} 加入生词本</button>
        </form>
        ${wordList()}
      </section>
      <section class="card coach-card neutral">
        <span class="coach-icon">${icon('spark', 20)}</span>
        <div><div class="eyebrow"><i></i>COACH</div><h2>单词只背“会考的义”</h2><p>先背核心义和熟词僻义，再记搭配。一个词在真题里出现过，比单词书上的第 8 个释义更值得记。</p></div>
      </section>
    </aside>
  </div>`;
}

function readingForm() {
  return `<section class="card form-card">
    <div class="card-head"><div><div class="eyebrow"><i></i>READING</div><h2>记录一次阅读训练</h2><p>先限时，再精读。正确率只是结果，错因才是资产。</p></div></div>
    <form data-form="reading">
      <div class="form-grid three">
        <label class="field"><span class="field-label">日期</span><input class="input" type="date" name="date" value="${todayKey()}" max="${todayKey()}" required></label>
        <label class="field"><span class="field-label">年份</span><select class="select" name="year">${yearOptions(2022)}</select></label>
        <label class="field"><span class="field-label">篇目</span><input class="input" type="text" name="passage" value="Text 1–2" maxlength="40" required></label>
        <label class="field"><span class="field-label">总题数</span><input class="input" type="number" name="total" min="1" max="30" value="10" required></label>
        <label class="field"><span class="field-label">答对</span><input class="input" type="number" name="correct" min="0" max="30" value="7" required></label>
        <label class="field"><span class="field-label">用时（分钟）</span><input class="input" type="number" name="minutes" min="1" max="180" value="45" required></label>
      </div>
      <div class="field"><span class="field-label">错因 <small>可多选</small></span>${tagChecks('errorTags', READING_ERROR_TAGS)}</div>
      <label class="field"><span class="field-label">精读笔记 <small>只记可迁移的</small></span><textarea class="textarea" name="note" rows="2" maxlength="300" placeholder="例如：推断题错在把自己的常识带进去了；正确项是原文第二段同义替换。"></textarea></label>
      <div class="form-actions"><span class="form-note">${icon('info', 14)} 一篇阅读控制在 18–20 分钟。</span><button type="submit" class="btn btn-primary">记下这次阅读</button></div>
    </form>
  </section>`;
}

function readingPanel() {
  const accuracy = lastReadingAccuracy();
  const errors = readingErrorStats();
  const all = sortByDateDesc(state.english.readings);
  return `<div class="english-layout">
    <div class="english-main">
      ${readingForm()}
      <section class="card">
        <div class="card-head compact"><div><div class="eyebrow"><i></i>HISTORY</div><h2>阅读记录</h2></div><span class="form-hint">${all.length} 次</span></div>
        ${all.length ? `<div class="record-list">
          ${all.slice(0, 10).map((record) => {
            const acc = pct(record.correct, record.total);
            return `<article class="record-row">
              <div class="record-date"><b>${record.year}</b><span>${esc(record.passage)}</span></div>
              <div class="record-main"><div class="record-title"><h3>${record.correct}/${record.total} 题</h3>${badge(`${acc}%`, acc >= 75 ? 'good' : acc >= 60 ? 'mid' : 'warn')}</div>
                <p>${(record.errorTags || []).map((tag) => `<span class="mini-tag">${esc(tag)}</span>`).join('')}${record.note ? `<span class="record-note">${esc(truncate(record.note, 56))}</span>` : ''}</p></div>
              <div class="record-score"><b>${record.minutes}</b><span>分钟</span></div>
              <button type="button" class="icon-button danger" data-action="delete-record" data-collection="english.readings" data-id="${record.id}" aria-label="删除阅读记录">${icon('trash', 14)}</button>
            </article>`;
          }).join('')}
        </div>` : emptyState({ iconName: 'book', title: '还没有阅读记录', text: '做完两篇真题阅读，把正确数和错因记下来，才能看出问题是定位还是理解。' })}
      </section>
    </div>
    <aside class="english-side">
      <section class="card reading-score-card">
        <div class="card-head compact"><div><div class="eyebrow"><i></i>ACCURACY</div><h2>近 5 次正确率</h2></div></div>
        <div class="reading-ring">
          ${ring(accuracy || 0, { size: 124, stroke: 8, color: 'var(--blue)' })}
          <span><b>${accuracy === null ? '—' : `${accuracy}%`}</b><small>${accuracy === null ? '等待数据' : accuracy >= 75 ? '稳定' : accuracy >= 60 ? '可提升' : '先精读'}</small></span>
        </div>
        <p class="card-note">目标不是每次都 80%，而是错因不重复。</p>
      </section>
      <section class="card">
        <div class="card-head compact"><div><h2 class="small-title">错因分布</h2></div></div>
        ${errors.length ? horizontalBars(errors.map((item) => ({ label: item.tag, value: item.count, display: `${item.count} 次`, tone: 'blue' }))) : `<p class="muted-note">给阅读记录标错因后，这里会显示你的高频失分点。</p>`}
      </section>
      <section class="card coach-card neutral"><span class="coach-icon">${icon('spark', 20)}</span><div><div class="eyebrow"><i></i>COACH</div><h2>精读不是翻译全文</h2><p>只做三件事：找到定位句、划出同义替换、写一句“为什么错”。剩下的时间留给下一篇。</p></div></section>
    </aside>
  </div>`;
}

function translationPanel() {
  const records = sortByDateDesc(state.english.translations);
  const scores = records.map((item) => Number(item.score)).filter(Number.isFinite);
  const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '—';
  return `<div class="english-layout">
    <div class="english-main">
      <section class="card form-card">
        <div class="card-head"><div><div class="eyebrow"><i></i>TRANSLATION</div><h2>记录一段翻译</h2><p>先落笔，再对照；不查词，不边看答案边译。</p></div><span class="form-hint">满分 15 分</span></div>
        <form data-form="translation">
          <div class="form-grid three">
            <label class="field"><span class="field-label">日期</span><input class="input" type="date" name="date" value="${todayKey()}" max="${todayKey()}" required></label>
            <label class="field"><span class="field-label">年份</span><select class="select" name="year">${yearOptions(2021)}</select></label>
            <label class="field"><span class="field-label">用时（分钟）</span><input class="input" type="number" name="minutes" min="1" max="120" value="25" required></label>
            <label class="field"><span class="field-label">自评分</span><input class="input" type="number" name="score" min="0" max="15" step="0.5" value="10" required></label>
          </div>
          <label class="field"><span class="field-label">原文 / 我的译文摘要</span><textarea class="textarea" name="text" rows="3" maxlength="800" placeholder="摘录最难的那一句，或写下自己的译文。"></textarea></label>
          <label class="field"><span class="field-label">对照后记下的 1 个问题</span><input class="input" type="text" name="note" maxlength="160" placeholder="例如：定语从句太长，中文语序没有调过来。"></label>
          <div class="form-actions"><span class="form-note">${icon('info', 14)} 翻译提分靠“结构 + 检查”，不是靠词藻。</span><button type="submit" class="btn btn-primary">记下这段翻译</button></div>
        </form>
      </section>
      <section class="card">
        <div class="card-head compact"><div><div class="eyebrow"><i></i>HISTORY</div><h2>翻译记录</h2></div><span class="form-hint">平均 ${avg} / 15</span></div>
        ${records.length ? `<div class="stack-list">
          ${records.map((record) => `<article class="stack-row">
            <div class="stack-head"><div><b>${record.year} 年 · ${formatDate(record.date, false)}</b><span>${record.minutes} 分钟</span></div><strong>${record.score}<small>/15</small></strong></div>
            ${record.text ? `<p class="quote-text">${esc(truncate(record.text, 150))}</p>` : ''}
            ${record.note ? `<p class="record-note">${esc(record.note)}</p>` : ''}
            <button type="button" class="icon-button danger" data-action="delete-record" data-collection="english.translations" data-id="${record.id}" aria-label="删除翻译记录">${icon('trash', 14)}</button>
          </article>`).join('')}
        </div>` : emptyState({ iconName: 'pen', title: '还没有翻译记录', text: '每天一段真题翻译，15 分钟落笔 + 10 分钟对照，30 天后手感完全不同。' })}
      </section>
    </div>
    <aside class="english-side">
      <section class="card stat-focus"><span class="big-number">${avg}</span><span class="big-unit">/ 15</span><h3>翻译平均自评分</h3><p>${records.length ? `累计 ${records.length} 段` : '完成第一段后开始统计'}</p></section>
      <section class="card coach-card neutral"><span class="coach-icon">${icon('spark', 20)}</span><div><div class="eyebrow"><i></i>CHECKLIST</div><h2>译完只检查四件事</h2><p>主干是否完整；修饰语是否放对位置；时态和单复数；专有名词是否统一。不要为了“高级”改到失真。</p></div></section>
      <section class="card"><div class="card-head compact"><h2 class="small-title">一句提醒</h2></div><p class="side-quote">“不会的词，用解释绕过去，比空着更得分。”</p></section>
    </aside>
  </div>`;
}

function writingPanel() {
  const records = sortByDateDesc(state.english.writings);
  const small = records.filter((item) => item.type === 'small').length;
  const big = records.filter((item) => item.type === 'big').length;
  return `<div class="english-layout">
    <div class="english-main">
      <section class="card form-card">
        <div class="card-head"><div><div class="eyebrow"><i></i>WRITING</div><h2>整理一篇作文</h2><p>不是抄模板，是把模板改成自己写得出的句子。</p></div><span class="form-hint">小作文 10 / 大作文 15</span></div>
        <form data-form="writing">
          <div class="form-grid three">
            <label class="field"><span class="field-label">日期</span><input class="input" type="date" name="date" value="${todayKey()}" max="${todayKey()}" required></label>
            <label class="field"><span class="field-label">类型</span><select class="select" name="type"><option value="small">小作文</option><option value="big">大作文</option></select></label>
            <label class="field"><span class="field-label">题目 / 年份</span><input class="input" type="text" name="topic" maxlength="80" placeholder="例如：2023 年大作文" required></label>
            <label class="field"><span class="field-label">自评分 <small>小 ≤10 / 大 ≤15</small></span><input class="input" type="number" name="score" min="0" max="15" step="0.5" placeholder="小 10 / 大 15"></label>
            <label class="field"><span class="field-label">用时（分钟）</span><input class="input" type="number" name="minutes" min="5" max="120" value="30" required></label>
            <label class="field"><span class="field-label">一句话总结</span><input class="input" type="text" name="note" maxlength="140" placeholder="例如：原因段还是只会写 two reasons"></label>
          </div>
          <label class="field"><span class="field-label">框架 / 高级句 / 我的版本 <small>只留能复用的</small></span><textarea class="textarea" name="outline" rows="4" maxlength="1200" placeholder="第一段：描述图表……&#10;第二段：原因 1 / 原因 2……&#10;可复用句：What stands out in the chart is that..."></textarea></label>
          <div class="form-actions"><span class="form-note">${icon('info', 14)} 一篇作文至少留 3 句“下次还能用”的句子。</span><button type="submit" class="btn btn-primary">保存这篇作文</button></div>
        </form>
      </section>
      <section class="card">
        <div class="card-head compact"><div><div class="eyebrow"><i></i>COLLECTION</div><h2>作文整理</h2></div><span class="form-hint">小 ${small} · 大 ${big}</span></div>
        ${records.length ? `<div class="writing-grid">
          ${records.map((record) => `<article class="writing-card">
            <div class="writing-top"><span class="subject-tag ${record.type === 'small' ? 'english' : 'politics'}">${record.type === 'small' ? '小作文' : '大作文'}</span><span class="muted">${formatDate(record.date, false)}</span>${record.score !== null && record.score !== '' ? `<b>${record.score}</b>` : ''}</div>
            <h3>${esc(record.topic)}</h3>
            ${record.note ? `<p class="writing-note">${esc(record.note)}</p>` : ''}
            ${record.outline ? `<details class="inline-details"><summary>查看框架 / 句子</summary><p class="quote-text">${esc(record.outline)}</p></details>` : ''}
            <div class="writing-foot"><span>${record.minutes} 分钟</span><button type="button" class="link-button danger" data-action="delete-record" data-collection="english.writings" data-id="${record.id}">删除</button></div>
          </article>`).join('')}
        </div>` : emptyState({ iconName: 'file', title: '还没有作文整理', text: '每写一篇，只留下框架和 3 句能复用的话。考前你会感谢现在做减法的自己。' })}
      </section>
    </div>
    <aside class="english-side">
      <section class="card coach-card neutral"><span class="coach-icon">${icon('spark', 20)}</span><div><div class="eyebrow"><i></i>STRUCTURE</div><h2>小作文：五句骨架</h2><p>称呼 → 目的句 → 要点 1 → 要点 2 → 礼貌收尾 + 署名。先保证格式和要点，再谈高级表达。</p></div></section>
      <section class="card coach-card neutral"><span class="coach-icon">${icon('spark', 20)}</span><div><div class="eyebrow"><i></i>STRUCTURE</div><h2>大作文：三段就够</h2><p>描述图表（3 句）→ 原因分析（2–3 个因素）→ 结论/建议（1–2 句）。不要在考场上现场发明模板。</p></div></section>
      <section class="card"><div class="card-head compact"><h2 class="small-title">背诵联动</h2></div><p class="side-quote">把整理出的模板加入背诵清单，用间隔复习代替考前突击。</p><a href="#recite" class="text-link">去背诵清单 ${icon('arrow', 13)}</a></section>
    </aside>
  </div>`;
}

export function englishView() {
  const stats = englishStats();
  const readingAccuracy = lastReadingAccuracy();
  return `<div class="view english-view">
    ${pageHead({
      eyebrow: 'ENGLISH II · 每天约 100 分钟',
      title: '英语二，把手感练成确定性。',
      sub: '单词不断、阅读限时、翻译落笔、作文成文；真题用来校准，不用来打击自己。',
      actions: `<a href="#papers" class="btn btn-quiet">${icon('file', 15)} 真题打卡</a>`,
      accent: 'blue',
    })}
    <section class="stat-strip">
      ${statCard({ label: '阅读近 5 次正确率', value: readingAccuracy === null ? '—' : readingAccuracy, unit: readingAccuracy === null ? '' : '%', hint: stats.readingQuestions ? `累计 ${stats.readingQuestions} 题` : '记录一次阅读后可见' })}
      ${statCard({ label: '本周单词', value: stats.weekNewWords + stats.weekReviewWords, unit: '词', hint: `新 ${stats.weekNewWords} · 复习 ${stats.weekReviewWords}` })}
      ${statCard({ label: '翻译累计', value: stats.translations, unit: '段', hint: stats.translationAvg === null ? '还没有自评分' : `平均 ${stats.translationAvg.toFixed(1)} / 15` })}
      ${statCard({ label: '作文整理', value: stats.writings, unit: '篇', hint: `生词本 ${stats.words} 词` })}
    </section>
    ${tabs()}
    ${ui.englishTab === 'vocab' ? vocabPanel() : ''}
    ${ui.englishTab === 'reading' ? readingPanel() : ''}
    ${ui.englishTab === 'translation' ? translationPanel() : ''}
    ${ui.englishTab === 'writing' ? writingPanel() : ''}
    ${pageFooter()}
  </div>`;
}
