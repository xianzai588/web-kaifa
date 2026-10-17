# 第一个 Handler 与路由

先登记 GET /health 的处理函数，再比较模拟调用和真实监听。

## 请求到来后，谁决定执行哪个函数

上一节认识了请求和响应。现在 Go 程序要回答：收到 `GET /health` 时执行什么？收到别的路径时怎么办？

**路由是“方法和路径 → 处理函数”的对应规则。Handler 是实际读取请求、写出响应的处理者。** 本例 `/health` 只是自选的健康检查路径，表示服务能做一个简单回复，不证明数据库等所有依赖都健康。

`http.NewServeMux()` 创建路由器，`HandleFunc("GET /health", health)` 登记规则。登记时没有请求到达，`health` 不会立即执行。方法加路径的写法需要 Go 1.22 或更新版本；先运行 `go version` 核对。

### 就地练习：登记函数没有括号

在路由登记前后加终端打印，在health内另加打印；不发送请求时哪些出现？模拟请求一次后哪些多一次？

### 参考核对：登记函数没有括号

登记前后打印会出现；health内部只有处理请求才出现。登记函数值不立即调用。

## 用已经学过的命名函数实现回复

在独立练习目录替换 `main.go`，保存以下完整代码：

```go
package main

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
)

// health 的两个参数由 HTTP 服务或测试代码提供，不由浏览器直接调用 Go 函数。
func health(w http.ResponseWriter, r *http.Request) {
	// Fprint 把文字写给 w；Println 才是直接输出到本程序的终端。
	if _, err := fmt.Fprint(w, "ok"); err != nil {
		fmt.Println("写响应失败：", err)
	}
}

func main() {
	mux := http.NewServeMux()
	// 传函数名 health，不写 health(...)：现在登记，收到匹配请求才执行。
	mux.HandleFunc("GET /health", health)

	// 只有主动传入 serve 参数时才开启本机端口，默认模式只做模拟演示。
	if len(os.Args) > 1 && os.Args[1] == "serve" {
		fmt.Println("打开 http://127.0.0.1:8080/health，按 Ctrl+C 停止")
		if err := http.ListenAndServe("127.0.0.1:8080", mux); err != nil {
			fmt.Println("监听结束：", err)
		}
		return
	}

	// 以下不访问网络：构造测试请求，用记录器接住处理函数写出的响应。
	req := httptest.NewRequest("GET", "/health", nil)
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)
	fmt.Println(rec.Code, rec.Body.String())
}
```

## 先逐个认识参数

`func health(w http.ResponseWriter, r *http.Request)` 不是另一门语言，它仍是前面学过的函数声明。函数名是 `health`，括号里两个参数，没有返回值。

| 写法 | 作用 | 与已学知识的联系 |
| --- | --- | --- |
| `r *http.Request` | 查看方法、路径、参数等请求数据 | 指向请求结构体的指针；不是字符串 |
| `w http.ResponseWriter` | 设置响应并写正文 | 接口值；它提供写响应所需的方法 |
| `fmt.Fprint(w, "ok")` | 把 `ok` 写入响应正文 | 第一个参数决定写到哪里 |
| `mux.ServeHTTP(rec, req)` | 让路由器处理这个请求 | 方法调用，rec充当输出目标 |

