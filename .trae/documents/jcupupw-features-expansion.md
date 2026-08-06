# JCuPupw 功能扩展计划

## Context

JCuPupw 当前是一个轻量弹窗库，已实现基础 `open/close`、标题/内容设置、按钮、Loading、事件监听、触发器模式。用户希望扩展更多功能以接近主流弹窗库能力。本次扩展覆盖四个方向：快捷对话框方法、拖拽与尺寸控制、行为开关与钩子、多弹窗管理。

扩展遵循现有架构：单类 + BEM 命名 + CSS 变量主题，所有新功能通过 `open(config)` 选项与新增方法接入，保持向后兼容（现有 API 不变）。

## 设计决策

- **快捷方法**：同时提供实例方法与静态方法（`JCuPupw.alert()` 内部使用单例），静态方法更便于一行调用。
- **多弹窗**：默认堆叠（z-index 自动递增，可同时显示多个）；提供 `queue` 选项启用排队模式（一次只显示一个，其余等待）。
- **主题**：通过容器 `data-theme` 属性切换，复用现有 CSS 变量体系。
- **beforeClose**：支持同步返回 `false` 或 `Promise<boolean>` 拦截关闭。

## 实现方案

### 文件 1：`src/jcupupw.js`（主要改动）

#### 1.1 构造函数与状态管理
- 新增实例字段：`this.config = {}`（保存当前 open 配置，供事件处理读取）。
- 新增静态字段（类属性）：
  - `static _instances = new Set()` — 所有活跃实例，构造时 add、destroy 时 delete。
  - `static _zIndexBase = 1000` — z-index 基准，每次 open 递增。
  - `static _queue = []` — 排队模式下的待显示弹窗。
  - `static _showing = null` — 队列模式下当前显示的实例。
  - `static _singleton = null` — 快捷方法用的单例。

#### 1.2 `open(config)` 扩展
合并新选项到 config，写入 `this.config`：
- `size`：'sm' | 'md' | 'lg' | 'auto' → 设置 container 类 `jc-modal--{size}`。
- `width`：数字/字符串 → 直接设 `container.style.maxWidth`。
- `draggable`：boolean → 标题栏添加 `jc-modal__title--draggable` 类并绑定拖拽。
- `closeOnOverlay`（默认 true）、`closeOnEsc`（默认 true）。
- `beforeClose`：Function，关闭前调用。
- `autoClose`：number（毫秒）→ open 后 `setTimeout` 调 close。
- `theme`：'light' | 'dark' | 'auto'（默认 'auto'）→ 设 `modal.dataset.theme`。
- `queue`：boolean → 若为 true 且已有弹窗在显示，则入队等待。

z-index 堆叠：open 时 `this.modal.style.zIndex = ++JCuPupw._zIndexBase`。

#### 1.3 事件处理改造
`init()` 中的 click/keydown 处理改为读取 `this.config`：
- 遮罩点击：仅当 `this.config.closeOnOverlay !== false` 才关闭。
- ESC：仅当 `this.config.closeOnEsc !== false` 才关闭。

#### 1.4 `close()` 改造
- 开头检查 `beforeClose`：若返回 `false` 或 `Promise<false>` 则中止（return 已 resolve 的 Promise）。
- 关闭完成后，若处于队列模式，触发 `_showNext()`。

#### 1.5 拖拽实现
新增 `_initDrag()`：当 `draggable` 为 true 时绑定：
- `mousedown` on 标题栏 → 记录起始偏移，container 切换为 `position: fixed` + left/top（清除 margin auto）。
- `document.mousemove` → 更新 left/top。
- `document.mouseup` → 解绑 move/up。
- 防止选中文本（`user-select: none` 拖拽期间）。

#### 1.6 快捷对话框方法（实例 + 静态）

实例方法：
- `alert({ title, content, type })` → `Promise<void>`，单按钮确定。
- `confirm({ title, content })` → `Promise<boolean>`，取消/确定，按钮 action 中 resolve。
- `prompt({ title, content, placeholder, defaultValue })` → `Promise<string|null>`，content 内插入 `<input class="jc-modal__input">`，确定 resolve(值)，取消 resolve(null)。
- `toast({ content, type, duration })` → 独立非模态提示，默认 3s 自动消失，定位右上角。

