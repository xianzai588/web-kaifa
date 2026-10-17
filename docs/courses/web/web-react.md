# React 组件、Props 与 State

先做一个计数按钮，再理解父子组件的输入和更新。

## 从已经认识的数据与界面关系开始

React 是以组件组织界面的库。组件函数返回一份界面描述，React 据此更新页面。Props 是父组件传入的输入，State 是组件需要记住的变化值。**状态的拥有者负责更新，子组件通过 Props 读取输入。** 本节不用网络或路由，先让一次点击的流程读得懂。

### 就地练习：谁更新状态

父保存count，子收到props.count。重置应由谁更新，子需要表达动作时怎样通知？

### 参考核对：谁更新状态

拥有者调用setCount；子只读输入，可经回调表达意图，不直接改Props。

## 下载工程，替换一个完整入口组件

下载 [React 项目](../../../assets/downloads/web-followup-04.zip)，解压到独立目录，先按 README 完成 npm.cmd ci 与 npm.cmd run dev，确认原版能打开。保留原版副本，再把用于计数实验的副本 src/App.tsx 完整替换为下方文件。src/main.tsx 已导入默认 App 并挂载到 index.html 的 #app，不需要另建空白工程。

```tsx
import { useState } from "react";

// Props 描述父组件传来的输入形状。
type CountProps = { count: number };
function CountLabel(props: CountProps) {
  return <p>练习了 {props.count} 次</p>;
}

export default function App() {
  // 每次渲染读 count；setCount 告诉 React 保存下次的状态。
  // 当前count是这次渲染的快照；事件调用setCount安排下一次更新。
  const [count, setCount] = useState(0);
  return (
    <main>
      <h1>计数练习</h1>
      <CountLabel count={count} />
      {/* 传入函数，等待点击再更新，不在渲染时直接执行。 */}
      <button type="button" onClick={() => setCount(value => value + 1)}>
        练习一次
      </button>
    </main>
  );
}
```

在副本目录运行 npm.cmd run typecheck，再 npm.cmd run dev；macOS/Linux 使用 npm。访问 http://127.0.0.1:8804/，Ctrl+C 停止。初始“练习了 0 次”，点击两次为“练习了 2 次”，刷新回到 0。

## 读懂 JSX 与组件入口

TSX 文件允许 TypeScript 和 JSX 界面语法一起使用，普通浏览器不能直接把 TSX 当 HTML 运行，Vite 的 React 插件负责处理。小写 main/p/button 表示 HTML 元素；大写 CountLabel 表示组件；JSX 的 `{表达式}` 放 JavaScript 值，HTML class 属性在 JSX 中写 className。JSX 注释写在 `{/* ... */}` 中。

`export default` 公开该文件的默认入口，已有 main.tsx 用 `import App from "./App"` 读取它，不是命名导入的大括号写法。CountLabel 接收一个 props 对象，props.count 的类型由 CountProps 描述；`<CountLabel count={count} />` 将父组件当前 count 作为输入传下去。

### 就地练习：组件与元素区别

圈出CountLabel、main、count={count}分别是什么；为什么不能把整个TSX直接当普通HTML打开？

### 参考核对：组件与元素区别

大写为组件，小写为原生元素，花括号读JS表达式；TSX需工具处理后给浏览器运行。

## 从点击追踪下一次显示

`useState(0)` 是 React 提供的 Hook（让函数组件使用状态等能力的函数），初始值是 0。返回数组中的第一项是当前 count，第二项是更新函数 setCount；`const [count,setCount]` 用数组解构分别取出它们。Hook 要在组件顶层按固定顺序调用，不放在条件、循环或点击回调里。

`onClick` 的值是等待点击的处理函数。点击后 setCount 接收一个更新函数，React 把前一份状态交给 value，value+1 成为下一份状态；React 再次调用组件并让 CountLabel 接收新 Props。setCount 不把当前这一轮 count 变量立即改写，界面更新由下一次渲染产生。

### 就地练习：当前快照不会立刻换值

点击处理里调用setCount后立即读取当前count，能否据旧值判断更新失败？

### 参考核对：当前快照不会立刻换值

不能；本轮变量仍是快照，更新安排后续渲染；依赖旧值的计算用函数式更新。

## 先做故障实验，再扩展

删掉 setCount 调用，只返回 value+1，不会更新状态；直接写 count+=1 也不符合这份 const 状态的更新规则。把 onClick 改成渲染时直接执行 setCount 的写法，会造成渲染期间更新甚至反复渲染；记录错误后恢复，不把它当作点击处理。

独立增加“重置”按钮，点击后 setCount(0)，验证键盘 Tab/Enter 能完成增加和重置。之后恢复原项目，阅读 EventCard、SearchBox 与父组件；列表 key 使用稳定的记录 id，帮助 React 识别哪条记录是哪一个组件，不用随机值造成不断重建。

## 本节没有替你完成哪些事情

计数只保存在当前组件内存，刷新会丢失。原项目提供更多列表与路由，是后面的组合参考；不要把计数小例子误称为已经学会请求清理、表单保存或身份权限。参考：[React 状态](https://react.dev/learn/state-a-components-memory)、[React Props](https://react.dev/learn/passing-props-to-a-component)。

## 状态快照、不可变更新与列表身份

每次渲染读取当次状态快照，setState安排后续更新；依赖旧值的新状态优先用函数式更新。对象/数组状态用新对象或新数组表达变化，不直接修改旧快照再期待自动更新。

列表key使用稳定记录id，帮助对应同一组件；随机key会不断重建状态，数组下标在可重排列表也可能错配。Props是输入，不由子组件直接修改；回调让子组件表达意图，再由拥有者更新状态。

### 参考答案：独立实现与验收

保留本节已有main.tsx挂载入口，将src/App.tsx完整替换：

```tsx
import { useState } from "react";

type CountProps = { count: number };
function CountLabel({ count }: CountProps) { return <p>练习了 {count} 次</p>; }
export default function App() {
  // 当前count是这次渲染的快照；事件调用setCount安排下一次更新。
  const [count, setCount] = useState(0);
  return <main>
    <h1>计数与重置</h1>
    <CountLabel count={count} />
    <button type="button" onClick={() => setCount(value => value + 1)}>练习一次</button>
    <button type="button" onClick={() => setCount(0)}>重置</button>
  </main>;
}

```

先typecheck，再dev。初始0，增加两次2，重置0，刷新0。Tab/Enter应能完成两种动作。reset放在事件回调里执行，不在渲染中调用setCount；状态只在内存，没有保存服务。

### 就地练习：列表重排保留谁的状态

两条可编辑记录交换顺序时，对比使用记录id与数组下标当key的含义。

### 参考核对：列表重排保留谁的状态

稳定id对应同一记录组件；下标可能把编辑状态错配到另一条，随机key还会不断重建。
