# 模块、包与工具链：让代码真的跑起来

你要做的是一个能重复运行的小程序，而不是在编辑器里存一段看起来像代码的文字。VS Code 负责编辑文件；Go 工具链负责检查语法、编译和执行。安装 Go 扩展可以得到补全和诊断，但扩展不能替代 Go 安装。先在 VS Code 的“终端 → 新建终端”输入 `go version`，看到版本再继续；找不到命令时回到安装与起步教程检查 PATH，并完全关闭、重开 VS Code。

## 先认清三个名字

**文件**是 `main.go` 这样的文本，保存后才成为磁盘上的源码。**包**把同一目录中的普通 Go 文件组织起来；它们通常写相同的 `package` 声明。可执行程序使用 `package main`，启动入口是 `func main()`。**模块**是一个带 `go.mod` 的项目单位，它记录模块路径、Go 要求和依赖。一个模块可以包含多个目录、多个包；模块路径与包名不必相同。

模块路径 `example.com/learn/go-tools` 在这份本地练习中是标识，不表示你需要购买域名或先部署网站。自己建立练习时，在独立目录初始化模块；不要把整个教材仓库变成一个 Go 项目。已有 `go.mod` 的练习不用再次初始化。标准库如 `fmt` 随 Go 提供，不需要 `go get fmt`。

### 就地练习：文件、包与模块

为main.go、package main、go.mod分别标出文件、包、模块层级，再检查自己的练习目录。

### 参考核对：文件、包与模块

源码文件属于包，go.mod界定模块；独立练习有自己的模块，不在资料仓库根目录初始化。

## 在 VS Code 建立独立练习：先初始化，再运行，最后调试

按下面顺序做，每一步先看预期结果，再继续。**独立新建目录只有main.go，不等于已经初始化了Go模块**；装好了Go扩展和Delve，也不能跳过模块准备。

### 第1步：打开装着源码的文件夹

**动作**：第一次新建练习，可以创建`exercises/go/go-tools`，用VS Code“文件 → 打开文件夹”选它。已经在桌面建了一个叫`go`的文件夹并写了main.go，就直接打开这个已有文件夹，不要求改名或重新抄一遍。打开的是文件夹，不是只双击main.go。

**应看到**：左侧最上层是你的独立项目文件夹，下面能找到main.go。下载起步包的人应同时看到main.go、go.mod、.vscode；他们跳过第4步的初始化。

**不一致时**：若最上层是整个教材仓库、桌面、下载目录或ZIP文件，请重新“打开文件夹”选择真正放main.go的那一层。不要在教材仓库根目录为了消除报错初始化模块。已有源码先保留；本课“完整程序”供新练习建立或对照，不要求覆盖你自己的代码。

### 第2步：保存完整源码

**动作**：新练习在左侧点“新建文件”，命名main.go，复制下方“完整程序：main.go”，按Ctrl+S（Mac用Cmd+S）。已有main.go的人先保存当前代码，不另建一个也含func main的重复文件。

**应看到**：文件标签的未保存圆点消失，文件名是main.go，右下角语言模式是Go。

**不一致时**：main.go.txt要改成正确扩展名；空文件要补齐程序。main.go里的内容应以package main开始，Go命令要输入终端，不写进源码。

### 第3步：先核对终端目录和Go工具

**动作**：菜单“终端 → 新建终端”。根据提示符选择下面一组目录检查命令：

Windows PowerShell通常有PS前缀：

```powershell
Get-Location
Get-ChildItem
```

Windows cmd通常只有盘符和路径：

```bat
cd
dir
```

macOS/Linux终端：

```sh
pwd
ls
```

**应看到**：当前路径就是第1步打开的独立项目，文件列表有刚保存的main.go。文件夹不一定叫go-tools，关键是路径与源码所在位置一致。然后在同一个终端运行：

```powershell
go version
```

