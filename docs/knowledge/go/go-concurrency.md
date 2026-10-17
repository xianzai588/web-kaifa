# goroutine、同步与取消：任务什么时候开始，又怎样结束

服务器可以同时处理多个请求；两个请求也可能同时更新同一个 map 或计数器。并发表示任务可以交错推进，不保证同时在不同 CPU 核心运行，也不保证启动顺序就是完成顺序。学习并发先回答两个问题：共享的数据谁保护，启动的任务谁负责等待或取消。

## 1. goroutine 与生命周期

`go work()` 启动一个 goroutine，当前函数继续执行。main 返回时进程结束，其他 goroutine 不会自动等到工作完成；用 WaitGroup 等待，不能用“睡一秒应该够了”代替可靠同步。`wg.Add` 应在启动任务之前执行；任务完成调用 `Done`，通常用 defer，等待方调用 `Wait`。

Add/Done 的数量要平衡。少 Done 可能一直等，多 Done 会 panic。不要在 main 已经开始 Wait 且计数为零时才从新 goroutine 调 Add。任务之间没有共享数据时无需强行加锁；需要访问同一可变对象时，再选择 Mutex、channel 或更合适设计。

### 就地练习：完成数量平衡

启动三任务前登记3，每项defer Done，说明少Done与main不Wait各有什么后果。

### 参考核对：完成数量平衡

少Done可能等不到零；不Wait时main可先退出，Sleep不提供完成证明。

## 2. 数据竞争、Mutex 与 channel

`total++` 不是“一个数学动作就天然原子”；它涉及读旧值、加一、写回，两任务可能互相覆盖。同一变量存在并发读写且没有正确同步，会产生数据竞争。Mutex 的 Lock/Unlock 把临界区包起来；所有访问都遵守同一把锁，不能只给写加锁、读不保护。加锁范围应短，避免拿着锁等网络或慢数据库。

channel 用来传值与协调。未缓冲发送要有接收方才能完成；把所有发送放在主函数、之后才接收可能死锁。一般由发送方在确认所有发送完成后关闭 channel，接收方不要随意关闭别人的通道。向已关闭 channel 发送会 panic。channel 不是自动消除所有竞争，指针指向共享对象时仍要保证访问方式。

下面是放在main中的**channel概念片段**，与安全计数例子分开观察：

```go
ch := make(chan int, 2)
ch <- 10
ch <- 20
close(ch)
for value := range ch { fmt.Println(value) }
value, ok := <-ch
fmt.Println(value, ok)
```

缓冲区可容纳两个值，关闭后仍先读完10、20，然后range结束。最后接收得到 `0 false`：关闭且已读完通道返回元素零值和 `ok=false`。只判断value为零会混淆真实发送的0与结束信号。关闭已经关闭的通道会panic；nil channel的发送和接收会一直阻塞，关闭nil也会panic。`var ch chan int` 是nil，`make(chan int)` 才是可用的非nil通道。在select里nil通道分支不会就绪，这可用于有意禁用分支，但不能靠不初始化通道“修复”整个任务。

多个发送者时，需要协调所有发送者完成后再关闭，例如用WaitGroup等待，再由唯一负责方close。读取方提前退出时，发送方可能永久等待；发送select应同时观察ctx.Done。这说明“有channel”并不等于自动管理好了生命周期。

### 就地练习：等待不保护读改写

两任务total++后Wait，解释为何仍需同一把锁；关闭通道后读到0又如何判结束？

### 参考核对：等待不保护读改写

Wait只等完成，Mutex保护共享访问；通道用ok区分合法零和关闭读完，不能只看value。

## 3. context 是协作取消，不是强制杀线程

context 携带取消信号、deadline 等。`WithCancel` 返回派生 ctx 和 cancel，调用 cancel 后 `ctx.Done()` 关闭，`ctx.Err()` 是 Canceled。`WithTimeout` 到期可能得到 DeadlineExceeded。得到 cancel 函数后通常 defer cancel，及时释放相关资源。

被取消的函数需要自己检查或 select 等待信号；一个只做无限 CPU 循环、从不检查 ctx 的 goroutine 不会因为 context 被取消就自动消失。网络/数据库调用要将 ctx 继续向下传，不能在每层改用 Background 丢失请求取消。多个 select 分支同时就绪时选择不应被依赖，测试应使用明确的同步时序。

### 就地练习：取消必须传下去

调用cancel后一个循环从不检查ctx，会被强制停止吗？写出工作需要增加的路径。

### 参考核对：取消必须传下去

不会；实际工作观察Done或Err并return，I/O用支持ctx的方法，再等待任务退出。

## VS Code 可运行例子：main.go 完整程序

建立 `exercises/go/go-concurrency`，首次 `go mod init example.com/learn/go-concurrency`。保存源码后 `go fmt ./...`、`go run .`。三任务只通过 Mutex 更新计数，最后统一打印，输出不依赖它们谁先完成。

```go
package main

import (
	"context"
	"fmt"
	"sync"
	"time"
)

func Wait(ctx context.Context, delay time.Duration) error {
	// 先拒绝已取消操作；不让就绪的零时长timer和取消随机竞争。
	if err := ctx.Err(); err != nil { return err }
	timer := time.NewTimer(delay)
	defer timer.Stop()
	select {
	case <-ctx.Done(): return ctx.Err()
	case <-timer.C: return nil
	}
}

func main() {
	var wg sync.WaitGroup
	var mu sync.Mutex
	total := 0
	for worker := 0; worker < 3; worker++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for i := 0; i < 200; i++ {
				// 同一把锁覆盖读、加一、写回，WaitGroup只负责最后等待完成。
				mu.Lock()
				total++
				mu.Unlock()
			}
		}()
	}
	wg.Wait()
	fmt.Println("安全计数：", total)
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	fmt.Println("提前取消：", Wait(ctx, time.Hour))
	fmt.Println("正常完成：", Wait(context.Background(), 0) == nil)
}
```

```output
安全计数： 600
提前取消： context canceled
正常完成： true
```

Wait 首先检查已经取消的 context，避免让已取消任务又开始等待；timer 不再使用时 Stop。例子没有模拟真实请求，也没有承诺某个纳秒级截止时间精确执行；时间相关生产行为需要允许调度延迟。

## 改一个条件

将任务数量改为 4，预测总数。把 Lock/Unlock 删掉，在支持 race detector 的环境执行 `go run -race .`，记录是否报告 DATA RACE；不要把偶然输出 600 当作没有竞争。Windows 的 race 工具可能需要受支持架构和 C 编译器，缺少这些条件时先读官方安装要求，不能说普通运行等于 race 验证。

### 参考答案

四个任务每次200，总数800。去锁后结果可能仍是600、也可能更小，根本问题是没有同步，结果不保证正确；race detector 只检测实际执行到的竞争路径，不是形式证明。恢复锁后再跑原场景。为 Wait 加两个测试：调用 cancel 后应 errors.Is(err, context.Canceled)，正常工作完成应 nil；时间相近时不要假设固定获胜顺序。

自查：每个 goroutine 有结束路径吗？谁在等待？所有共享读写都使用同一同步规则吗？取消信号传到工作了吗？本例不包含生产任务池、压力测试、数据库取消与服务优雅退出，下一主题将介绍退出边界。

官方参考：[sync](https://pkg.go.dev/sync)、[context](https://pkg.go.dev/context)、[race detector](https://go.dev/doc/articles/race_detector)、[Go 内存模型](https://go.dev/ref/mem)。
