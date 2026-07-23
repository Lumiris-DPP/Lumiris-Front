import react from '@lumiris/config/eslint/react';

export default [
    ...react,
    {
        ignores: ['dist/**', 'node_modules/**', 'public/**'],
    },
];
