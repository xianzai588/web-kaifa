# SQL 查询、修改与删除

读懂每条SQL的目标，再按唯一编号更新和删除自己的临时记录。

## 四种操作是四种命令

上一节连接了专用练习库，并创建practice_problems。继续在同一库的psql执行，不放到main.go。CRUD是Create/Read/Update/Delete的缩写，分别创建、读取、修改、删除；对应SQL常用INSERT、SELECT、UPDATE、DELETE。

**先用SELECT确认目标，再让UPDATE或DELETE使用同样的精确条件。** WHERE表示“只选择满足条件的行”，它不自动限制成一行。标题可能重名；id主键才唯一。

### 就地练习：标题重名时更新几行

纸上准备两行同标题不同id，比较按title与按一个id更新solved的目标集合。

### 参考核对：标题重名时更新几行

title条件可能选两行；主键id条件最多一行。WHERE存在不代表只改一条。

## 先新增并取得真实编号

```sql
-- RETURNING显示刚插入的行，记录自己的实际id，不照抄示例数字。
INSERT INTO practice_problems (title, solved)
VALUES ('delete-demo', FALSE)
RETURNING id, title, solved;
```

拆开读：INSERT INTO指目标表；括号列出这次赋值的列；VALUES中的值按列的顺序对应；RETURNING要求返回新增行的数据。字符串用单引号，FALSE是布尔值，不用引号。

## 查询：选哪些列、哪些行、怎样排序

```sql
-- ORDER BY id给明确顺序，LIMIT 10最多返回10行。
SELECT id, title, solved
FROM practice_problems
ORDER BY id
LIMIT 10;
```

SELECT指定返回列，FROM指定表。加 `WHERE solved = FALSE` 可只看未完成；SQL里的 `=` 在此比较，Go中的比较才写 `==`。`ORDER BY id`默认升序，`DESC`改为降序。**没有ORDER BY时，不应把返回顺序当作稳定合同。** LIMIT只截结果数量，不替你筛条件。

### 就地练习：LIMIT不提供顺序

三行id为7、12、20，按id DESC LIMIT 2写出结果；删掉ORDER BY后能否仍承诺同样两行？

### 参考核对：LIMIT不提供顺序

有序时20、12；没有排序不保证返回这两行或其顺序。

## 修改：先选择，再修改，再读取

以下三条用123演示写法。执行前，把每处123都换成你刚查到的那条临时记录的实际id；先确认目标，不能照抄数字：

```sql
-- 示例123只演示写法，执行前必须换成自己查到的id。
SELECT id, title, solved FROM practice_problems WHERE id = 123;
UPDATE practice_problems SET solved = TRUE WHERE id = 123
RETURNING id, title, solved;
SELECT id, title, solved FROM practice_problems WHERE id = 123;
```

SELECT先确认是自己的临时行，UPDATE将那行solved改true，RETURNING与最后查询核对。`SET`说明哪些字段变成什么。psql显示 `UPDATE 1` 表示修改1行；`UPDATE 0` 表示没匹配目标，不一定是数据库故障。若用 `WHERE title = 'Two Sum'`，所有同标题行都会更新。

## 删除：只删除这条临时行

```sql
-- 仍把123换为自己的临时id。先查清楚，再执行删除。
SELECT id, title FROM practice_problems WHERE id = 123;
DELETE FROM practice_problems WHERE id = 123 RETURNING id, title;
SELECT id, title FROM practice_problems WHERE id = 123;
```

删除成功常显示DELETE 1，最后0行。**省略WHERE会把整张表的行作为目标，不用于本节练习。** DELETE移除行，不移除表结构；DROP TABLE移除表，是另一种操作，本节不用。

## 正常与失败怎样验证

先预测，再尝试把自己的一行标题UPDATE成空白，CHECK应拒绝，重新SELECT确认旧标题不变。再用确实不存在的id查询/更新，观察0行与UPDATE 0。不要为了制造不存在目标而删除别人的行。

### 参考答案

CHECK失败后重新SELECT旧标题应仍保留；不存在id时UPDATE 0，由Go层按接口合同处理。不要为制造不存在目标删除别人的记录。

## 独立变式

插入三条不同临时标题，记录id；按id降序取前两条，只将其中一条设为完成，最后查询确认其他两条未变。写下每条命令的目标与实际受影响行数。

参考：[PostgreSQL查询](https://www.postgresql.org/docs/current/tutorial-select.html)、[修改](https://www.postgresql.org/docs/current/tutorial-update.html)、[删除](https://www.postgresql.org/docs/current/tutorial-delete.html)。

## 参数、受影响行数与稳定结果

修改与删除必须有明确WHERE条件，先SELECT相同条件核对目标。0行受影响不一定是SQL语法错误，但业务上可能应返回404；不能只看Exec的err为nil就宣布修改成功。

ORDER BY要能唯一确定次序，例如created_at相同再按id；LIMIT没有稳定排序不能保证每次同一页。参数绑定保护的是值，表名/列名/排序方向等结构不能用普通值占位符代替，需要允许列表选择。

### 参考答案：独立实现与验收

以下使用本节的psql客户端，`\gset`把RETURNING结果保存为变量；在专用测试库运行，不修改原业务表：

```sql
CREATE TABLE lesson_crud (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title TEXT NOT NULL CHECK (length(btrim(title)) > 0),
    solved BOOLEAN NOT NULL DEFAULT FALSE
);
INSERT INTO lesson_crud (title) VALUES ('甲') RETURNING id AS a_id \gset
INSERT INTO lesson_crud (title) VALUES ('乙') RETURNING id AS b_id \gset
INSERT INTO lesson_crud (title) VALUES ('丙') RETURNING id AS c_id \gset
SELECT id, title, solved FROM lesson_crud ORDER BY id DESC LIMIT 2;
UPDATE lesson_crud SET solved = TRUE WHERE id = :'b_id'::bigint RETURNING id, title, solved;
SELECT id, title, solved FROM lesson_crud ORDER BY id;
```

预期只乙变true，甲丙仍false；降序前两项是丙、乙，UPDATE返回恰好一行。每次使用数据库实际返回的id，而不是假定1、2、3。其他SQL客户端不支持psql元命令时，先记下RETURNING结果再用客户端的参数机制绑定。

### 就地练习：零行更新是否成功

目标id不存在，Exec没有SQL错误但RowsAffected为0。按修改单条资源的合同，能否回复已修改？

### 参考核对：零行更新是否成功

不能仅据err=nil宣布修改；按合同映射不存在，例如404。语句执行与业务目标存在是两件事。
