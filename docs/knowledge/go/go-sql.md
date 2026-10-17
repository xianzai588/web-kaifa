# SQL、参数绑定与事务：真实数据库怎样保护数据

内存 map 的数据重启就消失。关系数据库把数据按表保存，使用约束维护有效性，使用查询读取相关记录，使用事务避免一半写成功、一半失败。这里把“可马上运行的标题校验”和“需要 PostgreSQL 的真实事务实验”分开，逻辑练习通过不能证明数据库已安装、查询正确或持久化成功。

## 零基础先完成环境：服务器、客户端、账户与数据库

**PostgreSQL 服务器**是实际保存数据、执行 SQL 的后台程序；**psql** 是向它发送 SQL 的终端客户端；**pgAdmin** 是图形客户端；**Go 驱动**让 Go 程序也能连接同一服务器。安装一个 VS Code 插件，不等于安装了数据库服务器。关闭 psql 窗口只是退出客户端，通常不会停止服务器。

先在自己的电脑建立专用练习库。下面的 Windows 路线包含下载、连接、建库、执行文件和排错；macOS/Linux 先按对应官方安装分支启动服务，再从“创建练习账户与库”继续。没有完成真实数据库连接时，可以先读概念和运行后面的纯逻辑例子，但不能把数据库任务记成已验收。

### Windows：下载、安装并记住四项配置

