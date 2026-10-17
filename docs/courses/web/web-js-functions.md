# 函数定义、参数与返回

把计算提成函数，区分返回结果与打印结果。

## 一次函数调用里发生什么

`function add(a,b) { ... }` 定义函数：add 是名字，a、b 是接收输入的参数，花括号是函数体。定义时没有执行 a+b。`add(2,3)` 才调用函数，把实参 2、3 分别送给形参 a、b。

**return 把值交给调用者；console.log 只是显示一个值。** return 还会结束这次函数执行，它后面的同一路径语句不再执行。本例 add 返回 5，total 接住返回值，最后才输出 5。

如果删除 return，只剩 `a+b;` 或 `console.log(a+b);`，计算或打印仍可能发生，但调用者拿到 undefined。因此需要继续计算的结果，要明确返回，不要把“控制台见到了数字”当作“函数已返回数字”。

参数是函数内的名字，别的函数也可以使用同名参数。调用时参数顺序有意义：减法函数 subtract(a,b) 的 a-b，与 subtract(b,a) 结果可能相反。先写一个 multiply(a,b) 并分别测试正数、零和负数，下一节再追踪名字的作用范围。

### 就地练习：打印代替不了返回

将add里的return改为console.log(a+b)，调用者再打印调用结果，预测两条日志。

### 参考核对：打印代替不了返回

函数里显示5，外面显示undefined；显示与交回结果是两个动作。

## 函数表达式、箭头、默认与剩余参数

`const add = function(a,b){ return a+b; };` 是函数表达式，`const add = (a,b) => a+b;` 是返回表达式结果的箭头函数；箭头改用花括号后需要显式return。声明前能否调用还受声明形式和作用域影响，先定义再使用可减少初学混淆。

`function greet(name="同学")` 在未提供或提供undefined时采用默认值，传空字符串或null不会自动采用它。`function sum(...values)` 把剩余实参组成数组，配合已学循环求和；已有数组可用 `sum(...numbers)` 展开。箭头函数对this的规则不同，后续对象方法不要凭写法短就机械替换。

### 就地练习：箭头花括号有区别

比较n=>n*2与n=>{n*2;}对3的结果，再为后者补return。

### 参考核对：箭头花括号有区别

前者6，后者undefined；函数体花括号内需要明确return。

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
// 这里只定义函数；a、b 在调用时分别接收两个输入值。
function add(a, b) {
  // 返回计算结果并结束本次调用，不在这里只打印结果。
return a + b;
}
// 调用 add：参数得到 2、3，返回值 5 被保存到 total。
const total = add(2, 3);
console.log(total);
</script>
</body>
</html>
```

控制台预期：

```output
5
```

## 逐步读懂这个例子

add的a、b是函数参数。add(2,3)执行return，返回5；total接住它，console.log只是之后展示结果。把console.log放进函数而不return，调用者无法拿到计算值。

## 自己改一处再观察

用add(-2,3)与add(0,0)验证，写一个multiply函数。

### 参考答案

定义写出计算规则，调用提供实参，return交回结果。只在函数内console.log会让调用者得到undefined，无法继续可靠计算。

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
function add(a, b) { return a + b; }
function multiply(a, b) { return a * b; }
console.log(add(-2, 3));
console.log(add(0, 0));
console.log(multiply(2, 3));
console.log(multiply(0, 3));
console.log(multiply(-2, 3));
</script>
</body>
</html>
```


参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。
