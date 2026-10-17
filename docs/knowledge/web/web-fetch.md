# 请求、JSON与状态：把404、空数据与格式错误分别跑出来

页面向接口取活动数据时，不能只考虑“有两条活动”的理想情况。请求还可能慢、地址错、数据空、响应不是合法JSON，或者合法JSON却结构不符。本课用自己电脑上的静态文件模拟这些情况，不依赖公共接口、账号与网络稳定性。只有点击按钮才请求同目录文件，没有自动外网请求。前置只要求普通函数与DOM渲染；Promise、async与await由本课首次逐步解释。必须使用本地HTTP方式运行。

## 把原理一步一步拆开

### 1. HTTP请求与响应有不同层次
fetch('./items.json')发请求，await等待响应。response是包含状态码、头与读取内容方法的对象，不是已经解析好的活动数组。服务器返回404仍可能让fetch成功拿到Response，只有网络等层面的失败才通常直接拒绝。因此先检查response.ok，失败主动throw，不能以“进了try”当作HTTP成功。ok通常对应200—299状态，status给具体编号。

#### 就地练习：收到404不是断网

为缺文件与停止服务分别写Response/拒绝路径。

#### 参考核对：收到404不是断网

404通常仍有Response先检查ok，连接失败一般拒绝；两者不可都当空列表。

### 2. JSON是数据表示，不等于接口契约
response.json()读取响应体并解析JSON，这一步也需await，语法坏了会抛错。数组[]、对象{}、字符串、数字都可以是合法JSON。本例约定是“对象数组，每项title必须是字符串”，所以解析成功后还要Array.isArray和every校验。JSON属性名与字符串使用双引号，不允许JavaScript式注释或尾随逗号；文件后缀叫json不能证明内容正确。

#### 就地练习：合法JSON也要形状

依次用[]、{}、[{"title":1}]说明格式与合同。

#### 参考核对：合法JSON也要形状

三者都可解析，但只有满足对象数组与字符串标题的形状才按合同使用，[]是合法空结果。

### 3. async、await、try/catch怎样连接
Promise表示一个未来操作的结果：开始可能pending（等待中），结束可能fulfilled（兑现为结果）或rejected（拒绝并带错误）。它不是活动数组本身，也不是让网页自动更新的命令。fetch返回Promise；async函数也返回Promise，await取得兑现结果或把拒绝转为当前函数内可处理的错误。等待期间只暂停当前async函数的后续步骤，浏览器仍可处理其他事件，不是整个页面被冻结。try包住请求、HTTP检查、解析与结构校验；任何一步throw都进入catch，给用户可理解的失败提示。throw本身不显示页面，catch需要主动更新状态。不要只console.log报错，却让用户永远看到加载中。

#### 就地练习：await暂停谁

在请求函数调用后放同步日志，预测与await后结果的先后。

#### 参考核对：await暂停谁

调用外的同步日志可先执行；await只暂停当前async后续步骤，失败需catch主动显示。

### 4. 状态必须告诉用户下一步
初始说明“请选择”，点击后清空旧结果并显示正在加载；成功有数据显示数量与列表；成功但[]为空要说明“目前没有活动”；失败说明请求或数据问题并允许重试。空结果不是失败，坏JSON也不是“暂无活动”。这些区别帮助用户决定换条件、等待还是检查服务。生产环境错误可转换为更友好描述，同时保留技术证据供排查。

#### 就地练习：空结果与错误反馈

对正常、[]、坏JSON与404分别写状态及可做的下一步。

#### 参考核对：空结果与错误反馈

有数据给数量，[]提示暂无，错误提示失败可重试；不得都说没有活动。

### 5. 旧请求不能覆盖新选择
用户快速点正常再点空数组，两次请求返回顺序不保证与点击顺序相同。latest计数每次增加；函数保存自己的version，渲染前确认仍是最新一次。旧结果或旧错误直接返回，从而避免覆盖新状态。这个做法阻止过期渲染，不会取消实际网络请求；需要取消工作时可进一步学习AbortController。

