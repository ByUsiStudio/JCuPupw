/// <reference lib="dom" />

/**
 * JCuPupw 类型声明
 *
 * 面向 TypeScript 使用者的调用接口。运行时实现见 `src/jcupupw.js`，
 * 用法保持与 README 中的 JavaScript 示例一致：
 *
 * ```ts
 * import JCuPupw from 'jcupupw';
 *
 * const modal = new JCuPupw({ id: 'myModal' });
 * await modal.open({ title: '你好', content: '这是 JCuPupw 的基础用法' });
 * ```
 */

/** 主题类型。`auto` 跟随系统 `prefers-color-scheme`。 */
export type JCuPupwTheme = 'light' | 'dark' | 'auto';

/** 弹窗预设尺寸。 */
export type JCuPupwSize = 'sm' | 'md' | 'lg' | 'auto';

/**
 * 相对锚点的弹出方向。
 * `auto` 优先下方，空间不足时自动翻转；`center` 最终居中，但入场动画仍从锚点飞入。
 */
export type JCuPupwPlacement = 'auto' | 'center' | 'top' | 'bottom' | 'left' | 'right';

/** 动画时间曲线。`nonlinear` 到位后轻微放大再回弹，`linear` 匀速且无回弹。 */
export type JCuPupwEasing = 'nonlinear' | 'linear';

/** 按钮样式类型，其它值会被忽略。 */
export type JCuPupwButtonType = 'default' | 'primary' | 'danger';

/** `prompt()` 输入框类型。 */
export type JCuPupwInputType = 'text' | 'password' | 'number' | 'email' | 'tel' | 'url' | 'search';

/** Toast 类型。 */
export type JCuPupwToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * 弹窗内容：
 * - `string`：按 HTML 渲染（等同 `innerHTML`），来自用户输入时请自行转义；
 * - `Node`：作为 DOM 节点插入；
 * - 函数：接收内容容器，可直接操作 DOM，有返回值时按字符串或节点继续处理。
 */
export type JCuPupwContent =
    | string
    | Node
    | ((container: HTMLElement) => string | Node | void | null);

/** 锚点：DOM 元素或 CSS 选择器。 */
export type JCuPupwAnchor = Element | string | null;

/** 构造函数参数。 */
export interface JCuPupwOptions {
    /**
     * 弹窗 DOM 节点的 id。
     * 默认自动生成并保证唯一；需要通过 `data-modal-target` 指定实例时请显式传入固定 id。
     */
    id?: string;
}

/** 按钮配置。 */
export interface JCuPupwButton {
    /** 按钮文字，始终按纯文本渲染，不会解析 HTML。 */
    text: string;
    /** 样式类型，其它值会被忽略。默认不添加类型类名。 */
    type?: JCuPupwButtonType;
    /** 点击回调。 */
    action?: () => void;
    /**
     * 点击后是否自动关闭，默认 `true`。
     * 需要阻止关闭（例如表单校验失败）时设为 `false`，并在校验通过后自行调用 `close()`。
     */
    close?: boolean;
}

/** `open()` 的配置项，也是其它快捷对话框方法的公共基础配置。 */
export interface JCuPupwConfig {
    /** 弹窗标题。默认 `'提示'`。 */
    title?: string;
    /** 弹窗内容，默认 `'默认内容'`。 */
    content?: JCuPupwContent;
    /** 按钮配置数组。默认 `[{ text: '确定' }]`。 */
    buttons?: readonly JCuPupwButton[];
    /** 预设尺寸。 */
    size?: JCuPupwSize;
    /** 自定义宽度，数字自动转换为 px。 */
    width?: number | string;
    /** 是否可拖拽标题栏。默认 `false`。 */
    draggable?: boolean;
    /** 锚点元素或 CSS 选择器，弹窗跟随其位置弹出，并作为入场动画起点。 */
    anchor?: JCuPupwAnchor;
    /** 相对锚点的方向。默认 `'auto'`。 */
    placement?: JCuPupwPlacement;
    /** 动画时间曲线。默认 `'nonlinear'`。 */
    easing?: JCuPupwEasing;
    /** 主题类型。默认 `'auto'`。 */
    theme?: JCuPupwTheme;
    /** 点击遮罩是否关闭。默认 `true`。 */
    closeOnOverlay?: boolean;
    /** 按 ESC 是否关闭。默认 `true`。 */
    closeOnEsc?: boolean;
    /**
     * 关闭前钩子。返回 `false`（或 resolve 为 `false`）时阻止关闭，
     * 其余返回值都视为允许关闭。
     */
    beforeClose?: () => boolean | void | Promise<boolean | void>;
    /** 毫秒数，到时自动关闭。 */
    autoClose?: number;
    /** 是否启用队列模式，多个弹窗依次展示。默认 `false`。 */
    queue?: boolean;
    /** 打开完成回调。 */
    onOpen?: () => void;
    /** 关闭完成回调。 */
    onClose?: () => void;
}

