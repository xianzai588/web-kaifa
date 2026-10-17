# 实战 学习名片页

从空文件写出结构清楚、可读且能键盘操作的一页。

## 项目任务

至少一个主标题、简介、目标列表与联系说明。样式放style.css，通过link引入。用320、768、1440px与键盘验证，改一项颜色和全部文字为自己的内容。

### 就地练习：先把验收写具体

给名片页写三个可观察结果：内容结构、320px宽度、键盘跳转各一项，暂不复制参考。

### 参考核对：先把验收写具体

可验一个h1和目标列表、卡片无横向出屏、Tab焦点可见并Enter到contact；不能只写页面好看。

## 启动完整参考

[下载源码ZIP](../../../assets/downloads/web-profile-card.zip)，解压后打开profile-card。启动与验证条件见目录README。先按README观察真实结果，再从空文件独立重写。

用浏览器打开index.html，修改后保存并刷新。

## 从零搭建时按这个顺序

**HTML 负责内容，style.css 负责外观；两份文件都要保存。** 先建独立的 profile-card 文件夹，创建下面同名的两个文件。HTML 中的 link 按同目录寻找 style.css，不能把两个文件放在不同目录而仍用这个地址。

先只写 h1、介绍段落、h2 和目标列表，打开确认文字正确；再加指向 contact 的链接和分区；最后逐条加 CSS。`*` 选择所有元素，`font:16px/1.7 sans-serif` 是字号、行高与字体的简写，`#f4f7fa` 是十六进制颜色值。`margin:20px auto` 表示上下 20px，左右自动分配空间使卡片居中。

这个项目提前使用一个很小的交互状态：`:focus-visible` 是键盘等操作需要明显焦点时匹配的伪类，outline 是不挤占布局的外框，outline-offset 把框往外移 4px。这里用原生 a，不需要 JavaScript 才能按 Enter 跳转。

验收时在 320、768、1440 CSS 像素宽度检查：文字可读、卡片边框没有出屏、链接可用 Tab 找到、按 Enter 到联系分区。再把一个目标改成长句，观察换行。没有表单提交、网络请求或持久化，不把这些写成已实现功能。

### 就地练习：只改文件的一边

把联系目标id改为reach，只先改section，再试原链接。之后同步修复，解释为何样式无须改变。

### 参考核对：只改文件的一边

锚点与目标失配，href也应改#reach；这是HTML关系变化，不需改CSS颜色来修复。

## 完整参考文件

### index.html

```html
<!doctype html>
<html lang="zh-CN">
<head>
 <meta charset="UTF-8">
 <meta name="viewport" content="width=device-width, initial-scale=1">
 <title>我的学习名片</title>
 <!-- 读取同目录的样式文件；CSS 不需要写进正文。 -->
 <link rel="stylesheet" href="style.css">
</head>
<body>
 <main class="card">
  <h1>我的学习名片</h1>
  <p>我正在学习 Web 开发。</p>
  <h2>这个月的目标</h2>
  <ul><li>看懂一张网页</li><li>独立修改样式</li></ul>
  <!-- 链接用键盘也能操作，目标是下面的 contact 分区。 -->
  <a href="#contact">查看联系说明</a>
  <section id="contact"><h2>联系说明</h2><p>这是本地练习，没有报名或消息发送功能。</p></section>
 </main>
</body>
</html>
```

### style.css

```css
/* 全部元素采用 border-box，让声明宽度包含内边距与边框。 */
* { box-sizing: border-box; }
/* font 简写为 字号/行高 字体；sans-serif 使用设备的无衬线字体。 */
body { margin: 0; padding: 20px; font: 16px/1.7 sans-serif; background: #f4f7fa; color: #1e293b; }
/* 小屏占满可用宽度，大屏上限 480px；左右 auto 分配剩余空间。 */
.card { width: 100%; max-width: 480px; padding: 24px; margin: 20px auto; background: white; border: 1px solid #cbd5e1; }
h1 { font-size: 1.6rem; }
h2 { font-size: 1.2rem; }
a { color: #164e80; }
/* Tab 聚焦链接时显示外框，不靠颜色变化猜测位置。 */
a:focus-visible { outline: 3px solid #164e80; outline-offset: 4px; }
```

## 自己完成与验收

修改一个输入或内容，先写预期，再运行；再测试README所列边界。记录启动方式、实际结果与自己能解释的代码。参考项目运行成功不会自动记录课程完成。

### 参考答案

可以把 index.html 的目标列表改为三项，并把标题改成“阿青的学习名片”：

```html
<h1>阿青的学习名片</h1>
<ul><li>读懂文档结构</li><li>写出一个新页面</li><li>记录运行结果</li></ul>
```

这段替换原 h1 与原 ul，不是追加第二个 h1。style.css 中把 a 与 a:focus-visible 的颜色都改为 #14532d，保存两份文件并刷新。预期三项目标、标题为新名字、链接与焦点均为深绿；用 Tab 聚焦后 Enter 到 #contact。320/768/1440px 都应无页面横滚，长目标自然换行；没有真实消息发送或保存功能。

## 项目的内容、样式与验收清单

先用无样式页面确认一个主标题、简介、目标列表与联系目标都能读到；再接入外部 CSS。若不加 CSS 也无法理解内容，应先修结构，不应靠卡片外观掩盖。

窄屏用边框外缘是否出屏、长文本是否换行作证据；键盘用 Tab 焦点与 Enter 跳转作证据。修改主标题只验证内容入口，修改主色只验证样式入口，这两种改动不应互相要求改另一文件。

### 就地练习：暂时关闭样式

在自己的副本暂时断开link，按顺序阅读内容并操作联系链接。恢复样式后再比。

### 参考核对：暂时关闭样式

无CSS仍应读懂主标题、简介与目标，原生链接仍可跳转；结构不依赖卡片外观存在。
