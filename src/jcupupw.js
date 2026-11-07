import styles from './styles/style.less';
import lolilotaStyles from './less/style.less';

const BUTTON_TYPES = new Set(['default', 'primary', 'danger']);
const SIZE_TYPES = new Set(['sm', 'md', 'lg', 'auto']);
const INPUT_TYPES = new Set(['text', 'password', 'number', 'email', 'tel', 'url', 'search']);
const TOAST_TYPES = new Set(['success', 'error', 'warning', 'info']);
const PLACEMENT_TYPES = new Set(['auto', 'center', 'top', 'bottom', 'left', 'right']);
const MIN_VISIBLE_PX = 60;
const ANCHOR_GAP = 10;
const VIEWPORT_MARGIN = 8;
const CLOSE_FALLBACK_MS = 700;

// 特殊参数：HTML 上设置 data-lolilota-css-start="start_byusi_bei"
// （同时兼容下划线写法 data-lolilota_css_start）时启用整站 lolilota 主题
const LOLILOTA_ATTR = 'data-lolilota-css-start';
const LOLILOTA_ATTR_UNDERSCORE = 'data-lolilota_css_start';
const LOLILOTA_VALUE = 'start_byusi_bei';
const LOLILOTA_CLASS = 'jc-lolilota-mode';

let idSeed = 0;

