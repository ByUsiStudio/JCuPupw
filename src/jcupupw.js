import styles from './jcupupw.css';

class JCuPupw {
    static _instances = new Set();
    static _zIndexBase = 1000;
    static _queue = [];
    static _showing = null;
    static _singleton = null;

    constructor(options = {}) {
        this.modalId = options.id || 'jcModal';
        this.events = {};
        this.config = {};
        this._autoCloseTimer = null;
        this._dragHandler = null;
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
            <div class="jc-modal__container">
                <button type="button" class="jc-modal__close">&times;</button>
                <h2 class="jc-modal__title">提示</h2>
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

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) {
                if (this.config.closeOnEsc === false) return;
                if (JCuPupw._getTopInstance() !== this) return;
                this.close();
            }
        });

        document.querySelectorAll('.jc-modal-trigger').forEach(trigger => {
            if (trigger._jcBound) return;
            trigger._jcBound = true;
            trigger.addEventListener('click', () => this.openFromTrigger(trigger));
        });
    }

    openFromTrigger(trigger) {
        const title = trigger.getAttribute('data-modal-title');
        const content = trigger.getAttribute('data-modal-content');
        const buttons = JSON.parse(trigger.getAttribute('data-modal-buttons') || '[]');
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
            document.body.style.overflow = 'hidden';

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
            const animationDuration = 500;
            setTimeout(() => {
                this.modal.classList.remove('jc-modal--closing');
                this.modal.classList.remove('jc-modal--active');
                this.container.style.left = '';
                this.container.style.top = '';
                this.container.style.margin = '';
                this.container.style.transform = '';
                this._dragOffset = { x: 0, y: 0 };
                if (!JCuPupw._hasOpenModal()) {
                    document.body.style.overflow = '';
                }
                this.triggerEvent('close');
                this.config.onClose?.();
                if (this.config.queue && JCuPupw._showing === this) {
                    JCuPupw._showing = null;
                    JCuPupw._showNext();
                }
                resolve(true);
            }, animationDuration);
        });
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

        this.container.style.willChange = 'transform';
        document.body.style.userSelect = 'none';

        const onMove = (ev) => {
            this._dragOffset.x = origin.x + (ev.clientX - startX);
            this._dragOffset.y = origin.y + (ev.clientY - startY);
            this.container.style.transform = `translate(${this._dragOffset.x}px, ${this._dragOffset.y}px)`;
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
    setContent(content) { this.modalContent.innerHTML = content; return this; }

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
        const {
            title = '确认',
            content = '确定要执行此操作吗？',
            confirmText = '确定',
            cancelText = '取消'
        } = config;
        return new Promise((resolve) => {
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
            cancelText = '取消'
        } = config;
        const inputId = `jc-prompt-${Date.now()}`;
        const label = content ? `<div style="margin-bottom:12px;">${content}</div>` : '';
        const html = `${label}<input id="${inputId}" class="jc-modal__input" type="text" placeholder="${placeholder}" value="${String(defaultValue).replace(/"/g, '&quot;')}" />`;
        return new Promise((resolve) => {
            this.open({
                ...config,
                title,
                content: html,
                buttons: [
                    { text: cancelText, type: 'default', action: () => resolve(null) },
                    { text: confirmText, type: 'primary', action: () => {
                        const input = document.getElementById(inputId);
                        resolve(input ? input.value : null);
                    }}
                ]
            });
        });
    }

    toast(config = {}) {
        const { content = '', type = 'info', duration = 3000 } = config;
        return JCuPupw._showToast(content, type, duration);
    }

    static _hasOpenModal() {
        for (const inst of JCuPupw._instances) {
            if (inst.isOpen()) return true;
        }
        return false;
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

    static _showToast(content, type, duration) {
        const container = JCuPupw._getToastContainer();
        const toast = document.createElement('div');
        toast.className = `jc-toast jc-toast--${type}`;
        toast.textContent = content;
        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('jc-toast--visible'));

        const remove = () => {
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
