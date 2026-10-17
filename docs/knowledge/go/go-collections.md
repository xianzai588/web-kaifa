# slice、map 与 Unicode：数据怎样被保存和遍历

词频统计看起来只是加一，但实际上要决定：怎样拆词、大小写是否算同一个词、并列怎么排序、中文字符串怎样计数。数组、切片、map 和字符串分别承担不同职责。先学会预测共享和缺失值，再写完整统计；否则“这次打印正常”可能只是偶然。

## 数组与切片：长度和容量不是同一件事

`[3]int{1,2,3}` 是固定长度数组；`[]int{1,2,3}` 是切片。切片描述一段底层数组，包含起点、长度和容量。`len` 是当前可访问的元素数，`cap` 是从起点到该底层数组末尾能容纳的元素数。`a[:2]` 取前两个元素，右边界不包含在结果中。它通常共享底层数组，因此 `b[0]=9` 可以改变 `a[0]`。

`append` 必须接住返回值，例如 `a = append(a, 4)`。容量足够时可能复用旧数组，不足时会分配新数组，因此不能用一个例子断言 append 总共享或总复制。为了独立保存整数切片，用 `make` 后 `copy`。这复制的是元素值；若元素是指针、map 或切片，内部引用的对象仍可能共享，这是浅复制。

这段是**独立观察片段**，放进 main 后运行：`items := make([]int, 2, 5)`，接着 `fmt.Println(len(items), cap(items), items)`，预期 `2 5 [0 0]`。make 的第二参数创建两个当前元素，第三参数预留容量五；不能因为 cap=5 就访问 items[4]，可访问索引必须小于 len=2。执行 `items = append(items, 7)` 后再打印，预期 `3 5 [0 0 7]`。容量是追加能力，不是已经存在的长度。

### 就地练习：容量不是下标范围

make([]int,2,5)后写出合法索引；只预留容量长度0的目标copy能复制几项？

### 参考核对：容量不是下标范围

索引0、1；目标长度0时copy为0，容量不创建可索引元素。

## map：按键读取，以及“没有”与“为零”

`make(map[string]int)` 创建可写的 map，键是字符串，值是整数。`counts[word]++` 读到缺失键的零值，再加一并保存，所以适合计数。读取 `value, ok := counts["rust"]` 的第二个结果说明键是否存在；单看 `value==0` 无法区分缺失与明确存了零。nil map 可以读取和取长度，但向它赋值会 panic；先 `make` 或使用字面量初始化。

map 遍历顺序未规定。稳定排行榜应收集键，再排序；不能通过多运行几次看到同样结果就依赖它。相同次数时加字典序作为第二规则，使验收可重现。`delete` 删除键；删除不存在键不会出错。map 也不会自动给多个 goroutine 同步，进入并发课时必须处理共享访问。

### 就地练习：读取不增加键

空map读取rust得到什么，长度是否增加？显式写rust=0后再读。

### 参考核对：读取不增加键

先0,false且长度0；写后0,true且长度1，nil map还不能直接写入。

## 字节、rune 和人眼看到的字符

UTF-8 字符串存字节。`len("Go你好")` 是 8：两个 ASCII 字节，加两个汉字各三个字节。`[]rune` 或 `utf8.RuneCountInString` 对有效字符串数 Unicode 码点，这里是 4。`range` 字符串返回的索引是**字节偏移**，值是 rune。它不是数组里第几个汉字。某些表情、组合音标由多个码点组成，所以 rune 数仍不是所有场景的人眼字符数；这份练习不实现字形簇分割。

### 就地练习：起点是字节偏移

为Go你好先预测字节数、码点数与range偏移，再运行。

### 参考核对：起点是字节偏移

8字节、4码点，偏移0、1、2、5；不是第几个汉字的编号。

## 在 VS Code 运行：main.go 完整程序

打开 `exercises/go/go-collections`，新建 `main.go` 保存下面代码。首次在该目录执行 `go mod init example.com/learn/go-collections`，然后 `go fmt ./...`、`go run .`。输出在终端；不用安装第三方依赖。

```go
package main

import (
	"fmt"
	"sort"
	"strings"
	"unicode/utf8"
)

func main() {
	a := []int{1, 2, 3}
	// 取片只改变可见范围，b仍与a共享前两个整数。
	b := a[:2]
	b[0] = 9
	c := make([]int, len(a))
	copy(c, a)
	c[0] = 7
	fmt.Println("共享：", a, b)
	fmt.Println("复制：", a, c)
	counts := make(map[string]int)
	for _, word := range strings.Fields("Go go WEB") {
		counts[strings.ToLower(word)]++
	}
	// 从长度0开始追加键；容量仅预留，不能把预留项当真实词名。
	keys := make([]string, 0, len(counts))
	for word := range counts {
		keys = append(keys, word)
	}
	// 先按次数降序，次数相同再按词名；否则map来源的并列顺序不稳定。
	sort.Slice(keys, func(i, j int) bool {
		if counts[keys[i]] != counts[keys[j]] {
			return counts[keys[i]] > counts[keys[j]]
		}
		return keys[i] < keys[j]
	})
	for _, word := range keys {
		fmt.Printf("%s:%d\n", word, counts[word])
	}
	value, exists := counts["rust"]
	fmt.Printf("rust：%d，存在=%t\n", value, exists)
	text := "Go你好"
	fmt.Printf("字节=%d，码点=%d\n", len(text), utf8.RuneCountInString(text))
	for offset, ch := range text {
		fmt.Printf("偏移 %d：%c\n", offset, ch)
	}
}
```

