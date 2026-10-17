# 密码哈希与验证

认识凭据、哈希和随机盐，再运行已有密码验证测试，而不是自造密码算法。

## “服务器能验证”不等于“服务器保存明文”

用户注册和登录时提交密码，服务器需要判断密码是否匹配。明文是原始可直接读出的密码；如果数据库或日志保存它，泄露后别人就能直接使用。加密可借密钥还原，不是此处保存密码的目标。

**密码存储使用专用密码哈希：保存验证所需的结果与参数，而不保存可还原的明文。** 哈希可理解为按算法从输入生成结果；密码算法还要有足够计算与内存成本，拖慢泄露后的大量猜测。普通快速SHA哈希不适合直接当密码存储方案。

随机盐是每个密码独立生成的随机数据，与密码一起参与计算，可以随哈希保存。同密码因为盐不同，应产生不同存储结果；盐不是密码，也不是靠保密保护账户的唯一秘密。

### 就地练习：同密码为何不同存储串

同一虚构密码哈希两次，预测字符串相等与验证结果。为什么不能重新哈希再比较文本？

### 参考核对：同密码为何不同存储串

独立随机盐使存储串不同，但用各自盐和参数验证原候选都应true。新随机哈希不能作相等比较。

## 使用已有维护的实现

下载 [安全会话工程](assets/downloads/web-followup-10.zip)，解压，VS Code打开followup-10。已有go.mod/go.sum；Go工具链必须满足声明，运行go version核对，然后：

```sh
go mod download
go test -v -run TestArgon2SaltAndVerify ./...
```

只运行这个单元测试不需要先启动HTTP服务，也不要求数据库或真实账户。它使用虚构测试密码，正确时TestArgon2SaltAndVerify PASS、包ok；路径和耗时可不同。缺工具链或依赖下载失败，属于未执行，不算算法验证通过。

## 沿 security.go 的两段函数读

hashPassword负责生成存储结果：先用crypto/rand取16字节盐，再调用 `golang.org/x/crypto/argon2` 的Argon2id实现，最后把算法版本、内存/迭代/并发参数、盐和结果编码进存储字符串。参数是这份工程选择，不是对所有机器永远最优。

verifyPassword负责验证：先限制保存格式的长度，再解析固定算法参数，核对盐和结果的编码长度，之后才解码；用相同参数对候选密码计算，再比较结果返回bool。这里用的是**恒定时间比较**：在相同长度下，比较过程不因为相同前缀更长而提前结束，减少这种时间差泄露信息。它不是定时器，也不是从hash“解密得到原密码”。

以下是已有账户创建/验证函数里的**调用片段**，不是独立main.go；password是注册输入，candidate是登录输入，需要放在有error返回的调用函数中：

```go
hash, err := hashPassword(password) // 使用项目security.go的函数，不是标准库函数。
if err != nil {
	return err // 随机生成失败等情况不能继续保存一个空哈希。
}
// 存储hash以及验证参数，绝不把password写进数据库或日志。
matched := verifyPassword(hash, candidate) // false应拒绝登录，不是返回原密码。
```

Base64只是把字节表示成文字，便于保存，不是加密。项目使用维护库的算法核心，但解析和业务边界仍需要测试。密码哈希有成本，当前通过通道限制同时两项哈希；这不等于已实现完整抗攻击能力。

### 就地练习：先校验格式再计算

把“上限长度检查、拆格式、解码盐、Argon2计算、恒定时间比较”按执行顺序排列。

### 参考核对：先校验格式再计算

先限制格式和编码长度，再解析/解码并计算、比较；坏格式不应无上限分配或进入昂贵工作。

## 正常、错误和盐的实际检查

security_test.go里的测试用同一虚构密码算两次hash，要求结果不同；原密码验证应true，错误密码应false；存储结果不能包含明文。

先预测，再在自己的练习副本将错误候选改为正确候选而保持“应拒绝”的断言，测试必须FAIL；还原后PASS。接着试不合格的存储格式，验证应false，不应panic；超长存储格式应在解析前拒绝，不能让输入长度决定无上限的解析分配。

**密码正确只证明凭据匹配，会话、过期和记录权限还没验证。** 下一节继续身份链条。网络传输中的密码仍要使用HTTPS保护；哈希存储不能替传输保护。

### 参考答案

同密码不同盐得到不同存储文字，验证使用已保存盐与参数。两次新哈希不等不能推出密码不同；格式错误应返回false，不应panic或无上限分配。

## 独立变式与限制

新增加的 `TestVerifyPasswordRejectsMalformedStorage` 使用空串、错误格式、非法 Base64 和超长编码验证 false；超长编码先在128字节上限处拒绝，尚未执行 Split 或 Base64 解码。16字节盐和32字节结果分别需要22、43个无填充 Base64 字符，长度检查放在解码前。运行 `go test -v -run TestVerifyPasswordRejectsMalformedStorage ./...` 可单独检查这一边界。

这里的“提前拒绝”针对保存格式的解析，不是说密码验证完全不分配内存：合法输入还会进入有成本的 Argon2 计算。完整依赖工程仍须满足自己的 go.mod 和环境要求；隔离的边界测试不能冒充整套登录或数据库验证。

为“错误存储格式/正确候选/错误候选”补测试，记录预期bool。真实密码、Cookie、Token、DSN与哈希不进入Git或AI问题。账户恢复、邮箱验证、多因素验证、参数升级与真实容量均属完整产品工作，本演示不宣称具备。

参考：[OWASP密码存储](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)、[Go Argon2](https://pkg.go.dev/golang.org/x/crypto/argon2)。

## 成本、随机盐与验证入口

密码哈希需要专用、有成本且可调参数的算法，普通SHA摘要不等价。每条记录使用密码学随机盐，保存算法标识与参数，验证时按保存信息计算并比较；不能每次生成新随机哈希再比较字符串。

验证入口同时要限速、限制并发、限制输入和存储格式长度，防止昂贵计算被无限放大。统一对外登录失败提示有助于避免泄露账户存在性，内部仍需可诊断日志；不能记录明文密码或完整凭据。参数升级需成功验证旧格式后再重算保存，不能无依据批量改写哈希。

### 参考答案：独立实现与验收

在followup-10的security_test.go加入独立测试，复用已有testing、strings导入：

```go
func TestPasswordCandidatesAndMalformed(t *testing.T) {
    encoded, err := hashPassword("Test-only-password-123")
    if err != nil { t.Fatal(err) }
    if !verifyPassword(encoded, "Test-only-password-123") { t.Fatal("正确候选被拒绝") }
    if verifyPassword(encoded, "wrong-password") { t.Fatal("错误候选被接受") }
    // 坏格式必须在昂贵的密码计算之前拒绝，不能panic或当作匹配成功。
    for _, invalid := range []string{"", "$bad$", strings.Repeat("x", 129)} {
        if verifyPassword(invalid, "Test-only-password-123") { t.Fatal("非法存储格式被接受") }
    }
}
```

运行go test -run TestPasswordCandidatesAndMalformed -count=1。预期正确候选true、错误候选false、三种坏格式false。它测试密码函数，不等于登录会话、真实数据库或生产容量已通过。

### 就地练习：并发限制还缺限速

同时最多两次哈希，能否阻止攻击者持续排队提交？写出还需观测和限制的入口行为。

### 参考核对：并发限制还缺限速

不能；仍需请求限速、输入上限、排队/拒绝策略及容量测量。两项并发不是完整抗滥用保证。
