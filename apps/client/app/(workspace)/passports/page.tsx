import { PlusCircle } from 'lucide-react';
import { CreatePassportCta } from '@/features/quota-upsell/create-passport-cta';
import { WorkspaceHeader } from '@/features/workspace-header';
import { PassportsList } from '@/features/passports-list';

export default function PassportsPage() {
    return (
        <>
            <WorkspaceHeader
                title="Passeports"
                description="Vos pièces et leur DPP."
                actions={
                    <CreatePassportCta className="bg-lumiris-emerald hover:bg-lumiris-emerald/90 text-white">
                        <PlusCircle className="mr-1.5 h-4 w-4" /> Nouveau passeport
                    </CreatePassportCta>
                }
            />
            <PassportsList />
        </>
    );
}
