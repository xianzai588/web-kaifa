# 盒模型与尺寸计算：亲手测出多出来的宽度

两张 width 都写 200px 的卡片，一张却更宽；把两张放到 420px 的行里，第二张被挤到下一行。需要理解的不是一个神秘浏览器错误，而是你声明的宽度到底包含哪些部分。本课对照 content-box 与 border-box，用按钮测量边框外宽，并在开发者工具里确认内容宽。先认识 CSS 的类与属性，再开始测量。

## 把原理一步一步拆开

### 1. 从里到外看四层
content 是文字和图片占据的内容区域；padding 是内容到边框之间的内距；border 是包住内距的边框；margin 是边框以外与其他元素的外距。背景通常覆盖内容和内距，不覆盖 margin。给卡片“更多呼吸空间”用 padding；让卡片远离其他卡片用 margin 或父布局的 gap，它们表达的关系不同。

#### 就地练习：内外间距分开

为文字与边框留12px、两卡之间留16px，分别该用什么关系？

#### 参考核对：内外间距分开

前者padding，后者margin或父gap；背景不覆盖margin。

### 2. content-box 的 width 只定义内容宽
本例 width=200px，左右 padding 各12px，左右 border 各1px。边框外宽是 `200+12+12+1+1=226px`。margin 不包含在这个测量里。如果左右 margin 各16px，横向占用空间还要考虑这32px；所以“看起来226宽”与“布局需要的总空间”不是同一概念。height 也有相应区别，但文字换行又会影响内容高度。

#### 就地练习：先手算外宽

width200、两侧padding12、border1，写出content-box边框外宽与加两侧16margin后的横向预算。

#### 参考核对：先手算外宽

外宽226px，另加32px外距后预算258px，不把margin放进边框测量。

### 3. border-box 把内距与边框纳入 width
同样声明 width=200px，border-box 的边框外宽保持200px；内容宽变成 `200-24-2=174px`。它没有让 padding 消失，而是在总宽不变时留给内容的空间更少。CSS 常在全局设置 `* { box-sizing: border-box; }` 让宽度预算更直观，仍要记得 margin 在外面。min-width、max-width、内容不可收缩等也可能影响最终宽度，所以读声明之后还要测量。

#### 就地练习：同宽内容变少

改border-box且width仍200，预测内容宽，再增加padding观察。

#### 参考核对：同宽内容变少

原内容174px；增加padding时总外宽仍受200约束而内容更窄。

### 4. 测量什么、用什么单位
CSS 的 px 是 CSS 像素，不等于你数显示器物理像素；缩放和设备像素比会改变对应关系。示例调用 getBoundingClientRect().width 读取元素边框盒的显示宽度；在本例没有 transform、特殊缩放时，可以直接核对上面的公式。DevTools 的盒模型图还能分别展示内容、padding、border 与 margin。两种证据一起看，才不会把外距误算进返回值。

#### 就地练习：测量对象明确

比较盒模型图与getBoundingClientRect的宽度，说明是否包含margin；本例不加transform。

#### 参考核对：测量对象明确

矩形读边框外缘，不含margin；无transform时可直接核对本课公式。

### 5. block与inline不是所有元素一样算
普通文档流中的div、p等块级盒通常从新行开始，宽度auto时占可用宽度；span、a等行内盒参与文字行，给普通inline设width或height通常不会像块盒那样控制尺寸。希望链接像有明确宽高的标签，可考虑inline-block；想管理一组标签则由Flex/Grid容器排列。默认display来自浏览器样式，可以被CSS改变。不要以为“链接标签一定不能设宽”或“所有标签width都一样生效”，要看最终display与布局环境。

#### 就地练习：inline不按块宽

普通span设width100px，分别用inline和inline-block观察。

#### 参考核对：inline不按块宽

普通行内不按块宽方式应用width，inline-block可有尺寸并参与行内排列。

## 在 VS Code 中创建、保存与运行

