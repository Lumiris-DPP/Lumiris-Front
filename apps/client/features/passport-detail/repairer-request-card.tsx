'use client';

import { useState } from 'react';
import type { RepairRequestResponse } from '@lumiris/api-client';
import {
    useCompleteRepair,
    useDeclineRepairRequest,
    useRepairerRequests,
    useStartRepair,
    useSubmitQuote,
} from '@lumiris/api-client/react';
import { Button } from '@lumiris/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@lumiris/ui/components/card';
import { Input } from '@lumiris/ui/components/input';
import { Textarea } from '@lumiris/ui/components/textarea';
import { toast } from '@lumiris/ui/components/sonner';
import { MessageThread } from '@/features/repairer-passports/message-thread';

function formatAmount(cents?: number): string {
    if (cents === undefined) return '—';
    return (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

// Sur la page passeport d'un retoucheur : la demande d'intervention qui lui donne accès à ce
// DPP, avec les mêmes actions (devis / démarrer / clôturer) et la messagerie que dans la liste.
export function RepairerRequestCard({ passportId }: { passportId: string }) {
    const { data: requests = [] } = useRepairerRequests();
    const request = requests.find((r) => r.dppFormId === passportId);

    if (!request) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Demande d&apos;intervention</CardTitle>
                <p className="text-xs text-muted-foreground">{request.consumerName ?? 'Client'}</p>
            </CardHeader>
            <CardContent className="space-y-4">
                {request.message ? (
                    <p className="rounded-lg bg-muted/40 p-3 text-sm text-foreground">{request.message}</p>
                ) : null}

                <RequestAction request={request} />

                <MessageThread requestId={request.id} />
            </CardContent>
        </Card>
    );
}

function RequestAction({ request }: { request: RepairRequestResponse }) {
    switch (request.status) {
        case 'PENDING':
            return (
                <div className="space-y-2">
                    <QuoteForm requestId={request.id} />
                    <DeclineAction requestId={request.id} />
                </div>
            );
        case 'DRAFT':
            return (
                <p className="text-sm text-muted-foreground">
                    Devis envoyé : {formatAmount(request.quoteAmountCents)} — {request.quoteDescription}. En attente de
                    la décision du client.
                </p>
            );
        case 'ACCEPTED':
            return <StartAction request={request} />;
        case 'IN_PROGRESS':
            return <CompleteAction request={request} />;
        case 'REFUSED':
            return <p className="text-sm text-muted-foreground">Le client a refusé ce devis.</p>;
        case 'COMPLETED':
            if (request.repairerDeclinedAt) {
                return <p className="text-sm text-muted-foreground">Vous avez décliné cette demande.</p>;
            }
            if (request.quoteRefusedAt) {
                return <p className="text-sm text-muted-foreground">Le client a refusé votre devis.</p>;
            }
            return <p className="text-sm text-muted-foreground">Intervention terminée.</p>;
        default:
            return null;
    }
}

function DeclineAction({ requestId }: { requestId: string }) {
    const declineRequest = useDeclineRepairRequest();
    const [expanded, setExpanded] = useState(false);
    const [reason, setReason] = useState('');

    if (!expanded) {
        return (
            <div className="flex justify-end">
                <Button type="button" variant="ghost" size="sm" onClick={() => setExpanded(true)}>
                    Refuser la demande
                </Button>
            </div>
        );
    }

    function onDecline() {
        declineRequest.mutate(
            { requestId, reason: reason.trim() || undefined },
            {
                onSuccess: () => toast.success('Demande déclinée.'),
                onError: () => toast.error('Impossible de décliner la demande.'),
            },
        );
    }

    return (
        <div className="space-y-2 rounded-lg border border-border p-3">
            <p className="text-[11px] tracking-wider text-muted-foreground uppercase">Refuser la demande</p>
            <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Motif du refus, pour le client (optionnel)"
                rows={2}
                className="min-h-0"
            />
            <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setExpanded(false)}>
                    Annuler
                </Button>
                <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={declineRequest.isPending}
                    onClick={onDecline}
                >
                    {declineRequest.isPending ? 'Envoi…' : 'Confirmer le refus'}
                </Button>
            </div>
        </div>
    );
}

function QuoteForm({ requestId }: { requestId: string }) {
    const submitQuote = useSubmitQuote();
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');

    function onSubmit(e: React.SyntheticEvent) {
        e.preventDefault();
        const amountCents = Math.round(parseFloat(amount.replace(',', '.')) * 100);
        if (!amountCents || amountCents <= 0 || !description.trim()) return;
        submitQuote.mutate(
            { requestId, req: { amountCents, description: description.trim() } },
            {
                onSuccess: () => toast.success('Devis envoyé.'),
                onError: () => toast.error("Impossible d'envoyer le devis."),
            },
        );
    }

    return (
        <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-border p-3">
            <p className="text-[11px] tracking-wider text-muted-foreground uppercase">Envoyer un devis</p>
            <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
                <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Montant (€)"
                    aria-label="Montant du devis en euros"
                />
                <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description de l'intervention"
                    rows={2}
                    className="min-h-0"
                />
            </div>
            <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={submitQuote.isPending}>
                    {submitQuote.isPending ? 'Envoi…' : 'Envoyer le devis'}
                </Button>
            </div>
        </form>
    );
}

function StartAction({ request }: { request: RepairRequestResponse }) {
    const startRepair = useStartRepair();

    return (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
            <p className="text-sm text-muted-foreground">
                {request.appointmentAt
                    ? `RDV le ${new Date(request.appointmentAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                    : 'Devis accepté.'}
            </p>
            <Button
                size="sm"
                disabled={startRepair.isPending}
                onClick={() =>
                    startRepair.mutate(request.id, {
                        onError: () => toast.error("Impossible de démarrer l'intervention."),
                    })
                }
            >
                Démarrer l&apos;intervention
            </Button>
        </div>
    );
}

function CompleteAction({ request }: { request: RepairRequestResponse }) {
    const completeRepair = useCompleteRepair();

    return (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
            <p className="text-sm text-muted-foreground">
                Intervention en cours — ajoutez un événement ci-dessous une fois terminée.
            </p>
            <Button
                size="sm"
                disabled={completeRepair.isPending}
                onClick={() =>
                    completeRepair.mutate(request.id, {
                        onSuccess: () => toast.success('Intervention marquée comme terminée.'),
                        onError: () => toast.error('Impossible de clôturer la demande.'),
                    })
                }
            >
                {completeRepair.isPending ? 'Clôture…' : 'Marquer comme terminé'}
            </Button>
        </div>
    );
}
