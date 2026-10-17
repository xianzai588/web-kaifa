# DOM、事件与界面状态：让搜索与数量一起更新

社团活动列表要随关键词变化，还要同步显示数量。若输入框只改列表、计数按钮再单独计算，很容易出现“列表一项，提示三项”。本课把当前输入视为状态，用一个render函数从同一份数据计算列表与数量，事件只告诉它“输入变了”。先学JavaScript数组与函数，知道filter返回筛选结果；再来理解浏览器怎样把HTML变成可操作的对象。

## 把原理一步一步拆开

### 1. DOM是页面的对象树
浏览器解析HTML后建立DOM，每个元素是可被脚本找到和修改的节点。document表示当前文档；querySelector('#keyword')寻找第一个匹配id的元素，找不到会返回null。源HTML只是起点，脚本可以添加或删除节点，所以Elements里看到的是当前树。脚本放body末尾时，前面的input与ul已经被解析，避免过早查询找不到元素；另一选择是外部脚本defer。

#### 就地练习：当前树不是磁盘

改textContent后对比Elements与源文件，刷新为什么还会再次变新？

#### 参考核对：当前树不是磁盘

源码未改，刷新重新执行脚本才更新DOM。

### 2. 事件是发生了什么，不是直接给你正确业务结果
input事件表示用户输入值发生变化，click表示点击，submit表示表单提交。addEventListener把一个函数登记给事件，之后事件发生浏览器才调用它；不要写render()当监听参数，那会立即执行并传入返回值。一个初始化入口绑定一次事件，重复更新列表只调用render，避免每次渲染又绑定一次导致一次输入执行多遍。

#### 就地练习：重复绑定会怎样

给同一input用两个不同匿名函数各登记一次input处理，输入一个字，观察render次数；再恢复只绑定一次。

#### 参考核对：重复绑定会怎样

不同函数引用不会按同一函数去重，单次input会调用两次render；直接重复登记相同render引用则会被去重。render只更新显示，不应每次追加监听器。

### 3. 状态、推导结果与渲染要一致
本例状态是input.value；先trim去两端空白，再toLowerCase统一大小写。filter用includes判断标题是否含关键词，空字符串会匹配全部标题。matches是同一次计算的结果，列表与count都从它推导，避免两套筛选逻辑漂移。没有匹配是合法状态，应提示换关键词；不是页面加载失败，更不能伪造网络错误。

#### 就地练习：数量和列表同源

查命中、不命中与空词，逐次比较数量与li数。

#### 参考核对：数量和列表同源

两处由同一matches计算；空查询按合同显示全集，不命中是合法空结果。

### 4. 安全创建与替换节点
render先replaceChildren清空旧列表，再逐项createElement('li')，用textContent填标题，append进ul。textContent把文字当文字；innerHTML会解析标签。即使当前数据写死，将来从输入或接口读取时也需要保持这个边界。输入`<b>`是一个关键词，不应因它带尖括号就变成真实标签。示例筛不到它只说明没有同名标题，不说明任何代码执行。

#### 就地练习：节点每轮新建

把带尖括号的标题放进textContent，再在Elements查是否创建了同名标签。

#### 参考核对：节点每轮新建

按字面显示，不解析标签；每条独立li应在循环内创建，append才加入文档。

### 5. 可见反馈与辅助技术
count有role=status，让变化的数量有机会被播报。反馈仍是普通可见文字，鼠标用户也看得到。即时搜索不应每次输入都把焦点移到结果；否则用户无法连续打字。一个render同时照顾列表、数量与空状态，控件就能保持一致；页面重新加载则回到本例初始值，因为这里没有保存功能。

#### 就地练习：输入时不抢焦点

持续输入查询词，观察每次更新后焦点是否仍在输入框。

#### 参考核对：输入时不抢焦点

数量可播报且可见，焦点应留给继续输入，不要每字都移到结果。

## 在 VS Code 中创建、保存与运行

1. 在自己的练习目录里新建 `web-dom` 文件夹，例如放在 `exercises/web/` 下；不要在 materials 原教材中覆盖文件。打开 VS Code，选择“文件 → 打开文件夹”，选中这个新文件夹。
2. 在左侧资源管理器用“新建文件”按下面清单创建文件。带 `/` 的名字表示子文件夹，例如 `assets/style.css` 需要 assets 文件夹，不能把斜杠当普通名字。逐个复制对应完整代码，Windows 用 Ctrl+S，macOS 用 Command+S 保存全部文件。
3. 在 VS Code 资源管理器中右键 index.html，选择“在文件资源管理器中显示”（macOS为Finder），然后双击该文件用浏览器打开。浏览器显示页面，VS Code负责编辑；不要只点编辑器的播放图标，也无需编译HTML。每次修改先保存，再回浏览器刷新。

