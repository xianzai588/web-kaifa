# Go 连接 PostgreSQL 与参数绑定

让Go连接自己的练习库，把输入作为参数保存，再从数据库核对它。

## 从 psql 转到 Go，数据流没有消失

前两节psql直接执行SQL。现在客户端是Go程序：它接收HTTP请求后可向PostgreSQL发送SQL，再把结果变成响应。数据库端仍负责存储和约束。

`database/sql` 是标准库的通用数据库接口；**驱动是教Go怎样与某种数据库通信的实现**。本例使用pgx的标准接口适配包。`*sql.DB`名字像单连接，实际管理一组可复用连接，叫连接池；不要每个HTTP请求都重新Open整池。

`sql.Open`建立池对象，未必连接。**用 `PingContext` 实际验证可连接，Open没有报错不等于数据库已经可用。**

### 就地练习：池对象和真实连接

假设数据库服务已停止，Open返回nil错误能证明什么？下一步必须检查哪个调用？

### 参考核对：池对象和真实连接

只说明池对象配置准备成功；PingContext才尝试验证连接，还要处理后续查询时的错误。

## 先准备文件与环境

下载 [持久化API工程](assets/downloads/web-followup-09.zip)，解压并用VS Code打开followup-09。它已有go.mod/go.sum与pgx依赖，工具链需满足该go.mod的go行；运行 `go version`核对，按README准备依赖。不要在整个资料仓库初始化模块。

为了先只学数据库连接，在这个练习目录新建 `database-demo.go`，保存下方完整代码。它是独立演示入口，运行时**只选这个文件**，不与已有main.go一起运行。先保留上一节创建的practice_problems表；完整API使用events等另一组表，稍后才迁移它们。

在当前PowerShell终端设置自己的库/用户名，密码按自己的练习配置替换：

```powershell
$env:DATABASE_URL='postgres://club_learner@127.0.0.1:5432/club_practice?sslmode=disable'
$env:PGPASSWORD='替换为自己的练习密码'
go mod download
```

macOS/Linux终端用export设置这两个变量。环境变量是启动程序时提供的配置，Go不自动读取.env。URL的协议postgres、账户、主机、5432端口与库名各指定一个连接目标；sslmode=disable只适合本机受控练习。连接串和密码不能贴进日志、Git或AI问题。

## 完整连接与写入程序

```go
package main

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib" // 只执行驱动登记，后面用 database/sql 操作它。
)

func main() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		fmt.Println("请设置自己的练习库 DATABASE_URL，未执行SQL")
		return
	}
	db, err := sql.Open("pgx", dsn) // 创建连接池对象，尚不保证连得上数据库。
	if err != nil {
		fmt.Println("连接配置无法解析")
		return
	}
	defer db.Close()
	// context给这组操作一个5秒期限，避免一直等待；cancel释放计时资源。
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		fmt.Println("数据库连接失败，请核对服务、账户和库名")
		return
	}
	var id int64
	// SQL结构固定，标题以独立值传入；单引号只是普通数据，不是SQL语法。
	err = db.QueryRowContext(ctx,
		"INSERT INTO practice_problems(title) VALUES ($1) RETURNING id",
		"Alice's Go practice",
	).Scan(&id) // Scan把返回列写入id，同时报告查询或读取错误。
	if err != nil {
		fmt.Println("写入失败，请核对practice_problems表与权限")
		return
	}
	fmt.Println("已保存，id：", id) // id以数据库实际生成为准。
}
```

```sh
go run database-demo.go
```

成功输出“已保存，id：实际编号”，编号不是固定1。随后用psql连接相同库执行：

```sql
SELECT id, title, solved FROM practice_problems
WHERE title = 'Alice''s Go practice' ORDER BY id;
```

SQL文字里的单引号用两个单引号表示；Go参数里的标题不需要手工SQL转义。每次运行演示都会新增一行，不会自动清理已保存记录。

## 逐步读新对象和方法

