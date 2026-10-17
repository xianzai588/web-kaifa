# map 键值集合

统计指定单词次数，区分不存在与值为零。

## 用名字找计数，用下标找位置

数组和切片按下标位置查找，map 按键查找。例如词 `"go"` 是键，次数 2 是值。`map[string]int{}` 创建一个没有记录、但可以写入的键值表；前一个类型是键类型，后一个是值类型。

**读不到某个键时返回零值；只有第二个布尔结果才能说明这个键是否存在。** map 的读取不是自动添加记录：读取 counts["web"] 后，web 仍不存在。`counts["web"] = 0` 才实际加入这个键。

`delete(counts,"go")` 删除一个键，删除不存在的键也不出错。`len(counts)` 返回已有键的个数，而不是所有次数之和。

### 就地练习：读缺键不会新增

建立空map，读取missing的值和exists，打印len；显式写入missing=0后再读取。

### 参考核对：读缺键不会新增

先为0 false且长度0，后为0 true且长度1。

## 键类型、遍历和引用关系

map 的键必须可比较，string、整数和可比较的结构体可作键，切片不能。`make(map[string]int, 10)` 可给出预期容量提示，10不是已经存在的键数，也不是禁止超出的固定上限。

`for key, value := range counts` 取得键和值，次序没有保证。需要排序时先收集键，再排序并按键读取。`other := counts` 复制对同一个表的引用关系，通过 other 写入会被 counts 观察到；要独立备份，用新 map 逐项写入。多个 goroutine 同时访问且含写入时需要同步，不能把 map 当自动安全的并发容器。

### 就地练习：两个名字指向同一表

counts含go=1，令other:=counts，通过other将go改为2，打印counts的go。如何建立独立副本？

### 参考核对：两个名字指向同一表

原表也为2。需创建新map再遍历逐项复制；改变量名不复制记录。

## 先运行一个小例子

在已初始化的独立 Go 练习目录中，把下面完整代码保存为 main.go。本节替换原文件，不在文件末尾追加另一份 main 函数。

```go
package main

import "fmt"

func main() {
	counts := map[string]int{} // 创建可写的表：文字是键，整数是值。
	counts["go"]++             // 没写入过的键读到 0，加 1 后写回 1。
	counts["go"]++             // 再读到 1，更新为 2。
	// 两个结果分别表示计数和“这个键是否真的存在”。
	value, exists := counts["web"]
	fmt.Println(counts["go"])
	fmt.Println(value, exists)
}
```

在这个目录的终端运行：

```sh
go run .
```

预期输出：

```output
2
0 false
```

## 逐步读懂这个例子

第一次增加go时，原值默认为0，增加成1；第二次增加成2。web未写入，读取结果0,false。delete(counts,"go")可删除键。map遍历顺序没有保证，排名要先排序。

| 操作 | go 的计数 | web 是否存在 |
| --- | --- | --- |
| 刚创建 map | 不存在，读取会是 0 | false |
| 第一次 go++ | 1 | false |
| 第二次 go++ | 2 | false |
| 读取 web 的两个结果 | 2 | false，值是 0 |

`++` 在这里先读取当前计数，加 1 后写回。不存在的键先读到 0，所以首次统计也能从 1 开始。

## 自己改一处再运行

先写counts["web"]=0，再读取两个结果，解释差别。

### 参考答案

写入0也会建立一个键；单纯读取缺失键才得到0、false。

下面是可直接替换的完整 `main.go`。在本节独立模块中保存后运行 `go run .`。

```go
package main

import "fmt"

func main() {
	counts := map[string]int{}
	counts["web"] = 0
	value, exists := counts["web"]
	fmt.Println(value, exists)
}
```

预期结果：

```output
0 true
```

## 只声明 map 为什么不能写

`var counts map[string]int` 的零值 nil 可以读取、len 和 delete，但第一次赋值会 panic。把初始化改成 `counts := make(map[string]int)` 或 map 字面量后，再写入数据。打印出 map[] 不能单独证明它已可写。

## 创建可写 map 与 nil map

`var counts map[string]int` 只声明变量，没有创建可写表，得到零值 nil。nil 可以读取，也能检查 len，但直接写入会引发 panic。把声明恢复为字面量，或用 `make(map[string]int)` 创建后再写。

先加入 web=0，读取应是 `0 true`；删除 web，再读取应是 `0 false`。这两次证明“值为 0”和“键不存在”不能混为一谈。

## 合上参考，独立统计课程预约

从空白 main.go 用字符串切片保存三条预约：go、web、go。自己建立键为课程名、值为预约次数的map，使用已学range逐条累计；通过已知课程名分别读取结果，暂不需要map双结果遍历。

go应为2次，web应为1次，键数量应为2而不是总预约数3。再读取从未预约的sql：结果应为0、false；给sql明确写入0后应为0、true，键数量变为3；删除sql后又是0、false，键数量回到2。

**先写出这一组状态变化，再运行自己的代码；读缺键不能自动当成已加入预约。**

### 参考答案

预约总数3，已有课程键2；读取sql不增加键，明确写入sql=0后键数增至3，删除后恢复2。每次都重新读取 exists，不能继续打印上一次保存的状态。

下面是可直接替换的完整 `main.go`。在本节独立模块中保存后运行 `go run .`。

```go
package main

import "fmt"

func main() {
	bookings := []string{"go", "web", "go"}
	counts := map[string]int{}
	for _, course := range bookings { counts[course]++ }
	fmt.Println(counts["go"], counts["web"], len(counts))
	value, exists := counts["sql"]
	fmt.Println(value, exists, len(counts))
	counts["sql"] = 0
	value, exists = counts["sql"]
	fmt.Println(value, exists, len(counts))
	delete(counts, "sql")
	value, exists = counts["sql"]
	fmt.Println(value, exists, len(counts))
}
```

预期结果：

```output
2 1 2
0 false 2
0 true 3
0 false 2
```

参考：[Go 语言规范](https://go.dev/ref/spec)。
