# 图片裁剪与长内容溢出

处理长串换行和图片展示比例，定位撑宽原因。

## 分别检查文本和图像

**先找到超出容器的内容，再选择换行、缩放或裁剪。** 长单词没有正常断点，`overflow-wrap:anywhere` 允许在必要位置断开；`width:100%` 随容器走，`max-width:400px` 限制上限。`min-width:0` 对需要收缩的 Flex/Grid 项尤其有用，避免默认最小内容尺寸把布局撑开。

本例先用长文本观察：按 F12 打开开发者工具，选择 Elements（元素），用左上角的元素选择工具点击这段 p；在 Styles（样式）中取消或重新勾选 overflow-wrap 声明。再打开设备工具栏（通常 Ctrl+Shift+M），输入 320px 宽，观察长串是否超出卡片、页面底部是否出现横向滚动条，恢复规则后再比较。Computed（计算值）的盒模型图可看段落所在盒子的宽度。

scrollWidth 是 DOM 中描述内容所需横向宽度的属性，clientWidth 是当前内部可见宽度，它们不是 CSS 声明，不能在 Styles 中按普通样式属性查找。**本节还没学 JavaScript，不要求读取这两个数值；当前验收只观察长串换行和横向滚动。** 数值读取放到后面的 DOM 学习范围，不用一条未解释的控制台代码替代当前操作。

图片部分使用前面学过的 img：如果只要等比例缩放，给它 `max-width:100%; height:auto`。如果想在固定展示框内填满，可以给 `width:100%; height:160px; object-fit:cover`；cover 保持比例并裁掉超出框的部分，contain 保持比例且完整显示，可能留下空白。这些只改变展示，不修改原图片文件。

用前面的本地图像单独试 cover 与 contain，比较图像内容有没有被裁掉。不要把 `overflow-x:hidden` 作为第一步，它只把超出的内容藏起来，可能让文字或控件无法访问。

### 就地练习：找到真正撑宽项

320px下停用长串换行规则，指出哪个内容超宽。恢复后检查整页横滚是否消失，避免直接隐藏body溢出。

### 参考核对：找到真正撑宽项

无空格长串是来源；overflow-wrap处理文本断点，Flex/Grid还需允许子项收缩。隐藏整页可能遮掉内容。

## 溢出来源与图片裁切

先找到真正超出容器的元素，再处理它的尺寸规则。普通长词可用 overflow-wrap:anywhere；Flex/Grid 子项还可能需要 min-width:0。表格和代码若不能合理折行，可让局部容器 overflow:auto，保留可读内容而不是把整页裁掉。

图片 `max-width:100%; height:auto` 保留整体比例；固定展示框需要裁切时，用 width/height 或 aspect-ratio 确定框，再用 object-fit:cover。contain 保留整张图但可能留空，cover 填满框并裁掉部分，二者要按信息是否可裁掉选择。

### 就地练习：信息可否被裁掉

用同一张有文字信息的图片放入固定框，比较cover和contain。哪种保证整张图在框内可见？

### 参考核对：信息可否被裁掉

contain保留整图可能留白；cover填满并裁切，可能丢文字，不能仅为填满框就裁掉关键信息。

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
* { box-sizing: border-box; }
body { margin: 16px; }
/* 卡片随容器缩窄，同时给出宽度上限，不锁死手机布局。 */
article { width: 100%; max-width: 400px; min-width: 0; }
/* 必要时断开没有空格的长串，防止内容把容器撑宽。 */
p { overflow-wrap: anywhere; }
  </style>
</head>
<body>
<article><h1>活动说明</h1><p>verylongunbrokencontentabcdefghijklmnopqrstuvwxyz0123456789</p></article>
</body>
</html>
```

## 逐步读懂这个例子

长串没有空格，默认可能无法在合适位置断开。overflow-wrap:anywhere允许必要时换行。width:100%按容器计算，max-width设上限。先找到超宽元素，再决定改文本还是布局。

## 自己改一处再观察

按上面的 Elements/Styles 步骤取消 overflow-wrap，在320px观察长串是否撑出卡片、页面是否横向滚动；再勾选恢复。

### 参考答案

在320px检查这条长串能在框内断行；取消 overflow-wrap 后观察真正的横向溢出，再恢复。不要通过 body 的 overflow-x:hidden 把未显示的文字藏掉。

将下面完整页面保存为 `index.html`，打开后按说明验证。

```html
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>独立练习</title>
<style>
* { box-sizing: border-box; }
.card { max-width: 280px; padding: 12px; border: 1px solid; }
p { overflow-wrap: anywhere; }
</style>
</head>
<body>
<h1>长内容检查</h1>
<div class="card"><p>averyveryveryveryveryveryveryveryveryveryveryverylongunbrokentoken</p></div>
</body>
</html>
```


参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。