const createId = (prefix) => {
    idSeed += 1;
    return `${prefix}-${Date.now().toString(36)}-${idSeed.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
};

const warn = (...args) => console.warn('[JCuPupw]', ...args);

const readLolilotaFlag = (el) =>
    el?.getAttribute(LOLILOTA_ATTR) || el?.getAttribute(LOLILOTA_ATTR_UNDERSCORE) || '';

const isLolilotaMode = () => {
    if (typeof document === 'undefined') return false;
    return [document.documentElement, document.body]
        .some(el => readLolilotaFlag(el) === LOLILOTA_VALUE);
};

// anchor 支持元素或 CSS 选择器
const resolveAnchor = (anchor) => {
    if (!anchor) return null;
    if (typeof anchor === 'string') {
        try {
            return document.querySelector(anchor);
        } catch (e) {
            warn(`anchor 选择器 "${anchor}" 无效，已忽略:`, e);
            return null;
        }
    }
    if (typeof anchor.getBoundingClientRect === 'function') return anchor;
    return null;
};

class JCuPupw {
    static _instances = new Set();
    static _queue = [];
    static _showing = null;
    static _singleton = null;
    static _toastMaxCount = 5;
    static _triggerDelegationBound = false;
    static _intercepted = false;
    static _restore = null;
    static _nativeDialogs = null;
    static _interceptWarned = false;

    constructor(options = {}) {
        this.modalId = options.id || createId('jcModal');
        this.events = {};
        this.config = {};
        this._autoCloseTimer = null;
        this._dragHandler = null;
        this._dragCleanup = null;
        this._dragOffset = { x: 0, y: 0 };
        this._pendingResolves = [];
        this._abort = new AbortController();
        this._destroyed = false;
        this._closing = false;
        this._closingPromise = null;

        this._buildDOM();
        this.injectStyles();
        this.init();
        JCuPupw._instances.add(this);
    }

    _buildDOM() {
        const existing = document.getElementById(this.modalId);
        if (existing) {
            if (JCuPupw._findInstance(this.modalId)) {
                warn(`已存在使用 id "${this.modalId}" 的实例，其 DOM 将被替换。多实例请使用唯一 id。`);
            }
            existing.remove();
        }

        // 使用原生 <dialog>：role、aria-modal、焦点圈禁、页面 inert、Esc 关闭
        // 和关闭后的焦点还原都由浏览器负责，无需手写 JS。
        const modal = document.createElement('dialog');
        modal.id = this.modalId;
        modal.className = 'jc-modal';
        modal.innerHTML = `
            <div class="jc-modal__overlay"></div>
            <div class="jc-modal__container" tabindex="-1">
                <button type="button" class="jc-modal__close" aria-label="关闭">&times;</button>
                <h2 class="jc-modal__title">提示</h2>
                <div class="jc-modal__content">默认内容</div>
                <div class="jc-modal__actions"></div>
                <div class="jc-modal__loading">
                    <div class="jc-spinner"></div>
                </div>
            </div>
        `;

        this.modal = modal;
        this.overlay = modal.querySelector('.jc-modal__overlay');
        this.container = modal.querySelector('.jc-modal__container');
        this.modalTitle = modal.querySelector('.jc-modal__title');
        this.modalContent = modal.querySelector('.jc-modal__content');
        this.modalActions = modal.querySelector('.jc-modal__actions');
        this.modalLoading = modal.querySelector('.jc-modal__loading');

        // id 由用户传入时同样不能拼进 innerHTML，改用 DOM API 赋值
        const titleId = `${this.modalId}-title`;
        this.modalTitle.id = titleId;
        modal.setAttribute('aria-labelledby', titleId);

        (document.body || document.documentElement).appendChild(modal);
    }

    injectStyles() {
        if (!document.getElementById('jcPupwStyles')) {
            const style = document.createElement('style');
            style.id = 'jcPupwStyles';
            style.textContent = styles;
            document.head.appendChild(style);
        }
        this._syncLolilotaStyles();
    }

    // 命中特殊参数时注入整站 lolilota 主题（只注入一次）
    _syncLolilotaStyles() {
        if (!isLolilotaMode()) return false;

        document.documentElement.classList.add(LOLILOTA_CLASS);
        if (!document.getElementById('jcLolilotaStyles')) {
            const style = document.createElement('style');
            style.id = 'jcLolilotaStyles';
            style.textContent = lolilotaStyles;
            document.head.appendChild(style);
        }
        return true;
    }

    init() {
        // 监听器统一交给 AbortController 管理，destroy() 时一次 abort 即可全部清理
        this._listen(this.modal, 'click', (e) => {
            if (e.target.closest?.('.jc-modal__close')) {
                this.close();
                return;
            }
            if (e.target.classList.contains('jc-modal__overlay') && this.config.closeOnOverlay !== false) {
                this.close();
            }
        });

        // 原生 <dialog> 在按下 Esc 时派发 cancel 事件；这里拦截后走统一的 close() 流程，
        // 以便 beforeClose 等钩子仍然生效，同时避免浏览器直接关闭导致回调丢失。
        this._listen(this.modal, 'cancel', (e) => {
            e.preventDefault();
            if (this._closingPromise) return;
            if (this.config.closeOnEsc === false) return;
            this.close();
        });

        JCuPupw._ensureTriggerDelegation();

        // 视口尺寸变化时重新计算锚定位置
        this._listen(window, 'resize', () => {
            if (this.isOpen() && this.config.anchor) this._applyAnchorPlacement();
        });
    }

    _listen(target, type, handler, options = {}) {
        target.addEventListener(type, handler, { ...options, signal: this._abort.signal });
    }

    openFromTrigger(trigger) {
        const title = trigger.getAttribute('data-modal-title');
        const content = trigger.getAttribute('data-modal-content');
        const size = trigger.getAttribute('data-modal-size');
        const theme = trigger.getAttribute('data-modal-theme');
        const draggable = trigger.getAttribute('data-modal-draggable') === 'true';
        const placement = trigger.getAttribute('data-modal-placement');
        const easing = trigger.getAttribute('data-modal-easing');
        let buttons = null;

        // 触发器打开的弹窗默认跟随按钮定位；data-modal-anchor 可填 CSS 选择器改用其它锚点，
        // 设为 "false" 可回退到传统居中弹窗
        const anchorAttr = trigger.getAttribute('data-modal-anchor');
        let anchor = trigger;
        if (anchorAttr === 'false') {
            anchor = null;
        } else if (anchorAttr && anchorAttr !== 'true') {
            anchor = resolveAnchor(anchorAttr) || trigger;
        }

        const rawButtons = trigger.getAttribute('data-modal-buttons');
        if (rawButtons) {
            try {
                buttons = JSON.parse(rawButtons);
                if (!Array.isArray(buttons)) buttons = null;
            } catch (e) {
                warn('data-modal-buttons 解析失败，已忽略:', e);
            }
        }

        const config = { title, content, size, theme, draggable, placement, easing, anchor };
        if (buttons) {
            config.buttons = buttons.map(btn => ({
                text: btn?.text,
                type: btn?.type,
                close: btn?.close,
                action: () => {
                    const action = btn?.action;
                    if (action && typeof window[action] === 'function') {
                        window[action]();
                    }
                }
            }));
        }
        return this.open(config);
    }

    open(config = {}) {
        if (this._destroyed) {
            warn('实例已销毁，open() 调用被忽略');
            return Promise.resolve(false);
        }
        // 允许调用方在实例创建后才设置特殊参数
        this._syncLolilotaStyles();
        if (!config || typeof config !== 'object') config = { content: config };

        // 队列模式：已有其它弹窗在显示时排队，等当前关闭后再打开
        if (config.queue && JCuPupw._showing && JCuPupw._showing !== this) {
            return new Promise((resolve) => {
                JCuPupw._queue.push({ instance: this, config, resolve });
            });
        }

        // 正在关闭时等关闭动画结束再重新打开，避免状态互相覆盖
        if (this._closingPromise) {
            return this._closingPromise.then(() => this.open(config));
        }

        const wasOpen = this.isOpen();
        if (wasOpen) {
            // 幂等：已打开时只刷新内容，不重复 showModal、不重复触发 open 事件
            config = { ...this.config, ...config };
            // 上一次对话框遗留的 Promise 以默认值兜底，避免永久挂起
            this._resolvePending();
        }

        return new Promise((resolve) => {
            this._applyConfig(config);

            if (!wasOpen) {
                // 重置上一次拖拽留下的偏移与动画残留
                this._dragOffset = { x: 0, y: 0 };
                this.container.style.translate = '';
                this.container.style.removeProperty('animation');

                this.modal.classList.remove('jc-modal--closing');
                if (!this.modal.open) this.modal.showModal();
                this.modal.classList.add('jc-modal--active');
                if (typeof this.container.focus === 'function') this.container.focus();

                this.triggerEvent('open');
                try {
                    this.config.onOpen?.();
                } catch (e) {
                    console.error('[JCuPupw] onOpen 回调执行失败:', e);
                }
            }

            if (this.config.queue) JCuPupw._showing = this;

            // 弹窗已渲染后再测量尺寸，按触发元素位置做自动翻转与边界收敛
            this._applyAnchorPlacement();

            this._clearAutoClose();
            const { autoClose } = this.config;
            if (typeof autoClose === 'number' && autoClose > 0) {
                this._autoCloseTimer = setTimeout(() => this.close(), autoClose);
            }

            resolve(true);
        });
    }

    close() {
        if (this._destroyed) return Promise.resolve(false);
        // 关闭流程进行中时复用同一个 Promise，保证幂等
        if (this._closingPromise) return this._closingPromise;
        if (!this.isOpen()) return Promise.resolve(false);

        this._closing = true;
        const run = async () => {
            if (typeof this.config.beforeClose === 'function') {
                let result;
                try {
                    result = await this.config.beforeClose();
                } catch (e) {
                    warn('beforeClose 执行异常，已取消关闭:', e);
                    result = false;
                }
                if (result === false) return false;
            }

            if (!this.isOpen()) return false;

            this._clearAutoClose();
            // 若拖拽时禁用过动画，这里恢复，让关闭动画正常播放
            this.container.style.removeProperty('animation');
            this.modal.classList.add('jc-modal--closing');
            await this._waitForCloseAnimation();
            if (this._destroyed) return false;
            return this._finishClose();
        };

        const promise = run();
        this._closingPromise = promise;
        const cleanup = () => {
            this._closingPromise = null;
            this._closing = false;
        };
        promise.then(cleanup, cleanup);
        return promise;
    }

    _finishClose() {
        if (!this.modal || this._destroyed) return false;

        this.modal.classList.remove('jc-modal--closing');
        this.modal.classList.remove('jc-modal--active');

        this._teardownDrag();
        this._dragOffset = { x: 0, y: 0 };
        if (this.container) {
            this.container.classList.remove('jc-modal__container--dragging');
            this.container.classList.remove('jc-modal__container--anchored');
            this.container.classList.remove('jc-modal__container--from-anchor');
            delete this.container.dataset.placement;
            this.container.style.translate = '';
            this.container.style.removeProperty('--jc-from-x');
            this.container.style.removeProperty('--jc-from-y');
            this.container.style.removeProperty('animation');
            this.container.style.removeProperty('will-change');
            this.container.style.left = '';
            this.container.style.top = '';
            this.container.style.margin = '';
            this.container.style.transform = '';
        }

        // 原生 close() 会移出顶层、解除页面 inert，并把焦点还原到打开前的元素
        if (this.modal.open) this.modal.close();

        this._resolvePending();
        this.triggerEvent('close');
        try {
            this.config.onClose?.();
        } catch (e) {
            console.error('[JCuPupw] onClose 回调执行失败:', e);
        }

        if (this.config.queue && JCuPupw._showing === this) {
            JCuPupw._showing = null;
            JCuPupw._showNext();
        }
        return true;
    }

    _waitForCloseAnimation() {
        if (!this.modal) return Promise.resolve();
        return new Promise((resolve) => {
            let finished = false;
            const finish = () => {
                if (finished) return;
                finished = true;
                clearTimeout(fallback);
                this.modal?.removeEventListener('animationend', onEnd);
                this.modal?.removeEventListener('transitionend', onEnd);
                resolve();
            };
            const onEnd = (e) => {
                // 容器的退出动画 / 遮罩的淡出过渡，任一结束即视为关闭动画完成
                if (e.type === 'animationend' && e.target === this.container) finish();
                else if (e.type === 'transitionend' && e.target === this.overlay) finish();
            };
            // 降级兜底：动画事件未触发时（如系统开启"减弱动态效果"）按动画时长 + 冗余处理
            const fallback = setTimeout(finish, CLOSE_FALLBACK_MS);
            this.modal.addEventListener('animationend', onEnd);
            this.modal.addEventListener('transitionend', onEnd);
        });
    }

    _resolvePending() {
        const pending = this._pendingResolves;
        this._pendingResolves = [];
        pending.forEach((entry) => {
            try {
                entry.resolve(entry.defaultValue);
            } catch (e) {
                /* 忽略已兑现的 Promise */
            }
        });
    }

    _applyConfig(config) {
        const {
            title = '提示',
            content = '默认内容',
            buttons = [{ text: '确定' }],
            size,
            width,
            draggable = false,
            anchor,
            placement = 'auto',
            easing = 'nonlinear',
            autoClose,
            theme = 'auto',
            queue = false
        } = config;

        // 保留其余选项（closeOnOverlay / closeOnEsc / beforeClose / onOpen / onClose ...）
        this.config = {
            ...config,
            title,
            content,
            buttons,
            size,
            width,
            draggable,
            anchor,
            placement,
            easing,
            autoClose,
            theme,
            queue
        };

        this.setTitle(title);
        this.setContent(content);
        this._applySize(size, width);
        this._applyEasing(easing);
        this._applyTheme(theme);
        this._renderButtons(buttons);
        this._initDrag(draggable);
    }

    _clearAutoClose() {
        if (this._autoCloseTimer) {
            clearTimeout(this._autoCloseTimer);
            this._autoCloseTimer = null;
        }
    }

    _applySize(size, width) {
        ['sm', 'md', 'lg', 'auto'].forEach(s =>
            this.container.classList.remove(`jc-modal__container--${s}`));
        this.container.style.maxWidth = '';
        if (size) {
            if (SIZE_TYPES.has(size)) {
                this.container.classList.add(`jc-modal__container--${size}`);
            } else {
                warn(`未知的尺寸 "${size}"，已忽略`);
            }
        }
        if (width) {
            this.container.style.maxWidth = typeof width === 'number' ? `${width}px` : width;
        }
    }

    _applyEasing(easing) {
        if (!this.container) return;
        this.container.classList.toggle('jc-modal__container--linear', easing === 'linear');
    }

    _applyAnchorPlacement() {
        if (!this.container) return;

        const anchor = resolveAnchor(this.config.anchor);
        const placement = PLACEMENT_TYPES.has(this.config.placement) ? this.config.placement : 'auto';

        if (!anchor) {
            this.container.classList.remove('jc-modal__container--anchored', 'jc-modal__container--from-anchor');
            delete this.container.dataset.placement;
            this.container.style.left = '';
            this.container.style.top = '';
            this.container.style.removeProperty('--jc-from-x');
            this.container.style.removeProperty('--jc-from-y');
            return;
        }

        // center 模式保持默认居中布局，仅把按钮中心作为入场动画起点
        if (placement === 'center') {
            this.container.classList.remove('jc-modal__container--anchored');
            delete this.container.dataset.placement;
            this.container.style.left = '';
            this.container.style.top = '';
        } else {
            // 先切换到锚定布局再测量，保证读到的是收缩后的实际尺寸
            this.container.classList.add('jc-modal__container--anchored');
        }

        const width = this.container.offsetWidth;
        const height = this.container.offsetHeight;
        if (!width || !height) return;

        const rect = anchor.getBoundingClientRect();

        if (placement !== 'center') {
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const space = {
                top: rect.top - ANCHOR_GAP,
                bottom: vh - rect.bottom - ANCHOR_GAP,
                left: rect.left - ANCHOR_GAP,
                right: vw - rect.right - ANCHOR_GAP
            };

            const fit = {
                top: space.top >= height,
                bottom: space.bottom >= height,
                left: space.left >= width,
                right: space.right >= width
            };
            const opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
            const chooseAuto = () => {
                if (fit.bottom) return 'bottom';
                if (fit.top) return 'top';
                if (fit.right) return 'right';
                if (fit.left) return 'left';
                // 四周都放不下时选择空间更大的一侧，随后由边界收敛保证可见
                const vertical = space.bottom >= space.top ? ['bottom', space.bottom] : ['top', space.top];
                const horizontal = space.right >= space.left ? ['right', space.right] : ['left', space.left];
                return vertical[1] >= horizontal[1] ? vertical[0] : horizontal[0];
            };

            let direction = placement;
            if (direction === 'auto') {
                direction = chooseAuto();
            } else if (!fit[direction]) {
                // 指定方向放不下时先翻转到反方向，仍放不下再按 auto 选择最佳方向
                direction = fit[opposite[direction]] ? opposite[direction] : chooseAuto();
            }

            let left;
            let top;
            switch (direction) {
                case 'top':
                    top = rect.top - ANCHOR_GAP - height;
                    left = rect.left + rect.width / 2 - width / 2;
                    break;
                case 'left':
                    left = rect.left - ANCHOR_GAP - width;
                    top = rect.top + rect.height / 2 - height / 2;
                    break;
                case 'right':
                    left = rect.right + ANCHOR_GAP;
                    top = rect.top + rect.height / 2 - height / 2;
                    break;
                default:
                    top = rect.bottom + ANCHOR_GAP;
                    left = rect.left + rect.width / 2 - width / 2;
            }

            // 边界收敛：至少保留 VIEWPORT_MARGIN，避免弹窗被裁出视口
            const maxLeft = Math.max(VIEWPORT_MARGIN, vw - width - VIEWPORT_MARGIN);
            const maxTop = Math.max(VIEWPORT_MARGIN, vh - height - VIEWPORT_MARGIN);
            left = Math.min(Math.max(left, VIEWPORT_MARGIN), maxLeft);
            top = Math.min(Math.max(top, VIEWPORT_MARGIN), maxTop);

            this.container.dataset.placement = direction;
            this.container.style.left = `${Math.round(left)}px`;
            this.container.style.top = `${Math.round(top)}px`;
        }

        // 入场动画从按钮中心出发：记录按钮中心到弹窗最终中心的偏移
        this.container.classList.add('jc-modal__container--from-anchor');
        const centerX = this.container.offsetLeft + width / 2;
        const centerY = this.container.offsetTop + height / 2;
        const dx = rect.left + rect.width / 2 - centerX;
        const dy = rect.top + rect.height / 2 - centerY;
        this.container.style.setProperty('--jc-from-x', `${Math.round(dx)}px`);
        this.container.style.setProperty('--jc-from-y', `${Math.round(dy)}px`);
    }

    _applyTheme(theme) {
        if (theme === 'auto' || !theme) {
            delete this.modal.dataset.theme;
        } else {
            this.modal.dataset.theme = theme;
        }
    }

    _createButton(text, type, onClick) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'jc-modal__button';

        if (type != null && type !== '') {
            if (BUTTON_TYPES.has(type)) {
                button.classList.add(`jc-modal__button--${type}`);
            } else {
                warn(`未知的按钮类型 "${type}"，已忽略该类型`);
            }
        }

        // 按钮文字始终按纯文本渲染，杜绝 HTML / JS 注入
        button.textContent = text == null ? '' : String(text);
        if (onClick) button.addEventListener('click', onClick);
        return button;
    }

    _renderButtons(buttons) {
        this.modalActions.replaceChildren();
        const list = Array.isArray(buttons) ? buttons : [];
        list.forEach((btn) => {
            if (!btn || typeof btn !== 'object') return;
            const button = this._createButton(btn.text, btn.type, () => {
                try {
                    btn.action?.();
                } catch (e) {
                    console.error('[JCuPupw] 按钮回调执行失败:', e);
                }
                // close 默认为 true；action 内部主动关闭时由 close() 的防重入兜底
                if (btn.close !== false) this.close();
            });
            this.modalActions.appendChild(button);
        });
    }

    _initDrag(draggable) {
        this._teardownDrag();
        if (this._dragHandler) {
            this.modalTitle.removeEventListener('pointerdown', this._dragHandler);
            this._dragHandler = null;
        }
        this.modalTitle.classList.remove('jc-modal__title--draggable');
        if (!draggable) return;

        this.modalTitle.classList.add('jc-modal__title--draggable');
        this._dragHandler = (e) => this._startDrag(e);
        this.modalTitle.addEventListener('pointerdown', this._dragHandler);
    }

    _startDrag(e) {
        if (!this.isOpen() || this._closing || this._dragCleanup) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;

        e.preventDefault();
        this._dragOffset = this._dragOffset || { x: 0, y: 0 };
        const startX = e.clientX;
        const startY = e.clientY;
        const origin = { x: this._dragOffset.x, y: this._dragOffset.y };

        // 以拖拽起始位置为基准计算边界，避免拖拽过程中反复读取布局
        const rect = this.container.getBoundingClientRect();
        const base = {
            left: rect.left - this._dragOffset.x,
            top: rect.top - this._dragOffset.y,
            width: rect.width,
            height: rect.height
        };

        // 拖拽使用独立的 CSS translate 属性，与动画使用的 transform 互不覆盖
        this.container.classList.add('jc-modal__container--dragging');
        document.body.style.userSelect = 'none';

        const abort = new AbortController();
        const onMove = (ev) => {
            let x = origin.x + (ev.clientX - startX);
            let y = origin.y + (ev.clientY - startY);
            // 边界限制：弹窗不能被完全拖出视口
            x = Math.min(
                Math.max(x, MIN_VISIBLE_PX - base.width - base.left),
                window.innerWidth - MIN_VISIBLE_PX - base.left
            );
            y = Math.min(
                Math.max(y, MIN_VISIBLE_PX - base.height - base.top),
                window.innerHeight - MIN_VISIBLE_PX - base.top
            );
            this._dragOffset.x = x;
            this._dragOffset.y = y;
            this.container.style.translate = `${x}px ${y}px`;
        };
        const onUp = () => this._teardownDrag();

        document.addEventListener('pointermove', onMove, { signal: abort.signal });
        document.addEventListener('pointerup', onUp, { signal: abort.signal });
        document.addEventListener('pointercancel', onUp, { signal: abort.signal });

        this._dragCleanup = () => {
            abort.abort();
            document.body.style.userSelect = '';
            this.container?.classList.remove('jc-modal__container--dragging');
            this._dragCleanup = null;
        };
    }

    _teardownDrag() {
        if (this._dragCleanup) this._dragCleanup();
    }

    setTitle(title) {
        if (!this.modal) return this;
        this.modalTitle.textContent = title == null ? '' : String(title);
        return this;
    }

    setContent(content) {
        if (!this.modal) return this;
        if (typeof content === 'function') {
            // 函数形式：接收内容容器，可直接操作 DOM；有返回值时按字符串/节点继续处理
            const result = content(this.modalContent);
            if (result != null) this.setContent(result);
        } else if (typeof Node !== 'undefined' && content instanceof Node) {
            this.modalContent.replaceChildren(content);
        } else {
            this.modalContent.innerHTML = content;
        }
        return this;
    }

    addButton(text, action, type = 'default') {
        if (!this.modal) return this;
        const button = this._createButton(text, type, () => {
            try {
                action?.();
            } catch (e) {
                console.error('[JCuPupw] 按钮回调执行失败:', e);
            }
            this.close();
        });
        this.modalActions.appendChild(button);
        return this;
    }

    showLoading() { this.modalLoading?.classList.add('jc-modal__loading--active'); return this; }
    hideLoading() { this.modalLoading?.classList.remove('jc-modal__loading--active'); return this; }

    alert(config = {}) {
        const { title = '提示', content = '', type = 'primary', buttonText = '确定' } = config;
        return this.open({
            ...config,
            title,
            content,
            buttons: [{ text: buttonText, type, action: () => {} }]
        });
    }

    confirm(config = {}) {
        // 支持字符串简写：confirm('确定要执行吗？')
        if (typeof config === 'string') config = { content: config };
        const {
            title = '确认',
            content = '确定要执行此操作吗？',
            confirmText = '确定',
            cancelText = '取消'
        } = config;

        let settle;
        const promise = new Promise((resolve) => { settle = resolve; });

        this.open({
            ...config,
            title,
            content,
            buttons: [
                { text: cancelText, type: 'default', action: () => settle(false) },
                { text: confirmText, type: 'primary', action: () => settle(true) }
            ]
        }).then(() => {
            // 弹窗真正打开后再登记兜底，避免被上一次对话框的清理提前兑现
            if (this._destroyed || !this.isOpen()) {
                settle(false);
                return;
            }
            this._pendingResolves.push({ resolve: settle, defaultValue: false });
        }, () => settle(false));

        return promise;
    }

    prompt(config = {}) {
        const {
            title = '输入',
            content = '',
            placeholder = '',
            defaultValue = '',
            confirmText = '确定',
            cancelText = '取消',
            type = 'text',
            validate = null
        } = config;
        const inputType = INPUT_TYPES.has(type) ? type : 'text';

        // 使用原生 <form> 承载输入框：浏览器负责回车提交（隐式提交），无需监听 keydown。
        // novalidate 关闭原生校验气泡，改由 validate 统一给出可样式化的错误信息。
        const form = document.createElement('form');
        form.className = 'jc-modal__form';
        form.noValidate = true;

        if (typeof Node !== 'undefined' && content instanceof Node) {
            form.appendChild(content);
        } else if (content) {
            const label = document.createElement('div');
            label.style.marginBottom = '12px';
            label.innerHTML = String(content);
            form.appendChild(label);
        }

        const input = document.createElement('input');
        input.id = createId('jc-prompt');
        input.className = 'jc-modal__input';
        input.type = inputType;
        input.placeholder = placeholder == null ? '' : String(placeholder);
        input.value = defaultValue == null ? '' : String(defaultValue);

        const errorEl = document.createElement('div');
        errorEl.className = 'jc-modal__input-error';
        errorEl.hidden = true;

        form.appendChild(input);
        form.appendChild(errorEl);

        const showError = (message) => {
            errorEl.textContent = String(message);
            errorEl.hidden = false;
            input.classList.add('jc-modal__input--error');
        };
        const clearError = () => {
            errorEl.hidden = true;
            input.classList.remove('jc-modal__input--error');
        };

        let settle;
        const promise = new Promise((resolve) => { settle = resolve; });

        const submit = () => {
            const value = input.value;
            if (typeof validate === 'function') {
                let error = null;
                try {
                    error = validate(value);
                } catch (e) {
                    console.error('[JCuPupw] validate 执行失败:', e);
                    error = '校验失败，请重试';
                }
                // 校验不通过：保持弹窗打开，不关闭、不 resolve
                if (error) {
                    showError(error);
                    input.focus();
                    return;
                }
            }
            settle(value);
            this.close();
        };

        // 点击“确定”和表单提交（回车）走同一路径
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            submit();
        });
        input.addEventListener('input', clearError);

        this.open({
            ...config,
            title,
            content: form,
            buttons: [
                { text: cancelText, type: 'default', action: () => settle(null) },
                { text: confirmText, type: 'primary', close: false, action: submit }
            ]
        }).then(() => {
            if (this._destroyed || !this.isOpen()) {
                settle(null);
                return;
            }
            this._pendingResolves.push({ resolve: settle, defaultValue: null });
            input.focus();
            if (defaultValue) input.select();
        }, () => settle(null));

        return promise;
    }

    toast(config = {}) {
        const { content = '', type = 'info', duration = 3000, maxCount } = config;
        return JCuPupw._showToast(content, type, duration, maxCount);
    }

    static _findInstance(id) {
        for (const inst of JCuPupw._instances) {
            if (!inst._destroyed && inst.modalId === id) return inst;
        }
        return null;
    }

    // 触发器使用 document 事件委托：动态新增元素自动生效，多实例通过 data-modal-target 指定
    static _ensureTriggerDelegation() {
        if (JCuPupw._triggerDelegationBound) return;
        JCuPupw._triggerDelegationBound = true;
        document.addEventListener('click', (e) => {
            const target = e.target instanceof Element ? e.target : null;
            const trigger = target?.closest('.jc-modal-trigger');
            if (!trigger) return;

            const targetId = trigger.getAttribute('data-modal-target');
            let instance;
            if (targetId) {
                instance = JCuPupw._findInstance(targetId) || new JCuPupw({ id: targetId });
            } else {
                instance = JCuPupw._getSingleton();
            }
            if (!instance || instance._destroyed) return;
            instance.openFromTrigger(trigger);
        }, true);
    }

    static _showNext() {
        while (JCuPupw._queue.length > 0) {
            const item = JCuPupw._queue.shift();
            if (!item) continue;
            if (!item.instance || item.instance._destroyed) {
                item.resolve?.(false);
                continue;
            }
            item.instance.open({ ...item.config, queue: true }).then(item.resolve);
            return;
        }
    }

    static _getSingleton() {
        if (!JCuPupw._singleton || JCuPupw._singleton._destroyed) {
            JCuPupw._singleton = new JCuPupw({ id: 'jcModalSingleton' });
        }
        return JCuPupw._singleton;
    }

    static alert(config) { return JCuPupw._getSingleton().alert(config); }
    static confirm(config) { return JCuPupw._getSingleton().confirm(config); }
    static prompt(config) { return JCuPupw._getSingleton().prompt(config); }
    static toast(config) { return JCuPupw._getSingleton().toast(config); }

    static closeAll() {
        const promises = [];
        for (const inst of JCuPupw._instances) {
            if (!inst._destroyed && inst.isOpen()) promises.push(inst.close());
        }
        return Promise.all(promises);
    }

    static instance() { return JCuPupw._getSingleton(); }

    static isLolilotaMode() { return isLolilotaMode(); }

    static intercept() {
        if (JCuPupw._intercepted) return JCuPupw._restore;

        // 保存原生引用，restore() 时原样还原（而不是 delete 后依赖浏览器重建）
        JCuPupw._nativeDialogs = {
            alert: window.alert,
            confirm: window.confirm,
            prompt: window.prompt
        };
        const native = JCuPupw._nativeDialogs;

        window.alert = (message) => {
            try {
                return JCuPupw.alert({ content: String(message) });
            } catch (e) {
                console.error('[JCuPupw] intercepted alert failed:', e);
                // 出错时返回 undefined，避免降级到原生方法导致浏览器阻塞
                return undefined;
            }
        };
        window.confirm = (message) => {
            try {
                return JCuPupw.confirm({ content: String(message) });
            } catch (e) {
                console.error('[JCuPupw] intercepted confirm failed:', e);
                // 出错时返回 false，避免降级到原生方法导致浏览器阻塞
                return false;
            }
        };
        window.prompt = (message, defaultValue) => {
            try {
                return JCuPupw.prompt({ content: String(message), defaultValue: defaultValue ?? '' });
            } catch (e) {
                console.error('[JCuPupw] intercepted prompt failed:', e);
                // 出错时返回 null，避免降级到原生方法导致浏览器阻塞
                return null;
            }
        };

        if (!JCuPupw._interceptWarned) {
            JCuPupw._interceptWarned = true;
            warn('intercept() 已将 window.alert/confirm/prompt 改为异步返回 Promise，原有同步写法（如 if (confirm(...))）不再兼容。');
        }

        JCuPupw._intercepted = true;
        JCuPupw._restore = () => {
            window.alert = native.alert;
            window.confirm = native.confirm;
            window.prompt = native.prompt;
            JCuPupw._intercepted = false;
            JCuPupw._nativeDialogs = null;
            JCuPupw._restore = null;
        };
        return JCuPupw._restore;
    }

    static restore() {
        if (typeof JCuPupw._restore === 'function') {
            JCuPupw._restore();
        } else {
            warn('restore() called but not intercepted.');
        }
    }

    static _showToast(content, type, duration, maxCount) {
        const container = JCuPupw._getToastContainer();
        const limit = Number.isFinite(maxCount) && maxCount > 0 ? maxCount : JCuPupw._toastMaxCount;
        // 超出上限时立即移除最早的 Toast
        while (container.children.length >= limit) {
            container.firstElementChild.remove();
        }
        const toastType = TOAST_TYPES.has(type) ? type : 'info';
        const toast = document.createElement('div');
        toast.className = `jc-toast jc-toast--${toastType}`;
        toast.textContent = content == null ? '' : String(content);
        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('jc-toast--visible'));

        let closed = false;
        const remove = () => {
            if (closed) return;
            closed = true;
            toast.classList.remove('jc-toast--visible');
            toast.classList.add('jc-toast--leaving');
            setTimeout(() => toast.remove(), 300);
        };
        if (duration > 0) setTimeout(remove, duration);
        return { close: remove, el: toast };
    }

    static _getToastContainer() {
        let c = document.getElementById('jcToastContainer');
        if (!c) {
            c = document.createElement('div');
            c.id = 'jcToastContainer';
            c.className = 'jc-toast-container';
            c.setAttribute('aria-live', 'polite');
            (document.body || document.documentElement).appendChild(c);
        }
        return c;
    }

    // 可选：销毁所有 Toast（例如单页应用切页时清理残留提示）
    static clearToasts() {
        const container = document.getElementById('jcToastContainer');
        if (container) container.remove();
    }

    registerMethod(name, fn) { this[name] = fn.bind(this); }

    on(event, callback) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(callback);
    }

    triggerEvent(event, ...args) {
        if (!this.events[event]) return;
        this.events[event].forEach(callback => {
            try {
                callback(...args);
            } catch (e) {
                console.error(`[JCuPupw] "${event}" 事件回调执行失败:`, e);
            }
        });
    }

    isOpen() {
        return !this._destroyed && !!this.modal && this.modal.open && this.modal.classList.contains('jc-modal--active');
    }

    destroy() {
        if (this._destroyed) return;
        this._destroyed = true;

        this._clearAutoClose();
        this._teardownDrag();
        if (this._dragHandler && this.modalTitle) {
            this.modalTitle.removeEventListener('pointerdown', this._dragHandler);
            this._dragHandler = null;
        }

        // 一次性移除实例上的所有监听（含原生 dialog 的 click / cancel）
        this._abort.abort();

        // 未兑现的 confirm/prompt 以默认值兜底，避免调用方永久等待
        this._resolvePending();

        if (this.modal) {
            // 先 close() 退出顶层并触发原生焦点还原，再移除 DOM
            if (this.modal.open) this.modal.close();
            this.modal.remove();
        }

        JCuPupw._instances.delete(this);

        // 队列中的实例被销毁时，及时兑现其 open() 并移出队列
        if (JCuPupw._queue.some(item => item.instance === this)) {
            JCuPupw._queue = JCuPupw._queue.filter(item => {
                if (item.instance === this) {
                    item.resolve?.(false);
                    return false;
                }
                return true;
            });
        }

        if (JCuPupw._showing === this) {
            JCuPupw._showing = null;
            JCuPupw._showNext();
        }
        if (JCuPupw._singleton === this) JCuPupw._singleton = null;

        this.modal = null;
        this.container = null;
        this.overlay = null;
        this.modalTitle = null;
        this.modalContent = null;
        this.modalActions = null;
        this.modalLoading = null;
        this.events = {};
    }
}

export default JCuPupw;
