# 条件分支与边界

根据分数选择分支，先拒绝非法范围。

## 条件为真时才进入对应代码块

`if (条件) { 语句 }` 先计算括号内的条件，为真才执行花括号内的代码块；否则去看 else if，最后由 else 处理剩余情况。**一条 if/else if/else 链最多执行一个分支。** 执行了其中一段，就继续链后面的语句。

`||` 表示“或”，至少一个条件真即满足；`&&` 表示“且”，两者都真才满足；`!` 把真/假反过来。本例 `score<0 || score>100` 表示低于 0 或高于 100 都是非法范围，不是要求两者同时发生。

输入 60 的执行路径：第一条件为假 → 检查 >=60 为真 → 打印及格 → 跳过 else。输入 101 在第一段打印非法，不再误打印及格。例子里的 score 已经是数字；来自输入框的内容，还得先转换并检查是否为有效数字。

在纸上列出 -1、0、59、60、100、101 的预期，再每次只改 score 保存刷新。将 >=60 临时改成 >60，观察正好 60 的行为为何改变；边界的等号不是可有可无的装饰。

### 就地练习：边界能检出错误

用59、60、61比较>=60与>60的分支结果。

### 参考核对：边界能检出错误

>=为未及格、及格、及格；>会把60错分。

## 先验证类型与范围，再判业务分支

数字条件里 NaN 会让多数大小比较都为false，Infinity 又可能大于所有有限阈值，因此先用 Number.isFinite。来自输入框的值是字符串，先trim判断非空，再Number转换，不允许用空文字自动变0来绕过必填规则。

if/else-if 是互斥链，多个独立if则可能多次输出。switch 适合离散值匹配，普通case要按需要用break避免继续执行后续分支；这点与Go普通switch的规则不同。布尔条件应写出业务意义，避免靠不熟悉的真假转换猜测结果。

### 就地练习：NaN不会自动越界

预测NaN代入score<0或score>100，再给完整校验补Number.isFinite。

### 参考核对：NaN不会自动越界

大小比较均false，仅范围检查会漏NaN；先检查有限数字再判业务范围。

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
const score = 60;
// 先拒绝范围外的数字；|| 表示任一条件成立。
if (score < 0 || score > 100) {
  console.log("非法分数");
// 只有未进入非法分支时，才判断是否达到及格线。
} else if (score >= 60) {
  console.log("及格");
} else {
  console.log("未及格");
}
</script>
</body>
</html>
```

控制台预期：

```output
及格
```

## 逐步读懂这个例子

||表示至少一个条件成立。60不是非法范围，进入及格分支。59进入最后分支，101进入第一分支，后面的分支不会继续执行。

## 自己改一处再观察

验证-1、0、59、60、100、101，写出每个分支。

### 参考答案

-1和101非法，0和59未及格，60和100及格；再测NaN或Infinity，应在有效数字检查时被拒绝。

参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。

## 独立变式：按规则计算运费

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。只使用已学数字转换、比较、布尔连接和互斥条件，不引入表单或网络。

独立规定：金额必须为有效数字且不小于 0；金额达到 60 元免运费，低于 60 元运费 8 元。根据一个模拟金额只输出“非法金额”“免运费”或“运费8元”之一。先列测试表，再写判断。

自查：-1 与不可转换的 abc 为非法；0、59 为运费8元；60、61 为免运费。将含等号的边界写错会让 60 被错误分类。一次只能进入一种情况，不能因为金额大于 60 就跳过非法数字检查。

### 参考答案：独立变式

先排空白、非有限数字与负数，再看60元边界。将raw依次改为-1、abc、0、59、60、61，应为非法、非法、运费、运费、免运费、免运费。

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
const raw = "60";
const amount = Number(raw);
if (raw.trim() === "" || !Number.isFinite(amount) || amount < 0) {
  console.log("非法金额");
} else if (amount >= 60) {
  console.log("免运费");
} else {
  console.log("运费8元");
}
</script>
</body>
</html>
```
