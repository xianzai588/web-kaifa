# 泛型函数的类型参数

用同一份取首项逻辑处理不同元素类型，保持返回值的具体类型。

## 为什么不再复制两个 First 函数

取整数切片第一项和取字符串切片第一项，逻辑相同，类型不同。分别写FirstInt与FirstString会复制代码；用any又可能让调用者再次断言类型。泛型允许函数把“元素类型”也作为参数，编译时仍知道输入输出的对应关系。

**类型参数传的是类型；普通参数传的是值。** 下面T代表本次使用的类型，values代表实际切片。泛型是Go 1.18起提供的语言功能；本课程Go 1.22及更新工具链可以使用。

### 就地练习：类型也有输入位置

分别写出First[int]与First[string]的类型参数、值参数和结果类型，不用any保存结果。

### 参考核对：类型也有输入位置

方括号传类型，圆括号传对应切片；首项结果仍为int或string，不需再断言。

## 完整函数

在独立练习目录替换main.go：

```go
package main

import "fmt"

// [T any] 声明一个类型参数T；[]T切片中的每项和返回的T是同一具体类型。
func First[T any](values []T) (T, bool) {
	if len(values) == 0 {
		var zero T // 空输入没首项，返回该类型的零值与false，避免下标越界。
		return zero, false
	}
	return values[0], true
}

func main() {
	// 编译器由实参推断T：第一次int，第二次string。
	fmt.Println(First([]int{2, 3}))
	fmt.Println(First([]string{"Go", "Web"}))
}
```

```sh
go run .
```

输出：

```output
2 true
Go true
```

## 把每个位置读清楚

函数名后的方括号 `[T any]` 定义类型参数；圆括号 `(values []T)` 定义普通参数；返回 `(T, bool)` 与已学多返回值一样。any在这里作**类型约束**，允许各种类型；约束决定泛型函数里能安全使用哪些操作。

也可显式调用 `First[int]([]int{2,3})`。`[int]`传具体类型，`[]int{...}`传切片值；不是对函数做索引。First得到int，结果就仍是int，不需要any断言。

`var zero T`得到本次具体类型的零值：int为0，string为空。bool说明是否找到首项，不能用零值判断，因为切片第一项也可能确实是0或空文字。

### 就地练习：空值不代表缺失

对First([]string{""})与First([]string{})写出结果。为什么必须保留bool？

### 参考核对：空值不代表缺失

分别"" true与"" false；类型的零值本身可能就是合法元素。

## 约束不是一句“任何都能算”

**T any表示允许任何类型，不表示任何类型都支持加法。** 若泛型函数直接对T做a+b，编译器会拒绝，因为结构体等类型没这项运算。需要数值加法时应写匹配所需类型集合的约束，而不是靠运行时碰运气。

接口描述行为，泛型描述某份逻辑随类型变化的关系。项目里简单的重复逻辑可以抽泛型，但不要为了高级写法把清楚的接口或具体函数强行替换。

### 就地练习：any不能保证加法

尝试定义T any的Add并直接return a+b，先判断编译结果；取首项为何却允许any？

### 参考核对：any不能保证加法

任意类型未必支持+，编译拒绝；取首项只移动同类型值，没有要求加法能力。

## 预测再实验

增加 `First([]int{})` 与 `First([]string{})`，预测分别0/false、空文字/false，再运行。故意删空切片检查，用空输入应出现越界panic；修回后确认安全。错误现象不是想要的空结果合同。

### 参考答案

空整数切片返回0/false，空字符串切片返回空文字/false。泛型使合同一致，非空检查仍必须在取下标之前。

## 独立变式

写Last泛型取尾项，对整数、字符串和空切片给出相同found约定。先写三个预期，再实现，不用any存结果。

参考：[Go泛型教程](https://go.dev/doc/tutorial/generics)、[类型参数规范](https://go.dev/ref/spec#Type_parameter_declarations)。

## 约束决定可做的操作

T any可以保存任意类型的值，但不能据此对T使用+或<；需要相应约束。comparable允许==/!=并常用于map键，类型集合与~可描述允许的底层类型；自定义约束应说明它支持的操作，不为取一个元素设计过宽接口。

泛型适合相同算法在多种类型上工作；接口适合按行为替换具体实现。泛型不消除空集合、数值范围或并发规则，也不会让any结果自动变安全。类型推断不足时可显式写Last[int](nil)。

### 参考答案：独立实现

zero按T取得零值，非空时返回同一个T而不装进any。字符串空输入同理得到""与false；不使用零值本身判断是否找到。

下面是独立练习的完整main.go，在自己的模块目录保存并运行go run .。

```go
package main

import "fmt"

func Last[T any](values []T) (T, bool) {
    // T由本次调用确定：int零值0，string零值空串；found另行表达存在性。
    var zero T
    if len(values) == 0 { return zero, false }
    return values[len(values)-1], true
}

func main() {
	n, found := Last([]int{1, 2})
	fmt.Println(n, found)
	text, found := Last([]string{"Go", "Web"})
	fmt.Println(text, found)
	n, found = Last([]int{})
	fmt.Println(n, found)
}
```

预期：

```output
2 true
Web true
0 false
```

### 就地练习：接口还是泛型

分别为“相同取尾算法处理不同元素类型”和“不同存储实现提供读取行为”选择泛型或接口并解释。

### 参考核对：接口还是泛型

取尾用泛型表达输入输出类型关系；存储按行为替换用接口。两者都不替代输入和错误校验。
