import type { Metadata } from 'next';
import { PrivacyPolicy } from '@lumiris/ui/components/legal';

export const metadata: Metadata = {
    title: 'Politique de confidentialité — Console Lumiris',
    description: 'Données traitées, finalités, durées de conservation et droits RGPD.',
};

export default function ConfidentialitePage() {
    return <PrivacyPolicy appLabel="la console d’administration Lumiris" />;
}
