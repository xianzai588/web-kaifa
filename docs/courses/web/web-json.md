# JSON 文字与 JavaScript 对象

在字符串与对象之间转换，检查坏JSON为何失败。

## JSON是一种文字格式

JSON使用双引号包住键与字符串，表示数组、对象及一些基本值。JavaScript对象可有方法和其他值，并非任何对象都能原样表示成JSON。JSON.parse解读文字，JSON.stringify输出JSON文字。

### 就地练习：格式不是连接

将对象stringify再parse，分别看类型和字段。这个过程会不会发请求或保存文件？

### 参考核对：格式不是连接

只做文字与值转换，不自动联网或保存；序列化结果是string。

## 在文字和对象之间转换

JSON（JavaScript Object Notation）是一种数据文字格式，可用来保存或传输数据。它不是网络连接，也不会自己更新页面。**JSON 字符串与解析后的 JavaScript 对象是两个不同的值。**

本例外层单引号属于 JavaScript，用来声明字符串；内层双引号属于字符串中的 JSON 格式。JSON 的属性名和字符串必须用双引号，可以包含对象、数组、数字、true/false、null；不能写函数、undefined、注释或末尾多余逗号。

`JSON.parse(text)` 把合法文字解析成值；`JSON.stringify(item)` 把可表示的值转成 JSON 文字。本例 text 的类型是 string，item 才能按 item.title 读取属性。stringify 返回新字符串，不改变 item 的类型。

在独立目录保存完整 index.html，浏览器打开，F12 的 Console 刷新后应出现下方三行。删除 JSON 键周围的双引号，会看到 SyntaxError（语法错误），本次脚本后续语句可能停下；恢复后再读后面的 try/catch 章节。合法的 `{"seats":"两人"}` 仍可能不符合“seats 必须为数字”的业务要求。

### 就地练习：合法仍可能不合要求

比较分钟为20、"20"及带尾逗号三份JSON，区分格式与业务字段。

### 参考核对：合法仍可能不合要求

前两份可解析，但第二份分钟是字符串；尾逗号使格式失败，格式之后还要校验字段。

## 完整例子

```html
<!doctype html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><title>JSON</title></head>
<body>
<p>打开Console看结果。</p>
<script>
// 外层单引号声明 JS 字符串；里面仍遵守 JSON 的双引号规则。
const text = '{"title":"Go","seats":2}';
// 解析字符串得到对象，之后才能按属性读取 title。
const item = JSON.parse(text);
console.log(typeof text);
console.log(item.title);
// 把对象重新写成 JSON 文字便于保存或传输，不改变 item 本身。
console.log(JSON.stringify(item));
</script>
</body>
</html>
```

## 控制台结果

```output
string
Go
{"title":"Go","seats":2}
```

text保存字符串，不能把text.title当对象字段读。parse得到item后才可读取title。stringify返回新的字符串，不会把item变量改成字符串。

## 修改实验

把JSON键的双引号去掉，读取会抛SyntaxError。先恢复有效格式，后面的 [try、catch 与失败分支](#/learn/web/web-js-errors) 再学习怎样处理这种失败。

### 参考答案

序列化结果为字符串，解析结果为数组；取第二项前此例有明确的两项输入。把minutes变成文字仍能解析，但不满足数字分钟的业务约定；缺少键引号则是语法错误，之后的错误处理课再包try/catch。

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
const goals = [{ title: "Go基础", minutes: 20 }, { title: "Web布局", minutes: 30 }];
const text = JSON.stringify(goals);
console.log(typeof text);
const restored = JSON.parse(text);
console.log(Array.isArray(restored), restored.length);
console.log(restored[1].title, restored[1].minutes);
</script>
</body>
</html>
```


## 独立变式：学习目标的文字往返

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。使用数组/对象、stringify/parse 与属性读取；错误处理将在后面的指定章节学习。

自己定义两条目标，每条有 title 字符串与 minutes 数字；序列化为 JSON 字符串，再解析并读取第二条目标。运行前写出序列化结果的类型、解析结果的结构及第二条字段预期。

自查：序列化变量是 string，解析后是含两对象的数组，第二条 title/minutes 与输入一致。把 minutes 改成字符串仍可成为合法 JSON，但不符合数字时长需求；删键的双引号会 SyntaxError。格式与业务形状分两项核对。

## JSON能表达什么，不能表达什么

JSON只有对象、数组、字符串、数字、布尔、null，不能保存函数、undefined、循环引用或任意类的行为。JSON.stringify并不是所有对象的通用深拷贝工具，Date等类型也有自己的序列化规则。

JSON.parse只确认格式可解析，不保证字段符合需求。null、数组和对象都是合法JSON，但可能不符合某个接口。数字字段若变成"20"，仍是合法JSON文字，却不是需要的number；处理不可信输入应检查类型、有限范围和必要字段。

### 就地练习：不是通用深拷贝

对含undefined属性的对象stringify，再考虑循环引用，说明通用拷贝为何不成立。

### 参考核对：不是通用深拷贝

对象的undefined属性通常被省略，循环引用抛错，方法及特殊类型行为也不能原样保留。
