/** @type {import('stylelint').Config} */
export default {
    extends: ['stylelint-config-standard', 'stylelint-config-tailwindcss'],
    rules: {
        'at-rule-no-unknown': [
            true,
            {
                ignoreAtRules: [
                    'tailwind',
                    'theme',
                    'apply',
                    'layer',
                    'variant',
                    'variants',
                    'responsive',
                    'screen',
                    'custom-variant',
                    'config',
                    'plugin',
                    'utility',
                    'source',
                    'import',
                    'reference',
                ],
            },
        ],
        'no-descending-specificity': null,
        'selector-class-pattern': null,
        'custom-property-pattern': null,
        'media-feature-name-no-unknown': [true, { ignoreMediaFeatureNames: ['prefers-reduced-motion'] }],
    },
};
