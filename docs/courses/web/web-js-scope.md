# 函数作用域与值传递

区分函数内部参数与调用者的数字变量。

## 名字在哪个范围有效

函数参数在函数内使用。传入数字时函数得到一个值，修改参数不直接修改外面的变量。对象和数组的引用行为会在下一组数据章节比较。

### 就地练习：参数改的是谁

count初值3，只调用change(count)后再读count。需要外层变9应加哪一步？

### 参考核对：参数改的是谁

仍为3；用count=change(count)明确接回，参数赋值不改外层数字绑定。

## 名字的可见范围

作用域是“这个名字在哪段代码中能使用”。函数参数 value 只在 change 函数内存在；外面的 count 不是同一个变量。let/const 在花括号代码块中声明时，通常也只在这个块及内部范围中可见。

**传入数字后，给参数重新赋值，不会自动改掉调用者的变量。** change(count) 先读取外部的 3，给函数内 value；value=9 改的是内部名字；return 把 9 返回；外部 count 若没有重新赋值，仍是 3。

在独立练习目录创建 index.html，保存下面完整内容，浏览器打开后按 F12 选择 Console，刷新观察两行数字。第一次应为 9、3。把第一句输出改为 `count=change(count); console.log(count);` 后，两行才都会读到 9。

在函数外写 `console.log(value)` 会因找不到该名字报 ReferenceError（引用错误），后面的同步语句可能不再执行。删除这句再继续。对象/数组章节会专门比较共享引用，不要提前把所有值都归为同一规则。

## 完整例子

```html
<!doctype html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><title>作用域</title></head>
<body>
<p>打开Console看结果。</p>
<script>
// 这是函数外的变量。
let count = 3;
// value 是本次调用的局部参数；改 value 不直接改外面的 count。
function change(value) { value = 9; return value; }
console.log(change(count));
// 外部没有重新赋值，因此这里仍读取 3。
console.log(count);
</script>
</body>
</html>
```

## 输出与原因

```output
9
3
```

change修改的是自己的value，return得到9；外部count仍是3。把调用改成count=change(count)，外部值才被明确更新。

## 修改实验

在函数外直接读取value，观察ReferenceError，再恢复。需要函数结果时使用返回值，不依赖泄露内部变量。

### 参考答案

函数返回15时，外层balance仍10；后面的显式赋值才改成15。函数内label与外层label是两个名字绑定。函数外读取next会ReferenceError；别把故意错误留在正常答案中。

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
let balance = 10;
const label = "原始余额";
function subsidize(value) {
  const label = "函数内余额";
  const next = value + 5;
  console.log(label);
  return next;
}
const result = subsidize(balance);
console.log(result, balance, label);
balance = result;
console.log(balance, label);
</script>
</body>
</html>
```


## 独立变式：返回结果后才改变外部值

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。使用参数、局部变量、返回值与显式赋值，不要求对象引用。

独立写一个计算“补贴后余额”的函数：输入原余额 10，函数内部产生增加 5 后的新数值并返回。外面先只读取返回值，再明确把返回值接回原变量。另在函数内部用一个与外部文字变量同名的局部变量。

自查：未接回时，新结果 15、外部余额仍 10；接回后余额才是 15。局部同名文字变化不应改外部文字。函数外读取仅在函数内部声明的名字应出现 ReferenceError，恢复后能说明每个名字在哪个范围有效。

## 块作用域、闭包与“按值传递”

let/const的作用域由代码块限定，var主要按函数范围，初学优先使用let/const。内层声明同名变量会遮住外层，改内层名字不改外层绑定；不要为避开报错随意把赋值改成新声明。

内层函数能记住并访问外层变量，形成闭包；它记住的不是某个时刻必然冻结的值。JavaScript参数按值传递，原始数字副本的赋值不改调用者；对象参数复制的是对象引用这个值，因此改其属性可能在调用方可见，下一节对象课会实验。

### 就地练习：闭包读取后来的值

写let count=1，保存返回count的函数，再count=2后调用。预测返回，并区别另存旧数值。

### 参考核对：闭包读取后来的值

闭包读取同一个外层变量，调用时为2；不会自动冻结创建时的1。
