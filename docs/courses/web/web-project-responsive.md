# 实战 响应式活动页

用Flex、Grid和媒体查询组织一个完整静态页面。

## 项目任务

页眉导航用Flex，活动列表用Grid。窄屏一列，700px以上三列；添加第四张卡片、长文本与键盘验收。没有报名和网络请求。

### 就地练习：列出第四卡位置

给活动页添加第四卡前，写出320、699、700、701、768宽度的预期列数与第四项所在行。

### 参考核对：列出第四卡位置

320/699一列、第四项第4行；700及以上三列、第四项第2行第1列。

## 启动完整参考

[下载源码ZIP](../../../assets/downloads/web-responsive-events.zip)，解压后打开responsive-events。启动与验证条件见目录README。先按README观察真实结果，再从空文件独立重写。

用浏览器打开index.html，修改后保存并刷新。

## 把布局分四步完成

**先做能读的单列页面，再增加宽屏能力。** 建 responsive-events 文件夹，放 index.html 与 style.css。先写 header/nav、活动 section 的三个 article、联系 section；确认每个 href 都能找到同名 id。之后才添加布局。

第二步让正文有字号、行高、边距和最大宽度；第三步给 header/nav 加 Flex。`flex-wrap:wrap` 允许空间不足时换行；gap 留稳定间距，不靠空格。第四步给 .cards 加 Grid，默认单列，在 700px 及以上改为三列。`repeat(3,minmax(0,1fr))` 重复三个可收缩的等份列。

320px 时预期三个卡片竖排，导航允许换行；768px 与 1440px 时预期一行三卡。再添加第四张卡片，大屏应进入第二行，小屏仍竖排。给第二张卡片换成长英文串，确认 overflow-wrap 起作用。

用 Tab/Enter 完成活动与联系跳转，焦点可见；检查 699/700/701px 与浏览器放大后的文字。记录截图与实际结果，不只写“响应式完成”。这是静态信息页，没有报名、服务器保存或真实日期处理。

### 就地练习：卡片套错一层

把四张article包进新的总div，再作为.cards唯一子项。预测网格直接排列谁，随后恢复。

### 参考核对：卡片套错一层

总div成为唯一网格子项，article不再直接参与这层Grid；应在正确父级声明布局或恢复直接子项。

## 完整参考文件

### index.html

```html
<!doctype html>
<html lang="zh-CN">
<head>
 <meta charset="UTF-8">
 <meta name="viewport" content="width=device-width, initial-scale=1">
 <title>周末活动</title>
 <!-- CSS 和 HTML 放在同一目录，按相对路径读取。 -->
 <link rel="stylesheet" href="style.css">
</head>
<body>
 <header><h1>周末活动</h1><nav><a href="#events">活动</a><a href="#contact">联系</a></nav></header>
 <main>
  <!-- 导航锚点对应 section 的 id；卡片是 cards 的直接子项。 -->
  <section id="events"><h2>本周安排</h2><div class="cards">
   <article><h3>编程交流</h3><p>周六上午，一起修改自己的小程序。</p></article>
   <article><h3>读书讨论</h3><p>周六下午，分享一本最近读过的书。</p></article>
   <article><h3>作品展示</h3><p>周日上午，演示实际运行结果。</p></article>
  </div></section>
  <section id="contact"><h2>联系</h2><p>本地演示页面，没有报名服务。</p></section>
 </main>
</body>
</html>
```

### style.css

```css
/* 声明宽度包含 padding 和 border，便于检查窄屏尺寸。 */
* { box-sizing: border-box; }
body { margin: 0 auto; padding: 20px; max-width: 1000px; font: 16px/1.7 sans-serif; color: #1e293b; }
/* Flex 组织页眉；空间不足时 wrap 允许主标题和导航换行。 */
header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
nav { display: flex; flex-wrap: wrap; gap: 16px; }
/* 默认一列；只有达到下面的断点才使用三列。 */
.cards { display: grid; gap: 16px; }
article { min-width: 0; padding: 20px; border: 1px solid #cbd5e1; background: #f4f7fa; }
/* 长文本在需要时换行，不把网格撑出视口。 */
article p { overflow-wrap: anywhere; }
a { color: #164e80; }
a:focus-visible { outline: 3px solid #164e80; outline-offset: 4px; }
/* 宽度达到 700px 后，三列分配扣除间距后的可用空间。 */
@media (min-width: 700px) { .cards { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
```

## 自己完成与验收

修改一个输入或内容，先写预期，再运行；再测试README所列边界。记录启动方式、实际结果与自己能解释的代码。参考项目运行成功不会自动记录课程完成。

### 参考答案

在 index.html 的 .cards 内、第三个 article 之后添加：

```html
<article><h3>新手问答</h3><p>周日下午，带着一个实际报错来讨论。</p></article>
```

再把第二项段落暂改为无空格长串 `averyveryveryveryveryveryveryveryveryveryveryverylongword`。保留原 style.css，不加隐藏溢出。320与699px应四卡竖排，700/701/768/1440px应三列，第四卡进入第二行第一列；长串在卡内断行。Tab 依次聚焦活动与联系链接，Enter 到正确目标。恢复可读文字后保存两份源文件，记录测试宽度与实际结果；这份页面没有报名后端。

## 把“响应式正常”拆成可复验的结果

把699/700/701px作为边界组，320/768/1440px作为常见宽度组。每组都检查列数、第四项位置、导航换行、长文字和键盘焦点；单张桌面截图无法覆盖这些条件。

第四张卡片仍是 .cards 的直接子项，放到容器外不会参与 Grid。长串不应通过缩小全页字号消除；先查看该段的 overflow-wrap 与卡片 min-width，再确认轨道能收缩。

### 就地练习：桌面截图漏了什么

为自己的完成记录补一个边界宽度、一个长串、一个键盘检查，写明实际结果，未执行项留空。

### 参考核对：桌面截图漏了什么

至少记录断点前后列数、长串在卡内换行、Tab焦点与Enter到目标；一张宽屏截图覆盖不了这些行为。
