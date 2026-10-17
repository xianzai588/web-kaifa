# 结构体与 JSON 编解码

将Go结构体变成JSON文字，再读取回来。

## JSON 先是一份可以交换的文字

JSON 是一种数据格式：对象用花括号，键用双引号，键和值用冒号分隔，多个成员用逗号分隔。例如 `{"title":"Two Sum","solved":false}` 表达一个标题和一个状态。

这里“对象”指一组键和值，思路与前面 map 的键值记录相近，但 JSON 可以同时表达文字、数字、布尔、数组和嵌套记录。本例只交换一个文字字段和一个布尔字段，先把最小记录读清楚。

**Go 结构体是程序里的值，JSON 是表示数据的文字，两者需要编码或解码才能互相转换。** JSON 的文字和键要双引号，布尔 false 不加引号；不能使用注释或在最后一项后随意加逗号。

Marshal 表示编码，Unmarshal 表示解码。`[]byte` 是字节切片，byte 是 `uint8` 的别名；uint8 是取值为 0–255 的整数类型，适合表示一个字节。编码函数返回字节，解码函数接收字节。本节的两次明确转换是 `string(data)` 显示编码结果和 `[]byte(文字)` 准备解码输入。

### 就地练习：值和文字的往返

用Problem{Title:"复习",Solved:true}编码，指出返回类型与显示时的转换；解码前为什么需要目标地址？

### 参考核对：值和文字的往返

Marshal返回[]byte与error，string(data)用于文字显示；Unmarshal通过地址写入Go值，JSON文字不是结构体本身。

## 缺字段、null、omitempty 与不可信输入

没有出现在 JSON 中的字段，解码到新建的零值结构体时保持零值；如果复用已有结构体，缺字段可能保留旧值。因此每份独立请求应准备新的目标，不要让上一请求的数据漏进下一请求。普通 int 字段也无法直接区分“没提供”和“明确提供0”，有此需求时用指针字段或专门的输入类型。

标签 `json:"name,omitempty"` 会在编码时按规则省略空值；`json:"-"` 表示不编码该字段。省略不等于业务校验，不能据此保证必填字段存在。nil 切片通常编码为 null，非 nil 空切片编码为 []，对外接口需要统一约定。

解码到 any 时 JSON 数字默认常成为 float64，大整数可能失去精度；结构明确时优先用具体字段类型，需要保留数字文字时了解 Decoder.UseNumber。json.Unmarshal 会拒绝尾部额外的非空白 JSON，Decoder.Decode 只读一个值，若用于请求流还要确认后面结束，见 [严格 JSON 边界](go-json-boundary.md)。

### 就地练习：缺字段会留下什么

先令p的Solved=true，再把只有title的JSON解码到p；与解码到新零值Problem对比。

### 参考核对：缺字段会留下什么

复用p会保留原true；新目标的Solved是false。独立请求应避免上一条数据残留。

## 先运行一个小例子

在已初始化的独立 Go 练习目录中，把下面完整代码保存为 main.go。本节替换原文件，不在文件末尾追加另一份 main 函数。

```go
package main

import (
	"encoding/json"
	"fmt"
)

type Problem struct {
	Title  string `json:"title"`  // Go 字段叫 Title，对外的 JSON 键叫 title。
	Solved bool   `json:"solved"` // bool 会编码成 JSON 的 true 或 false。
}

func main() {
	p := Problem{Title: "Two Sum", Solved: false}
	data, err := json.Marshal(p) // 将结构体编码为 JSON 字节切片。
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Println(string(data)) // 把字节转换成字符串，才能直观看到 JSON 文字。

	// 单独的输入文字用于练习解码；反引号保留内部的双引号。
	incoming := []byte(`{"title":"Two Sum","solved":false}`)
	var decoded Problem // 先准备一条空记录，再让解码函数写入它。
	err = json.Unmarshal(incoming, &decoded)
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Println(decoded.Title)
}
```

在这个目录的终端运行：

```sh
go run .
```

预期输出：

```output
{"title":"Two Sum","solved":false}
Two Sum
```

## 逐步读懂这个例子

Marshal 返回 JSON 字节与 error；显示后，另一份 incoming 作为解码输入。Unmarshal 需要目标地址以写入 decoded。标签 title、solved 是 JSON 键，不改变 Go 字段名。

结构体字段后面的反引号标签，是给编码工具看的附加说明：Title 是 Go 名字，title 是 JSON 名字。Title/Solved 大写导出，编码工具才会处理它们；标签不会把小写私有字段变成可编码字段。

