/* Tutorial routes, prompting workflow, offline rendering and real example smoke checks. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),qa=path.join(root,'.qa');
const BASE=process.env.SITE_TEST_URL||'http://127.0.0.1:8743/';
(async()=>{
  fs.mkdirSync(qa,{recursive:true});
  const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'msedge',headless:true});
  try{
    const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']});
    const page=await context.newPage(),errors=[],external=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(BASE))external.push(r.url());});
    await page.goto(BASE+'#/setup');await page.locator('.setup-article').waitFor();
    const baseline=await page.evaluate(()=>localStorage.getItem('web-kaifa-study-v1'));
    const go=async topic=>{await page.evaluate(x=>location.hash='/setup?topic='+x,topic);await page.locator(`.setup-nav [href="#/setup?topic=${topic}"][aria-current="page"]`).waitFor({state:'attached'});};
    const openReaderMenu=async()=>{const menu=page.locator('#menu-toggle');if(await menu.isVisible()&&await menu.getAttribute('aria-expanded')==='false')await menu.click();};
    for(const width of [320,375,414,768,1024,1280,1440]){
      await page.setViewportSize({width,height:1000});
      for(const topic of ['editor','web','go','ask']){
        await go(topic);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),topic+' overflow '+width);
        assert(await page.locator('.setup-article h2').count()>=4,'complete guide');
        assert.equal(await page.locator('main h1').count(),1);
        if(topic==='go')assert(await page.locator('code.language-output').count()>0);
        const outputs=page.locator('.setup-code:has(code.language-output)');
        assert.equal(await outputs.locator('button').count(),await outputs.count(),'every expected output has a copy control');
        for(const label of await outputs.locator('button').allTextContents())assert.equal(label,'复制输出','output copy is labelled separately from commands');
        await openReaderMenu();await page.locator('#reader-outline [data-setup-jump]').first().click();
        const target=await page.locator('[data-setup-jump]').first().getAttribute('data-setup-jump');
        assert.equal(await page.evaluate(()=>document.activeElement.id),target,'chapter jump receives keyboard focus');
        const position=await page.locator('#'+target).boundingBox();
        assert(position.y>=68&&position.y<800,'chapter heading is below fixed header');
        if(topic==='go'&&[375,1440].includes(width)){
          await openReaderMenu();
          await page.getByRole('button',{name:'6. 在 VS Code 编译，并启动生成的程序',exact:true}).click();
          await page.screenshot({path:path.join(qa,`tutorial-go-build-${width}.png`)});
        }
      }
    }
    await page.locator('#setup-question-form [type=submit]').click();
    assert.equal(await page.locator('#setup-goal').getAttribute('aria-invalid'),'true');
    await page.locator('#setup-goal').fill('运行自己的程序');
    await page.locator('#setup-actual').fill('go.mod file not found');
    await page.locator('#setup-code').fill('<script>window.injected=true</script>');
    await page.locator('#setup-question-form [type=submit]').click();
    const output=await page.locator('#setup-question-output').textContent();
    assert(output.includes('go.mod file not found')&&output.includes('【待补充'));
    assert.equal(await page.evaluate(()=>window.injected),undefined);
    await page.locator('[data-setup-copy]').click();
    assert.equal((await page.evaluate(()=>navigator.clipboard.readText())).replace(/\r\n/g,'\n'),output);
    await page.locator('#setup-actual').fill('输出发生变化');
    assert.equal(await page.locator('#setup-question-result').isVisible(),false);
    await go('editor');await go('ask');
    assert.equal(await page.locator('#setup-actual').inputValue(),'输出发生变化','worksheet draft survives route changes');
    await page.locator('[data-setup-template]').click();
    assert((await page.evaluate(()=>navigator.clipboard.readText())).includes('预期结果'));
    assert.equal(await page.evaluate(()=>localStorage.getItem('web-kaifa-study-v1')),baseline,'reading and prompting do not alter learning records');
    await page.goto(BASE+'#/search?q=VS%20Code');await page.locator('.setup-search-result').first().waitFor();
    await page.goto(BASE+'#/setup?topic=unknown');assert.equal(await page.locator('main h1').textContent(),'安装 VS Code');
    await page.screenshot({path:path.join(qa,'tutorial-editor-desktop.png'),fullPage:true});
    await page.setViewportSize({width:375,height:900});await go('ask');
    await page.locator('#question-workshop').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(qa,'tutorial-ask-mobile.png')});
    if(process.env.SITE_HTTP_ONLY!=='1'){const filePage=await browser.newPage();await filePage.goto(pathToFileURL(path.join(root,'index.html')).href+'#/setup?topic=go');
    await filePage.locator('.setup-article').waitFor();assert((await filePage.locator('.setup-article').textContent()).includes('go mod init'));}else console.log('SKIP: file:// tutorial rendering (SITE_HTTP_ONLY=1); HTTP interactions and executable examples still run.');
    const html=fs.readFileSync(path.join(root,'docs/tutorials/web-environment.md'),'utf8').replace(/\r\n/g,'\n').match(/```html\n([\s\S]*?)\n```/)[1];
    await go('web');
    const codeCopy=page.locator('.setup-code').filter({has:page.locator('code.language-html')}).first().locator('button');
    await codeCopy.click();
    assert.equal((await page.evaluate(()=>navigator.clipboard.readText())).replace(/\r\n/g,'\n').trim(),html,'copy complete runnable HTML without UI labels');
    const webDir=fs.mkdtempSync(path.join(qa,'tutorial-web-'));
    const webFile=path.join(webDir,'index.html');fs.writeFileSync(webFile,html);
    const sampleURL=file=>process.env.SITE_HTTP_ONLY==='1'?new URL(path.relative(root,file).split(path.sep).join('/'),BASE).href:pathToFileURL(file).href;
    const sample=await browser.newPage();await sample.goto(sampleURL(webFile));
    assert.equal(await sample.locator('h1').textContent(),'这是我的第一张网页');
    await sample.setViewportSize({width:320,height:800});assert(await sample.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    const editedHtml=html.replace('这是我的第一张网页','我今天学会保存和刷新');
    await sample.reload();assert.equal(await sample.locator('h1').textContent(),'这是我的第一张网页','unsaved draft does not change disk file');
    fs.writeFileSync(webFile,editedHtml);await sample.reload();
    assert.equal(await sample.locator('h1').textContent(),'我今天学会保存和刷新');
    assert.equal(await sample.title(),'我的环境检查','h1 edit does not change browser tab title');
    const webSnippets=[...fs.readFileSync(path.join(root,'docs/tutorials/web-environment.md'),'utf8').replace(/\r\n/g,'\n').matchAll(/```html\n([\s\S]*?)\n```/g)].map(x=>x[1]);
    assert.equal(webSnippets.length,2,'two complete Web examples');
    const clickFile=path.join(webDir,'click.html');fs.writeFileSync(clickFile,webSnippets[1]);
    await sample.goto(sampleURL(clickFile));
    await sample.locator('#practice').click();await sample.locator('#practice').click();
    assert.equal(await sample.locator('#result').textContent(),'今天练习了 2 次');
    await sample.reload();assert.equal(await sample.locator('#result').textContent(),'今天练习了 0 次');
    const exampleDir=fs.mkdtempSync(path.join(qa,'tutorial-go-'));
    const code=fs.readFileSync(path.join(root,'docs/tutorials/go-environment.md'),'utf8').replace(/\r\n/g,'\n').match(/```go\n([\s\S]*?)\n```/)[1];
    fs.writeFileSync(path.join(exampleDir,'main.go'),code+'\n');
    execFileSync('go',['mod','init','example.com/setup-check'],{cwd:exampleDir,stdio:'pipe'});
    execFileSync('go',['fmt','./...'],{cwd:exampleDir,stdio:'pipe'});
    assert.equal(execFileSync('go',['run','.'],{cwd:exampleDir,encoding:'utf8'}).trim(),'我能运行自己的 Go 程序');
    const modified=code.replace('我能运行自己的 Go 程序','我今天运行了两次程序');
    fs.writeFileSync(path.join(exampleDir,'main.go'),modified);
    assert.equal(execFileSync('go',['run','.'],{cwd:exampleDir,encoding:'utf8'}).trim(),'我今天运行了两次程序');
    fs.writeFileSync(path.join(exampleDir,'main.go'),modified.replace('fmt.Println','fmt.printLn'));
    let actualError='';
    try{execFileSync('go',['run','.'],{cwd:exampleDir,encoding:'utf8',stdio:'pipe'});assert.fail('expected Go case error');}
    catch(error){actualError=String(error.stderr||'');assert.match(actualError,/undefined: fmt\.printLn/);}
    await go('ask');await openReaderMenu();await page.locator('#reader-outline [data-setup-jump="question-workshop"]').click();
    assert.equal(await page.evaluate(()=>document.activeElement.id),'question-workshop');
    for(const [id,value] of Object.entries({goal:'运行自己的 Go 程序',environment:'Windows / PowerShell，独立练习目录；'+execFileSync('go',['version'],{encoding:'utf8'}).trim(),expected:'go run . 输出我今天运行了两次程序',actual:actualError,code:'main.go\n'+modified.replace('fmt.Println','fmt.printLn'),tried:'保存后重跑，仍然报错'}))await page.locator('#setup-'+id).fill(value);
    await page.locator('#setup-question-form [type=submit]').click();
    assert.equal(await page.evaluate(()=>document.activeElement.id),'setup-question-result','generated question focused and visible');
    const result=await page.locator('#setup-question-result').boundingBox();assert(result.y>=68&&result.y<800);
    assert((await page.locator('#setup-question-output').textContent()).includes(actualError.trim()),'real error retained');
    fs.writeFileSync(path.join(exampleDir,'main.go'),modified);
    assert.equal(execFileSync('go',['run','.'],{cwd:exampleDir,encoding:'utf8'}).trim(),'我今天运行了两次程序','restore one spelling and verify recovery');
    const executable=path.join(exampleDir,process.platform==='win32'?'hello.exe':'hello');
    execFileSync('go',['build','-o',executable,'.'],{cwd:exampleDir,stdio:'pipe'});
    assert.equal(execFileSync(executable,[],{encoding:'utf8'}).trim(),'我今天运行了两次程序');
    fs.writeFileSync(path.join(exampleDir,'main.go'),modified.replace('我今天运行了两次程序','重新构建后才更新'));
    assert.equal(execFileSync(executable,[],{encoding:'utf8'}).trim(),'我今天运行了两次程序','old executable does not read newly saved source');
    execFileSync('go',['build','-o',executable,'.'],{cwd:exampleDir,stdio:'pipe'});
    assert.equal(execFileSync(executable,[],{encoding:'utf8'}).trim(),'重新构建后才更新');
    const goSnippets=[...fs.readFileSync(path.join(root,'docs/tutorials/go-environment.md'),'utf8').replace(/\r\n/g,'\n').matchAll(/```go\n([\s\S]*?)\n```/g)].map(x=>x[1]);
    assert.equal(goSnippets.length,1,'setup guide teaches only one minimal environment-check program');
    // If both clipboard paths fail, keep the question visible for manual selection.
    await page.evaluate(()=>{Object.defineProperty(navigator.clipboard,'writeText',{configurable:true,value:async()=>{throw new Error('denied');}});document.execCommand=()=>false;});
    await page.locator('[data-setup-copy]').click();
    await page.waitForFunction(()=>document.querySelector('#notice')?.textContent.includes('浏览器没有允许复制'));
    assert(await page.locator('#setup-question-output').isVisible());
    assert.equal(await page.evaluate(()=>localStorage.getItem('web-kaifa-study-v1')),baseline,'complete troubleshooting flow leaves course progress unchanged');
    assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
    console.log('PASS: 4 guides × 7 widths, focus/copy/records, real HTML save and click/reset, Go edits/errors/build/stale binary/rebuild; language examples checked by test_course_book, question and recovery.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