`ResponseWriter` 是接口；真实网络响应和测试记录器都能满足它，因此同一个 `health` 能在两个场景使用。接口需要复习时回看 [接口](#/learn/go/go-interfaces)。`health` 暂时不用 r，是因为回复固定文字；后面读取查询参数时才使用它。

这里第一次写 `if _, err := fmt.Fprint(w, "ok"); err != nil`。这是 **if 的初始化语句**：先执行分号前的调用，再判断分号后的条件。Fprint 返回“写出的字节数、错误”，本例用 `_` 忽略字节数，用 err 接收错误；err 只在这个 if 及其 else 中可见。它相当于先接收结果再检查错误，只是把临时名字限制在更小范围。分号用来分开这两部分，不是要求每行都手写分号。

后面的 `if err := http.ListenAndServe(...); err != nil` 使用同一规则；这次调用只返回一个 error，所以只接收 err。声明、多个返回值与作用域需要复习时，分别回看变量、返回值和作用域章节。

没有显式写状态时，第一次写正文会使用 200。这里不用手工写请求头，先把请求交给正确函数并读到正文。

### 就地练习：画出输入与输出方向

将r、w、req、rec分到请求输入与响应输出两边。解释为什么fmt.Println("ok")不能替代fmt.Fprint(w,"ok")。

### 参考核对：画出输入与输出方向

r与req是输入，w与rec承接输出；Println写服务器终端，Fprint写客户端可收到的正文。

## 模拟调用：没有启动服务

```sh
go run .
```

输出：

```output
200 ok
```

`httptest` 是标准库的 HTTP 测试工具。`NewRequest` 在内存里生成测试请求；`NewRecorder` 生成保存状态、头部和正文的记录器。路由器和 `health` 实际执行，但消息不通过网络，程序随后退出。**`200 ok` 的模拟输出不能证明浏览器能连上 8080。**

## 真实监听：让浏览器连上来

同一文件主动运行另一种模式：

```sh
go run . serve
```

`serve` 是传给程序的命令行参数，`os.Args[1]` 能读到它；它不是特殊的 Go 关键字。`ListenAndServe` 在 `127.0.0.1:8080` 等待请求，再把请求交给 mux。终端保持运行是正常情况。

1. 保持这个终端运行，浏览器打开 `http://127.0.0.1:8080/health`，页面显示 `ok`。
2. 按 F12 打开开发者工具，进入 Network/网络面板，刷新页面，选中 `/health` 那条请求。查看 Method 为 GET、Status 为 200、Response 为 `ok`。
3. 访问 `/missing`，应看到 404；这是服务器已经回复的结果，不是浏览器连接失败。
4. 回终端按 Ctrl+C 结束服务，再刷新 `/health`。这次应出现连接错误，因为没有程序接收这个端口。

如果启动报端口已被使用，先停止自己上次的服务，或把代码中的 8080 与浏览器地址一起改为 8081。直接双击 Go 文件不会启动本例，网页上复制代码也不会替你运行。

## 自己改一处再验证

先在模拟部分把 `/health` 改成 `/missing`，再还原路径、把 GET 改为 POST。最后给 `/hello` 增加另一个命名函数，回复 `Hello`，分别在模拟模式与浏览器中检查。

### 参考答案

GET /missing得到404，POST /health得到405；这两种都证明请求经过路由匹配，而不是证明health函数处理了它们。新增hello后，模拟预期200 Hello；真实模式需重新启动并访问/hello。

## 本节验收

解释登记路由与调用函数的不同，说清 r 和 w 的方向，展示一次模拟结果和一次浏览器的真实响应，再通过停服务复现连接错误。

参考：[Go ServeMux](https://pkg.go.dev/net/http#ServeMux)、[Go Handler](https://pkg.go.dev/net/http#Handler)、[httptest 记录器](https://pkg.go.dev/net/http/httptest#ResponseRecorder)。

## 路由匹配、Handler状态与服务生命周期

Go1.22起ServeMux支持方法与路径模式，GET模式也匹配HEAD。请求到达时，服务为这次请求提供ResponseWriter和*Request；不是登记路由那一刻就执行函数。标准库会为并发请求调度处理，因此共享map等必须自行同步。

真实服务要处理启动错误，例如地址已占用，不应打印“启动成功”后忽略ListenAndServe的返回。程序重启才加载新源码；开发自动重载属于额外工具。默认ListenAndServe便利，但生产服务还应设置头部、读写、空闲超时，见后续退出课。

### 参考答案：独立实现

保留原serve参数模式，同时增加独立hello函数与GET /hello路由。默认go run .验证记录器结果；go run . serve才真正监听，浏览器访问后按Ctrl+C停止。

下面是独立练习的完整main.go，在自己的模块目录保存并运行go run .。

```go
package main

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
)

// health 的两个参数由 HTTP 服务或测试代码提供，不由浏览器直接调用 Go 函数。
func health(w http.ResponseWriter, r *http.Request) {
	// Fprint 把文字写给 w；Println 才是直接输出到本程序的终端。
	if _, err := fmt.Fprint(w, "ok"); err != nil {
		fmt.Println("写响应失败：", err)
	}
}

func hello(w http.ResponseWriter, r *http.Request) { fmt.Fprint(w, "Hello") }

func main() {
	mux := http.NewServeMux()
	// 传函数名 health，不写 health(...)：现在登记，收到匹配请求才执行。
	mux.HandleFunc("GET /health", health)
    mux.HandleFunc("GET /hello", hello)

	// 只有主动传入 serve 参数时才开启本机端口，默认模式只做模拟演示。
	if len(os.Args) > 1 && os.Args[1] == "serve" {
		fmt.Println("打开 http://127.0.0.1:8080/health，按 Ctrl+C 停止")
		if err := http.ListenAndServe("127.0.0.1:8080", mux); err != nil {
			fmt.Println("监听结束：", err)
		}
		return
	}

	// 以下不访问网络：构造测试请求，用记录器接住处理函数写出的响应。
	req := httptest.NewRequest("GET", "/hello", nil)
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)
	fmt.Println(rec.Code, rec.Body.String())
}
```

预期：

```output
200 Hello
```

### 就地练习：模拟通过证明什么

用GET /health、POST /health、GET /missing分别模拟。写出状态并说明它们能否证明8080正在监听。

### 参考核对：模拟通过证明什么

依次200、405、404；只验证处理与路由，不证明网络监听。Go的GET模式也支持HEAD。
