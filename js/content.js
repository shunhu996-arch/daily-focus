/* 研途 · 计划、清单与站点文案 */

import { addDays, diffDays, sum, weekdayCN } from './utils.js';

export const APP_NAME = '研途';
export const APP_SUBTITLE = '五十日冲刺';
export const DEFAULT_EXAM_DATE = '2026-12-19';
export const DEFAULT_DAILY_CAP = 180;
export const PLAN_TARGET = 170;

export const PHASES = [
  {
    id: 'foundation',
    label: '基础收口',
    en: 'FOUNDATION',
    desc: '把选择题正确率、单词熟悉度和翻译手感先接住。',
    goal: '正确率优先，不追速度',
    tone: 'sage',
  },
  {
    id: 'sprint',
    label: '强化提分',
    en: 'SPRINT',
    desc: '用肖八和真题，找出真正会丢分的地方。',
    goal: '错题闭环，专项突破',
    tone: 'gold',
  },
  {
    id: 'final',
    label: '考前定型',
    en: 'FINAL',
    desc: '肖四、作文、错题，只做能直接变成分数的事。',
    goal: '保持手感，稳定输出',
    tone: 'red',
  },
];

export const POLITICS_CHAPTERS = ['马原', '毛中特', '史纲', '思修法基', '时政'];
export const PRACTICE_SOURCES = ['肖1000', '肖八', '肖四', '历年真题', '其他'];
export const MOCK_SOURCES = ['肖八', '肖四'];
export const POLITICS_ERROR_TAGS = ['概念不清', '审题偏差', '时政盲区', '排除失误', '关系混淆', '蒙对'];
export const MOCK_ERROR_TAGS = ['马原', '毛中特', '史纲', '思修法基', '时政', '审题'];
export const READING_ERROR_TAGS = ['细节定位', '推理判断', '主旨大意', '态度观点', '词义句意', '时间分配'];
export const PAPER_STATUS = [
  { id: 'todo', label: '未开始' },
  { id: 'first', label: '一刷' },
  { id: 'second', label: '二刷' },
  { id: 'deep', label: '精析完成' },
];
export const PAPER_YEARS = Array.from({ length: 17 }, (_, i) => 2010 + i);
export const RECITE_SUBJECTS = [
  { id: 'politics', label: '政治' },
  { id: 'english', label: '英语二' },
];
export const RECITE_CATEGORIES = {
  politics: ['马原', '毛中特', '史纲', '思修法基', '时政'],
  english: ['小作文', '大作文', '翻译', '阅读方法', '词汇/短语'],
};
export const MOODS = [
  { id: 'calm', char: '静', label: '平静' },
  { id: 'focus', char: '稳', label: '专注' },
  { id: 'tired', char: '倦', label: '疲惫' },
  { id: 'anxious', char: '紧', label: '焦虑' },
];
export const RECITE_RATINGS = [
  { id: 'again', label: '忘了', hint: '回到今天，明天再来', interval: 1, levelDelta: 0 },
  { id: 'hard', label: '模糊', hint: '有印象，但说不完整', interval: 2, levelDelta: -1 },
  { id: 'good', label: '记住', hint: '能复述框架和关键词', interval: 4, levelDelta: 1 },
];
export const REVIEW_PROMPTS = [
  { id: 'wins', label: '本周做成了什么', placeholder: '只写具体动作，例如：肖八第 1–2 套选择题完成，阅读错题按题型归了类。' },
  { id: 'blockers', label: '卡在哪里', placeholder: '例如：多选题一遇到“根本/基本”就混，阅读推断题总想太多。' },
  { id: 'next', label: '下周只改一件事', placeholder: '例如：每晚把当天选择题错因写成一句话，第二天早读先看。' },
];

export const DAILY_REMINDERS = [
  '今天不追求感动自己，只追求留下证据。',
  '错题不是污点，是明天的分数。',
  '计划可以慢，但不能断。',
  '把会做的做对，就是冲刺期最大的提分。',
  '背不下来就先说框架，说不清才是没背会。',
  '阅读的正确答案，永远长在原文里。',
  '今天的三小时，只花在能变成分数的地方。',
  '不要用“看了很多”代替“写对一道”。',
  '状态一般也没关系，完成最低配版今天。',
  '现在开始，永远比“等状态好”早一点。',
  '分析题先写关键词，再展开成句子。',
  '把手机放远一点，把计时器打开。',
];

export const FOCUS_QUOTES = [
  '先完成，再完美。',
  '今天这一页，算数。',
  '慢一点，但不要停。',
  '把注意力交给眼前这道题。',
  '稳定，是最被低估的天赋。',
];

export function phaseForDate(dateKey, profile) {
  const daysLeft = diffDays(dateKey, profile.examDate);
  if (daysLeft <= 12) return PHASES[2];
  if (daysLeft <= 33) return PHASES[1];
  return PHASES[0];
}

