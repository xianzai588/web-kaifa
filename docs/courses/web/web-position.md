# 定位参照与小角标

让角标相对卡片定位，保留正常内容流。

## 让角标找到自己的参照

正常流中的元素会给后续内容留下位置。`position:relative` 仍保留原来位置；不写偏移时，看起来没有移动，但可作为子元素定位的参照。`position:absolute` 脱离正常流，其他内容不再为它留位置。

**本例将 relative 写在卡片上，让角标的偏移相对这张卡片计算。** 最近的这类祖先建立 absolute 使用的包含块。`top:8px` 指到参照区域上边的偏移，`right:8px` 指到右边的偏移。卡片的 padding 为正文留出空间，减少角标覆盖正文的机会。

这个参照选择是逐层向外找的，不是“永远相对父元素”。删掉卡片的 relative 后，若没有其他定位祖先，角标改用初始包含块作为参照，会跑到页面区域的角上。

fixed 常把元素固定在视口中、sticky 在满足滚动和偏移条件时黏住；z-index 影响相应层叠上下文中的叠放顺序。本节不靠这些布局整页，先把一个角标的参照和空间占用讲清。

### 就地练习：参照逐层向外找

两层容器只给外层relative，角标在内层内；先预测相对谁。再给内层relative并比较。

### 参考核对：参照逐层向外找

先以符合条件的外层为参照，加内层relative后以更近内层为参照，不保证永远是直接父元素。

## relative、absolute、fixed、sticky 的边界

relative 保留原布局位置，再按偏移移动视觉盒；absolute 脱离正常流，通常参照最近建立对应包含块的祖先。fixed 常参照视口，但某些 transform 等属性可改变包含块；不要把这条简化规则当绝对。

sticky 先在流中占位，滚动到指定 top 等阈值后表现为吸附，且受祖先滚动与边界约束。z-index 在各自层叠上下文内比较，某个局部数字再大也未必能盖过另一上下文。先用正常流布局正文，再给确有重叠需求的小元素定位。

### 就地练习：偏移是否留下原位

给流中盒子relative后top20px，观察后续内容位置；换absolute再观察，最后恢复。

### 参考核对：偏移是否留下原位

relative保留原布局位再视觉偏移；absolute脱流，后续内容不再为它保留原位。

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
/* 卡片保留正常流位置，同时为角标提供定位参照。 */
.card { position: relative; padding: 32px; border: 1px solid; }
/* 角标不占正文空间；从卡片的参照区域上边、右边各偏移 8px。 */
.badge { position: absolute; top: 8px; right: 8px; }
  </style>
</head>
<body>
<article class="card"><span class="badge">新</span><h1>周末活动</h1><p>正文照常排列。</p></article>
</body>
</html>
```

## 逐步读懂这个例子

card的relative为badge提供参照。角标离卡片右上角8px，正文仍按正常流排列。absolute不会为角标保留一块正文空间，因此卡片padding要避免遮挡。

## 自己改一处再观察

去掉card的relative，观察角标相对位置，再恢复。

### 参考答案

移除 card 的 relative 后，absolute 角标会去找更外层的包含块，可能贴到页面而不是卡片。恢复后先确认其父卡片边框与偏移距离，再看 z-index；后者不能修复参照错误。

参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。

## 独立变式：两张卡片各有自己的角标

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。使用正常流、relative、absolute 和偏移，不加入新定位机制。

独立写两张不同内容的卡片；只给第二张放一个左下角的“限量”角标，距左边与下边各 12px，正文不能被遮挡。先写出角标相对谁、是否为后续内容留位置，再选择参照与留白。

自查：角标始终属于第二张卡片，不跑到页面角落或第一张上；正文仍按流排列且可读。去掉第二张的参照后观察位置变化，再恢复；必须能解释 padding 为什么要容纳脱流角标，而不是靠数个空行。

### 参考答案：独立变式

第二张建立参照，左/下各12px；padding-bottom 预留角标空间，正文不靠空行避让。第一张没有角标。去掉 relative 后再恢复，能确认位置变化来自包含块。

下面是完整 index.html，保存后用浏览器打开；需要服务器时按本节启动说明运行。

```html
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>独立练习</title>
<style>
article { border: 1px solid; padding: 16px; margin-bottom: 16px; }
.limited { position: relative; padding-bottom: 52px; }
.badge { position: absolute; left: 12px; bottom: 12px; }
</style>
</head>
<body>
<h1>两张卡片</h1>
<article><h2>普通课程</h2><p>正常内容。</p></article>
<article class="limited"><h2>小组课</h2><p>只有第二张有自己的角标。</p><span class="badge">限量</span></article>
</body>
</html>
```
