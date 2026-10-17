# JavaScript：先把输入、处理和输出分开

用户只有30分钟空闲，页面应筛出能在30分钟内完成的活动。这不是先给按钮写一串代码，而是先定义输入是什么、用什么规则处理、最后显示什么。本课先写一个计算函数，再接到数字输入框与按钮上。即使以后改成别的页面，这个函数仍能复用。前置是能运行完整HTML文件；代码放在body末尾的script中，由浏览器执行，不需要先安装Node或编译器。

## 把原理一步一步拆开

### 1. 字符串、数字、布尔值与空值
`'HTML'`是字符串，20是数字，`20<=30`产生布尔值true。输入框的value即使看起来是30，读出来仍是字符串，需要显式Number转换。`'30'+1`得到字符串'301'，`Number('30')+1`得到31。特别注意Number('')得到0，因此本例先检查原始输入是否空白，不能把空输入当作用户选择了0分钟。NaN表示数值转换没得到有效数字，Number.isFinite再过滤NaN与无穷值。

“没有内容”也要分开：`undefined` 常表示还没有赋值，或者读取了不存在的属性；`null` 通常是代码明确放入的“这里暂时没有值”；`''` 是已经存在的空字符串；`0` 是数字零。它们不等同。可以在浏览器 Console 逐行输入下面的观察代码，不要把它们贴进本例 HTML 的正文；重新练习时可刷新页面，避免重复声明同名变量。

```javascript
let waiting;
const emptySelection = null;
const emptyText = '';
const zeroMinutes = 0;
console.log(waiting);                 // undefined
console.log(emptySelection);          // null
console.log(emptyText.length);        // 0：字符串有长度，它恰好没有字符
console.log(zeroMinutes === 0);        // true：合法数字零
console.log({ title: 'HTML' }.hours);  // undefined：对象没有 hours 属性
```

`if` 会把条件转换成真假：`0`、`''`、null、undefined、NaN 会被当作假，而 `[]` 与 `{}` 会被当作真。所以不能仅写 `if (!limit)` 拒绝输入，它连合法的零分钟也会拒绝；也不能用 `if (titles)` 判断数组有没有项目，空数组仍为真。本例检查原始字符串、有限数字和范围，再用 `titles.length` 区分有结果与空结果。

#### 就地练习：合法零与空文字

对空串、0文字、abc分别先检查原串再Number，写出应接受还是拒绝。

#### 参考核对：合法零与空文字

空白拒绝，0可合法，abc转NaN拒绝；仅if(!limit)会误拒绝0。

### 2. 数组组织多个对象
activities是数组，每项对象包含title与minutes两个属性；`item.minutes`读取某项时长。数组顺序与对象属性职责不同：数组可以有第0项、第1项，对象则以字段名表达意义。const让activities这个变量不能重新绑定到别的数组，但不自动冻结数组内部；直接改某项title仍可能改变原数据。不要把const误解为深度不可变。

`let` 与 `const` 都是在声明变量，也就是为一个值起一个代码里能使用的名字。声明时用 `=` 把右边的值放到左边变量里。需要重新赋值时选 let；不需要重新绑定时优先 const。下面的代码只用于 Console 小实验：

```javascript
let practicedTimes = 0;
practicedTimes = practicedTimes + 1;
console.log(practicedTimes);  // 1：let 允许重新赋值
const activity = { title: 'HTML', minutes: 20 };
activity.title = 'HTML 入门';
console.log(activity.title);  // HTML 入门：修改对象内容不等于重新绑定变量
// activity = { title: 'CSS', minutes: 30 }; // 取消注释会报错：const 不允许重新绑定
```

变量名区分大小写：minutes 与 Minutes 是不同名字。函数或分支花括号中的 let/const 受所在作用域限制。本例按钮回调中的 raw、limit、titles 只在这一次回调内使用；页面数据 activities 定义在外面，回调可以读取它。第一次先明确“这个名字在哪儿声明、现在这行能不能访问它”，再学习更复杂的作用域规则。

#### 就地练习：绑定与对象内容

const活动对象修改title与给同名变量重新赋另一个对象，分别预测。

#### 参考核对：绑定与对象内容

可改原对象属性；重新赋const绑定报错，const不深度冻结。

### 3. filter挑选，map转换
filter对每个活动执行判断，返回true的项保留在新数组中，<=使刚好30分钟的CSS活动也被包含。map把每个保留对象转换成title字符串。二者返回新数组，不会因这两步直接删除原数组项，但新数组里若仍是对象引用，并非深度复制。排序sort会修改原数组，想保留原顺序时需先复制数组；本课没有排序，先把筛选规则讲清楚。

“回调函数”就是交给另一个函数、由它在约定时机调用的函数。filter 会遍历数组，对每一项调用你提供的函数；不需要你提前把每项传一遍。`item => item.minutes <= limit` 是箭头函数：箭头左边 item 是参数名，右边计算真假并把它返回。换成普通函数，作用可以写得更展开。下面这段可**替换完整示例中原有的 selectTitles 函数**，两种写法选一种，不要留下两个同名版本：

