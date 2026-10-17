# 表驱动测试与 HTTP 测试：把“应该”变成可重放的检查

手动运行一次得到 6，只证明那个输入在那次运行得到了 6。加一个条件后，你需要重新检查正常、空边界和失败情况。测试把输入与预期写成可重复执行的程序，方便定位哪种行为被破坏。本主题先测试纯函数，之后用 httptest 检查 HTTP；不会假设你已经有数据库。

## 1. 测试文件和命令各自做什么

测试源码放在以 `_test.go` 结尾的文件，例如 `main_test.go`。函数命名 `TestSumTo(t *testing.T)`，导入 `testing`。`go test ./...` 查当前模块及子包的测试；`-v` 显示每个测试与子测试名称；`-count=1` 禁用测试结果缓存，适合确认你刚刚改变的外部条件。普通 main 输出和测试结果不是同一回事：`go run .` 不运行 `_test.go`。

断言表示“实际结果应该等于什么”，不只是调用函数不崩溃。`t.Errorf` 报失败后继续，适合比较多项输出；`t.Fatalf` 报失败并停止当前测试，适合后续检查已经无法安全继续的条件。失败消息应包含输入、实际与预期，不能只写“错了”。

### 就地练习：运行和测试不同

执行go run .是否会运行main_test.go？想看每项结果且不复用测试缓存该用什么？

### 参考核对：运行和测试不同

不会；go test -v -count=1 ./...执行测试，实际断言才证明规则。

## 2. 表驱动：每一行代表一种理由

表中保存名字、输入、期望结果和是否应报错。名字如 `zero`、`negative` 表明为什么存在这条用例。`t.Run` 创建子测试，失败时定位具体边界。输入只罗列几个相似正数会漏掉重要规则；至少包括零、最小正常、负数与约定上界。测试自己的规则，而不是照抄实现的每一行条件再称为验证。

测试不是为了让错误永远不出现，而是让错误能快速显现。先把期望改错一次，确认测试真的能失败，再恢复；这样可以发现没有调用函数、忽略比较等“永远绿”的测试。覆盖率说明代码执行情况，无法证明业务规则完整，更不能证明授权与数据库约束正确。

### 就地练习：零输入不够区分

想检出求和循环<=错为<，比较n=0与n=3的区分力。

### 参考核对：零输入不够区分

0两版都为0；3正确6、错版3，需能改变结果的反例。

## 在 VS Code 创建两个完整文件

打开 `exercises/go/go-tests`，首次 `go mod init example.com/learn/go-tests`。创建 `main.go` 和 `main_test.go`，两者在同一个目录、同一个包。分别保存后执行 `go fmt ./...`、`go test -v ./...`。不要把两个完整文件拼成一个文件，也不要把带 `go test` 的命令写进源码。

### main.go（完整程序）

```go
package main

import (
	"errors"
	"fmt"
	"net/http"
)

func SumTo(n int) (int, error) {
	if n < 0 || n > 10000 { return 0, errors.New("n 超出范围") }
	total := 0
	for i := 1; i <= n; i++ { total += i }
	return total, nil
}

func Health(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintln(w, `{"status":"ok"}`)
}

func main() {
	value, err := SumTo(3)
	fmt.Println(value, err)
}
```

### main_test.go（完整测试文件）

```go
package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestSumTo(t *testing.T) {
	cases := []struct {
		name string
		n, want int
		wantErr bool
	}{
		{"zero", 0, 0, false},
		{"three", 3, 6, false},
		{"negative", -1, 0, true},
		{"too_large", 10001, 0, true},
	}
	// 各行期望独立来自规则，子测试名说明该输入检验哪一种边界。
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := SumTo(tc.n)
			if (err != nil) != tc.wantErr {
				t.Fatalf("SumTo(%d) err=%v, wantErr=%t", tc.n, err, tc.wantErr)
			}
			if got != tc.want {
				t.Errorf("SumTo(%d)=%d, want %d", tc.n, got, tc.want)
			}
		})
	}
}

func TestHealth(t *testing.T) {
	r := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()
	Health(w, r)
	if w.Code != http.StatusOK { t.Errorf("status=%d", w.Code) }
	if got := w.Header().Get("Content-Type"); got != "application/json" {
		t.Errorf("Content-Type=%q", got)
	}
	if got := w.Body.String(); got != "{\"status\":\"ok\"}\n" {
		t.Errorf("body=%q", got)
	}
}
```

精确的耗时与最后包路径因机器和模块名不同；应看到 `TestSumTo/zero`、`three`、`negative`、`too_large` 和 `TestHealth` 全部 PASS，最后有 `PASS`，命令退出码为 0。运行 `go run .` 则输出 `6 <nil>`。

## 3. HTTP 与集成：哪些东西真的被测到

`NewRequest` 构造请求，`NewRecorder` 记录响应，直接调用 Handler 不需要监听端口。我们比较状态、Content-Type 和 Body，而不是只看 200。直接调用 Health 尚未测试路由方法限制；要验证 ServeMux 的路径与 405，应让请求经过 mux。`httptest.NewServer` 则可测试真实 HTTP 客户端到本地临时服务的链路。

用 fake 存储测试 Handler，只验证 Handler 如何调用存储，不证明 PostgreSQL 查询、索引和回滚。真实数据库集成测试需要专用测试库、独立数据和清理。各用例不应依赖前一个用例已经创建某条记录；共享可变全局变量会让测试顺序和并行执行影响结果。

### 就地练习：路由是否经过

直接Health(rec,req)通过后，能否证明ServeMux方法与路径合同？需要怎样进入？

### 参考核对：路由是否经过

不能；经过实际Mux检查404/405，真实HTTP往返用NewServer，数据库还需独立集成证据。

## 修改实验

1. 把three用例期望改成7，执行go test，应该是哪条断言失败？
2. 恢复期望，把实现里的 `<=` 改成 `<`，zero与three各是否通过？
3. 增加n=1和n=10000的用例，先计算正确期望。
4. 删除Health的Content-Type设置，HTTP测试哪项应该失败？

### 参考答案

先把 `three` 的期望改为 `7`，执行命令，应失败并指出实际 6、期望 7；恢复。再把实现里的 `<=` 改为 `<`，`three` 应失败，`zero` 仍通过，说明测试可以定位少算最后一项。新增 `n=1` 期望 1，并写上界 10000 期望 50005000。HTTP 故意删掉 Header，那项断言应失败。

自查：测试正常、失败与边界了吗？失败信息是否足够定位输入？能解释测试函数通过为何不代表路由、真实数据库或生产部署通过吗？这套例子只覆盖约定的小整数求和和固定健康响应，不包含登录、并发共享状态和持久化。

官方参考：[添加测试](https://go.dev/doc/tutorial/add-a-test)、[testing](https://pkg.go.dev/testing)、[httptest](https://pkg.go.dev/net/http/httptest)、[覆盖率工具](https://go.dev/doc/build-cover)。
