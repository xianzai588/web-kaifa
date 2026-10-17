/* Every teaching block copies its actual source, including collapsed answers and outputs. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const BASE=process.env.SITE_TEST_URL||'http://127.0.0.1:8743/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.COURSE_BROWSER_EXECUTABLE||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({permissions:['clipboard-read','clipboard-write']});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(BASE+'#/home');await page.locator('#main h1').first().waitFor();
  const routes=await page.evaluate(()=>[
   ...COURSE_BOOK.lessons.map(x=>`#/learn/${x.track}/${x.id}`),
   ...LEARNING_LAB.topics.map(x=>'#/topic/'+x.id),...LEARNING_LAB.exercises.map(x=>'#/exercise/'+x.id),
   ...Object.values(LEARNING_CURRICULUM).flatMap(x=>x.lessons.map(l=>'#/lesson/'+l.id)),
   ...LEARNING_CURRICULUM.web.followups.map((_,i)=>'#/followup/web/'+i),
   ...['editor','web','go','ask'].map(x=>'#/setup?topic='+x),'#/ai-method','#/ai'
  ]);

  let blocks=0;
  for(const route of routes){
   await page.goto(BASE+route);await page.locator('#main h1').first().waitFor();
   const before=await page.evaluate(()=>localStorage.getItem('web-kaifa-study-v1'));
   const result=await page.evaluate(async()=>{
    // Let the generic enhancer finish after the route DOM is replaced.
    await new Promise(resolve=>requestAnimationFrame(resolve));
    let count=0;
    for(const pre of document.querySelectorAll('#main pre')){
     const buttons=pre.parentElement.querySelectorAll('[data-book-copy],[data-setup-snippet],[data-knowledge-copy],[data-code-copy]');
     if(buttons.length!==1)throw new Error('Copy control count '+buttons.length+': '+pre.textContent.slice(0,100));
     const button=buttons[0],expected=pre.textContent;
     // The DOM click also exercises blocks in collapsed answers without opening them.
     button.click();
     for(let i=0;i<100&&button.textContent!=='已复制';i++)await new Promise(resolve=>setTimeout(resolve,5));
     if(button.textContent!=='已复制')throw new Error('Missing success feedback: '+pre.id);
     if(await navigator.clipboard.readText()!==expected)throw new Error('Clipboard differs: '+pre.id);
     count++;
    }
    return count;
   });
   assert.equal(await page.evaluate(()=>localStorage.getItem('web-kaifa-study-v1')),before,route+' copy preserves records');
   blocks+=result;
  }
  // Exact whitespace, unicode and HTML are preserved, even after rapid repeat clicks.
  await page.goto(BASE+'#/learn/go/go-input');await page.locator('.book-prose').waitFor();
  const special='\t<标签> & "文字"\n  second line\n';
  await page.locator('.book-code pre').first().evaluate((pre,text)=>pre.textContent=text,special);
  const copy=page.locator('[data-book-copy]').first();await copy.click();await copy.click();
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),special);
  await page.waitForTimeout(2300);assert.equal(await copy.textContent(),'复制代码');
  // Denied Clipboard API falls back to execCommand; total denial shows honest feedback.
  await page.evaluate(()=>{navigator.clipboard.writeText=async()=>{throw new Error('denied')};});
  await copy.click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),special);
  assert(await copy.evaluate(el=>el===document.activeElement),'fallback preserves keyboard focus');
  await page.evaluate(()=>{document.execCommand=()=>false;});
  await copy.click();assert.notEqual(await copy.textContent(),'已复制');
  assert.match(await page.locator('#notice').textContent(),/手动选中/);
  await page.setViewportSize({width:320,height:900});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mobile has no horizontal page overflow');
  assert.deepEqual(errors,[]);
  console.log(`PASS: ${routes.length} routes, ${blocks} blocks copied exactly; repeat, fallback, failure, mobile and study records checked.`);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
