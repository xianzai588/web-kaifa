# 函数参数与返回值

定义一个 Add 函数，区分定义、调用和返回。

## 把输入、计算、结果分开

**函数定义说明怎样计算，函数调用才真正执行一次计算。** `func Add(a int, b int) int` 可以拆成：func 声明函数、Add 是函数名、a 和 b 是参数、最后一个 int 是返回结果的类型。

参数是在函数内部使用的名字；调用时写 `Add(2, 3)`，数字 2、3 是这次提供的值。每次调用都可以提供不同的值。同一行也可以把相同类型参数简写为 `a, b int`，本节先用展开形式看清类型。

`return` 把结果交回调用位置，并结束这次函数调用。函数没有返回值时可不写最后的类型，也能单独写 `return` 结束；main 的打印则是另外一次函数调用。

### 就地练习：返回但不显示

在原程序中保留Add定义，把main里的两句改为只调用 `Add(2,3)`。预测终端，然后恢复接收并打印结果。

### 参考核对：返回但不显示

调用会计算并返回5，但没人显示它，所以终端没有这一行。恢复Println后才看见5。

## 无返回值、可变参数与函数值

同类型参数可以写成 `func Add(a, b int) int`。没有结果时不写返回类型，例如 `func Greet(name string)`，其内部可以打印，也可以单独写 return 提前结束。带 int 返回值的函数则要确保每条可能走到的正常路径都返回 int。

可变参数将数量不固定的同类型值收进一个序列，写法是最后一个参数 `values ...int`。这段先认识语法，学完切片与 range 后再实际运行求和版：

```go
func Sum(values ...int) int {
    total := 0
    for _, value := range values {
        total += value
    }
    return total
}
// 调用：Sum() 为 0，Sum(2, 3) 为 5。
```

函数本身也可以保存在变量里：main 内写 `calculate := Add`，再写 `fmt.Println(calculate(2, 3))`，仍得到 5。右边不带括号是取函数值，带括号是现在调用它。匿名函数没有声明名字，例如 `double := func(n int) int { return n * 2 }`；然后 `double(4)` 得到 8。

**本课必做任务只用普通的双参数函数。** 多返回值在 [下一阶段](go-returns.md) 单独学习；闭包如何访问外层变量，在 [作用域课](go-scope.md) 继续实验。

### 就地练习：取函数还是调用

在已有Add定义的main内写 `calculate := Add`，打印 `calculate(4,5)`。说明赋值那一行有没有立刻执行加法。

### 参考核对：取函数还是调用

取函数值时没有括号，不做加法；后面调用才得到9。不要写成calculate := Add(4,5)后还把整数当函数调用。

## 先运行一个小例子

在已初始化的独立 Go 练习目录中，把下面完整代码保存为 main.go。本节替换原文件，不在文件末尾追加另一份 main 函数。

```go
package main

import "fmt"

// Add 接收两个整数，返回一个整数；定义本身不会启动计算。
func Add(a int, b int) int {
	return a + b // 把计算结果交回调用处，而不是直接打印。
}

func main() {
	// 2 传给 a、3 传给 b；调用结束后 result 接住返回的 5。
	result := Add(2, 3)
	fmt.Println(result)
}
```

在这个目录的终端运行：

```sh
go run .
```

预期输出：

```output
5
```

## 逐步读懂这个例子

Add(2,3) 把 2 与 3 传入 a、b。函数计算 a+b，return 把 5 交回调用处。result 保存这个返回值，再由 main 打印。Add 不负责输出，main 负责输出，两者可以独立理解。

数据的路线是 `2、3 → Add 的 a、b → a+b 得到 5 → return 5 → result → Println`。`result` 与 a、b 是三个不同名字。函数在文件中写在 main 上面，不代表它会在 main 之前自动执行。

如果只调用 `Add(2, 3)` 而不接收、打印结果，运算仍可发生，但终端不会因此显示 5。**“返回结果”和“显示结果”是不同的职责。**

## 自己改一处再运行

改成 Add(-2,3) 和 Add(0,0)，然后写一个 Multiply 函数。

### 参考答案

先确认 Multiply 输入两个 int，输出一个 int，再返回乘积。main 负责显示结果；函数定义在上方并不会让它自动运行。五行分别验收相加、零值、普通相乘、零乘数和负乘数。

下面是可直接替换的完整 `main.go`。在本节独立模块中保存后运行 `go run .`。

```go
package main

import "fmt"

func Add(a, b int) int {
    return a + b
}

func Multiply(a, b int) int {
    return a * b
}

func main() {
	fmt.Println(Add(-2, 3))
	fmt.Println(Add(0, 0))
	fmt.Println(Multiply(2, 3))
	fmt.Println(Multiply(0, 3))
	fmt.Println(Multiply(-2, 3))
}
```

预期结果：

```output
1
0
6
0
-6
```

## 为什么删掉 return 后编译失败

把 `return a+b` 换成 `fmt.Println(a+b)`，函数可能显示数字，但声明仍承诺返回 int，编译器会报缺少返回值。应根据函数职责修复：计算函数恢复 return；只负责显示的函数则去掉结果类型，调用处也不再把它当作一个值使用。

## 亲手检验参数与返回值

调用 Add(-2,3) 应得到 1；Add(0,0) 应得到 0。把 Add 的 return 改成 `fmt.Println(a+b)` 后运行，会发现返回 int 的函数不能用打印来代替返回；恢复 return 后再验证。

独立写 Multiply 时，先写函数输入/结果类型，再写 `return a*b`，最后在 main 调用并打印。用 2×3、0×3、-2×3 分别验收 6、0、-6。

参考：[Go 语言规范](https://go.dev/ref/spec)。