export function phaseDates(phaseId, profile) {
  const finalStart = addDays(profile.examDate, -12);
  const sprintStart = addDays(profile.examDate, -33);
  if (phaseId === 'final') return { start: finalStart, end: addDays(profile.examDate, -1) };
  if (phaseId === 'sprint') return { start: sprintStart, end: addDays(finalStart, -1) };
  return { start: profile.startDate, end: addDays(sprintStart, -1) };
}

export function dayNumber(dateKey, profile) {
  return diffDays(profile.startDate, dateKey) + 1;
}

export function totalPlanDays(profile) {
  return Math.max(0, diffDays(profile.startDate, profile.examDate));
}

function task(dateKey, subject, kind, title, detail, minutes, route) {
  return {
    id: `task_${dateKey}_${subject}_${kind}`,
    kind,
    subject,
    title,
    detail,
    minutes,
    route,
    done: false,
  };
}

function englishSpecial(dateKey, phaseId) {
  const dow = new Date(`${dateKey}T12:00:00`).getDay();
  if (phaseId === 'foundation') {
    if (dow === 0) {
      return task(dateKey, 'english', 'review', '真题复盘 · 本周阅读与生词', '只看错题和生词，不再开新题；把错因写成一句话。', 30, '#english');
    }
    if (dow === 1 || dow === 3 || dow === 5) {
      const details = [
        '先拆主干，再落笔；对答案只改结构问题。',
        '真题段落回译，标出不会处理的表达。',
        '把本周改过的句子重新译一次，别只看答案。',
      ];
      return task(dateKey, 'english', 'translation', '翻译 · 1 段真题 + 对照修改', details[Math.floor(dow / 2)], 30, '#english');
    }
    return task(dateKey, 'english', 'writing', dow === 2 ? '小作文 · 书信框架 1 篇' : '大作文 · 图表描述 + 仿写', dow === 2 ? '先默框架，再限时 15 分钟成文。' : '第一句写图名，第二句写趋势，第三句写对比。', 30, '#english');
  }
  if (phaseId === 'sprint') {
    if (dow === 0) {
      return task(dateKey, 'english', 'paper', '真题套卷 · 阅读 + 新题型复盘', '按考试节奏做，做完只精析错题，不逐句抄写。', 40, '#papers');
    }
    if (dow === 1 || dow === 3 || dow === 5) {
      return task(dateKey, 'english', 'translation', '翻译 · 真题 1 段限时', '15 分钟落笔，10 分钟对照；只记 3 个可迁移的表达。', 40, '#english');
    }
    return task(dateKey, 'english', 'writing', dow === 2 ? '小作文 · 限时成文 1 篇' : '大作文 · 限时成文 1 篇', '先列 3 行提纲，再写；写完后只改语法和衔接。', 40, '#english');
  }
  return task(dateKey, 'english', 'translation', '翻译 · 1 段保持手感', '不查词，先译完；对答案时只标结构错误。', 20, '#english');
}

function finalWritingTask(dateKey) {
  const dow = new Date(`${dateKey}T12:00:00`).getDay();
  if (dow === 0) {
    return task(dateKey, 'english', 'writing', '作文 · 本周模板总复盘', '默写小作文框架 + 大作文三段式，检查拼写与衔接。', 40, '#english');
  }
  if (dow % 2 === 0) {
    return task(dateKey, 'english', 'writing', '大作文 · 限时 25 分钟成文', '图表描述 3 句 + 原因 2 句 + 建议 1 句；写完对照自己的模板。', 40, '#english');
  }
  return task(dateKey, 'english', 'writing', '小作文 · 限时 15 分钟成文', '从建议/邀请/投诉/感谢四类中轮换，先写目的句。', 40, '#english');
}

