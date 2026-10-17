/* Supplementary learning views. This module never writes learning progress or executes drafts. */
(() => {
  'use strict';
  const data = window.LEARNING_LAB;
  const topics = new Map(data.topics.map(item => [item.id, item]));
  const exercises = new Map(data.exercises.map(item => [item.id, item]));
  const sources = new Map(data.sources.map(item => [item.id, item]));
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const trackLabel = track => track === 'web' ? 'Web' : 'Go';
  const levels = { foundation: '基础', applied: '应用', project: '综合' };
  let api;
  let catalogue;
  const link = (label, href, primary = false) => `<a class="button${primary ? ' primary' : ''}" href="${escape(href)}">${escape(label)}</a>`;
  const relatedExercises = topicId => data.exercises.filter(item => item.topicIds.includes(topicId));
  const codeBlock = (language, code) => `<div class="lab-code"><span class="lab-code-language">${escape(language.toUpperCase())}</span><pre><code>${escape(code)}</code></pre></div>`;
  const itemMeta = item => `<div class="lab-meta"><span>${trackLabel(item.track)}</span><span>${levels[item.level]}</span><span>${escape(item.group || `约 ${item.minutes} 分钟`)}</span></div>`;
  const topicRow = item => `<article class="knowledge-item">${itemMeta(item)}<div class="lab-list-copy"><h2><a href="#/topic/${escape(item.id)}">${escape(item.title)}</a></h2><p>${escape(item.summary)}</p></div><a class="lab-text-link" href="#/topic/${escape(item.id)}">读懂这个概念 →</a></article>`;
  const exerciseRow = item => `<article class="exercise-item">${itemMeta(item)}<div class="lab-list-copy"><h2><a href="#/exercise/${escape(item.id)}">${escape(item.title)}</a></h2><p>${escape(item.goal)}</p><span class="small hint">${item.files ? '有配套文件' : '有任务与验收'} · ${item.checks.length} 项检查</span></div><a class="lab-text-link" href="#/exercise/${escape(item.id)}">开始动手 →</a></article>`;
  const sourceLinks = ids => `<ul class="lab-sources">${ids.map(id => sources.get(id)).filter(Boolean).map(item => `<li><a href="${escape(item.url)}" target="_blank" rel="noopener noreferrer">${escape(item.title)} ↗</a><p>${escape(item.use)}</p></li>`).join('')}</ul>`;
  const lessonLinks = item => (item.lessonIds || []).map(id => {
    const course = window.LEARNING_CURRICULUM[id.startsWith('go-') ? 'go' : 'web'];
    const lesson = course.lessons.find(lesson => lesson.id === id);
    return lesson ? link(`回到第 ${lesson.day} 课`, '#/lesson/' + id) : '';
  }).join('') + (Number.isInteger(item.followup) ? link('对应后续阶段', '#/followup/web/' + item.followup) : '');
  function heading(title, description) { return `<header class="page-heading lab-heading"><h1>${escape(title)}</h1><p>${escape(description)}</p></header>`; }
  function homeMarkup() {
    return `<section class="lab-home" aria-label="补充学习"><div class="lab-home-links"><a href="#/knowledge"><strong>查一个知识点 <span aria-hidden="true">→</span></strong><span>${data.topics.length} 个主题 · 解释、例子与误区</span></a><a href="#/practice"><strong>挑一个练习 <span aria-hidden="true">→</span></strong><span>${data.exercises.length} 个任务 · 起步、独立完成与加练</span></a></div></section>`;
  }
  function trackMarkup(track) {
    const count = data.topics.filter(item => item.track === track).length;
    const practice = data.exercises.filter(item => item.track === track).length;
    return `<section class="lab-track-intro"><h2>沿着作品学，也沿着问题查</h2><p>${track === 'web' ? '先做静态页面，再通过数据处理、DOM 搜索与请求状态练习补上交互，最后选择前端或 Web + Go 联调。' : '先独立运行小程序，随后把 HTTP、存储、测试与权限接起来。语法示例与项目验收分开，遇到薄弱点可以回头专项练。'}</p><div class="button-row">${link(`${count} 个知识主题`, '#/knowledge?track=' + track)}${link(`${practice} 个分层练习`, '#/practice?track=' + track)}</div></section>`;
  }
  function stageMarkup(id) {
    const milestone = data.milestones[id];
    if (!milestone) return '';
    return `<div class="stage-evidence"><p><strong>这一阶段留下：</strong>${escape(milestone.outcome)}</p><p><strong>怎样验收：</strong>${escape(milestone.evidence)}</p><div class="stage-practice-links">${milestone.exerciseIds.map(id => `<a href="#/exercise/${id}">${escape(exercises.get(id).title)} →</a>`).join('')}</div></div>`;
  }
  function conceptMarkup(item, open = false) {
    return `<details class="lab-concept"${open ? ' open' : ''}><summary>${escape(item.title)}</summary><div class="details-body"><p>${escape(item.summary)}</p>${detailedGuide(item)}<a class="lab-text-link" href="#/topic/${item.id}">在知识地图单独阅读 →</a></div></details>`;
  }
  function detailedGuide(item, guide = window.LEARNING_KNOWLEDGE_GUIDES[item.id], scope = 'knowledge') {
    const fragment=document.createElement('template');
    fragment.innerHTML=api.markdown(guide.markdown.replace(/^# .+\n+/,''));
    const toc=[...fragment.content.querySelectorAll('h2')].map((heading,i)=>{
      heading.id=`${scope}-${item.id}-${i}`;heading.tabIndex=-1;
      return `<button type="button" data-knowledge-jump="${heading.id}">${escape(heading.textContent)}</button>`;
    }).join('');
    [...fragment.content.querySelectorAll('h2,h3')].filter(h=>/^(参考答案|参考解答|练习答案)/.test(h.textContent.trim())).forEach(heading=>{
      const details=document.createElement('details');details.className='knowledge-answer';if(heading.id){details.id=heading.id;details.tabIndex=-1;}
      const summary=document.createElement('summary');summary.textContent=heading.textContent;
      const body=document.createElement('div');body.className='details-body';
      let next=heading.nextElementSibling;
      while(next&&!(/^H[1-3]$/.test(next.tagName)&&Number(next.tagName[1])<=Number(heading.tagName[1]))&&!(next.tagName==='P'&&/^(自查|官方参考|参考资料|继续学习)/.test(next.textContent.trim()))){const following=next.nextElementSibling;body.append(next);next=following;}
      heading.replaceWith(details);details.append(summary,body);
    });
    fragment.content.querySelectorAll('pre').forEach((pre,i)=>{
      const language=pre.querySelector('code')?.className.replace('language-','')||'text';
      const wrapper=document.createElement('div');wrapper.className='knowledge-code';
      const label=document.createElement('p');label.className='knowledge-code-label';
      const isOutput=['output','console'].includes(language);
      label.textContent=isOutput?'输出或界面示意 · 用来对照结果':['text','plaintext'].includes(language)?'文字或结构示意 · 用来阅读对照，按正文说明使用':language==='psql'?'psql 客户端命令 · 在已连接数据库的 SQL Shell 中执行':language==='sql'?'SQL 语句 · 按正文说明保存为文件或在已连接数据库中执行':['sh','shell','powershell','bash'].includes(language)?'终端命令 · 按正文说明在正确目录执行':'代码示例 · 按正文说明新建文件或替换片段';
      pre.id=`${scope}-code-${item.id}-${i}`;
      pre.replaceWith(wrapper);wrapper.append(label);
      {const copy=document.createElement('button');copy.type='button';copy.className='button small';copy.dataset.knowledgeCopy=pre.id;copy.textContent=isOutput?'复制输出':'复制这段内容';copy.setAttribute('aria-label',`复制${item.title}的第 ${i+1} 段内容`);wrapper.append(copy);}
      wrapper.append(pre);
    });
    return `<div class="knowledge-guide ${scope === 'followup' ? 'followup-guide' : ''}" data-${scope}-guide="${escape(item.id)}"><nav class="knowledge-toc" aria-label="${escape(item.title)}章节"><p>按步骤读懂，再运行验证</p>${toc}</nav><article class="markdown knowledge-prose">${fragment.innerHTML}</article></div>`;
  }
  function followupGuideMarkup(track, index) {
    if (track !== 'web') return '';
    const id = 'web-' + String(index).padStart(2, '0');
    const guide = window.LEARNING_FOLLOWUP_GUIDES?.[id];
    const lesson = window.LEARNING_CURRICULUM.web.followups[index];
    if (!guide || !lesson) return '';
    return window.CourseBook.followupMarkup(index) + `<section class="followup-start" aria-label="阶段学习与示例"><h2>从讲解到自己做出来</h2><p>按章节准备文件、运行并核对结果。下载后先解压 ZIP，在 VS Code 选择“文件 → 打开文件夹”，打开包里的 <code>followup-${String(index).padStart(2, '0')}</code> 文件夹，再按 README 的环境要求和启动步骤运行。也可以照正文在自己的新练习目录逐个创建文件。</p><div class="button-row"><a class="button primary" data-followup-download="${id}" href="${escape(guide.download)}" download>下载完整示例源码（ZIP）</a><a class="button quiet" href="https://github.com/zhouwu97/web-kaifa/tree/main/${escape(guide.examplePath)}" target="_blank" rel="noopener noreferrer">查看示例目录 ↗</a></div></section>` + detailedGuide({id, title: lesson.title}, guide, 'followup');
  }
  function lessonMarkup(lesson) {
    const relevant = data.topics.filter(item => item.lessonIds.includes(lesson.id));
    const practice = data.exercises.filter(item => item.lessonIds.includes(lesson.id)).slice(0, 2);
    return window.CourseBook.lessonMarkup(lesson.id) + `<section class="lab-lesson"><details><summary>项目参考与扩展讲义</summary><p class="small hint">需要查具体工具或工程细节时展开；基础知识按上方系统教程学习。</p>${relevant.map(item => conceptMarkup(item, false)).join('')}</details>${practice.length ? `<div class="lab-lesson-practice"><strong>想再练一个小任务？</strong>${practice.map(item => `<a href="#/exercise/${item.id}">${escape(item.title)} <span>约 ${item.minutes} 分钟 →</span></a>`).join('')}</div>` : ''}</section>`;
  }
  function followupMarkup(track, index) {
    if (track !== 'web') return '';
    const relevant = data.topics.filter(item => item.followup === index);
    const practice = data.exercises.filter(item => item.followup === index);
    return relevant.length || practice.length ? `<section class="lab-related"><h2>把这个阶段拆成小步</h2><div class="button-row">${relevant.map(item => link(item.title, '#/topic/' + item.id)).join('')}</div><div class="exercise-grid">${practice.map(exerciseRow).join('')}</div></section>` : '';
  }
  function searchable(item) {
    return [item.title, item.summary, item.goal, item.task, item.group, item.pitfall, window.LEARNING_KNOWLEDGE_GUIDES[item.id]?.markdown, ...(item.points || []).flat(), ...(item.topicIds || []).map(id => topics.get(id)?.title)].filter(Boolean).join(' ').toLowerCase();
  }
  function search(query) {
    const q = query.trim().toLowerCase();
    return { topics: q ? data.topics.filter(item => searchable(item).includes(q)) : [], exercises: q ? data.exercises.filter(item => searchable(item).includes(q)) : [] };
  }
  function searchMarkup(query) {
    const found = search(query);
    return (found.topics.length ? `<section class="lab-search-section"><h2>相关知识 · ${found.topics.length}</h2><div class="knowledge-grid">${found.topics.map(topicRow).join('')}</div></section>` : '')
      + (found.exercises.length ? `<section class="lab-search-section"><h2>可以动手的练习 · ${found.exercises.length}</h2><div class="exercise-grid">${found.exercises.map(exerciseRow).join('')}</div></section>` : '');
  }
  function filteredItems() {
    const list = catalogue.kind === 'knowledge' ? data.topics : data.exercises;
    return list.filter(item => (catalogue.track === 'all' || item.track === catalogue.track) && (catalogue.level === 'all' || item.level === catalogue.level) && (!catalogue.q || searchable(item).includes(catalogue.q.toLowerCase())));
  }
  function resultMarkup(items) {
    if (!items.length) return '<div class="empty-state"><h2>暂时没有匹配内容</h2><p>试试更短的词，或清除方向与难度条件。</p><button class="button" data-lab-clear>清除筛选</button></div>';
    return items.map(catalogue.kind === 'knowledge' ? topicRow : exerciseRow).join('');
  }
  function catalogueMarkup(kind, params) {
    catalogue = { kind, track: ['web', 'go'].includes(params.get('track')) ? params.get('track') : 'all', level: Object.hasOwn(levels, params.get('level')) ? params.get('level') : 'all', q: (params.get('q') || '').trim().slice(0, 200) };
    const knowledge = kind === 'knowledge';
    const items = filteredItems();
    return heading(knowledge ? '把知识连成一张地图' : '挑一个任务，留下实际结果', knowledge ? '从基础到应用与综合主题，每个主题从原理讲到完整例子、VS Code 操作、运行结果、排错和变化练习。按薄弱点回看，或接着做对应练习。' : '每个练习都有起步提示、独立任务、加练要求和可核对的输入输出。时间只是参考，能解释并通过验收再向前。')
      + `<div class="lab-catalogue-note">${knowledge ? '零基础先选“基础”；写过代码可以直看例子与易错点。JavaScript 专题衔接 Web 后续阶段。' : '先自己尝试，再展开提示。配套文件是参考起点；阅读或运行它们不会自动完成任何课程。'}</div>`
      + `<form id="lab-catalogue" class="lab-toolbar" role="search" aria-label="${knowledge ? '知识' : '练习'}筛选"><div class="field lab-query"><label for="lab-query">关键词</label><input type="search" id="lab-query" maxlength="200" placeholder="例如：切片、表单、404" value="${escape(catalogue.q)}" aria-describedby="lab-result-count"></div><div class="field"><label for="lab-track">方向</label><select id="lab-track">${Object.entries({ all: '全部方向', web: 'Web 开发', go: 'Go 后端' }).map(([key, label]) => `<option value="${key}"${catalogue.track === key ? ' selected' : ''}>${label}</option>`).join('')}</select></div><div class="field"><label for="lab-level">难度</label><select id="lab-level">${Object.entries({ all: '全部难度', ...levels }).map(([key, label]) => `<option value="${key}"${catalogue.level === key ? ' selected' : ''}>${label}</option>`).join('')}</select></div><button type="button" class="button quiet" data-lab-clear>清除筛选</button></form>`
      + `<p id="lab-result-count" class="lab-result-count" role="status" aria-live="polite">显示 ${items.length} 个${knowledge ? '知识主题' : '练习'}${catalogue.track !== 'all' ? ' · ' + trackLabel(catalogue.track) : ''}</p><div id="lab-results" class="${knowledge ? 'knowledge-grid' : 'exercise-grid'}">${resultMarkup(items)}</div>`
      + `<section class="lab-reading-path"><h2>${knowledge ? '读懂之后，换个输入试一次' : '一个任务可以练三遍'}</h2><ol>${(knowledge ? ['先预测例子的结果，再展开解释。', '改一个数据或条件，观察行为是否符合预期。', '合上例子做对应练习，记录原因与边界。'] : ['需要起步：先按提示完成最小的一步。', '独立完成：收起提示，按任务与验收从头写。', '继续加练：加入新约束，再验证原来的功能。']).map(text => `<li>${escape(text)}</li>`).join('')}</ol><div class="button-row">${link(knowledge ? '去练习工坊' : '回知识地图', knowledge ? '#/practice' : '#/knowledge')}${link('按课程顺序学习', '#/web')}${link('查看 Go 路线', '#/go')}</div></section>`;
  }
  function topicMarkup(id) {
    const item = topics.get(id);
    if (!item) return null;
    const practice = relatedExercises(id);
    return `<div class="lab-back">${link('← 知识地图', '#/knowledge?track=' + item.track)}</div>` + heading(item.title, item.summary) + itemMeta(item)
      + detailedGuide(item) + `<details class="lab-short-reference"><summary>速查摘要与原短例</summary><article class="topic-article"><section><h2>什么时候会用到</h2><p>${escape(item.why)}</p></section><section><h2>先弄清这几件事</h2><dl class="lab-points">${item.points.map(([term, explanation]) => `<div><dt>${escape(term)}</dt><dd>${escape(explanation)}</dd></div>`).join('')}</dl></section><section><h2>读一段小例子，先预测结果</h2>${codeBlock(item.language, item.example)}<details class="lab-recall"><summary>查看预期结果与运行条件</summary><div class="details-body">${escape(item.expected)}</div></details></section><section class="lab-pitfall"><h2>容易踩的坑</h2><p>${escape(item.pitfall)}</p></section><section><h2>合上例子，问问自己</h2><p>${escape(item.recall[0])}</p><details class="lab-recall"><summary>展开参考解释</summary><div class="details-body">${escape(item.recall[1])}</div></details></section></article></details>`
      + `<section class="lab-related"><h2>接着练，或回到课程里</h2>${item.prerequisites.length ? `<p class="small hint">前置知识：${item.prerequisites.map(id => `<a href="#/topic/${id}">${escape(topics.get(id).title)}</a>`).join(' · ')}</p>` : '<p class="small hint">可以从这个主题开始，不要求先学另一门语言。</p>'}<div class="button-row">${lessonLinks(item)}</div><div class="exercise-grid">${practice.map(exerciseRow).join('')}</div></section><section class="lab-related"><h2>想再查一查</h2>${sourceLinks(item.sourceIds)}</section>`;
  }
  function exerciseMarkup(id) {
    const item = exercises.get(id);
    if (!item) return null;
    const sourceIds = [...new Set(item.topicIds.flatMap(id => topics.get(id).sourceIds))];
    return `<div class="lab-back">${link('← 练习工坊', '#/practice?track=' + item.track)}</div>` + heading(item.title, item.goal) + itemMeta(item)
      + `<div class="exercise-layout"><article class="exercise-content"><section class="lab-assignment"><h2>先自己做这一版</h2><p>${escape(item.task)}</p><p class="small hint">先写下预期，再动手。下面的起点帮助开工，验收要看你自己的结果。</p></section><details class="lab-guidance"><summary>需要起步？展开三步提示</summary><div class="details-body"><ol>${item.steps.map(step => `<li>${escape(step)}</li>`).join('')}</ol></div></details><section><h2>参考起点与启动方式</h2><p>${escape(item.run)}</p>${item.files ? `<div class="button-row"><a class="button primary" href="${item.files}README.md" target="_blank" rel="noopener">配套练习说明 ↗</a>${item.track === 'web' ? `<a class="button" href="${item.files}index.html" target="_blank" rel="noopener">打开练习起点 ↗</a>` : `<a class="button" href="${item.files}main.go" target="_blank" rel="noopener">查看 main.go ↗</a>`}</div>` : ''}<details><summary>查看起点代码或约定</summary><div class="details-body">${codeBlock(item.language, item.starter)}<button class="button small" data-lab-copy="code" data-lab-exercise="${id}">复制起点</button></div></details>${item.preview ? `<div class="lab-demo"><button class="button" data-lab-demo="${id}">运行起点演示</button><p class="small hint">只展示上面的原始片段，在隔离页面里运行。</p><iframe class="lab-demo-frame" id="lab-demo-frame" sandbox="allow-scripts" title="练习起点的隔离演示" hidden></iframe></div>` : ''}</section><section><h2>用这些输入验收</h2><div class="table-scroll"><table class="lab-cases"><thead><tr><th scope="col">操作或输入</th><th scope="col">预期结果</th></tr></thead><tbody>${item.cases.map(([input, expected]) => `<tr><th scope="row">${escape(input)}</th><td>${escape(expected)}</td></tr>`).join('')}</tbody></table></div></section><section class="lab-stretch"><h2>独立完成后，再加一个约束</h2><p>${escape(item.stretch)}</p></section><section><h2>当前起点的限制</h2><p>${escape(item.limitations)}</p></section></article><aside class="exercise-plan"><h2>做完留下这些证据</h2><ol>${item.checks.map(check => `<li>${escape(check)}</li>`).join('')}</ol><p class="small hint">记录自己的代码、实际输出与一个边界解释；这些补充练习不单独打卡，也不会替你更新课时。</p><button class="button" data-lab-copy="checklist" data-lab-exercise="${id}">复制验收与复盘清单</button><p class="small hint">可粘贴到自己的笔记，或回课内保存成果。</p><h3>卡住时，回看这里</h3><ul class="lab-topic-links">${item.topicIds.map(id => `<li><a href="#/topic/${id}">${escape(topics.get(id).title)} →</a></li>`).join('')}</ul><div class="button-row">${lessonLinks(item)}</div></aside></div><section class="lab-related"><h2>继续查对应的原始资料</h2>${sourceLinks(sourceIds)}</section>`;
  }
  function updateCatalogue() {
    if (!document.querySelector('#lab-catalogue')) return;
    catalogue.track = document.querySelector('#lab-track').value;
    catalogue.level = document.querySelector('#lab-level').value;
    catalogue.q = document.querySelector('#lab-query').value.trim().slice(0, 200);
    const items = filteredItems();
    document.querySelector('#lab-results').innerHTML = resultMarkup(items);
    document.querySelector('#lab-result-count').textContent = `显示 ${items.length} 个${catalogue.kind === 'knowledge' ? '知识主题' : '练习'}${catalogue.track !== 'all' ? ' · ' + trackLabel(catalogue.track) : ''}`;
    const params = new URLSearchParams();
    if (catalogue.track !== 'all') params.set('track', catalogue.track);
    if (catalogue.level !== 'all') params.set('level', catalogue.level);
    if (catalogue.q) params.set('q', catalogue.q);
    history.replaceState(history.state, '', '#/' + catalogue.kind + (params.size ? '?' + params : ''));
  }
  document.addEventListener('change', event => { if (['lab-track', 'lab-level'].includes(event.target.id)) updateCatalogue(); });
  document.addEventListener('input', event => { if (event.target.id === 'lab-query') updateCatalogue(); });
  document.addEventListener('submit', event => { if (event.target.id === 'lab-catalogue') { event.preventDefault(); updateCatalogue(); } });
  document.addEventListener('click', async event => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    if(button.dataset.knowledgeJump){
      const target=document.getElementById(button.dataset.knowledgeJump);
      if(target){const disclosure=target.closest('details');if(disclosure)disclosure.open=true;target.focus({preventScroll:true});target.scrollIntoView({block:'start',behavior:'instant'});}
    }
    if(button.dataset.knowledgeCopy&&api){const code=document.getElementById(button.dataset.knowledgeCopy);if(code)await api.copy(code.textContent,button);}
    if (button.hasAttribute('data-lab-clear')) {
      document.querySelector('#lab-track').value = document.querySelector('#lab-level').value = 'all';
      document.querySelector('#lab-query').value = '';
      updateCatalogue();
      if (!button.isConnected) document.querySelector('#lab-query').focus({ preventScroll: true });
    }
    if (button.dataset.labCopy && api) {
      const item = exercises.get(button.dataset.labExercise);
      if (!item) return;
      const text = button.dataset.labCopy === 'code' ? item.starter : [`# ${item.title}`, '', `任务：${item.task}`, '', '## 验收清单', ...item.checks.map(check => '- [ ] ' + check), '', '## 实际验证', '| 输入或操作 | 预期 | 我的实际结果 |', '| --- | --- | --- |', ...item.cases.map(([input, expected]) => `| ${input.replace(/\|/g, '\\|')} | ${expected.replace(/\|/g, '\\|')} | 待填写 |`), '', '## 我的解释与复盘', '- 我修改了什么：', '- 我实际运行的命令或操作：', '- 正常与边界输入的结果：', '- 我还没理解的地方：', '', '阅读参考与复制清单不会更新课时完成状态。'].join('\n');
      await api.copy(text, button);
    }
    if (button.dataset.labDemo) {
      const item = exercises.get(button.dataset.labDemo);
      const frame = document.querySelector('#lab-demo-frame');
      if (!item?.preview || !frame) return;
      const policy = '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; connect-src \'none\'; form-action \'none\';"><style>body{font-family:sans-serif;line-height:1.7;padding:16px;overflow-wrap:anywhere}button,input{font:inherit}img{max-width:100%}</style>';
      frame.srcdoc = item.starter.replace('<meta charset="UTF-8">', '<meta charset="UTF-8">' + policy);
      frame.hidden = false;
      button.textContent = '重新运行起点';
    }
  });
  window.LearningLab = { configure(value) { api = value; }, homeMarkup, trackMarkup, stageMarkup, lessonMarkup, followupMarkup, followupGuideMarkup, catalogueMarkup, topicMarkup, exerciseMarkup, search, searchMarkup };
})();
