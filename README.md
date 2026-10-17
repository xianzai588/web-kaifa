# 开发练习册：Web 与 Go

给第一次写代码的人，也给已经会一点编程、想转学 Web 或 Go 的人。选一节课，先动手；卡住时，用 AI 提问台把自己的目标、代码和报错整理清楚，再回到代码里验证。

**在线阅读：[打开开发练习册](https://zhouwu97.github.io/web-kaifa/)。**

最新逐章审查、练习覆盖和实际验证见 [2026-10-17 审查记录](docs/teaching-review-20261017.md)；上一轮基础补全见 [2026-10-16 修订记录](docs/teaching-revision-20261016.md)。本 fork 的源码更新不表示上游在线站点已发布。

本次补写覆盖125章：Go输入输出已移到入门，基础语法、Web语言与工程章节补充具体规则及题解；重复尾注已删减。新增答案可分别用 `python3 scripts/check_course_answers.py` 与 `node scripts/check_course_browser_answers.cjs` 复验，环境要求与未验证项见修订记录。

125章现在有347个就地练习，题目直接放在对应讲解下方，参考核对默认折叠；24个知识专题另有106个，包拆分补充讲义另有2个。难点代码补充数据流、执行顺序和失败边界注释；代码、命令、配置和预期输出均可逐块复制，输出按钮明确标为“复制输出”。

**本机阅读**：下载或克隆仓库，双击 [index.html](index.html)。课程、提示模板和进度功能不需要安装依赖；官方资料入口需要联网。

## 网页里可以做什么

- 选择“第一次写代码”或“写过代码”，按自己的起点进入路线。
- 按“入门 → 初阶 → 中级 → 高级”阅读125个系统教程章节：Go 65节、Web 60节。选择方向后在左栏分阶段、分页选章，中间只读当前一节；每节先解释概念，再给注释代码、结果与修改实验，阶段项目综合已学知识。完整顺序见 [教学大纲](docs/teaching-outline.md)。
- 起步教程、课内目录和知识讲义统一使用左侧阅读目录，手机通过“目录”展开并跳到段落。标题区紧凑，长代码保留原行，长表格与代码在各自框内滚动，支持键盘操作。
- 原Web 14课、Go 28课和12个后续阶段保留为项目练习，全部链接到新教程的对应基础。旧笔记、草稿与验收仍按原课时保存；阅读和参考代码运行不会自动标记学习完成。
- 知识地图的24个专题用于查原理、工具与工程细节；课内扩展默认收起。新教程正文直接教当前知识，不要求先读完整模块、工具链或部署资料。
- 在练习工坊挑选 18 个分层任务，按起步提示、独立实现和加练要求练习，用输入输出表验收；四套配套 Web / Go 例子可在本机运行。
- 修改 Web 示例，在隔离预览中看到真实效果；Go 和 SQL 按讲义在自己的电脑上运行。
- 带着当前课程、自己的代码和报错整理 AI 提问；也可以复制 10 个具体场景模板。
- 在同一工作台切换本课任务、代码、验收与笔记；AI 助教默认收起，可按需带入课程和代码；大屏打开后与正文并列，窄屏在正文后、页脚前排列，收起后返回原位置。
- 阅读“怎样用 AI 开发”，练习描述需求、拆小任务、带证据排错与自己验证。
- 保存课内笔记和代码草稿，导出 / 导入 JSON，或导出 Markdown 留在仓库。

本站不使用付费模型 API，不要求 API Key。未连接扩展时提问台整理可复制文字；连接扩展后可直接在右侧使用自己的 AI 官网对话。进度保存在当前浏览器，不会自动同步到 GitHub。原互动手册的记录与新网页分开保存。

另有可手动安装的 [官网对话桥接扩展原型](projects/web/ai-browser-bridge/README.md)：在自己的窗口中操作已登录的 AI 官网标签页，不使用付费模型 API。七家候选适配器的真实账号验证尚未完成；安装新版扩展后直接使用本站右侧的同一份聊天界面；未安装时保留本地提问工具。

网页使用方法见 [学习网站说明](docs/site-guide.md)。

内容参考了 MDN、The Odin Project、Go 官方教程、Go by Example 与 Exercism 的课程与练习组织方式。具体依据与改动范围见 [知识与练习优化记录](docs/learning-content-upgrade.md)。补充讲解由本仓库编写，原教材保持原样。

## 从这里开始

准备好工具后，在网站“Go 后端”或“Web 开发”进入四层课程目录。Go先读程序结构、变量、类型、条件、终端输入输出、循环与函数；Web先读文档结构、标签、文字、链接、CSS与盒模型。新手不用先配置F5或完整工程；输入先从短文本与数字开始，文件读写在数据结构和错误处理后展开，JavaScript之后再做DOM与请求。

入门/初阶源码包：[学习时长计算器](assets/downloads/go-study-minutes.zip)、[学习名片页](assets/downloads/web-profile-card.zip)、[响应式活动页](assets/downloads/web-responsive-events.zip)。中级新增 [Go HTML 模板页面](assets/downloads/go-template-pages.zip)，可以启动服务观察服务器生成的 HTML。后续配套有词频工具、活动搜索、内存CRUD、持久化API、安全会话与部署恢复项目，各自README写明运行条件和限制。

第一次准备环境可先打开网站的“安装与起步教程”：包含 VS Code 下载、Web / Go 环境检查、常见报错和六项 AI 提问练习。离线文字版：[安装 VS Code](docs/tutorials/vscode.md)、[Web 环境](docs/tutorials/web-environment.md)、[Go 环境](docs/tutorials/go-environment.md)、[学会问 AI](docs/tutorials/asking-ai.md)。

Go 环境教程有官方下载页实拍、系统与处理器架构辨认、三种系统的安装步骤、Windows PATH 修复与环境变量解释。可按自己卡住的位置直达下载、安装、模块或运行章节；大屏章节目录随正文保留，手机按顺序阅读。文件名按系统、架构、后缀辨认，具体版本与支持要求以官方页面为准。

Go 的 VS Code 第8–13节有真实界面截图、Go 插件与 gopls/dlv 安装步骤、四个完整工作区配置、任务运行和 F5 断点调试。可直接 [下载带配置的 Go 起步包](assets/downloads/vscode-go-starter.zip)，解压后打开独立项目，按 README 验证。cmd、PowerShell 与 macOS/Linux 的命令分开说明；复制代码与配置后仍需保存并主动运行。

后续阶段的正文源在 [docs/followups](docs/followups)，配套在 `exercises/web/followup-00` 至 `followup-11`。每份 README 写明所需工具、启动、验证与边界；后端例子必须本机运行，静态学习网站不会替你启动数据库或服务器。素材制作、SVG/PNG 使用、响应式裁切与导出在第00阶段。[本轮完整审核](docs/followup-completion-review.md)

| 路线 | 互动手册 | Markdown 教材 | 学习进度 |
| --- | --- | --- | --- |
| Web 前端 / 全栈 | [Web 学习手册](materials/web/学习手册.html) | [Web 学习路线](materials/web/学习路线.md) | [Web 进度](progress/web.md) |
| Go 后端 | [28 天互动学习手册](materials/go/28天互动学习手册.html) | [完整学习清单](materials/go/完整学习清单.md) | [Go 进度](progress/go.md) |

上表是保留的原始教材。日常学习可从新网页开始；需要对照时再打开原手册。GitHub 仓库页面显示 HTML 源码，互动阅读请使用在线站点或本机文件。

**后续学习安排**：见 [学习计划](docs/study-plan.md)。先理解知识点，再写练习、保存验收结果，最后更新进度。

## 目录怎么用

```text
web-kaifa/
├── index.html            学习网站入口，支持本机打开
├── tokens.css            统一颜色、字体和间距
├── assets/               网页交互、课程、AI 模板和官方资料
├── materials/            教材原文、资料包和来源校验记录
│   ├── web/              Web 前端与全栈教材
│   ├── go/               Go 后端教材
│   └── archives/         原始 Web ZIP 资料包
├── docs/                 学习安排和仓库使用说明
├── notes/                自己写的知识总结与问题记录
│   ├── web/
│   └── go/
├── exercises/            按知识点或日期整理的小练习
│   ├── web/
│   └── go/
├── projects/             可以独立运行的阶段项目
│   ├── web/
│   └── go/problem-tracker/  刷题记录 API 的待实现计划
├── progress/             可提交到 Git 的学习进度和导出备份
├── templates/            每日笔记与项目 README 模板
└── scripts/              教材、课程结构和浏览器交互检查
```

教材已经整理入库；学习任务和项目实现均从未完成状态开始。`projects/go/problem-tracker` 目前只包含计划，后续学习时逐步实现。

## 每次学完怎么保存

1. 阅读手册，在 `exercises/web` 或 `exercises/go` 写当天练习。
2. 复制 [每日笔记模板](templates/daily-note.md)，保存到对应的 `notes` 目录。
3. 写下运行结果和仍未解决的问题，通过教材验收后再勾选 `progress` 中的任务。
4. 导出互动手册的勾选记录，按 [进度备份说明](progress/README.md) 保存。
5. 在仓库根目录提交并推送：

```powershell
git status
git add .
git commit -m "study: record today's learning"
git push
```

更详细的约定见 [仓库使用说明](docs/repository-guide.md)。教材来源见 [资料索引](materials/README.md)，整理与补充审核见 [课程审核](docs/curriculum-audit.md)、[官方资料核验](docs/research-notes.md) 和 [AI 学习依据](docs/ai-learning-notes.md)。

## 本地预览与检查

系统教程源文件在 `docs/courses/go`、`docs/courses/web`，`catalog.json`记录顺序、前置、目标、旧课映射与可运行示例。编写和独立审核按 [教学标准](docs/teaching-standard.md) 逐章进行，正文与示例应保持一致。修改后运行 `node scripts/build_course_book.cjs` 和 `node scripts/version_site_assets.cjs`；四个新增小项目的ZIP用 `python scripts/build_course_projects.py` 同步。`node scripts/test_course_book.cjs`逐个运行独立例子，`node scripts/test_course_navigation.cjs`检查分阶段分页、阅读位置、手机目录与地址恢复；需要数据库、Docker或完整工程的项目单独按README验收，不把未执行计为通过。

前一轮三名新 agent 的全部125章判定、首轮问题和返修证据见 [系统教程逐章审核](docs/course-audit.md)。最新一轮由编写者逐章复读，范围与逐章练习记录见 [2026-10-17审查记录](docs/teaching-review-20261017.md)，没有新增独立审核。教材审核与学习者完成课程分别记录。

前端阅读展示由 `assets/reader-layout.js`、`assets/reader-layout.css` 统一适配。[阅读展示验证](docs/frontend-reading-review.md)记录改动与实测范围。`node scripts/test_reader_layout.cjs` 检查8种屏幕宽度、原正文DOM、手机段落定位、代码/表格横滚与旧学习记录；发布后用 `SITE_TEST_URL` 指定线上地址运行 `scripts/verify_deployment.cjs`，核对全部125章、19页目录、版本资源及下载包。

直接打开 `index.html` 可阅读。开发时也可以在根目录启动静态服务器：

```powershell
python -m http.server 8743
```

然后访问 `http://localhost:8743/`。检查教材完整性与课程数据：

```powershell
python scripts/check_materials.py
node scripts/check_site.cjs
node scripts/test_site.cjs
node scripts/test_workbench.cjs
node scripts/test_learning.cjs
node scripts/test_getting_started.cjs
node scripts/test_site_assets.cjs
node scripts/test_knowledge_guides.cjs
node scripts/test_followup.cjs
node scripts/test_vscode_starter.cjs
node scripts/test_go_start_path.cjs
node scripts/test_course_book.cjs
node scripts/test_course_navigation.cjs
node scripts/test_code_copy.cjs
node scripts/test_inline_practice.cjs
```

新增的复制检查逐页读取真实剪贴板，并覆盖权限拒绝后的降级、连续点击和学习记录；就地练习检查全部系统章节与知识专题的题目可见性、默认折叠核对、键盘和手机阅读。两项检查可用 `COURSE_BROWSER_EXECUTABLE` 指定 Chromium 路径。受限环境如禁止 `file://`，可对起步与知识讲义检查设置 `SITE_HTTP_ONLY=1`、对系统教程检查设置 `COURSE_HTTP_ONLY=1`；脚本会明确报告跳过本地文件打开，仍运行 HTTP 页面和示例，不把跳过计为通过。

浏览器集成检查位于 `scripts/test_site.cjs`，需要 Playwright 和本机 Edge，测试前先启动上述服务器。它覆盖课程入口、代码预览、完成规则、AI 上下文、记录备份和移动端布局；不要求学习者运行这些开发检查。

起步教程以 `docs/tutorials/` 为源文件，修改后运行 `node scripts/build_getting_started.cjs` 同步离线网页数据。任何入口 JS/CSS 修改后运行 `node scripts/version_site_assets.cjs`，将内容哈希写入入口资源地址，避免旧路由脚本与新页面混用；`check_site.cjs` 会检查数据与版本是否同步。已有标签页需要刷新一次才能加载新代码，不会清除学习记录。`test_getting_started.cjs` 实际运行 HTML 交互、Go 编译/重建/输入示例，因此需要本机 Go 工具链；`test_site_assets.cjs` 覆盖旧脚本地址被缓存的故障。

修改后续阶段先运行 `python scripts/build_followup_examples.py` 构建源码 ZIP 与校验清单，再运行 `node scripts/build_knowledge_guides.cjs` 同步正文与下载哈希。Go 起步包用 `python scripts/build_vscode_starter.py` 重建；四个配置源在 `docs/tutorials/configs/go`。打包只含源码、锁文件和教学素材，不含依赖目录、构建产物、真实环境变量或数据库数据。下载包与正文完整文件应保持一致。

开发审核可用 `node scripts/test_vscode_starter.cjs` 真正执行下载包的任务/构建失败边界。`node scripts/test_vscode_starter_debug.cjs` 验证 Delve DAP 断点与变量，需先准备受支持的 Go 补丁版和 dlv；可用 `GO_TOOLCHAIN_EXE`、`VSCODE_QA_DLV` 指定独立工具路径。脚本不安装软件或修改全局设置，实际运行在忽略的 QA 目录中；初学者不需要运行这些网站维护检查。

知识讲义源文件位于 `docs/knowledge/web/` 与 `docs/knowledge/go/`，修改后先运行 `node scripts/build_knowledge_guides.cjs`，再更新入口资源版本。每个目录的 `examples.json` 记录完整示例与可核对结果；示例内容必须与讲义同步。`test_knowledge_guides.cjs` 检查全部主题、课时映射、显示/复制/离线/学习状态，并实际运行独立 Web 和 Go 例子；数据库、容器、认证服务等额外环境的边界见讲义及 [知识内容审核](docs/knowledge-content-audit-2026-10-13.md)。

工作台扩展检查位于 `scripts/test_workbench.cjs`，使用相同环境。设计与审核记录见 [工作台改版说明](docs/workbench-redesign.md)。AI 服务选择仅表示工具偏好，当前没有真实登录、API 调用或流式回答。

知识与练习检查位于 `scripts/test_learning.cjs`，使用同一服务和浏览器环境，覆盖 44 个新增内容路由、筛选地址恢复、跨内容搜索、复制清单、隔离演示与配套 Web 练习的真实失败场景。配套 Go 练习的 `go test ./...` 在各自模块目录执行。
