import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Page introuvable',
    robots: { index: false, follow: false },
};

const SUGGESTIONS: ReadonlyArray<{ href: string; label: string }> = [
    { href: '/', label: 'Accueil' },
    { href: '/decouvrir', label: 'Découvrir les pièces' },
    { href: '/artisans', label: 'Annuaire des artisans' },
    { href: '/journal', label: 'Journal' },
];

export default function NotFoundPage() {
    return (
        <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-4 px-6 py-28 text-center">
            <p className="text-xs font-medium tracking-[0.25em] text-muted-foreground uppercase">Erreur 404</p>
            <h1 className="text-4xl font-bold tracking-tight text-balance text-foreground sm:text-5xl">
                Page introuvable
            </h1>
            <p className="max-w-md text-base leading-relaxed text-pretty text-muted-foreground">
                Cette page n&apos;existe pas, ou elle a été déplacée. Voici par où reprendre.
            </p>
            <ul className="mt-2 flex flex-wrap items-center justify-center gap-2">
                {SUGGESTIONS.map((suggestion) => (
                    <li key={suggestion.href}>
                        <Link
                            href={suggestion.href}
                            className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                        >
                            {suggestion.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
