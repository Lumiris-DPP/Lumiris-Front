import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Page introuvable',
};

export default function NotFoundPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-8 text-center">
            <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Erreur 404</p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Page introuvable</h1>
            <p className="max-w-sm text-sm text-muted-foreground">
                Cette page n&apos;existe pas, ou elle a été déplacée.
            </p>
            <Link
                href="/dashboard"
                className="mt-2 text-sm font-semibold text-lumiris-cyan underline underline-offset-4"
            >
                Retour au tableau de bord
            </Link>
        </div>
    );
}
