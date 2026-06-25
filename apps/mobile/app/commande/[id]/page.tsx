import { OrderConfirmation } from '@/features/order-confirmation';

export default async function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <OrderConfirmation orderId={id} />;
}
