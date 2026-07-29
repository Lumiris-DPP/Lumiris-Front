'use client';

import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Tag, Leaf, Recycle, BookmarkPlus, BookmarkCheck, Share2, X } from 'lucide-react';
import { CertificatesList } from '@lumiris/scoring-ui';
import type { Certificate, ExternalDpp } from '@lumiris/types';
import { cn } from '@lumiris/ui/lib/cn';
import { useRouter } from 'next/navigation';
import { computeExternalScore } from '@/lib/iris/external-score';
import { addExternalDpp, removeFromWardrobe, useWardrobe } from '@/lib/wardrobe-storage';
import { toast } from '@/lib/toast';
import { SectionHeading } from '@/lib/section';
import { ScoreHero } from '@/features/passport-detail/score-hero';
import { ScoreSheet } from '@/features/passport-detail/score-sheet';

const SECTOR_LABEL_FR: Record<ExternalDpp['sector'], string> = {
    electronics: 'Électronique',
    appliance: 'Électroménager',
    furniture: 'Mobilier',
    battery: 'Batterie',
    toy: 'Jouet',
    textile: 'Textile',
};

const LAYER_DELAYS = {
    identity: 0.25,
    composition: 0.35,
    impact: 0.5,
    proofs: 0.65,
} as const;

export interface ExternalDppDetailProps {
    dpp: ExternalDpp;
}

export function ExternalDppDetail({ dpp }: ExternalDppDetailProps) {
    const router = useRouter();
    const [now] = useState(() => new Date());
    const score = useMemo(() => computeExternalScore(dpp, now), [dpp, now]);
    const [breakdownOpen, setBreakdownOpen] = useState(false);

    const wardrobe = useWardrobe();
    const isSaved = wardrobe.some((entry) => entry.kind === 'external-dpp' && entry.gtin === dpp.gtin);

    const certificates = useMemo<readonly Certificate[]>(
        () =>
            dpp.certifications.map((cert, idx) => ({
                id: `${dpp.gtin}-cert-${idx}`,
                kind: 'CUSTOM',
                customName: cert.name,
                issuer: cert.issuer,
                issuedAt: dpp.manufacturedAt,
                expiresAt: cert.validUntil ?? dpp.manufacturedAt,
                verified: true,
                fileUrl: '',
            })),
        [dpp],
    );

    const onShare = useCallback(async () => {
        const url = typeof window !== 'undefined' ? window.location.href : `https://lumiris.fr/dpp/${dpp.gtin}`;
        const title = `${dpp.brand} · ${dpp.productName}`;
        if (typeof navigator !== 'undefined' && 'share' in navigator) {
            try {
                await navigator.share({ title, url });
                return;
            } catch {
                // user dismissed the share sheet — fall through to clipboard copy
            }
        }
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            await navigator.clipboard.writeText(url);
            toast.success('Lien copié');
        }
    }, [dpp.gtin, dpp.brand, dpp.productName]);

    const onToggleSave = useCallback(() => {
        if (isSaved) removeFromWardrobe(`gtin:${dpp.gtin}`);
        else addExternalDpp(dpp.gtin);
    }, [isSaved, dpp.gtin]);

    const isOpaque = score.grade === 'E';
    const scannedDateLabel = new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(now);

    const recycledOverall = useMemo(() => {
        const totalShare = dpp.materials.reduce((s, m) => s + (m.percentage ?? 0), 0);
        if (totalShare === 0) return 0;
        const weighted = dpp.materials.reduce((s, m) => s + ((m.recycledShare ?? 0) * (m.percentage ?? 0)) / 100, 0);
        return Math.round((weighted / totalShare) * 100);
    }, [dpp.materials]);

    return (
        <div className="relative flex h-full w-full flex-col overflow-y-auto bg-background pb-28">
            <ScoreHero
                grade={score.grade}
                productName={dpp.productName}
                brand={dpp.brand}
                onOpenBreakdown={() => setBreakdownOpen(true)}
            />

            <div
                className="flex flex-col gap-5 px-4"
                style={isOpaque ? { filter: 'saturate(0.3) brightness(0.95)' } : undefined}
            >
                <Layer delay={LAYER_DELAYS.identity}>
                    <SectionHeading>Identité</SectionHeading>
                    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <Tag className="h-4 w-4" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground">{dpp.brand}</p>
                            <p className="text-xs text-muted-foreground">
                                {SECTOR_LABEL_FR[dpp.sector]} · {dpp.productName}
                            </p>
                            <p className="mt-1 text-[11px] text-muted-foreground/80">
                                Émis par {dpp.emitter}
                                {dpp.origin?.region ? ` · ${dpp.origin.region}, ${dpp.origin.country}` : ''}
                                {!dpp.origin?.region && dpp.origin?.country ? ` · ${dpp.origin.country}` : ''}
                            </p>
                        </div>
                    </div>
                    <p className="inline-flex items-center gap-1.5 self-start rounded-full border border-lumiris-cyan/30 bg-lumiris-cyan/10 px-3 py-1 text-[11px] font-medium text-lumiris-cyan">
                        DPP ESPR · hors LUMIRIS
                    </p>
                </Layer>

                {dpp.materials.length > 0 ? (
                    <Layer delay={LAYER_DELAYS.composition}>
                        <SectionHeading>Composition</SectionHeading>
                        <div className="space-y-2.5">
                            {dpp.materials.map((material, idx) => (
                                <ExternalMaterialRow key={`${idx}-${material.name}`} material={material} />
                            ))}
                        </div>
                    </Layer>
                ) : null}

                <Layer delay={LAYER_DELAYS.impact}>
                    <SectionHeading>Impact</SectionHeading>
                    <ExternalImpactStats dpp={dpp} recycledOverall={recycledOverall} />
                </Layer>

                {certificates.length > 0 ? (
                    <Layer delay={LAYER_DELAYS.proofs}>
                        <SectionHeading>Certifications déclarées</SectionHeading>
                        <CertificatesList certificates={certificates} now={now} />
                        <p className="mt-1 border-t border-border/50 pt-3 text-[11px] leading-relaxed text-muted-foreground italic">
                            Certifications déclarées par {dpp.emitter} dans son DPP ESPR. LUMIRIS les expose telles
                            quelles - aucune vérification humaine de notre côté.
                        </p>
                    </Layer>
                ) : null}

                <p className="mt-2 border-t border-border/50 pt-4 font-mono text-[10px] leading-relaxed text-muted-foreground">
                    GTIN : {dpp.gtin}
                    {dpp.serial ? ` / Série : ${dpp.serial}` : ''} / Scanné : {scannedDateLabel} / Grade {score.grade}
                </p>
            </div>

            <motion.nav
                aria-label="Actions du DPP externe"
                className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-md items-center justify-around gap-1 border-t border-border/50 bg-background/85 px-4 pt-3 pb-6 backdrop-blur-xl"
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 32, delay: 0.4 }}
            >
                <ActionButton onClick={() => router.back()} label="Fermer" Icon={X} />
                <ActionButton onClick={onShare} label="Partager" Icon={Share2} />
                <ActionButton
                    onClick={onToggleSave}
                    label={isSaved ? 'Retirer' : 'Garde-Robe'}
                    Icon={isSaved ? BookmarkCheck : BookmarkPlus}
                    active={isSaved}
                />
            </motion.nav>

            <ScoreSheet open={breakdownOpen} onOpenChange={setBreakdownOpen} score={score} />
        </div>
    );
}

