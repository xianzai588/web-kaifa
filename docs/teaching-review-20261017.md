# 2026-10-17 教学全文复读与就地练习审查

本轮基于上游 `ed3d7892457abacdbb44a7c1d47ced0d5df46f7e`，通读125章系统正文及25份知识讲义，对照知识点、代码、结果与反馈修改。此记录是编写者自审和实际运行证据；没有新增独立 agent 审核，不能据此声称获得新一轮独立教学验收。上一轮独立记录保留在 [course-audit.md](course-audit.md)。

## 阅读者现在能做什么

- 每个知识点讲解下直接显示“就地练习”，包含预测、具体输入或代码修改以及观察要求，不必退出正文找题。系统教程新增347题（Go189、Web158）；24个知识专题新增106题；包拆分补充讲义新增2题，共455题。
- 系统教程和知识专题的“参考核对”紧随小题，默认折叠，给出具体结果及原因。章末完整答案和综合任务保留，读者可先尝试再展开；旧项目课的原文对照仍保留原有布局。
- 所有教学代码块提供复制按钮，包括命令、配置、目录、预期输出、折叠答案和动态提问文字。输出显示“复制输出”。复制保留实际文字、缩进与换行，不包含按钮标签；Clipboard API 拒绝时尝试兼容方式，两种方式都失败则提示手动选择。
- 难点注释说明数据如何流动、执行时机、资源归属和失败处理，避免逐行翻译语法。JSON、预期输出保持合法原文，解释放在相邻正文。

## 发现并修正的问题

| 范围 | 具体修正及理由 |
| --- | --- |
| Go基础 | 输入注释区分成功读取项与部分输入；切片解释底层数组共享和复制；defer解释参数求值时机；多返回值、Unicode、JSON、文件和表驱动测试配上可核对变式。 |
| Go后端与并发 | 解释httptest不监听网络、Scan必须在Next后、先筛选再分页、锁保护完整读改写、通道关闭归属、context入口检查，以及会话授权、Cookie与退出等待的顺序。 |
| Web基础与JavaScript | 每个概念后给输入或修改条件；注释浅复制、filter/map、DOM重绘、Promise链、async返回值、请求版本号与取消；区分界面已显示和函数真正返回结果。 |
| 框架与交付 | 注释React状态快照、Effect清理、Vue的.value、TypeScript运行时边界与穷尽分支；说明POST已成功而随后GET失败的状态不能混为一次提交失败。 |
| 配置示例 | go-design的PAGE_LIMIT与go-delivery的PORT改用LookupEnv区分未设置和明确为空；空字符串与非数字被拒绝，仅缺省时使用默认值。增加实际运行回归。 |
| 页面与练习 | web-storage和web-fullstack的起步链接改到现存路由；DOM练习明确使用两个不同匿名回调，避免把同一函数引用的去重误说成重复注册。 |
| 复制与折叠 | 原先跳过输出的复制逻辑已覆盖输出；知识讲义的h4参考核对正确折叠。发现过一次练习误入Dockerfile围栏，已移至围栏外；浏览器核对能发现题目未渲染。 |

## 实际验证与边界

本机使用官方Go 1.27.2工具链与Chromium，通过静态HTTP服务验证。以下是本轮实际结果，脚本输出和截图在忽略的`.qa`中，不提交学习者数据或构建产物。

