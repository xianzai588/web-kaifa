# Flexbox 的主轴与交叉轴

用Flex排一组导航，知道两个对齐属性控制哪条轴。

## 先指定容器，再判断两条轴

Flexbox 用来沿一条主要方向安排一组项目。`display:flex` 写在父容器 nav 上，nav 的直接子元素 a 成为 Flex 项。内部更深的文字不会因为祖先是 flex 就各自成为项目。

**先看 flex-direction，再解释对齐方向。** 默认 row：主轴在水平方向，交叉轴在竖直方向；column 时两者交换。`justify-content` 分配主轴的剩余空间，`align-items` 对齐交叉轴上的项目；`gap:16px` 留项目间隔。

`space-between` 把剩余空间放在项目之间，第一项贴起点、最后一项贴终点。容器没有剩余空间时，不会凭空生成更多空间。若 column 容器高度刚好包住内容，竖直的 space-between 可能看不出效果；临时给 nav 加 `min-height:200px` 再观察，之后删除测量样式。

本例链接的目标区块没有提供，所以本节只观察排列，不能把它当完整导航项目。窄屏需要允许换行时可加 `flex-wrap:wrap`；后面的活动页会把导航和实际分区一起验收。

### 就地练习：换方向再解释对齐

将nav从row改column，先标两条轴，再在有额外高度时检查space-between。

### 参考核对：换方向再解释对齐

column主轴竖直、交叉轴水平；justify-content分配竖向余量，容器无余量时效果不明显。

## 伸缩与子项最小尺寸

flex-grow 分配剩余空间，flex-shrink 处理不足空间，flex-basis 是参与分配的起始尺寸；简写 `flex:1` 常用于分担空间，但不等于每个内容都天然同宽。长文本子项可能因默认最小尺寸拒绝收缩，必要时给合适的子项 min-width:0 并处理换行。

flex-wrap:wrap 允许换行，gap 只在项目间产生间距，不会凭空制造容器外边距。align-content 影响多行且有额外交叉轴空间的分配，单行布局主要看 align-items。order 可改视觉顺序，但不会自动改变 DOM 阅读或键盘顺序，导航应先写好合理源码次序。

### 就地练习：顺序看屏幕也看键盘

给两个真实链接设置不同order，再只用Tab观察焦点顺序。视觉换序是否同步改了源码次序？

### 参考核对：顺序看屏幕也看键盘

不会；键盘通常仍按DOM顺序。先组织合理源码，不用order制造视觉与操作的矛盾。

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
/* nav 是 Flex 容器；默认 row，justify-content 管主轴，align-items 管交叉轴。 */
nav { display: flex; gap: 16px; justify-content: space-between; align-items: center; }
  </style>
</head>
<body>
<nav><a href="#one">首页</a><a href="#two">活动</a><a href="#three">联系</a></nav>
</body>
</html>
```

## 逐步读懂这个例子

三个链接沿主轴排列，space-between把剩余空间放在项目之间，gap提供最小间隔。Flex只影响nav的直接子元素，后代不自动全部变成Flex项目。

## 自己改一处再观察

加flex-direction:column，保持两个对齐属性，观察含义变化。

### 参考答案

column 把主轴转为竖向，justify-content 沿竖向分配空间，align-items 控制横向。若容器高度恰好等于内容总高度，几乎没有可分配空间，视觉效果也就不明显。

参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。

## 独立变式：四项可操作的目录

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。使用 Flex 容器/直接子项、gap、wrap、两条对齐轴及已学的真实锚点。

从空文件写四个目录链接和四个对应标题目标。先做横向目录，空间不够可换行；再改为竖向目录，临时给它 240px 最小高度观察剩余空间的分配。自己决定两条轴上的对齐，不沿用原例规则。

自查：四个链接可由 Tab/Enter 到达真实目标；窄屏不会丢掉某项。row 与 column 时，justify-content/align-items 的方向要分别解释；竖向有剩余高度才容易观察空间分配。删除测量用高度后不能把效果减弱误判为属性失效。

### 参考答案：独立变式

四个真实锚点按源码顺序可键盘操作。要做竖向实验，在 nav 增加 flex-direction:column 与 min-height:240px，再观察两条轴；删去临时高度后剩余空间减少，不代表 justify-content 失效。

下面是完整 index.html，保存后用浏览器打开；需要服务器时按本节启动说明运行。

```html
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>独立练习</title>
<style>
nav { display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; align-items: center; }
a:focus-visible { outline: 3px solid #164e80; }
</style>
</head>
<body>
<nav aria-label="课程目录">
<a href="#html">HTML</a><a href="#css">CSS</a><a href="#js">JavaScript</a><a href="#go">Go</a>
</nav>
<h1>学习目录</h1>
<h2 id="html">HTML</h2><h2 id="css">CSS</h2><h2 id="js">JavaScript</h2><h2 id="go">Go</h2>
</body>
</html>
```
