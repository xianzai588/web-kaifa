# 认证、归属与对象权限：登录之后仍要逐次检查

用户 A 创建私人题目，用户 B 知道题目 id。B 登录成功，只证明他是 B；不证明他能看 A 的数据。认证解决“请求来自谁”，授权解决“这个身份可不可以做这个操作”。两者必须在服务端执行，页面隐藏按钮、CORS 限制和输入一个 owner_id 都不能提供身份保证。

## 1. 注册与密码存储：不要自己发明密码算法

注册至少包括输入校验、账号唯一约束、密码散列与安全存储。不能保存明文密码，也不能直接用 SHA-256 当生产密码散列；普通快速哈希面对离线猜测缺少密码算法的成本设计。选择成熟密码散列库，并按当前安全要求设置参数。OWASP 给出 Argon2id 等方案；已有 bcrypt 项目还要注意它的输入长度限制和成本配置。算法选择不是把一个函数名粘上就完成安全。

下面是**密码散列函数片段**，需要导入 `golang.org/x/crypto/bcrypt` 并在独立认证项目安装该依赖，不能直接替换本节的标准库主程序。它演示生成与校验，不提供注册接口、持久化、限速或生产密码策略：

```go
hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
if err != nil { return err }
// 保存 hash，不保存 password；请勿打印两者。
err = bcrypt.CompareHashAndPassword(hash, []byte(candidate))
if err != nil { return err } // 调用层映射统一登录失败反馈；不可继续创建会话。
```

bcrypt 超过 72 字节的密码不能按普通路径处理，不要悄悄截断。登录失败信息要避免泄露账号是否存在；同时限制失败尝试，密码重置与多因素流程需要另外设计。本节未实现这套生产认证。

### 就地练习：同密码不比新哈希

两次使用随机盐生成哈希字符串不同，是否说明密码不同？应怎样验证候选？

### 参考核对：同密码不比新哈希

不能这样推断；用保存的盐和参数验证，不能拿新随机哈希直接比字符串。

## 2. 登录、会话与失效：身份从可信链条来

登录校验通过后创建会话，令牌使用安全随机源，例如 crypto/rand，不使用时间戳或 math/rand 猜测随机值。服务端保存令牌关联的 userID 和有效期；请求携带令牌后，认证中间件验证存在、未过期、未撤销，才能把 userID 放入请求上下文。用户名或 userID 从请求 body 传来时只是未经验证的声明。

cookie 认证要结合 HTTPS 配置 Secure、HttpOnly、合适的 SameSite、路径和有效期；改变状态的请求仍需要适合实际应用的 CSRF 防护。生产会话应在登录/权限变化等场景更新，注销时服务端使会话失效并清理 cookie，而不只是删除前端页面上的用户名。token 过期、服务端撤销、多设备会话等都需要可验证行为；不要记录密码和完整会话令牌。

### Session 与 JWT：状态放在哪里

传统 Session 让客户端保存不透明随机令牌，服务端查会话表获得身份、有效期和撤销状态。优点是可以在服务端立刻注销一个会话；代价是每次验证要查询或缓存状态。JWT 通常携带声明并有签名，服务端用可信密钥验证后读取身份。**签名保证真实性与完整性，不代表加密**，常见JWT的payload可直接解码，不能放密码或机密数据。

验证JWT不能只“解码JSON”：使用成熟库、限定允许算法与可信密钥，检查签名，以及本系统要求的 `iss`（发行者）、`aud`（接收方）、`exp`（到期）、`nbf`等声明；不能让不可信token里的算法或地址任意选择验证机制。token复制后仍可能在到期前可用，所以无状态JWT的注销不是删除前端token就完成。需要短有效期、刷新token的生命周期和轮换、撤销清单或账户版本等明确策略。不同方案各有状态成本，本主题没有提供可直接上线的JWT实现。

#### 就地练习：签名不是加密

JWT payload可以解码，能否放密码？只解码出userID能否确认身份？

#### 参考核对：签名不是加密

不能；常见JWT并未加密，必须验证可信签名和适用声明，解码不提供身份保证。

### Cookie 的三个标记，各保护什么

`Secure` 要求cookie通过安全连接发送；`HttpOnly` 防止页面JavaScript直接读取cookie，不阻止浏览器自动发送；`SameSite` 控制某些跨站请求携带cookie的行为，Strict/Lax/None影响不同，None通常配合Secure。它们不能代替密码校验、对象授权或完整XSS防护。Domain与Path限制也应只覆盖必要范围；跨站与跨来源不是一个概念，不能看到另一个子域就自动认为SameSite等同CORS。

#### 就地练习：三个属性的范围

分别指出Secure、HttpOnly、SameSite能否取代对象授权。

#### 参考核对：三个属性的范围

都不能；分别影响传输、脚本读取、跨站携带，服务器仍需授权及适用CSRF措施。

### CORS 与 CSRF：能读响应，与能发请求

CORS是浏览器对跨来源脚本访问响应的控制。例如前端 `http://localhost:8743`、API `http://localhost:8753` 端口不同，属于跨来源。服务端可以只允许这个固定开发Origin；需要凭据时客户端与服务端都配置credentials，允许来源不能用 `*` 代替具体来源。某些方法、头或Content-Type会先发OPTIONS预检，服务端需正确回应允许的方法与头，不能把预检失败当作“后端计算错了”。正式部署的来源应另设白名单，不回显任意Origin。