| 检查 | 已运行的范围与结果 |
| --- | --- |
| `check_site.cjs`、构建器的`--check` | 125章正文、前置、元数据、知识与起步离线包、源码ZIP及入口资源哈希一致。 |
| `check_materials.py`、`git diff --check` | 原始5份教材及ZIP的字节与SHA256不变；补充教材与代码无空白错误。 |
| `test_code_copy.cjs` | 227路由、1653个代码块逐一读取真实剪贴板并比对完整文字，含折叠答案、连续复制、两种权限失败、焦点、320像素和学习记录保留。 |
| `test_inline_practice.cjs` | 125章347题、24专题106题逐一核对题目可见、反馈配对及默认折叠，验证键盘展开、320/375/768像素和学习记录。补充包讲义2题另作源文件核对。 |
| `check_course_answers.py` | 84个Go答案实际编译运行、输入与输出核对通过。 |
| `check_course_browser_answers.cjs` | 51个HTML答案在真实浏览器运行通过。 |
| `test_course_book.cjs` | 125章、51个Go示例、49个浏览器示例、1套Node测试和375路由场景通过；24个需要额外工程或人工操作的章节未冒充独立程序通过。 |
| `test_knowledge_guides.cjs` | 24专题×7宽度、42课时映射、复制、定位与学习状态通过；24个完整例子实际运行通过；PostgreSQL手工例子明确保留人工环境要求。空配置和非数字配置拒绝回归通过。 |
| `test_course_navigation.cjs` | 125章、95分页场景、5宽度，保留阅读位置、展开内容、提问、笔记、代码和验收记录。 |
| `test_reader_layout.cjs` | 80路由、8宽度、9组源DOM、24组表格及21组代码键盘滚动场景通过。源DOM比对只排除派生的提示与复制按钮，正文和代码仍逐项比较。 |
| `test_getting_started.cjs` | 4教程×7宽度、真实HTML保存/点击/刷新、Go编辑/失败/构建/旧二进制/重建、提问与恢复通过。 |
| `test_site.cjs` | 54路由、预览、验收规则、AI上下文、筛选、持久化、备份往返、异常与超大备份恢复、4组手机场景通过。 |

当前浏览器管理策略禁止`file://`打开，起步、知识与系统教程分别使用`SITE_HTTP_ONLY=1`或`COURSE_HTTP_ONLY=1`明确跳过这项；相同生成资源与示例通过HTTP验证。**本轮没有验证直接双击离线打开**，没有绕过浏览器策略或把跳过计为通过。未运行真实PostgreSQL、Docker、完整Vue单文件工程、远程后端部署；源码、片段和预期不能替代这些环境的验收。

阅读、复制和展开参考核对不写入学习完成记录。原始materials文件、原课时笔记/草稿键与progress均保留。修改前远程恢复点是`origin/backup/before-inline-practice-20261017`，后续按基础、后端、浏览器、框架与知识地图分批提交推送。

## 系统教程逐章覆盖

下表按实际教学顺序记录复读范围、就地题数量和首个具体练习。每章还保留完整示例、结果与章末独立任务；数量只证明覆盖，教学质量仍需阅读题目和反馈判断。

### Go：65章，189题

