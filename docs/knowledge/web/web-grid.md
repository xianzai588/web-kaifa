# Grid：先划分列，再让卡片进入网格

活动目录有三张卡片，你希望同一行的列对齐，手机自动减少列数，而不是给每张卡片写绝对坐标。Flex擅长沿一个主方向排列；Grid还可以统一管理行与列。本课不必先背所有属性，先理解容器、轨道、间隙、fr和列的最小尺寸，然后用完整目录观察它们如何配合。前置知识是盒模型与基本Flex，先分得清容器和直接子项。

## 把原理一步一步拆开

### 1. 网格容器、轨道与子项
display:grid 让父容器成为网格，直接孩子成为网格子项。grid-template-columns 定义列轨道；示例没有指定行数，内容放不下当前行后，浏览器会创建后续行。gap负责列间和行间间隙，不是卡片里面的留白。默认自动放置按文档顺序填入空位，先写第一张就先出现第一张，能避免视觉顺序与阅读顺序不一致。

#### 就地练习：直接子项排位

四卡两列，给第一卡跨全列，预测其余排位。

#### 参考核对：直接子项排位

第一卡占首行，其余按空位和文档顺序继续；Grid管理直接子项。

### 2. fr是剩余空间的份额
两列 `1fr 2fr` 不是整个容器宽度的33%和66%：布局会先考虑固定轨道、gap与相关尺寸约束，再分配剩余空间。假设容器600px、两列之间20px，且没有额外最小尺寸干扰，剩下580px按1:2分，约193.33px与386.67px。用重复的 `1fr` 做等分列很方便，但其默认最小约束可能受长内容影响，必要时写 minmax(0,1fr)。

#### 就地练习：先扣gap

600px容器、20px间隔、1fr 2fr，手算两列约宽。

#### 参考核对：先扣gap

余580按1:2分，约193.33与386.67；假设无额外最小尺寸干扰。

### 3. minmax限制列可小到哪里
`minmax(220px,1fr)` 表示列不低于220px，可向上分配剩余空间。但手机容器只有190px时，这个下限仍然是220，可能溢出。本例使用 `minmax(min(100%,220px),1fr)`：下限取容器宽度与220px中较小者，窄于220时允许一列跟随容器。它不是万能修复，卡片内部的固定图片或不换行按钮也需要各自处理。

#### 就地练习：最小列也可能过大

容器190px，比较minmax(220px,1fr)与本例min(100%,220px)下限。

#### 参考核对：最小列也可能过大

固定220下限可能溢出；取较小值可跟随190，但内部图片和长文本仍需处理。

### 4. auto-fit 与内容尺寸共同决定列数
repeat(auto-fit,...) 尽可能创建能放下的列，空轨道可以折叠，让实际卡片利用空间。列数会随容器宽度变化，而不是仅看屏幕标签是“手机还是电脑”。三个卡片在较宽容器可同排，较窄时减少列。card 的 min-width:0 允许子项不被内容最小宽度卡住，overflow-wrap:anywhere 让测试长词可换行。Grid内部仍可以放Flex来排列卡片按钮，工具不互斥。

#### 就地练习：按容器而非机型

同样视口加宽侧栏使Grid容器缩窄，列数是否一定不变？记录实际网格线。

#### 参考核对：按容器而非机型

auto-fit依据可用容器空间，侧栏可改变列数，不能只按设备品牌猜。

## 在 VS Code 中创建、保存与运行

1. 在自己的练习目录里新建 `web-grid` 文件夹，例如放在 `exercises/web/` 下；不要在 materials 原教材中覆盖文件。打开 VS Code，选择“文件 → 打开文件夹”，选中这个新文件夹。
2. 在左侧资源管理器用“新建文件”按下面清单创建文件。带 `/` 的名字表示子文件夹，例如 `assets/style.css` 需要 assets 文件夹，不能把斜杠当普通名字。逐个复制对应完整代码，Windows 用 Ctrl+S，macOS 用 Command+S 保存全部文件。
3. 在 VS Code 资源管理器中右键 index.html，选择“在文件资源管理器中显示”（macOS为Finder），然后双击该文件用浏览器打开。浏览器显示页面，VS Code负责编辑；不要只点编辑器的播放图标，也无需编译HTML。每次修改先保存，再回浏览器刷新。

