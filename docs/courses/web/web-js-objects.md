# 对象、属性与引用

用对象表示活动，观察两个变量引用同一个对象。

## 一个对象表示一条有关联的数据

`{ title:"编程交流", seats:10 }` 是对象字面量：花括号包住对象，属性名和值用冒号分开，各属性用逗号分开。`event.title` 按名字读取属性，`event.seats=8` 更新 seats 属性。

**把对象赋给另一个变量，复制的是指向同一对象的引用，不是独立对象。** 本例 same=event 后，两者指向同一份属性集合；修改 same.seats，event.seats 也读到 8。const 约束的是变量绑定，不是对象内部属性。

要建立新的浅副本，写 `const copy={...event};`。这里三个点是展开语法，把 event 当前可枚举的自身属性放进一个新对象。只复制这一层：id/title/seats 等基本值可独立修改；如果某属性又是对象，里面的引用仍可能共享。

点号后是固定属性名；如果名字来自变量，可以用 `event[key]`。读取不存在的属性得到 undefined；拼错 title 为 tilte 不会自动纠正。后面读网络数据时，既要检查 JSON 能否解析，也要检查实际属性名与类型。

### 就地练习：赋值和浅副本

令same=event、copy={...event}，分别改seats，每步打印原值。

### 参考核对：赋值和浅副本

same共享对象会改原值；copy里的普通数字字段可独立赋值。

## 属性访问、解构与浅复制

点访问适合固定名字，`object[key]`适合运行时决定的属性名。`const {title, seats=0} = event`可解构字段，默认值只在字段为undefined时生效。属性拼错返回undefined，业务形状应主动验证，不能只凭“是对象”就使用。

对象展开只复制一层属性。若event包含address对象，`copy.address === event.address`仍可能为true。方法中的this取决于调用方式；把方法单独取出交给事件监听器时，不能想当然认为this仍指原对象。优先显式参数与可说明的数据流。

### 就地练习：嵌套只复制一层

给对象加address.city，展开成copy后修改copy.address.city，并比较两个address引用。

### 参考核对：嵌套只复制一层

内层引用相同，原城市也变；新外层不表示所有内部对象都独立。

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
// 一条活动的相关值放在同一对象中，属性名和值用冒号连接。
const event = { title: "编程交流", seats: 10 };
// 复制的是引用，两个名字现在指向同一对象。
const same = event;
// 通过 same 修改共享对象，后面 event.seats 也会读到 8。
same.seats = 8;
console.log(event.title);
console.log(event.seats);
</script>
</body>
</html>
```

控制台预期：

```output
编程交流
8
```

## 逐步读懂这个例子

event保存对象引用，same取得相同引用。修改same.seats后，event看到同一个对象的新值8。const不等于深度不可变。

## 自己改一处再观察

用{ ...event }创建一个浅副本，再修改副本seats，比较原值。

### 参考答案

普通数字属性在两份对象里独立，嵌套address却仍共享；最后一行说明浅复制并非递归复制。

将下面完整页面保存为 `index.html`，打开后按说明验证。

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
const event = { title: "读书会", seats: 8 };
const copy = { ...event };
copy.seats = 3;
console.log(event.seats, copy.seats);
const nested = { address: { city: "杭州" } };
// 只复制外层，address仍指向原来的内层对象。
const shallow = { ...nested };
shallow.address.city = "苏州";
console.log(nested.address.city);
</script>
</body>
</html>
```


参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。
