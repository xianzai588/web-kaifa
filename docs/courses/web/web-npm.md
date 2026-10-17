# Node、npm 与项目脚本

理解package.json和锁文件，运行一个已有前端项目。

## 语言运行环境与包管理器

Node.js 是在本机或服务器执行 JavaScript 的运行环境；本节用它运行前端开发工具。npm 随常见 Node 安装器提供，是下载软件包和执行项目脚本的工具。包是一组可复用的代码或工具，依赖是这个项目使用的其他包。**浏览器显示页面，Node 运行开发工具，npm 安装包；三者职责不同。**

### 就地练习：三个工具分工

将“执行开发工具、安装依赖、显示页面”分别分给Node、npm、浏览器。

### 参考核对：三个工具分工

Node运行开发工具，npm安装包/执行脚本，浏览器显示结果；npm不是网页语言。

## 从完整项目而不是空目录起步

下载 [TypeScript 起点](../../../assets/downloads/web-followup-03.zip)，解压到自己的独立 followup-03 目录，用 VS Code“打开文件夹”打开它。需要 README 要求的 Node 版本（当前工程 engines 是 >=24.15.0）和可访问包来源的网络。终端当前目录应有 package.json、package-lock.json、index.html、src。先运行 node --version 与 npm.cmd --version。

## Windows PowerShell 的启动命令

```powershell
# 在刚解压的 followup-03 目录执行，依据锁文件安装依赖。
npm.cmd ci
# 安装成功后，启动本机开发服务；这个命令会持续运行。
npm.cmd run dev
```

macOS/Linux 将 npm.cmd 写为 npm。PowerShell 使用 .cmd 可以避免把 npm 的 PowerShell 脚本被策略阻止误当成项目错误。正常终端显示 http://127.0.0.1:8803/；浏览器打开它，搜索“图论”应只显示一项。Ctrl+C 停止服务；只关闭网页不会停止进程。不要双击 .ts 文件期待浏览器直接运行它。

## 读懂项目里的脚本配置

下面只摘出已有 package.json 的相关字段，不是可替代整个项目的完整文件。JSON 不允许写注释，解释放在表格中。

```json
{
  "scripts": {
    "dev": "vite --host 127.0.0.1 --port 8803 --strictPort",
    "typecheck": "tsc --noEmit",
    "build": "npm run typecheck && vite build",
    "test": "vitest run",
    "preview": "vite preview --host 127.0.0.1 --port 8903 --strictPort"
  }
}
```

| 字段或命令 | 实际行为 |
| --- | --- |
| scripts | 脚本名到实际命令的对应关系；npm run 后面写这个名字 |
| dev | Vite 开发服务器，监视源码，便于保存后看到变化 |
| typecheck | tsc 是 TypeScript 检查器，--noEmit 表示只检查、不输出 JS |
| build | 先检查类型，成功后构建发布文件；&& 表示前者成功才执行后者 |
| test | Vitest 按工程配置运行测试，不能等同于真实浏览器完整验收 |
| preview | 在本机查看已构建产物，不等于线上发布 |

### 就地练习：&&的检查边界

typecheck失败时，build脚本里的vite build会继续吗？旧dist存在又能证明什么？

### 参考核对：&&的检查边界

&&使失败后不继续；旧产物仍可存在，不能据预览旧页面称本次构建成功。

## 锁文件和安装结果

package.json 说明直接依赖与脚本，package-lock.json 记录解析出的实际依赖组合；node_modules 是安装得到的目录。npm ci 要求清单与锁文件一致，按锁安装，必要时重建依赖目录；它不是在源码里增加 CSS 或 HTML。新建项目没有锁文件时才按该项目说明使用 npm install 生成。保存锁文件，不提交 node_modules、dist 或真实环境配置。

### 就地练习：安装目录不入库

列出package.json、package-lock.json、node_modules分别来源与提交选择。

### 参考核对：安装目录不入库

清单和锁记录依赖合同并提交；node_modules为安装产物不提交，清单变化需同步锁。

## 让命令与错误对应起来

在另一终端或停止 dev 后依次运行 typecheck、test、build，理解哪个阶段报错。缺 package.json 多半是目录错；找不到 node/npm 是环境或 PATH；ci 提示锁不一致要核对项目文件；端口已占用先停止自己之前的服务；typecheck 报错要读文件/行号，不能只再安装一遍。build 成功后再运行 preview，访问 8903 端口；它读取 dist，修改源码却不重建时预览仍会是旧版。

## 自己做一次实验

先只改页面标题，保存观察 dev 变化；停止并 build，再 preview 观察新产物。把某个 scripts 名称看错时应如何从 package.json 找到正确命令？当前只读取 test 命令报告的通过/失败数量；src/events.test.ts 的 TypeScript 与 Vitest 断言源码，在后面的 [TypeScript](#/learn/web/web-typescript) 和 [测试](#/learn/web/web-testing) 章节之后再复读，本节不把读懂未教测试语法作为验收。验收记录需要安装/启动命令、实际地址和结果，而不是一句“装好 npm”。

## 独立变式：让开发页与产物各自证明版本

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。使用已解释项目scripts与已学源码改动，不要求当前会读TypeScript注解或Vitest断言源码。

在followup-03新副本中，不看本页命令序列，自己从package.json选工具达成：预览产物显示版本A；源码改成版本B后dev显示B而未重建的preview仍A；重新生成产物后preview才显示B。另用已学const不能重新赋值制造检查失败。

自查：记录8803开发地址与8903预览地址、源码/产物各显示哪版、实际使用脚本。失败检查应阻止该build流程继续生成新产物，恢复源码后通过。只看测试运行通过/失败数量即可，测试源码到后面的TypeScript和测试章节再读。

## 锁定安装与依赖脚本

npm ci按锁文件重建依赖，清单不一致应先修清单/锁，而不是删锁“碰碰运气”。npm install用于有意变更依赖，并把相应锁文件一起提交。安装过程可能执行包的生命周期脚本，维护项目时先了解依赖来源和必要构建步骤。

dev读取源码并提供开发能力，build生成静态发布产物，preview预览该产物；三者服务的内容和地址要分别确认。前端环境变量若被打包到浏览器，就不是秘密存储；变量名写得像密钥也不会让它自动隐身。

### 参考答案：独立实现与验收

在followup-03独立副本，把页面可见标题写为“版本A”。已有依赖时不用重复ci；首次先npm ci，再：

```sh
npm run build
npm run preview
```

8903应显示A。另开终端npm run dev，在src/main.ts把可见标题改B，8803显示B、未重建的8903仍A。停掉preview后npm run build再npm run preview，8903才显示B。

在main.ts末尾临时加入两行故意错误：

```typescript
const invalidReassign = 1;
invalidReassign = 2;
```

npm run typecheck应失败，npm run build也应在tsc阶段停止。旧dist仍可能存在，不能因preview还能显示A就说坏源码构建成功。删去错误、重建再验收。Windows PowerShell按原说明使用npm.cmd。

### 就地练习：dev与preview对照

先build版本A，再改源码B，只开dev不重建。两个服务分别可能显示哪版？

### 参考核对：dev与preview对照

dev读当前源码B，preview读已生成A；重建后preview才更新，地址和内容来源需分别确认。
