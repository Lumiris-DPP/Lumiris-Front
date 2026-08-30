import type { MetadataRoute } from 'next';

// Requis par `output: export` (voir next.config) : sans ça, la route /manifest.webmanifest
// échoue à la collecte des pages.
export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Lumiris Vision',
        short_name: 'Lumiris',
        description:
            'Le scanner universel des passeports numériques européens. Scannez un produit, révélez son histoire et son score Iris V2.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [
            {
                src: '/icon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
            },
        ],
    };
}