/** 依据日期与阶段生成一天的 170 分钟计划。 */
export function buildPlan(dateKey, profile) {
  const phase = phaseForDate(dateKey, profile);
  const tasks = [];

  if (phase.id === 'foundation') {
    tasks.push(task(dateKey, 'politics', 'choice', '肖1000 · 选择题 35 题', '按章节推进：马原 → 毛中特 → 史纲 → 思修；做完立刻标错因。', 35, '#politics'));
    tasks.push(task(dateKey, 'politics', 'recite', '背诵手册 · 今日 1 个专题', '先口头复述框架，再补关键词；说不清的地方画圈。', 25, '#recite'));
    tasks.push(task(dateKey, 'politics', 'review', '错题回看 · 昨日错题', '遮住答案重做，只记“为什么错”，不抄题干。', 10, '#politics'));
    tasks.push(task(dateKey, 'english', 'vocab', '单词 · 新词 + 复习', '先复习旧词，再推进新词；不会的词只记核心义。', 20, '#english'));
    tasks.push(task(dateKey, 'english', 'reading', '阅读精读 · 2 篇', '限时 18 分钟/篇，做完逐句精读；标同义替换。', 50, '#english'));
    tasks.push(englishSpecial(dateKey, phase.id));
  } else if (phase.id === 'sprint') {
    tasks.push(task(dateKey, 'politics', 'choice', '肖八 / 肖1000 二刷 · 30 题', '选择题限时做，先保证会做的全对，再追求速度。', 30, '#politics'));
    tasks.push(task(dateKey, 'politics', 'review', '肖八错题 + 时政专题', '把错题按章节归类；时政只记可命题的短句。', 25, '#mocks'));
    tasks.push(task(dateKey, 'politics', 'recite', '背诵 · 分析题关键词', '每个专题只背“原理 + 材料关键词 + 方法论”。', 15, '#recite'));
    tasks.push(task(dateKey, 'english', 'vocab', '单词 · 旧词优先', '不贪新词，先把反复忘的词刷熟。', 15, '#english'));
    tasks.push(task(dateKey, 'english', 'reading', '阅读 · 真题 2 篇 + 错因归类', '限时完成后，只精析错题；标出定位句。', 45, '#english'));
    tasks.push(englishSpecial(dateKey, phase.id));
  } else {
    tasks.push(task(dateKey, 'politics', 'choice', '肖四 · 选择题 1 套', '限时 20 分钟；对完答案只回看错题所在知识点。', 25, '#mocks'));
    tasks.push(task(dateKey, 'politics', 'recite', '肖四 · 分析题框架 1 套', '按“点原理—扣材料—讲意义”复述，不逐字背。', 40, '#recite'));
    tasks.push(task(dateKey, 'politics', 'review', '时政 + 错题 · 只扫不新学', '把反复错的知识点过一遍，不再开新资料。', 10, '#politics'));
    tasks.push(task(dateKey, 'english', 'vocab', '单词 · 高频词 10 分钟', '只过高频词和自己的生词本。', 10, '#english'));
    tasks.push(finalWritingTask(dateKey));
    tasks.push(task(dateKey, 'english', 'paper', '真题回看 · 阅读错题 + 同义替换', '回看近 3 年真题错题，保持定位手感。', 25, '#papers'));
    tasks.push(task(dateKey, 'english', 'translation', '翻译 · 1 段保持手感', '不查词，先译完；对答案时只标结构错误。', 20, '#english'));
  }

  const index = Math.abs(diffDays(profile.startDate, dateKey));
  return {
    date: dateKey,
    phase: phase.id,
    tasks,
    target: sum(tasks, (item) => item.minutes),
    guidance: DAILY_REMINDERS[index % DAILY_REMINDERS.length],
    note: '',
    mood: '',
    checkedInAt: null,
    generatedAt: new Date().toISOString(),
  };
}

function starterCard(index, subject, category, front, back, dueOffset, level = 0) {
  return {
    id: `seed_${String(index + 1).padStart(2, '0')}`,
    subject,
    category,
    front,
    back,
    tags: ['内置框架'],
    level,
    lastReviewed: null,
    nextReview: addDays(new Date().toISOString().slice(0, 10), dueOffset),
    reviewedCount: 0,
    createdAt: new Date().toISOString(),
    seeded: true,
  };
}

