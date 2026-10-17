# 超时、退出、Docker 与 CI：让别人也能运行程序

“本机 go run 成功”只是交付起点。别人还需要知道 Go 版本、工作目录、端口、配置、验证命令和停止方式。服务器等待输入并不是卡死；它在监听请求。真正要处理的是请求长时间不结束、进程停止时工作中断，以及容器里程序明明启动却访问不到。

## 1. 服务超时与优雅退出

HTTP Server 可以设置 ReadHeaderTimeout、WriteTimeout、IdleTimeout，分别限制特定阶段，不能把一个超时理解成覆盖所有业务等待。数据库和外部请求仍需要 context 和各自限制。太短超时会误伤合法慢请求，应根据用途选择，而不是只看数值越小越安全。

优雅退出先收到 SIGINT/SIGTERM，再停止接受新连接，给已进行请求有限等待时间，关闭资源，检查错误。`Shutdown` 不会自动管理所有自己启动的后台 goroutine、劫持连接或其他资源；你要设计它们的取消与等待。`ListenAndServe` 在正常 Shutdown 后返回 `http.ErrServerClosed`，不是崩溃。超时到期可采用明确的强制关闭策略，并记录未完成情况。

### 就地练习：等待的父Context

收到信号后，Shutdown等待为什么不能用已经取消的ctx派生？后台任务由谁收尾？

### 参考核对：等待的父Context

已取消父ctx会使等待立即取消；独立期限等退出，后台任务由应用取消并等待。

## 2. VS Code 完整程序与验证

打开 `exercises/go/go-delivery`，建立模块 `go mod init example.com/learn/go-delivery`，保存 main.go。默认 `go run .` 只检查配置并输出说明；`go run . serve` 才启动服务器。此例标准库、无账号和数据库。

```go
package main

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"
)

func main() {
	port := "8080"
	// 变量存在但为空也是明确配置，后面的Atoi会拒绝；仅缺失时用8080。
	if raw, provided := os.LookupEnv("PORT"); provided { port = raw }
	n, err := strconv.Atoi(port)
	if err != nil || n < 1 || n > 65535 { fmt.Fprintln(os.Stderr, "PORT 需为 1–65535"); os.Exit(1) }
	if len(os.Args) < 2 || os.Args[1] != "serve" {
		fmt.Println("配置有效：端口", port)
		fmt.Println("启动：go run . serve；验收：GET /health")
		return
	}
	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/health" { http.NotFound(w, r); return }
		if r.Method != http.MethodGet { w.WriteHeader(http.StatusMethodNotAllowed); return }
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintln(w, `{"status":"ok"}`)
	})
	server := &http.Server{
		Addr: ":" + port, Handler: mux,
		ReadHeaderTimeout: 5*time.Second,
		WriteTimeout: 10*time.Second,
		IdleTimeout: 30*time.Second,
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	finished := make(chan error, 1)
	go func() { finished <- server.ListenAndServe() }()
	fmt.Println("服务已请求启动，监听端口", port)
	select {
	case err := <-finished:
		if err != nil && !errors.Is(err, http.ErrServerClosed) { fmt.Fprintln(os.Stderr, err); os.Exit(1) }
	case <-ctx.Done():
		// 信号ctx已取消，退出等待必须使用独立父级，才能真正留出5秒预算。
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := server.Shutdown(shutdownCtx); err != nil {
			fmt.Fprintln(os.Stderr, "优雅退出超时：", err)
			_ = server.Close()
		}
		if err := <-finished; err != nil && !errors.Is(err, http.ErrServerClosed) { fmt.Fprintln(os.Stderr, err) }
		fmt.Println("服务已停止")
	}
}
```

默认精确输出：

```output
配置有效：端口 8080
启动：go run . serve；验收：GET /health
```

`go run . serve` 后另开终端：`curl.exe -i http://127.0.0.1:8080/health`，应看到200和 `{"status":"ok"}`。按 Ctrl+C，应输出“服务已停止”。源码监听所有网络接口以便容器访问；在本机学习应确认防火墙和使用范围，下面 Compose 仅将主机127.0.0.1映射出来。启动日志先于真正监听结果，仍需以 curl 验收；端口占用会输出真实错误。

