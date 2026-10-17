# 表单、键盘与真实反馈：把“填了”与“提交了”分清

报名表单不仅要有漂亮输入框，还要回答“这个框填什么”“哪里出错”“是否真的交上去了”。本课做本地信息检查：用户填写称呼与邮箱，浏览器和脚本检查输入，再给出明确反馈。示例没有后端、不发请求、不保存个人信息，因此通过时只说明本地检查通过。前置是HTML标签与基础CSS；JavaScript事件的完整解释可继续看DOM主题。

## 把原理一步一步拆开

### 1. label、id、name 各有职责
label的for与input的id对应，让点击文字也能聚焦输入框，并给辅助技术提供输入名称。name用于表单数据的字段名，id用于在页面内定位，并不自动决定后端字段。placeholder只是暂时提示，输入后会消失，不能替代可见标签。required表达必填，标签同时写“必填”让用户不必尝试失败才知道要求。

#### 就地练习：标签和提交名

保留id/for，只删name，再比较点击标签与提交字段。

#### 参考核对：标签和提交名

标签仍聚焦，缺name的字段通常不提交；placeholder不替代可见label。

### 2. 原生类型与校验先处理基本错误
type=email为邮箱格式提供基础校验，required阻止空值，maxlength限制称呼长度。邮箱格式合法不代表邮箱存在，也不证明属于当前用户。仅空格的称呼通常能通过required，因为它不是空字符串，所以脚本还需trim后判断。客户端校验改善输入体验，却可被绕过；真实应用的服务器必须重新检查，不能相信浏览器说通过就直接存数据库。

#### 就地练习：required不排纯空格

虚构称呼只输空格，说明原生required与trim校验各负责什么。

#### 参考核对：required不排纯空格

required判断非空值，纯空格仍需脚本业务校验；服务器也必须再查。

### 3. submit 是表单行为，不只有按钮点击
用户按Enter也可能提交表单，所以监听form的submit比只监听按钮click更符合输入流程。事件触发时，原生约束已先参与判断；不合法时浏览器通常阻止提交事件并提示。示例event.preventDefault阻止默认导航/提交，然后执行本地检查。非提交按钮明确type=button；否则form内button常默认是submit，可能让“清空”意外触发提交。

#### 就地练习：Enter也能提交

分别鼠标点提交与在输入框按Enter，确认统一经过form submit处理。

#### 参考核对：Enter也能提交

监听表单行为而非只点按钮，preventDefault阻止默认导航；普通操作按钮写type=button。

### 4. 反馈、焦点与状态变化要对应
空格称呼时反馈解释问题并把焦点送回称呼框；通过时文本明确“尚未提交或保存”。反馈role=status让辅助技术有机会感知变化，但不是替代可见文字。用户修改后，旧通过状态应撤销，提示重新检查。清空按钮只清空本地输入，并把焦点回到起点，避免用户找不到下一步。清空个人练习输入与清空整个学习进度不是同一操作。

#### 就地练习：修改后撤销旧通过

先本地检查通过，再编辑输入；旧通过提示应怎样变化？

#### 参考核对：修改后撤销旧通过

提示重新检查，不能用旧结果代表新输入；本例也没有真实保存成功。

### 5. 键盘流程也是验收
Tab应按阅读顺序从称呼、邮箱到两个按钮；Shift+Tab返回；Enter提交；可见焦点让人知道当前在哪。不要使用正数tabindex重排，也不要把真正按钮换成没有键盘行为的div。移动端输入类型可能影响键盘，但仍要测试复制粘贴和长输入。

#### 就地练习：键盘完成全程

按Tab、Shift+Tab、Enter走完整表单，记录顺序和可见焦点。

#### 参考核对：键盘完成全程

按阅读顺序可达控件，不靠正tabindex重排，也不用div冒充有完整键盘行为的按钮。

### 6. disabled与正在处理状态
disabled控件一般不能交互，也通常从Tab序列和表单提交数据中排除；它不等于只读readonly。真实请求等待期间可以暂时禁用提交按钮防重复操作，同时显示“正在提交”，完成或失败后恢复操作。但没有明确理由就把必需字段disabled，键盘用户会跳过它且提交时没有该字段。本例不发送请求，所以无需伪造一个禁用等待阶段。

#### 就地练习：disabled和readonly

比较两种文本控件状态的交互和提交数据，不使用真实个人信息。

#### 参考核对：disabled和readonly

disabled通常不参与提交与Tab，readonly仍可能提交；等待期间禁用应有原因并恢复。

## 在 VS Code 中创建、保存与运行