| 章节 | 就地题 | 首个练习证据 |
| --- | ---: | --- |
| [用 VS Code 编辑和运行 Go](courses/go/go-vscode.md) | 4 | 把工具与现象配对 |
| [Go 程序结构](courses/go/go-program.md) | 3 | 辨认四种结果 |
| [注释和基本语法](courses/go/go-syntax.md) | 2 | 区分注释与文字 |
| [变量声明与赋值](courses/go/go-variables.md) | 2 | 没有打印的更新 |
| [基本数据类型与零值](courses/go/go-types.md) | 2 | 零值不靠猜 |
| [常量与变量的区别](courses/go/go-constants.md) | 3 | 分开规则与输入 |
| [算术与比较运算符](courses/go/go-operators.md) | 2 | 用边界检查逻辑 |
| [字符串与终端输出](courses/go/go-strings.md) | 4 | 变量名还是文字 |
| [if 与 else 条件语句](courses/go/go-if.md) | 2 | 分支之后还会继续 |
| [从终端读取一行输入](courses/go/go-input.md) | 7 | 等待与结束 |
| [switch 多分支选择](courses/go/go-switch.md) | 2 | default不是校验 |
| [for 循环与累加](courses/go/go-for.md) | 2 | 写出每轮状态 |
| [函数参数与返回值](courses/go/go-functions.md) | 2 | 返回但不显示 |
| [变量作用域与参数传值](courses/go/go-scope.md) | 3 | 改用赋值会怎样 |
| [递归与停止条件](courses/go/go-recursion.md) | 2 | 画出三层等待 |
| [实战 学习时长计算器](courses/go/go-project-minutes.md) | 3 | 先给边界写预期 |
| [数组与下标](courses/go/go-arrays.md) | 2 | 长度与末项下标 |
| [切片与 append](courses/go/go-slices.md) | 2 | 含起点不含终点 |
| [切片共享与复制](courses/go/go-slice-sharing.md) | 3 | 目标只有一项 |
| [range 遍历切片](courses/go/go-range.md) | 2 | 只接第一个结果 |
| [函数的多个返回值](courses/go/go-returns.md) | 2 | 零结果的两种含义 |
| [map 键值集合](courses/go/go-maps.md) | 2 | 读缺键不会新增 |
| [字符串的字节与 rune](courses/go/go-unicode.md) | 2 | 位置按哪种单位 |
| [指针与修改调用者变量](courses/go/go-pointers.md) | 2 | 地址与目标分开读 |
| [结构体与字段](courses/go/go-structs.md) | 2 | 类型不是一条数据 |
| [方法与接收者](courses/go/go-methods.md) | 2 | 额外参数与接收者 |
| [接口与行为约定](courses/go/go-interfaces.md) | 2 | 有字段能替代方法吗 |
| [error 与失败返回](courses/go/go-errors.md) | 2 | 合法零和失败占位 |
| [defer 与函数结束时执行](courses/go/go-defer.md) | 3 | 登记不是马上调用 |
| [包与模块的实际组织](courses/go/go-packages.md) | 3 | 路径从哪里来 |
| [第一份单元测试](courses/go/go-testing.md) | 2 | 选能区分的输入 |
| [结构体与 JSON 编解码](courses/go/go-json.md) | 3 | 值和文字的往返 |
| [文件读取与路径](courses/go/go-files.md) | 3 | 空文件与缺文件 |
| [字符串处理与排序](courses/go/go-sort.md) | 2 | 名称排序不是次数排名 |
| [实战 词频统计与稳定排名](courses/go/go-project-wordfreq.md) | 3 | 手算标点的影响 |
| [HTTP 请求与响应](courses/go/go-http-message.md) | 5 | 网页不止一次请求 |
| [第一个 Handler 与路由](courses/go/go-http-handler.md) | 3 | 登记函数没有括号 |
| [查询参数与输入校验](courses/go/go-http-query.md) | 3 | 数字文字不是数字 |
| [JSON 响应与状态码顺序](courses/go/go-http-json.md) | 3 | 响应头不是业务字段 |
| [严格 JSON 输入边界](courses/go/go-json-boundary.md) | 3 | 同一个解码成功不同合同 |
| [测试整个 HTTP 响应](courses/go/go-http-testing.md) | 2 | 200下的坏结果 |
| [标准库与 Web 框架](courses/go/go-web-frameworks.md) | 3 | 公共包装负责什么 |
| [用 Go 模板生成 HTML 页面](courses/go/go-templates.md) | 4 | 关掉JS仍有标题吗 |
| [数据库、表与约束](courses/go/go-sql-tables.md) | 3 | 客户端版本不等于连通 |
| [SQL 查询、修改与删除](courses/go/go-sql-crud.md) | 3 | 标题重名时更新几行 |
| [Go 连接 PostgreSQL 与参数绑定](courses/go/go-database-go.md) | 3 | 池对象和真实连接 |
| [事务与回滚](courses/go/go-transactions.md) | 3 | 半份写入如何验收 |
| [Repository 与依赖注入](courses/go/go-repository.md) | 3 | 分别放到哪层 |
| [环境配置与明确的默认值](courses/go/go-config.md) | 3 | 改配置后谁更新 |
| [分页参数与稳定排序](courses/go/go-pagination.md) | 3 | 合法空页 |
| [goroutine 与等待完成](courses/go/go-goroutines.md) | 3 | 谁负责等待 |
| [互斥锁与共享状态](courses/go/go-mutex.md) | 2 | 两次增加只加一次 |
| [CRUD 接口约定与内存实现](courses/go/go-crud.md) | 5 | 重启后的数据 |
| [channel 的发送与接收](courses/go/go-channels.md) | 3 | 无缓冲配对 |
| [context 取消与 select](courses/go/go-context.md) | 4 | 谁真正停止计算 |
| [类型断言与安全检查](courses/go/go-type-assertion.md) | 2 | 断言不会解析数字 |
| [泛型函数的类型参数](courses/go/go-generics.md) | 4 | 类型也有输入位置 |
| [密码哈希与验证](courses/go/go-passwords.md) | 3 | 同密码为何不同存储串 |
| [登录会话、过期与注销](courses/go/go-sessions.md) | 4 | Cookie还在是否有效 |
| [记录归属与对象权限](courses/go/go-authorization.md) | 4 | 身份从哪里来 |
| [超时与有期限的服务退出](courses/go/go-shutdown.md) | 3 | 两个返回时间不同 |
| [Docker 镜像、容器与数据卷](courses/go/go-containers.md) | 4 | 三个生命周期 |
| [CI 与可复现的质量检查](courses/go/go-ci.md) | 3 | 绿色属于哪个版本 |
| [基准、性能剖析与证据](courses/go/go-performance.md) | 4 | 慢在哪个边界 |
| [备份恢复与项目交付](courses/go/go-recovery.md) | 5 | 哈希证明到哪一步 |

