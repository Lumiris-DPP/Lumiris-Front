'use client';

import { useState } from 'react';
import { CalendarClock, Sun } from 'lucide-react';
import { useArtisanMe, usePauseAtelier, useResumeAtelier } from '@lumiris/api-client/react';
import { Button } from '@lumiris/ui/components/button';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { toast } from '@lumiris/ui/components/sonner';
import { formatDateFr } from '@lumiris/utils';
import { useAuthStore } from '@/lib/auth-store';
import { usePendingOrderCount } from '@/features/workspace-shell/hooks';

/** Formate une date locale pour le champ de retour de congés. */
function localDateInput(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

/** Calcule la prochaine date du calendrier local. */
function tomorrow(): string {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return localDateInput(date);
}

/** Affiche la pause de l’atelier et ses commandes de reprise. */
export function VacationBanner() {
    const token = useAuthStore((s) => s.token);
    const { data: profile } = useArtisanMe({ enabled: Boolean(token) });
    const pauseMutation = usePauseAtelier();
    const resumeMutation = useResumeAtelier();
    const pendingOrders = usePendingOrderCount();
    const [until, setUntil] = useState(tomorrow);

    if (!token || !profile) return null;

    const pending = pauseMutation.isPending || resumeMutation.isPending;

    if (profile.pausedUntil) {
        return (
            <section className="flex flex-wrap items-start gap-3 rounded-xl border border-lumiris-cyan/40 bg-lumiris-cyan/10 p-4">
                <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-lumiris-cyan" aria-hidden />
                <div className="min-w-56 flex-1 space-y-1">
                    <p className="text-sm font-medium text-foreground">
                        Atelier en pause jusqu’au {formatDateFr(profile.pausedUntil)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Vos pièces restent achetables : le délai d’expédition annoncé aux acheteurs est allongé
                        automatiquement jusqu’à votre retour, et vous n’êtes pas relancé pendant ce temps.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                        resumeMutation.mutate(undefined, {
                            /** Annonce la réussite et termine la mutation demandée. */
                            onSuccess: () => toast.success('Atelier de nouveau actif.'),
                            /** Affiche la cause exacte de l’échec de la requête. */
                            onError: (e) => toast.error(e.message || 'Échec de la reprise.'),
                        })
                    }
                >
                    <Sun className="mr-1.5 h-3.5 w-3.5" />
                    Reprendre maintenant
                </Button>
            </section>
        );
    }

    /** Valide les saisies avant de lancer la mutation demandée. */
    const submit = (event: React.SyntheticEvent) => {
        event.preventDefault();
        pauseMutation.mutate(
            { until: new Date(`${until}T00:00:00`).toISOString() },
            {
                /** Annonce la réussite et termine la mutation demandée. */
                onSuccess: () => toast.success('Atelier mis en pause.'),
                /** Affiche la cause exacte de l’échec de la requête. */
                onError: (e) => toast.error(e.message || 'Échec de la mise en pause.'),
            },
        );
    };

    return (
        <form onSubmit={submit} className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
            <div className="min-w-56 flex-1 space-y-1">
                <p className="text-sm font-medium text-foreground">Vous partez ?</p>
                <p className="text-xs text-muted-foreground">
                    Annoncez votre date de retour : le délai d’expédition affiché à l’acheteur est allongé d’autant, et
                    votre vitrine l’indique. {pendingOrders > 0 ? null : 'Vos pièces restent en vente.'}
                </p>
                {pendingOrders > 0 ? (
                    <p className="text-xs text-lumiris-amber">
                        Vous avez {pendingOrders} commande{pendingOrders > 1 ? 's' : ''} en attente — la pause n’annule
                        pas vos engagements en cours.
                    </p>
                ) : null}
            </div>
            <div className="grid gap-1.5">
                <Label htmlFor="vacation-until" className="text-xs">
                    Date de retour
                </Label>
                <Input
                    id="vacation-until"
                    type="date"
                    min={tomorrow()}
                    value={until}
                    onChange={(e) => setUntil(e.target.value)}
                />
            </div>
            <Button type="submit" variant="outline" size="sm" disabled={pending || !until}>
                <CalendarClock className="mr-1.5 h-3.5 w-3.5" />
                Mettre en pause
            </Button>
        </form>
    );
}
