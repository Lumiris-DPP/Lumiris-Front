import { WorkspaceHeader } from '@/features/workspace-header';
import { PayoutSchedule } from '@/features/payout-schedule';

export default function TreasuryPage() {
    return (
        <>
            <WorkspaceHeader title="Trésorerie" description="Quand chaque vente vous est versée, et pourquoi." />
            <PayoutSchedule />
        </>
    );
}
