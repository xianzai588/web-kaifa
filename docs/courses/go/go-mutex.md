# 互斥锁与共享状态

先分清等待任务与保护数据，再让共享计数的修改按同一规则进行。

## count++ 为什么不是天然安全

两个goroutine都修改count，`count++`包含读取旧值、加1、写回。假如两者都先读到0，各自写1，最后可能是1而非2。多个任务未同步访问同一变量、至少一个写入，称为数据竞态；不能只靠某次结果恰好正确排除它。

**WaitGroup保证“做完了再继续”，互斥锁保证“这一段共享访问同一时刻只有一项进入”。** Mutex是mutual exclusion的缩写。Lock取得锁，其他要同一把锁的任务等待；Unlock释放。受保护的一段叫临界区。

### 就地练习：两次增加只加一次

手工排列两任务读取0、各自加1、分别写1的顺序。指出锁必须覆盖哪三个动作。

### 参考核对：两次增加只加一次

读旧值、计算新值、写回应在同一临界区，最终才能累计2；只锁写回不能保护整个更新。

## 完整计数程序

在独立练习目录替换main.go：

```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	var wg sync.WaitGroup
	var mu sync.Mutex
	count := 0
	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			mu.Lock() // 所有任务用同一把锁保护同一个count。
			count++ // 读、改、写均在锁内，而不是只锁住写回。
			mu.Unlock()
		}()
	}
	wg.Wait() // 完成后不再有任务写count，主函数才读取最终值。
	fmt.Println(count)
}
```

```sh
go run .
```

输出：

```output
100
```

`go func(){...}()` 先定义匿名函数，再由最后的括号调用，并用go启动。函数访问外层的wg、mu、count，这是闭包；所以100项操作的是同一count，不是100个独立变量。

锁应覆盖一个完整的数据规则。真实内存存储中，查记录、分配id、增加或删除记录可能有组合要求；所有相关读取和写入必须遵守同一锁。只给写加锁、读却不加，仍可能竞态。锁对象使用后也不应复制。

## 正常实验与故意移除保护

先把100改200，应输出200。再只在自己的临时练习中去掉Lock/Unlock，预测结果不可靠；即使某次输出200，也不代表没有竞态。还原后重复。

支持的平台与C工具链已准备时，运行：

```sh
go run -race .
```

race是竞态检测器，执行时检测未同步数据访问。去锁版本可能报告WARNING: DATA RACE；加锁版本此场景不应报告。它只检查本次实际执行到的路径，不证明整个服务完全无竞态；工具不可用或未执行，应写清。

## 常见错误

同一任务取得这把Mutex后又再次Lock它，可能永远等自己释放；这类无法继续叫死锁。持锁时等待另一个也需要该锁的任务，也会卡住。锁越大不一定越好，网络和慢查询不宜无必要地占着共享锁。

### 参考答案

等待完成后主函数最终读不与任务写入重叠；若任务还在运行，读取也须持同一锁。锁不负责取消任务，也不代替数据库事务。

## 独立变式

写一个结构体保存mu和count，以指针方法Add与Value提供访问；让两个并发任务各增加50次，Wait之后应为100。解释为什么不把Mutex结构体按值拷贝给每项任务。

参考：[sync.Mutex](https://pkg.go.dev/sync#Mutex)、[Go竞态检测](https://go.dev/doc/articles/race_detector)。

## 锁保护不变量，读取也要遵守

互斥锁只在所有访问方遵守同一把锁时有效。读写复合状态要在同一个临界区内保持一致；RLock也不是允许同时写入。锁应由拥有数据的类型封装，防止调用者绕过保护直接改字段。

Mutex首次使用后不能复制；含锁结构体用指针传递、指针接收者方法，避免每个副本拿不同锁却访问同一数据。竞争检测器只检查被实际执行的路径，锁死与业务顺序错误仍需专门测试。

### 参考答案：独立实现

两任务都使用同一个*Counter；Add与Value内部持同一锁，结构体不被复制。可在本机支持竞争检测的环境用go run -race .再核对，不把最终恰好100当无竞争的充分证据。

下面是独立练习的完整main.go，在自己的模块目录保存并运行go run .。

```go
package main

import (
    "fmt"
    "sync"
)

type Counter struct {
    mu sync.Mutex
    count int
}
// 接收者用指针，所有任务才使用同一份计数和同一把锁。
func (c *Counter) Add(delta int) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.count += delta
}
// 工作还在运行时，读取也必须遵守同一把锁的保护。
func (c *Counter) Value() int {
    c.mu.Lock()
    defer c.mu.Unlock()
    return c.count
}

func main() {
	counter := &Counter{}
	var wg sync.WaitGroup
	wg.Add(2)
	for task := 0; task < 2; task++ {
	    go func() {
	        defer wg.Done()
	        for i := 0; i < 50; i++ { counter.Add(1) }
	    }()
	}
	wg.Wait()
	fmt.Println(counter.Value())
}
```

预期：

```output
100
```

### 就地练习：读方法也使用同一把锁

如果Counter.Add持锁而Value不持锁，在任务未结束时读取是否安全？用指针接收者解决的又是哪类问题？

### 参考核对：读方法也使用同一把锁

未同步的读仍可与写竞态；指针接收者避免复制已使用的锁。两者都要满足，不能互相代替。
