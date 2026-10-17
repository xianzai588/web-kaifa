# 前端与自己的 Go API 联调

让界面请求实际服务，用协议定位错误。

## 先明确浏览器与后端分别做什么

前端是浏览器里的界面与操作逻辑；后端是等待 HTTP 请求、检查输入并处理数据的服务器程序。API 是双方按方法、地址、字段和结果调用的约定。**按钮被点击不等于服务器已经接受数据；收到约定的成功响应后才提示成功。** Go 主线已经教过程序和 HTTP，本节用实际提供的 Go 服务，不要求再同时学习 Python/PHP/Node 后端。

### 就地练习：何时才能说已创建

列出点击、请求发出、201且字段合格、随后GET四个时点的界面用语。

### 参考核对：何时才能说已创建

前两步只表示提交中；201确认创建，GET再核对列表。不得在点击时先写已保存。

## 先读这份 HTTP 合同

| 操作 | 方法与路径 | 正常结果 |
| --- | --- | --- |
| 列表 | GET /api/events | 200，活动数组 |
| 详情 | GET /api/events/数字 | 200，一条对象；不存在时 404 |
| 创建 | POST /api/events | JSON 含 title、location；201，创建后的对象 |
| 修改 | PATCH /api/events/数字 | 至少修改 title 或 location；200，修改后对象 |
| 删除 | DELETE /api/events/数字 | 204，没有响应正文 |

状态码、头、正文来自前面的 fetch/HTTP 章节。POST 表示在目标集合创建资源；PATCH 表示部分修改；DELETE 表示删除。204 没正文，不能无条件 response.json()。完整配套检查 JSON/字段错误 400、缺资源 404、正文过大 413、格式不支持 415；错误正文的 error.code/message 是给程序和人看的错误线索。

### 就地练习：204不解析JSON

分别为创建与删除成功决定状态和是否读JSON；删除后无条件json会怎样？

### 参考核对：204不解析JSON

创建201读合同JSON；删除204无正文，跳过JSON解析，否则可能因空正文失败。

## 启动完整服务，先验证原版

