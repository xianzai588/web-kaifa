# Repository 与依赖注入

把需要的读取行为传给业务对象，先用内存实现看清依赖，再考虑数据库实现。

## 为什么不让每个 Handler 自己写 SQL

前面的Handler负责请求、参数和响应，数据库代码负责连接、SQL和存储。若全部塞进一个函数，修改输出格式会碰到SQL，测试HTTP又必须启动数据库。把职责分开能让变化和测试更清楚。

**Repository是封装存储行为的一层；业务对象依赖它提供的行为，而不直接知道存储细节。** 它不一定叫Repository，也不是必须创建很多目录。本节的Store只有GetTitle，故意缩小到一个可理解的行为。

“依赖”指一个对象要调用另一个对象才能完成工作；“注入”指外部创建那个对象并传进去。不是后台自动发现数据库，也不是Go内置机制。

### 就地练习：分别放到哪层

将“HTTP400、SQL参数绑定、计算可预约数量”分别分给Handler、Repository、Service。

### 参考核对：分别放到哪层

Handler表达协议结果，Repository封装存储，Service表达业务规则；存储接口不应依赖HTTP状态。

## 完整例子：同一业务，换一个存储

在已初始化的独立Go练习目录替换main.go：

```go
package main

import "fmt"

// 使用者只需要这个读取行为，不要求对方用什么字段或数据库。
type Store interface {
	GetTitle() string
}

type Memory struct {
	Title string
}

// 方法签名符合Store，所以Memory可以作为Store传入，无需implements声明。
func (m Memory) GetTitle() string {
	return m.Title
}

type Service struct {
	store Store // 持有接口，业务方法不读取Memory的具体字段。
}

func (s Service) Title() string {
	return s.store.GetTitle()
}

func main() {
	// 在组装位置选择实际实现，并传入Service；这一步就是依赖注入。
	service := Service{store: Memory{Title: "Go"}}
	fmt.Println(service.Title())
}
```

```sh
go run .
```

输出：

```output
Go
```

## 从输出往回追踪

main先创建Memory，再把它放进Service.store。调用service.Title后，Service只调用接口方法GetTitle；Memory提供实现，返回自己保存的标题，最后打印Go。

这里使用 [结构体](#/learn/go/go-structs)、[方法](#/learn/go/go-methods)、[接口](#/learn/go/go-interfaces) 的已有写法。`Store`是行为要求，`Memory`是具体实现，`Service`是使用者。接口字段若未初始化为可用实现，调用它可能panic，所以组装时必须提供所需依赖。

## 从最小演示回到 HTTP 工程

[数据库项目](assets/downloads/web-followup-09.zip) 中Store还有List、Get、Create、Update、Delete，SQLStore在repository.go实现这些行为，API在api.go使用它们。启动main.go选择SQLStore；测试可注入MemoryStore或故意返回错误的实现。

**假存储只替换外部依赖，测试仍应调用真实Handler或Service。** 另写一份假业务函数来返回期望值，无法验证正在交付的业务逻辑。这里的Memory是完整演示实现，不等于已经测试PostgreSQL。

### 就地练习：替身换什么

测试注入返回固定标题的Store时，应该继续调用真实Service还是另写一个固定返回Web的Service？

### 参考核对：替身换什么

替换Store，仍调用真实Service；重写业务替身不能验证交付的业务。真实SQL仍需集成测试。

## 预测，再换实现

自己增加 `Fixed` 类型，让GetTitle返回“Web”，把main里注入的Memory换为Fixed，Service保持不改。然后故意删掉Fixed的GetTitle方法，预测能否编译。

### 参考答案

Fixed拥有GetTitle方法时可注入并输出Web，删除方法则编译失败。编译只检查行为签名，不保证返回的标题符合业务意义。

## 独立变式

把接口改为 `GetTitle() (string, error)`，给一个实现返回错误，让Service或调用者显式处理。说明新签名为什么要同步修改实现，不应只在Handler里吞错。

参考：[Go接口规范](https://go.dev/ref/spec#Interface_types)。

## 接口放在使用者需要的边界

Repository隔离存储行为，Service表达业务规则，Handler负责协议输入输出。不要把所有HTTP状态塞进存储接口，也不让Handler直接依赖某个内存map的字段。测试替身只模拟需要的行为，但仍要保留数据库集成测试验证真实SQL。

依赖注入就是在组装位置明确传入实现，并不要求引入大型容器库。接口越贴近调用者的最小需要，越容易替换；返回值与错误合同改变时，实现、调用方与测试都要同步。

### 参考答案：独立实现

接口、实现、Service一起改成返回string和error。main先检查err再打印标题；把错误吞掉返回空字符串，会混淆真正空标题与存储失败。

下面是独立练习的完整main.go，在自己的模块目录保存并运行go run .。

```go
package main

import (
    "errors"
    "fmt"
)

type Store interface { GetTitle() (string, error) }
type Broken struct{}
func (Broken) GetTitle() (string, error) { return "", errors.New("读取失败") }
type Service struct { store Store }
// 保留存储错误交给调用者，不把失败变成一个成功的空标题。
func (s Service) Title() (string, error) { return s.store.GetTitle() }

func main() {
	service := Service{store: Broken{}}
	title, err := service.Title()
	if err != nil { fmt.Println(err); return }
	fmt.Println(title)
}
```

预期：

```output
读取失败
```

### 就地练习：错误签名同步变化

GetTitle改成(string,error)后列出所有要同步的位置，给失败路径写出显示预期。

### 参考核对：错误签名同步变化

接口、实现、Service调用、Handler或main、测试都要跟随；失败明确报告，不吞成空标题。
