# 用 Go 模板生成 HTML 页面

把请求中的标题填进 HTML，启动服务，并验证特殊字符会作为文字显示。

## HTML 到底是谁生成、谁显示

HTML 是浏览器认识的文档结构，例如 `<h1>` 表示主标题，`<p>` 表示段落。CSS改变外观，JavaScript可以处理交互；不认识标签时先读 [HTML文档结构](#/learn/web/web-document)，认识三者职责见 [网页中的几种语言](#/learn/web/web-roles)。

**Go 在服务器里把数据填进 HTML 模板，浏览器收到填好的 HTML 后再显示。** 页面不一定需要JavaScript，也不必先学PHP或安装React。另一条路线是Go返回JSON，浏览器中的JavaScript请求它并更新界面；两条路线的工作分配不同，见 [HTML从哪里来](#/learn/web/web-rendering)。

模板是带占位位置的文档。`html/template` 是标准库包：解析模板、填入数据，并按HTML环境对普通值转义。不是把用户文字任意拼成HTML源码。

### 就地练习：关掉JS仍有标题吗

启动模板服务，关闭浏览器JavaScript后刷新。对比Network响应与当前页面，找出Title在哪端填入。

### 参考核对：关掉JS仍有标题吗

响应已经含标题，关闭JS仍显示；Go在发送前完成模板执行。

## 创建独立目录与文件

下载 [完整源码](assets/downloads/go-template-pages.zip)，解压，用VS Code打开 `template-pages` 文件夹。或自己建立新文件夹，在这个文件夹终端运行 `go mod init example.com/study/template-pages`，再保存以下三个文件。**Go模块只建立在这个练习目录，需Go 1.22或更新版本。**

```text
template-pages/
  go.mod          模块声明
  main.go         服务器程序
  page.html       页面模板
  main_test.go    自动验证
```

## 页面模板：page.html

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <!-- 标签页标题由服务器在发出 HTML 前填入。 -->
  <title>{{.Title}}</title>
</head>
<body>
  <!-- 双花括号是模板动作，浏览器收到的是已经填好的文字。 -->
  <h1>{{.Title}}</h1>
  <p>今天学习 {{.Minutes}} 分钟。</p>
</body>
</html>
```

`{{.Title}}` 与 `{{.Minutes}}` 是模板动作。点号表示本次传入的数据；Title与Minutes是结构体字段。`{{` 和 `}}` 里的内容由Go处理，普通HTML标签保留。结构体字段大写导出，模板才可访问。

### 就地练习：数据里的尖括号

将标题设为“读书 <社>”，预测响应源码与屏幕显示。不要改用template.HTML。

### 参考核对：数据里的尖括号

源码为&lt;社&gt;，屏幕按文字显示尖括号，不创建社标签。

## 服务器：main.go

```go
package main

import (
	"bytes"
	"html/template"
	"log"
	"net/http"
)

// 字段大写导出，模板才能通过 .Title 和 .Minutes 读取它们。
type PageData struct {
	Title   string
	Minutes int
}

// 启动时解析模板；失败就返回 error，避免带着坏模板开始接请求。
func newHandler() (http.Handler, error) {
	page, err := template.ParseFiles("page.html")
	if err != nil {
		return nil, err
	}
	mux := http.NewServeMux()
	// {$} 限定路径必须在 / 结束，/missing 不会落入本处理器。
	mux.HandleFunc("GET /{$}", func(w http.ResponseWriter, r *http.Request) {
		title := r.URL.Query().Get("title")
		if title == "" {
			title = "学习记录"
		}
		// 先生成到内存缓冲区，失败时还没向浏览器发送半截成功页面。
		var body bytes.Buffer
		if err := page.Execute(&body, PageData{Title: title, Minutes: 30}); err != nil {
			http.Error(w, "生成页面失败", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		// Bytes 返回 []byte 正文；写出后发生的网络错误只能记录，不能重写状态。
		if _, err := w.Write(body.Bytes()); err != nil {
			log.Println("写页面失败：", err)
		}
	})
	return mux, nil
}

func main() {
	handler, err := newHandler()
	if err != nil {
		log.Fatal(err)
	}
	log.Println("打开 http://127.0.0.1:8080/，按 Ctrl+C 停止")
	// 本机监听是真的服务；测试文件则直接调用 handler，不打开这个端口。
	log.Fatal(http.ListenAndServe("127.0.0.1:8080", handler))
}
```

## 按一次请求的执行顺序读

1. `newHandler()` 先解析当前目录中的page.html，成功返回处理器与nil错误。`nil, err` 表示无法建立可用处理器。找不到文件或模板语法错时，程序在启动阶段结束。
2. `GET /{$}` 注册根路径GET。`{$}` 是ServeMux的路径结束标记；仅 `/` 匹配，`/missing`不匹配。
3. 收到请求才执行匿名处理函数，从查询参数取title，空值使用“学习记录”。分钟为固定30，尚未读数据库。
4. `bytes.Buffer` 是保存在内存中的缓冲区，`Execute(&body, PageData{...})` 将模板和数据生成到它里面。`&body`传地址，执行器可以写它；生成失败时还未发成功正文，可返回500。
5. 成功后声明 `text/html; charset=utf-8`，再把缓冲区的字节切片写出。`[]byte` 是一组字节；HTML在网络上传输为字节，浏览器按UTF-8还原文字。

这里匿名函数与闭包的写法已经在 [中间件](#/learn/go/go-web-frameworks) 拆过；它捕获启动时解析好的page，每次请求重用。log是标准库日志包，`Fatal`记录错误并结束进程，不是向浏览器发送响应。

### 就地练习：两种错误发生的时机

分别思考page.html缺失与模板访问了数据中不存在的字段。哪种在ParseFiles、哪种在Execute暴露？

### 参考核对：两种错误发生的时机

缺文件在解析阶段失败；字段取值可能在执行阶段失败。先写缓冲，执行错误时还可以发送完整500。

## 启动，亲自看到真实页面

在template-pages目录保存全部文件，运行：

```sh
go run .
```

终端保留运行。浏览器打开 `http://127.0.0.1:8080/`，主标题为“学习记录”，段落为“今天学习30分钟”；打开 `http://127.0.0.1:8080/?title=Go`，标题变为Go。按Ctrl+C停止服务。端口占用时，停止自己的旧服务或一起改监听地址和浏览器地址。

F12打开Network面板，刷新并选页面请求，查看Response：双花括号已经变成文字。关闭浏览器JavaScript后刷新，内容依旧出现，因为填值在服务器。修改page.html后要停止再运行，模板只在启动时读一次。

## 测试：main_test.go

```go
package main

import (
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
)

func TestPage(t *testing.T) {
	handler, err := newHandler()
	if err != nil {
		t.Fatal(err)
	}
	// QueryEscape 把空格和尖括号编码为合法查询参数，不能直接拼未编码用户文字。
	req := httptest.NewRequest("GET", "/?title="+url.QueryEscape("读书 <社>"), nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != 200 || rec.Result().Header.Get("Content-Type") != "text/html; charset=utf-8" {
		t.Fatalf("响应错误：%d %s", rec.Code, rec.Header().Get("Content-Type"))
	}
	// 检查发出的 HTML 源码，输入的尖括号必须转为实体，不能变成标签。
	if !strings.Contains(rec.Body.String(), "<h1>读书 &lt;社&gt;</h1>") {
		t.Fatalf("模板没有按预期填值并转义：%s", rec.Body.String())
	}
	missing := httptest.NewRecorder()
	handler.ServeHTTP(missing, httptest.NewRequest("GET", "/missing", nil))
	if missing.Code != 404 {
		t.Fatalf("未知路径应返回404，实际%d", missing.Code)
	}
}
```

同一目录运行：

```sh
go test -v ./...
```

看到TestPage的PASS与包的ok。这个测试直接调用同一处理器，不需要8080监听。`url.QueryEscape` 编码查询参数中的特殊字符，保证空格与尖括号按文字输入传入；它不同于HTML转义。

**HTML转义让输入作为文字显示，不让输入改变文档结构。**“读书 <社>”在响应源码中是 `读书 &lt;社&gt;`，浏览器显示原文字，不创建一个社标签。模板文件应由开发者可信编写；不能把用户输入转成 `template.HTML` 绕过转义，也不能把本例当完整网站安全方案。

## 预测再做修改

先把分钟改45，重启看页面。再故意将模板主标题动作改为Minutes，预测显示与测试结果。最后把page.html暂时重命名，预测启动是否还能成功。

### 参考答案

分钟改45后重启才显示45；把h1动作换成.Minutes会显示数字，原标题测试应失败；page.html缺失则ParseFiles报错，服务不应开始监听。

## 独立变式与边界

增加导出的 `Topic string` 字段，在模板新增“学习主题”段落，给它传包含尖括号的文字并补响应断言。当前练习仅显示数据，没有数据库、登录、记录保存和线上部署；查询参数不是可信业务数据。

参考：[Go模板教程](https://go.dev/doc/articles/wiki/)、[html/template安全模型](https://pkg.go.dev/html/template#hdr-Security_Model)。

## 模板动作、上下文转义与信任边界

html/template按HTML上下文转义数据，不应为了让输入看起来像HTML就把它转成template.HTML。点号表示当前数据，if控制分支，range遍历集合，with会改变点的当前对象；定义与复用模板有助于保持页头页脚一致。

解析模板和执行模板是两个错误时机。启动时检查文件能及时暴露路径/语法错误，执行时先写入缓冲能避免半页成功内容。模板不提供用户权限或数据库校验，只负责把已经选定的数据放进HTML。

### 参考答案：独立实现与验收

在本节完整工程副本里做三处同步修改，未列出的代码保留原样：

```go
// main.go：PageData新增字段，Execute时提供它。
type PageData struct {
    Title string
    Minutes int
    Topic string
}
// 用下面字面量替换原Execute调用中的PageData值：
// PageData{Title: title, Minutes: 30, Topic: "<Go & Web>"}
```

page.html在原分钟段落后新增：

```html
<p>学习主题：{{.Topic}}</p>
```

main_test.go新增测试，沿用已存在的testing、httptest、strings导入：

```go
func TestTopicEscaped(t *testing.T) {
    handler, err := newHandler()
    if err != nil { t.Fatal(err) }
    rec := httptest.NewRecorder()
    handler.ServeHTTP(rec, httptest.NewRequest("GET", "/", nil))
    if rec.Code != 200 { t.Fatalf("status=%d", rec.Code) }
    body := rec.Body.String()
    if !strings.Contains(body, "&lt;Go &amp; Web&gt;") || strings.Contains(body, "<Go & Web>") {
        t.Fatalf("topic not escaped: %s", body)
    }
}
```

go test ./...应通过，浏览器显示尖括号原文而非新标签。这里测试的是服务器生成的响应，不能把客户端任意脚本注入也称为已被验证。

### 就地练习：with改变了谁

对含Author子结构的模板，进入with .Author后怎样读取Name？要回到根数据应使用哪种引用？

### 参考核对：with改变了谁

点已变为Author，可用.Name；根数据通常用$引用，如$.Title。上下文变化不等于原结构体被修改。