1. 下划线导入只运行包的初始化，以便登记名为pgx的驱动；不是忽略任意编译错误。
2. db管理连接，defer Close在main正常结束时归还资源。
3. context是传递工作期限/取消信号的对象；WithTimeout返回ctx与cancel函数，5秒期限用于本组连接和查询。defer cancel释放资源，完整取消机制见 [context](#/learn/go/go-context)。
4. `QueryRowContext`执行预期返回一行的SQL，`Scan(&id)`将第一列写入id。查询失败、没有行或类型不匹配也由Scan报告。
5. `$1`是参数位置，后面的标题对应它。**SQL结构固定，用户输入作为值单独传给驱动，不能用fmt.Sprintf拼入SQL。**

### 就地练习：标题包含引号

将输入标题设为中文 O'Reilly，保持SQL固定为$1参数。说明标题为什么不能拼到SQL中。

### 参考核对：标题包含引号

驱动把它作为一个值传入，引号不会改变语句结构；拼接会混合数据与SQL语法。

## 失败实验与完整 API

先预测，将DATABASE_URL的端口改为一个确认没有数据库服务的端口，运行应报连接失败而不打印完整配置；恢复后执行。再将练习表名故意改错，应通过连接、失败于写入，不输出成功id。恢复后再次验证保存的文字。

完成演示后，把database-demo.go移到自己的独立笔记/演示模块，避免完整工程里出现两个main函数。按followup-09的README对空专用API库依次执行001/002迁移，再运行已有工程。main.go负责连接；repository.go的SQLStore处理实际events表；db_test.go检查真实库。

### 参考答案

连接、SQL写入、API往返分别验证；数据库测试SKIP只说明未配置测试库。演示表与API的events表不同，重启持久化验收要针对同一真实API记录。

## 独立变式

给演示增加按新id查询title的QueryRowContext与Scan，检查标题精确一致。再用绑定参数保存包含中文和单引号的普通标题，证明它们仍是数据。

参考：[Go数据库连接](https://go.dev/doc/database/open-handle)、[Go查询单行](https://go.dev/doc/database/querying)、[pgx标准接口](https://pkg.go.dev/github.com/jackc/pgx/v5/stdlib)。

## 连接池不是一条永久连接

sql.DB管理连接池，Open通常先准备配置，PingContext才验证一次连接。限制最大连接数，数据库总容量要考虑应用实例数；查询需传context，Rows遍历结束检查Err并及时Close。

QueryRowContext的查询错误通常延迟到Scan返回；无记录是sql.ErrNoRows，不是一个成功的空标题。绑定参数按驱动规则写$1等，不能用fmt.Sprintf拼用户值。事务内全部操作都应走tx，别混回db绕开事务。

### 参考答案：独立实现与验收

在本节database-demo.go成功INSERT并取得id后、main返回前加入下列片段。db、ctx、id使用原演示已有变量，增加fmt导入仅在原文件尚未有它时：

```go
var gotTitle string
// $1只绑定值；查询执行错误、无行与列类型错误都要在Scan这里检查。
err = db.QueryRowContext(ctx, "SELECT title FROM practice_problems WHERE id=$1", id).Scan(&gotTitle)
if err != nil {
    fmt.Println("按id读取失败：", err)
    return
}
fmt.Println(gotTitle)
```

practice_problems与本节INSERT目标一致，不改成API的events。将绑定输入设为 `中文 O'Reilly`，应精确读回这段文字，单引号不改变SQL结构。无匹配行时Scan返回sql.ErrNoRows，应按失败/不存在合同处理。连接串和真实数据不进入提交。

### 就地练习：没有行在哪报告

查询一个确认不存在的练习id，预测QueryRowContext后Scan返回的错误类别。能否把空title当成功？

### 参考核对：没有行在哪报告

Scan返回sql.ErrNoRows；应按不存在处理，不以空标题冒充成功。池对象也不应每请求重新创建。
