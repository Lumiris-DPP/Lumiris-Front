'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ExternalLink, Sparkles } from 'lucide-react';
import type { AdminAuditLogEntry, Passport } from '@lumiris/types';
import { mockArtisans, mockInvoices } from '@lumiris/mock-data';
import { CompositionList, FactureOcrViewer, ManufacturingTimeline, PassportPhonePreview } from '@lumiris/scoring-ui';
import { Badge } from '@lumiris/ui/components/badge';
import { DetailDrawer } from '@lumiris/ui/components/detail-drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@lumiris/ui/components/tabs';
import { cn } from '@lumiris/ui/lib/cn';
import { useAdminAuditLog } from '@/lib/auth';
import { CuratorActions } from './curator-actions';
import { useCurationStore } from './curation-store';
import { deriveEffectiveStatus, useIrisScore } from './hooks';
import { BreakdownSection } from './inspection/breakdown-section';
import { HistorySection } from './inspection/history-section';
import { SimulatorSection } from './inspection/simulator-section';
import { STATUS_LABEL, STATUS_TONE } from './status';

interface PassportDrawerProps {
    passport: Passport | null;
    onClose: () => void;
}

export function PassportDrawer({ passport, onClose }: PassportDrawerProps) {
    return (
        <DetailDrawer
            open={passport !== null}
            onOpenChange={(open) => !open && onClose()}
            title={passport?.garment.reference ?? ''}
            subtitle={passport ? subtitleFor(passport) : ''}
            width="md"
            tabs={passport ? tabs(passport) : []}
            footer={passport ? <DrawerFooter passport={passport} /> : null}
        />
    );
}

function subtitleFor(passport: Passport): string {
    const artisan = mockArtisans.find((a) => a.id === passport.artisanId);
    return `${artisan?.atelierName ?? '-'} · ${passport.id}`;
}

function tabs(passport: Passport) {
    return [
        { value: 'detail', label: 'Détail', content: <DetailTab passport={passport} /> },
        { value: 'iris', label: 'Iris', content: <IrisTab passport={passport} /> },
        { value: 'audit', label: 'Audit', content: <AuditTab passport={passport} /> },
    ];
}

