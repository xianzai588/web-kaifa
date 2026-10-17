# 调试、Git与交付：让别人按步骤得到同一结果

你做出一个计数页面，说“我这里能运行”，但别人打开后按钮无效。差异可能是缺文件、旧脚本、路径大小写或未保存修改。工程习惯的目标，是把偶然成功变成可重现结果，并能解释和恢复改动。本课用一个三文件计数页面练习浏览器证据、Git差异与验收说明。已知限制是纯静态本地示例，无后端、无账户、无持久化；刷新计数回0是本例设计，不是数据保存已经实现。

## 把原理一步一步拆开

### 1. 复现需要触发、预期与实际
“按钮坏了”不足以定位。先写浏览器地址、操作顺序、点击次数、期待结果与实际结果。示例正常应从0开始，点一次变1，再点变2；刷新回0。如果一次变2，检查事件是否重复绑定；若一直0，检查脚本是否加载、监听是否执行。每次只改变一个假设，避免同时修路径、变量与HTML后却不知道哪一步有用。

#### 就地练习：写出可重放步骤

把“按钮坏了”改成包含地址、点击次数、预期与实际的四项问题。

#### 参考核对：写出可重放步骤

例如HTTP地址、点一次、预期1、实际0；加浏览器与日志后才便于定位。

### 2. 浏览器三个面板各找不同证据
Elements回答元素是否存在、id是什么、样式最终怎样；Console回答脚本语法与运行错误；Network回答文件是否请求、实际URL与状态、拿到的是不是预期内容。页面正常显示HTML不代表main.js加载成功。不要只截Console最后一句，要保留具体错误文本、文件名、行号和触发步骤，再回VS Code对应位置修改。

#### 就地练习：分面板取证

标题可见按钮无效，分别在Network、Console、Elements查什么？

#### 参考核对：分面板取证

查脚本实际响应、首个错误及行号、目标id和节点是否存在，不只看HTML已显示。

### 3. Git记录工作树、暂存区与提交
工作树是你当前文件内容；git add把所选内容放入暂存区；git commit创建本地历史记录。status说明文件状态，diff看未暂存改动，diff --staged看即将提交的差异。保存文件不会自动Git提交，Git提交也不会自动上传或部署。一个提交应能说明一个明确改动，首次使用还需单独安装Git并配置身份；本课不强制零基础在第一个HTML前学完Git。

#### 就地练习：暂存不随编辑更新

暂存版本A后改B但不add，写commit保存哪版并用diff/staged核对。

#### 参考核对：暂存不随编辑更新

记录A，未暂存差异仍为A到B；保存文件不是自动提交。

### 4. 提交与恢复要知道范围
提交前只加入你检查的文件，避免直接add全部导致资料、密码或生成产物混入。想查看过去版本可以先用git show，不必立刻覆盖现有文件。任何会丢弃未提交工作的方法都要先保存或备份，不能靠记住一个reset命令解决所有问题。本例建议在自己的独立练习目录做Git练习，不改学习资料仓库已有历史。

#### 就地练习：先查看历史

需要看旧版时先用git show，解释为何不先丢弃未提交工作。

#### 参考核对：先查看历史

只读查看不覆盖当前文件；任何恢复都先保留现场并确认范围，避免丢数据。

### 5. 交付文档描述已实现与未实现
README应写所需软件、文件清单、启动方式、具体可验证结果与限制。静态托管可以提供HTML/CSS/JS，不能自动成为Go服务的运行环境；后端位置、API地址与跨域要求要另外说明。上线后仍需核对资源路径与大小写，并从真实发布地址验收，不能把本机截图当线上证据。

#### 就地练习：交付边界写清

为此静态计数例子写刷新后行为和未实现项各一条。

#### 参考核对：交付边界写清

刷新回0，无后端/账户/持久化；发布后还需真实地址验收，不写成已保存服务。

## 在 VS Code 中创建、保存与运行

1. 在自己的练习目录里新建 `web-quality` 文件夹，例如放在 `exercises/web/` 下；不要在 materials 原教材中覆盖文件。打开 VS Code，选择“文件 → 打开文件夹”，选中这个新文件夹。
2. 在左侧资源管理器用“新建文件”按下面清单创建文件。带 `/` 的名字表示子文件夹，例如 `assets/style.css` 需要 assets 文件夹，不能把斜杠当普通名字。逐个复制对应完整代码，Windows 用 Ctrl+S，macOS 用 Command+S 保存全部文件。
3. 在 VS Code 资源管理器中右键 index.html，选择“在文件资源管理器中显示”（macOS为Finder），然后双击该文件用浏览器打开。浏览器显示页面，VS Code负责编辑；不要只点编辑器的播放图标，也无需编译HTML。每次修改先保存，再回浏览器刷新。

文件清单：

