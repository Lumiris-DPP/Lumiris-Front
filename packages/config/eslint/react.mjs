// @ts-check
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import base from './base.mjs';

export default [
    ...base,
    {
        files: ['**/*.{js,jsx,ts,tsx}'],
        plugins: {
            'react-hooks': reactHooksPlugin,
        },
        rules: {
            ...reactHooksPlugin.configs.recommended.rules,
        },
    },
    {
        files: ['**/*.{jsx,tsx}'],
        plugins: {
            react: reactPlugin,
            'jsx-a11y': jsxA11yPlugin,
        },
        settings: {
            react: { version: 'detect' },
        },
        rules: {
            ...reactPlugin.configs.recommended.rules,
            ...reactPlugin.configs['jsx-runtime'].rules,
            ...jsxA11yPlugin.configs.recommended.rules,
            'react/self-closing-comp': ['error', { component: true, html: true }],
            'react/no-danger': 'warn',
            'react/jsx-boolean-value': ['warn', 'never'],
            'react/prop-types': 'off',
            'react/react-in-jsx-scope': 'off',
            'jsx-a11y/alt-text': 'error',
            'jsx-a11y/anchor-has-content': 'error',
            'jsx-a11y/click-events-have-key-events': 'warn',
            'jsx-a11y/control-has-associated-label': 'warn',
            'jsx-a11y/interactive-supports-focus': 'warn',
            'jsx-a11y/label-has-associated-control': [
                'warn',
                {
                    required: { some: ['nesting', 'id'] },
                },
            ],
            'jsx-a11y/no-autofocus': 'warn',
            'jsx-a11y/tabindex-no-positive': 'error',
        },
    },
];