```javascript
function selectTitles(items, limit) {
  const kept = items.filter(function (item) {
    return item.minutes <= limit;
  });
  const titles = kept.map(function (item) {
    return item.title;
  });
  return titles;
}
```

调用 `selectTitles(activities, 30)` 时，filter 的实际过程如下。参数名 item 不神秘，它每次指向正在检查的那一项；limit 始终读取这次调用传入的30。

| 当前 item | 判断 | 回调返回 | filter 是否保留 |
| --- | --- | --- | --- |
| `{ title: 'HTML', minutes: 20 }` | 20 <= 30 | true | 保留 |
| `{ title: 'CSS', minutes: 30 }` | 30 <= 30 | true | 保留 |
| `{ title: 'Go', minutes: 40 }` | 40 <= 30 | false | 排除 |

kept 因而有两个对象。随后 map 对这两个对象各调用一次回调，取出 title，结果是 `['HTML', 'CSS']`。最终的 return 把这个数组交还调用者。连续写 `.filter(...).map(...)` 只是把两步接起来，不是让同一个回调同时负责两件事。

短箭头右边只有表达式时会自动返回它；改成花括号函数体后要写 return：`item => { return item.minutes <= limit; }`。若写成 `item => { item.minutes <= limit; }`，返回值变成 undefined，filter 会把所有项都排除。`() => { ... }` 的空括号表示这里不使用参数；按钮事件发生后浏览器才调用它。本课普通函数与箭头函数的等价比较只针对这些不使用 this 的小回调，不表示两种函数在所有语言规则上完全相同。

#### 就地练习：两步各交什么

30分钟筛选时写出filter保留对象和map返回标题，两步不要混成一份回调。

#### 参考核对：两步各交什么

filter留下20与30分钟对象，map再取HTML/CSS文字；漏return会改变结果。

### 4. 函数要明确参数与返回值
selectTitles(items,limit)的items是活动数组，limit是数字。函数返回标题数组，不读取输入框、不改页面、不发请求，这使它容易用固定输入核对。函数体里的return把结果交给调用者；console.log只是打印，不能替代return。把计算与DOM分开以后，错误可能来自转换、筛选或显示，每一步都能单独观察，而不是把所有问题叫作“按钮坏了”。

#### 就地练习：计算不碰页面

给selectTitles相同数组和limit重复调用，说明为何不应从DOM旧文字读取结果。

#### 参考核对：计算不碰页面

纯计算只依赖输入并返回值，便于独立核对；显示由调用方负责。

### 5. 分支与结果显示
if先拒绝空输入、非法数字与越界，再做计算。titles.length代表数量，join把多个标题拼成读得懂的一行。没有匹配时给空结果说明，不把空数组当异常。大括号、圆括号和比较符号都有语法意义；先格式化、看Console具体错误行，再修改。

先分清三个符号：`=` 赋值，`===` 比较两边的类型与值，`<=` 比较数值是否小于或等于。`raw === ''` 是在问“原始输入是不是空字符串”，没有修改 raw。`'30' === 30` 为 false，因为一边字符串、一边数字；`Number('30') === 30` 才为 true。`==` 可能先做隐式转换，例如 `0 == false` 为 true，而 `0 === false` 为 false。本课优先用严格比较并主动转换输入，减少“看上去像数字”造成的猜测。

`||` 表示这些条件中至少一个成立，`&&` 表示都成立，`!` 取反。示例的 `raw === '' || !Number.isFinite(limit) || limit < 0 || limit > 120` 因而是在列出任意一种要拒绝的情况。括号能帮助看清组合关系；不要把判断语句写成赋值，如 `if (raw = '')`，这会修改变量，而不是比较。

反馈里的反引号字符串叫模板字符串：`` `匹配 ${titles.length} 项` `` 会先计算 `${...}` 中的值，再放进文字。若长度是2，结果就是“匹配 2 项”。普通引号 `'匹配 ${titles.length} 项'` 不会进行这个替换。`titles.join('、')` 则把数组中的标题用顿号连成“HTML、CSS”。你也可以用字符串拼接写 `'匹配 ' + titles.length + ' 项：' + titles.join('、')`。

最后的 `条件 ? 成立时结果 : 不成立时结果` 叫条件表达式。本例使用 titles.length 作条件；非零时选匹配文字，零时选空结果说明。若还看不顺，可以将原例**最后一行 output.textContent 赋值**替换为下面的 if/else，其他代码保留，结果应相同：

```javascript
if (titles.length > 0) {
  output.textContent = `匹配 ${titles.length} 项：${titles.join('、')}`;
} else {
  output.textContent = '没有匹配活动。';
}
```

用30和0分别点击一次，验证两条分支。之后再读短写法，你应能把每个符号对应回相同的动作，而不只是记住整行代码。

#### 就地练习：临界值与空结果

依次用30、0、空白、abc测试输入，写出数量或错误提示。

#### 参考核对：临界值与空结果

30匹配2项，0无匹配，空白/abc拒绝；空数组是正常结果而非网络失败。

