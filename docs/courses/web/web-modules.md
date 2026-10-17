# JavaScript 模块与导入导出

把函数放到另一个文件，明确import的路径和名称。

## 模块组织源码

export声明哪些名称允许别的模块使用，import读取这些导出。模块有自己的作用域，导入路径依据导入它的文件位置。先用浏览器原生模块，后面的npm和构建工具再解决依赖打包。

### 就地练习：导出不等于全局

math.js导出add，main.js命名导入后可调用。控制台查window.add能否作为模块成功的必要判断？

### 参考核对：导出不等于全局

不能；模块有自己的作用域，顶层名字不自动加入window。应检查导入调用结果和资源状态。

## 谁先加载，路径相对谁

**三个文件放在同一个独立目录，通过 HTTP 地址打开 index.html。** 用 VS Code 打开该目录，保存 index.html、math.js、main.js；终端当前目录要能看到这三份文件，再运行 `python -m http.server 8765`。需要已安装 Python；若找不到 python，可按 Web 环境教程安装，或用 VS Code 的 Live Server。地址是 http://127.0.0.1:8765/，服务保持运行；Ctrl+C 停止。不要在资料仓库根目录启动后期待 / 会指向自己的新练习。

浏览器先读 index.html，type=module 将 main.js 当模块入口；main.js 的 import 再读取同目录 math.js。命名导入的 `{ add }` 是导入列表，不是创建普通对象。export 声明公开的名字，私有名字不会自动跑到 window 上。

模块脚本默认延后到文档解析后运行，适合这里读取 #result。浏览器的 file 地址可能阻止模块的跨文件读取，所以不要只双击后把加载错误误认为函数错误。Network 可看到三个文件的响应；Console 会显示路径错或导出名错的具体信息。

正常页面文字为 5。将 ./math.js 改成 ./missing.js 应得到文件加载失败；恢复，再只把 add 改成 sum 应得到导出名不匹配。每次只改一项，才能区分路径问题和名称问题。

### 就地练习：文件路径从谁出发

main.js移到scripts目录，math.js留根目录。分别写HTML入口src和main中的导入地址。

### 参考核对：文件路径从谁出发

HTML用scripts/main.js，main用../math.js；每条相对地址以引用它的文件位置为基准。

## 三个完整文件

index.html：

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>模块</title>
</head>
<body>
  <p id="result"></p>
  <!-- 模块入口会继续按 main.js 中的 import 读取 math.js。 -->
  <script type="module" src="main.js"></script>
</body>
</html>
```

math.js：

```javascript
// 导出 add，允许其他模块按这个名称导入。
export function add(a, b) {
  return a + b;
}
```

main.js：

```javascript
// ./ 相对本文件的目录；命名导入要与 math.js 的导出名字一致。
import { add } from "./math.js";
// 页面已解析完成后，取函数返回值并写入 DOM。
document.querySelector("#result").textContent = String(add(2, 3));
```

通过python -m http.server 8765打开本地HTTP地址。应显示5。script的type=module让浏览器按模块规则处理import，而非普通脚本。

## 修改实验

将导入名改成不存在的sum，观察模块加载错误，再恢复。给文件移动目录时同步核对相对路径。

### 参考答案

命名导入与导出名称对应。默认导出用另一种语法，先不混用两套写法。模块既不是服务器接口，也不是Go的go.mod。

## 独立变式：跨目录的采购计算

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。使用已讲命名导出/导入、函数、相对路径与DOM；只通过本地HTTP运行。

从空文件创建 index.html、main.js 和 utils/cost.js。在工具模块独立公开一个计算数量×单价的函数，入口模块导入它，将3份7元的结果显示到你自己的元素。写出文件目录与两条加载路径，再实现。

自查：页面显示数字21，模块之间没有靠全局变量交换函数。移错目录导致资源加载失败，写错导出名称则是导出匹配错误，两者需分别观察后恢复；type=module 和保存三个文件都是运行前提。

## 模块加载边界与导出方式

模块有自己的作用域，顶层名字不会自动成为window属性。命名导出要按名字导入，默认导出每模块最多一个；动态import返回Promise，用于按需加载，不是把任意字符串当代码执行。

浏览器模块的相对导入必须写清路径和扩展名，通过HTTP提供正确的JavaScript媒体类型。依赖路径错会请求404，导出名错则会在模块链接时报错；两者都要从Network与Console分别定位。直接file打开受浏览器限制，按本节启动本地静态服务。

### 参考答案：独立实现与验收

目录为 index.html、main.js、utils/cost.js。在这个独立目录运行 `python -m http.server 8800`，打开 http://127.0.0.1:8800/。

index.html：

```html
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>独立练习</title>
</head>
<body>
<h1>采购合计</h1>
<p id="total">尚未计算</p>
<script type="module" src="main.js"></script>
</body>
</html>

```

main.js：

```js
import { totalCost } from "./utils/cost.js";
document.querySelector("#total").textContent = String(totalCost(3, 7));
```

utils/cost.js：

```js
export function totalCost(quantity, price) {
  return quantity * price;
}
```

预期正文为21。入口脚本相对HTML找main.js，main.js再相对自己找utils/cost.js；改路径和改导出名要分开制造错误、观察后恢复。

### 就地练习：名称错和路径错分开

分别把math路径改错、导入名改错，每次只改一项，记录Network和Console的不同证据。

### 参考核对：名称错和路径错分开

路径错导致资源请求404；导出名错可能资源200却在模块链接时报错，不能混成计算函数错误。
