# 类型断言与安全检查

检查接口里面实际保存的类型，用第二个结果处理不匹配。

## 接口类型与里面的具体类型

前面接口只要求行为，可以保存满足行为的具体值。`any`是空接口的别名，不要求任何方法，所以能保存string、int等不同类型。变量的静态类型仍是any，里面实际值的动态类型可以不同。

**类型断言检查“接口里已经是什么类型”，不把一个值转换成另一种类型。**`value.(string)`只在value里是string时成功；文字 `"7"` 不会变成整数7。文字转数字仍用strconv.Atoi。

### 就地练习：断言不会解析数字

把any分别装入int(7)和string("7")，做两结果int断言，写出值与ok。

### 参考核对：断言不会解析数字

前者7 true，后者0 false；解析字符串应使用strconv而非断言。

## 完整程序

在独立Go练习目录替换main.go：

```go
package main

import "fmt"

func main() {
	var value any = "Go" // 接口中装入一个string值。
	text, ok := value.(string) // 两结果断言：取具体值，并告诉我们是否匹配。
	fmt.Println(text, ok)
	number, ok := value.(int) // 类型不匹配时，number为int零值，不引发panic。
	fmt.Println(number, ok)
}
```

```sh
go run .
```

输出：

```output
Go true
0 false
```

第一次目标为string，返回Go与true。第二次目标为int，不匹配，返回0与false。**不能只看得到0就当转换成功，要检查ok。**`number, ok :=`中新声明number，已有ok在同作用域被赋新值；这是短变量声明允许至少一个新变量的规则。

## 单结果写法的风险

在main中的片段：

```go
// value仍然装着string，这种不匹配的单结果断言会panic。
number := value.(int)
```

panic是运行时无法按此路径继续的问题，不是普通校验返回值。此片段与已有number声明不可原样同域重复；实验时替换对应语句。接口值为nil时断言也不匹配。已确定内部类型的单结果断言可以用，但输入不确定时使用两结果形式。

## 预测再试

把value改为整数7，第一次应空文字和false，第二次应7与true。再把value改为字符串 `"7"`，预测第二次仍false。最后故意用错误单结果断言，观察panic，再修回安全形式。

### 参考答案

整数7与字符串"7"是不同动态类型，后者不能断言成int。格式解析应使用strconv；类型正确后，标题是否空白仍需另查。

## 独立变式

写 `asTitle(value any) (string, bool)`：只有value确实是string且TrimSpace后非空才成功。测试普通文字、空白、整数与nil，解释类型规则与内容规则各负责什么。

参考：[Go类型断言](https://go.dev/ref/spec#Type_assertions)。

## 断言、类型分支与 nil 接口

`value.(T)`只检查接口内的动态类型是否符合T，不解析文字、不做数值转换；用双结果形式避免未知类型触发panic。多种可接受类型可用type switch，每个分支仍要做内容和范围校验。

接口的零值nil与保存了nil指针的接口不同。比较接口==nil只能判断接口本身是否无动态类型，不能证明内部指针可安全解引用。优先让边界函数返回明确的值/错误合同，减少any在核心业务中传播。

### 参考答案：独立实现

双结果断言先验证类型，TrimSpace再验证非空内容。正常文字返回清理后的标题；空白、整数与nil走失败占位，不发生断言panic。

下面是独立练习的完整main.go，在自己的模块目录保存并运行go run .。

```go
package main

import (
    "fmt"
    "strings"
)

func asTitle(value any) (string, bool) {
    // 双结果形式只检查动态类型；不匹配走false，不触发断言panic。
    text, ok := value.(string)
    if !ok { return "", false }
    text = strings.TrimSpace(text)
    if text == "" { return "", false }
    return text, true
}

func main() {
	for _, value := range []any{" Go ", "   ", 7, nil} {
	    title, ok := asTitle(value)
	    fmt.Printf("%q %t\n", title, ok)
	}
}
```

预期：

```output
"Go" true
"" false
"" false
"" false
```

### 就地练习：接口里有nil指针

令var p *int，再var value any=p。比较value==nil与断言*p类型是否成功；不做解引用。

### 参考核对：接口里有nil指针

接口不为nil；断言为*int可成功，但得到的指针仍nil，不能据接口非nil就解引用。
