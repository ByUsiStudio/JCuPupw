import path from 'node:path';
import less from 'less';
import { string } from 'rollup-plugin-string';

// lolilota 模式下需要禁用按钮悬浮效果：编译整站主题时，
// 直接把按钮相关的 :hover 规则从产物中剔除，避免运行时再用 !important 覆盖。
const BUTTON_SELECTOR_TOKENS = [
    'jc-modal__button',
    'jc-modal__close',
    'pill-btn',
    'account-fab',
    'account-submit',
    'hist-del',
    'jc-export-option'
];

const shouldStripHover = (selector) =>
    selector.includes(':hover')
    && BUTTON_SELECTOR_TOKENS.some(token => selector.includes(token));

const findBlockEnd = (css, openIndex) => {
    let depth = 0;
    let quote = '';
    for (let i = openIndex; i < css.length; i += 1) {
        const char = css[i];
        if (quote) {
            if (char === '\\') i += 1;
            else if (char === quote) quote = '';
            continue;
        }
        if (char === '"' || char === "'") {
            quote = char;
        } else if (char === '{') {
            depth += 1;
        } else if (char === '}') {
            depth -= 1;
            if (depth === 0) return i;
        }
    }
    return -1;
};

const splitSelectors = (prelude) => {
    const list = [];
    let start = 0;
    let depth = 0;
    let quote = '';
    for (let i = 0; i < prelude.length; i += 1) {
        const char = prelude[i];
        if (quote) {
            if (char === '\\') i += 1;
            else if (char === quote) quote = '';
            continue;
        }
        if (char === '"' || char === "'") {
            quote = char;
        } else if (char === '(') {
            depth += 1;
        } else if (char === ')') {
            depth -= 1;
        } else if (char === ',' && depth === 0) {
            list.push(prelude.slice(start, i).trim());
            start = i + 1;
        }
    }
    list.push(prelude.slice(start).trim());
    return list.filter(Boolean);
};

const stripButtonHover = (css) => {
    let out = '';
    let i = 0;
    while (i < css.length) {
        const open = css.indexOf('{', i);
        if (open === -1) {
            out += css.slice(i);
            break;
        }
        const prelude = css.slice(i, open);
        const close = findBlockEnd(css, open);
        if (close === -1) {
            out += css.slice(i);
            break;
        }
        const body = css.slice(open + 1, close);
        const head = prelude.trim();

        if (head.startsWith('@')) {
            // @media / @supports / @keyframes 等：递归处理内部规则
            out += `${prelude}{${stripButtonHover(body)}}`;
        } else {
            const kept = splitSelectors(head).filter(selector => !shouldStripHover(selector));
            if (kept.length) out += `${kept.join(', ')}{${body}}`;
        }
        i = close + 1;
    }
    return out;
};

const THEME_ENTRY = path.resolve('src/less/style.less').toLowerCase();

const lessStrings = () => ({
    name: 'less-strings',
    async transform(code, id) {
        if (!id.endsWith('.less')) return null;

        const result = await less.render(code, {
            filename: id,
            paths: [path.dirname(id)],
            javascriptEnabled: false
        });

        // 整站主题在 lolilota 模式下注入，按钮悬浮规则在此处统一移除
        const css = path.resolve(id).toLowerCase() === THEME_ENTRY
            ? stripButtonHover(result.css)
            : result.css;

        return {
            code: `export default ${JSON.stringify(css)};`,
            map: { mappings: '' }
        };
    }
});

export default {
    input: 'src/jcupupw.js',
    plugins: [
        lessStrings(),
        string({
            include: '**/*.css'
        })
    ],
    output: [
        {
            file: 'dist/jcupupw.umd.js',
            format: 'umd',
            name: 'JCuPupw',
            exports: 'default'
        },
        {
            file: 'dist/jcupupw.esm.js',
            format: 'es'
        },
        {
            file: 'dist/jcupupw.cjs',
            format: 'cjs',
            exports: 'default'
        }
    ]
};