1. 在自己的练习目录里新建 `web-forms` 文件夹，例如放在 `exercises/web/` 下；不要在 materials 原教材中覆盖文件。打开 VS Code，选择“文件 → 打开文件夹”，选中这个新文件夹。
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
    <title>本地报名信息检查</title>
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
    label,input{
      display:block
    }
    input{
      width:100%;
      padding:10px;
      margin-bottom:16px
    }
    button{
      padding:10px;
      white-space:normal
    }
    input:focus-visible,button:focus-visible{
      outline:3px solid #164e80;
      outline-offset:3px
    }
    </style>
  </head>
  <body>
    <h1>本地报名信息检查</h1>
    <p>本页只检查输入，不发送报名信息。</p>
    <form id="form">
      <label for="name">称呼（必填）</label>
      <input id="name" name="name" required maxlength="30">
      <label for="email">邮箱（必填）</label>
      <input id="email" name="email" type="email" required>
      <button type="submit">检查信息</button>
      <button type="button" id="reset-input">清空本地输入</button>
    </form>
    <p id="feedback" role="status">尚未检查。</p>
    <script>
    const form=document.querySelector('#form');
    const feedback=document.querySelector('#feedback');
    // 统一处理按钮与Enter触发的提交，之后只做本地校验，并未发送数据。
    form.addEventListener('submit',event=>{
      event.preventDefault();
      const name=document.querySelector('#name').value.trim();
      if(!name){
        feedback.textContent='称呼不能只包含空格。';
        document.querySelector('#name').focus();
        return;
      }
      feedback.textContent=`${name}，信息通过本地检查，尚未提交或保存。`;
    });
    form.addEventListener('input',()=>{
      feedback.textContent='输入已修改，请重新检查。';
    });
    document.querySelector('#reset-input').addEventListener('click',()=>{
      form.reset();
      feedback.textContent='本地输入已清空，未发送数据。';
      document.querySelector('#name').focus();
    });
    </script>
  </body>
</html>
```

## 具体结果与解释

```output
初始显示“尚未检查”。空称呼或明显不合格式的邮箱触发浏览器校验；称呼只含空格时出现明确文字错误。填写小林和 lin@example.com 后，显示“信息通过本地检查，尚未提交或保存”。
```

两个label与对应input建立关联，required和type=email让浏览器负责第一道校验。submit监听阻止真实提交，取称呼trim后补充空格边界检查，再用textContent显示结果。input监听撤销过期反馈；reset按钮调用form.reset恢复输入初值。本例没有默认value，因此恢复成空值，而不是清除浏览器所有状态。

清空按钮的 `id` 特意叫 `reset-input`，不要改成 `reset`。浏览器可以通过 `form.控件名` 找到表单里的控件，若某个控件的 id 或 name 是 reset，它会遮住本来的 `form.reset` 方法，点击后就可能报“form.reset is not a function”。这里的 reset-input 只是我们给按钮的标识，真正恢复表单初值的是 `form.reset()`。同样不要给控件随意取 `submit` 等原生方法名；字段名称与表单 API 是两套用途。

按完整顺序验收一次：先填写合法信息并检查，改一下称呼应立即撤销旧通过提示；点击清空，两框应变空、反馈应说明未发送数据，光标回到称呼。再填写只有空格的称呼与合法邮箱，检查后应拒绝；此时清空也应有效。页面不应跳转，地址栏不应出现姓名或邮箱参数，Network 不应新增报名请求。

先用鼠标点击“称呼”文字，确认光标进入输入框。再只用键盘完成整个表单。打开Network并提交合法信息，确认没有出现报名POST请求，反馈也没有说“报名成功”。这是诚实交互的证据，不是功能缺失被包装成成功。

## 两种常见问题与排查顺序

### 情况一：按清空却出现邮箱错误
检查清空按钮是否漏写type=button。默认submit会先走校验，导致清空监听看似失效。不要通过移除所有required解决，正确做法是区分按钮职责。

### 情况二：反馈写“成功”，刷新却什么都没有
检查是否真正实现服务器请求和存储；本地改DOM不等于保存。没有后端就明确标示演示。另一边界是原生email校验并不检查所有业务规则；称呼空格和超长业务文本需要应用检查。若真实请求失败，应保留输入、说明失败并允许重试，不能先清空再假定成功。

## 变化练习

增加“希望参加的活动”下拉框，默认空选项，要求用户选择HTML或CSS。让通过反馈包含所选活动，但继续明确未提交；用键盘验收。

### 参考答案

添加label与 `<select id="activity" name="activity" required><option value="">请选择</option><option value="HTML">HTML</option><option value="CSS">CSS</option></select>`，提交时读取select.value。默认空值会让required阻止通过。反馈可以写“HTML 信息通过本地检查，尚未提交或保存”。不要把选择活动后的反馈说成报名名额已经锁定。

## 本课自查

- id与name为什么不是同一职责？
- required为什么不能拦住只含空格的称呼？
- 按Enter与点击按钮为什么应统一走submit？
- 本地检查通过能证明数据保存或邮箱存在吗？

能运行示例是起点，不等于已经学完。请先遮住参考答案，预测变化结果，再独立修改并记录实际结果。如果仍有问题，向AI提供目标、文件结构、自己的代码、具体操作、期待与实际结果、已尝试步骤；让它先定位最小问题，再自己验证修改。

## 继续查证

- [MDN：客户端表单校验](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation)
- [MDN：label元素](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label)
- [MDN：disabled与提交数据](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/disabled)
- [MDN：reset 方法与同名控件遮蔽](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/reset)
