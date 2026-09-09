import type { Metadata } from 'next';
import { PrivacyPolicy } from '@lumiris/ui/components/legal';

export const metadata: Metadata = {
    title: 'Politique de confidentialité — Lumiris Atelier',
    description: 'Données traitées, finalités, durées de conservation et droits RGPD.',
};

export default function ConfidentialitePage() {
    return <PrivacyPolicy appLabel="Lumiris Atelier" />;
}
