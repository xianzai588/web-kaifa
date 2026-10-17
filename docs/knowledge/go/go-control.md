# 零值、控制流与函数：从输入算出可信结果

假设你要统计同学的成绩。`0` 分是真实的成绩；“没有成绩”是另一种状态。程序必须区分两者，还要拒绝 `-1`、`101` 这样的输入。下面先把变量和执行顺序讲清，再用一个完整程序把规则连起来。无需先学 C++；只需会在 VS Code 保存 `main.go` 并运行 `go run .`。

## 1. 变量、类型与零值：一个名字究竟装什么

变量是一个有名字、有类型、可更新的值。`var count int` 声明整数变量，没有指定初始值时得到 `0`。`var ready bool` 得到 `false`，`var title string` 得到空字符串 `""`。这是语言提供的**零值**，不是业务对“未知”“失败”“未填写”的自动判断。例如 `score == 0` 不能证明没有输入，因为零分合法；我们用切片长度判断是否收到任何分数。

在函数内，`total := 0` 既声明名字，又用右边的值推断类型；这里是 `int`。已有变量更新用 `total = 10`；`total += score` 是 `total = total + score` 的简写。`=` 赋值，`==` 比较是否相等，两个功能不能混用。`:=` 不能用于函数外，且同一块中至少有一个非空白名字是新声明；连续写两次 `total := ...` 会报 `no new variables on left side of :=`。

整数相除得到整数结果：`5 / 2` 是 `2`。要得到 `2.5`，必须在除法之前转成浮点数，如 `float64(total) / float64(len(scores))`。在整数除法之后再转换，丢掉的小数已经无法恢复。

### 就地练习：零分还是无输入

比较分数切片[0]与空切片，先写长度、合法平均结果或错误。

### 参考核对：零分还是无输入

[0]有一项，平均0可合法；空输入无分母，应报没有分数，不能只看数字是否为0。

## 2. if：先检查能否计算，再走正常路径

`if len(scores) == 0 { ... }` 的条件必须是布尔值。花括号标出这条分支要执行的语句；Go 不要求条件外围括号。检查无输入后提前 `return`，下面就能安全使用长度。用 `score < 0 || score > 100` 检查两个非法范围；`||` 表示任一成立就非法，`&&` 表示两者同时成立。把这里错误改成 `&&`，没有整数能同时小于零又大于一百，校验就失效了。

`if value, err := read(); err != nil { ... }` 中声明的名字只在这整个 `if`（包括 `else`）里可用；这是带初始化语句的写法，不是两个独立条件。第一次写函数可先把声明和检查分两行，确认执行顺序再缩短。

### 就地练习：范围用或不是且

把-1、101代入score<0 || score>100，再代入&&，各写布尔结果。

### 参考核对：范围用或不是且

或能拒绝两端越界；且不可能同时成立，错误连接会放过所有这些非法值。

## 3. 一组输入与 for：先认识最小列表，再遍历

`scores := []int{60, 80}` 创建一个整数列表，正式名称是切片：`[]` 表示长度可变，`int` 表示每个元素必须是整数，花括号内是初始元素。此课暂时只使用“保存一组输入、取得长度、逐项读取”三种操作；底层数组、容量和追加留给下一课。`len(scores)` 得到元素数量 `2`；`[]int{}` 是没有元素的输入。`[][]int` 是“每个元素又是一组整数”的列表，只用于把几组验收数据依次交给同一函数。

三段式 `for i := 1; i <= n; i++` 依次做初始化、判断、循环体、更新，然后再次判断。`n=3` 时 `i` 是 `1、2、3`，累计 `1+2+3=6`；`n=0` 时首次判断就失败，循环一次也不执行。误写 `< n` 会少算最后一项，这是典型边界错误。

条件式 `for remaining > 0` 类似其他语言的 while：每轮检查条件，由循环体负责更新变量；忘记更新可能无限循环。`for { ... }` 没有停止条件，通常靠 `break`、`return` 或取消信号退出，不建议初学者在不确定时直接运行。

遍历分数使用 `for index, score := range scores`。`index` 是从零开始的索引，`score` 是这一轮取得的元素值。只要元素值时写 `for _, score := range scores`，`_` 表示明确忽略索引。`range` 对空切片执行零次。遍历变量得到的是元素的值；给 `score` 重新赋值不会自动改动 `scores[index]`。想改原切片应通过索引赋值。

