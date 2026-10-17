# 基本数据类型与零值

区分 int、float64、bool、string，并观察未赋初值的结果。

## 先根据数据含义选择类型

**数据类型决定一个值能做哪些操作，零值则是未写初值时得到的确定起点。** 例如数量 3 用整数表示，价格 2.5 用小数表示，“是否准备好”用布尔表示，称呼用字符串表示。

| 类型 | 示例值 | 未写初值时 | 适合的含义 |
| --- | --- | --- | --- |
| `int` | `3`、`-2` | `0` | 个数、整数分数 |
| `float64` | `2.5` | `0` | 本课的小数计算 |
| `bool` | `true`、`false` | `false` | 是或否 |
| `string` | `"小林"`、`"20"` | `""` | 文字 |

`true` 和 `false` 不加引号；`"false"` 是文字。空字符串 `""` 与一个空格 `" "` 不相同。这里只观察四种常见类型，后面遇到切片、map、指针时会学习它们各自的零值。

### 就地练习：零值不靠猜

声明 `var enabled bool` 和 `var label string`，用 `%t %q` 打印；再把 label 赋为一个空格。先写出两次显示的区别。

### 参考核对：零值不靠猜

第一次为 false 与 ""；第二次字符串显示为 " "。空字符串、空格和字符串 "false" 是不同数据。

## 整数宽度、别名与显式转换

| 类型 | 含义与典型场景 |
| --- | --- |
| `int8`、`int16`、`int32`、`int64` | 带符号整数，位数决定可表示范围 |
| `uint8`、`uint16`、`uint32`、`uint64` | 非负整数，同样有上限；不能用来保存 -1 |
| `int`、`uint` | 宽度由实现决定，通常是 32 或 64 位 |
| `float32`、`float64` | 有限精度的浮点数；常规小数示例采用 float64 |
| `byte`、`rune` | 分别是 uint8、int32 的别名；后续处理字节与 Unicode |
| `complex64`、`complex128` | 复数，例如 `complex(1, 2)`；普通 Web 入门暂不用 |

类型转换写成 `目标类型(值)`，它是你明确作出的操作。以下片段放 main 内：

```go
var minutes int = 3
hours := float64(minutes) / 60
fmt.Printf("%T %.2f\n", hours, hours) // float64 0.05
positive, negative := 3.9, -3.9
fmt.Println(int(positive), int(negative)) // 3 -3：浮点变量转整数向零截断。
```

`string(65)` 得到 Unicode 码点 65 对应的字符 A，不是数字文字“65”；数字显示用 fmt，后续解析用户输入用 strconv。字符串“3”不能靠 `int("3")` 解析。

常量 `var small int8 = 128` 在编译时因超范围被拒绝；运行中把更大整数转换为更小整数类型却可能截掉高位，不保证报错。**转换前先确认范围，不把“可以编译”当作“值不会变化”。** `%T` 打印值的类型，排查类型不一致时很有用。

### 就地练习：先转换还是先除法

让 total、count 为 int 7 和 2，对比 `float64(total/count)` 与 `float64(total)/float64(count)`。用 %.1f 显示并解释差异。

### 参考核对：先转换还是先除法

分别是 3.0 和 3.5。前者先做整数除法，后转类型不能找回已丢的小数。

## 先运行一个小例子

在已初始化的独立 Go 练习目录中，把下面完整代码保存为 main.go。本节替换原文件，不在文件末尾追加另一份 main 函数。

```go
package main

import "fmt"

func main() {
	var count int     // 整数的零值是 0。
	var price float64 // 小数的零值也是 0。
	var ready bool    // 布尔值只有 true/false，零值是 false。
	var name string   // 字符串的零值是空文字，不是单个空格。
	// 四个格式符按顺序读取四个变量；%q 让空字符串的引号可见。
	fmt.Printf("%d %.1f %t %q\n", count, price, ready, name)
}
```