## 3. Dockerfile：构建环境与运行环境分开

需要安装 Docker 且 daemon 已启动；`docker version` 必须看到客户端和服务端，只有命令存在还不够。Dockerfile 是镜像构建说明，不是 Go 源码。在上述**独立项目目录**新建 Dockerfile：

```dockerfile
# 学习使用当前 Go 1 系列镜像；正式交付固定版本/摘要并与 go.mod 一致。
FROM golang:1-alpine AS build
WORKDIR /src
COPY go.mod ./
COPY main.go ./
RUN CGO_ENABLED=0 go build -o /out/server .

FROM alpine:3
RUN adduser -D -u 10001 app
USER app
COPY --from=build /out/server /server
EXPOSE 8080
ENTRYPOINT ["/server", "serve"]
```

第一阶段有 Go 编译器，第二阶段只带运行程序；这份标准库程序关闭 CGO 可静态构建。真实项目有依赖时还要 COPY go.sum、下载模块；有外部 HTTPS 请求时要确认运行镜像的 CA 证书；有时区需求时配置时区数据。不要把此最小文件照搬到所有程序后认为这些条件自动满足。EXPOSE 是声明，不自动公开端口。

### 就地练习：EXPOSE不发布端口

只有EXPOSE8080没有ports，能否直接从主机8754访问？镜像含哪些构建阶段内容？

### 参考核对：EXPOSE不发布端口

EXPOSE只是声明，需显式端口映射；多阶段最终只带运行所需文件，不自动含构建工具。


## 4. Compose：主机端口与容器端口

同目录新建 `compose.yaml`：

```yaml
services:
  api:
    build: .
    ports:
      - "127.0.0.1:8754:8080"
    environment:
      PORT: "8080"
    stop_grace_period: 10s
```

输入 `docker compose up --build`，另开终端访问 `http://127.0.0.1:8754/health`。8754 是主机入口，8080 是容器内监听端口；在主机浏览器访问容器里的 localhost 不会自动找到服务。服务停止用 `docker compose down`。这里只启动 API，没有 PostgreSQL、数据库卷、迁移和等待数据库就绪，不能称为完整全栈部署。镜像拉取需要联网；版本和摘要应在准备正式交付时固定。

### 有数据库项目的卷、服务名与启动条件

当前完整程序只有/health，不读数据库。以下是**后续有真实SQL存储项目的Compose片段**，不是声称当前程序已经连接PostgreSQL，也不要把这段直接替换前面的可运行服务后认为数据库验收完成：

```yaml
services:
  db:
    image: postgres:18
    environment:
      POSTGRES_DB: go_knowledge_practice
      POSTGRES_USER: learner
      POSTGRES_PASSWORD: "${POSTGRES_PASSWORD:?请在终端设置练习密码}"
    volumes:
      - pgdata:/var/lib/postgresql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U learner -d go_knowledge_practice"]
      interval: 5s
      timeout: 3s
      retries: 10
  api:
    build: .
    depends_on:
      db:
        condition: service_healthy
    environment:
      DB_HOST: db
      DB_PORT: "5432"
volumes:
  pgdata:
```

同一个Compose网络内，API通过服务名db和端口5432访问数据库；`localhost` 指API容器自身，不是db容器。DB_HOST/DB_PORT必须由**你的实际数据库项目**读取并与账户、密码、库名组成连接配置，当前示例main不会消费它们。命名卷pgdata保留数据库数据；普通`docker compose down`通常保留卷，`down -v`会删除卷和练习数据，不能在不理解时运行。PostgreSQL18镜像采用此挂载布局；使用其他大版本应核对官方镜像的数据目录，并固定版本，不能跨大版本直接复用数据目录冒充迁移。

healthcheck表示数据库正在接受连接，`service_healthy`让API在该条件后启动；不证明所需表、索引或迁移已经完成。项目还需版本化迁移步骤，例如在已连接测试库先执行可追踪的建表迁移，再启动API；失败时停止并提供日志，不在每个请求里随意建表。更换schema时要考虑旧数据和回滚策略。验证应真实创建一条记录、重启API与数据库后读取仍在，再验证失败事务回滚；当前健康响应不能代替这些证据。密码从本机环境/受控秘密配置提供，不提交真实值。

