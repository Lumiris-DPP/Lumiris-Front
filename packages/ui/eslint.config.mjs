import react from '@lumiris/config/eslint/react';

export default [
    ...react,
    {
        files: ['src/**/*.{ts,tsx}'],
    },
    {
        files: ['src/components/ui/**/*.{ts,tsx}'],
        rules: {
            'jsx-a11y/anchor-has-content': 'off',
            'jsx-a11y/click-events-have-key-events': 'off',
            'jsx-a11y/no-noninteractive-element-interactions': 'off',
            'jsx-a11y/no-static-element-interactions': 'off',
            'react/no-danger': 'off',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_|^[A-Z]' }],
        },
    },
    {
        ignores: ['dist/**', 'node_modules/**'],
    },
];
