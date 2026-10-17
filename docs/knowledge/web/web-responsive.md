# 响应式与溢出定位：让真实内容适应空间

你的电脑看社团页面刚刚好，朋友的手机却需要左右拖动才能看全文。响应式不是把电脑页面截图缩小，而是在不同可用宽度下重新安排内容，仍让文字、操作和图片可读。本课提供长文件名与900px图片两种边界输入，学习从窄屏开始布局、在空间足够时增加列，并用证据定位超宽元素。先学盒模型和Grid，知道内距会减少容器可用内容宽。

## 把原理一步一步拆开

### 1. viewport 与 CSS宽度不是同一行代码
meta viewport 的 width=device-width 告诉移动浏览器按设备视口宽度布局，initial-scale=1 设置初始缩放。缺失时，移动浏览器可能使用较宽的布局视口，再缩小页面，造成文字很小。它不会自动把固定1000px元素改小；真正适应宽度仍需要CSS。本例page宽度100%、最大960px，padding纳入border-box预算，让窄屏也有留白。

#### 就地练习：viewport不修宽盒

已有viewport再放固定1000px盒，320px是否必然无横滚？

#### 参考核对：viewport不修宽盒

不保证；viewport设置布局视口，CSS仍要让真实盒适应空间。

### 2. 先一列，再依据内容增加列
默认单列意味着最窄空间先能读；720px媒体条件满足后改为两列。720是本例为两个内容面板选择的阈值，不是所有手机的标准分界。断点应根据内容放不放得下确定。缩放字体、增加标题长度后也要复测，因为“每台设备型号都试一个”不能覆盖所有内容变化。CSS媒体查询条件使用视口，容器宽度仍可能因为侧栏等变化而更小。

#### 就地练习：断点两边都测

以720为断点，写719、720、721的列数预期，再加长标题复测。

#### 参考核对：断点两边都测

默认单列、后两项两列；边界与内容都要测，断点不是所有手机的标准。

### 3. 图片缩放与裁剪是不同目标
本例img的max-width:100%与height:auto把图片限制在容器内，并保持原宽高比例，完整图片会缩小。若设计要求所有封面同样高，可以设置宽度100%、固定高度或aspect-ratio，再用object-fit:cover让图片内容填满图片盒，边缘可能被裁掉；object-fit:contain会完整显示内容，但可能留空白。object-fit调整的是图片内容怎样放进已经有尺寸的盒子，它不直接把一个900px宽的图片元素变成可响应的盒子，不能代替max-width或width规则。

#### 就地练习：整图还是填满

带重要文字的图片用cover可能损失什么？与contain比较。

#### 参考核对：整图还是填满

cover可能裁掉信息，contain完整显示但留白；两者不代替元素尺寸规则。

### 4. 长内容需要允许布局与文本分别收缩
Grid轨道用minmax(0,1fr)，panel用min-width:0，让盒子能缩；overflow-wrap:anywhere允许长无空格文字断行，让内容能收。普通段落已有空格或中文自然断点，仍不能据此认为所有输入安全。代码、表格和文件路径常有不同要求：代码可以单独横向滚动而不是整个页面滚动。不要给正文white-space:nowrap；它会禁止你需要的换行。

#### 就地练习：盒与文本分别收缩

长无空格文件名溢出时，分别指出minmax(0,1fr)、min-width:0、overflow-wrap负责什么。

#### 参考核对：盒与文本分别收缩

依次允许轨道、子项盒、文字内容收缩或换行，不能只裁整页。

### 5. 验收用实际视口与键盘
检查320、375、768、1280px等宽度，按Tab确认焦点可见、控件可操作，再把浏览器放大到200%看内容是否仍能阅读。DevTools设备模拟能帮助发现CSS问题，但不能证明所有真实触屏和屏幕阅读器体验。边界输入应包括最长标题、空结果、错误提示，不只首页最理想状态。

#### 就地练习：操作也在窄屏验收

320px放大200%后仅用Tab与Enter完成导航，记录实际焦点和内容是否裁切。

#### 参考核对：操作也在窄屏验收

仍需可读、焦点可见、控件可达；设备模拟不代替所有真实辅助技术测试。

### 6. px、rem、百分比和 vw 到底参照谁

“相对单位”不是一律相对手机屏幕。先说出参照物，才能预测数值。

