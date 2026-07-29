import { fileURLToPath } from 'node:url';

// Feuille Tailwind v4 de référence pour le tri des classes. Sans ce pointeur explicite,
// prettier-plugin-tailwindcss part en auto-détection et l'ordre dépend du layout de
// node_modules — donc de l'historique d'installation. Chemin absolu → identique en CLI,
// en CI et dans l'éditeur.
const tailwindStylesheet = fileURLToPath(new URL('../../ui/src/styles/prismatic.css', import.meta.url));

/** @type {import('prettier').Config} */
export default {
    printWidth: 120,
    tabWidth: 4,
    useTabs: false,
    semi: true,
    singleQuote: true,
    quoteProps: 'as-needed',
    jsxSingleQuote: false,
    trailingComma: 'all',
    bracketSpacing: true,
    bracketSameLine: false,
    arrowParens: 'always',
    endOfLine: 'lf',
    plugins: ['prettier-plugin-tailwindcss'],
    tailwindStylesheet,
    tailwindFunctions: ['clsx', 'cn', 'cva', 'twMerge'],
};
