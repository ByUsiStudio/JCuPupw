/**
 * JCuPupw 类型声明（CommonJS 入口）
 *
 * 供 `require('jcupupw')` / `import JCuPupw = require('jcupupw')` 使用。
 * 接口与配置类型集中在 `index.d.ts`，这里以 CommonJS 的 `export =` 形态再导出，
 * 避免 CommonJS 消费端把 ESM 类型当成真正的 ESM 而报 TS1479。
 */

import type JCuPupwInstance from './index.js' with { 'resolution-mode': 'import' };
import type {
    JCuPupwAlertConfig as _JCuPupwAlertConfig,
    JCuPupwAnchor as _JCuPupwAnchor,
    JCuPupwButton as _JCuPupwButton,
    JCuPupwButtonType as _JCuPupwButtonType,
    JCuPupwConfirmConfig as _JCuPupwConfirmConfig,
    JCuPupwConfig as _JCuPupwConfig,
    JCuPupwConstructor as _JCuPupwConstructor,
    JCuPupwContent as _JCuPupwContent,
    JCuPupwEasing as _JCuPupwEasing,
    JCuPupwEventCallback as _JCuPupwEventCallback,
    JCuPupwEventName as _JCuPupwEventName,
    JCuPupwInputType as _JCuPupwInputType,
    JCuPupwOpenConfig as _JCuPupwOpenConfig,
    JCuPupwOptions as _JCuPupwOptions,
    JCuPupwPlacement as _JCuPupwPlacement,
    JCuPupwPromptConfig as _JCuPupwPromptConfig,
    JCuPupwResolvedConfig as _JCuPupwResolvedConfig,
    JCuPupwSize as _JCuPupwSize,
    JCuPupwTheme as _JCuPupwTheme,
    JCuPupwToastConfig as _JCuPupwToastConfig,
    JCuPupwToastHandle as _JCuPupwToastHandle,
    JCuPupwToastType as _JCuPupwToastType
} from './index.js' with { 'resolution-mode': 'import' };

declare const JCuPupw: _JCuPupwConstructor;

// 让 `JCuPupw` 同时可以当作实例类型使用，例如 `const modal: JCuPupw = new JCuPupw()`
interface JCuPupw extends JCuPupwInstance {}

declare namespace JCuPupw {
    export type JCuPupwAlertConfig = _JCuPupwAlertConfig;
    export type JCuPupwAnchor = _JCuPupwAnchor;
    export type JCuPupwButton = _JCuPupwButton;
    export type JCuPupwButtonType = _JCuPupwButtonType;
    export type JCuPupwConfirmConfig = _JCuPupwConfirmConfig;
    export type JCuPupwConfig = _JCuPupwConfig;
    export type JCuPupwConstructor = _JCuPupwConstructor;
    export type JCuPupwContent = _JCuPupwContent;
    export type JCuPupwEasing = _JCuPupwEasing;
    export type JCuPupwEventCallback = _JCuPupwEventCallback;
    export type JCuPupwEventName = _JCuPupwEventName;
    export type JCuPupwInputType = _JCuPupwInputType;
    export type JCuPupwOpenConfig = _JCuPupwOpenConfig;
    export type JCuPupwOptions = _JCuPupwOptions;
    export type JCuPupwPlacement = _JCuPupwPlacement;
    export type JCuPupwPromptConfig = _JCuPupwPromptConfig;
    export type JCuPupwResolvedConfig = _JCuPupwResolvedConfig;
    export type JCuPupwSize = _JCuPupwSize;
    export type JCuPupwTheme = _JCuPupwTheme;
    export type JCuPupwToastConfig = _JCuPupwToastConfig;
    export type JCuPupwToastHandle = _JCuPupwToastHandle;
    export type JCuPupwToastType = _JCuPupwToastType;
}

export = JCuPupw;