| 写法 | 本课中的含义 | 可计算的例子 |
| --- | --- | --- |
| `16px` | 16个 CSS 像素，不直接等于16个显示器物理像素 | 页面缩放和设备像素比会影响物理显示 |
| `1rem` | 根元素 html 的字体大小的一倍 | 根字号为16px时，1rem=16px、2rem=32px |
| `width:100%` | 本例中父容器可用内容宽度的100% | 父内容宽288px，子元素width:100%得到288px；内距和边框还受box-sizing控制 |
| `5vw` | 布局视口宽度的5%，不是父卡片宽度的5% | 视口320px时是16px，768px时是38.4px |

rem 的参照是 html，不是当前元素的字号。例如 html 是16px，body 改为20px，卡片的 `padding:1rem` 仍为16px。默认根字号常为16px，但用户设置或你自己的 CSS 可以改变它；计算例子是假设条件，不能当作永远成立的常数。百分比的参照还会随属性变化，本表只说明本例的 width，不应推论所有高度、外距或定位百分比都用相同参照。文字行长里的 ch 则大致基于当前字体“0”的宽度，不是中文字符数量。

#### 就地练习：单位参照不同

根16、父容器288、视口320，分别算2rem、width100%、5vw。

#### 参考核对：单位参照不同

32px、288px、16px；百分比依属性与包含块定义，不统一相对屏幕。

### 7. clamp：把会变化的字号限制在区间内

第10课的 `font-size:clamp(28px,5vw,44px)` 有三个参数：最小允许值28px、希望随视口变化的值5vw、最大允许值44px。浏览器先算中间值，再将它限制在上下限之间。它不是随机挑一个数。

| 视口宽度 | 5vw 的值 | 最终字号 | 为什么 |
| --- | --- | --- | --- |
| 320px | 16px | 28px | 16小于下限，采用28 |
| 768px | 38.4px | 38.4px | 位于区间内，保留中间值 |
| 1280px | 64px | 44px | 64超过上限，采用44 |

给下方完整示例中现有的 style 区域**追加这条实验规则**，不要另建终端命令；保存刷新，再切换这三个宽度。右键页面主标题 → 检查 → Computed（计算值），搜索 font-size，核对上表。若另有 h1 规则覆盖它，先查看 Styles 的竞争声明。

```css
h1 {
  font-size: clamp(28px, 5vw, 44px);
  line-height: 1.2;
}
```

相对单位仍需要验收。很大的 vw 可能让窄屏文字太小，clamp 的下限可以避免本例这种收缩；固定上限、用户字号设置与浏览器缩放仍要实际检查。标题可变字号也不能代替容器换列、图片缩放和长词断行。完成实验后可以保留或删除该规则，原例的列断点仍是720px，两者控制的是不同事情。

#### 就地练习：clamp三段计算

对320、768、1280宽计算clamp(28px,5vw,44px)，再看Computed。

#### 参考核对：clamp三段计算

28px、38.4px、44px；先算中值再限制上下界。

## 在 VS Code 中创建、保存与运行

1. 在自己的练习目录里新建 `web-responsive` 文件夹，例如放在 `exercises/web/` 下；不要在 materials 原教材中覆盖文件。打开 VS Code，选择“文件 → 打开文件夹”，选中这个新文件夹。
2. 在左侧资源管理器用“新建文件”按下面清单创建文件。带 `/` 的名字表示子文件夹，例如 `assets/style.css` 需要 assets 文件夹，不能把斜杠当普通名字。逐个复制对应完整代码，Windows 用 Ctrl+S，macOS 用 Command+S 保存全部文件。
3. 在 VS Code 资源管理器中右键 index.html，选择“在文件资源管理器中显示”（macOS为Finder），然后双击该文件用浏览器打开。浏览器显示页面，VS Code负责编辑；不要只点编辑器的播放图标，也无需编译HTML。每次修改先保存，再回浏览器刷新。

文件清单：

- `index.html`
- `banner.svg`


## 完整可运行示例

