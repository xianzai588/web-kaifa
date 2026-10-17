# CI 与可复现的质量检查

把本机真实能执行的检查交给干净环境重复运行，再用故意错误证明它会拒绝问题。

## CI 不只是一个绿色图标

CI是Continuous Integration，持续集成：代码提交或合并请求触发自动检查，在统一环境构建和测试。它减少“只有我电脑能跑”的问题，但只执行你实际配置的工作。工作流文件是步骤说明，runner是执行这些步骤的机器环境，job是一组工作，step是一项动作。

**CI绿色只说明已配置并实际执行的检查通过，不说明没写的测试、被跳过的数据库或上线恢复也通过。** CI检查与CD部署是不同职责，本章配置不自动发布公网服务。

### 就地练习：绿色属于哪个版本

找到一个CI运行的提交SHA，与当前分支HEAD对照。不同SHA的绿灯能否作为本次通过？

### 参考核对：绿色属于哪个版本

不能；证据需对应交付提交与实际检查命令。旧分支或旧版本的结果不能替代本次。

## 先在独立工程本机跑懂三条命令

打开 [交付工程](assets/downloads/web-followup-11.zip) followup-11，Go版本满足go.mod，依赖与自己的专用数据库按README准备。终端位于此独立模块：

```sh
go vet ./...
go test -v ./...
go build ./...
```

vet静态检查可疑用法，例如打印格式不匹配；test执行_test.go里的测试；build确认源码能编译，不会自动把全部业务都验证。`./...`代表当前模块下各包，不是整台电脑。

编译通过不保证断言正确；测试通过不证明测试充分。TestRealDatabase与身份数据库测试如果缺TEST_DATABASE_URL会SKIP，必须记录未执行。真实集成测试用名称以 `_test`结尾的独立测试库，不复用业务数据。

## 看懂现有 YAML 工作流

工程ci/verify.yml是完整参考。下面只截入口，注释解释语义，不是独立完整配置：

```yaml
name: club-verify
on: [push, pull_request] # 提交与合并请求事件触发。
permissions:
  contents: read        # 只需读源码，不授予无关写权限。
jobs:
  verify:
    runs-on: ubuntu-latest # 检查实际运行在Linux环境，不是你的Windows终端。
```

YAML用缩进表示结构，空格层级影响对象归属，不用Tab。完整步骤依次取源码、准备Go/Node、启动PostgreSQL测试服务、运行Go检查、迁移、启动API、准备浏览器并执行端到端测试。

checkout取本次代码；setup-go按go.mod声明准备工具链；go.sum与锁文件约束依赖。测试数据库服务名与连接地址要符合runner环境。工作流中出现的教学密码只用于短命隔离测试环境，不应当作生产秘密。

### 就地练习：本地与远程分别证明

本机go test通过后写出还缺哪条证据，才能声称GitHub Actions已执行同一测试。

### 参考核对：本地与远程分别证明

需远程相同SHA的Actions运行和具体步骤日志；存在YAML或推送成功都不等于流水线通过。

## 前后端结合的检查覆盖什么

单元测试检查小行为；数据库集成测试检查真实PostgreSQL；Playwright端到端测试在浏览器里走注册、登录、报名等路径。工程有package.json与锁文件，npm ci按锁文件安装，npm run test:e2e执行已有脚本。先按README本机准备Node、浏览器和API，再分别验收，不因某段没准备就跳过冒充全绿。

**任何失败命令都应使工作流失败，不能用忽略错误或不存在脚本的跳过选项掩盖。** 随机id/Token和不同耗时应按实际语义断言，不能要求跨运行固定字符串。

## 把完整工程放进自己的仓库再触发

