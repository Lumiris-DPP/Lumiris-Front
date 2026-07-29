import next from '@lumiris/config/eslint/next';

export default [
    ...next,
    {
        ignores: ['.next/**', 'out/**', 'node_modules/**', 'public/**'],
    },
];
