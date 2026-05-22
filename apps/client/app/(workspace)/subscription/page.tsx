import { WorkspaceHeader } from '@/features/workspace-header';
import { Subscription } from '@/features/subscription';

export default function SubscriptionPage() {
    return (
        <>
            <WorkspaceHeader title="Abonnement" description="Plan, options et tarifs." />
            <Subscription />
        </>
    );
}
