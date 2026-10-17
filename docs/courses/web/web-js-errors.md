# try、catch 与失败分支

捕获一个具体失败，明确选择之后的处理。

## 抛出错误会改变执行顺序

try包住可能失败的操作，catch处理这里抛出的错误。错误发生后跳过try剩余语句，不是假装全部成功。同步错误与Promise拒绝需按各自执行位置处理。

### 就地练习：错误后的路径

给try里三条日志在第二条前插入throw，纸上标出哪些日志会跳过、catch之后是否继续。

### 参考核对：错误后的路径

throw后try剩余语句跳过，进入catch；catch之后按自己流程继续，不能当作成功结果。

## 失败时执行路径怎样变化

错误是一种使正常执行无法继续的信号。JSON.parse 遇到坏格式会抛出错误；自己的代码也能写 `throw new Error("说明")`。throw 表示抛出，new Error 建立一份带 message 等信息的错误对象。

**try 中发生错误后，跳过它剩下的语句，进入对应 catch。** catch(error) 的 error 是局部变量，保存这次错误；可以读 error.message 找线索。catch 后要不要继续、是否显示失败、是否重试，由你写的流程决定。

在独立目录保存完整 index.html，浏览器打开并按 F12 选 Console。JSON.parse 第一行就失败，因而不会打印“不会执行”，而是打印“解析失败”，最后继续到 try/catch 外的日志。把输入改为合法 JSON 后，应走成功路径。

try/catch 捕获的是这里执行的操作。后面 Promise 在未来回调里拒绝时，需要 Promise.catch 或在 async 函数中 await 后用 try/catch；不能把任意晚发生的错误都想成已被外层 try 接住。先保留具体错误线索，不用空 catch 吞掉失败。

## 完整例子

```html
<!doctype html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><title>错误处理</title></head>
<body>
<p>打开Console看结果。</p>
<script>
// 把可能失败的解析操作放进 try，明确这一段的失败路径。
try {
 // 非法 JSON 在这里抛出错误，下一条同步日志不再执行。
JSON.parse("不是JSON");
 console.log("不会执行");
// 接住本段抛出的错误，显示失败；不把失败当成功数据。
} catch (error) { console.log("解析失败"); }
console.log("之后仍可继续");
</script>
</body>
</html>
```

## 输出

```output
解析失败
之后仍可继续
```

JSON.parse失败后跳到catch，所以不会打印try里的第二句。之后是否继续由你设计，本例只做局部演示。

## 修改实验

把输入换成合法JSON，预测哪些日志变化。

### 参考答案

3成功才打印6，-1跳到catch不打印成功值。处理结束后仍执行收尾日志；若删除catch，异常会终止当前脚本后面的正常路径。

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
function doubleNonNegative(value) {
  if (!Number.isFinite(value) || value < 0) throw new Error("输入必须是有限非负数");
  return value * 2;
}
for (const value of [3, -1]) {
  try { console.log("结果", doubleNonNegative(value)); }
  catch (error) { console.log(error.message); }
  console.log("本次检查结束");
}
</script>
</body>
</html>
```


## 独立变式：失败不能伪装成计算成功

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。使用函数、范围判断、throw/Error 与 try/catch，不使用 Promise。

从空脚本写一个计算两倍正数的函数：负数抛出你自己的错误信息，非负数正常返回结果。调用者分别测试 3 与 -1，成功才输出计算结果，失败输出 message，处理后还有一条“本次检查结束”日志。

自查：3 得到6；-1 显示自定义失败，不输出成功结果或伪造0；两次处理后都到达结束日志。让错误不被捕获时会改变后续执行，恢复明确的 catch 后再解释失败出口。

## try 的范围、错误对象与 finally

throw可以抛出值，但通常抛Error以保留message与栈信息。catch只能接住相应执行范围内的失败；后续Promise拒绝需要await或链上的catch处理，外层同步try不会自动捕获任意未来回调。

finally在正常和异常路径通常都会运行，适合恢复界面或清理资源。不要在finally里随意return，这会覆盖原来的结果或异常。向用户显示可理解的信息，排错日志保留足够上下文，而不是捕获后统一返回假成功值0。

### 就地练习：finally别覆盖结果

写一函数try返回1、finally只打印收尾，再在临时副本finally返回2，比较结果并恢复。

### 参考核对：finally别覆盖结果

只收尾时结果1；finally中的return会覆盖为2，也可能掩盖原错误，不应随意使用。