静态方法（用单例 `JCuPupw._getSingleton()` 转发）：
- `JCuPupw.alert/confirm/prompt/toast(...)` 

#### 1.7 多弹窗静态方法
- `static closeAll()` — 遍历 `_instances` 调用每个实例的 close。
- `static instance()` — 返回全局单例（懒创建）。
- `static _enqueue(inst)` / `static _showNext()` — 队列管理。

#### 1.8 主题应用
`_applyTheme(theme)`：设 `this.modal.dataset.theme`，'auto' 时移除属性（交给 CSS 媒体查询）。

### 文件 2：`src/jcupupw.css`（样式扩展）

新增样式（复用现有变量与命名规范）：
- **尺寸**：`.jc-modal--sm { max-width: 320px }` / `--md { max-width: 500px }` / `--lg { max-width: 800px }` / `--auto { max-width: 90% }`。
- **拖拽**：`.jc-modal__title--draggable { cursor: move; user-select: none; }`。
- **主题**：`.jc-modal[data-theme="dark"] { --jc-text:#fff; --jc-background:#1e1e1e; --jc-border:#444; ... }`（手动覆盖，与媒体查询并存）。
- **输入框**：`.jc-modal__input { width:100%; padding:10px; border:1px solid var(--jc-border); border-radius:6px; font-size:14px; ... }`。
- **Toast**：全新块——
  - `.jc-toast` 定位 `fixed; top:20px; right:20px; z-index:9999`，卡片样式。
  - `.jc-toast--success/error/warning/info` 左边框色区分。
  - `.jc-toast` 进入动画 `jc-toast-in`，离开 `jc-toast-out`。
  - `@keyframes jc-toast-in / jc-toast-out`。

### 文件 3：`examples/index.html`（演示扩展）

新增演示区块：
- 快捷方法：alert / confirm（显示返回值）/ prompt（显示输入值）/ toast 四个按钮。
- 拖拽与尺寸：拖拽弹窗、sm/md/lg 尺寸切换按钮。
- 行为开关：禁用遮罩关闭、禁用 ESC、beforeClose 拦截、autoClose 倒计时、主题切换。
- 多弹窗：连续 open 三个（堆叠）、closeAll、单例。

## 验证方法

1. **构建**：`npm run build`，确认 Rollup + 混淆 + banner（含 Build ID UUID）正常，三种产物生成。
2. **加载验证**：`node -e "const J=require('./dist/jcupupw.cjs'); console.log(typeof J, typeof J.alert, typeof J.confirm, typeof J.prompt, typeof J.toast, typeof J.closeAll, typeof J.instance)"` 应均为 `function`。
3. **浏览器实测**：启动本地静态服务器（端口 8765），用 integrated_browser 打开 `http://localhost:8765/examples/index.html`：
   - 点击各按钮触发对应功能。
   - `browser_evaluate` 检查 `typeof JCuPupw.alert`、`JCuPupw._instances` 等。
   - 截图确认弹窗、toast、拖拽、尺寸、主题的视觉效果。
   - `browser_console_messages` 确认无报错（修复此前 `JCuPupw is not defined` 的路径问题——`index.html` 引用 `../dist/jcupupw.umd.js`，从 `/examples/` 访问会解析为 `/examples/dist/`，需改为 `/dist/jcupupw.umd.js` 绝对路径或 `../dist/`，验证时确认路径正确）。
4. **回归**：原有基础弹窗、触发器、Loading 演示仍正常工作。

## 关键文件

- [src/jcupupw.js](file:///d:/ByUsi/Projects/JCuPupw/src/jcupupw.js) — 核心逻辑扩展（主要工作量）
- [src/jcupupw.css](file:///d:/ByUsi/Projects/JCuPupw/src/jcupupw.css) — 样式扩展
- [examples/index.html](file:///d:/ByUsi/Projects/JCuPupw/examples/index.html) — 演示与修复脚本路径
- 构建链路（rollup.config.js / scripts/obfuscate.mjs）无需改动，banner 已自动注入。

## 向后兼容

所有新选项均有默认值，现有 `new JCuPupw().open({title, content, buttons})` 用法完全不变。新方法为纯增量。
