import type { Metadata } from 'next';
import { LegalNotice } from '@lumiris/ui/components/legal';

export const metadata: Metadata = {
    title: 'Mentions légales — Lumiris Vision',
    description: 'Éditeur, directeur de la publication et hébergement.',
};

export default function MentionsLegalesPage() {
    return <LegalNotice appLabel="Lumiris Vision" />;
}
