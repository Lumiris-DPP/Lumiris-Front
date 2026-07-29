import type { Metadata } from 'next';
import { About } from '@/features/about';

export const metadata: Metadata = {
    title: 'À propos · LUMIRIS Vision',
    description: 'Manifeste LUMIRIS, score Iris V2, passeport produit numérique (DPP) textile, équipe et contact.',
};

export default function AboutPage() {
    return <About />;
}
