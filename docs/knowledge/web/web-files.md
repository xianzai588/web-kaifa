# 文件、地址与浏览器：把网页放在正确的位置

你在 VS Code 写出标题，却在浏览器看到旧标题；把页面发给朋友，图片又消失了。问题可能与 HTML 语法无关，而是浏览器打开了另一份文件，或引用地址指向不存在的位置。本课制作一个有首页和关于页的小网站，从地址栏和文件目录建立对应关系。你不需要先学终端命令；能创建文件、保存和打开浏览器就可以开始。

## 把原理一步一步拆开

### 1. 文件、文件夹和扩展名分别是什么
文件保存内容，例如文字、HTML 代码、图片；文件夹组织文件，本身不是网页。`index.html` 的 `index` 是名字，`.html` 是扩展名。浏览器把 HTML 当作页面解析；VS Code 把它当作可以修改的文本。名字相近的 `index.html` 与 `index.html.txt` 是两个不同文件。请在 VS Code 左侧资源管理器看完整文件名，不只根据文件图标判断。

#### 就地练习：扩展名核对

检查自己的页面是否为index.html而非index.html.txt，写出文件和文件夹各承担什么。

#### 参考核对：扩展名核对

文件保存源码，目录组织文件；用完整文件名核对，不只看图标。

### 2. 浏览器显示的是保存后的文件
编辑区中的文字可能还留在内存。标签旁的小圆点表示有未保存修改；Windows 用 Ctrl+S，macOS 用 Command+S。随后在浏览器刷新，它才重新读取磁盘内容。HTML 基础练习没有“先编译再运行”这一步：浏览器负责读取并解析。浏览器的 Elements 面板显示解析后的 DOM，查看页面源代码显示收到的 HTML；两者并非永远逐字相同。

#### 就地练习：先保存再刷新

改标题暂不保存再刷新，之后保存刷新，对比两次结果；自动保存时先暂停它。

#### 参考核对：先保存再刷新

未保存时仍是磁盘旧版；保存后刷新才读取新内容，Console临时代码也不会回写文件。

### 3. 相对路径必须从引用文件出发
首页引用 `./assets/style.css`：从首页所在文件夹进入 assets，再找 style.css。关于页已经在 pages 里面，引用同一份样式要用 `../assets/style.css`：先离开 pages 到上一级，再进 assets。`./` 表示当前目录，`../` 表示上一层。页面的 href、src 与 stylesheet 的 href 通常从页面地址解析；外部 CSS 的 `url(...)` 则相对于那份 CSS 文件。不要把桌面盘符路径写进要发给别人使用的网页。

#### 就地练习：从关于页引用样式

pages/about.html与assets/style.css共享一个根目录，写出关于页的样式路径。

#### 参考核对：从关于页引用样式

../assets/style.css；外部CSS中的url则相对CSS本身，不要从页面位置误算。

### 4. file 与 HTTP 是两种读取方式
双击页面时，地址通常以 `file:///` 开始，表示浏览器读本机文件。本地服务器地址如 `http://127.0.0.1:8743/`，表示浏览器给本机服务器发送 HTTP 请求，再显示返回的文件。它不是自动发布到互联网。本例两种方式都能运行；后续 fetch 练习要用 HTTP，因为直接读取本地 JSON 受到浏览器的安全限制。

#### 就地练习：本机HTTP不是公网

分别记录file和127.0.0.1的页面地址，解释给另一台电脑直接发回环地址会找谁。

#### 参考核对：本机HTTP不是公网

file读本机磁盘，回环HTTP访问当前电脑上的服务；对方回环地址指对方自己。

### 5. 哪些地址会立即请求，哪些等待点击
页面引用link样式表与img图片时，浏览器通常在加载过程中请求资源。a的href提供导航目的地，通常要用户激活链接后才导航，不应把“HTML中出现三个地址”误说成“初次加载一定有三次请求”。实际浏览器可能有预加载机制，但本例没有要求预取链接页面。用Network分别记录打开首页与点击链接后的请求，可以直接验证区别。

#### 就地练习：点击前后分开记录

在Network记录首次加载与点击关于链接后的请求；哪些地址只是等待操作的目标？

#### 参考核对：点击前后分开记录

样式等资源通常加载时取，a的目标通常在激活后导航；出现href不等于已请求其页面。

## 在 VS Code 中创建、保存与运行

