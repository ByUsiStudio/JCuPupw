# JCuPupw

轻量级浏览器弹窗（Modal / Dialog）库，支持自动注入 DOM 与样式，无需预置 HTML 结构。

## 特性

- **零依赖，轻量级** — 纯原生 JavaScript 实现
- **自动注入 CSS** — 打开即用，无需手动引入样式
- **主题切换** — 支持 `light` / `dark` / `auto`（跟随系统）
- **多格式产物** — UMD / ESM / CommonJS
- **Promise 化 API** — 所有操作均为异步，基于 `Promise`
- **触发器模式** — `data-*` 属性 + 事件委托自动绑定，支持动态元素与多实例指定
- **锚定定位** — 弹窗可跟随触发按钮弹出，`auto` 自动翻转并保持在视口内
- **安全渲染** — 按钮文本、`placeholder`、`defaultValue` 等按纯文本/属性处理，避免 XSS
- **快捷方法** — 内置 `alert` / `confirm` / `prompt` / `toast`
- **流畅拖拽** — GPU 加速的弹窗拖拽，支持多次拖拽累积偏移
- **尺寸控制** — 预设 `sm` / `md` / `lg` / `auto` 或自定义宽度
- **多弹窗管理** — 默认堆叠显示，支持队列模式依次展示
- **行为钩子** — `beforeClose` 拦截、`autoClose` 自动关闭等
- **无障碍支持** — 基于原生 `<dialog>`：焦点圈禁、页面 `inert`、Esc 关闭与焦点还原均由浏览器提供
- **原生能力优先** — CSS `:has()` 滚动锁、CSS `translate` 拖拽、原生 `<form>` 回车提交，减少 JS 逻辑
- **移动端适配** — 响应式设计，触摸友好
- **原生弹窗接管** — 一键替换 `window.alert`/`confirm`/`prompt`

## 快速上手

### ES Module

```javascript
import JCuPupw from 'jcupupw';

// 基础弹窗
const modal = new JCuPupw();
modal.open({
    title: '你好',
    content: '这是 JCuPupw 的基础用法',
    buttons: [
        { text: '取消', type: 'default' },
        { text: '确定', type: 'primary', action: () => console.log('确认') }
    ]
});
```

### 快捷方法（推荐）

```javascript
// 静态方法，无需实例化
await JCuPupw.alert({ title: '提示', content: '操作完成' });

// 确认对话框 — 返回 Promise<boolean>
const confirmed = await JCuPupw.confirm({
    title: '删除确认',
    content: '此操作不可恢复，确定删除吗？'
});
if (confirmed) {
    // 用户点击了"确定"
}

// 输入对话框 — 返回 Promise<string|null>
const name = await JCuPupw.prompt({
    title: '请输入昵称',
    placeholder: '请输入...',
    defaultValue: '游客'
});
console.log('用户输入:', name); // null 表示取消

// Toast 通知
JCuPupw.toast({ content: '保存成功', type: 'success' });
JCuPupw.toast({ content: '操作失败', type: 'error' });
```

### CommonJS

```javascript
const JCuPupw = require('jcupupw');
const modal = new JCuPupw();
```

### 浏览器（UMD）

```html
<script src="dist/jcupupw.umd.js"></script>
<script>
    // 全局变量 JCuPupw 可用
    JCuPupw.alert({ content: 'Hello!' });
</script>
```

### 触发器模式（零 JS 代码）

给元素添加 `.jc-modal-trigger` 类和 `data-modal-*` 属性即可自动绑定。触发器基于 `document` 事件委托实现，
动态插入的元素同样生效：

```html
<button class="jc-modal-trigger"
        data-modal-target="myModal"
        data-modal-title="确认删除"
        data-modal-content="删除后数据将不可恢复"
        data-modal-size="sm"
        data-modal-theme="dark"
        data-modal-draggable="true"
        data-modal-anchor="true"
        data-modal-placement="auto"
        data-modal-buttons='[{"text":"取消","type":"default"},{"text":"删除","type":"danger"}]'>
    删除
</button>
```

- `data-modal-target`：指定由哪个实例打开（值需与构造函数的 `id` 一致）。省略时使用全局单例。
  若指定的 id 尚无活跃实例，会自动创建一个。
