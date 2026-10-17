# 选择器、层叠与可读性：解释哪条样式生效

你写了 `.note { color: red; }`，页面文字却仍是蓝色。继续加十个规则只会让原因更难找。本课故意给同一段文字设置多条颜色规则，用实际结果理解“选中了谁”和“哪条声明胜出”。先认识 HTML 元素与 class 属性；CSS 可以暂时写进 head 的 style 中，减少文件路径干扰，理解后再拆到外部样式表。

## 把原理一步一步拆开

### 1. 规则由选择器与声明组成
`.note { color: #164e80; }` 左侧选择器寻找 class 中含 note 的元素，花括号内每一组“属性:值”是声明。p 选择器寻找所有段落；`.card .note` 中的空格表示 card 后代里面的 note；`.card.note` 没有空格，表示同一元素同时具备两个类。class 可以写成 `class="card featured"`，公共样式与特殊样式就能组合，避免复制整套代码。

#### 就地练习：空格改变匹配

比较.card.note与.card .note，分别画出能匹配的一个元素关系。

#### 参考核对：空格改变匹配

前者同一元素有两类，后者要求后代关系，不能随意互换。

### 2. 层叠不是无条件地“后写覆盖前写”
浏览器对每个属性单独选结果，涉及来源、重要性、层、选择器优先级与顺序。本课没有层与 !important，比较的是同一份作者样式：`.card .note` 含两个类，优先级高于只有一个类的 `.note`，所以即使后者写在后面，蓝色仍胜出。两个完全相同选择器设置同一属性时，通常后写的规则胜出。不要把这条简化规律套到所有样式冲突。

#### 就地练习：类多不看末行

让.card .note先写蓝色、.note后写红色，均普通同来源规则，预测最终色。

#### 参考核对：类多不看末行

两个类的优先级胜出，仍为蓝；其他层叠条件相同后才比较权重和次序。

### 3. 继承与直接命中不同
body 的 font 设置会影响子元素的文字，因为字体与行高通常可以继承。边框、外距等并不会自动继承给所有后代。父元素继承来的颜色也不能简单按父选择器的权重与直接命中子元素的声明比较：子元素自己已有指定颜色时，就不再拿父颜色当默认值。因此“父元素设置了颜色，所有后代一定相同”是误解。

#### 就地练习：直接颜色先于继承

父ID设绿，子标签p直接设蓝，预测子色并在Computed核对。

#### 参考核对：直接颜色先于继承

子直接声明为蓝，不能拿父ID权重直接压它；没有直接值时才用继承。

### 4. 可读性包含行高和可见焦点
正文例子使用 `1rem/1.7`，前者是字体大小，后者是行高倍数；文字与边框之间用 padding 留空间，避免挤在一起。链接仍应容易辨认，键盘移动到链接时 focus-visible 显示轮廓。不要为“干净”删除 outline 后又不提供替代焦点。颜色只负责传递一部分信息，错误状态还需要明确文字，让不能区分颜色的人也能判断。