### switch：按离散结果分支

下面是**概念片段**，放在 main 中已有 `score := 80` 后使用：

```go
switch {
case score < 0 || score > 100:
	fmt.Println("非法分数")
case score >= 60:
	fmt.Println("及格")
default:
	fmt.Println("未及格")
}
```

不写 switch 表达式时，各 case 是条件，按书写顺序取第一个成立的分支。`score=80` 输出“及格”，`101` 先被拒绝；若把及格分支放在非法检查前，101 就会误判。Go 默认不从一个 case 自动继续进入下一个，不需要每个分支补 break。带表达式的 `switch command { case "run": ... }` 适合命令名称等离散值。简单两分支用 if/else 已足够，选择结构应服务于可读性。

#### 就地练习：先拒绝再分级

给score101和60，比较先非法范围与先及格分支的结果。

#### 参考核对：先拒绝再分级

非法先排除才能把101拒绝；先>=60会让101错误通过。Go普通case不会自动贯穿。

### 就地练习：下标和分数

对[60,80]分别累计range的第一个与第二个结果，预测两个总和。

### 参考核对：下标和分数

下标和1，分数和140；忽略下标用_，不得拿位置当分数。

## 4. 函数：参数、返回值与 error 形成契约

`func SumTo(n int) (int, error)` 中 `n int` 是输入参数，`(int, error)` 表示两个返回值：结果与错误。`return 0, fmt.Errorf(...)` 表示计算失败，此时返回的零不是有效答案；`return total, nil` 表示成功。`nil` 在这里表示没有错误。调用方用 `value, err := SumTo(3)` 分别接住两个值，**先判断 err，再使用 value**。忽略错误会把失败的零伪装成正确结果。

函数参数让相同逻辑可以处理不同输入，返回值让它能被打印、组合和测试。把计算函数里所有内容都直接打印出来，会让调用者难以获得结果。函数名不是关键字；名字可换，但调用处必须同步更新。练习函数只面向这里的少量整数；`int` 有范围，下面的累加并未处理极大输入溢出，不能据此宣称支持任意整数。

### 就地练习：失败占位不是答案

写出SumTo(0)与SumTo(-1)的两个返回值含义，调用者何时可显示计算结果？

### 参考核对：失败占位不是答案

前者0,nil是有效零；后者0,error是失败占位，先检查err再用数据。

## 在 VS Code 运行完整例子

打开独立文件夹 `exercises/go/go-control`，建立 `main.go`，复制下面**完整程序**并保存。终端先确认当前目录是 `go-control`；第一次输入 `go mod init example.com/learn/go-control`，以后不用重复。运行 `go fmt ./...` 和 `go run .`；结果看终端，源码不要贴进终端。

```go
package main

import "fmt"

func SumTo(n int) (int, error) {
	if n < 0 {
		return 0, fmt.Errorf("n 不能为负数")
	}
	total := 0
	for i := 1; i <= n; i++ {
		total += i
	}
	return total, nil
}

func Average(scores []int) (float64, error) {
	if len(scores) == 0 {
		return 0, fmt.Errorf("没有分数")
	}
	total := 0
	for index, score := range scores {
		if score < 0 || score > 100 {
			return 0, fmt.Errorf("第 %d 个分数越界", index+1)
		}
		total += score
	}
	// 已先拒绝空输入；除法之前分别转换，保留1、2这类输入的0.5小数部分。
	return float64(total) / float64(len(scores)), nil
}

func main() {
	var count int
	var ready bool
	var title string
	fmt.Printf("零值：%d %t %q\n", count, ready, title)
	for _, n := range []int{3, 0, -1} {
		value, err := SumTo(n)
		if err != nil {
			fmt.Printf("SumTo(%d)：%v\n", n, err)
			continue
		}
		fmt.Printf("SumTo(%d)=%d\n", n, value)
	}
	for _, scores := range [][]int{{60, 80}, {0}, {}, {101}} {
		value, err := Average(scores)
		if err != nil {
			fmt.Printf("Average(%v)：%v\n", scores, err)
			continue
		}
		fmt.Printf("Average(%v)=%.1f\n", scores, value)
	}
	remaining := 3
	for remaining > 0 {
		remaining--
	}
	fmt.Println("条件循环剩余：", remaining)
	total := 10
	if true {
		total := 20
		fmt.Println("内层：", total)
	}
	fmt.Println("外层：", total)
}
```

