/* Exercises published explanations, course visibility, and their complete examples. */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {execFileSync,spawnSync}=require('node:child_process'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),qa=path.join(root,'.qa');
const BASE=process.env.SITE_TEST_URL||'http://127.0.0.1:8743/';
const normalize=s=>String(s).replace(/\r\n/g,'\n').trim();
(async()=>{
  fs.mkdirSync(qa,{recursive:true});
  const exampleRoot=fs.mkdtempSync(path.join(qa,'knowledge-run-'));
  const specs=['web','go'].flatMap(track=>JSON.parse(fs.readFileSync(path.join(root,`docs/knowledge/${track}/examples.json`),'utf8')));
  for(const spec of specs){
    const base=path.join(exampleRoot,spec.id);fs.mkdirSync(base,{recursive:true});
    const topicId=spec.topicId||spec.id;
    const markdown=fs.readFileSync(path.join(root,`docs/knowledge/${topicId.split('-')[0]}/${topicId}.md`),'utf8');
    for(const [name,content] of Object.entries(spec.files||{})){
      const file=path.resolve(base,name);assert(file.startsWith(base+path.sep),'example path must stay within its own folder');
      fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,content);
      assert(normalize(markdown).includes(normalize(content)),spec.id+' example file must match published source: '+name);
    }
  }
  const server=http.createServer((request,response)=>{
    const file=path.resolve(exampleRoot,'.'+decodeURIComponent(new URL(request.url,'http://local').pathname));
    if(!file.startsWith(exampleRoot+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){response.writeHead(404);response.end('not found');return;}
    response.setHeader('Content-Type',{'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml'}[path.extname(file)]||'text/plain');response.end(fs.readFileSync(file));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const exampleURL=`http://127.0.0.1:${server.address().port}/`;
  const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'msedge',headless:true});
  const report=[];
  try{
    const context=await browser.newContext({permissions:['clipboard-read','clipboard-write']});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(BASE+'#/topic/go-control');await page.locator('.knowledge-guide').waitFor();
    const {topics,lessons}=await page.evaluate(()=>({topics:window.LEARNING_LAB.topics,lessons:Object.values(window.LEARNING_CURRICULUM).flatMap(x=>x.lessons)}));
    const original=await page.evaluate(()=>localStorage.getItem('web-kaifa-study-v1'));
    const openReaderMenu=async()=>{const menu=page.locator('#menu-toggle');if(await menu.isVisible()&&await menu.getAttribute('aria-expanded')==='false')await menu.click();};
    for(const width of [320,375,414,768,1024,1280,1440]){
      await page.setViewportSize({width,height:960});
      for(const topic of topics){
        await page.goto(BASE+'#/topic/'+topic.id);await page.locator('[data-knowledge-guide="'+topic.id+'"]').waitFor();
        assert.equal(await page.locator('main h1').count(),1);
        assert(await page.locator('.knowledge-prose').textContent().then(s=>s.length>1200),topic.id+' detailed lesson');
        assert(await page.locator('.knowledge-prose h2').count()>=4,topic.id+' teaching structure');
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),topic.id+' overflow at '+width);
        await openReaderMenu();await page.locator('#reader-outline [data-knowledge-jump]').first().click();
        const target=await page.locator('[data-knowledge-jump]').first().getAttribute('data-knowledge-jump');
        assert.equal(await page.evaluate(()=>document.activeElement.id),target);
        const box=await page.locator('#'+target).boundingBox();assert(box.y>=68&&box.y<800,'visible chapter target');
      }
    }
    assert.equal(await page.evaluate(()=>localStorage.getItem('web-kaifa-study-v1')),original,'knowledge reading and navigation never update progress');
    for(const lesson of lessons){
      await page.goto(BASE+'#/lesson/'+lesson.id);await page.locator('.lab-lesson').waitFor();
      assert.equal(await page.locator('.lab-lesson [data-knowledge-guide]').count(),topics.filter(t=>t.lessonIds.includes(lesson.id)).length,'no hidden topic mapping: '+lesson.id);
    }
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('web-kaifa-study-v1')).completed),[]);
    const savedGuide=await page.evaluate(()=>window.LEARNING_KNOWLEDGE_GUIDES['go-control'].markdown);
    // Navigating to a topic without reloading exercises the in-memory rendering boundary.
    await page.evaluate(()=>{window.LEARNING_KNOWLEDGE_GUIDES['go-control'].markdown='# 测试讲义\n\n## 代码安全\n\n[unsafe](<java\tscript:alert(1)>)\n\n<script>window.knowledgeAttack=true</script>';location.hash='/topic/go-tools';});
    await page.locator('[data-knowledge-guide="go-tools"]').waitFor();
    await page.evaluate(()=>location.hash='/topic/go-control');await page.locator('[data-knowledge-guide="go-control"]').waitFor();
    assert.equal(await page.locator('.knowledge-prose script,.knowledge-prose a').count(),0,'detailed lecture uses sanitized Markdown');
    assert.equal(await page.evaluate(()=>window.knowledgeAttack),undefined);
    await page.evaluate(value=>{window.LEARNING_KNOWLEDGE_GUIDES['go-control'].markdown=value;},savedGuide);
    await page.goto(BASE+'#/lesson/go-02');await page.locator('.book-lesson').waitFor();
    await page.locator('[data-knowledge-guide="go-control"]').waitFor({state:'attached'});
    await page.setViewportSize({width:1440,height:960});
    await page.locator('.book-lesson > h2').evaluate(el=>{el.scrollIntoView({block:'start'});});await page.screenshot({path:path.join(qa,'knowledge-go02-expanded.png')});
    const copy=page.locator('.book-lesson [data-book-copy]').first();await copy.click();
    const codeId=await copy.getAttribute('data-book-copy');
    assert.equal(normalize(await page.evaluate(()=>navigator.clipboard.readText())),normalize(await page.locator('#'+codeId).textContent()));
    assert.equal(await page.locator('#code-preview').count(),0,'copying does not add a Go preview');
    if(process.env.SITE_HTTP_ONLY!=='1'){const offline=await context.newPage();await offline.goto(pathToFileURL(path.join(root,'index.html')).href+'#/topic/go-control');await offline.locator('.knowledge-prose').waitFor();assert((await offline.locator('.knowledge-prose').textContent()).includes('零值'));}else console.log('SKIP: file:// knowledge rendering (SITE_HTTP_ONLY=1); HTTP content and examples still run.');
    const example=await context.newPage(),exampleErrors=[];example.on('pageerror',e=>exampleErrors.push(e.message));
    for(const spec of specs){
      if(spec.kind==='manual'){report.push({id:spec.id,status:'manual',reason:spec.reason});continue;}
      if(spec.kind==='go'){
        const cwd=path.join(exampleRoot,spec.id);
        if(!fs.existsSync(path.join(cwd,'go.mod')))execFileSync('go',['mod','init','example.com/'+spec.id],{cwd,stdio:'pipe'});
        const stdout=execFileSync('go',spec.command||['run','.'],{cwd,encoding:'utf8',timeout:30000});
        if(spec.expected!==undefined)assert.equal(normalize(stdout),normalize(spec.expected),spec.id+' stdout');
        for(const value of spec.contains||[])assert(stdout.includes(value),spec.id+' expected output '+value);
        if(['go-design','go-delivery'].includes(spec.id)){
          const name=spec.id==='go-design'?'PAGE_LIMIT':'PORT';
          for(const raw of ['', 'abc']){
            const invalid=spawnSync('go',['run','.'],{cwd,encoding:'utf8',timeout:30000,env:{...process.env,[name]:raw}});
            assert.match(invalid.stdout+invalid.stderr,spec.id==='go-design'?/配置错误/ : /PORT 需为/ ,spec.id+' explicit invalid configuration is rejected');
            if(spec.id==='go-delivery')assert.notEqual(invalid.status,0,'server invalid config fails before startup');
          }
        }
        report.push({id:spec.id,status:'passed',command:spec.command||['run','.'],stdout:normalize(stdout)});continue;
      }
      assert.equal(spec.kind,'html');await example.setViewportSize({width:1280,height:960});
      await example.goto(exampleURL+spec.id+'/'+spec.entry);
      for(const check of spec.checks)assert.equal(normalize(await example.locator(check.selector).textContent()),normalize(check.text),spec.id+' '+check.selector);
      if(spec.id==='web-files'){
        assert.equal(await example.locator('h1').evaluate(el=>getComputedStyle(el).color),'rgb(22, 78, 128)');
        await example.getByRole('link',{name:'认识我们'}).click();assert.equal(await example.locator('h1').textContent(),'关于周末编程社');
      }
      if(spec.id==='web-css')assert.equal(await example.locator('.note').evaluate(el=>getComputedStyle(el).color),'rgb(22, 78, 128)');
      if(spec.id==='web-box'){await example.locator('#measure').click();assert.equal(await example.locator('#result').textContent(),'content-box：226px\nborder-box：200px');}
      if(spec.id==='web-flex'){await example.locator('#toggle').click();assert.equal(await example.locator('.bar').evaluate(el=>getComputedStyle(el).flexDirection),'column');}
      if(spec.id==='web-forms'){
        await example.waitForLoadState('networkidle');
        const beforeURL=example.url(),formRequests=[];
        const recordRequest=request=>formRequests.push({method:request.method(),url:request.url()});
        example.on('request',recordRequest);
        try{
          await example.locator('#name').fill('小林');await example.locator('#email').fill('student@example.com');await example.locator('[type=submit]').click();
          assert((await example.locator('#feedback').textContent()).includes('尚未提交或保存'));
          await example.locator('#name').fill('小张');
          assert.equal(await example.locator('#feedback').textContent(),'输入已修改，请重新检查。','editing invalidates the old successful check');
          await example.getByRole('button',{name:'清空本地输入'}).click();
          assert.equal(await example.locator('#name').inputValue(),'','clear removes the successful draft name');
          assert.equal(await example.locator('#email').inputValue(),'','clear removes the successful draft email');
          assert.equal(await example.locator('#feedback').textContent(),'本地输入已清空，未发送数据。');
          assert.equal(await example.evaluate(()=>document.activeElement.id),'name','clear restores focus to the first field');
          await example.locator('#name').fill('   ');await example.locator('#email').fill('student@example.com');await example.locator('[type=submit]').click();
          assert((await example.locator('#feedback').textContent()).includes('不能只包含空格'));
          assert.equal(await example.evaluate(()=>document.activeElement.id),'name');
          await example.getByRole('button',{name:'清空本地输入'}).click();
          assert.equal(await example.locator('#name').inputValue(),'','clear also removes an invalid draft');
          assert.equal(await example.locator('#email').inputValue(),'');
          assert.equal(await example.locator('#feedback').textContent(),'本地输入已清空，未发送数据。');
          assert.equal(await example.evaluate(()=>document.activeElement.id),'name');
          assert.equal(example.url(),beforeURL,'local checks do not expose entered values through URL navigation');
          assert.deepEqual(formRequests,[],'form checks and clear never send data to the static server');
        }finally{example.off('request',recordRequest);}
      }
      if(spec.id==='web-js'){await example.locator('#run').click();assert.equal(await example.locator('#output').textContent(),'匹配 2 项：HTML、CSS');await example.locator('#limit').fill('');await example.locator('#run').click();assert((await example.locator('#output').textContent()).includes('请输入'));}
      if(spec.id==='web-dom'){await example.locator('#keyword').fill('<script>alert(1)</script>');assert.equal(await example.locator('#list script').count(),0);assert((await example.locator('#count').textContent()).includes('没有匹配'));}
      if(spec.id==='web-fetch'){
        for(const [file,result] of [['items.json','加载成功：'],['empty.json','目前没有活动'],['missing.json','HTTP 404'],['broken.json','加载失败'],['wrong.json','数据结构错误']]){
          await example.locator(`[data-file="${file}"]`).click();await example.waitForFunction(text=>document.querySelector('#status').textContent.includes(text),result);
        }
      }
      if(spec.id==='web-quality'){await example.locator('#add').click();assert.equal(await example.locator('#count').textContent(),'当前数量：1');}
      for(const width of [320,375,768,1280]){await example.setViewportSize({width,height:960});assert(await example.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),spec.id+' example overflow '+width);}
      report.push({id:spec.id,status:'passed',checks:spec.checks.length});
    }
    assert.deepEqual(errors,[]);assert.deepEqual(exampleErrors,[]);
    fs.writeFileSync(path.join(qa,'knowledge-example-results.json'),JSON.stringify(report,null,2));
    console.log(`PASS: 24 detailed topics × 7 widths, all 42 course mappings, focus/copy/progress, runnable examples and failure boundaries; file:// ${process.env.SITE_HTTP_ONLY==='1'?'explicitly skipped':'checked'}.`);
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