- `data-modal-buttons`：JSON 数组，字段与 `buttons` 配置相同。
- `data-modal-anchor`：触发器打开的弹窗默认跟随按钮定位。设为 `"false"` 回退到居中弹窗；
  也可填 CSS 选择器，改用页面上的其它元素作为锚点。
- `data-modal-placement`：`auto` / `center` / `top` / `bottom` / `left` / `right`，默认 `auto`。
  `center` 表示弹窗最终居中，但入场动画仍从按钮位置放大飞入。
- `data-modal-easing`：`nonlinear`（默认，弹性）或 `linear`（匀速）。

## API 参考

### 构造函数

```javascript
new JCuPupw(options?)
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `id` | `string` | 自动生成（`jcModal-<时间戳>-<随机串>`） | 弹窗 DOM 节点的 ID。默认自动保证唯一；需要通过 `data-modal-target` 指定实例时请显式传入固定 id |

> 多次调用 `open()` 是幂等的：已打开时只刷新标题/内容/按钮等配置，不会重复锁定页面滚动，也不会重复触发 `open` 事件。

---

### 实例方法

#### `modal.open(config?)` → `Promise<boolean>`

打开弹窗，这是核心方法。

**config 选项：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | `'提示'` | 弹窗标题 |
| `content` | `string \| HTMLElement \| Function` | `'默认内容'` | 弹窗内容（HTML 字符串 / DOM 节点 / 接收内容容器的函数） |
| `buttons` | `Array` | `[{ text: '确定', action: () => close() }]` | 按钮配置数组 |
| `size` | `'sm' \| 'md' \| 'lg' \| 'auto'` | - | 预设尺寸 |
| `width` | `number \| string` | - | 自定义宽度（数字自动转 px） |
| `draggable` | `boolean` | `false` | 是否可拖拽标题栏 |
| `anchor` | `Element \| string` | - | 锚点元素或 CSS 选择器，弹窗跟随其位置弹出，并作为入场动画起点 |
| `placement` | `'auto' \| 'center' \| 'top' \| 'bottom' \| 'left' \| 'right'` | `'auto'` | 相对锚点的方向；`auto` 优先下方，空间不足时自动翻转；`center` 表示最终居中并从锚点飞入；指定方向放不下时也会翻转到反方向 |
| `easing` | `'nonlinear' \| 'linear'` | `'nonlinear'` | 动画时间曲线；`nonlinear` 在到位后轻微放大再回弹，`linear` 匀速且无回弹 |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | 主题类型 |
| `closeOnOverlay` | `boolean` | `true` | 点击遮罩是否关闭 |
| `closeOnEsc` | `boolean` | `true` | 按 ESC 是否关闭 |
| `beforeClose` | `Function \| Promise<boolean>` | - | 关闭前钩子，返回 `false` 阻止关闭 |
| `autoClose` | `number` | - | 毫秒数，到时自动关闭 |
| `queue` | `boolean` | `false` | 是否启用队列模式 |
| `onOpen` | `Function` | - | 打开完成回调 |
| `onClose` | `Function` | - | 关闭完成回调 |

> `content` 会作为 HTML 渲染（与 `innerHTML` 一致）。按钮文字、标题、`placeholder` 等其余字段按纯文本处理；
> 若 `content` 来自用户输入，请自行转义或传入纯文本 DOM 节点（`textContent`）。

**按钮对象结构：**

```typescript
{
    text: string,      // 按钮文字（始终按纯文本渲染，不会解析 HTML）
    type?: 'default' | 'primary' | 'danger',  // 样式类型，其它值会被忽略
    action?: () => void,  // 点击回调
    close?: boolean      // 点击后是否自动关闭（默认 true）
}
```

> 需要阻止关闭（例如表单校验失败）时，把 `close` 设为 `false`，并在校验通过后自行调用 `close()`。

---

#### 快捷对话框方法

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `modal.alert(config)` | `Promise<boolean>` | 单按钮警告框 |
| `modal.confirm(config \| string)` | `Promise<boolean>` | 双按钮确认框，返回 `true`/`false`（支持字符串简写 `confirm('消息')`） |
| `modal.prompt(config)` | `Promise<string \| null>` | 带输入框对话框，返回输入值或 `null` |
| `modal.toast(config)` | `{ close, el }` | 非模态 Toast 通知 |

**config 示例：**

```javascript
// confirm
const ok = await modal.confirm({
    title: '确认',
    content: '确定执行吗？',
    confirmText: '确定',
    cancelText: '取消'
});

