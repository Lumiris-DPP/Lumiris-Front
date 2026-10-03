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

// Coordonne la lecture et les mutations sans déplacer les transitions du serveur.
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

    // Conserve le motif et les pièces jointes lorsque le serveur refuse l'action.
    function submitReason(reason: string, fileIds: string[]) {
        if (!orderId || !query.data || submitting || query.isError) return;
        if (!canSubmitReason(query.data.order, sheet)) {
            toast('Cette action n’est plus disponible. Actualise le suivi.');
            return;
        }
        const vars = { orderId, input: { reason, fileIds } };
        // Ferme la feuille uniquement après confirmation de la mutation.
        function done(message: string) {
            return () => {
                toast(message);
                setSheet(null);
            };
        }
        // Présente l’échec en laissant la saisie disponible pour un nouvel essai.
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

    // Confirme la réception seulement si la dernière lecture la permet encore.
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
