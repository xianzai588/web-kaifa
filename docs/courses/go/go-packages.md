# 包与模块的实际组织

建立两个文件，把函数放到可导入的calc包。

## 包是源码分组，模块是项目边界

包把同一个目录里的 Go 源码组织到一起；模块由 go.mod 标明项目路径、Go 版本要求和依赖。一个模块可以有多个包，本节用入口 main 包调用子目录 calc 包。

**目录里的文件不因出现在屏幕上就自动可调用；包外使用函数需要正确 import 和导出的名字。** 已学前置是 [函数](../../../index.html#/learn/go/go-functions) 与 [错误处理](../../../index.html#/learn/go/go-errors)。标准库 fmt 随 Go 安装，不用另外下载。

### 就地练习：路径从哪里来

模块为example.com/book/packages，函数在calc/add.go。写出main的导入路径、调用名和calc文件的package名。

### 参考核对：路径从哪里来

导入example.com/book/packages/calc，调用calc.Add，文件声明package calc。路径与调用名不是同一种写法。

## 建立新的独立目录

新建 packages 文件夹，在 VS Code 打开它，终端核对正在这个目录。这个例子的导入路径与模块名字有关，不沿用别的课程模块名：

```sh
go mod init example.com/book/packages
```

创建 main.go，再创建 calc 子目录，在里面创建 add.go。最终结构应为：

```text
packages/
  go.mod
  main.go
  calc/
    add.go
```

本地模块路径是本练习的名称，不要求访问 example.com。若以前误用其他模块名，可以建立一个新的独立目录重试，避免边改 import 边猜路径。

### 就地练习：同名文件夹不等于同一模块

建立示例目录树后打开go.mod，逐项核对module行、calc目录与import。模块名若改为example.com/mine，哪个位置也要更新？

### 参考核对：同名文件夹不等于同一模块

main中对应导入路径要变为example.com/mine/calc；package calc与calc.Add不用随模块路径改名。

## 两个完整源码文件

main.go：

```go
package main

import (
	"fmt"
	// 本模块路径加 calc 子目录，找到下面定义的包。
	"example.com/book/packages/calc"
)

func main() {
	fmt.Println(calc.Add(2, 3)) // 用包名找到导出的 Add 函数。
}
```

calc/add.go：

```go
// 同一个目录内的 Go 文件属于 calc 包。
package calc

// Add 的首字母大写，因此 main 包能够导入后调用它。
func Add(a, b int) int {
	return a + b
}
```

两份文件分别保存。`calc/add.go` 的 package calc 声明它属于 calc 包；main.go 的 import 使用“模块路径 + 子目录”，找到这份本地源码。实际调用用包名 calc，不用完整路径来写函数调用。

## 从入口运行与理解结果

终端回到 packages，也就是含 go.mod 和 main.go 的目录，执行：

```sh
go run .
```

终端预期为：

```output
5
```

执行入口 main → 调用 calc.Add(2,3) → calc 包中的函数计算并返回 5 → main 的 Println 显示 5。Go 会按 import 找到本地包，不能只运行 main.go 旁边某个不相关目录的文件。

## 验证导出与路径错误

先把 Add 的定义改成小写 add，并同步试写 calc.add。包外仍不能访问小写名字，编译应失败；首字母大写的名字才会导出供其他包使用。恢复 Add 后再运行得到 5。

再在 import 的 calc 后面误加一个不存在的目录名，运行应提示找不到对应包；恢复正确路径。这两类错误分别是“找到包但不能用名字”和“连包都没找到”，不能统一通过重装 Go 插件解决。

## 独立增加一项行为

在 calc/add.go 中增加导出的 Multiply(a,b int) int，main 调用它计算 2×3 并打印 6。保持文件仍在 calc 目录、仍声明 package calc。一个包可以有多个文件，但普通源码文件的 package 名称要一致。

### 参考答案

在原 calc/add.go 中保留 Add，增加 Multiply。完整文件如下：

```go
package calc

func Add(a, b int) int { return a + b }
func Multiply(a, b int) int { return a * b }
```

main.go：

```go
package main

import (
    "fmt"
    "example.com/book/packages/calc"
)

func main() {
    fmt.Println(calc.Add(2, 3))
    fmt.Println(calc.Multiply(2, 3))
}
```

在 module 为 example.com/book/packages 的目录保存两个文件，运行 go run .，得到两行5、6。编译时先按 import 找包，再检查导出名字；把 Multiply 改小写会在包外调用处失败。只在 main 里写 Multiply 而不加 calc.，也不会自动引入这个名字。

参考：[Go 官方模块教程](https://go.dev/doc/tutorial/create-module)。

## 导入、初始化与依赖管理

同目录普通源码属于同一个包；导入写包的路径，调用通常写该包声明的名字。名字冲突时可用别名，例如 `import stdjson "encoding/json"`；`_ "某包"` 只为初始化副作用导入，不提供可调用名字，常见于驱动注册。点导入会隐藏名字来源，入门项目避免使用。

被导入包先初始化包级变量，再运行 init，最后才进入 main；init 不手动调用，也不带参数和结果。包之间不能循环导入；若 calc 又依赖 main，需要调整共同数据或依赖方向，不能靠改 import 别名解决。internal 目录还受父目录树的导入范围限制，不是“同仓库任何位置都能用”。

第三方包按官方文档使用 `go get 包路径@版本`；`go mod tidy` 整理源码真实需要的依赖，go.sum 保存下载内容校验。提交 go.mod 与 go.sum，别提交模块缓存。GOPROXY 决定下载来源，GOPRIVATE 告诉工具哪些路径按私有模块处理；它们不是给任意私有仓库自动授予权限。

### 就地练习：别名不会解决循环

假设calc又导入入口包，给两边import加不同别名能否解决循环？画出依赖箭头，并提出拆出公共类型的方向。

### 参考核对：别名不会解决循环

别名只改文件里的引用名，循环仍存在。让入口依赖calc，公共类型放在双方都能依赖且不反向引用入口的包中。
