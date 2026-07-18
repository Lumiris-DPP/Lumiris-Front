'use client';

import { formatDateFr } from '@lumiris/utils';
import type { DppEventActorType } from '@lumiris/api-client';
import { useDppEvents } from '@lumiris/api-client/react';
import { Badge } from '@lumiris/ui/components/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@lumiris/ui/components/card';

export const ACTOR_LABELS: Record<DppEventActorType, string> = {
    MANUFACTURER: 'Fabricant',
    DISTRIBUTOR: 'Distributeur',
    RETAILER: 'Revendeur',
    CONSUMER: 'Consommateur',
    REPAIRER: 'Réparateur',
    RECYCLER: 'Recycleur',
};

export function EventHistoryCard({ passportId }: { passportId: string }) {
    const eventsQuery = useDppEvents(passportId);
    const events = eventsQuery.data ?? [];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Historique des événements</CardTitle>
            </CardHeader>
            <CardContent>
                {events.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                        {eventsQuery.isLoading ? 'Chargement…' : 'Aucun événement enregistré.'}
                    </p>
                ) : (
                    <ul className="space-y-3">
                        {events.map((event) => (
                            <li key={event.id} className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground text-[11px] uppercase tracking-wider">
                                        {formatDateFr(event.occurredAt)}
                                    </span>
                                    <Badge variant="secondary" className="text-xs">
                                        {ACTOR_LABELS[event.actorType]}
                                    </Badge>
                                </div>
                                <span className="text-foreground whitespace-pre-wrap text-sm">{event.description}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
