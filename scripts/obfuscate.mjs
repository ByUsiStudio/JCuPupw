import pkg from 'javascript-obfuscator';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { obfuscate } = pkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');

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

for (const file of targets) {
    const filePath = path.join(distDir, file);
    if (!fs.existsSync(filePath)) {
        console.warn(`[warn] ${file} not found, skipping`);
        continue;
    }
    const code = fs.readFileSync(filePath, 'utf8');
    const result = obfuscate(code, options);
    fs.writeFileSync(filePath, result.getObfuscatedCode(), 'utf8');
    console.log(`[obfuscated] ${file}`);
}

console.log('Done.');
