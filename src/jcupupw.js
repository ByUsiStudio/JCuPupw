import styles from './jcupupw.css';

class JCuPupw {
    static _instances = new Set();
    static _zIndexBase = 1000;
    static _queue = [];
    static _showing = null;
    static _singleton = null;
    static _toastMaxCount = 5;
    static _scrollLockCount = 0;
    static _globalListenersBound = false;

    constructor(options = {}) {
        this.modalId = options.id || 'jcModal';
        this.events = {};
        this.config = {};
        this._autoCloseTimer = null;
        this._dragHandler = null;
        this._pendingResolves = [];
        this._previouslyFocused = null;
        this._buildDOM();
        this.injectStyles();
        this.init();
        JCuPupw._instances.add(this);
    }

    _buildDOM() {
        const existing = document.getElementById(this.modalId);
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = this.modalId;
        modal.className = 'jc-modal';
        modal.innerHTML = `
            <div class="jc-modal__overlay"></div>
            <div class="jc-modal__container" role="dialog" aria-modal="true" aria-labelledby="${this.modalId}-title" tabindex="-1">
                <button type="button" class="jc-modal__close" aria-label="关闭">&times;</button>
                <h2 class="jc-modal__title" id="${this.modalId}-title">提示</h2>
                <div class="jc-modal__content">默认内容</div>
                <div class="jc-modal__actions"></div>
                <div class="jc-modal__loading">
                    <div class="jc-spinner"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        this.modal = modal;
        this.overlay = modal.querySelector('.jc-modal__overlay');
        this.container = modal.querySelector('.jc-modal__container');
        this.modalTitle = modal.querySelector('.jc-modal__title');
        this.modalContent = modal.querySelector('.jc-modal__content');
        this.modalActions = modal.querySelector('.jc-modal__actions');
        this.modalLoading = modal.querySelector('.jc-modal__loading');
    }

    injectStyles() {
        if (document.getElementById('jcPupwStyles')) return;
        const style = document.createElement('style');
        style.id = 'jcPupwStyles';
        style.textContent = styles;
        document.head.appendChild(style);
    }

    init() {
        this.modal.addEventListener('click', (e) => {
            if (e.target.closest('.jc-modal__close')) {
                this.close();
                return;
            }
            if (e.target.classList.contains('jc-modal__overlay')) {
                if (this.config.closeOnOverlay !== false) this.close();
            }
        });

        JCuPupw._ensureGlobalListeners();

        document.querySelectorAll('.jc-modal-trigger').forEach(trigger => {
            if (trigger._jcBound) return;
            trigger._jcBound = true;
            trigger.addEventListener('click', () => this.openFromTrigger(trigger));
        });
    }

    openFromTrigger(trigger) {
        const title = trigger.getAttribute('data-modal-title');
        const content = trigger.getAttribute('data-modal-content');
        let buttons = [];
        try {
            buttons = JSON.parse(trigger.getAttribute('data-modal-buttons') || '[]');
        } catch (e) {
            console.warn('[JCuPupw] data-modal-buttons 解析失败，已忽略:', e);
        }
        const size = trigger.getAttribute('data-modal-size');
        const draggable = trigger.getAttribute('data-modal-draggable') === 'true';

        this.open({
            title,
            content,
            size,
            draggable,
            buttons: buttons.map(btn => ({
                text: btn.text,
                type: btn.type,
                action: () => {
                    const action = btn.action;
                    if (action && typeof window[action] === 'function') {
                        window[action]();
                    }
                }
            }))
        });
    }

    open(config = {}) {
        return new Promise((resolve) => {
            if (config.queue && JCuPupw._showing && JCuPupw._showing !== this) {
                JCuPupw._queue.push({ instance: this, config, resolve });
                return;
            }

            this.config = config;
            const {
                title = '提示',
                content = '默认内容',
                buttons = [{ text: '确定', action: () => this.close() }],
                onOpen,
                onClose,
                size,
                width,
                draggable = false,
                autoClose,
                theme = 'auto',
                queue = false
            } = config;

            this.setTitle(title);
            this.setContent(content);
            this._applySize(size, width);
            this._applyTheme(theme);

            this.modalActions.innerHTML = buttons.map(btn => {
                const typeClass = btn.type ? `jc-modal__button--${btn.type}` : '';
                return `<button type="button" class="jc-modal__button ${typeClass}">${btn.text}</button>`;
            }).join('');

            this.modalActions.querySelectorAll('.jc-modal__button').forEach((btn, index) => {
                btn.addEventListener('click', () => {
                    buttons[index].action?.();
                    if (buttons[index].close !== false) this.close();
                });
            });

            this._initDrag(draggable);

            this.modal.classList.add('jc-modal--active');
            this.modal.style.zIndex = ++JCuPupw._zIndexBase;
            this._lockScroll();

            // 焦点管理：记住打开前的焦点元素，移入弹窗以便键盘操作
            this._previouslyFocused = document.activeElement;
            this.container.focus();

            if (queue) JCuPupw._showing = this;

            if (this._autoCloseTimer) clearTimeout(this._autoCloseTimer);
            if (autoClose && typeof autoClose === 'number') {
                this._autoCloseTimer = setTimeout(() => this.close(), autoClose);
            }

            this.triggerEvent('open');
            onOpen?.();
            resolve();
        });
    }

    close() {
        return new Promise(async (resolve) => {
            if (!this.isOpen()) { resolve(false); return; }

            if (typeof this.config.beforeClose === 'function') {
                let result;
                try { result = await this.config.beforeClose(); }
                catch (e) { result = false; }
                if (result === false) { resolve(false); return; }
            }

            if (this._autoCloseTimer) {
                clearTimeout(this._autoCloseTimer);
                this._autoCloseTimer = null;
            }

            this.modal.classList.add('jc-modal--closing');
            this._waitForCloseAnimation().then(() => {
                this.modal.classList.remove('jc-modal--closing');
                this.modal.classList.remove('jc-modal--active');
                this.container.style.left = '';
                this.container.style.top = '';
                this.container.style.margin = '';
                this.container.style.transform = '';
                this._dragOffset = { x: 0, y: 0 };
                this._unlockScroll();
                this._restoreFocus();
                this._resolvePending();
                this.triggerEvent('close');
                this.config.onClose?.();
                if (this.config.queue && JCuPupw._showing === this) {
                    JCuPupw._showing = null;
                    JCuPupw._showNext();
                }
                resolve(true);
            });
        });
    }

    _waitForCloseAnimation() {
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
            const fallback = setTimeout(finish, 700);
            this.modal.addEventListener('animationend', onEnd);
            this.modal.addEventListener('transitionend', onEnd);
        });
    }

    _restoreFocus() {
        const el = this._previouslyFocused;
        this._previouslyFocused = null;
        if (el && typeof el.focus === 'function') el.focus();
    }

    _resolvePending() {
        const pending = this._pendingResolves;
        this._pendingResolves = [];
        pending.forEach(p => p.resolve(p.defaultValue));
    }

    _lockScroll() {
        JCuPupw._scrollLockCount++;
        if (JCuPupw._scrollLockCount > 1) return;
        // 补偿滚动条宽度，避免锁定时页面内容抖动
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = 'hidden';
        if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    _unlockScroll() {
        JCuPupw._scrollLockCount = Math.max(0, JCuPupw._scrollLockCount - 1);
        if (JCuPupw._scrollLockCount > 0) return;
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    }

    _applySize(size, width) {
        ['sm', 'md', 'lg', 'auto'].forEach(s =>
            this.container.classList.remove(`jc-modal__container--${s}`));
        this.container.style.maxWidth = '';
        if (size) this.container.classList.add(`jc-modal__container--${size}`);
        if (width) {
            this.container.style.maxWidth = typeof width === 'number' ? `${width}px` : width;
        }
    }

    _applyTheme(theme) {
        if (theme === 'auto' || !theme) {
            delete this.modal.dataset.theme;
        } else {
            this.modal.dataset.theme = theme;
        }
    }

    _initDrag(draggable) {
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

        this.container.style.willChange = 'transform';
        document.body.style.userSelect = 'none';

        const MIN_VISIBLE = 60; // 视口内至少保留的可见像素
        const onMove = (ev) => {
            let x = origin.x + (ev.clientX - startX);
            let y = origin.y + (ev.clientY - startY);
            // 边界限制：弹窗不能被完全拖出视口
            x = Math.min(Math.max(x, MIN_VISIBLE - base.width - base.left), window.innerWidth - MIN_VISIBLE - base.left);
            y = Math.min(Math.max(y, MIN_VISIBLE - base.height - base.top), window.innerHeight - MIN_VISIBLE - base.top);
            this._dragOffset.x = x;
            this._dragOffset.y = y;
            this.container.style.transform = `translate(${x}px, ${y}px)`;
        };
        const onUp = () => {
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onUp);
            document.body.style.userSelect = '';
            this.container.style.willChange = '';
        };
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
    }

    setTitle(title) { this.modalTitle.textContent = title; return this; }
    setContent(content) {
        if (typeof content === 'function') {
            // 函数形式：接收内容容器，可直接操作 DOM；有返回值时按字符串/节点继续处理
            const result = content(this.modalContent);
            if (result != null) this.setContent(result);
        } else if (content instanceof Node) {
            this.modalContent.replaceChildren(content);
        } else {
            this.modalContent.innerHTML = content;
        }
        return this;
    }

    addButton(text, action, type = 'default') {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `jc-modal__button jc-modal__button--${type}`;
        button.textContent = text;
        button.addEventListener('click', () => {
            action?.();
            this.close();
        });
        this.modalActions.appendChild(button);
        return this;
    }

    showLoading() { this.modalLoading.classList.add('jc-modal__loading--active'); return this; }
    hideLoading() { this.modalLoading.classList.remove('jc-modal__loading--active'); return this; }

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
        return new Promise((resolve) => {
            // ESC / 遮罩 / 关闭按钮等非确认路径关闭时，兜底返回 false
            this._pendingResolves.push({ resolve, defaultValue: false });
            this.open({
                ...config,
                title,
                content,
                buttons: [
                    { text: cancelText, type: 'default', action: () => resolve(false) },
                    { text: confirmText, type: 'primary', action: () => resolve(true) }
                ]
            });
        });
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
        const inputType = ['text', 'password', 'number', 'email', 'tel', 'url', 'search'].includes(type) ? type : 'text';
        const inputId = `jc-prompt-${Date.now()}`;
        const label = content ? `<div style="margin-bottom:12px;">${content}</div>` : '';
        const html = `${label}<input id="${inputId}" class="jc-modal__input" type="${inputType}" placeholder="${placeholder}" value="${String(defaultValue).replace(/"/g, '&quot;')}" /><div class="jc-modal__input-error" hidden></div>`;
        return new Promise((resolve) => {
            this._pendingResolves.push({ resolve, defaultValue: null });

            const showError = (message) => {
                const errorEl = this.modalContent?.querySelector('.jc-modal__input-error');
                if (errorEl) {
                    errorEl.textContent = String(message);
                    errorEl.hidden = false;
                }
                document.getElementById(inputId)?.classList.add('jc-modal__input--error');
            };
            const clearError = () => {
                const errorEl = this.modalContent?.querySelector('.jc-modal__input-error');
                if (errorEl) errorEl.hidden = true;
                document.getElementById(inputId)?.classList.remove('jc-modal__input--error');
            };
            const submit = () => {
                const input = document.getElementById(inputId);
                const value = input ? input.value : null;
                if (typeof validate === 'function') {
                    const err = validate(value);
                    if (err) { showError(err); return; }
                }
                resolve(value);
            };

            this.open({
                ...config,
                title,
                content: html,
                buttons: [
                    { text: cancelText, type: 'default', action: () => resolve(null) },
                    { text: confirmText, type: 'primary', action: submit }
                ]
            }).then(() => {
                const input = document.getElementById(inputId);
                if (!input) return;
                input.addEventListener('input', clearError);
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        submit();
                    }
                });
                input.focus();
                if (defaultValue) input.select();
            });
        });
    }

    toast(config = {}) {
        const { content = '', type = 'info', duration = 3000, maxCount } = config;
        return JCuPupw._showToast(content, type, duration, maxCount);
    }

    static _getTopInstance() {
        let top = null;
        let maxZ = -1;
        for (const inst of JCuPupw._instances) {
            if (!inst.isOpen()) continue;
            const z = parseInt(inst.modal.style.zIndex || 0, 10);
            if (z > maxZ) { maxZ = z; top = inst; }
        }
        return top;
    }

    // 类级别只绑定一次全局键盘监听，避免多实例重复绑定导致泄漏
    static _ensureGlobalListeners() {
        if (JCuPupw._globalListenersBound) return;
        JCuPupw._globalListenersBound = true;
        document.addEventListener('keydown', (e) => {
            const top = JCuPupw._getTopInstance();
            if (!top) return;
            if (e.key === 'Escape') {
                if (top.config.closeOnEsc === false) return;
                top.close();
            } else if (e.key === 'Tab') {
                top._trapFocus(e);
            }
        });
    }

    _trapFocus(e) {
        if (!this.container) return;
        const focusables = this.container.querySelectorAll(
            'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
        );
        const visible = [...focusables].filter(el => el.offsetWidth > 0 || el.offsetHeight > 0);
        if (visible.length === 0) {
            e.preventDefault();
            this.container.focus();
            return;
        }
        const first = visible[0];
        const last = visible[visible.length - 1];
        // 焦点在弹窗外或已到边界时循环，其余情况交给浏览器默认行为
        if (e.shiftKey && (document.activeElement === first || !this.container.contains(document.activeElement))) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && (document.activeElement === last || !this.container.contains(document.activeElement))) {
            e.preventDefault();
            first.focus();
        }
    }

    static _showNext() {
        if (JCuPupw._queue.length === 0) return;
        const { instance, config, resolve } = JCuPupw._queue.shift();
        instance.open({ ...config, queue: true }).then(resolve);
    }

    static _getSingleton() {
        if (!JCuPupw._singleton) {
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
            if (inst.isOpen()) promises.push(inst.close());
        }
        return Promise.all(promises);
    }

    static instance() { return JCuPupw._getSingleton(); }

    static intercept() {
        if (JCuPupw._intercepted) return JCuPupw._restore;

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

        JCuPupw._intercepted = true;
        JCuPupw._restore = () => {
            delete window.alert;
            delete window.confirm;
            delete window.prompt;
            JCuPupw._intercepted = false;
            JCuPupw._restore = null;
        };
        return JCuPupw._restore;
    }

    static restore() {
        if (typeof JCuPupw._restore === 'function') {
            JCuPupw._restore();
        } else {
            console.warn('[JCuPupw] restore() called but not intercepted.');
        }
    }

    static _showToast(content, type, duration, maxCount) {
        const container = JCuPupw._getToastContainer();
        const limit = Number.isFinite(maxCount) && maxCount > 0 ? maxCount : JCuPupw._toastMaxCount;
        // 超出上限时立即移除最早的 Toast
        while (container.children.length >= limit) {
            container.firstElementChild.remove();
        }
        const toast = document.createElement('div');
        toast.className = `jc-toast jc-toast--${type}`;
        toast.textContent = content;
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
            document.body.appendChild(c);
        }
        return c;
    }

    registerMethod(name, fn) { this[name] = fn.bind(this); }

    on(event, callback) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(callback);
    }

    triggerEvent(event) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback());
        }
    }

    isOpen() { return this.modal.classList.contains('jc-modal--active'); }

    destroy() {
        if (this._autoCloseTimer) clearTimeout(this._autoCloseTimer);
        if (this._dragHandler && this.modalTitle) {
            this.modalTitle.removeEventListener('pointerdown', this._dragHandler);
        }
        if (this.isOpen()) this._unlockScroll();
        // 未兑现的 confirm/prompt 以默认值兜底，避免调用方永久等待
        this._pendingResolves.forEach(p => p.resolve(p.defaultValue));
        this._pendingResolves = [];
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
        JCuPupw._instances.delete(this);
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
