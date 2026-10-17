# 链接与相对路径

区分外部地址、同目录文件与页面内锚点。

## 浏览器如何找到链接目标

**`href` 是目标地址；链接文字是给人看的说明。** `<a href="#events">查看活动</a>` 不会创建活动，它只让浏览器找已经存在的目标。

| 地址写法 | 浏览器如何理解 |
| --- | --- |
| `https://developer.mozilla.org/` | 完整的网上地址，含协议和主机名 |
| `about.html` 或 `./about.html` | 当前 HTML 所在目录中的另一个文件 |
| `images/photo.png` | 当前目录下 images 子目录中的图片文件 |
| `../index.html` | 先回到上一级目录，再找 index.html |
| `#events` | 当前文档内 `id="events"` 的位置 |

点击本例链接后，地址栏末尾会出现 `#events`。页面内容很短时，目标已经在屏幕内，可能看不到明显滚动；可以先确认地址和目标 id，而不是据此判断链接没有工作。目标的 `id` 不写井号，井号属于地址的片段部分。

用 Tab 聚焦链接、Enter 激活，也应该得到同一目标。外部地址需要联网；本页锚点不需要额外联网。移动文件到另一个目录后，要重新核对所有相对路径。

### 就地练习：只改目标会失配

把id从events改schedule但先不改href，点击链接后分别检查地址片段与目标定位，再同步修复。

### 参考核对：只改目标会失配

地址可能仍变#events但找不到目标；id只写schedule，href写#schedule且目标应唯一。

## 路径、片段与打开新窗口

`about.html` 相对当前文件所在目录，`pages/about.html` 进入子目录，`../index.html` 回到上一级，`/about.html` 则从站点根目录出发。在 GitHub Pages 项目站点中，根路径通常不包含仓库子目录，随意用 / 开头可能跳错。

href="#schedule" 要对应唯一 id="schedule"。链接文字应描述目标，避免一页多个含糊的“点这里”。需要打开新窗口时使用 target="_blank" 并明确告知读者，可加 rel="noopener"；不要把无目标链接或 javascript 地址当按钮，后续操作用 button。

### 就地练习：跨一层目录返回

首页在index.html，关于页在pages/about.html。分别写去程与回程href，实际保存两文件验证。

### 参考核对：跨一层目录返回

首页用pages/about.html，关于页用../index.html；每个相对地址以所属文档目录为基准。

## 先看一个完整例子

在自己的独立练习文件夹新建 index.html，保存下面完整内容，用浏览器打开。修改后先保存，再刷新。

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>本节小练习</title>
</head>
<body>
<h1>社团介绍</h1>
<!-- href 中的 # 表示寻找本页 id 为 events 的位置。 -->
<a href="#events">查看活动</a>
<!-- 这里才是真正存在的链接目标；id 的值不包含 #。 -->
<h2 id="events">周末活动</h2>
<p>一起练习网页。</p>
</body>
</html>
```

## 逐步读懂这个例子

点击链接后地址增加#events，浏览器定位到目标。href中的井号表示页面内位置，目标元素的id只写events。实际跳转新页面要创建那个文件，写文件名不是创建文件。

## 自己改一处再观察

把目标id改为schedule，先只改目标，观察失效；再同步修改href。

### 参考答案

只改目标 id 后原 #target 不再匹配，链接可能仍更新地址片段却找不到标题。把 href 同步改成 #schedule，且确认 id 唯一，才恢复定位。

## 部署后路径失败的两种原因

本机不区分大小写的文件系统可能让 About.html 碰巧打开，Linux 站点却只找到 about.html。另一常见错误是把本机盘符写进 href。先核对大小写与实际目录，再看 Network 中请求到的完整地址。

### 就地练习：大小写也参与地址

文件实际叫about.html，源码写About.html。本机碰巧打开后，发布到区分大小写环境可能怎样？

### 参考核对：大小写也参与地址

可能404；核对真实文件名、目录和请求地址，不能把本机大小写宽容当部署保证。

## 独立变式：两张页面之间往返

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。使用已学的完整 HTML、a、href、id；不需要新的分区标签。

在新目录保存 index.html 和 about.html。首页有“关于这个练习”的链接，关于页有“回到首页”的链接；首页还要有一个跳到正文 h2 的页面内链接。先画出两个文件和三个目标的关系，再自行写地址。

自查：两次跳转后地址分别是 about.html 与 index.html，页内跳转增加与 h2 的 id 一致的 #片段。只把 about.html 移到新建的 pages 子目录，旧链接应失效；自行修正路径后往返恢复。记录每个地址相对哪份文件，不把电脑盘符当通用网址。

### 参考答案：独立变式

首页保存为 index.html。关于页可用相同外壳，把正文改为 h1“关于练习”和链接 `<a href="index.html">回到首页</a>`，保存为同目录 about.html。移到 pages 后，首页链接改为 pages/about.html，关于页返回改为 ../index.html。页内链接仍是 #schedule。

下面是完整 index.html，保存后用浏览器打开；需要服务器时按本节启动说明运行。

```html
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>独立练习</title>
</head>
<body>
<h1>练习首页</h1>
<p><a href="about.html">关于这个练习</a></p>
<p><a href="#schedule">查看安排</a></p>
<h2 id="schedule">今日安排</h2>
<p>先读后练。</p>
</body>
</html>
```
