# 严格 JSON 输入边界

先检查结构，再确认输入结束，最后检查字段的业务含义。

## JSON 格式正确，为什么还可能不合格

客户端提交一个标题，本接口只接受一个对象和字段 `title`。以下问题不同：缺括号是格式错误；多一个 `role` 是未知字段；两个连续对象是多余输入；标题全空白是业务错误。

**解码成功只说明已读出的内容能装进目标值，不等于整份输入符合接口约定。**`Decoder` 从一个可读取的输入源逐步读 JSON；`DisallowUnknownFields` 拒绝结构体未声明的字段。读完第一个值后再尝试读取，应得到 `io.EOF`，表示输入结束。

EOF 是 End Of File 的缩写，在这里表示“没有更多内容可读”，不专指磁盘文件。若第一次 Decode 返回 EOF，说明连一个对象都没读到，是空输入；只有成功读完一个值后期待 EOF。

### 就地练习：同一个解码成功不同合同

对正常对象、未知role字段、两个连续对象、空白标题分别指出拒绝环节。

### 参考核对：同一个解码成功不同合同

结构/未知字段检查、尾部结束检查、业务标题检查各负责一类问题；第一次Decode成功不表示整体合格。

## 完整程序：先从字符串练习

在独立练习目录替换 `main.go`：

```go
package main

import (
	"encoding/json"
	"fmt"
	"io"
	"strings"
)

type Input struct {
	Title string `json:"title"` // 标签让 JSON 的 title 对应 Go 的导出字段 Title。
}

func main() {
	// Reader 是可读取输入源；这次输入来自字符串，尚未接收 HTTP 请求。
	decoder := json.NewDecoder(strings.NewReader(`{"title":"Go"}`))
	decoder.DisallowUnknownFields()
	var input Input
	// &input 允许 Decode 写入这个结构体；格式或字段类型错误在此被拒绝。
	if err := decoder.Decode(&input); err != nil {
		fmt.Println("非法JSON")
		return
	}
	// 再读一次，只有正常结束 EOF 才说明后面没有第二个值或坏内容。
	if err := decoder.Decode(&struct{}{}); err != io.EOF {
		fmt.Println("额外JSON")
		return
	}
	// TrimSpace 去掉首尾空白，业务规则要求标题至少有一个非空白字符。
	if strings.TrimSpace(input.Title) == "" {
		fmt.Println("空标题")
		return
	}
	fmt.Println(input.Title)
}
```

```sh
go run .
```

输出为：

```output
Go
```

`&struct{}{}` 是空结构体值的地址，作为“试读有没有下一个值”的目标。这里判断 err 是否等于 EOF，而不是要求下一个值能装进这个空结构体。任何额外值或错误都会拒绝；尾部仅有空白会正常到 EOF。

## 四个输入，四种不同检查

| 替换字符串输入 | 预期 | 查到的问题 |
| --- | --- | --- |
| `{"title":"Go"}` | Go | 合格 |
| `{"title":"Go","role":"admin"}` | 非法JSON | 未声明字段 |
| `{"title":"Go"} {"title":"Web"}` | 额外JSON | 不止一个值 |
| `{"title":"   "}` | 空标题 | 格式合格但业务不合格 |
| `{"title":123}` | 非法JSON | title类型错误 |

`null` 会让这个结构体保持零值，所以随后被空标题规则拒绝。本节没实现“一定出现字段”的独立判定，若更新接口要区分没传与明确清空，应使用指针字段等单独建模，CRUD节会说明。

## 迁到 HTTP 正文时还要补什么

真实请求的正文在 `r.Body`，它是可读取的字节流。客户端送来的大正文会消耗内存和处理时间，不能直接无限读取。

```go
// 这是已有 Handler 内的片段，不是第二份 main.go。
// w 和 r 来自处理函数参数，input 是当前请求的目标结构体。
r.Body = http.MaxBytesReader(w, r.Body, 8*1024) // 最多读取 8 KiB 正文。
decoder := json.NewDecoder(r.Body)
decoder.DisallowUnknownFields()
```

还应检查请求的媒体类型，按合同把格式错误映射成400、超过限制映射成413、不支持的类型映射成415。不要把本节字符串运行成功说成这些 HTTP 行为都已完成；[完整CRUD项目](#/learn/go/go-crud) 的 `decodeJSON` 实现了这些边界。

**输入结构检查、大小限制与业务校验各解决不同问题，不能互相替代。** 严格解码也不是完整 JSON Schema 验证，重复同名键等需要另外制定规则。

### 就地练习：大小限制放哪里

为8KiB上限画出读取、解码、标题校验的顺序。超限、媒体类型错误分别应映射什么状态？

### 参考核对：大小限制放哪里

先限制正文和检查媒体类型，再结构与业务校验；超限413，媒体类型不支持415，不能都归为400。

## 修改实验

逐项替换表中输入运行，再把尾部加上空白与非JSON文字，解释为何只有空白会被允许。

### 参考答案

第一个对象成功，第二次Decode遇到extra而非EOF，因此拒绝。尾部仅有空格/换行时才直接到EOF；第一次Decode就EOF则是空请求，并非合格的零个对象。

下面是可直接替换的完整 `main.go`。在本节独立模块中保存后运行 `go run .`。

```go
package main

import (
	"encoding/json"
	"fmt"
	"io"
	"strings"
)

type Input struct {
	Title string `json:"title"` // 标签让 JSON 的 title 对应 Go 的导出字段 Title。
}

func main() {
	// Reader 是可读取输入源；这次输入来自字符串，尚未接收 HTTP 请求。
	decoder := json.NewDecoder(strings.NewReader(`{"title":"Go"} extra`))
	decoder.DisallowUnknownFields()
	var input Input
	// &input 允许 Decode 写入这个结构体；格式或字段类型错误在此被拒绝。
	if err := decoder.Decode(&input); err != nil {
		fmt.Println("非法JSON")
		return
	}
	// 再读一次，只有正常结束 EOF 才说明后面没有第二个值或坏内容。
	if err := decoder.Decode(&struct{}{}); err != io.EOF {
		fmt.Println("额外JSON")
		return
	}
	// TrimSpace 去掉首尾空白，业务规则要求标题至少有一个非空白字符。
	if strings.TrimSpace(input.Title) == "" {
		fmt.Println("空标题")
		return
	}
	fmt.Println(input.Title)
}
```

预期结果：

```output
额外JSON
```

参考：[Go JSON Decoder](https://pkg.go.dev/encoding/json#Decoder)、[Go MaxBytesReader](https://pkg.go.dev/net/http#MaxBytesReader)。

## “严格”仍需给出具体范围

DisallowUnknownFields针对结构体未知字段，不等于完整Schema验证；默认解码对重复键有自己的处理规则，若合同必须拒绝重复键，要额外实现并测试。首个值为null、缺必填字段、字段长度、超大整数都应分别规定。

HTTP层先检查媒体类型与正文大小，再做格式/结构与业务规则。大小错误要保留可识别类别以映射413，不能把所有失败都吞成同一句“非法JSON”，让使用者无法区分修数据还是减大小。

### 就地练习：同名键也算未知字段吗

对{"title":"A","title":"B"}说明DisallowUnknownFields是否意味着拒绝重复。若合同禁止重复，需要补哪种检查？

### 参考核对：同名键也算未知字段吗

两个键名都是已知字段，未知字段检查不保证拒绝重复；需额外检测键重复并测试。
