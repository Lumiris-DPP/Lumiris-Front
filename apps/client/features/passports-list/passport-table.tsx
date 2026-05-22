'use client';

import Link from 'next/link';
import type { Passport, ScoreResult } from '@lumiris/types';
import { Card, CardContent } from '@lumiris/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { AtelierStatusBadge, IrisGrade } from '@lumiris/scoring-ui';
import { RowActions } from './row-actions';

export interface ScoredRow {
    passport: Passport;
    score: ScoreResult;
}

interface PassportTableProps {
    rows: readonly ScoredRow[];
    onShowQr: (passport: Passport) => void;
    onDuplicate: (passport: Passport) => void;
    onPreview: (id: string) => void;
    onDelete: (passport: Passport) => void;
}

export function PassportTable({ rows, onShowQr, onDuplicate, onPreview, onDelete }: PassportTableProps) {
    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Référence produit</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Mise à jour</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-muted-foreground py-12 text-center text-sm">
                                    Aucun passeport pour ces filtres.
                                </TableCell>
                            </TableRow>
                        )}
                        {rows.map(({ passport, score }) => (
                            <TableRow key={passport.id}>
                                <TableCell>
                                    <Link
                                        href={`/passports/${passport.id}`}
                                        className="text-foreground hover:text-lumiris-emerald block font-medium"
                                    >
                                        {passport.garment.reference || 'Brouillon'}
                                    </Link>
                                    <span className="text-muted-foreground text-xs capitalize">
                                        {passport.garment.kind}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <IrisGrade grade={score.grade} size="sm" />
                                </TableCell>
                                <TableCell>
                                    <AtelierStatusBadge status={passport.status} />
                                </TableCell>
                                <TableCell className="text-muted-foreground text-xs">
                                    {new Date(passport.updatedAt).toLocaleDateString('fr-FR')}
                                </TableCell>
                                <TableCell className="text-right">
                                    <RowActions
                                        passport={passport}
                                        onShowQr={() => onShowQr(passport)}
                                        onDuplicate={() => onDuplicate(passport)}
                                        onPreview={() => onPreview(passport.id)}
                                        onDelete={() => onDelete(passport)}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
