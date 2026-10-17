# error 与失败返回

先检查错误，再使用函数返回的数据。

## 数据结果与失败原因一起返回

上一章的接口让我们按行为使用一个值。`error` 也是 Go 内置的接口，提供表示失败原因的文字；`errors.New("...")` 创建一个带说明的错误值。

**(值,error) 约定里，先判断 error，再决定是否使用值。** nil 表示没有报告错误；非 nil 表示失败。本例用 0 作为失败时的整数占位，不能因为看见 0 就当作合法答案，也不能把所有 0 都判成失败。

本例同时需要 errors 与 fmt 两个标准库包，使用 `import (...)` 将多个引入写在一组中，每行一个包路径。`errors.New` 创建错误，`fmt.Println` 显示结果；括号只是把引入声明分组，不是调用函数。它们都随 Go 提供，不需要另行安装。

### 就地练习：合法零和失败占位

列出Divide(0,2)与Divide(8,0)的两个返回值，写出调用者何时可打印数字。

### 参考核对：合法零和失败占位

前者0,nil可打印；后者0,error只能走失败路径，不能把占位0当结果。

## 添加上下文、保留原始原因与检查类别

错误信息给人读，错误身份给程序判断。`fmt.Errorf("读取配置: %w", err)` 在外层补充动作，并用 %w 保留原错误链；`errors.Is(err, target)` 沿链检查特定原因。不要用字符串是否包含某句话判断错误类别，系统语言或上下文变化都会让它失效。

需要附带结构化信息时，可以定义自己的错误类型并实现 `Error() string`，再用 errors.As 获取该类型。error 是接口，这和前面实现 Name 方法的思路一致；日常校验只需 errors.New 或 fmt.Errorf，不必给每句话都造一个新类型。

panic 表示当前函数无法按正常路径继续，会触发调用栈展开；recover 只有在同一 goroutine 的延后函数中直接调用，才能恢复该 goroutine 的 panic。它适合在边界保护和记录意外，不应代替普通输入校验的 error；捕获后仍要向调用者提供真实失败结果。

### 就地练习：包装后仍识别原因

在独立例子中用errors.New保存一个原因，再用fmt.Errorf和%w包装，打印errors.Is结果；将%w换%s对比。

### 参考核对：包装后仍识别原因

%w保留错误链，Is为true；仅把原错误文字格式化进新错误，Is不再识别原身份。

## 先运行一个小例子

在已初始化的独立 Go 练习目录中，把下面完整代码保存为 main.go。本节替换原文件，不在文件末尾追加另一份 main 函数。

```go
package main

import (
	"errors"
	"fmt"
)

func Divide(a, b int) (int, error) {
	if b == 0 {
		// 先拒绝非法除数；返回的 0 是占位值，不能当成计算答案。
		return 0, errors.New("除数不能为零")
	}
	return a / b, nil // nil 表示本次操作没有报告错误。
}

func main() {
	value, err := Divide(8, 0)
	// 必须先判断 err，再决定是否能够使用 value。
	if err != nil {
		fmt.Println(err)
		return // 结束 main，避免继续打印无效的占位值。
	}
	fmt.Println(value)
}
```

在这个目录的终端运行：

```sh
go run .
```

预期输出：

```output
除数不能为零
```

## 逐步读懂这个例子

Divide检查除数，0时返回0与错误。main先检查err，打印原因并return，不会继续把value当作答案。正常时返回计算值和nil。

Divide(8,0) 先看到除数为 0，因此没有执行除法，而是返回“0、错误”。main 中 err 不为 nil，显示原因后 return 结束 main；末尾打印 value 不执行。

Divide(0,2) 返回“0、nil”，这次 0 是真实成功结果，main 会正常打印。**错误与合法零值的区别来自 err，不来自结果数字。**

## 自己改一处再运行

改为Divide(8,2)，再用Divide(0,2)验证合法零结果。

### 参考答案

两次 error 都为 nil，所以0是第二次合法结果。把除数改为0会返回非 nil 错误，调用方必须停止使用该次值。

下面是可直接替换的完整 `main.go`。在本节独立模块中保存后运行 `go run .`。

```go
package main

import (
    "errors"
    "fmt"
)

func Divide(a, b int) (int, error) {
    if b == 0 { return 0, errors.New("除数不能为零") }
    return a / b, nil
}

func main() {
	value, err := Divide(8, 2)
	if err != nil { fmt.Println(err); return }
	fmt.Println(value)
	value, err = Divide(0, 2)
	if err != nil { fmt.Println(err); return }
	fmt.Println(value)
}
```

预期结果：

```output
4
0
```

## 只打印错误却继续运行，会发生什么

在“返回数据和 error”的调用后，仅写 fmt.Println(err) 而不 return 或改走失败路径，后面的业务仍可能使用无效数据。先决定失败由谁处理：当前函数能处理就恢复或提示，不能处理就带上下文返回给上层；同一个错误不必层层重复打印。

## 验证失败分支也结束得正确

依次运行 Divide(8,2)、Divide(0,2)、Divide(8,0)，输出分别为 4、0、除数不能为零。不要只验证最后一种。

再暂时删去 main 错误分支里的 return，运行失败输入会多打印一行 0，暴露“错误发生后继续使用占位数据”的问题。恢复 return 后，只剩错误说明。业务输入失败可以正常返回 error，不需要让程序 panic。

## 合上参考，独立返回结果或错误

从空白 main.go 定义SquareNonNegative(n int) (int,error)。本题只接受小的非负整数：合法时返回平方与nil；负数时返回说明为“输入不能为负”的错误。自己决定失败占位值、调用者的错误检查与停止流程，不复制除法函数只改名字。

main依次用不同输入运行：3应显示9，0应显示合法结果0，-2应只显示“输入不能为负”。先手算，再运行；失败后不得再打印整数占位值。

**负数的失败与合法0必须分开，使用err判定本次计算是否成功。** 本题限定小整数，不增加尚未实现的大数溢出检测。

### 参考答案

输入3得到9；把调用改为0得到合法0；改为-2只输出“输入不能为负”。失败占位0不会被继续打印，判断依据是 err。

下面是可直接替换的完整 `main.go`。在本节独立模块中保存后运行 `go run .`。

```go
package main

import (
    "errors"
    "fmt"
)

// 只处理本课的小整数，不承诺检测乘法溢出。
func SquareNonNegative(n int) (int, error) {
    if n < 0 { return 0, errors.New("输入不能为负") }
    return n*n, nil
}

func main() {
	value, err := SquareNonNegative(3)
	if err != nil { fmt.Println(err); return }
	fmt.Println(value)
}
```

预期结果：

```output
9
```

参考：[Go 语言规范](https://go.dev/ref/spec)。
