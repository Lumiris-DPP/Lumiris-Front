import { WorkspaceHeader } from '@/features/workspace-header';
import { InvoicesList } from '@/features/invoices-list';

export default function InvoicesPage() {
    return (
        <>
            <WorkspaceHeader title="Factures" description="Scan, fournisseurs, liens passeport." />
            <InvoicesList />
        </>
    );
}
