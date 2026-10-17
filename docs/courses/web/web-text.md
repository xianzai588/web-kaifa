# 标题、段落与列表

用h1、h2、p、ul和li组织说明文字。

## 先确定内容关系，再选择标签

**标题级别表示内容的层级，不是用来挑字号的。** 本页的主题是“周末编程社”，用 `h1`；主题下的“本周安排”用 `h2`。如果安排下面还有“上午”和“下午”两个子主题，可以分别用 `h3`。教程的这一页保持一个清晰主标题；同一级内容使用同一级标题。

`p` 包住一段完整叙述。`ul` 是无序列表，适合并列目标；`ol` 是有序列表，适合必须先后执行的步骤。两种列表的每个项目都写在 `li` 中，`li` 放在对应的列表内。

源码中的换行和连续空格通常被浏览器合并，不等于增加段落。要有两个段落，就写两个 `p`。`br` 用于同一段内容必须换行的地方，例如地址，不用它在整页堆出间距。

打开示例，应有一个主标题、一个副标题、一个段落和两项带圆点的列表。将 `ul` 的开始和结束标签都改为 `ol`，列表才会使用顺序编号。

### 就地练习：列表按含义选择

为“准备材料清单”和“安装先后步骤”各写两项列表，并为页面和分组选择标题级别。

### 参考核对：列表按含义选择

材料用ul，步骤用ol；项目均为li，主题h1、分组h2，不为调字号随意跳级。

## 三类列表与表格数据

ul 表示无需先后的集合，ol 表示步骤或排名，li 是其中一项；列表可嵌套，但子列表应放在所属 li 内。dl/dt/dd 适合术语与解释，不用空格画出两列。

真正的二维数据用 table，caption 说明表意，thead/tbody 分组，th 作为标题单元格并用 scope 指出行/列，td 放数据。表格用于数据关系，不作为页面布局工具。下面片段可放入 body：

```html
<table>
  <caption>本周练习</caption>
  <thead><tr><th scope="col">方向</th><th scope="col">分钟</th></tr></thead>
  <tbody><tr><th scope="row">Go</th><td>30</td></tr></tbody>
</table>
```

页面主主题使用 h1，下面按内容层级使用 h2、h3；字号由 CSS 控制，不为“变小”跳过标题级别。

### 就地练习：数据表不是排版表

在文中的表格增加Web、20分钟一行，指出方向和分钟两列的标题与每行的标题。

### 参考核对：数据表不是排版表

thead两项th scope=col，Go/Web各为行标题th scope=row，分钟用td；二维关系不用空格排齐。

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
<!-- 页面的主主题用 h1，主题下的分组用 h2。 -->
<h1>周末编程社</h1>
<p>一起写一点能运行的代码。</p>
<h2>本周安排</h2>
<!-- 并列安排使用无序列表；每项必须放在 li 中。 -->
<ul>
  <li>读懂一个例子</li>
  <li>自己改一处代码</li>
</ul>
</body>
</html>
```

## 逐步读懂这个例子

h1是页面主题，h2是本周安排这个分主题。ul表示无序列表，每一项必须用li包起来。要表达第一步、第二步顺序时用ol代替ul。

## 自己改一处再观察

给列表加第三项，并把ul改成ol。

### 参考答案

三项放进 ol 后，浏览器默认按顺序编号。改回 ul 表示集合而不强调先后；验收看 li 数量和标签含义，不只看显示的圆点或数字。

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
<h1>练习步骤</h1>
<ol>
  <li>阅读一个例子</li>
  <li>独立修改</li>
  <li>运行并记录结果</li>
</ol>
</body>
</html>
```


参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。