/** `open()` 的别名，语义更明确，二者完全等价。 */
export type JCuPupwOpenConfig = JCuPupwConfig;

/** 弹窗打开后实际生效的配置（默认值已完成归一化）。 */
export interface JCuPupwResolvedConfig extends JCuPupwConfig {
    title: string;
    content: JCuPupwContent;
    buttons: readonly JCuPupwButton[];
    placement: JCuPupwPlacement;
    easing: JCuPupwEasing;
    theme: JCuPupwTheme;
    draggable: boolean;
    queue: boolean;
}

/** `alert()` 配置。在公共配置上增加单按钮相关字段，按钮由库生成，因此不接受 `buttons`。 */
export interface JCuPupwAlertConfig extends Omit<JCuPupwConfig, 'buttons'> {
    /** 按钮文字。默认 `'确定'`。 */
    buttonText?: string;
    /** 按钮样式类型。默认 `'primary'`。 */
    type?: JCuPupwButtonType;
}

/** `confirm()` 配置。按钮文字由 `confirmText` / `cancelText` 指定，不接受 `buttons`。 */
export interface JCuPupwConfirmConfig extends Omit<JCuPupwConfig, 'buttons'> {
    /** 确认按钮文字。默认 `'确定'`。 */
    confirmText?: string;
    /** 取消按钮文字。默认 `'取消'`。 */
    cancelText?: string;
}

/** `prompt()` 配置。输入框与按钮由库生成，因此不接受 `buttons`。 */
export interface JCuPupwPromptConfig extends Omit<JCuPupwConfig, 'buttons'> {
    /** 输入框占位文字。 */
    placeholder?: string;
    /** 输入框初始值。 */
    defaultValue?: string;
    /** 确认按钮文字。默认 `'确定'`。 */
    confirmText?: string;
    /** 取消按钮文字。默认 `'取消'`。 */
    cancelText?: string;
    /** 输入框类型。默认 `'text'`，非法值回退为 `'text'`。 */
    type?: JCuPupwInputType;
    /**
     * 提交前校验。返回错误信息（真值）时保持弹窗打开并显示错误，
     * 只有校验通过才会关闭并 resolve 输入值。
     */
    validate?: (value: string) => string | null | undefined | void;
}

/** `toast()` 配置。 */
export interface JCuPupwToastConfig {
    /** 提示文字，按纯文本渲染。 */
    content?: string;
    /** Toast 类型。默认 `'info'`，非法值回退为 `'info'`。 */
    type?: JCuPupwToastType;
    /** 持续时间（毫秒）。默认 `3000`；设为 `0` 或负数时不自动移除。 */
    duration?: number;
    /** 同屏最大数量，默认 `5`，超出时自动移除最早的 Toast。 */
    maxCount?: number;
}

/** `toast()` 的返回值。 */
export interface JCuPupwToastHandle {
    /** 立即移除该 Toast。 */
    close(): void;
    /** Toast 的 DOM 节点。 */
    el: HTMLDivElement;
}

/** `open` / `close` 事件回调。 */
export type JCuPupwEventCallback = (...args: any[]) => void;

/** 事件名。除内置的 `open`、`close` 外，`triggerEvent()` 也接受自定义事件名。 */
export type JCuPupwEventName = 'open' | 'close' | (string & {});

/** 弹窗实例。 */
declare class JCuPupw {
    /**
     * 创建一个弹窗实例。
     *
     * 实例会立即创建 DOM 并注入样式，但只有调用 `open()` 时才会显示。
     * @param options 构造函数参数
     */
    constructor(options?: JCuPupwOptions);

    /** 弹窗 DOM 节点的 id。 */
    readonly modalId: string;

    /** 当前生效的配置（已完成默认值归一化）。 */
    config: JCuPupwResolvedConfig;

    /** 事件回调表，键为事件名。 */
    events: Record<string, JCuPupwEventCallback[]>;

    /** 弹窗根节点，原生 `<dialog>`；销毁后为 `null`。 */
    modal: HTMLDialogElement | null;
    /** 遮罩层。销毁后为 `null`。 */
    overlay: HTMLElement | null;
    /** 弹窗容器。销毁后为 `null`。 */
    container: HTMLElement | null;
    /** 标题元素。销毁后为 `null`。 */
    modalTitle: HTMLElement | null;
    /** 内容元素。销毁后为 `null`。 */
    modalContent: HTMLElement | null;
    /** 操作区元素。销毁后为 `null`。 */
    modalActions: HTMLElement | null;
    /** 加载遮罩元素。销毁后为 `null`。 */
    modalLoading: HTMLElement | null;

