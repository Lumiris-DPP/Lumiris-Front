'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Loader2, Send } from 'lucide-react';
import type { OrderEvent, SellerOrder } from '@lumiris/api-client';
import { usePostDisputeMessage } from '@lumiris/api-client/react';
import { Button } from '@lumiris/ui/components/button';
import { Textarea } from '@lumiris/ui/components/textarea';
import { toast } from '@lumiris/ui/components/sonner';
import { cn } from '@lumiris/ui/lib/cn';
import { formatDateFr } from '@lumiris/utils';

// Seuls les échanges humains : l'arbitre lit un dialogue, pas un journal technique. Les
// transitions automatiques restent dans l'historique complet, en dessous.
const THREAD_TYPES: ReadonlySet<OrderEvent['type']> = new Set(['MESSAGE', 'DISPUTE_OPENED', 'RETURN_REQUESTED']);

const AUTHOR_LABEL: Record<OrderEvent['actorType'], string> = {
    BUYER: 'Acheteur',
    SELLER: 'Atelier',
    PLATFORM: 'Lumiris',
    SYSTEM: 'Automatique',
};

// Le dossier tel qu'il se lit : qui a dit quoi, avec quelles preuves. L'acheteur d'un côté,
// l'atelier de l'autre — la disposition seule montre où en est le désaccord.
export function DisputeThread({ dispute }: { dispute: SellerOrder }) {
    const messages = dispute.timeline.filter((event) => THREAD_TYPES.has(event.type));

    return (
        <section className="rounded-lg border border-border">
            <h3 className="border-b border-border px-3 py-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Échanges ({messages.length})
            </h3>

            <ul className="max-h-96 space-y-3 overflow-y-auto p-3">
                {messages.length === 0 ? (
                    <li className="text-xs text-muted-foreground">
                        Aucun échange entre les parties — demandez des précisions avant de trancher.
                    </li>
                ) : (
                    messages.map((event) => <ThreadMessage key={event.id} event={event} />)
                )}
            </ul>

            <div className="border-t border-border p-3">
                <ArbitratorReply orderId={dispute.id} />
            </div>
        </section>
    );
}

function ThreadMessage({ event }: { event: OrderEvent }) {
    const fromBuyer = event.actorType === 'BUYER';
    const fromPlatform = event.actorType === 'PLATFORM';
    const attachments = event.attachments ?? [];

    return (
        <li className={cn('flex', fromBuyer ? 'justify-start' : 'justify-end')}>
            <div
                className={cn(
                    'max-w-[80%] rounded-xl px-3 py-2',
                    fromPlatform
                        ? 'bg-lumiris-cyan/10 ring-1 ring-lumiris-cyan/30'
                        : fromBuyer
                          ? 'bg-muted'
                          : 'bg-secondary',
                )}
            >
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                    {AUTHOR_LABEL[event.actorType]} · {formatDateFr(event.createdAt)}
                </p>
                {event.message ? (
                    <p className="mt-1 text-sm whitespace-pre-line text-foreground">{event.message}</p>
                ) : null}
                {attachments.length > 0 ? (
                    <ul className="mt-2 flex flex-wrap gap-2">
                        {attachments.map((file) => (
                            <li key={file.id}>
                                <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="relative block h-20 w-20 overflow-hidden rounded-lg border border-border bg-background"
                                >
                                    <Image
                                        src={file.url}
                                        alt={file.filename ?? 'Preuve'}
                                        fill
                                        sizes="80px"
                                        className="object-cover"
                                        unoptimized
                                    />
                                </a>
                            </li>
                        ))}
                    </ul>
                ) : null}
            </div>
        </li>
    );
}

// Trancher sur un dossier incomplet est le pire résultat possible : l'arbitre doit pouvoir
// réclamer une photo ou une preuve d'expédition avant de décider.
function ArbitratorReply({ orderId }: { orderId: string }) {
    const [message, setMessage] = useState('');
    const postMessage = usePostDisputeMessage();

    const send = () => {
        if (message.trim().length < 3 || postMessage.isPending) return;
        postMessage.mutate(
            { orderId, input: { reason: message.trim() } },
            {
                onSuccess: () => {
                    toast.success('Message transmis aux deux parties.');
                    setMessage('');
                },
                onError: (e) => toast.error(e.message || 'Envoi impossible.'),
            },
        );
    };

    const tooShort = message.trim().length < 3;

    return (
        <>
            <Textarea
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Demander une photo, une preuve d’expédition, une précision…"
                aria-describedby="arbitrator-reply-hint"
            />
            {/* Un bouton grisé sans motif se lit comme une action morte — l'arbitre doit savoir
                qu'il attend un message, pas une permission. */}
            <p id="arbitrator-reply-hint" className="mt-1 text-[11px] text-muted-foreground">
                {tooShort
                    ? 'Saisissez votre message ci-dessus pour l’envoyer aux deux parties.'
                    : 'Envoyé simultanément à l’acheteur et à l’atelier, et tracé au dossier.'}
            </p>
            <Button
                size="sm"
                variant="outline"
                className="mt-2 gap-1.5"
                disabled={tooShort || postMessage.isPending}
                onClick={send}
            >
                {postMessage.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                    <Send className="h-3.5 w-3.5" />
                )}
                Écrire aux deux parties
            </Button>
        </>
    );
}
