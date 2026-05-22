// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
    {
        ignores: [
            '**/node_modules/**',
            '**/.next/**',
            '**/dist/**',
            '**/build/**',
            '**/.turbo/**',
            '**/coverage/**',
            '**/out/**',
            '**/src-tauri/target/**',
        ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.node,
                ...globals.browser,
            },
        },
        rules: {
            '@typescript-eslint/no-unused-expressions': ['error', { allowTernary: true, allowShortCircuit: true }],
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-non-null-assertion': 'warn',
            '@typescript-eslint/no-inferrable-types': 'error',
            '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
            '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
            '@typescript-eslint/prefer-as-const': 'error',
            '@typescript-eslint/no-duplicate-enum-values': 'error',
            'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
            'prefer-const': 'error',
            'no-var': 'error',
            'object-shorthand': 'error',
            'prefer-arrow-callback': 'error',
            'no-unneeded-ternary': 'error',
            'prefer-template': 'error',
            'no-useless-concat': 'error',
            'no-useless-return': 'error',
            'no-lonely-if': 'error',
            'no-else-return': ['error', { allowElseIf: false }],
            'array-callback-return': 'error',
            'require-await': 'warn',
            eqeqeq: ['error', 'always', { null: 'ignore' }],
            curly: ['error', 'all'],
        },
    },
    {
        files: ['**/__tests__/**', '**/*.test.{ts,tsx,js,jsx}', '**/*.spec.{ts,tsx,js,jsx}'],
        rules: {
            '@typescript-eslint/no-non-null-assertion': 'off',
        },
    },
    prettier,
];
