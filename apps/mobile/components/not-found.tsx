import Link from 'next/link';

export function NotFound() {
    return (
        <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
            <p className="text-sm font-semibold tracking-tight text-muted-foreground">Erreur 404</p>
            <h1 className="text-2xl font-bold tracking-tight">Page introuvable</h1>
            <p className="max-w-xs text-sm text-muted-foreground">
                La page que vous cherchez n&apos;existe pas ou a été déplacée.
            </p>
            <Link href="/" className="mt-2 text-sm font-semibold text-lumiris-cyan underline underline-offset-4">
                Retour au scan
            </Link>
        </div>
    );
}