这一段使用 **Git 管理代码、GitHub 保存远程仓库、GitHub Actions 执行工作流**。先安装 Git，用 `git --version` 确认命令可用，准备自己的 GitHub 账号和一个空仓库；Git 命令不熟悉时先读 [Git 基础与提交](#/learn/web/web-git)，不要求先学习 JavaScript。

把 followup-11 下载包解压到学习资料仓库之外的一个新目录，用 VS Code 打开它。保留项目 `.gitignore`，先核对 `.env`、依赖、数据库目录、备份和编译文件被排除。下面是该独立目录中的 PowerShell 步骤，远程地址的 YOUR_ACCOUNT/YOUR_REPO 必须先换成你自己的空仓库：

```powershell
# 初始化这一份独立工程；不要在资料仓库根目录重复初始化。
git init -b main
New-Item -ItemType Directory -Path '.github/workflows' -Force
Copy-Item -LiteralPath 'ci/verify.yml' -Destination '.github/workflows/verify.yml'
git switch -c ci-practice
git add .
git status --short
# 先检查暂存列表只有源码、锁文件与配置模板，再提交。
git commit -m "Add verified practice workflow"
git remote add origin https://github.com/YOUR_ACCOUNT/YOUR_REPO.git
git push -u origin ci-practice
```

init 创建本地记录，switch 创建练习分支，add 放入待提交区，commit 保存本次代码版本，remote 连接远程库，push 上传这个分支。New-Item 创建工作流目录，Copy-Item 把已有完整 YAML 放到 Actions 会自动读取的位置。首次提交可能要求配置 Git 姓名和邮箱，首次推送可能要求完成 GitHub 登录；按 Git 课处理这些实际提示，失败时不要声称已上传。

打开你自己的 GitHub 仓库，进入 Actions，找到**相同提交编号**对应的运行，查看步骤和失败日志。仓库须允许 Actions 运行。只有这个记录真实出现并完成，才取得远程 CI 证据。

这份学习资料仓库内的ci示例只是文件，阅读或复制它没有证明远程执行。远程库与账号操作由学习者主动完成；生产凭据按平台Secrets等受控入口管理，不写入工作流。

## 先预测，再做故意错误

在自己的练习分支，把已覆盖断言里的一个正确状态改成错误预期，例如匿名访问应401却写201。先本机test应FAIL，再看同一提交的远程任务也FAIL、日志能定位对应测试。还原后再次通过。

### 参考答案

故意错误仍全绿时先查测试入口、命令退出码与提交SHA。日志必须能定位预期失败的具体测试；还原后重新通过才证明该路径确实参与CI。

## 独立变式

新增一个针对错误JSON的API测试，让它在本机与CI执行；故意删除decodeJSON相关检查，证明新测试会失败，再恢复。记录Go测试、真实数据库、浏览器和未执行项，区分每种证据。

参考：[GitHub Actions基础](https://docs.github.com/en/actions/get-started/understand-github-actions)。

## 一次检查必须能指向确切提交

CI结果应对应当前提交SHA与锁定依赖，不把另一分支绿色结果当本次证据。缓存只加速，不应让测试跳过；数据库服务就绪、迁移和集成环境要分别检查。构建产物与测试报告保留版本信息便于追溯。

远程流水线需要最小权限，日志不打印秘密。固定或审核外部Action与依赖版本，明确哪些检查是静态、单元、集成、浏览器或部署后验证；没有真实数据库的单元测试不能自动提升为持久化验收。

### 参考答案：独立实现与验收

在followup-11已有json_limits_test.go旁新建json_invalid_answer_test.go，复用security_test.go的fixture与secureRequest：

```go
package main

import "testing"

func TestInvalidJSONDoesNotCreate(t *testing.T) {
    _, handler := fixture(t)
    cookie, csrf := loginFixture(t, handler, "club_admin")
    // 不只检查400，还要比较前后数据，防止先写入再报错。
    before := secureRequest(handler, "GET", "/api/events", "", cookie, "")
    response := secureRequest(handler, "POST", "/api/events", `{"title":"broken",}`, cookie, csrf)
    if response.Code != 400 { t.Fatalf("status=%d body=%s", response.Code, response.Body) }
    after := secureRequest(handler, "GET", "/api/events", "", cookie, "")
    if before.Code != 200 || after.Code != 200 || before.Body.String() != after.Body.String() {
        t.Fatal("非法JSON改变了列表")
    }
}
```

运行go test -run TestInvalidJSONDoesNotCreate -count=1，再确认CI实际执行的go test ./...包含该文件。删除decodeJSON的首次解码错误检查可能仍被后续检查拒绝，不保证这一种变异一定让该测试失败；应制造“非法输入实际被接受”的确定故障，再确认测试失败。不要把只改了某行源码却没改变行为当作测试无效。

### 就地练习：区分跳过与通过

测试因未设置TEST_DATABASE_URL而SKIP，CI整体绿。报告应怎样写数据库验收？

### 参考核对：区分跳过与通过

单元/静态可通过，真实数据库为未执行；不能把SKIP提升为持久化验证。
