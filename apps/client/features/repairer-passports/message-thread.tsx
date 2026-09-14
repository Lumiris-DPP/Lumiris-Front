'use client';

import { useState } from 'react';
import { useRepairerMessages, useSendRepairerMessage } from '@lumiris/api-client/react';
import { Button } from '@lumiris/ui/components/button';
import { Input } from '@lumiris/ui/components/input';
import { cn } from '@lumiris/ui/lib/cn';

export function MessageThread({ requestId }: { requestId: string }) {
    const { data: messages = [] } = useRepairerMessages(requestId);
    const sendMessage = useSendRepairerMessage(requestId);
    const [body, setBody] = useState('');

    function onSubmit(e: React.SyntheticEvent) {
        e.preventDefault();
        const trimmed = body.trim();
        if (!trimmed || sendMessage.isPending) return;
        sendMessage.mutate({ body: trimmed }, { onSuccess: () => setBody('') });
    }

    return (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex max-h-56 flex-col gap-2 overflow-y-auto">
                {messages.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Aucun message pour l&apos;instant.</p>
                ) : (
                    messages.map((m) => (
                        <div
                            key={m.id}
                            className={cn(
                                'max-w-[85%] rounded-lg px-3 py-1.5 text-xs',
                                m.fromRepairer
                                    ? 'self-end bg-lumiris-cyan text-white'
                                    : 'self-start bg-card text-foreground',
                            )}
                        >
                            <p className="whitespace-pre-wrap">{m.body}</p>
                            <p
                                className={cn(
                                    'mt-0.5 text-[10px]',
                                    m.fromRepairer ? 'text-white/70' : 'text-muted-foreground',
                                )}
                            >
                                {new Date(m.createdAt).toLocaleString('fr-FR', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>
                    ))
                )}
            </div>
            <form onSubmit={onSubmit} className="flex gap-2">
                <Input
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Écrire un message…"
                    className="h-8 text-xs"
                    aria-label="Message"
                />
                <Button type="submit" size="sm" className="h-8" disabled={!body.trim() || sendMessage.isPending}>
                    Envoyer
                </Button>
            </form>
        </div>
    );
}
