# 语义区块与页面层级

用header、nav、main、section、footer表达页面职责。

## 给每个区域一个明确职责

| 区域 | 应放什么 | 本例位置 |
| --- | --- | --- |
| `header` | 页面或区块的介绍信息 | 社团名称与导航 |
| `nav` | 主要导航链接 | 跳到活动区的链接 |
| `main` | 这一页独有的主要内容 | 本周活动 |
| `section` | 有明确主题的一个分区，通常有标题 | 以“本周活动”为标题的分区 |
| `footer` | 收尾信息 | 联系说明 |

**语义描述区域的用途，CSS 才决定区域的外观与位置。** 这里没有写 CSS，浏览器仍按源码从上到下显示。`header` 不会因为名称像“头部”就固定在顶部。

一个元素被另一元素包住时，外面是父元素，里面是子元素；更深的后代称后代元素。这个关系后面会影响 CSS 选择器与布局。`div` 是没有额外主题含义的通用容器，适合纯粹为排版包一组内容；`article` 常用于可以单独理解的一条文章或卡片。

本例的导航在 main 外，section 在 main 内，h2 在 section 内。用缩进逐层写清这些关系，比把所有标签挤成一行更容易检查漏掉的结束标签。

### 就地练习：区域不自动定位

只用header、main、footer写三块内容，不加CSS，观察顺序。header会自动固定在顶部吗？

### 参考核对：区域不自动定位

按文档流顺序显示，标签表达职责，不自动提供固定定位。

## 语义选择按职责，不按外观

main 表示页面主要内容，header/footer 的含义取决于所属页面或区块，nav 用于主要导航；article 适合能独立分发的条目，section 表示有主题的分区。div 是没有特定语义的通用容器，不必强迫每个样式盒子都变成 section。

语义能帮助辅助技术辨认区域，但不会自动生成好标题，也不会替你写布局。页面内容的 DOM 顺序应能在没有 CSS 时合理阅读；不要先放乱顺序，再全部靠定位摆回去。

### 就地练习：主题还是排版容器

为“带标题的课程安排”和“仅包住两个按钮便于布局”分别选section或div并解释。

### 参考核对：主题还是排版容器

有主题与标题的安排可用section；纯布局容器用div即可，语义不能靠外观猜。

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
<!-- 介绍区域包含页面主标题与主要导航。 -->
<header><h1>周末编程社</h1><nav><a href="#events">活动</a></nav></header>
<!-- 主要内容集中在 main 中；分区的主题由 h2 说明。 -->
<main><section id="events"><h2>本周活动</h2><p>周六下午练习。</p></section></main>
<!-- 页脚写收尾信息，不需要复制主内容。 -->
<footer><p>联系：社团活动室</p></footer>
</body>
</html>
```

## 逐步读懂这个例子

页面仍按正常文档顺序展示。各标签提供含义，视觉位置在后面用CSS决定。section有h2表明分区主题；main集中主要内容，导航和页脚放在外面。

## 自己改一处再观察

给main加第二个section，使用h2和一个段落，检查标题层级。

### 参考答案

两个 section 各有 h2，页面主主题只有一个 h1；main 包住主要内容。section 的意义来自主题和标题，而不是它会产生特殊的卡片外观。

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
<header><h1>学习计划</h1></header>
<main>
  <section><h2>阅读</h2><p>理解一个概念。</p></section>
  <section><h2>练习</h2><p>写出可运行的小例子。</p></section>
</main>
<footer><p>本地练习页</p></footer>
</body>
</html>
```


参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。
