/* A chapter teaches one subject. Project records remain in the existing workbook. */
(() => {
 'use strict';
 const data=window.COURSE_BOOK;
 const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const chapter=id=>data.lessons.find(item=>item.id===id);
 const url=item=>'#/learn/'+item.track+'/'+item.id;
 const links=ids=>ids.map(chapter).filter(Boolean).map(item=>`<a href="${url(item)}">${escape(item.title)} →</a>`).join('');
 const pageSize=8;
 let api;
 function routeInfo(){
  const [path,query='']=location.hash.replace(/^#\/?/,'').split('?'),parts=path.split('/');
  const track=parts[0]==='learn'?parts[1]:parts[0],id=parts[0]==='learn'?parts[2]:null;
  if(!data.tracks[track]||(id&&chapter(id)?.track!==track))return null;
  return {track,id,path,params:new URLSearchParams(query)};
 }
 function directoryState(track,id,params){
  const active=chapter(id),requested=params.get('level');
  const level=data.levels.find(x=>x.id===requested)||data.levels.find(x=>x.id===active?.level)||data.levels[0];
  const items=data.lessons.filter(x=>x.track===track&&x.level===level.id),pages=Math.ceil(items.length/pageSize);
  const activeIndex=items.findIndex(x=>x.id===id);
  const requestedPage=Number(params.get('page'));
  const page=params.has('page')&&Number.isInteger(requestedPage)?Math.max(1,Math.min(pages,requestedPage)):Math.max(1,Math.floor(activeIndex/pageSize)+1);
  return {level,items,page,pages,start:(page-1)*pageSize};
 }
 function directoryUrl(level,page){
  const route=routeInfo(),params=new URLSearchParams(route.params);
  params.set('level',level);params.set('page',String(page));
  return '#/'+route.path+'?'+params;
 }
 function refreshDirectory(focus){
  const route=routeInfo(),container=document.getElementById('course-outline');
  if(!route||!container)return;
  container.hidden=false;container.innerHTML=outline(route.track,route.id,route.params);
  if(focus)container.querySelector(focus)?.focus({preventScroll:true});
 }
 function prose(item,scope='book'){
  const content=document.createElement('template');
  content.innerHTML=api.markdown(item.markdown.replace(/^# .+\n+/,''));
  const opening=content.content.firstElementChild;
  if(opening?.tagName==='P' && opening.textContent===item.goal)opening.remove();
  // Authored Markdown also works as repository documentation; adapt its relative links for the reader.
  content.content.querySelectorAll('a[href],img[src]').forEach(element=>{
   const attribute=element.tagName==='A'?'href':'src',value=element.getAttribute(attribute);
   const reader=value.match(/^(?:\.\.\/)+index\.html(#\/.*)$/);
   const documentChapter=value.match(/(?:^|\/)((?:go|web)-[a-z0-9-]+)\.md$/);
   if(reader)element.setAttribute(attribute,reader[1]);
   else if(element.tagName==='A'&&documentChapter&&chapter(documentChapter[1]))element.setAttribute(attribute,url(chapter(documentChapter[1])));
   else if(value.startsWith('../'))element.setAttribute(attribute,new URL(value,new URL(item.source,document.baseURI)).href);
  });
  content.content.querySelectorAll('h2,h3').forEach((heading,index)=>{heading.id=scope+'-'+item.id+'-'+index;heading.tabIndex=-1;});
  content.content.querySelectorAll('h3').forEach(heading=>{
   if(!/^参考(答案|核对)/.test(heading.textContent))return;
   const details=document.createElement('details'),summary=document.createElement('summary');
   details.className='book-answer';summary.textContent=heading.textContent;details.append(summary);
   let next=heading.nextElementSibling;
   while(next&&!/^H[1-3]$/.test(next.tagName)){const following=next.nextElementSibling;details.append(next);next=following;}
   heading.replaceWith(details);
  });
  content.content.querySelectorAll('pre').forEach((pre,index)=>{
   const language=pre.querySelector('code')?.className.replace('language-','')||'text';
   pre.id=scope+'-code-'+item.id+'-'+index;
   const wrapper=document.createElement('div');wrapper.className='book-code';
   const button=document.createElement('button');button.type='button';button.className='button small';
   button.dataset.bookCopy=pre.id;button.textContent=['output','console'].includes(language)?'复制输出':['sh','powershell','bat'].includes(language)?'复制命令':'复制代码';
   button.setAttribute('aria-label',`复制${item.title}的第 ${index+1} 段${['output','console'].includes(language)?'输出':'代码'}`);
   pre.replaceWith(wrapper);wrapper.append(button,pre);
  });
  return `<article class="markdown book-prose" data-book-prose="${escape(item.id)}">${content.innerHTML}</article>`;
 }
 function catalogueMarkup(track){
  const course=data.tracks[track];if(!course)return null;
  const items=data.lessons.filter(x=>x.track===track);
  const relationship=track==='go'?`Go 运行在服务器上，可以返回 JSON 给网页，也可以把数据填进 HTML 模板。进入 HTTP 章节前会先认识浏览器与服务器；模板章节会链接到需要的 HTML 基础。`:`HTML 组织内容，CSS 安排样式，JavaScript 处理交互。先用这三项基础写页面，学过 DOM、事件与请求后，再用 React 或 Vue 组织组件，最后连接 Go 后端。`;
  return `<header class="page-heading"><span class="workbook-eyebrow">${track==='go'?'GO':'WEB'} / 课程简介 · ${items.length} 节</span><h1>${escape(course.title)}</h1><p>${escape(course.description)}</p></header><div class="book-start"><a class="button primary" href="${url(items[0])}">从第一节开始 →</a><p>在左侧选择阶段和章节。手机点击顶部“目录”，每次只读一节。</p></div><section class="book-overview"><h2>这条路线怎样学</h2><dl>${data.levels.map(level=>`<div><dt>${escape(level.label)}</dt><dd>${escape(course.levelGoals[level.id])}</dd></div>`).join('')}</dl><h2>网页与后端怎样衔接</h2><p>${relationship}</p><p class="setup-entry"><a href="#/setup?topic=${track}">准备学习环境 →</a><a href="#/setup?topic=editor">编辑器基础操作 →</a></p></section>`;
 }
 function chapterMarkup(track,id){
  const item=chapter(id);if(!item||item.track!==track)return null;
  const items=data.lessons.filter(x=>x.track===track),index=items.indexOf(item),level=data.levels.find(x=>x.id===item.level);
  const content=prose(item),template=document.createElement('template');template.innerHTML=content;
  const headings=[...template.content.querySelectorAll('h2')];
  const toc=`<details class="book-page-toc"><summary>本节目录 · ${headings.length} 项</summary><nav aria-label="本节小目录">${headings.map(h=>`<a href="#${h.id}" data-book-jump="${h.id}">${escape(h.textContent)}</a>`).join('')}</nav></details>`;
  return `<header class="page-heading"><span class="workbook-eyebrow"><a href="#/${track}">${track==='go'?'Go':'Web'}</a> / ${escape(level.label)} / ${String(item.number).padStart(2,'0')}</span><h1>${escape(item.title)}</h1><p>${escape(item.goal)}</p></header>${item.prerequisites.length?`<div class="book-prerequisites"><span>用到前面学过的：</span>${links(item.prerequisites)}</div>`:''}${toc}${content}<nav class="book-next" aria-label="教程章节切换">${index?`<a href="${url(items[index-1])}"><small>上一节</small><span>← ${escape(items[index-1].title)}</span></a>`:`<a href="#/${track}">← 课程简介</a>`}${index+1<items.length?`<a href="${url(items[index+1])}"><small>下一节</small><span>${escape(items[index+1].title)} →</span></a>`:`<a href="#/${track}">回课程简介 →</a>`}</nav>`;
 }
 function outline(track,id,params=new URLSearchParams()){
  const {level,items,page,pages,start}=directoryState(track,id,params),active=chapter(id);
  const outside=active&&(!items.slice(start,start+pageSize).some(x=>x.id===id));
  const projects=data.projects.filter(x=>x.track===track&&x.level===level.id);
  return `<div class="book-track-switch" aria-label="选择学习方向"><a href="#/go"${track==='go'?' aria-current="true"':''}>Go 后端</a><a href="#/web"${track==='web'?' aria-current="true"':''}>Web 开发</a></div><a class="book-overview-link" href="#/${track}"${!id?' aria-current="page"':''}>课程简介</a><label class="book-stage-label" for="book-stage">章节阶段</label><select id="book-stage" data-book-stage>${data.levels.map(x=>`<option value="${x.id}"${x.id===level.id?' selected':''}>${escape(x.label)} · ${data.lessons.filter(y=>y.track===track&&y.level===x.id).length} 节</option>`).join('')}</select><p class="book-stage-goal">${escape(data.tracks[track].levelGoals[level.id])}</p><div class="outline-links book-outline" id="book-chapters" aria-label="${escape(level.label)}章节">${items.slice(start,start+pageSize).map(item=>`<a href="${url(item)}"${item.id===id?' aria-current="page"':''} title="${escape(item.title)}"><span class="outline-number">${String(item.number).padStart(2,'0')}</span><span class="outline-title">${escape(item.title)}</span></a>`).join('')}</div><div class="book-pagination" aria-label="章节目录翻页"><button type="button" data-book-page="${page-1}" aria-label="目录上一页" aria-controls="book-chapters"${page===1?' disabled':''}>‹</button><span role="status" aria-live="polite">${page} / ${pages} 页</span><button type="button" data-book-page="${page+1}" aria-label="目录下一页" aria-controls="book-chapters"${page===pages?' disabled':''}>›</button></div>${outside?`<button type="button" class="book-locate" data-book-locate>定位当前章节</button>`:''}${projects.map(project=>`<div class="book-stage-project"><span>阶段实战</span><a href="${escape(project.href)}">${escape(project.title)} →</a></div>`).join('')}<details class="book-workbook"><summary>项目练习与原有记录</summary><div class="outline-links">${window.LEARNING_CURRICULUM[track].lessons.map(item=>`<a href="#/lesson/${item.id}">${String(item.day).padStart(2,'0')} ${escape(item.title)}</a>`).join('')}</div></details>`;
 }
 function lessonMarkup(id){
  const items=(data.legacyLessons[id]||[]).map(chapter).filter(Boolean);if(!items.length)return '';
  return `<section class="book-lesson"><h2>先学本课用到的基础</h2>${prose(items[0],'lesson-book')}<div class="book-link-list">${items.slice(1).map(item=>`<a href="${url(item)}">接着学：${escape(item.title)} →</a>`).join('')}<a href="#/${items[0].track}">按入门、初阶、中级、高级顺序学习 →</a></div></section>`;
 }
 function followupMarkup(index){
  const ids=data.followups[index]||[];return ids.length?`<section class="book-prerequisites"><h2>先学这些，再做阶段项目</h2><div class="book-link-list">${links(ids)}</div></section>`:'';
 }
 function searchMarkup(query){
  const q=query.trim().toLowerCase();if(!q)return '';
  const items=data.lessons.filter(item=>(item.title+' '+item.goal+' '+item.markdown).toLowerCase().includes(q));
  return items.length?`<section class="lab-search-section"><h2>系统教程 · ${items.length}</h2>${items.map(item=>`<article class="setup-search-result"><h3><a href="${url(item)}">${escape(item.title)} →</a></h3><p>${escape(item.goal)}</p></article>`).join('')}</section>`:'';
 }
 function context(track,id){const item=chapter(id);return item?.track===track?{id:'learn/'+track+'/'+id,title:item.title,task:item.goal,checks:item.checks,starterCode:Object.values(item.example?.files||{})[0]||''}:null;}
 document.addEventListener('click',event=>{
  const selected=event.target.closest('.book-outline a');
  if(selected&&matchMedia('(max-width: 960px)').matches&&document.getElementById('sidebar').dataset.open==='true')document.getElementById('menu-toggle').click();
  const button=event.target.closest('[data-book-copy]');if(button&&api){const source=document.getElementById(button.dataset.bookCopy);if(source)api.copy(source.textContent,button);}
  const jump=event.target.closest('[data-book-jump]');if(jump){event.preventDefault();const target=document.getElementById(jump.dataset.bookJump);if(target){target.focus({preventScroll:true});target.scrollIntoView({block:'start',behavior:'instant'});}}
  const pager=event.target.closest('[data-book-page],[data-book-locate]'),route=routeInfo();
  if(!pager||pager.disabled||!route)return;
  const {level}=directoryState(route.track,route.id,route.params);
  if(pager.hasAttribute('data-book-locate')){
   const active=chapter(route.id),items=data.lessons.filter(x=>x.track===route.track&&x.level===active.level);
   history.pushState(null,'',directoryUrl(active.level,Math.floor(items.indexOf(active)/pageSize)+1));
   refreshDirectory('.book-outline [aria-current="page"]');
  }else{
   const direction=Number(pager.dataset.bookPage)>Number(document.querySelector('.book-pagination [role="status"]').textContent.split('/')[0])?'next':'previous';
   history.pushState(null,'',directoryUrl(level.id,pager.dataset.bookPage));
   refreshDirectory(`[aria-label="目录${direction==='next'?'下一页':'上一页'}"]:not(:disabled)`);
   if(document.activeElement===document.body)document.querySelector('.book-pagination button:not(:disabled)')?.focus({preventScroll:true});
  }
 });
 document.addEventListener('change',event=>{
  if(!event.target.matches('[data-book-stage]')||!routeInfo())return;
  history.pushState(null,'',directoryUrl(event.target.value,1));refreshDirectory('[data-book-stage]');
 });
 window.CourseBook={configure(value){api=value;},catalogueMarkup,chapterMarkup,outline,lessonMarkup,followupMarkup,searchMarkup,context,chapter,routeInfo,refreshDirectory};
})();
