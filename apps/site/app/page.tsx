import { HomeHero } from '@/features/home-hero';
import { HomeManifesto } from '@/features/home-manifesto';
import { HomePassportDemo } from '@/features/home-passport-demo';
import { HomePieces } from '@/features/home-pieces';
import { HomeForWho } from '@/features/home-for-who';
import { HomeStats } from '@/features/home-stats';
import { HomeTrust } from '@/features/home-trust';
import { HomeCta } from '@/features/home-cta';

export default function Home() {
    return (
        <>
            <HomeHero />
            <HomeManifesto />
            <HomePassportDemo />
            <HomePieces />
            <HomeForWho />
            <HomeStats />
            <HomeTrust />
            <HomeCta />
        </>
    );
}
