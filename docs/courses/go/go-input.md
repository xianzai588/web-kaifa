# 从终端读取一行输入

读取数字和整行文字，区分空行、输入结束、转换失败与非法值。

## 先认识输入、输出与错误通道

前面的例子把分数直接写在源码中。现在让用户在程序启动后提供数据：标准输入 `os.Stdin` 默认连接终端键盘；标准输出 `os.Stdout` 默认显示正常结果；标准错误 `os.Stderr` 用来报告失败。它们也能由终端连接文件或其他程序，并不永远等于键盘和屏幕。

先会 [变量与赋值](go-variables.md)、[类型](go-types.md)、[输出](go-strings.md)、[if](go-if.md)。本节会先借标准库认识几种新写法，不要求先会自定义多返回值函数、接口或 JSON：

| 新写法 | 本节先怎样理解 | 后续系统学习 |
| --- | --- | --- |
| `n, err := 调用(...)` | 一次调用交回两项，按位置接到两个名字 | [多个返回值](go-returns.md) |
| `err != nil` | 存在失败原因；nil 表示没有错误 | [error](go-errors.md) |
| `&count` | 把 count 的地址交给读取工具，让它把数据写入这个变量 | [指针](go-pointers.md) |
| `return` | 在 main 中结束本次程序，避免失败后仍用数据计算 | [函数](go-functions.md) |

**Enter 是提交这一行，EOF 是输入流结束，Ctrl+C 是中止程序。这三者不同。** 程序在等待输入时没有新输出，可能只是还没收到你提交的数据。

### 就地练习：等待与结束

启动数字读取程序，只输入第一项3并按Enter，观察是否仍等第二项；随后输入2.5。解释Enter为什么不等于EOF。

### 参考核对：等待与结束

Scan把换行也当分隔，仍在等待第二项；收到2.5才完成两项读取并输出合计。

## 按空白读取数字：fmt.Scan

新建独立练习目录，按首课创建自己的 go.mod。下面完整代码保存为 main.go；同一目录不要放多份 main。终端执行 `go run .` 后，接着输入 `3 2.5` 并按 Enter。

```go
package main

import "fmt"

func main() {
	var count int
	var price float64
	fmt.Println("输入数量和单价，例如 3 2.5：")
	// &提供可写目标；n只数成功解析的项，不能拿部分输入继续结算。
	n, err := fmt.Scan(&count, &price)
	if err != nil {
	    fmt.Printf("读取失败，成功读入 %d 项\n", n)
	    return
	}
	if count < 0 || price < 0 {
	    fmt.Println("数量和单价不能为负")
	    return
	}
	fmt.Printf("数量 %d，单价 %.2f，合计 %.2f\n", count, price, float64(count)*price)
}

```

预期交互（提示是程序输出，第二行是你输入的内容）：

```text
输入数量和单价，例如 3 2.5：
3 2.5
数量 3，单价 2.50，合计 7.50
```

`fmt.Scan` 默认把空白分隔的片段依次解析到目标变量；这里空格和换行都可当作分隔，所以只输入 3 再按 Enter，程序还可能等第二项，不代表已经读完。`n` 是成功解析的项目数量：`3 wrong` 只成功第一项，n 为 1，err 非 nil，程序打印失败并结束，不能把 price 的零值当合法输入。

| 输入 | 观察 | 处理原因 |
| --- | --- | --- |
| `0 2.5` | 合计 0.00 | 零数量是本题允许的值 |
| `3 wrong` | 成功读入 1 项后失败 | 第二项不能解析为 float64 |
| `-1 2.5` | 数量和单价不能为负 | 解析成功，不满足业务范围 |
| 输入前就结束流 | 成功读入 0 项后失败 | 根本没有两项数据 |

示例的 float64 只用于练习输入与显示，不作为精确货币核算方案。不要写 `fmt.Scan(count)`；读取工具需要可写目标地址，所以要传 `&count`。

### 就地练习：成功一项不代表成功一次

输入 `3 wrong`，写出n及控制流，再用 `0 2.5`重试。两次能否都用price的零值继续算？

### 参考核对：成功一项不代表成功一次

错误输入时n为1，err非nil，应返回；零数量合法且解析成功，合计0.00。不能把解析失败替换为零值。

## Scan、Scanln、Scanf 怎么选

| 工具 | 输入规则 | 常见用途与限制 |
| --- | --- | --- |
| `fmt.Scan(&a, &b)` | 按空白分项，换行也可分隔 | 简短数字输入；不适合带空格的完整姓名 |
| `fmt.Scanln(&a, &b)` | 按空白分项，但本次读取受换行约束 | 期望一行中给出固定数量的项；不是“读一整行字符串” |
| `fmt.Scanf("%d,%d", &a, &b)` | 按指定格式匹配 | 要求逗号等字面分隔符；输入格式不符会失败 |
| `bufio.Scanner` | 默认逐行，Text 不含行尾换行 | 称呼、短文本、逐行处理；要检查大小限制 |
| `bufio.Reader.ReadString('\n')` | 读到指定字节，结果包含分隔符 | 需要明确处理换行和最后无换行片段时使用 |

