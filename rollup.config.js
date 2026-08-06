import { string } from 'rollup-plugin-string';

export default {
    input: 'src/jcupupw.js',
    plugins: [
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
