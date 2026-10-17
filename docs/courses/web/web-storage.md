# localStorage 与序列化

保存一个简单对象，刷新后读取，并处理坏JSON。

## 一份浏览器存储如何读写

localStorage 是浏览器提供的本地键值存储。键 key 是字符串名字，本例是 course-book-storage-demo；值 value 也只能以字符串形式保存。`getItem(key)` 读取值，没保存过时返回 null；`setItem(key,value)` 写入这一个键，不会上传到服务器。

**刷新后能读取，不等于跨设备同步或永远不会丢失。** 浏览器设置、空间、隐私模式或用户清理都可能影响存储。通过本地 HTTP 服务打开这个独立例子，地址的协议、主机、端口组成来源；同一来源共享这份存储，换端口或换浏览器可能就读不到。同源概念在后面的 API 联调再次展开。

保存路径：对象 → JSON.stringify → 字符串 → setItem。读取路径：getItem → 字符串或 null → JSON.parse → 检查 title 是字符串 → 显示。解析失败或形状错误时仅显示警告，原字符串仍留在存储中供排查，不自动覆盖。

在该独立页面的 Console 输入 `localStorage.getItem("course-book-storage-demo")` 观察原文；备份后，用 setItem 只将这个键改成坏 JSON。刷新应显示读取失败；再次主动点保存才恢复演示值。不要执行 localStorage.clear，它会影响这个来源的其他记录。

### 就地练习：缺键不是坏JSON

只在专用练习键上比较未保存、合法对象、坏JSON三种读取。哪种能显示默认提示，哪种必须保留原文？

### 参考核对：缺键不是坏JSON

缺键null可提示未保存；合法对象还需字段校验；坏JSON警告并保留原串，不能自动覆盖。

## 来源、异常与恢复策略

localStorage按来源隔离，来源包括协议、主机和端口；localhost与127.0.0.1也不同。它是同步字符串存储，写满配额或浏览器策略限制时可能抛错。用户可以编辑它，因此不适合放密码、可靠权限或只能由服务器确认的事实。

读失败时保留原字符串供备份与排错，不能在catch里立刻写默认值覆盖。需要迁移格式时增加明确版本，先验证再迁移，失败可回退；多标签页还要考虑storage事件与覆盖冲突，单页保存成功不证明跨端同步。

### 就地练习：同一电脑也可能不同来源

比较http的localhost:8765、127.0.0.1:8765、127.0.0.1:8766三处存储是否相同。

### 参考核对：同一电脑也可能不同来源

主机或端口变化均改变来源，不能期待共享；本地保存也不是跨设备同步。

## 先看一个完整例子

新建自己的 storage-demo 目录，用 VS Code 打开这个文件夹；在其中保存下面的 index.html。打开“终端 → 新建终端”，当前目录应就是 storage-demo，能找到这个文件；在该目录启动本地 HTTP 服务：

```powershell
python -m http.server 8765
```

需要已安装 Python；可先按 [Web 环境](#/setup?topic=web) 或 [模块章节的本地HTTP运行步骤](#/learn/web/web-modules) 准备，也可使用该教程说明的 Live Server。浏览器访问 http://127.0.0.1:8765/，不要双击成 file 地址；服务保持运行，Ctrl+C 停止。修改后先保存，再刷新同一个 HTTP 地址。

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>本节小练习</title>
</head>
<body>
<button id="save" type="button">保存演示值</button><p id="result">未读取</p>
<script>
// 独立演示键，只保存这个小例子，不能清空整个 localStorage。
const key = "course-book-storage-demo";
const result = document.querySelector("#result");
try {
  // 读取到的是字符串，缺少这个键时得到 null。
  const raw = localStorage.getItem(key);
  if (raw !== null) {
    // 格式合法仍需检查形状，避免把错误字段当正常记录。
    const saved = JSON.parse(raw);
    if (saved === null || typeof saved !== "object" || typeof saved.title !== "string") {
      throw new Error("记录形状错误");
    }
    result.textContent = saved.title;
  }
} catch (error) { result.textContent = "读取失败，请保留原记录再排查"; }
document.querySelector("#save").addEventListener("click", () => {
  try {
    // 只在用户主动点击时，把对象序列化后保存为字符串。
    localStorage.setItem(key, JSON.stringify({ title: "已保存" }));
    result.textContent = "已保存";
  } catch (error) { result.textContent = "保存失败"; }
});
</script>
</body>
</html>
```

## 逐步读懂这个例子

使用独立演示键，不碰学习网站记录。保存后刷新，JSON被还原，title显示已保存。try/catch处理不可用存储或坏JSON；示例不会遇到坏数据就静默覆盖。

## 自己改一处再观察

在独立示例中把这个演示键的值改成坏JSON，刷新，记录错误表现，再保存恢复。

### 参考答案

显示读取失败，原记录仍可检查；主动保存才写入新演示值。

参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。

## 独立变式：保存自己的阅读偏好

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。使用输入/事件、对象、JSON、getItem/setItem与已教形状检查；通过同源HTTP运行。

从空白创建专用练习，用 own-reading-preferences 这个新键保存 {topic:文字, minutes:数字}。用户主动点保存后才写入；刷新时读取并检查两个字段，缺键显示未保存，失败保留原字符串。不要写学习网站的键。

自查：保存“Go”和25后刷新仍能读到两字段；尚未保存时不把 null 当JSON对象。坏JSON或minutes为文字时显示警告且原文未被自动覆盖；只有用户主动恢复或保存才改变记录，不使用 clear 清空来源中的其他键。

### 参考答案：独立实现与验收

在独立HTTP目录保存以下index.html。新页面只使用own-reading-preferences，不触碰学习网站进度。

```html
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>独立练习</title>
</head>
<body>
<h1>阅读偏好</h1>
<label for="topic">主题</label><input id="topic">
<label for="minutes">分钟</label><input id="minutes" type="number">
<button id="save" type="button">保存</button><p id="status" role="status"></p>
<script>
const key = "own-reading-preferences";
const topic = document.querySelector("#topic");
const minutes = document.querySelector("#minutes");
const status = document.querySelector("#status");
function valid(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    && typeof value.topic === "string" && value.topic.trim() !== ""
    && typeof value.minutes === "number" && Number.isFinite(value.minutes) && value.minutes >= 0;
}
try {
  const raw = localStorage.getItem(key);
  if (raw === null) { status.textContent = "尚未保存"; }
  else {
    // 格式成功之后还要验证字段；失败时不覆盖raw，保留恢复机会。
    const value = JSON.parse(raw);
    if (!valid(value)) throw new Error("字段不合格");
    topic.value = value.topic;
    minutes.value = String(value.minutes);
    status.textContent = "已读取保存的偏好";
  }
} catch (error) { status.textContent = "读取失败，原记录保留"; }
document.querySelector("#save").addEventListener("click", () => {
  const value = { topic: topic.value.trim(), minutes: Number(minutes.value) };
  if (minutes.value.trim() === "" || !valid(value)) { status.textContent = "请检查主题和分钟"; return; }
  try {
    localStorage.setItem(key, JSON.stringify(value));
    status.textContent = "已保存";
  } catch (error) { status.textContent = "保存失败，未确认成功"; }
});
</script>
</body>
</html>

```

保存Go与25，刷新应恢复两个输入。用开发者工具只把这个演示键改成坏JSON或把minutes改成文字，刷新应警告且原字符串保留；用户主动保存正确数据后才替换。禁止调用localStorage.clear，因为它会删掉同来源其他键。
