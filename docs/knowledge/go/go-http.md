# HTTP 契约与响应：请求如何变成返回结果

浏览器向地址发请求，服务端解析方法、路径和输入，决定响应状态、头和内容。一个“加法 API”不仅是把 2 与 3 相加，还要说明缺参数、非数字、错误方法时怎么办。先写契约，再写 Handler，前端就能按约定处理成功与失败。

## 请求的三种输入位置

路径 `/problems/12` 通常定位某条资源，query `/problems?limit=10` 表达筛选和分页，body 用于提交 JSON 等内容。query 所有值都是字符串，计算前用 `strconv.Atoi` 转成整数并检查错误。`r.URL.Query().Get` 取一个值，可能掩盖重复参数；本例明确要求 a、b 各出现一次。不能只用空字符串证明是数字，也不能忽略 Atoi 的错误把坏输入变成零。

HTTP 方法表达操作。GET 读取，POST 常用于创建，PATCH 修改，DELETE 删除。不能因为 GET 容易在地址栏测试，就用它做删除或密码变更。约定空列表可以是 200 与 `[]`；某个不存在 id 的详情常为 404，两者不是同一种情况。

### 就地练习：三处输入别混

为/problems/12、?limit=10与创建JSON分别选择路径参数、查询与正文，说明查询数字类型。

### 参考核对：三处输入别混

路径定位id，query表达筛选/分页，body提交数据；query值是字符串，要校验数量并解析，不能忽略错误。

## 响应由状态、头、Body 共同表达

本例 `/health` 返回 200 和 JSON；合法 `/add?a=2&b=3` 返回 200、`{"sum":5}`；缺失、重复、非数字或越界返回 400 与稳定错误键。只返回“错误了”而保留 200，会让客户端把失败当成功。请求方法不支持通常返回 405，认证与对象权限则还有 401/403 等，不能全部塞进 400。

Header 必须在发送状态和内容前设置。第一次 `Write` 可能隐式发送 200；随后再 `WriteHeader(400)` 已经太晚。`json.Encoder.Encode` 通常追加换行；测试应按实际 JSON 或明确的字节约定比较。已经发送响应后遇到写失败，不能再发第二份 JSON“修正”第一次响应，通常记录失败即可。

### 就地练习：三项合同一起看

保持状态200但把JSON正文写坏，客户端能否算成功？若先写正文后改400又如何？

### 参考核对：三项合同一起看

还需媒体类型及合法业务正文；首次写正文可能确定200，后改400太晚。

## 完整可运行例子：先无端口验证，再启动真实服务

要求 Go 1.22 或以上，因为路由使用 `GET /health` 这种方法模式。VS Code 打开独立目录 `exercises/go/go-http`，创建 `main.go`。首次 `go mod init example.com/learn/go-http`，再 `go fmt ./...`、`go run .`。默认使用 httptest 构造模拟请求，并执行真实 Handler 得到响应，没有启动长期服务器，不占端口。你现在可把它理解为“把指定请求交给处理函数”，不要求先掌握完整测试体系；后面 serve 模式才通过网络监听真实客户端。

```go
package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strconv"
	"strings"
)

func reply(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		fmt.Fprintln(os.Stderr, "响应写入失败：", err)
	}
}

func routes() *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		reply(w, 200, map[string]string{"status": "ok"})
	})
	mux.HandleFunc("GET /add", func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		if len(q["a"]) != 1 || len(q["b"]) != 1 {
			reply(w, 400, map[string]string{"error": "a 和 b 必须各出现一次"})
			return
		}
		a, errA := strconv.Atoi(q.Get("a"))
		b, errB := strconv.Atoi(q.Get("b"))
		if errA != nil || errB != nil || a < -1000 || a > 1000 || b < -1000 || b > 1000 {
			reply(w, 400, map[string]string{"error": "a 和 b 必须为 -1000 到 1000 的整数"})
			return
		}
		reply(w, 200, map[string]int{"sum": a + b})
	})
	return mux
}

func main() {
	mux := routes()
	if len(os.Args) > 1 && os.Args[1] == "serve" {
		fmt.Println("监听 http://127.0.0.1:8753，Ctrl+C 停止")
		if err := http.ListenAndServe("127.0.0.1:8753", mux); err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
		return
	}
	for _, path := range []string{"/health", "/add?a=2&b=3", "/add?a=x&b=3", "/add?a=1&a=2&b=3"} {
		r := httptest.NewRequest(http.MethodGet, path, nil)
		w := httptest.NewRecorder()
		mux.ServeHTTP(w, r)
		fmt.Printf("%s => %d %s\n", path, w.Code, strings.TrimSpace(w.Body.String()))
	}
}
```

```output
/health => 200 {"status":"ok"}
/add?a=2&b=3 => 200 {"sum":5}
/add?a=x&b=3 => 400 {"error":"a 和 b 必须为 -1000 到 1000 的整数"}
/add?a=1&a=2&b=3 => 400 {"error":"a 和 b 必须各出现一次"}
```

