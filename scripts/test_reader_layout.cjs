/* Reader presentation: a real left rail, intact teaching DOM, local table scrolling and learner work. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),qa=path.join(root,'.qa','reader-layout');
const BASE=process.env.SITE_TEST_URL||'http://127.0.0.1:8743/',KEY='web-kaifa-study-v1';
const widths=[320,375,414,768,961,1280,1440,1920];
const routes=[
 {name:'setup-editor',hash:'#/setup?topic=editor',kind:'setup',id:'editor',prose:'.setup-article',toc:'.setup-toc',jump:'data-setup-jump'},
 {name:'setup-go',hash:'#/setup?topic=go',kind:'setup',id:'go',prose:'.setup-article',toc:'.setup-toc',jump:'data-setup-jump'},
 {name:'topic',hash:'#/topic/go-sql',kind:'topic',id:'go-sql',prose:'.knowledge-prose',toc:'.knowledge-toc',jump:'data-knowledge-jump'},
 {name:'followup',hash:'#/followup/web/8',kind:'followup',id:8,prose:'.followup-guide .knowledge-prose',toc:'.knowledge-toc',jump:'data-knowledge-jump'},
 {name:'book-go',hash:'#/learn/go/go-http-handler',kind:'book',track:'go',id:'go-http-handler',prose:'.book-prose',toc:'.book-page-toc',jump:'data-book-jump'},
 {name:'book-web',hash:'#/learn/web/web-document',kind:'book',track:'web',id:'web-document',prose:'.book-prose',toc:'.book-page-toc',jump:'data-book-jump'},
 {name:'legacy',hash:'#/lesson/go-01',kind:'legacy',id:'go-01',prose:'.book-lesson .book-prose'},
 {name:'exercise',hash:'#/exercise/web-request',kind:'exercise',id:'web-request',prose:'.exercise-content',toc:'.reader-section-links',jump:'data-reader-jump'},
 {name:'ai-method',hash:'#/ai-method',kind:'method',prose:'#main',toc:'.reader-section-links',jump:'data-reader-jump'},
 {name:'home',hash:'#/home',kind:'home',prose:'#main'}
];
const report={widths,routes:[],tableKeyboard:[],codeKeyboard:[],readingPreserved:[],sourceDOM:[],firstScreen:[],rerender:[]};
fs.mkdirSync(qa,{recursive:true});
async function records(page){return page.evaluate(key=>{const state=JSON.parse(localStorage.getItem(key));return Object.fromEntries(['completed','checks','quiz','notes','drafts'].map(name=>[name,state[name]]));},KEY);}
async function openMenu(page){if(await page.locator('#menu-toggle').isVisible()&&await page.locator('#menu-toggle').getAttribute('aria-expanded')==='false')await page.locator('#menu-toggle').click();}
async function assertOverflow(page,label){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.body.scrollWidth<=innerWidth+1),label+' has no document/body horizontal overflow');}
async function assertSourceDOM(page,route){
 if(route.kind==='home')return;
 const result=await page.evaluate(row=>{
  let markup;
  if(row.kind==='setup')markup=window.GettingStarted.markup(new URLSearchParams('topic='+row.id));
  else if(row.kind==='topic')markup=window.LearningLab.topicMarkup(row.id);
  else if(row.kind==='followup')markup=window.LearningLab.followupGuideMarkup('web',row.id);
  else if(row.kind==='book')markup=window.CourseBook.chapterMarkup(row.track,row.id);
  else if(row.kind==='legacy')markup=window.CourseBook.lessonMarkup(row.id);
  else if(row.kind==='exercise')markup=window.LearningLab.exerciseMarkup(row.id);
  else markup=window.Workbench.methodPage();
  const template=document.createElement('template');template.innerHTML=markup;
  const original=row.kind==='method'?template.content:template.content.querySelector(row.prose);
  const current=document.querySelector(row.prose);
  const signature=scope=>[...scope.querySelectorAll('h1,h2,h3,p,li,pre,th,td,a[href],img[src]')]
   .filter(el=>!el.closest('.reader-table-hint,.reader-code-hint,[data-reader-table-hint]'))
   .map(el=>{const authored=el.cloneNode(true);authored.querySelectorAll('.reader-table-hint,.reader-code-hint,[data-reader-table-hint],[data-code-copy]').forEach(hint=>hint.remove());return {tag:el.tagName,text:authored.textContent,href:el.getAttribute('href'),src:el.getAttribute('src'),alt:el.getAttribute('alt')};});
  return {original:signature(original),current:signature(current)};
 },route);
 assert.deepEqual(result.current,result.original,route.name+' retains exact authored text, code, table cells, links and images');
 report.sourceDOM.push(route.name);
}
(async()=>{
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'msedge',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']});
  const page=await context.newPage(),errors=[],external=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>{if(/^https?:/.test(request.url())&&!request.url().startsWith(BASE))external.push(request.url());});
  await page.goto(BASE+'#/home');await page.locator('#main h1').waitFor();
  await page.evaluate(key=>{
   const state=JSON.parse(localStorage.getItem(key)),lesson=window.LEARNING_CURRICULUM.web.lessons[0];
   state.notes['go-01']='布局调整前保留的 Go 笔记';state.notes['web-01']='我自己验收过的 Web 笔记';
   state.drafts['go-01']='package main\n// 用户草稿，不自动执行';state.drafts['web-01']='<script>window.savedDraftExecuted=true</script>';
   state.checks['web-01']=lesson.checks.map(()=>true);state.quiz['web-01']=lesson.quiz.answer;state.completed=['web-01'];
   localStorage.setItem(key,JSON.stringify(state));
  },KEY);
  await page.reload();await page.locator('#main h1').waitFor();const baseline=await records(page);
  assert.deepEqual(baseline.completed,['web-01'],'preexisting actual acceptance record is a valid fixture');
  const beforeFile=path.join(root,'.qa','reader-before.json'),before=fs.existsSync(beforeFile)?JSON.parse(fs.readFileSync(beforeFile,'utf8')):[];
  for(const width of widths){
   await page.setViewportSize({width,height:1000});
   for(const route of routes){
    await page.goto(BASE+route.hash);await page.locator(route.prose).waitFor();
    assert.equal(await page.locator('#main h1').count(),1,route.name+' one heading at '+width);
    await assertOverflow(page,route.name+' '+width);
    assert.equal(await page.locator('#reader-outline').count(),1,'one permanent reader outline container');
    assert(await page.locator('#reader-outline').evaluate(el=>el.closest('#sidebar')===document.querySelector('#course-outline').closest('#sidebar')),'both outlines share one actual left rail');
    if(route.toc){
     assert.equal(await page.locator('#reader-outline '+route.toc).count(),1,route.name+' outline moved into rail');
     assert.equal(await page.locator('#main '+route.toc).count(),0,route.name+' body has no duplicate outline');
     assert.equal(await page.locator('#reader-outline').evaluate(el=>el.hidden),false);
     if(route.kind==='setup'){
      assert.equal(await page.locator('#reader-outline .setup-nav a').count(),4,'all setup topics remain reachable');
      assert.equal(await page.locator('#main .setup-nav').count(),0,'setup topics do not precede the article');
     }
     if(route.kind==='book')assert.equal(await page.locator('#reader-outline .book-page-toc').evaluate(el=>el.open),false,'in-page book directory starts collapsed');
     if(width<=960){
      assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'false','mobile directory starts hidden');
      assert.equal(await page.locator('#reader-outline').isVisible(),false,'mobile body is visible without outline');
     }else{
      assert(await page.locator('#reader-outline').isVisible());
      assert(await page.locator('#sidebar').evaluate(el=>{const sidebar=el.getBoundingClientRect(),body=document.querySelector('#main').getBoundingClientRect();return sidebar.left===0&&sidebar.right<=body.left+1;}),'directory is on the left of the actual article');
     }
    }else assert.equal(await page.locator('#reader-outline').evaluate(el=>el.hidden),true,route.name+' clears the previous reader directory');
    if(route.kind==='book'||route.kind==='followup'){
     for(const prerequisites of await page.locator('#main .book-prerequisites').all())assert(await prerequisites.evaluate(el=>{const details=el.closest('details');return details&&!details.open;}),'prerequisites remain available in a collapsed disclosure');
    }
    if(width===1440)await assertSourceDOM(page,route);
    if(route.name==='setup-go'&&[375,1440].includes(width)){
     const current=await page.locator('.setup-article').evaluate(el=>({width:innerWidth,headingTop:el.querySelector('h2').getBoundingClientRect().top,bodyWidth:el.getBoundingClientRect().width}));
     assert(current.headingTop<800,'first real setup section appears on the first screen');
     const previous=before.find(item=>item.width===width&&!item.railAlreadyPresent);
     if(previous){assert(current.headingTop<previous.headingTop-100,'first setup section moves meaningfully upwards');if(width===1440)assert(current.bodyWidth>previous.bodyWidth*1.15,'desktop article has meaningfully more width');}
     report.firstScreen.push({before:previous||null,after:current});await page.screenshot({path:path.join(qa,`setup-go-${width}.png`)});
    }
    const scrollables=await page.locator('#main .table-scroll').evaluateAll(elements=>elements.filter(el=>el.clientWidth>0&&el.scrollWidth>el.clientWidth+1).map(el=>({label:el.getAttribute('aria-label'),labelledby:el.getAttribute('aria-labelledby'),role:el.getAttribute('role'),tabIndex:el.tabIndex,width:el.clientWidth,scrollWidth:el.scrollWidth,left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,overflow:getComputedStyle(el).overflowX})));
    for(const table of scrollables){
     assert(['auto','scroll'].includes(table.overflow),'long table scrolls inside its own container');
     assert.equal(table.role,'region','scrolling table has an accessible region');assert.equal(table.tabIndex,0,'scrolling table supports keyboard focus');
     assert(table.label||table.labelledby,'scrolling table has an accessible name');assert(table.left>=0&&table.right<=width+1,'scrolling table container fits viewport');
    }
    if(width<=414&&scrollables.length){
     const wrapper=page.locator('#main .table-scroll').filter({visible:true});
     const index=await wrapper.evaluateAll(elements=>elements.findIndex(el=>el.scrollWidth>el.clientWidth+1));
     const table=wrapper.nth(index);await table.evaluate(el=>el.scrollLeft=0);await table.focus();
     await page.keyboard.press('ArrowRight');await page.waitForFunction(()=>document.activeElement.classList.contains('table-scroll')&&document.activeElement.scrollLeft>0);
     report.tableKeyboard.push(route.name+' '+width);await assertOverflow(page,'keyboard table scroll '+route.name+' '+width);
    }
    const codeBoxes=page.locator('#main pre:has(code)').filter({visible:true});
    const codes=await codeBoxes.evaluateAll(elements=>elements.map(el=>({whiteSpace:getComputedStyle(el).whiteSpace,overflow:getComputedStyle(el).overflowX,scrollWidth:el.scrollWidth,width:el.clientWidth,role:el.getAttribute('role'),label:el.getAttribute('aria-label'),labelledby:el.getAttribute('aria-labelledby'),tabIndex:el.tabIndex,left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right})));
    for(const code of codes){
     assert.equal(code.whiteSpace,'pre',route.name+' '+width+' preserves the visual source lines');
     if(code.scrollWidth<=code.width+1)continue;
     assert(['auto','scroll'].includes(code.overflow),'long source line scrolls inside its code box');
     assert.equal(code.tabIndex,0,'overflowing code has keyboard focus');assert(code.label||code.labelledby,'overflowing code has an accessible name');
     assert(code.left>=0&&code.right<=width+1,'code scroll box fits viewport');
    }
    if(width<=414&&codes.some(code=>code.scrollWidth>code.width+1)){
     const code=codeBoxes.nth(codes.findIndex(item=>item.scrollWidth>item.width+1));await code.evaluate(el=>el.scrollLeft=0);await code.focus();
     await page.keyboard.press('ArrowRight');await page.waitForFunction(()=>document.activeElement.tagName==='PRE'&&document.activeElement.scrollLeft>0);
     report.codeKeyboard.push(route.name+' '+width);await assertOverflow(page,'keyboard code scroll '+route.name+' '+width);
    }
    if(route.toc){
     await openMenu(page);
     if(route.kind==='book')await page.locator('#reader-outline .book-page-toc > summary').click();
     const jump=page.locator('#reader-outline ['+route.jump+']').last(),target=await jump.getAttribute(route.jump),hash=await page.evaluate(()=>location.hash);
     await jump.click();assert.equal(await page.evaluate(()=>document.activeElement.id),target,'section receives keyboard focus');
     assert.equal(await jump.getAttribute('aria-current'),'location',route.name+' '+width+' selected section is immediately marked as current');
     const heading=await page.locator('#'+target).boundingBox();assert(heading.y>=68&&heading.y<800,route.name+' section is below the fixed header and visible');
     assert.equal(await page.evaluate(()=>location.hash),hash,'section navigation keeps the content route');
     if(width<=960){assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'false','section selection first closes the mobile directory');assert.equal(await page.locator('#sidebar').getAttribute('data-open'),'false');}
    }
    if(route.name==='book-go'){
     await page.locator('#assistant-toggle').click();assert(await page.locator('#assistant-panel').isVisible());
     await assertOverflow(page,'assistant '+width);
     assert(await page.locator('#assistant-panel').evaluate(el=>{const box=el.getBoundingClientRect();return box.left>=0&&box.right<=innerWidth+1;}),'assistant fits viewport at '+width);
     await page.locator('#assistant-question').fill('这一章的表格和代码怎样对应？');await page.locator('#assistant-form [type="submit"]').click();
     assert((await page.locator('#assistant-output').textContent()).includes('这一章的表格和代码怎样对应？'),'assistant remains a real copyable question generator');
     await page.locator('#assistant-close').click();
    }
    assert.deepEqual(await records(page),baseline,route.name+' '+width+' leaves original notes, drafts, acceptance and completion intact');
    report.routes.push(route.name+' '+width);
   }
  }
  assert(report.tableKeyboard.length>0,'real mobile teaching tables exercise keyboard horizontal scrolling');
  assert(report.codeKeyboard.length>0,'real mobile source lines exercise keyboard horizontal scrolling');
  // Topic selection uses the mobile directory and must restore the normal reading page.
  await page.setViewportSize({width:375,height:1000});await page.goto(BASE+'#/setup?topic=go');await page.locator('.setup-article').waitFor();
  await openMenu(page);await page.locator('#reader-outline .setup-nav [href="#/setup?topic=ask"]').click();await page.locator('#question-workshop').waitFor();
  assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'false');
  await openMenu(page);await page.locator('#reader-outline [data-setup-jump="question-workshop"]').click();
  assert.equal(await page.evaluate(()=>document.activeElement.id),'question-workshop');assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'false');
  // Directory pagination changes only the rail, retaining the existing reading node and work.
  for(const width of [375,1440]){
   await page.setViewportSize({width,height:1000});await page.goto(BASE+'#/learn/go/go-program');await page.locator('.book-prose').waitFor();
   const answer=page.locator('.book-answer').first();if(!await answer.evaluate(el=>el.open))await answer.locator('summary').click();
   assert.equal(await page.locator('.book-answer[open]').count(),1,'reference answer is expanded before directory interaction');
   await page.locator('#assistant-toggle').click();await page.locator('#assistant-question').fill('翻章目录时保留这份提问');
   await page.evaluate(()=>{window.__readerProse=document.querySelector('.book-prose');window.scrollTo({top:400,behavior:'instant'});});
   await openMenu(page);const position=await page.evaluate(()=>scrollY);await page.locator('[aria-label="目录下一页"]').click();
   assert(await page.evaluate(()=>window.__readerProse===document.querySelector('.book-prose')),'paging keeps actual article DOM');
   assert.equal(await page.locator('.book-answer[open]').count(),1,'paging keeps expanded answer');
   assert.equal(await page.locator('#assistant-question').inputValue(),'翻章目录时保留这份提问');
   assert(Math.abs(await page.evaluate(()=>scrollY)-position)<2,'paging keeps article scroll');
   await page.locator('#book-stage').selectOption('advanced');assert(await page.evaluate(()=>window.__readerProse===document.querySelector('.book-prose')));
   assert.equal(await page.locator('.book-answer[open]').count(),1);assert.equal(await page.locator('#assistant-question').inputValue(),'翻章目录时保留这份提问');
   if(await page.locator('#menu-toggle').isVisible()&&await page.locator('#menu-toggle').getAttribute('aria-expanded')==='true')await page.locator('#menu-toggle').click();
   await page.locator('#assistant-close').click();report.readingPreserved.push(width);
  }
  await page.setViewportSize({width:1440,height:1000});await page.goto(BASE+'#/lesson/go-01');await page.locator('#lesson-code').waitFor({state:'attached'});
  assert.equal(await page.locator('#lesson-note').inputValue(),baseline.notes['go-01']);assert.equal(await page.locator('#lesson-code').inputValue(),baseline.drafts['go-01']);
  await page.goto(BASE+'#/lesson/web-01');await page.locator('#lesson-code').waitFor({state:'attached'});
  assert.equal(await page.locator('#lesson-code').inputValue(),baseline.drafts['web-01']);assert.equal(await page.evaluate(()=>window.savedDraftExecuted),undefined,'preserved user draft never runs automatically');
  assert.equal(await page.locator('#code-preview').getAttribute('sandbox'),'allow-scripts','preview preserves isolation');
  assert.deepEqual(await records(page),baseline);
  // Manual scrolling updates the section marker even on very wide screens.
  await page.setViewportSize({width:1920,height:1000});await page.goto(BASE+'#/setup?topic=go');await page.locator('.setup-article').waitFor();
  const manualTarget=await page.locator('.setup-article h2').nth(2).getAttribute('id');
  await page.locator('#'+manualTarget).evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));
  await page.waitForFunction(id=>document.querySelector(`#reader-outline [data-setup-jump="${id}"]`)?.getAttribute('aria-current')==='location',manualTarget);
  // Completion and restored-code undo rebuild the lesson without losing reading enhancements.
  const acceptanceContext=await browser.newContext({viewport:{width:375,height:1000}}),acceptance=await acceptanceContext.newPage();
  acceptance.on('pageerror',error=>errors.push(error.message));
  await acceptance.goto(BASE+'#/lesson/web-01');await acceptance.locator('.book-prose').waitFor();
  const ownCode='<h1 id="rerender-proof">我自己改过并验收的标题</h1>',ownNote='我修改标题、运行预览并核对了实际结果。';
  await acceptance.locator('[data-lesson-tab="code"]').click();await acceptance.locator('#lesson-code').fill(ownCode);
  await acceptance.locator('[data-action="run-preview"]').click();await acceptance.frameLocator('#code-preview').locator('#rerender-proof').waitFor();
  await acceptance.locator('[data-lesson-tab="review"]').click();await acceptance.locator('#lesson-note').fill(ownNote);
  for(const check of await acceptance.locator('[data-check]').all())await check.check();
  const quizAnswer=await acceptance.evaluate(()=>window.LEARNING_CURRICULUM.web.lessons[0].quiz.answer);
  await acceptance.locator(`[data-answer="${quizAnswer}"]`).click();await acceptance.locator('#complete-lesson').click();
  const completed=await records(acceptance);assert.deepEqual(completed.completed,['web-01']);assert.equal(completed.notes['web-01'],ownNote);assert.equal(completed.drafts['web-01'],ownCode);assert(completed.checks['web-01'].every(Boolean));assert.equal(completed.quiz['web-01'],quizAnswer);
  const assertRebuiltReader=async label=>{
   await acceptance.locator('[data-lesson-tab="task"]').click();
   await acceptance.waitForFunction(()=>{
    const table=document.querySelector('.book-prose .table-scroll'),pre=document.querySelector('.book-prose pre:has(code)');
    return document.body.classList.contains('reading-view')&&table?.clientWidth>0&&table.scrollWidth>table.clientWidth&&table.tabIndex===0&&table.getAttribute('aria-label')&&pre?.clientWidth>0&&pre.scrollWidth>pre.clientWidth&&pre.tabIndex===0&&pre.getAttribute('aria-label')&&getComputedStyle(pre).whiteSpace==='pre';
   });
   for(const selector of ['.book-prose .table-scroll','.book-prose pre:has(code)']){
    const region=acceptance.locator(selector).first();await region.evaluate(el=>el.scrollLeft=0);await region.focus();await acceptance.keyboard.press('ArrowRight');
    await acceptance.waitForFunction(()=>document.activeElement.scrollLeft>0);
   }
   await assertOverflow(acceptance,label);report.rerender.push(label);
  };
  await assertRebuiltReader('completed lesson');assert.deepEqual(await records(acceptance),completed,'completion rebuild retains exact accepted learner work');
  await acceptance.locator('[data-lesson-tab="code"]').click();await acceptance.locator('[data-action="reset-code"]').click();
  const starter=await acceptance.evaluate(()=>window.LEARNING_CURRICULUM.web.lessons[0].starterCode);
  assert.equal(await acceptance.locator('#lesson-code').inputValue(),starter,'explicit restore uses the actual course example');assert.deepEqual((await records(acceptance)).completed,['web-01']);
  await acceptance.locator('[data-action="undo"]').click();assert.equal(await acceptance.locator('#lesson-code').inputValue(),ownCode,'restore undo recovers the exact edited code');
  await assertRebuiltReader('restored-code undo');assert.deepEqual(await records(acceptance),completed,'undo keeps notes, checks, quiz and completion while recovering the draft');
  assert.equal(await acceptance.frameLocator('#code-preview').locator('#rerender-proof').count(),0,'undo rebuild never automatically runs the recovered draft');
  await acceptanceContext.close();assert.deepEqual(errors,[]);assert.deepEqual(external,[],'presentation never requests external model services');
  fs.writeFileSync(path.join(qa,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({routes:report.routes.length,widths,sourceDOM:report.sourceDOM.length,keyboardTables:report.tableKeyboard.length,keyboardCode:report.codeKeyboard.length,evidence:qa}));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
