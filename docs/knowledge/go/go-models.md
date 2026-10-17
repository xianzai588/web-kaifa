# 结构体、方法与接口：一条记录的数据和行为

刷题记录有标题、是否解决、内部备注。如果用三个没有关系的变量表达它们，传递和修改时容易弄混。结构体把属于同一个对象的字段放一起；方法说明对这个对象做什么；接口说明调用方需要哪些行为。学习时先理解实际的值和指针，再考虑层次，不必先建立十几个目录。

## 结构体与字段：先定义数据形状

`type Problem struct { ... }` 创建一个类型。`Problem{Title:"两数之和"}` 构造值，没写的 `Solved` 自动是零值 `false`。`p.Title` 读取字段，`p.Title = "新题目"` 更新字段。字段名大写意味着可从其他包访问，也决定 encoding/json 能否正常处理；小写的 `note` 是包内字段，即使加 JSON tag，也不会因此自动导出。

字段类型说明能放什么值，不替代业务校验。`Title string` 仍可能是空白；创建流程必须单独检查。请求对象与数据库/输出对象可以不同：客户端可提交标题，但题目 id、归属人和创建时间通常由服务端决定。不要把整个内部对象直接当作允许客户端更新的清单。

### 就地练习：类型不校验空白

Problem的Title为string时，纯空格是否编译通过？哪一层应拒绝业务空标题？

### 参考核对：类型不校验空白

类型可通过，创建流程仍需TrimSpace与业务规则；导出字段也不意味着可信输入。

## 值接收者和指针接收者：修改的是谁

`// 值接收者只改这次调用的普通bool字段副本。
func (p Problem) PreviewSolved()` 的 `p` 是结构体副本。给 `p.Solved=true` 只改变副本，原变量保持不变。`// 指针接收者把修改写回调用者持有的原记录。
func (p *Problem) MarkSolved()` 接收指向对象的指针，`p.Solved=true` 更新原对象。对可取地址变量调用 `p.MarkSolved()`，Go 可自动取地址；这不表示指针与值在任何场合都一样。

副本的字段若包含 slice、map 或指针，它们引用的数据仍可能共享，因此“值接收者绝不会修改任何外部数据”是错误的。接收者应按对象语义选择；要修改自身字段通常使用指针。nil 指针不代表一个有效对象，调用会访问字段的方法可能 panic。方法名大写是否导出，与是否修改对象是两条独立规则。

`ptr := &p` 中 `&` 取地址，ptr 的类型是 `*Problem`；`*ptr` 在表达式中解引用，访问指向的 Problem。类型里的 `*` 表示“指向该类型的指针”，表达式里的 `*` 才是解引用操作。下面是放在 main 中 p 创建之后的**概念片段**：

```go
ptr := &p
(*ptr).Solved = true
// Go 允许写成 ptr.Solved = true，效果相同。
```

指针保存的是对象地址，不是自动复制另一个对象。用 `var ptr *Problem` 得到 nil，没有可访问对象，不能直接 `ptr.Solved=true`。先理解取地址/解引用，再阅读指针接收者；不用为了修改字段手工计算地址数值。

### 就地练习：副本与引用字段

先比较PreviewSolved与MarkSolved，再思考字段含切片时修改副本元素会不会影响原值。

### 参考核对：副本与引用字段

普通bool副本独立，指针方法写原值；切片字段复制后可能仍共享底层元素。

## JSON：编码结果不等于 Go 字段名称

tag `json:"title"` 把导出字段 `Title` 编成 JSON 键 `title`。`json.Marshal(p)` 返回字节切片和错误，调用方检查错误后转成字符串打印。JSON 是跨程序交换的数据文本；Go 结构体是内存类型，不要把两者混为一谈。编码成功不表示客户端输入已被验证；反向解码还有缺失、未知字段与业务范围问题，下一主题会处理。

### 就地练习：导出与标签分开

将note改为Note后编码，再用json:"-"忽略，预测两次输出字段。

### 参考核对：导出与标签分开

大写字段默认可编码为Note，减号标签明确忽略；标签不会让原小写字段自动导出。

## 小接口：由需要行为的一方提出要求

`type Namer interface { Name() string }` 表示“我需要能给出名称的东西”。结构体只要方法集合符合就自动实现，不写 `implements`。接口帮助调用方依赖行为，测试可以提供另一个实现；不是为了把全部结构体方法都列出来。值方法可以出现在值与指针的方法集合中；只用指针接收者定义的方法通常要求传指针才能满足接口。接口值里装着带类型的 nil 指针时，它本身可能不等于 nil，这是进一步使用接口时需要留意的边界。

### 就地练习：方法集合核对

Name改指针接收者后，Describe(p)和Describe(&p)哪个满足Namer？

### 参考核对：方法集合核对

指针满足；值的方法集合不含该指针方法，普通变量可自动取地址调用是另一规则。

## 在 VS Code 运行：main.go 完整程序

打开独立目录 `exercises/go/go-models`，建立并保存 `main.go`。首次输入 `go mod init example.com/learn/go-models`，再执行 `go fmt ./...` 和 `go run .`。这是标准库示例，无需数据库和账号。

```go
package main

import (
	"encoding/json"
	"fmt"
)

type Problem struct {
	Title  string `json:"title"`
	Solved bool   `json:"solved"`
	note   string
}

// 值接收者只改这次调用的普通bool字段副本。
func (p Problem) PreviewSolved() { p.Solved = true }
// 指针接收者把修改写回调用者持有的原记录。
func (p *Problem) MarkSolved()   { p.Solved = true }
func (p Problem) Name() string  { return p.Title }

type Namer interface { Name() string }

func Describe(n Namer) string { return "记录：" + n.Name() }

func main() {
	p := Problem{Title: "两数之和", note: "内部备注"}
	p.PreviewSolved()
	fmt.Println("值方法后：", p.Solved)
	p.MarkSolved()
	fmt.Println("指针方法后：", p.Solved)
	data, err := json.Marshal(p)
	if err != nil {
		fmt.Println("编码失败：", err)
		return
	}
	fmt.Println(string(data))
	fmt.Println(Describe(p))
}
```

```output
值方法后： false
指针方法后： true
{"title":"两数之和","solved":true}
记录：两数之和
```

## 修改实验

1. 把MarkSolved改成值接收者，原对象和JSON的Solved会变吗？
2. 把note改成Note，它会成为哪个JSON键？怎样明确忽略它？
3. 把Name改成指针接收者，`Describe(p)`还能编译吗？调用处该改什么？

### 参考答案

把 `MarkSolved` 改成值接收者，参考答案：第二行也为 `false`，JSON 的 solved 也为 false。把 `note` 改为 `Note`，它默认会成为 JSON 的 `Note` 键；加 `json:"-"` 才明确忽略。把 `Name` 改成指针接收者，原来的 `Describe(p)` 将不能编译，改成 `Describe(&p)`，因为接口所需的方法只在指针方法集合里。每次只改一个条件，阅读编译诊断，不要把所有地方同时加 `*` 试运气。

自查：你能说明副本、原对象、指针三个概念吗？为什么未导出的字段没有出现在 JSON？接口要求到底是谁提出的？独立加一个 `Rename(title string)` 指针方法，先拒绝空白，再修改对象；保留失败时标题不变的证据。这里的示例只说明数据与行为，没有提供并发同步、数据库持久化或用户权限。

官方参考：[结构体](https://go.dev/tour/moretypes/2)、[方法](https://go.dev/tour/methods/1)、[接口](https://go.dev/tour/methods/9)、[encoding/json](https://pkg.go.dev/encoding/json)。