### 完整文件：index.html

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>窄屏内容测试</title>
    <style>
    *{
      box-sizing:border-box
    }
    body{
      margin:0;
      font:1rem/1.7 sans-serif
    }.page{
      width:100%;
      max-width:960px;
      margin-inline:auto;
      padding:16px
    }.layout{
      display:grid;
      grid-template-columns:1fr;
      gap:16px
    }.panel{
      min-width:0;
      overflow-wrap:anywhere;
      padding:16px;
      border:1px solid #888
    }
    img{
      display:block;
      max-width:100%;
      height:auto
    }
    @media(min-width:720px){
      .layout{
        grid-template-columns:repeat(2,minmax(0,1fr))
      }
    }
    </style>
  </head>
  <body>
    <main class="page">
      <h1>窄屏内容测试</h1>
      <div class="layout">
        <section class="panel">
          <h2>长标题与长地址</h2>
          <p>this-is-a-very-long-filename-with-no-natural-breakpoint-for-a-small-screen.html</p>
        </section>
        <section class="panel">
          <h2>宽图片</h2>
          <img src="./banner.svg" alt="蓝色背景中的白色横幅：图片跟随容器缩放">
          <p>图片原宽 900，屏幕变窄时仍应完整可见。</p>
        </section>
      </div>
    </main>
  </body>
</html>
```

### 完整文件：banner.svg

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="300" viewBox="0 0 900 300"><rect width="900" height="300" fill="#164e80"/><rect x="80" y="100" width="740" height="100" fill="white"/></svg>
```

## 具体结果与解释

```output
720px以下两块内容上下排列，达到720px后并列。900px宽的蓝色图片缩小在面板内，白色横幅完整可见。长文件名换行；320px页面无横向整体滚动。
```

banner.svg是一张本地图片文件，你按代码保存即可，不需要下载素材。page管理总宽，layout管理列数，panel处理自身最小尺寸与长词，img处理图片本身。每一层负责一个问题，删去img的max-width后可能是图片超宽，删去panel的换行则可能是文本超宽。

在DevTools Elements定位图片，看Computed实际width与原始900px尺寸不同。再选panel看内容宽，注意左右padding已从可用宽度中扣除。试把两列断点改600px，观察文字每行是否过短；判断断点要根据内容阅读效果，不是追求更早变两列。

## 两种常见问题与排查顺序

### 情况一：屏幕外有内容，找不到哪个元素
在Console可以对照 `document.documentElement.scrollWidth` 与 `clientWidth` 判断页面是否整体超宽；再用Elements逐层选中可疑固定width、图片、nowrap与网格子项，看高亮边界。修复前记下视口、元素、最终宽度，修后用同样条件复测。不要用隐藏滚动条来冒充没有溢出。

### 情况二：图片被压扁或重要内容被裁掉
同时写死width和height而不处理比例可能拉伸图像。完整展示用height:auto；固定封面盒用object-fit并接受裁剪。人脸或文字封面若被cover裁掉，应调整object-position或选择contain，而不是以“都一样高”为唯一验收。alt仍需描述信息，不能把图片内容全靠裁剪后的视觉表达。

## 变化练习

为图片做一个高度180px的封面盒，先用contain，再用cover比较结果。记录哪种完整显示白色横幅、哪种可能裁掉边缘；保持手机没有整体溢出。

### 参考答案

给img添加 `width:100%;height:180px;object-fit:contain;`，保留max-width；contain完整显示900:300图片，盒子与图片比例不同会留空白。改为cover后内容填满180px高的盒子，多余宽度或高度被裁掉。两种都不是“错误”，要根据完整展示还是封面裁剪的需求选。若只想原图同比缩小，恢复height:auto即可。

## 本课自查

- viewport能否自动修复固定1000px元素？
- 为什么在窄屏先用一列？
- max-width与object-fit各改变什么？
- 你能找出是哪一个元素导致横向溢出并写下证据吗？
- 1rem、5vw和本例width:100%分别参照什么？
- 视口768px时clamp(28px,5vw,44px)为什么不是28或44px？

能运行示例是起点，不等于已经学完。请先遮住参考答案，预测变化结果，再独立修改并记录实际结果。如果仍有问题，向AI提供目标、文件结构、自己的代码、具体操作、期待与实际结果、已尝试步骤；让它先定位最小问题，再自己验证修改。

## 继续查证

- [MDN：响应式设计](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design)
- [MDN：object-fit](https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit)
- [MDN：CSS长度与参照单位](https://developer.mozilla.org/en-US/docs/Web/CSS/length)
- [MDN：clamp](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp)
