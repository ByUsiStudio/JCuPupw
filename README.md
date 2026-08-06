# JCuPupw

轻量级浏览器弹窗（Modal / Dialog）库，支持自动注入 DOM 与样式，无需预置 HTML 结构。

## 特性

- 🚀 零依赖，轻量级
- 🎨 自动注入 CSS 样式，支持明暗主题（跟随系统）
- 📦 多格式产物：UMD / ESM / CommonJS
- ⚡ Promise 化 API
- 🎯 触发器模式（`data-*` 属性自动绑定）
- 📱 移动端适配

## 使用

### ES Module

```javascript
import JCuPupw from 'jcupupw';

const modal = new JCuPupw();
modal.open({
    title: '提示',
    content: '这是弹窗内容',
    buttons: [
        { text: '取消', type: 'default' },
        { text: '确定', type: 'primary', action: () => console.log('确认') }
    ]
});
```

### CommonJS

```javascript
const JCuPupw = require('jcupupw');
const modal = new JCuPupw();
```

### 浏览器

```html
<script src="dist/jcupupw.umd.js"></script>
<script>
    const modal = new JCuPupw();
    modal.open({ title: '提示', content: 'Hello JCuPupw!' });
</script>
```

### 触发器模式

给元素添加 `.jc-modal-trigger` 类与 `data-modal-*` 属性即可自动绑定，无需手写 JS：

```html
<button class="jc-modal-trigger"
        data-modal-title="提示"
        data-modal-content="通过 data 属性自动触发"
        data-modal-buttons='[{"text":"确定","type":"primary"}]'>
    打开弹窗
</button>
```

## API

### `new JCuPupw(options)`

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `options.id` | string | `jcModal` | 弹窗 DOM 节点 ID |

### `modal.open(options)` → `Promise`

| 参数 | 类型 | 说明 |
|------|------|------|
| `title` | string | 标题 |
| `content` | string \| HTML | 内容（支持 HTML） |
| `buttons` | Array | 按钮配置 `{ text, type, action, close }` |
| `onOpen` | Function | 打开回调 |
| `onClose` | Function | 关闭回调 |

按钮 `type` 可选：`default` / `primary` / `danger`。

### 其他方法

| 方法 | 说明 |
|------|------|
| `modal.close()` | 关闭弹窗 |
| `modal.setTitle(text)` | 设置标题 |
| `modal.setContent(html)` | 设置内容 |
| `modal.addButton(text, action, type)` | 添加按钮 |
| `modal.showLoading()` / `modal.hideLoading()` | 显示 / 隐藏加载状态 |
| `modal.on(event, callback)` | 事件监听（`open` / `close`） |
| `modal.isOpen()` | 弹窗是否打开 |
| `modal.destroy()` | 销毁实例 |

## 构建

```bash
npm install
npm run build
```

产物位于 `dist/` 目录，均已混淆并附带版权头部：

| 文件 | 格式 | 用途 |
|------|------|------|
| `jcupupw.umd.js` | UMD | 浏览器 `<script>` 全局引用 |
| `jcupupw.esm.js` | ESM | 现代打包工具 `import` |
| `jcupupw.cjs` | CommonJS | Node.js `require` |

## 仓库

- Gitee：<https://gitee.com/byusistudio/jcupupw>
- GitHub：<https://github.com/ByUsiStudio/JCuPupw>
- Codeberg：<https://codeberg.org/ByUsiStudio/JCuPupw>

## 作者

北啊呢 \<177828525@qq.com\> — ByUsiStudio

## 许可证

[AGPL-3.0-or-later](./LICENSE)
