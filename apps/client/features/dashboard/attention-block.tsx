'use client';

import Link from 'next/link';
import { AlertCircle, BarChart3, Clock, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@lumiris/ui/components/card';
import { Progress } from '@lumiris/ui/components/progress';

interface AttentionBlockProps {
    expiringCertificates: number;
    incomplete: number;
    quotaUsed: number;
    quotaLimit: number | null;
    quotaPercent: number;
    esprWindowOpen: boolean;
    publishedCount: number;
}

export function AttentionBlock({
    expiringCertificates,
    incomplete,
    quotaUsed,
    quotaLimit,
    quotaPercent,
    esprWindowOpen,
    publishedCount,
}: AttentionBlockProps) {
    const unlimited = quotaLimit === null;
    const totalLabel = unlimited ? '∞' : String(quotaLimit);

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">À traiter</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border">
                <Row
                    icon={<Clock className="h-4 w-4 text-lumiris-amber" />}
                    label="Certifs qui expirent"
                    count={expiringCertificates}
                    href="/certifications"
                    emptyLabel="aucune"
                />
                <Row
                    icon={<AlertCircle className="h-4 w-4 text-lumiris-amber" />}
                    label="Passeports incomplets"
                    count={incomplete}
                    href="/passports"
                    emptyLabel="aucun"
                />
                <div className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-lumiris-cyan" />
                        <span className="text-sm text-foreground">Quota du plan</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="font-mono text-xs tabular-nums">
                            {quotaUsed} / {totalLabel}
                        </span>
                        {!unlimited && <Progress value={Math.min(100, quotaPercent)} className="h-1.5 w-24" />}
                        {quotaPercent > 80 && (
                            <Link href="/subscription" className="text-xs text-lumiris-cyan hover:underline">
                                Mettre à niveau →
                            </Link>
                        )}
                    </div>
                </div>
                {esprWindowOpen && (
                    <div className="flex items-center gap-2 py-2.5">
                        <ShieldCheck className="h-4 w-4 text-lumiris-cyan" />
                        <span className="text-sm text-foreground">
                            ESPR — DPP textile obligatoire mi-2028. {publishedCount} passeport(s)
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
            className="-mx-2 flex items-center justify-between rounded-md px-2 py-2.5 transition-colors hover:bg-muted/40"
        >
            <div className="flex items-center gap-2">
                {icon}
                <span className="text-sm text-foreground">{label}</span>
            </div>
            <span
                className={
                    count === 0 ? 'text-xs text-muted-foreground' : 'font-mono text-sm font-medium text-foreground'
                }
            >
                {count === 0 ? emptyLabel : count}
            </span>
        </Link>
    );
}