// prompt — 输入框自动聚焦，回车键直接提交
const value = await modal.prompt({
    title: '输入',
    content: '请输入邮箱',
    placeholder: 'example@email.com',
    defaultValue: '',
    type: 'email',  // 'text' | 'password' | 'number' | 'email' | 'tel' | 'url' | 'search'
    validate: (v) => v.includes('@') ? null : '请输入有效的邮箱地址'  // 返回错误信息则阻止提交
});

// toast
modal.toast({
    content: '操作成功',
    type: 'success',  // 'success' | 'error' | 'warning' | 'info'
    duration: 3000,
    maxCount: 5  // 同屏最大数量（默认 5），超出自动移除最早的
});
```

> `validate` 返回错误信息时弹窗会保持打开并显示错误，只有校验通过才会 `resolve` 并关闭。

---

#### 其他实例方法

| 方法 | 说明 |
|------|------|
| `modal.close()` | 关闭当前弹窗，返回 `Promise<boolean>`（未打开或关闭被拦截时为 `false`） |
| `modal.setTitle(text)` | 动态设置标题（链式调用） |
| `modal.setContent(html)` | 动态设置内容 |
| `modal.addButton(text, action?, type?)` | 动态添加按钮 |
| `modal.showLoading()` | 显示加载动画 |
| `modal.hideLoading()` | 隐藏加载动画 |
| `modal.on(event, callback)` | 监听事件（`open` / `close`） |
| `modal.triggerEvent(event)` | 手动触发自定义事件 |
| `modal.registerMethod(name, fn)` | 动态注册自定义实例方法 |
| `modal.isOpen()` | 检查弹窗是否打开 |
| `modal.destroy()` | 销毁实例，清理 DOM 和事件 |

---

### 静态方法

| 方法 | 说明 |
|------|------|
| `JCuPupw.alert(config)` | 快捷 alert（使用单例） |
| `JCuPupw.confirm(config \| string)` | 快捷 confirm（使用单例） |
| `JCuPupw.prompt(config)` | 快捷 prompt（使用单例） |
| `JCuPupw.toast(config)` | 快捷 toast（使用单例） |
| `JCuPupw.instance()` | 获取全局单例实例 |
| `JCuPupw.closeAll()` | 关闭所有已打开的弹窗 |
| `JCuPupw.intercept()` | 接管 `window.alert`/`confirm`/`prompt` |
| `JCuPupw.restore()` | 恢复原生方法 |
| `JCuPupw.clearToasts()` | 移除所有 Toast 及容器 |

---

### 原生弹窗接管

一键将项目中所有原生 `alert`/`confirm`/`prompt` 替换为 JCuPupw 渲染的弹窗：

```javascript
// 启用接管
JCuPupw.intercept();

// 此后这些调用将使用 JCuPupw 渲染
window.alert('提示信息');       // → JCuPupw 渲染
const ok = await window.confirm('确定？');  // → Promise<boolean>
const val = await window.prompt('输入：');  // → Promise<string|null>

