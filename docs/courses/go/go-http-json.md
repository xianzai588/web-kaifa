# JSON 响应与状态码顺序

认识响应的媒体类型，按“头部 → 状态 → 正文”发送 JSON。

## 同样是正文，为什么要说明格式

前面返回文字 `ok` 或 `30`。现在希望创建记录后返回 `{"id":1}`，方便客户端程序读取 id。JSON 是双方交换数据的文字格式，不是网页布局，也不是 Go 的 map 本身；编码器把 Go 值转换为 JSON 文字。

**响应头 `Content-Type` 说明正文的格式，JSON 正文应声明 `application/json`。** 这个媒体类型由斜杠分隔类别和格式。常见的还有 `text/plain`（普通文字）和 `text/html`（HTML文档）。它在头部里，不能用 `{"Content-Type":"application/json"}` 替代。

请求头中的 Content-Type 说明客户端送来的正文，响应头中的 Content-Type 说明服务器返回的正文；方向由谁发送决定。`Accept` 则表达客户端想接收什么，并不等于服务器一定发送该格式。

### 就地练习：响应头不是业务字段

返回{"id":1}时，把媒体类型写进JSON字段能否替代响应头？用记录器分别检查Header与Body。

### 参考核对：响应头不是业务字段

不能；头部描述传输内容格式，JSON字段只是业务数据。应设置Content-Type后再编码正文。

## 为什么顺序重要

一次响应先确定头部和状态，再写正文。`WriteHeader(201)` 确定状态；如果没写状态就直接写正文，通常会自动确定为200。**正文已经写出后再改响应头或状态，真实客户端可能已经收到旧值。**

先认识几种成功语义：200常用于成功查询或更新，201表示创建完成，204表示成功但没有正文。204后不再编码“成功JSON”。状态是接口合同的一部分，不是随便选一个“2xx”。

### 就地练习：先写正文会选哪个状态

在副本先Encode再WriteHeader(201)，记录Code；恢复正确次序后对比。

### 参考核对：先写正文会选哪个状态

先写正文隐式确定200，后改201已太晚；正确次序为头、201、正文。

## 完整例子：观察三个独立部分

在独立练习目录替换 `main.go`：

```go
package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
)

func main() {
	// 记录器让我们观察写响应的顺序；本例没有数据库或真实创建操作。
	rec := httptest.NewRecorder()
	// 第一步说明将要发送 JSON，这是响应头，不是正文中的字段。
	rec.Header().Set("Content-Type", "application/json")
	// 第二步选择创建完成的状态常量，值为 201。
	rec.WriteHeader(http.StatusCreated)
	// 第三步把 Go 的 map 编码为 JSON，并写到记录器的正文。
	if err := json.NewEncoder(rec).Encode(map[string]int{"id": 1}); err != nil {
		fmt.Println("编码失败：", err)
		return
	}
	fmt.Println(rec.Code)
	// Encode 自带结尾换行，Print 原样打印，避免再加一个换行。
	fmt.Print(rec.Body.String())
}
```

```sh
go run .
```

输出：

```output
201
{"id":1}
```

`Header()` 返回可设置的头部集合；`Set` 登记一项名称和值。`json.NewEncoder(rec)` 创建向 rec 写文字的编码器，`Encode` 完成一次转换与写出，返回 error。真实 Handler 中输出目标应换成 w。这个模拟没有真的创建记录，201只是为了学习如何写状态。

## 看头部，别只看打印出的正文

在输出状态前增加 `fmt.Println(rec.Header().Get("Content-Type"))`，应读到 `application/json`。再把状态改成 `http.StatusOK`，应输出200，正文保持相同。

在真实处理函数里，应先完成输入校验和创建操作，再返回201。如果内容可能编码失败，可先编码到缓冲区，成功后才开始发成功响应；写出后才发现错误，不能随意把原响应改成500。

## 修改实验

分别设计“查询成功”“创建成功”“删除成功没有内容”的响应。预测哪一种应调用 Encode。再故意先 Encode、后 WriteHeader，观察记录器最初的状态。

### 参考答案

200/201示例都编码 {"id":1} 加结尾换行，共9字节；204跳过Content-Type与Encode，正文长度0。把Encode放到WriteHeader之前会隐式先确定200，这是写入顺序的可观察后果。

下面是可直接替换的完整 `main.go`。在本节独立模块中保存后运行 `go run .`。

```go
package main

import (
    "encoding/json"
    "fmt"
    "net/http"
    "net/http/httptest"
)

func main() {
	for _, status := range []int{http.StatusOK, http.StatusCreated, http.StatusNoContent} {
	    rec := httptest.NewRecorder()
	    if status != http.StatusNoContent { rec.Header().Set("Content-Type", "application/json") }
	    rec.WriteHeader(status)
	    if status != http.StatusNoContent {
	        if err := json.NewEncoder(rec).Encode(map[string]int{"id": 1}); err != nil { fmt.Println(err); return }
	    }
	    fmt.Println(rec.Code, rec.Body.Len())
	}
}
```

预期结果：

```output
200 9
201 9
204 0
```

参考：[Go ResponseWriter](https://pkg.go.dev/net/http#ResponseWriter)、[Go JSON Encoder](https://pkg.go.dev/encoding/json#Encoder)。

## 头部与正文一旦发出，错误处理方式就改变

第一次Write通常隐式确定200，WriteHeader只应按合同确定一次最终状态；之后再改Header通常不能改变已发送的响应。记录器的Header映射还可继续修改，因此测试真实已提交头部应看Result().Header。

204没有正文，不应再Encode。编码可能因不支持的类型或网络写入失败而失败；需要保证完整JSON时可先编码到缓冲，再提交状态和正文。日志只能说明写出失败，不能把已经发出的半截成功响应改造成全新的500。

### 就地练习：观察已提交的头部

写正文后把Header映射中的Content-Type改值，分别看rec.Header()与rec.Result().Header。以哪个判断客户端收到的头？

### 参考核对：观察已提交的头部

应以Result的响应视图判断；可继续修改的映射不能代表已经发出的头部。