Scanf 的 `%d`、`%f`、`%s` 分别读取相应类型，和输出格式有联系，却不代表能任意互换输入规则。比如把上个程序的读取行改为 `fmt.Scanf("%d,%f", &count, &price)`，输入要改成 `3,2.5`；原来的空格分隔会在逗号位置匹配失败。先一次只试一种读取方式，全部检查 n 与 err。

### 就地练习：分隔符也是规则

只把数字例子的读取调用换成Scanf逗号格式，分别输入3,2.5和3空格2.5。预测哪个匹配，记录n和err。

### 参考核对：分隔符也是规则

逗号输入匹配；空格输入在预期逗号处失败。Scanln也不会自动保留带空格的整行姓名。

## 读取完整一行：保留称呼中的空格

下面是独立的完整 main.go，替换数字例子后运行。启动后输入 `hello world` 并按 Enter，得到 `读到：hello world`；直接按 Enter 则得到 `读到：`。

```go
package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	// os.Stdin 是标准输入；这里交给 Scanner 按行读取。
	scanner := bufio.NewScanner(os.Stdin)
	if scanner.Scan() { // 等到一行输入或输入结束，再返回是否读到一行。
		fmt.Println("读到：" + scanner.Text()) // Text 不包含末尾的换行符。
	}
	// 正常输入结束不算读取错误；真正的异常由 Err 返回。
	err := scanner.Err()
	if err != nil {
		fmt.Println(err)
	}
}
```

`bufio.NewScanner(os.Stdin)` 创建读取工具，`Scan()` 尝试取得下一行；成功时为 true，此后 `Text()` 才对应这一行。读取失败或输入结束时 Scan 为 false，再看 Err：nil 表示正常结束，非 nil 表示读取异常。

空行是一条长度为 0 的记录，因此 Scan 为 true；没有任何输入就 EOF，则 Scan 为 false。若末尾有文字但没有换行，Scanner 仍可把这段文字作为最后一行返回。Text 保留行内空格，不保留 `\n` 或 Windows 行尾的 `\r\n`。

### 参考答案：空行与输入结束

本例输入 `小 林` 后输出 `读到：小 林`。只提交空行时输出 `读到：`；直接结束且没有数据则不打印这段前缀。下面独立问候题会把这三种情况分别给出提示，而不是把它们都叫“输入失败”。

### 就地练习：空行与没有一行

用整行例子分别提交空行、hello world、输入前EOF，记录有没有“读到：”前缀。

### 参考核对：空行与没有一行

空行有前缀但后面为空；文字保留中间空格；无数据EOF不输出前缀，三者不是同一情况。

## 一整行转为整数，并校验范围

字符串“20”与整数 20 不同。`strings.TrimSpace` 去除两端空白，`strconv.Atoi` 把十进制文字解析为 int，并返回错误。**解析成功只说明格式能变成整数，不说明它适合当前业务。** 本例把分钟限制为 0–1440。

```go
package main

import (
    "bufio"
    "fmt"
    "os"
    "strconv"
    "strings"
)

func main() {
    scanner := bufio.NewScanner(os.Stdin)
    fmt.Println("输入本次练习分钟数：")
    if !scanner.Scan() {
        if scanner.Err() != nil {
            fmt.Println("读取失败：", scanner.Err())
        } else {
            fmt.Println("没有输入")
        }
        return
    }
    text := strings.TrimSpace(scanner.Text())
    if text == "" {
        fmt.Println("输入为空")
        return
    }
    // 先验证文字能否转成整数，再在后面判断分钟数是否在业务范围内。
    minutes, err := strconv.Atoi(text)
    if err != nil {
        fmt.Println("请输入整数分钟")
        return
    }
    if minutes < 0 || minutes > 1440 {
        fmt.Println("分钟数必须在 0 到 1440 之间")
        return
    }
    fmt.Printf("本次计划 %d 分钟\n", minutes)
}

```

保存运行后逐次输入 `20`、空行、`abc`、`-1`、`1441`、`0`；应分别得到计划20分钟、输入为空、请输入整数分钟、范围错误、范围错误、计划0分钟。不要用默认0代替解析失败；否则“写错了”与“确实输入0”就无法区分。

### 就地练习：解析和范围各负责什么

对照完整程序，为 `abc`、`-1`、`0`、`1441`、只含空格的行写出应进入的分支，再分别运行。

### 参考核对：解析和范围各负责什么

依次为整数解析失败、范围失败、合法0、范围失败、输入为空。不能只检查Atoi的err。

