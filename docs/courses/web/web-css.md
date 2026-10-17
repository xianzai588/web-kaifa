# CSS 规则与引入方式

识别选择器、属性和值，让一个段落改变颜色。

## 先读一条规则，再拆到外部文件

**CSS 规则写的是“选谁、改什么、改成什么”。** `p { color: blue; }` 中，`p` 是选择器，选中所有段落；花括号中的 `color: blue;` 是一条声明，`color` 是属性名，`blue` 是值。冒号分开属性和值，分号分开声明。`color` 控制文字颜色，`background-color` 控制背景颜色。

三种引入方法有不同位置：本例把规则写在 head 中的 `style` 元素；独立样式文件使用 `<link rel="stylesheet" href="style.css">`；元素的 `style="color:blue"` 属性是行内样式，容易分散规则，本课程优先前两种。

要拆到外部文件：先在 index.html 同目录新建 `style.css`，只写 `p { color: blue; }`；从 HTML 删除整块 style，改为 head 内的 link。`.css` 文件里不写 `<style>` 标签。`href` 仍按 HTML 的目录解释。保存两个文件再刷新，段落仍应为蓝色。

CSS 注释使用 `/* 说明 */`，不能用 HTML 的 `<!-- -->`。浏览器通常忽略无效声明而继续处理其他规则，因此页面能显示不代表每条 CSS 都有效。检查拼写、英文标点和保存位置。

### 就地练习：拆成两份文件

把style中的p规则移到同目录style.css，HTML改用link；只保存HTML而未保存CSS时先检查哪里。

### 参考核对：拆成两份文件

CSS文件只含规则，不含style标签；两文件均保存，核对link路径及实际请求成功。

## 三种引入方式与一条失效声明

内部样式放 head 的 style，外部样式用 `<link rel="stylesheet" href="style.css">`，行内样式放元素 style 属性。先用外部文件练职责分工；CSS 文件本身只写规则，不包 style 标签。

浏览器通常忽略无效属性或无效值，其余有效声明仍可生效。看到颜色没变，依次检查样式文件是否请求成功、选择器是否匹配、声明是否被划掉、计算值来自哪里。CSS 不是遇到一条拼错就整份文件必然停止。

### 就地练习：坏声明不抹掉好声明

同一规则写color:green与拼错的背景属性，检查Computed。修复后只应多出哪项变化？

### 参考核对：坏声明不抹掉好声明

有效文字色仍生效；错误声明被忽略。修复背景后背景出现，不代表浏览器原来停止读取全部CSS。

## 先看一个完整例子

在自己的独立练习文件夹新建 index.html，保存下面完整内容，用浏览器打开。修改后先保存，再刷新。

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>本节小练习</title>
  <style>
/* 选择所有 p 段落，把文字颜色设为蓝色。 */
p { color: blue; }
  </style>
</head>
<body>
<h1>社团介绍</h1>
<p>这一段变成蓝色。</p>
</body>
</html>
```

## 逐步读懂这个例子

p选择所有段落，color控制文字色，blue是蓝色值。花括号包住声明，冒号分隔属性和值。HTML仍描述段落内容，CSS只改变外观。

## 自己改一处再观察

改成color:green，再增加background-color:lightyellow，观察两个属性。

### 参考答案

`p { color: green; background-color: lightyellow; }` 会同时改变文字和背景。到 Styles 中分别取消两条声明，能验证它们各自控制的属性。

参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。

## 独立变式：独立制作提示说明

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。只使用标签选择器、color、background-color 和已学的 CSS 引入方式，不提前使用 class/id 选择器。

写一份新的提示页：h1 是“实验须知”，两个 p 分别说明准备和收尾。自己给标题设一种文字颜色，给段落设另一种文字颜色和背景，再把规则放到同目录 style.css，通过 HTML 引入。

自查：标题与两个段落的规则范围不同，两段共享段落外观。故意拼错一个属性名时只应失去那项声明，其余有效规则继续工作；恢复后外部样式正常。CSS 文件里没有 style 标签，HTML 文件没有把 CSS 写成正文。

### 参考答案：独立变式

这是便于对照的完整页面。独立任务要求分成两份文件：把 style 内的两条规则移入同目录 style.css，再把整个 style 元素换成 `<link rel="stylesheet" href="style.css">`。两段 p 共享规则；拼错 color 只让该声明失效，背景仍应存在。

下面是完整 index.html，保存后用浏览器打开；需要服务器时按本节启动说明运行。

```html
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>独立练习</title>
<style>
h1 { color: #164e80; }
p { color: #14532d; background-color: #fef9c3; }
</style>
</head>
<body>
<h1>实验须知</h1>
<p>准备：先保存文件。</p>
<p>收尾：记录实际结果。</p>
</body>
</html>
```
