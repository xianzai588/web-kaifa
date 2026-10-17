# 盒模型与 box-sizing

手算内容、内边距与边框合成的实际宽度。

## 从里面往外数四层

盒子从里面往外是：内容 content → 内边距 padding → 边框 border → 外边距 margin。内容是文字或图片；padding 是内容和边框之间的空隙；border 是包住它们的线；margin 隔开相邻盒子。

**content-box 的 width 是内容宽度；border-box 的 width 包含内容、padding 与 border。** 两者都不把 margin 算进声明的宽度。`padding:20px` 表示上下左右各 20px。`border:1px solid` 是简写，分别是线宽 1px、实线，颜色未写时使用当前文字颜色。

默认 content-box：300+20+20+1+1=342px。改为 border-box：整体 300px，内容=300−20−20−1−1=258px。这里“整体”指边框外边缘之间的宽度，不含 margin。

按 F12，Elements 中选中 card，找 Computed 的盒模型图；分别查看内容、内边距和边框。先在纸上算，再测。这个固定宽度只是测量实验；在手机窗口中若连同页面边距超过可用空间，后面的响应式章节会处理。

### 就地练习：给外缘宽度记账

声明width240px、左右padding12px、border2px，分别算content-box和border-box内容与外缘宽度，再测量。

### 参考核对：给外缘宽度记账

前者内容240、外缘268；后者外缘240、内容212。两种都不包括margin。

## margin 折叠、背景与全局设置

内容、padding、border 决定盒子的边框外缘尺寸，margin 是外部间距；阴影不参与这份尺寸计算。普通垂直文档流中，相邻块元素的上下 margin 可能折叠，不保证简单相加；Flex/Grid 中的间距规则不同。

常见全局设置 `*, *::before, *::after { box-sizing: border-box; }` 使宽度更直观，但不会自动修复超长内容。百分比宽度还受包含块影响，窄屏先确定父容器可用空间，再看 padding/border 是否算进声明宽度。

### 就地练习：上下margin一定相加吗

在普通文档流放两个块，上下相邻margin分别20px与30px，查看实际间隔；再放进纵向Flex容器比较。

### 参考核对：上下margin一定相加吗

普通相邻正margin常折叠为较大30px；Flex项的margin不按同一折叠规则处理。记录真实布局条件再解释。

## 先看一个完整例子

这里固定300px用于测量；320px窗口加上页面边距后可能溢出。测量结束用于实际布局时应设置适应容器的宽度或max-width。

在自己的独立练习文件夹新建 index.html，保存下面完整内容，用浏览器打开。修改后先保存，再刷新。

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>本节小练习</title>
  <style>
/* content-box：300 内容宽 + 左右 padding 40 + 左右 border 2 = 342px。 */
.card { width: 300px; padding: 20px; border: 1px solid; box-sizing: content-box; }
  </style>
</head>
<body>
<!-- div 是普通容器；card 类用来选择这一个盒子。 -->
<div class="card">活动卡片</div>
</body>
</html>
```

## 逐步读懂这个例子

内容宽300px，两侧padding各20px，边框各1px，总宽342px。改为border-box后，总宽300px，内容宽258px。margin增加外部间距，不计入border-box声明的300px内部。

## 自己改一处再观察

在开发者工具中查看宽度，改为border-box再测；将padding改成30px再预测。

### 参考答案

原例 padding 为20px、1px边框时，content-box外宽342px；改 padding=30px 后外宽362px。border-box 声明300px时外宽仍300px，padding=30px后内容宽238px。要同时记下当前参数，不能把不同实验的数字混用。

参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。

## 独立变式：做一张可手算的价格牌

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。使用盒模型、width、padding、border 和两种 box-sizing，不要求布局工具。

独立写一个价格牌盒子，声明宽度 240px、四边 padding 12px、边框 2px。先分别预测 content-box 和 border-box 的内容宽、边框外缘宽度，再创建自己的 HTML/CSS 并测量；可以另给 margin，但必须区分其范围。

自查：content-box 内容为 240px、外缘 268px；border-box 外缘 240px、内容 212px。外边距不计入上述两种外缘宽。Computed 盒模型图应与计算一致，不把阴影或 margin 当成内容。

### 参考答案：独立变式

第一张内容宽240、外缘宽240+24+4=268；第二张外缘240、内容240-24-4=212。margin 不包含在两个外缘数内。

下面是完整 index.html，保存后用浏览器打开；需要服务器时按本节启动说明运行。

```html
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>独立练习</title>
<style>
.price { width: 240px; padding: 12px; border: 2px solid; margin-bottom: 16px; }
.content { box-sizing: content-box; }
.border { box-sizing: border-box; }
</style>
</head>
<body>
<div class="price content">content-box</div>
<div class="price border">border-box</div>
</body>
</html>
```