文件清单：

- `index.html`


## 完整可运行示例

### 完整文件：index.html

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>活动搜索</title>
    <style>
    *{
      box-sizing:border-box
    }
    body{
      font:1rem/1.7 sans-serif;
      max-width:36rem;
      margin:1rem auto;
      padding:1rem
    }
    input{
      width:100%;
      padding:10px
    }
    li{
      overflow-wrap:anywhere
    }
    </style>
  </head>
  <body>
    <h1>活动搜索</h1>
    <label for="keyword">标题关键词</label>
    <input id="keyword" type="search">
    <p id="count" role="status"></p>
    <ul id="list">
    </ul>
    <p>输入后即时筛选，本例不会发送输入。</p>
    <script>
    const items=['HTML 入门','CSS 排版','JavaScript 事件'];
    const input=document.querySelector('#keyword');
    const list=document.querySelector('#list');
    const count=document.querySelector('#count');
    function render(){
      const keyword=input.value.trim().toLowerCase();
      const matches=items.filter(title=>title.toLowerCase().includes(keyword));
      // 每次重建当前结果，避免连续输入把旧行重复追加。
      list.replaceChildren();
      for(const title of matches){
        const li=document.createElement('li');
        li.textContent=title;
        list.append(li);
      }
      count.textContent=matches.length?`找到 ${matches.length} 项`:'没有匹配项，请换一个关键词。';
    }
    input.addEventListener('input',render);
    render();
    </script>
  </body>
</html>
```

## 具体结果与解释

```output
初始显示“找到 3 项”和三个标题。输入css显示一项CSS排版，输入不存在的中文显示空结果提示；清空或只输入空格又恢复三项。输入不会被发送到服务器。
```

items是唯一的活动数据；input、list、count缓存DOM引用。render读取关键词、过滤活动、清空旧节点、创建匹配li、更新数量。addEventListener只绑定一次；最后render()主动完成初始页面绘制，否则初次打开会是空列表，直到第一次输入才显示。

试着输入CSS、css与前后空格，结果应该相同，这说明归一化生效。再在DevTools看ul里面li数量，核对count文字；删除最后的render()并刷新，观察初始化缺失的后果，再恢复。每一步都围绕一个可观察状态进行验证。

## 两种常见问题与排查顺序

### 情况一：Console报Cannot read properties of null
先检查id拼写与脚本执行时机。源码是keyword，选择器不能写keywords；脚本在head且没有defer时可能尚未解析input。不是所有null都应直接加可选链隐藏，必要元素缺失应修结构或时机，确保界面真的能工作。

### 情况二：输入一次，结果重复增长
检查render是否先清空旧列表、事件是否只绑定一次。每次append而不replaceChildren会累计旧内容；每次渲染又用 `()=>render()` 创建新匿名函数并添加监听，则会登记不同函数，可能重复执行。相同元素、事件类型、同一函数引用且capture相同的重复addEventListener会被去重，并不是调用一次登记语句就必然多一份。用断点或临时console.count记录执行次数，修复后删除调试输出。再测试空关键词与无匹配，不能只验证常见CSS关键词。

## 变化练习

增加checkbox“只看CSS”，把当前关键词与勾选状态同时纳入筛选。要求数量、列表、空状态一致；保持输入焦点，不能勾选后强制跳到结果。

### 参考答案

为checkbox加可见label，在render读取checked；筛选时同时满足关键词和 `!onlyCss || title.toLowerCase().includes('css')`。checkbox监听change调用同一个render，文本框仍监听input。所有界面仍来自同一matches数组。先勾选后输入HTML应显示空结果，取消勾选又恢复HTML；这是组合条件的边界验收。

## 本课自查

- DOM与初始HTML源码为什么可能不同？
- querySelector找不到时返回什么？
- render与事件绑定为什么分开？
- 为什么一次matches计算要同时驱动列表与数量？
- textContent与innerHTML对尖括号文字的处理有何差别？

能运行示例是起点，不等于已经学完。请先遮住参考答案，预测变化结果，再独立修改并记录实际结果。如果仍有问题，向AI提供目标、文件结构、自己的代码、具体操作、期待与实际结果、已尝试步骤；让它先定位最小问题，再自己验证修改。

## 继续查证

- [MDN：DOM简介](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction)
- [MDN：textContent](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent)
- [MDN：事件入门](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Events)
- [MDN：addEventListener与相同监听的去重](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)
