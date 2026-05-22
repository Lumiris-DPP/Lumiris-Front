'use client';

import { useMemo } from 'react';
import { Award, FileCheck2, Mail, Sparkles } from 'lucide-react';
import { computeScore } from '@lumiris/core/scoring';
import { mockPassports, mockRepairers } from '@lumiris/mock-data';
import type { AdminAuditLogEntry, Artisan } from '@lumiris/types';
import { Wardrobe, type WardrobeCardItem } from '@lumiris/scoring-ui';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import type { buildArtisanRow } from '@/lib/artisan-analytics';
import { PLUS_ADDON, TIER_MRR } from '@/lib/artisan-analytics';
import { EmptyState } from '../_shared/empty-state';

const SCORING_NOW = new Date('2026-04-30T08:00:00Z');

export function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function InfoCard({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="border-border bg-card rounded-xl border p-3">
            <p className="text-muted-foreground mb-1 text-[10px] uppercase tracking-wider">{label}</p>
            <div className="text-foreground">{children}</div>
        </div>
    );
}

interface SynthesisTabProps {
    artisan: Artisan;
    row: ReturnType<typeof buildArtisanRow>;
    auditLog: readonly AdminAuditLogEntry[];
}

export function SynthesisTab({ artisan, row, auditLog }: SynthesisTabProps) {
    const timeline = useMemo(() => buildTimeline(auditLog, artisan).slice(0, 4), [auditLog, artisan]);

    return (
        <div className="space-y-4 text-xs">
            <InfoCard label="Atelier">
                <p>
                    {artisan.atelierName} · {artisan.city}, {artisan.region}
                </p>
                <p className="text-muted-foreground mt-0.5 font-mono text-[11px]">
                    FR-{artisan.id.toUpperCase()}-PROXY
                </p>
            </InfoCard>
            <InfoCard label="Spécialités">
                <ul className="flex flex-wrap gap-1.5">
                    {artisan.specialities.map((s) => (
                        <Badge key={s} variant="outline" className="text-[10px]">
                            {s}
                        </Badge>
                    ))}
                </ul>
            </InfoCard>
            <InfoCard label="Labels">
                <div className="flex flex-wrap gap-1.5">
                    {artisan.epvLabeled ? (
                        <Badge
                            variant="outline"
                            className="border-lumiris-emerald/40 text-lumiris-emerald gap-1 text-[10px]"
                        >
                            <Award className="h-3 w-3" /> EPV depuis 2018
                        </Badge>
                    ) : null}
                    {artisan.ofgLabeled ? (
                        <Badge
                            variant="outline"
                            className="border-lumiris-amber/40 text-lumiris-amber gap-1 text-[10px]"
                        >
                            <Award className="h-3 w-3" /> OFG
                        </Badge>
                    ) : null}
                    {!artisan.epvLabeled && !artisan.ofgLabeled ? (
                        <p className="text-muted-foreground italic">Aucun label métier.</p>
                    ) : null}
                </div>
            </InfoCard>
            <InfoCard label="Santé compte">
                <p className="font-mono text-sm">{row.health.total}/100</p>
                <p className="text-muted-foreground mt-0.5 text-[11px]">
                    Capacité {row.health.capacityScore} · Iris {row.health.irisScore} · Overrides{' '}
                    {row.health.overrideScore} ({row.health.overrideCount90d} sur 90j)
                </p>
            </InfoCard>
            <InfoCard label="Bio">
                <p>{artisan.story}</p>
            </InfoCard>

            <section className="space-y-2">
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Activité récente</p>
                {timeline.length === 0 ? (
                    <p className="text-muted-foreground text-xs">Aucun événement enregistré.</p>
                ) : (
                    <ol className="relative space-y-2 border-l border-dashed pl-4 text-xs">
                        {timeline.map((event) => (
                            <li key={event.id} className="relative">
                                <span className="bg-foreground -left-1.25 absolute mt-1 block h-2 w-2 rounded-full" />
                                <p className="text-foreground flex flex-wrap items-center gap-1.5">
                                    {event.kind === 'passport-published' ? (
                                        <FileCheck2 className="text-lumiris-emerald h-3 w-3" />
                                    ) : (
                                        <Sparkles className="text-muted-foreground h-3 w-3" />
                                    )}
                                    <span className="font-mono">{event.label}</span>
                                    {event.actor ? (
                                        <span className="text-muted-foreground">
                                            · <strong>{event.actor}</strong>
                                        </span>
                                    ) : null}
                                    {event.refId ? (
                                        <span className="text-muted-foreground font-mono">· {event.refId}</span>
                                    ) : null}
                                </p>
                                <p className="text-muted-foreground text-[10px]">{fmtDate(event.ts)}</p>
                            </li>
                        ))}
                    </ol>
                )}
            </section>
        </div>
    );
}

