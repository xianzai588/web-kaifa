# 循环与累加

跟踪for循环的开始、条件和更新。

## 跟着一轮走，再跟五轮

`for (初始化; 条件; 更新) { 循环体 }` 用两个分号分开三部分。初始化只执行一次；每轮开始检查条件；条件真时执行循环体；循环体结束后执行更新，再回到条件。

**累加器 total 在循环外初始化，才能保留前面几轮的结果。** `i+=1` 是 i=i+1 的简写，`total+=i` 是把本轮 i 加进旧 total。这里 total 可重新赋值，所以用 let。

| 本轮 i | 加之前 total | 加之后 total |
| --- | --- | --- |
| 1 | 0 | 1 |
| 2 | 1 | 3 |
| 3 | 3 | 6 |
| 4 | 6 | 10 |
| 5 | 10 | 15 |

第六次检查 i=6，不满足 <=5，跳出循环才打印 15。临时把 `console.log(i,total)` 加在循环体末尾观察各轮；恢复后只看最终输出。以后用 break 可提前退出循环，continue 可跳过本轮剩余操作，本节先掌握有限计数。

### 就地练习：零轮也有结果

将累加上限设0，写出初始化、首次条件与末尾日志的路径，再运行。

### 参考核对：零轮也有结果

total为0，首次条件false，零轮后仍打印0。

## for、while、break 与 continue

for把起点、条件、更新写在一处，while只写继续条件，do/while会先执行一次再检查。continue跳过本轮剩余语句，break结束当前循环；while中若把更新放在continue之后，会错过更新而卡住浏览器。

数组后续常用for...of取值；for...in遍历属性名，不能随意当作数组数值求和方式。浏览器主线程的长同步循环会阻塞点击和绘制，不能通过加更多循环实现真正延迟。

### 就地练习：continue之后谁更新

三段式for遍历1至3，遇2就continue，预测打印；再在纸上改成更新位于主体末尾的while。

### 参考核对：continue之后谁更新

for仍更新并输出1、3；while可能因跳过更新停在2，必须保证每条路径推进。

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
// 循环外初始化一次，让每轮累计结果能保留下来。
let total = 0;
// 从 1 开始，每轮先判断 <=5，结束本轮后再加 1。
for (let i = 1; i <= 5; i += 1) {
  // 把当前 i 加进上一轮 total，不在这里重置 total。
total += i;
}
console.log(total);
</script>
</body>
</html>
```

控制台预期：

```output
15
```

## 逐步读懂这个例子

i依次1到5，total依次1、3、6、10、15。i变为6后退出。+=把旧值与右边相加后写回。

## 自己改一处再观察

上限换为3和0，预测结果；把<=改成<再比较。

### 参考答案

<=3时累计6，上限0时累计0；<5只加到4，得到10。先列实际进入的i值再算总和，别只看循环表面上有数字5。

参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。

## 独立变式：倒计时与总次数

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。使用有限 for、更新、累加器和已学输出；不要求数组或计时器。

从空脚本写一个从 4 到 1 的倒计时，每轮输出剩余次数，同时累计实际执行了几轮；循环结束再输出执行轮数。先画起点、停止条件与更新方向，另测试起始次数为 0。

自查：正常顺序为 4、3、2、1，最后轮数 4；起始 0 时不进入循环，轮数 0。累计变量应在循环外保存。不会自动每秒延迟，不把同步四次日志称为真正的定时器；不要以无停止循环验证错误。

### 参考答案：独立变式

计数递减使条件最终为false，累计变量放循环外。start=0时没有倒计时日志，只输出轮数0。这是同步执行，不会每秒停一次。

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
const start = 4;
let rounds = 0;
for (let remaining = start; remaining >= 1; remaining--) {
  console.log(remaining);
  rounds++;
}
console.log("轮数", rounds);
</script>
</body>
</html>
```
