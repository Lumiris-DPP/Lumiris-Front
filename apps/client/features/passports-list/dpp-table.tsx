'use client';

import { useRouter } from 'next/navigation';
import type { DppFormSummaryDto } from '@/lib/dpp-api';
import { Badge } from '@lumiris/ui/components/badge';
import { Card, CardContent } from '@lumiris/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';

interface DppTableProps {
    rows: DppFormSummaryDto[];
}

const CATEGORY_LABELS: Record<string, string> = {
    top: 'Haut',
    bottom: 'Bas',
    dress: 'Robe',
    outerwear: 'Manteau',
    shoe: 'Chaussure',
    accessory: 'Accessoire',
    other: 'Autre',
};

export function DppTable({ rows }: DppTableProps) {
    const router = useRouter();

    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom du produit</TableHead>
                            <TableHead>Catégorie</TableHead>
                            <TableHead>Créé le</TableHead>
                            <TableHead>Statut</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-muted-foreground py-12 text-center text-sm">
                                    Aucun DPP trouvé.
                                </TableCell>
                            </TableRow>
                        )}
                        {rows.map((dpp) => (
                            <TableRow
                                key={dpp.id}
                                className="cursor-pointer"
                                onClick={() => router.push(`/passports/${dpp.id}`)}
                            >
                                <TableCell>
                                    <p className="font-medium">{dpp.productName ?? 'Sans nom'}</p>
                                    {dpp.sku && <p className="text-muted-foreground font-mono text-xs">{dpp.sku}</p>}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {CATEGORY_LABELS[dpp.productCategory ?? ''] ?? dpp.productCategory ?? '—'}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-xs">
                                    {new Date(dpp.createdAt).toLocaleDateString('fr-FR')}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={dpp.status === 'VALID' ? 'default' : 'destructive'}>
                                        {dpp.status === 'VALID' ? 'Valide' : 'Invalide'}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