如果沿 Web 路线学习、还没准备 Go，先读 [Go 环境安装](#/setup?topic=go) 和 [Go 编辑运行起步](#/learn/go/go-vscode)，确认终端能识别 go 命令。下面的 go.mod 是这个独立项目记录模块名与 Go 要求的文件；不需要自己在整个资料仓库新建它。服务代码已经配齐，阅读其实现时再按 Go 语言与 HTTP 章节顺序学习，不把“运行了参考服务”当成掌握后端。

下载 [Go 内存 API](../../../assets/downloads/web-followup-08.zip)，解压到独立目录，用 VS Code 打开它，按 README 的 Go 工具链要求检查环境。终端当前目录应有 go.mod、main.go、api.go、store.go、web 等，不在资料仓库根目录初始化模块。先 go test ./...，再 go run .，访问 http://127.0.0.1:8768/；Ctrl+C 停止。原版已经提供完整 CRUD 界面，本节后面的最小替换专注读取与创建。

Go 服务同时提供 web 目录的网页和 /api/events，终端必须一直运行；只打开 HTML 文件不会启动后端。默认内存模式重启恢复种子，新建数据会丢失。这里没有身份与权限，只在本机使用虚构数据；持久化和认证沿后续 Go 章节学习。

## 在独立副本替换两份完整前端文件

保留原版完整 CRUD 项目，在用于小实验的副本中完整替换 web/index.html 与 web/app.js；其他 Go 文件不变。小例子只实现读取和创建，不伪称已实现修改删除。

web/index.html：

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>自己的活动 API</title>
</head>
<body>
  <h1>活动 API 联调小例子</h1>
  <p>本机内存教学服务，没有账号；重启会丢失新增记录。</p>
  <form id="editor">
    <label for="title">虚构活动标题</label>
    <input id="title" name="title" required>
    <button id="create" type="submit">向服务器创建</button>
  </form>
  <button id="refresh" type="button">重新读取服务器列表</button>
  <p id="status" role="status">尚未读取</p>
  <ul id="list"></ul>
  <!-- 元素已经存在，脚本才能按 ID 找到它们。 -->
  <script src="app.js"></script>
</body>
</html>
```

web/app.js：

```javascript
const form = document.querySelector("#editor");
const input = document.querySelector("#title");
const create = document.querySelector("#create");
const refresh = document.querySelector("#refresh");
const status = document.querySelector("#status");
const list = document.querySelector("#list");

// 所有会争用界面的操作共用版本；创建也能使先前读取过期。
let latest = 0;
let creating = false;

async function load(message) {
  // 创建进行时先完成写操作，避免读状态抢掉创建状态。
  if (creating) return;
  latest += 1;
  const request = latest;
  status.textContent = message ? message + "，正在重新读取服务器" : "正在读取服务器";
  list.replaceChildren();
  try {
    const response = await fetch("/api/events");
    if (!response.ok) throw new Error("HTTP " + response.status);
    const items = await response.json();
    if (!Array.isArray(items) || items.some(item => item === null || typeof item !== "object" || typeof item.id !== "number" || typeof item.title !== "string")) {
      throw new Error("列表字段错误");
    }
    // 当前结果才可提交列表；旧成功不能追加或覆盖新结果。
    if (request !== latest) return;
    list.replaceChildren();
    for (const item of items) {
      const li = document.createElement("li");
      li.textContent = item.id + "：" + item.title;
      list.append(li);
    }
    const summary = "服务器返回 " + items.length + " 条活动";
    status.textContent = message ? message + "；" + summary : summary;
  } catch (error) {
    // 旧失败同样不能修改最新操作的状态。
    if (request !== latest) return;
    status.textContent = message
      ? message + "；列表刷新失败：" + error.message + "，请重新读取核对，不要重复创建"
      : "读取失败：" + error.message;
  }
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  if (creating) return;
  // 包括输入失败在内的新操作，都不能再被先前的读取覆盖。
  latest += 1;
  const operation = latest;
  const title = input.value.trim();
  if (title === "") {
    status.textContent = "标题不能只有空格";
    return;
  }
  creating = true;
  create.disabled = true;
  refresh.disabled = true;
  input.disabled = true;
  status.textContent = "正在创建，尚未成功";
  // 只在收到合格的201后记录id；刷新失败也不能抹掉已确认的创建事实。
  let createdId = null;
  try {
    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title, location: "本地演示" })
    });
    const saved = await response.json();
    if (response.status !== 201) {
      throw new Error("HTTP " + response.status + "：" + JSON.stringify(saved));
    }
    if (saved === null || typeof saved !== "object" || typeof saved.id !== "number") {
      throw new Error("创建响应字段错误");
    }
    if (operation !== latest) return;
    createdId = saved.id;
    status.textContent = "已创建 #" + createdId + "，将读取列表核对";
    form.reset();
  } catch (error) {
    if (operation === latest) status.textContent = "创建失败：" + error.message;
  } finally {
    creating = false;
    create.disabled = false;
    refresh.disabled = false;
    input.disabled = false;
  }
  // 创建确认与随后真实 GET 保持一条链，刷新失败不误报创建未发生。
  if (createdId !== null && operation === latest) await load("已创建 #" + createdId);
});

