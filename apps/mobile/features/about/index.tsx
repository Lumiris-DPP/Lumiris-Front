import Link from 'next/link';
import { ArrowLeft, FileText, LifeBuoy, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { LUMIRIS_WEIGHTS } from '@lumiris/core/scoring';
import { SectionLabel } from '@/lib/section';

interface ScorePillar {
    weight: number;
    label: string;
    description: string;
    accent: string;
}

const PILLARS: readonly ScorePillar[] = [
    {
        weight: LUMIRIS_WEIGHTS.transparency,
        label: 'Transparence',
        description: 'Composition complète, factures, photos d’étapes, certifications fibre.',
        accent: 'text-lumiris-emerald',
    },
    {
        weight: LUMIRIS_WEIGHTS.craftsmanship,
        label: 'Savoir-faire',
        description: 'Part artisanale, labels EPV / OFG, durée de garantie déclarée.',
        accent: 'text-lumiris-cyan',
    },
    {
        weight: LUMIRIS_WEIGHTS.impact,
        label: 'Impact',
        description: 'Carbone (fibres × masse), eau, part recyclée, transport.',
        accent: 'text-lumiris-amber',
    },
    {
        weight: LUMIRIS_WEIGHTS.repairability,
        label: 'Réparabilité',
        description: 'Retoucheurs proches, fibres réparables, garantie longue.',
        accent: 'text-lumiris-iris',
    },
];

interface TeamRole {
    title: string;
    detail: string;
}

const TEAM: readonly TeamRole[] = [
    { title: 'Chef de projet', detail: 'Vision produit, roadmap, animation des prompts MVP.' },
    { title: 'Back', detail: 'API LUMIRIS, scoring, authentification, ingestion des passeports.' },
    { title: 'DevOps', detail: 'Monorepo, CI/CD, observabilité, livraison Tauri & web.' },
    { title: 'Design', detail: 'Direction artistique Prismatic Clarity, design system, motion.' },
];

interface LegalLink {
    href: string;
    label: string;
    Icon?: typeof FileText;
}

const LEGAL: readonly LegalLink[] = [
    { href: 'mailto:hello@lumiris.example', label: 'Contact - hello@lumiris.example' },
    { href: '/help', label: 'Aide & FAQ', Icon: LifeBuoy },
    { href: '/about#mentions', label: 'Mentions légales' },
    { href: '/about#cgu', label: 'Conditions générales d’utilisation' },
    { href: '/about#rgpd', label: 'Politique de confidentialité (RGPD)' },
];

export function About() {
    return (
        <div className="relative flex h-full flex-col overflow-y-auto pb-28">
            <header className="px-5 pb-6 pt-[max(env(safe-area-inset-top),3rem)]">
                <Link
                    href="/me"
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Profil
                </Link>

                <div className="mt-6 flex flex-col items-center text-center">
                    <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.32em]">
                        Lumiris
                    </p>
                    <h1 className="text-foreground mt-1 text-3xl font-bold tracking-tight">Vision</h1>
                    <p className="text-muted-foreground mt-3 text-sm">Scanne. Comprends. Choisis bien.</p>
                </div>
            </header>

            <div className="flex flex-col gap-6 px-4">
                <Section title="Le manifeste">
                    <ManifestoLine
                        Icon={ShieldCheck}
                        text="Aucun acteur ne peut payer pour modifier ou améliorer son score Iris."
                    />
                    <ManifestoLine Icon={Sparkles} text="Les suggestions sont triées exclusivement par score." />
                    <ManifestoLine
                        Icon={Sparkles}
                        text="ATELIER+ donne une visibilité prioritaire à score équivalent uniquement."
                    />
                </Section>

                <Section title="Le score Iris V2">
                    <div className="grid grid-cols-2 gap-3">
                        {PILLARS.map((p) => (
                            <PillarCard key={p.label} pillar={p} />
                        ))}
                    </div>
                    <p className="text-muted-foreground mt-4 text-xs leading-relaxed">
                        Algorithme open et déterministe - chaque score est reproductible à partir du passeport et des
                        coefficients ADEME / Higg / WFN publiés.{' '}
                        <Link href="/about#scoring-doc" className="text-foreground underline-offset-4 hover:underline">
                            Documentation complète
                        </Link>
                        .
                    </p>
                </Section>

                <Section title="Le DPP textile">
                    <p className="text-foreground/90 text-sm leading-relaxed">
                        Le passeport produit numérique (DPP) deviendra obligatoire pour toute pièce textile mise sur le
                        marché européen. Le registre central DPP entre en vigueur le <strong>19 juillet 2026</strong>,
                        et l&apos;acte délégué textile précisant les champs obligatoires arrive <strong>mi-2028</strong>
                        . LUMIRIS anticipe ces exigences en stockant dès aujourd&apos;hui les preuves nécessaires :
                        composition, étapes de fabrication, garantie, certifications.
                    </p>
                </Section>

                <Section title="L'équipe">
                    <ul className="flex flex-col gap-3">
                        {TEAM.map((role) => (
                            <li key={role.title} className="flex items-start gap-3">
                                <span className="bg-foreground/10 mt-1 inline-flex h-1.5 w-1.5 shrink-0 rounded-full" />
                                <div>
                                    <p className="text-foreground text-sm font-semibold">{role.title}</p>
                                    <p className="text-muted-foreground text-xs">{role.detail}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Section>

                <Section title="Contact / Légal">
                    <ul className="flex flex-col gap-2">
                        {LEGAL.map((link) => {
                            const isMail = link.href.startsWith('mailto:');
                            const Icon = link.Icon ?? (isMail ? Mail : FileText);
                            const className =
                                'border-border/60 bg-card/60 text-foreground hover:bg-card/80 inline-flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-colors';
                            return (
                                <li key={link.label}>
                                    {isMail ? (
                                        <a href={link.href} className={className}>
                                            <Icon className="text-muted-foreground h-4 w-4" />
                                            {link.label}
                                        </a>
                                    ) : (
                                        <Link href={link.href} className={className}>
                                            <Icon className="text-muted-foreground h-4 w-4" />
                                            {link.label}
                                        </Link>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </Section>

                <p className="text-muted-foreground/70 mt-2 text-center text-[11px]">
                    LUMIRIS Vision · v0.1.0 · Mode démo
                </p>
            </div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="flex flex-col gap-3">
            <SectionLabel title={title} />
            <div className="border-border/60 bg-card/60 rounded-2xl border p-4 backdrop-blur-md">{children}</div>
        </section>
    );
}

function ManifestoLine({ Icon, text }: { Icon: typeof ShieldCheck; text: string }) {
    return (
        <div className="flex items-start gap-3 [&:not(:last-child)]:mb-3">
            <Icon className="text-lumiris-cyan mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-foreground/90 text-sm leading-relaxed">{text}</p>
        </div>
    );
}

function PillarCard({ pillar }: { pillar: ScorePillar }) {
    const percent = Math.round(pillar.weight * 100);
    return (
        <div className="border-border/60 bg-background/40 flex flex-col gap-1.5 rounded-xl border p-3">
            <p className={`${pillar.accent} font-mono text-xl font-bold`}>{percent}%</p>
            <p className="text-foreground text-xs font-semibold">{pillar.label}</p>
            <p className="text-muted-foreground text-[11px] leading-snug">{pillar.description}</p>
        </div>
    );
}
