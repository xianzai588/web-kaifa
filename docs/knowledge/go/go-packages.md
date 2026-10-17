# 拆成两个包：让模块路径、目录和 import 对上

第一份程序只有一个 `main.go`。这次把“求两个整数之和”放进可复用的 `calc` 包，主程序调用它，测试单独验证它。你会看到模块、包与文件各负责什么；无需先学其他语言。先确认 VS Code 的终端能运行 `go version`，并且会保存文件、执行 `go run .`。

## 1. 模块路径是导入地址的起点

`go.mod` 第一行可能是 `module example.com/learn/go-packages`。其中 `example.com/learn/go-packages` 是**模块路径**，不是目录的绝对路径，也不要求练习者购买这个域名。

此模块下的 `calc` 子目录提供一个包。它的导入路径是“模块路径 + 子目录”，即 `example.com/learn/go-packages/calc`。`package calc` 则声明包名，调用时通常写 `calc.Add(...)`。文件名 `math.go` 只是保存这份源码的名称，不把文件名拼进 import。

| 你看到的名字 | 此例的值 | 用在哪 |
| --- | --- | --- |
| 磁盘练习目录 | `exercises/go/go-packages` | VS Code 打开这里，终端从这里运行 |
| 模块路径 | `example.com/learn/go-packages` | `go.mod` 的 module 行 |
| 子目录 | `calc` | 把计算与测试源码放在这里 |
| 包名 | `calc` | 子目录源码写 `package calc` |
| 导入路径 | `example.com/learn/go-packages/calc` | 主程序的 import 字符串 |

**已有模块时怎么做？** 先打开已有 `go.mod`，原模块路径若是 `example.com/setup-check`，同一模块的导入就应是 `example.com/setup-check/calc`。不要照抄别人例子的 `example/go-lab/calc`，也不要反复 `go mod init` 来消除“找不到包”。这里没有远程依赖，`go get` 不能修复你自己的 import 拼错。

### 就地练习：路径三部分对应

模块为example.com/mine，子目录calc，写出import与调用名；文件名math.go是否进import？

### 参考核对：路径三部分对应

导入example.com/mine/calc，调用calc.Add；文件名不拼进包路径，不能靠go get修复自己的拼写错误。

## 2. 在 VS Code 建立明确的三个文件

以下从**新的独立目录**开始。在 `exercises/go` 新建 `go-packages`，选择“文件 → 打开文件夹”，打开它。终端用 `pwd` 确认最后一级是 `go-packages`，然后首次执行：

```powershell
go mod init example.com/learn/go-packages
```

已有该练习的 `go.mod` 时跳过初始化，并核对第一行。用资源管理器在根目录新建 `main.go`，再新建 `calc` 文件夹，在其中创建 `math.go`、`math_test.go`。保存后的结构应是：

```text
go-packages/
├── go.mod
├── main.go
└── calc/
    ├── math.go
    └── math_test.go
```

目录名 `calc/` 是文件的位置，不是让你把斜杠写进文件内容。不要在 `calc` 内再建 `go.mod`：这里仍是一个模块，只是包含两个包。

### calc/math.go：完整计算包文件

```go
package calc

func Add(a, b int) int {
	return a + b
}
```

`a, b int` 表示两个整数参数；`int` 返回值是相加结果。`Add` 首字母大写，所以同一模块的其他包可以调用；改成小写 `add` 后，主程序不能再调用 `calc.Add`。这个文件是库包，没有 `func main()`，不能把它当作独立程序 `go run math.go`。

### main.go：完整主程序文件

```go
package main

import (
	"fmt"
	"example.com/learn/go-packages/calc"
)

func main() {
	fmt.Println(calc.Add(3, 4))
}
```

执行从 `main` 开始，调用 `calc.Add(3,4)` 得到 `7`，再用 `fmt.Println` 打印。import 使用模块路径，不使用 `E:/.../calc`，也不使用 `../calc`。如果你采用了已有模块，**仅把上面 import 的模块部分改成 go.mod 中的实际值**，其他逻辑不需要改变。

### calc/math_test.go：完整测试文件