1rem 参照根元素 html 的字号：假设根字号16px，本例1rem就是16px，1.7倍行高约为27.2px；它并不是“屏幕宽度的某个比例”。第10课中的 `5vw` 才参照视口宽度，320px视口的5vw=16px。`font-size:clamp(28px,5vw,44px)` 依次指定最小值、希望采用的值与最大值；320、768、1280px视口分别得到28、38.4、44px字号。不要只背这串代码，先计算中间值，再看它是否越界。完整的单位参照表与可追加到页面的验证步骤见[响应式与溢出定位](#/topic/web-responsive)中的“px、rem、百分比和vw”与“clamp”章节。用户设置可以改变根字号，放大页面后也要实测可读性。

长文章还要控制行长，不能把一行拉到整个超宽显示器；例如给正文 `max-width:65ch` 再居中，可作为起点。ch基于字体中“0”的字形宽度，不等于精确65个中文字，需结合中文内容与实际字号检查。统一间距可以用4、8、16px等规则或自定义属性，例如 `--space:8px`，让gap为var(--space)、卡片padding为calc(var(--space)*2)，使留白关系一致而不靠每处猜数值。文字颜色与背景的对比不能只凭“我觉得看得清”；用浏览器无障碍检查或对比计算工具核实，普通正文通常需要至少4.5:1，符合大文本条件时通常至少3:1。状态还要配文字、图形或边框等信息，不把红绿颜色作为唯一差别。

#### 就地练习：计算可读尺寸

根字号16px时计算1rem与1.7行高；只用Tab核对链接焦点。

#### 参考核对：计算可读尺寸

字号16px、行高约27.2px；焦点外框需独立于hover，颜色不是唯一反馈。

### 5. 自定义属性：集中定义可复用的值
`:root { --accent:#164e80; }` 在根元素定义--accent；`.card .note { color:var(--accent,#164e80); }` 读取它。自定义属性通常沿元素树继承，也可以在某个区块重新定义，只影响它和继承它的后代。var的第二个参数是变量缺失或不可用时的回退，不是“这颜色不好看就自动换色”。若变量存在但值不适合color，回退也不保证被采用。改变--accent可让多处使用它的颜色一起变化，减少到处复制色值。变量本身仍受层叠控制，不能绕开优先级。

hover描述鼠标悬停，focus-visible描述适合显示键盘焦点的状态；只有hover效果会使键盘用户看不到操作反馈。实际卡片封面若需要16:9，可以用aspect-ratio:16/9建立图片盒，再用object-fit:cover控制裁剪；这是尺寸和图像内容的不同问题，完整对照实验见响应式主题。

#### 就地练习：局部覆盖变量

root设accent，子容器覆盖，再看容器内外引用；删去变量观察合法回退。

#### 参考核对：局部覆盖变量

局部子树用覆盖值，外部仍用根值；变量层叠不绕开属性规则，存在但不适合color的值不保证采用回退。

## 在 VS Code 中创建、保存与运行

1. 在自己的练习目录里新建 `web-css` 文件夹，例如放在 `exercises/web/` 下；不要在 materials 原教材中覆盖文件。打开 VS Code，选择“文件 → 打开文件夹”，选中这个新文件夹。
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
    <title>样式优先级实验</title>
    <style>
    :root {
      --accent: #164e80;
    }
    body {
      font: 1rem/1.7 sans-serif;
      padding: 1rem;
    }
    p {
      color: #167038;
    } .card {
      max-width: 32rem;
      padding: 1rem;
      border: 1px solid #aaa;
    } .card .note {
      color: var(--accent, #164e80);
    } .note {
      color: #8e3b25;
    } .note {
      font-weight: 700;
    }
    a:focus-visible {
      outline: 3px solid #164e80;
      outline-offset: 3px;
    }
    </style>
  </head>
  <body>
    <h1>样式优先级实验</h1>
    <article class="card">
      <h2>周六活动</h2>
      <p class="note">这行文字应该是蓝色加粗。</p>
      <a href="#end">跳到结尾</a>
    </article>
    <p id="end">这是普通绿色段落。</p>
  </body>
</html>
```

## 具体结果与解释

```output
卡片内 note 段落是蓝色并且加粗；卡片外普通段落是绿色。按 Tab 聚焦链接，会看到蓝色轮廓。最后的 .note 颜色没有赢过前面的 .card .note。
```

p 先给段落绿色；`.card .note` 直接命中卡片内 note，把 color 指定为蓝色。后面的 `.note` 也命中，却因选择器优先级较低没有改变 color。最后一条 `.note` 设置 font-weight，前面没有冲突的加粗声明，所以它正常生效。一个规则的某个属性败出，并不代表该规则所有属性都失效。

在浏览器右键蓝色文字，选择“检查”，找到 Styles 面板；你应能看到被划掉的颜色声明。再到 Computed 看最终 color。临时取消 `.card .note` 的 color 复选框，文字会变为后面 note 的颜色。DevTools 的临时改动不会写回 VS Code，刷新通常就消失。

## 两种常见问题与排查顺序

### 情况一：选择器根本没有命中
HTML 写 `class="note"`，CSS 却写 `#note`，后者寻找 id，不是类。检查 Styles 是否出现你的规则；完全不出现要先检查选择器或样式文件地址，不要加 !important。也检查 CSS 的分号、冒号和花括号，不要把 HTML 属性语法写成 CSS 声明。

### 情况二：属性被覆盖或值无效
如果规则存在但 color 被划掉，找到竞争声明并比较条件；如果值写成不存在的单位或拼错属性，浏览器可能忽略该声明。先保留一条最小规则验证，然后恢复其他规则。不要用许多 id 和 !important 抢优先级，它们会让下一次修改更困难。继承颜色没有生效时，检查子元素自己的颜色是否已经指定。

## 变化练习

保持 HTML 不动，让 note 从蓝色变成棕色，同时仍然加粗；不使用 !important，不删除全部样式。用一种改动做到，再说明它为什么胜出。

### 参考答案

可以把已有 `.card .note` 的 color 改成 `#8e3b25`；也可以在后面增加同样的 `.card .note { color: #8e3b25; }`。后者选择器条件相同，靠顺序胜出。加粗由单独的 font-weight 声明决定，仍保留。再用 Computed 检查最终颜色，验证你的解释，而不是只看“差不多像棕色”。

## 本课自查

- .card .note 与 .card.note 分别选择谁？
- 为什么后写的 .note 颜色没覆盖两个类的选择器？
- color 败出时，同规则的 font-weight 会不会也失效？
- 浏览器 Styles 与 Computed 面板分别帮你回答什么？

能运行示例是起点，不等于已经学完。请先遮住参考答案，预测变化结果，再独立修改并记录实际结果。如果仍有问题，向AI提供目标、文件结构、自己的代码、具体操作、期待与实际结果、已尝试步骤；让它先定位最小问题，再自己验证修改。

## 继续查证

- [MDN：选择器优先级](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity)
- [MDN：层叠与继承](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Handling_conflicts)
- [MDN：自定义属性、继承与回退](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [W3C：文字对比要求](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