## EOF、重定向与不要混用读取器

macOS/Linux 在没有待提交文字的行首通常用 Ctrl+D 发送 EOF；Windows 常见为 Ctrl+Z 后按 Enter，具体取决于终端。Ctrl+C 会终止程序，不会正常走完所有输入分支。

若 input.txt 是 UTF-8 文件，内容为 hello world，可在 macOS/Linux 或 cmd 执行：

```sh
go run . < input.txt
```

PowerShell 的 `<` 不是同样的输入重定向语法。可用 `Get-Content -Raw -Encoding utf8 input.txt | go run .` 做文本管道实验；它会经过 PowerShell 的文本编码和换行处理，不能视为任意二进制字节原样转发。初学时也可直接交互输入。

同一个程序不要先用 fmt.Scan 读取一项，再随意新建 Scanner 或 Reader 从同一 Stdin 接着读整行。前者可能留下换行，后者也可能提前缓冲后续数据，导致空行、漏读或等待；一次选择一个读取策略。需要混合字段时，统一按行读取，再用 strings.Fields 或 strconv 解析。

### 就地练习：统一一份读取策略

设计输入“3”后下一行“hello world”的两步读取，只写方案：选择同一个Scanner按行读，再解析第一行。解释为什么不混用新读取器。

### 参考核对：统一一份读取策略

一份Scanner拥有输入缓冲；第一行用Atoi解析，第二行按Text保留空格。混用Scan和新Scanner可能遇到残留换行或已被缓冲的数据。

## 长行、循环与缓冲输出：学完后回看

Scanner 默认单项最大缓冲约 64 KiB，适合短行。要观察超长失败，可在 NewScanner 后、第一次 Scan 前临时加：

```go
scanner.Buffer(make([]byte, 16), 32)
```

make 在 [切片课](go-slices.md) 系统学习；这里先把它看作准备16字节空间、允许增长到32字节。输入40个 a 后 Scan 为 false，Err 包含 `token too long`。恢复默认后再读正常短行，不要通过删掉 Err 检查掩盖错误。

学完 [循环](go-for.md) 后，可以把单次 if 改成 `for scanner.Scan() { fmt.Println(scanner.Text()) }` 处理所有行，循环结束仍要检查 Err。如果改用 ReadString，最后一次可能同时拿到“有内容的字符串”和 `io.EOF`，应先处理这段内容，再结束，不能只看有错误就丢掉最后一行。

大量输出时可用 bufio.NewWriter(os.Stdout) 暂存数据，再 Flush 写出；交互提示若没 Flush，用户可能看不到提示而一直等待。缓冲与普通 Print 的差别在于什么时候把数据真正交给下游，不是换了打印内容。

### 就地练习：检查长行失败

在单行示例第一次Scan前加入文中的32字节限制，输入40个a。记录Scan、Err与正常短行的差别，再恢复限制。

### 参考核对：检查长行失败

长行使Scan为false且Err报告token too long；普通EOF的Err为nil。应报告异常，不继续把Text当有效输入。

## 合上参考，独立写称呼问候

只读取一行。输入阿青显示“你好，阿青”；空行显示“称呼为空”；直接 EOF 显示“没有输入”；临时32字节限制下输入40个 a，显示“读取错误”及实际异常。先写四种预期，再写自己的程序，每种输出后都应结束。

### 参考答案：问候的四条路径

先读行，再排除异常，然后判断有没有行，最后才判断行内容。这样的次序能把异常、EOF、空行和有效称呼分开。

```go
package main

import (
    "bufio"
    "fmt"
    "os"
)

func main() {
    scanner := bufio.NewScanner(os.Stdin)
    // 长行实验时在此加入 scanner.Buffer(make([]byte, 16), 32)。
    hasLine := scanner.Scan()
    if scanner.Err() != nil {
        fmt.Println("读取错误：", scanner.Err())
        return
    }
    if !hasLine {
        fmt.Println("没有输入")
        return
    }
    name := scanner.Text()
    if name == "" {
        fmt.Println("称呼为空")
        return
    }
    fmt.Println("你好，" + name)
}

```

输入阿青并提交后预期：

```output
你好，阿青
```

直接提交空行预期“称呼为空”，直接 EOF 预期“没有输入”。加入临时 Buffer 限制后再输入40个 a，预期包含“读取错误”和 `token too long`，不会继续显示问候。删去限制后再输入阿青，确认恢复。若业务不允许只含空格的名字，在判断空字符串前加入 TrimSpace，明确告诉用户这条额外规则。

参考：[fmt 扫描规则](https://pkg.go.dev/fmt#hdr-Scanning)、[bufio.Scanner](https://pkg.go.dev/bufio#Scanner)、[strconv.Atoi](https://pkg.go.dev/strconv#Atoi)。
