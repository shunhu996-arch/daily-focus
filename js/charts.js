/* 研途 · 无依赖 SVG / CSS 图表 */

import { esc, pct } from './utils.js';

export function ring(percent, options = {}) {
  const size = options.size || 120;
  const stroke = options.stroke || 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const value = Math.max(0, Math.min(100, Number(percent) || 0));
  const offset = circumference - (value / 100) * circumference;
  const color = options.color || 'var(--red)';
  return `
    <svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${value}%">
      <circle class="ring-track" cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke-width="${stroke}"></circle>
      <circle class="ring-value" cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none"
        stroke="${color}" stroke-width="${stroke}" stroke-linecap="round"
        stroke-dasharray="${circumference.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}"
        transform="rotate(-90 ${size / 2} ${size / 2})"></circle>
    </svg>`;
}

export function stackedBars(days, options = {}) {
  const maxValue = Math.max(
    options.max || 180,
    ...days.map((day) => Number(day.focus) || 0),
    30,
  );
  const ticks = options.ticks || [0, Math.round(maxValue / 3), Math.round((maxValue * 2) / 3), maxValue];
  const columns = days.map((day) => {
    const total = Number(day.focus) || 0;
    const politics = Number(day.politics) || 0;
    const english = Number(day.english) || 0;
    const height = Math.max(total ? 4 : 0, (total / maxValue) * 100);
    const pHeight = total ? (politics / total) * 100 : 0;
    const eHeight = total ? (english / total) * 100 : 0;
    const isToday = options.today && day.date === options.today;
    return `
      <div class="bar-col ${isToday ? 'is-today' : ''}" title="${esc(day.date)} · 政治 ${politics} 分钟 · 英语 ${english} 分钟">
        <div class="bar-plot">
          ${total ? `<div class="bar-stack" style="height:${height.toFixed(2)}%">
            <span class="bar-seg politics" style="height:${pHeight.toFixed(2)}%"></span>
            <span class="bar-seg english" style="height:${eHeight.toFixed(2)}%"></span>
          </div>` : '<span class="bar-zero"></span>'}
        </div>
        <span class="bar-label">${esc(day.label || '')}</span>
      </div>`;
  }).join('');

  return `
    <div class="stacked-chart" role="img" aria-label="每日专注时长柱状图">
      <div class="chart-y">${ticks.slice().reverse().map((tick) => `<span>${tick}</span>`).join('')}</div>
      <div class="chart-main">
        <div class="chart-grid">${ticks.map(() => '<i></i>').join('')}</div>
        <div class="bar-row">${columns}</div>
      </div>
    </div>
    <div class="chart-legend">
      <span><i class="dot politics"></i>政治</span>
      <span><i class="dot english"></i>英语二</span>
      <span class="muted">单位：分钟</span>
    </div>`;
}

export function scoreLine(sets, options = {}) {
  const width = 620;
  const height = 200;
  const padding = { top: 18, right: 18, bottom: 30, left: 34 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const maxScore = 50;
  const n = sets.length;
  const points = sets.map((item, index) => {
    const value = item.completed && Number.isFinite(Number(item.score)) ? Number(item.score) : null;
    return {
      x: padding.left + (n === 1 ? innerW / 2 : (index / (n - 1)) * innerW),
      y: padding.top + innerH - ((value === null ? 0 : value) / maxScore) * innerH,
      value,
      label: `第${item.number}套`,
    };
  });
  const valid = points.filter((point) => point.value !== null);
  const path = valid.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
  const area = valid.length
    ? `${path} L${valid[valid.length - 1].x.toFixed(1)},${(padding.top + innerH).toFixed(1)} L${valid[0].x.toFixed(1)},${(padding.top + innerH).toFixed(1)} Z`
    : '';
  const targetY = padding.top + innerH - (options.target || 40) / maxScore * innerH;
  const grid = [0, 10, 20, 30, 40, 50].map((value) => {
    const y = padding.top + innerH - (value / maxScore) * innerH;
    return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" class="grid-line"></line>
      <text x="${padding.left - 8}" y="${y + 4}" text-anchor="end" class="axis-text">${value}</text>`;
  }).join('');

  return `
    <svg class="score-line" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(options.label || '分数趋势')}">
      ${grid}
      <line x1="${padding.left}" y1="${targetY}" x2="${width - padding.right}" y2="${targetY}" class="target-line"></line>
      <text x="${width - padding.right}" y="${targetY - 6}" text-anchor="end" class="target-text">目标 ${options.target || 40}</text>
      ${area ? `<path d="${area}" class="line-area"></path>` : ''}
      ${path ? `<path d="${path}" class="line-path"></path>` : ''}
      ${points.map((point) => (point.value === null
        ? `<circle cx="${point.x}" cy="${padding.top + innerH}" r="2.5" class="line-empty"></circle>`
        : `<circle cx="${point.x}" cy="${point.y}" r="4" class="line-dot"></circle>
           <text x="${point.x}" y="${point.y - 11}" text-anchor="middle" class="line-value">${point.value}</text>`)).join('')}
      ${points.map((point) => `<text x="${point.x}" y="${height - 8}" text-anchor="middle" class="axis-text">${esc(point.label)}</text>`).join('')}
    </svg>`;
}

export function horizontalBars(items, options = {}) {
  if (!items.length) return '';
  const max = Math.max(...items.map((item) => Number(item.value) || 0), 1);
  return `<div class="hbars">
    ${items.map((item) => `
      <div class="hbar-row">
        <span class="hbar-label">${esc(item.label)}</span>
        <span class="hbar-track"><i class="hbar-fill ${item.tone || ''}" style="width:${Math.max(2, (Number(item.value) / max) * 100).toFixed(1)}%"></i></span>
        <span class="hbar-value">${esc(item.display ?? item.value)}</span>
      </div>`).join('')}
  </div>`;
}

export function progressLine(value, label = '') {
  return `<div class="progress-line" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${value}" aria-label="${esc(label)}">
    <i style="width:${Math.max(0, Math.min(100, value))}%"></i>
  </div>`;
}

export function miniRing(value, size = 58, stroke = 5, color = 'var(--sage)') {
  return `<span class="mini-ring" style="width:${size}px;height:${size}px">${ring(value, { size, stroke, color })}
    <b>${value}%</b></span>`;
}

export function accuracyTone(accuracy) {
  if (accuracy === null || accuracy === undefined) return 'neutral';
  if (accuracy >= 75) return 'good';
  if (accuracy >= 60) return 'mid';
  return 'warn';
}

export { pct };