function Layer({ delay, children }: { delay: number; children: React.ReactNode }) {
    return (
        <motion.section
            className="flex flex-col gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.section>
    );
}

interface ExternalMaterialRowProps {
    material: ExternalDpp['materials'][number];
}

function ExternalMaterialRow({ material }: ExternalMaterialRowProps) {
    const recycledShare = material.recycledShare ?? 0;
    const isRecycled = recycledShare > 0;
    const Icon = isRecycled ? Recycle : Leaf;
    const pct = Math.max(0, Math.min(100, material.percentage));

    return (
        <div className="rounded-xl border border-border bg-card p-3.5">
            <div className="flex items-center gap-3">
                <span
                    className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                        isRecycled
                            ? 'bg-lumiris-cyan/15 text-lumiris-cyan'
                            : 'bg-lumiris-emerald/15 text-lumiris-emerald',
                    )}
                >
                    <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">{material.name}</p>
                        <p className="font-mono text-sm font-semibold text-foreground">{pct}%</p>
                    </div>
                    {isRecycled ? (
                        <p className="mt-0.5 truncate text-xs text-lumiris-cyan">Dont {recycledShare}% recyclé</p>
                    ) : null}
                </div>
            </div>
            <div
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${material.name} - ${pct}%`}
                className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted"
            >
                <div
                    className={cn(
                        'h-full rounded-full transition-[width] duration-700',
                        isRecycled ? 'bg-lumiris-cyan' : 'bg-lumiris-emerald',
                    )}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

function ExternalImpactStats({ dpp, recycledOverall }: { dpp: ExternalDpp; recycledOverall: number }) {
    const stats: Array<{ label: string; value: string; tone: 'emerald' | 'cyan' | 'amber'; Icon: typeof Leaf }> = [];

    if (typeof dpp.carbonFootprintKg === 'number') {
        stats.push({
            label: 'CO₂',
            value: `${dpp.carbonFootprintKg.toFixed(1)} kg`,
            tone: 'emerald',
            Icon: Leaf,
        });
    }
    if (recycledOverall > 0) {
        stats.push({
            label: 'Recyclé',
            value: `${recycledOverall} %`,
            tone: 'cyan',
            Icon: Recycle,
        });
    }
    if (typeof dpp.repairabilityIndex === 'number') {
        stats.push({
            label: 'Réparabilité',
            value: `${dpp.repairabilityIndex.toFixed(1)} / 10`,
            tone: 'amber',
            Icon: Tag,
        });
    }

    if (stats.length === 0) return null;

    return (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {stats.map((stat) => (
                <li key={stat.label} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                    <span
                        className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-lg',
                            stat.tone === 'emerald' && 'bg-lumiris-emerald/15 text-lumiris-emerald',
                            stat.tone === 'cyan' && 'bg-lumiris-cyan/15 text-lumiris-cyan',
                            stat.tone === 'amber' && 'bg-lumiris-amber/15 text-lumiris-amber',
                        )}
                    >
                        <stat.Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                            {stat.label}
                        </p>
                        <p className="text-base leading-tight font-semibold text-foreground">{stat.value}</p>
                    </div>
                </li>
            ))}
        </ul>
    );
}

interface ActionButtonProps {
    onClick: () => void;
    label: string;
    Icon: typeof Tag;
    active?: boolean;
}

function ActionButton({ onClick, label, Icon, active = false }: ActionButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'flex flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 transition-colors active:scale-95',
                active ? 'text-lumiris-cyan' : 'text-foreground/80 hover:text-foreground',
            )}
        >
            <Icon className="h-5 w-5" aria-hidden />
            <span className="text-[10px] font-medium tracking-wide">{label}</span>
        </button>
    );
}
