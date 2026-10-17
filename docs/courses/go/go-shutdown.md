# 超时与有期限的服务退出

停止接新请求，给正在处理的请求一段完成时间，并让主函数真的等完退出流程。

## 正常停止为什么不能直接结束 main

HTTP服务器可能正在写响应或保存数据。直接结束进程会打断这些工作。优雅退出指先停止接新连接，再等待已开始的请求结束，最后释放数据库等资源。不是收到Ctrl+C便打印一句“再见”。

**主函数必须等待退出流程完成；在goroutine里调用Shutdown后，main立即返回仍会提前退出。** Shutdown会停止监听，使ListenAndServe返回ErrServerClosed，但它还可能继续等在途请求。两个“返回”不是同一时刻。

超时是给一次工作/等待设期限。ReadHeaderTimeout限制读取请求头的时间，ReadTimeout限制读取请求，WriteTimeout限制响应写出，IdleTimeout限制空闲连接。这些与业务查询的context期限不是同一层，也不能取代真实慢操作检查取消。

### 就地练习：两个返回时间不同

画出收到信号、停止监听、ListenAndServe返回、在途请求完成、Shutdown返回、main返回的顺序。

### 参考核对：两个返回时间不同

停止监听后Serve可能先返回；main应等Shutdown与自建任务完成，不能看到监听返回就退出。

## 先在独立目录观察一个完整服务

