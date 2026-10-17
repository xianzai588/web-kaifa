# 标准库与 Web 框架

先在标准库里跟踪公共处理，再理解框架怎样组织路由、中间件和输入输出。

## 框架为什么出现

一个 API 只有两条路由时，自己注册很简单。路由变多，可能每条都要做日志、身份检查或统一错误处理。逐条复制容易漏掉。框架提供一组可复用功能和组织约定，让处理器按统一方式组合；它不是自动写好业务的工具。

Go 标准库是随 Go 提供的包，例如 `net/http`；第三方库由其他项目维护，需要在模块里添加依赖。Web框架一般将路由、公共处理和响应辅助方法放在一套约定里。先看标准库也能完成的公共处理，避免把 HTTP 规则误认为框架专有规则。

**中间件是在具体处理器外包装一层公共行为，接到请求后可以继续调用下一层，也可以提前返回。** 本节只给每个响应加 `X-Course: go`，便于观察顺序；这个自定义响应头不是HTTP强制字段。

### 就地练习：公共包装负责什么

让同一包装分别处理/health与/missing，预测X-Course是否都出现。

### 参考核对：公共包装负责什么

包装先于路由执行，两种响应都可带go；404不意味着外层公共处理没有执行。

## 完整代码：先包装，再进入路由

在独立练习目录替换 `main.go`：

```go
package main

import (
	"fmt"
	"net/http"
	"net/http/httptest"
)

// next 是下一层处理器；返回值仍满足 http.Handler 接口。
func withCourse(next http.Handler) http.Handler {
	// HandlerFunc 把符合签名的普通函数转换成具有 ServeHTTP 方法的处理器。
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 在 next 写正文之前设置响应头，否则可能已来不及发送。
		w.Header().Set("X-Course", "go")
		next.ServeHTTP(w, r) // 必须显式继续，否则具体路由不会执行。
	})
}

func health(w http.ResponseWriter, r *http.Request) {
	if _, err := fmt.Fprint(w, "ok"); err != nil {
		fmt.Println("写响应失败：", err)
	}
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", health)
	req := httptest.NewRequest("GET", "/health", nil)
	rec := httptest.NewRecorder()
	withCourse(mux).ServeHTTP(rec, req) // 外层先执行，然后 mux 找到 health。
	fmt.Println(rec.Code, rec.Header().Get("X-Course"), rec.Body.String())
}
```

```sh
go run .
```

输出：

```output
200 go ok
```

## 把新写法拆开

`func(w ..., r ...) {...}` 没有函数名，是**匿名函数**：可以把函数本身作为值传入或返回。本节的参数与 health相同；`HandlerFunc(...)` 把这个函数转成满足接口的类型，不是立即处理请求。

返回的函数使用了外层参数 next，这叫闭包：函数保留对其外部变量的访问。执行 `withCourse(mux)` 时 next是mux；以后收到请求才执行函数体，然后 `next.ServeHTTP` 进入mux。数据流为 `公共包装 → 路由器 → health → 响应`。

**不调用 next，后面的处理不会自动继续。** 身份中间件可以在拒绝请求后 return；允许通过则继续。多个包装时，外层先开始、内层随后，顺序影响头部、鉴权与日志。

### 就地练习：构造与执行分两次

标出withCourse(mux)与返回处理器的ServeHTTP何时运行。哪个动作真正调用health？

### 参考核对：构造与执行分两次

前者只构造闭包并保存next；后者收到请求才进入next，Mux匹配后才执行health。

## 框架接管什么，业务还需要谁写

| 责任 | 本节标准库表达 | 换框架后仍需理解 |
| --- | --- | --- |
| 路由 | ServeMux匹配方法和路径 | 模式、分组、404/405行为 |
| 公共处理 | withCourse包住下一层 | 执行顺序、继续与终止 |
| 输入 | 读参数、校验 | 绑定到结构体不等于业务合法 |
| 输出 | 状态、响应头、JSON/HTML | 写出顺序与错误语义 |
| 业务存储 | 自己写函数与Repository | 数据库、权限和测试仍需实现 |

后端框架（例如Gin）组织服务器端请求；React/Vue组织前端界面组件。运行位置不同，可以通过HTTP协作。HTML负责浏览器文档结构，CSS负责外观，JavaScript常用于浏览器交互；Go可以返回JSON，也可以生成HTML，下一节亲自验证。

## 自己改一处再验证

先绕过包装，直接调用 `mux.ServeHTTP(rec, req)`；正文还应为ok，X-Course应空。再恢复包装请求 `/missing`，应返回404，响应头仍有go。最后删除 `next.ServeHTTP`，解释为什么路由处理不再发生。

### 参考答案

直接调用mux，正文ok而X-Course为空；经过包装，404也带X-Course:go。删去next.ServeHTTP后没有路由正文，记录器可能仍显示默认200，不能把这个200当健康处理器成功。

## 以后如何选择

先完成标准库项目并说明自己的需求，再选读 [Gin官方入门](https://gin-gonic.com/en/docs/quickstart/) 对比同一条路由。它有不同Handler参数和继续执行约定，需要重新测试行为。Go、Node.js、Python均能写后端，协议、输入校验和数据库知识能迁移；本课程主线用Go，不要求同时学几套语言才会生成网页。

参考：[Go HandlerFunc](https://pkg.go.dev/net/http#HandlerFunc)、[Gin官方文档](https://gin-gonic.com/en/docs/)。

## 中间件的进入、返回与短路

包装Handler通常先做公共检查，必要时写错误并return；通过后调用next，再做允许的收尾。若省略next，后端业务没有执行；若已经写出拒绝却仍next，正文或状态可能混杂。

框架可提供路由、绑定、验证等工具，但各自的继续/终止语义不同；超时、权限、数据库事务和响应合同仍需你明确设计。引入框架前先用同一组正常与失败请求比较行为，而不是只比较几行启动代码。

### 就地练习：拒绝就不再进入业务

写一条执行路线：检查失败写401后return；再写检查通过调用next的路线。若拒绝后继续next会有什么问题？

### 参考核对：拒绝就不再进入业务

失败应在业务前短路；通过才进入路由。拒绝后继续可能让状态和正文混杂，甚至执行未授权操作。
