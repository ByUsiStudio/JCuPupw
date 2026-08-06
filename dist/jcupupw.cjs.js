'use strict';

var styles = "/* 基础样式 */\n:root {\n    --jc-primary: #3f51b5;\n    --jc-primary-hover: #303f9f;\n    --jc-danger: #ff4444;\n    --jc-danger-hover: #cc0000;\n    --jc-text: #333;\n    --jc-text-light: #666;\n    --jc-background: #fff;\n    --jc-border: #e0e0e0;\n    --jc-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);\n    --jc-radius: 12px;\n    --jc-transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n    --jc-blur: blur(10px);\n}\n\n@media (prefers-color-scheme: dark) {\n    :root {\n        --jc-text: #fff;\n        --jc-text-light: #ccc;\n        --jc-background: #1e1e1e;\n        --jc-border: #444;\n        --jc-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);\n    }\n}\n\n* {\n    -webkit-tap-highlight-color: transparent;\n}\n\n/* 弹窗容器 */\n.jc-modal {\n    display: none;\n    position: fixed;\n    top: 0;\n    left: 0;\n    width: 100%;\n    height: 100%;\n    z-index: 1000;\n}\n\n/* 遮罩层 */\n.jc-modal__overlay {\n    position: absolute;\n    top: 0;\n    left: 0;\n    width: 100%;\n    height: 100%;\n    background: rgba(0, 0, 0, 0.5);\n    backdrop-filter: var(--jc-blur);\n    opacity: 0;\n    transition: opacity 0.3s ease;\n}\n\n/* 弹窗内容容器 */\n.jc-modal__container {\n    position: relative;\n    background: var(--jc-background);\n    margin: 20vh auto;\n    padding: 24px;\n    width: 90%;\n    max-width: 500px;\n    border-radius: var(--jc-radius);\n    box-shadow: var(--jc-shadow);\n    transform: translateY(-30px);\n    opacity: 0;\n    transition: var(--jc-transition);\n}\n\n/* 弹窗激活状态 */\n.jc-modal--active {\n    display: block;\n}\n\n.jc-modal--active .jc-modal__overlay {\n    opacity: 1;\n}\n\n.jc-modal--active .jc-modal__container {\n    animation: jc-fadeInUp 0.5s ease-out forwards;\n}\n\n/* 弹窗关闭动画 */\n.jc-modal--closing .jc-modal__overlay {\n    opacity: 0;\n    transition: opacity 0.5s ease;\n}\n\n.jc-modal--closing .jc-modal__container {\n    animation: jc-fadeOutDown 0.5s ease-out forwards;\n}\n\n/* 弹窗标题 */\n.jc-modal__title {\n    margin: 0 0 16px;\n    font-size: 24px;\n    font-weight: 500;\n    color: var(--jc-text);\n    padding-right: 40px;\n}\n\n/* 弹窗内容 */\n.jc-modal__content {\n    margin: 16px 0;\n    font-size: 16px;\n    line-height: 1.5;\n    color: var(--jc-text-light);\n}\n\n/* 弹窗按钮区域 */\n.jc-modal__actions {\n    display: flex;\n    justify-content: flex-end;\n    gap: 8px;\n    margin-top: 24px;\n    flex-wrap: wrap;\n}\n\n/* 弹窗按钮 */\n.jc-modal__button {\n    background: var(--jc-primary);\n    color: #fff;\n    border: none;\n    padding: 12px 24px;\n    border-radius: 6px;\n    font-size: 14px;\n    font-weight: 500;\n    cursor: pointer;\n    transition: var(--jc-transition);\n    flex: 1 1 auto;\n    margin: 4px;\n}\n\n.jc-modal__button:hover {\n    background: var(--jc-primary-hover);\n    transform: translateY(-2px);\n}\n\n.jc-modal__button:active {\n    transform: translateY(0);\n}\n\n/* 默认按钮样式（非主要操作） */\n.jc-modal__button--default {\n    background: var(--jc-background);\n    color: var(--jc-text);\n    border: 1px solid var(--jc-border);\n}\n\n.jc-modal__button--default:hover {\n    background: var(--jc-border);\n    color: var(--jc-text);\n}\n\n/* 主要按钮样式 */\n.jc-modal__button--primary {\n    background: var(--jc-primary);\n    color: #fff;\n    border: none;\n}\n\n.jc-modal__button--primary:hover {\n    background: var(--jc-primary-hover);\n}\n\n/* 危险按钮样式 */\n.jc-modal__button--danger {\n    background: var(--jc-danger);\n}\n\n.jc-modal__button--danger:hover {\n    background: var(--jc-danger-hover);\n}\n\n/* 关闭按钮 */\n.jc-modal__close {\n    position: absolute;\n    top: 16px;\n    right: 16px;\n    width: 32px;\n    height: 32px;\n    border: none;\n    background: transparent;\n    font-size: 24px;\n    line-height: 1;\n    cursor: pointer;\n    color: var(--jc-text-light);\n    transition: color 0.2s ease;\n}\n\n.jc-modal__close:hover {\n    color: var(--jc-text);\n}\n\n/* 加载状态 */\n.jc-modal__loading {\n    display: none;\n    position: absolute;\n    top: 0;\n    left: 0;\n    width: 100%;\n    height: 100%;\n    background: rgba(255, 255, 255, 0.8);\n    border-radius: var(--jc-radius);\n    justify-content: center;\n    align-items: center;\n    z-index: 10;\n}\n\n.jc-modal__loading--active {\n    display: flex;\n}\n\n.jc-spinner {\n    border: 4px solid rgba(0, 0, 0, 0.1);\n    border-top: 4px solid var(--jc-primary);\n    border-radius: 50%;\n    width: 40px;\n    height: 40px;\n    animation: jc-spin 1s linear infinite;\n}\n\n@keyframes jc-spin {\n    0% { transform: rotate(0deg); }\n    100% { transform: rotate(360deg); }\n}\n\n/* 弹出动画 */\n@keyframes jc-fadeInUp {\n    0% {\n        opacity: 0;\n        transform: translateY(20px);\n    }\n    100% {\n        opacity: 1;\n        transform: translateY(0);\n    }\n}\n\n/* 关闭动画 */\n@keyframes jc-fadeOutDown {\n    0% {\n        opacity: 1;\n        transform: translateY(0);\n    }\n    100% {\n        opacity: 0;\n        transform: translateY(20px);\n    }\n}\n\n/* 移动端优化 */\n@media (max-width: 480px) {\n    .jc-modal__container {\n        margin: 10vh auto;\n        padding: 16px;\n    }\n\n    .jc-modal__title {\n        font-size: 20px;\n    }\n\n    .jc-modal__content {\n        font-size: 14px;\n    }\n\n    .jc-modal__button {\n        padding: 10px 20px;\n    }\n}\n";

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

module.exports = JCuPupw;