- `index.html`
- `style.css`
- `main.js`


## 完整可运行示例

### 完整文件：index.html

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>调试与交付验收</title>
    <link rel="stylesheet" href="./style.css">
  </head>
  <body>
    <main>
      <h1>调试与交付验收</h1>
      <p>点击按钮应使数量加一。</p>
      <button id="add" type="button">增加一次</button>
      <p id="count" role="status">当前数量：0</p>
    </main>
    <script src="./main.js">

    </script>
  </body>
</html>
```

### 完整文件：style.css

```css
*{
  box-sizing:border-box
}
body{
  margin:0;
  font:1rem/1.7 sans-serif
}
main{
  max-width:40rem;
  margin:1rem auto;
  padding:1rem
}
button{
  padding:12px;
  max-width:100%;
  white-space:normal
}
button:focus-visible{
  outline:3px solid #164e80;
  outline-offset:3px
}
```

### 完整文件：main.js

```javascript
let total = 0;
const button = document.querySelector('#add');
const output = document.querySelector('#count');
button.addEventListener('click', () => {
  total += 1;
  output.textContent = `当前数量：${total}`;
});
```

## 具体结果与解释

```output
页面初始“当前数量：0”；点击一次变1，再点变2。仅用Tab聚焦按钮并按Enter也能增加一次。刷新回0；Network中的style.css与main.js地址应与文件名一致。
```

index.html引用style.css和main.js，两个文件都必须与它同目录。main.js将total保存在本页内存，每次click加1并更新文本。脚本位于body末尾，能找到前面按钮与输出节点。CSS提供可读正文和焦点轮廓，不参与数字计算。

制造一个安全可撤销的故障：只把HTML脚本地址改main-typo.js，保存刷新，记录Network错误；再恢复main.js验证按钮。另一个故障是把脚本querySelector('#add')改'#adds'，查看Console具体null错误；恢复后按同一点击顺序复测。这比随意删一大块代码更能训练定位层次。

可选Git步骤只在你新建的独立练习目录进行。先在终端运行git --version确认已安装；首次提交前设置名字与邮箱，若只想影响本练习，可在git init后用 `git config user.name "你的名字"` 与 `git config user.email "你的邮箱"`，不加--global。这些身份会进入提交记录，请填写愿意记录的信息。为目录创建.gitignore，按实际产生的内容忽略node_modules/、.env、编译产物等；本例没有依赖，不必为了练习制造这些目录。运行git status检查范围，git add列出三个源码与README，再用git diff --staged逐项看。没有账号与远端时依然能创建本地提交，不需要先注册平台。

## 两种常见问题与排查顺序

### 情况一：本机正常，发布后无样式
核对线上实际请求路径与大小写，例如style.css与Style.css是否不同；本机某些文件系统忽略大小写，服务器未必如此。再确认资源确实随站点发布。若HTML新了、JS旧了，核对缓存与资源版本，不要通过清空用户学习记录解决静态资源问题。

### 情况二：提交完成却认为网站已发布
git commit只创建本地历史；push是上传Git远端；站点发布是另一流程，可能由CI自动触发，也可能需要托管设置。分别查看实际结果。不要把未完成的后台保存、登录或部署写成已经实现。修复后也要检查原有键盘、窄屏、错误路径，不能只证明新按钮能点。

## 变化练习

为计数页面写5行README，包含启动方式、0→1→2验证、键盘验证、刷新归零与无后端限制。可选：在新建独立练习目录初始化Git，记录“新增计数页”的本地提交。

### 参考答案

README可以写：1）用VS Code打开本目录；2）保存三文件，双击index.html；3）两次点击得到1与2；4）Tab聚焦按钮、Enter可增加，刷新归0；5）只本地内存，不保存到服务器。若已安装Git，在独立练习目录运行git init、git status、git add index.html style.css main.js、git diff --staged，检查后再commit。没有完成发布就不要填写“线上已验收”。

## 本课自查

- Elements、Console、Network分别定位哪种问题？
- 保存、暂存、提交、上传与发布有什么区别？
- 你能给出别人可复现的触发和结果吗？
- 刷新归零是否说明本例数据库坏了？
- 哪些结果需要从线上真实地址重新验证？

能运行示例是起点，不等于已经学完。请先遮住参考答案，预测变化结果，再独立修改并记录实际结果。如果仍有问题，向AI提供目标、文件结构、自己的代码、具体操作、期待与实际结果、已尝试步骤；让它先定位最小问题，再自己验证修改。

## 继续查证

- [MDN：浏览器开发者工具](https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Tools_and_setup/What_are_browser_developer_tools)
- [Git官方：入门教程](https://git-scm.com/docs/gittutorial)
- [VS Code：Git集成](https://code.visualstudio.com/docs/sourcecontrol/overview)
