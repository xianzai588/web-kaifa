# 运算符与类型转换

预测数字相加和字符串拼接，明确转换用户输入。

## 算术、比较与转换是三种操作

数字可以使用 `+` 加、`-` 减、`*` 乘、`/` 除，`%` 得到余数。括号优先，例如 `(2+3)*4` 得到 20。`+` 遇到字符串时还会连接文字，所以 `"2"+3` 得到字符串 `"23"`，不会自动变成数字 5。

**用户输入的文字必须先检查，再明确转换成需要的类型。** `Number("2")` 调用转换函数得到数字 2；`Number("abc")` 无法得到有效数字，返回 NaN（Not a Number，非数值结果）。`Number.isNaN(...)` 检查结果是不是 NaN；嵌套括号内的 Number 先执行，再把结果交给 isNaN。

`===` 是严格相等比较，同时看类型和对应值，本例 2 与 "2" 不相等；`!==` 是严格不等。`>`、`>=`、`<`、`<=` 比较数值大小，返回布尔值。NaN 与自身也不相等，所以不用 value===NaN 检查。

本节还没有操作输入框，用字符串模拟输入。预测 `Number("")` 与 `Number(" ")` 都会得到 0，这正说明“可转换”不代表“用户真的填了 0”。下一组会用 trim 检查空白，再根据业务范围拒绝不合适的值。

### 就地练习：加号先看类型

预测2+3、"2"+3、Number("2")+3的结果和typeof，再运行。

### 参考核对：加号先看类型

分别数字5、字符串23、数字5；明确转换后才做数值加法。

## 严格相等、短路与无效数值

+ 在一边是字符串时可能拼接，减乘除等又有各自转换规则，所以输入计算先明确 Number。=== 不做隐式类型转换，== 则会转换；起步优先使用严格比较。Number.isNaN 只检测 NaN，Number.isFinite 还可排除 Infinity 和 -Infinity；NaN 与任何值包括自己都不严格相等。

&&、|| 会短路，并返回某个操作数，不保证结果一定是布尔。?? 仅在左值为 null/undefined 时采用右值，和把0或空文字也当作需要替换的 || 不同。三元表达式 `condition ? a : b` 适合短的值选择，复杂流程仍写清晰分支。

### 就地练习：不要吞掉合法零

比较 `0 || 10`、`0 ?? 10`、`null ?? 10`，先预测再运行。

### 参考核对：不要吞掉合法零

分别10、0、10；??只替换null/undefined，||会替换假值0。

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
console.log(2 + 3);
// 这里左边是字符串，+ 连接文字，结果为字符串 23。
console.log("2" + 3);
// 先明确转换为数字，再执行数值加法。
console.log(Number("2") + 3);
console.log(2 === "2");
// 转换失败得到 NaN，用专门的检查函数判断它。
console.log(Number.isNaN(Number("abc")));
</script>
</body>
</html>
```

控制台预期：

```output
5
23
5
false
true
```

## 逐步读懂这个例子

前两条差别在左边的类型：数字得到5，字符串拼接得到23。Number尝试转换，无法成为数字的abc得到NaN，Number.isNaN检测这个结果。

## 自己改一处再观察

预测Number("")、Number("  ")与Number("0")；思考空输入是否应自动当0。

### 参考答案

Number("")、Number("  ")、Number("0")都是0；转换成功不能证明用户输入了有意义的数字。

参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。

## 独立变式：模拟采购输入的转换表

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。条件分支和 trim 还没系统学，本题只做计算及转换检查，不要求提前写完整输入校验。

在空脚本用字符串 "12.5"、"2"、"3" 表示单价、数量、运费，自行明确转换后求总价；另为 "abc"、空字符串、一个空格输出转换结果及 isNaN 判断。先预测，禁止把文字直接相加当总价。

自查：总价为数字 28；abc 得到 NaN 且检查为 true；空串和空格转换为 0，但这不能证明用户确实输入了零。到后面的字符串/条件章节再补空白与范围拒绝；本节只需解释转换和业务有效性不同。

### 参考答案：独立变式

先转换三项再计算，得到28。abc成为NaN，空文本与空格成为0却不能据此认定业务输入有效；后续先Trim再校验范围。

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
const price = Number("12.5");
const quantity = Number("2");
const shipping = Number("3");
console.log(price * quantity + shipping);
console.log(Number("abc"), Number.isNaN(Number("abc")));
console.log(Number(""), Number.isNaN(Number("")));
console.log(Number(" "), Number.isNaN(Number(" ")));
</script>
</body>
</html>
```