refresh.addEventListener("click", () => load(""));
load("");
```

## 读一次创建请求的全部选项

submit 事件发生后，event.preventDefault 阻止浏览器原生导航；trim 检查空白，disable 临时避免同一按钮重复操作。fetch 第二参数是选项对象：method 指 POST，headers 是附加说明，Content-Type:application/json 告诉服务器如何读正文；body 才是 JSON.stringify 生成的实际文字。**设置 Content-Type 不会把普通对象自动变成 JSON。**

返回响应后先读取正文，再检查必须为 201 和 id 为数字，才报告已创建。form.reset 清掉已确认成功的输入；失败不清输入，finally 在两条路径后恢复控件。creating 表示写操作是否仍在进行，disabled=true 使输入、创建和重读控件暂时不能操作，避免旧读状态抢掉创建状态，也避免用户在等待时输入新草稿却被成功重置。

**列表与数量只由最新读取的同一份响应提交；创建之后必须再次真实 GET，不能在页面里臆造一条已保存记录。** latest 是界面操作版本，load 保存本次 request，提交保存 operation；新提交也增加版本，使先前读取过期。旧成功在循环追加前被挡住，旧失败在 catch 写文字前也被挡住。版本检查后的渲染先替换旧列表，因此重叠读取不会累计重复行。

load 的 message 参数是已经确认的创建说明，普通读取传空文字；它保留“创建已经完成”与“随后刷新是否成功”的区别。创建成功后自动等待一次 load；若这次读取失败，显示已创建但刷新失败，不能误称创建没发生而建议重复POST。登记重读按钮时传回调，再由回调传空文字，不把事件对象误当确认说明。

### 就地练习：Content-Type不会转换对象

圈出POST选项的method、headers、body，指出JSON.stringify负责什么，失败时为何保留输入。

### 参考核对：Content-Type不会转换对象

头说明格式，stringify才生成JSON文字；服务器拒绝不该清掉用户仍需修改的草稿。

## 同源与 CORS 要解决哪个问题

来源由协议、主机、端口组成：这里网页与 API 都在 http://127.0.0.1:8768，所以同源；换成 5173 或把 127.0.0.1 改为 localhost 都可能成为不同来源。CORS 是浏览器允许网页跨来源读取响应的规则，由后端明确允许来源；它不是账号验证，也不能阻止 curl 等直接调用。

第一次保持同源，让请求、字段与状态都跑通。需要独立 Vite 前端时再按 README 配 ALLOWED_ORIGIN 与接口基地址，并在重启后核对实际 Origin。后端不会自动读取前端 .env；密钥不能放进会发送到浏览器的前端配置。

### 就地练习：换端口就是另一来源

网页在5173，API在8768，即使同电脑仍是否同源？CORS能否代替服务端登录授权？

### 参考核对：换端口就是另一来源

端口不同为跨源；CORS控制浏览器读取，不提供身份或对象权限，也不阻止直接客户端调用。

## 专门验证重叠读取

先在 Network 限速或测试工具中控制响应完成时间，让启动读取尚未完成就连续点“重新读取”。预先记录启动顺序与最后一次操作：最终 li 行数应等于最新响应数组长度，不能两份响应都追加一次。再让旧读取失败而新读取成功，最新正常结果不能被旧错误改掉；反过来最后读取失败，旧成功也不能把失败界面改成成功。

还要交叉测试：初始慢读开始后创建一条记录；创建确认后的新读先完成，旧读后完成。最终列表必须是包含新记录的那份，不重复，状态保留真实创建确认。若后台已创建而新读失败，显示“已创建/列表刷新失败”，用户先重读核对。仅测一次点击不会证明这些时间边界正确。这里的版本来自 [重叠请求](#/learn/web/web-cancel-request)，不是取消所有网络操作；POST是否创建由服务器合同决定。

### 就地练习：旧读取晚于新创建

让旧GET先启动但晚于POST201和随后新GET完成，写出最终列表和状态应来自哪里。

### 参考核对：旧读取晚于新创建

只提交新GET的数组、无重复，并保留真实创建确认；旧成功和旧失败都不得覆盖。

## 真实数据链与失败验证

在 Network 看 GET /api/events 的数组；创建一个虚构标题，确认 POST 的 Request Payload 与响应 201/新 id；随后应自动出现新的 GET，列表找到该记录，状态同时确认已创建与本次条数。创建进行时重读控件暂时不可操作，成功或失败后恢复。关闭 Go 服务再读取应失败，不显示伪造成功。只填空格应被界面拒绝；为了验证服务器边界，可在原版完整项目按 README 使用坏 JSON、数字标题或未知字段请求，确认拒绝且列表未变。

恢复原版副本再做完整链：创建 → 列表 → 修改地点 → 详情核对 → 删除 → 再读 404。删除 204 不解析空正文。小例子通过不能代替完整 CRUD、数据库和两用户权限验收；留下实际方法/路径/状态/正文结果，而不是一张成功按钮截图。

## 独立变式：独立发送地点并核对服务器记录

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。保留Go服务工程，前端从空白写自己的表单/请求流程；使用已学HTTP合同、输入/JSON、版本保护，不另学一门后端语言。

增加独立location输入及对应label，按合同创建后自动重新读服务器列表，显示title与location。自己确定两个字段怎样检查：标题不能仅空白，地点可空但类型仍是文字。重复读与创建交叉操作不能累计旧列表。

自查：有效创建只有真实201后确认，随后GET包含两字段；只空白标题不应创建，服务器拒绝时保留输入。读取不存在的id应404，停服务时显示失败而非已保存。初始慢读+连续重读、创建后新读先于旧读完成时，行数仍等于最新响应且不重复，创建确认不被旧读取覆盖。

## 创建已成功但刷新失败，不应重复创建

写请求确认与列表读取是两次操作。POST收到201且字段符合合同，创建已发生；随后的GET失败只说明界面未能重新核对，不能向用户暗示“没创建，再点一次”。保留确认信息，允许重读，减少重复写入。

后端状态是事实来源，前端做体验校验仍需处理服务端拒绝。网络断开时写请求可能出现结果不确定，真实业务应设计幂等键或查询核对；不能把所有fetch错误都当服务器绝对没有执行。

### 参考答案：独立实现与验收

在本节已运行的Go内存API副本，完整替换web/index.html和web/app.js；服务端不改。先保存两文件，重新访问同源页面：

web/index.html：

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>自己的活动 API</title>
</head>
<body>
  <h1>活动 API 联调小例子</h1>
  <p>本机内存教学服务，没有账号；重启会丢失新增记录。</p>
  <form id="editor">
    <label for="title">虚构活动标题</label>
    <input id="title" name="title" required>
    <label for="location">地点（可空）</label>
    <input id="location" name="location">
    <button id="create" type="submit">向服务器创建</button>
  </form>
  <button id="refresh" type="button">重新读取服务器列表</button>
  <p id="status" role="status">尚未读取</p>
  <ul id="list"></ul>
  <!-- 元素已经存在，脚本才能按 ID 找到它们。 -->
  <script src="app.js"></script>
</body>
</html>
```

