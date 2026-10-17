# 职责、配置与稳定分页：让程序容易定位和修改

一个 API 如果同时在 Handler 里解析参数、拼 SQL、决定权限、格式化日志，很快会变成难以测试的大函数。分层的目的，是让每个变化有可解释的位置，而不是让初学项目先出现很多空文件夹。下面先用一个内存列表观察职责与分页，再说明怎样连接真实项目。

## 1. 谁处理哪类问题

HTTP 层把请求文字转换成参数，把错误映射为状态码；业务层处理“什么输入有效”“允许做什么”；存储层执行读取和写入。业务函数不需要知道 ResponseWriter，存储层不应直接向浏览器写 400。这样单独测试业务时不用启动 HTTP，换数据库时不需要重写路由。

小接口由使用方定义，例如 `List(ctx, limit, offset)` 是业务需要的读取能力。通过构造函数传入实现，比在各文件中访问全局 db 更易控制。fake 能检查业务交互，但仍不能证明 SQL 正确。简单函数还没有复杂依赖时，普通参数足够，不必为每个值引入接口与框架。

### 就地练习：一项职责一处

将SQL参数绑定、HTTP状态、创建标题规则分别放到存储、Handler、Service。

### 参考核对：一项职责一处

存储负责SQL，Handler映射协议，Service处理业务；测试替身仍调用真实业务。

## 2. 配置在启动时验证，秘密不要进入日志

端口、数据库地址等由配置提供。启动时发现必需值为空就明确停止，避免服务启动后某个请求才崩溃。示例只读取 `PAGE_LIMIT` 并设默认 2，不要求真实凭据。数据库密码、令牌与完整连接串不应该提交或打印；日志可记录请求 id、操作、状态与已脱敏原因。日志是排错证据，不是把所有请求 body 无限制复制到文件。

区分默认值与非法值：未配置可以选默认，明确配置为 `abc` 应报错，而不是悄悄变成默认。进程通常继承启动时父进程的环境；`os.Getenv` 在调用时读取当前进程的环境，本例在启动阶段读取一次配置。修改父终端环境后，需要重新启动本例才能继承新值。代码中的配置文件路径也应相对明确的工作目录，不能依赖每台机器恰好从同一目录启动。

### 一个小接口的注入片段

以下是**概念片段**，不是另一份 main.go；需要在同一包已有 Problem 类型时导入 context、strings、fmt。接口只要求本业务实际使用的 Save，创建 Service 时传入存储实现：

```go
type Store interface { Save(context.Context, Problem) error }
type Service struct { store Store }
func NewService(store Store) *Service { return &Service{store: store} }
func (s *Service) Create(ctx context.Context, p Problem) error {
	p.Title = strings.TrimSpace(p.Title)
	if p.Title == "" { return fmt.Errorf("标题不能为空") }
	return s.store.Save(ctx, p)
}
```

请求数据流为 HTTP解析→Service.Create校验→Store.Save存储→HTTP映射结果。测试可提供 fake Store 记录是否被调用：空标题不应调用Save，合法标题应调用一次。fake 需要自己满足Save方法；真实SQL实现也满足同一接口，但它的查询仍要单独集成验证。构造时必须传入有效实现，nil依赖应在实际初始化策略中拒绝。

日志也应有可比较的字段。Go 1.21+ 可用标准库 slog，下面是**日志片段**，需导入 `log/slog`：`slog.Info("创建记录", "request_id", "req-1", "user_id", 10, "status", 201)`。输出带操作与字段，便于按请求定位；具体时间和文本格式取决于 Handler，不作为精确stdout契约。不添加password、token或完整DATABASE_URL字段。

### 就地练习：缺省和错误

PAGE_LIMIT未提供、明确abc、明确空值分别应如何处理，写出自己的合同。

### 参考核对：缺省和错误

未提供可默认；明确非法应拒绝。本轮改用LookupEnv区分空值和缺失，不悄悄掩盖配置错误。

## 3. 分页必须限定范围并固定顺序

limit 表示每页数量，offset 表示跳过数量。先限制 limit，例如 1–100；拒绝负 offset。页码若从 1 开始，offset 通常为 `(page-1)*limit`，计算也要防止极端整数溢出。不存在的后续页通常返回空列表，不等同于“缺少单条资源”的404。

