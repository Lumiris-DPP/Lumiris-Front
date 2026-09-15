import type { Metadata } from 'next';
import { Help } from '@/features/help';

export const metadata: Metadata = {
    title: 'Aide & Support · LUMIRIS Vision',
    description: 'FAQ LUMIRIS — score Iris, scan du QR, confidentialité, compte — et contact direct du support.',
};

export default function HelpPage() {
    return <Help />;
}
