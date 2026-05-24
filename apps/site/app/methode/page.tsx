import type { Metadata } from 'next';
import { MethodeHero } from '@/features/methode-hero';
import { MethodePillars } from '@/features/methode-pillars';
import { MethodeGrades } from '@/features/methode-grades';
import { MethodeRules } from '@/features/methode-rules';
import { MethodeComparison } from '@/features/methode-comparison';
import { MethodeGovernance } from '@/features/methode-governance';

export const metadata: Metadata = {
    title: 'Méthodologie Iris — Score transparent et non achetable | LUMIRIS',
    description:
        'Découvrez la méthodologie Iris : un score environnemental calculé sur 4 piliers (40/25/25/10), open source, auditable et non achetable.',
    alternates: { canonical: '/methode' },
};

export default function MethodePage() {
    return (
        <main className="min-h-screen">
            <MethodeHero />
            <MethodePillars />
            <MethodeGrades />
            <MethodeRules />
            <MethodeComparison />
            <MethodeGovernance />
        </main>
    );
}
