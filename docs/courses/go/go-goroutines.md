# goroutine 与等待完成

让一个任务独立执行，并用计数等待它完成，而不是猜它多久结束。

## 顺序执行与并发执行

以前main调用函数，会等函数返回再执行下一行。Go允许用 `go 函数调用` 启动一项独立执行的任务，这项任务称goroutine，由Go运行时调度。主goroutine可继续执行下一行。

并发是多项任务在同一段时间内推进；并行是同一时刻在多个执行资源上运行，不要求每台电脑都会并行。HTTP服务常会并发处理多个请求，这也是后面共享存储需要保护的原因。

**main结束时，整个程序会退出，不会自动等其他goroutine。** 因此必须明确等待自己启动的工作。sync.WaitGroup保存“尚未完成的任务数”：Add登记，Done减一，Wait等到零。

### 就地练习：谁负责等待

启动两项任务时，在纸上标出Add、go调用、Done、Wait的先后约束，说明输出次序是否固定。

### 参考核对：谁负责等待

先Add登记再启动，每任务结束Done，main用Wait等到零；两项输出谁先不保证。

## 完整程序：用命名函数看清顺序

在独立练习目录替换main.go：

```go
package main

import (
	"fmt"
	"sync"
)

func task(wg *sync.WaitGroup) {
	// 任务结束时减计数；即便以后加了正常的提前return也能执行。
	defer wg.Done()
	fmt.Println("任务完成")
}

func main() {
	var wg sync.WaitGroup
	wg.Add(1) // 先登记一项，再启动；避免任务先结束、计数还没增加。
	go task(&wg) // 新goroutine拿同一个WaitGroup的地址，不复制等待状态。
	wg.Wait() // 主goroutine在这里等待计数归零。
}
```

```sh
go run .
```

输出：

```output
任务完成
```

goroutine启动后何时被安排执行，不由下一行位置保证。Wait使main不会提前结束；task里的defer已在 [defer](#/learn/go/go-defer) 学过，参数传地址已在 [指针](#/learn/go/go-pointers) 学过。不能复制已经使用的WaitGroup。

## 为什么不用 Sleep

Sleep只等待某段时间，不知道任务是否完成。机器忙时任务可能没做完，机器快时又无谓多等。WaitGroup在任务真正完成后恢复执行，**等待完成与保护共享变量是两件事**，它不替下一节互斥锁，也不自动传播错误或取消。

### 就地练习：等待不能保护计数

两个任务共享count++，最后Wait就读取。指出还缺什么，解释为什么延长Sleep无效。

### 参考核对：等待不能保护计数

仍需同一锁或其他同步保护读改写；Wait只等待完成，Sleep也不能让两个更新成为互斥。

## 预测再改动

先删掉Wait，预测输出不再有保证；多运行几次，即使碰巧打印也不能证明正确。还原后改成登记2项、启动task两次，输出应两行“任务完成”，不要求两项完成的先后。

错误实验：登记2项但只启动一项。计数不会归零，在这个纯演示中可能报 `all goroutines are asleep - deadlock`，或在复杂程序中一直等。停止并还原。漏Done会同样等不到；多Done会造成负计数panic。

### 参考答案

Add登记数和Done完成数必须一致；不Wait时main可能先退出，偶尔看到输出不能证明可靠。两项有完成保证，先后次序仍可变化。

## 独立变式

用两个命名任务分别计算和打印不同值，Add在启动前累计2项，最后Wait。解释输出顺序可变化，但两项都必须完成；下一节再给共同计数加保护。

参考：[Go go语句](https://go.dev/ref/spec#Go_statements)、[sync.WaitGroup](https://pkg.go.dev/sync#WaitGroup)。

## 并发不保证并行，也不保证顺序

go调用让任务可并发推进，调度器决定何时运行；输出次序不是同步机制。WaitGroup只等待完成，不保护共享数据；Add应在启动任务前登记，任务确保调用Done，即使提前返回也用defer覆盖。

goroutine必须有结束条件，不能启动后就无人管理。闭包捕获变量、错误传递、取消和任务数量上限都需设计；大量无上限go调用可能耗尽资源，后续用channel或受控任务池限制并发。

### 参考答案：独立实现

应恰好出现“任务甲 3”和“任务乙 12”各一行，次序允许变化。两个命名任务各登记一次完成，main等待两项再返回；不用Sleep猜测。

下面是独立练习的完整main.go，在自己的模块目录保存并运行go run .。

```go
package main

import (
    "fmt"
    "sync"
)

func taskA(wg *sync.WaitGroup) {
    defer wg.Done()
    fmt.Println("任务甲", 1+2)
}
func taskB(wg *sync.WaitGroup) {
    defer wg.Done()
    fmt.Println("任务乙", 3*4)
}

func main() {
	var wg sync.WaitGroup
	wg.Add(2)
	go taskA(&wg)
	go taskB(&wg)
	wg.Wait()
}
```

### 就地练习：给任务安排结束条件

设计持续取任务的goroutine，写出“没有新任务”和“主程序取消”时各怎样结束，不只写go调用。

### 参考核对：给任务安排结束条件

任务源结束可关闭通道，取消通过context等信号观察并return；启动方还需等待退出，防止无人管理的任务。
