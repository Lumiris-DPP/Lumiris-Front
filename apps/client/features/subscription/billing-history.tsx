'use client';

import { Receipt } from 'lucide-react';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@lumiris/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';

interface BillingEntry {
    id: string;
    date: string;
    plan: string;
    amount: number;
    status: string;
}

export function BillingHistory({ entries }: { entries: readonly BillingEntry[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Receipt className="text-muted-foreground h-4 w-4" />
                    Historique de facturation
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead className="text-right">Montant</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Reçu</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {entries.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-muted-foreground py-10 text-center text-sm">
                                    Aucune facture pour le moment.
                                </TableCell>
                            </TableRow>
                        )}
                        {entries.slice(0, 24).map((entry) => (
                            <TableRow key={entry.id}>
                                <TableCell className="text-muted-foreground font-mono text-xs">
                                    {new Date(entry.date).toLocaleDateString('fr-FR')}
                                </TableCell>
                                <TableCell>{entry.plan}</TableCell>
                                <TableCell className="text-right font-mono">{entry.amount} €</TableCell>
                                <TableCell>
                                    <Badge className="bg-lumiris-emerald/10 text-lumiris-emerald border-lumiris-emerald/30">
                                        {entry.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => window.open(`/print/receipt/${entry.id}`, '_blank', 'noopener')}
                                    >
                                        Reçu
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
