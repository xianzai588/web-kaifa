# Flex：先判断两条轴，再设置对齐

导航条有三个长度不同的链接，想让它们沿一行分布，并在较窄手机上换行。逐个写 margin-left 只能适应当前文字长度，换个标题就会失效。Flex 让父容器管理一组子项的排列、对齐与空间。本课先横排，再用按钮切换纵排，观察相同属性为什么换了方向。先完成盒模型练习，知道元素的总宽与父容器可用空间不是只看 width 一个数。

## 把原理一步一步拆开

### 1. 谁是容器，谁是子项
在 nav 上写 display:flex，nav 成为 Flex 容器，它的直接孩子 a 成为 Flex 子项。不是页面上所有后代都自动变成子项；如果 a 被放进额外的 div，直接参与排列的是 div。父容器的 gap 控制子项间距，子项自己的 padding 控制文字到背景边缘的距离。布局属性写错层级时，再多调数值也达不到预期。

#### 就地练习：额外容器改变子项

给每个a外包div，预测Flex直接排列谁，再恢复。

#### 参考核对：额外容器改变子项

直接项目变div，a不是这层Flex的直接子项，属性需写对层级。

### 2. 主轴与交叉轴由 direction 决定
本例中文页面采用常见水平书写模式：row 的主轴水平，交叉轴竖直；column 的主轴竖直，交叉轴水平。justify-content 沿主轴分配剩余空间，align-items 沿交叉轴对齐。把 row 换成 column 后，属性的职责没有改变，轴的方向改变了。因此“justify 永远横向居中”是错误记忆。其他书写方向也会影响视觉方向，应先看 direction 与实际布局。

#### 就地练习：先标两条轴

nav切column后写出justify-content与align-items的方向。

#### 参考核对：先标两条轴

水平书写下主轴竖直、交叉轴水平；两个属性职责没变。

### 3. 对齐要求先有可分配的空间
space-between 把主轴剩余空间放在项目之间，首尾贴着内容区域两端；它不会生成无限空间。align-items:center 在容器交叉轴空间比子项大时，差异才明显。示例给 nav 最小高度140px，以便在横排时观察上下居中。column 模式改成主轴居中、交叉轴起点对齐，你会看到项目上下排、左侧对齐，而不是继续横向分散。

#### 就地练习：没有余量分什么

列方向只包住内容、不加高度时space-between为何可能不明显？加临时高度再看。

#### 参考核对：没有余量分什么

没有可分配余量；有额外高度才更容易看到主轴间隔，之后删测量高度。

### 4. 换行、伸缩与最小尺寸
默认 nowrap 尝试排在一条主轴线上；flex-wrap:wrap 允许空间不足时产生多行，gap 同时提供行间与项间间隔。子项可以伸缩，但长的不可分割文本、固定尺寸或默认最小尺寸可能阻止缩小。可在需要收缩的文本子项使用 min-width:0，并根据内容设置 overflow-wrap；不要一见溢出就给整个页面 hidden。多行之间的空间涉及 align-content，单行内子项对齐则是 align-items，它们不能混为一谈。

#### 就地练习：换行不遮内容

把一个导航标题改长，在窄屏核对wrap、min-width及文字换行，不能只隐藏整页溢出。

#### 参考核对：换行不遮内容

容器允许换行、项目可缩、长词可断各负责一层，hidden可能把操作藏掉。

### 5. grow、shrink与basis：分的是剩余空间
flex-basis提供主轴初始尺寸，flex-grow决定空间充足时怎样分配正剩余空间，flex-shrink参与空间不足时的缩减。默认通常是 `flex:0 1 auto`：不主动增长、允许收缩、基准依赖自身尺寸或内容。假设容器620px、gap20px、两个子项basis各100px，剩余空间是 `620-20-100-100=400px`；grow分别1与3时，第一项增加100、第二项增加300，最后宽度200与400，而不是把总620直接按1:3分。若grow分别1与2，额外400分成约133.33与266.67，最终约233.33与366.67。shrink不是仅按系数平均减：基准尺寸也参与缩减权重，最小尺寸又可能限制结果。先用可手算的固定basis例子理解，再考虑内容基准；不能把flex:1解释为元素必定占整行全部宽度。

#### 就地练习：grow分配剩余

容器620、gap20、两项basis100，grow为1和3，手算最终宽。

#### 参考核对：grow分配剩余

剩400按1:3加100和300，最终200与400，不是把620直接按1:3分。

## 在 VS Code 中创建、保存与运行

