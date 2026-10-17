# 组件生命周期与请求清理

只在合适时机请求，离开或参数变化时清理旧请求。

## 组件的出现、更新与退出

组件第一次加入界面叫挂载，状态或 Props 改变后重新描述界面叫更新，离开界面叫卸载。请求属于与外部系统交互的副作用，不是“描述当前界面”本身。**不要在组件每次渲染的正文里无条件 fetch；结果更新状态又渲染，可能形成不断请求的循环。**

### 就地练习：渲染不应启动无限请求

在纸上画出渲染体fetch→setState→再渲染的循环，解释请求为何放在合适Effect里。

### 参考核对：渲染不应启动无限请求

渲染描述界面；外部同步需按输入设置并清理，不能每轮渲染无条件重新请求。

## 完整工程里的三个完整文件

下载 [请求生命周期项目](../../../assets/downloads/web-followup-05.zip)，解压到独立副本并保留原版，先按 README 用 npm.cmd ci、npm.cmd run dev 跑通。随后将 src/App.tsx 完整替换，下列 JSON 放到已有 public 目录。Vite 会把 public 中的文件按原名提供到服务地址，./first.json 相对当前页面地址请求它。

src/App.tsx：

```tsx
import { useEffect, useState } from "react";

// 父组件通过 Props 给请求面板当前地址；面板只管理自己的请求状态。
type RequestPanelProps = { url: string };
function RequestPanel(props: RequestPanelProps) {
  const [status, setStatus] = useState("加载中");

  useEffect(() => {
    // 每次设置 Effect 都建立自己的取消控制器。
    const controller = new AbortController();
    setStatus("加载中");
    async function load() {
      try {
        const response = await fetch(props.url, { signal: controller.signal });
        if (!response.ok) throw new Error("HTTP " + response.status);
        const data = await response.json();
        if (data === null || typeof data !== "object" || typeof data.title !== "string") {
          throw new Error("title 必须是字符串");
        }
        // 旧操作被清理后，成功也不能更新当前显示。
        if (!controller.signal.aborted) setStatus(data.title);
      } catch (error) {
        // 取消的旧操作不显示为当前页面失败。
        if (!controller.signal.aborted) {
          setStatus(error instanceof Error ? "失败：" + error.message : "未知失败");
        }
      }
    }
    load();
    // 地址变更或父组件真的卸载面板时，React 调用这份清理函数。
    // 返回的是清理函数而非现在abort；它只取消这次Effect拥有的请求。
    return () => controller.abort();
  }, [props.url]);

  return (
    <section>
      <h2>请求面板</h2>
      <p role="status">{status}</p>
    </section>
  );
}

export default function App() {
  const [url, setUrl] = useState("./first.json");
  const [shown, setShown] = useState(true);
  return (
    <main>
      <h1>组件请求实验</h1>
      <button type="button" onClick={() => setUrl("./first.json")}>第一份</button>
      <button type="button" onClick={() => setUrl("./second.json")}>第二份</button>
      <button type="button" onClick={() => setShown(value => !value)}>
        {shown ? "卸载请求面板" : "挂载请求面板"}
      </button>
      <p>当前选择：{url}</p>
      {/* 条件不满足时不渲染子组件，触发真正的 React 卸载。 */}
      {shown ? <RequestPanel url={url} /> : <p>请求面板已卸载</p>}
    </main>
  );
}
```

public/first.json：

```json
{"title":"第一份数据"}
```

public/second.json：

```json
{"title":"第二份数据"}
```

## Effect 的设置、依赖与清理

这个完整文件含父组件 App 和子组件 RequestPanel。App 保存当前 url 与 shown 布尔状态，将 url 作为 Props 传入面板。JSX 的三元条件表达式只在 shown 为真时放入 RequestPanel；shown 为假时这个组件不再存在于界面树中，触发卸载，不是仅用 CSS 把它藏起来。两个组件的 Hook 都在各自顶层，不能为了控制显示把子组件的 useEffect 调用放进 if 中。

useEffect 接收设置函数和依赖数组。这里 [props.url] 表示面板读取的父传地址改变时需要重新同步；首次挂载也会设置。设置函数返回一个清理函数，React 在旧依赖被替换之前或组件卸载时调用它。**清理函数必须与这次设置对应，而不是随便停掉所有请求。**

每次设置新建 controller，把 signal 作为 fetch 第二参数 options 的字段传进去。abort 发出取消信号；signal.aborted 读是否已取消。成功和失败写状态前都检查这份信号，旧操作不能盖掉新选择。这里不是从服务器删除数据，只取消客户端已不需要的操作。

### 就地练习：每次设置自己的控制器

URL从first改second，列出旧清理、新设置顺序，说明为什么不能共用任意别次控制器。

### 参考核对：每次设置自己的控制器

清理旧Effect，再设置新Effect；每份闭包拥有本次controller，避免取消错误操作。

## 按一次选择追踪数据

