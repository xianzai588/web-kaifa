# 数据库、表与约束

先认识数据存在哪里、用什么程序操作，再创建带字段规则的表。

## 内存变量与数据库的区别

Go的变量、切片和map存在程序内存中。关掉程序，除非自己写文件等保存，否则这些值会丢失。数据库系统专门管理数据的存储、查询和多人访问；本阶段使用PostgreSQL这一种关系数据库。

**数据库服务保存数据，SQL客户端向它发送命令；它们是两个程序。** PostgreSQL服务运行在本机或另一台机器。psql是终端客户端，连接服务后执行SQL。SQL是操作关系数据的语言，不是Go语句，也不是HTTP请求。完整数据流为：浏览器 → Go服务 → 数据库；浏览器通常不直接拿数据库密码查询。

一个数据库像独立资料空间，里面可有多张表。表由列和行组成：列定义字段、行是一条记录。它不是屏幕上的网页表格。

| id | title | solved |
| --- | --- | --- |
| 1 | Two Sum | false |
| 2 | Reverse List | true |

这个表的一行近似前面的一个结构体；多行近似一组结构体。但数据库规则、查询和持久化由数据库执行，不是Go切片自动变成表。

### 就地练习：客户端版本不等于连通

写出psql --version与SELECT current_database()各能证明什么，说明哪一步确认目标练习库。

### 参考核对：客户端版本不等于连通

前者只验证客户端可运行；连接后查询才确认实际库与用户。浏览器表格也不等于数据库表。

## 在专用练习库连接，不在 Go 文件里执行

首次安装与账户创建按 [数据库环境讲义](#/topic/go-sql) 或 [第09阶段安装步骤](#/followup/web/9) 做：准备PostgreSQL服务、psql客户端、自己的非超级用户和新练习库，例如club_practice。确认 `psql --version` 可用；它只检查客户端版本，不证明服务已启动。

在普通终端输入以下连接命令，用户名、库名替换成自己已创建的；`-W`让客户端交互询问密码，不把密码放入命令文本：

```sh
psql -h 127.0.0.1 -p 5432 -U club_learner -d club_practice -W
```

连接后在psql提示符输入：

```sql
SELECT current_database(), current_user;
```

输出应是自己的练习库与账户。连接拒绝表示服务/地址/端口问题；认证失败核对账户密码；数据库不存在需先创建库。**确认目标库后才执行下面SQL，不在已有业务库练习。** SQL结束用分号；没写完会出现继续输入提示，输入 `\q` 退出psql。

## 创建结构，不是添加记录

在刚连接的psql中执行一次：

```sql
CREATE TABLE practice_problems (
  -- 数据库自动产生编号；主键使每行可被唯一识别。
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- 非空值还不够：只有普通空格的标题也拒绝。
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  -- 每行保存一个真假值；省略时默认尚未完成。
  solved BOOLEAN NOT NULL DEFAULT FALSE
);
```

| 写法 | 意义 |
| --- | --- |
| CREATE TABLE | 建一张表，括号内是各列定义 |
| BIGINT / TEXT / BOOLEAN | 大范围整数 / 文字 / 真假值 |
| IDENTITY | 编号由数据库生成，新增时一般不自行填写 |
| PRIMARY KEY | 主键，唯一且不能为NULL |
| NOT NULL | 不允许没有值；NULL不是空字符串，也不是0 |
| CHECK | 每次写入必须满足条件 |
| DEFAULT FALSE | 省略该字段时使用false，不覆盖明确提供的值 |

`trim` 默认去掉首尾的普通空格，`length`求字符长度，`> 0`要求去掉这些空格后仍有字符。这里拒绝空文字和只有普通空格的标题，**不等于拒绝所有 Unicode 空白、制表符或换行**。想限制更多字符，要先定义规则再补约束；Go 的 `strings.TrimSpace` 与此默认 SQL 规则也不完全相同。SQL注释用 `--`。创建成功会显示CREATE TABLE，但查询仍为0行。重复执行会报表已存在，不要为了重跑就删库；保留这张表继续实验。

### 就地练习：省略、空文字与NULL

对title空字符串、NULL和只填正常title分别预测CHECK、NOT NULL、DEFAULT的作用。

### 参考核对：省略、空文字与NULL

空文字被标题CHECK拒绝，NULL被NOT NULL拒绝；正常title且省略solved时为false。默认值不替代输入校验。

## 插入一行，再核对

```sql
-- 只指定title；id自动生成，solved走默认值。
INSERT INTO practice_problems (title) VALUES ('Two Sum');
-- 明确选列并排序，实际id以数据库结果为准。
SELECT id, title, solved FROM practice_problems ORDER BY id;
```

应看到Two Sum这一行，solved为false（psql可能用f显示）。INSERT和SELECT下一节会继续拆开。再预测并分别尝试：

```sql
INSERT INTO practice_problems (title) VALUES ('   ');
INSERT INTO practice_problems (title) VALUES (NULL);
```

前者CHECK拒绝，后者NOT NULL拒绝。psql报错后再次SELECT，原合法行应仍存在，非法行不应加入。

**Go输入校验给客户端清楚反馈，数据库约束保护存储规则，两者互补。** 这次SQL失败不证明HTTP层已经正确返回400；还需API测试。

## 独立变式

为新练习表添加非空的 `difficulty TEXT` 字段，选择自己的默认值并解释“没提供”和“提供空文字”是否相同。先写字段规则，再设计一条合格、一条违规的INSERT。

### 参考答案

默认值只在省略或显式DEFAULT时使用；NOT NULL拒绝NULL但允许空字符串，需CHECK限制可选值。

参考：[PostgreSQL建表教程](https://www.postgresql.org/docs/current/tutorial-table.html)、[PostgreSQL约束](https://www.postgresql.org/docs/current/ddl-constraints.html)。

## 主键、外键、唯一与迁移

主键标识一行，NOT NULL拒绝空值，UNIQUE限制重复，CHECK约束单行规则，外键约束关联存在。约束应在数据库层保护，即使另一入口绕过网页校验也不能写入坏数据。

修改已有结构用版本化迁移，先考虑已有行能否满足新约束、默认值如何回填、升级失败如何恢复。索引用来支持查询，不是每列都加越多越好；写入成本与实际查询计划需要一起测。

### 参考答案：独立实现与验收

在专用练习数据库中新建独立表，避免改动现有业务表：

```sql
CREATE TABLE lesson_difficulty (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title TEXT NOT NULL CHECK (length(btrim(title)) > 0),
    difficulty TEXT NOT NULL DEFAULT 'basic'
        CHECK (difficulty IN ('basic', 'intermediate', 'advanced'))
);
INSERT INTO lesson_difficulty (title) VALUES ('Go入门') RETURNING id, difficulty;
INSERT INTO lesson_difficulty (title, difficulty) VALUES ('错误样例', '');
```

第一条省略difficulty，返回basic；第二条被CHECK拒绝。再试显式NULL应被NOT NULL拒绝。三种输入分别核对，不能把省略、空文字和NULL当一种情况。此处SQL需要真实PostgreSQL，本轮不把未运行的数据库实验记为通过。

### 就地练习：新增约束之前

已有表包含重复标题，现在想给title加UNIQUE。先写需要检查的数据与失败处理，而不是立即执行迁移。

### 参考核对：新增约束之前

先查重并决定清理/保留规则，备份并验证迁移；UNIQUE不能自动替你选择删哪条历史记录。
