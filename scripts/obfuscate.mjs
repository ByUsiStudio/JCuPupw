import pkg from 'javascript-obfuscator';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';

const { obfuscate } = pkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const pkgInfo = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));

const targets = [
    'jcupupw.umd.js',
    'jcupupw.esm.js',
    'jcupupw.cjs'
];

const options = {
    compact: true,
    controlFlowFlattening: false,
    stringArray: false,
    identifierNamesGenerator: 'hexadecimal',
    renameGlobals: false,
    transformObjectKeys: false,
    sourceMap: false,
    unicodeEscapeSequence: false,
    selfDefending: false,
    simplify: true,
    splitStrings: false
};

const buildDate = new Date().toISOString().slice(0, 10);
const buildId = randomUUID();
const banner = `/*!
 * JCuPupw v${pkgInfo.version}
 * ${pkgInfo.description}
 *
 * Repository:
 *   - https://gitee.com/byusistudio/jcupupw
 *   - https://github.com/ByUsiStudio/JCuPupw
 *   - https://codeberg.org/ByUsiStudio/JCuPupw
 *
 * Author: 北啊呢 <177828525@qq.com> (ByUsiStudio)
 * License: AGPL-3.0-or-later
 * Build: ${buildDate}
 * Build ID: ${buildId}
 */
`;

for (const file of targets) {
    const filePath = path.join(distDir, file);
    if (!fs.existsSync(filePath)) {
        console.warn(`[warn] ${file} not found, skipping`);
        continue;
    }
    const code = fs.readFileSync(filePath, 'utf8');
    const result = obfuscate(code, options);
    fs.writeFileSync(filePath, banner + result.getObfuscatedCode(), 'utf8');
    console.log(`[obfuscated] ${file}`);
}

console.log('Done.');
