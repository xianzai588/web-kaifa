/* Tutorial presentation and a local-only question worksheet. No progress writes. */
(() => {
  'use strict';
  const guides = window.GETTING_STARTED;
  const escape = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fields = [
    ['goal','我正在做什么','例如：运行自己写的第一个 Go 程序。',2000],
    ['environment','我的环境','操作系统、工具版本、终端类型、当前相对目录。',2000],
    ['expected','我预期看到什么','运行哪条命令或做哪个操作后，应该发生什么？',2000],
    ['actual','实际发生了什么','完整报错或实际输出，包含文件名和行号；没有报错也写清现象。',6000],
    ['code','相关代码与文件名','粘贴最小相关片段；移除密码、令牌与个人信息。',10000],
    ['tried','我已经试过什么','尝试的方法 → 实际结果；没有尝试就如实写明。',2000]
  ];
  const draft = Object.fromEntries(fields.map(([id])=>[id,'']));
  let api, output='';
  const sections = {
    go: { download: /^1\./, windows: /^Windows：/, mac: /^macOS：/, linux: /^Linux：/, path: /^命令路径与 PATH/, module: /^3\./, run: /^4\./, build: /^6\./, 'missing-module': /F5 报 go\.mod file not found/ },
    editor: { tools: /^8\./, module: /^9\./, terminal: /^10\./, tasks: /^11\./, debug: /^12\./ }
  };
  const template = '我正在做：\n环境（系统、工具版本、终端、目录）：\n预期结果：\n实际结果与完整报错：\n相关代码与文件名：\n已经试过的方法与结果：\n\n请先检查缺少的证据，再给一个能验证的原因。一次只指导一步，说明在哪里操作、预期看到什么；先给线索，不重写整个项目。';
  function worksheet() {
    return `<section class="setup-worksheet" aria-labelledby="question-workshop"><h2 id="question-workshop">我的问题整理器</h2><p>先把问题写清楚。只生成可复制文字，不调用模型；刷新前请自行复制保存。</p><button type="button" class="button" data-setup-template>复制空白模板</button><form id="setup-question-form" novalidate>${fields.map(([id,label,hint,max])=>`<div class="field"><label for="setup-${id}">${label}${['goal','actual'].includes(id)?'（必填）':''}</label><textarea id="setup-${id}" data-setup-field="${id}" maxlength="${max}" rows="${id==='code'?5:3}" placeholder="${hint}" ${['goal','actual'].includes(id)?'aria-required="true" ':''}aria-describedby="setup-question-status">${escape(draft[id])}</textarea></div>`).join('')}<button class="button primary" type="submit">生成我的提问</button><p id="setup-question-status" role="status">目标与实际结果必填；缺少的信息会标记为待补充。</p></form><section id="setup-question-result" ${output?'':'hidden'}><h3>整理好的提问 · 非 AI 回答</h3><p>复制后，在你使用的 AI 对话输入框中粘贴并自行发送。</p><button class="button" data-setup-copy>复制我的提问</button><pre id="setup-question-output" tabindex="0">${escape(output)}</pre></section></section>`;
  }
  function guideContent(selected) {
    const fragment=document.createElement('template');
    fragment.innerHTML=api.markdown(selected.markdown.replace(/^# .+\n+/, ''));
    const headings=[...fragment.content.querySelectorAll('h2')];
    const toc=headings.map((heading,i)=>{
      heading.id=`setup-${selected.id}-step-${i}`;heading.tabIndex=-1;
      for (const [name, pattern] of Object.entries(sections[selected.id] || {})) if (pattern.test(heading.textContent)) heading.dataset.setupSection=name;
      return `<button type="button" data-setup-jump="${heading.id}">${escape(heading.textContent)}</button>`;
    }).join('');
    fragment.content.querySelectorAll('pre').forEach((pre,i)=>{
      pre.id=`setup-${selected.id}-code-${i}`;
      const wrapper=document.createElement('div');wrapper.className='setup-code';
      const button=document.createElement('button');button.type='button';button.className='button small';
      const language=pre.querySelector('code')?.className.replace('language-','')||'text';
      const label=document.createElement('p');label.className='setup-code-label';
      label.textContent=language==='output'?'预期输出 / 界面示意 · 只对照，不要当命令输入':['sh','powershell','bat'].includes(language)?'在 VS Code 底部终端输入，按 Enter 执行':['go','html','json'].includes(language)?'在文件编辑区编写并保存 · 按正文说明新建或替换':'文字示例 · 按自己的实际情况填写';
      button.dataset.setupSnippet=pre.id;button.textContent='复制这段内容';
      button.setAttribute('aria-label',`复制第 ${i+1} 段内容`);
      pre.replaceWith(wrapper);wrapper.append(label);
      button.textContent=language==='output'?'复制输出':'复制这段内容';wrapper.append(button);
      wrapper.append(pre);
    });
    return `<div class="setup-layout"><nav class="setup-toc" aria-label="本页步骤"><p>跳到你正在做的步骤</p>${toc}${selected.id==='ask'?'<button type="button" data-setup-jump="question-workshop">直接填写我的问题 →</button>':''}</nav><article class="markdown setup-article">${fragment.innerHTML}</article></div>`;
  }
  function focusStep(id) {
    const target=document.getElementById(id);if(!target)return;
    target.setAttribute('tabindex','-1');target.focus({preventScroll:true});
    target.scrollIntoView({block:'start',behavior:'instant'});
  }
  function focusRequested(params) {
    const topic=guides.find(x=>x.id===params.get('topic'))?.id||'editor',step=params.get('step');
    if (!Object.hasOwn(sections[topic] || {}, step)) return;
    const target=document.querySelector(`.setup-article [data-setup-section="${step}"]`);
    if (target) focusStep(target.id);
  }
  function markup(params) {
    const selected=guides.find(x=>x.id===params.get('topic'))||guides[0];
    return `<header class="page-heading"><span class="workbook-eyebrow">开始写代码之前 / 起步教程</span><h1>${escape(selected.title)}</h1><p>${escape(selected.summary)}</p></header><p class="setup-route-hint">先安装编辑器 → Web / Go 任选一条运行首个程序 → 遇到问题学会提问。手机可阅读，安装与运行请用电脑。</p><nav class="setup-nav" aria-label="起步教程">${guides.map(x=>`<a href="#/setup?topic=${x.id}" ${x.id===selected.id?'aria-current="page"':''}>${escape(x.title)}</a>`).join('')}</nav>${guideContent(selected)}${selected.id==='ask'?worksheet():''}<nav class="button-row setup-next" aria-label="接着学习">${selected.id==='editor'?'<a class="button primary" href="#/setup?topic=web">配置 Web 环境 →</a><a class="button" href="#/setup?topic=go">配置 Go 环境 →</a>':selected.id==='ask'?'<a class="button" href="#/setup?topic=web">回到 Web 环境 →</a><a class="button" href="#/setup?topic=go">回到 Go 环境 →</a><a class="button" href="#/ai-method">怎样用 AI 开发 →</a>':`<a class="button primary" href="#/lesson/${selected.id}-01">进入${selected.id==='web'?' Web':' Go'} 第 1 课 →</a>`}${selected.id!=='ask'?'<a class="button" href="#/setup?topic=ask">遇到问题，学会问 AI →</a>':''}</nav>`;
  }
  function search(query) { return query?guides.filter(x=>(x.title+' '+x.summary+' '+x.markdown).toLowerCase().includes(query.toLowerCase())):[]; }
  function searchMarkup(query) {
    const items=search(query);
    const missingModule = /go\.mod.*file not found|cannot find main module/i.test(query);
    const directStep = guide => missingModule && guide.id==='go' ? 'missing-module' : /go\.mod/i.test(query) && ['go','editor'].includes(guide.id) ? 'module' : /dlv/i.test(query) && guide.id==='editor' ? 'tools' : /f5/i.test(query) && guide.id==='editor' ? 'debug' : /PATH|GOROOT|GOPATH|找不到.*go|go.*不是.*命令/i.test(query) && guide.id==='go' ? 'path' : /amd64|arm64|安装包|下载/i.test(query) && guide.id==='go' ? 'download' : '';
    return items.length?`<section class="lab-search-section"><h2>起步教程 · ${items.length}</h2>${items.map(x=>`<article class="setup-search-result"><h3><a href="#/setup?topic=${x.id}${directStep(x)?'&amp;step='+directStep(x):''}">${escape(x.title)}${directStep(x)?' · 直达对应步骤':''} →</a></h3><p>${escape(x.summary)}</p></article>`).join('')}</section>`:'';
  }
  document.addEventListener('input',e=>{
    const id=e.target.dataset.setupField;if(!Object.hasOwn(draft,id))return;
    draft[id]=e.target.value;e.target.removeAttribute('aria-invalid');output='';
    document.querySelector('#setup-question-result').hidden=true;
    document.querySelector('#setup-question-output').textContent='';
    document.querySelector('#setup-question-status').textContent='内容已修改，请重新生成提问。';
  });
  document.addEventListener('submit',e=>{
    if(e.target.id!=='setup-question-form')return;e.preventDefault();
    const missing=['goal','actual'].filter(id=>!draft[id].trim());
    for(const id of ['goal','actual'])document.querySelector('#setup-'+id).setAttribute('aria-invalid',String(missing.includes(id)));
    if(missing.length){document.querySelector('#setup-question-status').textContent='请先填写目标与实际结果；不知道原因也可以描述看到的现象。';document.querySelector('#setup-'+missing[0]).focus();return;}
    output=fields.map(([id,label])=>`${label}：\n${draft[id].trim()||'【待补充，请先向我确认】'}`).join('\n\n')+'\n\n请区分观察与猜测，先问缺少的证据，再给一个可验证的原因。一次只指导一步，说明在哪里操作、预期看到什么。新术语先解释，不重写整个项目；没有运行就说明未验证。';
    document.querySelector('#setup-question-output').textContent=output;
    document.querySelector('#setup-question-result').hidden=false;
    document.querySelector('#setup-question-status').textContent='提问文字已生成，尚未发送；复制前检查是否包含密码或个人信息。';
    focusStep('setup-question-result');
  });
  document.addEventListener('click',e=>{
    const button=e.target.closest('button');if(!button||!api)return;
    if(button.dataset.setupJump)focusStep(button.dataset.setupJump);
    if(button.dataset.setupSnippet){const snippet=document.getElementById(button.dataset.setupSnippet);if(snippet)api.copy(snippet.textContent,button);}
    if(button.hasAttribute('data-setup-template'))api.copy(template,button);
    if(button.hasAttribute('data-setup-copy')&&output)api.copy(output,button);
  });
  window.GettingStarted={configure(value){api=value;},markup,search,searchMarkup,focusRequested};
})();
