import type { Metadata } from 'next';
import { VisionHero } from '@/features/vision-hero';
import { VisionPromises } from '@/features/vision-promises';
import { VisionDemo } from '@/features/vision-demo';
import { VisionComparison } from '@/features/vision-comparison';
import { VisionPrivacy } from '@/features/vision-privacy';
import { VisionCta } from '@/features/vision-cta';

export const metadata: Metadata = {
    title: 'VISION - Scanner. Comprendre. Garder. | LUMIRIS',
    description:
        "L'application mobile gratuite pour scanner n'importe quel DPP europeen, consulter le score Iris et gerer votre garde-robe textile.",
    alternates: { canonical: '/vision' },
};

export default function VisionPage() {
    return (
        <main className="min-h-screen">
            <VisionHero />
            <VisionPromises />
            <VisionDemo />
            <VisionComparison />
            <VisionPrivacy />
            <VisionCta />
        </main>
    );
}