// 恢复原生
JCuPupw.restore();
```

> **重要提示**：原生 `confirm`/`prompt` 是**同步阻塞**的，而 JCuPupw 是异步的。接管后 `window.confirm()` 和 `window.prompt()` 将返回 **Promise**，调用方必须使用 `await` 或 `.then()`。**接管后原有同步写法（如 `if (confirm('...'))`，Promise 恒为真值）不再兼容**，首次接管会在控制台给出警告。

`restore()` 会把接管前保存的原生 `alert`/`confirm`/`prompt` 引用原样还原，不会删除 `window` 上的属性。

**降级保护**：如果 JCuPupw 内部发生错误，不会调用原生方法（避免浏览器阻塞），而是返回安全默认值（`alert` → `undefined`，`confirm` → `false`，`prompt` → `null`）。

## 使用示例

### 可拖拽弹窗

```javascript
modal.open({
    title: '可拖拽',
    content: '按住标题栏拖动此弹窗',
    draggable: true,
    size: 'md'
});
```

### 锚定到触发按钮

传入 `anchor` 即可让弹窗跟随按钮位置显示；`placement` 默认 `auto`，优先显示在按钮下方，
空间不足时自动翻转到上方，左右方向同理，最终位置会被限制在视口内。
入场动画会以按钮中心为起点，移动到目标位置并放大，关闭时再飞回按钮：

```javascript
button.addEventListener('click', (e) => {
    modal.open({
        title: '操作菜单',
        content: '这段弹窗会出现在按钮旁边',
        size: 'sm',
        anchor: e.currentTarget,
        placement: 'auto' // 可选：center / top / bottom / left / right
    });
});
```

`placement: 'center'` 会让弹窗最终停在屏幕中间，但动画仍从按钮位置飞入中间：

```javascript
modal.open({
    title: '居中弹窗',
    content: '从按钮位置飞到屏幕中间',
    anchor: e.currentTarget,
    placement: 'center'
});
```

所有弹窗（包含无锚点的普通弹窗）默认使用新的「边移动边缩放」弹出动画；
`easing` 可选 `nonlinear`（默认，到位后轻微放大再恢复）或 `linear`（匀速、无回弹）：

```javascript
modal.open({ title: '线性动画', content: '匀速弹出', easing: 'linear' });
```

触发器模式无需写 JS，弹窗默认跟随触发按钮定位：

```html
<button class="jc-modal-trigger"
        data-modal-placement="auto"
        data-modal-content="跟随按钮定位">点击
</button>
```

> 锚定模式下弹窗宽度按内容收缩（受 `size` / `width` 限制），窗口尺寸变化时会自动重新定位。
> 触发器可用 `data-modal-anchor="false"` 恢复居中显示；`open()` 仅在传入 `anchor` 时才锚定。

### 行为钩子

```javascript
modal.open({
    title: '重要操作',
    content: '此操作需要二次确认',
    closeOnOverlay: false,  // 禁用遮罩关闭
    closeOnEsc: false,      // 禁用 ESC 关闭
    beforeClose: async () => {
        // 返回 false 阻止关闭
        return await JCuPupw.confirm('确认要关闭吗？');
    },
    autoClose: 5000  // 5 秒后自动关闭
});
```

### 多弹窗堆叠

```javascript
// 同时打开多个弹窗（原生 dialog 顶层堆叠，后打开的显示在上层）
modal1.open({ title: '弹窗 1', content: '第一层' });
modal2.open({ title: '弹窗 2', content: '第二层' });
modal3.open({ title: '弹窗 3', content: '第三层' });

// 一键关闭所有
JCuPupw.closeAll();
```

### 队列模式

```javascript
// 依次显示，关闭一个才显示下一个
const queueConfig = { queue: true, size: 'sm' };
modal1.open({ title: '第 1 个', ...queueConfig });
modal2.open({ title: '第 2 个', ...queueConfig });  // 等待
modal3.open({ title: '第 3 个', ...queueConfig });  // 等待
```

### 主题切换

```javascript
modal.open({ title: '亮色', theme: 'light' });
modal.open({ title: '暗色', theme: 'dark' });
// 默认 'auto'：跟随系统 prefers-color-scheme
```

### 启用 lolilota 主题（特殊参数）

在 `html` 或 `body` 上设置特殊参数，即可让弹窗 UI 完全使用 `src/less` 编译出的整站主题：

```html
<html data-lolilota-css-start="start_byusi_bei">
```

启用后：

- 自动注入编译好的整站主题（`<style id="jcLolilotaStyles">`），并为 `html` 添加 `jc-lolilota-mode`
- 弹窗视觉完全由 `src/less` 的变量与 `components/_jculayer.less` 覆盖
- **按钮悬浮效果被禁用**：主题内按钮的 `:hover` 规则在构建期剔除，库自身的悬浮规则也由 `.jc-lolilota-mode` 守卫

也兼容下划线写法 `data-lolilota_css_start="start_byusi_bei"`，可用 `JCuPupw.isLolilotaMode()` 判断当前是否启用。

## 构建

```bash
# 安装依赖
npm install

