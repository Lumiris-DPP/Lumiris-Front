import { Link } from 'react-router-dom';

// SPA replacement for Next's notFound() — a simple centered "page introuvable" screen.
export function NotFound() {
    return (
        <div className="bg-background text-foreground flex h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-muted-foreground text-sm font-semibold tracking-tight">Erreur 404</p>
            <h1 className="text-2xl font-bold tracking-tight">Page introuvable</h1>
            <p className="text-muted-foreground max-w-xs text-sm">
                La page que vous cherchez n&apos;existe pas ou a été déplacée.
            </p>
            <Link
                to="/"
                className="text-lumiris-cyan mt-2 text-sm font-semibold underline underline-offset-4"
            >
                Retour au scan
            </Link>
        </div>
    );
}
