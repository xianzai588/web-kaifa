/* Reading a concept must expose its task in place; only feedback is initially folded. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const BASE=process.env.SITE_TEST_URL||'http://127.0.0.1:8743/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.COURSE_BROWSER_EXECUTABLE||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE+'#/home');await page.locator('#main h1').first().waitFor();
  const chapters=await page.evaluate(()=>COURSE_BOOK.lessons.map(x=>({id:x.id,track:x.track,tasks:[...x.markdown.matchAll(/^### 就地练习：(.+)$/gm)].map(m=>m[1])})));
  let count=0;
  const records=()=>page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('web-kaifa-study-v1'));return Object.fromEntries(['notes','drafts','checks','quiz','completed'].map(k=>[k,s[k]]));});
  const baseline=await records();
  for(const chapter of chapters){
   assert(chapter.tasks.length>=2,chapter.id+' has practice for individual concepts');
   await page.goto(BASE+`#/learn/${chapter.track}/${chapter.id}`);await page.locator('.book-prose').waitFor();
   const tasks=await page.locator('.book-prose').evaluate(prose=>[...prose.querySelectorAll('h3')].filter(h=>h.textContent.startsWith('就地练习：')).map(h=>{
    const prompt=h.nextElementSibling,feedback=prompt?.nextElementSibling;
    return {title:h.textContent.slice(5),visible:h.getClientRects().length>0&&prompt?.getClientRects().length>0,task:prompt?.textContent,summary:feedback?.querySelector('summary')?.textContent,folded:feedback?.tagName==='DETAILS'&&!feedback.open,answer:feedback?.textContent};
   }));
   assert.deepEqual(tasks.map(t=>t.title),chapter.tasks,chapter.id+' renders all authored tasks');
   for(const task of tasks){
    assert(task.visible&&task.task.length>8,chapter.id+' task is visible below explanation');
    assert(task.folded,chapter.id+' feedback starts closed');
    assert.equal(task.summary,'参考核对：'+task.title);
    assert(task.answer.length>task.summary.length+8,chapter.id+' has concrete feedback');
   }
   count+=tasks.length;
  }
  const guides=await page.evaluate(()=>Object.entries(LEARNING_KNOWLEDGE_GUIDES).map(([id,guide])=>({id,tasks:[...guide.markdown.matchAll(/^#{3,4} 就地练习：(.+)$/gm)].map(m=>m[1])})));
  let guideTasks=0;
  for(const guide of guides){
   assert(guide.tasks.length>=2,guide.id+' supplementary concepts have local tasks');
   await page.goto(BASE+'#/topic/'+guide.id);await page.locator('#main > .knowledge-guide .knowledge-prose').waitFor();
   const actual=await page.locator('#main > .knowledge-guide .knowledge-prose').evaluate(prose=>[...prose.querySelectorAll('h3,h4')].filter(h=>h.textContent.startsWith('就地练习：')).map(h=>{
    const prompt=h.nextElementSibling,feedback=prompt?.nextElementSibling;
    return {title:h.textContent.slice(5),visible:h.getClientRects().length>0&&prompt?.getClientRects().length>0,summary:feedback?.querySelector('summary')?.textContent,closed:feedback?.tagName==='DETAILS'&&!feedback.open};
   }));
   assert.deepEqual(actual.map(t=>t.title),guide.tasks,guide.id+' tasks retained in topic page');
   for(const task of actual){assert(task.visible&&task.closed,guide.id+' task visible with folded feedback');assert.equal(task.summary,'参考核对：'+task.title);}
   guideTasks+=actual.length;
  }
  await page.goto(BASE+'#/learn/web/web-fullstack');await page.locator('.book-prose').waitFor();
  const disclosure=page.locator('.book-answer').filter({has:page.locator('summary', {hasText:'参考核对：'})}).first();
  const summary=disclosure.locator('summary');await summary.focus();await page.keyboard.press('Enter');assert(await disclosure.evaluate(el=>el.open));await page.keyboard.press('Enter');assert(!await disclosure.evaluate(el=>el.open));
  for(const width of [320,375,768]){
   await page.setViewportSize({width,height:900});
   for(const id of ['go-input','web-fullstack']){
    await page.goto(BASE+`#/learn/${id.startsWith('go')?'go':'web'}/${id}`);await page.locator('.book-prose').waitFor();
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),id+' practice stays within viewport '+width);
   }
  }
  assert.deepEqual(await records(),baseline,'reading, answering and keyboard toggles never mark study complete');assert.deepEqual(errors,[]);
  console.log(`PASS: ${chapters.length} chapters, ${count} inline tasks plus ${guides.length} supplementary topics / ${guideTasks} tasks; local folded feedback, keyboard, mobile and study records.`);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
