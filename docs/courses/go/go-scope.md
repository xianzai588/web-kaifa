# 变量作用域与参数传值

辨认同名局部变量，理解整数参数的修改范围。

## 同一个名字可以属于不同范围

作用域是一个名字能被使用的代码范围。main 里的局部变量，在 main 的花括号内可用；更里面新加一对花括号，还可以声明内层变量，出了内层范围就不能再用它。

**同名不代表同一个变量；函数收到整数参数时，得到的是值的副本。** 本节会观察两个问题：内层同名变量怎样暂时遮住外层名字，函数改自己的参数为什么不改调用者。

先会 [函数的参数与返回值](../../../index.html#/learn/go/go-functions)。仍在已初始化的独立练习目录，把下列完整代码替换 main.go，保存后运行，不要在原文件后再追加一份 main。

### 就地练习：改用赋值会怎样

只把内层的 `value := 7` 改成 `value = 7`。先预测块内、块外、调用后的三项数值，再运行。

### 参考核对：改用赋值会怎样

三个读取都为7；内层没有创建新变量，而是更新外层。Change仍只改自己的整数参数。

## 捕获外层变量的函数：先区分“值”与“名字”

函数值如果在函数体内使用外层变量，就形成闭包。下面片段放在 main 内，按顺序执行：

```go
count := 0
next := func() int {
    count = count + 1
    return count
}
fmt.Println(next()) // 1
fmt.Println(next()) // 2
fmt.Println(count)  // 2
```

匿名函数访问的是外层 count 这个变量，因此第二次调用延续第一次更新后的状态。它没有接收一个整数参数，和 Change(n int) 修改参数副本的例子不相同。暂时不要在并发任务里共享这个闭包，多个任务同时更新变量需要后续的同步知识。

if 初始化、for 初始化和更内层花括号都能引入更小范围。排查“明明赋值了，外面却没变”时，检查内层是不是误用 `:=` 创建同名变量。

### 就地练习：两个调用共用哪个值

在闭包片段第二次next后增加一次next，再打印count。先画出count的变化路线。

### 参考核对：两个调用共用哪个值

count从0变1、2、3，最后仍为3。闭包持续访问同一个外层变量，不是每次重建为0。

## 完整程序与运行

```go
package main

import "fmt"

func Change(n int) {
	n = 9 // 只写入本次调用自己的整数参数，不写入 main 的 value。
	fmt.Println("函数内", n)
}

func main() {
	value := 3 // 这个 value 在 main 的花括号内有效。
	{
		value := 7 // 新的花括号里声明了另一变量，暂时遮住外层名字。
		fmt.Println("块内", value)
	}
	fmt.Println("块外", value) // 内层结束后，再读外层的 3。
	Change(value)            // 把当前值 3 复制给参数 n。
	fmt.Println("调用后", value)
}
```

```sh
go run .
```

预期输出在终端中：

```output
块内 7
块外 3
函数内 9
调用后 3
```

## 按执行位置分清四个读取

| 位置 | 读的是谁 | 为什么得到这个数 |
| --- | --- | --- |
| 块内 | 内层 value | 它是新声明的变量，初值 7 |
| 块外 | main 外层 value | 内层范围结束，外层仍是 3 |
| 函数内 | Change 的参数 n | 它先取得副本 3，再被赋值成 9 |
| 调用后 | main 外层 value | Change 没有给这个变量赋值，仍为 3 |

Change 的 n 与 main 的 value 名字不同；即使都叫 value，它们也属于不同的调用范围，普通整数参数仍然是副本。函数运行完后，参数变量不再供 main 使用。

## 让更新值通过 return 回来

先预测：如果要在 main 得到 9，应怎样把新值交回来？把 Change 改为返回 int：签名末尾加 int，赋值后增加 `return n`。在 main 把调用改为 `value = Change(value)`，明确把返回值写入外层变量。前三行不变，最后一行应变为“调用后 9”。

**函数返回一个新值，与调用者接住并保存它，是两个动作。** 若只写 `Change(value)` 而不赋回，外层仍是 3。

### 就地练习：返回还需要接住

将Change改成返回int，分别用 `Change(value)` 与 `value=Change(value)` 调用。保持value初值3，预测调用后结果。

### 参考核对：返回还需要接住

忽略返回时仍为3，赋回后为9；return只交回数据，调用者的赋值才更新外层值。

## 观察作用域错误，再独立改写

在 main 的末尾试图打印 n，编译应报找不到这个名字；n 只在 Change 内有效。恢复程序后，把内层变量名字改成 inner，并将块内打印改为 inner，四行结果应仍一致。

独立写一个 Double(n int) int 函数，让外层变量先保存 4，再接收 Double 的返回值。预测调用前后是 4、8，运行核对。下一阶段的指针课才学习怎样通过地址明确修改原变量。

### 参考答案

Double 取得 4 的副本并返回 8，main 的赋值才更新外层 value。对于原例 Change 的改写，同理写成 func Change(n int) int，最后 return n，并用 value = Change(value) 接回；只调用而不赋回，外层仍是 3。

下面是可直接替换的完整 `main.go`。在本节独立模块中保存后运行 `go run .`。

```go
package main

import "fmt"

func Double(n int) int {
    return n * 2
}

func main() {
	value := 4
	fmt.Println("调用前", value)
	value = Double(value)
	fmt.Println("调用后", value)
}
```

预期结果：

```output
调用前 4
调用后 8
```

参考：[Go 规范：声明与作用域](https://go.dev/ref/spec#Declarations_and_scope)。
