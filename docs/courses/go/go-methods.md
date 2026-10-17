# 方法与接收者

为Problem增加MarkSolved，理解指针接收者。

## 方法告诉你“对哪条记录做什么”

普通函数可以写成 Change(&value)，方法则可以写成 `p.MarkSolved()`。两者都会调用一段代码，方法另外在定义中指定**接收者**，也就是这次操作所针对的值。

**想让方法修改原结构体，接收者需要能指向原值。** `func (p *Problem) MarkSolved()` 的接收者名是 p，类型是 *Problem。MarkSolved 后面的空括号表示没有额外参数；是否返回值，要看参数括号之后有没有返回类型。本例没有写返回类型，所以没有返回值。比如 `Solved() bool` 也没有额外参数，但会返回一个 bool。

方法里的 p 与 main 中的 p 属于不同范围，碰巧同名；可以把方法内的接收者名改成 problem 并同步改内部访问，行为不会变化。

### 就地练习：额外参数与接收者

为两条Problem各调用一次指针方法，随后只改第一条。标出调用中的目标记录与参数，核对第二条不被修改。

### 参考核对：额外参数与接收者

接收者指明操作哪条记录，参数提供本次新值；未被操作的第二条保留。

## 方法集合：为什么可调用却不一定满足接口

对可取地址的变量 p，`p.MarkSolved()` 可以自动取地址；但这不代表值类型 Problem 拥有所有 *Problem 的方法。Problem 的方法集合包含值接收者方法；*Problem 的方法集合还包含指针接收者方法。接口按方法集合判断，不会把任意值自动取地址以满足接口。

值接收者适合只读取小值，指针接收者适合修改或避免复制大结构。包含互斥锁的结构体不要随意复制。方法只能定义在当前包所声明的适当接收者类型上，不能直接给别的包的现有类型补方法。

### 就地练习：能调用不等于能赋给接口

给只含MarkSolved()的接口分别赋Problem值和*Problem指针，方法保持指针接收者。先预测哪次编译，再尝试。

### 参考核对：能调用不等于能赋给接口

Problem值的方法集合不含指针方法，赋接口失败；*Problem满足接口。普通变量可自动取地址调用是另一条规则。

## 先运行一个小例子

在已初始化的独立 Go 练习目录中，把下面完整代码保存为 main.go。本节替换原文件，不在文件末尾追加另一份 main 函数。

```go
package main

import "fmt"

type Problem struct {
	Title  string
	Solved bool
}

// 函数名前的 (p *Problem) 是接收者，指定这次要修改哪条记录。
func (p *Problem) MarkSolved() {
	p.Solved = true // p 是指针，写入的是原记录的字段。
}

func main() {
	p := Problem{Title: "Two Sum"}
	p.MarkSolved() // 对可取地址的 p，Go 在这里自动使用它的地址。
	fmt.Println(p.Solved)
}
```

在这个目录的终端运行：

```sh
go run .
```

预期输出：

```output
true
```

## 逐步读懂这个例子

p.MarkSolved()以p作为接收对象，方法更新它的状态。改成值接收者(p Problem)时，只更新结构体副本，原对象不会因此变成true。

main 先创建 Problem，Solved 默认 false；调用 `p.MarkSolved()` 时，这个可取地址的变量会提供自己的地址。方法写入 `p.Solved=true` 后返回，main 再读取就得到 true。

`p.Solved` 是字段读取，`p.MarkSolved()` 是方法调用。指针接收者里访问字段可直接写 p.Solved，Go 会找到指针指向的结构体，不要求每次手工写星号。

## 自己改一处再运行

改成值接收者再运行，比较结果，然后恢复指针接收者。

### 参考答案

本答案故意采用值接收者，只修改副本，故仍是 false；改成 (p *Problem) 后，main 的变量会提供地址，输出 true。

下面是可直接替换的完整 `main.go`。在本节独立模块中保存后运行 `go run .`。

```go
package main

import "fmt"

type Problem struct {
    Title string
    Solved bool
}
func (p Problem) MarkSolved() { p.Solved = true }

func main() {
	p := Problem{Title: "Two Sum"}
	p.MarkSolved()
	fmt.Println(p.Solved)
}
```

预期结果：

```output
false
```

## map 元素不能随意自动取地址

后续把结构体放进 map 时，`records[id].SetTitle(...)` 可能因 map 元素不可取地址而无法调用指针方法。可先取值、修改再写回，或按设计保存结构体指针；选择前要想清共享和并发修改约定，不能靠加星号随机试到能编译。

## 对比值接收者与指针接收者

把接收者由 `(p *Problem)` 改成 `(p Problem)`，保存运行，输出应从 true 变成 false，因为方法只修改收到的结构体副本。恢复星号后再运行，确认又是 true。

若把单独一行 `p.MarkSolved()` 改成 `p.MarkSolved`，Go 会先拒绝编译，提示函数值未使用：你取到了这个方法，却没有调用它，不能把结果单独放成一句无用途的语句。**这是编译失败，不是成功运行后悄悄忽略操作。** 恢复调用括号后再运行，确认状态改变。

## 合上参考，独立定义改标题的方法

从空白 main.go 重建本节的Problem数据格式，但独立写一个SetTitle(title string)方法，让它使用指针接收者只更新标题，保留Solved。自己安排接收者、额外参数和字段赋值，不调用MarkSolved来代替这个目标。

创建两条记录：第一条“原题”、false，第二条“另一题”、true。只对第一条调用改标题方法，传入“新题”，预期第一条为“新题 false”，第二条仍为“另一题 true”。再传空字符串，用%q显示标题，第一条应为 `"" false`，第二条不变。

**解释接收者表示哪条记录、title参数表示什么新数据，并核对未要求修改的字段仍保留。**

### 参考答案

接收者 p 指向被改的记录，title 是本次输入。只赋值 Title 就保留 Solved；空字符串在本题允许，%q 使它可见。

下面是可直接替换的完整 `main.go`。在本节独立模块中保存后运行 `go run .`。

```go
package main

import "fmt"

type Problem struct {
    Title string
    Solved bool
}
func (p *Problem) SetTitle(title string) { p.Title = title }

func main() {
	first := Problem{Title: "原题"}
	second := Problem{Title: "另一题", Solved: true}
	first.SetTitle("新题")
	fmt.Println(first.Title, first.Solved)
	fmt.Println(second.Title, second.Solved)
	first.SetTitle("")
	fmt.Printf("%q %t\n", first.Title, first.Solved)
	fmt.Println(second.Title, second.Solved)
}
```

预期结果：

```output
新题 false
另一题 true
"" false
另一题 true
```

参考：[Go 语言规范](https://go.dev/ref/spec)。
