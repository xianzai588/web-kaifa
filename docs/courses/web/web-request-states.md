# 加载、成功、空结果与失败

让一次请求的结果对应清晰界面状态。

## 状态要跟着真实结果走

**请求已发出只表示加载中；取得合法结果后才叫成功。** 本例重新读取时先写加载中并清掉旧列表，避免失败之后还显示一份像刚刷新过的数据。成功但数组为空是空结果，不是断网或服务器错误。

`Array.isArray(events)` 判断解析值是不是数组；`events.some(x=>typeof x!=="string")` 判断是否至少有一项不是字符串。两者用 || 连接，任一坏条件成立就抛出错误；短路逻辑保证非数组不会继续调用它的 some。

`条件 ? 真时的值 : 假时的值` 是三元条件表达式。events.length 不为 0 时选择成功计数，为 0 时选择没有活动；这里利用 0 被判断为假、正数为真。它只产生一个值，真正把文字写进页面的是 textContent 赋值。

在独立目录保存 index.html 与 events.json，终端在该目录运行 `python -m http.server 8765`，访问 http://127.0.0.1:8765/，Ctrl+C 停止。Network 里临时选择慢速连接，再点重新读取，才能清楚看见加载过程。恢复正常速度后分别测试两项、[]、{}、[1] 和丢失文件，记录状态和 li 数量。重叠点击属于下一节的新问题。

### 就地练习：空结果不是失败

为两项数组、[]、{}、[1]分别预测状态和列表数量，逐项刷新验证。

### 参考核对：空结果不是失败

两项成功2行；空数组合法空结果0行；对象及数字项数组是形状失败，不回填假正常数据。

## 状态转换与旧列表的含义

开始加载时要决定清空旧列表还是标注为旧数据，不能仍把旧列表称为最新结果。成功且空数组是有效的空状态，格式坏或HTTP失败是错误状态，两者的提示与下一步操作不同。

本课顺序请求可检验加载、成功、空、失败；连续点击还会引入完成顺序问题。按钮禁用可限制操作，但不替代组件卸载或新请求启动时的旧结果保护，下一课专门验证时间边界。

### 就地练习：旧数据怎样标识

发起重新读取时若选择保留旧列表，应增加什么提示？请求失败后能否仍称它最新？

### 参考核对：旧数据怎样标识

应明确旧数据与正在刷新；失败不能把旧内容当此次成功。清空或保留都需一致的状态合同。

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
<button id="reload" type="button">重新读取</button>
<p id="status"></p><ul id="list"></ul>
<script>
const status = document.querySelector("#status");
const list = document.querySelector("#list");
async function load() {
  // 每次开始先显示尚未取得结果，不提前声称成功。
status.textContent = "加载中";
  // 移除旧列表，失败时不会把旧内容误当最新结果。
list.replaceChildren();
  try {
    const response = await fetch("./events.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const events = await response.json();
    // 先确认数组，再确认每项是字符串；JSON 合法不代表形状正确。
if (!Array.isArray(events) || events.some(x => typeof x !== "string")) throw new Error("数据形状错误");
    // 合法空数组也是成功结果，但显示独立的空状态。
status.textContent = events.length ? `成功：${events.length} 项` : "没有活动";
    for (const title of events) { const li = document.createElement("li"); li.textContent = title; list.append(li); }
  } catch (error) { status.textContent = `失败：${error.message}`; }
}
document.querySelector("#reload").addEventListener("click", load);
load();
</script>
</body>
</html>
```

events.json完整内容：

```json
["编程交流","读书会"]
```

通过 python -m http.server 8765 在本地HTTP地址打开。

## 逐步读懂这个例子

每次先清旧列表，显示加载。合法数组才进入成功或空结果，失败不会保留一份看似最新的旧列表。some检查是否有不符合类型的项。本例先完成单次流程，重叠请求问题在下一节处理。

## 自己改一处再观察

将events.json分别设为两项、空数组、错误对象，观察状态与列表。

### 参考答案

两项成功并有列表；空数组显示没有活动；对象被判为形状错误。

参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。

## 独立变式：书籍清单的四种状态

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。使用对象数组验证、单次请求、状态文字和DOM列表；重叠控制留给下一章，不夸大此题覆盖它。

独立写一本地清单读取页，每本书有 name 文字和 pages 数字。先定义未操作/加载、正常、空数组、坏字段及HTTP失败的界面目标；数量与列表来源必须相同。每次等请求结束再进行下一次。

自查：正常两书显示2行且数量2；空数组明确无书而非失败；坏字段/404显示失败且不留假最新列表；限速时能看到加载。此题不证明连续点击也正确，完成后去[重叠请求](#/learn/web/web-cancel-request)验证新的时间边界。

### 参考答案：独立实现与验收

本独立版启动后只读取一次，改books.json后刷新来逐项验收；没有把重复点击并发也算成已经支持。books.json先写：

```json
[{"name":"算法笔记","pages":120},{"name":"Go笔记","pages":80}]
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
<h1>书籍清单</h1>
<p id="status" role="status"></p><ul id="books"></ul>
<script>
const status = document.querySelector("#status");
const list = document.querySelector("#books");
async function load() {
  status.textContent = "正在加载";
  // 本版选择先清旧结果；本次失败时不把旧列表伪装成最新成功。
  list.replaceChildren();
  try {
    const response = await fetch("./books.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const books = await response.json();
    if (!Array.isArray(books) || !books.every(book => book !== null && typeof book === "object"
        && !Array.isArray(book) && typeof book.name === "string"
        && typeof book.pages === "number" && Number.isFinite(book.pages) && book.pages >= 0)) throw new Error("书籍字段不合格");
    for (const book of books) {
      const item = document.createElement("li");
      item.textContent = `${book.name} / ${book.pages}页`;
      list.append(item);
    }
    status.textContent = books.length === 0 ? "没有书籍" : `共${books.length}本`;
  } catch (error) { status.textContent = `读取失败：${error.message}`; }
}
load();
</script>
</body>
</html>

```

正常显示2行及共2本；改成[]显示没有书籍，改成对象或坏字段显示失败且无假最新列表。Network限速时能看到正在加载。
