# JCuPupw

轻量级浏览器弹窗（Modal / Dialog）库，支持自动注入 DOM 与样式，无需预置 HTML 结构。

## 特性

- **零依赖，轻量级** — 纯原生 JavaScript 实现
- **自动注入 CSS** — 打开即用，无需手动引入样式
- **主题切换** — 支持 `light` / `dark` / `auto`（跟随系统）
- **多格式产物** — UMD / ESM / CommonJS
- **Promise 化 API** — 所有操作均为异步，基于 `Promise`
- **触发器模式** — `data-*` 属性自动绑定，零 JS 代码
- **快捷方法** — 内置 `alert` / `confirm` / `prompt` / `toast`
- **流畅拖拽** — GPU 加速的弹窗拖拽，支持多次拖拽累积偏移
- **尺寸控制** — 预设 `sm` / `md` / `lg` / `auto` 或自定义宽度
- **多弹窗管理** — 默认堆叠显示，支持队列模式依次展示
- **行为钩子** — `beforeClose` 拦截、`autoClose` 自动关闭等
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

给元素添加 `.jc-modal-trigger` 类和 `data-modal-*` 属性即可自动绑定：

```html
<button class="jc-modal-trigger"
        data-modal-title="确认删除"
        data-modal-content="删除后数据将不可恢复"
        data-modal-size="sm"
        data-modal-draggable="true"
        data-modal-buttons='[{"text":"取消","type":"default"},{"text":"删除","type":"danger"}]'>
    删除
</button>
```

## API 参考

### 构造函数

```javascript
new JCuPupw(options?)
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `id` | `string` | `'jcModal'` | 弹窗 DOM 节点的 ID（多实例时需唯一） |

---

### 实例方法

#### `modal.open(config?)` → `Promise<void>`

打开弹窗，这是核心方法。

**config 选项：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | `'提示'` | 弹窗标题 |
| `content` | `string` | `'默认内容'` | 弹窗内容（支持 HTML） |
| `buttons` | `Array` | `[{ text: '确定', action: () => close() }]` | 按钮配置数组 |
| `size` | `'sm' \| 'md' \| 'lg' \| 'auto'` | - | 预设尺寸 |
| `width` | `number \| string` | - | 自定义宽度（数字自动转 px） |
| `draggable` | `boolean` | `false` | 是否可拖拽标题栏 |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | 主题类型 |
| `closeOnOverlay` | `boolean` | `true` | 点击遮罩是否关闭 |
| `closeOnEsc` | `boolean` | `true` | 按 ESC 是否关闭 |
| `beforeClose` | `Function \| Promise<boolean>` | - | 关闭前钩子，返回 `false` 阻止关闭 |
| `autoClose` | `number` | - | 毫秒数，到时自动关闭 |
| `queue` | `boolean` | `false` | 是否启用队列模式 |
| `onOpen` | `Function` | - | 打开完成回调 |
| `onClose` | `Function` | - | 关闭完成回调 |

**按钮对象结构：**

```typescript
{
    text: string,      // 按钮文字
    type?: 'default' | 'primary' | 'danger',  // 样式类型
    action?: () => void,  // 点击回调
    close?: boolean      // 点击后是否自动关闭（默认 true）
}
```

---

#### 快捷对话框方法

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `modal.alert(config)` | `Promise<void>` | 单按钮警告框 |
| `modal.confirm(config)` | `Promise<boolean>` | 双按钮确认框，返回 `true`/`false` |
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

// prompt
const value = await modal.prompt({
    title: '输入',
    content: '请输入邮箱',
    placeholder: 'example@email.com',
    defaultValue: ''
});

// toast
modal.toast({
    content: '操作成功',
    type: 'success',  // 'success' | 'error' | 'warning' | 'info'
    duration: 3000
});
```

---

#### 其他实例方法

| 方法 | 说明 |
|------|------|
| `modal.close()` | 关闭当前弹窗（Promise） |
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
| `JCuPupw.confirm(config)` | 快捷 confirm（使用单例） |
| `JCuPupw.prompt(config)` | 快捷 prompt（使用单例） |
| `JCuPupw.toast(config)` | 快捷 toast（使用单例） |
| `JCuPupw.instance()` | 获取全局单例实例 |
| `JCuPupw.closeAll()` | 关闭所有已打开的弹窗 |
| `JCuPupw.intercept()` | 接管 `window.alert`/`confirm`/`prompt` |
| `JCuPupw.restore()` | 恢复原生方法 |

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

> **重要提示**：原生 `confirm`/`prompt` 是**同步阻塞**的，而 JCuPupw 是异步的。接管后 `window.confirm()` 和 `window.prompt()` 将返回 **Promise**，调用方必须使用 `await` 或 `.then()`。

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
// 同时打开多个弹窗（z-index 自动递增）
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

## 项目结构

```
JCuPupw/
├── src/
│   ├── jcupupw.js      # 核心库源码（ESM）
│   └── jcupupw.css     # 弹窗样式
├── dist/               # 构建产物（UMD/ESM/CJS）
├── examples/
│   └── index.html      # 演示页面
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
