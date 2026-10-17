# 数组与元素访问

保存多项数据，访问下标并追加一项。

## 数组的顺序与索引

数组字面量使用方括号，`[60,80]` 里各项用逗号分开；`scores[0]` 的方括号表示按索引读取。**第一项的索引是 0；最后一项的索引是 length−1。** 有三项时有效索引是 0、1、2，不是 1、2、3。

`scores.push(100)` 在末尾增加一项，会修改原数组；`scores.length` 读取元素个数，属性不加括号；`scores[1]=90` 可改第二项。const 禁止把 scores 重新赋成另一个数组，不禁止修改原数组内容。

用前面学过的 for 可以从 i=0 开始，每轮检查 `i<scores.length`，再把 `scores[i]` 加进循环外的 total。不要用 <=，否则多读一次 undefined，后续数字计算可能得到 NaN。空数组 length=0，从第一轮就不进入循环，总和应为 0。

本节保持数组元素都是数字。数组也可保存文字或对象，但同一组数据的形状越一致，后续处理越容易说明和校验。

### 就地练习：末项与越界

对[60,80,100]读length-1与length位置，求和时临时用<=后观察，再恢复。

### 参考核对：末项与越界

末项100，越界undefined；多加undefined可能得到NaN，终点应小于length。

## 修改、复制与越界的不同后果

数组可用push追加、pop取走末项、slice复制指定范围、splice原地删除/插入。slice不修改原数组，splice会；const数组只禁止把变量换成另一数组，不禁止push。展开 `[...items]` 是浅副本，嵌套对象仍可能共享。

读取越界通常得到undefined，写入过大下标可能造成稀疏数组；后续求和出现NaN时先检查有没有读到不存在的项。for...of读取值，普通for可按需要读取下标。JS的sort默认按字符串方式排序，数字排序要明确比较函数，不能把[2,10]的默认结果当数值升序。

### 就地练习：数字排序

比较[2,10].sort()与新数组.sort((a,b)=>a-b)，打印JSON结果。

### 参考核对：数字排序

默认按字符串次序为[10,2]；数值比较得[2,10]，sort会原地修改数组。

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
<h1>JavaScript 小实验</h1>
<p>按 F12 打开开发者工具，在 Console（控制台）看输出。</p>
<script>
// 数组用 [] 写出两项；索引从 0 开始。
const scores = [60, 80];
// push 修改原数组，在末尾添加第三项；const 不禁止这类内部修改。
scores.push(100);
console.log(scores[0]);
console.log(scores.length);
// 三项的有效索引是 0、1、2；3 处不存在元素，读到 undefined。
console.log(scores[3]);
</script>
</body>
</html>
```

控制台预期：

```output
60
3
undefined
```

## 逐步读懂这个例子

初始两项，push后有三项，下标0、1、2。下标3没有这项，读取undefined。const固定scores这个绑定，并不禁止对数组内容进行push。

## 自己改一处再观察

用for把三个分数相加，验证空数组结果。

### 参考答案

总分按元素值累计，空数组循环零次。避免用i<=scores.length，多出来的末次会读到undefined。

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
<h1>控制台独立练习</h1>
<p>打开开发者工具的 Console，核对下列日志。</p>
<script>
const scores = [60, 80, 100];
let total = 0;
for (const score of scores) { total += score; }
console.log(total);
const empty = [];
let emptyTotal = 0;
for (const score of empty) { emptyTotal += score; }
console.log(emptyTotal);
</script>
</body>
</html>
```


参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。