1. 在自己的练习目录里新建 `web-box` 文件夹，例如放在 `exercises/web/` 下；不要在 materials 原教材中覆盖文件。打开 VS Code，选择“文件 → 打开文件夹”，选中这个新文件夹。
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
    <title>盒模型测量</title>
    <style>
    body{
      font:1rem/1.7 sans-serif;
      margin:1rem
    }.card{
      width:200px;
      padding:12px;
      border:1px solid #333;
      margin:16px 0;
      background:#e4eef5
    }.content{
      box-sizing:content-box
    }.border{
      box-sizing:border-box
    }
    #result{
      white-space:pre-wrap;
      overflow-wrap:anywhere
    }
    </style>
  </head>
  <body>
    <h1>盒模型测量</h1>
    <div class="card content">
      content-box
    </div>
    <div class="card border">
      border-box
    </div>
    <button type="button" id="measure">测量边框外宽</button>
    <pre id="result" aria-live="polite">点击按钮，核对你的预测。</pre>
    <script>
    document.querySelector('#measure').addEventListener('click',()=>{
      const a=document.querySelector('.content').getBoundingClientRect().width;
      const b=document.querySelector('.border').getBoundingClientRect().width;
      document.querySelector('#result').textContent=[`content-box：${a}px`, `border-box：${b}px`].join('\n');
    });
    </script>
  </body>
</html>
```

## 具体结果与解释

```output
点击“测量边框外宽”后，结果应是 content-box：226px 与 border-box：200px。第一张背景区域明显更宽；二者顶部到下方的外距不包含在结果数值里。
```

两张 div 都使用公共 card 类，所以 width、padding、border 相同；额外的 content 与 border 类只改变 box-sizing。CSS 的 `.border` 是类名，不是 border 属性本身。按钮事件分别找到两张卡片，再读取 width，最后把数值写入 pre 文本。JavaScript 在这里只是测量工具；你先用四则运算预测，才能判断测量结果有没有支持理解。

右键卡片“检查”，在 Computed 的盒模型图中观察第一张内容200、第二张内容174。把 padding 改为20px，先预测第一张变242、第二张仍200，再保存、刷新、测量。这一步能区分“记住答案”与“会用模型”。

## 两种常见问题与排查顺序

### 情况一：两个测量都一样，和预期不符
检查是否另有全局 `* { box-sizing: border-box; }` 或更高优先级规则覆盖 .content。本例是独立文件，便于排除干扰。用 Computed 确认最终 box-sizing，不要只看源码。若给元素添加了 transform:scale，getBoundingClientRect 返回会受变换影响，需要先去掉变换再做本课计算。

### 情况二：明明总宽够，布局仍拥挤
把 gap、父元素 padding 与 margin 也算进预算。两张226宽卡片加16的gap需要468px，不是452px；父容器还有左右内距时，可用内容宽会更小。竖直普通文档流中的相邻 margin 还可能折叠，不应把所有竖直间距机械相加；Flex/Grid 中常用 gap 表达统一间距，减少这类混淆。

## 变化练习

把公共 width 改240px，padding 改20px，border 改2px；预测两张边框外宽，以及 border-box 卡片的内容宽。再测量并截图 DevTools 盒模型。

### 参考答案

content-box 边框外宽为 `240+40+4=284px`；border-box 边框外宽为240px，内容宽为 `240-40-4=196px`。如果额外左右 margin 各10px，它们仍不计入按钮返回的width。测量前写预测，测量后写实际值与差异原因，这比只贴一张截图更能证明你会计算。

## 本课自查

- padding 与 margin 的使用目的有什么不同？
- content-box 的200px究竟指哪个区域？
- border-box 有没有包含 margin？
- 父容器的内距为什么影响两张卡片能否放进一行？

能运行示例是起点，不等于已经学完。请先遮住参考答案，预测变化结果，再独立修改并记录实际结果。如果仍有问题，向AI提供目标、文件结构、自己的代码、具体操作、期待与实际结果、已尝试步骤；让它先定位最小问题，再自己验证修改。

## 继续查证

- [MDN：盒模型组成](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_box_model/Introduction_to_the_CSS_box_model)
- [MDN：box-sizing](https://developer.mozilla.org/en-US/docs/Web/CSS/box-sizing)
