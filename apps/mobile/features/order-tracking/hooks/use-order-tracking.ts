'use client';

import { useState } from 'react';
import {
    useCancelOrder,
    useConfirmDelivery,
    useOpenDispute,
    useOrderDetail,
    usePostOrderMessage,
    useRequestReturn,
} from '@lumiris/api-client/react';
import { toast } from '@/lib/toast';
import { canSubmitReason, type SheetKind } from '../models/tracking-model';

// Charge le suivi et gère les actions permises sur la commande.
export function useOrderTracking(orderId: string | null, isAuthenticated: boolean) {
    const query = useOrderDetail(orderId, { enabled: isAuthenticated && Boolean(orderId) });
    const [sheet, setSheet] = useState<SheetKind | null>(null);
    const confirmDelivery = useConfirmDelivery();
    const requestReturn = useRequestReturn();
    const openDispute = useOpenDispute();
    const postMessage = usePostOrderMessage();
    const cancelOrder = useCancelOrder();
    const submitting =
        requestReturn.isPending ||
        openDispute.isPending ||
        postMessage.isPending ||
        cancelOrder.isPending ||
        confirmDelivery.isPending;

    // Envoie le motif pour l’action autorisée et choisie.
    function submitReason(reason: string, fileIds: string[]) {
        if (!orderId || !query.data || submitting || query.isError) return;
        if (!canSubmitReason(query.data.order, sheet)) {
            toast('Cette action n’est plus disponible. Actualise le suivi.');
            return;
        }
        const vars = { orderId, input: { reason, fileIds } };

        // Prépare la confirmation qui ferme la feuille après succès.
        function done(message: string) {
            return () => {
                toast(message);
                setSheet(null);
            };
        }

        // Affiche la raison de l’échec de l’action.
        function failed(error: Error) {
            toast(error.message || 'Action impossible pour le moment.');
        }
        switch (sheet) {
            case 'return':
                requestReturn.mutate(vars, {
                    onSuccess: done('Demande de retour envoyée à l’atelier.'),
                    onError: failed,
                });
                break;
            case 'dispute':
                openDispute.mutate(vars, {
                    onSuccess: done('Litige ouvert — Lumiris suit le dossier.'),
                    onError: failed,
                });
                break;
            case 'cancel':
                cancelOrder.mutate(vars, {
                    onSuccess: done('Commande annulée — tu es intégralement remboursé.'),
                    onError: failed,
                });
                break;
            case 'message':
                postMessage.mutate(vars, { onSuccess: done('Message envoyé à l’atelier.'), onError: failed });
                break;
        }
    }

    // Confirme la réception si le serveur l’autorise encore.
    function confirmReception() {
        if (!orderId || submitting || query.isError || !query.data?.order.canConfirmDelivery) return;
        confirmDelivery.mutate(
            { orderId, input: undefined },
            {
                onSuccess: () => toast('Réception confirmée.'),
                onError: (error) => toast(error.message || 'Action impossible pour le moment.'),
            },
        );
    }

    return { ...query, sheet, setSheet, submitting, submitReason, confirmReception };
}
