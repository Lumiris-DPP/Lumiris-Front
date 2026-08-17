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
import { deriveCurationStatus } from '@/lib/curation-status';
import { useIrisScore } from './hooks';
import { BreakdownSection } from './inspection/breakdown-section';
import { HistorySection } from './inspection/history-section';
import { SimulatorSection } from './inspection/simulator-section';
import { STATUS_LABEL, STATUS_TONE } from './status';
import { FIXTURE_NOW } from '@/lib/fixture-clock';

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
                <h3 className="mb-2 text-sm font-semibold text-foreground">Composition</h3>
                <CompositionList composition={passport.materials} now={FIXTURE_NOW} />
            </section>

            <section>
                <h3 className="mb-2 text-sm font-semibold text-foreground">Étapes de fabrication</h3>
                <ManufacturingTimeline steps={passport.steps} />
            </section>

            <section>
                <h3 className="mb-2 text-sm font-semibold text-foreground">Factures OCR</h3>
                {linkedInvoices.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Aucune facture liée.</p>
                ) : (
                    <div className="space-y-2">
                        {linkedInvoices.map((inv) => (
                            <FactureOcrViewer key={inv.id} invoice={inv} />
                        ))}
                    </div>
                )}
                {inconsistencies.length > 0 ? (
                    <div className="mt-3 rounded-xl border border-lumiris-amber/30 bg-lumiris-amber/5 p-3 text-xs">
                        <p className="inline-flex items-center gap-1 font-semibold text-lumiris-amber">
                            <AlertTriangle className="h-3 w-3" /> Incohérence cross-check artisan
                        </p>
                        <p className="mt-1 text-foreground">
                            {inconsistencies.length} ligne(s) de composition sans invoiceRef pour{' '}
                            {artisan?.atelierName ?? 'cet artisan'}.
                        </p>
                    </div>
                ) : null}
            </section>

            <section>
                <h3 className="mb-2 text-sm font-semibold text-foreground">Certificats</h3>
                {passport.certifications.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Aucun certificat joint.</p>
                ) : (
                    <ul className="divide-y divide-border rounded-xl border border-border bg-card text-xs">
                        {passport.certifications.map((c) => (
                            <li key={c.id} className="flex items-baseline justify-between px-3 py-2">
                                <div>
                                    <p className="font-medium text-foreground">
                                        {c.kind} {c.customName ? `· ${c.customName}` : ''}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
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
                <div className="rounded-xl border border-lumiris-amber/30 bg-lumiris-amber/5 p-3 text-xs">
                    <p className="font-medium text-lumiris-amber">Changements demandés</p>
                    <p className="mt-1 text-foreground">{overlay.changesMessage}</p>
                </div>
            ) : null}
            {overlay?.flagReason ? (
                <div className="rounded-xl border border-lumiris-rose/30 bg-lumiris-rose/5 p-3 text-xs">
                    <p className="font-medium text-lumiris-rose">Motif de rejet</p>
                    <p className="mt-1 text-foreground">{overlay.flagReason}</p>
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
                <div className="rounded-xl border border-lumiris-cyan/30 bg-lumiris-cyan/5 p-3 text-xs">
                    <p className="inline-flex items-center gap-1 font-semibold text-lumiris-cyan">
                        <Sparkles className="h-3 w-3" /> Override actif
                    </p>
                    <p className="mt-1 text-foreground">
                        Grade affiché <strong>{overlay.overrideGrade}</strong> au lieu de <strong>{score.grade}</strong>
                        .
                    </p>
                    <p className="mt-1 text-muted-foreground">{overlay.overrideReason}</p>
                    {overlay.overrideSource ? (
                        <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
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
        return <p className="text-xs text-muted-foreground">Pas encore d&apos;historique pour ce passeport.</p>;
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
            <span className="absolute top-2 -left-[27px] block h-2 w-2 rounded-full bg-foreground" />
            <div className="rounded-lg border border-border bg-card p-3 text-xs">
                <div className="flex items-baseline justify-between gap-3">
                    <p className="font-mono text-[11px] text-foreground">{entry.action}</p>
                    <span className="font-mono text-[10px] text-muted-foreground">
                        {new Date(entry.ts).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </span>
                </div>
                <p className="mt-1 truncate text-[11px] text-muted-foreground">
                    par <strong className="text-foreground">{entry.actorId}</strong> · {entry.actorRole}
                </p>
                {Object.keys(entry.payload).length > 0 ? (
                    <pre className="mt-2 overflow-x-auto text-[10px] whitespace-pre-wrap text-muted-foreground/80">
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
    const status = deriveCurationStatus(passport, overlay?.status);
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
                        className="inline-flex items-center gap-1 font-mono text-[10px] text-lumiris-emerald underline-offset-2 hover:text-lumiris-emerald/80 hover:underline"
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
