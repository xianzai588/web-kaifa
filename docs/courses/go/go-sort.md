# 字符串处理与排序

先把文字拆成单词，再建立确定的输出顺序。

## 排序前先把数据转换成可排序的一组

字符串处理在这里有两个动作：ToLower 把文字转换成小写，Fields 按连续空白分隔出单词，返回 []string。内部调用先求值，所以 `Fields(ToLower(...))` 先得到小写文字，再拆词；空白包括空格、换行和制表符。

**map 适合按词计数，但 map 的遍历顺序不能代表排名。** 要确定展示顺序，先提取键到切片，再排序切片。`sort.Strings` 直接修改这个切片，不返回一份新的排好序的切片。

这里“按字符串顺序”是 Go 对字符串的比较顺序，足以固定本例英文键；它不是中文拼音排序、自然语言词典排序或按出现次数排序。

### 就地练习：名称排序不是次数排名

对z z a写出本节名称排序的行序，再写次数降序的行序。运行名称排序版核对。

### 参考核对：名称排序不是次数排名

名称排序先a 1后z 2；次数排序先z 2后a 1。这个输入能区分两条规则。

## 字符串工具与排序比较规则

`strings.TrimSpace` 去掉两端空白，Fields 按空白切分且跳过空项，`strings.Split(text, ",")` 按指定分隔符切分并可能产生空项。Contains 判断包含，HasPrefix 判断前缀，ReplaceAll 返回替换后的新字符串；它们不会原地修改原字符串。

sort.Strings 修改原切片。需要保留原顺序先复制；结构体切片用 sort.Slice 自定义 less(i,j)。比较相等项必须返回 false，不能用 <= 作为“小于”规则，否则破坏排序要求。稳定排序只保留同等项的原相对次序；如果原顺序来自无序 map，稳定排序也不会自动给并列项目一个固定业务顺序，仍要写次级比较。

### 就地练习：并列需要第二条规则

对b a按次数降序排序，次数相等时若总返回false，能否保证a先b后？写出需要增加的比较。

### 参考核对：并列需要第二条规则

不能保证来自无序map的并列次序；次数相同时还要比较Word的小于关系。比较相等项应返回false。

## 先运行一个小例子

在已初始化的独立 Go 练习目录中，把下面完整代码保存为 main.go。本节替换原文件，不在文件末尾追加另一份 main 函数。

```go
package main

import (
	"fmt"
	"sort"
	"strings"
)

func main() {
	// 先统一大小写，再按一个或多个空白字符拆成单词切片。
	words := strings.Fields(strings.ToLower("Web Go GO"))
	counts := map[string]int{}
	for _, word := range words { // 本轮只需要单词，不需要它的下标。
		counts[word]++
	}
	keys := []string{}
	for key := range counts { // map 单个 range 变量取得键，不是计数值。
		keys = append(keys, key)
	}
	sort.Strings(keys) // 原地修改 keys，让键按确定顺序排列。
	for _, key := range keys {
		fmt.Println(key, counts[key]) // 用排好序的键读取各自计数。
	}
}
```

在这个目录的终端运行：

```sh
go run .
```

预期输出：

```output
go 2
web 1
```

## 逐步读懂这个例子

原文分成web、go、go。计数map记录次数。收集键时顺序可能不同，但sort.Strings后固定为go、web，逐项读取次数得到可重复结果。按次数排行是另一条排序规则，可在词频项目中比较。

| 阶段 | 中间数据 |
| --- | --- |
| 统一大小写 | `web go go` |
| 按空白拆词 | `[web go go]` |
| 累计 map | web 对应 1，go 对应 2 |
| 取键 | 包含 web、go，原顺序不作假设 |
| 字符串排序后 | `[go web]` |
| 按已排序键输出 | go 2，再 web 1 |

两个 range 的对象不同：遍历 words 的第二个结果是单词；遍历 counts 的单个结果是键；遍历 keys 的第二个结果才是排好序的键。

## 自己改一处再运行

加一个与go同次数的单词，先按字典排序，再设计“次数降序、同次字典序”的比较规则。

### 参考答案

次数降序、同次词名升序的比较函数是：

```go
sort.Slice(result, func(i, j int) bool {
    if result[i].Count != result[j].Count {
        return result[i].Count > result[j].Count
    }
    return result[i].Word < result[j].Word
})
```

这是下节 Count 函数中的替换片段，result 的元素须含 Count 和 Word，不是可独立运行的 main.go。先比较次数，不同就得出顺序；相同才比较词名。用 `Go go web web a` 验收时，go:2、web:2、a:1；若按字典排序则 a 在最前，两条规则应有可区分的结果。

## 只排了切片，为什么输出还乱

检查最后的输出循环是不是仍然直接 range map。排序的是 keys，就要按 keys 的次序读取 counts[key]；不能排完一份切片又丢掉它。次数排序与名称排序也要用能区分的测试数据分别验证。

## 明确你到底在按什么排序

输入改为 `"z a a"`，应先输出 a 2，再 z 1；再用 `"z z a"`，仍先 a 1、后 z 2，证明本节按键顺序，不按次数排名。下节项目才把比较规则改为次数优先。

输入改为空字符串，words、counts、keys 都没有元素，循环自然没有输出，不需要读取前三项。不要从 map 直接输出后，多运行几次碰巧相同，就认定它提供顺序保证。

## 合上参考，独立整理名称计数

从空白main.go用字符串切片保存名称，自己统计同名数量，取出map键到另一个切片，按本节字符串顺序排序，最后按排序后的名称输出各自计数。名称本题已是小写，不需要新增清洗规则。

| 名称输入 | 按行预期 |
| --- | --- |
| lin、wu、lin | lin 2，然后wu 1 |
| wu、lin | lin 1，然后wu 1 |
| 空名称切片 | 没有记录输出 |

先预测，再运行自己的三组输入。**展示顺序由排序后的键决定，不能直接信任map遍历顺序。** 本题只用已学sort.Strings；前面提到的次数降序比较留作下节项目的规则讨论，不需要在此提前写比较函数。

### 参考答案

从 map 取键时次序不定，先排序再按键查值。把 names 改为 [wu lin] 得到 lin 1、wu 1；改为空切片，没有任何记录输出。

下面是可直接替换的完整 `main.go`。在本节独立模块中保存后运行 `go run .`。

```go
package main

import (
    "fmt"
    "sort"
)

func main() {
	names := []string{"lin", "wu", "lin"}
	counts := map[string]int{}
	for _, name := range names { counts[name]++ }
	keys := []string{}
	for key := range counts { keys = append(keys, key) }
	sort.Strings(keys)
	for _, name := range keys { fmt.Println(name, counts[name]) }
}
```

预期结果：

```output
lin 2
wu 1
```

参考：[Go 语言规范](https://go.dev/ref/spec)。
