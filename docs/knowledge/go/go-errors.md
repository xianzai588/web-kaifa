# error、JSON 与输入边界：先读懂，再验证

用户提交一条题目标题。`{"title":"练习"}`、`{"title":"   "}` 和 `{title:练习}` 看起来都像输入，但问题不同：第一条可用，第二条格式合法却违反业务，第三条不是合法 JSON。学会区分错误层次，才能告诉用户改什么，也避免把未验证输入写进存储。本课先使用字符串与标准库，不要求先学 HTTP Handler。

## 1. error 是值：失败要交给谁处理

函数返回 `(结果, error)`，调用者先判断 `err != nil`。错误分支里的结果通常不能使用。用 `errors.New` 建立稳定的错误值；用 `fmt.Errorf("说明：%w", err)` 包装保留原错误关系。调用方可以用 `errors.Is` 判断某种原因，而不是依赖错误文案包含某个中文词；文案可能调整，结构化原因更稳定。

`errors.As` 则提取某一错误类型，例如 JSON 类型错误中是哪个字段不匹配。两者不是为了让你每个地方都写复杂判断；只在调用者真的需要区分原因时提供可识别错误。错误由最适合恢复或展示的一层处理；层层打印同一个错误会得到重复日志。普通用户输入错误不要用 panic 中断整个程序。

### 就地练习：包装仍识别原因

用%w包装ErrTitle后比较errors.Is；只把错误文字拼进新错误再比。

### 参考核对：包装仍识别原因

%w保留错误链可识别；相同文字不保证错误身份相同，不能按文案替代类别。

## 2. JSON：语法、类型、字段和业务分开

JSON 键要双引号，布尔值是 `true/false`，不是字符串 `"true"`。`Title string` 要求 title 是字符串，数字会类型错误。默认解码允许未知字段；要求严格契约时用 `DisallowUnknownFields`。但是缺失 title 可能仍让 Title 保持零值空字符串，因此还要 `TrimSpace` 后判断业务要求。长度规则也要说明是字节、码点还是其他单位；例子使用 Unicode 码点，并限定 1–40。

第一次 Decode 只读一个 JSON 值。`{"title":"a"} {"title":"b"}` 可以让第一次成功，因此要求输入只有一个对象时，再 Decode 一次；正确结尾必须得到 `io.EOF`。EOF 意味着输入已结束，在这一步是预期状态，不是“出错就必须拒绝”的笼统规则。不要把第二次任意错误都当 EOF，坏尾部也要拒绝。

### 就地练习：每层失败不同

为title数字、未知owner_id、连续两个对象、空白标题分别标出失败层。

### 参考核对：每层失败不同

类型、未知字段、单值边界、业务；首次Decode成功不说明整个输入合格。

## 3. 限制与资源：顺序决定什么被接受

先限制输入大小，再解码，再验证，再使用。这里输入已经是一个本地字符串，用 `len(raw)` 限制 256 字节，不是 HTTP 请求保护。在后续 Handler 中，应使用 `http.MaxBytesReader` 限制请求 Body，再处理超限状态；仅限制 Decoder 的 Reader 可能把被截断的内容误认为完整边界。`defer` 在当前函数返回时执行，不是在循环每轮结束时；打开文件或返回 Rows 后及时关闭，长循环内可把单次资源使用放进独立函数。

### 就地练习：先限大小再处理

写出大小、Decode、尾部EOF、标题校验、保存的先后；真实HTTP限制应放哪里？

### 参考核对：先限大小再处理

先限制正文读取，再结构与业务，合格才使用；HTTP用MaxBytesReader等真实边界，不把本地len检查当网络保护。

## 在 VS Code 运行：main.go 完整程序

建立独立目录 `exercises/go/go-errors`，打开目录、创建 `main.go` 并保存。首次终端执行 `go mod init example.com/learn/go-errors`，再 `go fmt ./...`、`go run .`。输出展示正常、空白、未知字段、多值、坏语法五种真实解析结果。

```go
package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"strings"
	"unicode/utf8"
)

var ErrTitle = errors.New("标题需为 1–40 个码点")

type Input struct { Title string `json:"title"` }

func Parse(raw string) (Input, error) {
	var input Input
	if len(raw) > 256 {
		return input, errors.New("输入超过 256 字节")
	}
	dec := json.NewDecoder(strings.NewReader(raw))
	dec.DisallowUnknownFields()
	if err := dec.Decode(&input); err != nil {
		return Input{}, fmt.Errorf("解析：%w", err)
	}
	var extra any
	// 只有EOF证明尾部结束；第二个值或坏尾部都不能当作正常结束。
	if err := dec.Decode(&extra); !errors.Is(err, io.EOF) {
		return Input{}, errors.New("只允许一个 JSON 值")
	}
	input.Title = strings.TrimSpace(input.Title)
	n := utf8.RuneCountInString(input.Title)
	if n < 1 || n > 40 {
		return Input{}, fmt.Errorf("校验：%w", ErrTitle)
	}
	return input, nil
}

func main() {
	for _, raw := range []string{
		`{"title":"  练习  "}`,
		`{"title":"   "}`,
		`{"title":"练习","owner_id":1}`,
		`{"title":"a"} {"title":"b"}`,
		`{title:练习}`,
	} {
		input, err := Parse(raw)
		if err != nil {
			fmt.Printf("拒绝：%s；标题错误=%t\n", raw, errors.Is(err, ErrTitle))
			continue
		}
		fmt.Println("接受：", input.Title)
	}
}
```

```output
接受： 练习
拒绝：{"title":"   "}；标题错误=true
拒绝：{"title":"练习","owner_id":1}；标题错误=false
拒绝：{"title":"a"} {"title":"b"}；标题错误=false
拒绝：{title:练习}；标题错误=false
```

## 修改实验

1. 去掉DisallowUnknownFields，带owner_id的输入会怎样？结构体得到该字段了吗？
2. 去掉第二次Decode，两个连续JSON值会被接受吗？
3. 分别新增 `{"title":12}`、`{}`、`null`，哪一层应该拒绝？

### 参考答案

去掉 `DisallowUnknownFields`，参考答案：owner_id 那组会被接受，但输入结构仍没有该字段，因此它被忽略。是否允许未知字段应是契约决定，不是偶然默认。去掉第二次 Decode，多值输入会被误接受。增加 `{"title":12}`，应拒绝；增加 `{}`，应成为标题错误。顶层 `null` 也会在业务校验被拒绝。例子没有拒绝重复 JSON 键，例如两个 title；encoding/json 会按其规则处理，严格禁止重复键需要额外实现与测试，不能宣称本例解决所有 JSON 歧义。

自查：能指出大小、语法、类型、字段、单值、业务各检查在哪里吗？失败时是否已经创建记录？为什么错误中零值不算成功？把报错交给 AI 时贴完整输入、Parse 函数、实际输出和期望，不要只说“JSON 坏了”。

官方参考：[encoding/json](https://pkg.go.dev/encoding/json)、[errors](https://pkg.go.dev/errors)、[包装错误](https://go.dev/blog/go1.13-errors)、[MaxBytesReader](https://pkg.go.dev/net/http#MaxBytesReader)。
