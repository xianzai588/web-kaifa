# 创建列表与安全显示文字

从数组创建li，避免把数据当HTML执行。

## 先创建，再填文字，最后放进页面

`for (const title of titles)` 是 for...of 遍历：每轮从数组取一个值放进 title，数组有两项就执行两轮。它直接取值，与之前用数字索引的 for 写法不同；const 在每轮绑定当前值。

**createElement 只创建节点；append 才把节点放进文档树。** 每轮先创建一个独立 li，再把本轮 title 作为文字放进去，最后追加到已有 ul。不要在循环外只创建一次 li 后反复 append，它会移动同一个节点，不会复制出多项。

本例第二项数据的尖括号也是文字。textContent 不把它解释为标签，所以显示字面上的 `<b>读书会</b>`，页面没有新增 b 元素。innerHTML 则按 HTML 解释内容，只能在清楚控制来源时使用；服务端或用户给的文字优先走 textContent。

`list.replaceChildren()` 不传参数时会清空全部子节点。把这段循环封装成 render 并调用两次，会重复追加四项；先在每次 render 开头清空，再重建，才始终是当前两项。清空只改变当前 DOM，不删除原 titles 数组。

### 就地练习：一个节点不能变两项

在临时副本把createElement移到循环外，只创建一个li后反复append。预测数量并恢复。

### 参考核对：一个节点不能变两项

append移动同一个节点，最后只有一项；每轮新建才有独立条目。

## 一次渲染要决定替换还是追加

createElement创建节点但还没放入文档，append才把它加入容器。多次渲染通常先replaceChildren清掉旧结果，否则每次都追加一份。清空并不代表所有场景都最佳，大列表后续可学增量更新；本课先保证结果对应当前数据。

对不可信标题使用textContent，保持它是文字。DocumentFragment可以把多个节点先组装再一次放入页面，重点仍是数据来源与输出范围；不要为了少写几行就把未校验内容拼进innerHTML。

### 就地练习：重复渲染不重复条目

将同一render调用两次，对比先replaceChildren与仅append的结果，并用含尖括号的标题验证文字。

### 参考核对：重复渲染不重复条目

清空重建后条数不翻倍；textContent保留字面尖括号，不生成对应标签。

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
<ul id="events"></ul>
<script>
const titles = ["编程交流", "<b>读书会</b>"];
const list = document.querySelector("#events");
// for...of 每轮取得一个标题值，不需要自己管理数字索引。
for (const title of titles) {
  // 每轮新建一个 li；它此时还没有加入页面。
const item = document.createElement("li");
  // 把数据当普通文字，尖括号也不会被解释成 HTML 标签。
item.textContent = title;
  // 将已填好文字的节点加入 ul，浏览器才能显示它。
list.append(item);
}
</script>
</body>
</html>
```

## 逐步读懂这个例子

每轮创建一个li，再设置文字。第二条会显示字面上的`<b>读书会</b>`，不会生成b元素。数据内容与HTML结构保持明确分工。

## 自己改一处再观察

追加第三个标题，再让同一渲染函数执行两次；先清空容器后比较。

### 参考答案

render两次仍只有三项。第三条标记按文字显示，不会建立img元素；删除replaceChildren后会变成六项，这个反例能验证重复追加问题。

将下面完整页面保存为 `index.html`，打开后按说明验证。

```html
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>独立练习</title>
</head>
<body>
<h1>课程列表</h1>
<ul id="list"></ul>
<script>
const titles = ["HTML", "CSS", "<img src=x>"];
const list = document.querySelector("#list");
function render() {
  // 每次从当前数据重建，防止第二次render把旧条目再追加一遍。
  list.replaceChildren();
  for (const title of titles) {
    const item = document.createElement("li");
    item.textContent = title;
    list.append(item);
  }
}
render();
render();
</script>
</body>
</html>
```


参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。