### 就地练习：两个端口两处地址

主机映射改8755而容器仍8080，浏览器与容器服务各使用哪个端口？

### 参考核对：两个端口两处地址

浏览器8755，进程内部8080；容器localhost是自己，连接数据库用相应服务名。

## 5. CI：重复检查，不是自动上线

CI 在干净机器上拉取仓库、配置 Go、运行检查，帮助发现“依赖我本机缓存才成功”。下面是放在仓库 `.github/workflows/go-delivery-check.yml` 的**工作流示例**，仅检查这个独立模块，实际上传仓库后才会触发；复制文字本身不算 Actions 已通过。

```yaml
name: Check Go delivery exercise
on: [push, pull_request]
permissions:
  contents: read
jobs:
  test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: exercises/go/go-delivery
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-go@v7
        with:
          go-version-file: exercises/go/go-delivery/go.mod
          cache: false
      - run: go test ./...
      - run: go vet ./...
      - run: go build .
```

没有 `_test.go` 时 go test 可以成功但只表示编译测试准备通过，仍需为 /health、配置失败和退出写有实际断言的测试。真实数据库集成测试还需要显式准备测试数据库。CI 绿灯也不证明线上网络、TLS、权限与备份验收完成。

### Git tag 与 Release：给已验证版本一个名字

提交是某次源码快照，tag为某个提交标一个版本名；Release通常围绕tag描述变化、限制和可下载产物。版本标签不是代码质量保证，应该指向检查过的提交。下面是**发布操作示例**，先在自己的项目确认工作区、测试与提交，只有明确准备发布时再执行推送；此讲义不会自动操作仓库：

```powershell
git status
git log -1 --oneline
go test ./...
go vet ./...
git tag -a v0.1.0 -m "第一版可演示的学习API"
```

随后在准备好远程发布时推送该准确tag，并创建对应Release，说明启动命令、平台、Go版本、端口、变更、测试证据和限制。源码tag可以复现对应提交，浮动镜像或依赖仍可能随时间变化，所以正式构建还需锁定依赖、镜像版本/摘要与构建环境。不要把原教材、node_modules、数据库目录、编译产物或密码一股脑提交。

安全改版例子：v0.1.0中的详情接口只按id查询，修复为“id+可信ownerID”，补A/B隔离测试并保存结果，再用新版本v0.1.1描述“修复跨用户读取，登录调用方式不变”。不要改写已发版本标签让它悄悄指向新代码；新版本与清楚变更记录更容易审查和恢复。发布产物涉及外部写入，学习者应依据自己的当前发布意图执行，不把教材命令当作自动授权。

### 就地练习：有YAML不等于执行

工作流文件存在而未触发，go test又显示no test files，能否称CI业务通过？

### 参考核对：有YAML不等于执行

不能；需相同提交远程日志和实际断言。没有测试文件不证明HTTP、退出或数据库验收。

## 改一个条件

把 Compose 主机端口改成8755，容器内仍8080，应该访问哪个地址？本机设置 PORT=bad 再运行应发生什么？删除容器的 `ports` 但保留 EXPOSE，浏览器还能直接用8754访问吗？

### 参考答案

地址改为 `http://127.0.0.1:8755/health`。非法端口应在启动前失败且退出码非零，不悄悄退回默认。仅 EXPOSE 不建立主机映射，访问8754不能据此成功。每次改配置保存后重新创建/启动，旧运行实例不会自动读新值。

自查：README 是否写清源码目录、启动与停止命令、端口、配置、实际验证结果和未覆盖部分？能区分程序编译、容器构建、真实启动、CI 检查、上线五类证据吗？本节不自动安装 Docker 或创建远程工作流，未运行的环节应如实记为待验证。

官方参考：[http.Server](https://pkg.go.dev/net/http#Server)、[signal](https://pkg.go.dev/os/signal)、[Docker Go 指南](https://docs.docker.com/guides/golang/)、[Compose 服务](https://docs.docker.com/reference/compose-file/services/)、[PostgreSQL官方镜像](https://hub.docker.com/_/postgres)、[setup-go](https://github.com/actions/setup-go)、[Git标签](https://git-scm.com/book/en/v2/Git-Basics-Tagging)、[GitHub Release](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)。
