'use client';

import Link from 'next/link';
import { ArrowRight, FileText } from 'lucide-react';
import type { DashboardRecentPassport } from '@lumiris/api-client';
import type { IrisGrade as IrisGradeLetter } from '@lumiris/types';
import { Button } from '@lumiris/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@lumiris/ui/components/card';
import { AtelierStatusBadge, IrisGrade } from '@lumiris/scoring-ui';
import { formatDateFr } from '@lumiris/utils';
import { passportStatusFromDpp } from '@/lib/passport-adapter';

export function RecentPassports({ items }: { items: readonly DashboardRecentPassport[] }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Derniers passeports</CardTitle>
                    <p className="text-xs text-muted-foreground">5 plus récemment modifiés</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/passports">
                        Tout voir <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent className="divide-y divide-border">
                {items.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                        <FileText className="mx-auto mb-2 h-6 w-6 opacity-40" />
                        Aucun passeport - démarrez par la création.
                    </p>
                ) : (
                    items.map((item) => (
                        <Link
                            key={item.id}
                            href={`/passports/${item.id}`}
                            className="-mx-3 flex items-center gap-4 rounded-md px-3 py-3 transition-colors hover:bg-muted/50"
                        >
                            {item.grade ? (
                                <IrisGrade grade={item.grade as IrisGradeLetter} size="sm" />
                            ) : (
                                <span className="w-6 text-center text-xs text-muted-foreground">-</span>
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-foreground">
                                    {item.productName || 'Brouillon sans référence'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {item.updatedAt ? `Modifié le ${formatDateFr(item.updatedAt)}` : 'Jamais modifié'}
                                </p>
                            </div>
                            <AtelierStatusBadge status={passportStatusFromDpp(item.status)} />
                            <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
                                {item.score.toFixed(1)}/100
                            </span>
                        </Link>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
