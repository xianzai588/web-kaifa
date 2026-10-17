# 文字样式与长度单位

用rem、百分比和行高控制一小段正文。

## 用具体数字理解单位

**单位必须连在数字后面：写 `16px`，不能写成 `16 px`。** px 是 CSS 像素，不一定等于屏幕硬件的一个像素；rem 以根元素 html 的字号为参照。根字号 16px 时，1rem=16px、30rem=480px。

`font-size` 控制字号；`line-height:1.7` 是当前字号的 1.7 倍，16px 的文字对应约 27.2px 行高。`margin:1rem` 在四边留外部间距；`max-width:30rem` 只是宽度上限，小屏可比这个更窄。

百分比要问“这个属性相对谁”：普通块元素的 `width:50%` 通常按包含它的容器宽度算；`font-size:120%` 按父元素的字号算。`50%` 不自动表示半个屏幕。`em` 通常相对当前字号，用在 font-size 时相对父字号。

打开开发者工具，点选 p，在 Computed 查看 font-size 和 line-height；缩窄窗口，观察是否自然换行。例子不锁死高度，文字变大时内容应能继续占据需要的空间。

### 就地练习：把rem算成数值

根字号16px时，计算1.25rem文字、1.6行高、24rem上限；改根20px再算并看Computed。

### 参考核对：把rem算成数值

分别20px/32px/384px，改后25px/40px/480px；上限不要求小屏也保持该宽。

## px、rem、em、百分比与视口单位

CSS px 是布局单位，不必等于一颗屏幕物理像素。rem 参照根元素字号，font-size 中的 em 参照父字号，其他多数长度属性中的 em 参照当前元素字号。百分比的参照由属性决定，不能统一理解为屏幕宽度。

vw/vh 根据视口计算，移动浏览器地址栏变化会影响可用高度，必要时了解 svh/dvh 等单位。无单位行高按各元素字号计算，比固定 px 行高更能适应文字缩放。`clamp(最小值, 首选值, 最大值)` 可约束弹性尺寸，但先保证普通字号和宽度可读。

### 就地练习：百分比相对谁

容器宽400px、父字号20px，子元素width:50%、font-size:120%。预测两个计算值。

### 参考核对：百分比相对谁

普通块宽约200px，字号24px；两种百分比基准不同，均不必相对整个屏幕。

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
/* 根字号为 16px，因此本例的 1rem 等于 16px。 */
html { font-size: 16px; }
/* 外边距随根字号变化；max-width 设上限；无单位行高随当前字号变化。 */
body { margin: 1rem; max-width: 30rem; line-height: 1.7; }
p { font-size: 1rem; }
  </style>
</head>
<body>
<h1>阅读练习</h1>
<p>正文应该有足够的行高和边距，让内容容易阅读。试着缩窄窗口，观察文字如何换行。</p>
</body>
</html>
```

## 逐步读懂这个例子

根字号16px时，1rem等于16个CSS像素，30rem约480px。无单位行高1.7随文字字号变化。max-width给出上限，而不是要求小屏也固定480px。

## 自己改一处再观察

根字号改成20px，再比较1rem边距与正文大小。

### 参考答案

根字号20px时1rem等于20px；已有12px固定字号仍是12px。用 Computed 看计算值，别只凭视觉猜比例。

参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。

## 独立变式：比较可缩放文字与固定文字

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。使用 rem/px、max-width、font-size、line-height 与已经讲过的选择器。

新写两个短阅读区：第一段用 1.25rem 字号、1.6 无单位行高与 24rem 宽度上限；第二段用 12px 字号。根字号先由你设为 16px，再设为 20px；运行前分别手算。

自查：第一段字号依次 20px/25px，行高约 32px/40px，上限 384px/480px；第二段仍为 12px。小窗口可比上限窄且自然换行。把数字和单位之间故意加空格会使该声明无效，恢复后再核对计算值。

### 参考答案：独立变式

16px根字号时，阅读字号20px、行高32px、宽度上限384px；根字号改20px后分别25px、40px、480px。max-width 只是上限，实际可用宽度更小时自然收窄。

下面是完整 index.html，保存后用浏览器打开；需要服务器时按本节启动说明运行。

```html
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>独立练习</title>
<style>
html { font-size: 16px; }
.reading { font-size: 1.25rem; line-height: 1.6; max-width: 24rem; }
.fixed { font-size: 12px; }
</style>
</head>
<body>
<p class="reading">这是一段可缩放的阅读说明，窄屏自然换行。</p>
<p class="fixed">固定字号说明。</p>
</body>
</html>
```
