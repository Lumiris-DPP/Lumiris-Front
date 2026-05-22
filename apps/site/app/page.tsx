import { Hero } from '@/features/hero';
import { Ecosystem } from '@/features/ecosystem';
import { IrisPillars } from '@/features/iris-pillars';
import { FeaturedPassports } from '@/features/featured-passports';
import { Personas } from '@/features/personas';
import { RegulatoryTimeline } from '@/features/regulatory-timeline';
import { BusinessModel } from '@/features/business-model';

export default function Home() {
    return (
        <>
            <Hero />
            <Ecosystem />
            <IrisPillars />
            <FeaturedPassports />
            <Personas />
            <RegulatoryTimeline />
            <BusinessModel />
        </>
    );
}
