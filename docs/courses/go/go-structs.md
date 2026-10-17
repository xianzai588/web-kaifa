# 结构体与字段

把题目标题和完成状态放进同一个值。

## 一条记录里的不同数据

一个问题记录既有标题，又有完成状态。切片的一组元素要求同一类型，而结构体让这些有关联的不同类型字段放在同一个值里。**结构体类型是记录格式；结构体值才是一条实际记录。**

`type Problem struct` 定义名为 Problem 的新类型。花括号内的每行是一个“字段名 + 字段类型”：Title 保存 string，Solved 保存 bool。`Problem{Title:"Two Sum"}` 创建一条值并按字段名填入数据；没有填入的字段使用自己的零值。

### 就地练习：类型不是一条数据

声明Problem后创建两个值，只给第一条填写标题。分别输出Title和Solved，给空标题用%q。

### 参考核对：类型不是一条数据

第一条有指定标题、false；第二条为""、false。同一个记录格式可创建不同实际值。

## 组合、指针字段与命名类型

建议用字段名字面量 `Problem{Title:"题目"}`；按位置写全部值依赖字段顺序，后续调整结构更容易误读。结构体也能嵌套其他结构体或切片，例如一份报告包含作者与多条记录，这叫组合，不要求继承。

结构体赋值复制字段的值。string/bool/int 字段在本例可以独立修改；若字段本身是切片、map 或指针，复制后仍可能共享底层对象。`type UserID int` 声明新的命名类型，`type ID = int` 则是别名；前者能帮助区分业务含义，但并不会自动校验数值范围。

### 就地练习：副本里仍有共享的字段

设记录包含Tags []string，复制结构体后修改副本Tags[0]。先预测原记录，再说明与只复制Title的差别。

### 参考核对：副本里仍有共享的字段

原记录的标签也会变化；复制的是切片字段的描述，底层元素仍共享。string/bool字段的直接赋值没有这层关系。

## 先运行一个小例子

在已初始化的独立 Go 练习目录中，把下面完整代码保存为 main.go。本节替换原文件，不在文件末尾追加另一份 main 函数。

```go
package main

import "fmt"

// 声明一种记录类型；每条记录都有文字标题和布尔完成状态。
type Problem struct {
	Title  string
	Solved bool
}

func main() {
	p := Problem{Title: "Two Sum"} // 没填写 Solved，它得到零值 false。
	fmt.Println(p.Title, p.Solved) // 点号选中这条记录的某个字段。
	p.Solved = true                // 只修改 p 的完成状态。
	fmt.Println(p.Solved)
}
```

在这个目录的终端运行：

```sh
go run .
```

预期输出：

```output
Two Sum false
true
```

## 逐步读懂这个例子

Problem有Title字符串和Solved布尔字段。字面量只写Title，Solved使用零值false。p.Solved=true修改这一条记录。字段大写会影响跨包访问，JSON一节会用到它。

读取 `p.Title` 先选中变量 p 的这条记录，再取 Title 字段。`p.Solved=true` 只更新这条记录的一个字段，标题不变。两个实际值可以使用同一种 Problem 类型，但它们的标题和状态各自保存。

字段名大写使字段能够被包外代码访问，小写字段只在本包内可见；JSON 编码也会使用导出的字段。现在先理解记录与字段，后面再用包和 JSON 验证可见性。

## 自己改一处再运行

再创建另一条Problem，修改第一条Title，确认另一条标题不变。

### 参考答案

两条值分别创建，改 p 的字段不写入 other。若用 other := p，本例普通字段复制后也能独立修改。

下面是可直接替换的完整 `main.go`。在本节独立模块中保存后运行 `go run .`。

```go
package main

import "fmt"

type Problem struct {
    Title string
    Solved bool
}

func main() {
	p := Problem{Title: "Two Sum"}
	other := Problem{Title: "Valid Parentheses"}
	p.Title = "新题目"
	fmt.Println(p.Title)
	fmt.Println(other.Title)
}
```

预期结果：

```output
新题目
Valid Parentheses
```

## 编码字段为空时先查大小写

导出字段才供包外访问，例如 Title；小写 title 只在本包可见。后续 JSON 编码不处理小写字段，给它加 json 标签也不会使它自动导出。字段名是否导出与字段保存了什么值，是两件需要分别检查的事。

## 创建、复制并修改两条记录

在 p 后面写 `other := p`，再修改 p.Title，然后同时打印两条标题。这里的字段都是 string/bool，other 仍保存原标题。也可创建另一条 `Problem{Title:"Valid Parentheses"}`，它初始 Solved 仍为 false。

把 `p.Solved = true` 改成 `p.Solved = "true"`，应报类型错误；恢复布尔值后重新运行。数据放入结构体并没有消除字段类型约束。

## 合上参考，独立声明学习记录

从空白 main.go 声明新类型 StudyRecord，包含标题、分钟数、是否完成三项，由你命名字段并选择类型。创建两条不同记录：第一条只填标题“Go笔记”，第二条填“Web练习”、25分钟、true。

按“标题、分钟、完成”读取字段并打印，第一条应为“Go笔记 0 false”，第二条应为“Web练习 25 true”。再只把第一条改成10分钟并完成，核对它变为“Go笔记 10 true”，第二条仍为“Web练习 25 true”。

**要自己写出类型声明与两条实际值，不能继续使用Problem换一个标题来代替新记录格式。**

### 参考答案

字段类型按数据含义确定。未填字段取得零值，之后只更新 first 的分钟和完成状态，second 保持原数据。

下面是可直接替换的完整 `main.go`。在本节独立模块中保存后运行 `go run .`。

```go
package main

import "fmt"

type StudyRecord struct {
    Title string
    Minutes int
    Done bool
}

func main() {
	first := StudyRecord{Title: "Go笔记"}
	second := StudyRecord{Title: "Web练习", Minutes: 25, Done: true}
	fmt.Println(first.Title, first.Minutes, first.Done)
	fmt.Println(second.Title, second.Minutes, second.Done)
	first.Minutes = 10
	first.Done = true
	fmt.Println(first.Title, first.Minutes, first.Done)
	fmt.Println(second.Title, second.Minutes, second.Done)
}
```

预期结果：

```output
Go笔记 0 false
Web练习 25 true
Go笔记 10 true
Web练习 25 true
```

参考：[Go 语言规范](https://go.dev/ref/spec)。
