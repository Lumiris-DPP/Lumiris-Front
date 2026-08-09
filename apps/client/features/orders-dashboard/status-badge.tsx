import type { DisputeStatus, OrderStatus, OrderStatusTone } from '@lumiris/api-client';
import { DISPUTE_STATUS_LABEL, ORDER_STATUS_LABEL_SELLER, ORDER_STATUS_TONE } from '@lumiris/api-client';
import { Badge } from '@lumiris/ui/components/badge';

type BadgeVariant = 'secondary' | 'warning' | 'success' | 'danger';

const TONE_VARIANT: Record<OrderStatusTone, BadgeVariant> = {
    neutral: 'secondary',
    pending: 'warning',
    success: 'success',
    warning: 'danger',
};

// Un litige masque l'état logistique : c'est lui qui appelle une réponse, pas l'étape du colis.
export function OrderStatusBadge({ status, disputeStatus }: { status: OrderStatus; disputeStatus: DisputeStatus }) {
    if (disputeStatus === 'OPEN') {
        return <Badge variant="destructive">{DISPUTE_STATUS_LABEL.OPEN}</Badge>;
    }
    return <Badge variant={TONE_VARIANT[ORDER_STATUS_TONE[status]]}>{ORDER_STATUS_LABEL_SELLER[status]}</Badge>;
}
