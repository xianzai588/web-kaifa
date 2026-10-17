# 状态、筛选与渲染

让搜索结果和数量来自同一份筛选结果。

## 从输入到筛选，再到两个显示位置

本页原始数据是 events 数组；当前输入文字是查询状态；found 是由二者计算出的结果。**结果数量和列表都必须读同一份 found，不能各算一套。**

query 是 input 元素对象，query.value 读取它当前的输入文字；trim() 去掉边界空白。`title.includes(keyword)` 判断标题是否包含关键词，返回布尔值，交给 filter 决定保留。`title => ...` 是前面 map 节解释的箭头函数，只有表达式时隐式返回结果。

render 一次做四步：读取输入 → 筛选得到 found → 写 found.length → 清空旧列表并逐项创建 li。input 事件在用户改变内容时调用 render；文件最后主动调用一次 render，是为初始化显示，不需要等第一次输入。

空字符串被所有标题 includes 匹配，因此清空输入显示全部两项。“编程”显示一项，“不存在”显示零项。前面说的“状态”不要求一定是一个名为 state 的对象：这里 input.value 就承载当前查询。以后框架会把这个来源与更新流程组织到组件里。

### 就地练习：一个结果更新两处

给查询“编程”、无命中、空串分别写数量和列表，再实际输入。

### 参考核对：一个结果更新两处

依次1、0、2项，数量与行数都来自同一found；清空显示全集。

## 原始状态与派生显示

源数据和查询词是状态，结果列表与数量是按它们算出的派生值。一次render先算出同一份filtered，再用它更新数量和所有行；不要把页面旧数字当新的数据来源。

输入事件input会随用户编辑触发，change通常在提交修改或失焦等时机发生，按需求选。空查询应有明确规则；大小写、两端空白和是否保留原数据都先定义，再写filter。后续异步请求还要加入时间顺序保护，不能把同步筛选的正确性直接推广到网络。

### 就地练习：别把旧显示当状态

若只更新列表而数量不变，应该从DOM旧数量再加减，还是由同一筛选结果重新计算？

### 参考核对：别把旧显示当状态

由同一派生结果重算；旧显示可能过期，不应成为第二套数据来源。

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
<label for="query">搜索活动</label><input id="query">
<p id="count"></p><ul id="list"></ul>
<script>
const events = ["编程交流", "读书会"];
const query = document.querySelector("#query");
const count = document.querySelector("#count");
const list = document.querySelector("#list");
// 把读取、筛选、数量与列表更新集中到一次渲染中。
function render() {
  // 根据当前输入推导结果；原 events 不会被删除元素。
const found = events.filter(title => title.includes(query.value.trim()));
  count.textContent = `找到 ${found.length} 项`;
  // 先移除上次列表，防止新旧结果重复堆积。
list.replaceChildren();
  for (const title of found) {
    const li = document.createElement("li");
    li.textContent = title;
    list.append(li);
  }
}
// 用户输入变化时才调用 render，登记时传函数而不是 render()。
query.addEventListener("input", render);
// 启动时先渲染一次，让空查询显示全部项目。
render();
</script>
</body>
</html>
```

## 逐步读懂这个例子

render先取得查询，再得到found。数量与列表都读found，因此保持一致。input在输入内容变化时触发，启动时调用render显示全部。空字符串被includes匹配，所以清空后显示全部。

## 自己改一处再观察

验证“编程”、不存在的关键词、清空输入，记录数量与列表是否同步。

### 参考答案

原例查“编程”、不存在关键词、空查询，应依次1、0、2项。数量与行数从同一筛选结果计算，每轮先清空旧列表。

参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。

## 独立变式：按书名筛选并显示页数

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。使用已学对象数组、filter、输入事件、DOM创建和统一render；不请求服务器。

独立准备三条书籍对象：算法笔记120页、Go笔记80页、故事集60页。页面有查询输入、结果数量和包含书名/页数的列表；空查询显示全部。数据不从DOM文字反算。

自查：查“笔记”显示2项及120/80页；查不存在的词为0项；清空为3项，每次数量和行数相等。故意只更新列表不更新数量，发现显示不同步后自行集中到同一派生结果，不能为修数字再写第二套筛选。

### 参考答案：独立变式

源数据不从DOM反推。includes(空字符串)为true，所以清空查询显示全部三项。只运行一次filter，数量与列表保持同一来源。

下面是完整 index.html，保存后用浏览器打开；需要服务器时按本节启动说明运行。

```html
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>独立练习</title>
</head>
<body>
<h1>书籍筛选</h1>
<label for="query">书名</label><input id="query">
<p>数量：<output id="total"></output></p>
<ul id="books"></ul>
<script>
const books = [{ name: "算法笔记", pages: 120 }, { name: "Go笔记", pages: 80 }, { name: "故事集", pages: 60 }];
const query = document.querySelector("#query");
const list = document.querySelector("#books");
const total = document.querySelector("#total");
function render() {
  const keyword = query.value.trim();
  // 一次计算供数量和列表共同使用，避免两个位置采用不同筛选结果。
  const filtered = books.filter(book => book.name.includes(keyword));
  total.textContent = String(filtered.length);
  list.replaceChildren();
  for (const book of filtered) {
    const item = document.createElement("li");
    item.textContent = `${book.name} / ${book.pages}页`;
    list.append(item);
  }
}
query.addEventListener("input", render);
render();
</script>
</body>
</html>
```
