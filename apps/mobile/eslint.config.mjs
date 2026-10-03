import next from '@lumiris/config/eslint/next';

export default [
    ...next,
    {
        ignores: ['.next/**', 'out/**', 'node_modules/**', 'public/**'],
    },
    {
        files: ['**/*.{ts,tsx}'],
        ignores: ['components/navigation-link.tsx'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    paths: [
                        {
                            name: 'next/link',
                            message: 'Utiliser @/components/navigation-link pour cet export statique.',
                        },
                    ],
                },
            ],
        },
    },
];