**应看到**：实际Go版本。**不一致时**：目录错了先回“打开文件夹”选对项目，再新建终端重新核对；go不是命令则先按[Go环境教程](../../../index.html#/setup?topic=go)安装SDK并重开VS Code。看到Delve的监听信息不能代替go version与目录检查。

### 第4步：没有go.mod才初始化（已有文件夹也需要）

**动作**：查看第3步列出的文件。只有main.go、没有go.mod的新建目录，执行下面这一条；它在PowerShell、cmd和macOS/Linux中写法相同，可以单独复制。

如果这里其实是一个已有Go项目的子目录，父级已经有该项目的go.mod，请按那个项目README打开模块根目录，不在子包下再建一套嵌套模块。下面针对的是本课独立新建的练习目录。

```powershell
go mod init example.com/learn/go-tools
```

**应看到**：终端提示创建go.mod，左侧main.go旁边新增go.mod。模块路径只是本练习的标识，不用购买域名。该命令创建项目元数据，不重写main.go，也不安装VS Code插件。

```output
go: creating new go.mod: module example.com/learn/go-tools
```

有时还会提示go mod tidy；当前只有fmt标准库的完整例子可以直接继续运行，不需要go get fmt。

**已有go.mod时**：下载起步包或已有项目直接跳到第5步，不再init、不删除原文件。如果提示go.mod already exists，先确认当前目录确实有正确模块文件，然后运行；不要把“再初始化一次”当成每次打开项目都要做的动作。

### 第5步：先用go run .看到真正的结果

**动作**：先保存main.go，在刚才同一个项目终端运行：

```powershell
go run .
```

**应看到**：使用本课完整程序时有“你好，Go”和“编译后的程序也能独立运行”两行。改greeting里的调用参数、保存、重跑后输出也应改变。结果在底部Terminal，不在网页、Output或Debug Console里找。

**失败时**：go.mod file not found先用下一节的缺模块恢复步骤；源码错误按文件名/行号修正并保存，再重跑同一条命令。这里成功之前先不按F5，否则环境、模块和调试问题混在一起更难判断。

### 第6步：运行成功后再整理、检查、构建或F5

这些检查不会替你创建模块。已有go.mod且go run .成功后，再逐条运行：

```powershell
go fmt ./...
go test ./...
go vet ./...
```

`go fmt`整理缩进，成功时可能显示被修改文件名。`go test`运行测试；本例没有测试会显示[no test files]，这不是失败。`go vet`做静态检查，未发现问题时通常安静结束，不等于所有业务逻辑已经正确。

需要断点时，继续[VS Code插件与调试配置](../../../index.html#/setup?topic=editor)，核实gopls/dlv与launch.json，再设置断点、F5。F5的mode:debug会构建当前项目，不是启动你昨天编译的exe。先让模块运行成功，再让调试器暂停看变量，两个验收分别进行。

## F5报go.mod file not found：只有main.go的目录怎样恢复

如果像截图那样Delve已经启动，随后出现go.mod file not found，而工作目录里只写了main.go，这说明还没建立当前Go项目的模块；“能启动调试器”和“项目能构建”是两步。先保留源码，不重装扩展、不把launch.json改成启动旧exe。

**先回到终端核对位置和文件**：PowerShell使用Get-Location与Get-ChildItem；cmd使用下面两条（cd不带参数是查看当前目录）；Mac/Linux使用pwd与ls。不要在错误目录继续init。

```bat
cd
dir
```

**应确认两件事**：路径是自己main.go所在的独立文件夹；文件列表确实有main.go且没有go.mod。如果当前目录是上一级，请在VS Code重新“打开文件夹”选源码那一层，然后新建终端，重复核对。文件夹名叫go也可以，不必为了教程路径改名。

**确认缺模块后，只初始化一次**：

```powershell
go mod init example.com/learn/go-tools
```

**看见go.mod后，先运行当前项目**：

```powershell
go run .
```

看到自己的程序输出，再回Run and Debug选择当前项目配置，设断点后F5。若仍提示缺模块，请看错误写出的cwd是不是刚才初始化的文件夹；go.mod出现在另一目录并不能修复这个工作区。若报go.mod already exists，先核对目录并直接go run .，不删除文件重来。

在资料仓库内练习时，也可能出现cannot find main module，随后根据.git位置建议你cd到上级再go mod init。不要机械照做，把整个学习资料仓库变成一个模块；回到本练习main.go所在的独立目录初始化。这个提示仍说明模块没找到，不是要求改写源码。

**为什么go run main.go可能成功，F5却失败？** 标准库单文件有时能按明确文件名运行，它只使用列出的文件，不替你建立go.mod。go run .与本教程F5配置面向当前项目/包，需要找到所属模块；多文件项目用单文件运行还可能漏掉辅助代码。所以不能拿一次go run main.go成功当作“项目已经初始化”。修复项目结构后继续使用go run .，不建议用GO111MODULE=off关闭模块机制来绕过错误；那会把真正缺少的步骤藏起来，也不适合后面的依赖管理。

## 编译与启动：按当前终端选择写法

先完成上面的go.mod与go run .验收。构建和启动按下面选择，**不要把不同终端的启动命令混用**：

| 终端 | 先编译 | 再启动 | 查看文件 |
| --- | --- | --- | --- |
| Windows PowerShell | `go build -o hello.exe .` | `.\hello.exe` | `Get-ChildItem` |
| Windows cmd | `go build -o hello.exe .` | `hello.exe` 或 `.\hello.exe` | `dir` |
| macOS/Linux zsh/bash | `go build -o hello .` | `./hello` | `ls` |

cmd 中输入 `./hello.exe` 可能报“`.` 不是内部或外部命令”。这首先是终端写法问题，不需要重装 Go；确认编译成功、目录有 hello.exe，再输入上表的 cmd 命令。想固定使用 PowerShell、用菜单运行或 F5 逐行调试，到 [安装 VS Code 的插件与配置教程](../../../index.html#/setup?topic=editor)，按第8–13节配置；里面有真实截图、完整 JSON 和独立练习下载。

`go run .`编译当前包并运行临时程序；`go build`生成独立程序，成功通常不打印消息。源码改过后必须重建，旧程序不会随文件保存自动更新。

### 就地练习：保存不会更新旧程序

构建旧问候后只改源码并保存，直接运行旧程序，再go run .对比，最后重建。

### 参考核对：保存不会更新旧程序

旧可执行文件保留旧文字；go run编译当前源码，重建后独立程序才更新。

## 完整程序：main.go

```go
package main

import "fmt"

func greeting(name string) string {
	return "你好，" + name
}

func main() {
	fmt.Println(greeting("Go"))
	fmt.Println("编译后的程序也能独立运行")
}
```

`import "fmt"` 使用标准库的格式化输入输出包。`greeting` 接受一个字符串参数并返回一个字符串；它不负责打印。`main` 调用函数取得返回值，再交给 `fmt.Println`，所以结果出现在**终端**，不会自动变成浏览器网页。两个 `Println` 各写一行，预期输出为：

```output
你好，Go
编译后的程序也能独立运行
```

## 包如何影响名字可见性

在同一包内可以调用小写名字 `greeting`；其他包不能直接访问它。若设计给其他包调用，可命名 `Greeting`。首字母大写表示导出，不表示函数一定安全或正确。不要在同一目录放两个都包含 `func main()` 的演示文件，否则 `go run .` 会报入口重复；每个独立演示放自己的目录。`go run main.go` 只使用你列出的文件，多文件项目通常使用 `go run .`，避免漏掉同包辅助源码。

### 就地练习：大写决定导出

把同包greeting改名Greeting并同步调用，结果会变吗？若从另一包调用，小写有什么限制？

### 参考核对：大写决定导出

计算相同；大写供包外访问，小写只在本包。导出不表示业务天然正确。

## 改一个条件，再看结果

把 `greeting("Go")` 改成 `greeting("小林")`，保存后先直接运行旧 `hello.exe`，再用 `go run .`。参考答案：旧程序仍输出“你好，Go”，`go run .` 输出“你好，小林”。重新 `go build` 后独立程序才更新。这个对照能解释“我明明改了代码，结果为何没变”。不要把已经在运行的程序输出当成新源码的验证。

## 常见问题与自查

- `go.mod file not found`：回到上面的“F5报go.mod file not found”恢复章节，核对目录/文件→缺模块才init→go run .成功→再F5；不要在错误目录随手建模块。
- `declared and not used` 或 `imported and not used`：变量/导入没有被使用，删除无用代码或实际使用它，Go 将此视为编译错误。
- `undefined: fmt`：检查是否导入 `fmt`，以及拼写大小写；`Println` 与 `println` 不是同一个符号。
- `package ... is not a main package`：检查此演示是否是库包；库通过测试或其他程序调用，不必每个包都能独立运行。

自查：你能指出终端当前目录、`go.mod` 的位置、程序入口和输出位置吗？能解释编辑器扩展、Go 编译器、源码、可执行文件的四个角色吗？运行成功只是环境证据；合上例子独立写出一个问候函数，才是掌握证据。

## 可选：用 Git 留下源码，先检查再提交

Git 用来记录文件的版本，不负责让 Go 程序运行。还没安装 Git 时，先保存 `main.go`、`go.mod` 和自己的运行记录，代码练习可以继续；需要版本管理时再安装、学习 Git。已经在资料仓库内练习时，应沿用仓库已有的 Git，不在练习目录再建一套嵌套仓库。

`go build -o hello.exe .` 会留下编译产物。若随后直接执行 `git add .`，这个程序也可能进入暂存区；“我知道不能提交 exe”不会让 Git 自动排除它。暂存区是下次提交的候选文件，不是已经推送到网上。先在本练习目录新建 `.gitignore`，保存以下内容：

```gitignore
hello.exe
hello
*.exe
.env
```

这份规则保护本例指定名称的构建产物与本机配置；换了输出文件名要同步加规则，不要误以为它覆盖所有项目。`.gitignore` 本身应保存进版本管理，`go.mod` 是源码依赖信息，也应保存。当前标准库示例不一定生成 `go.sum`；引入外部依赖后，存在的 `go.sum` 同样应保存。

在 VS Code 集成终端、当前练习目录内执行：

```powershell
git --version
git rev-parse --show-toplevel
```

第二条显示现有仓库根目录，说明这里已处在仓库中；不要再执行 `git init`。若它明确提示 `not a git repository`，且你准备把这个独立练习作为自己的仓库，再执行 `git init`。下面只暂存明确的源码文件：

```powershell
git add .gitignore main.go go.mod
git diff --cached --name-only
```

预期暂存列表只有 `.gitignore`、`main.go`、`go.mod`，不应包含 `hello.exe` 或 `hello`。存在 `go.sum` 时，再用 `git add go.sum` 添加它。`git diff --cached` 可以检查将要记录的内容；确认后才执行自己的提交命令。不要为运行第一个程序而先解决远程登录、推送或发布。

**如果编译产物已被暂存**，先运行 `git status`，然后在这个目录用 `git rm --cached -- hello.exe` 把它从 Git 候选记录中移除；`--cached` 表示保留磁盘文件。macOS/Linux 本例用 `git rm --cached -- hello`。随后重新查看暂存列表。若它已经在较早的提交中，`.gitignore` 不会自动停止跟踪，仍需要明确移除跟踪并检查差异。不要用删除整个目录来处理一个暂存问题。

这里完成的是保存源码的准备，尚未替你提交或推送。参考：[Git 暂存](https://git-scm.com/docs/git-add)、[忽略规则](https://git-scm.com/docs/gitignore)。

官方参考：[Go 起步教程](https://go.dev/doc/tutorial/getting-started)、[依赖管理](https://go.dev/doc/modules/managing-dependencies)、[go 命令说明](https://pkg.go.dev/cmd/go)。
