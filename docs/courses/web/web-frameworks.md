# 为什么需要组件与框架

用一个小页面观察数据与 DOM 的同步责任，再理解组件库、框架和构建工具的区别。

## 框架接手的是已遇到的同步责任

**框架并不会让数据自己合理；它帮助你按约定组织“数据变化 → 界面更新”。** 本例仍是原生 JavaScript：state 保存分钟数，render 用同一份值更新两个段落，点击回调更新分钟再 render。模板中的 `条件 ? A : B` 来自请求状态章节，用来派生“是否达到目标”。

组件是有明确输入和输出的一块界面单元，例如学习时长面板，不等于给每个 div 改一个花哨名字。父组件给子组件的输入叫 Props；组件内部需要记住并更新的值叫 State；React 和 Vue 用不同机制让这些值变化后对应到页面。

框架带来约束：组件内部怎样更新、何时启动请求、何时清理、包和构建如何管理，都必须学。Vite 是开发/构建工具，React/Vue 是界面组织机制，Go 的服务器框架是处理 HTTP 的工具，不能互相替代。

接下来先学 TypeScript 注解与联合状态，再进入 [React](#/learn/web/web-react) 和 [Vue](#/learn/web/web-vue) 的具体工程。用组件的前提是能解释眼前的原生数据流，而不是先把更多框架名称背下来。

### 就地练习：数据变了界面没变

删除点击回调里的render，点两次后比较state与页面，再手动render。

### 参考核对：数据变了界面没变

数据增加但DOM仍旧；统一render才同步，框架也需明确状态和派生关系。

## 先把基础版本运行起来

前面已经学过状态、事件和 DOM。本节先使用这些知识，在独立目录保存下面完整的 `index.html`，用浏览器打开：

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>数据与页面同步</title>
</head>
<body>
  <h1>学习时长</h1>
  <p id="minutes"></p>
  <p id="summary"></p>
  <button id="add" type="button">增加 10 分钟</button>
  <script>
    // 当前数据只保存在这一份对象里，两个显示位置都由它派生。
const state = { minutes: 0 };
    const minutes = document.querySelector('#minutes');
    const summary = document.querySelector('#summary');
    // 普通对象变化不会自动改 DOM，本函数负责同步显示。
function render() {
      minutes.textContent = state.minutes + ' 分钟';
      summary.textContent = state.minutes >= 20 ? '达到本次目标' : '继续学习';
    }
    document.querySelector('#add').addEventListener('click', () => {
      // 先改数据；下一句 render 才将这份数据更新到界面。
state.minutes += 10;
      render();
    });
    render();
  </script>
</body>
</html>
```

初始显示“0 分钟”和“继续学习”。点击两次后显示“20 分钟”和“达到本次目标”。同一份数据决定两个位置的文字，`render()` 负责让它们一起更新。

## 故意漏一次更新

只删掉点击处理函数里的 `render();`，保留最后一行的初次渲染。刷新后点击按钮，页面还会显示“0 分钟”。在控制台输入 `state.minutes`，能看到数据其实已经增加；再输入 `render()`，页面才跟上。

这不是浏览器没有执行 JavaScript，而是修改普通对象不会自动替你修改 DOM。例子很小时容易记住该调用哪里；当列表、表单、总数、错误提示都要随数据变化时，需要更稳定的组织方式。

## 组件接过什么工作

组件把一块界面的结构和行为放到一个明确的单位中，例如“学习时长面板”。父组件通过属性传入数据，组件内部管理需要变化的状态，通过事件通知其他部分。

React 的状态更新和 Vue 的响应式数据更新，可以让相应组件根据新数据更新界面。开发者仍要写清楚“哪些数据产生什么结果”，并理解作用域、数组、事件和异步请求。后面的 React 章节会在完整工程中写组件，逐项解释状态更新和 JSX；Vue 一节再比较模板写法。这里先搞清它们承担的责任。

### 就地练习：输入与状态谁拥有

为时长面板选父传目标、内部次数、派生是否达标三个值，决定哪些应是Props、State或派生值。

### 参考核对：输入与状态谁拥有

目标可来自父Props，次数由明确拥有者保存State，是否达标从两者计算，不另存一份互相漂移的事实。

## 名字相近，职责不同

| 名称 | 实际负责什么 | 在哪里运行 |
| --- | --- | --- |
| React | 以组件组织和更新用户界面的库 | 可以用于浏览器界面，也可以配合服务端渲染工具 |
| Vue | 提供组件、模板和响应式机制的前端框架 | 可以增强现有页面，也可以构建完整应用 |
| Vite | 开发服务器和构建工具，把项目资源组织为可交付文件 | 开发与构建时，在本机或构建机器上 |
| npm | 安装包和运行项目脚本 | Node 环境中；不会直接替你生成页面布局 |
| Go 的 net/http 或 Gin | 接收 HTTP 请求，组织服务器上的处理流程 | 服务器进程中；不负责浏览器按钮的 DOM 更新 |

TypeScript 在已有 JavaScript 上增加类型检查，不是替代 HTML 的页面语言；React 也不要求必须先把所有 TypeScript 高级语法学完。编写组件后，浏览器仍然显示由 HTML 元素组成的页面，CSS 仍负责样式。

### 就地练习：Vite不能替代什么

将React/Vue、Vite、npm、Go处理器按界面、开发构建、依赖脚本、HTTP服务配对。

### 参考核对：Vite不能替代什么

对应这四类职责；前端构建成功不表示Go API启动，Go路由也不更新浏览器DOM。

## 什么时候加入框架

一张介绍页或少量交互可以继续使用 HTML、CSS 和 JavaScript。若多个页面重复使用同一组界面，或者很多显示位置依赖共同数据，组件会帮助你组织它们。代价是要理解项目脚本、依赖、组件规则和调试方式；框架名称本身不能证明应用更可靠。

本课程先做原生页面实验，再用 React 完成组件项目，Vue 用来比较同一概念的另一种表达。后端主线继续用 Go；已有 [Express / FastAPI 对照项目](#/followup/web/8) 放在 HTTP 和 API 学会后的选学位置，它们不会成为写 HTML 的前置条件。

### 就地练习：为真实负担选工具

对单页静态介绍和多页面共享筛选面板分别说明是否值得加入组件，写出依据而非只列框架名。

### 参考核对：为真实负担选工具

依据重复界面和共同状态负担选择，同时考虑依赖、构建与维护成本；静态介绍可保持基础页面。

## 自己做一次判断

把学习目标从 20 改成 30，不改按钮逻辑；然后说明在原生版本中，哪段代码负责数据变化，哪段负责界面更新。

### 参考答案

改 `render()` 中的比较条件，点击三次达到目标。`state.minutes += 10` 修改数据，`render()` 把数据反映到 DOM。后续使用组件时，这个数据到界面的关系仍然需要你定义。

## 本节验收

能复现“数据已经变了，页面没有变”的现象，定位漏掉的更新；能区分 React/Vue、Vite/npm 和后端框架各自的职责，并说明自己的项目为什么需要或暂时不需要组件。

参考：[React 组件与状态](https://react.dev/learn)、[Vue 介绍](https://vuejs.org/guide/introduction.html)、[MDN 框架介绍](https://developer.mozilla.org/zh-CN/docs/Learn_web_development/Core/Frameworks_libraries/Introduction)。

## 独立变式：预算面板的三处同步

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。本题先用原生HTML/JavaScript；只组合已学对象、运算、事件与render，不提前要求JSX或Vue。

从空白做预算15元的面板，数据记录已消费金额；三个位置分别显示消费、余额与是否超支。按钮每次消费5元，另有重置。让三个结果由同一数据推导，再故意漏一个显示位置的更新，说明以后组件要接手什么责任。

自查：初始消费0/余额15/未超支，三次消费为15/0/未超支，四次为20/−5/已超支，重置恢复三处。不得每个段落维护不同预算。发现漏更新后用同一渲染流程恢复，并据实际同步负担解释组件用途，而不是只报框架名字。

## 组件解决组织问题，不改变浏览器基础

组件把输入、状态、显示与事件边界组织到可复用单元，仍要理解DOM、HTTP与JavaScript。只读输入由父组件提供，变化数据由明确拥有者更新，派生余额不必另建一份可变状态。多处各存同一事实，会使框架里也发生不同步。

框架选择还涉及路由、表单、构建与维护生态，不是每张静态页都必须组件化。先在原生页面遇到真实同步负担，再用同一个小目标比较框架如何减少手工更新。

### 参考答案：独立实现与验收

下面先用原生实现独立预算面板，完整index.html：

```html
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>独立练习</title>
</head>
<body>
<h1>预算15元</h1>
<p>消费：<output id="spent"></output></p>
<p>余额：<output id="remaining"></output></p>
<p id="over"></p>
<button id="spend" type="button">消费5元</button><button id="reset" type="button">重置</button>
<script>
const budget = 15;
let spent = 0;
function render() {
  document.querySelector("#spent").textContent = String(spent);
  document.querySelector("#remaining").textContent = String(budget - spent);
  document.querySelector("#over").textContent = spent > budget ? "已超支" : "未超支";
}
document.querySelector("#spend").addEventListener("click", () => { spent += 5; render(); });
document.querySelector("#reset").addEventListener("click", () => { spent = 0; render(); });
render();
</script>
</body>
</html>

```

四次消费后是20、-5、已超支，重置回0、15、未超支。若漏掉余额更新，消费变化但余额停留，说明同一状态的多个显示没有一起更新；恢复统一render后再比较组件的声明式显示。

### 就地练习：一个事实存几份

预算固定15，消费为State。余额和超支是否需要分别保存在两份可变State？

### 参考核对：一个事实存几份

通常直接派生，避免同一事实多处存储；框架不自动解决重复状态不同步。