精确预期输出：

```output
零值：0 false ""
SumTo(3)=6
SumTo(0)=0
SumTo(-1)：n 不能为负数
Average([60 80])=70.0
Average([0])=0.0
Average([])：没有分数
Average([101])：第 1 个分数越界
条件循环剩余： 0
内层： 20
外层： 10
```

## 5. 作用域与遮蔽：为什么“更新了”却没有改变

作用域是一个名字在源码里可以被引用的范围。花括号建立块。例子的内层 `total := 20` 声明了一个新变量，暂时遮住外层同名变量；离开 `if` 后新变量不再可见，外层仍是 `10`。这叫**遮蔽**，不是赋值失败。把内层改成 `total = 20`，更新的就是外层变量，最后输出会变成 `外层： 20`。

排查时用不同名字，例如 `sum` 和 `partialSum`，或让变量在最短的必要范围内存在；不要看到 `:=` 就机械替换，因为真正的新变量仍需要声明。尤其注意 `err`：内层检查用的新 `err` 并不会总是更新外层的 `err`。用有意的命名和提前返回，比依赖最后检查一个外层错误更清楚。

### 就地练习：遮蔽与赋值

内层total:=20改为total=20后，预测外层最后值，再运行。

### 参考核对：遮蔽与赋值

原版外层10，改赋值后20；:=在内层创建另一绑定，=更新已有变量。

## 改一个条件

每次只改一处，先写预测再运行：

1. 把SumTo里的 `i <= n` 改成 `i < n`，输入3会返回多少？输入0会变吗？
2. 在Average的验收输入里增加 `{1, 2}`，平均值应是多少？如果先做整数除法再转float64，会得到什么？
3. 把遮蔽演示内层的 `total := 20` 改成 `total = 20`，外层最终输出多少？

### 参考答案

先预测再运行：把 SumTo 的 `i <= n` 改成 `i < n`，输入 `3` 会得到多少？参考答案是 `3`，循环只取 `1、2`。恢复后为 `Average` 增加输入 `{1, 2}`：正确结果 `1.5`，可以暴露整数除法错误。把内层 `:=` 改成 `=`，观察外层变成 `20`。三次修改分开进行并记录输出，避免一次改多处后不知道哪处影响结果。

自查：能手写出 `n=0` 与 `n=3` 的循环表吗？能解释合法零分与没有输入为什么不同吗？能指出函数参数、两个返回值、成功与失败分支吗？能够合上例子写出 `CountPassing(scores []int) (int, error)`，拒绝空输入和越界，统计 `>=60` 的数量，才算把知识转成可独立使用的能力。

## 对接本课任务：Passed 与 Stats

本课练习要求 Passed 判断单个分数，Stats 返回总分和平均分。上面的 Average 是原理示例，不是要求你把任务改成另一个名字。先用 `func Passed(score int) (bool, error)`：范围检查失败返回 `false,error`，合法输入返回 `score >= 60,nil`；59 是 false，60 是 true，101 是错误。再用 `func Stats(scores []int) (int, float64, error)`：先拒绝空列表，逐项校验并累加 total，最终 `return total, float64(total)/float64(len(scores)), nil`。失败可返回 `0,0,error`，调用者不能把两个零当作有效统计。

参考验收：`[60,80,100]` 返回240、80、nil；`[60,61]` 返回121、60.5、nil；空列表或越界分数返回非nil错误。先独立写，再对照 Average 的检查顺序；不必先理解下一课的底层切片实现，当前只需要列表、长度和遍历。一个函数可以返回三个值，并不要求你一次写成复杂对象。

官方参考：[变量与零值](https://go.dev/tour/basics/12)、[for](https://go.dev/tour/flowcontrol/1)、[多返回值](https://go.dev/tour/basics/6)、[语言规范：声明与作用域](https://go.dev/ref/spec#Declarations_and_scope)。
