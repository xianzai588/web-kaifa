# 实战 词频统计与稳定排名

把字符串、map、切片、结构体和排序连成一个命令行工具。

## 把规则变成可以手算的例子

输入一段短文字，按空白拆词，统一大小写，统计次数；最后按次数从多到少排列，同次数时按字符串顺序排列。标点保持原样，中文按空白分开的片段算词，不做自然语言分词。

**先固定分词、大小写与并列规则，再写代码；不能把 map 的遍历次序叫做排名。** 前置包括字符串、[map](../../../index.html#/learn/go/go-maps)、切片、结构体、函数返回值与 [排序](../../../index.html#/learn/go/go-sort)。

| 输入 | 有顺序的结果 | 为什么 |
| --- | --- | --- |
| Go go WEB | go:2、web:1 | go 大小写合并，次数较多 |
| b a | a:1、b:1 | 次数相同，词名决定顺序 |
| Go, go | go:1、go,:1 | 逗号保留，形成两个不同键 |
| 只有空格 | 零条记录 | 没有可统计的词 |

### 就地练习：手算标点的影响

按本项目规则统计“Go go, GO”，先写键、次数和最终顺序，再运行。

### 参考核对：手算标点的影响

go为2，go,为1；顺序go:2、go,:1。只按空白分词，不去除标点。

## 先认识本项目新用到的四个写法

命令行参数是启动程序时写在命令后的文字。os.Args 是字符串切片，第 0 项是程序路径，后面才是你给程序的参数。`strings.Join(os.Args[1:]," ")` 将后续参数用空格连接成一段文字；不是从终端一直等待输入。

`make([]Entry,0,len(counts))` 先建立一个长度为 0 的结果切片，容量预留为不同单词的个数。长度是实际记录数，容量是已预留空间；append 才逐条加入记录。如果一开始把长度设成 len(counts) 再追加，就会留下多余的空记录。

`sort.Slice` 接收切片和一个比较函数。`func(i,j int) bool { ... }` 是没有名字的函数，作为参数交给排序工具，工具需要比较两项时才调用它。i、j 是当前比较项的下标；返回 true 表示 i 这项应该在 j 前面。比较规则必须同时处理次数不同和次数相同两种情况。

遍历 map 时，`for word, count := range counts` 可以接收两个结果：**第一个是键，第二个是这个键对应的值。** 这里 word 是单词字符串，count 是该词的整数次数；与遍历切片时“下标、元素”的组合不同。每轮把这一对数据放入一个 Entry，再追加到结果切片，之后才排序。

### 就地练习：长度从零还是从键数开始

若counts有两键，对比make([]Entry,0,2)与make([]Entry,2)，两者再各append两条记录后长度多少？

### 参考核对：长度从零还是从键数开始

分别为2和4；第二种已有两个零值记录，追加会留下多余项。容量预留不能写成初始长度。

## 完整源码与启动位置

用 VS Code 打开独立目录 `exercises/go/wordfreq`，该目录已有 go.mod，需要 Go 1.22 及以上版本，无第三方包。main.go 完整内容如下；从空目录重写时先按第一节创建独立模块，再保存这份代码。

```go
package main

import (
	"fmt"
	"os"
	"sort"
	"strings"
)

// 一条排名记录同时保存词名和出现次数。
type Entry struct {
	Word  string
	Count int
}

// Count 按空白拆词并统一大小写；标点仍是单词的一部分。
func Count(text string) []Entry {
	counts := make(map[string]int) // 先用键值表累加每个词的次数。
	for _, word := range strings.Fields(text) {
		counts[strings.ToLower(word)]++
	}
	// 长度 0 表示还没有记录，容量只预留空间；后面用 append 添加。
	result := make([]Entry, 0, len(counts))
	// map的两个结果是单词键和次数值；把一对键值转成一条排名记录。
	for word, count := range counts {
		result = append(result, Entry{Word: word, Count: count})
	}
	// 把比较函数交给排序工具：i、j 是两项下标，true 表示 i 应在前面。
	sort.Slice(result, func(i, j int) bool {
		if result[i].Count != result[j].Count {
			return result[i].Count > result[j].Count // 次数多的排在前面。
		}
		return result[i].Word < result[j].Word // 并列时用词名决定顺序。
	})
	return result
}

func main() {
	text := "Go go WEB" // 没有命令行参数时使用这个默认短文本。
	if len(os.Args) > 1 {
		// 第 0 项是程序路径；这里只合并用户传入的后续参数。
		text = strings.Join(os.Args[1:], " ")
	}
	for _, item := range Count(text) {
		fmt.Printf("%s:%d\n", item.Word, item.Count) // 每项打印一行“词:次数”。
	}
}
```

终端在 wordfreq 目录执行：

```sh
go run .
```

预期输出：

```output
go:2
web:1
```

程序打印后就结束，不会监听网络或保存文件。使用自己的参数时例如：

```sh
go run . "b a"
```

这次预期按行输出 a:1、b:1。引号让带空格的文字作为一项传给程序；不同终端处理引号会有差异，但本例也支持多个普通单词参数，因为程序会重新 Join。

## 沿数据流读懂 Count

Fields 得到词切片 → ToLower 统一每个词 → map 累加次数 → 转成 []Entry → 按比较函数排序 → return 排名。map 用于快速找计数；切片用于明确保存输出次序，它们各做一件事。

比较 go:2 与 web:1，次数不同，2>1，所以 go 在前。比较 b:1 与 a:1，次数相同，比较词名，a 在前。**比较函数不是手写一次“排序结束”，而是定义每次比较时的规则；排序工具会多次调用它。**

main 接收 Count 的结果，range 逐条取 Entry，再用 %s 显示 Word、%d 显示 Count。空文本得到长度 0 的结果，输出循环执行零次。

## 验证并列、空白与实现错误

依次运行默认输入、b a、`"z z a"`、只含空格的参数，预期为两条默认结果、a 后 b、z:2 后 a:1、无输出。再暂时把次数比较的 > 改为 <，z z a 会暴露排序方向错误；恢复 > 后重跑。

空字符串参数在部分 PowerShell 版本中可能被省略，传只含空格的 `" "` 更便于验证空词集合。不要拿“传参被省略后用了默认文本”当作分词函数出错。目录 README 的 `go test ./...` 覆盖空白、大小写、并列、中文空白分隔和标点保留；测试文件中的表驱动组织方式可在之后扩展，不影响当前逐项手动核对。

## 合上参考独立完成一个变式

先重写核心 Count，再在 main 只输出前两条。先判断结果长度再决定输出范围，不能对空结果直接切 [:2]。用零词、一词、两词、三词分别预测并验证。

### 参考答案

复用上面的 Count 数据处理规则，main 自行决定输出范围。每次 n 先设2，再缩至当前记录数；空结果取 [:0] 合法，不访问不存在项目。三词同次数时 a、b 在前，c 被 Top2 截掉。

下面是可直接替换的完整 `main.go`。在本节独立模块中保存后运行 `go run .`。

```go
package main

import (
	"fmt"
	"sort"
	"strings"
)

// 一条排名记录同时保存词名和出现次数。
type Entry struct {
	Word  string
	Count int
}

// Count 按空白拆词并统一大小写；标点仍是单词的一部分。
func Count(text string) []Entry {
	counts := make(map[string]int) // 先用键值表累加每个词的次数。
	for _, word := range strings.Fields(text) {
		counts[strings.ToLower(word)]++
	}
	// 长度 0 表示还没有记录，容量只预留空间；后面用 append 添加。
	result := make([]Entry, 0, len(counts))
	// map的两个结果是单词键和次数值；把一对键值转成一条排名记录。
	for word, count := range counts {
		result = append(result, Entry{Word: word, Count: count})
	}
	// 把比较函数交给排序工具：i、j 是两项下标，true 表示 i 应在前面。
	sort.Slice(result, func(i, j int) bool {
		if result[i].Count != result[j].Count {
			return result[i].Count > result[j].Count // 次数多的排在前面。
		}
		return result[i].Word < result[j].Word // 并列时用词名决定顺序。
	})
	return result
}

func main() {
    for _, text := range []string{" ", "a", "b a", "c b a"} {
        result := Count(text)
        n := 2
        if len(result) < n { n = len(result) }
        fmt.Printf("输入 %q\n", text)
        for _, item := range result[:n] {
            fmt.Printf("%s:%d\n", item.Word, item.Count)
        }
    }
}
```

预期结果：

```output
输入 " "
输入 "a"
a:1
输入 "b a"
a:1
b:1
输入 "c b a"
a:1
b:1
```

## 把参数规则和分词规则分别验证

命令行参数由终端先解释，再交给 os.Args。程序内的 Count 只应依赖收到的字符串，不应同时猜测引号、读取文件和修改全局状态。先对 Count 单独测空白、大小写、并列与标点，再测 main 的传参行为，失败时才知道该查哪层。

词频内存用量随不同词数量增长；超大输入需要限制大小或流式处理。当前按字符串顺序比较词名，不做语言相关排序或 Unicode 规范化；这不是分词器，也不承诺把所有看起来相同的词形合并。

### 就地练习：分开检验传参和计算

命令行传空字符串却显示默认示例时，先直接调用Count("")应是什么结果？为什么要把这一步与os.Args分开检查？

### 参考核对：分开检验传参和计算

Count空文本应返回零条记录。终端可能省略空参数，默认文本来自main规则；分层能辨别参数问题与统计问题。
