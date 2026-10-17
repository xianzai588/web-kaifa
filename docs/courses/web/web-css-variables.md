# CSS 变量与交互状态

用一个变量统一颜色，并让键盘焦点可见。

## 共享颜色与看见焦点

CSS 自定义属性是可以复用的值，名字以两个连字符开头，例如 `--brand`。`:root` 选择文档根元素，在这里集中声明可供后代读取的颜色；`var(--brand)` 读取该值。自定义属性仍参与继承和层叠，不是 JavaScript 变量。

**hover 反馈指针停留，focus-visible 让需要焦点提示的操作看得见当前位置。** 这两种状态不能互相替代。`a:hover` 是在 a 的基础上增加状态条件；冒号后面的名字叫伪类。

`outline:3px solid var(--brand)` 给焦点画外框，`outline-offset:4px` 让框离边缘 4px。outline 通常不挤占元素原布局；移除默认焦点框之前，必须有清楚的替代反馈。`text-decoration-thickness` 改的是链接下划线的粗细。

把鼠标移开，只用 Tab 找到“查看活动”、Enter 激活，再用 Shift+Tab 返回。键盘焦点和鼠标停留分别检查。调整 brand 后，文字和焦点框应一起变化。

### 就地练习：鼠标状态不是焦点

移开鼠标，只用Tab、Enter操作示例链接，记录焦点框和跳转目标；再单独试hover。

### 参考核对：鼠标状态不是焦点

键盘需要focus-visible反馈并可到真实目标；hover不保证在键盘或触屏路径出现。

## 变量作用域、回退与交互状态

自定义属性通常继承，声明在 :root 可供整页用，在子容器覆盖则只影响该子树。`var(--space, 16px)` 在变量缺失时提供回退；变量存在但内容不适合目标属性时，不一定会退回你想象的另一条声明，应看计算结果。

:hover 是指针悬停，:focus-visible 是需要明显焦点反馈的聚焦状态，:active 是激活过程；触屏和键盘不保证经过 hover。disabled 应使用原生禁用机制并解释原因，不能仅把颜色调灰。outline 不占布局空间，移除它时必须提供足够清晰的替代反馈。

### 就地练习：覆盖只影响子树

在root声明brand，再只在一个子容器覆盖，比较内外链接。删去变量时再测试var的合法回退。

### 参考核对：覆盖只影响子树

子树读局部值，外部仍用根值；变量缺失时可用明确回退，作用域并非全局替换文字。

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
/* 把多个位置共享的颜色集中在根元素的自定义属性中。 */
:root { --brand: #164e80; }
a { color: var(--brand); }
a:hover { text-decoration-thickness: 3px; }
/* 需要明显焦点的键盘等操作显示外框，不用 hover 代替。 */
a:focus-visible { outline: 3px solid var(--brand); outline-offset: 4px; }
  </style>
</head>
<body>
<a href="#events">查看活动</a>
<section id="events"><h1>本周活动</h1></section>
</body>
</html>
```

## 逐步读懂这个例子

链接颜色与焦点框从同一个brand变量读取。按Tab可把焦点移动到链接，Enter执行正常链接跳转。hover不是键盘焦点的替代。

## 自己改一处再观察

将brand改成深绿色，并只用Tab与Enter完成跳转。

### 参考答案

把 --brand 改为 #14532d 后，所有引用此变量的链接与焦点规则同步改变。用 Tab 聚焦，看到外框后 Enter 跳到真实目标，才验证了键盘路径。

参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。

## 独立变式：共享间距与独立焦点

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。使用自定义属性、var、padding/margin 及已学的原生链接状态。

从空白写一块说明和一个带真实目标的新链接。自己声明 --space，供说明块 padding 和链接周围的一项间距共同使用；另外写 hover 与 focus-visible 反馈。改变一次 --space，预测两处变化。

自查：两处间距同步改变，颜色或内容不会被误当间距改写。移开鼠标只用 Tab/Enter 仍可看到焦点并完成跳转；hover 不是焦点替代。故意拼错一个 var 名时发现该值不能被正常读取，再恢复名字。

### 参考答案：独立变式

--space 同时控制 note 内边距和 action 上间距。改成24px后两处都增加8px；拼错名字且无回退时该值失效，不是颜色改变。焦点规则独立于 hover。

下面是完整 index.html，保存后用浏览器打开；需要服务器时按本节启动说明运行。

```html
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>独立练习</title>
<style>
:root { --space: 16px; }
.note { padding: var(--space); border: 1px solid; }
.action { display: inline-block; margin-top: var(--space); }
a:hover { color: #14532d; }
a:focus-visible { outline: 3px solid #164e80; outline-offset: 3px; }
</style>
</head>
<body>
<h1>共享间距练习</h1>
<div class="note">先看说明，再访问练习。</div>
<a class="action" href="#practice">去练习</a>
<h2 id="practice">练习内容</h2>
</body>
</html>
```
