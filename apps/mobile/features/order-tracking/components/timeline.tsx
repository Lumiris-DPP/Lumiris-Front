'use client';

import Image from 'next/image';
import { formatDayMonthTimeFr } from '@lumiris/utils';
import type { OrderEvent, OrderStatus } from '@lumiris/api-client';
import {
    BUYER_TRACKING_STEPS,
    ORDER_EVENT_LABEL,
    ORDER_STATUS_LABEL_BUYER,
    trackingStepIndex,
} from '@lumiris/api-client';
import { Check, CircleDot, PackageCheck, Truck } from 'lucide-react';

const STEP_ICON = [CircleDot, Truck, PackageCheck, Check] as const;

export function TrackingSteps({ status }: { status: OrderStatus }) {
    const current = trackingStepIndex(status);
    if (current < 0) {
        return null;
    }

    return (
        <ol className="flex items-start justify-between gap-1">
            {BUYER_TRACKING_STEPS.map((step, index) => {
                const done = index <= current;
                const Icon = STEP_ICON[index] ?? Check;
                return (
                    <li key={step} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                        <div className="flex w-full items-center">
                            <span
                                className={`h-0.5 flex-1 ${index === 0 ? 'bg-transparent' : done ? 'bg-lumiris-cyan' : 'bg-border'}`}
                            />
                            <span
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                                    done
                                        ? 'border-lumiris-cyan bg-lumiris-cyan text-background'
                                        : 'border-border bg-card text-muted-foreground'
                                }`}
                            >
                                <Icon className="h-3.5 w-3.5" aria-hidden />
                            </span>
                            <span
                                className={`h-0.5 flex-1 ${
                                    index === BUYER_TRACKING_STEPS.length - 1
                                        ? 'bg-transparent'
                                        : index < current
                                          ? 'bg-lumiris-cyan'
                                          : 'bg-border'
                                }`}
                            />
                        </div>
                        <span
                            className={`text-center text-[10px] leading-tight ${
                                done ? 'font-semibold text-foreground' : 'text-muted-foreground'
                            }`}
                        >
                            {ORDER_STATUS_LABEL_BUYER[step]}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}

const ACTOR_LABEL: Record<OrderEvent['actorType'], string> = {
    BUYER: 'Toi',
    SELLER: 'L’atelier',
    PLATFORM: 'Lumiris',
    SYSTEM: 'Automatique',
};

export function OrderTimeline({ events }: { events: readonly OrderEvent[] }) {
    if (events.length === 0) {
        return <p className="text-xs text-muted-foreground">Aucun évènement pour l’instant.</p>;
    }

    const ordered = [...events].reverse();
    return (
        <ol className="flex flex-col gap-3 border-l border-border/60 pl-4">
            {ordered.map((event) => (
                <li key={event.id} className="relative">
                    <span
                        aria-hidden
                        className="absolute top-1.5 -left-[21px] h-2 w-2 rounded-full bg-lumiris-cyan ring-4 ring-background"
                    />
                    <p className="text-sm font-medium text-foreground">{ORDER_EVENT_LABEL[event.type]}</p>
                    <p className="text-[11px] text-muted-foreground">
                        {ACTOR_LABEL[event.actorType]} · {formatDayMonthTimeFr(event.createdAt) ?? ''}
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
                        className="relative block h-16 w-16 overflow-hidden rounded-xl border border-border/60 bg-muted"
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
