# 接口与行为约定

用一个只要求Name方法的接口接受具体类型。

## 先问“能做什么”，再看具体类型

前面的方法挂在 Problem 上。现在想让多个类型都能提供一个名字，不必固定它们内部有哪些字段。**接口列出所需方法；具体类型拥有准确匹配的方法，就满足接口。**

`Name() string` 表示方法叫 Name、没有参数、返回 string。Named 接口不规定 Title 或 NameText 字段，也不提供方法的具体实现；User 的 Name 方法才实际读取 NameText 并返回它。Go 不要求另外写 implements 关键字。

### 就地练习：有字段能替代方法吗

创建只有NameText字段而没有Name方法的类型，尝试赋给Named。再实现Name() string修复。

### 参考核对：有字段能替代方法吗

第一次缺方法，不能满足接口；签名匹配后可用。接口约定行为，不约定字段布局。

## 小接口、接口组合与 nil

接口可嵌入另一个接口以组合行为，但使用者只需要 Name 时，不必要求保存、删除等一大组方法。依赖越小，替换实现和写测试越容易。空接口 `any` 是 `interface{}` 的别名，可以保存不同类型的值；它没有凭空获得这些类型的字段，使用具体行为仍需后续的 [类型断言](go-type-assertion.md)。

接口值可理解为“具体类型与具体值”一对信息。`var named Named` 两者都没有，等于 nil；若放入一个满足接口的 *User，即使该指针为 nil，接口也已有具体类型，接口本身未必等于 nil。调用是否安全取决于实际方法如何处理 nil，不要只靠接口 != nil 就断言内部目标有效。

### 就地练习：只依赖需要的行为

设计只显示名称的PrintName参数类型。若要求实现额外Save方法，原User能否继续使用？

### 参考核对：只依赖需要的行为

仅需Named即可；额外要求Save会无故排除只提供Name的实现。小接口减少无关依赖。

## 先运行一个小例子

在已初始化的独立 Go 练习目录中，把下面完整代码保存为 main.go。本节替换原文件，不在文件末尾追加另一份 main 函数。

```go
package main

import "fmt"

// Named 只要求一种行为：Name 方法无参数，返回 string。
type Named interface {
	Name() string
}

type User struct {
	NameText string
}

// User 拥有准确匹配接口要求的方法，所以可以作为 Named 使用。
func (u User) Name() string {
	return u.NameText
}

func main() {
	var named Named = User{NameText: "小林"}
	// 通过接口调用实际存入的 User 的方法，不直接访问其字段。
	fmt.Println(named.Name())
}
```

在这个目录的终端运行：

```sh
go run .
```

预期输出：

```output
小林
```

## 逐步读懂这个例子

Named要求Name() string。User有这个方法，所以可赋给Named变量。调用named.Name()执行User的方法。使用者依赖一个行为，无需固定User的所有字段。

`User{NameText:"小林"}` 创建具体 User 值。赋给 named 时，接口变量保存这个具体值及其类型信息。`named.Name()` 按接口约定调用，实际执行 User 的 Name 方法，然后 Println 显示返回文字。

如果 named 的声明类型是 Named，能直接使用的是接口列出的 Name 方法；不能写 `named.NameText` 来随意读取 User 的字段，因为另一个实现可能根本没有这个字段。

## 自己改一处再运行

另写Team类型，实现Name方法，把named改成Team并输出组名。

### 参考答案

Team 的方法签名准确满足 Named。字段名可以不同，调用方只依赖 Name() string；如果方法是指针接收者，应存入 &Team{...}。

下面是可直接替换的完整 `main.go`。在本节独立模块中保存后运行 `go run .`。

```go
package main

import "fmt"

type Named interface { Name() string }
type Team struct { Label string }
func (t Team) Name() string { return t.Label }

func main() {
	var named Named = Team{Label: "学习组"}
	fmt.Println(named.Name())
}
```

预期结果：

```output
学习组
```

## 接口不匹配先逐项核对签名

编译器报告 missing method 或 wrong type for method 时，核对名字、参数、返回值，再核对值/指针的方法集合。给类型增加同名字段不能替代同名方法，返回 int 也不能代替要求的 string。

## 用第二个类型验证行为约定

创建 `type Team struct { Label string }`，为它写 `Name() string` 返回 Label，再把赋给 named 的值换成 `Team{Label:"学习组"}`。原来的 named.Name() 调用应继续工作并输出学习组。

把这个方法返回类型改成 int，会在赋给 Named 时产生接口不匹配错误；恢复 string。**同名方法还不够，参数和返回类型也必须匹配。**

没有存入任何具体值的接口变量零值为 nil，不能直接调用其方法。接口里存入 nil 指针则是后续的类型断言课要细分的问题，本课只使用实际 User/Team 值。

参考：[Go 语言规范](https://go.dev/ref/spec)。
