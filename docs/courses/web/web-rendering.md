# HTML 从哪里来：静态页、模板与 API

观察初始 HTML 和请求后的页面变化，理解服务器返回 HTML 与返回 JSON 的区别。

## 先看响应原文，再看当前 DOM

**服务器发来的 HTML 原文，和 JavaScript 修改后的 DOM，可能不同。** Network 的 Response（响应）保留本次服务器发送的内容；Elements（元素）展示浏览器当前的文档树。查看哪一段从哪里来时，不能只看最后屏幕。

本例 type=module 来自前面的模块章节，它允许在模块顶层使用 await；这里没有外层 async 函数，仍可以等待 fetch 和 json()。role=status 是给辅助技术说明这一段用于状态变化，不会替你发请求或保存数据。

所谓 API（应用编程接口）是供程序调用的一套操作约定。本节的 HTTP API 指网页以约定地址请求 JSON 的服务；fetch 本身也是浏览器提供的 API，但它是“发送请求的工具”，不是被请求的后端。区分工具和服务，才能知道错误发生在哪一边。

SSR 是服务器处理请求时生成 HTML；CSR 是浏览器程序根据数据生成或更新界面；静态 HTML 则可在写作或构建时预先生成。后端可以用 Go 或其他语言，但浏览器收到的仍是 HTML/CSS/JavaScript 等资源。选择另一门后端语言不是编写 HTML 的前提。

### 就地练习：两个工具看两种内容

对照index响应和Elements，标出等待文字与最终数据分别来自哪里。

### 参考核对：两个工具看两种内容

初始HTML响应保留等待文字；最终数据来自JSON请求并写入DOM，源文档不会回写。

## 用同一个页面观察两个来源

