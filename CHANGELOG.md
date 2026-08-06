# 更新日志

所有重要变更均会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.0.0] - 2026-08-06

### 新增

#### 核心功能
- 🎉 初始版本发布
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