### Web：60章，158题

| 章节 | 就地题 | 首个练习证据 |
| --- | ---: | --- |
| [网页、浏览器与三种基础语言](courses/web/web-roles.md) | 4 | 保存和刷新分开 |
| [HTML 文档结构](courses/web/web-document.md) | 2 | 两个标题两个位置 |
| [标签、元素与属性](courses/web/web-elements.md) | 3 | 圈出强调范围 |
| [标题、段落与列表](courses/web/web-text.md) | 2 | 列表按含义选择 |
| [链接与相对路径](courses/web/web-links.md) | 3 | 只改目标会失配 |
| [图片、src 与 alt](courses/web/web-images.md) | 2 | 坏路径保留信息 |
| [语义区块与页面层级](courses/web/web-sections.md) | 2 | 区域不自动定位 |
| [表单控件与 label](courses/web/web-forms.md) | 2 | 校验通过算保存吗 |
| [CSS 规则与引入方式](courses/web/web-css.md) | 2 | 拆成两份文件 |
| [标签、类与 ID 选择器](courses/web/web-selectors.md) | 2 | 点号写在哪边 |
| [层叠、优先级与继承](courses/web/web-cascade.md) | 2 | 先直接命中再看继承 |
| [文字样式与长度单位](courses/web/web-units.md) | 2 | 把rem算成数值 |
| [盒模型与 box-sizing](courses/web/web-box.md) | 2 | 给外缘宽度记账 |
| [实战 学习名片页](courses/web/web-project-profile.md) | 3 | 先把验收写具体 |
| [正常文档流与 display](courses/web/web-flow.md) | 2 | width在谁身上生效 |
| [Flexbox 的主轴与交叉轴](courses/web/web-flex.md) | 2 | 换方向再解释对齐 |
| [Grid 的列、间距与 fr](courses/web/web-grid.md) | 2 | 先扣间隔再分列 |
| [媒体查询与移动优先](courses/web/web-responsive.md) | 2 | 包含断点这一点 |
| [定位参照与小角标](courses/web/web-position.md) | 2 | 参照逐层向外找 |
| [图片裁剪与长内容溢出](courses/web/web-overflow.md) | 2 | 找到真正撑宽项 |
| [CSS 变量与交互状态](courses/web/web-css-variables.md) | 2 | 鼠标状态不是焦点 |
| [实战 响应式活动页](courses/web/web-project-responsive.md) | 3 | 列出第四卡位置 |
| [JavaScript 的运行位置](courses/web/web-js-start.md) | 2 | 结果出现在哪 |
| [let、const 与数据类型](courses/web/web-js-variables.md) | 2 | 旧判断会自动更新吗 |
| [运算符与类型转换](courses/web/web-js-operators.md) | 2 | 加号先看类型 |
| [字符串与模板文字](courses/web/web-js-strings.md) | 2 | 属性和调用分开 |
| [条件分支与边界](courses/web/web-js-if.md) | 2 | 边界能检出错误 |
| [循环与累加](courses/web/web-js-loops.md) | 2 | 零轮也有结果 |
| [函数定义、参数与返回](courses/web/web-js-functions.md) | 2 | 打印代替不了返回 |
| [函数作用域与值传递](courses/web/web-js-scope.md) | 2 | 参数改的是谁 |
| [数组与元素访问](courses/web/web-js-arrays.md) | 2 | 末项与越界 |
| [对象、属性与引用](courses/web/web-js-objects.md) | 2 | 赋值和浅副本 |
| [JSON 文字与 JavaScript 对象](courses/web/web-json.md) | 3 | 格式不是连接 |
| [回调与数组 filter](courses/web/web-js-callbacks.md) | 2 | 交函数还是先调用 |
| [数组 map 与数据转换](courses/web/web-js-map.md) | 2 | 判断也能成为转换值 |
| [DOM 与读取页面元素](courses/web/web-dom.md) | 2 | 当前页面不等于文件 |
| [事件与点击处理函数](courses/web/web-events.md) | 2 | 登记后有几次变化 |
| [创建列表与安全显示文字](courses/web/web-dom-list.md) | 2 | 一个节点不能变两项 |
| [状态、筛选与渲染](courses/web/web-ui-state.md) | 2 | 一个结果更新两处 |
| [try、catch 与失败分支](courses/web/web-js-errors.md) | 2 | 错误后的路径 |
| [Promise 的完成与失败](courses/web/web-promise.md) | 2 | 回调比同步日志晚 |
| [async、await 与错误处理](courses/web/web-async.md) | 2 | 暂停哪段代码 |
| [JavaScript 模块与导入导出](courses/web/web-modules.md) | 3 | 导出不等于全局 |
| [localStorage 与序列化](courses/web/web-storage.md) | 2 | 缺键不是坏JSON |
| [fetch、HTTP 状态与 JSON](courses/web/web-fetch.md) | 2 | 404是收到响应 |
| [加载、成功、空结果与失败](courses/web/web-request-states.md) | 2 | 空结果不是失败 |
| [重叠请求与过期结果](courses/web/web-cancel-request.md) | 4 | 最后完成不一定最新 |
| [HTML 从哪里来：静态页、模板与 API](courses/web/web-rendering.md) | 3 | 两个工具看两种内容 |
| [Git 的工作区、暂存区与提交](courses/web/web-git.md) | 2 | 暂存后再编辑 |
| [Node、npm 与项目脚本](courses/web/web-npm.md) | 4 | 三个工具分工 |
| [为什么需要组件与框架](courses/web/web-frameworks.md) | 5 | 数据变了界面没变 |
| [TypeScript 注解与类型检查](courses/web/web-typescript.md) | 4 | 类型何时检查 |
| [联合类型与缩小范围](courses/web/web-narrowing.md) | 4 | 加载中没有items |
| [React 组件、Props 与 State](courses/web/web-react.md) | 4 | 谁更新状态 |
| [Vue 模板、Props 与响应式状态](courses/web/web-vue.md) | 4 | 同目标比较职责 |
| [组件生命周期与请求清理](courses/web/web-component-requests.md) | 5 | 渲染不应启动无限请求 |
| [纯函数测试与失败实验](courses/web/web-testing.md) | 3 | 反例来自需求 |
| [键盘、资源与性能验证](courses/web/web-quality.md) | 5 | 三个结论分开 |
| [构建产物、静态发布与回滚](courses/web/web-deploy.md) | 5 | 构建不是上线 |
| [前端与自己的 Go API 联调](courses/web/web-fullstack.md) | 6 | 何时才能说已创建 |

