import Image from 'next/image';
import type { OrderEvent } from '@lumiris/api-client';
import { ORDER_EVENT_LABEL } from '@lumiris/api-client';
import { formatDateFr } from '@lumiris/utils';

const ACTOR_LABEL: Record<OrderEvent['actorType'], string> = {
    BUYER: 'Acheteur',
    SELLER: 'Atelier',
    PLATFORM: 'Lumiris',
    SYSTEM: 'Automatique',
};

export function OrderTimeline({ events }: { events: readonly OrderEvent[] }) {
    if (events.length === 0) {
        return <p className="text-xs text-muted-foreground">Aucun événement enregistré.</p>;
    }
    return (
        <ol className="space-y-3 border-l border-border pl-4">
            {events.map((event) => (
                <li key={event.id} className="relative">
                    <span
                        aria-hidden
                        className="absolute top-1.5 -left-[21px] h-2 w-2 rounded-full bg-lumiris-cyan ring-4 ring-card"
                    />
                    <p className="text-sm font-medium text-foreground">{ORDER_EVENT_LABEL[event.type]}</p>
                    <p className="text-[11px] text-muted-foreground">
                        {ACTOR_LABEL[event.actorType]} · {formatDateFr(event.createdAt)}
                    </p>
                    {event.message ? <p className="mt-0.5 text-xs text-foreground/80">{event.message}</p> : null}
                    <EventAttachments event={event} />
                </li>
            ))}
        </ol>
    );
}

function EventAttachments({ event }: { event: OrderEvent }) {
    const attachments = event.attachments ?? [];
    if (attachments.length === 0) {
        return null;
    }
    return (
        <ul className="mt-2 flex flex-wrap gap-2">
            {attachments.map((file) => (
                <li key={file.id}>
                    <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        title={file.filename ?? 'Pièce jointe'}
                        className="relative block h-16 w-16 overflow-hidden rounded-lg border border-border bg-muted"
                    >
                        <Image
                            src={file.url}
                            alt={file.filename ?? 'Pièce jointe'}
                            fill
                            sizes="64px"
                            className="object-cover"
                            unoptimized
                        />
                    </a>
                </li>
            ))}
        </ul>
    );
}