但浏览器可能发出某些跨站请求，即使攻击页面不能读取返回内容，因此CORS不是CSRF防护。cookie自动携带时，恶意站点可能诱导用户浏览器执行修改操作。实际cookie方案应结合合适SameSite、对状态变更使用POST/PATCH/DELETE、验证适用的Origin/Referer，并在需要时用与会话关联、不可预测的CSRF token，服务端比较后才变更。不要把GET设计成删除，也不要把“页面按钮隐藏”当作防护。最小验收是：正常来源和正确token可修改，缺失/错误token或不允许的来源拒绝，并确认数据库未变化。XSS仍可能破坏这些防线，需要输入输出处理与页面安全策略配合。

#### 就地练习：不能读也可能发送

攻击页面不能读取跨源响应，是否就一定不能诱发用户Cookie写请求？

#### 参考核对：不能读也可能发送

不是；某些请求仍可发出，需CSRF/Origin等实际设计并确认拒绝时数据未变。

### 就地练习：注销的服务端证据

只删浏览器Cookie与撤销服务端会话有什么差别？旧标识再请求应怎样？

### 参考核对：注销的服务端证据

只删本地不保证旧标识失效；正确注销后服务端拒绝旧凭据，还需检查过期。

## 3. 每个对象的每种操作都要授权

创建时 ownerID 来自可信身份；列表按当前用户筛选；详情、更新、删除都同时检查资源 id 与归属。数据库片段 `WHERE id=$1 AND owner_id=$2` 中 `$2` 应来自已验证身份，不能来自用户填写的 owner_id。拒绝错误时按产品契约选择 403，或为了避免暴露存在性统一 404；未认证通常是401。状态区别应该一致，不能失败后仍泄露题目正文。

同样规则也适用于批量更新、导出、搜索和嵌套资源。只保护详情而列表泄露标题仍是漏洞。更新操作最好把归属条件放进同一次数据库语句，并检查受影响行数，避免“先查一次，稍后不带条件更新”产生验证与写入之间的空隙。

### 就地练习：状态与数据都验

B请求A的记录应拒绝，除了403/404还要断言什么？

### 参考核对：状态与数据都验

不能泄露正文或改变A数据，每种对象入口都要约束服务端验证的身份。

## 标准库可运行授权练习：main.go

VS Code 打开 `exercises/go/go-auth`，建立 main.go，首次 `go mod init example.com/learn/go-auth`，再 `go run .`。**本例传入的 userID 假定来自已验证认证中间件，代码里用固定值模拟测试身份；不是从用户请求取身份，也不是完整登录系统。** 它只运行授权纯逻辑与会话有效期判断。

```go
package main

import (
	"errors"
	"fmt"
	"time"
)

var ErrDenied = errors.New("无权访问")

type Problem struct { ID, OwnerID int; Title string }
type Session struct { UserID int; Expires time.Time; Revoked bool }

func UserFromVerifiedSession(s Session, now time.Time) (int, error) {
	if s.UserID <= 0 || s.Revoked || !now.Before(s.Expires) {
		return 0, errors.New("会话无效")
	}
	return s.UserID, nil
}

func Rename(p *Problem, verifiedUserID int, title string) error {
	// 先验证可信身份与对象归属，再修改；拒绝时原标题必须保持不变。
	if verifiedUserID <= 0 || p.OwnerID != verifiedUserID { return ErrDenied }
	p.Title = title
	return nil
}

func main() {
	p := Problem{1, 10, "A 的题目"}
	err := Rename(&p, 20, "B 篡改")
	fmt.Println("B 被拒绝：", errors.Is(err, ErrDenied))
	fmt.Println("原内容：", p.Title)
	err = Rename(&p, 10, "A 更新")
	fmt.Println("A 更新成功：", err == nil)
	fmt.Println("新内容：", p.Title)
	now := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	s := Session{10, now.Add(time.Hour), false}
	userID, err := UserFromVerifiedSession(s, now)
	fmt.Printf("有效会话：user=%d，成功=%t\n", userID, err == nil)
	s.Revoked = true
	_, err = UserFromVerifiedSession(s, now)
	fmt.Println("注销后拒绝：", err != nil)
	s.Revoked = false
	_, err = UserFromVerifiedSession(s, now.Add(time.Hour))
	fmt.Println("到期时拒绝：", err != nil)
}
```

```output
B 被拒绝： true
原内容： A 的题目
A 更新成功： true
新内容： A 更新
有效会话：user=10，成功=true
注销后拒绝： true
到期时拒绝： true
```

代码用固定 now，便于确定地测试到期边界，不依赖等待一小时。用户 id 为零一律拒绝；有效期正好到达也拒绝。这些结果不能证明 cookie、真实密码库、限速、持久会话存储和跨站保护已验收。

## 改一个条件

把 Rename 的归属判断删掉再运行 B 操作，会发生什么？为列表写 `ListOwned(items, verifiedUserID)`，确保 B 看不到 A 的题目。之后在真实认证项目使用两个已登录客户端测试读、改、删、注销后重放，记录 A 数据有没有改变。

### 参考答案

删掉判断后 B 不再被拒绝，原标题变成“B 篡改”，这是直接对象授权失败。列表必须逐项按可信 userID 筛选，不能先返回所有对象再依赖前端隐藏。真实项目中即使 body 伪造 `owner_id=10`，B 的可信身份仍然是20，应该拒绝并保留 A 的数据。

自查：密码散列、身份校验、会话失效、对象授权分别在哪一步？每一种私有读写入口是否覆盖？有没有把这个纯逻辑例子标成完整安全系统？带 AI 排错时可给脱敏请求和拒绝结果，但不要给真实密码、token 或数据库连接串。

官方参考：[OWASP 认证](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)、[授权](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)、[会话管理](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)、[密码存储](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)、[JWT](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html)、[CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)、[MDN CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)、[bcrypt](https://pkg.go.dev/golang.org/x/crypto/bcrypt)、[crypto/rand](https://pkg.go.dev/crypto/rand)。
