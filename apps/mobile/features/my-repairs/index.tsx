'use client';

import { useMemo, useState, type SyntheticEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Clock3, MessageCircle, ScrollText, Send, Wrench, X, XCircle } from 'lucide-react';
import {
    isApiError,
    useAcceptQuote,
    useCancelRepairRequest,
    useMyRepairRequests,
    useRefuseQuote,
    useRepairMessages,
    useSendMessage,
} from '@lumiris/api-client/react';
import type { RepairRequestResponse, RepairRequestStatus } from '@lumiris/api-client';

const STATUS_LABEL: Record<RepairRequestStatus, string> = {
    PENDING: 'En attente de devis',
    DRAFT: 'Devis reçu',
    ACCEPTED: 'Rendez-vous confirmé',
    REFUSED: 'Devis refusé',
    IN_PROGRESS: 'En cours',
    COMPLETED: 'Terminée',
};

const STATUS_ORDER: readonly RepairRequestStatus[] = ['PENDING', 'DRAFT', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'];

export function MyRepairs() {
    const router = useRouter();
    const { data: requests, isLoading } = useMyRepairRequests();
    const [detailId, setDetailId] = useState<string | null>(null);

    const grouped = useMemo(() => {
        const buckets: Record<RepairRequestStatus, RepairRequestResponse[]> = {
            PENDING: [],
            DRAFT: [],
            ACCEPTED: [],
            REFUSED: [],
            IN_PROGRESS: [],
            COMPLETED: [],
        };
        for (const request of [...(requests ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
            buckets[request.status]?.push(request);
        }
        // REFUSED requests auto-transition to COMPLETED server-side; fold defensively just in case.
        buckets.COMPLETED = [...(buckets.COMPLETED ?? []), ...(buckets.REFUSED ?? [])];
        buckets.REFUSED = [];
        return buckets;
    }, [requests]);

    const total = requests?.length ?? 0;
    const detail = requests?.find((r) => r.id === detailId) ?? null;

    return (
        <div className="bg-background flex h-full flex-col overflow-y-auto pb-24">
            <motion.header
                className="flex items-center gap-3 px-4 pb-3 pt-12"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <button
                    type="button"
                    onClick={() => router.back()}
                    aria-label="Retour"
                    className="border-border bg-card text-foreground inline-flex h-9 w-9 items-center justify-center rounded-full border"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="min-w-0 flex-1">
                    <h1 className="text-foreground text-base font-bold">Mes demandes</h1>
                    <p className="text-muted-foreground text-xs">
                        {total} demande{total > 1 ? 's' : ''}
                    </p>
                </div>
            </motion.header>

            {!isLoading && total === 0 ? <Empty /> : null}

            <div className="flex flex-col gap-5 px-4">
                {STATUS_ORDER.map((status) => {
                    const items = grouped[status] ?? [];
                    if (items.length === 0) return null;
                    return (
                        <section key={status} className="flex flex-col gap-2">
                            <h2 className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                                {STATUS_LABEL[status]} ({items.length})
                            </h2>
                            <ul className="flex flex-col gap-2">
                                {items.map((request) => (
                                    <li key={request.id}>
                                        <RequestCard request={request} onView={() => setDetailId(request.id)} />
                                    </li>
                                ))}
                            </ul>
                        </section>
                    );
                })}
            </div>

            <AnimatePresence>
                {detail ? <RequestDetailOverlay request={detail} onClose={() => setDetailId(null)} /> : null}
            </AnimatePresence>
        </div>
    );
}

function Empty() {
    return (
        <motion.div
            className="flex flex-1 flex-col items-center justify-center gap-4 px-8 pb-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="border-border/60 bg-card flex h-16 w-16 items-center justify-center rounded-3xl border">
                <Wrench className="text-muted-foreground h-7 w-7" />
            </div>
            <div>
                <h2 className="text-foreground text-base font-semibold">Aucune demande pour l&apos;instant</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                    Trouve un retoucheur près de chez toi et lance ta première retouche.
                </p>
            </div>
            <Link
                href="/local"
                className="bg-foreground text-primary-foreground inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
            >
                <Wrench className="h-4 w-4" />
                Voir les retoucheurs
            </Link>
        </motion.div>
    );
}

function StatusIcon({ status }: { status: RepairRequestStatus }) {
    if (status === 'COMPLETED') return <CheckCircle2 className="text-lumiris-emerald h-3.5 w-3.5" />;
    if (status === 'REFUSED') return <XCircle className="text-muted-foreground h-3.5 w-3.5" />;
    return <Clock3 className="text-lumiris-cyan h-3.5 w-3.5" />;
}

function RequestCard({ request, onView }: { request: RepairRequestResponse; onView: () => void }) {
    const repairerName = request.repairerDisplayName ?? 'Retoucheur';
    const reference = request.dppProductName ?? 'Pièce non précisée';
    const date = new Date(request.createdAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

    return (
        <article className="border-border/60 bg-card flex flex-col gap-2 rounded-2xl border p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-foreground truncate text-sm font-semibold">{repairerName}</p>
                    <p className="text-muted-foreground truncate text-xs">{reference}</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold">
                    <StatusIcon status={request.status} />
                    {STATUS_LABEL[request.status]}
                </span>
            </div>

            <div className="text-muted-foreground flex items-center justify-between text-[11px]">
                <span>{date}</span>
                {request.quoteAmountCents != null ? (
                    <span className="text-foreground font-mono">{(request.quoteAmountCents / 100).toFixed(2)} €</span>
                ) : null}
            </div>

            <div className="mt-1 flex items-center justify-end gap-2">
                <button
                    type="button"
                    onClick={onView}
                    className="border-border bg-card text-foreground inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-medium"
                >
                    <ScrollText className="h-3 w-3" />
                    Voir le détail
                </button>
            </div>
        </article>
    );
}

function RequestDetailOverlay({ request, onClose }: { request: RepairRequestResponse; onClose: () => void }) {
    const { data: messages } = useRepairMessages(request.id);
    const acceptQuote = useAcceptQuote();
    const refuseQuote = useRefuseQuote();
    const cancelRequest = useCancelRepairRequest();
    const sendMessage = useSendMessage(request.id);

    const [appointmentAt, setAppointmentAt] = useState('');
    const [messageBody, setMessageBody] = useState('');
    const [error, setError] = useState<string | null>(null);

    const canCancel = request.status !== 'COMPLETED';
    const canRespondToQuote = request.status === 'DRAFT';

    function onAccept(event: SyntheticEvent<HTMLFormElement>): void {
        event.preventDefault();
        if (!appointmentAt) {
            setError('Choisis une date de rendez-vous.');
            return;
        }
        setError(null);
        acceptQuote.mutate(
            { requestId: request.id, req: { appointmentAt: new Date(appointmentAt).toISOString() } },
            { onError: (err) => setError(isApiError(err) ? err.message : "Impossible d'accepter le devis.") },
        );
    }

    function onRefuse(): void {
        setError(null);
        refuseQuote.mutate(request.id, {
            onError: (err) => setError(isApiError(err) ? err.message : 'Impossible de refuser le devis.'),
        });
    }

    function onCancel(): void {
        setError(null);
        cancelRequest.mutate(request.id, {
            onError: (err) => setError(isApiError(err) ? err.message : "Impossible d'annuler la demande."),
        });
    }

    function onSendMessage(event: SyntheticEvent<HTMLFormElement>): void {
        event.preventDefault();
        const body = messageBody.trim();
        if (!body) return;
        sendMessage.mutate(
            { body },
            {
                onSuccess: () => setMessageBody(''),
                onError: (err) => setError(isApiError(err) ? err.message : "Impossible d'envoyer le message."),
            },
        );
    }

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="bg-background/70 absolute inset-0 backdrop-blur-sm" onClick={onClose} role="presentation" />
            <motion.div
                role="dialog"
                aria-label={`Détail demande ${request.id}`}
                className="border-border bg-card relative mx-4 mb-8 flex max-h-[85vh] w-full max-w-sm flex-col overflow-y-auto rounded-3xl border p-5 shadow-2xl"
                initial={{ y: 60 }}
                animate={{ y: 0 }}
                exit={{ y: 60 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            >
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Fermer"
                    className="border-border/60 bg-card text-foreground absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border"
                >
                    <X className="h-3.5 w-3.5" />
                </button>

                <h2 className="text-foreground text-base font-semibold">
                    {request.repairerDisplayName ?? 'Retoucheur'}
                </h2>
                <p className="text-muted-foreground text-xs">{request.dppProductName ?? 'Pièce non précisée'}</p>

                {request.message ? (
                    <p className="text-foreground mt-3 whitespace-pre-line text-sm leading-relaxed">
                        {request.message}
                    </p>
                ) : null}

                {request.quoteAmountCents != null ? (
                    <div className="border-border/60 bg-background mt-3 flex flex-col gap-1 rounded-2xl border p-3">
                        <p className="text-foreground text-sm font-semibold">
                            Devis : {(request.quoteAmountCents / 100).toFixed(2)} €
                        </p>
                        {request.quoteDescription ? (
                            <p className="text-muted-foreground text-xs">{request.quoteDescription}</p>
                        ) : null}
                    </div>
                ) : null}

                {request.appointmentAt ? (
                    <p className="text-muted-foreground mt-3 text-xs">
                        Rendez-vous le{' '}
                        {new Date(request.appointmentAt).toLocaleString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </p>
                ) : null}

                {canRespondToQuote ? (
                    <form onSubmit={onAccept} className="mt-4 flex flex-col gap-2">
                        <label
                            htmlFor="appointment-at"
                            className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider"
                        >
                            Rendez-vous souhaité
                        </label>
                        <input
                            id="appointment-at"
                            type="datetime-local"
                            value={appointmentAt}
                            onChange={(e) => setAppointmentAt(e.target.value)}
                            aria-label="Rendez-vous souhaité"
                            className="border-border bg-background text-foreground rounded-xl border px-3 py-2 text-sm"
                        />
                        <div className="mt-1 flex gap-2">
                            <button
                                type="submit"
                                disabled={acceptQuote.isPending}
                                className="bg-foreground text-primary-foreground flex-1 rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-50"
                            >
                                Accepter le devis
                            </button>
                            <button
                                type="button"
                                onClick={onRefuse}
                                disabled={refuseQuote.isPending}
                                className="border-lumiris-rose/30 text-lumiris-rose rounded-full border px-4 py-2 text-xs font-medium disabled:opacity-50"
                            >
                                Refuser
                            </button>
                        </div>
                    </form>
                ) : null}

                {canCancel ? (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={cancelRequest.isPending}
                        className="border-border text-muted-foreground mt-3 self-start rounded-full border px-3 py-1 text-[11px] font-medium disabled:opacity-50"
                    >
                        Annuler la demande
                    </button>
                ) : null}

                {error ? (
                    <p className="text-destructive mt-2 text-xs" role="alert">
                        {error}
                    </p>
                ) : null}

                <div className="mt-4 flex flex-col gap-2">
                    <h3 className="text-muted-foreground inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider">
                        <MessageCircle className="h-3 w-3" /> Messages
                    </h3>
                    <ul className="flex flex-col gap-1.5">
                        {(messages ?? []).map((m) => (
                            <li
                                key={m.id}
                                className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-xs ${
                                    m.fromRepairer
                                        ? 'bg-secondary/40 text-foreground self-start'
                                        : 'bg-foreground text-primary-foreground self-end'
                                }`}
                            >
                                {m.body}
                            </li>
                        ))}
                        {(messages ?? []).length === 0 ? (
                            <p className="text-muted-foreground/70 text-[11px] italic">Aucun message pour l’instant.</p>
                        ) : null}
                    </ul>
                    <form onSubmit={onSendMessage} className="mt-1 flex items-center gap-2">
                        <input
                            type="text"
                            value={messageBody}
                            onChange={(e) => setMessageBody(e.target.value)}
                            placeholder="Écrire un message…"
                            className="border-border bg-background text-foreground placeholder:text-muted-foreground/60 flex-1 rounded-full border px-3 py-2 text-xs outline-none"
                            aria-label="Écrire un message"
                        />
                        <button
                            type="submit"
                            disabled={sendMessage.isPending || messageBody.trim().length === 0}
                            aria-label="Envoyer"
                            className="bg-foreground text-primary-foreground inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full disabled:opacity-50"
                        >
                            <Send className="h-3.5 w-3.5" />
                        </button>
                    </form>
                </div>

                <p className="text-muted-foreground/80 mt-4 text-[11px]">
                    Créée le{' '}
                    {new Date(request.createdAt).toLocaleString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </p>
            </motion.div>
        </motion.div>
    );
}
