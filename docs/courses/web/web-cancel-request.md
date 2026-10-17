# 重叠请求与过期结果

让较旧的请求不能覆盖较新的选择。

## 先分清启动顺序和完成顺序

用户先选 A、再选 B，期望页面以 B 为准。但 A 的处理可能更慢，B 完成后 A 才完成。**最后完成的结果，不一定属于最后一次选择。** 如果每次成功都直接写 DOM，页面会倒退到旧选择。这里已经学过 fetch、Promise、事件与状态，专门解决它们组合后的时间问题。

### 就地练习：最后完成不一定最新

按A慢、B快的顺序发起，先写启动与完成两条顺序。页面最终应取哪个选择？

### 参考核对：最后完成不一定最新

取最后选择B，即使A最后完成。不能按网络完成先后直接覆盖。

## 三个完整文件与启动

在独立目录保存下列三个文件；终端在这个目录运行 `python -m http.server 8765`，访问 http://127.0.0.1:8765/，Ctrl+C 停止。两个 JSON 都由真实本地 HTTP 请求取得，pause 只在取得数据后人为延迟处理，用于稳定制造完成先后，不能称作真实网络速度测量。

index.html：

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>过期结果实验</title>
</head>
<body>
  <button id="slow" type="button">先启动较慢结果</button>
  <button id="fast" type="button">再启动较快结果</button>
  <p id="result" role="status">尚未选择</p>
  <script>
    const result = document.querySelector("#result");
    let latest = 0;
    // 人为延迟处理结果，制造可重复的完成顺序；不是测量真实服务器速度。
    function pause(milliseconds) {
      return new Promise(resolve => setTimeout(resolve, milliseconds));
    }
    async function load(file, delay) {
      // 先增加编号，再保存本次编号；每次调用都有自己的 request。
      latest += 1;
      const request = latest;
      result.textContent = "加载中";
      try {
        const response = await fetch(file);
        if (!response.ok) throw new Error("HTTP " + response.status);
        const data = await response.json();
        if (data === null || typeof data !== "object" || typeof data.title !== "string") {
          throw new Error("title 必须是字符串");
        }
        await pause(delay);
        // 旧成功不能覆盖较新的选择。
        if (request !== latest) return;
        result.textContent = data.title;
      } catch (error) {
        // 旧失败也不能盖掉较新的正常状态。
        if (request === latest) result.textContent = "失败：" + error.message;
      }
    }
    document.querySelector("#slow").addEventListener("click", () => load("./slow.json", 600));
    document.querySelector("#fast").addEventListener("click", () => load("./fast.json", 20));
  </script>