export function PassportsTab({ artisan }: { artisan: Artisan }) {
    const items: WardrobeCardItem[] = useMemo(
        () =>
            mockPassports
                .filter((p) => p.artisanId === artisan.id && p.status === 'Published')
                .map((p) => {
                    const score = computeScore(p, {
                        certificates: p.materials.flatMap((m) => m.certifications),
                        artisan,
                        retoucheurs: mockRepairers,
                        now: SCORING_NOW,
                    });
                    return {
                        id: p.id,
                        name: p.garment.reference,
                        brand: artisan.atelierName,
                        grade: score.grade,
                        score: score.total,
                        price: p.garment.retailPrice,
                        passportId: p.id,
                    };
                }),
        [artisan],
    );

    if (items.length === 0) {
        return <EmptyState title="Aucun passeport publié." />;
    }
    return <Wardrobe items={items} density="cozy" />;
}

interface ActionsTabProps {
    artisan: Artisan;
    canContact: boolean;
    canDunning: boolean;
    onContact: () => void;
    onDunning: () => void;
}

export function ActionsTab({ artisan, canContact, canDunning, onContact, onDunning }: ActionsTabProps) {
    return (
        <div className="space-y-4 text-xs">
            <InfoCard label="Plan actif">
                <div className="flex items-baseline justify-between">
                    <p className="text-foreground font-medium">
                        ATELIER {artisan.tier}{' '}
                        {artisan.plus ? <span className="text-lumiris-cyan">+ ATELIER+</span> : null}
                    </p>
                    <p className="font-mono">{TIER_MRR[artisan.tier] + (artisan.plus ? PLUS_ADDON : 0)} €/mois</p>
                </div>
            </InfoCard>
            <InfoCard label="Méthode de paiement (mock)">
                <p className="font-mono text-[11px]">Visa · last4 4242 · expire 12/29</p>
            </InfoCard>
            <InfoCard label="Prochain prélèvement">
                <p className="font-mono text-[11px]">2026-05-15</p>
            </InfoCard>
            <InfoCard label="Création compte">
                <p className="font-mono text-[11px]">
                    {fmtDate(artisan.joinedAt)} · {artisan.tier}
                </p>
            </InfoCard>

            <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={onContact} disabled={!canContact} className="gap-1.5">
                    <Mail className="h-3.5 w-3.5" aria-hidden /> Contacter
                </Button>
                <Button size="sm" variant="outline" onClick={onDunning} disabled={!canDunning} className="gap-1.5">
                    Relancer dunning
                </Button>
            </div>
        </div>
    );
}

interface TimelineEvent {
    id: string;
    ts: string;
    kind: 'audit' | 'passport-published';
    label: string;
    actor?: string;
    refId?: string;
}

function buildTimeline(auditEntries: readonly AdminAuditLogEntry[], artisan: Artisan): readonly TimelineEvent[] {
    const artisanPassports = mockPassports.filter((p) => p.artisanId === artisan.id);
    const passportIds = new Set(artisanPassports.map((p) => p.id));

    const auditEvents: TimelineEvent[] = auditEntries
        .filter((entry) => {
            if (entry.targetId === artisan.id) return true;
            if (typeof entry.payload?.artisanId === 'string' && (entry.payload.artisanId as string) === artisan.id)
                return true;
            if (entry.targetType === 'passport' && passportIds.has(entry.targetId)) return true;
            return false;
        })
        .map((entry) => ({
            id: entry.id,
            ts: entry.ts,
            kind: 'audit' as const,
            label: entry.action,
            actor: entry.actorId,
            refId: entry.targetId,
        }));

    const publishedEvents: TimelineEvent[] = artisanPassports
        .filter((p) => p.status === 'Published')
        .map((p) => ({
            id: `pub-${p.id}`,
            ts: p.publishedAt ?? p.updatedAt ?? p.createdAt,
            kind: 'passport-published' as const,
            label: 'passeport publié',
            refId: p.id,
        }));

    return [...auditEvents, ...publishedEvents]
        .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
        .slice(0, 20);
}