#### 就地练习：旧失败也会倒灌

先慢请求后新成功，让旧请求最后失败，说明catch写状态前需要什么。

#### 参考核对：旧失败也会倒灌

本次version仍需等于latest；旧失败不能覆盖新成功，版本保护不自动取消网络。

## 在 VS Code 中创建、保存与运行

1. 在自己的练习目录里新建 `web-fetch` 文件夹，例如放在 `exercises/web/` 下；不要在 materials 原教材中覆盖文件。打开 VS Code，选择“文件 → 打开文件夹”，选中这个新文件夹。
2. 在左侧资源管理器用“新建文件”按下面清单创建文件。带 `/` 的名字表示子文件夹，例如 `assets/style.css` 需要 assets 文件夹，不能把斜杠当普通名字。逐个复制对应完整代码，Windows 用 Ctrl+S，macOS 用 Command+S 保存全部文件。
3. 本例必须从本地 HTTP 地址打开。在 VS Code 菜单选“终端 → 新建终端”，先核对当前目录就是这个练习文件夹。Windows 用 `Get-Location`，macOS/Linux 用 `pwd`。还没装 Python 的人先打开 [Web 环境的完整安装与本地服务器教程](#/setup?topic=web)，从第 6 节按自己的系统安装并通过版本检查，再回到本课；不需要另外安装 pip 包。
4. 按自己的系统只执行一条服务器命令。

Windows PowerShell（先用 `py --version` 确认 Python 3）：

```powershell
py -m http.server 8751 --bind 127.0.0.1
```

macOS/Linux（先用 `python3 --version` 确认 Python 3）：

```sh
python3 -m http.server 8751 --bind 127.0.0.1
```

如果 Windows 仅 `python --version` 可用且确实输出 Python 3，则用 `python` 替换 `py`。命令运行期间终端保持占用，不是卡住。把 `http://127.0.0.1:8751/` 填入浏览器地址栏，应看到请求状态实验的五个按钮。若出现文件列表，说明目录不对或尚未保存 index.html；不要用双击 HTML 的 file 地址继续请求实验。

完成后回终端按 Ctrl+C 停止。若端口占用，换8752，并同时改浏览器地址。不要把命令写进HTML文件，也不要创建用于404测试的missing.json。

文件清单：

- `index.html`
- `items.json`
- `empty.json`
- `broken.json`
- `wrong.json`


## 完整可运行示例

### 完整文件：index.html

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>请求状态实验</title>
    <style>
    *{
      box-sizing:border-box
    }
    body{
      font:1rem/1.7 sans-serif;
      max-width:40rem;
      margin:1rem auto;
      padding:1rem
    }
    button{
      padding:8px;
      margin:4px;
      max-width:100%;
      white-space:normal
    }
    li{
      overflow-wrap:anywhere
    }
    </style>
  </head>
  <body>
    <h1>请求状态实验</h1>
    <p>只在点击后请求本地练习文件，不访问外部接口。</p>
    <div>
      <button type="button" data-file="items.json">正常数据</button>
      <button type="button" data-file="empty.json">空数组</button>
      <button type="button" data-file="missing.json">404</button>
      <button type="button" data-file="broken.json">坏 JSON</button>
      <button type="button" data-file="wrong.json">结构错误</button>
    </div>
    <p id="status" role="status">请选择一种响应情况。</p>
    <ul id="list">
    </ul>
    <script>
    const status=document.querySelector('#status');
    const list=document.querySelector('#list');
    let latest=0;
    async function load(file){
      // 固定本次编号；其他调用继续增加latest不会改变这个局部version。
      const version=++latest;
      status.textContent='正在加载…';
      list.replaceChildren();
      try{
        const response=await fetch(`./${file}`,{
          cache:'no-store'
        });
        if(!response.ok)throw new Error(`HTTP ${response.status}`);
        const items=await response.json();
        if(!Array.isArray(items)||!items.every(item=>item&&typeof item.title==='string'))throw new Error('数据结构错误：期待带 title 字符串的对象数组');
        // 成功和失败都检查，过期操作不能覆盖最新选择。
        if(version!==latest)return;
        for(const item of items){
          const li=document.createElement('li');
          li.textContent=item.title;
          list.append(li);
        }
        status.textContent=items.length?`加载成功：${items.length} 项`:'加载成功，但目前没有活动。';
      }
      catch(error){
        // 成功和失败都检查，过期操作不能覆盖最新选择。
        if(version!==latest)return;
        status.textContent=`加载失败：${error.message}。请检查后重试。`;
      }
    }
    document.querySelectorAll('[data-file]').forEach(button=>button.addEventListener('click',()=>load(button.dataset.file)));
    </script>
  </body>
</html>
```

### 完整文件：items.json

```json
[
  {
    "title": "HTML 入门"
  },
  {
    "title": "CSS 排版"
  }
]
```

### 完整文件：empty.json

```json
[]
```

### 完整文件：broken.json

```json
{ this is not json }
```

### 完整文件：wrong.json

```json
{
  "title": "不是数组"
}
```

## 具体结果与解释

```output
点击正常数据：显示“加载成功：2 项”和HTML/CSS。点击空数组：成功但没有活动。点击404：提示HTTP404；坏JSON：解析失败；结构错误：期待对象数组。各次操作开始都出现加载状态，旧列表清空。
```

items.json是成功数据，empty.json为[]，broken.json故意写坏语法，wrong.json是合法对象但不是数组。不要创建missing.json，它专门测试404。按钮data-file记录目标文件，监听在点击后调用load。cache:no-store让本练习修改fixture后更容易直接看到新响应，不应据此理解为生产项目都应禁用缓存。

先打开Network，点404，核对请求地址与状态；点正常数据，看Response是否与items.json一致；点坏JSON，查看返回体而不是盲目改fetch。可在DevTools启用网络节流，观察正在加载状态，然后恢复默认。再快速点击不同按钮，确认最终界面对应最后一次选择。

## 两种常见问题与排查顺序

### 情况一：双击HTML后所有请求失败
看地址栏是否file开头。浏览器对本地文件读取施加限制，本课用本地HTTP服务运行；不要关闭浏览器安全策略或允许任意来源来解决。确认Python可用后，在此练习目录开终端，运行下方服务器命令，再从HTTP地址进入。

### 情况二：HTTP200却仍加载失败
检查json解析与约定结构。200只代表这次HTTP请求成功返回，不保证响应体是正确数据；错误页面HTML也可能被误返回成200。Network的Response、响应类型、Console错误行以及期待结构一起判断。真实跨域接口还要由服务器按需求设置CORS，不能在前端加一串不存在的“允许跨域”参数。

## 变化练习

把正常fixture新增第三项title为数字123，预测会出现哪一种状态；再修成字符串“Go接口”，要求列表出现三项。通过后快速点击正常与空数组，确认最后选择不被旧结果覆盖。

### 参考答案

数字title仍是合法JSON，但不满足字符串字段契约，因此应进入结构错误路径，而不是显示123或偷偷丢掉该项。修为字符串后成功3项。最后一次选择由latest/version比较保护，正常请求晚返回也不能把空结果覆盖。记录HTTP状态、响应体与界面文案，区分传输、语法、契约三层证据。

## 本课自查

- HTTP404为什么不能只靠catch判断？
- 合法JSON为什么还要做结构校验？
- 空数组和请求失败应该怎样区别反馈？
- latest方案有没有真正取消旧请求？
- 本地HTTP与关闭安全功能有何不同？

能运行示例是起点，不等于已经学完。请先遮住参考答案，预测变化结果，再独立修改并记录实际结果。如果仍有问题，向AI提供目标、文件结构、自己的代码、具体操作、期待与实际结果、已尝试步骤；让它先定位最小问题，再自己验证修改。

## 继续查证

- [MDN：使用Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)
- [MDN：JSON介绍](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/JSON)
- [Python：本地HTTP服务](https://docs.python.org/3/library/http.server.html)