新建自己的独立练习目录，按 [第一节](#/learn/go/go-vscode) 初始化模块，Go 1.22或更新；将下面完整代码保存main.go。它不需要数据库、Docker或额外依赖。不要贴进已有工程的main.go末尾。

```go
package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"syscall"
	"os/signal"
	"time"
)

func slow(w http.ResponseWriter, r *http.Request) {
	// 这3秒代表一个可观察的限时工作；真正数据库操作也应传入r.Context。
	select {
	case <-time.After(3 * time.Second):
		fmt.Fprint(w, "finished")
	case <-r.Context().Done():
		log.Println("请求已取消，停止慢处理")
	}
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /slow", slow)
	srv := &http.Server{
		Addr: "127.0.0.1:8080", Handler: mux,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout: 10 * time.Second, WriteTimeout: 10 * time.Second,
		IdleTimeout: 60 * time.Second,
	}
	stopCtx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	serveErr := make(chan error, 1)
	go func() {
		serveErr <- srv.ListenAndServe() // 启动错误或正常关闭结果交给主函数。
	}()
	log.Println("打开 http://127.0.0.1:8080/slow；请求期间按 Ctrl+C")
	select {
	case err := <-serveErr: // 比如端口已占用，不能继续等待退出信号。
		log.Println("监听结束：", err)
		return
	case <-stopCtx.Done():
		log.Println("停止接新请求，等待在途请求")
	}

	// 独立的未取消根ctx：stopCtx已经取消，不能用它作为等待退出的父ctx。
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Println("等待超过期限，关闭剩余连接：", err)
		srv.Close() // 本示例明确的超时处置，不能假装所有工作都正常完成。
	}
	if err := <-serveErr; err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Println("监听错误：", err)
	}
	// 主函数走到这里，意味着已经等待Shutdown返回，才允许进程结束。
	log.Println("服务退出")
}
```

## 从信号到退出逐步读

1. signal.NotifyContext把Ctrl+C的中断通知转换成context取消；stop用于释放信号登记。它不直接替我们关服务器。
2. 新goroutine监听，serveErr用容量1保存结束结果，主函数能区分“端口启动失败”和“用户请求停止”。
3. select等两类事件。收到中断后才启动Shutdown。新的退出context来自Background，因为stopCtx已经取消，不能再拿它当父级等待。
4. Shutdown在主goroutine里阻塞等待，使main不会提前退出。5秒期限结束仍未完成时，明确记录失败并Close剩余连接；Close会中断连接，不是优雅完成。
5. 收到ListenAndServe结果后区分正常ErrServerClosed，最后记录退出。其他数据库/后台任务也应在合适顺序取消、等待、关闭，Shutdown不管理任意自建任务。

slow使用r.Context观察请求取消。客户端断开会使相应上下文取消；Shutdown本身并不自动取消全部活跃请求。**截止时间只限制Shutdown等多久，超时返回不意味着所有代码已经停止。**

### 就地练习：退出期限不能继承谁

stopCtx已经取消，若WithTimeout从它派生，Shutdown还会等5秒吗？应使用什么父级？

### 参考核对：退出期限不能继承谁

派生ctx会立即取消，无法提供等待预算；退出等待用独立未取消根ctx再设期限。

## 启动与三个可观察实验

在这个独立目录运行：

```sh
go run .
```

保持终端，浏览器打开 `http://127.0.0.1:8080/slow`，约3秒后正文finished。Windows也可在第二个终端用curl.exe，macOS/Linux用curl：

```sh
curl http://127.0.0.1:8080/slow
```

1. 正常请求：约3秒完成，这是本例故意设置的工作时长，不是性能承诺。
2. 在请求刚发出时回服务终端按Ctrl+C，预测先显示“停止接新请求”，等待当前请求完成后才“服务退出”；新请求不再被接收。只打印收到信号还没证明等待。
3. 将slow的3秒改10秒，仍保留Shutdown5秒。预期等待退出超过期限，日志说明超时并关闭连接，客户端不能把中断当正常finished。停止、还原，再运行。

另试在服务运行时关闭客户端请求，慢函数应观察到取消并停止。浏览器Network和服务日志分别展示客户端结果与服务器路径；不要把模拟测试当已监听。

## 对照完整项目

[交付工程](assets/downloads/web-followup-11.zip)还有数据库、会话与前端，启动条件按其README。阅读main.go时逐项检查：监听结束后主函数是否等待Shutdown？数据库是否等请求完成才Close？后台任务是否有取消与等待？这些是需要实际验收的行为，不能只看有Shutdown调用就认定实现正确。

### 参考答案

调用Shutdown只是开始等待；main退出前还要确认等待完成，数据库在请求之后释放。若查询不用r.Context，创建了超时Context也不能让该查询自动停止。

## 独立变式

本例同时登记 Ctrl+C 对应的 `os.Interrupt` 和容器/Linux 常用的 `syscall.SIGTERM`。信号只让通知上下文取消，主函数仍须等待 Shutdown 结束再释放资源。容器外部停止预算要大于程序内部等待预算；实际 Docker 停止另按容器课验证，不能用本机控制流测试代替。

增加一个后台任务，收到共享取消信号后清理并退出；主函数用WaitGroup等它结束，再释放资源。给任务设置明确的完成期限并记录故意不响应取消时的失败，不用Sleep猜全部完成。

参考：[Go Server.Shutdown](https://pkg.go.dev/net/http#Server.Shutdown)、[signal.NotifyContext](https://pkg.go.dev/os/signal#NotifyContext)。

## 停止监听并不等于任务全部结束

Shutdown开始后ListenAndServe很快返回ErrServerClosed，main仍须等待Shutdown完成，再关闭数据库等资源。已取消的信号Context不能作为等待优雅退出的父Context，否则等待可能立即取消；要创建独立有期限的退出Context。

后台任务不是HTTP Server自动管理的一部分，需要共享取消和明确等待。连接升级等特殊连接也有自己的关闭规则。超时后决定强制关闭还是报告未结束，日志保留真实结局，外部容器预算要大于内部预算。

### 参考答案：独立实现与验收

在主函数启动服务前新增后台任务，以下片段复用本节已有context、time、log导入，并增加sync：

```go
workerCtx, cancelWorker := context.WithCancel(context.Background())
var workers sync.WaitGroup
workers.Add(1)
go func() {
    defer workers.Done()
    <-workerCtx.Done()
    // 在这里执行有期限的本任务清理，而不是再启动无人等待的任务。
    log.Println("后台任务已清理")
}()
```

收到退出信号后先cancelWorker，执行原Shutdown，再等待后台任务（放在资源关闭之前）：

```go
done := make(chan struct{})
// 等待真正退出后关闭通知；主函数用select为这次等待设置上限。
go func() { workers.Wait(); close(done) }()
select {
case <-done:
    log.Println("后台任务全部退出")
case <-time.After(2 * time.Second):
    log.Println("后台退出超时，未确认清理完成")
}
```

正常应看到后台清理与全部退出；故意让任务不观察取消，只能得到超时，不能记录为正常完成。正式项目要按资源依赖安排取消、在途请求、后台清理和数据库关闭，不能原样把2秒当任何项目都适用的预算。

### 就地练习：HTTP以外的工作

一个后台worker仍用数据库，HTTP Shutdown已返回。能否立刻Close数据库？写出还需的退出步骤。

### 参考核对：HTTP以外的工作

需通知worker取消并等待其清理结束，再释放依赖；HTTP服务器不自动管理所有后台任务。