web/app.js：

```javascript
const form = document.querySelector("#editor");
const input = document.querySelector("#title");
const locationInput = document.querySelector("#location");
const create = document.querySelector("#create");
const refresh = document.querySelector("#refresh");
const status = document.querySelector("#status");
const list = document.querySelector("#list");

// 所有会争用界面的操作共用版本；创建也能使先前读取过期。
let latest = 0;
let creating = false;

async function load(message) {
  // 创建进行时先完成写操作，避免读状态抢掉创建状态。
  if (creating) return;
  latest += 1;
  const request = latest;
  status.textContent = message ? message + "，正在重新读取服务器" : "正在读取服务器";
  list.replaceChildren();
  try {
    const response = await fetch("/api/events");
    if (!response.ok) throw new Error("HTTP " + response.status);
    const items = await response.json();
    if (!Array.isArray(items) || items.some(item => item === null || typeof item !== "object" || typeof item.id !== "number" || typeof item.title !== "string" || typeof item.location !== "string")) {
      throw new Error("列表字段错误");
    }
    // 当前结果才可提交列表；旧成功不能追加或覆盖新结果。
    if (request !== latest) return;
    list.replaceChildren();
    for (const item of items) {
      const li = document.createElement("li");
      li.textContent = item.id + "：" + item.title + " / " + item.location;
      list.append(li);
    }
    const summary = "服务器返回 " + items.length + " 条活动";
    status.textContent = message ? message + "；" + summary : summary;
  } catch (error) {
    // 旧失败同样不能修改最新操作的状态。
    if (request !== latest) return;
    status.textContent = message
      ? message + "；列表刷新失败：" + error.message + "，请重新读取核对，不要重复创建"
      : "读取失败：" + error.message;
  }
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  if (creating) return;
  // 包括输入失败在内的新操作，都不能再被先前的读取覆盖。
  latest += 1;
  const operation = latest;
  const title = input.value.trim();
  const location = locationInput.value.trim();
  if (title === "") {
    status.textContent = "标题不能只有空格";
    return;
  }
  creating = true;
  create.disabled = true;
  refresh.disabled = true;
  input.disabled = true;
  locationInput.disabled = true;
  status.textContent = "正在创建，尚未成功";
  // 只在收到合格的201后记录id；刷新失败也不能抹掉已确认的创建事实。
  let createdId = null;
  try {
    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title, location: location })
    });
    const saved = await response.json();
    if (response.status !== 201) {
      throw new Error("HTTP " + response.status + "：" + JSON.stringify(saved));
    }
    if (saved === null || typeof saved !== "object" || typeof saved.id !== "number" || typeof saved.title !== "string" || typeof saved.location !== "string") {
      throw new Error("创建响应字段错误");
    }
    if (operation !== latest) return;
    createdId = saved.id;
    status.textContent = "已创建 #" + createdId + "，将读取列表核对";
    form.reset();
  } catch (error) {
    if (operation === latest) status.textContent = "创建失败：" + error.message;
  } finally {
    creating = false;
    create.disabled = false;
    refresh.disabled = false;
    input.disabled = false;
    locationInput.disabled = false;
  }
  // 创建确认与随后真实 GET 保持一条链，刷新失败不误报创建未发生。
  if (createdId !== null && operation === latest) await load("已创建 #" + createdId);
});

refresh.addEventListener("click", () => load(""));
load("");
```

虚构标题与地点成功后，POST201确认再GET，列表应同时显示两个字段；地点可空，标题只空白则不提交。服务端400时保留输入；停服务时显示失败。为验收版本保护，控制旧GET晚于创建后的新GET返回，最终列表只对应新响应、无重复，状态保留创建确认。未运行这些交叉场景时不能只据一次成功创建就称全部竞态通过。

### 就地练习：刷新失败不要重复POST

POST201已确认，接着GET失败。给用户写准确反馈与下一步操作。

### 参考核对：刷新失败不要重复POST

已创建，但列表刷新失败；允许重新读取核对，避免暗示未创建而重复写入。网络断开导致写入不确定另需幂等或查询合同。
