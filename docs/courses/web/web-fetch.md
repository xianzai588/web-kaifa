# fetch、HTTP 状态与 JSON

发起一次本地请求，区分HTTP失败与JSON解析失败。

## 先认识一次 HTTP 请求

HTTP（超文本传输协议）是一套让客户端与服务器交换消息的规则。客户端是发出请求的一方，本节就是浏览器；服务器是正在等待并处理请求的程序，本节由本机 Python 静态服务器提供。**浏览器发请求，服务器回响应；页面、图片和 JSON 都能是被请求的资源。**

打开 http://127.0.0.1:8765/index.html 时，http 是协议，127.0.0.1 是本机地址，8765 是端口（区分这台机器上的服务），/index.html 是资源路径。./data.json 按当前文档地址解析，得到同一服务上的 /data.json；它不是电脑任意位置的文件名。

请求包含方法、目标路径、可选消息头和正文。方法告诉服务器操作意图；GET 用于读取，本例 fetch 只传地址，所以默认 GET，没有需要自己编写的请求正文。响应包含状态码、响应头和正文：状态码说明处理结果；消息头是“名称:值”的附加说明，例如 Content-Type 描述正文格式；正文才是实际 HTML 或 JSON 内容。

| 响应结果 | 表示什么 | 此处怎样处理 |
| --- | --- | --- |
| 200 | 请求成功 | 继续解析 JSON 并检查字段 |
| 404 | 目标资源不存在 | response.ok 为假，显示 HTTP 错误 |
| 500 | 服务器处理失败 | 同样先按 HTTP 失败处理 |
| 连接失败 | 根本没有正常响应，例如服务未启动 | fetch 的 Promise 拒绝，进入 catch |

这里 ok 对 200–299 为真，不代表正文符合业务需求。Response 是浏览器封装的响应对象，status 读数字状态，json() 读取并解析正文；需要 await，因为读取也可能稍后完成。

先建独立目录中的 index.html 与 data.json 并保存；在这个目录的终端执行 `python -m http.server 8765`，通过 http://127.0.0.1:8765/ 打开，Ctrl+C 停止。需要 Python 或按环境教程使用 Live Server。file 地址下没有这份 HTTP 服务，浏览器可能拦截请求。

F12 → Network（网络）→ 刷新 → 点 data.json。Headers 中先看 Request URL、Request Method、Status Code，再看 Response 的 JSON 正文。先读懂这些位置，再学习自定义头；本节不要求盲写任何请求头。

### 就地练习：404是收到响应

为正常JSON、文件不存在、停止服务写出fetch返回/拒绝与后续处理路径。

### 参考核对：404是收到响应

正常与404都可能返回Response，先检查ok；连接失败通常拒绝Promise，进入catch。

## 网络成功、HTTP成功与业务成功

fetch通常只在网络/策略等失败时拒绝Promise，HTTP404或500仍可能正常返回Response，所以先检查response.ok。正文是流，常规json/text消费一次后不能任意再读一次；需要两份时先了解clone及其成本。

跨来源请求还受CORS约束，no-cors并不能让脚本随意读取响应。Cookie是否发送取决于credentials与Cookie规则，后端也必须正确授权。客户端校验改善体验，服务器仍要验证所有输入；浏览器显示“提交成功”必须有真实成功响应。

### 就地练习：格式和字段再分开

依次让data.json为坏JSON、{"title":123}、{"title":"Go"}，记录失败发生在哪一步。

### 参考核对：格式和字段再分开

分别解析失败、形状校验失败、显示成功；HTTP200只通过传输状态这一关。

## 先看一个完整例子

在自己的独立练习文件夹新建 index.html，保存下面完整内容，用浏览器打开。修改后先保存，再刷新。

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>本节小练习</title>
</head>
<body>
<p id="result">加载中</p>
<script>
async function load() {
  const result = document.querySelector("#result");
  try {
    // 默认发送 GET；等待服务器响应，得到 Response 对象，不是最终 JSON 数据。
const response = await fetch("./data.json");
    // 404/500 仍是 HTTP 响应，fetch 通常不会自动因它们拒绝。
if (!response.ok) throw new Error(`HTTP ${response.status}`);
    // 异步读取响应正文并解析 JSON；格式错误在这里进入 catch。
const data = await response.json();
    if (data === null || typeof data !== "object" || typeof data.title !== "string") throw new Error("title不是字符串");
    // 格式和字段都通过检查后，才将服务器数据当文字显示。
result.textContent = data.title;
  } catch (error) { result.textContent = `失败：${error.message}`; }
}
load();
</script>
</body>
</html>
```

data.json完整内容：

```json
{"title":"活动数据"}
```

在自己的示例目录运行 python -m http.server 8765，访问 http://127.0.0.1:8765/。Ctrl+C停止服务。

## 逐步读懂这个例子

另建data.json并通过本地HTTP服务打开例子，不能假设file://允许fetch。先等待响应、检查状态、解析JSON、核对字段类型，再将文字显示到result。不同步骤失败有不同原因。

## 自己改一处再观察

将data.json改名制造404，再写坏JSON，再把title改成数字，每次只改一个条件。

### 参考答案

三种失败分别来自HTTP状态、JSON格式、业务字段类型。恢复正确文件后得到活动数据。

参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。

参考：[MDN HTTP 概览](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview)、[MDN 使用 Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)。

## 独立变式：读取另一种资源形状

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。使用已学HTTP、async/await、JSON和DOM；不用POST或自定义头。

从空文件准备 book.json，内容是一条具有 name 字符串和 pages 数字的书籍对象。网页发真实本地GET，自己验证形状后显示“算法手记 / 120页”，失败时显示读取失败而不显示伪造正常值。

自查：200且有效字段时正确显示两字段；文件缺失为HTTP404；坏JSON为解析失败；合法的null、数组或pages为字符串都不能当合法书籍。用Network核对路径和正文，不能只是把原例的title改名就省掉新字段校验。

### 参考答案：独立实现与验收

book.json与index.html放在同目录，通过本地HTTP访问。book.json完整内容：

```json
{"name":"算法手记","pages":120}
```

index.html：

```html
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>独立练习</title>
</head>
<body>
<h1>书籍资源</h1>
<p id="status" role="status">正在读取</p>
<script>
const status = document.querySelector("#status");
async function load() {
  try {
    const response = await fetch("./book.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const book = await response.json();
    // JSON合法仍可能是null、数组或错误字段，完整校验后才更新成功界面。
    if (book === null || typeof book !== "object" || Array.isArray(book)
        || typeof book.name !== "string" || typeof book.pages !== "number"
        || !Number.isFinite(book.pages) || book.pages < 0) throw new Error("书籍字段不合格");
    status.textContent = `${book.name} / ${book.pages}页`;
  } catch (error) { status.textContent = `读取失败：${error.message}`; }
}
load();
</script>
</body>
</html>

```

200且字段合格显示“算法手记 / 120页”；缺文件显示HTTP404；坏JSON显示解析失败；null、数组或文字页数显示字段不合格。失败不回填伪造数据。