```go
package calc

import "testing"

func TestAdd(t *testing.T) {
	cases := []struct {
		name string
		a, b, want int
	}{
		{"positive", 1, 2, 3},
		{"mixed", -2, 1, -1},
		{"zero", 0, 0, 0},
		{"cancel", 5, -5, 0},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := Add(tc.a, tc.b)
			if got != tc.want {
				t.Errorf("Add(%d,%d)=%d, want %d", tc.a, tc.b, got, tc.want)
			}
		})
	}
}
```

`_test.go` 告诉 Go 这是测试文件，普通 `go run .` 不执行它。`TestAdd` 是测试入口。这里 `cases` 是验收表，每行分别提供用例名、两个输入和自己手算的预期；例如 `5 + (-5) = 0`。`t.Run` 为每行创建可定位的子测试；传入的匿名函数写法是 `func(...) { ... }`，没有函数名，它只在该用例被执行时进行比较。测试在 `calc` 同一包中，直接调用 `Add` 即可，不必给它写 `calc.Add`。

## 3. 在根目录运行，分清程序输出与测试结果

保存三个文件，终端仍在包含 `go.mod` 和 `main.go` 的 `go-packages` 根目录。逐条执行：

```powershell
go fmt ./...
go run .
go test -count=1 -v ./...
go vet ./...
```

`go run .` 应在终端输出一行 `7`。`go test` 应列出 `positive`、`mixed`、`zero`、`cancel` 四个子测试，均为 PASS，命令成功退出。根 main 包出现 `[no test files]` 正常，因为测试放在 calc 包；看 calc 的实际结果，不能把这行当成“没有测试运行”。`-count=1` 避免重复检查被测试缓存掩盖，耗时与机器路径不用和示例完全一致。

`./...` 表示当前目录与下面适用的包，所以根目录执行会包含 calc。只执行 `go test .` 时，此例只测试 main 包，不会包含子目录中的四个测试。`go vet` 成功时通常没有输出，不表示业务规则已全部验证。

### 就地练习：只测根包会漏谁

对比go test .与go test ./...，解释本例根包no test files为何不代表calc未执行。

### 参考核对：只测根包会漏谁

点只选根main；省略号还选子包。应看calc四个子测试的实际结果，go run不运行它们。

## 4. 故意改错一次，确认测试能发现问题

只把 `calc/math.go` 的 `return a + b` 改成 `return a - b`，保存再运行 `go test -count=1 -v ./...`。`positive` 应报告实际 `-1`、预期 `3`；`mixed`、`cancel` 也会失败；`zero` 仍通过，因为 `0+0` 与 `0-0` 恰好相同。再运行主程序会得到 `-1`，不是 `7`。

恢复 `+`，保存，重跑程序与测试，确认再次通过。测试故意失败的这次实验说明它确实比较了结果。不要把“一个用例仍通过”解释为整个实现正确。本例使用小整数，未提供任意大数或溢出处理。

## 5. 常见错误：先查哪一处

| 现象 | 核对与修复 |
| --- | --- |
| `package example/go-lab/calc is not in std` 或 `no required module provides package ...` | 打开 go.mod，查 module 行；主程序 import 必须是该路径加 `/calc`，再核对子目录名称 |
| `found packages calc and main` | 同目录普通源码的 package 不一致；main.go 放根目录，calc 文件放 calc/，不能三份混在根目录 |
| `undefined: calc.Add` | calc 中是否写成小写 add，或函数名拼错、文件未保存 |
| `is not a main package` | 把 calc 当成可执行程序了；回根目录 `go run .`，或在 calc 中用 `go test` |
| 根目录 test 只有 `[no test files]` | 是否只执行了 `go test .`；使用 `go test -v ./...` 并确认测试文件名是 math_test.go |
| `go.mod already exists` | 已有模块，无需重复初始化；核对当前目录，保留自己的模块信息 |

自查：关闭讲义，自己说出 module 行、包目录、package 名和 import 的对应关系，再给 Add 增加自己手算的第四种以外输入，故意改错实现证明测试会失败。阅读与复制不会替你勾选课时完成。

官方参考：[模块与包](https://go.dev/doc/code)、[go 命令](https://pkg.go.dev/cmd/go)、[testing](https://pkg.go.dev/testing)。