    /**
     * 打开弹窗，这是核心方法。
     *
     * 重复调用是幂等的：已打开时只刷新配置，不重复 `showModal()`，也不重复触发 `open` 事件。
     * @param config 弹窗配置，或直接传入内容字符串
     * @returns 弹窗完成打开后 resolve 为 `true`；实例已销毁时为 `false`
     */
    open(config?: JCuPupwConfig | string): Promise<boolean>;

    /**
     * 使用触发器元素上的 `data-modal-*` 属性打开弹窗。
     * 通常由库内部的事件委托调用，也可以手动调用。
     * @param trigger 带有 `data-modal-*` 属性的元素
     */
    openFromTrigger(trigger: Element): Promise<boolean>;

    /**
     * 关闭当前弹窗。
     * @returns 关闭成功为 `true`；未打开、实例已销毁或被 `beforeClose` 拦截时为 `false`
     */
    close(): Promise<boolean>;

    /** 动态设置标题，支持链式调用。 */
    setTitle(title: string): this;

    /** 动态设置内容，支持链式调用。 */
    setContent(content: JCuPupwContent): this;

    /** 动态添加按钮，支持链式调用。点击后会自动关闭弹窗。 */
    addButton(text: string, action?: () => void, type?: JCuPupwButtonType): this;

    /** 显示加载动画，支持链式调用。 */
    showLoading(): this;

    /** 隐藏加载动画，支持链式调用。 */
    hideLoading(): this;

    /** 单按钮警告框（使用当前实例）。 */
    alert(config?: JCuPupwAlertConfig): Promise<boolean>;

    /**
     * 双按钮确认框（使用当前实例）。
     * @param config 配置对象，或直接传入内容字符串
     * @returns 用户点击确认时为 `true`，取消或关闭时为 `false`
     */
    confirm(config?: JCuPupwConfirmConfig | string): Promise<boolean>;

    /**
     * 带输入框的对话框（使用当前实例）。
     * @returns 输入值；取消、关闭或实例销毁时为 `null`
     */
    prompt(config?: JCuPupwPromptConfig): Promise<string | null>;

    /** 非模态 Toast 通知（使用当前实例）。 */
    toast(config?: JCuPupwToastConfig): JCuPupwToastHandle;

    /** 动态注册自定义实例方法，注册后可通过 `modal[name](...)` 调用。 */
    registerMethod(name: string, fn: (this: JCuPupw, ...args: any[]) => any): void;

    /** 监听事件。内置事件为 `open` / `close`，也支持自定义事件名。 */
    on(event: 'open' | 'close', callback: () => void): void;
    on(event: JCuPupwEventName, callback: JCuPupwEventCallback): void;

    /** 手动触发事件，附加参数会原样传给回调。 */
    triggerEvent(event: JCuPupwEventName, ...args: any[]): void;

    /** 检查弹窗是否处于打开状态。 */
    isOpen(): boolean;

    /** 销毁实例，清理 DOM、事件监听与队列，并把未兑现的 `confirm` / `prompt` 以默认值兜底。 */
    destroy(): void;

    /** 快捷 alert（使用全局单例）。 */
    static alert(config?: JCuPupwAlertConfig): Promise<boolean>;

    /**
     * 快捷 confirm（使用全局单例）。
     * @param config 配置对象，或直接传入内容字符串
     */
    static confirm(config?: JCuPupwConfirmConfig | string): Promise<boolean>;

    /** 快捷 prompt（使用全局单例）。 */
    static prompt(config?: JCuPupwPromptConfig): Promise<string | null>;

    /** 快捷 toast（使用全局单例）。 */
    static toast(config?: JCuPupwToastConfig): JCuPupwToastHandle;

    /** 获取全局单例实例，不存在时自动创建。 */
    static instance(): JCuPupw;

    /** 关闭所有已打开的弹窗。 */
    static closeAll(): Promise<boolean[]>;

    /** 查询是否命中了 lolilota 主题特殊参数。 */
    static isLolilotaMode(): boolean;

    /**
     * 接管 `window.alert` / `confirm` / `prompt`。
     * @returns 恢复原生方法的函数；重复调用返回同一个函数
     */
    static intercept(): () => void;

    /** 恢复 `intercept()` 接管前的原生方法。 */
    static restore(): void;

    /** 移除所有 Toast 及其容器。 */
    static clearToasts(): void;
}

/** 弹窗实例的构造函数类型（含静态方法），主要用于 CommonJS 声明再导出。 */
export type JCuPupwConstructor = typeof JCuPupw;

export default JCuPupw;
