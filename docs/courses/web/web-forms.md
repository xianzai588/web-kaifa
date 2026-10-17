# 表单控件与 label

让标签关联输入框，观察required的浏览器校验。

## 输入、校验与提交分别是什么

表单是让用户输入一组值的界面。`input` 是输入控件，`type="text"` 表示文字输入；`button type="submit"` 表示触发表单提交，`required` 要求先填一个值。

**本节只学习浏览器输入与校验，没有接收报名和保存数据的服务器。** 通过校验不等于有人收到了资料。这里只填虚构称呼，例如“小林”。

| 属性 | 职责 |
| --- | --- |
| `label for="name"` 与 `input id="name"` | 关联标签与输入框，点击“称呼”就能聚焦输入框 |
| `name="name"` | 提交时给这份输入取一个字段名；不是用来代替 id 的 |
| `action="#checked"` | 提交目标；本例仍是当前页面并带片段位置 |
| `method="get"` | GET 是一种读取资源的 HTTP 方法；表单把命名字段写进地址的查询部分 |

HTTP 是浏览器与服务器约定请求和响应格式的一套规则，后面请求章节才完整展开。这个本地示例没有 HTTP 后端。通过后可能看到地址中出现 `?name=...#checked`，中文会被编码；这不是“报名成功”。密码等敏感资料不能放在地址中。

先点空表单，观察浏览器阻止提交；再填“小林”，观察原生行为；最后用 Tab/Shift+Tab 移动焦点。若只是普通操作按钮，应写 `type="button"`，避免放进表单后意外提交。

### 就地练习：校验通过算保存吗

用虚构值完成本地GET表单，检查地址变化与Network。列出目前能确认与不能确认的行为。

### 参考核对：校验通过算保存吗

能确认浏览器校验和提交导航；没有接收保存服务，不能宣称报名已保存。

## name、输入类型与表单数据

id 供标签和脚本定位，name 决定提交字段名，value 是当前提交值，placeholder 只是提示，不能代替可见 label。disabled 控件通常不参加提交；readonly 文本控件仍可提交。button 在 form 内默认可能提交，纯操作应显式写 type="button"。

email、number、date 等 input 类型提供不同的输入与原生校验体验；number 的结果在 DOM 中读取时仍要按后续 JavaScript 规则转换。多行文字用 textarea，有限选项用 select/option；同 name 的 radio 表示单选，checkbox 适合多选或独立开关，未勾选时通常不提交该项。

form 的 method="get" 把数据放进查询字符串，适合本课虚构数据；post 把数据放进请求体，但本身不加密。真实服务仍要用 HTTPS 和服务器端验证。浏览器校验可以被绕过，不能作为权限或安全边界。

### 就地练习：id和name各管什么

保留id及label关联，只删输入的name，填虚构文字后提交。比较点击标签和查询字段。

### 参考核对：id和name各管什么

标签仍可聚焦输入，但没有name的输入通常不成为提交字段。placeholder也不能代替label。

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
<h1>意见输入练习</h1>
<p>演示表单，暂不接受报名。</p>
<!-- 本地演示：通过校验后仍回到当前页面，不连接报名服务。 -->
<form action="#checked" method="get">
<!-- for 与 input 的 id 一致，点击标签就能聚焦输入框。 -->
<label for="name">称呼</label>
<!-- id 用来关联标签；name 是提交字段名；required 触发浏览器必填校验。 -->
<input id="name" name="name" type="text" required>
<button type="submit">检查输入</button>
</form>
</body>
</html>
```

## 逐步读懂这个例子

点击称呼标签，焦点会进入对应输入框。空输入点检查会出现浏览器校验反馈；填写后可以通过。按钮触发浏览器原生表单校验。通过后浏览器会在当前本地地址添加输入参数，本例没有接收或保存数据的后端；不要填真实个人信息。

## 自己改一处再观察

把for临时改成其他名字，观察点击标签是否仍能聚焦；再恢复。

### 参考答案

for 与 id 不匹配时，点击标签不再聚焦目标。恢复一致后分别点击两个标签，确认焦点到对应输入，不只用鼠标直接点输入框。

参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。

## 独立变式：两字段学习意向表

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。只使用原生 form、label、文字 input、button 与已讲属性，不编写 JavaScript 或后端。

新写一个收集“虚构称呼”和“想学的主题”的本地表单；两个输入都有各自唯一的 id、name 与标签，两项均必填。正文明确它只是校验练习，没有保存服务。

自查：点击两个标签分别聚焦正确控件；任一项为空时不能通过原生校验，两项填写虚构值后当前地址的查询部分包含两个字段。Tab 顺序可达两个输入和按钮。两个 id 重复或 for 失配时要发现并恢复，不能称通过校验为“已报名”。

### 参考答案：独立变式

两个 label 关联各自 id，name 决定查询字段。空任一项时原生校验阻止提交；填虚构值后 GET 导航会出现 nickname 和 topic 查询参数，这仅证明浏览器提交了数据，不能据此说服务器已保存。

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
<h1>学习意向校验练习</h1>
<p>只使用虚构内容；没有保存或报名服务。</p>
<form method="get">
  <p><label for="nickname">虚构称呼</label><input id="nickname" name="nickname" required></p>
  <p><label for="topic">想学的主题</label><input id="topic" name="topic" required></p>
  <button type="submit">检查这份输入</button>
</form>
</body>
</html>
```
