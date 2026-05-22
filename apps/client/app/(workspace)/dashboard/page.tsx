import { PlusCircle } from 'lucide-react';
import { CreatePassportCta } from '@/features/quota-upsell/create-passport-cta';
import { WorkspaceHeader } from '@/features/workspace-header';
import { Dashboard } from '@/features/dashboard';

export default function DashboardPage() {
    return (
        <>
            <WorkspaceHeader
                title="Tableau de bord"
                actions={
                    <CreatePassportCta className="bg-lumiris-emerald hover:bg-lumiris-emerald/90 text-white">
                        <PlusCircle className="mr-1.5 h-4 w-4" /> Nouveau passeport
                    </CreatePassportCta>
                }
            />
            <Dashboard />
        </>
    );
}