本节用两个本地文件模拟服务器响应，不连接数据库。先学过 [fetch](#/learn/web/web-fetch) 和 [DOM](#/learn/web/web-dom)；如果你从 Go 路线跳过来，先补这两节。

在独立目录新建 `index.html`：

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>两种内容来源</title>
</head>
<body>
  <h1>初始 HTML 中的学习记录</h1>
  <p>这一行打开页面就已经存在。</p>
  <!-- 这句等待文字已在初始 HTML 中；随后脚本才可能替换它。 -->
<p id="result" role="status">等待 JavaScript 请求数据</p>
  <script type="module">
    const result = document.querySelector('#result');
    try {
      // 第二次请求单独取得 JSON，不改变服务器已经发送的 HTML 原文。
const response = await fetch('./data.json');
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      if (typeof data.title !== 'string') throw new Error('title 必须是字符串');
      // 这次赋值修改当前 DOM，因此 Elements 中的文字会与初始响应不同。
result.textContent = data.title;
    } catch (error) {
      result.textContent = '读取失败：' + error.message;
    }
  </script>
</body>
</html>
```

同一目录新建 `data.json`：

```json
{"title":"JavaScript 请求后填入的记录"}
```

用 VS Code 的 Live Server 打开 `index.html`，地址应以 `http://` 开头。不要直接双击运行本节文件，`file:` 下的请求可能被浏览器限制。

## 先检查响应，再检查页面

打开开发者工具的 Network 面板，刷新页面。点开 `index.html` 的 Response，可以找到 `h1` 的文字和“等待 JavaScript 请求数据”；点开 `data.json`，能找到另一条记录。

网页最后显示“JavaScript 请求后填入的记录”，但这句话并不在初始 HTML 的正文里。它来自第二次请求，随后通过 `textContent` 写进 DOM。Elements 面板展示变化后的 DOM，Network 的 Response 展示服务器原本发来的内容，两者回答的问题不同。

如果在开发者工具中禁用 JavaScript，再刷新，主标题仍然显示，状态文字则停在等待状态；也不会由这段脚本发起 `data.json` 请求。观察后重新启用 JavaScript。

## 三种生成方式

| 方式 | 服务器发送什么 | 内容主要在哪里组成 |
| --- | --- | --- |
| 静态 HTML | 已经保存好的 HTML 文件 | 作者写文件时，或发布前的构建过程 |
| 服务端模板 | 把数据填进模板后的 HTML | 服务器处理请求时，例如 Go 的 `html/template` |
| 页面请求 API | 初始 HTML、JavaScript，以及后续请求取得的 JSON | 网页中的 JavaScript 收到数据后更新 DOM |

“服务端渲染”（SSR）描述服务器生成 HTML 的方式。“客户端渲染”（CSR）描述由浏览器中的程序组织界面的方式。实际应用可以组合两者：初始内容来自服务器，筛选等交互交给 JavaScript。React 和 Vue 也不意味着只能使用 CSR。

模板用什么后端语言写，不会改变浏览器最终收到的是 HTML 这一点。这个小例子用静态文件模拟 JSON 响应；真正的 Go 实现分别见 [返回 JSON](#/learn/go/go-http-json) 和 [生成 HTML 页面](#/learn/go/go-templates)。

### 就地练习：关闭JS后有什么

为静态HTML、Go模板、网页请求JSON三种路线预测关闭JS后已有正文是否仍能读。

### 参考核对：关闭JS后有什么

静态与服务端已填HTML可读；依赖浏览器请求的数据不会由停用脚本生成。实际可组合两条路线。

## 自己做一次来源判断

只修改 `data.json` 的 `title`，刷新后判断哪部分改变。再修改 HTML 中的 `h1`，判断为什么这次不需要修改 JSON。

### 参考答案

JSON 的变化影响脚本填入的段落；`h1` 在初始 HTML 中，修改它就能改变主标题。浏览器显示的整张页面可能由不同请求的内容共同组成。

## 本节验收

能在 Network 中找到两份响应，说明哪一段文字来自哪里，并解释“服务器返回 JSON”为什么还需要页面代码把它展示出来。能说明 Go 模板与网页 `fetch` 是两条不同的实现路径。

参考：[MDN 客户端与服务端编程](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/First_steps/Client-Server_overview)、[Go Web 应用教程](https://go.dev/doc/articles/wiki/)。

## 独立变式：区分公告与动态菜单的来源

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。只组合已学静态HTML、JSON、fetch和DOM，不要求写未学的Go模板代码。

从空白制作一页：公告文字已经在初始HTML中，午餐菜单从另一个JSON请求后才显示。两者不能存成同一个写死正文。用Network与Elements标明哪些原文来自哪份响应，并解释把同需求换成Go模板时谁填数据。

自查：禁用JS后公告仍在、菜单仍是未读取提示；缺JSON时公告不消失，动态区域明确失败。正常菜单能在JSON响应中找到，而初始HTML响应不含最终菜单文字。Go模板路径应由服务器先填HTML，不能说浏览器执行Go。

## 源文档、当前DOM与索引

查看网页源代码通常看到初始HTML响应，Elements看到脚本运行后的当前DOM。搜索引擎和辅助技术也各有处理阶段，不能仅凭一个浏览器能执行JS就认定所有入口都能看到最终内容。

静态页在构建前或人工写好HTML，服务器模板在请求时填HTML，API方案由脚本请求数据再更新DOM；它们可混用。选择时考虑内容更新、首屏、缓存和交互需求，不把“动态”统一等同于某个前端框架。

### 参考答案：独立实现与验收

menu.json保存 `{"dish":"番茄鸡蛋面"}`，index.html如下，通过本地HTTP启动：

```html
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>独立练习</title>
</head>
<body>
<h1>食堂公告</h1>
<p id="notice">本周三中午开放。</p>
<p id="menu">菜单尚未读取</p>
<script>
const target = document.querySelector("#menu");
async function loadMenu() {
  try {
    const response = await fetch("./menu.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const value = await response.json();
    if (value === null || typeof value !== "object" || typeof value.dish !== "string") throw new Error("菜单字段错误");
    target.textContent = value.dish;
  } catch (error) { target.textContent = `菜单读取失败：${error.message}`; }
}
loadMenu();
</script>
</body>
</html>

```

禁用JS重新打开，公告仍可读、菜单仍是未读取；正常时菜单文字来自menu.json响应。删除菜单文件后公告不消失，动态区域显示失败。Go模板方案则由服务器读取数据填入HTML再发送，浏览器不执行Go。

### 就地练习：屏幕不是来源证据

页面上有菜单文字，能否单凭它证明服务器初始HTML包含菜单？需要查哪份响应？

### 参考核对：屏幕不是来源证据

不能；查HTML的Network响应，另查JSON及脚本更新，屏幕只展示最后组合结果。
