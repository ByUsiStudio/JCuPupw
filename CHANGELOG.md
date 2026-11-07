# 更新日志

所有重要变更均会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.1.1] - 2026-11-07

本版本集中修复 [Issue #1](https://github.com/ByUsiStudio/JCuPupw/issues/1) 中汇总的 10 类稳定性、安全性与生命周期问题。

### 修复

#### 关闭流程与生命周期
- **默认按钮重复关闭**：默认按钮不再同时执行 `action` 与自动关闭两次，`close()` 增加防重入（进行中复用同一个 Promise），`onClose`、`close` 事件与页面滚动锁只生效一次
- **`open()` / `close()` 幂等**：重复 `open()` 只刷新内容，不重复 `showModal()`、不重复触发 `open` 事件；重复 `close()` 返回同一 Promise，不再重复播放动画或回调
- **滚动锁改为纯 CSS**：使用 `html:has(dialog.jc-modal[open]) { overflow: hidden; scrollbar-gutter: stable; }` 锁定滚动，不再读写 `body` 的 `overflow` / `padding-right` 内联样式，宿主页面样式零侵入
- **`destroy()` 清理完整**：使用 `AbortController` 一次性移除实例全部监听（含 `click` / `cancel`），并释放拖拽期间的 `pointermove` / `pointerup` / `pointercancel`、`body.user-select` 与队列；`destroy()` 时未兑现的 `confirm` / `prompt` 立即以默认值兜底
- **队列模式健壮性**：队列中的实例被销毁时及时兑现其 `open()` 并移出队列，避免队列卡死

#### 安全
- **XSS 修复**：按钮文字改用 `textContent` 渲染；按钮 `type` 仅允许 `default` / `primary` / `danger` 白名单；`prompt` 的 `placeholder`、`defaultValue` 通过 DOM 属性赋值；弹窗标题 id 不再拼接进 `innerHTML`
- `content` 仍然按设计支持 HTML，按钮、标题、属性等必须为纯文本的位置不再解析 HTML

#### prompt 校验
- **`validate` 失效修复**：确定按钮改为 `close: false`，校验失败时保持弹窗打开、显示错误且不 `resolve`；仅在校验通过后 `resolve(value)` 并关闭
- **原生表单提交**：输入框放入 `<form>`，回车由浏览器隐式提交触发 `submit` 事件，删除手写 `keydown` 监听；点击确定与回车共用同一套校验逻辑

#### 多实例与触发器
- **默认 id 唯一**：未传 `id` 时自动生成 `jcModal-<时间戳>-<随机串>`，多个实例不再互相删除 DOM
- **触发器改为事件委托**：动态插入的 `.jc-modal-trigger` 自动生效；新增 `data-modal-target` 指定实例（缺省使用全局单例）；实例销毁后触发器不再指向旧实例；新增 `data-modal-theme`
- 不再因第一个实例绑定了触发器而导致后续实例失效

#### 交互与原生能力
- **改用原生 `<dialog>`**：弹窗根节点由 `<div>` 改为 `<dialog>`，通过 `showModal()` 获得模态语义、焦点圈禁、页面 `inert`、顶层堆叠、Esc `cancel` 与关闭后焦点还原；删除手写 focus trap、全局 `keydown` 和 z-index 管理
- **拖拽与动画冲突**：打开动画移除 `forwards`，拖拽改用独立的 CSS `translate` 属性，与动画使用的 `transform` 互不覆盖；拖拽期间关闭 `transition`，消除拖影
- 拖拽偏移在关闭后正确重置，再次打开不会继承旧位置

#### 原生弹窗接管
- **`intercept()` / `restore()` 兼容性**：接管前保存原生 `alert` / `confirm` / `prompt` 引用，`restore()` 原样还原而非 `delete`；首次接管输出异步不兼容警告，并在文档中明确说明

### 新增
- `JCuPupw.clearToasts()`：移除所有 Toast 及容器
- `tests/regression.html`：覆盖 Issue #1 全部 10 类问题的浏览器回归测试（77 项断言），并覆盖原生 `<dialog>` 的模态状态、焦点圈禁 / 还原、顶层堆叠、`cancel`、遮罩关闭与队列模式

### 变更
- 版本号升级至 1.1.1
- 默认 `id` 由固定 `'jcModal'` 改为自动唯一 id（显式传入 `id` 时行为不变）
- 触发器未指定 `data-modal-target` 时使用全局单例打开（此前由第一个实例接管）
- `open()` 返回的 Promise 现在兑现 `true` / `false`（此前为 `void`）
- 弹窗根节点现在是原生 `<dialog>` 元素（`modal.modal instanceof HTMLDialogElement`），不再手动设置 `role="dialog"` / `aria-modal`
- 最低浏览器要求：Chromium 105+ / Firefox 121+ / Safari 15.4+（依赖 `<dialog>`、CSS `:has()`、`translate` 独立属性）

## [1.1.0] - 2026-10-06

### 新增

#### 无障碍（a11y）
- 弹窗容器添加 `role="dialog"`、`aria-modal="true"`、`aria-labelledby`
- 焦点圈禁（Focus Trap）：`Tab` / `Shift+Tab` 在弹窗内循环，不会逃逸到页面背景
- 焦点管理：打开时焦点移入弹窗，关闭后还原到打开前的元素
- 关闭按钮添加 `aria-label="关闭"`，Toast 容器添加 `aria-live="polite"`

#### prompt 增强
- 输入框自动聚焦，有默认值时自动全选
- 回车键直接提交
- 新增 `type` 选项：`text` / `password` / `number` / `email` / `tel` / `url` / `search`
- 新增 `validate` 校验函数：返回错误信息字符串时阻止提交并显示错误提示，输入时自动清除

#### content 类型扩展
- `open({ content })` / `setContent()` 除 HTML 字符串外，支持传入 DOM 节点（`HTMLElement`）或函数（接收内容容器，可直接操作 DOM）

#### 拖拽边界
- 弹窗不能被拖出视口，四周至少保留 60px 可见区域
- 可拖拽标题栏添加 `touch-action: none`，避免移动端拖拽与页面滚动冲突

#### 滚动锁定优化
- 锁定 `body` 滚动时补偿滚动条宽度，避免页面内容抖动
- 滚动锁改为引用计数管理，多弹窗堆叠时正确恢复页面滚动
- 弹窗容器添加 `overscroll-behavior: contain`，防止滚动穿透

#### Toast 上限
- 新增 `maxCount` 选项（默认 5），同屏超出上限时自动移除最早的 Toast

### 修复
- **`confirm()` / `prompt()` Promise 挂起**：通过 ESC、遮罩点击或关闭按钮关闭时 Promise 永不兑现，现在会以默认值兜底（`false` / `null`）；`destroy()` 时同样兜底
- **ESC 监听器泄漏**：每个实例都向 `document` 绑定 `keydown` 且 `destroy()` 不移除，改为类级别仅绑定一次
- **触发器 JSON 解析崩溃**：`data-modal-buttons` 格式错误时抛出未捕获异常，现在安全降级为空按钮列表并输出警告
- **关闭动画时长硬编码**：从固定 `setTimeout(500)` 改为监听 `animationend` / `transitionend`（保留 700ms 兜底，兼容"减弱动态效果"）
- **文档示例错误**：`beforeClose` 示例中 `JCuPupw.confirm('消息')` 传字符串不生效，现正式支持字符串简写

### 变更
- 版本号升级至 1.1.0

## [1.0.0] - 2026-08-06

### 新增

#### 核心功能
- 初始版本发布
- 基础弹窗功能：`open()` / `close()` 核心 API
- 自动 DOM 注入：无需预置 HTML 结构，打开即创建弹窗
- 自动 CSS 注入：内置样式自动加载，支持主题切换
- 多格式产物：UMD（浏览器全局）、ESM（`import`）、CJS（`require`）
- 零外部依赖，纯原生 JavaScript 实现

#### 交互与样式
- 支持点击遮罩关闭弹窗
- 支持 ESC 键关闭弹窗
- 移动端响应式适配
- 主题切换：`light` / `dark` / `auto`（跟随系统 `prefers-color-scheme`）

#### 快捷对话框方法
- `JCuPupw.alert()` — 单按钮警告对话框
- `JCuPupw.confirm()` — 双按钮确认对话框，返回 `Promise<boolean>`
- `JCuPupw.prompt()` — 带输入框对话框，返回 `Promise<string | null>`
- `JCuPupw.toast()` — 非模态 Toast 通知（支持 `success`/`error`/`warning`/`info` 四种类型）
- 同时提供静态方法（`JCuPupw.alert()`）和实例方法（`modal.alert()`）

#### 拖拽与尺寸
- 可拖拽弹窗（`draggable: true`），按住标题栏拖动
- GPU 加速拖拽：使用 `transform` + `will-change` 避免布局重排，流畅顺滑
- 预设尺寸：`sm`（320px）/ `md`（500px）/ `lg`（800px）/ `auto`（90%）
- 自定义宽度：`width` 选项支持数字（自动转 px）或字符串

#### 行为开关与钩子
- `closeOnOverlay` — 控制遮罩点击是否关闭（默认 `true`）
- `closeOnEsc` — 控制 ESC 键是否关闭（默认 `true`）
- `beforeClose` — 关闭前拦截钩子，支持同步返回 `false` 或 `Promise<false>` 阻止关闭
- `autoClose` — 倒计时自动关闭（毫秒数）

#### 多弹窗管理
- 堆叠模式：默认同时显示多个弹窗，`z-index` 自动递增
- 队列模式：`queue: true` 启用，依次显示，关闭一个才显示下一个
- `JCuPupw.closeAll()` — 一键关闭所有弹窗
- `JCuPupw.instance()` — 获取全局单例实例
- ESC 关闭仅作用于最顶层弹窗，避免误关

#### 原生弹窗接管
- `JCuPupw.intercept()` — 接管 `window.alert` / `window.confirm` / `window.prompt`
- `JCuPupw.restore()` — 恢复原生方法
- **注意**：接管后 `confirm` / `prompt` 返回 `Promise`，需用 `await` 接收
- 降级保护：JCuPupw 内部出错时返回安全默认值，不会阻塞浏览器

#### 触发器模式
- `.jc-modal-trigger` 类 + `data-modal-*` 属性自动绑定
- 支持 `data-modal-title` / `data-modal-content` / `data-modal-buttons`
- 支持 `data-modal-size` / `data-modal-draggable` 扩展属性
- 零 JS 代码即可绑定弹窗

#### 事件与扩展
- `modal.on('open'/'close', callback)` — 事件监听
- `modal.isOpen()` — 检查弹窗状态
- `modal.destroy()` — 销毁实例，清理 DOM 和事件监听
- `modal.showLoading()` / `modal.hideLoading()` — 加载状态
- `modal.setTitle()` / `modal.setContent()` / `modal.addButton()` — 动态修改
- `modal.registerMethod()` — 注册自定义实例方法

#### 构建与混淆
- Rollup 多格式打包（UMD / ESM / CJS）
- JavaScript-Obfuscator 代码混淆
- 产物顶部自动注入版权头（含仓库地址、作者、许可证、构建 UUID）
- 支持 PowerShell 环境 `npm run build` 直接执行

#### 文档与示例
- 完整 README.md API 文档
- `examples/index.html` 演示页面，覆盖所有功能
- AGPL-3.0-or-later 开源协议
- 三个仓库同步（Gitee / GitHub / Codeberg）

### 修复
- 修复 CJS 产物扩展名问题：`.cjs.js` → `.cjs`，确保 Node.js `require()` 正确识别
- 修复拖拽不流畅问题：改用 `transform` + `pointer` 事件 + GPU 合成
- 修复原生弹窗接管后恢复报错问题：移除降级到原生方法的逻辑，改为安全默认值
- 修复 ESC 批量关闭问题：改为仅关闭最顶层弹窗
- 修复堆叠弹窗 body `overflow` 不恢复问题：检查所有弹窗状态后再恢复
- 修复 `beforeClose` 拦截器不生效问题：正确处理同步/异步返回值

### 性能
- 拖拽从 `left/top` 改为 `transform`，避免布局重排，拖拽性能提升显著
- 添加 `will-change: transform` 提示浏览器使用 GPU 合成层
- 拖拽事件改用 `pointerdown` 替代 `mousedown`，支持触摸设备

### 变更
- 许可证从 MIT 更改为 AGPL-3.0-or-later
- CJS 产物文件扩展名从 `jcupupw.cjs.js` 改为 `jcupupw.cjs`
- `rollup-plugin-obfuscator` 改为独立后处理脚本 `scripts/obfuscate.mjs`
- 构建命令从 `rollup -c` 改为 `rollup -c && node scripts/obfuscate.mjs`
