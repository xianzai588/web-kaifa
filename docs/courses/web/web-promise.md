# Promise 的完成与失败

观察立即执行的日志与Promise回调的顺序。

## 已经完成的 Promise 也有稍后的回调

Promise 是保存一次操作最终结果的对象，状态可能是 pending（待定）、fulfilled（成功）、rejected（失败）；一旦成功或失败，就不会再回到待定。**Promise 对象不是操作最后得到的数据本身。**

`Promise.resolve(5)` 建立一个成功值为 5 的 Promise；`.then(value=>...)` 登记成功回调，value 接收完成值。then 返回另一个 Promise，可以继续组合处理；`.catch(error=>...)` 登记失败回调。

成功回调如果 return 一个普通值，下一个 then 会取得该值；如果没有返回值，下一步取得 undefined。回调中抛出的错误会让后续链进入失败处理，而不是当成成功值继续。**链中的 return 是把本步结果交给下一步，不是把异步结果直接交给链外的同步语句。** 独立变式只组合这些已解释的传值步骤，不使用复杂并发API。

本例开始日志先执行，then 回调进入稍后处理的队列，当前脚本继续打印结束；当前同步执行栈结束后才打印 5。“调用栈”就是当前正在逐层执行的函数路径，这里不要求先学线程或底层事件循环，只观察明确的先后顺序。

失败实验要把整行改为 `Promise.reject(new Error("失败")).catch(error=>console.log(error.message));`，不是只把 resolve 名字换掉而不接错误。预期先“开始”“结束”，再“失败”。登记回调不会让前面的同步计算自动变成并行。

### 就地练习：回调比同步日志晚

把then前后各放日志，初始完成值设5。先排列日志顺序，再删除then回调的return观察下一级接到什么。

### 参考核对：回调比同步日志晚

同步日志先，回调稍后；缺return会使下一步得到undefined，不能把Promise对象当数字。

## 状态只确定一次，返回值形成下一条链

Promise有待定、完成、拒绝三种状态，一旦确定就不会改成另一种。构造函数传入的执行器立即运行，then/catch回调通过微任务安排在当前同步代码之后。then返回新的Promise，回调返回普通值会成为下一步完成值，抛错则成为下一步拒绝。

需要等待多项时Promise.all要求全部成功，任一拒绝就拒绝；allSettled收集每项结局。它们不替你限制并发数量或取消已开始的任务。先清楚每个回调交出了什么，再决定用哪种组合。

### 就地练习：失败不会自动取消同伴

两个独立任务交给Promise.all，其中一个拒绝。另一个已启动任务会自动停止吗？写出还需的取消设计。

### 参考核对：失败不会自动取消同伴

all拒绝不自动终止其他工作；需依赖操作支持取消并传递信号，另行决定是否收集各项结局。

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
// 这是当前脚本立即执行的同步语句。
console.log("开始");
// 登记成功回调；即使值已准备好，也不会抢在下一条同步日志之前运行。
Promise.resolve(5).then(value => console.log(value));
// 当前脚本先执行到这里，之后才处理 then 回调。
console.log("结束");
</script>
</body>
</html>
```

控制台预期：

```output
开始
结束
5
```

## 逐步读懂这个例子

先打印开始，登记then，继续打印结束，最后执行回调打印5。不要把Promise变量直接当最终的数据结果。

## 自己改一处再观察

把resolve换成reject(new Error("失败"))，用catch输出错误message。

### 参考答案

同步日志先执行，拒绝由catch打印message；如果没有catch或await的处理，可能产生未处理拒绝提示，不能只看成功分支。

参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。

## 独立变式：将完成值交给下一步

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。使用 resolve/reject、then/catch、函数返回和同步输出；不要求定时器或 Promise 并发组合。

独立建立成功链：初始完成值 4，第一步转换为三倍，下一步打印转换后的值；链外另打印开始与同步结束。另建立失败链，错误消息为“订单无效”，由 catch 输出。先预测哪些是同步日志、哪些是回调。

自查：同步日志先于回调；成功末步得到12，失败末步保留“订单无效”，不是把 Promise 对象当数字输出。第一步不返回转换值时后一步应得到 undefined；恢复后说明回调返回值如何交给下一步。

### 参考答案：独立变式

两条同步日志先出现。失败链的catch先于成功链的第二个then输出，因为成功链还要经过一次转换回调；第一步漏return时最后得到undefined。

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
console.log("开始");
// 第一个then返回12，后一个then才接到转换后的值；不是链外同步取值。
Promise.resolve(4).then(value => value * 3).then(value => console.log(value));
Promise.reject(new Error("订单无效")).catch(error => console.log(error.message));
console.log("同步结束");
</script>
</body>
</html>
```
