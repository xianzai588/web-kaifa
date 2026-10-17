/* Learning interactions stay on this device. No AI service or analytics calls. */
(() => {
  'use strict';
  const courses = window.LEARNING_CURRICULUM;
  const ai = window.AI_LEARNING_GUIDE;
  const resources = window.LEARNING_RESOURCES;
  const main = document.querySelector('#main');
  const KEY = 'web-kaifa-study-v1';
  const allLessons = Object.entries(courses).flatMap(([track, course]) => course.lessons.map(lesson => ({ ...lesson, track })));
  const byId = Object.assign(Object.create(null), Object.fromEntries(allLessons.map(lesson => [lesson.id, lesson])));
  const knownLesson = id => typeof id === 'string' && Object.hasOwn(byId, id);
  const emptyState = () => ({ version: 1, audience: 'new', activeTrack: 'web', completed: [], checks: {}, quiz: {}, notes: {}, drafts: {}, lastLesson: '', updatedAt: '' });
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  let state = emptyState();
  let storageAvailable = true;
  let recoveredRecord = '';
  let noticeTimer;
  let undoAction;
  let resourceFilter = 'all';
  let promptFilter = 'all';
  let selectedPrompt = ai.prompts[0].id;
  let activeAiLesson = '';
  let aiDraft = { goal: '', code: '', error: '', tried: '', level: 'hint', mode: 'hint' };
  const aiDrafts = new Map();
  let generatedPrompt = '';
  let routeKey = '';
  const safeURL = value => {
    const url = String(value ?? '').trim();
    if (!url || /[\u0000-\u0020\u007f\\]/.test(url) || url.startsWith('//')) return '';
    const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(url);
    try {
      const parsed = new URL(url, location.href);
      if (hasScheme) return ['http:', 'https:', 'mailto:'].includes(parsed.protocol) ? url : '';
      if (['http:', 'https:', 'file:'].includes(parsed.protocol)) return url;
    } catch (error) { return ''; }
    return '';
  };
  window.marked.use({ renderer: {
    html({ text }) { return escape(text); },
    link({ href, tokens }) {
      let ownHref = String(href || '');
      if (/^(\.\.\/){2,3}assets\/downloads\/[\w-]+\.zip$/.test(ownHref)) ownHref = ownHref.replace(/^(\.\.\/)+/, '');
      if (/^(\.\.\/){2,3}index\.html#\//.test(ownHref)) ownHref = ownHref.replace(/^(\.\.\/)+index\.html/, '');
      const url = safeURL(ownHref);
      const label = this.parser.parseInline(tokens);
      return url ? `<a href="${escape(url)}"${url.startsWith('#/')?'':' target="_blank" rel="noopener noreferrer"'}${/^assets\/downloads\/[\w-]+\.zip$/.test(url)?' download':''}>${label}</a>` : label;
    },
    image({ href, text }) {
      const ownPath = String(href || '').replace(/^\.\.\/\.\.\//, '');
      if (!/^assets\/images\/tutorials\/[a-zA-Z0-9_-]+\.(png|jpe?g|webp)$/.test(ownPath)) return `<span>${escape(text)}</span>`;
      return `<a class="tutorial-image" href="${escape(ownPath)}" target="_blank" rel="noopener noreferrer"><img src="${escape(ownPath)}" alt="${escape(text)}" loading="lazy"><span>${escape(text)}（点击查看大图）</span></a>`;
    }
  } });
  function markdown(source) {
    const template = document.createElement('template');
    template.innerHTML = window.marked.parse(source || '', { gfm: true });
    template.content.querySelectorAll('table').forEach(table => {
      const wrapper = document.createElement('div'); wrapper.className = 'table-scroll';
      table.replaceWith(wrapper); wrapper.append(table);
    });
    // Read-only copies of the source checklists must not look like website progress controls.
    template.content.querySelectorAll('input').forEach(input => { input.disabled = true; });
    return template.innerHTML;
  }
  function validateState(value) {
    if (!value || typeof value !== 'object' || value.version !== 1) throw new Error('版本不符');
    const result = emptyState();
    result.audience = value.audience === 'experienced' ? 'experienced' : 'new';
    result.activeTrack = value.activeTrack === 'go' ? 'go' : 'web';
    result.lastLesson = knownLesson(value.lastLesson) ? value.lastLesson : '';
    result.updatedAt = typeof value.updatedAt === 'string' ? value.updatedAt.slice(0, 40) : '';
    for (const lesson of allLessons) {
      const id = lesson.id;
      if (Array.isArray(value.checks?.[id])) result.checks[id] = lesson.checks.map((_, i) => value.checks[id][i] === true);
      if (Number.isInteger(value.quiz?.[id]) && value.quiz[id] >= 0 && value.quiz[id] < lesson.quiz.options.length) result.quiz[id] = value.quiz[id];
      if (typeof value.notes?.[id] === 'string') result.notes[id] = value.notes[id].slice(0, 10000);
      if (typeof value.drafts?.[id] === 'string') result.drafts[id] = value.drafts[id].slice(0, 30000);
    }
    result.completed = Array.isArray(value.completed) ? [...new Set(value.completed.filter(id => knownLesson(id) && isReady(byId[id], result)))] : [];
    return result;
  }
  let savedRecord = '';
  try {
    const saved = localStorage.getItem(KEY); savedRecord = saved || '';
    if (saved) state = validateState(JSON.parse(saved));
    localStorage.setItem(KEY, JSON.stringify(state));
    recoveredRecord = localStorage.getItem(KEY + '-recovery') || '';
  } catch (error) {
    storageAvailable = false;
    recoveredRecord = savedRecord;
    if (savedRecord) {
      try {
        const priorRecovery = localStorage.getItem(KEY + '-recovery');
        if (priorRecovery) recoveredRecord = priorRecovery;
        else localStorage.setItem(KEY + '-recovery', savedRecord);
      } catch (backupError) { /* The raw record remains available in memory for export. */ }
    }
    const note = document.querySelector('#storage-note');
    note.hidden = false;
    note.innerHTML = '当前浏览器无法保存或读取原来的记录。你仍可学习，请到“我的进度”导出备份。' + (recoveredRecord ? ' <button class="button small" data-action="download-recovery">下载异常原记录</button>' : ' 请不要依赖刷新后自动恢复。');
  }
  if (recoveredRecord && storageAvailable) {
    const note = document.querySelector('#storage-note'); note.hidden = false;
    note.innerHTML = '之前有一份无法读取的原记录，已单独保留。 <button class="button small" data-action="download-recovery">下载异常原记录</button>';
  }
  function persist() {
    state.updatedAt = new Date().toISOString();
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (error) {
      storageAvailable = false;
      const note = document.querySelector('#storage-note'); note.hidden = false;
      note.textContent = '记录暂时只能保留在当前页面。请在离开前到“我的进度”导出备份。';
    }
    updateSidebar();
  }
  function isReady(lesson, value = state) {
    return lesson.checks.every((_, i) => value.checks?.[lesson.id]?.[i] === true) && value.quiz?.[lesson.id] === lesson.quiz.answer;
  }
  const isDone = id => state.completed.includes(id);
  const effectiveLesson = id => {
    if (!knownLesson(id)) return undefined;
    const lesson = byId[id];
    if (id === 'go-01' && window.COURSE_BOOK) return { ...lesson, starterCode: window.CourseBook.chapter('go-program').example.files['main.go'] };
    if (id === 'go-02' && state.audience === 'new' && window.LEARNING_ADAPTATIONS?.goBeginner02) return { ...lesson, ...window.LEARNING_ADAPTATIONS.goBeginner02, sourceMarkdown: window.LEARNING_KNOWLEDGE_GUIDES['go-control'].markdown };
    if (id === 'web-12' && window.LEARNING_ADAPTATIONS?.webForm12) return { ...lesson, ...window.LEARNING_ADAPTATIONS.webForm12 };
    const revisedLecture = window.LEARNING_LESSON_GUIDES?.[id];
    if (revisedLecture) return { ...lesson, starterCode: revisedLecture.starterCode, sourceMarkdown: revisedLecture.markdown };
    return lesson;
  };
  const hasRecords = () => state.completed.length || Object.keys(state.checks).length || Object.keys(state.quiz).length || Object.values(state.notes).some(Boolean) || Object.values(state.drafts).some(Boolean);
  const nextLesson = track => courses[track].lessons.find(lesson => !isDone(lesson.id)) || courses[track].lessons[0];
  function updateSidebar() {
    const total = allLessons.length;
    const count = state.completed.length;
    document.querySelector('#side-progress').innerHTML = `<div class="progress-label"><strong>项目练习 ${count} 项已验收</strong><span>${count} / ${total}</span></div><progress value="${count}" max="${total}" aria-label="原项目练习完成进度"></progress>`;
  }
  function notify(message, undo) {
    clearTimeout(noticeTimer); undoAction = undo || null;
    const notice = document.querySelector('#notice');
    notice.innerHTML = `<span>${escape(message)}</span>${undo ? '<button data-action="undo">撤销</button>' : ''}`;
    notice.hidden = false;
    noticeTimer = setTimeout(() => { notice.hidden = true; undoAction = null; }, undo ? 14000 : 4000);
  }
  const copyFeedback = new WeakMap();
  async function copyText(text, button) {
    const previous = button && copyFeedback.get(button);
    const original = previous?.label || button?.textContent;
    if (previous) clearTimeout(previous.timer);
    try {
      let copied = false;
      if (navigator.clipboard?.writeText) {
        try { await navigator.clipboard.writeText(text); copied = true; } catch (_) { /* Try the local-file compatible path below. */ }
      }
      if (!copied) {
        const focused = document.activeElement;
        const area = document.createElement('textarea'); area.value = text; area.style.position = 'fixed'; area.style.left = '-9999px';
        let success;
        try { document.body.append(area); area.select(); success = document.execCommand('copy'); }
        finally { area.remove(); focused?.focus({ preventScroll: true }); }
        if (!success) throw new Error('copy failed');
      }
      if (button) {
        button.textContent = '已复制';
        const timer = setTimeout(() => { if (button.isConnected) button.textContent = original; copyFeedback.delete(button); }, 2200);
        copyFeedback.set(button, { label: original, timer });
      }
    } catch (error) {
      if (button) { button.textContent = original; copyFeedback.delete(button); }
      notify('浏览器没有允许复制。请手动选中要复制的文字，使用 Ctrl+C（Mac 为 Cmd+C）或复制菜单。');
    }
  }
  // Older source excerpts and dynamically rendered prompts share the same copy support.
  // Keep the buttons already owned by the course, setup and knowledge readers.
  function prepareCodeCopies(root) {
    root.querySelectorAll('pre').forEach(pre => {
      if (pre.closest('.code-copy-block') || pre.parentElement.matches('.book-code,.setup-code,.knowledge-code,.go-init-command')) return;
      const wrapper = document.createElement('div'); wrapper.className = 'code-copy-block';
      const button = document.createElement('button'); button.type = 'button'; button.className = 'button small';
      button.dataset.codeCopy = ''; button.textContent = '复制这段内容';
      button.setAttribute('aria-label', '复制下方完整内容');
      pre.replaceWith(wrapper); wrapper.append(button, pre);
    });
  }
  const codeCopyObserver = new MutationObserver(records => {
    // Observe additions only: changing button feedback must not create more controls.
    if (records.some(record => [...record.addedNodes].some(node => node.nodeType === 1 && (node.matches('pre') || node.querySelector('pre'))))) {
      prepareCodeCopies(main); prepareCodeCopies(document.querySelector('#assistant-root'));
    }
  });
  [main, document.querySelector('#assistant-root')].forEach(root => codeCopyObserver.observe(root, { childList: true, subtree: true }));
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-code-copy]');
    if (button) { const pre = button.parentElement.querySelector('pre'); if (pre) copyText(pre.textContent, button); }
  });
  function download(filename, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement('a'); link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const button = (label, href, primary = false) => `<a class="button${primary ? ' primary' : ''}" href="${escape(href)}">${escape(label)}</a>`;
  const trackDescription = track => track === 'go' ? '先学 Go 的变量、函数与数据结构，再把 HTTP、数据库、测试和部署连成一个刷题记录 API。已有编程基础的人可以边验收边补差异。' : courses[track].description;
  const sectionHead = (title, subtitle = '', link = '') => `<div class="section-heading"><h2>${escape(title)}</h2>${subtitle ? `<p>${escape(subtitle)}</p>` : ''}${link}</div>`;
  function pageHeading(title, description) { return `<header class="page-heading"><h1>${escape(title)}</h1><p>${escape(description)}</p></header>`; }
  function sourceLinks() {
    return `<div class="source-links"><a href="materials/web/学习手册.html" target="_blank" rel="noopener">原 Web 互动手册 ↗</a><a href="materials/go/28天互动学习手册.html" target="_blank" rel="noopener">原 Go 互动手册 ↗</a><a href="https://github.com/zhouwu97/web-kaifa" target="_blank" rel="noopener noreferrer">教材与源码 ↗</a></div>`;
  }
  function workflow() {
    return `<div class="workflow">${ai.steps.map((step, i) => `<div><span class="step-n">${i + 1}</span><b>${escape(step.title)}</b><p>${escape(step.description)}</p></div>`).join('')}</div>`;
  }
  function courseCard(track) {
    const course = courses[track];
    const count = course.lessons.filter(lesson => isDone(lesson.id)).length;
    const next = nextLesson(track);
    const description = trackDescription(track);
    return `<article class="course-card ${track}"><header><div class="course-icon" aria-hidden="true">${track === 'web' ? '&lt;/&gt;' : 'Go'}</div><div><h3>${track === 'web' ? 'Web 开发' : 'Go 后端'}</h3><small>${track === 'web' ? '14 节起步课 · 继续前端或全栈路线' : '28 节课 · 从语法到刷题记录 API'}</small></div></header><p>${escape(description)}</p><div class="route-trail">${(track === 'web' ? ['页面结构', '样式布局', '交互与接口'] : ['Go 语言', 'HTTP 与数据库', '测试与交付']).map((item, i) => `${i ? '<span aria-hidden="true">→</span>' : ''}<strong>${escape(item)}</strong>`).join('')}</div><div class="button-row">${button(count === course.lessons.length ? '回顾起步课程' : count ? '继续学习' : '从第 1 课开始', '#/lesson/' + next.id, true)}${button('查看路线', '#/' + track)}<span class="small">${count} / ${course.lessons.length} 节</span></div></article>`;
  }
  function renderHome() {
    const track = state.activeTrack;
    const resuming = state.lastLesson && byId[state.lastLesson]?.track === track && !isDone(state.lastLesson);
    const nextRaw = resuming ? byId[state.lastLesson] : nextLesson(track);
    const next = effectiveLesson(nextRaw.id);
    const label = next.track === 'go' ? 'Go' : 'Web';
    main.innerHTML = `<header class="welcome"><span class="workbook-eyebrow">WEB & GO / 你的开发练习册</span><h1>今天，写一点能运行的代码。</h1><p>选一节课，亲手改动，用结果验证理解。</p></header>
      <div class="start-options"><div class="track-choice"><span>学习方向</span><div class="track-switch" role="group" aria-label="学习方向"><button class="button" data-home-track="web" aria-pressed="${track === 'web'}">Web 开发</button><button class="button" data-home-track="go" aria-pressed="${track === 'go'}">Go 后端</button></div></div><label class="audience-select" for="audience">我的起点<select id="audience"><option value="new"${state.audience === 'new' ? ' selected' : ''}>第一次写代码</option><option value="experienced"${state.audience === 'experienced' ? ' selected' : ''}>写过代码</option></select></label></div>
      <p class="setup-entry">还没准备好工具？<a href="#/setup">安装 VS Code 与配置环境 →</a><a href="#/setup?topic=ask">学会向 AI 提问 →</a></p>
      <section class="home-start"><div><span class="workbook-eyebrow">${resuming ? '接着上次的地方' : '今天，从这里开始'} / ${label} ${String(next.day).padStart(2, '0')}</span><h2>${escape(next.title)}</h2><p>${escape(next.task)}</p><div class="button-row">${button(resuming ? '继续这一课 →' : '进入这一课 →', '#/lesson/' + next.id, true)}<span class="small">约 ${next.minutes} 分钟，可分几次做。</span></div></div><div class="session-steps"><h3>${state.audience === 'new' ? '这一课，你会这样学' : '已有基础，可以这样学'}</h3><ol><li><span>01</span><div>${state.audience === 'new' ? '先读一个概念' : '先看任务与验收'}<small>${state.audience === 'new' ? '带着问题看短例子' : '确认自己能否独立完成'}</small></div></li><li><span>02</span><div>亲手改一处代码<small>预测结果，再运行</small></div></li><li><span>03</span><div>验收并记下发现<small>用实际结果确认掌握</small></div></li></ol></div></section>
      ${sectionHead('把小练习，连成一条路线', '按掌握情况安排，不必赶天数。')}<div class="course-pair">${['web', 'go'].map(key => { const course = courses[key]; const count = course.lessons.filter(item => isDone(item.id)).length; return `<article class="course-card ${key}"><header><h3>${key === 'web' ? 'Web 开发' : 'Go 后端'}</h3><small>${count} / ${course.lessons.length} 节已完成</small></header><p>${key === 'web' ? '页面结构 → 样式布局 → 交互与接口' : 'Go 语言 → HTTP 与数据库 → 测试与交付'}</p>${button('查看课程目录 →', '#/' + key)}</article>`; }).join('')}</div>
      ${window.LearningLab.homeMarkup()}
      <section class="home-method"><div><h2>学会怎样用 AI 开发</h2><p>描述需求 → 拆小任务 → 带证据排错 → 自己验证。</p></div>${button('看看具体怎么做 ↗', '#/ai-method')}</section>
      ${sourceLinks()}`;
  }
  function lessonRow(lesson) {
    lesson = effectiveLesson(lesson.id);
    const done = isDone(lesson.id);
    return `<a class="lesson-row" href="#/lesson/${escape(lesson.id)}"><span class="lesson-day">DAY<br>${String(lesson.day).padStart(2, '0')}</span><div><h3>${escape(lesson.title)}</h3><p>${escape(lesson.summary)}</p></div><span class="lesson-status${done ? ' done' : ''}">${done ? '✓ 已完成' : `约 ${lesson.minutes} 分钟`}</span><span class="arrow" aria-hidden="true">→</span></a>`;
  }
  function renderTrack(track) {
    state.activeTrack = track; persist();
    if (window.CourseBook) {
      main.innerHTML = window.CourseBook.catalogueMarkup(track);
      return;
    }
    const course = courses[track];
    main.innerHTML = pageHeading(track === 'web' ? '从第一张网页开始' : '从一个 Go 程序开始', trackDescription(track))
      + `<div class="callout"><strong>${state.audience === 'new' ? '还没写过代码？' : '已经会一点编程？'}</strong><p>${state.audience === 'new' ? (track === 'web' ? '从第 1 课创建文件和打开页面开始。遇到新词可以直接在 AI 提问台要求解释，一次完成一个动作。' : '先做第 1 课的安装与运行，再学变量、函数和数据结构。Go 教材里的 C++ 对照可以先跳过；没有 C++ 基础也可以按顺序练习。') : (track === 'web' ? '先看每课的动手任务和验收。能独立完成再跳过阅读；布局、浏览器和无障碍仍值得亲手试。' : '优先检查 Go 与已有语言不同的地方：slice 共享、error、接口和并发。通过实际练习后，再进入 HTTP 与数据库。')}</p></div>`
      + window.LearningLab.trackMarkup(track)
      + course.stages.filter(stage => stage.lessonIds.length).map(stage => `<section class="stage"><div class="stage-header"><h2>${escape(stage.title)}</h2><span>${escape(stage.range)}</span></div><p class="stage-description">${escape(stage.description)}</p>${window.LearningLab.stageMarkup(stage.id)}<div class="lesson-list">${stage.lessonIds.map(id => lessonRow(byId[id])).join('')}</div></section>`).join('')
      + (course.followups?.length ? `${sectionHead('起步之后，继续往哪走', '前两周只是开始，后面的教材也在这里')}<div class="followup-grid">${course.followups.map((followup, i) => `<a class="followup-card" href="#/followup/${track}/${i}"><small>${escape(followup.range)}</small><h3>${escape(followup.title)}</h3><p>${escape(followup.description)}</p><span>查看任务与完整讲义 →</span></a>`).join('')}</div>` : `<div class="callout"><strong>把练习连成一个项目</strong><p>第 7 天开始写 HTTP，第 14 天检查持久化 CRUD，第 21 天补上测试和运行说明，第 28 天验收用户隔离与部署。每个阶段都留下真实结果。</p></div>`)
      + sourceLinks();
  }
  function renderFollowup(track, index) {
    const item = courses[track]?.followups?.[index];
    if (!item) return renderMissing();
    const course = courses[track];
    const previousIndex = index === 7 ? 2 : index - 1;
    const previous = index > 0 ? button('← ' + course.followups[previousIndex].title, `#/followup/${track}/${previousIndex}`) : button('← 前两周课程', '#/web');
    const nextIndex = index === 2 ? null : index === 6 || index === 11 ? null : index + 1;
    const continuation = index === 2 ? `${button('进入前端路线 →', '#/followup/web/3', true)}${button('进入全栈路线 →', '#/followup/web/7')}` : nextIndex === null ? button('回到 Web 路线', '#/web') : button(course.followups[nextIndex].title + ' →', `#/followup/${track}/${nextIndex}`, true);
    main.innerHTML = pageHeading(item.title, item.description) + `<div class="lesson-meta"><span>${escape(item.range)}</span><span>按掌握情况安排</span></div><section class="task-box"><h2>这阶段要做什么</h2><p>${escape(item.task)}</p></section>${window.LearningLab.followupGuideMarkup(track, index)}${sectionHead('用实际结果检查学会了什么')}<ul>${item.checks.map(check => `<li>${escape(check)}</li>`).join('')}</ul><p class="small hint">后续阶段不自动计入前14课进度。请在自己的练习目录保存代码与真实验收记录，阅读和复制示例不表示已掌握。</p>${window.LearningLab.followupMarkup(track, index)}<details class="followup-original"><summary>对照原教材的阶段清单</summary><div class="details-body markdown">${markdown(item.sourceSection)}</div></details><section class="followup-next"><h2>接着学哪一阶段</h2><div class="button-row">${previous}${continuation}<button class="button quiet" data-assist-preset="debug">带着本阶段提问 ↗</button></div></section>`;
  }
  function quizMarkup(lesson) {
    const selected = state.quiz[lesson.id];
    const answered = Number.isInteger(selected);
    const correct = selected === lesson.quiz.answer;
    return `<p>${escape(lesson.quiz.question)}</p><div class="quiz-options">${lesson.quiz.options.map((option, i) => `<button class="quiz-option${selected === i ? correct ? ' correct' : ' wrong' : ''}" data-answer="${i}" data-lesson="${lesson.id}" aria-pressed="${selected === i}"><span class="quiz-letter">${String.fromCharCode(65 + i)}</span><span>${escape(option)}</span></button>`).join('')}</div>${answered ? `<div class="quiz-feedback${correct ? '' : ' wrong'}" role="status"><strong>${correct ? '这个判断对了。' : '再想一想。'}</strong> ${escape(lesson.quiz.explanation)}</div>` : '<p class="small hint">先选一个答案，再看解释。它只检查这一个知识点。</p>'}`;
  }
  function renderLesson(id) {
    const lesson = effectiveLesson(id);
    if (!lesson) return renderMissing();
    state.lastLesson = id; state.activeTrack = lesson.track; persist();
    const course = courses[lesson.track];
    const index = course.lessons.findIndex(item => item.id === id);
    const code = state.drafts[id] ?? lesson.starterCode;
    const canPreview = lesson.track === 'web' && ['html', 'css', 'javascript'].includes(lesson.language);
    const firstGoRun = id === 'go-01' ? '<details class="go-first-run"><summary>还没跑通？查看运行前准备</summary><p>打开独立项目，确认 go.mod 与 main.go 在同一目录；保存后在终端运行 go run .。本节先读懂程序结构。</p><div class="go-init-command"><p>新建独立目录且没有模块时，初始化一次：</p><pre id="go-first-init-command"><code>go mod init example.com/learn/hello</code></pre><button class="button small" data-knowledge-copy="go-first-init-command">复制模块初始化命令</button></div><div class="button-row"><a href="#/setup?topic=go&amp;step=module">从创建文件夹到运行，逐步跟做 →</a><a href="#/setup?topic=go&amp;step=missing-module">遇到 go.mod file not found？直接修复 →</a><a href="#/setup?topic=editor&amp;step=module">运行成功后，配置 VS Code →</a></div><p>F5 调试可在学过变量后再做，当前只需 go run . 得到输出。</p></details>' : '';
    main.innerHTML = `<header class="lesson-header"><h1>${escape(lesson.title)}</h1><div class="lesson-meta"><span>${lesson.track === 'web' ? 'Web 开发' : 'Go 后端'} · 第 ${lesson.day} 课</span><span>约 ${lesson.minutes} 分钟，可分几次做</span><span>${isDone(id) ? '✓ 已完成' : '待练习'}</span></div><p>${escape(lesson.summary)}</p><ul class="concept-list">${lesson.concepts.map(item => `<li>${escape(item)}</li>`).join('')}</ul></header>
      ${firstGoRun}${id === 'go-02' && state.audience === 'new' ? '<div class="callout"><strong>没有 C++ 基础也可以做。</strong><p>不用先学另一门语言。直接练习：输入几个分数，用 Go 的循环求总和，用 if 判断是否及格，再试空输入和非法分数。教材中的 C++ 对照可以先跳过。</p></div>' : ''}
      <div class="lesson-grid"><div class="lesson-main"><section class="task-box"><h2>这一课，动手做什么</h2><p>${escape(lesson.task)}</p></section>
      ${window.LearningLab.lessonMarkup(lesson)}
      <section><h2>先理解，再试一试</h2><p>先读讲义中的一个知识点，再修改示例，看结果是否和你预计的一样。</p><details><summary>打开这一课的完整讲义</summary>${id === 'go-02' && state.audience !== 'new' ? '<p class="small hint">原教材含 C++ 对照，仅供学过该语言者参考。写过 Python、Java 或其他语言也可以用熟悉的小题对照；直接阅读上方详细 Go 讲解即可开始。</p>' : ''}<div class="details-body markdown" id="lesson-source">${markdown(lesson.sourceMarkdown)}</div></details><details><summary>卡住了，先看一个提示</summary><div class="details-body hint">${escape(lesson.hint)}</div></details></section>
      ${code || canPreview ? `<section><h2>${canPreview ? '在这里改代码，看真实效果' : '拿到电脑上运行'}</h2><div class="code-panel"><div class="code-tools"><label for="lesson-code">${escape(lesson.language.toUpperCase())} · 可编辑参考片段</label><div class="button-row"><button class="button small" data-action="copy-code">复制代码</button>${canPreview ? '<button class="button small primary" data-action="run-preview">运行预览</button>' : ''}</div></div><textarea class="code-editor" id="lesson-code" spellcheck="false" maxlength="30000" aria-describedby="code-note">${escape(code)}</textarea>${canPreview ? '<div class="preview-label">实际预览 · 在隔离的页面里运行</div><iframe id="code-preview" class="preview-frame" sandbox="allow-scripts" title="当前课程代码的实际预览"></iframe>' : ''}</div><p class="code-note" id="code-note">${canPreview ? '修改后点击“运行预览”。这里只运行网页片段，不能请求外部接口；需要服务器的练习请按讲义在本机运行。' : '这是参考片段，有些需要课程项目的其他文件。Go / SQL 不在本网页执行：先在讲义指定的项目目录保存文件，再运行命令并记录结果。'}</p><button class="button quiet small" data-action="reset-code">恢复课程示例</button></section>` : ''}
      <section id="lesson-quiz"><h2>合上讲义，试着判断</h2><div id="quiz-content">${quizMarkup(lesson)}</div></section>
      <section><h2>用 AI 帮你跨过卡住的地方</h2><p class="small hint">这一课的任务和验收要求会自动带入。写下自己的问题，先要一个线索，试过再继续问。</p>${button('带着这一课去提问', '#/ai?lesson=' + id, true)}</section></div>
      <aside class="lesson-aside"><div class="panel"><h2>做到了，再打勾</h2>${lesson.checks.map((check, i) => `<label class="check-row"><input type="checkbox" data-check="${i}" data-lesson="${id}"${state.checks[id]?.[i] ? ' checked' : ''}><span>${escape(check)}</span></label>`).join('')}<p class="completion-message" id="completion-message">${isDone(id) ? '已记录完成，仍可以回来复习。' : '完成这些验收，再答对小测，就可以记录这节课。'}</p><button id="complete-lesson" class="button primary" data-action="complete-lesson" data-lesson="${id}"${!isReady(lesson) || isDone(id) ? ' disabled' : ''}>${isDone(id) ? '✓ 这一课已完成' : '记录本课完成'}</button><label class="note-label" for="lesson-note">留个自己的解释或问题</label><textarea id="lesson-note" class="note-area" maxlength="10000" placeholder="例如：我改了什么，结果怎样，哪一点还不懂">${escape(state.notes[id] || '')}</textarea><p class="save-note" id="note-status">${storageAvailable ? '内容保存在这个浏览器，可以随进度一起导出。' : '暂存于当前页面，请导出备份。'}</p></div></aside></div>
      <nav class="lesson-bottom" aria-label="课程切换">${index > 0 ? button('← 上一课', '#/lesson/' + course.lessons[index - 1].id) : button('← 课程路线', '#/' + lesson.track)}${index + 1 < course.lessons.length ? button('下一课 →', '#/lesson/' + course.lessons[index + 1].id) : button('回到路线，继续下一阶段', '#/' + lesson.track)}</nav>`;
    if (canPreview) {
      if (state.drafts[id] !== undefined && state.drafts[id] !== lesson.starterCode) {
        document.querySelector('#code-preview').srcdoc = '<meta charset="UTF-8"><p style="font:16px/1.7 sans-serif;padding:16px">上次编辑的代码已恢复。检查后点击“运行预览”；也可以先恢复课程示例。</p>';
      } else runPreview(lesson);
    }
    window.Workbench.mountLesson(lesson);
    window.ReaderLayout.refresh('lesson');
  }
  function runPreview(lesson) {
    const editor = document.querySelector('#lesson-code');
    const frame = document.querySelector('#code-preview');
    if (!editor || !frame) return;
    const code = editor.value;
    const baseHTML = window.LEARNING_ADAPTATIONS?.webPreviews?.[lesson.id] || '<h1>我的第一张网页</h1><p>把代码改一点，看看发生了什么。</p><button id="add">新增一项</button><ul id="list"><li>第一条记录</li></ul><div id="result"></div><section class="cards"><article class="card"><h2>活动一</h2><p>周六一起练习</p></article><article class="card"><h2>活动二</h2><p>带上自己的代码</p></article></section>';
    let body;
    if (lesson.language === 'css') body = `<style>${code}</style>${baseHTML}`;
    else if (lesson.language === 'javascript') body = `${baseHTML}<script>${code.replace(/<\/script/gi, '<\\/script')}<\/script>`;
    else body = code;
    frame.srcdoc = `<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; form-action 'none';"><style>body{font-family:sans-serif;padding:16px;line-height:1.6;overflow-wrap:anywhere}img{max-width:100%}button{padding:8px 12px}section{margin-block:16px}</style>${body}`;
    state.drafts[lesson.id] = code; persist();
  }
  const helpModes = {
    hint: { title: '我想自己做，先给一个线索', instruction: '先给我一个检查点和一个问题，不直接写完整答案。等我说出尝试结果，再按需要增加提示。' },
    concept: { title: '把一个概念讲清楚', instruction: '先检查我的理解，用一个短例子解释。遇到新术语先解释，再让我预测代码结果，最后给一道变式；不要先给变式答案。' },
    debug: { title: '一起定位报错', instruction: '根据预期、实际结果和完整报错定位原因。先给一个能验证的猜测和检查步骤；证据不足时问我缺什么。一次只改一处，不重写整个项目。' },
    review: { title: '检查我写的代码', instruction: '指出可以复现的问题、具体位置、影响和最小修改建议。区分确定的问题和需要上下文的问题。没有运行测试就明确说未运行，不要引入当前练习不需要的框架。' },
    quiz: { title: '出题检查我理解了没有', instruction: '一次只出一道题，先等我回答，再反馈。包含预测行为、解释原因和一个边界条件。答错先给提示，不先贴答案，不把一次答对说成完全掌握。' },
    plan: { title: '把项目拆到今天能开工', instruction: '最多拆成四个有依赖顺序的小任务，每个写清输入、预期结果和一个验证动作。只展开第一步，先让我提出做法；别生成整个项目，也不要把计划写成已实现。' },
    rewrite: { title: '检查我能不能独立复写', instruction: '检查我的解释与代码是否一致。先给追问或反例，不直接替我改；再给一道只改变一个条件的练习，等我完成后再反馈。' }
  };
  function modeFromTemplate(id) {
    if (id.startsWith('concept')) return 'concept';
    if (id.startsWith('debug')) return 'debug';
    if (id.startsWith('review')) return 'review';
    if (id.startsWith('quiz')) return 'quiz';
    if (id.startsWith('project')) return 'plan';
    if (id.startsWith('rewrite')) return 'rewrite';
    return 'hint';
  }
  function buildPrompt() {
    const lesson = effectiveLesson(activeAiLesson);
    const mode = helpModes[aiDraft.mode] || helpModes.hint;
    const lines = [state.audience === 'new' ? '我刚开始学编程。遇到新词，请先解释；涉及操作时告诉我在哪个文件修改、命令在哪里输入，一次给一个动作。' : '我有一点编程基础，正在学习新的方向。请围绕我给出的代码和问题帮我理解，不默认我已经熟悉这门语言。', '', mode.instruction, ''];
    if (lesson) lines.push(`正在学习：${lesson.track === 'web' ? 'Web' : 'Go'} 第 ${lesson.day} 课：${lesson.title}`, `本课目标：${lesson.task}`, `需要验证：${lesson.checks.join('；')}`, '');
    lines.push(`我想做到 / 卡住的地方：${aiDraft.goal.trim() || '【写下你想实现什么，或具体哪一步不懂】'}`);
    if (aiDraft.code.trim()) lines.push('', '我的代码：', aiDraft.code.trim());
    if (aiDraft.error.trim()) lines.push('', '屏幕上的完整报错 / 实际结果：', aiDraft.error.trim());
    lines.push('', `我已经试过：${aiDraft.tried.trim() || '【还没开始也可以写；已经尝试的做法和结果请写清楚】'}`);
    lines.push('', `这次需要：${{ hint: '先给一个线索，等我尝试后再继续。', check: '带我检查下一步，说明怎样确认判断。', example: '可以给一个最小例子，但先让我预测结果，再解释。' }[aiDraft.level]}`);
    lines.push('提到 API 或版本时给出官方文档出处，不确定的地方请直接说明。最后告诉我一个可以在自己电脑上做的验证动作。');
    return lines.join('\n');
  }
  function selectAiLesson(id) {
    const newId = knownLesson(id) ? id : '';
    if (newId === activeAiLesson) return;
    aiDrafts.set(activeAiLesson || 'custom', { ...aiDraft });
    activeAiLesson = newId;
    aiDraft = aiDrafts.get(newId || 'custom') || {
      goal: state.notes[newId] || '',
      code: state.drafts[newId] && state.drafts[newId] !== effectiveLesson(newId)?.starterCode ? state.drafts[newId] : '',
      error: '', tried: '', level: 'hint', mode: aiDraft.mode
    };
  }
  function syncAIForm() {
    for (const field of ['goal', 'code', 'error', 'tried', 'mode', 'level']) {
      const input = document.querySelector('#ai-' + field); if (input) input.value = aiDraft[field];
    }
    const lessonSelect = document.querySelector('#ai-lesson'); if (lessonSelect) lessonSelect.value = activeAiLesson;
    updatePrompt();
  }
  function updatePrompt() {
    generatedPrompt = buildPrompt();
    const output = document.querySelector('#generated-prompt');
    if (output) output.textContent = generatedPrompt;
  }
  function renderAI(params) {
    if (params.has('lesson')) {
      selectAiLesson(params.get('lesson'));
    }
    if (params.has('mode') && helpModes[params.get('mode')]) aiDraft.mode = params.get('mode');
    if (params.has('template')) {
      const template = ai.prompts.find(item => item.id === params.get('template'));
      if (template) { selectedPrompt = template.id; aiDraft.mode = modeFromTemplate(template.id); aiDraft.goal = template.prompt.split('\n')[0]; }
    }
    generatedPrompt = buildPrompt();
    main.innerHTML = pageHeading('学到哪儿，问到哪儿', '选一节课，写下想做的事。这里帮你整理提问，复制到你正在用的 AI 工具里。')
      + `<div class="callout"><strong>回答要回到你的代码里验证。</strong><p>先留一版自己的尝试，拿到提示后改一处、试一次。这个页面不会调用 AI，也不会把代码发送出去。</p></div><section class="ai-layout"><form class="panel" id="ai-form"><div class="field"><label for="ai-lesson">正在学哪一节（可选）</label><select id="ai-lesson"><option value="">我有自己的问题</option>${Object.entries(courses).map(([track, course]) => `<optgroup label="${track === 'web' ? 'Web 开发' : 'Go 后端'}">${course.lessons.map(lesson => `<option value="${lesson.id}"${activeAiLesson === lesson.id ? ' selected' : ''}>第 ${lesson.day} 课 · ${escape(effectiveLesson(lesson.id).title)}</option>`).join('')}</optgroup>`).join('')}</select></div><div class="field"><label for="ai-mode">希望 AI 怎样帮忙</label><select id="ai-mode">${Object.entries(helpModes).map(([key, item]) => `<option value="${key}"${aiDraft.mode === key ? ' selected' : ''}>${escape(item.title)}</option>`).join('')}</select></div><div class="field"><label for="ai-goal">想做到什么，或哪一步卡住了</label><textarea id="ai-goal" maxlength="4000" placeholder="例如：点击按钮后想新增一行，但页面没有变化">${escape(aiDraft.goal)}</textarea></div><details><summary>补上代码、报错和尝试（有就写）</summary><div class="details-body"><div class="field"><label for="ai-code">我的代码（可选）</label><textarea id="ai-code" maxlength="15000" spellcheck="false">${escape(aiDraft.code)}</textarea></div><div class="field"><label for="ai-error">完整报错 / 实际结果（可选）</label><textarea id="ai-error" maxlength="6000">${escape(aiDraft.error)}</textarea><p class="field-help">复制报错原文比只写“出错了”更容易排查。先去掉密码、令牌等个人信息。</p></div><div class="field"><label for="ai-tried">我试过什么（还没开始也可以写）</label><textarea id="ai-tried" maxlength="4000">${escape(aiDraft.tried)}</textarea></div></div></details><div class="field"><label for="ai-level">提示给到哪一步</label><select id="ai-level"><option value="hint"${aiDraft.level === 'hint' ? ' selected' : ''}>给我一个线索</option><option value="check"${aiDraft.level === 'check' ? ' selected' : ''}>带我检查下一步</option><option value="example"${aiDraft.level === 'example' ? ' selected' : ''}>看一个最小示例</option></select></div><button class="button primary" type="submit">整理提问</button></form><div class="prompt-output"><header><h2>这段可以发给 AI</h2><button class="button" data-action="copy-prompt">复制提问</button></header><pre id="generated-prompt">${escape(generatedPrompt)}</pre><p class="prompt-why">方括号里的内容需要你补全。先要一个提示，试过之后再追问。</p><h3 style="margin-top:20px">拿到回答以后</h3><ol class="small"><li>自己改一处，重复刚才的操作。</li><li>换个输入或屏幕宽度，检查边界。</li><li>合上答案，解释并复写关键部分。</li></ol></div></section>`
      + sectionHead('常见场景，拿来改一改', '具体模板适合已经开始写对应练习的人')
      + `<div class="filters" aria-label="提示模板筛选">${filterButtons('prompt', promptFilter)}</div><div id="template-list" class="template-list">${templatesMarkup()}</div>`
      + sectionHead('这样用 AI，比较容易学到东西') + workflow()
      + sectionHead('几件容易绕进去的事') + `<div class="pitfalls">${ai.pitfalls.map(item => `<div><h3>${escape(item.title)}</h3><p>${escape(item.description)}</p></div>`).join('')}</div>`
      + `<details><summary>我能独立完成了吗？检查这几项</summary><div class="details-body"><ul>${ai.selfCheck.map(item => `<li>${escape(item)}</li>`).join('')}</ul></div></details><div class="source-links">${ai.sources.map(source => `<a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(source.title)} ↗</a>`).join('')}</div>`;
  }
  function filterButtons(kind, selected) {
    return Object.entries({ all: '全部', web: 'Web', go: 'Go', shared: '通用' }).map(([key, title]) => `<button class="filter-button" data-filter="${kind}" data-value="${key}" aria-pressed="${selected === key}">${title}</button>`).join('');
  }
  function templatesMarkup() {
    return ai.prompts.filter(item => promptFilter === 'all' || item.track === promptFilter).map(item => `<article class="template-item"><h3>${escape(item.title)}</h3><p>${escape(item.scenario)}</p><div class="button-row"><button class="button small" data-template="${item.id}">带入提问台</button><button class="button quiet small" data-copy-template="${item.id}">复制原模板</button></div><details><summary>看完整模板与使用方法</summary><div class="details-body"><pre>${escape(item.prompt)}</pre><p class="small">${escape(item.why)}</p><p class="small"><strong>下一步：</strong>${escape(item.nextStep)}</p></div></details></article>`).join('');
  }
  function resourcesMarkup() {
    return resources.filter(item => resourceFilter === 'all' || item.track === resourceFilter).map(item => `<a class="resource" href="${escape(item.url)}" target="_blank" rel="noopener noreferrer"><h2>${escape(item.title)} <span aria-hidden="true">↗</span></h2><p>${escape(item.description)}</p><small>${escape(item.stage)} · ${escape(item.language)} · ${item.track === 'go' ? 'Go' : item.track === 'web' ? 'Web' : '通用'}</small></a>`).join('');
  }
  function renderResources() {
    main.innerHTML = pageHeading('要查的时候，有地方查', '官方文档用来核对概念，社区课程与练习站点用来找任务。按当前问题选一份资料，再把结果带回自己的代码。')
      + `<div class="filters" aria-label="资料筛选">${filterButtons('resource', resourceFilter)}</div><div id="resource-list" class="resource-list">${resourcesMarkup()}</div><div class="callout"><strong>查资料时看清环境。</strong><p>Go 官方数据库教程使用 MySQL，本站课程项目使用 PostgreSQL；驱动、占位符与配置需要对应。GitHub Pages 只运行静态网页，Go API 要在本机或另一台服务器启动。</p></div><p class="small hint">入口核验于 2026-10-12。第三方页面和工具版本可能继续更新，使用时留意当前官方说明。</p>${sourceLinks()}`;
  }
  function renderProgress() {
    const records = allLessons.filter(lesson => state.notes[lesson.id] || isDone(lesson.id));
    main.innerHTML = pageHeading('留下自己做过的事', '完成验收和小测后，由你主动记录完成。复制提示、看过答案，都不会自动算成掌握。')
      + `<div class="progress-overview">${Object.entries(courses).map(([track, course]) => { const count = course.lessons.filter(lesson => isDone(lesson.id)).length; return `<section class="panel"><h2>${track === 'web' ? 'Web 起步课' : 'Go 后端'}</h2><p><strong>${count} <small>/ ${course.lessons.length} 节</small></strong></p><progress value="${count}" max="${course.lessons.length}" aria-label="${track}完成进度"></progress>${button(count === course.lessons.length ? '回顾起步课程' : '继续下一课', '#/lesson/' + nextLesson(track).id)}</section>`; }).join('')}</div><section class="backup-panel"><h2>换电脑前，把记录带走</h2><p>进度、课内笔记和编辑过的代码保存在这个浏览器。导出 JSON 后，可以在另一台电脑导入；导出 Markdown 方便保存到仓库。原互动手册的勾选记录与这里分开保存。</p><div class="button-row"><button class="button primary" data-action="export-json">导出完整记录</button><button class="button" data-action="export-markdown">导出 Markdown</button><label class="button file-label">导入 JSON<input id="import-progress" type="file" accept=".json,application/json" aria-label="导入完整学习记录 JSON"></label></div><p class="small" id="import-status" role="status"></p></section>${sectionHead('我的复盘与完成记录')}${records.length ? records.map(lesson => `<article class="progress-entry"><header><a href="#/lesson/${lesson.id}">${escape(lesson.title)}</a><span class="small">${isDone(lesson.id) ? '✓ 已完成' : '有笔记，继续练习'}</span></header>${state.notes[lesson.id] ? `<p class="note-preview">${escape(state.notes[lesson.id])}</p>` : '<p class="small hint">还没有复盘，可以回到课内留一段自己的解释。</p>'}</article>`).join('') : `<div class="empty-state"><h2>还没有记录，先写一点</h2><p>从第一节开始，动手后记下结果和一个问题。完成记录会出现在这里。</p>${button('进入 Web 第 1 课', '#/lesson/web-01', true)}</div>`}<div class="button-row" style="margin-top:32px"><button class="button danger" data-action="reset-progress">清空本网站记录</button><span class="small hint">可以立即撤销；重要记录请先导出。</span></div>`;
  }
  function renderSearch(query) {
    const normalized = query.trim().toLowerCase();
    const results = normalized ? allLessons.map(lesson => effectiveLesson(lesson.id)).filter(lesson => [lesson.title, lesson.summary, lesson.task, ...lesson.concepts, lesson.sourceMarkdown].join(' ').toLowerCase().includes(normalized)) : [];
    const labResults = window.LearningLab.search(normalized);
    const setupResults = window.GettingStarted.search(normalized);
    const followups = normalized ? courses.web.followups.map((item, index) => ({...item, index})).filter(item => [item.title, item.range, item.task, window.LEARNING_FOLLOWUP_GUIDES?.['web-' + String(item.index).padStart(2, '0')]?.markdown].filter(Boolean).join(' ').toLowerCase().includes(normalized)) : [];
    const bookResults = window.CourseBook?.searchMarkup(normalized) || '';
    const hasResults = results.length || labResults.topics.length || labResults.exercises.length || setupResults.length || followups.length || bookResults;
    main.innerHTML = pageHeading(normalized ? `查找“${query.slice(0, 60)}”` : '先写一个想找的词', normalized ? `找到 ${results.length} 节课程、${followups.length} 个后续阶段、${labResults.topics.length} 个知识主题、${labResults.exercises.length} 个练习、${setupResults.length} 篇起步教程。` : '可以搜索 HTML、切片、HTTP、测试或数据库。')
      + (results.length ? `<section><h2>相关课程 · ${results.length}</h2><div class="lesson-list">${results.map(lessonRow).join('')}</div></section>` : hasResults ? '' : `<div class="empty-state"><h2>${normalized ? '换个词再找找' : '课程也可以按路线找'}</h2><p>${normalized ? '试试更短的词，例如“表单”“error”或“SQL”。上方搜索框随时可以重试。' : 'Web 和 Go 路线里有全部课程。'}</p><div class="button-row">${button('Web 路线', '#/web', true)}${button('Go 路线', '#/go')}</div></div>`)
      + bookResults + (followups.length ? `<section class="followup-search-results"><h2>后续阶段 · ${followups.length}</h2><div class="followup-grid">${followups.map(item => `<a class="followup-card" href="#/followup/web/${item.index}"><small>${escape(item.range)}</small><h3>${escape(item.title)}</h3><p>${escape(item.description)}</p><span>学习讲解与完整示例 →</span></a>`).join('')}</div></section>` : '') + window.LearningLab.searchMarkup(normalized) + window.GettingStarted.searchMarkup(normalized);
  }
  function renderMissing() {
    main.innerHTML = pageHeading('这里还没有这节课', '链接可能不完整，先回路线中找找。') + `<div class="button-row">${button('Web 路线', '#/web', true)}${button('Go 路线', '#/go')}</div>`;
  }
  function updateCompletion(id) {
    const lesson = byId[id];
    const ready = isReady(lesson);
    if (!ready && isDone(id)) state.completed = state.completed.filter(item => item !== id);
    const control = document.querySelector('#complete-lesson');
    if (control) {
      control.disabled = !ready || isDone(id);
      control.textContent = isDone(id) ? '✓ 这一课已完成' : '记录本课完成';
      document.querySelector('#completion-message').textContent = isDone(id) ? '已记录完成，仍可以回来复习。' : ready ? '验收和小测已勾好，由你决定是否记录完成。' : '完成这些验收，再答对小测，就可以记录这节课。';
    }
    persist();
    window.Workbench.refreshProgress(id);
  }
  function exportMarkdown() {
    const lines = ['# 我的 Web / Go 学习记录', '', `导出时间：${new Date().toLocaleString('zh-CN')}`, ''];
    for (const [track, course] of Object.entries(courses)) {
      lines.push(`## ${track === 'web' ? 'Web 起步课' : 'Go 后端'}`, '');
      for (const lesson of course.lessons) {
        lines.push(`- [${isDone(lesson.id) ? 'x' : ' '}] 第 ${lesson.day} 课：${lesson.title}`);
        if (state.notes[lesson.id]) lines.push('', `### 第 ${lesson.day} 课复盘`, '', state.notes[lesson.id], '');
      }
      lines.push('');
    }
    lines.push('完整代码草稿与小测记录请另存 JSON 备份。', '');
    download('web-go-learning-notes.md', lines.join('\n'), 'text/markdown;charset=utf-8');
  }
  async function importProgress(file) {
    const status = document.querySelector('#import-status');
    try {
      if (!file || file.size > 10000000) throw new Error('文件过大或为空');
      const data = JSON.parse(await file.text());
      if (data.type !== 'web-kaifa-progress' || data.version !== 1) throw new Error('这不是本网站导出的文件');
      const imported = validateState(data.state);
      const previous = structuredClone(state); state = imported; persist(); renderProgress();
      document.querySelector('#import-status').textContent = '已导入记录。原来的记录可以用下方“撤销”恢复。';
      notify('学习记录已导入。', () => { state = previous; persist(); renderProgress(); });
    } catch (error) {
      if (status) status.textContent = '没有导入：请选用“导出完整记录”生成的 JSON（不超过 10 MB）。当前记录没有改变。';
    }
  }
  let renderedBookPath;
  function route() {
    const raw = location.hash.replace(/^#\/?/, '') || 'home';
    const [path, query = ''] = raw.split('?');
    const parts = path.split('/');
    const params = new URLSearchParams(query);
    const bookRoute=window.CourseBook.routeInfo();
    if(bookRoute&&bookRoute.path===renderedBookPath){
      window.CourseBook.refreshDirectory();
      return;
    }
    renderedBookPath=bookRoute?.path;
    routeKey = parts[0];
    const nav = routeKey === 'lesson' ? byId[parts[1]]?.track : ['followup','learn'].includes(routeKey) ? parts[1] : routeKey === 'topic' ? 'knowledge' : routeKey === 'exercise' ? 'practice' : routeKey;
    document.querySelectorAll('[data-nav]').forEach(link => {
      if (link.dataset.nav === nav) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
    const titles = { home: '开始学习', web: 'Web 开发', go: 'Go 后端', knowledge: '知识地图', practice: '练习工坊', ai: 'AI 提问台', 'ai-method': '怎样用 AI 开发', resources: '资料与参考', progress: '我的进度', search: '查找学习内容' };
    titles.setup = '安装与起步教程';
    titles.learn = window.CourseBook?.chapter(parts[2])?.title || '系统教程';
    const labDetail = routeKey === 'topic' ? window.LEARNING_LAB.topics.find(item => item.id === parts[1]) : routeKey === 'exercise' ? window.LEARNING_LAB.exercises.find(item => item.id === parts[1]) : null;
    document.querySelector('#breadcrumb').innerHTML = routeKey === 'lesson' || routeKey === 'followup' ? `<a href="#/${nav || 'home'}">${nav === 'go' ? 'Go 后端' : 'Web 开发'}</a> / ${routeKey === 'lesson' ? '课内练习' : '后续阶段'}` : labDetail ? `<a href="#/${nav}">${titles[nav]}</a> / ${routeKey === 'topic' ? '概念讲解' : '练习任务'}` : escape(titles[routeKey] || '开始学习');
    document.title = `${routeKey === 'lesson' && knownLesson(parts[1]) ? effectiveLesson(parts[1]).title : labDetail?.title || titles[routeKey] || '开发练习册'} · 开发练习册`;
    if (routeKey === 'home') renderHome();
    else if (routeKey === 'setup') main.innerHTML = window.GettingStarted.markup(params);
    else if (routeKey === 'learn') {
      const content=window.CourseBook.chapterMarkup(parts[1],parts[2]);
      if(content===null)renderMissing();else main.innerHTML=content;
    }
    else if (routeKey === 'web' || routeKey === 'go') renderTrack(routeKey);
    else if (routeKey === 'lesson') renderLesson(parts[1]);
    else if (routeKey === 'followup') renderFollowup(parts[1], Number(parts[2]));
    else if (routeKey === 'knowledge' || routeKey === 'practice') main.innerHTML = window.LearningLab.catalogueMarkup(routeKey, params);
    else if (routeKey === 'topic' || routeKey === 'exercise') {
      const content = routeKey === 'topic' ? window.LearningLab.topicMarkup(parts[1]) : window.LearningLab.exerciseMarkup(parts[1]);
      if (content === null) renderMissing(); else main.innerHTML = content;
    }
    else if (routeKey === 'ai') renderAI(params);
    else if (routeKey === 'ai-method') main.innerHTML = window.Workbench.methodPage();
    else if (routeKey === 'resources') renderResources();
    else if (routeKey === 'progress') renderProgress();
    else if (routeKey === 'search') renderSearch(params.get('q') || '');
    else renderMissing();
    document.querySelector('#sidebar').dataset.open = 'false';
    document.querySelector('#menu-toggle').setAttribute('aria-expanded', 'false');
    const readingMenu=bookRoute || routeKey === 'lesson' && knownLesson(parts[1]);
    document.querySelector('#menu-toggle').setAttribute('aria-label', readingMenu?'展开阅读目录':'展开导航');
    document.querySelector('#menu-toggle').textContent=readingMenu?'目录':'☰';
    window.scrollTo({ top: 0, behavior: 'instant' });
    main.focus({ preventScroll: true });
    updateSidebar();
    window.Workbench.routeChanged(routeKey, routeKey === 'lesson' && knownLesson(parts[1]) ? effectiveLesson(parts[1]) : null);
    if (routeKey !== 'lesson' || !knownLesson(parts[1])) window.ReaderLayout.refresh(routeKey);
    if (routeKey === 'setup') window.GettingStarted.focusRequested(params);
  }
  document.querySelector('.skip-link').addEventListener('click', event => {
    event.preventDefault();
    main.focus({ preventScroll: true });
    main.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  document.querySelector('#menu-toggle').addEventListener('click', () => {
    const sidebar = document.querySelector('#sidebar');
    const open = sidebar.dataset.open !== 'true'; sidebar.dataset.open = String(open);
    document.querySelector('#menu-toggle').setAttribute('aria-expanded', String(open));
    const reading=document.body.classList.contains('reading-view');
    document.querySelector('#menu-toggle').setAttribute('aria-label', reading?(open?'收起阅读目录':'展开阅读目录'):(open?'收起导航':'展开导航'));
  });
  document.querySelector('#search-form').addEventListener('submit', event => {
    event.preventDefault(); location.hash = '/search?q=' + encodeURIComponent(document.querySelector('#global-search').value.trim().slice(0, 200));
  });
  document.addEventListener('keydown', event => {
    if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) { event.preventDefault(); document.querySelector('#global-search').focus(); }
    if (event.key === 'Escape') {
      const sidebar = document.querySelector('#sidebar');
      const toggle = document.querySelector('#menu-toggle');
      if (sidebar.dataset.open === 'true' && sidebar.contains(document.activeElement)) toggle.focus();
      sidebar.dataset.open = 'false';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', document.body.classList.contains('reading-view')?'展开阅读目录':'展开导航');
    }
  });
  document.addEventListener('change', event => {
    const target = event.target;
    if (target.id === 'audience') { state.audience = target.value === 'experienced' ? 'experienced' : 'new'; persist(); renderHome(); document.querySelector('#audience').focus({ preventScroll: true }); }
    if (target.matches('[data-check]')) {
      const id = target.dataset.lesson;
      state.checks[id] ||= byId[id].checks.map(() => false);
      state.checks[id][Number(target.dataset.check)] = target.checked;
      updateCompletion(id);
    }
    if (target.id === 'ai-lesson') { selectAiLesson(target.value); syncAIForm(); }
    if (target.id === 'ai-mode') { aiDraft.mode = target.value; updatePrompt(); }
    if (target.id === 'ai-level') { aiDraft.level = target.value; updatePrompt(); }
    if (target.id === 'import-progress') importProgress(target.files?.[0]);
  });
  document.addEventListener('input', event => {
    const target = event.target;
    if (target.id === 'lesson-note' && byId[state.lastLesson]) {
      state.notes[state.lastLesson] = target.value; persist();
      document.querySelector('#note-status').textContent = storageAvailable ? '已保存在这个浏览器。' : '暂存于当前页面，请导出备份。';
    }
    if (target.id === 'lesson-code' && byId[state.lastLesson]) { state.drafts[state.lastLesson] = target.value; persist(); }
    const fields = { 'ai-goal': 'goal', 'ai-code': 'code', 'ai-error': 'error', 'ai-tried': 'tried' };
    if (fields[target.id]) { aiDraft[fields[target.id]] = target.value; updatePrompt(); }
  });
  document.addEventListener('submit', event => {
    if (event.target.id === 'ai-form') { event.preventDefault(); updatePrompt(); const submit = event.target.querySelector('[type="submit"]'); submit.textContent = '已整理，可复制'; setTimeout(() => { if (submit.isConnected) submit.textContent = '整理提问'; }, 2200); }
  });
  document.addEventListener('click', async event => {
    const target = event.target.closest('button');
    if (target?.dataset.homeTrack) {
      state.activeTrack = target.dataset.homeTrack === 'go' ? 'go' : 'web';
      persist(); renderHome();
      document.querySelector(`[data-home-track="${state.activeTrack}"]`).focus({ preventScroll: true });
      return;
    }
    if (!target || target.disabled) return;
    if (target.dataset.answer !== undefined) {
      const id = target.dataset.lesson; state.quiz[id] = Number(target.dataset.answer);
      document.querySelector('#quiz-content').innerHTML = quizMarkup(byId[id]); updateCompletion(id);
      document.querySelector(`[data-answer="${state.quiz[id]}"]`)?.focus({ preventScroll: true });
    }
    if (target.dataset.filter) {
      const value = target.dataset.value;
      if (target.dataset.filter === 'resource') { resourceFilter = value; document.querySelector('#resource-list').innerHTML = resourcesMarkup(); }
      else { promptFilter = value; document.querySelector('#template-list').innerHTML = templatesMarkup(); }
      target.parentElement.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button === target)));
    }
    if (target.dataset.template) {
      const template = ai.prompts.find(item => item.id === target.dataset.template);
      if (template) {
        if (activeAiLesson && template.track !== 'shared' && byId[activeAiLesson].track !== template.track) selectAiLesson('');
        selectedPrompt = template.id; aiDraft.mode = modeFromTemplate(template.id); aiDraft.goal = template.prompt.split('\n')[0];
        syncAIForm();
        updatePrompt(); document.querySelector('#ai-form').scrollIntoView({ behavior: 'smooth', block: 'start' }); document.querySelector('#ai-goal').focus({ preventScroll: true });
      }
    }
    if (target.dataset.copyTemplate) { const template = ai.prompts.find(item => item.id === target.dataset.copyTemplate); if (template) await copyText(template.prompt, target); }
    const action = target.dataset.action;
    if (action === 'copy-code') await copyText(document.querySelector('#lesson-code').value, target);
    if (action === 'run-preview') runPreview(effectiveLesson(state.lastLesson));
    if (action === 'copy-prompt') await copyText(generatedPrompt, target);
    if (action === 'reset-code') {
      const id = state.lastLesson; const prior = state.drafts[id];
      const lesson = effectiveLesson(id);
      state.drafts[id] = lesson.starterCode; document.querySelector('#lesson-code').value = lesson.starterCode; persist();
      if (document.querySelector('#code-preview')) runPreview(lesson);
      notify('已恢复课程示例。', () => { if (prior === undefined) delete state.drafts[id]; else state.drafts[id] = prior; persist(); if (routeKey === 'lesson' && state.lastLesson === id) renderLesson(id); });
    }
    if (action === 'complete-lesson' && isReady(byId[target.dataset.lesson])) { state.completed = [...new Set([...state.completed, target.dataset.lesson])]; persist(); renderLesson(target.dataset.lesson); }
    if (action === 'export-json') download('web-kaifa-progress.json', JSON.stringify({ type: 'web-kaifa-progress', version: 1, exportedAt: new Date().toISOString(), state }, null, 2), 'application/json');
    if (action === 'export-markdown') exportMarkdown();
    if (action === 'download-recovery' && recoveredRecord) download('web-kaifa-recovery-original.json', recoveredRecord, 'application/json');
    if (action === 'reset-progress' && hasRecords()) {
      const previous = structuredClone(state); const audience = state.audience; const track = state.activeTrack;
      state = emptyState(); state.audience = audience; state.activeTrack = track; persist(); renderProgress();
      notify('已清空本网站记录，原互动手册不受影响。', () => { state = previous; persist(); renderProgress(); });
    }
    if (action === 'undo' && undoAction) { const undo = undoAction; undoAction = null; undo(); document.querySelector('#notice').hidden = true; clearTimeout(noticeTimer); }
  });
  window.Workbench.configure({ copy: copyText, lesson: effectiveLesson, draft: id => state.drafts[id], completed: () => [...state.completed] });
  window.LearningLab.configure({ copy: copyText, markdown });
  window.GettingStarted.configure({ copy: copyText, markdown });
  window.CourseBook.configure({ copy: copyText, markdown });
  window.addEventListener('hashchange', route);
  route();
})();
