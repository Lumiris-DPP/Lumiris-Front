import type { Artisan } from '@lumiris/types';

export function greeting(artisan: Artisan): string {
    const firstName = artisan.displayName.split(' ')[0] ?? artisan.displayName;
    return `Bonjour ${firstName}`;
}