1. 在自己的练习目录里新建 `web-files` 文件夹，例如放在 `exercises/web/` 下；不要在 materials 原教材中覆盖文件。打开 VS Code，选择“文件 → 打开文件夹”，选中这个新文件夹。
2. 在左侧资源管理器用“新建文件”按下面清单创建文件。带 `/` 的名字表示子文件夹，例如 `assets/style.css` 需要 assets 文件夹，不能把斜杠当普通名字。逐个复制对应完整代码，Windows 用 Ctrl+S，macOS 用 Command+S 保存全部文件。
3. 在 VS Code 资源管理器中右键 index.html，选择“在文件资源管理器中显示”（macOS为Finder），然后双击该文件用浏览器打开。浏览器显示页面，VS Code负责编辑；不要只点编辑器的播放图标，也无需编译HTML。每次修改先保存，再回浏览器刷新。

文件清单：

- `index.html`
- `assets/style.css`
- `pages/about.html`


## 完整可运行示例

### 完整文件：index.html

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>文件与路径练习</title>
    <link rel="stylesheet" href="./assets/style.css">
  </head>
  <body>
    <h1>周末编程社</h1>
    <p>蓝色标题说明外部样式文件已加载。</p>
    <a href="./pages/about.html">认识我们</a>
  </body>
</html>
```

### 完整文件：assets/style.css

```css
body {
  max-width: 40rem;
  margin: 2rem auto;
  padding: 1rem;
  font-family: sans-serif;
  line-height: 1.7;
}
h1 {
  color: #164e80;
}
```

### 完整文件：pages/about.html

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>关于我们</title>
    <link rel="stylesheet" href="../assets/style.css">
  </head>
  <body>
    <h1>关于周末编程社</h1>
    <p>每周一起写一个小程序。</p>
    <a href="../index.html">返回首页</a>
  </body>
</html>
```

## 具体结果与解释

```output
首页显示蓝色“周末编程社”和“认识我们”链接。点击链接进入关于页，地址末尾变成 pages/about.html；点击“返回首页”回到 index.html。两个页面的标题都是蓝色。
```

`head` 中的 link 把样式地址交给浏览器，不能只创建 CSS 文件而忘记引用它。style.css 的 h1 规则把标题设为蓝色，body 规则让正文有间距。首页 a 的 href 指向 pages/about.html；关于页的 `../index.html` 返回上级的首页。注意关于页样式地址比首页多一个 `../`，这正是文件位置不同带来的变化。

再做一次可验证的修改：把首页 h1 改为“我的第一个网站”，保存、刷新。只首页变化而关于页不变，说明它们是独立 HTML 文件；把 style.css 的颜色改为 `#8e3b25`，两页都会变化，说明它们共享样式文件。

## 两种常见问题与排查顺序

### 情况一：改了代码，页面没有变化
先看编辑标签是否有未保存圆点，再核对浏览器地址是不是当前文件。不要同时打开“下载”文件夹与练习文件夹中的同名页面。可临时把标题改成“路径核对 123”，保存并刷新；仍看不到就说明打开位置需要核对。用地址栏末尾、VS Code 的文件路径作为证据，不靠反复重启猜原因。

### 情况二：首页有颜色，关于页没有颜色
优先检查关于页 link 的 href。如果写成 `./assets/style.css`，浏览器会查找 pages/assets/style.css，而那里没有文件。用浏览器开发者工具的 Network 查看实际请求地址；HTTP 模式下常看到 404，file 模式下可能出现文件不存在。改成 `../assets/style.css` 后刷新，再确认请求成功。也要保持文件名大小写一致，因为部署服务器的文件系统可能区分大小写。

## 变化练习

新增 pages/rules.html，显示“社团约定”，引用同一份 style.css，并提供返回首页链接。先在纸上写出两个相对地址，再创建文件。不要复制本机绝对路径。

### 参考答案

规则页位于 pages，所以样式地址是 `../assets/style.css`，首页链接是 `../index.html`。从 index.html 跳到规则页则使用 `./pages/rules.html`。验证时既要点进去，也要点回来；只证明页面能打开，没有证明链接方向正确。

## 本课自查

- 为什么在 VS Code 修改文件后还要保存和刷新？
- 同一份 CSS 为什么从两份 HTML 引用时地址不同？
- 地址栏中的 file 与 http 各说明什么？
- 如果网页请求 404，你能记录实际请求路径而不是只说“打不开”吗？

能运行示例是起点，不等于已经学完。请先遮住参考答案，预测变化结果，再独立修改并记录实际结果。如果仍有问题，向AI提供目标、文件结构、自己的代码、具体操作、期待与实际结果、已尝试步骤；让它先定位最小问题，再自己验证修改。

## 继续查证

- [MDN：组织文件与相对路径](https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Environment_setup/Dealing_with_files)
- [VS Code：HTML 编辑支持](https://code.visualstudio.com/docs/languages/html)