数据流分成两段：`p → Marshal → data → string(data) → 显示 JSON`；`incoming → Unmarshal → decoded → 显示 Title`。两段输入单独提供，是为了能故意修改 incoming 检查失败。`&decoded` 交出地址，让解码函数把结果写回；少了地址就没有正确的目标。

本节先用单独的 err 声明/赋值，再 if 检查，避免把“if 内短声明”与 JSON 同时塞进一个新写法。

## 自己改一处再运行

先将 p.Solved 改成 true，观察第一行编码结果；再单独把 incoming 中的 title 改成数字，比较解码成功和错误情况。

### 参考答案

true 能正常编码；独立的 incoming 把 title 换成数字，虽然 JSON 格式合法，却与 Go string 不匹配。失败后不再读目标字段；实际排错时还应显示 err 的原因。

下面是可直接替换的完整 `main.go`。在本节独立模块中保存后运行 `go run .`。

```go
package main

import (
    "encoding/json"
    "fmt"
)

type Problem struct {
    Title string `json:"title"`
    Solved bool `json:"solved"`
}

func main() {
	p := Problem{Title: "Two Sum", Solved: true}
	data, err := json.Marshal(p)
	if err != nil { fmt.Println(err); return }
	fmt.Println(string(data))
	var decoded Problem
	err = json.Unmarshal([]byte(`{"title":123,"solved":false}`), &decoded)
	if err != nil { fmt.Println("解码失败"); return }
	fmt.Println(decoded.Title)
}
```

预期结果：

```output
{"title":"Two Sum","solved":true}
解码失败
```

## 解码失败后不要信任部分写入

Unmarshal 遇到类型错误时，目标中部分字段可能已经写入。即使 Title 看起来正确，只要 err 非 nil，当前整条输入就未通过本例约定。先结束失败路径，再用一条新目标重试，不要把部分数据保存成成功记录。

### 就地练习：一项看似正常能否保存

设计JSON让title是文字、solved是错误类型。若目标里已看到新title，能否无视err保存整条记录？

### 参考核对：一项看似正常能否保存

不能。类型失败时可能发生部分写入；只要err非nil，当前输入没有完整通过约定。

## 合法格式也可能类型不匹配

| incoming 中的输入 | 预期 |
| --- | --- |
| `{"title":"新题目","solved":true}` | 解码成功，最后输出新题目 |
| `{"title":123,"solved":false}` | title 的数字不符合 Go string 字段，返回错误 |
| `{"title":"新题目",}` | 尾逗号使 JSON 格式错误，返回错误 |

每次只替换反引号里面的 JSON，保存后运行；失败时不再使用 decoded。参考例子没有实现完整接口校验，未知字段、缺字段及请求体大小约束会在 HTTP 章节讲。

## 合上参考，独立交换学习记录

从空白 main.go 为StudyRecord设计标题文字和分钟整数两个导出字段，自行给它们添加JSON标签title、minutes。创建“复习”、20分钟的值，编码并显示JSON；再准备独立输入JSON，将其解码到另一条记录，打印关键字段确认真的写入。

编码结果应含title="复习"与minutes=20，字段出现顺序不作为验收条件。解码分别验收：

| 输入JSON | 应观察到什么 |
| --- | --- |
| `{"title":"复习","minutes":20}` | 成功显示“复习 20” |
| `{"title":"复习","minutes":"20"}` | 类型不匹配的error，不打印成功结果 |
| `{"title":"复习","minutes":20,}` | 格式错误的error，不打印成功结果 |

**自行写出目标地址与两处错误处理，不复用Problem只替换incoming。** 不要求HTTP或数据库，只交换本课的本地数据。

### 参考答案

两个导出字段使用小写 JSON 名。把输入中的分钟改成 "20" 会类型不匹配，加尾逗号会格式错误；两者都应走解码失败分支，不显示成功记录。

下面是可直接替换的完整 `main.go`。在本节独立模块中保存后运行 `go run .`。

```go
package main

import (
    "encoding/json"
    "fmt"
)

type StudyRecord struct {
    Title string `json:"title"`
    Minutes int `json:"minutes"`
}

func main() {
	record := StudyRecord{Title: "复习", Minutes: 20}
	data, err := json.Marshal(record)
	if err != nil { fmt.Println("编码失败：", err); return }
	fmt.Println(string(data))
	incoming := []byte(`{"title":"复习","minutes":20}`)
	var decoded StudyRecord
	err = json.Unmarshal(incoming, &decoded)
	if err != nil { fmt.Println("解码失败：", err); return }
	fmt.Println(decoded.Title, decoded.Minutes)
}
```

预期结果：

```output
{"title":"复习","minutes":20}
复习 20
```

参考：[Go JSON 包文档](https://pkg.go.dev/encoding/json@go1.22.0)。
