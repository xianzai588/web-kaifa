# 测试整个 HTTP 响应

让测试通过同一套路由，检查状态、响应类型与 JSON 字段，并证明错误会被发现。

## 为什么只看到 200 还不够

服务回复200，却可能返回坏JSON、写错字段或标错媒体类型。人工浏览也容易遗漏未知路径与错误方法。**HTTP 测试要检查接口合同，不能只证明函数被调用了。**“断言”就是测试中对结果提出明确要求，不符合就让测试失败。

本节沿用 [Go测试](#/learn/go/go-testing) 的 `_test.go`、`Test...` 和 `*testing.T`，再加入 `httptest`。没有使用新服务器、数据库或端口。

### 就地练习：200下的坏结果

保持200不变，分别把Content-Type改错、status改wrong。指出哪些断言应失败。

### 参考核对：200下的坏结果

媒体类型断言与关键字段断言分别检出；只验200会漏掉两种错误。

## 文件一：main.go，保存实际处理逻辑

```go
package main

import (
	"encoding/json"
	"net/http"
)

// health 是实际业务响应函数，测试会通过同一个路由调用它。
func health(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(map[string]string{"status": "ok"}); err != nil {
		// 正文可能已开始写出，此时不能再次冒充完整的500响应。
		return
	}
}

// Handler 组装路由，返回满足 http.Handler 接口的对象。
func Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", health)
	return mux
}

// 本节专注测试，go run . 不启动服务；真实监听见前面的 Handler 课。
func main() {}
```

`Handler()` 是自己命名的组装函数，不是内置关键字。它创建 mux 并返回接口；测试每次得到同样规则的处理器。`map[string]string` 保存字段与值，编码后才成为 JSON 正文。

## 文件二：main_test.go，提出外部可观察的要求

```go
package main

import (
	"encoding/json"
	"net/http/httptest"
	"testing"
)

func TestHealth(t *testing.T) {
	rec := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/health", nil)
	Handler().ServeHTTP(rec, req) // 通过真实路由处理，在内存中记录响应。
	if rec.Code != 200 {
		t.Fatalf("status=%d，期望200", rec.Code)
	}
	// Result 返回实际响应视图，避免只看正文写出后被改动的 Header 集合。
	response := rec.Result()
	defer response.Body.Close()
	if response.Header.Get("Content-Type") != "application/json" {
		t.Fatal("响应类型不是JSON")
	}
	var body map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatal("正文不是合法JSON：", err)
	}
	if body["status"] != "ok" {
		t.Fatalf("body=%v，status应为ok", body)
	}
}

func TestMissing(t *testing.T) {
	rec := httptest.NewRecorder()
	Handler().ServeHTTP(rec, httptest.NewRequest("GET", "/missing", nil))
	if rec.Code != 404 {
		t.Fatalf("未知路径status=%d，期望404", rec.Code)
	}
}

func TestWrongMethod(t *testing.T) {
	rec := httptest.NewRecorder()
	Handler().ServeHTTP(rec, httptest.NewRequest("POST", "/health", nil))
	if rec.Code != 405 {
		t.Fatalf("错误方法status=%d，期望405", rec.Code)
	}
}
```

这两个完整文件保存在同一个独立模块目录。不要把测试贴进 main.go，也不用先启动服务。

## 运行后再读每个断言

```sh
go test -v ./...
```

应看到三个 `Test...` 的 PASS 和包的 `ok`。路径、耗时依电脑变化，不要求逐字相同。

1. req是模拟客户端输入，rec是响应输出的记录器。
2. `ServeHTTP` 调用真实路由和真实 health 函数，覆盖方法与路径的匹配。
3. 先看状态，再看实际响应头；`Result()` 得到响应视图，使用结束后关闭 Body。
4. `rec.Body.Bytes()` 是正文的字节切片 `[]byte`；`Unmarshal` 把它解成map，`&body`让函数能修改目标。
5. 最后才检查 `status` 字段值。合法JSON仍可能装着错误业务结果。

`Fatal` 或 `Fatalf` 报告问题并终止当前测试；测试失败不会自动修代码。**这里在内存中执行处理器，不覆盖端口监听、网络传输或TLS。** 这些应另做真实请求或端到端验证。

## 必须做一次失败实验

把 main.go 里的 `"status": "ok"` 改成 `"status": "wrong"`，运行测试。状态仍200，媒体类型仍正确，但最后的字段断言必须 FAIL。还原后再通过。再把路由路径改错，检查健康测试也能失败。

### 参考答案

把status字段改wrong后，字段断言应失败，即使状态仍200。解析JSON后比较指定键，比全文搜索ok更可靠；路由改错则应在经过Mux的测试中暴露404。

## 独立练习

为 [加法Handler](#/learn/go/go-http-query) 写正常输入、缺少a、非数字、超范围四个测试，分别检查状态和正文。增加错误测试后，故意删掉范围检查，证明测试可以发现它。

参考：[Go httptest](https://pkg.go.dev/net/http/httptest)、[Go testing](https://pkg.go.dev/testing)。

## 分层测试与真实通信各证明什么

直接调用Handler适合验证业务响应，经过ServeMux还能验证路径和方法；httptest.NewServer再用Client请求才能覆盖真实HTTP往返，但仍不同于公网、反向代理和数据库的全链路。

断言状态、媒体类型、正文结构和关键字段，失败响应也检查是否误泄露内部错误。测试应从正式Handler入口进入，不能在测试里重写一份总会返回200的替身当交付证据。修改一个确定错误并看到测试失败，才能说明该断言有区分力。

### 参考答案：独立实现与验收

独立练习复用查询参数课完整main.go，在旁新增main_test.go，不另写一份加法逻辑：

```go
package main

import (
    "net/http/httptest"
    "strings"
    "testing"
)

func TestAddContract(t *testing.T) {
    cases := []struct { name, target string; status int; body string }{
        {"正常", "/add?a=10&b=20", 200, "30"},
        {"缺a", "/add?b=20", 400, "a and b"},
        {"非数字", "/add?a=x&b=20", 400, "a and b"},
        {"超范围", "/add?a=10001&b=20", 400, "a and b"},
    }
    // 同一处理函数接受不同外部输入；期望来自接口合同，不在测试里重写业务。
    for _, tc := range cases {
        t.Run(tc.name, func(t *testing.T) {
            rec := httptest.NewRecorder()
            add(rec, httptest.NewRequest("GET", tc.target, nil))
            if rec.Code != tc.status { t.Fatalf("status=%d want=%d", rec.Code, tc.status) }
            if tc.status == 200 && rec.Body.String() != tc.body { t.Fatalf("body=%q", rec.Body.String()) }
            if tc.status != 200 && !strings.Contains(rec.Body.String(), tc.body) { t.Fatalf("error body=%q", rec.Body.String()) }
        })
    }
}

```

运行go test -count=1 ./...应通过。删掉add中a>10000与b>10000的范围检查，超范围测试必须失败；恢复后再次通过。四组测试针对处理逻辑，不代表已经验证真实监听或数据库。

### 就地练习：证据覆盖到哪层

列出直接调用health、经过Mux、NewServer加Client请求分别增加的覆盖。哪个检查路由？

### 参考核对：证据覆盖到哪层

直接调用检查响应业务；Mux还检查路径/方法；NewServer再覆盖本机HTTP往返。数据库、公网仍需独立证据。
