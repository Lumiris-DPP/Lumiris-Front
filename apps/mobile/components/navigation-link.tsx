'use client';

import type { ComponentProps } from 'react';
import NextLink from 'next/link';

// Désactive le préchargement qui bloquait la navigation de l'export statique web et Tauri.
export default function NavigationLink(props: Omit<ComponentProps<typeof NextLink>, 'prefetch'>) {
    return <NextLink {...props} prefetch={false} />;
}
