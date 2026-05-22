'use client';

import { AlertTriangle, BadgeCheck, Flag, MapPin, ShieldOff } from 'lucide-react';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { DetailDrawer } from '@lumiris/ui/components/detail-drawer';
import { cn } from '@lumiris/ui/lib/cn';
import { anonymiseUserId, type SuspiciousFlag } from '@/lib/affiliation-fraud';
import { FRAUD_PATTERN_LABEL, type FraudCase, type FraudPattern } from './types';

const PATTERN_TONE: Record<FraudPattern, string> = {
    burst: 'border-lumiris-amber/40 text-lumiris-amber',
    self_booking: 'border-lumiris-rose/40 text-lumiris-rose',
    geo: 'border-lumiris-amber/40 text-lumiris-amber',
    manual: 'border-lumiris-rose/40 text-lumiris-rose',
};

interface FraudCaseDrawerProps {
    fraudCase: FraudCase | null;
    anonymised: boolean;
    resolved: boolean;
    canAuditLog: boolean;
    onClose: () => void;
    onFlag: () => void;
    onResolve: () => void;
    onAnonymise: () => void;
}

export function FraudCaseDrawer({
    fraudCase,
    anonymised,
    resolved,
    canAuditLog,
    onClose,
    onFlag,
    onResolve,
    onAnonymise,
}: FraudCaseDrawerProps) {
    if (!fraudCase) {
        return <DetailDrawer open={false} onOpenChange={onClose} title="" />;
    }
    const { event, flag, pattern } = fraudCase;
    const userLabel = anonymised ? anonymiseUserId(`${event.userId}_forced`, '1970-01-01') : event.userId;

    const detailContent = (
        <div className="flex flex-col gap-4">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                <Field label="ID événement" value={event.id} mono />
                <Field
                    label="Pattern"
                    value={
                        <Badge variant="outline" className={cn('font-mono text-[10px]', PATTERN_TONE[pattern])}>
                            {FRAUD_PATTERN_LABEL[pattern]}
                        </Badge>
                    }
                />
                <Field label="Utilisateur" value={userLabel} mono />
                <Field
                    label="Bénéficiaire"
                    value={
                        <>
                            <p className="text-foreground text-sm">{event.beneficiaryDisplayName}</p>
                            <p className="text-muted-foreground text-[10px]">{event.beneficiaryId}</p>
                        </>
                    }
                />
                <Field label="Date" value={new Date(event.occurredAt).toLocaleString('fr-FR')} mono />
                <Field label="Montant" value={`${event.commission.amountEur.toFixed(2)} €`} mono />
            </dl>

            <div className="flex flex-wrap items-center gap-2">
                {!event.flaggedAsFraud && canAuditLog ? (
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={onFlag}>
                        <Flag className="h-3 w-3" /> Marquer frauduleux
                    </Button>
                ) : null}
                {!resolved ? (
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={onResolve}>
                        <BadgeCheck className="h-3 w-3" /> Marquer résolu
                    </Button>
                ) : null}
                {!anonymised ? (
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={onAnonymise}>
                        <ShieldOff className="h-3 w-3" /> Anonymiser
                    </Button>
                ) : null}
            </div>
        </div>
    );

    return (
        <DetailDrawer
            open
            onOpenChange={(o) => !o && onClose()}
            title={`Cas ${event.id}`}
            subtitle={`${FRAUD_PATTERN_LABEL[pattern]} · ${event.beneficiaryDisplayName}`}
            tabs={[
                { value: 'detail', label: 'Détail', content: detailContent },
                { value: 'map', label: 'Suspicion map', content: <SuspicionMap flag={flag} /> },
            ]}
            width="md"
        />
    );
}

function Field({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
    return (
        <div>
            <dt className="text-muted-foreground text-[10px] uppercase tracking-wider">{label}</dt>
            <dd className={cn('text-foreground mt-0.5', mono ? 'font-mono' : '')}>{value}</dd>
        </div>
    );
}

function SuspicionMap({ flag }: { flag: SuspiciousFlag }) {
    const items: Array<{ Icon: typeof MapPin; label: string; value: string; tone: string }> = [];
    if (flag.burst) {
        items.push({
            Icon: AlertTriangle,
            label: 'Pic d’activité',
            value: `${flag.burst.count} événements en ${flag.burst.windowMinutes} min`,
            tone: 'text-lumiris-amber',
        });
    }
    if (flag.selfBooking) {
        items.push({
            Icon: Flag,
            label: 'Auto-réservation',
            value: 'L’utilisateur et le bénéficiaire sont la même identité.',
            tone: 'text-lumiris-rose',
        });
    }
    if (flag.geo) {
        items.push({
            Icon: MapPin,
            label: 'Géo incohérente',
            value: `${flag.geo.distanceKm} km parcourus en < 1 h pour le même userId.`,
            tone: 'text-lumiris-amber',
        });
    }
    if (items.length === 0) {
        return <p className="text-muted-foreground text-xs italic">Aucun signal géo/temporel sur ce cas.</p>;
    }
    return (
        <ul className="space-y-3 text-xs">
            {items.map((item) => (
                <li key={item.label} className="border-border bg-card flex items-start gap-3 rounded-lg border p-3">
                    <item.Icon className={cn('mt-0.5 h-4 w-4 shrink-0', item.tone)} aria-hidden />
                    <div>
                        <p className="text-foreground text-[11px] font-semibold">{item.label}</p>
                        <p className="text-muted-foreground mt-0.5 text-[11px]">{item.value}</p>
                    </div>
                </li>
            ))}
        </ul>
    );
}
