# async、await 与错误处理

在async函数中等待Promise，再用try/catch处理失败。

## 暂停这个函数，不是暂停整个页面

async 写在函数前，表示这个函数总是返回一个 Promise。await 读取某个 Promise 的完成值：未完成时让这个函数先挂起，当前其他代码可以继续；完成后恢复此函数的下一行。

**await 拿到成功值；await 遇到拒绝会在这里表现为抛错。** 因而本例的 try/catch 可以接住 Promise.reject 的错误。它不是把任何函数都变成后台线程，await 之前的同步重计算仍会占用当前执行线程。

load() 开始 → 执行到 await → 等待完成 → const value 得到数字 5 → 输出 5。定义 load 只保存函数，最后的 load() 才实际启动它。它返回的 Promise 不是数字 5；如果调用者想读取函数的返回结果，调用者也要使用 await 或 then。

将 resolve 改成 reject(new Error("加载失败"))，预期 catch 打印加载失败，不打印成功数字。把 console.log("调用之后") 写在 load() 后面，可以观察这条同步日志先于函数里的等待结果。本例已经在内部处理错误，不额外抛出；若函数移除了内部 catch，调用者就必须处理返回 Promise 的拒绝。

### 就地练习：暂停哪段代码

在load()调用后立刻打印“调用后”，内部await已成功的Promise，预测先后。

### 参考核对：暂停哪段代码

调用后同步日志先于await后的结果；等待暂停当前async函数，不暂停整个页面。

## async 总返回 Promise，await 不阻塞整个页面

async函数即使return普通值，也会把它作为Promise的完成值；await暂停当前async函数后续步骤，不会让整个浏览器停止。await一个拒绝Promise会在当前位置抛出异常，因此用相应try/catch处理，或把拒绝交给调用者。

两个独立请求若逐个await会依次等待；确实互不依赖时可用Promise.all并发等待。并发会增加服务负载，也需要决定失败、取消和旧结果如何处理。不要为了并发把必须使用前一步结果的操作错误地同时启动。

### 就地练习：函数返回仍是Promise

写async函数return 3，对比直接调用结果与await或then得到的值。

### 参考核对：函数返回仍是Promise

直接调用得到Promise，完成值才是3；调用方也要处理可能拒绝，async不把函数变成后台线程。

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
// async 函数返回 Promise；定义时还没有启动。
async function load() {
  try {
    // 等待这份 Promise，成功值才赋给 value；失败会进入 catch。
const value = await Promise.resolve(5);
    console.log(value);
  } catch (error) {
    console.log(error.message);
  }
}
// 调用函数才开始执行；内部 try/catch 负责这次演示的错误。
load();
</script>
</body>
</html>
```

控制台预期：

```output
5
```

## 逐步读懂这个例子

load开始后在await处等待值，成功时打印5。拒绝会进入catch。调用load本身得到Promise，所以不写await的调用处仍需考虑失败处理。

## 自己改一处再观察

将resolve替换为reject(new Error("加载失败"))，观察catch。

### 参考答案

把等待对象改为拒绝后，应只报告加载失败，不继续显示成功数据。try必须包住await语句，才能捕获该次拒绝。

参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。

## 独立变式：等待完成后返回账单

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。使用 async/await、已有Promise、数字计算和调用者处理；不请求网络。

独立写一个 async 函数，等待一个完成值20后加运费3并返回。调用者读取这个函数的完成值，而不是只把 Promise 输出为账单；调用后立刻另打印一条同步日志。再让等待对象拒绝为“价格不可用”。

自查：同步日志先出现，成功账单为23。拒绝时只报告价格不可用，不报告已生成0元或23元账单。必须能区分函数内部等待的值、函数返回的Promise和调用者读到的最终数字。

### 参考答案：独立变式

bill返回Promise，then读到的才是数字23。改Promise.resolve(20)为Promise.reject(new Error("价格不可用"))后，调用方只报告价格不可用，不能继续输出账单。

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
async function bill() {
  const price = await Promise.resolve(20);
  // 这里的23成为返回Promise的完成值，调用者仍需then或await读取。
  return price + 3;
}
bill().then(value => console.log("账单", value)).catch(error => console.log(error.message));
console.log("同步日志");
</script>
</body>
</html>
```