# 构建（含 Rollup 打包 + JavaScript-Obfuscator 混淆 + UUID 版权头）
npm run build
```

产物位于 `dist/` 目录：

| 文件 | 格式 | 用途 |
|------|------|------|
| `jcupupw.umd.js` | UMD | 浏览器 `<script>` 全局引用 |
| `jcupupw.esm.js` | ESM | 现代打包工具 `import` |
| `jcupupw.cjs` | CommonJS | Node.js `require` |

每个产物顶部均包含版权声明、仓库地址、作者信息、许可证类型（AGPL-3.0）和唯一构建 UUID。

## 浏览器兼容

本版本优先使用浏览器原生能力，依赖以下特性：

| 能力 | 用途 | 最低版本 |
|------|------|----------|
| `<dialog>` + `showModal()` | 模态、焦点圈禁、页面 `inert`、Esc / `cancel` | Chromium 37 / Firefox 98 / Safari 15.4 |
| CSS `:has()` | 滚动锁（不修改 `body` 内联样式） | Chromium 105 / Firefox 121 / Safari 15.4 |
| CSS `translate` 独立属性 | 拖拽位移，与动画 `transform` 互不覆盖 | Chromium 104 / Firefox 72 / Safari 14.1 |

综合最低版本：**Chromium 105+ / Firefox 121+ / Safari 15.4+**。

## 测试

构建后直接用浏览器打开 [`tests/regression.html`](./tests/regression.html)（需先执行 `npm run build`），
页面会依次执行 110 项断言并输出 `SUMMARY: 110 passed, 0 failed`。测试覆盖 Issue #1 中列出的全部 10 类问题：

- 默认按钮只关闭一次 / `close` 防重入
- `prompt` `validate` 失败保持打开（点击确定与原生表单回车两条路径）
- 按钮文本、`placeholder`、`defaultValue` 的 XSS 转义
- 触发器事件委托、动态元素、`data-modal-target`
- 默认 `id` 唯一
- `intercept` / `restore` 原生引用
- `open` / `close` 幂等
- 滚动锁使用 CSS `:has()`，不影响 `body` 内联样式
- `destroy` 清理与 Promise 兜底
- 拖拽与打开动画互不覆盖（独立 `translate` 属性）
- 锚定定位：跟随触发元素、方向翻转、水平居中与关闭后样式清理
- 从按钮位置弹出的入场/退场动画（含 `center` 居中飞入模式）
- 指定方向空间不足时的自动翻转（如 `left` 翻转到 `right`）
- `linear` / `nonlinear` 动画时间曲线（非线性到位后有轻微放大的回弹）
- `lolilota_css_start` 特殊参数的主题注入、模式类与按钮悬浮禁用

同时覆盖原生 `<dialog>` 的模态状态、焦点圈禁与焦点还原、顶层堆叠、`cancel` 事件、遮罩关闭以及队列模式。

也可用无头浏览器执行：

```bash
msedge --headless=new --disable-gpu --virtual-time-budget=90000 \
  --dump-dom "file:///<项目绝对路径>/tests/regression.html"
```

## 项目结构

```
JCuPupw/
├── src/
│   ├── jcupupw.js      # 核心库源码（ESM）
│   ├── styles/         # 弹窗样式（LESS 拆分，构建期编译为字符串内联）
│   └── less/           # lolilota 整站主题（特殊参数启用时注入）
├── dist/               # 构建产物（UMD/ESM/CJS）
├── examples/
│   └── index.html      # 演示页面
├── tests/
│   └── regression.html # 回归测试页
├── scripts/
│   └── obfuscate.mjs   # 混淆脚本
├── rollup.config.js    # Rollup 配置
└── package.json
```

## 仓库

- **Gitee**：<https://gitee.com/byusistudio/jcupupw>
- **GitHub**：<https://github.com/ByUsiStudio/JCuPupw>
- **Codeberg**：<https://codeberg.org/ByUsiStudio/JCuPupw>

## 作者

北啊呢 \<177828525@qq.com\> — ByUsi Studio

## 许可证

本项目基于 [AGPL-3.0-or-later](./LICENSE) 许可开源。