在这个目录的终端运行：

```sh
go run .
```

预期输出：

```output
0 0.0 false ""
```

## 逐步读懂这个例子

四个 var 声明没有写等号，仍然得到确定的零值。Printf 的第一项是输出格式：%d 显示整数，%.1f 显示一位小数，%t 显示布尔值，%q 给字符串加引号，\n 换行。这里使用格式符是为了让空字符串也看得见。

读 `Printf` 时，先读第一项格式字符串，再让后面四个变量按顺序对应：

| 格式符 | 对应变量 | 本例显示 |
| --- | --- | --- |
| `%d` | count | 整数 0 |
| `%.1f` | price | 小数点后显示一位，0.0 |
| `%t` | ready | false |
| `%q` | name | 给文字带上引号，`""` |

`\n` 表示换行。`%.1f` 控制的是显示方式，没有把 price 变成字符串。`int` 不是任意大的整数，`float64` 也不能精确表示所有十进制小数；本课只用小数值，后续金额计算需要另外制定规则。

## 自己改一处再运行

分别给四个变量赋值 3、2.5、true、"小林"，再观察输出。

### 参考答案

四次赋值分别匹配整数、小数、布尔和字符串类型，格式符与参数位置一一对应。

下面是可直接替换的完整 `main.go`。在本节独立模块中保存后运行 `go run .`。

```go
package main

import "fmt"

func main() {
	var count int
	var price float64
	var ready bool
	var name string
	count = 3
	price = 2.5
	ready = true
	name = "小林"
	fmt.Printf("%d %.1f %t %q\n", count, price, ready, name)
}
```

预期结果：

```output
3 2.5 true "小林"
```

## 转换也会丢失信息

`float64(total / count)` 先做整数除法，丢失的小数不能恢复；需要小数结果时用 `float64(total) / float64(count)`。浮点数的舍入则是另一问题：0.1 一类十进制值不一定能精确表示，不能把浮点类型直接当成精确金额容器。后端金额可按业务约定使用整数最小货币单位，并校验计算范围。

## 验证类型限制

在声明后写 `count = "3"`，保存运行，应得到类型不匹配的编译错误；把它改成 `count = 3` 后应正常输出。然后只修改 `name = " "`，留意 `%q` 显示的空格，证明它与零值不同。

填写四个新值时，写在原声明后面的赋值语句即可；不要为同一个名字再声明一次。

## 合上参考，为借书记录选择类型

从空白 main.go 准备四项数据：整本书数量、平均每天阅读小时、是否归还、借阅者称呼。自己起变量名并选择合适类型，先不提供初值，按“数量、小数、是否、称呼”的顺序输出零值；小数显示一位，称呼带引号以便看见空值。

随后赋入 2、1.5、true、“阿青”，再输出同样四项。两行应为：

```output
0 0.0 false ""
2 1.5 true "阿青"
```

再暂时把数量赋为文字“2”，确认编译拒绝；恢复整数后重新核对。**记录类型选择的理由，而不是照搬前例的四个名字。**

### 参考答案

数量是整本数，小时允许小数，是否归还只有两种状态，称呼是文字。第一行观察零值，第二行观察赋值；临时写 books = "2" 会因类型不符编译失败，恢复为整数才能得到上述结果。

下面是可直接替换的完整 `main.go`。在本节独立模块中保存后运行 `go run .`。

```go
package main

import "fmt"

func main() {
	var books int
	var hours float64
	var returned bool
	var borrower string
	fmt.Printf("%d %.1f %t %q\n", books, hours, returned, borrower)
	books = 2
	hours = 1.5
	returned = true
	borrower = "阿青"
	fmt.Printf("%d %.1f %t %q\n", books, hours, returned, borrower)
}
```

预期结果：

```output
0 0.0 false ""
2 1.5 true "阿青"
```

参考：[Go 语言规范](https://go.dev/ref/spec)。