/** 内置的是“答题框架”，不是押题；可自由编辑、删除。 */
export function starterRecite(today) {
  const base = [
    ['politics', '马原', '矛盾分析法：原理 + 方法论怎么答？', '原理：矛盾具有普遍性与特殊性；主要矛盾与次要矛盾、矛盾的主要方面与次要方面相互影响。\n方法论：坚持两点论与重点论统一，具体问题具体分析。\n落笔：先点原理，再扣材料关键词，最后写方法论。', 0, 0],
    ['politics', '马原', '实践与认识的关系，答题抓哪几句话？', '实践是认识的基础：来源、动力、目的、检验标准。\n认识具有反复性、无限性、上升性。\n真理是具体的、有条件的；坚持真理与价值统一。', 1, 0],
    ['politics', '毛中特', '中国式现代化的答题框架', '五个特征 + 本质要求 + 重大原则。\n考场不要全铺开：按设问选 2–3 个关键词，每个关键词后跟一句材料分析。\n结尾落到“以中国式现代化全面推进中华民族伟大复兴”。', 2, 0],
    ['politics', '史纲', '近代史时间轴：先记节点，再串因果', '1840 鸦片战争 → 1919 五四 → 1921 建党 → 1935 遵义会议 → 1945 抗战胜利 → 1949 新中国成立 → 1978 改革开放 → 2012 新时代。\n每个节点只记“背景—事件—意义”三个词。', 0, 0],
    ['politics', '思修法基', '理想信念 / 人生价值类题目', '是什么：概念与内涵。\n为什么：理论依据 + 现实意义。\n怎么做：国家、社会、个人三个层面，落到青年行动。\n材料里出现“选择、奉献、基层”时优先往人生价值上靠。', 3, 0],
    ['politics', '时政', '时政题“四件套”', '会议名称 / 主题 / 核心提法 / 意义。\n只背能直接成为选项或分析题关键词的短句；不要大段抄新闻。\n考前用一页纸整理当年重大会议与主场外交。', 4, 0],
    ['politics', '马原', '选择题排除法：四种常见陷阱', '绝对化表述；主体错位；因果倒置；时间/阶段错位。\n不确定时，选最贴合材料的一项，而不是“听起来最正确”的一项。', 1, 1],
    ['english', '小作文', '书信类小作文：五句骨架', '称呼 → 目的句 → 主体 2 点 → 礼貌收尾 → 署名。\n准备建议信、邀请信、投诉信、感谢信四套；每套只记 1 个开头 + 1 个结尾，考场上替换关键词。', 0, 0],
    ['english', '大作文', '图表作文：三段式', '第一段：图名 + 总体趋势 + 关键数据对比（3 句）。\n第二段：原因分析（2–3 个因素，先主后次）。\n第三段：结论/建议（1–2 句）。\n不要堆数字，数字只服务于趋势。', 2, 0],
    ['english', '翻译', '翻译得分点：先结构，后润色', '先拆主干（谁 + 做什么 + 对谁），再补修饰。\n专有名词直译；不逐字硬译；最后检查时态、单复数、冠词。\n遇到不会的词，用上位词或解释性表达绕过去。', 3, 0],
    ['english', '阅读方法', '阅读六类错因，分别怎么破？', '细节题：定位 + 同义替换。\n推断题：不选原文原句，选合理延伸。\n主旨题：看首尾段与重复词。\n态度题：抓评价性形容词。\n词义句意：回到上下文。\n时间分配：一篇不超过 20 分钟。', 1, 1],
    ['english', '词汇/短语', '作文高频衔接与功能句', 'What stands out in the chart is that...\nSeveral factors account for this phenomenon.\nIt is advisable that we take effective measures.\nOnly in this way can we...\n用 3–4 个就够，先保证用对。', 4, 0],
    ['english', '小作文', '小作文常见失分点', '称呼与署名格式；目的句不明确；主体只有一句；语气与对象不匹配；超字数或漏要点。\n写完后用 30 秒核对：称呼、目的、2 个要点、收尾、署名。', 2, 0],
    ['english', '阅读方法', '真题复盘只回答三个问题', '这道题为什么错：定位错 / 理解错 / 选项陷阱？\n正确项在原文哪里：划出同义替换。\n下次遇到同类题，我先做什么？\n不抄全文，不整理漂亮笔记。', 5, 0],
  ];
  return base.map((item, index) => {
    const [subject, category, front, back, dueOffset, level] = item;
    const card = starterCard(index, subject, category, front, back, dueOffset, level);
    return {
      ...card,
      nextReview: addDays(today, dueOffset),
      level,
      reviewedCount: 0,
    };
  });
}

export function createMockSets() {
  const sets = {};
  for (let i = 1; i <= 8; i += 1) {
    sets[`8-${i}`] = {
      id: `8-${i}`,
      type: 8,
      number: i,
      date: '',
      score: null,
      minutes: null,
      essayProgress: 0,
      errorTags: [],
      note: '',
      completed: false,
      reviewed: false,
      updatedAt: null,
    };
  }
  for (let i = 1; i <= 4; i += 1) {
    sets[`4-${i}`] = {
      id: `4-${i}`,
      type: 4,
      number: i,
      date: '',
      score: null,
      minutes: null,
      essayProgress: 0,
      errorTags: [],
      note: '',
      completed: false,
      reviewed: false,
      updatedAt: null,
    };
  }
  return sets;
}

export function createPaperRecords() {
  const papers = {};
  for (const year of PAPER_YEARS) {
    papers[String(year)] = {
      year,
      status: 'todo',
      score: null,
      date: '',
      minutes: null,
      readingScore: null,
      translationScore: null,
      writingScore: null,
      note: '',
      reviewed: false,
      updatedAt: null,
    };
  }
  return papers;
}

export function phaseIndex(phaseId) {
  return Math.max(0, PHASES.findIndex((item) => item.id === phaseId));
}

export function dayGreeting(dateKey) {
  const date = new Date(`${dateKey}T12:00:00`);
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 11) return '早上好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

export function weekdayTheme(dateKey) {
  const map = {
    0: '复盘日',
    1: '翻译日',
    2: '作文日',
    3: '翻译日',
    4: '作文日',
    5: '翻译日',
    6: '作文日',
  };
  return map[new Date(`${dateKey}T12:00:00`).getDay()] || '学习日';
}

export { weekdayCN };