文件清单：

- `index.html`


## 完整可运行示例

### 完整文件：index.html

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>活动卡片网格</title>
    <style>
    *{
      box-sizing:border-box
    }
    body{
      font:1rem/1.7 sans-serif;
      margin:1rem
    }.cards{
      display:grid;
      grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));
      gap:16px;
      max-width:960px
    }.card{
      min-width:0;
      overflow-wrap:anywhere;
      border:1px solid #999;
      padding:16px
    }.card h2{
      font-size:1.2rem;
      margin-top:0
    }
    </style>
  </head>
  <body>
    <h1>活动卡片网格</h1>
    <div class="cards">
      <article class="card">
        <h2>HTML 入门</h2>
        <p>从标题、段落和链接开始。</p>
      </article>
      <article class="card">
        <h2>CSS 排版</h2>
        <p>先让内容容易阅读，再设计布局。</p>
      </article>
      <article class="card">
        <h2>长内容测试</h2>
        <p>verylongfilenamewithoutspacesforgridtesting.html</p>
      </article>
    </div>
  </body>
</html>
```

## 具体结果与解释

```output
宽度充足时三张卡片并列，卡片之间都有16px间隙；窄屏自动变成较少列，长文件名可以换行。标题和文本保持在卡片边框内，没有靠裁掉页面隐藏溢出。
```

cards负责网格总布局，max-width限制目录最长宽度，gap统一相邻距离。card负责内部边框、padding和长内容；h2只有字号规则，不负责卡片所在列。第三张故意放无空格的长文件名，这是边界输入，用来判断布局有没有依赖所有内容都很短。

先把浏览器缩窄到320px，再拉宽到768与1280。右键检查cards，在DevTools打开Grid覆盖层，可以看到列轨道与间隙。临时把列规则改成 `repeat(2,minmax(0,1fr))`：它始终两列，手机也不自动变一列。由此比较“固定列数”和“自适应列数”，不要只记一个长属性字符串。

## 两种常见问题与排查顺序

### 情况一：手机横向滚动
检查列最小宽是否写成固定300px，且容器内容宽不足300。再看子项是否有 width:500px、长词不换行或固定宽度表格。先定位真正超宽元素，修对应约束，而不是给body设置overflow-x:hidden。用Grid覆盖层区分“轨道就太宽”和“子项内容伸出轨道”。

### 情况二：想让所有卡片均匀，却有一列异常宽
看 fr轨道的最小尺寸与内容：长不可分割内容可能参与最小宽度计算。等分列可用minmax(0,1fr)，子项再配min-width:0与换行。若设置了grid-column跨列，还需检查跨度是否超出已有列，意外创建隐式列；不是所有空白都由gap过大造成。

## 变化练习

把三张卡片目录改成“720px以下一列，720px及以上两列”，让第三张自然落入下一行。禁止给每张卡写grid-column。

### 参考答案

默认给cards设置 `grid-template-columns:minmax(0,1fr)`，再写 `@media(min-width:720px){.cards{grid-template-columns:repeat(2,minmax(0,1fr));}}`。第三张会按文档顺序进入第二行第一列。保留card的最小尺寸与换行规则。分别在719与720宽检查，才能证明断点两侧行为，而不是只看桌面截图。

## 本课自查

- gap与卡片padding分别在哪里？
- 两列1fr在有gap时是不是各占容器50%？
- 固定列最小宽为什么可能伤害手机布局？
- 你能解释auto-fit、minmax和子项min-width各解决哪一层问题吗？

能运行示例是起点，不等于已经学完。请先遮住参考答案，预测变化结果，再独立修改并记录实际结果。如果仍有问题，向AI提供目标、文件结构、自己的代码、具体操作、期待与实际结果、已尝试步骤；让它先定位最小问题，再自己验证修改。

## 继续查证

- [MDN：Grid教程](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Grids)
- [MDN：minmax](https://developer.mozilla.org/en-US/docs/Web/CSS/minmax)