真实运行时输入 `go run . serve`，终端会持续等待请求。另开终端输入 `curl.exe -i "http://127.0.0.1:8753/add?a=2&b=3"`（macOS/Linux 用 curl），应看到 200、JSON Content-Type 和 sum=5；浏览器也可以打开这个 GET 地址。按 Ctrl+C 停止。端口被占用时先查已有服务；本例只监听本机，不是已上线 API。

## 修改实验

1. 请求 `/add?a=-2&b=3`，状态和sum应是什么？
2. 请求 `/add?a=2`，缺b时应是什么状态？
3. 对/add发送POST，与参数非法的GET响应有什么区别？

### 参考答案

把正常输入改成 `a=-2&b=3`，参考 sum=1；改成只有 `a=2`，参考 400；用 `curl.exe -i -X POST http://127.0.0.1:8753/add`，ServeMux 返回 405。GET 模式在 Go 中也匹配 HEAD，不能把它描述成拒绝所有非 GET 方法。标准库默认的 404/405 不是这套 JSON 错误格式；若产品要求统一格式，需要显式补路由与测试。

## 从加法到 CRUD：定位、创建、修改、删除

Go 1.22+ 可用 `mux.HandleFunc("GET /problems/{id}", handler)` 注册路径模式。在此handler内，`r.PathValue("id")` 取得路径变量字符串；`/problems/12` 得到 `"12"`，还要用 Atoi/ParseInt验证正整数，不是自动可信数据库id。详情找不到时返回404；列表为空可返回200和空数组。不能把query里的id与PathValue混用后不说明契约。

创建请求应有专门DTO，例如只接收Title并约定JSON键title，而不是直接允许用户提交数据库全部字段。使用当前HTTP上下文时限制Body，再Decode和验证：下面是**创建Handler内部片段**，需已有Input/JSON校验与reply，且导入errors、io、encoding/json，不能单独go run：

```go
r.Body = http.MaxBytesReader(w, r.Body, 4096)
defer r.Body.Close()
dec := json.NewDecoder(r.Body)
dec.DisallowUnknownFields()
var input Input
if err := dec.Decode(&input); err != nil {
	var tooLarge *http.MaxBytesError
	if errors.As(err, &tooLarge) { reply(w, 413, map[string]string{"error":"输入过大"}) } else { reply(w, 400, map[string]string{"error":"JSON不符合约定"}) }
	return
}
var extra any
if err := dec.Decode(&extra); !errors.Is(err, io.EOF) {
	var tooLarge *http.MaxBytesError
	if errors.As(err, &tooLarge) { reply(w, 413, map[string]string{"error":"输入过大"}) } else { reply(w, 400, map[string]string{"error":"只允许一个JSON值"}) }
	return
}
// 继续校验标题等业务规则，全部通过后才创建；此处尚未写入存储。
```

真实创建成功常用201并返回新id，`Location`指向新资源地址，例如 `/problems/12`。Location在写状态前设置，不是用户输入id的回显。返回200/201还是204应先写进契约：204表示成功且没有响应Body，不能随后又写JSON。删除成功可返回204，再读取同id按契约404；若重复删除应204还是404，也需要明确决定。

内存CRUD处理共享map时，应让存储方法自身同步，创建id、检查存在、更新或删除成为受保护的整体操作。Handler先读map、稍后不加锁写回仍可能竞争；不要拿着锁向客户端写响应。真实数据库则使用带归属条件的更新/删除，并检查RowsAffected。此段只是契约与边界解释，没有凭空提供现成CRUD项目。

### PATCH 的 false 与没传字段

修改接口不能用 `if input.Solved` 判断是否提供字段，因为用户可能明确要改成 false。下面是**DTO 概念片段**，用于已有JSON解码流程：

```go
type PatchInput struct { Solved *bool `json:"solved"` }
// 解码到 input 后：
if input.Solved != nil { problem.Solved = *input.Solved }
```

`{}` 让指针为nil，表示本契约不修改；`{"solved":false}` 得到指向false的非nil指针，明确改为false；true也类似。encoding/json 将 JSON null 解成nil，因此此DTO默认把null和没传都看成不修改；若契约要求null非法，需另行记录字段是否存在并校验，不能声称指针自动区分三种状态。先列出这四种输入的预期，再写PATCH处理。

自查：你能画出客户端→mux→Handler→校验→响应的顺序吗？能区分服务没启动、404 与参数 400 吗？本例没有数据库、认证、请求超时与优雅关闭；生产化应在交付主题继续补充，不把学习服务当完整生产部署。

官方参考：[net/http](https://pkg.go.dev/net/http)、[ServeMux](https://pkg.go.dev/net/http#ServeMux)、[strconv](https://pkg.go.dev/strconv)、[httptest](https://pkg.go.dev/net/http/httptest)。
