import { AlertTriangle } from 'lucide-react';

export function DisputeBanner({ reason }: { reason?: string | null }) {
    return (
        <div className="flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
            <div>
                <p className="font-medium text-foreground">Litige ouvert par l’acheteur</p>
                {reason ? <p className="mt-0.5 text-xs text-muted-foreground">{reason}</p> : null}
                <p className="mt-1 text-xs text-muted-foreground">
                    Répondez dans le fil ci-dessous. La plateforme tranche si aucun accord n’est trouvé.
                </p>
            </div>
        </div>
    );
}