## 知识讲义逐篇覆盖

| 讲义 | 就地题 | 首个练习证据 |
| --- | ---: | --- |
| [认证、归属与对象权限：登录之后仍要逐次检查](knowledge/go/go-auth.md) | 6 | 同密码不比新哈希 |
| [slice、map 与 Unicode：数据怎样被保存和遍历](knowledge/go/go-collections.md) | 3 | 容量不是下标范围 |
| [goroutine、同步与取消：任务什么时候开始，又怎样结束](knowledge/go/go-concurrency.md) | 3 | 完成数量平衡 |
| [零值、控制流与函数：从输入算出可信结果](knowledge/go/go-control.md) | 6 | 零分还是无输入 |
| [超时、退出、Docker 与 CI：让别人也能运行程序](knowledge/go/go-delivery.md) | 4 | 等待的父Context |
| [职责、配置与稳定分页：让程序容易定位和修改](knowledge/go/go-design.md) | 3 | 一项职责一处 |
| [error、JSON 与输入边界：先读懂，再验证](knowledge/go/go-errors.md) | 3 | 包装仍识别原因 |
| [HTTP 契约与响应：请求如何变成返回结果](knowledge/go/go-http.md) | 2 | 三处输入别混 |
| [结构体、方法与接口：一条记录的数据和行为](knowledge/go/go-models.md) | 4 | 类型不校验空白 |
| [拆成两个包：让模块路径、目录和 import 对上](knowledge/go/go-packages.md) | 2 | 路径三部分对应 |
| [SQL、参数绑定与事务：真实数据库怎样保护数据](knowledge/go/go-sql.md) | 5 | 先确认连接对象 |
| [表驱动测试与 HTTP 测试：把“应该”变成可重放的检查](knowledge/go/go-tests.md) | 3 | 运行和测试不同 |
| [模块、包与工具链：让代码真的跑起来](knowledge/go/go-tools.md) | 3 | 文件、包与模块 |
| [盒模型与尺寸计算：亲手测出多出来的宽度](knowledge/web/web-box.md) | 5 | 内外间距分开 |
| [选择器、层叠与可读性：解释哪条样式生效](knowledge/web/web-css.md) | 5 | 空格改变匹配 |
| [DOM、事件与界面状态：让搜索与数量一起更新](knowledge/web/web-dom.md) | 5 | 当前树不是磁盘 |
| [请求、JSON与状态：把404、空数据与格式错误分别跑出来](knowledge/web/web-fetch.md) | 5 | 收到404不是断网 |
| [文件、地址与浏览器：把网页放在正确的位置](knowledge/web/web-files.md) | 5 | 扩展名核对 |
| [Flex：先判断两条轴，再设置对齐](knowledge/web/web-flex.md) | 5 | 额外容器改变子项 |
| [表单、键盘与真实反馈：把“填了”与“提交了”分清](knowledge/web/web-forms.md) | 6 | 标签和提交名 |
| [Grid：先划分列，再让卡片进入网格](knowledge/web/web-grid.md) | 4 | 直接子项排位 |
| [HTML 语义与内容结构：先说明内容是什么](knowledge/web/web-html.md) | 4 | 强调范围与闭合 |
| [JavaScript：先把输入、处理和输出分开](knowledge/web/web-js.md) | 5 | 合法零与空文字 |
| [调试、Git与交付：让别人按步骤得到同一结果](knowledge/web/web-quality.md) | 5 | 写出可重放步骤 |
| [响应式与溢出定位：让真实内容适应空间](knowledge/web/web-responsive.md) | 7 | viewport不修宽盒 |
