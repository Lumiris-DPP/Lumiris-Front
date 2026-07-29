'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Button } from '@lumiris/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@lumiris/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import type { AtelierStatsPassportBreakdown } from '@lumiris/api-client';

interface Props {
    rows: AtelierStatsPassportBreakdown[];
    locked: boolean;
}

const PLACEHOLDER_ROWS: AtelierStatsPassportBreakdown[] = [
    {
        dppFormId: '1',
        publicCode: '••••••••',
        productName: 'Pièce exemple',
        scans: 42,
        views: 31,
        suggestionClicks: 8,
        conversions: 3,
    },
    {
        dppFormId: '2',
        publicCode: '••••••••',
        productName: 'Pièce exemple',
        scans: 27,
        views: 19,
        suggestionClicks: 4,
        conversions: 1,
    },
];

export function StatsByPassport({ rows, locked }: Props) {
    const displayRows = locked ? PLACEHOLDER_ROWS : rows;

    return (
        <section className="space-y-4">
            <header>
                <h2 className="text-lg font-semibold tracking-tight text-foreground">Détail par passeport</h2>
                <p className="text-xs text-muted-foreground">Réservé aux abonnés ATELIER+.</p>
            </header>

            <div className="relative">
                <Card className={locked ? 'pointer-events-none blur-sm select-none' : undefined}>
                    <CardHeader>
                        <CardTitle className="text-base">Par passeport</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Référence</TableHead>
                                    <TableHead className="text-right">Scans</TableHead>
                                    <TableHead className="text-right">Vues</TableHead>
                                    <TableHead className="text-right">Clics suggestion</TableHead>
                                    <TableHead className="text-right">Conversions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {displayRows.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="py-10 text-center text-sm text-muted-foreground"
                                        >
                                            Aucune donnée sur cette période.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {displayRows.map((row) => (
                                    <TableRow key={row.dppFormId}>
                                        <TableCell>
                                            <span className="font-medium text-foreground">
                                                {row.productName ?? row.publicCode}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">{row.scans}</TableCell>
                                        <TableCell className="text-right font-mono">{row.views}</TableCell>
                                        <TableCell className="text-right font-mono">{row.suggestionClicks}</TableCell>
                                        <TableCell className="text-right font-mono">{row.conversions}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {locked ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Card className="max-w-sm shadow-lg">
                            <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lumiris-amber/10 text-lumiris-amber">
                                    <Lock className="h-4 w-4" />
                                </div>
                                <p className="text-sm font-semibold text-foreground">
                                    Détail par passeport réservé à ATELIER+
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Passez à ATELIER+ pour voir la performance passeport par passeport.
                                </p>
                                <Button
                                    asChild
                                    size="sm"
                                    className="bg-lumiris-emerald text-white hover:bg-lumiris-emerald/90"
                                >
                                    <Link href="/subscription?upsell=analytics">Activer ATELIER+</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                ) : null}
            </div>
        </section>
    );
}
