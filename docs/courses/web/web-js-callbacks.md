# 回调与数组 filter

把函数作为参数传入，筛选满足条件的数据。

## 把判断函数交给 filter 调用

函数也是一种可以传递的值。`scores.filter(passed)` 把 passed 函数交给 filter；filter 会依次调用 passed(40)、passed(60)、passed(80)。这些调用分别返回 false、true、true，只有返回 true 的项进入新数组。

**传 passed 是交出函数；写 passed() 是现在就调用它。** 本例若写 filter(passed())，passed 会先在没有分数的情况下执行，得到一个布尔结果，而 filter 需要的是函数，因而会出现 TypeError。

回调不是自动“异步”的意思：本例 filter 在当前同步流程中逐项执行，完成后 result 已得到 [60,80]。后面事件和 Promise 也接收回调，但调用时机由对应 API 决定。

filter 不会删除原 scores 中的项，所以 scores.length 仍为 3。命名函数 passed 的 return 必不可少；删掉 return 后每项都返回 undefined，被当作不保留，结果是空数组。JSON.stringify 已在前面的 JSON 节介绍，这里只用来稳定展示数组文字。

### 就地练习：交函数还是先调用

在passed里加日志，记录filter收到各项的顺序；解释passed()与passed的区别。

### 参考核对：交函数还是先调用

filter同步依次交入40、60、80；passed()先得到返回值，filter需要的却是函数。

## 回调执行时机与真假结果

把函数交给filter时不写调用括号，filter会在遍历每项时调用它。回调返回可判为true的值则保留该项，没写return通常得到undefined，全部被丢掉。filter返回新数组，不自动更新你原来那个变量。

数组回调还可以接收下标与数组本身，初学只取需要的参数。箭头表达式`x => x > 0`隐式返回；改成`x => { x > 0; }`却没有返回，这个一对花括号就足以改变结果。先用命名函数看清输入与返回，再简化写法。

### 就地练习：漏return

用score=>{score>=60;}过滤[40,60,80]，预测后运行，再补return。

### 参考核对：漏return

都返回undefined所以得到[]；补return恢复[60,80]。

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
const scores = [40, 60, 80];
// 每次被 filter 调用时，score 接收当前数组项。
function passed(score) {
  // 返回布尔判断，filter 才能决定保留还是丢弃本项。
return score >= 60;
}
// 把函数交给 filter；这里不写 passed()，也不修改原数组。
const result = scores.filter(passed);
console.log(JSON.stringify(result));
console.log(scores.length);
</script>
</body>
</html>
```

控制台预期：

```output
[60,80]
3
```

## 逐步读懂这个例子

filter把40、60、80依次交给passed，保留后两项。调用处传passed，没有括号；passed()会先立刻调用函数。JSON.stringify在这里只将数组写成前面已学过的JSON文字，便于比对。

## 自己改一处再观察

改为保留80分以上，再用空数组验证。

### 参考答案

输入[60,80]时>=80只留[80]，空输入得到[]；filter不删除原数组项目。

参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。

## 独立变式：保留正偶数

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。使用命名判断函数、filter、余数和布尔判断；不添加未学异步机制。

从空脚本给数组 [0,-2,1,2,3,4] 筛选严格大于零的偶数，判断写在你自己命名的函数里，再把函数交给 filter。分别预测原数组与筛选结果，另测试全不匹配及空数组。

自查：正常结果 [2,4]，原六项不变；[-1,1,3] 与 [] 都得到 []。传函数与先执行函数不同；漏掉判断函数返回值不能得到期望筛选结果，恢复后再解释每项为什么保留或不保留。

### 参考答案：独立变式

0虽为偶数却不大于0，-2也被第一条件排除。将函数本身交给filter，只有2与4符合两个条件；原数组没有被删项。

下面是完整 index.html，保存后用浏览器打开；需要服务器时按本节启动说明运行。

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
function isPositiveEven(value) {
  // 两个条件都满足才保留；0虽然是偶数，却不满足严格大于0。
  return value > 0 && value % 2 === 0;
}
const values = [0, -2, 1, 2, 3, 4];
console.log(JSON.stringify(values.filter(isPositiveEven)));
console.log(JSON.stringify(values));
console.log(JSON.stringify([-1, 1, 3].filter(isPositiveEven)));
console.log(JSON.stringify([].filter(isPositiveEven)));
</script>
</body>
</html>
```
