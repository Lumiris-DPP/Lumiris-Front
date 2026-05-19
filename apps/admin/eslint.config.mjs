import next from '@lumiris/config/eslint/next';

export default [
    ...next,
    {
        ignores: ['.next/**', 'node_modules/**', 'public/**', 'features/_archived/**'],
    },
];
