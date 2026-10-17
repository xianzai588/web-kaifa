# TypeScript 注解与类型检查

给函数输入输出加类型，区分编译检查和运行时校验。

## 先明确 TypeScript 的运行位置

TypeScript 在 JavaScript 上增加开发时的类型描述和检查。**浏览器运行的是处理后的 JavaScript；类型检查不自动替你验证实际网络数据。** 这里先给一个小函数描述输入和返回值，不从大型抽象或整套接口开始。

### 就地练习：类型何时检查

把id写成字符串后先typecheck，再观察dev。dev能打开是否代表类型检查通过？

### 参考核对：类型何时检查

不代表；开发服务可能转换并运行，typecheck单独检查开发时约束，浏览器执行处理后的JS。

## 在已经跑通的独立项目里替换一个完整文件

使用 [Node、npm 与项目脚本](#/learn/web/web-npm) 中的 [followup-03 源码包](../../../assets/downloads/web-followup-03.zip)，按 [项目 README](../../../exercises/web/followup-03/README.md) 跑通并保留一份原版副本。在用于本节的副本中，将 src/main.ts 完整替换为下方内容；保留 package.json、锁文件、tsconfig.json 和 index.html。index.html 的模块入口指向 src/main.ts，#app 是已有显示容器。不要新建一个未被入口导入、也未被配置包含的文件后期待自动执行。

```typescript
// 类型只描述开发时要求的形状，不会自动校验服务器数据。
type EventItem = { id: number; title: string };

function label(activity: EventItem): string {
  // 参数具有明确字段，这里的属性读取与文字拼接仍然是 JavaScript。
  return activity.id + ": " + activity.title;
}

const activity: EventItem = { id: 1, title: "编程交流" };
const result = label(activity);
console.log(result);
const root = document.querySelector("#app");
if (root === null) throw new Error("缺少 #app 容器");
root.textContent = result;

// 把本文件标记为模块，避免练习中的名字混入全局作用域。
export {};
```

## 每一种新语法对应什么

| 语法 | 含义 |
| --- | --- |
| type EventItem = ... | 给一种类型描述起名，不创建运行时对象 |
| `{ id: number; title: string }` | 要求对象有数字 id 和文字 title，冒号后是类型 |
| activity: EventItem | 参数或变量应符合 EventItem；这里冒号不是对象属性赋值 |
| `): string` | 函数应返回字符串；返回数字会被检查拒绝 |
| `{ id: 1, title: "编程交流" }` | 运行时实际对象，属性值仍按 JavaScript 语法写 |
| export {} | 空导出列表，把文件作为独立模块处理，不向外导出名字 |

执行时先定义 label，再建立对象，调用得到 result，输出后写到 #app。TypeScript 推断也是常见方式：能从值确定类型时，不必每个局部变量都重复写注解。

### 就地练习：描述与实际对象

把type EventItem、activity:EventItem和{id:1,title:"Go"}分别归入类型描述、类型使用、运行值。

### 参考核对：描述与实际对象

前两处给检查器说明，字面量才是实际对象；type不会创建运行记录。

## 检查、运行与可观察结果

```powershell
# 在本节的 followup-03 副本目录检查类型，不启动网页。
npm.cmd run typecheck
# 类型正确后启动开发服务，浏览器访问终端地址。
npm.cmd run dev
```

macOS/Linux 使用 npm。浏览器打开 http://127.0.0.1:8803/，页面与 Console 都应显示“1: 编程交流”；Ctrl+C 停止。Vite 会处理 TS，tsc --noEmit 只检查、不生成发布文件；build 会按项目脚本先检查再构建。

## 先制造类型错误，再恢复

只把实际对象 id:1 改成 id:"1"，重新 typecheck，应指出字符串不能赋给数字类型。再恢复，把 label 的返回改成 return activity.id，检查会指出 number 与 string 返回类型不符。dev 能打开页面不代表 typecheck 已通过；两个动作分别验证运行与开发时约束。

## 网络输入仍是另一条边界

服务器 JSON 在程序运行时才到达。写 `as EventItem` 是向检查器作类型断言，不会检查真实字段、转换数字或补上 title。沿用 fetch 章节的 typeof、空值和数组检查，验证真实结构后才使用；下一节学习如何让检查器跟着已做的判断缩小类型范围。

### 就地练习：as不会校验

服务器给{"id":"1"}，代码只写as EventItem。id会变数字、title会补上吗？需要什么真实判断？

### 参考核对：as不会校验

都不会；实际检查对象/非null/非数组及字段类型与范围，再构造可信值。

## 独立变式：给采购计算一个明确类型

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。在已有工程副本只保留工具和入口外壳，从空src/main.ts写自己的类型/函数，不复制label函数；不用高级泛型或框架。

自行描述商品对象：name文字、price数字、quantity数字。写一个返回数字总价的函数，并在真实入口调用及页面显示；另外生成含名称和总价的文字。先写正常对象、错quantity类型与错返回类型的预期。

自查：单价7、数量3得21；数量0得0；quantity为字符串应typecheck拒绝，函数返回文字却声明数字也应拒绝。修好再运行网页；价格−1仍是number并不自动符合业务，需要你明确的范围校验，不能称类型注解已验证外部数据。

## unknown、可选字段与开发时检查

来自JSON等外部边界先看作unknown，用实际判断缩小范围；any会跳过大部分检查，as只是告诉检查器相信某个类型，不执行校验。可选字段可能不存在，strictNullChecks下使用前需明确处理undefined/null。

TypeScript常能推断局部类型，重要边界如函数参数、返回值、数据合同应写清。number包含NaN和Infinity，类型注解本身不限制正数、整数或范围，这些仍是运行时业务规则。

### 参考答案：独立实现与验收

在followup-03副本完整替换src/main.ts：

```typescript
type Product = { name: string; price: number; quantity: number };
function totalCost(product: Product): number {
  // number注解不保证有限、非负或整数，这些是实际执行的业务校验。
  if (!Number.isFinite(product.price) || !Number.isFinite(product.quantity)
      || product.price < 0 || !Number.isInteger(product.quantity) || product.quantity < 0) {
    throw new Error("价格或数量不合格");
  }
  return product.price * product.quantity;
}
const product: Product = { name: "笔记本", price: 7, quantity: 3 };
const total = totalCost(product);
const text = `${product.name} / ${total}元`;
const root = document.querySelector("#app");
if (root === null) throw new Error("缺少app");
root.textContent = text;
console.log(text);
export {};

```

typecheck后打开dev，页面和日志为“笔记本 / 21元”。数量改0得到0元；把quantity写成"3"或返回文字而声明number，typecheck拒绝。价格-1虽然类型为number，本实现仍在运行时拒绝；这是显式校验的效果，不能归功于类型注解。

### 就地练习：number也包含坏业务值

给price设-1、NaN、Infinity，说明number注解能否保证价格可用。

### 参考核对：number也包含坏业务值

都仍属number；需Number.isFinite及业务范围等运行校验，注解不自动执行。