</body>
</html>
```

slow.json：

```json
{"title":"前一次慢结果"}
```

fast.json：

```json
{"title":"最后一次快结果"}
```

## 跟踪两个编号

latest 是所有调用共同读取的最新编号；request 是每次 load 内保存的本次编号。点击 slow 后为 1，随后点击 fast 后 latest 为 2；fast 的 request=2 可以写结果，slow 稍后比较 1!==2，就 return。return 在此结束这次 load，不更新页面。catch 也比较编号，避免旧失败破坏新界面。

pause 用 `new Promise(...)` 创建待定 Promise：构造器给回调一个 resolve 函数，调用它才成功完成。`setTimeout(resolve, milliseconds)` 安排在给定毫秒后调用 resolve；1000 毫秒是一秒。await pause 等待这个模拟过程。这里的新语法只为制造实验，业务代码不必人为加延迟。

### 就地练习：编号各属于谁

先启动A得到1，再启动B得到2，分别写A/B的本次编号与共享latest。A成功及失败各应怎样？

### 参考核对：编号各属于谁

本次编号1、2不变，共享latest为2；A成功和失败都不得改最新界面。

## 先预测，再故意破坏保护

先点慢按钮，在 600 毫秒内点快按钮；等一秒，最后应仍是“最后一次快结果”。删除成功分支的编号检查再做同一实验，会先出现快结果，随后被慢结果覆盖。恢复检查。再把慢文件改成坏 JSON，观察旧失败不会覆盖较新选择；若操作太慢，重新刷新后快速点击。

## 版本判断与请求取消

编号判断控制“结果是否还能写界面”；AbortController 用于通知 fetch 取消不再需要的请求。controller.signal 是可传给请求的取消信号，controller.abort() 发出取消；取消也会让 Promise 拒绝，需要在 catch 中区分已取消的旧操作。只取消并不能替代所有结果检查，尤其当请求已经完成、后续处理还在进行时。完整 React 请求清理会在后面的组件生命周期章节使用；本节的完整例子使用版本判断。

### 就地练习：取消和写入保护

fetch已完成但数据处理仍在等待时调用abort，能否保证旧处理不更新DOM？

### 参考核对：取消和写入保护

不能自动终止任意后处理；成功、失败及finally的界面更新仍需确认属于当前意图。

## 独立变式：三次选择与旧失败

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。使用已教编号、Promise延迟、fetch和状态更新；延迟是人为实验，不是网络测速。

独立写甲、乙、丙三个读取选择，开始后的模拟等待依次600、100、300毫秒，等待后才请求各自本地JSON。快速按甲→乙→丙，先列启动与完成顺序，再写最新选择保护；再把甲资源改为不存在。

自查：约束操作发生在600毫秒内，最后始终属于最后选的丙，不属于最早启动但最后完成的甲。甲旧成功、甲旧404均不能改丙界面；若最后选的丙失败，则显示丙失败，乙成功不能覆盖。每个写界面的出口都要依据当前编号。

## 取消与“只有最新结果可写”分别解决什么

AbortController可请求中止fetch等支持取消的操作，但不能自动撤销已经完成的副作用，也不能中止任意用户代码。请求编号保护界面写入：成功、失败、finally里的加载标志都要检查是否仍属最新请求。

如果等待发生在fetch之前，AbortController并不能自动取消那段延迟。保留编号判断能防止旧失败覆盖新成功，测试也应覆盖“旧失败晚到”和“最后一次本身失败”，不能只验证慢成功。

### 参考答案：独立实现与验收

在本地HTTP目录准备a.json、b.json、c.json，分别为 `{"name":"甲书单"}`、`{"name":"乙书单"}`、`{"name":"丙书单"}`。完整页面如下：

```html
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>独立练习</title>
</head>
<body>
<h1>选择最新书单</h1>
<button data-name="a">甲</button><button data-name="b">乙</button><button data-name="c">丙</button>
<p id="status" role="status">尚未读取</p>
<script>
let latest = 0;
const status = document.querySelector("#status");
const delays = { a: 600, b: 100, c: 300 };
async function load(name) {
  // 每次调用固定保存自己的编号；共享latest只记录最后一次意图。
  const current = ++latest;
  status.textContent = `正在读取${name}`;
  try {
    await new Promise(resolve => setTimeout(resolve, delays[name]));
    const response = await fetch(`./${name}.json`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const value = await response.json();
    if (value === null || typeof value !== "object" || typeof value.name !== "string") throw new Error("字段不合格");
    // 成功和失败都先检查编号，旧请求不能改掉新选择的界面。
    if (current !== latest) return;
    status.textContent = `${name}：${value.name}`;
  } catch (error) {
    // 成功和失败都先检查编号，旧请求不能改掉新选择的界面。
    if (current !== latest) return;
    status.textContent = `${name}失败：${error.message}`;
  }
}
for (const button of document.querySelectorAll("button[data-name]")) {
  button.addEventListener("click", () => load(button.dataset.name));
}
</script>
</body>
</html>

```

600毫秒内快速按甲→乙→丙，启动顺序a/b/c，通常完成b/c/a，最终必须是c：丙书单。把a.json改名后再试，旧404也不能改c；把c.json改名则最后为c失败，旧a成功不能覆盖它。编号在每次启动时递增，在成功与失败写DOM前都检查。

### 就地练习：最后选择本身失败

让A旧成功很晚到，B最后选择404。写出最终应显示什么，再与仅测慢成功对比。

### 参考核对：最后选择本身失败

保留B失败，不被A成功覆盖；两条方向都验证，才不只保护成功路径。
