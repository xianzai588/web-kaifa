# 实战 学习时长计算器

只用已学的变量、函数和条件完成一个小程序。

## 先写清输入、规则与输出

这个小程序用“每天计划分钟数 × 天数”得到计划总时长。总时长至少 60 分钟时显示达到目标，否则提示继续安排。输入直接写在源码中，不从终端读取，也不保存实际学习记录。

**先从已学知识独立写，再用参考核对；运行参考不代表你已经掌握项目。** 前置是变量、乘法、函数、Printf、if 与 [作用域](../../../index.html#/learn/go/go-scope)。分钟数与天数都只使用小的非负整数。

| 输入 | 手算总时长 | 第二行预期 |
| --- | --- | --- |
| 每天 20 分钟、3 天 | 60 | 已达到本次一小时目标 |
| 每天 15 分钟、3 天 | 45 | 继续安排下一次练习 |
| 每天 20 分钟、0 天 | 0 | 继续安排下一次练习 |

### 就地练习：先给边界写预期

只按任务规则，手算20×3、15×3、20×0的总量与提示，不先看参考代码。

### 参考核对：先给边界写预期

总量60、45、0；按一小时目标依次达标、未达标、未达标。运行参考不会替代这份预测。

## 在写代码之前决定边界

0 天表示没有安排，总时长应该是 0；负天数在这个项目没有业务含义。先确认输入再计算，比算出负总时长后仅显示“未达标”更容易发现错误。本课只用小整数，避免整数乘法溢出；以后接收用户输入时还要限制最大值。

把目标写成 `const targetMinutes = 90`，函数只计算总时长，main 再判断是否达到目标。这样改目标不必修改乘法，改输入也不用修改分支。判断用 >= 而非 >，因为恰好达到 90 也算达标。

### 就地练习：目标的临界值

将目标约定为90，准备总量89、90、91三组小整数输入。写出>=和>各自的判断，找出能区分二者的一组。

### 参考核对：目标的临界值

>=依次false、true、true；>依次false、false、true。恰好90能检出错误比较符。

## 打开目录并主动运行

可 [下载源码 ZIP](../../../assets/downloads/go-study-minutes.zip)，解压后用 VS Code 打开 study-minutes 文件夹；仓库内的对应目录是 `exercises/go/study-minutes`。该目录已有自己的 go.mod，需要已安装 Go 1.22 及以上版本，无第三方包。

先看 main.go，下面是它的完整内容。若从空目录重写，按第一节初始化自己的独立模块；不要把下面代码追加到现有 main 函数后。

```go
package main

import "fmt"

// TotalMinutes 将每天的分钟数和天数相乘，返回计划总分钟数。
func TotalMinutes(minutes, days int) int {
	return minutes * days
}

func main() {
	minutes := 20 // 输入：每天计划练习 20 分钟。
	days := 3     // 输入：计划练习 3 天。
	total := TotalMinutes(minutes, days)
	// %d 依次替换为 days 与 total，两个位置不要颠倒。
	fmt.Printf("%d 天共练习 %d 分钟\n", days, total)
	if total >= 60 {
		fmt.Println("已达到本次一小时目标")
	} else {
		fmt.Println("继续安排下一次练习")
	}
}
```

终端当前目录必须是包含这个 main.go 和 go.mod 的 study-minutes，保存后执行：

```sh
go run .
```

默认终端输出：

```output
3 天共练习 60 分钟
已达到本次一小时目标
```

程序打印后结束。修改源码并保存后，必须再运行一次，结果才会变化。

## 按数据流解释每一步

main 先准备 20 与 3，调用 TotalMinutes。参数 minutes、days 接收这次的输入副本，计算 20×3，并 return 60。main 的 total 保存结果；Printf 的第一个 %d 对应 days，第二个 %d 对应 total。

最后判断 total>=60。60 也算达标，所以进入第一个分支。TotalMinutes 只计算整数，不负责显示提示；main 决定怎样向人展示结果。

### 就地练习：参数位置互换

用minutes=15、days=4跟踪TotalMinutes返回值与Printf两项。若仅把Printf参数换序，计算结果是否也变了？

### 参考核对：参数位置互换

计算仍为60；换序会显示“60天共练习4分钟”，是展示位置错误，不能因乘法可交换而交换输出含义。

## 正常、零值与规则错误

只把 minutes 改为 15，days 仍为 3，先写两行预期再运行；恢复 20，再把 days 改为 0。核对上表后，尝试把判断错写成 total>60，观察恰好 60 时会错误地显示未达标，最后恢复 >=。

若输入负数，现有计算仍会做乘法；这不符合项目的有效输入前提。先标记限制，学习 error 后再增加输入校验，不把未实现的校验说成已有功能。测试章节之后可以在本目录执行 `go test ./...` 验证现有基础测试，此时不用先理解测试文件。

## 合上参考，完成一个变式

从空 main.go 写出自己的版本，并把目标改成 90 分钟，用 30×3、20×3、0 天分别验收达标、未达标、未达标。留下自己的源码、启动命令、三组实际结果，解释每个参数和分支。

### 参考答案

先校验，再计算，再输出并判断。30×3 恰好等于目标，故达标；改为 20×3 时第一行为 60 分钟、第二行为继续安排；days 为 0 时是 0 分钟、继续安排。若输入为负，main 提前 return，只打印错误，不继续输出总时长。

下面是可直接替换的完整 `main.go`。在本节独立模块中保存后运行 `go run .`。

```go
package main

import "fmt"

func TotalMinutes(minutes, days int) int {
    return minutes * days
}

func main() {
	const targetMinutes = 90
	minutes := 30
	days := 3
	if minutes < 0 || days < 0 {
		fmt.Println("分钟数和天数不能为负")
		return
	}
	total := TotalMinutes(minutes, days)
	fmt.Printf("%d 天共练习 %d 分钟\n", days, total)
	if total >= targetMinutes {
		fmt.Println("已达到本次目标")
	} else {
		fmt.Println("继续安排下一次练习")
	}
}
```

预期结果：

```output
3 天共练习 90 分钟
已达到本次目标
```
