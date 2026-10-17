# 事件与点击处理函数

给按钮绑定click事件，点击后执行函数。

## 浏览器何时调用处理函数

点击、输入、按键等动作会产生事件。`button.addEventListener("click",function(){...})` 在按钮上登记一个处理函数，浏览器在 click 发生时调用它。**登记监听器不等于立即执行处理函数。**

第一参数 "click" 是事件类型，第二参数是要调用的函数；匿名函数来自前面 map 章节，省略名字不改变“函数是值”的性质。count 在外面初始化为 0，每次回调读取上一份 count，加 1 后写回；随后用 String 把数字变成文字赋给 result.textContent。

本例只有一个按钮和一个结果 p，执行顺序是：脚本初始化 → 找到两个元素 → 登记回调 → 等待操作 → 点击后更新数字与文字。原生 button 支持鼠标和键盘，type=button 表示普通操作，放入表单也不会意外提交。

输入框通常使用 input 事件来响应内容变化，表单使用 submit 来响应提交。下一节先创建列表，再把输入事件和筛选连接起来。先用 Tab/Enter 点两次，应得到 2；刷新后内存计数重新初始化为 0。

### 就地练习：登记后有几次变化

加载按钮页先不操作，再用键盘激活两次，最后刷新，记录四个时点的数量。

### 参考核对：登记后有几次变化

初始0、未操作仍0、两次后2、刷新0；登记回调不立即调用，也没有持久化。

## 事件对象、默认动作与传播

监听器接收event，可读取type、target等信息。target是事件起点，currentTarget是当前处理函数绑定的元素；子元素点击时二者可能不同。事件可以向祖先传播，父容器可据target做委托，但要验证目标属于预期控件。

preventDefault阻止可取消的默认动作，例如提交或链接导航；它不自动停止传播。stopPropagation阻止继续传播，也不替代业务校验。addEventListener传函数而非调用结果；解绑要保留同一个函数引用，重复绑定匿名函数可能导致一次点击处理多次。

### 就地练习：target和currentTarget

在button内放span，给button绑定处理函数，点击span后打印两个目标。preventDefault会自动停止冒泡吗？

### 参考核对：target和currentTarget

target是span，currentTarget是button；阻止默认动作不自动阻止传播。

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
<button id="add" type="button">练习一次</button>
<p id="result">0</p>
<script>
// 这份内存值保存本页当前计数，刷新会重新从 0 开始。
let count = 0;
const button = document.querySelector("#add");
const result = document.querySelector("#result");
// 只登记处理函数；等 click 发生才执行里面的语句。
button.addEventListener("click", function () {
  count += 1;
  // 把最新数字转换成文字，让显示与计数一致。
result.textContent = String(count);
});
</script>
</body>
</html>
```

## 逐步读懂这个例子

初始count为0，每次click加1，再把数字转换为字符串显示。两次点击得到2。只有事件发生才执行回调；刷新后脚本重新初始化，回到0。

## 自己改一处再观察

只用Tab和Enter触发按钮两次，再刷新。

### 参考答案

原例用Tab定位button，Enter两次后显示2；刷新重建状态为0。键盘功能来自原生button，不来自click回调自身。

参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。

## 独立变式：可撤销的点赞计数

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。使用已学状态变量、条件、click 回调和文字更新，不使用存储或框架。

从空文件做“点赞”和“撤回”两个原生按钮及一个数量显示。点赞加 1，撤回减 1 但不得小于 0，两个回调共享同一份计数。绑定完成前不能先执行点击逻辑。

自查：初始0；点赞两次2；撤回一次1；再撤回到0后继续撤回仍0。Tab/Enter 能完成两种动作，数量随每次真实操作变化，刷新回0。不能各按钮维护一份互不相同的计数。

### 参考答案：独立变式

两个回调更新同一个count，撤回前检查大于0。初始0，点赞两次2，撤回一次1，继续撤回到0后保持0；刷新回0，未实现持久化。

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
<h1>点赞练习</h1>
<button id="like" type="button">点赞</button>
<button id="undo" type="button">撤回</button>
<p>当前数量：<output id="count">0</output></p>
<script>
let count = 0;
const output = document.querySelector("#count");
// 两个按钮都调用同一渲染函数，共享同一个count与显示位置。
function render() { output.textContent = String(count); }
document.querySelector("#like").addEventListener("click", () => { count++; render(); });
document.querySelector("#undo").addEventListener("click", () => { if (count > 0) count--; render(); });
</script>
</body>
</html>
```