```output
共享： [9 2 3] [9 2]
复制： [9 2 3] [7 2 3]
go:2
web:1
rust：0，存在=false
字节=8，码点=4
偏移 0：G
偏移 1：o
偏移 2：你
偏移 5：好
```

关键的执行链是 `Fields` 按空白拆分 → `ToLower` 归一化 → map 累加 → 收集键 → 按规则排序 → 输出。`Fields` 不做中文分词，也不会自动剔除标点；`go,` 与 `go` 是不同键。说明限制是数据处理的一部分，不要悄悄修改输入后声称支持所有自然语言。

## 从固定文字改成“读取一整行”：不要用 Scan 只读一个词

本课正式任务要求用户输入一行，例如 `Go go WEB`。起步教程里的 `fmt.Scan(&name)` 只读一个以空白分隔的词；直接拿它读这行，会先得到 `Go`，无法统计后面的两个词。`bufio.Scanner` 默认按行读取：`Scan()` 尝试读下一行，成功才可以用 `Text()` 取得该行内容；遇到输入结束返回false，读入失败还应检查 `Err()`。按下Enter代表这一行输入完成，换行本身不包含在Text结果中。[Scanner官方说明](https://pkg.go.dev/bufio#Scanner)

下面是**另一个独立完整程序**，不要追加在前面主程序后，也不要在同一目录保留两个含main的 `.go` 文件。新建 `exercises/go/go-collections-input`，打开它，第一次执行 `go mod init example.com/learn/go-collections-input`。新建main.go，完整保存以下代码；然后在终端 `go run .`，点击终端输入一整行并按Enter。新增的两个导入是 `bufio`（读一行）和 `os`（提供标准输入）。

```go
package main

import (
	"bufio"
	"fmt"
	"os"
	"sort"
	"strings"
)

func main() {
	fmt.Println("请输入一行文字，再按Enter：")
	scanner := bufio.NewScanner(os.Stdin)
	if !scanner.Scan() {
		if err := scanner.Err(); err != nil {
			fmt.Println("读取失败：", err)
		} else {
			fmt.Println("没有读到一行，请重新运行并输入。")
		}
		return
	}
	text := scanner.Text()
	counts := make(map[string]int)
	for _, word := range strings.Fields(text) {
		counts[strings.ToLower(word)]++
	}
	// 从长度0开始追加键；容量仅预留，不能把预留项当真实词名。
	keys := make([]string, 0, len(counts))
	for word := range counts {
		keys = append(keys, word)
	}
	// 先按次数降序，次数相同再按词名；否则map来源的并列顺序不稳定。
	sort.Slice(keys, func(i, j int) bool {
		if counts[keys[i]] != counts[keys[j]] {
			return counts[keys[i]] > counts[keys[j]]
		}
		return keys[i] < keys[j]
	})
	if len(keys) == 0 {
		fmt.Println("没有可统计的词")
		return
	}
	for _, word := range keys {
		fmt.Printf("%s:%d\n", word, counts[word])
	}
}
```

输入 `Go go WEB` 时应看到如下对话；其中输入行由你输入，不是程序再次打印的：

```output
请输入一行文字，再按Enter：
Go go WEB
go:2
web:1
```

重新运行输入 `b a`，应按字典序输出 `a:1`、`b:1`；直接按Enter输入空行，应输出“没有可统计的词”。空行是已经读到的一行，不等于没有任何输入。程序在提示后等待你输入是正常现象，不要往源码区填写要统计的句子。

`sort.Slice(keys, func(i,j int) bool { ... })` 的第二参数是一个没有名字的函数。排序库多次调用它，询问“当前位置i的词应该排在位置j的词之前吗？”返回true表示应该在前，而不是已经完成交换。先比较次数，次数相等才比较单词，这就是两条排序规则。这个函数会读取外面已有的keys和counts；不用给自己每个比较都手工写调用。后面的 `keys` 才是稳定的顺序，直接遍历map打印不会得到同样保证。

本例统计并输出所有词；正式任务的Top3要在排序后只取最多三个。用 `end := len(keys)`，若 `end > 3` 就设为3，再遍历 `keys[:end]`；不足三项和空行先按规则处理，不能直接取 `keys[:3]`。Scanner默认有行长限制，过长输入会走Err分支；本课先使用短的一行，不把它当成任意大小文本文件处理器。

## 改一个输入

1. 把词频输入改成 `b a`，相同次数时输出谁在前？
2. 把词频输入改成三个空格，应有几行词频输出？
3. 在读取rust前加入 `counts["rust"] = 0`，value和exists分别是什么？
4. 合上例子，实现只返回次数至少为二的词，并保证稳定顺序。

### 参考答案

把输入改成 `b a`，参考输出顺序是 `a:1`、`b:1`，验证并列排序。改成三个空格，词频输出没有任何行，缺失键仍得到 `0,false`。把 `counts["rust"] = 0` 放到读取前，得到 `0,true`，解释存在标记。合上代码实现“只返回次数至少为二的词”，不要一边遍历未排序的 map 一边把输出顺序当成答案。

自查：你能指出何时共享、何时复制，解释 len 与 cap，说明 nil map 为什么可读不可写吗？能预测中文的字节偏移，而不把它当字数吗？遇到 panic 先查看访问下标是否小于 len，不要随手增加容量来掩盖越界。

官方参考：[切片](https://go.dev/tour/moretypes/7)、[map](https://go.dev/tour/moretypes/19)、[Go 字符串、字节与 rune](https://go.dev/blog/strings)、[sort](https://pkg.go.dev/sort)。