1. 在自己的练习目录里新建 `web-flex` 文件夹，例如放在 `exercises/web/` 下；不要在 materials 原教材中覆盖文件。打开 VS Code，选择“文件 → 打开文件夹”，选中这个新文件夹。
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
    <title>Flex 两条轴</title>
    <style>
    *{
      box-sizing:border-box
    }
    body{
      font:1rem/1.7 sans-serif;
      margin:1rem
    }.bar{
      display:flex;
      flex-wrap:wrap;
      justify-content:space-between;
      align-items:center;
      gap:12px;
      max-width:640px;
      min-height:140px;
      padding:16px;
      border:2px solid #164e80
    }.bar a{
      padding:8px;
      background:#e5eef5
    }.column{
      flex-direction:column;
      justify-content:center;
      align-items:flex-start
    }
    button{
      margin-block:16px;
      max-width:100%;
      white-space:normal
    }
    </style>
  </head>
  <body>
    <h1>Flex 两条轴</h1>
    <nav class="bar" aria-label="实验导航">
      <a href="#intro">简介</a>
      <a href="#events">这周有哪些活动</a>
      <a href="#join">加入社团</a>
    </nav>
    <button id="toggle" type="button">切换为纵向</button>
    <p id="axis">当前 row：主轴横向，交叉轴纵向。</p>
    <p id="intro">简介：从小程序开始。</p>
    <p id="events">活动：制作网页。</p>
    <p id="join">加入：下周来活动室。</p>
    <script>
    document.querySelector('#toggle').addEventListener('click',()=>{
      const column=document.querySelector('.bar').classList.toggle('column');
      document.querySelector('#toggle').textContent=column?'切换为横向':'切换为纵向';
      document.querySelector('#axis').textContent=column?'当前 column：主轴纵向，交叉轴横向。':'当前 row：主轴横向，交叉轴纵向。';
    });
    </script>
  </body>
</html>
```

## 具体结果与解释

```output
宽屏初始看到三个横向链接，上下居中。点击“切换为纵向”后，链接改成上下排列并左侧对齐，提示写明主轴纵向。再点击恢复横向；窄屏初始链接可以换行。
```

bar 是公共布局类，先设置 display、wrap、两种对齐和gap。每个链接有自己的内距和浅色背景，方便看到子项边界。额外 column 类改变 flex-direction、justify-content 与 align-items；JavaScript 按钮只添加/删除这个类并更新提示文字，没有逐个计算坐标。

在浏览器检查 nav，打开 DevTools 的 Flex 覆盖层。切换前后分别标记两条轴；再取消 align-items:center，观察默认拉伸行为。最后把 space-between 改 center：三个链接会聚集在中间，同时保留gap。每次只改一个属性，才知道是哪条规则造成变化。

## 两种常见问题与排查顺序

### 情况一：想让按钮组居中却没有效果
确认 display:flex 写在直接父元素上，再确认当前 direction。容器高度刚好等于内容高度时，竖向居中看起来不会移动；给实验容器明确的最小高度，观察是否产生剩余空间。不要用负 margin 硬推位置，它可能把点击区域与文本移到别处。

### 情况二：手机上最后一个链接被挤出去
检查 nowrap、链接 white-space:nowrap、固定 width 和长文本。先允许 wrap，再检查不能断开的内容。子项 min-width:0 解决的是允许收缩，并不自动让文字断行；需要同时考虑文字换行。使用 row-reverse 或 order 仅改变视觉顺序，通常不会同步改变键盘与文档阅读顺序，导航应优先让源码顺序就是希望用户访问的顺序。

## 变化练习

保持 column 模式，让三个链接横向居中，但在容器竖向起点开始排列。先写出要修改的两个属性及各自负责的轴，再动手。

### 参考答案

column 的主轴是竖直，所以竖向起点使用 justify-content:flex-start；交叉轴是水平，所以横向居中使用 align-items:center。仍然保留gap。可以只改 .column 中这两行，对照提示与Flex覆盖层验证。没有必要给每个 a 添加 margin-left；它们共享同一个容器对齐规则。

## 本课自查

- 哪个元素应设置display:flex？
- direction从row变column时，justify-content的职责有没有改变？
- space-between为什么在没有剩余空间时不明显？
- wrap与文字断行为什么是两个问题？

能运行示例是起点，不等于已经学完。请先遮住参考答案，预测变化结果，再独立修改并记录实际结果。如果仍有问题，向AI提供目标、文件结构、自己的代码、具体操作、期待与实际结果、已尝试步骤；让它先定位最小问题，再自己验证修改。

## 继续查证

- [MDN：Flexbox 教程](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Flexbox)
- [MDN：flex-wrap](https://developer.mozilla.org/en-US/docs/Web/CSS/flex-wrap)
- [MDN：flex-grow与剩余空间](https://developer.mozilla.org/en-US/docs/Web/CSS/flex-grow)
