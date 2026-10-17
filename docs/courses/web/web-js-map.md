# 数组 map 与数据转换

把每项转换成新的值，区分转换与筛选。

## 每项产生一个对应的新值

map 接收转换函数，对每项调用一次，把每次返回的值放进新数组。**filter 回答“保留吗”，map 回答“变成什么”。** 对本例的普通三项数组，map 返回三项，而 filter 可以返回更少项。

`function (price) { return price*2; }` 是匿名函数：没有单独取名，但仍有参数与函数体。把它直接放进 map 的括号，map 就得到一个可调用的函数。三次输入是 10、20、30，三次返回是 20、40、60。

同一函数也可写为箭头函数 `price => price*2`，箭头左边是参数，右边的表达式自动作为返回值；如果写 `price => { price*2; }`，花括号表示函数体，此时必须明确 return，否则每项得到 undefined。后面 DOM 筛选将使用这种短写。

原 prices 不会因本例的数值转换被改写。但“map 返回新数组”不表示回调永远没有副作用：若回调主动改共享对象，仍会改它。先让转换函数只计算结果，DOM 创建与追加使用明确的循环。

### 就地练习：判断也能成为转换值

对[10,20,30]分别filter(x=>x>=20)与map(x=>x>=20)。

### 参考核对：判断也能成为转换值

filter得[20,30]，map得[false,true,true]；map收集每次返回值。

## map、filter、find、some、every 与 reduce

map逐项转换，结果长度通常与原数组一致；filter筛选，find只找首个符合项，some判断是否至少一项满足，every判断是否全部满足。reduce把多项累积成一个结果，先提供明确初值，尤其要考虑空数组。

转换对象时也要问是否需要新对象。map返回新数组不等于里面对象都复制了；回调若返回原对象，后续改属性仍会共享。不要为了短而把读取、修改全局状态和DOM副作用全塞进一条链。

### 就地练习：空数组累积

用初值0的reduce对[2,3]与[]求和，再说明空数组无初值的后果。

### 参考核对：空数组累积

有初值为5、0；空数组且无初值会抛错，应先明确空集合合同。

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
const prices = [10, 20, 30];
// map 把每个价格交给这个匿名函数，收集它的返回值。
const doubled = prices.map(function (price) {
  // 每项返回自己的转换结果；漏 return 会得到 undefined。
return price * 2;
});
console.log(JSON.stringify(doubled));
</script>
</body>
</html>
```

控制台预期：

```output
[20,40,60]
```

## 逐步读懂这个例子

匿名函数作为回调接收当前price，返回翻倍值。map结果长度与原数组一致；原prices仍是10、20、30。箭头函数price=>price*2表达同一计算。

## 自己改一处再观察

把数值转换成“价格：10”等字符串，再比较map和filter的结果长度。

### 参考答案

map负责把数字变文字，filter才删掉不符合项；先筛选再转换得到两项。原prices仍有三项。

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
const prices = [10, 20, 30];
const labels = prices.map(price => `价格：${price}`);
console.log(JSON.stringify(labels));
const selected = prices.filter(price => price >= 20).map(price => `价格：${price}`);
console.log(JSON.stringify(selected));
console.log(prices.length, labels.length, selected.length);
</script>
</body>
</html>
```


参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。