function DetailTab({ passport }: { passport: Passport }) {
    const score = useIrisScore(passport);
    const artisan = mockArtisans.find((a) => a.id === passport.artisanId);
    const { overlays } = useCurationStore();
    const overlay = overlays.get(passport.id);

    const linkedInvoices = useMemo(() => {
        const refs = new Set(passport.materials.map((m) => m.invoiceRef).filter(Boolean));
        return mockInvoices.filter((inv) => refs.has(inv.id));
    }, [passport]);

    const inconsistencies = passport.materials.filter((m) => !m.invoiceRef && m.percentage > 0);

    return (
        <div className="space-y-5">
            <PassportPhonePreview
                passport={passport}
                artisan={artisan}
                score={score}
                overrideGrade={overlay?.overrideGrade}
            />

            <section>
                <h3 className="text-foreground mb-2 text-sm font-semibold">Composition</h3>
                <CompositionList composition={passport.materials} now={new Date('2026-04-30T08:00:00Z')} />
            </section>

            <section>
                <h3 className="text-foreground mb-2 text-sm font-semibold">Étapes de fabrication</h3>
                <ManufacturingTimeline steps={passport.steps} />
            </section>

            <section>
                <h3 className="text-foreground mb-2 text-sm font-semibold">Factures OCR</h3>
                {linkedInvoices.length === 0 ? (
                    <p className="text-muted-foreground text-xs">Aucune facture liée.</p>
                ) : (
                    <div className="space-y-2">
                        {linkedInvoices.map((inv) => (
                            <FactureOcrViewer key={inv.id} invoice={inv} />
                        ))}
                    </div>
                )}
                {inconsistencies.length > 0 ? (
                    <div className="border-lumiris-amber/30 bg-lumiris-amber/5 mt-3 rounded-xl border p-3 text-xs">
                        <p className="text-lumiris-amber inline-flex items-center gap-1 font-semibold">
                            <AlertTriangle className="h-3 w-3" /> Incohérence cross-check artisan
                        </p>
                        <p className="text-foreground mt-1">
                            {inconsistencies.length} ligne(s) de composition sans invoiceRef pour{' '}
                            {artisan?.atelierName ?? 'cet artisan'}.
                        </p>
                    </div>
                ) : null}
            </section>

            <section>
                <h3 className="text-foreground mb-2 text-sm font-semibold">Certificats</h3>
                {passport.certifications.length === 0 ? (
                    <p className="text-muted-foreground text-xs">Aucun certificat joint.</p>
                ) : (
                    <ul className="border-border bg-card divide-border divide-y rounded-xl border text-xs">
                        {passport.certifications.map((c) => (
                            <li key={c.id} className="flex items-baseline justify-between px-3 py-2">
                                <div>
                                    <p className="text-foreground font-medium">
                                        {c.kind} {c.customName ? `· ${c.customName}` : ''}
                                    </p>
                                    <p className="text-muted-foreground text-[10px]">
                                        {c.issuer} · expire {fmtDate(c.expiresAt)}
                                    </p>
                                </div>
                                <Badge variant="outline" className="font-mono text-[10px]">
                                    {c.verified ? 'vérifié' : 'non vérifié'}
                                </Badge>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {overlay?.changesMessage ? (
                <div className="border-lumiris-amber/30 bg-lumiris-amber/5 rounded-xl border p-3 text-xs">
                    <p className="text-lumiris-amber font-medium">Changements demandés</p>
                    <p className="text-foreground mt-1">{overlay.changesMessage}</p>
                </div>
            ) : null}
            {overlay?.flagReason ? (
                <div className="border-lumiris-rose/30 bg-lumiris-rose/5 rounded-xl border p-3 text-xs">
                    <p className="text-lumiris-rose font-medium">Motif de rejet</p>
                    <p className="text-foreground mt-1">{overlay.flagReason}</p>
                </div>
            ) : null}
        </div>
    );
}

function IrisTab({ passport }: { passport: Passport }) {
    const score = useIrisScore(passport);
    const { overlays } = useCurationStore();
    const overlay = overlays.get(passport.id);

    return (
        <div className="space-y-4">
            {overlay?.overrideGrade ? (
                <div className="border-lumiris-cyan/30 bg-lumiris-cyan/5 rounded-xl border p-3 text-xs">
                    <p className="text-lumiris-cyan inline-flex items-center gap-1 font-semibold">
                        <Sparkles className="h-3 w-3" /> Override actif
                    </p>
                    <p className="text-foreground mt-1">
                        Grade affiché <strong>{overlay.overrideGrade}</strong> au lieu de <strong>{score.grade}</strong>
                        .
                    </p>
                    <p className="text-muted-foreground mt-1">{overlay.overrideReason}</p>
                    {overlay.overrideSource ? (
                        <p className="text-muted-foreground mt-0.5 font-mono text-[10px]">
                            source : {overlay.overrideSource}
                        </p>
                    ) : null}
                </div>
            ) : null}

            <Tabs defaultValue="breakdown">
                <TabsList>
                    <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
                    <TabsTrigger value="simulator">Simulator</TabsTrigger>
                    <TabsTrigger value="history">Historique</TabsTrigger>
                </TabsList>
                <TabsContent value="breakdown" className="mt-4 outline-none">
                    <BreakdownSection passport={passport} score={score} />
                </TabsContent>
                <TabsContent value="simulator" className="mt-4 outline-none">
                    <SimulatorSection passport={passport} baseScore={score} />
                </TabsContent>
                <TabsContent value="history" className="mt-4 outline-none">
                    <HistorySection passportId={passport.id} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function AuditTab({ passport }: { passport: Passport }) {
    const auditLog = useAdminAuditLog();
    const entries = useMemo(
        () => auditLog.filter((entry) => entry.targetType === 'passport' && entry.targetId === passport.id),
        [auditLog, passport.id],
    );

    if (entries.length === 0) {
        return <p className="text-muted-foreground text-xs">Pas encore d&apos;historique pour ce passeport.</p>;
    }
    return (
        <ol className="relative space-y-3 border-l border-dashed pl-5">
            {entries.map((entry) => (
                <AuditEntry key={entry.id} entry={entry} />
            ))}
        </ol>
    );
}

function AuditEntry({ entry }: { entry: AdminAuditLogEntry }) {
    return (
        <li className="relative">
            <span className="bg-foreground absolute -left-[27px] top-2 block h-2 w-2 rounded-full" />
            <div className="border-border bg-card rounded-lg border p-3 text-xs">
                <div className="flex items-baseline justify-between gap-3">
                    <p className="text-foreground font-mono text-[11px]">{entry.action}</p>
                    <span className="text-muted-foreground font-mono text-[10px]">
                        {new Date(entry.ts).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </span>
                </div>
                <p className="text-muted-foreground mt-1 truncate text-[11px]">
                    par <strong className="text-foreground">{entry.actorId}</strong> · {entry.actorRole}
                </p>
                {Object.keys(entry.payload).length > 0 ? (
                    <pre className="text-muted-foreground/80 mt-2 overflow-x-auto whitespace-pre-wrap text-[10px]">
                        {JSON.stringify(entry.payload, null, 2)}
                    </pre>
                ) : null}
            </div>
        </li>
    );
}

function DrawerFooter({ passport }: { passport: Passport }) {
    const score = useIrisScore(passport);
    const { overlays } = useCurationStore();
    const overlay = overlays.get(passport.id);
    const status = deriveEffectiveStatus(passport, overlay?.status);
    const [lastAction, setLastAction] = useState<AdminAuditLogEntry | null>(null);

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn('font-mono text-[10px]', STATUS_TONE[status])}>
                    {STATUS_LABEL[status]}
                </Badge>
                {lastAction ? (
                    <Link
                        href={`/audit?focus=${lastAction.id}`}
                        className="text-lumiris-emerald hover:text-lumiris-emerald/80 inline-flex items-center gap-1 font-mono text-[10px] underline-offset-2 hover:underline"
                    >
                        Action <strong>{lastAction.action}</strong> tracée{' '}
                        <ExternalLink className="h-3 w-3" aria-hidden />
                    </Link>
                ) : null}
            </div>
            <CuratorActions passport={passport} score={score} onAfterAction={setLastAction} />
        </div>
    );
}

function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}
