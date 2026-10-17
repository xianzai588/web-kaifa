# 函数的多个返回值

同时接收两个返回值，用布尔值表示是否找到结果。

## 同时交回数据与状态

First 的问题是“这组数据里有没有第一项，若有，它是多少”。仅返回一个整数无法回答两件事，因为 0 也可能就是合法的第一项。**多个返回值可以把结果和结果是否有效分开表达。**

签名 `(int,bool)` 是两个返回类型，不是一个特殊容器。`return 0,false` 的第一个值对应 int，第二个值对应 bool；调用者的 `value,found := ...` 按相同顺序接收。空切片判断必须发生在下标访问之前。

### 就地练习：零结果的两种含义

分别调用First([]int{0})和First([]int{})，接住两个结果，用自己的话说明value=0能否单独判断找到。

### 参考核对：零结果的两种含义

结果0,true与0,false；整数一样，found才表示是否存在。

## 返回名、忽略值和返回数量

返回值也能命名：`func Position() (x, y int)`。名字在函数内像变量一样使用，裸 return 返回它们当前的值；第一次练习仍推荐明确写出 `return x, y`，减少需要追踪的隐藏状态。

调用者不需要某个结果时可用 `_`，如 `_, found := First(values)`。忽略错误或存在标记应有明确理由；若后续仍要使用值，就不能丢掉决定其有效性的状态。函数声明两项返回值时，每条返回路径的数量和类型都要匹配。

### 就地练习：只要存在标记

写一个只需要知道是否非空的调用，用_丢弃整数并打印found；分别给空集合和[0]。

### 参考核对：只要存在标记

依次false、true；若以后要使用整数值，就不能省掉有效性判断。

## 先运行一个小例子

在已初始化的独立 Go 练习目录中，把下面完整代码保存为 main.go。本节替换原文件，不在文件末尾追加另一份 main 函数。

```go
package main

import "fmt"

// 返回值的顺序是“第一项整数、是否找到”。
func First(values []int) (int, bool) {
	if len(values) == 0 {
		return 0, false // 先判断空集合，避免访问不存在的下标 0。
	}
	return values[0], true // 找到了第一项，哪怕它本身是 0。
}

func main() {
	value, found := First([]int{8, 9}) // 两个名字按返回顺序接收。
	fmt.Println(value, found)
	value, found = First([]int{}) // 两个变量已存在，这次使用 = 更新。
	fmt.Println(value, found)
}
```

在这个目录的终端运行：

```sh
go run .
```

预期输出：

```output
8 true
0 false
```

## 逐步读懂这个例子

First先检查长度：空输入返回0,false；非空返回第一项,true。两个结果按顺序接收，found决定value是否真的代表找到的元素。

| 输入 | value | found | 含义 |
| --- | --- | --- | --- |
| `[]int{8,9}` | 8 | true | 找到第一项 8 |
| `[]int{0}` | 0 | true | 找到第一项，它就是 0 |
| `[]int{}` | 0 | false | 没有第一项；整数 0 只是占位 |

第一次接收使用 `:=` 声明两个名字，第二次使用 `=` 更新已有名字。后面 map 的“值、是否存在”和函数的“数据、error”都是类似的结果与状态分离思路。

## 自己改一处再运行

把输入换成[]int{0}，说明怎样区分“找到了0”与“没有元素”。

### 参考答案

两次整数都是0，只有 found 能区分真实首项与失败占位。

下面是可直接替换的完整 `main.go`。在本节独立模块中保存后运行 `go run .`。

```go
package main

import "fmt"

func First(values []int) (int, bool) {
    if len(values) == 0 { return 0, false }
    return values[0], true
}

func main() {
	value, found := First([]int{0})
	fmt.Println(value, found)
	value, found = First([]int{})
	fmt.Println(value, found)
}
```

预期结果：

```output
0 true
0 false
```

## 为什么不能“先取末项再判断”

空切片的 len-1 等于-1，读取在检查之前就会 panic。把保护分支放在访问前，并在空分支直接 return，后面的读取才有非空前提。单靠“后面会检查”不能修复已经发生的越界。

## 让空集合拒绝下标读取

先用三种输入核对表格。要观察“先访问再检查”为什么太晚，临时用下面整个函数替换 `First`，保留原有 import 和 main：

```go
func First(values []int) (int, bool) {
	first := values[0] // 故意先读取下标，空切片会在这一行越界。
	if len(values) == 0 {
		return 0, false // 对空切片而言，程序来不及执行这里的保护。
	}
	return first, true // 保留完整的返回路径，所以这个变式可以编译。
}
```

运行含空切片的原 main 时，应看到下标越界的运行时错误。不要只是把检查移到无条件 return 后：那样还可能先得到 `missing return` 的编译错误，观察不到本节想验证的访问顺序。实验后恢复开头先检查长度的正确函数。

试着只写 `value := First(...)`，编译会指出接收数量不匹配。如果确实不使用某一返回值可以用 `_`，但本例丢掉 found 就丢掉了区分合法零值的依据。

## 合上参考，独立寻找最后一项

从空白 main.go 自己定义 Last(values []int) (int,bool)，返回最后一个整数以及是否找到。由你安排空集合判断、末项下标计算和两个返回值，main 按顺序接收并打印；不能复制 First 只替换函数名。

| 输入 | 整数结果 | 是否找到 |
| --- | --- | --- |
| 空切片 | 0 | false |
| [0] | 0 | true |
| [8 9] | 9 | true |

先预测，再保存运行三次。**不存在与最后一项恰好为0，必须通过第二个返回值区分。** 空输入不能先读取末项再判断长度。

### 参考答案

先排除空输入，才计算并访问 len(values)-1。三组分别覆盖无末项、合法零值、普通末项。

下面是可直接替换的完整 `main.go`。在本节独立模块中保存后运行 `go run .`。

```go
package main

import "fmt"

func Last(values []int) (int, bool) {
    if len(values) == 0 { return 0, false }
    return values[len(values)-1], true
}

func main() {
	value, found := Last([]int{})
	fmt.Println(value, found)
	value, found = Last([]int{0})
	fmt.Println(value, found)
	value, found = Last([]int{8, 9})
	fmt.Println(value, found)
}
```

预期结果：

```output
0 false
0 true
9 true
```

参考：[Go 语言规范](https://go.dev/ref/spec)。
