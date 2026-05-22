'use client';

import Link from 'next/link';
import { AlertCircle, BarChart3, Clock, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@lumiris/ui/components/card';
import { Progress } from '@lumiris/ui/components/progress';
import type { ExpiringCertificate, QuotaUsage, ScoredPassport } from './derive';

interface AttentionBlockProps {
    expiring: readonly ExpiringCertificate[];
    incomplete: readonly ScoredPassport[];
    quota: QuotaUsage;
    esprWindowOpen?: boolean;
    publishedCount?: number;
}

export function AttentionBlock({
    expiring,
    incomplete,
    quota,
    esprWindowOpen,
    publishedCount = 0,
}: AttentionBlockProps) {
    const unlimited = !Number.isFinite(quota.total);
    const totalLabel = unlimited ? '∞' : quota.total.toString();
    const overThreshold = quota.percent > 80;

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">À traiter</CardTitle>
            </CardHeader>
            <CardContent className="divide-border divide-y">
                <Row
                    icon={<Clock className="h-4 w-4 text-amber-500" />}
                    label="Certifs qui expirent"
                    count={expiring.length}
                    href="/certifications"
                    emptyLabel="aucune"
                />
                <Row
                    icon={<AlertCircle className="h-4 w-4 text-orange-500" />}
                    label="Passeports incomplets"
                    count={incomplete.length}
                    href="/passports"
                    emptyLabel="aucun"
                />
                <div className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-cyan-500" />
                        <span className="text-foreground text-sm">Quota du plan</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="font-mono text-xs tabular-nums">
                            {quota.used} / {totalLabel}
                        </span>
                        {!unlimited && <Progress value={Math.min(100, quota.percent)} className="h-1.5 w-24" />}
                        {overThreshold && (
                            <Link href="/subscription" className="text-lumiris-emerald text-xs hover:underline">
                                Mettre à niveau →
                            </Link>
                        )}
                    </div>
                </div>
                {esprWindowOpen && (
                    <div className="flex items-center gap-2 py-2.5">
                        <ShieldCheck className="text-lumiris-emerald h-4 w-4" />
                        <span className="text-foreground text-sm">
                            ESPR — DPP textile obligatoire mi-2028. {publishedCount} passeport
                            {publishedCount > 1 ? 's' : ''} prêt{publishedCount > 1 ? 's' : ''}.
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

interface RowProps {
    icon: React.ReactNode;
    label: string;
    count: number;
    href: string;
    emptyLabel: string;
}

function Row({ icon, label, count, href, emptyLabel }: RowProps) {
    return (
        <Link
            href={href}
            className="hover:bg-muted/40 -mx-2 flex items-center justify-between rounded-md px-2 py-2.5 transition-colors"
        >
            <div className="flex items-center gap-2">
                {icon}
                <span className="text-foreground text-sm">{label}</span>
            </div>
            <span
                className={
                    count === 0 ? 'text-muted-foreground text-xs' : 'text-foreground font-mono text-sm font-medium'
                }
            >
                {count === 0 ? emptyLabel : count}
            </span>
        </Link>
    );
}
