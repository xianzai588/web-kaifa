# 纯函数测试与失败实验

用独立期望值检测筛选函数，改错后看到失败。

## 先写可以独立判断的需求

这里需求是“去掉关键词两端空白后，保留标题任何位置包含关键词的项；空查询显示全部；没有匹配返回空数组”。纯函数只根据输入计算输出，不依赖页面和外部可变状态，也不修改调用者的数据。**测试的期望值来自需求，不能调用被测函数再把它自己的结果当期望。**

### 就地练习：反例来自需求

为“关键词在任意位置”挑出能区分includes与startsWith的一组输入，先手写期望。

### 参考核对：反例来自需求

如周末编程查编应匹配；只测开头词无法区分这次错误实现。

## 两个完整文件

新建独立 filter-test 目录，保存下面两份文件。需要已安装支持内置测试运行器的现代 Node；不需要 npm ci、浏览器、DOM 或外部测试库。mjs 扩展名告诉 Node 按 JavaScript 模块规则处理。

filter.mjs：

```javascript
// 同样输入得到同样结果，不读页面，不改原数组。
export function filterTitles(titles, query) {
  const keyword = query.trim();
  return titles.filter(title => title.includes(keyword));
}
```

filter.test.mjs：

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { filterTitles } from "./filter.mjs";

// 期望值来自需求：关键词在标题中间也算匹配。
test("关键词在标题中间", () => {
  assert.deepEqual(filterTitles(["周末编程", "读书"], "编"), ["周末编程"]);
});

test("空白查询显示全部", () => {
  assert.deepEqual(filterTitles(["编程"], "   "), ["编程"]);
});

test("没有匹配得到空数组", () => {
  assert.deepEqual(filterTitles(["编程"], "不存在"), []);
});
```

## 先读一次断言

node: 前缀指 Node 内置模块，不是要从网上安装的包。test(名称,回调) 登记一项测试；assert.deepEqual(实际,期望) 比较数组等结构和值。深比较不是用数组对象的 === 引用比较。第一项实际来自函数调用，期望是手写的 ["周末编程"]；不相等时断言抛错，运行器把这项记为失败。

### 就地练习：数组不能只比引用

函数返回内容相同的新数组，用===与deepEqual分别检查什么？

### 参考核对：数组不能只比引用

===比对象引用，deepEqual比结构和值；需求是筛选内容时使用独立内容期望。

## 运行与可观察结果

```sh
# 当前目录应包含刚保存的两个 mjs 文件。
node --test filter.test.mjs
```

正常应报告 3 项通过、0 项失败并结束，命令退出状态为成功。具体日志符号随 Node 版本不同，不需要背。若提示找不到文件，先检查终端目录与文件名；若语法错误，先看文件/行号；若断言错误，比较实际与期望，不先把期望改成实际。

## 让测试检出一个确定错误

只把 filter.mjs 的 includes 改成 startsWith（仅匹配开头），保持测试不变，重新运行。第一项必须失败，因为“编”在“周末编程”的中间；另外两项可以仍通过。恢复 includes 后三项应通过。**先证明测试能发现这个错误，再把通过当作证据。**

独立添加“不修改原数组”和“边界空格被去掉”的测试，先写期望再实现。这里验证的是筛选函数，不能推断页面键盘、网络断开或服务器权限也正确；这些需要组件与流程测试。参考：[Node 测试运行器](https://nodejs.org/api/test.html)。

## 单元、组件与流程测试各选有区分力的反例

纯函数测试覆盖计算规则，组件测试覆盖交互与显示，浏览器流程测试覆盖真实加载与操作链。测试层次并不是越多越好，应由需要证明的行为决定。模拟网络成功不能替代真实HTTP合同，真实浏览器也不自动覆盖服务端权限。

用例名称说明规则，断言比较独立预期。故意改错时选会改变目标行为的变异；某行改动仍被其他保护拒绝，不代表断言没有价值。恢复正确版本后再次通过，并记录实际执行的范围。

### 参考答案：独立实现与验收

在本节独立目录新建extra.test.mjs，原filter.mjs不变：

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { filterTitles } from "./filter.mjs";

test("不修改原数组", () => {
  const input = ["Go笔记", "Web布局"];
  const snapshot = [...input];
  const result = filterTitles(input, "笔记");
  assert.deepEqual(result, ["Go笔记"]);
  // 不只验结果，还验调用者数组未被筛选函数原地删项。
  assert.deepEqual(input, snapshot);
});
test("关键词两端空白被去掉", () => {
  assert.deepEqual(filterTitles(["周末编程", "读书"], "  编  "), ["周末编程"]);
});

```

运行node --test filter.test.mjs extra.test.mjs，原3项加新2项都应通过。把filter中的trim去掉，空白关键词的新测试必须失败；恢复后通过。浅快照足以检查本题字符串数组未被改动，不据此宣称已验证任意深层对象都不变。

### 就地练习：测试层次的边界

纯函数筛选通过后，能否声称按钮键盘、真实API和权限也通过？列出各自需要的证据。

### 参考核对：测试层次的边界

不能；交互需组件/浏览器，API需合同请求，权限需服务端多身份测试，不能互相冒充。
