# 字符串与模板文字

连接文字，读取长度，理解模板中的表达式。

## 读取文字与调用文字处理方法

普通字符串用英文单引号或双引号包住；模板文字用反引号。**只有反引号模板中的 `${...}` 会把表达式结果插入文字。** 普通引号里的同样字符只是原样文字。

`name.trim()`：点号读取 trim 方法，括号调用它，返回去掉两端空白的新字符串；name 本身不被修改。`name.length`：读取 length 属性，得到长度，不需要括号。方法调用与属性读取的写法不同。

本例 name 是空格 + 小 + 林 + 空格，length 为 4；clean 为“小林”，长度为 2。JavaScript 使用 UTF-16 存放文字，length 按其中的代码单元计数；部分表情占两个或更多单元，所以它不是准确的“人眼字符数”。现在只需通过 `"😀".length` 观察边界，不要求背编码规则。

先在控制台加 `console.log(name); console.log(clean);`，确认原值与处理结果不同。再把模板的反引号改成普通引号，观察是否仍插入名字。

### 就地练习：属性和调用分开

对" 阿青 "读取length、调用trim，打印原串与结果；把反引号模板换为普通引号再对比。

### 参考核对：属性和调用分开

原长度4、清理后2，原值不变；普通引号的${...}按文字保留。

## 长度、截取与查找都要先决定单位

JavaScript 的 length 按 UTF-16 码元计数，很多 emoji 使用两个或更多码元；它不是 UTF-8 字节数，也不总是码点数。`Array.from(text)` 可按迭代码点拆开，但仍不保证一个元素就是用户看到的完整组合字符。

slice(start,end) 不含终点，includes 检查包含，startsWith 检查前缀，split 按分隔生成数组。trim 和 replace 等方法返回新字符串，不会原地修改旧字符串。模板用反引号与 ${表达式}，普通引号里的插值符号只是普通文字。

### 就地练习：长度按哪个单位

分别打印A、中、😀的length，说明能否当作UTF-8字节数。

### 参考核对：长度按哪个单位

分别1、1、2，是UTF-16码元数，不是UTF-8字节数，也不总是视觉字符数。

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
const name = " 小林 ";
// trim 返回去两端空白的新字符串，原 name 保持不变。
const clean = name.trim();
// 反引号模板把 clean 的值插入 ${...} 的位置。
console.log(`你好，${clean}`);
console.log("Go".length);
// 读取原字符串的长度，包含前后两个空格。
console.log(name.length);
</script>
</body>
</html>
```

控制台预期：

```output
你好，小林
2
4
```

## 逐步读懂这个例子

trim去掉两端空白，结果保存在clean，原name仍包含空格。模板把clean插入问候。Go有两个普通拉丁字符；name包含两个空格和两个汉字。

## 自己改一处再观察

在name前后增加空格，比较clean与name；试一个表情的length。

### 参考答案

trim 返回去除两端空白的新字符串，原 name 不变；表情的 length 应按码元解释，不能据“看上去一字”直接预期1。

参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。

## 独立变式：生成一条课程通知

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。使用字符串、trim、length 和模板插值，不用 DOM 或异步。

新写姓名 "  李 小雨  " 与课程 "Web" 两份数据，分别保存原姓名和处理后的姓名，生成“李 小雨，你选择了 Web。”这一条通知。先预测边界与中间空格如何处理，再输出两份长度。

自查：边界空格被去掉，中间的一个空格保留；原姓名长度 8，处理后长度 4，原值不被 trim 修改。用普通引号包住模板会让插值字符失去替换作用，恢复反引号后结果正确。

### 参考答案：独立变式

两端各两个空格被去掉，中间一个空格保留。原变量仍保存八个码元的文本，cleanName为四个。

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
const rawName = "  李 小雨  ";
const cleanName = rawName.trim();
const course = "Web";
console.log(`${cleanName}，你选择了 ${course}。`);
console.log(rawName.length, cleanName.length);
</script>
</body>
</html>
```
