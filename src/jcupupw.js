import styles from './jcupupw.css';

class JCuPupw {
    constructor(options = {}) {
        this.modalId = options.id || 'jcModal';
        this.events = {};
        this._buildDOM();
        this.injectStyles();
        this.init();
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
                <button class="jc-modal__close">&times;</button>
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
            if (e.target.closest('.jc-modal__close') || e.target.classList.contains('jc-modal__overlay')) {
                this.close();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) this.close();
        });

        document.querySelectorAll('.jc-modal-trigger').forEach(trigger => {
            trigger.addEventListener('click', () => this.openFromTrigger(trigger));
        });
    }

    openFromTrigger(trigger) {
        const title = trigger.getAttribute('data-modal-title');
        const content = trigger.getAttribute('data-modal-content');
        const buttons = JSON.parse(trigger.getAttribute('data-modal-buttons') || '[]');

        this.open({
            title,
            content,
            buttons: buttons.map(btn => ({
                text: btn.text,
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
            const {
                title = '提示',
                content = '默认内容',
                buttons = [{ text: '确定', action: () => this.close() }],
                onOpen,
                onClose
            } = config;

            this.setTitle(title);
            this.setContent(content);

            this.modalActions.innerHTML = buttons.map(btn => {
                const typeClass = btn.type ? `jc-modal__button--${btn.type}` : '';
                return `<button class="jc-modal__button ${typeClass}">${btn.text}</button>`;
            }).join('');

            this.modalActions.querySelectorAll('.jc-modal__button').forEach((btn, index) => {
                btn.addEventListener('click', () => {
                    buttons[index].action?.();
                    if (buttons[index].close !== false) this.close();
                });
            });

            this.modal.classList.add('jc-modal--active');
            document.body.style.overflow = 'hidden';

            this.triggerEvent('open');
            onOpen?.();
            resolve();
        });
    }

    close() {
        return new Promise((resolve) => {
            this.modal.classList.add('jc-modal--closing');

            const animationDuration = 500;
            setTimeout(() => {
                this.modal.classList.remove('jc-modal--closing');
                this.modal.classList.remove('jc-modal--active');
                document.body.style.overflow = '';
                this.triggerEvent('close');
                resolve();
            }, animationDuration);
        });
    }

    setTitle(title) {
        this.modalTitle.textContent = title;
        return this;
    }

    setContent(content) {
        this.modalContent.innerHTML = content;
        return this;
    }

    addButton(text, action, type = 'default') {
        const button = document.createElement('button');
        button.className = `jc-modal__button jc-modal__button--${type}`;
        button.textContent = text;
        button.addEventListener('click', () => {
            action?.();
            this.close();
        });
        this.modalActions.appendChild(button);
        return this;
    }

    showLoading() {
        this.modalLoading.classList.add('jc-modal__loading--active');
        return this;
    }

    hideLoading() {
        this.modalLoading.classList.remove('jc-modal__loading--active');
        return this;
    }

    registerMethod(name, fn) {
        this[name] = fn.bind(this);
    }

    on(event, callback) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(callback);
    }

    triggerEvent(event) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback());
        }
    }

    isOpen() {
        return this.modal.classList.contains('jc-modal--active');
    }

    destroy() {
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
        this.modal = null;
        this.modalTitle = null;
        this.modalContent = null;
        this.modalActions = null;
        this.modalLoading = null;
        this.events = {};
    }
}

export default JCuPupw;
