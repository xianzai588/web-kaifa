# Grid 的列、间距与 fr

用两列网格排列四张卡片，再改成三列。

## 列轨道与自动排位

Grid 把容器划分成行列轨道，再按源码顺序安放直接子项。`grid-template-columns:1fr 1fr` 声明两个列轨道；两项之后的第三项自动进入下一行，不需要手写 top/left。

**fr 是可分配空间的份额，不是像素，也不是直接把容器总宽当百分比。** 例如容器宽 612px，gap 为 12px，扣掉一处列间距后，两列各分约 300px。`gap` 同时指定行间与列间的间隔。

`repeat(3,1fr)` 表示把 1fr 重复三次，等价于 `1fr 1fr 1fr`。`minmax(0,1fr)` 把轨道最小尺寸设为 0、最大参与 1fr 分配，便于收缩；长单词是否换行仍需文本规则，后面溢出章节会处理。

本例 .cards 的四个 article 是直接子项，形成两列两行。article 只是为每张独立卡片提供语义；把 grid 写在 article 上不会自动排列它的兄弟卡片。打开开发者工具的 Layout（布局）或 grid 标记，可叠加网格线观察。

### 就地练习：先扣间隔再分列

容器612px、两列1fr、gap12px，手算每列。改为三列时要扣几个gap？

### 参考核对：先扣间隔再分列

两列各300px；三列扣两处gap24px，剩588px，每列196px，前提是不被内容最小尺寸撑大。

## 行列、跨格与自动适应

`grid-template-columns` 定义列，grid-template-rows 定义行，gap 在轨道间留空。fr 分配扣除固定宽度与间距后的剩余空间，不是整个视口的固定比例。`minmax(0,1fr)` 允许轨道收缩，但子项本身仍需处理超长内容。

子项可用 `grid-column:1 / -1` 跨越全部列。`repeat(auto-fit,minmax(...))` 可按空间形成列数，但最小值过大会在窄屏溢出；初学先用明确断点验证。Grid 适合二维排列，Flex 更直接地处理一条主轴，选择依据内容关系而非哪个更新。

### 就地练习：跨列只影响子项

四项网格给第一项grid-column:1 / -1，预测其余项排位，再用Layout网格线核对。

### 参考核对：跨列只影响子项

第一项跨全列占首行，其余项按后续空位自动排；规则写在想跨列的网格子项上。

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
/* 父容器声明两列；四个直接子项会按源码顺序排成两行。 */
.cards { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
/* 内边距只控制每张卡片自己的内容空间。 */
article { padding: 16px; background: #edf2f7; }
  </style>
</head>
<body>
<div class="cards"><article>一</article><article>二</article><article>三</article><article>四</article></div>
</body>
</html>
```

## 逐步读懂这个例子

两列等分空间，四项形成两行。改成repeat(3,1fr)后每行最多三项，第四项进入下一行。1fr不是1像素，也不保证长内容永远不会撑宽。

## 自己改一处再观察

增加第五张卡片，改成repeat(3,minmax(0,1fr))，观察排列。

### 参考答案

前三项在第一行，后两项在第二行。Grid 排列的是直接子项；把五张卡片再套一个总 div，会把这个 div 当成一个网格子项，需要重新确定容器位置。

将下面完整页面保存为 `index.html`，打开后按说明验证。

```html
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>独立练习</title>
<style>
.cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
article { min-width: 0; padding: 8px; border: 1px solid; }
</style>
</head>
<body>
<h1>五项课程</h1>
<div class="cards"><article>A</article><article>B</article><article>C</article><article>D</article><article>E</article></div>
</body>
</html>
```


参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。