从 [PostgreSQL Windows 官方入口](https://www.postgresql.org/download/windows/) 进入页面指定的 EDB 安装器下载链接，选择当前受支持的稳定版本与匹配的 Windows 平台；不用 beta/rc 或源码压缩包。已有服务时先核对版本、端口与用途，使用现有专用练习库或另建库，不重复覆盖安装。安装器界面细节以 [EDB 安装说明](https://www.enterprisedb.com/docs/supported-open-source/postgresql/installing/windows/) 为准。

1. 双击安装器，按系统提示授权安装。组件至少保留 **PostgreSQL Server** 与 **Command Line Tools**；想用图形界面可以保留 pgAdmin。Stack Builder 提供额外工具，这份 Go 标准库与 pgx 练习不要求通过它安装更多组件。
2. 核对安装目录与数据目录。安装目录放程序，数据目录放数据库文件，它们不是你写 `main.go` 的目录。记录实际安装位置，不移动或清理数据目录来排错。
3. 为管理员账户 `postgres` 设置自己保存的密码。它是数据库密码，不是 Windows、GitHub 或网站登录密码；后面登录客户端会用到。不要在学习笔记写真实密码。
4. 记录端口；本例使用默认 `5432`，不是 Go API 的 `8080`。已有服务占用它时先判断是不是现有 PostgreSQL；若选择其他端口，后续所有连接参数都要同步。
5. 完成向导。若结束时询问启动 Stack Builder，本练习可跳过。确认 PostgreSQL 服务已启动；Windows 开始菜单搜索“服务”，找到实际安装的 PostgreSQL 服务查看状态。学校或单位电脑无安装权限时带具体提示找管理员，不靠关闭安全设置消除错误。

现在先验证**能连接**，而不是只看安装完成。在开始菜单搜索 **SQL Shell (psql)**，打开。依次回答提示，每项按一次 Enter：

| 提示 | 本机新安装示例填什么 | 意义 |
| --- | --- | --- |
| Server | `127.0.0.1` | 当前这台电脑 |
| Database | `postgres` | 先连接默认管理数据库 |
| Port | `5432` 或实际安装端口 | 数据库服务器监听入口 |
| Username | `postgres` | 安装时的管理员账户 |
| Password | 安装时自己设置的密码 | 输入可能不回显，输入完按 Enter |

连接成功应出现带数据库名的提示符，例如 `postgres=#`。在这个窗口输入下面的 **psql 命令**，它不属于 PowerShell 或 Go 源码：

```psql
\conninfo
```

应能核对连接库 `postgres`、用户 `postgres`、主机与端口。客户端能连上才证明服务器正在响应。`psql --version` 只证明客户端工具存在，不能单独证明数据库运行正常。

### macOS / Linux：按系统分支安装，确认服务再继续

macOS 选择 [官方 macOS 下载分支](https://www.postgresql.org/download/macosx/) 中适合自己平台的发行方式；Linux 从 [官方 Linux 分支](https://www.postgresql.org/download/linux/) 进入自己的发行版页面，按该发行版的包与服务启动说明完成。不要混用 Ubuntu、Fedora 和 macOS 的安装命令，也不用照抄 Windows 安装路径。

不同发行方式可能采用不同的服务名、默认管理员登录方式、端口与数据目录，因此这里不把一条启动命令假装成全平台通用。记录发行方式、服务器版本、实际端口；先通过其管理员方式进入 psql，并用 `\conninfo` 确认当前库与身份。某些 Linux 包使用本机操作系统 postgres 账户进行管理连接，不能因为它没有询问安装器密码就判定安装失败。后面仍为练习账户设置独立密码，使用明确的 TCP 参数连接。

### 创建练习账户与两个用途明确的库

以下在刚才已经连接的**管理员 psql** 内逐条执行。SQL 通常以分号 `;` 结束；反斜杠开头是 psql 自己的命令，一般不加分号。提示符不要复制进命令。

```sql
CREATE ROLE learner LOGIN;
```

预期显示 `CREATE ROLE`。`learner` 是这台数据库服务器中的练习账户，`LOGIN` 允许它登录；本例没有给它超级用户权限。然后设置该账户密码：

```psql
\password learner
```

按提示输入并确认自己的练习密码，不把真实值拼进截图里的 SQL。它与管理员 postgres 密码是两套账户密码。继续创建两个独立的库，每条分开执行：

```sql
CREATE DATABASE problems_dev OWNER learner;
CREATE DATABASE go_knowledge_practice OWNER learner;
```

应各得到 `CREATE DATABASE`。`problems_dev` 用于课程的长期 problems 表；`go_knowledge_practice` 用于后面的临时表与事务实验。OWNER 指定数据库拥有者，使 learner 能在自己的练习库中创建表。账户名、数据库名与表名是不同层级，不要因为都叫“名字”就随意混填。[账户说明](https://www.postgresql.org/docs/current/sql-createrole.html) · [建库说明](https://www.postgresql.org/docs/current/sql-createdatabase.html)

若提示账户或库已存在，先核对它是否确属自己的本次练习；不要照着删库、重建来消除提示。重复运行 CREATE 不是恢复连接所必需的操作。确认已有练习账户时，可以按自己的权限使用 `\password learner` 调整该账户密码；不要改不属于自己的账户。

使用练习身份重新连接课程库：

```psql
\connect problems_dev learner 127.0.0.1 5432
```

端口不是5432时替换为实际值。输入 learner 密码后，用 `\conninfo` 再核对；失败时可能仍停留在旧连接，不能继续盲目建表。接着执行：

```sql
SELECT current_database(), current_user;
SELECT 2 + 3 AS sum;
```

第一条应对应 `problems_dev`、`learner`；第二条应显示列名 sum、结果5。SQL 由数据库执行，结果在 psql 内显示，不是 Go 程序或网页生成的。确认到这里再建业务表。

### 在 VS Code 保存 schema.sql，再让 psql 执行

在自己的独立练习目录新建 `schema.sql`，下面是**完整建表文件**。它不是 `main.go`，不能 `go run schema.sql`；VS Code 保存文件本身也不会创建数据库表。

```sql
CREATE TABLE IF NOT EXISTS problems (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title TEXT NOT NULL CHECK (length(trim(title)) > 0),
    platform TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
    solved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

保存后取得这个文件在你电脑上的实际完整路径。回到已确认连接 `problems_dev`、身份 learner 的 psql，先设置脚本出错即停，再执行文件。以下 `D:/code/go-sql-db/schema.sql` 是路径示意，**必须换成自己的路径**；在 psql 中使用 `/` 分隔符和单引号可避免 Windows 路径中的反斜杠被解释为转义：

```psql
\set ON_ERROR_STOP on
\i 'D:/code/go-sql-db/schema.sql'
\dt
```

应看到 `CREATE TABLE`，随后表列表包含 `problems`，拥有者是 learner。文件不存在就先核对文件是否已保存、是否误名 `schema.sql.txt`，以及复制的路径；不要为修复路径去修改数据库密码。`IF NOT EXISTS` 只在表已存在时跳过创建，不会自动给旧表增加或修改字段；修改表结构属于后面的迁移任务。

### 插入、查询、修改：每一步有结果

以下 SQL 直接在练习库的 psql 内执行。新库空表中，首次插入这一组得到10行；重复执行会新增重复标题，示例没有规定标题唯一，因此先查询当前数据再决定是否重新插入。

```sql
INSERT INTO problems (title, platform, difficulty)
VALUES
    ('Two Sum', 'LeetCode', 'easy'),
    ('练习02', 'local', 'easy'),
    ('练习03', 'local', 'medium'),
    ('练习04', 'local', 'hard'),
    ('练习05', 'local', 'easy'),
    ('练习06', 'local', 'medium'),
    ('练习07', 'local', 'hard'),
    ('练习08', 'local', 'easy'),
    ('练习09', 'local', 'medium'),
    ('练习10', 'local', 'hard');

SELECT COUNT(*) FROM problems;
SELECT id, title, solved FROM problems ORDER BY id LIMIT 3;
```

`INSERT` 中三个列名与每行三个值按顺序对应。未写 id 由数据库生成，未写 solved 用默认false，created_at用当前时间。新的空表首次插入后应显示 `INSERT 0 10`，COUNT 为10；查询前三条按id排序。不要把命令标签里的0误读为“插入失败”，判断插入行数看10。

先从 SELECT 看清目标id。在首次空表演示中 Two Sum 通常为id1；若你的实际id不同，下面**替换成查到的值**，不能假设序号永远从1开始：

```sql
UPDATE problems SET solved = TRUE WHERE id = 1;
SELECT id, title, solved FROM problems WHERE id = 1;
DELETE FROM problems WHERE id = 999;
```

存在的目标应显示 `UPDATE 1`，查询 solved 为true（psql常显示t）；不存在999时 `DELETE 0` 正常，表示没有删除匹配行。去掉 WHERE 会影响全表，所以每次更新、删除之前先用同样条件 SELECT 确认范围。另试把 difficulty 写成 `unknown` 或 title 写成空字符串，预期 CHECK 拒绝；这类失败不是“数据库没装好”。

输入 `\q` 退出 psql，再用同样连接信息重进并查询记录。客户端重开后数据仍在，随后按安装方式重启自己的数据库服务再查，才完成数据库重启的持久化检查。重启服务与删除数据目录是两件事，后者不是本节操作。

### 从 VS Code 终端连接，以及 Go 的连接信息

已经安装命令行工具但 `psql` 不在 PATH 时，可以继续用开始菜单 SQL Shell；也可以在 VS Code PowerShell 用实际完整程序路径。默认安装示意如下，**把18换成自己的版本目录**：

```powershell
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' --version
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h 127.0.0.1 -p 5432 -U learner -d problems_dev -W
```

`&` 在这里让 PowerShell 执行带空格路径中的程序；`-h` 主机、`-p` 端口、`-U` 用户、`-d` 库名、`-W` 提示密码。如果已配置 PATH，命令可简写为 `psql -h ...`。不要覆盖整条 PATH；改了 PATH 要新建终端再检查。macOS/Linux 的工具在 PATH 中时，使用同样的 psql 参数，不使用 Windows 的 exe 路径。[psql 参数与脚本](https://www.postgresql.org/docs/current/app-psql.html)

Go 需要同样的连接事实。后面的临时表程序使用 `go_knowledge_practice`，课程项目用 `problems_dev`。先选对库，再设置环境变量；**下面是待替换格式，不含可用密码**：

```powershell
$env:DATABASE_URL = 'postgres://learner:替换为自己的已编码密码@127.0.0.1:5432/go_knowledge_practice?sslmode=disable'
```

macOS/Linux 用 `export DATABASE_URL='...'`，连接格式相同。密码中有 `@`、`:`、`/` 等 URL 特殊字符时要对密码部分做百分号编码；否则客户端可能把密码的一部分误当主机或路径。这个值是本机环境配置，不写进 main.go、README、仓库或 AI 提问。`sslmode=disable` 只用于你确认的本机隔离练习；远程数据库按提供方要求设置TLS。[连接参数](https://www.postgresql.org/docs/current/libpq-connect.html)

### 常见错误：定位到工具、服务、账户还是表

| 报错或现象 | 先核对什么 |
| --- | --- |
| `psql` 不是命令 | 客户端路径；用 SQL Shell 或实际完整 exe 路径，不因此重装数据库 |
| connection refused / 无法连接 | 服务状态、主机和实际端口；Go 的8080不是数据库5432 |
| password authentication failed | 用户名与该账户密码；learner和postgres是不同账户，不关闭认证来排错 |
| role does not exist / database does not exist | 管理员是否已成功创建所需名字，是否连接了另一套服务器 |
| permission denied for schema/table | 当前是谁、表由谁建立；本流程让learner拥有自己的库并以learner建表，不用超级用户当所有请求账户 |
| relation `problems` does not exist | 当前库是否problems_dev，schema.sql是否在这同一个库成功执行 |
| 提示符变成 `problems_dev->` | 一条SQL尚未结束，通常漏了分号；不确定时Ctrl+C清掉当前未发送语句，再完整重输 |
| invalid byte sequence / 中文显示异常 | 文件保存为UTF-8，核对客户端编码；保留原报错与编码信息，不靠删中文记录来“修复” |
| 建表成功但查询是0行 | CREATE TABLE只创建结构，INSERT是否执行、是否报错、是否连到正确的库 |

把问题交给 AI 时给服务器/客户端版本、系统、脱敏连接字段（主机、端口、库名、用户）、SQL、完整错误和你已经验证的步骤。省略密码与完整连接串。明确请AI先判断失败发生在哪一层，一次只给一个可以验证的修复。

### 就地练习：先确认连接对象

对比psql --version与SELECT current_database(),current_user()各证明哪层。

### 参考核对：先确认连接对象

前者客户端存在；连接后查询确认服务器响应和当前库/身份，执行写入前先核对专用库。

## 1. 表、行、列和约束分别是什么

表描述一种数据，行是一条记录，列是字段。主键唯一标识一行；`NOT NULL` 禁止 SQL NULL，却不禁止空字符串；`CHECK` 可以约束约定字符处理后的长度；`UNIQUE` 禁止约定范围内重复；外键要求引用存在的记录。应用校验提供友好错误，数据库约束保护所有写入入口，二者可以同时存在。下例 PostgreSQL 的 `trim(title)` 默认只去普通空格，不等于 Go `strings.TrimSpace` 的 Unicode 空白规则；tab、换行或不换行空格未被本 CHECK 一概拒绝。真实项目应先决定标题归一化规则，再明确数据库约束保护的范围。

唯一规则要先决定业务含义：全部用户题目标题都唯一，还是同一用户内唯一？后面事务实验的临时表 `practice_problems` 为简化采用全表标题唯一，不是推荐所有真实产品如此设计；上面课程表 `problems` 没有标题 UNIQUE，重复标题不会因此被拒绝。两张表的契约不同，不能混用验收预期。NULL、空字符串和零不是同一状态。新增字段时也要考虑旧数据能否满足约束，不要直接对生产表试验。

### 就地练习：默认与约束

省略solved、明确NULL、空白title分别由什么规则处理？

### 参考核对：默认与约束

省略用默认；NULL受NOT NULL，空白受CHECK。约束与HTTP反馈需分别验证。

## 2. 参数绑定：结构写死，值单独传

错误写法是把用户输入拼进 SQL，如 `"... WHERE title='" + title + "'"`。单引号和特殊内容可能改变 SQL 结构。PostgreSQL 常用 `$1`、`$2`，值作为单独参数传给 Query/Exec；驱动负责按值处理，因此 `Alice's note` 也可正常保存。MySQL 的 `?` 不可以机械搬进 PostgreSQL 例子。

参数只能绑定值，不能自动安全地代表表名、列名、排序方向。允许动态排序时，用白名单将用户选择映射为固定 SQL 片段。不要对普通值自己做“把单引号替换两次”的过滤代替参数化。`QueryRowContext(...).Scan(...)` 才取到实际结果，`sql.ErrNoRows` 与连接失败应分别处理。

### 就地练习：值单独绑定

输入标题含单引号，写SQL结构与参数两部分；表名能否用普通值占位符替换？

### 参考核对：值单独绑定

固定SQL用$1传标题值；标识符/结构需允许列表选择，不能当普通值绑定。

## 3. 连接池、取消与资源

`sql.Open` 建立数据库句柄，不保证已经连上。`PingContext` 在有限时间内检查真实连接。句柄通常表示连接池，服务启动时建立、退出时 Close，而不是每个请求新建。查询返回 Rows 要及时 Close，遍历后检查 `Rows.Err()`；Scan 的字段顺序必须对应 SELECT 列顺序。给调用传 context 有助于限制等待，不表示任何数据库工作都能被瞬间强制终止。

### 四类操作的真实 PostgreSQL 查询片段

以下是**存储函数内部片段**，假定db已经连接、ctx可用，且id、title、platform、difficulty已按本课程数据模型验证；需要导入database/sql。课程problems表的platform、difficulty是必需字段，不能只插入title。创建用RETURNING取得数据库生成id：

```go
var newID int64
err := db.QueryRowContext(ctx,
	"INSERT INTO problems(title, platform, difficulty) VALUES ($1, $2, $3) RETURNING id",
	title, platform, difficulty).Scan(&newID)
```

读取多行必须处理资源和遍历错误，不能把Query成功当全部结果成功：

```go
rows, err := db.QueryContext(ctx, "SELECT id, title FROM problems ORDER BY id")
if err != nil { return err }
defer rows.Close()
for rows.Next() {
	var recordID int64
	var recordTitle string
	if err := rows.Scan(&recordID, &recordTitle); err != nil { return err }
	// 在这里收集记录；不要把打印当作正式存储返回契约。
}
if err := rows.Err(); err != nil { return err }
```

修改和删除不一定返回Rows，但必须看影响行数，避免把不存在id的零行操作称为成功更新：

```go
result, err := db.ExecContext(ctx, "UPDATE problems SET title=$1 WHERE id=$2", title, id)
if err != nil { return err }
changed, err := result.RowsAffected()
if err != nil { return err }
if changed == 0 { return sql.ErrNoRows }
// DELETE对应：db.ExecContext(ctx, "DELETE FROM problems WHERE id=$1", id)
```

这些片段的表problems是你的课程项目表，不能直接与后面的临时表实验混用名字。增加认证与owner_id后，创建还必须增加由可信身份得到的owner_id字段，私人读写必须添加归属条件；动态排序仍使用白名单。SQL每一种操作都能在专用测试库写正常、缺失、约束失败用例。

### 就地练习：池对象不等于连通

Open无错但数据库已停止，下一步如何证明连接？多行遍历结束检查什么？

### 参考核对：池对象不等于连通

PingContext验证一次连接；Rows及时Close并在遍历结束检查Err，Open不保证实际查询可用。

## 4. 事务：相关操作一起成功或回滚

`BeginTx` 创建事务，之后相关查询、写入必须使用 `tx`，不能混用 `db`，否则可能跑在不同连接、脱离事务。通常在创建成功后 `defer tx.Rollback()` 兜底；提交成功后的 Rollback 会失败但可忽略，因为事务已经结束。中间出错提前返回，延迟回滚释放事务；只有所有步骤成功才 Commit，并检查提交本身的错误。PostgreSQL 中语句失败后事务通常进入失败状态，不要继续当作正常事务使用。

### 就地练习：事务之外的写不会回滚

BeginTx后误用db写第一条、tx写第二条失败，Rollback能撤销前者吗？

### 参考核对：事务之外的写不会回滚

不能把事务外操作算入回滚；相关读写都走tx，提交错误也返回，查询业务行核对结果。

## 先跑纯逻辑练习：main.go 完整程序

VS Code 打开 `exercises/go/go-sql-logic`，创建 main.go。首次 `go mod init example.com/learn/go-sql-logic`，然后 `go run .`。它只验证写库之前的标题规则，**不连接数据库、不模拟事务、不证明持久化**。

```go
package main

import (
	"fmt"
	"strings"
)

func NormalizeTitle(raw string) (string, error) {
	title := strings.TrimSpace(raw)
	if title == "" { return "", fmt.Errorf("标题不能为空") }
	return title, nil
}

func main() {
	for _, raw := range []string{"  练习  ", "   ", "Alice's note"} {
		title, err := NormalizeTitle(raw)
		if err != nil { fmt.Println("拒绝：", err); continue }
		fmt.Println("接受：", title)
	}
}
```

```output
接受： 练习
拒绝： 标题不能为空
接受： Alice's note
```

## 真实 PostgreSQL 实验：环境与完整 dbmain.go

前置条件：已安装并启动 PostgreSQL、有专用练习数据库、知道连接账户，并能用 psql 或图形客户端连接。请单独创建测试库（如 `go_knowledge_practice`），不要用已有业务库。这一节不自动安装数据库，也没有内置账号密码。若还没准备环境，先完成纯逻辑例子，保留此节为后续实验。

另外建立 `exercises/go/go-sql-db` 目录，打开它，建立独立模块，安装 pgx 的 database/sql 驱动：

```powershell
go mod init example.com/learn/go-sql-db
go get github.com/jackc/pgx/v5/stdlib
```

创建 `dbmain.go`，保存以下**完整数据库程序**。它在真实数据库连接内建临时表，临时表仅属于当前连接，结束后消失；实验不会建立长期业务表。需要持久化时应另用正常表、迁移和重启检查。

```go
package main

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"os"
	"time"
	"github.com/jackc/pgx/v5/pgconn"
	_ "github.com/jackc/pgx/v5/stdlib"
)

func run() error {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" { return fmt.Errorf("请先设置测试库 DATABASE_URL") }
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	db, err := sql.Open("pgx", dsn)
	if err != nil { return err }
	defer db.Close()
	if err := db.PingContext(ctx); err != nil { return fmt.Errorf("连接失败：%w", err) }
	conn, err := db.Conn(ctx)
	if err != nil { return err }
	defer conn.Close()
	_, err = conn.ExecContext(ctx, `CREATE TEMP TABLE practice_problems (
		id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
		title TEXT NOT NULL UNIQUE CHECK (length(trim(title)) > 0)
	)`)
	if err != nil { return err }
	var id int64
	err = conn.QueryRowContext(ctx,
		"INSERT INTO practice_problems(title) VALUES ($1) RETURNING id", "Alice's note").Scan(&id)
	if err != nil { return err }
	var title string
	err = conn.QueryRowContext(ctx, "SELECT title FROM practice_problems WHERE id=$1", id).Scan(&title)
	if err != nil { return err }
	fmt.Println("参数绑定读取：", title)
	tx, err := conn.BeginTx(ctx, nil)
	if err != nil { return err }
	defer tx.Rollback()
	if _, err = tx.ExecContext(ctx, "INSERT INTO practice_problems(title) VALUES ($1)", "事务记录"); err != nil { return err }
	_, err = tx.ExecContext(ctx, "INSERT INTO practice_problems(title) VALUES ($1)", "事务记录")
	var pgErr *pgconn.PgError
	if !errors.As(err, &pgErr) || pgErr.Code != "23505" { return fmt.Errorf("预期 UNIQUE SQLSTATE 23505，实际：%v", err) }
	if err := tx.Rollback(); err != nil { return err }
	var count int
	if err := conn.QueryRowContext(ctx, "SELECT count(*) FROM practice_problems WHERE title=$1", "事务记录").Scan(&count); err != nil { return err }
	fmt.Println("失败事务回滚后：", count)
	_, err = conn.ExecContext(ctx, "INSERT INTO practice_problems(title) VALUES ($1)", "   ")
	if !errors.As(err, &pgErr) || pgErr.Code != "23514" { return fmt.Errorf("预期 CHECK SQLSTATE 23514，实际：%v", err) }
	fmt.Println("普通空格标题被约束拒绝：", true)
	tx2, err := conn.BeginTx(ctx, nil)
	if err != nil { return err }
	defer tx2.Rollback()
	if _, err := tx2.ExecContext(ctx, "INSERT INTO practice_problems(title) VALUES ($1)", "成功事务"); err != nil { return err }
	if err := tx2.Commit(); err != nil { return err }
	if err := conn.QueryRowContext(ctx, "SELECT count(*) FROM practice_problems WHERE title=$1", "成功事务").Scan(&count); err != nil { return err }
	fmt.Println("成功事务提交后：", count)
	return nil
}

func main() {
	if err := run(); err != nil { fmt.Fprintln(os.Stderr, err); os.Exit(1) }
}
```

在终端设置 `DATABASE_URL` 为自己的**测试库连接信息**，不要写进源码或提交到 Git。例如本地测试格式为 `postgres://用户名:自己的密码@127.0.0.1:5432/go_knowledge_practice?sslmode=disable`；disable 仅用于你确认的本机学习连接，远程连接按部署方 TLS 要求配置。PowerShell 用 `$env:DATABASE_URL = '实际连接信息'`，macOS/Linux 用 `export DATABASE_URL='实际连接信息'`。密码有 URL 特殊字符时要正确编码，或使用驱动支持的键值配置。不要把含密码的终端截图发给 AI。

执行 `go fmt ./...`、`go run .`。**预期而非预先声称已验收**的输出为：

```output
参数绑定读取： Alice's note
失败事务回滚后： 0
普通空格标题被约束拒绝： true
成功事务提交后： 1
```

## 事务练习

1. 在真实事务例子中把第二个标题改为不同值，并改成成功后Commit，提交后应留下几条相关记录？
2. 恢复相同标题，让第二步违反UNIQUE；查询是否留下第一步？
3. 查询一个不存在的id，应是哪个错误，而不是连接失败？

### 参考答案

把第二次事务插入标题改成“不同标题”，此时应改写控制流：两次执行无误后 Commit，而不是期待失败并回滚；提交后查询两条均存在。参考原则是“成功两行都在，第二步失败两行都不在”，不要以返回了某个错误就推测回滚正确，必须查询验证。把读 id 改成不存在值，应得到 sql.ErrNoRows 而不是连接失败。

自查：你能解释临时表为何不能证明重启持久化吗？能指出每次写入用的是 db、conn 还是 tx？值中带引号为何不改变 SQL 结构？没有真实测试库证据时，记录应写“未执行数据库实验”，不要把纯逻辑通过记成 SQL 已验收。

官方参考：[database/sql](https://pkg.go.dev/database/sql)、[参数化查询](https://go.dev/doc/database/sql-injection)、[事务](https://go.dev/doc/database/execute-transactions)、[PostgreSQL 约束](https://www.postgresql.org/docs/current/ddl-constraints.html)、[pgx 驱动](https://pkg.go.dev/github.com/jackc/pgx/v5/stdlib)。
