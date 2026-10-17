# 正常文档流与 display

比较block、inline与inline-block的排列行为。

## 源码顺序如何变成屏幕排列

**文档流让后面的内容接着前面的内容排；不用手算每个元素的屏幕坐标。** 普通水平书写时，块盒通常另起一行，普通行内盒随文字从左到右排，空间不足再换行。

| display 值 | 排列与宽度 |
| --- | --- |
| `block` | 另起一行；可设置 width，高度随内容或 height 决定 |
| `inline` | 参与行内文字排列；普通非替换行内元素的 width/height 不按块盒方式生效 |
| `inline-block` | 整体参与行内排列，同时可设置自己的宽高 |
| `none` | 不生成显示盒，也不占布局空间；不能再用键盘找到被隐藏的交互控件 |

span 是通用行内容器，div 是通用块容器；给 span 设置 display:block 只是改变盒的排版，不会赋予它按钮的操作语义。本例两个 inline-block 的内容宽各 100px，再加两边 padding 与 border 各得到 118px。

只改 display，一次测试一个值：inline-block 时并排，block 时两行，inline 时普通文字宽度跟内容走。浏览器默认 body 有少量外边距，这与 item 的 padding 是不同地方。

### 就地练习：width在谁身上生效

给普通span设width100px，先用inline再用inline-block，对比盒尺寸，最后改block看换行。

### 参考核对：width在谁身上生效

普通非替换行内元素不按块宽生效；inline-block可设尺寸且整体同行，block另起块行。

## 隐藏、占位与流中的间距

display:none 会让元素不参与布局，通常也不出现在辅助技术阅读树中；visibility:hidden 隐藏但仍留布局空间；opacity:0 只是透明，元素还可能占位并接收交互，不能把它当禁用操作。

普通 inline 的 width/height 不按块盒规则工作；inline-block 作为行内整体排列，同时可设置尺寸。块元素的 width:auto 与 width:100% 也不总等价：在 content-box 下再加 padding，100% 可能超出容器。

### 就地练习：透明不是禁用

只在临时按钮上分别试display:none、visibility:hidden、opacity:0，比较占位与Tab行为，之后恢复可见状态。

### 参考核对：透明不是禁用

none不占位，hidden留布局位；opacity0仍可能聚焦和交互，不能当作禁用或安全隐藏。

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
/* 整体可同行排列，同时允许设置每项的内容宽度。 */
.item { display: inline-block; width: 100px; padding: 8px; border: 1px solid; }
  </style>
</head>
<body>
<!-- span 只组织文字，改 display 不会让它成为按钮。 -->
<span class="item">第一项</span><span class="item">第二项</span>
</body>
</html>
```

## 逐步读懂这个例子

两项在空间足够时同行，inline-block允许明确宽度。改成block后各起一行。改变display不会把span变成真正的按钮或链接。

## 自己改一处再观察

分别试block与inline，比较width是否按预期生效。

### 参考答案

改成 block 后每个标签另起块行；普通 span 用 inline 时80px的 width 不按行内块方式生效。去掉测量规则前先看 Computed，避免把内容长度差异当布局行为。

参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。

## 独立变式：文字中的步骤标签

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。使用 p/span、盒模型与 display；不使用 br、多个空格或定位凑布局。

在自己的一段操作说明中嵌入两个静态步骤标签，每个标签声明 80px 内容宽和自己的内边距。让它们先作为有尺寸的行内整体参与文字流，再自行改成块显示，预先描述文字与标签的位置变化。

自查：行内块在空间够时参与同一行，窄窗口可整体换到下一行；块显示时标签各自起行。普通 inline 不按相同方式采用普通 span 的 width。标签只是说明文字，不会因外观像按钮就具备操作功能。

### 参考答案：独立变式

两个 span 先为可设尺寸的行内整体，空间不足时整体换行。把 display 改成 block 后各自另起一行，前后文字仍按正常流排列。它们是说明，不是按钮。

下面是完整 index.html，保存后用浏览器打开；需要服务器时按本节启动说明运行。

```html
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>独立练习</title>
<style>
.step { display: inline-block; width: 80px; padding: 4px; border: 1px solid; }
</style>
</head>
<body>
<p>操作顺序：<span class="step">阅读</span>，然后<span class="step">练习</span>，最后核对结果。</p>
</body>
</html>
```