首次 App 的 url=./first.json 且 shown=true，RequestPanel 挂载，Effect 设置，状态为加载中；await 取得响应、检查状态、解析 JSON、验证 title 后显示第一份数据。点击第二份更新父状态 url，新 Props 让面板清理旧 Effect 再启动新 Effect。点击“卸载请求面板”把 shown 改为 false，面板被移除，自己的请求被清理；此时改变 URL 不启动面板请求。再点“挂载请求面板”会建立新的面板，以当前 URL 请求，不沿用已退出组件的旧状态。再次选择同一个 URL 不保证重新请求，独立变式再加明确的重试编号。

TypeScript 在严格模式把 catch 的 error 视为 unknown，`error instanceof Error` 先确认它属于 Error，再读取 message；不是所有抛出的值都有这个字段。

### 就地练习：卸载后改URL

面板shown=false时改变URL，预测是否发面板请求；重新挂载时取哪个URL？

### 参考核对：卸载后改URL

卸载面板不执行其Effect；再挂载按当前URL设置新请求，不复用已退出状态。

## 真实验证与故障实验

在副本目录先 typecheck，再 dev，打开 http://127.0.0.1:8805/，Ctrl+C 停止。F12 的 Network 设置限速，快速选第一份/第二份，最后文字应对应“当前选择”。要验证卸载，先等第一份请求出现且仍在等待，点击“卸载请求面板”：区域被移除，Network 中本次尚未完成的请求应被取消。面板卸载期间改变为第二份，不能有面板新请求；重新挂载后才请求第二份，最后显示第二份数据。

**关闭标签页本身也会让浏览器停止工作，不能单独证明 React 清理函数正确。** 本实验用父级按钮使页面仍存在、子组件确实退出，分别观察组件与请求。若请求在点击之前已完成，先重新挂载并限速，让它仍处于等待后再测取消。

把 second.json 改名制造 404，再把 title 改成数字制造形状错误，每次只改一处并恢复。观察请求取消时 Console 与 Network，不把已取消的旧请求显示为新选择的失败。开发模式 StrictMode 可能额外做一次设置→清理→设置检查；保持两者成对，不关闭检查掩盖缺陷。

## 依赖数组不能当静音按钮

Effect 中读到的反应性输入应反映在依赖中；删除 url 可让检查不再重跑，但界面会继续用旧值。不要为消除请求数量就删依赖。原项目 src/useEvents.ts 是后续完整状态抽取参考；Vue 的生命周期/watch 有相应机制，第一次沿选定框架完成，不混用两套钩子。参考：[React useEffect](https://react.dev/reference/react/useEffect)。

### 就地练习：删依赖不是修请求

Effect用props.url却从依赖删掉它，为什么可能继续显示旧数据？

### 参考核对：删依赖不是修请求

输入改变没有触发所需同步；应修正依赖与资源管理，不靠删依赖掩盖。

## 独立变式：同地址也能明确重试

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。使用已经解释的父子组件、State、Props、Effect依赖与清理；保留已跑通工程工具，从空写自己的请求面板。

独立加入“重试”操作：同一个URL不变时也重新请求，并保持挂载/卸载控制。你决定重试编号放在哪个状态、怎样传入请求面板、哪些值属于Effect依赖；不是把第一次请求结果永远留住。

自查：普通同URL选择按钮不必新请求，明确重试必须产生新请求；正常/404/坏字段各有正确状态。限速时多次重试，旧成功和旧失败不能覆盖最后一次；卸载后不再显示请求面板，重新挂载按当前选择启动，不能把关闭标签页当React清理证据。

## 重试是一个新的请求意图

URL相同不代表操作意图相同。明确重试可用单调变化的编号表达，Effect依赖url与retry，每次设置都拥有自己的AbortController。清理后成功、失败都不应改状态；finally若写加载标志也要遵守同一规则。

开发StrictMode可能额外做设置/清理检查，用成对的资源管理应对，不关闭检查掩盖重复副作用。POST等不可随意重复的写操作还需独立的提交与幂等设计，不能机械放进会重复设置的读取Effect。

### 参考答案：独立实现与验收

在本节完整src/App.tsx中同步改四处，其余请求校验和清理保留：

```tsx
// 1. Props增加请求意图编号。
type RequestPanelProps = { url: string; retry: number };
// 2. 在RequestPanel的useEffect末尾改为：
// }, [props.url, props.retry]);
// 3. 在App顶层，与url/shown的useState并列。
const [retry, setRetry] = useState(0);
```

App返回的main中添加按钮，并替换原RequestPanel用法：

```tsx
<button type="button" onClick={() => setRetry(value => value + 1)}>重试</button>
{shown ? <RequestPanel url={url} retry={retry} /> : <p>请求面板已卸载</p>}
```

注意替换原条件块，不追加第二个面板。URL不变时普通选择不必请求，重试编号变化则设置新Effect。Network限速后连续重试、切到404、卸载再挂载，最后只保留当前意图；每次清理abort本次控制器。请求已在点击前完成不能证明取消实验成功，应在途时再验收。

### 就地练习：同URL新意图

同URL普通选择与明确重试分别需要什么状态变化？请求的finally写加载标志还要检查什么？

### 参考核对：同URL新意图

重试可递增编号并放入依赖；所有状态出口含finally都要确认仍属当前未清理操作。