排序要包含唯一的打破并列字段。按创建时间降序时，再按 id 降序；否则同一时间的记录在两次查询中可能交换。PostgreSQL 实际查询片段是 `ORDER BY created_at DESC, id DESC LIMIT $1 OFFSET $2`，列名应来自固定规则。稳定排序无法避免 offset 分页在新增/删除下跳动；需要更稳定翻页时可采用基于最后一条 `(created_at,id)` 的游标，并定义一致性语义。

### 就地练习：并列也固定顺序

同Created有id2、3，降序按Created再id时谁先？offset越过末尾是否404？

### 参考核对：并列也固定顺序

id3先；合法空页可空列表，非法参数另拒绝。动态插删仍可能使偏移页跳动。

## 在 VS Code 运行：main.go 完整程序

打开 `exercises/go/go-design`，保存下面 main.go。首次执行 `go mod init example.com/learn/go-design`，再 `go fmt ./...`、`go run .`。它验证配置解析和纯逻辑分页，不连接数据库，不是已实现存储层。

```go
package main

import (
	"fmt"
	"os"
	"sort"
	"strconv"
)

type Problem struct { ID int; Created int; Title string }

func page(items []Problem, limit, offset int) ([]Problem, error) {
	if limit < 1 || limit > 100 || offset < 0 { return nil, fmt.Errorf("分页参数非法") }
	// 先复制元素再排序，避免分页调用改变调用者的原始顺序。
	copyItems := append([]Problem(nil), items...)
	sort.Slice(copyItems, func(i, j int) bool {
		if copyItems[i].Created != copyItems[j].Created { return copyItems[i].Created > copyItems[j].Created }
		return copyItems[i].ID > copyItems[j].ID
	})
	if offset >= len(copyItems) { return []Problem{}, nil }
	end := offset + limit
	if end < offset || end > len(copyItems) { end = len(copyItems) }
	return copyItems[offset:end], nil
}

func main() {
	limit := 2
	// 只在未提供时默认；明确的空字符串也应进入解析并拒绝。
	if raw, provided := os.LookupEnv("PAGE_LIMIT"); provided {
		n, err := strconv.Atoi(raw)
		if err != nil || n < 1 || n > 100 { fmt.Println("配置错误：PAGE_LIMIT 需为 1–100"); return }
		limit = n
	}
	items := []Problem{{1, 10, "旧记录"}, {2, 20, "新记录A"}, {3, 20, "新记录B"}}
	first, err := page(items, limit, 0)
	if err != nil { fmt.Println(err); return }
	fmt.Println("第一页：", first)
	empty, _ := page(items, limit, 99)
	fmt.Println("超出末页：", len(empty))
	_, err = page(items, 0, 0)
	fmt.Println("拒绝非法 limit：", err != nil)
}
```

不设置 PAGE_LIMIT 时预期：

```output
第一页： [{3 20 新记录B} {2 20 新记录A}]
超出末页： 0
拒绝非法 limit： true
```

## 修改实验

1. 将PAGE_LIMIT设置为1，第一页会是哪条记录？
2. 设置为abc，应该安静使用默认值还是报配置错误？
3. 删除并列时按id的排序规则，是否还能保证契约顺序？

### 参考答案

Windows 终端设 `$env:PAGE_LIMIT='1'` 后再 `go run .`，第一页只剩 id3；macOS/Linux 用 `PAGE_LIMIT=1 go run .`。设 `abc` 应报配置错误。Windows 用 `Remove-Item Env:PAGE_LIMIT` 恢复默认，macOS/Linux 若先 export 可用 `unset PAGE_LIMIT`。去掉 id 的第二排序规则，无法再保证并列时的契约，不能以一次输出仍一样就说代码正确。

自查：输入错误在哪里被转换为 HTTP 状态？数据库连接在哪里建立？切换配置是否重新启动？每页顺序与并列规则写明了吗？把分页改成只返回 Title 的输出模型，检查没有为了输出而直接暴露内部字段。此例只是职责和纯逻辑排序起点，没有游标签名、真实 SQL、日志系统和完整依赖注入。

官方参考：[Go 配置读取](https://pkg.go.dev/os#LookupEnv)、[sort.Slice](https://pkg.go.dev/sort#Slice)、[database/sql](https://pkg.go.dev/database/sql)、[PostgreSQL ORDER BY](https://www.postgresql.org/docs/current/queries-order.html)。