## 在 VS Code 中创建、保存与运行

1. 在自己的练习目录里新建 `web-js` 文件夹，例如放在 `exercises/web/` 下；不要在 materials 原教材中覆盖文件。打开 VS Code，选择“文件 → 打开文件夹”，选中这个新文件夹。
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
    <title>活动时长筛选</title>
    <style>
    *{
      box-sizing:border-box
    }
    body{
      font:1rem/1.7 sans-serif;
      max-width:36rem;
      margin:1rem auto;
      padding:1rem
    }
    input,button{
      max-width:100%;
      padding:8px
    }
    pre{
      white-space:pre-wrap;
      overflow-wrap:anywhere
    }
    </style>
  </head>
  <body>
    <h1>活动时长筛选</h1>
    <label for="limit">最多有几分钟（0—120）</label>
    <input id="limit" type="number" value="30" min="0" max="120">
    <button type="button" id="run">计算</button>
    <pre id="output" aria-live="polite">点击计算，查看筛选结果。</pre>
    <script>
    const activities=[{
      title:'HTML',minutes:20
    },{
      title:'CSS',minutes:30
    },{
      title:'Go',minutes:40
    }];
    // 纯计算不读取DOM；filter先选对象，map再把各项变成标题文字。
    function selectTitles(items,limit){
      return items.filter(item=>item.minutes<=limit).map(item=>item.title);
    }
    document.querySelector('#run').addEventListener('click',()=>{
      const raw=document.querySelector('#limit').value.trim();
      const limit=Number(raw);
      const output=document.querySelector('#output');
      if(raw===''||!Number.isFinite(limit)||limit<0||limit>120){
        output.textContent='请输入 0—120 之间的有限数字。';
        return;
      }
      const titles=selectTitles(activities,limit);
      output.textContent=titles.length?`匹配 ${titles.length} 项：${titles.join('、')}`:'没有匹配活动。';
    });
    </script>
  </body>
</html>
```

## 具体结果与解释

```output
输入30并点击计算，显示“匹配 2 项：HTML、CSS”；输入20显示一项HTML；输入0显示“没有匹配活动”；清空输入或输入超出0—120的值显示输入错误。
```

脚本第一行定义三个活动；第二步把筛选算法放入selectTitles；按钮监听读取输入、转换并检查；合法时调用函数，最后只在一处更新output。页面初次打开没有自动计算，结果区说明下一步，让用户知道需要点击按钮。

打开浏览器Console，输入 `selectTitles(activities,30)` 应看到两项标题数组；输入 `activities.length` 仍为3，证明筛选没有删原数据。再把<=改<，预测30时CSS会被排除，保存、刷新、验证。这种变化测试能揭示边界符号的重要性，不能只使用远离边界的20与40。

## 两种常见问题与排查顺序

### 情况一：数字被拼接成奇怪字符串
检查输入框value的类型，用Console的typeof观察，不要根据视觉形状判断。先trim检查空白，再转换，再检查有限数与业务范围；只调用Number而不做前后检查并不完整。type=number改善输入体验，但脚本与真实后端仍要验证数据。

### 情况二：函数算对了，页面仍然空
检查函数是否有return，调用处是否读取返回值，DOM选择器是否匹配。Console.log能看到值，不代表页面会自动显示。另一个边界是大小写：属性是minutes，写Minutes得到undefined，比较结果不会按期望工作。记录一条实际活动对象与函数输出，逐步定位错误，不要一次改三层。

## 变化练习

增加活动“测试”，时长30；把筛选上限设30，预测标题与数量。再要求只显示时长大于0且不超过上限的活动，加入0分钟项验证它被排除。

### 参考答案

新活动30满足<=30，所以结果变成HTML、CSS、测试，共3项。若要求排除0分钟，判断应为 `item.minutes>0 && item.minutes<=limit`。&&要求两个条件同时成立，不是写成 `0<item.minutes<=limit`，后者会先产生布尔值再进行下一次比较。保留原数组并增加边界项，核对过滤后的新数组。

## 本课自查

- value为什么需要转换，空字符串转换为什么危险？
- filter与map各返回什么？
- return与console.log有什么区别？
- const是否阻止对象属性被改？
- filter如何把数组每一项交给回调，带花括号的箭头函数为什么需要return？
- 为什么不能用if(!limit)拒绝非法输入，也不能用if(titles)判断数组是否非空？
- 你能把模板字符串和三元表达式各改写为更展开的形式吗？
- 刚好等于上限应怎样用例验证？

能运行示例是起点，不等于已经学完。请先遮住参考答案，预测变化结果，再独立修改并记录实际结果。如果仍有问题，向AI提供目标、文件结构、自己的代码、具体操作、期待与实际结果、已尝试步骤；让它先定位最小问题，再自己验证修改。

## 继续查证

- [MDN：JavaScript首步](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/A_first_splash)
- [MDN：filter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter)
- [MDN：Number.isFinite](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isFinite)
- [MDN：箭头函数](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)
- [MDN：严格相等](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Strict_equality)
- [MDN：模板字符串](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)
